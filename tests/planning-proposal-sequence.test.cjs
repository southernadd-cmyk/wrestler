'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficeSheets:S,OfficeMatch:M}=root;
const G=M.GRAPH,A=G.A,clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const simple={v:1,eligible:true,scope:'conditional_fragment',execution:'unverified_live_state',steps:[
 {performer:'w',cost:1,entry:{control:'w',position:'standing'},exit:{control:'w',position:'standing'},guards:[]},
 {performer:'w',cost:1,entry:{control:'w',position:'standing'},exit:{control:'w',position:'standing'},guards:[]}]};
assert.equal(F.sequenceDifficulty(null),null);
assert.equal(F.sequenceDifficulty(simple).score,14);
const hard=clone(simple);hard.steps[1].cost=8;hard.steps[1].exit.position='mat';hard.steps[1].guards=['live_grip'];
assert.ok(F.sequenceDifficulty(hard).score>F.sequenceDifficulty(simple).score);
assert.equal(F.sequenceDifficulty(hard).effortBy.f,0);
const unknown=clone(simple);unknown.steps[0].cost=null;assert.equal(F.sequenceDifficulty(unknown),null);
let rooms=0,valid=0,invalid=0,reversals=0,guards=0,min=100,max=0;
const all=Object.values(A);
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp5d-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const st=R.begin(c,w,f,p,{structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true});
 R.act(st,'plan_'+plan);const before=JSON.stringify(st);
 for(const obj of st.structure.objectives){
  const b=st.structureBoard[obj.id];if(!b?.action||!R.proposalEvidence(st,obj.id,b.action).eligible)continue;
  const opposite=s=>s==='w'?'f':'w';
  const pre=A[b.action].reverse?opposite(b.owner):b.owner;
  const base=F.evaluateProposal(st.planningEvidence,st,'w',obj.id,b.action);
  assert.equal(base.assessment.values.sequenceDifficulty,null);
  const bad={start:{control:pre,position:'standing',down:null},actions:['not_a_move',b.action]};
  assert.equal(F.evaluateProposal(st.planningEvidence,st,'w',obj.id,b.action,bad).eligible,false);
  const disconnected=all.find(n=>!n.next.some(([id])=>id===b.action)&&!n.counterOf&&!n.blockOf&&!n.nearfall);
  if(disconnected){
   const input={start:{control:pre,position:disconnected.requires==='any'?'standing':disconnected.requires,down:disconnected.requires==='mat'?opposite(pre):null},actions:[disconnected.id,b.action]};
   assert.equal(R.sequenceEvidence(st,obj.id,b.action,input).eligible,false);
  }
  for(const n of all.filter(n=>n.next.some(([id,weight])=>id===b.action&&weight>0))){
   const control=n.reverse?opposite(pre):pre;
   const position=n.requires==='any'?'standing':n.requires;
   const input={start:{control,position,down:position==='mat'?opposite(control):null},actions:[n.id,b.action]};
   const ev=R.sequenceEvidence(st,obj.id,b.action,input);
   if(!ev.eligible){invalid++;continue;}
   assert.equal(ev.execution,'unverified_live_state');assert.equal(ev.steps.at(-1).performer,b.owner);
   assert.equal(ev.steps[0].cost,G.costOf(n.id));
   eq(ev.steps[0].exit,ev.steps[1].entry);
   assert.equal(ev.steps[1].cost,G.costOf(b.action));
   const diff=F.sequenceDifficulty(ev);assert.ok(diff.score>=0&&diff.score<=100);
   for(const side of ['w','f']){
    const res=F.evaluateProposal(st.planningEvidence,st,side,obj.id,b.action,input);
    assert.equal(res.eligible,true);assert.equal(res.assessment.values.sequenceDifficulty,diff.score);
    eq(res,F.evaluateProposal(clone(st.planningEvidence),clone(st),side,obj.id,b.action,clone(input)));
    assert.ok(res.assessment.fired.acceptance.some(r=>r.id.includes('sequenceDifficulty')));
    assert.equal(res.evidence.bookedResult,c.finish);
   }
   const banned=clone(st);banned.limits.banIds.push(n.id);
   assert.equal(R.sequenceEvidence(banned,obj.id,b.action,input).eligible,false);
   if(diff.components.controlChanges)reversals++;if(diff.components.conditionalSetups)guards++;
   min=Math.min(min,diff.score);max=Math.max(max,diff.score);valid++;
  }
 }
 assert.equal(JSON.stringify(st),before);rooms++;
}
assert.equal(rooms,80);assert.ok(valid>0&&invalid>0);assert.ok(max>min);
console.log('PASS MP5D: '+rooms+' rooms, '+valid+' connected conditional fragments, '+invalid+' rejected predecessors, '+reversals+' control-changing and '+guards+' setup-guarded fragments; difficulty '+min+'–'+max+'; exact replay and immutable rooms.');
