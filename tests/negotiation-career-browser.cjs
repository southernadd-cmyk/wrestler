'use strict';
// Actual browser journey: paid negotiation across reload, visible expiry
// warnings, week rollover, durable inbox notification and no fake memory.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const URL='http://127.0.0.1:8765/';
async function scenario(browser,name,viewport){
 const ctx=await browser.newContext({viewport}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.locator('[data-title="new"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  await page.evaluate(()=>{
   const G=window.OfficeGame,s=G.S;
   s.cash=99999;s.rep=60;s.focus=2;
   const err=G.sign('rex');if(err!==null)throw new Error('Could not sign Rex: '+err);
   s.offers=[{id:'deadline-browser',pid:'dock',rid:'magnus',slot:'opener',finish:'lose_clean',
    wid:null,boost:1,bump:1,eventAbs:G.abs()+2,expiresAbs:G.abs()}];
   G.save();window.OfficeUI.go('offers','deadline-browser');
  });
  assert.match(await page.locator('#view .neg-deadline-tag').innerText(),/Final week/);
  await page.locator('#view [data-talkopen="deadline-browser"]:visible').click();
  await page.locator('#modal.negotiation-dialog[open]').waitFor();
  assert.match(await page.locator('#modal .neg-deadline-note').innerText(),/sign before advancing the week/i);
  await page.locator('#modal [data-talkaction="ask:protect"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.focus),1);
  await page.locator('#modal [data-dlg="close"]').click();
  await page.locator('#modal[open]').waitFor({state:'hidden'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#loadBtn:visible').click();
  await page.locator('#app').waitFor({state:'visible'});
  await page.evaluate(()=>window.OfficeUI.go('offers','deadline-browser'));
  assert.equal(await page.locator('#view [data-talkopen="deadline-browser"]:visible').isEnabled(),true);
  await page.locator('#view [data-talkopen="deadline-browser"]:visible').click();
  await page.locator('#modal.negotiation-dialog[open]').waitFor();
  assert.match(await page.locator('#modal .neg-response h3').innerText(),/Why should the loss be protected/i);
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.focus),1,
   name+': reloading must not spend a second management meeting');
  assert.match(await page.locator('#modal .neg-deadline-note').innerText(),/advanc/i);
  await page.locator('#modal [data-dlg="close"]').click();
  await page.locator('#modal[open]').waitFor({state:'hidden'});
  const outcome=await page.evaluate(()=>{
   const G=window.OfficeGame;
   G.endWeek();
   const row=window.OfficeNegotiationCareer.ledger().find(x=>x.offerId==='deadline-browser');
   return {expires:!G.S.offers.some(x=>x.id==='deadline-browser'),
    status:row?.status,notice:G.S.inbox.some(m=>/Negotiation deadline passed/.test(m.subject)),
    focus:G.S.focus,week:G.S.week};
  });
  assert.equal(outcome.expires,true,name+': expired conversation must disappear');
  assert.equal(outcome.status,'expired');
  assert.equal(outcome.notice,true);
  assert.equal(outcome.focus,2,'weekly meeting reset is not a reimbursement');
  const width=await page.evaluate(()=>({document:document.documentElement.scrollWidth,window:innerWidth}));
  assert.ok(width.document<=width.window+2,name+': unexpected page horizontal overflow');
  assert.deepEqual(errors,[],name+': uncaught browser errors');
  console.log('PASS negotiation career browser '+name+': reload, deadline, expiry and persisted notice');
 }finally{await ctx.close()}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await scenario(browser,'desktop',{width:1280,height:720});
  await scenario(browser,'phone',{width:390,height:844});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
