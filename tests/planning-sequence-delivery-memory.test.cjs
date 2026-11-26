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
