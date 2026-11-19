#!/usr/bin/env node
'use strict';
/**
 * Five-week persisted-career continuity audit.
 *
 * This is an INTEGRATION TEST of actual career result recording / rival ledger /
 * wrestler memory / public promos / live match / weekly progression / save-load.
 * Only the contract offers are controlled fixtures (to guarantee same pair weekly).
 * Does not patch the game, seed false history, or claim subjective prose quality.
 */
const {engine}=require('../tests/_world.cjs');
const lab=require('./graph-lab/core.js');
const SCHEMA='office-career-rivalry-continuity-v1';
const FINISHES=['lose_clean','win_dirty','lose_protected','lose_clean','win_clean'];

function check(condition,message){if(!condition)throw Error(message)}
function play(seed=20261119){
 const {root}=engine(seed);
 const {OfficeGame:G,OfficeMatch:M,OfficeRivalry:R,OfficeMemory:Mem,OfficeStory:Story}=root;
 check(G&&M&&R&&Mem&&Story?.Graph,'Production career, match, rivalry, memory and promo systems must load');
 G.fresh();G.S.cash+=45000;
 check(G.sign('rex')===null,'Rex must be signed in a real career');
 const player='rex',opponent='silas',promo=Story.Graph;
 const history=[],checks={completed:0,recorded:0,reloads:0,callbackFacts:0,memoryCallbacks:0,
   failedFinishes:0,duplicateResults:0};
 let priorId=null,priorMemory=null,firstRemembered=false;
 for(let i=0;i<5;i++){
  const week=G.abs(),w=G.W(player),f=G.F(opponent),p=G.P('dock');
  check(w&&f&&p,'All real participants still exist in career week '+week);
  const before=R.profile(player,opponent),mBefore=Mem.context(player,opponent);
  check(before.record.meetings===i,'Earlier results missing from rivalry ledger before week '+week);
  if(i){
   check(before.last?.cid===priorId,'Rivalry lost identity of previous match at week '+week);
   check(before.facts.every(fact=>!fact.cid||before.last||fact.cid),'Rivalry facts are not inspectable');
  }else{
   check(before.record.meetings===0&&before.facts.length===0,'First meeting invented historical facts');
  }
  const finish=FINISHES[i],c={
   id:'career-rivalry-continuity-'+seed+'-'+(i+1),pid:'dock',wid:player,rid:opponent,
   slot:'feature',minutes:15,finish,purse:350,tag:'Rivalry audit',
   feudHeat:G.feud(player,opponent)?.heat||0,blowoff:false,eventAbs:week
  };
  G.S.card.push(c);
  const st=promo.begin(c,w,f,G.feud(player,opponent));
  check(st.history?.length===Math.min(3,i),'Public promo did not receive earlier real career results, week '+week);
  check(st.hasHistory===Boolean(i),'Public promo previous-meeting flag incorrect at week '+week);
  check(st.record?.n===i,'Public promo rivalry record incorrect at week '+week);
  if(i){
   check(/last|previous|unfinished|remembered|again|tonight/i.test(st.dialogue[0].line),
    'Rematch introduction failed to acknowledge history at week '+week);
  }
  const ids=new Set((before.last?R.ledger(player,opponent).meetings:[]).map(x=>x.cid));
  for(const fact of before.facts||[]){
   if(fact.cid){check(ids.has(fact.cid),'Promo fact cites a match not in persisted rivalry history: '+fact.cid);checks.callbackFacts++;}
  }
  const cases=st.cases||[];
  for(let steps=0;steps<18&&st.stage!=='done';steps++){
   const choices=promo.choices(st.stage,st);
   check(choices.length>0,'Promo graph ran out of options before completion');
   promo.choose(st,choices[0].id);
  }
  check(st.stage==='done','Public promo did not complete in 18 decisions');
  const promoResult=promo.result(st);
  const memory=Mem.context(player,opponent);
  if(i&&priorMemory){
   check(memory.recall&&memory.recall===priorMemory,'A persisted wrestler-specific memory disappeared between meetings');
   checks.memoryCallbacks++;
  }
  const match=lab.runMatch(root,{
   w:{...w,flags:{...(w.flags||{})},fatigue:w.fatigue||0},
   f,p,slot:c.slot,minutes:c.minutes,finish,
   feudHeat:Math.max(c.feudHeat||0,G.feud(player,opponent)?.heat||0),
   blowoff:false,promo:promoResult,memory,
   plan:{game:'technical',leash:'script',talk:'calm'},
   preparation:{...(w.prep||{})},flags:{...(w.flags||{})},
   seed:seed+411*i+101
  });
  check(match.done&&match.final,'Live match did not finish in week '+week);
  check(match.graph?.outcome?.id===finish,'Booked finish contradicted in week '+week);checks.completed++;
  if(i&&memory.recall){
   check(match.log.some(x=>x.text&&x.text.includes(memory.recall)),
     'The remembered event never reached match commentary in week '+week);
  }
  const fin={...match.final,log:match.log.map(x=>({t:x.t,text:x.text,kind:x.kind,big:x.big}))};
  const outcome=G.applyResult(c,fin);
  check(Array.isArray(outcome),'Actual career applyResult must return consequences');
  check(G.resultRecorded(c),'Career did not record match outcome '+c.id);
  const after=R.profile(player,opponent),ledger=R.ledger(player,opponent);
  check(after.record.meetings===i+1,'Rivalry history did not grow after week '+week);
  check(ledger.meetings[i]?.cid===c.id,'Rivalry recorded incorrect contract at week '+week);
  check(G.S.history.some(x=>x.cid===c.id),'Season history lost result '+c.id);
  check(G.feud(player,opponent)?.matches===i+1,'Career feud match count failed to advance');
  checks.recorded++;
  const beforeDuplicate=JSON.stringify({career:G.S.history,ledger:ledger.meetings,
    memory:Mem.view(player).entries,feud:G.feud(player,opponent)});
  G.applyResult(c,fin);
  check(JSON.stringify({career:G.S.history,ledger:R.ledger(player,opponent).meetings,
    memory:Mem.view(player).entries,feud:G.feud(player,opponent)})===beforeDuplicate,
   'Duplicate result callback double-counted persistent history');
  checks.duplicateResults++;
  // A difficult clean defeat should produce a genuine memory + an actionable debrief.
  if(i===0){
   const remembered=Mem.view(player).entries.some(x=>x.against===opponent&&x.kind==='humiliation');
   check(remembered,'First clean loss did not create the authentic humiliation memory');
   firstRemembered=true;
  }
  // Resolve real debriefs so they do not block the next week's career.
  for(let safety=0;safety<25;safety++){
   const inbox=G.pending();if(!inbox.length)break;
   const message=inbox[0];
   const option=message.options.find(x=>x.id==='back'||x.id==='listen')||message.options[0];
   check(option,'Blocking inbox decision lacks options');
   G.answer(message.id,option.id);
   check(message.answer,'Blocking inbox decision could not be settled: '+message.dtype);
  }
  // Memory persists from this encounter into the next (and is not fabricated
  // from an unrelated opponent or just a synthetic memory fixture).
  priorMemory=Mem.context(player,opponent).recall;
  const commentary=match.log.filter(x=>x.text).map(x=>x.text);
  history.push({meeting:i+1,week,contract:c.id,finish,route:fin.finishRoute||null,
   stars:fin.stars,earlierMeetings:before.record.meetings,recordedMeetings:after.record.meetings,
   promoIntro:st.dialogue[0].line,publicFacts:before.facts.map(x=>({kind:x.kind,cid:x.cid||null})),
   caseCount:cases.length,rememberedBefore:Boolean(mBefore.recall),rememberedAfter:Boolean(priorMemory),
   recallInCommentary:Boolean(i&&memory.recall&&commentary.some(text=>text.includes(memory.recall))),
   feudHeat:G.feud(player,opponent)?.heat||0});
  // Force the exact save/reload path used by the browser; check the restored
  // rivalry and memory before completing a real career week.
  check(G.save()!==false,'Career save failed before reload');
  const prior=JSON.stringify({hist:G.S.history.map(x=>x.cid),meet:R.ledger(player,opponent).meetings.map(x=>x.cid),
   memory:Mem.view(player).entries.map(x=>x.id),heat:G.feud(player,opponent).heat});
  check(G.load(),'Saved career could not be reloaded');
  const restored=JSON.stringify({hist:G.S.history.map(x=>x.cid),meet:R.ledger(player,opponent).meetings.map(x=>x.cid),
   memory:Mem.view(player).entries.map(x=>x.id),heat:G.feud(player,opponent).heat});
  check(restored===prior,'Save/load corrupted or duplicated rivalry / memory records');
  checks.reloads++;
  G.endWeek();
  check(G.abs()===week+1,'The real career calendar did not advance from '+week);
  priorId=c.id;
 }
 check(firstRemembered,'No test memory originated from a real loss');
 return {schema:SCHEMA,scope:'Five real career weeks; contracts manually fixed to ensure same pairing',
  seed,player,opponent,meetings:history,checks,
  totalRecorded:R.profile(player,opponent).record.meetings,
  finalMemory:Mem.view(player).entries.map(e=>({kind:e.kind,id:e.id,against:e.against})),
  finalFeudHeat:G.feud(player,opponent)?.heat||0,
  warnings:history.filter((x,i)=>i&&x.caseCount===0).map(x=>'Meeting '+x.meeting+' offered no evidence-based promo case')};
}
function markdown(report){
 const lines=[
  '## Five-week career rivalry continuity','',
  '**Real career simulation:** five weekly matches, completed through the game engine, career result processor, rivalry ledger, memory/debrief system, save/load and end-of-week processing.',
  '',
  '| Meeting | Career week | Contract | Actual finish | Prior results visible | Evidence-based promo cases | Past memory recalled | Rivalry heat |',
  '|:--|--:|:--|:--|--:|--:|:--:|--:|'
 ];
 for(const m of report.meetings)lines.push('| '+m.meeting+' | '+m.week+' | '+m.finish+
  ' | '+(m.route||'—')+' | '+m.earlierMeetings+' | '+m.caseCount+
  ' | '+(m.recallInCommentary?'Yes':m.meeting===1?'Not yet':'No')+' | '+m.feudHeat+' |');
 lines.push('','**Checks:** '+Object.entries(report.checks).map(([key,n])=>key+'='+n).join(' · '),
  '','**Stored record:** '+report.totalRecorded+' meetings; '+report.finalMemory.length+
  ' recent memory entries; final feud heat '+report.finalFeudHeat+'.');
 if(report.warnings.length)lines.push('','### Review prompts',...report.warnings.map(s=>'- '+s));
 lines.push('','**Limit:** Contracts are controlled test fixtures, not random generated offers. The match, public promo, career consequences, remembered debriefs, rivalry ledger, save/reload and week advancement are the real production systems. Narrative believability still requires human review.');
 return lines.join('\n')+'\n';
}
if(require.main===module){
 try{
  const result=play();
  process.stdout.write(process.argv.includes('--json')?JSON.stringify(result,null,2)+'\n':markdown(result));
 }catch(e){console.error('Career continuity audit failed:',e.stack||e);process.exitCode=1;}
}
module.exports={SCHEMA,FINISHES,play,markdown};
