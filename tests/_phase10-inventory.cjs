'use strict';
const assert=require('node:assert/strict');
// Original Phase 9 metrics and the incremental Phase 10 additions stay exact.
const PHASE9_BASE=Object.freeze({nodes:969,edges:6333,moves:336,reversals:324,blocks:209});
const PHASE10_ADDED=Object.freeze({nodes:10,edges:68,moves:4,reversals:4,blocks:1});
const PHYSICAL_PILOT_ADDED=Object.freeze({nodes:1,edges:6,moves:0,reversals:0,blocks:0});
const EXPECTED=Object.freeze(Object.fromEntries(Object.keys(PHASE9_BASE)
 .map(k=>[k,PHASE9_BASE[k]+PHASE10_ADDED[k]+PHYSICAL_PILOT_ADDED[k]])));
const NEW_MOVES=Object.freeze(['sx_deadlift_bridge','os_floor_piledriver','os_ramp_suplex','os_barricade_spear']);
function verify(G){
 const actual=G.validate();
 assert.equal(actual.errors.length,0,actual.errors.join('; '));
 for(const key of Object.keys(EXPECTED))assert.equal(actual[key],EXPECTED[key],
  'Phase 10 '+key+' must equal historical graph plus named spot additions');
 assert.equal(G.PHASE9_NEW_EDGES.length,144,'keep all original Phase 9 authored edges');
 const mapped=Object.values(G.SCRIPTED_SPOT_IDS||{});
 assert.equal(mapped.length,12,'all 12 named scripted spots mapped');
 assert.equal(new Set(mapped).size,12,'scripted spots have distinct move identities');
 for(const id of mapped)assert.ok(G.A[id],'scripted spot unavailable in graph '+id);
 for(const id of NEW_MOVES)assert.ok(Object.values(G.CATALOG.F)
  .some(f=>f.moves.some(m=>m[0]===id)),'Phase 10 catalogue move missing '+id);
 return actual;
}
module.exports={PHASE9_BASE,PHASE10_ADDED,PHYSICAL_PILOT_ADDED,EXPECTED,NEW_MOVES,verify};
