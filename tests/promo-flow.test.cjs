'use strict';
// The Office v2.8 promo event graph: node coverage, consequences and persistence.
// Run with: node tests/promo-flow.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'standalone HTML loads');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0,'engine boundary exists');
const store=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,Date,Math,JSON,console});
const D=root.OfficeData,G=root.OfficeGame,M=root.OfficeMatch,Graph=root.OfficeStory.Graph;
assert.deepEqual(Array.from(Graph.STAGES),['open','answer','close']);
assert.equal(Object.keys(Graph.NODES).length,3);
const options={open:Object.keys(Graph.NODES.open),answer:Object.keys(Graph.NODES.answer),close:Object.keys(Graph.NODES.close)};
assert.equal(options.open.length,5);
assert.equal(options.answer.length,5);
assert.equal(options.close.length,5);

const sequences=new Set(),promises=new Set(),dialogues=new Set(),spectra=new Set();
let count=0;
for(let i=0;i<625;i++){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*3)%D.FOES.length],c={id:'promo-'+i,wid:w.id,rid:f.id,eventAbs:i,feudHeat:(i%4)*21};
 const st=Graph.begin(c,w,f,i%3===0?{heat:c.feudHeat,matches:2,closed:false}:null);
 const pathIds=[options.open[i%5],options.answer[Math.floor(i/5)%5],options.close[Math.floor(i/25)%5]];
 const state=JSON.stringify(st);
 assert.equal(Graph.result(st),null,'no preview outcome');
 assert.equal(Graph.choices(st.stage).length,5);
 for(let step=0;step<3;step++){
  const oldStep=st.steps.length,action=pathIds[step];
  Graph.choose(st,action);
  assert.equal(st.steps.length,oldStep+1);
  assert.ok(st.dialogue.some(d=>d.speaker===f.name),'opponent has spoken');
  if(step<2)assert.equal(Graph.result(st),null,'no result before a committed closing line');
 }
 assert.equal(st.stage,'done');
 assert.throws(()=>Graph.choose(st,'open'),'cannot alter finished promo');
 assert.equal(Graph.choices(st.stage).length,0);
 const result=Graph.result(st);
 assert.ok(result.quality>=10&&result.quality<=97);
 assert.ok(result.crowdShift>=-8&&result.crowdShift<=13);
 assert.ok(result.heatDelta>=-3&&result.heatDelta<=16);
 assert.equal(result.speech.length,3,'three-part promo');
 assert.ok(result.dialogue.length>=6,'exchange includes the rival and interviewer');
 assert.equal(result.path.length,3);
 assert.doesNotMatch(JSON.stringify(result),/\{(?:W|F|PROP|MOTIF1|MOTIF2|THEME|FINISHER)\}/);
 assert.ok(result.promise?.type);
 promises.add(result.promise.type);
 sequences.add(pathIds.join('>'));
 dialogues.add(st.dialogue.map(d=>d.line).join('||'));
 spectra.add([result.crowdShift,result.heatDelta,result.trustDelta,result.quality].join(':'));
 count++;
}
assert.equal(sequences.size,125,'all 5x5x5 choice paths reached');
assert.ok(dialogues.size>=300,'many distinct transcripts');
assert.ok(spectra.size>=120,'meaningfully different result combinations');
for(const type of ['win','finisher','clean','none'])assert.ok(promises.has(type),'missing promise '+type);

// A conversation serialized mid-promo must continue identically.
const w=D.TALENT[0],f=D.FOES[0],card={id:'resume-promo',wid:w.id,rid:f.id};
const original=Graph.begin(card,w,f,null);
Graph.choose(original,'imagery');
const resumed=JSON.parse(JSON.stringify(original));
for(const id of ['callback','finisher']){Graph.choose(original,id);Graph.choose(resumed,id);}
assert.deepEqual(JSON.parse(JSON.stringify(original)),JSON.parse(JSON.stringify(resumed)),'reload is deterministic');

// A fulfilled promise and a broken promise must produce distinct repercussions.
const checks=[];
for(const [idx,finish,closing] of [[0,'win_clean','vow'],[1,'lose_clean','vow'],[2,'win_dirty','clean']]){
 G.fresh();G.sign('mara');
 const worker=G.W('mara'),foe=G.F('red'),promoter=G.P('dock');
 const c={id:'bout-'+idx,wid:worker.id,rid:foe.id,pid:promoter.id,slot:'mid',minutes:12,finish,purse:210,blowoff:false,feudHeat:20};
 G.S.card.push(c);
 const st=Graph.begin(c,worker,foe,null);
 for(const id of ['proof','calm',closing])Graph.choose(st,id);
 const promo=Graph.result(st);
 const match=M.create({w:{...worker,flags:{},fatigue:0},f:foe,p:promoter,slot:c.slot,minutes:12,finish,
  promo,plan:{game:'story',leash:'script',talk:'calm'},preparation:{},flags:{},seed:1000+idx,feudHeat:20});
 for(let step=0;step<4000;step++){
  if(match.decision&&!match.queue.length)M.resolve(match,match.decision.options.find(o=>['home','cut','protect','job'].includes(o.id))?.id||match.decision.options[0].id);
  M.next(match);if(match.done)break;
 }
 assert.ok(match.done,'match ends');
 const logs=match.log,fin={...match.final,log:logs},before=G.S.cash;
 G.applyResult(c,fin);
 const history=G.S.history[0];
 assert.equal(history.promo.dialogue.length,st.dialogue.length,'full transcript saved');
 assert.equal(history.promo.promise.checked,true);
 assert.equal(history.promo.promise.kept,idx===0,'promise consequence follows actual result');
 assert.ok(G.S.feuds['mara:red'].lastPromo?.path.length===3);
 const cash=G.S.cash,heat=G.W('mara').heat;
 G.applyResult(c,fin);
 assert.equal(G.S.cash,cash,'replay must not pay twice');
 assert.equal(G.W('mara').heat,heat,'replay must not reapply promo heat');
 assert.equal(G.S.history.length,1);
 checks.push({finish,promise:closing,kept:history.promo.promise.kept});
}
console.log('PASS promo: '+count+' scenes, '+sequences.size+' choice paths, '+dialogues.size+' transcripts, '+spectra.size+' result profiles, legacy saves and match promises');
