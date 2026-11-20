'use strict';
const assert=require('node:assert/strict'),audit=require('../tools/graph-lab/technical-endurance-trace.cjs');
const x=audit.capture(1);
assert.equal(x.totalBouts,36);
assert.equal(x.rows.length,9);
for(const r of x.rows){
 assert.equal(r.bouts,4);
 assert.ok(r.bellStamina>=0&&r.bellStamina<=100);
 assert.ok(r.performedPositiveCostPerBout>=0);
 assert.ok(r.catchBreathersPerBout>=0);
 assert.ok(r.timeline.length>0);
}
console.log('PASS: 36 matched real stamina timelines and narrated recovery event accounting');
