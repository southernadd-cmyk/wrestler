'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs'),root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePromoIdentity:I,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const sign=st=>{R.act(st,'review_ok');R.act(st,'talk_none');return st.sheet;};
let rooms=0,signed=0,removed=0,legacy=0,bans=0,edits=0,tampering=0,exchanges=0;
const lengths={};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp7b-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true,planningDialogue:true,planningBargaining:true,planningSequences:true,planningSequencePolicy:2,planningBanks:j?promoBanks(I.bankId(w),I.bankId(f)):[]};
 const st=R.begin(c,w,f,p,{...opts,planningSequenceSigning:true}),old=R.begin(c,w,f,p,opts);
 for(const a of [st,old]){a.queue=['structure_huddle'];R.act(a,'plan_'+plan);R.act(a,'board_ok');}
 if(j&&R.options(st).some(o=>o.id==='hear_counter'))for(const a of [st,old])R.act(a,'hear_counter');
 const offer=R.readSequenceOffer(st);
 eq(offer,R.readSequenceOffer(old));
 if(!offer){rooms++;continue;}
 const objective=st.structureTalk.objective,obj=st.structure.objectives.find(o=>o.id===objective);
 for(const a of [st,old]){R.act(a,'hear_sequence');R.act(a,'use_sequence');}
 eq(st.mood,old.mood);eq(st.boardMood,old.boardMood);
 const committed=R.agreedSequence(st,obj);assert.ok(committed);eq(committed,st.structureBoard[objective].sequence);
 assert.equal(committed.mode,'conditional');eq(committed.actions,offer.sequence.actions);eq(committed.start,offer.sequence.start);
 const saved=clone(st);eq(R.agreedSequence(saved,obj),committed);
 const fresh=sign(clone(st)),replay=sign(saved);eq(fresh,replay);
 assert.equal(fresh.structurePlan.version,2);
 const call=fresh.structurePlan.objectives.find(o=>o.id===objective);
 eq(call.sequence,committed);assert.equal(call.call.action,committed.actions.at(-1));
 assert.equal(fresh.finish,c.finish);assert.equal(fresh.finishRoute,st.board.finish.route);
 assert.equal(S.STRUCTURES.readPlan(clone(fresh)).mode,'editorial');
 assert.equal(S.STRUCTURES.executionChoice(clone(fresh),opts.structure),true);
 // Existing director sees only the final named landmark, never new landed nodes.
 const prior=sign(old);assert.equal(prior.structurePlan.version,1);assert.ok(!prior.structurePlan.objectives.some(o=>o.sequence));
 eq(fresh.nodes,prior.nodes);assert.equal(fresh.workerConsent,prior.workerConsent);assert.equal(fresh.opponentConsent,prior.opponentConsent);legacy++;
 for(const mutate of [
  x=>x.version=1,
  x=>x.objectives.find(o=>o.id===objective).sequence.actions[0]='unknown_move',
  x=>x.objectives.find(o=>o.id===objective).sequence.actions.reverse(),
  x=>x.objectives.find(o=>o.id===objective).sequence.start.control='either',
  x=>x.objectives.find(o=>o.id===objective).sequence.mode='executed',
  x=>x.objectives.find(o=>o.id===objective).sequence.status='achieved',
  x=>delete x.objectives.find(o=>o.id===objective).sequence
 ]){
  const broken=clone(fresh);mutate(broken.structurePlan);
  assert.equal(S.STRUCTURES.readPlan(broken).mode,'unsupported');
  assert.throws(()=>S.STRUCTURES.executionChoice(broken,opts.structure));tampering++;
 }
 const illegalSheet=clone(fresh);illegalSheet.limits.banIds.push(committed.actions[0]);assert.equal(S.STRUCTURES.readPlan(illegalSheet).mode,'unsupported');
 const illegalRoom=clone(st);illegalRoom.limits.banIds.push(committed.actions[0]);
 assert.ok(!R.options(illegalRoom).some(o=>o.id==='review_ok'));
 R.act(illegalRoom,'review_edit');R.act(illegalRoom,'objective_'+objective+'_drop_sequence');R.act(illegalRoom,'board_ok');
 const recovered=sign(illegalRoom);assert.equal(recovered.structurePlan.version,1);assert.equal(recovered.structurePlan.objectives.find(o=>o.id===objective).call.action,offer.card.action);bans++;
 const removedRoom=clone(st);R.act(removedRoom,'review_edit');R.act(removedRoom,'objective_'+objective+'_drop_sequence');R.act(removedRoom,'board_ok');
 const dropped=sign(removedRoom);assert.equal(dropped.structurePlan.version,1);
 assert.equal(dropped.structurePlan.objectives.find(o=>o.id===objective).call.action,offer.card.action);removed++;
 const edited=clone(st);R.act(edited,'review_edit');R.act(edited,'objective_'+objective+'_open');R.act(edited,'board_ok');
 const open=sign(edited);assert.equal(open.structurePlan.version,1);assert.equal(open.structurePlan.objectives.find(o=>o.id===objective).call,null);edits++;
 const corrupted=clone(st);corrupted.structureBoard[objective].sequence.actions[0]='unknown_move';
 assert.ok(!R.options(corrupted).some(o=>o.id==='review_ok'));
 lengths[committed.actions.length]=(lengths[committed.actions.length]||0)+1;
 if(new Set(offer.evidence.steps.map(s=>s.performer)).size>1)exchanges++;
 signed++;rooms++;
}
assert.equal(rooms,80);assert.ok(signed>=60&&signed===removed&&signed===legacy&&signed===bans&&signed===edits);
assert.ok(lengths[3]>0&&lengths[4]>0&&exchanges>0);
console.log('PASS MP7C: '+signed+'/'+rooms+' signed conditional sequences; lengths '+JSON.stringify(lengths)+'; '+exchanges+' exchanges; '+legacy+' legacy comparisons; '+removed+' explicit setup removals; '+edits+' objective edits; '+bans+' post-agreement ban recoveries; '+tampering+' rejected tampered plans; exact reload, unchanged booked result and live nodes.');
