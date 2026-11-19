'use strict';
// Phase 5 expansion: full-roster source audit, 21 mechanical records, 14 guarded
// executable transitions, and meaningful training-school choice factors.
// Requires no save migration and keeps original Phase 3 baseline separately intact.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),game={},names=[
 'data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js'
];
for(const name of names){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','assets/js',name),'utf8'),
  {window:game,console,Math,Date,JSON},{filename:name});
}
game.OfficeRosterV4.enableProfiles();
const D=game.OfficeData,G=game.OfficeMatch.GRAPH,R=game.OfficeTechniqueRegistry,B=game.OfficeTechniqueBackgrounds;
const validation=G.validate(),registryValidation=R.validate(G),schools=B.validate(D,G,R);
assert.equal(validation.errors.length,0,validation.errors.join('\n'));
assert.equal(validation.nodes,969,'no extra executable graph nodes');
assert.ok(validation.edges>=6164&&validation.edges<=6190,'at most fourteen new active edges');
assert.equal(G.CATALOG.counts.moves,336);
assert.equal(G.TECHNIQUE_PILOT.length,11,'original Phase 3 pilot stays separately intact');
assert.equal(G.TECHNIQUE_EXPANSION.length,14,'only fourteen new guarded links');
assert.equal(registryValidation.valid,true,registryValidation.errors.join('\n'));
assert.equal(registryValidation.proposals,90,'the 60 previously reviewed plus 30 Phase 5b records');
assert.equal(registryValidation.authored,336);
assert.equal(schools.valid,true,schools.errors.join('\n'));
assert.equal(schools.assigned,80);
assert.equal(schools.unassigned,0);
assert.equal(D.ALL.length,80);
assert.equal(B.MAX_BONUS,.28,'do not increase the maximum training bias');
assert.equal(B.get('tomasash').id,'boxing');
assert.equal(B.get('val').id,'strength');
assert.equal(B.get('kit').id,'lucha-acrobatics','Kit retains the original lucha affinity in a provisional hybrid');
assert.equal(B.get('zara').id,'lucha','Zara retains her previous training school');
assert.equal(B.get('rex').id,'strength','Rex has a provisional strength-gameplay tendency, not asserted training history');
assert.equal(B.get('bao').id,'judo','original judoka preserved');
assert.equal(B.get('juno').id,'catch','original catch preserved');
assert.equal(B.get('nico').id,'lucha','original lucha preserved');
assert.equal(B.get('kofi').id,'lucha','existing Kofi lucha training is preserved rather than inferred from aerial style');
assert.equal(B.get('milo').id,'acrobatics','Milo has an explicitly provisional gameplay identity, not a documented school');
const csv=fs.readFileSync(path.join(__dirname,'..','docs/phase5-roster-training-audit.csv'),'utf8').trim().split(/\r?\n/);
assert.equal(csv.length,81,'all eighty wrestlers have provenance and review rows');
for(const w of D.ALL){
 assert.ok(csv.slice(1).some(row=>row.startsWith('"'+w.id+'",')),'source audit missing '+w.id);
}
const seen=new Set(),original=JSON.stringify(G.A),roster=JSON.stringify(D.ALL);
for(const link of G.TECHNIQUE_EXPANSION){
 const key=link.from+'>'+link.to;
 assert.ok(!seen.has(key),'duplicate Phase 5 edge '+key);seen.add(key);
 assert.ok(['setup','counter','followup'].includes(link.kind));
 assert.ok(link.weight>0&&link.weight<=1.2,'small live link weight only');
 assert.equal(G.A[link.from].zone,G.A[link.to].requires,'physical position jump '+key);
 assert.ok(G.A[link.from].next.some(([to,weight])=>to===link.to&&weight>0),'non-live edge '+key);
 assert.ok(R.get(link.to),'target must have editorial mechanical review '+key);
 assert.ok(R.get(link.to).setupIds.includes(link.from),'target must cite exact setup from Phase 5 proposal '+key);
 assert.equal(R.get(link.to).reviewStatus,'proposed','technique metadata never auto-approved');
}
for(const [wid,move,expected] of [
 ['tomasash','st_gut_punch',1.28],['val','pw_body_slam',1.28],['kit','ar_shooting_star',1.182],
 ['juno','st_gut_punch',1],['rex','ar_shooting_star',1],['bao','pw_body_slam',1],
 ['tomasash','st_elbow_smash',1],['kit','ar_knee',1],['val','pw_chokeslam',1]
])assert.equal(B.multiplier(wid,move,G,R),expected,wid+' '+move+' obeys reviewed training coverage');
function weighted(wid,rid,source,target,position,plan){
 const input=lab.makeOptions(D,{wid,rid,slot:'main',plan,seed:44051,finish:'win_clean'});
 const m=game.OfficeMatch.create(input);m.t=Math.floor(m.len*.86);m.wSt=m.fSt=100;
 m.story.position=position;m.story.control='w';m.story.down=position==='mat'?'f':position==='top'?'f':null;
 m.graph.arc='chain';m.graph.node=source;
 const enabled=game.OfficeTechniqueBackgrounds;
 const w=G.pool(m).find(([id])=>id===target)?.[1];
 game.OfficeTechniqueBackgrounds=null;
 const neutral=G.pool(m).find(([id])=>id===target)?.[1];
 game.OfficeTechniqueBackgrounds=enabled;
 assert.ok(w>0&&neutral>0,'real graph pool must admit '+source+' -> '+target);
 return w/neutral;
}
assert.ok(Math.abs(weighted('tomasash','rex','st_jab','st_gut_punch','standing','brawl')-1.28)<1e-8,
 'boxing training influences an actual legal punch choice');
assert.ok(Math.abs(weighted('val','kit','waistlock','pw_body_slam','standing','brawl')-1.28)<1e-8,
 'strength training influences an actual body slam with a light opponent');
assert.ok(Math.abs(weighted('kit','rex','top_climb','ar_shooting_star','top','spots')-1.182)<1e-8,
 'acrobatics influences an actual late top-rope choice');
assert.equal(JSON.stringify(G.A),original,'measuring training must never mutate original authored actions');
assert.equal(JSON.stringify(D.ALL),roster,'no wrestler template save fields');
const challenges=[
 {wid:'tomasash',rid:'rex',plan:'brawl'},
 {wid:'val',rid:'kit',plan:'brawl'},
 {wid:'kit',rid:'rex',plan:'spots'},
 {wid:'juno',rid:'bao',plan:'technical'}
];
for(let i=0;i<24;i++){
 const pair=challenges[i%challenges.length],finish=['win_clean','win_dirty','lose_clean','lose_protected'][i%4];
 const cfg=lab.makeOptions(D,{...pair,seed:85001+37*i,finish,slot:'feature'});
 const m=lab.runMatch(game,cfg);
 assert.equal(m.graph.outcome.id,finish,'booked finish survives '+i);
 assert.ok(m.done&&m.final);
 assert.equal(Object.hasOwn(m.w,'technicalSchool'),false,'save shape unchanged');
 if(i<4){
  const again=lab.runMatch(game,lab.makeOptions(D,{...pair,seed:85001+37*i,finish,slot:'feature'}));
  assert.equal(JSON.stringify(m.graph.events),JSON.stringify(again.graph.events),'same seed reproducible '+i);
 }
}
console.log('PASS Phase 5: 80 audited wrestlers, 40 training backgrounds, 60 curated move records, 14 guarded new transitions, no save mutation or contracted finish drift.');
