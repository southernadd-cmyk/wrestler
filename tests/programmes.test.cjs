'use strict';
// v0.3.18 programmes: storylines offered to your wrestlers, signed as one, seen through or walked out of.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeBooking:B,OfficeProgrammes:P}=root;
assert.ok(P&&P.offer&&P.claims,'programmes are installed');
const fin=(o={})=>({stars:3.25,crowd:62,crowdPeak:70,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:15,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[],...o});
// A career where Rex is a main-event name at North Crown, so Harold Pike has a title chase to offer him.
function career(){
 G.fresh();const s=G.S;s.cash=99999;s.rep=60;G.sign('rex');s.inbox=[];s.offers=[];
 const p=G.P('crown');p.trust=70;
 s.territory.cards.crown.rex={score:99,matches:4,wins:4};
 return s;
}
function offerFor(s){
 const st=P.state(s.territory);
 for(let wk=G.abs();wk<G.abs()+30;wk++){st.lastOffer=-99;s.offers=s.offers.filter(o=>!o.programme);const o=P.offer(s,s.territory,wk);if(o)return o;}
 return null;
}

// 1. A promoter offers a whole storyline, with every date and finish in it.
let s=career();
let o=offerFor(s);
assert.ok(o&&o.programme,'a programme is offered');
assert.equal(o.wid,'rex');assert.equal(o.tag,'Programme');
const prog=o.programme;
assert.ok(prog.beats.length>=2&&prog.beats.every((b,k)=>!k||b.at>prog.beats[k-1].at),'dated matches, in order');
assert.ok(prog.beats.every(b=>D.FINISHES[b.finish]&&D.SLOTS[b.slot]),'each with its finish and slot');
assert.ok(s.inbox.some(m=>/A programme for Titan/.test(m.subject)),'the booker calls about it');
if(prog.type==='title'){assert.ok(prog.beats.at(-1).title,'a title chase ends with the title match');assert.deepEqual({...o.title},{...prog.beats.at(-1).title});}
console.log('PASS a programme is offered: '+prog.type+', '+prog.beats.length+' matches');

// 2. While a title programme is on offer or running, the booker keeps the belt for it.
{
 const t=s.territory,wk=prog.beats[0].at;
 const title=s.offers.find(x=>x.programme?.type==='title')||null;
 if(title){
  const {pid,div}=title.title;
  t.booking=B.blank(wk);for(const x of Object.values(t.booking.promos))for(const d in x.next)x.next[d]=wk;
  const plan=B.decide(s,t,wk);
  assert.ok(!plan.state.promos[pid].live.some(x=>x.type==='title'&&x.div===div),'no rival title chase for that belt');
  assert.ok(!plan.bill.some(m=>m.pid===pid&&m.div===div&&m.title),'and no title defences that could move it first');
  assert.ok(P.claims(s,t).cast.has(prog.beats.at(-1).rid),'the champion is spoken for');
  console.log('PASS the booker holds the belt for your title programme');
 }
}

// 3. Signing books every date; a clash on any date stops it.
{
 const clash={id:'clash',pid:'dock',rid:'malik',wid:'rex',slot:'mid',minutes:12,finish:'win_clean',purse:100,eventAbs:prog.beats.at(-1).at};
 s.futureBookings.push(clash);
 assert.match(G.book(o.id,'rex'),/isn’t free/,'every date has to be clear');
 s.futureBookings=s.futureBookings.filter(c=>c!==clash);
 assert.equal(G.book(o.id,'rex'),null,'signed');
 const booked=[...s.card,...s.futureBookings].filter(c=>c.programme?.id===prog.id);
 assert.equal(booked.length,prog.beats.length,'one booking per match');
 assert.ok(booked.every((c,k)=>c.eventAbs===prog.beats[c.programme.step].at&&c.finish===prog.beats[c.programme.step].finish),'on the agreed dates with the agreed finishes');
 assert.ok(!s.offers.includes(o)&&P.state(s.territory).live.some(x=>x.id===prog.id));
 console.log('PASS signing a programme books all of it');
}

// 4. See it through: trust and reputation rise, and a title match can move the belt.
{
 const p=G.P(prog.pid),trust=p.trust,rep=s.rep;
 let last=[];for(const c of [...s.card,...s.futureBookings].filter(c=>c.programme?.id===prog.id).sort((x,y)=>x.eventAbs-y.eventAbs))last=G.applyResult(c,fin());
 const done=P.state(s.territory).done[0];
 assert.equal(done.id,prog.id);assert.equal(done.status,'kept');
 assert.ok(last.some(x=>/Programme complete\. .+ trust \+8, reputation \+3\./.test(x.text)),'the last match pays the programme bonus');
 assert.ok(p.trust>trust,'the promoter trusts you more');assert.ok(s.rep>rep,'and the circuit notices');
 assert.ok(s.inbox.some(m=>m.subject==='That’s how it’s done'));
 if(prog.type==='title'&&D.FINISHES[prog.beats.at(-1).finish].win)assert.ok(T.titlesOf('rex').length,'Rex won the belt as planned');
 console.log('PASS a programme seen through raises trust and reputation');
}

// 5. Pulling any date walks out of the whole programme.
{
 s=career();o=offerFor(s);G.book(o.id,'rex');
 const p=G.P(o.pid),trust=p.trust;
 const first=s.futureBookings.find(c=>c.programme?.id===o.programme.id);
 assert.match(G.unbook(first.id),/walked out/);
 assert.ok(![...s.card,...s.futureBookings].some(c=>c.programme?.id===o.programme.id),'every date is cancelled');
 assert.equal(p.trust,trust-15,'it costs more than one pulled booking');
 assert.equal(P.state(s.territory).done[0].status,'walked');
 console.log('PASS walking out cancels the programme and costs trust');
}

// 6. The week before the big one, the booker can change the ending: go along with it, argue, or walk.
for(const answer of ['accept','walk','argue']){
 s=career();o=offerFor(s);G.book(o.id,'rex');
 const pr=P.state(s.territory).live[0],p=G.P(pr.pid),keep={...P.STYLE};
 for(const k in P.STYLE)P.STYLE[k]={...P.STYLE[k],swerve:1};
 // Play the weeks up to the one before the payoff.
 while(G.abs()<pr.beats.at(-1).at-1){for(const c of s.card.slice())G.applyResult(c,fin());for(const m of G.pending())G.answer(m.id,m.dtype==='agent_bid'?'refuse':m.options[0].id);s.card=s.card.filter(c=>!c.programme);G.endWeek();if(s.over)break;}
 for(const k in keep)P.STYLE[k]=keep[k];
 const m=s.inbox.find(x=>x.dtype==='prog_swerve'&&!x.answer);
 assert.ok(m,'the booker calls with a change of plan ('+answer+')');
 const pay=pr.beats.at(-1),c=s.futureBookings.find(x=>x.id===pay.cid);
 assert.notEqual(c.finish,pr.original,'the finish has changed');
 const trust=p.trust;s.focus=2;G.answer(m.id,answer);
 if(answer==='accept'){assert.equal(p.trust,Math.min(100,trust+3));assert.ok(s.futureBookings.some(x=>x.id===pay.cid));}
 if(answer==='walk'){assert.equal(p.trust,trust-15);assert.ok(!s.futureBookings.some(x=>x.id===pay.cid));}
 if(answer==='argue'){assert.equal(s.focus,1,'arguing uses a meeting');const now=s.futureBookings.find(x=>x.id===pay.cid);assert.ok(now.finish===pr.original||p.trust===trust-2,'either it goes back, or the booker digs in');}
}
console.log('PASS a change of ending can be accepted, argued or walked out on');

// 7. Missing the last date kills the programme; releasing the wrestler ends it too.
{
 s=career();o=offerFor(s);G.book(o.id,'rex');
 const pr=P.state(s.territory).live[0],p=G.P(pr.pid),trust=p.trust;
 s.futureBookings=s.futureBookings.filter(c=>c.id!==pr.beats.at(-1).cid);
 P.weekly();
 assert.equal(P.state(s.territory).done[0].status,'collapsed');assert.equal(p.trust,trust-8);
 s=career();o=offerFor(s);G.book(o.id,'rex');
 G.release('rex');P.weekly();
 assert.equal(P.state(s.territory).done[0].status,'collapsed','a released wrestler’s programme ends');
 assert.equal(P.state(s.territory).live.length,0);
 console.log('PASS missed and abandoned programmes collapse');
}

// 8. A long career with programmes keeps the save sound, and the circuit's card stays predictable.
{
 s=career();
 for(let i=0;i<24;i++){
  for(const x of s.offers.filter(x=>x.programme))G.book(x.id,x.wid);
  // As in the game: decisions first, then match night plays everything on the card.
  for(const m of G.pending())G.answer(m.id,m.dtype==='agent_bid'?'refuse':m.options[0].id);
  for(const c of s.card.slice())G.applyResult(c,fin());
  const copy=JSON.parse(JSON.stringify(s)),next=T.absWeek(s)+1;
  const predicted=T.circuitBill(copy,T.prepare(copy),next,new Set((copy.futureBookings||[]).filter(c=>c.eventAbs===next).map(c=>c.rid)));
  G.endWeek();if(s.over)break;
  const played=s.territory.lastResults.matches.map(m=>m.a+'|'+m.b).sort().join();
  assert.equal(played,predicted.map(m=>m.a.id+'|'+m.b.id).sort().join(),'the start screen can still predict the circuit');
 }
 assert.doesNotMatch(JSON.stringify(s.territory.programmes),/NaN|undefined/);
 assert.ok(JSON.stringify(s.territory.programmes).length<20000);
 console.log('PASS 24 weeks with programmes: circuit still predictable, save sound');
}
