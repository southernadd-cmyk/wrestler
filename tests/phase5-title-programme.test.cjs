'use strict';
// A booked title programme must not award a belt for defeating an ex-champion.
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');
const {root}=engine(5215);
const {OfficeGame:G,OfficeTerritory:T,OfficeProgrammes:P,OfficeData:D}=root;
let seq=0;
function setup(){
 G.fresh();const s=G.S;s.cash=99999;s.rep=60;s.inbox=[];
 assert.equal(G.sign('rex'),null);
 const pid='crown',div=D.divisionOf('rex'),old=T.title(pid,div)?.holder;
 const replacement=T.promotionRank(pid,div,s.territory,s)
  .find(w=>w.id!==old&&w.id!=='rex'&&!G.W(w.id)&&T.contracted(s,w.id))?.id;
 assert.ok(old&&replacement,'title and alternative eligible champion available');
 const id='phase5-title-'+(++seq),start=G.abs();
 const beats=[
  {cid:id+'-0',at:start+2,rid:'malik',slot:'feature',finish:'win_clean',done:false},
  {cid:id+'-1',at:start+4,rid:old,slot:'main',finish:'win_clean',title:{pid,div},done:false}
 ];
 const prog={id,pid,div,type:'title',wid:'rex',rid:old,beats,signed:start};
 for(const [i,b] of beats.entries())s.futureBookings.push({
  id:b.cid,pid,wid:'rex',rid:b.rid,slot:b.slot,finish:b.finish,
  minutes:D.SLOTS[b.slot].mins,purse:300,eventAbs:b.at,
  ...(b.title?{title:{...b.title}}:{}),programme:{id,step:i}
 });
 P.state(s.territory).live.push(prog);
 return {s,prog,old,replacement,pid,div};
}
{
 const {s,prog,replacement,pid,div}=setup();
 s.territory.titles[pid][div].holder=replacement;
 G.endWeek();
 const final=s.futureBookings.find(c=>c.id===prog.beats[1].cid);
 assert.ok(final,'title payoff remains booked');
 assert.equal(prog.beats[1].rid,replacement,'announced champion updated');
 assert.equal(final.rid,replacement,'signed contract updated to current champion');
 assert.equal(prog.rid,replacement,'programme story remembers correct opponent');
 assert.ok(s.inbox.some(m=>/New champion, new programme payoff/.test(m.subject)));
}
console.log('PASS changed champions lead to a documented new title opponent');
{
 const {s,prog,pid,div}=setup();
 // A valid player-held belt needs a place on this promotion's title ladder.
 // Otherwise the title office (correctly) recrowns it before programme checks.
 s.territory.cards[pid].rex??={score:45,matches:1,wins:1};
 s.territory.titles[pid][div].holder='rex';
 assert.equal(T.title(pid,div).holder,'rex');
 G.endWeek();
 assert.equal(T.title(pid,div).holder,'rex','the same-stable champion must still hold the belt');
 assert.ok(!P.state(s.territory).live.some(p=>p.id===prog.id),'invalid title programme closed');
 assert.equal(P.state(s.territory).done.find(p=>p.id===prog.id)?.status,'cancelled');
 assert.ok(!s.futureBookings.some(c=>c.programme?.id===prog.id));
 assert.ok(s.inbox.some(m=>m.subject==='The title programme is cancelled'));
}
console.log('PASS ineligible same-stable champion cancels without a phantom title bout');
