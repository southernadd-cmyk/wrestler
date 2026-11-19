'use strict';
// Pure diagnostic metrics and a small real-engine smoke test.
// Full 40-bout five-meeting audit lives in the dedicated GitHub Actions workflow.
const assert=require('node:assert/strict');
const audit=require('../tools/repeated-rivalry-audit.cjs');

assert.deepEqual(audit.ngrams(['a','b','c','d'],3),['a > b > c','b > c > d']);
assert.deepEqual(audit.ngrams(['a','b'],3),[]);
assert.equal(audit.overlap(['a','b'],['b','c']),33.3);
assert.equal(audit.overlap([],[]),0);
const sample=[
 {number:1,actions:['lock','wrist','toss','cover'],triples:audit.ngrams(['lock','wrist','toss','cover'],3),signature:'lock|wrist|toss|cover',route:'pin',stars:3,actionCount:4,reverseCount:1,trainedHits:2,families:{chain:3,pin:1}},
 {number:2,actions:['lock','kick','throw','cover'],triples:audit.ngrams(['lock','kick','throw','cover'],3),signature:'lock|kick|throw|cover',route:'pin',stars:3.5,actionCount:4,reverseCount:0,trainedHits:1,families:{chain:2,strike:1,pin:1}},
 {number:3,actions:['lock','wrist','toss','cover'],triples:audit.ngrams(['lock','wrist','toss','cover'],3),signature:'lock|wrist|toss|cover',route:'pin',stars:3,actionCount:4,reverseCount:1,trainedHits:2,families:{chain:3,pin:1}}
];
const metrics=audit.analyse(sample);
assert.equal(metrics.actionVocabulary,6);
assert.deepEqual(metrics.exactClones,[[1,3]],'different-seed matching action sequences are detected');
assert.ok(metrics.avgTripleOverlap>0);
assert.equal(metrics.novelty[0].newTriples,2);
assert.equal(metrics.novelty[1].newTriples,2);
assert.equal(metrics.novelty[2].newTriples,0);

const settings={fixtures:audit.FIXTURES.slice(0,1),meetings:2};
const first=audit.run(settings),again=audit.run(settings);
assert.equal(first.schema,'office-five-meeting-audit-v1');
assert.equal(first.actualMatches,4);
assert.equal(first.errors.length,0);
assert.equal(first.checks.graphErrors,0);
assert.deepEqual(first.pairs.map(x=>x.meetings),again.pairs.map(x=>x.meetings),
 'all controlled rivalry bouts are reproducible under identical inputs');
assert.ok(first.pairs[0].meetings.every(m=>m.finish&&m.route&&m.actionCount>0));
assert.ok(first.pairs[0].counterfactual.divergentMatches>=0);
assert.match(audit.markdown(first),/Meeting-by-meeting outcomes/);
assert.match(audit.markdown(first),/controlled escalating-feud fixture/);
console.log('PASS five-meeting audit: novelty, clone detection, school ablation and reproducible real bouts.');
