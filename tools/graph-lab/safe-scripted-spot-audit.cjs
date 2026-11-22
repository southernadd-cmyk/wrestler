#!/usr/bin/env node
'use strict';
// Deterministic MECHANICAL A/B for a Safe-only scripted-spot eligibility rule.
// Commentary is audited separately: changing spoken lines is not a change
// to a performed move, earned near fall, match outcome or safety restriction.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),lab=require('./core.js'),review=require('./match-review.cjs');
const PLANS=['safe','technical','story','brawl','spots'];
const WORKERS=['brick','ezra','sol','nico'],OPP=['ace','silas','red','rev'];
const TIERS=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const MINUTES=[12,18];
const SAFE_COVERS=new Set(['arm_drag','grapple_trip','mat_takedown',
 'headlock_takeover','hip_toss','shoulder_tackle']);
const round=n=>Math.round(n*100)/100;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
// Exactness here protects the simulated wrestling, not the booth's wording.
// Keep the complete event ledger and actual consequences in this hash.
const mechanicalTape=(m,events,shots)=>{
 // Phase 9K adds *only* a read-only final evidence summary. Exclude that
 // new diagnostic field from historical exact-match hashes, but retain
 // every existing final value, actual move, booked outcome and consequence.
 // A missing field in the historical baseline is not a wrestling change.
 const {nearfallDrama,...mechanicalFinal}=m.final||{};
 return hash({events,scriptedAttempts:shots,final:mechanicalFinal,
  nearfalls:m.nearfalls,botches:m.botches,stamina:m.wSt});
};
function capture(seeds=2){
 assert.ok(Number.isInteger(seeds)&&seeds>=1&&seeds<=4,'invalid cohort size');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,rows=[];
 const stats=Object.fromEntries(PLANS.map(plan=>[plan,{n:0,stars:0,
  late:0,stamina:0,botches:0,scripted:0,severe:0,elbows:0,
  scriptedLanded:0,earned:0,badCovers:0,booked:0}]));
 for(let wi=0;wi<4;wi++)for(const [tier,ring,safe,psych] of TIERS)
 for(const minutes of MINUTES)for(let oi=0;oi<4;oi++)
 for(let si=0;si<seeds;si++){
  const fixed={wid:WORKERS[wi],rid:OPP[oi],minutes,slot:'main',
   seed:909917+wi*42109+oi*9929+minutes*8093+si*317,
   promotion:D.PROMOS[(wi+oi+minutes+si)%4].id,
   finish:si%2?'lose_clean':'win_clean'};
  for(const plan of PLANS){
   const opt=lab.makeOptions(D,{...fixed,plan});opt.minutes=minutes;
   opt.w={...opt.w,ring,safe,psych,fatigue:4,heat:65,pro:78};
   const m=lab.runMatch(root,opt),events=m.graph.events;
   const s=stats[plan],shots=m.graph.scriptedSpotAttempts||[];
   s.n++;s.stars+=m.final.stars;s.stamina+=m.wSt;
   s.botches+=m.botches||0;s.scripted+=shots.length;
   s.scriptedLanded+=shots.filter(a=>a.outcome==='landed').length;
   s.severe+=shots.filter(a=>a.id!=='ar_elbow_point').length;
   s.elbows+=shots.filter(a=>a.id==='ar_elbow_point').length;
   s.booked+=Number(m.graph.outcome?.id===fixed.finish);
   s.late+=new Set(events.filter(e=>e.t>=m.len-180&&
    e.preControl==='w'&&G.A[e.id]&&!G.A[e.id].reverse&&
    !G.A[e.id].counterOf&&!G.A[e.id].blockOf).map(e=>e.id)).size;
   for(let k=0;k<events.length;k++){
    const e=events[k];if(e.id!=='scheduled_nearfall')continue;
    s.earned++;
    const source=events.slice(0,k).findLast(x=>x.id===e.sourceMove&&
     x.t===e.sourceT&&x.preControl===e.sourceSide&&
     x.control===e.sourceSide&&x.position==='mat'&&
     x.down!==e.sourceSide&&G.A[x.id]&&
     !G.A[x.id].reverse&&!G.A[x.id].counterOf&&!G.A[x.id].blockOf&&
     ['grappleResolution','strikeResolution','contactResolution','aerialResolution']
      .every(y=>!x[y]||x[y]==='landed'));
    if(!e.earned||!source||e.t-source.t>30||e.sourceSide!==e.control||
      (plan==='safe'&&(!SAFE_COVERS.has(e.sourceMove)||G.A[e.sourceMove]?.risk)))
     s.badCovers++;
   }
   const key=[wi,tier,minutes,oi,si,plan].join(':');
   const tape=mechanicalTape(m,events,shots);
   // Preserve commentary comparison as a diagnostic; never require the
   // dialogue hash to match when the engine deliberately improves narration.
   const commentaryTape=hash(m.log);
   rows.push({key,plan,tape,commentaryTape,
    stars:m.final.stars,finish:m.graph.outcome?.id});
  }
 }
 return {schema:'safe-scripted-boundary-ab-v1',seeds,matches:rows.length,
  rows,plans:Object.fromEntries(Object.entries(stats).map(([plan,s])=>
   [plan,{...s,stars:round(s.stars/s.n),
    lateDistinct:round(s.late/s.n),
    stamina:round(s.stamina/s.n),
    earnedPerBout:round(s.earned/s.n),
    botchesPerBout:round(s.botches/s.n)}]))};
}
function compare(before,after){
 assert.equal(before.schema,after.schema);
 assert.equal(before.matches,after.matches);
 assert.equal(after.matches,960,'all 960 real matches must complete');
 const original=new Map(before.rows.map(row=>[row.key,row]));
 const initialSafeRestriction=before.plans.safe.severe>0;
 // The original #156 comparison began before Safe had the scripted gate,
 // so all four OTHER plans had to remain mechanically identical.
 // Once the gate has landed on main, that historical assumption is false:
 // future Brawl / Spot-fest tuning is allowed only for the documented
 // trained-worker, 18-minute cohorts. Safe/Technical/Story mechanics stay exact.
 const protectedPlans=new Set(initialSafeRestriction?
  ['technical','story','brawl','spots']:['safe','technical','story']);
 let identical=0,intendedChanges=0,commentaryChanges=0;
 for(const a of after.rows){
  const b=original.get(a.key);assert.ok(b,'missing matched case '+a.key);
  assert.equal(a.finish,b.finish,'booked finish changed: '+a.key);
  if(a.commentaryTape!==b.commentaryTape)commentaryChanges++;
  if(protectedPlans.has(a.plan)){
   assert.equal(a.tape,b.tape,'unaffected plan MECHANICS changed: '+a.key);
   identical++;
  }else if(!initialSafeRestriction&&a.tape!==b.tape){
   const [worker,tier,minutes]=a.key.split(':');
   // This audit's deliberate post-#156 change touches ONLY the natural
   // elite Brawl and competent Spectacle worker in long matches. Keep
   // the cross-style exactness guard for everyone else.
   const intended=minutes==='18'&&
    (a.plan==='brawl'&&worker==='0'&&tier==='elite'||
     a.plan==='spots'&&worker==='3'&&tier==='competent');
   assert.ok(intended,'unexpected changed match mechanics: '+a.key);
   intendedChanges++;
  }
 }
 assert.equal(original.size,after.rows.length,'unpaired baseline rows');
 for(const plan of PLANS){
  const prev=before.plans[plan],next=after.plans[plan];
  assert.equal(next.n,prev.n,'missing '+plan+' matches');
  assert.equal(next.badCovers,0,plan+': every scheduled cover must have a true source');
  assert.equal(next.booked,next.n,plan+': all booked outcomes must hold');
  assert.equal(prev.booked,prev.n,plan+': baseline booked outcomes must hold');
 }
 const b=before.plans.safe,a=after.plans.safe;
 assert.equal(a.severe,0,'no extreme scripted spots in Safe');
 assert.ok(a.earned>=b.earned*.55,'do not hollow out genuine Safe nearfalls');
 assert.ok(a.stars>=b.stars-.35,'Safe rating may not collapse');
 assert.ok(a.lateDistinct>=b.lateDistinct-1,'Safe late wrestling must remain');
 if(initialSafeRestriction){
  assert.equal(identical,768,'initial Safe-only change must preserve all other plans');
 }else{
  assert.equal(b.severe,0,'baseline was already restricted');
  assert.equal(identical,576,'Safe, Technical and Story mechanics must be identical');
 }
 return {status:'PASS',cases:after.matches,
  baselineMode:initialSafeRestriction?'before Safe restriction':'Safe already restricted',
  unaffectedTapesIdentical:identical,intendedChangedTapes:intendedChanges,
  commentaryChanges,oldSafe:b,newSafe:a};
}
function markdown(r){
 const lines=['## Safe scripted-spot matched audit','',
  r.matches+' real bouts. Original and updated engines use identical five-plan cohorts.','',
  '| Plan | Bouts | Stars | Stamina | Scripted | Extreme | Diving elbow | Sourced near falls | Unverified covers | Late distinct |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const plan of PLANS){
  const s=r.plans[plan];
  lines.push('| '+plan+' | '+s.n+' | '+s.stars+' | '+s.stamina+
  ' | '+s.scripted+' | '+s.severe+' | '+s.elbows+' | '+s.earned+
  ' | '+s.badCovers+' | '+s.lateDistinct+' |');
 }
 return lines.join('\n');
}
if(require.main===module){
 try{
  if(process.argv[2]==='--compare'){
   const before=JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8'));
   const after=JSON.parse(fs.readFileSync(path.resolve(process.argv[4]),'utf8'));
   console.log(JSON.stringify(compare(before,after),null,2));
  }else{
   const count=process.argv[2]?Number(process.argv[2]):2;
   const r=capture(count);
   if(process.argv.includes('--json-file'))
    fs.writeFileSync('safe-scripted-spot-audit.json',JSON.stringify(r,null,2)+'\n');
   console.log(markdown(r));
  }
 }catch(e){console.error(e.stack);process.exitCode=1}
}
module.exports={capture,compare,markdown,mechanicalTape};
