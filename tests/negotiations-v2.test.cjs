'use strict';
// Booking negotiations V2: proposals, real costs and safe contract state.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{
 window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
 Date,Math,JSON,console
});
const G=root.OfficeGame;
assert.equal(root.OfficeNegotiationsV2?.active,true,'V2 module should be loaded');
let seq=0;
function setup({trust=64,heat=77,pro=85,rep=65,focus=2,finish='lose_clean',pid='dock'}={}){
 G.fresh();const s=G.S;s.cash=99999;s.rep=rep;s.focus=focus;
 const err=G.sign('rex');assert.equal(err,null);
 G.P(pid).trust=trust;G.W('rex').heat=heat;G.W('rex').pro=pro;
 s.offers=[];
 const o={id:'v2'+seq++,pid,rid:'magnus',wid:null,slot:'opener',finish,
  boost:1,bump:1,eventAbs:G.abs(),expiresAbs:G.abs()+1};
 s.offers.push(o);return {s,o,w:G.W('rex'),p:G.P(pid)};
}
const select=(o,topic='protect',arg='crowd')=>{
 assert.ok(!G.talkMove(o.id,'rex','ask:'+topic).error);
 const result=G.talkMove(o.id,'rex','arg:'+arg);assert.ok(!result.error,result.error);
 return o.talk;
};
// Signing unchanged is fast and safe: management meetings and trust remain intact.
{
 const {s,o,p}=setup(),focus=s.focus,trust=p.trust;
 assert.equal(G.book(o.id,'rex'),null);
 assert.equal(s.focus,focus);assert.equal(p.trust,trust);
 assert.equal(s.card[0].finish,'lose_clean');
}
// An opening conversation costs nothing, but an actual request uses a meeting.
{
 const {s,o}=setup({focus:1}),f0=s.focus;
 assert.equal(G.meeting(o.id,'rex').talk.step,'start');
 assert.equal(s.focus,f0,'reading terms is free');
 const t=select(o);
 assert.equal(s.focus,0,'a demand uses the final weekly management meeting');
 assert.equal(t.step,'offer');
 assert.equal(o.finish,'lose_clean','original offer must not change while proposals are unaccepted');
 assert.equal(t.proposal.finish,'lose_protected');
 assert.ok(!G.talkMove(o.id,'rex','reply:accept').error);
 assert.equal(o.finish,'lose_protected','revised terms only take effect on approval');
 assert.equal(t.step,'done');
 assert.equal(s.focus,0);
 assert.equal(G.book(o.id,'rex'),null);
 assert.equal(s.card[0].finish,'lose_protected');
}
// Even if the promoter agrees, the manager may sign the original terms.
{
 const {s,o}=setup();select(o);
 assert.equal(G.book(o.id,'rex'),null);
 assert.equal(s.card[0].finish,'lose_clean','unaccepted proposal cannot silently affect a signed contract');
}
// Refusing an implausible demand has relationship and opportunity costs.
{
 const {s,o,p}=setup({trust:25,heat:10,pro:40,rep:20});
 const old=p.trust, focus=s.focus;
 const t=select(o,'protect','reliability');
 assert.equal(t.step,'challenge');
 assert.equal(s.focus,focus-1);
 assert.ok(p.trust<=old-2,'weak argument must incur a visible trust cost');
 assert.equal(t.cost,3,'Gaz takes a larger trust penalty for an unconvincing demand');
 assert.equal(o.finish,'lose_clean');
 assert.ok(!G.talkMove(o.id,'rex','reply:original').error);
 assert.equal(t.step,'done');
 assert.equal(G.book(o.id,'rex'),null);
}
// A better counter requires giving something tangible: no free upward
// push remains. The manager may make one package offer then accept it.
{
 const {o}=setup({trust:35,heat:17,pro:55,rep:20});
 const t=select(o,'protect','trade');
 assert.equal(t.step,'counter');
 assert.equal(o.finish,'lose_clean');
 assert.match(G.talkMove(o.id,'rex','push:trade').error,/concrete concession/i);
 assert.equal(t.step,'counter');
 assert.ok(root.OfficeNegotiationsV2.tradeOptions(o,G.W('rex'),t).some(x=>x.id==='fee'));
 assert.ok(!G.talkMove(o.id,'rex','trade:fee').error);
 assert.equal(t.step,'offer');
 assert.ok(t.proposal);assert.ok(t.package);
 assert.match(G.talkMove(o.id,'rex','trade:fee').error,/not available/i,
  'repeated trade requests must be prohibited');
 assert.ok(!G.talkMove(o.id,'rex','reply:accept').error);
 assert.equal(t.step,'done');
 assert.equal(o.finish,'lose_protected');
}
// A star can still bargain for cash, but the agreed raise costs goodwill
// even if the promoter is persuaded. Signing directly avoids that cost.
{
 for(const [pid,cost] of [['dock',2],['pulse',1],['crown',2],['union',3]]){
  const {o,w,p,s}=setup({pid,trust:80,heat:85,pro:92,rep:90});
  const base=G.purse(o,w),old=p.trust;
  const t=select(o,'fee','trade');
  assert.ok(['counter','offer'].includes(t.step),pid+' must make a valid proposal');
  assert.equal(p.trust,old,'successful argument should not charge before accepting');
  assert.ok(!G.talkMove(o.id,w.id,'reply:accept').error);
  assert.ok(G.purse(o,w)>base,'accepted fee proposal must raise cash');
  assert.equal(p.trust,old-cost,pid+' pay raise incurs transparent promoter trust cost');
  assert.equal(t.feeCost,cost);
  assert.equal(s.focus,1,'one management meeting used');
  assert.equal(G.book(o.id,w.id),null);
  assert.ok(s.card[0].purse>base);
 }
}
{
 const {o,p}=setup({pid:'union',trust:80,heat:85,pro:92,rep:90});
 const trust=p.trust;
 const t=select(o,'fee','trade');
 assert.ok(['counter','offer'].includes(t.step));
 assert.ok(!G.talkMove(o.id,'rex','reply:original').error);
 assert.equal(p.trust,trust,'signing original after discussing money does not pay the accepted-raise trust cost');
 assert.equal(G.book(o.id,'rex'),null);
}
// Hardball against a low-trust promoter can lose the full invitation.
{
 const {s,o,p}=setup({trust:35,heat:17,pro:55,rep:20});
 const t=select(o,'protect','trade');assert.equal(t.step,'counter');
 const r=G.talkMove(o.id,'rex','push:hold');
 assert.equal(r.withdrawn,true,'hardball should be able to lose the booking');
 assert.ok(!s.offers.some(x=>x.id===o.id));
 assert.ok(p.trust<35);
}
// A voluntarily abandoned negotiation really removes the booking.
{
 const {s,o}=setup();
 select(o);
 const r=G.talkMove(o.id,'rex','reply:walk');
 assert.equal(r.withdrawn,true);
 assert.equal(s.offers.length,0);
}
// Stipulation proposals never override disqualification restrictions.
{
 const {o}=setup({finish:'lose_dq'});
 assert.match(G.talkMove(o.id,'rex','ask:stip:nodq').error||'',/disqualification/i);
 assert.equal(o.stip,undefined);
}
console.log('PASS Negotiations V2: safe original signature, costly failures, pending offers, counteroffers and withdrawal');
