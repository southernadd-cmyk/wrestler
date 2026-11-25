'use strict';
// Descriptive baseline of the shipped live promo duel, not a dialogue-quality gate.
// Run: node tests/promo-quality-baseline.test.cjs
// Optional full JSON transcript export: PROMO_AUDIT_JSON=/tmp/promos.json node tests/promo-quality-baseline.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const store=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console});
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
 assert.ok(extendedChanges>70&&extendedActors.size>20&&extendedChangedVariants.size===extendedVariants.size&&extendedNew.size>extendedOld.size,'G2D extended player voice coverage');
 console.log('PASS G2D player voice: '+extendedChanges+'/'+extendedPairs+' reviewed/protected target turns; '+extendedActors.size+' speakers; '+extendedOld.size+' -> '+extendedNew.size+' distinct normalized lines; variants '+JSON.stringify(Object.fromEntries(extendedChangedVariants))+'; unchanged graph, options and consequences.');
 assert.ok(opponentChanges>100&&opponentActors.size>=10&&opponentChangedVariants.size===opponentVariants.size&&opponentNew.size>opponentOld.size,'G2C opponent voice coverage');
 console.log('PASS G2C opponent voice: '+opponentChanges+'/'+opponentPairs+' target turns changed across '+opponentActors.size+' speakers; '+opponentOld.size+' -> '+opponentNew.size+' distinct normalized lines; variants '+JSON.stringify(Object.fromEntries(opponentChangedVariants))+'; unchanged graph, semantic fingerprints, options and other dialogue.');
 assert.equal(closingPairs,scenes.length);
 for(const [k,v] of Object.entries(closingComparison))assert.ok(v.after>v.before+10,'G1 must restore meaningful '+k+' bank use');
 console.log('PASS G1 closing recovery: '+JSON.stringify(closingComparison)+' across '+closingPairs+' paired closings; unchanged graph and consequences.');
}
console.log('PASS promo baseline: completed deterministic scenes; descriptive metrics are not quality thresholds.');
