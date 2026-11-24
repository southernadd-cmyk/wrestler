'use strict';
// Training advice and reports use actual career state without touching match balance.
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {script}=require('./_source.cjs');
const storage=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage,console,Math,Date,JSON});
const G=root.OfficeGame;
const clone=x=>JSON.parse(JSON.stringify(x));
G.fresh();G.S.cash=100000;
for(const id of ['mara','lyra'])assert.equal(G.sign(id),null);
const mara=G.W('mara'),lyra=G.W('lyra');
assert.ok(G.trainingAdvice(lyra).some(a=>a.kind==='focus'&&a.value==='safe'),
 'Dennis recommends safety development for a vulnerable Spectacle wrestler');
assert.equal(G.trainingReview(),null,'new career has no invented weekly report');
mara.fatigue=78;
assert.ok(G.trainingAdvice(mara).some(a=>a.kind==='focus'&&a.value==='rest'&&a.priority==='urgent'),
 'exhaustion gets urgent recovery advice');
assert.equal(G.setTraining(mara.id,'rest'),null);
assert.equal(G.trainingForecast(mara).fatigue,54,'rest forecast uses actual weekly recovery');
mara.fatigue=10;mara.training='ring';mara.intensity='standard';mara.ring=70;mara.ceiling=95;mara.progress={ring:.5};
lyra.training='rest';lyra.session=null;
const p=G.trainingForecast(mara);
assert.equal(p.kind,'skill');assert.equal(p.gain,1);assert.equal(p.progress,35);
assert.equal(p.fatigue,18);assert.equal(p.cost,55);
assert.ok(Math.abs(p.riskPct-.9)<.000001,'risk uses the actual engine formula');
const before={ring:mara.ring,fatigue:mara.fatigue,heat:mara.heat,seed:G.S.seed};
G.endWeek();
const review=G.trainingReview(),entry=review.entries.find(e=>e.id===mara.id);
assert.ok(review&&review.entries.length===2);
assert.equal(review.a,1,'review belongs to the completed week');
assert.equal(review.trainingCost,55,'paid training spend is captured, separate from coach salary');
assert.equal(review.coachCost,0);
assert.equal(entry.delta.ring,mara.ring-before.ring,'actual completed skill gain is recorded');
assert.equal(entry.delta.fatigue,mara.fatigue-before.fatigue,'actual fatigue is recorded');
assert.equal(entry.cost,55);
assert.ok(entry.notes.some(x=>/ring/.test(x)),'weekly event text survives for review');
assert.equal(G.S.trainingReviews.length,1);
assert.equal(G.trainingForecast(mara).kind,'skill','next-week forecast still works');
const saved=clone(G.S);delete saved.trainingReviews;G.S=saved;
assert.ok(Array.isArray(G.S.trainingReviews)&&G.S.trainingReviews.length===0,
 'older saves hydrate without training-review records');
G.endWeek();
assert.equal(G.S.trainingReviews.length,1,'new reports accumulate on a migrated save');
G.S.trainingReviews=Array.from({length:20},(_,i)=>({a:i+1,entries:[]}));G.endWeek();
assert.equal(G.S.trainingReviews.length,12,'history is bounded for saved-career size');
assert.equal(G.trainingReview().a,3);
console.log('PASS training intelligence: advice, precise forecast, real weekly changes, old saves and bounded history');

/* Independently computed expectations: ceiling is a soft slowdown, not a hard cap. */
function trainingCase({skill=70,ceiling=90,fatigue=10,bank=.5,intensity='standard',camp=false,coach=null,tier='Established',expectedGrowth,expectedRisk,seed=1932}){
 G.fresh();G.S.cash=100000;assert.equal(G.sign('mara'),null);
 const w=G.W('mara');Object.assign(w,{ring:skill,ceiling,fatigue,progress:{ring:bank},intensity,training:'ring',session:null,injury:0,tier,program:null});
 G.S.coach=coach;
 if(camp)w.program={type:'camp',left:3,total:3,focus:'ring',gains:0};
 G.S.seed=seed;
 const initial=clone(G.S),forecast=G.trainingForecast(w);
 assert.deepEqual(clone(G.S),initial,'forecast does not alter career state or consume RNG');
 assert.deepEqual(G.trainingForecast(w),forecast,'repeated forecasts are deterministic');
 assert.ok(Math.abs(forecast.growth-expectedGrowth)<1e-9,'expected development multiplier');
 assert.ok(Math.abs(forecast.riskPct-expectedRisk)<1e-9,'risk based on post-session fatigue');
 const expectedBank=bank+expectedGrowth,expectedSkill=Math.min(99,skill+Math.floor(expectedBank));
 assert.equal(forecast.skillAfter,expectedSkill);
 assert.equal(forecast.progress,expectedSkill===99?0:Math.round((expectedBank%1)*100));
 G.endWeek();
 assert.equal(w.ring,expectedSkill,'settlement matches forecast skill');
 assert.equal(w.fatigue,forecast.fatigue,'settlement matches forecast fatigue');
 assert.ok(Math.abs(w.progress.ring-(expectedBank%1))<1e-9,'fractional progress preserved');
 assert.equal(G.trainingReview().trainingCost,forecast.cost);
 return w;
}
trainingCase({expectedGrowth:.85,expectedRisk:.9});
trainingCase({skill:75,ceiling:82,expectedGrowth:.425,expectedRisk:.9});
trainingCase({skill:82,ceiling:82,expectedGrowth:.0425,expectedRisk:.9});
trainingCase({skill:90,ceiling:82,expectedGrowth:.0204,expectedRisk:.9});
trainingCase({skill:99,ceiling:95,bank:.99,expectedGrowth:.0204,expectedRisk:.9});
trainingCase({skill:60,tier:'Rookie',expectedGrowth:1.19,expectedRisk:.9});
trainingCase({camp:true,coach:'technical',expectedGrowth:1.9*1.35,expectedRisk:1.5});
trainingCase({fatigue:70,expectedGrowth:.85*.6,expectedRisk:2.25});
// First seeded draw lies between the low-fatigue and high-fatigue probabilities.
let thresholdSeed=1;
while(true){
 const draw=((Math.imul(thresholdSeed,1664525)+1013904223)>>>0)/4294967296;
 if(draw>.009&&draw<.0225)break;
 thresholdSeed++;
}
assert.equal(trainingCase({fatigue:56,expectedGrowth:.85,expectedRisk:.9,seed:thresholdSeed}).injury,0);
assert.ok(trainingCase({fatigue:57,expectedGrowth:.85,expectedRisk:2.25,seed:thresholdSeed}).injury>0,
 'crossing 65 fatigue during training increases the actual injury chance');
console.log('PASS shared training plan: soft ceiling, fractional bank, rookie, coaching, camp, fatigue threshold and RNG purity');
