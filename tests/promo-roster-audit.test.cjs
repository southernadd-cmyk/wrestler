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
const groups={all:bucket(),established:bucket(),academy:bucket(),w:bucket(),f:bucket()},byOwner=new Map(),byStyle=new Map();
const histories=[],transcripts=[];let resumeChecks=0,scenes=0;
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
  const st=M.begin(c,w,f,rival,null,p,{directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,banks:promoBanks(w.id,f.id)});
  const prior=new Set(histories.flatMap(h=>h.texts));
  st.authoredDialogue.recent=[...new Set([...st.authoredDialogue.recent,...histories.flatMap(h=>h.ids)])].slice(0,128);
  const readEmotion=()=>{const d=st.director[side==='w'?'player':'opponent'];return {composure:d.composure,irritation:d.irritation};};
  const emotions=[readEmotion()],actions=[];let resumed=null;
  for(let step=0;st.stage!=='done';step++){
   assert.ok(step<12,worker.id+' scene does not terminate');
   if(j<2&&step===1){resumed=clone(st);resumeChecks++;}
   const round=M.ROUNDS[st.round].id,choices=M.choices(st);assert.ok(choices.length);
   const chosen=(choices.find(o=>o.id===schedules[j][round])||choices[(i+j+step)%choices.length]).id;
   actions.push({round,id:chosen});M.choose(st,chosen);if(resumed)M.choose(resumed,chosen);
   emotions.push(readEmotion());
  }
  assert.ok(M.result(st),worker.id+' missing result');
  if(resumed)assert.equal(JSON.stringify(resumed),JSON.stringify(st),worker.id+' resume divergence');
  for(const a of [groups.all,groups[group],groups[side],owner,byStyle.get(worker.style)])observe(a,worker,side,st,prior,emotions,actions);
  histories.unshift({ids:Array.from(M.result(st).dialogueIds||[]),texts:st.log.filter(e=>e.side==='w'||e.side==='f').map(e=>norm(e.line))});histories.splice(12);
  scenes++;
  if(process.env.PROMO_ROSTER_AUDIT_JSON)transcripts.push({focus:worker.id,side,other:other.id,actions,emotions,log:st.log,result:M.result(st)});
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
const report={version:'R7-pre-fuzzy-v1',scenes,resumeChecks,all,groups:Object.fromEntries(Object.entries(groups).filter(([k])=>k!=='all').map(([k,a])=>[k,summary(a)])),styles:Object.fromEntries([...byStyle].map(([k,a])=>[k,summary(a)])),owners};
if(process.env.PROMO_ROSTER_AUDIT_JSON)fs.writeFileSync(process.env.PROMO_ROSTER_AUDIT_JSON,JSON.stringify({report,transcripts},null,2));
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
