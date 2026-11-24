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

const D=root.OfficeData,V=root.OfficeWorldV4,T=root.OfficeTerritory;
{
 G.fresh();const s=G.S;
 const free=s.free[0],rival=s.territory.teams[0].roster[0],ind=Object.keys(s.worldV4.contracts).find(id=>s.worldV4.contracts[id].owner==='independent');
 s.worldV4.personnel={[rival]:{age:41,ring:70,psych:60,injury:2,injurySince:0,fatigue:55,wear:{knee:3}},[ind]:{age:22,ring:60,psych:50,mic:55,ceiling:75}};
 Object.assign(free,{age:24,ring:60,ceiling:75,injury:2,injurySince:0,fatigue:60});
 const seed=s.seed;
 V.recoverPersonnel(s,1);V.recoverPersonnel(s,1);
 assert.equal(free.injury,1);assert.equal(G.F(rival).injury,1);assert.equal(G.F(rival).wear.knee,3);
 V.recoverPersonnel(s,2);assert.equal(free.injury,0);assert.equal(G.F(rival).injury,0);
 V.agePersonnel(s,1);V.agePersonnel(s,1);
 assert.equal(free.age,25);assert.equal(G.F(rival).age,42);assert.equal(G.F(rival).ring,68);
 assert.equal(G.F(ind).age,23);assert.ok(G.F(ind).ring>60);
 assert.equal(s.seed,seed,'external lifecycle never consumes player RNG');
 G.save();assert.ok(G.load());assert.equal(G.F(rival).age,42);assert.equal(G.F(ind).age,23);
}
{
 const s=freshWithRoster(),w=s.roster[0],id=w.id;
 w.retireWarned=true;s.seed=1;
 const out=G.ageRoster();assert.ok(out.retired.includes(id));
 assert.equal(V.ownership(s,id).owner,'retired');assert.equal(G.sign(id),'Not available.');
 assert.ok(!T.rank().some(x=>x.id===id));assert.ok(!T.promotionRank('dock').some(x=>x.id===id));
 assert.ok(!V.hire(s,s.territory.teams[0].id,id));assert.ok(G.F(id),'retired identity remains readable');
 G.save();assert.ok(G.load());assert.equal(V.ownership(G.S,id).owner,'retired');
}
{
 G.fresh();const s=G.S;const team=s.territory.teams[0];
 const id=team.roster[0],worker=G.F(id);
 const div=D.divisionOf(id);s.territory.cards.dock[id]??={score:60,matches:0,wins:0};
 s.territory.titles.dock[div]={holder:id,since:1,defences:2};
 const old=JSON.stringify(s);const preview=V.previewLifecycle(s,2);
 assert.equal(JSON.stringify(s),old,'preview never mutates the input career');
 assert.notEqual(preview,s);
 V.markRetired(s,worker,17);T.settleRetiredTitles(s);
 assert.notEqual(s.territory.titles.dock[div].holder,id);
 assert.ok(!team.roster.includes(id));assert.ok(!s.free.some(w=>w.id===id));
 assert.ok(!T.circuitBill(s,s.territory,2).some(m=>m.a.id===id||m.b.id===id));
}
console.log('PASS external ageing, recovery, retirement ownership, belts, previews and save compatibility');
