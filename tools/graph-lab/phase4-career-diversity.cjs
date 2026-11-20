#!/usr/bin/env node
'use strict';
// Read-only paired career-soak comparison. Both sides use the original
// deterministic test and real assets. Only the distinct-moves assertion
// is replaced with a JSON report in ephemeral test files on CI runner.
// Neither release test nor engine is modified.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const cp=require('node:child_process');
const {createRequire}=require('node:module');
const folders=process.argv.slice(2);
if(folders.length!==2)throw Error('Usage: node phase4-career-diversity.cjs MAIN_ROOT PR_ROOT');
function scan(dir){
 const full=path.resolve(dir),test=path.join(full,'tests','season-soak.test.cjs');
 let src=fs.readFileSync(test,'utf8');
 const marker="assert.ok(union('moves').size>=700,'a wide range of moves appears across careers: '+union('moves').size);";
 if(src.split(marker).length!==2)throw Error('Season-soak range gate marker changed: '+full);
 const diagnostic="console.log('CAREER_AUDIT_JSON '+JSON.stringify({distinct:union('moves').size,ids:[...union('moves')],runs:runs.map(r=>({seed:r.seed,style:r.style,matches:r.matches,distinct:r.moves.size,ids:[...r.moves]}))}));";
 src=src.replace(marker,diagnostic);
 const tmp=path.join(full,'tests','.phase4-career-debug.cjs');
 let stdout;
 try{
  fs.writeFileSync(tmp,src);
  stdout=cp.execFileSync(process.execPath,[tmp],{cwd:full,encoding:'utf8',
   maxBuffer:8*1024*1024,timeout:180000});
 }finally{try{fs.unlinkSync(tmp);}catch{}}
 const row=stdout.split('\n').find(line=>line.startsWith('CAREER_AUDIT_JSON '));
 if(!row)throw Error('No audit output from '+full+': '+stdout.slice(-1000));
 const result=JSON.parse(row.slice('CAREER_AUDIT_JSON '.length));
 const {script}=createRequire(test)('./_source.cjs');
 const cut=script.indexOf('/* THE OFFICE — interface v3');
 const root={addEventListener(){}};
 const store=new Map();
 vm.runInNewContext(script.slice(0,cut),{window:root,console,Date,Math,JSON,
  localStorage:{getItem:k=>store.get(k)||null,
   setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
 result.families={};
 const nodes=root.OfficeMatch.GRAPH.A;
 for(const id of result.ids){
  const family=nodes[id]?.family||'base';
  result.families[family]=(result.families[family]||0)+1;
 }
 return result;
}
const base=scan(folders[0]),pr=scan(folders[1]);
const a=new Set(base.ids),b=new Set(pr.ids);
const lost=base.ids.filter(id=>!b.has(id));
const gained=pr.ids.filter(id=>!a.has(id));
const familyOf=(id,src)=>{const prefix=id.match(/^([a-z]{2})_/)?.[1];return prefix||'base';};
function groups(ids){
 const g={};for(const id of ids){const k=familyOf(id);(g[k]??=[]).push(id);}
 return g;
}
const report={
 base:{distinct:base.distinct,perCareer:base.runs.map(r=>({seed:r.seed,style:r.style,matches:r.matches,distinct:r.distinct})),families:base.families},
 pr:{distinct:pr.distinct,perCareer:pr.runs.map(r=>({seed:r.seed,style:r.style,matches:r.matches,distinct:r.distinct})),families:pr.families},
 lost:{count:lost.length,byFamily:groups(lost)},
 gained:{count:gained.length,byFamily:groups(gained)},
 withinCareer:pr.runs.map((r,i)=>{
  const before=new Set(base.runs[i].ids),now=new Set(r.ids);
  return {seed:r.seed,base:base.runs[i].distinct,pr:r.distinct,
   lost:base.runs[i].ids.filter(id=>!now.has(id)).slice(0,50),
   gained:r.ids.filter(id=>!before.has(id)).slice(0,50)};
 })
};
console.log('BASE '+base.distinct+' unique career moves, PR '+pr.distinct);
console.log('LOST FROM PR '+JSON.stringify(report.lost));
console.log('GAINED ON PR '+JSON.stringify(report.gained));
console.log('CAREER COUNTS '+JSON.stringify(report.withinCareer.map(x=>({seed:x.seed,base:x.base,pr:x.pr}))));
const outfile=path.join(process.cwd(),'phase4-career-soak-diagnostic.json');
fs.writeFileSync(outfile,JSON.stringify(report,null,2)+'\n');
console.log('SAVED '+outfile);
// No release bar changes. This is investigative, not a pass-fail gate.
