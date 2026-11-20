'use strict';
/* Phase 9 match evidence validator: read-only, shared by browser Graph Lab and CI.
 * Hard failures are grounded mechanical invariants. Variety signals are review
 * prompts, NOT claims that code can objectively judge wrestling storytelling.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.OfficeGraphValidation=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 const MAX_EXAMPLES=18;
 const knownSpecial=new Set(['special_spot','special_deferred','scheduled_nearfall']);
 const keys=['landed','counter','block'];
 const n=(o,k)=>{o[k]=(o[k]||0)+1;};
 function create(graph){
  return {schema:'office-graph-validation-v1',bouts:0,events:0,hardErrors:0,
   examples:[],errorCodes:{},outcomes:{},attempts:{aerial:0,grapple:0,resolved:0,interrupted:0},
   byStyle:{},byTraining:{},threeBeats:{},linkedPairs:{},sameMoveRepeat:0,adjacentActions:0,
   differentMatches:0,signatures:{},linkedActionCount:0,graphNodes:Object.keys(graph.A).length};
 }
 function issue(out,code,match,event,detail){
  out.hardErrors++;n(out.errorCodes,code);
  if(out.examples.length<MAX_EXAMPLES)out.examples.push({
   code,seed:match.o?.seed,time:event?.t??null,id:event?.id??null,detail
  });
 }
 function scanAttempts(out,match,graph,type){
  const g=match.graph||{},prefix=type==='aerial'?'aerial':'grapple';
  const attempts=g[prefix+'Attempts']||[];
  const pending=g['pending'+prefix[0].toUpperCase()+prefix.slice(1)];
  if(pending)issue(out,'unresolved-'+type,match,null,pending.id);
  const events=(g.events||[]).filter(e=>e[prefix+'AttemptSeq']!==undefined);
  const bySeq=new Map(events.map(e=>[e[prefix+'AttemptSeq'],e]));
  if(bySeq.size!==events.length)issue(out,'duplicate-'+type+'-event',match,null,'reused sequence number');
  for(const a of attempts){
   out.attempts[type]++;
   if(a.outcome==='interrupted'||a.outcome==='aborted')out.attempts.interrupted++;
   else if(keys.includes(a.outcome))out.attempts.resolved++;
   else issue(out,'incomplete-'+type,match,null,a.id+': '+a.outcome);
   const event=bySeq.get(a.seq);
   if(keys.includes(a.outcome)){
    const expected=a.outcome==='counter'?a.id+'_rev':a.outcome==='block'?a.id+'_blk':a.id;
    if(!event||event.id!==expected||event.attemptedMove!==a.id||
      event[prefix+'Resolution']!==a.outcome||a.actionId!==expected)
     issue(out,'mismatched-'+type,match,event,'expected '+expected+' after '+a.id);
    if(type==='grapple'&&![...(graph.GRAPPLE_PILOT||[]),...(graph.SUPERPLEX_PILOT||[])].includes(a.id))
     issue(out,'unapproved-grapple',match,event,a.id);
   }else if(event)issue(out,'orphan-'+type+'-event',match,event,a.id);
  }
  const known=new Set(attempts.map(a=>a.seq));
  for(const event of events)if(!known.has(event[prefix+'AttemptSeq']))
   issue(out,'unknown-'+type+'-sequence',match,event,'no corresponding attempt');
 }
 function add(out,match,graph,backgrounds){
  const A=graph.A,events=match.graph?.events||[];
  out.bouts++;out.events+=events.length;
  n(out.outcomes,match.graph?.outcome?.id||match.outcome||'(unknown)');
  if(!match.done||!match.final)issue(out,'incomplete-match',match,null,'no final result');
  if(match.graph?.outcome?.id&&match.outcome!=='dq'&&match.outcome!=='nc'&&match.outcome!=='double'&&
    match.graph.outcome.id!==match.o?.finish)
   issue(out,'wrong-finish',match,null,match.graph.outcome.id+' vs '+match.o?.finish);
  scanAttempts(out,match,graph,'aerial');
  scanAttempts(out,match,graph,'grapple');
  const idSequence=[];
  let last=null;
  for(const e of events){
   const node=A[e.id];
   if(!node){
    if(!e.id.startsWith('outcome_')&&!knownSpecial.has(e.id))
     issue(out,'unknown-event',match,e,'no action node');
    last=null;continue;
   }
   if(node.after&&e.t/Math.max(1,match.len)+1e-8<node.after)
    issue(out,'early-move',match,e,'requires '+Math.round(node.after*100)+'% of match');
   if((node.counterOf||node.blockOf)&&e.attemptedMove &&
     e.attemptedMove!==(node.counterOf||node.blockOf))
    issue(out,'wrong-counter-parent',match,e,e.attemptedMove+' vs '+(node.counterOf||node.blockOf));
   if(last){
    out.adjacentActions++;
    if(last===e.id)out.sameMoveRepeat++;
    const edge=last+'>'+e.id;
    if(A[last]?.next?.some(([to])=>to===e.id)){out.linkedActionCount++;n(out.linkedPairs,edge);}
   }
   last=e.id;
   idSequence.push(e.id);
   const side=e.preControl==='f'?'f':'w',att=side==='w'?match.w:match.f;
   if(att){
    const style=att.style||'Unknown';const school=backgrounds?.get?.(att)?.id||'unknown';
    const styleRow=out.byStyle[style]||(out.byStyle[style]={actions:0,families:{}});
    styleRow.actions++;n(styleRow.families,node.family||'base');
    const schoolRow=out.byTraining[school]||(out.byTraining[school]={actions:0,families:{}});
    schoolRow.actions++;n(schoolRow.families,node.family||'base');
   }
  }
  const signature=idSequence.join('|');
  n(out.signatures,signature);
  if(out.signatures[signature]===1)out.differentMatches++;
  for(let i=0;i+2<idSequence.length;i++)n(out.threeBeats,idSequence.slice(i,i+3).join(' > '));
  return out;
 }
 function finish(out){
  const sorted=Object.entries(out.threeBeats).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  const distinct=Object.keys(out.signatures).length;
  const famSummary=rows=>Object.fromEntries(Object.entries(rows).sort(([a],[b])=>a.localeCompare(b)).map(([key,entry])=>[
   key,{actions:entry.actions,topFamilies:Object.entries(entry.families).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([family,count])=>({family,count}))}
  ]));
  const review=[];
  if(out.bouts>=10&&distinct/out.bouts<.8)review.push('Many matches share identical action-ID sequences; inspect repeated pairings and seeds.');
  if(out.adjacentActions>=40&&out.sameMoveRepeat/out.adjacentActions>.12)review.push('Identical moves frequently appear back-to-back; inspect tapes for repetitive commentary.');
  return {schema:out.schema,bouts:out.bouts,hardErrors:out.hardErrors,pass:out.hardErrors===0,
   errorCodes:out.errorCodes,examples:out.examples,attempts:out.attempts,
   observedLinkedPairs:Object.keys(out.linkedPairs).length,linkedActionCount:out.linkedActionCount,
   distinctMatchSequences:distinct,sequenceUniqueness:out.bouts?Math.round(distinct/out.bouts*1000)/10:0,
   adjacentRepeatPct:out.adjacentActions?Math.round(out.sameMoveRepeat/out.adjacentActions*1000)/10:0,
   commonTriples:sorted.slice(0,8).map(([sequence,count])=>({sequence,count})),
   byStyle:famSummary(out.byStyle),byTraining:famSummary(out.byTraining),review};
 }
 return {create,add,finish};
});
