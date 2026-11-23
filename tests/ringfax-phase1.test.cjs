'use strict';
// Ringfax Phase 1 — actual career fixture, pure teletext and deterministic fan voices.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {engine}=require('./_world.cjs');
const {root}=engine(1337);
const {OfficeGame:G,OfficeRingfax:R}=root;
assert.ok(R,'Ringfax module is loaded through the same script list as the browser');
G.fresh();
const s=G.S;
const original=JSON.stringify(s),seed=s.seed;
function grid(page){
 assert.equal(R.press('go',page,s),true);
 const v=R.screen(s);
 assert.equal(v.rows.length,25,'40x25 teletext row count for '+page);
 for(const [i,row] of v.rows.entries())assert.equal(row.text.length,40,'row '+i+' should have exactly 40 cells on page '+page);
 return v;
}
for(const p of [100,101,200,201,300,302,500,501])grid(p);

const titlePage=R.build(s)[302];
const championView=grid(302);
assert.equal(championView.subpages,1,'all eight champions must fit one Ringfax page');
assert.ok(titlePage.lines.length<=17,'champions must fit the available 17 content rows');
assert.equal(titlePage.lines[1].text.length,40,'division columns fill exactly 40 cells');
assert.match(titlePage.lines[1].text.slice(0,20),/MEN/);
assert.match(titlePage.lines[1].text.slice(20,40),/WOMEN/);
for(const promoter of s.promoters){
 const idx=titlePage.lines.findIndex(row=>row.text.trim()===promoter.name.toUpperCase());
 assert.ok(idx>=0,'champions show promoter '+promoter.name);
 const names=root.OfficeData.DIVISION_ORDER.map(div=>{
  const id=s.territory.titles[promoter.id][div].holder;
  return id?root.OfficeData.findWrestler(id)?.name||id:'VACANT';
 });
 assert.equal(titlePage.lines[idx+1].text.slice(0,20).trim(),names[0],'mens holder from real title state');
 assert.equal(titlePage.lines[idx+1].text.slice(20,40).trim(),names[1],'womens holder from real title state');
}
const previousTitle=s.territory.titles.dock.men;
s.territory.titles.dock.men={...previousTitle,holder:null};
assert.match(R.build(s)[302].lines.find((row,i,all)=>i>0&&all[i-1].text.trim()==='DOCKSIDE').text.slice(0,20),/VACANT/,'vacated belt is identified');
s.territory.titles.dock.men=previousTitle;
assert.equal(grid(302).subpages,1,'vacated title still fits on one page');

const index=grid(100);
assert.ok(index.rows.slice(1,5).some(x=>x.text.includes('RINGFAX')),'model retains a readable RINGFAX text equivalent');
assert.ok(R.view(s).includes('class="rf-logo-svg"'),'masthead uses a scalable custom pixel logo');
assert.ok(R.view(s).includes('shape-rendering="crispEdges"'),'logo uses crisp pixel edges, not Unicode font blocks');
assert.match(R.view(s),/rf-logo-svg[^>]*>\s*<path fill="#ffed00" d="M[\d ]+h1v1h-1z/,'pixel paths are present in the masthead');
assert.ok(index.rows.slice(1,5).every(x=>!x.text.includes('█')),'masthead does not use oversized fallback glyphs');
assert.ok(index.rows.slice(1,5).every(x=>x.background==='blue'),'mosaic logo has a blue field');
assert.equal(index.rows[23].segments?.length,4,'four in-grid Fastext controls');
assert.equal(index.rows[23].segments.reduce((n,x)=>n+x.text.length,0),40,'Fastext is exactly forty cells');
assert.ok(R.view(s).includes('rf-index-half'),'index rows provide individual column links');
assert.ok(R.view(s).includes('rf-mosaic'),'block headings render as text cells');
assert.equal(JSON.stringify(s),original,'opening and reading the teletext cannot mutate career state');
assert.equal(s.seed,seed,'Ringfax cannot consume the main career RNG');
const empty=grid(500);
assert.match(empty.rows.map(x=>x.text).join(' '),/OPENING WEEK/i,'opening-week fan opinions appear before the first match');
assert.match(empty.rows.map(x=>x.text).join(' '),/GRAPPLEGRAN|HEELTURN78/,'at least one named fictional opening-week reader appears');
assert.doesNotMatch(empty.rows.map(x=>x.text).join(' '),/WINNER:/,'opening-week letters do not invent match results');

s.cash=99999;
assert.equal(G.sign('rex'),null);
const c={id:'ringfax-p1-fixture',pid:'dock',wid:'rex',rid:'silas',
 slot:'mid',finish:'lose_clean',purse:250,eventAbs:G.abs()};
const fin={stars:3.5,crowd:70,crowdPeak:75,outcome:'booked',botches:0,
 script:.85,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},
 minutes:12,plan:'safe',stamina:60,injury:0,ignored:0,callsUsed:[],log:[]};
s.card.push(c);G.applyResult(c,fin);
const h=s.history.find(x=>x.cid===c.id);
assert.ok(h,'the fixture must be a genuinely settled career result');
const prior=JSON.stringify(s),postSeed=s.seed;
const expected=JSON.stringify(R.voices(h,3));
assert.equal(JSON.stringify(R.voices(h,3)),expected,'fan voices are deterministic');
assert.equal(new Set(R.voices(h,3).map(f=>f.name)).size,3,'first fan page contains three distinct contributors');
assert.ok(R.voices(h,3).every(f=>f.sourceId===h.cid),'every fan letter is anchored in the actual result');

const news=grid(101);
assert.match(news.rows.map(x=>x.text).join(' '),/WINNER: Silas Rush/,'news uses the actual winner, not an invented one');
const results=grid(200);
assert.match(results.rows.map(x=>x.text).join(' '),/WINNER: Silas Rush/,'results identify the settled winner');
let fan=grid(500);
assert.match(fan.rows.map(x=>x.text).join('\n'),/THE FANZONE/);
assert.match(fan.rows.map(x=>x.text).join('\n'),/GRAPPLE|HEELTURN|MATWORK|BALCONY|KAYFABE|TICKET|FRONTROW|BIGSPOT/);
assert.ok(R.view(s).includes('data-rf-action="digit"'));
assert.ok(R.view(s).includes('data-rf-action="jump"'),'players can enter a three-digit page directly');
assert.ok(R.view(s).includes('rf-page-grid'),'page directory remains visible');
assert.ok(R.view(s).includes('data-rf-value="500"'),'the Fanzone has a direct shortcut');
assert.equal(typeof R.fit,'function','the screen has a viewport font fitting hook');
assert.ok(R.view(s).includes('plain text'));
let letters=grid(501);
assert.ok(letters.subpages>=1,'readers letters support multiple subpages');
R.press('right',null,s);
assert.ok(R.screen(s).sub<letters.subpages,'subpage right wraps inside the page');
assert.ok(R.view(s).includes('data-record="w:rex"'),'a real wrestler profile link is provided');

grid(999);
assert.match(R.screen(s).rows.map(x=>x.text).join(' '),/PAGE NOT FOUND/);
R.press('go',100,s);
R.press('digit','2',s);R.press('digit','0',s);R.press('digit','0',s);
assert.equal(R.screen(s).page,200,'three-digit remote goes to a page');
R.key('F4',s);
assert.equal(R.screen(s).page,500,'F4 goes straight to the Fanzone');
assert.equal(JSON.stringify(s),prior,'teletext interaction must not write career state');
assert.equal(s.seed,postSeed,'teletext must not consume the career RNG');

// Integration contracts: keep desktop/mobile navigation and the static-hosted script ordering intact.
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
assert.ok(html.includes('assets/js/ringfax.js'));
assert.ok(html.includes('assets/css/ringfax.css'));
assert.ok(html.indexOf('assets/js/ringfax.js')<html.indexOf('assets/js/ui.js'),'module loads before UI');
assert.ok(ui.includes("['ringfax','Ringfax']"),'Ringfax appears in ordinary navigation');
assert.ok(ui.includes("ringfax:renderRingfax"),'Ringfax route has a real screen');
assert.ok(ui.includes('ringfax-page-rotated'),'subpage auto-rotation integrates with the route');
console.log('PASS Ringfax Phase 1: read-only, 40x25 pages, actual results, deterministic Fanzone, remote and route');
