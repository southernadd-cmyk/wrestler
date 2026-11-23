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
    pager:consoleEl.querySelector('.rf-sub-nav')?box(consoleEl.querySelector('.rf-sub-nav')):null,
    hold:!!consoleEl.querySelector('.rf-hold')};
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
  assert.equal(g.pager,null,name+': a single-page index has no subpage controls');
  assert.equal(g.hold,false,name+': a single-page index has no Hold button');
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
   assert.ok(g.jump.bottom<=g.view.bottom+1&&(!g.pager||g.pager.bottom<=g.view.bottom+1),
    name+': core navigation is below fold');
   assert.ok(g.screen.width>viewport.width*.4,name+': desktop screen wastes horizontal space');
  }else{
   assert.ok(g.display.bottom<=g.view.bottom+3,name+': phone/tablet screen should fit before internal scroll');
   assert.ok(g.console.top>=g.display.bottom-1,name+': stacked controls overlap the teletext');
   if(viewport.width<=720){
    assert.ok(g.console.bottom<=g.view.bottom+2,name+': page controls must not be below the fold '+JSON.stringify(g));
    assert.ok(g.jump.bottom<=g.view.bottom+2&&(!g.pager||g.pager.bottom<=g.view.bottom+2),
     name+': mobile page input and subpage arrows must remain visible');
    const required=['100','200','500','501'];
    assert.ok(required.every(p=>g.visibleDirectoryButtons.some(x=>x.page===p&&x.bottom<=g.view.bottom+2)),
     name+': mobile shortcuts for Index/Results/Fanzone/Letters must be visible');
   }
  }

  // A new career already has titleholders, card ladders, promoters and
  // actual offers. The opening edition must expose them before match one.
  const untouchedCareer=await page.evaluate(()=>JSON.stringify(window.OfficeGame.S));
  for(const [number,heading] of [
   [102,'SEASON OUTLOOK'],[103,'THE GRAPEVINE'],[104,'FROM THE ROAD'],
   [301,'THE LONG VIEW']
  ]){
   await page.locator('#rf-screen .rf-index-half[data-rf-value="'+number+'"]').click();
   const edition=await page.evaluate(()=>{
    const R=window.OfficeRingfax,s=window.OfficeGame.S;
    return {screen:R.screen(s),data:R.build(s)};
   });
   assert.equal(edition.screen.subpages,1,name+': page '+number+' must fit one screen');
   assert.ok(edition.screen.rows.every(row=>row.text.length===40),
    name+': page '+number+' must remain 40 columns');
   assert.match(await page.locator('#rf-screen').innerText(),new RegExp(heading),
    name+': labelled opening page '+number);
   await page.locator('.rf-page-link[data-rf-value="100"]').click();
  }
  const initialNews=await page.evaluate(()=>window.OfficeRingfax.build(window.OfficeGame.S));
  assert.ok(initialNews[101].lines.some(row=>row.text.includes('FOUR PROMOTIONS')),
   name+': opening news is editorial rather than a champions table');
  assert.ok(initialNews[200].lines.some(row=>row.text.includes('CHEAP SEATS')),
   name+': After the Bell is a fan reaction column, not a results list');
  assert.ok(initialNews[201].lines.some(row=>row.text.includes('NOT A SCOREBOARD')),
   name+': Critic page is a point of view, not duplicate ratings');
  assert.ok(initialNews[300].lines.some(row=>row.text.includes('EDITORS PICKS')),
   name+': Watchlist offers talking points, not ranks');
  assert.ok(initialNews[302].lines.some(row=>row.text.includes('PRESSURE')),
   name+': Title Talk is opinion, not a championship table');
  const forbidden=['CHAMPIONS - THE ENTIRE CIRCUIT','RECENT COMPLETED MATCHES',
   'RECORDED MATCH RATINGS','CARD LADDER /','BOOKINGS AND OPPORTUNITIES'];
  const wholeIssue=Object.values(initialNews).filter(p=>p.number!==777)
   .flatMap(p=>p.lines).map(x=>x.text).join('\n');
  assert.ok(forbidden.every(text=>!wholeIssue.includes(text)),
   name+': editorial cannot duplicate Office tables');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.OfficeGame.S)),untouchedCareer,
   name+': opening week editorial coverage is read-only');

  // Click a line in the teletext itself (not just the separate directory).
  await page.locator('#rf-screen .rf-index-half[data-rf-value="500"]').click();
  assert.match(await page.locator('#rf-screen').innerText(),/THE FANZONE/);
  assert.equal(await page.locator('#rf-screen .rf-row').count(),25,'Fanzone uses a full 25-row grid');
  await page.locator('.rf-page-link[data-rf-value="501"]').click();
  assert.match(await page.locator('#rf-screen').innerText(),/READERS LETTERS/);
  const firstLetters=await page.evaluate(()=>{
   const R=window.OfficeRingfax,S=window.OfficeGame.S;
   const p=R.build(S)[501],v=R.screen(S);
   return {subpages:v.subpages,lines:p.lines.length,last:v.rows.some(x=>x.text.includes('Earn our ticket money')),
    authors:['GRAPPLEGRAN','HEELTURN78','MATWORKMICK','TICKETSTUB'].map(name=>
     v.rows.filter(row=>row.text.includes('FROM: '+name)).length),
    footer:v.rows[24].text};
  });
  assert.equal(firstLetters.subpages,1,name+': four opening-week letters fit one page');
  assert.ok(firstLetters.lines<=17,name+': all letters fit within the content budget');
  assert.deepEqual(firstLetters.authors,[1,1,1,1],
   name+': all four readers appear without a trailing orphan page');
  assert.equal(firstLetters.last,true,name+': ticket buyer letter ends on the same page');
  assert.equal(await page.locator('.rf-sub-nav').count(),0,name+': no unnecessary single-page arrows');
  assert.equal(await page.locator('.rf-hold').count(),0,name+': no unnecessary single-page Hold');
  assert.ok(!firstLetters.footer.includes('HOLD')&&!firstLetters.footer.includes('SUBPAGES'),
   name+': teletext single-page footer is not misleading');
  const multiLetterCheck=await page.evaluate(()=>{
   const R=window.OfficeRingfax,S=window.OfficeGame.S;
   const sample={...S,history:[{cid:'rf-pagination-fixture',name:'Rex',foe:'Silas',
    season:1,week:1,stars:3}]};
   R.press('go',501,sample);
   const first=R.screen(sample),p=R.build(sample)[501],html=R.view(sample);
   R.press('right',null,sample);
   const next=R.screen(sample);
   R.press('go',501,S);
   return {pages:first.subpages,showArrows:html.includes('class="rf-sub-nav"'),
    showHold:html.includes('class="rf-hold"'),nextSub:next.sub,
    firstAuthors:first.rows.slice(6,23).filter(x=>x.text.includes('FROM:')).length,
    secondAuthors:next.rows.slice(6,23).filter(x=>x.text.includes('FROM:')).length,
    secondPageStartsWithTitle:next.rows[6].text.trim()==='LETTERS TO RINGFAX',
    oneAuthorPerPage:p.subpages.every(rows=>rows.some(x=>x.text.startsWith('FROM: ')))};
  });
  assert.ok(multiLetterCheck.pages>=2,name+': post-match letters use purposeful subpages');
  assert.ok(multiLetterCheck.showArrows&&multiLetterCheck.showHold,
   name+': multi-page letters reveal genuine subpage controls');
  assert.equal(multiLetterCheck.nextSub,1,name+': next arrow goes to a real subpage');
  assert.ok(multiLetterCheck.firstAuthors>0&&multiLetterCheck.secondAuthors>0&&
   multiLetterCheck.secondPageStartsWithTitle&&multiLetterCheck.oneAuthorPerPage,
   name+': second page starts with a labelled letter, not orphaned trailing text');

  // Direct page entry should work without forcing users to find a numeric pad.
  await page.locator('#rf-page-entry').fill('302');
  await page.locator('[data-rf-action="jump"]').click();
  assert.match(await page.locator('#rf-screen').innerText(),/TITLE TALK/);
  const titles=await page.evaluate(()=>{
   const S=window.OfficeGame.S,R=window.OfficeRingfax,D=window.OfficeData;
   const data=R.build(S)[302],v=R.screen(S);
   const champ=S.territory.titles.dock.men.holder;
   const p=D.TALENT.find(w=>w.id===champ)||D.FOES.find(w=>w.id===champ);
   return {subpages:v.subpages,lines:data.lines.length,text:data.lines.map(r=>r.text).join(' '),
    championName:p?.name||champ};
  });
  assert.equal(titles.subpages,1,name+': title opinion fits one screen');
  assert.ok(titles.lines<=17,name+': opinion fits 17 editorial rows');
  assert.ok(titles.text.includes(titles.championName),
   name+': title opinion is based on an actual current titleholder');
  assert.ok(!titles.text.includes('MEN                 WOMEN'),
   name+': no duplicated champions table in Ringfax');

  // Preserve keyboard access to the teletext service.
  await page.keyboard.press('F4');
  assert.match(await page.locator('#rf-screen').innerText(),/THE FANZONE/);

  // The quiz is a real index entry, not a hidden page-number guessing game.
  // It uses the same channel header as P100, and always offers 100 INDEX.
  const originalCareer=await page.evaluate(()=>JSON.stringify(window.OfficeGame.S));
  await page.locator('.rf-page-link[data-rf-value="100"]').click();
  assert.equal(await page.locator('#rf-screen .rf-index-half[data-rf-value="777"]').count(),1,
   name+': page 100 has a clickable quiz directory entry');
  await page.locator('#rf-screen .rf-index-half[data-rf-value="777"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.screen(window.OfficeGame.S).page),777,
   name+': index link navigates to the quiz');
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().stage),'intro',
   name+': secret 777 starts at intro');
  assert.equal(await page.locator('#rf-screen .rf-row').count(),25,
   name+': underlying accessible 40x25 teletext model is preserved');
  assert.equal(await page.locator('.rf-bz-page').count(),1,
   name+': page 777 has one full-screen quiz composition');
  assert.equal(await page.locator('.rf-bz-face').count(),1,
   name+': original yellow pixel mascot is rendered');
  assert.equal(await page.locator('.rf-bz-channel .rf-logo-svg').count(),1,
   name+': regular Ringfax blue pixel masthead is reused on page 777');
  assert.equal(await page.locator('.rf-bz-shared-header').count(),1,
   name+': quiz uses the same 1+4+1 teletext header structure as other pages');
  assert.equal(await page.locator('.rf-bz-home[data-rf-value="100"]').count(),1,
   name+': a permanent index return button is visible');
  assert.equal(await page.locator('.rf-bz-bubble').count(),1,
   name+': question lives in a white speech bubble');
  assert.equal(await page.locator('.rf-bz-choice').count(),2,
   name+': intro has exactly two meaningful controls, without duplicate Start quiz');
  const mascot=await page.evaluate(()=>{
   const svg=document.querySelector('.rf-bz-face'),paths=[...svg.querySelectorAll('path')];
   return {viewBox:svg.getAttribute('viewBox'),crisp:svg.getAttribute('shape-rendering'),
    fills:paths.map(x=>x.getAttribute('fill')),
    count:paths.length,pixelRuns:paths.reduce((n,path)=>n+
     ((path.getAttribute('d')||'').match(/M\\d+ \\d+h/g)||[]).length,0)};
  });
  assert.equal(mascot.viewBox,'0 0 56 47',name+': higher detail teletext mosaic viewBox');
  assert.equal(mascot.crisp,'crispEdges',name+': rectangular pixels have sharp edges');
  assert.equal(mascot.count,5,name+': five-colour original character SVG');
  assert.ok(mascot.pixelRuns>=200,name+': portrait has at least 200 separate pixel runs');
  assert.deepEqual(mascot.fills,['#fff','#ff0','#00f','#0ff','#f00'],
   name+': mascot is limited to the authentic teletext colour palette');
  await page.locator('.rf-bz-choice.rf-bz-red').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().stage),'question');
  assert.equal(await page.locator('.rf-bz-choice').count(),4,
   name+': all four answers have a real colour-square button');
  assert.equal(await page.locator('.rf-bz-fast').count(),4,
   name+': four matching Fastext question mark groups');
  assert.match(await page.locator('.rf-bz-instruction').innerText(),
   /PRESS THE COLOUR OF YOUR CHOICE/);
  const quizLayout=await page.evaluate(()=>{
   const box=el=>{const r=el.getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
   const screen=document.querySelector('#rf-screen'),page=document.querySelector('.rf-bz-page');
   const header=document.querySelector('.rf-bz-shared-header'),
    channel=document.querySelector('.rf-bz-channel'),
    logo=document.querySelector('.rf-bz-channel svg'),
    home=document.querySelector('.rf-bz-home');
   const bubble=document.querySelector('.rf-bz-bubble'),mascot=document.querySelector('.rf-bz-mascot');
   const choices=[...document.querySelectorAll('.rf-bz-choice')];
   const footer=document.querySelector('.rf-bz-footer');
   return {screen:box(screen),page:box(page),header:box(header),
    channel:box(channel),logo:box(logo),home:box(home),
    bubble:box(bubble),mascot:box(mascot),
    choices:choices.map(box),footer:box(footer),scroll:document.documentElement.scrollWidth-innerWidth};
  });
  assert.ok(quizLayout.page.left>=quizLayout.screen.left-2&&
   quizLayout.page.right<=quizLayout.screen.right+2,
   name+': quiz composition fits inside teletext display');
  assert.ok(quizLayout.header.top>=quizLayout.screen.top-2 &&
   quizLayout.header.bottom<=quizLayout.page.top+2,
   name+': complete header fits above the quiz body '+JSON.stringify(quizLayout));
  assert.ok(quizLayout.logo.top>=quizLayout.channel.top-2 &&
   quizLayout.logo.bottom<=quizLayout.channel.bottom+2,
   name+': Ringfax ident is contained within the blue banner');
  assert.ok(quizLayout.home.right<=quizLayout.screen.right+2 &&
   quizLayout.home.top>=quizLayout.header.top &&
   quizLayout.home.bottom<=quizLayout.header.bottom+2,
   name+': 100 INDEX return control is not clipped');
  assert.ok(quizLayout.bubble.right<=quizLayout.mascot.right+2,
   name+': speech bubble does not cover the entire quiz mascot');
  assert.ok(quizLayout.choices.every(x=>x.height>20&&
   x.left>=quizLayout.screen.left-2&&x.right<=quizLayout.screen.right+2),
   name+': four answer rows fit the display '+JSON.stringify(quizLayout));
  assert.ok(quizLayout.footer.bottom<=quizLayout.screen.bottom+2,
   name+': colour question marks do not spill below the screen');
  assert.ok(quizLayout.scroll<=2,name+': quiz must not cause horizontal scroll');
  const actualColours=await page.evaluate(()=>{
   const codes=['red','green','yellow','cyan'];
   return codes.map(c=>{
    const answer=document.querySelector('.rf-bz-choice.rf-bz-'+c);
    const square=answer.querySelector('.rf-bz-square');
    const fast=document.querySelector('.rf-bz-fast.rf-bz-'+c);
    return {answer:getComputedStyle(answer).color,
     square:getComputedStyle(square).backgroundColor,
     footer:getComputedStyle(fast).color,text:answer.innerText.trim()};
   });
  });
  const rgb=['rgb(255, 0, 0)','rgb(0, 255, 0)','rgb(255, 255, 0)','rgb(0, 255, 255)'];
  for(const [i,answer] of actualColours.entries()){
   assert.equal(answer.answer,'rgb(255, 255, 255)',
    name+': answer '+i+' text is white as on classic Bamboozle');
   assert.equal(answer.square,rgb[i],
    name+': answer '+i+' uses a solid teletext colour square');
   assert.equal(answer.footer,rgb[i],
    name+': bottom Fastext question marks match the square');
   assert.ok(answer.text.length>0,name+': answer '+i+' has a label');
  }
  // Return works at any stage; restarting from P100 resets the quiz intro.
  await page.locator('.rf-bz-home').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.screen(window.OfficeGame.S).page),100,
   name+': permanent 100 INDEX button returns from a question');
  await page.locator('#rf-screen .rf-index-half[data-rf-value="777"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().stage),'intro',
   name+': returning via index restarts the quiz at its intro');
  await page.locator('.rf-bz-choice.rf-bz-red').click();
  await page.locator('.rf-bz-choice.rf-bz-red').hover();
  assert.equal(await page.locator('.rf-bz-choice.rf-bz-red')
   .evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)',
   name+': hover must not erase the white answer text');

  const correct=await page.evaluate(()=>window.OfficeRingfax.quizQuestions[0].correct);
  await page.locator('.rf-bz-choice[data-rf-action="quiz-answer"][data-rf-value="'+((correct+1)%4)+'"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().stage),'wrong',
   name+': wrong colour should enter the penalty page');
  await page.locator('.rf-bz-choice.rf-bz-green').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().reveal),true,
   name+': green button reveals the trivia fact');
  await page.locator('.rf-bz-choice.rf-bz-red').click();
  assert.equal(await page.evaluate(()=>window.OfficeRingfax.quizInfo().index),0,
   name+': retry restores the checkpoint');
  await page.locator('.rf-bz-choice[data-rf-action="quiz-answer"][data-rf-value="'+correct+'"]').click();
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
