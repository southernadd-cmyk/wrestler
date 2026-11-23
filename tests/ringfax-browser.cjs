'use strict';
// Ringfax viewport and interaction regression: run in the existing Chromium job on Ringfax changes.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const URL='http://127.0.0.1:8765/';

async function run(browser,name,viewport){
 const ctx=await browser.newContext({viewport}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.locator('[data-title="new"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  await page.evaluate(()=>window.OfficeUI.go('ringfax'));
  await page.evaluate(async()=>{await document.fonts.ready;window.OfficeRingfax.fit()});
  const g=await page.evaluate(()=>{
   const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const view=document.querySelector('#view'),display=document.querySelector('.rf-display'),
    screen=document.querySelector('#rf-screen'),consoleEl=document.querySelector('.rf-console'),
    rows=[...screen.querySelectorAll('.rf-row')],wrap=document.querySelector('.rf-wrap');
   return {view:box(view),display:box(display),screen:box(screen),console:box(consoleEl),
    wrap:box(wrap),rows:rows.map(r=>({...box(r),length:r.textContent.length,scroll:r.scrollWidth,client:r.clientWidth})),
    font:getComputedStyle(screen).fontSize, overflowX:document.documentElement.scrollWidth-window.innerWidth,
    directoryButtons:consoleEl.querySelectorAll('.rf-page-link').length,
    mosaicRows:screen.querySelectorAll('.rf-mosaic').length,
    fastext:screen.querySelectorAll('.rf-fast-seg').length,
    screenBackground:getComputedStyle(screen).backgroundColor,
    bannerBackground:getComputedStyle(rows[1]).backgroundColor,
    hasModernBevel:getComputedStyle(consoleEl).boxShadow!=='none',
    jump:box(consoleEl.querySelector('#rf-page-entry')),
    pager:box(consoleEl.querySelector('.rf-sub-nav'))};
  });
  assert.equal(g.rows.length,25,name+': full 25-line teletext must render');
  assert.ok(g.rows.every(x=>x.length===40),name+': every line must have 40 characters');
  assert.ok(g.font&&parseFloat(g.font)>=8,name+': legible fitted glyph size '+JSON.stringify(g));
  assert.ok(g.screen.width>200&&g.screen.height>250,name+': teletext screen should fill a useful area');
  assert.ok(g.rows[0].top>=g.screen.top-1&&g.rows.at(-1).bottom<=g.screen.bottom+1,
   name+': last teletext line clipped '+JSON.stringify(g));
  assert.ok(g.screen.left>=g.view.left-2&&g.screen.right<=g.view.right+2,
   name+': teletext overruns game viewport '+JSON.stringify(g));
  assert.ok(g.overflowX<=2,name+': horizontal overflow '+JSON.stringify(g));
  assert.equal(g.directoryButtons,8,name+': all page shortcuts must be discoverable');
  assert.equal(g.mosaicRows,4,name+': four row block heading');
  assert.equal(g.fastext,4,name+': four Fastext choices must be in screen');
  assert.equal(g.screenBackground,'rgb(0, 0, 0)',name+': black screen');
  assert.equal(g.bannerBackground,'rgb(0, 0, 255)',name+': blue masthead');
  assert.equal(g.hasModernBevel,false,name+': no modern bevels');
  if(viewport.width>1100){
   assert.ok(g.display.right<=g.console.left+1,name+': desktop columns overlap');
   assert.ok(g.screen.bottom<=g.view.bottom+1,name+': teletext is clipped behind footer');
   assert.ok(g.jump.bottom<=g.view.bottom+1&&g.pager.bottom<=g.view.bottom+1,
    name+': core navigation is below fold');
   assert.ok(g.screen.width>viewport.width*.4,name+': desktop screen wastes horizontal space');
  }else{
   assert.ok(g.display.bottom<=g.view.bottom+3,name+': phone/tablet screen should fit before internal scroll');
   assert.ok(g.console.top>=g.display.bottom-1,name+': stacked controls overlap the teletext');
  }

  // Click a line in the teletext itself (not just the separate directory).
  await page.locator('#rf-screen .rf-index-half[data-rf-value="500"]').click();
  assert.match(await page.locator('#rf-screen').innerText(),/THE FANZONE/);
  assert.equal(await page.locator('#rf-screen .rf-row').count(),25,'Fanzone uses a full 25-row grid');
  await page.locator('.rf-page-link[data-rf-value="501"]').click();
  assert.match(await page.locator('#rf-screen').innerText(),/READERS LETTERS/);
  // Direct page entry should work without forcing users to find a numeric pad.
  await page.locator('#rf-page-entry').fill('302');
  await page.locator('[data-rf-action="jump"]').click();
  assert.match(await page.locator('#rf-screen').innerText(),/TITLE PICTURE/);
  // Preserve keyboard access to the teletext service.
  await page.keyboard.press('F4');
  assert.match(await page.locator('#rf-screen').innerText(),/THE FANZONE/);
  assert.deepEqual(errors,[],name+': unexpected browser errors');
  console.log('PASS Ringfax '+name+': fitted 40x25 display, visible controls, clickable index, direct page and keyboard');
 }finally{await ctx.close()}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await run(browser,'desktop-1640',{width:1640,height:927});
  await run(browser,'laptop-1280',{width:1280,height:720});
  await run(browser,'tablet-900',{width:900,height:780});
  await run(browser,'phone-390',{width:390,height:844});
  await run(browser,'phone-360',{width:360,height:740});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
