'use strict';
// R5 organic audit: play actual choices with original claims, no fixture tags,
// forced history exhaustion or selector overrides. Both policies see identical
// contracts and actions. Report sample utilisation, not all possible routes.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeAcademy:A,OfficeGame:G,OfficeWorldV4:V,OfficeMic:M,OfficePromoIdentity:I}=root;
const clone=x=>JSON.parse(JSON.stringify(x));
G.fresh();const s=G.S;s.seed=47;s.careerSeed=47;
const veterans=D.ALL.slice(),rookies=[];
for(let season=2;season<=40&&rookies.length<A.REGISTER.length;season++){
 s.season=season;
 if(season>2){
  for(const div of ['men','women']){
   const active=D.ALL.filter(w=>D.divisionOf(w)===div&&s.worldV4.contracts[w.id]?.owner!=='retired').slice(0,3);
   for(const w of active){s.worldV4.contracts[w.id].owner='retired';s.free=s.free.filter(f=>f.id!==w.id);}
  }
  V.activate(s);
 }
 rookies.push(...A.intake(s,season));
}
assert.equal(rookies.length,A.REGISTER.length,'audit must use every actual academy identity');
assert.equal(new Set(rookies.map(w=>w.id)).size,120);
const inc=(o,k)=>o[k]=(o[k]||0)+1;
const stats=()=>({scenes:0,spoken:0,semantic:0,shared:0,authored:0,composed:0,graph:0,repeatText:0,distinctSharedIds:new Set(),owners:new Set(),sharedOwners:new Set(),routes:{},styles:{},families:{},lines:new Map()});
const policies={before:stats(),after:stats()},transcripts=[];
const histories={before:[],after:[]};let paired=0,changed=0;
function observe(policy,st,rookie,side){
 const a=policies[policy],profile=I.wrestler(rookie);
 a.scenes++;a.owners.add(rookie.id);
 const family=a.families[profile.tactic]??={scenes:0,shared:0};family.scenes++;
 const style=a.styles[rookie.style]??={scenes:0,shared:0};style.scenes++;
 const history=histories[policy];
 const priorText=new Set(history.flatMap(h=>h.texts));
 const texts=[];
 for(const e of st.log.filter(e=>e.side===side)){
  a.spoken++;const text=String(e.line).normalize('NFKC').toLowerCase().replace(/[“”‘’"'.,!?;:—–-]/g,' ').replace(/\s+/g,' ').trim();
  if(priorText.has(text))a.repeatText++;
  texts.push(text);
  const line=a.lines.get(text)||{count:0,owners:new Set()};line.count++;line.owners.add(rookie.id);a.lines.set(text,line);
  if(e.authoredId)a.authored++;else if(e.composedId)a.composed++;else a.graph++;
  if(e.semantic?.move){
   a.semantic++;const key=[e.semantic.claim,e.semantic.move,side].join('|');
   const route=a.routes[key]??={emitted:0,shared:0};route.emitted++;
   if(e.semantic.rookieFamilyBank===1){
    a.shared++;route.shared++;family.shared++;style.shared++;a.sharedOwners.add(rookie.id);a.distinctSharedIds.add(e.authoredId);
    assert.ok(!st.authoredDialogue.recent.includes(e.authoredId),'recent shared ID repeated '+e.authoredId);
    assert.ok(st.authoredDialogue.used.includes(e.authoredId));
    const prior=st.log[e.semantic.replyTo];assert.ok(prior&&prior.side!==side&&prior.semantic?.claim===e.semantic.claim,'shared line must answer the emitted claim');
   }
  }
 }
 history.unshift({ids:Array.from(M.result(st).dialogueIds||[]),texts});history.splice(12);
}
function play(st,choices){
 let step=0;
 while(st.stage!=='done'){
  assert.ok(step++<12,'scene must terminate');
  const options=M.choices(st);assert.ok(options.length);
  const round=M.ROUNDS[st.round].id,wanted=choices[round];
  const id=(options.find(o=>o.id===wanted)||options[0]).id;
  M.choose(st,id);
 }
}
const resultKeys=['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta'];
for(const [i,rookie] of rookies.entries())for(let j=0;j<8;j++){
 const side=j%2?'f':'w',pool=veterans.filter(w=>D.divisionOf(w)===D.divisionOf(rookie));
 const veteran=pool[(i+j*7)%pool.length],w=side==='w'?rookie:veteran,f=side==='f'?rookie:veteran,p=D.PROMOS[(i+j)%D.PROMOS.length];
 const c={id:'r5-'+rookie.id+'-'+j,wid:w.id,rid:f.id,pid:p.id,eventAbs:100+j,finish:j%3?'win_clean':'lose_clean',minutes:12,feudHeat:0};
 const choices={open:['proof','people','swagger','imagery'][Math.floor(j/2)],answer:'turn',push:j%4<2?'press':'acknowledge',close:'vow'};
 const opt={directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,banks:promoBanks(w.id,f.id)};
 const states={};
 for(const policy of ['before','after']){
  const st=M.begin(c,w,f,null,null,p,opt);
  // Model the existing 12-show ID history from real earlier promo results,
  // not fabricated blocked IDs. Keep the scene's ordinary recent IDs too.
  st.authoredDialogue.recent=[...new Set([...st.authoredDialogue.recent,...histories[policy].flatMap(h=>h.ids)])].slice(0,128);
  if(policy==='before')delete st.authoredDialogue.rookieVoice;
  play(st,choices);observe(policy,st,rookie,side);states[policy]=st;
 }
 const {before,after}=states;
 for(const k of resultKeys)assert.equal(JSON.stringify(M.result(before)[k]),JSON.stringify(M.result(after)[k]),rookie.id+' mechanical '+k);
 assert.equal(JSON.stringify(before.steps),JSON.stringify(after.steps),rookie.id+' choices');
 if(JSON.stringify(before.log.map(e=>e.line))!==JSON.stringify(after.log.map(e=>e.line)))changed++;
 paired++;
 if(process.env.ROOKIE_AUDIT_JSON)transcripts.push({rookie:rookie.id,side,choices,before:before.log,after:after.log});
}
assert.equal(paired,960);
function summary(a){
 const {distinctSharedIds,owners,sharedOwners,lines,...rest}=a;
 const repeats=[...lines].map(([text,v])=>({text,count:v.count,owners:v.owners.size})).sort((a,b)=>b.owners-a.owners||b.count-a.count).slice(0,12);
 return {...rest,owners:owners.size,sharedOwners:sharedOwners.size,distinctSharedIds:distinctSharedIds.size,uniqueText:lines.size,topCrossOwnerRepeats:repeats};
}
assert.equal(policies.after.owners.size,120);
const report={paired,changed,before:summary(policies.before),after:summary(policies.after)};
if(process.env.ROOKIE_AUDIT_JSON)fs.writeFileSync(process.env.ROOKIE_AUDIT_JSON,JSON.stringify({report,transcripts},null,2));
console.log('R5 ORGANIC AUDIT '+JSON.stringify(report));
console.log('PASS R5: 960 paired actual-choice scenes across 120 academy arrivals; graph outcome and recent shared ID guards.');
