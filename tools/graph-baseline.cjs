#!/usr/bin/env node
'use strict';
// Snapshot real match-graph behaviour for comparison before/after a graph change.
// Usage: node tools/graph-baseline.cjs --count 100 --rotation roster > baseline.json
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lab = require('./graph-lab/core.js');
const args = process.argv.slice(2);
function value(flag, fallback) {
  const at = args.indexOf(flag);
  return at >= 0 ? args[at + 1] : fallback;
}
function integer(flag, defaultValue, max) {
  const number = Number(value(flag, defaultValue));
  if (!Number.isSafeInteger(number) || number < 1 || number > max) throw Error(flag + ' must be an integer from 1 to ' + max);
  return number;
}
try {
  const count = integer('--count', 100, 1000);
  const seed = integer('--seed', 5101, 2147483647);
  const config = {
    wid: value('--wid', 'juno'), rid: value('--rid', 'rex'),
    plan: value('--plan', 'technical'), finish: value('--finish', 'win_clean'),
    slot: value('--slot', 'mid'), rotation: value('--rotation', 'roster'),
    seed, count
  };
  if (!['fixed', 'roster'].includes(config.rotation)) throw Error('--rotation must be fixed or roster');
  const root = {};
  const names = ['data.js', 'roster-registry.js', 'technique-registry.js', 'technique-backgrounds.js', 'match-engine.js'];
  for (const name of names) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', name), 'utf8'),
      { window: root, console, Date, Math, JSON }, { filename: name });
  }
  root.OfficeRosterV4.enableProfiles();
  const D = root.OfficeData, G = root.OfficeMatch.GRAPH;
  const all = lab.roster(D);
  const snapshot = lab.empty(G, config);
  for (let i = 0; i < count; i++) {
    const options = { ...config, seed: seed + i * 37 };
    if (config.rotation === 'roster') {
      options.wid = all[i % all.length].id;
      options.rid = all[(i * 7 + 19) % all.length].id;
      if (options.rid === options.wid) options.rid = all[(i + 1) % all.length].id;
    }
    const match = lab.runMatch(root, lab.makeOptions(D, options));
    lab.add(snapshot, match, G);
  }
  const report = lab.report(snapshot, G, { full: args.includes('--full') });
  if (Array.isArray(G.TECHNIQUE_PILOT)) {
    // Counts only consecutive real match events matching authored graph links,
    // not generic arc jumps or theoretical legal options.
    report.pilotTransitions = G.TECHNIQUE_PILOT.map(({from,to,kind}) => ({
      from, to, kind, hits: snapshot.edgeHits[from + '>' + to] || 0
    }));
  }
  if (Array.isArray(G.TECHNIQUE_EXPANSION)) {
    report.phase5Transitions = G.TECHNIQUE_EXPANSION.map(({from,to,kind}) => ({
      from, to, kind, hits: snapshot.edgeHits[from + '>' + to] || 0
    }));
  }
  if (Array.isArray(G.TECHNIQUE_TRANCHE2)) {
    report.phase5bTransitions = G.TECHNIQUE_TRANCHE2.map(({from,to,kind}) => ({
      from, to, kind, hits: snapshot.edgeHits[from + '>' + to] || 0
    }));
  }
  // These generated counters already exist: count actual executed reversal
  // nodes without fabricating an attempted-air-move state or extra graph edge.
  if (root.OfficeTechniqueRegistry) {
    report.aerialCounterReviews = root.OfficeTechniqueRegistry.list()
      .filter(row => /^(?:ar_|sb_)/.test(row.id) && row.counterIds.length)
      .flatMap(row => row.counterIds.map(id => ({
        move: row.id, counter: id, hits: snapshot.nodeHits[id] || 0
      })));
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} catch (error) {
  process.stderr.write('Graph baseline failed: ' + error.message + '\n');
  process.exitCode = 1;
}
