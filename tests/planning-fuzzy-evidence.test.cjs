'use strict';
// MP1C: actual intake and room snapshots, with explicit career-fact fixtures.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const ctx=vm.createContext({window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
vm.runInContext(core,ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','js','planning-fuzzy.js'),'utf8'),ctx);
const {OfficePlanningFuzzy:P,OfficeData:D,OfficeAcademy:A,OfficeGame:G,OfficeWorldV4:V,OfficeRoom:R}=root;
const plain=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b)=>assert.deepEqual(plain(a),plain(b));
G.fresh();const career=G.S;career.seed=47;career.careerSeed=47;
const veterans=D.ALL.slice(),rookies=[];
for(let season=2;season<=40&&rookies.length<A.REGISTER.length;season++){
 career.season=season;
 if(season>2){
  for(const div of ['men','women']){
   const active=D.ALL.filter(w=>D.divisionOf(w)===div&&career.worldV4.contracts[w.id]?.owner!=='retired').slice(0,3);
   for(const w of active){career.worldV4.contracts[w.id].owner='retired';career.free=career.free.filter(f=>f.id!==w.id);}
  }
  V.activate(career);
 }
 rookies.push(...A.intake(career,season));
}
assert.equal(veterans.length,80);assert.equal(rookies.length,120);
const roster=[...veterans,...rookies];
assert.equal(new Set(roster.map(w=>w.id)).size,200);
const pending=['professionalTrust','proposalRisk','proposalFairness','sequenceDifficulty','structureCompatibility','creativeBenefit'];
const stat=n=>Number.isFinite(n)?Math.max(0,Math.min(100,n)):null;
let observations=0;
for(let i=0;i<roster.length;i++){
 const w=roster[i],f=roster.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const booking={id:'mp1c-'+i,wid:w.id,rid:f.id,pid:p.id,finish:'win_clean',slot:'mid',minutes:12,eventAbs:1000+i,feudHeat:70};
 const room=R.begin(booking,w,f,p);
 const before=JSON.stringify(room),beforeCareer=JSON.stringify(career);
 const saved=P.capture(room,w,f,career);
 assert.equal(saved.v,1);assert.equal(saved.cid,room.cid);
 for(const side of ['w','f']){
  const raw=side==='w'?w:f;
  const o=P.observe(saved,room,side);
  assert.equal(o.actorId,raw.id);
  assert.equal(o.values.consent,null,'unselected plan has no effective consent');
  assert.equal(o.values.ego,stat(raw.ego));
  assert.equal(o.values.professionalism,stat(raw.pro));
  assert.equal(o.values.ringPsychology,stat(raw.psych));
  assert.equal(o.values.microphone,stat(raw.mic));
  assert.equal(o.values.fatigue,stat(raw.fatigue));
  assert.equal(o.values.safetyAbility,stat(raw.safe));
  assert.equal(o.values.ringAbility,stat(raw.ring));
  assert.equal(o.values.morale,stat(raw.morale));
  assert.ok(saved.participants[side].identity?.delivery);
  for(const k of pending)assert.equal(o.values[k],null);
  eq(o,P.observe(plain(saved),plain(room),side));
  const inferred=P.behaviour(saved,room,side);
  assert.ok(Object.values(inferred.scores).every(n=>Number.isFinite(n)&&n>=0&&n<=100));
  for(const out of Object.keys(inferred.scores))assert.ok(inferred.fired[out].length>0);
  eq(inferred,P.behaviour(plain(saved),plain(room),side));
  observations++;
 }
 assert.equal(JSON.stringify(room),before);
 assert.equal(JSON.stringify(career),beforeCareer);
 R.act(room,'plan_technical');
 for(const side of ['w','f']){
  assert.equal(P.observe(saved,room,side).values.consent,R.consent(room,side));
  const copy=plain(room);copy.mood[side]-=7;
  assert.equal(P.observe(saved,copy,side).values.consent,R.consent(copy,side));
  eq(P.observe(saved,copy,side),P.observe(plain(saved),plain(copy),side));
  eq(P.behaviour(saved,copy,side),P.behaviour(plain(saved),plain(copy),side));
 }
}
assert.equal(observations,400);
// Explicit fixture: zero is real; absent is unknown even where legacy room
// fills defaults. Historical facts are directional and never inferred trust.
const w={id:'raw-a',style:'Technical',ego:0,pro:0,psych:0,mic:0,ring:0,safe:0,fatigue:0,morale:0,injury:0,age:21};
const f={id:'raw-b',style:'Brawl'};
const room={cid:'current',w:{id:w.id,ego:50,ring:60},f:{id:f.id,ego:50},stage:'plan',heat:100,finish:'win_clean',minutes:12,contract:{eventAbs:20},consent:{w:70,f:70},mood:{w:0,f:0}};
const old={cid:'old',abs:10,outcome:'booked',injured:{w:'shoulder',f:false}};
const fixture={officeMemory:{rivals:{'raw-a:raw-b':0},entries:{'raw-a':[{id:'memory-1',against:'raw-b',week:10,kind:'hurt',text:'Recorded memory'},{id:'other',against:'stranger',week:10,kind:'hurt'},{id:'future',against:'raw-b',week:25,kind:'hurt'}]}},bonds:{pairs:{'raw-a|raw-b':{score:0,betrayed:false}}},history:[{cid:'old',wid:'raw-b',rid:'raw-a',season:1,week:10},{cid:'current',wid:'raw-a',rid:'raw-b',season:2,week:4}],rivalries:{'raw-b:raw-a':{w:'raw-b',f:'raw-a',meetings:[old,{cid:'future',abs:25},{cid:'current',abs:20}],talks:[{cid:'old',by:'f',issue:'safety',delivered:'adapted'},{cid:'future',by:'w'}]}}};
const before=JSON.stringify(fixture),snap=P.capture(room,w,f,fixture);
const a=snap.participants.w,b=snap.participants.f;
assert.equal(a.relationship.regard,0);assert.equal(b.relationship.regard,null);
assert.equal(a.relationship.sharedBond,0);assert.equal(a.relationship.betrayed,false);
assert.equal(a.relationship.priorMatches,1);assert.equal(b.relationship.priorMatches,1);
assert.equal(a.relationship.memories.length,1);assert.equal(b.relationship.memories.length,0);
assert.equal(a.relationship.meetings.length,1);
assert.equal(a.relationship.meetings[0].ownInjury,false);
assert.equal(b.relationship.meetings[0].ownInjury,'shoulder');
assert.equal(a.relationship.talks[0].requestedBy,w.id);assert.equal(a.relationship.talks[0].delivered,'adapted');
assert.equal(a.relationship.talks.length,1);
assert.equal(JSON.stringify(fixture),before);
const av=P.observe(snap,room,'w'),bv=P.observe(snap,room,'f');
for(const k of ['ego','professionalism','ringPsychology','microphone','ringAbility','safetyAbility','fatigue','morale']){
 assert.equal(av.values[k],0);assert.equal(bv.values[k],null);
}
for(const k of pending){assert.equal(av.values[k],null);assert.equal(bv.values[k],null);}
assert.equal(av.context.rivalryHeat,100);
const empty=P.capture(room,w,f);
assert.equal(empty.participants.w.relationship.priorMatches,null);
assert.equal(empty.participants.w.relationship.regard,null);
assert.equal(empty.participants.w.relationship.sharedBond,null);
assert.equal(empty.participants.w.relationship.meetings.length,0);
fixture.officeMemory.rivals['raw-a:raw-b']=99;old.injured.f='arm';w.ego=90;
assert.equal(snap.participants.w.relationship.regard,0);
assert.equal(snap.participants.w.relationship.meetings[0].ownInjury,false);
assert.equal(P.observe(snap,room,'w').values.ego,0);
assert.throws(()=>P.capture(room,f,w),/participant mismatch/);
assert.throws(()=>P.observe({...snap,v:2},room,'w'),/snapshot mismatch/);
assert.throws(()=>P.observe(snap,{...room,cid:'other'},'w'),/snapshot mismatch/);
assert.throws(()=>P.observe(snap,room,'x'),/Invalid planning side/);
console.log('PASS MP1C: '+observations+' real participant snapshots, effective consent, identity, directional history, unknown/zero inputs and JSON resume parity; no live changes.');
