'use strict';
// Plays many careers with every system switched on and reports anything that broke.
//   node tools/world-sweep.cjs [first seed] [how many] [weeks]
// e.g. node tools/world-sweep.cjs 1 100 48. Each seed always plays the same career, so a failing seed
// can be replayed exactly. CI runs a handful of seeds in tests/world-soak.test.cjs.
const path=require('node:path');
const {play}=require(path.join(__dirname,'..','tests','_world.cjs'));
const first=Number(process.argv[2]||1),count=Number(process.argv[3]||20),weeks=Number(process.argv[4]||48);
const totals={};let failed=0;
for(let seed=first;seed<first+count;seed++){
 const {problems,stats}=play(seed,weeks);
 for(const [k,v] of Object.entries(stats))totals[k]=(totals[k]||0)+v;
 if(problems.length){failed++;console.log(`seed ${seed}: ${problems.length} problem(s)`);for(const p of problems.slice(0,5))console.log('  '+p);}
}
console.log(`\n${count} careers × ${weeks} weeks: ${failed} with problems.`);
console.log('Totals:',JSON.stringify(totals));
process.exit(failed?1:0);
