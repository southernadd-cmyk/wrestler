'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const ctx=vm.createContext({window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
vm.runInContext(core,ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','js','planning-fuzzy.js'),'utf8'),ctx);
const P=root.OfficePlanningFuzzy,M=P.behaviourModel;
const plain=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.deepEqual(plain(a),plain(b));
eq(M.outputs,['cooperation','assertiveness','caution']);
assert.equal(M.rules.length,33);
assert.ok(Object.isFrozen(M.rules)&&M.rules.every(Object.isFrozen));
eq(M.evaluate({}).scores,{cooperation:null,assertiveness:null,caution:null});
const base={ego:50,professionalism:60,ringPsychology:50,ringAbility:65,consent:60,fatigue:45,safetyAbility:70,morale:55};
const score=(v={},c={})=>M.evaluate({...base,...v},c).scores;
assert.ok(score({consent:90}).cooperation>score({consent:20}).cooperation);
assert.ok(score({professionalism:90}).cooperation>score({professionalism:20}).cooperation);
assert.ok(score({ego:90}).assertiveness>score({ego:20}).assertiveness);
assert.ok(score({fatigue:90}).caution>score({fatigue:0}).caution);
assert.ok(score({},{'condition.injured':1}).caution>score().caution);
assert.ok(score({},{'history.ownInjury':1}).caution>score().caution);
eq(score({ego:90}).cooperation,score({ego:20}).cooperation);
eq(score({fatigue:90}).cooperation,score({fatigue:0}).cooperation);
eq(score({fatigue:90}).assertiveness,score({fatigue:0}).assertiveness);
const balanced=score({ego:90,professionalism:90,consent:90,ringPsychology:90,ringAbility:90,morale:90});
assert.ok(balanced.cooperation>70&&balanced.assertiveness>70,'assertive and cooperative can coexist');
eq(score({professionalTrust:0,proposalRisk:100,microphone:0}),score({professionalTrust:100,proposalRisk:0,microphone:100}));
const unknown=M.evaluate({}, {'consent.high':1});assert.equal(unknown.scores.cooperation,null);
let samples=0;
for(const [axis,out] of [['consent','cooperation'],['ego','assertiveness'],['fatigue','caution']]){
 let prev=-Infinity;
 for(let i=0;i<=100;i++){
  const res=score({[axis]:i})[out];
  assert.ok(Number.isFinite(res)&&res>=0&&res<=100);
  assert.ok(res>=prev-1e-10,'nonmonotonic '+axis+' at '+i);
  prev=res;samples++;
 }
}
// Do not use private or public rivalry as a substitute for actual condition.
const w={id:'a',style:'Story',...{ego:50,pro:60,psych:50,ring:65,safe:70,fatigue:0,morale:55,injury:0}};
const f={id:'b',style:'Technical',...w,id:'b'};
const room={cid:'now',w:{id:'a'},f:{id:'b'},stage:'plan',heat:100,contract:{eventAbs:20},consent:{w:70,f:70},mood:{w:0,f:0}};
const career={officeMemory:{rivals:{'a:b':0}},bonds:{pairs:{'a|b':{score:-100,betrayed:true}}}};
const initial=P.capture(room,w,f,career),first=P.behaviour(initial,room,'w');
eq(first.cues,{});
eq(first.scores,P.behaviour(P.capture({...room,heat:0},w,f,{}),{...room,heat:0},'w').scores);
const hurt=P.capture(room,{...w,injury:1},f,career);
const current=P.behaviour(hurt,room,'w');
assert.equal(current.cues['condition.injured'],1);
assert.ok(current.scores.caution>first.scores.caution);
assert.equal(current.scores.cooperation,first.scores.cooperation);
const past=P.capture(room,w,f,{officeMemory:{entries:{a:[{id:'old',against:'b',week:10,kind:'hurt'}]}}});
assert.equal(P.behaviour(past,room,'w').cues['history.ownInjury'],1);
assert.equal(P.behaviour(past,room,'f').cues['history.ownInjury'],undefined);
eq(current,P.behaviour(plain(hurt),plain(room),'w'));
assert.ok(current.fired.caution.some(r=>r.id==='caution_current_injury'));
assert.throws(()=>P.behaviour(initial,room,'x'));
console.log('PASS MP2A: '+M.rules.length+' rules, '+samples+' monotonic samples, independent outputs, injury provenance and replay parity.');
