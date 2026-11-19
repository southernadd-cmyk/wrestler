#!/usr/bin/env node
'use strict';
// Frozen baseline suite: observe the real match engine without changing it.
// CLI: capture > current.json ; compare current.json [frozen-reference.json]
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const SCHEMA='office-graph-baseline-suite-v1';
const cases=Object.freeze([
 {id:'story',label:'Roster / storytelling',count:250,seed:5101,rotation:'roster',plan:'story',slot:'mid',finish:'win_clean',wid:'juno',rid:'rex'},
 {id:'technical',label:'Roster / technical',count:250,seed:16001,rotation:'roster',plan:'technical',slot:'mid',finish:'win_clean',wid:'juno',rid:'rex'},
 {id:'brawl',label:'Roster / brawl',count:250,seed:26001,rotation:'roster',plan:'brawl',slot:'feature',finish:'win_dirty',wid:'juno',rid:'rex'},
 {id:'spectacle',label:'Roster / spectacle',count:250,seed:36001,rotation:'roster',plan:'spots',slot:'main',finish:'lose_protected',wid:'juno',rid:'rex'},
 {id:'juno-rex',label:'Juno Stark / Rex Titan',count:100,seed:46001,rotation:'fixed',plan:'technical',slot:'mid',finish:'win_clean',wid:'juno',rid:'rex'},
 {id:'bao-theo',label:'Bao Merrick / Theo Voss',count:100,seed:56001,rotation:'fixed',plan:'technical',slot:'feature',finish:'lose_clean',wid:'bao',rid:'theo'}
]);
const REFERENCE=path.join(__dirname,'graph-lab','baselines','reference-v1.json');
const fields=['avgStars','actionEvents','nodeCoverage','edgeCoverage','visitedNodes','visitedEdges','counters','blocks'];
const round=n=>Math.round(n*100)/100;
function captureOne(config){
 const args=Object.entries(config).filter(([k])=>k!=='id'&&k!=='label').flatMap(([k,v])=>['--'+k,String(v)]);
 const output=cp.execFileSync(process.execPath,[path.join(__dirname,'graph-baseline.cjs'),...args],{
   encoding:'utf8',maxBuffer:8*1024*1024,timeout:120000
 });
 const report=JSON.parse(output);
 if(report.schema!=='office-graph-lab-v1'||report.bouts!==config.count)throw Error('Match runner output invalid: '+config.id);
 return {id:config.id,label:config.label,parameters:{...config},report};
}
function capture(configurations=cases){
 const scenarios=configurations.map(captureOne);
 return {schema:SCHEMA,source:'Real OfficeMatch engine; fixed seeds; frozen scenarios',totalBouts:scenarios.reduce((a,s)=>a+s.report.bouts,0),scenarios};
}
function read(file){
 const obj=JSON.parse(fs.readFileSync(file,'utf8'));
 if(obj?.schema!==SCHEMA||!Array.isArray(obj.scenarios))throw Error('Invalid graph baseline suite: '+file);
 return obj;
}
function compare(reference,current){
 if(reference.schema!==SCHEMA||current.schema!==SCHEMA||reference.scenarios.length!==current.scenarios.length)
  throw Error('Incompatible baseline suites: create an explicitly versioned new reference.');
 const rows=[],critical=[],warnings=[];
 let changed=false;
 for(let i=0;i<reference.scenarios.length;i++){
  const previous=reference.scenarios[i],newer=current.scenarios[i];
  if(previous.id!==newer.id||JSON.stringify(previous.parameters)!==JSON.stringify(newer.parameters))
   throw Error('Scenario definitions differ: '+(newer.id||i)+'; must compare like-for-like runs.');
  const a=previous.report,b=newer.report;
  if(a.schema!=='office-graph-lab-v1'||b.schema!=='office-graph-lab-v1'||a.bouts!==b.bouts||b.bouts!==newer.parameters.count)
   throw Error('Invalid sample sizes or report schema in '+newer.id);
  const diffs=Object.fromEntries(fields.map(k=>{
   if(!Number.isFinite(a[k])||!Number.isFinite(b[k]))throw Error('Invalid '+k+' in '+newer.id);
   return [k,round(b[k]-a[k])];
  }));
  const sizeChanged=['nodes','edges','arcs'].some(k=>a.graph[k]!==b.graph[k]);
  const distributionChanged=['families','topNodes','finishRoutes','outcomes','topSequences'].some(k=>JSON.stringify(a[k]||[])!==JSON.stringify(b[k]||[]));
  const rowChanged=sizeChanged||distributionChanged||Object.values(diffs).some(x=>x!==0);
  if(rowChanged)changed=true;
  if((b.graph.errors||[]).length)critical.push(newer.id+': graph validation errors '+b.graph.errors.length);
  if((b.timingErrors||[]).length)critical.push(newer.id+': timing violations '+b.timingErrors.length);
  if((b.unknownEvents||[]).length)critical.push(newer.id+': unexpected action events '+b.unknownEvents.length);
  if(b.actionEvents<=0||b.bouts<=0)critical.push(newer.id+': no match events recorded');
  if(sizeChanged||Math.abs(diffs.nodeCoverage)>=2||Math.abs(diffs.edgeCoverage)>=1||Math.abs(diffs.avgStars)>=.2)
   warnings.push(newer.id+': graph size, reach or rating moved materially');
  const former=Object.fromEntries((a.families||[]).map(x=>[x.id,x.hits]));
  const latest=Object.fromEntries((b.families||[]).map(x=>[x.id,x.hits]));
  const familyChanges=[...new Set([...Object.keys(former),...Object.keys(latest)])]
   .map(id=>({id,diff:(latest[id]||0)-(former[id]||0)})).filter(x=>x.diff!==0)
   .sort((x,y)=>Math.abs(y.diff)-Math.abs(x.diff)||x.id.localeCompare(y.id)).slice(0,3);
  rows.push({id:newer.id,label:newer.label,bouts:b.bouts,before:a,after:b,diffs,sizeChanged,distributionChanged,rowChanged,familyChanges});
 }
 return {rows,critical,warnings,changed};
}
const sign=n=>n>0?'+'+n:String(n);
function summary(result){
 const lines=[
  '## The Office — automated match graph baseline',
  '',
  'Fixed seeds; actual OfficeMatch engine; 1,200 bouts across four roster styles and two fixed rivalries. Reference is frozen, never overwritten automatically.',
  '',
  '| Scenario | Bouts | Nodes | Edges | Nodes seen | Linked edges seen | Mean stars | Counters / 100 |',
  '|:--|--:|--:|--:|--:|--:|--:|--:|'
 ];
 for(const r of result.rows){
  const a=r.before,b=r.after;
  const show=(v,d,decimal=1)=>Number(v).toFixed(decimal)+(d?' ('+sign(round(d))+')':'');
  const c100=round(b.counters*100/b.bouts),oldC100=round(a.counters*100/a.bouts);
  lines.push('| '+r.label+' | '+b.bouts+' | '+b.graph.nodes+(b.graph.nodes===a.graph.nodes?'':' (changed)')+
   ' | '+b.graph.edges+(b.graph.edges===a.graph.edges?'':' (changed)')+
   ' | '+show(b.nodeCoverage,r.diffs.nodeCoverage)+'% | '+show(b.edgeCoverage,r.diffs.edgeCoverage)+
   '% | '+show(b.avgStars,r.diffs.avgStars,2)+' | '+show(c100,c100-oldC100)+' |');
 }
 lines.push('','**Result:** '+(result.changed?'Observed differences — review before changing the reference.':'Identical to the frozen reference.'),'');
 if(result.warnings.length)lines.push('### Changes to investigate',...result.warnings.map(x=>'- '+x),'');
 for(const r of result.rows)if(r.familyChanges.length)
  lines.push('- **'+r.label+' family frequencies:** '+r.familyChanges.map(x=>x.id+' '+sign(x.diff)).join(', '));
 const pilotRows=result.rows.filter(r=>Array.isArray(r.after.pilotTransitions));
  if(pilotRows.length){
   lines.push('','### Phase 3 observed technique sequences','',
    'Counts reflect consecutive **actual match events** matching curated links, not proof of which graph picker branch was used.','',
    '| Scenario | Curated pairs observed | Event-pair occurrences | Most frequent |',
    '|:--|--:|--:|:--|');
   for(const r of pilotRows){
    const links=r.after.pilotTransitions;
    const hits=links.reduce((total,x)=>total+x.hits,0);
    const seen=links.filter(x=>x.hits>0).length;
    const top=links.filter(x=>x.hits>0).sort((a,b)=>b.hits-a.hits).slice(0,3)
     .map(x=>x.from+' → '+x.to+' ('+x.hits+')').join('; ')||'None observed';
    lines.push('| '+r.label+' | '+seen+'/'+links.length+' | '+hits+' | '+top+' |');
   }
   const total=pilotRows.reduce((n,r)=>n+r.after.pilotTransitions.reduce((m,x)=>m+x.hits,0),0);
   if(total===0)lines.push('','**Review needed:** no curated event pairs appeared in the seeded sample. Physical validity alone is not sufficient.');
  }
  const phase5Rows=result.rows.filter(row=>Array.isArray(row.after.phase5Transitions));
  if(phase5Rows.length){
   lines.push('','### Phase 5 new technique sequences','',
    'Consecutive **actual match-event pairs**, not proof each was picked via an added edge.','',
    '| Scenario | New pairs observed | Pair occurrences | Most frequent new pair |',
    '|:--|--:|--:|:--|');
   for(const row of phase5Rows){
    const links=row.after.phase5Transitions;
    const hits=links.reduce((n,link)=>n+link.hits,0);
    const seen=links.filter(link=>link.hits>0).length;
    const top=links.filter(link=>link.hits>0).sort((a,b)=>b.hits-a.hits)[0];
    lines.push('| '+row.label+' | '+seen+'/'+links.length+' | '+hits+' | '+
     (top?top.from+' → '+top.to+' ('+top.hits+')':'None observed')+' |');
   }
   if(phase5Rows.every(row=>row.after.phase5Transitions.every(link=>link.hits===0)))
    lines.push('','**REVIEW:** no new Phase 5 transitions observed in this fixed-seed sample.');
  }
  if(result.critical.length)lines.push('','### Invalid run',...result.critical.map(x=>'- '+x));
 lines.push('','Linked-edge reach is a conservative consecutive-event proxy. Arc jumps do not count. A low value is not automatically an error.');
 return lines.join('\n')+'\n';
}
function main(argv=process.argv.slice(2)){
 if(argv[0]==='capture'){
  process.stdout.write(JSON.stringify(capture(),null,2)+'\n');
  return;
 }
 if(argv[0]==='compare'){
  const current=argv[1],reference=argv[2]||REFERENCE;
  if(!current)throw Error('Usage: compare current.json [reference.json]');
  if(!fs.existsSync(reference)){
   console.error('Baseline reference missing. Review the captured data and commit it once.');
   console.log('GRAPH_BASELINE_JSON_BEGIN');
   console.log(fs.readFileSync(current,'utf8'));
   console.log('GRAPH_BASELINE_JSON_END');
   process.exitCode=2;
   return;
  }
  const r=compare(read(reference),read(current)),message=summary(r);
  process.stdout.write(message);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,message);
  if(r.critical.length)process.exitCode=1;
  return;
 }
 throw Error('Usage: capture > current.json OR compare current.json [reference.json]');
}
if(require.main===module)try{main()}catch(e){console.error('Graph baseline suite: '+e.message);process.exitCode=1}
module.exports={SCHEMA,cases,captureOne,capture,read,compare,summary,main};
