'use strict';
// Phase 6: structure commentary must be real-event-backed and read-only.
// One existing workflow exercises this alongside the legacy fingerprint.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeMatch:E,OfficeSheets:S,OfficeRoom:Room}=root;
const clone=v=>JSON.parse(JSON.stringify(v));
const w=D.TALENT.find(x=>x.style==='Spectacle'),f=D.FOES[0],p=D.PROMOS[0];
const structures=S.STRUCTURES.catalogue().map(x=>x.id);
const layouts=['technical','story'];
function signed(id,lead,game,seed){
 const c={id:'phase6-'+id+'-'+lead+'-'+game+'-'+seed,
  wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:seed%2?'win_clean':'lose_clean',
  minutes:12,eventAbs:100,purse:400};
 const st=Room.begin(c,w,f,p,{structure:{id,lead},structurePlanning:true});
 st.queue=[];Room.act(st,'plan_'+game);Room.act(st,'board_ok');
 assert.equal(st.stage,'review');
 Room.act(st,'review_ok');Room.act(st,'talk_none');
 assert.equal(st.stage,'done');
 assert.equal(S.STRUCTURES.readPlan(st.sheet).mode,'editorial');
 return {sheet:st.sheet,contract:c};
}
function make(pair,seed,execute=true){
 return E.create({w:{...w,fatigue:5,flags:{}},f,p,slot:'main',
  minutes:pair.sheet.minutes,finish:pair.contract.finish,feudHeat:25,
  plan:{game:pair.sheet.game,leash:'script',talk:'none'},
  seed,preparation:{},flags:{},sheet:clone(pair.sheet),
  ...(execute?{structureExecution:true}:{})});
}
function take(M){
 if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
 return E.next(M);
}
function drive(M){
 for(let n=0;n<9000&&!M.done;n++)take(M);
 assert.ok(M.done&&M.final,'actual bout finishes');
}
const ids=new Set(),broadcasts=new Set();
let bouts=0,calls=0,witnessed=0,missed=0;
for(const id of structures)for(const lead of ['w','f'])for(const game of layouts){
 const pair=signed(id,lead,game,++bouts);
 const M=make(pair,76000+bouts*41);
 assert.deepEqual(Object.keys(M.structureSpoken),[]);
 // A real UI save includes state, queue and an RNG state. Restore from it
 // before the first commentary observation without changing the match.
 if(bouts===1){
  for(let n=0;n<45;n++)take(M);
  const resumed=E.restore(clone({...M,rState:M.r.getState()}));
  for(let n=0;n<80;n++){
   const a=take(M),b=take(resumed);
   assert.equal(JSON.stringify(a),JSON.stringify(b),'commentary diverges on restore');
   assert.equal(JSON.stringify(M.structureSpoken),JSON.stringify(resumed.structureSpoken));
  }
 }
 drive(M);
 const r=E.structureReport(M),a=M.final.structureAssessment;
 assert.ok(r&&a);
 assert.equal(a.id,id);ids.add(id);
 assert.equal(a.version,1);
 assert.equal(M.final.stars,a.executionQuality.stars,'no synthetic star rating');
 assert.equal(a.executionQuality.botches,M.botches);
 assert.equal(a.planAdherence.namedCalls+a.planAdherence.openObjectives,4);
 assert.equal(a.planAdherence.witnessedCalls+a.planAdherence.adaptedCalls+
  a.planAdherence.unfulfilledCalls,a.planAdherence.namedCalls);
 assert.ok(a.planAdherence.unfulfilledCalls>=0);
 const states=r.objectives;
 assert.equal(states.length,4);
 assert.equal(a.structuralCoherence.achieved,states.filter(x=>x.status==='achieved').length);
 assert.equal(a.structuralCoherence.adapted,states.filter(x=>x.status==='adapted').length);
 assert.equal(a.structuralCoherence.missed,states.filter(x=>x.status==='missed').length);
 assert.equal(a.structuralCoherence.witnessed,
  a.structuralCoherence.achieved+a.structuralCoherence.adapted);
 assert.equal(a.structuralCoherence.witnessed+a.structuralCoherence.missed,4);
 for(let i=0;i<4;i++){
  const call=pair.sheet.structurePlan.objectives[i].call;
  if(!call)continue;
  const e=states[i].evidence.filter(x=>x.id===call.action&&x.actor===call.owner);
  if(e.length)calls++;
 }
 witnessed+=a.structuralCoherence.witnessed;missed+=a.structuralCoherence.missed;
 const talked=M.log.filter(x=>x.textureId?.startsWith('structure-'+id+'-'));
 const names=new Set(talked.map(x=>x.textureId));
 assert.equal(names.size,talked.length,'each milestone must be announced only once');
 for(const line of talked){
  const objectiveId=line.textureId.slice(('structure-'+id+'-').length);
  const item=states.find(x=>x.id===objectiveId);
  assert.ok(item&&item.status!=='pending');
  if(item.status!=='missed')assert.ok(item.evidence.some(e=>e.at===item.at),
   'never announce an unwitnessed structural success');
 }
 if(talked.length)broadcasts.add(id);
 assert.ok(M.log.some(x=>x.textureId==='structure-final'),'one factual final summary');
 assert.ok(M.log.some(x=>x.text.includes(id==='kings_road'?'King’s Road':
  id==='chickenshit_heel'?'Chickenshit Heel':
  id==='dominant_ace'?'Dominant Ace':'Classic American')),
  'selected structure must be discussed by name');
 const mechanics=JSON.stringify({
  events:M.graph.events,qSum:M.qSum,qN:M.qN,bonus:M.bonus,stars:M.final.stars,
  rating:E._stars(M,true),parts:E._starParts(M),rState:M.rState
 });
 const repeated=E.structureAssessment(M);
 assert.equal(JSON.stringify(repeated),JSON.stringify(a));
 assert.equal(JSON.stringify({events:M.graph.events,qSum:M.qSum,qN:M.qN,bonus:M.bonus,
  stars:M.final.stars,rating:E._stars(M,true),parts:E._starParts(M),rState:M.rState}),
  mechanics,'read-only assessment cannot affect simulation, RNG or rating');
 assert.ok(!M.final.starParts.some(x=>x[0]==='structure'),
  'no stars awarded for completing a structure');
}
assert.equal(ids.size,4,'all four structures covered');
assert.ok(broadcasts.size>=2,'several structures must produce observed live colour lines');
const plain=signed('kings_road','w','technical',999);
const legacy=make(plain,8001,false);
assert.equal(E.structureReport(legacy),null);
assert.equal(E.structureAssessment(legacy),null);
assert.equal(legacy.structureSpoken,undefined);
drive(legacy);
assert.ok(!legacy.final.structureAssessment);
assert.equal(legacy.log.filter(x=>x.textureId?.startsWith('structure-')).length,0);
assert.ok(script.includes("g.name=fin.structure?(neutral[g.p]||'Match flow')"),
 'alternative structure results must never be labelled by legacy American flow phases');
assert.ok(script.includes('structure-assessment')&&
 script.includes('What was planned, what happened, and how well it worked'),
 'the three independent readings must be visible in the post-match UI');
console.log('PASS Phase 6: '+bouts+' structured bouts; '+witnessed+' evidenced objectives, '+
 missed+' missed; '+calls+' named calls witnessed; '+broadcasts.size+' structures spoken, legacy unchanged');
