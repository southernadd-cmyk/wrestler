'use strict';
// Career-level check: a busy stable should receive more than the original handful
// of recurring decisions, while every offered response stays answerable.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
function career(seed,weeks=48){
 let n=seed>>>0;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296};
 const store=new Map(),root={addEventListener(){}},math=Object.create(Math);math.random=random;
 const FixedDate=class extends Date{static now(){return 1700000000000+seed*977}};
 vm.runInNewContext(script.slice(0,cut).replace('function leave(w,fee)','root.OfficeInboxEventCatalog={EXTRA_EVENTS,DILEMMAS};function leave(w,fee)'),{window:root,Math:math,Date:FixedDate,JSON,console,
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
 const G=root.OfficeGame;G.fresh();G.S.cash=100000;
 for(const id of ['kit','rex','nova','juno'])if(root.OfficeData.findWrestler(id))G.sign(id);
 if(G.S.roster.length<3){for(const w of G.S.free.slice())if(G.S.roster.length<4)G.sign(w.id)}
 if(seed===11){const catalog=root.OfficeInboxEventCatalog.EXTRA_EVENTS;
  assert.ok(catalog.length>=32,'the expansion needs a genuinely large pool');
  assert.equal(new Set(catalog.map(e=>e.id)).size,catalog.length,'each situation has its own ID');
  for(const e of catalog){const actor=e.promoter?G.P('dock'):G.S.roster[0],scene=root.OfficeInboxEventCatalog.DILEMMAS[e.id].make(actor);
   assert.ok(scene.subject&&scene.body[0]&&scene.options.length>=2,e.id+' has a playable scene');
   assert.equal(new Set(scene.options.map(o=>o.id)).size,scene.options.length,e.id+' choices are distinct');
   for(const choice of e.choices){assert.ok(choice[4]&&typeof choice[3]==='object',e.id+' has a consequence');
    const before=JSON.stringify(G.S),message={...scene,id:'catalog-'+e.id,kind:'decision',dtype:e.id,args:[actor.id],answer:null};
    G.S.inbox.unshift(message);
    if(choice[3].cash<0){const cash=G.S.cash;G.S.cash=0;
     assert.equal(typeof G.answer(message.id,choice[0]),'string',e.id+' cannot spend without funds');
     assert.equal(message.answer,null,e.id+' cannot accept an unaffordable option');G.S.cash=cash}
    const response=G.answer(message.id,choice[0]);
    assert.ok(message.answer===choice[0]&&typeof response==='string'&&response.length>10,e.id+' option '+choice[0]+' resolves');
    G.S=JSON.parse(before);
   }
  }
 }
 const seen=new Set(),subjects=new Map(),occurrences=new Map(),errors=[];
 for(let week=0;week<weeks&&!G.S.over;week++){
  for(const w of G.S.roster){w.fatigue=Math.max(60,w.fatigue);w.morale=Math.max(45,w.morale);w.heat=Math.max(45,w.heat);w.matches=Math.max(4,w.matches);w.pro=Math.max(60,w.pro);w.ring=Math.max(60,w.ring)}
  G.endWeek();
  for(const m of G.pending().slice()){
   if(!m.options?.length){errors.push('no options: '+m.dtype);continue}
   seen.add(m.dtype);(subjects.get(m.dtype)||subjects.set(m.dtype,new Set()).get(m.dtype)).add(m.subject);
   occurrences.set(m.dtype,(occurrences.get(m.dtype)||0)+1);
   if(m.dtype==='kit'){const cash=G.S.cash;G.S.cash=0;const refused=G.answer(m.id,'buy');
    if(typeof refused!=='string'||m.answer)errors.push('unaffordable gear was purchased');G.S.cash=cash}
   const o=m.options.find(x=>x.id==='keep'||x.id==='pass'||x.id==='decline'||x.id==='no')||m.options[0];
   const answer=G.answer(m.id,o.id);if(!m.answer)errors.push('unanswered: '+m.dtype+' '+answer);
  }
  for(const w of G.S.roster)for(const field of ['fatigue','morale','heat','loyal','psych','mic','ring'])
   if(!Number.isFinite(w[field])||w[field]<0||w[field]>100)errors.push('invalid '+w.id+'.'+field);
 }
 return {types:[...seen].sort(),subjects:Object.fromEntries([...subjects].map(([k,v])=>[k,[...v]])),occurrences:Object.fromEntries(occurrences),errors};
}
const runs=[11,23,37,58].map(seed=>career(seed)),types=new Set(runs.flatMap(r=>r.types));
for(const seed of [11,23,37,58])assert.ok(career(seed,16).types.length>=8,'a season still needs a varied inbox');
for(const r of runs)assert.deepEqual(r.errors,[]);
assert.ok(types.size>=25,'larger event catalog is not reachable in careers: '+[...types]);
for(const type of ['hurt','favour','dive'])for(const r of runs)
 if((r.occurrences[type]||0)>=2)assert.ok(r.subjects[type].length>=2,'repeat scene never changed: '+type);
assert.deepEqual(career(11),runs[0],'same career seed produces the same event sequence');
console.log('PASS inbox event variety: '+types.size+' observed situation types across four careers; 32 new catalog scenes resolve both choices and saves remain deterministic');
