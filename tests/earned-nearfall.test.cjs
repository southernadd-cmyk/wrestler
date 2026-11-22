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
const crawl=make();crawl.story.position='mat';crawl.story.down='f';
G.apply(crawl,'rope_crawl');
assert.equal(G.earnedNearfallSource(crawl),null,
 'defender crawling towards ropes is not an earned knockdown');
const held=make();held.story.position='mat';held.story.down='f';
G.apply(held,'sm_lion_tamer');
assert.equal(G.earnedNearfallSource(held),null,
 'an applied submission hold is not an impact-to-pin setup');
const wrong=make();G.apply(wrong,'clothesline');wrong.story.control='f';
assert.equal(G.earnedNearfallSource(wrong),null,'opponent cannot steal earned count');
const expired=make();G.apply(expired,'clothesline');expired.t+=40;
assert.equal(G.earnedNearfallSource(expired),null,'stale move cannot fuel count');
const submission=make('story','submission');G.apply(submission,'clothesline');
assert.equal(G.earnedNearfallSource(submission),null,'submission-only has no pin counts');
const outside=make();G.apply(outside,'clothesline');outside.graph.physical.area='floor';
assert.equal(G.earnedNearfallSource(outside),null,'no phantom ring cover');
const closing=make();
closing.t=closing.len-40;closing.story.position='standing';
closing.story.down=null;G.resetPhysical(closing);
assert.ok(G.pool(closing).some(([id])=>id==='clothesline'),
 'Story final stretch still offers a real knockdown, never a phantom cover');
const p=make();G.apply(p,'clothesline');
const prior=p.graph.events.length,node=p.graph.node;
G.advance(p,p.t/p.len);
assert.equal(p.graph.node,node,'due real knockdown kept for cover before arc switch');
assert.equal(p.graph.events.length,prior);
assert.deepEqual(Array.from(G.validate().errors),[],'graph unchanged');
// Phase 9K: physically witnessed kick-outs are NOT finishing impacts.
const authored=make('safe'),rollId='pn_magistral';
assert.ok(G.isValid(authored,rollId),'authored La Magistral must be legal');
G.apply(authored,rollId);
const authoredDrama=G.nearfallDrama(authored);
assert.equal(authoredDrama.total,1,'one real authored cradle earns one dramatic kick-out');
assert.equal(authoredDrama.byKind.authored_kickout,1);
assert.equal(authoredDrama.byKind.earned_cover,0);
assert.equal(authoredDrama.moments[0].action,rollId);
assert.equal(authoredDrama.moments[0].side,'w');
assert.equal(authoredDrama.moments[0].source,null,
 'authored pin is its own event, not an imagined predecessor');
assert.equal(G.closingRunway(authored),null,
 'a real cradle kick-out cannot masquerade as a booked finishing runway');
const earnedDrama=G.nearfallDrama(m);
assert.equal(earnedDrama.total,1);
assert.equal(earnedDrama.byKind.earned_cover,1);
assert.equal(earnedDrama.byKind.authored_kickout,0);
assert.equal(earnedDrama.moments[0].source.id,'clothesline');
assert.equal(earnedDrama.moments[0].source.at,950);
const oldRng=m.r.getState(),oldEvents=JSON.stringify(m.graph.events);
assert.equal(JSON.stringify(G.nearfallDrama(m)),JSON.stringify(earnedDrama),
 'observer output is reproducible on the same tape');
assert.equal(m.r.getState(),oldRng,'observer consumes no match RNG');
assert.equal(JSON.stringify(m.graph.events),oldEvents,'observer cannot change events');
const restored=M.restore(JSON.parse(JSON.stringify({...m,rState:m.r.getState()})));
assert.equal(JSON.stringify(G.nearfallDrama(restored)),JSON.stringify(earnedDrama),
 'saved / restored tape has identical near-fall evidence');
const forged=make();
forged.graph.events.push({id:'scheduled_nearfall',t:960,earned:true,
 sourceMove:'clothesline',sourceT:950,sourceSide:'w',control:'w',
 position:'mat',down:'f'});
assert.equal(G.nearfallDrama(forged).total,0,
 'a fabricated source reference is not a credible near-fall');
const broken=make('safe');
G.apply(broken,rollId);
broken.graph.events.at(-1).contactResolution='block';
assert.equal(G.nearfallDrama(broken).total,0,
 'blocked cradle is not a performed two-count');
const generic=make();
G.apply(generic,'near_kickout');
assert.equal(G.nearfallDrama(generic).total,0,
 'standalone graph near-kickout without proof is not authored pin drama');
const finalCover=make('safe');
G.apply(finalCover,rollId);
finalCover.stage='finish';finalCover.queue=[];
M.next(finalCover);
assert.equal(finalCover.final.nearfallDrama?.total,1,
 'final match summary retains independent near-fall evidence');
assert.equal(finalCover.final.nearfallDrama.byKind.authored_kickout,1);
assert.equal(finalCover.final.finishingRunway,undefined,
 'nearfall evidence must not produce a false finishing-runway report');
console.log('PASS Phase 9K: genuine authored pins and earned covers are independent, saved, RNG-free near-fall evidence');
console.log('PASS earned near falls: source, owner, down position, no forged attack, duplicate cover or false count');
