'use strict';
// Cross-system acceptance: match, programme, title office, booking desk, microphone and resume.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {engine}=require('./_world.cjs');
const {root}=engine(3807);
const {OfficeGame:G,OfficeData:D,OfficeProgrammes:P,OfficeOutcome:O,
 OfficeTerritory:T,OfficeStips:X,OfficeRivalry:Riv,OfficeAfter:A}=root;
assert.ok(O&&G.bookingConflict&&P&&T&&X&&Riv&&A);
const finish=(changes={})=>({
 stars:2.25,crowd:55,crowdPeak:62,outcome:'booked',finishRoute:'finisher',
 botches:0,script:.8,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},
 minutes:14,plan:'story',stamina:55,injury:0,ignored:0,callsUsed:[],log:[],
 ...changes
});
function career(){
 G.fresh();const s=G.S;s.cash=99999;s.rep=60;
 assert.equal(G.sign('rex'),null);
 s.inbox=[];G.P('crown').trust=70;
 return s;
}
function contract(s,changes={}){
 const c={id:'consistency-'+(++contract.next),pid:'crown',wid:'rex',rid:'silas',
  slot:'main',minutes:16,finish:'win_clean',purse:400,eventAbs:G.abs(),...changes};
 s.card.push(c);return c;
}
contract.next=0;
function programme(s,c,beats,type='grudge'){
 const prog={id:'prog-'+c.id,type,pid:c.pid,div:D.divisionOf(c.wid),wid:c.wid,
  beats,signed:G.abs()};
 c.programme={id:prog.id,step:beats.length-1};
 P.state(s.territory).live.push(prog);
 return prog;
}
// Explicitly distinguish an agreed DQ finish from a surprise referee DQ.
assert.equal(O.interpret({finish:'win_dq'},{outcome:'booked'}).contractHonoured,true);
assert.equal(O.interpret({finish:'win_dq'},{outcome:'booked'}).beltChangeAllowed,false);
assert.equal(O.interpret({finish:'lose_dq'},{outcome:'booked',actualOutcome:'dq',bookedFinish:'win_clean',contractHonoured:false}).contractHonoured,false);
console.log('PASS canonical match outcomes distinguish match winner, compliance and belt movement');

// Miss a middle chapter, work the finale: the programme must close, free claims and award no bonus.
{
 const s=career(),c=contract(s);
 const pr=programme(s,c,[
  {cid:'first',at:G.abs()-2,rid:'silas',done:true,result:{stars:3,outcome:'booked'}},
  {cid:'missed',at:G.abs()-1,rid:'silas',done:false,missed:true},
  {cid:c.id,at:G.abs(),rid:'silas',done:false}
 ],'title');
 const rep=s.rep;
 const out=G.applyResult(c,finish());
 assert.equal(P.state(s.territory).live.length,0,'no indefinitely reserved programme');
 const done=P.state(s.territory).done.find(p=>p.id===pr.id);
 assert.equal(done?.status,'incomplete');
 assert.equal(done.beats.at(-1).done,true);
 assert.ok(!out.some(x=>/trust \+8, reputation \+3/.test(x.text)));
 assert.ok(out.some(x=>/earlier date was missed/i.test(x.text)));
 assert.ok(!P.claims(s,s.territory).belts.has(pr.pid+':'+pr.div));
 assert.ok(s.rep<=rep+5,'no unearned +3 programme reputation');
}
console.log('PASS a missed build followed by the finale closes without claiming a successful programme');

// A surprise DQ cannot earn completion credit or move a championship.
{
 const s=career(),c=contract(s,{title:{pid:'crown',div:'men'}});
 s.territory.titles.crown.men.holder='silas';
 const pr=programme(s,c,[{cid:c.id,at:G.abs(),rid:'silas',done:false}], 'title');
 const cash=s.cash;
 const out=G.applyResult(c,finish({outcome:'dq',finishRoute:'dq_cheap',stars:2}));
 const done=P.state(s.territory).done.find(p=>p.id===pr.id);
 assert.equal(done?.status,'broken');
 assert.equal(done.beats[0].result?.outcome,'dq');
 assert.equal(done.beats[0].result?.honoured,false);
 assert.equal(s.territory.titles.crown.men.holder,'silas');
 assert.equal(s.history[0].outcome,'dq');
 assert.equal(s.history[0].bookedFinish,'win_clean');
 assert.equal(s.history[0].contractHonoured,false);
 assert.ok(s.cash-cash<400,'the disqualification reduced the agreed purse');
 assert.ok(!out.some(x=>/Programme complete/.test(x.text)));
 assert.ok(!s.inbox.some(m=>m.subject==='That’s how it’s done'));
}
console.log('PASS unplanned DQ breaks the programme, reduces pay and retains the title');

// A promoter may deliberately book a DQ. The match has a winner; the reigning champion keeps the belt.
{
 const s=career(),c=contract(s,{finish:'win_dq',title:{pid:'crown',div:'men'}});
 s.territory.titles.crown.men.holder='silas';
 G.applyResult(c,finish({outcome:'booked',finishRoute:'dq_chair_f'}));
 assert.equal(s.territory.titles.crown.men.holder,'silas','DQ does not transfer championship');
 assert.equal(s.history[0].contractHonoured,true);
 assert.equal(s.history[0].bookedFinish,'win_dq');
}
console.log('PASS a booked DQ honours the deal without transferring the belt');

// Ordinary and programme contracts cannot reuse the same opponent on the same date.
{
 const s=career(),other=s.free.find(w=>D.divisionOf(w.id)===D.divisionOf('rex'));
 assert.ok(other,'another wrestler in Rex’s division exists');
 assert.equal(G.sign(other.id),null);
 const date=G.abs()+2;
 s.futureBookings.push({id:'original',pid:'crown',wid:'rex',rid:'silas',slot:'main',
  minutes:15,finish:'win_clean',purse:400,eventAbs:date});
 const o={id:'new-offer',pid:'crown',rid:'silas',slot:'main',finish:'win_clean',
  eventAbs:date,expiresAbs:date,boost:1};
 s.offers.push(o);
 assert.match(G.book(o.id,other.id),/already booked/i,'cannot sign a second match against Silas');
 assert.ok(s.offers.includes(o),'failed booking leaves the offer unconsumed');
 const po={id:'new-programme',pid:'crown',wid:other.id,tag:'Programme',slot:'mid',rid:'silas',
  eventAbs:G.abs()+1,expiresAbs:date,boost:1,programme:{
   id:'collision-programme',pid:'crown',wid:other.id,type:'grudge',
   beats:[{at:G.abs()+1,rid:'malik',slot:'mid',finish:'lose_clean'},
    {at:date,rid:'silas',slot:'main',finish:'win_clean'}]}};
 s.offers.push(po);
 assert.match(G.book(po.id,other.id),/already booked/i,'the finale collision is checked before the first date is signed');
 assert.ok(!s.futureBookings.some(c=>c.programme?.id===po.programme.id),'no partial programme');
}
console.log('PASS ordinary and multi-date programmes reject a conflicting opponent');

// An opponent hitting their own move cannot become a memory of reversing yours.
assert.equal(X.FINISH.nodq.lose_clean[0],'finisher');
assert.equal(X.FINISH.anywhere.lose_clean[0],'finisher');
{
 const s=career(),c=contract(s,{finish:'lose_clean',stip:'anywhere'});
 G.applyResult(c,finish({finishRoute:X.FINISH.anywhere.lose_clean[0]}));
 const last=Riv.ledger('rex','silas').meetings.at(-1);
 assert.ok(last,'the match is retained in rivalry memory');
 assert.equal(last.reversedFinisher,null);
}
console.log('PASS the rivalry ledger cannot invent a reversal');

// A no-contest is not presented as a loss in microphone options.
{
 const s=career(),c=contract(s);
 const after=A.begin(c,finish({outcome:'nc'}),'none');
 assert.ok(after);
 assert.ok(!A.micOptions(after).some(x=>x.id==='concede'||x.id==='excuse'));
}
console.log('PASS a no-contest has no misleading loss acknowledgement');

// UI regressions: inspect the exact shipped script rather than a duplicate mock implementation.
const ui=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
assert.match(ui,/resultOpen=saved\?\.stage==='result'/,'final and intermediate results can be restored');
assert.match(ui,/if\(resultOpen\)\{openTV\(\)/,'restore the result before advancing the week');
assert.match(ui,/resultHTML:\s*night\.stage==='result'/,'the HTML is saved only while on a result');
assert.match(ui,/night\.resultHTML=\$\('#tv'\)\.innerHTML/,'the result screen persists after effects are applied');
assert.match(ui,/Withdraw from the whole programme\?/,'programme cancellation is confirmed');
assert.match(ui,/d\.dlg\.startsWith\('withdraw:'\)/,'only a confirmed withdrawal mutates the card');
console.log('PASS pause/reload and irreversible programme withdrawal have UI-level guards');
