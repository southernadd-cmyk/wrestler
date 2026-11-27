'use strict';
// Opening economics: real starting bank, real free-agent fees and actual booking
// acceptance. Match income scenarios use a stated neutral result, not a claim
// about match-engine quality or guaranteed future earnings.
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');
const seeds=[13,27,41,91];
const rows=[];
const neutralResult=c=>({stars:3,crowd:60,crowdPeak:75,outcome:'booked',botches:0,script:.9,
 adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:c.minutes,plan:'safe',stamina:60,
 injury:0,ignored:0,callsUsed:[],log:[]});
function bookBest(root,id){
 const {OfficeGame:G,OfficeData:D}=root,w=G.W(id);
 if(!w)return null;
 const offers=G.S.offers.filter(o=>o.eventAbs===G.abs()&&o.expiresAbs>=G.abs()&&o.rid!==id&&
  D.divisionOf(w)===D.divisionOf(o.rid)&&(!o.wid||o.wid===id)&&(!o.talk||o.talk.wid===id))
  .sort((a,b)=>G.purse(b,w)-G.purse(a,w));
 for(const o of offers)if(G.book(o.id,id)===null)return G.S.card.find(c=>c.wid===id&&c.eventAbs===G.abs());
 return null;
}
for(const seed of seeds){
 const {root}=engine(seed),G=root.OfficeGame;
 G.fresh();const ids=Array.from(G.S.free,w=>w.id);
 const opening=[];
 for(const id of ids){
  G.fresh();const before=JSON.stringify(G.S),f=G.signingForecast(id);
  assert.equal(JSON.stringify(G.S),before,'budget forecast must not mutate the save or RNG');
  if(!f.affordable)continue;
  assert.equal(G.sign(id),null);
  assert.equal(G.S.cash,f.afterFee);
  assert.equal(G.wages()+G.overhead()+G.trainingBill(),f.weeklyCost);
  assert.equal(f.afterWeek,f.afterFee-f.weeklyCost);
  assert.equal(f.runway,Math.max(0,Math.floor(f.afterFee/f.weeklyCost)));
  const c=bookBest(root,id);
  opening.push({id,fee:f.fee,bank:f.afterFee,cost:f.weeklyCost,runway:f.runway,
   purse:c?.purse??null,projectedBank:c?f.afterWeek+c.purse:f.afterWeek});
 }
 assert.ok(opening.length>0,'opening market has affordable wrestlers');
 assert.ok(opening.some(r=>r.runway>=4&&r.purse!==null),'there is a bookable, lower-risk opening');
 const val=opening.find(r=>r.id==='val');
 assert.ok(val,'Val Vance remains available in the opening market');
 assert.equal(val.bank,540);assert.equal(val.cost,380);assert.equal(val.runway,1);
 G.fresh();const v=G.signingForecast('val');assert.equal(G.sign('val'),null);
 G.endWeek();assert.equal(G.S.cash,v.afterWeek,'no-income estimate agrees with real week-one settlement');
 // Test a lean, one-worker opening through the first backer review. No injected
 // money; book current offers only, use free light training, choose unpaid replies.
 const low=opening.filter(r=>r.runway>=4&&r.purse!==null).sort((a,b)=>b.runway-a.runway)[0];
 const paths=[];
 for(const id of [low.id,'val']){
  G.fresh();assert.equal(G.sign(id),null);
  const weeks=[];
  for(let k=0;k<4&&!G.S.over;k++){
   for(let i=0;i<20;i++){
    const m=G.pending()[0];if(!m)break;
    const opts=Array.from(m.options||[]).sort((a,b)=>Number(/pay|bonus|raise|money/i.test(a.id))-Number(/pay|bonus|raise|money/i.test(b.id)));
    for(const o of opts){G.answer(m.id,o.id);if(m.answer)break;}
    if(!m.answer)break;
   }
   const c=bookBest(root,id);
   if(c)G.applyResult(c,neutralResult(c));
   G.endWeek();weeks.push({cash:G.S.cash,purse:c?.purse??0,over:G.S.over?.reason??null});
  }
  paths.push({id,weeks});
 }
 assert.equal(paths[0].weeks.length,4,'a prudent opening can reach the first backer review');
 assert.ok(!paths[0].weeks.some(w=>w.over),'prudent opening is not bankrupt');
 rows.push({seed,opening,paths});
}
// Check costs of a second contract include current paid training and the extra
// headcount overhead, without treating any signed or unsigned purse as cash.
{
 const {root}=engine(123),G=root.OfficeGame;G.fresh();
 const w=G.S.free.find(x=>x.id==='kit');assert.ok(w);
 assert.equal(G.sign(w.id),null);assert.equal(G.setIntensity(w.id,'standard'),null);
 const next=G.S.free.find(x=>x.id==='val');const f=G.signingForecast(next.id);
 assert.equal(f.weeklyTraining,G.trainingBill());
 assert.equal(f.weeklyWages,G.wages()+next.wage);
 assert.equal(f.weeklyOverhead,G.overhead()+25);
 assert.equal(f.weeklyCost,f.weeklyWages+f.weeklyOverhead+f.weeklyTraining);
 assert.equal(G.signingForecast('not-on-market'),null);
}
for(const r of rows)console.log('OPENING FINANCES '+JSON.stringify(r));
console.log('PASS opening financial forecast and prudent four-week paths, four seeds');

// INT10 diagnostic: no injected cash, no free transfers, no artificially successful
// matches. Compare viable lean and expansion policies against a risky star signing.
// The fixed three-star result isolates the financial/booking system from match skill.
for(const seed of [13,41,91]){
 for(const policy of ['lean','expand','star']){
  const {root}=engine(seed),G=root.OfficeGame;G.fresh();
  const affordable=G.S.free.map(w=>({w,f:G.signingForecast(w.id)})).filter(x=>x.f.affordable&&x.f.runway>=4).sort((a,b)=>a.f.weeklyCost-b.f.weeklyCost||a.w.id.localeCompare(b.w.id));
  const starter=policy==='star'?'val':affordable[0]?.w.id;
  assert.ok(starter);assert.equal(G.sign(starter),null);
  const row={seed,policy,starter,startBank:G.S.cash,weeks:0,booked:0,available:0,missed:0,noIncome:0,fees:0,purses:0,operatingCost:0,minCash:G.S.cash,peakCash:G.S.cash,at8:null,at16:null,at24:null,over:null,staffPeak:1,unavailableWeeks:0,decisions:0,offerWeeks:0};
  for(let k=0;k<24&&!G.S.over;k++){
   const s=G.S;
   for(let i=0;i<20;i++){
    const m=G.pending()[0];if(!m)break;
    const opts=Array.from(m.options||[]).sort((a,b)=>Number(/pay|bonus|raise|money|accept/i.test(a.id))-Number(/pay|bonus|raise|money|accept/i.test(b.id)));
    for(const o of opts){G.answer(m.id,o.id);if(m.answer)break;}
    if(!m.answer)break;row.decisions++;
   }
   if((policy==='expand'&&s.roster.length<2&&k>=4)||!s.roster.length){
    const next=s.free.map(w=>({w,f:G.signingForecast(w.id)})).filter(x=>x.f.affordable&&x.f.runway>=4&&!x.w.injury).sort((a,b)=>a.f.weeklyCost-b.f.weeklyCost||a.w.id.localeCompare(b.w.id))[0];
    if(next&&G.sign(next.w.id)===null)row.fees+=next.f.fee;
   }
   row.staffPeak=Math.max(row.staffPeak,s.roster.length);
   let earned=0;
   if(s.offers.some(o=>o.eventAbs===G.abs()))row.offerWeeks++;
   for(const w of [...s.roster]){
    // A signed date makes available() false by design. Work it before shopping
    // for another offer. Distinguish genuine incapacity from a scheduled match.
    const due=s.card.find(c=>c.wid===w.id&&c.eventAbs===G.abs());
    if(w.injury||w.program?.type==='camp'){row.unavailableWeeks++;continue;}
    if(!due&&!G.available(w)){row.blockedByCard=(row.blockedByCard||0)+1;continue;}
    row.available++;
    if(w.fatigue>=35&&!w.program&&w.training!=='rest')G.setTraining(w.id,'rest');
    const c=due||bookBest(root,w.id);
    if(!c){row.missed++;continue;}
    const before=s.cash;
    G.applyResult(c,neutralResult(c));
    assert.ok(G.resultRecorded(c),'scheduled bout must actually settle');
    assert.ok(!s.card.some(x=>x.id===c.id),'settled contract leaves the card');
    earned+=s.cash-before;row.booked++;
    if(due)row.preSigned=(row.preSigned||0)+1;
   }
   const stale=s.card.filter(c=>c.eventAbs<G.abs());
   if(stale.length)row.staleCardWeeks=(row.staleCardWeeks||0)+1;
   if(s.card.some(c=>c.eventAbs===G.abs()))row.unplayedCardWeeks=(row.unplayedCardWeeks||0)+1;
   row.purses+=earned;if(!earned)row.noIncome++;
   row.operatingCost+=G.wages()+G.overhead()+G.trainingBill();
   G.endWeek();row.weeks++;row.minCash=Math.min(row.minCash,s.cash);row.peakCash=Math.max(row.peakCash,s.cash);
   if([8,16,24].includes(row.weeks))row['at'+row.weeks]=s.cash;
  }
  row.endCash=G.S.cash;row.rep=G.S.rep;row.over=G.S.over?.reason||null;row.staff=G.S.roster.length;
  row.agencies=Object.values(G.S.worldV4.agencies).map(a=>({cash:a.cash,payroll:a.weeklyPayroll,income:a.weeklyIncome}));
  row.promotions=Object.entries(G.S.territory.business||{}).filter(([id,p])=>Number.isFinite(p?.money)).map(([id,p])=>({id,cash:p.money,net:p.lastFinance?.net}));
  assert.ok(Number.isFinite(row.endCash));console.log('INT10 ECONOMY '+JSON.stringify(row));
 }
}
