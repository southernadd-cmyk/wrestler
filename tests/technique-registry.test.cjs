'use strict';
const {EXPECTED}=require('./_phase10-inventory.cjs');
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
assert.equal(validated.authored, EXPECTED.moves, 'review against original complete catalogue');
assert.equal(validated.proposals,325,'91 final manoeuvre records; 15 excluded performance beats');
assert.equal(validated.coverage,95.6,'technical registry covers 325 of 340 catalogue entries');
assert.equal(R.list().length, validated.proposals);
assert.equal(R.get('sm_abdominal').entry.position,'standing');
assert.equal(R.get('sm_octopus').entry.position,'standing');
assert.equal(R.get('rs_cover_rest').counterIds.length,0);
assert.equal(R.get('pn_sunset').exit.control,'pin');
assert.equal(R.get('nk_tornado_ddt').entry.position, 'corner', 'tornado DDT starts in the corner');
assert.equal(R.get('nk_jawbreaker').exit.position, 'standing', 'jawbreaker leaves the match standing');
assert.equal(R.get('sx_snap_ddt').mechanic, 'snap-suplex-with-cover', 'this action is a snap suplex, not a DDT');
assert.equal(R.get('pw_double_chop_slam').target, 'ribs', 'gutbuster targets ribs');
assert.equal(R.get('nk_russian_sweep').target, 'back', 'leg sweep targets back');
for (const id of ['sx_vertical','sx_delayed','pw_chokeslam','pw_sitout','nk_tornado_ddt']) {
  assert.deepEqual([...R.get(id).traditionTags], ['wrestling'], 'new metadata must be training-neutral');
}

assert.equal(R.get('st_fighting_spirit').counterIds.length,0);
for(const id of ['st_superkick','st_enzuigiri','rn_spear','rn_lariat']) {
  assert.equal(R.get(id).exit.position,'mat');
  assert.deepEqual([...R.get(id).traditionTags],['wrestling']);
}

// New editorial records must not silently enable training-school weighting.
const B = require('../assets/js/technique-backgrounds.js');
for(const id of ['gd_knee_stomp','gd_dragon_screw_ground']) {
  assert.deepEqual([...R.get(id).traditionTags], ['wrestling']);
  assert.equal(B.multiplier('juno', id, G, R), 1, id+' must remain training-neutral');
}

assert.ok(R.get('ch_single_leg').counterIds.includes('ch_single_leg_rev'));
assert.equal(R.get('ch_single_leg').mechanicalClass, 'Takedown');
assert.equal(R.get('lc_rana_pin').variantOf, 'lc_hurricanrana');
assert.equal(R.get('lc_rana_pin').mechanicalClass, 'Wrestling-only');
assert.ok(R.get('ch_deep_arm_drag').traditionTags.includes('lucha'));
assert.equal(R.get('hl_ref_argue'), null, 'non-technique referee argument is intentionally excluded');
assert.equal(R.get('os_count_tease'), null, 'countout suspense is not a wrestling technique');
assert.equal(R.get('cn_splash').entry.position,'corner','corner splash must start in corner');
assert.equal(R.get('fr_ten_punches').entry.position,'corner','comeback punches use corner gate');
assert.equal(R.get('fr_atomic_drop').exit.position,'standing','atomic drop remains standing in live graph');
assert.equal(R.get('fr_double_clothesline').counterIds.length,0,'mutual double clothesline has no parent counter');
assert.equal(R.get('dv_suicide').entry.position,'outside','ringside dives use existing outside gate');
assert.deepEqual([...R.get('rp_skin_cat').traditionTags],['wrestling'],'new techniques remain training-neutral');
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
