'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs'),root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficePromoIdentity:I,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const stats=()=>({offers:0,lengths:{},exchanges:0,plans:{},stances:{},unique:new Set()});
const baseline=stats(),next=stats();
let rooms=0,second=0,chosen=0,guarded=0,availableExchanges=0;
function record(s,offer,plan){
 if(!offer)return;
 s.offers++;const l=offer.sequence.actions.length,exchange=new Set(offer.evidence.steps.map(x=>x.performer)).size>1;
 s.lengths[l]=(s.lengths[l]||0)+1;s.exchanges+=Number(exchange);
 s.unique.add(offer.sequence.actions.join('|'));
 const row=s.plans[plan]??={offers:0,longer:0,exchanges:0};
 row.offers++;row.longer+=Number(l>2);row.exchanges+=Number(exchange);
 for(const side of ['w','f'])s.stances[offer.by[side].stance]=(s.stances[offer.by[side].stance]||0)+1;
}
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp7b-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true,planningDialogue:true,planningBargaining:true,planningSequences:true,planningBanks:j?promoBanks(I.bankId(w),I.bankId(f)):[]};
 const a=R.begin(c,w,f,p,opts),b=R.begin(c,w,f,p,{...opts,planningSequencePolicy:2});
 for(const st of [a,b]){st.queue=['structure_huddle'];R.act(st,'plan_'+plan);R.act(st,'board_ok');}
 eq(a.structureBoard,b.structureBoard);eq(a.mood,b.mood);
 if(j&&R.options(a).some(o=>o.id==='hear_counter')){R.act(a,'hear_counter');R.act(b,'hear_counter');second++;}
 const old=R.readSequenceOffer(a),fresh=R.readSequenceOffer(b);record(baseline,old,plan);record(next,fresh,plan);
 if(fresh){
  const before=clone(b),t=b.structureTalk;
  const preference=F.sequencePreference(b.planningEvidence,b);
  assert.ok(preference.target>=2&&preference.target<=4);
  eq(preference,F.sequencePreference(clone(b.planningEvidence),clone(b)));eq(b,before);
  eq(fresh,R.readSequenceOffer(clone(b)));
  eq(fresh.evidence,R.sequenceEvidence(b,t.objective,fresh.card.action,fresh.sequence));
  const pool=R.sequenceCandidates(b,t.objective,fresh.card.action,{diverse:true});
  assert.ok(pool.search.tested<=192&&pool.search.expanded<=240&&pool.candidates.length<=6);
  assert.ok(pool.candidates.some(r=>JSON.stringify(r.sequence)===JSON.stringify(fresh.sequence)));
  if(pool.candidates.some(r=>new Set(r.evidence.steps.map(s=>s.performer)).size>1))availableExchanges++;
  if(preference.cautious){assert.equal(fresh.sequence.actions.length,2);assert.ok(fresh.evidence.steps.every(s=>!s.risk));guarded++;}
  for(const side of ['w','f'])eq(fresh.by[side].scores,F.evaluateProposal(b.planningEvidence,b,side,t.objective,fresh.card.action,fresh.sequence).assessment.scores);
  R.act(b,'hear_sequence');eq(b.mood,before.mood);eq(b.structureBoard,before.structureBoard);
  const replay=clone(b);eq(R.options(b),R.options(replay));
  const denied=clone(b);denied.limits.banIds.push(fresh.sequence.actions[0]);assert.ok(!R.options(denied).some(o=>o.id==='use_sequence'));
  R.act(b,'use_sequence');R.act(replay,'use_sequence');eq(b,replay);
  assert.equal(b.finish,c.finish);assert.equal(b.board.finish.route,before.board.finish.route);
  for(const side of ['w','f'])assert.equal(b.mood[side]-before.mood[side],fresh.by[side].mood+b.boardMood[side]-before.boardMood[side]);
  R.act(b,'review_ok');R.act(replay,'review_ok');R.act(b,'talk_none');R.act(replay,'talk_none');eq(b.sheet,replay.sheet);
  chosen++;
 }
 rooms++;
}
assert.equal(rooms,80);assert.ok(next.offers>=60&&chosen===next.offers);
assert.ok((next.lengths[3]||0)+(next.lengths[4]||0)>=20,'longer exchanges '+JSON.stringify(next.lengths));
assert.ok(next.exchanges>baseline.exchanges,'two-performer sequences '+next.exchanges);
assert.ok(next.plans.technical.longer>next.plans.safe.longer,'style-sensitive selection');
assert.equal(next.plans.safe.longer,0);assert.ok(guarded>0);
const fmt=s=>({...s,unique:s.unique.size});
console.log('PASS MP7B.1: baseline '+JSON.stringify(fmt(baseline))+'; calibrated '+JSON.stringify(fmt(next))+'; '+availableExchanges+' offers with exchange candidate; '+guarded+' conservative offers; '+second+' counter-first; '+chosen+' signed branches; immutable preferences, hard bans, exact replay.');
