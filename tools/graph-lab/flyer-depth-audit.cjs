#!/usr/bin/env node
'use strict';
// Phase 7 flyer diagnostic. Runs the real OfficeMatch engine without editing
// match rules or career saves. Synthetic tiers are controlled skill treatments
// on the SAME wrestler, not claims about anyone on the live roster.
const lab=require('./core.js'),review=require('./match-review.cjs');
const PLANS=['spots','technical','brawl','story','safe'];
const LEVELS=[
 {id:'novice',ring:50,safe:45,psych:52},
 {id:'competent',ring:73,safe:68,psych:70},
 {id:'elite',ring:92,safe:91,psych:84}
];
const OPPONENTS=[
 {id:'ace',style:'Spectacle'}, {id:'silas',style:'Technical'},
 {id:'red',style:'Brawl'}, {id:'rev',style:'Story'}
];
const LENGTHS=[8,12,18];
const REAL_FLYERS=['kit','lyra','nico','ace'];
const round=(v,n=2)=>+Number(v).toFixed(n);
const percent=(v,n)=>n?round(v/n*100,1):0;
const percentile=(values,p)=>{
 const sorted=values.slice().sort((a,b)=>a-b);
 return sorted[Math.min(sorted.length-1,Math.floor(p*(sorted.length-1)))];
};
function stats(){
 return {n:0,stars:0,starsList:[],quality:0,earlySum:0,earlyN:0,
  lateSum:0,lateN:0,endStamina:0,exhausted:0,botches:0,injuries:0,
  peakCrowd:0,nearfalls:0,spotHits:0,spotAttempts:0,
  riskLanded:0,lateRiskLanded:0,lateUniqueRisk:0,
  lateWorkerRiskLanded:0,lateWorkerDistinctRisk:0,lateWorkerAnyRisk:0,
  lateWorkerTwoRisk:0,lateWorkerAerialSetups:0,
  lateWorkerAerialAttempts:0,lateWorkerAerialLanded:0,
  earnedBell:0,showcase:0,recovery:0,
  aerialAttempts:0,aerialLanded:0,aerialCounter:0,aerialBlock:0,
  aerialAborted:0,aerialInterrupted:0,scriptAttempts:0,scriptLanded:0,
  finalStar4:0,finalStar45:0,finalStar35:0,distinctMoveIds:new Set()};
}
function collect(row,m,engine){
 const G=engine.GRAPH,events=m.graph?.events||[],stars=m.final.stars;
 row.n++;row.stars+=stars;row.starsList.push(stars);
 row.endStamina+=m.wSt;row.exhausted+=m.wSt<25?1:0;
 row.botches+=m.botches;row.injuries+=m.final?.injury>0?1:0;
 row.peakCrowd+=m.crowdPeak;row.nearfalls+=m.nearfalls;
 row.spotHits+=m.spotHits;row.spotAttempts+=m.spots;
 row.earnedBell+=engine._earnedPlanQuality(m);
 row.finalStar35+=stars>=3.5?1:0;
 row.finalStar4+=stars>=4?1:0;
 row.finalStar45+=stars>=4.5?1:0;
 for(const [key,,score] of m.final.starParts||[])
  if(key==='showcase')row.showcase+=score;
 const recent=new Set(),workerRecent=new Set();
 for(const e of events){
  if(e.t>=m.len-180&&e.preControl==='w'&&
     (e.id==='top_climb'||e.id==='springboard_rise'))
   row.lateWorkerAerialSetups++;
  const a=G.A[e.id];
  if(a)row.distinctMoveIds.add(e.id);
  if(e.id==='catch_breath'&&e.preControl==='w')row.recovery++;
  if(!a?.risk||a.reverse||a.counterOf||a.blockOf||
     !['w','f'].includes(e.preControl)||
     (e.aerialResolution&&e.aerialResolution!=='landed')||
     (e.grappleResolution&&e.grappleResolution!=='landed')||
     (e.strikeResolution&&e.strikeResolution!=='landed')||
     (e.contactResolution&&e.contactResolution!=='landed'))continue;
  row.riskLanded++;
  if(e.t>=m.len-180){
   row.lateRiskLanded++;
   recent.add(e.preControl+':'+e.id);
   if(e.preControl==='w'){
    row.lateWorkerRiskLanded++;
    workerRecent.add(e.id);
   }
  }
 }
 row.lateUniqueRisk+=recent.size;
 row.lateWorkerDistinctRisk+=workerRecent.size;
 if(workerRecent.size>0)row.lateWorkerAnyRisk++;
 if(workerRecent.size>=2)row.lateWorkerTwoRisk++;
 for(const e of m.graph?.aerialAttempts||[]){
  if(e.side==='w'&&e.startedT>=m.len-180){
   row.lateWorkerAerialAttempts++;
   if(e.outcome==='landed')row.lateWorkerAerialLanded++;
  }
  row.aerialAttempts++;
  if(e.outcome==='landed')row.aerialLanded++;
  else if(e.outcome==='counter')row.aerialCounter++;
  else if(e.outcome==='block')row.aerialBlock++;
  else if(e.outcome==='aborted')row.aerialAborted++;
  else if(e.outcome==='interrupted')row.aerialInterrupted++;
  else throw Error('Unresolved aerial attempt '+String(e.outcome));
 }
 for(const e of m.graph?.scriptedSpotAttempts||[]){
  row.scriptAttempts++;
  if(e.outcome==='landed')row.scriptLanded++;
  else if(e.outcome!=='botched')throw Error('Unresolved scripted spot '+String(e.outcome));
 }
 for(const tick of m.flow||[]){
  if(tick[0]<m.len*.35){row.earlySum+=tick[4];row.earlyN++;}
  else if(tick[0]>=m.len*.65){row.lateSum+=tick[4];row.lateN++;}
 }
 row.quality+=(m.qN?m.qSum/m.qN:0);
}
function finalise(id,row,meta={}){
 if(!row.n)throw Error('Empty audit cell '+id);
 return {id,...meta,matches:row.n,
  avgStars:round(row.stars/row.n,3),p90Stars:percentile(row.starsList,.9),
  bestStars:Math.max(...row.starsList),
  rate35:percent(row.finalStar35,row.n),rate4:percent(row.finalStar4,row.n),
  rate45:percent(row.finalStar45,row.n),
  avgQ:round(row.quality/row.n),earlyQ:round(row.earlySum/row.earlyN),
  lateQ:round(row.lateSum/row.lateN),
  staminaAtBell:round(row.endStamina/row.n),
  exhaustedPct:percent(row.exhausted,row.n),
  peakCrowd:round(row.peakCrowd/row.n),
  botchesPerMatch:round(row.botches/row.n,3),
  injuryPct:percent(row.injuries,row.n),
  nearfallsPerMatch:round(row.nearfalls/row.n),
  genericSpotsPerMatch:round(row.spotAttempts/row.n),
  genericSpotHitsPerMatch:round(row.spotHits/row.n),
  riskLandedPerMatch:round(row.riskLanded/row.n),
  lateRiskPerMatch:round(row.lateRiskLanded/row.n),
  uniqueLateRiskPerMatch:round(row.lateUniqueRisk/row.n),
  lateFlyerRiskPerMatch:round(row.lateWorkerRiskLanded/row.n),
  lateDistinctFlyerRiskPerMatch:round(row.lateWorkerDistinctRisk/row.n),
  lateFlyerAnyRiskPct:percent(row.lateWorkerAnyRisk,row.n),
  lateFlyerTwoRiskPct:percent(row.lateWorkerTwoRisk,row.n),
  lateFlyerSetupsPerMatch:round(row.lateWorkerAerialSetups/row.n),
  lateFlyerAerialAttemptsPerMatch:round(row.lateWorkerAerialAttempts/row.n),
  lateFlyerAerialLandedPerMatch:round(row.lateWorkerAerialLanded/row.n),
  earnedAtBell:round(row.earnedBell/row.n,3),
  showcaseStars:round(row.showcase/row.n,3),
  recoveryPerMatch:round(row.recovery/row.n),
  aerialAttemptPerMatch:round(row.aerialAttempts/row.n),
  aerialLandedPerMatch:round(row.aerialLanded/row.n),
  aerialCounterPerMatch:round(row.aerialCounter/row.n),
  aerialBlockPerMatch:round(row.aerialBlock/row.n),
  aerialAbortedPerMatch:round(row.aerialAborted/row.n),
  aerialInterruptedPerMatch:round(row.aerialInterrupted/row.n),
  scriptedAttemptsPerMatch:round(row.scriptAttempts/row.n),
  scriptedLandedPerMatch:round(row.scriptLanded/row.n),
  distinctMoveIds:row.distinctMoveIds.size};
}
function capture(n=6){
 if(!Number.isInteger(n)||n<1||n>20)throw Error('Expected 1..20 seeds per skill/opponent/length cohort');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch;
 const roster=lab.roster(D),byId=new Map(roster.map(w=>[w.id,w]));
 for(const id of ['lyra',...REAL_FLYERS,...OPPONENTS.map(x=>x.id),'nova'])
  if(!byId.has(id))throw Error('Missing authored wrestler '+id);
 const group=new Map(),lengths=new Map(),opponents=new Map(),
       real=new Map(),headliner=new Map();
 const cell=(map,key)=>{if(!map.has(key))map.set(key,stats());return map.get(key);};
 let total=0;
 function run(input,mods,targets){
  const opt=lab.makeOptions(D,input);
  opt.minutes=input.minutes;
  if(mods){
   opt.w={...opt.w,...mods.w};
   if(mods.f)opt.f={...opt.f,...mods.f};
   if(mods.feudHeat!==undefined)opt.feudHeat=mods.feudHeat;
   if(mods.preparation)opt.preparation=mods.preparation;
  }
  if(opt.w.id===opt.f.id)throw Error('Self match');
  const match=lab.runMatch(root,opt);
  for(const bucket of targets)collect(bucket,match,M);
  total++;
 }
 // Strictly paired: each five-plan group reuses wrestler identity, opponent,
 // duration, promotion, seed, booked finish and all tier statistics.
 // Promotions rotate *across* groups and never change within a paired group.
 for(const tier of LEVELS)for(let oi=0;oi<OPPONENTS.length;oi++){
  const opp=OPPONENTS[oi];
  for(const minutes of LENGTHS)for(let i=0;i<n;i++){
   const seed=880041+oi*7919+minutes*9191+i*193;
   const promotion=D.PROMOS[(oi+minutes+i)%D.PROMOS.length].id;
   const finish=i%2?'lose_clean':'win_clean';
   for(const plan of PLANS){
    const key=tier.id+'/'+plan,options={
     wid:'lyra',rid:opp.id,plan,minutes,seed,promotion,slot:'main',finish};
    const buckets=[cell(group,key)];
    if(plan==='spots'){
     buckets.push(cell(lengths,tier.id+'/'+minutes));
     buckets.push(cell(opponents,tier.id+'/'+opp.style));
    }
    run(options,{w:{
     ring:tier.ring,safe:tier.safe,psych:tier.psych,
     heat:65,fatigue:4,pro:78
    }},buckets);
   }
  }
 }
 // Real wrestler check: no edited stats. Same sampled opponent, promoter,
 // seed and duration within all five plans, so plan comparisons are matched.
 const realN=2*n;
 for(const wid of REAL_FLYERS)for(let i=0;i<realN;i++){
  const opp=OPPONENTS[(i+REAL_FLYERS.indexOf(wid))%OPPONENTS.length];
  const rid=opp.id===wid?'rev':opp.id;
  const input={wid,rid,slot:'main',minutes:12,finish:i%2?'lose_clean':'win_clean',
   seed:771109+i*313,promotion:D.PROMOS[i%D.PROMOS.length].id};
  for(const plan of PLANS)
   run({...input,plan},null,[cell(real,wid+'/'+plan)]);
 }
 // An explicitly favourable upper-ceiling scenario, not a fair estimate of
 // ordinary show ratings: elite trained worker, experienced opponent,
 // strong feud/heat, 20-minute main event, and a spots-friendly promoter.
 for(let i=0;i<10*n;i++){
  const input={wid:'lyra',rid:'nova',slot:'main',minutes:20,
   finish:i%2?'lose_clean':'win_clean',seed:990071+i*137,
   promotion:'pulse'};
  for(const plan of PLANS)
   run({...input,plan},{w:{ring:94,safe:93,psych:90,heat:90,
     fatigue:0,pro:92},f:{ring:88,safe:91,psych:85,heat:83},
     feudHeat:70,preparation:{ring:3,psych:3,safe:3}},
     [cell(headliner,plan)]);
 }
 const rows=(map,fn)=>[...map.entries()].map(([id,s])=>finalise(id,s,fn(id)));
 const matrix=rows(group,id=>{const [tier,plan]=id.split('/');return {tier,plan};});
 const lengthRows=rows(lengths,id=>{const [tier,minutes]=id.split('/');return {tier,minutes:+minutes};});
 const opponentRows=rows(opponents,id=>{const [tier,opponent]=id.split('/');return {tier,opponent};});
 const realRows=rows(real,id=>{const [wid,plan]=id.split('/');const w=byId.get(wid);
  return {wid,worker:w.name,plan,ring:w.ring,safe:w.safe,psych:w.psych};});
 const headlineRows=rows(headliner,id=>({plan:id}));
 return {schema:'office-flyer-depth-audit-v1',
  engine:'live OfficeMatch; no scoring changes or persisted career saves',
  n,matchedGroups:LEVELS.length*OPPONENTS.length*LENGTHS.length*n,
  totalMatches:total,
  tiers:LEVELS,opponents:OPPONENTS,lengths:LENGTHS,plans:PLANS,
  controlledFixture:'Lyra identity with ring/safety/psych modified; all other worker parameters held fixed (heat 65, fatigue 4, professionalism 78)',
  realFlyers:REAL_FLYERS.map(id=>({id,name:byId.get(id).name,
   ring:byId.get(id).ring,safe:byId.get(id).safe,psych:byId.get(id).psych})),
  upperCeiling:'Hypothetical high-heat, highly trained main event with Nova at Pulse (spot-preferring). Not representative of ordinary bookings.',
  matrix,lengthRows,opponentRows,realRows,headlineRows};
}
function failures(r){
 const expected=3*4*3*r.n*5+REAL_FLYERS.length*2*r.n*5+10*r.n*5;
 const errors=[];
 if(r.totalMatches!==expected)errors.push('Incomplete bouts: '+r.totalMatches+' / '+expected);
 if(r.matchedGroups!==3*4*3*r.n)errors.push('Incorrect paired group count');
 if(r.matrix.length!==15||r.lengthRows.length!==9||
    r.opponentRows.length!==12||r.realRows.length!==20||r.headlineRows.length!==5)
  errors.push('Missing comparison rows');
 for(const row of [...r.matrix,...r.lengthRows,...r.opponentRows,...r.realRows,...r.headlineRows]){
  if(!row.matches||!Number.isFinite(row.avgStars)||row.avgStars<0||row.avgStars>5)
   errors.push('Invalid match result '+row.id);
  if(row.aerialAttemptPerMatch<row.aerialLandedPerMatch)
   errors.push('Impossible aerial ledger '+row.id);
  if(row.rate45>row.rate4||row.rate4>row.rate35)
   errors.push('Impossible star threshold '+row.id);
 }
 return errors;
}
function markdown(r){
 const out=['## The Office — dedicated flyer-depth audit','',
  'Real OfficeMatch engine: **'+r.totalMatches+'** seeded bouts. **'+
  r.matchedGroups+'** controlled five-plan groups. No game code or saved career modified.','',
  '**Method:** The controlled rows train the SAME Lyra character hypothetically to three ring/safety/psych levels. Four fixed opponents, 8/12/18-minute matches, alternating booked clean winners, and all four promotions rotate across groups; each five-plan group holds all other inputs constant. These are mechanical comparisons, not existing roster ratings.','',
  '### Controlled flyer skill × five plans','',
  '| Tier | Plan | Mean ★ | P90 ★ | ≥4★ | Early Q | Late Q | Bell stamina | <25 stamina | Botches/match | Risk moves late/match | Earned quality at bell |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const a of r.matrix)out.push('| '+a.tier+' | '+a.plan+' | '+a.avgStars.toFixed(2)+
  ' | '+a.p90Stars.toFixed(2)+' | '+a.rate4+'% | '+a.earlyQ+' | '+a.lateQ+
  ' | '+a.staminaAtBell+' | '+a.exhaustedPct+'% | '+a.botchesPerMatch+
  ' | '+a.lateRiskPerMatch+' | '+a.earnedAtBell+' |');
 out.push('','### Spot-fest by duration','',
  '| Tier | Minutes | ★ | Late Q | Bell stamina | Aerial attempts/match | Aerial landed/match | Real recovery/match | Late distinct risk (both)/match | Late distinct risk (flyer)/match | Flyer >=1 late risk | Flyer >=2 late risks | Late flyer setups/match | Late flyer landed aerials/match |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
 for(const a of r.lengthRows)out.push('| '+a.tier+' | '+a.minutes+' | '+a.avgStars+
  ' | '+a.lateQ+' | '+a.staminaAtBell+' | '+a.aerialAttemptPerMatch+
  ' | '+a.aerialLandedPerMatch+' | '+a.recoveryPerMatch+' | '+a.uniqueLateRiskPerMatch+
  ' | '+a.lateDistinctFlyerRiskPerMatch+' | '+a.lateFlyerAnyRiskPct+'% | '+a.lateFlyerTwoRiskPct+'% | '+a.lateFlyerSetupsPerMatch+
  ' | '+a.lateFlyerAerialLandedPerMatch+' |');
 out.push('','### Elite Spot-fest against fixed opponents','',
  '| Opponent style | ★ | Botches/match | Late Q | Bell stamina | Late distinct risk/match |',
  '|---|---:|---:|---:|---:|---:|');
 for(const a of r.opponentRows.filter(x=>x.tier==='elite'))
  out.push('| '+a.opponent+' | '+a.avgStars+' | '+a.botchesPerMatch+
  ' | '+a.lateQ+' | '+a.staminaAtBell+' | '+a.uniqueLateRiskPerMatch+' |');
 out.push('','### Actual unmodified flyers, 12-minute matches','',
  '| Wrestler | Ring | Safety | Spot-fest ★ | Best plan ★ | Spot-fest final stamina |',
  '|---|---:|---:|---:|---|---:|');
 for(const w of r.realFlyers){
  const choices=r.realRows.filter(x=>x.wid===w.id),spot=choices.find(x=>x.plan==='spots');
  const best=choices.slice().sort((a,b)=>b.avgStars-a.avgStars)[0];
  out.push('| '+w.name+' | '+w.ring+' | '+w.safe+' | '+spot.avgStars+
   ' | '+best.plan+' ('+best.avgStars+') | '+spot.staminaAtBell+' |');
 }
 out.push('','### Explicitly favourable elite headliner (20 minutes, Pulse, hot feud)','',
  '| Plan | Mean ★ | Best ★ | ≥4★ | ≥4.5★ | Bell stamina | Late Q |',
  '|---|---:|---:|---:|---:|---:|---:|');
 for(const a of r.headlineRows)out.push('| '+a.plan+' | '+a.avgStars+
  ' | '+a.bestStars+' | '+a.rate4+'% | '+a.rate45+'% | '+a.staminaAtBell+' | '+a.lateQ+' |');
 out.push('','**Metrics:** Late Q is last 35% of ten-second match ticks; late risky moves and earned quality use the engine’s actual final 180 seconds. The old late distinct risk metric includes both wrestlers; the added flyer-only metrics count the booked worker, not the opponent. Earned quality at bell is a recent-move *quality input*, not a direct star amount. Aerial attempts come from the exact-parent aerial ledger; scripted spots are measured separately, avoiding false combined totals. Star thresholds include all match results. Real-flyer and opponent comparisons retain the actual opponent skill mix; only the five plans are matched within a scenario.','',
  '**Checks:** '+(failures(r).length?'FAILED: '+failures(r).join('; '):'PASS — paired groups complete, ledger and star thresholds consistent')+'.','');
 return out.join('\n');
}
if(require.main===module){
 try{
  const n=process.argv[2]?Number(process.argv[2]):6;
  const r=capture(n);
  if(process.argv.includes('--json-file'))
   require('node:fs').writeFileSync('flyer-depth-audit.json',JSON.stringify(r,null,2)+'\n');
  console.log(process.argv.includes('--json')?JSON.stringify(r,null,2):markdown(r));
  if(failures(r).length)process.exitCode=1;
 }catch(e){console.error(e.stack);process.exitCode=1;}
}
module.exports={capture,failures,markdown,LEVELS,PLANS,OPPONENTS,LENGTHS};
