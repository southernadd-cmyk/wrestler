'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map();
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:storage,Date,Math,JSON,console});
const D=root.OfficeData,G=root.OfficeGame,T=root.OfficeTerritory,V=root.OfficeWorldV4;
const snapshot=v=>JSON.stringify(v);
function sizes(s){const counts={market:0,ai:0,independent:0,player:0};
 for(const c of Object.values(s.worldV4.contracts))counts[c.owner]++;return counts;}
function verifyOwnership(s){
 const world=s.worldV4,teamIds=s.territory.teams.flatMap(t=>t.roster);
 const ids=[...s.roster.map(x=>x.id),...s.free.map(x=>x.id),...teamIds,
   ...D.ALL.filter(x=>world.contracts[x.id]?.owner==='independent').map(x=>x.id)];
 assert.equal(ids.length,80);assert.equal(new Set(ids).size,80,'worker owned by exactly one employer/market');
 assert.equal(new Set(teamIds).size,teamIds.length);
 assert.equal(Object.keys(world.contracts).length,80);
 for(const t of s.territory.teams)for(const id of t.roster){
  assert.equal(world.contracts[id]?.owner,'ai');assert.equal(world.contracts[id]?.agencyId,t.id);
 }
 for(const a of s.free)assert.equal(world.contracts[a.id].owner,'market');
 for(const a of s.roster)assert.equal(world.contracts[a.id].owner,'player');
}
assert.equal(D.ALL.length,80);assert.equal(D.REGISTRY.size,80);assert.equal(D.V4.newCast.length,52);
for(const w of D.ALL)assert.equal(D.findWrestler(w.id).name,w.name);
assert.equal(Object.keys(D.PROFILES).length,28,'legacy profiles load before new-career activation');
G.fresh();
assert.equal(Object.keys(D.PROFILES).length,80,'all 80 workers have active profiles');assert.equal(G.S.free.length,20,'all 20 free agents visible by default');
assert.equal(G.S.worldV4.version,4,'v4 world enabled on every new career');
const leader=T.promotionRank('dock')[0].id,cardScore=G.S.territory.cards.dock.rocco.score;
V.activate(G.S);
for(const w of D.ALL)assert.equal(D.PROFILES[w.id].signature.length,4);
const newSignatureKeys=D.V4.newCast.map(w=>D.PROFILES[w.id].signature.join('|'));
assert.equal(new Set(newSignatureKeys).size,52,'every newcomer must have a distinct signature sequence');
for(const w of D.V4.newCast)assert.ok(D.PROFILES[w.id].preferred.length>=4,'personal preferred moves '+w.id);

assert.deepEqual(sizes(G.S),{market:20,ai:44,independent:16,player:0});
assert.equal(G.S.territory.teams.length,6);
assert.deepEqual(Array.from(G.S.territory.teams,t=>t.roster.length),[9,8,8,6,6,7]);
assert.equal(G.S.territory.cards.dock.rocco.score,cardScore);
assert.equal(T.promotionRank('dock')[0].id,leader,'existing ladder position preserved');
assert.equal(T.rank().length,60);
for(const w of D.V4.newCast)assert.ok(D.PROMOS.some(p=>G.S.territory.cards[p.id]?.[w.id]),'all new wrestlers appear in a card');
verifyOwnership(G.S);
const initial=snapshot(G.S);V.activate(G.S);assert.equal(snapshot(G.S),initial,'one-time migration');
assert.equal(G.F('faye').name,'Faye Calder');
assert.equal(G.sign('faye'),null);
assert.equal(V.ownership(G.S,'faye').owner,'player');assert.equal(G.S.free.length,19);
verifyOwnership(G.S);
G.release('faye');assert.equal(V.ownership(G.S,'faye').owner,'market');assert.equal(G.S.free.length,20);
verifyOwnership(G.S);
G.save();const saved=snapshot(G.S);G.load();
assert.equal(snapshot(G.S),saved,'v4 reload must preserve state');
G.S.week=5;const lines=[];V.evolve(G.S,G.S.territory,5,lines);
verifyOwnership(G.S);const evolved=snapshot(G.S);V.evolve(G.S,G.S.territory,5,lines);
assert.equal(snapshot(G.S),evolved,'AI decision must run once per week');
assert.ok(Object.values(G.S.worldV4.agencies).every(a=>Number.isFinite(a.cash)&&Number.isFinite(a.weeklyPayroll)));
assert.ok(G.S.territory.teams.every(t=>t.roster.length<=12));
G.save();G.load();verifyOwnership(G.S);
// A former opponent can become an AI signing, then a free agent,
// without an undefined signing price or corrupting the player's bank.
const oldOpponent='red';
assert.ok(Number.isFinite(D.findWrestler(oldOpponent).fee));
assert.ok(Number.isFinite(D.findWrestler(oldOpponent).wage));
const oldContract=V.ownership(G.S,oldOpponent);
if(oldContract.owner==='ai')assert.ok(V.releaseAI(G.S,oldOpponent,6));
else if(oldContract.owner==='independent')assert.equal(V.ownership(G.S,oldOpponent).owner,'independent');
if(V.ownership(G.S,oldOpponent).owner==='market'){
 assert.ok(G.S.free.some(w=>w.id===oldOpponent));
 const beforeCash=G.S.cash;
 if(beforeCash<D.findWrestler(oldOpponent).fee)G.S.cash=D.findWrestler(oldOpponent).fee+1000;
 assert.equal(G.sign(oldOpponent),null,'released legacy opponent can be signed');
 assert.ok(Number.isFinite(G.S.cash)&&G.S.cash>=0,'legacy wrestler signing must preserve finite balance');
 assert.ok(G.S.roster.some(w=>w.id===oldOpponent));
 verifyOwnership(G.S);
}
// A played legacy career must retain its player roster, progression and ranking history.
G.fresh();assert.equal(G.sign('mara'),null);
G.S.roster[0].ring=81;G.S.territory.cards.dock.rocco.score=97;
const priorHistory=snapshot(G.S.history);
// Simulate a prior v22 career without a six-agency contract ledger.
delete G.S.worldV4;
G.S.territory.teams=G.S.territory.teams.slice(0,3);
G.S.territory.teams.forEach(t=>{t.roster=t.roster.filter(id=>D.TALENT.some(w=>w.id===id)||D.FOES.some(w=>w.id===id))});
G.S.territory.stablesReady=true;
G.S.free=G.S.free.filter(w=>D.TALENT.some(x=>x.id===w.id));
V.activate(G.S);
assert.equal(G.S.roster[0].ring,81);
assert.equal(G.S.territory.cards.dock.rocco.score,97);
assert.equal(snapshot(G.S.history),priorHistory);
assert.equal(G.S.free.length,19,'11 legacy market workers plus 8 new');
verifyOwnership(G.S);
V.activate(G.S);G.save();const migrated=snapshot(G.S);G.load();
assert.equal(snapshot(G.S),migrated);
console.log('PASS v4 living world: 80 identities, 6 agencies, budgets, transfers, idempotent save migration and preserved legacy careers');
