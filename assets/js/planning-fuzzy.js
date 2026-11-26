/* THE OFFICE — MP3C: planning domain membership, evidence and behaviour.
   Reuse the shared Sugeno kernel and canonical worker axes. The live structure huddle uses bounded reactions for opted-in new meetings. */
(function(root){'use strict';
 const K=root.OfficePsychology;
 if(!K)throw Error('Planning fuzzy requires OfficePsychology');
 const owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 // Keep the canonical source as the single authority. Mic is available
 // for future explicit rules, not assumed to affect match planning.
 const workerCurves=K.workerCurves;
 // Provisional knots, not empirical calibration or physical safety limits.
 // Unavailable evidence remains null; proposal scores require a later
 // explicit evidence contract rather than guessed worker attributes.
 const planningCurves=Object.freeze(Object.fromEntries(Object.entries({
  consent:[30,60,85],fatigue:[20,45,75],safetyAbility:[45,70,90],
  ringAbility:[40,65,85],professionalTrust:[25,50,80],morale:[30,55,80],
  proposalRisk:[20,45,75],proposalFairness:[25,50,75],
  sequenceDifficulty:[25,50,80],structureCompatibility:[25,50,75],
  creativeBenefit:[25,50,80]
 }).map(([axis,knots])=>[axis,Object.freeze(knots)])));
 const curves=Object.freeze({...workerCurves,...planningCurves});
 function createModel(spec){
  if(!spec||typeof spec!=='object'||Array.isArray(spec))throw Error('Invalid planning fuzzy model');
  const extra=spec.curves??{};
  if(typeof extra!=='object'||Array.isArray(extra))throw Error('Invalid planning fuzzy curves');
  for(const axis of Object.keys(extra)){
   if(owns(workerCurves,axis))throw Error('Cannot override canonical worker curve '+axis);
   if(owns(planningCurves,axis))throw Error('Cannot override versioned planning curve '+axis);
  }
  return K.createModel({...spec,curves:{...curves,...extra}});
 }
 // MP1C: capture only primitive facts from original participants and supplied
 // career state. Do not call lazy memory/ledger accessors that hydrate saves.
 const finite=n=>Number.isFinite(n)?n:null;
 const stat=n=>K.scale(n,0,100);
 const str=v=>typeof v==='string'&&v.length?v:null;
 const rows=v=>Array.isArray(v)?v:[];
 const sideOther=s=>s==='w'?'f':'w';
 const assertSide=s=>{if(s!=='w'&&s!=='f')throw Error('Invalid planning side');};
 function prior(row,room){
  return row&&row.cid!==room.cid&&(!Number.isFinite(row.abs)||!Number.isFinite(room.contract?.eventAbs)||row.abs<room.contract.eventAbs);
 }
 function participant(worker,opponent,career,room){
  const id=worker.id,rid=opponent.id;
  const memory=career?.officeMemory;
  const entries=rows(memory?.entries?.[id]).filter(e=>e?.against===rid&&e.id!==room.cid&&(!Number.isFinite(e.week)||!Number.isFinite(room.contract?.eventAbs)||e.week<=room.contract.eventAbs));
  const pair=career?.bonds?.pairs?.[[id,rid].sort().join('|')];
  // Personal regard and shared bonds are not professional trust.
  const regard=finite(memory?.rivals?.[id+':'+rid]);
  const history=Array.isArray(career?.history)?career.history.filter(h=>h&&((h.wid===id&&h.rid===rid)||(h.wid===rid&&h.rid===id))&&prior({...h,abs:Number.isFinite(h.season)&&Number.isFinite(h.week)?(h.season-1)*16+h.week:null},room)):null;
  const ledgers=Object.values(career?.rivalries||{}).filter(l=>l&&((l.w===id&&l.f===rid)||(l.w===rid&&l.f===id)));
  const meetings=new Map(),talks=new Map();
  for(const ledger of ledgers){
   const actor=ledger.w===id?'w':'f';
   for(const m of rows(ledger.meetings)){
    if(!prior(m,room)||!str(m.cid))continue;
    const event={cid:m.cid,abs:finite(m.abs),outcome:str(m.outcome),
     ownInjury:m.injured?.[actor]??null,opponentInjury:m.injured?.[sideOther(actor)]??null,
     legacy:m.legacy===true};
    meetings.set(m.cid,event);
   }
   for(const t of rows(ledger.talks)){
    if(!str(t?.cid)||!meetings.has(t.cid))continue;
    talks.set(t.cid,{cid:t.cid,requestedBy:t.by==='w'?ledger.w:t.by==='f'?ledger.f:null,issue:str(t.issue),slot:str(t.slot),original:str(t.original),final:str(t.final),reply:str(t.reply),delivered:str(t.delivered)});
   }
  }
  const identity=root.OfficePromoIdentity?.wrestler?.(worker);
  // Existing career ambitions are read directly, never initialized here.
  const ambition=career?.ambitions?.w?.[id];
  const goal=ambition&&['title','push','money','body','rivalry','respect','stage','mentor'].includes(ambition.kind)&&(!Number.isFinite(ambition.since)||!Number.isFinite(room.contract?.eventAbs)||ambition.since<=room.contract.eventAbs)?{kind:ambition.kind,since:finite(ambition.since),satisfaction:stat(ambition.sat)}:null;
  return {id,opponentId:rid,style:str(worker.style),tier:str(worker.tier),identity:identity?Object.fromEntries(['source','delivery','motivation','vulnerability','trigger','tactic','boundary','underPressure'].map(k=>[k,str(identity[k])])):null,
   values:{...K.workerInputs(worker),fatigue:stat(worker.fatigue),safetyAbility:stat(worker.safe),ringAbility:stat(worker.ring),morale:stat(worker.morale),professionalTrust:null},
   injury:finite(worker.injury),age:finite(worker.age),careerGoal:goal,
   relationship:{regard,sharedBond:finite(pair?.score),betrayed:typeof pair?.betrayed==='boolean'?pair.betrayed:null,
    memories:entries.slice(0,12).map(e=>({id:str(e.id),week:finite(e.week),kind:str(e.kind),text:str(e.text)})),
    priorMatches:history?.length??null,meetings:[...meetings.values()],talks:[...talks.values()]}};
 }
 function capture(room,w,f,career=null){
  if(!room||!str(room.cid)||!w||!f||!str(w.id)||!str(f.id)||w.id===f.id||room.w?.id!==w.id||room.f?.id!==f.id)throw Error('Planning evidence participant mismatch');
  return {v:1,cid:room.cid,participants:{w:participant(w,f,career,room),f:participant(f,w,career,room)}};
 }
 function observe(snapshot,room,side){
  assertSide(side);
  if(snapshot?.v!==1||!room||snapshot.cid!==room.cid||snapshot.participants?.w?.id!==room.w?.id||snapshot.participants?.f?.id!==room.f?.id)throw Error('Planning evidence snapshot mismatch');
  const p=snapshot.participants[side];
  const values=Object.fromEntries(Object.keys(curves).map(k=>[k,stat(p.values?.[k])]));
  // Initial 70 is a placeholder before plan selection. Afterwards read the
  // real effective consent, with the room's existing clamp and rounding.
  if(room.base&&Number.isFinite(room.consent?.[side])&&Number.isFinite(room.mood?.[side]))values.consent=root.OfficeRoom.consent(room,side);
  // Risk/fairness/difficulty/compatibility/benefit lack defensible numeric
  // assessments today; remain null instead of inferring from safety flags.
  return {v:1,cid:snapshot.cid,side,actorId:p.id,opponentId:p.opponentId,values,
   context:{stage:str(room.stage),plan:str(room.game),structure:str(room.structure?.id),lead:str(room.structure?.roles?.lead),finish:str(room.finish),minutes:finite(room.minutes),rivalryHeat:stat(room.heat),moodDelta:finite(room.mood?.[side])}};
 }
 // MP2A: independent behavioural tendencies, not choice probabilities.
 // Equal weight across grades within one family keeps transitions smooth.
 // MP3C: targeted calibration of three outputs against the balanced audit.
 // Other five outputs and all membership curves remain unchanged.
 const behaviourOutputs=['cooperation','assertiveness','caution','ambition','protectiveness','flexibility','mentorship','improvisation'];
 const rule=(id,output,value,weight,...when)=>({id,output,value,weight,when});
 const family=(output,axis,values,weight)=>['low','medium','high'].map((grade,i)=>rule(output+'_'+axis+'_'+grade,output,values[i],weight,axis+'.'+grade));
 const behaviourModel=createModel({outputs:behaviourOutputs,rules:[
  ...family('cooperation','consent',[15,55,90],3),
  ...family('cooperation','professionalism',[25,60,85],2),
  ...family('cooperation','ringPsychology',[35,55,75],1),
  ...family('cooperation','morale',[30,55,75],1),
  ...family('assertiveness','ego',[20,55,90],3),
  ...family('assertiveness','ringPsychology',[25,55,80],1.5),
  ...family('assertiveness','ringAbility',[30,55,75],1),
  rule('assertiveness_constructive','assertiveness',85,1,'professionalism.high','ringPsychology.high'),
  ...family('caution','fatigue',[15,60,95],3),
  ...family('caution','safetyAbility',[35,55,75],1),
  ...family('caution','ringPsychology',[30,55,75],1),
  rule('caution_current_injury','caution',100,4,'condition.injured'),
  rule('caution_previous_injury','caution',90,2,'history.ownInjury'),
  // Ambition is creative/visibility initiative, not a replacement for the
  // career ambition system or a prediction of contract dissatisfaction.
  ...family('ambition','ego',[30,55,85],2),
  ...family('ambition','morale',[40,55,75],1),
  rule('ambition_advancement','ambition',90,2,'goal.advancement'),
  rule('ambition_respect','ambition',85,2,'goal.respect'),
  // Protectiveness here means preserving one's credible portrayal.
  // It is distinct from medical caution and willingness to collaborate.
  ...family('protectiveness','ego',[25,55,85],1),
  ...family('protectiveness','ringPsychology',[35,55,80],0.5),
  rule('protectiveness_booked_loss','protectiveness',90,2,'booking.actorLoses'),
  rule('protectiveness_prior_humiliation','protectiveness',95,3,'history.ownHumiliation'),
  // Flexibility is capacity/willingness to adapt a workable layout,
  // not blanket consent to changes or permission for illegal moves.
  ...family('flexibility','professionalism',[25,60,85],2),
  ...family('flexibility','ringPsychology',[20,55,90],2),
  ...family('flexibility','ringAbility',[30,55,80],1),
  // Mentorship: willingness and capacity to guide a partner. A veteran
  // tier is contextual evidence, not a substitute for professionalism.
  ...family('mentorship','professionalism',[20,55,85],1),
  ...family('mentorship','ringPsychology',[20,55,85],1),
  ...family('mentorship','safetyAbility',[30,55,80],2),
  rule('mentorship_career_goal','mentorship',95,4,'goal.mentor'),
  rule('mentorship_veteran_developing_partner','mentorship',90,3,'pair.veteranDeveloping','professionalism.high'),
  // Improvisation: capacity to adapt when a planned beat changes, not
  // permission to abandon a finish, disregard consent or perform a hazard.
  ...family('improvisation','ringPsychology',[15,55,90],3),
  ...family('improvisation','ringAbility',[20,55,85],2),
  ...family('improvisation','fatigue',[80,55,25],2),
  rule('improvisation_prior_adaptation','improvisation',95,1,'history.requestedAdaptation')
 ]});
 function behaviour(snapshot,room,side){
  const observation=observe(snapshot,room,side),p=snapshot.participants[side];
  const cues={};
  if(Number.isFinite(p.injury)&&p.injury>0)cues['condition.injured']=1;
  if(rows(p.relationship?.memories).some(m=>m.kind==='hurt')||
     rows(p.relationship?.meetings).some(m=>m.legacy!==true&&(m.ownInjury===true||str(m.ownInjury))))cues['history.ownInjury']=1;
  const goal=p.careerGoal?.kind;
  if(['title','push','stage'].includes(goal))cues['goal.advancement']=1;
  if(goal==='respect')cues['goal.respect']=1;
  const finish=observation.context.finish;
  if((side==='w'&&['lose_clean','lose_protected','lose_dq'].includes(finish))||
     (side==='f'&&['win_clean','win_dirty','win_dq'].includes(finish)))cues['booking.actorLoses']=1;
  if(rows(p.relationship?.memories).some(m=>m.kind==='humiliation'))cues['history.ownHumiliation']=1;
  if(goal==='mentor')cues['goal.mentor']=1;
  const partner=snapshot.participants[sideOther(side)];
  if(p.tier==='Veteran'&&['Rookie','Prospect'].includes(partner?.tier))cues['pair.veteranDeveloping']=1;
  // A recorded request followed by an adapted delivery is modest pair
  // evidence, not proof that this actor alone improvised successfully.
  if(rows(p.relationship?.talks).some(t=>t.requestedBy===p.id&&t.delivered==='adapted'))cues['history.requestedAdaptation']=1;
  const inference=behaviourModel.evaluate(observation.values,cues);
  return {v:1,observation,cues,scores:inference.scores,fired:inference.fired};
 }
 // MP4A: bounded reaction deltas, never permissions or option selection.
 // Inputs are the two independent fuzzy profiles at the huddle opening.
 function huddleReaction(requester,partner){
  const a=requester?.scores,b=partner?.scores;
  const valid=(v,keys)=>v&&keys.every(k=>Number.isFinite(v[k])&&v[k]>=0&&v[k]<=100);
  if(!valid(a,['assertiveness','protectiveness','flexibility','cooperation'])||
     !valid(b,['flexibility','improvisation','caution']))return null;
  const limit=(n,lo,hi)=>Math.min(hi,Math.max(lo,Math.round(n)));
  return {v:1,
   keep:{requester:-limit(2+(a.assertiveness-50)/35+(a.protectiveness-50)/30,1,5),partner:0},
   revise:{requester:limit(2+(a.cooperation-50)/30+(a.flexibility-50)/40,1,4),partner:-limit(1+(50-b.flexibility)/30,0,3)},
   open:{requester:limit(3+(a.flexibility-50)/35,1,5),partner:-limit(2+(50-b.improvisation)/35+(b.caution-50)/50,0,4)}};
 }
 // MP4B: priority for an existing legal objective/counterproposal.
 // Evidence is supplied by the room; this function cannot create moves.
 // Bounded continuous components express what matters to the performer,
 // not whether the performer is allowed to execute the action.
 function huddlePriority(profile,facts){
  const s=profile?.scores;
  if(!s||!facts||!['assertiveness','protectiveness','ambition','caution','mentorship','flexibility'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=100))return null;
  const flag=k=>facts[k]===true?1:0;
  const components={
   initiative: (s.assertiveness-50)/12,
   safety:flag('safer')*(2+s.caution/20)+flag('lessTaxing')*s.caution/35,
   visibility:flag('higherImpact')*(s.ambition/22+s.protectiveness/30),
   craft:flag('familiar')*(1+s.flexibility/30),
   finish:flag('supportsFinish')*(3+s.protectiveness/30),
   guidance:flag('developingPartner')*flag('simpler')*s.mentorship/22,
   compromise:flag('noAlternative')*(-2+s.flexibility/35)
  };
  // Select a concrete, truthful explanation from evidence, not personality
  // adjectives or a claim about an unobserved move.
  const reason=Object.entries(components).filter(([k,v])=>k!=='initiative'&&k!=='compromise'&&v>0)
   .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||'pacing';
  return {score:Object.values(components).reduce((a,b)=>a+b,0),reason};
 }
 // MP5A: explicitly separate proposal evidence from baseline worker values.
 // Ordinal/relative game design proxies, not injury probabilities or
 // predictions of live crowd reactions. Unknown axes remain unknown.
 function proposalValues(evidence){
  if(evidence?.v!==1||evidence.eligible!==true)return null;
  const from=evidence.original,to=evidence.proposed;
  if(!from||!to||typeof from.action!=='string'||typeof to.action!=='string')return null;
  const compatible=to.compatible===true&&to.legal===true&&to.permitted===true;
  if(!compatible||from.legal!==true||from.permitted!==true||from.compatible!==true)return null;
  const values={
   proposalRisk:typeof to.risk==='boolean'?(to.risk?75:20):null,
   proposalFairness:null,
   sequenceDifficulty:null,
   structureCompatibility:100,
   creativeBenefit:Number.isFinite(from.crowd)&&Number.isFinite(to.crowd)?K.scale(to.crowd-from.crowd,-5,5):null
  };
  return {v:1,values,unknown:{
   proposalFairness:'A single same-owner substitution does not establish a fair distribution of credit or burden.',
   sequenceDifficulty:'No ordered sequence or transition contract has been proposed.'
  },comparison:{
   riskFlagChanged:typeof from.risk==='boolean'&&typeof to.risk==='boolean'?from.risk!==to.risk:null,
   costDelta:Number.isFinite(from.cost)&&Number.isFinite(to.cost)?to.cost-from.cost:null,
   crowdDelta:Number.isFinite(from.crowd)&&Number.isFinite(to.crowd)?to.crowd-from.crowd:null,
   finishSupportChanged:typeof from.supportsFinish==='boolean'&&typeof to.supportsFinish==='boolean'?Number(to.supportsFinish)-Number(from.supportsFinish):null
  }};
 }
 // MP5C: relative allocation of planned contributions, not objective
 // fairness or entitlement. Compare the current layout, never 50/50.
 // Negative crowd values still represent authored crowd reaction.
 function proposalAllocation(evidence,side){
  assertSide(side);
  if(!proposalValues(evidence)||!['w','f'].includes(evidence.owner)||!Array.isArray(evidence.allocation))return null;
  const board=evidence.allocation,selected=board.filter(b=>b.objective===evidence.objective);
  if(selected.length!==1||selected[0].owner!==evidence.owner||selected[0].action!==evidence.original.action||
     selected[0].crowd!==evidence.original.crowd||selected[0].cost!==evidence.original.cost)return null;
  const complete=board.length===4&&new Set(board.map(b=>b.objective)).size===4&&board.every(b=>['w','f'].includes(b.owner)&&typeof b.action==='string'&&Number.isFinite(b.crowd)&&Number.isFinite(b.cost))&&['w','f'].every(s=>board.some(b=>b.owner===s))&&Number.isFinite(evidence.proposed.crowd)&&Number.isFinite(evidence.proposed.cost);
  if(!complete)return {v:1,score:null,reason:'incomplete_allocation'};
  const sum=(list,s)=>list.filter(b=>b.owner===s).reduce((t,b)=>({calls:t.calls+1,visibility:t.visibility+Math.abs(b.crowd),effort:t.effort+Math.max(0,b.cost)}),{calls:0,visibility:0,effort:0});
  const after=board.map(b=>b.objective===evidence.objective?{...b,action:evidence.proposed.action,crowd:evidence.proposed.crowd,cost:evidence.proposed.cost}:b);
  const before={w:sum(board,'w'),f:sum(board,'f')},proposed={w:sum(after,'w'),f:sum(after,'f')};
  const total=(x,k)=>x.w[k]+x.f[k];
  const oldVis=total(before,'visibility'),newVis=total(proposed,'visibility'),oldEffort=total(before,'effort');
  if(!oldVis||!newVis||!oldEffort)return {v:1,score:null,reason:'zero_denominator',before,proposed};
  const visibilityDelta=proposed[side].visibility/newVis-before[side].visibility/oldVis;
  // Only own absolute authored performer effort changes; the partner's
  // relative share of cost is not a change in their actual workload.
  const effortDelta=(proposed[side].effort-before[side].effort)/oldEffort;
  const net=visibilityDelta-effortDelta;
  return {v:1,score:K.scale(net,-.5,.5),before,proposed,visibilityDelta,effortDelta,
   tradeoff:visibilityDelta<0&&effortDelta<0?'less_visibility_less_effort':
    visibilityDelta>0&&effortDelta>0?'more_visibility_more_effort':
    visibilityDelta<=0&&effortDelta>=0&&(visibilityDelta<0||effortDelta>0)?'potential_concession':
    visibilityDelta>=0&&effortDelta<=0&&(visibilityDelta>0||effortDelta<0)?'potential_gain':'unchanged'};
 }
 // Historical changes are evidence of recorded requests, NOT reciprocal
 // debts or proof that either party conceded. After-bell angles excluded.
 function requestHistory(snapshot,side){
  assertSide(side);
  const p=snapshot?.participants?.[side],partner=snapshot?.participants?.[sideOther(side)];
  if(!p?.id||!partner?.id||!Array.isArray(p.relationship?.talks))return null;
  const tally=id=>{
   const records=p.relationship.talks.filter(t=>t.issue!=='after'&&t.requestedBy===id&&typeof t.original==='string'&&typeof t.final==='string');
   return {recorded:records.length,changed:records.filter(t=>t.original!==t.final).length,
    changedDelivered:records.filter(t=>t.original!==t.final&&['achieved','adapted'].includes(t.delivered)).length};
  };
  return {v:1,own:tally(p.id),partner:tally(partner.id)};
 }
 // MP5D: relative difficulty of an explicitly ordered fragment. The
 // existing engine owns actual execution and all live physical gates.
 function sequenceDifficulty(sequence){
  if(sequence?.v!==1||sequence.eligible!==true||sequence.scope!=='conditional_fragment'||!Array.isArray(sequence.steps)||sequence.steps.length<2||sequence.steps.length>6)return null;
  const steps=sequence.steps;
  if(steps.some(s=>!s||!Number.isFinite(s.cost)||!['w','f'].includes(s.performer)||!s.entry||!s.exit||!Array.isArray(s.guards)))return null;
  const effort=steps.reduce((n,s)=>n+Math.max(0,s.cost),0);
  const changes=steps.filter(s=>s.entry.position!==s.exit.position).length;
  const reversals=steps.filter(s=>s.entry.control!==s.exit.control).length;
  const guarded=steps.filter(s=>s.guards.includes('live_grip')||s.guards.includes('live_locations')).length;
  const components={length:(steps.length-1)*8,effort:effort*3,positionChanges:changes*5,controlChanges:reversals*6,conditionalSetups:guarded*8};
  const score=stat(Object.values(components).reduce((a,b)=>a+b,0));
  return {v:1,score,components,effortBy:{w:steps.filter(s=>s.performer==='w').reduce((n,s)=>n+Math.max(0,s.cost),0),f:steps.filter(s=>s.performer==='f').reduce((n,s)=>n+Math.max(0,s.cost),0)},execution:sequence.execution};
 }
 // MP5B: the proposal model consumes the already inferred behavioural
 // tendencies, not a second set of raw wrestler personality statistics.
 // Scores are independent degrees of inclination, NOT probabilities.
 const proposalAxes=Object.freeze(Object.fromEntries(['Cooperation','Caution','Ambition','Protectiveness','Flexibility','Assertiveness'].map(k=>['tendency'+k,Object.freeze([25,50,80])])));
 const crossed=(output,a,b,table,weight)=>['low','medium','high'].flatMap((g,i)=>['low','medium','high'].map((h,j)=>rule(output+'_'+a+'_'+g+'_'+b+'_'+h,output,table[i][j],weight,a+'.'+g,b+'.'+h)));
 const proposalModel=createModel({curves:proposalAxes,outputs:['acceptance','reservations','counterproposal'],rules:[
  ...family('acceptance','proposalRisk',[85,55,20],2),
  ...family('acceptance','creativeBenefit',[30,55,85],1),
  ...family('acceptance','tendencyCooperation',[25,55,85],1),
  ...family('acceptance','tendencyFlexibility',[30,55,80],1),
  ...crossed('acceptance','proposalRisk','tendencyCaution',[[85,85,85],[70,55,35],[45,25,5]],2),
  ...crossed('acceptance','creativeBenefit','tendencyAmbition',[[45,30,15],[55,55,55],[70,85,95]],1),
  rule('acceptance_familiar','acceptance',85,1,'change.actorFamiliar'),
  rule('acceptance_finish_gain','acceptance',90,2,'change.finishGain'),
  rule('acceptance_finish_loss','acceptance',15,2,'change.finishLoss'),
  ...family('reservations','proposalRisk',[15,50,90],3),
  ...crossed('reservations','proposalRisk','tendencyCaution',[[15,15,15],[30,55,75],[65,85,100]],3),
  ...family('reservations','creativeBenefit',[75,50,25],1),
  rule('reservations_cost_increase','reservations',75,1,'change.costIncrease'),
  rule('reservations_cost_reduction','reservations',20,1,'change.costReduction'),
  rule('reservations_finish_loss','reservations',95,2,'change.finishLoss'),
  rule('reservations_finish_gain','reservations',15,1,'change.finishGain'),
  ...family('counterproposal','proposalRisk',[15,50,85],2),
  ...family('counterproposal','creativeBenefit',[85,45,15],1),
  ...family('counterproposal','tendencyAssertiveness',[15,50,85],1),
  ...crossed('counterproposal','proposalRisk','tendencyCaution',[[15,15,15],[30,55,75],[60,80,95]],2),
  ...crossed('counterproposal','creativeBenefit','tendencyAmbition',[[55,75,95],[45,45,45],[20,15,10]],1),
  rule('counterproposal_finish_loss','counterproposal',95,2,'change.finishLoss'),
  rule('counterproposal_protect_finish','counterproposal',100,2,'change.finishLoss','tendencyProtectiveness.high'),
  rule('counterproposal_finish_gain','counterproposal',15,1,'change.finishGain'),
  // The scoped allocation score is neutral at no relative change.
  // Do not fire rules for incomplete evidence or a neutral baseline.
  rule('acceptance_allocation_loss','acceptance',25,1.5,'proposalFairness.low'),
  rule('acceptance_allocation_gain','acceptance',85,1.5,'proposalFairness.high'),
  rule('reservations_allocation_loss','reservations',85,1.5,'proposalFairness.low'),
  rule('reservations_allocation_gain','reservations',20,1.5,'proposalFairness.high'),
  rule('counterproposal_allocation_loss','counterproposal',85,1.5,'proposalFairness.low'),
  rule('counterproposal_protect_allocation','counterproposal',95,2,'proposalFairness.low','tendencyProtectiveness.high'),
  rule('counterproposal_allocation_gain','counterproposal',15,1.5,'proposalFairness.high'),
  ...family('acceptance','sequenceDifficulty',[85,55,20],1.5),
  ...crossed('reservations','sequenceDifficulty','tendencyCaution',[[15,15,15],[35,50,65],[65,85,95]],1.5),
  ...crossed('counterproposal','sequenceDifficulty','tendencyFlexibility',[[20,15,10],[65,45,30],[95,75,55]],1.5)
 ]});
 function inferProposal(profile,evidence,sequence=null){
  const assessed=proposalValues(evidence),o=profile?.observation;
  if(!assessed||!o||o.cid!==evidence.cid||!['w','f'].includes(o.side)||
     (o.actorId!==evidence.actorId&&o.actorId!==evidence.partnerId)||
     o.opponentId!==(o.actorId===evidence.actorId?evidence.partnerId:evidence.actorId))return null;
  // Do not manufacture a proposal opinion from personality alone.
  if(assessed.values.proposalRisk===null&&assessed.values.creativeBenefit===null)return null;
  const values={...assessed.values};
  let difficulty=null;
  if(sequence!==null){
   if(sequence.cid!==evidence.cid||sequence.objective!==evidence.objective||sequence.action!==evidence.proposed.action||
      sequence.owner!==evidence.owner||sequence.actorId!==evidence.actorId||sequence.partnerId!==evidence.partnerId||
      sequence.bookedResult!==evidence.bookedResult||sequence.finishRoute!==evidence.finishRoute)return null;
   difficulty=sequenceDifficulty(sequence);
   if(!difficulty)return null;
   values.sequenceDifficulty=difficulty.score;
  }
  const allocation=proposalAllocation(evidence,o.side);
  if(allocation&&Number.isFinite(allocation.score))values.proposalFairness=allocation.score;
  for(const axis of Object.keys(proposalAxes)){
   const key=axis.slice(8),out=key[0].toLowerCase()+key.slice(1);
   values[axis]=stat(profile.scores?.[out]);
  }
  const comparison=assessed.comparison,cues={};
  const actor=o.actorId===evidence.actorId;
  if(actor&&evidence.proposed.familiar===true&&evidence.original.familiar===false)cues['change.actorFamiliar']=1;
  // Graph cost is performer effort, not evidence of the recipient's pain.
  if(actor&&comparison.costDelta>0)cues['change.costIncrease']=1;
  if(actor&&comparison.costDelta<0)cues['change.costReduction']=1;
  if(comparison.finishSupportChanged===1)cues['change.finishGain']=1;
  if(comparison.finishSupportChanged===-1)cues['change.finishLoss']=1;
  const result=proposalModel.evaluate(values,cues);
  return {v:1,cid:evidence.cid,objective:evidence.objective,action:evidence.proposed.action,
   side:o.side,actorId:o.actorId,role:actor?'performer':'partner',values,cues,
   scores:result.scores,fired:result.fired,...(allocation?{allocation}:{}),...(difficulty?{difficulty}:{})};
 }
 // Re-read eligibility from the room, rather than trusting a stale card.
 function evaluateProposal(snapshot,room,side,objective,action,sequence=null){
  assertSide(side);
  const evidence=root.OfficeRoom.proposalEvidence(room,objective,action);
  if(!evidence.eligible)return {v:1,eligible:false,reason:evidence.reason,assessment:null};
  const fragment=sequence===null?null:root.OfficeRoom.sequenceEvidence(room,objective,action,sequence);
  if(fragment&&!fragment.eligible)return {v:1,eligible:false,reason:fragment.reason,assessment:null,sequence:fragment};
  const assessment=inferProposal(behaviour(snapshot,room,side),evidence,fragment);
  return {v:1,eligible:true,evidence,assessment,...(fragment?{sequence:fragment}:{}),...(assessment?{requestHistory:requestHistory(snapshot,side)}:{})};
 }
 // MP5E: interpret independent inclinations, not probabilities.
 // Provisional thresholds based on the MP5B shadow distribution.
 // This is a response to a specific eligible alternative, not consent
 // to its execution or permission to change the contract.
 function proposalReply(scores,role){
  if(!['requester','partner'].includes(role)||!scores||!['acceptance','reservations','counterproposal'].every(k=>Number.isFinite(scores[k])&&scores[k]>=0&&scores[k]<=100))return null;
  const {acceptance:a,reservations:r,counterproposal:c}=scores;
  const stance=c>=55&&c>=a-5&&r>=40?'counter':r>=35||a<65||c>=45?'reserved':'accept';
  const mood=stance==='accept'?(role==='requester'?(a>=80?4:3):(a>=80?2:1)):
   stance==='reserved'?(role==='requester'?(a>=65?1:0):(r>=55?-2:-1)):
   role==='requester'?(r>=65?-3:-2):(r>=65?-4:-3);
  return {stance,mood};
 }
 function huddleProposal(snapshot,room,objective,action,requester){
  assertSide(requester);
  const evidence=root.OfficeRoom.proposalEvidence(room,objective,action);
  if(!evidence.eligible||evidence.original.action===action||evidence.owner!==requester)return null;
  const by={};
  for(const side of ['w','f']){
   const result=inferProposal(behaviour(snapshot,room,side),evidence);
   if(!result)return null;
   const scores={...result.scores};
   const reply=proposalReply(scores,side===requester?'requester':'partner');
   if(!reply)return null;
   by[side]={scores,...reply};
  }
  return {v:1,objective,action,requester,by};
 }
 // Saved responses use their frozen inputs, not a newly inferred profile.
 function readHuddleProposal(t){
  const p=t?.proposalResponse;
  if(p?.v!==1||p.objective!==t.objective||p.action!==t.alternative?.action||p.requester!==t.by||!['w','f'].includes(t.by))return null;
  for(const side of ['w','f']){
   const row=p.by?.[side],r=proposalReply(row?.scores,side===t.by?'requester':'partner');
   if(!r||r.stance!==row.stance||r.mood!==row.mood)return null;
  }
  return p;
 }
 root.OfficePlanningFuzzy=Object.freeze({version:1,workerCurves,planningCurves,curves,workerInputs:K.workerInputs,createModel,capture,observe,behaviour,behaviourModel,huddleReaction,huddlePriority,proposalValues,proposalAxes,proposalModel,inferProposal,evaluateProposal,proposalAllocation,requestHistory,sequenceDifficulty,proposalReply,huddleProposal,readHuddleProposal});
})(typeof window!=='undefined'?window:globalThis);
