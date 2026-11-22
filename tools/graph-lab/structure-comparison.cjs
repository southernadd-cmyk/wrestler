#!/usr/bin/env node
'use strict';
// Phase 7 read-only comparison: real signed Director vs metadata-only control.
// 4 structures x 2 dramatic leads x 5 plans x 3 lengths x 4 styles =
// 480 active and 480 matched control matches. --quick uses two lengths/styles.
// No gameplay changes, scripted events or separate workflows.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('../../tests/_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Math,Date,JSON,console});
const {OfficeData:D,OfficeRoom:Room,OfficeSheets:S,OfficeMatch:E}=root;
const clone=x=>JSON.parse(JSON.stringify(x));
const ids=S.STRUCTURES.catalogue().map(x=>x.id),plans=['story','technical','brawl','spots','safe'];
const styles=['Technical','Brawl','Spectacle','Story'],p=D.PROMOS[0];
const quick=process.argv.includes('--quick');
// Reuse the nine concrete seed witnesses from the merged Phase 9E diagnostic.
// Retain factual evidence without assuming that an altered physical sequence
// must still have the exact same future RNG path.
const nineCases=new Set([
 'p7-0-kings_road-w-technical-8','p7-0-kings_road-w-safe-8',
 'p7-0-dominant_ace-w-safe-8','p7-0-dominant_ace-f-story-8',
 'p7-2-classic_american-f-safe-18',
 'p7-2-chickenshit_heel-f-technical-8',
 'p7-2-chickenshit_heel-f-safe-18',
 'p7-2-dominant_ace-w-technical-18',
 'p7-3-classic_american-f-spots-12'
]);
const nineCaseEvidence=[];
const phase9gLostWithoutReversal=[];
const phase9gThreeGapTraces=[];
const durations=quick?[8,18]:[8,12,18],sampleStyles=quick?styles.slice(0,2):styles;
const map=Object.fromEntries(ids.map(id=>[id,{bouts:0,earned:0,missed:0,complete:0,stars:0,
 controlStars:0,events:0,controlEvents:0,distinct:0,botches:0,controlBotches:0,
 sellingWrestlers:0,sellingStrains:0,sellingLines:0,comebackSelling:0,realBreathers:0,
 closingRunways:0,bridgedRunways:0,closingWins:0,closingLosses:0,cleanBouts:0,
 closingWithInterveningAction:0,closingReusedImpacts:0,closingPairs:{},closingImpactIds:{},
 fullRunways:0,linkedRunways:0,lateWinnerControl:0,lateWinnerSetups:0,lateWinnerImpacts:0,
 protectedFollowthroughs:0,protectedClosingImpacts:0,
 protectedCounterExchanges:0,protectedOpposingImpacts:0,extendedClosingImpacts:0,
 arcPhysicalRetained:0,arcFinishControlRetained:0,arcLateControlOverrides:0,
 arcEarnedNearfallRetained:0,
 lateLostAfterRealReversal:0,lateLostWithoutRealReversal:0,
 lateAuthoredLinkSetups:0,latePerformedLinks:0,lateInterruptedSetups:0,
 lateDiversions:0,lateLinksLostAtBell:0,lateLinksStale:0,
 lateLinksFinalMinute:0,lateLinksFinalHalfMinute:0,closingFinalMinuteRunways:0,
 motifStarts:0,motifPaid:0,motifOpen:0,
 finishes:0,finishFallbacks:0,named:0,namedHit:0,controlNamedHit:0,open:0,causalFinals:0,dangerEscapes:0,objectives:{},
 sequences:{},firstActions:{},byPlan:{},byLength:{},byStyle:{},byLead:{}}]));
const add=(o,k,n=1)=>o[k]=(o[k]||0)+n;
const ratio=(n,d)=>+(100*n/Math.max(1,d)).toFixed(1);
const avg=(n,d)=>+(n/Math.max(1,d)).toFixed(3);
const top=(obj,n=5)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,n).map(([name,count])=>({name,count}));
// A reported botch is not an invalid ordinary graph move. In this engine,
// only a scripted spectacle attempt or an extraordinary balcony dive increments
// M.botches. Record those actual attempts rather than guessing from risky calls.
// Phase 9L: diagnose the first genuine physical response to a credited
// late near-fall. Observes existing 9K evidence; no extra match simulation,
// action, RNG selection, altered finish rule or star credit.
const phase9lByPlan=Object.fromEntries(plans.map(game=>[game,{
 cleanBouts:0,lateNearfalls:0,insufficientClock:0,eligibleLateNearfalls:0,
 continuedPressure:0,earnedDefensiveReversal:0,opponentOffence:0,
 otherPhysicalResponse:0,noPhysicalResponse:0,
 nearfallBeforeClosingSetup:0,nearfallBeforeWitnessedSetup:0,
 sameOwnerAuthoredEdge:0,sameOwnerUnlinked:0,
 sameOwnerReset:0,sameOwnerCover:0,sameOwnerSetup:0,
 sameOwnerOffence:0,sameOwnerOther:0,followupActions:{},sourceActions:{},
 byNearfallKind:{authored_kickout:0,earned_cover:0}
}]));
function auditPhase9L(game,m,drama,closing){
 const row=phase9lByPlan[game],A=E.GRAPH.A;
 row.cleanBouts++;
 // This is the first logged NON-REST graph response, not automatically
 // an attack. Reset, pin, stance and contact moves are split below.
 const realAction=e=>{
  const n=A[e?.id];if(!n||!['w','f'].includes(e.preControl)||
    n.nearfall||n.blockOf||n.family==='rest')return false;
  if((!n.reverse&&(n.cost??1)<.6)||
    (e.physical&&(e.physical.area!=='ring'||
      e.physical.locations?.w!=='ring'||
      e.physical.locations?.f!=='ring')))return false;
  return ['aerialResolution','grappleResolution',
   'strikeResolution','contactResolution'].every(k=>
    !e[k]||e[k]==='landed'||(n.reverse&&e[k]==='counter'));
 };
 for(const moment of drama.moments){
  if(moment.at<m.len-180||moment.at>m.len)continue;
  row.lateNearfalls++;
  // A late bell does not prove that the engine abandoned a response:
  // require the full normal four-tick / 40-second observation window.
  if(moment.at>m.len-40){row.insufficientClock++;continue;}
  row.eligibleLateNearfalls++;
  row.byNearfallKind[moment.kind]++;
  const other=moment.side==='w'?'f':'w';
  const setups=new Set(['lockup','waistlock','front_facelock',
   'headlock','wristlock','go_behind','rope_run','rope_rebound',
   'corner_whip','top_climb','springboard_rise','knuckle_lock',
   'circle','collar_snap','opponent_study','finish_tease']);
  const covers=new Set(['cover','early_cover','near_kickout']);
  const offence=e=>{
   const n=A[e.id];return (n.zone==='mat'&&n.down==='d'&&
    !covers.has(e.id))||
    ['strike','running','suplex','power','neck','fire','ground',
     'submission','aerial','springboard','lucha','brawl','heel',
     'technical','corner'].includes(n.family)||
    ['strike_trade','probe_strike','cheap_shot','body_shot',
     'stiff_forearm','counter_strike'].includes(e.id);
  };
  const response=m.graph.events.find(e=>e.t>moment.at&&
   e.t<=moment.at+40&&realAction(e));
  if(!response)row.noPhysicalResponse++;
  else if(response.preControl===moment.side&&
   response.control===moment.side&&!A[response.id].reverse){
   // This count includes NON-OFFENSIVE graph nodes. Never describe
   // a stand-up, lockup or pin setup as a landed offensive strike.
   row.continuedPressure++;
   if(response.id==='stand_reset')row.sameOwnerReset++;
   else if(covers.has(response.id))row.sameOwnerCover++;
   else if(setups.has(response.id))row.sameOwnerSetup++;
   else if(!offence(response))row.sameOwnerOther++;
   else{
    row.sameOwnerOffence++;
    // An earned nearfall does not automatically imply an authored
    // follow-through: require a DIRECT move-graph edge to the performed
    // subsequent attack, not merely a legal action from the broad pool.
    const sourceId=moment.source?.id||moment.action;
    const sourceNode=A[sourceId];
    add(row.sourceActions,sourceId);
    add(row.followupActions,response.id);
    if(sourceNode?.next?.some(([id])=>id===response.id))
     row.sameOwnerAuthoredEdge++;
    else row.sameOwnerUnlinked++;
   }
  }
  else if(response.preControl===moment.side&&
   response.control===other&&A[response.id].reverse)
   row.earnedDefensiveReversal++;
  else if(response.preControl===other&&response.control===other&&
   !A[response.id].reverse)row.opponentOffence++;
  else row.otherPhysicalResponse++;
  // Temporal co-occurrence is not causation. Only a real final runway
  // whose setup occurred AFTER this near-fall qualifies for this field.
  if(closing&&closing.setup.at>moment.at&&
   closing.setup.at-moment.at<=120){
   row.nearfallBeforeClosingSetup++;
   row.nearfallBeforeWitnessedSetup+=Number(closing.status==='witnessed');
  }
 }
}
const scriptedBreakdown=m=>{
 const attempts=m.graph.scriptedSpotAttempts||[];
 const failed=attempts.filter(x=>x.outcome==='botched');
 assert.ok(failed.length<=m.botches,'scripted failed attempts are real botches');
 return {attempts:attempts.length,failed:failed.length,balcony:m.botches-failed.length,
  moveCounts:attempts.reduce((out,x)=>(add(out,x.id+':'+x.outcome),out),{})};
};
function sign(c,w,f,game,id,lead){
 const st=Room.begin(c,w,f,p,{structure:{id,lead},structurePlanning:true});
 st.queue=[];Room.act(st,'plan_'+game);
 assert.equal(st.stage,'board');Room.act(st,'board_ok');
 assert.equal(st.stage,'review');Room.act(st,'review_ok');Room.act(st,'talk_none');
 assert.equal(st.stage,'done');return st.sheet;
}
// Matched controls have no Director; audit named calls independently from
// real tape actions rather than trusting the structure ledger's status.
function realNamedCalls(m,sheet){
 return sheet.structurePlan.objectives.filter(o=>{
  if(!o.call)return false;
  const n=E.GRAPH.A[o.call.action],len=Math.max(1,m.len);
  return !!n&&m.graph.events.some(e=>{
   if(e.id!==o.call.action||!Number.isFinite(e.t))return false;
   const actor=n.blockOf?(e.preControl==='w'?'f':e.preControl==='f'?'w':null):
    n.reverse?e.control:e.preControl;
   return actor===o.call.owner&&e.t/len>=o.window[0]-.04&&
    e.t/len<=o.window[1]+.08;
  });
 }).length;
}
function run(sheet,c,w,f,seed,execute){
 const m=E.create({w:{...w,fatigue:5,flags:{}},f,p,slot:'main',
  finish:c.finish,minutes:sheet.minutes,feudHeat:22,seed,flags:{},
  preparation:{},plan:{game:sheet.game,leash:'script',talk:'none'},
  sheet:clone(sheet),structureExecution:execute});
 for(let i=0;i<9000&&!m.done;i++){
  if(m.decision&&!m.queue.length){
   const opts=m.decision.options||[],choice=opts.find(x=>['job','keep','protect','work'].includes(x.id))||
    opts.find(x=>!['home','cut','stop'].includes(x.id))||opts[0];
   assert.ok(choice,'live decision');E.resolve(m,choice.id);
  }
  E.next(m);
 }
 assert.ok(m.done&&m.final,'real match finishes');
 if(m.outcome==='booked')assert.equal(m.graph.outcome?.id,c.finish,'booked finish unchanged');
 return m;
}
for(let si=0;si<sampleStyles.length;si++){
 const style=sampleStyles[si],foeStyle=styles[(styles.indexOf(style)+1)%styles.length];
 const w=D.TALENT.find(x=>x.style===style);
 const f=D.FOES.find(x=>x.style===foeStyle)||D.ALL.find(x=>x.style===foeStyle&&x.id!==w?.id);
 assert.ok(w&&f&&w.id!==f.id,'valid distinct wrestler pairing');
 for(const id of ids)for(const lead of ['w','f'])for(const game of plans)for(const minutes of durations){
  const finish=['win_clean','lose_clean','win_dirty','lose_protected'][
   (si+plans.indexOf(game)+minutes/2+(lead==='f'?1:0))%4];
  const c={id:'p7-'+si+'-'+id+'-'+lead+'-'+game+'-'+minutes,wid:w.id,rid:f.id,
   pid:p.id,slot:'main',finish,minutes,eventAbs:54,feudHeat:22};
  const seed=1030001+si*10301+ids.indexOf(id)*6101+plans.indexOf(game)*379+minutes*71+(lead==='f'?41:0);
  const sheet=sign(c,w,f,game,id,lead),before=JSON.stringify(sheet);
  assert.equal(S.STRUCTURES.readPlan(sheet).mode,'editorial');
  const m=run(sheet,c,w,f,seed,true),control=run(sheet,c,w,f,seed,false),r=map[id];
  assert.equal(JSON.stringify(sheet),before,'signed plan immutable');
  assert.equal(E.structureReport(control),null,'metadata control not active');
  const v=m.final.structure,a=m.final.structureAssessment;
  assert.ok(v&&a&&v.objectives.length===4,'evidenced structure report');
  assert.ok(!m.final.starParts.some(x=>x[0]==='structure'),'no automatic stars');
  r.bouts++;r.stars+=m.final.stars;r.controlStars+=control.final.stars;
  r.cleanBouts+=Number(['win_clean','lose_clean'].includes(finish));
  if(['win_clean','lose_clean'].includes(finish)){
   const winner=finish==='win_clean'?'w':'f',loser=winner==='w'?'f':'w',
    last=m.graph.events,
    since=Math.max(0,m.len-180),
    setupIds=new Set(['strike_trade','rope_run','rope_rebound','front_facelock',
     'go_behind','waistlock','wristlock','headlock','corner_whip',
     'top_climb','springboard_rise','leg_wrench','knuckle_lock']);
   // Read-only closing funnel: keep authored possibility, performed impact,
   // diversions and real interruptions separate from final attribution.
   // Use the same bounded closing tape as Phase 9C; no gameplay RNG.
   const A=E.GRAPH.A,earliest=m.len-Math.min(220,m.len*.34);
   const cleanEvent=e=>{
    const n=A[e.id];
    return !!n&&Number.isFinite(e.t)&&e.t>=0&&e.t<=m.len&&
      !n.blockOf&&!n.nearfall&&
      ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
       .every(k=>!e[k]||e[k]==='landed'||(n.reverse&&e[k]==='counter'));
   };
   const tape=last.filter(cleanEvent);
   const setupEvents=tape.filter(e=>e.t>=earliest&&
    e.preControl===winner&&e.control===winner&&setupIds.has(e.id));
   let hasAuthored=false,hasLinked=false,hasInterruption=false,
    hasDiversion=false,hasLateLink=false,
    hasFinalMinuteLink=false,hasFinalHalfMinuteLink=false,
    latestLateImpact=null;
   for(const setup of setupEvents){
    const links=new Set((A[setup.id]?.next||[]).map(([id])=>id).filter(id=>
      A[id]?.zone==='mat'&&A[id]?.down==='d'&&!A[id]?.reverse&&
      !A[id]?.counterOf&&!A[id]?.blockOf));
    if(!links.size)continue;
    hasAuthored=true;
    const following=tape.filter(e=>e.t>setup.t&&e.t-setup.t<=60);
    const next=following[0];
    if(next&&next.preControl===loser)hasInterruption=true;
    if(next&&next.preControl===winner&&!links.has(next.id))hasDiversion=true;
    const linked=following.find(e=>links.has(e.id)&&
      e.preControl===winner&&e.control===winner&&
      e.position==='mat'&&e.down===loser);
    if(linked){
     hasLinked=true;
     if(m.len-linked.t<=90){
      hasLateLink=true;
      if(!latestLateImpact||linked.t>latestLateImpact.t)
       latestLateImpact=linked;
     }
     if(m.len-linked.t<=60)hasFinalMinuteLink=true;
     if(m.len-linked.t<=30)hasFinalHalfMinuteLink=true;
    }
   }
   r.lateAuthoredLinkSetups+=Number(hasAuthored);
   r.latePerformedLinks+=Number(hasLinked);
   r.lateInterruptedSetups+=Number(hasInterruption);
   r.lateDiversions+=Number(hasDiversion);
   r.lateLinksStale+=Number(hasLinked&&!hasLateLink);
   r.lateLinksFinalMinute+=Number(hasFinalMinuteLink);
   r.lateLinksFinalHalfMinute+=Number(hasFinalHalfMinuteLink);
   r.lateLinksLostAtBell+=Number(hasLateLink&&m.story.control!==winner);
   if(latestLateImpact&&m.story.control!==winner){
    const reversed=tape.some(e=>e.t>latestLateImpact.t&&
     A[e.id]?.reverse&&e.preControl===winner&&e.control===loser);
    r.lateLostAfterRealReversal+=Number(reversed);
    r.lateLostWithoutRealReversal+=Number(!reversed);
    if(!reversed){
     const original=m.graph.events.filter(e=>A[e.id]&&e.t>=latestLateImpact.t);
     const takeovers=[];
     for(let idx=1;idx<original.length;idx++){
      const left=original[idx-1],right=original[idx];
      if(left.control!==right.preControl)
       takeovers.push({from:left.id,fromT:m.len-left.t,fromController:left.control,
        to:right.id,toT:m.len-right.t,toActor:right.preControl,
        toControl:right.control,toArc:right.arc,reverse:!!A[right.id].reverse});
     }
     phase9gLostWithoutReversal.push({
      case:c.id,seed,structure:id,lead,game,minutes,booked:finish,winner,
      latestImpact:{id:latestLateImpact.id,left:m.len-latestLateImpact.t},
      bell:{control:m.story.control,position:m.story.position,arc:m.graph.arc},
      lastMove:original.at(-1)?{id:original.at(-1).id,control:original.at(-1).control,
       left:m.len-original.at(-1).t}:null,
      arcOverrides:m.graph.arcLateControlOverrides||0,
      physicalRetained:m.graph.arcPhysicalRetained||0,
      arcWitnesses:m.graph.arcPhysicalWitnesses||[],
      takeoverGaps:takeovers,actions:original.map(e=>({id:e.id,
       left:m.len-e.t,actor:e.preControl,control:e.control,reverse:!!A[e.id].reverse,
       position:e.position,down:e.down,arc:e.arc,physical:e.physical?.area||null}))
     });
    }
   }
   r.lateWinnerControl+=Number(m.story.control===winner);
   r.lateWinnerSetups+=Number(last.some(e=>e.t>=since&&e.t<=m.len&&
    e.preControl===winner&&e.control===winner&&setupIds.has(e.id)));
   r.lateWinnerImpacts+=Number(last.some(e=>e.t>=since&&e.t<=m.len&&
    e.preControl===winner&&e.control===winner&&e.position==='mat'&&
    e.down===loser&&E.GRAPH.A[e.id]?.zone==='mat'&&
    E.GRAPH.A[e.id]?.down==='d'));
  }
  r.events+=m.graph.events.length;r.controlEvents+=control.graph.events.length;
  r.protectedFollowthroughs+=m.graph.closingProtected||0;
  r.protectedClosingImpacts+=m.graph.closingImpactProtected||0;
  r.extendedClosingImpacts+=m.graph.closingImpactExtended||0;
  r.protectedOpposingImpacts+=m.graph.closingOpponentImpactProtected||0;
  r.protectedCounterExchanges+=m.graph.closingReversalProtected||0;
  r.arcPhysicalRetained+=m.graph.arcPhysicalRetained||0;
  r.arcEarnedNearfallRetained+=m.graph.arcEarnedNearfallRetained||0;
  r.arcFinishControlRetained+=m.graph.arcFinishControlRetained||0;
  r.arcLateControlOverrides+=m.graph.arcLateControlOverrides||0;
  assert.equal(control.graph.arcPhysicalRetained||0,0,
   'metadata-only controls cannot earn director handoff protection');
  assert.equal(control.graph.arcEarnedNearfallRetained||0,0,
   'metadata-only controls cannot inherit credited cover control');
  for(const guard of m.graph.arcPhysicalWitnesses||[]){
   const actual=m.graph.events.find(e=>e.id===guard.move&&e.t===guard.moveAt);
   assert.ok(actual,'late arc handoff requires a performed action');
   assert.equal(actual.control,guard.actor,'handoff keeps actual control');
   assert.ok(guard.at-actual.t>=0&&guard.at-actual.t<=40,
    'arc handoff evidence must be recent');
  }
  if(nineCases.has(c.id)){
   // Count only performed graph actions; a scheduled nearfall or outcome
   // has no preControl and must never masquerade as a wrestling takeover.
   const raw=m.graph.events,late=raw.filter(e=>!!E.GRAPH.A[e.id]&&
    e.t>=m.len-90&&e.t<=m.len);
   const gaps=late.slice(1).filter((e,i)=>
    ['w','f'].includes(late[i].control)&&
    ['w','f'].includes(e.preControl)&&
    late[i].control!==e.preControl);
   if(gaps.length&&['p7-2-chickenshit_heel-f-technical-8',
     'p7-2-chickenshit_heel-f-safe-18',
     'p7-2-dominant_ace-w-technical-18'].includes(c.id)){
    phase9gThreeGapTraces.push({
     case:c.id,seed,booked:finish,
     gaps:gaps.map(e=>({id:e.id,at:m.len-e.t,pre:e.preControl,
      after:e.control,arc:e.arc,reverse:!!E.GRAPH.A[e.id]?.reverse,
      preceding:late[late.indexOf(e)-1]?.id||null,
      voluntaryBreak:['catch_breath','crowd_pose','taunt'].includes(
       late[late.indexOf(e)-1]?.id)})),
     lastMinute:late.map(e=>({id:e.id,at:m.len-e.t,pre:e.preControl,
      after:e.control,arc:e.arc,reverse:!!E.GRAPH.A[e.id]?.reverse})),
     arcOverrides:m.graph.arcLateControlOverrides||0,
     arcHistory:m.graph.history.slice(-10),
     physicalWitnesses:m.graph.arcPhysicalWitnesses||[]
    });
   }
   nineCaseEvidence.push({case:c.id,seed,finish,
    bell:m.story.control,latestEvent:late.at(-1)?.id||null,
    latestControl:late.at(-1)?.control||null,
    silentAfterLast:!!late.length&&late.at(-1).control!==m.story.control,
    interEventGaps:gaps.length,
    retained:m.graph.arcPhysicalRetained||0,
    retainedAtFinish:m.graph.arcFinishControlRetained||0,
    lateArcOverrides:m.graph.arcLateControlOverrides||0,
    bookedOutcome:m.graph.outcome?.id,
    finishingStatus:m.final.finishingRunway?.status||null
   });
  }
  assert.equal(control.graph.closingProtected||0,0,'metadata-only controls cannot protect closing links');
  assert.equal(control.graph.closingImpactProtected||0,0,'metadata-only controls cannot protect impacts');
  assert.equal(control.graph.closingReversalProtected||0,0,'metadata-only controls cannot protect reversals');
  assert.equal(control.graph.closingImpactExtended||0,0,'metadata-only controls cannot extend impacts');
  r.distinct+=new Set(m.graph.events.map(x=>x.id)).size;
  r.botches+=m.botches;r.controlBotches+=control.botches;
  const closing=m.final.finishingRunway;
  // Phase 9K evidence must remain a SEPARATE count, never a substitute
  // for a real unbroken booked finish. A completed cradle is a kick-out.
  const drama=m.final.nearfallDrama,controlDrama=control.final.nearfallDrama;
  assert.ok(drama&&controlDrama,'both matches must report witnessed near-fall evidence');
  if(['win_clean','lose_clean'].includes(finish))auditPhase9L(game,m,drama,closing);
  for(const [bout,reportNear]of [[m,drama],[control,controlDrama]]){
   const rng=bout.r.getState(),beforeEvents=JSON.stringify(bout.graph.events);
   assert.equal(JSON.stringify(E.GRAPH.nearfallDrama(bout)),
    JSON.stringify(reportNear),'near-fall observer is replayable from real tape');
   assert.equal(bout.r.getState(),rng,'near-fall observer cannot consume match RNG');
   assert.equal(JSON.stringify(bout.graph.events),beforeEvents,
    'near-fall observer cannot write wrestling events');
   assert.equal(reportNear.total,reportNear.byKind.authored_kickout+
    reportNear.byKind.earned_cover,'near-fall evidence kinds must reconcile');
   assert.equal(reportNear.total,reportNear.bySide.w+reportNear.bySide.f,
    'near-fall evidence needs a real action owner');
   assert.ok(reportNear.total<=bout.nearfalls,
    'observed credible nearfalls cannot exceed all recorded kickouts');
  }
  assert.equal(control.final.finishingRunway,undefined,'metadata control has no finishing runway');
  if(closing){
   const tape=m.graph.events,A=E.GRAPH.A,
    exact=e=>e&&tape.find(x=>x.id===e.id&&x.t===e.at),
    setup=exact(closing.setup),impact=exact(closing.impact);
   assert.ok(setup&&impact&&setup.t<impact.t&&impact.t-setup.t<=60,
    'a linked finish needs two recent real, ordered actions');
   assert.equal(closing.winner,finish==='win_clean'?'w':'f');
   assert.equal(setup.preControl,closing.winner);
   assert.equal(setup.control,closing.winner);
   assert.equal(impact.preControl,closing.winner);
   assert.equal(impact.control,closing.winner);
   assert.equal(impact.position,'mat');
   assert.equal(impact.down,closing.loser);
   assert.ok(!tape.some(e=>e.t>impact.t&&A[e.id]?.reverse&&
     e.preControl===closing.winner&&e.control===closing.loser),
    'reported finish cannot erase a performed opponent reversal');
   assert.ok(A[setup.id]?.next?.some(([id])=>id===impact.id),
    'a real authored edge must connect the setup and impact');
   if(closing.status==='witnessed'){
    const threat=exact(closing.pressure),cut=exact(closing.cutoff);
    assert.ok(threat&&cut&&threat.t<cut.t&&cut.t<setup.t,
     'full sequence needs earlier witnessed opponent pressure and reversal');
    assert.equal(threat.preControl,closing.loser);
    assert.equal(cut.preControl,closing.loser);
    assert.equal(cut.control,closing.winner);
    assert.ok(A[cut.id]?.reverse);
    r.fullRunways++;
   }else{
    assert.equal(closing.status,'linked');
    assert.equal(closing.pressure,null,'no imagined pressure');
    assert.equal(closing.cutoff,null,'no imagined counter');
    r.linkedRunways++;
   }
   r.closingRunways++;
   add(r.closingPairs,setup.id+'>'+impact.id);
   add(r.closingImpactIds,impact.id);
   // A real same-owned move between setup and impact still permits the
   // original authored link, but only if the established evidence passes
   // all of the unchanged control-break and source checks above.
   r.closingWithInterveningAction+=Number(tape.some(e=>e.t>setup.t&&
    e.t<impact.t&&!!A[e.id]&&e.preControl===closing.winner&&
    e.control===closing.winner&&!A[e.id].reverse));
   r.closingReusedImpacts+=Number(tape.some(e=>e.id===impact.id&&
    e.t<impact.t&&e.t>=impact.t-150&&e.preControl===closing.winner));
   r.closingFinalMinuteRunways+=Number(m.len-closing.impact.at<=60);
   r.bridgedRunways+=Number(!!closing.spoken);
   r.closingWins+=Number(closing.winner==='w');
   r.closingLosses+=Number(closing.winner==='f');
  }
  const selling=m.final.matchSelling;
  assert.equal(control.final.matchSelling,undefined,'metadata-only cannot acquire Phase 9B selling');
  if(selling){
   let counted=0;
   for(const [side,s] of Object.entries(selling.wrestlers)){
    assert.ok(m.graph.damage[side]>=3,'selling needs witnessed focused damage');
    assert.ok(s.sellingLines<=3&&s.sellingLines<=s.strenuousMoves,
     'selling narration must be bounded by performed exertion');
    r.sellingWrestlers++;r.sellingStrains+=s.strenuousMoves;
    r.sellingLines+=s.sellingLines;r.comebackSelling+=s.comebackLines;
    r.realBreathers+=s.realBreathers;counted+=s.strenuousMoves;
   }
   assert.equal(counted,m.graph.events.filter(x=>x.sellingStrain).length,
    'every strained action must exist in the physical graph');
  }
  const motif=m.final.matchMotif;
  assert.equal(control.final.matchMotif,undefined,'metadata-only control must not have motif');
  if(motif){
   const tries=m.graph.grappleAttempts.filter(x=>x.id===motif.action&&x.side===motif.owner);
   assert.ok(tries.some(x=>['counter','block'].includes(x.outcome)&&
    x.resolvedT===motif.firstFailedAt),'a genuine failed attempt began this motif');
   const paid=tries.some(x=>x.outcome==='landed'&&
    x.startedT>motif.firstFailedAt&&x.resolvedT===motif.paidAt);
   assert.equal(motif.status==='paid',paid,'earned payoff must be real later landing');
   r.motifStarts++;r.motifPaid+=Number(paid);r.motifOpen+=Number(!paid);
  }
  const risk=scriptedBreakdown(m),controlRisk=scriptedBreakdown(control);
  if(game==='safe'){
   // No unsafe scripted stunt or balcony dive can enter a Safe layout.
   assert.equal(risk.balcony,0,'Safe: no balcony botches');
   assert.equal(controlRisk.balcony,0,'Safe control: no balcony botches');
   for(const x of m.graph.scriptedSpotAttempts||[])
    assert.equal(x.id,'ar_elbow_point','Safe: only the guarded elbow may be scripted');
  }
  r.finishFallbacks+=Number(!!m.finishRouteFallbackFrom);
  r.finishes+=Number(m.graph.outcome?.id===finish);
  r.named+=a.planAdherence.namedCalls;r.namedHit+=a.planAdherence.witnessedCalls;
  const real=realNamedCalls(m,sheet),controlReal=realNamedCalls(control,sheet);
  assert.equal(a.planAdherence.witnessedCalls,real,'named call proved independently from performed tape');
  r.controlNamedHit+=controlReal;
  r.open+=a.planAdherence.openObjectives;
  let witnessed=0;const sequence=[];
  for(let k=0;k<4;k++){
   const o=v.objectives[k],plan=sheet.structurePlan.objectives[k];
   assert.equal(o.id,plan.id);
   assert.ok(['achieved','adapted','missed'].includes(o.status));
   add(r.objectives,o.id+':'+o.status);
   if(o.status==='missed'){r.missed++;sequence.push('-');continue;}
   r.earned++;witnessed++;
   const e=o.evidence.find(e=>e.at===o.at)||o.evidence.at(-1);
   assert.ok(e&&m.graph.events.some(x=>x.id===e.id&&x.t===e.at),
    'structure evidence from real recorded action');
   if(id==='chickenshit_heel'&&o.intent==='escape'){
    assert.equal(e.threatened,true,'credited escape must answer genuine danger');
    const opposite=lead==='w'?'f':'w',horizon=Math.min(150,m.len*.18);
    assert.ok(m.graph.events.some(x=>{
     const n=E.GRAPH.A[x.id];
     return x.t<e.at&&e.at-x.t<=horizon&&x.preControl===opposite&&
      n&&!n.reverse&&!n.blockOf&&!n.nearfall&&(n.cost??0)>=1.5&&
      ['strike','running','power','suplex','neck','submission','aerial','fire','ground','corner'].includes(n.family);
    }),'recent danger must be recorded in physical graph events');
    r.dangerEscapes++;
   }
   assert.ok(e.progress>=plan.window[0]-.04001&&e.progress<=plan.window[1]+.08001,
    'evidence in intended time window');
   if(o.intent==='finish_build'&&o.evidence.length===1){
    const earlier=v.objectives.slice(0,k).flatMap(x=>x.evidence);
    assert.ok(e.impact&&earlier.some(p=>p.id!==e.id&&p.at<e.at&&e.at-p.at<=150),
     'one closing impact needs a different witnessed setup inside 150 seconds');
    r.causalFinals++;
   }
   sequence.push(e.id);add(r.firstActions,o.id+':'+e.id);
  }
  if(witnessed===4)r.complete++;
  add(r.sequences,sequence.join('>'));
  for(const [key,label] of [['byPlan',game],['byLength',String(minutes)],
   ['byStyle',style],['byLead',lead]]){
   const group=r[key][label]??={bouts:0,earned:0,stars:0,
    botches:0,controlBotches:0,scriptedAttempts:0,controlScriptedAttempts:0,
    scriptedBotches:0,controlScriptedBotches:0,balconyBotches:0,controlBalconyBotches:0,
    namedHits:0,controlNamedHits:0,riskySignedCalls:0,scriptedMoveCounts:{},
    cleanBouts:0,closingRunways:0,bridgedRunways:0,
    closingPairs:{},closingImpactIds:{},closingSetups:{},
    fullClosingRunways:0,intermediateClosingRunways:0,
    nearfallDrama:0,authoredKickouts:0,earnedCovers:0,nearfallBouts:0,
    bothNearfallAndRunway:0,nearfallWithoutRunway:0,
    nearfallActions:{},safeOrdinaryRisk:0,safeSuperplexRisk:0,
    safeTopFollow:0,safeScriptedLate:0,safeRiskMoves:{}};
   group.bouts++;group.earned+=witnessed;group.stars+=m.final.stars;
   group.cleanBouts+=Number(['win_clean','lose_clean'].includes(finish));
   group.closingRunways+=Number(!!closing);
   group.bridgedRunways+=Number(!!closing?.spoken);
   group.nearfallDrama+=drama.total;
   group.authoredKickouts+=drama.byKind.authored_kickout;
   group.earnedCovers+=drama.byKind.earned_cover;
   group.nearfallBouts+=Number(drama.total>0);
   group.bothNearfallAndRunway+=Number(drama.total>0&&!!closing);
   group.nearfallWithoutRunway+=Number(drama.total>0&&!closing);
   for(const mmt of drama.moments)add(group.nearfallActions,mmt.action);
   if(game==='safe'){
    const recent=m.graph.events.filter(e=>e.t>=m.len-180&&e.t<=m.len);
    for(const e of recent){
     const a=E.GRAPH.A[e.id];
     if(!a?.risk||a.reverse||a.counterOf||a.blockOf)continue;
     group.safeOrdinaryRisk++;add(group.safeRiskMoves,e.id);
     group.safeSuperplexRisk+=Number(a.family==='superplex');
     group.safeTopFollow+=Number(e.id==='top_follow');
    }
    group.safeScriptedLate+=(m.graph.scriptedSpotAttempts||[]).filter(e=>
     Number.isFinite(e.t)&&e.t>=m.len-180&&e.t<=m.len).length;
   }
   if(closing){
    add(group.closingPairs,closing.setup.id+'>'+closing.impact.id);
    add(group.closingImpactIds,closing.impact.id);
    add(group.closingSetups,closing.setup.id);
    group.fullClosingRunways+=Number(closing.status==='witnessed');
    group.intermediateClosingRunways+=Number(
     m.graph.events.some(e=>!!E.GRAPH.A[e.id]&&
      e.t>closing.setup.at&&e.t<closing.impact.at&&
      e.preControl===closing.winner&&e.control===closing.winner));
   }
   group.botches+=m.botches;group.controlBotches+=control.botches;
   group.scriptedAttempts+=risk.attempts;group.controlScriptedAttempts+=controlRisk.attempts;
   group.scriptedBotches+=risk.failed;group.controlScriptedBotches+=controlRisk.failed;
   group.balconyBotches+=risk.balcony;group.controlBalconyBotches+=controlRisk.balcony;
   group.namedHits+=real;group.controlNamedHits+=controlReal;
   group.riskySignedCalls+=sheet.structurePlan.objectives.filter(o=>o.call&&E.GRAPH.A[o.call.action]?.risk).length;
   for(const [name,count] of Object.entries(risk.moveCounts))add(group.scriptedMoveCounts,name,count);
  }
 }
}
const report={schema:'office-structure-phase7-audit-v1',mode:quick?'quick':'full',
 method:'Four structures, paired signed editorial vs metadata-only control, identical seeded matches. Actual graph actions only.',
 totalBouts:Object.values(map).reduce((n,r)=>n+r.bouts*2,0),
 structures:Object.fromEntries(ids.map(id=>{
  const r=map[id],dims={};
  for(const key of ['byPlan','byLength','byStyle','byLead'])
   dims[key]=Object.fromEntries(Object.entries(r[key]).map(([k,v])=>[k,{
    bouts:v.bouts,earnedPct:ratio(v.earned,4*v.bouts),meanStars:avg(v.stars,v.bouts),
    botches:v.botches,controlBotches:v.controlBotches,
    scriptedAttempts:v.scriptedAttempts,controlScriptedAttempts:v.controlScriptedAttempts,
    scriptedBotches:v.scriptedBotches,controlScriptedBotches:v.controlScriptedBotches,
    balconyBotches:v.balconyBotches,controlBalconyBotches:v.controlBalconyBotches,
    namedHits:v.namedHits,controlNamedHits:v.controlNamedHits,
    riskySignedCalls:v.riskySignedCalls,
    cleanBouts:v.cleanBouts,closingRunways:v.closingRunways,
    bridgedRunways:v.bridgedRunways,
    fullClosingRunways:v.fullClosingRunways,
    intermediateClosingRunways:v.intermediateClosingRunways,
    distinctClosingPairs:Object.keys(v.closingPairs).length,
    distinctClosingImpacts:Object.keys(v.closingImpactIds).length,
    topClosingPairs:top(v.closingPairs,6),
    topClosingSetups:top(v.closingSetups,6),
    nearfallDrama:v.nearfallDrama,authoredKickouts:v.authoredKickouts,
    earnedCovers:v.earnedCovers,nearfallBouts:v.nearfallBouts,
    bothNearfallAndRunway:v.bothNearfallAndRunway,
    nearfallWithoutRunway:v.nearfallWithoutRunway,
    topNearfallActions:top(v.nearfallActions,10),
    safeOrdinaryRisk:v.safeOrdinaryRisk,
    safeSuperplexRisk:v.safeSuperplexRisk,
    safeTopFollow:v.safeTopFollow,
    safeScriptedLate:v.safeScriptedLate,
    safeRiskMoves:top(v.safeRiskMoves,10),
    scriptedMoveCounts:top(v.scriptedMoveCounts,12)}]));
  const sequences=top(r.sequences,6);
  return [id,{bouts:r.bouts,earnedPct:ratio(r.earned,4*r.bouts),
   perfectPct:ratio(r.complete,r.bouts),missed:r.missed,
   meanStars:avg(r.stars,r.bouts),controlStars:avg(r.controlStars,r.bouts),
   starDelta:avg(r.stars-r.controlStars,r.bouts),
   meanEvents:avg(r.events,r.bouts),controlEvents:avg(r.controlEvents,r.bouts),
   meanDistinctActions:avg(r.distinct,r.bouts),
   botches:r.botches,controlBotches:r.controlBotches,
   motifStarts:r.motifStarts,motifPaid:r.motifPaid,motifOpen:r.motifOpen,
   sellingWrestlers:r.sellingWrestlers,sellingStrains:r.sellingStrains,
   sellingLines:r.sellingLines,comebackSelling:r.comebackSelling,
   realBreathers:r.realBreathers,
   cleanBouts:r.cleanBouts,
   closingRunways:r.closingRunways,bridgedRunways:r.bridgedRunways,
   fullRunways:r.fullRunways,linkedRunways:r.linkedRunways,
   closingWithInterveningAction:r.closingWithInterveningAction,
   closingReusedImpacts:r.closingReusedImpacts,
   distinctClosingPairs:Object.keys(r.closingPairs).length,
   distinctClosingImpacts:Object.keys(r.closingImpactIds).length,
   topClosingPairs:top(r.closingPairs,10),
   topClosingImpacts:top(r.closingImpactIds,10),
   lateWinnerControl:r.lateWinnerControl,lateWinnerSetups:r.lateWinnerSetups,
   lateWinnerImpacts:r.lateWinnerImpacts,
   protectedFollowthroughs:r.protectedFollowthroughs,
   protectedClosingImpacts:r.protectedClosingImpacts,
   protectedCounterExchanges:r.protectedCounterExchanges,
   protectedOpposingImpacts:r.protectedOpposingImpacts,
   extendedClosingImpacts:r.extendedClosingImpacts,
   arcPhysicalRetained:r.arcPhysicalRetained,
   arcEarnedNearfallRetained:r.arcEarnedNearfallRetained,
   arcFinishControlRetained:r.arcFinishControlRetained,
   arcLateControlOverrides:r.arcLateControlOverrides,
   lateAuthoredLinkSetups:r.lateAuthoredLinkSetups,
   latePerformedLinks:r.latePerformedLinks,
   lateInterruptedSetups:r.lateInterruptedSetups,
   lateDiversions:r.lateDiversions,
   lateLinksLostAtBell:r.lateLinksLostAtBell,
   lateLostAfterRealReversal:r.lateLostAfterRealReversal,
   lateLostWithoutRealReversal:r.lateLostWithoutRealReversal,
   lateLinksStale:r.lateLinksStale,
   lateLinksFinalMinute:r.lateLinksFinalMinute,
   lateLinksFinalHalfMinute:r.lateLinksFinalHalfMinute,
   closingFinalMinuteRunways:r.closingFinalMinuteRunways,
   closingWins:r.closingWins,closingLosses:r.closingLosses,
   bookedFinishes:r.finishes,finishFallbacks:r.finishFallbacks,causalFinals:r.causalFinals,dangerEscapes:r.dangerEscapes,
   namedCalls:r.named,namedHitPct:ratio(r.namedHit,r.named),controlNamedHitPct:ratio(r.controlNamedHit,r.named),openObjectives:r.open,
   objectiveStatus:r.objectives,topActions:top(r.firstActions,12),
   uniqueSequences:Object.keys(r.sequences).length,
   commonSequenceShare:ratio(sequences[0]?.count||0,r.bouts),
   topSequences:sequences,...dims}];
 }))};
assert.equal(report.totalBouts,(quick?320:960));
for(const r of Object.values(map)){
 assert.ok(r.closingRunways<=r.cleanBouts,'only clean finishes may earn 9C runways');
 assert.equal(r.closingRunways,r.fullRunways+r.linkedRunways,'graded evidence totals must reconcile');
 assert.ok(r.closingWithInterveningAction<=r.closingRunways,
  'only truthful runways can credit intermediate authored follow-through');
 assert.ok(Object.keys(r.closingPairs).length<=r.closingRunways,
  'distinct finishing combinations require performed links');
 assert.ok(r.closingRunways<=r.lateWinnerControl,
  'a verified finishing runway must preserve winner control at the bell');
 assert.ok(r.closingRunways<=r.lateWinnerSetups,
  'a verified finishing runway must include a real late setup');
 assert.ok(r.closingRunways<=r.lateWinnerImpacts,
  'a verified finishing runway must include a real late impact');
}
// Phase 9G established zero unearned late winner-control losses on this
// exact matched full sample. Closing-timing changes must not reintroduce any.
if(!quick)assert.equal(Object.values(map).reduce((sum,r)=>
 sum+r.lateLostWithoutRealReversal,0),0,
 'Phase 9H cannot regress Phase 9G physical control continuity');
console.log('PHASE7_AUDIT_JSON '+JSON.stringify(report));
console.log('PHASE9K_NEARFALL_AUDIT_JSON '+JSON.stringify({
 schema:'office-phase9k-nearfall-drama-v1',
 method:'Evidence-only: actual authored cradle two-counts vs earned scheduled covers; separate from late winner-owned closing runway. Safe records actual risk-flagged ordinary graph actions separately from scripted stunts.',
 byPlan:Object.fromEntries(plans.map(game=>{
  const x=Object.values(report.structures).map(s=>s.byPlan[game]);
  return [game,{
   cleanBouts:x.reduce((a,r)=>a+r.cleanBouts,0),
   nearfallDrama:x.reduce((a,r)=>a+r.nearfallDrama,0),
   authoredKickouts:x.reduce((a,r)=>a+r.authoredKickouts,0),
   earnedCovers:x.reduce((a,r)=>a+r.earnedCovers,0),
   nearfallBouts:x.reduce((a,r)=>a+r.nearfallBouts,0),
   bothNearfallAndRunway:x.reduce((a,r)=>a+r.bothNearfallAndRunway,0),
   nearfallWithoutRunway:x.reduce((a,r)=>a+r.nearfallWithoutRunway,0),
   closingRunways:x.reduce((a,r)=>a+r.closingRunways,0),
   safeOrdinaryRisk:x.reduce((a,r)=>a+r.safeOrdinaryRisk,0),
   safeSuperplexRisk:x.reduce((a,r)=>a+r.safeSuperplexRisk,0),
   safeTopFollow:x.reduce((a,r)=>a+r.safeTopFollow,0),
   safeScriptedLate:x.reduce((a,r)=>a+r.safeScriptedLate,0),
   topNearfallActions:x.flatMap(r=>r.topNearfallActions),
   safeRiskMoves:x.flatMap(r=>r.safeRiskMoves)
  }];
 }))
}));
// Phase 9L diagnostic only: count what *actually* follows a witnessed
// late nearfall. Do not treat a non-reversal opponent move as an earned
// takeover and do not count a nearfall as the contracted finish.
for(const row of Object.values(phase9lByPlan)){
 assert.equal(row.lateNearfalls,row.insufficientClock+row.eligibleLateNearfalls,
  'late covers must reconcile with sufficient-clock opportunities');
 assert.equal(row.eligibleLateNearfalls,row.continuedPressure+
  row.earnedDefensiveReversal+row.opponentOffence+
  row.otherPhysicalResponse+row.noPhysicalResponse,
  'each eligible late cover must have exactly one first response classification');
 assert.ok(row.nearfallBeforeWitnessedSetup<=row.nearfallBeforeClosingSetup,
  'witnessed full closing runways must be a subset of real linked runways');
 assert.equal(row.sameOwnerReset+row.sameOwnerCover+
  row.sameOwnerSetup+row.sameOwnerOffence+row.sameOwnerOther,
  row.continuedPressure,'same-side graph responses must distinguish actual offence from resets, covers and setups');
 assert.equal(row.sameOwnerAuthoredEdge+row.sameOwnerUnlinked,row.sameOwnerOffence,
  'only actual same-side offence may be classified by source-authored graph links');
}
console.log('PHASE9L_NEARFALL_RESPONSE_JSON '+JSON.stringify({
 schema:'office-phase9l-nearfall-response-v1',
 method:'Credited 9K nearfalls at 180–40 seconds before bell in Director-active clean matches; first non-rest verified graph response within 40 seconds. Same-side resets, covers, setups, actual offence and other nodes are reported separately; only offence counts toward source-authored continuation. A timestamp-only link to a credited runway setup within 120 seconds is NOT claimed causal.',
 byPlan:Object.fromEntries(Object.entries(phase9lByPlan).map(([plan,row])=>
  [plan,{...row,
   followupActions:top(row.followupActions,12),
   sourceActions:top(row.sourceActions,12)}]))
}));
console.log('PHASE9G_TRACE_JSON '+JSON.stringify({
 base:'7bd150ec60fe693c1818d516df4ce19618577849',
 lostCount:phase9gLostWithoutReversal.length,lateLosses:phase9gLostWithoutReversal,
 gapCount:phase9gThreeGapTraces.length,threeOriginalGaps:phase9gThreeGapTraces
}));
console.log('PHASE9F_NINE_CASE_JSON '+JSON.stringify({
 base:'38887cacda5d73afa77094c4647c20702a1e6e73',
 total:nineCaseEvidence.length,
 cases:nineCaseEvidence
}));
// Focused read-only risk report for Phase 8: the existing seeded 960-match
// comparison, no new workflow or extra stochastic fixture.
console.log('PHASE8_RISK_JSON '+JSON.stringify({
 schema:'office-phase8-botch-attribution-v1',
 structures:Object.fromEntries(Object.entries(report.structures).map(([id,x])=>[id,{
  overall:{botches:x.botches,controlBotches:x.controlBotches,
   namedHitPct:x.namedHitPct,controlNamedHitPct:x.controlNamedHitPct},
  byPlan:x.byPlan,byStyle:x.byStyle,byLength:x.byLength}]))
}));
for(const [id,x] of Object.entries(report.structures))
 console.log('PHASE7 '+id+' '+x.bouts+' active; earned '+x.earnedPct+'%; all four '+x.perfectPct+
 '%; distinct sequences '+x.uniqueSequences+'; top sequence '+x.commonSequenceShare+
 '%; mean stars '+x.meanStars+' vs '+x.controlStars);
