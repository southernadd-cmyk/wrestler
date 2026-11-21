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
  assert.ok(choiceIds.length<10,'the meeting ends after the scheduled decisions');
  const view=Room.view(state);
  assert.ok(view.options.length&&view.options.every(option=>option.hint&&Array.isArray(option.tags)));
  if(choiceIds.length===2)saved=clone(state);
  let choice=view.options[(index+choiceIds.length*11)%view.options.length];
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
   const swap=view.options.filter(option=>option.id!=='board_ok'&&!option.selected);
   const swapped=choiceIds.some(id=>id.startsWith('slot_'));
   choice=index%3===0&&!swapped&&swap.length?swap[index%swap.length]:view.options.find(option=>option.id==='board_ok');
   if(choice.id!=='board_ok')swaps++;
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
