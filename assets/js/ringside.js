/* THE OFFICE v0.3.21 — ringside plans.
   Somebody from your stable can walk out with your wrestler. They can just be in the corner, or they
   can have a job: pull the referee's eyes away at the right moment, take a planned bump from the
   referee, or (when the booked finish is a dirty win) come over the barrier. The job goes on the match
   strip like any other beat. The referee is not stupid, and some promoters will not have it on their
   show. Deterministic: hashed from the contract id and the save. */
(function installRingside(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,Mx=root.OfficeMatch,Sheets=root.OfficeSheets;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const between=(n,a,b)=>Math.max(a,Math.min(b,n));
 const strict=p=>['traditional','cold'].includes(p?.personality);
 const bondOf=(a,b)=>root.OfficeBonds?.score?.(a,b)||0;

 function state(s=G.S){
  if(!s)return null;
  const r=s.ringside&&typeof s.ringside==='object'?s.ringside:(s.ringside={});
  r.done??={};r.log??=[];
  return r;
 }

 // The jobs. `window` is where on the match clock the moment is due, as a share of the match.
 const JOBS={
  support:{label:'In the corner',hint:'Cheers them on, wipes their face, shouts the count. Nothing illegal.',tags:['Safe','Crowd ▲ if they are popular'],strip:null},
  distract:{label:'Distract the referee',hint:'Up on the apron at the right moment, arguing about anything.',tags:['Crowd ▲','Risk: ejected'],strip:'Distraction',window:[.78,.96],move:'a distraction from {S}',title:'{S} distracts the referee'},
  refbump:{label:'Plan a referee bump',hint:'The referee goes down, on purpose, and sees nothing for ten seconds.',tags:['Big crowd moment','Risk: the referee really gets hurt'],strip:'Ref bump',window:[.7,.9],move:'the referee goes down',title:'The referee takes a planned bump'},
  runin:{label:'A run-in',hint:'Over the barrier while the referee is busy. Only with a dirty win booked.',tags:['Feud heat ▲','Gamble: caught before the ring'],strip:'Run-in',window:[.84,.98],move:'{S} over the barrier',title:'{S} runs in'}
 };
 // Who could walk out with this wrestler tonight, and what each of them could do.
 function seconds(c,w,f){
  const s=G.S,heat=Math.max(c?.feudHeat||0,G.feud?.(w.id,f.id)?.heat||0);
  return (s?.roster||[]).filter(x=>x.id!==w.id&&x.id!==c?.rid&&!G.inCamp?.(x)&&
   ![...(s.card||[]),...(s.futureBookings||[])].some(k=>k.id!==c?.id&&k.eventAbs===(c?.eventAbs??G.abs())&&(k.wid===x.id||k.rid===x.id))).map(x=>{
   const b=bondOf(w.id,x.id),hurt=!!x.injury;
   let refuse=null;
   if(b<=-35)refuse=x.short+' will not stand in '+w.short+'’s corner.';
   const jobs=Object.keys(JOBS).filter(j=>{
    if(j==='support')return true;
    if(hurt)return false;
    if(j==='refbump')return heat>=25||['win_dirty','lose_protected'].includes(c.finish);
    // v0.3.23 In a no disqualification match a run-in is legal, whatever the booked finish.
    if(j==='runin')return c.finish==='win_dirty'||c.stip==='nodq';
    return true;
   });
   return {id:x.id,name:x.name,short:x.short,bond:b,hurt,refuse,jobs,note:hurt?'Injured: corner work only.':b>=35?'A friend. They would do anything.':b<=-15?'They do not get on.':''};
  });
 }
 function options(c,w,f){
  const out=[{id:'none',label:'Nobody',hint:w.short+' walks out alone.',tags:['Safe']}];
  for(const x of seconds(c,w,f)){
   if(x.refuse){out.push({id:'no:'+x.id,label:x.short,hint:x.refuse,tags:['Refuses'],disabled:true});continue;}
   for(const j of x.jobs){const J=JOBS[j];out.push({id:x.id+':'+j,label:x.short+': '+J.label.toLowerCase(),hint:J.hint+(x.note?' '+x.note:''),tags:J.tags.slice()});}
  }
  return out;
 }
 function parse(choice){const [id,job]=String(choice||'none').split(':');return id&&id!=='none'&&id!=='no'&&JOBS[job]?{id,job}:null;}

 // Put the plan on the signed sheet, with its own beat on the strip.
 function attach(sheet,c,choice){
  const plan=parse(choice);if(!plan||!sheet?.signed)return sheet;
  const w=G.W(c.wid),f=G.F(c.rid),x=G.W(plan.id);if(!w||!f||!x)return sheet;
  const ok=seconds(c,w,f).find(s=>s.id===plan.id);if(!ok||ok.refuse||!ok.jobs.includes(plan.job))return sheet;
  const out=JSON.parse(JSON.stringify(sheet)),J=JOBS[plan.job];
  out.corner={id:x.id,short:x.short,job:plan.job,cid:c.id,fired:false,announced:false};
  if(J.window){
   const at=J.window[0]+(J.window[1]-J.window[0])*.6*hash(c.id+'|at|'+plan.job);
   out.corner.at=at;
   out.nodes.splice(out.nodes.length-1,0,{id:'corner',corner:true,owner:'either',planned:true,requires:[],backup:[],
    title:J.title.replace('{S}',x.short),move:J.move.replace('{S}',x.short),actions:['corner_'+plan.job],window:J.window.slice(),status:'pending',actual:null,at:null,why:''});
  }
  return out;
 }

 // ---------------------------------------------------------------------------------------------
 // During the match: the engine's next line, with the corner's moments slotted in.
 function say(M,text,kind='story',extra={}){const line={t:Mx.fmt(M.t),text,kind,big:!!extra.big,pause:extra.pause||0,who:extra.who===undefined?'pbp':extra.who};return line;}
 function push(M,line,before){
  if(before){const qi=M.queue.findIndex(l=>l.kind==='bell'),li=M.log.lastIndexOf(M.queue[qi]);
   if(qi>=0&&li>=0){M.queue.splice(qi,0,line);M.log.splice(li,0,line);return;}}
  M.queue.push(line);M.log.push(line);
 }
 function announce(M){
  const k=M.sheet.corner,x=G.W(k.id);k.announced=true;if(!x)return;
  const pop=x.heat>=70?' The crowd cheer for '+x.short+' as well.':x.heat<35?'':' A few people recognise '+x.short+'.';
  push(M,say(M,x.short+' walks out in '+M.w.short+'’s corner.'+pop,'story',{who:'pbp'}),true);
  if(k.job==='support'){const d=2+x.heat/25;Mx.lift(M,d);M.crowdPeak=Math.max(M.crowdPeak||0,M.crowd);k.lift=Math.round(d);}
  if(k.job!=='support'&&root.OfficeSheets&&M.f)push(M,say(M,M.f.short+' keeps glancing at '+x.short+' on the floor.','story',{who:'colour'}),true);
 }
 function fire(M){
  const k=M.sheet.corner,x=G.W(k.id)||{short:k.short,psych:60,safe:60},p=M.p,w=M.w,f=M.f;
  const node=M.sheet.nodes.find(n=>n.corner);k.fired=true;k.t=M.t;
  const roll=hash(k.cid+'|ref|'+k.job);
  let eject=k.job==='distract'?.22:k.job==='runin'?.3:k.job==='refbump'?.12:0;
  eject+=(strict(p)?.1:p?.personality==='showman'?-.08:0)+(60-(x.psych||60))/300;
  eject=between(eject,.03,.6);
  if(M.o.stip==='nodq'||M.stip==='nodq')eject=0; // nothing to throw anybody out for
  k.eject=Math.round(eject*100);
  const at={who:null};
  if(k.job==='refbump'){
   // A bump is only dangerous if the wrestlers are careless with each other.
   const hurt=hash(k.cid+'|hurt')<between((100-w.safe)/260+(100-f.safe)/400,.03,.35);
   push(M,say(M,w.short+' ducks, and '+f.short+' goes straight through the referee! The official is down.','play',{big:true,pause:1,who:'pbp'}));
   if(hurt){k.ok=false;k.hurtRef=true;Mx.lift(M,-5);M.sheetAdj=(M.sheetAdj||0)-.25;
    push(M,say(M,'The referee is not moving. That was not supposed to happen. A second official comes running from the back.','bad',{big:true,pause:1,who:'colour'}));}
   else{k.ok=true;Mx.lift(M,8);M.sheetAdj=(M.sheetAdj||0)+.12;
    push(M,say(M,'Nobody to count. '+w.short+' has '+f.short+' pinned for a good ten seconds and the crowd count it themselves.','crowd',{big:true,pause:1,who:'pbp'}));}
  }else if(roll<eject){
   k.ok=false;k.ejected=true;Mx.lift(M,-4);M.sheetAdj=(M.sheetAdj||0)-.1;
   push(M,say(M,k.job==='runin'?x.short+' is over the barrier, and the referee turns round at exactly the wrong moment.':x.short+' climbs onto the apron to argue, and the referee has seen enough.','bad',{pause:1,who:'pbp'}));
   // v0.3.22 A run-in the referee sees is not an ejection: it is a disqualification (unless nothing is illegal tonight).
   if(k.job==='runin'&&M.outcome==='booked'&&M.o.stip!=='nodq'&&M.stip!=='nodq'){k.dq=true;M.dqCall={why:'runin',side:'w',who:x.short,at:M.t};}
   else push(M,say(M,'The referee points to the back. '+x.short+' is thrown out, and '+w.short+' is on their own.','bad',{big:true,pause:1,who:'colour'}));
  }else if(k.job==='distract'){
   k.ok=true;const dirty=M.o.finish==='win_dirty';Mx.lift(M,dirty?6:4);M.sheetAdj=(M.sheetAdj||0)+(dirty?.1:.05);
   push(M,say(M,x.short+' is up on the apron, shouting about something. The referee goes over to deal with it.','play',{pause:1,who:'pbp'}));
   push(M,say(M,dirty?'Behind the referee’s back, '+w.short+' takes a liberty. The crowd are livid.':'In the confusion, '+w.short+' gets a roll-up that nobody counts. So close.','crowd',{big:true,pause:1,who:'pbp'}));
  }else if(k.job==='runin'){
   k.ok=true;Mx.lift(M,10);M.sheetAdj=(M.sheetAdj||0)+.15;
   push(M,say(M,x.short+' comes over the barrier while the referee is tangled in the ropes and lays out '+f.short+'!','crowd',{big:true,pause:1,who:'pbp'}));
   push(M,say(M,'By the time the referee turns round, '+x.short+' is back in the crowd, looking innocent.','play',{pause:1,who:'colour'}));
  }
  M.crowdPeak=Math.max(M.crowdPeak||0,M.crowd);
  // Even if the sheet already gave up on it (a long quiet spell past its window), this is what happened.
  if(node){
   node.status=k.ok?'achieved':'missed';node.actual=k.ok?node.move:null;node.at=M.t;
   node.why=k.ok?'Done as agreed.':k.hurtRef?'The referee was really hurt.':k.dq?'The referee saw the run-in and disqualified '+w.short+'.':x.short+' was thrown out by the referee.';
  }
 }
 const originalNext=Mx.next;
 Mx.next=function(M){
  try{
   const k=M?.sheet?.corner;
   if(k&&M.stage!=='entrance'&&!k.announced)announce(M);
   if(k&&k.at!=null&&!k.fired&&!M.queue.length&&!M.decision&&(M.stage==='finish'||(M.stage==='live'&&M.t/Math.max(1,M.len)>=k.at)))fire(M);
  }catch(e){}
  return originalNext.call(this,M);
 };

 // ---------------------------------------------------------------------------------------------
 // After the match: what it did to everyone. Once per contract.
 function settle(c,M){
  const k=M?.sheet?.corner,out=[];if(!k||!G.S)return out;
  const st=state();if(st.done[c.id])return out;st.done[c.id]=1;
  const add=(text,tone=0)=>out.push({text,tone});
  const w=G.W(c.wid),x=G.W(k.id),p=G.P(c.pid),f=G.F(c.rid);if(!w||!x||!p)return out;
  const bond=(a,b,d,kind,text)=>root.OfficeBonds?.shift?.(a,b,d,kind,text,c.id+':corner');
  x.fatigue=clamp(x.fatigue+(k.job==='runin'?5:2));
  if(k.job==='support'){
   bond(w.id,x.id,4,'support','Stood in their corner.');w.morale=clamp(w.morale+2);
   add(x.short+' was in '+w.short+'’s corner'+(k.lift>=4?' and the crowd loved it':'')+'. Bond +4, morale +2.',1);
  }else if(!k.fired){
   add('The bell came before '+x.short+' could do the job.',0);
  }else if(k.ok){
   bond(w.id,x.id,6,'support','Did the job at ringside.');x.heat=clamp(x.heat+2);
   if(k.job==='runin'){const fd=G.feud(w.id,c.rid);if(fd&&!fd.closed)fd.heat=clamp(fd.heat+10);if(f)bond(x.id,f.id,-15,'grudge','A run-in at ringside.');}
   if(k.job==='refbump'){const fd=G.feud(w.id,c.rid);if(fd&&!fd.closed)fd.heat=clamp(fd.heat+6);}
   const dt=strict(p)?-1:1;p.trust=clamp(p.trust+dt);
   add({distract:x.short+'’s distraction worked',refbump:'The referee bump went to plan',runin:x.short+'’s run-in worked'}[k.job]+'. '+x.short+' heat +2, bond +6; '+p.name+' trust '+(dt>0?'+1':'−1')+'.',1);
  }else if(k.hurtRef){
   p.trust=clamp(p.trust-4);G.S.cash-=50;
   add('The referee was really hurt. £50 for the doctor and '+p.voice+' is not happy: trust −4.',-1);
  }else{
   const dt=strict(p)?-3:-1;p.trust=clamp(p.trust+dt);x.morale=clamp(x.morale-3);
   add(k.dq?x.short+'’s run-in cost '+w.short+' the match. '+x.short+' morale −3.':x.short+' was thrown out by the referee. '+p.name+' trust '+dt+', '+x.short+' morale −3.',-1);
  }
  st.log.unshift({cid:c.id,week:G.abs(),wid:w.id,second:x.id,job:k.job,fired:!!k.fired,ok:!!k.ok,ejected:!!k.ejected,hurtRef:!!k.hurtRef});st.log=st.log.slice(0,30);
  G.save();return out;
 }

 // The strip draws the corner's beat with its own name.
 if(Sheets?.STRIP_NAME)Sheets.STRIP_NAME.corner='Ringside';
 root.OfficeRingside={state,JOBS,seconds,options,parse,attach,settle};
})(typeof window!=='undefined'?window:globalThis);
