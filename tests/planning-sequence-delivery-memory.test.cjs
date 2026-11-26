'use strict';
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');
const {root}=engine(81203);
const {OfficeGame:G,OfficeData:D,OfficeRoom:R,OfficeSheets:S,OfficeMatch:E,OfficePlanningFuzzy:F,OfficeRivalry:V}=root;
const A=E.GRAPH.A,graph=E.GRAPH,copy=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
G.fresh();G.S.cash=99999;G.S.rep=60;assert.equal(G.sign('rex'),null);
const w=G.W('rex'),f=G.F('silas'),p=G.P('dock');
const c={id:'mp8c-bridge',wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:'win_clean',minutes:12,eventAbs:G.abs(),purse:360,feudHeat:0};
const opts={structure:{id:'classic_american',lead:'w'},structurePlanning:true,planningCareer:G.S,planningInitiative:true,planningProposal:true,planningDialogue:true,planningBargaining:true,planningSequences:true,planningSequencePolicy:2,planningSequenceSigning:true};
const st=R.begin(c,w,f,p,opts);st.queue=[];R.act(st,'plan_story');R.act(st,'board_ok');R.act(st,'review_ok');R.act(st,'talk_none');
assert.ok(st.sheet?.signed);
const original=copy(st.sheet),sheet=copy(original),o=sheet.structurePlan.objectives[0];
const excluded=new Set([...(graph.GRAPPLE_PILOT||[]),...(graph.STRIKE_PILOT||[]),...(graph.CONTACT_PILOT||[]),...(graph.DIVE_PILOT||[]),'finish_tease','finish_counter','early_cover','cover','near_kickout','counter_rollup']);
const usable=id=>{const n=A[id];return n&&!excluded.has(id)&&!n.risk&&!n.reverse&&!n.counterOf&&!n.blockOf&&!n.nearfall&&n.family&&n.family!=='pin'&&['standing','any'].includes(n.requires)&&n.zone==='standing'&&!n.down&&n.after<=.06;};
const links=id=>A[id].next.filter(([,v])=>v>0).map(([k])=>k);
let fixture=null;
outer:for(const first of Object.keys(A).filter(usable))for(const mid of links(first).filter(usable))for(const last of links(mid).filter(usable)){
 if(new Set([first,mid,last]).size!==3||!S.DIRECTOR.compatibleCall(o,last,'w'))continue;
 const alt=links(first).find(id=>usable(id)&&![first,mid,last].includes(id)&&A[id].family===A[mid].family&&A[id].reverse===A[mid].reverse&&graph.costOf(id)<=graph.costOf(mid)+.3&&links(id).includes(last));
 if(!alt)continue;
 o.call={action:last,owner:'w',proposedBy:'w',label:A[last].name||last,source:'negotiated',chosen:true,backups:[]};
 o.commitment='landmark';
 o.sequence={version:1,mode:'conditional',start:{control:'w',position:'standing',down:null},actions:[first,mid,last]};
 sheet.structurePlan.version=2;
 if(S.STRUCTURES.readPlan(sheet).mode!=='editorial')continue;
 fixture={first,mid,last,alt};break outer;
}
assert.ok(fixture,'authored non-risk substitution fixture');
const {first,mid,last}=fixture;
const M=E.create({w:{...w,fatigue:0,flags:{}},f,p,slot:'main',minutes:12,finish:c.finish,feudHeat:0,plan:{game:'story',leash:'script',talk:'none'},seed:800413,preparation:{},flags:{},sheet,structureExecution:true});
M.stage='live';M.t=60;Object.assign(M.story,o.sequence.start);graph.resetPhysical(M);
const row=M.structureDirector.sequences[0];
assert.ok(graph.isValid(M,first));graph.apply(M,first);
assert.equal(row.progress,1);
M.t+=10;
// Controlled live-availability fixture: impose a temporary exact-ID
// restriction in the runtime validator, not a rewrite of the signed plan.
M.o.sheet.limits.banIds.push(mid);
assert.equal(graph.isValid(M,mid),false);
const offer=S.DIRECTOR.sequenceOffer(M,M.story);
assert.ok(offer&&offer.id!==mid&&offer.planned===mid&&offer.continuation,'real authored substitute offered');
assert.ok(graph.isValid(M,offer.id));
assert.ok(graph.pool(M).some(([id,weight])=>id===offer.id&&weight>0));
graph.apply(M,offer.id);assert.equal(row.progress,2);assert.equal(row.evidence[1].planned,mid);
M.t+=10;assert.ok(graph.isValid(M,last));graph.apply(M,last);
assert.equal(row.status,'adapted');
const receipt=E.structureReport(M).sequences[0].receipt;
assert.equal(receipt.status,'adapted');eq(receipt.planned,[first,mid,last]);eq(receipt.witnessed.map(x=>x.id),[first,offer.id,last]);
assert.equal(receipt.witnessed[1].planned,mid);
// An invented witness or lost graph record cannot issue a receipt.
const fake=E.restore(copy({...M,rState:M.r.getState()}));
fake.graph.events=fake.graph.events.filter(e=>e.id!==offer.id);
assert.equal(E.structureReport(fake).sequences[0].receipt,undefined);
M.o.sheet.limits.banIds=M.o.sheet.limits.banIds.filter(id=>id!==mid);
for(let i=0;i<9000&&!M.done;i++){if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);E.next(M);}
assert.ok(M.done&&M.final);assert.equal(M.final.structure.sequences[0].receipt.status,'adapted');
G.S.card.push(c);G.applyResult(c,M.final);
const ledger=V.ledger(w.id,f.id),meeting=ledger.meetings.find(m=>m.cid===c.id);
eq(meeting.sequenceDelivery,[M.final.structure.sequences[0].receipt]);
const saved=copy(G.S);G.applyResult(c,M.final);eq(G.S.rivalries,saved.rivalries);
G.S=copy(saved);eq(V.ledger(w.id,f.id).meetings.find(m=>m.cid===c.id).sequenceDelivery,meeting.sequenceDelivery);
const future={...c,id:'mp8c-next',eventAbs:c.eventAbs+1},next=R.begin(future,G.W(w.id),G.F(f.id),G.P(p.id),{...opts,planningCareer:G.S});
const snap=F.capture(next,G.W(w.id),G.F(f.id),G.S);
for(const side of ['w','f']){
 const b=F.behaviour(snap,next,side);
 assert.equal(b.cues['history.sequenceAdapted'],1);
 assert.equal(b.cues['history.sequenceInterrupted'],undefined);
 const model=F.proposalModel,values={proposalRisk:50,creativeBenefit:50,sequenceDifficulty:60,tendencyCooperation:50,tendencyFlexibility:50,tendencyCaution:50};
 const neutral=model.evaluate(values,{}),withMemory=model.evaluate(values,b.cues);
 assert.ok(withMemory.scores.acceptance>neutral.scores.acceptance);
 assert.ok(withMemory.scores.reservations<neutral.scores.reservations);
}
const sameWeek=R.begin({...future,eventAbs:c.eventAbs},G.W(w.id),G.F(f.id),G.P(p.id),opts);
assert.equal(F.behaviour(F.capture(sameWeek,G.W(w.id),G.F(f.id),G.S),sameWeek,'w').cues['history.sequenceAdapted'],undefined);
const protectedCareer=copy(G.S),m=protectedCareer.rivalries[w.id+':'+f.id].meetings.find(x=>x.cid===c.id);
m.sequenceDelivery=[{...receipt,status:'missed',witnessed:receipt.witnessed.slice(0,1),interruptions:1,protectedExit:true}];
const cue=career=>F.behaviour(F.capture(next,G.W(w.id),G.F(f.id),career),next,'w').cues;
assert.equal(cue(protectedCareer)['history.sequenceInterrupted'],undefined);
m.sequenceDelivery[0].protectedExit=false;assert.equal(cue(protectedCareer)['history.sequenceInterrupted'],1);
m.sequenceDelivery[0].witnessed=[];assert.equal(cue(protectedCareer)['history.sequenceInterrupted'],undefined);
console.log('PASS MP8C: real authored bridge '+first+' -> '+offer.id+' (instead of '+mid+') -> '+last+'; actual graph receipts, no fabricated witness, idempotent rivalry settlement, JSON persistence, both workers remember, protected/no-opening misses neutral.');

 // MP9A: debrief labels reflect verified receipts, never raw director claims.
 const describe=(status,patch={})=>S.DIRECTOR.deliveryDebrief({status,receipt:{...receipt,status,...patch}});
 assert.equal(describe('adapted').label,'Delivered with adaptation');
 assert.equal(describe('completed').label,'Delivered as agreed');
 assert.equal(describe('missed',{witnessed:[],attempts:0}).label,'No opening');
 assert.equal(describe('missed',{witnessed:[],attempts:1}).label,'No verified landing');
 const prefix=receipt.witnessed.slice(0,1);
 assert.equal(describe('missed',{witnessed:prefix,protectedExit:true,interruptions:1}).label,'Protected exit');
 assert.equal(describe('missed',{witnessed:prefix,protectedExit:false,interruptions:1}).label,'Interrupted sequence');
 assert.equal(describe('missed',{witnessed:prefix,protectedExit:false,interruptions:0}).label,'Incomplete sequence');
 assert.equal(S.DIRECTOR.deliveryDebrief({status:'completed'}).label,'Unverified');
 assert.equal(S.DIRECTOR.deliveryDebrief({status:'completed',receipt}).tone,'');
 console.log('PASS MP9A: evidence-qualified sequence debrief, neutral protected and unopened outcomes, legacy missing receipts.');

 // MP9: historical public technical claims enter private planning only
 // through their settled, earlier, same-pair ledger records.
 const claimCareer=copy(G.S),claimMeeting=claimCareer.rivalries[w.id+':'+f.id].meetings.find(x=>x.cid===c.id);
 claimMeeting.promise={type:'counter',kept:false,sure:false,families:['submission']};
 const claimSnap=F.capture(next,G.W(w.id),G.F(f.id),claimCareer);
 const claimant=F.behaviour(claimSnap,next,'w'),subject=F.behaviour(claimSnap,next,'f');
 assert.equal(claimant.cues['history.publicCounterBroken'],1);
 assert.equal(subject.cues['history.publicCounterBroken'],undefined);
 assert.equal(claimant.publicCounter.families[0],'submission');
 assert.ok(F.huddlePriority(claimant,{publicCounterMatch:true}).score>F.huddlePriority(claimant,{}).score);
 assert.equal(F.huddlePriority(subject,{publicCounterMatch:true}).score,F.huddlePriority(subject,{}).score);
 claimMeeting.promise.kept=true;
 assert.equal(F.behaviour(F.capture(next,G.W(w.id),G.F(f.id),claimCareer),next,'w').cues['history.publicCounterKept'],1);
 claimMeeting.promise.sure=true;
 assert.equal(F.behaviour(F.capture(next,G.W(w.id),G.F(f.id),claimCareer),next,'w').publicCounter,undefined);
 claimMeeting.promise.sure=false;
 assert.equal(F.behaviour(F.capture(sameWeek,G.W(w.id),G.F(f.id),claimCareer),sameWeek,'w').publicCounter,undefined);
 claimMeeting.legacy=true;
 assert.equal(F.behaviour(F.capture(next,G.W(w.id),G.F(f.id),claimCareer),next,'w').publicCounter,undefined);
 console.log('PASS MP9: settled historical public counter claims, correct claimant, bounded proposal priority, no same-week or legacy leakage.');

 // MP9 same-night: preserve the original signed structure and restrictions.
 const publicPromo={promise:{type:'counter'},tactic:{kind:'counter',nodes:['counter_strike']}};
 const publicSheet=copy(original);
 const unsignedCopy=copy(publicSheet);
 const rec=R.promoReconciliation(publicSheet,publicPromo,w,f,c.finish);
 assert.ok(rec&&['aligned','conditional','conflict'].includes(rec.status));
 const added=R.addVow(publicSheet,publicPromo,w,f,c.finish);
 eq(publicSheet,unsignedCopy);
 eq(added.structurePlan,publicSheet.structurePlan);
 eq(added.limits,publicSheet.limits);
 assert.equal(added.finishRoute,publicSheet.finishRoute);
 eq(R.addVow(added,publicPromo,w,f,c.finish),added);
 const blocked=copy(publicSheet);
 blocked.limits.banIds=Object.keys(A);
 const noCounter=R.addVow(blocked,publicPromo,w,f,c.finish);
 assert.equal(noCounter.promoReconciliation.status,'conflict');
 assert.ok(!noCounter.nodes.some(n=>n.vow));
 const badWin={promise:{type:'win'},tactic:{kind:'win',nodes:['finish_tease']}};
 assert.equal(R.promoReconciliation(publicSheet,badWin,w,f,'lose_clean').status,'conflict');
 assert.equal(R.promoReconciliation(publicSheet,{promise:{type:'finisher'}},w,f,'lose_clean').status,'conflict');
 assert.equal(R.promoReconciliation(publicSheet,{promise:{type:'clean'}},w,f,'win_dirty').status,'conflict');
 assert.equal(R.promoReconciliation(publicSheet,{promise:{type:'nocheat'}},w,f,'lose_dq').status,'conflict');
 const legacySheet=copy(publicSheet);delete legacySheet.structurePlan;
 assert.equal(R.promoReconciliation(legacySheet,publicPromo,w,f,c.finish),null);
 assert.equal(R.addVow(legacySheet,publicPromo,w,f,c.finish).promoReconciliation,undefined);
 console.log('PASS MP9 same-night reconciliation: signed structure immutable, restrictions preserved, contradictory promises do not add vows, legacy path unchanged.');

 // MP10: actual live inference, bounded modifiers and legacy opt-out.
 const liveConfig={w:{...w,pro:85,ego:25,morale:85,psych:85,fatigue:0,flags:{}},f,p,slot:'main',
  minutes:12,finish:c.finish,feudHeat:0,plan:{game:'story',leash:'script',talk:'none'},seed:810010,
  preparation:{},flags:{},sheet:copy(sheet),structureExecution:true,livePsychologyVersion:1};
 const live=E.create(copy(liveConfig));live.stage='live';live.t=60;live.sheet.workerConsent=85;live.wSt=90;
 const cooperative=E.livePsychology(live),positive=E.liveObedienceDelta(live,'layout');
 assert.ok(cooperative.scores.obedience>50);
 assert.ok(positive>0&&positive<=12);
 const beforePsych=copy({...live,rState:live.r.getState()});
 E.livePsychology(live);E.liveObedienceDelta(live,'big');
 eq({...live,rState:live.r.getState()},beforePsych);
 live.w={...live.w,ego:90,pro:25,morale:20,psych:25};live.sheet.workerConsent=20;live.wSt=20;live.resent=true;
 const resistant=E.livePsychology(live);
 assert.ok(resistant.scores.obedience<cooperative.scores.obedience);
 assert.ok(resistant.scores.frustration>cooperative.scores.frustration);
 assert.ok(resistant.scores.improvisation<cooperative.scores.improvisation);
 assert.ok(E.liveObedienceDelta(live,'slow')>=E.liveObedienceDelta(live,'big'));
 for(const id of ['layout','home','slow','pickup','big','sheet','crowd'])assert.ok(Math.abs(E.liveObedienceDelta(live,id))<=12);
 const liveReplay=E.restore(copy({...live,rState:live.r.getState()}));
 eq(E.livePsychology(live),E.livePsychology(liveReplay));
 assert.equal(E.call(live,'slow'),E.call(liveReplay,'slow'));
 // A restored save already contains rState, so subsequent properties can
 // have a different insertion order. Compare the entire serialized state
 // structurally, including the exact RNG state, rather than JSON key order.
 assert.deepStrictEqual(copy({...live,rState:live.r.getState()}),copy({...liveReplay,rState:liveReplay.r.getState()}));
 assert.equal(live.o.finish,c.finish);eq(live.sheet.structurePlan,sheet.structurePlan);
 const oldLive=E.create({...copy(liveConfig),livePsychologyVersion:undefined});
 assert.equal(E.livePsychology(oldLive),null);assert.equal(E.liveObedienceDelta(oldLive,'layout'),0);
 console.log('PASS MP10: graded live obedience, improvisation and frustration; bounded context response, no RNG in inference, exact call replay, immutable booked result and layout, legacy opt-out.');

 // MP11: shared professional trust is separate from private manager trust,
 // storyline rivalry and personal bonds; only earlier actual evidence enters.
 const memory=root.OfficeMemory,prof=memory.professionalContext(G.S,w.id,f.id);
 assert.ok(prof&&prof.score>50);
 eq(prof,memory.professionalContext(G.S,f.id,w.id));
 assert.equal(prof.entries[0].cid,c.id);
 assert.equal(prof.entries[0].kind,'shared_delivery');
 assert.equal(prof.entries[0].adapted,1);
 assert.equal(prof.entries[0].delta,2);
 assert.equal(F.capture(next,G.W(w.id),G.F(f.id),G.S).participants.w.values.professionalTrust,prof.score);
 assert.equal(F.capture(next,G.W(w.id),G.F(f.id),G.S).participants.f.values.professionalTrust,prof.score);
 assert.equal(F.capture(sameWeek,G.W(w.id),G.F(f.id),G.S).participants.w.values.professionalTrust,null);
 const oldCareer=copy(G.S);delete oldCareer.officeMemory.professionalPairs;
 assert.equal(memory.professionalContext(oldCareer,w.id,f.id),null);
 assert.equal(F.capture(next,G.W(w.id),G.F(f.id),oldCareer).participants.w.values.professionalTrust,null);
 const privateBefore=copy(G.S.officeMemory.trust),regardBefore=copy(G.S.officeMemory.rivals),bondsBefore=G.S.bonds?copy(G.S.bonds):null;
 assert.equal(memory.recordProfessional(c,M.final,meeting.sequenceDelivery),null);
 const nextC={...c,id:'mp11-protected',eventAbs:c.eventAbs+1};
 assert.equal(memory.recordProfessional(nextC,{...M.final,shortened:true},meeting.sequenceDelivery),null);
 assert.equal(memory.recordProfessional(nextC,{...M.final,outcome:'booked'},[{...receipt,status:'missed',witnessed:receipt.witnessed.slice(0,1)}]),null);
 assert.equal(memory.recordProfessional(nextC,{...M.final,outcome:'nc'},meeting.sequenceDelivery),null);
 eq(memory.professionalContext(G.S,w.id,f.id),prof);
 const setback=memory.recordProfessional({...nextC,id:'mp11-broken'},{...M.final,outcome:'double',injury:0,foeHurt:false,shortened:false,workingHurt:false},[]);
 assert.equal(setback.delta,-3);
 assert.ok(memory.professionalContext(G.S,w.id,f.id).score<prof.score);
 eq(G.S.officeMemory.trust,privateBefore);eq(G.S.officeMemory.rivals,regardBefore);
 eq(G.S.bonds||null,bondsBefore);
 const profSave=copy(G.S);G.S=copy(profSave);
 eq(memory.professionalContext(G.S,w.id,f.id),memory.professionalContext(profSave,w.id,f.id));
 console.log('PASS MP11: verified professional pair memory, neutral protected/incomplete exchanges, no personal blame, independent relationship axes, earlier-only planning, save persistence and deduplication.');

 // MP12 Lab: same engine and hard proposal gates, sandbox changes isolated.
 const Lab=require('../tools/fuzzy-lab/core.js');
 const labCfg={w:w.id,f:f.id,structure:'classic_american',approach:'story',lead:'w',finish:'win_clean',seed:12345,worker:{fatigue:30},opponent:{}};
 const lab=Lab.setup(root,labCfg),lp=lab.profile('w'),lm=F.behaviourModel;
 const baseline=Lab.evaluate(root.OfficePsychology,lm,lp.observation.values,lp.cues);
 eq(baseline.scores,lp.scores);eq(baseline.fired,lp.fired);
 const altered=Lab.evaluate(root.OfficePsychology,lm,lp.observation.values,lp.cues,{fatigue:[5,15,25]});
 assert.ok(altered.scores.caution>baseline.scores.caution);
 eq(Lab.evaluate(root.OfficePsychology,lm,lp.observation.values,lp.cues).scores,baseline.scores);
 assert.throws(()=>Lab.evaluate(root.OfficePsychology,lm,{}, {},{fatigue:[80,20,50]}));
 for(const alt of Lab.alternatives(root,lab.room))assert.ok(R.proposalEvidence(lab.room,alt.objective,alt.action).eligible);
 const tape=Lab.replay(root,labCfg);assert.ok(tape.sheet.signed);eq(tape,Lab.replay(root,labCfg,tape.steps.slice(1).map(x=>x.id)));
 console.log('PASS MP12 Lab: kernel parity, isolated editable curves, legal proposals and seeded negotiation replay.');

 // MP12 finish: the preview is deterministic, covers all authored recruits,
 // and cannot replace a live career's registry or write into its save.
 const isolated=engine(12347).root;
 const preview=isolated.OfficeAcademy.preview(47);
 assert.equal(preview.length,120);assert.equal(new Set(preview.map(x=>x.id)).size,120);
 eq(preview,isolated.OfficeAcademy.preview(47));assert.notEqual(JSON.stringify(preview),JSON.stringify(isolated.OfficeAcademy.preview(48)));
 assert.equal(isolated.OfficeData.ALL.length,80);assert.equal(isolated.OfficeGame.S,null);
 const cohorts=Lab.loadAcademy(isolated);assert.equal(cohorts.established,80);assert.equal(cohorts.academy,120);
 assert.equal(isolated.OfficeGame.S,null);assert.equal(isolated.OfficeData.ALL.length,200);
 const rookie=isolated.OfficeData.ALL.find(x=>x.id.startsWith('academy-'));
 const partner=isolated.OfficeData.ALL.find(x=>x.id!==rookie.id&&isolated.OfficeData.divisionOf(x.id)===isolated.OfficeData.divisionOf(rookie.id));
 const rookieRoom=Lab.setup(isolated,{...labCfg,w:rookie.id,f:partner.id});
 assert.equal(rookieRoom.profile('w').observation.actorId,rookie.id);
 const distribution=Lab.distribution(isolated,labCfg,isolated.OfficePlanningFuzzy.behaviourModel);
 assert.equal(distribution.count,200);assert.equal(distribution.groups.established.count,80);assert.equal(distribution.groups.academy.count,120);
 for(const group of Object.values(distribution.groups))for(const v of Object.values(group.outputs))assert.equal(v.bins.reduce((sum,n)=>sum+n,0),group.count);
 assert.equal(isolated.OfficeGame.S,null);
 assert.throws(()=>Lab.loadAcademy(root),/isolated Lab/);
 const note=memory.professionalSummary(prof);assert.match(note,/adapted sequences delivered/);assert.ok(!note.includes('/100'));
 assert.equal(memory.professionalSummary(null),null);
 assert.match(memory.professionalSummary(memory.professionalContext(G.S,w.id,f.id)),/agreed finish was broken/);
 console.log('PASS MP12: isolated 200-identity cohort distribution, deterministic production rookie previews, and factual player-facing professional memory.');

// MP13C: deterministic feasibility priors are separate from consent.
{
 const target=sheet.structurePlan.objectives[0],seq=target.sequence;
 const evidence={start:seq.start,steps:seq.actions.map(action=>({action,performer:'w'}))};
 const roomy=F.sequenceFeasibility({...st,minutes:15,fx:{}},target,evidence);
 const tight=F.sequenceFeasibility({...st,minutes:5,fx:{}},target,evidence);
 assert.ok(roomy.possible&&roomy.scores.feasibility>=tight.scores.feasibility);
 const corner=F.sequenceFeasibility({...st,minutes:15,fx:{}},target,{...evidence,start:{...seq.start,position:'corner'}});
 assert.ok(roomy.scores.feasibility>corner.scores.feasibility);
 assert.ok(roomy.duration===seq.actions.reduce((n,id)=>n+graph.sequenceMoveSeconds(id),0));
 assert.ok(graph.GRAPPLE_PILOT.every(id=>graph.sequenceMoveSeconds(id)===20));
 assert.ok(graph.STRIKE_PILOT.every(id=>graph.sequenceMoveSeconds(id)===10));
 eq(F.sequenceFeasibility({...st,minutes:15,fx:{}},target,evidence),roomy);
 console.log('PASS MP13C feasibility: independent entry, timing and physical readiness priors, actual graph duration classes.');
}

// MP13D: mandatory positive receipt fixture with two real graph first
// moves converging on the same signed continuation. No assumed graph IDs.
{
 const base=copy(original),obj=base.structurePlan.objectives[0],opposite=side=>side==='w'?'f':'w';
 let chosen=null;
 const candidates=Object.keys(A).filter(usable);
 search:for(const one of candidates)for(const two of links(one).filter(usable)){
  if(one===two||!S.DIRECTOR.compatibleCall(obj,two,'w'))continue;
  for(const alternate of candidates){
   if([one,two].includes(alternate)||!links(alternate).includes(two)||graph.PHYSICAL_GRIP_MOVES[alternate]||
      graph.GRIP_ENTRY[alternate]!==graph.GRIP_ENTRY[one]||graph.costOf(alternate)>Math.max(1.8,graph.costOf(one)))continue;
   const start={control:'w',position:'standing',down:null};
   obj.call={action:two,owner:'w',proposedBy:'w',label:A[two].name||two,source:'negotiated',chosen:true,backups:[]};
   obj.commitment='landmark';obj.sequence={version:2,mode:'conditional',start,actions:[one,two],openings:[{start:{...start},action:alternate}]};
   base.structurePlan.version=2;
   if(S.STRUCTURES.readPlan(base).mode!=='editorial')continue;
   const m=E.create({w:{...w,fatigue:0,flags:{}},f,p,slot:'main',minutes:12,finish:c.finish,feudHeat:0,plan:{game:'story',leash:'script',talk:'none'},seed:98101,preparation:{},flags:{},sheet:copy(base),structureExecution:true,sequenceTimingVersion:1});
   m.stage='live';m.t=60;Object.assign(m.story,start);graph.resetPhysical(m);
   if(!graph.isValid(m,alternate))continue;
   // Disable only the primary choice to exercise the actual fallback offer.
   m.o.sheet.limits.banIds.push(one);
   const offer=S.DIRECTOR.sequenceOffer(m,m.story);
   if(offer?.id!==alternate)continue;
   chosen={m,one,two,alternate};break search;
  }
 }
 assert.ok(chosen,'real signed alternative opening fixture');
 const {m,one,two,alternate}=chosen;
 const bad=copy(base);bad.structurePlan.objectives[0].sequence.openings[0].action=two;
 assert.notEqual(S.STRUCTURES.readPlan(bad).mode,'editorial');
 graph.apply(m,alternate);
 assert.equal(m.structureDirector.sequences[0].progress,1);
 const resumed=E.restore(copy({...m,rState:m.r.getState()}));
 m.t+=10;resumed.t+=10;assert.ok(graph.isValid(m,two));graph.apply(m,two);graph.apply(resumed,two);
 const receipt=E.structureReport(m).sequences[0].receipt;
 assert.equal(receipt.status,'adapted');eq(receipt.planned,[one,two]);eq(receipt.witnessed.map(x=>x.id),[alternate,two]);assert.equal(receipt.witnessed[0].opening,true);
 eq(E.structureReport(resumed),E.structureReport(m));
 const forged=copy(m.structureDirector.sequences[0].evidence);forged[0].id=one;m.structureDirector.sequences[0].evidence=forged;
 assert.equal(E.structureReport(m).sequences[0].receipt,undefined);
 console.log('PASS MP13D signed alternative first move: '+alternate+' -> '+two+'; actual receipt and resume verified');
}

// MP13F.2: real diagnostic pair, timing and stamina opening gates.
{
 const asSteps=ids=>ids.map(id=>({id,action:id,performer:'w',entry:{control:'w',position:'standing',down:null}}));
 const bad=asSteps(['lockup','sx_delayed']),good=asSteps(['front_facelock','sx_delayed']);
 assert.equal(graph.PHYSICAL_GRIP_MOVES.sx_delayed,'front-facelock');
 assert.equal(F.continuationGrip(bad).possible,false);
 assert.equal(F.continuationGrip(good).possible,true);
 const m=E.create({w:{...w,fatigue:0},f,p,slot:'main',minutes:12,finish:c.finish,plan:{game:'story',leash:'script',talk:'none'},seed:9000,sheet:copy(sheet),structureExecution:true});
 m.sheet.sequenceContinuationVersion=1;m.t=0;m.wSt=100;m.fSt=100;
 const rng=m.r.getState(),before=JSON.stringify(m);
 assert.equal(S.DIRECTOR.openingReadiness(m,bad),false);
 assert.equal(S.DIRECTOR.openingReadiness(m,good),false,'late suplex cannot be started too early');
 assert.equal(JSON.stringify(m),before);assert.equal(m.r.getState(),rng);
 m.t=Math.ceil(A.sx_delayed.after*m.len/10)*10;
 assert.equal(S.DIRECTOR.openingReadiness(m,good),true);
 m.wSt=10;assert.equal(S.DIRECTOR.openingReadiness(m,good),false,'insufficient actual energy');
 delete m.sheet.sequenceContinuationVersion;assert.equal(S.DIRECTOR.openingReadiness(m,bad),true,'legacy agreement unchanged');
 console.log('PASS MP13F.2 actual grip incompatibility, timing/stamina preflight, pure check and legacy opt-out');
}

// MP13F.7A: credit only base recovery to the actual performer; no
// fabricated rest event or future bonus. Real graph application is separate.
{
 const m=E.create({w:{...w,fatigue:0},f,p,slot:'main',minutes:12,finish:c.finish,plan:{game:'story',leash:'script',talk:'none'},seed:9001,sheet:copy(original),structureExecution:true});
 m.sheet.sequenceContinuationVersion=1;m.stage='live';m.t=400;m.wSt=25;m.fSt=60;
 Object.assign(m.story,{control:'w',position:'standing',down:null});graph.resetPhysical(m);
 const cost=graph.costOf('catch_breath'),step={id:'catch_breath',performer:'w',entry:{control:'w',position:'standing',down:null}};
 assert.ok(cost<0&&graph.isValid(m,'catch_breath'));
 const energy={w:m.wSt,f:m.fSt};
 S.DIRECTOR.projectedSequenceEnergy(m,energy,step,cost);eq(energy,{w:25,f:60});
 m.o.sequenceRecoveryProjectionVersion=1;
 const rng=m.r.getState(),state=JSON.stringify(m);
 S.DIRECTOR.projectedSequenceEnergy(m,energy,step,cost);
 eq(energy,{w:25-cost,f:60});assert.equal(JSON.stringify(m),state);assert.equal(m.r.getState(),rng);
 const high={w:99,f:30};S.DIRECTOR.projectedSequenceEnergy(m,high,step,cost);eq(high,{w:100,f:30});
 const foe={w:25,f:30};S.DIRECTOR.projectedSequenceEnergy(m,foe,{...step,performer:'f'},cost);eq(foe,{w:25,f:30-cost});
 const nonRest={w:25,f:60};S.DIRECTOR.projectedSequenceEnergy(m,nonRest,{...step,id:'crowd_pose'},graph.costOf('crowd_pose'));eq(nonRest,{w:25,f:60});
 const debit={w:25,f:60};S.DIRECTOR.projectedSequenceEnergy(m,debit,{...step,id:'lockup'},graph.costOf('lockup'));eq(debit,{w:25-Math.max(0,graph.costOf('lockup')),f:60});
 graph.apply(m,'catch_breath');assert.equal(m.wSt,25-cost,'actual authored base recovery matches projection in story plan');
 assert.ok(m.graph.events.some(e=>e.id==='catch_breath'),'actual recovery witnessed');
 const restored=E.restore(copy({...m,rState:m.r.getState()}));assert.equal(restored.o.sequenceRecoveryProjectionVersion,1);
 console.log('PASS MP13F.7A base recovery, performer ownership, cap, no speculative bonuses, no RNG/state changes, actual rest witness, resume and legacy opt-out.');
}

// MP13F.7B: focused legal recovery preference, not a scripted refill.
{
 const room=R.begin(c,w,f,p,{...opts,structure:{id:'dominant_ace',lead:'w'}});
 room.queue=[];R.act(room,'plan_story');R.act(room,'board_ok');R.act(room,'review_ok');R.act(room,'talk_none');
 const signed=copy(room.sheet),obj=signed.structurePlan.objectives[0];
 obj.call={action:'nk_ddt',owner:'w',proposedBy:'w',label:A.nk_ddt.name,source:'negotiated',chosen:true,backups:[]};
 obj.commitment='landmark';obj.sequence={version:1,mode:'conditional',start:{control:'w',position:'standing',down:null},actions:['front_facelock','nk_ddt']};
 signed.structurePlan.version=2;signed.sequenceContinuationVersion=1;
 assert.equal(S.STRUCTURES.readPlan(signed).mode,'editorial');
 signed.workerConsent=85;signed.opponentConsent=85;
 const m=E.create({w:{...w,fatigue:0},f,p,slot:'main',minutes:12,finish:c.finish,plan:{game:'story',leash:'script',talk:'none'},seed:9002,sheet:signed,structureExecution:true,sequenceRecoveryProjectionVersion:1});
 m.stage='live';m.t=80;m.wSt=18;m.fSt=80;m.comply=85;
 Object.assign(m.story,obj.sequence.start);graph.resetPhysical(m);
 const dir=S.DIRECTOR,focus=()=>dir.sequenceRecoveryFocus(m,m.story);
 assert.equal(focus(),null,'legacy opt-out');
 m.o.sequenceRecoveryPacingVersion=1;
 const before=JSON.stringify(m),rng=m.r.getState(),target=focus();
 assert.ok(target&&target.side==='w'&&target.deficit>0&&target.rests.includes('catch_breath'),'correct tired performer');
 assert.equal(JSON.stringify(m),before);assert.equal(m.r.getState(),rng);
 assert.ok(graph.isValid(m,'catch_breath'));
 const pool=[['catch_breath',1],['lockup',10]];
 const offered=dir.sequenceRecoveryPreference(pool,target);assert.ok(offered.boosted&&pool[0][1]>1&&pool[1][1]===10);
 assert.ok(pool[0][1]<=10*.6,'bounded preference');
 assert.equal(dir.sequenceRecoveryPreference([['lockup',10]],target),null,'cannot add a filtered candidate at final weighting');
 assert.equal(dir.sequenceRecoveryFocus(m,m.story,{id:'lockup'}),null,'ready agreement takes precedence');
 m.mode='pickup';assert.equal(focus(),null);m.mode=null;
 m.wSt=80;assert.equal(focus(),null,'no stamina deficit');m.wSt=18;
 m.story.control='f';assert.equal(focus(),null,'wrong wrestler');m.story.control='w';
 const restored=E.restore(copy({...m,rState:m.r.getState()}));eq(dir.sequenceRecoveryFocus(restored,restored.story),focus());
 graph.apply(m,'catch_breath');assert.ok(m.graph.events.some(e=>e.id==='catch_breath'));assert.ok(m.wSt>18);
 assert.equal(focus(),null,'actual rest imposes cooldown');
 console.log('PASS MP13F.7B bounded legal recovery preference, ownership, cooldown, ready sequence precedence, purity and resume.');
}
