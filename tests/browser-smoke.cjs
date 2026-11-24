'use strict';
// CI-only browser journey: the shipped static game has no runtime test deps.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
assert.ok(source.includes('class="mf-breakdown-section"'),'real match flow report must render a compact stars section');
const {chromium}=require('playwright');
const URL='http://127.0.0.1:8765/';

// Phones fold the free-agent search and filters into a disclosure so the
// candidates come first. Open it the way a player would before using them.
async function openScoutFilters(page){
 const d=page.locator('#view details.free-filters');
 if(await d.count()&&!(await d.evaluate(el=>el.open)))await d.locator('summary').click();
}

// Match-night broadcast geometry. The live line, commentary history and
// large events must never resize their window as lines are replaced.
async function commentaryHeightAudit(page,name,viewport){
 const metrics=await page.evaluate(()=>{
  const tv=document.querySelector('#tv'),old=tv.innerHTML,wasHidden=tv.hidden;
  tv.hidden=false;
  tv.innerHTML='<div class="stage screen s-live"><section class="win quiet">'+
    '<header class="tbar"><h3>Live commentary</h3></header>'+
    '<div class="wbody tight"><div class="feed well">'+
    '<div class="now" id="lNow" aria-live="polite"></div>'+
    '<div class="commentary-views"><span>Commentary archive</span>'+
    '<button>All lines</button><button>Key moments</button></div>'+
    '<ol class="past" id="lPast"></ol></div></div></section>'+
    '<section class="win"><header class="tbar"><h3>Ringside</h3></header><div class="wbody">Coaching panel</div></section></div>';
  const now=document.querySelector('#lNow'),feed=document.querySelector('#tv .s-live .feed'),
    past=document.querySelector('#lPast');
  const cases=[
   ['normal','The wrestler locks up in the middle of the ring.',0],
   ['big','The action changes, and this is a much longer commentary line explaining a dramatic moment in the match. '.repeat(3),2],
   ['count','ONE!',0],
   ['count','ONE! TWO! THREE! The referee counts and the crowd reacts wildly to this incredible moment! '.repeat(4),8],
   ['rating','A remarkable ending brings everyone in the building to their feet.',20]
  ];
  const result=cases.map(([kind,line,history])=>{
   now.className='now '+kind;
   now.innerHTML='<span class="t">08:23</span><span class="spk-pf"></span><span class="tx">'+line+'</span>';
   past.innerHTML=Array.from({length:history},(_,i)=>'<li><span class="t">09:23</span><span>Earlier call '+i+'</span></li>').join('');
   const box=now.getBoundingClientRect(),fb=feed.getBoundingClientRect(),text=now.querySelector('.tx'),
    tr=text.getBoundingClientRect();
   return {kind,nowHeight:box.height,feedHeight:fb.height,
    boxLeft:box.left,boxRight:box.right,textRight:tr.right,textLeft:tr.left,
    textScrollWidth:text.scrollWidth,textClientWidth:text.clientWidth,
    textScrollHeight:text.scrollHeight,textClientHeight:text.clientHeight,
    textOverflow:getComputedStyle(text).overflowY,
    historicalLines:past.children.length,
    currentText:text.textContent};
  });
  tv.innerHTML=old;tv.hidden=wasHidden;
  return result;
 });
 const expected=viewport.width<=720?(viewport.height<=760?98:112):viewport.width<=900?124:148;
 const base=metrics[0];
 for(const m of metrics){
  assert.ok(Math.abs(m.nowHeight-expected)<2,
    name+': '+m.kind+' changes live commentary height '+JSON.stringify(m));
  assert.ok(Math.abs(m.nowHeight-base.nowHeight)<1,
    name+': event line changes live commentary card height');
  assert.ok(Math.abs(m.feedHeight-base.feedHeight)<1,
    name+': event line or archive length changes overall panel height');
  assert.ok(m.textLeft>=m.boxLeft-1&&m.textRight<=m.boxRight+1,
    name+': commentary text spills outside its card '+JSON.stringify(m));
  assert.ok(m.textScrollWidth<=m.textClientWidth+2,
    name+': event font causes horizontal overflow '+JSON.stringify(m));
  assert.equal(m.textOverflow,'auto',name+': extra-long lines need internal scrolling');
  assert.ok(m.currentText.length>0,name+': long commentary must not be truncated in DOM');
 }
 const huge=metrics.find(m=>m.kind==='count'&&m.currentText.length>100);
 assert.ok(huge.textScrollHeight>=huge.textClientHeight,
   name+': oversize count must remain accessible by scrolling');
 console.log('PASS live commentary stable height '+name+': '+expected+'px');
}

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

  // Phase 6: inspect the new three-part report at the actual page viewport.
  // No fabricated result ratings: this is a pure CSS overflow/layout audit.
  const structureLayout=await page.evaluate(()=>{
    const host=document.createElement('section');
    host.className='structure-assessment';
    host.style.cssText='position:absolute;left:0;top:20px;width:min(1080px,100%);visibility:hidden';
    host.innerHTML='<h4>Match structure assessment</h4><div class="structure-assessment-grid">'+
      ['Plan adherence','Structural coherence','Execution quality'].map(x=>
      '<div><b>'+x+'</b><strong>2 of 4 witnessed</strong><p>Read the evidence, not the promise.</p></div>').join('')+'</div>';
    document.body.appendChild(host);
    const grid=host.querySelector('.structure-assessment-grid'),bounds=grid.getBoundingClientRect();
    const cards=[...grid.children].map(el=>{const r=el.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}});
    host.remove();
    return {grid:{left:bounds.left,right:bounds.right,width:bounds.width},cards};
  });
  assert.equal(structureLayout.cards.length,3,name+': all three independent readings must be present');
  assert.ok(structureLayout.cards.every(x=>x.left>=-2&&x.right<=viewport.width+2&&x.width>80),
    name+': report extends beyond viewport '+JSON.stringify(structureLayout));
  if(viewport.width<=780){
    assert.ok(structureLayout.cards[1].top>=structureLayout.cards[0].bottom-2&&
      structureLayout.cards[2].top>=structureLayout.cards[1].bottom-2,
      name+': phone report should stack three readings '+JSON.stringify(structureLayout));
  }else{
    assert.ok(Math.abs(structureLayout.cards[0].top-structureLayout.cards[1].top)<2&&
      Math.abs(structureLayout.cards[1].top-structureLayout.cards[2].top)<2,
      name+': desktop report should use three balanced columns '+JSON.stringify(structureLayout));
  }
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
  await page.locator('#modal [data-dlg="identity-save"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  await commentaryHeightAudit(page,name,viewport);
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
    // Since #211 the phone header keeps all four readouts in one compact row.
    assert.ok(mobileReadouts.every(x=>Math.abs(x.top-mobileReadouts[0].top)<2),
      'phone: all four readouts should share one compact row '+JSON.stringify(mobileReadouts));
    assert.ok(mobileReadouts.every((x,i)=>i===0||x.left>=mobileReadouts[i-1].right-1),
      'phone: readouts should sit side by side in order '+JSON.stringify(mobileReadouts));
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
  await openScoutFilters(page);
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
  // Phase 3: enter an actual backstage meeting. The matching brief must remain
  // visible and contained at both phone and desktop widths, without altering the
  // agreed finish or the underlying booking.
  await page.evaluate(()=>{
   const G=window.OfficeGame;G.fresh();const s=G.S;
   const err=G.sign('rex');if(err)throw new Error('Setup sign failed: '+err);
   s.card.push({id:'browser-phase3-'+s.week,pid:'crown',wid:'rex',rid:'silas',
    slot:'main',minutes:14,purse:420,finish:'win_clean',eventAbs:G.abs()});
   G.save();window.OfficeUI.go('desk');
  });
  await page.locator('#continue').click();
  const brief=page.locator('#tv .match-brief');
  await brief.waitFor();
  assert.match(await brief.innerText(),/Promoter.s booking/);
  assert.match(await brief.innerText(),/Finish route/);
  assert.match(await brief.innerText(),/Running order/);
  assert.match(await brief.innerText(),/Finish\s*\n\s*Nothing extra needed/);
  // Phase 4: exercise actual user controls on desktop and mobile.
  const structureDisclosure=page.locator('#tv .structure-chooser');
  await structureDisclosure.locator('summary').click();
  assert.equal(await page.locator('#tv .structure-option').count(),5);
  await page.locator('#tv [data-structure="kings_road"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeUI.night.plan.room.structurePlanning),true);
  await page.locator('#tv [data-structurelead="f"]').click();
  const chosen=await page.evaluate(()=>{
   const p=window.OfficeUI.night.plan;
   const saved=JSON.parse(localStorage.getItem('the-office-v23-match'));
   return {choice:p.structureChoice,lead:p.room.structure.roles.lead,
    saved:saved.plan.structureChoice,finish:window.OfficeGame.S.card[0].finish};
  });
  assert.equal(chosen.choice.id,'kings_road');
  assert.equal(chosen.choice.lead,'f');
  assert.equal(chosen.lead,'f');
  assert.equal(chosen.saved.lead,'f');
  assert.equal(chosen.finish,'win_clean');
  await page.locator('#tv [data-structure="traditional"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeUI.night.plan.structureChoice==null),true);
  assert.equal(await page.evaluate(()=>!!window.OfficeUI.night.plan.room.structurePlanning),false);
  const geometry=await page.evaluate(()=>{
   const children=[...document.querySelectorAll('#tv .match-brief>div')];
   return {view:innerWidth,cards:children.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}}),
     stage:document.querySelector('#tv .stage')?.getBoundingClientRect().width};
  });
  assert.equal(geometry.cards.length,4,name+': all four booked-plan facts should be present');
  assert.ok(geometry.cards.every(r=>r.left>=-2&&r.right<=geometry.view+2&&r.width>=80),
    name+': match brief overflows '+JSON.stringify(geometry));
  assert.ok(geometry.stage<=geometry.view+2,name+': backstage exceeds viewport');
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.card[0].finish),'win_clean',
    name+': presentation must not alter booked finish');
  // Phase 5: selecting Traditional re-renders and closes the optional disclosure.
  // Reopen Advanced before making another structure selection.
  await page.locator('#tv .structure-chooser summary').click();
  await page.locator('#tv [data-structure="kings_road"]').click();
  await page.locator('#tv [data-room="plan_technical"]').click();
  await page.locator('#tv [data-room="board_ok"]').click();
  let discussed=false;
  for(let i=0;i<14;i++){
   const step=await page.evaluate(()=>{
    const r=window.OfficeUI.night.plan.room,v=window.OfficeRoom.view(r);
    return {stage:r.stage,situation:v.situation,ids:v.options.map(o=>o.id)};
   });
   if(step.stage==='review')break;
   assert.equal(step.stage,'scene',name+': structured review should follow real backstage scenes');
   const id=step.situation==='structure_huddle'?(discussed=true,'open'):
     step.ids.includes('replace')?'replace':step.ids.includes('open')?'open':step.ids[0];
   assert.ok(id,name+': backstage scene has an available response');
   await page.locator('#tv [data-room="'+id+'"]').click();
  }
  assert.equal(discussed,true,name+': at least one performed backstage structure discussion');
  assert.match(await page.locator('#tv .structure-review').innerText(),/Dramatic structure versus booked result/);
  assert.match(await page.locator('#tv .structure-review').innerText(),/Backstage agreement/);
  await page.locator('#tv [data-room="review_ok"]').click();
  await page.locator('#tv [data-room="talk_none"]').click();
  const signedStructure=await page.evaluate(()=>{
   const st=window.OfficeUI.night.plan.room,sh=st.sheet;
   return {stage:st.stage,dialogue:sh.structureDiscussion?.decision,
    structure:sh.structurePlan?.structureId,valid:window.OfficeSheets.STRUCTURES.readPlan(sh).mode,
    finish:sh.finish,booked:window.OfficeGame.S.card[0]?.finish};
  });
  assert.equal(signedStructure.stage,'done');
  assert.equal(signedStructure.dialogue,'open');
  assert.equal(signedStructure.structure,'kings_road');
  assert.equal(signedStructure.valid,'editorial');
  assert.equal(signedStructure.finish,signedStructure.booked);
  // Exercise the real UI hand-off, not property ordering in a source string.
  for(let i=0;i<20;i++){
   if(await page.locator('#tv [data-pause]').count())break;
   const action=page.locator('#tv [data-tv="bell"]:visible, #tv [data-tv="promos"]:visible, #tv [data-tv="signing"]:visible, #tv [data-mouth]:visible, #tv [data-mic]:visible, #tv [data-contract]:visible').first();
   await action.click();
  }
  const live=await page.evaluate(()=>{
   const n=window.OfficeUI.night,M=n.M,r=window.OfficeMatch.structureReport(M);
   return {active:M.o.structureExecution===true,id:r?.id,objectives:r?.objectives.length,
    lead:M.structureDirector?.roles.lead,selected:n.plan.structureChoice.lead,finish:M.o.finish};
  });
  assert.equal(live.active,true,name+': signed UI plan activates the actual match');
  assert.equal(live.id,'kings_road');
  assert.equal(live.objectives,4);
  assert.equal(live.lead,live.selected);
  assert.equal(live.finish,signedStructure.booked);
  await page.locator('#tv [data-pause]').click();
  await page.evaluate(()=>{
   const M=window.OfficeUI.night.M,E=window.OfficeMatch;
   for(let i=0;i<9000&&!M.done;i++){
    if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
    E.next(M);
   }
   if(!M.done||!M.final)throw new Error('Structured bout did not finish');
  });
  await page.locator('#tv [data-pause]').click();
  assert.equal(await page.locator('#tv .structure-result-list li').count(),4);
  const recorded=await page.evaluate(()=>window.OfficeGame.S.history.find(h=>h.cid==='browser-phase3-1')?.structure);
  assert.equal(recorded?.id,'kings_road',name+': actual UI settlement persists performed structure');
  assert.equal(recorded.objectives.length,4);
  assert.deepEqual(errors,[],name+': no uncaught browser exceptions');
  console.log('PASS browser '+name+': career, keyboard replay, no overflow, reload, unique report');
 }finally{await context.close();}
}
// Phase 4 layout audit: actual rendered career screens across laptop,
// tablet and narrow/wide desktops, complementing the two full match journeys.
// We test the outer viewport, not deliberate horizontal scrolling inside tables.
async function responsiveAudit(browser,name,viewport){
 const context=await browser.newContext({viewport});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.locator('[data-title="new"]').click();
  await page.locator('#modal [data-dlg="identity-save"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  await commentaryHeightAudit(page,name,viewport);
  const screens=['desk','inbox','squad','scouting','offers','fixtures','pyramid','promoters','rivalries','results','sheets'];
  for(const screen of screens){
   await page.evaluate(s=>window.OfficeUI.go(s),screen);
   const geom=await page.evaluate(()=>{
    const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
    const top=document.querySelector('#app .top'),view=document.querySelector('#view'),filter=document.querySelector('#view .management-filters');
    return {page:document.documentElement.scrollWidth-innerWidth,
     app:rect(document.querySelector('#app')),view:rect(view),top:rect(top),
     filter:filter?rect(filter):null,
     screen:document.querySelector('#view .screen')?.className||''};
   });
   assert.ok(geom.page<=2,name+': '+screen+' overflows document by '+geom.page+'px');
   assert.ok(geom.app.right<=viewport.width+2&&geom.top.right<=viewport.width+2,
     name+': '+screen+' top layout extends beyond viewport '+JSON.stringify(geom));
   assert.ok(geom.view.width>=200&&geom.view.right<=viewport.width+2,
     name+': '+screen+' main view clipped '+JSON.stringify(geom));
   if(geom.filter)assert.ok(geom.filter.left>=-2&&geom.filter.right<=viewport.width+2,
     name+': '+screen+' management filter overflows viewport '+JSON.stringify(geom));
   assert.ok(geom.screen.includes('screen'),name+': '+screen+' did not render a screen');
  }
  // A report should display its own contents even if a different decision
  // remains pending in the Inbox. Previously the detail pane could be blank.
  await page.evaluate(()=>{
   const G=window.OfficeGame,s=G.S;
   s.inbox.push({id:'p4-pending',kind:'decision',from:'Office secretary',season:s.season,week:s.week,
    subject:'Awaiting a decision',body:['Confirm the budget.'],read:false,
    options:[{id:'yes',label:'Agree',hint:'Proceed'}],answer:null});
   s.inbox.push({id:'p4-report',kind:'news',from:'Match night desk',season:s.season,week:s.week,
    subject:'Phase 4 audit report',body:['Results posted.'],read:false,
    sections:[{title:'Match recap',lines:['Report is readable']} ]});
   G.save();window.OfficeUI.go('inbox');
  });
  await page.locator('#view [data-inbox-filter="reports"]').click();
  await page.locator('#view button[data-msg="p4-report"]').click();
  assert.match(await page.locator('#view .letter h2').innerText(),/Phase 4 audit report/,
    name+': report filter should select a report, not an unrelated pending message');
  assert.ok(await page.locator('#view .msglist button').count()>0,
    name+': reports list should contain report');
  await page.evaluate(()=>window.OfficeUI.go('scouting'));
  // All styles in the active market must be filterable, not just four
  // historically hard-coded labels.
  const style=await page.evaluate(()=>{
    const G=window.OfficeGame;G.S.free[0].style='Strong Style';
    window.OfficeUI.go('scouting');return G.S.free[0].style;
  });
  const values=await page.locator('#view [data-scout-style] option').evaluateAll(opts=>opts.map(o=>o.value));
  assert.ok(values.includes(style),name+': active market style missing from Scouting options');
  await openScoutFilters(page);
  await page.locator('#view [data-scout-style]').selectOption(style);
  assert.match(await page.locator('#view .filter-results').first().innerText(),/^1 of /,
    name+': new market style cannot filter available wrestlers');
  if(viewport.width<=720){
   const grid=await page.evaluate(()=>{
    const p=document.querySelector('#view .management-filters'),r=p.getBoundingClientRect();
    const q=p.querySelector('label:first-child').getBoundingClientRect();
    return {toolbar:r.width,query:q.width,queryLeft:q.left,toolbarLeft:r.left};
   });
   assert.ok(grid.query>=grid.toolbar-32,
     name+': mobile search should occupy a full, readable row '+JSON.stringify(grid));
   await page.evaluate(()=>window.OfficeUI.go('inbox'));
   const tabs=await page.locator('#view .office-filter-tabs button').evaluateAll(btns=>btns.map(el=>el.getBoundingClientRect().top));
   assert.ok(tabs.length===4&&Math.abs(tabs[0]-tabs[1])<2&&tabs[2]>tabs[0]+20&&Math.abs(tabs[2]-tabs[3])<2,
    name+': mobile inbox filters should be balanced 2 by 2 '+JSON.stringify(tabs));
  }
  assert.deepEqual(errors,[],name+': script errors while auditing screens');
  console.log('PASS responsive audit '+name+': '+screens.length+' screens, inbox and scouting');
 }finally{await context.close()}
}

// Negotiation V2 Phase 1: a real booking-to-meeting journey, including
// resuming a conversation after the final weekly meeting is spent.
async function negotiationPrototypeAudit(browser,name,viewport){
 const context=await browser.newContext({viewport});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.locator('[data-title="new"]').click();
  await page.locator('#modal [data-dlg="identity-save"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  await page.evaluate(()=>{
   const G=window.OfficeGame,s=G.S;
   s.cash=99999;s.rep=65;s.focus=1;
   const err=G.sign('rex');if(err!==null)throw new Error('Unable to sign Rex: '+err);
   s.offers=[{id:'neg-phase1',pid:'dock',rid:'magnus',wid:null,slot:'opener',
    finish:'lose_clean',eventAbs:G.abs(),expiresAbs:G.abs()+1,boost:1,bump:1,haggled:false}];
   G.save();window.OfficeUI.go('offers','neg-phase1');
  });
  await page.locator('#view [data-talkopen="neg-phase1"]:visible').click();
  await page.locator('#modal.negotiation-dialog[open]').waitFor();
  assert.match(await page.locator('#modal .neg-transcript').innerText(),/That's the offer/);
  assert.equal(await page.locator('#modal .neg-contract.is-new').count(),0,
    name+': original contract must not be shown as a revision');
  assert.equal(await page.locator('#modal .neg-choices [data-talkaction="ask:protect"]').count(),1);
  let geometry=await page.evaluate(()=>{
    const R=s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    return {dialog:R('#modal'),main:R('.neg-main'),aside:R('.neg-aside'),footer:R('.neg-footer'),overflow:document.documentElement.scrollWidth-innerWidth};
  });
  assert.ok(geometry.dialog.left>=-2&&geometry.dialog.right<=viewport.width+2,
    name+': negotiation dialog out of viewport '+JSON.stringify(geometry));
  assert.ok(geometry.footer.bottom<=geometry.dialog.bottom+2,
    name+': negotiation signing actions extend below dialog '+JSON.stringify(geometry));
  assert.ok(geometry.overflow<=2,name+': negotiation creates page overflow '+JSON.stringify(geometry));
  if(viewport.width<=720)assert.ok(geometry.aside.top>=geometry.main.top,
    name+': phone should stack contract after conversation '+JSON.stringify(geometry));
  else assert.ok(geometry.aside.left>=geometry.main.right-2,
    name+': desktop contract should sit beside dialogue '+JSON.stringify(geometry));
  if(viewport.width<=720){
   assert.equal(await page.locator('#modal .neg-terms').getAttribute('open'),null,
     name+': phone contract should start collapsed');
   await page.locator('#modal .neg-terms>summary').click();
   assert.ok(await page.locator('#modal .neg-contract').isVisible(),name+': phone contract should expand');
  }
  assert.match(await page.locator('#modal .neg-meeting-note').innerText(),/No meeting used yet/);
  await page.locator('#modal button[data-talkaction="ask:protect"]').click();
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.focus),0,
    name+': requesting revised terms must use exactly one meeting');
  assert.match(await page.locator('#modal .neg-response h3').innerText(),/Why should the loss be protected/);
  await page.locator('#modal [data-dlg="close"]').click();
  await page.locator('#modal[open]').waitFor({state:'hidden'});
  // The old Offers button blocked resuming discussions after focus reached 0.
  const resume=page.locator('#view [data-talkopen="neg-phase1"]:visible');
  assert.equal(await resume.isEnabled(),true,name+': must reopen an unfinished paid meeting');
  await resume.click();
  assert.match(await page.locator('#modal .neg-response h3').innerText(),/Why should the loss be protected/);
  await page.locator('#modal button[data-talkaction="arg:crowd"]').click();
  assert.match(await page.locator('#modal .neg-response h3').innerText(),/promoter is willing|promoter has countered/i);
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.card.length),0,
    name+': negotiating must not sign a booking');
  assert.equal(await page.locator('#modal .neg-contract.is-new').count(),1,
    name+': unaccepted proposed terms must be visible and distinct');
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.offers.find(o=>o.id==='neg-phase1').finish),'lose_clean',
    name+': unaccepted proposal must not change original finish');
  await page.locator('#modal button[data-talkaction="reply:accept"]').click();
  assert.match(await page.locator('#modal .neg-verdict').innerText(),/accepted/i);
  assert.equal(await page.evaluate(()=>window.OfficeGame.S.offers.find(o=>o.id==='neg-phase1').finish),'lose_protected',
    name+': explicit acceptance must update terms before signing');
  assert.equal(await page.locator('#modal [data-revert="1"]').count(),1,
    name+': original terms must remain selectable');
  await page.locator('#modal [data-revert="1"]').click();
  await page.locator('#modal[open]').waitFor({state:'hidden'});
  const final=await page.evaluate(()=>({
    booked:window.OfficeGame.S.card.filter(c=>c.pid==='dock'&&c.wid==='rex').map(c=>c.finish),
    focus:window.OfficeGame.S.focus
  }));
  assert.deepEqual(final.booked,['lose_clean'],name+': signing original terms must revert the negotiated finish');
  assert.equal(final.focus,0,name+': signing must not spend another meeting');
  // A promoter-provided stipulation is part of the ORIGINAL offer.
  await page.evaluate(()=>{
    const G=window.OfficeGame,s=G.S;s.focus=1;
    s.offers=[{id:'neg-original-stip',pid:'pulse',rid:'ace',wid:null,slot:'mid',
      finish:'win_clean',stip:'nodq',eventAbs:G.abs()+1,expiresAbs:G.abs()+1,boost:1,bump:1}];
    G.save();window.OfficeUI.go('offers','neg-original-stip');
  });
  // The previously signed wrestler remains unavailable for this date; test
  // the original-terms comparison directly with an eligible second wrestler.
  await page.evaluate(()=>{
    const G=window.OfficeGame,s=G.S;
    const err=G.sign('nico');if(err!==null)throw new Error('Unable to sign Nico: '+err);
    window.OfficeUI.go('offers','neg-original-stip');
  });
  await page.locator('#view [data-talkopen="neg-original-stip"]:visible').click();
  assert.equal(await page.locator('#modal .neg-contract.is-new').count(),0,
    name+': originally stipulated offers are not negotiated changes');
  // Phone layouts intentionally collapse the contract disclosure on each
  // new negotiation. Open it before asserting on rendered, visible text.
  const stipTerms=page.locator('#modal .neg-terms');
  if(!(await stipTerms.evaluate(el=>el.open)))
   await stipTerms.locator('summary').click();
  assert.match(await page.locator('#modal .neg-contract').innerText(),/No disqualification/);
  await page.locator('#modal [data-dlg="close"]').click();
  assert.deepEqual(errors,[],name+': browser JS errors during a negotiation');
  console.log('PASS booking negotiation Phase 1 '+name+': conversation, terms, resume and signing');
 }finally{await context.close()}
}

// Focused visual regression: use the actual title, scouting table and first
// career toast, rather than a synthetic DOM or viewport-only overflow check.
async function laptopLayoutAudit(browser,name,viewport){
 const context=await browser.newContext({viewport,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.locator('[data-title="new"]').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  const title=await page.evaluate(()=>{
   const box=r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom});
   const h=document.querySelector('.poster-title'),range=document.createRange();
   range.selectNodeContents(h);
   return {text:box(range.getBoundingClientRect()),poster:box(document.querySelector('.poster').getBoundingClientRect()),
    ticket:box(document.querySelector('[data-title="new"]').getBoundingClientRect())};
  });
  assert.ok(title.text.left>=title.poster.left-1&&title.text.right<=title.poster.right+1,
   name+': masthead text escapes its own poster '+JSON.stringify(title));
  const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  assert.ok(!overlaps(title.text,title.ticket),name+': masthead covers the ticket '+JSON.stringify(title));
  await page.locator('[data-title="new"]').click();
  await page.locator('#modal [data-dlg="identity-save"]').click();
  await page.locator('#app').waitFor({state:'visible'});
  await page.locator('#continue').click();
  const toast=page.locator('#toast.show');
  await toast.waitFor();
  assert.match(await toast.innerText(),/sign a wrestler first/i);
  if(viewport.width>720){
   const nav=await page.locator('#nav').boundingBox(),notice=await toast.boundingBox();
   assert.ok(nav&&notice&&notice.x>=nav.x+nav.width+4,
    name+': toast obscures sidebar '+JSON.stringify({nav,notice}));
   await page.evaluate(()=>window.OfficeUI.go('scouting'));
   const geom=await page.locator('#view .free-table').evaluate(el=>{
    const r=el.getBoundingClientRect(),last=el.querySelector('thead th:last-child').getBoundingClientRect();
    const fees=[...el.querySelectorAll('tbody tr td:last-child')].map(td=>({right:td.getBoundingClientRect().right,text:td.textContent}));
    return {left:r.left,right:r.right,innerRight:r.left+el.clientLeft+el.clientWidth,
     scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,feeRight:last.right,
     feeLabel:el.querySelector('thead th:last-child').textContent,fees};
   });
   assert.match(geom.feeLabel,/Fee/);
   assert.ok(geom.fees.length>0&&geom.fees.every(f=>f.text.includes('£')&&f.right<=geom.innerRight+2),
    name+': fee cells clipped '+JSON.stringify(geom));
   assert.ok(geom.scrollWidth<=geom.clientWidth+2&&geom.feeRight<=geom.innerRight+2,
    name+': free agents require horizontal scrolling '+JSON.stringify(geom));
  }else{
   assert.equal(await page.locator('#view .free-table').isVisible(),false);
   assert.ok(await page.locator('#view .free-card .free-costs').first().isVisible(),
    name+': phone cards still display costs');
  }
  assert.deepEqual(errors,[],name+': no uncaught errors');
  console.log('PASS focused layout '+name+': poster, first signing toast, visible fee');
 }finally{await context.close()}
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await laptopLayoutAudit(browser,'laptop-1366',{width:1366,height:768});
  await laptopLayoutAudit(browser,'laptop-1024',{width:1024,height:768});
  await laptopLayoutAudit(browser,'desktop-wide',{width:1920,height:1080});
  await laptopLayoutAudit(browser,'phone',{width:390,height:844});
  if(process.env.OFFICE_LAYOUT_ONLY==='1')return;
  await journey(browser,'desktop',{width:1280,height:720});
  await journey(browser,'phone',{width:390,height:844});
  await responsiveAudit(browser,'laptop',{width:1024,height:768});
  await responsiveAudit(browser,'tablet',{width:768,height:820});
  await responsiveAudit(browser,'small-phone',{width:360,height:740});
  await responsiveAudit(browser,'desktop-wide',{width:1440,height:900});
  await negotiationPrototypeAudit(browser,'booking-desktop',{width:1280,height:720});
  await negotiationPrototypeAudit(browser,'booking-phone',{width:390,height:844});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
