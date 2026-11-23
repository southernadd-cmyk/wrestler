#!/usr/bin/env node
'use strict';
// Compare *identical* fixed-seed match samples on two repository revisions.
// Read-only engine evaluation; counts sampled action nodes separately from
// conditional generated counter/block outcomes.
// node tools/graph-lab/coverage-classification.cjs /tmp/office-phase2-main 1000
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('./core.js');
const oldPath=path.resolve(process.argv[2]||'/tmp/office-phase2-main');
const count=Number(process.argv[3]||1000);
if(!Number.isSafeInteger(count)||count<1||count>5000)throw Error('Expected 1..5000 bouts');
const js=['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-graph.js','match-engine.js'];
function open(dir){
 const root={};
 for(const name of js)vm.runInNewContext(
  fs.readFileSync(path.join(dir,'assets/js',name),'utf8'),
  {window:root,console,Math,Date,JSON},{filename:name});
 root.OfficeRosterV4.enableProfiles();return root;
}
const roots={base:open(oldPath),candidate:open(path.resolve(__dirname,'../..'))};
function evaluate(root,targetParents){
 const D=root.OfficeData,G=root.OfficeMatch.GRAPH,people=lab.roster(D),A=G.A;
 const seen=new Set(),parents=new Set(),grapples=new Set();
 const targetDefences={counter:0,block:0,tagged:0,untagged:0,byParent:{}};
 const grappleOutcomes={},sampleByStyle={},graphStats=G.validate();
 let attempts=0;
 for(let i=0;i<count;i++){
  const wid=people[i%people.length].id,foe=people[(i*7+19)%people.length];
  const rid=foe.id===wid?people[(i+1)%people.length].id:foe.id;
  const opts=lab.makeOptions(D,{wid,rid,seed:90021+i*41,
   plan:['technical','story','brawl','spots','safe'][i%5],
   slot:['opener','mid','main'][Math.floor(i/5)%3],
   finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4]});
  const match=lab.runMatch(root,opts);
  for(const e of match.graph?.events||[]){
   if(!A[e.id])continue;
   seen.add(e.id);
   const node=A[e.id];if(!node.counterOf&&!node.blockOf)parents.add(e.id);
   const defended=node.counterOf||node.blockOf;
   if(targetParents.has(defended)){
    const label=node.counterOf?'counter':'block';
    targetDefences[label]++;
    if(e.grappleAttemptSeq!==undefined&&e.attemptedMove===defended)
     targetDefences.tagged++;
    else targetDefences.untagged++;
    const row=targetDefences.byParent[defended]??={counter:0,block:0,untagged:0};
    row[label]++;if(e.grappleAttemptSeq===undefined||e.attemptedMove!==defended)row.untagged++;
   }
  }
  for(const a of match.graph?.grappleAttempts||[]){
   attempts++;grapples.add(a.id);
   const key=a.outcome||'unknown';
   grappleOutcomes[key]=(grappleOutcomes[key]||0)+1;
  }
 }
 const byCategory={};
 const absent=[];
 const conditionallySeen={counter:0,block:0};
 const defensiveParents=new Set();
 for(const [id,n] of Object.entries(A)){
  let kind=n.counterOf?'counter':n.blockOf?'block':'independent';
  const row=byCategory[kind]??={total:0,observed:0,unobserved:0};
  row.total++;if(seen.has(id))row.observed++;else{row.unobserved++;absent.push(id);}
  if(kind!=='independent'&&parents.has(n.counterOf||n.blockOf)){
    conditionallySeen[kind]++;defensiveParents.add(n.counterOf||n.blockOf);
  }
 }
 const target=new Set(G.GRAPPLE_PILOT||[]);
 const targetedMissing=absent.filter(id=>{const n=A[id],parent=n.counterOf||n.blockOf;
  return target.has(id)||target.has(parent);});
 return {nodes:graphStats.nodes,errors:graphStats.errors.length,bouts:count,
  observed:seen.size,coveragePct:+(100*seen.size/Object.keys(A).length).toFixed(2),
  byCategory,unseenIndependent:absent.filter(id=>!A[id].counterOf&&!A[id].blockOf),
  unseenConditional:absent.filter(id=>A[id].counterOf||A[id].blockOf).length,
  defensiveParentsObserved:conditionallySeen,
  grappleAttempted:grapples.size,grappleAttempts:attempts,grappleOutcomes,
  targetDefences,
  missingTargetRelated:targetedMissing,
  independentCoveragePct:+(100*(byCategory.independent?.observed||0)/
   Math.max(1,byCategory.independent?.total||1)).toFixed(2)};
}
const targetParents=new Set(roots.candidate.OfficeMatch.GRAPH.GRAPPLE_PILOT||[]);
const base=evaluate(roots.base,targetParents),candidate=evaluate(roots.candidate,targetParents);
const difference={coveragePct:+(candidate.coveragePct-base.coveragePct).toFixed(2),
 independentCoveragePct:+(candidate.independentCoveragePct-base.independentCoveragePct).toFixed(2),
 independentUnseen: candidate.byCategory.independent.unobserved-base.byCategory.independent.unobserved,
 unseenConditional: candidate.unseenConditional-base.unseenConditional,
 grappleAttempts:candidate.grappleAttempts-base.grappleAttempts};
process.stdout.write(JSON.stringify({schema:'office-phase2-coverage-comparison-v1',
 sample:'1,000 identical fixed-seed roster pairings; identical style/slot/finish rotation',
 base,candidate,difference},null,2)+'\n');
process.stderr.write('Coverage base '+base.coveragePct+'% candidate '+candidate.coveragePct+
 '% (delta '+difference.coveragePct+'); independent base '+base.independentCoveragePct+
 '% candidate '+candidate.independentCoveragePct+'% (delta '+
 difference.independentCoveragePct+'); unseen independent candidate: '+
 candidate.unseenIndependent.join(', ')+
 '; target defences main '+JSON.stringify(base.targetDefences)+
 ' candidate '+JSON.stringify(candidate.targetDefences)+'\n');
