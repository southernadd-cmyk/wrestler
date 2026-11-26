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
 // F2: zero-order Sugeno rules. Antecedent conjunction is min; each output
 // independently aggregates weighted singleton consequents. No winner-takes-all
 // personality class and no rule may alter a claim or choose a line.
 const outputs=Object.freeze(['aggression','respect','defensiveness','assertiveness','vulnerability','showmanship']);
 const rules=Object.freeze([
  // [id, output, singleton 0..100, weight, antecedents]
  ['a-hot','aggression',90,1.2,['irritation.high']],
  ['a-warm','aggression',55,.8,['irritation.medium']],
  ['a-calm','aggression',15,1,['irritation.low']],
  ['a-ego','aggression',95,1.1,['ego.high','irritation.high']],
  ['a-discipline','aggression',25,1.1,['professionalism.high','composure.high']],
  ['a-rivalry','aggression',80,.8,['rivalryHeat.high','irritation.medium']],
  ['a-direct','aggression',65,.65,['tactic.direct','irritation.medium']],
  ['a-control','aggression',35,.65,['tactic.technical','composure.high']],
  ['r-pro','respect',85,1.2,['professionalism.high']],
  ['r-mid','respect',60,.75,['professionalism.medium']],
  ['r-low','respect',25,1,['professionalism.low']],
  ['r-calm','respect',75,.7,['irritation.low','composure.high']],
  ['r-hostile','respect',15,1,['ego.high','irritation.high']],
  ['r-credible','respect',95,1.2,['signal.credibleArgument','professionalism.high']],
  ['r-fair','respect',80,.7,['tactic.fair','composure.medium']],
  ['r-audience','respect',70,.6,['tactic.audience','professionalism.medium']],
  ['d-unsettled','defensiveness',85,1.1,['composure.low']],
  ['d-steady','defensiveness',45,.7,['composure.medium']],
  ['d-settled','defensiveness',15,1,['composure.high']],
  ['d-ego','defensiveness',85,1,['ego.high','momentum.low']],
  ['d-hurt','defensiveness',95,1.1,['signal.vulnerabilityTouched']],
  ['d-recover','defensiveness',25,.7,['professionalism.high','ringPsychology.high']],
  ['s-ego','assertiveness',85,1,['ego.high']],
  ['s-mid','assertiveness',60,.7,['ego.medium']],
  ['s-low','assertiveness',35,.8,['ego.low']],
  ['s-composed','assertiveness',85,1,['composure.high']],
  ['s-unsettled','assertiveness',25,.9,['composure.low']],
  ['s-technical','assertiveness',75,.75,['tactic.technical','ringPsychology.medium']],
  ['s-direct','assertiveness',80,.75,['tactic.direct']],
  ['s-progress','assertiveness',85,.8,['signal.recognitionDenied','ego.medium']],
  ['s-momentum','assertiveness',80,.6,['momentum.high']],
  ['v-low','vulnerability',75,1,['composure.low']],
  ['v-mid','vulnerability',40,.8,['composure.medium']],
  ['v-high','vulnerability',20,1,['composure.high']],
  ['v-touched','vulnerability',95,1.3,['signal.vulnerabilityTouched']],
  ['v-open','vulnerability',80,.8,['delivery.reflective','composure.medium']],
  ['v-guarded','vulnerability',20,.8,['delivery.reserved','ego.high']],
  ['v-setback','vulnerability',70,.65,['momentum.low','irritation.medium']],
  ['h-mic','showmanship',85,1,['microphone.high']],
  ['h-mid','showmanship',50,.8,['microphone.medium']],
  ['h-low','showmanship',20,1,['microphone.low']],
  ['h-audience','showmanship',90,1,['tactic.audience']],
  ['h-spectacle','showmanship',90,.9,['tactic.spectacle']],
  ['h-technical','showmanship',30,.65,['tactic.technical']],
  ['h-reserved','showmanship',20,.85,['delivery.reserved']],
  ['h-momentum','showmanship',85,.65,['momentum.high','microphone.high']],
  ['h-support','showmanship',95,1,['signal.crowdSupport','microphone.high']]
 ].map(([id,output,value,weight,when])=>Object.freeze({id,output,value,weight,when:Object.freeze(when)})));
 // Exact reviewed academy tactics and delivery labels; no free-text sentiment
 // scoring, fictional biography facts or inferred vulnerability triggers.
 const tacticTags=Object.freeze({
  'Ask one tactical question':['technical'],'Test the rival with one precise question':['technical'],'Ask for the sequence before the first move':['technical'],
  'Ask for a direct sporting test':['direct','fair'],'Challenge the rival to meet force with control':['direct'],'Ask for a clean finish with no shortcuts':['direct','fair'],
  'Find a reason the crowd should care':['audience'],'Ask the rival what they want from the match':['fair'],'Give the crowd one moment to remember':['audience'],
  'Build anticipation of a credible athletic moment':['spectacle'],'Promise a memorable moment built with care':['spectacle','fair'],'Ask for the crowd to lean in before the big move':['spectacle','audience']
 });
 const deliveryTags=Object.freeze({
  'Measured and methodical':'reflective','Warm and reflective':'reflective','Reserved until challenged':'reserved','Dry and direct':'reserved','Blunt but sincere':'reserved'
 });
 const styleTags=Object.freeze({Technical:['technical'],Brawl:['direct'],Story:['audience'],Spectacle:['spectacle','audience']});
 function cues(identity,style,signals={}){
  const out={};
  // Specific academy tactic wins; other profiles receive a weaker style cue.
  const explicit=owns(tacticTags,identity?.tactic),tags=explicit?tacticTags[identity.tactic]:owns(styleTags,style)?styleTags[style]:[];
  for(const tag of tags)out['tactic.'+tag]=explicit?1:.45;
  if(owns(deliveryTags,identity?.delivery))out['delivery.'+deliveryTags[identity.delivery]]=1;
  // Only explicit scene signals may fire these rules. Unknown and false do
  // not contribute; this API never decides that an insult or cheer occurred.
  for(const key of ['credibleArgument','vulnerabilityTouched','recognitionDenied','crowdSupport'])if(signals?.[key]===true)out['signal.'+key]=1;
  return out;
 }
 function infer(snapshot,identity,style,signals){
  const facts=cues(identity,style,signals),grades=snapshot?.grades||{};
  for(const axis of Object.keys(curves))for(const label of ['low','medium','high']){
   const n=grades[axis]?.[label];
   if(Number.isFinite(n))facts[axis+'.'+label]=Math.max(0,Math.min(1,n));
  }
  const scores={},fired={};
  for(const output of outputs){
   let sum=0,total=0;const evidence=[];
   for(const rule of rules){
    if(rule.output!==output)continue;
    const activation=Math.min(...rule.when.map(key=>facts[key]||0));
    if(!activation)continue;
    const weight=activation*rule.weight;
    sum+=weight*rule.value;total+=weight;
    evidence.push({id:rule.id,activation,weight,value:rule.value});
   }
   // A small neutral prior regularises the low-activation boundary. No
   // evidence means unknown, rather than a fabricated personality score.
   scores[output]=total?(sum+10)/(total+.2):null;
   fired[output]=evidence;
  }
  return {v:1,scores,fired};
 }
 root.OfficePromoFuzzy=Object.freeze({version:1,curves,membership,inputs,fuzzify,snapshot,outputs,rules,cues,infer});
})(typeof window!=='undefined'?window:globalThis);
