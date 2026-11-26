'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficePromoDialogue:L,OfficePromoSemantics:S,OfficeMic:M,OfficeData:D,OfficeAcademy:A,OfficeGame:G}=root;
const routes=[{"claim":"evidence","stage":"answer","action":"turn","side":"w","move":"rebut"},{"claim":"evidence","stage":"answer","action":"turn","side":"f","move":"counter"},{"claim":"experience","stage":"answer","action":"turn","side":"w","move":"rebut"},{"claim":"experience","stage":"answer","action":"turn","side":"f","move":"counter"},{"claim":"study","stage":"answer","action":"turn","side":"w","move":"rebut"},{"claim":"study","stage":"answer","action":"turn","side":"f","move":"counter"},{"claim":"strength","stage":"answer","action":"turn","side":"f","move":"counter"},{"claim":"evidence","stage":"push","action":"press","side":"w","move":"press"},{"claim":"evidence","stage":"push","action":"press","side":"f","move":"press_counter"},{"claim":"evidence","stage":"push","action":"acknowledge","side":"w","move":"acknowledge"}];
const clone=x=>JSON.parse(JSON.stringify(x));
const seen=new Set();
const people=A.REGISTER, p=D.PROMOS[0],other=D.ALL[0];
let count=0;
for(const person of people){
 const w={...person,style:person.wrestling_style,age:person.entry_age};
 const facts=L.snapshot({},w,other,null,p,{});
 assert.equal(facts.player.academy.id,w.id);
 for(const r of routes){
  const ctx={...r,speaker:facts.player,opponent:facts.opponent,client:facts.player,hasMouthpiece:false,previous:'Prior spoken claim',protected:r.stage==='answer'?'contextual-variant':null};
  const sem={claim:r.claim,move:r.move,detail:r.claim==='strength'?'hard strikes':null};
  const first=L.selectRookieSemantic(ctx,'fixture',{used:[],recent:[]},sem);
  assert.ok(first,w.id+' '+JSON.stringify(r));seen.add(first.id);
  const second=L.selectRookieSemantic(ctx,'fixture',{used:[first.id],recent:[]},sem);
  assert.ok(second);assert.notEqual(second.id,first.id);seen.add(second.id);
  assert.equal(L.selectRookieSemantic(ctx,'fixture',{used:[second.id],recent:[first.id]},sem),null);
  assert.equal(JSON.stringify(first),JSON.stringify(L.selectRookieSemantic(clone(ctx),'fixture',{used:[],recent:[]},clone(sem))));
  assert.equal(L.selectRookieSemantic({...ctx,protected:'recorded-evidence'},'fixture',{},sem),null);
  assert.equal(L.selectRookieSemantic({...ctx,hasMouthpiece:true},'fixture',{},sem),null);
  assert.equal(L.selectRookieSemantic({...ctx,speaker:facts.opponent},'fixture',{},sem),null);
  assert.equal(L.selectRookieSemantic(ctx,'fixture',{}, {...sem,move:'settle'}),null);
  if(r.claim==='strength'){assert.match(first.text,/hard strikes/);assert.equal(L.selectRookieSemantic(ctx,'fixture',{}, {...sem,detail:null}),null);}
  if(r.move==='press')assert.ok(first.text.endsWith('?'));
  assert.doesNotMatch(first.text,/[{}]/);
  count++;
 }
}
assert.equal(count,1200);
assert.equal(seen.size,80,'two shared lines per style and route, no per-character duplication');
// Preference is observable without changing the actor or seed. Older saved
// scenes keep their existing seed-only selection.
for(const style of ['Technical','Brawl','Story','Spectacle']){
 const person=people.find(p=>p.wrestling_style===style);
 const facts=L.snapshot({}, {...person,style},other,null,p,{});
 const base={stage:'answer',action:'turn',side:'w',speaker:facts.player,opponent:facts.opponent,client:facts.player,hasMouthpiece:false,previous:'Prove it.',protected:'contextual-variant',irritation:10,composure:80};
 const withDelivery=delivery=>({...base,speaker:{...base.speaker,academy:{...base.speaker.academy,delivery}}});
 const sem={claim:'evidence',move:'rebut'},mem={rookieVoice:1,used:[],recent:[]};
 const direct=L.selectRookieSemantic(withDelivery('Dry and direct'),'same',mem,sem);
 const warm=L.selectRookieSemantic(withDelivery('Warm and reflective'),'same',mem,sem);
 assert.ok(direct&&warm);assert.notEqual(direct.id,warm.id,style+' delivery must matter');
 const pressure=L.selectRookieSemantic({...withDelivery('Warm and reflective'),irritation:75},'same',mem,sem);
 assert.equal(pressure.id,direct.id,style+' pressure narrows delivery');
 assert.equal(L.selectRookieSemantic(withDelivery('Dry and direct'),'same',{...mem,recent:[direct.id]},sem).id,warm.id);
 assert.equal(L.selectRookieSemantic(withDelivery('Dry and direct'),'same',{...mem,recent:[direct.id,warm.id]},sem),null);
}

// Actual academy arrivals: compare real choices with identical prior claim and
// disabled new policy. A prior saved scene with no flag must not use new lines.
G.fresh();G.S.week=16;G.endWeek();
const arrivals=G.S.academy.arrived;
assert.ok(arrivals.length>0);
const liveSides=new Set();
for(const rookie of arrivals)for(const side of ['w','f']){
 const veteran=D.ALL.find(x=>!x.id.startsWith('academy-')&&D.divisionOf(x)===D.divisionOf(rookie));
 assert.ok(veteran,'missing same-division veteran for '+rookie.id);
 const w=side==='w'?rookie:veteran,f=side==='f'?rookie:veteran;
 for(let i=0;i<48;i++){
  const c={id:'rookie-family-'+side+'-'+rookie.id+'-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:100+i,finish:'win_clean',minutes:12,feudHeat:0};
  const st=M.begin(c,w,f,null,null,p,{directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,banks:promoBanks(w.id,f.id)});
  const opening=M.choices(st).find(o=>['people','swagger','proof','imagery'].includes(o.id));
  if(!opening)continue;M.choose(st,opening.id);
  const prior=S.latest(st.log,'f');
  if(!prior||!S.allowed(st)||M.ROUNDS[st.round]?.id!=='answer'||!M.choices(st).some(o=>o.id==='turn'))continue;
  prior.entry.line='I have studied your previous matches and prepared for your approach.';
  prior.entry.semantic={v:1,kind:'claim',claim:'study',source:'rookie-fixture'};
  const before=st.log.length,legacy=clone(st),restored=clone(st);
  delete legacy.authoredDialogue.rookieSemantic;
  M.choose(st,'turn');M.choose(restored,'turn');M.choose(legacy,'turn');
  assert.equal(JSON.stringify(st),JSON.stringify(restored));
  const e=st.log.slice(before).find(e=>e.side===side&&e.semantic?.rookieFamilyBank===1);
  if(!e)continue; // eligible individual rows retain priority
  assert.equal(e.semantic.claim,'study');assert.ok(st.authoredDialogue.used.includes(e.authoredId));
  assert.equal(e.dialogueSlot.owner,rookie.id);
  assert.ok(!legacy.log.slice(before).some(e=>e.semantic?.rookieFamilyBank));
  for(const k of ['core','meter','steps','stage','round'])assert.equal(JSON.stringify(st[k]),JSON.stringify(legacy[k]),k);
  liveSides.add(side);break;
 }
}
assert.deepEqual([...liveSides].sort(),['f','w'],'shared response must reach both sides in live duels');
console.log('PASS academy shared semantics: '+count+' named rookie routes; '+seen.size+' shared lines; actual intake live reach on both sides.');


 // R5B1 exact vow and reply routes, both sides, all styles. All variants
 // retain their public commitment, and no record/mouthpiece bypass exists.
 const vowIds=new Set();
 for(const style of ['Technical','Brawl','Story','Spectacle']){
  const person=people.find(p=>p.wrestling_style===style),facts=L.snapshot({}, {...person,style},other,null,p,{});
  for(const variant of ['vo_plain','vo_hard','vo_fans','vo_guarantee'])for(const side of ['w','f']){
   const ctx={stage:'close',action:'vow',side,speaker:facts.player,opponent:facts.opponent,client:facts.player,variant,protected:'contextual-variant',hasMouthpiece:false};
   const a=L.selectRookieVow(ctx,'fixture',{used:[],recent:[]});
   assert.ok(a,style+' '+variant+' '+side);vowIds.add(a.id);
   const b=L.selectRookieVow(ctx,'fixture',{used:[a.id],recent:[]});
   assert.ok(b);vowIds.add(b.id);assert.notEqual(a.id,b.id);
   assert.equal(L.selectRookieVow(ctx,'fixture',{used:[b.id],recent:[a.id]}),null);
   assert.ok(L.closingCommitment({text:a.text},ctx));assert.ok(L.closingCommitment({text:b.text},ctx));
   assert.equal(L.selectRookieVow({...ctx,protected:'recorded-evidence'},'fixture',{}),null);
   assert.equal(L.selectRookieVow({...ctx,hasMouthpiece:true},'fixture',{}),null);
   assert.equal(L.selectRookieVow({...ctx,speaker:facts.opponent},'fixture',{}),null);
   assert.equal(L.selectRookieVow({...ctx,variant:'vo_quick'},'fixture',{}),null);
  }
 }
 assert.equal(vowIds.size,64);

 // R6: synthetic future entrants beyond the fixed 120-person reserve.
 // Do not add them to the career registry or alter the intake cap.
 const F=root.OfficeRookiePhraseFactory,B=root.OfficePromoBanks,I=root.OfficePromoIdentity;
 const futureIds=new Set(),futureVoices=new Set(),futureGoals=new Set();
 const voices=['Measured and methodical','Eager and quick to speak','Reserved until challenged','Blunt but sincere','Restless and ambitious','Warm and reflective'];
 const goals=['Earn a first regular circuit booking','Learn from a veteran without losing their own style','Make a name on every promotion’s card','Earn a title opportunity through consistent work'];
 for(const style of ['Technical','Brawl','Story','Spectacle'])for(let i=0;i<24;i++){
  const veteran=D.ALL.find(w=>!w.id.startsWith('academy-')&&w.style===style);
  const rookie={...veteran,id:'academy-future-'+style.toLowerCase()+'-'+i,name:'Future '+style+' '+i,short:'Future '+i,age:21,tier:'Rookie',voice:voices[i%voices.length],ambition:goals[i%goals.length]};
  const made=F.runtime(rookie);
  assert.ok(made);futureIds.add(made.bank.owner);futureVoices.add(made.profile.delivery);futureGoals.add(made.profile.motivation);
  assert.equal(made.bank.rows.length,32);
  assert.ok(Object.values(F.phraseCoverage(made.profile)).every(n=>n>0));
  assert.equal(JSON.stringify(made),JSON.stringify(F.runtime({...rookie,age:45,heat:0,mic:99})));
  B.catalogue([made.bank]);
  for(const row of made.bank.rows.filter(r=>r[3]==='f')){
   const id=rookie.id+'.'+row[0],tag=S.fromBank(id,row[5],made.claims);
   // Some claims are not semantic topics (safe unclassified fallback).
   if(tag){assert.equal(tag.kind,'claim');assert.equal(S.fromBank(id,row[5]+' altered',made.claims),null);}
  }
 }
 assert.equal(futureIds.size,96);assert.ok(futureVoices.size>=4);assert.ok(futureGoals.size>=3);
 assert.equal(F.runtime(D.ALL.find(w=>!w.id.startsWith('academy-'))),null);
 assert.equal(F.runtime({...people[0],style:people[0].wrestling_style}),null,'existing manifest bank unchanged');
 assert.equal(F.runtime({id:'academy-future-bad',style:'Unknown'}),null);
 const liveFuture=new Set();
 for(const style of ['Technical','Brawl','Story','Spectacle'])for(const side of ['w','f']){
  const veteran=D.ALL.find(w=>!w.id.startsWith('academy-')&&w.style===style);
  const rookie={...veteran,id:'academy-future-live-'+style.toLowerCase(),name:'Future Worker',short:'Future',age:21,tier:'Rookie',voice:'Warm and reflective',ambition:goals[0]};
  const w=side==='w'?rookie:veteran,f=side==='f'?rookie:veteran;
  for(let i=0;i<16;i++){
   const c={id:'future-live-'+style+'-'+side+'-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:100+i,finish:'win_clean',minutes:12,feudHeat:0};
   const options={directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,banks:promoBanks(w.id,f.id)};
   const st=M.begin(c,w,f,null,null,p,options);
   assert.ok(st.authoredDialogue.banks.some(b=>b.owner===rookie.id));
   assert.equal(st.dialogueFacts[side==='w'?'player':'opponent'].id,rookie.id);
   const resumed=clone(st);
   for(let step=0;st.stage!=='done';step++){
    assert.ok(step<12);
    const round=M.ROUNDS[st.round].id,choices=M.choices(st);
    const wanted=({open:'proof',answer:'turn',push:'press',close:'vow'})[round];
    const action=(choices.find(x=>x.id===wanted)||choices[0]).id;
    M.choose(st,action);M.choose(resumed,action);
   }
   assert.equal(JSON.stringify(st),JSON.stringify(resumed));
   if(st.log.some(e=>e.side===side&&e.authoredId?.startsWith(rookie.id+'.g.')))liveFuture.add(style+'|'+side);
  }
 }
 assert.ok([...liveFuture].some(x=>x.endsWith('|w'))&&[...liveFuture].some(x=>x.endsWith('|f')),'future generated banks must speak on both sides');
 console.log('PASS R6 future recruit dialogue: '+futureIds.size+' manifest-free identities, '+liveFuture.size+' live style/side groups, deterministic save snapshots.');
