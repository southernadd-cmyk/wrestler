/* THE OFFICE — F1: pure fuzzy membership functions for promo behaviour.
   Membership grades are not probabilities or new career statistics.
   No live selector calls this module until a later explicit opt-in phase. */
(function(root){'use strict';
 const K=root.OfficePsychology;
 const clamp=x=>Math.max(0,Math.min(100,x));
 const owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const curveSpec={
  irritation:[15,40,70],composure:[25,50,75],
  ...K.workerCurves,rivalryHeat:[15,45,75],momentum:[25,50,75]
 };
 // Read existing values without creating, modifying or inferring career facts.
 // Participant ego/pro are scene snapshots; skill values come from the worker.
 // Momentum is the current signed duel meter, not a measure of crowd affection.
 // A missing/nonfinite value is unknown, never a fabricated neutral grade.
 function inputs(worker,participant,context={}){
  const known=x=>Number.isFinite(x)?clamp(x):null;
  const meter=context.meter,side=context.side;
  return {
   irritation:known(participant?.irritation),composure:known(participant?.composure),
   ...K.workerInputs(worker,participant),
   rivalryHeat:known(context.feudHeat),
   momentum:Number.isFinite(meter)&&['w','f'].includes(side)?known(50+(side==='w'?meter:-meter)/2):null
  };
 }
 function fuzzify(values){return model.fuzzify(values);}
 function snapshot(worker,participant,context){
  const values=inputs(worker,participant,context);
  return {v:1,values,grades:fuzzify(values)};
 }
 // F2: zero-order Sugeno rules. Antecedent conjunction is min; each output
 // independently aggregates weighted singleton consequents. No winner-takes-all
 // personality class and no rule may alter a claim or choose a line.
 const outputSpec=Object.freeze(['aggression','respect','defensiveness','assertiveness','vulnerability','showmanship']);
 const ruleSpec=Object.freeze([
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
 const model=K.createModel({curves:curveSpec,outputs:outputSpec,rules:ruleSpec});
 const {curves,outputs,rules,membership}=model;
 function infer(snapshot,identity,style,signals){
  return model.infer(snapshot?.grades,cues(identity,style,signals));
 }
 // F3: snapshot only the stable inputs needed by this policy. The live
 // director remains authoritative for changing emotions and the signed meter.
 function selectionFacts(worker){
  return {values:K.workerInputs(worker),style:worker?.style||null};
 }
 function selectionScores(facts,participant,meter,side,feudHeat){
  if(!facts||!participant)return null;
  const values={...facts.values,irritation:participant.irritation,composure:participant.composure,
   rivalryHeat:feudHeat,momentum:Number.isFinite(meter)?clamp(50+(side==='w'?meter:-meter)/2):null};
  return infer({grades:fuzzify(values)},participant.identity,facts.style).scores;
 }
 // A weak continuous bias (0.75..1.25), never a hard eligibility filter.
 // Categories are editorial metadata, not inferred sentiment from text.
 function categoryWeight(category,scores){
  if(!scores)return 1;
  const axis={challenge:'assertiveness',disrespect:'aggression',respect:'respect',vulnerability:'vulnerability',pressure:'defensiveness'}[category];
  const n=axis&&scores[axis];return Number.isFinite(n)?.75+.5*n/100:1;
 }
 // For the reviewed shared rookie pairs only: blend existing delivery
 // preferences with current behavioural drives rather than a crisp cutoff.
 function directWeight(scores,delivery){
  if(!scores)return .5;
  const grade=k=>Number.isFinite(scores[k])?scores[k]/100:.5;
  const base=['Dry and direct','Reserved until challenged','Blunt but sincere'].includes(delivery)?.65:
   ['Measured and methodical','Warm and reflective'].includes(delivery)?.35:.5;
  return Math.max(.15,Math.min(.85,.5+(base-.5)*.8+.35*(grade('aggression')-.5)+.2*(grade('defensiveness')-.5)+.15*(grade('assertiveness')-.5)-.2*(grade('respect')-.5)));
 }
 // F4: bounded emotional transition using the pre-turn fuzzy drives.
 // Context supplies only actual observed results, never inferred insults,
 // personal vulnerabilities, crowd preferences or new career facts.
 function emotionStep(facts,participant,event={}){
  if(!facts||!participant||!Number.isFinite(participant.composure)||!Number.isFinite(participant.irritation))return null;
  const scores=selectionScores(facts,participant,event.beforeMeter,event.side,event.feudHeat);
  if(!scores||!['w','f'].includes(event.side)||!Number.isFinite(event.beforeMeter)||!Number.isFinite(event.afterMeter))return null;
  const unit=(n)=>Number.isFinite(n)?clamp(n)/100:.5;
  const drive=k=>unit(scores[k]);
  const pro=unit(facts.values.professionalism),psych=unit(facts.values.ringPsychology),ego=unit(facts.values.ego);
  const recovery=.35+.35*pro+.3*psych;
  const reactivity=.55+.35*ego+.45*drive('defensiveness')+.25*drive('aggression');
  const oriented=(event.afterMeter-event.beforeMeter)*(event.side==='w'?1:-1);
  const gain=Math.max(-1,Math.min(1,oriented/18));
  const success=event.spoke&&event.side==='w'&&typeof event.landed==='boolean'?(event.landed?1:-1):0;
  const targeted=event.side==='f'&&event.personal===true;
  const calming=event.calming===true;
  const baseComposure=clamp(50+((facts.values.ringPsychology??50)-50)*.35);
  const baseIrritation=clamp((facts.values.ego??50)*.25);
  const c=participant.composure,i=participant.irritation;
  // Gentle drift to the actor's own starting equilibrium. Positive feedback
  // helps composure; negative feedback and personal attacks hurt more when
  // defensive. Acknowledgement offers relief rather than guaranteed agreement.
  const dc=(baseComposure-c)*.12*recovery
   +Math.max(0,gain)*9*recovery+Math.min(0,gain)*12*reactivity
   +(success>0?4*recovery:success<0?-5*reactivity:0)
   -(targeted?4*reactivity:0)+(calming?5*recovery:0);
  const di=(baseIrritation-i)*.1*recovery
   -Math.max(0,gain)*5*recovery-Math.min(0,gain)*10*reactivity
   +(success<0?5*reactivity:success>0?-2*recovery:0)
   +(targeted?12*reactivity:0)-(calming?10*recovery:0);
  const limited=(n,max)=>Math.max(-max,Math.min(max,n));
  return {composure:clamp(c+limited(dc,18)),irritation:clamp(i+limited(di,22))};
 }
 root.OfficePromoFuzzy=Object.freeze({version:1,curves,membership,inputs,fuzzify,snapshot,outputs,rules,cues,infer,selectionFacts,selectionScores,categoryWeight,directWeight,emotionStep});
})(typeof window!=='undefined'?window:globalThis);
