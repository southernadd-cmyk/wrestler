'use strict';
// MP1A: test the dormant planning foundation in the same VM as production.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const ctx=vm.createContext({window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
vm.runInContext(core,ctx);
const K=root.OfficePsychology,F=root.OfficePromoFuzzy;
const plain=x=>JSON.parse(JSON.stringify(x));
const equal=(a,b)=>assert.deepEqual(plain(a),plain(b));
const promoRules=JSON.stringify(F.rules),promoCurves=JSON.stringify(F.curves);
const oldBegin=root.OfficeRoom.begin,oldAct=root.OfficeRoom.act;
assert.equal(root.OfficePlanningFuzzy,undefined,'MP1A remains outside live script loading');
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','js','planning-fuzzy.js'),'utf8'),ctx);
const P=root.OfficePlanningFuzzy;
assert.ok(Object.isFrozen(P));
assert.equal(P.version,1);
assert.equal(P.workerCurves,K.workerCurves,'same canonical reference, not a copy');
assert.equal(P.workerInputs,K.workerInputs);
const rule={id:'probe',output:'probe',value:80,weight:1,when:['ego.high']};
const spec={outputs:['probe'],rules:[rule]};
const model=P.createModel(spec);
assert.ok(Object.isFrozen(model));
equal(model.curves,P.curves);
assert.ok(Object.isFrozen(P.curves)&&Object.isFrozen(P.planningCurves));
for(const axis of Object.keys(K.workerCurves))equal(model.curves[axis],K.workerCurves[axis]);
let observations=0;
for(const axis of Object.keys(K.workerCurves)){
 assert.ok(Object.isFrozen(model.curves[axis]));
 for(let x=-10;x<=110;x+=.5){
  const g=model.membership(axis,x);
  equal(g,F.membership(axis,x));
  assert.ok(Object.values(g).every(v=>v>=0&&v<=1));
  assert.ok(Math.abs(g.low+g.medium+g.high-1)<1e-12);
  observations++;
 }
 for(const x of [null,undefined,NaN,Infinity,-Infinity,'50'])assert.equal(model.membership(axis,x),null);
 const [a,b,c]=K.workerCurves[axis];
 equal(model.membership(axis,a),{low:1,medium:0,high:0});
 equal(model.membership(axis,b),{low:0,medium:1,high:0});
 equal(model.membership(axis,c),{low:0,medium:0,high:1});
 equal(model.membership(axis,(a+b)/2),{low:.5,medium:.5,high:0});
 equal(model.membership(axis,(b+c)/2),{low:0,medium:.5,high:.5});
 assert.throws(()=>P.createModel({...spec,curves:{[axis]:[10,50,90]}}),/Cannot override/);
}
// MP1B: explicit approved design knots; no evidence is supplied by defining an axis.
const expected={consent:[30,60,85],fatigue:[20,45,75],safetyAbility:[45,70,90],
 ringAbility:[40,65,85],professionalTrust:[25,50,80],morale:[30,55,80],
 proposalRisk:[20,45,75],proposalFairness:[25,50,75],sequenceDifficulty:[25,50,80],
 structureCompatibility:[25,50,75],creativeBenefit:[25,50,80]};
equal(P.planningCurves,expected);
let domainObservations=0;
for(const [axis,[a,b,c]] of Object.entries(expected)){
 assert.ok(Object.isFrozen(P.planningCurves[axis])&&Object.isFrozen(model.curves[axis]));
 let prev=null;
 for(let x=-10;x<=110;x+=.5){
  const g=model.membership(axis,x);
  assert.ok(Object.values(g).every(v=>v>=0&&v<=1));
  assert.ok(Math.abs(g.low+g.medium+g.high-1)<1e-12);
  if(prev){
   assert.ok(g.low<=prev.low+1e-12&&g.high>=prev.high-1e-12);
   for(const label of ['low','medium','high'])assert.ok(Math.abs(g[label]-prev[label])<=.5/Math.min(b-a,c-b)+1e-12);
  }
  prev=g;domainObservations++;
 }
 equal(model.membership(axis,a),{low:1,medium:0,high:0});
 equal(model.membership(axis,b),{low:0,medium:1,high:0});
 equal(model.membership(axis,c),{low:0,medium:0,high:1});
 equal(model.membership(axis,(a+b)/2),{low:.5,medium:.5,high:0});
 equal(model.membership(axis,(b+c)/2),{low:0,medium:.5,high:.5});
 equal(model.membership(axis,0),model.membership(axis,-10));
 equal(model.membership(axis,100),model.membership(axis,110));
 for(const x of [null,undefined,NaN,Infinity,-Infinity,'50'])assert.equal(model.membership(axis,x),null);
 assert.equal(model.fuzzify({})[axis],null);
 assert.throws(()=>P.createModel({...spec,curves:{[axis]:[10,50,90]}}),/Cannot override versioned/);
 // Probe only: a missing numeric input cannot be replaced with a cue.
 const probe=P.createModel({outputs:['probe'],rules:[{...rule,when:[axis+'.low']}]});
 assert.equal(probe.evaluate({}, {[axis+'.low']:1}).scores.probe,null);
 assert.ok(probe.evaluate({[axis]:0}).scores.probe>50);
 assert.equal(probe.evaluate({[axis]:100}).scores.probe,null);
}
assert.equal(domainObservations,2651);
assert.equal(model.evaluate({}).scores.probe,null);
assert.equal(model.evaluate({}, {'ego.high':1}).scores.probe,null);
assert.ok(model.evaluate({ego:95}).scores.probe>50);
equal(P.workerInputs({}),{ego:null,professionalism:null,ringPsychology:null,microphone:null});
equal(P.workerInputs({ego:0,pro:100,psych:0,mic:0}),{ego:0,professionalism:100,ringPsychology:0,microphone:0});
const extra={probeAxis:[20,40,80]};
const extended=P.createModel({...spec,curves:extra});
extra.probeAxis[0]=1;
equal(extended.curves.probeAxis,[20,40,80]);
assert.throws(()=>P.createModel({...spec,curves:{bad:[30,20,80]}}));
assert.throws(()=>P.createModel(null));
assert.throws(()=>P.createModel({...spec,curves:[]}));
assert.equal(JSON.stringify(F.rules),promoRules);
assert.equal(JSON.stringify(F.curves),promoCurves);
assert.equal(root.OfficeRoom.begin,oldBegin);
assert.equal(root.OfficeRoom.act,oldAct);
console.log('PASS MP1A/B: '+observations+' shared and '+domainObservations+' planning membership comparisons; immutable curves, continuity, missing/zero inputs and no live integration.');
