'use strict';
// CI-only browser journey: the shipped static game has no runtime test deps.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
assert.ok(source.includes('class="mf-breakdown-section"'),'real match flow report must render a dedicated full-width stars section');
const {chromium}=require('playwright');
const URL='http://127.0.0.1:8765/';

async function journey(browser,name,viewport){
 const context=await browser.newContext({viewport});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  // Legend colours are categories, not interchangeable red alerts:
  // opponent momentum stays red; poor work is violet; mistake is amber.
  const colours=await page.evaluate(()=>{
    const probe=document.createElement('div');
    probe.className='mf-win';
    probe.style.cssText='position:absolute;left:-9999px';
    probe.innerHTML='<div class="mf-key"><i class="k-them"></i><i class="k-poor"></i><b class="k-botch">✗</b></div><div class="mf-phases"><div class="mf-ph w-poor"></div></div>';
    document.body.appendChild(probe);
    const bg=s=>getComputedStyle(probe.querySelector(s)).backgroundColor;
    const values={opponent:bg('.k-them'),poor:bg('.k-poor'),
      poorPhase:bg('.w-poor'),mistake:getComputedStyle(probe.querySelector('.k-botch')).color};
    probe.remove();
    return values;
  });
  assert.equal(colours.poor,colours.poorPhase,name+': poor work swatch and phase band mismatch');
  assert.equal(colours.poor,'rgb(255, 107, 94)',name+': poor work must be red');
  assert.equal(colours.opponent,'rgb(187, 166, 255)',name+': opponent momentum must be purple');
  assert.notEqual(colours.poor,colours.opponent,name+': poor work and opponent use the same colour');
  assert.notEqual(colours.mistake,colours.opponent,name+': mistake and opponent use the same colour');
  assert.notEqual(colours.mistake,colours.poor,name+': mistake and poor work use the same colour');
  // Match recap: the star breakdown fills the width beneath both upper
  // columns; it must not leave a large empty lower-left cell.
  const flowLayout=await page.evaluate(()=>{
    const host=document.createElement('section');
    host.className='mf-win';
    host.style.cssText='position:absolute;left:-2000px;width:min(1100px,100%);visibility:hidden';
    host.innerHTML='<div class="mf-cols"><div class="mf-phase-section" style="height:280px">Phases</div><div class="mf-moments-section" style="height:210px">Moments</div><div class="mf-breakdown-section" style="height:155px">Stars</div></div>';
    document.body.appendChild(host);
    const box=s=>{const r=host.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
    const result={grid:box('.mf-cols'),phase:box('.mf-phase-section'),moments:box('.mf-moments-section'),stars:box('.mf-breakdown-section')};
    host.remove();return result;
  });
  assert.ok(flowLayout.stars.left<=flowLayout.phase.left+2 &&
            flowLayout.stars.right>=flowLayout.grid.right-2,
    name+': star breakdown does not span the full panel '+JSON.stringify(flowLayout));
  assert.ok(flowLayout.stars.top>=Math.max(flowLayout.phase.bottom,flowLayout.moments.bottom)-2,
    name+': star breakdown overlaps the upper panels '+JSON.stringify(flowLayout));
  if(viewport.width>900){
    assert.ok(Math.abs(flowLayout.phase.top-flowLayout.moments.top)<=2,
      name+': upper sections should remain side by side '+JSON.stringify(flowLayout));
  }
  await page.locator('[data-title="new"]').waitFor();
  await page.locator('[data-title="new"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  assert.ok(await page.locator('#view').innerText(),'career screen rendered');

  // Settle a genuine match, then stage an interrupted result screen to test
  // the same localStorage resume route used by a real mid-show reload.
  const cid=await page.evaluate(()=>{
   const G=window.OfficeGame,s=G.S;
   s.cash=99999;s.rep=65;
   const signed=G.sign('rex');
   if(signed!==null)throw new Error('Could not sign Rex: '+signed);
   const c={id:'browser-result-'+s.season+'-'+s.week,pid:'crown',wid:'rex',rid:'silas',slot:'main',
    minutes:14,purse:420,finish:'win_clean',eventAbs:G.abs()};
   const fin={stars:3.5,crowd:68,crowdPeak:73,outcome:'booked',finishRoute:'finisher',
    botches:0,script:.85,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:14,
    plan:'story',stamina:60,injury:0,ignored:0,callsUsed:[],log:[]};
   const before=window.OfficeNightReport.capture(s);
   s.card.push(c);
   G.applyResult(c,fin);
   if(s.history[0]?.cid!==c.id)throw new Error('Match history failed to settle');
   G.save();
   window.OfficeUI.go('results');
   const saved={queue:[c.id],i:1,speed:'normal',results:[{
    cid:c.id,wid:c.wid,rid:c.rid,pid:c.pid,season:s.season,week:s.week,
    name:'Rex Titan',foe:'Silas',stars:fin.stars,baseConsequences:[],consequences:[]
   }],before,stage:'result',resultHTML:
    '<div id="phase5-restored">The saved match result is back.</div>'+
    '<button type="button" data-tv="after">After the bell</button>',
    afterReady:{c:{id:c.id,wid:c.wid,rid:c.rid,pid:c.pid,slot:c.slot,finish:c.finish},
     fin:{stars:fin.stars,crowd:fin.crowd,outcome:fin.outcome},plan:'staredown'},after:null,plan:null,promo:null,past:[]};
   localStorage.setItem('the-office-v23-match',JSON.stringify(saved));
   return c.id;
  });
  const replay=page.locator('#view button[data-replay]:visible').first();
  await replay.waitFor();
  await replay.focus();
  await page.keyboard.press('Enter');
  await page.locator('#modal[open]').waitFor();
  assert.match(await page.locator('#modal').innerText(),/Booked finish/i);
  await page.evaluate(()=>document.querySelector('#modal').close());

  const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(horizontal<=2,name+': '+horizontal+'px horizontal overflow');

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-title="load"]').click();
  await page.locator('#phase5-restored').waitFor();
  assert.equal(await page.locator('#tv').isVisible(),true,'result screen restored');
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.week),1);
  // Test the actual post-bell screen, not just the saved-result placeholder.
  // The broken PR #109 squeezed dialogue and decisions into narrow columns.
  await page.locator('#tv button[data-tv="after"]').click();
  await page.locator('#afterTalk').waitFor();
  assert.equal(await page.locator('#tv .after-consequences').count(),0,
    name+': consequences must not appear before the mic decision');
  assert.equal(await page.locator('#tv .tv-foot button[data-tv="done"]').count(),0,
    name+': finish button must not appear while the microphone is live');
  const geom=await page.evaluate(()=>{
    const bounds=selector=>document.querySelector(selector).getBoundingClientRect();
    return {win:bounds('.s-back>.win').width,scene:bounds('#afterTalk').width,
      decision:bounds('.s-back .decide2').width};
  });
  // The original desktop split is deliberate while choices are visible.
  // Together both panels must fill the window, not bunch up at its left edge.
  assert.ok(geom.scene+geom.decision>=geom.win*.90,
    name+': dialogue and choices crammed into a corner '+JSON.stringify(geom));
  if(viewport.width>=1181&&viewport.height>=600){
    assert.ok(geom.scene>geom.decision*1.4,
      name+': dialogue should have the wider desktop column '+JSON.stringify(geom));
    assert.ok(geom.decision>=360,
      name+': decision column must remain usable '+JSON.stringify(geom));
  }
  await page.locator('#tv button[data-aftermic="walk"]').click();
  const consequences=page.locator('#tv .after-consequences');
  await consequences.waitFor();
  const doneGeom=await page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect();
    return {win:rect('.s-after>.win').width,scene:rect('#afterTalk').width,
      consequences:rect('.after-consequences').width};
  });
  assert.ok(doneGeom.scene>=doneGeom.win*.85,
    name+': completed dialogue must fill the width '+JSON.stringify(doneGeom));
  assert.ok(doneGeom.consequences>=doneGeom.win*.85,
    name+': consequences panel must not float in a narrow column '+JSON.stringify(doneGeom));
  const consHeight=await consequences.evaluate(el=>({height:el.getBoundingClientRect().height,
    visible:el.clientHeight,content:el.scrollHeight,heading:el.querySelector('.section-h').getBoundingClientRect().height}));
  assert.ok(consHeight.height>=150&&consHeight.visible>consHeight.heading+65,
    name+': consequences too short to read '+JSON.stringify(consHeight));
  assert.equal(await consequences.locator('.section-h').innerText(),'Consequences');
  assert.ok(await consequences.locator('.cons li').count()>0,
    name+': actual post-bell effects sit together with their heading');
  const finish=page.locator('#tv button[data-tv="done"]');
  await finish.waitFor();
  assert.equal((await finish.innerText()).trim(),'Finish show');
  await finish.click();
  await page.locator('#tv').waitFor({state:'hidden'});
  const state=await page.evaluate((id)=>{
   const s=window.OfficeGame.S;
   return {week:s.week,results:s.history.filter(h=>h.cid===id).length,
    reports:s.inbox.filter(m=>String(m.subject).startsWith('Match night report')).length,
    nightSaved:!!localStorage.getItem('the-office-v23-match'),idCount:(s.resultIds||[]).filter(x=>x===id).length};
  },cid);
  assert.equal(state.week,2,name+': match night advances exactly one week');
  assert.equal(state.results,1,name+': only one match result');
  assert.equal(state.idCount,1,name+': only one settlement marker');
  assert.equal(state.reports,1,name+': one match-night report');
  assert.equal(state.nightSaved,false,name+': no resumable night after finishing');
  assert.deepEqual(errors,[],name+': no uncaught browser exceptions');
  console.log('PASS browser '+name+': career, keyboard replay, no overflow, reload, unique report');
 }finally{await context.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await journey(browser,'desktop',{width:1280,height:720});
  await journey(browser,'phone',{width:390,height:844});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
