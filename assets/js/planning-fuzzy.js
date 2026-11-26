/* THE OFFICE — MP1C: planning domain membership and evidence.
   Reuse the shared Sugeno kernel and canonical worker axes. This module
   is not loaded by the live room yet; no decisions or saves change. */
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
  return {id,opponentId:rid,style:str(worker.style),identity:identity?Object.fromEntries(['source','delivery','motivation','vulnerability','trigger','tactic','boundary','underPressure'].map(k=>[k,str(identity[k])])):null,
   values:{...K.workerInputs(worker),fatigue:stat(worker.fatigue),safetyAbility:stat(worker.safe),ringAbility:stat(worker.ring),morale:stat(worker.morale),professionalTrust:null},
   injury:finite(worker.injury),age:finite(worker.age),
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
 root.OfficePlanningFuzzy=Object.freeze({version:1,workerCurves,planningCurves,curves,workerInputs:K.workerInputs,createModel,capture,observe});
})(typeof window!=='undefined'?window:globalThis);
