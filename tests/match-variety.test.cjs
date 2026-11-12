'use strict';
// The Office v2.9: match identity, size, stamina and old career compatibility.
// No external dependencies: node tests/match-variety.test.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'inline game present');
new vm.Script(script); // The entire game, including the Office UI, must parse.
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0,'engine boundary');
const mem=new Map(),root={addEventListener(){}};
const storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:storage,console,Date,Math,JSON});
const D=root.OfficeData,E=root.OfficeMatch,G=E.GRAPH;
assert.deepEqual([...G.validate().errors],[]);
assert.ok(G.validate().nodes>=66,'no missing graph nodes');
assert.equal(Object.keys(D.PROFILES).length,14);
for(const talent of [...D.TALENT,...D.FOES]){
 const profile=D.PROFILES[talent.id];
 assert.ok(profile && profile.kg>50 && profile.kg<180,'physical profile '+talent.id);
 assert.ok(profile.preferred.length>=3,'distinct preferences '+talent.id);
 for(const action of profile.preferred)assert.ok(G.A[action],'unknown signature '+action);
}
function config(i){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[Math.floor(i/8)%D.FOES.length],p=D.PROMOS[i%D.PROMOS.length];
 const slot=['opener','mid','feature','main'][Math.floor(i/40)%4];
 return {w:{...w,flags:{},fatigue:i%40},f,p,slot,minutes:D.SLOTS[slot].mins,
  finish:['win_clean','win_dirty','lose_protected','lose_clean'][Math.floor(i/5)%4],
  plan:{game:['story','technical','brawl','spots','safe'][i%5],leash:'script',talk:'calm'},
  preparation:{},flags:{},feudHeat:(i%8)*9,seed:1003+i*71};
}
function drain(x){
 for(let i=0;i<9000;i++){
  if(x.decision&&!x.queue.length){
   const choice=x.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||x.decision.options[0];
   E.resolve(x,choice.id);
  }
  E.next(x);
  if(x.done)return x;
 }
 throw Error('Match stalled');
}
const paths=new Set(),textures=new Set(),signatures={Story:0,Technical:0,Brawl:0,Spectacle:0},counts={Story:0,Technical:0,Brawl:0,Spectacle:0};
let rests=0,staminaMoves=0;
for(let i=0;i<600;i++){
 const o=config(i),m=drain(E.create(o)),g=m.graph;
 const result=m.outcome==='nc'?'nc':m.outcome==='double'?'double':o.finish;
 assert.ok(m.final,'every bout reaches a result');
 assert.equal(g.outcome.id,result,'booking remains authoritative');
 assert.ok(Number.isFinite(m.wSt)&&Number.isFinite(m.fSt),'valid stamina');
 assert.ok(g.exertion>=0,'physical expenditure recorded');
 assert.ok(m.log.every(line=>!(/\{(?:A|D|W|F|part)\}|undefined|NaN/).test(line.text)));
 paths.add(g.history.join('>'));textures.add(g.texture);
 counts[o.w.style]++;
 if(g.events.some(e=>D.PROFILES[o.w.id].preferred.includes(e.id)))signatures[o.w.style]++;
 rests+=g.rests||0;staminaMoves+=g.events.filter(e=>e.exertion>0).length;
}
assert.ok(paths.size>=100,'matches follow distinct story routes');
assert.ok(textures.size>=5,'multiple narrative textures');
assert.ok(rests>20,'exhausted wrestlers visibly rest');
assert.ok(staminaMoves>300,'move-specific effort model is exercised');
for(const [style,n] of Object.entries(signatures))assert.ok(n>=counts[style]*.35,style+' is not expressing its personal moves');
const get=id=>D.TALENT.find(w=>w.id===id);
const specimen=E.create({...config(0),w:{...get('lyra'),fatigue:0,flags:{}},f:get('rex')});
specimen.story.control='w';specimen.story.position='standing';
assert.equal(G.isValid(specimen,'power_spinebuster'),false,'small wrestler cannot lift much heavier opponent');
assert.equal(G.isValid(specimen,'snap_suplex'),false,'giant suplex restricted');
const heavyweight=E.create({...config(0),w:{...get('rex'),fatigue:0,flags:{}},f:get('lyra')});
heavyweight.story.control='w';heavyweight.story.position='standing';
assert.equal(G.isValid(heavyweight,'power_spinebuster'),true,'heavyweight can perform power move');
const before=heavyweight.wSt;G.apply(heavyweight,'power_spinebuster');
assert.ok(heavyweight.wSt<before,'big lift consumes stamina');
const tired=E.create(config(4));tired.story.control='w';tired.story.position='standing';tired.wSt=8;
assert.equal(G.isValid(tired,'top_climb'),false,'exhausted wrestler avoids high-risk ropes');
const beforeRest=tired.wSt;G.apply(tired,'catch_breath');
assert.ok(tired.wSt>beforeRest,'taking a breath restores stamina');
tired.stage='live';tired.calls=3;tired.listen=100;tired.wSt=10;assert.equal(E.call(tired,'big'),true);
assert.ok(tired.log.some(l=>l.text.includes('tired legs')),'forced unsafe high spot declines visibly');
assert.equal(tired.spots,0,'no false successful spot recorded');
const brief=E.scout(get('juno'),get('rex'),'technical',60);
assert.match(brief.brief,/size advantage/);
assert.match(brief.advice,/Avoid lifting/);
assert.ok(!brief.brief.includes('undefined'));
const first=E.create(config(187));
for(let i=0;i<45;i++){if(first.decision&&!first.queue.length)E.resolve(first,first.decision.options[0].id);E.next(first)}
const second=E.restore(JSON.parse(JSON.stringify({...first,rState:first.r.getState()})));
for(let i=0;i<2200;i++){
 for(const m of [first,second])if(m.decision&&!m.queue.length)E.resolve(m,m.decision.options[0].id);
 assert.equal(E.next(first)?.text,E.next(second)?.text,'mid-bout resume remains deterministic');
 if(first.done&&second.done)break;
}
assert.ok(first.done&&second.done,'saved bouts finish');
console.log('PASS v2.9: 600 matches, '+paths.size+' story routes, '+textures.size+' textures; wrestler identity, lift safety, stamina, scouting, saves and booked outcomes');
