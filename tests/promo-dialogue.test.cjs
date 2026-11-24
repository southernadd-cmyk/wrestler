'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console});
const {OfficePromoDialogue:L,OfficeMic:M,OfficeData:D,OfficeStory:{Graph}}=root;
const plain=x=>JSON.parse(JSON.stringify(x));
const row=(id,extra={})=>({id,category:'opening',stage:'open',action:'proof',side:'w',text:'{client} has a point to prove against {opponent}.',...extra});
const pack=(owner,lines,role='wrestler')=>({owner,role,lines});
// Synthetic scale fixture, deliberately NOT authored production content.
const packs=Array.from({length:200},(_,i)=>pack('worker-'+i,Array.from({length:84},(_,j)=>row('worker-'+i+'.'+j,{category:L.categories[j%L.categories.length]}))));
const big=L.catalogue(packs);
assert.equal(big.coverage().length,200);assert.equal(big.coverage().reduce((s,p)=>s+p.total,0),16800);
assert.equal(big.lines('wrestler','worker-199').length,84);
assert.equal(big.lines('manager','worker-199').length,0);
const s={id:'nova',role:'wrestler',short:'Bell',age:26,style:'Technical',finisher:'Bell Hold'};
const o={id:'magnus',role:'wrestler',short:'Magnus',age:41,style:'Story',finisher:'Crown'};
const ctx={speaker:s,client:s,opponent:o,venue:'The Hall',stage:'open',action:'proof',side:'w',format:'interview',titleMatch:false,hasMouthpiece:false,meetings:2,landed:true,composure:60,irritation:20,subject:'proof',protected:null};
const cat=L.catalogue([pack('nova',[
 row('nova.basic'),row('nova.age',{when:{minAge:21,maxAge:29}}),row('nova.old',{when:{minAge:40}}),
 row('nova.history',{when:{minMeetings:2}}),row('nova.title',{when:{titleMatch:true}}),
 row('nova.callout',{when:{formats:['callout']}}),row('nova.emotion',{when:{minComposure:55,maxIrritation:30,landed:true}}),
 row('nova.slot',{stage:'answer',action:'calm',category:'respect'}),row('nova.opponent',{side:'f',text:'{finisher}.'}),
 row('nova.venue',{text:'Here in {venue}.'})
]),pack('magnus',[row('magnus.basic')]),pack('nova',[row('manager.nova')],'manager')]);
const ids=c=>Array.from(cat.candidates(c),x=>x.id);
assert.deepEqual(ids(ctx),['nova.basic','nova.age','nova.history','nova.emotion','nova.venue']);
assert.deepEqual(ids({...ctx,protected:'recorded-argument'}),[]);
assert.deepEqual(ids({...ctx,speaker:{...s,role:'manager'}}),['manager.nova']);
assert.deepEqual(ids({...ctx,speaker:o}),['magnus.basic']);
assert.ok(!ids({...ctx,meetings:null}).includes('nova.history'));
assert.ok(!ids({...ctx,speaker:{...s,age:null}}).includes('nova.age'));
assert.ok(!ids({...ctx,composure:null}).includes('nova.emotion'));
assert.ok(!ids({...ctx,venue:null}).includes('nova.venue'));
assert.equal(L.render(cat.lines('wrestler','nova')[0],ctx),'Bell has a point to prove against Magnus.');
assert.equal(L.render(cat.lines('wrestler','nova').find(x=>x.id==='nova.opponent'),{...ctx,side:'f'}),'Bell Hold.');
assert.ok(Object.isFrozen(cat.lines('wrestler','nova')[0]));
for(const bad of [
 row('bad',{text:'{championship}'}),row('bad',{text:'{venue'}),row('bad',{action:'invalid'}),
 row('bad',{when:{minAge:50,maxAge:20}}),row('bad',{when:{hasTitle:true}}),row('bad',{when:{formats:['private']}}),
 row('bad',{when:{titleMatch:'yes'}}),row('bad',{when:{minIrritation:101}}),row('bad',{when:{minMeetings:1.5}}),
 row('bad',{when:{minAge:'18'}}),row('bad',{text:'<script>'}),row('bad',{side:'host'})
])assert.throws(()=>L.catalogue([pack('nova',[bad])]),/Dialogue contract/);
assert.throws(()=>L.catalogue([pack('nova',[row('dup')]),pack('magnus',[row('dup')])]),/duplicate/);
assert.throws(()=>L.catalogue([pack('nova',[]),pack('nova',[])]),/duplicate/);
const w=D.ALL.find(x=>x.id==='nova'),f=D.ALL.find(x=>x.id==='magnus'),mouth=D.ALL.find(x=>x.id==='mara'),p=D.PROMOS[0];
let tagged=0,protectedN=0;
for(let i=0;i<48;i++){
 const c={id:'dialogue-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:i,finish:'win_clean',minutes:12,feudHeat:i%2?60:0};
 const opts={directed:true,formats:true,...(i%4===0?{mouth}:{})};
 const a=M.begin(c,w,f,null,null,p,{...opts,dialogue:true}),b=M.begin(c,w,f,null,null,p,opts);
 assert.equal(a.dialogueFacts.player.id,opts.mouth?.id||w.id);
 assert.equal(a.dialogueFacts.client.id,w.id);assert.equal(a.dialogueFacts.meetings,null);
 assert.ok(!JSON.stringify(a.dialogueFacts).includes('win_clean'),'booked finish must stay out of the dialogue facts');
 const before=JSON.stringify(a.dialogueFacts);
 while(a.stage!=='done'){
  const choices=M.choices(a),id=choices[(i+a.steps.length)%choices.length].id,copy=plain(a);
  assert.equal(JSON.stringify(choices),JSON.stringify(M.choices(b)));
  M.choose(a,id);M.choose(b,id);M.choose(copy,id);
  assert.equal(JSON.stringify(a),JSON.stringify(copy),'save/resume exact');
 }
 assert.equal(JSON.stringify(a.dialogueFacts),before);
 const ra=M.result(a),rb=M.result(b),strip=x=>x.map(({dialogueSlot,...rest})=>rest);
 assert.equal(JSON.stringify(strip(ra.dialogue)),JSON.stringify(rb.dialogue),'no wording change in 5A');
 assert.equal(JSON.stringify(ra.promise),JSON.stringify(rb.promise));
 assert.equal(JSON.stringify(ra.tactic),JSON.stringify(rb.tactic));
 assert.equal(ra.quality,rb.quality);assert.equal(ra.crowdShift,rb.crowdShift);assert.equal(ra.heatDelta,rb.heatDelta);
 for(const e of a.log.filter(x=>x.dialogueSlot)){
  tagged++;if(e.dialogueSlot.protected)protectedN++;
  assert.equal(e.dialogueSlot.owner,e.side==='w'?(opts.mouth?.id||w.id):f.id);
  assert.equal(e.dialogueSlot.side,e.side);
  if(e.dialogueSlot.stage==='close')assert.ok(e.dialogueSlot.protected);
 }
}
assert.ok(tagged>=48*3&&protectedN>=48);
console.log('PASS promo dialogue architecture: 200 synthetic owners / 16,800 lines indexed; 48 live scenes, '+tagged+' tagged utterances, '+protectedN+' protected; unchanged wording, outcomes and exact resume.');
