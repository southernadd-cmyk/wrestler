'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningDialogue:L,OfficePromoIdentity:I,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
let coverage=0;for(const w of D.ALL){const id=L.capture(w,promoBanks(I.bankId(w)),2);if(id.fragments.length)coverage++;}
assert.equal(coverage,80,'all 80 have reviewed fragments');
let rooms=0,offers=0,choices=0;const topics={};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp6d-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true,planningDialogue:true,planningBanks:promoBanks(I.bankId(w),I.bankId(f))};
 const a=R.begin(c,w,f,p,{...opts,planningBargaining:true}),old=R.begin(c,w,f,p,opts);
 for(const st of [a,old]){st.queue=['structure_huddle'];R.act(st,'plan_'+plan);R.act(st,'board_ok');}
 assert.ok(!R.options(old).some(o=>o.id==='hear_counter'));
 eq(R.options(a).filter(o=>o.id!=='hear_counter'),R.options(old));
 const original=clone(a);
 if(R.options(a).some(o=>o.id==='hear_counter')){
  offers++;const t=a.structureTalk,at=a.at,route=a.board.finish.route;
  R.act(a,'hear_counter');assert.equal(a.at,at);eq(a.structureBoard,original.structureBoard);eq(a.mood,original.mood);eq(a.consent,original.consent);
  const offer=a.structureTalk.bargaining.offer;const restored=clone(a);eq(R.options(a),R.options(restored));
  assert.ok(offer.card.action!==t.original.action&&offer.card.action!==t.alternative.action);
  assert.equal(offer.card.owner,t.by);assert.ok(R.proposalEvidence(a,t.objective,offer.card.action).eligible);
  assert.equal(offer.dialogue.lines.request.actorId,a[t.by==='w'?'f':'w'].id);
  assert.equal(offer.dialogue.lines.response.actorId,a[t.by].id);
  topics[offer.dialogue.point.topic]=(topics[offer.dialogue.point.topic]||0)+1;
  assert.ok(!R.options(a).some(o=>o.id==='hear_counter'));
  assert.ok(R.options(a).some(o=>o.id==='compromise'));
  const denied=clone(a);denied.limits.banIds.push(offer.card.action);assert.ok(!R.options(denied).some(o=>o.id==='compromise'));
  const tampered=clone(a);tampered.structureTalk.bargaining.offer.dialogue.lines.request.text='wrong';assert.ok(!R.options(tampered).some(o=>o.id==='compromise'));
  for(const opt of R.options(a)){
   const x=clone(a),y=clone(restored);R.act(x,opt.id);R.act(y,opt.id);eq(x,y);
   assert.equal(x.finish,c.finish);assert.equal(x.board.finish.route,route);
   if(opt.id==='compromise'){
    assert.equal(x.structureBoard[t.objective].action,offer.card.action);
    // Board credit is an existing independent mood component, replaced
    // once when the named call changes. Check both components explicitly.
    const credit=board=>{
     const out={w:0,f:0};
     for(const b of Object.values(board)){
      if(!b.action||!['w','f'].includes(b.by))continue;
      out[b.by]+=2;if(b.owner!==b.by)out[b.owner]-=2;
     }
     return out;
    };
    const before=credit(a.structureBoard),after=credit(x.structureBoard);
    eq(a.boardMood,before);eq(x.boardMood,after);
    for(const side of ['w','f']){
     const net=offer.response.by[side].mood+after[side]-before[side];
     assert.equal(x.mood[side]-a.mood[side],net);
     assert.equal((x.mood[side]-x.boardMood[side])-(a.mood[side]-a.boardMood[side]),offer.response.by[side].mood);
     const display=net===0?'unchanged':(net>0?'+':'')+net+' mood';
     assert.ok(opt.hint.includes('('+display+')'));
     if(net!==0)assert.ok(opt.tags.includes(a[side].short+(net>0?' ▲':' ▼')));
    }
    assert.equal(x.structureTalk.bargaining.selected,'second');
   }else{
    const legacy=clone(original);R.act(legacy,opt.id);eq(x.structureBoard,legacy.structureBoard);eq(x.mood,legacy.mood);
   }
   R.act(x,'review_ok');R.act(y,'review_ok');R.act(x,'talk_none');R.act(y,'talk_none');eq(x.sheet,y.sheet);assert.equal(x.sheet.finish,c.finish);
   if(opt.id==='compromise')assert.equal(x.sheet.structureDiscussion.to,offer.card.action);
   choices++;
  }
 }
 rooms++;
}
assert.equal(rooms,80);assert.ok(offers>=40,'counteroffer coverage '+offers);assert.ok(choices>=offers*4);
console.log('PASS MP6D: '+coverage+'/80 reviewed bank owners; '+offers+'/'+rooms+' second offers; '+choices+' signed branches; counteroffer topics '+JSON.stringify(topics)+'; no double mood, hard safety, exact reload and unchanged original options.');
