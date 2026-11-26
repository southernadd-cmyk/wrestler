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
     legacy:m.legacy===true,
     // Only the public claimant, not the subject of the promo, owns this
     // evidence. In the existing ledger the promise/commit speaker is L.w.
     ...(m.legacy!==true&&Number.isFinite(m.abs)&&Number.isFinite(room.contract?.eventAbs)&&m.abs<room.contract.eventAbs&&actor==='w'?(()=>{
      const p=m.promise,c=m.commit;
      const source=p?.type==='counter'&&p.sure!==true&&typeof p.kept==='boolean'?{verdict:p.kept?'kept':'broken',families:p.families}:
       c?.kind==='counter'&&['kept','broken'].includes(c.verdict)?c:null;
      return source?{publicCounter:{verdict:source.verdict,families:rows(source.families).filter(x=>typeof x==='string').slice(0,8)}}:{};
     })():{}),
     ...(m.legacy!==true&&Array.isArray(m.sequenceDelivery)?{sequenceDelivery:m.sequenceDelivery.slice(0,4).map(x=>({
      v:x.v,status:x.status,objective:str(x.objective),plannedCount:rows(x.planned).length,
      witnessedCount:rows(x.witnessed).length,attempts:finite(x.attempts),interruptions:finite(x.interruptions),
      sharedExchange:new Set(rows(x.witnessed).map(e=>e.performer)).size===2,
      protectedExit:x.protectedExit===true
     }))}:{})};
    meetings.set(m.cid,event);
   }
   for(const t of rows(ledger.talks)){
    if(!str(t?.cid)||!meetings.has(t.cid))continue;
    talks.set(t.cid,{cid:t.cid,requestedBy:t.by==='w'?ledger.w:t.by==='f'?ledger.f:null,issue:str(t.issue),slot:str(t.slot),original:str(t.original),final:str(t.final),reply:str(t.reply),delivered:str(t.delivered)});
   }
  }
  const professional=Number.isFinite(room.contract?.eventAbs)?
   root.OfficeMemory?.professionalContext?.(career,id,rid,room.contract.eventAbs,room.cid):null;
  const identity=root.OfficePromoIdentity?.wrestler?.(worker);
  // Existing career ambitions are read directly, never initialized here.
  const ambition=career?.ambitions?.w?.[id];
  const goal=ambition&&['title','push','money','body','rivalry','respect','stage','mentor'].includes(ambition.kind)&&(!Number.isFinite(ambition.since)||!Number.isFinite(room.contract?.eventAbs)||ambition.since<=room.contract.eventAbs)?{kind:ambition.kind,since:finite(ambition.since),satisfaction:stat(ambition.sat)}:null;
  return {id,opponentId:rid,style:str(worker.style),tier:str(worker.tier),identity:identity?Object.fromEntries(['source','delivery','motivation','vulnerability','trigger','tactic','boundary','underPressure'].map(k=>[k,str(identity[k])])):null,
   values:{...K.workerInputs(worker),fatigue:stat(worker.fatigue),safetyAbility:stat(worker.safe),ringAbility:stat(worker.ring),morale:stat(worker.morale),professionalTrust:stat(professional?.score)},
   injury:finite(worker.injury),age:finite(worker.age),careerGoal:goal,
   relationship:{regard,...(professional?{professional}:{}),sharedBond:finite(pair?.score),betrayed:typeof pair?.betrayed==='boolean'?pair.betrayed:null,
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
  ...family('cooperation','professionalTrust',[25,55,85],1),
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
  rule('ambition_public_counter_unfulfilled','ambition',80,1,'history.publicCounterBroken'),
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
  rule('improvisation_prior_adaptation','improvisation',95,1,'history.requestedAdaptation'),
  rule('improvisation_public_counter_delivered','improvisation',85,1,'history.publicCounterKept')
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
  // Shared experience, not a personal grievance: both participants saw
  // the same exchange. Weight recent meetings more heavily; unknown
  // delivery and protected exits do not create adverse evidence.
  const recent=rows(p.relationship?.meetings).filter(m=>!m.legacy&&Array.isArray(m.sequenceDelivery))
   .sort((a,b)=>(b.abs??0)-(a.abs??0)).slice(0,4);
  let total=0,exact=0,adapted=0,incomplete=0;
  recent.forEach((m,i)=>{
   for(const d of m.sequenceDelivery){
    if(d.v!==1||d.plannedCount<2||d.plannedCount>4||d.witnessedCount<0||d.witnessedCount>d.plannedCount)continue;
    const weight=1/(i+1);
    if(d.status==='completed'&&d.witnessedCount===d.plannedCount){total+=weight;exact+=weight;}
    else if(d.status==='adapted'&&d.witnessedCount===d.plannedCount){total+=weight;adapted+=weight;}
    else if(d.status==='missed'&&!d.protectedExit&&d.witnessedCount>0&&d.witnessedCount<d.plannedCount&&d.interruptions>0){total+=weight;incomplete+=weight;}
   }
  });
  if(total){
   if(exact)cues['history.sequenceDelivered']=exact/total;
   if(adapted)cues['history.sequenceAdapted']=adapted/total;
   if(incomplete)cues['history.sequenceInterrupted']=incomplete/total;
  }
  // The last settled technical claim is contextual evidence, not a debt
  // or a promise to repeat it. Never infer from unchecked public rhetoric.
  const publicCounter=rows(p.relationship?.meetings).filter(m=>!m.legacy&&m.publicCounter)
   .sort((a,b)=>b.abs-a.abs)[0]?.publicCounter;
  if(publicCounter?.verdict==='kept')cues['history.publicCounterKept']=1;
  if(publicCounter?.verdict==='broken')cues['history.publicCounterBroken']=1;
  const inference=behaviourModel.evaluate(observation.values,cues);
  return {v:1,observation,cues,scores:inference.scores,fired:inference.fired,...(publicCounter?{publicCounter:{...publicCounter,families:publicCounter.families.slice()}}:{})};
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
   publicClaim:flag('publicCounterMatch')*(profile.publicCounter?.verdict==='broken'?1+s.ambition/35:profile.publicCounter?.verdict==='kept'?1:0),
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
  ...crossed('counterproposal','sequenceDifficulty','tendencyFlexibility',[[20,15,10],[65,45,30],[95,75,55]],1.5),
  rule('acceptance_shared_sequence_delivery','acceptance',90,1.5,'history.sequenceDelivered'),
  rule('acceptance_shared_sequence_adaptation','acceptance',85,1.5,'history.sequenceAdapted'),
  rule('reservations_shared_sequence_delivery','reservations',20,1,'history.sequenceDelivered'),
  rule('reservations_shared_sequence_adaptation','reservations',25,1,'history.sequenceAdapted'),
  rule('reservations_shared_sequence_interruption','reservations',80,1,'history.sequenceInterrupted'),
  rule('counterproposal_shared_sequence_interruption','counterproposal',70,1,'history.sequenceInterrupted')
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
  // Delivery history informs only future sequence proposals, not single
  // moves, medical gates, old consent or the negotiated finish.
  if(sequence!==null)for(const key of ['history.sequenceDelivered','history.sequenceAdapted','history.sequenceInterrupted'])
   if(Number.isFinite(profile.cues?.[key]))cues[key]=profile.cues[key];
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
 // MP7B.1: decide how much complexity the pair wants, independently
 // of their assessment of a particular candidate. Outputs are soft
 // preferences, not permission to attempt a move.
 const sequencePreferenceModel=createModel({curves:{
  pairAbility:[35,65,85],pairCaution:[30,55,80],pairFlexibility:[30,55,80],pairCooperation:[30,55,80],planExchange:[20,50,80]
 },outputs:['complexity','exchange'],rules:[
  ...family('complexity','planExchange',[15,55,95],4),
  ...family('complexity','pairAbility',[10,55,90],2),
  ...family('complexity','pairCaution',[85,55,10],2),
  ...family('complexity','pairFlexibility',[15,55,90],1),
  ...family('exchange','planExchange',[10,55,95],4),
  ...family('exchange','pairAbility',[10,55,90],2),
  ...family('exchange','pairCooperation',[10,55,95],2),
  ...family('exchange','pairCaution',[85,55,15],1)
 ]});
 function sequencePreference(snapshot,room){
  const w=behaviour(snapshot,room,'w'),f=behaviour(snapshot,room,'f');
  const pair=(k,fn)=>fn(w.scores[k],f.scores[k]);
  const ability=[w.observation.values.ringAbility,f.observation.values.ringAbility];
  const planExchange={safe:10,brawl:35,spots:70,story:80,technical:95}[room.game]??50;
  const values={pairAbility:ability.every(Number.isFinite)?Math.min(...ability):null,
   pairCaution:pair('caution',Math.max),pairFlexibility:pair('flexibility',Math.min),pairCooperation:pair('cooperation',Math.min),planExchange};
  const result=sequencePreferenceModel.evaluate(values,{});
  const cautious=room.game==='safe'||['w','f'].some(side=>snapshot.participants[side]?.injury>0||snapshot.participants[side]?.values?.fatigue>=80);
  const target=cautious?2:Math.min(4,Math.max(2,2+2*(result.scores.complexity/100)));
  return {v:1,values,scores:result.scores,target,cautious};
 }
 // MP13C: feasibility is separate from willingness and permission.
 // Scores are editorial priors, not calibrated probabilities.
 const sequenceFeasibilityModel=createModel({curves:{
  entryAccess:[25,55,85],runway:[20,50,80],physicalReadiness:[25,55,85]
 },outputs:['feasibility'],rules:[
  ...family('feasibility','entryAccess',[10,55,95],4),
  ...family('feasibility','runway',[10,55,95],3),
  ...family('feasibility','physicalReadiness',[10,55,95],3)
 ]});
 function continuationGrip(steps){
  const graph=root.OfficeMatch?.GRAPH;if(!graph||!steps?.length)return {possible:false,index:0};
  let grip=null;
  for(let i=0;i<steps.length;i++){
   const step=steps[i],n=graph.A[step.action],need=graph.PHYSICAL_GRIP_MOVES[step.action],side=step.entry?.control;
   if(!n)return {possible:false,index:i};
   if(need){
    if(i===0)grip={type:need,side,age:0};
    if(!grip||grip.type!==need||grip.side!==side||grip.age>20)return {possible:false,index:i,required:need,available:grip?.type||null};
   }
   if(n.reverse){grip=null;continue;}
   const type=graph.GRIP_ENTRY[step.action];
   if(type)grip={type,side,age:0};
   else if(grip&&grip.side===side&&['ground-leg','ground-arm','ground-head','ground-back'].includes(grip.type)&&
     n.zone==='mat'&&['mat_hold','target_hold'].includes(step.action)&&grip.age+graph.sequenceMoveSeconds(step.action)<=20)
    grip={...grip,age:grip.age+graph.sequenceMoveSeconds(step.action)};
   else grip=null;
  }
  return {possible:true};
 }
 // Earliest realistic opening: every subsequent move must be eligible
 // by its earliest selection tick, not merely somewhere in the objective.
 function continuationSchedule(steps,seconds){
  const graph=root.OfficeMatch.GRAPH;let offset=0,start=0;
  for(const step of steps){
   start=Math.max(start,Math.max(0,(graph.A[step.action].after||0)*seconds-offset));
   offset+=graph.sequenceMoveSeconds(step.action);
  }
  return {start,duration:offset};
 }
 // MP13F.6: independent planning-only prior, not a prediction of a
 // particular match or an additional hard gate. The previous stamina
 // estimate at the earliest opening ignores uncertainty in prerequisite
 // delivery and ordinary grappling exertion. Sample plausible release
 // times, preserving a distinct cost penalty even when all are marginal.
 function readinessPrior(room,objective,evidence){
  const graph=root.OfficeMatch?.GRAPH,steps=evidence?.steps;
  if(!graph||!objective||!steps?.length)return null;
  const seconds=Math.max(5,room.minutes+(room.fx?.minutes||0))*60;
  const schedule=continuationSchedule(steps,seconds),duration=schedule.duration;
  const from=Math.max(0,objective.window[0]-.04);
  const end=Math.min(objective.window[1]+.08,.91,1-Math.max(45,duration+25)/seconds);
  const prior=room.structure?.objectives?.find(x=>objective.requires.includes(x.id));
  const release=prior?[prior.window[0]+.5*(prior.window[1]-prior.window[0]),prior.window[1],prior.window[1]+.08]:[from,from,from];
  const drain=root.OfficeData?.PLANS?.[room.game]?.drain||1;
  // Conservative baseline includes modest net action expenditure; no
  // assumed manager intervention, special recovery or guaranteed rest.
  const rate={w:.55*drain*(1+(room.w?.fatigue||0)/250)+.25,f:.5*drain+.25};
  const initial={w:Math.max(0,100-(room.w?.fatigue||0)*.7),f:92};
  let required=0,spent={w:0,f:0};
  for(const step of steps){
   const cost=graph.costOf(step.action),side=step.entry?.control||step.performer;
   if(cost>=2.2)required=Math.max(required,16+cost*3.2+spent[side]);
   spent[step.performer]+=Math.max(0,cost);
   for(const k of ['w','f'])spent[k]+=graph.sequenceMoveSeconds(step.action)/10*rate[k];
  }
  const samples=release.map(r=>{
   const start=Math.max(from,r,schedule.start/seconds);
   const window=Math.max(0,end-start);
   const times=[start,start+window*.5];
   return times.map(at=>{
    const energy={w:Math.max(0,initial.w-at*seconds/10*rate.w),f:Math.max(0,initial.f-at*seconds/10*rate.f)};
    let margin=100,elapsed=0;
    for(const step of steps){
     const side=step.entry?.control||step.performer,cost=graph.costOf(step.action);
     if(cost>=2.2)margin=Math.min(margin,energy[side]-(16+cost*3.2));
     energy[step.performer]-=Math.max(0,cost);
     const ticks=graph.sequenceMoveSeconds(step.action)/10;
     for(const k of ['w','f'])energy[k]-=ticks*rate[k];
     elapsed+=ticks*10;
    }
    const usable=start<=end&&at<.91;
    const headroom=Math.max(0,Math.min(100,55+margin*1.5));
    const runway=Math.max(0,Math.min(100,window*seconds/Math.max(20,duration)*40));
    return {at,margin,usable,score:usable?.7*headroom+.3*runway:0};
   });
  }).flat();
  const mean=samples.reduce((n,x)=>n+x.score,0)/samples.length;
  // Keep a cost gradient even if late-bout margins all fall below zero.
  const score=Math.max(0,Math.min(100,.8*mean+.2*Math.max(0,100-required*1.5)));
  return {score,required,samples};
 }
 function sequenceFeasibility(room,objective,evidence){
  const graph=root.OfficeMatch?.GRAPH,steps=evidence?.steps;
  if(!graph||!objective||!steps?.length)return null;
  const seconds=Math.max(5,room.minutes+(room.fx?.minutes||0))*60;
  const duration=steps.reduce((n,x)=>n+graph.sequenceMoveSeconds(x.action),0);
  const end=Math.min(objective.window[1]+.08,.91,1-Math.max(45,duration+25)/seconds);
  const strict=room.planningContinuationVersion===1;
  const schedule=strict?continuationSchedule(steps,seconds):null;
  const start=Math.max(0,objective.window[0]-.04,...(strict?[schedule.start/seconds]:steps.map(x=>graph.A[x.action].after||0)));
  const prior=room.structure?.objectives?.find(x=>objective.requires.includes(x.id));
  // The midpoint is a conservative scheduling estimate, not an assertion
  // that the earlier objective will be delivered by then.
  const expectedStart=Math.max(start,prior?(prior.window[0]+prior.window[1])/2:0);
  const slack=Math.max(0,(end-expectedStart)*seconds);
  const first=steps[0],position=evidence.start.position;
  let physicalReadiness=95;
  if(graph.PHYSICAL_GRIP_MOVES[first.action])physicalReadiness-=60;
  for(let i=1;i<steps.length;i++){
   const need=graph.PHYSICAL_GRIP_MOVES[steps[i].action];
   if(need&&(graph.GRIP_ENTRY[steps[i-1].action]!==need||steps[i-1].performer!==steps[i].performer))physicalReadiness-=28;
  }
  if(position==='top'||position==='outside')physicalReadiness-=18;
  const values={entryAccess:({standing:95,mat:48,corner:24,top:12,outside:12})[position]??10,
   runway:Math.min(100,slack/Math.max(1,duration)*32),physicalReadiness:Math.max(0,physicalReadiness)};
  // Stamina is a planning prior, not a promised live value. Estimate
  // capacity at the earliest sensible opening and penalise expensive
  // chains, especially late in a long bout. Never reject on this estimate.
  if(strict){
   const energy={w:Math.max(0,100-(room.w?.fatigue||0)*.7),f:92};
   const elapsed=Math.max(start,expectedStart)*seconds/10;
   const drain=root.OfficeData?.PLANS?.[room.game]?.drain||1;
   energy.w-=elapsed*.55*drain*(1+(room.w?.fatigue||0)/250);
   energy.f-=elapsed*.5*drain;
   let margin=100;
   for(const step of steps){
    const side=step.entry.control,performer=step.performer,cost=graph.costOf(step.action);
    if(cost>=2.2)margin=Math.min(margin,energy[side]-(16+cost*3.2));
    energy[performer]-=Math.max(0,cost);
    for(const k of ['w','f'])energy[k]-=graph.sequenceMoveSeconds(step.action)/10*.55*drain;
   }
   values.physicalReadiness=Math.max(0,values.physicalReadiness-Math.max(0,25-margin)*1.2);
   values.runway=Math.min(values.runway,Math.max(0,100*(end-start)/Math.max(.04,end-(objective.window[0]-.04))));
  }
  const scores=sequenceFeasibilityModel.evaluate(values,{}).scores;
  const readiness=room.planningReadinessVersion===1&&room.structure?.id!=='chickenshit_heel'?readinessPrior(room,objective,evidence):null;
  return {v:1,values,scores,duration,slack,...(readiness?{readiness}:{}),possible:end>=start&&(!strict||continuationGrip(steps).possible),...(strict?{earliestStart:start,latestStart:end}: {})};
 }
 root.OfficePlanningFuzzy=Object.freeze({readinessPrior,continuationGrip,continuationSchedule,sequenceFeasibility,sequenceFeasibilityModel,sequencePreference,sequencePreferenceModel,version:1,workerCurves,planningCurves,curves,workerInputs:K.workerInputs,createModel,capture,observe,behaviour,behaviourModel,huddleReaction,huddlePriority,proposalValues,proposalAxes,proposalModel,inferProposal,evaluateProposal,proposalAllocation,requestHistory,sequenceDifficulty,proposalReply,huddleProposal,readHuddleProposal});
})(typeof window!=='undefined'?window:globalThis);
