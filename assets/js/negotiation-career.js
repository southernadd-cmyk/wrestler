/* Booking Negotiations V2 — Phase 5: career continuity.
   Use the existing match, contract, deadline and promoter trust systems. Keep
   a compact journal of actual events, never fabricated or speculative memory.
   This module is loaded after the existing booking/result/week wrappers. */
(function installNegotiationCareer(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData;
 if(!G)return;
 const LIMIT=80,clamp=x=>Math.max(0,Math.min(100,x));
 const now=()=>G.abs();
 const ledger=()=>{
  if(!G.S)return [];
  if(!Array.isArray(G.S.negotiationLedger))G.S.negotiationLedger=[];
  return G.S.negotiationLedger;
 };
 const write=x=>{
  const list=ledger();
  if(list.some(y=>y.key===x.key))return null;
  list.unshift(x);if(list.length>LIMIT)list.length=LIMIT;
  G.save();return x;
 };
 const record=(cid)=>ledger().find(x=>x.cid===cid&&x.kind==='signed');
 function promoterCancelled(cid,reason){const row=record(cid);if(!row||row.status!=='scheduled')return false;row.status='promoter_cancelled';row.settledAt=now();row.reason=reason;G.save();return true;}
 const meaningful=o=>o?.talk?.step&&o.talk.step!=='start';
 const deadlinePassed=o=>Number.isFinite(o?.expiresAbs)&&o.expiresAbs<now()||
  Number.isFinite(o?.eventAbs)&&o.eventAbs<now();
 const originalFresh=G.fresh;
 G.fresh=function(...args){
  const result=originalFresh.apply(this,args);
  if(G.S){G.S.negotiationLedger=[];G.save();}
  return result;
 };
 const originalLoad=G.load;
 G.load=function(...args){
  const result=originalLoad.apply(this,args);
  if(result&&(!Array.isArray(G.S.negotiationLedger)||G.S.negotiationLedger.length>LIMIT)){
   G.S.negotiationLedger=Array.isArray(G.S.negotiationLedger)?G.S.negotiationLedger.slice(0,LIMIT):[];
   G.save();
  }
  return result;
 };
 const originalMeeting=G.meeting;
 G.meeting=function(oid,wid){
  const o=G.S?.offers?.find(x=>x.id===oid);
  if(o&&deadlinePassed(o))return {error:'This invitation has expired. No further negotiation or signature is possible.'};
  return originalMeeting.call(this,oid,wid);
 };
 const originalMove=G.talkMove;
 G.talkMove=function(oid,wid,move){
  const o=G.S?.offers?.find(x=>x.id===oid);
  const r=originalMove.call(this,oid,wid,move);
  if(r?.withdrawn&&o&&meaningful(o)){
   const withdrew=r.talk?.verdict==='walked'&&move==='reply:walk';
   write({key:'walk:'+oid,kind:'discussion',status:withdrew?'walked':'withdrawn',
    offerId:oid,pid:o.pid,wid,topic:o.talk?.topic||null,at:now(),
    eventAbs:o.eventAbs,expiresAbs:o.expiresAbs});
  }
  return r;
 };
 const originalBook=G.book;
 G.book=function(oid,wid){
  const o=G.S?.offers?.find(x=>x.id===oid);
  if(o&&deadlinePassed(o))return 'This invitation has expired. The match date or reply deadline has passed.';
  const before=new Set([...(G.S?.card||[]),...(G.S?.futureBookings||[])].map(c=>c.id));
  const talk=o?.talk,orig=talk?.original;
  const accepted=!!talk&&talk.step==='done'&&['agreed','counter'].includes(talk.verdict);
  const mode=accepted?'negotiated':meaningful(o)?'original-after-talk':'direct';
  const reason=typeof talk?.topic==='string'?talk.topic:null;
  const packageCopy=accepted&&talk.package?
   {id:talk.package.id,give:talk.package.give,get:talk.package.get}:null;
  const result=originalBook.call(this,oid,wid);
  if(result!=null||!o||o.programme)return result;
  const c=[...(G.S.card||[]),...(G.S.futureBookings||[])].find(x=>!before.has(x.id)&&
   x.pid===o.pid&&x.wid===wid&&x.eventAbs===o.eventAbs&&x.rid===o.rid);
  if(!c)return result;
  const priorFee=Number.isFinite(orig?.fee)?orig.fee:c.purse;
  const entry=write({key:'signed:'+c.id,kind:'signed',status:'scheduled',cid:c.id,
   offerId:oid,pid:c.pid,wid:c.wid,rid:c.rid,eventAbs:c.eventAbs,at:now(),
   mode,topic:reason,trade:packageCopy,
   original:{slot:orig?.slot||c.slot,finish:orig?.finish||c.finish,
    stip:orig?.stip||null,fee:priorFee},
   agreed:{slot:c.slot,finish:c.finish,stip:c.stip||null,fee:c.purse}});
  if(entry&&mode==='negotiated'){
   c.negotiation={offerId:oid,topic:reason,trade:packageCopy,originalFee:priorFee};
   G.save();
  }
  return result;
 };
 const originalUnbook=G.unbook;
 G.unbook=function(cid){
  const exists=[...(G.S?.card||[]),...(G.S?.futureBookings||[])].some(x=>x.id===cid);
  const outcome=originalUnbook.call(this,cid);
  if(exists&&![...(G.S?.card||[]),...(G.S?.futureBookings||[])].some(x=>x.id===cid)){
   const row=record(cid);
   if(row&&row.status==='scheduled'){row.status='cancelled';row.settledAt=now();G.save();}
  }
  return outcome;
 };
 G.registerResultStage('negotiation-career',originalApply=>function(c,fin){
  const r=originalApply.call(this,c,fin);
  const row=c?.id&&record(c.id);
  if(!row||row.status!=='scheduled')return r;
  const match=G.S?.history?.find(h=>h.cid===c.id);
  if(!match)return r; // No recorded result; never invent one.
  const honoured=!!match.contractHonoured;
  row.status=honoured?'fulfilled':'broken';
  row.settledAt=now();row.stars=Number(match.stars)||0;row.contractHonoured=honoured;
  row.actualOutcome=match.outcome||null;
  // The match itself already changes trust. A negotiated agreement carries a
  // small additional memory consequence, at most once for each match ID.
  const delta=row.mode==='negotiated'?(honoured&&row.stars>=3?2:honoured?0:-3):0;
  row.trustDelta=delta;
  if(delta){
   const p=G.P(row.pid);if(p)p.trust=clamp(p.trust+delta);
   if(Array.isArray(r))r.push({text:(p?.name||'Promoter')+
    (delta>0?' recognised that you delivered on the negotiated agreement. Trust +2.':
     ' remembers the negotiated contract was not honoured. Trust −3.'),tone:Math.sign(delta)});
  }
  G.save();return r;
 });
 const originalEndWeek=G.endWeek;
 G.endWeek=function(...args){
  const week=now(),outstanding=(G.S?.offers||[])
   .filter(meaningful).map(o=>({id:o.id,pid:o.pid,wid:o.talk.wid,
    topic:o.talk.topic,eventAbs:o.eventAbs,expiresAbs:o.expiresAbs}));
  const result=originalEndWeek.apply(this,args);
  if(!G.S||now()===week)return result;
  const surviving=new Set(G.S.offers.map(o=>o.id));
  for(const o of outstanding){
   if(surviving.has(o.id))continue;
   const expired=o.expiresAbs<now()||o.eventAbs<now();
   const added=write({key:'lapsed:'+o.id,kind:'discussion',status:expired?'expired':'unavailable',
    offerId:o.id,pid:o.pid,wid:o.wid,topic:o.topic,at:now(),
    eventAbs:o.eventAbs,expiresAbs:o.expiresAbs});
   if(added){
    const p=G.P(o.pid),w=G.W(o.wid);
    G.msg({from:(p?.voice||'Promoter')+', '+(p?.name||'The promoter'),
     subject:expired?'Negotiation deadline passed':'Negotiated offer no longer available',kind:'info',
     body:[(w?.short||'Your wrestler')+' had discussed new booking terms for '+(p?.name||'the promotion')+
      ', but no contract was signed before the offer '+(expired?'expired.':'became unavailable.'),
      'The original and proposed terms are no longer available. The management meeting used for that discussion is not refunded. No further promoter trust penalty applies.']});
   }
  }
  // A signed future booking may fall through before the show due to injury.
  // The original career already applies trust penalties and inbox notices.
  const active=new Set([...G.S.card,...G.S.futureBookings].map(c=>c.id));
  for(const row of ledger())if(row.kind==='signed'&&row.status==='scheduled'&&row.eventAbs<now()&&
   !active.has(row.cid)&&!G.resultRecorded({id:row.cid})){
   row.status='unfulfilled';row.settledAt=now();
  }
  G.save();return result;
 };
 // Read-only context, derived exclusively from persisted facts and actual
 // results. No hidden relationship score and no synthetic past bookings.
 const memory=(pid,wid)=>{
  const last=ledger().find(x=>x.pid===pid&&x.wid===wid&&
   ['fulfilled','broken','cancelled','promoter_cancelled','unfulfilled','expired','unavailable','walked','withdrawn'].includes(x.status));
  if(!last)return null;
  const wrestler=G.W(wid)?.short||'Your wrestler';
  let line='',evidence='';
  if(last.status==='fulfilled'){
   const stars=Number.isFinite(last.stars)?last.stars.toFixed(2):null;
   line=last.mode==='negotiated'?'You delivered on our last negotiated contract. I noticed.':
    'Our last booked match went ahead as agreed.';
   evidence=(last.mode==='negotiated'?'Previous negotiated booking':'Previous booking')+
    ' honoured'+(stars?' · '+stars+' stars':'')+'.';
  }else if(last.status==='broken'){
   line='The agreed finish did not happen last time. That still matters to me.';
   evidence='Previous booked finish was not honoured'+
    (Number.isFinite(last.stars)?' · '+last.stars.toFixed(2)+' stars':'')+'.';
  }else if(last.status==='cancelled'){
   line='You cancelled a booking we had signed. I remember the gap on my card.';
   evidence='Signed booking cancelled before the show.';
  }else if(last.status==='promoter_cancelled'){
   line='We withdrew that title booking ourselves. That was not your fault.';
   evidence='Promoter cancelled an invalid title contract without a trust penalty.';
  }else if(last.status==='unfulfilled'){
   line='Our agreed date fell through last time. I need to know you can deliver.';
   evidence='Signed match not completed on its scheduled date.';
  }else if(last.status==='expired'||last.status==='unavailable'){
   line='We discussed that last offer, but never signed before it went away.';
   evidence='Previous booking discussion ended without a signature.';
  }else if(last.status==='walked'){
   line='You walked away from our last discussion. We can try again.';
   evidence='Previous negotiation ended when you withdrew.';
  }else{
   line='The last hardball discussion ended without a booking.';
   evidence='Previous invitation withdrawn after negotiation.';
  }
  return {status:last.status,line,evidence,wrestler,at:last.at,mode:last.mode||null};
 };
 root.OfficeNegotiationCareer={active:true,memory,promoterCancelled,ledger:()=>ledger().map(x=>({...x}))};
})(typeof window!=='undefined'?window:globalThis);
