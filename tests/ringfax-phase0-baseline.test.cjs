'use strict';
// RINGFAX Phase 0: read-only facts and reproducibility baseline.
// No Ringfax production module is loaded, and no existing simulation behaviour is patched.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {engine}=require('./_world.cjs');

function observe(s){
  const t=s.territory||{}, b=t.business||{}, m=s.officeMemory||{};
  const result=(s.history||[]).map(h=>({
    cid:h.cid||null,season:h.season,week:h.week,pid:h.pid,
    wid:h.wid,rid:h.rid,bookedFinish:h.bookedFinish||null,
    actualOutcome:h.outcome||null,contractHonoured:h.contractHonoured??null,
    stars:h.stars??null,crowd:h.crowd??null
  }));
  const circuit=(t.lastResults?.matches||[]).map(x=>({
    pid:x.pid,a:x.a,b:x.b,winner:x.winner??null,
    stars:x.stars??null,week:t.lastResults.week
  }));
  const titles=(t.titleLog||[]).map(x=>({
    week:x.week,pid:x.pid,div:x.div,from:x.from??null,
    to:x.to??null,how:x.how??null
  }));
  const finances=Object.keys(b).sort().filter(pid=>b[pid]&&typeof b[pid]==='object'&&'crowd' in b[pid])
    .map(pid=>({pid,week:b[pid].lastWeek??null,crowd:b[pid].crowd,
      buzz:b[pid].buzz,money:b[pid].money}));
  const memories=Object.keys(m.entries||{}).sort().flatMap(id=>(m.entries[id]||[]).map(e=>({
    id:e.id,wid:id,week:e.week,kind:e.kind,against:e.against||null
  })));
  return {period:{season:s.season,week:s.week},result,
    recentResultIds:(s.resultIds||[]).slice(),
    seasonResults:(s.seasonResults||[]).map(h=>({
      cid:h.cid||null,season:h.season,week:h.week,wid:h.wid,stars:h.stars??null
    })),
    circuit,titles,finances,memories};
}

function fixture(seed){
  const {root}=engine(seed);
  const {OfficeGame:G,OfficeNightReport:R,OfficeOutcome:O}=root;
  assert.ok(R&&O,'actual report and outcome modules are available');
  G.fresh();
  const s=G.S;
  s.cash=99999; // Fixture funding only; does not represent a normal starting career.
  assert.equal(G.sign('rex'),null,'Rex can be signed in the actual career model');
  const before=R.capture(s);
  const c={id:'ringfax-phase0-'+seed,pid:'dock',wid:'rex',rid:'silas',
    slot:'mid',finish:'lose_clean',purse:250,eventAbs:G.abs()};
  const fin={stars:3.25,crowd:61,crowdPeak:72,outcome:'booked',botches:0,
    script:.85,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},
    minutes:12,plan:'safe',stamina:60,injury:0,ignored:0,callsUsed:[],log:[]};
  const authoritative=O.interpret(c,fin);
  assert.equal(authoritative.bookedFinish,'lose_clean');
  assert.equal(authoritative.actualOutcome,'booked');
  s.card.push(c);
  G.applyResult(c,fin);
  const h=s.history.find(x=>x.cid===c.id);
  assert.ok(h,'settled result has a stable contract ID');
  assert.equal(h.bookedFinish,authoritative.bookedFinish);
  assert.equal(h.outcome,authoritative.actualOutcome);
  assert.equal(h.stars,fin.stars);
  assert.ok(s.resultIds.includes(c.id),'idempotency index records the match');
  assert.ok(s.seasonResults.some(x=>x.cid===c.id),'season summary retains a match ID');

  const once=JSON.stringify(s);
  assert.equal(Array.from(G.applyResult(c,fin)).length,0,'a settled match cannot be reapplied');
  assert.equal(JSON.stringify(s),once,'reapplying cannot duplicate results or consequences');

  // Exercise the real weekly circuit, which produces lastResults and business state.
  G.endWeek();
  assert.ok(Array.isArray(s.territory?.lastResults?.matches),
    'weekly circuit results are available as data');
  assert.ok(Array.isArray(s.territory?.titleLog),'title changes have an event log');
  const report=R.build(before,s,[{
    ...h,actualOutcome:h.outcome,bookedFinish:h.bookedFinish,
    consequences:[]
  }]);
  assert.ok(report.sections.some(x=>x.title==='In the ring'),
    'the existing consequences report remains available');

  const raw=JSON.stringify(s);
  const snapshot=observe(s);
  assert.equal(JSON.stringify(s),raw,'observing sources never writes career state');
  assert.equal(JSON.stringify(observe(s)),JSON.stringify(snapshot),
    'the read-only projection is stable on repeated reads');
  assert.ok(snapshot.result.some(x=>x.cid===c.id));
  assert.ok(snapshot.finances.length>0,'promotions expose real business figures');
  return snapshot;
}

const first=fixture(1337),second=fixture(1337);
assert.equal(JSON.stringify(first),JSON.stringify(second),
  'an identical seed, booking and result produce identical reportable facts');
const digest=crypto.createHash('sha256').update(JSON.stringify(first)).digest('hex');
if(process.argv.includes('--json'))console.log(JSON.stringify({
  fixtureSeed:1337,sha256:digest,
  resultCount:first.result.length,circuitMatchCount:first.circuit.length,
  titleLogCount:first.titles.length,promotionCount:first.finances.length,
  memoryCount:first.memories.length,
  coverage:{resultIds:true,bookedVsActual:true,seasonResults:true,
    circuit:true,titleLog:true,promotionBusiness:true,memory:true}
},null,2));
else console.log('PASS Ringfax Phase 0: authoritative sources, read-only observation, deduplication and seeded replay ('+digest.slice(0,12)+')');
