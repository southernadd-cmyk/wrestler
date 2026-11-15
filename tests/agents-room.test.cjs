'use strict';
// v3.6 match night exercises backstage decisions, the promo duel and the route into the ring.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'standalone script present');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeMatch:M,OfficeRoom:Room,OfficeMic:Mic,OfficeGraphKernel:Graph}=root;
const finishes=Object.keys(D.FINISHES);
const clone=state=>JSON.parse(JSON.stringify(state));
const cleanText=/undefined|NaN|\{\w+\}|\[object/;
const situations=new Set();
const routes=new Set();
const matches=[];
let meetings=0;
let promos=0;
let skippedPromos=0;

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
  assert.ok(choiceIds.length<8,'the meeting ends after the scheduled decisions');
  const view=Room.view(state);
  assert.ok(view.options.length&&view.options.every(option=>option.hint&&Array.isArray(option.tags)));
  if(choiceIds.length===2)saved=clone(state);
  const choice=view.options[(index+choiceIds.length*11)%view.options.length];
  choiceIds.push(choice.id);
  Room.act(state,choice.id);
 }
 assert.doesNotMatch(state.log.map(line=>line.text).join('\n'),cleanText);
 validateSheet(state.sheet,booking,worker,opponent);
 for(const id of choiceIds.slice(2))Room.act(saved,id);
 assert.equal(JSON.stringify(saved.sheet),JSON.stringify(state.sheet),'the saved meeting resumes deterministically');
 routes.add(finish+'.'+state.sheet.finishRoute);
 const promo=state.sheet.skipPromo?null:promoFor(booking,worker,opponent,state.sheet,promoter,index);
 if(promo)promos++;
 else skippedPromos++;
 if(index%7===0)matches.push({booking,worker,opponent,promoter,sheet:state.sheet,promo});
}
assert.equal(situations.size,Room.SITUATIONS.length,'every backstage situation is reachable');
assert.ok(routes.size>=14,'different pairings pitch different legal routes');
assert.ok(skippedPromos>0,'a backstage decision can skip the promo');

const worker=D.TALENT[0],opponent=D.FOES[0],promoter=D.PROMOS[0];
const booking=contract(7000,worker,opponent,promoter,'win_clean');
const first=Room.begin(booking,worker,opponent,promoter);
const fresh=Room.begin(booking,worker,opponent,promoter,{recent:first.queue});
assert.ok(fresh.queue.every(id=>!first.queue.includes(id)),'recent scenes are skipped when alternatives exist');

const cuts=Room.begin(booking,worker,opponent,promoter);
cuts.queue=['time_cut'];
Room.act(cuts,'plan_story');
const cutMinutes=clone(cuts),cutPromo=clone(cuts);
Room.act(cutMinutes,'cut');
Room.act(cutPromo,'talk');
for(const state of [cutMinutes,cutPromo])while(state.stage!=='done')Room.act(state,Room.options(state)[0].id);
assert.equal(cutMinutes.sheet.minutes,booking.minutes-3);
assert.equal(cutMinutes.sheet.skipPromo,false);
assert.equal(cutPromo.sheet.minutes,booking.minutes);
assert.equal(cutPromo.sheet.skipPromo,true);
assert.equal(cutPromo.sheet.nodes.length,1,'a meeting without agreed moves tracks only the finish');

let completed=0;
for(const sample of matches){
 const {booking,worker,opponent,promoter,sheet,promo}=sample;
 const match=M.create({w:{...worker,flags:{},fatigue:5},f:opponent,p:promoter,slot:booking.slot,minutes:sheet.minutes,
  finish:booking.finish,plan:{game:sheet.game,leash:sheet.leash||'script',talk:sheet.talk},
  preparation:{},flags:sheet.flags,sheet,promo,seed:7000+completed});
 for(let tick=0;tick<9000&&!match.done;tick++){
  if(match.decision&&!match.queue.length){
   const options=match.decision.options;
   const choice=options.find(option=>['job','home','cut','protect'].includes(option.id))||options[0];
   M.resolve(match,choice.id);
  }
  M.next(match);
 }
 assert.ok(match.done,'the signed sheet plays to a result');
 if(!['double','nc'].includes(match.outcome)){
  assert.equal(match.outcome,'booked');
  assert.equal(match.final.finishRoute,sheet.finishRoute,'the agreed finish plays out');
  completed++;
 }
}
assert.ok(completed>=100,'booked finishes are exercised at scale');
console.log(`PASS v3.6 match night: ${meetings} meetings, ${situations.size} situations, ${promos} duels, ${skippedPromos} canceled promos, ${completed} booked finishes`);
