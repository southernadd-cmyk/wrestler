'use strict';
// Audit-only instrumentation. No extra graph pool construction, RNG calls,
// move selection, mutation of the match, or speculative counterfactual moves.
const assert=require('node:assert/strict');
const copy=x=>JSON.parse(JSON.stringify(x));
const inc=(o,k)=>o[k]=(o[k]||0)+1;
const count=(xs,fn)=>xs.reduce((o,x)=>(inc(o,fn(x)),o),{});
const eqState=(a,b)=>a&&b&&['control','position','down'].every(k=>a[k]===b[k]);
function trace(root,key){
 const G=root.OfficeMatch.GRAPH,D=root.OfficeSheets.DIRECTOR,A=G.A;
 let tracked=null,phase=null,offer=null;
 const undo=[],attempts=new Map(),records=[],openings=new Map(),dependencyWitnesses=[],recoveryOffers=[],alternativeReadinessOffers=[];
 const rows=m=>m.structureDirector?.sequences||[];
 const running=m=>rows(m).filter(r=>r.status==='running'&&r.progress>0);
 const id=r=>r.objective+'|'+r.attempts;
 const objective=(m,r)=>m.sheet.structurePlan.objectives.find(o=>o.id===r.objective);
 // Opening analysis uses only actual selection opportunities. Evaluate
 // signed alternatives independently; this is diagnostic, not an offer.
 function openingRecord(m,r){
  if(!openings.has(r.objective)){
   const o=objective(m,r);
   openings.set(r.objective,{key,structure:m.structureDirector.id,objective:r.objective,
    actions:o.sequence.actions.slice(),alternatives:o.sequence.openings?.length||0,window:o.window.slice(),requires:o.requires.slice(),
    schedules:[o.sequence,...(o.sequence.openings||[]).map(x=>({start:x.start,actions:[x.action,...o.sequence.actions.slice(1)]}))].map((seq,i)=>{
     // Audit-only copy of the existing sequenceWindow/openingReadiness
     // timing bounds. No runtime helper or experimental flag required.
     let elapsed=0,earliest=Math.max(0,(o.window[0]-.04)*m.len);
     for(const id of seq.actions){
      earliest=Math.max(earliest,(A[id].after||0)*m.len-elapsed);
      elapsed+=G.sequenceMoveSeconds(id);
     }
     const latest=Math.min((o.window[1]+.08)*m.len,.91*m.len-1,m.len-Math.max(45,elapsed+25));
     return {variant:i,id:seq.actions[0],start:copy(seq.start),earliest,latest,duration:elapsed};
    }),
    ticks:[],natural:[],final:null});
  }
  return openings.get(r.objective);
 }
 function openingCandidates(m,r,pre,landed=null){
  const o=objective(m,r),seq=o.sequence,g=m.graph,frac=m.t/Math.max(1,m.len);
  const shared=[];
  if(o.requires.some(id=>m.structureDirector.objectives.some(s=>s.id===id&&s.status==='pending')))shared.push('prerequisite_pending');
  if(frac<o.window[0]-.04)shared.push('before_window');
  if(frac>o.window[1]+.08||frac>=.91)shared.push('after_window');
  if(m.outcome!=='booked'||root.OfficeMatch.bigSpotPriority(m)||m.workingHurt||m.shortened)shared.push('safety_or_manager_request');
  return [{start:seq.start,action:seq.actions[0],alternative:false},...(seq.openings||[]).map(x=>({...x,alternative:true}))].map(c=>{
   const ids=[c.action,...seq.actions.slice(1)],guards=shared.slice();
   const duration=ids.reduce((n,id)=>n+(m.o.sequenceTimingVersion===1?G.sequenceMoveSeconds(id):20),0);
   if(m.len-m.t<Math.max(45,duration+25))guards.push('finish_runway');
   if(pre.control!==c.start.control)guards.push('wrong_control');
   if(pre.position!==c.start.position||pre.down!==c.start.down)guards.push('wrong_position_or_down');
   let entry={...c.start};
   const steps=ids.map(id=>{
    const n=A[id],other=entry.control==='w'?'f':'w',performer=n.reverse?other:entry.control;
    const x={id,action:id,entry:{...entry},performer};
    entry={control:performer,position:n.zone,down:n.down==='d'?(n.reverse?entry.control:other):n.down==='a'?performer:null};
    return x;
   });
   const n=A[c.action],actor=steps[0].performer,worker=actor==='w'?m.w:m.f;
   const stamina=actor==='w'?m.wSt:m.fSt,cost=G.costOf(c.action);
   const limits=m.sheet.limits,note=m.sheet.note?.honour&&!m.sheet.note.waived?m.sheet.note:null;
   if([limits,note].some(l=>l&&(l.banIds?.includes(c.action)||l.ban?.includes(n.family)))||
    n.risk&&(worker.injury>0||m.planId==='safe'||m.sheet.spice<0||m.injury||m.foeHurt))guards.push('first_move_restricted');
   if(cost>=2.2&&stamina<16+cost*3.2)guards.push('first_move_stamina');
   // G.isValid reads live state; never use it with historical pre-state
   // at a landing. Natural observations use post-landing readiness only.
   if(!landed&&eqState(pre,c.start)&&!G.isValid(m,c.action))guards.push('first_move_illegal');
   let energyAudit=null;
   if(!D.openingReadiness(m,steps,!!landed)){
    let at=m.t,early=false,low=false,energy={w:m.wSt,f:m.fSt};
    for(let i=0;i<steps.length;i++){
     const step=steps[i],cost=G.costOf(step.id);
     if(i===0&&landed){at+=10;continue;}
     if(at/Math.max(1,m.len)<(A[step.id].after||0))early=true;
     if(cost>=2.2&&energy[step.entry.control]<16+cost*3.2)low=true;
     D.projectedSequenceEnergy(m,energy,step,cost);
     const ticks=G.sequenceMoveSeconds(step.id)/10;energy.w-=ticks*.5;energy.f-=ticks*.5;at+=ticks*10;
    }
    if(early)guards.push('chain_too_early');
    if(low)guards.push('chain_stamina');
    if(!early&&!low)guards.push('other_readiness');
    // Store detailed energy evidence only at genuine selection ticks
    // which already pass all non-readiness guards. No altered validator.
    if(!landed&&low&&guards.every(g=>['chain_too_early','chain_stamina','other_readiness'].includes(g))){
     const raw={w:m.wSt,f:m.fSt},costOnly={...raw},projected={...raw};
     const round=x=>Math.round(x*1000)/1000;
     let time=m.t;
     const detail=steps.map((step,i)=>{
      const cost=G.costOf(step.id),side=step.entry.control,threshold=cost>=2.2?16+cost*3.2:null;
      const duration=G.sequenceMoveSeconds(step.id);
      // Controller is the live graph's threshold side, while the
      // performer pays the actual move cost (not always the same).
      const x={index:i,id:step.id,side,performer:step.performer,at:time,cost,duration,threshold,
       raw:round(raw[side]),costOnly:round(costOnly[side]),projected:round(projected[side]),
       rawDeficit:threshold===null?0:Math.max(0,threshold-raw[side]),
       costOnlyDeficit:threshold===null?0:Math.max(0,threshold-costOnly[side]),
       deficit:threshold===null?0:Math.max(0,threshold-projected[side])};
      D.projectedSequenceEnergy(m,costOnly,step,cost);D.projectedSequenceEnergy(m,projected,step,cost);
      projected.w-=duration/10*.5;projected.f-=duration/10*.5;time+=duration;
      return x;
     });
     const gripPossible=root.OfficePlanningFuzzy.continuationGrip(steps.map(x=>({...x,action:x.id}))).possible;
     assert.ok(detail.some(x=>x.deficit>0),'stamina guard has projected deficit');
     energyAudit={raw:{w:round(raw.w),f:round(raw.f)},steps:detail,gripPossible,
      type:detail.some(x=>x.rawDeficit>0)?'raw_stamina':detail.some(x=>x.costOnlyDeficit>0)?'chain_move_cost':'routine_projection_only',
      maxDeficit:Math.max(...detail.map(x=>x.deficit)),
      plan:m.planId,mode:m.mode?.type||null,remaining:m.len-m.t};
    }
   }
   return {id:c.action,alternative:c.alternative,guards,...(energyAudit?{energyAudit}:{})};
  });
 }
 function openingTick(m,r,pre,result){
  const v=openingRecord(m,r),candidates=openingCandidates(m,r,pre),last=v.ticks.at(-1);
  if(last?.at===m.t)return;
  v.ticks.push({at:m.t,arc:m.graph.arc,control:pre.control,position:pre.position,down:pre.down,
   stamina:{w:Math.round(m.wSt),f:Math.round(m.fSt)},candidates,
   safety:{outcome:m.outcome,bigSpotPriority:root.OfficeMatch.bigSpotPriority(m),bigSpotRequest:m.bigSpotRequest?{at:m.bigSpotRequest.at,expires:m.bigSpotRequest.expires}:null,
    workingHurt:!!m.workingHurt,shortened:!!m.shortened,injury:m.injury||0,foeHurt:!!m.foeHurt,length:m.len},
   offered:result?.objective===r.objective?result.id:null,handover:!!(result?.objective===r.objective&&result.handover),otherOffer:result&&result.objective!==r.objective?result.objective:null});
 }
 function record(m,r){
  const k=id(r);if(!attempts.has(k)){
   const o=objective(m,r);
   const v={key,structure:m.structureDirector.id,objective:r.objective,attempt:r.attempts,length:o.sequence.actions.length,
    opening:r.evidence[0]?.id,openedAt:r.evidence[0]?.at,progress:r.progress,observations:[],selections:[],changes:[],terminal:null};
   attempts.set(k,v);records.push(v);
  }
  return attempts.get(k);
 }
 function snapshot(m,r,pre=m.story){
  const g=m.graph,o=objective(m,r),last=r.evidence.at(-1),expected=o.sequence.actions[r.progress],n=A[expected];
  const frac=m.t/Math.max(1,m.len),cost=G.costOf(expected),side=pre.control,stamina=side==='w'?m.wSt:m.fSt;
  const grip=g.physical?.grip,need=G.PHYSICAL_GRIP_MOVES[expected];
  const remaining=o.sequence.actions.slice(r.progress).reduce((s,id)=>s+(m.o.sequenceTimingVersion===1?G.sequenceMoveSeconds(id):20),0);
  const guards=[];
  if(!eqState(pre,last.exit))guards.push('position_or_control');
  if((pre.node??g.node)!==last.id)guards.push('graph_node_changed');
  if(g.events.at(-1)?.id!==last.id||g.events.at(-1)?.t!==last.at)guards.push('intervening_event');
  if(m.t-last.at>30)guards.push('continuity_timeout');
  if(frac<o.window[0]-.04||frac>o.window[1]+.08||frac>=.91)guards.push('objective_window');
  if(m.len-m.t<Math.max(45,remaining+25))guards.push('finish_runway');
  if(m.outcome!=='booked'||root.OfficeMatch.bigSpotPriority(m)||m.workingHurt||m.shortened)guards.push('protected_or_manager_request');
  if(need&&(!grip||grip.type!==need||grip.side!==side))guards.push('missing_or_wrong_grip');
  else if(need&&m.t-grip.at>20)guards.push('stale_grip');
  if(cost>=2.2&&stamina<16+cost*3.2)guards.push('stamina');
  if(n.after&&frac<n.after)guards.push('move_too_early');
  if(n.risk&&(m.planId==='safe'||m.sheet.spice<0||m.injury||m.foeHurt))guards.push('risk_restriction');
  const limits=m.sheet.limits,note=m.sheet.note?.honour&&!m.sheet.note.waived?m.sheet.note:null;
  if([limits,note].some(l=>l&&(l.banIds?.includes(expected)||l.ban?.includes(n.family))))guards.push('signed_restriction');
  // isValid is a read-only public predicate; do not call pool, pick, or RNG.
  const legal=G.isValid(m,expected);
  if(!legal&&!guards.length)guards.push('other_live_legality');
  return {at:m.t,progress:r.progress,expected,previous:last.id,arc:g.arc,node:pre.node??g.node,
   control:pre.control,position:pre.position,down:pre.down,grip:grip?{...grip}:null,requiredGrip:need||null,
   legal,guards,stamina:Math.round(stamina),pending:['Aerial','Grapple','Strike','Contact'].map(k=>g['pending'+k]?.id).filter(Boolean)};
 }
 const signatures=new Map();
 function observe(m,r,s){
  const v=record(m,r),k=id(r),signature=JSON.stringify([s.at,s.progress,s.expected,s.node,s.control,s.position,s.down,s.legal,s.guards,s.pending]);
  if(signatures.get(k)!==signature){v.observations.push(s);signatures.set(k,signature);}
  return v;
 }
 function finish(m,r,kind,event=null){
  const v=record(m,r);if(v.terminal)return;
  v.terminal={kind,at:m.t,progress:v.progress,event:event?{id:event.id,t:event.t}:null};
 }
 function wrap(obj,name,fn){
  const original=obj[name];if(typeof original!=='function')return;
  obj[name]=function(...args){return fn.call(this,original,args);};
  undo.push(()=>{obj[name]=original;});
 }
 wrap(D,'sequenceOffer',function(original,args){
  const [m,pre]=args,result=original.apply(this,args);
  if(m===tracked&&phase==='step'&&offer===null){
   // First sequenceOffer inside Graph.step is from its actual validPool.
   // A later apply-time query is not another selection opportunity.
   offer={result:result?copy(result):null};
   for(const r of rows(m))if(r.status==='pending'&&!r.attempts){
    openingTick(m,r,pre,result);
    const v=openingRecord(m,r),tick=v.ticks.at(-1);
    if(tick?.at!==m.t)continue;
    const primary=tick.candidates[0],ready=tick.candidates.slice(1).filter(c=>!c.guards.length);
    // Same actual selection opportunity; primary is legal but blocked
    // by chain readiness or runway, while an alternative is ready.
    if(primary.guards.length&&primary.guards.every(g=>['chain_too_early','chain_stamina','other_readiness','finish_runway'].includes(g))&&ready.length){
     alternativeReadinessOffers.push({key,objective:r.objective,at:m.t,primary:primary.id,guards:primary.guards,
      ready:ready.map(c=>c.id),offered:result?.objective===r.objective?result.id:null});
    }
   }
   for(const r of running(m)){
    const s=snapshot(m,r,pre),v=observe(m,r,s);
    v.selections.push({at:m.t,progress:r.progress,expected:s.expected,offered:result?.objective===r.objective?result.id:null,
     willingness:result?.objective===r.objective?result.willingness:null,legal:s.legal,guards:s.guards});
   }
  }
  return result;
 });
 wrap(D,'sequenceRecoveryPreference',function(original,args){
  const result=original.apply(this,args);
  if(tracked&&phase==='step'&&result){
   const {objective,side,ids,deficit,earliest,latest,boosted}=result;
   recoveryOffers.push({key,at:tracked.t,objective,side,ids,deficit,earliest,latest,boosted,
    stamina:side==='w'?tracked.wSt:tracked.fSt});
  }
  return result;
 });
 wrap(D,'observe',function(original,args){
  const [m,e]=args;
  if(m!==tracked)return original.apply(this,args);
  const focus=D.dependencyFocus(m);
  const preferred=focus&&e&&D.dependencyPreference(m,e.id,e.preControl,focus)>1;
  const prior=preferred?focus.state.evidence.length:0;
  const result=original.apply(this,args);
  if(preferred&&focus.state.evidence.length>prior){
   assert.ok(m.graph.events.includes(e),'dependency evidence is an actual graph landing');
   const fact=focus.state.evidence.at(-1);
   assert.equal(fact.id,e.id);assert.equal(fact.at,e.t);
   dependencyWitnesses.push({key,structure:m.structureDirector.id,objective:focus.objective.id,dependent:focus.next.id,
    id:e.id,at:e.t,completed:focus.state.status!=='pending'});
  }
  return result;
 });
 wrap(D,'observeSequence',function(original,args){
  const [m,e,pre,previous,actualOffer]=args;
  if(m!==tracked)return original.apply(this,args);
  const before=running(m).map(r=>({r,k:id(r),v:record(m,r),expected:objective(m,r).sequence.actions[r.progress],progress:r.progress}));
  const natural=rows(m).filter(r=>r.status==='pending'&&!r.attempts).flatMap(r=>{
   const o=objective(m,r),seq=o.sequence;
   if(![seq.actions[0],...(seq.openings||[]).map(x=>x.action)].includes(e.id))return [];
   return [{r,v:openingRecord(m,r),candidates:openingCandidates(m,r,pre,e.id).filter(x=>x.id===e.id)}];
  });
  const result=original.apply(this,args);
  for(const {r,v,candidates} of natural)v.natural.push({at:e.t,id:e.id,credited:r.attempts>0,candidates});
  for(const x of before){
   const {r,v,expected}=x,n=A[e.id];
   if(r.progress>x.progress){v.progress=r.progress;if(['completed','adapted'].includes(r.status))finish(m,r,r.status,e);}
   else if(r.status!=='running'||r.progress<x.progress){
    const offered=actualOffer?.objective===r.objective?actualOffer.id:null;
    const parent=n?.counterOf||n?.blockOf;
    const kind=parent&&(parent===expected||parent===offered)?'defended_planned':
     e.id===expected||e.id===offered?'expected_landed_not_credited':
     phase==='special'||phase==='nearfall'?'scheduled_spot_or_cover':
     phase==='step'&&v.selections.at(-1)?.at===m.t&&v.selections.at(-1)?.offered?'other_move_after_offer':
     parent?'other_defence':'other_move_without_offer';
    v.terminal={kind,at:m.t,progress:x.progress,event:{id:e.id,t:e.t},phase,offered,pre:{...pre},previous:previous?.id||null};
   }
  }
  for(const r of running(m))record(m,r);
  return result;
 });
 for(const name of ['advance','step','special','nearfall','resolveAerial','resolveGrapple','resolveStrike','resolveContact']){
  wrap(G,name,function(original,args){
   const [m]=args;if(m!==tracked)return original.apply(this,args);
   const oldPhase=phase,oldOffer=offer;phase=name;offer=null;
   const before=running(m).map(r=>({r,v:record(m,r),s:snapshot(m,r)}));
   for(const x of before)observe(m,x.r,x.s);
   try{
    const result=original.apply(this,args);
    for(const {r,v,s} of before){
     const now=m.graph,after=m.story;
     if(!v.terminal&&r.status==='running'&&r.progress===s.progress){
      if(name==='advance'&&(now.arc!==s.arc||now.node!==s.node||after.control!==s.control||after.position!==s.position||after.down!==s.down)){
       v.changes.push({kind:'arc_transition',at:m.t,from:s.arc,to:now.arc,priorGuards:s.guards,priorLegal:s.legal});
      }
      if(name.startsWith('resolve')&&s.pending.length&&result&&!now['pending'+name.slice(7)]){
       v.changes.push({kind:'attempt_resolved_without_progress',at:m.t,phase:name,pending:s.pending,priorGuards:s.guards});
      }
     }
    }
    return result;
   }finally{phase=oldPhase;offer=oldOffer;}
  });
 }
 for(const name of ['advance','finalize'])wrap(D,name,function(original,args){
  const [m]=args;if(m!==tracked)return original.apply(this,args);
  const before=running(m).map(r=>({r,v:observe(m,r,snapshot(m,r)),progress:r.progress}));
  const result=original.apply(this,args);
  for(const {r,v,progress} of before)if(!v.terminal&&(r.status!=='running'||r.progress<progress)){
   v.terminal={kind:r.reason?.includes('follow in time')?'timeout':name==='finalize'?'bell':'window_or_safety_closed',at:m.t,progress,reason:r.reason};
  }
  return result;
 });
 return {track(m){tracked=m;},close(m){
  for(const r of rows(m)){
   const rs=records.filter(v=>v.objective===r.objective);
   assert.equal(rs.length,r.attempts,key+' every actual opened attempt traced');
   for(const v of rs)if(!v.terminal)v.terminal={kind:'unclassified_terminal',at:m.t,progress:v.progress,reason:r.reason};
   if(r.attempts)assert.equal(rs.at(-1).terminal.kind==='completed'||rs.at(-1).terminal.kind==='adapted',['completed','adapted'].includes(r.status),key+' terminal sequence outcome');
   for(const v of rs){v.finalSequenceStatus=r.status;v.protectedExit=!!(m.injury||m.foeHurt||m.workingHurt||m.shortened||m.outcome!=='booked');}
  }
  for(const r of rows(m)){
   const v=openingRecord(m,r);v.final={status:r.status,attempts:r.attempts,reason:r.reason,protected:!!(m.injury||m.foeHurt||m.workingHurt||m.shortened||m.outcome!=='booked')};
   v.prerequisites=m.structureDirector.objectives.filter(o=>v.requires.includes(o.id)).map(o=>({id:o.id,status:o.status,at:o.at,evidence:o.evidence.map(e=>({id:e.id,at:e.at,actor:e.actor}))}));
   v.duration=m.len;
  }
  for(const offer of recoveryOffers){
   const e=m.graph.events.find(e=>e.t===offer.at&&e.preControl===offer.side&&e.control===offer.side&&offer.ids.includes(e.id));
   offer.landed=e?.id||null;
   offer.sequenceOpened=rows(m).some(r=>r.objective===offer.objective&&r.attempts>0);
   offer.sequenceCompleted=rows(m).some(r=>r.objective===offer.objective&&['completed','adapted'].includes(r.status));
  }
  for(const opportunity of alternativeReadinessOffers){
   const row=rows(m).find(r=>r.objective===opportunity.objective);
   const witness=records.find(v=>v.objective===opportunity.objective&&v.openedAt===opportunity.at&&opportunity.ready.includes(v.opening));
   opportunity.credited=witness?.opening||null;
   opportunity.completed=!!witness&&['completed','adapted'].includes(witness.terminal.kind);
  }
  const staminaContext={plan:m.planId,workers:Object.fromEntries(['w','f'].map(side=>{
   const worker=m[side];return [side,{id:worker.id,style:worker.style,ring:worker.ring,safe:worker.safe,fatigue:worker.fatigue}];
  })),rests:(m.graph.events||[]).filter(e=>A[e.id]&&G.costOf(e.id)<0&&(e.id==='catch_breath'||A[e.id].family==='rest')&&!e.blocked&&!e.botched).map(e=>({at:e.t,id:e.id,side:A[e.id].reverse?(e.preControl==='w'?'f':'w'):e.preControl,baseRecovery:-G.costOf(e.id)}))};
  return {records,openings:[...openings.values()],dependencyWitnesses,recoveryOffers,alternativeReadinessOffers,staminaContext};
 },restore(){for(const fn of undo.reverse())fn();tracked=null;}};
}
function summarise(records){
 const failed=records.filter(v=>!['completed','adapted'].includes(v.terminal.kind));
 const finalFailures=failed.filter(v=>v.finalSequenceStatus==='missed'&&!records.some(x=>x.key===v.key&&x.objective===v.objective&&x.attempt>v.attempt));
 const groups=key=>Object.fromEntries([...new Set(records.map(v=>v[key]))].map(k=>{
  const xs=records.filter(v=>v[key]===k);return [k,{attempts:xs.length,completed:xs.filter(v=>['completed','adapted'].includes(v.terminal.kind)).length,causes:count(xs,v=>v.terminal.kind)}];
 }));
 const guards={};for(const v of failed)for(const g of new Set(v.observations.flatMap(s=>s.guards)))inc(guards,g);
 return {attempts:records.length,completed:records.length-failed.length,failed:failed.length,finalOpenedMisses:finalFailures.length,
  interruptionCauses:count(failed,v=>v.terminal.kind),finalMissCauses:count(finalFailures,v=>v.terminal.kind),
  failedAttemptsWithGuard:guards,failedAttemptsWithArcTransition:failed.filter(v=>v.changes.some(c=>c.kind==='arc_transition')).length,
  failedAttemptsWithResolvedWithoutProgress:failed.filter(v=>v.changes.some(c=>c.kind==='attempt_resolved_without_progress')).length,
  selectionOpportunities:records.reduce((n,v)=>n+v.selections.length,0),offeredOpportunities:records.reduce((n,v)=>n+v.selections.filter(x=>x.offered).length,0),
  byStructure:groups('structure'),byLength:groups('length'),byProgress:count(failed,v=>String(v.terminal.progress)),
  protectedFailures:failed.filter(v=>v.protectedExit).length,
  examples:failed.filter((v,i,x)=>x.findIndex(y=>y.terminal.kind===v.terminal.kind)===i).map(v=>({key:v.key,objective:v.objective,opening:v.opening,terminal:v.terminal,lastObservation:v.observations.at(-1),changes:v.changes.slice(-2)})),
  records};
}
function summariseOpenings(records){
 const missed=records.filter(v=>!v.final.attempts);
 const opened=records.filter(v=>v.final.attempts);
 const assess=v=>{
  // Funnel over actual selection ticks: any candidate can pass each
  // stage, but the SAME candidate must satisfy all preceding stages.
  const cs=v.ticks.flatMap(t=>t.candidates);
  const stages=[
   ['window_and_safety',['before_window','after_window','finish_runway','safety_or_manager_request']],
   ['prerequisite',['prerequisite_pending']],
   ['matching_state',['wrong_control','wrong_position_or_down']],
   ['first_move_legal',['first_move_restricted','first_move_stamina','first_move_illegal']],
   ['chain_ready',['chain_too_early','chain_stamina','other_readiness']]
  ];
  let survivors=cs,firstEmpty=cs.length?null:'no_selection_ticks';const funnel={};
  for(const [name,guards] of stages){
   survivors=survivors.filter(c=>!guards.some(g=>c.guards.includes(g)));
   funnel[name]=survivors.length>0;
   if(!survivors.length&&!firstEmpty)firstEmpty=name;
  }
  const offered=v.ticks.some(t=>t.offered);
  if(!firstEmpty)firstEmpty=offered?'offered_but_no_credited_landing':'ready_but_not_offered';
  return {funnel,firstEmpty,offered,ready:survivors.length>0};
 };
 const details=missed.map(v=>({v,...assess(v)}));
 const funnel=Object.fromEntries(['window_and_safety','prerequisite','matching_state','first_move_legal','chain_ready'].map(k=>[k,details.filter(x=>x.funnel[k]).length]));
 const guards={};for(const {v} of details)for(const g of new Set(v.ticks.flatMap(t=>t.candidates.flatMap(c=>c.guards))))inc(guards,g);
 const combinations={};for(const {v} of details){
  for(const g of new Set(v.ticks.filter(t=>t.candidates.some(c=>!c.guards.some(g=>['before_window','after_window','finish_runway','safety_or_manager_request','prerequisite_pending'].includes(g)))).flatMap(t=>t.candidates.filter(c=>!c.guards.some(g=>['before_window','after_window','finish_runway','safety_or_manager_request','prerequisite_pending'].includes(g))).flatMap(c=>c.guards))))inc(combinations,g);
 }
 const byStructure=Object.fromEntries([...new Set(records.map(v=>v.structure))].map(k=>[k,{signed:records.filter(v=>v.structure===k).length,opened:opened.filter(v=>v.structure===k).length,missed:missed.filter(v=>v.structure===k).length,bottlenecks:count(details.filter(x=>x.v.structure===k),x=>x.firstEmpty)}]));
 return {signed:records.length,opened:opened.length,neverOpened:missed.length,withAlternatives:missed.filter(v=>v.alternatives).length,
  missedWithOffer:details.filter(x=>x.offered).length,missedWithNaturalLanding:missed.filter(v=>v.natural.length).length,
  missedWithMatchingNaturalLanding:missed.filter(v=>v.natural.some(x=>x.candidates.some(c=>!c.guards.includes('wrong_control')&&!c.guards.includes('wrong_position_or_down')))).length,
  protectedMisses:missed.filter(v=>v.final.protected).length,
  funnel,firstEmptyStage:count(details,x=>x.firstEmpty),overlappingGuards:guards,guardsInsidePrerequisiteReadyWindow:combinations,byStructure,
  examples:details.filter((x,i,xs)=>xs.findIndex(y=>y.firstEmpty===x.firstEmpty)===i).map(x=>({key:x.v.key,objective:x.v.objective,actions:x.v.actions,stage:x.firstEmpty,offered:x.offered,ticks:x.v.ticks.length,natural:x.v.natural.slice(0,2)})),
  records};
}
// Same case definition as the historical timingCases metric. Preserve
// overlap instead of calling an early guard a proven cause of failure.
function temporalCases(trace){
 const readiness=['chain_too_early','chain_stamina','other_readiness'];
 return trace.openings.filter(v=>!v.final.attempts&&v.ticks.some(t=>t.candidates.some(c=>c.guards.includes('chain_too_early')&&c.guards.every(g=>readiness.includes(g))))).map(v=>{
  const variants=v.schedules.map(s=>{
   const all=v.ticks.map(t=>({at:t.at,stamina:t.stamina,safety:t.safety,control:t.control,position:t.position,down:t.down,arc:t.arc,offered:t.offered,otherOffer:t.otherOffer,guards:t.candidates[s.variant].guards}));
   const early=all.filter(t=>t.guards.includes('chain_too_early')&&t.guards.every(g=>readiness.includes(g)));
   const inWindow=all.filter(t=>t.at>=s.earliest&&t.at<=s.latest);
   const safety=['before_window','after_window','finish_runway','safety_or_manager_request'];
   const state=['wrong_control','wrong_position_or_down'];
   const first=['first_move_restricted','first_move_stamina','first_move_illegal'];
   const pass=(xs,gs)=>xs.filter(t=>!t.guards.some(g=>gs.includes(g)));
   const safe=pass(inWindow,safety),prior=pass(safe,['prerequisite_pending']),matching=pass(prior,state),legal=pass(matching,first),ready=legal.filter(t=>!t.guards.length);
   const stamina=legal.filter(t=>t.guards.includes('chain_stamina'));
   // Ordered descriptive funnel. Never combine gates from distinct ticks
   // or variants, and never infer what would happen on unobserved ticks.
   const stage=s.earliest>s.latest?'incompatible_window':!inWindow.length?'no_observed_tick_in_window':!safe.length?'safety_or_runway':!prior.length?'prerequisite':!matching.length?'physical_state':!legal.length?'first_move_legality':!ready.length?'chain_readiness':ready.some(t=>t.offered===s.id)?'offered_not_credited':'ready_not_offered';
   const closest=inWindow.reduce((best,t)=>!best||t.guards.length<best.guards.length?t:best,null);
   const snapshot=t=>t?{at:t.at,stamina:t.stamina,safety:t.safety,control:t.control,position:t.position,down:t.down,arc:t.arc,offered:t.offered,guards:t.guards}:null;
   const protectedTicks=inWindow.filter(t=>t.guards.includes('safety_or_manager_request'));
   const flags=t=>[
    ...(t.safety.outcome!=='booked'?['non_booked_outcome']:[]),
    ...(t.safety.bigSpotPriority?['pending_big_spot']:[]),
    ...(t.safety.workingHurt?['working_hurt']:[]),
    ...(t.safety.shortened?['shortened']:[])
   ];
   for(const tick of inWindow)assert.equal(flags(tick).length>0,tick.guards.includes('safety_or_manager_request'),'exact safety guard decomposition');
   const safetyBreakdown={blockedTicks:protectedTicks.length,flagTicks:count(protectedTicks.flatMap(t=>flags(t)),x=>x),
    flagCombinations:count(protectedTicks,t=>flags(t).sort().join('+')),runwayTicks:inWindow.filter(t=>t.guards.includes('finish_runway')).length,
    firstBlocked:snapshot(protectedTicks[0]),lastBlocked:snapshot(protectedTicks.at(-1)),
    otherwiseReadyBlocked:protectedTicks.filter(t=>t.guards.length===1).length};
   return {...s,stage,safetyBreakdown,counts:{early:early.length,earlyTimingOnly:early.filter(t=>t.guards.length===1).length,earlyMixed:early.filter(t=>t.guards.length>1).length,inWindow:inWindow.length,safe:safe.length,prerequisite:prior.length,matching:matching.length,legal:legal.length,ready:ready.length,stamina:stamina.length,offered:ready.filter(t=>t.offered===s.id).length},
    firstEarly:snapshot(early[0]),lastEarly:snapshot(early.at(-1)),firstWindow:snapshot(inWindow[0]),lastWindow:snapshot(inWindow.at(-1)),firstMatching:snapshot(matching[0]),lastMatching:snapshot(matching.at(-1)),firstStaminaBlock:snapshot(stamina[0]),closest:snapshot(closest),firstReady:snapshot(ready[0]),lastReady:snapshot(ready.at(-1)),windowGuards:[...new Set(inWindow.flatMap(t=>t.guards))]};
  });
  return {key:v.key,structure:v.structure,objective:v.objective,actions:v.actions,duration:v.duration,window:v.window,prerequisites:v.prerequisites.map(p=>({id:p.id,status:p.status,at:p.at})),variants,
   final:v.final,
   timingOnly:variants.some(x=>x.counts.earlyTimingOnly>0),mixed:variants.some(x=>x.counts.earlyMixed>0),anyReady:variants.some(x=>x.counts.ready>0)};
 });
}
// The historical staminaCases metric is an association, not a causal
// finding. This drill-down uses exactly its eligible observed ticks.
function staminaCases(trace){
 return trace.openings.filter(v=>!v.final.attempts&&v.ticks.some(t=>t.candidates.some(c=>c.energyAudit))).map(v=>{
  const variants=v.schedules.map(s=>{
   const all=v.ticks.map(t=>({at:t.at,arc:t.arc,control:t.control,position:t.position,down:t.down,guards:t.candidates[s.variant].guards,energy:t.candidates[s.variant].energyAudit}));
   const blocked=all.filter(t=>t.energy);
   const pure=blocked.filter(t=>t.guards.length===1);
   const best=xs=>xs.reduce((b,x)=>!b||x.energy.maxDeficit<b.energy.maxDeficit?x:b,null);
   const snapshot=x=>x?{at:x.at,arc:x.arc,control:x.control,position:x.position,down:x.down,guards:x.guards,...x.energy}:null;
   const closest=best(blocked),closestPure=best(pure);
   const recoveryBefore=x=>x?trace.staminaContext.rests.filter(e=>e.at<x.at):[];
   const recovery=closestPure||closest;
   const deficitSides=[...new Set(blocked.flatMap(t=>t.energy.steps.filter(x=>x.deficit>0).map(x=>x.side)))];
   return {...s,counts:{blocked:blocked.length,staminaOnly:pure.length,mixed:blocked.length-pure.length,
    ready:all.filter(t=>!t.guards.length).length,types:count(blocked,t=>t.energy.type),pureTypes:count(pure,t=>t.energy.type),
    gripImpossible:blocked.filter(t=>!t.energy.gripPossible).length},
    deficitSides,first:snapshot(blocked[0]),last:snapshot(blocked.at(-1)),closest:snapshot(closest),closestPure:snapshot(closestPure),
    recoveryBefore:count(recoveryBefore(recovery),e=>e.side),
    recoveryInPrevious120:count(recoveryBefore(recovery).filter(e=>recovery.at-e.at<=120),e=>e.side)};
  });
  const offers=trace.recoveryOffers.filter(o=>o.objective===v.objective);
  return {key:v.key,structure:v.structure,objective:v.objective,actions:v.actions,window:v.window,duration:v.duration,
   final:v.final,workers:trace.staminaContext.workers,plan:trace.staminaContext.plan,
   variants,offers:offers.map(o=>({at:o.at,side:o.side,ids:o.ids,deficit:o.deficit,stamina:o.stamina,boosted:o.boosted,landed:o.landed})),
   anyReady:variants.some(s=>s.counts.ready>0),staminaOnly:variants.some(s=>s.counts.staminaOnly>0),
   mixed:variants.some(s=>s.counts.mixed>0)};
 });
}
module.exports={trace,summarise,summariseOpenings,temporalCases,staminaCases};
