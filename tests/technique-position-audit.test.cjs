'use strict';
// Smoke the exact read-only audit command in a real Node process.
// This protects the reproducibility promised by the published 500-bout report.
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {EXPECTED}=require('./_phase10-inventory.cjs');
const runner=path.resolve(__dirname,'../tools/graph-lab/technique-position-audit.cjs');
const r=spawnSync(process.execPath,[runner,'--count','12'],{
 encoding:'utf8',maxBuffer:1024*1024*2,timeout:90000
});
assert.equal(r.error,undefined,r.error?.message);
assert.equal(r.status,0,(r.stderr||'')+'\n'+(r.stdout||'').slice(-1600));
const report=JSON.parse(r.stdout);
assert.equal(report.schema,'the-office-v04-technique-position-audit-v1');
assert.equal(report.completed,12);
assert.equal(report.instrumentationParity.identical,true);
assert.equal(report.instrumentationParity.bouts,12);
assert.equal(report.graph.errors.length,0);
assert.equal(report.graph.nodes,EXPECTED.nodes);
assert.equal(report.graph.edges,EXPECTED.edges);
assert.equal(report.registry.proposals,90);
assert.equal(report.timingFaults,0);
assert.equal(report.illegalPreconditions,0);
assert.equal(report.eventCapReached,0);
assert.ok(report.authoredEvents>0);
assert.equal(report.byPlan.technical.bouts+report.byPlan.story.bouts+
 report.byPlan.brawl.bouts+report.byPlan.spots.bouts+report.byPlan.safe.bouts,12);
console.log('PASS v0.4 read-only technique audit: 12 real Node bouts, parity, move timings, graph counts and JSON output');
