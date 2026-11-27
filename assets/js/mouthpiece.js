/* THE OFFICE v0.3.25 — mouthpieces.
   A wrestler who cannot talk can have a stablemate who can do it for them. The mouthpiece's skill is what
   the room hears (promo-duel.js takes an optional speaker), the promises are still the wrestler's, and the
   other side will happily ask why the wrestler cannot speak for themselves. Afterwards the two of them are
   closer, unless the wrestler has too much ego to enjoy being spoken for; and a mouthpiece who gets a big
   reaction gets noticed. Deterministic: once per contract, nothing random. */
(function installMouthpiece(root){'use strict';
 const G=root.OfficeGame;
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const bondOf=(a,b)=>root.OfficeBonds?.score?.(a,b)||0;
 const MIN_GAP=10; // a mouthpiece has to be clearly the better talker

 // Stablemates who could talk for this wrestler tonight, best talker first.
 function candidates(c,w){
  const s=G.S;if(!s||!w)return [];
  return s.roster.filter(x=>x.id!==w.id&&x.id!==c?.rid&&!G.inCamp?.(x)&&
  ![...(s.card||[]),...(s.futureBookings||[])].some(k=>k.id!==c?.id&&k.eventAbs===(c?.eventAbs??G.abs())&&(k.wid===x.id||k.rid===x.id))&&
  (x.mic||0)>=(w.mic||0)+MIN_GAP).map(x=>{
   const b=bondOf(w.id,x.id),refuse=b<=-35?x.short+' will not speak for '+w.short+'.':null;
   const ego=w.ego>=72?w.short+' has a big ego and may not enjoy being spoken for.':null;
   return {id:x.id,name:x.name,short:x.short,mic:x.mic,psych:x.psych,heat:x.heat,bond:b,refuse,ego,
    note:b>=35?'Friends: they will do it gladly.':b<=-15?'They do not get on.':''};
  }).sort((a,b)=>b.mic-a.mic);
 }
 function pick(c,w,id){const x=candidates(c,w).find(m=>m.id===id);return x&&!x.refuse?x:null;}

 // Afterwards, once per contract.
 G.registerResultStage('mouthpiece',originalApply=>function(c,fin){
  const s=G.S,seen=!!(c&&s?.history?.some(h=>h.cid===c.id));
  const out=originalApply.apply(this,arguments);
  try{
   const m=fin?.promo?.mouth,w=G.W(c?.wid),x=G.W(m?.id);
   const st=s.mouthpiece??={done:{}};
   if(m&&w&&x&&!seen&&!st.done[c.id]){
    st.done[c.id]=1;
    const q=fin.promo.quality||50,good=q>=60;
    // The promo's heat went to the wrestler (story.js); half of it was somebody else's work.
    const share=Math.floor(Math.max(0,Math.round((q-35)/14))/2);if(share){w.heat=clamp(w.heat-share);out.push({text:`Some of the credit for that promo goes to ${x.short}: ${w.short}’s heat −${share}.`,tone:0});}
    root.OfficeBonds?.shift?.(w.id,x.id,good?8:3,'mouthpiece',x.short+' spoke for '+w.short+' at the microphone.',c.id+':mouth');
    if(w.ego>=72){w.morale=clamp(w.morale-3);out.push({text:`${w.short} did not enjoy being spoken for (morale −3). ${x.short} did the talking${good?', and did it well':''}.`,tone:-1});}
    else{w.morale=clamp(w.morale+1);out.push({text:`${x.short} spoke for ${w.short}${good?' and the room loved it':''}. Bond +${good?8:3}.`,tone:1});}
    if(q>=70){x.heat=clamp(x.heat+2);out.push({text:`People noticed ${x.short} on the microphone: heat +2.`,tone:1});}
    root.OfficeMemory?.remember?.(w.id,'mouthpiece',`${w.short} remembers ${x.short} doing the talking against ${G.F(c.rid)?.short||'them'}.`,c.rid,w.ego>=72?-1:1,0,c.id+':mouth');
    G.save();
   }
  }catch(e){}
  return out;
 });
 root.OfficeMouthpiece={candidates,pick,MIN_GAP};
})(typeof window!=='undefined'?window:globalThis);
