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
    visibleDirectoryButtons:[...consoleEl.querySelectorAll('.rf-page-link')].filter(x=>{
     const st=getComputedStyle(x),r=x.getBoundingClientRect();return st.display!=='none'&&r.width>0&&r.height>0
    }).map(x=>({page:x.dataset.rfValue,bottom:x.getBoundingClientRect().bottom})),
    mastheadText:rows.slice(1,5).map(x=>x.textContent).join(' '),
    mosaicRows:screen.querySelectorAll('.rf-mosaic').length,
    logo:box(screen.querySelector('.rf-logo-svg')),
    logoPixelPath:screen.querySelector('.rf-logo-svg path')?.getAttribute('d')||'',
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
  assert.ok(g.mastheadText.includes('RINGFAX'),name+': text alternative identifies Ringfax');
  assert.ok(g.logoPixelPath.length>400,name+': wordmark is composed of explicit pixel paths');
  assert.ok(g.logo.width>=g.screen.width*.80,name+': wordmark must dominate the blue bar, not look like a small label '+JSON.stringify(g));
  assert.ok(g.logo.height>=g.rows[1].height*2.5,name+': wordmark must fill most of the four-row masthead');
  assert.ok(g.logo.top>=g.rows[1].top-2&&g.logo.bottom<=g.rows[4].bottom+2,
   name+': logo must be entirely contained within its blue four-row banner');
  assert.ok(!g.mastheadText.includes('█'),name+': fallback block glyphs are unreadable on phone');
  assert.ok(g.rows.every(x=>x.scroll<=x.client+2),name+': text cells clip horizontally '+JSON.stringify(g.rows.filter(x=>x.scroll>x.client+2)));
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
   if(viewport.width<=720){
    assert.ok(g.console.bottom<=g.view.bottom+2,name+': page controls must not be below the fold '+JSON.stringify(g));
    assert.ok(g.jump.bottom<=g.view.bottom+2&&g.pager.bottom<=g.view.bottom+2,
     name+': mobile page input and subpage arrows must remain visible');
    const required=['100','200','500','501'];
    assert.ok(required.every(p=>g.visibleDirectoryButtons.some(x=>x.page===p&&x.bottom<=g.view.bottom+2)),
     name+': mobile shortcuts for Index/Results/Fanzone/Letters must be visible');
   }
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
  const titles=await page.evaluate(()=>{
   const G=window.OfficeGame, R=window.OfficeRingfax, D=window.OfficeData;
   const page=R.screen(G.S), data=R.build(G.S)[302];
   const holders=G.S.promoters.flatMap(p=>D.DIVISION_ORDER.map(div=>({
    pid:p.id,holder:G.S.territory.titles[p.id]?.[div]?.holder,
    name:p.name,division:div
   })));
   return {subpages:page.subpages,contentLines:data.lines.length,holders,
    rendered:page.rows.slice(6,23).map(r=>r.text).join(' ')};
  });
  assert.equal(titles.subpages,1,name+': all champions fit one 302 subpage');
  assert.ok(titles.contentLines<=17,name+': full title data exceeds a teletext page');
  assert.equal(titles.holders.length,8,name+': four promotions by two divisions');
  assert.ok(titles.holders.every(t=>titles.rendered.includes(t.name.toUpperCase())),
   name+': all four promotions must be displayed together');

  // Preserve keyboard access to the teletext service.
  await page.keyboard.press('F4');
  assert.match(await page.locator('#rf-screen').innerText(),/THE FANZONE/);

  // Easter egg: only a manually entered page 777 opens the quiz.
  const originalCareer=await page.evaluate(()=>JSON.stringify(window.OfficeGame.S));
  await page.locator('#rf-page-entry').fill('777');
  await page.locator('[data-rf-action="jump"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().stage),'intro',
   name+': secret 777 should begin on the intro page');
  assert.equal(await page.locator('#rf-screen .rf-row').count(),25);
  await page.locator('.rf-quiz-remote .rf-quiz-key-red').click();
  const introInfo=await page.evaluate(()=>window.OfficeRingfax.quizInfo());
  assert.equal(introInfo.stage,'question');
  assert.equal(await page.locator('#rf-screen .rf-quiz-answer').count(),4,
   name+': each answer is accessible by tapping the teletext choice');
  assert.equal(await page.locator('.rf-quiz-remote .rf-quiz-key').count(),4,
   name+': four large colour buttons sit outside the text grid');
  // Check what Chromium actually paints, not just a CSS class. The four
  // on-page answers must match the touch keys AND their Fastext counterparts.
  const answerColours=await page.evaluate(()=>{
   const codes=['red','green','yellow','cyan'],out=[];
   for(let i=0;i<4;i++){
    const row=document.querySelector('#rf-screen .rf-quiz-answer[data-rf-value="'+i+'"]');
    const key=document.querySelector('.rf-quiz-remote .rf-quiz-key[data-rf-value="'+i+'"]');
    const fast=document.querySelector('#rf-screen .rf-fast-seg[data-rf-value="'+i+'"]');
    out.push({name:codes[i],row:getComputedStyle(row).color,
     key:getComputedStyle(key).color,fast:getComputedStyle(fast).color,
     text:row.textContent.trim()});
   }
   return out;
  });
  const rgb=['rgb(255, 0, 0)','rgb(0, 255, 0)','rgb(255, 255, 0)','rgb(0, 255, 255)'];
  for(const [i,answer] of answerColours.entries()){
   assert.equal(answer.row,rgb[i],name+': on-screen answer has the correct teletext colour');
   assert.equal(answer.row,answer.key,name+': answer matches its touch button');
   assert.equal(answer.row,answer.fast,name+': answer matches its Fastext key');
   assert.ok(answer.text.startsWith(answer.name.toUpperCase()+': '),
    name+': answer is labelled by colour');
  }
  await page.locator('#rf-screen .rf-quiz-answer[data-rf-value="0"]').hover();
  assert.equal(await page.locator('#rf-screen .rf-quiz-answer[data-rf-value="0"]')
   .evaluate(el=>getComputedStyle(el).color),rgb[0],
   name+': hovering an answer must not erase its red colour');

  if(viewport.width<=720){
   const gq=await page.evaluate(()=>{
    const r=el=>{const v=el.getBoundingClientRect();return {top:v.top,bottom:v.bottom,height:v.height}};
    const view=document.querySelector('#view'),keys=[...document.querySelectorAll('.rf-quiz-remote .rf-quiz-key')];
    return {view:r(view),keys:keys.map(r)};
   });
   assert.ok(gq.keys.every(k=>k.height>=42&&k.bottom<=gq.view.bottom+2),
    name+': phone quiz buttons must remain visible and finger-sized '+JSON.stringify(gq));
  }
  const correct=await page.evaluate(()=>window.OfficeRingfax.quizQuestions[0].correct);
  await page.locator('.rf-quiz-remote [data-rf-action="quiz-answer"][data-rf-value="'+((correct+1)%4)+'"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().stage),'wrong',
   name+': wrong colour should enter the penalty page');
  await page.locator('.rf-quiz-remote .rf-quiz-key-green').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().reveal),true,
   name+': green button reveals the trivia fact');
  await page.locator('.rf-quiz-remote .rf-quiz-key-red').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().index),0,
   name+': retry restores the checkpoint');
  await page.locator('.rf-quiz-remote [data-rf-action="quiz-answer"][data-rf-value="'+correct+'"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().index),1,
   name+': correct answer advances a round');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.OfficeGame.S)),originalCareer,
   name+': the hidden quiz must leave career state untouched');
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
  await run(browser,'phone-343',{width:343,height:740});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
