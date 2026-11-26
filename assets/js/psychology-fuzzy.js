/* THE OFFICE — shared deterministic psychology inference kernel.
   No dependencies on promos, match planning, career state, RNG or the DOM.
   Domains own their inputs, rules and hard eligibility constraints. */
(function(root){'use strict';
 const owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
 const known=v=>Number.isFinite(v)?clamp(v):null;
 const first=(a,b)=>Number.isFinite(a)?a:b;
 const axisName=/^[a-z][a-zA-Z0-9]*$/;
 const gradeName=/^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;
 const labels=Object.freeze(['low','medium','high']);
 // Shared meanings/knots, not a shared mutable personality state.
 // Additional domain axes may supply their own explicitly reviewed curves.
 const workerCurves=Object.freeze(Object.fromEntries(Object.entries({
  ego:[25,50,80],professionalism:[30,60,85],ringPsychology:[25,50,80],microphone:[25,50,80]
 }).map(([k,v])=>[k,Object.freeze(v)])));
 function workerInputs(worker,scene){
  return {ego:known(first(scene?.ego,worker?.ego)),professionalism:known(first(scene?.pro,worker?.pro)),ringPsychology:known(worker?.psych),microphone:known(worker?.mic)};
 }
 // Explicit conversion for signed or differently scaled domain values.
 // Missing facts remain missing rather than silently becoming 50.
 function scale(value,min,max){
  return Number.isFinite(value)&&Number.isFinite(min)&&Number.isFinite(max)&&max>min?clamp((value-min)*100/(max-min)):null;
 }
 function createModel(spec){
  if(!spec||!spec.curves||!Array.isArray(spec.outputs)||!Array.isArray(spec.rules))throw Error('Invalid psychology model');
  const curves=Object.freeze(Object.fromEntries(Object.entries(spec.curves).map(([axis,v])=>{
   if(!axisName.test(axis)||!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite)||v[0]<0||v[2]>100||!(v[0]<v[1]&&v[1]<v[2]))throw Error('Invalid psychology curve '+axis);
   return [axis,Object.freeze([...v])];
  })));
  const outputs=Object.freeze([...spec.outputs]);
  if(!outputs.length||new Set(outputs).size!==outputs.length||outputs.some(k=>!axisName.test(k)))throw Error('Invalid psychology outputs');
  const ids=new Set();
  const rules=Object.freeze(spec.rules.map(r=>{
   if(typeof r.id!=='string'||!r.id||ids.has(r.id)||!outputs.includes(r.output)||!Number.isFinite(r.value)||r.value<0||r.value>100||!Number.isFinite(r.weight)||r.weight<=0||!Array.isArray(r.when)||!r.when.length||r.when.some(k=>typeof k!=='string'||!gradeName.test(k)))throw Error('Invalid psychology rule '+r.id);
   ids.add(r.id);
   return Object.freeze({id:r.id,output:r.output,value:r.value,weight:r.weight,when:Object.freeze([...r.when])});
  }));
  const prior=Object.freeze({value:spec.prior?.value??50,weight:spec.prior?.weight??.2});
  if(!Number.isFinite(prior.value)||prior.value<0||prior.value>100||!Number.isFinite(prior.weight)||prior.weight<0)throw Error('Invalid psychology prior');
  function membership(axis,value){
   if(!owns(curves,axis)||!Number.isFinite(value))return null;
   const [a,b,c]=curves[axis],x=clamp(value);
   if(x<=a)return {low:1,medium:0,high:0};
   if(x<b){const t=(x-a)/(b-a);return {low:1-t,medium:t,high:0};}
   if(x<c){const t=(x-b)/(c-b);return {low:0,medium:1-t,high:t};}
   return {low:0,medium:0,high:1};
  }
  function fuzzify(values={}){
   return Object.fromEntries(Object.keys(curves).map(axis=>[axis,membership(axis,values?.[axis])]));
  }
  // Domain cues are optional graded evidence. Numeric axes always own their
  // names, even when unknown; a cue cannot spoof a missing numeric grade.
  function infer(grades={},cues={}){
   const facts=new Map();
   for(const [key,n] of Object.entries(cues||{}))if(gradeName.test(key)&&!owns(curves,key.split('.')[0])&&Number.isFinite(n))facts.set(key,clamp(n,0,1));
   for(const axis of Object.keys(curves))for(const label of labels){
    const n=grades?.[axis]?.[label];
    if(Number.isFinite(n))facts.set(axis+'.'+label,clamp(n,0,1));
   }
   const scores={},fired={};
   for(const output of outputs){
    let sum=0,total=0;const evidence=[];
    for(const rule of rules){
     if(rule.output!==output)continue;
     const activation=Math.min(...rule.when.map(key=>facts.get(key)||0));
     if(!activation)continue;
     const weight=activation*rule.weight;
     sum+=weight*rule.value;total+=weight;
     evidence.push({id:rule.id,activation,weight,value:rule.value});
    }
    scores[output]=total?(sum+prior.value*prior.weight)/(total+prior.weight):null;
    fired[output]=evidence;
   }
   return {v:1,scores,fired};
  }
  function evaluate(values,cues){return infer(fuzzify(values),cues);}
  return Object.freeze({version:1,curves,outputs,rules,prior,membership,fuzzify,infer,evaluate});
 }
 root.OfficePsychology=Object.freeze({version:1,workerCurves,workerInputs,scale,createModel});
})(typeof window!=='undefined'?window:globalThis);
