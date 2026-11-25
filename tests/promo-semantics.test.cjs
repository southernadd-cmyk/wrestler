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
for(const [key,claim] of Object.entries(S.reviewedExtension)){
 assert.ok(graphKeys.has(key),'new graph review must match a real source '+key);
 assert.equal(S.classify(key,null,false),null,'old scene keeps original policy');
 assert.equal(S.classify(key,null,true)?.claim,claim);
 assert.equal(S.classify(key.slice(0,-8)+'00000000',null,true),null,'unknown text stays unknown');
}
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
  assert.ok(!current.authoredId&&!current.composedId,'fallback remains graph dialogue');
  // Both literal and varied replies explicitly demand evidence. Verify the
  // new classification rather than requiring these replies to be unknown.
  assert.equal(current.semantic?.claim,'evidence');
  assert.equal(previous.semantic?.claim,'evidence');
  assert.equal(current.semantic?.kind,'claim');
  assert.equal(previous.semantic?.kind,'claim');
  const reviewCtx={...current.dialogueSlot,hasMouthpiece:false};
  const original=scene.core.dialogue.find(d=>M.reviewedFallbackClaim(scene,reviewCtx,current,d)?.source===current.semantic.source);
  assert.ok(original,'reviewed fallback must match the actual graph source');
  assert.equal(M.reviewedFallbackClaim(scene,reviewCtx,{...current,line:'Unreviewed substitution.'},original),null);
  const legacy=clone(scene);delete legacy.semantic.claimClassification;
  assert.equal(M.reviewedFallbackClaim(legacy,reviewCtx,current,original),null);
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
// G3D: named identities and delivery families must not borrow each
// other's voices, invent a claim, or displace evidence-sensitive speech.
const namedRebutters=['mara','rex','juno','kit','ezra','red','roxy','silas','nova','ace','faye','tori'];
for(const claim of ['unclassified','proof','pace','legitimacy']){
 const wording=new Set();
 for(const actor of namedRebutters){
  const s=clone(probe);s.semantic.characterRebuttal=1;s.log=[{side:'f',line:'Previous spoken point.',...(claim==='unclassified'?{}:{semantic:{kind:'claim',claim}})}];
  const c={...ctx,stage:'answer',action:'turn',side:'w',speaker:{...ctx.speaker,id:actor},voice:root.OfficeRoom.VOICE[actor]||'stoic',protected:'contextual-variant'};
  const line=S.select(s,c),old=clone(s);delete old.semantic.characterRebuttal;
  const prior=S.select(old,c);
  assert.ok(line&&prior);assert.notEqual(line.text,prior.text);
  assert.equal(line.semantic.claim,prior.semantic.claim);assert.equal(line.semantic.replyTo,0);assert.equal(line.semantic.move,'rebut');
  assert.match(line.id,/\.g3d\./);assert.ok(!/[{}]/.test(line.text));wording.add(line.text);
  const next=clone(s);next.authoredDialogue.composedUsed=[line.id];assert.notEqual(S.select(next,c).id,line.id,'fresh candidate beats repeated character line');
  const protectedScene=clone(s);protectedScene.core.claim.hasEvidence=true;assert.equal(S.select(protectedScene,c),null);
  assert.equal(JSON.stringify(S.select(clone(s),c)),JSON.stringify(line));
 }
 if(['unclassified','proof'].includes(claim))assert.equal(wording.size,namedRebutters.length,'distinct named identities '+claim);
 else assert.ok(wording.size>=3,'family differentiation '+claim);
}
// All reviewed reuse entries refer to an existing bank row, not copied
// wording. Exercise the actual owner/side and reject stale text and recent IDs.
const bankRows=new Map(built.packs.flatMap(p=>p.lines.map(row=>[row.id,{row,pack:p}])));
let reuseFixtures=0;const reuseCoverage=new Map();
for(const [id,rule] of Object.entries(L.reviewedBankReuseV2)){
 const found=bankRows.get(id);assert.ok(found,'stale bank reuse ID '+id);
 const {row,pack}=found;
 const cat=L.catalogue([{...pack,lines:[row]}]);
 for(const claim of rule.slice(1)){
  const context={...ctx,stage:'answer',action:'turn',side:row.side,speaker:{...ctx.speaker,id:pack.owner,role:'wrestler'},protected:'contextual-variant',variant:'tu_strength',hasMouthpiece:false};
  const sem={move:row.side==='w'?'rebut':'counter',claim};
  const own=L.selectReviewedBankResponse(cat,context,'reuse-fixture',{},sem,2);
  assert.equal(own?.id,id,'reviewed source reachable '+id+' '+claim);
  assert.equal(own.text,row.text);assert.equal(own.bankReuse.variant,row.when.variants[0]);
  assert.equal(L.selectReviewedBankResponse(cat,context,'reuse-fixture',{recent:[id]},sem,2),null);
  assert.equal(L.selectReviewedBankResponse(cat,context,'reuse-fixture',{used:[id]},sem,2),null);
  for(const patch of [{protected:'recorded-evidence'},{hasMouthpiece:true},{speaker:{...context.speaker,id:'other'}}])assert.equal(L.selectReviewedBankResponse(cat,{...context,...patch},'reuse-fixture',{},sem,2),null);
  assert.equal(L.selectReviewedBankResponse(cat,context,'reuse-fixture',{}, {...sem,claim:'unreviewed'},2),null);
  const stale=L.catalogue([{...pack,lines:[{...row,text:row.text+'!'}]}]);
  assert.equal(L.selectReviewedBankResponse(stale,context,'reuse-fixture',{},sem,2),null);
  const previous=L.selectReviewedBankResponse(cat,context,'reuse-fixture',{},sem,1);
  if(L.reviewedBankReuse[id]?.slice(1).includes(claim))assert.equal(previous?.id,id,'previous snapshot retains approved line');
  else assert.equal(previous,null,'previous snapshot does not acquire new approvals');
  if(!reuseCoverage.has(pack.owner))reuseCoverage.set(pack.owner,new Set());
  reuseCoverage.get(pack.owner).add(row.side);
  reuseFixtures++;
 }
}
assert.ok(reuseFixtures>300);
for(const w of D.ALL){assert.ok(reuseCoverage.get(w.id)?.has('w'),'missing player bank reuse '+w.id);assert.ok(reuseCoverage.get(w.id)?.has('f'),'missing opponent bank reuse '+w.id);}
console.log('PASS full-roster bank reuse: '+D.ALL.length+' characters with both player and opponent coverage.');
console.log('PASS reviewed bank reuse: '+reuseFixtures+' exact existing bank/claim fixtures, owner, evidence, history and changed-text guards.');
let recoveryFixtures=0;
for(const [id,rule] of Object.entries(L.bankReuseRecovery)){
 const found=bankRows.get(id);assert.ok(found,'unknown recovered bank ID '+id);
 const {row,pack}=found,cat=L.catalogue([{...pack,lines:[row]}]);
 for(const claim of rule.slice(1)){
  const context={...ctx,stage:'answer',action:'turn',side:row.side,speaker:{...ctx.speaker,id:pack.owner,role:'wrestler'},protected:'contextual-variant',variant:'tu_strength',hasMouthpiece:false};
  const sem={move:row.side==='w'?'rebut':'counter',claim};
  const own=L.selectReviewedBankResponse(cat,context,'recovery-fixture',{},sem,3);
  assert.equal(own?.id,id,'recovered source must be reachable '+id+' '+claim);
  assert.equal(own.text,row.text);assert.equal(own.bankReuse.variant,row.when.variants[0]);
  assert.equal(L.selectReviewedBankResponse(cat,context,'recovery-fixture',{},sem,2),null,'old snapshot retains previous approvals');
  for(const mem of [{used:[id]},{recent:[id]}])assert.equal(L.selectReviewedBankResponse(cat,context,'recovery-fixture',mem,sem,3),null);
  for(const patch of [{protected:'recorded-evidence'},{hasMouthpiece:true},{speaker:{...context.speaker,id:'other'}},{side:row.side==='w'?'f':'w'}])assert.equal(L.selectReviewedBankResponse(cat,{...context,...patch},'recovery-fixture',{},sem,3),null);
  assert.equal(L.selectReviewedBankResponse(cat,context,'recovery-fixture',{}, {...sem,claim:'unreviewed'},3),null);
  const stale=L.catalogue([{...pack,lines:[{...row,text:row.text+'!'}]}]);
  assert.equal(L.selectReviewedBankResponse(stale,context,'recovery-fixture',{},sem,3),null);
  recoveryFixtures++;
 }
}
console.log('PASS G4B2 reviewed recovery: '+recoveryFixtures+' exact owner/side/topic approvals, history, evidence and altered-text guards.');
let specialistFixtures=0;
for(const [id,[fingerprint,kind]] of Object.entries(L.specialistReview)){
 const found=bankRows.get(id);assert.ok(found,'missing specialist source '+id);
 const {row,pack}=found,cat=L.catalogue([{...pack,lines:[row]}]);
 const strength=kind==='strength',press=kind==='press',settle=kind==='settle';
 const context={...ctx,stage:strength?'answer':'push',action:strength?'turn':press?'press':'acknowledge',side:row.side,speaker:{...ctx.speaker,id:pack.owner,role:'wrestler'},protected:strength?'contextual-variant':null,variant:strength?'tu_record':null,hasMouthpiece:false,strength:'hard strikes'};
 const sem={move:strength?'rebut':press?'press':settle?'settle':'acknowledge',claim:strength?'strength':press?'evidence':settle?'end':'agreement',...(strength?{detail:'speed and aerial attacks'}:{})};
 const own=L.selectSpecialistResponse(cat,context,'specialist-fixture',{},sem);
 assert.equal(own?.id,id,'specialist fixture '+id);assert.equal(own.specialist,kind);
 assert.equal(own.text,strength?row.text.replace(/\{strength\}/g,sem.detail):row.text);
 for(const mem of [{used:[id]},{recent:[id]}])assert.equal(L.selectSpecialistResponse(cat,context,'specialist-fixture',mem,sem),null);
 for(const patch of [{protected:'recorded-evidence'},{protected:'recorded-argument'},{hasMouthpiece:true},{speaker:{...context.speaker,id:'other'}},{side:row.side==='w'?'f':'w'}])assert.equal(L.selectSpecialistResponse(cat,{...context,...patch},'specialist-fixture',{},sem),null);
 const stale=L.catalogue([{...pack,lines:[{...row,text:row.text+'!'}]}]);
 assert.equal(L.selectSpecialistResponse(stale,context,'specialist-fixture',{},sem),null);
 if(strength){
  assert.equal(L.selectSpecialistResponse(cat,context,'specialist-fixture',{}, {...sem,detail:null}),null);
  assert.equal(L.selectSpecialistResponse(cat,context,'specialist-fixture',{}, {...sem,claim:'unclassified'}),null);
  assert.doesNotMatch(own.text,/hard strikes/);
 }else if(kind==='acknowledge')assert.equal(L.selectSpecialistResponse(cat,context,'specialist-fixture',{}, {...sem,claim:'evidence'}),null);
 specialistFixtures++;
}
const crossVariant=L.selectSpecialistResponse(ownCat,{...ownCtx,variant:'tu_record'},'strength-cross-variant',{},actual);
assert.ok(crossVariant);assert.match(crossVariant.text,/speed and aerial attacks/);assert.doesNotMatch(crossVariant.text,/hard strikes/);
console.log('PASS G4B3 specialist fixtures: '+specialistFixtures+' original source approvals and named-strength cross-variant, history, context and source guards.');
const topicRows=[...bankRows.values()].filter(({row})=>row.when.semanticClaim==='evidence'&&row.stage==='answer');
assert.equal(topicRows.length,320,'G4C.1–8 new authored lines');
const topicOwners=new Map(),topicText=new Set();
for(const {row,pack} of topicRows){
 const cat=L.catalogue([{...pack,lines:[row]}]),context={...ctx,stage:'answer',action:'turn',side:row.side,speaker:{...ctx.speaker,id:pack.owner,role:'wrestler'},protected:'contextual-variant',variant:'tu_strength',hasMouthpiece:false};
 const sem={claim:'evidence',move:row.side==='w'?'rebut':'counter'};
 assert.ok(!topicText.has(row.text),'duplicate authored topic text');topicText.add(row.text);
 if(!topicOwners.has(pack.owner))topicOwners.set(pack.owner,{w:0,f:0});topicOwners.get(pack.owner)[row.side]++;
 assert.equal(L.selectAuthoredTopic(cat,context,'topic',{},sem)?.id,row.id);
 assert.equal(L.select(cat,{...context,protected:null,variant:null},'ordinary',{}),null,'topic rows cannot leak into ordinary graph slots');
 for(const mem of [{used:[row.id]},{recent:[row.id]}])assert.equal(L.selectAuthoredTopic(cat,context,'topic',mem,sem),null);
 for(const patch of [{protected:'recorded-evidence'},{protected:'recorded-argument'},{hasMouthpiece:true},{speaker:{...context.speaker,id:'other'}},{side:row.side==='w'?'f':'w'},{stage:'open'},{action:'calm'}])assert.equal(L.selectAuthoredTopic(cat,{...context,...patch},'topic',{},sem),null);
 assert.equal(L.selectAuthoredTopic(cat,context,'topic',{}, {...sem,claim:'proof'}),null);
}
assert.equal(topicOwners.size,80);
assert.deepEqual([...topicOwners.keys()].sort(),Array.from(D.ALL,w=>w.id).sort(),'every original wrestler has a dedicated evidence bank');
for(const counts of topicOwners.values()){assert.equal(counts.w,2);assert.equal(counts.f,2);}
console.log('PASS G4C8 topic banks: '+topicRows.length+' distinct original-owner evidence replies; '+topicOwners.size+' characters, two lines per side, scope and history guards.');
const followupRows=[...bankRows.values()].filter(({row})=>row.when.semanticClaim==='evidence'&&row.stage==='push'&&row.side==='f');
assert.equal(followupRows.length,160);
const followupOwners=new Map();
for(const {row,pack} of followupRows){
 assert.ok(!topicText.has(row.text));topicText.add(row.text);
 assert.equal(row.side,'f');assert.equal(row.action,'press');
 followupOwners.set(pack.owner,(followupOwners.get(pack.owner)||0)+1);
 const cat=L.catalogue([{...pack,lines:[row]}]),context={...ctx,stage:'push',action:'press',side:'f',speaker:{...ctx.speaker,id:pack.owner,role:'wrestler'},protected:null,variant:null,hasMouthpiece:false};
 const sem={claim:'evidence',move:'press_counter'};
 assert.equal(L.selectAuthoredFollowup(cat,context,'followup',{},sem)?.id,row.id);
 assert.equal(L.select(cat,context,'ordinary',{}),null);
 assert.equal(L.selectAuthoredTopic(cat,context,'answer',{},sem),null);
 for(const mem of [{used:[row.id]},{recent:[row.id]}])assert.equal(L.selectAuthoredFollowup(cat,context,'followup',mem,sem),null);
 for(const patch of [{protected:'recorded-evidence'},{protected:'contextual-variant'},{hasMouthpiece:true},{speaker:{...context.speaker,id:'other'}},{side:'w'},{stage:'answer'},{action:'acknowledge'}])assert.equal(L.selectAuthoredFollowup(cat,{...context,...patch},'followup',{},sem),null);
 for(const patch of [{claim:'proof'},{move:'counter'},{move:'press'}])assert.equal(L.selectAuthoredFollowup(cat,context,'followup',{}, {...sem,...patch}),null);
}
assert.equal(followupOwners.size,80);assert.deepEqual([...followupOwners.keys()].sort(),["ace","aisha","alina","anya","ari","ash","ayla","bao","bashir","brick","bronte","cal","cass","cedric","cleo","dax","dean","dee","dev","eira","ellis","elodie","emmett","ezra","faye","felix","gideon","gus","imani","iris","ivo","jett","jun","juno","kellan","kezia","kira","kit","kofi","leandro","liya","lyra","mae","magnus","malik","mara","marisol","milo","miro","morgan","nadia","nate","nico","night","nikita","noelle","nolan","nova","otis","priya","red","rev","rex","rina","rocco","roxy","sasha","silas","sol","soraya","sylvia","theo","tomas","tomasash","tori","val","vera","winnie","zane","zara"]);for(const n of followupOwners.values())assert.equal(n,2);
console.log('PASS G4D8 authored follow-up fixtures: 160 evidence press counters across eighty owners; scope, history and ordinary-slot guards.');
const questionRows=[...bankRows.values()].filter(({row})=>row.when.semanticClaim==='evidence'&&row.stage==='push'&&row.action==='press'&&row.side==='w');
assert.equal(questionRows.length,160);const questionOwners=new Map();
for(const {row,pack} of questionRows){
 assert.ok(!topicText.has(row.text));topicText.add(row.text);assert.equal(row.action,'press');assert.ok(row.text.endsWith('?'));
 questionOwners.set(pack.owner,(questionOwners.get(pack.owner)||0)+1);
 const cat=L.catalogue([{...pack,lines:[row]}]),context={...ctx,stage:'push',action:'press',side:'w',speaker:{...ctx.speaker,id:pack.owner,role:'wrestler'},protected:null,variant:null,hasMouthpiece:false};const sem={claim:'evidence',move:'press'};
 assert.equal(L.selectAuthoredQuestion(cat,context,'question',{},sem)?.id,row.id);assert.equal(L.select(cat,context,'ordinary',{}),null);assert.equal(L.selectAuthoredFollowup(cat,context,'reply',{},sem),null);
 for(const mem of [{used:[row.id]},{recent:[row.id]}])assert.equal(L.selectAuthoredQuestion(cat,context,'question',mem,sem),null);
 for(const patch of [{protected:'recorded-evidence'},{protected:'recorded-argument'},{protected:'contextual-variant'},{hasMouthpiece:true},{speaker:{...context.speaker,id:'other'}},{side:'f'},{stage:'answer'},{action:'acknowledge'}])assert.equal(L.selectAuthoredQuestion(cat,{...context,...patch},'question',{},sem),null);
 for(const patch of [{claim:'proof'},{move:'counter'},{move:'press_counter'}])assert.equal(L.selectAuthoredQuestion(cat,context,'question',{}, {...sem,...patch}),null);
}
assert.deepEqual([...questionOwners.keys()].sort(),[...followupOwners.keys()].sort());assert.equal(questionOwners.size,80);for(const n of questionOwners.values())assert.equal(n,2);
console.log('PASS G4E8 authored evidence question fixtures: 160 scoped questions across all 80 original owners.');
const evidenceAckRows=[...bankRows.values()].filter(({row})=>row.when.semanticClaim==='evidence'&&row.stage==='push'&&row.action==='acknowledge');
assert.equal(evidenceAckRows.length,160);const evidenceAckOwners=new Map();
for(const {row,pack} of evidenceAckRows){
 assert.ok(!topicText.has(row.text));topicText.add(row.text);assert.equal(row.side,'w');assert.equal(row.category,'respect');
 evidenceAckOwners.set(pack.owner,(evidenceAckOwners.get(pack.owner)||0)+1);
 const cat=L.catalogue([{...pack,lines:[row]}]),context={...ctx,stage:'push',action:'acknowledge',side:'w',speaker:{...ctx.speaker,id:pack.owner,role:'wrestler'},protected:null,variant:null,hasMouthpiece:false};
 const sem={claim:'evidence',move:'acknowledge'};
 const own=L.selectAuthoredEvidenceAcknowledgement(cat,context,'evidence-ack',{},sem);assert.equal(own?.id,row.id);assert.equal(own.text,row.text);
 assert.equal(L.select(cat,context,'ordinary',{}),null);assert.equal(L.selectAcknowledgement(cat,context,'neutral',{}),null);
 for(const mem of [{used:[row.id]},{recent:[row.id]}])assert.equal(L.selectAuthoredEvidenceAcknowledgement(cat,context,'evidence-ack',mem,sem),null);
 for(const patch of [{protected:'recorded-evidence'},{protected:'recorded-argument'},{protected:'contextual-variant'},{hasMouthpiece:true},{speaker:{...context.speaker,id:'other'}},{side:'f'},{stage:'answer'},{action:'press'}])assert.equal(L.selectAuthoredEvidenceAcknowledgement(cat,{...context,...patch},'evidence-ack',{},sem),null);
 for(const patch of [{claim:'proof'},{move:'rebut'},{move:'settle'}])assert.equal(L.selectAuthoredEvidenceAcknowledgement(cat,context,'evidence-ack',{}, {...sem,...patch}),null);
}
assert.deepEqual([...evidenceAckOwners.keys()].sort(),[...questionOwners.keys()].sort());assert.equal(evidenceAckOwners.size,80);for(const n of evidenceAckOwners.values())assert.equal(n,2);
console.log('PASS G4G6 evidence acknowledgement fixtures: 160 authored replies across all 80 original owners, scope, owner, history and ordinary-slot guards.');
const strengthRows=[...bankRows.values()].filter(({row})=>row.when.semanticClaim==='strength');
assert.equal(strengthRows.length,160);const strengthOwners=new Map();
for(const {row,pack} of strengthRows){
 assert.ok(!topicText.has(row.text));topicText.add(row.text);assert.equal(row.side,'f');assert.equal(row.stage,'answer');assert.equal(row.action,'turn');
 strengthOwners.set(pack.owner,(strengthOwners.get(pack.owner)||0)+1);
 const cat=L.catalogue([{...pack,lines:[row]}]),context={...ctx,stage:'answer',action:'turn',side:'f',speaker:{...ctx.speaker,id:pack.owner,role:'wrestler'},protected:'contextual-variant',variant:'tu_strength',hasMouthpiece:false,strength:'hard strikes'};
 const sem={claim:'strength',move:'counter',detail:'speed and aerial attacks'};
 const own=L.selectAuthoredStrengthCounter(cat,context,'strength-counter',{},sem);assert.equal(own?.id,row.id);assert.equal(own.text,row.text.replace(/\{strength\}/g,sem.detail));assert.doesNotMatch(own.text,/hard strikes/);
 assert.equal(L.select(cat,{...context,protected:null,variant:null},'ordinary',{}),null);assert.equal(L.selectAuthoredTopic(cat,context,'evidence',{},sem),null);
 for(const mem of [{used:[row.id]},{recent:[row.id]}])assert.equal(L.selectAuthoredStrengthCounter(cat,context,'strength-counter',mem,sem),null);
 for(const patch of [{protected:'recorded-evidence'},{protected:'recorded-argument'},{hasMouthpiece:true},{speaker:{...context.speaker,id:'other'}},{side:'w'},{stage:'push'},{action:'calm'}])assert.equal(L.selectAuthoredStrengthCounter(cat,{...context,...patch},'strength-counter',{},sem),null);
 for(const patch of [{claim:'proof'},{move:'rebut'},{move:'press_counter'},{detail:null}])assert.equal(L.selectAuthoredStrengthCounter(cat,context,'strength-counter',{}, {...sem,...patch}),null);
}
assert.deepEqual([...strengthOwners.keys()].sort(),[...questionOwners.keys()].sort());assert.equal(strengthOwners.size,80);for(const n of strengthOwners.values())assert.equal(n,2);
console.log('PASS G4F8 strength counter fixtures: 160 dedicated replies across all 80 original owners, actual spoken strength, owner, slot and history guards.');
const roster=D.ALL,opponents=D.FOES;
let scenes=0,responded=0,counters=0,press=0,unclassified=0,protectedN=0,authoredSources=0,graphSources=0,authoredResponses=0;
const ackIds=new Set(),pressIds=new Set();let authoredPress=0,authoredRebut=0;
let liveReuse=0;const liveReuseIds=new Set();
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
   if(sem.source.startsWith('fallback:')){
    assert.ok(!e.authoredId&&!e.composedId);
    const slot=e.dialogueSlot,ctx={...slot,hasMouthpiece:false};
    const original=x.core.dialogue.find(d=>M.reviewedFallbackClaim(x,ctx,e,d)?.source===sem.source);
    assert.ok(original,'fallback claim must trace to exact existing graph/display source');
    assert.equal(JSON.stringify(M.reviewedFallbackClaim(x,ctx,e,original)),JSON.stringify(sem));
    assert.equal(M.reviewedFallbackClaim(x,ctx,{...e,line:'Unreviewed substitution.'},original),null);
    assert.equal(M.reviewedFallbackClaim(x,ctx,e,{...original,line:'Different original.'}),null);
    const old=clone(x);delete old.semantic.claimClassification;assert.equal(M.reviewedFallbackClaim(old,ctx,e,original),null);
   }
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
     if(sem.evidenceAcknowledgementBank===1){
      const found=bankRows.get(e.authoredId);assert.ok(found&&found.row.when.semanticClaim==='evidence');assert.equal(sem.claim,'evidence');assert.equal(sem.move,'acknowledge');assert.equal(e.side,'w');assert.equal(e.dialogueSlot.stage,'push');assert.equal(e.dialogueSlot.action,'acknowledge');assert.equal(found.pack.owner,e.dialogueSlot.owner);assert.equal(e.line,found.row.text);
     }else if(sem.strengthCounterBank===1){
      const found=bankRows.get(e.authoredId);assert.ok(found&&found.row.when.semanticClaim==='strength');assert.equal(sem.claim,'strength');assert.equal(sem.move,'counter');assert.equal(e.side,'f');assert.equal(e.dialogueSlot.stage,'answer');assert.equal(e.dialogueSlot.action,'turn');assert.equal(found.pack.owner,e.dialogueSlot.owner);assert.equal(sem.detail,prior.semantic?.detail);assert.equal(e.line,found.row.text.replace(/\{strength\}/g,sem.detail==='wrestling'?'wrestling techniques':sem.detail));
     }else if(sem.questionBank===1){
      const found=bankRows.get(e.authoredId);assert.ok(found&&found.row.when.semanticClaim==='evidence');assert.equal(sem.claim,'evidence');assert.equal(sem.move,'press');assert.equal(e.side,'w');assert.equal(e.dialogueSlot.stage,'push');assert.equal(e.dialogueSlot.action,'press');assert.equal(found.pack.owner,e.dialogueSlot.owner);assert.equal(e.line,found.row.text);assert.ok(e.line.endsWith('?'));assert.ok(x.authoredDialogue.composedUsed.includes(sem.questionSource));authoredPress++;pressIds.add(e.authoredId);
     }else if(sem.followupBank===1){
      const found=bankRows.get(e.authoredId);assert.ok(found&&found.row.when.semanticClaim==='evidence');assert.equal(sem.claim,'evidence');assert.equal(sem.move,'press_counter');assert.equal(prior.semantic?.move,'press');assert.equal(e.dialogueSlot.stage,'push');assert.equal(e.dialogueSlot.action,'press');assert.equal(e.side,'f');assert.equal(found.pack.owner,e.dialogueSlot.owner);assert.equal(e.line,found.row.text);
     }else if(sem.topicBank===1){
      const found=bankRows.get(e.authoredId);assert.ok(found&&found.row.when.semanticClaim===sem.claim);assert.equal(sem.claim,'evidence');assert.equal(e.dialogueSlot.stage,'answer');assert.equal(e.dialogueSlot.action,'turn');assert.equal(found.pack.owner,e.dialogueSlot.owner);assert.equal(found.row.side,e.side);assert.equal(e.line,found.row.text);
     }else if(sem.bankReuse){
      assert.equal(e.dialogueSlot.action,'turn');assert.equal(e.dialogueSlot.stage,'answer');
      const found=bankRows.get(e.authoredId);assert.ok(found&&L.reviewedBankReuseV3[e.authoredId]?.slice(1).includes(sem.claim));
      assert.equal(found.pack.owner,e.dialogueSlot.owner);assert.equal(found.row.side,e.side);
      assert.equal(e.line,found.row.text);assert.equal(sem.bankReuse.stage,found.row.stage);assert.equal(sem.bankReuse.action,found.row.action);
      assert.ok(found.row.when.variants.includes(sem.bankReuse.variant));
      liveReuse++;liveReuseIds.add(e.authoredId);
     }else if(e.dialogueSlot.action==='acknowledge'){
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
// Live reach is gated on the broader 1,280-scene quality benchmark; this independent semantic sample still verifies parity for every press exchange.
assert.ok(followupPairs>0,'G3B semantic sample must exercise press');
console.log('PASS G3B rival follow-up: '+followupChanges+' changed turns in '+followupPairs+' paired press exchanges; '+followupSpeakers.size+' speakers; claims '+[...followupClaims].join(', ')+'; graph, effects, options and semantic provenance retained.');
console.log('Bank reuse semantic sample: '+liveReuse+' existing authored utterances, '+liveReuseIds.size+' distinct IDs.');
assert.ok(responded>100&&counters>100&&press>0&&authoredSources>0&&graphSources>0&&unclassified>0&&reached.size>=8);
assert.ok(authoredResponses>0&&ackIds.size>3,'reviewed authored acknowledgements are reachable');
assert.ok(authoredPress>0&&pressIds.size>1,'reviewed character press lines reached');
console.log('PASS reviewed contextual responses: '+authoredPress+' authored press lead-ins ('+pressIds.size+' distinct), '+authoredRebut+' explicitly named strength rebuttals in live sample; direct strength fixture passed.');
console.log('PASS reviewed authored acknowledgements: '+authoredResponses+' utterances, '+ackIds.size+' distinct IDs; semantic provenance preserved.');
console.log('PASS semantic promos: '+scenes+' paired scenes; '+responded+' classified responses across '+reached.size+' reached topics, '+unclassified+' unclassified responses, '+counters+' counters, '+press+' presses, '+authoredSources+' authored and '+graphSources+' graph claim sources; '+protectedN+' protected slots; save/resume and numerical/contract parity.');
