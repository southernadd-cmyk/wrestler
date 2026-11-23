'use strict';
// Injury decisions: full rest, quick return (with a setback risk) or work through it (with a flare risk),
// plus a per-body-part wear record. Run: node tests/injury-decisions.test.cjs
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');

const root={addEventListener(){}};
const store=new Map();
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},JSON,console});
const G=root.OfficeGame;

function withInjuredWrestler(full=3){
 G.fresh();G.S.cash=1000000;
 for(const w of G.S.free.slice(0,2))G.sign(w.id);
 const w=G.S.roster[0];
 w.injury=full;w.injurySince=G.abs();w.niggle=0;w.nigglePart=null;w.relapse=null;w.wear={};
 const m={id:'t'+Math.random().toString(36).slice(2),week:G.S.week,season:G.S.season,read:false,answer:null,
  from:w.name,subject:'test',kind:'decision',dtype:'injury',args:[w.id],part:'left knee',full,quick:Math.max(1,full-1),
  options:[{id:'rest',label:'Full rest',hint:''},{id:'quick',label:'Quick return',hint:''},{id:'work',label:'Work through it',hint:''}]};
 G.S.inbox.unshift(m);
 return {w,m};
}

// Full rest: no change to the countdown and no setback.
{
 const {w,m}=withInjuredWrestler(3);
 const out=G.answer(m.id,'rest');
 assert.match(out,/full layoff/);
 assert.equal(w.injury,3);
 assert.equal(w.relapse,null);
}

// Quick return: one week sooner, with a setback chance armed.
{
 const {w,m}=withInjuredWrestler(3);
 G.answer(m.id,'quick');
 assert.equal(w.injury,2);
 assert.equal(w.relapse.part,'left knee');assert.equal(w.relapse.chance,0.3);
}

// Work through it: fit now, with a worked-through knock for the full length.
{
 const {w,m}=withInjuredWrestler(3);
 G.answer(m.id,'work');
 assert.equal(w.injury,0);
 assert.equal(w.niggle,3);
 assert.equal(w.nigglePart,'left knee');
}

// Answering after recovery is a no-op, and the message says so.
{
 const {w,m}=withInjuredWrestler(3);
 w.injury=0;
 assert.match(G.answer(m.id,'quick'),/already recovered/);
 assert.equal(w.relapse,null);
}

// Old saves: wear and the new fields default in on load, and existing wrestlers keep their data.
{
 G.fresh();G.S.cash=1000000;G.sign(G.S.free[0].id);
 const raw=JSON.parse(JSON.stringify(G.S));
 for(const w of raw.roster){delete w.wear;delete w.niggle;delete w.nigglePart;delete w.relapse;}
 G.S=raw;
 const w=G.S.roster[0];
 assert.equal(Object.keys(w.wear).length,0);
 assert.equal(w.niggle,0);
 assert.equal(w.relapse,null);
}
console.log('injury decision tests passed');
