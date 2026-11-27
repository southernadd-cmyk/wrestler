'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'../switch',name),'utf8');
class Element{
 constructor(){this.children=[];this.dataset={};this.style={};this.classList={toggle(){}};this.textContent='';}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 setAttribute(){} removeAttribute(){} scrollIntoView(){} addEventListener(){}
}
function harness(ttsEnabled=true,hub=false){
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
 let saveCalls=0;
 const window={OfficeGame:{S:null,hasSave:()=>false,saveStatus:()=>({ok:true}),save(){saveCalls++;},money:x=>'£'+x,abs:()=>1,P:()=>({name:'Test promotion'})},OfficeData:{SLOTS:{},FINISHES:{}},OfficeMatch:{fmt:t=>String(t),CALLS:{},canCall:()=>false,next(m){nextCalls++;m.t++;return {who:'pbp',text:'The wrestlers lock up.'};}},NarbeScanManager:M,NarbeVoiceManager:V,NarbePlatform:{settings:{hasHubParent:()=>false}},addEventListener:(k,fn)=>listen(windowEvents,k,fn)};
 window.parent=hub?{location:{origin:'https://example.test'},NarbeCommunicationSpeech:{help(fallback,message){hubRequests.push(message);return V.speak(message,{force:true,hub:true});}}}:window;
 window.location={origin:'https://example.test'};
 const context=vm.createContext({window,document,localStorage:{getItem:()=>null,setItem(){}},console,setTimeout,clearTimeout});
 vm.runInContext(read('booth-speech.js'),context);
 vm.runInContext(read('choice-input.js'),context);
 window.OfficeChoiceInput=context.OfficeChoiceInput;
 // Test-only entry to the real broadcast controller; no production hooks.
 const app=read('app.js').replace(/mainMenu\(\);\n\}\)\(\);\s*$/,"window.startTestBroadcast=match=>{active={cid:'c',M:match};startBroadcast();};window.testPaged=()=>paged('Test list',Array.from({length:7},(_,i)=>({id:'row'+i,name:'Row '+i})),0,(x,ret)=>screen(x.name,'Details',[back(ret)]),()=>mainMenu());mainMenu();\n})();");
 vm.runInContext(app,context);
 return {get,spoken,V,scan,announcements,testPaged:()=>window.testPaged(),helpHold:()=>helpHold,hubRequests,nextCalls:()=>nextCalls,broadcast:()=>{window.OfficeGame.S={season:1,week:1,cash:2250,rep:0,card:[{id:'c',pid:'p'}]};window.startTestBroadcast({w:{id:'w',name:'W',short:'W'},f:{id:'f',name:'F',short:'F'},wSt:90,fSt:90,t:0,crowd:50,calls:2,mom:0,queue:[],r:{getState:()=>1}});},select:id=>{selected=id;scan.select();},key:(type,code)=>{for(const fn of events.get(type)||[])fn({type,code,repeat:false,preventDefault(){},target:{matches:()=>false}});},click:id=>get('choices').children.find(x=>x.dataset.choice===id).onclick(),blur:()=>{for(const fn of windowEvents.get('blur')||[])fn();},opens:()=>opens,saves:()=>saveCalls};
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
 console.log('S8B–S8D: speech, help, broadcast stop and navigation restoration passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
