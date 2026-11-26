'use strict';
// R7 / fuzzy baseline: actual choices against the current unmodified policy.
// Focus workers are sampled equally on each speaking side; report exact
// sampled use, not theoretical catalogue capacity or a subjective quality score.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeAcademy:A,OfficeGame:G,OfficeWorldV4:V,OfficeMic:M,OfficePromoIdentity:I,OfficePromoDialogue:L}=root;
const clone=x=>JSON.parse(JSON.stringify(x));
const inc=(o,k,n=1)=>o[k]=(o[k]||0)+n;
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[“”‘’"'.,!?;:—–-]/g,' ').replace(/\s+/g,' ').trim();
G.fresh();const s=G.S;s.seed=47;s.careerSeed=47;
const veterans=D.ALL.slice(),rookies=[];
for(let season=2;season<=40&&rookies.length<A.REGISTER.length;season++){
 s.season=season;
 if(season>2){
  for(const div of ['men','women']){
   const active=D.ALL.filter(w=>D.divisionOf(w)===div&&s.worldV4.contracts[w.id]?.owner!=='retired').slice(0,3);
   for(const w of active){s.worldV4.contracts[w.id].owner='retired';s.free=s.free.filter(f=>f.id!==w.id);}
  }
  V.activate(s);
 }
 rookies.push(...A.intake(s,season));
}
assert.equal(veterans.length,80);assert.equal(rookies.length,120);
const roster=[...veterans,...rookies];assert.equal(new Set(roster.map(w=>w.id)).size,200);
function bucket(){return {scenes:0,spoken:0,words:0,authored:0,own:0,shared:0,composed:0,graph:0,semanticReplies:0,semanticLinked:0,semanticMissingOrDifferent:0,opponentTurns:0,opponentClaims:0,rollingRepeat:0,withinSceneRepeat:0,protected:0,formats:{},actions:{},routes:{},sources:{},events:{},stances:{},delivery:{},emotions:{observations:0,composureSum:0,irritationSum:0,composureMin:100,composureMax:0,irritationMin:100,irritationMax:0,irritation30to44:0,irritation60to69:0,composure25to44:0,composureChanges:0,irritationChanges:0},lines:new Map(),owners:new Set(),authoredIds:new Set()};}
// Per-policy histories are isolated: each policy sees its own actual prior lines.
const transcripts=[];
const finishes=['win_clean','lose_clean','win_dirty','lose_protected'];
const schedules=[
 {open:'proof',answer:'turn',push:'press',close:'vow'},
 {open:'proof',answer:'turn',push:'press',close:'vow'},
 {open:'people',answer:'calm',push:'acknowledge',close:'clean'},
 {open:'people',answer:'calm',push:'acknowledge',close:'clean'},
 {open:'swagger',answer:'personal',push:'hold',close:'vow'},
 {open:'swagger',answer:'personal',push:'hold',close:'vow'},
 {open:'imagery',answer:'challenge',push:'leave',close:'uncertainty'},
 {open:'imagery',answer:'challenge',push:'leave',close:'uncertainty'}
];
function observe(a,worker,side,st,prior,emotionTrace,actions){
 a.scenes++;a.owners.add(worker.id);inc(a.formats,st.director?.format||'none');inc(a.events,st.director?.event?.kind||'none');
 inc(a.stances,st.director[side==='w'?'player':'opponent'].stance);inc(a.delivery,I.wrestler(worker).delivery);
 for(const action of actions)inc(a.actions,action.round+'|'+action.id);
 const seen=new Set(),selected=new Set();
 for(const e of emotionTrace){
  const b=a.emotions;for(const k of ['composure','irritation'])assert.ok(Number.isFinite(e[k])&&e[k]>=0&&e[k]<=100,worker.id+' emotion bounds');
  b.observations++;b.composureSum+=e.composure;b.irritationSum+=e.irritation;
  b.composureMin=Math.min(b.composureMin,e.composure);b.composureMax=Math.max(b.composureMax,e.composure);
  b.irritationMin=Math.min(b.irritationMin,e.irritation);b.irritationMax=Math.max(b.irritationMax,e.irritation);
  if(e.irritation>=30&&e.irritation<=44)b.irritation30to44++;
  if(e.irritation>=60&&e.irritation<=69)b.irritation60to69++;
  if(e.composure>=25&&e.composure<=44)b.composure25to44++;
 }
 for(let i=1;i<emotionTrace.length;i++){
  if(emotionTrace[i].composure!==emotionTrace[i-1].composure)a.emotions.composureChanges++;
  if(emotionTrace[i].irritation!==emotionTrace[i-1].irritation)a.emotions.irritationChanges++;
 }
 for(const e of st.log.filter(e=>e.side===side)){
  const text=norm(e.line);assert.ok(text,worker.id+' empty speech');assert.doesNotMatch(e.line,/\{[A-Za-z_][A-Za-z_0-9]*\}/,worker.id+' unresolved token');
  a.spoken++;a.words+=text.split(' ').length;
  if(prior.has(text))a.rollingRepeat++;
  if(seen.has(text))a.withinSceneRepeat++;
  seen.add(text);
  let row=a.lines.get(text);if(!row)a.lines.set(text,row={count:0,owners:new Set()});row.count++;row.owners.add(worker.id);
  if(e.dialogueSlot?.protected)a.protected++;
  if(e.authoredId){
   a.authored++;a.authoredIds.add(e.authoredId);
   if(e.authoredId.startsWith(worker.id+'.')){a.own++;inc(a.sources,'own');}
   else if(/^rookie-(?:family|vow)-/.test(e.authoredId)){
    a.shared++;inc(a.sources,'rookie-shared');
    assert.ok(!st.authoredDialogue.recent.includes(e.authoredId),worker.id+' shared ID in recent history');
    assert.ok(!selected.has(e.authoredId),worker.id+' duplicate shared ID in same scene');
    assert.ok(!['recorded-argument','recorded-evidence','specific-match-plan'].includes(e.dialogueSlot?.protected),'protected scene replaced');
   }else inc(a.sources,'other-authored');
   selected.add(e.authoredId);
  }else if(e.composedId){a.composed++;inc(a.sources,'composed');}
  else {a.graph++;inc(a.sources,'graph-or-director');}
  if(side==='f'){a.opponentTurns++;if(e.semantic?.kind==='claim')a.opponentClaims++;}
  if(e.semantic?.move){
   a.semanticReplies++;const key=[e.semantic.claim,e.semantic.move,side].join('|');
   const route=a.routes[key]??={n:0,authored:0,linked:0};route.n++;if(e.authoredId)route.authored++;
   const preceding=st.log[e.semantic.replyTo];
   const linked=!!preceding&&preceding.side!==side&&preceding.semantic?.claim===e.semantic.claim;
   if(linked){a.semanticLinked++;route.linked++;}else a.semanticMissingOrDifferent++;
   if(e.semantic.rookieFamilyBank===1)assert.ok(linked,'reviewed shared semantic line lost its claim');
  }
 }
}
const paired=new Map();
const freshPairStats=()=>({scenes:0,changedSpeech:0,changedEvents:0,changedRoute:0,changedQuality:0,changedCloseAction:0,sameActions:0,sameActionsChangedQuality:0,sameActionsChangedPromise:0,protected:0,qualityDeltaSum:0,qualityDeltaMin:100,qualityDeltaMax:-100,commonOpeningActions:0});
const pairedStats=freshPairStats(),tunedStats=freshPairStats(),f6Signatures=new Map();
function run(policy){
 const groups={all:bucket(),established:bucket(),academy:bucket(),w:bucket(),f:bucket()},byOwner=new Map(),byStyle=new Map();
 const histories=[];let resumeChecks=0,scenes=0;
 const pacing={push:0,qualitySum:0,qualityMin:100,qualityMax:0,turns:0,irritationExtreme:0,composureExtreme:0,actorEvents:{},actionGroups:{},audienceObserved:0};
 for(const [i,worker] of roster.entries()){
 const pool=roster.filter(w=>w.id!==worker.id&&D.divisionOf(w)===D.divisionOf(worker));
 const group=worker.id.startsWith('academy-')?'academy':'established';
 const owner=bucket();byOwner.set(worker.id,owner);
 if(!byStyle.has(worker.style))byStyle.set(worker.style,bucket());
 for(let j=0;j<8;j++){
  const side=j%2?'f':'w',other=pool[(i*11+Math.floor(j/2)*17)%pool.length],w=side==='w'?worker:other,f=side==='f'?worker:other,p=D.PROMOS[(i+j)%D.PROMOS.length];
  const c={id:'r7-'+worker.id+'-'+j,wid:w.id,rid:f.id,pid:p.id,eventAbs:100+j,slot:['opener','mid','feature','main'][Math.floor(j/2)],finish:finishes[Math.floor(j/2)],minutes:12,feudHeat:j>=4?55:0};
  // Only synthetic feud heat, not invented recorded matches/claims.
  const rival=j>=4?{heat:55,closed:false}:null;
  const st=M.begin(c,w,f,rival,null,p,{directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,banks:promoBanks(w.id,f.id),...(policy!=='baseline'?{fuzzy:true,fuzzyEmotion:true,fuzzyPacing:true,fuzzyAudience:true,...(policy==='tuned'?{fuzzyBalance:true}:{})}:{})});
  const prior=new Set(histories.flatMap(h=>h.texts));
  st.authoredDialogue.recent=[...new Set([...st.authoredDialogue.recent,...histories.flatMap(h=>h.ids)])].slice(0,128);
  const readEmotion=()=>{const d=st.director[side==='w'?'player':'opponent'];return {composure:d.composure,irritation:d.irritation};};
  const emotions=[readEmotion()],actions=[];let resumed=null;
  for(let step=0;st.stage!=='done';step++){
   assert.ok(step<12,worker.id+' scene does not terminate');
   if(j<2&&step===1){resumed=clone(st);resumeChecks++;}
   const round=M.ROUNDS[st.round].id,choices=M.choices(st);assert.ok(choices.length);
   // Stable round index, not number of earlier turns: a skipped push must not change the fallback close choice.
   const chosen=(choices.find(o=>o.id===schedules[j][round])||choices[(i+j+M.ROUNDS.findIndex(r=>r.id===round))%choices.length]).id;
   actions.push({round,id:chosen});M.choose(st,chosen);if(resumed)M.choose(resumed,chosen);
   emotions.push(readEmotion());
  }
  const result=M.result(st);
  assert.ok(result,worker.id+' missing result');
  assert.equal(st.finish,c.finish,worker.id+' booked finish changed');
  assert.equal(st.steps.filter(x=>x.round==='close').length,1);
  assert.ok(st.steps.filter(x=>x.round==='push').length<=1);
  assert.ok(Number.isFinite(result.quality)&&result.quality>=10&&result.quality<=97);
  const hasPush=actions.some(x=>x.round==='push'),event=st.director.event?.kind||'none';
  const actionGroup=pacing.actionGroups[schedules[j].answer]??={scenes:0,push:0,events:{},qualitySum:0};
  actionGroup.scenes++;actionGroup.push+=Number(hasPush);inc(actionGroup.events,event);actionGroup.qualitySum+=result.quality;
  pacing.push+=Number(hasPush);pacing.qualitySum+=result.quality;pacing.qualityMin=Math.min(pacing.qualityMin,result.quality);pacing.qualityMax=Math.max(pacing.qualityMax,result.quality);
  pacing.turns+=actions.length;
  pacing.irritationExtreme+=emotions.filter(e=>e.irritation>=85).length;pacing.composureExtreme+=emotions.filter(e=>e.composure<=15).length;
  if(st.director.event){assert.ok([w.id,f.id].includes(st.director.event.actor));inc(pacing.actorEvents,event+'|'+(st.director.event.actor===worker.id?'focus':'other'));}
  if(policy!=='baseline')for(const a of Object.values(st.authoredDialogue.fuzzy.audience))if(a) pacing.audienceObserved++;
  const signature={actions,spoken:st.log.filter(e=>e.side==='w'||e.side==='f').map(e=>e.line),event,hasPush,quality:result.quality,promise:result.promise??null,protected:!!(st.core.case||st.core.claim?.hasEvidence)};
  if(policy==='baseline')paired.set(c.id,signature);
  else{
   if(policy==='fuzzy')f6Signatures.set(c.id,signature);
   const before=(policy==='tuned'?f6Signatures:paired).get(c.id);assert.ok(before);
   const pairedStatsForRun=policy==='tuned'?tunedStats:pairedStats;
   pairedStatsForRun.scenes++;
   const sameActions=JSON.stringify(before.actions)===JSON.stringify(actions);
   const delta=signature.quality-before.quality;
   pairedStatsForRun.changedSpeech+=Number(JSON.stringify(before.spoken)!==JSON.stringify(signature.spoken));
   pairedStatsForRun.changedEvents+=Number(before.event!==event);
   pairedStatsForRun.changedRoute+=Number(before.hasPush!==hasPush);
   pairedStatsForRun.changedQuality+=Number(delta!==0);
   pairedStatsForRun.changedCloseAction+=Number(before.actions.at(-1).id!==actions.at(-1).id);
   pairedStatsForRun.sameActions+=Number(sameActions);
   pairedStatsForRun.sameActionsChangedQuality+=Number(sameActions&&delta!==0);
   pairedStatsForRun.sameActionsChangedPromise+=Number(sameActions&&JSON.stringify(before.promise)!==JSON.stringify(signature.promise));
   pairedStatsForRun.protected+=Number(signature.protected);
   pairedStatsForRun.qualityDeltaSum+=delta;pairedStatsForRun.qualityDeltaMin=Math.min(pairedStatsForRun.qualityDeltaMin,delta);pairedStatsForRun.qualityDeltaMax=Math.max(pairedStatsForRun.qualityDeltaMax,delta);
   assert.deepEqual(before.actions.slice(0,2),actions.slice(0,2),'matched opening/answer choice');
   pairedStatsForRun.commonOpeningActions++;
  }
  if(resumed)assert.equal(JSON.stringify(resumed),JSON.stringify(st),worker.id+' resume divergence');
  for(const a of [groups.all,groups[group],groups[side],owner,byStyle.get(worker.style)])observe(a,worker,side,st,prior,emotions,actions);
  histories.unshift({ids:Array.from(M.result(st).dialogueIds||[]),texts:st.log.filter(e=>e.side==='w'||e.side==='f').map(e=>norm(e.line))});histories.splice(12);
  scenes++;
  if(process.env.PROMO_ROSTER_AUDIT_JSON)transcripts.push({policy,focus:worker.id,side,other:other.id,actions,emotions,log:st.log,result:M.result(st)});
 }
}
assert.equal(scenes,1600);assert.equal(resumeChecks,400);assert.equal(groups.all.owners.size,200);
assert.equal(groups.w.owners.size,200);assert.equal(groups.f.owners.size,200);
assert.equal(groups.established.owners.size,80);assert.equal(groups.academy.owners.size,120);
for(const [id,a] of byOwner){assert.equal(a.scenes,8);assert.ok(a.spoken>0,id+' no speech');}
function summary(a){
 const {lines,owners,authoredIds,...rest}=a;
 return {...rest,owners:owners.size,distinctAuthoredIds:authoredIds.size,uniqueText:lines.size,topRepeats:[...lines].map(([text,v])=>({text,count:v.count,owners:v.owners.size})).sort((a,b)=>b.owners-a.owners||b.count-a.count).slice(0,10)};
}
const all=summary(groups.all),owners=[...byOwner].map(([id,a])=>({id,style:D.ALL.find(w=>w.id===id).style,spoken:a.spoken,own:a.own,shared:a.shared,uniqueText:a.lines.size,rollingRepeat:a.rollingRepeat,semanticReplies:a.semanticReplies,semanticLinked:a.semanticLinked}));
const report={version:policy==='baseline'?'F7-matched-baseline-v1':policy==='tuned'?'F7-balanced-v1':'F7-full-fuzzy-v1',scenes,resumeChecks,all,pacing,groups:Object.fromEntries(Object.entries(groups).filter(([k])=>k!=='all').map(([k,a])=>[k,summary(a)])),styles:Object.fromEntries([...byStyle].map(([k,a])=>[k,summary(a)])),owners};
return report;
}
const baseline=run('baseline'),fuzzy=run('fuzzy'),tuned=run('tuned');
assert.equal(pairedStats.scenes,1600);assert.equal(pairedStats.commonOpeningActions,1600);
assert.ok(pairedStats.changedSpeech>0&&pairedStats.changedRoute>0);
assert.equal(baseline.scenes,fuzzy.scenes);assert.equal(baseline.resumeChecks,fuzzy.resumeChecks);
assert.equal(tuned.scenes,fuzzy.scenes);assert.equal(tuned.resumeChecks,fuzzy.resumeChecks);
assert.equal(tunedStats.scenes,1600);assert.equal(tunedStats.commonOpeningActions,1600);
assert.equal(tunedStats.sameActionsChangedPromise,0,'same-action promise changed');
assert.ok(tuned.pacing.push>fuzzy.pacing.push,'balancing must restore additional exchanges');
assert.ok(tuned.all.semanticLinked>fuzzy.all.semanticLinked,'balancing must restore linked replies');
assert.equal(tuned.all.withinSceneRepeat,0);
assert.ok(tuned.all.events.interrupt+tuned.all.events.escalate>=fuzzy.all.events.interrupt+fuzzy.all.events.escalate,'lost spontaneous conflict');
assert.ok(tuned.all.semanticLinked/tuned.all.semanticReplies>=baseline.all.semanticLinked/baseline.all.semanticReplies,'lost baseline semantic accuracy');
const report=baseline,{all,owners,scenes,resumeChecks}=baseline;
if(process.env.PROMO_ROSTER_AUDIT_JSON)fs.writeFileSync(process.env.PROMO_ROSTER_AUDIT_JSON,JSON.stringify({report,baseline,fuzzy,tuned,paired:pairedStats,tunedPaired:tunedStats,transcripts},null,2));
// Compact per-group log, with full per-worker records in optional JSON.
const compact=a=>{const {routes,actions,delivery,topRepeats,...rest}=a;return rest;};
console.log('R7 TOTAL '+JSON.stringify(compact(all)));
console.log('R7 GROUPS '+JSON.stringify(Object.fromEntries(Object.entries(report.groups).map(([k,a])=>[k,compact(a)]))));
console.log('R7 STYLES '+JSON.stringify(Object.fromEntries(Object.entries(report.styles).map(([k,a])=>[k,compact(a)]))));
console.log('R7 ROUTES '+JSON.stringify(all.routes));
console.log('R7 REPEATS '+JSON.stringify(all.topRepeats));
console.log('R7 LOW OWN '+JSON.stringify(owners.slice().sort((a,b)=>a.own/a.spoken-b.own/b.spoken||a.id.localeCompare(b.id)).slice(0,15)));
console.log('R7 NO OWN '+JSON.stringify(owners.filter(a=>!a.own).map(a=>a.id)));
console.log('PASS R7: '+scenes+' actual-choice promos, 200 workers on both sides, '+resumeChecks+' mid-scene JSON save/resume checks.');
function metrics(a){
 const e=a.emotions;
 return {scenes:a.scenes,spoken:a.spoken,words:a.words,authored:a.authored,own:a.own,shared:a.shared,composed:a.composed,graph:a.graph,
  uniqueText:a.uniqueText,distinctAuthoredIds:a.distinctAuthoredIds,uniquePer100:Number((100*a.uniqueText/a.spoken).toFixed(2)),
  repeatPer100:Number((100*a.rollingRepeat/a.spoken).toFixed(2)),rollingRepeat:a.rollingRepeat,withinSceneRepeat:a.withinSceneRepeat,
  authoredPer100:Number((100*a.authored/a.spoken).toFixed(2)),semanticReplies:a.semanticReplies,semanticLinked:a.semanticLinked,
  linkedPer100:Number((100*a.semanticLinked/Math.max(1,a.semanticReplies)).toFixed(2)),
  events:a.events,meanComposure:Number((e.composureSum/e.observations).toFixed(2)),meanIrritation:Number((e.irritationSum/e.observations).toFixed(2)),
  composureRange:[e.composureMin,e.composureMax],irritationRange:[e.irritationMin,e.irritationMax],emotionObservations:e.observations};
}
for(const [name,r] of [['baseline',baseline],['fuzzy',fuzzy],['tuned',tuned]]){
 console.log('F7 '+name.toUpperCase()+' '+JSON.stringify({all:metrics(r.all),groups:Object.fromEntries(Object.entries(r.groups).map(([k,a])=>[k,metrics(a)])),
  styles:Object.fromEntries(Object.entries(r.styles).map(([k,a])=>[k,metrics(a)])),pacing:r.pacing}));
 console.log('F7 '+name.toUpperCase()+' REPEATS '+JSON.stringify(r.all.topRepeats));
 console.log('F7 '+name.toUpperCase()+' NO OWN '+JSON.stringify(r.owners.filter(a=>!a.own).map(a=>a.id)));
}
const ownerDiffs=fuzzy.owners.map(a=>{const b=baseline.owners.find(x=>x.id===a.id);return {id:a.id,spokenDelta:a.spoken-b.spoken,ownDelta:a.own-b.own,
 repeatRateDelta:Number((100*(a.rollingRepeat/a.spoken-b.rollingRepeat/b.spoken)).toFixed(2)),uniqueDelta:a.uniqueText-b.uniqueText};});
console.log('F7 PAIRED '+JSON.stringify(pairedStats));
console.log('F7 OWNER IMPACT '+JSON.stringify({moreUnique:ownerDiffs.filter(x=>x.uniqueDelta>0).length,lessUnique:ownerDiffs.filter(x=>x.uniqueDelta<0).length,
 moreOwn:ownerDiffs.filter(x=>x.ownDelta>0).length,lessOwn:ownerDiffs.filter(x=>x.ownDelta<0).length,
 higherRepeatRate:ownerDiffs.filter(x=>x.repeatRateDelta>0).length,lowerRepeatRate:ownerDiffs.filter(x=>x.repeatRateDelta<0).length,
 worstRepeat:ownerDiffs.slice().sort((a,b)=>b.repeatRateDelta-a.repeatRateDelta).slice(0,12)}));
console.log('F7B PAIRED '+JSON.stringify(tunedStats));
console.log('F7B COMPARISON '+JSON.stringify({before:metrics(fuzzy.all),after:metrics(tuned.all),beforePush:fuzzy.pacing.push,afterPush:tuned.pacing.push,beforeQuality:fuzzy.pacing.qualitySum/fuzzy.scenes,afterQuality:tuned.pacing.qualitySum/tuned.scenes}));
console.log('PASS F7B: 1600 matched contracts across three policies, 4800 actual-choice promos, 1200 JSON resumes, restored linked replies and follow-ups, unchanged booked finish.');

