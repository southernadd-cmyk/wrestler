'use strict';
const assert=require('node:assert/strict');
const lab=require('../tools/graph-lab/core.js');
const review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
function make(tier='competent',plan='technical',minutes=18){
 const attrs={novice:[50,45,52],competent:[73,68,70],elite:[92,91,84]}[tier];
 const opt=lab.makeOptions(D,{wid:'juno',rid:'silas',seed:918011,plan,minutes,slot:'main'});
 opt.minutes=minutes;opt.w={...opt.w,ring:attrs[0],safe:attrs[1],psych:attrs[2]};
 const m=M.create(opt);m.stage='live';m.t=m.len-110;
 m.wSt=48;m.fSt=65;m.story.control='w';m.story.position='standing';
 m.story.down=null;m.graph.started=true;m.graph.arc='escalation';m.graph.age=99;
 G.apply(m,'wristlock');m.t+=10;return m;
}
const m=make(),g=m.graph;
assert.equal(G.readyTechnicalGrip(m),true,'one legal actual grip follow-through');
const offer=G.pool(m),legal=G.GRAPPLE_PILOT.filter(id=>
 G.PHYSICAL_GRIP_MOVES[id]==='wrist'&&G.isValid(m,id));
const total=offer.reduce((s,[,w])=>s+w,0);
const share=offer.filter(([id])=>legal.includes(id))
 .reduce((s,[,w])=>s+w,0)/total;
assert.ok(legal.length&&share>.20&&share<.80,
 'valid matching grapples compete without automatic success');
const count=g.events.length,old=g.node,quality=M._earnedPlanQuality(m);
G.advance(m,m.t/m.len);
assert.equal(g.node,old,'arc does not erase current real grip');
assert.equal(g.events.length,count,'no fabricated action');
assert.equal(M._earnedPlanQuality(m),quality,'no free star bonus');
const opening=make();opening.t=Math.round(opening.len*.30);
opening.graph.physical.grip.at=opening.t-10;
opening.graph.events.at(-1).t=opening.t-10;
assert.equal(G.readyTechnicalGrip(opening),false,
 'early authentic opening grip chains must not receive forced follow-through weighting');
const expired=make();expired.t+=10;
assert.equal(G.readyTechnicalGrip(expired),false,'next beat only');
const stolen=make();stolen.story.control='f';
assert.equal(G.readyTechnicalGrip(stolen),false,'wrong owner');
const wrong=make();wrong.graph.physical.grip.type='front-facelock';
assert.equal(G.readyTechnicalGrip(wrong),false,'no fake wrist requirement');
const reset=make();reset.graph.node=null;
assert.equal(G.readyTechnicalGrip(reset),false,'no arc-reset phantom setup');
const tired=make();tired.wSt=5;
assert.equal(G.readyTechnicalGrip(tired),false,'unaffordable grapples stay illegal');
const committed=make();committed.graph.pendingGrapple={id:'ch_deep_arm_drag',side:'w'};
assert.equal(G.readyTechnicalGrip(committed),false,'pending move must resolve first');
for(const [tier,plan,len] of [
 ['novice','technical',18],['competent','story',18],
 ['competent','technical',12]
])assert.equal(G.readyTechnicalGrip(make(tier,plan,len)),false,
 'no effect in novices, other plans or short bouts');
assert.equal(G.validate().errors.length,0,'no invalid graph edges');
console.log('PASS: exact owned Technical grip, one legal contested beat, no phantom, no plan or skill leaks');
