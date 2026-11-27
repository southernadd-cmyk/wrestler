/* THE OFFICE — one match result, shared by the referee, booker, title office and reports.
   Booked finish is the promoter's instruction; actual outcome records what happened.
   The winner and belt holder are separate facts (a title does not switch on a DQ). */
(function installOfficeOutcome(root){'use strict';
 const D=root.OfficeData;
 function interpret(c,fin={}){
  const bookedFinish=fin.bookedFinish||c?.finish||null;
  const performedFinish=c?.finish||null;
  const actual=fin.actualOutcome||fin.outcome||'booked';
  const disqualification=actual==='dq'||(actual==='booked'&&/_dq$/.test(performedFinish||''));
  const noContest=actual==='nc',unplanned=actual==='double';
  const winner=noContest?null:unplanned?'w':actual==='dq'?'f':D.FINISHES[performedFinish]?.win?'w':'f';
  const honoured=typeof fin.contractHonoured==='boolean'?fin.contractHonoured:
   !noContest&&!unplanned&&actual!=='dq'&&(bookedFinish===performedFinish);
  return {bookedFinish,performedFinish,actualOutcome:actual,winner,contractHonoured:honoured,
   disqualification,noContest,beltChangeAllowed:!noContest&&!unplanned&&!disqualification};
 }
 // The actual terminal route, not a named move mentioned in the commentary.
 const FINISHER_ROUTES=new Set(['finisher','reversal_finisher','top_rope','limb_finish','strike_knockout','outlasted']);
 function cornerInterference(k){return !!(k?.fired&&['argue','distract','refbump','runin'].includes(k.job)&&(k.ok||k.dq||k.hurtRef));}
 function promiseVerdict(c,fin,type){
  const x=interpret(c,fin),ev=fin.evidence||{},route=fin.finishRoute||ev.route;
  const ownDirty=!!(ev.dirty?.w||fin.promoSignals?.workerDirty||cornerInterference(fin.corners?.w)||x.performedFinish==='win_dirty'||x.performedFinish==='lose_dq'||x.actualOutcome==='dq');
  const rivalDirty=!!(ev.dirty?.f||fin.promoSignals?.opponentDirty||cornerInterference(fin.corners?.f)||x.performedFinish==='win_dq'||route==='rope_rollup');
  if(type==='win')return x.winner==='w';
  if(type==='clean')return x.actualOutcome==='booked'&&!x.disqualification&&['win_clean','lose_clean'].includes(x.performedFinish)&&!ownDirty&&!rivalDirty;
  // 'nocheat' means the wrestler did not cheat, even if they lost. Preserve that established contract.
  if(type==='nocheat')return !x.noContest&&!ownDirty;
  if(type==='finisher')return x.winner==='w'&&(fin.finishReceipt?.v===1?fin.finishReceipt.finisher==='w':
   x.actualOutcome==='booked'&&x.performedFinish==='win_clean'&&FINISHER_ROUTES.has(route));
  if(type==='counter')return !!fin.promoSignals?.workerCounter;
  return null;
 }
 root.OfficeOutcome={interpret,promiseVerdict,cornerInterference};
})(typeof window!=='undefined'?window:globalThis);
