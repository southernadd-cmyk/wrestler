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
 if(S.DIRECTOR.active(M)){
  const options=G.pool(M);
  assert.ok(options.some(([id,weight])=>id==='rope_run'&&weight>0),
   'witnessed cutoff must make legal real setup available in live pool');
  assert.ok(options.some(([id])=>id!=='rope_run'&&id!=='front_facelock'),
   'legal alternatives remain available; no scripted sequence');
 }
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
  assert.equal(report.status,'witnessed','full four-beat evidence is distinct');
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
 // Ordinary performed offence, not only a signed or countered action,
 // can invite the next legal stage of an earned clean finishing sequence.
 const natural=create(structure,'story');
 natural.t=Math.floor(natural.len*.82);natural.graph.arc='exchange';
 step(natural,'probe_strike','w');
 const options=G.closingOffers(natural,'w');
 assert.ok(options.some(([id])=>id==='rope_run'),
  'a real late standing attack may invite a safe rope setup');
 assert.ok(options.some(([id])=>id==='waistlock'),
  'a real late standing attack may invite a legal grappling setup');
 const realPool=G.pool(natural);
 assert.ok(realPool.some(([id,w])=>id==='rope_run'&&w>0),
  'only a physically legal closing move enters the live weighted pool');
 assert.ok(realPool.some(([id])=>!['rope_run','waistlock'].includes(id)),
  'winning continuation remains a choice rather than a script');
 const naturalControl=create(structure,'story','win_clean',false);
 naturalControl.t=Math.floor(naturalControl.len*.82);
 step(naturalControl,'probe_strike','w');
 assert.equal(G.closingOffers(naturalControl,'w').length,0,
  'metadata-only match has no new offers');
 const naturalDirty=create(structure,'story','win_dirty');
 naturalDirty.t=Math.floor(naturalDirty.len*.82);
 step(naturalDirty,'probe_strike','w');
 assert.equal(G.closingOffers(naturalDirty,'w').length,0,
  'dirty finish cannot silently receive clean-finish setup help');
 const naturalLoss=create(structure,'story','win_clean');
 naturalLoss.t=Math.floor(naturalLoss.len*.82);
 step(naturalLoss,'probe_strike','f');
 const opponentOffers=G.closingOffers(naturalLoss,'f');
 assert.ok(!opponentOffers.some(([id])=>id==='rope_run'||id==='waistlock'),
  'the eventual loser cannot inherit the booked winner’s finishing setups');
 assert.ok(opponentOffers.some(([id])=>id==='counter_strike'),
  'real loser pressure may still invite a genuine defensive counter');
  // The authored strike_trade -> clothesline follow-through is a
 // legitimate *direct* transition; no additional rope run is scripted.
 const straight=create(structure,'story');
 straight.t=Math.floor(straight.len*.85);straight.graph.arc='exchange';
 step(straight,'strike_trade','w');
 const immediate=G.closingOffers(straight,'w');
 assert.ok(immediate.some(([id])=>id==='clothesline'),
  'genuine striking exchanges can offer an authored grounded impact');
 const immediatePool=G.pool(straight);
 assert.ok(immediatePool.some(([id,weight])=>id==='clothesline'&&weight>0),
  'the real legal impact must compete in the weighted live pool');
 assert.ok(immediatePool.some(([id])=>id!=='clothesline'),
  'the next move is still optional, with alternatives');
 straight.t+=10;step(straight,'clothesline','w');
 const direct=G.closingRunway(straight);
 assert.equal(direct?.status,'linked','authored direct strikes can earn a truthful closing link');
 assert.equal(direct?.setup.id,'strike_trade');
 assert.equal(direct?.impact.id,'clothesline');
 assert.equal(direct?.cutoff,null,'an ordinary exchange cannot fabricate a counter');
  // A current legal standing setup must survive ONE optional graph step
 // even when an arc age threshold would otherwise erase its ownership.
 const protect=create(structure,'story');
 protect.t=Math.floor(protect.len*.85);
 protect.graph.started=true;protect.graph.arc='exchange';
 step(protect,'strike_trade','w');
 protect.t+=10;protect.graph.age=999;
 const previous=protect.r.getState();
 G.advance(protect,protect.t/protect.len);
 assert.equal(protect.graph.node,'strike_trade','arc transition must not erase an owned closing setup');
 assert.equal(protect.story.control,'w','no narrative control teleportation during handoff');
 assert.equal(protect.graph.closingProtected,1,'exactly one available follow-through protected');
 assert.equal(protect.r.getState(),previous,'preservation never consumes the match RNG');
 assert.ok(G.pool(protect).some(([id,weight])=>id==='clothesline'&&weight>0),
  'the physically valid linked move remains available after the saved arc');
  const partial=create(structure,'story');
 partial.t=Math.floor(partial.len*.89);partial.graph.arc='exchange';
 step(partial,'rope_run','w');partial.t+=10;step(partial,'clothesline','w');
 const support=G.closingRunway(partial);
 assert.equal(support?.status,'linked','genuine authored two-action finish construction');
 assert.equal(support?.pressure,null,'must not invent an earlier attack');
 assert.equal(support?.cutoff,null,'must not invent a reversal');
 assert.equal(support?.setup.id,'rope_run');
 assert.equal(support?.impact.id,'clothesline');
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
