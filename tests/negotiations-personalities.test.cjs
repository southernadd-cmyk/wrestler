'use strict';
// Phase 3: differentiated promoter preferences, counter economics, trust costs,
// grounded memory, and bounded negotiation with save-compatible state.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{
 window:root,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
 Date,Math,JSON,console
});
const G=root.OfficeGame,V=root.OfficeNegotiationsV2;
assert.ok(V?.active&&V.read&&V.profileFor,'Phase 3 negotiation profile API is installed');
let seq=0;
function scenario(pid,{trust=55,heat=40,pro=80,rep=40,topic='protect',arg='crowd',finish='lose_clean'}={}){
 G.fresh();const s=G.S;
 s.cash=99999;s.rep=rep;s.focus=2;
 assert.equal(G.sign('rex'),null);
 s.offers=[];G.P(pid).trust=trust;
 const w=G.W('rex');w.heat=heat;w.pro=pro;
 const o={id:'personality-'+seq++,pid,rid:'magnus',wid:null,slot:'opener',finish,
  boost:1,bump:1,eventAbs:G.abs(),expiresAbs:G.abs()+1};
 s.offers=[o];const p=G.P(pid);
 const read=V.read(o,w);
 assert.equal(read.failureCost,V.profileFor(pid).failed);
 assert.ok(read.priority&&read.signal&&read.warning);
 const meeting=G.meeting(o.id,w.id);
 assert.equal(meeting.talk.step,'start');
 assert.ok(meeting.talk.log[0].text.includes(p.voice)===false||meeting.talk.log[0].text.includes('offer'),
  'opening transcript is plain speech, not a synthetic ID');
 assert.match(read.evidence,/No completed booking/);
 assert.ok(!G.talkMove(o.id,w.id,'ask:'+topic).error);
 assert.equal(s.focus,1,'one and only one meeting spent');
 const ask=G.talkMove(o.id,w.id,'arg:'+arg);
 assert.ok(!ask.error,ask.error);
 return {s,o,w,p,read,t:o.talk};
}
// Same wrestler, ability, promoter trust, reputation, finish and argument.
// Personalities MUST create substantive differences in negotiation outcomes.
{
 const cases=['dock','pulse','crown','union'].map(pid=>[pid,scenario(pid)]);
 const states=cases.map(([pid,v])=>[pid,v.t.step]);
 assert.equal(states[0][1],'offer','Gaz likes an established physical worker taking a protected loss');
 assert.equal(states[1][1],'counter','Nina asks for a saleable reason to protect a middling draw');
 assert.equal(states[2][1],'counter','Harold dislikes changing a clean finish without a stronger case');
 assert.equal(states[3][1],'challenge','Vivian rejects a weak commercial case for protection');
 assert.equal(new Set(states.map(x=>x[1])).size,3,'promoters must produce materially different decisions');
 for(const [pid,v] of cases){
  assert.equal(v.o.finish,'lose_clean','no promoter may silently amend the finish');
  assert.match(v.t.log.at(-1).text,new RegExp({dock:'strong enough|crowd',pulse:'sell|audience',
    crown:'limited change|card',union:'commercial'}[pid],'i'));
 }
}
// The same fee demand can yield different counteroffer amounts because
// each booker has a distinct budget position, not just scripted dialogue.
{
 const inputs=[
  ['dock',{trust:30,heat:35,pro:50,rep:20,topic:'fee',arg:'trade'}],
  ['pulse',{trust:34,heat:50,pro:70,rep:30,topic:'fee',arg:'crowd'}],
  ['crown',{trust:25,heat:25,pro:50,rep:20,topic:'fee',arg:'reliability'}],
  ['union',{trust:25,heat:45,pro:55,rep:25,topic:'fee',arg:'trade'}]
 ];
 const amounts=[];
 for(const [pid,args] of inputs){
  const {t,o,w}=scenario(pid,args);
  assert.equal(t.step,'counter',pid+' should respond with a counteroffer, got '+t.step);
  assert.equal(o.bump,1,'counteroffer must remain provisional');
  const multiplier=V.profileFor(pid).counter.fee;
  const expected=+(multiplier).toFixed(4);
  assert.equal(t.proposal.bump,expected,pid+' counteroffer should follow promoter budget');
  amounts.push(t.proposal.bump);
  assert.ok(!G.talkMove(o.id,w.id,'reply:accept').error);
  assert.equal(o.bump,expected,'only acceptance changes the live offer');
 }
 assert.equal(new Set(amounts).size,4,'all four fee counters must differ');
}
// An implausible negotiation hurts each promoter relationship differently.
{
 const expected={dock:3,pulse:1,crown:2,union:2};
 for(const pid of Object.keys(expected)){
  const {o,p,t}=scenario(pid,{trust:25,heat:10,pro:40,rep:20,topic:'fee',arg:'crowd'});
  assert.equal(t.step,'challenge',pid+' should reject an unsupported fee demand');
  assert.equal(p.trust,25-expected[pid]);
  assert.equal(t.cost,expected[pid]);
  assert.equal(o.bump,1);
 }
}
// Recorded match history can be mentioned; a first meeting cannot acquire
// an imaginary previous bout. No real person's personal details are inferred.
{
 G.fresh();const s=G.S;s.cash=99999;
 assert.equal(G.sign('rex'),null);
 const o={id:'memory-'+seq++,pid:'dock',rid:'magnus',slot:'opener',
  finish:'lose_clean',boost:1,bump:1,eventAbs:G.abs(),expiresAbs:G.abs()+1};
 s.offers=[o];
 let context=V.read(o,G.W('rex'));
 assert.match(context.evidence,/No completed booking/);
 s.history.unshift({pid:'dock',wid:'rex',stars:4.25,season:s.season,week:s.week});
 context=V.read(o,G.W('rex'));
 assert.match(context.evidence,/4.25 stars/);
 const t=G.meeting(o.id,'rex').talk;
 assert.match(t.log[0].text,/4.25 stars/);
 assert.equal(t.log.length,1,'intro adds no fabricated extra exchange');
 G.save();assert.ok(G.load(),'the saved career and negotiation should reload');
 const persisted=G.S.offers.find(x=>x.id===o.id).talk;
 assert.equal(persisted.personalityIntro,true);
 assert.match(persisted.log[0].text,/4.25 stars/);
}
// Stipulations still honour explicit disqualification and title restrictions.
{
 const {o}=scenario('dock',{topic:'fee',arg:'trade',finish:'lose_dq'});
 assert.match(G.talkMove(o.id,'rex','ask:stip:nodq').error||'',/Choose what|discussion|complete|permitted|proposal/i);
 G.fresh();const s=G.S;s.cash=99999;
 assert.equal(G.sign('rex'),null);
 const x={id:'stip-'+seq++,pid:'dock',rid:'magnus',slot:'mid',
  finish:'win_dq',boost:1,bump:1,eventAbs:G.abs(),expiresAbs:G.abs()+1};
 s.offers=[x];
 assert.match(G.talkMove(x.id,'rex','ask:stip:anywhere').error||'',/disqualification/i);
}
console.log('PASS negotiation personalities: distinct decisions, economic counters, costs and grounded memory');
