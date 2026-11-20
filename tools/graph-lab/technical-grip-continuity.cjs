#!/usr/bin/env node
'use strict';
// Causal read-only trace: why an actual grip entry did not become a committed
// matching grapple within the following 20 seconds. No gameplay changes.
const fs=require('node:fs'),review=require('./match-review.cjs'),lab=require('./core.js');
const TIERS=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const PLANS=['technical','story'],DURATIONS=[12,18],OPP=['ace','silas','red','rev'];
const pct=(a,n)=>n?+(100*a/n).toFixed(1):0,mean=(a,n)=>n?+(a/n).toFixed(2):0;
const inc=(o,k)=>o[k]=(o[k]||0)+1;
function capture(seeds=6){
 if(!Number.isInteger(seeds)||seeds<1||seeds>12)throw Error('Need 1–12 seeds');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
 const rows=[];
 for(const [tier,ring,safe,psych] of TIERS)for(const minutes of DURATIONS)
 for(const plan of PLANS){
  const x={tier,minutes,plan,bouts:0,setups:0,eligible:0,committed:0,
   committedFromEligible:0,landed:0,
   nextTickArcReset:0,nextTickControlChanged:0,nextTickGripLost:0,
   nextTickNoAction:0,nextTickDifferentMove:0,nextTickMatchingGrapple:0,
   nextTickNoEligible:0,otherUnexpected:0,
   totalOfferedWeight:0,totalWeight:0,offeredCount:0,
   setupTypes:{},lostReasons:{},nextMoves:{},attemptedMoves:{},
   samples:[],lateSetup:0,lateConversions:0,stamina:0,
   grappleCountered:0,grappleBlocked:0,invalid:0};
  for(let oi=0;oi<OPP.length;oi++)for(let i=0;i<seeds;i++){
   const opt=lab.makeOptions(D,{wid:'juno',rid:OPP[oi],plan,
    slot:'main',minutes,seed:910087+oi*7919+minutes*9191+i*193,
    promotion:D.PROMOS[(oi+minutes+i)%D.PROMOS.length].id,
    finish:i%2?'lose_clean':'win_clean'});
   opt.minutes=minutes;opt.w={...opt.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
   const m=M.create(opt),active=[];
   for(let steps=0;steps<9000&&!m.done;steps++){
    if(m.decision&&!m.queue.length){
     const choices=m.decision.options||[];
     const selected=choices.find(c=>['job','home','cut','protect'].includes(c.id))||choices[0];
     if(!selected)throw Error('Unresolved choice in seed '+opt.seed);
     M.resolve(m,selected.id);
    }
    const g=M.GRAPH.get(m),old=new Set(g.events),oldAttempts=new Set(g.grappleAttempts);
    // Read-only hypothetical next-beat pool and actual isValid, before any
    // phase transition or competing special can discard the current grip.
    for(const a of active){
     if(a.checked||m.t!==a.t||m.stage!=='live')continue;
     a.checked=true;
     const p=m.story,ph=g.physical;
     if(!ph?.grip||ph.grip.side!=='w'||ph.grip.source!==a.id||
        ph.grip.at!==a.t||p.control!=='w'){a.eligible=false;continue;}
     const at=m.t;m.t+=10;
     try{
      const options=G.GRAPPLE_PILOT.filter(id=>
       G.PHYSICAL_GRIP_MOVES[id]===a.type&&
       A[id]?.requires===p.position&&G.isValid(m,id));
      a.eligible=options.length>0;
      a.offered=options.length;
      if(a.eligible){
       x.eligible++;
       const pool=G.pool(m),total=pool.reduce((sum,[,w])=>sum+w,0);
       const offer=pool.filter(([id])=>options.includes(id))
        .reduce((sum,[,w])=>sum+w,0);
       x.totalOfferedWeight+=offer;x.totalWeight+=total;x.offeredCount++;
       a.share=total?offer/total:0;
      }
     }finally{m.t=at;}
    }
    const preArc=g.arc,preControl=m.story.control,preGrip=g.physical?.grip;
    M.next(m);
    const newEvents=g.events.filter(e=>!old.has(e));
    const newAttempts=g.grappleAttempts.filter(a=>!oldAttempts.has(a));
    for(const a of active){
     if(!a.firstChecked&&m.t>=a.t+10){
      a.firstChecked=true;
      const matched=newAttempts.find(z=>z.side==='w'&&
       G.PHYSICAL_GRIP_MOVES[z.id]===a.type&&
       z.startedT>=a.t&&z.startedT<=a.t+20);
      if(matched){
       x.nextTickMatchingGrapple++;
      }else if(!a.eligible){x.nextTickNoEligible++;inc(x.lostReasons,'no-legal-candidate');}
      else if(g.arc!==preArc){x.nextTickArcReset++;inc(x.lostReasons,'arc-reset');}
      else if(m.story.control!==preControl||m.story.control!=='w'){
       x.nextTickControlChanged++;inc(x.lostReasons,'control-change');
      }else if(!g.physical?.grip||g.physical.grip.source!==a.id||
       g.physical.grip.side!=='w'){
       x.nextTickGripLost++;inc(x.lostReasons,'grip-overwritten');
      }else if(!newEvents.length){x.nextTickNoAction++;inc(x.lostReasons,'no-graph-action');}
      else {x.nextTickDifferentMove++;inc(x.lostReasons,'other-selection');}
      if(newEvents.length)inc(x.nextMoves,newEvents[0].id);
      if(x.samples.length<12)x.samples.push({
       seed:m.o.seed,at:a.t,source:a.id,grip:a.type,eligible:a.eligible,
       legalOptions:a.offered||0,choiceShare:+(a.share||0).toFixed(3),
       arcReset:g.arc!==preArc,keptGrip:g.physical?.grip?.source===a.id,
       next:newEvents[0]?.id||null,attempt:matched?.id||null});
     }
     for(const attempt of newAttempts){
      if(attempt.side!=='w'||attempt.startedT<a.t||
       attempt.startedT>a.t+20||G.PHYSICAL_GRIP_MOVES[attempt.id]!==a.type||
       a.committed)continue;
      a.committed=true;x.committed++;x.committedFromEligible+=!!a.eligible;
      x.lateConversions+=a.t>=m.len-180;
      inc(x.attemptedMoves,attempt.id);
     }
    }
    for(const e of newEvents){
     if(e.preControl!=='w'||!G.GRIP_ENTRY[e.id]||
      G.GRAPPLE_PILOT.includes(e.id)||e.reverse||e.grappleResolution)continue;
     const current=g.physical?.grip;
     if(current?.source!==e.id||current?.side!=='w'||current.at!==e.t)continue;
     x.setups++;inc(x.setupTypes,e.id);x.lateSetup+=e.t>=m.len-180;
     active.push({id:e.id,type:G.GRIP_ENTRY[e.id],t:e.t,
      eligible:false,checked:false,firstChecked:false,committed:false});
    }
    for(let a=active.length-1;a>=0;a--)if(m.t>active[a].t+20||m.done)active.splice(a,1);
   }
   if(!m.done||!m.final)throw Error('Incomplete trace '+tier+'/'+plan+'/'+minutes);
   x.bouts++;x.stamina+=m.wSt;
   for(const a of m.graph.grappleAttempts.filter(z=>z.side==='w')){
    x.landed+=a.outcome==='landed';
    x.grappleCountered+=a.outcome==='counter';
    x.grappleBlocked+=a.outcome==='block';
   }
  }
  rows.push({tier,minutes,plan,bouts:x.bouts,
   setups:x.setups,eligible:x.eligible,eligiblePct:pct(x.eligible,x.setups),
   committed:x.committed,convertedPct:pct(x.committed,x.setups),
   eligibleConvertedPct:pct(x.committedFromEligible,x.eligible),
   nextTickMatchingGrapple:x.nextTickMatchingGrapple,
   nextTickArcReset:x.nextTickArcReset,
   nextTickControlChanged:x.nextTickControlChanged,
   nextTickGripLost:x.nextTickGripLost,
   nextTickNoAction:x.nextTickNoAction,
   nextTickDifferentMove:x.nextTickDifferentMove,
   nextTickNoEligible:x.nextTickNoEligible,
   offeredSharePct:pct(x.totalOfferedWeight,x.totalWeight),
   meanStamina:mean(x.stamina,x.bouts),
   lateSetup:x.lateSetup,lateConversions:x.lateConversions,
   setupTypes:Object.entries(x.setupTypes).sort((a,b)=>b[1]-a[1]).slice(0,12),
   lostReasons:x.lostReasons,
   nextMoves:Object.entries(x.nextMoves).sort((a,b)=>b[1]-a[1]).slice(0,12),
   attemptedMoves:Object.entries(x.attemptedMoves).sort((a,b)=>b[1]-a[1]).slice(0,12),
   samples:x.samples});
 }
 return {schema:'office-technical-grip-continuity-v1',seeds,totalBouts:rows.length*4*seeds,
  methodology:'Real performed non-committed grip-entry actions with actor-owned, current physical grip. Before the following 10s graph tick, read-only exact isValid and pool measure candidate opportunity. Next action and next committed attempt are observed separately. One exclusive category for failure at first tick, priority: no legal, arc reset, control change, physical grip lost, no step, unrelated move. Stamina is observed at bell; no gameplay changes.',
  rows};
}
function markdown(r){
 const out=['## Technical grip continuity — actual action-by-action trace','',
  r.totalBouts+' seeded completed matches. '+r.methodology,'',
  '| Tier | Minutes | Plan | Owned setups | Valid next-beat candidate | Committed matching move | Candidate choice weight | Arc reset | Control change | Grip overwritten | No action | Different selection |',
  '|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of r.rows)out.push('| '+x.tier+' | '+x.minutes+' | '+x.plan+
  ' | '+x.setups+' | '+x.eligiblePct+'% | '+x.convertedPct+
  '% | '+x.offeredSharePct+'% | '+x.nextTickArcReset+
  ' | '+x.nextTickControlChanged+' | '+x.nextTickGripLost+
  ' | '+x.nextTickNoAction+' | '+x.nextTickDifferentMove+' |');
 for(const tier of TIERS.map(x=>x[0])){
  const x=r.rows.find(x=>x.tier===tier&&x.minutes===18&&x.plan==='technical');
  out.push('','### '+tier+' Technical 18 min',
   'Exclusive next-beat failure diagnoses: '+JSON.stringify(x.lostReasons),
   'Actual standing/mat grip setups: '+JSON.stringify(x.setupTypes),
   'Observed next match events: '+JSON.stringify(x.nextMoves),
   'Matching committed move IDs: '+JSON.stringify(x.attemptedMoves),
   'Representative complete setups: '+JSON.stringify(x.samples.slice(0,5)));
 }
 return out.join('\n');
}
if(require.main===module)try{
 const x=capture(process.argv[2]?Number(process.argv[2]):6);
 if(process.argv.includes('--json-file'))
  fs.writeFileSync('technical-grip-continuity.json',JSON.stringify(x,null,2)+'\n');
 console.log(markdown(x));
}catch(err){console.error(err.stack);process.exitCode=1;}
module.exports={capture,markdown};
