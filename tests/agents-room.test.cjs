'use strict';
// v3.6 match night exercises backstage decisions, the promo duel and the route into the ring.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const {script}=require('./_source.cjs');
assert.ok(script,'standalone script present');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeMatch:M,OfficeRoom:Room,OfficeMic:Mic,OfficeGraphKernel:Graph,OfficeSheets:Sheets}=root;
const finishes=Object.keys(D.FINISHES);
const clone=state=>JSON.parse(JSON.stringify(state));
const cleanText=/undefined|NaN|\{\w+\}|\[object/;
const situations=new Set();
const routes=new Set();
const matches=[];
let meetings=0;
let promos=0;
let skippedPromos=0;
let spineBeats=0,reworked=0,swaps=0;

for(const tone of new Set(Object.values(Room.VOICE))){
 for(const [kind,lines] of Object.entries(Room.LINES)){
  assert.ok(lines[tone]?.length>=2,kind+' lines for '+tone);
  assert.ok(lines[tone].every(line=>!(/\b(he|him|his|she|her)\b/i.test(line))));
 }
 assert.ok(Room.DAFT[tone]?.pitch&&Room.DAFT[tone].yes&&Room.DAFT[tone].no);
}
for(const wrestler of [...D.TALENT,...D.FOES])assert.ok(Room.VOICE[wrestler.id],wrestler.id+' has a voice');
for(const promoter of D.PROMOS)assert.ok(Room.NOTES[promoter.id]?.length>=2);

function contract(index,worker,opponent,promoter,finish){
 return {id:'room-'+index,wid:worker.id,rid:opponent.id,pid:promoter.id,finish,
  slot:['opener','mid','feature','main'][index%4],minutes:12,eventAbs:index,feudHeat:(index%6)*14};
}
function validateSheet(sheet,booking,worker,opponent){
 assert.ok(sheet.signed&&sheet.confirmed&&sheet.contract===booking.id);
 assert.equal(sheet.v,4);
 assert.equal(Graph.validate(sheet.nodes).length,0);
 assert.equal(sheet.nodes.at(-1).actions[0],'outcome_'+booking.finish);
 assert.ok(M.FINISH_ROUTES[booking.finish].some(route=>route.id===sheet.finishRoute));
 for(const key of ['workerConsent','opponentConsent'])assert.ok(sheet[key]>=20&&sheet[key]<=95);
 for(const beat of sheet.nodes.slice(0,-1)){
  assert.ok(beat.planned&&!beat.open,'only commitments go on the signed sheet');
  const move=beat.actions[0];
  if(move==='scheduled_nearfall')continue;
  const [actor,other]=beat.owner==='w'?[worker,opponent]:[opponent,worker];
  assert.ok(M.GRAPH.A[move]?.name,'the promised move is in the catalog');
  assert.equal(Room.legal(move,actor,other),!beat.impossible,'the sheet flags an impossible lift');
 }
}
function promoFor(booking,worker,opponent,sheet,promoter,index){
 const duel=Mic.begin(booking,worker,opponent,null,sheet,promoter);
 const choices=[];
 let saved;
 while(duel.stage!=='done'){
  const options=Mic.choices(duel);
  assert.ok(options.every(option=>option.tags.length),'each promo option gives its stakes');
  if(duel.round===2)saved=clone(duel);
  const option=options[(index+duel.round*7)%options.length];
  choices.push(option.id);
  Mic.choose(duel,option.id);
  assert.ok(duel.meter>=-50&&duel.meter<=50);
 }
 const result=Mic.result(duel);
 assert.equal(result.beats.length,4);
 assert.equal(result.duel.pushed,choices[2]!=='leave');
 assert.ok(result.dialogue.some(line=>line.speaker===opponent.name));
 assert.doesNotMatch(result.dialogue.map(entry=>entry.line).join('\n'),cleanText);
 assert.ok(result.tactic&&result.promise,'the closing tactic and promise survive the duel');
 for(const id of choices.slice(2))Mic.choose(saved,id);
 assert.equal(JSON.stringify(saved.result),JSON.stringify(result),'the saved duel resumes deterministically');
 return result;
}

for(const worker of D.TALENT)for(const opponent of D.FOES)for(const finish of finishes){
 const index=meetings++;
 const promoter=D.PROMOS[Math.floor(index/7)%D.PROMOS.length];
 const booking=contract(index,worker,opponent,promoter,finish);
 const state=Room.begin(booking,worker,opponent,promoter);
 assert.equal(state.stage,'plan');
 assert.equal(state.queue.length,['feature','main'].includes(booking.slot)?3:2);
 assert.equal(new Set(state.queue).size,state.queue.length);
 state.queue.forEach(id=>situations.add(id));
 const choiceIds=[];
 let saved;
 while(state.stage!=='done'){
  assert.ok(choiceIds.length<13,'the meeting ends after the scheduled decisions');
  const view=Room.view(state);
  assert.ok(view.options.length&&view.options.every(option=>option.hint&&Array.isArray(option.tags)));
  if(choiceIds.length===2)saved=clone(state);
  let choice=view.stage==='review'?view.options.find(x=>x.id==='review_ok'):
   view.options[(index+choiceIds.length*11)%view.options.length];
  if(view.stage==='finish'){
   for(const option of view.options){
    if(option.label==='Work the limb all night, then finish'){
     assert.match(option.hint,/four points of focused damage/i,'backstage must explain the limb finish requirement');
     assert.match(option.hint,/audible/i,'backstage must explain legal finish adaptations');
     assert.ok(option.tags.includes('Conditional method'));
    }
   }
  }
  if(view.stage==='board'){
   // Dennis pencils in all four beats; sometimes we change one, then we agree it.
   assert.equal(view.board.length,4,'the running order has a shine, heat, comeback and big spot');
   assert.ok(view.board.every(row=>row.cards.length>=2&&row.cards.filter(card=>card.selected).length===1),'every slot is pencilled in with alternatives');
   assert.ok(view.story&&typeof view.story.verdict==='string');
   const finishAlternatives=view.options.filter(option=>option.route&&!option.selected);
   const finishWasChosen=choiceIds.some(id=>id.startsWith('route_'));
   const swap=view.options.filter(option=>option.id.startsWith('slot_')&&!option.selected);
   const swapped=choiceIds.some(id=>id.startsWith('slot_'));
   if(index%5===0&&!finishWasChosen&&finishAlternatives.length)
    choice=finishAlternatives[Math.floor(index/5)%finishAlternatives.length];
   else
    choice=index%3===0&&!swapped&&swap.length?swap[index%swap.length]:view.options.find(option=>option.id==='board_ok');
   if(choice.id.startsWith('slot_'))swaps++;
  }
  choiceIds.push(choice.id);
  Room.act(state,choice.id);
 }
 assert.doesNotMatch(state.log.map(line=>line.text).join('\n'),cleanText);
 validateSheet(state.sheet,booking,worker,opponent);
 spineBeats+=state.sheet.nodes.length-1;if(state.reworked)reworked++;
 assert.ok(state.sheet.story&&state.sheet.story.score>=-2&&state.sheet.story.score<=2);
 for(const id of choiceIds.slice(2))Room.act(saved,id);
 assert.equal(JSON.stringify(saved.sheet),JSON.stringify(state.sheet),'the saved meeting resumes deterministically');
 routes.add(finish+'.'+state.sheet.finishRoute);
 const promo=state.sheet.skipPromo?null:promoFor(booking,worker,opponent,state.sheet,promoter,index);
 if(promo)promos++;
 else skippedPromos++;
 if(index%7===0)matches.push({booking,worker,opponent,promoter,sheet:state.sheet,promo});
}
assert.equal(situations.size,Room.SITUATIONS.filter(s=>!s.followup).length,'every drawable backstage situation is reachable');
assert.ok(routes.size>=14,'different pairings pitch different legal routes');
assert.ok(skippedPromos>0,'a backstage decision can skip the promo');
assert.ok(spineBeats/meetings>=3,'a meeting plans a real running order, not just the finish ('+(spineBeats/meetings).toFixed(2)+' beats)');
assert.ok(swaps>100,'the running order can be changed');
assert.ok(reworked>0,'situations can rewrite an agreed beat');

{
 // A swap goes on the sheet; a later ban sends Dennis looking for a replacement that still works.
 const worker=D.TALENT.find(x=>x.style==='Spectacle')||D.TALENT[0],opponent=D.FOES[1],promoter=D.PROMOS[3];
 const booking=contract(8100,worker,opponent,promoter,'win_clean');
 const state=Room.begin(booking,worker,opponent,promoter);
 state.queue=['ropes'];
 Room.act(state,'plan_spots');
 assert.equal(state.stage,'board');
 const options=Room.options(state).filter(option=>option.slot==='opening'&&!option.selected);
 Room.act(state,options[0].id);
 assert.equal(state.board.opening.label,options[0].label,'a swapped beat replaces the pencilled one');
 const risky=Room.pitches(state,'payoff').find(card=>card.by==='w'&&card.action&&card.risk);
 if(risky)state.board.payoff={by:'w',owner:'w',action:risky.action,label:risky.label};
 Room.act(state,'board_ok');
 Room.act(state,'ground');
 for(const beat of Object.values(state.board))assert.ok(!Room.banned(state,beat.action),'no banned move survives on the running order');
 while(state.stage!=='done')Room.act(state,Room.options(state)[0].id);
 for(const beat of state.sheet.nodes)for(const id of [...beat.actions,...(beat.backup||[])])
  if(!id.startsWith('outcome_'))assert.ok(!state.sheet.limits.banIds.includes(id),'backups respect tonight’s limits');
 assert.ok(state.sheet.nodes.some(beat=>beat.backup?.length),'agreed beats carry legal alternatives for an audible');
}
{
 // Dennis can tell a story from a mess.
 const promoter=D.PROMOS[0];let state,loser;
 for(const worker of D.TALENT){
  const opponent=D.FOES[0];
  state=Room.begin(contract(8200,worker,opponent,promoter,'lose_clean'),worker,opponent,promoter);
  state.queue=['bell'];Room.act(state,'plan_story');
  loser=Room.pitches(state,'payoff').find(card=>card.by==='w'&&card.action&&!card.impossible);
  if(loser)break;
 }
 assert.ok(loser,'some pairing gives the losing wrestler a big spot to pitch');
 const good=Room.story(state).score;
 state.board.payoff={by:'w',owner:'w',action:loser.action,label:loser.label};delete state.board.pressure;
 assert.ok(Room.story(state).score<good,'a clean loser with the big spot and a comeback from nothing scores worse');
 assert.ok(Room.story(state).notes.some(note=>!note.good));
}

const worker=D.TALENT[0],opponent=D.FOES[0],promoter=D.PROMOS[0];
const booking=contract(7000,worker,opponent,promoter,'win_clean');
const first=Room.begin(booking,worker,opponent,promoter);
const fresh=Room.begin(booking,worker,opponent,promoter,{recent:first.queue});
assert.ok(fresh.queue.every(id=>!first.queue.includes(id)),'recent scenes are skipped when alternatives exist');

const cuts=Room.begin(booking,worker,opponent,promoter);
cuts.queue=['time_cut'];
Room.act(cuts,'plan_story');
Room.act(cuts,'board_ok');
const cutMinutes=clone(cuts),cutPromo=clone(cuts);
Room.act(cutMinutes,'cut');
Room.act(cutPromo,'talk');
for(const state of [cutMinutes,cutPromo])while(state.stage!=='done')Room.act(state,Room.options(state)[0].id);
assert.equal(cutMinutes.sheet.minutes,booking.minutes-3);
assert.equal(cutMinutes.sheet.skipPromo,false);
assert.equal(cutPromo.sheet.minutes,booking.minutes);
assert.equal(cutPromo.sheet.skipPromo,true);
assert.ok(cutPromo.sheet.nodes.length>=4,'cutting the promo keeps the running order');

let completed=0;
const adherence={happy:{hit:0,all:0},sulking:{hit:0,all:0}};
for(const sample of matches.slice(0,60))for(const mood of ['happy','sulking']){
 const {booking,worker,opponent,promoter,promo}=sample,sheet=clone(sample.sheet);
 sheet.workerConsent=sheet.opponentConsent=mood==='happy'?90:42;
 const match=M.create({w:{...worker,flags:{},fatigue:5},f:opponent,p:promoter,slot:booking.slot,minutes:sheet.minutes,
  finish:booking.finish,plan:{game:sheet.game,leash:sheet.leash||'script',talk:sheet.talk},preparation:{},flags:sheet.flags,sheet,promo,seed:9100});
 for(let tick=0;tick<9000&&!match.done;tick++){if(match.decision&&!match.queue.length)M.resolve(match,match.decision.options[0].id);M.next(match);}
 for(const beat of match.sheet.nodes)if(beat.id!=='finish'){adherence[mood].all++;if(beat.status==='achieved')adherence[mood].hit++;}
}
const rate=x=>x.hit/Math.max(1,x.all);
assert.ok(rate(adherence.happy)-rate(adherence.sulking)>.25,'unhappy wrestlers stray from the sheet ('+rate(adherence.happy).toFixed(2)+' v '+rate(adherence.sulking).toFixed(2)+')');
let strips=0,agreedFinishes=0,finishAudibles=0;
const STATES=['waiting','due','achieved','adapted','missed'];
function checkStrip(match,final){
 const strip=Sheets.strip(match,{final});
 assert.ok(strip,'a signed sheet always has a strip');
 assert.equal(strip.beats.length,match.sheet.nodes.length,'one strip entry per agreed beat');
 for(const beat of strip.beats){
  assert.ok(STATES.includes(beat.state),beat.state);
  assert.ok(beat.start>=0&&beat.start+beat.width<=104,'beats sit on the clock');
  if(beat.mark!==null)assert.ok(beat.mark>=0&&beat.mark<=100,'the landing mark sits inside its beat');
  assert.ok(beat.slot&&beat.move&&beat.title&&!/undefined|NaN/.test(beat.title));
  if(['achieved','adapted','missed'].includes(beat.state))assert.notEqual(beat.mark,null,'a settled beat shows when it was settled');
 }
 for(const lane of [0,1]){
  const row=strip.beats.filter(beat=>beat.lane===lane).sort((a,b)=>a.start-b.start);
  for(let i=1;i<row.length;i++)assert.ok(row[i-1].start+row[i-1].width-row[i].start<=6,'beats in one lane barely overlap');
 }
 if(final){
  assert.equal(strip.head,null);
  assert.ok(strip.beats.every(beat=>['achieved','adapted','missed'].includes(beat.state)),'nothing is left waiting at the bell');
 }else assert.ok(strip.head>=0&&strip.head<=100);
 strips++;
}
for(const sample of matches){
 const {booking,worker,opponent,promoter,sheet,promo}=sample;
 const match=M.create({w:{...worker,flags:{},fatigue:5},f:opponent,p:promoter,slot:booking.slot,minutes:sheet.minutes,
  finish:booking.finish,plan:{game:sheet.game,leash:sheet.leash||'script',talk:sheet.talk},
  preparation:{},flags:sheet.flags,sheet,promo,seed:7000+completed});
 for(let tick=0;tick<9000&&!match.done;tick++){
  if(tick===40&&!match.done)checkStrip(match,false);
  if(match.decision&&!match.queue.length){
   const options=match.decision.options;
   const choice=options.find(option=>['job','home','cut','protect'].includes(option.id))||options[0];
   M.resolve(match,choice.id);
  }
  M.next(match);
 }
 assert.ok(match.done,'the signed sheet plays to a result');
 checkStrip(match,true);
 if(!['double','nc','dq'].includes(match.outcome)){ // v0.3.22 the referee can throw a match out, like an injury stoppage
  assert.equal(match.outcome,'booked');
  // The result is contractual; the proposed *method* is conditional on
  // what actually happened in the ring. A legal audible is not a broken booking.
  const performed=match.final.finishRoute,agreed=sheet.finishRoute;
  const legalRoutes=M.FINISH_ROUTES[booking.finish];
  assert.ok(legalRoutes.some(r=>r.id===performed),'performed finish must be a valid contracted route');
  assert.equal(match.sheet.performedFinishRoute,performed,'the signed sheet records the actual finish');
  assert.equal(match.graph.outcome.route,performed,'the outcome graph records the actual finish');
  if(performed===agreed){
   assert.ok(!match.finishRouteFallbackFrom,'a performed agreed finish cannot be an audible');
   agreedFinishes++;
  }else{
   assert.equal(match.finishRouteFallbackFrom,agreed,'the road agent identifies the agreed route being replaced');
   const beat=match.sheet.nodes.find(b=>b.id==='finish');
   assert.ok(beat,'a signed match has a finish commitment');
   assert.equal(beat.status,'adapted','the finish commitment is adapted rather than silently achieved');
   assert.match(beat.why,/agreed.*not physically available/i,'the sheet explains why an audible happened');
   finishAudibles++;
  }
  completed++;
 }
}
assert.ok(completed>=100,'booked finishes are exercised at scale');
assert.ok(agreedFinishes>0,'the match must sometimes deliver the signed method');
assert.ok(finishAudibles>0,'the match must exercise a physically justified audible');
console.log(`PASS v3.7 match night: ${meetings} meetings, ${(spineBeats/meetings).toFixed(2)} beats a sheet, ${swaps} running-order changes, ${reworked} rewritten by situations, ${situations.size} situations, ${promos} duels, ${skippedPromos} canceled promos, ${completed} booked finishes (${agreedFinishes} as agreed, ${finishAudibles} audibles); agreed beats land ${Math.round(100*rate(adherence.happy))}% happy v ${Math.round(100*rate(adherence.sulking))}% sulking; ${strips} match strips checked`);

// Diagnostic-only audit: quantify agreed finish execution without changing gameplay.
(function auditFinishRouteAudibles(){
 const plans=['technical','brawl','story','spots','safe'], durations=[8,12,18];
 const results={offered:[],controlled:[]};
 const each=(s,fn)=>Array.from({length:s},(_,i)=>fn(i));
 const by=(records,key)=>{
  const out={};
  for(const row of records){
   const k=String(row[key]??'(none)');
   const v=out[k]??={count:0,agreed:0,audibles:0,other:0,reasons:{}};
   v.count++;
   if(row.booked){if(row.audible)v.audibles++;else v.agreed++}else v.other++;
   if(row.audible)for(const why of row.reasons)v.reasons[why]=(v.reasons[why]||0)+1;
  }
  return Object.fromEntries(Object.entries(out).map(([key,v])=>[key,{...v,rate:v.agreed+v.audibles?Number((v.audibles/(v.agreed+v.audibles)).toFixed(3)):null}]));
 };
 const why=(route,M,heat)=>{
  const g=M.graph||{},e=g.events||[],revW=e.filter(x=>x.reverse&&x.preControl==='f').length,
   revF=e.filter(x=>x.reverse&&x.preControl==='w').length,dw=g.damage?.w||0,df=g.damage?.f||0,
   sw=M.wSt,sf=M.fSt,gap=sw-sf,fail=[];
  switch(route){
   case 'reversal_finisher':if(revW<3)fail.push('worker_reversals_below_3');break;
   case 'finisher_reversed':if(revF<3)fail.push('opponent_reversals_below_3');break;
   case 'limb_finish':if(df<4)fail.push('opponent_damage_below_4');break;
   case 'submission_defeat':if(dw<4)fail.push('worker_damage_below_4');break;
   case 'injury_gives':if(dw<3)fail.push('worker_damage_below_3');break;
   case 'top_rope':if(sw<30)fail.push('worker_exhausted');break;
   case 'outlasted':
    if(M.o.finish==='win_clean'){
     if(sf>=30)fail.push('loser_not_exhausted');
     if(gap<15)fail.push('stamina_gap_below_15');
    }else{
     if(sw>=30)fail.push('loser_not_exhausted');
     if(gap>-15)fail.push('stamina_gap_below_15');
    }
    break;
   case 'exhausted_cover':if(sw>=30)fail.push('worker_not_exhausted');break;
   case 'referee_bump':if(heat<40)fail.push('feud_heat_below_40');break;
   case 'dq_ref_shove_f':if(heat<25)fail.push('feud_heat_below_25');break;
   case 'dq_choke_w':if(heat<25&&dw<3)fail.push('insufficient_heat_or_damage');break;
   case 'dq_ref_shove_w':if(M.w.ego<65)fail.push('ego_below_65');break;
  }
  return fail.length?fail:['condition_other'];
 };
 const eligible=(id,w,f)=>{
  if(id==='top_rope')return w.style==='Spectacle'&&(D.PROFILES[w.id]?.kg||85)<110;
  if(id==='strike_knockout')return w.style==='Brawl';
  if(id==='eye_poke')return ['Brawl','Story'].includes(w.style);
  if(id==='dq_low_blow_f')return ['Brawl','Story'].includes(f.style);
  return true;
 };
 function make(finish,route,plan,minutes,seed,w,f,heat,mode){
  const c={id:'aud-audit-'+seed+'-'+finish,wid:w.id,rid:f.id,pid:promoter.id,
   slot:'main',finish,minutes,eventAbs:20,feudHeat:heat};
  const st=Room.begin(c,w,f,promoter);st.queue=[];
  Room.act(st,'plan_'+plan);
  let finishChosen=false;
  while(st.stage!=='done'){
   const options=Room.options(st);
   // The modern room chooses the route at the top of the board, BEFORE
   // its four called spots. Without this step the audit silently samples
   // Dennis's default finisher 540 times instead of the offered methods.
   const routes=st.stage==='board'&&mode==='offered'&&!finishChosen?
    options.filter(o=>o.route):[];
   const choice=routes.length?routes[seed%routes.length]:
    st.stage==='board'?options.find(x=>x.id==='board_ok'):
    st.stage==='finish'&&mode==='offered'?options[seed%options.length]:options[0];
   if(routes.length)finishChosen=true;
   Room.act(st,choice.id);
  }
  const sheet=clone(st.sheet);
  if(mode==='controlled'){
   sheet.finishRoute=route;
   const b=sheet.nodes.find(x=>x.id==='finish');if(b)b.route=route;
  }
  const agreed=sheet.finishRoute;
  const m=M.create({w:{...w,fatigue:5,flags:{}},f:{...f,fatigue:5,flags:{}},p:promoter,
   slot:'main',minutes:sheet.minutes,finish,feudHeat:heat,
   plan:{game:sheet.game,leash:sheet.leash||'script',talk:sheet.talk||'calm'},
   preparation:{},flags:sheet.flags,seed,sheet});
  for(let tick=0;tick<9000&&!m.done;tick++){
   if(m.decision&&!m.queue.length)M.resolve(m,m.decision.options[0].id);
   M.next(m);
  }
  assert.ok(m.done,'audit bout must finish');
  const booked=m.outcome==='booked',audible=booked&&m.finishRoute!==agreed;
  if(booked)assert.equal(m.graph.outcome.route,m.finishRoute);
  return {mode,finish,agreed,performed:m.finishRoute,plan,minutes,heat,worker:w.id,
   opponent:f.id,seed,booked,audible,reasons:audible?why(agreed,m,heat):[],
   wSt:Math.round(m.wSt),fSt:Math.round(m.fSt),damageW:m.graph?.damage?.w||0,
   damageF:m.graph?.damage?.f||0};
 }
 const promoter0=D.PROMOS[0];
 // Actual backstage offered choices; cycle every choice index, all five plans and six booked results.
 let seq=0;
 for(const finish of Object.keys(M.FINISH_ROUTES))
  for(const plan of plans)for(const minutes of durations)for(let j=0;j<6;j++){
   const w=D.TALENT[(seq*7+j)%D.TALENT.length],
    f=D.FOES[(seq*3+j)%D.FOES.length],heat=[0,20,40,60][(j+seq)%4];
   results.offered.push(make(finish,null,plan,minutes,82001+seq,w,f,heat,'offered'));
   seq++;
  }
 // Equal route exposure: compare conditional routes without letting backstage pitch frequency hide failures.
 seq=0;
 for(const [finish,routes] of Object.entries(M.FINISH_ROUTES))
  for(const route of routes)
   for(const plan of ['technical','story','spots'])for(const minutes of [8,18])for(let j=0;j<4;j++){
    const candidates=[];
    for(const w of D.TALENT)for(const f of D.FOES)if(eligible(route.id,w,f))candidates.push([w,f]);
    assert.ok(candidates.length,'at least one statically eligible pairing: '+route.id);
    const [w,f]=candidates[(seq*13+j)%candidates.length],heat=[0,20,40,60][(j+seq)%4];
    results.controlled.push(make(finish,route.id,plan,minutes,93001+seq,w,f,heat,'controlled'));
    seq++;
   }
 const summarize=rows=>({
  total:rows.length,booked:rows.filter(r=>r.booked).length,
  audible:rows.filter(r=>r.audible).length,
  routes:by(rows,'agreed'),outcomes:by(rows,'finish'),plans:by(rows,'plan'),
  durations:by(rows,'minutes'),examples:rows.filter(r=>r.audible).slice(0,24)
 });
 console.log('FINISH_AUDIBLE_DIAGNOSTIC_JSON='+JSON.stringify({
  version:1,offered:summarize(results.offered),controlled:summarize(results.controlled)
 }));
})();


// Diagnostic only: test the signed outlasting finish against a same-seed,
// same-sheet control using the default method. No rule, threshold or move edits.
// A success needs a loser below 30 and a winner 15 stamina points ahead at the bell.
(function auditOutlastingPhysicalStamina(){
 const promoter=D.PROMOS[0],plans=['technical','brawl','story','spots','safe'];
 const durations=[8,12,18],results=[],A=M.GRAPH.A;
 const num=n=>Math.round(n*10)/10;
 const mean=x=>x.length?num(x.reduce((a,b)=>a+b,0)/x.length):null;
 const median=x=>x.length?num(x.slice().sort((a,b)=>a-b)[Math.floor((x.length-1)/2)]):null;
 const count=(rows,key,yes=true)=>rows.filter(x=>!!x[key]===yes).length;
 const group=(rows,key,fn)=>Object.fromEntries([...new Set(rows.map(x=>x[key]))].sort().map(k=>[k,fn(rows.filter(x=>x[key]===k))]));
 function run(booking,sheet,w,f,seed,route){
  const s=JSON.parse(JSON.stringify(sheet)),finish=s.nodes.find(n=>n.id==='finish');
  s.finishRoute=route;if(finish)finish.route=route;
  const m=M.create({w:{...w,fatigue:5,flags:{}},f:{...f,fatigue:5,flags:{}},
   p:promoter,slot:booking.slot,minutes:s.minutes,finish:booking.finish,
   feudHeat:booking.feudHeat,plan:{game:s.game,leash:s.leash||'script',talk:s.talk||'calm'},
   preparation:{},flags:s.flags,seed,sheet:s});
  const winner=booking.finish==='win_clean'?'w':'f';
  const waypoints=[.25,.5,.75,.90,.99],at={};
  let lastTime=-1,everTired=false,everLead=false,everEligible=false,firstTired=null,
   firstLead=null,firstEligible=null,lastEligible=null,maxLead=-999,maxLeadAfterTired=-999;
  const capture=()=>{
   if(m.t===lastTime||m.stage==='entrance')return;
   lastTime=m.t;
   const win=winner==='w'?m.wSt:m.fSt,lose=winner==='w'?m.fSt:m.wSt,
    lead=win-lose,frac=m.t/m.len;
   if(lose<30){everTired=true;if(firstTired===null)firstTired=m.t;}
   if(lead>=15){everLead=true;if(firstLead===null)firstLead=m.t;}
   if(lose<30&&lead>=15){everEligible=true;if(firstEligible===null)firstEligible=m.t;lastEligible=m.t;}
   maxLead=Math.max(maxLead,lead);
   if(lose<30)maxLeadAfterTired=Math.max(maxLeadAfterTired,lead);
   for(const point of waypoints)if(frac>=point&&at[point]===undefined)at[point]={win:num(win),lose:num(lose),lead:num(lead)};
  };
  for(let tick=0;tick<9000&&!m.done;tick++){
   if(m.decision&&!m.queue.length)M.resolve(m,m.decision.options[0].id);
   M.next(m);capture();
  }
  assert.ok(m.done,'outlasting stamina diagnostic: bout must finish');
  assert.equal(m.graph.outcome.id,booking.finish,'stamina investigation must preserve the contract');
  const win=winner==='w'?m.wSt:m.fSt,lose=winner==='w'?m.fSt:m.wSt,lead=win-lose;
  const rests=(m.graph.events||[]).filter(e=>{
   const n=A[e.id];
   return ['w','f'].includes(e.preControl)&&
    (e.id==='catch_breath'||n?.family==='rest'&&n.cost<0);
  });
  const recovery=side=>rests.filter(e=>e.preControl===side).length;
  const lateRecovery=side=>rests.filter(e=>e.preControl===side&&e.t>=m.len-180).length;

  const actor=e=>e.reverse?(e.preControl==='w'?'f':'w'):e.preControl;
  const signedEvents=(m.graph.events||[]).filter(e=>['w','f'].includes(actor(e)));
  const statsFor=side=>{
   const ev=signedEvents.filter(e=>actor(e)===side),rest=ev.filter(e=>e.exertion<0),
    costly=ev.filter(e=>e.exertion>=3),late=ev.filter(e=>e.t>=m.len-180);
   return {actions:ev.length,positiveCost:num(ev.reduce((sum,e)=>sum+Math.max(0,e.exertion||0),0)),
    restored:num(-rest.reduce((sum,e)=>sum+(e.exertion||0),0)),
    costlyActions:costly.length,risky:ev.filter(e=>A[e.id]?.risk&&!A[e.id]?.reverse).length,
    lateActions:late.length,lateCost:num(late.reduce((sum,e)=>sum+Math.max(0,e.exertion||0),0)),
    lateRests:late.filter(e=>e.exertion<0).length,
    firstRest:rest.length?rest[0].t:null,lastRest:rest.length?rest.at(-1).t:null};
  };
  const winStats=statsFor(winner),loseStats=statsFor(winner==='w'?'f':'w');

  // Compare signed beat delivery and REAL landed named aerial variety rather
  // than relying on a match-quality check from unrelated (non-Outlasted) bouts.
  const called=m.sheet?.nodes?.filter(n=>n.id!=='finish'&&n.planned)||[];
  const beatStats={
   total:called.length,
   achieved:called.filter(n=>n.status==='achieved').length,
   adapted:called.filter(n=>n.status==='adapted').length,
   missed:called.filter(n=>n.status==='missed').length,
   negotiated:called.filter(n=>n.negotiated).length,
   negotiatedAchieved:called.filter(n=>n.negotiated&&n.status==='achieved').length
  };
  const namedAerial=e=>{
   const n=A[e.id];
   return !!n&&!n.reverse&&!n.counterOf&&!n.blockOf&&n.risk&&
    ['aerial','springboard','dive','lucha','superplex'].includes(n.family)&&
    ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
     .every(k=>!e[k]||e[k]==='landed');
  };
  const aerials=(m.graph.events||[]).filter(namedAerial);
  const aerialStats={
   attempts:(m.graph.scriptedSpotAttempts||[]).length,
   scriptedLanded:(m.graph.scriptedSpotAttempts||[]).filter(a=>a.outcome==='landed').length,
   landings:aerials.length,distinct:new Set(aerials.map(e=>e.id)).size,
   lateLandings:aerials.filter(e=>e.t>=m.len-180).length,
   lateDistinct:new Set(aerials.filter(e=>e.t>=m.len-180).map(e=>e.id)).size,
   winnerLateDistinct:new Set(aerials.filter(e=>e.t>=m.len-180&&e.preControl===winner).map(e=>e.id)).size
  };
  const matchStats={
   stars:m.final.stars,crowdPeak:m.final.crowdPeak,nearFalls:m.final.nearfalls,
   botches:m.final.botches,spotHits:m.final.spotHits,
   scriptChecks:m.scriptChecks,scriptHits:m.scriptHits,
   controlChanges:m.story.changes||0
  };
  const won=m.finishRoute==='outlasted';
  if(route==='outlasted'&&m.outcome==='booked')
   assert.equal(won,lose<30&&lead>=15,'outlasted must honour exact stamina prerequisites');
  return {route,won,agreed:m.o.sheet.finishRoute,
   winSt:num(win),loseSt:num(lose),lead:num(lead),eligible:lose<30&&lead>=15,
   loserTired:lose<30,lead15:lead>=15,bothTired:win<30&&lose<30,
   everTired,everLead,everEligible,maxLead:num(maxLead),
   maxLeadAfterTired:maxLeadAfterTired===-999?null:num(maxLeadAfterTired),
   firstTired,firstLead,firstEligible,lastEligible,
   winRests:recovery(winner),loseRests:recovery(winner==='w'?'f':'w'),
   winLateRests:lateRecovery(winner),loseLateRests:lateRecovery(winner==='w'?'f':'w'),
   winStats,loseStats,paceCount:m.graph.pacedOutlast?.[winner]?.count||0,
   beatStats,aerialStats,matchStats,
   totalActions:m.graph.events?.length||0,waypoints:at};
 }
 let seq=0;
 for(const plan of plans)for(const minutes of durations)for(const finish of ['win_clean','lose_clean']){
  let found=0;
  for(let candidate=0;candidate<160&&found<4;candidate++){
   const index=seq*19+candidate, w=D.TALENT[(index*7+candidate)%D.TALENT.length],
    f=D.FOES[(index*3+candidate)%D.FOES.length],heat=[0,20,40,60][index%4];
   const booking={id:'outlast-probe-'+plan+'-'+minutes+'-'+finish+'-'+candidate,
    wid:w.id,rid:f.id,pid:promoter.id,slot:'main',finish,minutes,
    eventAbs:index,feudHeat:heat};
   const st=Room.begin(booking,w,f,promoter);st.queue=[];
   Room.act(st,'plan_'+plan);
   const suggested=Room.options(st).find(x=>x.route==='outlasted');
   if(!suggested)continue; // This is a finish the player is actually offered.
   Room.act(st,suggested.id);
   for(let step=0;st.stage!=='done'&&step<20;step++){
    const choices=Room.options(st),choice=st.stage==='board'?
     choices.find(x=>x.id==='board_ok'):choices[0];
    assert.ok(choice,'stamina probe backstage choice exists');
    Room.act(st,choice.id);
   }
   assert.equal(st.stage,'done');
   assert.equal(st.sheet.finishRoute,'outlasted');
   const seed=980000+index;
   const planned=run(booking,st.sheet,w,f,seed,'outlasted'),
    noPrep=run(booking,st.sheet,w,f,seed,finish==='win_clean'?'finisher':'duck_finisher');
   results.push({plan,minutes,finish,worker:w.id,foe:f.id,heat,
    workerStyle:w.style,foeStyle:f.style,
    winnerStyle:finish==='win_clean'?w.style:f.style,
    loserStyle:finish==='win_clean'?f.style:w.style,
    planned,noPrep,deltaLead:num(planned.lead-noPrep.lead),
    deltaWinRests:planned.winRests-noPrep.winRests,
    deltaLoseRests:planned.loseRests-noPrep.loseRests});
   found++;seq++;
  }
  assert.equal(found,4,'at least four naturally pitched outlasting pairings for '+plan+'/'+minutes+'/'+finish);
 }
 const runs=results.map(x=>({...x.planned,plan:x.plan,minutes:x.minutes,finish:x.finish}));
 const controls=results.map(x=>({...x.noPrep,plan:x.plan,minutes:x.minutes,finish:x.finish}));
 const summarise=rows=>({
  n:rows.length,eligibleAtBell:count(rows,'eligible'),loserTiredAtBell:count(rows,'loserTired'),
  lead15AtBell:count(rows,'lead15'),bothTiredAtBell:count(rows,'bothTired'),
  loserEverTired:count(rows,'everTired'),leadEverReached15:count(rows,'everLead'),
  everFullyEligible:count(rows,'everEligible'),
  hadWindowButLostByBell:rows.filter(x=>x.everEligible&&!x.eligible).length,
  bell:{winnerMedian:median(rows.map(x=>x.winSt)),loserMedian:median(rows.map(x=>x.loseSt)),
   leadMedian:median(rows.map(x=>x.lead)),leadMean:mean(rows.map(x=>x.lead)),
   winnerNearZero:rows.filter(x=>x.winSt<=5).length,
   loserNearZero:rows.filter(x=>x.loseSt<=5).length},
  recovery:{winMean:mean(rows.map(x=>x.winRests)),loseMean:mean(rows.map(x=>x.loseRests)),
   zeroWinner:rows.filter(x=>x.winRests===0).length,
   winnerLateMean:mean(rows.map(x=>x.winLateRests)),
   loserLateMean:mean(rows.map(x=>x.loseLateRests))},
  trajectory:Object.fromEntries([.25,.5,.75,.90,.99].map(k=>[String(k),{
   winnerMean:mean(rows.map(x=>x.waypoints[k]?.win).filter(x=>x!==undefined)),
   loserMean:mean(rows.map(x=>x.waypoints[k]?.lose).filter(x=>x!==undefined)),
   gapMean:mean(rows.map(x=>x.waypoints[k]?.lead).filter(x=>x!==undefined))
  }]))
 });
 const by=x=>({n:x.length,hit:x.filter(r=>r.planned.eligible).length,
  loserTired:x.filter(r=>r.planned.loserTired).length,
  gap15:x.filter(r=>r.planned.lead15).length,
  medianGap:median(x.map(r=>r.planned.lead)),
  avgWinRest:mean(x.map(r=>r.planned.winRests)),
  meanPlanGain:mean(x.map(r=>r.deltaLead))});
 const examples=results.filter(x=>!x.planned.eligible)
  .sort((a,b)=>a.planned.lead-b.planned.lead)
  .slice(0,16).map(x=>({plan:x.plan,minutes:x.minutes,finish:x.finish,
   worker:x.worker,foe:x.foe,winSt:x.planned.winSt,loseSt:x.planned.loseSt,
   lead:x.planned.lead,loserTired:x.planned.loserTired,winRests:x.planned.winRests,
   loseRests:x.planned.loseRests,everEligible:x.planned.everEligible,
   maxLeadAfterTired:x.planned.maxLeadAfterTired,controlLead:x.noPrep.lead}));

 const failureBreak=rows=>({
  noGap:rows.filter(x=>x.planned.lead<15).length,
  noLoserExhaustion:rows.filter(x=>x.planned.loseSt>=30).length,
  bothMiss:rows.filter(x=>x.planned.lead<15&&x.planned.loseSt>=30).length,
  loserOnly:rows.filter(x=>x.planned.lead>=15&&x.planned.loseSt>=30).length,
  gapOnly:rows.filter(x=>x.planned.lead<15&&x.planned.loseSt<30).length,
  windowLost:rows.filter(x=>x.planned.everEligible&&!x.planned.eligible).length,
  zeroWinnerRest:rows.filter(x=>x.planned.winRests===0).length,
  moreLoserRests:rows.filter(x=>x.planned.loseRests>x.planned.winRests).length,
  winnerSpentMore:rows.filter(x=>x.planned.winStats.positiveCost>x.planned.loseStats.positiveCost).length,
  meanWinCost:mean(rows.map(x=>x.planned.winStats.positiveCost)),
  meanLoseCost:mean(rows.map(x=>x.planned.loseStats.positiveCost)),
  meanWinRecover:mean(rows.map(x=>x.planned.winStats.restored)),
  meanLoseRecover:mean(rows.map(x=>x.planned.loseStats.restored)),
  meanWinRisk:mean(rows.map(x=>x.planned.winStats.risky)),
  meanLoseRisk:mean(rows.map(x=>x.planned.loseStats.risky)),
  meanWinLateCost:mean(rows.map(x=>x.planned.winStats.lateCost)),
  meanLoseLateCost:mean(rows.map(x=>x.planned.loseStats.lateCost)),
  meanPacingTriggers:mean(rows.map(x=>x.planned.paceCount)),
  meanControlWinCost:mean(rows.map(x=>x.noPrep.winStats.positiveCost)),
  meanControlLoseCost:mean(rows.map(x=>x.noPrep.loseStats.positiveCost)),
  meanControlWinRecover:mean(rows.map(x=>x.noPrep.winStats.restored))
 });
 const categories=Object.fromEntries(['plan','minutes','finish','winnerStyle','loserStyle']
  .map(k=>[k,group(results,k,rows=>({
   n:rows.length,hit:rows.filter(x=>x.planned.eligible).length,
   controlHit:rows.filter(x=>x.noPrep.eligible).length,
   medianGap:median(rows.map(x=>x.planned.lead)),
   medianControlGap:median(rows.map(x=>x.noPrep.lead)),
   meanGapDelta:mean(rows.map(x=>x.deltaLead)),
   ...failureBreak(rows)
  }))]));
 const pairedChanges=results.filter(x=>x.planned.eligible!==x.noPrep.eligible).map(x=>({
  plan:x.plan,minutes:x.minutes,finish:x.finish,worker:x.worker,foe:x.foe,
  gained:x.planned.eligible,winStyle:x.winnerStyle,loseStyle:x.loserStyle,
  liveGap:x.planned.lead,controlGap:x.noPrep.lead,liveLoser:x.planned.loseSt,
  controlLoser:x.noPrep.loseSt,
  winRecover:x.planned.winStats.restored,loseRecover:x.planned.loseStats.restored,
  winPositive:x.planned.winStats.positiveCost,losePositive:x.planned.loseStats.positiveCost,
  lostWindow:x.planned.everEligible&&!x.planned.eligible
 }));
 const spotExamples=results.filter(x=>x.plan==='spots'&&x.minutes>=12).map(x=>({
  minutes:x.minutes,finish:x.finish,worker:x.worker,foe:x.foe,
  styles:x.winnerStyle+'/'+x.loserStyle,hit:x.planned.eligible,
  wSt:x.planned.winSt,lSt:x.planned.loseSt,gap:x.planned.lead,
  defaultGap:x.noPrep.lead,winRests:x.planned.winRests,loserRests:x.planned.loseRests,
  winnerCost:x.planned.winStats.positiveCost,loserCost:x.planned.loseStats.positiveCost,
  winnerRecover:x.planned.winStats.restored,loserRecover:x.planned.loseStats.restored,
  winnerRisk:x.planned.winStats.risky,loserRisk:x.planned.loseStats.risky,
  pacing:x.planned.paceCount,
  gap90:x.planned.waypoints['0.9']?.lead,eligibleEarlier:x.planned.everEligible
 }));
 console.log('OUTLAST_FOCUS_DIAGNOSTIC_JSON='+JSON.stringify({
  version:1,fixtures:results.length,focus:failureBreak(results),
  breakdown:categories,
  regressionCases:pairedChanges,
  spotExamples,
  findingNotes:['Action exertion uses real graph event costs, not passive clock drain.',
   'Reversal actor inferred from graph reversal metadata.',
   'Same seed and sheet as original 120-pair diagnostic.']
 }));

 const auditQuality=rows=>({
  n:rows.length,
  ratings:{signedMean:mean(rows.map(x=>x.planned.matchStats.stars)),
   controlMean:mean(rows.map(x=>x.noPrep.matchStats.stars)),
   signedMedian:median(rows.map(x=>x.planned.matchStats.stars)),
   controlMedian:median(rows.map(x=>x.noPrep.matchStats.stars)),
   meanDifference:mean(rows.map(x=>x.planned.matchStats.stars-x.noPrep.matchStats.stars)),
   dropsBy1Plus:rows.filter(x=>x.planned.matchStats.stars<=x.noPrep.matchStats.stars-1).length,
   risesBy1Plus:rows.filter(x=>x.planned.matchStats.stars>=x.noPrep.matchStats.stars+1).length},
  calledBeats:{
   signed:rows.reduce((a,x)=>a+x.planned.beatStats.total,0),
   control:rows.reduce((a,x)=>a+x.noPrep.beatStats.total,0),
   achievedSigned:rows.reduce((a,x)=>a+x.planned.beatStats.achieved,0),
   achievedControl:rows.reduce((a,x)=>a+x.noPrep.beatStats.achieved,0),
   adaptedSigned:rows.reduce((a,x)=>a+x.planned.beatStats.adapted,0),
   adaptedControl:rows.reduce((a,x)=>a+x.noPrep.beatStats.adapted,0),
   missedSigned:rows.reduce((a,x)=>a+x.planned.beatStats.missed,0),
   missedControl:rows.reduce((a,x)=>a+x.noPrep.beatStats.missed,0),
   negotiatedSigned:rows.reduce((a,x)=>a+x.planned.beatStats.negotiated,0),
   negotiatedControl:rows.reduce((a,x)=>a+x.noPrep.beatStats.negotiated,0),
   negotiatedAchievedSigned:rows.reduce((a,x)=>a+x.planned.beatStats.negotiatedAchieved,0),
   negotiatedAchievedControl:rows.reduce((a,x)=>a+x.noPrep.beatStats.negotiatedAchieved,0)},
  aerial:{
   meanNamedLanded:mean(rows.map(x=>x.planned.aerialStats.landings)),
   controlMeanNamedLanded:mean(rows.map(x=>x.noPrep.aerialStats.landings)),
   meanNamedDistinct:mean(rows.map(x=>x.planned.aerialStats.distinct)),
   controlMeanNamedDistinct:mean(rows.map(x=>x.noPrep.aerialStats.distinct)),
   meanLateDistinct:mean(rows.map(x=>x.planned.aerialStats.lateDistinct)),
   controlMeanLateDistinct:mean(rows.map(x=>x.noPrep.aerialStats.lateDistinct)),
   meanWinnerLateDistinct:mean(rows.map(x=>x.planned.aerialStats.winnerLateDistinct)),
   controlMeanWinnerLateDistinct:mean(rows.map(x=>x.noPrep.aerialStats.winnerLateDistinct)),
   scriptedLanded:rows.reduce((a,x)=>a+x.planned.aerialStats.scriptedLanded,0),
   scriptedControl:rows.reduce((a,x)=>a+x.noPrep.aerialStats.scriptedLanded,0)},
  other:{
   meanNearFalls:mean(rows.map(x=>x.planned.matchStats.nearFalls)),
   controlMeanNearFalls:mean(rows.map(x=>x.noPrep.matchStats.nearFalls)),
   meanBotches:mean(rows.map(x=>x.planned.matchStats.botches)),
   controlMeanBotches:mean(rows.map(x=>x.noPrep.matchStats.botches)),
   meanSpotHits:mean(rows.map(x=>x.planned.matchStats.spotHits)),
   controlMeanSpotHits:mean(rows.map(x=>x.noPrep.matchStats.spotHits)),
   meanCrowdPeak:mean(rows.map(x=>x.planned.matchStats.crowdPeak)),
   controlMeanCrowdPeak:mean(rows.map(x=>x.noPrep.matchStats.crowdPeak))}
 });
 const qualityGroups=Object.fromEntries(['plan','minutes'].map(key=>[key,
  group(results,key,auditQuality)]));
 console.log('OUTLAST_QUALITY_AUDIT_JSON='+JSON.stringify({
  version:1,n:results.length,all:auditQuality(results),
  byPlan:qualityGroups.plan,byMinutes:qualityGroups.minutes,
  spotByDuration:group(results.filter(x=>x.plan==='spots'),'minutes',auditQuality),
  longByPlan:group(results.filter(x=>x.minutes===18),'plan',auditQuality),
  worstRatings:results.map(x=>({plan:x.plan,minutes:x.minutes,finish:x.finish,
   worker:x.worker,foe:x.foe,stars:x.planned.matchStats.stars,
   controlStars:x.noPrep.matchStats.stars,
   diff:num(x.planned.matchStats.stars-x.noPrep.matchStats.stars),
   achieved:x.planned.beatStats.achieved,controlAchieved:x.noPrep.beatStats.achieved,
   lateAerials:x.planned.aerialStats.lateDistinct,
   controlLateAerials:x.noPrep.aerialStats.lateDistinct}))
   .sort((a,b)=>a.diff-b.diff).slice(0,12)
 }));
 console.log('OUTLAST_STAMINA_DIAGNOSTIC_JSON='+JSON.stringify({
  version:1,fixtures:results.length,pairedRuns:results.length*2,
  conditions:{loserBelow:30,winnerGapAtLeast:15},
  planned:summarise(runs),control:summarise(controls),
  comparison:{meanGapGain:mean(results.map(x=>x.deltaLead)),
   medianGapGain:median(results.map(x=>x.deltaLead)),
   improvedGap:results.filter(x=>x.deltaLead>1).length,
   worsenedGap:results.filter(x=>x.deltaLead< -1).length,
   sameGap:results.filter(x=>Math.abs(x.deltaLead)<=1).length,
   changedEligibility:results.filter(x=>x.planned.eligible!==x.noPrep.eligible).length},
  byPlan:group(results,'plan',by),byMinutes:group(results,'minutes',by),
  byOutcome:group(results,'finish',by),examples
 }));
})();
