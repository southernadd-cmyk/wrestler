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
  // Phase 9D: at 95.9% the old clock stopped offering any closing moves.
  // Preserve an actual legal late strike, one real selectable continuation
  // and the physical context across the Director's forced arc reset.
  const lastMinute=create(structure,'story');
  lastMinute.t=Math.floor(lastMinute.len*.959);
  lastMinute.graph.started=true;lastMinute.graph.arc='exchange';
  step(lastMinute,'strike_trade','w');
  assert.ok(G.closingOffers(lastMinute,'w').some(([id])=>id==='clothesline'),
   'a legitimate winner-owned last-minute setup still has an authored impact');
  lastMinute.t+=10;lastMinute.graph.age=999;
  const lateState=lastMinute.r.getState();
  G.advance(lastMinute,lastMinute.t/lastMinute.len);
  assert.equal(lastMinute.graph.node,'strike_trade',
   'last-minute arc expiry may not erase this real physical setup');
  assert.equal(lastMinute.r.getState(),lateState,
   'last-minute protection makes no RNG draw');
  assert.ok(G.pool(lastMinute).some(([id,weight])=>id==='clothesline'&&weight>0),
   'late continuation enters the actual legal action pool');
  assert.ok(G.pool(lastMinute).some(([id])=>id!=='clothesline'),
   'the impact is not forced');
  step(lastMinute,'clothesline','w');
  lastMinute.t=lastMinute.len;
  assert.equal(G.closingRunway(lastMinute)?.status,'linked',
   'real late combination remains recent enough at the booked bell');
  const lateOpponent=create(structure,'story');
  lateOpponent.t=Math.floor(lateOpponent.len*.959);
  step(lateOpponent,'strike_trade','f');
  assert.equal(G.closingOffers(lateOpponent,'f').length,0,
   'the losing side receives no late-window closing guidance');
  const tooLate=create(structure,'story');
  tooLate.t=tooLate.len-10;
  step(tooLate,'strike_trade','w');
  assert.equal(G.closingOffers(tooLate,'w').length,0,
   'cannot offer a two-beat finishing sequence without sufficient clock');
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
  // Real landed continuation must keep its physically earned position for
  // one step; a Director reset must not invent a fresh standing exchange.
  const afterImpact=create(structure,'story');
  afterImpact.t=Math.floor(afterImpact.len*.92);
  afterImpact.graph.started=true;afterImpact.graph.arc='exchange';
  step(afterImpact,'strike_trade','w');
  afterImpact.t+=10;step(afterImpact,'clothesline','w');
  assert.equal(afterImpact.story.position,'mat');
  assert.equal(afterImpact.story.down,'f');
  afterImpact.t+=10;afterImpact.graph.age=999;
  const beforeImpactAdvance=afterImpact.r.getState();
  G.advance(afterImpact,afterImpact.t/afterImpact.len);
  assert.equal(afterImpact.story.control,'w','actual earned control is retained');
  assert.equal(afterImpact.story.position,'mat','arc cannot erase genuine knockdown immediately');
  assert.equal(afterImpact.graph.node,'clothesline','real authored finish link remains present');
  assert.equal(afterImpact.graph.closingImpactProtected,1,
   'one follow-through selection was protected');
  assert.equal(afterImpact.r.getState(),beforeImpactAdvance,
   'closing protection cannot consume RNG or decide a move');
  // Phase 9E: one additional real mat handoff, without a free attack.
  afterImpact.t+=10;afterImpact.graph.age=999;
  const extraRng=afterImpact.r.getState();
  G.advance(afterImpact,afterImpact.t/afterImpact.len);
  assert.equal(afterImpact.story.position,'mat','real impact survives second clock handoff');
  assert.equal(afterImpact.story.control,'w','controller is still the actual attacker');
  assert.equal(afterImpact.graph.closingImpactExtended,1,'bounded second handoff counted');
  assert.equal(afterImpact.r.getState(),extraRng,'handoff makes no RNG draw');
  // Symmetric: the booked loser must not lose a physically earned landing.
  const loserImpact=create(structure,'story');
  loserImpact.t=Math.floor(loserImpact.len*.92);
  loserImpact.graph.started=true;loserImpact.graph.arc='exchange';
  step(loserImpact,'strike_trade','f');
  loserImpact.t+=10;step(loserImpact,'clothesline','f');
  loserImpact.t+=10;loserImpact.graph.age=999;
  G.advance(loserImpact,loserImpact.t/loserImpact.len);
  assert.equal(loserImpact.story.control,'f','opponent also retains true mat control');
  assert.equal(loserImpact.graph.closingOpponentImpactProtected,1);
  assert.equal(G.closingRunway(loserImpact),null,'loser landing cannot imply winner finish');
  // A REAL mat reversal still changes control and must not be erased by
  // an expired dramatic arc or falsely attributed to the booked winner.
  const reversed=create(structure,'story');
  reversed.t=Math.floor(reversed.len*.89);
  reversed.graph.started=true;reversed.graph.arc='exchange';
  step(reversed,'strike_trade','w');
  reversed.t+=10;step(reversed,'clothesline','w');
  reversed.t+=10;
  assert.ok(G.isValid(reversed,'mat_scramble'),'genuine mat counter remains legal');
  G.apply(reversed,'mat_scramble');
  assert.equal(reversed.story.control,'f','defender actually reverses ownership');
  reversed.t+=10;reversed.graph.age=999;
  const reverseRng=reversed.r.getState();
  G.advance(reversed,reversed.t/reversed.len);
  assert.equal(reversed.story.control,'f','arc cannot erase a performed reversal');
  assert.equal(reversed.graph.node,'mat_scramble','latest real counter remains present');
  assert.equal(reversed.graph.closingReversalProtected,1,'one defended exchange protected');
  assert.equal(reversed.r.getState(),reverseRng,'counter handoff does not roll');
  assert.equal(G.closingRunway(reversed),null,'booked winner no longer in control');
  reversed.story.control='w'; // simulate a later unearned arc reset
  assert.equal(G.closingRunway(reversed),null,
   'performed opponent reversal cannot become a fictitious finishing link');
  // A winner-owned *real* counter earns the same, unbiased protection.
  const winnerCounter=create(structure,'story');
  winnerCounter.t=Math.floor(winnerCounter.len*.88);
  winnerCounter.graph.started=true;winnerCounter.graph.arc='exchange';
  step(winnerCounter,'strike_trade','f');
  winnerCounter.t+=10;
  assert.ok(G.isValid(winnerCounter,'counter_strike'));
  G.apply(winnerCounter,'counter_strike');
  winnerCounter.t+=10;winnerCounter.graph.age=999;
  const wcRng=winnerCounter.r.getState();
  G.advance(winnerCounter,winnerCounter.t/winnerCounter.len);
  assert.equal(winnerCounter.story.control,'w','real winner reversal stays intact');
  assert.equal(winnerCounter.graph.closingReversalProtected,1);
  assert.equal(winnerCounter.r.getState(),wcRng);
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
