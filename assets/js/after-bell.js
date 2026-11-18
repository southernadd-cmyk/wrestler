/* THE OFFICE v0.3.20 — after the bell.
   The match is not over when the referee counts three. Backstage, Dennis asks what happens next: a
   handshake, a stare-down that says this is not finished, an attack once the bell has gone, or a
   lap of honour. After the result it plays out (the other wrestler may not shake, and may not have
   agreed to be jumped), and then your wrestler has the microphone: rub it in, give them credit, take
   the loss, blame the finish, or call somebody out. A callout that the room believes brings that
   match onto the promoter's desk the following week.
   Deterministic: every outcome is read from the save and hashed from the contract id. */
(function installAfterBell(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,T=root.OfficeTerritory;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const between=(n,a,b)=>Math.max(a,Math.min(b,n));
 const voice=w=>root.OfficeRoom?.VOICE?.[w?.id]||'stoic';
 const who=id=>G.W(id)||G.F(id)||D.findWrestler?.(id)||null;
 const CALL_WEEKS=2;

 function state(s=G.S){
  if(!s)return null;
  const a=s.after&&typeof s.after==='object'?s.after:(s.after={});
  a.done??={};a.calls??=[];a.log??=[];
  return a;
 }

 // ---------------------------------------------------------------------------------------------
 // Backstage: what the wrestlers agree to do once the bell has gone.
 const PLANS={
  none:{label:'Nothing. Back through the curtain',hint:'Let the match speak for itself.',tags:['Safe']},
  handshake:{label:'Offer a handshake',hint:'Respect, in front of everyone. They might not take it.',tags:['Builds a bond','Cools the feud','Risk: refused']},
  staredown:{label:'A long stare-down',hint:'Neither of them leaves. The crowd knows this is not over.',tags:['Feud heat ▲','Rematch likelier']},
  beatdown:{label:'Attack after the bell',hint:'Big heat, if the other side agreed to it. If they did not, it is a real fight.',tags:['Feud heat ▲','Gamble: did they agree?']},
  celebrate:{label:'A lap of honour',hint:'Slap every hand on the barrier. Only works if the crowd is still with them.',tags:['Heat ▲ if the crowd is hot']}
 };
 function plans(c,w,f){
  const won=String(c?.finish||'').startsWith('win');
  const bond=root.OfficeBonds?.score?.(w.id,f.id)||0;
  return Object.entries(PLANS).filter(([id])=>id!=='celebrate'||won).map(([id,x])=>{
   let hint=x.hint;
   if(id==='handshake'&&bond<=-35)hint+=' '+f.short+' cannot stand '+w.short+'. Do not hold your breath.';
   if(id==='beatdown'&&f.pro<60)hint+=' '+f.short+' is not the most professional; they may take it the wrong way.';
   if(id==='handshake'&&c.finish==='win_dirty')hint+=' Hard to shake the hand of somebody who just cheated you.';
   return {id,label:x.label,hint,tags:x.tags.slice()};
  });
 }

 // ---------------------------------------------------------------------------------------------
 // The night itself.
 function ctxOf(c,fin){
  const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
  const outcome=fin?.outcome||'booked',FN=D.FINISHES[c.finish]||{};
  const won=outcome==='double'||(outcome!=='nc'&&!!FN.win);
  return {w,f,p,won,outcome,finish:c.finish,stars:+(fin?.stars||0),crowd:+(fin?.crowd||50),dirty:c.finish==='win_dirty'||c.finish==='lose_protected',clean:c.finish==='win_clean'||c.finish==='lose_clean'};
 }
 function feudOf(wid,rid){
  const s=G.S,k=wid+':'+rid;
  return G.feud(wid,rid)||(s.feuds[k]={wid,rid,heat:0,matches:0,closed:false,since:G.abs()});
 }
 function heatFeud(wid,rid,d){const fd=feudOf(wid,rid);if(fd.closed&&d>0){fd.closed=false;fd.matches=Math.max(1,fd.matches);}fd.heat=clamp(fd.heat+d);return fd.heat;}
 function bond(a,b,d,kind,text,src){root.OfficeBonds?.shift?.(a,b,d,kind,text,src);}
 function remember(wid,kind,text,rid,shift,src){root.OfficeMemory?.remember?.(wid,kind,text,rid,shift,0,src);}
 // Names like “the Reverend” start some sentences; those sentences still start with a capital.
 const cap=t=>String(t).replace(/(^|[.!?]\s+|“)([a-z])/g,(m,a,b)=>a+b.toUpperCase());
 const fill=(t,x)=>cap(String(t).replace(/\{W\}/g,x.w?.short||'').replace(/\{F\}/g,x.f?.short||'').replace(/\{T\}/g,x.t?.short||'').replace(/\{P\}/g,x.p?.voice||''));
 const likesTrouble=p=>['aggressive','showman'].includes(p?.personality);

 // What the angle does. Each returns the lines it plays and the consequences, and changes the save once.
 function playAngle(st,x){
  const plan=st.plan,id=st.cid,out=st.cons,log=st.log;
  const add=(text,tone=0)=>out.push({text:cap(text),tone});
  const line=(side,text)=>log.push({side,who:side==='w'?x.w.short:side==='f'?x.f.short:null,text:fill(text,x)});
  const b=root.OfficeBonds?.score?.(x.w.id,x.f.id)||0;
  if(plan==='handshake'){
   let chance=.58+b/220+(x.clean?.12:-.12)-(x.f.ego-60)/220+(x.stars>=3.5?.1:0)-(x.finish==='win_dirty'?.25:0);
   chance=between(chance,.08,.94);
   const ok=hash(id+'|shake')<chance;st.angle={plan,ok,chance:Math.round(chance*100)};
   line('stage','{W} walks across the ring and holds out a hand.');
   if(ok){
    line('stage',x.won?'{F} looks at it for a long second, then shakes it. The crowd stands up for both of them.':'{F} takes the hand and raises {W}’s arm. Half the hall applauds the loser.');
    bond(x.w.id,x.f.id,12,'respect','Shook hands after the bell.',id+':after');
    x.w.morale=clamp(x.w.morale+3);add(x.w.short+' and '+x.f.short+' shook hands. Bond +12, morale +3.',1);
    const fd=G.feud(x.w.id,x.f.id);if(fd&&!fd.closed){fd.heat=clamp(fd.heat-8);add('The feud with '+x.f.short+' cools a little (heat '+fd.heat+').',0);}
    if(!likesTrouble(x.p)){x.p.trust=clamp(x.p.trust+2);add(x.p.voice+' liked that. '+x.p.name+' trust +2.',1);}
    if(x.stars>=3){G.S.rep=clamp(G.S.rep+1);add('Reputation +1.',1);}
    remember(x.w.id,'respect',x.w.short+' remembers shaking '+x.f.short+'’s hand after the bell.',x.f.id,2,id+':after');
   }else{
    line('f','{F} looks at the hand, looks at the crowd, and walks out under the bottom rope.');
    bond(x.w.id,x.f.id,-6,'snub','Refused a handshake after the bell.',id+':after');
    const h=heatFeud(x.w.id,x.f.id,10);x.w.heat=clamp(x.w.heat+2);
    add(x.f.short+' refused the handshake. The crowd is behind '+x.w.short+' (heat +2); feud heat '+h+'.',0);
    remember(x.w.id,'snub',x.w.short+' remembers '+x.f.short+' leaving them standing there with a hand out.',x.f.id,-1,id+':after');
   }
  }else if(plan==='staredown'){
   st.angle={plan,ok:x.stars>=2};
   line('stage','The bell has gone, and neither of them moves. {W} and {F} stand nose to nose while the referee pleads with them.');
   if(x.stars>=2){
    const h=heatFeud(x.w.id,x.f.id,12);x.w.heat=clamp(x.w.heat+1);
    line('stage','Security comes down the aisle. Nobody in the building is sitting down.');
    add('The stare-down says it is not finished. Feud heat '+h+'; a rematch offer is likelier.',1);
   }else{
    const h=heatFeud(x.w.id,x.f.id,4);
    line('stage','Somebody in the front row checks their watch. The match did not earn this.');
    add('Nobody was invested enough to care. Feud heat '+h+'.',-1);
   }
  }else if(plan==='beatdown'){
   let chance=x.f.pro/100*.9+(b>-35?.1:-.2)+(x.f.ego>=80?-.1:0);chance=between(chance,.1,.95);
   const worked=hash(id+'|jump')<chance;st.angle={plan,ok:worked,chance:Math.round(chance*100)};
   line('stage','{F} turns to leave. {W} hits them from behind.');
   if(worked){
    line('stage','It looks horrible and nobody is hurt. {F} sells it all the way to the back, clutching the ribs. The booing goes on for a minute.');
    const h=heatFeud(x.w.id,x.f.id,20);x.w.heat=clamp(x.w.heat+4);
    bond(x.w.id,x.f.id,-6,'angle','An attack after the bell, worked well.',id+':after');
    add('The attack after the bell got real heat: '+x.w.short+' heat +4, feud heat '+h+'.',1);
    const dt=likesTrouble(x.p)?3:-4;x.p.trust=clamp(x.p.trust+dt);
    add(dt>0?x.p.voice+' loved it. '+x.p.name+' trust +3.':x.p.voice+' does not want that on the show. '+x.p.name+' trust −4.',Math.sign(dt));
   }else{
    line('f','{F} was not told. {F} turns round swinging, and suddenly it is not a show.');
    line('stage','Six people come out of the back to pull them apart. It takes a while.');
    const h=heatFeud(x.w.id,x.f.id,25);
    bond(x.w.id,x.f.id,-25,'grudge','Jumped after the bell without warning.',id+':after');
    x.p.trust=clamp(x.p.trust-6);G.S.cash-=100;x.w.morale=clamp(x.w.morale-3);
    add(x.f.short+' had not agreed to it. A real scuffle: £100 fine, '+x.p.name+' trust −6, morale −3. Feud heat '+h+'.',-1);
    remember(x.w.id,'grievance',x.w.short+' remembers the fight with '+x.f.short+' that was not part of the show.',x.f.id,-3,id+':after');
   }
  }else if(plan==='celebrate'){
   const hot=x.stars>=3&&x.crowd>=55;st.angle={plan,ok:hot};
   line('stage','{W} goes round the barrier, slapping every hand they can reach.');
   if(hot){x.w.heat=clamp(x.w.heat+3);x.w.morale=clamp(x.w.morale+4);line('stage','The crowd will not let them go. Somebody hands over a scarf.');add(x.w.short+' soaked it up: heat +3, morale +4.',1);}
   else{x.w.morale=clamp(x.w.morale+1);line('stage','About half the hall is already queuing at the bar.');add('A lap of honour to a half-empty hall. Morale +1.',0);}
  }
 }

 // ---------------------------------------------------------------------------------------------
 // The microphone.
 const SAY={
  gloat:{grand:'“Did you see it? Of course you saw it. You will be telling your grandchildren, and they will not believe you.”',
   gruff:'“Told you. Didn’t I tell you? I told you.”',eager:'“I WON! Did everybody see? Can we play it again? Is there a replay? There should be a replay!”',
   stoic:'“That is what happens.”',precise:'“As predicted. Down to the minute, roughly.”',earnest:'“I’m sorry, I know I shouldn’t, but that was BRILLIANT and I was BRILLIANT.”',
   sermon:'“It was written. I merely read it aloud.”',slippery:'“Nobody thought I could do it. Except me. And my accountant, who had a bet on.”'},
  credit:{grand:'“{F}. A worthy opponent. Second-best person in this ring tonight, and by some distance the second-best ever.”',
   gruff:'“{F}’s tough. Tougher than I thought. That’s all.”',eager:'“{F} was AMAZING. Give it up for {F}! Come on! LOUDER!”',
   stoic:'“{F} made me work. Respect.”',precise:'“{F} won three exchanges out of five. Nobody else has managed two.”',earnest:'“I couldn’t have done that without {F}. I mean that.”',
   sermon:'“{F} walked through the fire with me. Few do.”',slippery:'“{F}, good match. No, really. I’ll say it again when the cameras are off.”'},
  concede:{grand:'“Tonight belonged to {F}. Tonight. Make a note of the date.”',gruff:'“Better wrestler won. Tonight.”',
   eager:'“Okay. Okay! They got me. I’m going to watch the tape eleven times.”',stoic:'“I lost. I’ll be back.”',
   precise:'“I made two mistakes. I will make none next time.”',earnest:'“{F} was better tonight. I’m gutted, but they were.”',
   sermon:'“Even the righteous fall. The righteous also get up.”',slippery:'“Fair’s fair. This time.”'},
  excuse:{grand:'“A robbery. A heist. They will make a film about it, and I shall be the hero.”',gruff:'“Ref was looking the other way. Ask anyone.”',
   eager:'“That wasn’t fair! Was that fair? That wasn’t fair! Everybody saw that, right?”',stoic:'“Everybody saw what happened.”',
   precise:'“The count was 2.4 seconds. I have it on my watch.”',earnest:'“I don’t want to complain. But that wasn’t right, was it?”',
   sermon:'“The serpent always strikes when the shepherd looks away.”',slippery:'“I know cheating when I see it. Professionally.”'},
  callout:{grand:'“And now a word for {T}. I am coming. Tell your family. Tell the papers.”',gruff:'“{T}. You’re next.”',
   eager:'“{T}! Yeah, you! I want you! Next week! Or the week after, I’m flexible!”',stoic:'“{T}. Whenever you like.”',
   precise:'“{T}: you have avoided me for eleven weeks. I have counted.”',earnest:'“{T}, I’d really like a match with you. If that’s alright. I think I’ve earned it.”',
   sermon:'“{T}. Your day of reckoning has been pencilled in.”',slippery:'“{T}. Let’s you and me make some money. Mostly me.”'},
  rematch:{grand:'“{F}. Again. Same town, bigger hall.”',gruff:'“{F}. Again.”',eager:'“{F}, one more go! Please! Best of three! Best of five!”',
   stoic:'“{F}. We’re not done.”',precise:'“{F}: the sample size is too small. Again.”',earnest:'“{F}, can we do it again? I know I can beat you.”',
   sermon:'“{F}. The second verse will be different.”',slippery:'“{F}, rematch. Double or nothing. I’ll bring the nothing.”'}
 };
 function targets(st){
  const s=G.S,x=ctxOf(st.c,st.fin),out=[];if(!x.w||!x.f||!x.p)return out;
  const div=D.divisionOf(x.w.id),rank=T?.promotionRank?.(x.p.id,div)||[];
  const pool=rank.filter(r=>!r.owned&&T.contracted?.(s,r.id)&&r.id!==x.f.id);
  const champ=pool.find(r=>r.champion);if(champ)out.push({id:champ.id,why:'the '+x.p.name+' champion',champion:true,row:champ});
  const me=rank.findIndex(r=>r.id===x.w.id);
  const foes=pool.filter(r=>!r.champion&&((root.OfficeBonds?.score?.(x.w.id,r.id)||0)<=-20||(G.feud(x.w.id,r.id)?.heat||0)>=25));
  if(foes[0])out.push({id:foes[0].id,why:'an old score to settle',row:foes[0]});
  const above=pool.filter((r,i)=>!r.champion&&!out.some(o=>o.id===r.id)&&rank.indexOf(r)<(me<0?rank.length:me)).pop();
  if(above)out.push({id:above.id,why:'just above '+x.w.short+' on the card',row:above});
  return out.slice(0,2).map(o=>({...o,rank:rank.findIndex(r=>r.id===o.id)}));
 }
 function micOptions(st){
  if(st.stage!=='mic')return [];
  const x=ctxOf(st.c,st.fin),opts=[];
  if(x.won){
   opts.push({id:'gloat',label:'Rub it in',hint:'Loud, cocky, and a little cruel. The crowd will love or loathe it.',tags:['Heat ▲','Feud heat ▲','Bond ▼']});
   opts.push({id:'credit',label:'Give '+x.f.short+' credit',hint:'Gracious in victory. Promoters like it.',tags:['Builds a bond','Cools the feud']});
  }else{
   opts.push({id:'concede',label:'Take the loss like a pro',hint:'No excuses. It softens the blow.',tags:['Morale ▲','Builds a bond']});
   opts.push({id:'excuse',label:'Blame the finish',hint:x.dirty?'They have a point: it was not clean.':'It was clean. The crowd saw it was clean.',tags:x.dirty?['Feud heat ▲','Heat ▲']:['Unlikely','Heat ▼ if it fails']});
  }
  opts.push({id:'rematch',label:'Demand a rematch with '+x.f.short,hint:x.won?'Odd, after a win, unless there is real heat between them.':'The obvious ask. Promoters like a story with a second chapter.',tags:['Gamble','Rematch offer if it lands']});
  for(const t of targets(st)){
   const T0=who(t.id);if(!T0)continue;
   opts.push({id:'call:'+t.id,label:'Call out '+T0.short,hint:T0.name+', '+t.why+'.'+(t.champion?' Aim high and miss, and the promoter notices.':''),tags:['Gamble',t.champion?'Title picture':'A new match offer']});
  }
  opts.push({id:'walk',label:'Say nothing',hint:'Hand the microphone back and walk.',tags:['Safe']});
  return opts;
 }
 // How likely a callout is to land: mic skill and heat against how far up the card the target sits.
 function callChance(st,targetId,rematch){
  const x=ctxOf(st.c,st.fin),t=targets(st).find(o=>o.id===targetId);
  const score=x.w.mic*.55+x.w.heat*.3+(x.stars-2.5)*9+(x.won?8:-4)+(st.angle?.ok&&['staredown','beatdown'].includes(st.plan)?8:0);
  const fh=G.feud(x.w.id,rematch?x.f.id:targetId)?.heat||0;
  let need=46+(t?.champion?16:0)+(t&&t.rank<=2?8:0)-fh/6;
  if(rematch)need=x.won?54:40;
  return between((score-need+50)/100,.08,.9);
 }
 function sayLine(kind,x){return fill(SAY[kind][voice(x.w)]||SAY[kind].stoic,x);}
 function speak(st,id){
  if(st.stage!=='mic'||!micOptions(st).some(o=>o.id===id))return false;
  const x=ctxOf(st.c,st.fin),out=st.cons,log=st.log,cid=st.cid;
  const add=(text,tone=0)=>out.push({text:cap(text),tone});
  const line=(side,text)=>log.push({side,who:side==='w'?x.w.short:side==='f'?x.f.short:null,text:cap(text)});
  const roll=k=>hash(cid+'|mic|'+k);
  const lands=(base)=>roll(id)<between(base+(x.w.mic-60)/120,.1,.95);
  st.said=id;
  if(id==='walk'){line('stage',x.w.short+' hands the microphone back to the ring announcer and walks up the aisle.');}
  else if(id==='gloat'){line('w',sayLine('gloat',x));
   if(lands(.62)){const h=heatFeud(x.w.id,x.f.id,6);x.w.heat=clamp(x.w.heat+3);bond(x.w.id,x.f.id,-6,'gloat','Rubbed it in after the match.',cid+':mic');line('stage','The booing is the loudest it has been all night. That is the point.');add(x.w.short+' rubbed it in: heat +3, feud heat '+h+'.',1);}
   else{line('stage','It falls flat. Somebody laughs, and not with them.');x.w.morale=clamp(x.w.morale-2);add('The gloating fell flat. Morale −2.',-1);}}
  else if(id==='credit'){line('w',sayLine('credit',x));bond(x.w.id,x.f.id,6,'respect','Gave credit on the microphone.',cid+':mic');
   const fd=G.feud(x.w.id,x.f.id);if(fd&&!fd.closed)fd.heat=clamp(fd.heat-4);
   if(x.stars>=3){G.S.rep=clamp(G.S.rep+1);add(x.w.short+' gave '+x.f.short+' credit. Bond +6, reputation +1.',1);}else add(x.w.short+' gave '+x.f.short+' credit. Bond +6.',1);}
  else if(id==='concede'){line('w',sayLine('concede',x));x.w.morale=clamp(x.w.morale+3);bond(x.w.id,x.f.id,4,'respect','Took the loss with grace.',cid+':mic');
   if(!likesTrouble(x.p)){x.p.trust=clamp(x.p.trust+1);add(x.w.short+' took the loss like a pro. Morale +3, '+x.p.name+' trust +1.',1);}else add(x.w.short+' took the loss like a pro. Morale +3.',1);}
  else if(id==='excuse'){line('w',sayLine('excuse',x));
   if(x.dirty&&lands(.6)){const h=heatFeud(x.w.id,x.f.id,10);x.w.heat=clamp(x.w.heat+2);line('stage','The crowd is with them. They saw it too.');add('The crowd bought it: heat +2, feud heat '+h+'.',1);}
   else{x.w.heat=clamp(x.w.heat-2);line('stage',x.dirty?'Nobody is in the mood to hear it.':'The crowd saw a clean finish. They say so, loudly.');add('Sour grapes. Heat −2.',-1);}}
  else if(id==='rematch'||id.startsWith('call:')){
   const rematch=id==='rematch',tid=rematch?x.f.id:id.slice(5),t=who(tid),tg=rematch?null:targets(st).find(o=>o.id===tid);
   x.t=t;line('w',rematch?sayLine('rematch',x):sayLine('callout',x));
   const chance=callChance(st,tid,rematch),ok=roll('call:'+tid)<chance;
   st.call={target:tid,ok,chance:Math.round(chance*100),champion:!!tg?.champion};
   if(ok){
    const h=heatFeud(x.w.id,tid,rematch?8:15);
    const a=state();a.calls=a.calls.filter(k=>!(k.wid===x.w.id&&k.rid===tid));
    a.calls.push({wid:x.w.id,rid:tid,pid:x.p.id,slot:st.c.slot,champion:!!tg?.champion,from:cid,made:G.abs(),due:G.abs()+1,until:G.abs()+CALL_WEEKS});
    line('stage',rematch?'The crowd starts chanting for it. Somewhere backstage, '+x.p.voice+' picks up a pencil.':'The crowd turns to look at the curtain. '+t.short+' does not come out, but everybody wants them to.');
    add((rematch?'The rematch':'The callout of '+t.short)+' landed. Feud heat '+h+'; expect '+x.p.voice+' to call next week.',1);
    if(root.OfficeAmbitions?.state?.()?.w?.[x.w.id]?.kind==='rivalry')add(x.w.short+' wanted a real rival. This could be it.',1);
   }else{
    x.w.heat=clamp(x.w.heat-2);x.w.morale=clamp(x.w.morale-2);
    line('stage',rematch?'A few people clap. Most are looking at their phones.':'Silence. Half the crowd is not sure who '+t.short+' is, and the other half does not think '+x.w.short+' deserves them.');
    let text=(rematch?'Nobody wanted the rematch':'The callout of '+t.short+' fell flat')+'. Heat −2, morale −2.';
    if(tg?.champion){x.p.trust=clamp(x.p.trust-2);text+=' '+x.p.voice+' did not like a title challenge from nowhere: trust −2.';}
    add(text,-1);
   }
  }
  st.stage='done';
  const a=state();a.log.unshift({cid,week:G.abs(),wid:x.w.id,rid:x.f.id,plan:st.plan,angle:st.angle?.ok??null,said:id,call:st.call||null});a.log=a.log.slice(0,30);
  G.save();return true;
 }

 // The segment for one match, built straight after the result.
 function begin(c,fin,plan='none'){
  const x=ctxOf(c,fin);if(!x.w||!x.f||!x.p)return null;
  const a=state(),st={v:1,cid:c.id,c:{id:c.id,wid:c.wid,rid:c.rid,pid:c.pid,slot:c.slot,finish:c.finish},fin:{stars:x.stars,crowd:x.crowd,outcome:x.outcome},plan:PLANS[plan]?plan:'none',stage:'mic',log:[],cons:[],angle:null,said:null,call:null};
  if(st.plan==='celebrate'&&!x.won)st.plan='none';
  st.log.push({side:'stage',who:null,text:x.won?'The referee raises '+x.w.short+'’s hand.':x.outcome==='nc'?'Nobody’s hand is raised. The referee waves it off.':'The referee raises '+x.f.short+'’s hand.'});
  if(a.done[c.id]){st.stage='done';return st;}
  a.done[c.id]=1;
  if(st.plan!=='none')playAngle(st,x);
  G.save();return st;
 }
 function view(st){
  const x=ctxOf(st.c,st.fin);
  return {stage:st.stage,plan:st.plan,planLabel:PLANS[st.plan]?.label||'',log:st.log.slice(),cons:st.cons.slice(),options:micOptions(st),
   title:st.stage==='mic'?x.w.short+' has the microphone':'After the bell',ask:st.stage==='mic'?(x.won?'The crowd is still on its feet. What does '+x.w.short+' say?':'The crowd is quietening down. What does '+x.w.short+' say?'):''};
 }

 // ---------------------------------------------------------------------------------------------
 // The week after a callout lands: the promoter puts the match on the desk.
 // The week's offers are made inside endWeek, so the callout joins them straight afterwards.
 const originalEnd=G.endWeek;
 G.endWeek=function(...args){
  const r=originalEnd.apply(this,args);
  try{if(!G.S?.over)deliverCalls();G.save();}catch(e){}
  return r;
 };
 function deliverCalls(){
  const s=G.S,a=state(s);if(!a?.calls.length)return;
  const now=G.abs(),keep=[];
  for(const k of a.calls){
   if(k.due>now){keep.push(k);continue;}
   const w=G.W(k.wid),p=G.P(k.pid),t=who(k.rid);
   const onCard=T?.promotionRank?.(k.pid,D.divisionOf(k.wid))?.some(r=>r.id===k.rid&&!r.owned);
   const ok=w&&p&&t&&onCard&&!G.W(k.rid)&&G.eligible(p)&&T.contracted?.(s,k.rid)&&G.availableAt(w,now+1);
   if(!ok){if(k.until>now)keep.push(k);continue;}
   if(s.offers.some(o=>o.callout===k.from))continue;
   const up=D.SLOT_ORDER[Math.min(D.SLOT_ORDER.length-1,D.SLOT_ORDER.indexOf(k.slot)+1)];
   const win=hash(k.from+'|callwin')<.42+p.trust/400;
   const finish=win?(hash(k.from+'|cf')<.6?'win_clean':'win_dirty'):(hash(k.from+'|cf')<.5?'lose_protected':'lose_clean');
   const o={id:'o'+Math.floor(hash(k.from+'|oid')*1e9).toString(36)+now,pid:p.id,rid:k.rid,wid:k.wid,slot:up,finish,tag:'Callout',boost:k.champion?1.35:1.2,haggled:false,eventAbs:now+1,expiresAbs:now,callout:k.from};
   s.offers.unshift(o);
   G.msg({from:p.voice+', '+p.name,subject:`You asked for ${t.short}. You’ve got them.`,kind:'info',
    body:[`“${w.short} said it in front of my crowd, so now they can back it up. ${t.name}, next week, ${D.SLOTS[up].name.toLowerCase()}.”`,
     `The agreed finish is ${D.FINISHES[finish].name.toLowerCase()}. ${k.champion?'Win it and the belt will not be far away.':'It is on the Offers screen until the end of this week.'}`]});
  }
  a.calls=keep;
 }

 root.OfficeAfter={state,PLANS,plans,begin,view,micOptions,speak,targets,callChance,deliverCalls};
})(typeof window!=='undefined'?window:globalThis);
