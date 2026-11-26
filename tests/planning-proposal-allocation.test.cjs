'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const row=(objective,owner,action,crowd,cost)=>({objective,owner,action,crowd,cost});
const move=(action,crowd,cost)=>({action,crowd,cost,risk:false,legal:true,permitted:true,compatible:true});
const e={v:1,eligible:true,cid:'fixture',objective:'a',owner:'w',actorId:'one',partnerId:'two',
 original:move('old',2,2),proposed:move('new',2,2),
 allocation:[row('a','w','old',2,2),row('b','w','second',8,2),row('c','f','third',-2,2),row('d','f','fourth',2,2)]};
const profile=(side,protectiveness=50)=>({observation:{cid:'fixture',side,actorId:side==='w'?'one':'two',opponentId:side==='w'?'two':'one'},scores:{cooperation:50,flexibility:50,assertiveness:50,caution:50,ambition:50,protectiveness}});
for(const side of ['w','f']){
 const neutral=F.proposalAllocation(e,side);assert.equal(neutral.score,50);
 eq(neutral.before,neutral.proposed);assert.equal(neutral.tradeoff,'unchanged');
}
const more=clone(e);more.proposed.crowd=8;
assert.ok(F.proposalAllocation(more,'w').score>50);
assert.ok(F.proposalAllocation(more,'f').score<50);
const less=clone(e);less.proposed.crowd=0;
assert.ok(F.proposalAllocation(less,'w').score<50);
assert.ok(F.proposalAllocation(less,'f').score>50);
const effort=clone(e);effort.proposed.cost=6;
assert.equal(F.proposalAllocation(effort,'w').score,0);
assert.equal(F.proposalAllocation(effort,'f').score,50);
assert.equal(F.proposalAllocation(effort,'w').tradeoff,'potential_concession');
assert.equal(F.proposalAllocation(effort,'f').effortDelta,0);
assert.equal(F.proposalAllocation(effort,'w').before.f.visibility,4,'negative crowd magnitude counts');
assert.ok(F.inferProposal(profile('w'),effort).scores.reservations>F.inferProposal(profile('w'),e).scores.reservations);
assert.ok(F.inferProposal(profile('w',95),effort).scores.counterproposal>F.inferProposal(profile('w',10),effort).scores.counterproposal);
const incomplete=clone(e);incomplete.allocation[2].action=null;
assert.equal(F.proposalAllocation(incomplete,'w').score,null);
assert.equal(F.inferProposal(profile('w'),incomplete).values.proposalFairness,null);
const mismatch=clone(e);mismatch.allocation[0].action='wrong';
assert.equal(F.proposalAllocation(mismatch,'w'),null);
assert.equal(F.proposalValues(e).values.proposalFairness,null,'MP5A standalone still unknown');
const snapshot={participants:{w:{id:'one',relationship:{talks:[
 {issue:'safety',requestedBy:'one',original:'A',final:'B',delivered:'adapted'},
 {issue:'scouted',requestedBy:'two',original:'A',final:'A',delivered:'achieved'},
 {issue:'after',requestedBy:'one',original:'A',final:'B',delivered:'performed'},
 {issue:'safety',requestedBy:'two',original:'A',final:'C',delivered:'missed'}]}},f:{id:'two'}}};
eq(F.requestHistory(snapshot,'w'),{v:1,own:{recorded:1,changed:1,changedDelivered:1},partner:{recorded:2,changed:1,changedDelivered:0}});
let meetings=0,proposals=0,known=0,unknown=0,changed=0,low=0,high=0;const tradeoffs={};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(meetings*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp5c-'+meetings,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const st=R.begin(c,w,f,p,{structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true});
 R.act(st,'plan_'+plan);const before=JSON.stringify(st);
 for(const obj of st.structure.objectives){
  const b=st.structureBoard[obj.id];if(!b?.action)continue;
  const actions=new Set([b.action]);
  for(const card of R.view(st).board.find(x=>x.slot===obj.id).cards){
   if(card.id.endsWith('_open'))continue;
   const copy=clone(st);R.act(copy,card.id);actions.add(copy.structureBoard[obj.id].action);
  }
  for(const action of actions){
   const ev=R.proposalEvidence(st,obj.id,action);if(!ev.eligible)continue;
   proposals++;
   const both={};
   for(const side of ['w','f']){
    const result=F.evaluateProposal(st.planningEvidence,st,side,obj.id,action);
    eq(result,F.evaluateProposal(clone(st.planningEvidence),clone(st),side,obj.id,action));
    const al=result.assessment.allocation;both[side]=al;
    assert.ok(al);
    assert.equal(result.assessment.values.sequenceDifficulty,null);
    if(al.score===null){unknown++;assert.equal(result.assessment.values.proposalFairness,null);continue;}
    known++;assert.ok(al.score>=0&&al.score<=100);assert.equal(result.assessment.values.proposalFairness,al.score);
    if(al.score<25)low++;if(al.score>75)high++;
    if(action===b.action)assert.equal(al.score,50);
    if(al.score!==50)changed++;
    if(side!==ev.owner)assert.equal(al.effortDelta,0);
    tradeoffs[al.tradeoff]=(tradeoffs[al.tradeoff]||0)+1;
   }
   if(both.w.score!==null&&both.f.score!==null)assert.ok(Math.abs(both.w.visibilityDelta+both.f.visibilityDelta)<1e-9);
  }
 }
 assert.equal(JSON.stringify(st),before);meetings++;
}
assert.equal(meetings,80);assert.ok(proposals>200);assert.equal(known+unknown,proposals*2);
assert.ok(known>0&&changed>0,'real proposals must exercise relative allocation');
console.log('PASS MP5C: '+meetings+' rooms; '+proposals+' proposals; '+known+' known and '+unknown+' unknown allocations; '+changed+' non-neutral; '+low+' low and '+high+' high; tradeoffs '+JSON.stringify(tradeoffs)+'; exact replay and immutable rooms.');
