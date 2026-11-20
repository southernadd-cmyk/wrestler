'use strict';
// Post-v0.4 audited technique tranche: all 24 registry records are backed by
// real authored actions, and all seven reviewed handoffs are physically legal.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const lab=require('../tools/graph-lab/core.js');
const {EXPECTED}=require('./_phase10-inventory.cjs');
const root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
 {window:root,Math,Date,JSON,console},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,R=root.OfficeTechniqueRegistry;
const groups={
 ground:['gd_elbow_drop','gd_stomp','gd_senton','gd_arm_elbows','gd_ground_pound'],
 ringside:['os_ramp_suplex','os_apron_ddt','os_barricade_spear','os_floor_piledriver'],
 lifting:['pw_bearhug','sx_deadlift_bridge','pw_backbreaker','pw_powerbomb'],
 neck:['nk_snap_ddt','nk_swinging_neckbreaker','nk_ddt'],
 strikes:['st_headbutt','st_double_chop','st_backhand','st_chop'],
 holds:['rs_leg_lace','rs_front_chancery'],
 highSpots:['dv_tope_con_hilo','sp_superplex']
};
const ids=Object.values(groups).flat();
assert.equal(ids.length,24);
assert.equal(new Set(ids).size,24);
assert.equal(R.validate(G).valid,true,R.validate(G).errors.join('; '));
assert.equal(R.list().length,325,'preserve previous 114 records plus 39 mat records');
assert.equal(R.validate(G).coverage,95.6,'reviewed subset remains smaller than playable catalogue');
assert.equal(G.validate().nodes,EXPECTED.nodes);
assert.equal(G.validate().edges,EXPECTED.edges);
assert.equal(G.validate().moves,340,'no new moves added');
for(const id of ids){
 const n=G.A[id],r=R.get(id);
 assert.ok(n&&r,'audited move exists in graph and registry: '+id);
 assert.equal(r.entry.position,n.requires,'entry position accurately describes '+id);
 assert.equal(r.exit.position,n.zone,'exit position accurately describes '+id);
 assert.equal(r.target,n.part||null,'actual target matches '+id);
 assert.deepEqual([...r.counterIds],[id+'_rev'],'only exact generated counter is reviewed for '+id);
 assert.equal(G.A[id+'_rev'].counterOf,id,'exact reviewed counter parent '+id);
 assert.ok(r.setupIds.every(s=>G.A[s]&&s!==id),'setup IDs must exist: '+id);
}
assert.equal(G.TECHNIQUE_AUDIT24_LINKS.length,7);
const unique=new Set();
for(const link of G.TECHNIQUE_AUDIT24_LINKS){
 const pair=link.from+'>'+link.to;
 assert.ok(!unique.has(pair),'no duplicate authored handoff '+pair);unique.add(pair);
 assert.equal(G.A[link.from].zone,G.A[link.to].requires,'physical positions disagree: '+pair);
 assert.ok(G.A[link.from].next.some(([id,w])=>id===link.to&&w>0),
 'reviewed handoff not reachable through live action pool: '+pair);
 assert.ok(R.get(link.to)?.setupIds.includes(link.from),
 'metadata must document the actual source for '+pair);
 assert.ok(!G.A[link.to].counterOf&&!G.A[link.to].blockOf,
 'a defensive alternative cannot be an ordinary landed follow-up: '+pair);
}
const fresh=(w='juno',f='bao',plan='technical')=>{
 const m=M.create(lab.makeOptions(D,{wid:w,rid:f,slot:'main',plan,finish:'win_clean',seed:94117}));
 m.stage='live';m.t=Math.floor(m.len*.72);m.wSt=m.fSt=100;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 return m;
};
const leg=fresh();
G.apply(leg,'mat_takedown');
assert.equal(G.isValid(leg,'rs_leg_lace'),false,'grounded position is not sufficient: must capture a leg');
G.apply(leg,'leg_wrench');
assert.equal(G.isValid(leg,'rs_leg_lace'),true,'owned leg grip enables an authentic lace');
const legSave=JSON.parse(JSON.stringify({...leg,rState:leg.r.getState()}));
const restored=M.restore(legSave);
assert.equal(G.isValid(restored,'rs_leg_lace'),true,'save and reload retains owned leg control');
G.apply(leg,'mat_scramble');
assert.equal(G.isValid(leg,'rs_leg_lace'),false,'scramble must release trapped leg');

const ddt=fresh();
G.apply(ddt,'lockup');
assert.equal(G.isValid(ddt,'nk_ddt'),false,'standard DDT still requires an actual facelock');
G.apply(ddt,'front_facelock');
assert.equal(G.isValid(ddt,'nk_ddt'),true,'head grip enables standard DDT');
G.apply(ddt,'nk_ddt');
assert.equal(ddt.story.position,'mat');
assert.equal(G.isValid(ddt,'rs_front_chancery'),true,
 'a landed DDT produces a physically legal grounded neck hold');

const cross=fresh('juno','bao','story');
G.apply(cross,'lockup');G.apply(cross,'pw_bearhug');
assert.equal(cross.story.position,'standing');
assert.equal(G.isValid(cross,'pw_backbreaker'),true,
 'an eligible wrestler can follow a body hold with a lift');
G.apply(cross,'pw_backbreaker');
assert.equal(cross.story.position,'mat','a backbreaker leaves the opponent grounded');

// Full-match smoke: real seeded engines still obey booked finishes and replay
// exactly, exercising styles without introducing new persistence keys.
const roster=lab.roster(D);
let events=0;
for(let i=0;i<60;i++){
 const w=roster[i%roster.length],r=roster[(i*7+19)%roster.length];
 const o=lab.makeOptions(D,{wid:w.id,rid:r.id===w.id?roster[(i+1)%roster.length].id:r.id,
  plan:['story','technical','brawl','spots','safe'][i%5],slot:i%2?'main':'mid',
  finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],seed:85021+i*43});
 const m=lab.runMatch(root,o);
 assert.ok(m.done&&m.final);
 assert.equal(m.graph.outcome?.id,o.finish,'booked result stays intact: '+o.seed);
 events+=m.graph.events.length;
 if(i<5){
  const replay=lab.runMatch(root,o);
  assert.equal(JSON.stringify(m.graph.events),JSON.stringify(replay.graph.events),
   'same-seed move tape must replay exactly');
 }
}
assert.ok(events>500,'real wrestling actions must be exercised');
console.log('PASS audited technique tranche: 24 new records (114/340), 7 vetted handoffs, six new links, authentic grips, real matches and replay.');
