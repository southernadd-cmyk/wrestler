'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficePsychology:K,OfficePromoFuzzy:F,OfficeRoom:R,OfficeData:D}=root;
const plain=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b)=>assert.deepEqual(plain(a),plain(b));
const rule=(id,output,value,when,weight=1)=>({id,output,value,weight,when});
const spec={curves:{...K.workerCurves,consent:[30,60,85],fatigue:[20,45,75]},outputs:['cooperation','caution'],rules:[
 rule('cooperate','cooperation',90,['consent.high','professionalism.high']),
 rule('resist','cooperation',15,['consent.low']),
 rule('negotiate','cooperation',55,['consent.medium']),
 rule('rested','caution',20,['fatigue.low']),
 rule('tired','caution',65,['fatigue.medium']),
 rule('exhausted','caution',95,['fatigue.high']),
 rule('safety','caution',100,['signal.safetyConcern'])
]};
const planning=K.createModel(spec);
assert.ok(Object.isFrozen(planning)&&Object.isFrozen(planning.curves.consent));
spec.curves.consent[0]=0;spec.rules[0].value=0;
assert.equal(planning.curves.consent[0],30);assert.equal(planning.rules[0].value,90);
assert.equal(K.scale(-100,-100,100),0);assert.equal(K.scale(0,-100,100),50);assert.equal(K.scale(100,-100,100),100);assert.equal(K.scale(null,-100,100),null);
assert.equal(K.scale(50,1,1),null);
assert.ok(Object.values(K.workerInputs({})).every(v=>v===null));
assert.equal(planning.evaluate({}, {'consent.high':1,'professionalism.high':1}).scores.cooperation,null,'cue may not override numeric domain facts');
assert.throws(()=>K.createModel({curves:{x:[25,25,80]},outputs:['y'],rules:[]}));
assert.throws(()=>K.createModel({curves:{x:[25,50,80]},outputs:['y'],rules:[rule('x','bad',50,['x.high'])]}));
assert.throws(()=>K.createModel({curves:{x:[25,50,80]},outputs:['y'],rules:[rule('x','y',50,[])]}));
assert.throws(()=>K.createModel({curves:{x:[25,50,80]},outputs:['y'],rules:[rule('x','y',50,['x.high']),rule('x','y',80,['x.low'])]}));
// Independent domain can reuse the kernel without importing promo rules.
const bargaining=K.createModel({curves:{...K.workerCurves,trust:[25,50,80]},outputs:['compromise'],rules:[
 rule('trust','compromise',85,['trust.high']),rule('distrust','compromise',15,['trust.low']),
 rule('middle','compromise',50,['trust.medium']),rule('ego','compromise',25,['ego.high','trust.low'])
]});
assert.ok(bargaining.evaluate({ego:80,trust:90}).scores.compromise>bargaining.evaluate({ego:80,trust:10}).scores.compromise);
assert.equal(bargaining.evaluate({}).scores.compromise,null);
// Test-only adapter using real agents-room snapshots. No change to the
// actual proposal, consent, safety or finish policy.
const G=root.OfficeGame;G.fresh();
let cases=0;
for(const worker of D.ALL){
 const opponent=D.ALL.find(w=>w.id!==worker.id&&D.divisionOf(w)===D.divisionOf(worker));
 const p=D.PROMOS[0],c={id:'psychology-room-'+worker.id,wid:worker.id,rid:opponent.id,pid:p.id,eventAbs:100,finish:'win_clean',slot:'mid',minutes:12,feudHeat:0};
 const room=R.begin(c,worker,opponent,p);
 const before=JSON.stringify(room);
 for(const side of ['w','f']){
  const person=room[side],values={...K.workerInputs(person),consent:R.consent(room,side),fatigue:person.fatigue};
  const current=planning.evaluate(values);
  assert.ok(Number.isFinite(current.scores.cooperation)&&Number.isFinite(current.scores.caution));
  eq(current,planning.evaluate(plain(values)));
  const ready=planning.evaluate({...values,professionalism:90,consent:95,fatigue:0});
  const reluctant=planning.evaluate({...values,professionalism:90,consent:20,fatigue:90},{'signal.safetyConcern':1});
  assert.ok(ready.scores.cooperation>reluctant.scores.cooperation);
  assert.ok(ready.scores.caution<reluctant.scores.caution);
  cases++;
 }
 assert.equal(JSON.stringify(room),before,'inference mutated room');
}
assert.equal(cases,160);
// Promo membership, domain rule IDs and numeric output shape stay compatible.
assert.equal(F.rules.length,47);
for(const key of Object.keys(K.workerCurves))eq(F.curves[key],K.workerCurves[key]);
console.log('PASS shared psychology: '+cases+' actual planning participant snapshots, independent bargaining model, missing inputs, rule validation and immutable scene observation.');
