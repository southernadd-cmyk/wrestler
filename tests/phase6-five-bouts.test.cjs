'use strict';
// The creative loop should not simply replay the same interview five times.
// Drive the shipped dialogue engine, match settlement and rivalry ledger,
// using the same two performers over five successive circuit weeks.
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');
const {root}=engine(6165);
const {OfficeGame:G,OfficeMic:Mic,OfficeRivalry:R}=root;
G.fresh();const s=G.S;s.cash=99999;s.rep=70;
assert.equal(G.sign('rex'),null);
const f=G.F('silas'),p=G.P('dock');
const lines=[],issues=[],records=[];
const finishes=['lose_clean','win_dirty','lose_clean','win_clean','lose_protected'];
const routes=['finisher','tights','submission_defeat','duck_finisher','finisher'];
for(let i=0;i<5;i++){
 const w=G.W('rex'),c={id:'phase6-rival-meeting-'+i,pid:'dock',wid:'rex',rid:'silas',
   slot:'main',minutes:14,purse:400,finish:finishes[i],eventAbs:G.abs()};
 const st=Mic.begin(c,w,f,G.feud('rex','silas'),null,p);
 issues.push(st.core?.cases?.[0]?.issue||'first encounter');
 for(let step=0;st.stage!=='done'&&step<10;step++){
  const opts=Mic.choices(st);assert.ok(opts.length,'dialogue always has a valid reply');
  Mic.choose(st,opts[0].id);
 }
 assert.equal(st.stage,'done','the promo always reaches a conclusion');
 lines.push(st.log.filter(e=>e.side==='w'||e.side==='f'||e.side==='host').map(e=>e.line).join(' | '));
 const promo=Mic.result(st);assert.ok(promo?.dialogue?.length,'transcript is saved');
 const fin={stars:2.7+i*.25,crowd:61+i*3,crowdPeak:75,
  outcome:'booked',finishRoute:routes[i],botches:0,script:.8,
  adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:14,plan:'story',
  stamina:55,injury:0,ignored:0,callsUsed:[],log:[],promo};
 s.card.push(c);G.applyResult(c,fin);
 const record=R.profile('rex','silas');records.push(record.record);
 assert.equal(record.meetings,i+1,'each meeting adds exactly one recorded bout');
 assert.equal(s.history[0].promo.dialogue.length,promo.dialogue.length);
 if(i<4)G.endWeek();
}
assert.equal(new Set(lines).size,5,'five consecutive interview transcripts must actually differ');
assert.ok(new Set(issues).size>=2,'the debate must respond to fresh match evidence');
assert.ok(records.at(-1).w>0&&records.at(-1).f>0,'different finishes actually alter the head-to-head');
assert.equal(s.history.filter(h=>h.wid==='rex'&&h.rid==='silas').length,5);
const snapshot=JSON.stringify(s),reloaded=JSON.parse(snapshot);G.S=reloaded;
const prof=R.profile('rex','silas');assert.equal(prof.meetings,5);
assert.ok(prof.claims.length>=3,'previous positions survive save/reload');
console.log('PASS Phase 6: five different real promo transcripts, recorded results and evolving public evidence');
