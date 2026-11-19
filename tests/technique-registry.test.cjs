'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const game = {};
for (const name of ['data.js','roster-registry.js','match-engine.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js',name),'utf8'),
    { window: game, console, Date, Math, JSON }, { filename: name });
}
game.OfficeRosterV4.enableProfiles();
const G = game.OfficeMatch.GRAPH;
const R = require('../assets/js/technique-registry.js');
assert.equal(R.VERSION, 1);
assert.equal(R.CLASSES.length, 10, 'nine source headings plus wrestling-only extension');
assert.deepEqual([...R.TRADITIONS], ['catch','judo','lucha','boxing','acrobatics','strength','wrestling']);
assert.ok(Object.isFrozen(R.RECORDS), 'registry is immutable');
const before = JSON.stringify(G.A);
const validated = R.validate(G);
assert.equal(validated.valid, true, validated.errors.join('\n'));
assert.equal(validated.authored, 336, 'review against original complete catalogue');
assert.equal(validated.proposals,90,'60 previously reviewed plus 30 Phase 5b source-audited moves');
assert.ok(validated.coverage>26&&validated.coverage<27,'still a partial catalogue audit, not full coverage');
assert.equal(R.list().length, validated.proposals);
assert.ok(R.get('ch_single_leg').counterIds.includes('ch_single_leg_rev'));
assert.equal(R.get('ch_single_leg').mechanicalClass, 'Takedown');
assert.equal(R.get('lc_rana_pin').variantOf, 'lc_hurricanrana');
assert.equal(R.get('lc_rana_pin').mechanicalClass, 'Wrestling-only');
assert.ok(R.get('ch_deep_arm_drag').traditionTags.includes('lucha'));
assert.equal(R.get('st_superkick'), null, 'unreviewed moves have no authoritative metadata');
assert.ok(R.list().every(row => row.reviewStatus === 'proposed'));
assert.equal(JSON.stringify(G.A), before, 'metadata must not mutate the action graph');

const brokenGraph = { A: { ...G.A, ch_single_leg: { ...G.A.ch_single_leg, requires: 'mat' } }, CATALOG: G.CATALOG };
const invalid = R.validate(brokenGraph);
assert.equal(invalid.valid, false, 'registry catches drift in actual move position');
assert.ok(invalid.errors.some(e => e.includes('ch_single_leg: entry position')));
const noCounter = { A: { ...G.A, ch_single_leg_rev: undefined }, CATALOG: G.CATALOG };
assert.ok(R.validate(noCounter).errors.some(e => e.includes('unknown counter')));
const all = Object.values(G.CATALOG.F).flatMap(f => f.moves.map(m => m[0]));
assert.equal(new Set(all).size, all.length);
assert.deepEqual(new Set(R.list().map(row => row.id)).size, validated.proposals);
console.log('PASS Phase 2 technique registry: '+validated.proposals+' proposed entries / '+validated.authored+' original moves; positions, targets, relations, variants, no game mutation.');
