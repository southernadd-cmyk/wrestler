/* Presentation-only mapping of existing negotiation engine moves. */
(function(root){'use strict';
function negotiationOptions(o,t,read,trades,focus){
 const action=(id,label,hint="")=>({id,label,hint});
 const original=action("reply:original","Keep the original offer","End bargaining without accepting a revision.");
 const exchange=trades.length?action("trades","Offer a concrete trade","Make a final exchange; rejection costs one trust."):null;
 switch(t.step){
 case "start": return focus<1?[]:[
  action("ask:fee","Ask for a higher fee","Up to 20% more; accepting a raise costs "+(read.feeRaiseCost||2)+" promoter trust."),
  ...(o.finish==="lose_clean"?[action("ask:protect","Ask for a protected loss","Usually a lower fee.")]:[]),
  ...(o.slot!=="main"?[action("ask:slot","Ask for better billing","A higher position on the card at a lower fee.")]:[]),
  ...(!o.stip&&!o.programme?[action("stips","Ask for a match stipulation")]:[])];
 case "reason":return [
  action("arg:crowd","The crowd will pay for this","Use drawing power and audience interest."),
  action("arg:reliability","You know we can deliver","Emphasise professionalism."),
  action("arg:trade","Find a commercial compromise","Make a business case.")].filter(x=>!t.retry||x.id!=="arg:"+t.lastArg);
 case "challenge":return [action("reply:reframe","Make one final argument"),exchange||action("reply:concede","Offer a concession","Try for a smaller improvement at a lower fee."),original];
 case "counter":return [action("reply:accept","Accept the proposed terms","You must still sign the contract."),...(!t.pushes?[action("push:hold","Insist on the full change","Costs "+(read.hardballCost||2)+" trust; the promoter may withdraw the booking.")]:[]),...(exchange?[exchange]:[]),original,action("reply:walk","Walk away from the booking","The invitation will be withdrawn.")];
 case "offer":return [action("reply:accept","Accept the proposed terms","You must still sign the contract."),original,action("reply:walk","Walk away from the booking","The invitation will be withdrawn.")];
 default:return [];
 }
}
root.OfficeSwitchNegotiation={options:negotiationOptions};
})(typeof window!=='undefined'?window:globalThis);
