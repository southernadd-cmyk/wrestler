'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console});
const D=root.OfficeData,I=root.OfficePromoIdentity;
const plain=x=>JSON.parse(JSON.stringify(x));
const required=['id','role','source','delivery','motivation','vulnerability','trigger','tactic','boundary','underPressure','sample'];
function check(p,role,source){
 assert.ok(p,'missing profile');
 for(const k of required)assert.ok(typeof p[k]==='string'&&p[k].trim(),'missing '+k+' for '+p.id);
 assert.equal(p.role,role);assert.equal(p.source,source);assert.ok(Object.isFrozen(p));
 assert.doesNotMatch(p.sample,/\{\w+\}|undefined/);
}
const base=D.ALL.filter(w=>!w.id.startsWith('academy-'));
const ids=new Set(base.map(w=>w.id));
assert.equal(ids.size,base.length);
assert.deepEqual(Object.keys(I.authored).sort(),[...ids].sort(),'all and only established wrestler identities authored');
const samples=new Set();
for(const w of base){
 const p=I.wrestler(w);check(p,'wrestler','authored');assert.equal(p.id,w.id);
 assert.equal(I.wrestler(w.id),p);
 assert.equal(I.wrestler({...w,age:w.age+20,heat:0,mic:99}),p,'core identity survives age and mutable career stats');
 samples.add(p.sample);
}
assert.equal(samples.size,base.length,'no shared signature example lines');
const agencies=D.V4.agencyDefinitions.filter(a=>a.kind==='ai');
for(const a of agencies)check(I.person(a.id),'manager','authored');
for(const p of D.PROMOS)check(I.person(p.id),'promoter','authored');
check(I.person('player'),'manager','authored');
assert.equal(I.person('unknown'),null);assert.equal(I.wrestler('unknown'),null);
const rookies=root.OfficeAcademyRegister;
assert.ok(rookies.length>0);
const diversity=new Set();
for(const r of rookies){
 const w={id:r.id,style:r.wrestling_style,age:r.entry_age};
 const p=I.wrestler(w);check(p,'wrestler','generated');assert.equal(p.id,r.id);
 assert.deepEqual(plain(p),plain(I.wrestler({...w,age:w.age+10,heat:95,appearance_brief:'changed'})));
 const supplied={...w,voice:'Reserved until challenged',ambition:'Earn a first title opportunity'};
 const a=I.wrestler(supplied);
 assert.equal(a.delivery,supplied.voice);assert.equal(a.motivation,supplied.ambition);
 assert.deepEqual(plain(a),plain(I.wrestler({...supplied,age:40,heat:50})));
 diversity.add([p.delivery,p.motivation,p.vulnerability,p.trigger,p.tactic].join('|'));
}
assert.ok(diversity.size>=Math.min(20,rookies.length),'generated profiles vary beyond wrestling style');
console.log('PASS promo identity: '+base.length+' authored wrestlers, '+agencies.length+' rival managers, '+D.PROMOS.length+' promoters, player manager, '+rookies.length+' deterministic academy candidates; '+diversity.size+' rookie profile combinations.');
