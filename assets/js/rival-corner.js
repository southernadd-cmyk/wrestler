/* THE OFFICE — rival corners: the other side's stable and manager at ringside.
   When the wrestler you are facing belongs to a stable, their manager can be at ringside for them,
   and a stablemate can come out to help. The plan is worked out from the booking, the heat and the
   stable's manager, and it is deterministic: the same card always produces the same plan.
   The telegraph shows on the signed sheet before the bell: the manager is at ringside, and something
   may be planned. Nothing in the booked result changes here. The interference colours the match and
   its consequences afterwards: heat, morale, the bond with their man. */
(function installRivalCorner(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,Mx=root.OfficeMatch;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const between=(n,a,b)=>Math.max(a,Math.min(b,n));

 // The jobs done for the other side, and the share of the match clock each one is due at.
 const JOBS={
  argue:{label:'Their manager argues with the referee',window:[.45,.7],eject:.25,strip:'Manager',move:'their manager argues with the referee',title:'{M} takes the referee aside'},
  call:{label:'Their manager shouts instructions',window:[.35,.6],eject:0,strip:'Manager',move:'their manager shouts from the barrier',title:'{M} calls the spots from the barrier'},
  distract:{label:'A stablemate distracts the referee',window:[.78,.96],eject:.22,strip:'Distraction',move:'a distraction from {S}',title:'{S} distracts the referee for them'},
  runin:{label:'A stablemate runs in',window:[.84,.98],eject:.3,strip:'Run-in',move:'{S} over the barrier',title:'{S} runs in on your wrestler'}
 };
 function state(s=G.S){
  if(!s)return null;
  const r=s.rivalCorner&&typeof s.rivalCorner==='object'?s.rivalCorner:(s.rivalCorner={});
  r.done??={};r.log??=[];
  return r;
 }

 // The stable the opposing wrestler belongs to tonight, if any.
 function team(c){
  const s=G.S,ct=s?.worldV4?.contracts?.[c?.rid];
  if(!ct||ct.owner!=='ai'||!ct.agencyId)return null;
  return s.territory?.teams?.find(t=>t.id===ct.agencyId)||null;
 }
 // Everyone already booked on this night, so nobody is in two places.
 function busy(c){
  const s=G.S,ids=new Set([c.wid,c.rid]),when=c.eventAbs??G.abs();
  for(const k of [...(s?.card||[]),...(s?.futureBookings||[])])if(k.id!==c.id&&k.eventAbs===when){ids.add(k.wid);ids.add(k.rid);}
  return ids;
 }
 // Their stablemates who could come out: not on the card, not hurt.
 function members(c){
  const s=G.S,t=team(c);if(!t)return [];
  const taken=busy(c);
  return (t.roster||[]).filter(id=>{
   const ct=s.worldV4?.contracts?.[id];
   return ct?.owner==='ai'&&ct.agencyId===t.id&&!taken.has(id)&&!(G.F?.(id)||D.findWrestler(id)||{}).injury;
  }).map(id=>({id,short:(D.findWrestler(id)||{}).short||id}));
 }

 // The night's plan for the other corner. Null when the wrestler has no stable.
 function plan(c){
  const t=team(c);if(!t||!c)return null;
  const prof=root.OfficeManagers?.profile?.(t.id)||{push:.5};
  const heat=Math.max(c.feudHeat||0,G.feud?.(c.wid,c.rid)?.heat||0);
  const winning=String(c.finish||'').startsWith('win');
  // Whether they bother at all: a pushy manager, a hot feud and a booked win make it likelier.
  const chance=.2+prof.push*.35+Math.min(.25,heat/200)+(winning?.1:0);
  const interferes=hash(c.id+'|rival')<chance;
  let job=null,second=null;
  if(interferes){
   const pool=members(c);
   if(pool.length&&hash(c.id+'|rival-second')<.6){
    const who=pool[Math.floor(hash(c.id+'|rival-who')*pool.length)];
    const jobs=['distract',...(winning&&(heat>=15||prof.push>=.7)?['runin']:[])];
    second={id:who.id,short:who.short,job:jobs[Math.floor(hash(c.id+'|rival-job')*jobs.length)]};
    job=second.job;
   }else job=winning?'argue':'call';
  }
  const J=job?JOBS[job]:null;
  const at=J?J.window[0]+(J.window[1]-J.window[0])*.6*hash(c.id+'|rival-at|'+job):null;
  return {teamId:t.id,team:t.name,manager:t.manager,second,job,at,window:J?J.window.slice():null,interferes};
 }

 // Before the bell: what the player can see about the other corner. Null when there is no stable.
 function telegraph(c){
  const p=plan(c),t=team(c),f=G.F?.(c?.rid);
  if(!p||!t||!f)return null;
  const parts=[`${p.manager} of ${p.team} has a seat at ringside for ${f.short}.`];
  if(p.second)parts.push(`${p.second.short} is in the back and may come out.`);
  else if(p.job)parts.push(`${p.manager} may make trouble from the barrier.`);
  return {line:parts.join(' '),warn:!!p.job,interferes:p.interferes};
 }

 // Put the other corner's plan on the match: announced on the entrances, fired at its moment.
 function attach(M,c){
  if(!M||!c)return M;
  const p=plan(c);if(!p)return M;
  M.rivalCorner={...p,cid:c.id,fired:false,announced:false,ok:false,ejected:false};
  return M;
 }
 function say(M,text,kind='story',extra={}){return {t:Mx.fmt(M.t),text,kind,big:!!extra.big,pause:extra.pause||0,who:extra.who===undefined?'pbp':extra.who};}
 function push(M,line){M.queue.push(line);M.log.push(line);}
 function announce(M){
  const k=M.rivalCorner;k.announced=true;
  const who=k.second?.short||k.manager;
  push(M,say(M,(k.second?`${who} comes out and takes up a spot at the back of ${M.f.short}’s corner.`:`${k.manager} walks down to ${M.f.short}’s corner with a clipboard and an opinion.`),'story',{who:'pbp'}));
 }
 function fire(M){
  const k=M.rivalCorner,J=JOBS[k.job],f=M.f,w=M.w;
  const who=k.second?.short||k.manager;
  k.fired=true;k.t=M.t;
  const roll=hash(k.cid+'|rival-ref|'+k.job);
  let eject=J.eject+(60-(f.psych||60))/300;
  eject=between(eject,0,.6);
  if(M.o?.stip==='nodq'||M.stip==='nodq')eject=0;
  k.eject=Math.round(eject*100);
  if(k.job!=='call'&&roll<eject){
   k.ejected=true;M.mom=clamp(M.mom+6,-60,60);Mx.lift(M,4);
   push(M,say(M,k.job==='runin'?who+' is over the barrier, and the referee turns round at exactly the wrong moment.':who+' is up in the referee’s face, and the referee has seen enough.','bad',{pause:1,who:'pbp'}));
   push(M,say(M,'The referee points to the back. '+who+' is thrown out, and '+f.short+' is on their own.','crowd',{big:true,pause:1,who:'colour'}));
  }else if(k.job==='call'){
   k.ok=true;M.mom=clamp(M.mom-5,-60,60);Mx.lift(M,-1);
   push(M,say(M,k.manager+' is on the barrier, screaming instructions at '+f.short+'. '+f.short+' listens.','play',{pause:1,who:'pbp'}));
  }else if(k.job==='argue'){
   k.ok=true;M.mom=clamp(M.mom-8,-60,60);Mx.lift(M,-2);
   push(M,say(M,k.manager+' has the referee by the sleeve. The referee turns round, and '+f.short+' gets a free shot in.','play',{big:true,pause:1,who:'pbp'}));
  }else if(k.job==='distract'){
   k.ok=true;M.mom=clamp(M.mom-6,-60,60);Mx.lift(M,-3);
   push(M,say(M,who+' is on the apron, shouting about something. The referee goes over to deal with it.','play',{pause:1,who:'pbp'}));
   push(M,say(M,'Behind the referee’s back, '+f.short+' takes a liberty on '+w.short+'. The crowd are not happy.','bad',{big:true,pause:1,who:'pbp'}));
  }else{
   k.ok=true;M.mom=clamp(M.mom-14,-60,60);Mx.lift(M,5);
   push(M,say(M,who+' comes over the barrier while the referee is tangled in the ropes and lays out '+w.short+'!','crowd',{big:true,pause:1,who:'pbp'}));
   push(M,say(M,'By the time the referee turns round, '+who+' is back in the crowd, looking innocent.','play',{pause:1,who:'colour'}));
  }
  M.crowdPeak=Math.max(M.crowdPeak||0,M.crowd);
 }
 const originalNext=Mx.next;
 Mx.next=function(M){
  try{
   const k=M?.rivalCorner;
   if(k&&k.job&&M.stage!=='entrance'&&!k.announced)announce(M);
   if(k&&k.job&&k.at!=null&&!k.fired&&!M.queue.length&&!M.decision&&(M.stage==='finish'||(M.stage==='live'&&M.t/Math.max(1,M.len)>=k.at)))fire(M);
  }catch(e){G.reportError?.('rival-corner/in-match',e)}
  return originalNext.call(this,M);
 };

 // After the match: what their corner did to the result and to the people in it. Once per contract.
 function settle(c,M){
  const k=M?.rivalCorner,out=[];if(!k||!G.S)return out;
  const st=state();if(st.done[c.id])return out;st.done[c.id]=1;
  const add=(text,tone=0)=>out.push({text,tone});
  const w=G.W(c.wid),f=G.F(c.rid);if(!w||!f)return out;
  const t=team(c);
  const bond=(a,b,d,kind,text)=>root.OfficeBonds?.shift?.(a,b,d,kind,text,c.id+':rival');
  if(!k.job)return out;
  if(!k.fired){
   add(`Nothing from ${t?.name||'their corner'} went near the ring.`,0);
  }else{
   const who=k.second?.short||k.manager,sid=k.second?.id;
   const fd=G.feud(w.id,f.id);
   if(k.ejected){
    if(w)w.morale=clamp((w.morale||50)+2);
    if(sid){const x=G.F(sid);if(x)G.updatePersonnel(G.S,sid,{morale:clamp((x.morale??50)-3)});}
    add(`${who} was thrown out by the referee. ${w.short} morale +2.`,1);
   }else if(k.job==='call'){
    add(`${k.manager} called the spots for ${f.short} from the barrier. It shows in the match, not on the card.`,-1);
   }else if(k.job==='argue'){
    if(fd&&!fd.closed)fd.heat=clamp(fd.heat+3);
    add(`${k.manager} argued the referee's ear off and got ${f.short} a free shot. Feud heat +3.`,-1);
   }else if(k.job==='distract'){
    if(fd&&!fd.closed)fd.heat=clamp(fd.heat+4);
    if(sid)bond(sid,f.id,6,'support','Ran interference at ringside.');
    add(`${who} distracted the referee for ${f.short}. Feud heat +4.`,-1);
   }else if(k.job==='runin'){
    if(fd&&!fd.closed)fd.heat=clamp(fd.heat+8);
    w.morale=clamp((w.morale||50)-3);
    if(sid)bond(sid,f.id,8,'support','Ran in on their behalf.');
    add(`${who} ran in and laid out ${w.short}. Feud heat +8; ${w.short} morale −3.`,-1);
   }
  }
  const event={cid:c.id,week:G.abs(),wid:w.id,rid:f.id,second:k.second?.id||null,secondName:k.second?.short||k.manager,
   job:k.job,fired:!!k.fired,ok:!!k.ok,ejected:!!k.ejected};
  st.log.unshift(event);st.log=st.log.slice(0,30);
  const h=G.S.history?.find(h=>h.cid===c.id);if(h)h.rivalCorner={...event};
  root.OfficeRivalry?.recordRivalCorner?.(c,event);
  G.save();return out;
 }

 root.OfficeRivalCorner={state,JOBS,team,members,plan,telegraph,attach,settle};
})(typeof window!=='undefined'?window:globalThis);
