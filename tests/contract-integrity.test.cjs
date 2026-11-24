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
 const pr=programme(s,{rid:target.id,n:3}),p=G.P(pr.pid),old=p.trust,dockBefore=G.P('dock').trust;
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
 assert.equal(G.P('dock').trust,Math.max(0,dockBefore-6),'ordinary booked opponent costs -6 trust');
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
 assert.match(email.body[0],/lighter schedule/i);
 assert.match(email.body[0],/6 weeks/i);
 assert.doesNotMatch(email.body[0],/money|better pay/i);
 assert.ok(!e.promise);
 console.log('PASS expired promise email names original ambition and six-week deadline');
}


// Promoter favours must have a legitimate, unbooked opponent and a current-week date.
{
 const s=fresh(),p=G.P('crown');
 const msg={id:'favour-test',from:p.name,subject:'A favour',kind:'decision',dtype:'favour',
  args:['crown'],options:[{id:'yes',label:'Agree'},{id:'no',label:'Refuse'}],answer:null};
 s.inbox.unshift(msg);
 const outcome=G.answer('favour-test','yes');
 assert.ok(outcome,'the promoter request resolves');
 const c=s.card.find(c=>c.tag==='Favour');
 if(c){
  assert.equal(c.eventAbs,G.abs(),'the contract has a real current show date');
  assert.equal(D.divisionOf(c.wid),D.divisionOf(c.rid));
  assert.ok(!G.W(c.rid),'your own wrestler cannot be their favour opponent');
  assert.ok(c.rid!=='malik'||D.divisionOf(c.rid)===D.divisionOf(c.wid));
 }else assert.match(outcome,/could not secure|Nobody was free/);
}
console.log('PASS promoter favours never create undated or own-stable contracts');

/* A worker's physical state, development and past performance survive every
   contract boundary. Contract terms and temporary commitments start afresh. */
{
 let s=fresh(),w=G.W('rex');
 const state={age:37,ceiling:83,ring:78,mic:71,psych:75,safe:68,heat:62,morale:41,loyal:38,fatigue:79,
  injury:3,injurySince:now(),wear:{shoulder:4},niggle:2,nigglePart:'knee',relapse:{part:'shoulder'},
  retireWarned:true,learned:['test-move'],learning:{move:'other-move',done:2,need:3},
  micWork:{proof:1.5},progress:{ring:.75},prepHistory:[{week:1,focus:'ring',gains:2}],
  matches:9,wins:3,starSum:27,best:4};
 Object.assign(w,state,{program:{type:'camp',left:2},prep:{ring:3},session:'rehearse',rehearsedAt:now(),
  promise:{status:'open'},flags:{dive:true},training:'safe',intensity:'hard',lastRaise:9,wage:999});
 const expect=JSON.stringify(state);
 function personal(p){assert.equal(JSON.stringify(Object.fromEntries(Object.keys(state).map(k=>[k,p[k]]))),expect);}
 function cleanContract(p){assert.equal(p.program,null);assert.equal(p.session,null);assert.equal(p.promise,null);
  assert.equal(p.rehearsedAt,null);assert.equal(Object.keys(p.flags).length,0);assert.equal(p.lastRaise,0);
  assert.notEqual(p.wage,999);}
 G.release('rex');personal(s.free.find(p=>p.id==='rex'));
 assert.equal(G.sign('rex'),null);w=G.W('rex');personal(w);cleanContract(w);
 assert.equal(G.available(w),false,'release/re-sign cannot clear an injury');
 G.leave(w,0);personal(s.free.find(p=>p.id==='rex'));
 const team=s.territory.teams.find(t=>V4.canAfford(s,t.id,'rex'));
 assert.ok(team&&V4.hire(s,team.id,'rex'));assert.ok(!s.free.some(p=>p.id==='rex'));
 personal(G.F('rex'));
 G.save();assert.ok(G.load());s=G.S;personal(G.F('rex'));
 assert.ok(V4.releaseAI(s,'rex'));personal(s.free.find(p=>p.id==='rex'));
 const other=s.territory.teams.find(t=>t.id!==team.id&&V4.canAfford(s,t.id,'rex'));
 assert.ok(other&&V4.hire(s,other.id,'rex'));assert.ok(V4.releaseAI(s,'rex'));
 assert.equal(G.sign('rex'),null);personal(G.W('rex'));cleanContract(G.W('rex'));
 assert.deepEqual(check(root,s,'persistent worker round trip'),[]);
 // Save and reload after re-signing; nested snapshots must not alias the live record.
 G.save();assert.ok(G.load());personal(G.W('rex'));
 assert.equal(G.S.worldV4.personnel?.rex,undefined);
}
console.log('PASS personal state through release, re-sign, sale, rival transfers and save/reload');
