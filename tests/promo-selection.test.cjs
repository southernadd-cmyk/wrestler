'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {editorialCore:core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console});
const {OfficePromoDialogue:L,OfficeMic:M,OfficeData:D,OfficeStory:{Graph}}=root;
const cat=L.catalogue(root.OfficePromoPilot),plain=x=>JSON.parse(JSON.stringify(x));
const ids=['mara','brick','nova','magnus'];
assert.deepEqual(Array.from(cat.coverage(),p=>p.owner).sort(),ids.map(x=>'wrestler:'+x).sort());
const authored=new Map(root.OfficePromoPilot.flatMap(p=>p.lines.map(r=>[r.id,r])));
assert.equal(authored.size,103);
for(const side of ['w','f'])assert.equal([...authored.values()].filter(r=>r.id.startsWith('nova.pilot.ex.')&&r.when.semanticClaim==='experience'&&r.stage==='answer'&&r.action==='turn'&&r.side===side).length,2,'Nova experience expansion '+side);
for(const owner of ['nova','magnus']){
 const rows=[...authored.values()].filter(r=>r.id.startsWith(owner+'.pilot.ea.'));
 assert.equal(rows.length,2,owner+' evidence acknowledgement expansion');
 for(const r of rows){
  assert.equal(r.when.semanticClaim,'evidence');
  assert.equal(r.stage,'push');assert.equal(r.action,'acknowledge');assert.equal(r.side,'w');assert.equal(r.category,'respect');
  assert.equal(r.when.hasMouthpiece,false);
 }
}
assert.equal([...authored.values()].filter(r=>!r.when.semanticClaim).length,73,'original pilot rows preserved');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='evidence'&&r.id.startsWith('nova.pilot.ev.')).length,4,'Nova evidence expansion');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='evidence'&&r.id.startsWith('magnus.pilot.ev.')).length,4,'Magnus evidence expansion');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='evidence'&&r.id.startsWith('magnus.pilot.ep.')&&r.stage==='push'&&r.action==='press'&&r.side==='f').length,2,'Magnus evidence follow-up expansion');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='evidence'&&r.id.startsWith('mara.pilot.ep.')&&r.stage==='push'&&r.action==='press'&&r.side==='f').length,2,'Mara evidence follow-up expansion');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='evidence'&&r.id.startsWith('nova.pilot.ep.')&&r.stage==='push'&&r.action==='press'&&r.side==='f').length,2,'Nova evidence follow-up expansion');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='evidence'&&r.id.startsWith('magnus.pilot.eq.')&&r.stage==='push'&&r.action==='press'&&r.side==='w').length,2,'Magnus evidence question expansion');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='evidence'&&r.id.startsWith('nova.pilot.eq.')&&r.stage==='push'&&r.action==='press'&&r.side==='w').length,2,'Nova evidence question expansion');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='strength'&&r.id.startsWith('magnus.pilot.sc.')&&r.stage==='answer'&&r.action==='turn'&&r.side==='f').length,2,'Magnus strength counter expansion');
assert.equal([...authored.values()].filter(r=>r.when.semanticClaim==='strength'&&r.id.startsWith('nova.pilot.sc.')&&r.stage==='answer'&&r.action==='turn'&&r.side==='f').length,2,'Nova strength counter expansion');
const liveAuthored=new Map(L.combine(root.OfficePromoPilot,root.OfficePromoBankC1,root.OfficePromoBankC2).flatMap(p=>p.lines.map(r=>[r.id,r])));
assert.equal(new Set(Array.from(authored.values(),r=>r.text)).size,authored.size);
const actor={id:'mara',role:'wrestler',age:32,style:'Story',short:'Vale'},other={id:'nova',role:'wrestler',short:'Bell',style:'Technical'};
const ctx={speaker:actor,client:actor,opponent:other,stage:'answer',action:'turn',side:'w',variant:'tu_strength',strength:'holds and counters',protected:'contextual-variant',hasMouthpiece:false};
const first=L.select(cat,ctx,'seed'),second=L.select(cat,ctx,'seed',{recent:[first.id]});
assert.ok(first&&second&&first.id!==second.id);
assert.deepEqual(plain(L.select(cat,ctx,'seed')),plain(first));
assert.equal(L.select(cat,ctx,'seed',{recent:[first.id],used:[second.id]}),null);
for(const patch of [{protected:'recorded-evidence'},{protected:'recorded-argument'},{protected:'closing-contract'},{variant:'tu_record'},{hasMouthpiece:true},{strength:null},{speaker:{...actor,id:'unknown'}}])assert.equal(L.select(cat,{...ctx,...patch},'seed'),null);
const make=(id,when)=>({id,category:'rebuttal',stage:'answer',action:'turn',side:'w',text:'I am prepared for your {strength}.',when});
const ranked=L.catalogue([{owner:'mara',role:'wrestler',lines:[make('base',{variants:['tu_strength']}),make('specific',{variants:['tu_strength'],opponentStyle:'Technical'})]}]);
assert.equal(L.select(ranked,ctx,'seed').id,'specific');
assert.equal(L.select(ranked,ctx,'seed',{recent:['specific']}).id,'base');
assert.throws(()=>L.catalogue([{owner:'mara',role:'wrestler',lines:[make('bad',{variants:['tu_record']})]}]),/unapproved variant/);
assert.deepEqual(Array.from(L.recentIds({lastPromo:{dialogueIds:['first']}},[{promo:{dialogue:[{authoredId:'first'},{authoredId:'second'}]}}])),['first','second']);
// Conservative closing bank guard: no implicit or vague promise may replace
// the explicit graph commitment. Other actions are unaffected.
const vow={stage:'close',side:'w',action:'vow',variant:'vo_hard'};
assert.equal(L.closingCommitment({text:'I anticipate a difficult case. I intend to win it.'},vow),true);
assert.equal(L.closingCommitment({text:'I have made my position clear, and I intend to keep to it all the way to the finish.'},vow),false);
assert.equal(L.closingCommitment({text:'I will win.'},vow),false);
assert.equal(L.closingCommitment({text:'I will win.'},{...vow,variant:'vo_plain'}),true);
assert.equal(L.closingCommitment({text:'One clean fall in the centre. No qualifications.'},{...vow,action:'clean',variant:'cl_middle'}),true);
assert.equal(L.closingCommitment({text:'Whatever the result, both sides will know where things stand.'},{...vow,action:'clean',variant:'cl_middle'}),false);
assert.equal(L.closingCommitment({text:'Shake my hand. No shortcuts.'},{...vow,action:'clean',variant:'cl_hand'}),true);
assert.equal(L.closingCommitment({text:'I have nothing more to say.'},{...vow,action:'uncertainty',variant:'un_done'}),true);
// G1: preserve an editorially reviewed character lead, complete the
// commitment, and never promote an arbitrary or contradictory line.
const closingCtx={...ctx,...vow,hasMouthpiece:false};
const closingRow=(id,text,variant='vo_hard',action='vow')=>({id,category:'closing',stage:'close',action,side:'w',text,when:{variants:[variant]}});
const lead='I have made my position clear, and I intend to keep to it all the way to the finish.';
const unsafe='I will deliberately lose this match.';
const closeCat=L.catalogue([{owner:'mara',role:'wrestler',lines:[closingRow('reviewed',lead),closingRow('unsafe',unsafe),closingRow('unknown','I am thinking about the match.')] }]);
const restored=L.selectClosing(closeCat,closingCtx,'g1',{});
assert.equal(restored.id,'reviewed');assert.ok(restored.text.startsWith(lead+' '));assert.match(restored.text.slice(lead.length),/\b(?:hard|easy|tough)\b/i);assert.match(restored.text.slice(lead.length),/\b(?:I will win|I'll win)\b/);
assert.equal(L.selectClosing(closeCat,closingCtx,'g1',{recent:['reviewed']}),null);
for(const patch of [{protected:'recorded-argument'},{protected:'recorded-evidence'},{protected:'closing-contract'},{hasMouthpiece:true},{variant:'vo_plain'},{speaker:{...actor,id:'unknown'}}])assert.equal(L.selectClosing(closeCat,{...closingCtx,...patch},'g1',{}),null);
const exactCat=L.catalogue([{owner:'mara',role:'wrestler',lines:[closingRow('exact',"It'll be hard graft. I'll be the one standing.")]}]);
assert.equal(L.selectClosing(exactCat,closingCtx,'g1',{}).text,"It'll be hard graft. I'll be the one standing.");
const cleanCtx={...closingCtx,action:'clean',variant:'cl_middle'};
const cleanCat=L.catalogue([{owner:'mara',role:'wrestler',lines:[closingRow('cleanlead','Whatever the result, both sides will know where things stand.','cl_middle','clean'),closingRow('wrong','One clean fall, halfway through. Let everybody see it.','cl_middle','clean')]}]);
const clean=L.selectClosing(cleanCat,cleanCtx,'g1',{});assert.equal(clean.id,'cleanlead');assert.match(clean.text,/clean fall in the (?:centre|middle)/);
const p=D.PROMOS[0],rows=ids.map(id=>D.ALL.find(w=>w.id===id));assert.ok(rows.every(Boolean));
const owners=new Set(),selected=new Set();let spoken=0,scenes=0,protectedN=0,opponentN=0;
for(const w of rows)for(const f of rows.filter(x=>x.id!==w.id))for(let i=0;i<30;i++){
 const c={id:'pilot-'+w.id+'-'+f.id+'-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:i,finish:i%2?'win_clean':'lose_clean',minutes:12,feudHeat:i%3?0:65};
 const opts={directed:true,formats:true,dialogue:true};
 const a=M.begin(c,w,f,null,null,p,{...opts,authored:true,banks:promoBanks(w.id,f.id)}),b=M.begin(c,w,f,null,null,p,opts);
 const all=Object.keys(Object.fromEntries(authored));
 const avoid=M.begin(c,w,f,{lastPromo:{dialogueIds:all}},null,p,{...opts,authored:true,banks:promoBanks(w.id,f.id)});
 assert.equal(avoid.authoredDialogue.recent.length,authored.size);
 while(a.stage!=='done'){
  const round=M.ROUNDS[a.round].id,choices=M.choices(a),preferred=round==='open'?['proof','people','swagger'][i%3]:round==='answer'?['turn','calm'][i%2]:round==='push'?['press','acknowledge'][i%2]:'vow';
  const id=(choices.find(o=>o.id===preferred)||choices[0]).id,copy=plain(a),start=a.log.length;
  M.choose(a,id);M.choose(b,id);M.choose(copy,id);
  assert.equal(JSON.stringify(a),JSON.stringify(copy),'exact resume');
  for(const e of a.log.slice(start)){
   if(e.dialogueSlot?.protected&&e.dialogueSlot.protected!=='contextual-variant'){assert.ok(!e.authoredId);protectedN++;}
   if(!e.authoredId)continue;
   const r=liveAuthored.get(e.authoredId);assert.ok(r);
   assert.equal(e.dialogueSlot.owner,e.side==='w'?w.id:f.id);
   assert.equal(r.side,e.side);assert.equal(r.stage,round);assert.equal(r.action,id);
   assert.ok(e.line&&!/[{}]/.test(e.line));
   owners.add(e.dialogueSlot.owner);selected.add(e.authoredId);spoken++;if(e.side==='f')opponentN++;
  }
 }
 const ra=M.result(a),rb=M.result(b);
 for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta'])assert.equal(JSON.stringify(ra[k]),JSON.stringify(rb[k]),k);
 assert.equal(JSON.stringify(ra.promise),JSON.stringify(Graph.result(a.core).promise));
 assert.equal(new Set(ra.dialogueIds).size,ra.dialogueIds.length);
 assert.deepEqual(plain(ra.dialogueIds),plain(ra.dialogue.filter(e=>e.authoredId).map(e=>e.authoredId)));
 scenes++;
}
assert.equal(owners.size,4);assert.ok(spoken>100&&opponentN>0&&selected.size>=20&&protectedN>0);
console.log('PASS promo selection: '+scenes+' paired scenes; '+spoken+' authored utterances ('+opponentN+' opponent), '+selected.size+' distinct pilot lines reached, '+protectedN+' protected slots; deterministic resume and outcome parity.');
