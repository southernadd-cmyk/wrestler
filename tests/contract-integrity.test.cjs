'use strict';
// Real cross-system career invariants: signed deals, opponent acquisition, and roster exits.
const assert=require('node:assert/strict');
const {engine,check}=require('./_world.cjs');
const {root}=engine(4051);
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeProgrammes:P,
 OfficeMouthpiece:MP,OfficeRingside:R,OfficeWorldV4:V4,OfficeAmbitions:A}=root;
const now=()=>G.abs();
function fresh(){
 G.fresh();const s=G.S;s.cash=99999;s.rep=60;s.inbox=[];s.offers=[];
 assert.equal(G.sign('rex'),null);
 G.P('crown').trust=70;
 return s;
}
function programme(s,{wid='rex',rid='silas',pid='crown',n=3}={}){
 const id='transfer-pr-'+Math.floor(s.futureBookings.length+100*s.territory.programmes.live.length);
 const beats=Array.from({length:n},(_,k)=>({cid:id+':'+k,at:now()+k+1,rid,slot:'mid',finish:'win_clean',done:false}));
 const pr={id,pid,div:D.divisionOf(wid),type:'grudge',wid,rid,beats,signed:now()};
 for(const [i,b] of beats.entries())s.futureBookings.push({id:b.cid,pid,wid,rid:b.rid,slot:b.slot,minutes:12,
  finish:b.finish,purse:240,eventAbs:b.at,programme:{id,step:i}});
 P.state(s.territory).live.push(pr);
 return pr;
}
function inFixture(s,id){return [...s.card,...s.futureBookings].some(c=>c.wid===id||c.rid===id);}
function pendingProgramme(s,id){return P.state(s.territory).live.some(p=>p.id===id);}

// Acquiring an opponent clears two programme dates as ONE contract, not two per-match penalties.
{
 const s=fresh(),target=s.free.find(w=>D.divisionOf(w.id)===D.divisionOf('rex')&&w.id!=='rex');
 assert.ok(target,'a player-signable opponent exists');
 const pr=programme(s,{rid:target.id,n:3}),p=G.P(pr.pid),old=p.trust;
 const other={id:'ordinary-opponent',pid:'dock',wid:'rex',rid:target.id,eventAbs:now()+7,
  slot:'opener',finish:'win_clean',purse:180};
 s.futureBookings.push(other);
 s.offers.push({id:'target-offer',pid:'dock',rid:target.id,slot:'opener',finish:'win_clean',
  eventAbs:now()+8,expiresAbs:now()+8});
 s.offers.push({id:'target-programme-offer',pid:'crown',rid:'malik',slot:'feature',tag:'Programme',
  eventAbs:now()+8,expiresAbs:now()+8,programme:{id:'offer-pr',wid:'rex',beats:[{rid:target.id,at:now()+8}]}});
 P.state(s.territory).offered.push({id:'offer-pr',pid:'crown',type:'grudge',until:now()+9,
  beats:[{rid:target.id}]});
 assert.equal(G.sign(target.id),null);
 assert.ok(G.W(target.id),'opponent joined the player roster');
 assert.ok(!inFixture(s,target.id),'no live or future match can still use a new stablemate as opponent');
 assert.ok(!pendingProgramme(s,pr.id));
 assert.equal(P.state(s.territory).done.find(p=>p.id===pr.id)?.status,'walked');
 assert.equal(p.trust,old-15,'one penalty for the full contract');
 assert.equal(G.P('dock').trust,55,'ordinary booked opponent gets its own -6 trust at Dockside (default 61)');
 assert.ok(!s.offers.some(x=>x.rid===target.id||x.programme?.id==='offer-pr'));
 assert.ok(!P.state(s.territory).offered.some(x=>x.id==='offer-pr'));
 const c={id:'test-bout',wid:'rex',rid:target.id,eventAbs:now(),pid:'crown',finish:'win_clean'};
 assert.ok(!R.seconds(c,G.W('rex'),G.F(target.id)).some(x=>x.id===target.id));
 assert.ok(!MP.candidates(c,G.W('rex')).some(x=>x.id===target.id));
 assert.deepEqual(check(root,s,'signed opponent'),[]);
 console.log('PASS signing a booked opponent cancels contracts once, unsigns offers and blocks self-corner work');
}

// Releasing or selling a client terminates the programme ONCE and preserves world ownership.
{
 const s=fresh(),pr=programme(s,{rid:'silas'}),p=G.P('crown'),old=p.trust;
 G.release('rex');
 assert.equal(p.trust,old-15,'releasing three future contracts is a single programme withdrawal');
 assert.ok(!pendingProgramme(s,pr.id));
 assert.ok(!inFixture(s,'rex'));
 assert.equal(s.worldV4.contracts.rex.owner,'market');
 assert.ok(s.free.some(x=>x.id==='rex'));
 assert.deepEqual(check(root,s,'release programme'),[]);
 console.log('PASS releasing a programme wrestler closes all dates with one -15 trust penalty');
}
{
 const s=fresh(),pr=programme(s,{rid:'silas'}),p=G.P('crown'),old=p.trust;
 const rex=G.W('rex');
 G.leave(rex,400);
 assert.equal(p.trust,old-15);
 assert.ok(!pendingProgramme(s,pr.id));
 assert.ok(!inFixture(s,'rex'));
 assert.equal(s.worldV4.contracts.rex.owner,'market');
 assert.ok(s.free.some(x=>x.id==='rex'));
 assert.equal(V4.hire(s,s.territory.teams.find(t=>V4.canAfford(s,t.id,'rex'))?.id,'rex'),true,
  'a released player can actually be signed by the buying AI manager');
 assert.deepEqual(check(root,s,'sold wrestler'),[]);
 console.log('PASS manager sales unwind programmes and transfer ownership to AI');
}

// Signing/poaching an opponent on another current-week match must never allow self-second,
// including on old saves where an invalid contract survived.
{
 const s=fresh(),candidate=s.free.find(w=>D.divisionOf(w.id)===D.divisionOf('rex')&&w.id!=='rex');
 assert.equal(G.sign(candidate.id),null);
 s.card.push({id:'legacy-conflict',wid:'rex',rid:candidate.id,pid:'crown',eventAbs:now(),finish:'win_clean'});
 const c=s.card[0];
 assert.ok(!R.seconds(c,G.W('rex'),G.F(candidate.id)).some(x=>x.id===candidate.id));
 assert.ok(!MP.candidates(c,G.W('rex')).some(x=>x.id===candidate.id));
 console.log('PASS defensive eligibility guards handle incompatible older cards');
}

// Ambition mail and memory must describe the promise that actually expired, not a rerolled kind.
{
 const s=fresh(),w=G.W('rex'),e=A.entry('rex');
 e.kind='body';e.since=now()-20;e.good=0;e.promise={made:now()-8,by:now()-2};
 s.ambitions.lastWeek=-99;
 A.weekly(now());
 const email=s.inbox.find(m=>m.subject==='You promised');
 assert.ok(email,'expired promise produces the expected email');
 assert.match(email.body[0],/lighter weeks/i);
 assert.match(email.body[0],/6 weeks/i);
 assert.doesNotMatch(email.body[0],/money|better pay/i);
 assert.ok(!e.promise);
 console.log('PASS expired promise email names original ambition and six-week deadline');
}
