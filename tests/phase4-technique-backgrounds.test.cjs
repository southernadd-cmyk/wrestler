'use strict';
// Phase 4: school-specific choice weights without overwriting ring style,
// weekly training, seeds, saved wrestlers or finish contracts.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-graph.js','match-engine.js']){
 const src=fs.readFileSync(path.join(__dirname,'..','assets','js',name),'utf8');
 vm.runInNewContext(src,{window:root,console,Date,Math,JSON},{filename:name});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,R=root.OfficeTechniqueRegistry,B=root.OfficeTechniqueBackgrounds;
const stats=B.validate(D,G,R);
assert.equal(stats.valid,true,stats.errors.join('\n'));
assert.equal(B.VERSION,3);
assert.equal(stats.assigned,80);
assert.equal(stats.unassigned,0);
assert.equal(B.MAX_BONUS,.28);
assert.equal(D.ALL.length,80);
assert.equal(B.get('bao').label,'Judo','Bao is a judoka in the cast bible');
assert.equal(B.get('nico').label,'Lucha libre','Nico has a stated lucha upbringing');
assert.equal(B.get('theo').label,'Catch wrestling');
assert.equal(B.get('rex').label,'Strength athletics','Rex receives provisional strength move tendencies');
assert.equal(Object.keys(B.PROVISIONAL_ASSIGNMENTS).length,40,'originally unallocated wrestlers receive provisional gameplay identities');
assert.equal(B.get('juno').id,'catch');
assert.equal(B.get('juno').id,B.get({id:'juno'}).id);
assert.equal(B.get('rex').id,B.get({id:'rex',training:'ring',intensity:'light'}).id);
assert.equal(D.findWrestler('juno').style,D.findWrestler('bao').style,'both have same performance style yet different schooling');
assert.notEqual(B.get('juno').id,B.get('bao').id,'school is separate from ring style');
const frozen=JSON.stringify(D.ALL),graph=JSON.stringify(G.A);
assert.equal(B.multiplier('juno','ch_rolling_wristlock',G,R),1.28,'catch wrestler favours live wrist chain');
assert.equal(B.multiplier('bao','ch_rolling_wristlock',G,R),1,'judo schooling does not grant every catch transition');
assert.equal(B.multiplier('bao','ch_top_wristlock',G,R),1.28,'judo wrestler receives a shared grip transition bonus');
assert.equal(B.multiplier('nico','lc_hurricanrana',G,R),1.28,'lucha performer receives a relevant rana bonus');
assert.equal(B.multiplier('theo','lc_hurricanrana',G,R),1,'catch school does not grant a lucha bonus');
assert.equal(B.multiplier('rex','ch_rolling_wristlock',G,R),1,'strength tendency does not grant catch-wrestling grip bonuses');
assert.equal(B.multiplier('juno','sm_kimura',G,R),1.28,'Phase 9 authored arm-control chain activates reviewed catch kimura');
assert.equal(B.multiplier('juno','early_cover',G,R),1,'live link without vetted technique tags remains unbiased');
assert.equal(B.multiplier('juno','ch_single_leg_rev',G,R),1.28,'move-specific counter reads parent technique');
assert.ok(B.multiplier('marisol','lc_hurricanrana',G,R)>1,'hybrid background supports cross-school movement');
for(const w of D.ALL)for(const link of G.TECHNIQUE_PILOT){
 const b=B.multiplier(w,link.to,G,R);
 assert.ok(b>=1&&b<=1.28,'training bias is bounded for '+w.id+'/'+link.to);
}
const make=wid=>M.create(lab.makeOptions(D,{wid,rid:'rex',slot:'mid',plan:'technical',seed:11991}));
const match=make('juno');
match.t=Math.floor(match.len*.4);match.story.position='standing';match.story.control='w';
match.graph.arc='chain';match.graph.node='ch_top_wristlock';
match.wSt=match.fSt=100;
const getWeight=(id)=>G.pool(match).find(([key])=>key===id)?.[1];
const on=getWeight('ch_rolling_wristlock');
assert.ok(on>0,'rolling wristlock is available after top wristlock');
const enabled=root.OfficeTechniqueBackgrounds;
root.OfficeTechniqueBackgrounds=null;
const off=getWeight('ch_rolling_wristlock');
root.OfficeTechniqueBackgrounds=enabled;
assert.ok(off>0);
assert.ok(Math.abs(on/off-1.28)<.00001,'graph pool actually applies the bounded catch-school bonus');
assert.equal(B.get('juno').id,'catch','school identity must not mutate after a bout');
assert.equal(JSON.stringify(D.ALL),frozen,'roster templates are untouched');
assert.equal(JSON.stringify(G.A),graph,'no authored moves/weights are changed');

// A reversal is performed by the defender, not the wrestler attempting it.
const defender=make('bao');defender.f={...D.findWrestler('theo'),fatigue:0};defender.t=Math.floor(defender.len*.6);
defender.story.position='standing';defender.story.control='f';defender.graph.arc='chain';defender.graph.node='lockup';
defender.stage='live';defender.wSt=defender.fSt=100;
assert.equal(G.startGrapple(defender,'ch_single_leg'),true,
 'defence schooling is evaluated during the exact attempted takedown');
const seen=[];root.OfficeTechniqueBackgrounds={multiplier(w,id){if(id==='ch_single_leg_rev')seen.push(w.id);return 1;}};
G.pool(defender);root.OfficeTechniqueBackgrounds=enabled;
assert.ok(seen.includes('bao'),'the proposed sprawl reads the defending worker training, not the attacker');

// Completion and per-seed replay have the same contract and no added save keys.
for(let i=0;i<18;i++){
 const input=lab.makeOptions(D,{wid:i%2?'bao':'juno',rid:'rex',seed:8011+i*31,finish:['win_clean','win_dirty','lose_clean'][i%3],plan:'technical'});
 const one=lab.runMatch(root,input);
 assert.equal(one.graph.outcome.id,input.finish,'finish stays booked');
 assert.ok(one.done&&one.final);
 assert.equal(Object.hasOwn(one.w,'techniqueBackground'),false,'background is not stored in wrestler saves');
 if(i<4){
  const again=lab.runMatch(root,lab.makeOptions(D,{wid:input.w.id,rid:'rex',seed:input.seed,finish:input.finish,plan:'technical'}));
  assert.equal(JSON.stringify(one.graph.events),JSON.stringify(again.graph.events),'same seed reproduces match exactly');
 }
}
const brief=G.scout(D.findWrestler('bao'),D.findWrestler('theo'),'technical');
assert.match(brief.brief,/judo training/i);
assert.match(brief.brief,/catch wrestling training/i);
console.log('PASS Phase 4/5/8: 40 original backgrounds plus 40 provisional gameplay profiles; 80 real wrestlers; live-technique multiplier, defence attribution, no roster/save mutation; 18 finish-safe seeded bouts.');
