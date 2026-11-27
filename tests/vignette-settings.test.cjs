'use strict';
// The pre-taped vignette's setting is a real decision: it is weighed against the wrestler, the rivalry and
// the promoter, its tags say what it actually does, and the desk can filter and sort the settings.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeGame:G,OfficeMatch:MX,OfficeSegments:SG}=root;
const SETTINGS=SG.VIGNETTE_SETTINGS,CATS=SG.VIGNETTE_CATEGORIES;
let n=0;
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=60;G.sign('rex');s.inbox=[];s.offers=[];return s;}
const contract=(o={})=>({id:'vig-'+(n++),pid:'crown',rid:'silas',wid:'rex',slot:'main',minutes:15,finish:'win_clean',purse:300,feudHeat:20,eventAbs:G.abs(),...o});
const as=(o={})=>({...G.W('rex'),...o});
// One vignette, same contract id, same tone and edit: only the setting (and the named fixture detail) differs.
function tape(setting,o={}){
 career();if(o.trust!==undefined)G.P(o.pid||'crown').trust=o.trust;
 const w=o.w||G.W('rex'),p=G.P(o.pid||'crown');
 const st=SG.begin('vignette',contract({id:'fixed',feudHeat:o.feudHeat??20}),w,G.F('silas'),p);
 const opts=SG.options(st);
 for(const id of [setting,o.tone||'intense',o.edit||'tight'])assert.ok(SG.choose(st,id),setting+' '+id);
 return {st,r:SG.result(st),opts,trust:G.P(o.pid||'crown').trust,morale:G.W('rex').morale};
}

// 1. Many settings, spread across every category.
{
 assert.ok(SETTINGS.length>=12&&SETTINGS.length<=18,'a real menu: '+SETTINGS.length);
 assert.equal(new Set(SETTINGS.map(s=>s.id)).size,SETTINGS.length,'unique ids');
 for(const id of ['gym','home','dark','road'])assert.ok(SETTINGS.some(s=>s.id===id),'old saves keep their setting: '+id);
 for(const k of Object.keys(CATS)){
  const inCat=SETTINGS.filter(s=>s.cat===k).length;
  assert.ok(inCat>=2,k+' has at least two settings');
 }
 for(const s of SETTINGS){assert.ok(CATS[s.cat],s.id+' has a category');assert.ok(s.fits.length>=1&&s.shot,s.id);}
 console.log('PASS '+SETTINGS.length+' settings across '+Object.keys(CATS).length+' categories');
}

// 2. Each option's tags are exactly what the setting does to this fixture.
{
 career();const fixtures=[
  {w:as(),pid:'crown',feudHeat:20},{w:as(),pid:'dock',feudHeat:60},{w:as({id:'mara',style:'Story',heat:30}),pid:'pulse',feudHeat:45},
  {w:as({id:'rev',style:'Spectacle',heat:55}),pid:'union',feudHeat:10},{w:as({id:'lyra',style:'Technical',heat:65}),pid:'crown',feudHeat:50}];
 let checked=0;
 for(const fx of fixtures)for(const s of SETTINGS){
  career();const st=SG.begin('vignette',contract({id:'tags',feudHeat:fx.feudHeat}),fx.w,G.F('silas'),G.P(fx.pid));
  const o=SG.options(st).find(x=>x.id===s.id),before={q:st.quality,room:st.room,heat:st.heat,trust:st.trust,morale:st.morale};
  assert.equal(o.category,s.cat);assert.equal(o.tags[0],CATS[s.cat],'category first');
  assert.ok(Number.isFinite(o.score));assert.doesNotMatch(o.label+o.hint+o.tags.join(),/undefined|null|NaN|\{\w+\}/);
  // Apply just the setting so the deltas belong to it alone.
  G.P(fx.pid).trust=50;SG.choose(st,s.id);
  const d={q:st.quality-before.q,room:st.room-before.room,heat:st.heat-before.heat,trust:st.trust-before.trust,morale:st.morale-before.morale};
  const has=(label,v)=>v>0?o.tags.some(t=>t.startsWith(label+' ▲')):v<0?o.tags.includes(label+' ▼'):!o.tags.some(t=>t.startsWith(label+' '));
  assert.ok(has('Crowd',d.room),s.id+' crowd tag: '+d.room+' '+o.tags);
  assert.ok(has('Feud heat',d.heat),s.id+' heat tag: '+d.heat+' '+o.tags);
  assert.ok(has('Promoter',d.trust),s.id+' promoter tag: '+d.trust+' '+o.tags);
  assert.ok(has('Morale',d.morale),s.id+' morale tag: '+d.morale+' '+o.tags);
  if(d.q>=3)assert.ok(o.tags.some(t=>t.startsWith('Production ▲')),s.id+' production tag');
  if(d.q<0)assert.ok(o.tags.includes('Production ▼'),s.id+' production down tag');
  assert.ok(Math.abs(d.trust)<=2&&d.heat<=5&&d.morale<=2&&d.room<=5&&d.room>=-3,'bounded: '+JSON.stringify(d));
  checked++;
 }
 console.log('PASS tags match the real effect in '+checked+' setting/fixture pairs');
}

// 3. Same fixture, different settings, different and intended outcomes.
{
 const road=tape('road'),out=tape('outside');
 // Rex v Silas is not personal yet (heat 20): stalking Silas's gym looks strange and a traditional promoter dislikes it.
 assert.ok(out.opts.find(o=>o.id==='outside').tags.includes('Risk: feud too cold'));
 assert.ok(out.r.crowdShift<road.r.crowdShift,'a cold rivalry turns the room: '+out.r.crowdShift+' v '+road.r.crowdShift);
 assert.ok(out.r.quality<road.r.quality,'and the production suffers');
 assert.ok(out.trust<road.trust,'North Crown does not like it');
 // Once the rivalry is personal the same setting stokes it.
 const hot=tape('outside',{feudHeat:55}),hotRoad=tape('road',{feudHeat:55});
 assert.ok(hot.r.heatDelta>=hotRoad.r.heatDelta+4,'a hot rivalry carries it: '+hot.r.heatDelta+' v '+hotRoad.r.heatDelta);
 assert.ok(hot.r.crowdShift>=out.r.crowdShift+2);
 // Style: a scrapyard suits a brawler; the same tape for a storyteller is weaker.
 const brawl=tape('scrapyard'),story=tape('scrapyard',{w:as({style:'Story'})});
 assert.ok(brawl.r.quality>story.r.quality,'the scrapyard suits a brawler');
 // Promoter taste: North Crown wants a story and is traditional.
 const school=tape('school'),shop=tape('shop');
 assert.equal(school.r.trustDelta,2,'a training-school piece pleases a traditional, story-minded promoter');
 assert.equal(shop.r.trustDelta,-1,'a supermarket comedy bit does not');
 assert.ok(school.trust>road.trust&&shop.trust<road.trust,'and promoter trust really moves');
 const dock=tape('shop',{pid:'pulse'});assert.equal(dock.r.trustDelta,1,'a showman promoter likes it');
 // Morale: going home lifts the wrestler, once.
 assert.equal(tape('home').r.moraleDelta,2);
 const m0=(career(),G.W('rex').morale);assert.equal(tape('home').morale,m0+2,'home lifts morale');assert.equal(tape('road').morale,m0,'the road does not');
 // Mystery: static works for an unknown and pays off a cliffhanger.
 const unknown=tape('static',{w:as({heat:30}),edit:'tease'}),known=tape('static',{w:as({heat:80}),edit:'tease'});
 assert.ok(unknown.r.crowdShift>known.r.crowdShift,'a masked voice works for someone the crowd does not know: '+unknown.r.crowdShift+' v '+known.r.crowdShift);
 const chapelTease=tape('chapel',{tone:'menace',edit:'tease'}),darkTease=tape('dark',{tone:'menace',edit:'tease'});
 assert.ok(chapelTease.r.crowdShift>darkTease.r.crowdShift,'a mystery setting pays off a cliffhanger');
 // The angle colours the match commentary through the existing promo styles.
 assert.equal(tape('dark').r.style,'mindgames');assert.equal(tape('home').r.style,'rally');assert.equal(tape('gym').r.style,'respect');assert.equal(road.r.style,undefined);
 // Tone fit is read from the setting: karaoke only fits comedy.
 const clown=()=>as({id:'mara'}),k=tape('karaoke',{w:clown(),tone:'comedy'}),kx=tape('karaoke',{w:clown(),tone:'intense'});
 assert.ok(k.r.quality>kx.r.quality,'karaoke wants a funny tone from a natural clown');
 const results=['road','outside','scrapyard','school','shop','home','static','chapel','karaoke'].map(id=>JSON.stringify((({quality,crowdShift,heatDelta,trustDelta,moraleDelta,style})=>({quality,crowdShift,heatDelta,trustDelta,moraleDelta,style}))(tape(id).r)));
 assert.ok(new Set(results).size>=7,'settings lead to different results: '+new Set(results).size);
 console.log('PASS settings change crowd, production, feud heat, promoter trust, morale and the commentary angle');
}

// 4. It reaches the match: the starting crowd follows the setting, and no RNG is spent before the bell.
{
 const mk=promo=>MX.create({w:{...G.W('rex')},f:G.F('silas'),p:G.P('crown'),slot:'main',minutes:15,finish:'win_clean',feudHeat:20,promo,plan:{game:'story',leash:'script',talk:'none'},seed:11});
 const cold=tape('outside').r,good=tape('home',{tone:'heartfelt',edit:'long'}).r;
 assert.ok(good.crowdShift>cold.crowdShift);
 assert.ok(mk(good).crowd>mk(cold).crowd,'the hall starts louder after a good package: '+mk(good).crowd+' v '+mk(cold).crowd);
 const a=tape('scrapyard').r,b=tape('scrapyard').r;assert.deepEqual(a,b,'deterministic');
 for(const s of SETTINGS){const lo=tape(s.id,{w:as({mic:10})}).r,hi=tape(s.id,{w:as({mic:95})}).r;assert.equal(lo.quality,hi.quality,'taped: mic is never rolled ('+s.id+')');}
 console.log('PASS the setting reaches the match through the starting crowd; deterministic and mic-free');
}

// 5. The desk renders every setting and narrows them by category.
{
 const src=fs.readFileSync(path.join(__dirname,'..','assets/js/ui.js'),'utf8').replace(/\r\n/g,'\n');
 const grab=(name,end)=>{const a=src.indexOf('function '+name+'('),b=src.indexOf(end,a);assert.ok(a>=0&&b>a,name);return src.slice(a,b);};
 const code=[grab('tagChips','\nfunction '),grab('pickCards','\nfunction '),grab('segmentChoices','\n\n')].join('\n');
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sandbox={esc,night:{},window:{OfficeSegments:SG}};
 const render=vm.runInNewContext(code+'\n({segmentChoices,setView:v=>{night.segView=v}})',sandbox);
 career();const st=SG.begin('vignette',contract({id:'ui'}),G.W('rex'),G.F('silas'),G.P('crown'));
 const v=SG.view(st),ids=h=>[...h.matchAll(/data-seg="([^"]+)"/g)].map(m=>m[1]);
 let html=render.segmentChoices(v);
 assert.deepEqual(ids(html),[...SETTINGS.map(s=>s.id)],'every setting renders, grouped by category');
 for(const k of Object.keys(CATS))assert.match(html,new RegExp('data-segcat="'+k+'" aria-pressed="false">'+CATS[k]+' <span class="filter-count">'+SETTINGS.filter(s=>s.cat===k).length));
 assert.match(html,/data-segcat="all" aria-pressed="true">All <span class="filter-count">17|data-segcat="all" aria-pressed="true">All/);
 render.setView({cat:'mystery',sort:'category'});html=render.segmentChoices(v);
 assert.deepEqual(ids(html),[...SETTINGS.filter(s=>s.cat==='mystery').map(s=>s.id)],'the filter narrows to one category');
 assert.match(html,/class="btn sm go" data-segcat="mystery" aria-pressed="true"/);
 render.setView({cat:'all',sort:'fit'});html=render.segmentChoices(v);
 const order=ids(html),score=Object.fromEntries(v.options.map(o=>[o.id,o.score]));
 for(let i=1;i<order.length;i++)assert.ok(score[order[i-1]]>=score[order[i]],'best fit first');
 assert.equal(order.length,SETTINGS.length);
 render.setView({cat:'nonsense',sort:'category'});assert.equal(ids(render.segmentChoices(v)).length,SETTINGS.length,'an unknown category shows everything');
 // Later steps and other segments are plain cards, with no filter bar.
 SG.choose(st,'gym');const tone=SG.view(st);html=render.segmentChoices(tone);
 assert.doesNotMatch(html,/seg-filters/);assert.deepEqual(ids(html),['intense','heartfelt','comedy','menace']);
 assert.match(html,/Fits the setting ▲/,'the tone step says which tones fit the chosen setting');
 // The click handler and the stylesheet know the controls.
 assert.match(src,/if\(d\.segcat\|\|d\.segsort\)/);
 assert.match(fs.readFileSync(path.join(__dirname,'..','assets/css/office-pass.css'),'utf8'),/\.seg-filters\{/);
 console.log('PASS the desk renders all '+SETTINGS.length+' settings, filters by category and sorts by fit');
}
