'use strict';
// The Office v3.3: 10x promo graph — 15 angles, 135 situation-specific variants.
// Run: node tests/promo-variants.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,Date,Math,JSON,console});
const D=root.OfficeData,M=root.OfficeMatch,Graph=root.OfficeStory.Graph;

// 1. Size: ten times the 15 v3.2 choice nodes.
const size=Graph.size();
assert.equal(size.angles,15);
assert.ok(size.angles+size.variants>=150,'at least 150 promo nodes, got '+(size.angles+size.variants));
const allVariants=[];
for(const [stage,angles] of Object.entries(Graph.VARIANTS))for(const [angle,list] of Object.entries(angles)){
 assert.ok(Graph.NODES[stage][angle],'variant belongs to a real angle');
 assert.ok(list.length>=8,'each angle has many concrete versions: '+angle);
 for(const v of list){allVariants.push(stage+'.'+angle+'.'+v.id);assert.ok(v.lines.length&&v.reply.length&&v.label&&v.hint,'complete variant '+v.id);}
}
assert.equal(new Set(allVariants.map(x=>x.split('.')[2])).size,allVariants.length,'variant ids are unique');

// 2. Build many realistic situations: history, results, memories, feud heat, styles, skills.
const situations=[];
const finishes=[null,'win_clean','lose_clean','lose_protected'],mems=[null,'hurt','humiliation','chemistry'];
let k=0;
for(const w of D.TALENT)for(const f of D.FOES)for(const last of finishes)for(const mem of mems)for(const heat of [0,30,60]){
 const c={id:'v-'+(k++),wid:w.id,rid:f.id,eventAbs:k,feudHeat:heat,finish:k%2?'win_clean':'lose_clean'};
 situations.push({c,w,f,last,mem,heat,prior:k%5===0});
}
function scene(s){
 const st=Graph.begin(s.c,s.w,s.f,s.heat?{heat:s.heat,matches:s.last?1:0,closed:false,lastPromo:s.prior?{promise:{type:'win'}}:null}:null);
 if(s.last)st.history=[{finish:s.last,stars:3}];
 if(s.mem)st.memory={kind:s.mem,recall:s.w.short+' remembers the last match against '+s.f.short+'.'};
 if(s.prior)st.priorPromise={type:'win'};
 return st;
}
const seen=new Set(),triples=new Set();
let played=0;
const opens=Object.keys(Graph.NODES.open),answers=Object.keys(Graph.NODES.answer),closes=Object.keys(Graph.NODES.close);
situations.forEach((s,i)=>{
 const st=scene(s);
 const ids=[opens[i%5],answers[Math.floor(i/5)%5],closes[Math.floor(i/25)%5]];
 for(const id of ids){
  // What the player is shown is exactly what is played.
  const shown=Graph.choices(st.stage,st);
  assert.equal(shown.length,5,'five angles on screen');
  const offer=shown.find(o=>o.id===id);
  for(const o of shown)if(o.variant)seen.add(st.stage+'.'+o.id+'.'+o.variant);
  Graph.choose(st,id);
  const step=st.steps.at(-1);
  assert.equal(step.variant,offer.variant,'displayed variant is the one played');
  assert.equal(step.label,offer.label,'displayed wording is the one played');
 }
 const r=Graph.result(st);
 assert.doesNotMatch(JSON.stringify(r),/\{(?:W|F|PROP|MOTIF1|MOTIF2|THEME|FINISHER|EVIDENCE|STRENGTH)\}|undefined/,'all placeholders filled');
 assert.ok(r.dialogue.filter(d=>d.kind==='opponent').length>=2,'the opponent answers');
 triples.add(r.variants.join('>'));
 if(r.tactic.kind==='counter'&&r.tactic.families){
  const v=st.steps[2].variant;
  if(v==='qu_strikes')assert.ok(r.tactic.families.includes('strike'),'a vow to counter punches is about strikes');
  if(v==='qu_holds')assert.ok(r.tactic.families.includes('submission'),'a vow to escape holds is about submissions');
  if(v==='qu_air')assert.ok(r.tactic.families.includes('aerial'),'a vow to catch a flyer is about aerial moves');
 }
 played++;
});
const missing=allVariants.filter(x=>!seen.has(x));
assert.deepEqual(missing,[],'every variant is offered in some realistic situation');
assert.ok(triples.size>=1000,'over a thousand concrete promo paths, got '+triples.size);

// 3. Variants are contextual: a first meeting never cites the tape of a previous match.
for(const s of situations.filter(x=>!x.last&&!x.heat).slice(0,200)){
 const st=scene(s);
 assert.notEqual(Graph.choices('open',st).find(o=>o.id==='proof').variant,'pr_tape','no history, no tape to cite');
}
// ...and someone injured by this opponent can bring it up.
const hurt=situations.filter(x=>x.mem==='hurt').map(scene);
assert.ok(hurt.some(st=>Graph.choices('open',st).find(o=>o.id==='accusation').variant==='ac_injury'),'injury memories become accusations');

// 4. Determinism: the same situation gives the same promo; a mid-promo save resumes identically.
const a=scene(situations[77]),b=scene(situations[77]);
for(const id of ['imagery','callback','question']){Graph.choose(a,id);Graph.choose(b,id);}
assert.equal(JSON.stringify(a),JSON.stringify(b),'identical inputs, identical promo');
const live=scene(situations[311]);Graph.choose(live,'accusation');
const saved=JSON.parse(JSON.stringify(live));
for(const id of ['personal','vow']){Graph.choose(live,id);Graph.choose(saved,id);}
assert.equal(JSON.stringify(live),JSON.stringify(saved),'resume mid-promo is deterministic');

// 5. A specific counter vow is only kept by the matching kind of reversal in the ring.
const brawler=D.FOES.find(f=>f.style==='Brawl');
let vows=0,kept=0;
for(let i=0;i<60;i++){
 const w=D.TALENT[i%D.TALENT.length];
 const st=Graph.begin({id:'vow-'+i,wid:w.id,rid:brawler.id,eventAbs:i,feudHeat:0,finish:'win_clean'},w,brawler,null);
 for(const id of ['proof','turn','question'])Graph.choose(st,id);
 const promo=Graph.result(st);if(st.steps[2].variant!=='qu_strikes')continue;
 const x=M.create({w:{...w,flags:{},fatigue:0},f:brawler,p:D.PROMOS[0],slot:'main',minutes:D.SLOTS.main.mins,finish:'win_clean',
  promo,plan:{game:'story',leash:'script',talk:'calm'},preparation:{},flags:{},seed:300+i});
 for(let t=0;t<9000&&!x.done;t++){if(x.decision&&!x.queue.length)M.resolve(x,x.decision.options[0].id);M.next(x);}
 vows++;
 const paid=x.log.findIndex(l=>/counter promised at the microphone/.test(l.text));
 if(paid>=0){
  kept++;
  const ev=x.graph.events.find(e=>M.GRAPH.A[e.id]?.reverse&&e.preControl==='f'&&e.control==='w'&&e.t/x.len>=.58&&
   (promo.tactic.nodes.includes(e.id)||promo.tactic.families.includes(M.GRAPH.A[e.id].family)));
  assert.ok(ev,'the paid-off counter was a strike-type reversal or an authored counter');
 }
}
assert.ok(vows>0,'strike counter vows occur');
console.log('PASS promo variants v3.3: '+(size.angles+size.variants)+' nodes ('+size.angles+' angles, '+size.variants+' variants); '+
 played+' scenes; every variant reachable; '+triples.size+' concrete paths; shown = played; deterministic; specific counter vows ('+kept+'/'+vows+' kept)');
