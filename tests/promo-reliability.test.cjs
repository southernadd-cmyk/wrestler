'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {core,engineFiles,promoBanks}=require('./_source.cjs');
const {build,check}=require('../scripts/build-promo-banks.cjs');
const base=path.resolve(__dirname,'..'),built=check();
const manifestPath=path.join(base,'assets/js/promo-bank-manifest.js');
const read=fs.readFileSync;
try{
 // Simulate a Windows autocrlf checkout without changing tracked files.
 fs.readFileSync=function(file,...args){
  const data=read.call(this,file,...args);
  return file===manifestPath&&typeof data==='string'?data.replace(/\r?\n/g,'\r\n'):data;
 };
 assert.equal(check().assets.size,built.assets.size,'CRLF manifest must validate');
}finally{fs.readFileSync=read;}
const html=read(path.join(base,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script src="assets\/js\/([^"]+)" defer><\/script>/g)].map(m=>m[1]);
assert.deepEqual(scripts,[...engineFiles,'ui.js'],'headless source order must match production');
const workflow=read(path.join(base,'.github/workflows/tests.yml'),'utf8').replace(/\r\n/g,'\n');
if(process.platform!=='win32'){
 const code=workflow.split('      - name: Select only relevant checks')[1].split('        run: |\n')[1].split('      - uses: actions/setup-node')[0].split('\n').map(l=>l.replace(/^          /,'')).join('\n');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'office-promo-ci-'));
 try{
  for(const changed of ['assets/js/promo-duel.js','assets/js/promo-bank-loader.js','assets/promo-banks/brick.test.json','scripts/build-promo-banks.cjs','assets/js/story.js','assets/js/ui.js','tests/_source.cjs','index.html','docs/promo-note.md']){
   const output=path.join(temp,'github-output');fs.writeFileSync(output,'');
   const fake='git(){ if [[ "$1" == cat-file ]]; then return 0; elif [[ "$1" == diff ]]; then printf "%s\\0" "$TEST_PATH"; else return 1; fi; }\n';
   const result=spawnSync('bash',['-c',fake+code],{cwd:base,encoding:'utf8',env:{...process.env,EVENT_NAME:'pull_request',REF_TYPE:'branch',FULL_REFACTOR:'false',BASE_SHA:'a'.repeat(40),HEAD_SHA:'b'.repeat(40),RUNNER_TEMP:temp,GITHUB_OUTPUT:output,TEST_PATH:changed}});
   assert.equal(result.status,0,changed+': '+result.stderr);
   const selected=read(path.join(temp,'fast-suites.txt'),'utf8');
   if(changed.endsWith('.md'))assert.equal(selected,'','docs-only should remain fast');
   else for(const name of ['promo-dialogue','promo-selection','promo-bank-c','promo-lazy-banks','promo-reliability'])assert.ok(selected.includes('tests/'+name+'.test.cjs'),changed+' skipped '+name);
  }
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
const plain=x=>JSON.parse(JSON.stringify(x));
function runtime(fetch,timers={}){
 const store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const root={addEventListener(){},localStorage,navigator:{onLine:true},fetch};
 vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console,setTimeout:timers.setTimeout||setTimeout,clearTimeout:timers.clearTimeout||clearTimeout});
 return root;
}
const good=url=>({ok:true,text:async()=>built.assets.get(url.split('/').at(-1))});
(async()=>{
 let calls=[];
 const root=runtime(async (url,opt)=>{calls.push({url,opt});if(calls.length===1)throw Error('transient');return good(url);});
 const B=root.OfficePromoBanks,L=root.OfficePromoDialogue;
 assert.equal(root.OfficePromoPilot,undefined);
 assert.notEqual(B.hash('😀'),B.hash('😁'),'hash must include both UTF-16 code units');
 const [bank]=await B.load(['brick']);
 assert.equal(bank.owner,'brick');assert.equal(calls.length,2);assert.equal(calls[1].opt.cache,'reload');
 await B.load(['brick']);assert.equal(calls.length,2,'cached retry result reused');
 assert.deepEqual(plain(bank),promoBanks('brick')[0]);
 for(const status of [404,503]){
  let n=0;const r=runtime(async url=>{n++;return status===503&&n===2?good(url):{ok:false,status};});
  assert.equal((await r.OfficePromoBanks.load(['nova'])).length,status===503?1:0);
  assert.equal(n,status===503?2:1);
 }
 let corrupt=0;const bad=runtime(async()=>{corrupt++;return {ok:true,text:async()=>'{bad}'};});
 assert.equal((await bad.OfficePromoBanks.load(['nova'])).length,0);assert.equal(corrupt,1,'corrupt immutable payload is not retried');
 let callback,attempts=0;const hung=runtime(()=>{attempts++;return new Promise(()=>{});},{setTimeout:fn=>{callback=fn;return 1;},clearTimeout:()=>{}});
 const waiting=hung.OfficePromoBanks.load(['nova']);callback();assert.equal((await waiting).length,0);assert.equal(attempts,1);
 const n={stage:'meeting'},t=B.beginSceneLoad(n,'one');
 assert.ok(t);assert.equal(B.beginSceneLoad(n,'one'),null,'double click must not start another request');
 n.stage='meeting';assert.equal(B.completeSceneLoad(n,t,()=>true),false);assert.equal(n.promoLoading,undefined,'leaving screen releases token');
 const old=B.beginSceneLoad(n,'one'),newer=B.beginSceneLoad(n,'two');
 assert.equal(B.completeSceneLoad(n,old,()=>true),false);assert.equal(n.promoLoading,newer,'old load must not cancel new');
 assert.equal(B.completeSceneLoad(n,newer,()=>false),false);assert.equal(n.promoLoading,undefined,'changed match releases token');
 const live=B.beginSceneLoad(n,'two');assert.equal(B.completeSceneLoad(n,live,()=>true),true);
 const ctx={stage:'answer',action:'turn',side:'w',variant:'tu_strength',protected:'contextual-variant',speaker:{id:'brick',short:'Brick'},client:{short:'Brick'},opponent:{short:'Nova'},strength:'wrestling',voice:'precise',previous:'I can beat you.',hasMouthpiece:false};
 for(const voice of ['precise','grand','gruff','stoic','eager','earnest','sermon','slippery']){
  for(let i=0;i<12;i++){
   const line=L.compose({...ctx,voice},'grammar-'+i);
   assert.ok(line.text.includes('wrestling techniques'),voice+' must use plural fallback');
   assert.doesNotMatch(line.text,/\bwrestling (?:are|have|do)\b/);
  }
 }
 for(const pack of built.packs)for(const row of pack.lines.filter(r=>r.text.includes('{strength}'))){
  for(const strength of ['holds and counters','hard strikes','speed and aerial attacks','patience and ring psychology','wrestling']){
   const line=L.render(row,{...ctx,strength});
   assert.ok(line&&!line.includes('{strength}'),row.id);
   assert.doesNotMatch(line,/(?:holds and counters|hard strikes|speed and aerial attacks|patience and ring psychology|wrestling techniques)\s+(?:is|was|has|does)\b/i,row.id);
  }
 }
 // Missing explicit banks must never silently find editorial source banks.
 const D=root.OfficeData,M=root.OfficeMic,w=D.ALL.find(x=>x.id==='mara'),f=D.ALL.find(x=>x.id==='brick'),p=D.PROMOS[0];
 let authored=0;
 for(let i=0;i<24;i++){
  const c={id:'reliability-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:i,finish:'win_clean',minutes:12,feudHeat:0};
  const opt={directed:true,formats:true,dialogue:true,authored:true},explicit=M.begin(c,w,f,null,null,p,{...opt,banks:promoBanks(w.id,f.id)}),missing=M.begin(c,w,f,null,null,p,opt);
  while(explicit.stage!=='done'){
   const stage=M.ROUNDS[explicit.round].id,choices=M.choices(explicit),want=stage==='open'?'proof':stage==='answer'?'turn':stage==='push'?'press':'vow';
   const id=(choices.find(x=>x.id===want)||choices[0]).id;
   M.choose(explicit,id);M.choose(missing,id);
  }
  assert.equal(M.result(missing).dialogueIds.length,0);
  authored+=M.result(explicit).dialogueIds.length;
  assert.equal(M.result(explicit).quality,M.result(missing).quality);
 }
 assert.ok(authored>0);
 // Composed and semantic frames fill {strength}/{detail} with plural or mass noun phrases: no singular or plural verb right after them.
 const agreement=/\{(?:strength|detail)\}\s+(?:is|was|has|does|are|were|have)\b/;
 for(const file of ['assets/js/promo-dialogue.js','assets/js/promo-semantics.js']){
  const text=read.call(fs,path.join(base,file),'utf8');
  for(const line of text.split('\n'))assert.ok(!agreement.test(line),file+' placeholder agreement: '+line.trim().slice(0,120));
 }
 console.log('PASS promo reliability: production source parity, Windows EOL, targeted CI routing, transient retry, deadline, scene token lifecycle, plural strength and explicit bank loading.');
})().catch(e=>{console.error(e);process.exitCode=1;});
