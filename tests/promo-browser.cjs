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
  const err=G.sign('rex');if(err)throw Error('Fixture sign failed: '+err);
  const w=G.W('rex'),f=G.F('silas'),p=G.P('crown');
  if(!w||!f||!p)throw Error('Missing promo fixture wrestler or promoter');
  const c={id:'browser-promo-fixture',wid:w.id,rid:f.id,pid:p.id,slot:'mid',minutes:12,purse:420,finish:'win_clean',eventAbs:G.abs()};
  s.card=[c];G.save();
  const room=window.OfficeRoom.begin(c,w,f,p,{recent:[],threads:[],heat:0,rehearsed:G.rehearsed(w)});
  for(let n=0;room.stage!=='done'&&n<30;n++){
   const choices=window.OfficeRoom.options(room);if(!choices.length)throw Error('Fixture meeting has no choice');
   const preferred={board:'board_ok',review:'review_ok',curtain:'talk_none'}[room.stage];
   const choice=choices.find(o=>o.id===preferred)||choices[0];
   window.OfficeRoom.act(room,choice.id);
  }
  if(room.stage!=='done'||!room.sheet)throw Error('Fixture meeting did not complete: '+room.stage);
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
// The segment picker comes first; these tests are about the face-to-face duel.
async function toPromo(page){
 await page.locator('#tv [data-tv="promos"]').click();
 const duel=page.locator('#tv [data-segment="duel"]');if(await duel.count())await duel.click();
}
async function openMic(page){
 await toPromo(page);
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
  if(viewport.width>=901){
   const geometry=await page.evaluate(()=>{
    const stage=document.querySelector('.s-promo'),decision=stage.querySelector('.decide2'),win=stage.querySelector('.win');
    const r=stage.getBoundingClientRect(),buttons=[...decision.querySelectorAll('[data-mic]')];
    const nested=[...stage.querySelectorAll('.win,.wbody,.scene,.promo-context,.decide2,.sheetline')].filter(el=>/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+2);
    const conversation=stage.querySelector('.promo-conversation').getBoundingClientRect(),d=decision.getBoundingClientRect();
    return {win:win.clientWidth,decision:decision.clientWidth,split:conversation.right<=d.left+2&&Math.abs(conversation.top-d.top)<=2,buttons:buttons.length,nested:nested.length,
     allVisible:buttons.every(b=>{const x=b.getBoundingClientRect();return x.top>=r.top-2&&x.bottom<=Math.min(r.bottom,innerHeight)+2}),horizontal:decision.scrollWidth-decision.clientWidth};
   });
   assert.ok(geometry.split&&geometry.decision>=geometry.win*.55,'conversation left, choices right '+JSON.stringify(geometry));
   assert.equal(geometry.nested,0,'no independently scrolling promo panes');
   assert.ok(geometry.buttons>0&&geometry.allVisible,'initial promo choices should fit without scrolling '+JSON.stringify(geometry));
   assert.ok(geometry.horizontal<=2,'decision pane must not overflow horizontally '+JSON.stringify(geometry));
  }
  assert.deepEqual([...requests].sort(),['rex','silas']);
  assert.ok(bytes.rex>0&&bytes.silas>0);
  assert.ok(bytes.rex+bytes.silas<15000);
  // An actual click and production save, then restore a new document with both cache entries intact.
  await pick(page,'proof');const after=await state(page);
  assert.equal(after.steps.length,1);
  const first=after.log.find(e=>e.side==='w');assert.ok(first.answersQuestion,'first spoken line must explicitly answer the host');
  assert.equal(first.answersQuestion.prompt,after.log[0].line);
  const history=page.locator('#micTalk .dialogue-history');
  if(await history.count())await history.locator('summary').click();
  if(first.answersQuestion.direct){
   assert.equal(first.answersQuestion.lead,'');
   assert.ok(first.line.length>0);
   assert.ok((await page.locator('#tv #micTalk').innerText()).includes(first.line),'direct answer must appear on screen');
  }else{
   assert.ok(first.line.startsWith(first.answersQuestion.lead+' '));
   assert.ok((await page.locator('#tv #micTalk').innerText()).includes(first.answersQuestion.lead),'answer must appear on screen');
  }
  if(await history.count())await history.locator('summary').click();
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
// Restore a genuine initial meeting and use its real controls at laptop/phone sizes.
// Check the real scroll positions immediately before the delegated click and
// after the next round has laid out. No artificial spacers or mock UI.
async function clickPreservingScroll(page,button,stage,label){
 await button.evaluate((el,stage)=>{
  const sample=()=>{
   const tv=document.querySelector('#tv'),screen=tv.querySelector('.'+stage),panel=screen.querySelector('.decide2');
   const nodes={tv,stage:screen,win:panel.closest('.win'),body:panel.closest('.wbody'),panel};
   return Object.fromEntries(Object.entries(nodes).map(([k,n])=>[k,{top:n.scrollTop,max:Math.max(0,n.scrollHeight-n.clientHeight)}]));
  };
  window.__decisionScrollProbe={sample};
  el.addEventListener('click',()=>{window.__decisionScrollProbe.before=sample()},{capture:true,once:true});
  el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
 },stage);
 await button.click();
 const measured=await page.evaluate(async()=>{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const probe=window.__decisionScrollProbe;delete window.__decisionScrollProbe;
  return {before:probe.before,after:probe.sample()};
 });
 assert.ok(measured.before,label+': actual click was captured');
 let retained=false;
 for(const [k,old] of Object.entries(measured.before)){
  const next=measured.after[k],expected=Math.min(old.top,next.max);
  if(expected>8)retained=true;
  assert.ok(Math.abs(next.top-expected)<=2,label+' '+k+' must retain scroll: '+JSON.stringify(measured));
 }
 assert.ok(retained,label+' must exercise a non-zero scroll position that remains available: '+JSON.stringify(measured));
 console.log('PASS '+label+' scroll: '+JSON.stringify(measured));
}
async function compactPlanning(browser,viewport){
 const ctx=await browser.newContext({viewport}),page=await ctx.newPage();
 try{
  await fixture(page);
  await page.evaluate(store=>{
   const G=window.OfficeGame,s=G.S,c=s.card[0],saved=JSON.parse(localStorage.getItem(store));
   const room=window.OfficeRoom.begin(c,G.W(c.wid),G.F(c.rid),G.P(c.pid),{recent:[],threads:[],heat:0});
   saved.plan={cid:c.id,room,sheet:null,confirmed:false};saved.stage='meeting';
   localStorage.setItem(store,JSON.stringify(saved));
  },STORE);
  await resume(page);
  const structures=page.locator('#tv .structure-option');
  await structures.first().waitFor();assert.equal(await structures.count(),5);
  const g=await page.evaluate(()=>{
   const pane=document.querySelector('.s-meeting .decide2'),win=document.querySelector('.s-meeting>.win'),r=pane.getBoundingClientRect();
   return {pane:pane.clientWidth,win:win.clientWidth,visible:[...pane.querySelectorAll('.structure-option')].every(b=>{const x=b.getBoundingClientRect();return x.top>=r.top-2&&x.bottom<=r.bottom+2&&x.right<=r.right+2}),horizontal:pane.scrollWidth-pane.clientWidth};
  });
  if(viewport.width>=901){assert.ok(g.pane>=g.win*.55,'structure choices need the wider right column '+JSON.stringify(g));assert.ok(g.visible,'all five structures must fit '+JSON.stringify(g));}
  assert.ok(g.horizontal<=2,'structure choices must not overflow '+JSON.stringify(g));
  await page.locator('#tv [data-structure="traditional"]').click();
  const choice=page.locator('#tv [data-room]').first();await choice.waitFor();
  assert.equal(await page.locator('#tv .structure-change').getAttribute('open'),null,'selected structure is collapsed');
  if(viewport.width>=901){
   const g=await page.evaluate(()=>{
    const stage=document.querySelector('.s-meeting'),r=stage.getBoundingClientRect(),buttons=[...stage.querySelectorAll('[data-room]')];
    const nested=[...stage.querySelectorAll('.win,.wbody,.scene,.decide2,.sheetline')].filter(el=>/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+2);
    const c=stage.querySelector('.scene').getBoundingClientRect(),d=stage.querySelector('.decide2').getBoundingClientRect();
    return {split:c.right<=d.left+2&&Math.abs(c.top-d.top)<=2,nested:nested.length,visible:buttons.every(b=>{const x=b.getBoundingClientRect();return x.top>=r.top-2&&x.bottom<=Math.min(r.bottom,innerHeight)+2})};
   });
   assert.equal(g.nested,0,'no independently scrolling planning panes');
   assert.ok(g.split,'planning must use a vertical split');
   assert.ok(g.visible,'actual planning options fit in the viewport '+JSON.stringify(g));
  }
  await choice.click();
  await page.locator('#tv .runorder').waitFor();
  if(viewport.width>=901){
   const board=await page.evaluate(()=>({pane:document.querySelector('.s-meeting .runorder').clientWidth,win:document.querySelector('.s-meeting>.win').clientWidth}));
   assert.ok(board.pane>=board.win*.55,'running order must use the wider right column '+JSON.stringify(board));
  }
  assert.equal(await page.locator('#tv [data-room="board_ok"]').count(),1);
  // Short laptop and phone use different scroll containers from the full desktop.
  await page.setViewportSize({width:viewport.width>=901?1024:390,height:480});
  await clickPreservingScroll(page,page.locator('#tv .rorder-pick[aria-pressed="false"]').last(),'s-meeting','planning '+viewport.width);
  await page.locator('#tv .runorder').waitFor();
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.card[0].finish),'win_clean');
  console.log('PASS compact planning '+viewport.width+'px: structure options, board width and booked finish');
 }finally{await ctx.close();}
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
  await page.setViewportSize({width:390,height:480});
  await clickPreservingScroll(page,mic(page).last(),'s-promo','phone promo');
  await pick(page,'turn');
  assert.ok((await state(page)).steps.length>=2);
  console.log('PASS promo corrupt/transport failure: scene stays playable without any bank.');
 });
 // Slow server responses: both fetches race the same per-bank deadline in parallel.
 await withPage(browser,'timeout',{width:1366,height:768},async route=>{
  await delay(3300);try{await route.continue();}catch(_){/* browser aborted at the deadline */}
 },async({page,requests})=>{
  const start=Date.now();
  await toPromo(page);await loading(page).waitFor();
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
  await toPromo(page);await loading(page).waitFor();
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
// A real double-click on one microphone choice is one decision; the second click is ignored.
async function doubleClick(browser){
 await withPage(browser,'double-click',{width:1366,height:768},null,async({page})=>{
  await openMic(page);
  const first=(await choices(page))[0];
  await page.locator('#tv [data-mic="'+first+'"]').dblclick();
  await delay(300);
  assert.equal((await state(page)).steps.length,1,'double-click must record one decision');
  await page.setViewportSize({width:1024,height:360});
  await clickPreservingScroll(page,mic(page).last(),'s-promo','short laptop promo');
  assert.equal((await state(page)).steps.length,2,'a later single click still records a decision');
  console.log('PASS promo double-click: one decision per double-click.');
 });
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await compactPlanning(browser,{width:1366,height:768});
  await compactPlanning(browser,{width:390,height:844});
  await coldWarm(browser,{width:1366,height:768});
  await coldWarm(browser,{width:390,height:844});
  await failures(browser);
  await interrupted(browser);
  await doubleClick(browser);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
