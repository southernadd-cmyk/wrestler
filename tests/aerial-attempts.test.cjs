'use strict';
const {EXPECTED}=require('./_phase10-inventory.cjs');
// Phase 6: real two-beat aerial attempt / result state, complete and resumed.
// No independent dive reversal may occur without the specifically named parent.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-catalog.js','match-graph.js','match-commentary.js','match-engine.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Date,Math,JSON},{filename:file});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
assert.equal(G.validate().errors.length,0);
assert.equal(G.validate().nodes,EXPECTED.nodes,'attempt records do not create pseudo-moves');
const A=G.A;
function setup(wid='kit',rid='rex',id='ar_frog'){
 const m=M.create(lab.makeOptions(D,{wid,rid,slot:'main',plan:'spots',finish:'win_clean',seed:91011}));
 m.stage='live';m.t=Math.floor(m.len*.83);m.wSt=m.fSt=100;
 m.story.position='top';m.story.down='f';m.story.control='w';
 m.graph.arc='escalation';m.graph.node='top_climb';m.graph.started=true;
 assert.ok(G.isValid(m,id),'attack must be legal for selected wrestler '+id);
 return m;
}
function resolve(id,roll){
 const m=setup('kit','rex',id);
 assert.equal(G.isValid(m,id+'_rev'),false,'no free-standing counter before a named attempt');
 assert.equal(G.startAerial(m,id),true);
 assert.equal(m.graph.pendingAerial.id,id);
 assert.equal(m.graph.aerialAttempts.length,1);
 assert.equal(m.graph.aerialAttempts[0].outcome,'pending');
 assert.ok(m.log.at(-1).text.toLowerCase().includes(A[id].name.toLowerCase()),
  'commentary must identify actual attempted move');
 assert.equal(G.isValid(m,id+'_rev'),true,'exact reversal available with its parent attempt');
 const guardPending=JSON.stringify(m.graph.pendingAerial);
 const guardEventCount=m.graph.events.length;
 G.step(m);
 assert.equal(JSON.stringify(m.graph.pendingAerial),guardPending,'another graph step cannot replace the committed attempt');
 assert.equal(m.graph.events.length,guardEventCount,'no unrelated action happens while the named dive is pending');
 assert.equal(G.isValid(m,id==='ar_frog'?'ar_senton_rev':'ar_frog_rev'),false,
  'unrelated move-specific reversal forbidden while pending');
 const before=m.graph.events.length;
 m.r=()=>roll;
 m.t+=10;
 assert.equal(G.resolveAerial(m),true);
 assert.equal(m.graph.events.length,before+1,'exactly one resolution action committed');
 assert.equal(m.graph.pendingAerial,null);
 const e=m.graph.events.at(-1),record=m.graph.aerialAttempts.at(-1);
 assert.equal(e.attemptedMove,id);
 assert.equal(e.aerialAttemptSeq,record.seq);
 assert.equal(e.aerialResolution,record.outcome);
 assert.equal(record.actionId,e.id);
 assert.ok(['counter','landed','block'].includes(record.outcome));
 assert.equal(G.resolveAerial(m),false,'no double resolution on later tick');
 return {m,e,record};
}
// Deterministically exercise the entire actual resolution tree.
for(const id of ['ar_frog','ar_senton','ar_cross_arm','ar_missile_low','sb_cutter']){
 const c=resolve(id,0);
 assert.equal(c.record.outcome,'counter');
 assert.equal(c.e.id,id+'_rev');
 assert.equal(c.e.preControl,'w');
 assert.equal(c.e.control,'f','the defender gains control after a successful aerial counter');
 assert.equal(c.e.position,A[id+'_rev'].zone);
 assert.equal(c.m.graph.aerialAttempts.length,1);
 const landed=resolve(id,.999);
 assert.equal(landed.record.outcome,'landed');
 assert.equal(landed.e.id,id);
 assert.equal(landed.e.control,'w');
 assert.equal(landed.e.position,'mat','landed dive finishes on the mat');
 const m=setup('kit','rex',id);
 assert.equal(G.startAerial(m,id),true);
 const skill=x=>x.ring*.65+x.psych*.35;
 const defender=m.f,attacker=m.w;
 const counterP=Math.max(.075,Math.min(.28,.15+(skill(defender)-skill(attacker))/300));
 const blockP=Math.max(.055,Math.min(.13,.085+(defender.safe-attacker.safe)/550));
 m.r=()=>counterP+blockP/2;m.t+=10;
 assert.equal(G.resolveAerial(m),true);
 assert.equal(m.graph.aerialAttempts[0].outcome,'block','possible fall away from the dive');
 assert.equal(m.graph.events.at(-1).id,id+'_blk');
 assert.equal(m.graph.events.at(-1).attemptedMove,id);
}
// The actual saved object holds a pending attack, and RNG restores without
// re-selecting an unrelated attack on the next tick.
const live=setup('kit','rex','ar_frog');
assert.equal(G.startAerial(live,'ar_frog'),true);
const raw=JSON.parse(JSON.stringify({...live,rState:live.r.getState()}));
assert.equal(raw.graph.pendingAerial.id,'ar_frog');
assert.equal(raw.graph.aerialAttempts[0].outcome,'pending');
const restored=M.restore(raw);
assert.equal(restored.graph.pendingAerial.id,'ar_frog');
live.t+=10;restored.t+=10;
assert.equal(G.resolveAerial(live),true);
assert.equal(G.resolveAerial(restored),true);
assert.equal(JSON.stringify(live.graph.aerialAttempts),JSON.stringify(restored.graph.aerialAttempts),
 'same in-flight aerial attack resolves the same way after JSON save/reload');
assert.equal(JSON.stringify(live.graph.events),JSON.stringify(restored.graph.events),
 'save/reload retains exact counter / landing event attribution');
// Check the full tick pipeline actually prioritises this pending attack over
// a scene reset, scheduled nearfall or random spot.
const throughTick=setup('kit','rex','ar_frog');
assert.equal(G.startAerial(throughTick,'ar_frog'),true);
const initial=throughTick.graph.aerialAttempts.length;
for(let i=0;i<120&&throughTick.graph.pendingAerial;i++){
 if(throughTick.decision&&throughTick.queue.length===0)M.resolve(throughTick,throughTick.decision.options[0].id);
 M.next(throughTick);
}
assert.equal(throughTick.graph.pendingAerial,null,'real match tick must resolve in-flight dive');
assert.equal(throughTick.graph.aerialAttempts.length,initial);
assert.ok(throughTick.graph.aerialAttempts[0].outcome!=='pending');
// Surprise disqualification or shortened finish cancels rather than invents a landing.
const ended=setup();
assert.equal(G.startAerial(ended,'ar_frog'),true);
ended.stage='finish';
G.finishCue(ended);
assert.equal(ended.graph.pendingAerial,null);
assert.equal(ended.graph.aerialAttempts[0].outcome,'interrupted');
assert.ok(!ended.graph.events.some(e=>e.attemptedMove==='ar_frog'),'interrupted dive is not recorded as landed');
// A V1 graph save has no pending data: migrate without assuming an attack.
const legacy=setup();
delete legacy.graph.pendingAerial;delete legacy.graph.aerialAttempts;delete legacy.graph.aerialAttemptSerial;
const old=M.restore(JSON.parse(JSON.stringify({...legacy,rState:legacy.r.getState()})));
assert.equal(G.get(old).pendingAerial,null);
assert.equal(G.get(old).aerialAttempts.length,0);
assert.equal(G.isValid(old,'ar_frog_rev'),false);
console.log('PASS Phase 6: named persistent dive attempts, 5 exact counter/landing/block paths, saved in-flight replay, interrupt safety, tick integration, legacy migration and no new move nodes.');
