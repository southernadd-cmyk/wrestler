#!/usr/bin/env node
'use strict';
// Read-only audit of actual OfficeMatch ticks and committed late move outcomes.
const fs=require('node:fs'),lab=require('./core.js'),review=require('./match-review.cjs');
const TIERS=[
 {id:'novice',ring:50,safe:45,psych:52},
 {id:'competent',ring:73,safe:68,psych:70},
 {id:'elite',ring:92,safe:91,psych:84}];
const OPPONENTS=[{id:'ace',style:'Spectacle'},{id:'silas',style:'Technical'},
 {id:'red',style:'Brawl'},{id:'rev',style:'Story'}];
const SPECIAL=new Set(['strike','running','power','outside','ringside','corner','rope']);
const BOOST=new Set(['strike','running','power','outside','corner','rope']);
const round=(x,d=2)=>Number(x.toFixed(d));
const pct=(x,n)=>n?round(100*x/n,1):0;
const add=(a,k,v=1)=>{a[k]=(a[k]||0)+v;};
const top=(a,n=12)=>Object.entries(a).sort((x,y)=>y[1]-x[1]||x[0].localeCompare(y[0]))
 .slice(0,n).map(([id,count])=>({id,count}));
const named=(A,id)=>A[id]&&SPECIAL.has(A[id].family)&&
 !A[id].reverse&&!A[id].counterOf&&!A[id].blockOf;
const landed=e=>['aerialResolution','grappleResolution','strikeResolution','contactResolution']
 .every(k=>!e[k]||e[k]==='landed');
function run(n=24){
 if(!Number.isInteger(n)||n<1||n>40)throw Error('Expected 1..40 seeds per opponent');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
 const cohorts=[];
 for(const tier of TIERS){
  const training=(tier.ring+tier.safe+tier.psych-180)/90;
  const acc={tier:tier.id,training:round(training,3),n:0,stars:0,bell:0,
   threeMinute:0,threeMinuteN:0,lateUnique:0,lateActions:0,withTwo:0,none:0,
   samples:0,positions:{},controls:{},staminaBands:{},
   workerSamples:0,eligibleSamples:0,gates:{},legal:0,offered:0,unused:0,
   boostCandidates:0,specialWeight:0,boostWeight:0,activeMoves:{},
   familyShare:{},attempts:{},attemptOutcomes:{},poorExamples:[]};
  for(let j=0;j<OPPONENTS.length;j++)for(let i=0;i<n;i++){
   const opp=OPPONENTS[j],seed=880041+j*7919+18*9191+i*193;
   const o=lab.makeOptions(D,{wid:'rex',rid:opp.id,minutes:18,plan:'brawl',
    seed,promotion:D.PROMOS[(j+18+i)%D.PROMOS.length].id,
    slot:'main',finish:i%2?'lose_clean':'win_clean'});
   o.minutes=18;o.w={...o.w,ring:tier.ring,safe:tier.safe,psych:tier.psych,
    fatigue:4,heat:65,pro:78};
   const m=M.create(o);acc.n++;
   for(let step=0;step<9000&&!m.done;step++){
    if(m.decision&&!m.queue.length){
     const choices=m.decision.options||[];
     const picked=choices.find(x=>['job','home','cut','protect'].includes(x.id))||choices[0];
     if(!picked)throw Error('No match decision choice');
     M.resolve(m,picked.id);
    }
    const before=m.t;M.next(m);
    if(m.t===before||m.t<m.len-180||m.t>m.len||m.stage!=='live')continue;
    const p=m.story||{},g=m.graph||{},st=m.wSt;
    acc.samples++;add(acc.positions,p.position||'unknown');
    add(acc.controls,p.control||'neutral');
    add(acc.staminaBands,st<16?'0-15':st<26?'16-25':
      st<40?'26-39':st<60?'40-59':'60+');
    if(m.len-m.t===180){acc.threeMinute+=st;acc.threeMinuteN++;}
    if(p.control!=='w')continue;
    acc.workerSamples++;
    if(g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact||m.decision)continue;
    acc.eligibleSamples++;
    const pool=G.pool(m);
    const total=pool.reduce((v,[,w])=>v+w,0);
    const specialty=pool.filter(([id])=>named(A,id));
    const offered=specialty.filter(([id])=>BOOST.has(A[id].family));
    const fresh=offered.filter(([id])=>!g.events.some(e=>
      e.id===id&&e.preControl==='w'&&e.t>=m.len-180));
    acc.legal+=Object.keys(A).filter(id=>named(A,id)&&G.isValid(m,id)).length;
    acc.offered+=specialty.length;acc.boostCandidates+=offered.length;
    acc.unused+=fresh.length;
    acc.specialWeight+=specialty.reduce((v,[,w])=>v+w,0)/Math.max(1,total);
    acc.boostWeight+=offered.reduce((v,[,w])=>v+w,0)/Math.max(1,total);
    for(const [id,w] of offered)add(acc.familyShare,A[id].family,w/Math.max(1,total));
    add(acc.gates,training<.5&&st<26?'fails threshold and stamina':
      training<.5?'conditioning below 0.50':
      st<26?'stamina below 26':'passes both');
   }
   if(!m.done||!m.final)throw Error('Incomplete match '+tier.id+'/'+seed);
   acc.stars+=m.final.stars;acc.bell+=m.wSt;
   const late=(m.graph?.events||[]).filter(e=>
    e.t>=m.len-180&&e.preControl==='w'&&named(A,e.id)&&landed(e));
   const distinct=new Set(late.map(x=>x.id)).size;
   acc.lateUnique+=distinct;acc.lateActions+=late.length;acc.none+=!distinct;acc.withTwo+=distinct>=2;
   for(const e of late)add(acc.activeMoves,e.id);
   for(const type of ['strike','grapple','contact','aerial']){
    const attempts=(m.graph?.[type+'Attempts']||[]).filter(e=>
      e.side==='w'&&e.startedT>=m.len-180);
    add(acc.attempts,type,attempts.length);
    for(const attempt of attempts)add(acc.attemptOutcomes,type+'/'+attempt.outcome);
   }
   if(distinct===0&&acc.poorExamples.length<4){
    const tape=(m.graph?.events||[]).filter(e=>e.t>=m.len-180&&e.preControl==='w'&&A[e.id])
     .slice(-10).map(e=>({t:e.t,id:e.id,family:A[e.id].family||'core',
      result:e.strikeResolution||e.grappleResolution||e.contactResolution||e.aerialResolution||'immediate',
      position:e.position}));
    acc.poorExamples.push({seed,opponent:opp.style,bell:round(m.wSt),tape});
   }
  }
  const avg=(x,by)=>by?round(x/by):0;
  cohorts.push({tier:acc.tier,conditioning:acc.training,matches:acc.n,
   stars:avg(acc.stars,acc.n),bell:avg(acc.bell,acc.n),
   startOfFinalThree:avg(acc.threeMinute,acc.threeMinuteN),
   lateDistinct:avg(acc.lateUnique,acc.n),lateActions:avg(acc.lateActions,acc.n),
   twoPct:pct(acc.withTwo,acc.n),zeroPct:pct(acc.none,acc.n),
   positionsPct:Object.fromEntries(Object.entries(acc.positions).map(([k,v])=>[k,pct(v,acc.samples)])),
   controlPct:Object.fromEntries(Object.entries(acc.controls).map(([k,v])=>[k,pct(v,acc.samples)])),
   staminaBandsPct:Object.fromEntries(Object.entries(acc.staminaBands).map(([k,v])=>[k,pct(v,acc.samples)])),
   workerSamples:acc.workerSamples,eligibleSamples:acc.eligibleSamples,
   gatePct:Object.fromEntries(Object.entries(acc.gates).map(([k,v])=>[k,pct(v,acc.eligibleSamples)])),
   legalNamedPerTick:avg(acc.legal,acc.eligibleSamples),
   offeredNamedPerTick:avg(acc.offered,acc.eligibleSamples),
   unusedBoostFamilyPerTick:avg(acc.unused,acc.eligibleSamples),
   boostFamilyPerTick:avg(acc.boostCandidates,acc.eligibleSamples),
   namedWeightPct:round(acc.specialWeight*100/Math.max(1,acc.eligibleSamples),1),
   boostFamilyWeightPct:round(acc.boostWeight*100/Math.max(1,acc.eligibleSamples),1),
   familySharePct:Object.fromEntries(Object.entries(acc.familyShare).map(([k,v])=>
    [k,round(v*100/Math.max(1,acc.eligibleSamples),1)])),
   attempts:acc.attempts,attemptOutcomes:acc.attemptOutcomes,
   actualNamedMoves:top(acc.activeMoves),poorExamples:acc.poorExamples});
 }
 return {schema:'office-brawl-late-variety-v1',n,matches:cohorts.reduce((a,c)=>a+c.matches,0),
  notes:'Read-only actual 18-minute Brawl. Matched 4 opponents, same seeds/tier overrides as original style-depth audit. Post-tick Graph.pool() samples are counterfactual next-choice opportunities, not actual selected actions. Committed attempt ledgers and landed events are actual match outcomes. No game changes.',cohorts};
}
function markdown(r){
 const out=['## Brawl late-move variety — read-only diagnostic','',
  String(r.matches)+' complete real OfficeMatch simulations. '+r.notes,'',
  '| Tier | Conditioning | Bell stamina | 3-min start stamina | Distinct successful late | ≥2 late | None late | Worker controls | Legal named | Offered named | Fresh boosted-family | Named pool share |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const s of r.cohorts)out.push('| '+s.tier+' | '+s.conditioning+' | '+s.bell+
  ' | '+s.startOfFinalThree+' | '+s.lateDistinct+' | '+s.twoPct+'% | '+
  s.zeroPct+'% | '+(s.controlPct.w||0)+'% | '+s.legalNamedPerTick+
  ' | '+s.offeredNamedPerTick+' | '+s.unusedBoostFamilyPerTick+' | '+s.namedWeightPct+'% |');
 for(const s of r.cohorts){
  out.push('','### '+s.tier,'',
   'Gate outcomes: '+JSON.stringify(s.gatePct),
   'Final-three positions: '+JSON.stringify(s.positionsPct),
   'Final-three stamina bands: '+JSON.stringify(s.staminaBandsPct),
   'Family weights in currently available action pool: '+JSON.stringify(s.familySharePct),
   'Actual committed attempts: '+JSON.stringify(s.attempts)+'; resolved outcomes: '+JSON.stringify(s.attemptOutcomes),
   'Actual landed named move IDs: '+JSON.stringify(s.actualNamedMoves),'');
 }
 out.push('PASS: diagnostic collected actual late grappling/striking outcomes without mutating the match engine.','');
 return out.join('\n');
}
if(require.main===module){
 try{
  const result=run(process.argv[2]?Number(process.argv[2]):24);
  if(process.argv.includes('--json-file'))fs.writeFileSync('brawl-late-variety.json',JSON.stringify(result,null,2)+'\n');
  console.log(markdown(result));
 }catch(e){console.error(e.stack);process.exitCode=1;}
}
module.exports={run,markdown,TIERS};
