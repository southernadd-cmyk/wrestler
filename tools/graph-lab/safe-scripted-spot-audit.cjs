#!/usr/bin/env node
'use strict';
// Deterministic full-tape A/B for a Safe-only scripted-spot eligibility rule.
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
   const tape=hash({events,log:m.log,scriptedAttempts:shots,
    final:m.final,nearfalls:m.nearfalls,botches:m.botches,stamina:m.wSt});
   rows.push({key,plan,tape,stars:m.final.stars,finish:m.graph.outcome?.id});
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
 let same=0;
 for(const a of after.rows){
  const b=original.get(a.key);assert.ok(b,'missing matched case '+a.key);
  if(a.plan!=='safe'){
   assert.equal(a.tape,b.tape,'non-Safe game tape changed: '+a.key);
   same++;
  }
 }
 assert.equal(same,768,'all four other plans must remain unchanged');
 const b=before.plans.safe,a=after.plans.safe;
 assert.ok(b.severe>0,'baseline must expose the original problem');
 assert.equal(a.severe,0,'no extreme scripted spots in Safe');
 assert.equal(a.badCovers,0,'all Safe nearfalls must cite exact valid source');
 assert.ok(a.earned>=b.earned*.55,'do not erase genuine Safe nearfalls');
 assert.ok(a.stars>=b.stars-.35,'do not hollow out Safe match quality');
 assert.ok(a.lateDistinct>=b.lateDistinct-1,'late real wrestling must remain');
 assert.ok(a.booked>=b.booked,'no extra unbooked outcomes');
 return {status:'PASS',cases:after.matches,nonSafeIdentical:same,
  oldSafe:b,newSafe:a};
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
module.exports={capture,compare,markdown};
