'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const values=new Map();
let blocked=false,events=0;
const root={addEventListener(){},Event:class{constructor(type){this.type=type;}},dispatchEvent(e){if(e.type==='office-save-status')events++;}};
const store={getItem:k=>values.get(k)||null,setItem(k,v){if(blocked)throw new Error('QuotaExceededError');values.set(k,String(v));},removeItem:k=>values.delete(k)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:store,Date,Math,JSON,console});
const {OfficeGame:G}=root;
G.fresh();
assert.equal(G.saveStatus().ok,true);
assert.ok(G.saveStatus().lastSaved>0);
const initial=G.saveStatus().lastSaved,baseline=values.get('the-office-v22');
blocked=true;G.S.cash+=73;
assert.equal(G.save(),false,'failed storage writes are reported');
assert.equal(G.saveStatus().ok,false);
assert.equal(G.saveStatus().lastSaved,initial,'last successful save is not updated after failure');
assert.equal(values.get('the-office-v22'),baseline,'a failed save cannot be misrepresented as persisted');
blocked=false;
assert.equal(G.save(),true,'a successful subsequent save clears the failure');
assert.equal(G.saveStatus().ok,true);
assert.equal(JSON.parse(values.get('the-office-v22')).cash,G.S.cash);
assert.ok(events>=2,'the interface is notified when persistence changes state');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
assert.match(html,/id="saveWarning"[^>]*role="alert"/);
assert.match(html,/data-act="export"/,'warning offers export to recover unsaved progress');
assert.match(ui,/window.addEventListener\('office-save-status',showSaveStatus\)/);
console.log('PASS failed saves are visible, distinguish last successful write, and suggest export');

G.S.season=6;G.S.week=1;G.S.rep=100;G.S.goals={};
const goal=G.goalList()[0];
assert.match(goal.text,/programme chapters/,'no unobtainable 115-reputation target after season five');
assert.equal(goal.done,false);
G.S.goals.programmeChapters=2;
assert.equal(G.goalList()[0].done,true,'the alternate long-career goal is achievable');
console.log('PASS season-six objectives stay achievable');

// Detailed commentary remains bounded, while current-season ratings remain complete.
G.S.season=3;G.S.week=6;G.S.goals={};
G.S.cash=99999;
assert.equal(G.sign('rex'),null);
const fin=()=>({stars:3.25,crowd:59,crowdPeak:66,outcome:'booked',botches:0,script:.9,
 adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:10,plan:'safe',stamina:60,injury:0,ignored:0,callsUsed:[],log:[]});
for(let i=0;i<47;i++){
 const c={id:'rating-'+i,pid:'dock',wid:'rex',rid:'silas',slot:'mid',finish:'win_clean',purse:100,eventAbs:G.abs()};
 G.S.card.push(c);G.applyResult(c,fin());
}
assert.equal(G.S.history.length,40,'full match descriptions remain bounded');
assert.equal(G.S.seasonResults.filter(x=>x.season===3).length,47,'all 47 current-season ratings survive');
assert.ok(G.S.seasonResults.every(x=>!('log' in x)&&!('notes' in x)),'summary does not grow with commentary');
assert.ok(G.S.seasonResults.every(x=>x.name&&x.foe),'the chart retains names and opponents for every rating');
assert.match(ui,/\(s\.seasonResults\|\|s\.history\)\.filter/,'chart uses the complete lightweight ledger');
console.log('PASS season ratings persist after detailed match reports roll off');

// INT12A: old/malformed snapshots cannot silently advance or replay a career.
G.fresh();assert.equal(G.sign('kit'),null);
{
 const s=G.S,now=G.abs(),c={id:'recover-match',pid:'dock',wid:'kit',rid:'silas',slot:'mid',finish:'win_clean',purse:100,eventAbs:now};
 s.card=[c];
 const saved={queue:[c.id],i:0,stage:'live',careerSeed:s.careerSeed,before:{abs:now},M:{test:true}};
 assert.equal(G.recoverNight(saved).stage,'live');
 assert.equal(G.recoverNight({...saved,careerSeed:s.careerSeed+1}),null);
 assert.equal(G.recoverNight({...saved,before:{abs:now-1}}),null);
 assert.equal(G.recoverNight({...saved,queue:['foreign']}),null);
 G.applyResult(c,fin());
 const recovered=G.recoverNight(saved);
 assert.equal(recovered.stage,'recovered-result');assert.equal(recovered.M,null);
 assert.equal(recovered.i,1);
 s.after??={};s.after.autonomous={required:true,cid:c.id,stage:'angle'};
 assert.equal(G.recoverNight(null).after.cid,c.id,'career-only save retains compulsory response');
 delete s.after.autonomous;
 const before=JSON.stringify(s);
 assert.equal(G.importCareer({v:22,roster:[],offers:[]}),false);
 assert.equal(JSON.stringify(G.S),before);
 assert.equal(G.importCareer(JSON.parse(before)),true);
}
G.msg({kind:'decision',subject:'Important pending reply',body:[]});
for(let i=0;i<75;i++)G.msg({kind:'info',subject:'Routine report '+i,body:[]});
assert.ok(G.pending().some(m=>m.subject==='Important pending reply'));
assert.equal(G.S.inbox.length,60);
assert.match(ui,/G\.importCareer\(x\)/);
assert.match(ui,/G\.recoverNight\(saved\)/);
console.log('PASS INT12A recovery validation, settled match guard, protected decisions and import safety');

// INT12B: exercise the real outer match and weekly wrapper chains, not mocks.
G.fresh();assert.equal(G.sign('kit'),null);
{
 const c={id:'atomic-match',pid:'dock',wid:'kit',rid:'silas',slot:'mid',finish:'win_clean',purse:100,eventAbs:G.abs()};
 G.S.card=[c];G.save();
 const baseline=values.get('the-office-v22'),startEvents=events;
 assert.throws(()=>G.atomicSettlement(()=>{
  G.applyResult(c,fin());
  assert.equal(values.get('the-office-v22'),baseline,'core and wrapper saves are deferred');
  G.msg({subject:'should roll back',kind:'info'});G.save();
  throw new Error('late match failure');
 }),/late match failure/);
 assert.equal(values.get('the-office-v22'),baseline,'no half-settled result reaches disk');
 assert.equal(events,startEvents,'no intermediate persistence notifications');
 assert.equal(JSON.stringify(G.S),baseline,'in-memory match settlement rolled back');
 const current=G.S.card[0];
 G.atomicSettlement(()=>{
  G.applyResult(current,fin());
  G.msg({subject:'final consequence',kind:'info'});G.save();
  assert.equal(values.get('the-office-v22'),baseline);
 });
 assert.equal(events,startEvents+1,'only one commit after all match consequences');
 assert.equal(JSON.parse(values.get('the-office-v22')).inbox[0].subject,'final consequence');
 assert.equal(G.S.card.length,0);
 const restored=G.recoverNight({period:G.abs(),careerSeed:G.S.careerSeed,queue:[c.id],i:0,stage:'live',results:[]});
 assert.equal(restored.results[0].cid,c.id,'recovered show retains settled match in report');
 assert.equal(restored.stage,'recovered-result');
 const optional=G.recoverNight({period:G.abs(),careerSeed:G.S.careerSeed,queue:[c.id],i:1,stage:'after',after:{cid:c.id,stage:'mic'}});
 assert.equal(optional.stage,'after','a valid unfinished optional microphone scene survives refresh');
 const beforeWeek=values.get('the-office-v22'),week=G.abs(),beforeEvents=events;
 assert.throws(()=>G.atomicSettlement(()=>{
  G.endWeek();
  assert.equal(values.get('the-office-v22'),beforeWeek);
  throw new Error('late weekly failure');
 }),/late weekly failure/);
 assert.equal(G.abs(),week,'week rolled back');
 assert.equal(JSON.stringify(G.S),beforeWeek,'all weekly changes rolled back');
 assert.equal(events,beforeEvents);
 G.atomicSettlement(()=>{G.endWeek();G.msg({subject:'whole week recap',kind:'info'});G.save();});
 assert.equal(G.abs(),week+1);assert.equal(events,beforeEvents+1);
 assert.equal(JSON.parse(values.get('the-office-v22')).inbox[0].subject,'whole week recap');
 const durable=values.get('the-office-v22');blocked=true;
 G.atomicSettlement(()=>{G.S.cash+=11;G.save();G.S.cash+=12;});
 assert.equal(G.saveStatus().ok,false);assert.equal(values.get('the-office-v22'),durable);
 assert.equal(G.S.cash,JSON.parse(durable).cash+23,'complete unsaved career stays available for export');
 blocked=false;G.save();
}
assert.match(ui,/G\.atomicSettlement\(\(\)=>\{/);
assert.match(ui,/!night\?\.queue\|\|G\.saveStatus\(\)\.ok===false/);
console.log('PASS INT12B atomic match and weekly settlement, late failure rollback, recovered reporting and failed disk write');
