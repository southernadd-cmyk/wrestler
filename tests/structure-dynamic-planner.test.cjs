'use strict';
// Phase 2: editorial structure planning. It must never masquerade as
// executed structure logic or break Phase 1's metadata-only opt-in.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,console,Math,Date,JSON});
const {OfficeData:D,OfficeMatch:E,OfficeRoom:Room,OfficeSheets:Sheets}=root;
const S=Sheets.STRUCTURES;
const w=D.TALENT.find(x=>x.style==='Spectacle'),f=D.FOES[0],p=D.PROMOS[0];
const plans=['story','technical','brawl','spots','safe'];
const ids=S.catalogue().map(x=>x.id);
const plain=o=>JSON.parse(JSON.stringify(o));
function contract(id,win=true){
 return {id,wid:w.id,rid:f.id,pid:p.id,slot:'main',
  finish:win?'win_clean':'lose_clean',minutes:12,eventAbs:36,feudHeat:25};
}
function begin(id,lead,plan,index){
 const c=contract('phase2-'+id+'-'+lead+'-'+plan+'-'+index,index%2===0);
 const st=Room.begin(c,w,f,p,{structure:{id,lead},structurePlanning:true});
 st.queue=['time_cut'];
 Room.act(st,'plan_'+plan);
 assert.equal(st.stage,'board');
 assert.equal(st.structurePlanning,true);
 const view=Room.view(st);
 assert.equal(view.board.length,4);
 assert.equal(JSON.stringify(view.board.map(x=>x.slot)),
  JSON.stringify(st.structure.objectives.map(x=>x.id)));
 assert.ok(view.board.every(x=>!['opening','pressure','reversal','payoff'].includes(x.slot)));
 assert.ok(view.board.every(x=>x.cards.some(c=>c.id.endsWith('_open'))));
 assert.equal(view.finishes.some(x=>x.selected),true);
 assert.equal(view.story.notes.some(x=>x.text.includes('Heat, then the comeback')),false);
 return {c,st};
}
function sign(st){
 const review=Room.view(st).board,choice=review.flatMap(x=>x.cards)
  .find(x=>x.id.startsWith('objective_')&&!x.id.endsWith('_open')&&!x.selected);
 let chosen=null;
 if(choice){
  const row=review.find(x=>x.cards.some(c=>c.id===choice.id));
  Room.act(st,choice.id);
  chosen={id:row.slot,action:st.structureBoard[row.slot].action,owner:st.structureBoard[row.slot].owner};
  assert.equal(st.structureBoard[row.slot].chosen,true);
 }
 const alt=Room.options(st).find(x=>x.route&&!x.selected);
 if(alt){
  Room.act(st,alt.id);
  assert.equal(st.structureBoard?.[chosen?.id]?.action,chosen?.action,
   'finish revision must not delete manually selected objective move');
 }
 const route=st.board.finish.route;
 Room.act(st,'board_ok');
 assert.equal(st.stage,'scene');
 Room.act(st,'cut');
 assert.equal(st.stage,'review');
 const snapshot=plain(st);
 const mood=plain(st.mood),boardMood=plain(st.boardMood),minutes=st.fx.minutes;
 Room.act(st,'review_edit');assert.equal(st.stage,'board');
 Room.act(st,'board_ok');assert.equal(st.stage,'review');
 assert.equal(st.fx.minutes,minutes,'review does not repeat an incident');
 assert.equal(JSON.stringify(st.boardMood),JSON.stringify(boardMood),
  'review must replace rather than double-apply spot mood effects');
 assert.equal(JSON.stringify(st.mood),JSON.stringify(mood));
 Room.act(st,'review_ok');
 Room.act(st,'talk_none');
 assert.equal(st.stage,'done');
 Room.act(snapshot,'review_edit');Room.act(snapshot,'board_ok');
 Room.act(snapshot,'review_ok');Room.act(snapshot,'talk_none');
 assert.equal(JSON.stringify(snapshot.sheet),JSON.stringify(st.sheet),
  'saved in-progress review should produce identical signed structure plan');
 assert.equal(st.sheet.finishRoute,route);
 assert.equal(st.sheet.structurePlan.finishRoute,route);
 assert.equal(S.read(st.sheet).mode,'metadata_only');
 assert.equal(S.readPlan(st.sheet).mode,'editorial');
 assert.equal(st.sheet.nodes.length,1,'never invent American-called spots for alternative structures');
 assert.equal(st.sheet.nodes[0].id,'finish');
 assert.equal(st.sheet.nodes[0].requires.length,0);
 assert.equal(st.sheet.structurePlan.objectives.length,4);
 for(const objective of st.sheet.structurePlan.objectives){
  assert.ok(!('status' in objective)&&!('actual' in objective));
  if(objective.call){
   assert.ok(E.GRAPH.A[objective.call.action]);
   if(objective.actor!=='either')assert.equal(objective.call.owner,objective.actor);
   if(chosen&&chosen.id===objective.id){
    assert.equal(objective.call.action,chosen.action);
    assert.equal(objective.call.chosen,true);
   }
  }
 }
 return st.sheet;
}
let signedCount=0,played=0;
for(let i=0;i<ids.length;i++)for(const lead of ['w','f'])for(const plan of plans){
 const {c,st}=begin(ids[i],lead,plan,signedCount);
 const sh=sign(st);
 assert.ok(sh.structurePlan.objectives.every(x=>x.commitment===(x.call?'landmark':'guide')));
 signedCount++;
 if(plan!=='technical')continue;
 const M=E.create({w:{...w,fatigue:4,flags:{}},f,p,slot:'main',minutes:sh.minutes,
  finish:c.finish,feudHeat:25,plan:{game:plan,leash:'script',talk:'none'},
  seed:44909+i*10+(lead==='w'?0:1),preparation:{},flags:{},sheet:plain(sh)});
 for(let tick=0;tick<9000&&!M.done;tick++){
  if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
  E.next(M);
 }
 assert.ok(M.done&&M.final,'real simulator still completes from an editorial structure sheet');
 assert.equal(M.graph.outcome?.id,c.finish,'booked outcome remains authoritative');
 assert.equal(Sheets.report(M).total,1,'runtime evaluates ONLY the real agreed finish');
 assert.equal(S.readPlan(M.sheet).mode,'editorial','signed intention survives the match');
 played++;
}
// Phase 1 metadata-only agreement and legacy meeting draw must remain identical.
{
 const c=contract('phase2-phase1-parity');
 const ordinary=Room.begin(c,w,f,p);
 const st=Room.begin(c,w,f,p,{structure:{id:'kings_road',lead:'f'}});
 assert.equal(JSON.stringify(st.queue),JSON.stringify(ordinary.queue),
  'Phase 1 metadata alone cannot add Phase 2 objections or alter backstage scenes');
 assert.equal(st.structurePlanning,undefined);
 st.queue=[];
 Room.act(st,'plan_story');
 assert.equal(st.structurePlanning,undefined);
 assert.equal(JSON.stringify(Room.view(st).board.map(x=>x.slot)),
  JSON.stringify(['opening','pressure','reversal','payoff']));
 Room.act(st,'board_ok');Room.act(st,'review_ok');Room.act(st,'talk_none');
 assert.equal(S.readPlan(st.sheet).mode,'absent');
 assert.equal(st.sheet.nodes.length,5);
}
// Explicit safety restriction preserves a chosen move and requires correction.
{
 const {st}=begin('kings_road','w','technical',99);
 const row=Room.view(st).board.find(x=>x.cards.some(c=>!c.id.endsWith('_open')));
 assert.ok(row);
 const option=row.cards.find(c=>!c.id.endsWith('_open'));
 Room.act(st,option.id);
 const intended=st.structureBoard[row.slot].action;
 st.limits.banIds.push(intended);
 Room.reconcile(st);
 assert.equal(st.structureBoard[row.slot].action,intended,'manual commitment not silently deleted');
 assert.ok(st.structureBoard[row.slot].conflict);
 assert.throws(()=>Room.act(st,'board_ok'),/Resolve prohibited/);
 Room.act(st,'objective_'+row.slot+'_open');
 assert.equal(st.structureBoard[row.slot].action,null);
 assert.ok(!st.structureBoard[row.slot].conflict);
 Room.act(st,'board_ok');
 assert.equal(st.stage,'scene');
}
// Risky real moves still require wrestler consent, and objections remain
// separate from the booked finish and without invented performed evidence.
{
 const c=contract('phase2-risk-objection');
 const st=Room.begin(c,w,f,p,{structure:{id:'kings_road',lead:'w'},structurePlanning:true});
 st.w.fatigue=62;st.f.fatigue=62;
 st.queue=['structure_objection'];
 Room.act(st,'plan_spots');
 const risky=Room.view(st).board.flatMap(x=>x.cards).find(x=>x.risk);
 assert.ok(risky,'the opt-in structure planner must offer a genuine risky candidate');
 const objId=risky.id.match(/^objective_(.+)_\d+$/)[1];
 Room.act(st,risky.id);
 const agreedMove=st.structureBoard[objId].action;
 Room.act(st,'board_ok');
 assert.equal(st.stage,'scene');
 assert.equal(Room.view(st).situation,'structure_objection');
 const objections=Room.options(st).map(x=>x.id);
 assert.ok(objections.includes('replace')&&objections.includes('open')&&objections.includes('keep'));
 Room.act(st,'open');
 assert.equal(st.stage,'review');
 assert.equal(st.structureBoard[objId].action,null);
 assert.equal(st.structureObjections[0].from,agreedMove);
 assert.equal(st.structureObjections[0].to,null);
 const mood=JSON.stringify(st.mood);
 Room.act(st,'review_edit');Room.act(st,'board_ok');
 assert.equal(JSON.stringify(st.mood),mood,'revision must not double-charge objections');
 Room.act(st,'review_ok');Room.act(st,'talk_none');
 assert.equal(S.readPlan(st.sheet).mode,'editorial');
 assert.equal(st.sheet.structurePlan.objections[0].decision,'open');
 assert.equal(st.sheet.finishRoute,st.sheet.structurePlan.finishRoute);
}
// A carried legacy payoff promise is *not* silently fulfilled or consumed
// when its scene is incompatible with structure-aware editorial planning.
{
 const c=contract('phase2-carried-promise');
 const thread={id:'deferred-promise-1',sit:'promise_due',sid:w.id,at:31};
 const st=Room.begin(c,w,f,p,{structure:{id:'dominant_ace',lead:'f'},structurePlanning:true,threads:[thread]});
 assert.equal(st.thread,undefined,'leave incompatible prior promises for a later meeting');
 assert.equal(st.queue.includes('promise_due'),false);
}
// Metadata readers must preserve the originally signed editorial intention.
{
 const {st}=begin('classic_american','f','story',200);
 const signed=sign(st),copy=S.readPlan(signed);
 const before=JSON.stringify(signed.structurePlan);
 copy.plan.objectives[0].title='tampered outside the signed sheet';
 assert.equal(JSON.stringify(signed.structurePlan),before);
}
// Future execution modes and false claims of achieved objectives are rejected.
{
 const {st}=begin('dominant_ace','f','brawl',101);
 const sheet=sign(st);
 const tampered=plain(sheet);
 tampered.structurePlan.objectives[0].status='achieved';
 assert.equal(S.readPlan(tampered).mode,'unsupported');
 const changed=plain(sheet);
 changed.structurePlan.finishRoute='not_booked';
 assert.equal(S.readPlan(changed).mode,'unsupported');
}
console.log('PASS Phase 2 editorial planner: '+signedCount+' signed structure/lead/plan layouts, '+
 played+' real finishes, save/review, restrictions and unchanged Phase 1 compatibility.');
