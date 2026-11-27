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
 const roll=(st,key,bonus=0)=>hash(st.cid+'|'+st.type+'|'+key)<chance(st,bonus);

 /* ---------- the menu ---------- */
 const TYPES={
  duel:{name:'Face to face',hint:'The usual segment: {W} and {F} trade words with the microphone. Both wrestlers’ mic skills count.',tags:['Two voices','Mic ▲▲']},
  solo:{name:'Solo promo',hint:'{W} alone in the ring with the microphone. Nobody answers back and nobody to hide behind.',tags:['Mic ▲▲','Crowd ▲']},
  vignette:{name:'Pre-taped vignette',hint:'Recorded earlier and shown on the screen. It cannot go wrong live, but it rarely brings the house down.',tags:['No live risk','Lower ceiling']},
  ambush:{name:'Backstage ambush',hint:'No talking. {W} jumps {F} before the match. {F} starts the match hurt; the promoter may not like it.',tags:['Feud heat ▲▲','Opponent hurt','Trust risk']},
  grilling:{name:'Interview grilling',hint:'The interviewer asks the hard questions and {F} is not there. {W} handles it alone, or walks out.',tags:['Mic ▲','Can walk out']}
 };
 // Freshness: the crowd tires of the same trick. Of the wrestler's last few segments, how many were this kind?
 // Read from match history (no new save data). Each repeat costs quality, crowd and feud heat in the result.
 const FRESH_WINDOW=3;
 function staleness(type,w){
  const name=ENGINES[type]?.name;if(!name||!w)return 0;
  return (G?.S?.history||[]).filter(x=>x.wid===w.id&&x.promo).slice(0,FRESH_WINDOW).filter(x=>x.promo.style===name).length;
 }
 const staleTag=n=>n>=2?'Seen it lately ▼▼':n===1?'Seen it lately ▼':null;
 function menu(c,w,f,p){
  const st={w,f,p:{voice:p?.voice||'The promoter',venue:p?.venue||'the hall'}};
  return Object.entries(TYPES).map(([id,t])=>{
   const stale=staleness(id,w),tags=id==='vignette'?[...t.tags,p?.tv?'TV production':'House production',...((w?.mic||50)<50?['Hides a weak mic ▲']:[])]:t.tags.slice();
   if(staleTag(stale))tags.push(staleTag(stale));
   const hint=fill(t.hint,st)+(stale?` The crowd has seen ${w.short} do this ${stale===1?'once':stale+' times'} in their last ${FRESH_WINDOW} segments, so it will land softer.`:'');
   return {id,label:t.name,hint,tags};
  });
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

 /* ---------- what an option does ----------
    Every live option works out its effect for this fixture first (fxOf): the wrestler, the opponent, the
    rivalry's heat, the booked finish and the promoter. The step applies exactly those numbers and the
    option's tags are built from them, so a tag never promises more than the choice delivers. Gambles are
    still rolled (hashed from the contract id, never the match RNG); their tag names the real odds. */
 const chance=(st,bonus=0)=>Math.max(.15,Math.min(.92,(st.w.mic-25)/60+bonus));
 const ODDS=p=>p>=.65?'likely':p>=.4?'even chance':'long shot';
 const FX_KEYS=['quality','room','heat','trust','morale','hurt','back'];
 function gamble(st,e,key,bonus,win,lose){e.gamble={key,bonus,p:chance(st,bonus),win,lose};}
 function fxOf(st,o){
  const e={quality:0,room:0,heat:0,trust:0,morale:0,hurt:0,back:0,...(o.base||{}),why:[],tags:[],gamble:null};
  if(o.vis){e.heat+=o.vis;e.quality+=Math.min(6,o.vis*3);}
  o.fx?.(st,e);
  const g=e.gamble,avg=k=>(e[k]||0)+(g?((g.win[k]||0)*g.p+(g.lose[k]||0)*(1-g.p)):0);
  e.score=Math.round(avg('quality')+(e.hideRoom?0:avg('room'))+avg('heat')+avg('trust')*2+avg('morale')+avg('hurt')*.5);
  return e;
 }
 function applyFx(st,e){for(const k of FX_KEYS)if(e[k])st[k]+=e[k];}
 // Apply an option's effect; returns the gamble's outcome (true/false), or null when there was none.
 function resolveFx(st,o){
  const e=fxOf(st,o);applyFx(st,e);
  if(!e.gamble)return null;
  const ok=roll(st,e.gamble.key,e.gamble.bonus);applyFx(st,ok?e.gamble.win:e.gamble.lose);return ok;
 }
 const FX_LABEL={quality:['Promo',3,7],room:['Crowd',3,7],heat:['Feud heat',2,4],trust:['Promoter',1,2],morale:['Morale',1,2]};
 const lvl=(n,a,b)=>n>=b?'▲▲':n>0?'▲':n<=-b?'▼▼':n<0?'▼':'';
 function fxTags(e){
  const t=[],g=e.gamble;
  if(g)t.push('Gamble: '+ODDS(g.p));
  for(const [k,[name,a,b]] of Object.entries(FX_LABEL)){
   if(k==='room'&&e.hideRoom)continue;
   const base=e[k]||0,win=base+(g?.win[k]||0),lose=base+(g?.lose[k]||0);
   if(g&&win!==lose){const parts=[win,lose].filter(Boolean).map(n=>lvl(n,a,b));if(parts.length)t.push(name+' '+parts.join(' or '));continue;}
   if(k==='quality'&&base>0&&base<a)continue;
   if(base)t.push(name+' '+lvl(base,a,b));
  }
  if(e.hurt>0)t.push('Opponent hurt '+(e.hurt>=12?'▲▲▲':e.hurt>=8?'▲▲':'▲'));
  t.push(...e.tags);
  return t.length?t:['Safe'];
 }
 function fxOption(st,o,cats){
  const e=fxOf(st,o),cat=o.cat&&cats?.[o.cat];
  return {id:o.id,label:fill(o.label,st),hint:fill([o.hint,...e.why].join(' '),st),tags:[...(cat?[cat]:[]),...fxTags(e)].map(t=>fill(t,st)),
   ...(cat?{category:o.cat,categoryName:cat}:{}),score:e.score};
 }
 // A promise is judged after the match against what happened; the booked finish is the best guide.
 function promiseFx(st,type,e){
  if(st.promise){e.tags.push('Already promised');return;}
  e.tags.push('Public promise');
  if(!st.finish)return;
  const kept=type==='win'?/^win/.test(st.finish):['win_clean','lose_clean'].includes(st.finish);
  e.tags.push(kept?'Booked finish keeps it':'Risk: booked finish breaks it');
  e.why.push(kept?'The booked finish keeps this promise, if the match goes to plan.':'The booked finish would break this promise, and the crowd will remember it.');
 }
 const ambitionTrust=p=>likesTrouble(p)?1:p?.personality==='traditional'?-1:0;
 const trustFor=(st,e,good,bad,likeWhy,dislikeWhy)=>{const t=good.includes(st.p.personality)?1:bad.includes(st.p.personality)?-1:0;if(t){e.trust+=t;e.why.push(t>0?likeWhy:dislikeWhy);}};

 /* ---------- solo promo ---------- */
 const SOLO_CATS={crowd:'Crowd',rivalry:'Rivalry',ego:'Ego',story:'Story'};
 const SOLO=[
  {id:'aim',name:'Who is it for?',help:'{W} has the ring to themselves. No opponent, no interviewer: just the microphone and the room.',options:[
   {id:'crowd',label:'Talk to the crowd',hint:'Make them part of it.',base:{room:4,quality:3},fx:(st,e)=>{if(st.w.heat>=50){e.room+=3;e.why.push('The crowd already likes {W}.');}}},
   {id:'rival',label:'Talk to {F}',hint:'{F} is not here to answer. It will be on tape by tomorrow.',base:{heat:3,quality:3,room:1},
    fx:(st,e)=>{if(st.heat0>=40){e.heat+=1;e.why.push('It is already personal, so every word lands.');}else if(st.heat0<20){e.room-=2;e.why.push('Few people know why {W} is angry with {F} yet.');}}},
   {id:'self',label:'Talk about themselves',hint:'Pure swagger.',
    fx:(st,e)=>{gamble(st,e,'self',st.w.ego>=70?.15:-.05,{room:6,quality:7},{room:-5,quality:-3});e.why.push(st.w.ego>=70?'{W} has the ego to carry it.':'Without a big ego, it can grate.');}},
   {id:'top',label:'Talk past tonight',hint:'Name the title picture. {F} hears disrespect.',base:{heat:2,quality:4},
    fx:(st,e)=>{const t=ambitionTrust(st.p);if(t){e.trust+=t;e.why.push(t>0?'{P} likes ambition.':'{P} thinks {W} should wait their turn.');}}},
   {id:'thank',label:'Thank {P}',hint:'Name the promoter and thank them for the spot.',base:{quality:2,trust:1,room:-1},
    fx:(st,e)=>{if(st.p.personality==='traditional'){e.trust+=1;e.why.push('{P} likes being thanked in public.');}if(st.w.heat>=60){e.room-=2;e.why.push('The crowd does not want their favourite sucking up.');}}},
   {id:'mentor',label:'Honour who trained them',hint:'The coach who took them on when nobody else would.',base:{quality:3,room:2,morale:1},
    fx:(st,e)=>{const s=wStyle(st);if(['Story','Technical'].includes(s)){e.quality+=3;e.why.push('It suits a '+STYLE_WORD[s]+' wrestler.');}if(pLikes(st)==='story'){e.trust+=1;e.why.push('{P} wants a story, and this is one.');}}},
   {id:'locker',label:'Call out the locker room',hint:'Every name in the back, one at a time.',base:{heat:1,quality:3},
    fx:(st,e)=>{if(st.w.ego>=70){e.room+=3;e.why.push('With {W}’s ego, people believe it.');}else{e.room-=2;e.why.push('Without the ego to back it up, it sounds hollow.');}
     trustFor(st,e,['aggressive','showman'],['traditional','cold'],'{P} likes the nerve of it.','{P} does not want the locker room upset.');}}]},
  {id:'hook',name:'The hook',help:'They have the room’s attention. What is the line people take home?',options:[
   {id:'catch',cat:'crowd',label:'Build to a catchphrase',hint:'If the crowd knows it, they shout it back.',
    fx:(st,e)=>{gamble(st,e,'catch',st.room>=5?.1:0,{room:8,quality:9},{room:-4,quality:-4});if(st.room>=5)e.why.push('The room is already warm.');}},
   {id:'chant',cat:'crowd',label:'Start a chant',hint:'Get the hall chanting {W}’s name.',
    fx:(st,e)=>{const b=st.w.heat>=60?.2:st.w.heat<40?-.15:0;gamble(st,e,'chant',b,{room:7,quality:5},{room:-5,quality:-3});if(b)e.why.push(b>0?'Plenty of people here know {W}’s name.':'Not many people here know {W}’s name yet.');}},
   {id:'cause',cat:'crowd',label:'Back a local cause',hint:'The boxing club down the road is closing. Ask the hall to help.',base:{room:3,quality:3},
    fx:(st,e)=>{if(st.p.personality==='traditional'){e.trust+=1;e.why.push('{P} likes the community touch.');}}},
   {id:'story',cat:'story',label:'Tell a true story',hint:'Something real from before wrestling. Hard to get wrong.',base:{room:3,quality:5},
    fx:(st,e)=>{if(wStyle(st)==='Story'){e.quality+=2;e.why.push('Storytellers tell it best.');}}},
   {id:'stats',cat:'story',label:'Quote the numbers',hint:'Matches, wins, and how often {F} has lost.',base:{quality:3},
    fx:(st,e)=>{if(wStyle(st)==='Technical'){e.quality+=4;e.why.push('Numbers sound right from a technical wrestler.');}else{e.room-=1;e.why.push('The crowd drifts during the numbers.');}
     if(pLikes(st)==='technical'){e.trust+=1;e.why.push('{P} likes serious wrestling talk.');}}},
   {id:'threat',cat:'rivalry',label:'Make a threat',hint:'Spell out what happens to {F} tonight.',base:{heat:4,quality:3,room:1},
    fx:(st,e)=>{if(st.heat0>=40){e.heat+=1;e.why.push('It is already personal.');}}},
   {id:'history',cat:'rivalry',label:'Bring up their last meeting',hint:'Blow by blow, the last time {W} and {F} crossed paths.',
    fx:(st,e)=>{if(st.heat0>=30){e.heat+=4;e.room+=2;e.quality+=3;e.why.push('There is history here to call back to.');}
     else{e.quality-=2;e.room-=1;e.tags.push('Risk: not much history yet');e.why.push('There is not much history to call back to yet.');}}},
   {id:'town',cat:'ego',label:'Insult the town',hint:'Cheap heat. The room turns on {W}, and they will pay to watch them lose.',base:{room:-12,heat:4,quality:3},
    fx:(st,e)=>{e.hideRoom=true;e.tags.push('Crowd turns, hall heats up');trustFor(st,e,['aggressive','showman'],['traditional','cold'],'{P} loves cheap heat.','{P} thinks it is beneath the show.');}},
   {id:'belt',cat:'ego',label:'Point at the title picture',hint:'Claim a place in the title picture, live.',base:{heat:1,quality:3},
    fx:(st,e)=>{if(st.w.heat>=65){e.room+=2;e.why.push('The crowd can see {W} as a contender.');}else{e.room-=2;e.why.push('From {W}, it sounds premature.');}
     trustFor(st,e,['aggressive','showman'],['traditional'],'{P} likes ambition.','{P} thinks {W} should wait their turn.');}}]},
  {id:'close',name:'The closer',help:'Time to get out. How does {W} leave the ring?',options:[
   {id:'vow',label:'Promise a win',hint:'Say it out loud: {W} wins tonight. The crowd will hold them to it.',base:{heat:2,quality:3},fx:(st,e)=>promiseFx(st,'win',e)},
   {id:'clean',label:'Promise a clean finish',hint:'No shortcuts, a clean fall in the middle. Win or lose, people will check.',base:{quality:3,room:1},fx:(st,e)=>promiseFx(st,'clean',e)},
   {id:'drop',label:'Drop the microphone',hint:'Perfect if the room is with them. Embarrassing if it is not.',
    fx:(st,e)=>{if(st.room>=6){e.quality+=6;e.why.push('The room is with {W}.');}else if(st.flags.cheap)gamble(st,e,'drop',0,{quality:6},{quality:-4});else{e.quality-=4;e.why.push('The room is not with {W}.');}}},
   {id:'walk',label:'Done talking',hint:'Said what they came to say. Nothing more to add.',base:{quality:1}},
   {id:'more',label:'Keep talking',hint:'One more minute. Great talkers find a second gear; everyone else loses the room.',
    fx:(st,e)=>gamble(st,e,'more',-.05,{quality:9,room:st.room>=0?5:-5},{quality:-7,room:-4})}]}
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
 const SOLO_NEW={
  thank:'{W} thanks {P} by name for the chance, and looks as if they mean it.',
  mentor:'{W} talks about the trainer who took them on when nobody else would. The hall goes quiet to listen.',
  locker:'{W} points at the curtain and calls out every name in the back, one at a time.',
  chant_ok:'{W} starts the chant. By the third time round, the whole hall has it.',
  chant_no:'{W} starts a chant. A few people join in, then think better of it.',
  cause:'{W} talks about the boxing club down the road that is about to close, and asks the hall to help. They cheer.',
  stats:'{W} reels off the numbers: matches, wins, and how many times {F} has lost on their back.',
  history_ok:'{W} goes through the last time they met {F}, blow by blow. The hall remembers every one.',
  history_no:'{W} brings up a match with {F} that hardly anybody here saw.',
  belt:'{W} points at the title picture on the big screen and holds the pose until the boos or cheers come.'
 };
 function solo(st,R,o){
  const vw=voice(st.w);
  if(R.id==='aim')line(st,'stage','{W} walks to the centre of the ring and waits for the noise to drop.');
  const roomBefore=st.room,ok=resolveFx(st,o);
  if(o.id==='crowd')speak(st,bankLine(st,'aim',[['open','people','p_short'],['open','people','p_working']],noYou),SOLO_SAY.crowd[vw]);
  else if(o.id==='rival'){line(st,'stage','{W} looks into the hard camera and talks to {F}.');speak(st,bankLine(st,'aim',CHALLENGES),SOLO_SAY.rival[vw]);}
  else if(o.id==='self'){const pick=bankLine(st,'aim',[['open','swagger','sw_main'],['open','swagger','sw_pose']],noYou);if(pick?.variant==='sw_pose')line(st,'stage','{W} strikes a pose and holds it.');speak(st,pick,SOLO_SAY.self[vw]);
   line(st,'crowd',ok?'They eat it up. Somebody at the back starts a chant.':'It goes down badly. A couple of people laugh in the wrong places.');}
  else if(o.id==='top'){line(st,'w',SOLO_SAY.top[vw]);st.flags.ambition='applied';}
  else if(o.id==='locker'){line(st,'stage',SOLO_NEW.locker);line(st,'crowd',st.w.ego>=70?'The hall loves the nerve of it.':'A few people look at each other. Who does {W} think they are?');}
  else if(SOLO_NEW[o.id])line(st,'stage',SOLO_NEW[o.id]);
  else if(o.id==='catch')line(st,'stage',SOLO_SAY[ok?'catch_ok':'catch_no']);
  else if(o.id==='chant')line(st,'stage',SOLO_NEW[ok?'chant_ok':'chant_no']);
  else if(o.id==='history')line(st,'stage',SOLO_NEW[st.heat0>=30?'history_ok':'history_no']);
  else if(o.id==='story')line(st,'w',SOLO_SAY.story[vw]);
  else if(o.id==='threat')line(st,'w',SOLO_SAY.threat[vw]);
  else if(o.id==='town'){line(st,'w',SOLO_SAY.town[vw]);line(st,'crowd','The whole room boos. It is the loudest they have been all night.');st.flags.cheap=true;}
  else if(o.id==='vow'){speak(st,bankLine(st,'vow',[['close','vow','vo_plain'],['close','vow','vo_hard']],'commit'),SOLO_SAY.vow[vw]);st.promise={type:'win',claim:'vow',checked:false};line(st,'crowd',st.room>=0?'The crowd roars. They will remember that.':'The boos get louder. They want to see that promise broken.');}
  else if(o.id==='clean'){speak(st,bankLine(st,'clean',[['close','clean','cl_middle']],'commit'),SOLO_SAY.clean[vw]);st.promise={type:'clean',claim:'clean',checked:false};}
  else if(o.id==='drop')line(st,'stage',(ok??roomBefore>=6)?'{W} drops the microphone. The thud gets a bigger cheer than most finishes.':'{W} drops the microphone. It bounces, feeds back, and somebody has to go and fetch it.');
  else if(o.id==='walk'){speak(st,bankLine(st,'done',[['close','uncertainty','un_done']],noYou),SOLO_SAY.done[vw]);line(st,'stage','{W} hands the microphone to the timekeeper and walks up the ramp without looking back.');}
  else line(st,'stage',SOLO_SAY[ok?'more_ok':'more_no']);
 }

 /* ---------- pre-taped vignette ----------
    The setting is a real decision. Each one belongs to a category (the tone it is built for) and is
    weighed against this fixture: the wrestler's style and voice, how well the crowd knows them, the
    rivalry's heat, and the promoter's taste. What it does is computed once (settingEffect) and the
    same numbers are both applied and shown as the option's tags, so a tag never promises more than
    the setting delivers. Effects stay inside the segment economy: production quality and the room
    reach the match through crowdShift, feud heat through heatDelta, trust and morale are applied
    once when the scene ends, and the setting's angle colours the commentary through the result style.
    Taped, so the wrestler's microphone skill is never rolled. */
 const VIG_CATS={intense:'Intense',heartfelt:'Heartfelt',comedy:'Comedy',menace:'Menace',mystery:'Mystery',flexible:'Flexible'};
 const TONE_WORD={intense:'intense',heartfelt:'heartfelt',comedy:'funny',menace:'menacing'};
 const STYLE_WORD={Brawl:'brawling',Technical:'technical',Story:'storytelling',Spectacle:'high-flying'};
 const LIKES_WORD={brawl:'a fight',spots:'a spectacle',story:'a story',technical:'serious wrestling'};
 // q: production; room: the crowd; heat: feud heat; morale: the wrestler's; styles/voices: who it suits (+4/+3
 // production); likes: promoter taste (+1 trust); persona: promoter personality (± trust); hot: feud heat if the
 // rivalry is already personal (40+), a backfire if not; known: crowd change when the wrestler is well known
 // (heat 60+); unknown: crowd change when they are not (heat under 50); mystery: pays off a cliffhanger edit;
 // style: how the commentary remembers it in the match.
 const SETTINGS=[
  {id:'gym',cat:'intense',label:'A gym before dawn',hint:'Sweat, breath and a single bulb.',fits:['intense','heartfelt'],styles:['Technical','Brawl'],likes:['technical'],q:2,style:'respect',
   shot:'The screen fades up on {W} in an empty gym before sunrise, wrapping their wrists under a single bulb.'},
  {id:'tape',cat:'intense',label:'Watching tape of {F}',hint:'A dark room, a remote, and {F}’s last six matches on rewind.',fits:['intense','menace'],styles:['Technical','Story'],likes:['technical','story'],hot:2,q:2,style:'challenge',
   shot:'The screen fades up on a television in a dark room. {F} is on it, and {W} is pressing rewind.'},
  {id:'boxing',cat:'intense',label:'Sparring at a boxing club',hint:'Pads, headguards and a coach who never stops shouting.',fits:['intense','menace'],styles:['Brawl'],likes:['brawl'],persona:{aggressive:1},q:2,room:1,style:'challenge',
   shot:'The screen fades up on a boxing club above a garage. {W} is taking shots on the pads and giving them back harder.'},
  {id:'home',cat:'heartfelt',label:'Where they grew up',hint:'The street, the school gates, the old ring.',fits:['heartfelt','comedy'],voices:['earnest','eager','gruff'],known:3,morale:2,q:2,style:'rally',
   shot:'The screen fades up on a terraced street. {W} walks past the house where they grew up.'},
  {id:'school',cat:'heartfelt',label:'The school that trained them',hint:'The draughty hall where they took their first bump.',fits:['heartfelt','intense'],styles:['Story','Technical'],likes:['story'],persona:{traditional:1},morale:1,q:2,style:'respect',
   shot:'The screen fades up on a church hall with a ring in it. {W} runs a hand along the bottom rope.'},
  {id:'family',cat:'heartfelt',label:'At the kitchen table',hint:'Tea, biscuits and a parent who has seen every match.',fits:['heartfelt','comedy'],voices:['earnest','eager','stoic'],persona:{cold:-1},morale:2,room:2,q:1,style:'rally',
   shot:'The screen fades up on a kitchen table. A parent pours the tea and tells {W} to sit up straight.'},
  {id:'shop',cat:'comedy',label:'Doing the weekly shop',hint:'A trolley, a list, and selfies in the cereal aisle.',fits:['comedy','heartfelt'],voices:['grand','slippery','eager'],styles:['Spectacle'],persona:{showman:1,traditional:-1},room:2,q:1,style:'rally',
   shot:'The screen fades up on a supermarket aisle. {W} is pushing a trolley with one wonky wheel.'},
  {id:'karaoke',cat:'comedy',label:'Karaoke at the local',hint:'One song, a sticky microphone and a pub that knows them.',fits:['comedy'],voices:['grand','slippery','eager','sermon'],styles:['Spectacle'],persona:{showman:1,cold:-1},known:2,room:2,q:0,
   shot:'The screen fades up on a pub on karaoke night. {W} is next on the list.'},
  {id:'kids',cat:'comedy',label:'Coaching at a kids’ open day',hint:'Twenty children, crash mats and no plan at all.',fits:['comedy','heartfelt'],voices:['earnest','eager','gruff'],persona:{traditional:1},morale:1,room:2,q:1,style:'rally',
   shot:'The screen fades up on a sports hall full of children. {W} is outnumbered.'},
  {id:'dark',cat:'menace',label:'An empty, dark building',hint:'Shadows and a flickering light.',fits:['menace','intense'],voices:['sermon','stoic','precise'],heat:1,q:2,style:'mindgames',
   shot:'The screen fades up on darkness. A light flickers on, and {W} is already sitting in the middle of the room.'},
  {id:'outside',cat:'menace',label:'Parked outside {F}’s gym',hint:'Engine off, watching the door. Only works if this is already personal.',fits:['menace'],hot:4,persona:{aggressive:1,traditional:-1,cold:-1},q:1,style:'mindgames',
   shot:'The screen fades up on a car with its engine off, across the road from {F}’s gym. {W} is in the driver’s seat, watching the door.'},
  {id:'scrapyard',cat:'menace',label:'A scrapyard at night',hint:'Crushed cars, rain, and a crowbar nobody mentions.',fits:['menace','intense'],styles:['Brawl'],likes:['brawl'],persona:{aggressive:1,traditional:-1},heat:2,q:2,style:'challenge',
   shot:'The screen fades up on a scrapyard in the rain. {W} is sitting on the bonnet of a crushed car.'},
  {id:'chapel',cat:'mystery',label:'An abandoned chapel',hint:'Candles, dust and a sermon to nobody.',fits:['menace','intense'],voices:['sermon','stoic','grand'],heat:1,q:2,mystery:true,style:'mindgames',
   shot:'The screen fades up on a ruined chapel lit by candles. {W} stands where the altar used to be.'},
  {id:'static',cat:'mystery',label:'Static and a voice',hint:'No face, no name: a distorted voice and a date. Best for someone the crowd does not know yet.',fits:['menace','intense','heartfelt'],unknown:4,known:-2,persona:{showman:1},q:0,mystery:true,
   shot:'The screen fills with static. A distorted voice speaks over it, and for a moment a figure that might be {W} appears.'},
  {id:'symbols',cat:'mystery',label:'A wall of strange symbols',hint:'Chalk markings across a cellar wall, and {W} adding one more.',fits:['menace','comedy'],styles:['Spectacle'],likes:['spots'],persona:{showman:1,cold:-1},q:1,mystery:true,style:'mindgames',
   shot:'The screen fades up on a cellar wall covered in chalk symbols. {W} is drawing another one.'},
  {id:'road',cat:'flexible',label:'On the road between shows',hint:'Motorway services at two in the morning.',fits:['intense','heartfelt','comedy','menace'],q:1,
   shot:'The screen fades up on motorway services at two in the morning. {W} is eating chips out of the paper.'},
  {id:'arena',cat:'flexible',label:'The empty hall the morning after',hint:'{V} with the chairs stacked and a cleaner with a mop.',fits:['intense','heartfelt','menace'],likes:['story'],q:2,
   shot:'The screen fades up on {V} the morning after a show. The chairs are stacked, and {W} sits alone on the apron.'}
 ];
 const SETTING=Object.fromEntries(SETTINGS.map(s=>[s.id,s]));
 const wStyle=st=>st.w.style??G?.W?.(st.w.id)?.style??null;
 const pLikes=st=>st.p.likes??G?.P?.(st.p.id)?.likes??null;
 // What a setting does for this fixture. Pure: read by the tags and by the step that applies it.
 function settingEffect(st,s){
  const vw=voice(st.w),style=wStyle(st),likes=pLikes(st),pers=st.p.personality;
  const e={quality:s.q||0,room:s.room||0,heat:s.heat||0,trust:0,morale:s.morale||0,why:[],cold:false};
  if(s.styles?.includes(style)){e.quality+=4;e.why.push('It suits {W}’s '+(STYLE_WORD[style]||'own')+' style.');}
  if(s.voices?.includes(vw)){e.quality+=3;e.why.push('{W} comes across well on this kind of tape.');}
  if(likes&&s.likes?.includes(likes)){e.trust+=1;e.why.push('{P} wants '+LIKES_WORD[likes]+', and this is one.');}
  const pt=s.persona?.[pers]||0;
  if(pt){e.trust+=pt;e.why.push(pt>0?'{P} will like the nerve of it.':'{P} will not like it.');}
  if(s.hot){
   if(st.heat0>=40){e.heat+=s.hot;e.room+=1;e.why.push('The rivalry is hot enough to carry it.');}
   else{e.room-=3;e.quality-=3;e.cold=true;e.why.push('The rivalry is not personal yet, so it will look strange.');}
  }
  if(s.known&&st.w.heat>=60){e.room+=s.known;e.why.push(s.known>0?'The crowd already knows {W}, and this plays to it.':'Everyone will recognise {W}, which spoils the mystery.');}
  if(s.unknown&&st.w.heat<50){e.room+=s.unknown;e.why.push('Nobody knows much about {W} yet, which helps.');}
  e.trust=Math.max(-2,Math.min(2,e.trust));
  e.score=e.quality+e.room+e.heat+e.trust*2+e.morale;
  return e;
 }
 const arrows=(n,a,b)=>n>=b?' ▲▲':n>=a?' ▲':n<0?' ▼':'';
 function settingTags(s,e){
  const t=[VIG_CATS[s.cat]];
  const q=arrows(e.quality,3,6);if(q)t.push('Production'+q);
  if(e.room)t.push('Crowd'+arrows(e.room,1,4));
  if(e.heat)t.push('Feud heat'+arrows(e.heat,1,3));
  if(e.trust)t.push('Promoter'+arrows(e.trust,1,2));
  if(e.morale)t.push('Morale'+arrows(e.morale,1,2));
  if(e.cold)t.push('Risk: feud too cold');
  if(s.mystery)t.push('Pays off a cliffhanger');
  if(t.length===1)t.push('Safe');
  return t;
 }
 const fitsWord=s=>s.fits.length>=4?'Works with any tone.':'Works with '+(/^[aeiou]/.test(TONE_WORD[s.fits[0]])?'an ':'a ')+s.fits.map(x=>TONE_WORD[x]).join(' or ')+' tone.';
 function settingOption(st,s){
  const e=settingEffect(st,s);
  return {id:s.id,label:fill(s.label,st),hint:fill([s.hint,fitsWord(s),...e.why].join(' '),st),tags:settingTags(s,e).map(t=>fill(t,st)),category:s.cat,categoryName:VIG_CATS[s.cat],score:e.score};
 }
 const VIGNETTE=[
  {id:'setting',name:'The setting',help:'The crew has a day with {W}. Where do they shoot it?',options:SETTINGS.map(s=>({id:s.id,label:s.label,hint:s.hint,tags:[VIG_CATS[s.cat]]}))},
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
 const TONE_VOICE={intense:['gruff','precise','stoic'],heartfelt:['earnest','eager','gruff'],comedy:['grand','slippery','eager'],menace:['sermon','stoic','gruff','precise']};
 // The tone and edit tags say what they will do with the setting already chosen.
 function vignetteTags(st,R,o){
  const s=SETTING[st.flags.setting];
  if(R.id==='tone'){
   const fit=!!s?.fits.includes(o.id),suits=TONE_VOICE[o.id].includes(voice(st.w));
   return [fit?'Fits the setting ▲':'Clashes with the setting ▼',suits?'Suits {W} ▲':o.id==='comedy'?'Gamble: not a natural clown ▼':'Not {W}’s voice ▼',...(o.id==='menace'?['Feud heat ▲']:[])];
  }
  if(R.id==='edit'){
   if(o.id==='long')return [st.flags.good?'Strong footage ▲▲':'Weak footage ▼','Gamble'];
   if(o.id==='tease'&&s?.mystery)return ['Crowd ▲▲','Pays off the mystery'];
   if(o.id==='message'&&s?.cat==='menace')return ['Feud heat ▲▲'];
  }
  return o.tags;
 }
 const VIG_SAY={
  intense:{grand:'“Every morning, while the world sleeps, I am becoming a legend.”',gruff:'“Nobody sees this bit. This is the only bit that counts.”',eager:'“Five more. Five more. Five more. I always say five more.”',stoic:'{W} says nothing for the whole minute. The skipping rope does the talking.',precise:'“Six-forty a.m. Set seven of nine. On schedule.”',earnest:'“I’m tired. I’m always tired. I’m still here.”',sermon:'“The body is a temple. I am rebuilding mine for war.”',slippery:'“Honestly, I hate the gym. But it’s where they keep the free towels.”'},
  heartfelt:{grand:'“They said a kid from here would never be a star. Look at me now, street.”',gruff:'“Didn’t have much growing up. Still don’t. Got this, though.”',eager:'“I used to practise my entrance in that garden! The neighbours HATED it!”',stoic:'“My grandfather wrestled. I never saw it. I carry it anyway.”',precise:'“I can tell you the exact day I decided to do this. It was a Tuesday.”',earnest:'“I just want to make the people here proud. That’s all it’s ever been.”',sermon:'“This is where I was born, and this is where I was born again.”',slippery:'“Lovely little house. I’d show you inside, but there’s a court order.”'},
  comedy:{grand:'“A champion must eat like a champion.” {W} drops a chip, and stares at it for a long time.',gruff:'{W} tries to explain the plan for the match using salt and pepper pots, and loses the pepper.',eager:'{W} tries to do a dramatic slow-motion run down the street and trips over a bin.',stoic:'{W} watches a pigeon for forty seconds. Neither of them blinks.',precise:'{W} times how long the microwave takes. “Wrong,” they say, and write it down.',earnest:'{W} keeps apologising to the camera crew for being boring. They are not boring.',sermon:'{W} blesses a vending machine. It gives them two bags of crisps.',slippery:'{W} pretends to be a fan and asks other people at the services for their own autograph.'},
  menace:{grand:'“{F}. Enjoy your applause while it lasts. Curtains always fall.”',gruff:'“{F}. Tonight.” The light goes out.',eager:'{W} just smiles at the camera, and keeps smiling far too long.',stoic:'{W} says nothing. They slowly turn a photograph of {F} face down.',precise:'“I know exactly where you will be at nine-fifteen tonight, {F}. I will be there too.”',earnest:'“I didn’t want it to come to this, {F}. You made it this way.”',sermon:'“Repent, {F}. The hour is nearly here.”',slippery:'“Hello, {F}. Look under your bed tonight. Or don’t. Your choice.”'}
 };
 function vignette(st,R,o){
  const vw=voice(st.w);
  if(R.id==='setting'){
   const s=SETTING[o.id],e=settingEffect(st,s);
   st.flags.setting=o.id;line(st,'stage',s.shot);
   if(e.cold)line(st,'crowd','People in the hall look at each other. What has {F} done to deserve this?');
   st.quality+=e.quality;st.room+=e.room;st.heat+=e.heat;st.trust+=e.trust;st.morale+=e.morale;
   if(s.style)st.flags.style=s.style;
  }
  else if(R.id==='tone'){
   st.flags.tone=o.id;const fit=!!SETTING[st.flags.setting]?.fits.includes(o.id),suits=TONE_VOICE[o.id].includes(vw);
   line(st,o.id==='comedy'||/^\{W\} /.test(VIG_SAY[o.id][vw])?'stage':'w',VIG_SAY[o.id][vw]);
   st.quality+=(fit?5:-3)+(suits?6:o.id==='comedy'?-6:-2);st.flags.good=fit&&suits;
   if(o.id==='menace')st.heat+=2;
  }else{
   if(o.id==='tight'){line(st,'stage','Sixty seconds, sharp cuts, out on {W}’s name. The hall applauds the screen.');st.quality+=3;}
   else if(o.id==='long'){line(st,'stage',st.flags.good?'The package plays for three minutes, and the hall watches every second in silence.':'Three minutes is a long time. By the end, people are looking at their phones.');st.quality+=st.flags.good?7:-5;}
   else if(o.id==='message'){line(st,'w','“{F}. You have seen what I do to get ready. Now come and see the rest.”');st.heat+=SETTING[st.flags.setting]?.cat==='menace'?4:3;st.quality+=2;}
   else{
    const mystery=!!SETTING[st.flags.setting]?.mystery;
    line(st,'stage','In the final frame, something is written on the wall behind {W}. The screen cuts out before anyone can read it.');
    if(mystery)line(st,'crowd','The hall has been waiting for this all package. People are already arguing about what it said.');
    st.quality+=mystery?4:2;st.room+=mystery?3:0;st.heat+=1;st.flags.tease=true;
   }
  }
 }

 /* ---------- backstage ambush ---------- */
 // How much the hall sees of it: the live screen is worth more than tape, but not three times more.
 const visCrowd=v=>v>=3?2:v>=1?1:0;
 const visTag=v=>'Crowd '+'▲'.repeat(visCrowd(v));
 const brawler=(st,e)=>{if(wStyle(st)==='Brawl'){e.hurt+=2;e.why.push('{W} is a brawler and hits harder.');}};
 const egoBack=(st,e)=>{if(st.f.ego>=75&&e.back>0)e.why.push('{F} has the ego to hit back.');};
 // The chance that the opponent hits back, given everything chosen so far plus this option.
 const backChance=(st,extra=0)=>st.flags.how==='stare'?0:st.back+extra+(st.f.ego>=75?.1:0)+(st.flags.vis>=2?.05:0);
 const AMBUSH=[
  {id:'where',name:'Where?',help:'{F} is somewhere in the building. Where does {W} find them?',options:[
   {id:'car',label:'The car park as {F} arrives',hint:'Nobody sees it live. A camera crew catches the end of it for the screen.',vis:1,
    fx:(st,e)=>{e.tags.push(visTag(1),'Seen on tape');}},
   {id:'catering',label:'Catering, in front of everyone',hint:'The whole locker room sees it. Some of them will remember.',vis:2,
    fx:(st,e)=>{e.tags.push(visTag(2));if(!likesTrouble(st.p)){e.trust-=1;e.why.push('The whole locker room saw it, and {P} hears about it.');}}},
   {id:'interview',label:'During {F}’s live interview',hint:'Live on the screen in the hall. The biggest reaction, and the promoter is watching.',vis:3,
    fx:(st,e)=>{e.tags.push(visTag(3));const t=likesTrouble(st.p)?1:-1;e.trust+=t;e.why.push(t>0?'{P} loves it live on the screen.':'{P} does not want this on the screen.');}},
   {id:'locker',label:'{F}’s dressing room, door shut',hint:'No cameras inside and nobody to pull {W} off.',vis:1,base:{hurt:2},
    fx:(st,e)=>{e.tags.push(visTag(1));e.why.push('With the door shut, {F} takes more of it.');trustFor(st,e,[],['traditional','cold'],'','{P} will hear about it, and will not like it.');}}]},
  {id:'how',name:'The attack',help:'{W} has {F} where they want them. How far do they take it?',options:[
   {id:'quick',label:'A few shots, then gone',hint:'In and out before anyone can react.',base:{hurt:6,heat:3,quality:4,back:.12},fx:(st,e)=>{brawler(st,e);egoBack(st,e);}},
   {id:'ground',label:'Take them down and keep them there',hint:'More damage, but it gives {F} time to fight back.',base:{hurt:10,heat:3,quality:4,back:.3},
    fx:(st,e)=>{brawler(st,e);e.tags.push('Risk: gives {F} time to fight back');egoBack(st,e);}},
   {id:'chair',label:'Bring a chair',hint:'The most damage. The promoter will have something to say about it.',base:{hurt:12,heat:4,quality:6,back:.08},selfRisk:.2,
    fx:(st,e)=>{brawler(st,e);egoBack(st,e);selfRisk(st,e,.2);if(!likesTrouble(st.p)){e.trust-=3;e.why.push('{P} does not want chairs used backstage.');}else e.why.push('{P} does not mind a chair.');}},
   {id:'hold',label:'Lock on a hold on the concrete',hint:'Wrench a limb and do not let go until the referees arrive.',base:{hurt:8,heat:3,quality:4,back:.05},
    fx:(st,e)=>{if(wStyle(st)==='Technical'){e.hurt+=3;e.quality+=3;e.why.push('{W} knows exactly where it hurts.');}egoBack(st,e);}},
   {id:'dive',label:'Dive off the equipment cases',hint:'Climb the road cases and come off the top. It costs {W} something too.',base:{hurt:7,heat:3,quality:6,back:.1},
    fx:(st,e)=>{if(wStyle(st)==='Spectacle'){e.quality+=3;e.why.push('Made for a high-flyer.');}e.tags.push('Costs {W} energy ▼');egoBack(st,e);}},
   {id:'stare',label:'No contact. A stare and a warning',hint:'Get in their face and leave them wondering. Mind games, not bruises.',base:{heat:2,quality:2},
    fx:(st,e)=>{e.tags.push('Mind games','No damage');}}]},
  {id:'after',name:'Afterwards',help:'Security is on its way. What does {W} do with the last few seconds?',options:[
   {id:'stand',label:'Stand over them',hint:'Make sure the camera gets the picture.',base:{heat:2,quality:2},fx:(st,e)=>risk(st,e)},
   {id:'line',label:'One line to the camera',hint:'A few words while {F} is still on the floor. Only as good as {W}’s microphone.',
    fx:(st,e)=>{gamble(st,e,'line',0,{quality:5},{quality:-2});risk(st,e);}},
   {id:'leave',label:'Walk off calmly',hint:'As if nothing happened. Colder than any speech.',base:{quality:3},fx:(st,e)=>risk(st,e)},
   {id:'more',label:'Go back for more',hint:'Fight through the security. More damage, more trouble.',base:{heat:2,quality:3,back:.3},selfRisk:.3,
    fx:(st,e)=>{e.hurt+=st.flags.how==='stare'?3:4;selfRisk(st,e,.3);if(!likesTrouble(st.p)){e.trust-=2;e.why.push('{P} will not want security fighting the talent.');}risk(st,e);}}]}
 ];
 // The opponent fighting back is decided by the last step; every option there says how likely it is.
 // Swinging chairs and fighting security can cost your own wrestler: they start the match tired.
 function selfRisk(st,e,p){e.tags.push('Risk: {W} gets hurt ('+(p>=.4?'likely':p>=.2?'possible':'unlikely')+')');e.why.push('{W} could come away hurt and start the match tired.');}
 function risk(st,e){
  const p=backChance(st,e.back);
  if(p>=.15){e.tags.push('Risk: {F} may hit back ('+(p>=.4?'likely':'possible')+')');e.why.push('If {F} hits back, they shake some of it off and {W} starts the match tired.');}
 }
 const AMB_SAY_MORE={
  locker:'The door of {F}’s dressing room swings shut behind {W}. The camera outside only catches the noise.',
  hold:'{W} drags {F} down onto the concrete and wrenches an arm the wrong way, and holds it there.',
  dive:'{W} climbs a stack of road cases and drops onto {F} from the top. Both of them are slow to move.'
 };
 function ambush(st,R,o){
  const ok=resolveFx(st,o);
  if(o.selfRisk&&!st.flags.selfHurt&&hash(st.cid+'|ambush|self|'+o.id)<o.selfRisk){st.flags.selfHurt=true;line(st,'stage','{W} comes away holding a wrist. That cost them something too.');}
  if(R.id==='where'){st.flags.vis=o.vis;line(st,'stage',AMB_SAY[o.id]||AMB_SAY_MORE[o.id]);}
  else if(R.id==='how'){
   st.flags.how=o.id;line(st,'stage',AMB_SAY[o.id]||AMB_SAY_MORE[o.id]);
   if(o.id==='stare'){line(st,'f','{F} does not move. It looks like it costs them something.');st.flags.mind=true;}
   if(o.id==='dive')st.flags.dove=true;
  }else{
   if(o.id==='stand')line(st,'stage',AMB_SAY.stand);
   else if(o.id==='line')line(st,ok?'w':'stage',ok?AMB_SAY.say[voice(st.w)]:AMB_SAY.sayNo);
   else if(o.id==='leave')line(st,'stage',AMB_SAY.leave);
   else line(st,'stage',AMB_SAY.more);
   if(hash(st.cid+'|ambush|back')<backChance(st)){line(st,'f',AMB_SAY.back);st.flags.fought=true;st.hurt=Math.max(0,st.hurt-4);}
   line(st,'p',st.flags.vis===3?(likesTrouble(st.p)?'{P}, watching on the monitor, is grinning.':'{P}, watching on the monitor, is not grinning.'):'Word reaches {P} within a minute.');
  }
 }
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
 // The answers are weighed against the question actually asked, and the room it is asked in.
 const qOf=st=>st.questions?.[st.round];
 const GRILL_BASE=4;
 const GRILL_OPTS=[
  {id:'straight',label:'Answer it straight',hint:'Honest and direct. People respect it.',base:{quality:4,room:2,morale:1},
   fx:(st,e)=>{const q=qOf(st);
    if(q==='hurt'){e.room+=3;e.morale+=1;e.why.push('Honesty about the injury earns sympathy, and it helps {W} to say it.');}
    else if(q==='flat'){e.morale+=2;e.why.push('Saying it out loud helps {W}.');}
    else if(q==='unknown'){e.room+=3;e.why.push('A chance to tell people who {W} is.');}
    else if(q==='promoter'){e.trust+=1;e.why.push('{P} likes hearing {W} back the decision.');}}},
  {id:'joke',label:'Laugh it off',hint:'Deflect with a joke. Charming if it lands; evasive if it does not.',
   fx:(st,e)=>{const q=qOf(st),b=['hurt','personal'].includes(q)?-.15:q==='league'?.1:0;
    gamble(st,e,'joke'+st.round,b,{quality:6,room:4},{quality:-3,room:-3});
    if(b)e.why.push(b>0?'A put-down question invites a put-down answer.':'Joking about this looks like dodging it.');}},
  {id:'turn',label:'Turn it on {F}',hint:'Do not answer. Make it about the opponent instead.',base:{heat:3,quality:2},
   fx:(st,e)=>{const q=qOf(st);
    if(['personal','league'].includes(q)){e.heat+=2;e.why.push('It is a question about {F} anyway.');}
    else if(['hurt','flat'].includes(q)){e.room-=2;e.why.push('Everyone can see {W} dodging the question.');}}},
  {id:'credit',label:'Give {F} credit',hint:'Say {F} is as good as anyone here. Then say who is better.',base:{quality:3,room:1},
   fx:(st,e)=>{if(st.heat0>=45){e.room+=2;e.why.push('Respect cuts through a bitter rivalry.');}
    trustFor(st,e,['traditional','cold'],['aggressive'],'{P} likes a professional answer.','{P} wanted fireworks, not manners.');}},
  {id:'vow',label:'Promise a win',hint:'Look past the interviewer and say it: {W} wins tonight.',base:{heat:2,quality:3},
   fx:(st,e)=>{if(st.promise){e.heat=1;e.quality=1;}promiseFx(st,'win',e);}},
  {id:'storm',label:'Walk out',hint:'End the interview now. A moment people remember, for better or worse.',base:{heat:3,room:-2,trust:-1},
   fx:(st,e)=>{const q=qOf(st);e.quality+=st.round===0?2:4;e.tags.push('Ends it');
    if(likesTrouble(st.p)){e.trust+=1;e.why.push('{P} likes a walk-out.');}
    if(st.w.ego>=75&&['ego','personal'].includes(q)){e.room+=3;e.why.push('A walk-out fits {W}’s ego.');}}}
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
 const GRILL_NEW={credit:'{W} thinks about it, then says {F} is as good as anyone in the building. “Tonight we find out who is better.”',
  again:'{W} says it again, slower this time: they will win tonight.'};
 function grilling(st,R,o){
  const vw=voice(st.w),say=GRILL_SAY[o.id],ok=resolveFx(st,o);
  if(o.id==='storm'){
   // Generated rookie banks have no true "done talking" line, so a walk-out keeps the voice line for them.
   const rookie=/^(?:academy|rookie)-/.test(st.dialogue?.facts?.player?.id||'');
   speak(st,rookie?null:bankLine(st,'storm',[['close','uncertainty','un_done']],noYou),say[vw]);line(st,'stage','{W} walks out of shot. The interviewer stands there holding the microphone.');
   st.flags.walked=true;st.stage='done';return;
  }
  if(o.id==='credit'){line(st,'stage',GRILL_NEW.credit);return;}
  if(o.id==='vow'){
   if(st.promise)line(st,'stage',GRILL_NEW.again);
   else{speak(st,bankLine(st,'vow',[['close','vow','vo_plain'],['close','vow','vo_hard']],'commit'),SOLO_SAY.vow[vw]);st.promise={type:'win',claim:'vow',checked:false};}
   return;
  }
  const text=say[vw][st.round%2];
  if(o.id==='straight')speak(st,bankLine(st,'q'+st.round,GRILL_SLOTS[st.questions[st.round]]||[],answerable),text);
  else if(o.id==='joke'){line(st,'w',text);line(st,'crowd',ok?'The hall laughs along on the screen.':'Nobody laughs. The interviewer waits for a proper answer.');}
  else{line(st,'stage','{W} looks past the interviewer, straight into the camera.');speak(st,bankLine(st,'q'+st.round,CHALLENGES),text);}
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
   w:{id:w.id,short:w.short,name:w.name,style:w.style||null,mic:w.mic||50,ego:w.ego||50,heat:w.heat||40,morale:w.morale??60,fatigue:w.fatigue||0,injury:w.injury||null},
   f:{id:f.id,short:f.short,name:f.name,mic:f.mic||55,ego:f.ego||60},
   p:{id:p.id,voice:p.voice,name:p.name,venue:p.venue||'the hall',tv:!!p.tv,personality:p.personality||null,likes:p.likes||null},
   finish:c.finish||null,stale:staleness(type,w),heat0,quality:type==='vignette'?48+(p.tv?5:0)+((w.mic||50)<50?4:0):clamp(36+(w.mic||50)*.3)+(type==='grilling'?GRILL_BASE:0),room:0,heat:0,hurt:0,back:0,trust:0,morale:0,log:[],picks:[],flags:{},questions:null,promise:null};
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
  const R=rounds(st)[st.round];
  if(st.type==='vignette'&&R.id==='setting')return SETTINGS.map(s=>settingOption(st,s));
  if(st.type!=='vignette')return R.options.map(o=>fxOption(st,o,st.type==='solo'?SOLO_CATS:null));
  return R.options.map(o=>({id:o.id,label:fill(o.label,st),hint:fill(o.hint,st),tags:(st.type==='vignette'?vignetteTags(st,R,o):o.tags).map(t=>fill(t,st))}));
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
  if(st.flags.ambition===true&&p&&st.type==='solo'){const dt=likesTrouble(p)?2:p.personality==='traditional'?-1:0;st.trust+=dt;}
  if(p&&st.trust)p.trust=clamp(p.trust+st.trust);
  if(w&&st.morale)w.morale=clamp(w.morale+st.morale);
  if(w&&st.flags.dove)w.fatigue=clamp(w.fatigue+4);
  if(w&&st.flags.selfHurt)w.fatigue=clamp(w.fatigue+6);
  if(w&&st.flags.fought){w.fatigue=clamp(w.fatigue+5);w.flags={...(w.flags||{}),pushThrough:true};}
  G?.save?.();
 }
 function result(st){
  if(st?.stage!=='done')return null;
  const E=ENGINES[st.type],cap95=st.type==='vignette'?82:95;
  const stale=st.stale||0;
  const q=clamp(st.quality+st.room*.4+(st.type==='ambush'?st.hurt*.25:0)-4*stale,12,cap95);
  const energy=st.type==='solo'&&st.flags.cheap?Math.abs(st.room)*.25:st.room*.25;
  const crowdShift=Math.max(-6,Math.min(13,Math.round((q-50)/6+energy+(st.type==='ambush'?visCrowd(st.flags.vis):0)+(st.flags.tease?2:0))-stale));
  const heatDelta=clamp(st.heat*(1-.25*stale),0,16);
  const style=st.type==='solo'&&st.picks[0]==='crowd'?'rally':st.type==='solo'&&['threat','history'].includes(st.picks[1])?'challenge':st.type==='grilling'&&st.picks.includes('credit')&&!st.flags.walked?'respect':st.type==='vignette'?st.flags.style||null:null;
  const hook=cap(st.type==='solo'&&st.promise?(st.promise.type==='win'?`${st.w.short} promised the crowd a win tonight. Now they have to deliver it.`:`${st.w.short} promised a clean finish in front of everyone.`):st.type==='solo'?(st.flags.cheap?`${st.w.short} insulted ${st.p.venue} before the match. The crowd wants blood.`:q>=65?`${st.w.short} had the room in the palm of their hand before the bell.`:`${st.w.short} spoke alone before the match. Now they have to back it up.`):
   st.type==='vignette'?(st.flags.tease?`Nobody has worked out what was on the wall in ${st.w.short}’s video.`:q>=65?`That video package has the crowd ready for ${st.w.short}.`:`The video package is over. The real thing is next.`):
   st.type==='ambush'?(st.flags.mind?`${st.w.short} got in ${st.f.short}’s face backstage and did not throw a punch. ${st.f.short} looks rattled.`:st.flags.fought?`${st.w.short} jumped ${st.f.short} backstage, but ${st.f.short} hit back. Both of them are marked.`:`${st.w.short} jumped ${st.f.short} backstage. ${st.f.short} is still holding their ribs.`):
   st.flags.walked?`${st.w.short} walked out of their interview. Nobody knows what kind of mood they are in.`:st.promise?`${st.w.short} promised a win in their interview. Now they have to deliver it.`:`${st.w.short} took the hard questions before the match.`);
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
 root.OfficeSegments={TYPES,ENGINES,BANKED,VIGNETTE_CATEGORIES:VIG_CATS,VIGNETTE_SETTINGS:SETTINGS,menu,advice,begin,options,choose,view,result,grillQuestions};
})(typeof window!=='undefined'?window:globalThis);
