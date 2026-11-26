'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs'),root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePromoIdentity:I,OfficeSheets:S,OfficeMatch:E}=root;
const G=E.GRAPH,clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
function drive(M){for(let i=0;i<9000&&!M.done;i++){if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);E.next(M);}assert.ok(M.done&&M.final);}
let rooms=0,bouts=0,completed=0,started=0,interrupted=0,restored=0,landings=0,partial=0,legacy=0;const lengths={},byPlan={},outcomes={};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp7b-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true,planningDialogue:true,planningBargaining:true,planningSequences:true,planningSequencePolicy:2,planningSequenceSigning:true,planningBanks:j?promoBanks(I.bankId(w),I.bankId(f)):[]};
 const st=R.begin(c,w,f,p,opts);st.queue=['structure_huddle'];R.act(st,'plan_'+plan);R.act(st,'board_ok');
 if(j&&R.options(st).some(o=>o.id==='hear_counter'))R.act(st,'hear_counter');
 rooms++;
 const offer=R.readSequenceOffer(st);if(!offer)continue;
 R.act(st,'hear_sequence');R.act(st,'use_sequence');R.act(st,'review_ok');R.act(st,'talk_none');
 const signed=clone(st.sheet),obj=signed.structurePlan.objectives.find(o=>o.sequence);
 const config={w:{...w,fatigue:4,flags:{}},f,p,slot:'main',minutes:signed.minutes,finish:c.finish,feudHeat:0,
  plan:{game:plan,leash:'script',talk:'none'},seed:981000+rooms*37,preparation:{},flags:{},sheet:signed,structureExecution:true};
 const M=E.create(clone(config));assert.equal(M.structureDirector.sequences.length,1);
 const row=M.structureDirector.sequences[0];assert.equal(row.status,'pending');assert.equal(row.progress,0);
 const before=clone(M.structureDirector);
 S.DIRECTOR.observeSequence(M,{id:obj.sequence.actions[0],t:20},obj.sequence.start,null);
 eq(M.structureDirector,before);
 const source=clone(M.sheet.structurePlan);
 // Save at actual mid-match (prefer an in-progress sequence if reached).
 let replay=null;
 for(let i=0;i<9000&&!M.done;i++){
  if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
  E.next(M);
  if(!replay&&(row.status==='running'||M.t>=360)){
   // Mirror the live UI's saveNight serializer, including the current
   // seeded RNG state; a bare JSON clone drops the RNG function.
   const rngState=M.r.getState();
   replay=E.restore(clone({...M,rState:rngState}));
   assert.equal(replay.r.getState()>>>0,rngState>>>0);
   restored++;
  }
 }
 assert.ok(M.done&&M.final);assert.ok(replay);drive(replay);eq(M.final,replay.final);eq(M.graph.events,replay.graph.events);
 eq(M.sheet.structurePlan,source);
 const result=E.structureReport(M).sequences[0];
 eq(result,M.final.structure.sequences[0]);
 assert.ok(['completed','missed'].includes(result.status));assert.ok(result.attempts<=3);
 assert.equal(result.progress,result.evidence.length);
 assert.equal(M.graph.outcome.booked,c.finish);outcomes[M.graph.outcome.id]=(outcomes[M.graph.outcome.id]||0)+1;
 if(result.attempts)started++;
 if(result.interruptions)interrupted++;
 if(result.status==='completed'){completed++;assert.equal(result.evidence.length,obj.sequence.actions.length);lengths[result.evidence.length]=(lengths[result.evidence.length]||0)+1;}
 if(result.best.length||result.evidence.length&&result.status==='missed')partial++;
 for(const evidence of [result.evidence,result.best]){
  evidence.forEach((e,i)=>{
   assert.equal(e.id,obj.sequence.actions[i]);
   const event=M.graph.events.find(x=>x.id===e.id&&x.t===e.at&&x.preControl===e.entry.control);
   assert.ok(event,'sequence evidence must be a real retained graph landing');
   assert.equal(event.control,e.exit.control);assert.equal(event.position,e.exit.position);assert.equal(event.down,e.exit.down);
   assert.equal(e.performer,G.A[e.id].reverse?event.control:event.preControl);
   if(i){eq(evidence[i-1].exit,e.entry);assert.ok(e.at-evidence[i-1].at<=30);}
   assert.ok(e.progress>=obj.window[0]-.04&&e.progress<=obj.window[1]+.08);
  });
  landings+=evidence.length;
 }
 const stats=byPlan[plan]??={bouts:0,started:0,completed:0};stats.bouts++;stats.started+=Number(result.attempts>0);stats.completed+=Number(result.status==='completed');
 if(j===0){
  const old=clone(config);delete old.sheet.structurePlan.objectives.find(o=>o.sequence).sequence;old.sheet.structurePlan.version=1;
  const a=E.create(old);assert.equal(a.structureDirector.sequences,undefined);
  assert.equal(S.DIRECTOR.sequenceOffer(a,obj.sequence.start),null);legacy++;
 }
 bouts++;
}
assert.equal(rooms,80);assert.ok(bouts>=60&&restored===bouts);
assert.ok(started>=10,'actual sequence openings '+started);
assert.ok(completed>0,'at least one full connected sequence');
assert.ok(interrupted>0,'interrupted negotiations must not be credited as complete');
console.log('PASS MP8A: '+bouts+' live bouts; '+started+' started, '+completed+' completed, '+interrupted+' interrupted, '+partial+' partial; completed lengths '+JSON.stringify(lengths)+'; '+landings+' witnessed evidence records; plans '+JSON.stringify(byPlan)+'; outcomes '+JSON.stringify(outcomes)+'; '+restored+' exact restores; '+legacy+' legacy no-op checks; immutable signed plans.');
