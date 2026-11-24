'use strict';
const {EXPECTED}=require('./_phase10-inventory.cjs');
// Phase 7 readiness gate: select only grounded, existing authored counters.
// This is an audit, NOT a claim that grapples already have persistent attempts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-catalog.js','match-graph.js','match-commentary.js','match-engine.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Date,Math,JSON},{filename:file});
}
root.OfficeRosterV4.enableProfiles();
const G=root.OfficeMatch.GRAPH,A=G.A;
const candidates=['sx_vertical','sx_german','sm_sleeper','sm_ankle_lock'];
assert.equal(G.validate().errors.length,0);
for(const id of candidates){
 const attack=A[id],rev=A[id+'_rev'],blk=A[id+'_blk'];
 assert.ok(attack,'missing parent '+id);
 assert.ok(rev,'missing existing reversal '+id);
 assert.equal(rev.counterOf,id,'reversal must refer to exact parent '+id);
 assert.equal(rev.reverse,true,'reversal must transfer control '+id);
 assert.ok(['suplex','submission'].includes(attack.family),'unexpected family '+id);
 assert.equal(rev.requires,attack.requires,'counter setup should match attempt position '+id);
 if(blk){
  assert.equal(blk.blockOf,id,'block must refer to exact parent '+id);
  assert.equal(blk.requires,attack.requires,'block should share setup position '+id);
 }
 console.log(id,attack.family,'entry='+attack.requires,'impact='+attack.zone,
  'reversal='+rev.zone,'block='+(blk?blk.zone:'none'));
}
assert.equal(G.validate().nodes,EXPECTED.nodes,'readiness audit must not create nodes');
console.log('PASS Phase 7 readiness: four exact authored grapple counter links audited; transaction logic not yet enabled.');
