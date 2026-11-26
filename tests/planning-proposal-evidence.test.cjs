'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficeSheets:S,OfficeMatch:M}=root;
const A=M.GRAPH.A,clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
assert.equal(F.proposalValues(null),null);
assert.equal(F.proposalValues({v:1,eligible:false}),null);
const fixture={v:1,eligible:true,original:{action:'a',legal:true,permitted:true,compatible:true,risk:false,cost:2,crowd:2,supportsFinish:false},
 proposed:{action:'b',legal:true,permitted:true,compatible:true,risk:true,cost:5,crowd:5,supportsFinish:true}};
const x=F.proposalValues(fixture);
eq(x.values,{proposalRisk:75,proposalFairness:null,sequenceDifficulty:null,structureCompatibility:100,creativeBenefit:80});
eq(x.comparison,{riskFlagChanged:true,costDelta:3,crowdDelta:3,finishSupportChanged:1});
const absent=clone(fixture);delete absent.proposed.risk;delete absent.proposed.crowd;delete absent.proposed.cost;
assert.equal(F.proposalValues(absent).values.proposalRisk,null);
assert.equal(F.proposalValues(absent).values.creativeBenefit,null);
assert.equal(F.proposalValues(absent).comparison.costDelta,null);
const blocked=clone(fixture);blocked.proposed.permitted=false;assert.equal(F.proposalValues(blocked),null);
const lower=clone(fixture);lower.proposed.crowd=-100;assert.equal(F.proposalValues(lower).values.creativeBenefit,0);
let meetings=0,proposals=0,alternatives=0,denied=0,unknownCosts=0;
const riskBands=new Set(),creativeBands=new Set(),costs=[];
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(meetings*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp5a-'+meetings,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const st=R.begin(c,w,f,p,{structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true});
 R.act(st,'plan_'+plan);
 const before=JSON.stringify(st);
 assert.equal(R.proposalEvidence(st,'missing','fake').eligible,false);
 for(const obj of st.structure.objectives){
  const original=st.structureBoard[obj.id];
  if(!original?.action)continue;
  const same=R.proposalEvidence(st,obj.id,original.action);
  assert.ok(same.eligible,'pencilled call must be eligible');
  const v=F.proposalValues(same);assert.equal(v.values.creativeBenefit,50);
  assert.equal(v.comparison.crowdDelta,0);
  assert.equal(same.owner,original.owner);assert.equal(same.bookedResult,c.finish);
  const banned=clone(st);banned.limits.banIds.push(original.action);
  assert.equal(R.proposalEvidence(banned,obj.id,original.action).eligible,false);
  const board=R.view(st).board.find(b=>b.slot===obj.id);
  for(const card of board.cards){
   if(card.id.endsWith('_open'))continue;
   const proposed=clone(st);R.act(proposed,card.id);
   const move=proposed.structureBoard[obj.id];
   const ev=R.proposalEvidence(st,obj.id,move.action);
   if(!ev.eligible){denied++;continue;}
   assert.equal(ev.actorId,st[ev.owner].id);
   assert.equal(ev.original.action,original.action);
   assert.equal(ev.proposed.action,move.action);
   const nv=A[move.action],ov=A[original.action];
   assert.equal(ev.proposed.risk,nv.risk);
   assert.equal(ev.proposed.cost,nv.cost);
   assert.equal(ev.proposed.crowd,nv.crowd);
   assert.equal(ev.proposed.requires,nv.requires);
   assert.ok(R.legal(move.action,st[ev.owner],st[ev.owner==='w'?'f':'w']));
   assert.ok(!R.banned(st,move.action));
   const values=F.proposalValues(ev);
   eq(ev,R.proposalEvidence(clone(st),obj.id,move.action));
   eq(values,F.proposalValues(clone(ev)));
   assert.equal(values.values.proposalFairness,null);
   assert.equal(values.values.sequenceDifficulty,null);
   assert.equal(values.values.structureCompatibility,100);
   assert.equal(values.values.creativeBenefit,Math.max(0,Math.min(100,(nv.crowd-ov.crowd+5)*10)));
   assert.ok(values.values.proposalRisk===20||values.values.proposalRisk===75);
   if(values.comparison.costDelta===null)unknownCosts++;else costs.push(values.comparison.costDelta);
   riskBands.add(values.values.proposalRisk);creativeBands.add(values.values.creativeBenefit);
   if(move.action!==original.action)alternatives++;
   proposals++;
  }
 }
 assert.equal(JSON.stringify(st),before);
 for(const side of ['w','f']){
  const obs=F.observe(st.planningEvidence,st,side);
  for(const k of ['proposalRisk','proposalFairness','sequenceDifficulty','structureCompatibility','creativeBenefit'])assert.equal(obs.values[k],null);
 }
 meetings++;
}
assert.equal(meetings,80);assert.ok(proposals>200&&alternatives>0);assert.ok(creativeBands.size>1);
console.log('PASS MP5A: '+meetings+' rooms, '+proposals+' eligible proposals, '+alternatives+' substitutions, '+denied+' rejected cards; risk bands '+JSON.stringify([...riskBands])+'; creative bands '+JSON.stringify([...creativeBands].sort((a,b)=>a-b))+'; '+unknownCosts+' missing cost comparisons; read-only and exact replay.');
