#!/usr/bin/env node
'use strict';
// Six real seeded Graph Lab scenarios. No match engine or save changes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('./core.js'),validation=require('./validation.js');
const presets=require('./review-scenarios.js');
const files=['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-graph.js','match-commentary.js','match-engine.js'];
function load(){
  const root={};
  for(const file of files)vm.runInNewContext(
    fs.readFileSync(path.join(__dirname,'../../assets/js',file),'utf8'),
    {window:root,console,Date,Math,JSON},{filename:file});
  root.OfficeRosterV4.enableProfiles();
  return root;
}
function capture(count=100){
  if(!Number.isSafeInteger(count)||count<1||count>1000)throw Error('Expected 1..1000 matches per scenario');
  const root=load(),D=root.OfficeData,G=root.OfficeMatch.GRAPH,R=root.OfficeTechniqueRegistry;
  const registry=R.validate(G);
  if(!registry.valid)throw Error('Invalid technique registry: '+registry.errors.join('; '));
  const all=Object.values(G.CATALOG.F).flatMap(f=>f.moves.map(m=>m[0]));
  if(all.length!==340||registry.proposals!==325)throw Error('Unexpected catalogue metadata: '+all.length+'/'+registry.proposals);
  const roster=lab.roster(D),authored=new Set(all),results=[];
  for(const test of presets.cases){
    const config={...test,count},snapshot=lab.empty(G,config),evidence=validation.create(G);
    let metadataEvents=0,performanceEvents=0,nearfalls=0,botches=0,spots=0,spotHits=0;
    let qSum=0, qN=0, crowdPeak=0;const partSums={};
    const seenTechniques=new Set(),seenPerformance=new Set();
    for(let i=0;i<count;i++){
      const params={...config,seed:config.seed+i*37};
      if(config.rotation==='roster'){
        const w=roster[i%roster.length],f=roster[(i*7+19)%roster.length];
        params.wid=w.id;
        params.rid=f.id===w.id?roster[(i+1)%roster.length].id:f.id;
      }
      const match=lab.runMatch(root,lab.makeOptions(D,params));
      lab.add(snapshot,match,G);
      validation.add(evidence,match,G,root.OfficeTechniqueBackgrounds);
      nearfalls+=match.nearfalls||0;
      botches+=match.botches||0;
      spots+=match.spots||0;spotHits+=match.spotHits||0;
      qSum+=match.qSum||0;qN+=match.qN||0;crowdPeak+=match.crowdPeak||0;
      for(const [key,,amount] of match.final?.starParts||[])partSums[key]=(partSums[key]||0)+amount;
      for(const event of match.graph?.events||[]){
        if(!authored.has(event.id))continue;
        if(R.get(event.id)){metadataEvents++;seenTechniques.add(event.id);}
        else {performanceEvents++;seenPerformance.add(event.id);}
      }
    }
    const report=lab.report(snapshot,G),valid=validation.finish(evidence);
    results.push({id:test.id,label:test.label,config,bouts:report.bouts,
      meanStars:report.avgStars,actionEvents:report.actionEvents,
      nodeCoverage:report.nodeCoverage,edgeCoverage:report.edgeCoverage,
      uniqueMatchSequences:valid.distinctMatchSequences,
      hardErrors:valid.hardErrors,validationExamples:valid.examples,
      unknownEvents:report.unknownEvents,timingErrors:report.timingErrors,
      grappleInvalid:report.grappling.invalid,
      environment:report.environment,
      flying:report.flying,
      metadataEvents,performanceEvents,distinctTechniques:seenTechniques.size,
      distinctPerformanceBeats:seenPerformance.size,
      nearfalls,botches,spots,spotHits,
      meanQuality:qN?+(qSum/qN).toFixed(2):0,
      meanPeakCrowd:+(crowdPeak/count).toFixed(2),
      starComponents:Object.fromEntries(Object.entries(partSums)
        .map(([key,total])=>[key,+(total/count).toFixed(3)])),
      counters:report.counters,blocks:report.blocks,
      topFamilies:report.families.slice(0,8),finishRoutes:report.finishRoutes,
      phase9:report.phase9,
      graph:report.graph});
  }
  return {schema:'office-graph-lab-review-v05',countPerScenario:count,
    totalBouts:count*presets.cases.length,registry:{reviewed:registry.proposals,authored:registry.authored},
    scenarios:results};
}
function failures(result){
  return result.scenarios.flatMap(s=>{
    const errors=[];
    if(s.bouts!==result.countPerScenario)errors.push(s.id+': missing match results');
    if(s.hardErrors)errors.push(s.id+': '+s.hardErrors+' mechanical validation errors');
    if(s.unknownEvents.length)errors.push(s.id+': unknown events');
    if(s.timingErrors.length)errors.push(s.id+': timing errors');
    if(s.grappleInvalid)errors.push(s.id+': '+s.grappleInvalid+' invalid grapple attempts');
    if(s.environment?.invalid)errors.push(s.id+': '+s.environment.invalid+' invalid environmental attempts');
    if(s.flying?.invalid)errors.push(s.id+': '+s.flying.invalid+' invalid airborne attempts');
    if(!s.actionEvents||!s.metadataEvents)errors.push(s.id+': no authored technique evidence');
    return errors;
  });
}
function markdown(result){
  const lines=[
    '## The Office — v0.5 Graph Lab match review','',
    'Live OfficeMatch engine; six fixed-seed scenarios, '+result.totalBouts+' completed matches. Registry: '+
      result.registry.reviewed+'/'+result.registry.authored+' authored catalogue IDs. No career saves modified.','',
    '| Scenario | Matches | Stars | Node coverage | Linked edges | Unique tapes | Reviewed move events | Performance beats | Counters | Hard errors |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|'
  ];
  for(const s of result.scenarios){
    lines.push('| '+s.label+' | '+s.bouts+' | '+s.meanStars.toFixed(2)+' | '+s.nodeCoverage+'% | '+s.edgeCoverage+'% | '+
      s.uniqueMatchSequences+' | '+s.metadataEvents+' | '+s.performanceEvents+' | '+s.counters+' | '+s.hardErrors+' |');
  }
  lines.push('','**Committed outside dives:** '+result.scenarios.map(s=>
    s.id+': '+(s.flying.byFamily.dive?.attempts||0)+' attempts / '+
    (s.flying.byFamily.dive?.counter||0)+' counters / '+
    s.flying.invalid+' errors').join('; '),'');
  lines.push('','### Rating-component audit (average contribution per bout)','',
    '| Scenario | Work | Big moments | Crowd | Near falls | Botches | Sequences | Peak crowd | High spots landed/attempted |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...result.scenarios.map(s=>'| '+s.label+' | '+
      ['work','moments','crowd','nearfalls','botches','psychology'].map(k=>
        (s.starComponents[k]||0).toFixed(2)).join(' | ')+
      ' | '+s.meanPeakCrowd.toFixed(1)+' | '+s.spotHits+'/'+s.spots+' |'),
    '','**Phase 6 environmental attempts:** '+result.scenarios.map(s=>
    s.id+': '+s.environment.attempts+' attempts / '+
    s.environment.counter+' counters / '+s.environment.invalid+' errors').join('; '),'',
    '**Mechanical validation:** '+(failures(result).length?'FAILED — '+failures(result).join('; '):'passed'), '',
    'Note: Metadata additions are editorial. This review measures move use, variety and continuity; it does not mean 325 newly implemented match techniques.',
    'Review the exported tape for plausibility. Linked-edge coverage is a conservative observed-adjacency measure, not a full probability audit.','');
  return lines.join('\n');
}
if(require.main===module){
  try{
    const n=process.argv[2]?Number(process.argv[2]):100;
    const report=capture(n);
    process.stdout.write(process.argv.includes('--json')?JSON.stringify(report,null,2)+'\n':markdown(report));
    if(failures(report).length)process.exitCode=1;
  }catch(e){console.error('Graph Lab match review: '+e.stack);process.exitCode=1;}
}
module.exports={load,capture,failures,markdown};
