'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core,promoBanks}=require('./_source.cjs'),{check}=require('../scripts/build-promo-banks.cjs');
const built=check(),storage=new Map();
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const plain=x=>JSON.parse(JSON.stringify(x));
let calls=[],offline=false,corrupt=false;
function create(){
 const root={addEventListener(){},localStorage,navigator:{get onLine(){return !offline;}},fetch:async url=>{
  calls.push(url);if(offline)throw Error('offline');
  const raw=built.assets.get(url.split('/').at(-1));
  return {ok:!!raw,text:async()=>corrupt?'{}':raw};
 }};
 vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console,setTimeout,clearTimeout});
 return root;
}
(async()=>{
 const root=create(),B=root.OfficePromoBanks,L=root.OfficePromoDialogue,D=root.OfficeData,M=root.OfficeMic;
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert.ok(!html.includes('src="assets/js/promo-dialogue-pilot.js"')&&!html.includes('src="assets/js/promo-dialogue-bank-'));
 assert.equal(calls.length,0,'startup must not fetch any character');
 assert.equal(root.OfficePromoPilot,undefined,'production engine must not expose editorial sources');
 assert.equal(built.assets.size,52);assert.equal(built.packs.reduce((n,p)=>n+p.lines.length,0),1673);
 const [a,b]=await Promise.all([B.load(['mara','brick','mara','unknown']),B.load(['mara'])]);
 assert.equal(calls.length,2);assert.equal(a.length,2);assert.equal(b.length,1);
 for(const asset of a){
  const source=built.packs.find(p=>p.owner===asset.owner);
  assert.deepEqual(plain(B.decode(asset)),plain(source),'all existing text and stable IDs preserved');
 }
 const initialCalls=calls.length;await B.load(['mara','brick']);assert.equal(calls.length,initialCalls);
 offline=true;const reload=create();const cached=await reload.OfficePromoBanks.load(['mara','brick','nova']);
 assert.equal(cached.length,2);assert.equal(calls.length,initialCalls+1);
 offline=false;corrupt=true;assert.equal((await reload.OfficePromoBanks.load(['nova'])).length,0);
 corrupt=false;assert.equal((await reload.OfficePromoBanks.load(['nova'])).length,1,'failed payload retry');
 const w=D.ALL.find(x=>x.id==='mara'),f=D.ALL.find(x=>x.id==='brick'),p=D.PROMOS[0];
 let authored=0,composed=0;
 for(let i=0;i<80;i++){
  const c={id:'lazy-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:i,finish:'win_clean',minutes:12,feudHeat:i%3?0:60};
  const opt={directed:true,formats:true,dialogue:true,authored:true};
  const lazy=M.begin(c,w,f,null,null,p,{...opt,banks:a}),eager=M.begin(c,w,f,null,null,p,{...opt,banks:promoBanks(w.id,f.id)}),fallback=M.begin(c,w,f,null,null,p,{...opt,banks:[],composition:true});
  while(lazy.stage!=='done'){
   const stage=M.ROUNDS[lazy.round].id,choices=M.choices(lazy),want=stage==='open'?'proof':stage==='answer'?'turn':stage==='push'?'press':'vow';
   const id=(choices.find(x=>x.id===want)||choices[0]).id,copy=plain(lazy);
   M.choose(lazy,id);M.choose(copy,id);M.choose(eager,id);M.choose(fallback,id);
   assert.equal(JSON.stringify(lazy),JSON.stringify(copy),'serialized banks pin resume');
   assert.equal(JSON.stringify(lazy.log),JSON.stringify(eager.log),'network payload must preserve exact on-disk production dialogue');
  }
  const lr=M.result(lazy),fr=M.result(fallback);
  for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta'])assert.deepEqual(plain(lr[k]),plain(fr[k]),k);
  authored+=lr.dialogueIds.length;
  for(const e of fr.dialogue.filter(e=>e.composedId)){
   composed++;assert.ok(!e.authoredId&&!/[{}]/.test(e.line));assert.ok(!['recorded-argument','recorded-evidence','specific-match-plan','closing-contract'].includes(e.dialogueSlot.protected));
  }
 }
 assert.ok(authored>0&&composed>0);
 const base={stage:'answer',action:'turn',side:'w',variant:'tu_strength',protected:'contextual-variant',speaker:{id:'test'},strength:'hard strikes',voice:'precise',previous:'I hit hard.',hasMouthpiece:false};
 const composedLine=L.compose(base,'seed');assert.ok(composedLine.text.includes('hard strikes'));
 assert.equal(L.compose({...base,protected:'recorded-evidence'},'seed'),null);
 assert.equal(L.compose({...base,hasMouthpiece:true},'seed'),null);
 assert.equal(L.compose({...base,strength:null},'seed'),null);
 assert.equal(L.compose({...base,stage:'close'},'seed'),null);
 assert.notEqual(L.compose(base,'seed',{used:[composedLine.id]}).id,composedLine.id);
 console.log('PASS lazy promo banks: exact migration of 1673 lines, two cold requests, cache/offline/retry, 80 paired scenes, '+authored+' authored and '+composed+' composed lines; deterministic resume and outcome parity.');
})().catch(e=>{console.error(e);process.exitCode=1;});
