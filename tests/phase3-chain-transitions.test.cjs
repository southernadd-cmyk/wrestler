'use strict';
// Non-impact chain actions must earn or release positional control;
// they are not counted as committed suplex/submission landings.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
 {window:root,console,Math,Date,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const acquired={
 go_behind:'rear-waist',standing_switch:'rear-waist',
 front_facelock:'front-facelock',knuckle_lock:'upper-body',
 ch_top_wristlock:'wrist',ch_cravate:'head',ch_rolling_wristlock:'wrist'
};
const released=['knuckle_break','ch_drop_down','ch_short_arm',
 'ch_kip_up','ch_headlock_escape','ch_rollthrough'];
const ids=[...Object.keys(acquired),...released];
assert.equal(ids.length,13);
for(const id of ids)assert.ok(A[id],'missing existing chain move '+id);
const setup=(seed=45618)=>{
 const m=M.create(lab.makeOptions(D,{wid:'juno',rid:'dee',slot:'main',
  plan:'technical',finish:'win_clean',seed}));
 m.stage='live';m.t=Math.floor(m.len*.84);
 m.story.control='w';m.story.position='standing';m.story.down=null;
 m.wSt=m.fSt=100;
 m.graph.physical={v:1,locations:{w:'ring',f:'ring'},
  area:'ring',topSide:null,grip:null};
 return m;
};
for(const [id,type] of Object.entries(acquired)){
 const m=setup();
 assert.equal(G.isValid(m,id),true,id+' is legal standing chain control');
 G.apply(m,id);
 assert.equal(m.graph.physical.grip?.type,type,'action acquires correct grip: '+id);
 assert.equal(m.graph.physical.grip?.side,'w','controller owns '+id);
 assert.equal(m.graph.physical.grip?.source,id,'grip records actual authored action '+id);
 assert.equal(m.graph.pendingGrapple,null,'a positional move is not a phantom attack');
}
for(const id of released){
 const m=setup();
 G.apply(m,'wristlock');
 assert.equal(m.graph.physical.grip?.type,'wrist');
 assert.equal(G.isValid(m,id),true,'escape/footwork action available '+id);
 G.apply(m,id);
 assert.equal(m.graph.physical.grip,null,
  'escape or change of footing must release captured control: '+id);
 assert.equal(m.graph.pendingGrapple,null);
}
const behind=setup();
G.apply(behind,'go_behind');
assert.equal(G.isValid(behind,'sx_german'),true,
 'actual rear waistlock opens an authentic German suplex');
G.apply(behind,'standing_switch');
assert.equal(behind.graph.physical.grip?.side,'w');
assert.equal(G.isValid(behind,'sx_german'),true,
 'same-controller standing switch retains rear control');
const escaped=setup();
G.apply(escaped,'go_behind');G.apply(escaped,'ch_short_arm');
assert.equal(G.isValid(escaped,'sx_german'),false,
 'after wrist/waist escape cannot magically deliver a German suplex');
const saved=setup();
G.apply(saved,'front_facelock');
const restored=M.restore(JSON.parse(JSON.stringify({...saved,rState:saved.r.getState()})));
assert.equal(restored.graph.physical.grip?.type,'front-facelock');
assert.equal(G.isValid(restored,'sx_vertical'),true,
 'a real saved facelock is a legal suplex entry');
console.log('PASS Phase 3 chain transitions: '+ids.length+
 ' positional/escape actions, exact grip ownership, release, legal follow-through and save.');
