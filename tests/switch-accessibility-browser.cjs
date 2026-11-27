'use strict';
// Real production UI and scan controller. No injected game actions.
// Clock acceleration makes switch journeys practical in the focused CI job.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const URL='http://127.0.0.1:8765/switch/';
const utility=new Set(['back','cancel','pause','__pause','__repeat_information','repeat','history','more','next','custom','desk','office','details','replay','status','previous','exit','learn','settings','mode','angle','ringfax']);
async function journey(browser,{name,viewport,auto,tts}){
 const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],trace=[];
 const counts={select:0,space:0,autoTicks:0,scenes:{},speechPause:0};
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',route=>route.abort());
 await page.route('https://fonts.gstatic.com/**',route=>route.abort());
 await page.addInitScript(({auto,tts})=>{
  if(sessionStorage.getItem('switch-audit'))return;
  sessionStorage.setItem('switch-audit','1');
  // One-switch launch has no stored scan mode; two-switch uses a saved mode.
  if(!auto)localStorage.setItem('narbe-scan-settings',JSON.stringify({autoScan:false}));
  localStorage.setItem('narbe-voice-settings',JSON.stringify({ttsEnabled:tts}));
  localStorage.setItem('narbe-hub-settings',JSON.stringify({highlightColor:'blue',highlightStyle:'outline',textColor:'black',bgTheme:'cream',uiSize:'largest'}));
  let seed=auto?1627:8219;
  Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Native speech lifecycle substitute, not a claim about acoustic output.
  let timer=null,utterance=null;
  const mock={speaking:false,getVoices:()=>[{name:'Test English female',lang:'en-GB'},{name:'Test English male',lang:'en-GB'}],addEventListener(){},removeEventListener(){},
   cancel(){clearTimeout(timer);timer=null;utterance=null;this.speaking=false;},
   speak(u){this.cancel();utterance=u;this.speaking=true;u.onstart?.();timer=setTimeout(()=>{if(utterance!==u)return;utterance=null;this.speaking=false;u.onend?.();},220);}
  };
  Object.defineProperty(window,'speechSynthesis',{value:mock,configurable:true});
 },{auto,tts});
 await page.clock.install();
 const snapshot=()=>page.evaluate(()=>{
  const G=window.OfficeGame,S=G.S;
  return {title:document.querySelector('#heading').textContent,body:document.querySelector('#story').textContent,
   stage:document.body.dataset.stage,selected:document.querySelector('#choices .scan')?.dataset.choice||null,
   listening:document.querySelector('#scanPosition').textContent==='Listening…',
   choices:[...document.querySelectorAll('#choices button')].map(x=>({id:x.dataset.choice,label:x.innerText})),
   week:S?.week||0,season:S?.season||0,cash:S?.cash||0,booked:S?.card.length||0,roster:S?.roster.length||0,
   pending:S?G.pending().length:0,history:S?.history.length||0};
 });
 async function tick(ms){await page.clock.runFor(ms);}
 async function press(key){await page.keyboard.press(key);await tick(80);}
 async function pick(id){
  let st=await snapshot();
  assert.ok(st.choices.some(x=>x.id===id),name+': missing '+id+' at '+st.title);
  for(let n=0;n<24&&st.selected!==id;n++){
   assert.ok(!st.listening,name+': attempted to select during narration');
   if(auto){await tick(2050);counts.autoTicks++;}
   else {await press('Space');counts.space++;}
   st=await snapshot();
  }
  assert.equal(st.selected,id,name+': unable to scan to '+id+' at '+st.title);
  counts.select++;counts.scenes[st.stage]=(counts.scenes[st.stage]||0)+1;
  trace.push(st.title+' → '+id);
  await press('Enter');
 }
 async function waitStationary(){
  for(let n=0;n<300;n++){
   const st=await snapshot();
   if(st.title==='Live broadcast'&&tts&&!counts.speechPause){
    counts.speechPause++;
    await press('Enter');
    for(let j=0;j<20;j++){await tick(100);if((await snapshot()).title==='Pause')break;}
    assert.equal((await snapshot()).title,'Pause',name+': Enter pauses live broadcast');
   }
   const now=await snapshot();
   if(!now.listening&&!/^Preparing the|^Backstage$/.test(now.title)&&now.title!=='Live broadcast')return now;
   await tick(350);
  }
  throw Error(name+': stationary screen timeout '+JSON.stringify(await snapshot()));
 }
 async function geometry(){
  const issues=await page.evaluate(()=>{
   const bad=[],w=document.documentElement.clientWidth;
   if(document.documentElement.scrollWidth>w+2)bad.push('document horizontal overflow');
   for(const b of document.querySelectorAll('#choices button')){
    const r=b.getBoundingClientRect();
    if(r.height<63||r.left<0||r.right>w+2||b.scrollWidth>b.clientWidth+2)bad.push(b.dataset.choice+' clipped or undersized');
   }
   return bad;
  });
  assert.deepEqual(issues,[],name+': '+(await snapshot()).title);
 }
 try{
  await page.goto(URL,{waitUntil:'load'});await waitStationary();
  assert.equal(await page.evaluate(()=>NarbeScanManager.getSettings().autoScan),auto);
  assert.equal(await page.locator('body').getAttribute('data-ui-size'),'largest');
  await geometry();
  await pick('new');await waitStationary();await pick('skip');await waitStationary();await pick('relaxed');
  let previous='',repeated=0,layouts=new Set(),bookedEver=false,startedWeek=1;
  for(let i=0;i<420;i++){
   const st=await waitStationary();
   if(!layouts.has(st.stage)){await geometry();layouts.add(st.stage);}
   if(st.week>startedWeek||st.season>1){
    assert.ok(st.history>0,name+': week advanced without a match');assert.ok(bookedEver);
    assert.equal(errors.length,0,name+': '+errors.join('; '));
    assert.ok(await page.evaluate(()=>!!localStorage.getItem('the-office-switch-v22')&&!localStorage.getItem('the-office-v22')));
    console.log('S8H RESULT '+JSON.stringify({name,viewport,auto,tts,...counts,stages:[...layouts],week:st.week,history:st.history,bank:st.cash,errors}));
    return;
   }
   bookedEver ||= st.booked>0;
   const signature=st.title+'|'+st.choices.map(x=>x.id).join(',')+'|'+st.body;
   repeated=signature===previous?repeated+1:0;previous=signature;
   assert.ok(repeated<4,name+': stuck '+JSON.stringify(st));
   const has=id=>st.choices.some(x=>x.id===id),first=()=>st.choices.find(x=>!utility.has(x.id))?.id;
   let id;
   if(st.title==='Pause')id='continue';
   else if(st.title==='Dennis: booking opportunity')id=st.booked||st.body.includes('Future booking;')?'skip':has('accept')?'accept':'review';
   else if(st.title==='Dennis: grow your stable')id='skip';
   else if(st.title==='Dennis: build your stable')id=first();
   else if(st.title==='At ringside')id=has('broadcast')?'broadcast':'burst';
   else if(st.title==='The final bell')id='result';
   else if(st.title==='Dennis: ready for match night')id='continue';
   else if(st.title==='Dennis: the week is ready')throw Error(name+': no current-week booking available');
   else if(st.title.startsWith('Week ')&&has('continue'))id='continue';
   else if(st.stage==='after'&&has('next')&&st.choices.some(x=>x.id==='next'&&/Prepare next match|Finish the week/.test(x.label)))id='next';
   else if(st.title==='Dennis: what is the message?')id=has('tape')?'tape':'crowd';
   else if(has('confirm'))id='confirm';
   else if(has('sign'))id='sign';
   else if(has('recommended'))id='recommended';
   else if(has('approve'))id='approve';
   else if(has('agree'))id='agree';
   else if(has('ring'))id='ring';
   else if(has('keep'))id='keep';
   else if(has('broadcast'))id='broadcast';
   else if(has('none'))id='none';
   else if(has('continue'))id='continue';
   else id=first();
   assert.ok(id,name+': no safe journey action '+JSON.stringify(st));
   await pick(id);
  }
  throw Error(name+': journey exceeded 420 selections');
 }catch(error){console.error('S8H FAILED '+name+' '+JSON.stringify({counts,trace:trace.slice(-30),errors,screen:await snapshot().catch(()=>null)}));throw error;}
 finally{await context.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await journey(browser,{name:'one-switch text mobile',viewport:{width:375,height:812},auto:true,tts:false});
  await journey(browser,{name:'two-switch speech desktop',viewport:{width:1440,height:900},auto:false,tts:true});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
