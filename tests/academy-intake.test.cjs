'use strict';
// A finite pool of distinct, illustrated rookies enters the real living world
// at season end, then keeps its identity, stats, ownership and age across saves.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const store=new Map(),root={addEventListener(){}};
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage:storage,JSON,console});
const {OfficeGame:G,OfficeAcademy:A,OfficePortraits:P,OfficeData:D,OfficeWorldV4:V}=root;
assert.equal(A.REGISTER.length,120);
assert.equal(new Set(A.REGISTER.map(w=>w.id)).size,120);
assert.equal(new Set(A.REGISTER.map(w=>w.name)).size,120);
assert.equal(A.REGISTER.filter(w=>w.division==='women').length,60);
assert.ok(A.REGISTER.every(w=>w.entry_age>=18&&w.entry_age<=26&&root.OfficeAgePortraitCells[w.id]));

G.fresh();let s=G.S;s.cash=100000;
const original=JSON.stringify(D.ALL),seed=s.careerSeed;
const ordered=A.order(s).map(w=>w.id);
assert.equal(A.intake(s,1).length,0,'no academy arrival during the first season');
s.week=16;G.endWeek();
assert.equal(s.season,2);
assert.equal(s.academy.arrived.length,4);
assert.equal(s.academy.intakes.length,1);
assert.equal(A.intake(s,2).length,0,'repeated season-end processing is idempotent');
assert.equal(Object.keys(s.worldV4.contracts).length,84);
const newcomers=s.academy.arrived;
assert.equal(newcomers.filter(w=>w.division==='women').length,2);
for(const w of newcomers){
 assert.equal(s.worldV4.contracts[w.id].owner,'market');
 assert.ok(s.free.some(f=>f.id===w.id));
 assert.ok(D.findWrestler(w.id));
 assert.ok(D.PROFILES[w.id].signature.length===4);
 assert.equal(root.OfficeRoom.VOICE[w.id],w.roomVoice);
 assert.equal(D.divisionOf(w),w.division);
 assert.equal(P.ageBand({key:'wrestler:'+w.id}),'young');
 assert.match(P.avatar({key:'wrestler:'+w.id,name:w.name}),/age-portrait/);
 assert.ok(D.PROMOS.some(p=>s.territory.cards[p.id]?.[w.id]));
}
assert.ok(s.inbox.some(m=>m.subject==='Season 2 rookie intake'));
assert.equal(A.order(s).map(w=>w.id).join(','),ordered.join(','),'career order stays stable');
const signed=newcomers[0],rival=newcomers[1];
assert.equal(G.sign(signed.id),null,'the player may sign a rookie');
assert.ok(V.hire(s,s.territory.teams[0].id,rival.id),'AI stables may sign a rookie');
assert.equal(s.worldV4.contracts[rival.id].owner,'ai');
G.W(signed.id).age=29;
const young=P.avatar({key:'wrestler:'+signed.id,name:signed.name});
s.week=16;G.endWeek();
assert.equal(s.season,3);
assert.equal(G.W(signed.id).age,30);
assert.notEqual(P.avatar({key:'wrestler:'+signed.id,name:signed.name}),young);
const arrival=JSON.stringify(s.academy.arrived.find(w=>w.id===signed.id));
G.save();assert.ok(G.load());
s=G.S;
assert.equal(JSON.stringify(s.academy.arrived.find(w=>w.id===signed.id)),arrival);
assert.equal(D.findWrestler(signed.id).name,signed.name);
assert.equal(G.W(signed.id).age,30);
assert.equal(s.worldV4.contracts[rival.id].owner,'ai');
V.markRetired(s,G.F(rival.id));
G.save();assert.ok(G.load());
s=G.S;
assert.equal(s.worldV4.contracts[rival.id].owner,'retired');
assert.equal(D.findWrestler(rival.id).name,rival.name,'retired rookies remain in career history');
assert.ok(s.academy.arrived.some(w=>w.id===rival.id),'career identity survives retirement and reload');

// A different seed reveals a different cohort, and a new career clears the
// earlier career's added templates and does not spend its reserve pool.
G.fresh();s=G.S;s.careerSeed=seed+1;
assert.equal(JSON.stringify(D.ALL),original);
assert.equal(s.academy.arrived.length,0);
assert.equal(root.OfficeRoom.VOICE[signed.id],undefined,'fresh career clears old rookie voices');
assert.notEqual(A.order(s).slice(0,12).map(w=>w.id).join(','),ordered.slice(0,12).join(','));
const legacy=JSON.parse(JSON.stringify(s));delete legacy.academy;
G.S=legacy;s=G.S;
assert.equal(s.academy.lastIntakeSeason,s.season,'older saves start intake with the next season');
assert.equal(D.ALL.length,80,'older saves do not receive phantom rookies');

// Sustained retirements bring through roughly six per year for twenty years;
// the circuit stays bounded and each identity is used only once.
G.fresh();s=G.S;s.seed=47;s.careerSeed=47;
for(let season=2;season<=21;season++){
 s.season=season;
 if(season>2){
  for(const div of ['men','women']){
   const available=D.ALL.filter(w=>D.divisionOf(w)===div&&s.worldV4.contracts[w.id]?.owner!=='retired').slice(0,3);
   for(const w of available){
    s.worldV4.contracts[w.id].owner='retired';
    s.free=s.free.filter(f=>f.id!==w.id);
   }
  }
  V.activate(s);
 }
 const cohort=A.intake(s,season);
 assert.ok(cohort.length>=4&&cohort.length<=8,'controlled annual intake');
 assert.ok(s.academy.arrived.length<=120,'finite reserve');
 assert.equal(new Set(s.academy.arrived.map(w=>w.id)).size,s.academy.arrived.length);
 const live={men:0,women:0};
 for(const [id,c] of Object.entries(s.worldV4.contracts))if(c.owner!=='retired')live[D.divisionOf(id)]++;
 assert.ok(live.men+live.women<=84,'the world cannot inflate indefinitely');
 assert.ok(Math.abs(s.academy.arrived.filter(w=>w.division==='men').length-
  s.academy.arrived.filter(w=>w.division==='women').length)<=1,'the reserve stays evenly split');
}
assert.ok(s.academy.arrived.length>=110,'the pool sustains twenty seasons of replacement');
assert.equal(s.seed,s.careerSeed,'academy never consumes the simulation RNG');
console.log('PASS seeded academy: 120 unique identities, annual replacement, ownership, portraits, saves, 20 seasons');
