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
 root.OfficePlanningFuzzy=Object.freeze({version:1,workerCurves,planningCurves,curves,workerInputs:K.workerInputs,createModel,capture,observe,behaviour,behaviourModel,huddleReaction});
})(typeof window!=='undefined'?window:globalThis);
