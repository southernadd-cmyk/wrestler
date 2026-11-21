#!/usr/bin/env node
'use strict';
const lab=require('./core.js'),review=require('./match-review.cjs');
const TIERS=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]],OPP=['ace','silas','red','rev'];
const HOPE=new Set(['hope','second_hope']);
function capture(seeds=12){
 if(!Number.isInteger(seeds)||seeds<1||seeds>24)throw Error('Use 1..24 seeds');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,A=M.GRAPH.A,rows=[];
 for(const [tier,ring,safe,psych] of TIERS)for(const minutes of [12,18]){
  const out={tier,minutes,bouts:0,hopeVisits:0,hopeReversals:0,
   actualHopeW:0,realCounterAfterPressure:0,followthrough:0,
   lastActions:[],outcomes:{},workedHopeBouts:0};
  for(let oi=0;oi<OPP.length;oi++)for(let i=0;i<seeds;i++){
   const opt=lab.makeOptions(D,{wid:'sol',rid:OPP[oi],plan:'story',minutes,slot:'main',
    seed:937121+oi*7817+minutes*9179+i*199,
    finish:i%2?'lose_clean':'win_clean',
    promotion:D.PROMOS[(oi+minutes+i)%D.PROMOS.length].id});
   opt.minutes=minutes;opt.feudHeat=i%2?50:0;
   opt.w={...opt.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
   const m=lab.runMatch(root,opt),events=m.graph.events||[];
   const good=e=>!!A[e.id]&&!A[e.id].reverse&&!A[e.id].counterOf&&!A[e.id].blockOf&&
    ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
     .every(k=>!e[k]||e[k]==='landed');
   out.bouts++;out.hopeVisits+=m.graph.history.filter(k=>HOPE.has(k)).length;
   let had=false;
   for(let k=0;k<events.length;k++){
    const e=events[k];
    if(!HOPE.has(e.arc))continue;
    if(e.preControl==='w'&&good(e)){out.actualHopeW++;had=true;}
    if(e.id==='counter_strike'&&e.reverse&&e.preControl==='f'&&e.control==='w'){
     out.hopeReversals++;
     const pressure=events.slice(0,k).some(q=>
      q.preControl==='f'&&q.control==='f'&&e.t-q.t<=130&&
      ['cutoff','control','limb_work','floor_heat','denial'].includes(q.arc)&&good(q));
     if(pressure)out.realCounterAfterPressure++;
     const follow=events.slice(k+1).find(q=>q.t>e.t);
     if(follow&&follow.t-e.t<=20&&follow.preControl==='w'&&
      HOPE.has(follow.arc)&&good(follow)){
      out.followthrough++;
      if(out.lastActions.length<6)out.lastActions.push({seed:m.o.seed,counter:e.id,follow:follow.id,at:follow.t});
     }
    }
   }
   out.workedHopeBouts+=had;
   out.outcomes[m.graph.outcome?.id]=(out.outcomes[m.graph.outcome?.id]||0)+1;
  }
  rows.push({...out,workedHopePct:+(100*out.workedHopeBouts/out.bouts).toFixed(1),
   reversalsPerBout:+(out.hopeReversals/out.bouts).toFixed(2),
   followthroughPerBout:+(out.followthrough/out.bouts).toFixed(2)});
 }
 return {schema:'story-earned-hope-trace-v1',seeds,totalBouts:rows.reduce((v,r)=>v+r.bouts,0),
  note:'Genuine action events. The defensive reversal originates with opponent control, then flips to the actual Story wrestler; only a subsequently landed Story-owned action in the hope arc earns hope follow-through. No scheduled commentary is included.',rows};
}
function markdown(x){
 const a=['## Story hope reversal and actual performed follow-through','',
  x.totalBouts+' real matches. '+x.note,'',
  '| Tier | Minutes | Bouts | Hope arc visits | Real defensive reversals | Reversals after real heat | Legal earned follow-through | Bouts with actual hope move |',
  '|---|---:|---:|---:|---:|---:|---:|---:|'];
 for(const r of x.rows)a.push('| '+r.tier+' | '+r.minutes+' | '+r.bouts+
  ' | '+r.hopeVisits+' | '+r.hopeReversals+' | '+r.realCounterAfterPressure+
  ' | '+r.followthrough+' | '+r.workedHopePct+'% |');
 return a.join('\n');
}
if(require.main===module)try{const x=capture(process.argv[2]?Number(process.argv[2]):12);
 if(process.argv.includes('--json-file'))require('node:fs').writeFileSync('story-hope-trace.json',JSON.stringify(x,null,2)+'\n');
 console.log(markdown(x));}catch(e){console.error(e.stack);process.exitCode=1}
module.exports={capture,markdown};
