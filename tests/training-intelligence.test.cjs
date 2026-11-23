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
mara.fatigue=10;mara.training='ring';mara.intensity='standard';mara.ring=70;mara.progress={ring:.5};
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
