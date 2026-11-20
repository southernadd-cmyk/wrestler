#!/usr/bin/env node
'use strict';
// Counts real seeded OfficeMatch late running attempts, named landings, and authored setup opportunities.
const fs=require('node:fs'),lab=require('./core.js'),review=require('./match-review.cjs');
const TIERS=[{id:'novice',ring:50,safe:45,psych:52},
 {id:'competent',ring:73,safe:68,psych:70},{id:'elite',ring:92,safe:91,psych:84}];
const OPPONENTS=['ace','silas','red','rev'];
const avg=(v,n)=>n?+(v/n).toFixed(2):0,pct=(v,n)=>n?+(v*100/n).toFixed(1):0;
const inc=(o,k)=>o[k]=(o[k]||0)+1;
function capture(n=24){
 if(!Number.isSafeInteger(n)||n<1||n>40)throw Error('Expected 1..40 seeds per opponent');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
 const cohorts=[];
 for(const tier of TIERS){
  const x={tier:tier.id,bouts:0,stars:0,bell:0,setups:0,
   eligibleSetups:0,offeredSetups:0,legalTotal:0,offeredTotal:0,offeredShare:0,
   directFollowups:0,sameBeatSetups:0,attempts:0,landed:0,counter:0,block:0,aborted:0,
   totalNamedDistinct:0,nonRunningDistinct:0,totalNamedLanded:0,
   withLanding:0,withTwo:0,unique:0,runners:{},setupIds:{},next:{},examples:[]};
  for(let j=0;j<OPPONENTS.length;j++)for(let i=0;i<n;i++){
   const seed=880041+j*7919+18*9191+i*193;
   const opt=lab.makeOptions(D,{wid:'rex',rid:OPPONENTS[j],plan:'brawl',
    minutes:18,slot:'main',seed,promotion:D.PROMOS[(j+18+i)%D.PROMOS.length].id,
    finish:i%2?'lose_clean':'win_clean'});
   opt.minutes=18;opt.w={...opt.w,...tier,heat:65,fatigue:4,pro:78};
   const m=M.create(opt),setups=[];
   for(let step=0;step<9000&&!m.done;step++){
    if(m.decision&&!m.queue.length){
     const options=m.decision.options||[];
     const selected=options.find(o=>['job','home','cut','protect'].includes(o.id))||options[0];
     if(!selected)throw Error('Unresolvable decision');
     M.resolve(m,selected.id);
    }
    const old=(m.graph?.events||[]).length;
    M.next(m);
    for(const e of (m.graph?.events||[]).slice(old)){
     if(e.preControl!=='w'||e.t<m.len-180||e.t>m.len||
        !['rope_run','rope_rebound'].includes(e.id))continue;
     inc(x.setupIds,e.id);x.setups++;
     const legal=(G.CATALOG.members.running||[]).filter(id=>A[id]&&
      !A[id].reverse&&!A[id].counterOf&&!A[id].blockOf&&G.isValid(m,id));
     const pool=G.pool(m),running=pool.filter(([id])=>A[id]?.family==='running'&&
      !A[id].reverse&&!A[id].counterOf&&!A[id].blockOf);
     const total=pool.reduce((s,[,w])=>s+w,0);
     const share=total?running.reduce((s,[,w])=>s+w,0)/total:0;
     x.legalTotal+=legal.length;x.offeredTotal+=running.length;x.offeredShare+=share;
     x.eligibleSetups+=legal.length>0;x.offeredSetups+=running.length>0;
     setups.push({e,legal:legal.length,offered:running.length,share});
    }
   }
   if(!m.done||!m.final)throw Error('Match did not finish: '+seed);
   x.bouts++;x.stars+=m.final.stars;x.bell+=m.wSt;
   const events=m.graph?.events||[];
   for(const {e,legal,offered,share} of setups){
    const index=events.indexOf(e),next=events.slice(index+1).find(ev=>ev.t>e.t);
    if(next)inc(x.next,next.id);
    const before=events[index-1];
    if(before&&before.id===e.brawlComboSource&&before.t===e.t&&
       before.preControl==='w'&&
       (before.strikeResolution==='landed'||
        ['stiff_forearm','body_shot','strike_trade'].includes(before.id)))
     x.sameBeatSetups++;
    if(next&&next.t-e.t<=20&&next.preControl==='w'&&A[next.id]?.family==='running'&&
       !A[next.id].reverse&&!A[next.id].counterOf&&!A[next.id].blockOf)x.directFollowups++;
    if(x.examples.length<6&&legal>0)x.examples.push({seed,setup:e.id,at:e.t,
     legal,offered,share:+share.toFixed(3),next:next?.id||null,
     delay:next?next.t-e.t:null});
   }
   const landedNamed=events.filter(e=>e.preControl==='w'&&
    e.t>=m.len-180&&A[e.id]&&
    ['strike','running','power','outside','ringside','corner','rope'].includes(A[e.id].family)&&
    !A[e.id].reverse&&!A[e.id].counterOf&&!A[e.id].blockOf&&
    ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
      .every(k=>!e[k]||e[k]==='landed'));
   x.totalNamedLanded+=landedNamed.length;
   x.totalNamedDistinct+=new Set(landedNamed.map(e=>e.id)).size;
   x.nonRunningDistinct+=new Set(landedNamed.filter(e=>
    A[e.id].family!=='running').map(e=>e.id)).size;
   const attempts=(m.graph?.strikeAttempts||[]).filter(a=>
    a.side==='w'&&A[a.id]?.family==='running'&&a.startedT>=m.len-180);
   const landed=new Set();
   for(const a of attempts){
    x.attempts++;
    if(a.outcome==='landed'){x.landed++;landed.add(a.id);inc(x.runners,a.id);}
    else if(a.outcome==='counter')x.counter++;
    else if(a.outcome==='block')x.block++;
    else x.aborted++;
   }
   x.withLanding+=landed.size>0;x.withTwo+=landed.size>=2;x.unique+=landed.size;
  }
  cohorts.push({tier:x.tier,bouts:x.bouts,stars:avg(x.stars,x.bouts),bell:avg(x.bell,x.bouts),
   setupsPerBout:avg(x.setups,x.bouts),setupLegalPct:pct(x.eligibleSetups,x.setups),
   setupOfferedPct:pct(x.offeredSetups,x.setups),legalPerSetup:avg(x.legalTotal,x.setups),
   offeredPerSetup:avg(x.offeredTotal,x.setups),runnerPoolSharePct:pct(x.offeredShare,x.setups),
   immediateRunPayoffPct:pct(x.directFollowups,x.setups),
   sameBeatSetups:x.sameBeatSetups,
   totalNamedDistinctPerBout:avg(x.totalNamedDistinct,x.bouts),
   nonRunningDistinctPerBout:avg(x.nonRunningDistinct,x.bouts),
   totalNamedLandedPerBout:avg(x.totalNamedLanded,x.bouts),
   lateRunningAttempts:x.attempts,
   lateRunningLanded:x.landed,lateRunningCountered:x.counter,lateRunningBlocked:x.block,
   lateRunningAborted:x.aborted,landedPerBout:avg(x.landed,x.bouts),
   distinctPerBout:avg(x.unique,x.bouts),
   boutsWithRunningPct:pct(x.withLanding,x.bouts),boutsWithTwoDistinctPct:pct(x.withTwo,x.bouts),
   actualRunningNames:x.runners,setupIds:x.setupIds,
   immediateNextEvents:Object.entries(x.next).sort((a,b)=>b[1]-a[1]).slice(0,12),
   examples:x.examples});
 }
 return {schema:'office-brawl-running-depth-v1',n,totalMatches:cohorts.reduce((v,c)=>v+c.bouts,0),
  method:'Same seeded 18m Brawl match fixtures before/after. Late committed STRIKE ledger entries prove real running attempts, landed/countered/blocked outcome; sampled after-setup action pools are read-only hypothetical opportunities, not proof of selection.',cohorts};
}
function markdown(r){
 const lines=['## Brawl: named running attacks — live match evidence','',
  r.totalMatches+' real matches. '+r.method,'',
  '| Tier | Bouts | ★ | Bell stamina | Late setups/bout | Linked same-beat setups | All distinct late | Other distinct late | Running pool share | Immediate running follow-through | Running attempts | Running landings | Bouts with running landing |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of r.cohorts)lines.push('| '+x.tier+' | '+x.bouts+' | '+x.stars+
  ' | '+x.bell+' | '+x.setupsPerBout+' | '+x.sameBeatSetups+' | '+
  x.totalNamedDistinctPerBout+' | '+x.nonRunningDistinctPerBout+' | '+
  x.runnerPoolSharePct+'% | '+x.immediateRunPayoffPct+'% | '+x.lateRunningAttempts+
  ' | '+x.lateRunningLanded+' | '+x.boutsWithRunningPct+'% |');
 for(const x of r.cohorts)lines.push('','### '+x.tier+' named run results',
  'Actually landed: '+JSON.stringify(x.actualRunningNames),
  'Real rope setup occurrences: '+JSON.stringify(x.setupIds),
  'Actual next graph event after setup: '+JSON.stringify(x.immediateNextEvents),
  'Counters / blocks / other failures: '+x.lateRunningCountered+' / '+
   x.lateRunningBlocked+' / '+x.lateRunningAborted,'');
 return lines.join('\n');
}
if(require.main===module){
 try{const r=capture(process.argv[2]?Number(process.argv[2]):24);
  if(process.argv.includes('--json-file'))fs.writeFileSync('brawl-running-depth.json',JSON.stringify(r,null,2)+'\n');
  console.log(markdown(r));
 }catch(e){console.error(e.stack);process.exitCode=1;}
}
module.exports={capture,markdown,TIERS};