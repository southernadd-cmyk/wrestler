'use strict';
// Phase 9C: only physically witnessed pressure -> reversal -> linked setup -> impact.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Math,Date,JSON,console});
const {OfficeData:D,OfficeRoom:Room,OfficeSheets:S,OfficeMatch:E}=root,G=E.GRAPH;
const copy=x=>JSON.parse(JSON.stringify(x));
const w=D.TALENT.find(x=>x.style==='Story'),f=D.FOES.find(x=>x.style==='Technical'),p=D.PROMOS[0];
assert.ok(w&&f,'requires actual story worker and technical foe');
function create(structure,game,finish='win_clean',active=true){
 const c={id:'9c-'+structure+'-'+game+'-'+finish,wid:w.id,rid:f.id,pid:p.id,slot:'main',
  finish,minutes:12,eventAbs:60,feudHeat:22};
 const st=Room.begin(c,w,f,p,{structure:{id:structure,lead:'w'},structurePlanning:true});
 st.queue=[];Room.act(st,'plan_'+game);Room.act(st,'board_ok');
 assert.equal(st.stage,'review');Room.act(st,'review_ok');Room.act(st,'talk_none');
 assert.equal(st.stage,'done');
 return E.create({w:{...w,flags:{},fatigue:0},f,p,slot:'main',minutes:12,
  finish,seed:91981,feudHeat:22,plan:{game,leash:'script',talk:'none'},
  preparation:{},flags:{},sheet:copy(st.sheet),structureExecution:active});
}
function step(M,id,side){
 M.stage='live';M.story.position='standing';M.story.down=null;M.story.control=side;
 G.resetPhysical(M);assert.ok(G.isValid(M,id),'the actual setup must be legal: '+id);
 G.apply(M,id);
}
function sequence(M,withSetup=true){
 const winner=M.o.finish==='win_clean'?'w':'f',loser=winner==='w'?'f':'w';
 M.t=Math.floor(M.len*.86);M.graph.arc='exchange';M.wSt=M.fSt=98;
 step(M,'strike_trade',loser);
 M.t+=10;
 // The real defender, not the initially attacking worker, performs a reversal.
 assert.ok(G.isValid(M,'counter_strike'),'the counter must be legal in the opponent attack');
 G.apply(M,'counter_strike');
 assert.equal(M.graph.events.at(-1).control,winner);
 const cue=G.closingOffers(M,winner);
 if(S.DIRECTOR.active(M))
  assert.ok(cue.some(([id])=>id==='rope_run'),'real counter should offer a genuine physical setup');
 else assert.equal(cue.length,0,'inactive metadata-only match must not acquire finishing guidance');
 if(withSetup){
  M.t+=10;step(M,'rope_run',winner);
  const finishOptions=G.closingOffers(M,winner);
  if(S.DIRECTOR.active(M))
   assert.ok(finishOptions.some(([id])=>id==='clothesline'),
    'a witnessed, authored setup should offer a legal impact');
  else assert.equal(finishOptions.length,0,'metadata-only control has no finishing offers');
 }
 M.t+=10;step(M,'clothesline',winner);
 return {winner,loser};
}
for(const structure of S.STRUCTURES.catalogue().map(x=>x.id)){
 for(const plan of ['story','technical','brawl','spots','safe']){
  const m=create(structure,plan);
  assert.equal(G.closingRunway(m),null);
  sequence(m);
  const originalRng=m.r.getState(),report=G.closingRunway(m);
  assert.ok(report,'actual last-minute reversal, setup and impact earn closing report');
  assert.equal(report.winner,'w');assert.equal(report.bookedFinish,'win_clean');
  assert.equal(report.pressure.id,'strike_trade');
  assert.equal(report.cutoff.id,'counter_strike');
  assert.equal(report.setup.id,'rope_run');
  assert.equal(report.impact.id,'clothesline');
  assert.equal(m.r.getState(),originalRng,'observer may not consume gameplay RNG');
  const restored=E.restore(copy({...m,rState:m.r.getState()}));
  assert.equal(JSON.stringify(G.closingRunway(restored)),JSON.stringify(report),
   'restored physical tape must yield identical evidence');
  m.stage='finish';m.queue=[];E.next(m);
  assert.equal(m.final.finishingRunway?.impact.id,'clothesline');
  assert.equal(m.graph.outcome.id,'win_clean');
  assert.equal(m.final.finishingRunway.bookedFinish,m.o.finish);
  assert.equal(m.final.stars,E._stars(m,true),'no special star formula');
  const without=create(structure,plan);
  sequence(without,false);
  assert.equal(G.closingRunway(without),null,'no fabricated link from an absent setup');
  const control=create(structure,plan,'win_clean',false);
  sequence(control);
  assert.equal(G.closingRunway(control),null,'metadata-only control unchanged');
 }
 const reverse=create(structure,'story','lose_clean');
 sequence(reverse);
 assert.equal(G.closingRunway(reverse)?.winner,'f','the loser is not secretly favoured');
 const cancelled=create(structure,'story');const {loser}=sequence(cancelled);
 cancelled.t+=10;step(cancelled,'strike_trade',loser);
 assert.equal(G.closingRunway(cancelled),null,
  'a real opposing final exchange invalidates an earlier supposed closing bridge');
 const stale=create(structure,'story');sequence(stale);
 stale.t+=100;assert.equal(G.closingRunway(stale),null,'stale late impact is not a direct finish setup');
 const dirty=create(structure,'story','win_dirty');
 assert.equal(G.closingOffers(dirty,'w').length,0,'non-clean routes do not receive causal guidance');
 assert.equal(G.closingRunway(dirty),null);
}
console.log('PASS Phase 9C: 4 structures x 5 plans, real reversal/linked impact, clean winner on both sides, controls, interruption, stale evidence, saves and immutable result.');
