'use strict';
const assert=require('node:assert/strict');
const lab=require('../tools/graph-lab/core.js');
const review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
const twelve=Object.values(G.SCRIPTED_SPOT_IDS);
assert.equal(twelve.length,12);
assert.equal(new Set(twelve).size,twelve.length);
assert.ok(twelve.every(id=>G.A[id]?.risk),'the twelve curated spectacular spots are all risk-tagged');
function setup(plan,wid,elite,seed=889311){
 const o=lab.makeOptions(D,{wid,rid:'red',plan,minutes:18,slot:'main',seed,finish:'win_clean'});
 o.minutes=18;
 if(elite)o.w={...o.w,ring:92,safe:91,psych:84};
 const m=M.create(o);m.stage='live';m.t=Math.floor(m.len*.82);
 m.wSt=m.fSt=100;m.listen=101;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 m.graph.arc='escalation';G.resetPhysical(m);
 m.r=()=>.99;
 return m;
}
for(const wid of ['brick','ezra','nico']){
 const m=setup('safe',wid,true);
 assert.equal(M.call(m,'big'),true);
 assert.equal((m.graph.scriptedSpotAttempts||[]).length,0,
   wid+': Safe must not force floor pile-drivers, superplexes or flipping dives');
 assert.equal(m.spots,0,'refused forced spectacle is not a completed spot');
 assert.ok(m.log.some(x=>x.text.includes('Safe layout')),
  'Road agent must explain refused stunt');
}
const untrained=setup('safe','sol',false);
assert.equal(M.call(untrained,'big'),true);
assert.equal((untrained.graph.scriptedSpotAttempts||[]).length,0,
 'novice Story worker cannot gain elite scripted eligibility');
const trained=setup('safe','sol',true);
assert.equal(M.call(trained,'big'),true);
assert.equal(trained.graph.scriptedSpotAttempts?.length,1);
assert.equal(trained.graph.scriptedSpotAttempts[0].id,'ar_elbow_point');
assert.equal(trained.graph.scriptedSpotAttempts[0].outcome,'landed');
assert.deepEqual(Array.from(trained.graph.events.slice(-2).map(x=>x.id)),
 ['top_climb','ar_elbow_point'],'still a legally prepared attack');
assert.equal(trained.graph.events.at(-1).scriptedSpot,true);
assert.equal(trained.spots,1);
assert.equal(trained.spotHits,1);

// Ordinary legal mat wrestling and exact source-to-cover provenance unchanged.
const legal=setup('safe','brick',true,960);
legal.t=960;legal.r=()=>.75;
assert.equal(G.isValid(legal,'mat_takedown'),true);
G.apply(legal,'mat_takedown');
const src=G.earnedNearfallSource(legal);
assert.equal(src?.id,'mat_takedown');
assert.equal(G.nearfall(legal,src),true);
assert.equal(legal.graph.events.at(-1)?.sourceMove,'mat_takedown');
assert.equal(G.earnedNearfallSource(legal),null,'source consumed once');

// A preconfigured balcony stunt must not inject narrative, alter the
// RNG-driven sequence, move anyone physically, or change the booked finish.
function flagged(flag){
 const o=lab.makeOptions(D,{wid:'brick',rid:'rev',plan:'safe',
   minutes:18,slot:'main',seed:779943,finish:'win_clean'});
 o.minutes=18;o.flags={...o.flags,dive:flag};
 return lab.runMatch(root,o);
}
const withFlag=flagged(true),withoutFlag=flagged(false);
assert.equal(JSON.stringify(withFlag.graph.events),JSON.stringify(withoutFlag.graph.events));
assert.equal(JSON.stringify(withFlag.log),JSON.stringify(withoutFlag.log));
assert.equal(withFlag.final.stars,withoutFlag.final.stars);
assert.equal(withFlag.final.outcome,withoutFlag.final.outcome);
assert.ok(!withFlag.log.some(e=>/balcony|FLIES off the balcony/i.test(e.text)));

// Real engine seeds across four authentic styles and three skill tiers.
const workers=['brick','ezra','sol','nico'],opponents=['ace','silas','red','rev'];
let completed=0,covers=0,elbows=0;
for(let wi=0;wi<workers.length;wi++)
 for(const tier of [[50,45,52],[73,68,70],[92,91,84]])
 for(let i=0;i<12;i++){
  const o=lab.makeOptions(D,{wid:workers[wi],rid:opponents[i%4],
   plan:'safe',minutes:i%2?18:12,slot:'main',
   seed:104481+wi*7139+i*191,finish:i%2?'lose_clean':'win_clean'});
  o.minutes=i%2?18:12;
  o.w={...o.w,ring:tier[0],safe:tier[1],psych:tier[2]};
  const m=lab.runMatch(root,o);completed++;
  for(const a of m.graph.scriptedSpotAttempts||[]){
   assert.equal(a.id,'ar_elbow_point');
   const actor=a.side==='w'?m.w:m.f;
   assert.ok(actor.ring>=78&&actor.safe>=75);
   elbows++;
  }
  for(const event of m.graph.events)if(event.id==='scheduled_nearfall'){
   assert.equal(event.earned,true);
   assert.ok(event.sourceMove&&event.sourceT>=0);
   covers++;
  }
  assert.ok(m.done&&m.final.stars>=0&&m.final.stars<=5);
 }
assert.equal(completed,144);
assert.ok(covers>0,'Safe must continue earning actual near falls');
assert.deepEqual(Array.from(G.validate().errors),[]);
console.log('PASS Safe scripted boundary, manual calls, balcony, organic wrestling, 144 actual bouts, '+elbows+' scripted elbows, '+covers+' earned covers');
