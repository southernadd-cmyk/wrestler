'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficePromoFuzzy:F,OfficeData:D,OfficePromoDirector:P,OfficeMic:M}=root;
const clone=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b)=>assert.deepEqual(clone(a),clone(b));
assert.equal(F.version,1);assert.ok(Object.isFrozen(F.curves));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,a+' != '+b);
for(const [axis,points] of Object.entries(F.curves)){
 assert.ok(Object.isFrozen(points));
 const [a,b,c]=points;assert.ok(0<=a&&a<b&&b<c&&c<=100);
 eq(F.membership(axis,a),{low:1,medium:0,high:0});
 eq(F.membership(axis,b),{low:0,medium:1,high:0});
 eq(F.membership(axis,c),{low:0,medium:0,high:1});
 eq(F.membership(axis,(a+b)/2),{low:.5,medium:.5,high:0});
 eq(F.membership(axis,(b+c)/2),{low:0,medium:.5,high:.5});
 eq(F.membership(axis,-5),F.membership(axis,0));eq(F.membership(axis,105),F.membership(axis,100));
 for(const value of [null,undefined,NaN,Infinity,-Infinity,'50',true])assert.equal(F.membership(axis,value),null);
 let prev=F.membership(axis,0);
 for(let x=.25;x<=100;x+=.25){
  const m=F.membership(axis,x);
  for(const v of Object.values(m))assert.ok(v>=0&&v<=1);
  near(m.low+m.medium+m.high,1);
  assert.ok(m.low<=prev.low&&m.high>=prev.high);
  assert.ok(Math.max(...Object.keys(m).map(k=>Math.abs(m[k]-prev[k])))<=.25/Math.min(b-a,c-b)+1e-9,'discontinuity '+axis);
  prev=m;
 }
}
assert.equal(F.membership('constructor',50),null);
assert.equal(F.membership('unknown',50),null);
assert.ok(Object.values(F.fuzzify()).every(v=>v===null));
const w={ego:70,pro:80,psych:45,mic:55},part={ego:60,pro:75,composure:35,irritation:39};
const before=JSON.stringify([w,part]),a=F.snapshot(w,part,{meter:30,side:'w',feudHeat:45}),b=F.snapshot(w,part,{meter:30,side:'f',feudHeat:45});
assert.equal(JSON.stringify([w,part]),before);
assert.equal(a.values.ego,60);assert.equal(a.values.professionalism,75);
assert.equal(a.values.momentum,65);assert.equal(b.values.momentum,35);
assert.equal(F.snapshot(w,part,{meter:30}).values.momentum,null);
assert.equal(F.snapshot(w,part,{}).grades.rivalryHeat,null);
eq(a,F.snapshot(clone(w),clone(part),{meter:30,side:'w',feudHeat:45}));
assert.ok(F.membership('irritation',39).medium>0&&F.membership('irritation',41).medium>0);
near(F.membership('irritation',65).high,25/30);
// Sample real director inputs from all 80 originals and the 120 academy
// register entries; use actual intake data in addition for the live test.
const G=root.OfficeGame,A=root.OfficeAcademy,V=root.OfficeWorldV4;
G.fresh();const s=G.S;s.seed=47;s.careerSeed=47;
const established=D.ALL.slice(),arrivals=[];
for(let season=2;season<=40&&arrivals.length<A.REGISTER.length;season++){
 s.season=season;
 if(season>2){
  for(const div of ['men','women']){
   for(const worker of D.ALL.filter(w=>D.divisionOf(w)===div&&s.worldV4.contracts[w.id]?.owner!=='retired').slice(0,3)){
    s.worldV4.contracts[worker.id].owner='retired';s.free=s.free.filter(f=>f.id!==worker.id);
   }
  }
  V.activate(s);
 }
 arrivals.push(...A.intake(s,season));
}
const roster=[...established,...arrivals];assert.equal(roster.length,200);
const signatures=new Set();
for(const [i,worker] of roster.entries()){
 const opponent=roster.find(x=>x.id!==worker.id&&D.divisionOf(x)===D.divisionOf(worker));
 const director=P.begin(worker,opponent,null,'faceoff'),p=D.PROMOS[i%D.PROMOS.length];
 const c={id:'f1-'+worker.id,wid:worker.id,rid:opponent.id,pid:p.id,eventAbs:100,finish:'win_clean',minutes:12,feudHeat:0};
 const opts={directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,banks:promoBanks(worker.id,opponent.id)};
 const initial=F.snapshot(worker,director.player,{meter:0,side:'w',feudHeat:0});
 assert.ok(Object.values(initial.grades).every(Boolean),worker.id+' missing input');
 signatures.add(JSON.stringify(initial.grades));
 const st=M.begin(c,worker,opponent,null,null,p,opts),control=clone(st);
 for(let step=0;st.stage!=='done';step++){
  assert.ok(step<12);
  const saved=JSON.stringify(st);
  const grades=F.snapshot(worker,st.director.player,{meter:st.meter,side:'w',feudHeat:st.core.feudHeat??0});
  assert.ok(Object.values(grades.grades).every(Boolean));
  assert.equal(JSON.stringify(st),saved,'observation mutated promo state');
  assert.ok(!Object.hasOwn(st,'fuzzy'),'F1 must not change saved scene shape');
  const choices=M.choices(st),round=M.ROUNDS[st.round].id,wanted=({open:'proof',answer:'turn',push:'press',close:'vow'})[round];
  const id=(choices.find(x=>x.id===wanted)||choices[0]).id;
  M.choose(st,id);M.choose(control,id);
 }
 eq(st,control);
}
assert.ok(signatures.size>=150,'insufficient diversity in real input vectors');
console.log('PASS F1: '+Object.keys(F.curves).length+' continuous membership axes, 3,200 sampled points, '+roster.length+' real workers and '+signatures.size+' distinct initial membership vectors; no live state mutation.');

 // F2: independent scores, explicit event cues, monotone sample comparisons,
 // smooth overlapping memberships and reproducible real-roster differentiation.
 const run=(values,identity={},style,signals)=>F.infer({grades:F.fuzzify(values)},identity,style,signals);
 const calm={irritation:10,composure:80,ego:70,professionalism:90,ringPsychology:75,microphone:60,rivalryHeat:40,momentum:50};
 const hot={...calm,irritation:85,composure:25};
 const c=run(calm),h=run(hot);
 assert.ok(h.scores.aggression>c.scores.aggression);
 assert.ok(h.scores.defensiveness>c.scores.defensiveness);
 assert.ok(h.scores.vulnerability>c.scores.vulnerability);
 assert.ok(c.scores.respect>h.scores.respect);
 assert.ok(c.scores.assertiveness>h.scores.assertiveness);
 const both=run({...hot,ego:90,professionalism:90});
 assert.ok(both.scores.aggression>65&&both.scores.respect>35,'conflicting drives must coexist');
 const touched=run(calm,{},null,{vulnerabilityTouched:true});
 assert.ok(touched.scores.vulnerability>c.scores.vulnerability&&touched.scores.defensiveness>c.scores.defensiveness);
 eq(c,run(calm,{},null,{vulnerabilityTouched:false,crowdSupport:'true'}));
 assert.ok(Object.values(run({}).scores).every(x=>x===null));
 const technical=run(calm,{tactic:'Ask one tactical question'},'Technical');
 const spectacle=run(calm,{tactic:'Build anticipation of a credible athletic moment'},'Spectacle');
 assert.ok(spectacle.scores.showmanship>technical.scores.showmanship);
 const reflect=run({...calm,composure:50},{delivery:'Warm and reflective'},'Story');
 assert.ok(reflect.scores.vulnerability>run({...calm,composure:50},{},'Story').scores.vulnerability);
 assert.equal(new Set(F.rules.map(r=>r.id)).size,F.rules.length);
 for(const rule of F.rules){assert.ok(F.outputs.includes(rule.output));assert.ok(rule.value>=0&&rule.value<=100&&rule.weight>0);assert.ok(Object.isFrozen(rule)&&Object.isFrozen(rule.when));}
 let previous=null;
 for(let i=0;i<=100;i+=.25){
  const result=run({...calm,irritation:i});
  for(const [key,score] of Object.entries(result.scores)){
   assert.ok(Number.isFinite(score)&&score>=0&&score<=100);
   if(previous)assert.ok(Math.abs(score-previous[key])<2,'discontinuous inference '+key);
  }
  previous=result.scores;
 }
 const inferred=new Set(),academyVectors=new Set(),usedRules=new Set(),ranges=Object.fromEntries(F.outputs.map(k=>[k,{min:100,max:0}]));
 let evaluated=0;
 for(const worker of roster){
  const opponent=roster.find(x=>x.id!==worker.id&&D.divisionOf(x)===D.divisionOf(worker));
  const director=P.begin(worker,opponent,null,'faceoff');
  for(const [irritation,composure,meter] of [[director.player.irritation,director.player.composure,0],[40,50,-10],[65,30,-35],[20,75,35]]){
   const participant={...director.player,irritation,composure};
   const snapshot=F.snapshot(worker,participant,{side:'w',meter,feudHeat:45});
   const input=JSON.stringify([snapshot,participant.identity,worker]);
   const result=F.infer(snapshot,participant.identity,worker.style);
   eq(result,F.infer(clone(snapshot),clone(participant.identity),worker.style));
   assert.equal(JSON.stringify([snapshot,participant.identity,worker]),input);
   const signature=JSON.stringify(result.scores);inferred.add(signature);
   if(worker.id.startsWith('academy-'))academyVectors.add(signature);
   for(const key of F.outputs){
    const v=result.scores[key];assert.ok(Number.isFinite(v)&&v>=0&&v<=100,worker.id+' '+key);
    ranges[key].min=Math.min(ranges[key].min,v);ranges[key].max=Math.max(ranges[key].max,v);
    for(const r of result.fired[key])usedRules.add(r.id);
   }
   evaluated++;
  }
 }
 assert.equal(evaluated,800);assert.ok(academyVectors.size>=120);
 assert.ok(F.outputs.every(k=>ranges[k].max-ranges[k].min>15),'insufficient output range');
 console.log('F2 INFERENCE AUDIT '+JSON.stringify({evaluated,distinct:inferred.size,academyDistinct:academyVectors.size,rules:F.rules.length,observedRules:usedRules.size,ranges}));
 console.log('PASS F2: bounded, continuous, deterministic independent behavioural drives; explicit signals only; no live policy changes.');
