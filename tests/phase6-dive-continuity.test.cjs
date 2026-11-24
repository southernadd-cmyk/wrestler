'use strict';
// All nine outside dives require a genuine named launch, correct locations
// and an exact corresponding defence. Top-rope attacks require a climber.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-catalog.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
   {window:root,console,Math,Date,JSON},{filename:file});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const ids=G.DIVE_PILOT;
assert.equal(ids.length,9,'entire nine-dive family');
assert.equal(new Set(ids).size,9);
assert.ok(ids.every(id=>A[id]?.family==='dive'&&A[id+'_rev']&&A[id+'_blk']));
function setup(id,seed=987117){
 const m=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',slot:'main',
   plan:'spots',finish:'win_clean',seed}));
 m.stage='live';m.t=Math.ceil(m.len*.86);m.wSt=m.fSt=100;
 m.story.position='standing';m.story.down=null;m.story.control='w';
 m.graph.arc='escalation';m.graph.node=null;
 G.apply(m,'outside_toss');
 if(['dv_apron_senton','dv_cannonball'].includes(id))G.apply(m,'apron_stand');
 assert.equal(G.isValid(m,id),true,'credible ring/apron dive '+id);
 assert.ok(G.pool(m).some(([move,weight])=>move===id&&weight>0),
   'a physically prepared dive must genuinely enter the organic candidate pool '+id);
 return m;
}
for(const id of ids){
 const m=setup(id),rev=id+'_rev',blk=id+'_blk';
 assert.equal(G.isValid(m,rev),false,'no defender without named attempt '+id);
 assert.equal(G.isValid(m,blk),false,'no block without named attempt '+id);
 assert.equal(G.startAerial(m,id),true,'start committed dive '+id);
 assert.equal(m.graph.pendingAerial.position,'outside');
 assert.equal(G.startAerial(m,id),false,'no duplicate commitment '+id);
 assert.equal(G.isValid(m,rev),true,'defender can counter exact pending dive '+id);
 m.t+=10;m.r=()=>.999;
 assert.equal(G.resolveAerial(m),true);
 const hit=m.graph.events.at(-1),a=m.graph.aerialAttempts.at(-1);
 assert.equal(hit.id,id);assert.equal(hit.attemptedMove,id);
 assert.equal(hit.aerialAttemptSeq,a.seq);assert.equal(hit.aerialResolution,'landed');
 assert.equal(a.outcome,'landed');assert.equal(m.graph.pendingAerial,null);
 const d=setup(id,987118);
 G.startAerial(d,id);d.t+=10;d.r=()=>0;
 assert.equal(G.resolveAerial(d),true);
 const c=d.graph.events.at(-1),def=d.graph.aerialAttempts.at(-1);
 assert.equal(c.id,rev,'exact generated reversal '+id);
 assert.equal(c.attemptedMove,id);assert.equal(c.aerialResolution,'counter');
 assert.equal(def.actionId,rev);assert.equal(def.outcome,'counter');
 assert.equal(G.isValid(d,rev),false,'cannot repeat response after commitment '+id);
 const b=setup(id,987119);
 G.startAerial(b,id);b.t+=10;b.r=()=>.2;
 assert.equal(G.resolveAerial(b),true);
 assert.equal(b.graph.events.at(-1).id,blk,'defender can block named dive '+id);
 assert.equal(b.graph.aerialAttempts.at(-1).outcome,'block');
}
// A physically wrong source or target is not rescued by a narrative flag.
const off=setup('dv_suicide',987121);
off.graph.physical.locations.w='floor';
assert.equal(G.isValid(off,'dv_suicide'),false,'floor wrestler cannot dive through ropes');
const target=setup('dv_suicide',987122);
target.graph.physical.locations.f='ring';
assert.equal(G.isValid(target,'dv_suicide'),false,'no ringside target to dive onto');
const abort=setup('dv_suicide',987123);
G.startAerial(abort,'dv_suicide');abort.graph.physical.locations.w='floor';abort.t+=10;
assert.equal(G.resolveAerial(abort),true);
assert.equal(abort.graph.aerialAttempts.at(-1).outcome,'aborted');
assert.equal(abort.story.position,'outside','failed dive does not teleport wrestlers into ring');
assert.equal(abort.graph.events.at(-1).id,'outside_toss','failed dive is not a phantom landing');
const held=setup('dv_tope_con_hilo',987124);
G.startAerial(held,'dv_tope_con_hilo');
const saved=M.restore(JSON.parse(JSON.stringify({...held,rState:held.r.getState()})));
assert.equal(saved.graph.pendingAerial.id,'dv_tope_con_hilo');
held.t+=10;saved.t+=10;held.r=()=>.999;saved.r=()=>.999;
G.resolveAerial(held);G.resolveAerial(saved);
assert.equal(JSON.stringify(held.graph.aerialAttempts),JSON.stringify(saved.graph.aerialAttempts));
assert.equal(JSON.stringify(held.graph.events),JSON.stringify(saved.graph.events));
// Top-rope and superplex approaches must not be interchangeable.
const top=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',slot:'main',
 plan:'spots',finish:'win_clean',seed:987126}));
top.stage='live';top.t=Math.ceil(top.len*.84);top.wSt=top.fSt=100;
top.story.position='standing';top.story.down=null;top.story.control='w';
G.apply(top,'top_climb');
assert.equal(G.isValid(top,'ar_frog'),true,'a real top-rope climb permits frog splash');
top.graph.physical.locations.w='ring';
assert.equal(G.isValid(top,'ar_frog'),false,'narrative top flag without physical climber is not enough');
const both=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',slot:'main',
 plan:'spots',finish:'win_clean',seed:987127}));
both.stage='live';both.t=Math.ceil(both.len*.84);both.wSt=both.fSt=100;
both.story.position='standing';both.story.down=null;both.story.control='w';
G.apply(both,'corner_whip');G.apply(both,'top_follow');
assert.equal(G.isValid(both,'ar_frog'),false,
 'top-rope contest with both wrestlers perched cannot be a frog splash');
console.log('PASS Phase 6 outside dives: nine landed, reversed and blocked parent attempts; location, interruption, replay and top-rope launch checks.');
