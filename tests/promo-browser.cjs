'use strict';
// Real production HTML, UI event handlers, fetch, localStorage and Chromium.
// Test fixture prepares a valid booked match at the microphone boundary.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const URL=process.env.OFFICE_BROWSER_URL||'http://127.0.0.1:8765/';
const BANKS='**/assets/promo-banks/*.json',STORE='the-office-v23-match';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const ids=url=>url.match(/\/promo-banks\/([^/.]+)\./)?.[1];
async function fixture(page){
 await page.goto(URL,{waitUntil:'domcontentloaded'});
 await page.locator('[data-title="new"]').click();
 await page.locator('#modal [data-dlg="identity-save"]').click();
 await page.locator('#app').waitFor({state:'visible'});
 return page.evaluate(store=>{
  const G=window.OfficeGame,s=G.S;
  s.cash=99999;s.rep=65;
  if(!G.W('rex')){const err=G.sign('rex');if(err)throw Error('Fixture sign failed: '+err);}
  const w=G.W('rex'),f=G.F('silas'),p=G.P('crown');
  if(!w||!f||!p)throw Error('Missing promo fixture wrestler or promoter');
  const c={id:'browser-promo-fixture',wid:w.id,rid:f.id,pid:p.id,slot:'mid',minutes:12,purse:420,finish:'win_clean',eventAbs:G.abs()};
  s.card=[c];G.save();
  const room=window.OfficeRoom.begin(c,w,f,p,{recent:[],threads:[],heat:0,rehearsed:G.rehearsed(w)});
  for(let n=0;room.stage!=='done'&&n<30;n++){
   const choices=window.OfficeRoom.options(room);if(!choices.length)throw Error('Fixture meeting has no choice');
   window.OfficeRoom.act(room,choices[0].id);
  }
  if(room.stage!=='done'||!room.sheet)throw Error('Fixture meeting did not complete');
  room.sheet.skipPromo=false;
  const plan={cid:c.id,room,sheet:room.sheet,confirmed:true,game:room.sheet.game,leash:room.sheet.leash||'script',talk:room.sheet.talk};
  const saved={queue:[c.id],i:0,speed:'normal',results:[],before:window.OfficeNightReport.capture(s),stage:'meeting',plan,promo:null,mouth:{cid:c.id,id:'none'},past:[]};
  localStorage.setItem(store,JSON.stringify(saved));
  return saved;
 },STORE);
}
async function resume(page){
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-title="load"]').click();
 await page.locator('#tv').waitFor({state:'visible'});
}
const mic=page=>page.locator('#tv [data-mic]:visible');
const loading=page=>page.locator('#tv').getByText('Preparing the microphone…',{exact:true});
async function openMic(page){
 await page.locator('#tv [data-tv="promos"]').click();
 await mic(page).first().waitFor({timeout:8000});
}
async function state(page){return page.evaluate(()=>JSON.parse(JSON.stringify(window.OfficeUI.night.promo)));}
async function choices(page){return page.evaluate(()=>window.OfficeMic.choices(window.OfficeUI.night.promo).map(o=>o.id));}
async function pick(page,want){
 const available=await choices(page),id=available.includes(want)?want:available[0];
 await page.locator('#tv [data-mic="'+id+'"]').click();return id;
}
async function assertBankOwners(page,expected){
 const st=await state(page);
 assert.deepEqual(st.authoredDialogue.banks.map(b=>b.owner).sort(),[...expected].sort());
 assert.equal(st.semantic.v,1);assert.equal(st.stage,'live');return st;
}
async function withPage(browser,name,viewport,handle,run){
 const ctx=await browser.newContext({viewport}),page=await ctx.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/\/assets\/promo-banks\/[^/]+\.json$/.test(r.url()))requests.push(ids(r.url()));});
 await page.route(BANKS,handle||((route)=>route.continue()));
 try{
  const saved=await fixture(page);
  assert.deepEqual(requests,[],name+': no bank requests at initial page/new career');
  assert.equal(await page.evaluate(()=>typeof window.OfficePromoPilot),'undefined');
  await resume(page);
  assert.deepEqual(requests,[],name+': no bank requests before microphone');
  await run({page,ctx,saved,requests});
  assert.deepEqual(errors,[],name+': no uncaught browser errors');
 }finally{await ctx.close();}
}
async function coldWarm(browser,viewport){
 const bytes={};
 await withPage(browser,'cold/warm '+viewport.width,viewport,async route=>{
  const r=await route.fetch(),body=await r.body();bytes[ids(route.request().url())]=body.length;
  await route.fulfill({response:r,body});
 },async({page,saved,requests})=>{
  const start=Date.now();await openMic(page);const coldMs=Date.now()-start;
  await assertBankOwners(page,['rex','silas']);
  assert.deepEqual([...requests].sort(),['rex','silas']);
  assert.ok(bytes.rex>0&&bytes.silas>0);
  assert.ok(bytes.rex+bytes.silas<15000);
  // An actual click and production save, then restore a new document with both cache entries intact.
  await pick(page,'proof');const after=await state(page);
  assert.equal(after.steps.length,1);
  const persisted=await page.evaluate(store=>JSON.parse(localStorage.getItem(store)),STORE);
  assert.equal(persisted.promo.steps.length,1);assert.equal(persisted.promoLoading,undefined);
  assert.deepEqual(persisted.promo,after);
  // A separate new scene at the same fixture boundary: reload loses the in-memory cache.
  await page.evaluate(({store,saved})=>localStorage.setItem(store,JSON.stringify(saved)),{store:STORE,saved});
  await resume(page);const warmStart=Date.now();await openMic(page);const warmMs=Date.now()-warmStart;
  await assertBankOwners(page,['rex','silas']);
  assert.equal(requests.length,2,'warm new scene uses persistent cache, not a network request');
  await pick(page,'proof');
  const pinned=await state(page);
  const selected=await page.evaluate(()=>{
   const st=window.OfficeUI.night.promo,opts=window.OfficeMic.choices(st);
   const id=opts.find(o=>o.id==='turn')?.id||opts[0].id,copy=JSON.parse(JSON.stringify(st));
   window.OfficeMic.choose(copy,id);return {id,copy};
  });
  // Remove both cache copies, fail every bank request after reload: pinned scene is independent.
  await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('office-promo-bank-v1:'))localStorage.removeItem(k);});
  await page.unroute(BANKS);await page.route(BANKS,r=>r.abort('failed'));
  await resume(page);await mic(page).first().waitFor();
  assert.deepEqual(await state(page),pinned,'reload must retain exact spoken state and bank payload');
  await pick(page,selected.id);
  assert.deepEqual(await state(page),selected.copy,'next choice matches pre-reload deterministic continuation');
  assert.equal(requests.length,2,'pinned resume makes no bank requests');
  for(let i=0;i<4&&(await state(page)).stage!=='done';i++)await pick(page,'vow');
  const done=await state(page);assert.equal(done.stage,'done');assert.ok(done.result.promise);
  await page.locator('#tv [data-tv="bell"]').waitFor();
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.card[0].finish),'win_clean');
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,choices:document.querySelector('#tv').scrollWidth,tv:document.querySelector('#tv').clientWidth}));
  assert.ok(layout.scroll<=layout.width+2,'page horizontal overflow '+JSON.stringify(layout));
  console.log('PASS promo cold/warm '+viewport.width+'px: '+(bytes.rex+bytes.silas)+' actual raw JSON bytes; cold '+coldMs+'ms, warm '+warmMs+'ms; 2 requests total, pinned resume and deterministic next choice.');
 });
}
async function failures(browser){
 const counts={};
 await withPage(browser,'retry/partial',{width:1366,height:768},async route=>{
  const id=ids(route.request().url());counts[id]=(counts[id]||0)+1;
  if(id==='rex'&&counts[id]===1)return route.fulfill({status:503,body:'Temporary outage'});
  if(id==='silas')return route.fulfill({status:404,body:'Missing immutable bank'});
  await route.continue();
 },async({page,requests})=>{
  await openMic(page);await assertBankOwners(page,['rex']);
  assert.equal(counts.rex,2,'retry transient 503 once');assert.equal(counts.silas,1,'404 never retried');
  await pick(page,'proof');await pick(page,'turn');
  assert.ok((await state(page)).steps.length>=2);assert.equal(requests.length,3);
  console.log('PASS promo retry/partial: 503 retried, 404 not retried, playable partial scene.');
 });
 await withPage(browser,'offline/corrupt',{width:390,height:844},async route=>{
  if(ids(route.request().url())==='rex')return route.fulfill({status:200,contentType:'application/json',body:'{}'});
  await route.abort('failed');
 },async({page,requests})=>{
  await openMic(page);await assertBankOwners(page,[]);
  assert.equal(requests.filter(x=>x==='rex').length,1,'bad immutable payload is not retried');
  assert.equal(requests.filter(x=>x==='silas').length,2,'transport failure retried once');
  await pick(page,'proof');await pick(page,'turn');
  assert.ok((await state(page)).steps.length>=2);
  console.log('PASS promo corrupt/transport failure: scene stays playable without any bank.');
 });
 // Slow server responses: both fetches race the same per-bank deadline in parallel.
 await withPage(browser,'timeout',{width:1366,height:768},async route=>{
  await delay(3300);try{await route.continue();}catch(_){/* browser aborted at the deadline */}
 },async({page,requests})=>{
  const start=Date.now();
  await page.locator('#tv [data-tv="promos"]').click();await loading(page).waitFor();
  await mic(page).first().waitFor({timeout:8000});const ms=Date.now()-start;
  await assertBankOwners(page,[]);assert.equal(requests.length,2);
  assert.ok(ms>=2100&&ms<5500,'deadline should bound wait: '+ms);
  await pick(page,'proof');assert.equal((await state(page)).steps.length,1);
  console.log('PASS promo deadline: '+ms+'ms to playable fallback with two stalled requests.');
 });
}
async function interrupted(browser){
 let release;const gate=new Promise(r=>{release=r;});
 await withPage(browser,'duplicate/navigation',{width:1366,height:768},async route=>{
  await gate;try{await route.continue();}catch(_){}
 },async({page,requests})=>{
  await page.locator('#tv [data-tv="promos"]').click();await loading(page).waitFor();
  // No navigation button is exposed while loading. Dispatch the existing delegated
  // actions through temporary test-only buttons to stress stale/duplicate handlers.
  const dispatch=async(action,attr='tv')=>page.evaluate(({action,attr})=>{
   const el=document.createElement('button');el.dataset[attr]=action;
   document.querySelector('#tv').appendChild(el);el.click();el.remove();
  },{action,attr});
  await dispatch('promos');await dispatch('proof','mic');
  await page.waitForFunction(()=>window.OfficeUI.night.promoLoading?.cid==='browser-promo-fixture');
  assert.equal(await page.evaluate(()=>window.OfficeUI.night.promo),null);
  const token=await page.evaluate(()=>window.OfficeUI.night.promoLoading.cid);
  assert.equal(token,'browser-promo-fixture');
  await dispatch('meeting');await page.locator('#tv [data-tv="promos"]').waitFor();
  release();
  await page.waitForFunction(()=>!window.OfficeUI.night.promoLoading);
  assert.equal(await page.evaluate(()=>window.OfficeUI.night.stage),'meeting');
  assert.equal(await page.evaluate(()=>window.OfficeUI.night.promo),null,'stale completion must not reopen promo');
  await openMic(page);await assertBankOwners(page,['rex','silas']);
  assert.equal(requests.length,2,'return reuses successfully cached in-flight results');
  await pick(page,'proof');assert.equal((await state(page)).steps.length,1);
  console.log('PASS promo duplicate/navigation: guarded duplicate input, stale completion, reentry.');
 });
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await coldWarm(browser,{width:1366,height:768});
  await coldWarm(browser,{width:390,height:844});
  await failures(browser);
  await interrupted(browser);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
