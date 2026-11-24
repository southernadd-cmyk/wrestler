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
 if(x?.semantic?.claim==='audience'&&y?.semantic?.claim==='legitimacy')contrasting=[a,b];
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
const roster=D.ALL,opponents=D.FOES;
let scenes=0,responded=0,counters=0,press=0,unclassified=0,protectedN=0,authoredSources=0,graphSources=0;
const reached=new Set();
for(const [i,worker] of roster.entries())for(let j=0;j<12;j++){
 const foe=opponents.filter(x=>x.id!==worker.id)[(i+j)% (opponents.filter(x=>x.id!==worker.id).length)];
 const c=contract(worker,foe,i*12+j),promo=D.PROMOS[(i+j)%D.PROMOS.length];
 const opts={...options,formats:true,banks:promoBanks(worker.id,foe.id)};
 const x=M.begin(c,worker,foe,null,null,promo,opts),y=M.begin(c,worker,foe,null,null,promo,{...opts,semantic:false});
 while(x.stage!=='done'){
  const round=M.ROUNDS[x.round].id,choices=M.choices(x);
  assert.deepEqual(Array.from(choices,o=>o.id),Array.from(M.choices(y),o=>o.id));
  const desired=round==='open'?['proof','people','swagger','imagery','accusation','hometown','numbers'][j%7]:round==='answer'?j%4===0?'calm':'turn':round==='push'?j%2?'press':'acknowledge':['vow','clean','question','finisher','uncertainty'][j%5];
  const id=(choices.find(o=>o.id===desired)||choices[0]).id;
  const saved=clone(x);M.choose(x,id);M.choose(y,id);M.choose(saved,id);
  assert.equal(JSON.stringify(x),JSON.stringify(saved),'semantic save/resume '+c.id);
 }
 const xr=M.result(x),yr=M.result(y);
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
   if(sem.source.startsWith('graph:')){assert.ok(!e.authoredId&&!e.composedId);assert.ok(x.core.dialogue.some(d=>d.speechSource===sem.source&&d.line===e.line));graphSources++;}
   if(sem.replyTo!==undefined){
    assert.equal(sem.replyTo,previous,'reply must address immediately preceding spoken line');
    const prior=x.log[sem.replyTo];assert.notEqual(prior.side,e.side);assert.equal(e.composedId,sem.source);
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
assert.ok(responded>100&&counters>100&&press>0&&authoredSources>0&&graphSources>0&&unclassified>0&&reached.size>=8);
console.log('PASS semantic promos: '+scenes+' paired scenes; '+responded+' classified responses across '+reached.size+' reached topics, '+unclassified+' unclassified responses, '+counters+' counters, '+press+' presses, '+authoredSources+' authored and '+graphSources+' graph claim sources; '+protectedN+' protected slots; save/resume and numerical/contract parity.');
