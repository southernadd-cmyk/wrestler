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
 // Promoters disagree about WHAT constitutes a good business case. Profiles
 // affect outcomes, offers, hardball tolerance and how they speak; they do not
 // alter the underlying finish/winner or invent wrestler/promoter history.
 const PERSONALITIES={
  aggressive:{
   name:'Hard-nosed',priority:'An exciting physical show, especially credible brawlers',
   warning:'Ultimatums may cost you the entire booking, particularly when trust is low.',
   signal:'Gaz responds to a tough, credible draw and to sensible concessions.',
   counter:{fee:1.07,protect:.82,slot:.88},failed:3,hardball:3,pullBelow:50,pullMargin:6,
   holdWindow:4,tradeWindow:13
  },
  showman:{
   name:'Crowd-first',priority:'Crowd reaction, memorable moments and marketable billing',
   warning:'Willing to compromise for a draw; an empty promise will not move the card.',
   signal:'Nina is receptive to strong audience interest, especially for a featured spot.',
   counter:{fee:1.13,protect:.90,slot:.95},failed:1,hardball:1,pullBelow:27,pullMargin:14,
   holdWindow:7,tradeWindow:16
  },
  traditional:{
   name:'Traditional',priority:'Reliability, professionalism and protecting the written card',
   warning:'A clean finish is difficult to change. A proven worker has more leverage.',
   signal:'Harold respects dependable work and arguments grounded in match delivery.',
   counter:{fee:1.08,protect:.86,slot:.91},failed:2,hardball:3,pullBelow:43,pullMargin:10,
   holdWindow:4,tradeWindow:12
  },
  cold:{
   name:'Commercial',priority:'Clear financial value and dependable technical quality',
   warning:'Poorly justified demands and hardball can seriously damage the relationship.',
   signal:'Vivian will negotiate when the numbers and the talent justify the change.',
   counter:{fee:1.05,protect:.80,slot:.86},failed:2,hardball:4,pullBelow:55,pullMargin:8,
   holdWindow:2,tradeWindow:11
  }
 };
 const profile=p=>PERSONALITIES[p.personality]||PERSONALITIES.traditional;
 // Different strengths for different requests and evidence, not merely one
 // universal "best argument" button. This modifies existing skill/trust scores.
 const personalityEdge=(p,w,t,arg)=>{
  if(t.topic==='stip')return 0; // Existing stipulation taste/fit/feud rules already differ by promoter.
  if(p.personality==='aggressive')return t.topic==='protect'?(w.style==='Brawl'?5:2):
   t.topic==='slot'?(w.heat>=60?4:-6):arg==='trade'?4:-9;
  if(p.personality==='showman')return t.topic==='slot'?(arg==='crowd'?10:3)+(w.heat>=60?4:-4):
   t.topic==='fee'?(w.heat>=65?5:-5):w.heat>=60?5:-4;
  if(p.personality==='traditional')return t.topic==='protect'?
    (-9+(arg==='reliability'&&w.pro>=80?9:0)):
    t.topic==='slot'?(arg==='reliability'?8:-5)+(w.pro>=85?3:0):
    arg==='reliability'?6:-6;
  if(p.personality==='cold')return t.topic==='fee'?
    (arg==='trade'?8:-9)+(w.heat>=70?3:0):
    t.topic==='slot'?(arg==='reliability'&&w.pro>=80?7:-8):-8;
  return 0;
 };
 const introLine=(p,w,o)=>{
  const past=G.S.history?.find(h=>h.pid===p.id&&h.wid===w.id);
  const remembered=past&&Number.isFinite(past.stars)?
    ' I remember your last match on my show: '+past.stars+' stars.':'';
  const lines={
   aggressive:"If I'm moving anyone on my card, I need a fighter who brings the crowd with them.",
   showman:"Give me something people will talk about after the show, not just a name on the poster.",
   traditional:"I've written this card carefully. Give me a reason to change it.",
   cold:"Show me what the booking is worth. Sentiment does not pay the bills."
  };
  return ' '+(lines[p.personality]||lines.traditional)+remembered;
 };
 const openingReply=(p,t)=>{
  const topics={fee:'the money',protect:'the finish',slot:'the billing',stip:'the stipulation'};
  const x=topics[t.topic]||'the booking';
  return {
   aggressive:'You want to change '+x+'? Give me a reason that holds up in front of a live crowd.',
   showman:'Interesting. How does changing '+x+' give the audience a moment to remember?',
   traditional:'That was not the card I planned. What makes changing '+x+' the responsible choice?',
   cold:'What concrete value does changing '+x+' deliver? Keep it measurable.'
  }[p.personality]||'Make the case.';
 };
 const caseReply=(p,t,kind,detail)=>{
  const lines={
   aggressive:{
    agreed:"That's a strong enough argument. ",counter:"You've got a point, but I'm not giving you everything. ",
    refused:"That doesn't convince me. Bring something better, or take what I offered. "
   },
   showman:{
    agreed:"That's something we can sell. ",counter:"I can sell part of that idea. ",
    refused:"I'm not seeing the audience for that yet. "
   },
   traditional:{
    agreed:"That is a reasonable adjustment to the card. ",counter:"I can make one limited change without upsetting the show. ",
    refused:"The original card remains the sounder decision. "
   },
   cold:{
    agreed:"Those figures make sense. ",counter:"The calculation supports a smaller adjustment. ",
    refused:"The commercial case does not hold. "
   }
  };
  return (lines[p.personality]||lines.traditional)[kind]+detail+
    (kind==='agreed'?' Accept these terms and then sign.':kind==='counter'?' Take this or make one final push.':'');
 };
 const read=(o,w)=>{
  const p=G.P(o.pid),v=profile(p),past=G.S.history?.find(h=>h.pid===p.id&&h.wid===w.id);
  return {
   name:v.name,priority:v.priority,signal:v.signal,warning:v.warning,
   evidence:past&&Number.isFinite(past.stars)?
    'Past booking: '+w.short+' earned '+past.stars+' stars on '+p.name+'.':
    'No completed booking with this wrestler recorded for '+p.name+'.'
  };
 };
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
  const style=profile(G.P(o.pid)).counter;
  // Full demand, partial counteroffer, improved counteroffer and small
  // concession each pay differently based on the booker's priorities.
  const factor=(full,counter,minimum)=>{
   if(degree===1)return full;
   if(degree===.5)return counter;
   if(degree===.75)return (full+counter)/2;
   return minimum;
  };
  if(t.topic==='fee')x.bump=round(v.bump*factor(1.20,style.fee,1.04));
  else if(t.topic==='protect'){
   x.finish='lose_protected';
   x.bump=round(v.bump*factor(.92,style.protect,.76));
  }else if(t.topic==='slot'){
   x.slot=D.SLOT_ORDER[D.SLOT_ORDER.indexOf(v.slot)+1]||v.slot;
   x.bump=round(v.bump*factor(1,style.slot,.79));
  }else if(t.topic==='stip'){
   x.stip=t.stip;
   x.bump=round(v.bump*factor(t.lastArg==='trade'?1:1.1,.9,.8));
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
  return {strength:base+bonus-(p.personality==='cold'?7:0)+personalityEdge(p,w,t,arg),threshold:{fee:58,protect:62,slot:69}[t.topic]};
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
  if(!r.error&&r.talk?.original){
   let changed=false;
   if(!Object.prototype.hasOwnProperty.call(r.talk.original,'stip')){
    r.talk.original.stip=r.offer.stip||null;changed=true;
   }
   // Only add flavour to a genuinely new, unstarted conversation. Old saves
   // with an in-progress transcript retain exactly what was previously said.
   if(r.talk.step==='start'&&!r.talk.personalityIntro&&r.talk.log?.length===1){
    r.talk.log[0].text+=introLine(G.P(r.offer.pid),G.W(wid),r.offer);
    r.talk.personalityIntro=true;changed=true;
   }
   if(changed)G.save();
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
   log(t,p,"Let's take your original terms instead.",{
    aggressive:"Fine. My first deal still stands. Don't make me repeat it.",
    showman:"No problem. The original card is still yours if you want it.",
    traditional:"Sensible. We can work from the card as written.",
    cold:"Agreed. The original commercial terms remain."
   }[p.personality]||'The original offer remains.');
   return result();
  }
  if(t.step==='start'){
   const r=originalMove.call(G,oid,wid,move);
   if(!r.error&&t.step==='reason'&&t.log?.length){
    t.log[t.log.length-1].text=openingReply(p,t);
    G.save();
   }
   return r;
  }
  if(t.step==='reason'){
   if(typeof move!=='string'||!move.startsWith('arg:'))return {error:'Choose an argument.'};
   const arg=move.slice(4);
   if(t.retry&&t.lastArg===arg)return {error:'That argument has already failed. Choose another.'};
   if(!['crowd','reliability','trade'].includes(arg))return {error:'Choose a valid argument.'};
   // Let the existing engine apply its stipulation-specific validity and
   // preferred-stipulation rules; no unaccepted change may remain on the offer.
   const trustBefore=p.trust;
   const r=originalMove.call(G,oid,wid,move);
   if(r.error)return r;
   const engineProposal=snap(o),engineKind=t.verdict;
   apply(o,t.original);
   p.trust=trustBefore; // Relationship penalties are applied once, below.
   t.lastArg=arg;
   const measured=pressure(o,w,t,arg),v=profile(p);
   t.strength=measured.strength;t.threshold=measured.threshold;
   const kind=t.topic==='stip'?engineKind:
    measured.strength>=measured.threshold?'agreed':
    measured.strength>=measured.threshold-17?'counter':'refused';
   const proposal=kind==='refused'?null:
    t.topic==='stip'?engineProposal:adjusted(o,t,kind==='agreed'?1:.5);
   t.kind=kind;t.full=adjusted(o,t,1);
   t.verdict=null;t.proposal=proposal;t.pushes=0;
   if(kind==='agreed'){
    t.step='offer';t.detail=offerText(o,w,proposal);
    t.log[t.log.length-1].text=caseReply(p,t,'agreed',t.detail);
   }else if(kind==='counter'){
    t.step='counter';t.detail=offerText(o,w,proposal);
    t.log[t.log.length-1].text=caseReply(p,t,'counter',t.detail);
   }else{
    p.trust=clamp(p.trust-v.failed);
    t.cost=(t.cost||0)+v.failed;
    if(t.retry){
     missing(t,p,'Original terms remain. Your final argument was rejected (promoter trust −'+v.failed+').');
     t.log[t.log.length-1].text=caseReply(p,t,'refused','No changes. The conversation is over.');
    }else{
     t.step='challenge';
     t.log[t.log.length-1].text=caseReply(p,t,'refused',
      'You have one more argument or a chance to concede.');
     t.detail='Argument rejected; promoter trust −'+v.failed+'.';
    }
   }
   G.save();return result();
  }
  if(t.step==='challenge'){
   if(move==='reply:reframe'){
    t.step='reason';t.retry=true;
    log(t,p,'Let me try another argument.',{
     aggressive:'Make it count. I need a reason I can put in front of my crowd.',
     showman:'Tell me how this becomes a moment the audience remembers.',
     traditional:'Show me you can deliver the match exactly as promised.',
     cold:'Bring me a stronger commercial justification. This is your last attempt.'
    }[p.personality]||'Make this one count.');
    return result();
   }
   if(move==='reply:concede'){
    if(t.strength<t.threshold-27){
     missing(t,p,'No revision available. The initial invitation remains.');
     log(t,p,'What if we make a greater concession?',{
      aggressive:'That still does not help this card. Original offer only.',
      showman:'Even with that trade I cannot sell the change. Original terms.',
      traditional:'I will keep the card as written, thank you.',
      cold:'The adjustment is not justified, even at that price.'
     }[p.personality]||'The original offer stands.');
    }else{
     t.proposal=adjusted(o,t,.25);t.kind='counter';t.step='counter';t.pushes=1;
     t.detail=offerText(o,w,t.proposal);
     log(t,p,'I will settle for less to get something agreed.',
      ({
       aggressive:"A smaller concession, then. Don't push this further: ",
       showman:"If we can still make the show work, I can do this: ",
       traditional:"I can make a limited adjustment without rewriting the card: ",
       cold:"With that concession, the economics work at: "
      }[p.personality]||'One compromise: ')+t.detail+' This is final.');
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
    log(t,p,'I accept those terms.',{
     aggressive:'Good. Shake on it, then sign the paperwork.',
     showman:'Great. Now we have something to promote. Sign the contract.',
     traditional:'Very well. I will put it on the card once the contract is signed.',
     cold:'Terms accepted. Signature is required before the booking is confirmed.'
    }[p.personality]||'Sign the contract to confirm it.');
    return result();
   }
   if(t.step==='counter'&&!t.pushes&&['push:hold','push:trade'].includes(move)){
    t.pushes=1;
    if(move==='push:hold'){
     // Every promoter has a different tolerance for a hardball ultimatum.
     const v=profile(p),trustBefore=p.trust;
     p.trust=clamp(p.trust-v.hardball);t.cost=(t.cost||0)+v.hardball;
     if(t.strength>=t.threshold-v.holdWindow){
      t.proposal={...t.full};t.kind='agreed';t.step='offer';t.detail=offerText(o,w,t.proposal);
      log(t,p,'I need the full improvement. We have earned it.',
       ({
        aggressive:"You've got the nerve and the draw. Don't ask me twice. ",
        showman:"I can work with that if we make it a moment. ",
        traditional:"You have made the case. I will not revisit this. ",
        cold:"The evidence justifies the full terms, but no more. "
       }[p.personality]||'My final offer: ')+t.detail);
     }else if(trustBefore<v.pullBelow&&t.strength<t.threshold-v.pullMargin){
      log(t,p,'I want the full terms or I cannot agree.',{
       aggressive:"You don't set ultimatums for my card. Invitation withdrawn.",
       showman:"I can't build a show around an ultimatum. The booking is off.",
       traditional:"We are finished. I will not put you on this card.",
       cold:"The commercial terms are no longer available. This invitation is withdrawn."
      }[p.personality]||'This booking is withdrawn.');
      return exit(o,t,p,'The promoter withdrew the booking after hardball. Promoter trust −'+v.hardball+'.');
     }else{
      t.proposal=null;missing(t,p,'The counteroffer was withdrawn. Original terms remain. Promoter trust −'+v.hardball+'.');
      log(t,p,'I will not accept that compromise.',{
       aggressive:"Then the improvement's gone. Take the original deal.",
       showman:"That's too far. The original offer is still there, but the extra is off.",
       traditional:"I have withdrawn the adjustment. The original card remains.",
       cold:"That demand is not commercially viable. Revised terms withdrawn."
      }[p.personality]||'The revised terms are withdrawn.');
     }
     return result();
    }
    if(t.strength>=t.threshold-profile(p).tradeWindow){
     t.proposal=adjusted(o,t,.75);t.detail=offerText(o,w,t.proposal);
     log(t,p,'Could we meet a little closer to my request?',
      ({
       aggressive:"I can move this much, no more: ",
       showman:"Let's make it work for the crowd. Here's my final compromise: ",
       traditional:"One sensible adjustment, then the card is locked: ",
       cold:"A smaller correction is economically supportable: "
      }[p.personality]||'One last adjustment: ')+t.detail);
    }else{
     log(t,p,'Could we find a little more room?',{
      aggressive:"No. You've reached my limit. Counteroffer stands.",
      showman:"I want the show, but that's as far as I can go.",
      traditional:"No further changes. The counteroffer remains.",
      cold:"The numbers do not support a further revision. Counteroffer stands."
     }[p.personality]||'My existing counteroffer stands.');
    }
    return result();
   }
   return {error:'Accept the proposal or choose one permitted final response.'};
  }
  return {error:'No response is available at this stage.'};
 };
 root.OfficeNegotiationsV2={active:true,read,profileFor:pid=>{
  const p=G.P(pid);return p?profile(p):null;
 }};
})(typeof window!=='undefined'?window:globalThis);
