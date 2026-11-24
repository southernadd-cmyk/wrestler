'use strict';
// Phase 5: complete 20 ground + 11 roll-up nearfall matrix; all defenses
// must be the exact response to a real same-wrestler pending contact attempt.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-catalog.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
  {window:root,console,Math,Date,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const ground=G.GROUND_PILOT,pins=G.PIN_PILOT,contact=G.CONTACT_PILOT;
assert.equal(ground.length,20,'all 20 authored ground attacks');
assert.equal(pins.length,11,'all 11 authored roll-ups');
assert.equal(contact.length,31,'entire separate Phase 5 family');
assert.equal(new Set(contact).size,31,'no parent counted twice');
assert.ok(contact.every(id=>A[id]?.family==='ground'||A[id]?.family==='pin'));
const setup=(id,seed=91017)=>{
 const m=M.create(lab.makeOptions(D,{wid:'juno',rid:'dee',
  slot:'main',plan:'technical',finish:'win_clean',seed}));
 m.stage='live';m.t=Math.floor(m.len*.84);m.wSt=m.fSt=100;
 m.story.control='w';m.story.position=A[id].requires;
 m.story.down=A[id].requires==='mat'?'f':null;
 m.graph.arc='escalation';m.graph.node=null;
 m.graph.physical={v:1,locations:{w:'ring',f:'ring'},area:'ring',
  grip:null,topSide:null};
 assert.equal(G.isValid(m,id),true,'legitimate '+id+' in prepared position');
 return m;
};
let landed=0,counters=0,blocks=0;
for(const id of contact){
 const kind=A[id].family,rev=id+'_rev',blk=id+'_blk';
 assert.ok(A[rev],'named parent has reversal '+id);
 const m=setup(id);
 const initialNearfalls=m.nearfalls||0;
 assert.equal(G.isValid(m,rev),false,'no floating defensive reversal '+id);
 if(A[blk])assert.equal(G.isValid(m,blk),false,'no floating block '+id);
 assert.equal(G.startContact(m,id),true,'real attempted '+id);
 assert.equal(m.graph.pendingContact.id,id,'parent recorded '+id);
 assert.equal(G.isValid(m,rev),true,'now exact reversal is legal '+id);
 assert.equal(G.startContact(m,id),false,'no duplicated pending '+id);
 m.r=()=>.999;
 assert.equal(G.resolveContact(m),true,'resolves same beat '+id);
 const e=m.graph.events.at(-1),a=m.graph.contactAttempts.at(-1);
 assert.equal(e.id,id,'actual landing '+id);
 assert.equal(e.attemptedMove,id);
 assert.equal(e.contactKind,kind);
 assert.equal(e.contactResolution,'landed');
 assert.equal(e.contactAttemptSeq,a.seq);
 assert.equal(a.actionId,id);
 assert.equal(a.outcome,'landed');
 assert.equal(m.graph.pendingContact,null);
 assert.equal(m.nearfalls,initialNearfalls+(kind==='pin'?1:0),
  'only a landed pin gets a nearfall '+id);
 landed++;
 const d=setup(id,91018);
 const dNear=d.nearfalls||0;
 assert.equal(G.startContact(d,id),true);d.r=()=>0;
 assert.equal(G.resolveContact(d),true);
 const de=d.graph.events.at(-1),da=d.graph.contactAttempts.at(-1);
 assert.equal(de.id,rev,'named reversal of real attack '+id);
 assert.equal(de.attemptedMove,id);
 assert.equal(de.contactResolution,'counter');
 assert.equal(de.contactAttemptSeq,da.seq);
 assert.equal(da.outcome,'counter');
 assert.equal(d.nearfalls,dNear,'defended pin has no nearfall '+id);
 counters++;
 if(A[blk]){
  const b=setup(id,91019),before=b.nearfalls||0;
  assert.equal(G.startContact(b,id),true);
  // Draw in the authored block window rather than relying on a
  // fixed number that a particular worker can counter first.
  const actor=b.w,defender=b.f;
  const skillA=actor.ring*.65+actor.psych*.35;
  const skillD=defender.ring*.65+defender.psych*.35;
  const base=kind==='pin'?.19:.14;
  const chance=Math.max(.07,Math.min(.32,base+(skillD-skillA)/350));
  b.r=()=>chance+.015;
  assert.equal(G.resolveContact(b),true);
  assert.equal(b.graph.events.at(-1).id,blk,'actual block '+id);
  assert.equal(b.graph.contactAttempts.at(-1).outcome,'block');
  assert.equal(b.nearfalls,before,'blocked cover cannot earn count '+id);
  blocks++;
 }
}
// Hard ground constraint: player may only attack if the OTHER wrestler is down.
const falseGround=setup('gd_elbow_drop',92021);
falseGround.story.down='w';
assert.equal(G.isValid(falseGround,'gd_elbow_drop'),false,
 'the downed worker cannot elbow-drop themselves');
assert.equal(G.startContact(falseGround,'gd_elbow_drop'),false);
// Hard pin constraint: no cradle on already grounded opponents and
// no pinfalls at all in submission-only stipulations.
const falsePin=setup('pn_small_package',92022);
falsePin.story.position='mat';falsePin.story.down='f';
assert.equal(G.isValid(falsePin,'pn_small_package'),false);
assert.equal(G.startContact(falsePin,'pn_small_package'),false);
const subPin=setup('pn_schoolboy',92023);subPin.o.stip='submission';
assert.equal(G.isValid(subPin,'pn_schoolboy'),false);
assert.equal(G.startContact(subPin,'pn_schoolboy'),false);
const ringsidePin=setup('pn_backslide',92024);
ringsidePin.graph.physical.locations.w='floor';
assert.equal(G.isValid(ringsidePin,'pn_backslide'),false,
 'in-ring cradle cannot be initiated on the floor');
// Two-beat state is still serialisable for an intercepted contact
// selection, even though ordinary matches resolve on the same tick.
const saved=setup('gd_knee_drop',92025);
assert.equal(G.startContact(saved,'gd_knee_drop'),true);
const resumed=M.restore(JSON.parse(JSON.stringify({...saved,rState:saved.r.getState()})));
assert.equal(resumed.graph.pendingContact.id,'gd_knee_drop');
saved.r=()=>.999;resumed.r=()=>.999;
G.resolveContact(saved);G.resolveContact(resumed);
assert.equal(JSON.stringify(saved.graph.contactAttempts),JSON.stringify(resumed.graph.contactAttempts));
assert.equal(JSON.stringify(saved.graph.events),JSON.stringify(resumed.graph.events));
const interrupted=setup('pn_jackknife',92026);
assert.equal(G.startContact(interrupted,'pn_jackknife'),true);
interrupted.story.position='mat';interrupted.story.down='f';
const count=interrupted.nearfalls||0;
assert.equal(G.resolveContact(interrupted),true);
assert.equal(interrupted.graph.contactAttempts.at(-1).outcome,'interrupted');
assert.equal(interrupted.nearfalls,count);
console.log('PASS Phase 5: '+landed+' landed ground/pin exchanges, '+counters+
 ' exact-parent counters, '+blocks+' blocks, zero phantom nearfalls, real canvas position and saved-state continuity');
