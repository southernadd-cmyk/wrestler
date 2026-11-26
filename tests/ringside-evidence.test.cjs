'use strict';
// Regression: a ringside instruction is not evidence of a performed graph action.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,console,Math,Date,JSON});
const {OfficeData:D,OfficeMatch:E}=root;
const setup=seed=>E.create({
 w:{...D.TALENT[0],fatigue:0,flags:{}},f:D.FOES[0],p:D.PROMOS[0],
 slot:'main',minutes:12,finish:'win_clean',plan:{game:'story',leash:'script',talk:'calm'},
 preparation:{},flags:{},seed
});
const layout=setup(24001);
layout.stage='live';layout.listen=100;layout.offScript='audible';
const before=layout.comply;
assert.equal(E.call(layout,'sheet'),true);
assert.equal(layout.offScript,'audible','instruction cannot instantly prove compliance');
assert.equal(layout.comply,before,'compliance cannot be awarded without a witnessed move');
assert.equal(layout.layoutReturn.status,'pending');
assert.equal(layout.ringsideEvidence[0].status,'pending');
assert.equal(layout.ringsideEvidence[0].from,layout.graph.events.length);
const tired=setup(24002);
tired.stage='live';tired.listen=100;tired.wSt=10;
assert.equal(E.call(tired,'big'),true);
assert.equal(tired.spots,0,'an illegal forced attempt does not count as a landed spot');
assert.equal(tired.ringsideEvidence[0].status,'pending','a queued high spot waits for a legal opening');
assert.equal(tired.graph.events.length,0,'a refused high spot never creates a fake graph action');
assert.equal(tired.final,undefined);
until(tired,()=>tired.ringsideEvidence[0].status!=='pending');
assert.equal(tired.ringsideEvidence[0].status,'unavailable','the call is returned once the match passes without an opening');
// A refused immediate opening must no longer consume the player's option.
const queue=setup(24003);
queue.stage='live';queue.t=20;queue.listen=101;queue.r=()=>.99;
queue.wSt=100;queue.planId='safe';
assert.equal(E.call(queue,'big'),true);
assert.equal(queue.spots,0,'early request does not force an illegal stunt');
assert.equal(queue.ringsideEvidence[0].status,'pending');
assert.equal(queue.calls,2,'reserve a ringside call while the instruction is pending');
assert.equal(E.canCall(queue,'big'),false,'cannot stack duplicate high-spot requests');
queue.bigSpotRequest.expires=queue.t+10;
for(let i=0;i<60&&queue.bigSpotRequest;i++){
 if(queue.decision&&!queue.queue.length)E.resolve(queue,queue.decision.options[0].id);
 E.next(queue);
}
assert.equal(queue.bigSpotRequest,null,'unfulfilled instruction expires');
assert.equal(queue.ringsideEvidence[0].status,'unavailable');
assert.equal(queue.calls,3,'unattempted big spot returns the call');
assert.equal(queue.spots,0,'expired request is not a performed spot');
assert.ok(!queue.callsUsed.includes('big'),'refunded request is not counted as spent');
// A save and restore must preserve the pending request and evidence index.
const saved=setup(24004);
saved.stage='live';saved.t=20;saved.listen=101;
assert.equal(E.call(saved,'big'),true);
const restored=E.restore(JSON.parse(JSON.stringify({...saved,rState:saved.r.getState()})));
assert.equal(restored.bigSpotRequest?.index,0);
assert.equal(restored.ringsideEvidence?.[0]?.status,'pending');
// All four pacing/finish interventions retain their mechanics and report
// observed effects, rather than treating the accepted request as evidence.
function until(m,test){
 for(let i=0;i<1200&&!test();i++){
  if(m.decision&&!m.queue.length)E.resolve(m,m.decision.options[0].id);
  E.next(m);
 }
 assert.ok(test(),'timed ringside instruction must settle');
}
for(const [index,id,allowed] of [
 [24005,'slow',['applied']],[24006,'pickup',['witnessed','no-offence']],
 [24007,'crowd',['responded','flat']]
]){
 const m=setup(index);m.stage='live';m.t=100;m.listen=101;
 assert.equal(E.call(m,id),true);
 assert.equal(m.ringsideEvidence[0].status,'pending');
 until(m,()=>m.ringsideEvidence[0].status!=='pending');
 assert.ok(allowed.includes(m.ringsideEvidence[0].status),id+' must report observed result');
 assert.ok(Number.isFinite(m.ringsideEvidence[0].staminaDelta));
 assert.ok(Number.isFinite(m.ringsideEvidence[0].crowdDelta));
}
const home=setup(24008);home.stage='live';home.t=Math.floor(home.len*.5);home.listen=101;
const contracted=home.o.finish,fullLength=home.len;
assert.equal(E.call(home,'home'),true);
assert.ok(home.len<fullLength,'take it home actually shortens the match');
assert.equal(home.ringsideEvidence[0].oldLength,fullLength);
assert.equal(home.ringsideEvidence[0].newLength,home.len);
until(home,()=>home.done);
assert.equal(home.graph.outcome.id,contracted,'accepted go-home instruction does not change booked finish');
assert.ok(Array.isArray(home.final.ringsideEvidence[0].missedObjectives));
// A Technical worker must be able to fulfil a queued highlight with an
// actual ordinary graph attack, not just one of twelve extreme spectacles.
const technician=D.TALENT.find(w=>w.style==='Technical'),red=D.FOES.find(w=>w.id==='red');
const technical=E.create({
 w:{...technician,fatigue:0,flags:{}},f:red,p:D.PROMOS[0],
 slot:'main',minutes:12,finish:'win_clean',
 plan:{game:'story',leash:'script',talk:'calm'},preparation:{},flags:{},seed:123400
});
until(technical,()=>technical.stage==='live'&&technical.t>=160);
technical.listen=101;
assert.equal(E.call(technical,'big'),true);
until(technical,()=>technical.ringsideEvidence?.[0]?.status!=='pending');
const performed=technical.ringsideEvidence[0];
assert.equal(performed.status,'witnessed','technical high point must not depend on extreme scripted stunts');
assert.equal(performed.kind,'ordinary-graph');
assert.ok(technical.graph.events.some(e=>e.id===performed.action&&e.t===performed.atAction),
 'big moment must refer to a real performed move');
console.log('PASS ringside evidence: deferred big spot and four other evidence-based calls');

 // MP13F.9: deadline, priority, reservation and legacy compatibility.
 {
 const m=setup(24009);m.o.bigSpotArbitrationVersion=1;
 m.stage='live';m.t=100;m.listen=101;m.wSt=0;m.fSt=100;m.planId='safe';m.r=()=>.99;
 assert.equal(E.call(m,'big'),true);assert.equal(m.bigSpotRequest.expires,190);
 assert.equal(m.calls,2);assert.equal(E.bigSpotPriority(m),true);
 m.t=139;assert.equal(E.bigSpotPriority(m),true);
 m.t=140;assert.equal(E.bigSpotPriority(m),false);
 assert.equal(E.canCall(m,'big'),false,'cooperation does not allow stacking');
 m.t=180;until(m,()=>!m.bigSpotRequest);
 assert.equal(m.ringsideEvidence[0].status,'unavailable');assert.equal(m.ringsideEvidence[0].atEnd,190);
 assert.equal(m.calls,3);assert.equal(m.callsUsed.includes('big'),false);
 const old=setup(24010);old.stage='live';old.t=100;old.listen=101;old.wSt=0;old.r=()=>.99;
 assert.equal(E.call(old,'big'),true);assert.equal(old.bigSpotRequest.expires,old.len-40);
 old.t=200;assert.equal(E.bigSpotPriority(old),true);
 const shortened=setup(24011);shortened.o.bigSpotArbitrationVersion=1;
 shortened.stage='live';shortened.t=100;shortened.wSt=0;shortened.listen=101;shortened.r=()=>.99;
 assert.equal(E.call(shortened,'big'),true);assert.equal(E.call(shortened,'home'),true);
 assert.equal(shortened.bigSpotRequest.expires,shortened.len-40);
 const restoreMe=setup(24012);restoreMe.o.bigSpotArbitrationVersion=1;restoreMe.stage='live';restoreMe.t=100;restoreMe.wSt=0;restoreMe.listen=101;
 assert.equal(E.call(restoreMe,'big'),true);
 const resumed=E.restore(JSON.parse(JSON.stringify({...restoreMe,rState:restoreMe.r.getState()})));
 assert.equal(E.bigSpotDeadline(resumed),E.bigSpotDeadline(restoreMe));assert.equal(E.bigSpotPriority(resumed),true);
 console.log('PASS MP13F.9 reserved call, 40-second priority, 90-second refund, shortening and legacy save behavior');
 }

{
 // MP13F.9B retains exactly the same exclusive priority, while a longer
 // cooperative request remains reserved without monopolising sequences.
 const m=setup(24013);m.o.bigSpotArbitrationVersion=2;
 m.stage='live';m.t=100;m.listen=101;m.wSt=0;m.fSt=100;m.planId='safe';m.r=()=>.99;
 assert.equal(E.call(m,'big'),true);assert.equal(m.bigSpotRequest.expires,340);
 m.t=139;assert.equal(E.bigSpotPriority(m),true);
 m.t=140;assert.equal(E.bigSpotPriority(m),false);
 m.t=190;assert.equal(E.canCall(m,'big'),false,'still pending beyond old expiry');
 assert.equal(E.bigSpotDeadline(m),340);
 m.t=330;until(m,()=>!m.bigSpotRequest);
 assert.equal(m.ringsideEvidence[0].status,'unavailable');
 assert.equal(m.ringsideEvidence[0].atEnd,340);assert.equal(m.calls,3);
 const short=setup(24014);short.o.bigSpotArbitrationVersion=2;
 short.stage='live';short.t=100;short.listen=101;short.wSt=0;short.r=()=>.99;
 assert.equal(E.call(short,'big'),true);
 assert.equal(E.call(short,'home'),true);
 assert.equal(E.bigSpotDeadline(short),short.len-40);
 const restore=setup(24015);restore.o.bigSpotArbitrationVersion=2;
 restore.stage='live';restore.t=100;restore.listen=101;restore.wSt=0;
 assert.equal(E.call(restore,'big'),true);
 restore.t=200;
 const resumed=E.restore(JSON.parse(JSON.stringify({...restore,rState:restore.r.getState()})));
 assert.equal(E.bigSpotDeadline(resumed),340);assert.equal(E.bigSpotPriority(resumed),false);
 console.log('PASS MP13F.9B longer cooperative request, bounded expiry, unchanged priority and resumed reservation');
}
