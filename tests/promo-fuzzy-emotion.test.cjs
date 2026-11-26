'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficePromoFuzzy:F,OfficeData:D,OfficeAcademy:A,OfficeGame:G,OfficeWorldV4:V,OfficeMic:M,OfficePromoDirector:P}=root;
const clone=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const participant={irritation:35,composure:50,identity:{}};
const professional=F.selectionFacts({ego:25,pro:90,psych:85,mic:60,style:'Technical'});
const volatile=F.selectionFacts({ego:90,pro:25,psych:35,mic:60,style:'Brawl'});
const event={side:'f',beforeMeter:0,afterMeter:12,feudHeat:40,personal:true,spoke:true};
const p=F.emotionStep(professional,participant,event),v=F.emotionStep(volatile,participant,event);
assert.ok(v.irritation>p.irritation&&v.composure<p.composure,'personal challenge should hit volatile worker harder');
const calm=F.emotionStep(volatile,participant,{...event,afterMeter:0,personal:false,calming:true});
assert.ok(calm.irritation<participant.irritation&&calm.composure>participant.composure);
const bad=F.emotionStep(volatile,participant,{...event,side:'w',afterMeter:-12,landed:false,personal:false});
const good=F.emotionStep(volatile,participant,{...event,side:'w',afterMeter:12,landed:true,personal:false});
assert.ok(bad.irritation>good.irritation&&bad.composure<good.composure);
eq(participant,{irritation:35,composure:50,identity:{}});
assert.equal(F.emotionStep(volatile,participant,{...event,beforeMeter:undefined}),null);
for(const f of [professional,volatile])for(const side of ['w','f'])for(const landed of [true,false]){
 let previous=null;
 for(let x=0;x<=100;x+=.25){
  const part={...participant,irritation:x};
  const next=F.emotionStep(f,part,{...event,side,landed});
  for(const key of ['irritation','composure'])assert.ok(Number.isFinite(next[key])&&next[key]>=0&&next[key]<=100);
  assert.ok(Math.abs(next.irritation-x)<=22+1e-9&&Math.abs(next.composure-50)<=18+1e-9);
  if(previous)assert.ok(Math.abs(next.irritation-previous.irritation)<1&&Math.abs(next.composure-previous.composure)<1,'transition discontinuity');
  previous=next;
 }
}
// Test protected record/evidence path against exact original director policy.
for(const protection of [{case:{issue:'recorded'}},{claim:{hasEvidence:true}}]){
 const person={id:'p',ego:70,pro:80,mic:60,psych:55,style:'Technical'},opponent={...person,id:'f'};
 const d=P.begin(person,opponent,null,'faceoff'),old=clone(d);
 const state={core:{feudHeat:50,...protection},meter:12,authoredDialogue:{fuzzy:{v:1,emotion:1,w:F.selectionFacts(person),f:F.selectionFacts(opponent)}}};
 const rec={round:'answer',id:'personal',landed:true},log=[{side:'w',line:'Point.',swing:12}];
 P.observe(d,state,rec,log,0);P.observe(old,{...state,authoredDialogue:{}},rec,log,0);eq(d,old);
}
G.fresh();const s=G.S;s.seed=47;s.careerSeed=47;
const veterans=D.ALL.slice(),rookies=[];
for(let season=2;season<=40&&rookies.length<A.REGISTER.length;season++){
 s.season=season;
 if(season>2){
  for(const div of ['men','women'])for(const worker of D.ALL.filter(w=>D.divisionOf(w)===div&&s.worldV4.contracts[w.id]?.owner!=='retired').slice(0,3)){
   s.worldV4.contracts[worker.id].owner='retired';s.free=s.free.filter(f=>f.id!==worker.id);
  }
  V.activate(s);
 }
 rookies.push(...A.intake(s,season));
}
const roster=[...veterans,...rookies];assert.equal(roster.length,200);
let paired=0,resumes=0,trajectoryChanges=0,routeChanges=0,resultChanges=0,checked=0;
const summarize=()=>({turns:0,irritationSum:0,composureSum:0,irritationExtreme:0,composureExtreme:0,events:{},push:0});
const totals={before:summarize(),after:summarize()};
function play(st,policy,j){
 const a=totals[policy];let resumed=null;
 const trace=[];
 for(let step=0;st.stage!=='done';step++){
  assert.ok(step<12,'bounded scene');
  const round=M.ROUNDS[st.round].id,options=M.choices(st);
  const wanted=({open:j?'accusation':'proof',answer:j?'personal':'calm',push:j?'press':'acknowledge',close:'vow'})[round];
  const id=(options.find(x=>x.id===wanted)||options[0]).id;
  if(policy==='after'&&step===1&&j===0){resumed=clone(st);resumes++;}
  const prior=[st.director.player,st.director.opponent].map(x=>({composure:x.composure,irritation:x.irritation}));
  M.choose(st,id);if(resumed)M.choose(resumed,id);
  for(const [i,p] of [st.director.player,st.director.opponent].entries()){
   assert.ok(Number.isFinite(p.composure)&&p.composure>=0&&p.composure<=100);
   assert.ok(Number.isFinite(p.irritation)&&p.irritation>=0&&p.irritation<=100);
   if(policy==='after'&&!st.core.case&&!st.core.claim?.hasEvidence){
    assert.ok(Math.abs(p.composure-prior[i].composure)<=18+1e-9);
    assert.ok(Math.abs(p.irritation-prior[i].irritation)<=22+1e-9);checked++;
   }
   a.turns++;a.irritationSum+=p.irritation;a.composureSum+=p.composure;
   if(p.irritation>=85)a.irritationExtreme++;if(p.composure<=15)a.composureExtreme++;
  }
  trace.push([round,st.director.player.composure,st.director.player.irritation,st.director.opponent.composure,st.director.opponent.irritation]);
 }
 if(resumed)eq(st,resumed);
 const result=M.result(st);assert.ok(result&&Number.isFinite(result.quality));
 const event=st.director.event?.kind||'none';a.events[event]=(a.events[event]||0)+1;
 if(st.steps.some(x=>x.round==='push'))a.push++;
 assert.equal(st.steps.filter(x=>x.round==='close').length,1);
 for(const e of st.log){
  assert.ok(!/\{[a-zA-Z_][a-zA-Z_0-9]*\}/.test(e.line),'unresolved token');
  if(e.semantic?.rookieFamilyBank===1){const prior=st.log[e.semantic.replyTo];assert.ok(prior&&prior.side!==e.side&&prior.semantic?.claim===e.semantic.claim);}
 }
 return trace;
}
for(const [i,worker] of roster.entries())for(let j=0;j<2;j++){
 const pool=roster.filter(x=>x.id!==worker.id&&D.divisionOf(x)===D.divisionOf(worker)),other=pool[(i+j*17)%pool.length];
 const w=j?other:worker,f=j?worker:other,p=D.PROMOS[(i+j)%D.PROMOS.length];
 const c={id:'f4-'+worker.id+'-'+j,wid:w.id,rid:f.id,pid:p.id,eventAbs:100+j,finish:j?'lose_clean':'win_clean',minutes:12,feudHeat:j?55:0};
 const opts={directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,fuzzy:true,banks:promoBanks(w.id,f.id)};
 const old=M.begin(c,w,f,null,null,p,opts),now=M.begin(c,w,f,null,null,p,{...opts,fuzzyEmotion:true});
 assert.equal(now.authoredDialogue.fuzzy.emotion,1);assert.equal(old.authoredDialogue.fuzzy.emotion,undefined);
 const legacy=clone(now);delete legacy.authoredDialogue.fuzzy.emotion;eq(legacy,old);
 const before=play(old,'before',j),after=play(now,'after',j);
 if(JSON.stringify(before)!==JSON.stringify(after))trajectoryChanges++;
 if(old.director.followup?.follow!==now.director.followup?.follow)routeChanges++;
 if(M.result(old).quality!==M.result(now).quality)resultChanges++;
 assert.equal(now.finish,c.finish);assert.equal(old.finish,c.finish);
 assert.equal(now.steps[0].id,old.steps[0].id);assert.equal(now.steps[1].id,old.steps[1].id);
 paired++;
}
assert.equal(paired,400);assert.equal(resumes,200);assert.ok(trajectoryChanges>0&&checked>0);
console.log('F4 EMOTION AUDIT '+JSON.stringify({paired,resumes,trajectoryChanges,routeChanges,resultChanges,checked,totals}));
console.log('PASS F4: bounded contextual emotion transitions, protected record parity, deterministic resume and unchanged booked finishes.');

 // F5: inspect competing propensities directly, then compare opt-in against
 // the exact F4 policy on the same 200-worker cohort and scene seeds.
 const pacingFacts={w:professional,f:volatile};
 const steady={...participant,irritation:10,composure:80,stance:'adaptive'};
 const heated={...participant,irritation:80,composure:25,stance:'adaptive'};
 const situation={meter:0,feudHeat:55,pace:'confrontation',landed:true};
 const quiet=F.pacing(pacingFacts,{player:steady,opponent:steady},{...situation,calming:true});
 const loud=F.pacing(pacingFacts,{player:steady,opponent:heated},{...situation,personal:true});
 assert.ok(loud.events.interrupt>quiet.events.interrupt&&loud.events.escalate>quiet.events.escalate);
 assert.ok(quiet.events.defuse>loud.events.defuse&&loud.follow>quiet.follow);
 const reserved=F.pacing(pacingFacts,{player:steady,opponent:{...heated,stance:'reserved'}},situation);
 const adaptive=F.pacing(pacingFacts,{player:steady,opponent:heated},situation);
 assert.ok(reserved.events.refusal>adaptive.events.refusal);
 let last=null;
 for(let i=0;i<=100;i+=.25){
  const q=F.pacing(pacingFacts,{player:steady,opponent:{...heated,irritation:i}},situation);
  assert.ok(q.follow>=.08&&q.follow<=.82);
  assert.ok(Object.values(q.events).every(x=>x>=0&&Number.isFinite(x)));
  assert.ok(Object.values(q.events).reduce((a,b)=>a+b,0)<=.55+1e-9);
  if(last)for(const k of Object.keys(q.events))assert.ok(Math.abs(q.events[k]-last.events[k])<.015);
  last=q;
 }
 // Evidence/commitment priority and unchanged legacy fallback, even with F5.
 const guardDirector=P.begin({id:'p',ego:70,pro:80,psych:55,mic:60,style:'Technical'},{id:'f',ego:90,pro:30,psych:35,mic:60,style:'Brawl'},null,'faceoff');
 guardDirector.lastPlayer='Question';guardDirector.lastOpponent='Answer';
 const guardState={seed:'f5-guard',meter:0,core:{feudHeat:50,case:{commit:{kind:'nocheat'}}},authoredDialogue:{fuzzy:{v:1,emotion:1,pacing:1,...pacingFacts}}};
 const guardRec={round:'answer',id:'personal',landed:true};
 assert.equal(P.spontaneous(guardDirector,guardState,guardRec),null);
 assert.equal(P.route(guardDirector,guardState,guardRec).follow,true);
 const evidence={...guardState,core:{feudHeat:50,claim:{hasEvidence:true}}};
 eq(P.spontaneous(guardDirector,evidence,guardRec),P.spontaneous(guardDirector,{...evidence,authoredDialogue:{}},guardRec));
 eq(P.route(guardDirector,evidence,guardRec),P.route(guardDirector,{...evidence,authoredDialogue:{}},guardRec));
 const pacingAudit={pairs:0,resumes:0,changed:0,old:{},now:{},oldPush:0,newPush:0,academyEvents:0};
 function runPacing(st,key,j){
  let resumed=null;
  for(let step=0;st.stage!=='done';step++){
   assert.ok(step<5,'F5 cannot add a second follow-up');
   const round=M.ROUNDS[st.round].id,options=M.choices(st);
   const wanted=({open:j?'accusation':'proof',answer:j?'personal':'calm',push:j?'press':'acknowledge',close:'vow'})[round];
   const id=(options.find(x=>x.id===wanted)||options[0]).id;
   if(key==='now'&&step===1&&j===0){resumed=clone(st);pacingAudit.resumes++;}
   M.choose(st,id);if(resumed)M.choose(resumed,id);
  }
  if(resumed)eq(st,resumed);
  const kind=st.director.event?.kind||'none';
  pacingAudit[key][kind]=(pacingAudit[key][kind]||0)+1;
  if(st.steps.some(x=>x.round==='push'))pacingAudit[key==='old'?'oldPush':'newPush']++;
  assert.equal(st.steps.filter(x=>x.round==='close').length,1);
  assert.ok(st.steps.filter(x=>x.round==='push').length<=1);
  assert.ok(Number.isFinite(M.result(st).quality));
  if(st.director.event){
   assert.ok(st.director.event.actor===st.w.id||st.director.event.actor===st.f.id);
   assert.equal(st.director.followup.follow,st.director.event.follow);
  }
  for(const e of st.log)if(e.semantic?.rookieFamilyBank===1){const prior=st.log[e.semantic.replyTo];assert.ok(prior&&prior.side!==e.side&&prior.semantic?.claim===e.semantic.claim);}
 }
 for(const [i,worker] of roster.entries())for(let j=0;j<2;j++){
  const pool=roster.filter(x=>x.id!==worker.id&&D.divisionOf(x)===D.divisionOf(worker)),other=pool[(i+j*17)%pool.length];
  const w=j?other:worker,f=j?worker:other,p=D.PROMOS[(i+j)%D.PROMOS.length];
  const c={id:'f5-'+worker.id+'-'+j,wid:w.id,rid:f.id,pid:p.id,eventAbs:100+j,finish:j?'lose_clean':'win_clean',minutes:12,feudHeat:j?70:0};
  const opts={directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,fuzzy:true,fuzzyEmotion:true,banks:promoBanks(w.id,f.id)};
  const old=M.begin(c,w,f,null,null,p,opts),now=M.begin(c,w,f,null,null,p,{...opts,fuzzyPacing:true});
  const legacy=clone(now);delete legacy.authoredDialogue.fuzzy.pacing;eq(legacy,old);
  runPacing(old,'old',j);runPacing(now,'now',j);
  if(now.director.event?.kind!==old.director.event?.kind||now.director.followup.follow!==old.director.followup.follow)pacingAudit.changed++;
  if(worker.id.startsWith('academy-')&&now.director.event)pacingAudit.academyEvents++;
  assert.equal(now.finish,c.finish);assert.equal(old.finish,c.finish);
  pacingAudit.pairs++;
 }
 assert.equal(pacingAudit.pairs,400);assert.equal(pacingAudit.resumes,200);
 assert.ok(pacingAudit.changed>0&&pacingAudit.academyEvents>0);
 assert.ok((pacingAudit.now.interrupt||0)+(pacingAudit.now.escalate||0)>0);
 console.log('F5 PACING AUDIT '+JSON.stringify(pacingAudit));
 console.log('PASS F5: competing continuous event propensities, protected commitments, bounded follow-up and deterministic resume.');

 // F6: actual response bands, not the signed net meter. Unknown and stale
 // feedback are absent. The same meter can conceal opposite receptions.
 assert.equal(F.audienceGrade('roar'),1);assert.equal(F.audienceGrade('dead'),-1);
 assert.equal(F.audienceGrade('unknown'),null);
 assert.equal(F.heard({audience:{w:{round:0,band:'roar'}}},'w',1),null);
 assert.equal(F.heard({audience:{w:{round:0,band:'roar'}}},'w',0),1);
 const highMic=F.selectionFacts({ego:70,pro:60,psych:65,mic:90,style:'Story'});
 const supportive=F.selectionScores(highMic,steady,0,'w',0,1),hostile=F.selectionScores(highMic,steady,0,'w',0,-1);
 assert.ok(supportive.showmanship>hostile.showmanship);
 const neutralEvent={side:'w',beforeMeter:0,afterMeter:0,feudHeat:0,landed:true,spoke:true};
 const cheers=F.emotionStep(highMic,participant,{...neutralEvent,audience:1});
 const jeers=F.emotionStep(highMic,participant,{...neutralEvent,audience:-1});
 assert.ok(cheers.composure>jeers.composure&&cheers.irritation<jeers.irritation);
 const f6Audit={solo:0,mouth:0,resumes:0,reactions:0,distinctReception:0,changed:0,events:{},protected:0};
 function exerciseF6(st,key,j){
  let saved=null;
  for(let step=0;st.stage!=='done';step++){
   assert.ok(step<5);
   const round=M.ROUNDS[st.round].id,options=M.choices(st);
   const wanted=({open:j?'accusation':'proof',answer:j?'personal':'calm',push:j?'press':'acknowledge',close:'vow'})[round];
   const id=(options.find(x=>x.id===wanted)||options[0]).id;
   if(key==='new'&&step===1){saved=clone(st);f6Audit.resumes++;}
   M.choose(st,id);if(saved)M.choose(saved,id);
   if(key==='new'&&!st.core.case&&!st.core.claim?.hasEvidence){
    const a=st.authoredDialogue.fuzzy.audience;
    for(const side of ['w','f'])if(a[side]?.round===st.round-1){
     assert.ok(Number.isFinite(F.audienceGrade(a[side].band)));f6Audit.reactions++;
    }
    if(a.w&&a.f&&a.w.round===a.f.round&&F.audienceGrade(a.w.band)!==F.audienceGrade(a.f.band))f6Audit.distinctReception++;
   }
  }
  if(saved)eq(st,saved);
  assert.equal(st.steps.filter(x=>x.round==='close').length,1);
  assert.ok(Number.isFinite(M.result(st).quality));
  if(st.speaker){
   assert.equal(M.result(st).mouth.id,st.speaker.id);
   assert.equal(st.director.player.id,st.speaker.id);assert.equal(st.director.client,st.w.id);
   // Client remains the booked wrestler; any event actor is a speaker.
   if(st.director.event)assert.ok([st.speaker.id,st.f.id].includes(st.director.event.actor));
  }
  if(key==='new'){const k=st.director.event?.kind||'none';f6Audit.events[k]=(f6Audit.events[k]||0)+1;}
 }
 for(const [i,worker] of roster.entries())for(let j=0;j<2;j++){
  const pool=roster.filter(x=>x.id!==worker.id&&D.divisionOf(x)===D.divisionOf(worker)),opponent=pool[i%pool.length],manager=pool[(i+1)%pool.length];
  const p=D.PROMOS[i%D.PROMOS.length],c={id:'f6-'+worker.id+'-'+j,wid:worker.id,rid:opponent.id,pid:p.id,eventAbs:100+j,finish:'win_clean',minutes:12,feudHeat:j?55:0};
  const mouth=j?{id:manager.id,name:manager.name,short:manager.short,mic:manager.mic,psych:manager.psych,heat:manager.heat}:null;
  const opts={mouth,directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,fuzzy:true,fuzzyEmotion:true,fuzzyPacing:true,banks:promoBanks((mouth||worker).id,opponent.id)};
  const old=M.begin(c,worker,opponent,null,null,p,opts),now=M.begin(c,worker,opponent,null,null,p,{...opts,mouthProfile:manager,fuzzyAudience:true});
  const policy=now.authoredDialogue.fuzzy;assert.equal(policy.crowd,1);
  if(mouth){
   assert.equal(policy.mouthpiece,1);assert.equal(policy.speakerId,manager.id);assert.equal(policy.clientId,worker.id);
   eq(policy.w,F.selectionFacts(manager));assert.ok(!old.authoredDialogue.fuzzy);
   assert.equal(now.director.player.ego,manager.ego);assert.equal(now.director.player.pro,manager.pro);
   f6Audit.mouth++;
  }else{
   const legacy=clone(now);delete legacy.authoredDialogue.fuzzy.crowd;delete legacy.authoredDialogue.fuzzy.audience;eq(legacy,old);
   f6Audit.solo++;
  }
  exerciseF6(old,'old',j);exerciseF6(now,'new',j);
  if(JSON.stringify(old.director.turns)!==JSON.stringify(now.director.turns))f6Audit.changed++;
  assert.equal(now.finish,c.finish);assert.equal(now.w.id,old.w.id);
  if(now.core.case||now.core.claim?.hasEvidence)f6Audit.protected++;
 }
 assert.equal(f6Audit.solo,200);assert.equal(f6Audit.mouth,200);assert.equal(f6Audit.resumes,400);
 assert.ok(f6Audit.reactions>0&&f6Audit.distinctReception>0&&f6Audit.changed>0);
 console.log('F6 AUDIENCE AUDIT '+JSON.stringify(f6Audit));
 console.log('PASS F6: separate audience observations, actual mouthpiece identity, retained client commitments, versioned scene parity and bounded progression.');
