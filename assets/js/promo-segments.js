/* THE OFFICE — promo segments that are not a back-and-forth.
   Before the match the player can choose the kind of segment instead of always trading lines with the
   opponent: a solo promo, a pre-taped vignette, a backstage ambush, or an interview grilling. Each is a
   short scene of three decisions (the grilling can end early with a walk-out) and ends in a result the
   match reads the way it reads a promo. Effects that happen before the bell (promoter trust, a wrestler
   hurt in an ambush, morale after a grilling) are applied once, when the scene ends. Feud heat goes
   through the result, like any promo. Deterministic: every roll is hashed from the contract id.
   The solo promo and the grilling speak in the wrestler's own words where the character bank has a
   line that fits the beat (see bankLine below); the voice-family lines are the fallback. */
(function installSegments(root){'use strict';
 const G=root.OfficeGame;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const voice=w=>root.OfficeRoom?.VOICE?.[w?.id]||'stoic';
 const cap=t=>String(t).replace(/(^|[.!?]\s+|“)([a-z])/g,(m,a,b)=>a+b.toUpperCase());
 const fill=(t,st)=>cap(String(t).replace(/\{W\}/g,st.w.short).replace(/\{F\}/g,st.f.short).replace(/\{P\}/g,st.p.voice).replace(/\{V\}/g,st.p.venue));
 const likesTrouble=p=>['aggressive','showman'].includes(p?.personality);
 const line=(st,side,text,kind,authoredId)=>st.log.push({side,who:side==='w'?st.w.short:side==='f'?st.f.short:side==='p'?st.p.voice:side==='host'?'Interviewer':null,text:fill(text,st),kind:kind||null,...(authoredId?{authoredId}:{})});

 /* ---------- the wrestler's own words ----------
    Character banks are written for the duel: every line belongs to a decision slot and a graph
    variant. Only some slots still make sense with nobody answering. The segment asks the shared
    selector for those slots (owner, variant, conditions, used and recently heard lines all still
    apply) and adds its own guards:
    - lines that speak to "you" are only used where the wrestler is talking to the opponent;
    - a closing vow or clean-finish line is only used through the duel's commitment guard, and
      then the promise is recorded; anywhere else an explicit promise line is refused. */
 const YOU=/\byou(?:r|rs|rself|'re|'ll|'ve|'d|’re|’ll|’ve|’d)?\b/i;
 const Dialogue=()=>root.OfficePromoDialogue;
 const catalogues=new WeakMap();
 function bankCat(st){
  const banks=st.dialogue?.banks;if(!banks?.length||!root.OfficePromoBanks||!Dialogue())return null;
  if(catalogues.has(st))return catalogues.get(st);
  let cat=null;try{cat=root.OfficePromoBanks.catalogue(banks);}catch(_){cat=null;}
  catalogues.set(st,cat);return cat;
 }
 function bankCtx(st,stage,action,variant){
  const s=st.dialogue.facts;
  return {stage,action,side:'w',speaker:s.player,opponent:s.opponent,client:s.client,venue:s.venue,titleMatch:s.titleMatch,hasMouthpiece:false,
   meetings:s.meetings,format:st.type,subject:null,landed:null,variant,strength:null,opening:null,voice:root.OfficeRoom?.VOICE?.[s.player.id]||null,
   stance:null,composure:null,irritation:null,protected:'contextual-variant',previous:null};
 }
 // Any win or clean-finish promise wording, clear or ambiguous. Outside the promise closers a line
 // like this would be a public promise nobody records, so it is never used.
 const PROMISE=/\b(?:I will win|I'll win|I’ll win|I intend to win|I am going to win|I'm going to win|I’m going to win|I'm winning|I’m winning|I am winning|I guarantee|I'll be the winner|I’ll be the winner|I will be the winner)\b|\bclean (?:fall|finish|pin|win)\b/i;
 const unpromised=r=>!PROMISE.test(r.text);
 const noYou=r=>!YOU.test(r.text);
 // An answer to an interviewer: not addressed to "you", and not an unrecorded promise.
 const answerable=(r,ctx)=>noYou(r)&&!(ctx.stage==='close'&&['vow','clean'].includes(ctx.action)&&Dialogue().closingCommitment(r,ctx));
 // slots: [stage, action, variant]. mode 'commit' uses the duel's closing selector (vow or clean).
 function bankLine(st,key,slots,mode){
  const cat=bankCat(st);if(!cat)return null;
  const D=Dialogue(),mem=st.dialogue,seed=st.cid+'|'+st.type+'|'+key;
  const order=slots.slice().sort((a,b)=>hash(seed+'|'+a.join('/'))-hash(seed+'|'+b.join('/')));
  for(const [stage,action,variant] of order){
   const ctx=bankCtx(st,stage,action,variant),memory={used:mem.used,recent:mem.recent};
   const pick=mode==='commit'?((ctx.speaker.academy&&action==='vow'&&D.selectRookieVow(ctx,seed,memory))||D.selectClosing(cat,ctx,seed,memory)):
    D.select(cat,ctx,seed,{...memory,candidateFilter:r=>unpromised(r)&&(!mode||mode(r,ctx))});
   if(pick?.text){mem.used.push(pick.id);return {...pick,variant};}
  }
  return null;
 }
 // Say a bank line if there is one; otherwise the fallback, which may be speech or narration.
 function speak(st,pick,fallback){
  if(pick){line(st,'w','“'+String(pick.text).trim()+'”',null,pick.id);return true;}
  line(st,/^“/.test(fallback)?'w':'stage',fallback);return false;
 }
 // Mic rolls: the wrestler's microphone skill, nudged by the situation.
 const roll=(st,key,bonus=0)=>hash(st.cid+'|'+st.type+'|'+key)<Math.max(.15,Math.min(.92,(st.w.mic-25)/60+bonus));

 /* ---------- the menu ---------- */
 const TYPES={
  duel:{name:'Face to face',hint:'The usual segment: {W} and {F} trade words with the microphone. Both wrestlers’ mic skills count.',tags:['Two voices','Mic ▲▲']},
  solo:{name:'Solo promo',hint:'{W} alone in the ring with the microphone. Nobody answers back and nobody to hide behind.',tags:['Mic ▲▲','Crowd ▲']},
  vignette:{name:'Pre-taped vignette',hint:'Recorded earlier and shown on the screen. It cannot go wrong live, but it rarely brings the house down.',tags:['No live risk','Lower ceiling']},
  ambush:{name:'Backstage ambush',hint:'No talking. {W} jumps {F} before the match. {F} starts the match hurt; the promoter may not like it.',tags:['Feud heat ▲▲','Opponent hurt','Trust risk']},
  grilling:{name:'Interview grilling',hint:'The interviewer asks the hard questions and {F} is not there. {W} handles it alone, or walks out.',tags:['Mic ▲','Can walk out']}
 };
 function menu(c,w,f,p){
  const st={w,f,p:{voice:p?.voice||'The promoter',venue:p?.venue||'the hall'}};
  return Object.entries(TYPES).map(([id,t])=>({id,label:t.name,hint:fill(t.hint,st),
   tags:id==='vignette'?[...t.tags,p?.tv?'TV production':'House production']:t.tags.slice()}));
 }
 // The road agent's read: who should be trusted with a live microphone tonight.
 function advice(c,w,f){
  const mic=w.mic||50;
  if(mic<40)return `${w.short} on a live mic worries me. Tape something, or let the fists do the talking.`;
  if(mic>=70)return `${w.short} can carry a room on their own. Give them the ring and get out of the way.`;
  if((c.feudHeat||0)>=45)return `This one is already personal. Whatever we do, ${f.short} is going to take it personally.`;
  return `${w.short} is fine with a microphone. Pick the segment that suits tonight.`;
 }

 const CHALLENGES=[['answer','challenge','ch_one_fall'],['answer','challenge','ch_mat'],['answer','challenge','ch_ground'],['answer','challenge','ch_stay']];

 /* ---------- solo promo ---------- */
 const SOLO=[
  {id:'aim',name:'Who is it for?',help:'{W} has the ring to themselves. No opponent, no interviewer: just the microphone and the room.',options:[
   {id:'crowd',label:'Talk to the crowd',hint:'Make them part of it. The easiest room to win, if they already like {W}.',tags:['Crowd ▲','Safe']},
   {id:'rival',label:'Talk to {F}',hint:'{F} is not here to answer. Say what you like; it will be on tape by tomorrow.',tags:['Feud heat ▲']},
   {id:'self',label:'Talk about themselves',hint:'Pure swagger. Brilliant with an ego to back it up; grating without one.',tags:['Gamble','Ego']},
   {id:'top',label:'Talk past tonight',hint:'Name the title picture. The promoter hears ambition; {F} hears disrespect.',tags:['Ambition','Trust ±']}]},
  {id:'hook',name:'The hook',help:'They have the room’s attention. What is the line people take home?',options:[
   {id:'catch',label:'Build to a catchphrase',hint:'If the crowd knows it, they shout it back. If not, it is a long silence.',tags:['Gamble','Crowd ▲▲']},
   {id:'story',label:'Tell a true story',hint:'Something real from before wrestling. A low ceiling, and hard to get wrong.',tags:['Safe','Quality ▲']},
   {id:'threat',label:'Make a threat',hint:'Spell out what happens to {F} tonight. Words they will have to back up.',tags:['Feud heat ▲']},
   {id:'town',label:'Insult the town',hint:'Cheap heat. The room turns on {W}, and they will pay to watch them lose.',tags:['Crowd turns','Heat ▲▲']}]},
  {id:'close',name:'The closer',help:'Time to get out. How does {W} leave the ring?',options:[
   {id:'vow',label:'Promise a win',hint:'Say it out loud: {W} wins tonight. The crowd will hold them to it after the bell.',tags:['Public promise','Heat ▲']},
   {id:'clean',label:'Promise a clean finish',hint:'No shortcuts, a clean fall in the middle. Win or lose, people will check.',tags:['Public promise','Respect']},
   {id:'drop',label:'Drop the microphone',hint:'Perfect if the room is with them. Embarrassing if it is not.',tags:['Gamble']},
   {id:'walk',label:'Done talking',hint:'Said what they came to say. Nothing more to add.',tags:['Safe','Cool']},
   {id:'more',label:'Keep talking',hint:'One more minute. Great talkers find a second gear; everyone else loses the room.',tags:['Gamble','Mic ▲▲']}]}
 ];
 const SOLO_SAY={
  crowd:{grand:'“Look at you all. Dressed up, paid up, and here for ME. I would not have it any other way.”',gruff:'“You lot paid to be here. I’ll make it worth it. That’s all.”',eager:'“Is this real? Are you really this loud? Do it again! Louder!”',stoic:'“Thank you for coming. I will not waste your night.”',precise:'“Every one of you bought a ticket. I intend to give you value for it.”',earnest:'“I mean this. Without you lot I’m just someone in a car park doing press-ups.”',sermon:'“Brothers and sisters of {V}, the congregation is full tonight.”',slippery:'“I love you all. Most of you. The front row, especially. Lovely people.”'},
  rival:{grand:'“{F}. I know you are watching backstage. Watch closely. This is what a star looks like.”',gruff:'“{F}. You’re not out here. Good. Saves me some time.”',eager:'“{F}! I know you can hear me! I’m coming for you! Tonight! Properly!”',stoic:'“{F}. I have nothing to say to you. Tonight I will show you instead.”',precise:'“{F}, you have three habits in the ring. I have studied all three.”',earnest:'“{F}, I respect you. I’m still going to beat you. Both things are true.”',sermon:'“{F}, you have been weighed. Tonight you will be found wanting.”',slippery:'“{F} couldn’t make it out here. Probably still doing their hair.”'},
  self:{grand:'“They will write songs about tonight. They will need a lot of verses.”',gruff:'“I’m the hardest person in this building. That’s not a boast. Ask around.”',eager:'“I have been training SO hard. I can do a moonsault now. Nearly!”',stoic:'“I do not need to tell you who I am. You will see it.”',precise:'“I have studied every second of every match I have had. There are no weaknesses left to find.”',earnest:'“I’m not the biggest, I’m not the loudest. I just never stop.”',sermon:'“I was put on this earth to do one thing, and I am about to do it.”',slippery:'“I’m the most talented person here. I’d know. I checked everyone’s wages.”'},
  top:{grand:'“{F} is a warm-up. A light rehearsal. I am here for the gold.”',gruff:'“Tonight’s a step. The belt’s the stairs. I’m climbing.”',eager:'“One day I’m going to be champion. Maybe soon! Maybe after tonight!”',stoic:'“I will win tonight. Then I will ask for what I am owed.”',precise:'“Win tonight, win twice more, and the title match is logically mine.”',earnest:'“I want that title. I’m not ashamed to say it. I’ll earn it first.”',sermon:'“The throne is empty in all but name. I am coming to fill it.”',slippery:'“I’m not saying {P} owes me a title shot. I’m saying people are saying it.”'},
  catch_ok:'The catchphrase lands and half the room shouts it back before {W} finishes it.',
  catch_no:'{W} leaves a gap for the crowd to finish the line. Nobody does. Somebody coughs.',
  story:{grand:'“When I was nine I put on a bedsheet and wrestled the dog. The dog won. I have not lost since.”',gruff:'“My dad worked the docks forty years. Never missed a shift. I don’t miss either.”',eager:'“First show I ever saw, I sat in the cheap seats. Tonight I’m the show! That’s mad!”',stoic:'“I trained in a garage with no heating. Every winter. That is all you need to know.”',precise:'“My first coach made me run the same drill four hundred times. I still count.”',earnest:'“My mum drove me to every training session for six years. She’s here tonight. Hi, Mum.”',sermon:'“I was lost once. Then I found a ring, and the ring found me.”',slippery:'“I used to sell dodgy watches outside this very building. Some of you still have one.”'},
  threat:{grand:'“{F} will leave this building on a stretcher, and I will insist it is a nice one.”',gruff:'“{F} is going to be eating through a straw. Simple as.”',eager:'“I’m going to beat {F} SO badly they’ll have to rename the match after me!”',stoic:'“{F} will not get up. That is not a threat. It is the schedule.”',precise:'“Left knee first. Then the back. Then the count. In that order.”',earnest:'“I’m going to hurt {F} tonight. I don’t like saying it, but it’s true.”',sermon:'“Tonight {F} learns that every sin has a wage, and I am here to pay it.”',slippery:'“Something bad is going to happen to {F} tonight. I won’t say what. Might be me.”'},
  town:{grand:'“{V}. I have played better rooms. I have played better car parks.”',gruff:'“This town smells. I said it. Boo all you want.”',eager:'“This place is a bit rubbish, isn’t it? Sorry! But it is!”',stoic:'“I have been to {V} before. Nothing has improved.”',precise:'“{V} has the worst crowd I have measured this year. I keep records.”',earnest:'“I’m sorry, but you lot booed a charity raffle earlier. Shame on you.”',sermon:'“I have walked through many dark valleys. None as dark as {V}.”',slippery:'“Lovely to be back in {V}. I’ve already had my wallet nicked twice.”'},
  vow:{grand:'“Write it down, frame it, hang it in the foyer: I will win tonight.”',gruff:'“Simple. I’m winning tonight.”',eager:'“I am going to win tonight! I am! I will win!”',stoic:'“I will win tonight.”',precise:'“I have done the preparation. I will win this match.”',earnest:'“I’ve never said this before, so listen: I will win tonight.”',sermon:'“It has been foretold, and I will make it so. I will win tonight.”',slippery:'“No tricks this time. Honestly. I will win tonight.”'},
  clean:{grand:'“A clean fall, in the middle of the ring, under the brightest lights. Nothing less.”',gruff:'“Clean fall in the middle. No funny business.”',eager:'“No cheating! A clean pin, right in the middle! That’s how I want it!”',stoic:'“Clean. In the middle. One fall.”',precise:'“One clean fall in the centre of the ring. Those are my terms.”',earnest:'“Whatever happens, it’ll be a clean fall in the middle. You have my word.”',sermon:'“No sin tonight. A clean fall in the centre of the ring.”',slippery:'“A clean fall in the middle. I know. Nobody is more surprised than me.”'},
  done:{grand:'“And that, ladies and gentlemen, is all you are getting for free.”',gruff:'“Done talking.”',eager:'“Okay! That’s it! See you later!”',stoic:'“That is all.”',precise:'“I have nothing further to add.”',earnest:'“That’s all I wanted to say. Thank you.”',sermon:'“I have spoken.”',slippery:'“That’s your lot. Tip your bar staff.”'},
  more_ok:'{W} finds a second gear. Every line gets a bigger reaction than the one before it.',
  more_no:'{W} keeps going after the room has stopped listening. The lighting crew start checking their watches.'
 };
 function solo(st,R,o){
  const vw=voice(st.w);
  if(R.id==='aim'){
   line(st,'stage','{W} walks to the centre of the ring and waits for the noise to drop.');
   if(o.id==='crowd')speak(st,bankLine(st,'aim',[['open','people','p_short'],['open','people','p_working']],noYou),SOLO_SAY.crowd[vw]);
   else if(o.id==='rival'){line(st,'stage','{W} looks into the hard camera and talks to {F}.');speak(st,bankLine(st,'aim',CHALLENGES),SOLO_SAY.rival[vw]);}
   else if(o.id==='self'){const pick=bankLine(st,'aim',[['open','swagger','sw_main'],['open','swagger','sw_pose']],noYou);if(pick?.variant==='sw_pose')line(st,'stage','{W} strikes a pose and holds it.');speak(st,pick,SOLO_SAY.self[vw]);}
   else line(st,'w',SOLO_SAY[o.id][vw]);
   if(o.id==='crowd'){st.room+=4+(st.w.heat>=50?3:0);st.quality+=3;}
   else if(o.id==='rival'){st.heat+=3;st.quality+=3;st.room+=1;}
   else if(o.id==='self'){const ok=roll(st,'self',(st.w.ego>=70?.15:-.05));st.room+=ok?6:-5;st.quality+=ok?7:-3;line(st,'crowd',ok?'They eat it up. Somebody at the back starts a chant.':'It goes down badly. A couple of people laugh in the wrong places.');}
   else{st.heat+=2;st.quality+=4;st.flags.ambition=true;}
  }else if(R.id==='hook'){
   if(o.id==='catch'){const ok=roll(st,'catch',st.room>=5?.1:0);line(st,'stage',SOLO_SAY[ok?'catch_ok':'catch_no']);st.room+=ok?8:-4;st.quality+=ok?9:-4;}
   else if(o.id==='story'){line(st,'w',SOLO_SAY.story[vw]);st.room+=3;st.quality+=5;}
   else if(o.id==='threat'){line(st,'w',SOLO_SAY.threat[vw]);st.heat+=4;st.quality+=3;st.room+=1;}
   else{line(st,'w',SOLO_SAY.town[vw]);line(st,'crowd','The whole room boos. It is the loudest they have been all night.');st.room-=12;st.heat+=5;st.quality+=5;st.flags.cheap=true;}
  }else{
   if(o.id==='vow'){speak(st,bankLine(st,'vow',[['close','vow','vo_plain'],['close','vow','vo_hard']],'commit'),SOLO_SAY.vow[vw]);st.promise={type:'win',claim:'vow',checked:false};st.heat+=2;st.quality+=3;line(st,'crowd',st.room>=0?'The crowd roars. They will remember that.':'The boos get louder. They want to see that promise broken.');}
   else if(o.id==='clean'){speak(st,bankLine(st,'clean',[['close','clean','cl_middle']],'commit'),SOLO_SAY.clean[vw]);st.promise={type:'clean',claim:'clean',checked:false};st.quality+=3;st.room+=1;}
   else if(o.id==='drop'){const ok=st.room>=6||(st.flags.cheap&&roll(st,'drop'));
    line(st,'stage',ok?'{W} drops the microphone. The thud gets a bigger cheer than most finishes.':'{W} drops the microphone. It bounces, feeds back, and somebody has to go and fetch it.');st.quality+=ok?6:-4;}
   else if(o.id==='walk'){speak(st,bankLine(st,'done',[['close','uncertainty','un_done']],noYou),SOLO_SAY.done[vw]);line(st,'stage','{W} hands the microphone to the timekeeper and walks up the ramp without looking back.');st.quality+=1;}
   else{const ok=roll(st,'more',-.05);line(st,'stage',SOLO_SAY[ok?'more_ok':'more_no']);st.quality+=ok?9:-7;st.room+=ok?(st.room>=0?5:-5):-4;}
  }
 }

 /* ---------- pre-taped vignette ---------- */
 const VIGNETTE=[
  {id:'setting',name:'The setting',help:'The crew has a day with {W}. Where do they shoot it?',options:[
   {id:'gym',label:'A gym before dawn',hint:'Sweat, breath and a single bulb. Suits intensity and sincerity.',tags:['Intense','Heartfelt']},
   {id:'home',label:'Where they grew up',hint:'The street, the school gates, the old ring. Suits warmth and humour.',tags:['Heartfelt','Comedy']},
   {id:'dark',label:'An empty, dark building',hint:'Shadows and a flickering light. Suits menace and mystery.',tags:['Menace','Mystery']},
   {id:'road',label:'On the road between shows',hint:'Motorway services at two in the morning. Suits almost anything.',tags:['Flexible']}]},
  {id:'tone',name:'The tone',help:'What should people feel when the screen goes dark?',options:[
   {id:'intense',label:'Intense',hint:'Focus, pain and preparation. Works best for a serious, quiet type.',tags:['Gruff','Precise','Stoic']},
   {id:'heartfelt',label:'Heartfelt',hint:'Why this matters to them. Works best for someone the crowd can believe.',tags:['Earnest','Eager']},
   {id:'comedy',label:'Funny',hint:'Make them laugh. A gift for a natural clown, a disaster for anyone else.',tags:['Gamble','Grand','Slippery','Eager']},
   {id:'menace',label:'Menacing',hint:'Say little and let the camera do the rest. Something is coming for {F}.',tags:['Sermon','Stoic','Gruff']}]},
  {id:'edit',name:'The edit',help:'The footage is in. How does the package end?',options:[
   {id:'tight',label:'A tight minute',hint:'Cut it short and sharp. Nothing outstays its welcome.',tags:['Safe']},
   {id:'long',label:'Let it breathe',hint:'Three full minutes. Wonderful if the footage is good; a drag if it is not.',tags:['Gamble']},
   {id:'message',label:'End on a message to {F}',hint:'Straight down the lens, one line for the opponent.',tags:['Feud heat ▲']},
   {id:'tease',label:'End on a cliffhanger',hint:'Something unexplained in the final frame. People will talk about it all week.',tags:['Crowd ▲','Intrigue']}]}
 ];
 const FIT={gym:['intense','heartfelt'],home:['heartfelt','comedy'],dark:['menace','intense'],road:['intense','heartfelt','comedy','menace']};
 const TONE_VOICE={intense:['gruff','precise','stoic'],heartfelt:['earnest','eager','gruff'],comedy:['grand','slippery','eager'],menace:['sermon','stoic','gruff','precise']};
 const SHOT={gym:'The screen fades up on {W} in an empty gym before sunrise, wrapping their wrists under a single bulb.',
  home:'The screen fades up on a terraced street. {W} walks past the house where they grew up.',
  dark:'The screen fades up on darkness. A light flickers on, and {W} is already sitting in the middle of the room.',
  road:'The screen fades up on motorway services at two in the morning. {W} is eating chips out of the paper.'};
 const VIG_SAY={
  intense:{grand:'“Every morning, while the world sleeps, I am becoming a legend.”',gruff:'“Nobody sees this bit. This is the only bit that counts.”',eager:'“Five more. Five more. Five more. I always say five more.”',stoic:'{W} says nothing for the whole minute. The skipping rope does the talking.',precise:'“Six-forty a.m. Set seven of nine. On schedule.”',earnest:'“I’m tired. I’m always tired. I’m still here.”',sermon:'“The body is a temple. I am rebuilding mine for war.”',slippery:'“Honestly, I hate the gym. But it’s where they keep the free towels.”'},
  heartfelt:{grand:'“They said a kid from here would never be a star. Look at me now, street.”',gruff:'“Didn’t have much growing up. Still don’t. Got this, though.”',eager:'“I used to practise my entrance in that garden! The neighbours HATED it!”',stoic:'“My grandfather wrestled. I never saw it. I carry it anyway.”',precise:'“I can tell you the exact day I decided to do this. It was a Tuesday.”',earnest:'“I just want to make the people here proud. That’s all it’s ever been.”',sermon:'“This is where I was born, and this is where I was born again.”',slippery:'“Lovely little house. I’d show you inside, but there’s a court order.”'},
  comedy:{grand:'“A champion must eat like a champion.” {W} drops a chip, and stares at it for a long time.',gruff:'{W} tries to explain the plan for the match using salt and pepper pots, and loses the pepper.',eager:'{W} tries to do a dramatic slow-motion run down the street and trips over a bin.',stoic:'{W} watches a pigeon for forty seconds. Neither of them blinks.',precise:'{W} times how long the microwave takes. “Wrong,” they say, and write it down.',earnest:'{W} keeps apologising to the camera crew for being boring. They are not boring.',sermon:'{W} blesses a vending machine. It gives them two bags of crisps.',slippery:'{W} pretends to be a fan and asks other people at the services for their own autograph.'},
  menace:{grand:'“{F}. Enjoy your applause while it lasts. Curtains always fall.”',gruff:'“{F}. Tonight.” The light goes out.',eager:'{W} just smiles at the camera, and keeps smiling far too long.',stoic:'{W} says nothing. They slowly turn a photograph of {F} face down.',precise:'“I know exactly where you will be at nine-fifteen tonight, {F}. I will be there too.”',earnest:'“I didn’t want it to come to this, {F}. You made it this way.”',sermon:'“Repent, {F}. The hour is nearly here.”',slippery:'“Hello, {F}. Look under your bed tonight. Or don’t. Your choice.”'}
 };
 function vignette(st,R,o){
  const vw=voice(st.w);
  if(R.id==='setting'){st.flags.setting=o.id;line(st,'stage',SHOT[o.id]);st.quality+=o.id==='road'?1:2;}
  else if(R.id==='tone'){
   st.flags.tone=o.id;const fit=FIT[st.flags.setting]?.includes(o.id),suits=TONE_VOICE[o.id].includes(vw);
   line(st,o.id==='comedy'||/^\{W\} /.test(VIG_SAY[o.id][vw])?'stage':'w',VIG_SAY[o.id][vw]);
   st.quality+=(fit?5:-3)+(suits?6:o.id==='comedy'?-6:-2);st.flags.good=fit&&suits;
   if(o.id==='menace')st.heat+=2;
  }else{
   if(o.id==='tight'){line(st,'stage','Sixty seconds, sharp cuts, out on {W}’s name. The hall applauds the screen.');st.quality+=3;}
   else if(o.id==='long'){line(st,'stage',st.flags.good?'The package plays for three minutes, and the hall watches every second in silence.':'Three minutes is a long time. By the end, people are looking at their phones.');st.quality+=st.flags.good?7:-5;}
   else if(o.id==='message'){line(st,'w','“{F}. You have seen what I do to get ready. Now come and see the rest.”');st.heat+=3;st.quality+=2;}
   else{line(st,'stage','In the final frame, something is written on the wall behind {W}. The screen cuts out before anyone can read it.');st.quality+=2;st.heat+=1;st.flags.tease=true;}
  }
 }

 /* ---------- backstage ambush ---------- */
 const AMBUSH=[
  {id:'where',name:'Where?',help:'{F} is somewhere in the building. Where does {W} find them?',options:[
   {id:'car',label:'The car park as {F} arrives',hint:'Nobody sees it live. A camera crew catches the end of it for the screen.',tags:['Heat ▲','Seen on tape']},
   {id:'catering',label:'Catering, in front of everyone',hint:'The whole locker room sees it. Some of them will remember.',tags:['Heat ▲▲','Locker room notices']},
   {id:'interview',label:'During {F}’s live interview',hint:'Live on the screen in the hall. The biggest reaction, and the promoter will be watching.',tags:['Crowd ▲▲','Promoter ±']}]},
  {id:'how',name:'The attack',help:'{W} has {F} where they want them. How far do they take it?',options:[
   {id:'quick',label:'A few shots, then gone',hint:'In and out before anyone can react.',tags:['Opponent hurt ▲']},
   {id:'ground',label:'Take them down and keep them there',hint:'More damage, but it gives {F} time to fight back.',tags:['Opponent hurt ▲▲','Risk: they fight back']},
   {id:'chair',label:'Bring a chair',hint:'The most damage. The promoter will have something to say about it.',tags:['Opponent hurt ▲▲▲','Trust ▼']},
   {id:'stare',label:'No contact. A stare and a warning',hint:'Get in their face and leave them wondering. Mind games, not bruises.',tags:['Mind games','No damage']}]},
  {id:'after',name:'Afterwards',help:'Security is on its way. What does {W} do with the last few seconds?',options:[
   {id:'stand',label:'Stand over them',hint:'Make sure the camera gets the picture.',tags:['Heat ▲']},
   {id:'line',label:'One line to the camera',hint:'A few words while {F} is still on the floor. Only as good as {W}’s microphone.',tags:['Gamble','Crowd ▲']},
   {id:'leave',label:'Walk off calmly',hint:'As if nothing happened. Colder than any speech.',tags:['Cool']},
   {id:'more',label:'Go back for more',hint:'Fight through the security. More damage, more trouble, and {F} may finally hit back.',tags:['Opponent hurt ▲','Trust ▼','Risk']}]}
 ];
 const AMB_SAY={
  car:'The camera picks it up in the car park. {F} is still getting a bag out of the boot when {W} arrives.',
  catering:'Catering goes quiet. {W} walks straight past the sandwiches towards {F}.',
  interview:'The screen in the hall shows {F} mid-interview. Then {W} walks into the shot from behind.',
  quick:'Three heavy shots, a shove into the wall, and {W} is already moving away.',
  ground:'{W} drags {F} to the floor and stays on top of them, throwing blows.',
  chair:'{W} picks up a folding chair. The sound of it carries all the way to the hall.',
  stare:'{W} stops an inch from {F}’s face and stays there. Nobody breathes.',
  stand:'{W} stands over {F}, chest heaving, until the camera has had its fill.',
  leave:'{W} straightens their jacket and walks off as if they were late for a bus.',
  more:'Security gets between them. {W} goes straight through the security.',
  back:'{F} gets up quicker than anyone expected and catches {W} with a shot of their own before they are pulled apart.',
  say:{grand:'“Save your energy, {F}. You will need it for crawling.”',gruff:'“Tonight’s worse.”',eager:'“That’s just a preview! The real thing is LATER!”',stoic:'“Nine-fifteen.”',precise:'“That is the left knee taken care of.”',earnest:'“I’m sorry. Not very sorry.”',sermon:'“And so it begins.”',slippery:'“Oops. Slipped. Twice.”'},
  sayNo:'The line comes out wrong over the noise, and the moment is gone.'
 };
 const HURT={quick:6,ground:10,chair:14,stare:0};
 function ambush(st,R,o){
  if(R.id==='where'){st.flags.vis=o.id==='car'?1:o.id==='catering'?2:3;line(st,'stage',AMB_SAY[o.id]);st.heat+=st.flags.vis+1;st.quality+=st.flags.vis*3;}
  else if(R.id==='how'){
   st.flags.how=o.id;st.hurt+=HURT[o.id];line(st,'stage',AMB_SAY[o.id]);
   st.heat+=o.id==='stare'?2:o.id==='chair'?5:o.id==='ground'?4:3;st.quality+=o.id==='chair'?6:o.id==='stare'?2:4;
   if(o.id==='stare'){line(st,'f','{F} does not move. It looks like it costs them something.');st.flags.mind=true;}
   if(o.id==='chair')st.trust-=likesTrouble(st.p)?0:3;
   st.back+=o.id==='ground'?.3:o.id==='quick'?.12:o.id==='chair'?.08:0;
  }else{
   if(o.id==='stand'){line(st,'stage',AMB_SAY.stand);st.heat+=2;st.quality+=2;}
   else if(o.id==='line'){const ok=roll(st,'line');line(st,ok?'w':'stage',ok?AMB_SAY.say[voice(st.w)]:AMB_SAY.sayNo);st.quality+=ok?5:-2;}
   else if(o.id==='leave'){line(st,'stage',AMB_SAY.leave);st.quality+=3;}
   else{line(st,'stage',AMB_SAY.more);st.hurt+=st.flags.how==='stare'?4:5;st.heat+=3;st.trust-=likesTrouble(st.p)?0:2;st.back+=.3;st.quality+=3;}
   const backChance=st.back+(st.f.ego>=75?.1:0)+(st.flags.vis>=2?.05:0);
   if(st.flags.how!=='stare'&&hash(st.cid+'|ambush|back')<backChance){line(st,'f',AMB_SAY.back);st.flags.fought=true;st.hurt=Math.max(0,st.hurt-4);}
   line(st,'p',st.flags.vis===3?(likesTrouble(st.p)?'{P}, watching on the monitor, is grinning.':'{P}, watching on the monitor, is not grinning.'):'Word reaches {P} within a minute.');
   if(st.flags.vis===3)st.trust+=likesTrouble(st.p)?2:-1;
  }
 }

 /* ---------- interview grilling ---------- */
 const GRILL_Q=[
  {id:'hurt',when:(st)=>!!st.w.injury||st.w.fatigue>=40,q:'You are clearly not at your best physically. Is it smart to wrestle tonight?'},
  {id:'flat',when:(st)=>st.w.morale<45,q:'People backstage say you have looked flat lately. Are they wrong?'},
  {id:'personal',when:(st)=>st.heat0>=35,q:'This has become personal with {F}. Has it gone too far?'},
  {id:'ego',when:(st)=>st.w.ego>=75,q:'Some of the locker room say you think you are bigger than this company. Fair?'},
  {id:'unknown',when:(st)=>st.w.heat<35,q:'Plenty of people here do not know who you are. Why should they care?'},
  {id:'league',when:()=>true,q:'{F} says you are not in their league. What do you say to that?'},
  {id:'promoter',when:()=>true,q:'{P} has put you in this spot. Are you worth it?'},
  {id:'after',when:()=>true,q:'If you lose tonight, what then?'}
 ];
 // Which bank slots can answer which question, straight.
 const GRILL_SLOTS={hurt:[['close','clean','cl_middle'],['close','vow','vo_hard']],flat:[['open','people','p_working'],['open','people','p_short']],
  personal:[['answer','calm','ca_restraint']],ego:[['open','swagger','sw_main']],unknown:[['open','people','p_short'],['open','swagger','sw_main']],
  league:[['open','swagger','sw_main'],['answer','calm','ca_restraint']],promoter:[['open','swagger','sw_main'],['close','vow','vo_plain']],
  after:[['close','clean','cl_middle'],['close','vow','vo_hard']]};
 const GRILL_OPTS=[
  {id:'straight',label:'Answer it straight',hint:'Honest and direct. A safe answer, and people respect it.',tags:['Safe','Morale ▲']},
  {id:'joke',label:'Laugh it off',hint:'Deflect with a joke. Charming if it lands; evasive if it does not.',tags:['Gamble']},
  {id:'turn',label:'Turn it on {F}',hint:'Do not answer. Make it about the opponent instead.',tags:['Feud heat ▲']},
  {id:'storm',label:'Walk out',hint:'End the interview now. A moment people remember, for better or worse.',tags:['Ends it','Heat ▲','Trust ▼']}
 ];
 const GRILL_SAY={
  straight:{grand:['“A fair question, and I shall answer it fairly: I am exactly where I belong.”','“Even legends are asked hard questions. I welcome it. Watch me answer it in the ring.”'],
   gruff:['“Fair. Ask me again after the match.”','“Yeah, I’ve heard that. Doesn’t change what I do tonight.”'],
   eager:['“Honestly? I think about that a lot. But I’m ready. I really am.”','“That’s a good question! I don’t have a clever answer. I just work hard.”'],
   stoic:['“Fair question. Watch the match. That is my answer.”','“I have heard it. I am still here.”'],
   precise:['“There are three parts to that question. I will answer the third: I am prepared.”','“I have thought about it carefully. My preparation is the answer.”'],
   earnest:['“That’s fair. I’ve asked myself the same thing. All I can do is give everything tonight.”','“I won’t pretend. It’s been hard. That’s why tonight matters.”'],
   sermon:['“Every man is tested. This is mine, and I accept it.”','“The question is fair. The answer will be written in the ring.”'],
   slippery:['“Look, honestly, completely honestly, yes. Mostly. Next question.”','“Great question. Truly. I’ll answer it fully in my autobiography.”']},
  joke:{grand:['“Darling, I have been asked worse questions by better interviewers.”','“If I answered every question, I would never have time to be magnificent.”'],
   gruff:['“Is that on the cards? Bit long, innit.”','“Next you’ll ask about my feelings.”'],
   eager:['“Ha! Good one! Wait, was that a joke? It sounded like a joke.”','“Can we ask about my boots instead? They’re new!”'],
   stoic:['“No.” A long pause. “That was the joke.”','“I will think about it. I have thought about it. Next.”'],
   precise:['“I calculate a ninety-four per cent chance that question was rude.”','“Let me check my notes. Ah. It says ‘ignore the interviewer’.”'],
   earnest:['“Oh, come on, you’re meant to be on my side!”','“You’re being really mean tonight. Did someone eat your sandwich?”'],
   sermon:['“Even the prophets were heckled.”','“I forgive you for that question. Barely.”'],
   slippery:['“Is this live? Hi, Mum. Next question.”','“Who wrote that question? Was it {F}? It sounds like {F}.”']},
  turn:{grand:['“The real question is why {F} is hiding backstage instead of standing here.”','“Ask {F} that question. I suspect they will need a lie down afterwards.”'],
   gruff:['“Ask {F}. They’re the one who should be worried.”','“Why are we talking about me? {F}’s the problem.”'],
   eager:['“{F} should answer that! Go and find them! I’ll wait!”','“That’s more of a {F} question, really. They’re rubbish.”'],
   stoic:['“Ask {F}. They have more to answer for.”','“{F} is the one who should answer that.”'],
   precise:['“Interesting question. Here is a better one: why is {F} not standing here to answer it?”','“Ask {F} how their conditioning is. I already know the answer.”'],
   earnest:['“I’d rather talk about what {F} has been saying. It isn’t right.”','“With respect, {F} has said a lot worse about me. Ask them.”'],
   sermon:['“Do not look for sin in me while {F} walks free.”','“{F} is the one who must answer. Tonight, they will.”'],
   slippery:['“Have you asked {F} about the money they owe me? Thought not.”','“I think the real story here is {F}. Not that I’d ever gossip.”']},
  storm:{grand:'“This interview is OVER.”',gruff:'“Done.”',eager:'“I don’t have to listen to this!”',stoic:'{W} hands the microphone back without a word.',precise:'“I have answered enough questions for one evening.”',earnest:'“Sorry. I can’t do this right now.”',sermon:'“I will not be judged by you.”',slippery:'“Ooh, look at the time. Must dash.”'}
 };
 function grillQuestions(st){
  const live=GRILL_Q.filter(q=>q.when(st));
  const special=live.filter(q=>!['league','promoter','after'].includes(q.id)),stock=live.filter(q=>['league','promoter','after'].includes(q.id));
  const order=a=>a.slice().sort((x,y)=>hash(st.cid+'|q|'+x.id)-hash(st.cid+'|q|'+y.id));
  // The hard questions come first, then the stock ones; the last one is always the hardest to dodge.
  return [...order(special).slice(0,2),...order(stock)].slice(0,3).map(q=>q.id);
 }
 const askLine=(st,i)=>{const q=GRILL_Q.find(x=>x.id===st.questions[i]);line(st,'host','“'+q.q+'”');};
 function grilling(st,R,o){
  const vw=voice(st.w),say=GRILL_SAY[o.id];
  if(o.id==='storm'){
   // Generated rookie banks have no true "done talking" line, so a walk-out keeps the voice line for them.
   const rookie=/^(?:academy|rookie)-/.test(st.dialogue?.facts?.player?.id||'');
   speak(st,rookie?null:bankLine(st,'storm',[['close','uncertainty','un_done']],noYou),say[vw]);line(st,'stage','{W} walks out of shot. The interviewer stands there holding the microphone.');
   st.heat+=3;st.quality+=st.round===0?2:4;st.room-=2;st.trust-=1;st.flags.walked=true;st.stage='done';return;
  }
  const text=say[vw][st.round%2];
  if(o.id==='straight'){speak(st,bankLine(st,'q'+st.round,GRILL_SLOTS[st.questions[st.round]]||[],answerable),text);st.quality+=4;st.room+=2;st.morale+=1;}
  else if(o.id==='joke'){const ok=roll(st,'joke'+st.round);line(st,'w',text);line(st,'crowd',ok?'The hall laughs along on the screen.':'Nobody laughs. The interviewer waits for a proper answer.');st.quality+=ok?6:-3;st.room+=ok?4:-3;}
  else{line(st,'stage','{W} looks past the interviewer, straight into the camera.');speak(st,bankLine(st,'q'+st.round,CHALLENGES),text);st.heat+=3;st.quality+=2;}
 }
 const ENGINES={
  solo:{rounds:SOLO,step:solo,name:'Solo promo'},
  vignette:{rounds:VIGNETTE,step:vignette,name:'Pre-taped vignette'},
  ambush:{rounds:AMBUSH,step:ambush,name:'Backstage ambush'},
  grilling:{rounds:[0,1,2].map(i=>({id:'q'+i,name:['The first question','The next question','The last question'][i],help:'The interviewer is waiting.',options:GRILL_OPTS})),step:grilling,name:'Interview grilling'}
 };

 /* ---------- the scene ---------- */
 const BANKED=new Set(['solo','grilling']);
 function begin(type,c,w,f,p,opts={}){
  if(!ENGINES[type])return null;
  const heat0=Math.max(c.feudHeat||0,G?.feud?.(w.id,f.id)?.heat||0);
  const st={v:1,type,cid:c.id,round:0,stage:'live',
   w:{id:w.id,short:w.short,name:w.name,mic:w.mic||50,ego:w.ego||50,heat:w.heat||40,morale:w.morale??60,fatigue:w.fatigue||0,injury:w.injury||null},
   f:{id:f.id,short:f.short,name:f.name,mic:f.mic||55,ego:f.ego||60},
   p:{id:p.id,voice:p.voice,name:p.name,venue:p.venue||'the hall',tv:!!p.tv,personality:p.personality||null},
   heat0,quality:type==='vignette'?48+(p.tv?5:0):clamp(36+(w.mic||50)*.3),room:0,heat:0,hurt:0,back:0,trust:0,morale:0,log:[],picks:[],flags:{},questions:null,promise:null};
  // The wrestler's own bank goes into the save with the scene, so choices never need the network.
  const D=Dialogue();
  if(BANKED.has(type)&&D&&Array.isArray(opts.banks)){
   const facts=D.snapshot(c,w,f,null,p,{}),own=root.OfficePromoIdentity?.bankId?.(w)||w.id;
   const banks=JSON.parse(JSON.stringify(opts.banks.filter(b=>b&&b.owner===own))).slice(0,1);
   // Manifest-free academy entrants get the same runtime bank the duel would compile for them.
   const future=!banks.length?root.OfficeRookiePhraseFactory?.runtime?.(w):null;
   if(future){banks.push(future.bank);facts.player={...facts.player,id:w.id,academy:{id:w.id,tactic:future.profile.tactic,delivery:future.profile.delivery}};facts.client={...facts.player};}
   st.dialogue={v:1,banks,facts,used:[],recent:D.recentIds(G?.feud?.(w.id,f.id),G?.S?.history||[])};
  }
  if(type==='solo')line(st,'stage','The lights drop. {W}’s music hits, and they come out alone with a microphone.');
  else if(type==='vignette')line(st,'stage','The lights in {V} go down and the big screen comes on.');
  else if(type==='ambush')line(st,'stage','The cameras are backstage. {F} is in the building. So is {W}.');
  else{st.questions=grillQuestions(st);line(st,'stage','Backstage, {W} is standing with the interviewer. {F} is nowhere to be seen.');askLine(st,0);}
  return st;
 }
 function rounds(st){return ENGINES[st.type].rounds;}
 function options(st){
  if(st?.stage!=='live')return [];
  return rounds(st)[st.round].options.map(o=>({id:o.id,label:fill(o.label,st),hint:fill(o.hint,st),tags:o.tags.map(t=>fill(t,st))}));
 }
 function choose(st,id){
  if(st?.stage!=='live')return false;
  const R=rounds(st)[st.round],o=R.options.find(x=>x.id===id);if(!o)return false;
  st.picks.push(id);ENGINES[st.type].step(st,R,o);
  if(st.stage==='live'){st.round++;if(st.round>=rounds(st).length)st.stage='done';else if(st.type==='grilling')askLine(st,st.round);}
  if(st.stage==='done'){if(st.type==='grilling')closeGrilling(st);settle(st);}
  return true;
 }
 function closeGrilling(st){
  if(st.flags.walked)return;
  line(st,'stage',st.room>=4?'The interviewer thanks {W}. On the screen in the hall, people are applauding.':'The interviewer thanks {W}, who is already walking away.');
 }
 // Once, when the scene ends: whatever happens before the bell happens now.
 function settle(st){
  if(st.settled)return;st.settled=true;
  const w=G?.W?.(st.w.id),p=G?.P?.(st.p.id);
  if(st.flags.ambition&&p&&st.type==='solo'){const dt=likesTrouble(p)?2:p.personality==='traditional'?-1:0;st.trust+=dt;}
  if(p&&st.trust)p.trust=clamp(p.trust+st.trust);
  if(w&&st.morale)w.morale=clamp(w.morale+st.morale);
  if(w&&st.flags.fought){w.fatigue=clamp(w.fatigue+5);w.flags={...(w.flags||{}),pushThrough:true};}
  G?.save?.();
 }
 function result(st){
  if(st?.stage!=='done')return null;
  const E=ENGINES[st.type],cap95=st.type==='vignette'?82:95;
  const q=clamp(st.quality+st.room*.4+(st.type==='ambush'?st.hurt*.4:0),12,cap95);
  const energy=st.type==='solo'&&st.flags.cheap?Math.abs(st.room)*.25:st.room*.25;
  const crowdShift=Math.max(-6,Math.min(13,Math.round((q-50)/6+energy+(st.type==='ambush'?st.flags.vis:0)+(st.flags.tease?2:0))));
  const heatDelta=clamp(st.heat,0,16);
  const style=st.type==='solo'&&st.picks[0]==='crowd'?'rally':st.type==='solo'&&st.picks[1]==='threat'?'challenge':null;
  const hook=cap(st.type==='solo'&&st.promise?(st.promise.type==='win'?`${st.w.short} promised the crowd a win tonight. Now they have to deliver it.`:`${st.w.short} promised a clean finish in front of everyone.`):st.type==='solo'?(st.flags.cheap?`${st.w.short} insulted ${st.p.venue} before the match. The crowd wants blood.`:q>=65?`${st.w.short} had the room in the palm of their hand before the bell.`:`${st.w.short} spoke alone before the match. Now they have to back it up.`):
   st.type==='vignette'?(st.flags.tease?`Nobody has worked out what was on the wall in ${st.w.short}’s video.`:q>=65?`That video package has the crowd ready for ${st.w.short}.`:`The video package is over. The real thing is next.`):
   st.type==='ambush'?(st.flags.mind?`${st.w.short} got in ${st.f.short}’s face backstage and did not throw a punch. ${st.f.short} looks rattled.`:st.flags.fought?`${st.w.short} jumped ${st.f.short} backstage, but ${st.f.short} hit back. Both of them are marked.`:`${st.w.short} jumped ${st.f.short} backstage. ${st.f.short} is still holding their ribs.`):
   st.flags.walked?`${st.w.short} walked out of their interview. Nobody knows what kind of mood they are in.`:`${st.w.short} took the hard questions before the match.`);
  const reaction=st.type==='ambush'?(st.flags.fought?'It turned into a fight. The hall saw the end of it on the screen.':st.flags.vis===3?'The hall saw it live and went up in arms.':'Word of the attack is all over the building.'):
   st.type==='vignette'?(q>=65?'The video played to applause.':q>=50?'The video did its job.':'The video came and went.'):
   q>=68?'The room bought every word.':q>=52?'It did its job.':st.flags.walked?'An awkward end to the interview.':'It fell a bit flat.';
  return {v:3,live:true,format:st.type,speaker:st.w.short,opponent:st.f.short,styleName:E.name,...(style?{style}:{}),quality:q,crowdShift,heatDelta,moraleDelta:st.morale,trustDelta:st.trust,repDelta:0,
   ...(st.type==='ambush'&&st.hurt>0?{opponentHurt:clamp(st.hurt,0,24)}:{}),...(st.flags.fought?{brawl:true}:{}),
   hook,promise:st.promise?{...st.promise}:null,tactic:null,claim:null,
   ...(st.dialogue?{dialogueIds:st.dialogue.used.slice()}:{}),path:st.picks.map(id=>({id})),speech:st.log.filter(e=>e.side==='w').map(e=>e.text),reply:st.log.filter(e=>e.side==='f').map(e=>e.text).at(-1)||'',reaction,
   dialogue:st.log.map(e=>({speaker:e.who||'Stage',line:e.text,kind:e.kind,...(e.authoredId?{authoredId:e.authoredId}:{})})),angle:E.name+': '+st.picks.join(', ')+'.'};
 }
 function view(st){
  const R=rounds(st)[Math.min(st.round,rounds(st).length-1)];
  return {type:st.type,name:ENGINES[st.type].name,stage:st.stage,round:st.round,total:rounds(st).length,
   heading:st.stage==='done'?'It is done':R.name,help:fill(st.stage==='done'?'':R.help,st),options:options(st),log:st.log.slice(),
   meter:st.type==='ambush'?{label:'Damage',value:st.hurt,word:st.hurt>=14?'Heavy':st.hurt>=8?'Real':st.hurt>0?'Some':'None'}:
    st.type==='vignette'?{label:'Production',value:st.quality,word:st.p.tv?'Television crew':'House crew'}:
    {label:'Room',value:st.room,word:st.room>=8?'With them':st.room>=3?'Warming':st.room>-3?'Listening':st.room>-8?'Cooling':'Against them'},
   result:result(st)};
 }
 root.OfficeSegments={TYPES,ENGINES,BANKED,menu,advice,begin,options,choose,view,result,grillQuestions};
})(typeof window!=='undefined'?window:globalThis);
