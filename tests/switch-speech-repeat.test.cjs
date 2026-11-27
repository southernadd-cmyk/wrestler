'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'../switch',name),'utf8');
class Element{
 constructor(){this.children=[];this.dataset={};this.style={};this.classList={toggle(){}};this.textContent='';}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 querySelector(selector){
  const classes=selector.split('.').filter(Boolean);
  for(const child of this.children){
   if(classes.every(name=>String(child.className||'').split(/\s+/).includes(name)))return child;
   const nested=child.querySelector(selector);if(nested)return nested;
  }
  return null;
 }
 setAttribute(){} removeAttribute(){} scrollIntoView(){} addEventListener(){}
}
function harness(ttsEnabled=true,hub=false,initialStorage={}){
 const elements=new Map(),events=new Map(),windowEvents=new Map(),spoken=[];
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const listen=(map,k,fn)=>{if(!map.has(k))map.set(k,[]);map.get(k).push(fn);};
 const document={body:new Element(),getElementById:get,createElement:()=>new Element(),addEventListener:(k,fn)=>listen(events,k,fn)};
 let selected=null,suspended=false,items=[],scanOptions,active=null,opens=0,voiceCallbacks=[],helpHold=null,hubRequests=[],nextCalls=0,announcements=[];
 const scan={open(next,{restoreId=null}={}){opens++;items=next;selected=restoreId;},setItems(next){items=next;},getState(){return {parked:false,id:selected,suspended};},setSuspended(v){suspended=v;},setInputHeld(){},brakePress(){return false;},step(){},select(){if(!suspended&&selected)scanOptions.onSelect(items.find(x=>x.id===selected));},announceCurrent(text){announcements.push(text===undefined?selected:text);},holdForSpeech(ticket){helpHold=ticket;},dispose(){}};
 const settings={ttsEnabled,rate:1,pitch:1};
 const V={
  getSettings:()=>({...settings}),getEnglishVoices:()=>[],getCurrentVoice:()=>null,getVoiceDisplayName:()=> 'Default',cycleVoice(){},
  onSettingsChange:fn=>voiceCallbacks.push(fn),toggleTTS(){settings.ttsEnabled=!settings.ttsEnabled; if(!settings.ttsEnabled)this.cancel();voiceCallbacks.forEach(fn=>fn());},
  cancel(){active?.cancel();},
  speak(text,options){this.cancel();let finish,done=false;const finished=new Promise(r=>finish=r);
   const ticket={text,options,started:Promise.resolve(true),finished,settle(reason){if(done)return;done=true;if(active===ticket)active=null;finish({reason,started:true});},cancel(){this.settle('cancelled');}};
   spoken.push(ticket);active=ticket;return ticket;
  }
 };
 let autoScan=true;
 const M={getSettings:()=>({autoScan}),getScanInterval:()=>2000,isParkingEnabled:()=>false,subscribe(){},resetInputState(){},setAutoScan(v){autoScan=v;},cycleScanSpeed(){},createChoiceScan(o){scanOptions=o;return scan;}};
 let saveCalls=0,saveOK=true,watchCalls=0,signCalls=0,settlements=0;
 const window={OfficeGame:{S:null,hasSave:()=>false,saveStatus:()=>({ok:saveOK}),save(){saveCalls++;},scoutWatch(w){if(!w.watched){w.watched=true;watchCalls++;}},scoutBand(w,key){return key==='heat'?{lo:55,hi:55,exact:true}:{lo:40,hi:49,exact:false};},signingForecast(id){return {affordable:true,afterFee:1500,weeklyCost:600,afterWeek:900,runway:2,risk:'limited'};},sign(){signCalls++;},money:x=>'£'+x,abs:()=>1,P:()=>({name:'Test promotion'})},OfficeData:{SLOTS:{},FINISHES:{},DIVISIONS:{open:{name:'Open'}},divisionOf:()=> 'open'},OfficeMatch:{fmt:t=>String(t),CALLS:{},canCall:()=>false,next(m){nextCalls++;if(m.testLines){const line=m.testLines.shift();if(!line){m.done=true;return null;}m.t=line.at;if(line.decision)m.decision={title:'Mandatory decision',body:'Choose the response.',options:[{id:'answer',label:'Answer',hint:'Required'}]};return line;}m.t++;if(m.testTerminal)m.done=true;if(m.testDecision)m.decision={title:'Mandatory decision',body:'Choose the response.',options:[{id:'answer',label:'Answer',hint:'Required'}]};return {who:'pbp',text:'The wrestlers lock up.'};}},NarbeScanManager:M,NarbeVoiceManager:V,NarbePlatform:{settings:{hasHubParent:()=>false}},addEventListener:(k,fn)=>listen(windowEvents,k,fn)};
 window.parent=hub?{location:{origin:'https://example.test'},NarbeCommunicationSpeech:{help(fallback,message){hubRequests.push(message);return V.speak(message,{force:true,hub:true});}}}:window;
 window.location={origin:'https://example.test'};
 const storage=new Map(Object.entries(initialStorage));
 const context=vm.createContext({window,document,localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){storage.set(key,value);}},console,setTimeout,clearTimeout});
 vm.runInContext(read('booth-speech.js'),context);
 vm.runInContext(read('choice-input.js'),context);
 window.OfficeChoiceInput=context.OfficeChoiceInput;
 // Test-only entry to the real broadcast controller and a settlement spy; no production hooks.
 window.testSettlement=()=>{settlements++;};
 const app=read('app.js').replace(/mainMenu\(\);\n\}\)\(\);\s*$/,"window.startTestBroadcast=match=>{active={cid:'c',M:match};if(V.getSettings().ttsEnabled)startBroadcast();else matchScreen();};window.testDennis=()=>screen('Dennis: ready','Dennis: We can start.\\nDennis: Keep the plan. Dennis is your assistant.',[back(mainMenu)]);window.testScout=w=>signProfile(w,mainMenu);window.testPaged=()=>paged('Test list',Array.from({length:7},(_,i)=>({id:'row'+i,name:'Row '+i})),0,(x,ret)=>screen(x.name,'Details',[back(ret)]),()=>mainMenu());settleMatch=()=>{window.testSettlement();screen('Match report','Result available',[back(mainMenu)]);};mainMenu();\n})();");
 vm.runInContext(app,context);
 return {get,spoken,V,scan,announcements,testDennis:()=>window.testDennis(),visual:document.body.dataset,storage,changeStorage(key,value){storage.set(key,value);for(const fn of windowEvents.get('storage')||[])fn({key});},setSaveOK:v=>{saveOK=v;},scout:()=>{const w={id:'test',name:'Test wrestler',style:'Technical',fee:750,wage:100};window.OfficeGame.S={season:1,week:1,cash:2250,rep:3,free:[w],roster:[]};window.testScout(w);},watchCalls:()=>watchCalls,signCalls:()=>signCalls,testPaged:()=>window.testPaged(),helpHold:()=>helpHold,hubRequests,nextCalls:()=>nextCalls,settlements:()=>settlements,broadcast:(flags={})=>{window.OfficeGame.S={season:1,week:1,cash:2250,rep:0,card:[{id:'c',pid:'p'}]};window.startTestBroadcast({w:{id:'w',name:'W',short:'W'},f:{id:'f',name:'F',short:'F'},wSt:90,fSt:90,t:0,crowd:50,calls:2,mom:0,queue:[],r:{getState:()=>1},...flags});},select:id=>{selected=id;scan.select();},key:(type,code)=>{for(const fn of events.get(type)||[])fn({type,code,repeat:false,preventDefault(){},target:{matches:()=>false}});},click:id=>get('choices').children.find(x=>x.dataset.choice===id).onclick(),blur:()=>{for(const fn of windowEvents.get('blur')||[])fn();},opens:()=>opens,saves:()=>saveCalls};
}
const tick=()=>new Promise(setImmediate);
(async()=>{
 const h=harness();
 const repeat='__repeat_information';
 assert.equal(h.get('heading').textContent,'Main menu');
 assert.equal(h.scan.getState().suspended,true,'screen narration owns the scan');
 assert.ok(h.get('choices').children.some(x=>x.dataset.choice===repeat));
 const first=h.spoken.at(-1);
 assert.ok(first.options.completeUtterance,'screen uses complete speech tickets');
 first.settle('end');await tick();
 assert.ok(h.spoken.length>1,'long screen description continues through chunks');
 assert.equal(h.scan.getState().suspended,true);
 h.key('keydown','Enter');
 assert.equal(h.scan.getState().suspended,true,'interrupt only on release');
 h.key('keyup','Enter');await tick();
 assert.equal(h.scan.getState().suspended,false);
 assert.equal(h.get('heading').textContent,'Main menu','interrupt never selects a game action');
 const before=h.opens(),saves=h.saves();
 h.select(repeat);
 assert.equal(h.scan.getState().suspended,true);
 assert.equal(h.opens(),before,'repeat never reopens a menu');
 assert.equal(h.saves(),saves);
 assert.ok(h.spoken.at(-1).text.includes('Main menu'));
 h.click('help');await tick();
 assert.equal(h.get('heading').textContent,'How to play','pointer may deliberately choose during narration');
 assert.equal(h.scan.getState().suspended,true,'old cancellation must not unlock the new narration');
 h.spoken.at(-1).settle('error');await tick();
 assert.equal(h.scan.getState().suspended,false,'speech failure restores control');
 assert.match(h.get('saveNotice').textContent,/Speech could not finish/);
 h.select(repeat);assert.equal(h.scan.getState().suspended,true);
 h.key('keydown','Space');h.key('keyup','Space');await tick();
 assert.equal(h.scan.getState().suspended,false);
 assert.equal(h.get('heading').textContent,'How to play');
 h.select(repeat);h.blur();await tick();
 assert.equal(h.scan.getState().suspended,false,'blur cancels narration');
 const silent=harness(false);
 assert.equal(silent.spoken.length,0);
 assert.equal(silent.scan.getState().suspended,false);
 assert.ok(!silent.get('choices').children.some(x=>x.dataset.choice===repeat),'no redundant speech-only scan stop with TTS off');
 assert.ok(silent.get('choices').children.some(x=>x.dataset.choice==='__pause'));
 silent.select('__pause');assert.equal(silent.get('heading').textContent,'Pause');
 assert.equal(silent.get('choices').children[1].dataset.choice,'help','help is near the start of Pause');
 silent.select('help');assert.equal(silent.spoken.at(-1).text,'I need help, please! I need help, please!');
 assert.equal(silent.spoken.at(-1).options.force,true);assert.equal(silent.helpHold(),silent.spoken.at(-1));
 silent.spoken.at(-1).settle('end');await tick();assert.match(silent.get('saveNotice').textContent,/Help message spoken/);
 silent.select('continue');assert.equal(silent.get('heading').textContent,'Main menu');assert.equal(silent.scan.getState().id,'__pause');
 assert.equal(silent.saves(),0);
 const hubGame=harness(false,true);hubGame.select('__pause');hubGame.select('help');assert.equal(hubGame.hubRequests.length,1);assert.ok(hubGame.spoken.at(-1).options.hub);hubGame.spoken.at(-1).settle('ended');await tick();
 const live=harness();live.broadcast();assert.equal(live.get('heading').textContent,'Live broadcast');assert.equal(live.nextCalls(),1);
 live.key('keydown','Enter');assert.equal(live.get('heading').textContent,'Live broadcast');
 live.key('keyup','Enter');await tick();assert.equal(live.get('heading').textContent,'Pause');assert.equal(live.nextCalls(),1,'pause never simulates another line');
 live.click('continue');await tick();assert.equal(live.get('heading').textContent,'At ringside');assert.equal(live.nextCalls(),1,'resume returns to the ringside choices without advancing');
 const nav=harness(false);
 nav.select('help');nav.select('controls');assert.equal(nav.get('heading').textContent,'Switch controls');
 nav.select('back');assert.equal(nav.get('heading').textContent,'How to play');assert.equal(nav.scan.getState().id,'controls');
 nav.select('basics');nav.select('next');nav.select('people');nav.select('back');
 assert.equal(nav.get('heading').textContent,'Wrestling basics');assert.equal(nav.scan.getState().id,'people','topic on second page restored');
 nav.select('back');assert.equal(nav.scan.getState().id,'basics');
 nav.select('back');assert.equal(nav.get('heading').textContent,'Main menu');assert.equal(nav.scan.getState().id,'help');
 nav.select('settings');nav.select('auto');assert.equal(nav.get('heading').textContent,'Use two switches?');
 nav.select('cancel');assert.equal(nav.get('heading').textContent,'Settings');assert.equal(nav.scan.getState().id,'auto');
 nav.select('back');assert.equal(nav.scan.getState().id,'settings');
 nav.testPaged();nav.select('next');nav.select('row4');nav.select('back');
 assert.equal(nav.get('heading').textContent,'Test list');assert.equal(nav.scan.getState().id,'row4','page and row identity preserved');
 const spokenNav=harness();spokenNav.click('help');spokenNav.click('controls');spokenNav.click('back');
 assert.equal(spokenNav.get('heading').textContent,'How to play');assert.equal(spokenNav.scan.getState().id,'controls');
 spokenNav.key('keydown','Enter');spokenNav.key('keyup','Enter');await tick();assert.equal(spokenNav.announcements.at(-1),'controls','restored choice spoken after narration is dismissed');
 const scout=harness();
 scout.setSaveOK(false);scout.scout();
 assert.equal(scout.get('heading').textContent,'Test wrestler');
 assert.match(scout.spoken.at(-1).text,/Career could not be saved/,'save warning precedes screen description');
 const drain=async h=>{for(let i=0;h.scan.getState().suspended&&i<100;i++){h.spoken.at(-1).settle('end');await tick();}assert.equal(h.scan.getState().suspended,false);};
 await drain(scout);
 const spoken=scout.spoken.map(x=>x.text).join(' ');
 assert.match(spoken,/Ring skill: 40 to 49 out of 99, estimated/);
 assert.match(spoken,/Draw \(fan appeal\): 55 out of 99, known/);
 assert.match(spoken,/Estimated balance after one week without income £900/);
 const count=scout.spoken.length;
 scout.select(repeat);await drain(scout);
 const again=scout.spoken.slice(count).map(x=>x.text).join(' ');
 assert.match(again,/Season 1.*Week 1.*£2250.*Reputation 3/);
 assert.match(again,/Career could not be saved/);
 assert.equal(scout.watchCalls(),1,'repeat does not scout again');assert.equal(scout.signCalls(),0);
 const terminal=harness();terminal.broadcast({testTerminal:true});
 terminal.spoken.at(-1).settle('end');await tick();
 assert.equal(terminal.get('heading').textContent,'Match report');assert.equal(terminal.settlements(),1);assert.equal(terminal.nextCalls(),1);
 const stopped=harness();stopped.broadcast({testTerminal:true});
 stopped.spoken.at(-1).settle('error');await tick();
 assert.equal(stopped.get('heading').textContent,'The final bell');assert.equal(stopped.settlements(),0);
 const paused=harness();paused.broadcast({testTerminal:true});
 paused.key('keydown','Enter');paused.key('keyup','Enter');await tick();
 assert.equal(paused.get('heading').textContent,'Pause');assert.equal(paused.settlements(),0);
 paused.click('continue');await tick();assert.equal(paused.get('heading').textContent,'The final bell');
 const mandatory=harness();mandatory.broadcast({testDecision:true});
 mandatory.spoken.at(-1).settle('end');await tick();assert.equal(mandatory.get('heading').textContent,'Mandatory decision');assert.equal(mandatory.settlements(),0);assert.equal(mandatory.nextCalls(),1);
 const textOnly=harness(false);textOnly.broadcast();
 assert.equal(textOnly.get('choices').children[0].dataset.choice,'burst');
 assert.equal(textOnly.get('choices').children[1].dataset.choice,'line');
 const prefs='narbe-hub-settings',local='the-office-switch-appearance-v1';
 const plain=harness(false);assert.equal(plain.visual.highlightColor,'default');assert.equal(plain.visual.highlightStyle,'full');
 const inherited=harness(false,true,{[prefs]:JSON.stringify({highlightColor:'blue',highlightStyle:'outline',textColor:'black',bgTheme:'sky',uiSize:'largest'})});
 assert.equal(inherited.visual.highlightColor,'blue');assert.equal(inherited.visual.highlightStyle,'outline');assert.equal(inherited.visual.textColor,'black');assert.equal(inherited.visual.bgTheme,'sky');assert.equal(inherited.visual.uiSize,'largest');
 inherited.select('settings');inherited.select('appearance');assert.equal(inherited.get('heading').textContent,'Appearance');
 inherited.select('highlightColor');assert.equal(inherited.visual.highlightColor,'default');assert.equal(inherited.scan.getState().id,'highlightColor');
 inherited.select('highlightColor');assert.equal(inherited.visual.highlightColor,'blue');inherited.select('highlightColor');assert.equal(inherited.visual.highlightColor,'green');
 assert.equal(JSON.parse(inherited.storage.get(prefs)).highlightColor,'blue','local override never writes Hub settings');
 inherited.changeStorage(prefs,JSON.stringify({highlightColor:'purple',highlightStyle:'full',uiSize:'larger',textColor:'invalid',bgTheme:'cream'}));
 assert.equal(inherited.visual.highlightColor,'green');assert.equal(inherited.visual.highlightStyle,'full');assert.equal(inherited.visual.uiSize,'larger');assert.equal(inherited.visual.textColor,'default');assert.equal(inherited.scan.getState().id,'highlightColor');
 inherited.select('back');assert.equal(inherited.get('heading').textContent,'Settings');assert.equal(inherited.scan.getState().id,'appearance');
 const reloaded=harness(false,false,{[prefs]:inherited.storage.get(prefs),[local]:inherited.storage.get(local)});assert.equal(reloaded.visual.highlightColor,'green');
 const bad=harness(false,false,{[prefs]:'not JSON',[local]:'null'});assert.equal(bad.visual.uiSize,'default');
 const dennis=harness();dennis.testDennis();const startDennis=dennis.spoken.length-1;await drain(dennis);
 const dialogue=dennis.spoken.slice(startDennis).map(x=>x.text).join(' ');
 assert.equal(dennis.get('heading').textContent,'Dennis: ready','visual speaker label stays visible');
 assert.match(dialogue,/ready\. We can start\. Keep the plan\. Dennis is your assistant\./);
 assert.ok(!dialogue.includes('Dennis:'));
 const againDennis=dennis.spoken.length;dennis.select(repeat);await drain(dennis);
 assert.ok(dennis.spoken.slice(againDennis).map(x=>x.text).join(' ').includes('Keep the plan. Dennis is your assistant.'));
 assert.ok(!dennis.spoken.slice(againDennis).some(x=>x.text.includes('Dennis:')));
 const lengthKey='the-office-switch-broadcast-length';
 const pref=harness(false);pref.select('settings');
 const lengthLabel=()=>pref.get('choices').children.find(x=>x.dataset.choice==='broadcast-length').children[0].textContent;
 assert.match(lengthLabel(),/Condensed/);
 pref.select('broadcast-length');assert.match(lengthLabel(),/Highlights/);
 pref.select('broadcast-length');assert.match(lengthLabel(),/Full/);
 assert.equal(pref.storage.get(lengthKey),'full');
 const savedLength=harness(false,false,{[lengthKey]:'full'});savedLength.select('settings');
 assert.match(savedLength.get('choices').children.find(x=>x.dataset.choice==='broadcast-length').children[0].textContent,/Full/);
 const events=()=>[
  {at:0,t:'00:00',kind:'play',who:'pbp',text:'The opening exchange.'},
  {at:10,t:'00:10',kind:'play',who:'pbp',text:'Routine hold.'},
  {at:20,t:'00:20',kind:'play',who:'pbp',text:'Another routine exchange.'},
  {at:22,t:'00:22',kind:'agent',who:'runner',text:'The agreed move has landed.'},
  {at:24,t:'00:24',kind:'play',who:'pbp',text:'A required choice now follows.',decision:true}
 ];
 for(const [mode,calls] of [['condensed',4],['highlights',4],['full',2]]){
  const h=harness(true,false,{[lengthKey]:mode});h.broadcast({testLines:events()});
  assert.equal(h.nextCalls(),1);h.spoken.at(-1).settle('end');await tick();
  assert.equal(h.nextCalls(),calls,mode+' consumes the real stream until the next retained line');
  assert.match(h.spoken.at(-1).text,mode==='full'?/Routine hold/:/agreed move/);
  if(mode!=='full'){h.spoken.at(-1).settle('end');await tick();assert.equal(h.nextCalls(),5);h.spoken.at(-1).settle('end');await tick();assert.equal(h.get('heading').textContent,'Mandatory decision');assert.equal(h.nextCalls(),5);}
 }
 // Measure commentary words on actual seeded matches without adding another
 // suite or changing the match engine. Estimates exclude choice/scene speech.
 const root={addEventListener(){}},storage=new Map();
 vm.runInNewContext(require('./_source.cjs').core,{window:root,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},console,Date,Math,JSON});
 const D=root.OfficeData,X=root.OfficeMatch,filter={};
 vm.runInNewContext(read('booth-speech.js'),{window:filter});
 const words=t=>String(t).trim().split(/\s+/).filter(Boolean).length;
 const totals={full:0,condensed:0,highlights:0};
 for(let i=0;i<8;i++){
  const slot=['opener','mid','feature','main'][i%4];
  const m=X.create({w:{...D.TALENT[i],flags:{},fatigue:10},f:D.FOES[i],p:D.PROMOS[i%D.PROMOS.length],slot,minutes:D.SLOTS[slot].mins,finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],plan:{game:['story','technical','brawl','spots'][i%4],leash:'script',talk:'calm'},preparation:{},flags:{},seed:4200+i*73});
  const modes=['full','condensed','highlights'],cursors=Object.fromEntries(modes.map(k=>[k,{}])),count={full:0,condensed:0,highlights:0};
  for(let j=0;j<5000;j++){
   if(m.decision&&!m.queue.length){X.resolve(m,(m.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||m.decision.options[0]).id);}
   const line=X.next(m);
   if(!line){if(m.done)break;continue;}
   const before=m.r.getState();
   for(const mode of modes){const keep=filter.OfficeBoothSpeech.keepLine(mode,line,m,cursors[mode]);if(keep)count[mode]+=words(line.text);if(['bell','rating','agent','alert','injury','bad','count'].includes(line.kind)||line.big||m.stage==='over')assert.ok(keep,mode+' retains '+line.kind);}
   assert.equal(m.r.getState(),before,'presentation never draws randomness');
  }
  assert.ok(m.done&&m.final,'seeded match completed');assert.ok(count.highlights<=count.condensed&&count.condensed<=count.full);
  for(const mode of modes)totals[mode]+=count[mode];
  console.log('BROADCAST SAMPLE '+JSON.stringify({slot,words:count,minutesAt150Wpm:Object.fromEntries(modes.map(k=>[k,Math.round(count[k]/150*10)/10]))}));
 }
 assert.ok(totals.condensed<totals.full&&totals.highlights<totals.condensed,'both modes reduce aggregate speech');
 console.log('BROADCAST TOTAL '+JSON.stringify(totals));
 console.log('Switch speech, navigation, appearance and broadcast length passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
