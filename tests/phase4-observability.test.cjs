'use strict';
// Phase 4: the saved result and the screens must describe the same bout.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {engine}=require('./_world.cjs');
const {root}=engine(4204);
const {OfficeGame:G,OfficeData:D,OfficeStips:X}=root;
G.fresh();
const s=G.S;s.cash=99999;s.rep=60;
assert.equal(G.sign('rex'),null);
const c={id:'phase4-archive-1',wid:'rex',rid:'silas',pid:'crown',slot:'main',eventAbs:G.abs(),
 minutes:15,finish:'win_clean',purse:300,title:{pid:'crown',div:D.divisionOf('rex')},
 stip:'nodq',programme:{id:'sample-arc',step:1}};
s.card.push(c);
const fin={stars:3.5,crowd:65,crowdPeak:70,outcome:'booked',botches:0,script:.85,
 adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:15,plan:'story',
 stamina:55,injury:0,ignored:0,callsUsed:[],log:[]};
G.applyResult(c,fin);
const h=s.history[0];
assert.equal(h.cid,c.id,'every result carries its actual contract ID');
assert.equal(h.title.pid,c.title.pid,'title stakes survive beyond the fixture');
assert.equal(h.title.div,c.title.div);
assert.equal(h.stip,'nodq','stipulation survives into the archive');
assert.equal(h.programme.id,c.programme.id,'programme survives into the archive');
assert.equal(h.programme.step,1);
assert.equal(h.outcome,'booked');
assert.equal(h.bookedFinish,'win_clean');

const ui=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
const a=ui.indexOf('function recordedFinishTag(h){'),b=ui.indexOf('function starsText(s){',a);
assert.ok(a>0&&b>a,'archive UI has a central display helper');
const helpers=ui.slice(a,b);
const context={D,esc:x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
 window:{OfficeStips:X}};
const tag=(obj)=>vm.runInNewContext(helpers+'\nrecordedFinishTag('+JSON.stringify(obj)+')',context);
assert.match(tag({finish:'win_clean',bookedFinish:'win_clean',outcome:'dq'}),/Unplanned DQ/,
 'unplanned DQ must not masquerade as the agreed clean win');
assert.doesNotMatch(tag({finish:'win_clean',outcome:'dq'}),/>Win clean</i);
assert.match(tag({finish:'win_clean',outcome:'nc'}),/No contest/);
assert.match(tag({finish:'win_clean',outcome:'double'}),/Finish broken/);
assert.match(tag({finish:'win_clean',outcome:'booked'}),new RegExp(D.FINISHES.win_clean.name));
const stakes=vm.runInNewContext(helpers+'\nboutStakes('+JSON.stringify(c)+')',context);
assert.match(stakes,/Title bout:/);
assert.match(stakes,/No disqualification|No DQ/i);
assert.match(stakes,/Programme chapter 2/);
assert.match(ui,/data-go="pyramid">Territory and rankings<\/button>/,
 'the inbox report must link to an existing route');
assert.doesNotMatch(ui,/data-go="territory"/);
assert.match(ui,/<button class="btn link" data-replay="\$\{i\}"/,
 'match history needs a native keyboard-operable replay button');
console.log('PASS Phase 4: match identity, archive context, authoritative finish and inbox navigation');
