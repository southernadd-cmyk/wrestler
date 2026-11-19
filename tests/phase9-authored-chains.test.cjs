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
assert.equal(G.validate().nodes,969,'do not inflate vocabulary with pseudo-actions');
assert.equal(G.validate().edges,6333,'144 new real directed edges beyond Phase 8');
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
assert.ok(result.distinctMatchSequences>=160,'bouts need genuinely different action sequences');
const active=links.filter(x=>(snap.edgeHits[x.from+'>'+x.to]||0)>0);
const observed=active.reduce((sum,x)=>sum+(snap.edgeHits[x.from+'>'+x.to]||0),0);
assert.ok(active.length>0,'at least some new/strengthened chains must be seen in actual bouts');
assert.ok(observed>0);
const byGroup=Object.entries(Object.groupBy(links,x=>x.group)).map(([group,ls])=>({
 group,candidates:ls.length,observedLinks:ls.filter(l=>snap.edgeHits[l.from+'>'+l.to]).length,
 hits:ls.reduce((n,l)=>n+(snap.edgeHits[l.from+'>'+l.to]||0),0)
}));
console.log('PASS Phase 9: 191 reviewed links, 144 new edges, 9 contexts; 200 real bouts, '+
 observed+' authored-chain transitions observed across '+active.length+
 ' distinct links; '+result.distinctMatchSequences+' unique match sequences; '+
 JSON.stringify(byGroup));
