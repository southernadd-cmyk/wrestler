'use strict';
// Phase 3: 35 authored submissions and 11 named chain takedowns use
// the same honest two-beat commitment, exact counter and save/replay ledger.
// Run: node tests/phase3-chain-submissions.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const filename of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',filename),'utf8'),
 {window:root,Math,Date,JSON,console},{filename});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const old=new Set(['sm_sleeper','sm_ankle_lock','nk_snap_ddt',
 ...G.CATALOG.members.suplex,'pw_powerbomb','pw_sitout',
 'pw_running_powerbomb','pw_backbreaker','pw_uranage','pw_samoan_drop',
 'pw_gorilla_press','pw_military_press','pw_pumphandle','pw_belly_bump',
 'pw_argentine']);
const takedowns=['ch_single_leg','ch_double_leg','ch_fireman','ch_snapmare',
 'ch_deep_arm_drag','ch_japanese_arm_drag','ch_drop_toehold',
 'ch_headlock_takedown','ch_leg_trip','ch_dragon_screw','ch_hip_toss_chain'];
const added=G.GRAPPLE_PILOT.filter(id=>!old.has(id));
assert.equal(old.size,39);
assert.equal(G.CATALOG.members.submission.length,35);
assert.equal(added.length,44,'33 new submissions plus 11 takedowns');
assert.equal(G.GRAPPLE_PILOT.length,83);
assert.equal(new Set(G.GRAPPLE_PILOT).size,83);
assert.ok(takedowns.every(id=>added.includes(id)));
assert.ok(added.every(id=>A[id]&&G.CATALOG.members.submission.includes(id)||
 takedowns.includes(id)));
const outcomes={landed:0,counter:0,block:0};
function setup(id){
 const a=A[id];
 const agile=a.agile;
 const w=agile?'lyra':'rex',f=agile?'dee':'lyra';
 const m=M.create(lab.makeOptions(D,{wid:w,rid:f,slot:'main',
  plan:'technical',finish:'win_clean',seed:77001}));
 m.stage='live';m.t=Math.floor(m.len*.86);
 m.wSt=m.fSt=100;m.story.position=a.requires==='any'?'standing':a.requires;
 m.story.control='w';m.story.down=a.requires==='mat'?'f':null;
 m.graph.arc='escalation';m.graph.node=null;
 const required=G.PHYSICAL_GRIP_MOVES[id];
 if(required)m.graph.physical={v:1,locations:{w:'ring',f:'ring'},
  area:'ring',topSide:null,grip:{type:required,side:'w',at:m.t,
   source:Object.keys(G.GRIP_ENTRY).find(key=>G.GRIP_ENTRY[key]===required)||'reviewed-setup'}};
 assert.ok(G.isValid(m,id),'physically legal setup required: '+id);
 return m;
}
for(const id of added){
 const m=setup(id),rev=id+'_rev',blk=id+'_blk';
 assert.equal(G.isValid(m,rev),false,'uncommitted defence forbidden: '+id);
 assert.equal(G.startGrapple(m,id),true,'starts named attack '+id);
 assert.equal(m.graph.pendingGrapple.id,id);
 assert.equal(G.isValid(m,rev),true,'correct pending parent opens counter '+id);
 m.r=()=>.999;m.t+=10;
 assert.equal(G.resolveGrapple(m),true);
 assert.equal(m.graph.pendingGrapple,null);
 const landed=m.graph.events.at(-1),attempt=m.graph.grappleAttempts.at(-1);
 assert.equal(landed.id,id);
 assert.equal(attempt.outcome,'landed');
 assert.equal(landed.attemptedMove,id);
 assert.equal(landed.grappleAttemptSeq,attempt.seq);
 outcomes.landed++;
 const counter=setup(id);
 assert.equal(G.startGrapple(counter,id),true);
 counter.r=()=>0;counter.t+=10;
 assert.equal(G.resolveGrapple(counter),true);
 const ce=counter.graph.events.at(-1),ca=counter.graph.grappleAttempts.at(-1);
 assert.equal(ca.outcome,'counter','defence outcome '+id);
 assert.equal(ce.id,rev,'exact named counter '+id);
 assert.equal(ce.attemptedMove,id);
 assert.equal(ce.grappleAttemptSeq,ca.seq);
 outcomes.counter++;
 if(A[blk]){
  const blocked=setup(id);
  assert.equal(G.startGrapple(blocked,id),true);
  const skill=w=>w.ring*.7+w.psych*.3;
  const base=A[id].family==='submission'?.19:.13;
  const chance=Math.max(.06,Math.min(.32,base+(skill(blocked.f)-skill(blocked.w))/350));
  blocked.r=()=>chance+.01;blocked.t+=10;
  assert.equal(G.resolveGrapple(blocked),true);
  const ba=blocked.graph.grappleAttempts.at(-1),be=blocked.graph.events.at(-1);
  assert.equal(ba.outcome,'block','exact block for '+id);
  assert.equal(be.id,blk);
  assert.equal(be.attemptedMove,id);
  outcomes.block++;
 }
 if(G.PHYSICAL_GRIP_MOVES[id]){
  const illegal=setup(id);illegal.graph.physical.grip.side='f';
  assert.equal(G.isValid(illegal,id),false,'opponent grip cannot be stolen: '+id);
 }
}
const replay=setup('sm_figure_four');
assert.equal(G.startGrapple(replay,'sm_figure_four'),true);
const serialized=JSON.parse(JSON.stringify({...replay,rState:replay.r.getState()}));
const restored=M.restore(serialized);
replay.t+=10;restored.t+=10;
G.resolveGrapple(replay);G.resolveGrapple(restored);
assert.equal(JSON.stringify(replay.graph.events),JSON.stringify(restored.graph.events));
assert.equal(JSON.stringify(replay.graph.grappleAttempts),JSON.stringify(restored.graph.grappleAttempts));
console.log('PASS Phase 3: '+added.length+' new committed chain/submission moves; '+
 JSON.stringify(outcomes)+'; exact defensive parents, physical grip and replay.');
