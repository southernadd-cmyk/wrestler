'use strict';
// The start screen's poster shows only real matches: a saved career's own booking, or a match the
// circuit will actually book. Run: node tests/start-poster.test.cjs
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const db=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},console,Math,Date,JSON});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T}=root;
assert.ok(script.includes('OfficeTerritory.startBill?.(saved)'),'the start screen asks the engine for its bill');
const said=(lines,m)=>lines.some(l=>l.includes(m.a.name)&&l.includes(m.b.name));
const rand=k=>()=>k;

// 1. A new career: every match on the poster's show is booked when week 2 comes round.
const store0=JSON.stringify([...db]);
const world=T.newCareerWorld(),show=T.circuitBill(world,world.territory,2,new Set());
assert.equal(JSON.stringify([...db]),store0,'working out the bill saves nothing');
assert.ok(show.length>=6,'the first show has a full card: '+show.length);
for(let n=0;n<4;n++){
 G.fresh();G.endWeek();
 const lines=G.S.territory.reports[0].lines;
 for(const m of show)assert.ok(said(lines,m),'new career '+n+': '+m.a.name+' v '+m.b.name+' is on the week 2 card');
}
for(const k of [0,.3,.6,.99]){
 const bill=T.startBill(null,rand(k));
 assert.ok(bill&&!bill.saved&&bill.head.week===2&&show.some(m=>m.a.id===bill.head.a.id&&m.b.id===bill.head.b.id),'the poster headliner is from that show');
 assert.ok(bill.under.length===2&&bill.under.every(u=>show.some(m=>m.a.id===u.a.id&&m.b.id===u.b.id)),'so is the undercard');
 if(bill.head.title)assert.equal(world.territory.titles[bill.head.pid][bill.head.div].holder===bill.head.a.id||world.territory.titles[bill.head.pid][bill.head.div].holder===bill.head.b.id,true,'a title match involves the champion');
}

// 2. A career in play: the circuit bill predicts what evolve() books, week after week.
G.fresh();G.S.seed=11;
let checked=0;
for(let week=0;week<12;week++){
 const S=G.S,next=T.absWeek(S)+1;
 if(S.roster.length<2)for(const t of S.free.slice().sort((a,b)=>a.fee-b.fee)){if(S.roster.length>=2)break;if(S.cash-t.fee>=600)G.sign(t.id);}
 for(const m of G.pending())G.answer(m.id,m.options[0].id);
 for(const o of S.offers.slice()){const w=S.roster.find(x=>D.divisionOf(x)===D.divisionOf(o.rid)&&G.availableAt(x,o.eventAbs)&&!G.bookedAt?.(x,o.eventAbs));if(w&&o.eventAbs>T.absWeek(S))G.book(o.id,w.id);}
 // Predict from a saved copy, as the start screen does.
 const copy=JSON.parse(JSON.stringify(S));
 const predicted=T.circuitBill(copy,T.prepare(copy),next,new Set((copy.futureBookings||[]).filter(c=>c.eventAbs===next).map(c=>c.rid)));
 S.card=[];G.endWeek();
 const lines=G.S.territory.reports[0].lines;
 for(const m of predicted){assert.ok(said(lines,m),'week '+next+': '+m.a.name+' v '+m.b.name+' was booked');checked++;}
}

// 3. A saved career with a booking headlines that booking, tonight, and leaves the save alone.
G.fresh();G.S.seed=5;G.sign('rex');
// A booking placed directly (a new career's offers depend on the clock), next week, main event.
const rid=T.opponents('dock','main',D.divisionOf('rex'))[0].id;
const offer={pid:'dock',rid,eventAbs:T.absWeek(G.S)+1};
G.S.futureBookings.push({id:'poster-c',wid:'rex',rid,pid:'dock',slot:'main',minutes:15,finish:'win_clean',purse:300,eventAbs:offer.eventAbs});
G.S.card.push({id:'poster-d',wid:'rex',rid:T.opponents('pulse','opener',D.divisionOf('rex'))[0].id,pid:'pulse',slot:'opener',minutes:8,finish:'lose_clean',purse:150,eventAbs:T.absWeek(G.S)});
const raw=JSON.stringify(G.S),saved=JSON.parse(raw);
const bill=T.startBill(saved,rand(.5));
assert.equal(JSON.stringify(saved),raw,'the saved career is not changed');
assert.ok(bill.saved&&bill.head.yours,'your own booking is the headliner');

// Tonight's booking comes first; next week's is on the undercard, marked with its week.
assert.equal(bill.head.pid,'pulse');assert.equal(bill.head.tonight,true);assert.equal(bill.head.a.id,'rex');
assert.ok(bill.under.some(u=>u.b.id===offer.rid&&u.week===offer.eventAbs&&u.yours),'the next booking is underneath');
// With nothing booked, the next circuit show headlines instead.
G.S.card=[];G.S.futureBookings=[];
const idle=T.startBill(JSON.parse(JSON.stringify(G.S)),rand(.2));
assert.ok(idle&&!idle.head.yours&&idle.head.week===T.absWeek(G.S)+1,'the next circuit show');
// An unreadable save falls back to nothing, not an error.
assert.equal(T.startBill({v:22,roster:'nonsense'},rand(0))?.saved??false,false);

console.log('PASS start poster: a new career’s week 2 card ('+show.length+' matches) is exactly what four fresh careers book; '+checked+' circuit matches predicted over 12 played weeks; your own booking headlines a saved career; nothing is saved or changed');
