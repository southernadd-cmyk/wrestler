/* The Office Switch Edition input bridge. All physical presses first pass the NARBE guard. */
(function(root){
"use strict";
function create({scan,manager,holdThreshold=600,setTimer=setTimeout,clearTimer=clearTimeout}){
 let held=new Map(),reverseTimer=null;
 const key=e=>e.code==="NumpadEnter"?"Enter":e.code;
 const valid=e=>["Space","Enter"].includes(key(e))&&!e.target?.matches?.("input,textarea,select,[contenteditable=true]");
 function stopReverse(){clearTimer(reverseTimer);reverseTimer=null;}
 function repeat(entry){
  if(held.get("Space")!==entry||manager.getSettings().autoScan)return;
  entry.reversed=true;scan.step(-1);
  reverseTimer=setTimer(()=>repeat(entry),manager.getScanInterval());
 }
 function down(e){
  if(!valid(e))return;
  e.preventDefault();const k=key(e);
  if(e.repeat||held.has(k))return;
  const auto=manager.getSettings().autoScan;
  const entry={auto,brake:false,reversed:false};held.set(k,entry);
  if(k==="Space"&&auto&&scan.brakePress()){entry.brake=true;return;}
  scan.setInputHeld(true);
  if(k==="Space"&&!auto)reverseTimer=setTimer(()=>repeat(entry),holdThreshold);
 }
 function up(e){
  const k=key(e);if(!["Space","Enter"].includes(k))return;
  const entry=held.get(k);if(!entry)return;
  e.preventDefault();held.delete(k);
  if(k==="Space")stopReverse();
  if(entry.brake){scan.brakeRelease();return;}
  if(entry.auto===manager.getSettings().autoScan){
   if(k==="Enter"||(k==="Space"&&entry.auto))scan.select();
   else if(!entry.reversed)scan.step(1);
  }
  scan.setInputHeld([...held.values()].some(x=>!x.brake));
 }
 function cancel({resetGuard=false}={}){
  stopReverse();held.clear();scan.setSuspended(true);scan.setSuspended(false);
  if(resetGuard)manager.resetInputState();
 }
 return {down,up,cancel};
}
const api={create};if(typeof module!=="undefined")module.exports=api;else root.OfficeChoiceInput=api;
})(typeof globalThis!=="undefined"?globalThis:this);
