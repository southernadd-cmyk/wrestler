/* THE OFFICE v0.3.18 — programmes: your wrestlers in the bookers' storylines.
   A promoter can now offer you a whole storyline rather than one match: a title chase (a couple of
   wins, then the title match), a grudge settled over three matches, or a push from the bottom of the
   card to a match with a main-event name. Every date and every finish is on the table before you sign,
   as always, and signing books all of them. See it through and the promoter trusts you more; walk out
   and they remember. And bookers being bookers, the ending can change the week before.
   Deterministic: nothing here draws a random number. */
(function installProgrammes(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,T=root.OfficeTerritory;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const who=id=>G.W(id)||D.findWrestler(id)||{};
 const name=id=>who(id).name||id,short=id=>who(id).short||name(id);
 const weekLabel=a=>`S${Math.floor((a-1)/16)+1} W${(a-1)%16+1}`;
 const OFFER_GAP=4,KEPT_TRUST=8,KEPT_REP=3,WALK_TRUST=15,COLLAPSE_TRUST=8;
 const TYPE_NAME={title:'Title chase',grudge:'Grudge',rise:'Rising star'};
 // How likely each booker is to change the ending the week before, and to give your wrestler the win.
 const STYLE={aggressive:{swerve:.15,win:.5},showman:{swerve:.3,win:.5},traditional:{swerve:.05,win:.6},cold:{swerve:.1,win:.45}};
 const styleOf=p=>STYLE[p.personality]||STYLE.traditional;

 function state(t=G.S?.territory){
  if(!t)return null;
  const st=t.programmes&&typeof t.programmes==='object'?t.programmes:(t.programmes={});
  st.live??=[];st.done??=[];st.offered??=[];st.lastOffer??=-99;st.n??=0;
  return st;
 }
 // Belts and wrestlers a programme has a claim on, live or on offer: the booking office leaves them alone.
 // An offered programme's claim is kept here, with the week its offer runs out, rather than read from the
 // offers list: the list is trimmed at the start of a week, before the bookers plan, so reading it would
 // make the start screen's prediction (taken the week before) disagree with the real week.
 function claims(s,t,week=null){
  const st=t?.programmes,live=[...(st?.live||[]),...(st?.offered||[]).filter(x=>week==null||x.until>=week)];
  return {belts:new Set(live.filter(x=>x.type==='title').map(x=>x.pid+':'+x.div)),
   cast:new Set(live.flatMap(x=>x.beats.filter(b=>!b.done).map(b=>b.rid)))};
 }

 // ---------------------------------------------------------------------------------------------
 // What a promoter might offer one of your wrestlers.
 function pool(s,t,pid,div){return T.promotionRank(pid,div,t,s).filter(w=>!w.owned&&T.contracted(s,w.id));}
 function finishFor(win,salt){return win?(hash(salt+'f')<.6?'win_clean':'win_dirty'):(hash(salt+'f')<.5?'lose_protected':'lose_clean');}
 function propose(s,t,p,w,week){
  const div=D.divisionOf(w.id),ranked=T.promotionRank(p.id,div,t,s),row=ranked.find(x=>x.id===w.id);
  if(!row||row.matches<1)return [];
  const others=pool(s,t,p.id,div),aiCast=new Set(Object.values(t.booking?.promos||{}).flatMap(x=>x.live.flatMap(y=>[y.a,y.b])));
  const free=others.filter(x=>!aiCast.has(x.id));
  const amb=s.ambitions?.w?.[w.id]?.kind,prefer=root.OfficeBooking?.STYLE?.[p.personality]?.prefer||['title','grudge','rise'];
  const out=[],trust=p.trust||50,lean=pref=>(3-prefer.indexOf(pref))*10;
  const {belts}=claims(s,t);
  const holder=t.titles?.[p.id]?.[div]?.holder;
  const aiChase=(t.booking?.promos?.[p.id]?.live||[]).some(x=>x.type==='title'&&x.div===div);
  if(['main','feature'].includes(row.slot)&&holder&&holder!==w.id&&!G.W(holder)&&T.contracted(s,holder)&&!aiChase&&!belts.has(p.id+':'+div)){
   out.push({type:'title',rid:holder,v:lean('title')+(amb==='title'?25:0)+trust*.2});
  }
  const bond=id=>s.bonds?.pairs?.[[w.id,id].sort().join('|')]?.score||0;
  const feud=Object.values(s.feuds||{}).filter(f=>f.wid===w.id&&!f.closed&&f.heat>=40&&others.some(x=>x.id===f.rid)).sort((x,y)=>y.heat-x.heat)[0];
  const foe=feud?.rid||others.filter(x=>bond(x.id)<=-25).sort((x,y)=>bond(x.id)-bond(y.id)||x.id.localeCompare(y.id))[0]?.id;
  if(foe&&!aiCast.has(foe))out.push({type:'grudge',rid:foe,v:lean('grudge')+(amb==='rivalry'?25:0)+trust*.2});
  if(['opener','mid'].includes(row.slot)&&row.matches>=2){
   const star=free.filter(x=>x.slot==='main'&&x.id!==holder).sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id))[0];
   if(star)out.push({type:'rise',rid:star.id,v:lean('rise')+(['push','respect','stage'].includes(amb)?20:0)+trust*.2});
  }
  return out.map(x=>({...x,v:x.v+hash(p.id+w.id+x.type+week)*10,p,w,div,row,free}));
 }
 function build(s,t,c,week){
  const {p,w,div,row,free,type,rid}=c,id='prog-'+(++state(t).n)+'-'+week,start=week+2;
  const cfg=styleOf(p),business=t.business?.[p.id];
  const opponents=(n,above)=>{
   const pick=free.filter(x=>x.id!==rid&&(!above||x.score>row.score)).sort((x,y)=>Math.abs(x.score-row.score)-Math.abs(y.score-row.score)||x.id.localeCompare(y.id));
   const list=pick.length>=n?pick:free.filter(x=>x.id!==rid);
   return list.slice(0,n).map(x=>x.id);
  };
  // The booker's call on the big one, made now, as with every offer.
  const chance=clamp(cfg.win+((p.trust||50)-50)/200+(business?.desperate?.1:0)+(type==='rise'?.1:0),.15,.85);
  const payoffWin=hash(id+':payoff')<chance;
  let beats;
  if(type==='title'){
   const builds=p.personality==='traditional'||p.personality==='cold'?2:1;
   beats=opponents(builds).map((r,k)=>({at:start+k,rid:r,slot:'feature',finish:finishFor(true,id+k)}));
   beats.push({at:start+beats.length,rid,slot:'main',finish:finishFor(payoffWin,id),title:{pid:p.id,div}});
  }else if(type==='grudge'){
   const first=hash(id+':first')<.5;
   beats=[{at:start,rid,slot:'feature',finish:finishFor(first,id+0)},{at:start+2,rid,slot:'feature',finish:finishFor(!first,id+1)},
    {at:start+4,rid,slot:'main',finish:finishFor(payoffWin,id),blowoff:true}];
  }else{
   beats=opponents(2,true).map((r,k)=>({at:start+k*2,rid:r,slot:k?'feature':'mid',finish:finishFor(true,id+k)}));
   beats.push({at:start+beats.length*2,rid,slot:'main',finish:finishFor(payoffWin,id)});
  }
  if(beats.length<2)return null;
  const programme={id,pid:p.id,div,type,wid:w.id,rid,beats:beats.map(b=>({...b,done:false,cid:null})),offered:week,swerved:false};
  const pay=beats.at(-1);
  return {id:'o-'+id,pid:p.id,rid:pay.rid,slot:pay.slot,finish:pay.finish,wid:w.id,tag:'Programme',boost:1.2,haggled:true,
   eventAbs:beats[0].at,expiresAbs:week+1,programme,...(pay.title?{title:{...pay.title}}:{})};
 }
 function offer(s,t,week){
  const st=state(t);
  if(week-st.lastOffer<OFFER_GAP||s.offers.some(o=>o.programme)||!s.roster.length)return null;
  const busy=new Set(st.live.map(x=>x.wid));
  const options=s.promoters.filter(p=>G.eligible(p)&&p.trust>=40).flatMap(p=>s.roster.filter(w=>!busy.has(w.id)&&!w.injury).flatMap(w=>propose(s,t,p,w,week)))
   .sort((x,y)=>y.v-x.v||x.p.id.localeCompare(y.p.id));
  if(!options.length||hash('prog-week:'+week)>.6)return null;
  const o=build(s,t,options[0],week);if(!o)return null;
  st.lastOffer=week;s.offers.unshift(o);
  st.offered.push({id:o.programme.id,pid:o.pid,div:o.programme.div,type:o.programme.type,until:o.expiresAbs,beats:o.programme.beats.map(b=>({rid:b.rid,done:false}))});
  const p=options[0].p,w=options[0].w,pay=o.programme.beats.at(-1);
  G.msg({from:`${p.voice}, ${p.name}`,subject:`A programme for ${w.short}`,kind:'info',body:[
   o.programme.type==='title'?`“I want ${w.name} in the title picture. A win or two to get there, then ${name(pay.rid)} for the ${D.belt(p.id,o.programme.div).name}.”`
   :o.programme.type==='grudge'?`“${w.short} and ${short(pay.rid)} can’t stand each other, and the crowd can tell. Three matches. Let’s settle it properly.”`
   :`“${w.short} has been working hard at the bottom of my card. Let’s see what happens if I push them, all the way to ${name(pay.rid)}.”`,
   `Every date and every finish is in the offer. Sign it and you are committed to all of it. Reply by ${weekLabel(o.expiresAbs)}.`]});
  return o;
 }

 // ---------------------------------------------------------------------------------------------
 // Signing a programme books every match in it.
 const originalBook=G.book;
 G.book=function(oid,wid){
  const s=G.S,o=s?.offers.find(x=>x.id===oid);
  if(!o?.programme)return originalBook(oid,wid);
  const w=G.W(wid),prog=o.programme;
  if(!w||w.id!==prog.wid)return `This programme is for ${name(prog.wid)}.`;
  if(o.expiresAbs<G.abs())return 'That offer has expired.';
  const clash=prog.beats.find(b=>!G.availableAt(w,b.at));
  if(clash)return `${w.short} isn’t free on ${weekLabel(clash.at)}. Every date in a programme has to be clear.`;
  for(const [k,b] of prog.beats.entries()){
   const fd=G.feud?.(w.id,b.rid);
   const c={id:'c-'+prog.id+'-'+k,pid:prog.pid,rid:b.rid,wid:w.id,slot:b.slot,minutes:D.SLOTS[b.slot].mins+(b.blowoff?5:0),finish:b.finish,
    purse:G.purse({pid:prog.pid,slot:b.slot,finish:b.finish,boost:o.boost},w),tag:k===prog.beats.length-1?(prog.type==='title'?'Title match':b.blowoff?'Blow-off':'Programme'):'Programme',
    feudHeat:fd&&!fd.closed?fd.heat:0,blowoff:!!b.blowoff,eventAbs:b.at,programme:{id:prog.id,step:k},...(b.title?{title:{...b.title}}:{})};
   b.cid=c.id;
   if(b.at===G.abs())s.card.push(c);else s.futureBookings.push(c);
  }
  s.offers=s.offers.filter(x=>x!==o);
  const st=state(s.territory);
  st.live.push({...prog,signed:G.abs()});st.offered=st.offered.filter(x=>x.id!==prog.id);
  if(prog.pid==='union')s.goals.union=true;
  const p=G.P(prog.pid);
  G.msg({from:`${p.voice}, ${p.name}`,subject:'We have a programme',kind:'info',body:[`“Good. ${w.short} starts ${weekLabel(prog.beats[0].at)}. See it through and I won’t forget it.”`,
   ...prog.beats.map((b,k)=>`${weekLabel(b.at)}: v ${name(b.rid)}, ${D.SLOTS[b.slot].name.toLowerCase()}, ${D.FINISHES[b.finish].name.toLowerCase()}${b.title?' (title match)':''}.`)]});
  G.save();return null;
 };
 // Pulling any match from a programme walks out of the whole programme.
 const originalUnbook=G.unbook;
 G.unbook=function(cid){
  const s=G.S,c=[...(s?.card||[]),...(s?.futureBookings||[])].find(x=>x.id===cid);
  if(!c?.programme)return originalUnbook(cid);
  const prog=state(s.territory).live.find(x=>x.id===c.programme.id);
  if(!prog)return originalUnbook(cid);
  walk(s,prog,'You pulled out');
  return `You walked out of the programme. ${G.P(prog.pid).name} trust −${WALK_TRUST}.`;
 };
 function close(s,prog,status,text){
  const st=state(s.territory);
  const ids=new Set(prog.beats.map(b=>b.cid).filter(Boolean));
  s.card=s.card.filter(c=>!ids.has(c.id)||prog.beats.find(b=>b.cid===c.id)?.done);
  s.futureBookings=s.futureBookings.filter(c=>!ids.has(c.id));
  st.live=st.live.filter(x=>x.id!==prog.id);
  st.done.unshift({...prog,status,ended:G.abs(),text});st.done=st.done.slice(0,8);
 }
 function walk(s,prog,why){
  const p=G.P(prog.pid);p.trust=clamp(p.trust-WALK_TRUST);
  close(s,prog,'walked',`${why}: ${name(prog.wid)} left the ${TYPE_NAME[prog.type].toLowerCase()} before the end.`);
  G.msg({from:`${p.voice}, ${p.name}`,subject:'You walked out on me',kind:'info',body:[`“I built weeks of my card around ${short(prog.wid)}. Now I have to fill every one of them.”`,`${p.name} trust −${WALK_TRUST}.`]});
  G.save();
 }

 // A programme match is played: mark it, and finish the programme on the last one.
 const originalApply=G.applyResult;
 G.applyResult=function(c,fin){
  const out=originalApply(c,fin);
  try{
   const s=G.S,prog=c?.programme&&state(s.territory).live.find(x=>x.id===c.programme.id);
   if(prog){
    const b=prog.beats[c.programme.step];
    if(b&&!b.done){
     b.done=true;b.result={outcome:fin.outcome,stars:fin.stars||0};
     const p=G.P(prog.pid);
     if(fin.outcome==='double'){close(s,prog,'broken',`${name(prog.wid)} went into business for themselves. The programme is over.`);}
     else if(prog.beats.every(x=>x.done)){
      p.trust=clamp(p.trust+KEPT_TRUST);s.rep=clamp(s.rep+KEPT_REP);
      const biz=s.territory.business?.[prog.pid];if(biz)biz.buzz=Math.min(100,(biz.buzz||0)+5);
      const avg=prog.beats.reduce((n,x)=>n+(x.result?.stars||0),0)/prog.beats.length;
      close(s,prog,'kept',`${name(prog.wid)} saw the ${TYPE_NAME[prog.type].toLowerCase()} through, averaging ${Math.round(avg*4)/4} stars.`);
      out.push({text:`Programme complete. ${p.name} trust +${KEPT_TRUST}, reputation +${KEPT_REP}.`,tone:1});
      G.msg({from:`${p.voice}, ${p.name}`,subject:'That’s how it’s done',kind:'info',body:[`“Every date, every finish, the way we agreed. I’ll be calling you first next time.”`,`${p.name} trust +${KEPT_TRUST}. Reputation +${KEPT_REP}.`]});
     }
    }
   }
  }catch(e){}
  return out;
 };

 // ---------------------------------------------------------------------------------------------
 // The week: missed dates, a booker's change of heart, and new programme offers.
 function weekly(){
  const s=G.S,t=s?.territory,st=state(t);if(!st)return;
  const now=G.abs();
  for(const prog of st.live.slice()){
   const p=G.P(prog.pid);
   if(!G.W(prog.wid)){close(s,prog,'collapsed',`${name(prog.wid)} left your stable.`);continue;}
   const exists=new Set([...s.card,...s.futureBookings].map(c=>c.id));
   const missed=prog.beats.filter(b=>!b.done&&!b.missed&&!exists.has(b.cid));
   for(const b of missed){
    b.missed=true;
    if(b===prog.beats.at(-1)){
     p.trust=clamp(p.trust-COLLAPSE_TRUST);
     close(s,prog,'collapsed',`${name(prog.wid)} could not make the last match. The programme fell apart.`);
     G.msg({from:`${p.voice}, ${p.name}`,subject:'The programme is dead',kind:'info',body:[`“Weeks of build-up and no ending. ${short(prog.wid)} wasn’t there.”`,`${p.name} trust −${COLLAPSE_TRUST}.`]});
     break;
    }
   }
   if(!st.live.includes(prog))continue;
   // The week before the big one, the booker may change the ending.
   const pay=prog.beats.at(-1),next=[...s.card,...s.futureBookings].find(c=>c.id===pay.cid);
   if(next&&!prog.swerved&&pay.at===now+1){
    prog.swerved=true;
    const desperate=!!t.business?.[prog.pid]?.desperate;
    if(hash(prog.id+':swerve')<styleOf(p).swerve*(desperate?1.5:1)){
     const was=next.finish,won=!!D.FINISHES[was]?.win,now2=finishFor(!won,prog.id+'sw');
     prog.original=was;next.finish=now2;pay.finish=now2;
     next.purse=G.purse({pid:prog.pid,slot:next.slot,finish:now2,boost:1.2},G.W(prog.wid));
     G.msg({from:`${p.voice}, ${p.name}`,subject:'A change of plan',kind:'decision',dtype:'prog_swerve',args:[prog.id],
      body:[`“I’ve been thinking about next week. ${won?`${short(prog.wid)} doesn’t win it. ${short(pay.rid)} does.`:`Forget the plan. ${short(prog.wid)} wins it.`}”`,
       `The finish was ${D.FINISHES[was].name.toLowerCase()}; it is now ${D.FINISHES[now2].name.toLowerCase()}. The rest of the programme stands.`],
      options:[{id:'accept',label:'Go along with it',hint:`${p.name} trust +3.${won?` ${short(prog.wid)} won’t like it.`:''}`},
       {id:'argue',label:'Argue for the original ending',hint:'Uses a management meeting. The booker may change it back, or may not.'},
       {id:'walk',label:'Walk out of the programme',hint:`Every remaining date is cancelled. ${p.name} trust −${WALK_TRUST}.`}]});
    }
   }
  }
  st.offered=st.offered.filter(x=>x.until>=now);
  offer(s,t,now);
 }
 const originalAnswer=G.answer;
 G.answer=function(mid,opt){
  const s=G.S,m=s?.inbox.find(x=>x.id===mid);
  if(!m||m.dtype!=='prog_swerve')return originalAnswer(mid,opt);
  if(m.answer)return null;
  if(!m.options.some(o=>o.id===opt))return 'Choose one of the available responses.';
  const prog=state(s.territory).live.find(x=>x.id===m.args[0]);let text;
  if(!prog)text='That programme is over.';
  else{
   const p=G.P(prog.pid),pay=prog.beats.at(-1),c=[...s.card,...s.futureBookings].find(x=>x.id===pay.cid),w=G.W(prog.wid);
   const nowWins=!!D.FINISHES[pay.finish]?.win;
   if(opt==='accept'){p.trust=clamp(p.trust+3);if(w&&!nowWins)w.morale=G.clamp((w.morale||50)-4);text=`You go along with it. ${p.voice} appreciates that.`;}
   else if(opt==='argue'){
    if(s.focus<1)return 'No management meetings left this week. Choose another response.';
    s.focus--;
    if(hash(mid+':argue')<.3+p.trust/200&&c){c.finish=prog.original;pay.finish=prog.original;c.purse=G.purse({pid:prog.pid,slot:c.slot,finish:c.finish,boost:1.2},w);text=`It takes an hour, but ${p.voice} puts the original ending back.`;}
    else{p.trust=clamp(p.trust-2);text=`${p.voice} won’t budge. The new ending stands.`;}
   }else{walk(s,prog,'You refused the new ending');text=`You walked out. Every remaining date is cancelled.`;}
  }
  m.answer=opt;m.outcome=text;m.read=true;G.save();return text;
 };
 const originalEnd=G.endWeek;
 G.endWeek=function(...args){
  const out=originalEnd(...args);
  try{weekly();G.save();}catch(e){}
  return out;
 };

 // ---------------------------------------------------------------------------------------------
 // For the screens.
 function view(pid,s=G.S){
  const st=s?.territory?.programmes;if(!st)return {live:[],done:[]};
  const map=x=>({id:x.id,type:x.type,typeName:TYPE_NAME[x.type],pid:x.pid,div:x.div,wid:x.wid,wName:name(x.wid),rid:x.rid,rName:name(x.rid),status:x.status||'live',text:x.text||null,ended:x.ended||null,
   beats:x.beats.map(b=>({at:b.at,rName:name(b.rid),slot:b.slot,finish:b.finish,title:!!b.title,done:b.done,missed:!!b.missed,stars:b.result?.stars??null}))});
  return {live:st.live.filter(x=>!pid||x.pid===pid).map(map),done:st.done.filter(x=>!pid||x.pid===pid).map(map)};
 }
 function totalPurse(o,w){return (o.programme?.beats||[]).reduce((n,b)=>n+G.purse({pid:o.pid,slot:b.slot,finish:b.finish,boost:o.boost},w),0);}
 root.OfficeProgrammes={state,claims,offer,view,totalPurse,TYPE_NAME,STYLE,weekly};
})(typeof window!=='undefined'?window:globalThis);
