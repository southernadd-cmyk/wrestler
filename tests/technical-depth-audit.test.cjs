'use strict';
const assert=require('node:assert/strict'),audit=require('../tools/graph-lab/technical-depth-audit.cjs');
const r=audit.capture(1);
assert.equal(r.totalBouts,72);
assert.equal(r.groups.length,18);
assert.deepEqual(r.errors,[]);
for(const g of r.groups){
 assert.equal(g.bouts,4);
 assert.equal(g.ledgerErrors,0);
 assert.ok(g.grapplesLanded<=g.grapplesAttempted);
 assert.ok(Number.isFinite(g.actualLinkedPairs));
}
console.log('PASS read-only Technical: 72 seeded actual matches, matched plans and valid grappling ledgers.');
