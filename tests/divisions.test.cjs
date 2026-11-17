'use strict';
// Men's and women's divisions at every promotion, each with its own championship belt.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map();
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:storage,Date,Math,JSON,console});
const D=root.OfficeData,G=root.OfficeGame,T=root.OfficeTerritory;

// Every wrestler belongs to exactly one division.
const women=D.ALL.filter(w=>D.divisionOf(w)==='women'),men=D.ALL.filter(w=>D.divisionOf(w)==='men');
assert.equal(women.length,36);assert.equal(men.length,44);
for(const id of D.WOMEN)assert.ok(D.findWrestler(id),'women list names a real wrestler: '+id);
for(const [id,div] of [['mara','women'],['rex','men'],['nova','women'],['kit','men'],['cass','women'],['ari','women'],['miro','men'],['morgan','men']])
 assert.equal(D.divisionOf(id),div,id);

// Eight belts, each with artwork in the repository.
const belts=D.PROMOS.flatMap(p=>D.DIVISION_ORDER.map(div=>D.belt(p.id,div)));
assert.equal(belts.length,8);assert.equal(new Set(belts.map(b=>b.name)).size,8);
for(const b of belts)assert.ok(fs.existsSync(path.join(__dirname,'..',b.img)),'belt art exists: '+b.img);

function divisionsHold(){
 const t=T.ensure();
 for(const p of D.PROMOS)for(const div of D.DIVISION_ORDER){
  const ranked=T.promotionRank(p.id,div);
  assert.ok(ranked.length>=2,`${p.name} ${div} has a ranking (${ranked.length})`);
  for(const w of ranked)assert.equal(D.divisionOf(w),div,`${w.name} ranked in the right division`);
  assert.equal(ranked[0].slot,'main','the top of each division is a main-eventer');
  for(const slot of D.SLOT_ORDER)for(const w of T.opponents(p.id,slot,div))assert.equal(D.divisionOf(w),div,'opponents come from the same division');
  const holder=t.titles[p.id][div].holder;
  assert.ok(holder,`${p.name} ${div} belt has a holder`);assert.equal(D.divisionOf(holder),div);
  assert.ok(ranked.some(w=>w.id===holder&&w.champion),'the holder is on that ranking');
 }
}

// New career: both divisions everywhere, all eight belts filled.
G.fresh();divisionsHold();

// Booking: a wrestler can only take an offer in their own division.
const lady=G.S.free.find(w=>D.divisionOf(w)==='women'),gent=G.S.free.find(w=>D.divisionOf(w)==='men');
G.S.cash=99999;assert.equal(G.sign(lady.id)??null,null);assert.equal(G.sign(gent.id)??null,null);
G.makeOffers();
assert.ok(G.S.offers.length>0);
for(const o of G.S.offers.filter(o=>!o.wid)){
 const wrong=D.divisionOf(o.rid)==='women'?gent:lady,right=wrong===gent?lady:gent;
 assert.match(G.book(o.id,wrong.id),/match\./,'cross-division booking is refused');
 assert.ok(G.meeting(o.id,wrong.id).error,'and so is negotiating it');
 if(G.availableAt(G.W(right.id),o.eventAbs)){assert.equal(G.book(o.id,right.id),null);break;}
}

// Title matches: a main-event contender gets a shot, and a win moves the belt.
const t=T.ensure(),pid='dock',div='women',card=t.cards[pid];
card[lady.id]={score:99,matches:3,wins:3};
const shot=T.titleMatch(pid,div);
assert.equal(shot?.kind,'shot');assert.equal(shot.wid,lady.id);assert.equal(shot.rid,t.titles[pid][div].holder);
const champ=shot.rid;
G.applyResult({id:'tm',pid,wid:lady.id,rid:champ,slot:'main',finish:'win_clean',minutes:20,purse:500,title:{pid,div}},{stars:3.5,crowd:70,crowdPeak:76,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:20,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[]});
assert.equal(t.titles[pid][div].holder,lady.id,'winning a title match takes the belt');
assert.ok(T.titlesOf(lady.id).some(b=>b.name==='Dockside Women’s Championship'));
assert.ok(G.S.inbox.some(m=>/Dockside Women’s title/.test(m.subject)),'the inbox reports the new champion');
assert.equal(T.titleMatch(pid,div)?.kind,'defence','a player champion is offered defences');
assert.equal(t.titleLog[0].to,lady.id);assert.equal(t.titleLog[0].from,champ);

// The weekly circuit keeps divisions apart, defends AI belts and never pairs across them.
for(let i=0;i<12;i++){G.endWeek?.();T.evolve();}
const lines=t.reports.flatMap(r=>r.lines);
for(const line of lines){
 const m=/^[^:]+: (.+?) (?:defeated|retained the .+? against) (.+?)(?: to win the .+)?\.$/.exec(line);if(!m)continue;
 const a=D.ALL.find(w=>w.name===m[1]),b=D.ALL.find(w=>w.name===m[2]);
 if(a&&b)assert.equal(D.divisionOf(a),D.divisionOf(b),'circuit match within one division: '+line);
}
assert.ok(lines.some(l=>/retained the|to win the/.test(l)),'AI champions defend their belts');
divisionsHold();

// Releasing a champion vacates the belt, and the next week fills it.
G.release(lady.id);G.endWeek();
assert.notEqual(t.titles[pid][div].holder,lady.id);
divisionsHold();

// Old saves without belts or divisions migrate once and keep their card history.
G.fresh();
const old=JSON.parse(JSON.stringify(G.S));
delete old.territory.titles;delete old.territory.titleLog;delete old.territory.divisionsReady;
const dockBefore=Object.keys(old.territory.cards.dock).length;
// Loading from storage at the title screen upgrades the save before any career is in memory.
{
 const saved=new Map([['the-office-v22',JSON.stringify(old)]]),boot={addEventListener(){}};
 vm.runInNewContext(script.slice(0,cut),{window:boot,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)},Date,Math,JSON,console});
 assert.ok(boot.OfficeGame.load(),'an old save still loads from the title screen');
 assert.equal(Object.keys(boot.OfficeGame.S.territory.titles).length,4);
}
G.S=old;divisionsHold();
assert.ok(Object.keys(G.S.territory.cards.dock).length>=dockBefore,'existing card entries are kept');
const crowned=JSON.stringify(G.S.territory.titles);T.ensure();
assert.equal(JSON.stringify(G.S.territory.titles),crowned,'migration runs once');

// A pre-v4 career (28 wrestlers, three stables) still gets two real rankings and eight belts.
G.fresh();
delete G.S.worldV4;
const legacyIds=new Set([...D.TALENT,...D.FOES].map(w=>w.id));
G.S.territory.teams=G.S.territory.teams.slice(0,3);
G.S.territory.teams.forEach(team=>{team.roster=team.roster.filter(id=>legacyIds.has(id))});
for(const card of Object.values(G.S.territory.cards))for(const id of Object.keys(card))if(!legacyIds.has(id))delete card[id];
delete G.S.territory.titles;delete G.S.territory.titleLog;delete G.S.territory.divisionsReady;
G.S=JSON.parse(JSON.stringify(G.S));divisionsHold();
for(let i=0;i<6;i++)G.endWeek();
divisionsHold();

console.log(`PASS divisions: ${men.length} men, ${women.length} women; 4 promotions × 2 rankings; 8 belts with art; same-division bookings and circuit matches; title shots, defences, changes and vacancies; old saves migrate`);
