'use strict';
// After the bell: the angle is the first choice of the post-match segment, made with the result known.
// Dennis's meeting no longer asks about it; a night saved with a plan agreed backstage still plays it.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeAfter:A,OfficeBonds:B}=root;
const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','ui.js'),'utf8');
const fin=(o={})=>({stars:3.5,crowd:66,crowdPeak:72,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:15,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[],...o});
let n=0;
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=55;G.sign('rex');s.inbox=[];s.offers=[];return s;}
function contract(o={}){
 const s=G.S,div=D.divisionOf('rex'),pid=o.pid||'dock';
 const rid=o.rid||T.opponents(pid,'mid',div)[0].id;
 if(!s.territory.cards[pid].rex)s.territory.cards[pid].rex={score:40,matches:2,wins:1};
 const c={id:'c-choice-'+(n++),pid,rid,wid:'rex',slot:'mid',minutes:12,finish:'win_clean',purse:200,eventAbs:G.abs(),...o};
 s.card.push(c);return c;
}
const play=(c,f=fin())=>{G.applyResult(c,f);return f;};
const snap=s=>JSON.stringify({bonds:s.bonds.pairs||s.bonds,feuds:s.feuds,cash:s.cash});

// 1. With no plan agreed, the segment opens on the angle, and nothing has happened yet.
{
 const s=career(),c=contract({finish:'win_clean'}),f=play(c),before=snap(s);
 const st=A.begin(c,f);
 assert.equal(st.stage,'angle','the first call is what happens after the bell');
 assert.equal(st.angle,null);assert.equal(st.cons.length,0);
 assert.equal(A.micOptions(st).length,0,'the microphone waits for the angle');
 const v=A.view(st);
 assert.equal(v.title,'The bell has gone');
 assert.match(v.ask,/What does Titan do now\?/);
 assert.equal(v.options.map(o=>o.id).join(),'none,handshake,staredown,beatdown,celebrate');
 assert.equal(snap(s),before,'choosing has not started, so the save is untouched');
 assert.equal(s.history.find(h=>h.cid===c.id).after,undefined,'no post-bell evidence before the choice');
 console.log('PASS the after-bell segment opens on the angle choice');
}

// 2. The options and their effects are the old ones; the lap of honour follows the actual result.
{
 career();const c=contract({finish:'win_clean'}),f=play(c,fin({outcome:'dq'}));
 const st=A.begin(c,f);
 assert.ok(!A.view(st).options.some(o=>o.id==='celebrate'),'no lap of honour after being disqualified');
 assert.equal(A.choose(st,'celebrate'),false,'and it cannot be forced');
 assert.equal(A.choose(st,'nonsense'),false,'unknown angles are refused');
 assert.equal(st.stage,'angle');
 for(const plan of ['handshake','staredown','beatdown','celebrate']){
  const s1=career();n=40;const c1=contract({finish:'win_clean'});const f1=play(c1);
  const old=A.begin(c1,f1,plan),oldOut=JSON.stringify([old.angle,old.cons,old.log,snap(s1)]);
  const s2=career();n=40;const c2=contract({finish:'win_clean'});const f2=play(c2);
  const now=A.begin(c2,f2);assert.ok(A.choose(now,plan));
  assert.equal(JSON.stringify([now.angle,now.cons,now.log,snap(s2)]),oldOut,plan+' plays exactly as it did when agreed backstage');
  assert.equal(now.stage,'mic');assert.equal(now.plan,plan);
  assert.equal(s2.history.find(h=>h.cid===c2.id).after.plan,plan,'the choice reaches the history');
  assert.equal(A.choose(now,'staredown'),false,'the angle is chosen once');
 }
 console.log('PASS the moved choice keeps the same options and effects');
}

// 3. Nothing at all goes straight to the microphone; the scene cannot be replayed.
{
 career();const c=contract({finish:'lose_clean'}),f=play(c);
 const st=A.begin(c,f);
 assert.ok(!A.view(st).options.some(o=>o.id==='celebrate'));
 assert.ok(A.choose(st,'none'));assert.equal(st.stage,'mic');assert.equal(st.cons.length,0);
 assert.ok(A.micOptions(st).some(o=>o.id==='concede'));
 assert.equal(A.begin(c,f).stage,'done','a second begin for the same contract plays nothing');
 console.log('PASS “nothing” leads to the microphone, and the segment runs once');
}

// 4. A segment saved part-way through the choice resumes from its JSON.
{
 const s=career(),c=contract({finish:'win_clean'}),f=play(c);
 const st=JSON.parse(JSON.stringify(A.begin(c,f)));
 assert.equal(st.stage,'angle');
 assert.ok(A.choose(st,'staredown'),'a reloaded segment still takes the choice');
 assert.equal(s.history.find(h=>h.cid===c.id).after.plan,'staredown');
 assert.ok(A.speak(st,'gloat'));assert.equal(st.stage,'done');
 console.log('PASS a reloaded segment resumes at the angle choice');
}

// 5. An old save: the night was planned with an angle, so it plays straight away as before.
{
 const s=career(),c=contract({finish:'win_clean',afterPlan:'handshake'}),f=play(c);
 const ready=JSON.parse(JSON.stringify({c:{id:c.id,wid:c.wid,rid:c.rid,pid:c.pid,slot:c.slot,finish:c.finish},fin:{stars:f.stars,crowd:f.crowd,outcome:f.outcome},plan:'handshake'}));
 const st=A.begin(ready.c,ready.fin,ready.plan);
 assert.equal(st.stage,'mic','the agreed angle has already played');
 assert.equal(st.plan,'handshake');assert.ok(st.angle&&typeof st.angle.ok==='boolean');
 assert.equal(s.history.find(h=>h.cid===c.id).after.plan,'handshake');
 // An old save whose meeting left the default, nothing, still goes straight to the microphone.
 career();const c2=contract({finish:'win_clean'}),f2=play(c2);
 assert.equal(A.begin(c2,f2,'none').stage,'mic');
 console.log('PASS an old save with a backstage plan still plays it');
}

// 6. A friend who turned on the wrestler at the bell has already decided the scene.
{
 let checked=false;
 for(const f of D.ALL.filter(x=>(x.ego||0)>=72&&x.id!=='rex')){
  const s=career();if(G.W(f.id))continue;
  const c=contract({rid:f.id,finish:'win_clean'});
  B.shift(c.wid,c.rid,85,'friend','Old friends.',c.id+':friend');
  const r=play(c);if(!s.bonds.done[c.id+':turn'])continue;
  const st=A.begin(c,r);
  assert.equal(st.stage,'mic','no angle to choose once the friend has turned');
  assert.match(st.log.map(x=>x.text).join(' '),/hits them from behind/);
  checked=true;break;
 }
 assert.ok(checked,'a friend with an ego turned after losing clean');
 console.log('PASS a betrayal at the bell replaces the angle choice');
}

// 7. The interface: the meeting no longer asks, the after-bell screen does.
{
 assert.doesNotMatch(ui,/afterPicker|data-afterplan|d\.afterplan/,'the meeting has no after-the-bell step');
 assert.doesNotMatch(ui,/Decide now\. They need to know/,'Dennis no longer asks about it');
 assert.match(ui,/if\(d\.afterangle\)\{[\s\S]*?OfficeAfter\.choose\(st,d\.afterangle\)/,'the after-bell screen takes the choice');
 assert.match(ui,/pickCards\(v\.options,v\.stage==='angle'\?'afterangle':'aftermic'\)/);
 assert.match(ui,/if\(night\.plan\?\.after\)c\.afterPlan=night\.plan\.after;/,'an old night’s agreed plan is honoured');
 assert.match(ui,/\.\.\.\(c\.afterPlan\?\{plan:c\.afterPlan\}:\{\}\)/,'a new night proposes the scene with no plan');
 console.log('PASS the meeting no longer decides the angle; the after-bell screen does');
}
