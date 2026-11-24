'use strict';
// Career economics and roster sustainability, not match quality calibration.
// Uses production career/world code, fixed clock and seeded match-result samples.
// No injected money in player scenarios; world-only reserve isolates the circuit.
const {engine,check}=require('../tests/_world.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function run(seed,{seasons=5,policy='lean'}={}){
 const {root,random}=engine(seed);
 const {OfficeGame:G,OfficeData:D,OfficeTerritory:T,OfficeBusiness:B}=root;
 G.fresh();
 const worldOnly=policy==='world';
 if(worldOnly)G.S.cash=100000;
 const initial=G.S.cash;
 const errors=[],findings=[],yearly=[],seenRetired=new Set(),limits={minCash:initial,maxCash:initial,minActive:80,minAvailableMen:80,minAvailableWomen:80,maxSaveBytes:0};
 let weeks=0,matches=0,reloads=0,emptyOfferWeeks=0,emptyCircuitWeeks=0,fixtureCount=0,signings=0,releases=0;
 const ledger={matchReceipts:0,weeklyWages:0,weeklyOverhead:0,trainingAndCoaching:0,otherNet:0,signingCosts:0};
 let lastSeason=G.S.season;
 const error=(wk,m)=>{if(errors.length<25)errors.push({week:wk,message:m});};
 const finding=(wk,m)=>{if(findings.length<30) findings.push({week:wk,message:m});};
 function snapshot(){
  const s=G.S,counts={player:0,ai:0,market:0,independent:0,retired:0};
  const div={men:0,women:0},market={men:0,women:0};
  for(const [id,c] of Object.entries(s.worldV4.contracts)){
   counts[c.owner]=(counts[c.owner]||0)+1;
   const d=D.divisionOf(id);
   if(c.owner!=='retired')div[d]++;
   if(c.owner==='market')market[d]++;
  }
  return {week:weeks,season:s.season,cash:s.cash,rep:s.rep,counts,div,market,
   agencies:Object.fromEntries(Object.entries(s.worldV4.agencies).map(([id,a])=>[id,{cash:a.cash,roster:s.territory.teams.find(t=>t.id===id)?.roster.length||0}])),
   promotions:Object.fromEntries(D.PROMOS.map(p=>{const f=B.state(s.territory)[p.id];return [p.id,{cash:f.money,crowd:f.crowd,desperate:f.desperate}]}))};
 }
 function inspect(){
  const s=G.S,wk=T.absWeek(s),w=s.worldV4;
  for(const m of check(root,s,'career'))error(wk,m);
  for(const id of seenRetired)if(w.contracts[id]?.owner!=='retired')error(wk,'retirement reversed: '+id);
  for(const [id,c] of Object.entries(w.contracts)){
   if(c.owner==='retired')seenRetired.add(id);
   if(c.owner==='retired')continue;
   const p=G.W(id)||G.personnel(s,id);
   for(const k of ['ring','mic','psych','safe','age'])if(!Number.isFinite(p?.[k])||p[k]<0||p[k]>100)error(wk,'invalid '+id+'.'+k);
  }
  for(const c of [...s.card,...s.futureBookings,...s.offers]){
   if(seenRetired.has(c.rid)||seenRetired.has(c.wid))error(wk,'retired participant in active fixture/offer '+c.id);
   for(const b of c.programme?.beats||[])if(seenRetired.has(b.rid))error(wk,'retired participant in programme offer '+c.id);
  }
  for(const p of D.PROMOS)for(const d of D.DIVISION_ORDER){
   const id=s.territory.titles?.[p.id]?.[d]?.holder;
   if(id&&seenRetired.has(id))error(wk,'retired champion '+p.id+'/'+d);
  }
  for(const p of D.PROMOS){
   const f=B.state(s.territory)[p.id],x=f.lastFinance;
   if(!Number.isFinite(f.money)||!Number.isFinite(f.crowd))error(wk,'invalid promotion finances '+p.id);
   if(x&&x.net!==x.gate+x.sponsors-x.production-x.talent-x.marquee+x.savings)error(wk,'unbalanced promotion statement '+p.id);
  }
  const n=snapshot(),active=Object.values(n.div).reduce((x,y)=>x+y,0);
  limits.minCash=Math.min(limits.minCash,s.cash);limits.maxCash=Math.max(limits.maxCash,s.cash);
  limits.minActive=Math.min(limits.minActive,active);
  limits.minAvailableMen=Math.min(limits.minAvailableMen,n.div.men);
  limits.minAvailableWomen=Math.min(limits.minAvailableWomen,n.div.women);
  limits.maxSaveBytes=Math.max(limits.maxSaveBytes,Buffer.byteLength(JSON.stringify(s),'utf8'));
 }
 function result(){
  const stars=2.25+Math.floor(random()*7)*.25;
  return {stars,crowd:55+Math.floor(random()*25),crowdPeak:80,outcome:'booked',botches:random()<.15?1:0,script:.8+random()*.2,
   adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:12,plan:'safe',stamina:60,injury:random()<.035?2:0,injuryPart:'shoulder',ignored:0,callsUsed:[],log:[]};
 }
 function manage(){
  const s=G.S,cap=policy==='lean'?2:3,reserve=policy==='lean'?900:650;
  // Prioritise a reliable worker with affordable wages and a cash reserve.
  if(s.roster.length<cap){
   const sorted=s.free.filter(w=>!w.injury).sort((a,b)=>(a.fee+4*a.wage)-(b.fee+4*b.wage)||a.id.localeCompare(b.id));
   const target=sorted.find(w=>s.cash-w.fee>=reserve+G.wages()+w.wage);
   if(target){const cash=s.cash;if(!G.sign(target.id)){signings++;ledger.signingCosts+=cash-s.cash;}}
  }
  for(let i=0;i<30;i++){
   const m=G.pending()[0];if(!m)break;
   const options=(m.options||[]).slice().sort((a,b)=>Number(/pay|bonus|raise|money/i.test(a.id))-Number(/pay|bonus|raise|money/i.test(b.id)));
   for(const o of options){G.answer(m.id,o.id);if(m.answer)break;}
   if(!m.answer){finding(T.absWeek(s),'decision not resolved: '+m.dtype);break;}
  }
  // A lean stable sheds excess payroll when the cash cushion is gone.
  if(s.cash<400&&s.roster.length>1){
   const expensive=s.roster.slice().sort((a,b)=>b.wage-a.wage)[0];G.release(expensive.id);releases++;
  }
  for(const w of s.roster){
   if(!w.injury&&!w.program){
    G.setTraining(w.id,w.fatigue>=55?'rest':'ring');
    G.setIntensity(w.id,policy==='balanced'&&s.cash>2000&&w.fatigue<40?'standard':'light');
   }
  }
  const eligibleOffers=s.offers.slice().sort((a,b)=>a.eventAbs-b.eventAbs||b.boost-a.boost);
  for(const o of eligibleOffers){
   if(o.eventAbs>T.absWeek(s)+1)continue;
   const w=s.roster.filter(x=>D.divisionOf(x)===D.divisionOf(o.rid)&&G.availableAt(x,o.eventAbs)&&(!o.wid||o.wid===x.id)&&(!o.talk||o.talk.wid===x.id)).sort((a,b)=>G.purse(o,b)-G.purse(o,a))[0];
   if(w&&!G.book(o.id,w.id))fixtureCount++;
  }
  for(const c of s.card.slice())if(G.W(c.wid)&&G.F(c.rid)){
   const before=s.cash;G.applyResult(c,result());matches++;ledger.matchReceipts+=s.cash-before;
  }
 }
 yearly.push(snapshot());
 for(let i=0;i<seasons*16&&!G.S.over;i++){
  if(!worldOnly)manage();
  const wages=G.wages(),overhead=G.overhead(),training=G.S.business.training;
  try{G.endWeek();}catch(e){error(T.absWeek(G.S),'endWeek: '+e.stack);break;}
  ledger.weeklyWages+=wages;ledger.weeklyOverhead+=overhead;
  ledger.trainingAndCoaching+=Math.max(0,G.S.business.training-training)+(G.S.trainingReviews?.at(-1)?.coachCost||0);
  weeks++;
  const s=G.S;
  if(!s.offers.length)emptyOfferWeeks++;
  if(!(s.territory.lastResults?.matches||[]).length)emptyCircuitWeeks++;
  inspect();
  if(i%4===3){
   G.save();const before=clone(G.S);
   if(!G.load()){error(T.absWeek(s),'save did not reload');break;}
   // Compare canonical serialisation; object key order is not semantically important.
   const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
   if(canonical(before)!==canonical(G.S))error(T.absWeek(G.S),'save/load changed career state');
   reloads++;
  }
  if(G.S.season!==lastSeason){yearly.push(snapshot());lastSeason=G.S.season;}
  if(errors.length>=25)break;
 }
 const final=snapshot();
 if(yearly.at(-1).week!==weeks)yearly.push(final);
 if(final.counts.retired>0&&!Object.values(final.counts).some(v=>v<0)){
  if(final.div.men<12||final.div.women<12)finding(weeks,'division depth below 12 active wrestlers');
  if(final.counts.market<4)finding(weeks,'free-agent market below four wrestlers');
 }
 ledger.otherNet=final.cash-initial-ledger.matchReceipts+ledger.signingCosts+ledger.weeklyWages+ledger.weeklyOverhead+ledger.trainingAndCoaching;
 return {seed,policy,requestedWeeks:seasons*16,weeks,initialCash:initial,finalCash:final.cash,ledger,
  outcome:G.S.over?.reason||'active',matches,fixtureCount,signings,releases,reloads,emptyOfferWeeks,emptyCircuitWeeks,limits,yearly,errors,findings};
}
function summary(r){return {seed:r.seed,policy:r.policy,weeks:r.weeks,requestedWeeks:r.requestedWeeks,outcome:r.outcome,initialCash:r.initialCash,finalCash:r.finalCash,
 ledger:r.ledger,matches:r.matches,signings:r.signings,releases:r.releases,reloads:r.reloads,emptyOfferWeeks:r.emptyOfferWeeks,emptyCircuitWeeks:r.emptyCircuitWeeks,
 limits:r.limits,final:r.yearly.at(-1),errors:r.errors,findings:r.findings};}
if(require.main===module){
 const seasons=Number(process.argv[2]||10),seeds=Number(process.argv[3]||4);
 if(!Number.isInteger(seasons)||seasons<1||seasons>30||!Number.isInteger(seeds)||seeds<1||seeds>100)throw Error('Use 1–30 seasons and 1–100 seeds.');
 const rows=[];
 for(let seed=1;seed<=seeds;seed++)for(const policy of ['lean','balanced','world']){
  const r=run(seed,{seasons,policy});rows.push(r);console.log(JSON.stringify(summary(r)));
 }
 if(process.env.OFFICE_AUDIT_JSON)require('node:fs').writeFileSync(process.env.OFFICE_AUDIT_JSON,JSON.stringify(rows,null,2));
 process.exitCode=rows.some(r=>r.errors.length)?1:0;
}
module.exports={run,summary};
