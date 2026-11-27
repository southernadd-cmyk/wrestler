'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'../switch',name),'utf8');
class Element{
 constructor(){this.children=[];this.dataset={};this.classList={toggle(){}};this.textContent='';}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 setAttribute(){} removeAttribute(){} scrollIntoView(){} addEventListener(){}
}
function harness(ttsEnabled=true){
 const elements=new Map(),events=new Map(),windowEvents=new Map(),spoken=[];
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const listen=(map,k,fn)=>{if(!map.has(k))map.set(k,[]);map.get(k).push(fn);};
 const document={body:new Element(),getElementById:get,createElement:()=>new Element(),addEventListener:(k,fn)=>listen(events,k,fn)};
 let selected=null,suspended=false,items=[],scanOptions,active=null,opens=0,voiceCallbacks=[];
 const scan={open(next){opens++;items=next;selected=null;},setItems(next){items=next;},getState(){return {parked:false,id:selected,suspended};},setSuspended(v){suspended=v;},setInputHeld(){},brakePress(){return false;},step(){},select(){if(!suspended&&selected)scanOptions.onSelect(items.find(x=>x.id===selected));},announceCurrent(){},dispose(){}};
 const settings={ttsEnabled,rate:1,pitch:1};
 const V={
  getSettings:()=>({...settings}),getEnglishVoices:()=>[],getCurrentVoice:()=>null,getVoiceDisplayName:()=> 'Default',
  onSettingsChange:fn=>voiceCallbacks.push(fn),toggleTTS(){settings.ttsEnabled=!settings.ttsEnabled; if(!settings.ttsEnabled)this.cancel();voiceCallbacks.forEach(fn=>fn());},
  cancel(){active?.cancel();},
  speak(text,options){this.cancel();let finish,done=false;const finished=new Promise(r=>finish=r);
   const ticket={text,options,started:Promise.resolve(true),finished,settle(reason){if(done)return;done=true;if(active===ticket)active=null;finish({reason,started:true});},cancel(){this.settle('cancelled');}};
   spoken.push(ticket);active=ticket;return ticket;
  }
 };
 const M={getSettings:()=>({autoScan:true}),getScanInterval:()=>2000,isParkingEnabled:()=>false,subscribe(){},resetInputState(){},createChoiceScan(o){scanOptions=o;return scan;}};
 let saveCalls=0;
 const window={OfficeGame:{S:null,hasSave:()=>false,saveStatus:()=>({ok:true}),save(){saveCalls++;}},OfficeData:{},OfficeMatch:{},NarbeScanManager:M,NarbeVoiceManager:V,NarbePlatform:{settings:{hasHubParent:()=>false}},addEventListener:(k,fn)=>listen(windowEvents,k,fn)};
 window.parent=window;
 const context=vm.createContext({window,document,localStorage:{getItem:()=>null},console,setTimeout,clearTimeout});
 vm.runInContext(read('booth-speech.js'),context);
 vm.runInContext(read('choice-input.js'),context);
 window.OfficeChoiceInput=context.OfficeChoiceInput;
 vm.runInContext(read('app.js'),context);
 return {get,spoken,V,scan,select:id=>{selected=id;scan.select();},key:(type,code)=>{for(const fn of events.get(type)||[])fn({type,code,repeat:false,preventDefault(){},target:{matches:()=>false}});},click:id=>get('choices').children.find(x=>x.dataset.choice===id).onclick(),blur:()=>{for(const fn of windowEvents.get('blur')||[])fn();},opens:()=>opens,saves:()=>saveCalls};
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
 console.log('S8B: screen speech, release-only interruption, repeat, cancellation and failure recovery passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
