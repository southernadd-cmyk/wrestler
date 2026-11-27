'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../switch/vendor/narbe-choice-voice.js'),'utf8');
const key='narbe-scan-settings',voiceKey='narbe-voice-settings';
function harness({saved,voice,parentKind='standalone',blocked=false}={}){
 const data=new Map(),listeners=new Map(),sent=[],timers=new Map();let clock=1000,nextTimer=0;
 if(saved!==undefined)data.set(key,JSON.stringify(saved));
 if(voice!==undefined)data.set(voiceKey,JSON.stringify(voice));
 const window={
  location:{origin:'https://game.example'},
  localStorage:{getItem:k=>{if(blocked)throw Error('denied');return data.get(k)??null;},setItem:(k,v)=>{if(blocked)throw Error('denied');data.set(k,v);}},
  addEventListener:(k,fn)=>{if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(fn);},
  removeEventListener:(k,fn)=>listeners.get(k)?.delete(fn)
 };
 const parent=parentKind==='standalone'?window:{postMessage:(message,origin)=>sent.push({message,origin})};
 if(parentKind==='hub'){parent.location={origin:window.location.origin};parent.NarbeScanManager={};}
 if(parentKind==='external')Object.defineProperty(parent,'location',{get(){throw Error('cross-origin');}});
 window.parent=parent;
 const document={querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},removeEventListener(){},visibilityState:'visible'};
 const context=vm.createContext({window,document,console,Date:{now:()=>clock},setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(source,context);
 function dispatch(type,event){for(const fn of listeners.get(type)||[])fn(event);}
 function advance(ms){
  const end=clock+ms;
  while(true){const next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);clock=next[1].at;next[1].fn();}
  clock=end;
 }
 return {M:window.NarbeScanManager,V:window.NarbeVoiceManager,parent,sent,data,dispatch,advance,origin:window.location.origin};
}
(async()=>{
 const fresh=harness();
 assert.equal(fresh.M.getSettings().autoScan,true);
 assert.equal(fresh.M.getSettings().waitForSpeech,true);
 assert.equal(fresh.M.getScanInterval(),2000);
 assert.equal(fresh.data.has(key),false,'defaults do not write over Hub storage');
 let selected=null;
 const scan=fresh.M.createChoiceScan({choice:true,holdThreshold:600,badge:{update(){},destroy(){}},speak:()=>({finished:Promise.resolve({started:false}),cancel(){}}),onSelect:item=>{selected=item.id;}});
 scan.open([{id:'new',label:'New career'},{id:'settings',label:'Settings'}]);
 assert.equal(scan.getState().id,null);
 assert.equal(scan.select(),false,'blank is inert');
 fresh.advance(2000);
 assert.equal(scan.getState().id,'new');
 await new Promise(setImmediate);
 fresh.advance(2000);
 assert.equal(scan.getState().id,'settings');
 assert.equal(scan.select(),true);
 assert.equal(selected,'settings','Enter-only path can reach Settings');
 scan.dispose();
 const external=harness({parentKind:'external'});
 assert.equal(external.M.getSettings().autoScan,true);
 const denied=harness({blocked:true});
 assert.equal(denied.M.getSettings().autoScan,true);
 const saved=harness({saved:{autoScan:false,scanSpeedIndex:4,inputSensitivityIndex:2,waitForSpeech:false,parking:'chosen'},voice:{ttsEnabled:false}});
 assert.equal(saved.M.getSettings().autoScan,false);
 assert.equal(saved.M.getScanInterval(),5000);
 assert.equal(saved.M.getInputSensitivity(),200);
 assert.equal(saved.M.getSettings().waitForSpeech,false);
 assert.equal(saved.M.getSettings().parking,'chosen');
 assert.equal(saved.V.getSettings().ttsEnabled,false);
 fresh.M.setAutoScan(false);
 const reload=harness({saved:JSON.parse(fresh.data.get(key))});
 assert.equal(reload.M.getSettings().autoScan,false,'explicit mode survives reload');
 const hub=harness({parentKind:'hub'});
 assert.equal(hub.M.getSettings().autoScan,false,'Hub retains its own default');
 assert.ok(hub.sent.some(x=>x.message.type===key+'-request'&&x.origin===hub.origin));
 assert.ok(hub.sent.some(x=>x.message.type===voiceKey+'-request'&&x.origin===hub.origin));
 const incoming={type:key+'-changed',settings:{autoScan:true,scanSpeedIndex:3,parking:'auto',loopsBeforeParking:3,spaceBrake:false,waitForSpeech:true}};
 hub.dispatch('message',{origin:'https://other.example',source:hub.parent,data:incoming});
 hub.dispatch('message',{origin:hub.origin,source:{},data:incoming});
 assert.equal(hub.M.getSettings().autoScan,false,'reject foreign origins and unrelated windows');
 hub.dispatch('message',{origin:hub.origin,source:hub.parent,data:incoming});
 assert.equal(hub.M.getSettings().autoScan,true);
 assert.equal(hub.M.getScanInterval(),4000);
 assert.equal(hub.M.getSettings().parking,'auto');
 assert.equal(hub.M.getSettings().loopsBeforeParking,3);
 assert.equal(hub.M.getSettings().spaceBrake,false);
 assert.equal(hub.M.getSettings().waitForSpeech,true);
 hub.dispatch('message',{origin:hub.origin,source:hub.parent,data:{type:voiceKey+'-changed',settings:{ttsEnabled:false,rate:.8}}});
 assert.equal(hub.V.getSettings().ttsEnabled,false);
 assert.equal(hub.V.getSettings().rate,.8);
 hub.M.setScanSpeedIndex(1);
 assert.ok(hub.sent.some(x=>x.message.type===key+'-changed'&&x.message.settings.scanSpeedIndex===1));
 console.log('S8A: first launch, Enter-only selection, persistence and same-origin Hub transport passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
