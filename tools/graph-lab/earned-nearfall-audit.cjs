#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),lab=require('./core.js'),review=require('./match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const tiers=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const pct=(a,b)=>b?+(100*a/b).toFixed(1):0,avg=(a,b)=>b?+(a/b).toFixed(2):0;
function capture(seeds=8){
 if(!Number.isInteger(seeds)||seeds<1||seeds>16)throw Error('seeds 1..16');
 const rows=[];
 for(const [tier,ring,safe,psych] of tiers)for(const minutes of [12,18])
 for(const plan of ['story','technical','safe']){
  const x={tier,minutes,plan,n:0,stars:0,scheduled:0,backed:0,
   unbacked:0,wrongSource:0,distinct:0,preFinishGap:0,
   final60Actions:0,nearfallTotal:0,heldSlots:0,finishes:{},samples:[]};
  for(let oi=0;oi<4;oi++)for(let k=0;k<seeds;k++){
   const opponents=['ace','silas','red','rev'];
   const opt=lab.makeOptions(D,{wid:'sol',rid:opponents[oi],plan,minutes,slot:'main',
    seed:937121+oi*7817+minutes*9179+k*199,
    finish:k%2?'lose_clean':'win_clean',
    promotion:D.PROMOS[(oi+minutes+k)%D.PROMOS.length].id});
   opt.minutes=minutes;opt.feudHeat=k%2?50:0;
   opt.w={...opt.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
   const m=lab.runMatch(root,opt);
   const events=m.graph.events;
   const IMPACT_FAMILIES=new Set(['strike','running','power','suplex','neck',
     'aerial','springboard','superplex','lucha','dive','corner','rope','outside']);
   const CORE_IMPACTS=new Set(['clothesline','snap_suplex','heavy_slam','power_spinebuster',
     'arm_drag','mat_takedown','short_arm_lariat','target_strike','shoulder_tackle',
     'hip_toss','gutbuster','grapple_trip','headlock_takeover','body_shot']);
   const isImpact=e=>{const a=A[e.id];return !!a&&
     (IMPACT_FAMILIES.has(a.family)||CORE_IMPACTS.has(e.id));};
   const isHit=e=>{const a=A[e.id];return !!a&&!a.reverse&&!a.counterOf&&!a.blockOf&&
    !['rest','setup','pose','taunt'].includes(a.family)&&
    ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
     .every(z=>!e[z]||e[z]==='landed');};
   const hits=events.filter(isHit);
   const scheduled=events.filter(e=>e.id==='scheduled_nearfall');
   x.n++;x.scheduled+=scheduled.length;x.stars+=m.final.stars;
   x.nearfallTotal+=m.nearfalls;
   const finishing=hits.filter(e=>e.t>=m.len-180);
   x.distinct+=new Set(finishing.map(e=>e.id)).size;
   x.final60Actions+=hits.filter(e=>e.t>=m.len-60).length;
   x.preFinishGap+=hits.length?Math.max(0,m.len-hits.at(-1).t):m.len;
   x.finishes[m.graph.outcome?.id]=(x.finishes[m.graph.outcome?.id]||0)+1;
   for(let i=0;i<scheduled.length;i++){
    const count=scheduled[i];const e=events.find(e=>e.t===count.sourceT&&
      e.id===count.sourceMove&&e.preControl===count.sourceSide);
    const credited=count.control,defender=credited==='w'?'f':'w';
    const hit=events.filter(e=>e.t<=count.t&&count.t-e.t<=30&&isHit(e)&&
      e.control===credited&&e.preControl===credited&&
      e.position==='mat'&&e.down===defender&&A[e.id]?.down==='d'&&
      isImpact(e)).at(-1);
    if(count.earned===true&&e&&hit&&e.id===hit.id&&e.t===hit.t){
     x.backed++;
    }else if(count.earned===true){
     x.wrongSource++;
    }else if(hit){
     x.heldSlots++;
    }else x.unbacked++;
    if(x.samples.length<7)x.samples.push({seed:m.o.seed,
      t:count.t,claimedSide:credited,actualSource:count.sourceMove||null,
      lastLegalHit:hit?{id:hit.id,t:hit.t,owner:hit.control}:null});
   }
  }
  rows.push({tier,minutes,plan,bouts:x.n,stars:avg(x.stars,x.n),
   scheduledNearfalls:avg(x.scheduled,x.n),
   provenancePct:pct(x.backed,x.scheduled),strictEarned:x.backed,
   unbacked:x.unbacked,wrongSource:x.wrongSource,
   legacyActuallyGroundedCandidates:x.heldSlots,
   matchNearfallCount:avg(x.nearfallTotal,x.n),
   lateDistinct:avg(x.distinct,x.n),final60Actions:avg(x.final60Actions,x.n),
   finishGapSeconds:avg(x.preFinishGap,x.n),finishTypes:x.finishes,samples:x.samples});
 }
 return {schema:'office-actual-nearfall-provenance-v1',
  bouts:rows.reduce((a,r)=>a+r.bouts,0),
  caveat:'Strict earned means the scheduled count explicitly links to a genuinely recorded in-ring grounded strike/throw by the credited attacker in the last 30s. A previous grounded hit without a recorded source is not treated as earned. Original scheduled counts do not have source IDs; they are considered unproven even when a plausible nearby move exists. Finishes remain prebooked.',rows};
}
function markdown(x){const a=['## Actual earned pin nearfalls and live finishing continuity','',
 x.bouts+' paired seeded genuine bouts. '+x.caveat,'',
 '| Tier | Min | Plan | ★ | Nearfalls/bout | Earned source verified | Unbacked | Late distinct | Final-minute actual offence | Gap to bell |',
 '|---|---:|---|---:|---:|---:|---:|---:|---:|---:|'];
 for(const q of x.rows)a.push('| '+q.tier+' | '+q.minutes+' | '+q.plan+' | '+
  q.stars+' | '+q.scheduledNearfalls+' | '+q.provenancePct+'% | '+q.unbacked+
  ' | '+q.lateDistinct+' | '+q.final60Actions+' | '+q.finishGapSeconds+'s |');
 return a.join('\n');}
if(require.main===module)try{const a=capture(process.argv[2]?Number(process.argv[2]):8);
 if(process.argv.includes('--json-file'))fs.writeFileSync('earned-nearfall-audit.json',JSON.stringify(a,null,2)+'\n');
 console.log(markdown(a));}catch(e){console.error(e.stack);process.exitCode=1}
module.exports={capture,markdown};
