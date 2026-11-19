/* THE OFFICE v0.3.11 — the locker room.
   Bonds and grudges between wrestlers, grown from what they remember: the matches they had,
   the cars they shared, who got the main event and who sat at home. Tracked for your stable
   and for the people your wrestlers face. Friends make better matches; enemies make real ones;
   and a grudge left to fester has consequences. Everything is deterministic from the save. */
(function installLockerRoom(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,Mem=root.OfficeMemory,Room=root.OfficeRoom;
 const clamp=(n,a=-100,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const pairKey=(a,b)=>[a,b].sort().join('|');
 const who=id=>G.W(id)||G.F(id);
 const short=id=>who(id)?.short||id;
 const week=()=>G.abs();

 function state(s=G.S){
  if(!s)return null;
  const b=s.bonds&&typeof s.bonds==='object'?s.bonds:(s.bonds={});
  b.pairs??={};b.lastScene??=-99;b.leaks??={};b.grudges??={};b.done??={};
  return b;
 }
 function get(a,b){return state()?.pairs[pairKey(a,b)]||null}
 function score(a,b){return get(a,b)?.score||0}
 function label(n){return n>=70?'Close friends':n>=35?'Allies':n<=-70?'Bitter enemies':n<=-35?'Rivals':null}
 // Move a bond and record why. Each reason is kept once per source so replays and reloads never double-count.
 function shift(a,b,d,kind,text,source){
  const st=state();if(!st||!a||!b||a===b||!d)return null;
  const k=pairKey(a,b),p=st.pairs[k]??={score:0,since:week(),history:[],betrayed:false};
  if(source){if(st.done[source+'|'+k])return null;st.done[source+'|'+k]=1;}
  const before=p.score;p.score=clamp(p.score+d);
  p.history.unshift({week:week(),kind,text,d});p.history=p.history.slice(0,6);
  if(kind==='betrayal')p.betrayed=true;
  return {before,after:p.score};
 }
 // Who a wrestler is close to and who they cannot stand, strongest first, with the reason behind it.
 function list(id){
  const st=state();if(!st)return [];
  return Object.entries(st.pairs).filter(([k,p])=>k.split('|').includes(id)&&Math.abs(p.score)>=15)
   .map(([k,p])=>{const other=k.split('|').find(x=>x!==id);return {other,name:who(other)?.name||other,score:p.score,label:label(p.score)||(p.score>0?'Getting on':'Some friction'),reason:p.history[0]?.text||'',betrayed:p.betrayed}})
   .sort((a,b)=>Math.abs(b.score)-Math.abs(a.score));
 }
 const inStable=id=>!!G.W(id);

 // ---------------------------------------------------------------------------------------------
 // After a match: the bond between your wrestler and their opponent moves with what happened,
 // read from the memory the match left behind.
 const MATCH_BOND={breakthrough:[14,'The match of their lives together.'],hurt:[-18,'A bad landing that one of them has not forgiven.'],
  humiliation:[-12,'A clean loss that still rankles.'],protected:[5,'A loss that was handled with care.'],rebellion:[-30,'A finish broken in front of everyone.'],
  discipline:[10,'Refused to go into business against the other.'],chemistry:[8,'An agreed match that came together beautifully.']};
 const originalApply=G.applyResult;
 G.applyResult=function(c,fin){
  // v0.3.12 Once per contract: a result applied again (a reload, a replay) must not move a bond twice.
  const seen=!!(c&&G.S?.history?.some(h=>h.cid===c.id));
  const out=originalApply(c,fin);
  try{if(!seen&&c&&fin&&G.S)afterMatch(c,fin,out);}catch(e){G.reportError('relationships/match',e)}
  return out;
 };
 function afterMatch(c,fin,out){
  const w=G.W(c.wid),f=G.F(c.rid);if(!w||!f)return;
  // v0.3.12 An agreed match that came together is remembered here, before the bond is read, so the
  // chemistry it built counts the first time (the match screen's later note of it is the same memory).
  const beats=fin.evidence?.beats;
  if(beats?.length&&fin.stars>=3.5&&beats.filter(b=>b.status==='achieved').length>=3&&!beats.some(b=>b.status==='missed'))
   Mem?.remember(w.id,'chemistry',w.short+' remembers how well the agreed match with '+f.short+' came together.',f.id,3,4,c.id+':chemistry');
  const mem=Mem?.view(w.id).entries.filter(e=>e.against===f.id&&String(e.id).startsWith(c.id))||[];
  // The rating first, then the memory, so the reason on the profile is the one that mattered.
  if(fin.stars>=3.5)shift(w.id,f.id,6,'match','A good night’s work together.',c.id+':stars');
  else if(fin.stars>0&&fin.stars<=1.5)shift(w.id,f.id,-4,'match','A match that never got going.',c.id+':stars');
  // A long feud stops being business.
  const feud=G.feud?.(w.id,f.id);if(feud&&!feud.closed&&feud.heat>=50)shift(w.id,f.id,-6,'feud','The feud has stopped being business.',c.id+':feud');
  for(const e of mem){const m=MATCH_BOND[e.kind];if(m)shift(w.id,f.id,m[0],e.kind==='rebellion'?'betrayal':e.kind,m[1],c.id+':'+e.kind);}
  // Betrayal from the other side: a friend with an ego, beaten clean, turns after the bell.
  const was=score(w.id,f.id),wonClean=c.finish==='win_clean'&&fin.outcome!=='nc'&&fin.outcome!=='double';
  // An arranged post-bell segment has first call on the scene; do not also invent an
  // independent betrayal that could contradict a planned handshake or beatdown.
  if(wonClean&&was>=35&&(f.ego||50)>=72&&!(c.afterPlan&&c.afterPlan!=='none')&&
    !G.S.bonds.done[c.id+':turn']){
   G.S.bonds.done[c.id+':turn']=1;
   shift(w.id,f.id,-45,'betrayal',f.short+' turned on '+w.short+' after losing clean.',c.id+':turned');
   w.fatigue=G.clamp((w.fatigue||0)+10);w.morale=G.clamp((w.morale||50)-5);
   const fd=G.feud?.(w.id,f.id);if(fd&&!fd.closed)fd.heat=G.clamp(fd.heat+10);
   Mem?.remember(w.id,'betrayed',w.short+' remembers '+f.short+', a friend, attacking them after the bell.',f.id,-2,-10,c.id+':betrayed');
   const line=f.short+' shook '+w.short+'’s hand at the bell, then hit them from behind. Friends, apparently, until somebody loses clean.';
   out?.push?.({text:'Locker room: '+line,tone:-1});
   G.msg?.({from:'Your road agent',subject:f.short+' turned on '+w.short,kind:'info',body:['“'+line+'”',w.short+' is sore and angry: fatigue +10, morale −5. The rivalry between them has heated up.']});
  }
 }

 // ---------------------------------------------------------------------------------------------
 // In Dennis's room: friends cooperate and make a better match; enemies dig in, and it looks real.
 // A leaked plan costs the wrestler whose plan it was.
 if(Room?.begin){
  const begin0=Room.begin;
  Room.begin=function(c,w,f,p,opts){
   const st=begin0(c,w,f,p,opts);
   try{
    const b=G.S?state():null,n=b?score(w.id,f.id):0,say=t=>st.log.push({who:'Dennis',side:'agent',text:t,kind:'agent'});
    if(n>=35){st.mood.w+=3;st.mood.f+=3;st.fx.bonus=(st.fx.bonus||0)+1;st.fx.crowd=(st.fx.crowd||0)+1;st.bond={score:n,label:label(n)};
     say(w.short+' and '+f.short+' get on. They’ve already started finishing each other’s spots. That always shows from the cheap seats.');}
    else if(n<=-35){st.mood.w-=3;st.mood.f-=3;st.fx.crowd=(st.fx.crowd||0)+2;st.heat=Math.max(st.heat||0,40);st.bond={score:n,label:label(n)};
     say(w.short+' and '+f.short+' can’t stand each other, and not for the cameras. It’ll look real. It might be real.');}
    const leak=b?.leaks[w.id];
    if(leak&&!leak.used){leak.used=c.id;st.mood.w-=4;st.fx.crowd=(st.fx.crowd||0)-2;
     say('Bad news. '+f.short+' knows what '+w.short+' had planned. Somebody talked. I asked around: it was '+short(leak.by)+'.');
     shift(w.id,leak.by,-20,'betrayal',short(leak.by)+' leaked '+short(w.id)+'’s plan to '+f.short+'.','leak:'+c.id);
     Mem?.remember(w.id,'betrayed',w.short+' remembers '+short(leak.by)+' leaking their plan to '+f.short+'.',null,-2,0,'leak:'+c.id);}
   }catch(e){G.reportError('relationships/backstage',e)}
   return st;
  };
 }

 // ---------------------------------------------------------------------------------------------
 // The week: shared journeys, jealousy, and one backstage scene at most every other week.
 const originalEnd=G.endWeek;
 G.endWeek=function(...args){
  const s=G.S,wk=s?{season:s.season,week:s.week}:null,played=s?s.card.map(c=>({...c})):[];
  const out=originalEnd(...args);
  try{if(s&&wk)weekly(wk,played);}catch(e){G.reportError('relationships/weekly',e)}
  return out;
 };
 function weekly(wk,played){
  const s=G.S,b=state(),now=week(),roster=s.roster.slice();
  const workedThisWeek=new Set(s.history.filter(h=>h.season===wk.season&&h.week===wk.week).map(h=>h.wid));
  const big=new Set(s.history.filter(h=>h.season===wk.season&&h.week===wk.week&&D.SLOTS[h.slot]?.rank>=2).map(h=>h.wid));
  for(let i=0;i<roster.length;i++)for(let j=i+1;j<roster.length;j++){
   const a=roster[i],c=roster[j],tag=wk.season+'-'+wk.week;
   // Shared journeys bring people together, unless both of them want the front seat.
   if(workedThisWeek.has(a.id)&&workedThisWeek.has(c.id)){
    if((a.ego||0)>=70&&(c.ego||0)>=70)shift(a.id,c.id,-2,'van','Two big egos in one van.','travel:'+tag);
    else shift(a.id,c.id,3,'travel','Shared the drive to the shows.','travel:'+tag);
   }
   // A proud wrestler left at home while a stablemate headlines takes it personally.
   for(const [x,y] of [[a,c],[c,a]])if(big.has(y.id)&&!workedThisWeek.has(x.id)&&(x.ego||0)>=65)
    shift(x.id,y.id,-8,'jealousy',x.short+' sat at home while '+y.short+' was featured.','jealous:'+tag+':'+x.id);
  }
  boilOver(now);
  if(now-b.lastScene>=2){const sc=scene();if(sc){G.msg?.(sc);b.lastScene=now;}}
 }
 // A grudge between stablemates that nobody dealt with turns into something worse.
 function boilOver(now){
  const s=G.S,b=state();
  for(const [id,g] of Object.entries(b.grudges)){
   if(g.resolved||now<g.due)continue;
   const a=G.W(id),v=G.W(g.against);g.resolved=true;
   if(!a||!v||score(a.id,v.id)>-25)continue;
   if((a.ego||0)>=70&&(a.loyal??55)<60){
    // Jump: an attack after the victim's next show, here and now.
    v.fatigue=G.clamp((v.fatigue||0)+15);v.morale=G.clamp((v.morale||50)-6);
    shift(a.id,v.id,-35,'betrayal',a.short+' jumped '+v.short+' in the car park.','jump:'+id+':'+now);
    Mem?.remember(v.id,'betrayed',v.short+' remembers being jumped in the car park by '+a.short+', a stablemate.',null,-3,0,'jump:'+id+':'+now);
    G.msg?.({from:'Your road agent',subject:a.short+' jumped '+v.short,kind:'info',body:['“It finally went off. '+a.short+' waited by '+v.short+'’s car after the show. I’ve split them up, but '+v.short+' is in a state.”',v.short+': fatigue +15, morale −6. Those two are not getting in a car together again.']});
   }else{
    // Leak: the plan for the victim's next match goes to the opponent.
    b.leaks[v.id]={by:a.id,week:now};
    shift(a.id,v.id,-10,'leak',a.short+' has been talking about '+v.short+' to the other locker room.','leaksetup:'+id+':'+now);
   }
  }
 }

 // ---------------------------------------------------------------------------------------------
 // Backstage scenes. Each is a decision in the inbox, chosen from the strongest live situation.
 function scene(){
  const s=G.S,b=state(),roster=s.roster,now=week();
  const pending=new Set(s.inbox.filter(m=>String(m.dtype).startsWith('bond_')&&!m.answer).map(m=>m.dtype));
  // 1. A grudge between stablemates: settle it now, or it festers.
  for(const a of roster)for(const v of roster){
   if(a===v||pending.has('bond_grudge'))continue;
   const n=score(a.id,v.id);
   if(n<=-25&&!b.grudges[a.id]&&(a.ego||0)>=(v.ego||0)){
    b.grudges[a.id]={against:v.id,due:now+2,resolved:false};
    return {from:a.name,subject:a.short+' and '+v.short+' need sorting out',kind:'decision',dtype:'bond_grudge',args:[a.id,v.id],
     body:['“I’m not sharing a dressing room with '+v.short+' again. Ask anyone why.”','Road agent: '+(get(a.id,v.id)?.history[0]?.text||'They have history.')+' Leave it and it will come out somewhere you don’t want it.'],
     options:[{id:'sit',label:'Sit them down together',hint:'Clears the air if they are professionals. Makes it worse if they are not.'},
      {id:'bonus',label:'Give '+a.short+' £60 and a word',hint:'£60. Buys calm, not friendship.'},
      {id:'leave',label:'Let them sort it out',hint:'Free. It may come out in a car park, or in a leak to the other side.'}]};
   }
  }
  // 2. A grudge with someone on the other side: settle it in the ring, or talk them down.
  for(const w of roster){
   if(pending.has('bond_score'))break;
   const foe=list(w.id).filter(r=>r.score<=-25&&!G.W(r.other)&&G.F(r.other)&&!b.done['score:'+pairKey(w.id,r.other)])[0];
   if(foe){
    b.done['score:'+pairKey(w.id,foe.other)]=1;const f=G.F(foe.other);
    return {from:w.name,subject:w.short+' wants another go at '+f.short,kind:'decision',dtype:'bond_score',args:[w.id,f.id],
     body:['“I want '+f.short+' again. Not for the money. Get me back in there.”','Road agent: '+(foe.reason||'There is history.')],
     options:[{id:'settle',label:'Settle it in the ring',hint:'The rivalry heats up and the promoters will want the rematch. It will not be friendly.'},
      {id:'cool',label:'Talk '+w.short+' down',hint:w.short+' is not happy about it, but the grudge eases.'},
      {id:'leave',label:'Leave it',hint:'Nothing changes. For now.'}]};
   }
  }
  // 3. A friend who is a free agent: your wrestler vouches for them.
  for(const w of roster){
   const mate=s.free.filter(x=>score(w.id,x.id)>=30).sort((x,y)=>score(w.id,y.id)-score(w.id,x.id))[0];
   if(mate&&!pending.has('bond_vouch')&&!b.done['vouch:'+mate.id]){
    b.done['vouch:'+mate.id]=1;
    return {from:w.name,subject:'Sign '+mate.short+'?',kind:'decision',dtype:'bond_vouch',args:[w.id,mate.id],
     body:['“'+mate.name+' is looking for work. I’ve been in there with '+mate.short+'. You won’t find anyone more reliable on the road.”','Road agent: '+(get(w.id,mate.id)?.history[0]?.text||'They get on.')],
     options:[{id:'talk',label:'Ask '+w.short+' to make the introduction',hint:mate.short+'’s signing fee drops by a fifth. '+w.short+' is pleased.'},
      {id:'later',label:'Not now',hint:w.short+' is a little disappointed.'}]};
   }
  }
  // 4. Close friends in the stable want to look out for each other.
  for(let i=0;i<roster.length;i++)for(let j=i+1;j<roster.length;j++){
   const a=roster[i],c=roster[j];
   if(score(a.id,c.id)>=50&&!pending.has('bond_friends')&&!b.done['friends:'+pairKey(a.id,c.id)]){
    b.done['friends:'+pairKey(a.id,c.id)]=1;
    return {from:a.name,subject:a.short+' and '+c.short,kind:'decision',dtype:'bond_friends',args:[a.id,c.id],
     body:['“'+c.short+' and I have been working out together. We want to run our own drills on the off days, if that’s all right.”','Road agent: they get on, and it shows.'],
     options:[{id:'yes',label:'Let them train together',hint:'Both lose a little fatigue each week together. Their bond grows.'},
      {id:'no',label:'Keep them on their own programmes',hint:'Both are disappointed.'}]};
   }
  }
  return null;
 }
 const originalAnswer=G.answer;
 G.answer=function(mid,opt){
  const s=G.S,m=s?.inbox.find(x=>x.id===mid);
  // The car-park row between two stablemates (an existing inbox decision) leaves a mark on their bond.
  if(m&&m.dtype==='clash'&&!m.answer){
   const out=originalAnswer(mid,opt);
   if(m.answer){const [x,y]=m.args;shift(x,y,opt==='fine'?-8:-14,'row','Had to be pulled apart in the car park.','clash:'+mid);}
   return out;
  }
  if(!m||!String(m.dtype).startsWith('bond_'))return originalAnswer(mid,opt);
  if(m.answer)return null;
  if(!m.options.some(o=>o.id===opt))return 'Choose one of the available responses.';
  const [aid,bid]=m.args,a=G.W(aid)||G.F(aid),c=G.W(bid)||G.F(bid)||s.free.find(x=>x.id===bid),b=state();let text='';
  if(!a||!c)text='That has sorted itself out.';
  else if(m.dtype==='bond_grudge'){
   const g=b.grudges[aid];
   if(opt==='sit'){const pro=((a.pro||60)+(c.pro||60))/2;
    if(pro>=72){shift(aid,bid,30,'cleared','Sat down together and cleared the air.','sit:'+mid);if(g)g.resolved=true;text='It took an hour and a pot of tea. They shook hands. '+a.short+' even laughed.';}
    else{shift(aid,bid,-10,'row','A sit-down that turned into a row.','sit:'+mid);text='It was loud. The caretaker came in to see what was going on. It is worse now.';}}
   else if(opt==='bonus'){if(s.cash<60)return 'You need £60 for that. Choose another response.';
    s.cash-=60;a.morale=G.clamp((a.morale||50)+4);shift(aid,bid,12,'calmed','Calmed down with a word and £60.','bonus:'+mid);if(g)g.resolved=true;text=a.short+' took the £60 and the point. Calm, for now.';}
   else text='You leave them to it. Somebody will sort it out. Somebody always does.';
  }
  else if(m.dtype==='bond_score'){
   if(opt==='settle'){const fd=G.feud?.(aid,bid)||(()=>{const k=aid+':'+bid;return s.feuds[k]=s.feuds[k]||{wid:aid,rid:bid,heat:0,matches:0,closed:false,since:week()};})();
    fd.closed=false;fd.heat=G.clamp((fd.heat||0)+15);shift(aid,bid,-5,'grudge','Wants to settle it in the ring.','score:'+mid);a.morale=G.clamp((a.morale||50)+3);
    text='You let it be known '+a.short+' wants '+c.short+' again. The promoters have noticed: rivalry heat '+fd.heat+'.';}
   else if(opt==='cool'){a.morale=G.clamp((a.morale||50)-3);shift(aid,bid,10,'cooled','Talked down from a grudge.','score:'+mid);text=a.short+' grumbles, but lets it go. Mostly.';}
   else text='You leave it. '+a.short+' has not.';
  }
  else if(m.dtype==='bond_vouch'){
   if(opt==='talk'){const f=s.free.find(x=>x.id===bid);if(f)f.fee=Math.round((f.fee||1000)*.8);a.morale=G.clamp((a.morale||50)+4);shift(aid,bid,5,'vouched',a.short+' vouched for '+c.short+'.','vouch:'+mid);
    text=c.short+' will talk to you, and for less: their signing fee is down a fifth. Find them in Free agents.';}
   else{a.morale=G.clamp((a.morale||50)-2);text=a.short+' shrugs. “Your loss.”';}
  }
  else if(m.dtype==='bond_friends'){
   if(opt==='yes'){shift(aid,bid,10,'training','Train together on the off days.','train:'+mid);(b.trainingPairs??=[]).push(pairKey(aid,bid));text='They’ve booked the leisure centre for Tuesdays. Lane three.';}
   else{for(const x of [a,c])x.morale=G.clamp((x.morale||50)-2);text='They are on their own programmes. They are not happy about it.';}
  }
  m.answer=opt;m.outcome=text;m.read=true;G.save();return text;
 };
 // Friends who train together recover a little faster.
 const end2=G.endWeek;
 G.endWeek=function(...args){
  const out=end2(...args);
  try{const b=state();for(const k of b?.trainingPairs||[]){const [x,y]=k.split('|').map(id=>G.W(id));if(x&&y&&score(x.id,y.id)>=35)for(const w of [x,y])w.fatigue=G.clamp((w.fatigue||0)-3);}}catch(e){G.reportError('relationships/training',e)}
  return out;
 };

 root.OfficeBonds={state,get,score,label,shift,list,pairKey};
})(typeof window!=='undefined'?window:globalThis);
