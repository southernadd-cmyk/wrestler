'use strict';
const assert=require('node:assert/strict');
const lab=require('../tools/graph-lab/core.js'),review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
function setup(plan='brawl',tier='elite'){
 const m=M.create(lab.makeOptions(D,{wid:'rex',rid:'red',plan,
  slot:'main',seed:782183,finish:'win_clean'}));
 m.stage='live';m.t=m.len-410;m.wSt=45;m.fSt=66;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 m.graph.arc='escalation';
 Object.assign(m.w,tier==='elite'?{ring:92,safe:91,psych:84}:
  tier==='competent'?{ring:73,safe:68,psych:70}:{ring:50,safe:45,psych:52});
 return m;
}
const weight=(m,id)=>G.pool(m).find(([k])=>k===id)?.[1]||0;
const elite=setup(),novice=setup('brawl','novice');
assert.equal(G.isValid(elite,'catch_breath'),true);
const pool=G.pool(elite),others=pool.reduce((n,[id,w])=>n+(id==='catch_breath'?0:w),0);
assert.ok(others>0&&weight(elite,'catch_breath')>=others*.30,
 'a real recovery option must compete with expanded move choices');
const oldElite=elite.wSt,oldNovice=novice.wSt;
G.apply(elite,'catch_breath');G.apply(novice,'catch_breath');
assert.ok(elite.wSt-oldElite>novice.wSt-oldNovice+2,
 'only an actual narrated trained rest gets the modest recovery improvement');
assert.equal(novice.graph.pacedBrawl,undefined);
assert.equal(elite.graph.pacedBrawl.w.until,elite.t+150);
assert.ok(elite.log.some(x=>x.text.includes('eases the pressure')));
const until=elite.graph.pacedBrawl.w.until;
elite.t+=40;G.apply(elite,'catch_breath');
assert.equal(elite.graph.pacedBrawl.w.until,until,'immediate repeated resting cannot extend pacing');
assert.equal(JSON.parse(JSON.stringify(elite.graph)).pacedBrawl.w.until,until,
 'the earned deadline survives serialization');
const finalRest=setup();finalRest.t=finalRest.len-120;
G.apply(finalRest,'catch_breath');
assert.equal(finalRest.graph.pacedBrawl,undefined,'no retroactive late pacing');
// Ordinary 8- and 12-minute Brawls keep their previous action economy.
const short=M.create(lab.makeOptions(D,{wid:'rex',rid:'red',plan:'brawl',
 slot:'mid',seed:782183,finish:'win_clean'}));
short.t=short.len-400;short.wSt=45;
Object.assign(short.w,{ring:92,safe:91,psych:84});
short.story.control='w';short.story.position='standing';short.story.down=null;
const shortBefore=short.wSt;
G.apply(short,'catch_breath');
assert.ok(Math.abs((short.wSt-shortBefore)-5.5)<1e-7,
 'short bouts retain exactly the original visible recovery amount');
assert.equal(short.graph.pacedBrawl,undefined,
 'short bouts never receive the new Brawl pacing window');
const wrongPlan=setup('story');
G.apply(wrongPlan,'catch_breath');
assert.equal(wrongPlan.graph.pacedBrawl,undefined,'other match plans are unchanged');
assert.equal(M._earnedPlanQuality(elite),0,'rest is not a bonus star event');
assert.equal(G.isValid(elite,'ar_moonsault'),false,'physical eligibility remains mandatory');
const late=setup();late.t=late.len-110;late.wSt=50;
assert.ok(G.pool(late).some(([id])=>G.A[id]?.family==='strike'&&
 !G.A[id].reverse&&!G.A[id].counterOf&&!G.A[id].blockOf),
 'late Brawl pool must expose authentic named striking');
assert.equal(G.validate().errors.length,0);
console.log('PASS Brawl: narrated recovery, bounded cooldown, save-safe pacing, real attacks and no free stars.');
