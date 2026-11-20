'use strict';
// Phase 4 neck-family mechanics: 14 lift/control attacks and 3 fast counters.
// Preserve the Phase 2/3 exact parent ledger and the separate strike ledger.
const assert=require('node:assert/strict'),fs=require('node:fs');
const vm=require('node:vm'),path=require('node:path');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
  {window:root,console,Math,Date,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const slower=G.PHASE4_NECK_THROWS,fast=G.QUICK_NECK_IDS;
assert.equal(G.CATALOG.members.neck.length,18);
assert.equal(slower.length,14);
assert.equal(fast.length,3);
assert.equal(G.GRAPPLE_PILOT.length,97);
assert.equal(G.STRIKE_PILOT.length,46);
assert.ok(slower.every(id=>A[id].family==='neck'&&!fast.includes(id)&&id!=='nk_snap_ddt'));
const make=(id,seed=91371)=>{
 const agile=id==='nk_tornado_ddt';
 const m=M.create(lab.makeOptions(D,{wid:agile?'lyra':'rex',rid:'dee',
  slot:'main',plan:'technical',finish:'win_clean',seed}));
 m.stage='live';m.t=Math.floor(m.len*.87);
 m.story.control='w';m.story.position=A[id].requires;m.story.down=null;
 m.wSt=m.fSt=100;m.graph.arc='escalation';m.graph.node=null;
 const grip=G.PHYSICAL_GRIP_MOVES[id];
 m.graph.physical={v:1,locations:{w:'ring',f:'ring'},area:'ring',
  topSide:null,grip:grip?{type:grip,side:'w',at:m.t,source:
   Object.keys(G.GRIP_ENTRY).find(key=>G.GRIP_ENTRY[key]===grip)||'reviewed-entry'}:null};
 assert.equal(G.isValid(m,id),true,'physically capable neck attack '+id);
 return m;
};
let counters=0,blocks=0;
for(const id of slower){
 const m=make(id),rev=id+'_rev',blk=id+'_blk';
 assert.equal(G.isValid(m,rev),false,'no phantom reversal '+id);
 if(G.PHYSICAL_GRIP_MOVES[id]){
  const stolen=make(id);stolen.graph.physical.grip.side='f';
  assert.equal(G.isValid(stolen,id),false,'opponent cannot lend control '+id);
 }
 assert.equal(G.startGrapple(m,id),true);
 assert.equal(G.isValid(m,rev),true,'named attack exposes its exact defence '+id);
 m.r=()=>.999;m.t+=10;
 assert.equal(G.resolveGrapple(m),true,'committed neck attack resolves '+id);
 assert.equal(m.graph.events.at(-1).id,id);
 assert.equal(m.graph.events.at(-1).attemptedMove,id);
 assert.equal(m.graph.grappleAttempts.at(-1).outcome,'landed');
 const d=make(id);
 assert.equal(G.startGrapple(d,id),true);d.r=()=>0;d.t+=10;
 assert.equal(G.resolveGrapple(d),true);
 assert.equal(d.graph.events.at(-1).id,rev);
 assert.equal(d.graph.events.at(-1).attemptedMove,id);
 assert.equal(d.graph.grappleAttempts.at(-1).outcome,'counter');
 counters++;
 if(A[blk]){
  const b=make(id);G.startGrapple(b,id);
  const attackSkill=b.w.ring*.7+b.w.psych*.3;
  const defenceSkill=b.f.ring*.7+b.f.psych*.3;
  const counterChance=Math.max(.06,Math.min(.32,.13+
   (defenceSkill-attackSkill)/350));
  b.r=()=>counterChance+.01;b.t+=10;
  G.resolveGrapple(b);
  assert.equal(b.graph.events.at(-1).id,blk,'physically defended neck attack '+id);
  assert.equal(b.graph.grappleAttempts.at(-1).outcome,'block');
  blocks++;
 }
}
for(const id of fast){
 const m=make(id),rev=id+'_rev';
 assert.equal(G.isValid(m,rev),false,'no floating rapid counter '+id);
 assert.equal(G.startStrike(m,id),true);
 assert.equal(G.resolveStrike(m,true),true);
 assert.equal(m.graph.events.at(-1).attemptedMove,id);
 assert.equal(m.graph.strikeAttempts.at(-1).outcome,'landed');
 const d=make(id);G.startStrike(d,id);d.r=()=>0;
 assert.equal(G.resolveStrike(d,true),true);
 assert.equal(d.graph.events.at(-1).id,rev);
 assert.equal(d.graph.strikeAttempts.at(-1).outcome,'counter');
}
const saved=make('nk_double_arm_ddt',91566);
assert.equal(G.startGrapple(saved,'nk_double_arm_ddt'),true);
const resumed=M.restore(JSON.parse(JSON.stringify({...saved,rState:saved.r.getState()})));
assert.equal(resumed.graph.pendingGrapple.id,'nk_double_arm_ddt');
saved.t+=10;resumed.t+=10;G.resolveGrapple(saved);G.resolveGrapple(resumed);
assert.equal(JSON.stringify(saved.graph.grappleAttempts),JSON.stringify(resumed.graph.grappleAttempts));
console.log('PASS Phase 4 neck family: 14 controlled throws, '+counters+
 ' exact counters, '+blocks+' blocks, 3 fast neck attacks, real grip ownership and save/replay.');
