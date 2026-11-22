'use strict';
// Booking Negotiations V2 Phase 4: real concessions between fee, billing,
// protection and match rules, with atomic acceptance and no rule bypasses.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cutoff=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cutoff),{
 window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
 Date,Math,JSON,console
});
const G=root.OfficeGame,X=root.OfficeStips,N=root.OfficeNegotiationsV2,D=root.OfficeData;
assert.equal(N?.active,true);
assert.equal(typeof N.tradeOptions,'function');
let seq=0;
function fresh({pid='dock',trust=35,heat=17,pro=55,rep=20,focus=1,
 slot='opener',finish='lose_clean',stip,programme,title}={}){
 G.fresh();const s=G.S;s.cash=99999;s.rep=rep;s.focus=focus;
 assert.equal(G.sign('rex'),null);
 const w=G.W('rex');w.heat=heat;w.pro=pro;
 const p=G.P(pid);p.trust=trust;s.offers=[];
 const o={id:'p4-'+seq++,pid,rid:'magnus',wid:null,slot,finish,boost:1,bump:1,
  eventAbs:G.abs(),expiresAbs:G.abs()+1};
 if(stip!==undefined)o.stip=stip;
 if(programme!==undefined)o.programme=programme;
 if(title!==undefined)o.title=title;
 s.offers.push(o);
 return {s,o,w,p};
}
function ask(o,w,topic='protect',arg='trade'){
 const first=topic.startsWith('stip:')?'ask:'+topic:'ask:'+topic;
 assert.equal(G.talkMove(o.id,w.id,first).error,undefined,'legal opening request');
 assert.equal(G.talkMove(o.id,w.id,'arg:'+arg).error,undefined,'legal argument');
 return o.talk;
}
function option(o,w,id){
 const x=N.tradeOptions(o,w,o.talk).find(x=>x.id===id);
 assert.ok(x,'Expected trade '+id+' for '+o.talk.topic+'; got '+N.tradeOptions(o,w,o.talk).map(x=>x.id));
 assert.ok(x.give&&x.get&&x.hint.includes('In return:'));
 return x;
}
// An explicit 25% fee reduction buys a protected loss. No fee or finish is
// written to the original offer until the manager accepts the package.
{
 const {s,o,w,p}=fresh(),trust=p.trust,focus=s.focus,baseFee=G.purse(o,w);
 const t=ask(o,w);assert.equal(t.step,'counter');
 const x=option(o,w,'fee');
 assert.match(x.give,/Offer £/);
 assert.match(x.get,/protected loss/);
 assert.equal(s.focus,focus-1,'opening demand spent the only meeting');
 assert.equal(o.finish,'lose_clean');assert.equal(o.bump,1);
 const result=G.talkMove(o.id,w.id,'trade:fee');
 assert.equal(result.error,undefined);
 assert.equal(t.step,'offer');assert.equal(t.package.id,'fee');
 assert.equal(o.finish,'lose_clean');assert.equal(o.bump,1);
 assert.equal(t.proposal.finish,'lose_protected');
 assert.equal(t.proposal.bump,.75);
 assert.ok(G.purse({...o,...t.proposal},w)<baseFee);
 assert.equal(N.tradeOptions(o,w,t).length,0,'one trade per negotiation');
 assert.match(G.talkMove(o.id,w.id,'trade:stip').error,/not available/i);
 assert.equal(s.focus,0,'trade uses the already-spent meeting');
 assert.equal(p.trust,trust,'accepted trade should not cost additional trust');
 G.save();assert.ok(G.load(),'a pending trade must survive a career reload');
 const restored=G.S.offers.find(y=>y.id===o.id);
 assert.equal(restored.talk.package.get,t.package.get);
 assert.equal(restored.finish,'lose_clean','saved proposal must not change the live offer');
 assert.equal(G.talkMove(o.id,w.id,'reply:accept').error,undefined);
 assert.equal(restored.finish,'lose_protected');
 assert.equal(restored.bump,.75);
 assert.equal(G.book(o.id,w.id),null);
 assert.equal(G.S.card[0].finish,'lose_protected');
 assert.ok(G.S.card[0].purse<baseFee);
}
// Signing while the proposed exchange is unanswered still books the ORIGINAL.
{
 const {s,o,w}=fresh(),originalFee=G.purse(o,w);
 ask(o,w);assert.equal(G.talkMove(o.id,w.id,'trade:fee').error,undefined);
 assert.equal(G.book(o.id,w.id),null);
 assert.equal(s.card[0].finish,'lose_clean');
 assert.equal(s.card[0].purse,originalFee);
}
// The player can revert a proposed exchange without losing the first offer.
{
 const {o,w}=fresh();
 ask(o,w);
 assert.equal(G.talkMove(o.id,w.id,'trade:fee').error,undefined);
 assert.ok(o.talk.package);
 assert.equal(G.talkMove(o.id,w.id,'reply:original').error,undefined);
 assert.equal(o.talk.package,null);
 assert.equal(o.talk.proposal,null);
 assert.equal(o.finish,'lose_clean');assert.equal(o.bump,1);
}
// A different trade substitutes a favourite stipulation as the concession,
// obtaining both protection and a stipulation for a different price.
{
 const {s,o,w}=fresh();ask(o,w);
 const x=option(o,w,'stip');
 assert.match(x.give,/No disqualification/);
 assert.equal(G.talkMove(o.id,w.id,'trade:stip').error,undefined);
 assert.equal(o.stip||null,null);
 assert.equal(o.talk.proposal.finish,'lose_protected');
 assert.equal(o.talk.proposal.stip,'nodq');
 assert.equal(G.talkMove(o.id,w.id,'reply:accept').error,undefined);
 assert.equal(G.book(o.id,w.id),null);
 assert.equal(s.card[0].stip,'nodq');
 assert.equal(s.card[0].finish,'lose_protected');
}
// A fee negotiation may lower billing: financial upside, worse card slot.
// There must never be a winner reversal or an extra paid meeting.
{
 const {s,o,w}=fresh({slot:'feature'}),beforeFee=G.purse(o,w);
 ask(o,w,'fee','trade');
 const x=option(o,w,'billing');assert.match(x.give,/Feature.*Mid|feature.*mid/i);
 assert.equal(G.talkMove(o.id,w.id,'trade:billing').error,undefined);
 assert.equal(o.slot,'feature');assert.equal(o.bump,1);
 assert.equal(o.talk.proposal.slot,'mid');
 assert.equal(o.talk.proposal.bump,1.15);
 assert.equal(G.talkMove(o.id,w.id,'reply:accept').error,undefined);
 assert.equal(o.finish,'lose_clean');
 assert.equal(G.book(o.id,w.id),null);
 assert.equal(s.card[0].slot,'mid');
 assert.ok(s.card[0].purse>beforeFee);
 assert.equal(s.focus,0);
}
// A protected booked loss can be exchanged for an increased appearance fee.
// It is still a loss, never a reversal of the promoter's winner.
{
 const {o,w}=fresh({finish:'lose_protected'});
 ask(o,w,'fee','trade');
 option(o,w,'finish');
 assert.equal(G.talkMove(o.id,w.id,'trade:finish').error,undefined);
 assert.equal(o.finish,'lose_protected');
 assert.equal(o.talk.proposal.finish,'lose_clean');
 assert.equal(o.talk.proposal.bump,1.17);
 assert.equal(G.talkMove(o.id,w.id,'reply:accept').error,undefined);
 assert.equal(o.finish,'lose_clean');
}
// A cash demand can instead accept the promoter's match rules, carrying
// their fatigue/stipulation effects into the signed contract.
{
 const {s,o,w}=fresh();
 ask(o,w,'fee','trade');option(o,w,'stip');
 assert.equal(G.talkMove(o.id,w.id,'trade:stip').error,undefined);
 assert.equal(o.stip||null,null);
 assert.equal(o.talk.proposal.stip,X.favourite(G.P(o.pid)));
 assert.equal(G.talkMove(o.id,w.id,'reply:accept').error,undefined);
 assert.equal(G.book(o.id,w.id),null);
 assert.equal(s.card[0].stip,'nodq');
 assert.equal(s.card[0].finish,'lose_clean');
}
// A declined trade is final, keeps the original invitation and costs one
// trust point. It cannot be brute-forced repeatedly for free.
{
 const {s,o,w,p}=fresh({trust:20,heat:5,pro:20,rep:10});
 const t=ask(o,w,'fee','crowd');
 assert.equal(t.step,'challenge');
 option(o,w,'stip');
 const beforeTrust=p.trust,beforeFocus=s.focus;
 assert.equal(G.talkMove(o.id,w.id,'trade:stip').error,undefined);
 assert.equal(t.step,'done');assert.equal(t.verdict,'refused');
 assert.equal(p.trust,beforeTrust-1);
 assert.equal(s.focus,beforeFocus);
 assert.equal(o.stip||null,null);assert.equal(o.bump,1);
 assert.match(G.talkMove(o.id,w.id,'trade:stip').error,/complete/i);
}
// The signed finish and existing DQ/title/programme rules determine which
// exchanges are legal. A client cannot inject an unavailable package.
{
 const {s,o,w,p}=fresh({finish:'win_dq',slot:'feature'});
 ask(o,w,'fee','trade');
 assert.equal(N.tradeOptions(o,w,o.talk).some(x=>x.id==='stip'),false);
 const priorFocus=s.focus,priorTrust=p.trust;
 assert.match(G.talkMove(o.id,w.id,'trade:stip').error,/not available/i);
 assert.equal(s.focus,priorFocus);assert.equal(p.trust,priorTrust);
 assert.equal(o.stip||null,null);
}
{
 const {o,w}=fresh({finish:'lose_protected',slot:'feature',title:{pid:'dock',div:'men'}});
 ask(o,w,'fee','trade');
 assert.equal(N.tradeOptions(o,w,o.talk).some(x=>['billing','finish','stip'].includes(x.id)),false);
}
{
 const {o,w}=fresh({programme:{beats:[]},slot:'feature'});
 ask(o,w,'fee','trade');
 assert.equal(N.tradeOptions(o,w,o.talk).length,0);
 assert.match(G.talkMove(o.id,w.id,'trade:billing').error,/not available/i);
}
{
 const {s,o,w,p}=fresh();
 const focus=s.focus,trust=p.trust;
 assert.equal(N.tradeOptions(o,w,{step:'start',topic:'fee',original:{slot:o.slot,finish:o.finish,stip:null,bump:1,fee:G.purse(o,w)}}).length,0);
 assert.match(G.talkMove(o.id,w.id,'trade:fee').error,/not available/i);
 assert.equal(s.focus,focus);assert.equal(p.trust,trust);
}
// Requesting a stipulation can itself be traded against fee when the
// promoter's first response was refusal (the rules are still validated).
{
 const {s,o,w}=fresh({pid:'crown',trust:35,heat:40,pro:75,rep:35});
 const t=ask(o,w,'stip:falls','reliability');
 assert.equal(t.step,'challenge');
 option(o,w,'fee');
 assert.equal(G.talkMove(o.id,w.id,'trade:fee').error,undefined);
 assert.equal(o.stip||null,null);
 assert.equal(o.talk.proposal.stip,'falls');
 assert.equal(o.talk.proposal.bump,.8);
 assert.equal(G.talkMove(o.id,w.id,'reply:accept').error,undefined);
 assert.equal(G.book(o.id,w.id),null);
 assert.equal(s.card[0].stip,'falls');
 assert.equal(s.card[0].minutes,D.SLOTS.opener.mins+5);
}
console.log('PASS negotiation Phase 4: fee, billing, protection, match-rule trades, signing and guards');
