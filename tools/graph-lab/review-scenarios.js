'use strict';
/* Repeatable match scenarios for the browser Graph Lab and Node review suite. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.OfficeGraphReviewScenarios=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const cases=Object.freeze([
    Object.freeze({id:'technical',label:'Technical chains and grapples',seed:201101,count:100,rotation:'roster',wid:'juno',rid:'rex',plan:'technical',slot:'mid',finish:'win_clean'}),
    Object.freeze({id:'power',label:'Power and ringside brawling',seed:213101,count:100,rotation:'roster',wid:'juno',rid:'rex',plan:'brawl',slot:'feature',finish:'win_dirty'}),
    Object.freeze({id:'aerial',label:'Aerial spectacle and counters',seed:225101,count:100,rotation:'roster',wid:'juno',rid:'rex',plan:'spots',slot:'main',finish:'lose_protected'}),
    Object.freeze({id:'comeback',label:'Comebacks and storytelling',seed:237101,count:100,rotation:'roster',wid:'juno',rid:'rex',plan:'story',slot:'main',finish:'win_clean'}),
    Object.freeze({id:'safe',label:'Cautious short opener',seed:249101,count:100,rotation:'roster',wid:'juno',rid:'rex',plan:'safe',slot:'opener',finish:'lose_clean'}),
    Object.freeze({id:'rivalry',label:'Repeated rivals / Juno and Rex',seed:261101,count:100,rotation:'fixed',wid:'juno',rid:'rex',plan:'technical',slot:'feature',finish:'lose_protected'})
  ]);
  function get(id){return cases.find(row=>row.id===id)||null;}
  return Object.freeze({cases,get});
});
