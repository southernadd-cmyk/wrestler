/* Ring lab only. Interpret resolved backstage entrance descriptions, never
   draw new incidents or alter their existing odds. Old signed sheets work. */
(function(root){'use strict';
const LABELS={normal:'Normal theme',disco:'Wedding CD — disco',slow:'Wedding CD — slow dance',hum:'Crowd humming',silence:'No entrance music',march:'Wedding March (preview only)',choir:'Community choir',choirBad:'Choir in three keys',shanty:'Sea shanty',jingle:'Wrong jingle'};
function classify(line){
 const s=String(line||'');
 if(/walks out to a wedding-disco classic/i.test(s))return 'disco';
 if(/walks out to the slow dance/i.test(s))return 'slow';
 if(/walks out to the front row humming their music/i.test(s))return 'hum';
 if(/walks out in (?:total )?silence\b/i.test(s))return 'silence';
 if(/sound desk mishears and plays the jingle/i.test(s))return 'jingle';
 if(/community choir humming|three men from the Legion humming/i.test(s))return 'choir';
 if(/Legion choir\. They begin in three different keys/i.test(s))return 'choirBad';
 if(/community choir.*sea shanty/i.test(s))return 'shanty';
 if(/walks out to (?:the )?Wedding March/i.test(s))return 'march';
 return null;
}
function resolve(sheet,w,f){
 const cues={w:'normal',f:'normal'};
 for(const line of sheet?.entrance||[]){
  const cue=classify(line);if(!cue)continue;
  // Match the actual subject, not incidental mentions of the crowd going quiet.
  const sides=[['w',w],['f',f]].filter(([,p])=>p?.short&&String(line).startsWith(p.short+' '));
  if(sides.length===1)cues[sides[0][0]]=cue;
 }
 return cues;
}
function track(cue,w,f){
 if(cue==='normal'||cue==='silence')return null;
 if(cue==='jingle'){
  const ids=['academy-018','academy-024','academy-009'];
  const id=ids.find(x=>x!==w?.id&&x!==f?.id);
  const t=root.OfficeRingEntranceMusic?.resolve(id);return t?{...t,title:LABELS[cue]+' · '+t.title}:null;
 }
 if(!['disco','slow','hum','choir','choirBad','shanty','march'].includes(cue))return null;
 return {title:LABELS[cue],url:'assets/audio/entrance-incidents/'+cue+'.mp3'+(['disco','slow'].includes(cue)?'?v=2':''),offset:0,duration:12};
}
function preview(cue,c,w,f,p){
 if(cue==='normal')return [];
 const R=root.OfficeRoom;
 if(['disco','slow','hum','silence'].includes(cue)){
  const situation=R?.SITUATIONS.find(s=>s.id==='music');if(!situation)throw Error('Backstage music situation unavailable');
  // Explicit lab replay of the existing option, including the two seeded roll outcomes.
  // Use a disposable meeting seed, never the actual match seed or game save.
  for(let n=0;n<128;n++){
   const st=R.begin({...c,id:c.id+'|music-preview|'+n},w,f,p);
   const opt=situation.options(st).find(o=>o.id===({disco:'roll',slow:'roll',hum:'hum',silence:'silence'})[cue]);
   opt.run(st);if(st.entrance.some(line=>classify(line)===cue))return st.entrance.slice();
  }
  throw Error('Could not replay backstage music outcome '+cue);
 }
 const own=R?.DAFT_OWN||{},more=R?.DAFT_MORE||{};
 const authored={choir:own.alina?.yes,choirBad:more.sermon?.find(x=>/Legion choir/.test(x.no))?.no,shanty:own.alina?.no,jingle:own.theo?.no};
 if(cue==='march')return [w.short+' walks out to the Wedding March. (Lab-only preview; not an existing random outcome.)'];
 if(authored[cue])return [authored[cue].replaceAll('{W}',w.short)];
 throw Error('Unknown music preview '+cue);
}
root.OfficeRingEntranceIncidents=Object.freeze({LABELS,classify,resolve,track,preview});
})(typeof window!=='undefined'?window:globalThis);
