'use strict';
// The Office: causal graph regression, no dependencies.
// Run with: node tests/graph-flow.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'standalone game has inline logic');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const store=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,console,Date,Math,JSON});
const D=root.OfficeData,M=root.OfficeMatch,graph=M.GRAPH;
const validity=graph.validate();
assert.equal(validity.errors.length,0,JSON.stringify(validity.errors));
assert.ok(validity.nodes>=55&&validity.arcs>=12&&validity.outcomes===6);
assert.ok(validity.edges>=160);

function options(i){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*3)%D.FOES.length],p=D.PROMOS[i%D.PROMOS.length];
 const plan=['story','technical','brawl','spots','safe'][i%5],finish=['win_clean','win_dirty','lose_protected','lose_clean'][Math.floor(i/5)%4];
 const slot=['opener','mid','feature','main'][Math.floor(i/20)%4];
 return {w:{...w,flags:{},fatigue:i%27},f,p,slot,minutes:D.SLOTS[slot].mins,
  finish,plan:{game:plan,leash:'script',talk:'calm'},preparation:{},flags:{},feudHeat:i%8*9,seed:1003+i*71};
}
function work(x){
 for(let i=0;i<9000;i++){
  if(x.decision&&!x.queue.length){
   const opt=x.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||x.decision.options[0];
   M.resolve(x,opt.id);
  }
  M.next(x);
  if(x.done)return x;
 }
 throw Error('Match engine failed to finish');
}
const visited=new Set(), arcs=new Set(), fingerprints=new Set(), outcomeHits=new Set();
let fights=0, reversals=0,floorEvents=0;
for(let i=0;i<500;i++){
 const config=options(i),x=work(M.create(config)),s=x.graph;
 assert.ok(x.done&&x.final,'match reaches a final state');
 assert.ok(s.history.length>=2||x.shortened,'match traverses several arcs');
 assert.ok(s.events.some(e=>e.id.startsWith('outcome_')),'outcome graph records the finish');
 const expected=x.outcome==='nc'?'nc':x.outcome==='double'?'double':config.finish;
 assert.equal(s.outcome.id,expected,'result follows contract or manager intervention');
 outcomeHits.add(s.outcome.id);
 for(const arc of s.history)arcs.add(arc);
 fingerprints.add(s.history.join('>'));
 for(const e of s.events){
  visited.add(e.id);
  if(e.reverse){reversals++;assert.notEqual(e.preControl,e.control,'counter visibly changes control');}
  if(['cover','near_kickout','submission_set'].includes(e.id))assert.equal(e.position,'mat','mat-only action');
  if(e.id==='outside_toss')assert.equal(e.position,'outside','exit transitions onto floor');
  if(e.id==='roll_inside')assert.equal(e.position,'standing','roll inside returns to ring');
  if(['floor_brawl','floor_counter','apron_stand'].includes(e.id)){floorEvents++;assert.equal(e.position,'outside');}
  if(e.id==='booked_finish')throw Error('old shortcut finish marker must not be used');
 }
 const times=x.log.map(l=>{const [m,s]=l.t.split(':').map(Number);return m*60+s});
 for(let j=1;j<times.length;j++)assert.ok(times[j]>=times[j-1],'match time never goes backwards');
 assert.doesNotMatch(x.log.map(l=>l.text).join(' '),/undefined|NaN|\{(?:A|D|W|F|part)\}/);
 assert.ok(s.damage.w>=0&&s.damage.f>=0,'both wrestlers have independent damage');
 fights++;
}
for(const name of Object.keys(graph.A))assert.ok(visited.has(name),'graph node never reached: '+name);
for(const name of Object.keys(graph.ARCS))assert.ok(arcs.has(name),'story arc never reached: '+name);
assert.ok(fingerprints.size>=100,'matches must travel significantly different story paths');
assert.ok(reversals>150,'counter wrestling must be common');
assert.ok(floorEvents>10,'ringside branches must be playable');
for(const ending of ['win_clean','win_dirty','lose_protected','lose_clean'])assert.ok(outcomeHits.has(ending),'booked outcome missing '+ending);

// Existing version 2.6 saves do not have graph state. They must not restart the match.
const old=M.create(options(83));
for(let i=0;i<75;i++){if(old.decision&&!old.queue.length)M.resolve(old,old.decision.options[0].id);M.next(old);}
const raw=JSON.parse(JSON.stringify({...old,rState:old.r.getState()}));delete raw.graph;
const restored=M.restore(raw);
for(let i=0;i<100;i++){if(restored.decision&&!restored.queue.length)M.resolve(restored,restored.decision.options[0].id);M.next(restored);if(restored.graph)break;}
assert.ok(restored.graph?.migrated,'old in-progress save migrates');
assert.notEqual(restored.graph.arc,'opening','old in-progress save resumes at appropriate story arc');

// New saves must reproduce the same line sequence, event IDs and booked outcome.
const playing=M.create(options(187));
for(let i=0;i<49;i++){if(playing.decision&&!playing.queue.length)M.resolve(playing,playing.decision.options[0].id);M.next(playing);}
const resumed=M.restore(JSON.parse(JSON.stringify({...playing,rState:playing.r.getState()})));
for(let i=0;i<1500;i++){
 if(playing.decision&&!playing.queue.length)M.resolve(playing,playing.decision.options[0].id);
 if(resumed.decision&&!resumed.queue.length)M.resolve(resumed,resumed.decision.options[0].id);
 assert.equal(M.next(playing)?.text,M.next(resumed)?.text,'deterministic replay');
 if(playing.done&&resumed.done)break;
}
assert.ok(playing.done&&resumed.done,'saved matches finish');
assert.deepEqual(JSON.parse(JSON.stringify(playing.graph.events)),JSON.parse(JSON.stringify(resumed.graph.events)),'event graph stays identical after resume');
console.log('PASS graph: '+fights+' matches; '+visited.size+' event types; '+arcs.size+' arcs; '+reversals+' reversals; '+floorEvents+' ringside events; '+fingerprints.size+' unique paths; saves and outcomes valid');
