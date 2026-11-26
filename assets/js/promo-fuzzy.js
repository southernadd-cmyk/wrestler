/* THE OFFICE — F1: pure fuzzy membership functions for promo behaviour.
   Membership grades are not probabilities or new career statistics.
   No live selector calls this module until a later explicit opt-in phase. */
(function(root){'use strict';
 const clamp=x=>Math.max(0,Math.min(100,x));
 const owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 // [end of low plateau, medium peak, start of high plateau].
 // Adjacent sets overlap linearly and the three grades sum to one.
 const curves=Object.freeze(Object.fromEntries(Object.entries({
  irritation:[15,40,70],
  composure:[25,50,75],
  ego:[25,50,80],
  professionalism:[30,60,85],
  ringPsychology:[25,50,80],
  microphone:[25,50,80],
  rivalryHeat:[15,45,75],
  momentum:[25,50,75]
 }).map(([k,v])=>[k,Object.freeze(v)])));
 function membership(axis,value){
  if(!owns(curves,axis)||!Number.isFinite(value))return null;
  const [a,b,c]=curves[axis],x=clamp(value);
  if(x<=a)return {low:1,medium:0,high:0};
  if(x<b){const t=(x-a)/(b-a);return {low:1-t,medium:t,high:0};}
  if(x<c){const t=(x-b)/(c-b);return {low:0,medium:1-t,high:t};}
  return {low:0,medium:0,high:1};
 }
 // Read existing values without creating, modifying or inferring career facts.
 // Participant ego/pro are scene snapshots; skill values come from the worker.
 // Momentum is the current signed duel meter, not a measure of crowd affection.
 // A missing/nonfinite value is unknown, never a fabricated neutral grade.
 function inputs(worker,participant,context={}){
  const known=x=>Number.isFinite(x)?clamp(x):null;
  const first=(a,b)=>Number.isFinite(a)?a:b;
  const meter=context.meter,side=context.side;
  return {
   irritation:known(participant?.irritation),composure:known(participant?.composure),
   ego:known(first(participant?.ego,worker?.ego)),
   professionalism:known(first(participant?.pro,worker?.pro)),
   ringPsychology:known(worker?.psych),microphone:known(worker?.mic),
   rivalryHeat:known(context.feudHeat),
   momentum:Number.isFinite(meter)&&['w','f'].includes(side)?known(50+(side==='w'?meter:-meter)/2):null
  };
 }
 function fuzzify(values={}){
  return Object.fromEntries(Object.keys(curves).map(axis=>[axis,membership(axis,values?.[axis])]));
 }
 function snapshot(worker,participant,context){
  const values=inputs(worker,participant,context);
  return {v:1,values,grades:fuzzify(values)};
 }
 root.OfficePromoFuzzy=Object.freeze({version:1,curves,membership,inputs,fuzzify,snapshot});
})(typeof window!=='undefined'?window:globalThis);
