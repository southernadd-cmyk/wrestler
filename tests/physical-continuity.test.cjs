'use strict';
// Match-engine physical continuity: selected realistic setups, not a rewrite
// of the Phase 9/10 story arcs or their frozen baseline measurements.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Date,Math,JSON},{filename:file});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
assert.equal(G.validate().errors.length,0);
const setup=(id,plan='spots')=>{
 for(const w of D.TALENT)for(const f of D.FOES){
  const m=M.create(lab.makeOptions(D,{wid:w.id,rid:f.id,slot:'main',plan,finish:'win_clean',seed:94117}));
  m.stage='live';m.t=Math.floor(m.len*.89);m.wSt=m.fSt=100;
  m.story.position=A[id].requires;m.story.down=m.story.position==='mat'?'f':null;
  m.story.control='w';m.graph.arc='escalation';m.graph.node=null;
  if(G.isValid(m,id))return m;
 }
 throw Error('No real pair can physically land '+id);
};
const fresh=(id,plan)=>{const m=setup(id,plan);m.story.position='standing';m.story.down=null;return m;};
const same=(m,id)=>{assert.ok(G.isValid(m,id),'expected physical eligibility: '+id);G.apply(m,id);};

// 1. "Outside" cannot mean both workers are on the floor for a rope dive.
const tope=fresh('dv_tope_con_hilo');
same(tope,'outside_toss');
assert.equal(tope.graph.physical.locations.w,'ring');
assert.equal(tope.graph.physical.locations.f,'floor');
assert.equal(G.isValid(tope,'dv_tope_con_hilo'),true);
same(tope,'floor_brawl');
assert.equal(tope.graph.physical.locations.w,'floor');
assert.equal(G.isValid(tope,'dv_tope_con_hilo'),false,'cannot dive out of a floor brawl');
same(tope,'floor_regroup');
assert.equal(G.isValid(tope,'dv_tope_con_hilo'),true,'return to ring enables the dive');

// 2. An apron spot must have an apron approach, a ramp suplex a ramp approach.
const apron=fresh('os_apron_ddt');
same(apron,'outside_toss');
assert.equal(G.isValid(apron,'os_apron_ddt'),false);
same(apron,'apron_stand');
assert.equal(apron.graph.physical.area,'apron');
assert.equal(G.isValid(apron,'os_apron_ddt'),true);
const ramp=fresh('os_ramp_suplex');
same(ramp,'outside_toss');
assert.equal(G.isValid(ramp,'os_ramp_suplex'),false);
same(ramp,'ramp_approach');
assert.equal(ramp.graph.physical.area,'ramp');
assert.equal(G.isValid(ramp,'os_ramp_suplex'),true);

// 3. Front-facelock ownership is real, temporary and shared by the named suplex/DDT.
const front=fresh('sx_vertical','technical');
assert.equal(G.isValid(front,'sx_vertical'),true,'legacy probe has no invented grip state');
same(front,'lockup');
assert.equal(G.isValid(front,'sx_vertical'),false,'standing alone cannot create a head grip');
same(front,'front_facelock');
assert.equal(front.graph.physical.grip.type,'front-facelock');
assert.equal(G.isValid(front,'sx_vertical'),true);
assert.equal(G.isValid(front,'nk_ddt'),true);
same(front,'strike_trade');
assert.equal(G.isValid(front,'sx_vertical'),false,'a disconnected exchange releases control');

// 4. A German requires the controlling worker's rear waistlock, not a generic grapple.
const rear=fresh('sx_german','technical');
same(rear,'lockup');
assert.equal(G.isValid(rear,'sx_german'),false);
same(rear,'go_behind');
assert.equal(G.isValid(rear,'sx_german'),true);
same(rear,'front_facelock');
assert.equal(G.isValid(rear,'sx_german'),false,'wrong grip cannot seed a German');

// 5. Leg holds need demonstrated leg access, and a reversal must release it.
const leg=setup('sm_ankle_lock','technical');
leg.story.position='standing';leg.story.down=null;
same(leg,'mat_takedown');
assert.equal(G.isValid(leg,'sm_ankle_lock'),false);
same(leg,'leg_wrench');
assert.equal(G.isValid(leg,'sm_ankle_lock'),true);
assert.equal(G.isValid(leg,'rs_leg_lace'),true);
same(leg,'mat_scramble');
assert.equal(G.isValid(leg,'rs_leg_lace'),false,'the original controller lost the leg');

// 6. Every superplex result belongs to the exact attempt from top_follow.
for(const id of G.SUPERPLEX_PILOT){
 const m=fresh(id);
 same(m,'corner_whip');same(m,'top_follow');
 assert.equal(m.graph.physical.topSide,'w');
 assert.equal(G.isValid(m,id),true,'legal named superplex '+id);
 assert.equal(G.isValid(m,id+'_rev'),false,'no free reversal '+id);
 assert.equal(G.isValid(m,id+'_blk'),false,'no free block '+id);
 assert.equal(G.startGrapple(m,id),true,'commit named high spot '+id);
 assert.equal(m.graph.pendingGrapple.id,id);
 assert.equal(G.isValid(m,id+'_rev'),true,'only this parent can be countered '+id);
 const before=m.graph.events.length;G.step(m);
 assert.equal(m.graph.events.length,before,'pending high spot locks graph step');
 m.r=()=>0;m.t+=10;
 assert.equal(G.resolveGrapple(m),true);
 assert.equal(m.graph.events.at(-1).id,id+'_rev');
 assert.equal(m.graph.events.at(-1).attemptedMove,id);
 assert.equal(m.graph.grappleAttempts.at(-1).outcome,'counter');
 assert.equal(m.graph.pendingGrapple,null);
}
const saved=fresh('sp_superplex');same(saved,'corner_whip');same(saved,'top_follow');
G.startGrapple(saved,'sp_superplex');
const restored=M.restore(JSON.parse(JSON.stringify({...saved,rState:saved.r.getState()})));
assert.equal(restored.graph.physical.topSide,'w');
assert.equal(restored.graph.pendingGrapple.id,'sp_superplex');
saved.t+=10;restored.t+=10;
G.resolveGrapple(saved);G.resolveGrapple(restored);
assert.equal(JSON.stringify(saved.graph.grappleAttempts),JSON.stringify(restored.graph.grappleAttempts));
assert.equal(JSON.stringify(saved.graph.events),JSON.stringify(restored.graph.events));

// Old saves without a physical descriptor retain their original coarse checks
// until the first real move establishes their geometry.
const old=setup('sx_vertical');delete old.graph.physical;
const migrated=M.restore(JSON.parse(JSON.stringify({...old,rState:old.r.getState()})));
assert.equal(G.isValid(migrated,'sx_vertical'),true);
G.apply(migrated,'lockup');
assert.equal(G.isValid(migrated,'sx_vertical'),false);

// The earlier pilot forgot to update physical locations when the narrative arc
// stood both wrestlers up. A scene reset must also release top-rope and floor
// geography, not just change the old story.position field.
const arcReset=fresh('os_ramp_suplex');
same(arcReset,'outside_toss');same(arcReset,'ramp_approach');
arcReset.graph.started=true;
arcReset.graph.arc='opening';arcReset.graph.age=99;
arcReset.t=Math.floor(arcReset.len*.98);
G.advance(arcReset,arcReset.t/arcReset.len);
assert.equal(arcReset.story.position,'standing','arc reset returns wrestlers inside');
assert.equal(arcReset.graph.physical.area,'ring','arc reset synchronises ring area');
assert.equal(arcReset.graph.physical.locations.w,'ring');
assert.equal(arcReset.graph.physical.locations.f,'ring');
assert.equal(arcReset.graph.physical.grip,null);

const topReset=fresh('sp_superplex');same(topReset,'corner_whip');same(topReset,'top_follow');
topReset.graph.started=true;topReset.graph.arc='opening';topReset.graph.age=99;
topReset.t=Math.floor(topReset.len*.98);
G.advance(topReset,topReset.t/topReset.len);
assert.equal(topReset.story.position,'standing');
assert.equal(topReset.graph.physical.topSide,null,'top-rope scene reset clears top ownership');
assert.equal(topReset.graph.physical.locations.w,'ring');
assert.equal(topReset.graph.physical.locations.f,'ring');

// Ordinary top-rope contests must be affordable *before* a corner approach
// starts. No new move becomes legal merely to satisfy a variety target.
const paced=fresh('sp_superplex','spots');
paced.t=Math.floor(paced.len*.64);paced.wSt=paced.fSt=85;
assert.equal(G.affordableSuperplex(paced,true),true,'fresh wrestler can afford corner whip then superplex');
same(paced,'corner_whip');
const originalPreflight=JSON.stringify({t:paced.t,story:paced.story,
 physical:paced.graph.physical,wSt:paced.wSt,fSt:paced.fSt,rng:paced.r.getState()});
assert.equal(G.affordableSuperplex(paced),true,'fresh wrestler can afford the rope contest');
assert.equal(JSON.stringify({t:paced.t,story:paced.story,physical:paced.graph.physical,
 wSt:paced.wSt,fSt:paced.fSt,rng:paced.r.getState()}),originalPreflight,
 'superplex forecast cannot mutate the match or RNG');
assert.ok(G.pool(paced).some(([id])=>id==='top_follow'),'affordable named superplex has a corner route');
const tiredSt=paced.wSt;paced.wSt=14;
assert.equal(G.affordableSuperplex(paced),false,'an exhausted wrestler cannot start the climb');
assert.equal(G.pool(paced).some(([id])=>id==='top_follow'),false,
 'a doomed superplex must not be offered even through a catalogue edge');
paced.wSt=tiredSt;
paced.t=Math.floor(paced.len*.95);
assert.equal(G.affordableSuperplex(paced),false,'no fresh superplex starts with no time to finish');
paced.t=Math.floor(paced.len*.64);
same(paced,'top_follow');
assert.equal(G.readyTopContest(paced),true,'the paired top-rope setup has a legal organic continuation');
assert.equal(G.isValid(paced,'sp_superplex_rev'),false,'no free counter before the specific commitment');
assert.ok(G.pool(paced).some(([id])=>G.SUPERPLEX_PILOT.includes(id)),
 'the next move pool offers an actual named top-rope move');
G.startGrapple(paced,'sp_superplex');
assert.equal(paced.graph.pendingGrapple?.id,'sp_superplex');
assert.equal(G.readyTopContest(paced),true,'the staged exchange remains legal until resolution');
paced.t+=10;paced.r=()=>.999;
assert.equal(G.resolveGrapple(paced),true);
assert.equal(paced.graph.grappleAttempts.at(-1).outcome,'landed');
assert.equal(paced.graph.events.at(-1).id,'sp_superplex');

// A small full-engine integration smoke checks the invariant at actual graph
// decisions across five plans; it would fail on the pre-fix pilot.
let checked=0;
const originalStep=G.step;
G.step=(m)=>{
 const state=m.story,ph=m.graph?.physical;
 if(ph?.v===1){
  checked++;
  if(state.position==='outside')
   assert.notEqual(ph.area,'ring','outside cannot be physically inside at '+m.o.seed);
  else assert.equal(ph.area,'ring','narrated in-ring reset still at ringside at '+m.o.seed);
  if(state.position==='top'){
   // A solo top_climb/springboard_rise has only one worker up top.
   // topSide is deliberately reserved for top_follow, when both are perched
   // on the turnbuckles and the same worker owns the superplex attempt.
   assert.equal(ph.locations[state.control],'top','top wrestler position differs at '+m.o.seed);
   if(m.graph.node==='top_follow')
    assert.equal(ph.topSide,state.control,'paired top-rope owner differs at '+m.o.seed);
   else assert.equal(ph.topSide,null,'a solo rope climb cannot own a paired top-rope grapple');
  }else assert.equal(ph.topSide,null,'standing/mat wrestler still recorded on top at '+m.o.seed);
 }
 return originalStep(m);
};
for(let i=0;i<80;i++){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*5)%D.FOES.length];
 const options=lab.makeOptions(D,{wid:w.id,rid:f.id,plan:['technical','story','brawl','spots','safe'][i%5],
  finish:'win_clean',slot:['opener','mid','main'][i%3],seed:90021+i*41});
 const bout=lab.runMatch(root,options);
 assert.ok(bout.done&&bout.final,'full match did not complete at '+options.seed);
}
G.step=originalStep;
assert.ok(checked>100,'physical state must be checked at many real action decisions');

console.log('PASS physical continuity pilot: ring/floor, apron/ramp, three grips, all named superplex counters, replay and save migration.');
