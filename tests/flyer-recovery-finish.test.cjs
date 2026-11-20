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
const spent=fixture('spots','elite');
spent.t=spent.len-120;spent.wSt=18;
assert.equal(G.isValid(spent,aerial),false,
 'a spent wrestler cannot simply skip the stamina gate in the finishing stretch');
assert.equal(G.validate().errors.length,0);
console.log('PASS Phase 7: genuine skill-scaled recovery, cooldown, no free stars, stronger late legal aerial setups, no stamina/physical gate bypass.');
