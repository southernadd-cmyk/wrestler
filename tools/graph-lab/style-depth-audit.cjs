#!/usr/bin/env node
'use strict';
// Read-only OfficeMatch depth audit: Technical, Brawl and Story.
const lab=require('./core.js'),review=require('./match-review.cjs');
const PLANS=['story','technical','brawl','spots','safe'];
const LENGTHS=[8,12,18];
const TIERS=[{id:'novice',ring:50,safe:45,psych:52},{id:'competent',ring:73,safe:68,psych:70},{id:'elite',ring:92,safe:91,psych:84}];
const OPPONENTS=[{id:'ace',style:'Spectacle'},{id:'silas',style:'Technical'},{id:'red',style:'Brawl'},{id:'rev',style:'Story'}];
const STYLES=[
 {id:'Technical',worker:'juno',real:['juno','dee','imani','ezra'],promoter:'union',opponent:'nova'},
 {id:'Brawl',worker:'rex',real:['rex','brick','val','otis'],promoter:'dock',opponent:'red'},
 {id:'Story',worker:'sol',real:['sol','mara','dax','roxy'],promoter:'crown',opponent:'roxy'}];
const SPECIAL={
 Technical:new Set(['chain','submission','suplex','ground','rest','neck','pin']),
 Brawl:new Set(['strike','running','power','outside','ringside','corner','rope']),
 Story:new Set(['chain','submission','suplex','ground','rest','neck','pin','strike','running','power','outside','ringside','corner','rope','lucha'])};
const round=(v,d=2)=>+Number(v).toFixed(d);
const pct=(v,n)=>n?round(100*v/n,1):0;
function fresh(){return {n:0,stars:[],earlyQ:0,earlyN:0,lateQ:0,lateN:0,stamina:0,
 botch:0,injury:0,crowd:0,near:0,earned:0,exhausted:0,unique:0,repeat:0,
 workerMoves:0,special:0,specialUnique:0,late:0,lateUnique:0,lateAny:0,lateTwo:0,
 arcs:0,lateArcs:0,grapple:0,grappleLanded:0,grappleCounter:0,
 strike:0,strikeLanded:0,strikeCounter:0,contact:0,contactLanded:0,
 families:{},arcHits:{},moves:{},starParts:{}};}
function collect(s,m,M,style){
 const A=M.GRAPH.A,events=m.graph?.events||[];
 const landed=e=>!A[e.id]?.counterOf&&!A[e.id]?.blockOf&&!A[e.id]?.reverse&&
 ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
 .every(k=>!e[k]||e[k]==='landed');
 const worker=events.filter(e=>e.preControl==='w'&&A[e.id]&&landed(e));
 const special=worker.filter(e=>SPECIAL[style].has(A[e.id].family));
 const late=special.filter(e=>e.t>=m.len-180);
 s.n++;s.stars.push(m.final.stars);s.stamina+=m.wSt;s.exhausted+=m.wSt<25;
 s.botch+=m.botches||0;s.injury+=m.final?.injury>0;s.crowd+=m.crowdPeak||0;
 s.near+=m.nearfalls||0;s.earned+=M._earnedPlanQuality(m);
 s.workerMoves+=worker.length;s.unique+=new Set(worker.map(e=>e.id)).size;
 s.special+=special.length;s.specialUnique+=new Set(special.map(e=>e.id)).size;
 s.late+=late.length;s.lateUnique+=new Set(late.map(e=>e.id)).size;
 s.lateAny+=late.length>0;s.lateTwo+=new Set(late.map(e=>e.id)).size>=2;
 s.arcs+=new Set(worker.map(e=>e.arc).filter(Boolean)).size;
 s.lateArcs+=new Set(worker.filter(e=>e.t>=m.len-180).map(e=>e.arc).filter(Boolean)).size;
 for(const e of worker){
  const family=A[e.id].family||'core',arc=e.arc||'(none)';
  s.families[family]=(s.families[family]||0)+1;
  s.arcHits[arc]=(s.arcHits[arc]||0)+1;
  s.moves[e.id]=(s.moves[e.id]||0)+1;
 }
 for(const [field,prefix] of [['grappleAttempts','grapple'],['strikeAttempts','strike'],['contactAttempts','contact']]){
  const attempts=(m.graph?.[field]||[]).filter(x=>x.side==='w');
  s[prefix]+=attempts.length;
  s[prefix+'Landed']+=attempts.filter(x=>x.outcome==='landed').length;
  if(prefix!=='contact')s[prefix+'Counter']+=attempts.filter(x=>x.outcome==='counter').length;
 }
 for(const tick of m.flow||[]){
  if(tick[0]<m.len*.35){s.earlyQ+=tick[4];s.earlyN++;}
  else if(tick[0]>=m.len*.65){s.lateQ+=tick[4];s.lateN++;}
 }
 for(const [key,,v] of m.final.starParts||[])s.starParts[key]=(s.starParts[key]||0)+v;
 const lines={};for(const l of m.log||[])if(l.text?.length>15)
  lines[l.text]=(lines[l.text]||0)+1;
 s.repeat+=Object.values(lines).filter(v=>v>=3).length;
}
function output(id,s,meta={}){
 if(!s.n)throw Error('Empty matched group '+id);
 const mean=v=>round(v/s.n),top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
 .slice(0,8).map(([id,total])=>({id,perMatch:mean(total)}));
 return {id,...meta,matches:s.n,stars:mean(s.stars.reduce((a,b)=>a+b,0)),
 p90:round(s.stars.slice().sort((a,b)=>a-b)[Math.floor(.9*(s.n-1))]),
 fourStarPct:pct(s.stars.filter(x=>x>=4).length,s.n),
 fourHalfStarPct:pct(s.stars.filter(x=>x>=4.5).length,s.n),
 earlyQ:round(s.earlyQ/s.earlyN),lateQ:round(s.lateQ/s.lateN),
 stamina:mean(s.stamina),exhaustedPct:pct(s.exhausted,s.n),
 botchesPerMatch:mean(s.botch),injuryPct:pct(s.injury,s.n),
 crowd:mean(s.crowd),nearfalls:mean(s.near),earnedAtBell:mean(s.earned),
 workerMoves:mean(s.workerMoves),distinctMoves:mean(s.unique),
 specialityMoves:mean(s.special),distinctSpeciality:mean(s.specialUnique),
 lateSpeciality:mean(s.late),lateDistinct:mean(s.lateUnique),
 lateAnyPct:pct(s.lateAny,s.n),lateTwoPct:pct(s.lateTwo,s.n),
 distinctArcs:mean(s.arcs),distinctLateArcs:mean(s.lateArcs),
 grappleAttempts:mean(s.grapple),grappleLanded:mean(s.grappleLanded),grappleCounter:mean(s.grappleCounter),
 strikeAttempts:mean(s.strike),strikeLanded:mean(s.strikeLanded),strikeCounter:mean(s.strikeCounter),
 contactAttempts:mean(s.contact),contactLanded:mean(s.contactLanded),
 repeatedLines:mean(s.repeat),families:top(s.families),arcs:top(s.arcHits),actions:top(s.moves),
 starParts:Object.fromEntries(Object.entries(s.starParts).map(([k,v])=>[k,mean(v)]))};
}
function capture(n=6,selected=STYLES.map(s=>s.id)){
 if(!Number.isInteger(n)||n<1||n>12)throw Error('Expected 1..12 seeds');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,people=lab.roster(D);
 const byId=new Map(people.map(w=>[w.id,w]));
 const chosen=STYLES.filter(s=>selected.includes(s.id));
 if(!chosen.length||chosen.length!==new Set(selected).size)throw Error('Invalid style selection');
 const styles=[];let totalMatches=0;
 for(const spec of chosen){
  if(byId.get(spec.worker)?.style!==spec.id||
     spec.real.some(id=>byId.get(id)?.style!==spec.id))
   throw Error('Fixture style mismatch: '+spec.id);
  const matrices=[new Map(),new Map(),new Map(),new Map(),new Map()];
  const cell=(index,key)=>{const m=matrices[index];if(!m.has(key))m.set(key,fresh());return m.get(key);};
  function run(input,mods,targets){
   const opt=lab.makeOptions(D,input);opt.minutes=input.minutes;
   if(mods){opt.w={...opt.w,...mods.w};if(mods.f)opt.f={...opt.f,...mods.f};
    if(mods.feudHeat!==undefined)opt.feudHeat=mods.feudHeat;
    if(mods.preparation)opt.preparation=mods.preparation;}
   if(opt.w.id===opt.f.id)throw Error('Self fixture '+opt.w.id);
   const m=lab.runMatch(root,opt);
   for(const bucket of targets)collect(bucket,m,M,spec.id);
   totalMatches++;
  }
  for(const tier of TIERS)for(let j=0;j<OPPONENTS.length;j++)
   for(const minutes of LENGTHS)for(let i=0;i<n;i++){
    const fixed={wid:spec.worker,rid:OPPONENTS[j].id,minutes,
      seed:880041+j*7919+minutes*9191+i*193,
      promotion:D.PROMOS[(j+minutes+i)%D.PROMOS.length].id,
      slot:'main',finish:i%2?'lose_clean':'win_clean'};
    for(const plan of PLANS){
     const targets=[cell(0,tier.id+'/'+plan)];
     if(plan===D.STYLE_PLAN[spec.id]){
      targets.push(cell(1,tier.id+'/'+minutes));
      targets.push(cell(2,tier.id+'/'+OPPONENTS[j].style));
     }
     run({...fixed,plan},{w:{ring:tier.ring,safe:tier.safe,psych:tier.psych,
      heat:65,fatigue:4,pro:78}},targets);
    }
   }
  for(const wid of spec.real)for(let i=0;i<2*n;i++){
   const oi=(i+spec.real.indexOf(wid))%OPPONENTS.length;
   const rid=OPPONENTS[oi].id===wid?OPPONENTS[(oi+1)%OPPONENTS.length].id:OPPONENTS[oi].id;
   const fixed={wid,rid,minutes:12,slot:'main',seed:771109+i*313,
    promotion:D.PROMOS[i%D.PROMOS.length].id,finish:i%2?'lose_clean':'win_clean'};
   for(const plan of PLANS)run({...fixed,plan},null,[cell(3,wid+'/'+plan)]);
  }
  for(let i=0;i<10*n;i++){
   const fixed={wid:spec.worker,rid:spec.opponent,minutes:20,
    slot:'main',seed:990071+i*137,finish:i%2?'lose_clean':'win_clean',
    promotion:spec.promoter};
   for(const plan of PLANS)run({...fixed,plan},
    {w:{ring:94,safe:93,psych:90,heat:90,fatigue:0,pro:92},
     f:{ring:88,safe:91,psych:85,heat:83},feudHeat:70,
     preparation:{ring:3,safe:3,psych:3}},[cell(4,plan)]);
  }
  const rows=(index,meta)=>[...matrices[index].entries()].map(([id,s])=>output(id,s,meta(id)));
  styles.push({style:spec.id,worker:spec.worker,real:spec.real,nativePlan:D.STYLE_PLAN[spec.id],
   matchedGroups:36*n,matrix:rows(0,id=>{const [tier,plan]=id.split('/');return {tier,plan};}),
   lengths:rows(1,id=>{const [tier,minutes]=id.split('/');return {tier,minutes:Number(minutes)};}),
   opponents:rows(2,id=>{const [tier,opponent]=id.split('/');return {tier,opponent};}),
   realRows:rows(3,id=>{const [wid,plan]=id.split('/');return {wid,plan,name:byId.get(wid).name};}),
   headliners:rows(4,id=>({plan:id}))});
 }
 return {schema:'office-style-depth-v1',n,totalMatches,plans:PLANS,tiers:TIERS,
  note:'The real OfficeMatch engine was simulated with paired opponent/seed/finish/promotion/duration/slot. Synthetic skill edits leave style/profile/size unchanged; opponents are not skill-normalised. Favourable headliners are ceilings, not normal expected ratings.',
  styles};
}
function failures(r){
 const errors=[],expected=r.styles.length*(3*4*3*r.n*5+4*2*r.n*5+10*r.n*5);
 if(r.totalMatches!==expected)errors.push('Incomplete matches');
 for(const s of r.styles){
  if(s.matchedGroups!==36*r.n||s.matrix.length!==15||s.lengths.length!==9||
   s.opponents.length!==12||s.realRows.length!==20||s.headliners.length!==5)
   errors.push('Incomplete '+s.style+' matrix');
  for(const a of [...s.matrix,...s.lengths,...s.opponents,...s.realRows,...s.headliners]){
   if(!Number.isFinite(a.stars)||a.stars<0||a.stars>5||!Number.isFinite(a.lateQ)||
    a.fourHalfStarPct>a.fourStarPct||a.grappleLanded>a.grappleAttempts||
    a.strikeLanded>a.strikeAttempts||a.contactLanded>a.contactAttempts)
    errors.push('Invalid measurements '+s.style+'/'+a.id);
  }
 }
 return errors;
}
function markdown(r){
 const out=['## The Office — non-flyer style depth audit','',r.totalMatches+
  ' actual OfficeMatch simulations; five match plans, three skill tiers, four opponents, 8/12/18-minute matches, real roster controls and optimistic 20-minute headliners.','',r.note,''];
 for(const s of r.styles){
  out.push('### '+s.style+' — five-plan matched skill treatments','',
   '| Tier | Plan | Mean ★ | P90 ★ | 4★+ | Early Q | Late Q | Stamina | Exhausted | Botches | Specialist/bout | Late distinct | ≥1 late | Repeated lines |',
   '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for(const a of s.matrix)out.push('| '+a.tier+' | '+a.plan+' | '+a.stars+' | '+a.p90+
   ' | '+a.fourStarPct+'% | '+a.earlyQ+' | '+a.lateQ+' | '+a.stamina+
   ' | '+a.exhaustedPct+'% | '+a.botchesPerMatch+' | '+a.specialityMoves+
   ' | '+a.lateDistinct+' | '+a.lateAnyPct+'% | '+a.repeatedLines+' |');
  out.push('','#### '+s.nativePlan+' plan, by duration','',
   '| Tier | Minutes | ★ | Late Q | Bell stamina | Specialist/bout | Late distinct | ≥2 late | Grapple landed | Strike landed | Distinct arcs |',
   '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for(const a of s.lengths)out.push('| '+a.tier+' | '+a.minutes+' | '+a.stars+
   ' | '+a.lateQ+' | '+a.stamina+' | '+a.specialityMoves+' | '+a.lateDistinct+
   ' | '+a.lateTwoPct+'% | '+a.grappleLanded+' | '+a.strikeLanded+' | '+a.distinctArcs+' |');
  out.push('','#### Real unmodified '+s.style+' wrestlers, 12 minutes','',
   '| Worker | Native plan ★ | Highest scoring plan | Native late Q | Specialist/bout |',
   '|---|---:|---|---:|---:|');
  for(const wid of s.real){
   const rows=s.realRows.filter(x=>x.wid===wid),native=rows.find(x=>x.plan===s.nativePlan),
    best=rows.slice().sort((a,b)=>b.stars-a.stars)[0];
   out.push('| '+native.name+' | '+native.stars+' | '+best.plan+' ('+best.stars+
    ') | '+native.lateQ+' | '+native.specialityMoves+' |');
  }
  out.push('','#### Favourable elite headliner, 20 minutes','',
   '| Plan | Mean ★ | 4★+ | Bell stamina | Late distinct | Repeated lines |',
   '|---|---:|---:|---:|---:|---:|');
  for(const a of s.headliners)out.push('| '+a.plan+' | '+a.stars+' | '+a.fourStarPct+
   '% | '+a.stamina+' | '+a.lateDistinct+' | '+a.repeatedLines+' |');
  const elite=s.matrix.find(x=>x.tier==='elite'&&x.plan===s.nativePlan);
  out.push('','**Elite native plan:** landed move families '+
   elite.families.map(x=>x.id+' '+x.perMatch+'/bout').join(', ')+
   '; observed arcs '+elite.arcs.map(x=>x.id+' '+x.perMatch+'/bout').join(', ')+'.','');
 }
 out.push('**Checks:** '+(failures(r).length?'FAILED '+failures(r).join('; '):
 'PASS — paired cohorts and attempt ledgers consistent')+'.');
 return out.join('\n');
}
if(require.main===module){
 try{const r=capture(process.argv[2]?Number(process.argv[2]):6);
  if(process.argv.includes('--json-file'))
   require('node:fs').writeFileSync('style-depth-audit.json',JSON.stringify(r,null,2)+'\n');
  console.log(process.argv.includes('--json')?JSON.stringify(r,null,2):markdown(r));
  if(failures(r).length)process.exitCode=1;
 }catch(e){console.error(e.stack);process.exitCode=1;}
}
module.exports={capture,failures,markdown,PLANS,TIERS,STYLES,LENGTHS};
