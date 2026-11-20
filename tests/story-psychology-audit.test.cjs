'use strict';
const assert=require('node:assert/strict');
const audit=require('../tools/graph-lab/story-psychology-audit.cjs');
const d=audit.capture(1);
assert.equal(d.totalBouts,72);
assert.equal(d.rows.length,18);
assert.deepEqual(d.errors,[]);
for(const r of d.rows){
 assert.equal(r.bouts,4);
 assert.ok(r.stars>=0&&r.stars<=5);
 assert.ok(r.actualHeatHopeDenialComebackPct<=r.actualHeatHopeComebackPct);
 assert.ok(r.scheduledNearfallsWithoutLead<=r.scheduledNearfallsTotal);
 assert.ok(r.distinctLateFinishOffence>=0);
 assert.ok(r.finalOffenceGapSeconds>=0);
 assert.equal(r.earlyScheduledNearfall,0,'scheduled nearfall must not precede established match timing');
}
console.log('PASS read-only Story: 72 genuine matches; outcomes, psychology sequences and nearfall provenance separated.');
