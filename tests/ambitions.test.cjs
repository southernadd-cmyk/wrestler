'use strict';
// v0.3.14 ambitions: every wrestler wants something, and the week decides whether they get it.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
function engine(){
 const store=new Map(),root={addEventListener(){}};
 vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
 return root;
}
const root=engine();
const {OfficeData:D,OfficeGame:G,OfficeAmbitions:A}=root;
assert.ok(A&&A.view&&A.fits,'ambitions are installed');

const fin=(o={})=>({stars:2.75,crowd:61,crowdPeak:68,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:12,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[],...o});
let n=0;const match=(wid,rid,o={})=>({id:'amb-'+(n++),wid,rid,pid:'dock',slot:'mid',minutes:12,finish:'win_clean',purse:300,feudHeat:0,blowoff:false,eventAbs:G.abs(),...o});
function career(ids){G.fresh();G.S.cash=99999;for(const id of ids)assert.equal(G.sign(id)??null,null,'signed '+id);return G.S;}
const decisions=()=>G.S.inbox.filter(m=>m.kind==='decision'&&!m.answer);
const clearInbox=()=>{for(const m of decisions())G.answer(m.id,m.options.at(-1).id);G.S.inbox=[];};

// 1. All 80 wrestlers want something, the cast wants a spread of things, and it is the same every time.
career([]);
const all=A.state().w,kinds={};
assert.equal(Object.keys(all).length,D.ALL.length,'one ambition per wrestler');
for(const e of Object.values(all)){assert.ok(A.KINDS[e.kind],'known kind '+e.kind);kinds[e.kind]=(kinds[e.kind]||0)+1;}
assert.ok(Object.keys(kinds).length>=6,'at least six kinds in play: '+JSON.stringify(kinds));
assert.ok(Math.max(...Object.values(kinds))<=D.ALL.length*.35,'no kind dominates: '+JSON.stringify(kinds));
const other=engine();other.OfficeGame.fresh();
assert.equal(JSON.stringify(Object.fromEntries(Object.entries(other.OfficeAmbitions.state().w).map(([id,e])=>[id,e.kind]))),JSON.stringify(Object.fromEntries(Object.entries(all).map(([id,e])=>[id,e.kind]))),'deterministic');
assert.ok(Object.values(A.CAREER).every(k=>A.KINDS[k])&&Object.keys(A.CAREER).every(id=>D.findWrestler(id)?.ambition),'the newcomers’ written ambitions map to kinds');
console.log('PASS every wrestler has an ambition: '+JSON.stringify(kinds));

// 2. Signing a wrestler: they tell you what they want.
career(['rex']);
const intro=G.S.inbox.find(m=>m.subject==='What I want');
assert.ok(intro&&intro.from===G.W('rex').name,'Rex says what he wants');
assert.ok(A.view('rex').name&&A.view('rex').progress,'and the profile can show it');
console.log('PASS a new signing says what they want');

// 3. A title shot is met by a title match; the match only counts once; a message and a memory follow.
const e=A.entry('rex');e.kind='title';e.sat=40;e.promise=null;G.S.inbox=[];
const shot=match('rex','silas',{slot:'main',title:{pid:'dock',div:'men'},finish:'lose_clean'});
G.applyResult(shot,fin());G.applyResult(shot,fin());
assert.equal(A.state().log.filter(m=>m.id==='rex').length,1,'a replayed result is logged once');
G.endWeek();
const rex=A.entry('rex');
assert.equal(rex.history[0]?.kind,'title','the title shot is recorded');
assert.match(rex.history[0].text,/title match/);
assert.notEqual(rex.kind,'title','and Rex wants something else next');
assert.ok(G.S.inbox.some(m=>m.subject==='Got what I wanted'),'Rex tells you');
assert.ok(root.OfficeMemory.view('rex').entries.some(x=>x.kind==='ambition'),'and remembers it');
console.log('PASS an ambition is met by what actually happens');

// 4. Left frustrated, a wrestler asks. A promise that is kept raises loyalty; one that is broken costs it.
career(['rex']);clearInbox();
const r=A.entry('rex');r.kind='push';r.sat=20;r.told=true;r.lastAsk=-99;
G.endWeek();
let ask=decisions().find(m=>m.dtype==='amb_ask');
assert.ok(ask,'Rex comes to ask');
assert.equal(ask.options.map(o=>o.id).join(),'promise,honest,dismiss');
assert.match(G.answer(ask.id,'promise'),/promised/i);
assert.ok(A.entry('rex').promise,'the promise is on record');
assert.ok(A.view('rex').promise,'and shows on the profile');
const loyal=G.W('rex').loyal;
G.applyResult(match('rex','silas',{slot:'main'}),fin());G.endWeek();
assert.ok(A.entry('rex').history[0]?.promised,'kept, as promised');
assert.ok(G.W('rex').loyal>=loyal+7,'loyalty rises when a promise is kept');
// Broken.
career(['rex']);clearInbox();
const b=A.entry('rex');b.kind='push';b.sat=20;b.told=true;b.lastAsk=-99;G.endWeek();
ask=decisions().find(m=>m.dtype==='amb_ask');G.answer(ask.id,'promise');
const before=G.W('rex').loyal,broken=G.S.business.broken;
for(let i=0;i<5;i++)G.endWeek();
assert.equal(A.entry('rex').promise,null,'the deadline passes');
assert.ok(G.W('rex').loyal<=before-11,'loyalty falls when a promise is broken');
assert.equal(G.S.business.broken,broken+1);
assert.ok(G.S.inbox.some(m=>m.subject==='You promised'));
console.log('PASS asks, promises kept and promises broken');

// 5. Money: a raise settles it, and the next week records it.
career(['rex']);clearInbox();
const m=A.entry('rex');m.kind='money';m.sat=20;m.told=true;m.lastAsk=-99;m.wageAt=G.W('rex').wage;G.endWeek();
ask=decisions().find(x=>x.dtype==='amb_ask');
assert.equal(ask.options[0].id,'raise');
const wage=G.W('rex').wage;G.answer(ask.id,'raise');
assert.equal(G.W('rex').wage,wage+40);
G.endWeek();
assert.equal(A.entry('rex').history[0]?.kind,'money','the raise met the ambition');
console.log('PASS money ambitions are met by a raise');

// 6. Offers that would give a wrestler what they want are marked.
const t=A.entry('rex');t.kind='title';
assert.match(A.fits({pid:'dock',rid:'silas',slot:'main',title:{pid:'dock',div:'men'}},G.W('rex')),/title shot/);
assert.equal(A.fits({pid:'dock',rid:'silas',slot:'opener'},G.W('rex')),null);
t.kind='stage';
assert.ok(A.fits({pid:'union',rid:'silas',slot:'mid'},G.W('rex')));
console.log('PASS offers that serve an ambition are marked');

// 7. The circuit: an unhappy wrestler turns down a renewal; a fed-up one walks out.
career([]);
const world=G.S.worldV4,team=G.S.territory.teams.find(x=>x.roster.length>4);
const [leaver,walker]=team.roster.filter(id=>(D.findWrestler(id).ego||0)>=65).concat(team.roster).filter((x,i,l)=>l.indexOf(x)===i);
const next=G.abs()+1;
world.contracts[leaver].expiresWeek=next;A.entry(leaver).sat=10;
G.endWeek();
assert.equal(world.contracts[leaver].owner,'market',D.findWrestler(leaver).name+' turned down the renewal');
assert.ok(G.S.territory.reports[0].lines.some(l=>l.includes('turned down a new deal')),'the circuit report says so');
const angry=team.roster.find(id=>(D.findWrestler(id).ego||0)>=65&&world.contracts[id].owner==='ai')||walker;
D.findWrestler(angry).ego>=65||(D.findWrestler(angry).ego=70);
const ae=A.entry(angry);ae.sat=5;ae.low=3;world.contracts[angry].expiresWeek=G.abs()+30;
if(team.roster.length>3){G.endWeek();
 assert.equal(world.contracts[angry].owner,'market',D.findWrestler(angry).name+' walked out');
 assert.ok(G.S.territory.reports[0].lines.some(l=>l.includes('walked out')));}
console.log('PASS circuit wrestlers turn down renewals and walk out');

// 8. A whole season: nothing out of range, and the state survives a save and load.
career(['rex','mara']);
for(let i=0;i<16;i++){
 for(const w of G.S.roster)if(G.availableAt(w)&&i%2===0)G.applyResult(match(w.id,'silas',{slot:i%4===0?'main':'mid'}),fin({stars:2+i%3}));
 for(const x of decisions())G.answer(x.id,x.options[i%x.options.length].id);
 G.endWeek();
}
for(const x of Object.values(A.state().w))assert.ok(x.sat>=0&&x.sat<=100&&A.KINDS[x.kind],'in range');
assert.doesNotMatch(JSON.stringify(G.S.ambitions),/NaN|undefined|null,"by":null/);
const saved=JSON.parse(JSON.stringify(G.S));G.S=saved;
assert.equal(A.view('rex').kind,saved.ambitions.w.rex.kind,'ambitions load with the career');
assert.ok(JSON.stringify(G.S.ambitions).length<40000,'kept small in the save');
console.log('PASS a season of ambitions stays in range and saves');
