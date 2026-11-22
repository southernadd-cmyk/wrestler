'use strict';
// CI-only targeted browser audit of an actual booking negotiation. This runs
// in the existing Browser journeys job for negotiation-related PRs.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const URL='http://127.0.0.1:8765/';
async function journey(browser,name,viewport){
 const ctx=await browser.newContext({viewport});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.locator('[data-title="new"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  await page.evaluate(()=>{
   const G=window.OfficeGame,s=G.S;
   s.cash=99999;s.rep=20;s.focus=1;
   const err=G.sign('rex');if(err!==null)throw new Error('Cannot sign Rex: '+err);
   G.W('rex').heat=17;G.W('rex').pro=55;G.P('dock').trust=35;
   s.offers=[{id:'trade-browser',pid:'dock',rid:'magnus',wid:null,slot:'opener',
    finish:'lose_clean',boost:1,bump:1,eventAbs:G.abs(),expiresAbs:G.abs()+1}];
   G.save();window.OfficeUI.go('offers','trade-browser');
  });
  await page.locator('#view [data-talkopen="trade-browser"]:visible').click();
  await page.locator('#modal.negotiation-dialog[open]').waitFor();
  assert.match(await page.locator('#modal .neg-profile').innerText(),/Gaz Pryor/);
  assert.equal(await page.locator('#modal .neg-trade-menu').count(),0,
   name+': cannot offer a trade before the first argument');
  await page.locator('#modal [data-talkaction="ask:protect"]').click();
  await page.locator('#modal [data-talkaction="arg:trade"]').click();
  assert.match(await page.locator('#modal .neg-response h3').innerText(),/promoter has countered/i);
  const offered=page.locator('#modal .neg-trade-menu');
  await offered.waitFor();
  assert.match(await offered.locator('summary').innerText(),/concrete trade/i);
  await offered.locator('summary').click();
  assert.equal(await offered.locator('button[data-talkaction="trade:fee"]').isVisible(),true,
   name+': explicit fee concession must be accessible');
  assert.equal(await offered.locator('button[data-talkaction="trade:stip"]').isVisible(),true,
   name+': match-rule concession must be accessible');
  assert.match(await offered.innerText(),/in return/i);
  const geom=await page.evaluate(()=>{
   const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}};
   return {dialog:r('#modal'),footer:r('.neg-footer'),choice:r('.neg-trade-menu'),overflow:document.documentElement.scrollWidth-window.innerWidth};
  });
  assert.ok(geom.dialog.left>=-2&&geom.dialog.right<=viewport.width+2,
   name+': dialog overflow '+JSON.stringify(geom));
  assert.ok(geom.choice.left>=geom.dialog.left-2&&geom.choice.right<=geom.dialog.right+2,
   name+': exchange choices extend outside modal '+JSON.stringify(geom));
  assert.ok(geom.footer.bottom<=geom.dialog.bottom+2,
   name+': signing actions not inside dialog '+JSON.stringify(geom));
  assert.ok(geom.overflow<=2,name+': page overflow '+JSON.stringify(geom));
  await offered.locator('button[data-talkaction="trade:fee"]').click();
  assert.equal(await page.locator('#modal .neg-trade-summary').count(),1);
  assert.match(await page.locator('#modal .neg-trade-summary').innerText(),/you give|in return/i);
  assert.match(await page.locator('#modal .neg-contract').innerText(),/proposed terms|not yet accepted/i);
  assert.equal(await page.locator('#modal .neg-contract .changed').count(),3,
   name+': fee, finish and billing must all be visibly revised');
  assert.deepEqual(await page.evaluate(()=>{
   const o=window.OfficeGame.S.offers.find(x=>x.id==='trade-browser');
   return {finish:o.finish,bump:o.bump,pending:o.talk.proposal?.finish,pendingSlot:o.talk.proposal?.slot,step:o.talk.step,focus:window.OfficeGame.S.focus};
  }),{finish:'lose_clean',bump:1,pending:'lose_protected',pendingSlot:'mid',step:'offer',focus:0},
   name+': proposal must be unsigned and preserve initial terms');
  await page.locator('#modal [data-talkaction="reply:accept"]').click();
  assert.match(await page.locator('#modal .neg-trade-summary').innerText(),/Accepted package/i);
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.card.length),0,
   name+': acceptance alone must not sign');
  await page.locator('#modal .neg-footer .btn.go[data-talkbook="trade-browser"]').click();
  await page.locator('#modal[open]').waitFor({state:'hidden'});
  const signed=await page.evaluate(()=>{
   const s=window.OfficeGame.S,o=s.card.find(x=>x.pid==='dock'&&x.wid==='rex');
   return {finish:o?.finish,slot:o?.slot,focus:s.focus,booked:s.card.length,offerExists:s.offers.some(x=>x.id==='trade-browser')};
  });
  assert.deepEqual(signed,{finish:'lose_protected',slot:'mid',focus:0,booked:1,offerExists:false},
   name+': agreed package must be signed exactly once');
  assert.deepEqual(errors,[],name+': uncaught browser errors');
  console.log('PASS negotiation trade browser '+name+': give/get, proposal, acceptance, sign and layout');
 }finally{await ctx.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await journey(browser,'desktop',{width:1280,height:720});
  await journey(browser,'phone',{width:390,height:844});
  await journey(browser,'small-phone',{width:360,height:740});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
