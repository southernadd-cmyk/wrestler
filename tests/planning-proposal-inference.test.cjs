'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const neutral={cooperation:50,caution:50,ambition:50,protectiveness:50,flexibility:50,assertiveness:50};
const profile=(s={},side='w')=>({observation:{cid:'fixture',side,actorId:side==='w'?'a':'b',opponentId:side==='w'?'b':'a'},scores:{...neutral,...s}});
const move=(action,changes={})=>({action,legal:true,permitted:true,compatible:true,risk:false,cost:2,crowd:3,supportsFinish:false,familiar:false,...changes});
const ev=(changes={})=>({v:1,eligible:true,cid:'fixture',objective:'payoff',actorId:'a',partnerId:'b',original:move('one'),proposed:move('two',changes)});
const assess=(s={},changes={},side='w')=>F.inferProposal(profile(s,side),ev(changes));
assert.equal(F.behaviourModel.rules.length,79);
eq(F.proposalModel.outputs,['acceptance','reservations','counterproposal']);
assert.equal(F.inferProposal(profile(),{v:1,eligible:false}),null);
assert.equal(F.inferProposal({...profile(),observation:{...profile().observation,cid:'stale'}},ev()),null);
assert.equal(F.inferProposal(profile(),ev({risk:null,crowd:null})),null);
assert.equal(F.inferProposal(profile(),ev({permitted:false})),null);
for(const side of ['w','f']){
 const safe=assess({}, {},side),risk=assess({}, {risk:true},side);
 assert.ok(safe.scores.acceptance>risk.scores.acceptance);
 assert.ok(risk.scores.reservations>safe.scores.reservations);
 assert.ok(risk.scores.counterproposal>safe.scores.counterproposal);
 assert.ok(assess({caution:90},{risk:true},side).scores.reservations>assess({caution:10},{risk:true},side).scores.reservations);
 assert.ok(assess({caution:90},{risk:true},side).scores.acceptance<assess({caution:10},{risk:true},side).scores.acceptance);
 eq(assess({caution:90},{},side).scores,assess({caution:10},{},side).scores);
 assert.ok(assess({ambition:90},{crowd:8},side).scores.acceptance>assess({ambition:10},{crowd:8},side).scores.acceptance);
 assert.ok(assess({ambition:90},{crowd:-2},side).scores.counterproposal>assess({ambition:10},{crowd:-2},side).scores.counterproposal);
 assert.equal(safe.values.proposalFairness,null);
 assert.equal(safe.values.sequenceDifficulty,null);
 assert.equal(safe.values.professionalTrust,undefined);
 assert.ok(assess({}, {supportsFinish:true},side).scores.acceptance>safe.scores.acceptance);
}
assert.equal(assess({}, {cost:6},'f').cues['change.costIncrease'],undefined);
assert.equal(assess({}, {cost:6},'w').cues['change.costIncrease'],1);
assert.equal(assess({}, {familiar:true},'f').cues['change.actorFamiliar'],undefined);
assert.equal(assess({}, {familiar:true},'w').cues['change.actorFamiliar'],1);
const loss=ev();loss.original.supportsFinish=true;
assert.ok(F.inferProposal(profile(),loss).scores.counterproposal>assess().scores.counterproposal);
assert.ok(F.inferProposal(profile({protectiveness:95}),loss).scores.counterproposal>F.inferProposal(profile({protectiveness:10}),loss).scores.counterproposal);
let meetings=0,proposals=0,observations=0,blocked=0;
const used=new Set(),ranges=Object.fromEntries(F.proposalModel.outputs.map(k=>[k,{min:100,max:0,sum:0}]));
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(meetings*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp5b-'+meetings,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const st=R.begin(c,w,f,p,{structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true});
 R.act(st,'plan_'+plan);
 const before=JSON.stringify(st);
 for(const obj of st.structure.objectives){
  const b=st.structureBoard[obj.id];if(!b?.action)continue;
  const actions=new Set([b.action]);
  for(const card of R.view(st).board.find(x=>x.slot===obj.id).cards){
   if(card.id.endsWith('_open'))continue;
   const copy=clone(st);R.act(copy,card.id);actions.add(copy.structureBoard[obj.id].action);
  }
  for(const action of actions){
   const evidence=R.proposalEvidence(st,obj.id,action);if(!evidence.eligible)continue;
   proposals++;
   for(const side of ['w','f']){
    const result=F.evaluateProposal(st.planningEvidence,st,side,obj.id,action);
    assert.equal(result.eligible,true);assert.ok(result.assessment);
    const a=result.assessment;
    eq(result,F.evaluateProposal(clone(st.planningEvidence),clone(st),side,obj.id,action));
    assert.equal(a.actorId,st[side].id);
    assert.equal(a.role,side===evidence.owner?'performer':'partner');
    for(const [k,n] of Object.entries(a.scores)){
     assert.ok(Number.isFinite(n)&&n>=0&&n<=100);
     assert.ok(a.fired[k].length);
     for(const rule of a.fired[k])used.add(rule.id);
     const z=ranges[k];z.min=Math.min(z.min,n);z.max=Math.max(z.max,n);z.sum+=n;
    }
    observations++;
   }
   const banned=clone(st);banned.limits.banIds.push(action);
   const denied=F.evaluateProposal(banned.planningEvidence,banned,'w',obj.id,action);
   assert.equal(denied.eligible,false);assert.equal(denied.assessment,null);blocked++;
  }
 }
 assert.equal(JSON.stringify(st),before);
 meetings++;
}
assert.equal(meetings,80);assert.ok(proposals>200);assert.equal(observations,proposals*2);
assert.equal(blocked,proposals);assert.ok(used.size>0);
for(const z of Object.values(ranges)){assert.ok(z.max>z.min);z.mean=z.sum/observations;delete z.sum;}
console.log('PASS MP5B: '+meetings+' rooms; '+proposals+' proposals; '+observations+' independent assessments; '+blocked+' hard-blocked proposals; '+used.size+'/'+F.proposalModel.rules.length+' rules observed; ranges '+JSON.stringify(ranges)+'; exact replay and immutable rooms.');
