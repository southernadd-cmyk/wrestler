'use strict';
// One common earned-quality mechanism for Story, Spot-fest, Technical,
// Brawl and Keep It Safe, with five different evidence and ceiling rules.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-catalog.js','match-graph.js','match-commentary.js','match-engine.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Date,Math,JSON},{filename:file});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
const families=G.CATALOG.members;
const pick=(family,filter=()=>true)=>{
 const id=families[family].find(id=>filter(G.A[id]));
 assert.ok(id,'missing authored representative in '+family);
 return id;
};
const representative={
 technical:pick('chain'),
 spots:pick('aerial',n=>!!n.risk),
 brawl:pick('strike'),
 story:pick('ground'),
 safe:pick('chain',n=>!n.risk&&(n.cost??0)<=2.2)
};
const plans=['story','spots','technical','brawl','safe'];
const max={story:3.5,spots:4.25,technical:4,brawl:3.5,safe:1.5};
function fixture(plan){
 const m=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',plan,
  seed:196011,slot:'main',finish:'win_clean'}));
 m.stage='live';m.t=420;m.graph.events=[];
 m.w={...m.w,ring:90,safe:90,psych:90};
 m.f={...m.f,ring:90,safe:90,psych:90};
 return m;
}
function event(id,time=400,extra={}){
 return {id,t:time,preControl:'w',control:'w',arc:'comeback',...extra};
}
for(const plan of plans){
 const m=fixture(plan),id=representative[plan],
  base=plan==='safe'?-2:0;
 assert.equal(M._earnedPlanQuality(m),base,
  plan+' must not receive a positive quality bonus by selecting a plan');
 m.graph.events.push(event(id));
 const one=M._earnedPlanQuality(m);
 assert.ok(one>base,plan+' must earn quality for an appropriate landed action');
 m.graph.events.push(event(id,410));
 assert.equal(M._earnedPlanQuality(m),one,
  plan+' must not earn from repeating one move by the same wrestler');
 m.graph.events=[event(id,400,{aerialResolution:'counter'}),
  event(id,405,{contactResolution:'block'}),
  event(id,410,{grappleResolution:'aborted'}),
  event(id,415,{strikeResolution:'counter'})];
 assert.equal(M._earnedPlanQuality(m),base,
  plan+' may not earn from any unlanded action');
 m.graph.events=[event(id,120)];
 assert.equal(M._earnedPlanQuality(m),base,
  plan+' must not keep an expired high-quality move in the last three minutes');
 m.graph.events=[event(id)];
 for(const side of ['w','f'])for(const distinct of families[G.A[id].family]){
  m.graph.events.push(event(distinct,405,{preControl:side}));
 }
 assert.ok(M._earnedPlanQuality(m)<=base+max[plan],
  plan+' earned award cannot exceed the plan cap');
}
// A real base-graph move can also earn quality: many classic holds and
// aerial payoffs predate the family catalogue and are still authentic work.
const legacy={technical:'wristlock',spots:'aerial_attack',brawl:'clothesline',
 story:'dramatic_rally',safe:'mat_hold'};
for(const plan of plans){
 const m=fixture(plan),base=plan==='safe'?-2:0;
 m.graph.events=[event(legacy[plan],400)];
 assert.ok(M._earnedPlanQuality(m)>base,
   plan+' must credit a real authored core-graph move, not only later family entries');
}
// Not even excellent Spot-fest wrestlers can gain from merely scheduling
// a high-risk attack; weak, unsafe workers must not earn execution quality.
const aerial=representative.spots,weak=fixture('spots');
weak.w={...weak.w,ring:35,safe:35};
weak.graph.events.push(event(aerial));
assert.equal(M._earnedPlanQuality(weak),0);
weak.w={...weak.w,ring:90,safe:90};
assert.ok(M._earnedPlanQuality(weak)>=2.4,
 'a high-ringcraft, safe flyer earns substantial execution quality for a real, distinct landing');
// Story demands an actual move within a meaningful arc, not a setup at
// the bell. A narrative tag alone is never sufficient.
const story=fixture('story');
story.graph.events.push(event(representative.story,400,{arc:'opening'}));
assert.equal(M._earnedPlanQuality(story),0);
story.graph.events[0].arc='control';
assert.ok(M._earnedPlanQuality(story)>0);
// Safe earns from measured work but does not pay for a dangerous dive.
const safe=fixture('safe');
safe.graph.events.push(event(representative.spots));
assert.equal(M._earnedPlanQuality(safe),-2);
assert.equal(D.PLANS.technical.qual,undefined,
 'the unearned +4 Technical quality constant must not be reinstated');
console.log('PASS earned quality: five plans, authored evidence, no free stars, no duplicate/failed/expired bonuses, distinct low-risk ceiling.');
