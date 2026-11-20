'use strict';
const {EXPECTED}=require('./_phase10-inventory.cjs');
// Phase 7 exact two-beat pilot: suplex and submission commits, counters, blocks and save replay.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Date,Math,JSON},{filename:file});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
assert.equal(G.validate().errors.length,0);
assert.equal(G.validate().nodes,EXPECTED.nodes);
const pilot=['sx_vertical','sx_german','sm_sleeper','sm_ankle_lock',
 'sx_deadlift_bridge','nk_snap_ddt','pw_powerbomb'];
assert.equal(JSON.stringify([...G.GRAPPLE_PILOT]),JSON.stringify(pilot));
function setup(id){
 const m=M.create(lab.makeOptions(D,{wid:'juno',rid:'bao',slot:'main',plan:'technical',finish:'win_clean',seed:70119}));
 m.stage='live';m.t=Math.floor(m.len*.86);m.wSt=m.fSt=100;
 m.story.position=A[id].requires;
 m.story.down=A[id].requires==='mat'?'f':null;
 m.story.control='w';m.graph.arc='escalation';m.graph.node=null;
 // Reviewed Phase 2 additions require the actual controller to have an
 // established, fresh front facelock; legacy pilot probes stay untouched.
 if(['sx_deadlift_bridge','nk_snap_ddt','pw_powerbomb'].includes(id))
  m.graph.physical={v:1,locations:{w:'ring',f:'ring'},area:'ring',topSide:null,
   grip:{type:'front-facelock',side:'w',at:m.t,source:'front_facelock'}};
 assert.ok(G.isValid(m,id),'parent must be physically legal '+id);
 return m;
}
for(const id of pilot){
 const m=setup(id);
 assert.equal(G.isValid(m,id+'_rev'),false,'no uncommitted reversal '+id);
 assert.equal(G.startGrapple(m,id),true);
 assert.equal(m.graph.pendingGrapple.id,id);
 assert.ok(m.log.at(-1).text.toLowerCase().includes(A[id].name.toLowerCase()));
 assert.equal(G.isValid(m,id+'_rev'),true);
 const count=m.graph.events.length;
 G.step(m);
 assert.equal(m.graph.events.length,count,'pending grapple blocks arbitrary graph step');
 const wrong=pilot.find(x=>x!==id&&A[x].requires===A[id].requires);
 if(wrong)assert.equal(G.isValid(m,wrong+'_rev'),false,'cannot counter the wrong named move');
 m.r=()=>0;m.t+=10;
 assert.equal(G.resolveGrapple(m),true);
 const e=m.graph.events.at(-1),record=m.graph.grappleAttempts.at(-1);
 assert.equal(record.outcome,'counter');
 assert.equal(e.id,id+'_rev');
 assert.equal(e.attemptedMove,id);
 assert.equal(e.grappleAttemptSeq,record.seq);
 assert.equal(e.grappleResolution,'counter');
 assert.equal(m.graph.pendingGrapple,null);
 assert.equal(G.resolveGrapple(m),false,'cannot resolve twice');
 const landing=setup(id);
 assert.equal(G.startGrapple(landing,id),true);
 landing.r=()=>.999;landing.t+=10;
 assert.equal(G.resolveGrapple(landing),true);
 assert.equal(landing.graph.events.at(-1).id,id);
 assert.equal(landing.graph.grappleAttempts.at(-1).outcome,'landed');
 if(A[id+'_blk']){
  const blocked=setup(id);G.startGrapple(blocked,id);
  const att=blocked.w,def=blocked.f;
  const chance=Math.max(.06,Math.min(.32,(A[id].family==='submission'?.19:.13)+((def.ring*.7+def.psych*.3)-(att.ring*.7+att.psych*.3))/350));
  blocked.r=()=>chance+.01;blocked.t+=10;
  assert.equal(G.resolveGrapple(blocked),true);
  assert.equal(blocked.graph.grappleAttempts.at(-1).outcome,'block');
  assert.equal(blocked.graph.events.at(-1).id,id+'_blk');
 }
}
for(const id of ['sx_deadlift_bridge','nk_snap_ddt','pw_powerbomb']){
 const noGrip=setup(id);noGrip.graph.physical.grip=null;
 assert.equal(G.isValid(noGrip,id),false,'cannot commit without verified setup: '+id);
 const stolen=setup(id);stolen.graph.physical.grip.side='f';
 assert.equal(G.isValid(stolen,id),false,'cannot use opponent setup: '+id);
 const stale=setup(id);stale.graph.physical.grip.at=stale.t-30;
 assert.equal(G.isValid(stale,id),false,'cannot use stale setup: '+id);
}
const live=setup('sx_vertical');G.startGrapple(live,'sx_vertical');
const raw=JSON.parse(JSON.stringify({...live,rState:live.r.getState()}));
const restored=M.restore(raw);
assert.equal(restored.graph.pendingGrapple.id,'sx_vertical');
live.t+=10;restored.t+=10;
G.resolveGrapple(live);G.resolveGrapple(restored);
assert.equal(JSON.stringify(live.graph.grappleAttempts),JSON.stringify(restored.graph.grappleAttempts));
assert.equal(JSON.stringify(live.graph.events),JSON.stringify(restored.graph.events));
const through=setup('sm_ankle_lock');G.startGrapple(through,'sm_ankle_lock');
for(let i=0;i<120&&through.graph.pendingGrapple;i++){
 if(through.decision&&!through.queue.length)M.resolve(through,through.decision.options[0].id);
 M.next(through);
}
assert.equal(through.graph.pendingGrapple,null,'full tick resolves the named hold');
assert.notEqual(through.graph.grappleAttempts[0].outcome,'pending');
const ended=setup('sx_german');G.startGrapple(ended,'sx_german');
ended.stage='finish';G.finishCue(ended);
assert.equal(ended.graph.pendingGrapple,null);
assert.equal(ended.graph.grappleAttempts[0].outcome,'interrupted');
const old=setup('sx_vertical');
delete old.graph.pendingGrapple;delete old.graph.grappleAttempts;delete old.graph.grappleAttemptSerial;
const migrated=M.restore(JSON.parse(JSON.stringify({...old,rState:old.r.getState()})));
assert.equal(G.get(migrated).pendingGrapple,null);
assert.equal(G.get(migrated).grappleAttempts.length,0);
assert.equal(G.isValid(migrated,'sx_vertical_rev'),false);
const concurrent=setup('sx_vertical');G.startGrapple(concurrent,'sx_vertical');
concurrent.story.position='top';concurrent.story.down='f';
assert.equal(G.startAerial(concurrent,'ar_frog'),false,'no overlapping committed attacks');
console.log('PASS Phase 2: seven exact grapples, named counters/blocks, grip legality, save/replay and interruption.');
