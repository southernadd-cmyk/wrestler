'use strict';
const {EXPECTED}=require('./_phase10-inventory.cjs');
// Phase 3: proof that a small, controlled move graph pilot is real, physically legal,
// deterministic and does not rewrite the original catalogue or booked outcomes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root={};
for(const name of ['data.js','roster-registry.js','match-engine.js']){
 const src=fs.readFileSync(path.join(__dirname,'..','assets','js',name),'utf8');
 vm.runInNewContext(src,{window:root,console,Date,Math,JSON},{filename:name});
}
root.OfficeRosterV4.enableProfiles();
const {OfficeData:D,OfficeMatch:M}=root,G=M.GRAPH,A=G.A;
const R=require('../assets/js/technique-registry.js');
const lab=require('../tools/graph-lab/core.js');
const reference=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tools/graph-lab/baselines/reference-v1.json'),'utf8'));

assert.equal(reference.totalBouts,1200);
assert.equal(G.validate().errors.length,0);
assert.equal(G.validate().nodes,EXPECTED.nodes,'Phase 3 must not mint any nodes');
assert.equal(G.CATALOG.counts.moves,EXPECTED.moves);
assert.equal(G.CATALOG.counts.reversals,EXPECTED.reversals);
assert.equal(G.CATALOG.counts.blocks,EXPECTED.blocks);
assert.equal(G.TECHNIQUE_PILOT.length,11,'conservative curated set');
assert.equal(G.validate().edges,EXPECTED.edges,'Phase 9 adds exactly 144 directed links without changing 969 action nodes');
const mechanicReview=R.validate(G);
assert.equal(mechanicReview.valid,true,'Curated move metadata must match the live graph:\n'+mechanicReview.errors.join('\n'));
const pairs=new Set();
const seedPeople=lab.roster(D).filter(w=>(D.PROFILES[w.id]?.kg||90)<85);
assert.ok(seedPeople.length>=2,'at least two eligible agile workers for pilot');
const [worker,opponent]=seedPeople;
const scenario={wid:worker.id,rid:opponent.id,slot:'main',seed:50001,plan:'technical',finish:'win_clean'};
let setupCount=0,counterCount=0,payoffCount=0;
for(const link of G.TECHNIQUE_PILOT){
 const id=link.from+'>'+link.to;
 assert.ok(!pairs.has(id),'duplicate pilot link '+id);
 pairs.add(id);
 assert.ok(link.reason.length>20,'every live link must have its own human-readable reason');
 assert.ok(['setup','followup','counter'].includes(link.kind));
 assert.ok(Number.isFinite(link.weight)&&link.weight>0&&link.weight<=2,'bounded authored bias');
 assert.equal(A[link.from].zone,A[link.to].requires,'no positional teleport: '+id);
 assert.ok(A[link.from].next.some(([to,w])=>to===link.to&&w>0),'link not live: '+id);
 if(link.kind==='setup'){
  setupCount++;
  const meta=R.get(link.to);
  assert.ok(meta,'new executable setup must have curated Phase 2 metadata: '+id);
  assert.ok(meta.setupIds.includes(link.from),'not a reviewed candidate setup: '+id);
 } else if(link.kind==='counter'){
  counterCount++;
  assert.ok(A[link.to].reverse && A[link.to].counterOf,'counter not move-specific: '+id);
  assert.equal(A[link.to].counterOf,'ch_single_leg');
 } else payoffCount++;

 const m=M.create(lab.makeOptions(D,scenario)),p=m.story;
 m.t=Math.floor(m.len*.88);m.wSt=m.fSt=100;
 p.control='w';p.position=A[link.from].requires;p.down=p.position==='mat'?'f':null;
 assert.equal(G.isValid(m,link.from),true,'source not physically valid: '+link.from);
 G.apply(m,link.from);
 if(link.kind==='counter'&&G.GRAPPLE_PILOT.includes(A[link.to].counterOf)){
  // This authored edge now offers a defensive alternative only if the
  // attack was genuinely committed by the wrestler on the preceding beat.
  assert.equal(G.isValid(m,link.to),false,'cannot freely select a named counter: '+id);
  m.stage='live'; // a real pending attempt can only begin after the bell
  assert.equal(G.startGrapple(m,A[link.to].counterOf),true,
   'real attack must be physically available before counter: '+id);
 }
 assert.equal(G.isValid(m,link.to),true,'target not valid after source: '+id);
 assert.equal(m.graph.events.at(-1).id,link.from);
}
assert.equal(setupCount,9);
assert.equal(counterCount,1);
assert.equal(payoffCount,1);

// The first three form a connected standing-to-mat wrist-control sequence.
const seq=['wristlock','ch_top_wristlock','ch_rolling_wristlock','ch_deep_arm_drag'];
const rehearsed=M.create(lab.makeOptions(D,scenario));rehearsed.t=Math.floor(rehearsed.len*.8);rehearsed.wSt=100;rehearsed.fSt=100;rehearsed.story.control='w';rehearsed.story.position='standing';
for(const id of seq){
 assert.ok(G.isValid(rehearsed,id),'pilot chain breaks at '+id);
 G.apply(rehearsed,id);
}
assert.equal(rehearsed.story.position,'mat','arm-drag must take the opponent down');
assert.equal(rehearsed.story.down,'f','defender lands on mat');
assert.deepEqual(Array.from(rehearsed.graph.events).map(x=>x.id),seq);

// A booked finish survives and the same seed still gives byte-for-byte identical events.
const samples=[['technical','win_clean'],['brawl','win_dirty'],['spots','lose_protected'],['story','lose_clean']];
let total=0;const observed={};
for(let i=0;i<48;i++){
 const [plan,finish]=samples[i%4],cfg={...scenario,plan,finish,seed:60101+i*37};
 const one=lab.runMatch(root,lab.makeOptions(D,cfg));
 assert.ok(one.done&&one.final,'completed bout '+i);
 assert.equal(one.graph.outcome.id,finish,'finish contract '+i);
 if(i<8){
  const repeat=lab.runMatch(root,lab.makeOptions(D,cfg));
  assert.equal(JSON.stringify(one.graph.events),JSON.stringify(repeat.graph.events),'seed reproducible '+i);
  assert.equal(JSON.stringify(one.final),JSON.stringify(repeat.final),'rating reproducible '+i);
 }
 const ids=one.graph.events.filter(e=>A[e.id]).map(e=>e.id);
 for(let j=1;j<ids.length;j++){
  const key=ids[j-1]+'>'+ids[j];
  if(pairs.has(key))observed[key]=(observed[key]||0)+1;
 }
 total++;
}
assert.equal(total,48);

const child=require('node:child_process');
const baseline=JSON.parse(child.execFileSync(process.execPath,[
 path.join(__dirname,'..','tools','graph-baseline.cjs'),
 '--count','12','--seed','90101','--rotation','fixed','--wid',worker.id,
 '--rid',opponent.id,'--plan','technical'
],{encoding:'utf8',maxBuffer:3*1024*1024,timeout:120000}));
assert.equal(baseline.schema,'office-graph-lab-v1');
assert.equal(baseline.bouts,12);
assert.equal(baseline.pilotTransitions.length,11,'CLI includes every curated link');
assert.ok(baseline.pilotTransitions.every(x=>Number.isSafeInteger(x.hits)&&x.hits>=0));

console.log('PASS Phase 3: '+G.TECHNIQUE_PILOT.length+' curated live edges; all physical guards pass, '+G.validate().edges+' links, the original 969 nodes plus ten Phase 10 action nodes, contracts and seeded replay; sampled '+total+' bouts. Observed pilot transitions: '+JSON.stringify(observed));
