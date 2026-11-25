'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const {check}=require('../scripts/build-promo-banks.cjs');
const root={addEventListener(){}},store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console});
const {OfficePromoSemantics:S,OfficePromoDialogue:L,OfficeMic:M,OfficeData:D,OfficeStory:{Graph}}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),p=D.PROMOS[0];
// Verify every fingerprint against actual source text, not a guessed variant label.
const graphKeys=new Set();
for(const groups of Object.values(Graph.VARIANTS))for(const variants of Object.values(groups))for(const v of variants)for(const line of v.reply)graphKeys.add(S.source(v.id,line));
const bankKeys=new Set(),built=check();
for(const pack of built.packs)for(const row of pack.lines){
 const key='bank:'+row.id+':'+root.OfficePromoBanks.hash(row.text);bankKeys.add(key);
 if(S.reviewed[key]){assert.equal(row.side,'f');assert.equal(S.fromBank(row.id,row.text).claim,S.reviewed[key]);assert.equal(S.fromBank(row.id,row.text+'!'),null);}
}
for(const [key,tag] of Object.entries(S.reviewed)){assert.ok(graphKeys.has(key)||bankKeys.has(key),'stale reviewed source '+key);assert.ok(S.label(tag),'unknown claim '+tag);}
assert.equal(S.classify('graph:unknown:12345678'),null);
assert.equal(S.classify('__proto__'),null);
// Same opponent, same seed, same chosen swagger variant, different actual line:
// the graph questions the wrestler's legitimacy while Magnus's authored line
// invites the audience to decide. The response must follow the emitted source.
const w=D.ALL.find(x=>x.id==='mara'),f=D.ALL.find(x=>x.id==='magnus');
const options={directed:true,formats:false,dialogue:true,authored:true,composition:true,semantic:true};
const contract=(w,f,i)=>({id:'semantic-'+w.id+'-'+f.id+'-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:i,finish:i%2?'win_clean':'lose_clean',minutes:12,feudHeat:i%3?0:55});
let contrasting=null;
for(let i=0;i<300&&!contrasting;i++){
 const c=contract(w,f,i),a=M.begin(c,w,f,null,null,p,{...options,banks:promoBanks(w.id,f.id)}),b=M.begin(c,w,f,null,null,p,{...options,banks:[]});
 if(Graph.variantFor(a.core,'open','swagger')?.id!=='sw_main'||!M.choices(a).some(o=>o.id==='swagger'))continue;
 M.choose(a,'swagger');M.choose(b,'swagger');
 const x=S.latest(a.log,'f')?.entry,y=S.latest(b.log,'f')?.entry;
 if(x?.semantic?.claim==='audience'&&y?.semantic?.claim==='legitimacy'&&M.choices(a).some(o=>o.id==='turn')&&M.choices(b).some(o=>o.id==='turn'))contrasting=[a,b];
}
assert.ok(contrasting,'same exact variant should expose differently tagged authored and graph replies');
const [a,b]=contrasting;assert.equal(a.f.id,b.f.id);assert.equal(a.seed,b.seed);
assert.notEqual(M.choices(a).find(o=>o.id==='turn')?.label,M.choices(b).find(o=>o.id==='turn')?.label);
M.choose(a,'turn');M.choose(b,'turn');
const rebut=st=>st.log.find(e=>e.semantic?.move==='rebut');
assert.equal(rebut(a).semantic.claim,'audience');assert.equal(rebut(b).semantic.claim,'legitimacy');assert.notEqual(rebut(a).line,rebut(b).line);
// The protected paths and old saves must not adopt the new replacement rules.
const probe=M.begin(contract(w,f,1),w,f,null,null,p,{...options,banks:[]});
M.choose(probe,M.choices(probe)[0].id);
const ctx=L.context(probe,'answer','turn','w',{variant:'tu_strength'});
for(const patch of [{case:{issue:'record'}},{claim:{hasEvidence:true}},{claim:{opening:'proof',planFocus:'counter'}}]){
 const protectedScene=clone(probe);Object.assign(protectedScene.core,patch);
 assert.equal(S.select(protectedScene,ctx),null);
 assert.equal(S.option(protectedScene,'answer','turn'),null);
}
const mouth=clone(probe);mouth.speaker={id:'mouth'};assert.equal(S.select(mouth,ctx),null);
const legacy=clone(probe);delete legacy.semantic;delete legacy.core.semanticSpeech;assert.equal(S.select(legacy,ctx),null);
// Unknown source remains unknown, even if a style-derived strength is available.
const unknown=clone(probe),last=S.latest(unknown.log,'f');delete last.entry.semantic;
const neutral=S.select(unknown,{...ctx,strength:'hard strikes'});
assert.equal(neutral.semantic.claim,'unclassified');assert.doesNotMatch(neutral.text,/hard strikes/);
// Explicitly named strength, not ctx's style-derived estimate, is required.
const ownCat=root.OfficePromoBanks.catalogue(promoBanks(w.id,f.id));
const actual={kind:'response',claim:'strength',detail:'speed and aerial attacks',move:'rebut'};
const ownCtx={...ctx,side:'w',stage:'answer',action:'turn',variant:'tu_strength',protected:'contextual-variant',hasMouthpiece:false,strength:'hard strikes'};
const named=L.selectSemanticResponse(ownCat,ownCtx,'strength-test',{},actual);
assert.ok(named);assert.match(named.text,/speed and aerial attacks/);assert.doesNotMatch(named.text,/hard strikes/);
for(const bad of [{...actual,claim:'unclassified'},{...actual,claim:'pace'},{...actual,detail:null}])assert.equal(L.selectSemanticResponse(ownCat,ownCtx,'strength-test',{},bad),null);
for(const patch of [{protected:'recorded-argument'},{protected:'recorded-evidence'},{hasMouthpiece:true},{variant:'tu_record'}])assert.equal(L.selectSemanticResponse(ownCat,{...ownCtx,...patch},'strength-test',{},actual),null);
const recent=L.selectSemanticResponse(ownCat,ownCtx,'strength-test',{recent:[named.id]},actual);
if(recent)assert.notEqual(recent.id,named.id);
// Opening interviewer questions now have an explicit answer before the argument.
const Dir=root.OfficePromoDirector;
for(const format of ['interview','faceoff','callout','address','mouthpiece']){
 const q=Dir.openingQuestion({format},null,Dir.setup({format}).prompt);
 for(const action of ['proof','people','swagger','accusation','imagery','hometown','numbers'])assert.ok(Dir.answerOpening(q,action),format+': '+action);
}
assert.equal(Dir.answerOpening(Dir.openingQuestion({format:'interview'},null,'Before you go out there, what does this match mean to you?'),'proof'),'It is a chance to show that my preparation counts.');
const titlePrompt='The champion is not in this match. Why should they be listening?';
assert.match(Dir.answerOpening(Dir.openingQuestion({format:'interview'},{prompt:titlePrompt},titlePrompt),'proof'),/case.*belt/);
const hostScene=M.begin(contract(w,f,17),w,f,null,null,p,{...options,formats:true,banks:promoBanks(w.id,f.id),arc:{id:'needle',step:0,prompt:titlePrompt,read:'Title chase'}});
M.choose(hostScene,M.choices(hostScene)[0].id);
const spoken=hostScene.log.find(e=>e.side==='w');assert.equal(spoken.answersQuestion.prompt,titlePrompt);
assert.match(spoken.line,/case.*belt/);assert.equal(spoken.answersQuestion.lead,Dir.answerOpening(hostScene.openingQuestion,hostScene.steps[0].id));
// All topic counters and pressed replies have a second meaningful wording.
const claims=new Set(Object.values(S.reviewed));claims.add('endurance_self');
let varied=0;
for(const claim of claims)for(const action of ['turn','press']){
 if(!S.label(claim))continue;
 const stage=action==='turn'?'answer':'push',lines=new Set(),previousLines=new Set();
 for(let i=0;i<24;i++){
  const scene=clone(probe);scene.seed='reply-variety-'+i;scene.semantic.variety=1;
  scene.log=[{side:'w',line:'A response to the point.',semantic:{kind:'response',claim,...(claim==='strength'?{detail:'hard strikes'}:{})}}];
  const context={...ctx,stage,action,side:'f',speaker:{...ctx.speaker,id:f.id},voice:'gruff'};
  const line=S.select(scene,context);
  assert.ok(line);assert.equal(line.semantic.claim,claim);assert.equal(line.semantic.replyTo,0);
  assert.ok(!/[{}]/.test(line.text));lines.add(line.text);
  delete scene.semantic.variety;
  const previous=S.select(scene,context);previousLines.add(previous.text);
 }
 assert.equal(previousLines.size,1,'legacy single frame '+claim+' '+action);
 assert.equal(lines.size,2,'both topic variants reachable '+claim+' '+action);
 varied++;
}
assert.ok(varied>=70);
console.log('PASS semantic variety: '+varied+' topic/move pools now have two reachable, claim-preserving wordings.');
// The two most common unclassified graph exceptions vary without changing
// the actual graph, its effects, or the provenance of reviewed claims.
const fallbackLines={open:new Set(),answer:new Set()},fallbackCounts={open:0,answer:0};
for(let i=0;i<240;i++){
 const c=contract(w,f,1000+i),scene=M.begin(c,w,f,null,null,p,{...options,formats:true,banks:[]}),old=clone(scene);
 delete old.fallbackVariety;
 if(!M.choices(scene).some(o=>o.id==='accusation'))continue;
 for(const stage of ['open','answer']){
  const id=stage==='open'?'accusation':'personal';
  if(!M.choices(scene).some(o=>o.id===id))break;
  const saved=clone(scene),at=scene.log.length;
  M.choose(scene,id);M.choose(old,id);M.choose(saved,id);
  assert.equal(JSON.stringify(scene),JSON.stringify(saved),'fallback resume');
  assert.equal(JSON.stringify(scene.core),JSON.stringify(old.core),'fallback cannot change underlying graph');
  const current=scene.log.slice(at).find(e=>e.side==='f'),previous=old.log.slice(at).find(e=>e.side==='f');
  if(!current||!previous||current.line===previous.line)continue;
  if(stage==='open')assert.match(previous.line,/never even worked a match/);
  else assert.match(previous.line,/still have no evidence/);
  assert.ok(!current.semantic&&!current.authoredId&&!current.composedId);
  assert.doesNotMatch(current.line,/never even worked|[{}]/);
  fallbackLines[stage].add(current.line);fallbackCounts[stage]++;
 }
 if(scene.stage==='done')continue;
 while(scene.stage!=='done'){
  const id=M.choices(scene)[0].id;
  M.choose(scene,id);M.choose(old,id);
 }
 for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature'])assert.equal(JSON.stringify(M.result(scene)[k]),JSON.stringify(M.result(old)[k]),'fallback parity '+k);
}
assert.ok(fallbackLines.open.size>=6&&fallbackLines.answer.size>=6,'both exception pools exercised');
console.log('PASS graph fallback variety: '+JSON.stringify(fallbackCounts)+' replacements; '+fallbackLines.open.size+'/'+fallbackLines.answer.size+' distinct opening/answer replies; graph and outcome parity.');
// G3B: reviewed questions and replies remain attached to the same topic.
const followupTopics=['unclassified','end','proof','agreement','terms','outside','count'];
for(const claim of followupTopics)for(const side of ['w','f']){
 const reached=new Set();
 for(let i=0;i<32;i++){
  const s=clone(probe);s.seed='g3b-fixture-'+i;s.semantic.variety=1;s.semantic.followupFlow=1;
  s.log=[{side:side==='w'?'f':'w',line:'Previous spoken point.',...(side==='w'&&claim==='unclassified'?{}:{semantic:{kind:side==='w'?'claim':'response',claim}})}];
  const c={...ctx,stage:'push',action:'press',side,speaker:{...ctx.speaker,id:side==='w'?w.id:f.id},voice:'gruff',protected:null};
  const current=S.select(s,c),old=clone(s);delete old.semantic.followupFlow;
  const previous=S.select(old,c);
  assert.ok(current&&previous);assert.notEqual(current.text,previous.text);
  assert.equal(current.semantic.claim,previous.semantic.claim);assert.equal(current.semantic.move,previous.semantic.move);assert.equal(current.semantic.replyTo,0);
  assert.match(current.id,/\.g3b\./);assert.ok(!/[{}]/.test(current.text));
  if(side==='w')assert.ok(current.text.endsWith('?'));
  assert.equal(JSON.stringify(S.select(clone(s),c)),JSON.stringify(current),'G3B deterministic selection');
  const protectedContext={...c,protected:'recorded-evidence'};
  assert.equal(JSON.stringify(S.select(s,protectedContext)),JSON.stringify(S.select(old,protectedContext)),'G3B must not vary protected wording');
  reached.add(current.text);
 }
 assert.ok(reached.size>=2,'G3B reach '+claim+' '+side);
}
const roster=D.ALL,opponents=D.FOES;
let scenes=0,responded=0,counters=0,press=0,unclassified=0,protectedN=0,authoredSources=0,graphSources=0,authoredResponses=0;
const ackIds=new Set(),pressIds=new Set();let authoredPress=0,authoredRebut=0;
let followupPairs=0,followupChanges=0;const followupSpeakers=new Set(),followupClaims=new Set();
const reached=new Set();
for(const [i,worker] of roster.entries())for(let j=0;j<12;j++){
 const foe=opponents.filter(x=>x.id!==worker.id)[(i+j)% (opponents.filter(x=>x.id!==worker.id).length)];
 const c=contract(worker,foe,i*12+j),promo=D.PROMOS[(i+j)%D.PROMOS.length];
 const opts={...options,formats:true,banks:promoBanks(worker.id,foe.id)};
 const x=M.begin(c,worker,foe,null,null,promo,opts),y=M.begin(c,worker,foe,null,null,promo,{...opts,semantic:false}),old=clone(x);delete old.semantic.variety;delete old.authoredDialogue.reviewedContext;
 while(x.stage!=='done'){
  const round=M.ROUNDS[x.round].id,choices=M.choices(x);
  assert.deepEqual(Array.from(choices,o=>o.id),Array.from(M.choices(y),o=>o.id));
  const desired=round==='open'?['proof','people','swagger','imagery','accusation','hometown','numbers'][j%7]:round==='answer'?j%4===0?'calm':'turn':round==='push'?j%2?'press':'acknowledge':['vow','clean','question','finisher','uncertainty'][j%5];
  const id=(choices.find(o=>o.id===desired)||choices[0]).id;
  const previousFollowup=round==='push'&&id==='press'?clone(x):null,at=x.log.length;
  if(previousFollowup){delete previousFollowup.semantic.followupFlow;M.choose(previousFollowup,id);}
  const saved=clone(x);M.choose(x,id);M.choose(y,id);M.choose(saved,id);M.choose(old,id);
  if(previousFollowup){
   followupPairs++;
   assert.equal(JSON.stringify(x.core),JSON.stringify(previousFollowup.core),'G3B graph parity');
   for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(x[k]),JSON.stringify(previousFollowup[k]),'G3B '+k);
   assert.equal(JSON.stringify(M.choices(x)),JSON.stringify(M.choices(previousFollowup)),'G3B next choices parity');
   const now=x.log.slice(at),before=previousFollowup.log.slice(at);
   assert.equal(JSON.stringify(now.filter(e=>!['w','f'].includes(e.side))),JSON.stringify(before.filter(e=>!['w','f'].includes(e.side))),'G3B crowd and stage parity');
   for(const side of ['w','f']){
    const a=now.find(e=>e.side===side),b=before.find(e=>e.side===side);
    if(!a||!b||a.line===b.line)continue;
    followupChanges++;followupSpeakers.add(side==='w'?worker.id:foe.id);followupClaims.add(a.semantic?.claim);
    for(const k of ['claim','move','replyTo','kind','detail'])assert.equal(a.semantic?.[k],b.semantic?.[k],'G3B unchanged semantic '+k);
    assert.equal(a.authoredId,b.authoredId,'G3B retains authored lead');
    assert.match(a.composedId||a.semantic?.questionSource||'',/\.g3b\./);
    assert.ok(!/[{}]/.test(a.line));
   }
  }
  assert.equal(JSON.stringify(x),JSON.stringify(saved),'semantic save/resume '+c.id);
 }
 const xr=M.result(x),yr=M.result(y),or=M.result(old);
 for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature'])assert.equal(JSON.stringify(xr[k]),JSON.stringify(or[k]),'wording parity '+k+' '+c.id);
 for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature'])assert.equal(JSON.stringify(xr[k]),JSON.stringify(yr[k]),k+' '+c.id);
 assert.equal(xr.duel.meter,yr.duel.meter);
 let previous=null;
 for(const [idx,e] of x.log.entries()){
  if(!['w','f'].includes(e.side))continue;
  const sem=e.semantic;
  if(e.dialogueSlot?.protected&&e.dialogueSlot.protected!=='contextual-variant'){assert.ok(!e.composedId?.startsWith('semantic.'));protectedN++;}
  if(sem){
   assert.ok(!/[{}]/.test(e.line),'unresolved semantic placeholder');
   assert.equal(JSON.stringify(xr.dialogue[idx].semantic),JSON.stringify(sem));
   if(sem.source.startsWith('bank:')){assert.ok(e.authoredId);assert.equal(S.fromBank(e.authoredId,e.line)?.claim,sem.claim);authoredSources++;}
   if(sem.source.startsWith('graph:')){
    assert.ok(!e.authoredId&&!e.composedId);
    const originals=x.core.dialogue.filter(d=>d.speechSource===sem.source);
    const exact=originals.some(d=>d.line===e.line);
    assert.ok(exact||originals.some(d=>M.reviewedOpponentVoice(x,d,e)),'graph speech must match its original or an exact reviewed speaker alternative');
    if(!exact){
     for(const d of originals){
      assert.equal(M.reviewedOpponentVoice(x,d,{...e,line:'An arbitrary unreviewed replacement.'}),false);
      assert.equal(M.reviewedOpponentVoice(x,d,{...e,semantic:{...sem,source:'graph:wrong:00000000'}}),false);
      assert.equal(M.reviewedOpponentVoice(x,d,{...e,authoredId:'unrelated'}),false);
      const legacy={...x};delete legacy.opponentVoiceStyle;
      assert.equal(M.reviewedOpponentVoice(legacy,d,e),false);
     }
    }
    graphSources++;
   }
   if(sem.replyTo!==undefined){
    assert.equal(sem.replyTo,previous,'reply must address immediately preceding spoken line');
    const prior=x.log[sem.replyTo];assert.notEqual(prior.side,e.side);if(sem.source.startsWith('authored-response:')){
     assert.equal(sem.source,'authored-response:'+e.authoredId);assert.ok(!e.composedId);
     if(e.dialogueSlot.action==='acknowledge'){
      assert.equal(e.dialogueSlot.stage,'push');assert.ok(!e.dialogueSlot.protected);assert.ok(e.side==='f'||['unclassified','agreement','end'].includes(sem.claim));
      authoredResponses++;ackIds.add(e.authoredId);
     }else if(e.dialogueSlot.action==='press'){
      assert.equal(e.dialogueSlot.stage,'push');assert.equal(e.side,'w');assert.ok(!e.dialogueSlot.protected);
      assert.ok(sem.questionSource?.startsWith('semantic.'));assert.ok(x.authoredDialogue.composedUsed.includes(sem.questionSource));
      assert.ok(e.line.endsWith('?'));authoredPress++;pressIds.add(e.authoredId);
     }else{
      assert.equal(e.dialogueSlot.action,'turn');assert.equal(e.side,'w');assert.equal(sem.claim,'strength');
      assert.equal(sem.detail,prior.semantic?.detail);assert.ok(e.line.includes(sem.detail));authoredRebut++;
     }
    }else assert.equal(e.composedId,sem.source);
    if(e.side==='w'){
     assert.equal(sem.claim,prior.semantic?.claim||'unclassified');
     if(sem.claim==='unclassified')unclassified++;else{responded++;reached.add(sem.claim);}
     if(sem.move==='press')press++;
    }else counters++;
   }
  }
  previous=idx;
 }
 scenes++;
}
assert.ok(followupPairs>0&&followupChanges>10&&followupSpeakers.size>5&&followupClaims.size>=2,'G3B live dialogue reach');
console.log('PASS G3B rival follow-up: '+followupChanges+' changed turns in '+followupPairs+' paired press exchanges; '+followupSpeakers.size+' speakers; claims '+[...followupClaims].join(', ')+'; graph, effects, options and semantic provenance retained.');
assert.ok(responded>100&&counters>100&&press>0&&authoredSources>0&&graphSources>0&&unclassified>0&&reached.size>=8);
assert.ok(authoredResponses>0&&ackIds.size>3,'reviewed authored acknowledgements are reachable');
assert.ok(authoredPress>0&&pressIds.size>1,'reviewed character press lines reached');
console.log('PASS reviewed contextual responses: '+authoredPress+' authored press lead-ins ('+pressIds.size+' distinct), '+authoredRebut+' explicitly named strength rebuttals in live sample; direct strength fixture passed.');
console.log('PASS reviewed authored acknowledgements: '+authoredResponses+' utterances, '+ackIds.size+' distinct IDs; semantic provenance preserved.');
console.log('PASS semantic promos: '+scenes+' paired scenes; '+responded+' classified responses across '+reached.size+' reached topics, '+unclassified+' unclassified responses, '+counters+' counters, '+press+' presses, '+authoredSources+' authored and '+graphSources+' graph claim sources; '+protectedN+' protected slots; save/resume and numerical/contract parity.');
