/* Switch-only commentary casting; all speech remains owned by NARBE VoiceManager. */
(function(root){'use strict';
function createBoothSpeech(V){
 const profiles={
  pbp:{names:/\b(susan|serena|sonia|libby|kate|hazel|martha|emily|samantha|zira|aria|female)\b/i,pitch:1.15,rate:1.06},
  colour:{names:/\b(ryan|daniel|george|arthur|oliver|male|david|mark|guy)\b/i,pitch:.85,rate:.91},
  runner:{names:/\b(ravi|rishi|prabhat|raveena|heera|aditya|neerja)\b/i,pitch:1.04,rate:1.01}
 };
 let active=null;
 const key=v=>v.voiceURI||v.name+'|'+v.lang;
 function cast(){
  const voices=V.getEnglishVoices().filter(v=>v&&v.lang?.toLowerCase().startsWith('en'));
  const pool=[...new Map(voices.map(v=>[key(v),v])).values()];
  const used=new Set(),result={};
  for(const [role,p] of Object.entries(profiles)){
   const score=v=>(p.names.test(v.name)?100:0)+(role==='runner'&&/^en-in/i.test(v.lang)?30:0)+(/^en-gb/i.test(v.lang)?10:0)+(v.localService?2:0);
   const ranked=pool.slice().sort((a,b)=>score(b)-score(a)||key(a).localeCompare(key(b)));
   const voice=ranked.find(v=>!used.has(key(v)))||ranked[0]||V.getCurrentVoice();
   if(voice)used.add(key(voice));result[role]=voice;
  }
  return result;
 }
 function options(role,voices){
  const p=profiles[role];if(!p)return {};
  const s=V.getSettings(),rate=Math.min(10,Math.max(.1,(s.rate||1)*p.rate)),pitch=Math.min(2,Math.max(0,(s.pitch??1)*p.pitch));
  return {voice:voices[role],rate,pitch};
 }
 function parts(lines,tail=''){return [...lines.filter(l=>l?.text).map(l=>({who:l.who,text:l.text})),...(tail?[{text:tail}]:[])];}
 function cancel(){active?.cancel();}
 function speak(text){cancel();return V.speak(text);}
 function sequence(parts){
  cancel();
  const voices=cast();
  // Keep native utterances short enough for browser engines, especially at
  // slower speech rates. Split on whitespace, retaining each role's voice.
  const queue=parts.flatMap(part=>{const rate=options(part.who,voices).rate||V.getSettings().rate||1,limit=Math.max(24,Math.floor(125*Math.min(1,rate)));const words=String(part.text||'').trim().split(/\s+/),chunks=[];let current='';for(const word of words){if(current&&current.length+1+word.length>limit){chunks.push(current);current='';}current+=(current?' ':'')+word;}if(current)chunks.push(current);return chunks.map(text=>({who:part.who,text}));});
  let resolveStart,resolveFinish,current=null,done=false,didStart=false,index=0;
  const started=new Promise(r=>resolveStart=r),finished=new Promise(r=>resolveFinish=r);
  function end(reason){
   if(done)return;done=true;resolveStart(didStart);resolveFinish({reason,started:didStart});if(active===ticket)active=null;
  }
  const ticket={started,finished,cancel(){if(done)return;const old=current;end('cancelled');old?.cancel?.();}};
  active=ticket;
  function next(){
   if(done)return;
   if(!V.getSettings().ttsEnabled){end('disabled');return;}
   if(index>=queue.length){end('end');return;}
   const part=queue[index++];if(!part.text){next();return;}
   try{
    current=V.speak(part.text,{...options(part.who,voices),completeUtterance:true});
    current.started.then(value=>{if(!done&&value){didStart=true;resolveStart(true);}},()=>{});
    current.finished.then(result=>{
     if(done)return;
     if(result?.started){didStart=true;resolveStart(true);}
     if(result?.reason!=='end'){end(result?.reason||'error');return;}
     next();
    },()=>end('error'));
   }catch(_){end('error');}
  }
  next();return ticket;
 }
 return {cast,speak,parts,sequence,cancel};
}
root.OfficeBoothSpeech={create:createBoothSpeech};
})(typeof window!=='undefined'?window:globalThis);
