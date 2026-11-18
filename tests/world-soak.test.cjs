'use strict';
// The whole world at once: careers played for three seasons with every system switched on (ambitions,
// the bookers' storylines, rival managers, the promotions' business, programmes, approaches, bids,
// releases), checked after every week. Seeded, so each run plays the same careers.
// For a wider hunt across many careers: node tools/world-sweep.cjs 1 100 48
const assert=require('node:assert/strict');
const {play}=require('./_world.cjs');
const SEEDS=[3,10,24,41];
const totals={};
for(const seed of SEEDS){
 const {problems,stats}=play(seed,48);
 assert.deepEqual(problems,[],`seed ${seed}:\n  `+problems.join('\n  '));
 assert.ok(stats.weeks>=40,`seed ${seed} plays most of three seasons (${stats.weeks} weeks)`);
 assert.ok(stats.predicted>=stats.weeks*.75,`seed ${seed}: the prediction is checked most weeks (${stats.predicted} of ${stats.weeks})`);
 for(const [k,v] of Object.entries(stats))totals[k]=(totals[k]||0)+v;
}
// The systems actually got exercised, so a clean run means something.
assert.ok(totals.programmes>=4,'programmes were signed: '+totals.programmes);
assert.ok(totals.approaches>=2,'approaches were made: '+totals.approaches);
assert.ok(totals.bids>=2,'managers bid for your wrestlers: '+totals.bids);
assert.ok(totals.titleChanges>=10,'belts changed hands: '+totals.titleChanges);
assert.ok(totals.released>=4,'wrestlers were released: '+totals.released);
assert.ok(totals.afters>=40&&totals.callouts>=3,'after the bell ran: '+totals.afters+' segments, '+totals.callouts+' callouts landed');
assert.ok(totals.corners>=40,'seconds went to ringside: '+totals.corners);
console.log(`PASS world soak: ${SEEDS.length} careers × 48 weeks, every system on, checked weekly (${totals.weeks} weeks, ${totals.matches} of your matches, ${totals.programmes} programmes, ${totals.approaches} approaches, ${totals.bids} bids, ${totals.titleChanges} title changes, ${totals.raids} raids, ${totals.afters} post-match segments, ${totals.callouts} callouts, ${totals.corners} at ringside; circuit prediction checked ${totals.predicted} times)`);
