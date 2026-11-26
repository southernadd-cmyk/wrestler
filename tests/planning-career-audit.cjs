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
function run(seeds=[3,10],weeks=32){
 const rows=[],careers=[],comparisons=[],traditional=[],feasibilityPairs=[],adaptivePairs=[],continuationRecords=[],traceVerified=new Set(),continuationPairs=[];
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
     const bad=Object.entries(st.structureBoard||{}).find(([,b])=>b?.action&&(b.conflict||R.banned(st,b.action)||!R.legal(b.action,st[b.owner],st[b.owner==='w'?'f':'w'])));
     option=bad?take('objective_'+bad[0]+'_open'):take('board_ok');
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
   const options={w:{...w,fatigue:G.clamp(w.fatigue+trainingFatigue)},f,p:G.P(c.pid),slot:c.slot,minutes:sheet.minutes,finish:c.finish,stip:c.stip||null,feudHeat:Math.max(c.feudHeat||0,G.feud(w.id,f.id)?.heat||0),blowoff:c.blowoff,promo,plan:{game:sheet.game,leash:sheet.leash,talk:sheet.talk},preparation,flags:{...w.flags,...sheet.flags},memory:Mem.context(w.id,f.id),sheet,structureExecution:true,sequenceTimingVersion:1,identity:G.normaliseIdentity(G.S.identity),seed:Math.floor(random()*2**31)||1};
   const immutable=copy(sheet.structurePlan),callIds=Object.keys(E.CALLS).filter(x=>!['home'].includes(x));
   function drive(active,resume,settings=options,expectedPlan=immutable,traceActual=false){
    let M=E.create({...copy(settings),livePsychologyVersion:active?1:undefined}),matchResume=0,liveScores=[],calls=0;
    const trace=traceActual?continuation.trace(root,key):null;trace?.track(M);
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
      assert.equal(M.r.getState()>>>0,restored.r.getState()>>>0,key+' resumed RNG bit pattern');M=restored;trace?.track(M);matchResume=1;
     }else E.next(M);
    }
    assert.ok(M.done&&M.final,key+' completed real bout');
    if(settings.structureExecution)eq(M.o.sheet.structurePlan,expectedPlan,key+' original agreement unchanged');
    assert.equal(M.o.finish,c.finish,key+' booked finish unchanged');
    if(settings.structureExecution)assert.equal(M.final.structure.id,choice.id);else assert.equal(M.final.structure,undefined);
    assert.ok(range(M.final.stars,0,5)&&range(M.final.crowd));
    if(trace)continuationRecords.push(...trace.close(M));
    return {M,fin:M.final,matchResume,liveScores};
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
  },real);
  assert.deepEqual(result.problems,[],'career invariant failures: '+result.problems.join('; '));
  careers.push({seed,...result.stats});
 }
 const groups=key=>Object.fromEntries([...new Set(rows.map(r=>r[key]))].map(k=>[k,summarise(rows.filter(r=>r[key]===k))]));
 return {schema:'office-mp13-career-audit-v1',seeds,weeks,careers,overall:summarise(rows),byStructure:groups('structure'),byApproach:groups('approach'),byCohort:groups('academy'),
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
  })(),continuation:{...continuation.summarise(continuationRecords),traceVerified:[...traceVerified]},rows};
}
module.exports={run};
if(require.main===module){const seeds=(process.argv[2]||'3,10,24,41').split(',').map(Number),weeks=Number(process.argv[3]||48);console.log(JSON.stringify(run(seeds,weeks),null,2));}
