/* THE OFFICE v3.6 — the promo duel.
   Two wrestlers, one crowd. Each exchange swings the room towards one of them: your opening shot,
   their reply, an optional gamble for more, and the last word. The argument, the evidence and the
   public promise still come from the promo graph underneath, so what is said is still tested in the
   ring. Every option states its risk and what it is for. Seeded and replayable. */
(function installPromoDuel(root){'use strict';
 const D=root.OfficeData,Core=root.OfficeStory.Graph,Room=root.OfficeRoom,Director=root.OfficePromoDirector,Dialogue=root.OfficePromoDialogue,Semantic=root.OfficePromoSemantics;
 const Banks=root.OfficePromoBanks,sceneCatalogues=new WeakMap();
 const emptyCatalogue=Dialogue.catalogue([]);
 function catalogueFor(st){
  if(Array.isArray(st.authoredDialogue?.banks)){
   if(!sceneCatalogues.has(st)){let cat;try{cat=Banks.catalogue(st.authoredDialogue.banks);}catch(_){cat=Dialogue.catalogue([]);}sceneCatalogues.set(st,cat);}
   return sceneCatalogues.get(st);
  }
  // No implicit editorial catalogue: browser and simulation use explicit payloads.
  return emptyCatalogue;
 }
 const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
 const rng=(seed,k)=>hash(seed+'|'+k)/4294967296;
 const pick=(arr,seed,k)=>arr[Math.floor(rng(seed,k)*arr.length)];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const voice=w=>Room.VOICE[w.id]||'stoic';
 // v0.3.25 A mouthpiece: a stablemate at the microphone for the wrestler. They speak; the wrestler is spoken for.
 const talker=st=>st.speaker||st.w;
 const spoke=st=>st.speaker?{...st,w:st.speaker}:st;
 const HOOK={
  quiet:{label:'Wait for silence',hint:'Stand there until they shut up. Commanding, if you can hold a room. Takes a while.',len:2,risk:2,ok:{crowd:6,cred:2},bad:{crowd:-4,cred:-1},
   lines:{grand:'{W} raises one hand and simply waits. It takes a full minute. The hall goes quiet out of something close to fear.',
    gruff:'{W} stares at the crowd until they stop. It does not take long.',
    eager:'{W} tries to wait for silence, bouncing on the spot the whole time.',
    stoic:'{W} waits, arms folded, like someone watching a kettle.',
    precise:'{W} checks an imaginary watch until the room settles.',
    earnest:'{W} waits politely for everyone to finish their conversations.',
    sermon:'{W} bows. The room, somehow, bows too.',
    slippery:'{W} waits, grinning, like somebody about to sell them a van.'}},
  pop:{label:'Mention the town',hint:'The cheap pop. It always works a bit. It never works a lot.',len:1,risk:0,ok:{crowd:4,cred:-1},bad:{crowd:1,cred:-1},
   lines:{grand:'“{VENUE}. I have played Paris. I have played Leeds. Nowhere, and I mean nowhere, smells quite like this.”',
    gruff:'“{VENUE}. Good crowd. Bad car park.”',
    eager:'“HELLO {VENUE}! Have I said it right? I practised in the van!”',
    stoic:'“Evening, {VENUE}. Nice to be somewhere with a roof.”',
    precise:'“Good evening, {VENUE}. Statistically, the loudest crowd on the circuit per head.”',
    earnest:'“It’s so good to be back at {VENUE}! You’re my favourite. I say that everywhere, but here I mean it.”',
    sermon:'“Brothers and sisters of {VENUE}. I have prayed for your one-way system.”',
    slippery:'“{VENUE}! My favourite town. I’ve got family here. Sort of. It’s complicated.”'}},
  straight:{label:'Straight to business',hint:'No warm-up. Credible and quick.',len:1,risk:0,ok:{crowd:1,cred:3},bad:{crowd:0,cred:1},
   lines:{grand:'“I shall be brief, which as you know costs me a great deal.”',
    gruff:'“I’m not here to talk.”',
    eager:'“Okay! Right! So! Tonight!”',
    stoic:'“I’ll keep this short. I’ve a bus to catch.”',
    precise:'“I have three points. I will make them in order.”',
    earnest:'“I’m not very good at this bit, so I’ll just say it.”',
    sermon:'“Hear me, for I shall say this once.”',
    slippery:'“Right, quick one, then I’ll let you get back to your evening.”'}},
  bit:{label:'Open with a joke',hint:'At the opponent’s expense. Brings the house down or dies in the room. Depends who is telling it.',len:1,risk:3,ok:{crowd:8,heat:2},bad:{crowd:-5,cred:-2},
   lines:{grand:'“I asked {F} what their best quality was. They’re still thinking. It’s been a fortnight.”',
    gruff:'“{F} asked for my autograph earlier. I signed the release form.”',
    eager:'“What’s the difference between {F} and a deckchair? A deckchair’s harder to fold! I wrote that one!”',
    stoic:'“I’ve seen {F} wrestle. I’ve also seen a shed fall over. One of them was more convincing.”',
    precise:'“{F} has a ninety per cent success rate, if you only count getting dressed.”',
    earnest:'“{F} is a lovely person. I’m told. By {F}.”',
    sermon:'“I prayed for {F}. Even the Lord said, ‘Leave it with me, but no promises.’”',
    slippery:'“I’d call {F} a cheat, but that’s unfair. Cheating takes planning.”'}}
 };
 const FLUFF={
  grand:['{W} forgets the end of the sentence and gestures at the lighting rig as though that had been the plan.','{W} delivers the line to the wrong side of the hall, with enormous conviction.','{W} builds to a tremendous climax and then says the opponent’s name wrong.'],
  gruff:['{W} loses the thread, glares at the microphone and settles for “Yeah.”','{W} says the first half and lets the second half speak for itself. It does not.','{W} runs out of words early and fills the gap by breathing at the microphone.'],
  eager:['{W} gets so excited the words come out in the wrong order. Some of them are not words.','{W} says “and another thing” and then cannot think of another thing.','{W} trips over the microphone lead mid-sentence and carries on from the floor.'],
  stoic:['{W} says it to the floor. The floor has no comment.','{W} pauses for effect and the effect leaves without them.','{W} reads the line off the back of a hand. The ink has run.'],
  precise:['{W} corrects a small factual error in their own sentence. Twice. Nobody was keeping count.','{W} delivers it perfectly, in a voice only the first row can hear.','{W} adds a footnote. Out loud.'],
  earnest:['{W} says the line, apologises for the line, and thanks everyone for coming.','{W} gets halfway through and waves to someone they know.','{W} loses confidence halfway and finishes the sentence as a question?'],
  sermon:['{W} begins a parable, loses the moral, and ends with “and so forth”.','{W} quotes scripture that turns out to be from a greetings card.','{W} asks the crowd to turn to page forty. Nobody has a book.'],
  slippery:['{W} winks at the end of the sentence, and it sounds like a lie even though it was not one.','{W} loses the crowd somewhere around “to be fair”.','{W} says “trust me” and visibly loses the room.']
 };
 // Live delivery notes describe the words already spoken, not an invented
 // forgotten sentence, accident or factual error. Preserve legacy FLUFF.
 const LIVE_DELIVERY={
 "grand": [
  "{W} puts more ceremony into the line than the moment needs.",
  "{W} stretches the final syllable, looking for a response that has already passed.",
  "{W} raises a hand for emphasis a little too late.",
  "{W} sweeps a look across the hall; the timing of the line is off.",
  "{W} lets the grand gesture do more work than the words.",
  "{W} speaks with theatrical conviction, but the cadence feels forced."
 ],
 "gruff": [
  "{W} grips the microphone tighter; the words come out strained.",
  "{W} clips the ends of the words in frustration.",
  "{W} delivers the point with a little too much force.",
  "{W} rushes the last few words through clenched teeth.",
  "{W} gives the line a hard edge that does not help it land.",
  "{W} takes a sharp breath before the emphasis, breaking the rhythm."
 ],
 "eager": [
  "{W} rushes through the point without leaving room for emphasis.",
  "{W} gestures faster than the words can carry.",
  "{W} takes a quick breath and pushes the pace again.",
  "{W} puts the emphasis on the wrong part of the sentence.",
  "{W} barely leaves a gap between phrases.",
  "{W} gets ahead of the rhythm of the speech."
 ],
 "stoic": [
  "{W} keeps the delivery so flat that the emphasis is lost.",
  "{W} speaks quietly, with little projection.",
  "{W} holds a beat longer than the moment needs.",
  "{W} delivers the point with almost no change of tone.",
  "{W} looks down briefly as the words come out.",
  "{W} gives the line too little lift at the end."
 ],
 "precise": [
  "{W} gives each phrase equal weight; the central point loses its emphasis.",
  "{W} delivers the argument in a stiff, measured cadence.",
  "{W} sounds more rehearsed than convinced.",
  "{W} takes a fraction too long to place the emphasis.",
  "{W} concentrates so hard on the wording that the delivery feels mechanical.",
  "{W} keeps the phrasing neat, but the rhythm is awkward."
 ],
 "earnest": [
  "{W} begins confidently but the voice softens towards the end.",
  "{W} looks between the crowd and the opponent, losing a little focus.",
  "{W} puts more feeling into the line than the delivery can carry.",
  "{W} sounds tentative where the point needs conviction.",
  "{W} takes an audible breath and finishes less firmly.",
  "{W} searches the room for reassurance while speaking."
 ],
 "sermon": [
  "{W} lingers over the cadence until the point loses momentum.",
  "{W} puts a solemn emphasis on almost every phrase.",
  "{W} raises the microphone with a flourish that feels out of place.",
  "{W} allows too much space between phrases.",
  "{W} delivers the point like a lesson rather than a conversation.",
  "{W} gives the line a ceremonial rhythm that slows the exchange."
 ],
 "slippery": [
  "{W} lets a smile creep into the delivery at the wrong moment.",
  "{W} sounds a shade too rehearsed.",
  "{W} keeps the smooth tone even where the point needs weight.",
  "{W} gives a small shrug that weakens the emphasis.",
  "{W} glances aside and the delivery loses focus.",
  "{W} tries to sell the point harder than the moment requires."
 ]
};
 const DELIVERY_CONTEXT={
 "unsettled": [
  "{W} takes a shallow breath; the delivery loses its steadiness.",
  "{W} shifts their grip on the microphone, visibly tense.",
  "{W} tightens their shoulders as the words come out.",
  "{W} sounds less certain than the words suggest.",
  "{W} struggles to keep the delivery even."
 ],
 "irritated": [
  "{W} puts too much bite into the delivery.",
  "{W} lets frustration dictate the pace of the words.",
  "{W} speaks over their own breath, making the rhythm awkward.",
  "{W} pushes the volume higher than the point needs.",
  "{W} forces the emphasis, visibly impatient."
 ],
 "controlled": [
  "{W} keeps their composure, but the delivery lacks conviction.",
  "{W} delivers the point cleanly enough, with little force behind it.",
  "{W} stays measured; the timing is not quite there.",
  "{W} remains composed, though the words lack emphasis.",
  "{W} keeps the microphone steady but the line feels rehearsed."
 ],
 "closing": [
  "{W} delivers the final words with less conviction than the moment demands.",
  "{W} lowers the microphone after an awkwardly timed final phrase.",
  "{W} gives the closing statement little emphasis.",
  "{W} finishes the statement, but the cadence is uneven.",
  "{W} makes the final point in a strained voice.",
  "{W} ends the speech with a hesitant delivery."
 ]
};
 const CROWD={
  roar:['A proper roar. Somewhere, a pint goes over.','They are standing on the chairs they were asked not to stand on.','The noise sets off a car alarm outside.','A man in row two is hitting his own programme against his knee with joy.'],
  good:['A solid murmur of approval.','Applause, most of it sincere.','Someone shouts “Go on!” and several people agree.','Heads are nodding. A flask is passed along in celebration.'],
  flat:['Polite attention. Someone unwraps a sandwich.','They are listening. A few of them are also reading the raffle tickets.','A neutral sort of silence. The tea urn clicks.'],
  cool:['A cough echoes around the hall.','Somebody near the back says “Eh?”','A few people check when the bar closes.','A chair scrapes. It gets a bigger reaction.'],
  dead:['Silence, apart from the tea urn.','A child asks, quite loudly, when the wrestling starts.','You can hear the fire door not quite closing.','A man folds his arms so hard his coat creaks.']
 };
 const OPP_CROWD={
  hit:['That one landed. The room turns a few degrees towards {F}.','A cheer for {F}. Not a big one, but you heard it.','Somebody at the back shouts “Fair point!”','They liked that. Unfortunately.'],
  miss:['{F}’s reply dies somewhere over row three.','Nobody reacts. {F} looks at the microphone as if it has let them down.','A long pause. Somebody opens a packet of crisps.','{F} waits for a reaction and gets the tea urn.']
 };
 // Short, observational reactions for new formatted scenes. The old pools
 // remain unchanged for old saves and legacy callers.
 const LIVE_CROWD={
  roar:['The hall erupts.','A wave of cheers runs down both sides of the ring.','The response is immediate and loud.','People rise from their seats.','The next words will have to wait for the noise.','Applause swells into a roar.','The back rows join in.','For a moment the room is all theirs.','The response carries all the way to the entrance.','The cheers drown out the next breath.','The audience is fully behind that line.','The noise builds as the microphone comes down.'],
  good:['A ripple of applause.','A few voices call their approval.','Several people nod along.','That earns a warm response.','The front rows clap.','A cheer picks up from the side of the ring.','The audience warms to the point.','The line gets a little more noise than the last.','A short burst of applause follows.','The response is encouraging, not overwhelming.','There is a distinct note of approval.','More of the room is paying attention now.'],
  flat:['The room stays quiet.','The audience listens without committing.','A few isolated voices, nothing sustained.','The response is difficult to read.','Nobody seems ready to take a side.','There is a brief lull.','The line hangs in the air.','A small reaction fades quickly.','Attention holds, but the noise does not rise.','The audience waits for the next point.','The room gives little away.','There is no clear shift in the response.'],
  cool:['The response is muted.','A few people turn away from the exchange.','The noise drops off.','Only a scattered reaction follows.','A restless murmur comes from the back.','That does not quite reach the room.','The applause never really starts.','The audience sounds unconvinced.','A few voices express their doubts.','The moment passes without much support.','The hall grows a little restless.','The line earns less than it needed.'],
  dead:['No cheer follows.','The silence is conspicuous.','A few impatient voices break the quiet.','The room has gone cold.','The line falls flat.','The audience barely acknowledges it.','A long, uncomfortable gap follows.','The response has all but disappeared.','Nobody takes up the line.','The crowd sounds ready to move on.','The microphone catches the quiet of the hall.','There is little left of the earlier attention.']
 };
 const LIVE_OPP_CROWD={
  hit:['A cheer answers {F}.','Several voices back {F} up.','The reply draws real approval.','The room responds to the objection.','A burst of applause follows the reply.','The crowd gives {F} the benefit of the doubt.','The answer earns a noticeable reaction.','{F} has found some support.','A few spectators call out in agreement.','The rebuttal brings the audience in.','That gets a response from both sides of the hall.','The momentum shifts towards {F}.'],
  miss:['The reply gets little in return.','A few scattered noises, then quiet.','{F} does not find much support.','The objection fails to stir the room.','The audience waits rather than applauding.','The answer passes without a clear reaction.','There is no sustained cheer for {F}.','The room remains unconvinced by the reply.','The response is thin.','Little comes back from the seats.','The rebuttal draws only a murmur.','The audience has not moved with {F}.']
 };
 function liveReaction(st,pool,key){
  const options=pool.map(line=>fmt(line,st)),seen=new Set(st.log.filter(e=>e.side==='crowd').map(e=>e.line));
  const recent=new Set(st.reactionStyle.recent||[]);
  const fresh=options.filter(line=>!seen.has(line)),unheard=fresh.filter(line=>!recent.has(line));
  return pick(unheard.length?unheard:fresh.length?fresh:options,st.seed,'live-reaction|'+key);
 }
 const HECKLES=['Get on with it!','My nan could have you!','You were better in the nineties!','Who are you again?','Say something about the car park!','Is this the bingo?'];
 const ROUNDS=[
  {id:'open',name:'Opening shot',help:'You have the microphone first. Pick the argument that suits tonight. The crowd decides who is winning.'},
  {id:'answer',name:'They hit back',help:'{F} has answered. Answer the angle {F} took, and take the room back.'},
  {id:'push',name:'Push your luck?',help:'You can leave it there, or go again. Going again can win the room, or hand it over.'},
  {id:'close',name:'Last word',help:'The last thing they hear before the bell. Whatever you promise, the match will check.'}
 ];
 const PUSH={
  bit:{label:'Tell a joke at {F}’s expense',hint:'Brings the house down or dies in the room.',risk:3,gain:12,loss:8,src:'bit'},
  quiet:{label:'Hold the silence',hint:'Stand there until they come to you. Needs presence.',risk:2,gain:9,loss:6,src:'quiet'},
  pop:{label:'Play to the town',hint:'The cheap pop. It always works a bit. It never works a lot.',risk:0,gain:4,loss:1,src:'pop'}
 };
 // v3.7 THE READ. Before the first line Dennis says what kind of night it is. Each opening suits some
 // nights and some speakers better than others, so the best opening is a judgement, not a constant.
 const READ={
  room:{hot:'It’s heaving out there. They’ll go with anything big.',cold:'They’re quiet tonight. Shouting at a quiet room makes it quieter.',who:'Half of them don’t know who {W} is. Records won’t mean much to them. Give them a reason to care.'},
  feud:{yes:'There’s real bad blood between these two. If {W} has something on {F}, now’s the time.',no:'No history between these two. An accusation will sound made up.',
   record:'These two have history, and some of it is on the record. Use what actually happened.'},
  opp:{good:'{F} can talk. Don’t get into a slanging match unless you’re sure.',fair:'{F} talks a decent game. Nothing special.',poor:'{F} is no talker. Keep it tidy and let {F} dig the hole.'},
  voice:{grand:'{W} can carry a big, strange picture.',sermon:'{W} can carry a big, strange picture.',precise:'{W} is better with facts than fireworks.',stoic:'{W} is better with facts than fireworks.',
   eager:'{W} is likeable. Let {W} be likeable.',earnest:'{W} is likeable. Let {W} be likeable.',gruff:'{W} has an edge. Use it on somebody who deserves it.',slippery:'{W} has an edge. Use it on somebody who deserves it.'}
 };
 function readFor(c,w,f,rival,sheet,fmic,seed,core){
  const r=rng(seed,'room'),big=['feature','main'].includes(c.slot);
  const room=sheet?.crowdMood||((w.heat||40)<35?'who':r<(big?.7:.4)?'hot':'cold');
  const feud=Math.max(c.feudHeat||0,rival&&!rival.closed?rival.heat||0:0)>=35;
  const opp=fmic>=65?'good':fmic<45?'poor':'fair';
  return {room,feud,opp,voice:voice(w),record:!!core?.cases?.length};
 }
 const PRACTICE={people:'{W} has been practising talking to the crowd with me.',proof:'{W} has been drilling the facts with me. Results, dates, the lot.',
  imagery:'{W} has been working on the big pictures with me. Some of them are very strange.',accusation:'{W} has been practising going after people. I’ve had worse weeks. Not many.',
  swagger:'{W} has been working on the swagger. Struts past my office twice a day now.'};
 const clampFit=x=>clamp(x,-2,2);
 // A programme's creative direction changes how an argument lands, rather
 // than only adding a score after the match. Small modifiers retain agency.
 const ARC_FIT={
  steady:{open:{people:1,proof:1,accusation:-1,swagger:-1},answer:{calm:1,turn:1,personal:-1},close:{clean:1,question:1,vow:-1}},
  needle:{open:{accusation:1,numbers:1,proof:1,people:-1},answer:{challenge:1,turn:1,personal:1,callback:-1},close:{vow:1,question:1,none:-1}},
  gamble:{open:{swagger:1,imagery:1,accusation:1,proof:-1},answer:{challenge:1,personal:1,calm:-1},close:{vow:2,finisher:1,none:-1}}
 };
 function arcFit(st,stage,id){return ARC_FIT[st.arc?.id]?.[stage]?.[id]||0;}
 function openFit(st,id){
  const r=st.read,v=r.voice;
  return clampFit(({
   people:(r.room==='hot'?1:0)-(r.room==='who'?1:0)+(['eager','earnest'].includes(v)?1:0),
   proof:(r.room==='cold'?1:r.room==='who'?-1:0)-(r.room==='hot'?1:0)+(['precise','stoic'].includes(v)?1:0)+(r.opp==='good'?1:0),
   imagery:(['grand','sermon'].includes(v)?2:-1)+(r.room==='hot'?1:r.room==='cold'?-1:0),
   accusation:(r.feud?2:r.record?1:-1)+(['gruff','slippery'].includes(v)?1:0)-(r.room==='who'?1:0),
   swagger:(r.room==='who'?1:r.room==='cold'?-1:0)+(['grand','slippery','eager'].includes(v)?1:0)-(r.opp==='good'?1:0),
   hometown:(r.room==='hot'?1:r.room==='who'?1:-1)+(['gruff','slippery','grand'].includes(v)?1:-1)+(r.feud?1:0),
   numbers:(['precise','slippery'].includes(v)?2:-1)+(r.room==='hot'?1:0)-(r.opp==='good'?1:0)
  }[id]||0)+(st.practice?.[id]||0)+arcFit(st,'open',id));
 }
 // The opponent's angle in reply, and the answer that beats each one.
 const ANGLE_CUE={personal:'{F} has gone straight for the personal stuff.',mock:'{F} is laughing at {W}, and some of the crowd are laughing along.',
  facts:'{F} has come armed with facts. Results, dates, the lot.',crowd:'{F} is playing to the crowd now, and they’re enjoying it.',
  // v0.3.12 When the argument is about something on the record, the cue says how {F} answered it.
  case_evidence:'{F} has answered with what actually happened. Deal with the point, not the person.',
  case_dismiss:'{F} won’t even engage with it. Make {F} engage.',
  case_concede:'{F} has given a little ground, but not the conclusion.',
  case_deflect:'{F} has changed the angle. Bring it back.'};
 const ANSWER_FIT={
  case_evidence:{calm:2,turn:1,challenge:1,callback:-1,personal:-2,confession:0,fakeout:-2},
  case_dismiss:{turn:2,challenge:1,calm:0,callback:-1,personal:0,confession:0,fakeout:1},
  case_concede:{calm:2,challenge:1,turn:0,callback:0,personal:-2,confession:1,fakeout:-1},
  case_deflect:{turn:2,challenge:1,calm:0,callback:-1,personal:-1,confession:0,fakeout:1},
  personal:{calm:2,challenge:1,turn:0,callback:0,personal:-1,confession:1,fakeout:-1},
  mock:{turn:2,callback:1,challenge:0,calm:-1,personal:0,confession:-1,fakeout:2},
  facts:{challenge:2,turn:1,calm:0,callback:-1,personal:-2,confession:0,fakeout:-1},
  crowd:{callback:2,turn:1,challenge:0,calm:-1,personal:-1,confession:2,fakeout:1}
 };
 function angleFor(st,opening){
  if(st.core?.case?.mode)return 'case_'+st.core.case.mode;
  const F=st.fRaw,v=Room.VOICE[F.id]||'stoic',w={personal:1,mock:1,facts:1,crowd:1};
  if((F.ego||50)>=68)w.personal+=2;if(['slippery','grand','eager'].includes(v))w.mock+=2;
  if(['precise','stoic'].includes(v)||(F.pro||60)>=80)w.facts+=2;if(['earnest','sermon'].includes(v)||(F.heat||40)>=60)w.crowd+=2;
  w[{accusation:'personal',imagery:'mock',proof:'facts',people:'crowd',swagger:'mock',hometown:'crowd',numbers:'facts'}[opening]]+=2;
  if(st.speaker)w.mock+=3; // “Can’t {W} speak for themselves?”
  const total=Object.values(w).reduce((a,b)=>a+b,0);let x=rng(st.seed,'angle')*total;
  for(const [k,n] of Object.entries(w)){x-=n;if(x<0)return k;}
  return 'facts';
 }
 function answerFit(st,id){return clampFit((ANSWER_FIT[st.angle]?.[id]??0)+(id==='personal'&&st.read.feud?2:0)+arcFit(st,'answer',id));}
 function pushFit(st,id){
  const r=st.read,v=r.voice;
  return clampFit({bit:(r.room==='hot'?1:r.room==='cold'?-1:0)+(['eager','slippery','grand'].includes(v)?1:0),
   quiet:(r.room==='hot'?1:r.room==='who'?-1:0)+(['grand','sermon','stoic'].includes(v)?1:0),
   pop:(r.room==='who'?1:r.room==='cold'?-1:0)}[id]||0);
 }
 const riskWord=r=>r<=0?'Safe':r===1?'Steady':r===2?'Risky':'Very risky';
 const meterWord=m=>m>=25?'The room is yours':m>=8?'With you':m>-8?'Even':m>-25?'With them':'The room is theirs';
 const fmt=(text,st)=>String(text).replace(/\{W\}/g,st.w.short).replace(/\{F\}/g,st.f.short).replace(/\{VENUE\}/g,st.venue).replace(/\{P\}/g,st.promoterVoice).replace(/\{PROMO\}/g,st.promoterName);
 // Core match claims belong to the client even when the mouthpiece voices them.
 // Opening jokes belong to the actual speaker; only client claims are reframed.
 function clientClaim(st,line){
  if(!st.speaker)return String(line);
  const n=st.w.short;
  return String(line)
   .replace(/\bYou beat me\b/gi,'You beat '+n)
   .replace(/\bI(?:'m|’m)\b/gi,n+' is')
   .replace(/\bI(?:'ve|’ve)\b/gi,n+' has')
   .replace(/\bI(?:'ll|’ll)\b/gi,n+' will')
   .replace(/\bI(?:'d|’d)\b/gi,n+' would')
   .replace(/\bI am\b/gi,n+' is').replace(/\bI have\b/gi,n+' has')
   .replace(/\bI don't\b/gi,n+" doesn't").replace(/\bI do\b/gi,n+' does')
   .replace(/\bI (know|think|want|say|promise|believe|remember|need|love|hate|make|try)\b/gi,(_,v)=>n+' '+({know:'knows',think:'thinks',want:'wants',say:'says',promise:'promises',believe:'believes',remember:'remembers',need:'needs',love:'loves',hate:'hates',make:'makes',try:'tries'}[v.toLowerCase()]||v))
   .replace(/\bI\b/g,n).replace(/\bmy\b/gi,n+'’s').replace(/\bme\b/gi,n).replace(/\bmine\b/gi,n+'’s');
 }
 const push=(st,side,line,kind,swing,clientVoice=false)=>{const text=clientVoice?clientClaim(st,line):String(line);
  st.log.push({speaker:side==='w'?(st.speaker?st.speaker.name:st.w.name):side==='f'?st.f.name:side==='host'?'Interviewer':side==='crowd'?'Crowd':'',side,line:text.charAt(0).toUpperCase()+text.slice(1),kind,swing:swing||0});};
 function begin(c,w,f,rival,sheet,p,opts={}){
  const m=opts?.mouth||null;
  // The mouthpiece's skill is what the room hears; the words are still about the wrestler.
  const wTalk=m?{...w,mic:m.mic||40,psych:m.psych||45}:w;
  const core=Core.begin(c,wTalk,f,rival,sheet);
  const fmic=f.mic||Math.round((f.psych||50)*.55+(f.heat||50)*.45);
  const st={v:5,cid:c.id,seed:core.seed+'|duel',core,round:0,fRaw:{id:f.id,ego:f.ego||50,pro:f.pro||60,heat:f.heat||45},angle:null,
   w:{id:w.id,name:w.name,short:w.short,mic:wTalk.mic||40,psych:wTalk.psych||45,heat:w.heat||40},
   speaker:m?{id:m.id,name:m.name,short:m.short,mic:m.mic||40,psych:m.psych||45,heat:m.heat||40}:null,f:{id:f.id,name:f.name,short:f.short,mic:fmic,heat:f.heat||45},
   venue:p?.venue||'this hall',promoterVoice:p?.voice||'the promoter',promoterName:p?.name||'the promotion',finish:c.finish||null,
   meter:clamp(Math.round(((w.heat||40)-(f.heat||45))/4)+(m&&(m.heat||0)>=60?3:0),-15,15),pushed:null,steps:[],log:[],stage:'live',result:null};
  st.start=st.meter;
  if(opts.directed&&opts.formats){st.fallbackVariety=1;st.closingVariety=1;st.closingCommitmentStyle=1;}
  if(opts.directed&&opts.formats)st.coreVoiceStyle={v:1,recent:[...new Set((root.OfficeGame?.S?.history||[]).slice(0,6).flatMap(h=>(h.promo?.dialogue||[]).filter(e=>e.kind==='strong'||e.kind==='uneven').map(e=>e.line)))].filter(x=>typeof x==='string').slice(0,48)};
  if(opts.directed&&opts.formats)st.coreVoiceExtension=1;
  if(opts.directed&&opts.formats)st.openingFlow=1;
  if(opts.directed&&opts.formats&&!m&&!opts.arc)core.imageryStyle=1;
  if(opts.directed&&opts.formats)st.opponentVoiceStyle={v:1,recent:[...new Set((root.OfficeGame?.S?.history||[]).slice(0,6).flatMap(h=>(h.promo?.dialogue||[]).filter(e=>e.side==='f'||e.kind==='opponent').map(e=>e.line)))].filter(x=>typeof x==='string').slice(0,48)};
  if(opts.directed&&opts.formats)st.deliveryStyle={v:1,recent:[...new Set((root.OfficeGame?.S?.history||[]).slice(0,6).flatMap(h=>(h.promo?.dialogue||[]).filter(e=>e.kind==='fluff').map(e=>e.line)))].filter(x=>typeof x==='string').slice(0,48)};
  if(opts.directed&&opts.formats)st.reactionStyle={v:1,recent:[...new Set((root.OfficeGame?.S?.history||[]).slice(0,6).flatMap(h=>(h.promo?.dialogue||[]).filter(e=>e.speaker==='Crowd').map(e=>e.line)))].filter(x=>typeof x==='string').slice(0,48)};
  if(opts.dialogue&&Dialogue)st.dialogueFacts=Dialogue.snapshot(c,w,f,m,p,core);
  if(opts.authored&&st.dialogueFacts)st.authoredDialogue={v:1,...(opts.formats&&opts.semantic?{reviewedAck:1,reviewedContext:1,semanticBankReuse:3}:{}),used:[],recent:Dialogue.recentIds(rival,root.OfficeGame?.S?.history||[]),...(Array.isArray(opts.banks)?{banks:JSON.parse(JSON.stringify(opts.banks))}:{}),...(opts.composition?{composition:true,composedUsed:[]}:{} )};
  if(opts.semantic&&Semantic&&st.authoredDialogue&&opts.directed){st.semantic={v:1,...(opts.formats?{variety:1,followupFlow:1,characterRebuttal:1,claimClassification:1}:{})};core.semanticSpeech=true;}
  if(opts.directed&&Director)st.director=Director.begin(w,f,m,opts.formats?Director.selectFormat(c,w,f,m,p,core,st.seed):null);
  st.arc=opts.arc?{id:opts.arc.id,step:opts.arc.step??null,follow:opts.arc.follow||null}:null;
  st.read=readFor(c,w,f,rival,sheet,fmic,st.seed,core);
  if(m)st.read.voice=voice(m); // the room knows the wrestler; the voice is the mouthpiece's
  // Rehearsal and voice fit belong to the person actually speaking, not the client.
  const practised=m?(root.OfficeGame?.S?.roster?root.OfficeGame.W?.(m.id):null)||m:w;
  st.practice={};for(const [k,v] of Object.entries(practised.micWork||{}))if(Math.floor(v)>0)st.practice[k]=Math.min(2,Math.floor(v));
  const drilled=Object.entries(st.practice).sort((a,b)=>b[1]-a[1])[0];
  st.readLines=[READ.room[st.read.room],READ.feud[st.read.feud?'yes':st.read.record?'record':'no'],READ.opp[st.read.opp],
   // Dennis describes the person holding the microphone here, rather than attributing their style to the client.
   fmt(READ.voice[st.read.voice],m?{...st,w:st.speaker}:st),
   ...(drilled?[fmt(PRACTICE[drilled[0]],m?{...st,w:st.speaker}:st)]:[]),
   ...(m?['{S} is doing the talking for {W} tonight. {S} is the better talker. {W} gets the credit, and the blame.']:[]),
   ...(opts.arc?[opts.arc.read]:[])].map(t=>fmt(t,st).replace(/\{S\}/g,m?.short||''));
  const scene=st.director&&Director.setup(st.director);
  push(st,'host',opts.arc?.prompt||scene?.prompt||core.dialogue[0].line,'interviewer');
  if(st.semantic&&scene)st.openingQuestion=Director.openingQuestion(st.director,opts.arc,st.log[0].line);
  if(scene)push(st,'stage',scene.setting,'stage');
  return st;
 }
 const own=(st,slot)=>{if(st.speaker)return null;const line=D.VOICE_PACKS?.[st.w.id]?.promo?.[slot];return line&&rng(st.seed,'own|'+slot+'|'+(st.ownUsed?.[slot]||0))<2/3?line:null;};
 function fluff(st,stage){
  if(st.deliveryStyle?.v===1){
   const speaker=spoke(st),emotion=st.director?.player,skill=talker(st).mic;
   const family=voice(talker(st)),voicePool=LIVE_DELIVERY[family]||LIVE_DELIVERY.stoic;
   const pressure=emotion?.irritation>=55?'irritated':(emotion?.composure??50)<40||skill<45?'unsettled':skill>=75?'controlled':null;
   // Keep closing delivery specific to the final statement. At other moments
   // combine the speaker's own voice with the current pressure when relevant.
   const pool=stage==='close'?DELIVERY_CONTEXT.closing:pressure?[...voicePool,...DELIVERY_CONTEXT[pressure]]:voicePool;
   const options=pool.map(line=>fmt(line,speaker)),seen=new Set(st.log.filter(e=>e.kind==='fluff').map(e=>e.line)),recent=new Set(st.deliveryStyle.recent||[]);
   const fresh=options.filter(line=>!seen.has(line)),unheard=fresh.filter(line=>!recent.has(line));
   return pick(unheard.length?unheard:fresh.length?fresh:options,st.seed,'live-delivery|'+stage+'|'+st.steps.length);
  }
  const mine=!st.ownUsed?.fluff&&own(st,'fluff');if(mine){(st.ownUsed??={}).fluff=1;return fmt(mine,st);}
  const arr=FLUFF[voice(talker(st))];st.fluffs=(st.fluffs??hash(st.seed+'|fluff')%arr.length)+1;return fmt(arr[st.fluffs%arr.length],spoke(st));}
 function roll(st,risk,key,edge=0){
  const skill=clamp(st.w.mic*.7+st.w.psych*.2+st.w.heat*.1,0,100);
  return rng(st.seed,key)<clamp(.38+skill/170-risk*.09+edge,.12,.96);
 }
 function swing(st,n){const before=st.meter;st.meter=clamp(st.meter+n,-50,50);return st.meter-before;}
 function crowdSays(st,delta,key){
  const band=delta>=9?'roar':delta>=3?'good':delta>-3?'flat':delta>-7?'cool':'dead';
  push(st,'crowd',st.reactionStyle?.v===1?liveReaction(st,LIVE_CROWD[band],'player|'+key):pick(CROWD[band],st.seed,'crowd|'+key),'reaction');
 }
 // The opponent answers. How well depends on how good a talker they are, and on whether your line landed.
 function theirTurn(st,line,key,landed,fit=0){
  const hit=rng(st.seed,'their|'+key)<clamp(.3+st.f.mic/170-(landed?.12+.05*Math.max(0,fit):0),.1,.9);
  const d=swing(st,hit?-(4+Math.round(st.f.mic/20)):3);
  if(line)push(st,'f',line,'opponent',d);
  push(st,'crowd',st.reactionStyle?.v===1?liveReaction(st,LIVE_OPP_CROWD[hit?'hit':'miss'],'opponent|'+key):fmt(pick(OPP_CROWD[hit?'hit':'miss'],st.seed,'opp|'+key),st),'reaction',line?0:d);
  return hit;
 }
 function riskOf(st,stage,id){return (Core.NODES[stage][id].risk||0)+(Core.variantFor(st.core,stage,id)?.fx?.risk||0);}
 function stakes(st,stage,id,shown){
  const node=Core.NODES[stage][id],v=Core.variantFor(st.core,stage,id),fx={...node.effect};
  const r=shown?.caseResponse?st.core.case.responses[id]:null;
  const extra=r?r.fx:shown?.evidence?{}:v?.fx;
  for(const k of ['crowd','heat','cred','trust'])if(extra?.[k])fx[k]=(fx[k]||0)+extra[k];
  const tags=[riskWord(riskOf(st,stage,id))];
  if(arcFit(st,stage,id)>0)tags.push('Fits programme direction');
  else if(arcFit(st,stage,id)<0)tags.push('Against chapter direction');
  if(shown?.evidence)tags.unshift('On the record');
  if(r){tags.push({conceded:'Concedes a point',defended:'Stands by it',reframed:'Changes the question',unresolved:'Escalates',withdrawn:'Drops it'}[r.res]||'Answers it');
   if(r.commit)tags.push(r.commit.node?'Leads to a promise':'A test the match can answer');if(r.expose)tags.push('Can be thrown back');}
  if(shown?.followsCase)tags.unshift('Follows from your words');
  const names={crowd:'Wins the crowd',heat:'Stokes the rivalry',cred:'Builds credibility'};
  const top=Object.entries(names).map(([k,label])=>[fx[k]||0,label]).sort((a,b)=>b[0]-a[0]).filter(x=>x[0]>=3).slice(0,stage==='close'?1:2);
  for(const [,label] of top)tags.push(label);
  if((fx.trust||0)<=-2)tags.push(st.promoterVoice.split(' ')[0]+' ▼');
  if((fx.trust||0)>=3)tags.push(st.promoterVoice.split(' ')[0]+' ▲');
  if(stage==='close'){
   const pr=node.promise;
   tags.push({win:'Promises a win',finisher:'Names the finisher',clean:'Promises a clean fight',counter:'Promises a counter',none:'Promises nothing'}[pr]||'A promise');
   if(pr==='win'&&st.finish?.startsWith('lose'))tags.push('You are booked to lose');
   if(pr==='finisher'&&st.finish!=='win_clean')tags.push('Unlikely as booked');
   if(pr==='clean'&&st.finish==='win_dirty')tags.push('You are booked to cheat');
   if((pr==='win'&&st.finish?.startsWith('win'))||(pr==='clean'&&['win_clean','lose_clean'].includes(st.finish)))tags.push('Safe bet, small reward');
   if(pr==='counter'||pr==='finisher')tags.push('Goes on the match strip');
  }
  return tags;
 }
 function choices(st){
  if(!st||st.stage==='done')return [];
  const r=ROUNDS[st.round].id;
  if(r==='push'&&st.core.case?.exposed){
   // {F} threw your own record back at you. Hold the line, change your position, or let it stand.
   const P=st.core.case.push||{};
   return [{id:'firm',label:P.firm?.label||'Stand firm',hint:P.firm?.hint||'Hold the line.',tags:['Risky','Stands by it','Big swing either way']},
    {id:'revise',label:P.revise?.label||'Revise your position',hint:P.revise?.hint||'Change what you are asking for.',tags:['Steady','Changes the question','Builds credibility']},
    {id:'leave',label:'Let it stand',hint:'Say nothing more. The argument stays open, and it will come back.',tags:['Safe','Leaves it unresolved']}];
  }
  if(r==='push'&&st.director)return Director.options(st.director).map(o=>({...o,...(Semantic?.option(st,r,o.id)||{})}));
  if(r==='push')return [{id:'leave',label:'Leave it there',hint:st.meter>0?'Quit while you are ahead.':'Cut your losses.',tags:['Safe','Shorter promo']},
   ...Object.entries(PUSH).map(([id,o])=>({id,label:fmt(o.label,st),hint:o.hint,tags:[riskWord(o.risk),o.gain>=9?'Big swing either way':'Small gain']}))];
  const stage=r==='open'?'open':r==='answer'?'answer':'close';
  const offered=Core.choices(stage,st.core);
  return (st.director?Director.angles(st.director,stage,offered,st.core):offered).map(o=>({id:o.id,label:o.label,hint:o.hint,tags:stakes(st,stage,o.id,o),evidence:o.evidence||null,caseResponse:!!o.caseResponse,followsCase:!!o.followsCase,...(Semantic?.option(st,stage,o.id)||{})}));
 }
 function fitOf(st,stage,id){return stage==='open'?openFit(st,id):stage==='answer'?answerFit(st,id):arcFit(st,'close',id);}
 function pickAuthored(st,ctx){
  if(!st.authoredDialogue||!ctx)return null;
  const seed=st.seed+'|'+st.steps.length+'|'+ctx.side,mem=st.authoredDialogue;
  // For new semantic scenes, never fall through to a style-only turn or generic press.
  if(st.semantic&&((ctx.stage==='answer'&&ctx.action==='turn')||(ctx.stage==='push'&&['press','acknowledge'].includes(ctx.action)))){
   const line=Semantic.select(st,ctx);
   // A settlement is generic already; an acknowledgement may use a reviewed
   // neutral line only when it would not displace a substantive topic answer.
   if(line&&mem.reviewedAck===1&&ctx.stage==='push'&&ctx.action==='acknowledge'&&
      (ctx.side==='f'||['unclassified','agreement','end'].includes(line.semantic.claim))){
    const own=Dialogue.selectAcknowledgement(catalogueFor(st),ctx,seed,mem);
    if(own){mem.used.push(own.id);return {...own,semantic:{...line.semantic,source:'authored-response:'+own.id}};}
   }
   if(line&&mem.reviewedContext===1){
    const own=Dialogue.selectSemanticResponse(catalogueFor(st),ctx,seed,mem,line.semantic);
    if(own){
     mem.used.push(own.id);
     // Press lead-ins preserve the complete topic-specific question. Keep
     // both IDs in the selection memory so the question also varies.
     const press=ctx.action==='press';
     if(press)(mem.composedUsed??=[]).push(line.id);
     return {...own,text:press?own.text+' '+line.text:own.text,semantic:{...line.semantic,source:'authored-response:'+own.id,...(press?{questionSource:line.id}:{})}};
    }
   }
   if(line&&[1,2,3].includes(mem.semanticBankReuse)){
    const own=Dialogue.selectReviewedBankResponse(catalogueFor(st),ctx,seed,mem,line.semantic,mem.semanticBankReuse);
    if(own){mem.used.push(own.id);return {id:own.id,text:own.text,semantic:{...line.semantic,source:'authored-response:'+own.id,bankReuse:own.bankReuse}};}
   }
   if(line)(mem.composedUsed??=[]).push(line.id);
   return line;
  }
  const correctedClosing=st.closingCommitmentStyle===1&&ctx.stage==='close'&&ctx.side==='w'&&['vow','clean'].includes(ctx.action);
  const selection=correctedClosing?Dialogue.selectClosing(catalogueFor(st),ctx,seed,mem):Dialogue.select(catalogueFor(st),ctx,seed,st.closingVariety===1?{...mem,candidateFilter:r=>Dialogue.closingCommitment(r,ctx)}:mem);
  if(selection){mem.used.push(selection.id);return selection;}
  if(mem.composition){const line=Dialogue.compose(ctx,seed,{used:mem.composedUsed||[],recent:mem.recent});if(line){(mem.composedUsed??=[]).push(line.id);return line;}}
  return null;
 }
 function annotate(st,index,ctx,line,source){
  const e=st.log[index];if(!ctx||!e)return;
  e.dialogueSlot=Dialogue.tag(ctx);
  if(line){if(line.composed)e.composedId=line.id;else e.authoredId=line.id;}
  if(st.semantic&&Semantic.allowed(st)){
   const tag=line?.semantic||(e.side==='f'?(line&&!line.composed?Semantic.fromBank(line.id,line.text):!line?(Semantic.classify(source?.speechSource,source?.speechDetail,st.semantic.claimClassification===1)||reviewedFallbackClaim(st,ctx,e,source)):null):null);
   if(tag)e.semantic=tag;
  }
 }
 // G3A: ordinary format questions can be answered by the argument itself.
 // Reviewed literal graph variants only; programme/record prompts, authored
 // bank wording, mouthpieces and evidence keep their explicit bridge.
 const DIRECT_OPENINGS={
  callout:new Set(['pr_tech','pr_brawl','pr_risk','pr_stall','pr_veteran','pr_study','sw_jacket','sw_future','sw_ignore','sw_belt','sw_pose','sw_money']),
  faceoff:new Set(['pr_tech','pr_brawl','pr_risk','pr_stall','sw_jacket','sw_future','sw_ignore','sw_belt','sw_pose','sw_money']),
  address:new Set(['p_hometown','p_working','p_chant','p_short','p_show'])
 };
 function naturalFormatOpening(st){
  return st.openingFlow===1&&st.openingQuestion?.kind==='format'&&!st.arc&&Semantic?.allowed(st);
 }
 function directOpening(st,step,d,line){
  const q=st.openingQuestion;
  return naturalFormatOpening(st)&&!line&&!d.case&&DIRECT_OPENINGS[q.format]?.has(step.variant)===true;
 }
 function openingCue(st){
  // The same coaching cue is available in view(). Don't also narrate it
  // as though somebody said it aloud in an ordinary live conversation.
  if(!naturalFormatOpening(st))push(st,'stage',spokenCue(st),'cue');
 }
 function spokenCue(st){
  if(st.semantic&&Semantic.allowed(st)){
   const point=Semantic.label(Semantic.latest(st.log,'f')?.entry.semantic?.claim);
   return point?'Their point concerns '+point+'.':st.f.short+' has replied.';
  }
  return fmt(ANGLE_CUE[st.angle],st);
 }
 // These two literal graph exceptions have no reviewed speech fingerprint.
 // Vary only their delivery, not the selected action, facts or evidence.
 const accusationReplies=[
  "What exactly are you accusing me of, {W}?",
  "Give us an example. An actual example, not another insult.",
  "You have made a charge. Where is the evidence?",
  "Tell these people what I am supposed to have done.",
  "What are you basing that on?",
  "Do not ask them to take your word for it. Give them something concrete.",
  "If you have a specific complaint, let us hear it.",
  "A claim like that needs more than a microphone.",
  "You have got their attention. Now substantiate what you just said.",
  "What incident are you talking about?",
  "Before you go any further, explain what I am meant to have done.",
  "There is a difference between disliking me and having a case against me."
 ];
 const personalReplies=[
  "That is another insult, {W}. It is not evidence.",
  "You have made it personal. You still have not backed it up.",
  "Saying it more forcefully does not make it any better supported.",
  "You are attacking me, not answering the question.",
  "I am still waiting for something more substantial than that.",
  "More of the same. Where is the example?",
  "I heard the insult. I have yet to hear the evidence.",
  "You have not given these people a reason to believe the charge.",
  "Leave the personal remarks aside until you have something to substantiate them.",
  "You can question me all you like. That does not establish a fact.",
  "There is plenty of anger in that reply. Not much to verify.",
  "You have not answered my objection, {W}. You have just made it personal."
 ];
 // Reviewed opponent closing variants. Each pool preserves the actual
 // graph angle and contains no additional match promise or historical fact.
 const closingReplies=Object.freeze({
 "vo_guarantee": [
  "That is quite a guarantee. Let's see you honour it.",
  "You've put your word on the line now.",
  "Everybody heard that prediction."
 ],
 "vo_fans": [
  "Don't give them a result you haven't earned.",
  "You can dedicate the win when you've actually got it.",
  "They've paid for a match, not a guarantee."
 ],
 "vo_plain": [
  "We'll find out shortly.",
  "That's your prediction. I disagree.",
  "All right. Try."
 ],
 "vo_hard": [
  "You have understood one thing: it won't be easy.",
  "At least we agree that it'll be a contest.",
  "Hard work doesn't guarantee you the result."
 ],
 "vo_quick": [
  "Don't start counting the minutes just yet.",
  "You might want to allow a little longer.",
  "You still have to get the fall."
 ],
 "fi_count": [
  "You're counting moves you haven't hit yet.",
  "Try getting to the first one.",
  "Let's see how far you get with that countdown."
 ],
 "fi_intro": [
  "I'll be watching for the set-up.",
  "Naming it hasn't made it any easier to land.",
  "You have to put me in position for it first."
 ],
 "fi_air": [
  "First you've got to get hold of me.",
  "I'll choose when I leave the ropes.",
  "Try judging the landing while I'm moving."
 ],
 "fi_no_counter": [
  "Every move has an opening somewhere.",
  "I'll be looking for a way out of the set-up.",
  "There's no such thing as an unavoidable hold."
 ],
 "fi_outlast": [
  "You're going to have to work to tire me out.",
  "Don't rely on me running out of energy.",
  "Let's see who has anything left for the finish."
 ],
 "fi_count_along": [
  "They can call it. You've still got to hit it.",
  "Listen for them if you miss.",
  "The crowd can't put me in position for you."
 ],
 "fi_name": [
  "We'll see if you can land it.",
  "Try getting me into it.",
  "I'll be watching for it."
 ],
 "cl_hand": [
  "I'll decide about that handshake for myself.",
  "We'll see about the hand when we're in there.",
  "I'm not taking your hand just because you ask."
 ],
 "cl_ref": [
  "The referee can watch both of us.",
  "Mind your own work. The official can mind mine.",
  "You concentrate on wrestling."
 ],
 "cl_watch": [
  "They can watch every exchange for all I care.",
  "Keep your eyes on me, then.",
  "Let the people judge what they see."
 ],
 "cl_middle": [
  "One clean fall. All right.",
  "That's a contest I can agree to.",
  "Fine. Let's wrestle it that way."
 ],
 "cl_dare": [
  "I don't need a shortcut to beat you.",
  "You might find I don't have to.",
  "I'll find my own way to a fall."
 ],
 "un_plan": [
  "Then I'll have to work it out in the ring.",
  "I won't assume I know what's coming.",
  "I'll have a plan of my own."
 ],
 "un_done": [
  "All right. Enough said.",
  "Then we're finished here.",
  "Fine. Put the microphone down."
 ],
 "un_see": [
  "They'll see the result for themselves.",
  "They'll have to watch the match to find out.",
  "Let's see what they make of the wrestling."
 ],
 "un_tape": [
  "You still have habits to give away.",
  "I'll read what happens in front of me.",
  "I'll adjust when you do something different."
 ],
 "un_ready": [
  "Being ready is only the beginning.",
  "You'll have to deal with me when I close the distance.",
  "Let's see how you respond to the first charge."
 ],
 "un_look": [
  "I'll be watching the whole ring.",
  "I'll decide where to look.",
  "I'll keep you in sight."
 ],
 "un_bigger": [
  "Get through this match first.",
  "You're looking further ahead than I'd advise.",
  "There's a contest in front of you yet."
 ],
 "qu_strikes": [
  "You've still got to read the strike.",
  "Try timing it when I'm moving.",
  "I'll vary when I throw it."
 ],
 "qu_holds": [
  "First you've got to find the escape.",
  "I'll make you work for the reversal.",
  "Let's see what you do once the hold is on."
 ],
 "qu_air": [
  "I'll decide when to take off.",
  "You have to read the timing first.",
  "Let's see whether you're in the right position."
 ],
 "qu_tricks": [
  "You'll have to recognise the opening first.",
  "You won't get much warning.",
  "Try reading what I do rather than what I say."
 ],
 "qu_watch": [
  "They'll see whether you can stop it.",
  "You'll have to earn that counter.",
  "I'll make you work for that moment."
 ],
 "qu_simple": [
  "Try it when the bell goes.",
  "Let's see if your timing holds.",
  "All right. Find that counter."
 ],
 "le_plain": [
  "Then give it everything. I'll do the same.",
  "Effort is one thing. The contest is still there to win.",
  "I'll judge the work when we wrestle."
 ],
 "gr_plain": [
  "All right. The wrestling is next.",
  "They've heard you. Now show them.",
  "We'll see what they make of the match."
 ]
});
 // G4B.1: the graph sometimes speaks a contextual sentence instead of
 // a variant reply. Review the complete original and the actual emitted
 // wording, not the opening angle, style estimate, or a keyword.
 const fallbackClaimSources=Object.freeze({
 "accusation": [
  "You have never even worked a match with me, {W}. Name one thing I have done to deserve that accusation.",
  "evidence"
 ],
 "proof": [
  "You are claiming you have me worked out before we have ever faced each other. How will you stop my {STRENGTH}?",
  "strength"
 ],
 "people": [
  "These people will still be here after the match, {W}. Can you give them a reason to remember the result, not just your speech?",
  "effort"
 ],
 "hometown": [
  "Insult the town all you like, {W}. They paid to watch somebody shut you up, and that somebody is me.",
  "home"
 ],
 "numbers": [
  "Your maths is wrong, {W}. My {STRENGTH} do not care about percentages.",
  "strength"
 ],
 "imagery": [
  "That is an interesting picture, {W}. My {STRENGTH} will be real when the bell rings. Where is your answer?",
  "strength"
 ],
 "swagger": [
  "You want all of the attention, {W}. The difficult part is doing something worth watching when I start using my {STRENGTH}.",
  "strength"
 ]
});
 const personalClaimSource='You still have no evidence, {W}. Now you are trying to make the insult louder.';
 function reviewedFallbackClaim(st,ctx,e,d){
  if(st.semantic?.claimClassification!==1||!Semantic.allowed(st)||!ctx||ctx.side!=='f'||ctx.hasMouthpiece||!d||d.case||d.speechSource||e.side!=='f'||e.authoredId||e.composedId)return null;
  const detail=st.core.claim?.strength;
  const render=template=>fmt(template,st).replace(/\{STRENGTH\}/g,detail||'');
  const review=ctx.stage==='open'&&Object.prototype.hasOwnProperty.call(fallbackClaimSources,ctx.action)?fallbackClaimSources[ctx.action]:ctx.stage==='answer'&&ctx.action==='personal'?[personalClaimSource,'evidence']:null;
  if(!review)return null;
  const [original,claim]=review;
  if(d.line!==render(original)||claim==='strength'&&(!detail||!e.line.includes(detail)))return null;
  // Compare with the literal original or the exact selected existing
  // fallback alternative. Never allow arbitrary rewritten text.
  let template=original;
  if(e.line!==render(original)){
   const pool=ctx.stage==='open'&&ctx.action==='accusation'?accusationReplies:ctx.stage==='answer'&&ctx.action==='personal'?personalReplies:null;
   if(!pool||st.fallbackVariety!==1)return null;
   template=pick(pool,st.seed,'graph-fallback|'+ctx.stage+'|'+ctx.action);
   if(e.line!==render(template))return null;
  }
  return {v:1,kind:'claim',claim,source:Semantic.source('fallback-'+ctx.stage+'-'+ctx.action,template).replace(/^graph:/,'fallback:'),...(claim==='strength'?{detail}:{})};
 }
 function graphFallback(st,stage,id,d){
  if(stage==='close'){
   if(st.closingVariety!==1||st.speaker||st.core.case||st.core.claim?.hasEvidence||d.case||d.speechSource)return d.line;
   const variant=st.core.steps.at(-1)?.variant,pool=Object.prototype.hasOwnProperty.call(closingReplies,variant)?closingReplies[variant]:null;
   if(pool)return fmt(pick(pool,st.seed,'closing-reply|'+variant),st);
   return d.line;
  }
  if(st.fallbackVariety!==1||st.speaker||st.core.case||st.core.claim?.hasEvidence||d.case||d.speechSource)return d.line;
  const w=st.w.short;
  const pool=stage==='open'&&id==='accusation'&&d.line==='You have never even worked a match with me, '+w+'. Name one thing I have done to deserve that accusation.'?accusationReplies:
    stage==='answer'&&id==='personal'&&d.line==='You still have no evidence, '+w+'. Now you are trying to make the insult louder.'?personalReplies:null;
  if(!pool)return d.line;
  return fmt(pick(pool,st.seed,'graph-fallback|'+stage+'|'+id),st);
 }
 // G2: reviewed core-graph wording, only when the literal original
 // and chosen variant match. Preserve authored/semantic lines and every
 // recorded argument, promise and graph event. Voice pools are fallback
 // coverage; named character lines take priority when fresh.
 const CORE_VOICE={
 "ca_long": {
  "stage": "answer",
  "action": "calm",
  "original": "I have been doing this a long time, {F}. Matches are won in the last minute, not the first.",
  "voices": {
   "grand": [
    "I've been doing this for years, {F}. The opening act is not the finale.",
    "A veteran knows when to save the grand gesture. I will still be wrestling at the end."
   ],
   "gruff": [
    "Long time in this game. Save your breath for the last minute, {F}.",
    "Years of this, {F}. It is the last bit of the match that counts."
   ],
   "eager": [
    "I've been at this years! The first minute's exciting, {F}, but we've got to get to the last one.",
    "I've learned that the hard way: don't spend it all in the first minute."
   ],
   "stoic": [
    "I've done this long enough, {F}. The first minute settles nothing.",
    "I've been around a while. It's the last minute I work for."
   ],
   "precise": [
    "Experience teaches you to reserve something for the closing exchange, {F}.",
    "I've spent years learning this: the first minute is preparation, not the result."
   ],
   "earnest": [
    "I've been wrestling a long time, {F}. I know how much work there is after the first minute.",
    "Years in the ring have taught me not to mistake a good start for a win."
   ],
   "sermon": [
    "Years in this ring have taught me patience, {F}. The contest is settled at the end.",
    "I've learned over the years that you must have something left when the final minute arrives."
   ],
   "slippery": [
    "I've done enough of these to know the opening minute isn't the one that pays off, {F}.",
    "I've been around long enough to save the best of it for the finish."
   ]
  },
  "individual": {
   "mara": "I've argued enough cases in that ring, {F}, to know the opening submission isn't the verdict. Save something for the last minute.",
   "rex": "Years of hard graft, {F}. You don't knock off after the first minute.",
   "juno": "I've been at this a long time. The first entry is only the first entry, {F}. The finish is what matters.",
   "kit": "Years on shift, mate. It isn't the first minute that gets you through; it's the last.",
   "ezra": "Experience has taught me that the opening exchange is not the conclusion, {F}. Reserve your effort for the decisive fall.",
   "silas": "After years of this, I can tell you the first minute is only the first variable. The decisive one is at the end.",
   "tori": "Years of wrestling have taught me to conserve energy. You still need some in the last minute, {F}.",
   "faye": "I've done this for years, {F}. Don't quote the first minute as the result. Wait for the last."
  }
 },
 "ca_smile": {
  "stage": "answer",
  "action": "calm",
  "original": "Go ahead and have the last word, {F}. I will have the last count.",
  "voices": {
   "grand": [
    "Keep the microphone, {F}. I'll take the applause after the three-count.",
    "Take your final bow on the microphone. I'll take the final count."
   ],
   "gruff": [
    "Talk all you like, {F}. I'll take the three.",
    "Have your say. I'm getting the count."
   ],
   "eager": [
    "Go on, finish your speech! I'll be the one celebrating the count.",
    "Your last word, my last three-count. Sounds good, {F}."
   ],
   "stoic": [
    "You can finish talking. I'll finish the match.",
    "Last word's yours, {F}. The count will be mine."
   ],
   "precise": [
    "You can conclude the argument, {F}. I intend to secure the deciding fall.",
    "Have the final statement. The only count I want is the deciding one."
   ],
   "earnest": [
    "I'll let you finish what you're saying, {F}. I intend to earn that last count.",
    "You can have this exchange. I want the referee's count at the end."
   ],
   "sermon": [
    "Say your final word, {F}. Let my answer be the deciding count.",
    "Keep the words. I intend to have the last three."
   ],
   "slippery": [
    "You take the microphone, I'll take the pin. Fair exchange, {F}.",
    "I'll leave you the last word for free. I'm claiming the last count."
   ]
  },
  "individual": {
   "mara": "Counsel may have the last word, {F}. I'll take the verdict at the count.",
   "ace": "Have the microphone, darling. I'll take the spotlight at three.",
   "aisha": "Talk. I'm taking the count, {F}.",
   "dean": "Have your final statement, {F}. I'll take the deciding three in the right column.",
   "roxy": "Do enjoy your closing monologue, darling. I'll be taking the final count.",
   "faye": "I'll let that be your final quote, {F}. My answer will be the last count."
  }
 },
 "ch_hand": {
  "stage": "answer",
  "action": "challenge",
  "original": "Shake my hand, {F}, and then try to beat me.",
  "voices": {
   "grand": [
    "A handshake, {F}. Then let's see which of us deserves the curtain call.",
    "Before the spectacle begins, shake my hand. Then try to win."
   ],
   "gruff": [
    "Hand first, {F}. Then try and beat me.",
    "Shake. Then wrestle me for the win."
   ],
   "eager": [
    "Come on, shake my hand! Then let's see if you can beat me, {F}.",
    "Hand out. Let's start properly, and then you can try to win."
   ],
   "stoic": [
    "Shake my hand. After that, try to beat me.",
    "A handshake, {F}. Then we wrestle for the fall."
   ],
   "precise": [
    "Shake my hand, {F}. Then demonstrate that you can beat me.",
    "A sporting handshake first. Then establish your superiority on the mat."
   ],
   "earnest": [
    "I'd like to shake your hand, {F}. Then give me your best shot at beating me.",
    "Let's shake on it. I want you to try your hardest to win."
   ],
   "sermon": [
    "Give me your hand before we contend, {F}. Then try to defeat me.",
    "Shake hands first. After that, let the contest decide."
   ],
   "slippery": [
    "Shake my hand, {F}. Then you've got the whole match to prove me wrong.",
    "Hand first. Then see whether you can actually beat me."
   ]
  },
  "individual": {
   "mara": "Shake my hand, {F}. Then submit your evidence that you can beat me on the canvas.",
   "brick": "Hand. Then show me you can beat me, {F}.",
   "juno": "Shake first, {F}. Then try to earn the grips and the fall.",
   "dee": "Can we shake hands first? Then I want to see you try to beat me.",
   "imani": "Shake my hand, {F}. Then we both do the work, and you can try to win.",
   "ezra": "A handshake before the examination, {F}. Then demonstrate that you can defeat me."
  }
 },
 "ch_now": {
  "stage": "answer",
  "action": "challenge",
  "original": "Why wait for the bell, {F}? I am right here.",
  "voices": {
   "grand": [
    "Why delay the main attraction, {F}? I'm standing right in front of you.",
    "The curtain's already up, {F}. Why wait for the bell?"
   ],
   "gruff": [
    "Bell? I'm here now, {F}.",
    "No need to wait. Come on, then."
   ],
   "eager": [
    "I'm right here! Why are we waiting for a bell, {F}?",
    "Come on, let's get to it now. I'm ready."
   ],
   "stoic": [
    "I'm here, {F}. Why wait?",
    "We're both here. We don't need to wait for the bell."
   ],
   "precise": [
    "There is no need to defer this, {F}. We are both here.",
    "Why postpone the confrontation until the bell? I'm ready now."
   ],
   "earnest": [
    "I'm standing right here, {F}. Why do we need to wait any longer?",
    "I don't see the point in waiting. Let's get to it now."
   ],
   "sermon": [
    "Why delay what is before us, {F}? I'm here now.",
    "The bell is still to come, but I stand ready before you."
   ],
   "slippery": [
    "Why hang about until the bell, {F}? You've already found me.",
    "No need to book another minute of this. I'm right here."
   ]
  },
  "individual": {
   "rex": "Don't stand there waiting to clock on. I'm here now, {F}.",
   "aisha": "I'm here. Now, {F}.",
   "zara": "I'm right here, mate! Why are we waiting?",
   "tori": "We're in the same place at the same time, {F}. Why wait for the bell?",
   "rocco": "Bell? Come on. I'm here.",
   "ash": "I'm here. No need to wait."
  }
 },
 "vo_end": {
  "stage": "close",
  "action": "vow",
  "original": "When this is over, {F}, this feud is over too, and I will be the one standing.",
  "voices": {
   "grand": [
    "This is the last act of our feud, {F}. I'll be the one standing when the curtain falls.",
    "Tonight I bring this rivalry to its finale. I'll win, and it ends there."
   ],
   "gruff": [
    "It ends tonight, {F}. I win. No more of this.",
    "Last one, {F}. I'm winning it and putting this feud to bed."
   ],
   "eager": [
    "Tonight's the end of all this, {F}! I'm going to win it, and then we're done.",
    "I want this rivalry finished tonight. I'm going to be the one who wins."
   ],
   "stoic": [
    "This finishes tonight. I'll win, {F}, and that will be the end of it.",
    "One more match, {F}. I take the win. The feud ends."
   ],
   "precise": [
    "Tonight I intend to settle this rivalry conclusively, {F}. I will win.",
    "The outcome I intend is a victory and an end to this feud."
   ],
   "earnest": [
    "I want this feud behind us, {F}. Tonight I will win and put it to rest.",
    "Tonight I will earn the win, and I want that to be the end of our rivalry."
   ],
   "sermon": [
    "Let this be the final chapter of our feud, {F}. I will be victorious.",
    "Tonight the feud ends. I will take the victory and leave it there."
   ],
   "slippery": [
    "I'm closing the book on this feud tonight, {F}. With a win.",
    "Last business between us, {F}. I'll take the win and call it finished."
   ]
  },
  "individual": {
   "mara": "Final submission, {F}: tonight I win, and I close this case for good.",
   "ace": "One last scene, {F}. I win tonight, and that's the end of our story.",
   "dean": "One final entry in the record, {F}: a win for me and the end of this feud.",
   "tori": "Tonight we bring this to a stop, {F}. I'll win and end the rivalry.",
   "aisha": "Tonight I win. Then we're done, {F}.",
   "faye": "Let the record show it: tonight I win and this feud ends."
  }
 },
 "sw_ignore": {
  "stage": "open",
  "action": "swagger",
  "original": "Sorry, who am I wrestling tonight? Oh. {F}. Right.",
  "voices": {
   "grand": [
    "Who's been cast opposite me tonight? Ah, {F}. How ordinary.",
    "I was looking at the headline. Apparently {F} is on the other side of it."
   ],
   "gruff": [
    "Who's it again? {F}. Fine.",
    "Oh. {F}. That's the opponent, then."
   ],
   "eager": [
    "Wait, who's my match with? Oh, {F}! Right, of course.",
    "I nearly forgot who was on the other side of this. {F}, isn't it?"
   ],
   "stoic": [
    "It's {F} tonight, is it? Right.",
    "Oh, {F}. I'd almost forgotten."
   ],
   "precise": [
    "I had rather overlooked the name opposite mine. {F}, apparently.",
    "The opponent's name had slipped my mind. {F}. Of course."
   ],
   "earnest": [
    "Oh, it's you, {F}. I was thinking more about the match than the name.",
    "Sorry, {F}. I hadn't given the name much thought."
   ],
   "sermon": [
    "Who stands opposite me tonight? Ah, {F}. So it is.",
    "The name had escaped me. {F}. Very well."
   ],
   "slippery": [
    "Who have they put across from me? {F}? Lovely.",
    "I'd almost forgotten the name on the other side of the card. {F}. Right."
   ]
  },
  "individual": {
   "mara": "The opposing party's name? Oh, {F}. Of course.",
   "ace": "Who did they cast opposite me? Oh, {F}. Right.",
   "roxy": "Darling, remind me who's on the other side of the programme. {F}? How nice.",
   "dean": "The other name on the sheet? {F}. Yes, that's it.",
   "faye": "I haven't got the name in my notes. {F}, is it?",
   "kit": "Who am I on with again? {F}. All right, mate."
  }
 },
 "ch_one_fall": {
  "stage": "answer",
  "action": "challenge",
  "original": "One fall, {F}. Nobody else involved. Just you and me.",
  "voices": {
   "grand": [
    "One fall, {F}. No supporting cast. Just the two of us.",
    "No extras for this performance. One fall, you and me."
   ],
   "gruff": [
    "One fall. Just us. Nobody else.",
    "You, me, one fall. That's it."
   ],
   "eager": [
    "One fall, just the two of us! Nobody else gets involved.",
    "Come on, {F}. One fall. No one else, just us."
   ],
   "stoic": [
    "One fall between us, {F}. No interference.",
    "No one else. One fall. Just us."
   ],
   "precise": [
    "The terms are simple: one fall, {F}, with neither of us involving anyone else.",
    "One fall, no outside involvement. Just the two competitors."
   ],
   "earnest": [
    "One fall, {F}. Let's do it between us, without anybody else getting involved.",
    "I want it to be just you and me. One fall, no one else."
   ],
   "sermon": [
    "Let it be one fall between us alone, {F}.",
    "One fall. No one else shall have a part in it."
   ],
   "slippery": [
    "Let's keep the terms simple, {F}. One fall, no third parties.",
    "One fall, no outside assistance. You and me, nothing else."
   ]
  },
  "individual": {
   "ezra": "One fall, {F}. No third participant. Those are the terms of the examination.",
   "silas": "One fall, {F}. Eliminate outside interference. Just our techniques.",
   "mara": "One fall, {F}. Two parties to the dispute. Nobody else.",
   "dean": "One fall between us, {F}. No outside variables.",
   "brick": "One fall. No mates. Just us.",
   "imani": "Just our work in there, {F}. One fall, nobody else."
  }
 },
 "pe_grudge": {
  "stage": "answer",
  "action": "personal",
  "original": "This stopped being about wrestling a long time ago, {F}.",
  "voices": {
   "grand": [
    "The wrestling stopped being the whole story long ago, {F}.",
    "This rivalry left sporting competition behind a long time ago."
   ],
   "gruff": [
    "This ain't just wrestling anymore, {F}. Hasn't been for ages.",
    "It's personal, {F}. Has been a while."
   ],
   "eager": [
    "This isn't just a wrestling match to me anymore, {F}. It hasn't been for a long time.",
    "We've been past the wrestling part of this for ages, {F}."
   ],
   "stoic": [
    "This has been personal for a long time, {F}.",
    "Stopped being just wrestling long ago."
   ],
   "precise": [
    "This dispute ceased to be purely sporting a long time ago, {F}.",
    "For some time, this has been a personal dispute rather than merely a contest."
   ],
   "earnest": [
    "I wish this were just about wrestling, {F}. It hasn't been for a long time.",
    "It became personal a long time ago. You know that, {F}."
   ],
   "sermon": [
    "This has gone beyond a contest of skill, {F}. It has for some time.",
    "The sporting dispute became a personal one long ago."
   ],
   "slippery": [
    "Let's not pretend this is just another match, {F}. It hasn't been for ages.",
    "We're long past the point where this was only about wrestling."
   ]
  },
  "individual": {
   "mara": "This stopped being a sporting case a long time ago, {F}. It's personal now.",
   "faye": "We've been past the sporting question for a long time, {F}.",
   "aisha": "This has been personal a long time, {F}. Not just wrestling.",
   "dean": "This stopped being a matter of results a long time ago, {F}.",
   "anya": "This went beyond the wrestling long ago, {F}. It's personal.",
   "rocco": "It's personal. Has been for ages, {F}."
  }
 }
};
 // G2D: separate snapshot marker so existing in-progress promos retain their wording.
 // The evidence-sensitive pe_respect accusation is deliberately excluded.
 // Each counter variant explicitly promises the same observable counter.
 const CORE_VOICE_EXTENSION={
  "ch_trade": {
    "stage": "answer",
    "action": "challenge",
    "original": "No holds, no tricks. Stand in the middle and trade with me, {F}.",
    "individual": {
      "mara": "Terms of the contest, {F}: no holds, no tricks. Stand in the middle and trade blows with me.",
      "rex": "Middle of the ring, {F}. No holds, no mucking about. Trade with me.",
      "juno": "No holds this time, {F}. Just stand in the middle and trade strikes. No tricks.",
      "kit": "Come on, mate. Middle of the ring, no holds, no tricks. Let's trade.",
      "ezra": "Set aside the holds and trickery, {F}. Meet me in the centre and trade strikes.",
      "red": "Stand in the middle, {F}. No holds. No tricks. Trade with me.",
      "roxy": "Centre stage, darling. No holds or clever tricks, just the two of us trading blows.",
      "silas": "Remove holds and deception from the equation, {F}. Trade strikes with me in the centre.",
      "nova": "Let's make this a direct test, {F}. No holds, no tricks. Trade strikes in the centre.",
      "ace": "Centre of the ring, {F}! No holds, no tricks. Let's trade blows under the lights.",
      "faye": "Clear terms, {F}: no holds or tricks. Meet me in the centre and trade strikes.",
      "tori": "Forget the clever variables, {F}. No holds or tricks. Just trade strikes with me in the centre."
    },
    "voices": {
      "grand": [
        "Centre stage, {F}. No holds or tricks, just an exchange of blows.",
        "Let's have a direct contest in the middle, {F}: trade strikes, without holds or tricks."
      ],
      "gruff": [
        "No holds, no tricks, {F}. Trade blows in the middle.",
        "Come to the middle and trade with me. Leave the holds and tricks out of it."
      ],
      "eager": [
        "Come on, {F}! No holds or tricks. Let's trade blows right in the middle.",
        "Meet me in the centre, {F}. Just strikes, no holds and no messing about!"
      ],
      "stoic": [
        "Centre of the ring. No holds or tricks. Trade strikes with me, {F}.",
        "We stand in the middle and trade, {F}. Nothing clever, no holds."
      ],
      "precise": [
        "Meet me in the centre, {F}. A direct exchange of strikes without holds or deception.",
        "The test is simple: trade strikes in the centre, with neither holds nor tricks."
      ],
      "earnest": [
        "Let's stand in the middle and trade blows, {F}. No holds, no tricks.",
        "I want a direct test between us, {F}: strikes in the centre, no holds or tricks."
      ],
      "sermon": [
        "Let us meet in the centre, {F}, and trade blows without holds or deceit.",
        "No holds or tricks between us, {F}. Come to the middle and trade strikes."
      ],
      "slippery": [
        "Here's the arrangement, {F}: no holds, no tricks, trade blows in the middle.",
        "Let's keep it simple. Centre of the ring, trade strikes, no holds or funny business."
      ]
    }
  },
  "qu_strikes": {
    "stage": "close",
    "action": "question",
    "original": "Throw your best punch, {F}. I will catch it and turn it around.",
    "individual": {
      "mara": "Put your best punch before me, {F}. I'll counter it; that's my answer.",
      "rex": "Best punch you've got, {F}. I'll counter it.",
      "juno": "Throw your best punch, {F}. I'll catch it and counter.",
      "kit": "Give me your best punch, mate. I'll counter it; watch.",
      "ezra": "Your best punch is the test, {F}. I will counter it.",
      "red": "Throw your best, {F}. I'll counter that punch.",
      "roxy": "Let's see your best punch, darling. I shall counter it.",
      "silas": "Use your strongest punch, {F}. I will counter it.",
      "nova": "Give me your best punch, {F}. I will counter it, not simply evade it.",
      "ace": "Your best punch, {F}! I'll counter it and make that the moment they remember.",
      "faye": "Your best punch, {F}. I will counter it. That is the commitment.",
      "tori": "Send your best punch my way, {F}. I'll counter it and change the direction."
    },
    "voices": {
      "grand": [
        "Deliver your best punch, {F}. I will counter it in front of this audience.",
        "Your strongest punch is welcome, {F}. I'll counter it."
      ],
      "gruff": [
        "Best punch, {F}. I'll counter it.",
        "Throw your best punch. I'll counter you, {F}."
      ],
      "eager": [
        "Go on, {F}, throw your best punch! I'll counter it.",
        "Give me the best punch you've got. I'm going to counter it!"
      ],
      "stoic": [
        "Throw your best punch, {F}. I'll counter it.",
        "Your best punch. My counter. That's what I promise."
      ],
      "precise": [
        "Use your strongest punch, {F}. I will counter it.",
        "I intend to counter your best punch, {F}. That is the test."
      ],
      "earnest": [
        "Give me your best punch, {F}. I'll counter it.",
        "I want you to throw your best punch. I will counter it."
      ],
      "sermon": [
        "Bring your best punch, {F}. I will counter it.",
        "Let your best punch be the test. I will meet it with a counter."
      ],
      "slippery": [
        "Throw the best punch you've got, {F}. I'll counter it.",
        "You bring your best punch; I'll supply the counter, {F}."
      ]
    }
  },
  "qu_studied": {
    "stage": "close",
    "action": "question",
    "original": "I know your offence by heart now, {F}. Every move has a counter.",
    "individual": {
      "mara": "I know your offence well by now, {F}. I will counter it; that is my final submission.",
      "rex": "I know how you attack now, {F}. I'll counter you.",
      "juno": "I've learned your offence, {F}. I'll counter it when you try it.",
      "kit": "I know your moves now, mate. Watch me counter them.",
      "ezra": "Your offensive technique is familiar to me, {F}. I will counter it.",
      "red": "I know your offence now, {F}. I'll counter it.",
      "roxy": "I know your routine by heart now, darling. I will counter your offence.",
      "silas": "I recognise your attacking patterns now, {F}. I will counter your offence.",
      "nova": "Your offence is familiar to me now, {F}. I will counter it in the ring.",
      "ace": "I know your whole attacking routine now, {F}. I'll counter it when the spotlight's on us.",
      "faye": "Your offence is familiar by now, {F}. My commitment is to counter it.",
      "tori": "I know the pattern of your attacks now, {F}. I'll counter your offence."
    },
    "voices": {
      "grand": [
        "I know your offence well now, {F}. I'll counter it when the curtain rises.",
        "Your attacking routine is familiar to me now. I'll counter it, {F}."
      ],
      "gruff": [
        "Know your attacks now, {F}. I'll counter you.",
        "I've got your offence worked out. I'll counter it."
      ],
      "eager": [
        "I know your attacks now, {F}! Watch me counter them.",
        "Your offence is familiar now. I'm going to counter it!"
      ],
      "stoic": [
        "I know your offence by now. I'll counter it, {F}.",
        "I've learned your attacks. I will counter them."
      ],
      "precise": [
        "I recognise your offence now, {F}. I will counter it.",
        "Your offensive patterns are familiar. I intend to counter them."
      ],
      "earnest": [
        "I know your offence better now, {F}. I will counter it.",
        "I've learned how you attack. I'll counter your offence tonight."
      ],
      "sermon": [
        "Your offence is familiar by now, {F}. I will counter it.",
        "I know the attacks you bring, {F}. Let my answer be a counter."
      ],
      "slippery": [
        "I know how your offence works now, {F}. I'll counter it.",
        "I've learned your attacks by now. I'll counter them, {F}."
      ]
    }
  },
  "pe_reputation": {
    "stage": "answer",
    "action": "personal",
    "original": "I do not know you, {F}, but I know your reputation. It is not a good one.",
    "individual": {
      "mara": "We haven't met in the ring, {F}. Your reputation precedes you, and it hardly recommends you.",
      "rex": "Don't know you personally, {F}. Your reputation isn't good.",
      "juno": "I don't know you yet, {F}. I've heard of you, though. Nothing good.",
      "kit": "Don't know you, mate. What I've heard of your reputation isn't exactly flattering.",
      "ezra": "I have no personal knowledge of you, {F}. Your reputation is not encouraging.",
      "red": "I don't know you, {F}. Your reputation's poor.",
      "roxy": "I haven't had the pleasure, darling. Your reputation isn't much of an introduction.",
      "silas": "I don't know you personally, {F}. Your reputation gives me little reason to be impressed.",
      "nova": "I haven't met you, {F}. Your reputation is unfavourable.",
      "ace": "Never met you, {F}, but that reputation of yours isn't much of a billing.",
      "faye": "I don't know you personally, {F}. Your reputation is not favourable.",
      "tori": "I haven't met you, {F}. Your reputation isn't exactly a positive signal."
    },
    "voices": {
      "grand": [
        "I haven't met you, {F}, but your reputation is hardly a ringing endorsement.",
        "We've not met, {F}. Your reputation arrives ahead of you, and it isn't flattering."
      ],
      "gruff": [
        "Don't know you, {F}. Know your reputation. Not good.",
        "Never met you, {F}. Your reputation isn't much."
      ],
      "eager": [
        "I don't know you yet, {F}, but your reputation isn't good!",
        "We haven't met, {F}. I've heard of you, though, and it doesn't sound good."
      ],
      "stoic": [
        "I don't know you personally. Your reputation is poor, {F}.",
        "I've not met you, {F}. Your reputation isn't favourable."
      ],
      "precise": [
        "I have no personal knowledge of you, {F}, but your reputation is unfavourable.",
        "We have not met, {F}. The reputation that precedes you is a poor one."
      ],
      "earnest": [
        "I don't know you, {F}. I can't say your reputation gives me a good impression.",
        "We've not met before, {F}. Your reputation concerns me."
      ],
      "sermon": [
        "I do not know you, {F}, but your reputation does not speak well of you.",
        "We have not met, {F}. Your reputation is hardly a good introduction."
      ],
      "slippery": [
        "We haven't met, {F}. Your reputation isn't doing you any favours.",
        "I don't know you personally, {F}. Your reputation isn't exactly a selling point."
      ]
    }
  }
};
 function coreVoice(st,stage,id,d,step){
  if(st.coreVoiceStyle?.v!==1||st.speaker||st.core.case||st.core.claim?.hasEvidence||d.case||d.speechSource)return d.line;
  const v=step.variant,e=Object.prototype.hasOwnProperty.call(CORE_VOICE,v)?CORE_VOICE[v]:st.coreVoiceExtension===1&&Object.prototype.hasOwnProperty.call(CORE_VOICE_EXTENSION,v)?CORE_VOICE_EXTENSION[v]:null;
  if(!e||e.stage!==stage||e.action!==id||d.line!==fmt(e.original,st))return d.line;
  const named=Object.prototype.hasOwnProperty.call(e.individual,st.w.id)?fmt(e.individual[st.w.id],st):null;
  const pool=(e.voices[voice(st.w)]||e.voices.stoic).map(s=>fmt(s,st));
  const recent=st.coreVoiceStyle.recent||[],seen=st.log.filter(x=>x.side==='w').map(x=>x.line);
  const fresh=s=>![...recent,...seen].some(x=>x===s||x.endsWith(' '+s));
  if(named&&fresh(named)&&rng(st.seed,'core-voice-own|'+v)<.75)return named;
  const all=named?[named,...pool]:pool,options=all.filter(fresh);
  return pick(options.length?options:all,st.seed,'core-voice|'+v);
 }
 // G2C: reviewed, claim-equivalent opponent graph speech. The graph's
 // original fingerprint remains the semantic source; these are display
 // alternatives only. Do not touch authored speech or recorded evidence.
 const OPPONENT_VOICE={
  "ch_one_fall": {
    "stage": "answer",
    "action": "challenge",
    "claim": "terms",
    "original": "Just you and me. Agreed.",
    "individual": {
      "red": "Fine. No one else's business. Just us.",
      "roxy": "No supporting cast, then. I can live with that.",
      "silas": "Agreed. No third variable.",
      "night": "Just us under the lights? Good.",
      "rev": "Let the two of us answer for our own actions. Agreed.",
      "malik": "Good. No help for either of us.",
      "dean": "A straight two-person contest. Those terms suit me.",
      "rocco": "Fine. Nobody else.",
      "nova": "Agreed. Just the two of us on the mat.",
      "ace": "Two names on the bill, no guest stars. Done.",
      "magnus": "No third party in the bargain. Agreed.",
      "tori": "Two competitors, nothing else in the equation. I'm in."
    },
    "voices": {
      "grand": "Just the two of us in the spotlight. Agreed.",
      "gruff": "Just us. Fine.",
      "eager": "Only us? Sounds good.",
      "stoic": "Agreed. Nobody else.",
      "precise": "Agreed: no outside involvement.",
      "earnest": "I'm happy to settle it between us.",
      "sermon": "Let neither of us call for help. Agreed.",
      "slippery": "Those terms suit me. No third parties."
    }
  },
  "pr_tape": {
    "stage": "open",
    "action": "proof",
    "claim": "study",
    "original": "Watching tape is easy, {W}. Doing something about it is harder.",
    "individual": {
      "red": "Easy to watch a match from a chair, {W}. Try doing it.",
      "roxy": "Lovely homework, {W}. Now let's see you perform it live.",
      "silas": "Observation isn't execution, {W}. Can you actually apply what you saw?",
      "night": "You can rewind a tape, {W}. You can't rewind me in the ring.",
      "rev": "It is easier to study a test than to pass it, {W}.",
      "malik": "Anyone can watch, {W}. Show me what you can do.",
      "dean": "You've done the research, {W}. Now comes the difficult part: making it pay.",
      "rocco": "Tape won't fight back, {W}. I will.",
      "nova": "Recognising a hold on video isn't the same as escaping it, {W}.",
      "ace": "You watched the replay, {W}. Tonight you have to perform without a second take.",
      "magnus": "You know what the tape showed you, {W}. The difficulty is putting that knowledge to work.",
      "tori": "A recording is a model, {W}. Now try making the theory work in the ring."
    },
    "voices": {
      "grand": "A rehearsal on tape is one thing, {W}. Performing is another.",
      "gruff": "Watching is easy, {W}. Doing it isn't.",
      "eager": "You've seen it, {W}! Now can you actually do it?",
      "stoic": "Seeing it and doing it are different, {W}.",
      "precise": "Reviewing footage does not establish that you can execute the response, {W}.",
      "earnest": "I'm glad you studied it, {W}. Applying it is the hard part.",
      "sermon": "Knowing the lesson is easier than living it, {W}.",
      "slippery": "Homework's cheap, {W}. Putting it into practice is the expensive bit."
    }
  },
  "pr_veteran": {
    "stage": "open",
    "action": "proof",
    "claim": "experience",
    "original": "Experience is just another word for old, {W}.",
    "individual": {
      "red": "Years on the road don't make you unbeatable, {W}.",
      "roxy": "All those years, darling, and you still have to earn your place on tonight's bill.",
      "silas": "Time served isn't proof of superiority, {W}.",
      "night": "Years on the clock won't keep you ahead of me, {W}.",
      "rev": "The years alone do not confer victory, {W}.",
      "malik": "I respect the years, {W}. I don't accept them as an advantage on their own.",
      "dean": "Experience sounds impressive, {W}, until you have to cash it in.",
      "rocco": "Years don't win a fight, {W}.",
      "nova": "Longevity isn't the same as an advantage in the next exchange, {W}.",
      "ace": "You've had your seasons in the spotlight, {W}. That doesn't make tonight yours.",
      "magnus": "A long career isn't leverage unless you can use it, {W}.",
      "tori": "Age is a data point, {W}, not a prediction of the result."
    },
    "voices": {
      "grand": "A long career is not a guarantee of tonight's victory, {W}.",
      "gruff": "Years don't make you better than me, {W}.",
      "eager": "You've been here a while, {W}. That doesn't mean you've got the edge!",
      "stoic": "Time served settles nothing, {W}.",
      "precise": "Experience alone does not establish an advantage, {W}.",
      "earnest": "You've done this longer, {W}. That doesn't mean you'll do it better tonight.",
      "sermon": "The passage of years is not a promise of victory, {W}.",
      "slippery": "Years look good on paper, {W}. They don't win the match by themselves."
    }
  },
  "ca_long": {
    "stage": "answer",
    "action": "calm",
    "claim": "early",
    "original": "Then I will finish it before the last minute.",
    "individual": {
      "red": "Then I'll get it done early.",
      "roxy": "Then you won't be getting your grand finale, darling. I'll finish it early.",
      "silas": "Then I will secure the fall before your closing exchange.",
      "night": "Then let's see how you handle an early finish.",
      "rev": "Then I intend to settle it before that final minute arrives.",
      "malik": "Then I'm going to finish it before you get that far.",
      "dean": "In that case, I'll aim to have the result decided before the last minute.",
      "rocco": "Then I'll finish you early.",
      "nova": "I'll look for the deciding fall before you reach that stage.",
      "ace": "Then I'll bring the curtain down early.",
      "magnus": "Then I intend to close the deal before you get your last minute.",
      "tori": "Then I'll aim to end the match before we reach that final interval."
    },
    "voices": {
      "grand": "Then I'll bring the finale forward.",
      "gruff": "Then I'll finish it early.",
      "eager": "Then I'm going to get it done before that last minute!",
      "stoic": "Then I'll end it before that.",
      "precise": "I intend to secure an earlier deciding fall.",
      "earnest": "Then I'll try to earn the win before the last minute.",
      "sermon": "Then I intend to settle it before that hour comes.",
      "slippery": "Then I'll aim to settle it before you get to the last minute."
    }
  },
  "ca_restraint": {
    "stage": "answer",
    "action": "calm",
    "claim": "end",
    "original": "Then stop talking.",
    "individual": {
      "red": "Good. Leave it there.",
      "roxy": "Then do spare us the rest of the speech.",
      "silas": "Then there is no need for another statement.",
      "night": "Then put the mic down. We're done.",
      "rev": "Then let the silence stand.",
      "malik": "Then leave it there.",
      "dean": "Well, then, let's not prolong this.",
      "rocco": "Enough, then.",
      "nova": "Then we can end the discussion.",
      "ace": "Then spare us the encore.",
      "magnus": "Then we've no more to discuss.",
      "tori": "Then let's stop the discussion here."
    },
    "voices": {
      "grand": "Then let's bring this speech to a close.",
      "gruff": "Then shut it.",
      "eager": "Then let's leave it there!",
      "stoic": "Then say no more.",
      "precise": "Then there is no reason to continue this discussion.",
      "earnest": "Then I think we've said enough.",
      "sermon": "Then let us leave the rest unsaid.",
      "slippery": "Then let's not spend any more time on it."
    }
  }
};
 function opponentVoiceCandidates(st,stage,id,d,variant){
  if(st.opponentVoiceStyle?.v!==1||!Semantic?.allowed(st)||d.case||d.speaker!==st.f.name)return [];
  const e=Object.prototype.hasOwnProperty.call(OPPONENT_VOICE,variant)?OPPONENT_VOICE[variant]:null;
  if(!e||e.stage!==stage||e.action!==id||d.line!==fmt(e.original,st))return [];
  if(d.speechSource!==Semantic.source(variant,e.original)||Semantic.classify(d.speechSource,d.speechDetail)?.claim!==e.claim)return [];
  const own=Object.prototype.hasOwnProperty.call(e.individual,st.f.id)?e.individual[st.f.id]:null;
  const family=e.voices[voice(st.f)]||e.voices.stoic;
  return [...new Set([own,family].filter(Boolean).map(s=>fmt(s,st)))];
 }
 // Audit only the exact reviewed display alternatives for the recorded
 // graph source, speaker and stage; a matching claim alone is insufficient.
 function reviewedOpponentVoice(st,d,entry){
  if(!entry||entry.side!=='f'||entry.authoredId||entry.composedId||!entry.semantic?.source||entry.semantic.source!==d.speechSource)return false;
  const slot=entry.dialogueSlot;if(!slot||slot.side!=='f'||slot.owner!==st.f.id)return false;
  const variant=d.speechSource.split(':')[1];
  return opponentVoiceCandidates(st,slot.stage,slot.action,d,variant).includes(entry.line);
 }
 function opponentVoice(st,stage,id,d,step){
  const v=step.variant,pool=opponentVoiceCandidates(st,stage,id,d,v);
  if(!pool.length)return null;
  const recent=st.opponentVoiceStyle.recent||[],seen=st.log.filter(x=>x.side==='f').map(x=>x.line);
  const fresh=pool.filter(s=>!recent.includes(s)&&!seen.includes(s));
  return fresh[0]||pick(pool,st.seed,'opponent-voice|'+v);
 }
 function coreRound(st,stage,id,key){
  const core=st.core,before=core.dialogue.length,m0={...core.metrics},fit=fitOf(st,stage,id);
  // Composure feeds the core's chance of landing a line; a line that suits the night is easier to land.
  const lift=fit*15;core.metrics.composure=(core.metrics.composure||0)+lift;
  Core.choose(core,id);
  core.metrics.composure-=lift;
  const step=core.steps.at(-1),fresh=core.dialogue.slice(before);
  const dm=k=>(core.metrics[k]||0)-(m0[k]||0);
  const base=step.landed?clamp(6+Math.round(dm('crowd')*.9+dm('cred')*.5+dm('heat')*.4),4,16):-(4+riskOf(st,stage,id)*2);
  // Risky lines are the high-upside ones: when they land on the right night, they land big.
  const mine=Math.round(step.landed?base*(1+.25*fit)*(1+.14*riskOf(st,stage,id)):base*(1-.2*fit));
  (st.fits??=[]).push({stage,id,fit});
  let said=false,replied=false,stumbled=false;
  const slot=(side,d)=>st.dialogueFacts&&Dialogue.context(st,stage,id,side,{landed:step.landed,variant:step.variant,recorded:!!d.case});
  for(const d of fresh){
   if(d.speaker===st.w.name&&!said){said=true;const got=swing(st,mine);const ctx=slot('w',d),line=pickAuthored(st,ctx);
    const graphLine=line?d.line:coreVoice(st,stage,id,d,step);
    const lead=stage==='open'?Director?.answerOpening(st.openingQuestion,id):null;
    if(lead){
     const answer=line?.text||clientClaim(st,graphLine);
     if(directOpening(st,step,d,line)){
      push(st,'w',answer,step.landed?'strong':'uneven',got);
      st.log.at(-1).answersQuestion={v:1,prompt:st.openingQuestion.prompt,lead:'',direct:true};
     }else{
      const spokenLead=st.speaker&&st.openingQuestion.kind!=='format'?clientClaim(st,lead):lead;
      push(st,'w',spokenLead+' '+answer,step.landed?'strong':'uneven',got);
      st.log.at(-1).answersQuestion={v:1,prompt:st.openingQuestion.prompt,lead:spokenLead};
     }
    }
    else push(st,'w',line?.text||graphLine,step.landed?'strong':'uneven',got,!line);
    annotate(st,st.log.length-1,ctx,line);
    if(!step.landed)push(st,'stage',fluff(st,stage),'fluff');crowdSays(st,got,key);continue;}
   if(d.speaker==='Crowd'&&d.kind==='reaction'&&!step.landed&&!stumbled){stumbled=true;continue;} // replaced by the fluff above
   if(d.speaker===st.f.name){replied=true;
    if(stage==='open'&&st.director?.format==='callout')push(st,'stage',fmt('{F} comes down from the entrance and takes the second microphone.',st),'stage');
    const ctx=slot('f',d),at=st.log.length,line=pickAuthored(st,ctx);
    theirTurn(st,line?.text||opponentVoice(st,stage,id,d,step)||graphFallback(st,stage,id,d),key,step.landed,fit);
    if(st.log[at]?.side==='f')annotate(st,at,ctx,line,d);
    if(stage==='open'&&!st.angle){st.angle=angleFor(st,id);openingCue(st);}
    continue;}
   if(d.speaker==='Crowd')push(st,'stage',d.line.replace(/^The opponent/,st.f.short).replace(/the opponent/g,st.f.short),'stage');
  }
  if(!replied&&stage!=='close')theirTurn(st,null,key,step.landed,fit);
  if(stage==='open'&&!st.angle){st.angle=angleFor(st,id);openingCue(st);}
  return {id,label:step.label,landed:step.landed};
 }
 function choose(st,id){
  if(!st||st.stage==='done')throw Error('The promo is over');
  const o=choices(st).find(x=>x.id===id);
  if(!o)throw Error('Not an option at the microphone: '+id);
  const r=ROUNDS[st.round].id,v=voice(talker(st)),beforeLog=st.log.length;
  let rec={round:r,id,label:o.label,landed:true};
  if(r==='open')rec={round:r,...coreRound(st,'open',id,'open')};
  else if(r==='answer')rec={round:r,...coreRound(st,'answer',id,'answer')};
  else if(r==='push'&&st.core.case?.exposed){
   const cs=st.core.case,P=cs.push||{};st.pushed=id==='leave'?'leave':'argue';
   if(id==='firm'){
    const ok=roll(st,2,'firm',st.meter>=8?.08:0),d=swing(st,ok?7:-7);
    push(st,'w',P.firm?.line||'I know what I did.',ok?'strong':'uneven',d,true);
    st.core.metrics.cred+=ok?2:-3;cs.resolution=ok?'defended':'unresolved';cs.followup=ok?'Stood firm, and it held.':'Stood firm, and it did not hold.';
    theirTurn(st,ok?P.firm?.ok:P.firm?.fail,'firm',ok,0);crowdSays(st,d,'firm');rec.landed=ok;
   }else if(id==='revise'){
    const d=swing(st,3);
    push(st,'w',P.revise?.line||'Fine. Tonight neither of us does.','strong',d,true);
    st.core.metrics.cred+=3;cs.resolution='reframed';
    if(!cs.commit)cs.commit={kind:'nocheat',node:'clean',say:'win without cheating',label:'Promise to do it without cheating',hint:'Follows from what you just said. Kept only if you do not cheat tonight.'};
    cs.followup='Revised the charge: neither of them cheats tonight.';
    push(st,'f',P.revise?.reply||'I will hold you to that.','opponent',0);
   }else{push(st,'stage',fmt('{W} lets it hang there. Nobody concedes anything.',spoke(st)),'stage',0);cs.followup='Left it hanging.';}
  }
  else if(r==='push'&&st.director){
   st.pushed=id;
   if(id==='leave')push(st,'stage',fmt('{W} lowers the microphone and lets the argument rest.',spoke(st)),'stage',0);
   else{
    const beat=Director.followup(st.director,id),ok=roll(st,beat.risk,'directed|'+id,(st.director.player.composure-50)/250),d=swing(st,ok?beat.base:-Math.max(2,beat.base-2));
    if(beat.line){const ctx=st.dialogueFacts&&Dialogue.context(st,r,id,'w',{landed:ok}),line=pickAuthored(st,ctx);push(st,'w',line?.text||beat.line,ok?'strong':'uneven',d);annotate(st,st.log.length-1,ctx,line);}
    else push(st,'stage',fmt('{W} says nothing, watching {F}.',spoke(st)),ok?'strong':'uneven',d);
    if(beat.reply){const ctx=st.dialogueFacts&&Dialogue.context(st,r,id,'f',{landed:ok}),line=pickAuthored(st,ctx),at=st.log.length;theirTurn(st,line?.text||beat.reply,'directed|'+id,ok,0);annotate(st,at,ctx,line);}
    crowdSays(st,d,'directed|'+id);rec.landed=ok;
   }
  }
  else if(r==='push'){
   st.pushed=id;
   if(id==='leave'){const d=swing(st,st.meter>0?2:0);push(st,'stage',fmt('{W} lets it hang in the air and lowers the microphone.',spoke(st)),'stage',d);}
   else{
    const p=PUSH[id],h=HOOK[p.src],fit=pushFit(st,id),edge=.07*fit+(st.meter>=8?.1:st.meter<=-8?-.06:0);
    const ok=roll(st,p.risk,'push|'+id,edge),d=swing(st,ok?Math.round(p.gain*(1+.15*Math.max(0,fit))):-p.loss),line=fmt(own(st,p.src)||h.lines[v],spoke(st));
    push(st,/^“/.test(line)?'w':'stage',line,ok?'strong':'uneven',d);
    if(!ok)push(st,'stage',fluff(st),'fluff');
    crowdSays(st,d,'push');rec.landed=ok;
    // Staying out there invites trouble.
    if(rng(st.seed,'heckle?')<.3){
     push(st,'stage','A voice from the bar: “'+pick(HECKLES,st.seed,'heckle')+'”','event');
     const won=roll(st,2,'heckle'),e=swing(st,won?4:-4);
     push(st,'stage',fmt(won?'{W} turns it round on the heckler, who sits down and looks at their pint.':'{W} tries to answer back, and the heckler gets the bigger laugh.',spoke(st)),won?'strong':'fluff',e);
    }
    if(!ok||rng(st.seed,'pushback?')<.5)theirTurn(st,fmt(pick(['You done, {W}? Only some of us have a match to win.','Keep talking, {W}. It is the only thing you are winning tonight.','Lovely speech. Shall I hold your coat while you finish?','That is a lot of words for somebody about to lose.'],st.seed,'pushback'),st),'push',ok,fit);
   }
  }else rec={round:r,...coreRound(st,'close',id,'close')};
  if(r==='push'&&st.dialogueFacts)for(const e of st.log.slice(beforeLog))if((e.side==='w'||e.side==='f')&&!e.dialogueSlot)e.dialogueSlot=Dialogue.tag(Dialogue.context(st,r,id,e.side,{landed:rec.landed,recorded:!!st.core.case}));
  if(st.semantic&&Semantic.option(st,r,id))rec.label=o.label;
  st.steps.push(rec);st.round++;
  if(st.director){
   Director.observe(st.director,st,rec,st.log.slice(beforeLog));
   if(r==='answer'){
    const event=Director.spontaneous(st.director,st,rec);
    if(event){
     st.director.event={...event,line:fmt(event.line,st)};
     push(st,'stage',st.director.event.line,'event',0);
    }
    const route=Director.route(st.director,st,rec);st.director.followup=route;
    if(!route.follow){st.round=3;st.director.phase='closing';}
   }
   if(r==='close')st.director.ending={reason:'final word',promise:Core.result(st.core)?.promise?.type||'none'};
  }
  if(st.round>=ROUNDS.length){st.stage='done';st.result=finish(st);}
  return st;
 }
 function finish(st){
  const base=Core.result(st.core),m=st.meter,pushed=st.pushed&&st.pushed!=='leave';
  const reaction=fmt(m>=25?'{W} owns the room. {F} is talking to {W}’s crowd now.':m>=8?'The room is with {W}.':m>-8?'Honours even. The match will have to settle it.':
   m>-25?'{F} got the better of that.':'{F} took the room off {W} and kept it.',st);
  return {...base,live:true,mouth:st.speaker?{id:st.speaker.id,short:st.speaker.short,name:st.speaker.name}:null,duel:{meter:m,won:m>0,pushed:!!pushed,read:{...st.read},angle:st.angle,fits:(st.fits||[]).slice()},
   quality:clamp(Math.round(base.quality+m*.35),10,97),
   ...(st.director?{conversation:Director.summary(st.director)}:{}),
   ...(st.director?.format?{format:st.director.format}:{}),
   ...(st.authoredDialogue?{dialogueIds:st.authoredDialogue.used.slice(),...((st.authoredDialogue.used.length||st.authoredDialogue.composedUsed?.length)?{reply:st.log.filter(e=>e.side==='f').at(-1)?.line||base.reply}:{})}:{}),
   arcDirection:st.arc?.id||null,
   crowdShift:clamp(Math.round(base.crowdShift+m/7),-8,13),
   heatDelta:clamp(Math.round(base.heatDelta+(st.director&&!st.core.case?.exposed?(st.pushed==='press'?2:0):(pushed?2:0))+(Math.abs(m)>=25?1:0)),-3,16),
   moraleDelta:clamp(base.moraleDelta+(m>=15?1:m<=-15?-1:0),-3,4),
   temperature:50+m,temperatureWord:meterWord(m),timeOver:0,
   beats:st.steps.map(s=>({...s})),reaction,
   dialogue:st.log.map(e=>({speaker:e.speaker||'Stage',line:e.line,kind:e.kind,swing:e.swing,...(e.dialogueSlot?{dialogueSlot:e.dialogueSlot}:{}),...(e.authoredId?{authoredId:e.authoredId}:{}),...(e.composedId?{composedId:e.composedId}:{}),...(e.semantic?{semantic:{...e.semantic}}:{}),...(e.answersQuestion?{answersQuestion:{...e.answersQuestion}}:{})})),speech:st.log.filter(e=>e.side==='w').map(e=>e.line),
   angle:st.w.short+': '+st.steps.map(s=>String(s.label).toLowerCase()).join('; ')+'.'};
 }
 function view(st){
  const r=ROUNDS[Math.min(st.round,ROUNDS.length-1)];
  const directed=st.director&&Director.summary(st.director);
  const name=st.stage==='done'?'The final word':st.core.case?.exposed&&r.id==='push'?r.name:(directed&&Director.heading(st.director,st.round))||(directed&&r.id==='push'?'The argument continues':r.name);
  const help=directed&&r.id==='push'&&!st.core.case?.exposed?'Decide whether the point needs another exchange, or let it rest.':r.help;
  return {stage:st.stage,round:st.round,total:ROUNDS.length,name,help:fmt(st.stage==='done'?'It is said. The match decides whether any of it was true.':help,st),...(directed?{conversation:directed}:{}),
   meter:st.meter,meterWord:meterWord(st.meter),options:choices(st),log:st.log.slice(),claim:st.core.claim||null,result:st.result,
   read:st.round===0&&st.stage!=='done'?st.readLines:null,cue:st.round===1&&st.angle?spokenCue(st):null,
   // v0.3.12 What the rivalry has on record before the first line, and any argument still open.
   record:st.round===0?(st.core.cases||[]).map(c=>c.evidence):null,
   unresolved:st.round===0?((st.core.cases||[]).find(c=>c.continuation)?.reminder||null):st.core.case?.continuation?st.core.case.reminder:null};
 }
 const result=st=>st?.stage==='done'?st.result:null;
 root.OfficeMic={ROUNDS,PUSH,HOOK,FLUFF,CROWD,begin,choose,choices,view,result,clientClaim,meterWord,riskWord,openFit,answerFit,pushFit,arcFit,READ,ANSWER_FIT,reviewedOpponentVoice,reviewedFallbackClaim};
})(typeof window!=='undefined'?window:globalThis);
