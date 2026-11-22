'use strict';
const assert=require('node:assert/strict');
const lab=require('../tools/graph-lab/core.js'),review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
function scene(wid,plan,ring,safe,psych,minutes=18){
 const o=lab.makeOptions(D,{wid,rid:'red',plan,slot:'main',seed:880041});
 o.minutes=minutes;o.w={...o.w,ring,safe,psych};
 const m=M.create(o);m.stage='live';m.t=m.len-350;m.wSt=44;m.fSt=70;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 m.graph.arc='escalation';G.resetPhysical(m);return m;
}
function share(pool,pred){
 const total=pool.reduce((v,[,w])=>v+w,0);
 return pool.reduce((v,[id,w])=>v+(pred(id)?w:0),0)/total;
}
const isRest=id=>id==='catch_breath'||A[id]?.family==='rest';
const brawl=scene('brick','brawl',92,91,84);
G.apply(brawl,'power_spinebuster');
assert.equal(G.isValid(brawl,'rs_side_headlock'),true);
const first=brawl.wSt,bonus=brawl.bonus;
assert.ok(share(G.pool(brawl),isRest)>.30,'authored resting hold must be a real eligible choice');
assert.equal(brawl.wSt,first);assert.equal(brawl.bonus,bonus);
G.apply(brawl,'rs_side_headlock');
const restEvent=brawl.graph.events.at(-1);
assert.equal(restEvent.id,'rs_side_headlock');
assert.equal(restEvent.position,'mat');
assert.ok(restEvent.exertion< -4&&brawl.wSt>first+4,
 'stamina is earned by actually performing the authored hold');
assert.ok(brawl.graph.pacedBrawl?.w?.until>brawl.t);
const restored=M.restore(JSON.parse(JSON.stringify({...brawl,rState:brawl.r.getState()})));
// The restored save is a plain JSON object; the running match state is from
// the browser VM realm. Compare their serialised values, not VM prototypes.
assert.equal(JSON.stringify(restored.graph.pacedBrawl),JSON.stringify(brawl.graph.pacedBrawl));
for(const [skill,minutes] of [['novice',18],['elite',12]]){
 const novice=scene('brick','brawl',skill==='novice'?50:92,
  skill==='novice'?45:91,skill==='novice'?52:84,minutes);
 G.apply(novice,'power_spinebuster');const st=novice.wSt;
 G.apply(novice,'rs_side_headlock');
 assert.ok(novice.wSt-st<1,'no elite long-match recovery outside gated tier/length');
 assert.equal(novice.graph.pacedBrawl?.w,undefined);
}
const named=id=>A[id]&&!A[id].risk&&!A[id].reverse&&!A[id].counterOf&&
 !A[id].blockOf&&['lucha','strike','neck'].includes(A[id].family)&&
 (A[id].cost??0)>=0&&(A[id].cost??0)<=2.2;
const flyer=scene('nico','spots',73,68,70);flyer.t=flyer.len-110;flyer.wSt=28;
const stamina=flyer.wSt;
assert.ok(share(G.pool(flyer),named)>.25,
 'competent tired flyer has real physically legal named late offence');
assert.equal(flyer.wSt,stamina);
assert.equal(G.isValid(flyer,'ar_450'),false,'no unaffordable/detached aerial');
for(const [ring,safe,psych,min] of [[92,91,84,18],[73,68,70,12]]){
 const m=scene('nico','spots',ring,safe,psych,min);
 m.t=m.len-110;m.wSt=28;
 assert.ok(share(G.pool(m),named)<.15,'elite/short-match fallback remains off');
}
let checked=0,covers=0,namedLate=0;
for(const [wid,plan,ring,safe,psych] of [
 ['brick','brawl',92,91,84],['nico','spots',73,68,70]]){
 for(let oi=0;oi<4;oi++)for(let j=0;j<4;j++){
  const o=lab.makeOptions(D,{wid,rid:['ace','silas','red','rev'][oi],
   plan,slot:'main',seed:842109+oi*6991+j*333+(wid==='brick'?0:80911),
   finish:j%2?'lose_clean':'win_clean'});
  o.minutes=18;o.w={...o.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
  const m=lab.runMatch(root,o),E=m.graph.events;
  assert.equal(m.graph.outcome?.id,o.finish);
  assert.ok(m.done&&m.final.stars>=0&&m.final.stars<=5);
  const near=E.filter(e=>e.id==='scheduled_nearfall');
  assert.ok(near.every(e=>e.earned&&e.sourceMove&&e.sourceSide&&e.sourceT>=0));
  covers+=near.length;
  namedLate+=E.filter(e=>e.t>=m.len-180&&e.preControl==='w'&&
   A[e.id]?.family&&!['rest','pin'].includes(A[e.id].family)&&
   !A[e.id].reverse&&!A[e.id].counterOf&&!A[e.id].blockOf).length;
  checked++;
 }
}
assert.equal(checked,32);
assert.ok(covers>0&&namedLate>0);
assert.deepEqual(Array.from(G.validate().errors),[]);
console.log('PASS long-match recovery and named late offence: 32 real matches, '+covers+' sourced near falls, '+namedLate+' named actions');
