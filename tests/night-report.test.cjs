'use strict';
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');

const {root}=engine(1337);
const {OfficeGame:G,OfficeNightReport:R,OfficeTerritory:T}=root;
assert.ok(R,'the match-night report module is loaded into the actual game engine');
G.fresh();
const s=G.S;
const recruit=s.free.find(w=>w.fee<=s.cash-500);
assert.ok(recruit,'a starter can be signed');
assert.equal(G.sign(recruit.id),null);
const w=G.W(recruit.id),p=s.promoters[0];
const start=R.capture(s);
const baseCash=s.cash,baseRep=s.rep,baseTrust=p.trust,baseMorale=w.morale;
s.cash+=320;s.rep+=2;p.trust=Math.min(100,p.trust+5);
w.morale=Math.min(100,w.morale+5);
s.history.unshift({season:start.season,week:start.week,wid:w.id,pid:p.id,purse:420,stars:3.5});
s.books.push({a:start.abs,wages:100,other:75});
const match={cid:'test-bout',season:start.season,week:start.week,pid:p.id,wid:w.id,rid:'test-rival',
 name:w.name,foe:'Test Rival',stars:3.5,label:'★★★½',consequences:[p.name+' trust +5.']};
const report=R.build(start,s,[match]);
assert.equal(report.kind,'info');
assert.ok(report.subject.includes('S'+start.season+' W'+start.week));
const section=name=>report.sections.find(x=>x.title===name)?.lines||[];
assert.match(section('In the ring').join(' '),/Test Rival.*★★★½/);
assert.ok(section('The business').some(x=>x.includes(G.money(baseCash)+' → '+G.money(s.cash))));
assert.ok(section('The business').some(x=>x.includes('Match purses received: £420')));
assert.ok(section('The business').some(x=>x.includes('Territory reputation: '+baseRep+' → '+s.rep)));
assert.ok(section('The promoters').some(x=>x.includes(baseTrust+' → '+p.trust)));
assert.ok(section('The dressing room').some(x=>x.includes('morale '+baseMorale+' → '+w.morale)));
assert.equal(section('Titles and rankings').filter(x=>x.includes('Championship')).length,0,
 'unchanged championships must never be reported as title switches');
assert.equal(section('Programmes').length,0,'do not invent a programme chapter');

const older=R.build(null,s,[match]);
assert.ok(older.sections.some(x=>x.lines.some(l=>l.includes('before-and-after comparisons are unavailable'))));
assert.ok(!older.sections.some(x=>x.title==='The promoters'),'no unsupported trust delta in older saves');
assert.ok(!older.sections.some(x=>x.title==='The dressing room'),'no unsupported morale delta in older saves');

// End-week execution, including extension wrappers, is compatible with the report.
const nextBefore=R.capture(s);
G.endWeek();
const settled=R.build(nextBefore,G.S,[{...match,season:nextBefore.season,week:nextBefore.week}]);
assert.ok(settled.sections.some(x=>x.title==='The business'));
assert.ok(settled.sections.some(x=>x.title==='Before next week'));
console.log('Match-night report: actual deltas, provenance, old saves, weekly settlement OK');
