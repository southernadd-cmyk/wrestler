'use strict';
// v0.3.26 — a programme is a story the player can direct, not just pre-booked results.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeGame:G,OfficeProgrammes:P,OfficeProgrammeArcs:A,OfficeMic:Mic,OfficeData:D,OfficeAfter:After}=root;
assert.ok(A&&A.options&&A.prepare&&A.settle);
const fin=(stars=3.5,outcome='booked')=>({stars,crowd:65,crowdPeak:77,outcome,botches:0,script:.9,
 adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:14,plan:'brawl',stamina:60,injury:0,ignored:0,callsUsed:[],log:[]});
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=60;G.sign('rex');s.inbox=[];s.offers=[];G.P('crown').trust=70;
 s.territory.cards.crown.rex={score:99,matches:4,wins:4};return s;}
function withProgramme(){const s=career(),st=P.state(s.territory);let offer=null;
 for(let wk=G.abs();wk<G.abs()+30;wk++){st.lastOffer=-99;s.offers=s.offers.filter(x=>!x.programme);offer=P.offer(s,s.territory,wk);if(offer)break;}
 assert.ok(offer?.programme,'an offer exists');assert.equal(G.book(offer.id,offer.wid),null);
 const prog=P.state(s.territory).live[0],contracts=prog.beats.map(b=>[...s.card,...s.futureBookings].find(c=>c.id===b.cid));
 return {s,prog,contracts};}

// 1. Three distinct playable story families, in every phase; no unbooked matches receive choices.
for(const type of ['title','grudge','rise']){
 for(const step of [0,1,2]){
  const c=A.chapter({type,beats:[1,2,3]},step);
  assert.ok(c&&c.steady&&c.needle&&c.gamble&&c.ask);
  assert.equal(new Set([c.steady[0],c.needle[0],c.gamble[0]]).size,3);
 }
}
assert.equal(A.options({id:'ordinary'}),null);
console.log('PASS each programme has three distinct, phase-specific directions');

// 2. Booking remains immutable; choice is picked backstage and only stored at the bell.
{
 const {s,prog,contracts}=withProgramme(),c=contracts[0];
 assert.equal(prog.arc.momentum,45);
 const v=A.options(c),before={finish:c.finish,slot:c.slot,at:c.eventAbs,booked:s.futureBookings.length};
 assert.equal(v.step,0);assert.equal(v.total,prog.beats.length);
 assert.ok(v.choices.every(x=>x.cue&&x.hint&&x.risk));
 assert.equal(A.intro(c,'needle').id,'needle');
 const snap=A.prepare(c,'needle',{quality:83,duel:{meter:24}});
 assert.equal(snap.id,'needle');assert.equal(snap.quality,83);assert.equal(snap.meter,24);
 assert.equal(JSON.stringify({finish:c.finish,slot:c.slot,at:c.eventAbs,booked:s.futureBookings.length}),JSON.stringify(before),'no booking changed');
 assert.equal(prog.arc.momentum,45,'choice does not award an early bonus');
 const text=JSON.stringify(s);assert.match(text,/arcDecision/,'the selected direction lives with the contract');
 console.log('PASS a chapter is chosen backstage, saved, and does not rewrite the booked result');
}

// 3. The duel asks about the programme; previous match results form a real callback.
{
 const {prog,contracts}=withProgramme(),c=contracts[0],w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
 const i=A.intro(c,'gamble'),st=Mic.begin(c,w,f,null,null,p,{arc:i});
 assert.match(st.log[0].line,/belt|title|chase|tonight|name/i);
 assert.ok(st.readLines.some(x=>x.includes('Programme, chapter 1')));
 A.prepare(c,'gamble',{quality:90});G.applyResult(c,fin(4));
 const rec=prog.arc.timeline[0];assert.equal(rec.passed,true);assert.equal(rec.choice,'gamble');assert.equal(prog.arc.momentum,59);
 const next=A.options(contracts[1]);assert.ok(next.follow.includes(rec.recap),'next chapter refers to the actual last one');
 const nextMic=Mic.begin(contracts[1],w,G.F(contracts[1].rid),null,null,p,{arc:A.intro(contracts[1],'steady')});
 assert.ok(nextMic.readLines.some(x=>x.includes(rec.recap)),'promo carries the callback');
 assert.match(After.begin(c,fin(4),'none').log.map(x=>x.text).join(' '),/another date/,'after the bell acknowledges the next chapter');
 // When the angle is chosen in the segment, the chapter line follows the angle, once.
 {const {contracts:cs}=withProgramme(),c2=cs[0],f2=fin(4);G.applyResult(c2,f2);
  const ready=JSON.parse(JSON.stringify({id:c2.id,wid:c2.wid,rid:c2.rid,pid:c2.pid,slot:c2.slot,finish:c2.finish,programme:c2.programme}));
  const st=After.begin(ready,f2);assert.equal(st.stage,'angle');
  assert.doesNotMatch(st.log.map(x=>x.text).join(' '),/another date/,'nothing is said before the angle');
  assert.ok(After.choose(st,'staredown'));
  const said=st.log.map(x=>x.text).join(' ');
  assert.equal((said.match(/another date/g)||[]).length,1,'the next chapter is acknowledged once, after the angle');
  assert.ok(said.indexOf('another date')>said.indexOf('stare'),'and after the stare-down');}
 console.log('PASS the microphone and after-bell segments acknowledge the actual previous chapter');
}

// 4. Story direction matters: safer material survives an average night, a high-stakes boast can fail.
{
 const a=withProgramme();
 A.prepare(a.contracts[0],'steady',{quality:35});const notesA=G.applyResult(a.contracts[0],fin(3));
 const b=withProgramme(),saved={s:b.s,c:b.contracts[0]};
 A.prepare(saved.c,'gamble',{quality:35});const notesB=G.applyResult(saved.c,fin(3));
 assert.equal(a.prog.arc.timeline[0].passed,true);
 assert.equal(b.prog.arc.timeline[0].passed,false);
 assert.equal(a.prog.arc.momentum,50);assert.equal(b.prog.arc.momentum,35);
 assert.ok(notesA.some(x=>/Programme chapter/.test(x.text)));
 assert.ok(notesB.some(x=>/did not convince/.test(x.text)));
 const existing=b.prog.arc.timeline.length;
 A.settle(saved.c,fin(3));assert.equal(b.prog.arc.timeline.length,existing,'no double award for the same contract');
 console.log('PASS risky creative decisions have meaningful, single-application consequences');
}

// 5. Finishing the storyline records the arc permanently, and the bonus requires a strong build.
{
 const {s,prog,contracts}=withProgramme(),finishList=contracts.map(c=>c.finish);
 for(const c of contracts){A.prepare(c,'gamble',{quality:90});G.applyResult(c,fin(4.25));}
 const done=P.state(s.territory).done.find(x=>x.id===prog.id);
 assert.ok(done?.arc?.conclusion);assert.equal(done.arc.timeline.length,contracts.length);
 assert.equal(done.arc.recognition,done.arc.timeline.some(e=>e.claim==='broken')?1:2);assert.ok(s.rep>60);
 assert.equal(contracts.map(c=>c.finish).join(),finishList.join(),'booker-controlled finishes unchanged');
 assert.equal(P.state(s.territory).live.some(x=>x.id===prog.id),false);
 const v=JSON.parse(JSON.stringify(s));assert.equal(v.territory.programmes.done[0].arc.timeline.length,contracts.length);
 G.S=v;assert.equal(A.record(prog.id).arc.recognition,2,'record survives load and view');
 console.log('PASS a strong programme pays off and its chapter history survives reload');
}

// 6. An existing signed programme without arc data can join in mid-story without replaying past beats.
{
 const {s,prog,contracts}=withProgramme();delete prog.arc;
 prog.beats[0].done=true;const next=contracts[1];
 const options=A.options(next);assert.ok(options.follow.includes('before this feature'));
 A.prepare(next,'steady',null);const out=G.applyResult(next,fin(3));
 assert.equal(prog.arc.timeline.length,1);assert.equal(prog.arc.timeline[0].step,1);
 assert.ok(out.some(x=>/Programme chapter 2/.test(x.text)));
 assert.equal(s.territory.programmes.live[0].arc.momentum,50);
 console.log('PASS an older save can start the creative arc part-way through');
}


// 7. A spectacular performance and an unkept public promise are separate facts.
{
 const {prog,contracts}=withProgramme();
 const finale=contracts.at(-1);
 finale.finish='lose_clean';prog.beats.at(-1).finish='lose_clean';
 A.prepare(finale,'gamble',{quality:91});
 const note=A.settle(finale,fin(4.75));
 const e=prog.arc.timeline.at(-1);
 assert.equal(e.passed,true,'the segment still entertained the crowd');
 assert.equal(e.claim,'broken','a booked loss cannot make a title-winning boast true');
 assert.match(e.recap,/public claim was not delivered/);
 assert.ok(note.text.includes('Programme finale'));
}
console.log('PASS a strong programme finale can entertain but fail its promised win');

// 8. Choosing high-risk copy but cutting the microphone does not satisfy the mic gate.
{
 for(const id of ['needle','gamble']){
  const {prog,contracts}=withProgramme(),c=contracts[0];
  A.prepare(c,id,null);
  A.settle(c,fin(4.5));
  assert.equal(prog.arc.timeline[0].passed,false,id+' needs the actual promo');
  assert.equal(prog.arc.timeline[0].quality,null);
 }
}
console.log('PASS a skipped promo cannot satisfy a mic-dependent creative direction');

// 9. Consistently excellent restrained work has a route to recognition.
{
 const {s,prog,contracts}=withProgramme();
 for(const c of contracts){A.prepare(c,'steady',null);G.applyResult(c,fin(4.25));}
 const arc=P.state(s.territory).done.find(x=>x.id===prog.id).arc;
 assert.ok(arc.timeline.every(x=>x.passed),'all chapters landed');
 assert.equal(arc.recognition,1,'restraint earns smaller recognition even below the high-risk momentum threshold');
}
console.log('PASS consistently excellent conservative programmes can earn recognition');
