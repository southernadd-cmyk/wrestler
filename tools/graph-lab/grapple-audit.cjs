#!/usr/bin/env node
'use strict';
// Phase 2: read-only real-engine Graph Lab grapple audit.
// Usage: node tools/graph-lab/grapple-audit.cjs 1000 > grapple-audit.json
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('./core.js');
const validation=require('./validation.js');
const count=Number(process.argv[2]||1000);
if(!Number.isSafeInteger(count)||count<1||count>5000)throw Error('Expected 1..5000 bouts.');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-graph.js','match-engine.js']){
 const src=fs.readFileSync(path.join(__dirname,'../../assets/js',file),'utf8');
 vm.runInNewContext(src,{window:root,console,Date,Math,JSON},{filename:file});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,G=root.OfficeMatch.GRAPH,people=core.roster(D);
const config={count,seed:90021,seedStep:41,plans:['technical','story','brawl','spots','safe'],
 slots:['opener','mid','main'],rotation:'roster'};
const snapshot=core.empty(G,config),checks=validation.create(G);
for(let i=0;i<count;i++){
 const wid=people[i%people.length].id;
 const opponent=people[(i*7+19)%people.length];
 const rid=opponent.id===wid?people[(i+1)%people.length].id:opponent.id;
 const match=core.runMatch(root,core.makeOptions(D,{
  wid,rid,seed:90021+i*41,plan:config.plans[i%5],
  slot:config.slots[Math.floor(i/5)%config.slots.length],
  finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4]
 }));
 core.add(snapshot,match,G);
 validation.add(checks,match,G,root.OfficeTechniqueBackgrounds);
}
const result=core.report(snapshot,G);
const verified=validation.finish(checks);
const summary={schema:'office-phase2-grapple-audit-v1',config,graphCoverage:result.nodeCoverage,
 graphCoverageRequired:90,grappling:result.grappling,
 validation:{pass:verified.pass,hardErrors:verified.hardErrors,errorCodes:verified.errorCodes,
  examples:verified.examples},graph:result.graph};
process.stdout.write(JSON.stringify(summary,null,2)+'\n');
process.stderr.write('Phase 2 audit: '+count+' matches, '+result.nodeCoverage.toFixed(1)+
 '% graph coverage, '+result.grappling.coveredMoves+'/'+result.grappling.eligibleMoves+
 ' named grapples, '+result.grappling.attempts+' attempts, '+verified.hardErrors+' validation errors\n');
if(!verified.pass||result.grappling.invalid)process.exitCode=1;
// Coverage shortfall is explicitly reported but does not suppress the JSON evidence;
// the existing catalogue suite retains its independent hard 90% gate.
