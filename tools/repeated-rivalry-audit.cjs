#!/usr/bin/env node
'use strict';
/*
 * Five-meeting rivalry audit: read-only headless simulation of the ACTUAL
 * OfficeMatch engine. We measure variety, not claim to judge narrative quality.
 * No career state is written and no reference file is modified.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('./graph-lab/core.js');
const SCRIPTS=Object.freeze(['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-catalog.js','graph-narration.js','match-graph.js','match-commentary.js','match-engine.js']);
const SCHEMA='office-five-meeting-audit-v1';
const FIXTURES=Object.freeze([
 {id:'catch-v-general',label:'Catch vs general',wid:'juno',rid:'rex',plan:'technical',slot:'feature',seed:47101},
 {id:'judo-v-catch',label:'Judo vs catch',wid:'bao',rid:'theo',plan:'technical',slot:'feature',seed:57101},
 {id:'lucha-v-general',label:'Lucha vs general',wid:'nico',rid:'rex',plan:'spots',slot:'feature',seed:67101},
 {id:'hybrid-v-catch',label:'Hybrid vs catch',wid:'marisol',rid:'theo',plan:'story',slot:'mid',seed:77101}
]);
const FINISHES=Object.freeze(['win_clean','lose_protected','win_dirty','lose_clean','win_clean']);
function engine(){
 const root={};
 for(const file of SCRIPTS){
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','assets','js',file),'utf8'),{window:root,console,Date,Math,JSON},{filename:file});
 }
 root.OfficeRosterV4.enableProfiles();
 return root;
}
const pct=(x,total)=>total?Math.round(1000*x/total)/10:0;
const mean=values=>values.length?Math.round(values.reduce((sum,x)=>sum+x,0)/values.length*100)/100:0;
const counts=items=>{
 const record={};
 for(const item of items)record[item]=(record[item]||0)+1;
 return record;
};
function ngrams(items,n){
 const out=[];
 for(let i=0;i+n<=items.length;i++)out.push(items.slice(i,i+n).join(' > '));
 return out;
}
function overlap(a,b){
 const A=new Set(a),B=new Set(b);
 return pct([...A].filter(x=>B.has(x)).length,new Set([...A,...B]).size);
}
function execute(root,fixture,meeting,enabled){
 const background=root.OfficeTechniqueBackgrounds;
 // Only difference between these paired runs: apply or withhold technical-school bias.
 root.OfficeTechniqueBackgrounds=enabled?background:null;
 try{
  const seed=fixture.seed+meeting*173,finish=FINISHES[meeting%FINISHES.length];
  const options=lab.makeOptions(root.OfficeData,{...fixture,seed,finish});
  // This is a CONTROLLED RIVALRY FIXTURE, not accumulated career-world history.
  // Identical inputs are passed to the schooling-enabled and neutral A/B runs.
  options.feudHeat=12+meeting*13;
  options.memory={rivalry:Math.max(10,75-meeting*14),trust:60,
   ...(meeting>0?{recall:'They have met before; both remember the previous result.'}:{})};
  const match=lab.runMatch(root,options),graph=root.OfficeMatch.GRAPH;
  if(!match.final||!match.done||match.graph?.outcome?.id!==finish)
   throw Error(fixture.id+' meeting '+(meeting+1)+': match failed or contracted finish changed');
  const actions=(match.graph?.events||[]).filter(e=>graph.A[e.id]).map(e=>e.id);
  const trained=actions.filter(id=>graph.TECHNIQUE_PILOT.some(link=>link.to===id));
  const families=actions.map(id=>graph.A[id]?.family||'core');
  const reversals=actions.filter(id=>graph.A[id]?.counterOf).length;
  const snapshot=lab.empty(graph,{fixture:fixture.id,meeting:meeting+1,seed});
  lab.add(snapshot,match,graph);
  if(snapshot.timingErrors.length||Object.keys(snapshot.unknownEvents).length)
   throw Error(fixture.id+' meeting '+(meeting+1)+': invalid action timing or unknown event');
  return {
   number:meeting+1,seed,finish,route:match.final.finishRoute||'(none)',
   stars:match.final.stars,actionCount:actions.length,uniqueActions:new Set(actions).size,
   reverseCount:reversals,trainedHits:trained.length,
   actions,triples:ngrams(actions,3),families:counts(families),
   signature:actions.join('|'),texture:match.graph?.texture||'unknown'
  };
 }finally{root.OfficeTechniqueBackgrounds=background;}
}
function analyse(meetings){
 const union=new Set(),grams=new Set(),novelty=[];
 for(const row of meetings){
  const newMoves=new Set(row.actions.filter(id=>!union.has(id)));
  const newTriples=new Set(row.triples.filter(id=>!grams.has(id)));
  novelty.push({meeting:row.number,newMoves:newMoves.size,newTriples:newTriples.size});
  for(const id of row.actions)union.add(id);
  for(const id of row.triples)grams.add(id);
 }
 const overlapping=[],replayed=[];
 for(let i=0;i<meetings.length;i++)for(let j=i+1;j<meetings.length;j++){
  const left=meetings[i],right=meetings[j];
  overlapping.push({left:left.number,right:right.number,actionOverlap:overlap(left.actions,right.actions),
   tripleOverlap:overlap(left.triples,right.triples)});
  if(left.signature===right.signature)replayed.push([left.number,right.number]);
 }
 const triples=counts(meetings.flatMap(x=>x.triples));
 const topTriples=Object.entries(triples).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
  .slice(0,5).map(([name,hits])=>({name,hits}));
 const families=counts(meetings.flatMap(x=>Object.entries(x.families).flatMap(([key,count])=>Array(count).fill(key))));
 return {
  actionVocabulary:union.size,uniqueTriples:grams.size,
  avgActions:mean(meetings.map(x=>x.actionCount)),avgStars:mean(meetings.map(x=>x.stars)),
  avgActionOverlap:mean(overlapping.map(x=>x.actionOverlap)),
  avgTripleOverlap:mean(overlapping.map(x=>x.tripleOverlap)),
  exactClones:replayed,novelty,
  counters:meetings.reduce((n,x)=>n+x.reverseCount,0),
  trainedHits:meetings.reduce((n,x)=>n+x.trainedHits,0),
  dominantTriples:topTriples,topFamilies:Object.entries(families).sort((a,b)=>b[1]-a[1]).slice(0,5),
  routes:[...new Set(meetings.map(x=>x.route))]
 };
}
function run({fixtures=FIXTURES,meetings=5}={}){
 if(!Number.isInteger(meetings)||meetings<2||meetings>5)throw Error('Meetings must be between 2 and 5');
 const root=engine(),graph=root.OfficeMatch.GRAPH,stats=graph.validate();
 if(stats.errors.length||!root.OfficeTechniqueBackgrounds.validate(root.OfficeData,graph,root.OfficeTechniqueRegistry).valid)
  throw Error('Shipped graph or technique registry failed validation');
 const warnings=[],errors=[],series=[];
 for(const f of fixtures){
  const on=[],off=[];
  for(let i=0;i<meetings;i++){
   on.push(execute(root,f,i,true));off.push(execute(root,f,i,false));
  }
  const current=analyse(on),neutral=analyse(off);
  const diff=on.filter((row,i)=>row.signature!==off[i].signature).length;
  const entry={id:f.id,label:f.label,schoolW:root.OfficeTechniqueBackgrounds.get(f.wid).label,
   schoolF:root.OfficeTechniqueBackgrounds.get(f.rid).label,
   meetings:on,metrics:current,counterfactual:{
    divergentMatches:diff,schoolEnabledMoves:current.trainedHits,neutralMoves:neutral.trainedHits,
    enabledTripleOverlap:current.avgTripleOverlap,neutralTripleOverlap:neutral.avgTripleOverlap,
    enabledActionOverlap:current.avgActionOverlap,neutralActionOverlap:neutral.avgActionOverlap
   }};
  series.push(entry);
  if(current.exactClones.length)errors.push(f.id+': different seeds produced identical full action sequences: '+JSON.stringify(current.exactClones));
  if(current.avgTripleOverlap>=35)warnings.push(f.id+': elevated repetition of three-move sequences ('+current.avgTripleOverlap+'% overlap)');
  if(current.novelty.slice(1).some(n=>n.newTriples===0))warnings.push(f.id+': at least one later meeting introduced no new 3-move sequences');
  if(diff===0)warnings.push(f.id+': technical-school switch did not change any of these five match sequences');
  if(current.trainedHits===0)warnings.push(f.id+': no Phase 3 school-linked moves appeared in the sample');
 }
 return {
  schema:SCHEMA,kind:'controlled headless fixture; not persistent career evolution',
  meetingsPerPair:meetings,actualMatches:fixtures.length*meetings*2,
  pairs:series,errors,warnings,
  checks:{graphNodes:stats.nodes,graphEdges:stats.edges,graphErrors:stats.errors.length}
 };
}
function markdown(report){
 const lines=[
  '# The Office — five-meeting rivalry variety audit','',
  '**' + report.actualMatches + ' real engine simulations**: '+report.pairs.length+' rival pairs × '+
   report.meetingsPerPair+' encounters × schooling enabled/neutral. Seeds and booked results are fixed.',
  '',
  '**Scope:** a controlled escalating-feud fixture, not five weeks of saved career play. A/B runs hold every other setting constant; variation does not establish human-perceived storytelling quality.',
  '',
  '| Rival pairing | School 1 → School 2 | Unique moves | Mean 3-move overlap | New 3-move chains in meeting 5 | School A/B differences | Curated moves (on / off) |',
  '|:--|:--|--:|--:|--:|--:|--:|'
 ];
 for(const row of report.pairs){
  const m=row.metrics,c=row.counterfactual;
  const last=m.novelty[m.novelty.length-1];
  lines.push('| '+row.label+' | '+row.schoolW+' → '+row.schoolF+' | '+m.actionVocabulary+
   ' | '+m.avgTripleOverlap+'% | '+last.newTriples+' | '+
   c.divergentMatches+'/'+row.meetings.length+' | '+c.schoolEnabledMoves+' / '+c.neutralMoves+' |');
 }
 lines.push('','### Meeting-by-meeting outcomes','',
  '| Pair | Meeting | Seed | Finish | Route | Stars | Moves | New moves | New three-move chains | Counters |',
  '|:--|--:|--:|:--|:--|--:|--:|--:|--:|--:|');
 for(const pair of report.pairs){
  for(const m of pair.meetings){
   const n=pair.metrics.novelty.find(x=>x.meeting===m.number);
   lines.push('| '+pair.label+' | '+m.number+' | '+m.seed+' | '+m.finish+' | '+m.route+
    ' | '+m.stars+' | '+m.actionCount+' | '+n.newMoves+' | '+n.newTriples+
    ' | '+m.reverseCount+' |');
  }
 }
 lines.push('','### Repetition flags and investigative notes','');
 lines.push(...(report.warnings.length?report.warnings.map(x=>'- REVIEW: '+x):['No automated variety flags in this fixed sample.']));
 if(report.errors.length)lines.push(...report.errors.map(x=>'- FAILED: '+x));
 lines.push('',
  '**Interpretation:** a change in move selection is not evidence of rival-specific learning. Commentary tone, agent-room negotiation and persistent relationship progression still require separate end-to-end career tests and human review.',
  '',
  '**Safety:** Every meeting completed with its booked outcome, valid action timings, and no unknown action IDs. No career save or baseline file was modified.');
 return lines.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 if(args.some(x=>!['--json','--quick'].includes(x)))throw Error('Usage: node tools/repeated-rivalry-audit.cjs [--json] [--quick]');
 const report=run(args.includes('--quick')?{fixtures:FIXTURES.slice(0,1),meetings:2}:{});
 process.stdout.write(args.includes('--json')?JSON.stringify(report,null,2)+'\n':markdown(report));
 if(report.errors.length)process.exitCode=1;
}
if(require.main===module)try{main()}catch(e){console.error('Five-meeting rivalry audit:',e.stack||e);process.exitCode=1}
module.exports={SCHEMA,FIXTURES,FINISHES,engine,execute,analyse,run,markdown,overlap,ngrams,main};
