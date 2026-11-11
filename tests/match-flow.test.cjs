'use strict';
// The Office v2.6: no-dependency wrestling sequence regression.
// Run: node tests/match-flow.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const inline=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inline,'standalone game should have an inline script');
const cut=inline.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0,'engine boundary exists');
const store=new Map();
const root={addEventListener(){}};
const localStorage={
 getItem:key=>store.get(key)||null,
 setItem:(key,value)=>store.set(key,String(value)),
 removeItem:key=>store.delete(key)
};
vm.runInNewContext(inline.slice(0,cut),{window:root,localStorage,console,Date,Math,JSON},{filename:'office-engine.js'});
const D=root.OfficeData,M=root.OfficeMatch;
assert.ok(D&&M&&M.create&&M.restore,'match engine loads');

function options(n,game,finish,slot){
 const w=D.TALENT[n%D.TALENT.length],f=D.FOES[n%D.FOES.length],p=D.PROMOS[n%D.PROMOS.length];
 return {w:{...w,flags:{},fatigue:10},f,p,slot,minutes:D.SLOTS[slot].mins,finish,
  plan:{game,leash:'script',talk:'calm'},preparation:{},flags:{},seed:2000+n*73};
}
function drain(x,max=5000){
 for(let i=0;i<max;i++){
  if(x.decision&&!x.queue.length){
   const choice=x.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||x.decision.options[0];
   M.resolve(x,choice.id);
  }
  M.next(x);
  if(x.done)return x;
 }
 throw new Error('Match did not finish');
}
const plans=['story','technical','brawl','spots','safe'];
const finishes=['win_clean','win_dirty','lose_protected','lose_clean'];
const slots=['opener','mid','feature','main'];
let count=0;
for(let i=0;i<240;i++){
 const p=plans[i%plans.length],f=finishes[Math.floor(i/plans.length)%finishes.length],s=slots[Math.floor(i/(plans.length*finishes.length))%slots.length];
 const x=drain(M.create(options(i,p,f,s)));
 const text=x.log.map(line=>line.text).join(' ');
 assert.ok(x.final,'every match has a final result');
 assert.ok(x.final.psychology.target,'a persistent target body part exists');
 assert.ok(x.final.psychology.targetingBeats>=1,'targeted offense occurred');
 assert.ok(x.final.psychology.controlChanges>=1,'control changed via an event');
 assert.ok(x.log.some(line=>/finisher|cover|TAPS|THREE!/i.test(line.text)),'finish narrative present');
 assert.doesNotMatch(text,/\{(?:W|F|A|D|move|part|fin)\}|undefined|NaN/,'no unfilled placeholders');
 const times=x.log.map(line=>{const [m,s]=line.t.split(':').map(Number);return m*60+s;});
 for(let j=1;j<times.length;j++)assert.ok(times[j]>=times[j-1],'timestamps must be chronological');
 if(f==='win_dirty'){
  const ix=x.log.findIndex(line=>line.text.includes('fistful of tights'));
  const ref=x.log.findIndex(line=>line.text.includes('referee turns back'));
  const one=x.log.findIndex((line,j)=>j>ix&&line.text==='ONE!');
  assert.ok(ix>=0&&ix<ref&&ref<one,'dirty pin occurs before referee sees and counts it');
 }
 count++;
}
// Save in the middle of a match: the remainder must be byte-for-byte deterministic.
const opts=options(407,'technical','lose_protected','main');
const a=M.create(opts);
for(let i=0;i<32;i++){
 if(a.decision&&!a.queue.length)M.resolve(a,a.decision.options[0].id);
 M.next(a);
}
const snapshot=JSON.parse(JSON.stringify({...a,rState:a.r.getState()}));
const b=M.restore(snapshot);
for(let i=0;i<1500;i++){
 if(a.decision&&!a.queue.length)M.resolve(a,a.decision.options[0].id);
 if(b.decision&&!b.queue.length)M.resolve(b,b.decision.options[0].id);
 assert.equal(M.next(a)?.text,M.next(b)?.text,'resume matches original sequence');
 if(a.done&&b.done)break;
}
assert.ok(a.done&&b.done,'both continued matches finish');
console.log('PASS: '+count+' match flows, finish ordering, timestamps, targeting, control and deterministic resume');
