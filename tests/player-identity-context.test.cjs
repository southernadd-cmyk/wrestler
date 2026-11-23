'use strict';
// Names are presentation, never simulation RNG or match contracts.
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');
const {root}=engine(1288);
const {OfficeGame:G,OfficeRingfax:R,OfficeNightReport:N,OfficeMatch:E,OfficeData:D}=root;
const identity={manager:'Casey Finn',stable:'Harbour House',portrait:3};
G.fresh(identity);
const s=G.S,seed=s.seed;
assert.deepEqual({...s.identity},identity);
assert.ok(s.inbox.some(m=>m.body.some(line=>line.includes('Casey Finn')&&line.includes('Harbour House'))),
 'opening letters should address the manager and stable');
const first=R.build(s);
assert.ok(first[100].lines.some(row=>row.text.includes('HARBOUR HOUSE')),'Ringfax index recognises the stable');
assert.ok(first[101].lines.some(row=>row.text.includes('Casey Finn')),'Ringfax editorial recognises the manager');
const before=N.capture(s);
const report=N.build(before,s,[]);
assert.ok(report.subject.includes('Harbour House'));
assert.ok(report.body.some(line=>line.includes('Casey Finn')));
assert.equal(s.seed,seed,'report and teletext must not advance RNG');
const worker=D.TALENT.find(w=>w.style==='Technical')||D.TALENT[0],opponent=D.FOES[0],promoter=D.PROMOS[0];
const args={w:{...worker,fatigue:5,flags:{}},f:opponent,p:promoter,slot:'mid',minutes:10,finish:'win_clean',
 plan:{game:'story',leash:'script',talk:'none'},seed:40431,identity};
const match=E.create(args);
E.next(match); // opening entrance call, no change to result/physics
assert.ok(match.log.some(line=>line.text.includes('Harbour House')&&line.text.includes('Casey Finn')),
 'live commentary introduces the real stable and manager');
const plain=E.create({...args,identity:undefined});
assert.equal(match.r.getState(),plain.r.getState(),'naming must not consume match RNG');
assert.equal(match.o.finish,plain.o.finish,'naming cannot change booked finish');
G.setIdentity({manager:'Riley Shaw',stable:'Midtown Union',portrait:7});
const updated=R.build(G.S);
assert.ok(updated[100].lines.some(row=>row.text.includes('MIDTOWN UNION')),
 'edit identity propagates into new Ringfax views without resetting the career');
assert.equal(G.S.seed,seed,'editing identity cannot alter the simulation seed');
console.log('PASS player identity: inbox, Ringfax, commentary, match report, edit and RNG');
