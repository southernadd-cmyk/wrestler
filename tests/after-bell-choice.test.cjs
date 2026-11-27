'use strict';
// After the bell: the angle is the first choice of the post-match segment, made with the result known.
// Dennis's meeting no longer asks about it; a night saved with a plan agreed backstage still plays it.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {script,promoBanks}=require('./_source.cjs');
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
 assert.match(ui,/pickCards\(v\.options,v\.stage==='angle'\?'afterangle':v\.stage==='follow'\?'afterfollow':'aftermic'\)/);
 assert.match(ui,/if\(night\.plan\?\.after\)c\.afterPlan=night\.plan\.after;/,'an old night’s agreed plan is honoured');
 assert.match(ui,/\.\.\.\(c\.afterPlan\?\{plan:c\.afterPlan\}:\{\}\)/,'a new night proposes the scene with no plan');
 console.log('PASS the meeting no longer decides the angle; the after-bell screen does');
}

// AB1: the result carries a detached, serialisable snapshot of witnessed match events.
{
 const s=career(),c=contract(),f=play(c);
 f.evidence={dirty:{w:false,f:true},injured:{w:null,f:false},stamina:{w:27,f:42},counters:{w:2,f:3}};
 const h=s.history.find(h=>h.cid===c.id);
 h.rivalCorner={secondName:'Rival second',job:'runin',fired:true,ok:true};
 const ready=JSON.parse(JSON.stringify(A.capture(f,h)));
 f.evidence.dirty.f=false;h.rivalCorner.fired=false;
 const st=A.begin(c,ready),v=A.view(st),text=v.log.map(x=>x.text).join(' ');
 assert.equal(st.fin.context.dirty.f,true);
 assert.equal(st.fin.context.stamina.w,27);
 assert.match(text,/Rival second ran in/);
 assert.match(text,/used a cheap shot/);
 assert.doesNotMatch(text,/picked up an injury/);
 assert.equal(st.cons.length,0);
 assert.equal(JSON.parse(JSON.stringify(st)).fin.context.rivalCorner.fired,true);
 assert.match(ui,/fin:OfficeAfter\.capture\(fin,S\(\)\.history\.find/);
 console.log('PASS the post-bell scene opens with witnessed match evidence');
}
{
 career();const c=contract(),f=play(c),ready=A.capture(f,{ringside:{secondName:'Uninvolved second',job:'runin',fired:false,ok:false}});
 const st=A.begin(c,ready);
 assert.doesNotMatch(st.log.map(x=>x.text).join(' '),/Uninvolved second/);
 assert.equal(st.fin.context.dirty,null);
 console.log('PASS unknown or unwitnessed events are not invented');
}

// AB2: shared fuzzy tendencies reflect witnessed events without creating career facts.
{
 const s=career(),c=contract({finish:'lose_clean'}),f=play(c),h=s.history.find(h=>h.cid===c.id);
 const w=G.W(c.wid),opp=G.F(c.rid);opp.ego=60;opp.pro=65;
 B.shift(w.id,opp.id,30,'respect','Prior respect.',c.id+':ab2');
 const clean=A.capture({...f,evidence:{dirty:{w:false,f:false},stamina:{w:80,f:80},injured:{w:null,f:false}}},h);
 const dirty=A.capture({...f,evidence:{dirty:{w:true,f:false},stamina:{w:80,f:80},injured:{w:null,f:false}}},h);
 const hurt=A.capture({...f,evidence:{dirty:{w:false,f:false},stamina:{w:80,f:15},injured:{w:null,f:true}}},h);
 const before=JSON.stringify(s);
 const base=A.psychology(c,clean),angry=A.psychology(c,dirty),tired=A.psychology(c,hurt);
 assert.equal(JSON.stringify(s),before,'inference never mutates career');
 assert.ok(angry.f.scores.respect<base.f.scores.respect,'witnessed cheap shot reduces opponent respect');
 assert.ok(angry.f.scores.escalation>base.f.scores.escalation);
 assert.ok(tired.f.scores.caution>base.f.scores.caution);
 assert.ok(A.reactionAdjustment({psychology:angry},'handshake')<A.reactionAdjustment({psychology:base},'handshake'));
 assert.ok(A.reactionAdjustment({psychology:tired},'beatdown')<A.reactionAdjustment({psychology:base},'beatdown'));
 for(const p of [base,angry,tired])for(const plan of ['handshake','beatdown'])assert.ok(Math.abs(A.reactionAdjustment({psychology:p},plan))<=.18);
 assert.equal(A.reactionAdjustment({},'handshake'),0);
 assert.equal(A.psychology(c,f),null,'old saves retain legacy resolution');
 const st=A.begin(c,dirty),saved=JSON.parse(JSON.stringify(st));
 assert.deepEqual(saved.psychology,JSON.parse(JSON.stringify(angry)));
 assert.equal(A.reactionAdjustment(st,'handshake'),A.reactionAdjustment(saved,'handshake'));
 assert.ok(A.choose(saved,'handshake'));
 assert.ok(saved.angle.chance>=8&&saved.angle.chance<=94);
 console.log('PASS shared fuzzy reaction tendencies and bounded, saved angle odds');
}

// AB3: graph actions are gated by witnessed circumstances, not by commentary text.
{
 const s=career(),c=contract({finish:'lose_clean'}),f=play(c),h=s.history.find(h=>h.cid===c.id);
 const plain=A.capture({...f,stars:2,evidence:{dirty:{w:false,f:false},injured:{w:null,f:false}}},h);
 const ids=ready=>A.angleOptions({stage:'angle',c,fin:ready}).map(o=>o.id);
 assert.equal(ids(plain).join(),'none,handshake,staredown,beatdown');
 const ready=A.capture({...f,evidence:{dirty:{w:true,f:true},injured:{w:null,f:true}}},{rivalCorner:{fired:true,ok:true,job:'runin'}});
 const st=A.begin(c,ready),available=ids(ready);
 for(const id of ['check_injury','apologise','protest','confront_corner'])assert.ok(available.includes(id),id);
 assert.ok(!available.includes('beatdown'),'injury prevents a new attack option');
 assert.ok(!available.includes('acknowledge'),'do not offer sporting applause after own cheap shot');
 assert.equal(A.choose(st,'beatdown'),false);
 assert.ok(A.choose(st,'check_injury'));
 assert.equal(st.stage,'mic');assert.ok(st.angle.reaction);
 const edges=A.graphEdges().map(e=>e.join('|'));
 for(let i=1;i<st.angle.path.length;i++)assert.ok(edges.includes(st.angle.path.slice(i-1,i+1).join('|')),'legal graph edge');
 assert.equal(s.history.find(h=>h.cid===c.id).after.angle.reaction,st.angle.reaction);
 assert.equal(A.choose(st,'apologise'),false,'one angle only');
 assert.ok(A.speak(st,'walk'));
 console.log('PASS contextual graph gates, legal transition and persisted reaction');
}
{
 for(const [action,extra,evidence] of [
  ['acknowledge',{}, {dirty:{w:false,f:false}}],
  ['apologise',{}, {dirty:{w:true}}],
  ['protest',{}, {dirty:{f:true}}],
  ['confront_corner',{rivalCorner:{fired:true,ok:true,job:'distract'}},{}]
 ]){
  const run=()=>{const s=career();n=950;const c=contract({finish:'lose_clean'}),f=play(c);
   const st=A.begin(c,A.capture({...f,evidence},extra));
   assert.ok(A.choose(st,action),action);assert.ok(st.angle.path.includes(action));
   assert.equal(A.view(st).planLabel,A.angleGraph.actions[action].label);
   return JSON.stringify([st.angle,st.log,st.cons]);};
  assert.equal(run(),run(),'deterministic '+action);
 }
 const s=career(),c=contract(),f=play(c),ready=A.capture(f,{rivalCorner:{fired:true,ok:true,ejected:true,job:'runin'}});
 assert.ok(!A.angleOptions({stage:'angle',c,fin:ready}).some(o=>o.id==='confront_corner'));
 console.log('PASS new graph reactions are deterministic; ejected corners cannot unlock confrontation');
}

// AB4: two separate character snapshots; only reviewed fragments are reused.
{
 const run=()=>{const s=career();n=1100;const c=contract({finish:'lose_clean'}),f=play(c);
  const w=G.W(c.wid),opp=G.F(c.rid),I=root.OfficePromoIdentity;
  const banks=promoBanks(I.bankId(w),I.bankId(opp));
  const ready=A.capture({...f,evidence:{dirty:{w:false,f:false}}});
  const st=A.begin(c,ready);assert.ok(A.attachDialogue(st,banks));
  assert.equal(st.dialogue.w.id,w.id);assert.equal(st.dialogue.f.id,opp.id);
  assert.equal(A.attachDialogue(st,banks),false,'snapshot cannot be replaced');
  const saved=JSON.parse(JSON.stringify(st));assert.ok(A.choose(saved,'acknowledge'));
  assert.ok(A.speak(saved,'concede'));
  const speech=saved.log.filter(l=>l.lineId);
  assert.equal(speech.length,2,'both participants speak in this graph branch');
  for(const l of speech){const actor=saved.dialogue[l.side];
   if(l.source.startsWith('bank:'))assert.ok(actor.fragments.some(r=>r.id===l.lineId&&r.source===l.source));
   assert.doesNotMatch(l.text,/I will win|I intend to win|I guarantee/);
  }
  assert.equal(s.history.find(h=>h.cid===c.id).after.log.filter(l=>l.lineId).length,2);
  return JSON.stringify(speech);
 };
 assert.equal(run(),run(),'dialogue is deterministic after reload');
 assert.match(ui,/OfficePlanningDialogue\?\.loadPair\(G\.W\(c\.wid\),G\.F\(c\.rid\)\)/);
 assert.match(ui,/OfficeAfter\.attachDialogue\(n\.after,banks\)/);
 console.log('PASS character dialogue is saved, attributed and wired to the live result');
}
{
 let total=0,covered=0;
 for(const worker of D.ALL){
  const owner=root.OfficePromoIdentity.bankId(worker),banks=promoBanks(owner);
  if(!banks.length)continue;
  const identity=root.OfficePlanningDialogue.capture(worker,banks,2);
  assert.equal(identity.id,worker.id);assert.equal(identity.bankOwner,owner);
  assert.ok(identity.fragments.every(r=>r.id.startsWith(owner+'.')));
  total++;if(identity.fragments.length)covered++;
 }
 assert.ok(total>=80,'the shipped character banks are exercised');
 assert.ok(covered>0,'reviewed excerpts are actually available');
 console.log('AB4 reviewed fragment coverage: '+covered+'/'+total+' bank-backed wrestlers; identity fallback for gaps');
}

// AB5: candidate generation is evidence-gated, deterministic and bounded.
{
 const s=career(),c=contract(),f=play(c),w=G.W(c.wid),opp=G.F(c.rid);
 const scores={respect:90,escalation:90,caution:90};
 const sample={cid:c.id,psychology:{v:1,w:{scores},f:{scores}}};
 const x={w,f:opp,won:true,stars:4,outcome:'booked',context:{v:1,dirty:{w:true,f:false},injured:{w:null,f:false},rivalCorner:{fired:true,ok:true,job:'runin',second:'second1',secondName:'Rival second'}}};
 const candidates=A.openingCandidates(sample,x);
 assert.equal(candidates.map(o=>o.id).join(),'rival_protest,corner_protest');
 const none={...x,context:{...x.context,dirty:{w:false,f:false},rivalCorner:{...x.context.rivalCorner,ejected:true}}};
 assert.ok(!A.openingCandidates(sample,none).some(o=>o.id==='corner_protest'));
 assert.equal(A.openingCandidates(sample,{...x,context:null}).length,0);
 let hits=0,seen=new Set();for(let i=0;i<400;i++){
  const st={...sample,cid:'ab5-sample-'+i},event=A.selectOpening(st,x);
  assert.equal(JSON.stringify(event),JSON.stringify(A.selectOpening(st,x)));
  if(event){hits++;seen.add(event.id);assert.ok(event.actorId);}
 }
 assert.ok(hits>0&&hits<200,'bounded optional openings: '+hits+'/400');assert.equal(seen.size,2);
 console.log('AB5 optional opening sample '+hits+'/400; '+[...seen].join(', '));
}
{
 const s=career(),c=contract(),f=play(c);
 const st=A.begin(c,A.capture({...f,evidence:{injured:{w:null,f:true}}}));
 // Exercise the response gate regardless of the deterministic opening roll.
 st.intervention={v:1,id:'official_space',side:'official',actorId:null,line:'Officials request space.'};
 const saved=JSON.parse(JSON.stringify(st));
 assert.ok(A.angleOptions(saved).some(o=>o.id==='give_space'));
 assert.ok(A.angleOptions(saved).some(o=>o.id==='none'),'manager can still leave');
 assert.ok(!A.angleOptions(saved).some(o=>o.id==='answer_protest'));
 assert.equal(A.choose(saved,'answer_protest'),false);
 assert.ok(A.choose(saved,'give_space'));
 const edges=A.graphEdges().map(e=>e.join('|'));
 for(let i=1;i<saved.angle.path.length;i++)assert.ok(edges.includes(saved.angle.path.slice(i-1,i+1).join('|')));
 assert.equal(s.history.find(h=>h.cid===c.id).after.intervention.id,'official_space');
 assert.equal(saved.stage,'mic');assert.equal(A.choose(saved,'give_space'),false);
 console.log('PASS spontaneous opening response is gated, saved and remains under manager control');
}

// AB6: unresolved graph reactions alone can enter a single additional decision.
{
 const find=()=>{for(let i=0;i<80;i++){
  const s=career();n=1300+i;const c=contract({finish:'lose_clean'}),f=play(c);
  const st=A.begin(c,A.capture({...f,evidence:{dirty:{w:true,f:false},injured:{w:null,f:false}}}));
  assert.ok(A.choose(st,'apologise'));
  if(st.stage==='follow')return {s,c,st};
 }throw Error('No unresolved apology branch');};
 for(const action of ['disengage','defuse','press','challenge']){
  const {s,c,st}=find(),saved=JSON.parse(JSON.stringify(st));
  assert.equal(A.view(saved).options.map(o=>o.id).join(),'disengage,defuse,press,challenge');
  assert.equal(A.speak(saved,'concede'),false,'cannot skip the pending response');
  assert.equal(A.continueAngle(saved,'bogus'),false);
  assert.ok(A.continueAngle(saved,action));assert.equal(saved.stage,'mic');
  assert.equal(A.continueAngle(saved,action),false,'no repeated effects');
  const edges=A.graphEdges().map(e=>e.join('|'));
  for(let i=1;i<saved.angle.path.length;i++)assert.ok(edges.includes(saved.angle.path.slice(i-1,i+1).join('|')));
  assert.equal(s.history.find(h=>h.cid===c.id).after.follow.choice,action);
  assert.equal(A.state().calls.length,0,'a challenge is not a booked match');
  assert.ok(A.speak(saved,'walk'));assert.equal(saved.stage,'done');
 }
 assert.match(ui,/OfficeAfter\.continueAngle\(st,d\.afterfollow\)/);
 console.log('PASS unresolved scenes have four bounded, saved continuation choices');
}
