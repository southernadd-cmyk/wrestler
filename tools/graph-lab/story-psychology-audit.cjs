#!/usr/bin/env node
'use strict';
// Read-only audit: a narrated storyline arc is not a performed wrestling action.
const fs=require('node:fs'),lab=require('./core.js'),review=require('./match-review.cjs');
const PLANS=['story','technical','safe'],MINUTES=[12,18],OPP=['ace','silas','red','rev'];
const TIERS=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const HEAT=new Set(['cutoff','control','limb_work','floor_heat','denial']);
const HOPE=new Set(['hope','second_hope']);
const DENIAL=new Set(['denial','cutoff','control','limb_work']);
const COMEBACK=new Set(['comeback','resurgence','exchange','fighting_spirit']);
const FINISH=new Set(['false_finish','escalation','nearfall','finish_setup','submission_battle']);
const sum=a=>a.reduce((n,v)=>n+v,0);
const avg=(n,d)=>d?+(n/d).toFixed(2):0,pct=(n,d)=>d?+(100*n/d).toFixed(1):0;
const add=(o,k,n=1)=>o[k]=(o[k]||0)+n;
const isLanded=(e,A)=>!!A[e.id]&&!A[e.id].reverse&&!A[e.id].counterOf&&!A[e.id].blockOf&&
 ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
  .every(key=>!e[key]||e[key]==='landed');
function one(m,M){
 const A=M.GRAPH.A,g=m.graph,raw=g.events||[];
 const performed=raw.filter(e=>['w','f'].includes(e.preControl)&&isLanded(e,A));
 const byArc=(arcs,side)=>performed.filter(e=>e.preControl===side&&arcs.has(e.arc));
 const fHeat=byArc(HEAT,'f'),wHope=byArc(HOPE,'w');
 const fDenied=byArc(DENIAL,'f'),wComeback=byArc(COMEBACK,'w');
 const firstAfter=(a,t)=>a.find(e=>e.t>t);
 let completed=false,withDenial=false,chainExample=null;
 for(const h of fHeat){
  const hope=firstAfter(wHope,h.t);if(!hope)continue;
  const deny=firstAfter(fDenied,hope.t);
  const comeback=firstAfter(wComeback,hope.t);
  if(comeback){completed=true;if(!chainExample)chainExample=[h.id,hope.id,comeback.id];}
  if(deny&&comeback&&deny.t<comeback.t)withDenial=true;
  if(withDenial)break;
 }
 const covered=new Set(raw.map(e=>e.arc).filter(Boolean));
 const visited=new Set(g.history||[]);
 const scheduled=raw.filter(e=>e.id==='scheduled_nearfall');
 const earned=raw.filter(e=>A[e.id]&&
  (A[e.id].nearfall||['near_kickout','counter_rollup'].includes(e.id))&&
  isLanded(e,A));
 const hasLeadIn=e=>performed.some(p=>p.t<=e.t&&e.t-p.t<=30&&
  p.preControl===e.control&&
  (A[p.id].family||A[p.id].crowd>0)&&
  !['rest','heel'].includes(A[p.id].family)&&
  !['catch_breath','clean_break','finish_tease','crowd_pose'].includes(p.id));
 const noLead=scheduled.filter(e=>!hasLeadIn(e));
 const finalSetup=performed.filter(e=>e.t>=m.len-180&&FINISH.has(e.arc));
 const lastMove=performed.at(-1);
 const lateNear=scheduled.filter(e=>e.t>=m.len-180);
 const beforeEarly=scheduled.filter(e=>e.t/m.len<.59);
 const phaseTick=m.flow||[];
 const change=phaseTick.filter((v,i)=>i>0&&
  ((v[2]>=20&&phaseTick[i-1][2]<=-20)||(v[2]<=-20&&phaseTick[i-1][2]>=20))).length;
 const star=m.final?.stars||0;
 const worked=performed.filter(e=>A[e.id]?.focus&&A[e.id]?.part);
 const distinctLast=new Set(finalSetup.map(e=>e.id));
 const loser=lastMove?.preControl;
 const outcome=g.outcome||{};
 const winner=outcome.winner;
 const values={
  stars:star,stamina:m.wSt,peakCrowd:m.crowdPeak||0,
  arcsVisited:visited.size,arcsPerformed:covered.size,
  actualPressure:fHeat.length,actualHope:wHope.length,
  actualDenial:fDenied.length,actualComeback:wComeback.length,
  arcHopeVisited:[...visited].some(x=>HOPE.has(x)),
  arcDenialVisited:[...visited].some(x=>x==='denial'),
  arcComebackVisited:[...visited].some(x=>x==='comeback'||x==='resurgence'),
  actualFullStory:completed,actualDeniedStory:withDenial,
  scheduledNearfalls:scheduled.length,earnedNearfallEvents:earned.length,
  noActionLeadNearfall:noLead.length,earlyScheduledNearfall:beforeEarly.length,
  lateScheduledNearfall:lateNear.length,
  last180DistinctFinishOffence:distinctLast.size,
  final180ActualFinisherSetups:finalSetup.length,
  final60PerformedOffence:performed.filter(e=>e.t>=m.len-60).length,
  lateFinisherTease:raw.filter(e=>e.id==='finish_tease'&&e.t>=m.len-180).length,
  preFinishActionGap:lastMove?Math.max(0,m.len-lastMove.t):m.len,
  winnerLastOffence:lastMove&&['w','f'].includes(winner)?loser===winner:null,
  focusLanded:worked.length,
  controlChanges:g.transitions||0,
  organicSideChanges:performed.filter((e,i)=>i>0&&e.preControl!==performed[i-1].preControl).length,
  momentumPolarFlips:change,
  nearfallCount:m.nearfalls||0,
  ending:outcome.id||m.outcome||'(unknown)',
  finishRoute:m.final?.finishRoute||'(none)',
  storySequence:chainExample, lastActions:raw.slice(-6).map(e=>e.id),
  examples:scheduled.slice(0,3).map(e=>({t:e.t,arc:e.arc,leadIn:hasLeadIn(e)})),
  eventStats:{actions:performed.length,rawEvents:raw.length},
  invalidOutcome:!(raw.some(e=>e.id==='outcome_'+(outcome.id||''))) ||
   !(m.final&&m.done)
 };
 return values;
}
function capture(seeds=12){
 if(!Number.isInteger(seeds)||seeds<1||seeds>24)throw Error('Seed count must be 1..24');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,people=lab.roster(D);
 const sol=people.find(x=>x.id==='sol');
 if(sol?.style!=='Story')throw Error('Story-trained test worker not found');
 const rows=[],failures=[];
 for(const [tier,ring,safe,psych] of TIERS)for(const minutes of MINUTES)
  for(const plan of PLANS){
   const records=[];
   for(let oi=0;oi<OPP.length;oi++)for(let i=0;i<seeds;i++){
    const opt=lab.makeOptions(D,{wid:'sol',rid:OPP[oi],plan,minutes,
     slot:'main',seed:937121+oi*7817+minutes*9179+i*199,
     finish:i%2?'lose_clean':'win_clean',
     promotion:D.PROMOS[(oi+minutes+i)%D.PROMOS.length].id});
    opt.minutes=minutes;opt.feudHeat=i%2?50:0;
    opt.w={...opt.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
    const m=lab.runMatch(root,opt),v=one(m,M);
    if(v.invalidOutcome)failures.push('outcome not backed by event '+tier+'/'+minutes+'/'+plan+'/'+m.o.seed);
    records.push(v);
   }
   const n=records.length;
   const s=k=>sum(records.map(v=>v[k]===true?1:v[k]===false?0:v[k]||0));
   const c=k=>pct(s(k),n),m=k=>avg(s(k),n);
   const endings={},finishRoutes={};for(const v of records){
    add(endings,v.ending);add(finishRoutes,v.finishRoute);
   }
   const winning=records.filter(v=>v.winnerLastOffence!==null);
   rows.push({
    tier,minutes,plan,bouts:n,stars:m('stars'),bellStamina:m('stamina'),
    crowdPeak:m('peakCrowd'),arcsVisited:m('arcsVisited'),
    arcsWithActions:m('arcsPerformed'),
    narratedHopeArcPct:c('arcHopeVisited'),actualHopePct:c('actualHope'),
    narratedDenialArcPct:c('arcDenialVisited'),
    narratedComebackArcPct:c('arcComebackVisited'),
    performedHopePerBout:m('actualHope'),
    performedDenialPerBout:m('actualDenial'),
    performedComebackPerBout:m('actualComeback'),
    performedPressurePerBout:m('actualPressure'),
    actualHeatHopeComebackPct:c('actualFullStory'),
    actualHeatHopeDenialComebackPct:c('actualDeniedStory'),
    scheduledNearfallsPerBout:m('scheduledNearfalls'),
    earnedNearfallEventsPerBout:m('earnedNearfallEvents'),
    scheduledNoLeadInPct:pct(s('noActionLeadNearfall'),s('scheduledNearfalls')),
    scheduledNearfallsWithoutLead:s('noActionLeadNearfall'),
    scheduledNearfallsTotal:s('scheduledNearfalls'),
    earlyScheduledNearfall:s('earlyScheduledNearfall'),
    lateScheduledNearfallsPerBout:m('lateScheduledNearfall'),
    distinctLateFinishOffence:m('last180DistinctFinishOffence'),
    lateFinisherSetupsPerBout:m('final180ActualFinisherSetups'),
    last60ActualOffence:m('final60PerformedOffence'),
    finalOffenceGapSeconds:m('preFinishActionGap'),
    winnerOwnedLastActionPct:pct(winning.filter(x=>x.winnerLastOffence).length,winning.length),
    targetingPerBout:m('focusLanded'),
    controlChanges:m('organicSideChanges'),
    graphArcTransitions:m('controlChanges'),
    momentumPolarFlipsPerBout:m('momentumPolarFlips'),
    nearfallsPerBout:m('nearfallCount'),
    endingTypes:endings,finishRoutes,
    samples:records.slice(0,3).map((v,i)=>({
     seedIndex:i,storySequence:v.storySequence,
     lateEvents:v.lastActions,nearfallExamples:v.examples
    }))
   });
  }
 return {schema:'office-story-psychology-audit-v1',
  seeds,totalBouts:rows.length*OPP.length*seeds,
  method:'Real OfficeMatch results, matched Story-style Sol Cruz worker across Story/Technical/Safe plans, 12/18 minutes, four opponents, novice/competent/elite ring/psych/safety, with the same seed, finish, promoter and feud treatment per plan. Heat→hope→comeback and denial require genuinely landed actor-owned graph events in the stated arc, not merely an arc transition. Scheduled near falls are *presentation* and are not counted as mechanically earned contact/cover. The near-fall lead-in is a conservative 30s same-control action proxy, not proof of actual pin legality. Finish route is booked, not mechanically derived from the last move. Outcome event must exist for completion.',
  rows,errors:failures};
}
function markdown(result){
 const out=['## Story wrestling: psychology, momentum, near falls and actual finish setup','',
  result.totalBouts+' real paired matches. '+result.method,'',
  '| Tier | Min | Plan | ★ | Performed heat→hope→comeback | With actual denial | Hope arc narrated | Actual hope | Scheduled near falls/bout | Scheduled near fall lacks 30s offence | Late distinct finish offence | Last 60s actions |',
  '|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const v of result.rows)out.push('| '+v.tier+' | '+v.minutes+' | '+v.plan+
  ' | '+v.stars+' | '+v.actualHeatHopeComebackPct+'% | '+
  v.actualHeatHopeDenialComebackPct+'% | '+v.narratedHopeArcPct+
  '% | '+v.actualHopePct+'% | '+v.scheduledNearfallsPerBout+
  ' | '+v.scheduledNoLeadInPct+'% | '+v.distinctLateFinishOffence+
  ' | '+v.last60ActualOffence+' |');
 for(const tier of TIERS.map(x=>x[0])){
  const v=result.rows.find(x=>x.tier===tier&&x.minutes===18&&x.plan==='story');
  out.push('','### '+tier+' — native Story, 18 minutes',
   'Actually performed pressure '+v.performedPressurePerBout+
    ', hope '+v.performedHopePerBout+', denial '+v.performedDenialPerBout+
    ', comeback '+v.performedComebackPerBout+' actions per match.',
   'Graph arc transitions '+v.graphArcTransitionsPerBout+', owned-action control handoffs '+
    v.controlChanges+', bell stamina '+v.bellStamina+', crowd peak '+v.crowdPeak,
   'Scheduled near falls '+v.scheduledNearfallsTotal+
    ', no nearby landed offensive action '+v.scheduledNearfallsWithoutLead+
    '; mechanically earned graph nearfall events '+v.earnedNearfallEventsPerBout+' per bout.',
   'Near finish: actual offensive setups '+v.lateFinisherSetupsPerBout+
    ', average gap between last executed move and bell '+v.finalOffenceGapSeconds+'s.',
   'Outcomes: '+JSON.stringify(v.endingTypes)+
    '. Finish routes: '+JSON.stringify(v.finishRoutes),
   'Sample true sequences '+JSON.stringify(v.samples));
 }
 out.push('','**Outcome and completion integrity:** '+(result.errors.length?
  'FAILED '+result.errors.slice(0,8).join('; '):'PASS')+
  '. These are diagnostics, not predetermined quality targets.');
 return out.join('\n');
}
if(require.main===module)try{
 const r=capture(process.argv[2]?Number(process.argv[2]):12);
 if(process.argv.includes('--json-file'))
  fs.writeFileSync('story-psychology-audit.json',JSON.stringify(r,null,2)+'\n');
 console.log(markdown(r));if(r.errors.length)process.exitCode=1;
}catch(err){console.error(err.stack);process.exitCode=1;}
module.exports={capture,one,markdown};
