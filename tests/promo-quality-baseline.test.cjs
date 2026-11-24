'use strict';
// Descriptive baseline of the shipped live promo duel, not a dialogue-quality gate.
// Run: node tests/promo-quality-baseline.test.cjs
// Optional full JSON transcript export: PROMO_AUDIT_JSON=/tmp/promos.json node tests/promo-quality-baseline.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {core}=require('./_source.cjs');
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
  const st=Mic.begin(c,w,f,rival,null,p,{directed:process.env.PROMO_AUDIT_LEGACY!=='1'});
  const rounds=[],choices=[],spoken=[];
  for(let step=0;st.stage!=='done';step++){
   assert.ok(step<12,'duel must terminate');
   const options=Mic.choices(st);assert.ok(options.length,'live duel must offer a choice');
   const round=Mic.ROUNDS[st.round]?.id||String(st.round);
   const wanted=round==='push'?(st.director?['leave','press','hold','acknowledge']:['leave','bit','quiet','pop'])[j%4]:null;
   const o=options.find(x=>x.id===wanted)||options[(i+j+step*3)%options.length];
   const before=st.log.length;
   if(j===0&&step===1){
    const copy=JSON.parse(JSON.stringify(st));Mic.choose(copy,o.id);Mic.choose(st,o.id);
    assert.equal(JSON.stringify(st),JSON.stringify(copy),'mid-scene save/resume diverged');resumeChecks++;
   }else Mic.choose(st,o.id);
   rounds.push(round);choices.push(o.id);
   for(const d of st.log.slice(before)){
    inc(kinds,d.kind||'unknown');
    if(/\b(?:undefined|NaN)\b|\{[A-Z][A-Z0-9_]*\}/.test(d.line))unresolved++;
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
  const result=Mic.result(st);assert.ok(result&&Number.isFinite(result.quality)&&result.promise,'completed promo contract');
  inc(formats,rounds.join(' > '));inc(promises,result.promise.type);
  scenes.push({worker:w.id,opponent:f.id,venue:p.venue,syntheticRivalry:!!rival,finish:c.finish,choices,quality:result.quality,spoken,dialogue:result.dialogue});
 }
}
function stats(map){
 const v=[...map.entries()],n=v.reduce((a,[,x])=>a+x.n,0),shared=v.filter(([,x])=>x.owners.size>1);
 return {utterances:n,distinctNormalized:v.length,repeatedOccurrences:n-v.length,repeatedPct:pct(n-v.length,n),crossSpeakerOccurrences:shared.reduce((a,[,x])=>a+x.n,0),crossSpeakerPct:pct(shared.reduce((a,[,x])=>a+x.n,0),n),topRepeated:v.sort((a,b)=>b[1].n-a[1].n||a[0].localeCompare(b[0])).slice(0,5).map(([line,x])=>({line,count:x.n,speakers:x.owners.size}))};
}
const voices=new Map();for(const p of profiles.values())inc(voices,p.voice);
const summary={mode:process.env.PROMO_AUDIT_LEGACY==='1'?'legacy':'directed',scenes:scenes.length,roster:roster.length,opponents:opponents.length,samplesPerWorker,resumeChecks,
 voiceCoverage:{explicit:[...profiles.values()].filter(p=>p.explicitVoice).length,fallback:[...profiles.values()].filter(p=>!p.explicitVoice).length,withOwnPromo:[...profiles.values()].filter(p=>p.ownPromoSlots.length).length,archetypes:Object.fromEntries(voices)},
 roundPatterns:Object.fromEntries(formats),promiseTypes:Object.fromEntries(promises),lineKinds:Object.fromEntries(kinds),unresolvedMarkers:unresolved,
 samePair:{coreUtterances:samePairCore,repeated:repeatedPairCore,repeatedPct:pct(repeatedPairCore,samePairCore)},
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
console.log('PASS promo baseline: completed deterministic scenes; descriptive metrics are not quality thresholds.');
