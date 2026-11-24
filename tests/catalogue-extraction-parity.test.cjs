'use strict';
// Structural extraction only: compare to the exact pre-extraction Git revision.
// Requires the baseline commit (normal clone or CI checkout with fetch-depth: 0).
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const {engineFiles}=require('./_source.cjs');
const lab=require('../tools/graph-lab/core.js');
const base='72f040287d253d66382bd259e1e31f2bc592d14c';
const dir=path.join(__dirname,'..','assets','js');
function load(old){
 const root={addEventListener(){}};
 const clock=class extends Date{static now(){return 1700000000000;}};
 let rng=9182;
 const math=Object.create(Math);math.random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 for(const file of engineFiles){
  if(old&&file==='match-catalog.js')continue;
  const source=old&&file==='match-graph.js'?execFileSync('git',['show',base+':assets/js/match-graph.js'],{encoding:'utf8',maxBuffer:2*1024*1024}):fs.readFileSync(path.join(dir,file),'utf8');
  vm.runInNewContext(source,{window:root,Date:clock,Math:math,JSON,console},{filename:file});
 }
 root.OfficeRosterV4.enableProfiles();
 return root;
}
const before=load(true),after=load(false);
const a=before.OfficeMatch.GRAPH,b=after.OfficeMatch.GRAPH;
function same(x,y,label){
 // Preserve ordering as well as values, especially candidate insertion order.
 const left=JSON.stringify(x??null),right=JSON.stringify(y??null);
 const digest=s=>createHash('sha256').update(s).digest('hex');
 assert.equal(digest(right),digest(left),label);
}
for(const key of ['A','ARCS','CATALOG','OUTCOMES','OUTCOME_EDGES','PATTERNS','SCRIPTED_SPOT_IDS','TECHNIQUE_PILOT','TECHNIQUE_EXPANSION','TECHNIQUE_TRANCHE2','TECHNIQUE_DEPTH','TECHNIQUE_CHAINS','TECHNIQUE_AUDIT24_LINKS','PHASE9_NEW_EDGES']){
 same(a[key],b[key],'exact ordered graph data: '+key);
}
same(a.validate(),b.validate(),'graph validation');
assert.equal(b.validate().errors.length,0);
const roster=lab.roster(after.OfficeData),plans=['story','technical','brawl','spots','safe'];
const clone=x=>JSON.parse(JSON.stringify(x));
let bouts=0;
function compare(opts,label){
 const x=lab.runMatch(before,clone(opts)),y=lab.runMatch(after,clone(opts));
 for(const key of ['graph','log','final','structureDirector','seed','wSt','fSt','mom','t','outcome','nearfalls','botches','spotHits','finishRoute']){
  same(x[key]??null,y[key]??null,label+' '+key);
 }
 bouts++;
}
for(let i=0;i<60;i++){
 const w=roster[i%roster.length],f=roster[(i*7+19)%roster.length];
 const options=lab.makeOptions(after.OfficeData,{wid:w.id,rid:f.id===w.id?roster[(i+1)%roster.length].id:f.id,
  plan:plans[i%5],slot:i%2?'main':'mid',finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],seed:62001+37*i});
 options.minutes=[8,12,18][i%3];compare(options,'ordinary '+i);
}
const D=after.OfficeData,Room=after.OfficeRoom,S=after.OfficeSheets;
const w=D.TALENT.find(x=>x.style==='Spectacle'),f=D.FOES[0],p=D.PROMOS[0];
for(const info of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const game of ['story','technical']){
 const contract={id:'catalogue-'+info.id+'-'+lead+'-'+game,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:'win_clean',minutes:12,eventAbs:71,feudHeat:20};
 const choice={id:info.id,lead};
 const st=Room.begin(contract,w,f,p,{structure:choice,structurePlanning:true});
 st.queue=[];Room.act(st,'plan_'+game);Room.act(st,'board_ok');Room.act(st,'review_ok');Room.act(st,'talk_none');
 assert.equal(st.stage,'done');
 compare({w:{...w,fatigue:4,flags:{}},f,p,slot:'main',minutes:st.sheet.minutes,finish:contract.finish,feudHeat:20,
  plan:{game:st.sheet.game,leash:'script',talk:'none'},seed:290000+bouts,preparation:{},flags:{},sheet:clone(st.sheet),
  structureExecution:S.STRUCTURES.executionChoice(st.sheet,choice)},'signed '+contract.id);
}
console.log('PASS exact pre-refactor catalogue, ordered edges, events, commentary, settlement and '+bouts+' seeded bouts (60 ordinary + 16 signed structures)');
