'use strict';
// Phase 10: scripted high spots are real named graph actions; psychology
// adds bounded evidence-based value without changing the booked winner.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),validation=require('../tools/graph-lab/validation.js');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Date,Math,JSON},{filename:file});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
assert.deepEqual(G.validate().errors,[],'all named graph connections resolve');
const scripted=Object.values(D.SPOTS).flat();
assert.equal(scripted.length,12,'all twelve original scripted move names have a mapping');
assert.equal(Object.keys(G.SCRIPTED_SPOT_IDS).length,scripted.length);
assert.equal(new Set(Object.values(G.SCRIPTED_SPOT_IDS)).size,12,'different spots are not relabelled as the same manoeuvre');
for(const name of scripted){
 const id=G.SCRIPTED_SPOT_IDS[name],action=G.A[id];
 assert.ok(action,'missing playable named graph move for '+name);
 assert.ok(action.requires&&action.zone&&action.next,'incomplete node for '+name);
 assert.ok(!action.reverse&&!action.counterOf&&!action.blockOf,'a scripted landing must not be a defensive move');
}
// A forced ringside big spot must have a stable identity, ONE successful
// action event or a separately recorded failed attempt, and legal timing.
let scriptedAttempts=0,landed=0,botched=0;
for(const style of ['Brawl','Technical','Spectacle','Story']){
 const worker=D.TALENT.find(w=>w.style===style);
 assert.ok(worker,'need a real performer for '+style);
 for(let i=0;i<12;i++){
  const input=lab.makeOptions(D,{wid:worker.id,rid:'dee',plan:'spots',
   finish:'win_clean',slot:'main',seed:97001+i*101});
  const m=M.create(input);
  m.stage='live';m.t=Math.ceil(m.len*.82);m.wSt=m.fSt=100;
  m.story.position='standing';m.story.down=null;m.story.control='w';
  m.listen=1000;
  const old=m.spots;
  assert.equal(M.call(m,'big'),true);
  const attempts=m.graph.scriptedSpotAttempts||[];
  assert.equal(attempts.length,1,'a manager call should select one eligible named attack: '+style);
  const attempt=attempts[0],events=m.graph.events.filter(e=>e.scriptedSpot);
  assert.ok(scripted.includes(attempt.name)&&G.SCRIPTED_SPOT_IDS[attempt.name]===attempt.id);
  assert.equal(m.spots-old,1,'one chosen spot is one attempted spot');
  assert.ok(attempt.outcome==='landed'||attempt.outcome==='botched');
  if(attempt.outcome==='landed'){
   landed++;
   assert.equal(events.length,1,'one landed spot, not a generic and named duplicate');
   assert.equal(events[0].id,attempt.id);
   assert.equal(events[0].scriptedSpot,true);
   assert.equal(m.graph.node,attempt.id,'the named move can seed its next legal handoff');
  }else{
   botched++;
   assert.equal(events.length,0,'a botch cannot be counted as a landed named move');
  }
  for(const e of m.graph.events){
   assert.ok(G.A[e.id]||e.id.startsWith('outcome_'),'no unknown generic spot event');
   if(G.A[e.id]?.after)assert.ok(e.t/m.len+1e-8>=G.A[e.id].after);
  }
  scriptedAttempts++;
 }
}
assert.ok(landed>0&&botched>0,'real risk, including a real failure, remains in effect');
// Distinguish a continuous coherent exchange from equally long disconnected
// narrated moves while holding ringcraft, crowd, stamina and duration constant.
const m=M.create(lab.makeOptions(D,{wid:'juno',rid:'rex',seed:90031,plan:'technical',slot:'main'}));
m.qN=100;m.qSum=6000;m.crowdPeak=65;m.bonus=0;
const chain=['lockup','wristlock','arm_wringer','hammerlock','mat_takedown','mat_hold'];
const disconnected=['lockup','outside_toss','wristlock','top_climb','mat_hold','cheap_shot'];
function constructionFor(ids,damage,arcs){
 m.graph.events=ids.map((id,i)=>({id,t:i*10,preControl:'w',control:'w',arc:'chain'}));
 m.graph.damage={w:damage,f:0};m.graph.history=arcs;
 const parts=M._starParts(m);
 return [parts.find(([id])=>id==='psychology')?.[2]||0,M._construction(m)];
}
const [good,goodDetails]=constructionFor(chain,4,['opening','control','hope','comeback','finish_setup']);
const [poor,poorDetails]=constructionFor(disconnected,0,['opening','chain','finish_setup']);
assert.ok(good>poor+.1,'coherent links, body-part story and hope-to-comeback must improve quality');
assert.ok(goodDetails.threeBeatSequences>0,'three-beat sequences have real event evidence');
assert.equal(poorDetails.earnedComeback,false);
assert.ok(good<=.37,'construction credit is bounded and not a per-spot star cheat');
// A representative seeded cohort must preserve mechanical evidence integrity.
const v=validation.create(G);
for(let i=0;i<90;i++){
 const o=lab.makeOptions(D,{wid:['rex','juno','nico','mara'][i%4],
  rid:['dee','sol','rex','juno'][i%4],
  plan:['spots','technical','brawl','story','safe'][i%5],
  finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],
  slot:i%2?'feature':'main',seed:88001+i*19});
 const match=lab.runMatch(root,o);
 validation.add(v,match,G,root.OfficeTechniqueBackgrounds);
 assert.equal(match.final.psychology.construction.score,
  match.final.starParts.find(([id])=>id==='psychology')?.[2]||0);
 assert.ok(match.final.psychology.construction.score<=.37);
 const attempted=match.graph.scriptedSpotAttempts||[];
 for(const a of attempted){
  const ev=match.graph.events.filter(e=>e.scriptedSpot&&e.id===a.id&&e.t===a.t);
  if(a.outcome==='landed')assert.equal(ev.length,1);
  else assert.equal(ev.length,0);
 }
}
const verdict=validation.finish(v);
assert.equal(verdict.pass,true,JSON.stringify(verdict.examples));
console.log('PASS Phase 10 scripted spots: '+scriptedAttempts+' forced attempts ('+landed+' landed, '+botched+
 ' botched), psychology counterfactual, 90 seeded full-match validations');
