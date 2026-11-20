'use strict';
const assert=require('node:assert/strict');
const audit=require('../tools/graph-lab/style-depth-audit.cjs');
const r=audit.capture(1);
assert.equal(r.schema,'office-style-depth-v1');
assert.equal(r.styles.length,3);
assert.equal(r.totalMatches,3*(3*4*3*5+4*2*5+10*5));
assert.deepEqual(audit.failures(r),[]);
for(const s of r.styles){
 assert.equal(s.matrix.length,15);
 assert.equal(s.lengths.length,9);
 assert.equal(s.realRows.length,20);
 assert.deepEqual(new Set(s.matrix.map(x=>x.plan)),new Set(audit.PLANS));
 for(const t of audit.TIERS)
  assert.ok(s.matrix.filter(x=>x.tier===t.id).every(x=>x.matches===12));
 assert.ok(s.realRows.every(x=>x.matches===2));
 assert.ok(s.headliners.every(x=>x.matches===10));
}
const repeat=audit.capture(1,['Technical']);
assert.equal(JSON.stringify(repeat.styles[0]),JSON.stringify(r.styles[0]));
assert.match(audit.markdown(r),/Real unmodified Technical wrestlers/);
assert.match(audit.markdown(r),/PASS/);
console.log('PASS: all three style-depth audits are complete, paired and deterministic.');
