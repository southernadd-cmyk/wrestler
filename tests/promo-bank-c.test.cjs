'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {editorialCore:core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console});
const {OfficePromoDialogue:L,OfficeMic:M,OfficeData:D,OfficeStory:{Graph}}=root;
const banks=[...root.OfficePromoBankC1,...root.OfficePromoBankC2].map(p=>({...p,lines:p.lines.filter(r=>!r.when.semanticClaim)}));
const cat=L.catalogue(L.combine(root.OfficePromoPilot,banks));
const normal=s=>s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu,'').trim();
assert.equal(banks.length,20);
assert.equal(new Set(banks.map(p=>p.owner)).size,20);
const text=new Set(),lineMap=new Map(),covered=new Set(),closed=new Set(),spokenIds=new Set();
for(const pack of banks){
 assert.ok(D.ALL.some(w=>w.id===pack.owner),'known character '+pack.owner);
 assert.equal(pack.lines.length,32);
 assert.ok(pack.lines.some(r=>r.side==='f')&&pack.lines.some(r=>r.stage==='close'));
 for(const r of pack.lines){
  assert.ok(!text.has(normal(r.text)),'duplicate '+r.id);
  text.add(normal(r.text));lineMap.set(r.id,r);
  const speaker={id:pack.owner,role:'wrestler',short:pack.owner,age:32,style:'Technical'};
  const ctx={speaker,opponent:{id:'other',short:'Other',style:'Brawl'},client:speaker,stage:r.stage,action:r.action,side:r.side,variant:r.when.variants?.[0]||null,protected:r.when.variants?'contextual-variant':null,hasMouthpiece:false,strength:'hard strikes'};
  assert.ok(cat.candidates(ctx).some(x=>x.id===r.id),'slot is eligible '+r.id);
  for(const protectedReason of ['recorded-argument','recorded-evidence','specific-match-plan','closing-contract'])assert.equal(cat.candidates({...ctx,protected:protectedReason}).length,0);
 }
}
assert.equal(text.size,640);
let total=0,opponent=0,closing=0;
const roster=banks.map(p=>D.ALL.find(w=>w.id===p.owner)),p=D.PROMOS[0];
for(let k=0;k<roster.length;k++)for(let i=0;i<40;i++){
 const w=roster[k],f=roster[(k+1+i%(roster.length-1))%roster.length];
 const c={id:'bank-c-'+w.id+'-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:i,finish:'win_clean',minutes:12,feudHeat:i%3?0:55};
 const opts={directed:true,formats:true,dialogue:true,authored:true,banks:promoBanks(w.id,f.id)};
 const a=M.begin(c,w,f,null,null,p,opts),b=M.begin(c,w,f,null,null,p,{...opts,authored:false});
 while(a.stage!=='done'){
  const stage=M.ROUNDS[a.round].id,choices=M.choices(a);
  const wanted=stage==='open'?['proof','people','swagger'][i%3]:stage==='answer'?['turn','calm','challenge'][i%3]:stage==='push'?['press','acknowledge'][i%2]:['vow','clean','uncertainty'][i%3];
  const id=(choices.find(x=>x.id===wanted)||choices[0]).id;
  M.choose(a,id);M.choose(b,id);
 }
 const ra=M.result(a),rb=M.result(b);
 for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta'])assert.equal(JSON.stringify(ra[k]),JSON.stringify(rb[k]),k);
 for(const e of a.log){
  const line=lineMap.get(e.authoredId);if(!line)continue;
  const owner=e.side==='w'?w.id:f.id;
  assert.equal(e.dialogueSlot.owner,owner);
  assert.ok(line.id.startsWith(owner+'.'));
  assert.equal(line.side,e.side);
  assert.equal(e.dialogueSlot.stage,line.stage);
  assert.equal(e.dialogueSlot.action,line.action);
  covered.add(owner);spokenIds.add(line.id);total++;
  if(e.side==='f')opponent++;
  if(line.stage==='close'){closing++;closed.add(ra.promise.type);assert.ok(!a.core.case);}
 }
}
assert.equal(covered.size,20);
assert.ok(total>200&&opponent>0&&closing>0&&spokenIds.size>100);
assert.ok(closed.has('win')&&closed.has('clean')&&closed.has('none'));
console.log('PASS first banks: 640 new distinct lines for 20 workers; 800 paired scenes; '+total+' new spoken lines ('+opponent+' opponent, '+closing+' closing), '+spokenIds.size+' distinct IDs reached. Outcome parity preserved.');
