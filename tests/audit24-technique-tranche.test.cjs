'use strict';
// Post-v0.4: the next 24 curated wrestling techniques are editorial metadata
// plus seven verified physical-position handoffs; no new moves or free counters.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-graph.js','match-commentary.js','match-engine.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
  {window:root,Date,Math,JSON,console},{filename:name});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,R=root.OfficeTechniqueRegistry;
const reviewed=[
 'gd_elbow_drop','gd_stomp','gd_senton','gd_arm_elbows','gd_ground_pound',
 'os_ramp_suplex','os_apron_ddt','os_barricade_spear','os_floor_piledriver',
 'pw_bearhug','sx_deadlift_bridge','pw_backbreaker','pw_powerbomb',
 'nk_snap_ddt','nk_swinging_neckbreaker','nk_ddt',
 'st_headbutt','st_double_chop','st_backhand','st_chop',
 'rs_leg_lace','rs_front_chancery','dv_tope_con_hilo','sp_superplex'
];
assert.equal(new Set(reviewed).size,24,'exactly 24 distinct audited action identities');
const registry=R.validate(G);
assert.equal(registry.valid,true,registry.errors.join('\n'));
assert.equal(registry.proposals,325,'90 original + 24 audit records + 39 Phase 5 mat records');
assert.equal(registry.coverage,95.6);
assert.equal(G.validate().errors.length,0);
assert.equal(G.validate().nodes,980,'no new graph nodes');
assert.equal(G.validate().edges,6413,'only six genuinely new links');
assert.equal(G.CATALOG.counts.moves,340,'no added technique names');
for(const id of reviewed){
 const node=G.A[id],row=R.get(id);
 assert.ok(node&&row,'new mechanics record references an authored move: '+id);
 assert.equal(row.entry.position,node.requires,'entry position: '+id);
 assert.equal(row.exit.position,node.zone,'impact position: '+id);
 assert.equal(row.target,node.part,'authored target: '+id);
 assert.ok(row.setupIds.length>=1,'reviewed setup explicitly documented: '+id);
 assert.ok(row.counterIds.includes(id+'_rev'),'actual move-specific reversal: '+id);
 assert.equal(G.A[id+'_rev']?.counterOf,id,'reversal ownership: '+id);
 if(G.A[id+'_blk'])assert.equal(G.A[id+'_blk'].blockOf,id,'block ownership: '+id);
 assert.ok(!node.next.some(([to])=>to===id+'_rev'||to===id+'_blk'),
  'landed move cannot spawn its uncommitted counter: '+id);
}
assert.equal(G.TECHNIQUE_AUDIT24_LINKS.length,7);
const ids=new Set();
for(const link of G.TECHNIQUE_AUDIT24_LINKS){
 const key=link.from+'>'+link.to;
 assert.ok(!ids.has(key),'no duplicate curated handoff: '+key);ids.add(key);
 assert.equal(G.A[link.from].zone,G.A[link.to].requires,'physical position link: '+key);
 assert.ok(R.get(link.to)?.setupIds.includes(link.from),'metadata actually documents handoff: '+key);
 assert.ok(G.A[link.from].next.some(([id,weight])=>id===link.to&&weight>0),
  'handoff exists in executable graph: '+key);
 assert.equal(G.A[link.to].counterOf,null,'hand-off is never a free defensive counter: '+key);
}
const m=M.create(lab.makeOptions(D,{wid:'juno',rid:'bao',slot:'main',plan:'technical',seed:218701}));
m.stage='live';m.t=Math.floor(m.len*.69);m.story.control='w';m.story.position='mat';m.story.down='f';
m.wSt=100;m.fSt=100;
G.apply(m,'leg_wrench');
assert.equal(G.isValid(m,'rs_leg_lace'),true,'wrestler owns the acquired leg grip');
G.apply(m,'mat_scramble');
assert.equal(G.isValid(m,'rs_leg_lace'),false,'escaping the grip releases leg lace eligibility');
// The same seed/config must still replay identically through the changed graph.
let count=0,handOffEvents=0;
const routes=new Set(G.TECHNIQUE_AUDIT24_LINKS.map(x=>x.from+'>'+x.to));
for(let i=0;i<80;i++){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*5)%D.FOES.length];
 const opt=lab.makeOptions(D,{wid:w.id,rid:f.id,plan:['technical','story','brawl','spots','safe'][i%5],
  finish:'win_clean',slot:['opener','mid','main'][i%3],seed:90021+i*41});
 const bout=lab.runMatch(root,opt);
 assert.ok(bout.done&&bout.final,'seeded bout completes: '+opt.seed);
 count++;
 const ev=bout.graph.events;
 for(let j=1;j<ev.length;j++)if(routes.has(ev[j-1].id+'>'+ev[j].id)&&ev[j-1].control===ev[j].preControl)handOffEvents++;
 if(i<5){
  const repeat=lab.runMatch(root,opt);
  assert.equal(JSON.stringify(ev),JSON.stringify(repeat.graph.events),'same-seed replay '+opt.seed);
  assert.equal(bout.graph.outcome?.id,repeat.graph.outcome?.id);
 }
}
assert.ok(handOffEvents>=1,'reviewed handoffs appear naturally within 80 real matches');
console.log('PASS audit24 technique tranche: 114 reviewed records, six new links, '+count+
 ' completed bouts, '+handOffEvents+' authored handoffs, preserved physical grips and deterministic replays.');
