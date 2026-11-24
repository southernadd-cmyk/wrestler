'use strict';
// Phase 6: rating only rewards unique, real high-risk landing events;
// simply selecting Spot-fest or attempting and botching a dive earns nothing.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-catalog.js','graph-narration.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Math,Date,JSON},{filename:file});
root.OfficeRosterV4.enableProfiles();
const M=root.OfficeMatch,G=M.GRAPH,D=root.OfficeData;
const risky=G.CATALOG.members.aerial.filter(id=>G.A[id]?.risk);
assert.ok(risky.length>=3,'test must use the live high-risk aerial family');
function setup(plan='spots'){
 const m=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',slot:'main',
  plan,finish:'win_clean',seed:72201}));
 m.qN=110;m.qSum=5500;m.crowdPeak=65;
 m.graph.events=[];
 return m;
}
function credit(m){return M._starParts(m).find(p=>p[0]==='showcase')?.[2]||0;}
const plain=setup('spots');
plain.w.ring=90;plain.w.safe=90; // controlled skilled performer; cast ratings vary
assert.equal(credit(plain),0,'choosing a high-flying plan alone is not a star bonus');
plain.graph.aerialAttempts.push({id:risky[0],outcome:'counter',startedT:100});
assert.equal(credit(plain),0,'attempting without landing does not score a spectacular execution');
plain.graph.events.push({id:risky[0]+'_rev',preControl:'w',control:'f',reverse:true});
assert.equal(credit(plain),0,'a reversal is not a successfully executed high-risk attack');
plain.graph.events.push({id:risky[0],preControl:'w',control:'w',aerialResolution:'landed'});
const one=credit(plain);
assert.ok(one>0&&one<=.45,'one genuine landing gets a bounded execution credit');
plain.graph.events.push({id:risky[0],preControl:'w',control:'w',aerialResolution:'landed'});
assert.equal(credit(plain),one,'repeating the identical spot does not accumulate stars');
for(const id of risky.slice(1))plain.graph.events.push({id,preControl:'w',control:'w',aerialResolution:'landed'});
assert.ok(credit(plain)>one,'distinct landed, high-risk techniques are rewarded');
assert.ok(credit(plain)<=.45,'no showcase spam can break the rating ceiling');
const poor=setup('spots');
poor.w.ring=35;poor.w.safe=35;
poor.graph.events.push({id:risky[0],preControl:'w',control:'w',aerialResolution:'landed'});
assert.ok(credit(poor)<one,'well-trained and safer performers earn more credit for the same clean attack');
const technical=setup('technical');
technical.graph.events.push({id:risky[0],preControl:'w',control:'w',aerialResolution:'landed'});
assert.ok(credit(technical)>0&&credit(technical)<one,
 'technical bouts also earn actual move-quality credit, without the earned Spot-fest fit');
console.log('PASS Phase 6 aerial ratings: no free plan bonus, no phantom reversals, no double-counting, safe-skill weighting and capped execution.');
