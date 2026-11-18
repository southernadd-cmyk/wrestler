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
  const winner=noContest?null:unplanned?'w':D.FINISHES[performedFinish]?.win?'w':'f';
  const honoured=typeof fin.contractHonoured==='boolean'?fin.contractHonoured:
   !noContest&&!unplanned&&actual!=='dq'&&(bookedFinish===performedFinish);
  return {bookedFinish,performedFinish,actualOutcome:actual,winner,contractHonoured:honoured,
   disqualification,noContest,beltChangeAllowed:!noContest&&!unplanned&&!disqualification};
 }
 root.OfficeOutcome={interpret};
})(typeof window!=='undefined'?window:globalThis);
