'use strict';
// The Office v3.0 — no-dependency character-memory and consequence regression.
// Run: node tests/memory-flow.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'game source present');
new vm.Script(script);
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const db=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,console,Date,Math,JSON});
const G=root.OfficeGame,M=root.OfficeMatch,O=root.OfficeMemory,D=root.OfficeData;
assert.ok(G&&M&&O&&O.context&&O.trust);
function setup(){
 G.fresh();
 assert.equal(G.sign('rex'),null);
 const w=G.W('rex'),f=G.F('silas'),p=G.P('dock');
 const c={id:'memory-r1',wid:w.id,rid:f.id,pid:p.id,slot:'mid',minutes:12,
  finish:'lose_clean',purse:300,feudHeat:0,blowoff:false};
 const fin={stars:2.75,crowd:61,crowdPeak:68,outcome:'booked',botches:0,script:.9,
  adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:12,
  plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[]};
 const out=G.applyResult(c,fin);
 const pending=G.pending().filter(m=>m.dtype==='office_debrief');
 assert.equal(pending.length,1,'one meaningful backstage conversation');
 assert.ok(out.some(x=>/Memory:/.test(x.text)),'memory visible in result');
 assert.equal(O.view('rex').entries[0].kind,'humiliation');
 assert.equal(G.S.history[0].notes.at(-1).startsWith('Memory:'),true);
 return {w,f,p,c,fin,msg:pending[0]};
}
let x=setup();
assert.equal(x.msg.options.length,3);
assert.equal(x.msg.body[0].includes('lose'),true);
const trustBefore=O.trust('rex'),promoterBefore=x.p.trust;
assert.match(G.answer(x.msg.id,'back'),/defended/);
assert.equal(O.trust('rex'),trustBefore+8);
assert.equal(x.p.trust,promoterBefore-4);
assert.equal(G.pending().length,0,'debrief no longer blocks the next week');
assert.equal(O.view('rex').entries[0].kind,'conversation');
// The memory changes future match cooperation, and is brought into commentary.
const p={w:x.w,f:x.f,p:x.p,slot:'mid',minutes:12,finish:'lose_clean',
 plan:{game:'brawl',leash:'script',talk:'calm'},preparation:{},flags:{},seed:311};
const good=M.create({...p,memory:{trust:98,rivalry:30,recall:'A difficult backstage conversation.'}});
const bad=M.create({...p,memory:{trust:5,rivalry:30,recall:'A difficult backstage conversation.'}});
assert.ok(good.comply>bad.comply,'manager trust influences willingness to follow the sheet');
assert.equal(good.resent,false,'high trust eases a proud wrestler’s resentment');
assert.equal(bad.resent,true,'low trust leaves the resentment intact');
assert.ok(script.includes('M.o.memory?.recall'),'remembered events enter commentary');
assert.ok(script.includes('recalled.promoPrompt'),'remembered events enter promos');
assert.ok(script.includes('What they remember</h3>'),'memory appears on profile');
// Duplicate result callbacks cannot generate duplicate memories or inbox choices.
const oldCount=O.view('rex').entries.length;
G.applyResult(x.c,x.fin);
assert.equal(O.view('rex').entries.length,oldCount);
// Career export/import and older career states retain the new optional data.
const serialized=JSON.stringify(G.S);
G.S=JSON.parse(serialized);
assert.equal(O.view('rex').entries.length,oldCount);
assert.equal(O.trust('rex'),trustBefore+8);
const legacy=JSON.parse(serialized);delete legacy.officeMemory;
G.S=legacy;
assert.equal(O.view('rex').entries.length,0,'legacy saves have empty memory but still load');
assert.ok(Number.isInteger(O.trust('rex')),'legacy saves get default trust');
// A promise is not a free morale click: it uses the existing binding calendar.
x=setup();
assert.match(G.answer(x.msg.id,'promise'),/within two weeks/);
assert.equal(x.w.promise.status,'open');
G.endWeek();G.endWeek();G.endWeek();
assert.equal(x.w.promise.status,'broken','missing an opportunity has real consequences');
assert.ok(O.view('rex').entries.some(e=>e.kind==='promise_broken'));
assert.ok(O.trust('rex')<trustBefore,'broken promise damages durable trust');
// The same promise can be fulfilled by a real featured match record.
x=setup();
G.answer(x.msg.id,'promise');
G.S.history.unshift({wid:x.w.id,rid:x.f.id,slot:'feature',season:G.S.season,week:G.S.week,stars:3.5});
x.w.matches++;
G.endWeek();
assert.equal(x.w.promise.status,'kept');
assert.ok(O.view('rex').entries.some(e=>e.kind==='promise_kept'));
// One difficult inbox confrontation per show, despite several distinct memories.
x=setup();
const c2={...x.c,id:'memory-r2',rid:'red'};
const f2={...x.fin,injury:2,injuryPart:'knee'};
G.applyResult(c2,f2);
assert.equal(G.pending().filter(m=>m.dtype==='office_debrief').length,1);
assert.ok(O.view('rex').entries.some(e=>e.kind==='hurt'),'injury still remembered');
// The treatment option cannot spend money the stable does not have.
x=setup();
G.answer(x.msg.id,'business');
G.endWeek();
const injury={...x.c,id:'injury-first'};
const finInjury={...x.fin,injury:2,injuryPart:'knee'};
G.applyResult(injury,finInjury);
const recovery=G.pending().find(m=>m.dtype==='office_debrief'&&m.args[3]==='injury-first');
assert.ok(recovery,'urgent injury gets a debrief even within the usual cooldown');
G.S.cash=0;
assert.match(G.answer(recovery.id,'medical'),/need £120/);
assert.equal(recovery.answer,null);
assert.match(G.answer(recovery.id,'rest'),/recover/);
// Repeating an ordinary loss in the following week adds history, not spam.
x=setup();G.answer(x.msg.id,'business');G.endWeek();
G.applyResult({...x.c,id:'repeat-clean-loss'},x.fin);
assert.equal(G.pending().filter(m=>m.dtype==='office_debrief').length,0,'ordinary debrief has a cooldown');
assert.ok(O.view('rex').entries.some(e=>e.text.includes('second decisive defeat')));
// A real match plays through after a memory has been recorded.
x=setup();G.answer(x.msg.id,'business');
const encounter=M.create({...p,w:{...x.w,fatigue:x.w.fatigue},f:x.f,p:x.p,memory:O.context(x.w.id,x.f.id),seed:882});
for(let i=0;i<9000;i++){
 if(encounter.decision&&!encounter.queue.length){
  const choice=encounter.decision.options.find(o=>['home','job','cut','protect'].includes(o.id))||encounter.decision.options[0];
  M.resolve(encounter,choice.id);
 }
 M.next(encounter);
 if(encounter.done)break;
}
assert.ok(encounter.done&&encounter.final,'character-driven match still finishes');
assert.equal(encounter.graph.outcome.id,'lose_clean','story never changes the contracted result');
assert.ok(encounter.log.some(l=>/remembers|understands the booking/i.test(l.text)),'history recalled in match');
console.log('PASS memory v3.0: Rex confrontation; credible tradeoffs; lasting trust; old saves; promise kept/broken; debut and repeat match; one debrief per show');
