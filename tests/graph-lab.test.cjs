'use strict';
// Graph Lab: validate the instrumentation against the real shipped match engine.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../tools/graph-lab/core.js');

const root = {};
for (const name of ['data.js', 'roster-registry.js', 'match-engine.js']) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', name), 'utf8');
  vm.runInNewContext(source, { window: root, console, Date, Math, JSON }, { filename: name });
}
root.OfficeRosterV4.enableProfiles();
const D = root.OfficeData, M = root.OfficeMatch, G = M.GRAPH;
const info = core.inspect(G, D);
assert.deepEqual(info.stats.errors, [], 'graph validates');
assert.equal(info.unreachable.length, 0, 'lab reachability matches the catalogue');
assert.ok(info.stats.nodes >= 960 && info.stats.edges > 3000);
assert.equal(core.roster(D).length, 80, 'all cast members available in the lab');
assert.ok(info.incoming.wristlock.length > 0 && G.A.wristlock.next.length > 0);

const before = JSON.stringify(G.A);
const opts = core.makeOptions(D, { wid: 'juno', rid: 'rex', plan: 'technical', seed: 11021, finish: 'win_clean', slot: 'mid' });
assert.equal(opts.w.id, 'juno');
assert.equal(opts.f.id, 'rex');
assert.equal(opts.seed, 11021);
const one = core.runMatch(root, opts);
const two = core.runMatch(root, core.makeOptions(D, { wid: 'juno', rid: 'rex', plan: 'technical', seed: 11021, finish: 'win_clean' }));
assert.equal(one.done, true);
assert.equal(one.graph.outcome.id, 'win_clean');
assert.equal(JSON.stringify(one.graph.events), JSON.stringify(two.graph.events), 'identical seeds produce identical action events');
assert.equal(JSON.stringify(one.final), JSON.stringify(two.final), 'match outcomes and ratings repeat');

const snapshot = core.empty(G, { wid: 'juno', rid: 'rex', seed: 11021, plan: 'technical' });
core.add(snapshot, one, G);
for (let i = 0; i < 5; i++) {
  const options = core.makeOptions(D, { wid: 'juno', rid: 'rex', seed: 40001 + i * 37, plan: i % 2 ? 'story' : 'technical' });
  core.add(snapshot, core.runMatch(root, options), G);
}
const report = core.report(snapshot, G, { full: true });
assert.equal(report.bouts, 6);
assert.ok(report.actionEvents > 0, 'real graph events observed');
assert.ok(report.visitedNodes > 0 && report.nodeCoverage > 0 && report.nodeCoverage <= 100);
assert.ok(report.edgeCoverage >= 0 && report.edgeCoverage <= 100);
assert.equal(report.visitedNodes, Object.keys(report.nodeHits).length);
assert.equal(report.visitedEdges, Object.keys(report.edgeHits).length);
assert.ok(report.topNodes.every(row => !!G.A[row.id]));
for (const id of Object.keys(report.edgeHits)) {
  const [from, to] = id.split('>');
  assert.ok(G.A[from].next.some(edge => edge[0] === to), 'observed authored edge really exists: ' + id);
}
assert.equal(report.timingErrors.length, 0, 'no graph events before their declared earliest time');
assert.equal(report.unknownEvents.length, 0, 'all observed non-special events known');
const trace = core.trace(one, G);
assert.ok(trace.length > 0 && trace.every(e => typeof e.seconds === 'number' && e.id));
assert.equal(JSON.stringify(G.A), before, 'lab must not alter graph definitions');

const compare = core.compare(report, report);
assert.ok(compare.every(item => item.delta === 0), 'comparing the same baseline changes nothing');
const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'graph-lab', 'index.html'), 'utf8');
assert.match(html, /assets\/js\/match-engine\.js/);
assert.match(html, /src="core\.js"/);
assert.match(html, /src="app\.js"/);
assert.doesNotMatch(html, /career\.js|ui\.js/, 'lab never loads the live game or career storage');
new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'tools', 'graph-lab', 'app.js'), 'utf8'));
console.log('PASS graph lab: real engine, 80 wrestlers, deterministic bouts, measured coverage, valid edge counts, no graph mutation');
