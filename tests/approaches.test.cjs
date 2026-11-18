'use strict';
// v0.3.19 rival stables: viewing the agencies' rosters, approaching their wrestlers, and managers' grudges.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeAmbitions:A,OfficeManagers:M,OfficeApproaches:X}=root;
assert.ok(X&&X.stables&&X.approach,'approaches are installed');
const fresh=(ids=[])=>{G.fresh();const s=G.S;s.cash=99999;s.rep=60;for(const id of ids)G.sign(id);s.inbox=[];A.state();return s;};
const ready=s=>{s.focus=2;};

// 1. Every agency's roster is on view, with how each wrestler feels and what their stable wants for them.
{
 const s=fresh(),all=X.stables();
 assert.equal(all.length,6,'six rival stables');
 for(const t of all){
  assert.ok(t.manager&&t.blurb&&t.wrestlers.length>=3,'roster and manager for '+t.name);
  for(const w of t.wrestlers){
   assert.ok(['Wants out','Restless','Settled'].includes(w.mood)&&w.fee>0&&w.read&&w.pitch,'a full view of '+w.name);
   assert.equal(s.worldV4.contracts[w.id].agencyId,t.id);
  }
 }
 // Near the end of the contract they come cheaper; a champion costs more.
 const w=all[0].wrestlers.find(x=>!x.champion),c=s.worldV4.contracts[w.id];
 const normal=X.fee(s,w.id);c.expiresWeek=G.abs()+2;
 assert.ok(X.fee(s,w.id)<normal,'cheaper near the end of the contract');
 const champ=all.flatMap(t=>t.wrestlers).find(x=>x.champion);
 if(champ)assert.ok(X.fee(s,champ.id)>(D.findWrestler(champ.id).fee)*1.2,'a champion comes dear');
 console.log('PASS the six rival stables are on view, with moods, wants and fees');
}

// 2. A settled wrestler turns you down; the meeting is spent and the manager hears about it.
{
 const s=fresh(),team=X.stables()[1],w=team.wrestlers[0];
 s.ambitions.w[w.id].sat=80;ready(s);
 const res=X.approach(w.id);
 assert.equal(res.ok,false);assert.match(res.text,/happy where they are/);
 assert.equal(s.focus,1,'it cost a meeting');
 assert.equal(M.state(s.territory).grudge[team.id],1,'the manager knows');
 assert.ok(s.inbox.some(m=>/Leave .+ alone/.test(m.subject)));
 assert.match(X.approach(w.id).error,/already heard from you/,'not again straight away');
 console.log('PASS a settled wrestler says no, and the manager hears about it');
}

// 3. A wrestler who wants out says yes: the fee goes to their stable and they sign for you.
{
 const s=fresh();let done=null;
 const candidates=X.stables().flatMap(t=>t.wrestlers).filter(w=>!w.champion).sort((a,b)=>(D.findWrestler(a.id).loyal)-(D.findWrestler(b.id).loyal));
 for(const w of candidates){
  s.ambitions.w[w.id].sat=0;ready(s);
  const team=s.worldV4.contracts[w.id].agencyId,price=X.fee(s,w.id),cash=s.cash,agency=s.worldV4.agencies[team].cash;
  const res=X.approach(w.id);
  if(res.ok){done={w,team,price,cash,agency,res};break;}
 }
 assert.ok(done,'someone who wants out says yes');
 const {w,team,price,cash,agency}=done;
 assert.ok(G.W(w.id),w.name+' is in your stable');
 assert.equal(s.worldV4.contracts[w.id].owner,'player');
 assert.equal(s.cash,cash-price,'you pay the fee');
 assert.equal(s.worldV4.agencies[team].cash,agency+price,'and their stable receives it');
 assert.ok(!s.territory.teams.find(t=>t.id===team).roster.includes(w.id));
 assert.ok(M.state(s.territory).grudge[team]>=2,'the manager will not forget');
 assert.ok(s.inbox.some(m=>/You took/.test(m.subject))&&s.inbox.some(m=>m.subject==='What I want'),'the manager and the new signing both have their say');
 console.log('PASS '+w.name+' signs from a rival stable for '+price);
}

// 4. You need room, a meeting and the money.
{
 const s=fresh(['rex','mara','kit','sol','dee']),w=X.stables()[0].wrestlers[0];
 ready(s);assert.match(X.approach(w.id).error,/full/);
 const s2=fresh(),w2=X.stables()[0].wrestlers[0];
 s2.focus=0;assert.match(X.approach(w2.id).error,/meetings/);
 s2.focus=2;s2.cash=10;assert.match(X.approach(w2.id).error,/You need/);
 assert.equal(s2.focus,2,'a refused attempt costs nothing');
 console.log('PASS approaches need a free contract, a meeting and the fee');
}

// 5. A manager with a grudge comes for your wrestlers sooner, and is the one who bids.
{
 const s=fresh(['rex']),rex=G.W('rex');rex.heat=70;rex.loyal=40;
 for(const a of Object.values(s.worldV4.agencies))a.cash+=50000;
 const a=M.state(s.territory),wk=T.absWeek(s);
 const usualTurn=()=>{a.lastTurn=-1;M.turn(s,s.territory,wk,[]);};
 a.lastBid=wk-4;usualTurn();
 assert.ok(!s.inbox.some(m=>m.dtype==='agent_bid'),'normally a manager waits six weeks between offers');
 const sore=s.territory.teams.find(t=>t.id==='eastbank');a.grudge={eastbank:3};
 a.lastBid=wk-4;usualTurn();
 const bid=s.inbox.find(m=>m.dtype==='agent_bid');
 assert.ok(bid,'with a grudge they come back sooner');
 assert.equal(bid.args[1],sore.id,'and it is the manager you crossed');
 // Grudges fade.
 let w8=wk;while(w8%8)w8++;a.lastTurn=-1;M.turn(s,s.territory,w8,[]);
 assert.equal(a.grudge.eastbank,2,'a grudge fades with time');
 console.log('PASS managers you have crossed come after you, then slowly let it go');
}

// 6. The circuit stays predictable, and the save stays sound.
{
 const s=fresh();
 for(let i=0;i<10;i++){
  const w=X.stables().flatMap(t=>t.wrestlers).find(x=>x.mood!=='Settled'&&!x.cooldown);
  if(w&&s.roster.length<5){ready(s);X.approach(w.id);}
  for(const m of G.pending())G.answer(m.id,m.dtype==='agent_bid'?'refuse':m.options[0].id);
  const copy=JSON.parse(JSON.stringify(s)),next=T.absWeek(s)+1;
  const predicted=T.circuitBill(copy,T.prepare(copy),next,new Set((copy.futureBookings||[]).filter(c=>c.eventAbs===next).map(c=>c.rid)));
  s.card=[];G.endWeek();
  assert.equal(s.territory.lastResults.matches.map(m=>m.a+'|'+m.b).sort().join(),predicted.map(m=>m.a.id+'|'+m.b.id).sort().join(),'the start screen can still predict the circuit');
 }
 for(const t of s.territory.teams)for(const id of t.roster)assert.equal(s.worldV4.contracts[id].agencyId,t.id);
 for(const w of s.roster)assert.equal(s.worldV4.contracts[w.id].owner,'player');
 assert.doesNotMatch(JSON.stringify(s.territory.agents),/NaN|undefined/);
 console.log('PASS ten weeks of approaches: contracts consistent, circuit predictable');
}
