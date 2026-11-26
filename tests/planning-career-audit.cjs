'use strict';
// Real player bookings, real room/promo/match engines, real career settlement.
// The surrounding world uses the existing seeded career policy; no forced moves.
const assert=require('node:assert/strict');
const {play}=require('./_world.cjs'),{promoBanks}=require('./_source.cjs');
const continuation=require('./_sequence-continuation.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b,msg)=>assert.deepEqual(copy(a),copy(b),msg);
const inc=(o,k,n=1)=>o[k]=(o[k]||0)+n;
const range=(x,lo=0,hi=100)=>Number.isFinite(x)&&x>=lo&&x<=hi;
const pick=(xs,n)=>xs[((n%xs.length)+xs.length)%xs.length];
const avg=xs=>xs.length?Math.round(xs.reduce((a,b)=>a+b,0)/xs.length*1000)/1000:null;
function summarise(rows){
 const sum=k=>rows.reduce((a,r)=>a+(r[k]||0),0);
 const frequencies=k=>rows.reduce((o,r)=>(inc(o,String(r[k]??'unknown')),o),{});
 return {matches:rows.length,stars:avg(rows.map(r=>r.stars)),crowd:avg(rows.map(r=>r.crowd)),
  outcomes:frequencies('outcome'),injuries:sum('injury'),shortened:sum('shortened'),botches:sum('botches'),
  calls:sum('calls'),ignored:sum('ignored'),consent:avg(rows.map(r=>r.consent)),opponentConsent:avg(rows.map(r=>r.opponentConsent)),
  objectives:sum('objectives'),witnessed:sum('witnessed'),named:sum('named'),landed:sum('landed'),
  sequenceOffers:sum('sequenceOffer'),sequenceHeard:sum('sequenceHeard'),sequenceSelected:sum('sequenceSelected'),sequences:sum('sequences'),exact:sum('exact'),adapted:sum('adapted'),missed:sum('missed'),
  noReceipt:sum('noReceipt'),protected:sum('protected'),noOpening:sum('noOpening'),priorProfessional:sum('priorProfessional'),
  negotiation:frequencies('negotiation'),promoReconciliation:frequencies('reconciliation'),
  academyMatches:sum('academy'),planningResumes:sum('roomResume'),matchResumes:sum('matchResume'),
  promoResumes:sum('promoResume'),liveScores:Object.fromEntries(['obedience','improvisation','frustration'].map(k=>[k,avg(rows.flatMap(r=>r.liveScores.map(x=>x[k])))])),
  repeatLines:sum('repeatLines'),spokenLines:sum('spokenLines')};
}
// Diagnostic VM only: equalize and scale the actual routine debits.
// Preserve the existing asymmetric control and the slow-call recovery credits.
const routineFactors=[1,'equal-1',.75,.5,.25,0];
function routineSource(source){
 let instrumented=continuation.budgetSource(source);
 // The shared debit is the mean of both original requested debits before
 // clamping. At equal-1 the combined requested debit is unchanged.
 const anchor="*paceFactor(w,'w');";
 assert.equal(instrumented.split(anchor).length,2,'unique routine debit calculation');
 instrumented=instrumented.replace(anchor,anchor+"\n const sharedRoutineDebit=(drain+.5*workDrain(f)*paceFactor(f,'f'))/2;");
 const edits=[
  ["clamp(M.wSt-drain+(mode==='slow'?1.6:0))","clamp(M.wSt-(root.__mp13RoutineMultiplier===undefined?drain:sharedRoutineDebit*root.__mp13RoutineMultiplier)+(mode==='slow'?1.6:0))"],
  ["clamp(M.fSt-.5*workDrain(f)*paceFactor(f,'f')+(mode==='slow'?1.2:0))","clamp(M.fSt-(root.__mp13RoutineMultiplier===undefined?.5*workDrain(f)*paceFactor(f,'f'):sharedRoutineDebit*root.__mp13RoutineMultiplier)+(mode==='slow'?1.2:0))"]
 ];
 for(const [before,after] of edits){
  assert.equal(instrumented.split(before).length,3,'instrumented debit occurs in both traced and untraced branches');
  instrumented=instrumented.split(before).join(after);
 }
 return instrumented;
}
function routineMetrics(x,E,measure,restCount){
 const {M,fin,traceReport:t}=x, budget=t.budget;
 const staminaAt=(side,frac)=>budget.start[side]+budget.writes.filter(w=>w.side===side&&w.at<=M.len*frac).reduce((n,w)=>n+w.delta,0);
 const meanStamina=frac=>(staminaAt('w',frac)+staminaAt('f',frac))/2;
 const late=M.graph.events.filter(e=>e.t>=M.len*.75&&E.GRAPH.A[e.id]&&!e.blocked&&!e.botched&&E.GRAPH.costOf(e.id)>0);
 return {...measure(x),rests:restCount(x),recoveryOffered:t.recoveryOffers.length,recoveryLanded:t.recoveryOffers.filter(o=>o.landed).length,
  startW:budget.start.w,startF:budget.start.f,fatigueW:t.staminaContext.workers.w.fatigue,fatigueF:t.staminaContext.workers.f.fatigue,
  stamina25:meanStamina(.25),stamina50:meanStamina(.5),stamina75:meanStamina(.75),endW:M.wSt,endF:M.fSt,
  lateOffence:late.length,lateHighCost:late.filter(e=>E.GRAPH.costOf(e.id)>=2.2).length,
  routineSpent:budget.writes.filter(w=>w.category==='routine'||w.category==='slow_tick').reduce((n,w)=>n+Math.max(0,-w.delta),0),
  zeroEnd:Number(M.wSt<=1e-7)+Number(M.fSt<=1e-7),shortened:Number(!!fin.shortened),botches:fin.botches||0};
}
function summarizeRoutine(pairs){
 const summarize=rows=>{
  const sum=k=>rows.reduce((n,x)=>n+x[k],0);
  const totals=['signed','opened','completed','interruptions','objectives','injury','staminaCases','timingCases','accepted','witnessed','botched','refunded','ignored','spent','rests','recoveryOffered','recoveryLanded','lateOffence','lateHighCost','zeroEnd','shortened','botches'];
  const means=['stars','crowd','startW','startF','fatigueW','fatigueF','stamina25','stamina50','stamina75','endW','endF','routineSpent'];
  return {...Object.fromEntries(totals.map(k=>[k,sum(k)])),...Object.fromEntries(means.map(k=>[k,avg(rows.map(x=>x[k]))])),bouts:rows.length};
 };
 const group=rows=>Object.fromEntries(routineFactors.map(f=>{
  const xs=rows.map(p=>p.arms[String(f)]),base=rows.map(p=>p.arms['1']);
  return [String(f),{...summarize(xs),changedOutcomes:xs.filter((x,i)=>x.outcome!==base[i].outcome).length,
    gainedCompletions:xs.reduce((n,x,i)=>n+Math.max(0,x.completed-base[i].completed),0),
    lostCompletions:xs.reduce((n,x,i)=>n+Math.max(0,base[i].completed-x.completed),0)}];
 }));
 return {pairs:pairs.length,arms:group(pairs),byStructure:Object.fromEntries([...new Set(pairs.map(p=>p.structure))].map(k=>[k,group(pairs.filter(p=>p.structure===k))])),
  byPlan:Object.fromEntries([...new Set(pairs.map(p=>p.plan))].map(k=>[k,group(pairs.filter(p=>p.plan===k))])),
  byFatigue:Object.fromEntries(['low','moderate','high'].map(k=>[k,group(pairs.filter(p=>p.fatigueBand===k))])),comparisons:pairs};
}
function run(seeds=[3,10],weeks=32){
 const rows=[],careers=[],comparisons=[],traditional=[],feasibilityPairs=[],adaptivePairs=[],continuationRecords=[],traceVerified=new Set(),continuationPairs=[],openingRecords=[],dependencyPairs=[],dependencyWitnesses=[],dependencyDetails=[],dependencyTraceVerified=new Set(),handoverPairs=[],pacingPairs=[],pacingOffers=[],alternativePairs=[],alternativeOpportunities=[],temporalCases=[],arbitrationPairs=[],staminaPairs=[],expenditure=[],reviewRepairs=[],routinePairs=[];
 for(const seed of seeds){
  let index=0;
  const real=(root,c,w,f,random)=>{
   const {OfficeGame:G,OfficeData:D,OfficeRoom:R,OfficeSheets:S,OfficeMatch:E,OfficeMic:Mic,OfficePlanningFuzzy:F,OfficeMemory:Mem}=root;
   assert.ok(w&&f);
   const i=index++,key=seed+':'+c.id;
   // Rotate structures, leads, approaches and huddle preferences rather than
   // fitting the policy to outcomes. Every fourth bout uses a matched live
   // psychology-off replay, without settling that counterfactual in career.
   const structures=S.STRUCTURES.catalogue(),choice={id:pick(structures,i+seed).id,lead:i%2?'f':'w'};
   const approach=pick(['story','technical','safe','brawl','spots'],i+seed);
   const banks=promoBanks(root.OfficePromoIdentity.bankId(w),root.OfficePromoIdentity.bankId(f));
   function planRoom(policy,resume,adaptive=false,continuationVersion=undefined){
   let st=R.begin(c,w,f,G.P(c.pid),{structure:choice,structurePlanning:true,planningCareer:G.S,planningInitiative:true,planningProposal:true,planningDialogue:true,planningBanks:banks,planningBargaining:true,planningSequences:true,planningSequencePolicy:policy,planningAdaptiveEntries:adaptive,planningSequenceSigning:true,planningContinuationVersion:continuationVersion,
    recent:G.S.roomRecent||[],threads:R.liveThreads(G.S.roomThreads,c.eventAbs??G.abs()),heat:G.feud(w.id,f.id)?.heat||0,rehearsed:G.rehearsed(w)});
   assert.ok(st.planningEvidence&&st.planningDialogue&&st.planningSequenceSigning,key+' full planning policy active');
   const prior=st.planningEvidence.participants.w.relationship.professional;
   if(prior){assert.ok(range(prior.score));assert.ok(prior.entries.every(e=>e.cid!==c.id&&e.abs<c.eventAbs));}
   const actions=[];let roomResume=0,sequenceOffer=0;const sequencePolicy=i%3!==0;
   for(let n=0;n<60&&st.stage!=='done';n++){
    const options=R.options(st),take=id=>options.find(o=>o.id===id);
    assert.ok(options.length,key+' available room choice');
    let option;
    if(st.stage==='plan')option=take('plan_'+approach);
    else if(st.stage==='board'){
     const bad=st.structure.objectives.map(obj=>{
      const b=st.structureBoard?.[obj.id];
      if(!b?.action&&!b?.sequence)return null;
      const named=!!b.action&&(b.conflict||R.banned(st,b.action)||!R.legal(b.action,st[b.owner],st[b.owner==='w'?'f':'w']));
      const setup=!!b.sequence&&!R.agreedSequence(st,obj);
      return named||setup?{obj,named,setup}:null;
     }).find(Boolean);
     option=bad?take('objective_'+bad.obj.id+(bad.named?'_open':'_drop_sequence')):take('board_ok');
     if(bad)reviewRepairs.push({key,policy,adaptive,continuationVersion:continuationVersion||0,objective:bad.obj.id,choice:option?.id});
    }else if(st.stage==='review')option=take('review_ok')||take('review_edit');
    else if(st.stage==='curtain')option=take('talk_none')||options[0];
    else if(st.queue[st.at]==='structure_huddle'){
     if(take('hear_sequence')||take('use_sequence'))sequenceOffer=1;
     // A sequence-aware manager hears real offers before deciding. Rotate
     // through sequence-first, counter-first and single-call policies.
     option=(sequencePolicy&&(take('use_sequence')||(i%3===2&&take('hear_counter'))||take('hear_sequence')||take('hear_counter')))||take(pick(['keep','revise','open'],i+seed))||take('open')||options[0];
    }
    else if(st.queue[st.at]==='structure_objection')option=take('replace')||take('open')||options[0];
    else option=pick(options,i+n+seed);
    assert.ok(option,key+' chosen room option');actions.push(option.id);
    if(resume&&!roomResume&&i%5===0&&st.stage==='scene'){
     const restored=copy(st);eq(R.options(restored),options,key+' resumed choices');
     for(const side of ['w','f'])eq(F.behaviour(restored.planningEvidence,restored,side),F.behaviour(st.planningEvidence,st,side),key+' resumed inference');
     R.act(st,option.id);R.act(restored,option.id);eq(st,restored,key+' resumed negotiation');st=restored;roomResume=1;
    }else R.act(st,option.id);
   }
   assert.equal(st.stage,'done',key+' room terminated');assert.ok(st.sheet.signed);
   assert.ok(S.STRUCTURES.executionChoice(st.sheet,choice));
   assert.ok(range(st.sheet.workerConsent)&&range(st.sheet.opponentConsent));
   return {st,prior,actions,roomResume,sequenceOffer};
   }
   const {st,prior,actions,roomResume,sequenceOffer}=planRoom(3,true,true,1);
   const continuationRoom=i%3!==0?planRoom(3,false,true):null;
   const controlRoom=i%3!==0?planRoom(2,false):null;
   const baselineRoom=i%3!==0?planRoom(3,false,false):null;
   G.S.roomRecent=[...(G.S.roomRecent||[]),...st.queue].slice(-6);
   let promo=null,promoResume=0;
   const arcChoices=root.OfficeProgrammeArcs?.options(c)?.choices||[];
   const arcChoice=arcChoices.length?pick(arcChoices,i).id:null;
   if(root.OfficeSigning?.eligible(c)){
    const signing=root.OfficeSigning.begin(c,w,f,G.P(c.pid));
    for(const r of root.OfficeSigning.ROUNDS)root.OfficeSigning.choose(signing,pick(r.options,i+seed).id);
    promo=root.OfficeSigning.result(signing);
   }else if(!st.sheet.skipPromo){
    let mic=Mic.begin(c,w,f,G.feud(w.id,f.id),st.sheet,G.P(c.pid),{arc:root.OfficeProgrammeArcs?.intro(c,arcChoice),directed:true,formats:true,dialogue:true,authored:true,banks,composition:true,semantic:true,fuzzy:true,fuzzyEmotion:true,fuzzyPacing:true,fuzzyAudience:true,fuzzyBalance:true});
    for(let n=0;n<80&&mic.stage!=='done';n++){
     const options=Mic.choices(mic),option=pick(options,i+n+seed);
     assert.ok(option,key+' promo options');
     if(!promoResume&&i%5===0&&n===1){
      const resumed=copy(mic);eq(Mic.choices(resumed),options,key+' promo resume choices');
      Mic.choose(mic,option.id);Mic.choose(resumed,option.id);eq(mic,resumed,key+' resumed promo');mic=resumed;promoResume=1;
     }else Mic.choose(mic,option.id);
    }
    assert.equal(mic.stage,'done',key+' promo terminated');promo=Mic.result(mic);
   }
   root.OfficeProgrammeArcs?.prepare(c,arcChoice,promo);
   const sheet=R.addVow(st.sheet,promo,w,f,c.finish);
   assert.ok(S.STRUCTURES.executionChoice(sheet,choice));
   eq(sheet.structurePlan,st.sheet.structurePlan,key+' promo cannot rewrite signed structure');
   const preparation={...w.prep},focus=D.TRAINING[w.training]?.stat;
   if(focus&&!w.injury)preparation[focus]=(preparation[focus]||0)+(w.intensity==='hard'?2:w.intensity==='standard'?1.5:.6);
   const trainingFatigue=['rest','promo'].includes(w.training)?0:w.program?.type==='camp'?8:w.intensity==='hard'?15:w.intensity==='standard'?5:0;
   const options={w:{...w,fatigue:G.clamp(w.fatigue+trainingFatigue)},f,p:G.P(c.pid),slot:c.slot,minutes:sheet.minutes,finish:c.finish,stip:c.stip||null,feudHeat:Math.max(c.feudHeat||0,G.feud(w.id,f.id)?.heat||0),blowoff:c.blowoff,promo,plan:{game:sheet.game,leash:sheet.leash,talk:sheet.talk},preparation,flags:{...w.flags,...sheet.flags},memory:Mem.context(w.id,f.id),sheet,structureExecution:true,sequenceTimingVersion:1,sequenceDependencyVersion:1,sequenceHandoverVersion:1,sequenceRecoveryProjectionVersion:1,identity:G.normaliseIdentity(G.S.identity),seed:Math.floor(random()*2**31)||1};
   const immutable=copy(sheet.structurePlan),callIds=Object.keys(E.CALLS).filter(x=>!['home'].includes(x));
   function drive(active,resume,settings=options,expectedPlan=immutable,traceActual=false){
    let M=E.create({...copy(settings),livePsychologyVersion:active?1:undefined}),matchResume=0,liveScores=[],calls=0;
    const trace=traceActual?continuation.trace(root,key,true):null;trace?.track(M);
    try{
    for(let n=0;n<10000&&!M.done;n++){
     if(M.decision&&!M.queue.length){const opts=M.decision.options;E.resolve(M,pick(opts,i+seed+calls).id);}
     if(M.stage==='live'&&!M.decision&&calls<2&&M.t>=M.len*(calls?.65:.3)){
      const id=pick(callIds,i+calls);
      if(E.canCall(M,id)){E.call(M,id);calls++;}
     }
     if(M.stage==='live'&&liveScores.length<3&&M.t>=M.len*(liveScores.length+1)/4&&active){
      const q=E.livePsychology(M,'w');assert.ok(q&&Object.values(q.scores).every(x=>range(x)));liveScores.push(copy(q.scores));
     }
     if(resume&&!matchResume&&M.stage==='live'&&M.t>=M.len*.35){
      const saved=copy({...M,rState:M.r.getState()}),restored=E.restore(saved);
      const a=E.next(M),b=E.next(restored);eq(a??null,b??null,key+' resumed next commentary');
      // Mulberry state is a 32-bit bit pattern; restored seeds can be unsigned.
      assert.equal(M.r.getState()>>>0,restored.r.getState()>>>0,key+' resumed RNG bit pattern');assert.equal(M.wSt,restored.wSt,key+' resumed worker stamina');assert.equal(M.fSt,restored.fSt,key+' resumed opponent stamina');M=restored;trace?.track(M);matchResume=1;
     }else E.next(M);
    }
    assert.ok(M.done&&M.final,key+' completed real bout');
    if(settings.structureExecution)eq(M.o.sheet.structurePlan,expectedPlan,key+' original agreement unchanged');
    assert.equal(M.o.finish,c.finish,key+' booked finish unchanged');
    if(settings.structureExecution)assert.equal(M.final.structure.id,choice.id);else assert.equal(M.final.structure,undefined);
    assert.ok(range(M.final.stars,0,5)&&range(M.final.crowd));
    const traceReport=trace?trace.close(M):null;
    if(traceActual===true){continuationRecords.push(...traceReport.records);openingRecords.push(...traceReport.openings);dependencyWitnesses.push(...traceReport.dependencyWitnesses);}
    return {M,fin:M.final,matchResume,liveScores,traceReport};
    }finally{trace?.restore();}
   }
   const actual=drive(true,i%5===0,options,immutable,true);
   const {M,fin,matchResume,liveScores}=actual,report=fin.structure;
   if(report.sequences?.some(r=>r.attempts>0)&&!traceVerified.has(choice.id)){
    const control=drive(true,i%5===0);
    eq(fin,control.fin,key+' audit trace does not change final result');eq(M.graph,control.M.graph,key+' audit trace does not change graph');
    assert.equal(M.r.getState()>>>0,control.M.r.getState()>>>0,key+' audit trace does not change RNG');traceVerified.add(choice.id);
   }
   if(i%4===0){
    const control=drive(false,false).fin;
    comparisons.push({key,structure:choice.id,approach,starDelta:fin.stars-control.stars,crowdDelta:fin.crowd-control.crowd,ignoredDelta:fin.ignored-control.ignored,injuryDelta:Number(!!fin.injury)-Number(!!control.injury),outcome:[control.outcome,fin.outcome],sameSeed:options.seed});
   }
   // Same booking, wrestlers, promo result, approach and seed, but a
   // separately negotiated traditional sheet. No counterfactual settles.
   if(i%4===1){
    const legacy=R.begin(c,w,f,G.P(c.pid),{recent:G.S.roomRecent||[],threads:R.liveThreads(G.S.roomThreads,c.eventAbs??G.abs()),heat:G.feud(w.id,f.id)?.heat||0,rehearsed:G.rehearsed(w)});
    for(let n=0;n<60&&legacy.stage!=='done';n++){
     const opts=R.options(legacy),preferred={plan:'plan_'+approach,board:'board_ok',review:'review_ok',curtain:'talk_none'}[legacy.stage];
     const selected=opts.find(o=>o.id===preferred)||pick(opts,i+n+seed);assert.ok(selected,key+' traditional choice');
     R.act(legacy,selected.id);
    }
    assert.ok(legacy.sheet?.signed,key+' signed traditional sheet');
    const ls=R.addVow(legacy.sheet,promo,w,f,c.finish);
    const baseline=drive(false,false,{...options,sheet:ls,minutes:ls.minutes,plan:{game:ls.game,leash:ls.leash,talk:ls.talk},flags:{...w.flags,...ls.flags},structureExecution:false}).fin;
    traditional.push({key,structure:choice.id,approach,structuredStars:fin.stars,traditionalStars:baseline.stars,starDelta:fin.stars-baseline.stars,crowdDelta:fin.crowd-baseline.crowd,outcome:[baseline.outcome,fin.outcome]});
   }
   const sequences=report.sequences||[],receipts=sequences.map(s=>s.receipt).filter(Boolean);
   if(controlRoom){
    const old=R.addVow(controlRoom.st.sheet,promo,w,f,c.finish);
    const baseline=drive(true,false,{...options,sheet:old,minutes:old.minutes,plan:{game:old.game,leash:old.leash,talk:old.talk},flags:{...w.flags,...old.flags},sequenceTimingVersion:undefined},copy(old.structurePlan)).fin;
    const count=(fin,layout)=>{
     const seq=fin.structure.sequences||[],receipts=seq.map(x=>x.receipt).filter(Boolean);
     return {signed:seq.length,completed:receipts.filter(x=>['completed','adapted'].includes(x.status)).length,noOpening:receipts.filter(x=>x.status==='missed'&&!x.attempts).length,stars:fin.stars,crowd:fin.crowd,injury:Number(!!fin.injury),outcome:fin.outcome,entries:layout.objectives.filter(x=>x.sequence).map(x=>x.sequence.start.position)};
    };
    feasibilityPairs.push({key,structure:choice.id,before:count(baseline,old.structurePlan),after:count(fin,sheet.structurePlan)});
   }
   if(baselineRoom){
    const old=R.addVow(baselineRoom.st.sheet,promo,w,f,c.finish);
    const base=drive(true,false,{...options,sheet:old,minutes:old.minutes,plan:{game:old.game,leash:old.leash,talk:old.talk},flags:{...w.flags,...old.flags}},copy(old.structurePlan)).fin;
    const count=(fin,layout)=>{const rs=(fin.structure.sequences||[]).map(x=>x.receipt).filter(Boolean);return {
     signed:rs.length,completed:rs.filter(x=>['completed','adapted'].includes(x.status)).length,adapted:rs.filter(x=>x.status==='adapted').length,
     alternativeDelivered:rs.filter(x=>x.status==='adapted'&&x.witnessed.some(e=>e.opening)).length,noOpening:rs.filter(x=>x.status==='missed'&&!x.attempts).length,
     withAlternatives:layout.objectives.filter(x=>x.sequence?.openings?.length).length,stars:fin.stars,injury:Number(!!fin.injury),outcome:fin.outcome};};
    adaptivePairs.push({key,structure:choice.id,before:count(base,old.structurePlan),after:count(fin,sheet.structurePlan)});
   }
   if(continuationRoom){
    const old=R.addVow(continuationRoom.st.sheet,promo,w,f,c.finish);
    const baseline=drive(true,false,{...options,sheet:old,minutes:old.minutes,plan:{game:old.game,leash:old.leash,talk:old.talk},flags:{...w.flags,...old.flags}},copy(old.structurePlan)).fin;
    const count=x=>{const rs=(x.structure.sequences||[]).map(s=>s.receipt).filter(Boolean);return {
     signed:rs.length,opened:rs.filter(r=>r.attempts>0).length,completed:rs.filter(r=>['completed','adapted'].includes(r.status)).length,
     attempts:rs.reduce((n,r)=>n+r.attempts,0),interruptions:rs.reduce((n,r)=>n+r.interruptions,0),
     objectives:x.structure.objectives.filter(o=>['achieved','adapted'].includes(o.status)).length,
     stars:x.stars,crowd:x.crowd,injury:Number(!!x.injury),outcome:x.outcome};};
    continuationPairs.push({key,structure:choice.id,before:count(baseline),after:count(fin)});
   }
   if(sequences.length){
    // Identical signed sheet, room/promo decisions, workers, seed,
    // and manager-call policy; only the new live weighting differs.
    const baseline=drive(true,i%5===0,{...options,sequenceDependencyVersion:undefined,sequenceHandoverVersion:undefined},immutable,'comparison');
    const base=baseline.fin;
    // Independently compare the newly traced baseline with an untraced
    // identical replay for one bout per structure.
    if(!dependencyTraceVerified.has(choice.id)){
     const plain=drive(true,i%5===0,{...options,sequenceDependencyVersion:undefined,sequenceHandoverVersion:undefined},immutable);
     eq(base,plain.fin,key+' dependency baseline trace neutrality');
     eq(baseline.M.graph,plain.M.graph,key+' dependency baseline graph neutrality');
     assert.equal(baseline.M.r.getState()>>>0,plain.M.r.getState()>>>0,key+' dependency baseline RNG neutrality');
     dependencyTraceVerified.add(choice.id);
    }
    const beforeTrace=baseline.traceReport,afterTrace=actual.traceReport;
    const describe=(v,trace)=>{
     const s=continuation.summariseOpenings([v]),ticks=v.ticks;
     const stage=Object.keys(s.firstEmptyStage)[0]||null;
     const guards=['before_window','after_window','finish_runway','safety_or_manager_request','prerequisite_pending'];
     const available=ticks.filter(t=>t.candidates.some(c=>!c.guards.some(g=>guards.includes(g))));
     const matching=available.filter(t=>t.candidates.some(c=>!c.guards.some(g=>[...guards,'wrong_control','wrong_position_or_down'].includes(g))));
     const ready=matching.filter(t=>t.candidates.some(c=>!c.guards.length));
     const snap=t=>t?{at:t.at,stamina:t.stamina,position:t.position,control:t.control,candidates:t.candidates}:null;
     return {status:v.final.status,attempts:v.final.attempts,stage,prerequisites:v.prerequisites,matchSeconds:v.duration,
      eligibleTicks:available.length,matchingTicks:matching.length,readyTicks:ready.length,offers:ticks.filter(t=>t.offered).length,
      firstEligible:snap(available[0]),firstMatching:snap(matching[0]),lastMatching:snap(matching.at(-1)),
      natural:v.natural.slice(0,3),attemptsDetail:trace.records.filter(r=>r.objective===v.objective).map(r=>({openedAt:r.openedAt,terminal:r.terminal.kind}))};
    };
    for(const v of afterTrace.openings){
     const b=beforeTrace.openings.find(x=>x.objective===v.objective);
     assert.ok(b,key+' identical signed objective in trace');
     eq(b.actions,v.actions,key+' identical signed action chain');
     const complete=x=>['completed','adapted'].includes(x.final.status);
     const achieved=x=>x.prerequisites.some(p=>['achieved','adapted'].includes(p.status));
     if(complete(b)!==complete(v)||!!b.final.attempts!==!!v.final.attempts||achieved(b)!==achieved(v)){
      dependencyDetails.push({key,structure:choice.id,objective:v.objective,actions:v.actions,window:v.window,
       before:describe(b,beforeTrace),after:describe(v,afterTrace)});
     }
    }
    const count=x=>{const rs=(x.structure.sequences||[]).map(s=>s.receipt).filter(Boolean);
     const os=x.structure.objectives,layout=sheet.structurePlan.objectives;
     const predecessors=new Set(layout.filter(o=>o.sequence).flatMap(o=>o.requires));
     return {signed:rs.length,opened:rs.filter(r=>r.attempts>0).length,
      completed:rs.filter(r=>['completed','adapted'].includes(r.status)).length,
      interruptions:rs.reduce((n,r)=>n+r.interruptions,0),
      objectives:os.filter(o=>['achieved','adapted'].includes(o.status)).length,
      prerequisiteAchieved:os.filter(o=>predecessors.has(o.id)&&['achieved','adapted'].includes(o.status)).length,
      stars:x.stars,crowd:x.crowd,injury:Number(!!x.injury),outcome:x.outcome};};
    dependencyPairs.push({key,structure:choice.id,before:count(base),after:count(fin)});
    const dependencyOnly=drive(true,i%5===0,{...options,sequenceHandoverVersion:undefined},immutable).fin;
    handoverPairs.push({key,structure:choice.id,main:count(base),dependencyOnly:count(dependencyOnly),combined:count(fin)});
    // Keep the settled career and all historical controls on main's
    // policy. A separate replay changes ONLY the proactive pacing flag.
    const paced=drive(true,i%5===0,{...options,sequenceRecoveryPacingVersion:1},immutable,'comparison');
    pacingOffers.push(...paced.traceReport.recoveryOffers);
    const breakdown=trace=>{
     const diag=continuation.summariseOpenings(trace.openings);
     const cases=trace.openings.filter(v=>!v.final.attempts).map(v=>{
      const only=v.ticks.flatMap(t=>t.candidates.filter(c=>c.guards.length&&c.guards.every(g=>['chain_too_early','chain_stamina','other_readiness'].includes(g))));
      return {objective:v.objective,types:[...new Set(only.flatMap(c=>c.guards))]};
     }).filter(x=>x.types.length);
     return {readinessMiss:diag.firstEmptyStage.chain_ready||0,staminaCases:cases.filter(x=>x.types.includes('chain_stamina')).length,
      timingCases:cases.filter(x=>x.types.includes('chain_too_early')).length};
    };
    const restCount=x=>x.M.graph.events.filter(e=>e.id==='catch_breath'||E.GRAPH.A[e.id]?.family==='rest'&&E.GRAPH.costOf(e.id)<0).length;
    pacingPairs.push({key,structure:choice.id,before:{...count(fin),...breakdown(actual.traceReport),rests:restCount(actual)},after:{...count(paced.fin),...breakdown(paced.traceReport),rests:restCount(paced),offers:paced.traceReport.recoveryOffers.length,landed:paced.traceReport.recoveryOffers.filter(x=>x.landed).length}});
    // Both arms use the now-merged pacing policy. Only replay bouts
    // with signed alternatives; other bouts are structurally unaffected.
    const hasAlternatives=sheet.structurePlan.objectives.some(o=>o.sequence?.version===2);
    const alt=hasAlternatives?drive(true,i%5===0,{...options,sequenceRecoveryPacingVersion:1,sequenceAlternativeReadinessVersion:1},immutable,'comparison'):paced;
    const measure=x=>({...count(x.fin),...breakdown(x.traceReport),
     alternativeLandings:(x.fin.structure.sequences||[]).flatMap(r=>r.receipt?.witnessed||[]).filter(e=>e.opening).length,
     opportunities:x.traceReport.alternativeReadinessOffers.length,
     offered:x.traceReport.alternativeReadinessOffers.filter(v=>v.ready.includes(v.offered)).length,
     credited:x.traceReport.alternativeReadinessOffers.filter(v=>v.credited).length});
    alternativePairs.push({key,structure:choice.id,hasAlternatives,before:measure(paced),after:measure(alt)});
    alternativeOpportunities.push(...alt.traceReport.alternativeReadinessOffers);
    // Reuse the currently shipped MP13F.8A policy replay. No extra bouts,
    // experimental timing weights or changes to settled career outcomes.
    const temporal=continuation.temporalCases(alt.traceReport);
    assert.equal(temporal.length,breakdown(alt.traceReport).timingCases,key+' timing cases reconcile');
    temporalCases.push(...temporal);
    // If no request was accepted in the control bout, the new policy
    // cannot alter anything before the first acceptance. Reuse that result.
    const relevant=(alt.fin.ringsideEvidence||[]).some(e=>e.id==='big');
    const arbitrated=relevant?drive(true,i%5===0,{...options,sequenceRecoveryPacingVersion:1,sequenceAlternativeReadinessVersion:1,bigSpotArbitrationVersion:3},immutable,'comparison'):alt;
    const measureArbitration=x=>{
     const calls=(x.fin.ringsideEvidence||[]).filter(e=>e.id==='big');
     const blocked=continuation.temporalCases(x.traceReport).filter(c=>c.variants.some(v=>v.counts.early&&v.stage==='safety_or_runway'&&v.safetyBreakdown.flagTicks.pending_big_spot));
     const durations=calls.map(e=>Math.max(0,(e.atAction??e.atEnd??x.fin.len)-e.at));
     return {...measure(x),accepted:calls.length,witnessed:calls.filter(e=>e.status==='witnessed').length,
      botched:calls.filter(e=>e.status==='botched').length,refunded:calls.filter(e=>e.status==='unavailable').length,
      maxWait:Math.max(0,...durations),bigSpotBlocked:blocked.length,ignored:x.fin.ignored,spent:x.fin.callsUsed.length};
    };
    arbitrationPairs.push({key,structure:choice.id,relevant,before:measureArbitration(alt),after:measureArbitration(arbitrated)});
    // Reuse both existing replay arms. The after arm is now shipped
    // F.9C; no additional replays or engine changes.
    const beforeStamina=continuation.staminaCases(alt.traceReport),afterStamina=continuation.staminaCases(arbitrated.traceReport);
    assert.equal(beforeStamina.length,breakdown(alt.traceReport).staminaCases,key+' original stamina cases reconcile');
    assert.equal(afterStamina.length,breakdown(arbitrated.traceReport).staminaCases,key+' current stamina cases reconcile');
    if(beforeStamina.length||afterStamina.length)staminaPairs.push({key,before:beforeStamina,after:afterStamina});
    expenditure.push(...continuation.staminaExpenditure(arbitrated.traceReport,afterStamina));
    // Reuse the asymmetric production-policy control. The equal-1 arm
    // isolates equalization; the remaining arms also reduce shared debit.
    const routineOptions={...options,sequenceRecoveryPacingVersion:1,sequenceAlternativeReadinessVersion:1,bigSpotArbitrationVersion:3};
    const arms={'1':routineMetrics(arbitrated,E,measureArbitration,restCount)};
    for(const factor of routineFactors.slice(1)){
     root.__mp13RoutineMultiplier=factor==='equal-1'?1:factor;
     try{
      const replay=drive(true,i%5===0,routineOptions,immutable,'comparison');
      const metric=routineMetrics(replay,E,measureArbitration,restCount);
      assert.equal(metric.signed,arms['1'].signed,key+' drain cannot rewrite agreements');
      assert.equal(metric.startW,arms['1'].startW,key+' same starting worker energy');
      assert.equal(metric.startF,arms['1'].startF,key+' same starting opponent energy');
      assert.equal(metric.accepted,metric.witnessed+metric.botched+metric.refunded,key+' manager requests resolved');
      if(factor===0)assert.ok(metric.routineSpent<1e-7,key+' zero routine debit control');
      arms[String(factor)]=metric;
     }finally{delete root.__mp13RoutineMultiplier;}
    }
    const fatigue=arms['1'].fatigueW;
    routinePairs.push({key,structure:choice.id,plan:approach,fatigueBand:fatigue>=75?'high':fatigue>=25?'moderate':'low',arms});
   }
   for(const r of receipts){
    assert.equal(r.v,1);assert.ok(r.witnessed.length<=r.planned.length);
    for(const e of r.witnessed)assert.ok(M.graph.events.some(ev=>ev.id===e.id&&ev.t===e.at),key+' actual graph receipt');
   }
   assert.ok(report.objectives.every(o=>o.status!=='pending'));
   const spoken=st.log.filter(x=>x.text&&['w','f'].includes(x.side)).map(x=>x.side+'|'+x.text.toLowerCase());
   rows.push({key,seed,week:c.eventAbs,wid:w.id,rid:f.id,structure:choice.id,approach,lead:choice.lead,
    stars:fin.stars,crowd:fin.crowd,outcome:fin.outcome,injury:Number(!!fin.injury),shortened:Number(!!fin.shortened),botches:fin.botches,calls:fin.callsUsed.length,ignored:fin.ignored,
    consent:sheet.workerConsent,opponentConsent:sheet.opponentConsent,objectives:report.objectives.length,witnessed:report.objectives.filter(x=>['achieved','adapted'].includes(x.status)).length,
    named:fin.structureAssessment.planAdherence.namedCalls,landed:fin.structureAssessment.planAdherence.witnessedCalls,
    sequenceOffer,sequenceHeard:Number(actions.includes('hear_sequence')),sequenceSelected:Number(actions.includes('use_sequence')),sequences:sequences.length,exact:receipts.filter(r=>r.status==='completed').length,adapted:receipts.filter(r=>r.status==='adapted').length,missed:receipts.filter(r=>r.status==='missed').length,
    protected:receipts.filter(r=>r.protectedExit).length,noOpening:receipts.filter(r=>r.status==='missed'&&!r.attempts).length,noReceipt:sequences.length-receipts.length,priorProfessional:Number(!!prior),negotiation:sheet.structureDiscussion?.decision||null,
    reconciliation:sheet.promoReconciliation?.status||null,academy:Number([w.id,f.id].some(id=>id.startsWith('academy-'))),
    roomResume,matchResume,promoResume,liveScores,spokenLines:spoken.length,repeatLines:spoken.length-new Set(spoken).size});
   // Outer world loop applies this real result once through all career wrappers.
   return {...fin,log:M.log.slice()};
  };
  const result=play(seed,weeks,root=>{
   const G=root.OfficeGame,apply=G.applyResult;
   G.applyResult=function(c,fin){
    const result=apply(c,fin);
    if(!fin.structure)return result;
    const h=G.S.history.find(x=>x.cid===c.id);assert.ok(h,'real result archived');
    const before=copy(G.S.officeMemory.professionalPairs||{}),career=root.OfficeMemory.professionalContext(G.S,c.wid,c.rid);
    if(career){assert.ok(range(career.score));assert.equal(new Set(career.entries.map(x=>x.cid)).size,career.entries.length);}
    apply(c,fin);eq(G.S.officeMemory.professionalPairs||{},before,'duplicate result does not duplicate professional memory');
    return result;
   };
  },real,routineSource);
  assert.deepEqual(result.problems,[],'career invariant failures: '+result.problems.join('; '));
  careers.push({seed,...result.stats});
 }
 const groups=key=>Object.fromEntries([...new Set(rows.map(r=>r[key]))].map(k=>[k,summarise(rows.filter(r=>r[key]===k))]));
 return {schema:'office-mp13-career-audit-v1',seeds,weeks,careers,routineDrainAudit:summarizeRoutine(routinePairs),overall:summarise(rows),byStructure:groups('structure'),byApproach:groups('approach'),byCohort:groups('academy'),
  matchedLive:{pairs:comparisons.length,meanStarDelta:avg(comparisons.map(x=>x.starDelta)),meanCrowdDelta:avg(comparisons.map(x=>x.crowdDelta)),meanIgnoredDelta:avg(comparisons.map(x=>x.ignoredDelta)),changedOutcomes:comparisons.filter(x=>x.outcome[0]!==x.outcome[1]).length,comparisons},matchedTraditional:{pairs:traditional.length,meanStructuredStars:avg(traditional.map(x=>x.structuredStars)),meanTraditionalStars:avg(traditional.map(x=>x.traditionalStars)),meanStarDelta:avg(traditional.map(x=>x.starDelta)),meanCrowdDelta:avg(traditional.map(x=>x.crowdDelta)),changedOutcomes:traditional.filter(x=>x.outcome[0]!==x.outcome[1]).length,comparisons:traditional},matchedFeasibility:(()=>{
   const summarize=side=>{const xs=feasibilityPairs.map(x=>x[side]),entries={};for(const x of xs)for(const e of x.entries)inc(entries,e);
    return {signed:xs.reduce((n,x)=>n+x.signed,0),completed:xs.reduce((n,x)=>n+x.completed,0),noOpening:xs.reduce((n,x)=>n+x.noOpening,0),stars:avg(xs.map(x=>x.stars)),crowd:avg(xs.map(x=>x.crowd)),injuries:xs.reduce((n,x)=>n+x.injury,0),entries};};
   const both=feasibilityPairs.filter(x=>x.before.signed&&x.after.signed);
   return {pairs:feasibilityPairs.length,before:summarize('before'),after:summarize('after'),bothSigned:both.length,bothCompletedBefore:both.reduce((n,x)=>n+x.before.completed,0),bothCompletedAfter:both.reduce((n,x)=>n+x.after.completed,0),changedOutcomes:feasibilityPairs.filter(x=>x.before.outcome!==x.after.outcome).length,comparisons:feasibilityPairs};
  })(),matchedAdaptive:(()=>{
   const summarize=side=>{const xs=adaptivePairs.map(x=>x[side]);return {...Object.fromEntries(['signed','completed','adapted','alternativeDelivered','noOpening','withAlternatives','injury'].map(k=>[k,xs.reduce((n,x)=>n+x[k],0)])),stars:avg(xs.map(x=>x.stars))};};
   return {pairs:adaptivePairs.length,before:summarize('before'),after:summarize('after'),changedOutcomes:adaptivePairs.filter(x=>x.before.outcome!==x.after.outcome).length,comparisons:adaptivePairs};
  })(),matchedContinuation:(()=>{
   const summarize=side=>{const xs=continuationPairs.map(x=>x[side]);return {...Object.fromEntries(['signed','opened','completed','attempts','interruptions','objectives','injury'].map(k=>[k,xs.reduce((n,x)=>n+x[k],0)])),stars:avg(xs.map(x=>x.stars)),crowd:avg(xs.map(x=>x.crowd))};};
   return {pairs:continuationPairs.length,before:summarize('before'),after:summarize('after'),changedOutcomes:continuationPairs.filter(x=>x.before.outcome!==x.after.outcome).length,comparisons:continuationPairs};
  })(),matchedDependency:(()=>{
   const sum=xs=>({...Object.fromEntries(['signed','opened','completed','interruptions','objectives','prerequisiteAchieved','injury'].map(k=>[k,xs.reduce((n,x)=>n+x[k],0)])),stars:avg(xs.map(x=>x.stars)),crowd:avg(xs.map(x=>x.crowd))});
   const compare=pairs=>({pairs:pairs.length,before:sum(pairs.map(x=>x.before)),after:sum(pairs.map(x=>x.after)),changedOutcomes:pairs.filter(x=>x.before.outcome!==x.after.outcome).length});
   return {...compare(dependencyPairs),byStructure:Object.fromEntries([...new Set(dependencyPairs.map(x=>x.structure))].map(k=>[k,compare(dependencyPairs.filter(x=>x.structure===k))])),
    traceVerified:[...dependencyTraceVerified],witnessedProgress:dependencyWitnesses.length,witnessedPrerequisiteCompletions:dependencyWitnesses.filter(x=>x.completed).length,examples:dependencyWitnesses.filter(x=>x.completed).slice(0,4),
    transitions:(()=>{
     const done=x=>['completed','adapted'].includes(x.status),earned=x=>x.prerequisites.some(p=>['achieved','adapted'].includes(p.status));
     const groups={lostCompletion:dependencyDetails.filter(x=>done(x.before)&&!done(x.after)),gainedCompletion:dependencyDetails.filter(x=>!done(x.before)&&done(x.after)),
      lostOpening:dependencyDetails.filter(x=>x.before.attempts&&!x.after.attempts),gainedOpening:dependencyDetails.filter(x=>!x.before.attempts&&x.after.attempts),
      gainedPrerequisiteButUnopened:dependencyDetails.filter(x=>!earned(x.before)&&earned(x.after)&&!x.after.attempts)};
     return Object.fromEntries(Object.entries(groups).map(([k,xs])=>[k,{count:xs.length,afterStages:xs.reduce((o,x)=>(o[x.after.stage||x.after.status]=(o[x.after.stage||x.after.status]||0)+1,o),{}),
      examples:xs.slice(0,5).map(x=>({key:x.key,structure:x.structure,objective:x.objective,actions:x.actions,
       before:{status:x.before.status,stage:x.before.stage,prerequisites:x.before.prerequisites.map(p=>({status:p.status,at:p.at})),eligibleTicks:x.before.eligibleTicks,matchingTicks:x.before.matchingTicks,readyTicks:x.before.readyTicks,offers:x.before.offers,matchSeconds:x.before.matchSeconds,firstMatching:x.before.firstMatching,lastMatching:x.before.lastMatching,attemptsDetail:x.before.attemptsDetail},
       after:{status:x.after.status,stage:x.after.stage,prerequisites:x.after.prerequisites.map(p=>({status:p.status,at:p.at})),eligibleTicks:x.after.eligibleTicks,matchingTicks:x.after.matchingTicks,readyTicks:x.after.readyTicks,offers:x.after.offers,matchSeconds:x.after.matchSeconds,firstMatching:x.after.firstMatching,lastMatching:x.after.lastMatching,attemptsDetail:x.after.attemptsDetail}}))}]));
    })(),details:dependencyDetails,comparisons:dependencyPairs};
  })(),matchedHandover:(()=>{
   const sum=(pairs,side)=>{const xs=pairs.map(x=>x[side]);return {...Object.fromEntries(['signed','opened','completed','interruptions','objectives','prerequisiteAchieved','injury'].map(k=>[k,xs.reduce((n,x)=>n+x[k],0)])),stars:avg(xs.map(x=>x.stars)),crowd:avg(xs.map(x=>x.crowd))};};
   const compare=pairs=>({pairs:pairs.length,main:sum(pairs,'main'),dependencyOnly:sum(pairs,'dependencyOnly'),combined:sum(pairs,'combined'),changedOutcomes:pairs.filter(x=>x.main.outcome!==x.combined.outcome||x.dependencyOnly.outcome!==x.combined.outcome).length});
   const offered=openingRecords.filter(v=>v.ticks.some(t=>t.handover));
   return {...compare(handoverPairs),byStructure:Object.fromEntries([...new Set(handoverPairs.map(x=>x.structure))].map(k=>[k,compare(handoverPairs.filter(x=>x.structure===k))])),
    handoverOffers:offered.reduce((n,v)=>n+v.ticks.filter(t=>t.handover).length,0),sequencesWithHandoverOffer:offered.length,
    openedAmongOffered:offered.filter(v=>v.final.attempts>0).length,completedAmongOffered:offered.filter(v=>['completed','adapted'].includes(v.final.status)).length,
    comparisons:handoverPairs};
  })(),reviewRepairs:{total:reviewRepairs.length,examples:reviewRepairs.slice(0,8)},matchedRecoveryPacing:(()=>{
   const sum=(pairs,side)=>{const xs=pairs.map(x=>x[side]);return {...Object.fromEntries(['signed','opened','completed','readinessMiss','staminaCases','timingCases','interruptions','objectives','injury','rests','offers','landed'].map(k=>[k,xs.reduce((n,x)=>n+(x[k]||0),0)])),stars:avg(xs.map(x=>x.stars)),crowd:avg(xs.map(x=>x.crowd))};};
   const compare=pairs=>({pairs:pairs.length,before:sum(pairs,'before'),after:sum(pairs,'after'),changedOutcomes:pairs.filter(x=>x.before.outcome!==x.after.outcome).length});
   return {...compare(pacingPairs),byStructure:Object.fromEntries([...new Set(pacingPairs.map(x=>x.structure))].map(k=>[k,compare(pacingPairs.filter(x=>x.structure===k))])),
    offers:pacingOffers.length,boosted:pacingOffers.filter(x=>x.boosted).length,landed:pacingOffers.filter(x=>x.landed).length,
    offerExamples:pacingOffers.filter(x=>x.landed).slice(0,8),
    examples:pacingPairs.filter(x=>x.before.completed!==x.after.completed||x.before.readinessMiss!==x.after.readinessMiss).slice(0,12),comparisons:pacingPairs};
  })(),matchedAlternativeReadiness:(()=>{
   const sum=(pairs,side)=>{const xs=pairs.map(x=>x[side]);return {...Object.fromEntries(['signed','opened','completed','readinessMiss','staminaCases','timingCases','interruptions','objectives','injury','alternativeLandings','opportunities','offered','credited'].map(k=>[k,xs.reduce((n,x)=>n+(x[k]||0),0)])),stars:avg(xs.map(x=>x.stars)),crowd:avg(xs.map(x=>x.crowd))};};
   const compare=pairs=>({pairs:pairs.length,before:sum(pairs,'before'),after:sum(pairs,'after'),changedOutcomes:pairs.filter(x=>x.before.outcome!==x.after.outcome).length});
   return {...compare(alternativePairs),withAlternatives:compare(alternativePairs.filter(x=>x.hasAlternatives)),
    byStructure:Object.fromEntries([...new Set(alternativePairs.map(x=>x.structure))].map(k=>[k,compare(alternativePairs.filter(x=>x.structure===k))])),
    opportunityExamples:alternativeOpportunities.slice(0,10),
    examples:alternativePairs.filter(x=>JSON.stringify(x.before)!==JSON.stringify(x.after)).slice(0,10),comparisons:alternativePairs};
  })(),matchedBigSpotArbitration:(()=>{
   const sum=(pairs,side)=>{const xs=pairs.map(x=>x[side]);return {...Object.fromEntries(['signed','opened','completed','readinessMiss','staminaCases','timingCases','interruptions','objectives','injury','accepted','witnessed','botched','refunded','bigSpotBlocked','ignored','spent'].map(k=>[k,xs.reduce((n,x)=>n+(x[k]||0),0)])),maxWait:Math.max(0,...xs.map(x=>x.maxWait)),stars:avg(xs.map(x=>x.stars)),crowd:avg(xs.map(x=>x.crowd))};};
   const compare=pairs=>({pairs:pairs.length,before:sum(pairs,'before'),after:sum(pairs,'after'),changedOutcomes:pairs.filter(x=>x.before.outcome!==x.after.outcome).length});
   return {...compare(arbitrationPairs),acceptedRequestBouts:compare(arbitrationPairs.filter(x=>x.relevant)),
    byStructure:Object.fromEntries([...new Set(arbitrationPairs.map(x=>x.structure))].map(k=>[k,compare(arbitrationPairs.filter(x=>x.structure===k))])),
    examples:arbitrationPairs.filter(x=>x.relevant).slice(0,15),comparisons:arbitrationPairs};
  })(),staminaExpenditureAudit:(()=>{
   const byCategory={},bySide={},byPlan={},byStructure={};
   for(const c of expenditure){
    if(c.noPure)continue;
    for(const side of c.deficitSides){
     const x=c.totals[side];
     const gross=Object.values(x.byCategory).reduce((n,r)=>n+r.spent,0);
     const recovered=Object.values(x.byCategory).reduce((n,r)=>n+r.recovered,0);
     const summarise=(dst,k)=>{
      const r=dst[k]??={samples:0,start:0,end:0,spent:0,recovered:0,routineSpent:0};
      r.samples++;r.start+=x.start;r.end+=x.end;r.spent+=gross;r.recovered+=recovered;r.routineSpent+=x.byCategory.routine?.spent||0;
     };
     summarise(bySide,side);summarise(byPlan,c.plan);summarise(byStructure,c.structure);
     for(const [category,row] of Object.entries(x.byCategory)){
      const total=byCategory[category]??={spent:0,recovered:0,writes:0};
      for(const k of ['spent','recovered','writes'])total[k]+=row[k];
     }
    }
   }
   return {total:expenditure.length,withPure:expenditure.filter(c=>!c.noPure).length,byCategory,bySide,byPlan,byStructure,cases:expenditure};
  })(),staminaOpportunityAudit:(()=>{
   const summarise=side=>{
    const cs=staminaPairs.flatMap(p=>p[side]),types={},closestPureTypes={},deficitBands={},byStructure={},byPlan={},deficitSides={},payoffs={};
    for(const c of cs){
     const variants=c.variants.filter(v=>v.counts.blocked);
     const pure=variants.map(v=>v.closestPure).filter(Boolean).sort((a,b)=>a.maxDeficit-b.maxDeficit)[0];
     for(const type of new Set(variants.flatMap(v=>Object.keys(v.counts.types))))inc(types,type);
     for(const side of new Set(variants.flatMap(v=>v.deficitSides)))inc(deficitSides,side);
     inc(byStructure,c.structure);inc(byPlan,c.plan);inc(payoffs,c.actions.at(-1));
     if(pure){
      inc(closestPureTypes,pure.type);
      inc(deficitBands,pure.maxDeficit<=2?'0–2':pure.maxDeficit<=5?'2–5':pure.maxDeficit<=10?'5–10':pure.maxDeficit<=20?'10–20':'>20');
     }
    }
    return {total:cs.length,staminaOnly:cs.filter(c=>c.staminaOnly).length,mixed:cs.filter(c=>c.mixed).length,
     anyReady:cs.filter(c=>c.anyReady).length,types,closestPureTypes,deficitBands,byStructure,byPlan,deficitSides,payoffs,
     withRecoveryOffer:cs.filter(c=>c.offers.length).length,withRecoveryLanding:cs.filter(c=>c.offers.some(o=>o.landed)).length,
     withRestInPrevious120:cs.filter(c=>c.variants.some(v=>Object.values(v.recoveryInPrevious120).some(n=>n>0))).length};
   };
   const before=staminaPairs.flatMap(p=>p.before),after=staminaPairs.flatMap(p=>p.after);
   const id=c=>c.key+'|'+c.objective;
   const b=new Set(before.map(id)),n=new Set(after.map(id));
   return {before:summarise('before'),after:summarise('after'),retained:after.filter(c=>b.has(id(c))).length,
    newlyAssociated:after.filter(c=>!b.has(id(c))).map(id),noLongerAssociated:before.filter(c=>!n.has(id(c))).map(id),pairs:staminaPairs};
  })(),temporalOpportunityAudit:(()=>{
   const stages={},safetyCases={},soleSafetyCases={};
   for(const c of temporalCases){
    const early=c.variants.filter(v=>v.counts.early>0);
    for(const stage of new Set(early.map(v=>v.stage)))inc(stages,stage);
    const blocked=early.filter(v=>v.stage==='safety_or_runway');
    for(const flag of new Set(blocked.flatMap(v=>Object.keys(v.safetyBreakdown.flagTicks))))inc(safetyCases,flag);
    for(const flag of new Set(blocked.flatMap(v=>Object.keys(v.safetyBreakdown.flagCombinations).filter(k=>!k.includes('+')))))inc(soleSafetyCases,flag);
   }
   return {total:temporalCases.length,timingOnly:temporalCases.filter(c=>c.timingOnly).length,mixed:temporalCases.filter(c=>c.mixed).length,
    anyReady:temporalCases.filter(c=>c.anyReady).length,earlyVariantStages:stages,safetyCases,soleSafetyCases,cases:temporalCases};
  })(),continuation:{...continuation.summarise(continuationRecords),traceVerified:[...traceVerified]},opening:continuation.summariseOpenings(openingRecords),rows};
}
module.exports={run};
if(require.main===module){const seeds=(process.argv[2]||'3,10,24,41').split(',').map(Number),weeks=Number(process.argv[3]||48);console.log(JSON.stringify(run(seeds,weeks),null,2));}
