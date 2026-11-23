'use strict';
// Phase 3 mat control is a positional action, not an invisible submission.
// Validate all 12 rest moves, owned control, compatible continuation,
// escape/reset, no magic grip on a loose cover, and serialized replay.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-graph.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
 {window:root,console,Date,Math,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
const REST=G.CATALOG.members.rest;
assert.equal(REST.length,12);
const expected={
 rs_armbar_rest:'ground-arm',rs_hammerlock_mat:'ground-arm',
 rs_wrist_mat:'ground-arm',rs_side_headlock:'ground-head',
 rs_front_chancery:'ground-head',rs_seated_chinlock:'ground-head',
 rs_reverse_chinlock:'ground-head',rs_nerve_hold:'ground-head',
 rs_mat_stretch:'ground-back',rs_leg_lace:'ground-leg'
};
assert.equal(Object.keys(expected).length,10);
const fixture=(seed=31422)=>{
 const m=M.create(lab.makeOptions(D,{wid:'juno',rid:'dee',slot:'main',
  plan:'technical',finish:'win_clean',seed}));
 m.stage='live';m.t=Math.floor(m.len*.85);
 m.story.position='mat';m.story.down='f';m.story.control='w';
 m.wSt=m.fSt=100;
 m.graph.arc='escalation';m.graph.node=null;
 m.graph.physical={v:1,locations:{w:'ring',f:'ring'},
  area:'ring',topSide:null,grip:null};
 return m;
};
for(let i=0;i<REST.length;i++){
 const id=REST[i],m=fixture(31422+i);
 if(id==='rs_leg_lace'){
  assert.equal(G.isValid(m,id),false,'leg lace needs acquired leg control');
  G.apply(m,'leg_wrench');
 }
 assert.equal(G.isValid(m,id),true,'rest control available: '+id);
 G.apply(m,id);
 assert.equal(m.graph.physical.grip?.type||null,expected[id]||null,
  'rest hold creates exactly its controlled grip: '+id);
 if(expected[id]){
  assert.equal(m.graph.physical.grip.side,'w','control owner retained '+id);
  assert.equal(m.graph.physical.grip.source,id,'grip acquired by the visible action '+id);
 }
}
for(const [from,to,type] of [
 ['rs_wrist_mat','sm_kimura','ground-arm'],
 ['rs_armbar_rest','sm_armbar','ground-arm'],
 ['rs_hammerlock_mat','sm_fujiwara','ground-arm'],
 ['rs_side_headlock','sm_chinlock','ground-head'],
 ['rs_front_chancery','sm_dragon_sleeper','ground-head'],
 ['rs_mat_stretch','sm_camel','ground-back'],
 ['leg_wrench','sm_heel_hook','ground-leg']
]){
 const m=fixture();
 assert.equal(G.isValid(m,to),false,'no unearned grip: '+to);
 G.apply(m,from);
 assert.equal(m.graph.physical.grip?.type,type,'actual setup grip '+from);
 assert.equal(G.isValid(m,to),true,'legal earned hold '+from+' > '+to);
 const attempt=G.startGrapple(m,to);
 assert.equal(attempt,true,'committed submission '+to);
 m.r=()=>.999;m.t+=10;
 assert.equal(G.resolveGrapple(m),true,'resolution '+to);
 assert.equal(m.graph.grappleAttempts.at(-1).outcome,'landed');
 assert.equal(m.graph.events.at(-1).id,to);
}
// Defensive rest escapes and blocks must answer the *actual previous* hold.
let verifiedEscapes=0,verifiedBlocks=0;
for(const id of REST){
 const rev=id+'_rev',blk=id+'_blk';
 if(!G.A[rev]&&!G.A[blk])continue;
 const m=fixture(66110+verifiedEscapes);
 assert.equal(G.isValid(m,rev),false,'rest defence cannot appear unattached: '+id);
 if(id==='rs_leg_lace')G.apply(m,'leg_wrench');
 G.apply(m,id);
 if(G.A[rev]){
  assert.equal(G.isValid(m,rev),true,'actual rest hold exposes named escape '+id);
  const copy=fixture(71110+verifiedEscapes);
  if(id==='rs_leg_lace')G.apply(copy,'leg_wrench');
  G.apply(copy,id);
  G.apply(copy,rev);
  assert.equal(copy.story.control,'f','the held wrestler escapes '+id);
  verifiedEscapes++;
 }
 if(G.A[blk]){
  assert.equal(G.isValid(m,blk),true,'actual rest hold exposes defended block '+id);
  verifiedBlocks++;
 }
 const overdue=fixture(81110+verifiedEscapes);
 if(id==='rs_leg_lace')G.apply(overdue,'leg_wrench');
 G.apply(overdue,id);
 overdue.t+=30;
 if(G.A[rev])assert.equal(G.isValid(overdue,rev),false,
  'old hold cannot be escaped after a separate exchange: '+id);
}
assert.ok(verifiedEscapes>=10);
assert.ok(verifiedBlocks>=10);
const rested=fixture();
G.apply(rested,'rs_wrist_mat');
const original=rested.graph.physical.grip;
G.apply(rested,'mat_hold');
assert.equal(rested.graph.physical.grip?.type,'ground-arm',
 'neutral mat positional action preserves a same-owner arm grip');
assert.equal(rested.graph.physical.grip?.at,original.at,
 'neutral continuation must not refresh grip lifetime');
G.apply(rested,'mat_scramble');
assert.equal(rested.graph.physical.grip,null,'scramble releases the hold');
assert.equal(G.isValid(rested,'sm_kimura'),false,
 'escaped defender cannot still be trapped in the kimura');
const stolen=fixture();
G.apply(stolen,'rs_wrist_mat');
stolen.story.control='f';
assert.equal(G.isValid(stolen,'sm_kimura'),false,
 'opponent does not inherit the other wrestler grip');
const loose=fixture();
G.apply(loose,'rs_wrist_mat');
G.apply(loose,'rs_cover_rest');
assert.equal(loose.graph.physical.grip,null,
 'a loose lateral cover is not retained arm control');
const saved=fixture();
G.apply(saved,'rs_front_chancery');
const resumed=M.restore(JSON.parse(JSON.stringify({...saved,rState:saved.r.getState()})));
assert.equal(resumed.graph.physical.grip.type,'ground-head');
assert.equal(G.isValid(resumed,'sm_dragon_sleeper'),true,
 'saved actual head control allows the original submission');
assert.equal(JSON.stringify(resumed.graph.physical),JSON.stringify(saved.graph.physical));
console.log('PASS Phase 3 rest controls: all '+REST.length+
 ' rest holds audited; '+verifiedEscapes+' exact escapes, '+verifiedBlocks+' blocks, 7 earned submissions, ownership and save/replay.');
