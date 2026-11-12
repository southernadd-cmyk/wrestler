'use strict';
// The Office v3.2 — creative planning and public promises that the match tests.
// Run: node tests/creative-loop.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'game script present');new vm.Script(script);
const cut=script.indexOf('/* THE OFFICE — interface v3');assert.ok(cut>0);
const db=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,console,Math,Date,JSON});
const D=root.OfficeData,G=root.OfficeGame,P=root.OfficeSheets,Promo=root.OfficeStory.Graph,M=root.OfficeMatch,K=root.OfficeGraphKernel;
assert.ok(script.includes('data-sheetfocus'),'a player selects a match story');
assert.ok(script.includes('data-sheetrevise'),'a player can revise a concrete move');
assert.ok(script.includes('data-sheetconfirm'),'both performers explicitly sign');
assert.ok(script.includes('night.plan?.sheet?.signed'),'signed sheet is used at the bell');
assert.ok(script.includes('choices(st.stage,st)'),'context-aware promo hints appear on screen');

const rex=D.TALENT.find(w=>w.id==='rex'),brick=D.TALENT.find(w=>w.id==='brick');
const rev=D.FOES.find(f=>f.id==='rev'),rush=D.FOES.find(f=>f.id==='silas');
let validSheets=0,objectives=0;
for(const w of D.TALENT)for(const f of D.FOES)for(const finish of ['win_clean','lose_clean'])for(const game of ['story','spots']){
 const c={id:'combos',wid:w.id,rid:f.id,finish};
 const focusOptions=P.focusOptions(c,w,f,game);
 assert.ok(focusOptions.length>=2,'genuine player choice');
 assert.ok(focusOptions.every(o=>o.id&&o.why&&o.tradeoff),'creative goals explain why and their tradeoff');
 for(const focus of focusOptions){
  for(const method of Object.keys(P.MODE)){
   const sh=P.build(c,w,f,game,method,'compromise',focus.id);
   assert.equal(sh.focus,focus.id);
   assert.ok(sh.nodes.length>=4&&K.validate(sh.nodes).length===0);
   assert.equal(sh.nodes.at(-1).actions[0],'outcome_'+finish);
   validSheets++;
  }
  objectives++;
 }
}
const natural=P.build({id:'coop',finish:'win_clean'},brick,rev,'safe','landmarks');
assert.ok(natural.signed&&!natural.disputed,'competent strangers can agree without a row');
const focusA=P.build({id:'a',finish:'lose_clean'},rex,rush,'brawl','landmarks','compromise','authentic');
const focusB=P.build({id:'a',finish:'lose_clean'},rex,rush,'brawl','landmarks','compromise','counter');
assert.notEqual(focusA.nodes.find(b=>b.id==='payoff').actions[0],focusB.nodes.find(b=>b.id==='payoff').actions[0],
 'the objective changes the actual intended action');
const altered=P.build({id:'edit',finish:'lose_clean'},rex,rush,'brawl','landmarks','worker','counter');
const prior=altered.nodes.find(b=>b.id==='payoff').actions[0];
assert.equal(P.revise(altered,'payoff'),true);
assert.notEqual(altered.nodes.find(b=>b.id==='payoff').actions[0],prior);
assert.equal(altered.revisions.length,1);
assert.equal(K.validate(altered.nodes).length,0);
assert.deepEqual(JSON.parse(JSON.stringify(altered)).revisions,JSON.parse(JSON.stringify(altered.revisions)));
altered.confirmed=true;assert.equal(P.revise(altered,'payoff'),false,'a signed commitment cannot be silently rewritten');

G.fresh();G.sign('rex');const owned=G.W('rex');
G.S.history.unshift({wid:'rex',rid:'silas',finish:'lose_clean',week:1,season:1,stars:2});
root.OfficeMemory.remember('rex','humiliation','Titan remembers losing clean to Rush.',rush.id,-4,-4,'test-grudge');
const historical=P.focusOptions({id:'again',finish:'lose_clean'},owned,rush,'story');
assert.ok(historical.some(o=>o.id==='redemption'),'an actual rematch opens a specific objective');
const histSheet=P.build({id:'again',finish:'lose_clean'},owned,rush,'story','landmarks');
assert.equal(histSheet.disputed,true,'proud wrestler with a loss has a grounded concern');
assert.ok(histSheet.issues.some(x=>/remembers losing/i.test(x.why)));
const safe=P.focusOptions({id:'hurt',finish:'win_clean'},D.TALENT.find(x=>x.id==='lyra'),rush,'spots');
assert.ok(safe.some(x=>x.id==='spectacle'),'a high-flyer wants a spectacular bout');

// Spoken arguments must answer what was said; unsupported claims backfire.
G.fresh();
const c={id:'mic',wid:rex.id,rid:rush.id,finish:'lose_clean'};
const unproved=Promo.begin(c,rex,rush,null,focusB);
Promo.choose(unproved,'accusation');
assert.equal(unproved.claim.hasEvidence,false);
assert.match(unproved.dialogue.find(x=>x.kind==='opponent').line,/never even worked a match/i);
const proof=Promo.begin(c,rex,rush,null,focusB);
Promo.choose(proof,'proof');
assert.ok(unproved.metrics.cred<proof.metrics.cred,'an unsupported charge costs credibility');
const answered=JSON.parse(JSON.stringify(unproved)),ducked=JSON.parse(JSON.stringify(unproved));
Promo.choose(answered,'turn');Promo.choose(ducked,'personal');
assert.ok(answered.argument>ducked.argument,'a direct answer is better than an invented personal attack');
assert.match(Promo.choices('close',answered).find(x=>x.id==='vow').hint,/booked a loss/);
assert.ok(Promo.choices('close',answered).some(x=>x.id==='question'&&/counter/.test(x.hint)));
for(const st of [answered,ducked])Promo.choose(st,'question');
assert.equal(Promo.result(answered).promise.type,'counter');
assert.equal(Promo.result(answered).tactic.kind,'counter');
assert.equal(Promo.result(answered).claim.opening,'accusation');
assert.equal(Promo.result(answered).path.length,3);
assert.ok(Promo.result(answered).argument>Promo.result(ducked).argument);
assert.ok(!!JSON.parse(JSON.stringify(answered)).claim,'mid-promo history is serializable');

// An actual prior loss changes the later argument, not only a tooltip.
G.fresh();G.sign('rex');
G.S.history.unshift({wid:'rex',rid:'silas',finish:'lose_clean',week:1,season:1});
const memory=Promo.begin(c,G.W('rex'),rush,null,focusB);
Promo.choose(memory,'proof');
assert.match(memory.dialogue.find(x=>x.kind==='opponent').line,/won that one/i);
assert.equal(memory.claim.hasEvidence,true);
G.fresh();

function config(i,closing='question'){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*7)%D.FOES.length],p=D.PROMOS[i%D.PROMOS.length];
 const c={id:'public-'+i,wid:w.id,rid:f.id,pid:p.id,finish:i%2===0?'lose_clean':'win_clean',
  slot:'mid',minutes:12,purse:250,blowoff:false,feudHeat:0};
 const sheet=P.build(c,w,f,'story',['detailed','landmarks','live'][i%3],'compromise','counter');
 const scene=Promo.begin(c,w,f,null,sheet);
 for(const id of ['proof','turn',closing])Promo.choose(scene,id);
 const promo=Promo.result(scene);
 const args={w:{...w,flags:{},fatigue:i%20},f,p,slot:'mid',minutes:12,finish:c.finish,
  plan:{game:'story',leash:'script',talk:'calm'},preparation:{},flags:{},seed:1200+i*31,promo,sheet};
 return {c,sheet,promo,args};
}
function run(options){
 const m=M.create(options);
 for(let i=0;i<9000;i++){
  if(m.decision&&!m.queue.length){
   const pick=m.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||m.decision.options[0];
   M.resolve(m,pick.id);
  }
  M.next(m);if(m.done)return m;
 }
 throw Error('match stalled');
}
let fulfilled=0,broken=0,stories=0,missed=0,different=0;
for(let i=0;i<180;i++){
 const q=config(i),m=run(q.args),sheet=P.report(m);
 assert.ok(m.done&&m.final&&sheet);
 assert.equal(m.graph.outcome.id,q.c.finish);
 assert.equal(sheet.achieved+sheet.adapted+sheet.missed,sheet.total);
 assert.ok(m.final.promoSignals&&typeof m.final.promoSignals.workerCounter==='boolean');
 assert.ok(new Set(m.sheet.ledger.map(x=>x.id)).size===m.sheet.ledger.length,'unique event identifiers');
 assert.ok(sheet.beats.every(x=>x.reason));
 if(m.final.promoSignals.workerCounter){
  fulfilled++;assert.ok(m.graph.promoCounterPaid,'counter credited only by a specific late action');
  assert.ok(m.log.some(x=>/counter promised at the microphone/i.test(x.text)));
 }else broken++;
 stories++;missed+=sheet.missed;
 if(i<25){
  const alt=run({...q.args,promo:null});
  if(JSON.stringify(alt.graph.events.map(x=>x.id))!==JSON.stringify(m.graph.events.map(x=>x.id)))different++;
 }
}
assert.ok(fulfilled>10&&broken>10,'counter vows can succeed and fail');
assert.ok(different>6,'promo tactics change performed actions, not just narration');
assert.ok(missed>0,'missed plan commitments can be real');

// A real public promise becomes a durable career memory when the match settles.
G.fresh();G.sign('rex');
const named=D.TALENT.find(x=>x.id==='rex'),target=rush,promoter=G.P('dock');
function careerBout(seed){
 const c={id:'career-'+seed,wid:'rex',rid:'silas',pid:'dock',slot:'mid',finish:'lose_clean',minutes:12,purse:310,feudHeat:0};
 const sheet=P.build(c,G.W('rex'),target,'story','landmarks','compromise','counter');
 const st=Promo.begin(c,G.W('rex'),target,null,sheet);
 for(const move of ['proof','turn','question'])Promo.choose(st,move);
 const promo=Promo.result(st);
 const m=run({w:{...G.W('rex'),flags:{},fatigue:0},f:target,p:promoter,slot:'mid',minutes:12,
  finish:c.finish,plan:{game:'story',leash:'script',talk:'calm'},preparation:{},flags:{},seed,promo,sheet});
 G.applyResult(c,{...m.final,log:m.log});
 const entry=G.S.history.find(h=>h.cid===c.id);
 assert.ok(entry?.promo?.promise?.checked,'public promise evaluated on the actual result');
 assert.equal(entry.promo.promise.kept,m.final.promoSignals.workerCounter);
 assert.ok(root.OfficeMemory.view('rex').entries.some(x=>x.id===c.id+':promo:counter'));
 return m;
}
careerBout(75319);
const saved=JSON.stringify(G.S);G.S=JSON.parse(saved);
assert.ok(root.OfficeMemory.view('rex').entries.some(x=>x.kind.startsWith('public_promise')),'career promise memory persists after reload');
console.log('PASS creative v3.2: '+validSheets+' distinct signed plan combinations, '+objectives+' grounded objectives, '+stories+' played promo-to-match bouts, '+fulfilled+' fulfilled counter vows / '+broken+' missed, '+different+' tested tactical divergences, evidence-aware arguments, negotiated revisions and career persistence');
