'use strict';
// Targeted Phase 4 audit: run only when this suite changes, or on a manual full audit.
const assert=require('node:assert/strict');
const {run,summary}=require('../tools/long-career-audit.cjs');
const scenarios=[{seed:13,policy:'lean',seasons:5},{seed:27,policy:'balanced',seasons:5},{seed:41,policy:'world',seasons:10}];
for(const {seed,...options} of scenarios){
 const r=run(seed,options);console.log('LONG CAREER '+JSON.stringify(summary(r)));
 assert.deepEqual(r.errors,[],r.policy+' '+seed+': '+JSON.stringify(r.errors));
 assert.ok(r.weeks>0&&r.reloads>0,'the audit exercised week progression and reload');
 if(r.policy==='world')assert.equal(r.weeks,r.requestedWeeks,'the isolated circuit completed ten seasons');
 // Bankruptcies and talent depletion are measured outcomes, not hidden by a subsidy.
}
const a=run(91,{seasons:1,policy:'lean'}),b=run(91,{seasons:1,policy:'lean'});
assert.deepEqual(a,b,'identical seed and policy replay exactly');
console.log('PASS long career audit: ownership, retirement, finances, reloads and deterministic replay');
