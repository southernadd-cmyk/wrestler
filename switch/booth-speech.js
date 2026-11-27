/* Switch-only commentary casting; all speech remains owned by NARBE VoiceManager. */
(function(root){'use strict';
// Select actual lines, never generate new wrestling events or touch the RNG.
function keepLine(mode,line,m,cursor){
 if(mode==='full')return true;
 const [min,sec]=String(line.t||'').split(':').map(Number);
 const at=Number.isFinite(min)&&Number.isFinite(sec)?min*60+sec:(m.t||0);
 // Keep the complete actual finish, mandatory alerts, safety incidents,
 // agent messages, big moves, counts and explicit planned-move evidence.
 const important=m.done||m.stage==='finish'||m.stage==='over'||
  ['bell','rating','alert','bad','injury','agent','count'].includes(line.kind)||line.big||
  (line.who==='runner'&&line.kind==='story')||
  (line.actionId&&(
   m.graph?.events?.some(e=>e.id===line.actionId&&e.t===at&&e.scriptedSpot)||
   m.sheet?.nodes?.some(n=>n.actual===line.actionId&&n.at===at&&['achieved','adapted'].includes(n.status))))||
  /^(structure-|causal-finish-runway)/.test(line.textureId||'')||
  /\b(?:injur(?:y|ed|ies)|doctor|medical|botch(?:ed)?|disqualif\w*|near.?fall|kick(?:s|ed)? out|finisher|taps|rope break)\b/i.test(line.text||'');
 // Nested time buckets give each mode an actual sample of the match,
 // and ensure Highlights is a subset of Condensed for the same stream.
 const gap=mode==='highlights'?90:30,bucket=Math.floor(at/gap);
 const sample=cursor.mode!==mode||cursor.bucket!==bucket;
 cursor.mode=mode;cursor.bucket=bucket;
 return !!(important||sample||(mode==='condensed'&&line.kind==='story'&&!line.textureId));
}
function createBoothSpeech(V){
 const profiles={
  pbp:{gender:'female',pitch:1.15,rate:1.06},
  runner:{gender:'male',pitch:.97,rate:1.01},
  colour:{gender:'male',pitch:.85,rate:.91}
 };
 // Web Speech exposes names and locales, not a reliable gender field.
 const female=/\b(female|susan|serena|sonia|libby|kate|hazel|martha|emily|samantha|zira|aria|raveena|heera|neerja|aashi|asha|priya|moira|karen|tessa|veena|catherine|jenny|michelle|ana|emma|ava|allison|joanna|amy|nicole|natasha|salli|ivy|olivia)\b/i;
 const male=/\b(male|ryan|daniel|george|arthur|oliver|david|mark|guy|ravi|rishi|prabhat|aditya|mohan|arjun|ajit|amit|rahul|sanjay|ramesh|madhur|james|thomas|aaron|alex|fred|lee|gordon|brian|neil|eric|roger|andrew|christopher|liam|william)\b/i;
 const indianMale=/\b(ravi|rishi|prabhat|aditya|mohan|arjun|ajit|amit|rahul|sanjay|ramesh|madhur)\b/i;
 const gender=v=>female.test(v.name||'')?'female':male.test(v.name||'')?'male':null;
 let active=null;
 const key=v=>v.voiceURI||v.name+'|'+v.lang;
 function cast(){
  const voices=V.getEnglishVoices().filter(v=>v&&v.lang?.toLowerCase().startsWith('en'));
  const current=V.getCurrentVoice(),unique=new Map();
  for(const v of voices){
   const prior=unique.get(key(v));
   if(!prior||(!gender(prior)&&gender(v)))unique.set(key(v),v);
  }
  const pool=[...unique.values()];
  if(!pool.length&&current)pool.push(current);
  const used=new Set(),result={};
  // Gloria first, Ravi second, Vic third. Prefer a compatible voice to
  // an unused incompatible one. Locale alone does not indicate gender.
  for(const [role,p] of Object.entries(profiles)){
   const score=v=>(gender(v)===p.gender?1000:gender(v)===null?0:-1000)+
    (role==='runner'?(indianMale.test(v.name||'')?80:0)+(/^en-in/i.test(v.lang)?30:0):0)+
    (/^en-gb/i.test(v.lang)?10:0)+(v.localService?2:0)-(used.has(key(v))?150:0);
   const voice=pool.slice().sort((a,b)=>score(b)-score(a)||key(a).localeCompare(key(b)))[0]||null;
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
 // Dennis is a visual speaker label, not part of his dialogue. Keep real
 // references to Dennis intact, and strip labels before utterance splitting.
 const spokenText=text=>String(text||'').replace(/(^|\s)Dennis:\s*/g,'$1');
 function speak(text){cancel();return V.speak(spokenText(text));}
 function sequence(parts){
  cancel();
  const voices=cast();
  // Keep native utterances short enough for browser engines, especially at
  // slower speech rates. Split on whitespace, retaining each role's voice.
  const queue=parts.flatMap(part=>{const rate=options(part.who,voices).rate||V.getSettings().rate||1,limit=Math.max(24,Math.floor(125*Math.min(1,rate)));const words=spokenText(part.text).trim().split(/\s+/),chunks=[];let current='';for(const word of words){if(current&&current.length+1+word.length>limit){chunks.push(current);current='';}current+=(current?' ':'')+word;}if(current)chunks.push(current);return chunks.map(text=>({who:part.who,text}));});
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
root.OfficeBoothSpeech={create:createBoothSpeech,keepLine};
})(typeof window!=='undefined'?window:globalThis);
