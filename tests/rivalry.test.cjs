'use strict';
// The Office v0.3.12 — rivalries that remember: evidence-backed arguments, counter-proposals that change
// the sheet, commitments the match tests, and five-bout continuity.
// Run: node tests/rivalry.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert.ok(html.indexOf('assets/js/rivalry.js')>html.indexOf('assets/js/relationships.js')&&html.indexOf('assets/js/rivalry.js')<html.indexOf('assets/js/ui.js'),'the rivalry layer loads after the locker room and before the interface');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const db=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},console,Math,Date,JSON});
root.OFFICE_STRICT=true;
const {OfficeData:D,OfficeGame:G,OfficeStory:Story,OfficeMic:Mic,OfficeRoom:Room,OfficeMatch:MX,OfficeRivalry:Riv,OfficeGraphKernel:K}=root;
const Promo=Story.Graph;
const clean=/undefined|NaN|\{[A-Z_]+\}|\[object/;
const rex=()=>G.W('rex'),silas=D.FOES.find(f=>f.id==='silas');
let n=0;
const contract=(o={})=>({id:'rv-'+(n++),wid:'rex',rid:'silas',pid:'dock',slot:'mid',finish:'lose_clean',minutes:12,purse:250,blowoff:false,feudHeat:0,eventAbs:G.abs(),...o});
const ev=(o={})=>({len:720,counters:{w:1,f:1},late:{w:0,f:0},families:{w:[],f:[]},dirty:{w:false,f:false},stamina:{w:45,f:45},injured:{w:null,f:false},damage:{w:0,f:0},route:null,beats:null,...o});
function seed(meetings){
 // A career whose ledger holds exactly these meetings, as the engine would have recorded them.
 G.fresh();G.S.seed=99;assert.equal(G.sign('rex'),null);
 const L=Riv.ledger('rex','silas');
 meetings.forEach((m,i)=>{const c=contract({finish:m.finish});L.meetings.push(Riv.meetingFrom(c,{outcome:m.outcome||'booked',finishRoute:m.route,minutes:m.minutes||12,stars:m.stars||2.5,injury:m.injury||0,injuryPart:m.part||null,foeHurt:!!m.foeHurt,evidence:ev(m.ev||{})},rex(),silas,i+1));});
 return L;
}
const run=o=>{const m=MX.create(o);for(let i=0;i<12000&&!m.done;i++){if(m.decision&&!m.queue.length)MX.resolve(m,m.decision.options[0].id);MX.next(m);}assert.ok(m.done);return m;};

// 1. No history, no historical claims. A first meeting offers no evidence-backed argument and invents none.
G.fresh();G.sign('rex');
{const st=Promo.begin(contract(),rex(),silas,null);
 assert.equal(st.cases.length,0,'a first meeting has nothing on the record');
 assert.ok(Promo.choices('open',st).every(o=>!o.evidence),'no opening claims evidence it does not have');}

// 2. Each kind of argument appears only when its fact is on the record, and says only what happened.
const want=(meetings,issue,present=true)=>{seed(meetings);const st=Promo.begin(contract(),rex(),silas,G.feud('rex','silas'));
 const issues=Riv.profile('rex','silas').facts.map(f=>f.kind);
 assert.equal(issues.includes(issue),present,issue+(present?' needs and has its fact':' must not appear without its fact')+': '+issues.join(','));return st;};
want([{finish:'lose_protected',route:'rope_rollup'}],'cheat_f');
want([{finish:'lose_protected',route:'slow_count'}],'cheat_f',false);
want([{finish:'lose_protected',route:'slow_count'}],'slow_count');
want([{finish:'lose_clean',route:'submission_defeat'}],'tapped');
want([{finish:'lose_clean',route:'duck_finisher'}],'tapped');          // Rush Lock is a submission finisher
want([{finish:'lose_clean',route:'outlasted',ev:{stamina:{w:12,f:40}}}],'tapped',false);
want([{finish:'win_dirty',route:'feet_on_ropes'}],'cheat_w');
want([{finish:'win_clean',route:'finisher',ev:{dirty:{w:true,f:false}}}],'cheat_w',false); // a cheap shot along the way is not how it was won
want([{finish:'lose_clean',route:'duck_finisher',injury:2,part:'knee'}],'injury_w');
want([{finish:'lose_clean',route:'duck_finisher'}],'injury_w',false);
want([{finish:'win_clean',route:'finisher',stars:3.75}],'great_match');
want([{finish:'win_clean',route:'finisher',stars:2.5}],'great_match',false);
want([{finish:'win_clean',route:'finisher'},{finish:'lose_clean',route:'duck_finisher'}],'record_f',false);
want([{finish:'lose_clean',route:'duck_finisher'},{finish:'lose_clean',route:'duck_finisher'}],'record_f');
// Every fact cited points at a meeting that is actually in the ledger.
for(const route of ['rope_rollup','slow_count','exhausted_cover','injury_gives']){
 const L=seed([{finish:'lose_protected',route,injury:route==='injury_gives'?1:0,part:'arm'}]);
 for(const f of Riv.profile('rex','silas').facts)if(f.cid)assert.ok(L.meetings.some(m=>m.cid===f.cid),'fact '+f.kind+' refers to a recorded meeting');
}

// 3. A genuine exchange. The claim, the counterclaim and each answer are about the same thing, and the
//    answers lead to different resolutions, consequences and commitments.
let exchanges=0;
for(const mode of ['evidence','dismiss','concede','deflect'])for(const issue of Object.keys(Riv.ISSUES)){
 const I=Riv.ISSUES[issue];
 assert.ok(I.f[mode]&&I.prop.core&&I.again,'complete issue '+issue);
 assert.deepEqual(Object.keys(I.r).sort(),['callback','calm','challenge','personal','turn'],'five distinct answers for '+issue);
 const res=new Set(Object.values(I.r).map(r=>r.res));assert.ok(res.size>=3,issue+' answers lead to different resolutions');
 exchanges++;
}
{
 seed([{finish:'lose_protected',route:'rope_rollup',minutes:12}]);
 const base=Promo.begin(contract({finish:'lose_clean'}),rex(),silas,G.feud('rex','silas'));
 const k=base.cases.find(x=>x.issue==='cheat_f');assert.ok(k,'the tights finish is tonight’s argument');
 assert.match(k.prop,/tights/i);assert.match(k.counter,/12 minutes|referee|three|pretty|arguing/i,'the counterclaim answers the claim');
 const outcome={};
 for(const id of ['calm','turn','challenge','personal','callback']){
  const st=JSON.parse(JSON.stringify(base));Promo.choose(st,k.angle);
  assert.equal(st.case.raisedBy,'w');assert.equal(st.dialogue.find(d=>d.kind==='opponent').line,k.counter,'the opponent answers the claim that was made');
  const shown=Promo.choices('answer',st).find(o=>o.id===id);assert.ok(shown.caseResponse,'answer '+id+' takes a position on the counterclaim');
  Promo.choose(st,id);
  const last=st.dialogue.filter(d=>d.kind==='opponent').at(-1).line;
  assert.equal(last,st.case.responses[id].reply,'the reply follows from that answer');
  outcome[id]={res:st.case.resolution,arg:st.argument,heat:st.metrics.heat,commit:st.case.commit?.kind||null};
 }
 assert.equal(outcome.calm.res,'reframed');assert.equal(outcome.challenge.commit,'clean');assert.equal(outcome.callback.res,'withdrawn');
 assert.ok(outcome.calm.arg>outcome.personal.arg,'granting the fair point beats shouting');
 assert.ok(outcome.personal.heat>outcome.calm.heat,'escalating raises the temperature');
 // The demand for a straight fight can be made official, and is shown as following from what was said.
 const st=JSON.parse(JSON.stringify(base));Promo.choose(st,k.angle);Promo.choose(st,'challenge');
 const official=Promo.choices('close',st).find(o=>o.followsCase);assert.equal(official.id,'clean');
 Promo.choose(st,'clean');const r=Promo.result(st);
 assert.equal(r.case.commit.official,true);assert.equal(r.promise.type,'clean');assert.doesNotMatch(JSON.stringify(r),clean);
}
// When the speaker is guilty of the same thing, the other wrestler says so.
{
 seed([{finish:'win_dirty',route:'tights'},{finish:'lose_protected',route:'rope_rollup'}]);
 const st=Promo.begin(contract(),rex(),silas,G.feud('rex','silas'));
 const k=st.cases.find(x=>x.issue==='cheat_f');assert.ok(k&&k.responses.turn.expose,'the charge can be thrown back');
 Promo.choose(st,k.angle);Promo.choose(st,'turn');
 assert.equal(st.case.exposed,true);assert.match(st.dialogue.at(-1).line,/tights/i);
}
// A wrestler can admit an error, and a promise made straight after "no promises" costs credibility.
{
 seed([{finish:'lose_clean',route:'duck_finisher'}]);
 const L=Riv.ledger('rex','silas');L.meetings[0].promise={type:'counter',kept:false,say:'counter {opps} holds'};
 const a=Promo.begin(contract(),rex(),silas,G.feud('rex','silas'));const k=a.cases.find(x=>x.issue==='promise_broken');assert.ok(k);
 Promo.choose(a,k.angle);Promo.choose(a,'calm');assert.equal(a.case.resolution,'conceded');
 assert.match(a.dialogue.at(-2).line,/I said it and I did not do it/);
 const b=JSON.parse(JSON.stringify(a)),c=JSON.parse(JSON.stringify(a));c.case.noPromise=false;
 assert.match(Promo.choices('close',a).find(o=>o.id==='vow').hint,/no promises/);
 Promo.choose(a,'legacy');Promo.choose(b,'vow');Promo.choose(c,'vow');
 assert.equal(b.metrics.cred,c.metrics.cred-4,'breaking your word inside the same promo is noticed');
 assert.ok(b.case.brokeWord&&!a.case.brokeWord);
 assert.match(b.dialogue.at(-1).line+b.dialogue.at(-2).line,/So much for no promises/);
 assert.match(k.counter,/promised to counter my holds/,'the opponent repeats the promise in their own words');
 assert.match(k.prop,/your holds|I said I would/,'the speaker in theirs');
}
// The same claim, said by different voices: same facts, different approach.
{
 const facts=[{finish:'lose_protected',route:'rope_rollup',minutes:14}];
 const said=new Map();
 for(const id of ['rex','juno','sol','mara','lyra']){
  seed([]);const W=D.TALENT.find(x=>x.id===id);
  const L=Riv.ledger(id,'silas');L.meetings.push(Riv.meetingFrom(contract({wid:id}),{outcome:'booked',finishRoute:'rope_rollup',minutes:14,stars:2,evidence:ev()},W,silas,1));
  const st=Promo.begin(contract({wid:id}),W,silas,null);const k=st.cases.find(x=>x.issue==='cheat_f');
  assert.ok(k,'every voice can make the argument');assert.match(k.evidence,/handful of tights/);said.set(id,k.prop);
 }
 assert.ok(new Set(said.values()).size>=4,'voices deliver the same claim differently: '+[...said.values()].join(' | '));
 assert.match(said.get('juno'),/14 minutes/,'a precise talker cites the detail');
}

// 4. The duel: evidence shows on the options; a thrown-back charge turns "push your luck" into a choice of position.
{
 seed([{finish:'win_dirty',route:'tights'},{finish:'lose_protected',route:'rope_rollup'}]);
 const duel=Mic.begin(contract(),rex(),silas,G.feud('rex','silas'),null,G.P('dock'));
 const opens=Mic.choices(duel);const k=duel.core.cases.find(x=>x.issue==='cheat_f');
 const o=opens.find(x=>x.id===k.angle);assert.ok(o.evidence&&o.tags.includes('On the record'));
 assert.ok(Mic.view(duel).record.length>=1,'the record is shown before the first line');
 Mic.choose(duel,k.angle);Mic.choose(duel,'turn');
 const push=Mic.choices(duel).map(x=>x.id);assert.equal(push.join(),'firm,revise,leave');
 const firm=JSON.parse(JSON.stringify(duel)),revise=JSON.parse(JSON.stringify(duel));
 Mic.choose(firm,'firm');Mic.choose(revise,'revise');
 assert.ok(['defended','unresolved'].includes(firm.core.case.resolution));assert.equal(revise.core.case.resolution,'reframed');
 assert.equal(revise.core.case.commit.kind,'nocheat','revising the charge commits to not cheating');
 for(const st of [firm,revise])while(st.stage!=='done')Mic.choose(st,Mic.choices(st)[0].id);
 assert.doesNotMatch(JSON.stringify(Mic.result(revise)),clean);
}

// 5. Backstage: a real reason produces a counter-proposal that changes the signed sheet; no reason, none.
{
 G.fresh();G.sign('rex');
 const quiet=Room.begin(contract(),rex(),silas,G.P('dock'),{});
 assert.ok(!quiet.queue.includes('rival_counter'),'rested strangers have nothing to renegotiate');
 let changed=0,skipped=0,legalSheets=0,replies=new Set();
 for(const finish of ['win_clean','lose_clean','lose_protected','win_dirty'])for(const game of ['story','technical','brawl','spots']){
  seed([{finish:'lose_clean',route:'duck_finisher',ev:{families:{w:[],f:['strike']}}}]);
  const c=contract({finish});const st=Room.begin(c,rex(),silas,G.P('dock'),{});
  assert.equal(st.queue[0],'rival_counter','a recorded counter puts the conversation first');
  Room.act(st,'plan_'+game);
  // Whatever Titan has pencilled in, Rush turned that kind of move round last time.
  const mine=['payoff','reversal','opening'].map(s=>st.board[s]).find(b=>b?.owner==='w'&&MX.GRAPH.A[b.action]?.family);
  if(!mine){skipped++;continue;}
  Riv.ledger('rex','silas').meetings[0].families.f=[MX.GRAPH.A[mine.action].family];
  const before=JSON.parse(JSON.stringify(st.board));
  Room.act(st,'board_ok');
  if(st.stage!=='scene'||st.queue[st.at]!=='rival_counter'){skipped++;continue;}
  const neg=st.negotiation;assert.ok(neg&&neg.reason&&neg.proposal.action!==neg.original.action);
  Room.act(st,'accept');
  for(let g=0;g<20&&st.stage!=='done';g++)Room.act(st,Room.options(st)[0].id);
  const node=st.sheet.nodes.find(x=>x.id===neg.slot);
  assert.ok(node,'the negotiated beat is on the sheet');
  assert.notEqual(node.actions[0],before[neg.slot].action,'the counter-proposal changed the actual match plan');
  assert.ok(node.negotiated,'and is marked as negotiated');
  assert.equal(K.validate(st.sheet.nodes).length,0,'the revised plan is still a legal graph');
  assert.equal(st.sheet.nodes.at(-1).actions[0],'outcome_'+finish,'the booked result is untouched');
  assert.ok(Room.agreed(st).some(x=>/Changed at/.test(x)),'the change is shown in the layout');
  assert.ok(st.sheet.negotiation.summary&&st.sheet.negotiation.turns.length>=2);
  replies.add(st.sheet.negotiation.reply?.kind);
  legalSheets++;changed++;
  if(changed===1){
   const m=run({w:{...rex(),flags:{},fatigue:0},f:silas,p:G.P('dock'),slot:'mid',minutes:st.sheet.minutes,finish,plan:{game,leash:'script',talk:'calm'},preparation:{},flags:{},seed:4100,promo:null,sheet:st.sheet});
   assert.equal(m.graph.outcome.id,finish,'the match still delivers the contract');
   const beat=m.final.evidence.beats.find(b=>b.id===neg.slot);assert.ok(beat&&beat.negotiated&&['achieved','adapted','missed'].includes(beat.status));
   assert.equal(m.final.roomNegotiation.slot,neg.slot);
   const before2=JSON.stringify(Riv.ledger('rex','silas').talks);
   G.S.card.push(c);G.applyResult(c,{...m.final,log:m.log});
   const talk=Riv.ledger('rex','silas').talks.at(-1);
   assert.ok(JSON.stringify(Riv.ledger('rex','silas').talks)!==before2&&talk.delivered===beat.status,'what was agreed and what happened are both recorded');
  }
 }
 assert.ok(changed>=4,'counter-proposals happen and stick: '+changed+' (skipped '+skipped+' where no different move exists for that slot)');
}
// A worn-out high-flyer, hurt in this rivalry before, can refuse an unsafe spot outright.
{
 G.fresh();assert.equal(G.sign('lyra'),null);const lyra=G.W('lyra');lyra.fatigue=70;
 Riv.ledger('lyra','silas').meetings.push(Riv.meetingFrom(contract({wid:'lyra'}),{outcome:'booked',finishRoute:'duck_finisher',minutes:11,stars:2,injury:2,injuryPart:'back',evidence:ev()},lyra,silas,1));
 let refused=0,tried=0;
 for(let i=0;i<12&&!refused;i++){
  const st=Room.begin(contract({wid:'lyra',finish:'win_clean'}),lyra,silas,G.P('dock'),{});Room.act(st,'plan_spots');
  const risky=Room.pitches(st,'payoff').find(c=>c.by==='w'&&c.risk&&!c.impossible);if(!risky)continue;tried++;
  st.board.payoff={by:'w',owner:'w',action:risky.action,label:risky.label};
  Room.act(st,'board_ok');if(st.queue[st.at]!=='rival_counter')continue;
  assert.equal(st.negotiation.issue,'safety');assert.match(st.negotiation.reason,/hurt/);Room.act(st,'keep');
  assert.equal(st.negotiation.reply.kind,'refused');assert.equal(st.board.payoff.action,'scheduled_nearfall','nobody is made to do it');refused++;
 }
 assert.ok(tried&&refused,'a credible refusal happens');
}

// 6. Commitments are tested against what the engine recorded, once.
{
 let checked=0;
 for(const [finish,i] of [['win_dirty',0],['win_clean',1],['win_clean',2],['lose_clean',3]]){
  seed([{finish:'win_dirty',route:'feet_on_ropes'}]);
  const c=contract({finish});G.S.card.push(c);
  const st=Promo.begin(c,rex(),silas,G.feud('rex','silas'));const k=st.cases.find(x=>x.issue==='cheat_w');assert.ok(k);
  Promo.choose(st,k.angle);assert.equal(st.case.raisedBy,'w');Promo.choose(st,'calm');assert.equal(st.case.commit.kind,'nocheat');
  Promo.choose(st,'clean');const promo=Promo.result(st);assert.equal(promo.promise.type,'nocheat');
  const m=run({w:{...rex(),flags:{},fatigue:0},f:silas,p:G.P('dock'),slot:'mid',minutes:12,finish,plan:{game:'story',leash:'script',talk:'calm'},preparation:{},flags:{},seed:700+i,promo,sheet:null});
  G.applyResult(c,{...m.final,log:m.log});
  const h=G.S.history.find(x=>x.cid===c.id);
  const expected=finish!=='win_dirty'&&!m.final.evidence.dirty.w&&!m.final.promoSignals.workerDirty;
  assert.equal(h.promo.promise.kept,expected,'a no-cheating promise is kept only if the engine saw no cheating ('+finish+')');
  const snap=JSON.stringify(G.S);G.applyResult(c,{...m.final,log:m.log});assert.equal(JSON.stringify(G.S),snap,'processing the same result again changes nothing');
  const L=Riv.ledger('rex','silas');assert.equal(L.meetings.length,2);assert.equal(L.claims.at(-1).commit.verdict,expected?'kept':'broken');
  checked++;
 }
 assert.equal(checked,4);
}

// 7. Save, load and old careers.
{
 seed([{finish:'lose_protected',route:'rope_rollup'},{finish:'win_clean',route:'finisher',stars:3.75}]);
 const a=JSON.stringify(Riv.profile('rex','silas'));G.S=JSON.parse(JSON.stringify(G.S));
 assert.equal(JSON.stringify(Riv.profile('rex','silas')),a,'the rivalry survives a reload');
 // A career saved before this version: no ledger, just history rows. It is rebuilt from them.
 G.fresh();G.sign('rex');
 G.S.history.unshift({cid:'old-1',wid:'rex',rid:'silas',finish:'win_dirty',outcome:'booked',week:1,season:1,stars:2,notes:[]},{cid:'old-2',wid:'rex',rid:'silas',finish:'lose_clean',outcome:'booked',week:2,season:1,stars:3,notes:[]});
 const old=JSON.parse(JSON.stringify(G.S));delete old.rivalries;G.S=old;
 const st=Promo.begin(contract(),rex(),silas,null);
 assert.equal(Riv.ledger('rex','silas').meetings.length,2,'history from before the ledger becomes its first meetings');
 assert.ok(st.cases.length,'and supports arguments');assert.ok(Riv.ledger('rex','silas').meetings.every(m=>m.legacy));
 // A promo saved mid-way by the previous version (no cases at all) still plays to the end.
 const legacy=Promo.begin(contract(),rex(),silas,null);delete legacy.cases;delete legacy.case;
 for(const id of ['proof','turn','question'])Promo.choose(legacy,id);
 assert.equal(Promo.result(legacy).case,null);
 // So does a legacy duel.
 const duel=Mic.begin(contract(),rex(),silas,null,null,G.P('dock'));delete duel.core.cases;
 while(duel.stage!=='done')Mic.choose(duel,Mic.choices(duel)[0].id);
}

// 8. Five bouts, twice over: a rivalry that develops, reproducibly, and differently with different people.
const {run:fiveBouts}=require('../tools/five-bouts.cjs');
const plays=[
 {w:'rex',f:'silas',tag:'t1',stance:'measured',finishes:['lose_clean','lose_protected','win_clean','lose_clean','win_clean'],careerSeed:4242,matchSeed:900},
 {w:'brick',f:'rev',tag:'t2',stance:'gracious',finishes:['win_clean','lose_clean','win_clean','lose_protected','win_clean'],careerSeed:4242,matchSeed:3100},
 {w:'sol',f:'malik',tag:'t3',stance:'hothead',finishes:['lose_protected','win_dirty','lose_clean','win_clean','win_clean'],careerSeed:4242,matchSeed:2600},
 // Rating-curve changes can alter which real match facts make the original
 // three careers' promos. Keep the five-issue requirement but broaden the
 // deterministic evidence sample to distinctive styles and risk profiles.
 {w:'lyra',f:'roxy',tag:'t4',stance:'hothead',game:'spots',finishes:['win_dirty','lose_protected','win_clean','win_dirty','lose_clean'],careerSeed:14023,matchSeed:2501},
 {w:'rex',f:'silas',tag:'t5',stance:'gracious',game:'safe',finishes:['win_clean','win_clean','lose_clean','lose_protected','win_clean'],careerSeed:97323,matchSeed:7802}];
const runs=plays.map(fiveBouts);
const again=fiveBouts(plays[0]);
const shape=r=>JSON.stringify(r.bouts.map(b=>({d:b.promo.dialogue.map(x=>x.line),room:b.roomLog.map(x=>x.text),m:b.match.route,c:b.consequences})));
assert.equal(shape(again),shape(runs[0]),'the same career, decisions and seeds replay identically');
let callbacks=0,issues=new Set(),resolutions=new Set(),stances=new Set(),negotiated=0;
for(const r of runs){
 const said=r.bouts.map(b=>b.promo.dialogue.filter(d=>d.speaker===r.w.name||d.speaker===r.f.name).map(d=>d.line));
 for(let i=1;i<said.length;i++){
  const repeated=said[i].filter(l=>said[i-1].includes(l)).length;
  assert.ok(repeated<=Math.ceil(said[i].length/2),'bout '+(i+1)+' is not a re-run of bout '+i+
   ' ('+repeated+'/'+said[i].length+' lines) in '+r.opts.w+' vs '+r.opts.f+
   '; repeated verbatim: '+JSON.stringify(said[i].filter(line=>said[i-1].includes(line))));
 }
 assert.equal(r.bouts[0].promo.case,null,'the first meeting does not argue about a history it does not have');
 for(const b of r.bouts.slice(1)){
  assert.ok(b.promo.case,'every rematch argues about something on the record');
  const fact=b.profile.facts.find(f=>b.promo.case.factId===f.id);assert.ok(fact,'the argument cites a real fact');
  if(fact.cid)assert.ok(r.bouts.some(x=>x.c.id===fact.cid),'from a bout that happened');
  callbacks++;issues.add(b.promo.case.issue);resolutions.add(b.promo.case.resolution);
  stances.add(b.profile.stance.w+'/'+b.profile.stance.f);
  if(b.sheet?.negotiation)negotiated++;
  assert.ok(!b.dup,'no consequence is applied twice');
  assert.doesNotMatch(JSON.stringify(b.promo.dialogue)+JSON.stringify(b.roomLog),clean);
 }
 // Nothing said on air reads out a backstage memory.
 for(const b of r.bouts)assert.ok(b.promo.dialogue.every(d=>!/remembers being|dressing-room conversation|asked to lose/.test(d.line)),'backstage stays backstage');
}
assert.ok(issues.size>=5,'rivalries argue about different things: '+[...issues].join(', '));
assert.ok(resolutions.size>=3,'arguments end in different places: '+[...resolutions].join(', '));
assert.ok(stances.size>=3,'how they stand towards each other changes: '+[...stances].join(', '));
const gentle=runs[1].bouts.at(-1);
assert.ok(['respectful','cooperative'].includes(gentle.profile.stance.w),'two professionals can end up respecting each other');
assert.ok(negotiated>=1,'counter-proposals happen in real careers');

console.log('PASS rivalry v0.3.12: '+Object.keys(Riv.ISSUES).length+' argument issues in '+new Set(Object.values(Riv.ISSUES).map(x=>x.family)).size+' families ('+exchanges+' issue/register pairs); evidence-gated; claims, counterclaims and five distinct answers; exposure and revision; '+
 'counter-proposals change the signed sheet and keep the contract; credible refusals; no-cheating promises checked against the engine, once; legacy saves and mid-promo states; '+
 runs.length+' five-bout careers, '+callbacks+' rematches citing real facts, '+issues.size+' issues, '+resolutions.size+' resolutions, '+stances.size+' stances, '+negotiated+' negotiated sheets; deterministic');
