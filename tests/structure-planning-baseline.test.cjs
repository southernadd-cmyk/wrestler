'use strict';
// Phase 0: read-only baseline of Dennis -> signed sheet -> real OfficeMatch -> report.
// Usage: node tests/structure-planning-baseline.test.cjs
//        node tests/structure-planning-baseline.test.cjs --json
// No match rules, saves, balancing or CI workflows are created by this test.
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0,'shipped pre-UI modules must be available');
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console});
const D=root.OfficeData,E=root.OfficeMatch,Room=root.OfficeRoom,Sheets=root.OfficeSheets;
assert.ok(D&&E&&Room&&Sheets,'actual planning and match modules are loaded');

const plans=['story','technical','brawl','spots','safe'];
const durations=[8,12,18],finishes=['win_clean','win_dirty','lose_protected','lose_clean'];
const seeds=[0,1],digest=createHash('sha256');
const totals={bouts:0,contractOutcomes:0,exceptionalOutcomes:0,completedBeats:0,
 adaptedBeats:0,missedBeats:0,finishFallbacks:0,scriptChecks:0,scriptHits:0,
 graphEvents:0,graphTransitions:0,nearfalls:0,botches:0};
const rows=[],anomalies=[];

function sign(plan,minutes,finish,fixture){
 const w=D.TALENT[fixture%D.TALENT.length],f=D.FOES[(fixture*3)%D.FOES.length];
 const p=D.PROMOS[fixture%D.PROMOS.length];
 const c={id:'phase0-'+plan+'-'+minutes+'-'+finish+'-'+fixture,
  wid:w.id,rid:f.id,pid:p.id,slot:'main',finish,minutes,eventAbs:30,feudHeat:20};
 const st=Room.begin(c,w,f,p);
 // Isolate the signed plan: incidental room situations are separately covered
 // by pre-match-integration.test.cjs and must not vary this reference.
 st.queue=[];
 Room.act(st,'plan_'+plan);
 assert.equal(st.stage,'board');
 const original=Room.view(st);
 assert.ok(original.finishes.some(x=>x.selected));
 assert.equal(original.board.length,4,'legacy signed planner has four named slots');
 assert.ok(original.finishPlan?.route);
 Room.act(st,'board_ok');
 assert.equal(st.stage,'review');
 Room.act(st,'review_ok');
 assert.equal(st.stage,'curtain');
 Room.act(st,'talk_none');
 assert.equal(st.stage,'done');
 const sheet=st.sheet;
 assert.equal(sheet.v,4);
 assert.equal(sheet.game,plan);
 assert.equal(sheet.finish,finish);
 assert.equal(sheet.minutes,minutes);
 assert.equal(sheet.finishRoute,st.board.finish.route);
 assert.ok(sheet.signed&&sheet.nodes.some(x=>x.id==='finish'));
 return {w,f,p,c,sheet};
}
function run(deal,seed){
 const m=E.create({w:{...deal.w,fatigue:5,flags:{}},f:deal.f,p:deal.p,
  slot:'main',minutes:deal.sheet.minutes,finish:deal.c.finish,feudHeat:20,
  plan:{game:deal.sheet.game,leash:deal.sheet.leash||'script',
   talk:deal.sheet.talk||'calm'},preparation:{},flags:{},seed,
  sheet:JSON.parse(JSON.stringify(deal.sheet))});
 for(let i=0;i<9000&&!m.done;i++){
  if(m.decision&&!m.queue.length){
   const options=m.decision.options;
   const choice=options.find(o=>['job','keep','protect','work'].includes(o.id))||
    options.find(o=>!['home','cut','stop'].includes(o.id))||options[0];
   assert.ok(choice,'live decision must have an option');
   E.resolve(m,choice.id);
  }
  E.next(m);
 }
 assert.ok(m.done&&m.final,'match must finish and retain a result');
 const r=Sheets.report(m);
 assert.ok(r,'a signed plan must have a report');
 assert.equal(r.total,r.achieved+r.adapted+r.missed,'all signed beats accounted for');
 assert.ok(m.graph?.events&&m.graph?.history&&m.final?.psychology?.graph,'actual graph evidence present');
 assert.ok(m.final.stars>=0&&m.final.stars<=5,'valid match rating');
 if(m.outcome==='booked')assert.equal(m.graph.outcome?.id,deal.c.finish,'unchanged booked result');
 return {m,r};
}
function row(plan){
 return {plan,bouts:0,stars:0,quality:0,scriptChecks:0,scriptHits:0,
  beats:{achieved:0,adapted:0,missed:0},finishFallbacks:0,
  graphEvents:0,graphTransitions:0,nearfalls:0,botches:0,
  positiveMomentumTicks:0,negativeMomentumTicks:0,neutralMomentumTicks:0,
  arcVisits:{},phaseTicks:{},finishRoutes:{}};
}
const byPlan=Object.fromEntries(plans.map(p=>[p,row(p)]));
let fixture=0;
for(const minutes of durations)for(const finish of finishes)for(const variation of seeds){
 const stable=fixture++;
 const seed=40611+stable*47;
 for(const plan of plans){
  const deal=sign(plan,minutes,finish,stable);
  const {m,r}=run(deal,seed);
  const p=byPlan[plan];
  p.bouts++;totals.bouts++;
  p.stars+=m.final.stars;
  p.quality+=(m.qN?m.qSum/m.qN:0);
  p.scriptChecks+=m.scriptChecks;p.scriptHits+=m.scriptHits;
  p.beats.achieved+=r.achieved;p.beats.adapted+=r.adapted;p.beats.missed+=r.missed;
  p.finishFallbacks+=m.finishRouteFallbackFrom?1:0;
  p.graphEvents+=m.graph.events.length;
  p.graphTransitions+=m.graph.transitions;
  p.nearfalls+=m.nearfalls;p.botches+=m.botches;
  p.finishRoutes[m.finishRoute||'(none)']=(p.finishRoutes[m.finishRoute||'(none)']||0)+1;
  for(const arc of m.graph.history)p.arcVisits[arc]=(p.arcVisits[arc]||0)+1;
  for(const tick of m.flow||[]){
   const phase=E.PHASES[tick[3]]?.id||'(unknown)';
   p.phaseTicks[phase]=(p.phaseTicks[phase]||0)+1;
   if(tick[2]>15)p.positiveMomentumTicks++;
   else if(tick[2]<-15)p.negativeMomentumTicks++;
   else p.neutralMomentumTicks++;
  }
  const contracted=m.outcome==='booked'&&m.graph.outcome?.id===finish;
  totals.contractOutcomes+=contracted?1:0;
  totals.exceptionalOutcomes+=contracted?0:1;
  if(!contracted)anomalies.push({plan,minutes,finish,seed,outcome:m.outcome,actual:m.graph.outcome?.id||null});
  totals.completedBeats+=r.achieved;totals.adaptedBeats+=r.adapted;totals.missedBeats+=r.missed;
  totals.finishFallbacks+=m.finishRouteFallbackFrom?1:0;
  totals.scriptChecks+=m.scriptChecks;totals.scriptHits+=m.scriptHits;
  totals.graphEvents+=m.graph.events.length;totals.graphTransitions+=m.graph.transitions;
  totals.nearfalls+=m.nearfalls;totals.botches+=m.botches;
  digest.update(JSON.stringify({plan,minutes,finish,seed,route:m.finishRoute,outcome:m.graph.outcome?.id,
   arcs:m.graph.history,events:m.graph.events.map(x=>x.id),
   beats:m.sheet.nodes.map(x=>[x.id,x.status,x.actual])})+'\n');
 }
}
for(const plan of plans){
 const p=byPlan[plan];
 rows.push({
  plan,bouts:p.bouts,meanStars:+(p.stars/p.bouts).toFixed(3),
  meanQuality:+(p.quality/p.bouts).toFixed(2),
  meanGraphEvents:+(p.graphEvents/p.bouts).toFixed(2),
  meanGraphTransitions:+(p.graphTransitions/p.bouts).toFixed(2),
  meanNearfalls:+(p.nearfalls/p.bouts).toFixed(2),
  meanScriptChecks:+(p.scriptChecks/p.bouts).toFixed(2),
  scriptAdherence:p.scriptChecks?+(100*p.scriptHits/p.scriptChecks).toFixed(2):null,
  beats:p.beats,finishFallbacks:p.finishFallbacks,
  momentumTicks:{positive:p.positiveMomentumTicks,negative:p.negativeMomentumTicks,
   neutral:p.neutralMomentumTicks},
  phaseTicks:p.phaseTicks,arcVisits:p.arcVisits,finishRoutes:p.finishRoutes
 });
}
const output={schema:'office-phase0-planning-structure-v1',
 description:'Read-only legacy planning-to-execution reference (no incidental backstage scenes)',
 sample:'5 plans x 3 durations x 4 finishes x 2 matched seeded fixtures',
 totals,rows,anomalies,fingerprint:digest.digest('hex')};
assert.equal(output.totals.bouts,120);
assert.equal(output.rows.length,5);
assert.equal(output.totals.completedBeats+output.totals.adaptedBeats+
 output.totals.missedBeats,output.rows.reduce((a,p)=>
 a+p.beats.achieved+p.beats.adapted+p.beats.missed,0));
if(process.argv.includes('--json'))console.log(JSON.stringify(output,null,2));
else{
 console.log('PASS Phase 0 planning baseline: '+output.totals.bouts+
  ' complete signed OfficeRoom -> OfficeSheets -> OfficeMatch bouts');
 console.log('Fingerprint: '+output.fingerprint);
 console.log('Contracts: '+totals.contractOutcomes+' booked; '+totals.exceptionalOutcomes+' exceptional');
 console.log('Beats: '+totals.completedBeats+' achieved, '+totals.adaptedBeats+
  ' adapted, '+totals.missedBeats+' missed; finish route fallbacks: '+totals.finishFallbacks);
 for(const r of rows)console.log(r.plan+': '+r.bouts+' bouts; mean stars '+r.meanStars+
  '; mean action events '+r.meanGraphEvents+'; mean phase transitions '+
  r.meanGraphTransitions+'; plan adherence '+r.scriptAdherence+'%; beats '+
  JSON.stringify(r.beats)+'; phase ticks '+JSON.stringify(r.phaseTicks));
}
