'use strict';
// Match pacing must not be inferred from the earliest reachable late-match arc.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-catalog.js','match-graph.js','match-commentary.js','match-engine.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
  {window:root,Math,Date,JSON,console},{filename:name});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,Mx=root.OfficeMatch;
const PLANS=['story','technical','brawl','spots','safe'];
const ENDS={story:[.14,.29,.60,.79],technical:[.20,.36,.61,.77],
 spots:[.10,.27,.49,.70],brawl:[.09,.24,.60,.78],safe:[.18,.34,.63,.81]};
const PHASES=['open','shine','heat','comeback','stretch'];
const LATE_ARCS=new Set(['nearfall','escalation','fighting_spirit','double_down','top_rope_battle',
 'submission_battle','false_finish','finish_setup']);
function options(i,plan){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*3)%D.FOES.length],p=D.PROMOS[i%D.PROMOS.length];
 return {w:{...w,fatigue:10,flags:{}},f,p:{...p,tv:false},slot:'main',minutes:20,
  finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],
  plan:{game:plan,leash:'script',talk:'calm'},preparation:{},flags:{},seed:1003+i*71};
}
function resolve(M){
 if(!M.decision||M.queue.length)return;
 const choice=M.decision.options.find(o=>['job','keep','protect','work'].includes(o.id))||
  M.decision.options.find(o=>!['home','cut','stop'].includes(o.id))||M.decision.options[0];
 Mx.resolve(M,choice.id);
}
function drain(M,max=6000){
 for(let j=0;j<max&&!M.done;j++){resolve(M);Mx.next(M);}
 assert.ok(M.done,'match must complete');
 return M;
}
let bouts=0,earlyExchange=0,lateEscalation=0,plannedStretch=0;
for(let i=0;i<200;i++){
 const plan=PLANS[i%PLANS.length],M=Mx.create(options(i,plan));
 let previousPhase=-1;
 for(let j=0;j<6000&&!M.done;j++){
  resolve(M);Mx.next(M);
  if(M.stage!=='live'||!M.phase)continue;
  const progress=M.t/M.len;
  const actualIndex=PHASES.indexOf(M.phase.id);
  assert.ok(actualIndex>=0,'known phase in seed '+i);
  assert.ok(actualIndex>=previousPhase,'narrative clock must never regress (seed '+i+')');
  previousPhase=actualIndex;
  // Normal booked duration: phases and late action must obey the match plan.
  // An explicit early 'take it home' changes M.len and is tested separately.
  if(M.len!==1200)continue;
  const ends=ENDS[plan],expectedIndex=ends.findIndex(end=>progress<end);
  const expected=expectedIndex<0?4:expectedIndex;
  assert.equal(actualIndex,expected,'phase must track planned clock in seed '+i+' at '+M.t+' seconds');
  if(progress<ends[3]){
   assert.notEqual(M.phase.name,'Finishing stretch','early finishing label in seed '+i);
   assert.ok(!LATE_ARCS.has(M.graph.arc),
    'premature finishing graph arc '+M.graph.arc+' at '+M.t+' in seed '+i);
  }
  if(M.graph.arc==='finish_setup')
   assert.ok(progress+1e-9>=Math.max(.88,ends[3]+.08),
    'final setup cannot start before late match in seed '+i);
  if(M.graph.arc==='exchange'&&progress<ends[3])earlyExchange++;
  if(M.graph.arc==='escalation')lateEscalation++;
  if(M.phase.id==='stretch')plannedStretch++;
 }
 assert.ok(M.done,'all match outcomes must still resolve, seed '+i);
 assert.ok(M.final?.psychology?.graph,'finished match retains graph evidence');
 assert.ok(M.scriptChecks<=4,'a scripted bout checks compliance only on four major phase changes');
 bouts++;
}
assert.ok(earlyExchange>0,'normal back-and-forth survives before the finish');
assert.ok(lateEscalation>0&&plannedStretch>0,'late finishes remain reachable');

// A save created by the old engine may already be in an illegal finishing arc.
// After reload, one fresh tick must resynchronise it without replaying the opening.
const old=Mx.create(options(211,'story'));
for(let j=0;j<4000&&old.t<610;j++){resolve(old);Mx.next(old);}
assert.ok(old.t>=610&&old.t<900,'old save is in mid-match');
old.graph.arc='escalation';old.graph.age=0;old.graph.started=true;
old.phase={id:'stretch',name:'Finishing stretch'};
const snapshot=JSON.parse(JSON.stringify({...old,rState:old.r.getState()}));
const restored=Mx.restore(snapshot),start=restored.t;
for(let j=0;j<200&&restored.t===start;j++){resolve(restored);Mx.next(restored);}
assert.ok(restored.t>start,'old match resumes ticking');
assert.notEqual(restored.graph.arc,'escalation','old early escalation repaired on next tick');
assert.notEqual(restored.phase.name,'Finishing stretch','old early finish label repaired');
assert.equal(restored.phase.id,'heat','restored match uses current timed phase');
drain(restored);

// The manager may deliberately call for a short finish. Do not strand such matches.
const early=Mx.create(options(313,'technical'));
for(let j=0;j<1000&&early.t<240;j++){resolve(early);Mx.next(early);}
assert.equal(early.stage,'live');
early.listen=100;
assert.ok(Mx.call(early,'home'),'early finishing call is accepted');
assert.ok(early.shortened&&early.len<1200,'manager intervention changes planned duration');
drain(early);
assert.ok(early.final&&early.done,'shortened match still has a real outcome');
console.log('PASS match pacing: '+bouts+' seeded 20-minute bouts; timed phases, guarded late arcs, '+earlyExchange+
 ' early exchanges, '+lateEscalation+' late escalations, old-save repair, early manager finish');