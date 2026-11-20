'use strict';
// The diagnostic may reveal severe underpowered tiers, but the first audit
// must never silently tune away the evidence or weaken existing gates.
const assert=require('node:assert/strict');
const audit=require('../tools/graph-lab/flyer-depth-audit.cjs');
const r=audit.capture(1),again=audit.capture(1);
assert.equal(r.schema,'office-flyer-depth-audit-v1');
assert.equal(r.matchedGroups,36);
assert.equal(r.totalMatches,36*5+4*2*5+10*5);
assert.deepEqual(audit.failures(r),[]);
assert.equal(JSON.stringify(r),JSON.stringify(again),
 'identical conditions and seeds must reproduce the same report');
assert.deepEqual(new Set(r.matrix.map(x=>x.plan)),new Set(audit.PLANS));
assert.deepEqual(new Set(r.matrix.map(x=>x.tier)),new Set(audit.LEVELS.map(x=>x.id)));
for(const tier of audit.LEVELS){
 const group=r.matrix.filter(x=>x.tier===tier.id);
 assert.equal(group.length,5);
 assert.ok(group.every(x=>x.matches===12));
 const lengths=r.lengthRows.filter(x=>x.tier===tier.id);
 assert.equal(lengths.reduce((n,x)=>n+x.matches,0),12);
 assert.ok(lengths.every(x=>x.matches===4));
}
for(const w of r.realFlyers)assert.ok(r.realRows.filter(x=>x.wid===w.id).every(x=>x.matches===2));
assert.ok(r.headlineRows.every(x=>x.matches===10));
assert.match(audit.markdown(r),/Actual unmodified flyers/);
assert.match(audit.markdown(r),/PASS/);
console.log('PASS flyer-depth audit: real engine, matched five-plan skill treatments, durations, opponents, roster controls, headliner, reproducible results.');
