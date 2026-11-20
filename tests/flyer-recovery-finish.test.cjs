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
assert.ok(e<10,'recovery has a bounded physically plausible ceiling');
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
const spent=fixture('spots','elite');
spent.t=spent.len-120;spent.wSt=18;
assert.equal(G.isValid(spent,aerial),false,
 'a spent wrestler cannot simply skip the stamina gate in the finishing stretch');
assert.equal(G.validate().errors.length,0);
console.log('PASS Phase 7: genuine skill-scaled recovery, cooldown, no free stars, stronger late legal aerial setups, no stamina/physical gate bypass.');
