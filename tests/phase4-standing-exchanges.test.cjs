'use strict';
// Phase 4: all 32 strike-family and 12 running-family original moves.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-catalog.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
  {window:root,console,Math,Date,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const ids=G.STRIKE_PILOT.filter(id=>!G.QUICK_NECK_IDS.includes(id));
assert.equal(G.CATALOG.members.strike.length,32);
assert.equal(G.CATALOG.members.running.length,12);
assert.equal(ids.length,43,'mutual exchange is intentionally not a committed attack');
assert.equal(ids.includes('st_fighting_spirit'),false);
assert.equal(new Set(ids).size,ids.length);
assert.ok(ids.every(id=>A[id]&&['strike','running'].includes(A[id].family)));
assert.ok(ids.every(id=>A[id+'_rev']),'all committed parents have a named defence');
const setup=(id='st_forearm',seed=89110)=>{
 const m=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',slot:'main',
  plan:'technical',finish:'win_clean',seed}));
 m.stage='live';m.t=Math.ceil(m.len*.85);m.wSt=m.fSt=100;
 m.story.position='standing';m.story.control='w';m.story.down=null;
 m.graph.arc='escalation';m.graph.node=null;
 assert.equal(G.isValid(m,id),true,'physically legal '+id);
 return m;
};
let landed=0,counters=0,blocks=0;
for(const id of ids){
 const m=setup(id),rev=id+'_rev',blk=id+'_blk';
 assert.equal(G.isValid(m,rev),false,'cannot counter non-attack: '+id);
 if(A[blk])assert.equal(G.isValid(m,blk),false,'cannot block non-attack: '+id);
 assert.equal(G.startStrike(m,id),true,'committed attack '+id);
 assert.equal(m.graph.pendingStrike.id,id);
 assert.equal(G.isValid(m,rev),true,'exact parent permits counter '+id);
 assert.equal(G.startStrike(m,id),false,'cannot stack commitments '+id);
 m.r=()=>.999;m.t+=10;
 assert.equal(G.resolveStrike(m),true,'resolves attempted '+id);
 const e=m.graph.events.at(-1),a=m.graph.strikeAttempts.at(-1);
 assert.equal(e.id,id,'real strike lands '+id);
 assert.equal(e.strikeAttemptSeq,a.seq);
 assert.equal(e.attemptedMove,id);
 assert.equal(a.outcome,'landed');
 assert.equal(e.strikeResolution,'landed');
 assert.equal(m.graph.pendingStrike,null);
 landed++;
 const d=setup(id);
 assert.equal(G.startStrike(d,id),true);
 d.r=()=>0;d.t+=10;
 assert.equal(G.resolveStrike(d),true);
 const de=d.graph.events.at(-1),da=d.graph.strikeAttempts.at(-1);
 assert.equal(da.outcome,'counter','named counter happens '+id);
 assert.equal(de.id,rev,'correct reversal '+id);
 assert.equal(de.attemptedMove,id);
 assert.equal(de.strikeAttemptSeq,da.seq);
 assert.notEqual(de.id,id,'counter is not phantom landed hit '+id);
 counters++;
 if(A[blk]){
  const b=setup(id);
  assert.equal(G.startStrike(b,id),true);
  b.r=()=>.19;b.t+=10;
  assert.equal(G.resolveStrike(b),true);
  const be=b.graph.events.at(-1),ba=b.graph.strikeAttempts.at(-1);
  assert.equal(ba.outcome,'block','named block happened '+id);
  assert.equal(be.id,blk);
  assert.equal(be.attemptedMove,id);
  blocks++;
 }
 const interrupted=setup(id);
 assert.equal(G.startStrike(interrupted,id),true);
 interrupted.story.control='f';interrupted.t+=10;
 assert.equal(G.resolveStrike(interrupted),true);
 assert.equal(interrupted.graph.strikeAttempts.at(-1).outcome,'interrupted');
}
// A real outside toss and apron setup must offer only legal apron dives
// for a trained/high-flying worker. A floor-bound attacker cannot
// magically perform an apron senton; ring dives remain ring-only.
const outside=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',slot:'main',
 plan:'spots',finish:'win_clean',seed:95147}));
outside.stage='live';outside.t=Math.floor(outside.len*.84);
outside.story.control='w';outside.story.position='standing';
outside.story.down=null;outside.wSt=outside.fSt=100;
G.apply(outside,'outside_toss');
assert.equal(outside.story.position,'outside');
assert.equal(outside.graph.physical.locations.w,'ring');
assert.equal(outside.graph.physical.locations.f,'floor');
assert.equal(G.isValid(outside,'dv_apron_senton'),false,
 'apron-only dive not legal from inside ring');
G.apply(outside,'apron_stand');
assert.equal(outside.graph.physical.locations.w,'apron');
assert.equal(outside.graph.physical.locations.f,'floor');
assert.equal(G.isValid(outside,'dv_apron_senton'),true);
assert.equal(G.isValid(outside,'dv_cannonball'),true);
assert.equal(G.isValid(outside,'dv_moonsault'),false,
 'regular ring dive cannot launch from apron');
const apronPool=new Map(G.pool(outside));
assert.ok((apronPool.get('dv_apron_senton')||0)>0,
 'actual apron setup must enter weighted legal dive selection');
assert.ok((apronPool.get('dv_cannonball')||0)>0,
 'actual apron setup must permit cannonball follow-up');
assert.equal(apronPool.has('dv_moonsault'),false,
 'unavailable ordinary dive must not be offered from apron');
assert.equal(G.isValid(outside,'os_apron_slam'),true,
 'the physically prepared apron slam remains legal for this pairing');
assert.ok((apronPool.get('os_apron_slam')||0)>0,
 'earned apron setup offers a body slam instead of always retreating');
const floorOnly=setup('st_forearm',95148);
G.apply(floorOnly,'outside_toss');
G.apply(floorOnly,'floor_brawl');
assert.equal(floorOnly.graph.physical.area,'floor');
assert.equal(G.isValid(floorOnly,'os_apron_slam'),false,
 'body slam on apron must not be performed from the floor');

const saved=setup('st_forearm',99128);
assert.equal(G.startStrike(saved,'st_forearm'),true);
const clone=M.restore(JSON.parse(JSON.stringify({...saved,rState:saved.r.getState()})));
assert.equal(clone.graph.pendingStrike.id,'st_forearm');
saved.t+=10;clone.t+=10;
G.resolveStrike(saved);G.resolveStrike(clone);
assert.equal(JSON.stringify(saved.graph.strikeAttempts),JSON.stringify(clone.graph.strikeAttempts));
assert.equal(JSON.stringify(saved.graph.events),JSON.stringify(clone.graph.events));
console.log('PASS Phase 4: '+landed+' exact landed attacks, '+counters+
 ' counters, '+blocks+' blocks, interruptions, duplicate prevention and saved attempts.');
