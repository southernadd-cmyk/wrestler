'use strict';
// v3.7 promo: Dennis's read, the opponent's angle, push your luck and vows on the match sheet.
// The point of these checks is balance: no single choice should be right every night.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const {script}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeMatch:M,OfficeRoom:Room,OfficeMic:Mic,OfficeSheets:Sheets}=root;
// The statistics below sample the four original finishes, as they always have; v0.3.22's disqualification
// finishes are checked separately for a clean read at the end.
const finishes=['win_clean','win_dirty','lose_protected','lose_clean'],clone=x=>JSON.parse(JSON.stringify(x));
const mean=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
const leftovers=/undefined|NaN|\{\w+\}|\[object/;
// The swing a choice is worth on average, over several rolls of the dice.
function worth(state,id,salt){
 return mean([0,1,2,3,4,5].map(k=>{const d=clone(state);d.seed+='|'+salt+k;d.core.seed+='|'+salt+k;Mic.choose(d,id);return d.meter-state.meter;}));
}
const openByFit={},answerByFit={},bestOpen={},bestAnswer={},pushByFit={},leave=[];
let scenes=0,clear=0,clearRight=0;
let index=0;
for(const worker of D.TALENT)for(const opponent of D.FOES)for(const finish of finishes){
 const i=index++;if(i%2)continue;
 const promoter=D.PROMOS[i%4];
 const booking={id:'read-'+i,wid:worker.id,rid:opponent.id,pid:promoter.id,finish,slot:['opener','mid','feature','main'][i%4],minutes:12,eventAbs:i,feudHeat:(i%6)*14};
 const duel=Mic.begin(booking,worker,opponent,null,null,promoter);scenes++;
 const view=Mic.view(duel);
 assert.equal(view.read.length,4,'Dennis gives a four-part read before the first line');
 assert.doesNotMatch(view.read.join(' '),leftovers);
 // Openings: fit drives the result, and when one opening clearly suits the night it is usually the best.
 const opens=Mic.choices(duel).map(option=>({id:option.id,fit:Mic.openFit(duel,option.id),value:worth(duel,option.id,'o')}));
 for(const o of opens)(openByFit[o.fit]??=[]).push(o.value);
 const top=opens.slice().sort((a,b)=>b.value-a.value)[0];bestOpen[top.id]=(bestOpen[top.id]||0)+1;
 const byFit=opens.slice().sort((a,b)=>b.fit-a.fit);
 if(byFit[0].fit>byFit[1].fit){clear++;if(byFit[0].id===top.id)clearRight++;}
 // The answer round: the opponent's angle is named, and has a best answer.
 const after=clone(duel);Mic.choose(after,Mic.choices(after)[1].id);
 assert.ok(after.angle,'the opponent takes an angle');
 assert.ok(Mic.view(after).cue&&!leftovers.test(Mic.view(after).cue),'the angle is shown before the answer');
 const answers=Mic.choices(after).map(option=>({id:option.id,fit:Mic.answerFit(after,option.id),value:worth(after,option.id,'a')}));
 for(const a of answers)(answerByFit[a.fit]??=[]).push(a.value);
 const bestA=answers.slice().sort((a,b)=>b.value-a.value)[0];(bestAnswer[after.angle]??={})[bestA.id]=((bestAnswer[after.angle]??={})[bestA.id]||0)+1;
 // Push your luck: worth it when it suits, not otherwise.
 const pushState=clone(after);Mic.choose(pushState,Mic.choices(pushState)[0].id);
 for(const option of Mic.choices(pushState)){
  const value=mean([0,1,2,3,4,5].map(k=>{const d=clone(pushState);d.seed+='|p'+k;Mic.choose(d,option.id);return d.meter-pushState.meter;}));
  if(option.id==='leave')leave.push(value);else(pushByFit[Mic.pushFit(pushState,option.id)]??=[]).push(value);
 }
}
const ordered=table=>Object.keys(table).map(Number).sort((a,b)=>a-b).map(k=>mean(table[k]));
const openCurve=ordered(openByFit),answerCurve=ordered(answerByFit);
for(let k=1;k<openCurve.length;k++)assert.ok(openCurve[k]>openCurve[k-1],'a better-suited opening is worth more on average');
for(let k=1;k<answerCurve.length;k++)assert.ok(answerCurve[k]>answerCurve[k-1],'a better-suited answer is worth more on average');
const share=Math.max(...Object.values(bestOpen))/scenes;
assert.ok(share<.5,'no opening is the best choice on most nights ('+Math.round(share*100)+'%)');
assert.ok(['people','proof','imagery','accusation','swagger','hometown','numbers'].every(id=>bestOpen[id]),'every opening is sometimes the best one: '+JSON.stringify(bestOpen));
assert.ok(clearRight/clear>.6,'when one opening clearly suits the night, it is usually the best ('+clearRight+'/'+clear+')');
const winners=new Set(Object.values(bestAnswer).map(t=>Object.entries(t).sort((a,b)=>b[1]-a[1])[0][0]));
assert.ok(winners.size>=3,'different angles call for different answers');
const pushTop=mean(pushByFit[Math.max(...Object.keys(pushByFit).map(Number))]),pushLow=mean(pushByFit[Math.min(...Object.keys(pushByFit).map(Number))]);
assert.ok(pushTop>mean(leave)&&pushLow<mean(leave),'pushing your luck pays when it suits the night and costs when it does not');

// Vows: counter and finisher promises become a beat, judged exactly as the promise is.
const vows={counter:{n:0,kept:0},finisher:{n:0,kept:0}};
index=0;
for(const worker of D.TALENT)for(const opponent of D.FOES.slice(0,6))for(const finish of ['win_clean','lose_protected']){
 const i=index++;
 const promoter=D.PROMOS[i%4],booking={id:'vow-'+i,wid:worker.id,rid:opponent.id,pid:promoter.id,finish,slot:'mid',minutes:12,eventAbs:i,feudHeat:0};
 const room=Room.begin(booking,worker,opponent,promoter);Room.act(room,'plan_story');Room.act(room,'board_ok');
 while(room.stage!=='done')Room.act(room,Room.options(room)[0].id);
 if(room.sheet.skipPromo)continue;
 const want=Math.floor(i/2)%2?'question':'finisher';
 const duel=Mic.begin(booking,worker,opponent,null,room.sheet,promoter);
 while(duel.stage!=='done'){const options=Mic.choices(duel);Mic.choose(duel,duel.round===3?(options.find(o=>o.id===want)||options[0]).id:options[0].id);}
 const promo=Mic.result(duel),sheet=Room.addVow(room.sheet,promo,worker,opponent),vow=sheet.nodes.find(n=>n.vow);
 if(!['counter','finisher'].includes(promo.promise.type)){assert.ok(!vow,'only counters and finishers become beats');continue;}
 assert.ok(vow&&vow.kind===promo.promise.type,'the vow goes on the sheet');
 assert.equal(sheet.nodes.at(-1).id,'finish','the finish stays last');
 const match=M.create({w:{...worker,flags:{},fatigue:5},f:opponent,p:promoter,slot:'mid',minutes:sheet.minutes,finish,plan:{game:sheet.game,leash:'script',talk:'none'},preparation:{},flags:sheet.flags,sheet,promo,seed:i});
 for(let tick=0;tick<9000&&!match.done;tick++){if(match.decision&&!match.queue.length)M.resolve(match,match.decision.options[0].id);M.next(match);}
 const settled=match.sheet.nodes.find(n=>n.vow);
 assert.ok(['achieved','missed'].includes(settled.status),'a vow is settled by the bell');
 const promised=settled.kind==='counter'?!!match.final.promoSignals?.workerCounter:finish==='win_clean'&&match.log.some(line=>line.text.includes(worker.finisher));
 assert.equal(settled.status==='achieved',promised,'the vow beat agrees with the promise check');
 const strip=Sheets.strip(match,{final:true});
 assert.ok(strip.beats.some(beat=>beat.vow&&beat.lane===2),'the vow has its own lane on the match strip');
 vows[settled.kind].n++;if(settled.status==='achieved')vows[settled.kind].kept++;
}
assert.ok(vows.counter.n>20&&vows.finisher.n>20,'both kinds of vow are exercised');
assert.ok(vows.counter.kept>0&&vows.counter.kept<vows.counter.n,'a counter vow can go either way');
console.log(`PASS promo read v3.7: ${scenes} scenes; opening fit ${openCurve.map(x=>x.toFixed(1)).join(' < ')}; best opening ${Object.entries(bestOpen).map(([k,v])=>k+' '+Math.round(100*v/scenes)+'%').join(', ')}; clear reads right ${clearRight}/${clear}; answer fit ${answerCurve.map(x=>x.toFixed(1)).join(' < ')}; push ${pushLow.toFixed(1)} / leave ${mean(leave).toFixed(1)} / ${pushTop.toFixed(1)}; vows counter ${vows.counter.kept}/${vows.counter.n}, finisher ${vows.finisher.kept}/${vows.finisher.n}`);
// v0.3.22 The disqualification finishes read cleanly too.
{let n=0;for(const finish of ['win_dq','lose_dq'])for(const worker of D.TALENT.slice(0,6))for(const opponent of D.FOES.slice(0,4)){
 const booking={id:'read-dq-'+(n++),wid:worker.id,rid:opponent.id,pid:D.PROMOS[n%4].id,finish,slot:'main',minutes:12,eventAbs:n,feudHeat:30};
 const duel=Mic.begin(booking,worker,opponent,null,null,D.PROMOS[n%4]);const view=Mic.view(duel);
 assert.equal(view.read.length,4);assert.doesNotMatch(view.read.join(' '),leftovers);
 for(const o of Mic.choices(duel))assert.doesNotMatch(o.label+' '+(o.hint||''),leftovers);}
 console.log('PASS disqualification finishes read cleanly ('+n+' scenes)');}

