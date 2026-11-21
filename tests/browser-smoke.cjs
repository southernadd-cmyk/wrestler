'use strict';
// CI-only browser journey: the shipped static game has no runtime test deps.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
assert.ok(source.includes('class="mf-breakdown-section"'),'real match flow report must render a compact stars section');
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
  // Match recap: never stretch the compact star breakdown full width.
  // Desktop: phase + stars stack on the left, moments fill the right column.
  // Phone: phase, moments and stars stack in that reading order.
  const flowLayout=await page.evaluate(()=>{
    const host=document.createElement('section');
    host.className='mf-win';
    host.style.cssText='position:absolute;left:-2000px;width:min(1100px,100%);visibility:hidden';
    host.innerHTML='<div class="mf-cols"><div class="mf-phase-section" style="height:280px">Phases</div><div class="mf-moments-section"><h3>Moments</h3><ol class="mf-moments well"><li>Moment one</li><li>Moment two</li><li>Moment three</li><li>Moment four</li></ol></div><div class="mf-breakdown-section" style="height:155px">Stars</div></div>';
    document.body.appendChild(host);
    const box=s=>{const r=host.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
    const result={grid:box('.mf-cols'),phase:box('.mf-phase-section'),moments:box('.mf-moments-section'),stars:box('.mf-breakdown-section')};
    host.remove();return result;
  });
  if(viewport.width>900){
    assert.ok(Math.abs(flowLayout.phase.left-flowLayout.stars.left)<2 &&
      Math.abs(flowLayout.phase.right-flowLayout.stars.right)<2,
      name+': rating must stay the width of the phase column '+JSON.stringify(flowLayout));
    assert.ok(flowLayout.stars.width<flowLayout.grid.width*.65,
      name+': short rating bars must not span the whole recap '+JSON.stringify(flowLayout));
    assert.ok(flowLayout.stars.top>=flowLayout.phase.bottom-2,
      name+': rating must sit under phases '+JSON.stringify(flowLayout));
    assert.ok(Math.abs(flowLayout.moments.top-flowLayout.phase.top)<2 &&
      flowLayout.moments.bottom>=flowLayout.stars.bottom-2,
      name+': moments must fill the right column beside both panels '+JSON.stringify(flowLayout));
  }else{
    assert.ok(flowLayout.moments.top>=flowLayout.phase.bottom-2 &&
      flowLayout.stars.top>=flowLayout.moments.bottom-2,
      name+': phone reading order must be phases, moments, stars '+JSON.stringify(flowLayout));
  }
  await page.locator('[data-title="new"]').waitFor();
  await page.locator('[data-title="new"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  assert.ok(await page.locator('#view').innerText(),'career screen rendered');
  if(viewport.width<=720){
    const mobileReadouts=await page.evaluate(()=>[...document.querySelectorAll('#readouts .ro')].map(el=>{
      const r=el.getBoundingClientRect();
      return {label:el.querySelector('small')?.textContent||'',value:el.querySelector('b')?.textContent||'',
        display:getComputedStyle(el).display,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    }));
    assert.equal(mobileReadouts.length,4,'phone: all career readouts must exist');
    assert.ok(mobileReadouts.every(x=>x.display!=='none'&&x.right<=viewport.width+1&&x.value),
      'phone: every readout must be visible and within screen width '+JSON.stringify(mobileReadouts));
    assert.ok(mobileReadouts[2].top>=mobileReadouts[0].bottom-2,
      'phone: reputation and meetings should occupy the second compact row');
    assert.match(mobileReadouts[2].label,/Reputation/i);
    assert.match(mobileReadouts[3].label,/Meetings left/i);
  }

  // Navigate the live territory like classic CM: from card to wrestler record,
  // back to the card, then promoter record and back to the promoter list.
  // Exercise this at both desktop and phone widths without creating new workflows.
  await page.evaluate(()=>window.OfficeUI.go('pyramid'));
  const rankedName=page.locator('#view .tier .record-link[data-record^="w:"]:visible').first();
  await rankedName.waitFor();
  await rankedName.click();
  assert.ok(await page.locator('#view .record-name').isVisible(),name+': wrestler record must open');
  assert.match(await page.locator('#view').innerText(),/Promotion rankings/);
  await page.locator('#view [data-hist="back"]').click();
  assert.ok(await page.locator('#view .tiers').isVisible(),name+': back must restore rankings');
  await page.evaluate(()=>window.OfficeUI.go('promoters'));
  await page.locator('#view .record-link[data-record="p:dock"]:visible').first().click();
  assert.match(await page.locator('#view .record-name').innerText(),/Dockside/);
  assert.match(await page.locator('#view').innerText(),/Current champions/);
  await page.locator('#view [data-hist="back"]').click();
  assert.ok(await page.locator('#view').getByText('Promoters',{exact:true}).first().isVisible(),name+': back must restore promoter list');
  await page.evaluate(()=>window.OfficeUI.go('scouting'));

  // Phase 2: a small, real career-management journey in each responsive viewport.
  await page.evaluate(()=>window.OfficeUI.go('scouting'));
  await page.locator('#view [data-scout-query]').fill('Mara Vale');
  assert.match(await page.locator('#view .management-filters .filter-results').innerText(),/^1 of /,name+': search must narrow free agents');
  await page.locator('#view [data-clear-scout]').click();
  await page.locator('#view [data-scout-style]').selectOption('Technical');
  const tech=await page.evaluate(()=>window.OfficeGame.S.free.filter(w=>w.style==='Technical').length);
  assert.match(await page.locator('#view .management-filters .filter-results').innerText(),new RegExp('^'+tech+' of '),name+': style filter must use live free agents');
  await page.locator('#view [data-clear-scout]').click();
  await page.evaluate(()=>window.OfficeUI.go('scouting','mara'));
  await page.locator('#view button[data-shortlist="mara"]').click();
  await page.evaluate(()=>window.OfficeUI.go('scouting','lyra'));
  await page.locator('#view button[data-shortlist="lyra"]').click();
  assert.match(await page.locator('#view .scout-comparison').innerText(),/Compare two wrestlers/);
  assert.match(await page.locator('#view .scout-comparison').innerText(),/Vale/);
  assert.match(await page.locator('#view .scout-comparison').innerText(),/Knox/);
  await page.locator('#view [data-clear-shortlist]').click();
  await page.evaluate(()=>window.OfficeUI.go('desk'));
  assert.ok(await page.locator('#view .desk-brief').isVisible(),name+': office desk must present next action');
  await page.evaluate(()=>window.OfficeUI.go('inbox'));
  await page.locator('#view [data-inbox-filter="action"]').click();
  assert.match(await page.locator('#view').innerText(),/No messages match this filter/);
  await page.locator('#view [data-inbox-filter="all"]').click();
  assert.ok(await page.locator('#view .msglist button').count()>0,name+': all inbox messages must return');
  await page.evaluate(()=>window.OfficeUI.go('squad'));
  await page.locator('#view [data-stable-filter]').selectOption('attention');
  assert.match(await page.locator('#view').innerText(),/0 of 0 shown/);
  await page.locator('#view [data-clear-stable]').click();
  // Check layout before entering a match (the post-match journey checks again).
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2,
    name+': management controls must not introduce horizontal overflow');

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
