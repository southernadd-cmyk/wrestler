'use strict';
// Phase 1: optional structure agreement is metadata only.
// Every legacy plan, signed move, RNG draw and performed finish must be identical.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,console,Date,Math,JSON});
const D=root.OfficeData,E=root.OfficeMatch,Room=root.OfficeRoom,Sheets=root.OfficeSheets,S=Sheets.STRUCTURES;
assert.equal(S.VERSION,1);
const ids=['classic_american','kings_road','chickenshit_heel','dominant_ace'];
assert.equal(JSON.stringify(S.catalogue().map(x=>x.id)),JSON.stringify(ids));
assert.equal(new Set(S.catalogue().flatMap(x=>x.objectiveIds)).size>=4,true);
const asJSON=o=>JSON.parse(JSON.stringify(o));
const validSides=['w','f'];
for(const id of ids)for(const lead of validSides){
 const s=S.create({id,lead});
 assert.equal(s.version,1);
 assert.equal(s.execution,'metadata_only');
 assert.equal(s.roles.lead,lead);
 assert.equal(s.roles.other,lead==='w'?'f':'w');
 assert.equal(s.objectives.length,4);
 assert.equal(S.validate(s).length,0);
 assert.ok(s.objectives.every((o,i)=>o.commitment==='landmark'&&
  !('status' in o)&&!('actual' in o)&&!('at' in o)&&
  (i===0?o.requires.length===0:o.requires[0]===s.objectives[i-1].id)));
 assert.equal(S.validate(asJSON(s)).length,0);
 // Roles are explicit: neither 'w' nor 'f' is automatically a babyface or the winner.
 if(id==='chickenshit_heel'){
  assert.equal(s.objectives[0].actor,lead);
  assert.equal(s.objectives[1].actor,lead==='w'?'f':'w');
 }
 if(id==='dominant_ace'){
  assert.equal(s.objectives[0].actor,lead);
  assert.equal(s.objectives[1].actor,lead==='w'?'f':'w');
 }
}
assert.equal(S.create('classic_american').roles.lead,'w','legacy reference has explicit conventional lead');
assert.throws(()=>S.create('kings_road'),/explicit lead/);
assert.throws(()=>S.create({id:'kings_road'}),/explicit lead/);
assert.throws(()=>S.create({id:'unknown_structure',lead:'w'}),/Unknown/);
assert.throws(()=>S.create({id:'kings_road',lead:'w',finish:'win_clean'}),/Unexpected/);
assert.equal(JSON.stringify(S.read({v:4,signed:true})),JSON.stringify({mode:'legacy',id:'classic_american',contract:null,errors:[]}));

const template=S.create({id:'kings_road',lead:'f'});
for(const broken of [
 {...template,version:2},
 {...template,execution:'active'},
 {...template,winner:'f'},
 {...template,roles:{lead:'w',other:'w'}},
 {...template,objectives:template.objectives.slice(1)},
 {...template,objectives:template.objectives.map((x,i)=>i===1?{...x,id:template.objectives[0].id}:x)},
 {...template,objectives:template.objectives.map((x,i)=>i===1?{...x,window:[.9,.1]}:x)},
 {...template,objectives:template.objectives.map((x,i)=>i===1?{...x,requires:['final_confrontation']}:x)},
 {...template,objectives:template.objectives.map((x,i)=>i===1?{...x,actor:'heel'}:x)},
 {...template,objectives:template.objectives.map((x,i)=>i===1?{...x,status:'achieved'}:x)}
]){
 assert.ok(S.validate(asJSON(broken)).length,'tampered/future contracts must not be silently accepted');
 assert.equal(S.read({structure:asJSON(broken)}).mode,'unsupported');
}
const w=D.TALENT.find(x=>x.style==='Spectacle'),f=D.FOES[0],p=D.PROMOS[0];
assert.ok(w&&f&&p);
function booking(id,finish='win_clean',minutes=12){
 return {id,wid:w.id,rid:f.id,pid:p.id,slot:'main',
  finish,minutes,eventAbs:41,feudHeat:15};
}
function sign(c,plan,selection){
 const opts=selection===null?{}:{structure:selection};
 const st=Room.begin(c,w,f,p,opts);st.queue=[];
 Room.act(st,'plan_'+plan);
 assert.equal(st.stage,'board');
 const cards=Room.options(st);
 const manual=cards.find(x=>x.slot==='opening'&&!x.selected&&!x.tags.includes('Will not work'));
 if(manual){
  Room.act(st,manual.id);
  assert.equal(st.board.opening.chosen,true);
 }
 const chosenOpening=st.board.opening.action;
 const alternate=Room.options(st).find(x=>x.route&&!x.selected);
 if(alternate){
  Room.act(st,alternate.id);
  assert.equal(st.board.opening.action,chosenOpening,'finish changes preserve manual spots');
 }
 const signedFinish=st.board.finish.route;
 Room.act(st,'board_ok');
 assert.equal(st.stage,'review');
 const snap=asJSON(st);
 for(const state of [st,snap]){
  Room.act(state,'review_edit');
  assert.equal(state.stage,'board');
  Room.act(state,'board_ok');
  assert.equal(state.stage,'review');
  Room.act(state,'review_ok');
  Room.act(state,'talk_none');
  assert.equal(state.stage,'done');
  assert.equal(state.sheet.finishRoute,signedFinish);
 }
 // Saving halfway through the final review must not repeat incidents or change agreements.
 assert.equal(JSON.stringify(snap.sheet),JSON.stringify(st.sheet));
 return st.sheet;
}
function play(c,sheet,seed){
 const M=E.create({w:{...w,fatigue:5,flags:{}},f,p,
  slot:'main',minutes:sheet.minutes,finish:c.finish,feudHeat:15,
  plan:{game:sheet.game,leash:sheet.leash||'script',talk:sheet.talk||'calm'},
  preparation:{},flags:{},seed,sheet:asJSON(sheet)});
 for(let i=0;i<9000&&!M.done;i++){
  if(M.decision&&!M.queue.length){
   const o=M.decision.options;
   const pick=o.find(x=>['job','keep','protect','work'].includes(x.id))||
    o.find(x=>!['home','cut','stop'].includes(x.id))||o[0];
   assert.ok(pick);E.resolve(M,pick.id);
  }
  E.next(M);
 }
 assert.ok(M.done&&M.final,'signed match completes');
 return M;
}
function tape(M){
 const report=Sheets.report(M);
 return JSON.stringify({
  events:M.graph.events,history:M.graph.history,graphOutcome:M.graph.outcome,
  log:M.log,flow:M.flow,finishRoute:M.finishRoute,finished:M.outcome,
  stars:M.final.stars,starParts:M.final.starParts,scriptChecks:M.scriptChecks,
  scriptHits:M.scriptHits,nearfallCount:M.nearfalls,botches:M.botches,
  sheetReport:report,notes:M.sheet?.nodes?.map(x=>[x.id,x.status,x.actual,x.why])
 });
}
const plans=['story','technical','brawl','spots','safe'];
const finishes=['win_clean','lose_clean','win_dirty','lose_protected'];
const cases=[];
for(let i=0;i<ids.length;i++)for(const lead of validSides)cases.push({
 id:ids[i],lead,plan:plans[(i+(lead==='w'?0:1))%5],finish:finishes[i%4]
});
for(let i=0;i<5;i++)cases.push({id:'classic_american',lead:i%2?'f':'w',plan:plans[i],finish:finishes[i%4]});
let comparisons=0;
for(let i=0;i<cases.length;i++){
 const row=cases[i],c=booking('structure-phase1-'+i,row.finish,i%3===0?8:i%3===1?12:18);
 const legacy=sign(c,row.plan,null);
 const optIn=sign(c,row.plan,{id:row.id,lead:row.lead});
 assert.equal(S.read(legacy).mode,'legacy');
 assert.equal(Object.hasOwn(legacy,'structure'),false);
 assert.equal(S.read(optIn).mode,'metadata_only');
 assert.equal(optIn.structure.id,row.id);
 const copy=asJSON(optIn);delete copy.structure;
 assert.equal(JSON.stringify(copy),JSON.stringify(legacy),
  'the only signed-sheet change is optional structure metadata');
 assert.equal(optIn.finishRoute,legacy.finishRoute,'the agreed finish is untouched');
 assert.equal(JSON.stringify(optIn.nodes),JSON.stringify(legacy.nodes),'all called spots are identical');
 const source=asJSON(optIn);
 const attached=S.read(optIn);
 attached.contract.objectives[0].title='mutated locally';
 assert.notEqual(optIn.structure.objectives[0].title,'mutated locally',
  'reader must not mutate the signed agreement');
 assert.throws(()=>S.attach(optIn,{id:'kings_road',lead:'w'}),/already/);
 assert.throws(()=>S.attach({v:3,signed:false,nodes:[]},{id:'kings_road',lead:'w'}),/signed v4/);
 const seed=77019+i*29;
 const a=play(c,legacy,seed),b=play(c,optIn,seed);
 assert.equal(tape(a),tape(b),
  'structure metadata must consume no RNG, change no events/score, and leave the finish unchanged: '+row.id+'/'+row.plan);
 assert.equal(JSON.stringify(optIn),JSON.stringify(source),'original signed metadata must remain unmodified');
 assert.equal(b.graph.outcome?.id,row.finish,'booked outcome unchanged');
 comparisons++;
}
// Opt-in metadata survives JSON serialization and real mid-match restore.
{
 const c=booking('structure-phase1-resume','win_clean',12);
 const signed=sign(c,'technical',{id:'chickenshit_heel',lead:'f'});
 const initial=E.create({w:{...w,fatigue:5,flags:{}},f,p,
  slot:'main',minutes:signed.minutes,finish:c.finish,feudHeat:15,
  plan:{game:signed.game,leash:signed.leash||'script',talk:signed.talk||'calm'},
  preparation:{},flags:{},seed:10299,sheet:asJSON(signed)});
 for(let j=0;j<40&&initial.stage!=='over';j++){
  if(initial.decision&&!initial.queue.length)E.resolve(initial,initial.decision.options[0].id);
  E.next(initial);
 }
 const restored=E.restore(asJSON({...initial,rState:initial.r.getState()}));
 assert.equal(S.read(restored.sheet).id,'chickenshit_heel');
 for(let j=0;j<9000&&!initial.done&&!restored.done;j++){
  for(const M of [initial,restored])if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
  assert.equal(E.next(initial)?.text,E.next(restored)?.text,'saved/reloaded continuation stays deterministic');
 }
 assert.ok(initial.done&&restored.done);
 assert.equal(tape(initial),tape(restored));
}
console.log('PASS Phase 1: four versioned structures, explicit actor roles, validation and '+comparisons+
 ' paired legacy-vs-opt-in full matches; exact event/finish/rating/review parity and save/reload.');
