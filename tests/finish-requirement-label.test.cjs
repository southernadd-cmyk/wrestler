'use strict';
// The finish picker's "Needs in the ring" column names the right wrestler. A parameter called `f` once hid the
// opponent, so "Have our finisher reversed" read "3 reversals by undefined".
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','js','ui.js'),'utf8').replace(/\r\n/g,'\n');
const line=src.split('\n').find(l=>/^\s*const shortRequirement=/.test(l));
assert.ok(line,'the finish requirement helper is present');
const shortRequirement=vm.runInNewContext(line+'\nshortRequirement',{w:{short:'Pike'},f:{short:'Rourke'}});
assert.equal(shortRequirement({route:'finisher_reversed'}),'3 reversals by Rourke','the opponent reverses our finisher');
assert.equal(shortRequirement({route:'reversal_finisher'}),'3 reversals by Pike','our wrestler reverses theirs');
assert.equal(shortRequirement({route:'submission_defeat'}),'Focused damage to our wrestler 4+');
assert.equal(shortRequirement({route:'unknown',requirement:'Something specific'}),'Something specific');
assert.equal(shortRequirement({route:'unknown'}),'Nothing extra');
for(const r of ['limb_finish','submission_defeat','injury_gives','reversal_finisher','finisher_reversed'])
 assert.doesNotMatch(shortRequirement({route:r}),/undefined/,r);
console.log('PASS the finish picker names the wrestler who has to do the reversing');
