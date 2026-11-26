'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs'),root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficePromoIdentity:I,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
let rooms=0,offers=0,second=0,choices=0,selected=0,reversals=0,bankUses=0;const lengths={},stances={};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp7b-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true,planningDialogue:true,planningBargaining:true,planningBanks:j?promoBanks(I.bankId(w),I.bankId(f)):[]};
 const st=R.begin(c,w,f,p,{...opts,planningSequences:true}),old=R.begin(c,w,f,p,opts);
 for(const a of [st,old]){a.queue=['structure_huddle'];R.act(a,'plan_'+plan);R.act(a,'board_ok');}
 assert.ok(!R.options(old).some(o=>o.id==='hear_sequence'));
 eq(R.options(st).filter(o=>o.id!=='hear_sequence'),R.options(old));
 if(j&&R.options(st).some(o=>o.id==='hear_counter')){
  R.act(st,'hear_counter');R.act(old,'hear_counter');second++;
  eq(R.options(st).filter(o=>o.id!=='hear_sequence'),R.options(old));
 }
 const offer=R.readSequenceOffer(st);if(!offer){rooms++;continue;}
 offers++;
 const before=clone(st),t=st.structureTalk,at=st.at,route=st.board.finish.route;
 eq(R.readSequenceOffer(clone(st)),offer);eq(st,before);
 eq(R.sequenceEvidence(st,t.objective,offer.card.action,offer.sequence),offer.evidence);
 assert.equal(offer.evidence.execution,'unverified_live_state');
 assert.equal(offer.sequence.actions.at(-1),offer.card.action);
 assert.ok([t.alternative.action,t.bargaining?.offer?.card.action].includes(offer.card.action));
 for(const side of ['w','f']){
  const res=F.evaluateProposal(st.planningEvidence,st,side,t.objective,offer.card.action,offer.sequence);
  eq(res.assessment.scores,offer.by[side].scores);
  stances[offer.by[side].stance]=(stances[offer.by[side].stance]||0)+1;
 }
 lengths[offer.sequence.actions.length]=(lengths[offer.sequence.actions.length]||0)+1;
 if(offer.difficulty.components.controlChanges)reversals++;
 for(const l of Object.values(offer.dialogue.lines))if(l.bankReuse)bankUses++;
 R.act(st,'hear_sequence');
 assert.equal(st.at,at);eq(st.structureBoard,before.structureBoard);eq(st.mood,before.mood);eq(st.consent,before.consent);
 assert.ok(!R.options(st).some(o=>o.id==='hear_sequence'||o.id==='hear_counter'));
 assert.ok(R.options(st).some(o=>o.id==='use_sequence'));
 const restored=clone(st);eq(R.options(st),R.options(restored));eq(R.readSequenceOffer(restored),offer);
 const denied=clone(st);denied.limits.banIds.push(offer.sequence.actions[0]);assert.ok(!R.options(denied).some(o=>o.id==='use_sequence'));
 const tampered=clone(st);tampered.structureTalk.sequenceTalk.offer.by.w.scores.acceptance=-1;assert.ok(!R.options(tampered).some(o=>o.id==='use_sequence'));
 const altered=clone(st);altered.structureTalk.sequenceTalk.offer.dialogue.lines.request.text='bad';assert.ok(!R.options(altered).some(o=>o.id==='use_sequence'));
 for(const opt of R.options(st)){
  const a=clone(st),b=clone(restored);R.act(a,opt.id);R.act(b,opt.id);eq(a,b);
  assert.equal(a.finish,c.finish);assert.equal(a.board.finish.route,route);
  if(opt.id==='use_sequence'){
   selected++;assert.equal(a.structureBoard[t.objective].action,offer.card.action);assert.ok(a.structureTalk.sequenceTalk.selected);
   for(const side of ['w','f']){
    const net=offer.by[side].mood+a.boardMood[side]-st.boardMood[side];
    assert.equal(a.mood[side]-st.mood[side],net);
    assert.ok(opt.hint.includes('('+(net===0?'unchanged':(net>0?'+':'')+net+' mood')+')'));
   }
  }else{
   const legacy=clone(old);R.act(legacy,opt.id);eq(a.structureBoard,legacy.structureBoard);eq(a.mood,legacy.mood);
  }
  R.act(a,'review_ok');R.act(b,'review_ok');R.act(a,'talk_none');R.act(b,'talk_none');eq(a.sheet,b.sheet);
  assert.equal(a.sheet.finish,c.finish);
  if(opt.id==='use_sequence'){
   assert.equal(a.sheet.structureDiscussion.to,offer.card.action);
   assert.ok(!a.sheet.structurePlan.objectives.some(o=>o.sequence),'no unimplemented execution commitment');
  }
  choices++;
 }
 rooms++;
}
assert.equal(rooms,80);assert.ok(offers>=60,'sequence offer coverage '+offers);assert.ok(second>0&&selected===offers&&choices>=offers*4);
console.log('PASS MP7B: '+offers+'/'+rooms+' live sequence offers; '+second+' counter-first rooms; '+selected+' selected; '+choices+' signed branches; lengths '+JSON.stringify(lengths)+'; stances '+JSON.stringify(stances)+'; '+reversals+' control changes; '+bankUses+' bank lines; exact replay, no mood on discussion, old choices unchanged, hard safety.');
