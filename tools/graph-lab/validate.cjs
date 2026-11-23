#!/usr/bin/env node
'use strict';
// Phase 9: reproducible, independent Graph Lab evidence report.
// node tools/graph-lab/validate.cjs --count 120 > phase9-report.json
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('./core.js'),validator=require('./validation.js');
const args=process.argv.slice(2);
const at=args.indexOf('--count');
const count=at>=0?Number(args[at+1]):120;
if(!Number.isInteger(count)||count<1||count>1500)throw Error('count must be 1 to 1500');
const root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../assets/js',name),'utf8'),
 {window:root,Math,Date,JSON,console},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,G=root.OfficeMatch.GRAPH,roster=lab.roster(D),out=validator.create(G);
const baseline=lab.empty(G,{count,rotation:'roster',seed:90021});
for(let i=0;i<count;i++){
 const w=roster[i%roster.length],f=roster[(i*7+19)%roster.length];
 const options=lab.makeOptions(D,{
  wid:w.id,rid:f.id===w.id?roster[(i+1)%roster.length].id:f.id,
  seed:90021+i*41,plan:['technical','story','brawl','spots','safe'][i%5],
  finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],
  slot:i%2?'main':'mid'});
 const match=lab.runMatch(root,options);
 validator.add(out,match,G,root.OfficeTechniqueBackgrounds);
 lab.add(baseline,match,G);
}
const report={schema:'office-phase9-evidence-v1',graph:G.validate(),validation:validator.finish(out),
  coverage:lab.report(baseline,G)};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(!report.validation.pass)process.exitCode=1;
