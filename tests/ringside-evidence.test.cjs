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
console.log('PASS ringside evidence: pending layout, unavailable legal big spot');
