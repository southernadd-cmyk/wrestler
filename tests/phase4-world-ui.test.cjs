'use strict';
// Phase 4: errors remain visible and rivalry evidence comes from the real match ledger.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {engine}=require('./_world.cjs');
const {root}=engine(2718);
const {OfficeGame:G,OfficeRivalry:R}=root;
G.fresh();const s=G.S;s.cash=99999;s.rep=60;
assert.equal(G.sign('rex'),null);
const c={id:'phase4-rival-1',wid:'rex',rid:'silas',pid:'crown',eventAbs:G.abs(),slot:'main',
 minutes:14,finish:'win_clean',purse:300};s.card.push(c);
const fin={stars:3.25,crowd:61,crowdPeak:70,outcome:'booked',botches:0,script:.85,
 adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:14,plan:'story',stamina:60,injury:0,
 ignored:0,callsUsed:[],log:[]};
G.applyResult(c,fin);
const ledger=R.profile('rex','silas');
assert.equal(ledger.record.w,1);assert.equal(ledger.record.meetings,1);
const ui=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
const a=ui.indexOf('function rivalrySnapshot(f){'),b=ui.indexOf('function renderRivalries(){',a);
assert.ok(a>=0&&b>a,'real rivalry ledger is exposed through a dedicated UI function');
const snapshot=vm.runInNewContext(ui.slice(a,b)+"\nrivalrySnapshot({wid:'rex',rid:'silas'})",
 {window:{OfficeRivalry:R},weekLabel:n=>'Week '+n});
assert.match(snapshot.record,/1 W/);
assert.match(snapshot.last,/Your wrestler won/);
assert.match(snapshot.relations,/Your wrestler:/);
assert.match(ui,/Backstage context/);
assert.match(ui,/Momentum \$\{Math\.round\(a\.momentum\)\}/,'programme momentum is displayed');
// Diagnostics are saved, survive reload and fail strict test sessions.
assert.equal(G.systemErrors().length,0);
const silent={error(){}}; // The test deliberately creates an exception.
const oldConsole=console.error;console.error=()=>{};
try{
 G.reportError('phase4-test',new Error('simulated module failure'));
 assert.equal(G.systemErrors().length,1);
 assert.equal(G.systemErrors()[0].source,'phase4-test');
 assert.match(G.systemErrors()[0].message,/simulated module failure/);
 G.S=JSON.parse(JSON.stringify(G.S));
 assert.equal(G.systemErrors().length,1,'diagnostics persist across career hydration');
 root.OFFICE_STRICT=true;
 assert.throws(()=>G.reportError('phase4-test',new Error('strict failure')),/strict failure/);
 root.OFFICE_STRICT=false;
}finally{console.error=oldConsole;}
assert.match(ui,/System alerts/);
assert.match(ui,/G\.systemErrors\(\)/);
console.log('PASS Phase 4: rivalry facts, programme momentum, persistent diagnostics and strict failures');
