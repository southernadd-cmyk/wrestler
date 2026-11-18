'use strict';
// Phase 3: test actual week-by-week business accounting, not arbitrary negative
// buzz drift; repeatable but distinct autonomous careers; playable rookie growth.
const assert=require('node:assert/strict');
const {engine,play}=require('./_world.cjs');
const {root}=engine(3261);
const {OfficeGame:G,OfficeBusiness:Biz,OfficeBooking:Book,OfficeData:D,OfficeTerritory:T}=root;
const copy=x=>JSON.parse(JSON.stringify(x));

// Financial relationships, independent of the promoter's existing cash reserve.
{
 const small=D.PROMOS.find(p=>p.id==='dock'),big=D.PROMOS.find(p=>p.id==='union');
 for(const p of [small,big]){
  const baseline={crowd:Math.round(Biz.base(p)),buzz:34,desperate:false};
  const standard=Biz.finance(p,baseline,3,0,0);
  const cold=Biz.finance(p,{...baseline,crowd:baseline.crowd-12,buzz:10},4,0,0);
  const hot=Biz.finance(p,{...baseline,crowd:baseline.crowd+10,buzz:70},2,1,0);
  assert.ok(standard.gate>0&&standard.sponsors>0&&standard.production>0&&standard.talent>0);
  assert.ok(hot.net>standard.net&&standard.net>cold.net,'better business earns more at '+p.id);
  assert.ok(cold.net<0,'bad shows can still lose real money at '+p.id);
  assert.ok(hot.net>0,'a genuinely hot show can be profitable at '+p.id);
  const bailed=Biz.finance(p,{...baseline,desperate:true},3,0,0);
  assert.ok(bailed.savings>0&&bailed.net>standard.net,'a troubled promoter cuts operating costs');
 }
 assert.ok(Biz.finance(big,{crowd:68,buzz:34,desperate:false},3).production>
    Biz.finance(small,{crowd:41,buzz:34,desperate:false},3).production,
    'national television must cost more to produce than a warehouse event');
}
console.log('PASS ticket and sponsorship income, production and talent costs are causal');

// 48 neutral weeks in the shared circuit. Every promotion produces its own
// shows; no artificial title payoffs are injected to keep the finances afloat.
{
 G.fresh();const s=G.S,t=s.territory,b=Biz.state(t);
 const initial=Object.fromEntries(D.PROMOS.map(p=>[p.id,b[p.id].money]));
 const reports=[];
 for(let wk=1;wk<=48;wk++){
  t.lastResults={week:wk,matches:D.PROMOS.flatMap(p=>Array.from({length:3},()=>({pid:p.id,stars:2.75})))};
  b.lastRaid=wk; // Finance isolation: no raids/migration in this controlled experiment.
  Biz.week(s,t,wk,reports);
  for(const p of D.PROMOS){
   const f=b[p.id],fin=f.lastFinance;
   assert.equal(fin.week,wk);
   assert.equal(fin.net,fin.gate+fin.sponsors-fin.production-fin.talent-fin.marquee+fin.savings);
   assert.equal(f.history.at(-1).m,f.money,'the reported end balance is authoritative');
   assert.ok(Number.isFinite(f.money)&&Number.isFinite(fin.net));
  }
 }
 for(const p of D.PROMOS){
  const f=b[p.id];
  assert.ok(f.money>=initial[p.id]-2000,'a typical promotion is not structurally bankrupt: '+p.id+' '+f.money);
  assert.equal(f.history.length,16,'small rolling record');
  assert.equal(Biz.view(p.id).finance.week,48,'the last show accounts are inspectable');
 }
 assert.ok(b.union.money>b.dock.money+10000,'national broadcasting retains a materially larger operation');
 assert.ok(!b.union.desperate,'Grand Union must not inevitably collapse under neutral conditions');
 assert.ok(!b.pulse.desperate,'Pulse must not inevitably collapse under neutral conditions');
 assert.ok(JSON.stringify(b).length<6500,'even with last-show accounts the save stays bounded');
 const before=JSON.stringify(b);Biz.week(s,t,48,reports);assert.equal(JSON.stringify(b),before,'a show is never settled twice');
 console.log('PASS 48 neutral weeks, real profit/loss: '+D.PROMOS.map(p=>p.id+' £'+b[p.id].money).join('; '));
}

// New careers keep their own world seed across saves; different seeds actually
// lead to different title chases, match results and opportunities.
{
 G.fresh();const s=G.S,t=s.territory;
 assert.ok(Number.isFinite(s.careerSeed));
 const locked=s.careerSeed;G.save();G.load();assert.equal(G.S.careerSeed,locked);
 const before=JSON.stringify(t);
 const one=()=>{
  const r=Book.decide(s,t,7);
  return JSON.stringify({story:r.state.promos,bill:r.bill.map(m=>[m.pid,m.a.id,m.b.id,m.winner])});
 };
 const versions=new Set();
 for(const key of [1,23,51,97,131,196]){
  s.careerSeed=key;
  const a=one(),b=one();assert.equal(a,b,'same career seed gives the same circuit');
  versions.add(a);
 }
 assert.ok(versions.size>=2,'autonomous bookers must not play identically in every new career');
 assert.equal(JSON.stringify(t),before,'predictions do not mutate the world');
 s.careerSeed=locked;
}
console.log('PASS different careers play different seeded worlds, and a save keeps its seed');

// A low-ring rookie develops meaningfully in a season without buying intensive
// training; a developed star does not get the same catch-up multiplier.
{
 G.fresh();const s=G.S;s.cash=100000;
 assert.equal(G.sign('sol'),null);
 assert.equal(G.sign('mara'),null);
 const young=G.W('sol'),senior=G.W('mara');
 assert.ok(young.tier==='Rookie'&&young.ring<68,'rookie test setup');
 for(const w of [young,senior]){w.training='ring';w.intensity='light';w.fatigue=0;}
 const y0=young.ring,v0=senior.ring;
 for(let i=0;i<16;i++){s.card=[];G.endWeek();}
 const growYoung=young.ring-y0,growSenior=senior.ring-v0;
 assert.ok(growYoung>=5,'steady novice work improves over one season: '+growYoung);
 assert.ok(growYoung>growSenior,'rookie catch-up does not inflate veteran training: '+growYoung+' vs '+growSenior);
 assert.ok(young.ring<=99&&senior.ring<=99);
 console.log('PASS rookie season: ring '+y0+' → '+young.ring+' (veteran +'+growSenior+')');
}

// Two multi-season full-system careers, with identical seed replay invariants;
// supplement the dedicated world-soak suite rather than duplicating its 4 careers.
{
 const results=[play(13,48),play(27,48)];
 for(const [i,r] of results.entries()){
  assert.deepEqual(r.problems,[],'world seed '+[13,27][i]+': '+r.problems.join('\n'));
  assert.ok(r.stats.weeks>=40,'multiple seasons completed');
  assert.ok(r.stats.programmes>0&&r.stats.matches>0&&r.stats.predicted>=r.stats.weeks*.75);
 }
}
console.log('PASS two additional 48-week complete-world careers with consistent finances and bookings');
