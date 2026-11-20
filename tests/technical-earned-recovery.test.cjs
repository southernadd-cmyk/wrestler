'use strict';
const assert=require('node:assert/strict'),lab=require('../tools/graph-lab/core.js'),
 review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
function make(tier='competent',plan='technical',min=18,remaining=360){
 const t={novice:[50,45,52],competent:[73,68,70],elite:[92,91,84]}[tier];
 const o=lab.makeOptions(D,{wid:'juno',rid:'silas',plan,seed:75117,slot:'main'});
 o.minutes=min;o.w={...o.w,ring:t[0],safe:t[1],psych:t[2]};
 const m=M.create(o);m.stage='live';m.graph.started=true;
 m.t=m.len-remaining;m.wSt=39;m.story.control='w';
 m.story.position='standing';m.story.down=null;
 m.graph.arc='escalation';G.resetPhysical(m);
 return m;
}
const weight=(m,id)=>G.pool(m).find(([name])=>name===id)?.[1]||0;
const trained=make(),eligible=weight(trained,'catch_breath');
const novice=make('novice'),story=make('competent','story'),
 short=make('competent','technical',12),late=make('competent','technical',18,130);
assert.ok(eligible>weight(novice,'catch_breath')*2,
 'trained technician must genuinely favour a narrated recovery action');
assert.ok(eligible>weight(story,'catch_breath')*2,
 'Story plan is not the Technical pacing lane');
assert.ok(eligible>weight(short,'catch_breath')*2,
 '12-minute normal contests cannot inherit long-match pacing');
assert.ok(eligible>weight(late,'catch_breath')*2,
 'late final stretch must use earlier preparation, not emergency invisible recovery');
const held=make();G.apply(held,'wristlock');held.wSt=39;
assert.ok(weight(held,'catch_breath')<eligible/2,
 'a technician may not abandon a true held physical grip for a special rest boost');
const elite=make('elite'),competentRest=make('competent');
const eliteBefore=elite.wSt,competentBefore=competentRest.wSt;
G.apply(elite,'catch_breath');G.apply(competentRest,'catch_breath');
assert.ok(elite.wSt-eliteBefore>6.5&&elite.wSt-eliteBefore<8.5,
 'highly trained elite gains stamina only from a real narrated rest');
assert.ok(competentRest.wSt-competentBefore>4.9&&competentRest.wSt-competentBefore<6.2,
 'competent ordinary rest recovery unchanged');
const recent=make();G.apply(recent,'catch_breath');recent.wSt=39;
recent.t+=10;
assert.ok(weight(recent,'catch_breath')<eligible/2,
 'recent narrated breather has a real cooldown');
const level=trained.wSt,score=M._earnedPlanQuality(trained),n=trained.graph.events.length;
G.pool(trained);
assert.equal(trained.wSt,level,'pool inspection cannot award stamina');
assert.equal(M._earnedPlanQuality(trained),score,'no star scoring inflation');
assert.equal(trained.graph.events.length,n,'pool cannot fabricate a rest');
assert.equal(G.validate().errors.length,0,'graph remains structurally valid');
console.log('PASS technical pacing: authored rest only, trained long-match runway, grip protection, cooldown and no free benefits');
