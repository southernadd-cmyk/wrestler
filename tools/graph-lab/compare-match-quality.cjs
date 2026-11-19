#!/usr/bin/env node
'use strict';
// Reproducible match-quality A/B against the pre-fix Phase 9 commit.
// node tools/graph-lab/compare-match-quality.cjs ./quality-reference > quality-comparison.json
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const revision='bfc9af6306657e59cf400cb3cbb7cb59c3579666';
const prev=path.resolve(process.argv[2]||'quality-reference');
const current=path.resolve(__dirname,'../..');
const names=['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js'];
function load(dir){
 const root={};
 for(const file of names)vm.runInNewContext(
  fs.readFileSync(path.join(dir,'assets/js',file),'utf8'),
  {window:root,Math,Date,JSON,console},{filename:file});
 root.OfficeRosterV4.enableProfiles();
 return {root,data:root.OfficeData,lab:require(path.join(dir,'tools/graph-lab/core.js'))};
}
const old=load(prev),now=load(current);
const plans=['technical','story','brawl','spots','safe'];
function sample(world){
 const {root,data,lab}=world,roster=lab.roster(data),out={};
 for(const plan of plans){
  const r={bouts:0,stars:0,spots:0,spotHits:0,botches:0,offScript:0,
   exhaustedWarnings:0,earlyFinishTeases:0,namedGraphActions:0,below2:0,
   repeatedPhrases3Plus:0,severeRepeatMatches:0};
  for(let i=0;i<100;i++){
   const w=roster[i%roster.length],f=roster[(i*7+19)%roster.length];
   const o=lab.makeOptions(data,{
    wid:w.id,rid:f.id===w.id?roster[(i+1)%roster.length].id:f.id,plan,
    seed:61001+i*53,slot:i%2?'main':'mid',
    finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4]});
   const m=lab.runMatch(root,o),events=m.graph.events;
   const spoken={};
   for(const l of m.log)if(l.text.length>15)
    spoken[l.text]=(spoken[l.text]||0)+1;
   const duplicates=Object.values(spoken);
   r.repeatedPhrases3Plus+=duplicates.filter(n=>n>=3).length;
   r.severeRepeatMatches+=duplicates.some(n=>n>=10)?1:0;
   r.bouts++;r.stars+=m.final.stars;r.spots+=m.spots;r.spotHits+=m.spotHits;
   r.botches+=m.botches;r.below2+=m.final.stars<2;
   r.offScript+=m.log.filter(x=>/off the layout|calling audibles/i.test(x.text)).length;
   r.exhaustedWarnings+=m.log.filter(x=>/tired legs will not cooperate|cannot get their footing/i.test(x.text)).length;
   r.earlyFinishTeases+=events.filter(e=>e.id==='finish_tease'&&e.t/m.len<.55).length;
   r.namedGraphActions+=events.filter(e=>root.OfficeMatch.GRAPH.A[e.id]?.family&&
    !root.OfficeMatch.GRAPH.A[e.id].counterOf&&!root.OfficeMatch.GRAPH.A[e.id].blockOf).length;
  }
  out[plan]={...r,meanStars:+(r.stars/r.bouts).toFixed(3),
   meanNamedGraphActions:+(r.namedGraphActions/r.bouts).toFixed(3)};
 }
 return out;
}
const before=sample(old),after=sample(now);
const delta=Object.fromEntries(plans.map(p=>[p,{
 stars:+(after[p].meanStars-before[p].meanStars).toFixed(3),
 offScript:after[p].offScript-before[p].offScript,
 exhaustedWarnings:after[p].exhaustedWarnings-before[p].exhaustedWarnings,
 repeatedPhrases3Plus:after[p].repeatedPhrases3Plus-before[p].repeatedPhrases3Plus,
 severeRepeatMatches:after[p].severeRepeatMatches-before[p].severeRepeatMatches,
 earlyFinishTeases:after[p].earlyFinishTeases-before[p].earlyFinishTeases,
 botches:after[p].botches-before[p].botches,
 spots:after[p].spots-before[p].spots
}]));
const total=(v,key)=>plans.reduce((n,p)=>n+v[p][key],0);
const checks={
 noEarlyFinishThreats:total(after,'earlyFinishTeases')===0,
 reducedLayoutSpam:total(after,'offScript')<=total(before,'offScript')*.55,
 reducedNarrationRepetition:total(after,'repeatedPhrases3Plus')<=total(before,'repeatedPhrases3Plus')*.6,
 severeSpamRare:total(after,'severeRepeatMatches')<=total(before,'severeRepeatMatches')*.2,
 noExhaustedAutoSpots:total(after,'exhaustedWarnings')===0,
 spotRatingNotWorse:after.spots.meanStars>=before.spots.meanStars-.05,
 meaningfulSpotRiskPreserved:after.spots.botches>=10,
 spotPlanStillRiskier:after.spots.botches>after.technical.botches,
 technicalRatingStability:after.technical.meanStars>=before.technical.meanStars-.12,
 namedMovesNotDisplaced:total(after,'namedGraphActions')>=total(before,'namedGraphActions')*.88
};
const report={schema:'office-quality-ab-v1',revision,method:
 'Same 100 wrestler pairings per plan, with identical seeds, booked finish, show slot and plan',
 before,after,delta,checks,pass:Object.values(checks).every(Boolean)};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(!report.pass){
 process.stderr.write('Match-quality comparison gates failed: '+Object.entries(checks).filter(([,v])=>!v).map(([k])=>k).join(', ')+'\n');
 process.exitCode=1;
}
