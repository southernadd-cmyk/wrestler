/* THE OFFICE v0.3.22 — disqualifications.
   The engine's referee can now throw a match out (see match-engine.js: the outcome graph, the referee and
   the six booked DQ routes). This module carries a disqualification nobody booked through the rest of the
   game, and lets promoters book DQ finishes: a champion who keeps the belt because the challenger lost
   their head, a rematch set up by a chair in front of the official.
   An unbooked DQ is a loss everywhere (record, rankings, rivalry, promises) and the promoter is not happy
   about losing the finish they paid for. Deterministic: hashed from ids, no random numbers. */
(function installDisqualifications(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));

 // Everything inside sees an ordinary booked disqualification loss; the history and the promoter know better.
 G.registerResultStage('disqualify',originalApply=>function(c,fin){
  if(fin?.outcome!=='dq'||!c)return originalApply.apply(this,arguments);
  const booked=c.finish,w=G.W(c.wid),p=G.P(c.pid);
  const c2={...c,finish:'lose_dq'},f2={...fin,outcome:'booked',actualOutcome:'dq',bookedFinish:booked,contractHonoured:false,script:null,adj:{...(fin.adj||{}),purseMul:(fin.adj?.purseMul??1)*.75}};
  const out=originalApply.call(this,c2,f2);
  const h=G.S.history[0];if(h&&h.wid===c.wid&&h.rid===c.rid){h.outcome='dq';h.booked=booked;}
  const why=fin.finishRoute==='dq_runin'?'a run-in the referee saw':'a cheap shot too many';
  const wasWin=String(booked).startsWith('win');
  if(p){const dt=wasWin?-10:-4;p.trust=clamp(p.trust+dt);out.push({text:`${w?.short||'Your wrestler'} was disqualified for ${why}. ${p.name} lost the finish they booked: trust ${dt}. A quarter off the purse.`,tone:-1});}
  if(w){w.morale=clamp(w.morale-(wasWin?4:2));w.loyal=clamp(w.loyal-(w.ego>=70?0:2));}
  root.OfficeMemory?.remember?.(c.wid,'humiliation',`${w?.short||'They'} remember being disqualified against ${G.F(c.rid)?.short||'them'}.`,c.rid,-2,0,c.id+':dq');
  G.save();return out;
 });

 // Promoters book a disqualification now and then: most often to keep a champion's belt or to set up a rematch.
 const DQ_RATE={'Title defence':.3,'Title match':.22,'Rematch':.25,'Callout':.15};
 function dqFinish(o){
  if(!o||o.programme||o.stip==='nodq'||o.dqChecked)return;
  o.dqChecked=true;
  const rate=DQ_RATE[o.tag]??(o.tag?0:.05);
  if(hash(o.id+'|dq')>=rate)return;
  if(o.finish==='win_dirty')o.finish='win_dq';
  else if(o.finish==='lose_protected')o.finish='lose_dq';
  // A champion who keeps the belt on a DQ: the classic.
  else if(o.tag==='Title defence'&&o.finish==='lose_clean'&&hash(o.id+'|keep')<.4)o.finish='win_dq';
 }
 const originalEnd=G.endWeek;
 G.endWeek=function(...args){
  const r=originalEnd.apply(this,args);
  try{for(const o of G.S?.offers||[])dqFinish(o);G.save();}catch(e){G.reportError('disqualification/offers',e)}
  return r;
 };

 root.OfficeDQ={dqFinish,DQ_RATE};
})(typeof window!=='undefined'?window:globalThis);
