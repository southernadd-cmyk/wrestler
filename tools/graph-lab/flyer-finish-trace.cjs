#!/usr/bin/env node
'use strict';
// Diagnostic for the FINAL 180 seconds, one clock sample per actual match
// tick. Never modifies the graph, the event queue or the selection RNG.
const lab=require('./core.js'),review=require('./match-review.cjs');
const ROUND=n=>Math.round(n*100)/100;
function capture(n=6){
 if(!Number.isInteger(n)||n<1||n>30)throw Error('Expected 1..30 seeds per opponent');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
 const opponents=['ace','silas','red','rev'],bouts=[],sums={
  stAt180:0,stAtBell:0,ticks:0,workerControl:0,workerStanding:0,
  standingReady:0,topReady:0,workerMat:0,workerOutside:0,
  lateSetups:0,lateWorkerRisk:0,lateWorkerNamedAerials:0,
  lateGenericAerial:0,lateAerialAttempts:0,lateAerialLandings:0,
  lateBreaths:0,zeroSetups:0,zeroNamedRisk:0,
  lateStartReady:0
 };
 for(let oi=0;oi<opponents.length;oi++)for(let i=0;i<n;i++){
  const opp=opponents[oi],seed=880041+oi*7919+18*9191+i*193;
  const opts=lab.makeOptions(D,{
   wid:'lyra',rid:opp,plan:'spots',slot:'main',minutes:18,
   seed,promotion:D.PROMOS[(oi+18+i)%D.PROMOS.length].id,
   finish:i%2?'lose_clean':'win_clean'
  });
  opts.minutes=18;opts.w={...opts.w,ring:92,safe:91,psych:84,heat:65,fatigue:4,pro:78};
  const m=M.create(opts),data={opponent:opp,seed,ticks:0,
   control:0,standing:0,standingReady:0,topReady:0,mat:0,outside:0,
   stAt180:null,stAtBell:0,setup:[],landedRisk:[],lateBreaths:0,
   aerialAttempts:[],aerialLanded:0,lateRisk:0};
  let prevT=-1;
  for(let step=0;step<9000&&!m.done;step++){
   if(m.decision&&!m.queue.length){
    const available=m.decision.options||[];
    const preferred=available.find(o=>['job','home','cut','protect'].includes(o.id))||available[0];
    if(!preferred)throw Error('No decision option');
    M.resolve(m,preferred.id);
   }
   M.next(m);
   if(m.t===prevT)continue;
   prevT=m.t;
   if(m.t<m.len-180||m.t>=m.len)continue;
   const p=m.story;
   if(data.stAt180===null)data.stAt180=m.wSt;
   data.ticks++;
   if(p.control==='w')data.control++;
   if(p.position==='standing'&&p.control==='w'){
    data.standing++;
    if(m.wSt>=42)data.standingReady++;
   }
   if(p.position==='top'&&p.control==='w'&&m.wSt>=32)data.topReady++;
   if(p.position==='mat')data.mat++;
   if(p.position==='outside')data.outside++;
  }
  if(!m.done||!m.final)throw Error('Incomplete bout '+seed);
  data.stAtBell=m.wSt;
  for(const e of m.graph?.events||[]){
   if(e.t<m.len-180||e.preControl!=='w')continue;
   if(e.id==='catch_breath')data.lateBreaths++;
   if(e.id==='top_climb'||e.id==='springboard_rise')
    data.setup.push({id:e.id,t:e.t,staminaSpent:e.exertion});
   const a=G.A[e.id];
   if(a?.risk&&!a.reverse&&!a.counterOf&&!a.blockOf&&
     (!e.aerialResolution||e.aerialResolution==='landed')&&
     (!e.contactResolution||e.contactResolution==='landed')&&
     (!e.grappleResolution||e.grappleResolution==='landed')){
    data.lateRisk++;
    data.landedRisk.push({id:e.id,t:e.t});
   }
   if(['aerial_attack','springboard_strike','missile_dropkick','high_crossbody'].includes(e.id))
    data.lateGenericAerial=(data.lateGenericAerial||0)+1;
  }
  data.aerialAttempts=(m.graph?.aerialAttempts||[])
   .filter(e=>e.side==='w'&&e.startedT>=m.len-180)
   .map(e=>({id:e.id,t:e.startedT,outcome:e.outcome}));
  data.aerialLanded=data.aerialAttempts.filter(e=>e.outcome==='landed').length;
  sums.stAt180+=data.stAt180??0;sums.stAtBell+=data.stAtBell;
  if((data.stAt180??0)>=42)sums.lateStartReady++;
  sums.ticks+=data.ticks;sums.workerControl+=data.control;
  sums.workerStanding+=data.standing;sums.standingReady+=data.standingReady;
  sums.topReady+=data.topReady;sums.workerMat+=data.mat;
  sums.workerOutside+=data.outside;sums.lateSetups+=data.setup.length;
  sums.lateWorkerRisk+=data.lateRisk;
  sums.lateWorkerNamedAerials+=data.landedRisk.filter(e=>
   ['aerial','springboard','dive'].includes(G.A[e.id]?.family)).length;
  sums.lateGenericAerial+=data.lateGenericAerial||0;
  sums.lateAerialAttempts+=data.aerialAttempts.length;
  sums.lateAerialLandings+=data.aerialLanded;
  sums.lateBreaths+=data.lateBreaths;
  sums.zeroSetups+=data.setup.length===0?1:0;
  sums.zeroNamedRisk+=data.landedRisk.length===0?1:0;
  bouts.push(data);
 }
 const avg=Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,
  ROUND(v/bouts.length)]));
 return {schema:'office-flyer-final-three-minutes-v1',n,
  bouts:bouts.length,avg,samples:bouts.slice().sort((a,b)=>
   a.lateRisk-b.lateRisk||a.stAt180-b.stAt180).slice(0,8)};
}
function markdown(r){
 const out=['### Elite 18-minute Spot-fest — final 180 seconds diagnostic','',
  'Real graph and seed-matched opponents; '+r.bouts+' bouts. No match engine edits, forced choices, free moves or RNG probes.','',
  '| Observable / match | Mean |','|---|---:|'];
 for(const [k,v] of Object.entries(r.avg))out.push('| '+k+' | '+v+' |');
 out.push('','The eight examples below are selected with the FEWEST real late risky landings; these are failures to investigate, not a random sample.','',
  '| Opponent | Seed | At -180s stamina | Worker-control ticks | Standing and ready ticks | Legal setups | Named late risky landings | Committed aerial attempts |',
  '|---|---:|---:|---:|---:|---|---|---|');
 for(const b of r.samples)out.push('| '+b.opponent+' | '+b.seed+' | '+ROUND(b.stAt180??0)+
  ' | '+b.control+' | '+b.standingReady+' | '+
  (b.setup.map(x=>x.id).join(', ')||'none')+' | '+
  (b.landedRisk.map(x=>x.id).join(', ')||'none')+' | '+
  (b.aerialAttempts.map(x=>x.id+':'+x.outcome).join(', ')||'none')+' |');
 return out.join('\n');
}
if(require.main===module){
 try{
  const n=process.argv[2]?Number(process.argv[2]):6;
  const result=capture(n);
  console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):markdown(result));
 }catch(e){console.error(e.stack);process.exitCode=1;}
}
module.exports={capture,markdown};
