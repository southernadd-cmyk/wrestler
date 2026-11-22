'use strict';
// Phase 5: genuine backstage structure negotiation. No scripted achievements.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeMatch:E,OfficeSheets:S,OfficeRoom:Room,OfficeGame:G}=root;
const clone=o=>JSON.parse(JSON.stringify(o));
const worker=D.TALENT.find(x=>x.style==='Spectacle'),foe=D.FOES[0],promoter=D.PROMOS[0];
const ids=S.STRUCTURES.catalogue().map(x=>x.id),plans=['story','technical','brawl','safe','spots'];
const choices=new Set(),signedCount={keep:0,open:0,revise:0};
function finish(M){
 for(let n=0;n<9000&&!M.done;n++){
  if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
  E.next(M);
 }
 assert.ok(M.done&&M.final,'the booked match must finish');
}
function begin(id,lead,game,seed){
 const booking={id:'p5-'+id+'-'+lead+'-'+game+'-'+seed,
  wid:worker.id,rid:foe.id,pid:promoter.id,slot:'main',finish:seed%2?'win_clean':'lose_clean',
  minutes:12,eventAbs:88,feudHeat:30,purse:360};
 const st=Room.begin(booking,worker,foe,promoter,{structure:{id,lead},structurePlanning:true});
 assert.ok(st.queue.includes('structure_huddle'),'every signed structure offers a conversation');
 assert.ok(st.queue.includes('structure_objection'),'safety concerns precede discussion');
 st.queue=['structure_objection','structure_huddle'];
 const initial=Room.view(st);
 assert.match(initial.title,new RegExp(S.STRUCTURES.catalogue().find(x=>x.id===id).label));
 assert.ok(initial.options.every(o=>o.hint.length>20),'performance plans have grounded guidance');
 Room.act(st,'plan_'+game);
 assert.equal(st.stage,'board');
 assert.equal(Room.view(st).board.length,4);
 assert.ok(Room.view(st).structureBrief);
 const route=st.board.finish.route;
 Room.act(st,'board_ok');
 for(let n=0;n<5&&st.stage==='scene'&&Room.view(st).situation!=='structure_huddle';n++){
  assert.equal(Room.view(st).situation,'structure_objection');
  const choice=Room.view(st).options.find(o=>o.id==='replace')||Room.view(st).options.find(o=>o.id==='open');
  assert.ok(choice);
  Room.act(st,choice.id);
 }
 assert.equal(st.stage,'scene');
 assert.equal(Room.view(st).situation,'structure_huddle');
 const huddle=Room.view(st);
 assert.match(huddle.ask,/promoter|finishing route/i);
 assert.equal(st.board.finish.route,route);
 assert.ok(st.structureTalk?.original?.action,'discussion refers to an actual pencilled move');
 return {st,booking,route};
}
function sign(st){
 assert.equal(st.stage,'review');
 const first=clone(st),before=clone(st.structureTalk);
 Room.act(st,'review_edit');
 assert.equal(st.stage,'board');
 Room.act(st,'board_ok');
 assert.equal(st.stage,'review','revising a signed intention must not replay the conversation');
 assert.equal(JSON.stringify(st.structureTalk),JSON.stringify(before));
 Room.act(st,'review_ok');
 assert.equal(st.stage,'curtain');
 Room.act(st,'talk_none');
 assert.equal(st.stage,'done');
 const copy=clone(first);
 Room.act(copy,'review_edit');Room.act(copy,'board_ok');Room.act(copy,'review_ok');Room.act(copy,'talk_none');
 assert.equal(JSON.stringify(copy.sheet),JSON.stringify(st.sheet),'save and reload during review produces same signed agreement');
 return st.sheet;
}
let scenarios=0,matches=0,evidence=0;
for(const id of ids)for(const lead of ['w','f'])for(const game of plans){
 const {st,booking,route}=begin(id,lead,game,++scenarios);
 const initial=clone(st);
 const answers=Room.view(st).options.map(x=>x.id);
 assert.ok(answers.includes('keep')&&answers.includes('open'));
 for(const answer of answers){
  const run=clone(initial),talk=clone(run.structureTalk),before=clone(run.structureBoard);
  assert.ok(['keep','revise','open'].includes(answer));
  Room.act(run,answer);
  assert.equal(run.stage,'review');
  assert.equal(run.structureTalk.decision,answer);
  assert.equal(run.board.finish.route,route,'conversation cannot renegotiate the booked finish route');
  assert.equal(run.finish,booking.finish,'conversation cannot renegotiate the promoter result');
  assert.ok(Room.view(run).structureBrief?.discussion,'review records the actual choice');
  const chosen=run.structureBoard[talk.objective];
  if(answer==='keep')assert.equal(chosen.action,before[talk.objective].action);
  if(answer==='revise'){
   assert.equal(chosen.action,talk.alternative.action);
   assert.equal(chosen.owner,talk.by);
   assert.notEqual(chosen.action,talk.original.action);
  }
  if(answer==='open')assert.equal(chosen.action,null);
  const sheet=sign(run),record=sheet.structureDiscussion;
  assert.equal(record.decision,answer);
  assert.equal(record.from,talk.original.action);
  assert.equal(record.to,chosen.action||null);
  assert.equal(sheet.finish,booking.finish);
  assert.equal(sheet.finishRoute,route);
  assert.equal(sheet.structurePlan.finishRoute,route);
  assert.equal(S.STRUCTURES.readPlan(sheet).mode,'editorial');
  assert.equal(S.STRUCTURES.executionChoice(sheet,{id,lead}),true);
  assert.equal(sheet.nodes.length,1,'no phantom American beats');
  assert.ok(!sheet.structurePlan.objectives.some(o=>'status' in o||'actual' in o),
   'a pre-match agreement cannot claim a spot occurred');
  signedCount[answer]++;
  choices.add(id+'|'+answer);
  if(game==='story'&&answer==='open'){
   const M=E.create({w:{...worker,fatigue:4,flags:{}},f:foe,p:promoter,slot:'main',
    minutes:sheet.minutes,finish:booking.finish,plan:{game:sheet.game,leash:'script',talk:'none'},
    seed:420000+scenarios,preparation:{},flags:{},sheet:clone(sheet),structureExecution:true});
   finish(M);
   assert.equal(M.graph.outcome.id,booking.finish);
   assert.equal(E.structureReport(M).id,id);
   assert.equal(S.report(M).total,1);
   assert.equal(M.sheet.structureDiscussion.decision,'open');
   evidence+=E.structureReport(M).objectives.filter(o=>o.status==='achieved'||o.status==='adapted').length;
   matches++;
  }
 }
}
// A normal non-structure meeting never gains the new mandatory discussion.
const plain=Room.begin({id:'p5-plain',wid:worker.id,rid:foe.id,pid:promoter.id,
 slot:'main',minutes:12,finish:'win_clean'},worker,foe,promoter);
assert.equal(plain.queue.includes('structure_huddle'),false);
assert.equal(Room.view(plain).structureBrief,null);
// Real career aftermath: the agreed contract still settles through OfficeGame.
G.fresh();G.S.cash=99999;assert.equal(G.sign('rex'),null);
const W=D.ALL.find(x=>x.id==='rex'),F=D.ALL.find(x=>x.id==='silas'),P=D.PROMOS.find(x=>x.id==='dock');
assert.ok(W&&F&&P);
const c={id:'phase5-career',wid:'rex',rid:'silas',pid:'dock',slot:'main',
 finish:'win_clean',minutes:12,purse:350,eventAbs:G.abs(),feudHeat:20};
const live=Room.begin(c,W,F,P,{structure:{id:'kings_road',lead:'f'},structurePlanning:true});
live.queue=['structure_huddle'];
Room.act(live,'plan_technical');Room.act(live,'board_ok');
assert.equal(Room.view(live).situation,'structure_huddle');
Room.act(live,'open');Room.act(live,'review_ok');Room.act(live,'talk_none');
const sheet=live.sheet, M=E.create({w:{...W,flags:{}},f:F,p:P,slot:'main',minutes:sheet.minutes,
 finish:c.finish,plan:{game:sheet.game,leash:'script',talk:'none'},
 seed:440003,sheet:clone(sheet),preparation:{},flags:{},structureExecution:true});
finish(M);
G.applyResult(c,{...M.final,roomThreads:sheet.threads,roomThreadUsed:sheet.threadUsed});
assert.ok(G.S.history.some(x=>x.cid===c.id),'a structured bout must still settle into the career ledger');
assert.equal(M.graph.outcome.id,c.finish);
assert.ok(matches===8,'all four structures with both leads produce completed matches');
assert.ok(signedCount.keep>=40&&signedCount.open>=40,'both core choices are exercised across fixtures');
console.log('PASS Phase 5: '+scenarios+' backstage structures; '+JSON.stringify(signedCount)+
 ' negotiation replies, review/reload and contract integrity; '+matches+
 ' full structured matches, '+evidence+' witnessed objectives, career settlement and legacy isolation.');
