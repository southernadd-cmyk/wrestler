'use strict';
// Phase 6B: low-stamina Spot-fest wrestlers are offered a real breathing
// exchange, not silent energy or a fabricated star bonus.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-catalog.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
  {window:root,console,Math,Date,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
function prepared(plan,stamina){
 const m=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',plan,slot:'main',seed:852911}));
 m.stage='live';m.t=Math.floor(m.len*.65);m.wSt=stamina;m.fSt=65;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 return m;
}
const likelihood=(m)=>G.pool(m).find(([id])=>id==='catch_breath')?.[1]||0;
const lowSpots=prepared('spots',30),lowTechnical=prepared('technical',30);
const fitSpots=prepared('spots',70);
assert.ok(likelihood(lowSpots)>likelihood(lowTechnical),
 'an exhausted flyer has a stronger chance to recover visibly under Spot-fest');
assert.ok(likelihood(lowSpots)>likelihood(fitSpots),
 'fresh flyers must not stall simply because they chose the Spot-fest plan');
const tiringSpots=prepared('spots',50),tiringTechnical=prepared('technical',50);
assert.ok(likelihood(tiringSpots)>likelihood(tiringTechnical),
 'a flyer should have a real recovery option before reaching near-exhaustion');
const setUp=prepared('spots',70),g=G.get(setUp);
g.arc='escalation';setUp.story.position='standing';
const candidate=id=>G.pool(setUp).find(([move])=>move===id)?.[1]||0;
assert.ok(candidate('top_climb')>0||candidate('springboard_rise')>0,
 'a prepared flyer should have a physically legal route into a named aerial attack');
assert.equal(G.isValid(lowSpots,'catch_breath'),true);
const before=lowSpots.wSt;
G.apply(lowSpots,'catch_breath');
assert.ok(lowSpots.wSt>before,'a real recoverable action adds stamina by its authored negative cost');
assert.equal(G.validate().errors.length,0);
console.log('PASS Phase 6B pacing: visible low-stamina recovery preferred, earned stamina from a real legal action, fresh fighters not forced to stall.');
