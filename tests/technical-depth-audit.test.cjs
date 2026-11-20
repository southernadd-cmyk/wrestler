'use strict';
const assert=require('node:assert/strict'),audit=require('../tools/graph-lab/technical-depth-audit.cjs');
const r=audit.capture(1);
assert.equal(r.totalBouts,72);
assert.equal(r.groups.length,18);
if(r.errors.length)console.log('Ledger diagnostic cases:',JSON.stringify(r.groups.filter(g=>g.ledgerErrors>0).slice(0,3).map(g=>({id:g.tier+'/'+g.minutes+'/'+g.plan,errors:g.ledgerErrors,samples:g.ledgerExamples})),null,2));
assert.deepEqual(r.errors,[]);
for(const g of r.groups){
 assert.equal(g.bouts,4);
 assert.equal(g.ledgerErrors,0);
 assert.ok(g.grapplesLanded<=g.grapplesAttempted);
 assert.ok(Number.isFinite(g.actualLinkedPairs));
}
console.log('PASS read-only Technical: 72 seeded actual matches, matched plans and valid grappling ledgers.');
