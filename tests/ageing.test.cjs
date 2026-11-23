'use strict';
// Season-end ageing: veterans decline, young wrestlers grow towards a hidden ceiling,
// rumoured veterans may retire the following season, and retirement cancels bookings.
// Run: node tests/ageing.test.cjs
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');

const root={addEventListener(){}};
const store=new Map();
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},JSON,console});
const G=root.OfficeGame;
function freshWithRoster(){G.fresh();G.S.cash=1000000;for(const w of G.S.free.slice(0,3))G.sign(w.id);assert.ok(G.S.roster.length>=2,'roster needs signings');return G.S;}

// Retirement odds: none before 38, rising to a cap of 60%.
assert.equal(G.retireChance(37),0);
assert.ok(Math.abs(G.retireChance(40)-.36)<1e-9);
assert.equal(G.retireChance(60),.6);

// Veteran decline: a 41-year-old loses 2 ring and gains 1 psych, with no retirement roll (not rumoured).
let S=freshWithRoster();
const vet=S.roster[0];
vet.age=41;vet.ring=70;vet.psych=60;vet.retireWarned=false;
const vetId=vet.id;
let out=G.ageRoster();
assert.ok(!out.retired.includes(vetId));
assert.equal(G.S.roster.find(w=>w.id===vetId).age,42);
assert.equal(G.S.roster.find(w=>w.id===vetId).ring,68);
assert.equal(G.S.roster.find(w=>w.id===vetId).psych,61);

// Rookie growth: a 22-year-old grows, and never past the ceiling set on first ageing.
S=freshWithRoster();
const kid=S.roster[0];
kid.age=22;kid.ring=60;kid.mic=55;kid.psych=50;delete kid.ceiling;
G.ageRoster();
const after=G.S.roster.find(w=>w.id===kid.id);
assert.equal(after.age,23);
assert.ok(after.ring>60,'young ring should grow');
assert.ok(after.ring<=after.ceiling,'ring must not pass the ceiling');
assert.equal(after.ceiling,Math.max(60,55,50)+12);

// Retirement: a rumoured wrestler either retires (removed, bookings cancelled) or stays on with a message.
S=freshWithRoster();
const rumoured=S.roster[0];
rumoured.age=30;rumoured.retireWarned=true;// under 38: no fresh rumour can be rolled, so the outcome is only the 70% retirement check
const before=G.S.roster.length;
out=G.ageRoster();
assert.equal(G.S.roster.length,before-out.retired.length);
for(const id of out.retired){
 assert.ok(!G.S.roster.some(w=>w.id===id),'retired wrestler must leave the roster');
 assert.ok(![...G.S.card,...G.S.futureBookings].some(c=>c.wid===id),'retired wrestler must have no bookings');
}
if(!out.retired.includes(rumoured.id)){
 assert.equal(G.S.roster.find(w=>w.id===rumoured.id).retireWarned,false,'a wrestler who stays on loses the rumour');
}

// Every wrestler's stats stay within 0..100.
for(const w of G.S.roster){
 for(const k of ['ring','mic','psych','safe'])assert.ok(w[k]>=0&&w[k]<=100,`${w.name} ${k} out of range`);
}
console.log('ageing tests passed');
