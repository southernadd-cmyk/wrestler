#!/usr/bin/env node
'use strict';
// Real-match, read-only stamina timeline: no gameplay or star scoring edits.
const fs=require('node:fs'),lab=require('./core.js'),review=require('./match-review.cjs');
const TIERS=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const PLANS=['technical','story','safe'],OPP=['ace','silas','red','rev'];
const MARKS=[.25,.50,.65,.75,.83,.90,1];
const avg=(v,n)=>n?+(v/n).toFixed(2):0,pct=(v,n)=>n?+(100*v/n).toFixed(1):0;
function capture(seeds=12){
 if(!Number.isInteger(seeds)||seeds<1||seeds>20)throw Error('Expected 1..20 seeds');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A,rows=[];
 for(const [tier,ring,safe,psych] of TIERS)for(const plan of PLANS){
  const x={tier,plan,bouts:0,stars:0,bell:0,startStamina:0,exhausted:0,
   firstBelow25:0,belowCount:0,liveTicks:0,
   events:0,positiveActionCost:0,negativeActionRecovery:0,
   grappleSetups:0,grapplesCommitted:0,
   restEvents:0,restRecovery:0,breatherEvents:0,breatherRecovery:0,
   lateRestEvents:0,lateBreathers:0,lateDistinct:0,
   phases:Object.fromEntries(MARKS.map(k=>[k,{n:0,total:0,below25:0}])),
   examples:[],negativeMoves:{},positiveMoves:{}};
  for(let oi=0;oi<OPP.length;oi++)for(let i=0;i<seeds;i++){
   const opt=lab.makeOptions(D,{wid:'juno',rid:OPP[oi],minutes:18,plan,
    slot:'main',seed:910087+oi*7919+18*9191+i*193,
    promotion:D.PROMOS[(oi+18+i)%D.PROMOS.length].id,
    finish:i%2?'lose_clean':'win_clean'});
   opt.minutes=18;opt.w={...opt.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
   const m=M.create(opt),snap={},atRisk=[];
   x.startStamina+=m.wSt;
   let firstBelow=null,live=0,exertionCost=0,exertionGain=0;
   for(let steps=0;steps<9000&&!m.done;steps++){
    if(m.decision&&!m.queue.length){
     const choices=m.decision.options||[];
     const choice=choices.find(z=>['job','home','cut','protect'].includes(z.id))||choices[0];
     if(!choice)throw Error('Unresolved decision');
     M.resolve(m,choice.id);
    }
    const old=new Set(m.graph?.events||[]),wasLive=m.stage==='live';
    M.next(m);
    const fresh=(m.graph?.events||[]).filter(e=>!old.has(e)&&e.preControl==='w');
    if(wasLive||m.stage==='live'){
     live++;
     atRisk.push(m.wSt<25);
     if(firstBelow===null&&m.wSt<25)firstBelow=m.t;
     for(const f of MARKS)
      if(!Object.prototype.hasOwnProperty.call(snap,f)&&m.t>=m.len*f){
       snap[f]=m.wSt;
      }
    }
    for(const e of fresh){
     if(!Number.isFinite(e.exertion))continue;
     x.events++;
     if(e.exertion>0){
      exertionCost+=e.exertion;
      x.positiveMoves[e.id]=(x.positiveMoves[e.id]||0)+1;
     }else if(e.exertion<0){
      exertionGain-=e.exertion;
      x.negativeMoves[e.id]=(x.negativeMoves[e.id]||0)+1;
     }
     if(e.id==='catch_breath'){
      x.breatherEvents++;x.breatherRecovery-=e.exertion;
      if(e.t>=m.len-180)x.lateBreathers++;
     }
     if(A[e.id]?.family==='rest'){
      x.restEvents++;x.restRecovery-=e.exertion;
      if(e.t>=m.len-180)x.lateRestEvents++;
     }
     if(G.GRIP_ENTRY[e.id]&&!G.GRAPPLE_PILOT.includes(e.id))x.grappleSetups++;
    }
   }
   if(!m.done||!m.final)throw Error('Incomplete '+tier+' '+plan);
   x.bouts++;x.stars+=m.final.stars;x.bell+=m.wSt;x.exhausted+=m.wSt<25;
   x.belowCount+=atRisk.filter(Boolean).length;x.liveTicks+=live;
   x.firstBelow25+=(firstBelow===null?m.len:firstBelow);
   x.positiveActionCost+=exertionCost;x.negativeActionRecovery+=exertionGain;
   x.grapplesCommitted+=(m.graph?.grappleAttempts||[]).filter(a=>a.side==='w').length;
   const late=(m.graph?.events||[]).filter(e=>e.preControl==='w'&&e.t>=m.len-180&&
    A[e.id]&&!A[e.id].reverse&&!A[e.id].counterOf&&!A[e.id].blockOf&&
    ['grappleResolution','strikeResolution','aerialResolution','contactResolution']
      .every(k=>!e[k]||e[k]==='landed')&&
    ['chain','suplex','ground','submission','neck','pin','rest'].includes(A[e.id].family));
   x.lateDistinct+=new Set(late.map(e=>e.id)).size;
   for(const [key,value] of Object.entries(snap)){
    const row=x.phases[key];row.n++;row.total+=value;row.below25+=value<25;
   }
   if(x.examples.length<4)x.examples.push({seed:m.o.seed,opponent:OPP[oi],
    bell:m.wSt,firstBelow25:firstBelow,rests:(m.graph?.events||[])
     .filter(e=>e.preControl==='w'&&e.exertion<0).map(e=>({t:e.t,id:e.id,recovery:-e.exertion})).slice(0,8)});
  }
  rows.push({tier,plan,bouts:x.bouts,planDrain:D.PLANS[plan].drain,
   stars:avg(x.stars,x.bouts),bellStamina:avg(x.bell,x.bouts),
   exhaustedPct:pct(x.exhausted,x.bouts),
   firstBelow25Minute:avg(x.firstBelow25,x.bouts)/60,
   liveBelow25Pct:pct(x.belowCount,x.liveTicks),
   routineAndCommitNetCostPerBout:avg(x.startStamina-x.bell-
     x.positiveActionCost+x.negativeActionRecovery,x.bouts),
   performedPositiveCostPerBout:avg(x.positiveActionCost,x.bouts),
   narratedRestRecoveryPerBout:avg(x.negativeActionRecovery,x.bouts),
   authoredRestActionsPerBout:avg(x.restEvents,x.bouts),
   authoredRestRecoveredPerBout:avg(x.restRecovery,x.bouts),
   catchBreathersPerBout:avg(x.breatherEvents,x.bouts),
   catchBreatherRecoveryPerBout:avg(x.breatherRecovery,x.bouts),
   lateRestActionsPerBout:avg(x.lateRestEvents,x.bouts),
   lateBreathersPerBout:avg(x.lateBreathers,x.bouts),
   gripSetupsPerBout:avg(x.grappleSetups,x.bouts),
   grappleAttemptsPerBout:avg(x.grapplesCommitted,x.bouts),
   lateDistinctPerBout:avg(x.lateDistinct,x.bouts),
   timeline:Object.entries(x.phases).map(([f,v])=>({
    fraction:Number(f),stamina:avg(v.total,v.n),under25Pct:pct(v.below25,v.n),n:v.n})),
   mostFrequentRecoveries:Object.entries(x.negativeMoves).sort((a,b)=>b[1]-a[1]).slice(0,8),
   mostFrequentCosts:Object.entries(x.positiveMoves).sort((a,b)=>b[1]-a[1]).slice(0,8),
   examples:x.examples});
 }
 return {schema:'office-technical-endurance-v1',seeds,
  totalBouts:TIERS.length*PLANS.length*OPP.length*seeds,
  method:'Real 18-minute OfficeMatch fixtures paired across Technical, Story and Safe plans at each tier, exact same opponent, seed, finish, promoter, Juno style and duration. Net non-event drain estimate includes tick upkeep, grapple commitment and incident effects, not pure passive drain. Snapshot markers are first tick crossing phase fraction; early injury end may leave missing snapshots. No engine edits.',
  rows};
}
function markdown(r){
 const out=['## Technical 18-minute stamina runway — performed actions versus continuous drain','',
  r.totalBouts+' completed real matches. '+r.method,'',
  '| Tier | Plan | ★ | Stamina at bell | Below 25 at bell | First below 25 (min) | Time below 25 | Positive move cost/bout | Narrated recovery/bout | Breathers/bout | Rest holds/bout | Late distinct/bout |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of r.rows)out.push('| '+x.tier+' | '+x.plan+' | '+x.stars+
  ' | '+x.bellStamina+' | '+x.exhaustedPct+'% | '+x.firstBelow25Minute.toFixed(2)+
  ' | '+x.liveBelow25Pct+'% | '+x.performedPositiveCostPerBout+
  ' | '+x.narratedRestRecoveryPerBout+' | '+x.catchBreathersPerBout+
  ' | '+x.authoredRestActionsPerBout+' | '+x.lateDistinctPerBout+' |');
 for(const tier of TIERS.map(x=>x[0])){
  const x=r.rows.find(x=>x.tier===tier&&x.plan==='technical');
  out.push('','### '+tier+' / native Technical plan',
   'Stamina by match completion fraction: '+x.timeline.map(z=>
    (z.fraction*100)+'%='+z.stamina+' ('+z.under25Pct+'% exhausted)').join(', '),
   'Recovery actions seen: '+JSON.stringify(x.mostFrequentRecoveries),
   'Frequent stamina-cost actions: '+JSON.stringify(x.mostFrequentCosts),
   'Example actual breather/hold timelines: '+JSON.stringify(x.examples.slice(0,2)));
 }
 return out.join('\n');
}
if(require.main===module)try{
 const r=capture(process.argv[2]?Number(process.argv[2]):12);
 if(process.argv.includes('--json-file'))fs.writeFileSync('technical-endurance-trace.json',JSON.stringify(r,null,2)+'\n');
 console.log(markdown(r));
}catch(e){console.error(e.stack);process.exitCode=1;}
module.exports={capture,markdown};
