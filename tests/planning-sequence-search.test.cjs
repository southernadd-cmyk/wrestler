'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs'),root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficeSheets:S,OfficeMatch:M}=root;
const A=M.GRAPH.A,clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
let rooms=0,targets=0,covered=0,total=0,changed=0,controlChanges=0,guarded=0,banned=0,maxTested=0,maxExpanded=0,truncated=0;const lengths={};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp7a-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const st=R.begin(c,w,f,p,{structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true});
 R.act(st,'plan_'+plan);const before=JSON.stringify(st);
 for(const obj of st.structure.objectives){
  const b=st.structureBoard[obj.id];if(!b?.action||!R.proposalEvidence(st,obj.id,b.action).eligible)continue;
  targets++;
  const result=R.sequenceCandidates(st,obj.id,b.action);
  assert.ok(result.search.tested<=192&&result.search.expanded<=240);
  assert.ok(result.candidates.length<=6);
  maxTested=Math.max(maxTested,result.search.tested);maxExpanded=Math.max(maxExpanded,result.search.expanded);if(result.search.truncated)truncated++;
  if(!result.candidates.length)continue;
  covered++;
  eq(result,R.sequenceCandidates(clone(st),obj.id,b.action));
  const seen=new Set();
  for(const row of result.candidates){
   const {sequence,evidence,difficulty,by}=row;
   const ids=sequence.actions;
   assert.ok(ids.length>=2&&ids.length<=4);assert.equal(new Set(ids).size,ids.length);
   assert.ok(!seen.has(ids.join('|')));seen.add(ids.join('|'));
   assert.equal(ids.at(-1),b.action);assert.equal(evidence.owner,b.owner);assert.equal(evidence.bookedResult,c.finish);
   assert.equal(evidence.execution,'unverified_live_state');
   eq(evidence,R.sequenceEvidence(st,obj.id,b.action,sequence));eq(difficulty,F.sequenceDifficulty(evidence));
   for(let i=1;i<evidence.steps.length;i++)eq(evidence.steps[i-1].exit,evidence.steps[i].entry);
   assert.ok(ids.every(id=>!A[id].counterOf&&!A[id].blockOf&&!A[id].nearfall&&A[id].family!=='pin'));
   for(const side of ['w','f']){
    const single=F.evaluateProposal(st.planningEvidence,st,side,obj.id,b.action);
    const full=F.evaluateProposal(st.planningEvidence,st,side,obj.id,b.action,sequence);
    assert.ok(full.eligible);eq(full.assessment.scores,by[side].scores);
    assert.equal(full.assessment.values.sequenceDifficulty,difficulty.score);
    if(JSON.stringify(single.assessment.scores)!==JSON.stringify(by[side].scores))changed++;
   }
   if(difficulty.components.controlChanges)controlChanges++;
   if(difficulty.components.conditionalSetups)guarded++;
   lengths[ids.length]=(lengths[ids.length]||0)+1;total++;
  }
  // Verify fresh generation reacts to a newly prohibited setup move,
  // not only that individual evidence is rejected.
  const first=result.candidates[0].sequence.actions[0],deny=clone(st);deny.limits.banIds.push(first);
  const next=R.sequenceCandidates(deny,obj.id,b.action);
  assert.ok(next.candidates.every(row=>!row.sequence.actions.includes(first)));banned++;
 }
 assert.equal(JSON.stringify(st),before);rooms++;
}
assert.equal(rooms,80);assert.ok(covered>=targets*.5,'eligible target coverage '+covered+'/'+targets);
assert.ok(lengths[2]>0&&lengths[3]>0&&lengths[4]>0,'multi-length discovery');
assert.ok(changed>0&&banned>0);
console.log('PASS MP7A: '+rooms+' rooms; '+covered+'/'+targets+' targets with fragments; '+total+' shortlisted chains; lengths '+JSON.stringify(lengths)+'; '+controlChanges+' control changes; '+guarded+' guarded; '+changed+' changed fuzzy assessments; '+banned+' ban rechecks; max work '+maxExpanded+' expanded/'+maxTested+' validated; '+truncated+' bounded searches; exact replay and no mutation.');
