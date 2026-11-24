'use strict';
const {EXPECTED}=require('./_phase10-inventory.cjs');
// Phase 8: check actual authored transitions and provisional roster coverage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-catalog.js','graph-narration.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
 {window:root,console,Date,Math,JSON},{filename:file});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,G=root.OfficeMatch.GRAPH,B=root.OfficeTechniqueBackgrounds;
assert.equal(G.validate().errors.length,0);
assert.equal(G.validate().nodes,EXPECTED.nodes,'no extra move IDs invented');
assert.equal(G.TECHNIQUE_DEPTH.length,14);
assert.equal(B.validate(D,G,root.OfficeTechniqueRegistry).assigned,80);
assert.equal(B.validate(D,G,root.OfficeTechniqueRegistry).unassigned,0);
assert.equal(Object.keys(B.ASSIGNMENTS).length,40,'previous 40 allocations retained');
assert.equal(Object.keys(B.PROVISIONAL_ASSIGNMENTS).length,40,'40 new, explicitly provisional gameplay identities');
const seen=new Set();
let newEdges=0;
for(const {from,to,weight,kind} of G.TECHNIQUE_DEPTH){
 const edge=from+'>'+to,a=G.A[from],b=G.A[to];
 assert.ok(a&&b,edge+' must use existing nodes');
 assert.equal(a.zone,b.requires,edge+' has a broken physical-position contract');
 assert.ok(!seen.has(edge),'duplicate curated link '+edge);
 seen.add(edge);
 assert.ok(weight>0&&weight<=.8,'bounded curated emphasis');
 assert.equal(kind,'followup');
 assert.ok(a.next.some(([id,w])=>id===to&&w>0),edge+' must be live in the actual graph');
}
for(const [id,school] of Object.entries(B.PROVISIONAL_ASSIGNMENTS)){
 assert.ok(D.ALL.some(w=>w.id===id),'proposed identity must belong to active cast '+id);
 assert.equal(B.get(id).id,school,'proposal participates in actual matching '+id);
 assert.ok(!Object.hasOwn(B.ASSIGNMENTS,id),'never overwrite a pre-existing identity');
}
console.log('PASS Phase 8: 14 physically compatible transitions and 80/80 gameplay technique identities; no new move IDs or overwritten schools.');
