/* THE OFFICE v0.3.14 — ambitions.
   Every one of the 80 wrestlers wants something right now: a title shot, a push up the card, better
   money, a lighter schedule, a real rival, respect for the work, a bigger stage, or a youngster to
   bring through. What happens each week moves their satisfaction up or down. Get them what they want
   and they remember it. Ignore it and they ask, then they sulk, then they leave: your wrestlers
   through the inbox and their loyalty, the circuit's wrestlers through their contracts.
   Everything is deterministic from the save; nothing here draws a random number. */
(function installAmbitions(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,T=root.OfficeTerritory,V4=root.OfficeWorldV4;
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const now=()=>G.abs();
 // A stable number in [0,1) from a string: the tie-breaker that stands in for chance.
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const who=id=>G.W(id)||D.findWrestler(id);
 const nameOf=id=>who(id)?.name||id;
 const shortOf=id=>who(id)?.short||id;
 const rankOf=slot=>D.SLOTS[slot]?.rank??0;

 const KINDS={
  title:{name:'A title shot',phrase:'wants a title shot',
   ask:'“Every week somebody else is stood next to that belt. I want my name in the conversation. Get me a title match.”',
   promise:'Promise a title match',counts:'A title match on any card counts.'},
  push:{name:'A push up the card',phrase:'wants a push up the card',
   ask:'“I’m tired of opening shows to empty seats. Put me where people are paying attention.”',
   promise:'Promise a main-event spot',counts:'A main-event match counts.'},
  money:{name:'Better money',phrase:'wants better money',
   ask:'“I see what the posters say and I see what goes in my account. Those two things don’t match.”',
   promise:'',counts:'A raise counts.'},
  body:{name:'A lighter schedule',phrase:'wants a lighter schedule',
   ask:'“I can’t keep doing long, hard matches every week. I need my body to last.”',
   promise:'Promise them lighter weeks',counts:'Four easy weeks in a row count: rest, or short matches. Injuries and exhaustion set it back.'},
  rivalry:{name:'A real rival',phrase:'wants a real rival',
   ask:'“One-off matches don’t mean anything. Give me somebody I can get my teeth into.”',
   promise:'Promise the rematches',counts:'Three matches with the same opponent counts.'},
  respect:{name:'Respect for the work',phrase:'wants to be taken seriously',
   ask:'“People keep talking about everybody’s look. Nobody talks about the work. Give me a match that shuts them up.”',
   promise:'Promise a match they can shine in',counts:'A four-star match counts.'},
  stage:{name:'A bigger stage',phrase:'wants a bigger stage',
   ask:'“Small rooms are fine. They’re not where careers get made. Get me on television.”',
   promise:'Promise a television booking',counts:'Any Grand Union match, or a featured match or main event at North Crown, counts.'},
  mentor:{name:'Bring someone through',phrase:'wants to bring younger wrestlers through',
   ask:'“I’ve had my turn. Put me in with the kids and let me show them how it’s done.”',
   promise:'Promise matches with younger wrestlers',counts:'Three good matches with rookies or prospects count.'}
 };
 const KIND_ORDER=Object.keys(KINDS);
 // The long-term ambition in each newcomer's file, read as the kind of thing they keep coming back to.
 const CAREER={faye:'money',bao:'respect',zara:'push',miro:'push',aisha:'push',ellis:'respect',anya:'stage',nolan:'money',
  ivo:'respect',rina:'stage',priya:'stage',nate:'title',cass:'push',jun:'respect',sylvia:'rivalry',kofi:'push',mae:'mentor',
  theo:'respect',soraya:'money',milo:'push',winnie:'title',bronte:'push',gus:'mentor',nikita:'push',jett:'push',alina:'title',
  cedric:'mentor',marisol:'respect',felix:'stage',eira:'respect',gideon:'mentor',vera:'rivalry',tomas:'push',ari:'stage',
  tomasash:'mentor',kezia:'push',dev:'mentor',liya:'respect',emmett:'mentor',nadia:'stage',leandro:'stage',iris:'body',
  kellan:'push',ayla:'respect',sasha:'push',morgan:'money',noelle:'respect',ash:'push',zane:'respect',elodie:'title',
  bashir:'rivalry',cleo:'rivalry'};
 const TV=new Set(['crown','union']);
 const MAX_LOG=60,STALE=14,ASK_GAP=5,PROMISE_WEEKS=4;
 // Four easy weeks in a row cannot be delivered in four weeks if this one is not easy, so a little longer.
 const promiseWeeks=kind=>kind==='body'?PROMISE_WEEKS+2:PROMISE_WEEKS;

 // ---------------------------------------------------------------------------------------------
 // State: one entry per wrestler under s.ambitions.w, plus a short log of the stable's matches.
 function state(s=G.S){
  if(!s)return null;
  const a=s.ambitions&&typeof s.ambitions==='object'?s.ambitions:(s.ambitions={});
  a.w??={};a.log??=[];a.done??={};a.lastAsk??=-99;a.walked??=-99;
  if(!a.ready){a.ready=true;const map=ladders(s);for(const w of D.ALL)if(!a.w[w.id])a.w[w.id]=start(w.id,map,s);}
  return a;
 }
 function entry(id){const a=state();if(!a||!D.findWrestler(id))return null;return a.w[id]??=start(id,ladders());}
 function start(id,map,s=G.S){
  const w=who(id),kind=pick(id,map,{}),loyal=w?.loyal??55;
  const e={kind,since:s?(s.season-1)*16+s.week:1,sat:clamp(50+(loyal-55)/3,30,72),target:null,met:{},count:0,cool:{},low:0,promise:null,lastAsk:-99,told:false,history:[],wageAt:w?.wage||0,good:0};
  setTarget(id,e);
  return e;
 }
 // The best place a wrestler holds on any promotion's card this week: {rank, slot, pid}.
 function ladders(s=G.S){
  const map={},t=s?.territory;if(!t?.cards)return map;
  for(const p of D.PROMOS)for(const div of D.DIVISION_ORDER)for(const row of T.promotionRank(p.id,div,t,s)){
   const r=rankOf(row.slot),old=map[row.id];
   if(!old||r>old.rank||(r===old.rank&&p.reach>(D.PROMOS.find(x=>x.id===old.pid)?.reach||0)))map[row.id]={rank:r,slot:row.slot,pid:p.id};
  }
  return map;
 }
 function enemy(id){return (root.OfficeBonds?.list(id)||[]).filter(r=>r.score<=-35&&D.findWrestler(r.other))[0]||null;}
 function onTV(id,s=G.S){const t=s?.territory;return [...TV].some(pid=>t?.cards?.[pid]?.[id]);}
 function holds(id){return (T.titlesOf(id)||[]).length>0;}
 // What a wrestler wants most right now, from who they are and where they stand.
 function scores(id,map){
  const w=who(id)||{},ego=w.ego??55,heat=w.heat??50,pro=w.pro??70,ring=w.ring??65,loyal=w.loyal??55,safe=w.safe??70,age=w.age??30;
  const top=map[id]?.rank??0,foe=enemy(id),hurt=!!w.injury||(w.fatigue||0)>=60;
  const out={
   title:holds(id)?-99:ego*.3+heat*.3+(top>=3?20:top>=2?5:-15),
   push:ego*.25+heat*.1+(top>=3?-40:top>=2?0:12),
   money:(100-loyal)*.5+ego*.2+((w.wage||150)<heat*3?10:0)-2,
   body:(age>=36?25:0)+(hurt?30:0)+(100-safe)*.15+(pro-50)*.15+8,
   rivalry:foe?45+Math.abs(foe.score)*.3:ego*.2+(pro-60)*.1+12,
   respect:pro*.25+ring*.2-heat*.25+6,
   stage:heat*.25+ring*.15+(onTV(id)?-12:8),
   mentor:(age>=36?28:-30)+pro*.2-ego*.2
  };
  if(CAREER[id])out[CAREER[id]]+=25;
  const season=G.S?.season||1;
  for(const k of KIND_ORDER)out[k]+=hash(id+':'+k+':'+season)*12;
  return out;
 }
 function pick(id,map,cool){
  const sc=scores(id,map),wk=G.S?now():1;
  return KIND_ORDER.filter(k=>!(cool[k]>wk)&&sc[k]>-50).sort((x,y)=>sc[y]-sc[x]||x.localeCompare(y))[0]||'push';
 }
 function setTarget(id,e){e.target=e.kind==='rivalry'?enemy(id)?.other||null:null;}
 function rechoose(id,e,map,why){
  const old=e.kind;
  e.cool[old]=now()+8;
  e.kind=pick(id,map,e.cool);e.since=now();e.met={};e.count=0;e.good=0;e.low=0;e.promise=null;
  e.wageAt=who(id)?.wage||0;setTarget(id,e);
  if(G.W(id))e.told=false;
  return {old,kind:e.kind,why};
 }

 // ---------------------------------------------------------------------------------------------
 // Your matches are logged as they finish, for both wrestlers in the ring.
 const originalApply=G.applyResult;
 G.applyResult=function(c,fin){
  const out=originalApply(c,fin);
  try{
   const a=state();
   if(a&&c?.id&&!a.done['m:'+c.id]){
    a.done['m:'+c.id]=1;
    const won=fin.outcome==='nc'?null:fin.outcome==='double'||!!D.FINISHES[c.finish]?.win;
    const base={a:now(),pid:c.pid,slot:c.slot,stars:fin.stars||0,title:!!c.title,minutes:fin.minutes||D.SLOTS[c.slot]?.mins||10,injured:!!fin.injury};
    a.log.unshift({...base,id:c.wid,opp:c.rid,won,purse:c.purse||0});
    a.log.unshift({...base,id:c.rid,opp:c.wid,won:won===null?null:!won,injured:false});
    a.log=a.log.slice(0,MAX_LOG);
    const keys=Object.keys(a.done);if(keys.length>60)for(const k of keys.slice(0,keys.length-60))delete a.done[k];
   }
  }catch(e){}
  return out;
 };
 // Everything one wrestler did in the week just played: your stable's shows and the circuit's.
 function weekMatches(id,wk,s=G.S){
  const a=state(s),mine=a.log.filter(m=>m.a===wk&&m.id===id);
  const res=s.territory?.lastResults;
  const circuit=res&&res.week===wk+1?res.matches.filter(m=>m.a===id||m.b===id).map(m=>({
   a:wk,pid:m.pid,slot:m.a===id?m.slotA:m.slotB,opp:m.a===id?m.b:m.a,won:m.winner===id,title:!!m.title,stars:m.stars,minutes:D.SLOTS[m.a===id?m.slotA:m.slotB]?.mins||10,circuit:true})):[];
  return [...mine,...circuit];
 }

 // ---------------------------------------------------------------------------------------------
 // The week: what happened moves each wrestler's satisfaction; some ambitions are met.
 function progress(id,e,ms,map){
  const w=who(id)||{},mine=!!G.W(id),imp=.6+(w.ego??55)/100,worked=ms.length>0;
  const best=ms.reduce((r,m)=>Math.max(r,rankOf(m.slot)),-1);
  let d=0,met=null;
  switch(e.kind){
   case 'title':{
    const shot=ms.find(m=>m.title);
    if(holds(id)){d+=4;met='Won a championship.';}
    else if(shot){d+=8;met=shot.won?'Won a championship.':'Got a title match.';}
    else d+=(map[id]?.rank??0)>=3?1:-2*imp;
    if(!worked)d-=.5*imp;
    break;}
   case 'push':{
    if(best>=3){d+=6;met='Worked a main event.';}
    else d+=best===2?2:best===1?-1:best===0?-3*imp:-1.5*imp;
    break;}
   case 'money':{
    if(mine&&(w.wage||0)>e.wageAt){d+=10;met='Got a raise.';}
    else d+=ms.some(m=>(m.purse||0)>=400)?2:-1.2*imp;
    break;}
   case 'body':{
    if(w.injury||ms.some(m=>m.injured))d-=5;
    if(mine&&(w.fatigue||0)>=65)d-=3;
    if(!worked)d+=2;else d+=ms.some(m=>m.minutes>15)?-1.5:.5;
    e.good=(e.good||0)+(d>0?1:d<0?-e.good:0);
    if(e.good>=4){met='Feels fit and fresh again.';}
    break;}
   case 'rivalry':{
    for(const m of ms)if(m.opp)e.met[m.opp]=(e.met[m.opp]||0)+1;
    const vs=e.target?ms.filter(m=>m.opp===e.target):ms.filter(m=>(e.met[m.opp]||0)>=2);
    if(vs.length){d+=6+(vs.some(m=>m.won)?3:0);}
    else d-=1.2*imp;
    const n=e.target?(e.met[e.target]||0):Math.max(0,...Object.values(e.met));
    if(n>=3)met='Had their rivalry out over three matches.';
    break;}
   case 'respect':{
    if(mine||ms.some(m=>!m.circuit)){
     const top=Math.max(0,...ms.filter(m=>!m.circuit).map(m=>m.stars));
     if(top>=4){d+=12;met='Had a four-star match.';}
     else if(top>=3.5)d+=6;else if(worked&&top<2.5)d-=3;else if(!worked)d-=1*imp;
    }else{
     const big=ms.filter(m=>m.won&&rankOf(m.slot)>=2).length;
     e.count+=big;d+=big?3:-.5*imp;
     if(e.count>=3)met='Won three big matches on the circuit.';
    }
    break;}
   case 'stage':{
    const tv=ms.filter(m=>TV.has(m.pid));
    if(tv.some(m=>m.pid==='union'||rankOf(m.slot)>=2)){d+=8;met='Got a television spot.';}
    else if(tv.length)d+=4;else d-=1.5*imp;
    break;}
   case 'mentor':{
    const kids=ms.filter(m=>['Rookie','Prospect'].includes(who(m.opp)?.tier)&&(m.circuit||m.stars>=3));
    e.count+=kids.length;d+=kids.length?4:-.5;
    if(e.count>=3)met='Brought three younger wrestlers through good matches.';
    break;}
  }
  return {d,met};
 }
 function fulfil(id,e,text,map,lines){
  const kind=e.kind,promised=!!e.promise;
  e.sat=clamp(e.sat+15);
  e.history.unshift({week:now(),kind,text,promised});e.history=e.history.slice(0,3);
  const w=G.W(id);
  if(w){
   w.morale=G.clamp((w.morale||50)+5);
   if(promised){w.loyal=G.clamp((w.loyal||50)+8);G.S.business.kept++;}
   root.OfficeMemory?.remember(id,'ambition',w.short+' remembers getting '+KINDS[kind].name.toLowerCase()+(promised?', as promised':'')+'.',null,promised?4:2,0,'amb:'+id+':'+now());
  }
  const next=rechoose(id,e,map,'met');
  if(w)lines.push({id,kind,text,promised,next:next.kind});
  return next;
 }
 function weekly(wk){
  const s=G.S,a=state();if(!s||!a||a.lastWeek===wk)return;
  a.lastWeek=wk;
  a.log=a.log.filter(m=>m.a>=wk);
  const map=ladders(s),met=[],broken=[];
  for(const w of D.ALL){
   const id=w.id,e=a.w[id]??=start(id,map);
   const ms=weekMatches(id,wk,s);
   const {d,met:why}=progress(id,e,ms,map);
   // The circuit's bookers do not plan around anyone's ambitions yet, so its wrestlers are a little more patient.
   const felt=d<0&&!G.W(id)?d*.6:d;
   e.sat=clamp(e.sat+felt+(50-e.sat)*.06);
   for(const k in e.cool)if(e.cool[k]<=now())delete e.cool[k];
   if(why){fulfil(id,e,why,map,met);continue;}
   e.low=e.sat<20?e.low+1:0;
   // A promise that ran out.
   if(e.promise&&now()>e.promise.by){
    // Preserve the original promise before expiry can reroll the wrestler's ambition.
    const kind=e.kind,deadline=e.promise.by,made=e.promise.made;
    const weeks=Number.isFinite(made)?Math.max(1,deadline-made):promiseWeeks(kind);
    e.promise=null;e.sat=clamp(e.sat-20);
    const m=G.W(id);
    if(m){m.loyal=G.clamp((m.loyal||50)-12);m.morale=G.clamp((m.morale||50)-10);s.business.broken++;broken.push({id,kind,weeks,deadline});
     root.OfficeMemory?.remember(id,'ambition',m.short+' remembers being promised '+KINDS[kind].name.toLowerCase()+' and not getting it.',null,-6,0,'ambbroken:'+id+':'+now());}
   }
   // A target that left, or an ambition that has gone nowhere for a long time, gives way to another.
   if(e.kind==='rivalry'&&e.target&&!D.findWrestler(e.target))setTarget(id,e);
   if(now()-e.since>=STALE&&!e.promise)rechoose(id,e,map,'stale');
   if(e.kind==='title'&&holds(id))rechoose(id,e,map,'held');
  }
  for(const w of s.roster){
   const e=a.w[w.id];if(!e)continue;
   if(e.sat>=70)w.morale=G.clamp((w.morale||50)+1);
   if(e.sat<30)w.morale=G.clamp((w.morale||50)-2);
   if(e.sat<25)w.loyal=G.clamp((w.loyal||50)-1);
   if(e.sat>=80&&now()%2===0)w.loyal=G.clamp((w.loyal||50)+1);
  }
  for(const x of met){
   const w=G.W(x.id);if(!w)continue;const e=a.w[x.id];e.told=true;
   G.msg({from:w.name,subject:'Got what I wanted',kind:'info',body:[
    `${x.text} ${x.promised?'You said you would make it happen, and you did.':'It took long enough, but it happened.'}`,
    `${w.short} is happier for it.${x.promised?' Loyalty +8.':''}`,
    `Next, ${w.short} ${KINDS[x.next].phrase}. ${KINDS[x.next].counts}`]});
  }
  for(const {id,kind,weeks} of broken){const w=G.W(id);if(w)G.msg({from:w.name,subject:'You promised',kind:'info',body:[
   `“You told me you’d get me ${KINDS[kind].name.toLowerCase()}. You gave yourself ${weeks} weeks. Nothing.”`,`${w.short}: loyalty −12, morale −10.`]});}
  introduce();
  ask();
 }

 // ---------------------------------------------------------------------------------------------
 // Your wrestlers say what they want, and come back when it is not happening.
 function introduce(){
  const s=G.S,a=state();if(!s||!a)return;
  const fresh=s.roster.filter(w=>a.w[w.id]&&!a.w[w.id].told);
  if(!fresh.length)return;
  for(const w of fresh)a.w[w.id].told=true;
  if(fresh.length===1){
   const w=fresh[0],e=a.w[w.id],own=D.findWrestler(w.id)?.ambition;
   G.msg({from:w.name,subject:'What I want',kind:'info',body:[KINDS[e.kind].ask,
    `Road agent: ${w.short} ${KINDS[e.kind].phrase}. ${KINDS[e.kind].counts}${own?' In the long run: '+own.charAt(0).toLowerCase()+own.slice(1)+'.':''}`]});
  }else G.msg({from:'Your road agent',subject:'What the locker room wants',kind:'info',body:[
   'I asked them all what they want. Here is what they told me:',
   ...fresh.map(w=>`• ${w.short} ${KINDS[a.w[w.id].kind].phrase}. ${KINDS[a.w[w.id].kind].counts}`),
   'Their profiles show how close each of them is. Leave it too long and they will come and ask you.']});
 }
 function ask(){
  const s=G.S,a=state();if(!s||!a)return;
  if(s.inbox.some(m=>m.dtype==='amb_ask'&&!m.answer)||now()-a.lastAsk<2)return;
  const w=s.roster.map(w=>({w,e:a.w[w.id]})).filter(({e})=>e&&e.told&&!e.promise&&e.sat<35&&now()-e.lastAsk>=ASK_GAP)
   .sort((x,y)=>x.e.sat-y.e.sat||x.w.id.localeCompare(y.w.id))[0];
  if(!w)return;
  const {w:x,e}=w,k=KINDS[e.kind];
  e.lastAsk=now();a.lastAsk=now();
  const first=e.kind==='money'
   ?{id:'raise',label:'Give them £40 a week more',hint:'Wage +£40 a week, from now on. That settles it.'}
   :{id:'promise',label:k.promise,hint:`Satisfaction up now. Deliver within ${promiseWeeks(e.kind)} weeks and loyalty rises; miss it and it falls hard.`};
  G.msg({from:x.name,subject:k.name,kind:'decision',dtype:'amb_ask',args:[x.id],body:[k.ask,`Road agent: ${x.short} is ${mood(e.sat).toLowerCase()}. ${progressText(x.id,e)}`],
   options:[first,
    {id:'honest',label:'Be straight with them',hint:'Tell them where they stand. A professional takes it well; others less so.'},
    {id:'dismiss',label:'Tell them to earn it',hint:'Costs nothing now. A proud wrestler will not forget it.'}]});
 }
 const originalAnswer=G.answer;
 G.answer=function(mid,opt){
  const s=G.S,m=s?.inbox.find(x=>x.id===mid);
  if(!m||m.dtype!=='amb_ask')return originalAnswer(mid,opt);
  if(m.answer)return null;
  if(!m.options.some(o=>o.id===opt))return 'Choose one of the available responses.';
  const w=G.W(m.args[0]),e=w&&entry(w.id);let text;
  if(!w||!e)text='That has sorted itself out.';
  else if(opt==='raise'){w.wage+=40;e.sat=clamp(e.sat+10);text=`${w.short} shakes your hand. £40 a week more from now on.`;}
  else if(opt==='promise'){e.promise={made:now(),by:now()+promiseWeeks(e.kind)};e.sat=clamp(e.sat+12);w.morale=G.clamp((w.morale||50)+4);
   text=`You promised ${w.short} ${KINDS[e.kind].name.toLowerCase()} within ${promiseWeeks(e.kind)} weeks. ${KINDS[e.kind].counts}`;}
  else if(opt==='honest'){
   if((w.pro||70)>=75){e.sat=clamp(e.sat+6);w.loyal=G.clamp((w.loyal||50)+2);text=`${w.short} listens. “Fair enough. At least you told me.”`;}
   else{e.sat=clamp(e.sat-4);text=`${w.short} heard “no” and nothing else.`;}
  }else{
   e.sat=clamp(e.sat-10);
   if((w.ego||50)>=70){w.loyal=G.clamp((w.loyal||50)-8);text=`${w.short} goes very quiet. That one will be remembered. Loyalty −8.`;
    root.OfficeMemory?.remember(w.id,'ambition',w.short+' remembers being told to earn it.',null,-4,0,'ambdismiss:'+mid);}
   else text=`${w.short} nods and walks off. Not happy, but not going anywhere.`;
  }
  m.answer=opt;m.outcome=text;m.read=true;G.save();return text;
 };
 const originalSign=G.sign;
 G.sign=function(id){
  const out=originalSign(id);
  try{if(out==null){const e=entry(id);if(e){e.sat=Math.max(e.sat,55);e.wageAt=G.W(id)?.wage||e.wageAt;e.told=false;e.promise=null;introduce();G.save();}}}catch(err){}
  return out;
 };
 const originalEnd=G.endWeek;
 G.endWeek=function(...args){
  const wk=G.S?now():null;
  const out=originalEnd(...args);
  try{if(wk!==null){weekly(wk);G.save();}}catch(e){}
  return out;
 };

 // ---------------------------------------------------------------------------------------------
 // The circuit's wrestlers vote with their feet: renewals turned down, and walk-outs.
 if(V4){
  const originalEvolve=V4.evolve;
  V4.evolve=function(s,t,week,reports){
   const a=state(s),w=s?.worldV4;
   if(a&&w&&w.lastEvolvedWeek!==week){
    for(const team of t.teams)for(const id of [...team.roster]){
     const c=w.contracts[id],e=a.w[id],agency=w.agencies[team.id];
     if(!c||!e||c.owner!=='ai'||c.expiresWeek===null||week<c.expiresWeek)continue;
     if(e.sat<30){
      if(V4.releaseAI(s,id,week)){e.sat=clamp(e.sat+10);reports.push(`${nameOf(id)} turned down a new deal with ${team.name} and is a free agent: ${KINDS[e.kind].phrase}.`);}
     }else if(e.kind==='money'&&agency&&agency.cash>agency.weeklyPayroll*2+c.wage*4){
      c.wage=Math.round(c.wage*1.15);
      fulfil(id,e,`Got a raise from ${team.name}.`,ladders(s),[]);
      reports.push(`${team.manager} gave ${nameOf(id)} a raise to keep them at ${team.name}.`);
     }
    }
   }
   const out=originalEvolve.call(this,s,t,week,reports);
   if(a&&w&&a.walked!==week){
    const gone=t.teams.flatMap(team=>team.roster.map(id=>({id,team,e:a.w[id]})))
     .filter(x=>x.e&&x.e.low>=3&&(who(x.id)?.ego||0)>=65&&w.contracts[x.id]?.owner==='ai'&&x.team.roster.length>3)
     .sort((x,y)=>x.e.sat-y.e.sat||x.id.localeCompare(y.id))[0];
    if(gone&&V4.releaseAI(s,gone.id,week)){
     a.walked=week;gone.e.low=0;gone.e.sat=45;
     reports.unshift(`${nameOf(gone.id)} walked out on ${gone.team.name}: ${KINDS[gone.e.kind].phrase}.`);
    }
   }
   return out;
  };
 }

 // ---------------------------------------------------------------------------------------------
 // For the screens.
 function mood(sat){return sat>=75?'Content':sat>=50?'Patient':sat>=35?'Restless':sat>=20?'Frustrated':'Fed up';}
 function progressText(id,e){
  const map=ladders(),spot=map[id],where=spot?`${D.SLOTS[spot.slot].name.toLowerCase()} at ${D.PROMOS.find(p=>p.id===spot.pid)?.name}`:'nowhere on the cards yet';
  switch(e.kind){
   case 'title':return holds(id)?'Holds a championship.':`Best spot: ${where}. Promoters offer title matches to their main-event names.`;
   case 'push':return `Best spot: ${where}.`;
   case 'money':return `On ${G.money(who(id)?.wage||0)} a week.`;
   case 'body':return `${e.good||0} of 4 easy weeks in a row.`;
   case 'rivalry':{
    if(e.target)return `Wants ${nameOf(e.target)}: ${e.met[e.target]||0} of 3 matches so far.`;
    const best=Object.entries(e.met).sort((x,y)=>y[1]-x[1])[0];
    return best?`Closest: ${best[1]} of 3 matches with ${shortOf(best[0])}.`:'No regular opponent yet.';}
   case 'respect':return G.W(id)?`Best match so far: ${Math.max(0,...(G.S.history||[]).filter(h=>h.wid===id).map(h=>h.stars))} stars.`:`${e.count} of 3 big wins.`;
   case 'stage':return onTV(id)?'Already on a television card. Needs a bigger spot there.':'Not on a television card yet.';
   case 'mentor':return `${e.count} of 3 good matches with younger wrestlers.`;
  }
  return '';
 }
 function view(id){
  const e=entry(id);if(!e)return null;
  const k=KINDS[e.kind],own=D.findWrestler(id)?.ambition||null;
  return {kind:e.kind,name:k.name,phrase:k.phrase,counts:k.counts,sat:e.sat,mood:mood(e.sat),progress:progressText(id,e),
   words:own,target:e.target,promise:e.promise?{...e.promise}:null,history:e.history.slice()};
 }
 // Whether an offer would give this wrestler what they want.
 function fits(o,w){
  const e=entry(w?.id);if(!e||!o)return null;
  const k=e.kind,short=w.short;
  if(k==='title'&&o.title)return `${short} wants a title shot. This is one.`;
  if(k==='push'&&o.slot==='main')return `${short} wants a push. A main event is exactly that.`;
  if(k==='stage'&&(o.pid==='union'||(o.pid==='crown'&&rankOf(o.slot)>=2)))return `${short} wants a bigger stage. This is television.`;
  if(k==='rivalry'&&(o.rid===e.target||(!e.target&&(e.met[o.rid]||0)>=1)))return `${short} wants a real rival. ${shortOf(o.rid)} fits.`;
  if(k==='mentor'&&['Rookie','Prospect'].includes(who(o.rid)?.tier))return `${short} wants to bring younger wrestlers through. ${shortOf(o.rid)} is one.`;
  if(k==='respect'&&rankOf(o.slot)>=2)return `${short} wants respect for the work. A long match gives them the time.`;
  if(k==='body'&&rankOf(o.slot)<=1)return `${short} wants a lighter schedule. A short match suits.`;
  return null;
 }
 // How hard this wrestler is pushing for what they want: used by the bookers in a later update.
 function pressure(id){const e=entry(id);return e?clamp((100-e.sat)*(.6+(who(id)?.ego??55)/100)):0;}

 root.OfficeAmbitions={KINDS,CAREER,state,entry,view,fits,mood,pressure,weekly,progressText};
})(typeof window!=='undefined'?window:globalThis);
