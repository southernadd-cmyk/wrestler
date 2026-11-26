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
 const undo=[],attempts=new Map(),records=[];
 const rows=m=>m.structureDirector?.sequences||[];
 const running=m=>rows(m).filter(r=>r.status==='running'&&r.progress>0);
 const id=r=>r.objective+'|'+r.attempts;
 const objective=(m,r)=>m.sheet.structurePlan.objectives.find(o=>o.id===r.objective);
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
  if(m.outcome!=='booked'||m.bigSpotRequest||m.workingHurt||m.shortened)guards.push('protected_or_manager_request');
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
   for(const r of running(m)){
    const s=snapshot(m,r,pre),v=observe(m,r,s);
    v.selections.push({at:m.t,progress:r.progress,expected:s.expected,offered:result?.objective===r.objective?result.id:null,
     willingness:result?.objective===r.objective?result.willingness:null,legal:s.legal,guards:s.guards});
   }
  }
  return result;
 });
 wrap(D,'observeSequence',function(original,args){
  const [m,e,pre,previous,actualOffer]=args;
  if(m!==tracked)return original.apply(this,args);
  const before=running(m).map(r=>({r,k:id(r),v:record(m,r),expected:objective(m,r).sequence.actions[r.progress],progress:r.progress}));
  const result=original.apply(this,args);
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
  return records;
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
module.exports={trace,summarise};
