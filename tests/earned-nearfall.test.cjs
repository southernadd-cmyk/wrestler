'use strict';
const assert=require('node:assert/strict'),lab=require('../tools/graph-lab/core.js'),
 review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
function make(plan='story',stip=null){
 const o=lab.makeOptions(D,{wid:'sol',rid:'red',plan,minutes:18,seed:519078,
  slot:'main',finish:'win_clean'});
 o.minutes=18;if(stip)o.stip=stip;
 const m=M.create(o);m.stage='live';m.t=950;
 m.graph.started=true;m.graph.arc='nearfall';m.graph.age=9;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 m.wSt=70;m.fSt=70;G.resetPhysical(m);
 m.nearfallAt=[.8,.85];return m;
}
const m=make(),before=m.nearfalls;
assert.equal(G.earnedNearfallSource(m),null,'timer alone is not an attack');
G.apply(m,'clothesline');
assert.equal(m.story.position,'mat');
assert.equal(m.story.down,'f');
assert.equal(G.earnedNearfallSource(m)?.id,'clothesline',
 'real landed, correctly owned, in-ring grounded attack may earn a count');
const cnt=m.graph.events.length,original=m.story.control;
const src=G.earnedNearfallSource(m);
assert.equal(G.nearfall(m,src),true,'near fall follows performed source');
assert.equal(m.nearfalls,before+1);
assert.equal(m.story.control,original,'near fall cannot reverse the attacker');
assert.equal(m.graph.events.length,cnt+1,'only count event; never synthetic blow');
const e=m.graph.events.at(-1);
assert.equal(e.id,'scheduled_nearfall');
assert.equal(e.earned,true);assert.equal(e.sourceMove,'clothesline');
assert.equal(e.sourceSide,'w');assert.equal(e.sourceT,950);
assert.equal(G.earnedNearfallSource(m),null,'one landing cannot buy multiple counts');
const unearned=make();const old=unearned.nearfalls;
assert.equal(G.nearfall(unearned,{id:'clothesline',t:950,side:'w',key:'950:clothesline:w'}),false,
 'forged source cannot earn a count');
assert.equal(unearned.nearfalls,old);
const wrong=make();G.apply(wrong,'clothesline');wrong.story.control='f';
assert.equal(G.earnedNearfallSource(wrong),null,'opponent cannot steal earned count');
const expired=make();G.apply(expired,'clothesline');expired.t+=40;
assert.equal(G.earnedNearfallSource(expired),null,'stale move cannot fuel count');
const submission=make('story','submission');G.apply(submission,'clothesline');
assert.equal(G.earnedNearfallSource(submission),null,'submission-only has no pin counts');
const outside=make();G.apply(outside,'clothesline');outside.graph.physical.area='floor';
assert.equal(G.earnedNearfallSource(outside),null,'no phantom ring cover');
const p=make();G.apply(p,'clothesline');
const prior=p.graph.events.length,node=p.graph.node;
G.advance(p,p.t/p.len);
assert.equal(p.graph.node,node,'due real knockdown kept for cover before arc switch');
assert.equal(p.graph.events.length,prior);
assert.deepEqual(Array.from(G.validate().errors),[],'graph unchanged');
console.log('PASS earned near falls: source, owner, down position, no forged attack, duplicate cover or false count');
