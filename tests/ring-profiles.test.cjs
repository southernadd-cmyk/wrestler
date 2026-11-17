'use strict';
// v0.3.11: the 52 newcomers have ring profiles of their own — weight, trait, preferred moments and
// four signature moves — and they wrestle like it.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const D=root.OfficeData,M=root.OfficeMatch,G=root.OfficeGame,A=M.GRAPH.A;
G.fresh(); // a new career switches on every wrestler's profile
const cast=D.V4.newCast,legacy=new Set([...D.TALENT,...D.FOES].map(w=>w.id));
const traits=new Set([...legacy].map(id=>D.PROFILES[id].trait));
const preferred=new Set([...legacy].flatMap(id=>D.PROFILES[id].preferred));

// 1. Every newcomer has a complete, physically sensible profile of their own.
const sequences=new Set([...legacy].map(id=>D.PROFILES[id].signature.join('|'))),firsts={};
for(const w of cast){
 const p=D.PROFILES[w.id];assert.ok(p,w.id+' has a profile');
 assert.ok(Number.isInteger(p.kg)&&p.kg>=55&&p.kg<=175,w.id+' weight');
 assert.ok(traits.has(p.trait),w.id+' trait '+p.trait);
 assert.equal(new Set(p.preferred).size,4);for(const x of p.preferred)assert.ok(preferred.has(x),w.id+' preferred '+x);
 assert.equal(new Set(p.signature).size,4);
 for(const id of p.signature){
  assert.ok(A[id]?.name&&!A[id].counterOf&&!A[id].blockOf,w.id+' signature is a real move: '+id);
  assert.ok(!(A[id].agile&&p.kg>=110),w.id+' is too heavy for '+id);
 }
 assert.ok(p.signature.filter(id=>(A[id].styles||[]).includes(w.style)).length>=2,w.id+' signatures suit their '+w.style+' style');
 const key=p.signature.join('|');assert.ok(!sequences.has(key),w.id+' has a signature set nobody else has');sequences.add(key);
 firsts[p.signature[0]]=(firsts[p.signature[0]]||0)+1;
}
assert.ok(Math.max(...Object.values(firsts))<=2,'no first signature is everybody’s');
assert.ok(new Set(cast.map(w=>D.PROFILES[w.id].kg)).size>=25,'weights are their own, not borrowed');

// 2. In ordinary matches, newcomers use their own signatures, and the physics still holds.
const kg=w=>D.PROFILES[w.id]?.kg||85;
function work(x){for(let i=0;i<9000&&!x.done;i++){if(x.decision&&!x.queue.length){const o=x.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||x.decision.options[0];M.resolve(x,o.id);}M.next(x);}assert.ok(x.done);return x;}
const seen=new Set();let own=0,other=0,events=0;
for(let i=0;i<cast.length*8;i++){
 const w=cast[i%cast.length],pool=D.ALL.filter(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),f=pool[(i*7)%pool.length];
 const slot=['mid','feature','main'][i%3];
 const x=work(M.create({w:{...w,flags:{},fatigue:i%20},f,p:D.PROMOS[i%4],slot,minutes:D.SLOTS[slot].mins,finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],
  plan:{game:['story','technical','brawl','spots','safe'][i%5],leash:'script',talk:'calm'},preparation:{},flags:{},feudHeat:0,seed:9001+i*31}));
 assert.doesNotMatch(x.log.map(l=>l.text).join(' '),/undefined|NaN|\{(?:A|D|W|F|part|name)\}/);
 for(const e of x.graph.events){
  const n=A[e.id];if(!n||!n.family||n.counterOf||n.blockOf)continue;events++;
  const att=e.preControl==='w'?x.w:x.f,def=e.preControl==='w'?x.f:x.w;
  if(n.agile)assert.ok(kg(att)<110,e.id+' is not in a '+kg(att)+' kg wrestler’s toolkit');
  if(n.lift!==null)assert.ok(kg(def)<=kg(att)+Math.max(-5,((att.ring||60)-60)*.23)+n.lift,e.id+' lifted an impossible weight');
  if(att.id===w.id){if(D.PROFILES[w.id].signature.includes(e.id)){own++;seen.add(w.id);}}
  else if(D.PROFILES[w.id].signature.includes(e.id))other++;
 }
}
assert.ok(seen.size>=cast.length*.9,'nearly every newcomer lands a signature move in ordinary play ('+seen.size+'/'+cast.length+')');
assert.ok(own>4*other,'newcomers use their own signatures far more than their opponents do ('+own+' v '+other+')');

console.log(`PASS ring profiles v0.3.11: 52 newcomers with their own weight, trait, preferred moments and signatures; ${seen.size}/52 land a signature in ${cast.length*8} matches; own ${own} v opponents ${other}; lift and agility checked over ${events} moves`);
