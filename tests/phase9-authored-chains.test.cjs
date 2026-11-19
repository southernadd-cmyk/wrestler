'use strict';
// Phase 9: actual curated match chains, physics and seeded usage rather than node-count theatre.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),validator=require('../tools/graph-lab/validation.js');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Date,Math,JSON},{filename:file});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,B=root.OfficeTechniqueBackgrounds,R=root.OfficeTechniqueRegistry;
assert.equal(G.validate().errors.length,0);
assert.ok(G.validate().nodes>=969&&G.validate().nodes<=990,'Phase 10 adds only genuine scripted-spot nodes');
assert.ok(G.validate().edges>=6333,'retain the 6,333 Phase 9 directed edges plus playable spot routes');
assert.equal(G.PHASE9_NEW_EDGES.length,144,'record only genuinely new Phase 9 links');
const links=G.TECHNIQUE_CHAINS;
assert.equal(links.length,191,'exact deliberately authored first batch');
assert.equal(new Set(links.map(l=>l.from+'>'+l.to)).size,links.length,'no duplicated curated pairs');
assert.equal(new Set(links.map(l=>l.group)).size,9,'nine situated wrestling contexts');
for(const link of links){
 const a=G.A[link.from],b=G.A[link.to];
 assert.ok(a&&b,link.from+' > '+link.to+' not in playable catalog');
 assert.equal(a.zone,b.requires,'invalid physical exit/entry state '+link.from+' > '+link.to);
 assert.ok(a.next.some(([id,weight])=>id===link.to&&weight>0),'not playable '+link.from+' > '+link.to);
 assert.ok(link.reason.length>=24,'specific positional/contextual motivation');
 assert.equal(link.weight,.72,'controlled link bias rather than forced sequences');
}
assert.equal(B.validate(D,G,R).valid,true,'schools remain compatible with deeper graph');
assert.equal(B.validate(D,G,R).assigned,80);
// Hold source, destination and performer fixed, then vary only technical affinity.
// The live decision pool must prefer genuinely familiar authored handoffs.
function schoolPreference(wid,from,to,position,tag){
 const m=M.create(lab.makeOptions(D,{wid,rid:'rex',seed:94077,plan:'technical',slot:'main'}));
 m.t=Math.floor(m.len*.83);m.wSt=m.fSt=100;
 m.story.position=position;m.story.down=position==='mat'?'f':null;m.story.control='w';
 m.graph.node=from;m.graph.arc=position==='mat'?'limb_work':'chain';
 m.graph.events.push({id:from,t:m.t-10,control:'w',preControl:'w',position});
 const original=root.OfficeTechniqueBackgrounds;
 const weight=affinity=>{
  root.OfficeTechniqueBackgrounds={get:()=>({id:'test',affinity}),multiplier:()=>1};
  return G.pool(m).find(([id])=>id===to)?.[1]||0;
 };
 try{
  const neutral=weight({}),trained=weight({[tag]:1});
  assert.ok(neutral>0&&trained>neutral*1.17,
   'recognised '+tag+' training must raise real next-move weight for '+from+' > '+to);
 }finally{root.OfficeTechniqueBackgrounds=original;}
}
schoolPreference('juno','mat_hold','sm_kimura','mat','catch');
schoolPreference('tomasash','st_forearm','st_uppercut','standing','boxing');
const config={seed:94001,count:200,rotation:'roster'};
const snap=lab.empty(G,config),ev=validator.create(G),all=lab.roster(D);
for(let i=0;i<config.count;i++){
 const w=all[i%all.length],f=all[(i*7+19)%all.length];
 const input=lab.makeOptions(D,{wid:w.id,rid:f.id===w.id?all[(i+1)%all.length].id:f.id,
  seed:config.seed+i*41,plan:['technical','brawl','spots','story','safe'][i%5],
  finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],slot:i%2?'main':'feature'});
 const match=lab.runMatch(root,input);
 lab.add(snap,match,G);validator.add(ev,match,G,B);
}
const result=validator.finish(ev);
assert.equal(result.pass,true,JSON.stringify(result.examples));
assert.equal(result.bouts,200);
assert.ok(snap.phase9.matchesWithNew>50,'new Phase 9 links appear in real matches');
assert.ok(snap.phase9.newTriples>0,'two successive newly authored transitions form three-beat offence');
assert.ok(snap.phase9.sameControllerOccurrences>snap.phase9.interruptedPairs,'continuous offence must dominate unrelated interventions');
assert.ok(result.distinctMatchSequences>=160,'bouts need genuinely different action sequences');
const active=links.filter(x=>(snap.edgeHits[x.from+'>'+x.to]||0)>0);
const observed=active.reduce((sum,x)=>sum+(snap.edgeHits[x.from+'>'+x.to]||0),0);
assert.ok(active.length>=40,'at least forty distinct authored chains must be observed in 200 real bouts');
assert.ok(observed>=70,'authored chains must actually occur, not merely be reachable in theory');
const byGroup=Object.entries(Object.groupBy(links,x=>x.group)).map(([group,ls])=>({
 group,candidates:ls.length,observedLinks:ls.filter(l=>snap.edgeHits[l.from+'>'+l.to]).length,
 hits:ls.reduce((n,l)=>n+(snap.edgeHits[l.from+'>'+l.to]||0),0)
}));
assert.ok(byGroup.filter(x=>x.hits>0).length>=8,'the expansion must be observed in at least eight of nine contexts');
console.log('PASS Phase 9: 191 reviewed links, 144 new edges, 9 contexts; 200 real bouts, '+
 observed+' authored-chain transitions observed across '+active.length+
 ' distinct links; '+result.distinctMatchSequences+' unique match sequences; '+
 JSON.stringify(byGroup));
