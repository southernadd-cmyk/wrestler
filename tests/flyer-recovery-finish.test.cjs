'use strict';
// Phase 7 balance: skill-aware recovery is a real action; aerial finishes
// still require the actual top-rope setup and committed move legals.
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
  {window:root,console,Math,Date,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
function fixture(plan='spots',level='elite'){
 const m=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',
  plan,slot:'main',seed:111477,finish:'win_clean'}));
 m.stage='live';m.len=1080;m.t=720;m.wSt=35;m.fSt=70;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 const skill=level==='elite'?{ring:92,safe:91}:level==='competent'?
  {ring:73,safe:68}:{ring:50,safe:45};
 m.w={...m.w,...skill};
 G.get(m).arc='escalation';
 return m;
}
const weight=(m,id)=>G.pool(m).find(x=>x[0]===id)?.[1]||0;
const gain=m=>{
 const before=m.wSt;
 G.apply(m,'catch_breath');
 const actual=m.graph.events.at(-1);
 assert.equal(actual.id,'catch_breath','recovery must be a visible action');
 assert.equal(actual.preControl,'w','the recovering wrestler executes it');
 assert.ok(actual.exertion<0,'visible rest cost records the returned energy');
 assert.ok(Math.abs((m.wSt-before)+actual.exertion)<1e-8,
  'no hidden stamina refill (floating point tolerance)');
 return m.wSt-before;
};
const novice=fixture('spots','novice'),competent=fixture('spots','competent'),
 elite=fixture('spots','elite'),otherPlan=fixture('story','elite');
const n=gain(novice),c=gain(competent),e=gain(elite),story=gain(otherPlan);
assert.ok(n>5&&n<6,'novices receive standard rest benefit, not skilled bonus');
assert.ok(c>n&&e>c,'actual recovery scales with training and safety');
assert.ok(e<12,'recovery has a bounded physically plausible ceiling');
assert.equal(story,n,'all other plans preserve the legacy authored breath gain');
assert.equal(M._earnedPlanQuality(elite),0,
 'catching a breath must never earn aerial quality or free stars');
// A real pre-finish runway is essential: waiting until the last 180s
// left the elite cohort at only ~29 stamina, unable to finish aerial moves.
const runway=fixture('spots','elite'),earlierRun=fixture('spots','elite');
runway.t=runway.len-320;earlierRun.t=earlierRun.len-510;
runway.wSt=50;earlierRun.wSt=50;
assert.ok(weight(runway,'catch_breath')>weight(earlierRun,'catch_breath'),
 'elite flyers must visibly pace themselves before the final three minutes');
// A worker already working a grounded opponent can earn a visible rest
// through a valid hold instead of waiting to return to a standing position.
const matFixture=level=>{
 const m=fixture('spots',level);
 m.t=m.len-320;m.wSt=40;m.story.position='mat';m.story.down='f';
 return m;
};
const matElite=matFixture('elite'),matNovice=matFixture('novice');
const restId=G.CATALOG.members.rest.find(id=>
 G.A[id]?.requires==='mat'&&!G.A[id].reverse&&!G.A[id].counterOf&&
 !G.A[id].blockOf&&G.isValid(matElite,id));
assert.ok(restId,'the live graph offers a physically legal narrated rest hold');
assert.ok(weight(matElite,restId)>0,
 'a trained mat controller can select an actual restorative hold before the finish');
const matEliteBefore=matElite.wSt,matNoviceBefore=matNovice.wSt;
G.apply(matElite,restId);G.apply(matNovice,restId);
assert.ok(matElite.wSt-matEliteBefore>5,
 'only a completed trained-flyer mat hold earns the bounded recovery benefit');
assert.ok(matNovice.wSt-matNoviceBefore<1,
 'novices keep the original rest hold cost and do not gain the elite benefit');
assert.equal(matElite.graph.events.at(-1).id,restId,
 'rest recovery must appear as an actual visible graph event');
assert.equal(M._earnedPlanQuality(matElite),0,
 'resting on the mat cannot grant any aerial execution quality');
matElite.wSt=40;
assert.ok(weight(matElite,restId)<weight(matFixture('elite'),restId),
 'a just-completed hold may not monopolise consecutive recovery choices');
// A pacing window is EARNED by an actual narrated rest action; its expiry
// is stored in the graph for refresh/save determinism, not granted at spawn.
const paced=fixture('spots','elite');paced.t=paced.len-320;
assert.equal(G.get(paced).pacedRest,undefined,
 'a booked Spot-fest does not start with any pacing advantage');
G.apply(paced,'catch_breath');
assert.equal(paced.graph.pacedRest.w.until,paced.t+180,
 'a real, trained recovery beat activates only a bounded 180-second window');
assert.equal(paced.graph.events.at(-1).pacedRecoveryUntil,paced.t+180,
 'the pacing window is recorded on the same visible recovery event');
assert.ok(paced.log.some(x=>x.text.includes('deliberately slows')),
 'commentary makes trained pacing readable to the player');
const initialPacingUntil=paced.graph.pacedRest.w.until;
paced.t+=40;G.apply(paced,'catch_breath');
assert.equal(paced.graph.pacedRest.w.until,initialPacingUntil,
 'repeating a rest immediately cannot indefinitely extend the pacing window');
assert.equal(JSON.parse(JSON.stringify(paced.graph)).pacedRest.w.until,
 initialPacingUntil,'saved graph state retains the exact pacing expiry');
const novicePace=fixture('spots','novice');novicePace.t=novicePace.len-320;
G.apply(novicePace,'catch_breath');
assert.equal(novicePace.graph.pacedRest,undefined,
 'untrained flyers never receive a long-bout pacing window');
const tooLate=fixture('spots','elite');tooLate.t=tooLate.len-120;
G.apply(tooLate,'catch_breath');
assert.equal(tooLate.graph.pacedRest,undefined,
 'a breath during the final three minutes does not award retroactive pacing');
const restShares=fixture('spots','elite');restShares.t=restShares.len-320;
restShares.wSt=50;
const legalShares=G.pool(restShares);
const restWeight=legalShares.find(([id])=>id==='catch_breath')?.[1]||0;
const otherWeights=legalShares.reduce((n,[id,w])=>n+(id==='catch_breath'?0:w),0);
assert.ok(restWeight>=otherWeights*.72-1e-7,
 'pre-finish recovery competes meaningfully with the full expanded move pool');
assert.ok(otherWeights>0,'the flyer still has real non-recovery choices');
const beforePool=fixture('spots','elite'),beforeWeight=weight(beforePool,'catch_breath');
assert.ok(beforeWeight>0,'a tired flyer can select actual recovery');
const after=fixture('spots','elite');
G.apply(after,'catch_breath');after.wSt=35;
assert.ok(weight(after,'catch_breath')<beforeWeight,
 'cooldown should discourage immediate repeated resting even at equal stamina');
const finish=fixture('spots','elite'),early=fixture('spots','elite');
finish.t=finish.len-120;early.t=early.len-250;
finish.wSt=38;early.wSt=38;
const lateClimb=weight(finish,'top_climb'),
 earlyClimb=weight(early,'top_climb');
assert.ok(lateClimb>earlyClimb,
 'eligible trained flyers have a stronger actual climb in the final three minutes');
const aerial=G.CATALOG.members.aerial.find(id=>G.A[id]?.risk&&G.A[id]?.requires==='top');
assert.ok(aerial,'live graph must contain a named legal top-rope payoff');
assert.equal(G.isValid(finish,aerial),false,
 'a flyer cannot execute a named top-rope aerial from the canvas');
assert.ok(lateClimb>0,'finish setup exists when actual stamina is sufficient');
G.apply(finish,'top_climb');
assert.equal(finish.story.position,'top','real setup changes the physical location');
assert.ok(G.pool(finish).some(([id])=>G.A[id]?.family==='aerial'&&
 !G.A[id].reverse&&!G.A[id].counterOf&&!G.A[id].blockOf),
 'a completed legal climb offers real named aerial attacks');
// The extra late push exists only until this worker earns a genuinely
// risky, successful *named* landing. An opponent landing or a failed attempt
// must not satisfy the flyer's missing-payoff condition.
const lateRisk=G.CATALOG.members.aerial.find(id=>G.A[id]?.risk&&
 !G.A[id].reverse&&!G.A[id].counterOf&&!G.A[id].blockOf);
assert.ok(lateRisk,'authored catalog has at least one named risky aerial');
const nearBell=()=>{const m=fixture('spots','elite');m.t=m.len-120;m.wSt=48;return m;};
const freshLate=nearBell(),stillNeeded=weight(freshLate,'top_climb');
const caseWith=(side,resolution)=>{
 const m=nearBell();
 G.get(m).events.push({id:lateRisk,t:m.len-130,preControl:side,
  control:side,aerialResolution:resolution});
 return m;
};
const completed=caseWith('w','landed');
assert.ok(stillNeeded>weight(completed,'top_climb'),
 'late aerial setup priority eases after this flyer actually lands a named risk');
assert.equal(weight(caseWith('w','counter'),'top_climb'),stillNeeded,
 'a reversed or failed aerial cannot satisfy the late landing condition');
assert.equal(weight(caseWith('f','landed'),'top_climb'),stillNeeded,
 'the opponent performing a high spot does not fulfil the worker aerial plan');
const secondRisk=G.CATALOG.members.aerial.find(id=>id!==lateRisk&&
 G.A[id]?.risk&&!G.A[id].reverse&&!G.A[id].counterOf&&!G.A[id].blockOf);
assert.ok(secondRisk,'two different named risky aerial moves exist');
const doubleRisk=caseWith('w','landed');
G.get(doubleRisk).events.push({id:secondRisk,t:doubleRisk.len-100,
 preControl:'w',control:'w',aerialResolution:'landed'});
const repeatRisk=caseWith('w','landed');
G.get(repeatRisk).events.push({id:lateRisk,t:repeatRisk.len-100,
 preControl:'w',control:'w',aerialResolution:'landed'});
assert.ok(weight(completed,'top_climb')>weight(doubleRisk,'top_climb'),
 'one landed risk still leaves reduced incentive for a SECOND distinct aerial');
assert.equal(weight(repeatRisk,'top_climb'),weight(completed,'top_climb'),
 'repeating the same risky move cannot satisfy a two-distinct-move target');

// The flyer can reclaim the finish only through a legal opponent-control
// reversal, then a distinct standing reset, then a physical rope setup.
const contested=fixture('spots','elite');
contested.t=contested.len-120;contested.wSt=42;contested.fSt=65;
contested.story.control='f';contested.story.position='mat';contested.story.down='w';
const contestedGraph=G.get(contested);
contestedGraph.events.push({id:'mat_hold',t:contested.t-10,
 preControl:'f',control:'f',position:'mat',down:'w',arc:'escalation'});
contestedGraph.node='mat_hold';
const matPool=G.pool(contested);
const scrambleWeight=matPool.find(([id])=>id==='mat_scramble')?.[1]||0;
const remaining=matPool.reduce((n,[id,w])=>n+(id==='mat_scramble'?0:w),0);
assert.ok(scrambleWeight>=remaining*.52-1e-7,
 'grounded elite flyer gets a meaningful but non-forced legal reversal');
assert.equal(contested.story.control,'f',
 'building the candidate pool must not grant an invisible control switch');
assert.equal(G.isValid(contested,'top_climb'),false,
 'top climbing must be physically illegal while grounded');
assert.equal(G.isValid(contested,'springboard_rise'),false,
 'springboard setup must also require a genuine standing position');
assert.equal(matPool.some(([id])=>id==='top_climb'),false,
 'no top-rope setup can be selected while the flyer remains grounded');
G.apply(contested,'mat_scramble');
assert.equal(contested.story.control,'w','authored mat counter wins actual control');
assert.equal(contested.story.position,'mat','a mat reversal does not teleport the worker to the ropes');
assert.equal(contested.story.down,'f','the opponent ends grounded after the counter');
const standPool=G.pool(contested);
const standWeight=standPool.find(([id])=>id==='stand_reset')?.[1]||0;
const remainStanding=standPool.reduce((n,[id,w])=>n+(id==='stand_reset'?0:w),0);
assert.ok(standWeight>=remainStanding*.65-1e-7,
 'the controlling grounded flyer has a credible narrated standing route');
G.apply(contested,'stand_reset');
assert.equal(contested.story.position,'standing','actual action regains a standing position');
assert.equal(contested.story.control,'w','the standing route keeps earned control');
const climbPool=G.pool(contested);
const topShare=climbPool.filter(([id])=>id==='top_climb'||id==='springboard_rise')
 .reduce((n,[,w])=>n+w,0);
const otherShare=climbPool.filter(([id])=>id!=='top_climb'&&id!=='springboard_rise')
 .reduce((n,[,w])=>n+w,0);
assert.ok(topShare>=otherShare*.45-1e-7,
 'a still-fit elite worker now has a competitive but not guaranteed rope setup');
assert.ok(otherShare>0,'ordinary counters and exchanges remain possible');
G.apply(contested,'top_climb');
assert.equal(contested.story.position,'top','an actual climb is required before an aerial payoff');
assert.ok(G.pool(contested).some(([id])=>G.A[id]?.family==='aerial'&&
 !G.A[id].counterOf&&!G.A[id].blockOf&&!G.A[id].reverse),
 'after a physical climb, the named aerial still requires its separate legal selection');
// A standing counter is also earned by the opponent's immediately
// preceding actual strike. It never flips control merely by being offered.
const standingPressure=fixture('spots','elite');
standingPressure.t=standingPressure.len-120;
standingPressure.wSt=43;standingPressure.fSt=65;
standingPressure.story.control='f';
standingPressure.story.position='standing';
const pressureGraph=G.get(standingPressure);
pressureGraph.node='strike_trade';
pressureGraph.events.push({id:'strike_trade',t:standingPressure.t-10,
 preControl:'f',control:'f',position:'standing'});
const pressurePool=G.pool(standingPressure);
const counterShare=pressurePool.find(([id])=>id==='counter_strike')?.[1]||0;
const counterOthers=pressurePool.reduce((n,[id,w])=>
 n+(id==='counter_strike'?0:w),0);
assert.ok(counterShare>=counterOthers*.90-1e-7,
 'real opponent strikes give a prepared flyer a competitive legal counter');
assert.equal(standingPressure.story.control,'f',
 'the pool cannot automatically steal control from the striker');
G.apply(standingPressure,'counter_strike');
assert.equal(standingPressure.story.control,'w',
 'only the performed and narrated counter wins control');
const oldPressure=fixture('spots','elite');
oldPressure.t=oldPressure.len-120;oldPressure.wSt=43;oldPressure.fSt=65;
oldPressure.story.control='f';oldPressure.story.position='standing';
const oldGraph=G.get(oldPressure);oldGraph.node='strike_trade';
oldGraph.events.push({id:'strike_trade',t:oldPressure.t-70,
 preControl:'f',control:'f',position:'standing'});
const oldPool=G.pool(oldPressure);
const oldShare=oldPool.find(([id])=>id==='counter_strike')?.[1]||0;
assert.ok(oldShare<counterShare,
 'a long-past strike cannot generate an unearned immediate counter');
// Opponent control cannot be flipped without a real grounded preceding exchange.
const noEvidence=fixture('spots','elite');
noEvidence.t=noEvidence.len-120;noEvidence.wSt=42;noEvidence.fSt=65;
noEvidence.story.control='f';noEvidence.story.position='mat';noEvidence.story.down='w';
const unsupported=G.pool(noEvidence),supportWeight=unsupported.find(([id])=>id==='mat_scramble')?.[1]||0;
assert.ok(supportWeight<scrambleWeight,
 'a mat counter gets no special comeback weight without recent physical evidence');
// An elite worker who is being held down four minutes BEFORE the final
// three can earn the way back into the match, allowing normal visible
// recovery before the top-rope run. Never grant an unearned control flip.
const beforeFinish=fixture('spots','elite');
beforeFinish.t=beforeFinish.len-300;beforeFinish.wSt=35;
beforeFinish.story.control='f';beforeFinish.story.position='mat';
beforeFinish.story.down='w';
const beforeGraph=G.get(beforeFinish);
beforeGraph.node='mat_hold';
beforeGraph.events.push({id:'mat_hold',t:beforeFinish.t-10,
 preControl:'f',control:'f',position:'mat',down:'w'});
const prePool=G.pool(beforeFinish);
const preScramble=prePool.find(([id])=>id==='mat_scramble')?.[1]||0;
const preAlternatives=prePool.reduce((sum,[id,w])=>
 sum+(id==='mat_scramble'?0:w),0);
assert.ok(preScramble>=preAlternatives*.58-1e-7,
 'only the documented active opponent hold qualifies for a pre-finish escape');
assert.equal(beforeFinish.story.control,'f',
 'candidate weighting alone never steals opponent control');
G.apply(beforeFinish,'mat_scramble');
assert.equal(beforeFinish.story.control,'w',
 'a real pre-finish scramble must be performed to win control');
// A true elite flyer can start this control recovery before the three
// minutes begin; the authorial aerial phase still starts later.
const preRun=fixture('spots','elite');
preRun.t=preRun.len-240;preRun.wSt=40;preRun.fSt=65;
preRun.story.control='f';preRun.story.position='mat';preRun.story.down='w';
const preRunGraph=G.get(preRun);
preRunGraph.node='mat_hold';
preRunGraph.events.push({id:'mat_hold',t:preRun.t-10,preControl:'f',
 control:'f',position:'mat',down:'w'});
const preRunPool=G.pool(preRun);
const preScrambleWeight=preRunPool.find(([id])=>id==='mat_scramble')?.[1]||0;
const preOtherWeight=preRunPool.reduce((sum,[id,w])=>
 sum+(id==='mat_scramble'?0:w),0);
assert.ok(preScrambleWeight>=preOtherWeight*.95-1e-7,
 'an elite flyer can earn a mat comeback before the final three-minute window');
assert.equal(preRun.story.control,'f',
 'the early comeback weighting must not silently flip controller');
// Narrative arc changes may not erase a real, legally prepared high spot
// between the climb and the flyer's ONE following attack choice.
const protectedLaunch=fixture('spots','elite');
protectedLaunch.t=protectedLaunch.len-60;protectedLaunch.wSt=44;
const launchGraph=G.get(protectedLaunch);
launchGraph.started=true;launchGraph.arc='escalation';
launchGraph.age=G.ARCS.escalation.max;
G.apply(protectedLaunch,'top_climb');
assert.equal(protectedLaunch.story.position,'top');
protectedLaunch.t+=10; // >93% normally forces a finish_setup arc reset
const launchPhase=G.advance(protectedLaunch,protectedLaunch.t/protectedLaunch.len);
assert.equal(launchPhase.id,'stretch','the timed finishing phase still advances');
assert.equal(protectedLaunch.story.position,'top',
 'a narrative phase change cannot silently erase a legal next-tick aerial setup');
assert.equal(launchGraph.node,'top_climb',
 'the athlete keeps the real named setup, not an invented landing');
assert.equal(G.readyNamedAerial(protectedLaunch),true,
 'a real late top-rope setup deserves an immediate normal action selection');
assert.equal(launchGraph.pendingAerial,null,
 'the action opportunity must not secretly commit a move');
const readyParents=G.pool(protectedLaunch).filter(([id])=>
 G.A[id]?.family==='aerial'&&G.A[id]?.risk&&
 !G.A[id].reverse&&!G.A[id].counterOf&&!G.A[id].blockOf);
assert.ok(readyParents.length>0,
 'the preserved physical rope position must expose a real legal named aerial');
const prepared=G.pool(protectedLaunch);
const validRisk=prepared.reduce((sum,[id,weight])=>
 sum+(G.A[id]?.family==='aerial'&&G.A[id]?.risk&&
 !G.A[id].counterOf&&!G.A[id].blockOf&&!G.A[id].reverse?weight:0),0);
const alternatives=prepared.reduce((sum,[id,weight])=>
 sum+(G.A[id]?.family==='aerial'&&G.A[id]?.risk&&
 !G.A[id].counterOf&&!G.A[id].blockOf&&!G.A[id].reverse?0:weight),0);
assert.ok(alternatives>0,'the fighter can still choose a non-risky alternative');
assert.ok(validRisk>=alternatives*3-1e-7,
 'fully prepared elite flyers favor an already-legal named risky aerial');
assert.ok(!G.A.ar_fist.risk,
 'the low-risk flying fist drop is correctly excluded from risky-move targets');
assert.equal(launchGraph.pendingAerial,null,'an arc hold must not start an aerial automatically');
assert.equal(G.startAerial(protectedLaunch,readyParents[0][0]),true,
 'only a separate committed named attempt starts the actual attack');
assert.equal(launchGraph.pendingAerial.id,readyParents[0][0]);
assert.equal(G.readyNamedAerial(protectedLaunch),false,
 'a committed aerial cannot be selected or launched twice');
assert.equal(launchGraph.aerialAttempts.at(-1).outcome,'pending',
 'a prepared attack is not credited as landed before its counter/botch resolution');
// Late scheduled phase changes can overtake a still-valid comeback arc.
// The flyer must not lose a genuine climb because the *story* transitions
// from "resurgence" to "stretch" before the next graph choice.
const crossArcLaunch=fixture('spots','elite');
crossArcLaunch.t=crossArcLaunch.len-60;crossArcLaunch.wSt=44;
const crossArcGraph=G.get(crossArcLaunch);
crossArcGraph.started=true;crossArcGraph.arc='resurgence';
crossArcGraph.age=G.ARCS.resurgence.max;
G.apply(crossArcLaunch,'top_climb');
assert.equal(crossArcLaunch.story.position,'top');
crossArcLaunch.t+=10;
assert.equal(G.ARCS.resurgence.phase,'comeback');
G.advance(crossArcLaunch,crossArcLaunch.t/crossArcLaunch.len);
assert.equal(crossArcLaunch.story.position,'top',
 'switching from comeback to stretch cannot cancel an earned viable top climb');
assert.equal(crossArcGraph.node,'top_climb');
assert.equal(G.readyNamedAerial(crossArcLaunch),true,
 'the prepared legal aerial retains its one follow-through opportunity');
assert.equal(crossArcGraph.pendingAerial,null,
 'preserving a setup across arcs does not force a launch or a landing');
const noviceLaunch=fixture('spots','novice');
noviceLaunch.t=noviceLaunch.len-60;noviceLaunch.wSt=44;
G.apply(noviceLaunch,'top_climb');
noviceLaunch.t+=10;
assert.equal(G.readyNamedAerial(noviceLaunch),false,
 'novices do not gain an elite-only early aerial-selection window');
// A legal climb is not automatically an affordable named risky *landing*.
// The lookahead is read-only and must not spend real stamina or move either
// wrestler merely to test the future position.
const tooTiredForFlight=fixture('spots','elite');
tooTiredForFlight.t=tooTiredForFlight.len-120;
tooTiredForFlight.wSt=26;
const untouched=JSON.stringify({
 t:tooTiredForFlight.t,st:tooTiredForFlight.wSt,
 story:tooTiredForFlight.story,physical:G.get(tooTiredForFlight).physical
});
assert.ok(G.isValid(tooTiredForFlight,'top_climb'),
 'legacy climb guard alone allows an unaffordable follow-through');
const noFlightPool=G.pool(tooTiredForFlight);
assert.equal(noFlightPool.some(([id])=>
 id==='top_climb'||id==='springboard_rise'),false,
 'do not choose a climb that cannot lead to any legal named risky aerial');
assert.equal(JSON.stringify({
 t:tooTiredForFlight.t,st:tooTiredForFlight.wSt,
 story:tooTiredForFlight.story,physical:G.get(tooTiredForFlight).physical
}),untouched,'physical and stamina lookahead leaves live state intact');
const restChoice=noFlightPool.find(([id])=>id==='catch_breath')?.[1]||0;
const othersNoFlight=noFlightPool.reduce((sum,[id,w])=>
 sum+(id==='catch_breath'?0:w),0);
assert.ok(restChoice>=othersNoFlight*.95-1e-7,
 'a tired worker should visibly recover rather than waste an impossible climb');
G.apply(tooTiredForFlight,'catch_breath');
assert.ok(tooTiredForFlight.wSt>35,
 'an actual recovery action restores enough stamina for a new setup choice');
assert.ok(G.pool(tooTiredForFlight).some(([id])=>
 id==='top_climb'||id==='springboard_rise'),
 'after that physical rest the named landing runway becomes plausible');
const spent=fixture('spots','elite');
spent.t=spent.len-120;spent.wSt=18;
assert.equal(G.isValid(spent,aerial),false,
 'a spent wrestler cannot simply skip the stamina gate in the finishing stretch');
assert.equal(G.validate().errors.length,0);
// Independent larger seeded finishing sample, in addition to the exact
// physical and authored-parent unit guards above. Keep a conservative
// regression FLOOR here; the 80-85% production goal is monitored
// separately because individual cohorts fluctuate with real counters.
const finalAudit=require('../tools/graph-lab/flyer-finish-trace.cjs').capture(24);
console.log('Eight lowest-risk elite finishing samples:',
 JSON.stringify(finalAudit.samples.map(x=>({
  opponent:x.opponent,seed:x.seed,
  staminaAt180:x.stAt180,lateControlTicks:x.control,
  setups:x.setup?.map(a=>a.id),
  riskyLandings:x.landedRisk?.map(a=>a.id),
  attemptedAerials:x.aerialAttempts?.map(a=>a.outcome)
 }))));
console.log('Elite 96-bout finishing distribution:',JSON.stringify({
 bouts:finalAudit.bouts,
 distinctRisk:finalAudit.avg.distinctWorkerRisk,
 anyRiskPercent:Math.round(finalAudit.avg.atLeastOneRisk*100),
 twoRiskPercent:Math.round(finalAudit.avg.twoDistinctRisks*100),
 namedLandings:finalAudit.avg.lateWorkerNamedAerials,
 aerialLandings:finalAudit.avg.lateAerialLandings,
 averageStaminaAtBell:finalAudit.avg.stAtBell,
 averageStaminaAtLast3:finalAudit.avg.stAt180,
 noNamedRiskBouts:finalAudit.avg.zeroNamedRisk
}));
assert.equal(finalAudit.bouts,96,'four opponents with 24 independent seeds each');
assert.ok(finalAudit.avg.distinctWorkerRisk>=1.05,
 'elite finish must retain substantially more than one named risky landing on average');
assert.ok(finalAudit.avg.atLeastOneRisk>=.70,
 'elite finish must not revert to old no-aerial endings');
assert.ok(finalAudit.avg.twoDistinctRisks<.80,
 'elite flyers must not be guaranteed two different successful aerials');
console.log('Elite 18-minute Spot-fest / 96-bout seed cohort:',JSON.stringify({
 distinctRisk:finalAudit.avg.distinctWorkerRisk,
 anyRiskPercent:Math.round(finalAudit.avg.atLeastOneRisk*100),
 twoRiskPercent:Math.round(finalAudit.avg.twoDistinctRisks*100),
 namedLandings:finalAudit.avg.lateWorkerNamedAerials,
 aerialLandings:finalAudit.avg.lateAerialLandings
}));
console.log('PASS Phase 7: genuine skill-scaled recovery, cooldown, no free stars, stronger late legal aerial setups, no stamina/physical gate bypass.');
