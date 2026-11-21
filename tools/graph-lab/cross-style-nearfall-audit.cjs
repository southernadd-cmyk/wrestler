#!/usr/bin/env node
'use strict';
// Read-only, real-bout provenance audit. Never infer an earned cover from commentary.
const fs=require('node:fs');
const lab=require('./core.js'),review=require('./match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,A=M.GRAPH.A;
const plans=[
 {plan:'technical',wid:'imani',identity:'Technical',note:'mat takedowns and suplexes'},
 {plan:'brawl',wid:'rex',identity:'Brawl',note:'in-ring power and running offence (not floor attacks)'},
 {plan:'spots',wid:'nico',identity:'Spectacle',note:'landed aerial/lucha or grounded impact'},
 {plan:'safe',wid:'brick',identity:'Brawl',note:'controlled, low-risk grounding'}
];
const tiers=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const impactFamilies=new Set(['strike','running','power','suplex','neck','aerial',
 'springboard','superplex','lucha','dive','corner','rope','outside']);
const classicImpacts=new Set(['clothesline','snap_suplex','heavy_slam',
 'power_spinebuster','arm_drag','mat_takedown','short_arm_lariat',
 'target_strike','shoulder_tackle','hip_toss','gutbuster',
 'grapple_trip','headlock_takeover','body_shot']);
const avg=(a,b)=>b?Math.round(a/b*100)/100:0;
const pct=(a,b)=>b?Math.round(1000*a/b)/10:0;
function landed(e){
 const n=A[e.id];
 return !!n&&!n.reverse&&!n.counterOf&&!n.blockOf&&
  ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
   .every(k=>!e[k]||e[k]==='landed');
}
function eligible(e,cover){
 const n=A[e.id],other=cover.control==='w'?'f':'w';
 return landed(e)&&n.down==='d'&&n.zone==='mat'&&
  (impactFamilies.has(n.family)||classicImpacts.has(e.id))&&
  e.preControl===cover.control&&e.control===cover.control&&
  e.position==='mat'&&e.down===other;
}
function capture(seeds=8){
 if(!Number.isInteger(seeds)||seeds<1||seeds>16)throw Error('seeds must be 1..16');
 const rows=[],errors=[];
 for(const choice of plans)for(const [tier,ring,safe,psych] of tiers)
 for(const minutes of [12,18]){
  const x={plan:choice.plan,identity:choice.identity,tier,minutes,worker:choice.wid,
   bouts:0,stars:0,scheduled:0,explicitEarned:0,verified:0,unproven:0,
   possibleRecent:0,noRecent:0,apparentControlDrift:0,nearfallTotal:0,
   last60:0,last180Distinct:0,lastMoveGap:0,groundHits:0,
   floorActions:0,riskyActions:0,finishTypes:{},potentialSources:{},samples:[]};
  const opponents=['silas','red','ace','rev'];
  for(let oi=0;oi<opponents.length;oi++)for(let k=0;k<seeds;k++){
   const opt=lab.makeOptions(D,{wid:choice.wid,rid:opponents[oi],
    plan:choice.plan,minutes,slot:'main',
    seed:621097+oi*7817+minutes*9179+k*199,
    finish:k%2?'lose_clean':'win_clean',
    promotion:D.PROMOS[(oi+minutes+k)%D.PROMOS.length].id});
   opt.minutes=minutes;opt.feudHeat=k%2?50:0;
   opt.w={...opt.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
   const m=lab.runMatch(root,opt),ev=m.graph.events;
   x.bouts++;x.stars+=m.final.stars;x.nearfallTotal+=m.nearfalls;
   const attacks=ev.filter(e=>landed(e)&&['w','f'].includes(e.preControl));
   x.last60+=attacks.filter(e=>e.t>=m.len-60).length;
   x.last180Distinct+=new Set(attacks.filter(e=>e.t>=m.len-180).map(e=>e.id)).size;
   x.lastMoveGap+=attacks.length?Math.max(0,m.len-attacks.at(-1).t):m.len;
   x.floorActions+=attacks.filter(e=>e.position==='outside').length;
   x.riskyActions+=attacks.filter(e=>A[e.id].risk).length;
   x.groundHits+=attacks.filter(e=>{
    const n=A[e.id];return n.down==='d'&&n.zone==='mat'&&
     (impactFamilies.has(n.family)||classicImpacts.has(e.id));}).length;
   const outcome=m.graph.outcome?.id||m.outcome||'(none)';
   x.finishTypes[outcome]=(x.finishTypes[outcome]||0)+1;
   for(let i=0;i<ev.length;i++){
    const cover=ev[i];if(cover.id!=='scheduled_nearfall')continue;
    x.scheduled++;
    const preceding=ev.slice(0,i).filter(e=>
      e.t<=cover.t&&cover.t-e.t<=30);
    const candidates=preceding.filter(e=>eligible(e,cover));
    const candidate=candidates.at(-1)||null;
    if(candidate){
     x.possibleRecent++;
     x.potentialSources[candidate.id]=(x.potentialSources[candidate.id]||0)+1;
    }else x.noRecent++;
    const lastActor=preceding.filter(e=>landed(e)&&
      ['w','f'].includes(e.control)).at(-1);
    if(lastActor&&lastActor.control!==cover.control)x.apparentControlDrift++;
    if(cover.earned===true){
     x.explicitEarned++;
     const exact=candidates.find(e=>e.id===cover.sourceMove&&
       e.t===cover.sourceT&&e.preControl===cover.sourceSide&&
       e.control===cover.control);
     if(exact)x.verified++;
     else errors.push(choice.plan+' '+tier+' '+minutes+
      ' unverified earned cover at '+cover.t);
    }else x.unproven++;
    if(x.samples.length<5)x.samples.push({seed:opt.seed,
     t:cover.t,credited:cover.control,sourceMove:cover.sourceMove||null,
     recentCandidate:candidate?{id:candidate.id,t:candidate.t}:null,
     precedingActor:lastActor?.control||null});
   }
  }
  rows.push({...x,stars:avg(x.stars,x.bouts),
   scheduledPerBout:avg(x.scheduled,x.bouts),
   provenPct:pct(x.verified,x.scheduled),
   possibleRecentPct:pct(x.possibleRecent,x.scheduled),
   apparentControlDriftPct:pct(x.apparentControlDrift,x.scheduled),
   nearfallTotalPerBout:avg(x.nearfallTotal,x.bouts),
   lateDistinct:avg(x.last180Distinct,x.bouts),
   finalMinuteActions:avg(x.last60,x.bouts),
   finishGapSeconds:avg(x.lastMoveGap,x.bouts),
   commonCandidates:Object.entries(x.potentialSources)
    .sort((a,b)=>b[1]-a[1]).slice(0,8)});
 }
 return {schema:'office-cross-plan-nearfall-provenance-v1',
  bouts:rows.reduce((a,x)=>a+x.bouts,0),errors,
  caveats:[
   'Explicit proven requires a recorded source move, time and owner matched to a genuinely performed grounded action.',
   'A move within 30 seconds is only a plausible candidate, NOT proof of a valid cover or credited control.',
   'Apparent control drift compares the last landed event within 30s, not the hidden position at scheduler entry.',
   'The plan is tested with a native-style featured worker except Safe, which uses a reliably trained Brawl worker.',
   'Only scheduled nearfalls are tested; organic graph pin attempts have separate mechanics.',
   'Finishes remain booked. This script changes no match code.'
  ],rows};
}
function markdown(result){
 const lines=['## Cross-style near-fall source audit','',
  result.bouts+' completed real OfficeMatch bouts. Zero match-engine changes.','',
  '| Plan | Skill | Min | ★ | Timed covers/bout | Exact source verified | Nearby plausible setup (not proof) | Apparent control drift | Late distinct | Last 60s attacks |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const r of result.rows)lines.push('| '+r.plan+' | '+r.tier+' | '+r.minutes+
  ' | '+r.stars+' | '+r.scheduledPerBout+' | '+r.provenPct+
  '% | '+r.possibleRecentPct+'% | '+r.apparentControlDriftPct+
  '% | '+r.lateDistinct+' | '+r.finalMinuteActions+' |');
 lines.push('','Caveats: '+result.caveats.join(' '),'');
 for(const plan of plans){
  const relevant=result.rows.filter(r=>r.plan===plan.plan&&r.minutes===18&&r.tier==='elite');
  lines.push('**'+plan.plan+'**: native worker '+plan.wid+
   '; candidate setup types: '+plan.note+'. Elite 18 min examples: '+
   JSON.stringify(relevant[0]?.commonCandidates||[]));
 }
 return lines.join('\n')+'\n';
}
if(require.main===module)try{
 const r=capture(process.argv[2]?Number(process.argv[2]):8);
 if(process.argv.includes('--json-file'))
  fs.writeFileSync('cross-style-nearfall-audit.json',JSON.stringify(r,null,2)+'\n');
 console.log(markdown(r));if(r.errors.length)process.exitCode=1;
}catch(e){console.error(e.stack);process.exitCode=1}
module.exports={capture,markdown};
