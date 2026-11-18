'use strict';
// Match-night consistency: the booking, bell, optional post-bell scene and the saved
// rivalry/history must tell the same story. Tests the actual installed wrappers.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {engine}=require('./_world.cjs');
const {root}=engine(71029);
const {OfficeData:D,OfficeGame:G,OfficeSigning:Sg,OfficeAfter:A,
 OfficeRivalry:Riv,OfficeBonds:B,OfficeOutcome:O}=root;
let nextId=1;
function reset(){
 G.fresh();const s=G.S;s.cash=99999;s.rep=60;
 assert.equal(G.sign('rex'),null);
 s.inbox=[];s.offers=[];
 return s;
}
function contract(o={}){
 const c={id:'phase2-'+(nextId++),wid:'rex',rid:'silas',pid:'crown',
  eventAbs:G.abs(),slot:'main',minutes:16,finish:'win_clean',purse:300,
  ...o};
 G.S.card.push(c);return c;
}
const result=(other={})=>({
 stars:3.5,crowd:60,crowdPeak:66,outcome:'booked',finishRoute:'finisher',
 botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},
 minutes:16,plan:'story',stamina:65,injury:0,ignored:0,callsUsed:[],log:[],
 ...other
});
const record=c=>Riv.ledger(c.wid,c.rid).meetings.find(m=>m.cid===c.id);

// A signing increases rivalry heat immediately. Its returned promo must NOT award
// the same tension to that feud again through the nested applyResult wrappers.
{
 const s=reset(),c=contract(),k=c.wid+':'+c.rid;
 s.feuds[k]={wid:c.wid,rid:c.rid,heat:18,matches:1,closed:false,since:G.abs()};
 const st=Sg.begin(c,G.W('rex'),G.F(c.rid),G.P(c.pid));
 for(const id of ['late','face','flip'])assert.ok(Sg.choose(st,id));
 const afterSigning=s.feuds[k].heat;
 const promo=Sg.result(st);
 assert.equal(st.stage,'done');
 assert.equal(promo.heatDelta,0,'no second postmatch heat payment');
 assert.ok(promo.signingHeat>0,'the intensity is still recorded');
 assert.equal(afterSigning,18+promo.signingHeat,'signing heat applied once');
 G.applyResult(c,result({promo}));
 const expectedMatchHeat=Math.round(5+3.5*4+(60-50)/6);
 assert.equal(s.feuds[k].heat,afterSigning+expectedMatchHeat,
  'the match adds its own feud growth but does not replay the signing');
 assert.equal(s.history[0].promo.style,'Contract signing');
 assert.ok(s.history[0].notes.some(n=>n.includes('applied at the signing')));
}
console.log('PASS contract signing feud heat is applied once, distinct from match heat');

// A planned sporting gesture prevents an unrelated automatic after-bell betrayal.
// This does not stop a genuine refusal when the planned handshake is performed.
{
 const s=reset(),f=D.ALL.find(x=>!G.W(x.id)&&(x.ego||0)>=72&&x.id!=='silas');
 assert.ok(f,'high-ego rival available');
 const c=contract({rid:f.id,afterPlan:'handshake'});
 B.shift(c.wid,c.rid,85,'friend','Old friends.',c.id+':friend');
 const cons=G.applyResult(c,result());
 assert.ok(!cons.some(x=>/turned on|betrayal/i.test(x.text)));
 assert.equal(s.bonds.done[c.id+':turn'],undefined,
  'a separate spontaneous betrayal must not be generated');
 assert.equal(s.history[0].after,undefined,'the scene is only a plan, not a completed act');
 A.begin(c,result(),'handshake');
 assert.ok(s.history[0].after&&s.history[0].after.plan==='handshake');
}
console.log('PASS an agreed handshake cannot be contradicted by a spontaneous betrayal');

// After-bell participation is a discrete performed event. It is recorded against
// the existing match and the rivalry ledger and cannot be executed twice.
{
 const s=reset(),c=contract(),f=result({stars:4});
 G.applyResult(c,f);
 const h=s.history.find(x=>x.cid===c.id),m=record(c);
 assert.ok(h&&m);
 assert.equal(h.after,undefined);
 assert.equal(m.after,undefined,'no post-bell facts before the scene starts');
 assert.ok(!A.state().done[c.id],'an unplayed angle is not marked as complete');
 const cash=s.cash,trust=G.P(c.pid).trust;
 const st=A.begin(c,f,'staredown');
 assert.equal(st.stage,'mic');
 assert.equal(h.after.plan,'staredown');
 assert.ok(h.after.effects.some(x=>/stare-down/i.test(x)));
 assert.equal(record(c).after.plan,'staredown');
 assert.ok(h.notes.some(x=>/After the bell/.test(x)));
 assert.ok(A.speak(st,'gloat'),'the player actually spoke');
 assert.equal(h.after.said,'gloat');
 assert.equal(record(c).after.said,'gloat');
 assert.ok(Riv.ledger(c.wid,c.rid).talks.some(x=>x.cid===c.id&&x.issue==='after'));
 assert.equal(A.begin(c,f,'staredown').stage,'done','cannot replay the angle');
 assert.equal(s.cash,cash,'no accidental second purse');
 assert.ok(G.P(c.pid).trust<=100&&Number.isFinite(trust));
 const count=Riv.ledger(c.wid,c.rid).talks.filter(x=>x.cid===c.id&&x.issue==='after').length;
 assert.equal(count,1,'microphone history is written once');
}
console.log('PASS performed post-bell angles and speech reach history and rivalry exactly once');

// An actual unexpected disqualification overrides the booked winner in the
// rivalry evidence and cannot be presented as a clean win.
{
 const s=reset(),c=contract({finish:'win_clean'}),f=result({outcome:'dq',finishRoute:'dq_cheap'});
 G.applyResult(c,f);
 const m=record(c);
 assert.equal(O.interpret(c,f).winner,'f');
 assert.equal(m.winner,'f','the referee decision is authoritative');
 assert.equal(m.how,'dq');
 assert.equal(m.outcome,'dq');
 assert.equal(s.history[0].outcome,'dq');
 assert.equal(s.history[0].contractHonoured,false);
 assert.ok(!Riv.profile(c.wid,c.rid).facts.some(x=>x.cid===c.id&&x.kind==='clean_win_w'),
  'the result must not support a false clean victory claim');
}
console.log('PASS referee DQs supersede contracted finishes in the rivalry archive');

// A title-winning promise is not fulfilled merely by a DQ victory.
// Only actual belt ownership can satisfy the claim.
{
 const s=reset(),div=D.divisionOf('rex');
 const c=contract({finish:'win_dq',title:{pid:'crown',div},
  programme:{id:'phase2-title-claim',step:0}});
 s.territory.titles.crown[div].holder='silas';
 const prog={id:'phase2-title-claim',pid:'crown',div,type:'title',wid:'rex',rid:'silas',
  beats:[{cid:c.id,at:G.abs(),rid:'silas',done:false,slot:'main',finish:'win_dq'}],signed:G.abs()};
 root.OfficeProgrammes.state(s.territory).live.push(prog);
 root.OfficeProgrammeArcs.prepare(c,'gamble',{quality:96});
 G.applyResult(c,result({finishRoute:'dq_chair_f',stars:4.75}));
 assert.equal(root.OfficeTerritory.title('crown',div).holder,'silas',
  'the champion retains on a contractual DQ');
 assert.equal(prog.arc.timeline[0].claim,'broken',
  'high-quality DQ victory does not fulfil a promise to win the belt');
 assert.match(prog.arc.timeline[0].recap,/not delivered/);
}
console.log('PASS title promises require championship ownership, not merely winning by DQ');

// Legacy matches are 16 weeks per season. Backfill order, evidence age and
// score must use the same clock as the active career.
{
 const s=reset();
 s.history.unshift({cid:'old-example',season:3,week:2,wid:'rex',rid:'malik',
  name:'Titan',foe:'Malik',finish:'lose_clean',outcome:'booked',stars:2.5});
 // An older result recorded as a DQ is not an agreed clean win,
 // even if the planned finish was a player victory.
 s.history.unshift({cid:'old-dq',season:3,week:3,wid:'rex',rid:'malik',
  finish:'win_clean',outcome:'dq',stars:2});
 const L=Riv.ledger('rex','malik');
 const a=L.meetings.find(m=>m.cid==='old-example'),dq=L.meetings.find(m=>m.cid==='old-dq');
 assert.equal(a.abs,34,'season 3 week 2 is absolute week 34');
 assert.equal(dq.abs,35);
 assert.equal(dq.winner,'f','legacy referee DQs must not be reported as player victories');
 assert.equal(dq.how,'dq','legacy referee DQ is not a clean win');
}
console.log('PASS legacy rivalry dates use the real sixteen-week career season');

// UI-level invariant: saving the result must not invoke post-bell mutations.
// Both available choices must be persisted across a reload of the result screen.
{
 const ui=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
 const section=ui.slice(ui.indexOf('function result(){'),ui.indexOf('function syncAfterEvidence(){'));
 assert.ok(section.includes('night.after=null;'),'do not pre-perform the angle');
 assert.ok(section.includes('night.afterReady=window.OfficeAfter?'),'store a proposed scene');
 assert.doesNotMatch(section,/night\.after=window\.OfficeAfter\?OfficeAfter\.begin/);
 assert.match(ui,/if\(d\.tv==='after'\)\{[\s\S]*?OfficeAfter\.begin\(c,fin,plan\)/);
 assert.match(ui,/afterReady:night\.afterReady\|\|null/,'reload saves the proposed scene');
 assert.match(ui,/const afterOpen=saved\?\.stage==='after'&&!!saved\.after/, 'reload also restores a finished microphone screen');
 assert.match(ui,/night\.afterReady\?/, 'result screen offers explicit choice');
 assert.match(ui,/h\.consequences=cons\.map/,'the completed outer wrapper effects are archived');
 assert.match(ui,/h\.stip=c\.stip\|\|null/,'the stipulation itself survives the report');
}
console.log('PASS result-screen skip cannot silently trigger post-bell events');
