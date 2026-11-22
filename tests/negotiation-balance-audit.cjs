'use strict';
// Phase 6 negotiation balancing: a deterministic scenario sweep of the LIVE
// shipped game rules, not a mock probability calculation or generated fixtures.
// Run: node tests/negotiation-balance-audit.cjs
const assert=require('node:assert/strict'),vm=require('node:vm'),{script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const storage=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}});
const G=root.OfficeGame,N=root.OfficeNegotiationsV2,D=root.OfficeData;
const ids=['dock','pulse','crown','union'],topics=['fee','slot','protect'],args=['crowd','reliability','trade'],
 styles=['Brawl','Story','Spectacle','Technical'],
 levels=[
  {id:'rookie',trust:25,heat:20,pro:45,rep:50},
  {id:'developing',trust:40,heat:40,pro:60,rep:55},
  {id:'established',trust:60,heat:65,pro:78,rep:70},
  {id:'star',trust:80,heat:85,pro:92,rep:90}
 ];
 let serial=0;
function start(pid,level,style,topic,arg,slot){
 G.fresh();
 const s=G.S;s.cash=100000;s.rep=level.rep;s.focus=2;
 assert.equal(G.sign('rex'),null,'audit needs an eligible male wrestler');
 const w=G.W('rex'),p=G.P(pid);
 p.trust=level.trust;w.heat=level.heat;w.pro=level.pro;w.style=style;
 const o={id:'audit-'+(++serial),pid,rid:'magnus',wid:null,slot,finish:'lose_clean',
  bump:1,boost:1,eventAbs:G.abs(),expiresAbs:G.abs()+1};
 s.offers=[o];const oldFee=G.purse(o,w),oldRank=D.SLOTS[o.slot].rank;
 assert.equal(G.meeting(o.id,w.id).error,undefined);
 assert.equal(s.focus,2,'reading original terms is free');
 const ask=G.talkMove(o.id,w.id,'ask:'+topic);
 assert.equal(ask.error,undefined,'request must be legal in audit '+topic);
 assert.equal(s.focus,1,'one meeting spent');
 const response=G.talkMove(o.id,w.id,'arg:'+arg);
 assert.equal(response.error,undefined,'argument must be legal in audit '+arg);
 return {s,w,p,o,t:o.talk,oldFee,oldRank};
}
const per={};const byLevel={},byArg={};let total=0,banned=0,hardball=0,withdrawn=0,
 hardballWon=0,hardballLostCounter=0,tradeAvailable=0,tradeAccepted=0,
 acceptedFeeTrustCost=0,acceptedFeeRaises=0,
 casesWithNoChoice=0,originalAltered=0,feeUnchanged=0;
function counter(map,key){return map[key]||(map[key]={n:0,agreed:0,counter:0,rejected:0,
 feeGain:0,feeLoss:0,slotUp:0,protected:0,trustLost:0,offerWithdrawn:0,hardballWon:0,hardballTried:0});}
for(const pid of ids)for(const lv of levels)for(const style of styles)for(const topic of topics)for(const arg of args){
 const slot=lv.id==='star'?'feature':'mid';
 const x=start(pid,lv,style,topic,arg,slot),{s,p,o,t,w,oldFee,oldRank}=x;
 const key=pid+':'+topic;
 const series=[counter(per,key),counter(byLevel,lv.id+':'+topic),counter(byArg,pid+':'+topic+':'+arg)];
 total++;
 const stage=t.step;
 assert.ok(['offer','counter','challenge'].includes(stage),'known first response: '+stage);
 assert.equal(o.bump,1,'opening argument cannot silently update original offer');
 assert.equal(o.slot,slot);assert.equal(o.finish,'lose_clean');
 for(const b of series){b.n++;if(stage==='offer')b.agreed++;else if(stage==='counter')b.counter++;else b.rejected++;
  b.trustLost+=lv.trust-p.trust;}
 if(stage==='counter'||stage==='offer'){
  const proposal=t.proposal;
  assert.ok(proposal);
  const proposedFee=G.purse({...o,...proposal},w);
  // A player must not receive an automatic cash raise AND higher billing.
  if(topic==='slot')assert.ok(proposedFee<oldFee,
   'Improved billing must have a genuinely lower GUARANTEED fee');
  if(topic==='fee')assert.ok(proposedFee>oldFee,
   'An agreed pay demand must be a genuine pay increase');
  if(topic==='protect')assert.ok(proposedFee<oldFee,
   'Protecting an agreed clean loss must give back money');
  for(const b of series){
   b.feeGain+=Math.max(0,proposedFee-oldFee);
   b.feeLoss+=Math.max(0,oldFee-proposedFee);
   b.slotUp+=Number(D.SLOTS[proposal.slot].rank>oldRank);
   b.protected+=Number(proposal.finish==='lose_protected');
  }
  if(stage==='counter'){
   const choices=N.tradeOptions(o,w,t);
   if(choices.length)tradeAvailable++;
   else casesWithNoChoice++;
   // If we take one supported trade, check the economic terms really change.
   if(choices.length){
    const candidate=choices[0];
    const tr=G.talkMove(o.id,w.id,'trade:'+candidate.id);
    assert.equal(tr.error,undefined);
    if(o.talk.step==='offer'){
     tradeAccepted++;
     if(topic==='fee'){
      const before=p.trust;
      assert.equal(G.talkMove(o.id,w.id,'reply:accept').error,undefined);
      const cost=N.profileFor(pid).feeRaiseCost;
      assert.equal(p.trust,before-cost,'accepted fee raise must have promoter cost');
      acceptedFeeTrustCost+=cost;acceptedFeeRaises++;
     }
    }
   }
   const y=start(pid,lv,style,topic,arg,slot),p0=y.p.trust;
   assert.equal(y.t.step,'counter','hardball subscenario must be comparable');
   const outcome=G.talkMove(y.o.id,y.w.id,'push:hold');
   assert.equal(outcome.error,undefined);
   hardball++;
   for(const b of series)b.hardballTried++;
   if(outcome.withdrawn){withdrawn++;for(const b of series)b.offerWithdrawn++;}
   else if(y.t.step==='offer'){hardballWon++;for(const b of series)b.hardballWon++;}
   else if(y.t.step==='done'){hardballLostCounter++;}
   assert.ok(y.p.trust<=p0,'hardball may never increase trust');
  }else if(topic==='fee'){
   const before=p.trust;
   assert.equal(G.talkMove(o.id,w.id,'reply:accept').error,undefined);
   const cost=N.profileFor(pid).feeRaiseCost;
   assert.equal(p.trust,before-cost,'an accepted fee raise costs promoter trust');
   acceptedFeeTrustCost+=cost;acceptedFeeRaises++;
  }
 }else{
  assert.equal(o.bump,1,'refused initial request retains the original');
  feeUnchanged++;
 }
}
assert.equal(total,ids.length*levels.length*styles.length*topics.length*args.length);
assert.ok(tradeAvailable>0&&tradeAccepted>0&&tradeAccepted<tradeAvailable,
 'Concrete trades must be useful but not guaranteed');
assert.ok(hardballWon>0&&withdrawn>0,
 'Hardball must carry both genuine upside and the possibility of losing the invitation');
assert.ok(per['dock:fee'].rejected>0&&per['union:fee'].rejected>0,
 'Promoters must be able to refuse unsupported fee demands');
assert.ok(byLevel['star:slot'].rejected>0,
 'Even a star must sometimes face resistance to taking a main-event place');
assert.ok(acceptedFeeRaises>0&&acceptedFeeTrustCost>0,
 'Cash negotiation must incur real promoter relationship cost');
const nice=(obj)=>Object.fromEntries(Object.entries(obj).sort(([a],[b])=>a.localeCompare(b)).map(([k,r])=>[k,{
 n:r.n,agreed:r.agreed,counter:r.counter,rejected:r.rejected,
 acceptancePct:+((r.agreed+r.counter)/r.n*100).toFixed(1),
 avgFeeGain:+(r.feeGain/r.n).toFixed(1),avgFeeLoss:+(r.feeLoss/r.n).toFixed(1),
 protected:r.protected,slotUp:r.slotUp,trustLost:r.trustLost,
 hardballTried:r.hardballTried,hardballWon:r.hardballWon,offerWithdrawn:r.offerWithdrawn
}]));
console.log('NEGOTIATION_BALANCE_AUDIT_BEGIN');
console.log(JSON.stringify({scenarios:total,hardball,hardballWon,hardballLostCounter,withdrawn,
 tradeAvailable,tradeAccepted,casesWithNoChoice,feeUnchanged,
 acceptedFeeRaises,acceptedFeeTrustCost,
 byPromoterAndTopic:nice(per),byLeverageAndTopic:nice(byLevel),
 byPromoterTopicArgument:nice(byArg)},null,2));
console.log('NEGOTIATION_BALANCE_AUDIT_END');
