'use strict';
// Regressions from the 16 November audit: failed transfers, newcomer voices and the
// regional checkpoint target.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map();
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:storage,Date,Math,JSON,console});
const D=root.OfficeData,G=root.OfficeGame,T=root.OfficeTerritory,Room=root.OfficeRoom;

function careerWith(id){
 G.fresh();
 G.S.cash=50000;
 G.sign(id);
 const w=G.W(id);assert.ok(w,'signed '+id);
 return w;
}
function sale(w,opt){
 const id='mtest'+opt+w.id;
 G.S.inbox.unshift({id,week:G.S.week,season:G.S.season,read:false,answer:null,kind:'decision',dtype:'poach',args:[w.id],from:'test',subject:'test',body:[]});
 return G.answer(id,opt);
}
const owner=id=>G.S.worldV4.contracts[id];

// 1. A sale to an agency that can't afford the wrestler: no money, no move, no false report.
{
 const w=careerWith('mara');
 G.S.worldV4.agencies.northern.cash=0;
 assert.equal(T.canPoach(w),false);
 const cash=G.S.cash;
 const text=String(sale(w,'sell'));
 assert.equal(G.S.cash,cash,'no fee when the buyer cannot pay');
 assert.ok(G.W('mara'),'Mara stays in the stable');
 assert.equal(owner('mara').owner,'player');
 assert.doesNotMatch(text,/joined North Circuit/);
 assert.match(text,/withdrawn/);
}
// 2. A sale the agency can afford: fee paid and the contract really moves to North Circuit.
{
 const w=careerWith('mara');
 G.S.worldV4.agencies.northern.cash=1e6;
 const cash=G.S.cash,fee=Math.round(w.fee*.6);
 const text=String(sale(w,'sell'));
 assert.equal(G.S.cash,cash+fee);
 assert.equal(G.W('mara'),undefined);
 assert.equal(owner('mara').owner,'ai');assert.equal(owner('mara').agencyId,'northern');
 assert.match(text,/joined North Circuit/);
}
// 3. "Talk them round" fails and the buyer can't sign: the wrestler is a free agent, and we say so.
{
 let failed=0;
 for(let attempt=0;attempt<40&&!failed;attempt++){
  const w=careerWith('mara');
  G.S.worldV4.agencies.northern.cash=0;w.morale=0;
  const text=String(sale(w,'talk'));
  if(G.W('mara'))continue; // talked round this time
  failed++;
  assert.equal(owner('mara').owner,'market');
  assert.doesNotMatch(text,/signed with/);assert.match(text,/free agent/);
 }
 assert.equal(failed,1,'the failed-talk path was exercised');
}
// 4. The old North Circuit approach is no longer raised (the rival managers' bids replace it),
// but one already waiting in a save can still be answered, which tests 1-3 cover.
{
 const src=script.slice(0,cut);
 assert.match(src,/poach:\{when:w=>[^\n]*canPoach\(w\)/);
 assert.match(src,/for\(const type of \['unhappy','hurt','raise','dive'\]\)/,'the poach scene is not in the weekly draw');
}
// 5. Every one of the 80 wrestlers has an authored voice; newcomers no longer default to stoic.
{
 const types=new Set(Object.values(Room.VOICE));
 for(const w of D.ALL)assert.ok(Room.VOICE[w.id],'voice missing for '+w.name);
 for(const t of types)assert.ok(['grand','gruff','eager','stoic','precise','earnest','sermon','slippery'].includes(t),'unknown voice '+t);
 const newcomerVoices=new Set(D.V4.newCast.map(w=>Room.VOICE[w.id]));
 assert.ok(newcomerVoices.size>=6,'newcomers use a spread of voices');
 assert.equal(Room.VOICE.faye,'precise');assert.equal(Room.VOICE.morgan,'slippery');assert.equal(Room.VOICE.nikita,'gruff');
}
// 6. The regional checkpoint keeps the star target separate from the pass flag.
{
 G.fresh();
 const r=G.circuitStatus(8);
 assert.equal(r.quality,3,'target stays a star rating');
 assert.equal(typeof r.qualityMet,'boolean');
 const src=script.slice(0,cut);
 assert.match(src,/at least one \$\{r\.quality\}-star performance/);
 assert.match(src,/Match quality: \$\{r\.qualityMet\?'YES':'NO'\}/);
 assert.doesNotMatch(script,/played\$\{r\.quality\?/,'objectives table uses the pass flag for progress');
}
console.log('PASS audit fixes: failed sales pay nothing and report truthfully; 80 voiced wrestlers; checkpoint shows the star target');
