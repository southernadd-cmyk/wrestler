#!/usr/bin/env node
'use strict';
// Read-only Phase 2 diagnosis: why each target technique isn't selected in
// ordinary matches. Never modifies the production match-engine source.
// node tools/graph-lab/grapple-reachability-diagnostic.cjs 1000 > diagnosis.json
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('./core.js');
const count=Number(process.argv[2]||1000);
if(!Number.isSafeInteger(count)||count<1||count>5000)
 throw Error('count must be a positive integer <= 5000');
const directory=path.resolve(__dirname,'../../assets/js');
const files=['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-catalog.js','graph-narration.js','match-graph.js','match-commentary.js','match-engine.js'];
const code=files.map(name=>fs.readFileSync(path.join(directory,name),'utf8'));
const anchor='  const weights=new Map();\n  for(const [id,w] of selected)';
const injection=String.raw`  // Diagnostic only; injected into a temporary in-memory copy of the engine.
  // Collect opportunities before weighting, with no RNG or match-state writes.
  if(root.__grappleDiagnostics){
   for(const id of GRAPPLE_PILOT){
    const nd=A[id],required=PHYSICAL_GRIP_MOVES[id],ph=g.physical;
    const actual=ph?.grip;
    const attacker=p.control==='f'?M.f:M.w;
    const defender=p.control==='f'?M.w:M.f;
    const energy=costOf(id);
    const capacity=fighter(attacker).kg+Math.max(-5,((attacker.ring||60)-60)*.23);
    let reason='legal';
    if(required&&(!actual||ph?.v!==1))reason='no-grip';
    else if(required&&actual.type!==required)reason='wrong-grip';
    else if(required&&actual.side!==p.control)reason='wrong-owner';
    else if(required&&M.t-actual.at>20)reason='stale-grip';
    else if(nd.after&&M.t/M.len<nd.after)reason='too-early';
    else if(energy>=2.2&&stamina<16+energy*3.2)reason='low-stamina';
    else if(nd.lift!==null&&fighter(defender).kg>capacity+nd.lift)reason='weight-limit';
    else if(nd.requires!==p.position)reason='wrong-position';
    else if(M.len-M.t<10)reason='last-tick';
    else if(!isValid(M,id))reason='other-guard';
    const offered=selected.filter(x=>x[0]===id);
    root.__grappleDiagnostics({id,reason,offered:offered.length,
     rawWeight:offered.reduce((sum,x)=>sum+x[1],0),
     gripSource:actual?.source||null,arc:g.arc,plan:M.planId,
     seed:M.o.seed,position:p.position,
     fraction:M.t/Math.max(1,M.len)});
   }
  }
`;
if(code[4].split(anchor).length!==2)throw Error('Diagnostic anchor changed. Review before use.');
const selectAnchor='  const candidates=validPool(M),id=pick(M,candidates);';
if(code[4].split(selectAnchor).length!==2)throw Error('Selection diagnostic anchor changed.');
const edited=code[4].replace(anchor,injection+anchor).replace(selectAnchor,
 selectAnchor+'\n  if(root.__grappleSelection)root.__grappleSelection(candidates,id);');
const results=new Map(),selectionStats=new Map();
const recordChoice=(pool,picked)=>{
 const sum=pool.reduce((acc,row)=>acc+row[1],0);
 for(const [id,weight] of pool){
  if(!id.startsWith('sx_')&&!id.startsWith('pw_')&&
     id!=='sm_sleeper'&&id!=='sm_ankle_lock'&&id!=='nk_snap_ddt')continue;
  const d=selectionStats.get(id)||{weightedOffers:0,expectedSelections:0,
    chosen:0,maxProbability:0};
  const probability=sum>0?weight/sum:0;
  d.weightedOffers++;
  d.expectedSelections+=probability;
  d.maxProbability=Math.max(d.maxProbability,probability);
  if(picked===id)d.chosen++;
  selectionStats.set(id,d);
 }
};
let steps=0;
function probe(row){
 let d=results.get(row.id);
 if(!d){d={id:row.id,checks:0,reasons:{},legal:0,offeredLegal:0,
  unofferedLegal:0,offeredWeight:0,attempts:0,outcomes:{},
  legalByPlan:{},legalByArc:{},setupSources:{}};results.set(row.id,d);}
 d.checks++;d.reasons[row.reason]=(d.reasons[row.reason]||0)+1;
 if(row.reason==='legal'){
  d.legal++;d.legalByPlan[row.plan]=(d.legalByPlan[row.plan]||0)+1;
  d.legalByArc[row.arc]=(d.legalByArc[row.arc]||0)+1;
  if(row.offered){d.offeredLegal++;d.offeredWeight+=row.rawWeight;}
  else d.unofferedLegal++;
  if(row.gripSource)d.setupSources[row.gripSource]=(d.setupSources[row.gripSource]||0)+1;
 }
 if(row.id==='sx_vertical')steps++;
}
function load(engine,monitor){
 const root={__grappleDiagnostics:monitor?probe:undefined,
  __grappleSelection:monitor?recordChoice:undefined};
 files.forEach((name,i)=>vm.runInNewContext(i===4?engine:code[i],{
  window:root,Math,Date,JSON,console},{filename:name}));
 root.OfficeRosterV4.enableProfiles();
 return root;
}
const instrumented=load(edited,true),baseline=load(code[4],false);
const D=instrumented.OfficeData,people=lab.roster(D),G=instrumented.OfficeMatch.GRAPH;
function options(i){
 const w=people[i%people.length],f=people[(i*7+19)%people.length];
 return lab.makeOptions(D,{wid:w.id,
  rid:f.id===w.id?people[(i+1)%people.length].id:f.id,
  seed:90021+i*41,plan:['technical','story','brawl','spots','safe'][i%5],
  slot:['opener','mid','main'][Math.floor(i/5)%3],
  finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4]});
}
const parityFailures=[],seenNodes=new Set();
for(let i=0;i<count;i++){
 const input=options(i);
 const match=lab.runMatch(instrumented,input);
 for(const event of match.graph?.events||[])if(G.A[event.id])seenNodes.add(event.id);
 for(const a of match.graph?.grappleAttempts||[]){
  const record=results.get(a.id);
  if(!record)continue;
  record.attempts++;
  record.outcomes[a.outcome]=(record.outcomes[a.outcome]||0)+1;
 }
 if(i<Math.min(10,count)){
  const original=lab.runMatch(baseline,options(i));
  if(JSON.stringify(match.graph.events)!==JSON.stringify(original.graph.events)||
   JSON.stringify(match.log)!==JSON.stringify(original.log)||
   match.final.stars!==original.final.stars)
   parityFailures.push(input.seed);
 }
}
const moves=[...results.values()].map(d=>({
 ...d,avgRawOfferWeight:d.offeredLegal?Number((d.offeredWeight/d.offeredLegal).toFixed(3)):0,
 weightedOffers:selectionStats.get(d.id)?.weightedOffers||0,
 expectedSelections:Number((selectionStats.get(d.id)?.expectedSelections||0).toFixed(3)),
 pickedSelections:selectionStats.get(d.id)?.chosen||0,
 maxSelectionProbability:Number((selectionStats.get(d.id)?.maxProbability||0).toFixed(4))
})).sort((a,b)=>a.attempts-b.attempts||a.id.localeCompare(b.id));
const noAttempts=moves.filter(x=>!x.attempts);
const unseen=Object.keys(G.A).filter(id=>!seenNodes.has(id));
const unseenByType={},unseenByFamily={};
for(const id of unseen){
 const n=G.A[id],parent=n.counterOf||n.blockOf;
 const target=parent&&G.GRAPPLE_PILOT.includes(parent);
 const sp=parent&&G.SUPERPLEX_PILOT.includes(parent);
 const category=target?(n.counterOf?'target-counter':'target-block'):
  sp?(n.counterOf?'superplex-counter':'superplex-block'):
  n.counterOf?'other-counter':n.blockOf?'other-block':'action';
 unseenByType[category]=(unseenByType[category]||0)+1;
 const family=n.family||'base';
 unseenByFamily[family]=(unseenByFamily[family]||0)+1;
}
const graphCoverage=Number((100*seenNodes.size/Object.keys(G.A).length).toFixed(2));
const report={schema:'office-phase2-grapple-diagnostic-v1',bouts:count,steps,
 graphCoverage,graphNodes:Object.keys(G.A).length,
 unseenGraphNodes:unseen,unseenByType,unseenByFamily,
 targetMoves:G.GRAPPLE_PILOT.length,attemptedMoves:moves.length-noAttempts.length,
 noAttemptIds:noAttempts.map(x=>x.id),parityFailures,
 note:'Reasons are evaluated at each selection tick in guard order, not independent exhaustive causes.',
 moves};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
process.stderr.write('Grapple diagnostic: '+count+' bouts; attempted '+report.attemptedMoves+
 '/'+report.targetMoves+'; parity mismatches '+parityFailures.length+
 '; absent: '+noAttempts.map(d=>d.id).join(', ')+'\n');
for(const d of noAttempts)
 process.stderr.write('  '+d.id+': '+JSON.stringify({
  legal:d.legal,offered:d.offeredLegal,notOffered:d.unofferedLegal,
  expectedSelections:d.expectedSelections,picked:d.pickedSelections,
  maxSelectionProbability:d.maxSelectionProbability,
  causes:Object.entries(d.reasons).sort((a,b)=>b[1]-a[1]).slice(0,7),
  byPlan:d.legalByPlan,gripSources:d.setupSources})+'\n');
process.stderr.write('  Graph node coverage: '+graphCoverage+'%; unseen '+unseen.length+
 ' by type '+JSON.stringify(unseenByType)+'\n');
if(parityFailures.length)process.exitCode=1;
