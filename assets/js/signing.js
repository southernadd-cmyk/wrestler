/* THE OFFICE v0.3.24 — the contract signing.
   Before a title match, a blow-off or the payoff of a programme, the promo is a table in the middle of
   the ring with a contract on it. Three moments: how your wrestler comes to the table, what they do when
   the other one starts on them, and how they sign. Every choice turns the tension up or down; let it boil
   over (or flip the table yourself) and it ends in a brawl: a louder crowd and a hotter feud, and your
   wrestler starts the match banged up. The result goes into the match the way a promo does.
   Deterministic: hashed from the contract id. */
(function installSigning(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const voice=w=>root.OfficeRoom?.VOICE?.[w?.id]||'stoic';
 // Names like “the Reverend” start some sentences; those sentences still start with a capital.
 const cap=t=>String(t).replace(/(^|[.!?]\s+|“)([a-z])/g,(m,a,b)=>a+b.toUpperCase());
 const fill=(t,st)=>cap(String(t).replace(/\{W\}/g,st.w.short).replace(/\{F\}/g,st.f.short).replace(/\{P\}/g,st.p.voice).replace(/\{BELT\}/g,st.prize));

 // Which matches get a signing instead of a promo.
 function payoff(c){
  if(!c?.programme)return false;
  const live=[...(G.S?.territory?.programmes?.live||[]),...(G.S?.territory?.programmes?.done||[])].find(x=>x.id===c.programme.id);
  return !!live&&c.programme.step===live.beats.length-1;
 }
 function eligible(c){return !!c&&(!!c.title||!!c.blowoff||payoff(c));}
 function prizeOf(c){return c.title?(D.belt?.(c.title.pid,c.title.div)?.name||'title'):c.blowoff?'last match':'big night';}

 const ROUNDS=[
  {id:'arrive',name:'The table',help:'The contract is on the table. {P} is holding the pen. How does {W} come to it?',options:[
   {id:'sign',label:'Sign it straight away',hint:'Sit down, sign, sit back. Nothing to prove.',tags:['Cool','Tension ▼'],t:-1,q:3},
   {id:'read',label:'Read every word aloud',hint:'Make a show of it. Funny if they can hold a room; painful if they cannot.',tags:['Gamble','Crowd ▲ with a good talker'],t:0,q:0,mic:true},
   {id:'late',label:'Keep them waiting',hint:'Turn up ten minutes late. The other side will not enjoy it.',tags:['Heat ▲','Tension ▲'],t:2,q:4,promoter:{cold:-1,traditional:-1}},
   {id:'lawyer',label:'Bring a lawyer',hint:'A man in a cheap suit reads out amendments. Very funny with the right wrestler.',tags:[],t:1,q:2,voices:['slippery','precise','grand'],promoter:{showman:1,cold:-1}}]},
  {id:'provoke',name:'The provocation',help:'{F} has something to say first.',options:[
   {id:'ignore',label:'Say nothing',hint:'Let it wash over them. The crowd respects a cold stare.',tags:['Tension ▼'],t:-1,q:2},
   {id:'words',label:'Give it back',hint:'Words, not hands. Only as good as their microphone.',tags:['Gamble','Crowd ▲'],t:1,q:0,mic:true},
   {id:'face',label:'Get in their face',hint:'Stand up. Nose to nose over the table. Security starts moving.',tags:['Tension ▲▲','Feud heat ▲'],t:3,q:5,ego:true},
   {id:'laugh',label:'Laugh at them',hint:'Lean back and laugh until {F} runs out of words.',tags:[],t:2,q:2,voices:['grand','slippery','eager']}]},
  {id:'sign',name:'The signature',help:'Both of them have the pen in front of them. How does {W} finish it?',options:[
   {id:'shake',label:'Sign and offer a hand',hint:'Respect, if the room is calm enough for it.',tags:['Risk: a cheap shot if it is hot'],t:0,q:3,shake:true},
   {id:'pen',label:'Sign and throw the pen at them',hint:'A small insult with a big reaction.',tags:['Heat ▲','Tension ▲'],t:2,q:5},
   {id:'walk',label:'Sign and walk away',hint:'Leave them sitting there. The match is where it counts.',tags:['Tension ▼'],t:-1,q:2},
   {id:'tear',label:'Tear up {F}’s copy',hint:'Sign your own and rip theirs in half in front of them.',tags:[],t:3,q:6,promoter:{aggressive:1,traditional:-1}},
   {id:'flip',label:'Flip the table',hint:'It always ends this way on the television. A brawl, a hot crowd, and a wrestler who starts the match sore.',tags:['Brawl','Crowd ▲▲','Fatigue ▲'],t:9,q:6}]}
 ];
 const SAY={
  sign:{grand:'“A signature is a promise, and mine is worth framing.”',gruff:'“Pen.”',eager:'“Done! Do I get a copy? Can I keep the pen?”',stoic:'“Signed.”',precise:'“Signed, dated, initialled on every page.”',earnest:'“I’m honoured to sign this. Genuinely.”',sermon:'“It is written. Now it is signed.”',slippery:'“Signed. Mostly in my own name.”'},
  read:{grand:'“Clause four. The party of the first part, being me, shall be magnificent.”',gruff:'“It says I win. That’s all it says.”',eager:'“Page one! There are SEVEN pages! Brilliant!”',stoic:'“Page one. Page two. Page three.”',precise:'“There is a typo on page three. I will allow it.”',earnest:'“Sorry, it’s long. I just want to understand it properly.”',sermon:'“And on the seventh page, they rested.”',slippery:'“Hold on, what does ‘indemnify’ mean? Never mind. I’ll sign anything.”'},
  late:{grand:'{W} arrives eleven minutes late, in a robe, to a fanfare nobody booked.',gruff:'{W} turns up late with a bacon roll and does not apologise.',eager:'{W} arrives late and out of breath, having got lost twice.',stoic:'{W} walks in late, sits down and says nothing about it.',precise:'{W} arrives exactly ten minutes late, checking a watch.',earnest:'{W} arrives late, apologising to everyone except {F}.',sermon:'{W} arrives late, as the prophets often did.',slippery:'{W} arrives late, claiming the clocks went forward.'},
  words:{grand:'“You talk like a raffle prize, {F}.”',gruff:'“Shut up and sign.”',eager:'“Oh yeah? OH YEAH? Well… yeah!”',stoic:'“You’ll say less after Saturday.”',precise:'“You have said that before. It was wrong then as well.”',earnest:'“That’s not very nice, {F}. I’m going to beat you anyway.”',sermon:'“Your words are chaff, {F}. The wind is coming.”',slippery:'“Lovely speech, {F}. Did your mum write it?”'},
  provoke:{grand:'“Look at {W}. Dressed for a funeral. How thoughtful.”',gruff:'“You don’t belong at this table, {W}.”',eager:'“{W}! You’re going DOWN! Down down DOWN!”',stoic:'“I’ve beaten better than you, {W}.”',precise:'“Your record against people like me is not good, {W}.”',earnest:'“No offence, {W}, but you’re not ready for this.”',sermon:'“I have seen your ending, {W}. It is not a happy one.”',slippery:'“{W}, I’ve heard the crowd likes you. I’ve also heard they’re wrong.”'}
 };
 /* What each option does, for this fixture. The step applies these numbers and the tags are built from
    them: the tension it leads to, the real odds of the mic gamble and of a brawl, the promoter's view. */
 const BRAWL_FATIGUE=10,BOIL=.6,cheapChance=t=>.5+t/20,micChance=st=>Math.max(.15,Math.min(.92,(st.w.mic-25)/60));
 const tensionWord=t=>t>=6?'Boiling over':t>=4?'Hot':t>=2?'Tense':'Calm';
 const odds=p=>p>=.65?'likely':p>=.4?'even chance':'long shot';
 const brawlWord=p=>p>=.5?'likely':p>=.2?'possible':'unlikely';
 const likesTrouble=pers=>['aggressive','showman'].includes(pers);
 const brawlTrust=pers=>likesTrouble(pers)?1:['traditional','cold'].includes(pers)?-1:0;
 function fxOf(st,o){
  const vw=voice(st.w),e={q:o.q,trust:0,fit:0,why:[],brawl:0,brawlTrust:0,shakeTrust:0},pers=st.p.personality;
  if(o.voices){e.fit=o.voices.includes(vw)?1:-1;e.q+=e.fit>0?4:-2;e.why.push(e.fit>0?'It suits {W}’s way of talking.':'It is not really {W}’s style.');}
  if(o.ego&&(st.w.ego||50)>=70){e.q+=2;e.why.push('{W} has the ego to make it look natural.');}
  if(o.id==='ignore'&&['stoic','precise'].includes(vw)){e.q+=2;e.why.push('Silence suits {W}.');}
  const pt=o.promoter?.[pers]||0;if(pt){e.trust+=pt;e.why.push(pt>0?'{P} will enjoy it.':'{P} will not appreciate it.');}
  if(ROUNDS[st.round].id==='sign'){
   // The chance this ends in a brawl, from the tension the option leaves behind.
   let p,c=0;
   if(o.id==='flip')p=1;
   else if(o.id==='shake'){c=st.tension>=4?Math.min(1,cheapChance(st.tension)):0;p=c+(1-c)*(st.tension-1>=6?BOIL:0);if(c)e.why.push('The room is hot enough for a cheap shot.');}
   else p=st.tension+o.t>=6?BOIL:0;
   e.brawl=p;
   if(p>0){e.brawlTrust=brawlTrust(pers);if(e.brawlTrust)e.why.push(e.brawlTrust>0?'{P} would quite like a brawl.':'{P} wants it signed, not wrecked.');}
   if(o.id==='shake'&&c<1&&pers==='traditional'){e.shakeTrust=1;e.why.push('{P} would like to see a handshake.');}
  }
  return e;
 }
 function sigTags(st,o,e){
  const t=[];
  if(o.mic)t.push('Gamble: '+odds(micChance(st)),'Crowd ▲ or ▼');
  if(o.t)t.push('Tension '+(o.t>0?(o.t>=3?'▲▲':'▲'):'▼')+' to '+tensionWord(st.tension+o.t).toLowerCase());
  if(o.t>0)t.push('Feud heat ▲');
  if(e.q>=4)t.push('Promo ▲');else if(e.q<0)t.push('Promo ▼');
  if(e.fit>0)t.push('Suits {W} ▲');else if(e.fit<0)t.push('Not {W}’s style ▼');
  if(e.trust)t.push('Promoter '+(e.trust>0?'▲':'▼'));
  if(e.brawl>=1)t.push('Brawl: crowd ▲▲, {W} starts tired ▼');
  else if(e.brawl>0)t.push('Risk: brawl ('+brawlWord(e.brawl)+')');
  if(e.brawlTrust)t.push('Promoter '+(e.brawlTrust>0?'▲':'▼')+' if it kicks off');
  if(e.shakeTrust)t.push('Promoter ▲ if they shake');
  return t.length?t:['Safe'];
 }
 const line=(st,side,text,kind)=>st.log.push({side,who:side==='w'?st.w.short:side==='f'?st.f.short:side==='p'?st.p.voice:null,text:fill(text,st),kind:kind||null});

 function begin(c,w,f,p){
  const st={v:1,cid:c.id,round:0,stage:'live',w:{id:w.id,short:w.short,name:w.name,mic:w.mic,ego:w.ego,safe:w.safe},f:{id:f.id,short:f.short,name:f.name,mic:f.mic||55,ego:f.ego||60},p:{id:p.id,voice:p.voice,name:p.name,personality:p.personality||null},prize:prizeOf(c),trust:0,
   tension:0,quality:clamp(40+w.mic*.3),log:[],picks:[],brawl:false,shake:null};
  const heat=Math.max(c.feudHeat||0,G.feud?.(w.id,c.rid)?.heat||0),bond=root.OfficeBonds?.score?.(w.id,f.id)||0;
  st.tension=Math.round(heat/25)+(bond<=-35?1:0)+((f.ego||60)>=75?1:0);
  line(st,'host',c.title?'Ladies and gentlemen, the contract signing for the {BELT}.':c.blowoff?'One last match between these two. First, the paperwork.':'The contract signing for the {BELT}.');
  line(st,'p','{P} is at the head of the table. “Sign it, both of you, and save the rest for the night.”');
  return st;
 }
 function options(st){
  if(st.stage!=='live')return [];
  return ROUNDS[st.round].options.map(o=>{const e=fxOf(st,o);return {id:o.id,label:fill(o.label,st),hint:fill([o.hint,...e.why].join(' '),st),tags:sigTags(st,o,e).map(t=>fill(t,st))};});
 }
 function choose(st,id){
  if(st.stage!=='live')return false;
  const R=ROUNDS[st.round],o=R.options.find(x=>x.id===id);if(!o)return false;
  st.picks.push(id);const vw=voice(st.w);
  const micOk=hash(st.cid+'|mic|'+st.round)<micChance(st),e=fxOf(st,o),fit=e.fit;
  st.tension+=o.t;st.quality+=e.q+(o.mic?(micOk?8:-6):0);st.trust=(st.trust||0)+e.trust;
  if(R.id==='arrive'){
   if(id==='late')line(st,'stage',SAY.late[vw]);
   else if(id==='lawyer')line(st,'stage',fit>0?'{W}’s lawyer stands and reads out eleven amendments. The crowd cheers each one louder than the last.':'{W}’s lawyer stands and reads out eleven amendments. Nobody is quite sure what the joke is.');
   else line(st,'w',SAY[id][vw]);
   if(id==='read')line(st,'stage',micOk?'By page three the crowd is reading along with them.':'By page three people are queuing for the toilets.');
   if(id==='late')line(st,'f','{F} has been sitting there the whole time, getting angrier.');
   line(st,'f',SAY.provoke[voice(st.f)]);
  }else if(R.id==='provoke'){
   if(id==='ignore')line(st,'stage','{W} does not even look up. The crowd ooohs.');
   else if(id==='words'){line(st,'w',SAY.words[vw]);line(st,'stage',micOk?'That one landed. {F} goes red.':'It does not land. {F} laughs.');if(!micOk)st.tension+=1;}
   else if(id==='laugh')line(st,'stage',fit>0?'{W} leans back and laughs until {F} stops talking. The crowd laughs with them.':'{W} tries to laugh it off. It comes out forced, and {F} keeps going.');
   else{line(st,'stage','{W} stands up and leans across the table until they are nose to nose with {F}. Security edges forward.');}
  }else{
   // The signature: and, if the room is hot enough, what happens next.
   if(id==='flip'){line(st,'stage','{W} signs, stands, and flips the table straight into {F}.');st.brawl=true;}
   else if(id==='shake'){
    line(st,'stage','{W} signs and holds out a hand.');
    const cheap=st.tension>=4&&hash(st.cid+'|shake')<cheapChance(st.tension);
    if(cheap){line(st,'f','{F} takes the hand and pulls {W} into a forearm.');st.brawl=true;st.shake='cheap';}
    else{line(st,'f','{F} looks at it for a long moment and shakes it.');st.shake='shook';st.tension-=1;}
   }
   else if(id==='pen'){line(st,'stage','{W} signs and flicks the pen at {F}’s chest.');}
   else if(id==='tear'){line(st,'stage','{W} signs, picks up {F}’s copy, and tears it slowly in half.');}
   else line(st,'stage','{W} signs, drops the pen and walks off without a word.');
   if(!st.brawl&&st.tension>=6&&hash(st.cid+'|boil')<BOIL){line(st,'f','{F} cannot let it go. They come over the table.');st.brawl=true;}
   if(st.brawl){
    line(st,'stage','Chairs go everywhere. It takes six people from the back to pull them apart, and the contract is somewhere under the ring apron.','brawl');
    line(st,'p','{P}: “It’s signed. That’s all I care about. Get them out of my ring.”');
   }else line(st,'p','{P} gathers the papers. “Signed. See you both on the night.”');
   st.stage='done';settle(st);
  }
  if(st.stage!=='done')st.round++;
  return true;
 }
 // Once, when the last signature goes down: a brawl costs your wrestler something before the bell.
 function settle(st){
  if(st.settled)return;st.settled=true;
  const w=G.W(st.w.id),p=G.P?.(st.p.id),pers=st.p.personality??p?.personality;
  if(st.brawl)st.trust=(st.trust||0)+brawlTrust(pers);
  if(st.shake==='shook'&&pers==='traditional')st.trust=(st.trust||0)+1;
  if(p&&st.trust)p.trust=clamp(p.trust+st.trust);
  if(st.brawl&&w){w.fatigue=clamp(w.fatigue+BRAWL_FATIGUE);w.flags={...(w.flags||{}),pushThrough:true};}
  // The signing has already happened before the bell. Its heat enters the feud NOW,
  // not a second time through the promo/result wrapper.
  st.heatApplied=Math.max(0,st.tension)+(st.brawl?6:0);
  const fd=G.feud?.(st.w.id,st.f.id);if(fd&&!fd.closed)fd.heat=clamp(fd.heat+st.heatApplied);
  G.save?.();
 }
 function result(st){
  if(st?.stage!=='done')return null;
  const q=clamp(st.quality+(st.brawl?8:0),15,95);
  const crowdShift=Math.max(-6,Math.min(13,Math.round((q-50)/6)+(st.brawl?3:0)));
  const reaction=st.brawl?'The signing ended in a brawl. The building is buzzing.':st.shake==='shook'?'They shook hands. Somehow that makes it bigger.':q>=65?'The crowd bought every second of it.':'Signed, and not much more.';
  return {v:3,live:true,format:'signing',speaker:st.w.short,opponent:st.f.short,styleName:'Contract signing',quality:q,crowdShift,heatDelta:0,signingHeat:st.heatApplied??(Math.max(0,st.tension)+(st.brawl?6:0)),moraleDelta:0,trustDelta:st.trust||0,repDelta:0,
   hook:cap(st.brawl?`They had to be pulled apart at the contract signing. ${st.f.short} has not forgotten.`:st.shake==='shook'?`They shook hands at the contract signing. Tonight, that is forgotten.`:`The contract is signed. Now it has to be won.`),
   promise:null,tactic:null,claim:null,path:st.picks.map(id=>({id})),speech:st.log.filter(e=>e.side==='w').map(e=>e.text),reply:'',reaction,
   dialogue:st.log.map(e=>({speaker:e.who||'Stage',line:e.text,kind:e.kind})),angle:'Contract signing: '+st.picks.join(', ')+(st.brawl?', brawl':'')+'.',brawl:st.brawl};
 }
 function view(st){
  const R=ROUNDS[Math.min(st.round,ROUNDS.length-1)];
  return {stage:st.stage,round:st.round,total:ROUNDS.length,name:st.stage==='done'?'Signed':R.name,help:fill(st.stage==='done'?'':R.help,st),
   options:options(st),log:st.log.slice(),tension:st.tension,tensionWord:st.tension>=6?'Boiling over':st.tension>=4?'Hot':st.tension>=2?'Tense':'Calm',result:result(st)};
 }
 root.OfficeSigning={eligible,payoff,begin,options,choose,view,result,ROUNDS};
})(typeof window!=='undefined'?window:globalThis);
