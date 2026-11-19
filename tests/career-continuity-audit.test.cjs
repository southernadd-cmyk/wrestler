'use strict';
// Run production match, memory, promo and career systems across FIVE real
// advancing weeks; ensure results are not manufactured as standalone ledgers.
const assert=require('node:assert/strict');
const audit=require('../tools/career-continuity-audit.cjs');
assert.equal(audit.FINISHES.length,5);
const first=audit.play(26011);
assert.equal(first.schema,'office-career-rivalry-continuity-v1');
assert.equal(first.meetings.length,5);
assert.equal(first.totalRecorded,5);
assert.equal(first.checks.completed,5);
assert.equal(first.checks.recorded,5);
assert.equal(first.checks.reloads,5);
assert.equal(first.checks.duplicateResults,5);
assert.equal(first.checks.failedFinishes,0);
assert.ok(first.checks.callbackFacts>0,'facts from actual matches must support later callbacks');
assert.equal(first.meetings[0].earlierMeetings,0);
assert.equal(first.meetings[0].caseCount,0,'no claims about a match that never happened');
for(const [i,row] of first.meetings.entries()){
 assert.equal(row.earlierMeetings,i);
 assert.equal(row.recordedMeetings,i+1);
 assert.equal(row.meeting,i+1);
 assert.ok(row.promoIntro.length>20);
 if(i)assert.ok(row.rememberedBefore,'memory must persist into later weeks');
 if(i)assert.ok(row.recallInCommentary,'remembered event must reach the real match commentary');
}
assert.ok(first.finalMemory.length>0);
assert.ok(first.meetings.at(-1).feudHeat>=first.meetings[0].feudHeat);
const second=audit.play(26011);
assert.equal(JSON.stringify(first),JSON.stringify(second),
 'same seed must replay an entire five-week persisted career identically');
assert.match(audit.markdown(first),/real career|Real career/i);
assert.match(audit.markdown(first),/save\/load/i);
console.log('PASS career continuity: 5 booked real matches, remembered promos, feud ledger, result deduplication, 5 saves/reloads, week progression and deterministic replays.');
