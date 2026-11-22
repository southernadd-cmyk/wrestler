/* Booking Negotiations V2 — Phase 2.
   Bounded, deterministic promoter bargaining on top of the existing rules.
   The original offer stays unchanged until a proposal is explicitly accepted.
   Haggling costs one management meeting; failed or aggressive bargaining can
   cost trust, and hardball with a low-trust promoter can lose the booking. */
(function installBookingConversations(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,X=root.OfficeStips;
 if(!G||!D||!X)return;
 const originalMeeting=G.meeting, originalMove=G.talkMove;
 const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
 const snap=o=>({slot:o.slot,finish:o.finish,stip:o.stip||null,bump:o.bump||1});
 const apply=(o,x)=>{o.slot=x.slot;o.finish=x.finish;o.bump=x.bump;o.stip=x.stip||null};
 const round=n=>+n.toFixed(4);
 const log=(t,p,player,promoter)=>{t.log.push({who:'You',text:player},{who:p.voice,text:promoter});t.turns++;G.save()};
 const offerText=(o,w,x)=>{
  const before=o.talk.original, parts=[];
  if(x.slot!==before.slot)parts.push(D.SLOTS[x.slot].name);
  if(x.finish!==before.finish)parts.push(D.FINISHES[x.finish].name.toLowerCase());
  if((x.stip||null)!==(before.stip||null))parts.push(X.STIPS[x.stip]?.name||'no stipulation');
  parts.push(G.money(G.purse({...o,...x},w))+' appearance fee');
  return parts.join(' · ')+'.';
 };
 const adjusted=(o,t,degree)=>{
  const v=t.original, x={slot:v.slot,finish:v.finish,stip:v.stip||null,bump:v.bump};
  if(t.topic==='fee')x.bump=round(v.bump*(degree===1?1.2:degree===.5?1.1:degree===.75?1.15:1.05));
  else if(t.topic==='protect'){x.finish='lose_protected';x.bump=round(v.bump*(degree===1?.92:degree===.5?.84:degree===.75?.88:.76));}
  else if(t.topic==='slot'){x.slot=D.SLOT_ORDER[D.SLOT_ORDER.indexOf(v.slot)+1]||v.slot;x.bump=round(v.bump*(degree===1?1:degree===.5?.9:degree===.75?.95:.8));}
  else if(t.topic==='stip'){
   x.stip=t.stip;
   x.bump=round(v.bump*(degree===1?(t.lastArg==='trade'?1:1.1):degree===.75?.9:.8));
  }
  return x;
 };
 const pressure=(o,w,t,arg)=>{
  if(t.topic==='stip'){const v=X.chance(o,w,t.stip,arg);return {strength:v.strength,threshold:v.need};}
  const p=G.P(o.pid),s=G.S;
  const base=p.trust*.38+w.heat*.27+w.pro*.13+s.rep*.12+(D.STYLE_PLAN[w.style]===p.likes?10:0);
  const bonus=arg==='crowd'?Math.round(w.heat*.2+(p.personality==='showman'?9:0)):
   arg==='reliability'?Math.round(w.pro*.16+(p.personality==='traditional'?9:0)):
   Math.round(13+(p.personality==='cold'?8:0));
  return {strength:base+bonus-(p.personality==='cold'?7:0),threshold:{fee:58,protect:62,slot:69}[t.topic]};
 };
 const missing=(t,p,detail)=>{
  t.step='done';t.verdict='refused';t.proposal=null;t.detail=detail;
  G.save();
 };
 const exit=(o,t,p,reason)=>{
  G.S.offers=G.S.offers.filter(x=>x.id!==o.id);
  t.step='done';t.proposal=null;t.verdict='walked';t.detail=reason;G.save();
  return {offer:o,talk:t,withdrawn:true,detail:reason};
 };
 G.meeting=function(oid,wid){
  const r=originalMeeting.call(G,oid,wid);
  if(!r.error&&r.talk?.original&&!Object.prototype.hasOwnProperty.call(r.talk.original,'stip')){
   r.talk.original.stip=r.offer.stip||null;G.save();
  }
  return r;
 };
 G.talkMove=function(oid,wid,move){
  const found=G.meeting(oid,wid);if(found.error)return found;
  const {offer:o,talk:t}=found,w=G.W(wid),p=G.P(o.pid);
  const result=()=>({talk:t,offer:o});
  // Old saves whose conversations already reached 'done' remain usable.
  if(t.step==='done'){
   const r=originalMove.call(G,oid,wid,move);
   if(move==='revert'&&!r.error){apply(o,t.original);t.proposal=null;G.save();}
   return r;
  }
  if(move==='reply:walk'&&t.step!=='start'){
   return exit(o,t,p,'You walked away from the booking. The invitation has been withdrawn.');
  }
  if(move==='reply:original'&&t.step!=='start'){
   apply(o,t.original);
   t.step='done';t.proposal=null;t.verdict='original';
   t.detail='The original terms remain available. Nothing is signed yet.';
   log(t,p,"Let's take your original terms instead.",'Fine. The original invitation still stands.');
   return result();
  }
  if(t.step==='start')return originalMove.call(G,oid,wid,move);
  if(t.step==='reason'){
   if(typeof move!=='string'||!move.startsWith('arg:'))return {error:'Choose an argument.'};
   const arg=move.slice(4);
   if(t.retry&&t.lastArg===arg)return {error:'That argument has already failed. Choose another.'};
   if(!['crowd','reliability','trade'].includes(arg))return {error:'Choose a valid argument.'};
   const r=originalMove.call(G,oid,wid,move);
   if(r.error)return r;
   const proposal=snap(o),kind=t.verdict;
   apply(o,t.original); // Existing rules calculated a proposal: undo until accepted.
   t.lastArg=arg;t.kind=kind;t.full=adjusted(o,t,1);
   const measured=pressure(o,w,t,arg);
   t.strength=measured.strength;t.threshold=measured.threshold;
   t.verdict=null;t.proposal=kind==='refused'?null:proposal;t.pushes=0;
   if(kind==='agreed'){
    t.step='offer';t.detail=offerText(o,w,proposal);
    t.log[t.log.length-1].text='That works for me. '+t.detail+' Tell me if you accept, then sign it.';
   }else if(kind==='counter'){
    t.step='counter';t.detail=offerText(o,w,proposal);
    t.log[t.log.length-1].text='Not everything you asked for. My counter is '+t.detail+' You may accept or make one final push.';
   }else{
    // A wasted meeting plus a measurable relationship cost is the risk of a weak demand.
    p.trust=clamp(p.trust-2);
    t.cost=(t.cost||0)+2;
    if(t.retry){
     missing(t,p,'The original terms remain. Your final argument was rejected (promoter trust −2).');
     t.log[t.log.length-1].text='I have heard the final case. No changes. We are finished here.';
    }else{
     t.step='challenge';
     t.log[t.log.length-1].text=p.personality==='cold'?'That does not add up. Try one different argument, or concede something.':
      p.personality==='aggressive'?'That is not enough. Make a better case or give me a concession.':
      p.personality==='traditional'?'I am not rewriting my card on that argument. One last chance.':
      'I am not sold. Give me one more reason or offer something back.';
     t.detail='First argument rejected; promoter trust −2.';
    }
   }
   G.save();return result();
  }
  if(t.step==='challenge'){
   if(move==='reply:reframe'){
    t.step='reason';t.retry=true;
    log(t,p,'Let me try another argument.','All right. Make this one count.');
    return result();
   }
   if(move==='reply:concede'){
    if(t.strength<t.threshold-27){
     missing(t,p,'No revision available. The initial invitation remains.');
     log(t,p,'What if we make a greater concession?','No. We are sticking to the original deal.');
    }else{
     t.proposal=adjusted(o,t,.25);t.kind='counter';t.step='counter';t.pushes=1;
     t.detail=offerText(o,w,t.proposal);
     log(t,p,'I will settle for less to get something agreed.',
      'I can make this one compromise: '+t.detail+' I cannot go further.');
    }
    return result();
   }
   return {error:'Choose a new argument, a concession, or the original terms.'};
  }
  if(t.step==='counter'||t.step==='offer'){
   if(move==='reply:accept'){
    if(!t.proposal)return {error:'No proposal is available.'};
    apply(o,t.proposal);
    t.step='done';t.verdict=t.kind;t.detail=offerText(o,w,t.proposal);
    log(t,p,'I accept those terms.','Then we have a deal in principle. Sign it to make it official.');
    return result();
   }
   if(t.step==='counter'&&!t.pushes&&['push:hold','push:trade'].includes(move)){
    t.pushes=1;
    if(move==='push:hold'){
     // Hardball always strains trust. When trust is already poor and the case
     // is weak, a promoter can withdraw the ORIGINAL booking as well.
     const trustBefore=p.trust;p.trust=clamp(p.trust-2);t.cost=(t.cost||0)+2;
     if(t.strength>=t.threshold-5){
      t.proposal={...t.full};t.kind='agreed';t.step='offer';t.detail=offerText(o,w,t.proposal);
      log(t,p,'I need the full improvement. We have earned it.',
       'Fine, but do not ask again. '+t.detail+' This is final.');
     }else if(trustBefore<45&&t.strength<t.threshold-10){
      log(t,p,'I want the full terms or I cannot agree.','Then I am pulling the entire invitation. Find another show.');
      return exit(o,t,p,'The promoter withdrew the booking after hardball. Promoter trust −2.');
     }else{
      t.proposal=null;missing(t,p,'The counteroffer was withdrawn. The original deal remains. Promoter trust −2.');
      log(t,p,'I will not accept that compromise.','Then the extra terms are off the table. The original offer still stands.');
     }
     return result();
    }
    if(t.strength>=t.threshold-14){
     t.proposal=adjusted(o,t,.75);t.detail=offerText(o,w,t.proposal);
     log(t,p,'Could we meet a little closer to my request?',
      'One last adjustment: '+t.detail+' That is all I can do.');
    }else{
     log(t,p,'Could we find a little more room?', 'No. My existing counteroffer stands. No more movement.');
    }
    return result();
   }
   return {error:'Accept the proposal or choose one permitted final response.'};
  }
  return {error:'No response is available at this stage.'};
 };
 root.OfficeNegotiationsV2={active:true};
})(typeof window!=='undefined'?window:globalThis);
