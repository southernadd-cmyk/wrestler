'use strict';
const {EXPECTED}=require('./_phase10-inventory.cjs');
// Phase 5b: audit real graph rather than the plausibility of string labels.
// No production save fields, new move nodes, additional authored finish routes,
// arbitrary school allocations, or fictional post-landing aerial counter links.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js']){
 const source=fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8');
 vm.runInNewContext(source,{window:root,Date,Math,JSON,console},{filename:file});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,G=root.OfficeMatch.GRAPH,M=root.OfficeMatch,R=root.OfficeTechniqueRegistry,B=root.OfficeTechniqueBackgrounds;
const stats=G.validate(),review=R.validate(G),schools=B.validate(D,G,R);
assert.equal(stats.errors.length,0,stats.errors.join('\n'));
assert.equal(stats.nodes,EXPECTED.nodes);
assert.equal(stats.edges,EXPECTED.edges,'Phase 9 grows from 6,189 to 6,333 edges through 144 new curated connections');
assert.equal(G.CATALOG.counts.moves,EXPECTED.moves,'no new authored move nodes');
assert.equal(G.TECHNIQUE_PILOT.length,11,'Phase 3 baseline remains a separate set');
assert.equal(G.TECHNIQUE_EXPANSION.length,14,'Phase 5 baseline remains a separate set');
assert.equal(G.TECHNIQUE_TRANCHE2.length,16,'the exact vetted Phase 5b link set');
assert.equal(review.valid,true,review.errors.join('\n'));
assert.equal(review.proposals,325);
assert.equal(review.authored,EXPECTED.moves);
assert.equal(schools.valid,true,schools.errors.join('\n'));
assert.equal(schools.assigned,80);
assert.equal(schools.unassigned,0);
assert.equal(B.get('kit').id,'lucha-acrobatics','Kit provisional hybrid unchanged');
assert.equal(B.get('val').id,'strength');
assert.equal(B.get('tomasash').id,'boxing');
assert.ok(R.TRADITIONS.includes('wrestling'),'neutral professional ring technique is explicitly distinguishable from a technical school');
assert.equal(B.multiplier('tomasash','st_kneelift',G,R),1,'ring knee cannot become a boxing advantage');
assert.equal(B.multiplier('tomasash','st_uppercut',G,R),1,'European forearm uppercut is not a boxing punch');
assert.equal(B.multiplier('juno','sm_boston',G,R),1.28,'catch background applies to an approved ground hold');
assert.equal(B.multiplier('bao','sm_triangle',G,R),1.28,'judo background can influence a reviewed shared hold');
assert.equal(B.multiplier('rex','sm_triangle',G,R),1,'general ringcraft is unchanged');
assert.equal(B.multiplier('kit','ar_frog',G,R),1.224,'hybrid retains a smaller original lucha preference');
assert.equal(B.multiplier('juno','sm_deathlock',G,R),1.28,'Phase 9 figure-four-to-deathlock connection makes reviewed catch leg control live');
const immutableMoves=JSON.stringify(G.A),immutableRoster=JSON.stringify(D.ALL);
const unique=new Set();
for(const link of G.TECHNIQUE_TRANCHE2){
 const id=link.from+'>'+link.to;
 assert.ok(!unique.has(id),'no duplicate tranche 5b link '+id);
 unique.add(id);
 assert.ok(G.A[link.from]&&G.A[link.to],'both live nodes exist for '+id);
 assert.equal(G.A[link.from].zone,G.A[link.to].requires,'requires/zone guard for '+id);
 assert.equal(link.kind==='counter',false,'no speculative counter is activated');
 assert.ok(link.weight>0&&link.weight<=.95);
 assert.ok(R.get(link.to)?.setupIds.includes(link.from),'source review explicitly lists setup '+id);
 assert.ok(G.A[link.from].next.some(([next,weight])=>next===link.to&&weight>0),'reviewed live link missing from authored next '+id);
 assert.equal(R.get(link.to).reviewStatus,'proposed','mechanical interpretation remains editorial');
}
const counters=['ar_frog','ar_senton','ar_cross_arm','ar_missile_low','sb_cutter'];
for(const parent of counters){
 const id=parent+'_rev',p=G.A[parent],n=G.A[id],r=R.get(parent);
 assert.ok(p&&n&&r,'existing aerial attempt/counter must both exist');
 assert.equal(n.counterOf,parent,'generated reversal must refer to its actual parent');
 assert.ok(n.reverse,'generated aerial counter must be marked as a reversal');
 assert.equal(n.requires,p.requires,'counter available only during the same top position');
 assert.equal(n.requires,'top','aerial counters require unlanded top-position action');
 assert.equal(p.zone,'mat','a landed dive finishes on the mat, not top');
 assert.ok(r.counterIds.includes(id),'reviewed move must cite exact existing counter ID');
 assert.ok(!p.next.some(([to])=>to===id),'do not invent impossible landed dive -> top-position counter');
}
const input=(wid,rid,plan)=>lab.makeOptions(D,{wid,rid,plan,slot:'main',finish:'win_clean',seed:35071});
const mat=M.create(input('juno','bao','technical'));
mat.t=Math.floor(mat.len*.77);mat.wSt=mat.fSt=100;
mat.story.position='mat';mat.story.down='f';mat.story.control='w';
mat.graph.arc='limb_work';mat.graph.node='mat_hold';
const ratio=(match,id)=>{
 const store=root.OfficeTechniqueBackgrounds;
 const active=G.pool(match).find(([x])=>x===id)?.[1];
 root.OfficeTechniqueBackgrounds=null;
 const neutral=G.pool(match).find(([x])=>x===id)?.[1];
 root.OfficeTechniqueBackgrounds=store;
 assert.ok(active>0&&neutral>0,'real legal pool must admit '+id);
 return active/neutral;
};
assert.ok(Math.abs(ratio(mat,'sm_boston')-1.28)<1e-8,'real choice pool picks up catch school bonus');
assert.ok(Math.abs(ratio(mat,'sm_triangle')-1.28)<1e-8,'real choice pool applies shared judo/catch tags');
const strike=M.create(input('tomasash','rex','brawl'));
strike.t=Math.floor(strike.len*.75);strike.wSt=strike.fSt=100;
strike.story.position='standing';strike.story.down=null;strike.story.control='w';
strike.graph.arc='fighting_spirit';strike.graph.node='st_gut_punch';
assert.equal(ratio(strike,'st_kneelift'),1,'ring-specific striking follow-up does not become a boxing signature');
const top=M.create(input('kit','rex','spots'));
top.t=Math.floor(top.len*.82);top.wSt=top.fSt=100;
top.story.position='top';top.story.down='f';top.story.control='w';
top.graph.arc='escalation';top.graph.node='top_climb';
assert.equal(G.isValid(top,'ar_frog_rev'),false,'no move-specific aerial counter without an attempted frog splash');
assert.equal(G.startAerial(top,'ar_frog'),true,'explicit frog-splash attempt commits from top rope');
assert.ok(G.isValid(top,'ar_frog_rev'),'matching frog-splash counter becomes legal while its attempt is pending');
assert.equal(G.isValid(top,'ar_senton_rev'),false,'a different dive cannot be countered during a frog-splash attempt');
top.story.position='mat';top.story.down='f';
assert.equal(G.isValid(top,'ar_frog_rev'),false,'a top-rope counter is not legal after impact');
assert.equal(G.abortAerial(top,'aborted',false),true,'interrupted attempt is resolved without creating a false counter');
assert.equal(JSON.stringify(G.A),immutableMoves,'tests do not mutate move graph');
assert.equal(JSON.stringify(D.ALL),immutableRoster,'tests do not write school fields to saved roster');
const scenarios=[
 ['juno','bao','technical','win_clean'],
 ['bao','theo','technical','lose_clean'],
 ['kit','rex','spots','win_dirty'],
 ['tomasash','rex','brawl','lose_protected']
];
for(let i=0;i<24;i++){
 const [wid,rid,plan,finish]=scenarios[i%scenarios.length];
 const options=lab.makeOptions(D,{wid,rid,plan,finish,slot:'feature',seed:37011+i*113});
 const bout=lab.runMatch(root,options);
 assert.ok(bout.done&&bout.final,'real bout must finish '+i);
 assert.equal(bout.graph.outcome.id,finish,'contracted finish not changed '+i);
 assert.ok(bout.graph.events.length>0,'real bout must have legal match events');
 if(i<4){
  const replay=lab.runMatch(root,lab.makeOptions(D,{wid,rid,plan,finish,slot:'feature',seed:37011+i*113}));
  assert.equal(JSON.stringify(bout.graph.events),JSON.stringify(replay.graph.events),'same seed/release replay '+i);
 }
}
console.log('PASS Phase 5b: 114/340 reviewed mechanics (90 Phase 5b and earlier), 16 curated links, five pre-existing aerial counters, real mat/strike weights, 24 legal finishes, original roster and saves intact.');
