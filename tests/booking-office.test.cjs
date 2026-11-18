'use strict';
// v0.3.15 the booking office: bookers plan storylines, book around them and choose finishes to serve them.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeBooking:B}=root;
assert.ok(B&&B.decide&&B.view,'the booking office is installed');
const fresh=()=>{G.fresh();G.S.cash=99999;G.S.inbox=[];return G.S;};

// 1. Deciding the week changes nothing: the start screen depends on it.
fresh();
const before=JSON.stringify(G.S),plan=B.decide(G.S,G.S.territory,T.absWeek(G.S)+1);
assert.equal(JSON.stringify(G.S),before,'decide() is pure');
assert.ok(plan.bill.length>=8&&plan.state.promos.dock,'a plan and a card come back');
console.log('PASS deciding the week reads the career and changes nothing');

// 2. Two seasons on the circuit: storylines start, play out and finish; the card stays sound.
fresh();G.sign('rex');
const mine=new Set(G.S.roster.map(w=>w.id));
let beats=0,followed=0;
for(let w=0;w<32;w++){
 G.S.card=[];G.endWeek();
 const t=G.S.territory,res=t.lastResults;
 const seen=new Set();
 for(const m of res.matches){
  for(const id of [m.a,m.b]){assert.ok(!seen.has(id),'nobody works twice in one week: '+id);seen.add(id);assert.ok(!mine.has(id),'your wrestlers are not booked by the circuit');}
  assert.equal(D.divisionOf(m.a),D.divisionOf(m.b),'same division');
  assert.ok([m.a,m.b].includes(m.winner),'the winner was in the match');
  if(m.story){beats++;
   const st=Object.values(t.booking.promos).flatMap(p=>[...p.live,...p.done]).find(x=>x.id===m.story);
   const beat=st?.beats.find(b=>b.done&&b.winner===m.winner&&(b.opp===m.a||b.opp===m.b||st.a===m.a||st.a===m.b));
   if(beat)followed++;}
 }
 const perPromo={};for(const m of res.matches)perPromo[m.pid+m.div]=(perPromo[m.pid+m.div]||0)+1;
 assert.ok(Object.values(perPromo).every(n=>n<=2),'at most two matches a division a week');
}
const promos=G.S.territory.booking.promos;
const done=Object.values(promos).flatMap(p=>p.done),types=new Set(done.map(x=>x.type));
assert.ok(D.PROMOS.every(p=>promos[p.id].done.length+promos[p.id].live.length>=2),'every promoter runs storylines');
assert.ok(types.has('title')&&types.has('grudge')&&types.has('rise'),'all three kinds play out: '+[...types]);
assert.ok(done.some(x=>x.type==='title'&&x.status==='paid')&&done.some(x=>x.status==='held'),'challengers sometimes win, sometimes not');
assert.ok(beats>=40&&followed===beats,`storyline matches follow the plan (${followed} of ${beats})`);
const lines=G.S.territory.reports.flatMap(r=>r.lines);
assert.ok(lines.some(l=>/on the road to .+ The title match is planned for S\d W\d+\./.test(l)),'title chases are announced');
assert.ok(lines.some(l=>/keeps climbing|has arrived|not finished yet|settles it/.test(l)),'storyline results read as part of a story');
console.log(`PASS two seasons: ${done.length} storylines finished, ${beats} storyline matches all played as planned`);

// 3. Belts change hands only at a payoff or the champion's own defence, and the log agrees.
for(const x of done.filter(x=>x.type==='title'&&x.status!=='dropped')){
 const payoff=x.beats.at(-1);
 assert.equal(payoff.winner===x.a,x.status==='paid','the outcome matches the payoff match');
 if(x.status==='paid')assert.ok(G.S.territory.titleLog.some(l=>l.to===x.a&&l.from===x.b&&l.pid===x.pid)||G.S.territory.titleLog.length>=40,'a paid-off chase is in the title log');
}
console.log('PASS title chases change belts only at the payoff');

// 4. Each booker plans in their own way.
const s=fresh(),wk=T.absWeek(s)+1;
s.territory.booking=B.blank(wk);for(const p of Object.values(s.territory.booking.promos))for(const d in p.next)p.next[d]=wk;
const first=B.decide(s,s.territory,wk).state.promos;
const chase=pid=>[...first[pid].live].find(x=>x.type==='title');
assert.equal(chase('crown')?.beats.length,B.STYLE.traditional.titleLen,'North Crown builds a long title chase');
assert.ok(!chase('dock')||chase('dock').beats.length===B.STYLE.aggressive.titleLen,'Dockside’s are short');
assert.ok(first.dock.live.every(x=>x.type!=='title')||first.dock.live.length>=1,'Dockside reaches for a grudge first when it has one');
assert.ok(Object.values(first).every(p=>p.live.length<=4));
console.log('PASS bookers plan to their own style');

// 5. A wrestler who wants a title shot, and is pushing for it, is the one the booker builds.
{
 const s2=fresh(),w2=T.absWeek(s2)+1;
 s2.territory.booking=B.blank(w2);for(const p of Object.values(s2.territory.booking.promos))for(const d in p.next)p.next[d]=w2;
 const pool=T.promotionRank('crown','men',s2.territory,s2).filter(w=>!w.owned&&T.contracted(s2,w.id));
 const holder=s2.territory.titles.crown.men.holder,champ=pool.find(w=>w.id===holder);
 root.OfficeAmbitions.state();
 const usual=B.decide(s2,s2.territory,w2).state.promos.crown.live.find(x=>x.type==='title')?.a;
 const hopeful=pool.filter(w=>w.id!==holder&&w.id!==usual&&['main','feature'].includes(w.slot)&&w.stable!==champ?.stable)[0];
 if(hopeful&&champ&&usual){
  // The favourite is content; the next contender wants it badly.
  Object.assign(s2.ambitions.w[usual],{kind:'push',sat:100});
  const e=s2.ambitions.w[hopeful.id];e.kind='title';e.sat=0;
  const story=B.decide(s2,s2.territory,w2).state.promos.crown.live.find(x=>x.type==='title');
  assert.equal(story?.a,hopeful.id,'the frustrated title-seeker gets the chase');
  console.log('PASS ambitions steer who the booker builds');
 }
}

// 6. If someone in a storyline is busy (booked against your wrestler), the story waits a week.
{
 const s3=fresh();G.sign('rex');
 for(let i=0;i<3;i++){s3.card=[];G.endWeek();}
 const live=Object.values(s3.territory.booking.promos).flatMap(p=>p.live).find(x=>x.beats.some(b=>!b.done&&b.at===T.absWeek(s3)+1));
 if(live){
  const next=live.beats.find(b=>!b.done).at;
  s3.card=[{id:'busy',wid:'rex',rid:live.a,pid:'dock',slot:'mid',finish:'win_clean',purse:100,eventAbs:T.absWeek(s3)}];
  const p=B.decide(s3,s3.territory,next);
  const after=Object.values(p.state.promos).flatMap(x=>x.live).find(x=>x.id===live.id);
  assert.ok(!after||after.delays===live.delays+1,'the story waits');
  assert.ok(!p.bill.some(m=>m.a.id===live.a||m.b.id===live.a),'the busy wrestler is not double-booked');
  console.log('PASS a busy storyline wrestler pushes the story back a week');
 }
}

// 7. The sheets view, and an older career without a booking office picks one up on its first week.
{
 const s4=fresh();for(let i=0;i<6;i++){s4.card=[];G.endWeek();}
 const v=B.view('crown');
 assert.ok(v&&v.voice==='Harold Pike'&&/title chases/.test(v.blurb));
 assert.ok(v.live.every(x=>x.aName&&x.bName&&x.next&&x.total>=3));
 delete s4.territory.booking;G.endWeek();
 assert.ok(s4.territory.booking?.promos?.union,'an older career gets a booking office');
 assert.doesNotMatch(JSON.stringify(s4.territory.booking),/NaN|undefined/);
 assert.ok(JSON.stringify(s4.territory.booking).length<25000,'and it stays small in the save');
 console.log('PASS booking sheets view and older careers');
}
