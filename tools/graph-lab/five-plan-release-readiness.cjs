#!/usr/bin/env node
'use strict';
// Read-only release-readiness audit for all FIVE match plans (Safe is not a wrestler style).
// Uses the shipped OfficeMatch engine. Neither career saves nor match code are changed.
const lab=require('./core.js'),review=require('./match-review.cjs');
const WORKERS=[['brick','Brawl','brawl'],['ezra','Technical','technical'],
 ['sol','Story','story'],['nico','Spectacle','spots']];
const OPP=['ace','silas','red','rev'],PLANS=['safe','technical','story','brawl','spots'];
const TIERS=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const LENGTHS=[8,12,18];
const SAFE_COVERS=new Set(['arm_drag','grapple_trip','mat_takedown','headlock_takeover','hip_toss','shoulder_tackle']);
const DEFENCE=['aerialResolution','grappleResolution','strikeResolution','contactResolution'];
const round=n=>Math.round(n*100)/100;
const average=(x,n)=>round(x/Math.max(1,n));
const top=(o,k)=>Object.entries(o).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,k)
 .map(([name,count])=>({name,count}));
const fresh=()=>({n:0,stars:0,stamina:0,exhausted:0,botches:0,injuries:0,near:0,bad:0,
 booked:0,extremeSafe:0,risk:0,scripted:0,earlyQ:0,earlyN:0,lateQ:0,lateN:0,
 distinct:0,lateDistinct:0,named:0,lateNamed:0,lateAnyNamed:0,lateAttack:0,
 finalMinute:0,finishGap:0,repeated:0,grappleLanded:0,
 lines:{},topMoves:{},riskMoves:{},examples:[]});
const valid=e=>!e.reverse&&!e.counterOf&&!e.blockOf&&
 DEFENCE.every(k=>!e[k]||e[k]==='landed');
function capture(seeds=2,realSeeds=6){
 if(!Number.isSafeInteger(seeds)||seeds<1||seeds>8||
    !Number.isSafeInteger(realSeeds)||realSeeds<1||realSeeds>12)
  throw Error('Controlled seeds 1..8 and roster seeds 1..12 required');
 const root=review.load(),D=root.OfficeData,G=root.OfficeMatch.GRAPH,A=G.A;
 const roster=lab.roster(D),byId=new Map(roster.map(w=>[w.id,w]));
 for(const [wid,style] of WORKERS)if(byId.get(wid)?.style!==style)
  throw Error('Original worker fixture changed: '+wid);
 const real=roster.filter(w=>(D.TALENT||[]).some(t=>t.id===w.id));
 if(real.length!==16)throw Error('Unexpected real-roster size: '+real.length);
 const groups=new Map(),evidence=[];
 const cell=key=>{if(!groups.has(key))groups.set(key,fresh());return groups.get(key)};
 let count=0;
 function play(type,style,skill,minutes,plan,o){
  const m=lab.runMatch(root,o),E=m.graph.events,ids=E.filter(e=>A[e.id]&&valid(A[e.id])&&valid(e));
  const own=ids.filter(e=>e.preControl==='w'),late=own.filter(e=>e.t>=m.len-180);
  const named=own.filter(e=>A[e.id].family&&!['rest','pin'].includes(A[e.id].family));
  const lateNamed=late.filter(e=>A[e.id].family&&!['rest','pin'].includes(A[e.id].family));
  const risky=own.filter(e=>A[e.id].risk&&!['top_follow','top_climb','springboard_rise'].includes(e.id));
  const sources=E.filter(e=>e.id==='scheduled_nearfall');
  let invalid=0;
  for(let i=0;i<E.length;i++)if(E[i].id==='scheduled_nearfall'){
   const e=E[i],source=E.slice(0,i).findLast(x=>x.id===e.sourceMove&&x.t===e.sourceT&&
    x.preControl===e.sourceSide&&x.control===e.sourceSide&&x.position==='mat'&&
    x.down!==e.sourceSide&&A[x.id]&&valid(A[x.id])&&valid(x));
   if(!e.earned||!source||e.t-source.t>30||e.sourceSide!==e.control||
      (plan==='safe'&&(!SAFE_COVERS.has(e.sourceMove)||A[e.sourceMove]?.risk)))
    invalid++;
  }
  const namedIds=new Set(lateNamed.map(e=>e.id));
  const excluded=new Set(['stand_reset','catch_breath','top_climb','top_follow',
   'springboard_rise','floor_regroup','roll_inside','corner_break','outside_toss',
   'ramp_approach','apron_stand','rope_run','taunt','crowd_pose','finish_tease',
   'lockup','clean_break','double_down_count','dramatic_sell','rope_crawl',
   'rope_break','cover','near_kickout','mat_scramble','springboard_feint']);
  const lateAttack=new Set(late.filter(e=>!excluded.has(e.id)).map(e=>e.id));
  const last=own.at(-1),gap=last?Math.max(0,m.len-last.t):m.len;
  const lines={};for(const l of m.log||[])if(l.text?.length>18)
   lines[l.text]=(lines[l.text]||0)+1;
  const repeated=Object.entries(lines).filter(([,n])=>n>=3);
  const sample={worker:o.w.id,opponent:o.f.id,plan,skill,minutes,seed:o.seed,
   repeated:repeated.sort((a,b)=>b[1]-a[1]).slice(0,4),
   finish:m.final.finishRoute,stars:m.final.stars,stamina:m.wSt,
   lastMoves:E.slice(-10).map(e=>e.id)};
  const badScript=plan==='safe'?(m.graph.scriptedSpotAttempts||[])
   .filter(a=>a.id!=='ar_elbow_point').length:0;
  const targets=[type+':ALL:'+plan,type+':STYLE:'+style+':'+plan];
  if(type==='matched'){
   targets.push(type+':TIER:'+skill+':'+plan);
   targets.push(type+':LENGTH:'+minutes+':'+plan);
   targets.push(type+':LENGTH_TIER:'+minutes+':'+skill+':'+plan);
  }
  for(const k of targets){
   const s=cell(k);s.n++;s.stars+=m.final.stars;s.stamina+=m.wSt;
   s.exhausted+=Number(m.wSt<25);s.botches+=m.botches||0;
   s.injuries+=Number((m.final.injury||0)>0);s.near+=sources.length;
   s.bad+=invalid;s.booked+=Number(m.graph.outcome?.id===o.finish);
   s.extremeSafe+=badScript;s.risk+=risky.length;
   s.scripted+=(m.graph.scriptedSpotAttempts||[]).length;
   s.distinct+=new Set(own.map(e=>e.id)).size;
   s.lateDistinct+=new Set(late.map(e=>e.id)).size;
   s.named+=named.length;s.lateNamed+=namedIds.size;
   s.lateAnyNamed+=Number(namedIds.size>0);s.lateAttack+=lateAttack.size;
   s.finalMinute+=own.filter(e=>e.t>=m.len-60).length;s.finishGap+=gap;
   s.repeated+=repeated.length;
   s.grappleLanded+=(m.graph.grappleAttempts||[]).filter(x=>x.side==='w'&&x.outcome==='landed').length;
   for(const row of m.flow||[]){
    if(row[0]<m.len*.35){s.earlyQ+=row[4];s.earlyN++;}
    else if(row[0]>=m.len*.65){s.lateQ+=row[4];s.lateN++;}
   }
   for(const [line,n] of repeated)s.lines[line]=(s.lines[line]||0)+n;
   for(const x of named)s.topMoves[x.id]=(s.topMoves[x.id]||0)+1;
   for(const x of risky)s.riskMoves[x.id]=(s.riskMoves[x.id]||0)+1;
   if(repeated.length&&s.examples.length<4)s.examples.push(sample);
  }
  if(repeated.some(x=>x[1]>=5)&&evidence.length<24)evidence.push(sample);
  count++;
 }
 // 4 styles x 3 skill tiers x 3 lengths x 4 opponents x 2 seeds x 5 plans = 1440.
 for(let wi=0;wi<WORKERS.length;wi++)
 for(const [skill,ring,safe,psych] of TIERS)
 for(const minutes of LENGTHS)for(let oi=0;oi<OPP.length;oi++)
 for(let i=0;i<seeds;i++){
  const fixed={wid:WORKERS[wi][0],rid:OPP[oi],minutes,slot:'main',
   seed:720007+wi*80913+oi*8179+minutes*1919+i*347,
   promotion:D.PROMOS[(wi+oi+minutes+i)%4].id,
   finish:i%2?'lose_clean':'win_clean'};
  for(const plan of PLANS){
   const o=lab.makeOptions(D,{...fixed,plan});o.minutes=minutes;
   o.w={...o.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
   play('matched',WORKERS[wi][1],skill,minutes,plan,o);
  }
 }
 // 16 unchanged roster wrestlers x 6 seed rotations x 5 plans = 480.
 for(let wi=0;wi<real.length;wi++)for(let seed=0;seed<realSeeds;seed++){
  const w=real[wi],fixed={wid:w.id,rid:OPP[(wi+seed)%4],minutes:12,
   slot:'main',seed:930011+wi*1307+seed*271,
   finish:seed%2?'lose_clean':'win_clean',
   promotion:D.PROMOS[(wi+seed)%4].id};
  for(const plan of PLANS){
   const o=lab.makeOptions(D,{...fixed,plan});o.minutes=12;
   play('real',w.style,'real',12,plan,o);
  }
 }
 function summary(s){
  return {n:s.n,stars:average(s.stars,s.n),
   risk:average(s.risk,s.n),scripted:average(s.scripted,s.n),
   stamina:average(s.stamina,s.n),exhaustedPct:average(s.exhausted*100,s.n),
   botches:average(s.botches,s.n),injuriesPct:average(s.injuries*100,s.n),
   earnedNear:average(s.near,s.n),badNear:s.bad,booked:s.booked,
   extremeSafe:s.extremeSafe,earlyQ:average(s.earlyQ,s.earlyN),lateQ:average(s.lateQ,s.lateN),
   lateDistinct:average(s.lateDistinct,s.n),lateNamed:average(s.lateNamed,s.n),
   lateNamedAnyPct:average(s.lateAnyNamed*100,s.n),
   lateAttack:average(s.lateAttack,s.n),finishGap:average(s.finishGap,s.n),
   repeatedLines:average(s.repeated,s.n),topRepeated:top(s.lines,8),
   topNamed:top(s.topMoves,8),topRisk:top(s.riskMoves,8),examples:s.examples};
 }
 const data={schema:'office-five-plan-readiness-v1',
  codeReference:'shipped OfficeMatch engine (read-only)',
  controlledSeeds:seeds,realSeeds,realWorkers:real.length,
  totalMatches:count,expected:WORKERS.length*3*3*4*seeds*5+real.length*realSeeds*5,
  matched:Object.fromEntries(PLANS.map(p=>[p,summary(cell('matched:ALL:'+p))])),
  natural:Object.fromEntries(PLANS.map(p=>[p,summary(cell('real:ALL:'+p))])),
  native:Object.fromEntries(WORKERS.map(([,style])=>[style,
   Object.fromEntries(PLANS.map(p=>[p,summary(cell('matched:STYLE:'+style+':'+p))]))])),
  duration:Object.fromEntries(LENGTHS.map(min=>[min,
   Object.fromEntries(PLANS.map(p=>[p,summary(cell('matched:LENGTH:'+min+':'+p))]))])),
  durationTier:Object.fromEntries([12,18].flatMap(min=>TIERS.map(([tier])=>[
   min+'/'+tier,Object.fromEntries(PLANS.map(p=>
    [p,summary(cell('matched:LENGTH_TIER:'+min+':'+tier+':'+p))]))]))),
  repeatedTapeExamples:evidence};
 return data;
}
function failures(r){
 const e=[];
 if(r.totalMatches!==r.expected)e.push('Incomplete '+r.totalMatches+'/'+r.expected);
 for(const p of PLANS){
  for(const s of [r.matched[p],r.natural[p],...LENGTHS.map(min=>r.duration[min][p])]){
   if(!Number.isFinite(s.stars)||!s.n||s.badNear>0||s.booked!==s.n)e.push('Broken outcome/source '+p);
  }
 }
 if(r.matched.safe.extremeSafe!==0)e.push('Extreme scripted Safe spot observed');
 return [...new Set(e)];
}
function markdown(r){
 const lines=['# The Office — final five-plan readiness audit','',
  r.totalMatches+' actual simulated matches. Shipped engine only, no save changes.','',
  '| Plan | Stars | Risky landed / bout | Bell stamina | Exhausted | Genuine covers | Repeated lines/bout |',
  '|---|---:|---:|---:|---:|---:|---:|'];
 for(const p of PLANS){
  const s=r.matched[p];
  lines.push('| '+p+' | '+s.stars+' | '+s.risk+' | '+s.stamina+
   ' | '+s.exhaustedPct+'% | '+s.earnedNear+' | '+s.repeatedLines+' |');
 }
 lines.push('','## 18-minute finishing realism','',
  '| Plan | Exhausted | Mean late family-tagged moves | At least one late named action | Early Q | Late Q |',
  '|---|---:|---:|---:|---:|---:|');
 for(const p of PLANS){
  const s=r.duration[18][p];
  lines.push('| '+p+' | '+s.exhaustedPct+'% | '+s.lateNamed+
    ' | '+s.lateNamedAnyPct+'% | '+s.earlyQ+' | '+s.lateQ+' |');
 }
 lines.push('','**Mechanical errors:** '+(failures(r).join('; ')||'none')+'.',
  'Aesthetic and pacing problems are diagnostic findings, not assertion failures.');
 return lines.join('\n');
}
if(require.main===module){
 try{
  const controlled=process.argv[2]?Number(process.argv[2]):2;
  const real=process.argv[3]?Number(process.argv[3]):6;
  const result=capture(controlled,real);
  if(process.argv.includes('--json-file'))
   require('node:fs').writeFileSync('five-plan-readiness.json',JSON.stringify(result,null,2)+'\n');
  console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):markdown(result));
  if(failures(result).length)process.exitCode=1;
 }catch(error){console.error(error.stack);process.exitCode=1;}
}
module.exports={capture,failures,markdown,PLANS,WORKERS,TIERS,LENGTHS};
