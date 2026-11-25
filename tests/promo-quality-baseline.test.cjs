'use strict';
// Descriptive baseline of the shipped live promo duel, not a dialogue-quality gate.
// Run: node tests/promo-quality-baseline.test.cjs
// Optional full JSON transcript export: PROMO_AUDIT_JSON=/tmp/promos.json node tests/promo-quality-baseline.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const store=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
// Test-only observation at the actual bank selection boundary. The shipped
// engine is unchanged. Compare the balanced audit against the original
// uninstrumented source before trusting the observations.
const selectionAnchor=' function pickAuthored(st,ctx){';
assert.equal(core.split(selectionAnchor).length,2,'audit selection boundary changed; update instrumentation');
const observedCore=core.replace(selectionAnchor,` function pickAuthored(st,ctx){
  if(!root.__promoDemandObserver||!ctx||!st.authoredDialogue)return pickAuthoredOriginal(st,ctx);
  const interested=ctx.stage==='answer'&&ctx.action==='turn'||ctx.stage==='push'&&['press','acknowledge'].includes(ctx.action);
  if(!interested)return pickAuthoredOriginal(st,ctx);
  const mem=st.authoredDialogue;
  const before={...mem,used:[...(mem.used||[])],recent:[...(mem.recent||[])],composedUsed:[...(mem.composedUsed||[])]};
  const line=pickAuthoredOriginal(st,ctx);
  root.__promoDemandObserver(st,ctx,before,line,catalogueFor(st),st.seed+'|'+st.steps.length+'|'+ctx.side);
  return line;
 }
 function pickAuthoredOriginal(st,ctx){`);
vm.runInNewContext(observedCore,{window:root,localStorage,Date,Math,JSON,console});
const {OfficeData:D,OfficeMic:Mic,OfficeRoom:Room}=root;
const roster=[...new Map((D.ALL||[...D.TALENT,...D.FOES]).map(w=>[w.id,w])).values()].sort((a,b)=>a.id.localeCompare(b.id));
const opponents=[...D.FOES].sort((a,b)=>a.id.localeCompare(b.id));
assert.ok(roster.length>1&&opponents.length>1&&D.PROMOS.length);
const inc=(map,k)=>map.set(k,(map.get(k)||0)+1);
const pct=(n,d)=>Number((100*n/Math.max(1,d)).toFixed(1));
const esc=s=>s.replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');
function normal(line,people,p){
 let s=String(line).normalize('NFKC').toLowerCase();
 const names=[...new Set([...people.flatMap(w=>[w.name,w.short]),p.name,p.venue].filter(Boolean).map(x=>x.toLowerCase()))].sort((a,b)=>b.length-a.length);
 for(const name of names)s=s.replace(new RegExp('(?<![\\p{L}\\p{N}])'+esc(name)+'(?![\\p{L}\\p{N}])','gu'),' <name> ');
 return s.replace(/[“”‘’"'.,!?;:—–-]/g,' ').replace(/\s+/g,' ').trim();
}
const profiles=new Map(),formats=new Map(),promises=new Map(),scenes=[],kinds=new Map();
const lines={core:new Map(),extra:new Map(),opponent:new Map(),crowd:new Map()};
function add(bucket,line,owner){
 let v=bucket.get(line);if(!v)bucket.set(line,v={n:0,owners:new Set()});
 v.n++;v.owners.add(owner);
}
const finishes=['win_clean','lose_clean','win_dirty','lose_protected'];
const samplesPerWorker=16;
let unresolved=0,resumeChecks=0,samePairCore=0,repeatedPairCore=0;
const availableIds=new Set(),selectedIds=new Set(),slotCoverage=new Map();
const closingComparison={vow:{before:0,after:0},clean:{before:0,after:0}};let closingPairs=0;
const voiceVariants=new Set(["ca_long","ca_smile","ch_hand","ch_now","vo_end","sw_ignore","ch_one_fall","pe_grudge"]);
const voiceOld=new Set(),voiceNew=new Set(),voiceActors=new Set();let voiceChanges=0,voicePairs=0;
const extendedVariants=new Set(["ch_trade","qu_strikes","qu_studied","pe_reputation"]);
const extendedOld=new Set(),extendedNew=new Set(),extendedActors=new Set(),extendedChangedVariants=new Map();let extendedPairs=0,extendedChanges=0;
function withoutPlayerWords(entries){return entries.map(e=>e.side==='w'?{...e,line:null}:e);}
const opponentVariants=new Set(["ch_one_fall","pr_tape","pr_veteran","ca_long","ca_restraint"]);
const opponentOld=new Set(),opponentNew=new Set(),opponentActors=new Set(),opponentChangedVariants=new Map();let opponentPairs=0,opponentChanges=0;
function withoutOpponentWords(entries){return entries.map(e=>e.side==='f'?{...e,line:null}:e);}
let flowPairs=0,directCount=0,removedCues=0,flowWordsSaved=0,flowFullPairs=0;const directFormats=new Map(),directVariants=new Set();
let followupPairs=0,followupChanges=0;const followupActors=new Set(),followupClaims=new Set();
let imageryPairs=0,imageryChanges=0,imageryCallbacks=0;const imageryVariants=new Set(),imageryActors=new Set();
const graphWithoutWords=s=>{const {imageryStyle,...rest}=s;return {...rest,dialogue:s.dialogue.map(e=>({...e,line:null})),steps:s.steps.map(e=>({...e,label:null})),result:null};};
const stepsWithoutLabels=s=>s.steps.map(e=>({...e,label:null}));
let characterPairs=0,characterChanges=0;const characterActors=new Set(),characterClaims=new Set(),characterIds=new Set();
let bankReusePairs=0,bankReuseHits=0,bankReuseOld=0,expandedReuseHits=0,expandedReusePairs=0;const expandedActors=new Set(),expandedTopics=new Set();const reusedBankIds=new Set(),reusedBankActors=new Set(),reusedBankClaims=new Set();
function flowOther(entries){return entries.filter(e=>e.side!=='w'&&e.kind!=='cue');}
function slot(k){if(!slotCoverage.has(k))slotCoverage.set(k,{available:new Set(),selected:new Set(),spoken:0,authored:0,composed:0,graph:0,protected:0,semanticBypass:0});return slotCoverage.get(k);}
for(const [i,w] of roster.entries()){
 const pool=opponents.filter(f=>f.id!==w.id);
 const pair=pool[i%pool.length],pairSeen=new Set();
 const pr={id:w.id,voice:Room.VOICE[w.id]||'stoic',explicitVoice:!!Room.VOICE[w.id],ownPromoSlots:Object.keys(D.VOICE_PACKS?.[w.id]?.promo||{}),core:new Set(),n:0};
 profiles.set(w.id,pr);
 for(let j=0;j<samplesPerWorker;j++){
  const f=j<8?pair:pool[(i+j*7)%pool.length],p=D.PROMOS[(i+j)%D.PROMOS.length];
  const c={id:'promo-audit-'+w.id+'-'+j,wid:w.id,rid:f.id,pid:p.id,eventAbs:100+j,slot:['opener','mid','feature','main'][j%4],minutes:12,finish:finishes[j%4],feudHeat:j%2?55:0};
  // Synthetic rivalry heat only: not a substitute for a persisted played career.
  const rival=j%2?{heat:55,matches:2,closed:false}:null;
  const st=Mic.begin(c,w,f,rival,null,p,{directed:process.env.PROMO_AUDIT_LEGACY!=='1',formats:process.env.PROMO_AUDIT_LEGACY!=='1',dialogue:process.env.PROMO_AUDIT_LEGACY!=='1',authored:process.env.PROMO_AUDIT_LEGACY!=='1',banks:promoBanks(w.id,f.id),composition:process.env.PROMO_AUDIT_LEGACY!=='1',semantic:process.env.PROMO_AUDIT_LEGACY!=='1'});
  if(st.semantic)delete st.semantic.claimClassification; // frozen historical policy for paired G1–G3 comparisons
  if(st.authoredDialogue?.semanticBankReuse===3)st.authoredDialogue.semanticBankReuse=2;
  if(st.authoredDialogue){delete st.authoredDialogue.reviewedSpecialist;delete st.authoredDialogue.authoredTopics;delete st.authoredDialogue.authoredFollowups;}
  for(const bank of st.authoredDialogue?.banks||[])for(const row of bank.rows){const id=bank.owner+'.'+row[0];availableIds.add(id);slot([row[1],row[2],row[3]].join('|')).available.add(id);}
  const oldFlow=st.openingFlow===1&&j===0?JSON.parse(JSON.stringify(st)):null;if(oldFlow)delete oldFlow.openingFlow;
  const rounds=[],choices=[],spoken=[];
  for(let step=0;st.stage!=='done';step++){
   assert.ok(step<12,'duel must terminate');
   const options=Mic.choices(st);assert.ok(options.length,'live duel must offer a choice');
   const round=Mic.ROUNDS[st.round]?.id||String(st.round);
   const wanted=round==='push'?(st.director?['leave','press','hold','acknowledge']:['leave','bit','quiet','pop'])[j%4]:null;
   const o=options.find(x=>x.id===wanted)||options[(i+j+step*3)%options.length];
   const before=st.log.length;
   const oldFollowup=round==='push'&&o.id==='press'&&st.semantic?.followupFlow===1?JSON.parse(JSON.stringify(st)):null;
   if(oldFollowup){delete oldFollowup.semantic.followupFlow;Mic.choose(oldFollowup,o.id);}
   const oldCharacter=round==='answer'&&o.id==='turn'&&st.semantic?.characterRebuttal===1?JSON.parse(JSON.stringify(st)):null;
   if(oldCharacter){delete oldCharacter.semantic.characterRebuttal;Mic.choose(oldCharacter,o.id);}
   const oldBankReuse=round==='answer'&&o.id==='turn'&&[1,2].includes(st.authoredDialogue?.semanticBankReuse)?JSON.parse(JSON.stringify(st)):null;
   if(oldBankReuse){delete oldBankReuse.authoredDialogue.semanticBankReuse;Mic.choose(oldBankReuse,o.id);}
   const priorBankReuse=round==='answer'&&o.id==='turn'&&st.authoredDialogue?.semanticBankReuse===2?JSON.parse(JSON.stringify(st)):null;
   if(priorBankReuse){priorBankReuse.authoredDialogue.semanticBankReuse=1;Mic.choose(priorBankReuse,o.id);}
   const oldOpening=round==='open'&&st.openingFlow===1?JSON.parse(JSON.stringify(st)):null;
   if(oldOpening){delete oldOpening.openingFlow;Mic.choose(oldOpening,o.id);}
   if(oldFlow){assert.ok(Mic.choices(oldFlow).some(x=>x.id===o.id),'G3A full-scene choice parity');Mic.choose(oldFlow,o.id);}
   const variant=round!=='push'&&root.OfficeStory.Graph.variantFor(st.core,round,o.id)?.id;
   const oldImagery=st.core.imageryStyle===1&&(round==='open'&&o.id==='imagery'||round==='answer'&&o.id==='callback')?JSON.parse(JSON.stringify(st)):null;
   if(oldImagery){delete oldImagery.core.imageryStyle;Mic.choose(oldImagery,o.id);}
   const oldVoice=st.coreVoiceStyle?.v===1&&voiceVariants.has(variant)?JSON.parse(JSON.stringify(st)):null;
   if(oldVoice){delete oldVoice.coreVoiceStyle;Mic.choose(oldVoice,o.id);}
   const oldExtended=st.coreVoiceExtension===1&&(extendedVariants.has(variant)||variant==='pe_respect')?JSON.parse(JSON.stringify(st)):null;
   if(oldExtended){delete oldExtended.coreVoiceExtension;Mic.choose(oldExtended,o.id);}
   const oldOpponent=st.opponentVoiceStyle?.v===1&&opponentVariants.has(variant)?JSON.parse(JSON.stringify(st)):null;
   if(oldOpponent){delete oldOpponent.opponentVoiceStyle;Mic.choose(oldOpponent,o.id);}
   const strict=round==='close'&&st.closingCommitmentStyle===1?JSON.parse(JSON.stringify(st)):null;
   if(strict){delete strict.closingCommitmentStyle;Mic.choose(strict,o.id);}
   if(j===0&&step===1){
    const copy=JSON.parse(JSON.stringify(st));Mic.choose(copy,o.id);Mic.choose(st,o.id);
    assert.equal(JSON.stringify(st),JSON.stringify(copy),'mid-scene save/resume diverged');resumeChecks++;
   }else Mic.choose(st,o.id);
   if(oldFollowup){
    followupPairs++;
    assert.equal(JSON.stringify(st.core),JSON.stringify(oldFollowup.core),'G3B graph parity');
    for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldFollowup[k]),'G3B '+k);
    assert.equal(JSON.stringify(Mic.choices(st)),JSON.stringify(Mic.choices(oldFollowup)),'G3B choices parity');
    const now=st.log.slice(before),old=oldFollowup.log.slice(before);
    assert.equal(JSON.stringify(now.filter(e=>!['w','f'].includes(e.side))),JSON.stringify(old.filter(e=>!['w','f'].includes(e.side))),'G3B crowd and stage parity');
    for(const side of ['w','f']){
     const a=now.find(e=>e.side===side),b=old.find(e=>e.side===side);
     if(!a||!b||a.line===b.line)continue;
     followupChanges++;followupActors.add(side==='w'?w.id:f.id);followupClaims.add(a.semantic?.claim);
     for(const k of ['claim','move','replyTo','kind','detail'])assert.equal(a.semantic?.[k],b.semantic?.[k],'G3B unchanged semantic '+k);
     assert.equal(a.authoredId,b.authoredId,'G3B authored lead parity');
     assert.match(a.composedId||a.semantic?.questionSource||'',/\.g3b\./);
     assert.ok(!/[{}]/.test(a.line));
    }
   }
   if(oldImagery){
    imageryPairs++;
    assert.equal(JSON.stringify(graphWithoutWords(st.core)),JSON.stringify(graphWithoutWords(oldImagery.core)),'G3C graph/effects parity');
    assert.equal(JSON.stringify(stepsWithoutLabels(st)),JSON.stringify(stepsWithoutLabels(oldImagery)),'G3C step parity');
    for(const k of ['meter','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldImagery[k]),'G3C '+k);
    const now=st.log.slice(before),old=oldImagery.log.slice(before);
    assert.equal(JSON.stringify(now.filter(e=>!['w','f'].includes(e.side))),JSON.stringify(old.filter(e=>!['w','f'].includes(e.side))),'G3C crowd and stage parity');
    const x=now.find(e=>e.side==='w'),y=old.find(e=>e.side==='w');
    if(x&&y&&x.line!==y.line){
     imageryChanges++;imageryActors.add(w.id);imageryVariants.add(variant);
     assert.ok(!x.authoredId&&!x.composedId&&!st.core.case&&!st.core.claim?.hasEvidence&&!st.speaker&&!st.arc);
     assert.ok(!/[{}]/.test(x.line));
     if(round==='open')assert.doesNotMatch(x.line,/\bstorm\b|\bchess\b|\bbull\b|\bladder\b/i);
     else {imageryCallbacks++;assert.doesNotMatch(x.line,/storm was coming|Remember what I said about (that old clock|the brass bell|the lights|that curtain|this microphone)/i);}
     const xf=now.find(e=>e.side==='f'),yf=old.find(e=>e.side==='f');
     assert.equal(JSON.stringify(xf?.semantic),JSON.stringify(yf?.semantic),'G3C preserves semantic claim and source');
    }
    assert.equal(JSON.stringify(Mic.choices(st).map(o=>o.id)),JSON.stringify(Mic.choices(oldImagery).map(o=>o.id)),'G3C available decisions unchanged');
   }
   if(oldCharacter){
    characterPairs++;
    assert.equal(JSON.stringify(st.core),JSON.stringify(oldCharacter.core),'G3D graph parity');
    for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldCharacter[k]),'G3D '+k);
    assert.equal(JSON.stringify(Mic.choices(st)),JSON.stringify(Mic.choices(oldCharacter)),'G3D options parity');
    const now=st.log.slice(before),old=oldCharacter.log.slice(before),x=now.find(e=>e.side==='w'),y=old.find(e=>e.side==='w');
    assert.equal(JSON.stringify(now.filter(e=>e.side!=='w')),JSON.stringify(old.filter(e=>e.side!=='w')),'G3D opponent/stage/crowd parity');
    if(x&&y&&x.line!==y.line){
     characterChanges++;characterActors.add(w.id);characterClaims.add(x.semantic?.claim);characterIds.add(x.composedId);
     assert.match(x.composedId,/\.g3d\./);assert.ok(!x.authoredId&&!st.core.case&&!st.core.claim?.hasEvidence&&!st.speaker);
     for(const k of ['claim','move','replyTo','kind','detail'])assert.equal(x.semantic?.[k],y.semantic?.[k],'G3D semantic '+k);
     assert.ok(!/[{}]/.test(x.line));
    }
   }
   if(priorBankReuse){
    expandedReusePairs++;
    assert.equal(JSON.stringify(st.core),JSON.stringify(priorBankReuse.core),'full-roster reuse graph parity');
    for(const k of ['meter','stage','round','steps','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(priorBankReuse[k]),'full-roster reuse '+k);
    const now=st.log.slice(before),old=priorBankReuse.log.slice(before);
    assert.equal(JSON.stringify(now.filter(e=>!['w','f'].includes(e.side))),JSON.stringify(old.filter(e=>!['w','f'].includes(e.side))),'full-roster reuse crowd parity');
    for(const side of ['w','f']){
     const x=now.find(e=>e.side===side),y=old.find(e=>e.side===side);
     if(y?.authoredId)assert.equal(x?.authoredId,y.authoredId,'previous reviewed selections remain first priority');
     if(!x?.semantic?.bankReuse||y?.authoredId)continue;
     expandedReuseHits++;expandedActors.add(x.dialogueSlot.owner);expandedTopics.add(x.semantic.claim);
     for(const k of ['claim','move','replyTo','kind','detail'])assert.equal(x.semantic[k],y.semantic?.[k],'expanded bank reuse semantic '+k);
    }
   }
   if(oldBankReuse){
    bankReusePairs++;
    assert.equal(JSON.stringify(st.core),JSON.stringify(oldBankReuse.core),'bank reuse graph parity');
    for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldBankReuse[k]),'bank reuse '+k);
    assert.equal(JSON.stringify(Mic.choices(st)),JSON.stringify(Mic.choices(oldBankReuse)),'bank reuse options parity');
    const now=st.log.slice(before),old=oldBankReuse.log.slice(before);
    assert.equal(JSON.stringify(now.filter(e=>!['w','f'].includes(e.side))),JSON.stringify(old.filter(e=>!['w','f'].includes(e.side))),'bank reuse stage/crowd parity');
    for(const side of ['w','f']){
     const a=now.find(e=>e.side===side),b=old.find(e=>e.side===side);
     if(b?.authoredId)bankReuseOld++;
     if(!a?.semantic?.bankReuse)continue;
     bankReuseHits++;reusedBankIds.add(a.authoredId);reusedBankActors.add(a.dialogueSlot.owner);reusedBankClaims.add(a.semantic.claim);
     assert.ok(a.authoredId&&!a.composedId&&!b.authoredId&&!st.core.case&&!st.core.claim?.hasEvidence&&!st.speaker);
     for(const k of ['claim','move','replyTo','kind','detail'])assert.equal(a.semantic[k],b.semantic?.[k],'bank reuse semantic '+k);
    }
   }
   if(oldOpening){
    flowPairs++;
    assert.equal(JSON.stringify(st.core),JSON.stringify(oldOpening.core),'G3A opening graph parity');
    for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldOpening[k]),'G3A '+k);
    const now=st.log.slice(before),old=oldOpening.log.slice(before),x=now.find(e=>e.side==='w'),y=old.find(e=>e.side==='w');
    assert.equal(JSON.stringify(flowOther(now)),JSON.stringify(flowOther(old)),'G3A other dialogue parity');
    assert.equal(JSON.stringify(Mic.choices(st)),JSON.stringify(Mic.choices(oldOpening)),'G3A next choices');
    assert.equal(Mic.view(st).cue,Mic.view(oldOpening).cue,'G3A coaching cue still available');
    if(x?.answersQuestion?.direct){
     directCount++;inc(directFormats,st.director.format);directVariants.add(variant);
     assert.ok(!st.core.case&&!st.core.claim?.hasEvidence&&!st.speaker&&!st.arc&&!x.authoredId&&!x.composedId);
     assert.equal(x.answersQuestion.prompt,y.answersQuestion.prompt);assert.equal(x.answersQuestion.lead,'');
     assert.ok(y.answersQuestion.lead&&y.line.startsWith(y.answersQuestion.lead+' '));
     assert.equal(x.line,y.line.slice(y.answersQuestion.lead.length+1),'G3A retains exact substantive answer');
     flowWordsSaved+=y.answersQuestion.lead.split(/\s+/).length;
    }else assert.equal(JSON.stringify(x),JSON.stringify(y),'G3A protected or unreviewed opening unchanged');
    removedCues+=old.filter(e=>e.kind==='cue').length-now.filter(e=>e.kind==='cue').length;
   }
   if(oldVoice){
    voicePairs++;
    assert.equal(JSON.stringify(st.core),JSON.stringify(oldVoice.core),'core voice graph parity');
    for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldVoice[k]),'core voice '+k);
    assert.equal(JSON.stringify(st.log.slice(before).filter(e=>e.side!=='w')),JSON.stringify(oldVoice.log.slice(before).filter(e=>e.side!=='w')),'non-player dialogue parity');
    const x=st.log.slice(before).find(e=>e.side==='w'),y=oldVoice.log.slice(before).find(e=>e.side==='w');
    if(x&&y){voiceOld.add(normal(y.line,[w,f],p));voiceNew.add(normal(x.line,[w,f],p));if(x.line!==y.line){voiceChanges++;voiceActors.add(w.id);assert.ok(!x.authoredId&&!x.composedId&&!st.core.case&&!st.core.claim?.hasEvidence&&!st.speaker);assert.ok(!/[{}]/.test(x.line));}}
    if(st.stage==='done')for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature'])assert.equal(JSON.stringify(Mic.result(st)[k]),JSON.stringify(Mic.result(oldVoice)[k]),'core voice outcome '+k);
   }
   if(oldExtended){
    extendedPairs++;
    assert.equal(JSON.stringify(st.core),JSON.stringify(oldExtended.core),'G2D graph parity');
    for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldExtended[k]),'G2D '+k);
    const now=st.log.slice(before),old=oldExtended.log.slice(before);
    assert.equal(JSON.stringify(withoutPlayerWords(now)),JSON.stringify(withoutPlayerWords(old)),'G2D dialogue metadata and non-player parity');
    assert.equal(JSON.stringify(Mic.choices(st)),JSON.stringify(Mic.choices(oldExtended)),'G2D next options parity');
    const x=now.find(e=>e.side==='w'),y=old.find(e=>e.side==='w');
    if(x&&y){
     if(variant==='pe_respect')assert.equal(x.line,y.line,'evidence-sensitive respect claim must remain literal');
     else{
      extendedOld.add(normal(y.line,[w,f],p));extendedNew.add(normal(x.line,[w,f],p));
      if(x.line!==y.line){extendedChanges++;extendedActors.add(w.id);inc(extendedChangedVariants,variant);
       assert.ok(!x.authoredId&&!x.composedId&&!st.core.case&&!st.core.claim?.hasEvidence&&!st.speaker);
       assert.ok(!/[{}]/.test(x.line));
       if(variant.startsWith('qu_'))assert.match(x.line,/\bcounter\b/i,'counter commitment explicit');
       if(variant==='qu_strikes')assert.match(x.line,/\bpunch\b/i,'specific punch commitment retained');
      }
     }
    }
    if(st.stage==='done')for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature'])assert.equal(JSON.stringify(Mic.result(st)[k]),JSON.stringify(Mic.result(oldExtended)[k]),'G2D outcome '+k);
   }
   if(oldOpponent){
    opponentPairs++;
    assert.equal(JSON.stringify(st.core),JSON.stringify(oldOpponent.core),'opponent voice graph parity');
    for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldOpponent[k]),'opponent voice '+k);
    const now=st.log.slice(before),old=oldOpponent.log.slice(before);
    assert.equal(JSON.stringify(withoutOpponentWords(now)),JSON.stringify(withoutOpponentWords(old)),'opponent voice metadata and other dialogue parity');
    assert.equal(JSON.stringify(Mic.choices(st)),JSON.stringify(Mic.choices(oldOpponent)),'opponent voice next options parity');
    const x=now.find(e=>e.side==='f'),y=old.find(e=>e.side==='f');
    if(x&&y){
     opponentOld.add(normal(y.line,[w,f],p));opponentNew.add(normal(x.line,[w,f],p));
     if(x.line!==y.line){opponentChanges++;opponentActors.add(f.id);inc(opponentChangedVariants,variant);
      assert.ok(!x.authoredId&&!x.composedId&&!st.core.case&&!st.core.claim?.hasEvidence&&!st.speaker);
      assert.ok(x.semantic?.claim&&x.semantic.source===y.semantic?.source,'reviewed semantic fingerprint retained');
      assert.ok(!/[{}]/.test(x.line),'no unresolved opponent placeholders');
     }
    }
    if(st.stage==='done')for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature'])assert.equal(JSON.stringify(Mic.result(st)[k]),JSON.stringify(Mic.result(oldOpponent)[k]),'opponent voice outcome '+k);
   }
   if(strict){
    assert.equal(JSON.stringify(st.core),JSON.stringify(strict.core),'closing commitment graph parity');
    const x=Mic.result(st),y=Mic.result(strict);
    for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature'])assert.equal(JSON.stringify(x[k]),JSON.stringify(y[k]),'closing commitment parity '+k);
    closingPairs++;
    if(closingComparison[o.id]){
     const authored=s=>s.log.slice(before).filter(e=>e.side==='w'&&e.authoredId).length;
     closingComparison[o.id].before+=authored(strict);closingComparison[o.id].after+=authored(st);
    }
   }
   rounds.push(round);choices.push(o.id);
   for(const d of st.log.slice(before)){
    inc(kinds,d.kind||'unknown');
    if(/\b(?:undefined|NaN)\b|\{[A-Z][A-Z0-9_]*\}/.test(d.line))unresolved++;
    if(d.dialogueSlot){const q=d.dialogueSlot,k=slot([q.stage,q.action,q.side].join('|'));k.spoken++;if(q.protected)k.protected++;if(d.authoredId){k.authored++;k.selected.add(d.authoredId);selectedIds.add(d.authoredId);}else if(d.composedId)k.composed++;else k.graph++;if(d.composedId?.startsWith('semantic.'))k.semanticBypass++;}
    const line=normal(d.line,[w,f],p);
    if(!line)continue;
    if(d.side==='w'){
     const bucket=round==='push'?'extra':'core';
     add(lines[bucket],line,w.id);
     if(bucket==='core'){
      pr.core.add(line);pr.n++;
      if(j<8){samePairCore++;if(pairSeen.has(line))repeatedPairCore++;pairSeen.add(line);}
     }
     spoken.push({round,line:d.line});
    }else if(d.side==='f')add(lines.opponent,line,f.id);
    else if(d.side==='crowd')add(lines.crowd,line,'crowd');
   }
  }
  const result=Mic.result(st);
  if(oldFlow){
   flowFullPairs++;const previous=Mic.result(oldFlow);assert.ok(previous,'G3A old scene completes');
   for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature','beats'])assert.equal(JSON.stringify(result[k]),JSON.stringify(previous[k]),'G3A full-scene parity '+k);
   assert.equal(JSON.stringify(st.core),JSON.stringify(oldFlow.core),'G3A full-scene graph parity');
   const validate=s=>{let last=null;for(const [i,e] of s.log.entries()){if(!['w','f'].includes(e.side))continue;if(e.semantic?.replyTo!==undefined)assert.equal(e.semantic.replyTo,last,'G3A semantic reference remains attached to preceding speaker');last=i;}};
   validate(st);validate(oldFlow);
  }
  assert.ok(result&&Number.isFinite(result.quality)&&result.promise,'completed promo contract');
  inc(formats,rounds.join(' > '));inc(promises,result.promise.type);
  scenes.push({authoredIds:result.dialogueIds||[],format:st.director?.format||'legacy',worker:w.id,opponent:f.id,venue:p.venue,syntheticRivalry:!!rival,finish:c.finish,choices,quality:result.quality,spoken,dialogue:result.dialogue});
 }
}
function stats(map){
 const v=[...map.entries()],n=v.reduce((a,[,x])=>a+x.n,0),shared=v.filter(([,x])=>x.owners.size>1);
 return {utterances:n,distinctNormalized:v.length,repeatedOccurrences:n-v.length,repeatedPct:pct(n-v.length,n),crossSpeakerOccurrences:shared.reduce((a,[,x])=>a+x.n,0),crossSpeakerPct:pct(shared.reduce((a,[,x])=>a+x.n,0),n),topRepeated:v.sort((a,b)=>b[1].n-a[1].n||a[0].localeCompare(b[0])).slice(0,5).map(([line,x])=>({line,count:x.n,speakers:x.owners.size}))};
}
const voices=new Map();for(const p of profiles.values())inc(voices,p.voice);
const summary={mode:process.env.PROMO_AUDIT_LEGACY==='1'?'legacy':'directed',scenes:scenes.length,roster:roster.length,opponents:opponents.length,samplesPerWorker,resumeChecks,
 voiceCoverage:{explicit:[...profiles.values()].filter(p=>p.explicitVoice).length,fallback:[...profiles.values()].filter(p=>!p.explicitVoice).length,withOwnPromo:[...profiles.values()].filter(p=>p.ownPromoSlots.length).length,archetypes:Object.fromEntries(voices)},
 authoredUtterances:scenes.reduce((n,s)=>n+s.authoredIds.length,0),authoredUniqueIds:new Set(scenes.flatMap(s=>s.authoredIds)).size,sceneFormats:scenes.reduce((a,s)=>(a[s.format]=(a[s.format]||0)+1,a),{}),roundPatterns:Object.fromEntries(formats),promiseTypes:Object.fromEntries(promises),lineKinds:Object.fromEntries(kinds),unresolvedMarkers:unresolved,
 samePair:{coreUtterances:samePairCore,repeated:repeatedPairCore,repeatedPct:pct(repeatedPairCore,samePairCore)},
 bankReach:{available:availableIds.size,selected:selectedIds.size,notSelected:[...availableIds].filter(id=>!selectedIds.has(id)).length,slots:Object.fromEntries([...slotCoverage].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,{...v,available:v.available.size,selected:v.selected.size}]))},
 lines:Object.fromEntries(Object.entries(lines).map(([k,v])=>[k,stats(v)]))};
console.log('PROMO QUALITY BASELINE\n'+JSON.stringify(summary,null,2));
const sampleIds=[...new Set(['nova','mara',...roster.filter(w=>!Room.VOICE[w.id]).slice(0,2).map(w=>w.id),...roster.slice(0,2).map(w=>w.id)])];
for(const id of sampleIds){
 const s=scenes.find(x=>x.worker===id&&x.syntheticRivalry)||scenes.find(x=>x.worker===id);
 if(s)console.log('\nTRANSCRIPT '+s.worker+' vs '+s.opponent+' | '+s.choices.join(' > ')+'\n'+s.dialogue.map(d=>d.speaker+': '+d.line).join('\n'));
}
if(process.env.PROMO_AUDIT_JSON)fs.writeFileSync(process.env.PROMO_AUDIT_JSON,JSON.stringify({summary,profiles:[...profiles.values()].map(p=>({...p,core:[...p.core]})),scenes},null,2));
assert.equal(scenes.length,roster.length*samplesPerWorker);
assert.equal(resumeChecks,roster.length);
if(process.env.PROMO_AUDIT_LEGACY!=='1'){
 assert.ok(voiceChanges>100&&voiceActors.size>30&&voiceNew.size>voiceOld.size,'G2 core voice coverage');
 console.log('PASS G2 core voice: '+voiceChanges+'/'+voicePairs+' target turns changed across '+voiceActors.size+' speakers; '+voiceOld.size+' -> '+voiceNew.size+' distinct normalized lines; unchanged graph, scoring and non-player dialogue.');
 assert.equal(flowPairs,scenes.length);assert.equal(flowFullPairs,roster.length);
 assert.ok(directCount>50&&directFormats.size>=2&&directVariants.size>=5&&removedCues>directCount&&flowWordsSaved>0,'G3A direct openings and redundant cue removal coverage');
 console.log('PASS G3A opening flow: '+directCount+'/'+flowPairs+' direct answers across '+directFormats.size+' formats and '+directVariants.size+' variants; '+flowWordsSaved+' stock lead words and '+removedCues+' redundant transcript cues removed; '+flowFullPairs+' full scenes retain graph and result parity.');
 console.log('G3B benchmark: '+followupChanges+' changed turns in '+followupPairs+' press exchanges; '+followupActors.size+' speakers; claims '+[...followupClaims].join(', '));
 assert.ok(followupPairs>0&&followupChanges>10&&followupActors.size>5&&followupClaims.size>=2,'G3B benchmark live reach');
 console.log('G3C imagery: '+imageryChanges+'/'+imageryPairs+' changed turns, '+imageryActors.size+' speakers, '+imageryCallbacks+' grounded callbacks, variants '+[...imageryVariants].join(', '));
 assert.ok(imageryChanges>10&&imageryActors.size>5&&imageryVariants.size>=3,'G3C live reach');
 console.log('G3D character rebuttals: '+characterChanges+'/'+characterPairs+' changed turns across '+characterActors.size+' speakers; '+characterIds.size+' distinct IDs; claims '+[...characterClaims].join(', '));
 assert.ok(characterChanges>10&&characterActors.size>5&&characterClaims.size>=2,'G3D live coverage');
 console.log('Semantic bank integration: '+bankReuseHits+' newly recovered authored turns across '+bankReusePairs+' paired exchanges; '+reusedBankIds.size+' IDs, '+reusedBankActors.size+' speakers, claims '+[...reusedBankClaims].join(', ')+'; prior authored turns '+bankReuseOld);
 console.log('Full-roster bank expansion: '+expandedReuseHits+' additional authored turns across '+expandedReusePairs+' paired exchanges, '+expandedActors.size+' speakers, claims '+[...expandedTopics].join(', '));
 assert.ok(expandedReuseHits>0&&expandedActors.size>0,'full-roster extension live reach');
 assert.ok(bankReuseHits>20&&reusedBankActors.size>10&&reusedBankClaims.size>=2,'live bank reuse coverage');
 assert.ok(extendedChanges>70&&extendedActors.size>20&&extendedChangedVariants.size===extendedVariants.size&&extendedNew.size>extendedOld.size,'G2D extended player voice coverage');
 console.log('PASS G2D player voice: '+extendedChanges+'/'+extendedPairs+' reviewed/protected target turns; '+extendedActors.size+' speakers; '+extendedOld.size+' -> '+extendedNew.size+' distinct normalized lines; variants '+JSON.stringify(Object.fromEntries(extendedChangedVariants))+'; unchanged graph, options and consequences.');
 assert.ok(opponentChanges>100&&opponentActors.size>=10&&opponentChangedVariants.size===opponentVariants.size&&opponentNew.size>opponentOld.size,'G2C opponent voice coverage');
 console.log('PASS G2C opponent voice: '+opponentChanges+'/'+opponentPairs+' target turns changed across '+opponentActors.size+' speakers; '+opponentOld.size+' -> '+opponentNew.size+' distinct normalized lines; variants '+JSON.stringify(Object.fromEntries(opponentChangedVariants))+'; unchanged graph, semantic fingerprints, options and other dialogue.');
 assert.equal(closingPairs,scenes.length);
 for(const [k,v] of Object.entries(closingComparison))assert.ok(v.after>v.before+10,'G1 must restore meaningful '+k+' bank use');
 console.log('PASS G1 closing recovery: '+JSON.stringify(closingComparison)+' across '+closingPairs+' paired closings; unchanged graph and consequences.');
}
console.log('PASS promo baseline: completed deterministic scenes; descriptive metrics are not quality thresholds.');

// G4A — a separate, balanced, directed workload. Keep the historical
// 1,280-scene benchmark unchanged so its comparisons remain meaningful.
// All roster members face and speak against other roster members, rather
// than limiting the opposition to D.FOES.
if(process.env.PROMO_AUDIT_LEGACY!=='1'){
 const L=root.OfficePromoDialogue,S=root.OfficePromoSemantics;
 const demand=new Map(),actorStats=new Map(),topicStats=new Map(),skipped=new Map();
 const observedIds=new Set(),loadedIds=new Set(),actualAuthoredIds=new Set();
 const reasons=['authored','no_bank','no_authored_slot','no_reviewed_topic','reviewed_but_ineligible','history_exhausted','unsupported_move','semantic_guard','no_preceding_response','policy_disabled','unexpected_fallback'];
 const zero=()=>Object.fromEntries(reasons.map(r=>[r,0]));
 const addDemand=(map,key,reason)=>{if(!map.has(key))map.set(key,zero());map.get(key)[reason]++;};
 const count=x=>Object.values(x).reduce((a,b)=>a+b,0);
 const isEligible=r=>!['semantic_guard','no_preceding_response','policy_disabled'].includes(r);
 const describe=x=>{const eligible=Object.entries(x).filter(([r])=>isEligible(r)).reduce((a,[,n])=>a+n,0);return {attempts:count(x),eligible,authored:x.authored,authoredPct:pct(x.authored,eligible),reasons:Object.fromEntries(Object.entries(x).filter(([,n])=>n))};};
 const bankReview=(row,sem)=>L.reviewedBankReuseV3[row.id]?.slice(1).includes(sem.claim);
 const selectRoutes=(cat,ctx,seed,mem,sem)=>{
  if(mem.reviewedAck===1&&ctx.stage==='push'&&ctx.action==='acknowledge'&&(ctx.side==='f'||['unclassified','agreement','end'].includes(sem.claim))){
   const own=L.selectAcknowledgement(cat,ctx,seed,mem);if(own)return own;
  }
  if(mem.reviewedContext===1){const own=L.selectSemanticResponse(cat,ctx,seed,mem,sem);if(own)return own;}
  if([1,2,3].includes(mem.semanticBankReuse)){const own=L.selectReviewedBankResponse(cat,ctx,seed,mem,sem,mem.semanticBankReuse);if(own)return own;}
  if(mem.reviewedSpecialist===1){const own=L.selectSpecialistResponse(cat,ctx,seed,mem,sem);if(own)return own;}
  if(mem.authoredTopics===1){const own=L.selectAuthoredTopic(cat,ctx,seed,mem,sem);if(own)return own;}
  if(mem.authoredFollowups===1)return L.selectAuthoredFollowup(cat,ctx,seed,mem,sem);
  return null;
 };
 let activeScene=null,observations=0,emittedChecks=0,sceneCount=0,oldUnknown=0,newUnknown=0,classifiedOpenings=0;
 const recoveredSources=new Map(),remainingUnknown=new Map();
 const followupD2Owners=new Set(["ace","aisha","alina","ash","bao","cal","cass","dean","dev","eira"]);let followupD2Hits=0;const followupD3Owners=new Set(["elodie","ezra","imani","jun","kellan","kezia","kofi","lyra","mae","magnus"]);let followupD3Hits=0;const followupD4Owners=new Set(["mara","milo","miro","nico","noelle","nolan","otis","red","rev","roxy"]);let followupD4Hits=0;const followupD5Owners=new Set(["tori","val","winnie","anya","ayla","bashir","brick","cleo","dee","ellis"]);let followupD5Hits=0;const followupD6Owners=new Set(["faye","felix","gideon","gus","iris","ivo","jett","juno","kira","kit"]);let followupD6Hits=0;const followupD7Owners=new Set(["leandro","liya","malik","marisol","morgan","nadia","nate","nova","priya","rina"]);let followupD7Hits=0;
 let followupHits=0,followupLosses=0,followupPairsD=0;const followupIdsD=new Set(),followupOwnersD=new Set();
 let topicHits=0,topicLosses=0,topicPairs=0;const topicIds=new Set(),topicOwners=new Set(),topicSides=new Map();
 const eighthEvidenceBatch=new Set(['rex','faye','miro','cass','alina','eira','vera','liya','leandro','tomasash']);
 let batchHits=0;const batchIds=new Set(),batchOwners=new Set(),batchSides=new Map();
 let specialistHits=0,specialistLosses=0,specialistPairs=0;const specialistIds=new Set(),specialistOwners=new Set(),specialistMoves=new Map();
 let recoveryPairs=0,recoveryHits=0;const recoveryIds=new Set(),recoveryOwners=new Set(),recoveryTopics=new Map();
 root.__promoDemandObserver=(st,ctx,mem,line,cat,seed)=>{
  assert.ok(activeScene,'observer must only run on the balanced workload');
  const prev=S.latest(st.log,ctx.side==='w'?'f':'w')?.entry;
  const incoming=prev?.semantic?.claim||'unclassified';
  const move=ctx.side==='w'?(ctx.action==='turn'?'rebut':ctx.action):ctx.action==='turn'?'counter':ctx.action==='press'?'press_counter':'settle';
  const sem=line?.semantic;
  const outgoing=sem?.claim||null;
  const owner=ctx.speaker.id,ownRows=cat.lines(ctx.speaker.role,owner);
  let reason;
  if(!st.semantic)reason='policy_disabled';
  else if(!S.allowed(st)||ctx.hasMouthpiece)reason='semantic_guard';
  else if(!prev||ctx.side==='f'&&prev.semantic?.kind!=='response')reason='no_preceding_response';
  else if(line&&!line.composed&&sem){reason='authored';observedIds.add(line.id);}
  else if(!sem)reason='unexpected_fallback';
  else if(!ownRows.length)reason='no_bank';
  else if(move==='press_counter'&&!(mem.authoredFollowups===1&&sem.claim==='evidence'))reason='unsupported_move';
  else {
   const now=selectRoutes(cat,ctx,seed,mem,sem);
   const fresh=selectRoutes(cat,ctx,seed,{...mem,used:[],recent:[]},sem);
   if(now)reason='unexpected_fallback';
   else if(fresh)reason='history_exhausted';
   else if(move==='acknowledge'&&!['unclassified','agreement','end'].includes(sem.claim))reason='unsupported_move';
   else{
    const exact=ownRows.filter(r=>r.stage===ctx.stage&&r.action===ctx.action&&r.side===ctx.side);
    const reviewed=ctx.action==='turn'?ownRows.filter(r=>r.side===ctx.side&&bankReview(r,sem)):[];
    if(reviewed.length)reason='reviewed_but_ineligible';
    else if(!exact.length)reason='no_authored_slot';
    else reason='no_reviewed_topic';
   }
  }
  const role=ctx.side==='w'?'player':'opponent';
  const key=[role,move,incoming,outgoing||'-'].join('|');
  addDemand(topicStats,key,reason);addDemand(demand,[owner,key].join('|'),reason);
  addDemand(actorStats,owner+'|'+role,reason);
  if(!isEligible(reason))inc(skipped,reason);
  activeScene.push({side:ctx.side,stage:ctx.stage,action:ctx.action,owner,authoredId:line&&!line.composed&&sem?line.id:null,semantic:sem?{claim:sem.claim,move:sem.move,replyTo:sem.replyTo}:null,reason});
  observations++;
 };
 // Equal numbers of assigned player/opponent scenes per roster identity.
 // Choice policy stresses rebuttals and follow-ups deliberately, so this is
 // a demand-discovery workload, not an estimate of ordinary player behaviour.
 const playerAssignments=new Map(),opponentAssignments=new Map(),formatsSeen=new Map();
 const samples=8;
 const openingChoices=['proof','people','swagger','imagery','accusation','hometown','numbers','proof'];
 const plainRoot={addEventListener(){}},plainStore=new Map();
 const plainStorage={getItem:k=>plainStore.get(k)||null,setItem:(k,v)=>plainStore.set(k,String(v)),removeItem:k=>plainStore.delete(k)};
 vm.runInNewContext(core,{window:plainRoot,localStorage:plainStorage,Date,Math,JSON,console});
 for(const [i,w] of roster.entries())for(let j=0;j<samples;j++){
  const f=roster[(i+1+j*9)%roster.length],p=D.PROMOS[(i+j)%D.PROMOS.length];
  assert.notEqual(w.id,f.id,'balanced opponent cannot be self');
  inc(playerAssignments,w.id);inc(opponentAssignments,f.id);
  const c={id:'promo-demand-'+w.id+'-'+j,wid:w.id,rid:f.id,pid:p.id,eventAbs:300+j,slot:['opener','mid','feature','main'][j%4],minutes:12,finish:finishes[j%4],feudHeat:j%2?55:0};
  const rival=j%2?{heat:55,matches:2,closed:false}:null;
  const banks=promoBanks(w.id,f.id);
  for(const bank of banks)for(const row of bank.rows)loadedIds.add(bank.owner+'.'+row[0]);
  const opts={directed:true,formats:true,dialogue:true,authored:true,banks,composition:true,semantic:true};
  const st=Mic.begin(c,w,f,rival,null,p,opts);
  // One scene per identity verifies the observation hook cannot affect
  // transcript, state, or result compared with the uninstrumented engine.
  const plain=j===0?plainRoot.OfficeMic.begin(c,w,f,rival,null,p,opts):null;
  const oldBankPolicy=plainRoot.OfficeMic.begin(c,w,f,rival,null,p,opts);oldBankPolicy.authoredDialogue.semanticBankReuse=2;delete oldBankPolicy.authoredDialogue.reviewedSpecialist;delete oldBankPolicy.authoredDialogue.authoredTopics;delete oldBankPolicy.authoredDialogue.authoredFollowups;
  const priorSpecialist=plainRoot.OfficeMic.begin(c,w,f,rival,null,p,opts);delete priorSpecialist.authoredDialogue.reviewedSpecialist;delete priorSpecialist.authoredDialogue.authoredTopics;delete priorSpecialist.authoredDialogue.authoredFollowups;
  const priorTopics=plainRoot.OfficeMic.begin(c,w,f,rival,null,p,opts);delete priorTopics.authoredDialogue.authoredTopics;delete priorTopics.authoredDialogue.authoredFollowups;
  const previous=JSON.parse(JSON.stringify(st));delete previous.semantic.claimClassification;
  inc(formatsSeen,st.director?.format||'legacy');
  activeScene=[];
  for(let step=0;st.stage!=='done';step++){
   assert.ok(step<12,'balanced demand scene must terminate');
   const round=Mic.ROUNDS[st.round]?.id,choices=Mic.choices(st);
   const desired=round==='open'?openingChoices[j]:round==='answer'?'turn':round==='push'?(j%3===0?'acknowledge':'press'):['vow','clean','question','finisher'][j%4];
   const id=(choices.find(o=>o.id===desired)||choices[0]).id;
   const before=st.log.length,observedBefore=activeScene.length;
   if(round==='open'){
    // Observation is only for response moves, so this does not contaminate
    // the demand counts. Compare the same opening against the prior policy.
    Mic.choose(previous,id);
   }
   const oldAt=oldBankPolicy.log.length,priorAt=priorSpecialist.log.length,topicAt=priorTopics.log.length;
   plainRoot.OfficeMic.choose(oldBankPolicy,id);
   plainRoot.OfficeMic.choose(priorSpecialist,id);
   plainRoot.OfficeMic.choose(priorTopics,id);
   const priorFollowup=round==='push'&&id==='press'?JSON.parse(JSON.stringify(st)):null;
   if(priorFollowup){delete priorFollowup.authoredDialogue.authoredFollowups;plainRoot.OfficeMic.choose(priorFollowup,id);}
   Mic.choose(st,id);
   if(priorFollowup){
    followupPairsD++;
    for(const k of ['core','meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(priorFollowup[k]),'G4D1 '+k+' parity');
    assert.equal(JSON.stringify(Mic.choices(st)),JSON.stringify(plainRoot.OfficeMic.choices(priorFollowup)),'G4D1 options parity');
    const current=st.log.slice(before),previous=priorFollowup.log.slice(before);
    assert.equal(JSON.stringify(current.filter(e=>e.side!=='f')),JSON.stringify(previous.filter(e=>e.side!=='f')),'G4D1 unchanged player question and presentation');
    const a=current.find(e=>e.side==='f'),b=previous.find(e=>e.side==='f');
    assert.ok(a&&b);
    for(const k of ['claim','move','replyTo','kind','detail'])assert.equal(a.semantic?.[k],b.semantic?.[k],'G4D1 '+k+' parity');
    if(b.authoredId&&!a.authoredId)followupLosses++;
    if(a.authoredId&&!b.authoredId){assert.equal(a.semantic?.followupBank,1);assert.equal(a.semantic.claim,'evidence');assert.equal(a.semantic.move,'press_counter');followupHits++;if(followupD2Owners.has(a.dialogueSlot.owner))followupD2Hits++;if(followupD3Owners.has(a.dialogueSlot.owner))followupD3Hits++;if(followupD4Owners.has(a.dialogueSlot.owner))followupD4Hits++;if(followupD5Owners.has(a.dialogueSlot.owner))followupD5Hits++;if(followupD6Owners.has(a.dialogueSlot.owner))followupD6Hits++;if(followupD7Owners.has(a.dialogueSlot.owner))followupD7Hits++;followupIdsD.add(a.authoredId);followupOwnersD.add(a.dialogueSlot.owner);}
    else assert.equal(JSON.stringify(a),JSON.stringify(b),'G4D1 unchanged existing reply');
   }
   if(round==='answer'&&id==='turn'){
    topicPairs++;
    for(const side of ['w','f']){
     const a=st.log.slice(before).find(e=>e.side===side),b=priorTopics.log.slice(topicAt).find(e=>e.side===side);
     assert.ok(a&&b);assert.equal(a.semantic?.claim,b.semantic?.claim);assert.equal(a.semantic?.move,b.semantic?.move);
     if(b.authoredId&&!a.authoredId)topicLosses++;
     if(a.authoredId&&!b.authoredId){assert.equal(a.semantic?.topicBank,1);assert.equal(a.semantic.claim,'evidence');topicHits++;topicIds.add(a.authoredId);topicOwners.add(a.dialogueSlot.owner);inc(topicSides,side);if(eighthEvidenceBatch.has(a.dialogueSlot.owner)){batchHits++;batchIds.add(a.authoredId);batchOwners.add(a.dialogueSlot.owner);inc(batchSides,side);}}
     if(b.authoredId)assert.equal(a.authoredId,b.authoredId,'topic bank must not displace existing authored reply');
    }
   }
   assert.equal(JSON.stringify(st.core),JSON.stringify(priorTopics.core),'G4C1 graph parity');
   for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(priorTopics[k]),'G4C1 '+k+' parity');
   if((round==='answer'&&id==='turn')||(round==='push'&&['press','acknowledge'].includes(id))){
    specialistPairs++;
    const beforeSpecialist=priorSpecialist.log.slice(priorAt),afterSpecialist=priorTopics.log.slice(topicAt);
    for(const side of ['w','f']){
     const a=afterSpecialist.find(e=>e.side===side),b=beforeSpecialist.find(e=>e.side===side);
     if(!a||!b)continue;
     assert.equal(a.semantic?.claim,b.semantic?.claim);assert.equal(a.semantic?.move,b.semantic?.move);
     if(b.authoredId&&!a.authoredId)specialistLosses++;
     if(a.authoredId&&!b.authoredId){
      assert.ok(a.semantic?.specialist,'new authored hit must be specialist recovery');
      specialistHits++;specialistIds.add(a.authoredId);specialistOwners.add(a.dialogueSlot.owner);inc(specialistMoves,a.semantic.specialist);
      if(a.semantic.specialist==='press'){assert.ok(a.line.endsWith('?'));assert.ok(a.line.endsWith(b.line),'specialist lead preserves the complete topic question');}
      if(a.semantic.specialist==='strength'){assert.ok(a.line.includes(a.semantic.detail));}
     }
    }
   }
   assert.equal(JSON.stringify(st.core),JSON.stringify(priorSpecialist.core),'G4B3 graph parity');
   for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(priorSpecialist[k]),'G4B3 '+k+' parity');
   if(round==='answer'&&id==='turn'){
    recoveryPairs++;
    const old=oldBankPolicy.log.slice(oldAt),now=priorSpecialist.log.slice(priorAt);
    for(const side of ['w','f']){
     const a=now.find(e=>e.side===side),b=old.find(e=>e.side===side);
     assert.ok(a&&b);assert.equal(a.semantic?.claim,b.semantic?.claim);assert.equal(a.semantic?.move,b.semantic?.move);
     if(b.authoredId)assert.equal(a.authoredId,b.authoredId,'existing V2 authored answer must not be displaced');
     if(a.authoredId&&!b.authoredId){
      assert.ok(L.bankReuseRecovery[a.authoredId]?.slice(1).includes(a.semantic.claim),'new hit must be exact recovery approval');
      recoveryHits++;recoveryIds.add(a.authoredId);recoveryOwners.add(a.dialogueSlot.owner);inc(recoveryTopics,side+'|'+a.semantic.claim);
     }
    }
   }
   assert.equal(JSON.stringify(st.core),JSON.stringify(oldBankPolicy.core),'G4B2 graph parity');
   for(const k of ['meter','steps','stage','round','pushed'])assert.equal(JSON.stringify(st[k]),JSON.stringify(oldBankPolicy[k]),'G4B2 '+k+' parity');
   if(round==='open'){
    const before=S.latest(previous.log,'f')?.entry,after=S.latest(st.log,'f')?.entry;
    assert.ok(before&&after,'opening has opponent reply');
    assert.equal(after.line,before.line,'classification must not change opening speech');
    assert.equal(JSON.stringify(st.core),JSON.stringify(previous.core),'classification leaves opening graph unchanged');
    if(!before.semantic?.claim)oldUnknown++;
    if(!after.semantic?.claim){newUnknown++;inc(remainingUnknown,id+'|'+(st.core.steps.at(-1)?.variant||'-')+'|'+after.line);}
    if(!before.semantic?.claim&&after.semantic?.claim){classifiedOpenings++;inc(recoveredSources,after.semantic.source+'|'+after.semantic.claim);}
    if(before.semantic?.claim)assert.equal(after.semantic?.claim,before.semantic.claim,'previous reviewed claims remain stable');
   }
   if(plain){plainRoot.OfficeMic.choose(plain,id);assert.equal(JSON.stringify(st),JSON.stringify(plain),'G4A observation changes live state');}
   const spoken=st.log.slice(before);
   for(const row of activeScene.slice(observedBefore)){
    const e=spoken.find(e=>e.side===row.side&&e.dialogueSlot?.stage===row.stage&&e.dialogueSlot?.action===row.action);
    assert.ok(e,'observed selection must be emitted');
    if(row.semantic){assert.equal(e.semantic?.claim,row.semantic.claim);assert.equal(e.semantic?.move,row.semantic.move);assert.equal(e.semantic?.replyTo,row.semantic.replyTo);}
    if(row.authoredId)assert.equal(e.authoredId,row.authoredId,'observed authored line must be spoken');
    emittedChecks++;
   }
   for(const e of spoken)if(e.authoredId)actualAuthoredIds.add(e.authoredId);
  }
  assert.ok(Mic.result(st),'completed demand scene');
  if(plain)assert.equal(JSON.stringify(Mic.result(st)),JSON.stringify(plainRoot.OfficeMic.result(plain)),'G4A result parity');
  activeScene=null;sceneCount++;
 }
 delete root.__promoDemandObserver;
 assert.equal(sceneCount,roster.length*samples);
 assert.equal(emittedChecks,observations);
 for(const w of roster){assert.equal(playerAssignments.get(w.id),samples);assert.equal(opponentAssignments.get(w.id),samples);assert.ok(actorStats.has(w.id+'|player'),'missing player demand '+w.id);assert.ok(actorStats.has(w.id+'|opponent'),'missing opponent demand '+w.id);}
 assert.equal([...topicStats.values()].reduce((n,x)=>n+x.unexpected_fallback,0),0,'audit must explain all observed fallbacks');
 const totals=zero();for(const x of topicStats.values())for(const r of reasons)totals[r]+=x[r];
 const rank=(a,b)=>b.eligible-b.authored-(a.eligible-a.authored)||a.key.localeCompare(b.key);
 const topics=[...topicStats].map(([key,x])=>({key,...describe(x)})).sort(rank);
 const actors=[...actorStats].map(([key,x])=>({key,...describe(x)})).sort(rank);
 const detail=[...demand].map(([key,x])=>({key,...describe(x)})).sort(rank);
 assert.ok(classifiedOpenings>0&&newUnknown<oldUnknown,'G4B.1 must recover previously unknown openings');
 const classification={oldUnknown,newUnknown,recovered:classifiedOpenings,scenes:sceneCount,sources:Object.fromEntries(recoveredSources),remaining:Object.fromEntries(remainingUnknown)};
 console.log('G4B1 CLASSIFICATION '+JSON.stringify(classification));
 const recovery={pairedExchanges:recoveryPairs,recoveredTurns:recoveryHits,distinctIds:recoveryIds.size,characters:recoveryOwners.size,topics:Object.fromEntries(recoveryTopics)};
 assert.ok(recoveryHits>0&&recoveryOwners.size>0,'G4B2 live recovery');
 console.log('G4B2 RECOVERY '+JSON.stringify(recovery));
 const specialist={pairedExchanges:specialistPairs,recoveredTurns:specialistHits,lostTurns:specialistLosses,distinctIds:specialistIds.size,characters:specialistOwners.size,moves:Object.fromEntries(specialistMoves)};
 assert.ok(specialistHits>specialistLosses,'G4B3 net authored recovery');
 console.log('G4B3 SPECIALIST '+JSON.stringify(specialist));
 const topicBank={pairedExchanges:topicPairs,recoveredTurns:topicHits,lostTurns:topicLosses,distinctIds:topicIds.size,characters:topicOwners.size,sides:Object.fromEntries(topicSides)};
 assert.ok(topicHits>topicLosses&&topicSides.get('w')>0&&topicSides.get('f')>0,'G4C1 live recovery in both roles');
 const batch={recoveredTurns:batchHits,distinctIds:batchIds.size,characters:batchOwners.size,sides:Object.fromEntries(batchSides),priorBatchTurns:topicHits-batchHits};
 assert.ok(batchHits>0&&batchSides.get('w')>0&&batchSides.get('f')>0,'G4C8 additional live recovery in both roles');
 assert.equal(batch.priorBatchTurns,386,'first seven batches recovery unchanged');
 console.log('G4C8 EVIDENCE '+JSON.stringify({...topicBank,batch}));
 assert.equal(topicHits,413,'G4C final recovery preserved');
 const followup={pairedExchanges:followupPairsD,recoveredTurns:followupHits,lostTurns:followupLosses,distinctIds:followupIdsD.size,characters:followupOwnersD.size};
 assert.ok(followupD2Hits>0,'G4D2 additional live recovery');assert.equal(followupD2Hits,20,'G4D2 recovery preserved');assert.equal(followupHits-followupD2Hits-followupD3Hits-followupD4Hits-followupD5Hits-followupD6Hits-followupD7Hits,28,'G4D1 recovery preserved');assert.equal(followupD3Hits,20,'G4D3 recovery preserved');assert.equal(followupD4Hits,20,'G4D4 recovery preserved');assert.equal(followupD5Hits,13,'G4D5 recovery preserved');assert.equal(followupD6Hits,10,'G4D6 recovery preserved');assert.ok(followupD7Hits>0,'G4D7 incremental recovery');assert.equal(followupLosses,0);
 console.log('G4D7 FOLLOWUP '+JSON.stringify({...followup,priorBatchTurns:followupHits-followupD7Hits,newBatchTurns:followupD7Hits}));
 const report={classification,recovery,specialist,topicBank,batch,followup,scenes:sceneCount,characters:roster.length,samplesPerRole:samples,observations,emittedChecks,formats:Object.fromEntries(formatsSeen),loadedBankIds:loadedIds.size,usedBankIds:actualAuthoredIds.size,semanticBankIds:observedIds.size,totals:describe(totals),skipped:Object.fromEntries(skipped),topics,actors,detail};
 console.log('G4A DEMAND SUMMARY '+JSON.stringify({...report,topics:undefined,actors:undefined,detail:undefined}));
 for(const x of topics)console.log('G4A TOPIC '+JSON.stringify(x));
 for(const x of actors)console.log('G4A ACTOR '+JSON.stringify(x));
 // Compact per-character topic-level rows in CI logs, and full detail in
 // optional JSON; no new workflow or artifact upload is needed.
 for(const w of roster)console.log('G4A GAPS '+w.id+' '+JSON.stringify(detail.filter(x=>x.key.startsWith(w.id+'|')&&x.eligible>x.authored).map(x=>[x.key.slice(w.id.length+1),x.eligible,x.authored,x.reasons])));
 if(process.env.PROMO_DEMAND_JSON)fs.writeFileSync(process.env.PROMO_DEMAND_JSON,JSON.stringify(report,null,2));
 console.log('PASS G4A demand audit: '+sceneCount+' balanced scenes; '+observations+' observed and emitted decisions; all '+roster.length+' characters in both roles; '+roster.length+' uninstrumented parity scenes.');
}
