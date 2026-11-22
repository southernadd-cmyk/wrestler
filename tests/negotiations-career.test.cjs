'use strict';
// Phase 5: genuine, saved contract and promoter history throughout the career.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
const G=root.OfficeGame,C=root.OfficeNegotiationCareer,N=root.OfficeNegotiationsV2;
assert.equal(C?.active,true);
let next=0;
const finish=(opts={})=>({stars:3.75,crowd:65,crowdPeak:70,outcome:'booked',botches:0,script:.9,
 adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:10,plan:'story',stamina:55,
 injury:0,ignored:0,callsUsed:[],log:[],...opts});
function fixture({pid='dock',wid='rex',slot='opener',finish='lose_clean',expires=0,delay=0}={}){
 G.fresh();const s=G.S;s.cash=99999;s.rep=65;s.focus=2;
 assert.equal(G.sign(wid),null);
 s.offers=[];const o={id:'career-offer-'+next++,pid,rid:'magnus',wid:null,
  slot,finish,bump:1,boost:1,eventAbs:G.abs()+delay,expiresAbs:G.abs()+expires};
 s.offers.push(o);G.save();
 return {s,o,p:G.P(pid),w:G.W(wid)};
}
function signAgreed(o,wid='rex'){
 assert.equal(G.talkMove(o.id,wid,'ask:protect').error,undefined);
 assert.equal(G.talkMove(o.id,wid,'arg:crowd').error,undefined);
 assert.ok(['counter','offer'].includes(o.talk.step),'Promoter should provide a proposal');
 assert.equal(G.talkMove(o.id,wid,'reply:accept').error,undefined);
 assert.equal(G.book(o.id,wid),null);
 const c=[...G.S.card,...G.S.futureBookings].find(x=>x.wid===wid&&x.pid===o.pid);
 assert.ok(c,'The accepted booking is signed');
 const row=C.ledger().find(x=>x.cid===c.id);
 assert.equal(row?.mode,'negotiated');
 assert.equal(row.status,'scheduled');
 return {c,row};
}
// Opening a negotiation or signing directly must remain free and unambiguous.
{
 const {s,o,p}=fixture(),focus=s.focus,trust=p.trust;
 assert.equal(C.ledger().length,0);
 assert.equal(G.meeting(o.id,'rex').error,undefined);
 assert.equal(s.focus,focus);
 assert.equal(G.book(o.id,'rex'),null);
 assert.equal(s.focus,focus);
 assert.equal(p.trust,trust);
 assert.equal(C.ledger().filter(x=>x.kind==='signed').length,1);
 assert.equal(C.ledger()[0].mode,'direct');
}
// A signed agreement carries original, accepted and event-date terms
// through a reload, including future bookings and the same contract ID.
{
 const {o,s}=fixture({delay:1,expires:0});
 const {c,row}=signAgreed(o);
 assert.ok(s.futureBookings.some(x=>x.id===c.id));
 assert.equal(c.negotiation.topic,'protect');
 assert.equal(row.original.finish,'lose_clean');
 assert.equal(row.agreed.finish,'lose_protected');
 assert.equal(row.eventAbs,G.abs()+1);
 const cid=c.id,focus=s.focus;
 assert.ok(G.load());
 assert.equal(G.S.focus,focus);
 assert.equal(G.S.futureBookings.find(x=>x.id===cid)?.negotiation.topic,'protect');
 assert.equal(C.ledger().find(x=>x.cid===cid)?.status,'scheduled');
 G.endWeek(); // contract is due this week and moves to the live card
 assert.ok(G.S.card.some(x=>x.id===cid));
 assert.equal(C.ledger().find(x=>x.cid===cid)?.status,'scheduled');
 const booked=G.S.card.find(x=>x.id===cid);
 const beforeP=G.P('dock').trust;
 const out=G.applyResult(booked,finish());
 const completed=C.ledger().find(x=>x.cid===cid);
 assert.equal(completed.status,'fulfilled');
 assert.equal(completed.contractHonoured,true);
 assert.equal(completed.stars,3.75);
 assert.equal(completed.trustDelta,2);
 assert.match(out.map(x=>x.text).join(' '),/negotiated agreement.*Trust \+2/);
 assert.equal(G.S.history.find(x=>x.cid===cid)?.finish,'lose_protected');
 assert.ok(G.P('dock').trust>=beforeP-20,'ordinary match consequences still run');
 assert.equal(C.memory('dock','rex').status,'fulfilled');
 assert.match(C.memory('dock','rex').evidence,/3\.75 stars/);
 // The completed result is idempotent, even if processed again.
 G.applyResult(booked,finish());
 assert.equal(C.ledger().find(x=>x.cid===cid).trustDelta,2);
 assert.equal(C.ledger().filter(x=>x.cid===cid).length,1);
 const historyOffer={id:'memory-'+next++,pid:'dock',rid:'magnus',wid:null,
  slot:'mid',finish:'lose_clean',boost:1,bump:1,eventAbs:G.abs(),expiresAbs:G.abs()};
 G.S.offers=[historyOffer];G.save();
 assert.match(G.meeting(historyOffer.id,'rex').talk.log[0].text,/delivered on our last negotiated contract/i);
 assert.match(N.read(historyOffer,G.W('rex')).evidence,/honoured.*3\.75 stars/);
 assert.ok(G.load(),'completed contract and memory survive another reload');
 assert.equal(C.memory('dock','rex').status,'fulfilled');
}
// Failure to honour a signed revision has a distinct, once-only penalty,
// in addition to the game's existing match and promoter trust calculation.
{
 const {o}=fixture();const {c}=signAgreed(o);
 const out=G.applyResult(c,finish({outcome:'double',contractHonoured:false}));
 const row=C.ledger().find(x=>x.cid===c.id);
 assert.equal(row.status,'broken');
 assert.equal(row.trustDelta,-3);
 assert.match(out.map(x=>x.text).join(' '),/negotiated contract was not honoured.*Trust −3/);
 assert.match(C.memory('dock','rex').line,/finish did not happen/i);
 G.applyResult(c,finish({outcome:'double',contractHonoured:false}));
 assert.equal(C.ledger().find(x=>x.cid===c.id).trustDelta,-3);
}
// Original terms signed after a paid discussion must not masquerade as a
// negotiated improvement; a pending trade cannot silently become a contract.
{
 const {o,s}=fixture();
 assert.equal(G.talkMove(o.id,'rex','ask:protect').error,undefined);
 assert.equal(G.book(o.id,'rex'),null);
 const row=C.ledger().find(x=>x.kind==='signed');
 assert.equal(row.mode,'original-after-talk');
 assert.equal(s.card[0].finish,'lose_clean');
 assert.equal(row.original.finish,row.agreed.finish);
}
// Cancellation uses the game's existing trust cost and persists the fact of a
// cancelled booking; it does not invent a completed match or double-penalise.
{
 const {o}=fixture({delay:1});
 const {c}=signAgreed(o),p=G.P('dock'),before=p.trust;
 G.unbook(c.id);
 assert.equal(C.ledger().find(x=>x.cid===c.id).status,'cancelled');
 assert.equal(p.trust,before-6);
 assert.match(C.memory('dock','rex').evidence,/booking cancelled/i);
 assert.ok(G.load());
 assert.equal(C.memory('dock','rex').status,'cancelled');
}
// A paid discussion not signed before its deadline expires as the week moves
// forward: it generates one grounded inbox notice and never refunds focus.
{
 const {o,s}=fixture({delay:2});
 const mid=s.focus;
 assert.equal(G.talkMove(o.id,'rex','ask:protect').error,undefined);
 assert.equal(s.focus,mid-1);
 const oid=o.id;
 G.endWeek();
 assert.equal(s.offers.some(x=>x.id===oid),false);
 const lapses=C.ledger().filter(x=>x.offerId===oid);
 assert.equal(lapses.length,1);assert.equal(lapses[0].status,'expired');
 assert.ok(s.inbox.some(x=>/Negotiation deadline passed/.test(x.subject)));
 assert.equal(G.meeting(oid,'rex').error!==undefined,true);
 assert.equal(s.focus,2,'the next week restores focus normally, not as a refund');
 assert.ok(G.load());
 assert.equal(C.ledger().filter(x=>x.offerId===oid).length,1);
 assert.match(C.memory('dock','rex').line,/never signed/i);
}
// Deadline protection must also work with stale or imported saves even when
// an expired offer still exists in the array.
{
 const {o,s}=fixture();
 o.expiresAbs=G.abs()-1;const focus=s.focus;
 assert.match(G.meeting(o.id,'rex').error,/expired/i);
 assert.match(G.talkMove(o.id,'rex','ask:fee').error,/expired/i);
 assert.match(G.book(o.id,'rex'),/expired/i);
 assert.equal(s.focus,focus);
 assert.equal(s.card.length,0);
}
// Legacy saves without any new journal load untouched and preserve the
// in-progress dialogue, reserved wrestler and previously spent meeting.
{
 const {o,s}=fixture({delay:1,expires:1});
 assert.equal(G.talkMove(o.id,'rex','ask:protect').error,undefined);
 const focus=s.focus;
 const saved=JSON.parse(store.get('the-office-v22'));
 delete saved.negotiationLedger;
 store.set('the-office-v22',JSON.stringify(saved));
 assert.ok(G.load());
 assert.equal(G.S.focus,focus);
 assert.equal(C.ledger().length,0);
 assert.equal(G.S.offers.find(x=>x.id===o.id)?.talk.step,'reason');
 assert.equal(G.talkMove(o.id,'rex','arg:crowd').error,undefined);
}
// The journal remains bounded even after multiple career events.
{
 const {o}=fixture();
 const s=G.S;
 s.negotiationLedger=Array.from({length:97},(_,i)=>({key:'old-'+i,kind:'discussion',status:'expired',pid:'dock',wid:'rex',at:i}));
 G.save();assert.ok(G.load());
 assert.equal(C.ledger().length,80);
 assert.ok(!G.S.negotiationLedger.some(x=>x.key==='old-96'));
}
console.log('PASS negotiation career: deadlines, persistence, signed terms, promises, memory and idempotence');
