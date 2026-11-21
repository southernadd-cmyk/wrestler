'use strict';
// End-to-end contract: backstage choice -> signed sheet -> real match graph -> report.
// Run: node tests/pre-match-integration.test.cjs
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0,'browser bundle present');
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeMatch:E,OfficeRoom:Room,OfficeSheets:Sheets}=root;
const G=E.GRAPH;
const plans=['technical','brawl','story','spots','safe'],durations=[8,12,18];
const worker=D.TALENT.find(w=>w.style==='Spectacle'),opponent=D.FOES[0],promoter=D.PROMOS[0];
assert.ok(worker&&opponent&&promoter);

function signed(plan,minutes,finish='win_clean',id='prematch-'+plan+'-'+minutes){
 const c={id,wid:worker.id,rid:opponent.id,pid:promoter.id,slot:'main',
  finish,minutes,eventAbs:25,feudHeat:12};
 const st=Room.begin(c,worker,opponent,promoter);
 // Isolate the signed running order: randomly drawn room incidents can change
 // minutes, safety limits or the booked focus and are tested separately.
 st.queue=[];
 Room.act(st,'plan_'+plan);
 for(let i=0;st.stage!=='done'&&i<20;i++){
  const view=Room.view(st);
  const choice=st.stage==='board'?'board_ok':view.options[0]?.id;
  assert.ok(choice,'backstage conversation should always offer a choice');
  Room.act(st,choice);
 }
 assert.equal(st.stage,'done');
 assert.equal(st.sheet.game,plan);
 assert.equal(st.sheet.minutes,minutes);
 assert.equal(st.sheet.finish,finish);
 assert.ok(st.sheet.signed);
 return {c,sheet:st.sheet};
}
function create(data,seed=12001){
 return E.create({w:{...worker,fatigue:5,flags:{}},f:opponent,p:promoter,
  slot:'main',minutes:data.sheet.minutes,finish:data.c.finish,feudHeat:12,
  plan:{game:data.sheet.game,leash:data.sheet.leash||'script',talk:data.sheet.talk||'calm'},
  preparation:{},flags:{},seed,sheet:JSON.parse(JSON.stringify(data.sheet))});
}
function play(m){
 for(let i=0;i<9000&&!m.done;i++){
  if(m.decision&&!m.queue.length)E.resolve(m,m.decision.options[0].id);
  E.next(m);
 }
 assert.ok(m.done,'a signed, simulated match must finish');
 return m;
}

// All five plans, short/mid/long clocks, cooperative/unhappy workers, matched seeds.
// The physical engine must remain authoritative even when the sheet differs.
let bouts=0;
const paths=new Set();
for(const plan of plans)for(const minutes of durations)for(const consent of [42,90])
 for(const seed of [32011,33019]){
  const data=signed(plan,minutes,'win_clean','grid-'+plan+'-'+minutes);
  data.sheet.workerConsent=data.sheet.opponentConsent=consent;
  const m=play(create(data,seed));
  const rep=Sheets.report(m);
  assert.equal(m.planId,plan);
  assert.equal(m.len>=minutes*60||m.shortened,true,'match clock may shorten only on intervention');
  assert.equal(rep.total,rep.achieved+rep.adapted+rep.missed);
  assert.equal(m.graph.outcome.id,data.c.finish,'booked result remains authoritative');
  assert.equal(rep.room.performed,m.finishRoute,'performed route is exposed to the sheet');
  assert.ok(!m.sheet.ledger.some(e=>e.action==='special_spot'),
   'a generic scripted attempt must not masquerade as a move');
  paths.add(m.graph.events.map(e=>e.id).join(','));
  bouts++;
 }
assert.ok(paths.size>5,'real action paths respond to backstage match plans');

// A negotiated finish is not permission to narrate an unearned top-rope finish.
// This force-finishes a physically exhausted flyer without changing the booking.
{
 const data=signed('spots',12);
 data.sheet.finishRoute='top_rope';
 const m=create(data,9917);
 m.stage='finish';m.t=Math.floor(m.len*.97);m.wSt=2;m.fSt=82;
 play(m);
 assert.equal(m.graph.outcome.id,'win_clean');
 assert.notEqual(m.finishRoute,'top_rope');
 assert.equal(m.finishRouteFallbackFrom,'top_rope');
 assert.equal(m.sheet.performedFinishRoute,m.finishRoute);
 const b=m.sheet.nodes.find(b=>b.id==='finish');
 assert.equal(b.status,'adapted');
 assert.match(b.why,/agreed.*finish/i);
}

// The road agent's explicit forbidden actions are hard legality rules.
// This does not make a promoter's optional note into an absolute rule.
{
 const data=signed('brawl',12);
 data.sheet.limits={ban:[],banIds:[]};
 const m=create(data,16042);
 m.stage='live';m.t=Math.floor(m.len*.7);m.wSt=m.fSt=100;
 m.story.position='standing';m.story.control='w';m.story.down=null;
 const move=Object.keys(G.A).find(id=>{
  const n=G.A[id];return n.family&&!n.counterOf&&!n.blockOf&&G.isValid(m,id);
 });
 assert.ok(move,'an ordinary eligible action exists');
 m.o.sheet.limits.banIds=[move];
 assert.equal(G.isValid(m,move),false,'the exact banned move cannot be chosen');
 m.o.sheet.limits.banIds=[];
 m.o.sheet.limits.ban=[G.A[move].family];
 assert.equal(G.isValid(m,move),false,'a banned offensive family cannot be chosen');
}

// One attempted high spot yields exactly one named landing, or no credited
// landing on a botch. It never creates a second generic sheet ledger event.
for(const {risk,expected} of [{risk:0,expected:'landed'},{risk:100,expected:'botched'}]){
 const data=signed('spots',12,'win_clean','spot-'+expected);
 const payoff=data.sheet.nodes.find(n=>n.id==='payoff');
 assert.ok(payoff,'big-spot beat exists');
 payoff.actions=['special_spot'];payoff.backup=[];payoff.owner='w';
 payoff.window=[.6,.99];payoff.impossible=false;
 for(const b of data.sheet.nodes)if(b.id!=='payoff'&&b.id!=='finish')b.status='achieved';
 const m=create(data,risk?9012:9001);
 m.stage='live';m.t=Math.ceil(m.len*.82);m.wSt=m.fSt=100;
 m.story.position='standing';m.story.control='w';m.story.down=null;
 m.listen=1000;m.riskMul=risk;
 assert.equal(E.call(m,'big'),true);
 const attempt=m.graph.scriptedSpotAttempts?.at(-1);
 assert.ok(attempt,'a named scripted move was attempted');
 assert.equal(attempt.outcome,expected);
 assert.ok(!m.sheet.ledger.some(e=>e.action==='special_spot'));
 const actual=m.sheet.nodes.find(n=>n.id==='payoff');
 if(expected==='landed'){
  const events=m.graph.events.filter(e=>e.scriptedSpot);
  assert.equal(events.length,1);
  assert.equal(actual.status,'achieved');
  assert.equal(actual.actual,attempt.id);
  assert.equal(m.sheet.ledger.filter(e=>e.action===attempt.id).length,1,
   'one named landing must produce one canonical sheet event');
 }else{
  assert.equal(actual.status,'pending','a botch cannot fulfil an agreed highlight');
  assert.equal(m.graph.events.filter(e=>e.scriptedSpot).length,0);
 }
}
console.log('PASS pre-match integration: '+bouts+' matched generated-sheet bouts across five plans, three durations, two consent tiers and two seeds; legal finishes, real scripted spot evidence, hard restrictions and causal reports');


// Signed finish integration: static viability is checked at selection time;
// once signed, a finish can favour relevant LEGAL setup, but not invent it.
{
 const mk=(w,f,finish,heat=0)=>Room.begin({
  id:'finish-eligibility-'+w.id+'-'+f.id+'-'+finish+'-'+heat,
  wid:w.id,rid:f.id,pid:promoter.id,finish,slot:'main',minutes:12,
  eventAbs:1,feudHeat:heat
 },w,f,promoter);
 const candidate=D.FOES.find(f=>!['Brawl','Story'].includes(f.style));
 const calm=D.TALENT.find(w=>w.ego<65);
 const scrupulous=D.TALENT.find(w=>w.pro>=78);
 assert.ok(candidate&&calm&&scrupulous,'static eligibility fixture wrestlers exist');
 const pitched=st=>Room.pitches(st,'finish').map(c=>c.route);
 assert.ok(!pitched(mk(worker,opponent,'win_dirty',0)).includes('referee_bump'),
  'referee bump cannot be agreed without the required existing feud heat');
 assert.ok(!pitched(mk(worker,candidate,'win_dq',50)).includes('dq_low_blow_f'),
  'opponent cannot pitch an illegal low-blow disqualification for their style');
 assert.ok(!pitched(mk(worker,opponent,'win_dq',0)).includes('dq_ref_shove_f'),
  'opponent cannot pitch a referee shove without sufficient feud heat');
 assert.ok(!pitched(mk(calm,opponent,'lose_dq',50)).includes('dq_ref_shove_w'),
  'non-defiant worker cannot pitch referee-shove disqualification');
 const incident=mk(scrupulous,opponent,'win_dirty',0);
 incident.queue=['scruples'];Room.act(incident,'plan_story');Room.act(incident,'board_ok');
 assert.equal(incident.stage,'scene');
 Room.act(incident,'accident');
 assert.equal(incident.lockRoute,'feet_on_ropes',
  'forced backstage finish must have a legal no-heat alternative');
 // A real focused legal action is more likely before the requisite damage is earned.
 const data=signed('technical',12);
 const sample=create(data,12097);
 const focus=Object.values(G.A).find(n=>n.focus>0&&!n.reverse&&
  (!n.part||n.part===G.PART_OF[sample.graph.targets.f]));
 assert.ok(focus,'at least one limb-focused attack is in the real graph');
 sample.stage='live';sample.t=sample.len*.55;sample.story.control='w';
 sample.o.sheet.finishRoute='finisher';
 const neutral=Room.bias(sample,focus.id);
 sample.o.sheet.finishRoute='limb_finish';
 assert.ok(Room.bias(sample,focus.id)>neutral,
  'the signed limb finish favours actual focused offence, not narrative-only damage');
 sample.graph.damage.f=4;
 assert.equal(Room.bias(sample,focus.id),neutral,
  'preparation assistance stops when enough real damage has landed');
 const reverse=Object.values(G.A).find(n=>n.reverse);
 assert.ok(reverse,'a real reversal exists');
 sample.graph.events=[];sample.story.control='f';sample.o.sheet.finishRoute='reversal_finisher';
 const before=Room.bias(sample,reverse.id);
 sample.graph.events=[1,2,3].map(i=>({id:'counter_'+i,reverse:true,preControl:'f'}));
 assert.ok(before>Room.bias(sample,reverse.id),
  'a planned reversal finish prefers genuine counters only while unearned');
 sample.o.sheet.finishRoute='finisher';
 const unchanged=Room.bias(sample,reverse.id);
 sample.o.sheet.finishRoute='reversal_finisher';sample.story.control='w';
 assert.equal(Room.bias(sample,reverse.id),unchanged,
  'the finish plan never boosts reversals by the wrong performer');
}
