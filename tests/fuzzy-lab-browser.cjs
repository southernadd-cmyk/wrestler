'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:375,height:812}]]){
   const context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/tools/fuzzy-lab/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Production kernel'));
   assert.equal(await page.locator('#w option').count(),200);
   assert.ok(await page.locator('#rules tbody tr').count()>0);
   await page.locator('#axis').selectOption('fatigue');
   await page.locator('#low').fill('5');await page.locator('#middle').fill('15');await page.locator('#high').fill('25');await page.locator('#apply').click();
   assert.match(await page.locator('#status').innerText(),/Production kernel/);
   const dl=page.waitForEvent('download');await page.locator('#export').click();const config=JSON.parse(fs.readFileSync(await(await dl).path(),'utf8'));assert.deepEqual(config.config.curves.fatigue,[5,15,25]);
   await page.locator('#reset').click();
   await page.locator('#model').selectOption('sequence');assert.ok(await page.locator('#outputs .metric').count()>0);
   await page.locator('#model').selectOption('behaviour');
   const rookie=await page.locator('#w option').evaluateAll(xs=>xs.find(x=>x.value.startsWith('academy-')).value);
   await page.locator('#w').selectOption(rookie);assert.match(await page.locator('#status').innerText(),/Production kernel/);
   await page.locator('#distribution').click();await page.waitForFunction(()=>document.querySelector('#histogram').textContent.includes('120 academy previews'),null,{timeout:90000});
   if(name==='desktop'){
    const d=page.waitForEvent('download');await page.locator('#exportDistribution').click();const q=JSON.parse(fs.readFileSync(await(await d).path(),'utf8'));assert.equal(q.count,200);assert.equal(q.groups.academy.count,120);
    await page.locator('#w').selectOption('rex');await page.locator('#f').selectOption('silas');
    await page.locator('#replay').click();assert.match(await page.locator('#tape').innerText(),/Signed:/);
    const text=await page.locator('#tape p').first().innerText();await page.locator('#choices').fill(text.replace('Replay choice IDs: ',''));await page.locator('#replay').click();assert.match(await page.locator('#tape').innerText(),/Signed:/);
   }
   assert.equal(await page.evaluate(()=>window.OfficeGame.S),null,'Lab never starts a career');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=3,name+': no horizontal page overflow');
   assert.deepEqual(errors,[]);await context.close();console.log('PASS fuzzy lab '+name);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
