'use strict';
const assert=require('node:assert/strict');
const lab=require('../tools/graph-lab/core.js');
const review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
const workerByPlan={technical:'imani',brawl:'rex',spots:'nico',safe:'brick'};
function make(plan,stip=null){
 const o=lab.makeOptions(D,{wid:workerByPlan[plan],rid:'red',
  plan,minutes:18,seed:519078,slot:'main',finish:'win_clean'});
 o.minutes=18;if(stip)o.stip=stip;
 const m=M.create(o);m.stage='live';m.t=950;
 m.graph.started=true;m.graph.arc='nearfall';m.graph.age=9;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 m.wSt=70;m.fSt=70;G.resetPhysical(m);
 m.nearfallAt=[.8,.85];return m;
}
const moves={technical:'grapple_trip',brawl:'clothesline',
 spots:'clothesline',safe:'arm_drag'};
for(const [plan,id] of Object.entries(moves)){
 const m=make(plan),prior=m.nearfalls;
 G.apply(m,id);
 assert.equal(m.story.position,'mat',plan+': genuine move grounds opponent');
 assert.equal(m.story.down,'f',plan+': attacked side is down');
 const source=G.earnedNearfallSource(m);
 assert.equal(source?.id,id,plan+': legal, landed, owner-correct grounded move earns opportunity');
 const eventCount=m.graph.events.length;
 const savedController=m.story.control;
 assert.equal(G.nearfall(m,source),true,plan+': legal cover counts');
 assert.equal(m.nearfalls,prior+1,plan+': one nearfall');
 assert.equal(m.graph.events.length,eventCount+1,plan+': no invented impact');
 assert.equal(m.story.control,savedController,plan+': no free reversal');
 const cover=m.graph.events.at(-1);
 assert.equal(cover.id,'scheduled_nearfall');
 assert.equal(cover.earned,true);
 assert.equal(cover.sourceMove,id);
 assert.equal(cover.sourceT,950);
 assert.equal(cover.sourceSide,'w');
 assert.equal(G.earnedNearfallSource(m),null,plan+': consumed source cannot count twice');

 const fake=make(plan);
 assert.equal(G.earnedNearfallSource(fake),null,plan+': timer alone is not an attack');
 assert.equal(G.nearfall(fake,{...source}),false,plan+': foreign match source rejected');
 assert.equal(fake.graph.events.length,0);

 const old=make(plan);G.apply(old,id);old.t+=40;
 assert.equal(G.earnedNearfallSource(old),null,plan+': expired move never counts');
 const wrong=make(plan);G.apply(wrong,id);wrong.story.control='f';
 assert.equal(G.earnedNearfallSource(wrong),null,plan+': no side theft');
 const outside=make(plan);G.apply(outside,id);
 outside.graph.physical.area='floor';
 assert.equal(G.earnedNearfallSource(outside),null,plan+': pin must happen in ring');

 const preserve=make(plan);G.apply(preserve,id);
 const before=preserve.graph.events.length,arc=preserve.graph.arc;
 G.advance(preserve,preserve.t/preserve.len);
 assert.equal(preserve.graph.arc,arc,plan+': real due cover not cleared by arc director');
 assert.equal(preserve.graph.events.length,before,plan+': no extra attack');
}
const safe=make('safe');G.apply(safe,'power_spinebuster');
assert.equal(G.earnedNearfallSource(safe),null,
 'Safe must not turn a heavy power spot into a scheduled cover');
const submission=make('technical','submission');
G.apply(submission,'grapple_trip');
assert.equal(G.earnedNearfallSource(submission),null,
 'submission-only stipulation cannot schedule a pin count');
const previous=submission.nearfalls;
G.nearfall(submission);
assert.equal(submission.nearfalls,previous,'submission escape is not a nearfall');
assert.equal(submission.graph.events.at(-1)?.id,'scheduled_submission_escape');
assert.deepEqual(Array.from(G.validate().errors),[],'graph integrity preserved');
console.log('PASS four plans: legally landed and owned sources, no fake attacks, stale/duplicate covers, ring-only, safe restrictions and submission-only escapes');
