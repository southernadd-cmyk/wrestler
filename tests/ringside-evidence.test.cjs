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
assert.equal(tired.ringsideEvidence[0].status,'unavailable');
assert.equal(tired.graph.events.length,0,'a refused high spot never creates a fake graph action');
assert.equal(tired.final,undefined);
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
console.log('PASS ringside evidence: witnessed-only layout, deferred/refunded big spot, save safety');
