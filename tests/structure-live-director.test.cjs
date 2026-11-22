'use strict';
// Phase 3: active structure guidance is opt-in, factual and save-safe.
// Phase 0/1 parity tests continue to guard every metadata-only match.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,console,Math,Date,JSON});
const {OfficeData:D,OfficeMatch:E,OfficeRoom:Room,OfficeSheets:S}=root;
const copy=x=>JSON.parse(JSON.stringify(x));
const w=D.TALENT.find(x=>x.style==='Spectacle'),f=D.FOES[0],p=D.PROMOS[0];
function signed(id,lead,game,seed,options={}){
 const worker=options.worker||w,foe=options.foe||f;
 const contract={id:'p3-'+id+'-'+lead+'-'+game+'-'+seed,wid:worker.id,rid:foe.id,pid:p.id,slot:'main',
  finish:options.finish||(seed%2?'win_clean':'lose_clean'),minutes:options.minutes||12,eventAbs:61,feudHeat:20};
 const st=Room.begin(contract,worker,foe,p,{structure:{id,lead},structurePlanning:true});
 st.queue=[];Room.act(st,'plan_'+game);
 assert.equal(st.stage,'board');
 Room.act(st,'board_ok');
 assert.equal(st.stage,'review');
 Room.act(st,'review_ok');
 Room.act(st,'talk_none');
 assert.equal(st.stage,'done');
 assert.equal(S.STRUCTURES.readPlan(st.sheet).mode,'editorial');
 return {contract,sheet:st.sheet,worker,foe};
}
function make(pair,seed,execute){
 return E.create({w:{...(pair.worker||w),fatigue:4,flags:{}},f:pair.foe||f,p,slot:'main',minutes:pair.sheet.minutes,
  finish:pair.contract.finish,feudHeat:20,
  plan:{game:pair.sheet.game,leash:'script',talk:'none'},
  seed,preparation:{},flags:{},sheet:copy(pair.sheet),
  ...(execute?{structureExecution:true}:{})});
}
function drive(M){
 for(let i=0;i<9000&&!M.done;i++){
  if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
  E.next(M);
 }
 assert.ok(M.done&&M.final,'an actual match must complete');
}
let signedCount=0,played=0,events=0,earned=0;
const ids=S.STRUCTURES.catalogue().map(x=>x.id);
const diagnostics=Object.fromEntries(ids.map(id=>[id,{bouts:0,earned:0,missed:0}]));
const plans=['story','technical','brawl','spots','safe'];
const signedRows=[];
for(const id of ids)for(const lead of ['w','f'])for(const game of plans){
 const pair=signed(id,lead,game,++signedCount);
 signedRows.push(pair);
 const untouched=JSON.stringify(pair.sheet);
 assert.equal(S.STRUCTURES.readPlan(pair.sheet).mode,'editorial');
 if(game!=='technical'&&game!=='brawl')continue;
 const seed=810000+signedCount*37;
 const M=make(pair,seed,true);
 assert.equal(M.structureDirector.id,id);
 assert.equal(M.structureDirector.roles.lead,lead);
 assert.equal(M.structureDirector.objectives.length,4);
 assert.ok(M.structureDirector.objectives.every(x=>x.status==='pending'&&x.evidence.length===0));
 assert.equal(E.structureReport(M).objectives.length,4);
 const before=JSON.stringify(M.structureDirector);
 S.DIRECTOR.observe(M,{id:'snap_suplex',t:50,preControl:lead,control:lead});
 assert.equal(JSON.stringify(M.structureDirector),before,'a fake non-graph event cannot count');
 drive(M);
 assert.equal(M.graph.outcome.id,pair.contract.finish,'the contract still controls the result');
 assert.equal(S.STRUCTURES.readPlan(M.sheet).mode,'editorial','the signed plan stays editorial');
 assert.equal(S.report(M).total,1,'only the actual contracted finish is a legacy sheet node');
 assert.deepEqual(Object.keys(copy(M.final.structure)).sort(),
  ['id','objectives','roles','version'].sort());
 const result=E.structureReport(M);
 if(id==='chickenshit_heel'){
  const view=pair.sheet.structurePlan.objectives.map((o,i)=>({
   goal:o.id,window:o.window,actor:o.actor,call:o.call?.action||null,
   state:result.objectives[i].status,evidence:result.objectives[i].evidence.map(e=>e.id+'@'+e.at)}));
  const windows=pair.sheet.structurePlan.objectives.map(o=>({
   goal:o.id,events:M.graph.events.filter(e=>e.t>=o.window[0]*M.len-20&&e.t<=o.window[1]*M.len+50)
    .filter(e=>E.GRAPH.A[e.id])
    .map(e=>[e.t,e.id,e.preControl,e.control,E.GRAPH.A[e.id].family])
    .slice(0,35)
  }));
  console.log('PHASE3 HEEL TRACE '+JSON.stringify({
   lead,game,seed,states:view,arcs:M.graph.history,windows,
   counts:M.graph.events.length}));
 }
 diagnostics[id].bouts++;
 assert.equal(JSON.stringify(result),JSON.stringify(M.final.structure));
 assert.equal(result.objectives.length,4);
 for(let i=0;i<result.objectives.length;i++){
  const item=result.objectives[i],planned=pair.sheet.structurePlan.objectives[i];
  assert.equal(item.id,planned.id);
  assert.ok(['achieved','adapted','missed'].includes(item.status));
  if(item.status==='achieved'||item.status==='adapted'){
   earned++;diagnostics[id].earned++;
   assert.ok(item.at!==null&&item.evidence.length);
  }
  if(item.status==='missed')diagnostics[id].missed++;
  for(const evidence of item.evidence){
   assert.ok(E.GRAPH.A[evidence.id],'only a real authored action can count');
   if(planned.actor!=='either')assert.equal(evidence.actor,planned.actor,'the event must belong to the signed dramatic actor');
   assert.ok(M.graph.events.some(e=>e.id===evidence.id&&e.t===evidence.at),
    'credited evidence must occur on the real graph tape');
  }
 }
 events+=M.graph.events.length;
 assert.equal(JSON.stringify(pair.sheet),untouched,'runtime cannot rewrite the signed intention');
 played++;
}
// Wider diagnostic: varying roles, styles, finish contracts, length and plan.
// Match construction is probabilistic. We check sound causal evidence rather
// than requiring a staged 100% objective completion rate.
{
 const styles=['Story','Technical','Brawl','Spectacle'];
 const finishTypes=['win_clean','lose_clean','win_dirty','lose_protected'];
 const totals={bouts:0,earned:0,goals:[0,0,0,0],byLead:{w:{bouts:0,earned:0},f:{bouts:0,earned:0}},
  byStyle:{},byLength:{}};
 for(let styleIndex=0;styleIndex<styles.length;styleIndex++){
  const style=styles[styleIndex],opponentStyle=styles[(styleIndex+1)%styles.length];
  const worker=D.TALENT.find(x=>x.style===style);
  const foe=D.FOES.find(x=>x.style===opponentStyle)||
   D.ALL.find(x=>x.style===opponentStyle&&x.id!==worker?.id);
  assert.ok(worker&&foe&&foe.id!==worker.id,'four distinct styles must be available');
  totals.byStyle[style]={bouts:0,earned:0};
  for(const lead of ['w','f'])for(const game of ['story','technical','brawl','spots','safe'])
   for(const minutes of [8,12,18])for(let sample=0;sample<2;sample++){
    const seed=930001+styleIndex*10000+plans.indexOf(game)*1000+minutes*17+
     sample*31+(lead==='f'?5:0);
    const finish=finishTypes[(styleIndex+sample+minutes/2)%finishTypes.length];
    const pair=signed('chickenshit_heel',lead,game,seed,{worker,foe,minutes,finish});
    const source=JSON.stringify(pair.sheet);
    const escape=pair.sheet.structurePlan.objectives.at(-1).call;
    assert.notEqual(escape?.action,'hl_rope_leverage','rope leverage must not be proposed as a defensive escape');
    const M=make(pair,seed,true);drive(M);
    assert.equal(M.graph.outcome?.id,finish,'the booked match result remains the authority');
    assert.equal(S.STRUCTURES.readPlan(M.sheet).mode,'editorial','runtime must not rewrite the signed plan');
    assert.equal(JSON.stringify(pair.sheet),source,'the signed editorial agreement is immutable');
    assert.equal(S.report(M).total,1,'the contracted finish remains the only standard beat');
    const observed=M.final.structure.objectives,sourceEvents=M.graph.events;
    totals.bouts++;totals.byLead[lead].bouts++;totals.byStyle[style].bouts++;
    const lengthKey=String(minutes);totals.byLength[lengthKey]??={bouts:0,earned:0};totals.byLength[lengthKey].bouts++;
    for(let i=0;i<4;i++){
     const obj=observed[i],plan=pair.sheet.structurePlan.objectives[i];
     assert.equal(obj.id,plan.id);
     assert.ok(['achieved','adapted','missed'].includes(obj.status));
     if(obj.status!=='missed'){
      totals.earned++;totals.goals[i]++;totals.byLead[lead].earned++;
      totals.byStyle[style].earned++;totals.byLength[lengthKey].earned++;
      assert.ok(obj.evidence.length>0);
     }
     for(const ev of obj.evidence){
      assert.equal(ev.actor,plan.actor,'no objective may be credited to the other wrestler');
      const performed=sourceEvents.find(x=>x.t===ev.at&&x.id===ev.id);
      assert.ok(performed,'only a performed graph event is valid evidence');
      assert.ok(ev.at>=plan.window[0]*M.len-30&&ev.at<=plan.window[1]*M.len+60);
      if(obj.intent==='evasion')assert.notEqual(ev.id,'hl_strut','mere posing is not evasive action');
      if(obj.intent==='escape')assert.notEqual(ev.id,'roll_inside','returning both wrestlers to the ring is not defensive escape');
     }
     if(obj.status==='achieved'&&i>0){
      const required=observed[i-1];assert.notEqual(required.status,'missed',
       'a later achieved objective cannot erase a missed prerequisite');
      assert.ok(obj.at>=required.at,'later objective must follow its prerequisite');
     }
    }
   }
 }
 console.log('Phase 3 Heel mixed-fixture diagnostic: '+JSON.stringify(totals));
 // A healthy structure must be reachable with both dramatic leads and across
 // all three match lengths; these are deliberately modest deterministic
 // smoke floors, not targets for a forced four-beat script.
 assert.ok(totals.earned>=totals.bouts*4*.35,'Heel objectives must substantially outperform the original 2/16');
 for(const side of ['w','f'])assert.ok(totals.byLead[side].earned>0,'both lead assignments must produce performed evidence');
 for(const result of Object.values(totals.byLength))assert.ok(result.earned>0,'8, 12 and 18 minute bouts require reachable objectives');
}

// Phase 1 metadata alone cannot become executed structures.
{
 const pair=signed('kings_road','f','technical',901);
 const inactive=make(pair,90311,false);
 assert.equal(inactive.structureDirector,undefined);
 assert.equal(E.structureReport(inactive),null);
 assert.equal(S.DIRECTOR.bias(inactive,'snap_suplex','f'),1);
 assert.equal(S.DIRECTOR.arcBias(inactive,'chain'),1);
 assert.throws(()=>E.create({w,f,p,slot:'main',minutes:12,
  finish:'win_clean',plan:{game:'technical'},seed:1,structureExecution:true}),
  /valid signed editorial plan/);
}
// Deterministic mid-match JSON restore of an active Director and its ledger.
{
 const pair=signed('dominant_ace','f','technical',905);
 const a=make(pair,204813,true);
 for(let i=0;i<28;i++){
  if(a.decision&&!a.queue.length)E.resolve(a,a.decision.options[0].id);
  E.next(a);
 }
 const b=E.restore(copy({...a,rState:a.r.getState()}));
 assert.equal(JSON.stringify(E.structureReport(a)),JSON.stringify(E.structureReport(b)));
 for(let i=0;i<9000&&!a.done&&!b.done;i++){
  for(const M of [a,b])if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
  assert.equal(E.next(a)?.text,E.next(b)?.text,'save/reload must continue with identical commentary');
 }
 assert.ok(a.done&&b.done);
 assert.equal(JSON.stringify(a.graph.events),JSON.stringify(b.graph.events));
 assert.equal(JSON.stringify(a.final.structure),JSON.stringify(b.final.structure));
 assert.equal(a.finishRoute,b.finishRoute);
}
assert.ok(events>0,'the live match graph must actually run');
assert.ok(earned>0,'active structure must earn real graph objectives');
console.log('Phase 3 objective outcomes: '+JSON.stringify(diagnostics));
console.log('PASS Phase 3 active Director: '+signedCount+' signed layouts, '+played+
 ' live structured matches, '+earned+' witnessed objectives; finish, provenance, legacy isolation and deterministic restore.');
