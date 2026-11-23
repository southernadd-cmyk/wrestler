#!/usr/bin/env node
'use strict';
// Phase 9 same-seed comparison against pinned, original Phase 8 Git revision.
// Usage: node tools/graph-lab/compare-phase8.cjs ./phase8-reference ./phase9-reference
// Both historical engine revisions are pinned and independent of Phase 10.
// Requires a checkout of d80139d3462cb4bb8740abd4c032c42a30b8cf81.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const referenceRoot=path.resolve(process.argv[2]||'phase8-reference');
const latestRoot=path.resolve(process.argv[3]||path.join(__dirname,'../..'));
// Historical Phase 9 comparisons must use its pinned source, not Phase 10.
const names=['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-graph.js','match-commentary.js','match-engine.js'];
function load(dir){
 const root={};
 for(const name of names){
  const src=fs.readFileSync(path.join(dir,'assets/js',name),'utf8');
  vm.runInNewContext(src,{window:root,Math,Date,JSON,console},{filename:path.join(dir,name)});
 }
 root.OfficeRosterV4.enableProfiles();
 const lab=require(path.join(dir,'tools/graph-lab/core.js'));
 return {root,lab,data:root.OfficeData,graph:root.OfficeMatch.GRAPH};
}
const old=load(referenceRoot),now=load(latestRoot);
assert.equal(old.graph.validate().edges,6189,'expected pinned Phase 8, not a moving baseline');
assert.equal(now.graph.validate().edges,6333,'expected Phase 9 authored graph');
assert.equal(now.graph.PHASE9_NEW_EDGES.length,144);
const edges=new Set(now.graph.PHASE9_NEW_EDGES);
const labels=now.graph.TECHNIQUE_CHAINS;
const groupOf=new Map(labels.map(l=>[l.from+'>'+l.to,l.group]));
const count=500;
function simulate(instance){
 const {root,lab,data,graph}=instance,people=lab.roster(data);
 const snap=lab.empty(graph,{seed:90021,count,rotation:'roster'});
 const byGroup={},style={};let matchesWithNew=0,occurrences=0,distinct=new Set(),
  threeBeatSequences=0,sameController=0,interceptions=0,aerial=0,springboard=0,
  spectacleAerial=0,spectacleSpringboard=0;
 for(let i=0;i<count;i++){
  const w=people[i%people.length],r=people[(i*7+19)%people.length];
  const opts=lab.makeOptions(data,{
    wid:w.id,rid:r.id===w.id?people[(i+1)%people.length].id:r.id,
    seed:90021+i*41,plan:['technical','story','brawl','spots','safe'][i%5],
    finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],slot:i%2?'main':'mid'
  });
  const match=lab.runMatch(root,opts);lab.add(snap,match,graph);
  const events=match.graph?.events||[];let found=0;
  for(let j=0;j<events.length;j++){
   const e=events[j],node=graph.A[e.id];
   if(node&&!node.counterOf&&!node.blockOf){
    if(node.family==='aerial'||node.family==='springboard'){
     if(node.family==='aerial')aerial++;else springboard++;
     const actor=e.preControl==='f'?match.f:match.w;
     if(actor?.style==='Spectacle'){
      if(node.family==='aerial')spectacleAerial++;else spectacleSpringboard++;
     }
    }
   }
   if(j===0)continue;
   const prev=events[j-1],key=prev.id+'>'+e.id;
   if(!edges.has(key))continue;
   found++;occurrences++;distinct.add(key);
   const group=groupOf.get(key);byGroup[group]=(byGroup[group]||0)+1;
   const continuous=prev.control===e.preControl;
   if(!continuous){interceptions++;continue;}
   sameController++;
   const actor=e.preControl==='f'?match.f:match.w;
   style[actor?.style||'Unknown']=(style[actor?.style||'Unknown']||0)+1;
   if(j>=2){
    const before=events[j-2],first=before.id+'>'+prev.id;
    if(edges.has(first)&&before.control===prev.preControl)
      threeBeatSequences++;
   }
  }
  if(found)matchesWithNew++;
 }
 const report=lab.report(snap,graph);
 return {bouts:count,avgStars:report.avgStars,distinctObservedEdges:report.visitedEdges,
  newEdgeOccurrences:occurrences,matchesWithNew,distinctNewLinks:distinct.size,
  sameController,interceptions,threeBeatSequences,
  namedAerial:aerial,namedSpringboard:springboard,
  spectacleNamedAerial:spectacleAerial,spectacleNamedSpringboard:spectacleSpringboard,
  newByGroup:byGroup,performerStyles:style};
}
const before=simulate(old),after=simulate(now);
const deltas=Object.fromEntries(['newEdgeOccurrences','matchesWithNew','distinctNewLinks',
 'sameController','threeBeatSequences','namedAerial','namedSpringboard','avgStars']
 .map(k=>[k,+(after[k]-before[k]).toFixed(2)]));
const checks={
 matchReach:after.matchesWithNew>=before.matchesWithNew+80,
 repeatableContinuity:after.sameController>=before.sameController+100,
 multiStepDepth:after.threeBeatSequences>=before.threeBeatSequences+15,
 namedAerials:after.spectacleNamedAerial>=before.spectacleNamedAerial,
 namedSpringboards:after.spectacleNamedSpringboard>=before.spectacleNamedSpringboard,
 ratingFloor:after.avgStars>=before.avgStars-.12
};
const output={schema:'office-phase9-vs-phase8-v1',
 source:'identical 500 roster pairings, plans, time slots, booking finishes and seeds',
 phase8Revision:'d80139d3462cb4bb8740abd4c032c42a30b8cf81',newLinkCount:edges.size,
 before,after,deltas,checks,pass:Object.values(checks).every(Boolean)};
process.stdout.write(JSON.stringify(output,null,2)+'\n');
if(!output.pass){
 process.stderr.write('Phase 9 comparison gates failed: '+Object.keys(checks).filter(k=>!checks[k]).join(', ')+'\n');
 process.exitCode=1;
}
