/* THE OFFICE v2.5 — original promos and rivalry angles */
(function installStory(root){
 'use strict';
 const D=root.OfficeData,G=root.OfficeGame;
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const STYLES={
  challenge:{name:'Call them out',blurb:'Make it personal. Strong rivalry growth, but a bad promo can draw boos.',risk:7,heat:9,crowd:2},
  rally:{name:'Rally the fans',blurb:'Win the room. Stronger immediate crowd, slower feud growth.',risk:0,heat:3,crowd:7},
  mindgames:{name:'Play mind games',blurb:'Get inside their head. High upside for a gifted talker.',risk:11,heat:8,crowd:1},
  respect:{name:'Respectful warning',blurb:'Make the contest matter. Steady response with less hostility.',risk:-5,heat:2,crowd:3}
 };
 const speeches={
  challenge:[
   ['You have had your turn in the spotlight, {F}. Tonight they are looking at me.','You can tell them what you are going to do. You still have to get past me.'],
   ['I have listened to you talk for weeks, {F}. Now listen to the bell.','You picked the wrong night to make this about you.'],
   ['Everyone has an opinion about {F}. Mine is simple: I am not moving aside.','They keep calling you the favourite. I keep calling you beatable.'],
   ['I know what you are good at, {F}. I know what you hide, too.','Make all the excuses you like. We meet in the ring.']
  ],
  rally:[
   ['These people have paid to see a fight, {F}. I intend to give them one.','I can hear every voice in this building. Tonight, that noise is for us.'],
   ['I have worked too many empty halls to take this crowd for granted.','When the bell goes, I want every person in here on their feet.'],
   ['Look around you, {F}. These are the people who kept this territory alive.','Tonight I wrestle for the lot of them.'],
   ['I did not come here to ask for cheers. I came to earn them.','Give me ten minutes and I will give you something to remember.']
  ],
  mindgames:[
   ['You keep checking over your shoulder, {F}. There is a reason for that.','The mistake is thinking you will see it coming.'],
   ['You are so worried about my finisher that you have forgotten the rest of my game.','You will find out how expensive that mistake is.'],
   ['I watched your last match twice, {F}. You know which moment I replayed.','I can see it in your face. You know, too.'],
   ['All that noise, all that confidence. You still looked away when I walked in.','The contest is half over before we touch.']
  ],
  respect:[
   ['You are one of the best on this circuit, {F}. That is why I asked for this match.','No shortcuts. Just two wrestlers finding out who belongs here.'],
   ['I know what you have done to earn this place, {F}. I have done the work as well.','Let us give this crowd a match they can be proud of.'],
   ['I do not need to insult you to make this important.','I need you at your best, because you are getting mine.'],
   ['We can settle our differences without hiding behind a microphone.','The bell will tell everyone what they came to learn.']
  ]
 };
 const replies={
  hot:[
   'You can say my name all night, {W}. It will not save you when the bell rings.',
   'The trouble with your promises, {W}, is that I have heard them before.',
   'I was hoping you would make this personal. Now I do not have to.',
   'That little speech is the last thing you will be proud of tonight.'
  ],
  cool:[
   'Words are cheap, {W}. There is a match to work.',
   'I am not giving you a speech back. I will give you a lesson.',
   'You had your chance to talk. Now let the better wrestler do the work.',
   'You have the crowd. I have the experience.'
  ],
  technical:[
   'You can win the room, {W}. You still have to escape my holds.',
   'Watch my feet when we lock up. That is where this ends.',
   'There is a difference between a good line and good technique.',
   'I am not here to trade insults. I am here to teach.'
  ],
  wild:[
   'Keep talking, {W}. It makes the first punch sweeter.',
   'The ring is not big enough for all that confidence.',
   'When I am done, even the back row will know my name.',
   'You will need a lot more than those people cheering for you.'
  ]
 };
 function hash(s){let h=2166136261>>>0;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);return (h^(h>>>16))>>>0}
 function choose(arr,s){return arr[hash(s)%arr.length]}
 function fill(s,w,f){return s.replace(/\{W\}/g,w.short).replace(/\{F\}/g,f.short)}
 function create(c,w,f,style='challenge',rival=null){
  const st=STYLES[style]||STYLES.challenge,seed=c.id+'|'+(c.eventAbs||'')+'|'+style;
  const mic=Number(w.mic||45),opMic=Math.round((f.heat||45)*.43+(f.psych||55)*.37+(f.ego||50)*.2);
  const feudHeat=rival?.closed?0:Math.max(c.feudHeat||0,rival?.heat||0);
  const variance=hash(seed+'|quality')%25-12;
  const rating=clamp(Math.round(mic*.68+w.heat*.18+w.psych*.14+variance+st.risk*.25+(feudHeat>=35?5:0)),10,99);
  const rivalRating=clamp(Math.round(opMic*.75+(f.heat||40)*.25+(hash(seed+'|reply')%17-8)),10,99);
  const pool=speeches[style]||speeches.challenge;const pair=[choose(pool,seed+'|open')[0],choose(pool,seed+'|close')[1]];
  const opponentTone=feudHeat>=50?'hot':f.style==='Technical'?'technical':f.style==='Brawl'?'wild':'cool';
  const retort=choose(replies[opponentTone],seed+'|retort');
  const stumble=rating<38,star=rating>=76,scene=feudHeat>=55?'A grudge spills into the ring':feudHeat>=30?'Old scores are being settled':'Two names, one microphone';
  const crowdShift=clamp(Math.round((rating-48)/13+st.crowd+(rivalRating-50)/35-(stumble?4:0)),-7,13);
  const heatDelta=clamp(Math.round(st.heat+rating/22+(feudHeat>=35?2:0)-(style==='respect'?2:0)),1,16);
  const speech=[fill(pair[0],w,f),fill(pair[1],w,f)];
  if(stumble)speech[1]='The words catch in '+w.short+'’s throat. '+speech[1];
  const reaction=stumble?'Scattered whistles and a few awkward laughs.':star?'The whole building reacts to that last line.':rating>=54?'A strong response from the crowd.':'A mixed reaction: this audience needs convincing.';
  return {cid:c.id,style,styleName:st.name,quality:rating,rivalQuality:rivalRating,crowdShift,heatDelta,
   speaker:w.name,opponent:f.name,speech,reply:fill(retort,w,f),reaction,scene,
   hook:style==='challenge'?'The challenge is still hanging in the air.':style==='mindgames'?'The mind games have started early.':style==='rally'?'The crowd came into this one already invested.':'There is genuine respect before the bell.'};
 }
 const PromoGraph=(function graphFactory(){
 const STAGES=['open','answer','close'];
 const NODES={
  open:{
   people:{label:'Speak for the crowd',hint:'Bring the fans into the story. Risks sounding like a slogan.',identity:'people',risk:1,effect:{crowd:6,heat:1,cred:1,trust:2},lines:[
    'Every seat in this building has a story, {F}. Tonight I intend to give them a good ending.',
    'They did not come to hear us recite our records. They came to find out which of us belongs in this ring.'
   ]},
   proof:{label:'Make it about the contest',hint:'A measured, credible argument. Less explosive, more respected.',identity:'proof',risk:0,effect:{crowd:2,heat:2,cred:5,trust:2},lines:[
    'There is a reason they put our names on the same bill, {F}. Neither one of us has answered the question yet.',
    'I have watched you wrestle. I know the things you do well. Now you get to see what I have learned.'
   ]},
   imagery:{label:'Paint a strange picture',hint:'Find an unforgettable metaphor. High upside, awkward if it falls flat.',identity:'imagery',risk:3,effect:{crowd:3,heat:3,cred:0,trust:0},lines:[
    'Look at {PROP}, {F}. {MOTIF1}',
    'You see {PROP}, {F}? {MOTIF2}'
   ]},
   accusation:{label:'Question their character',hint:'Personal confrontation and rivalry heat, with backstage consequences.',identity:'accusation',risk:3,effect:{crowd:1,heat:7,cred:-1,trust:-3},lines:[
    'You are very good at finding the cameras, {F}. I wonder how good you are when nobody is there to rescue you.',
    'You do your talking from a comfortable distance. Tonight there is a ring between us and nowhere to hide.'
   ]},
   swagger:{label:'Own the spotlight',hint:'Big-personality showmanship. Can turn a crowd or lose it.',identity:'swagger',risk:2,effect:{crowd:4,heat:4,cred:-1,trust:-1},lines:[
    'I did not come down that aisle to be somebody else’s supporting act, {F}. Look at the lights. Look at me.',
    'The sign outside has both our names. When the people leave, I intend mine to be the one they remember.'
   ]}
  },
  answer:{
   turn:{label:'Turn their words against them',hint:'A sharp callback to their interruption. Rewards composure.',risk:1,effect:{crowd:4,heat:3,cred:4,trust:0},lines:[
    'You think that answers what I said, {F}? You have only made the point for me.',
    'Keep hold of those words. I will give them back to you when the bell rings.'
   ]},
   personal:{label:'Make it personal',hint:'Raise the stakes sharply. Risks an ugly exchange.',risk:4,effect:{crowd:1,heat:8,cred:-2,trust:-4},lines:[
    'There it is, {F}. The part of you that comes out when the questions become uncomfortable.',
    'You can insult my name. You still have to face me when there is no microphone between us.'
   ]},
   callback:{label:'Return to the opening image',hint:'Build a running theme. A skilled talker can make it memorable.',risk:2,effect:{crowd:4,heat:3,cred:2,trust:1},lines:[
    'Remember what I said about {THEME}, {F}? You have not heard the end of it.',
    'An arena remembers the moments that matter. I am going to make sure they remember this one.'
   ]},
   calm:{label:'Keep your composure',hint:'Avoid a shouting contest. Build credibility, possibly lose intensity.',risk:0,effect:{crowd:0,heat:1,cred:6,trust:4},lines:[
    'I heard you, {F}. Now I want you to listen: the match is not won by the loudest voice.',
    'If you are right about me, you can prove it in front of every one of these people.'
   ]},
   challenge:{label:'Ask for an answer in the ring',hint:'Turn the argument into a clear wrestling challenge.',risk:1,effect:{crowd:3,heat:5,cred:3,trust:1},lines:[
    'Forget the speeches. I am asking you one question, {F}: can you beat me when it actually counts?',
    'Your answer had better be ready by the time that bell rings.'
   ]}
  },
  close:{
   vow:{label:'Promise a victory',hint:'A bold promise creates stakes. Losing makes it harder to live down.',risk:3,effect:{crowd:5,heat:6,cred:-1,trust:0},promise:'win',lines:[
    'This is not a prediction for the cameras. I am telling you I will leave that ring the winner.',
    'When they raise my hand, remember who told you first.'
   ]},
   finisher:{label:'Call your finishing move',hint:'Make a specific promise the crowd will expect the match to deliver.',risk:3,effect:{crowd:4,heat:4,cred:2,trust:0},promise:'finisher',lines:[
    'There will be a moment when you know exactly what is coming, {F}, and it still will not help.',
    'I intend to finish this with {FINISHER}. Everybody here can hold me to it.'
   ]},
   clean:{label:'Demand a straight fight',hint:'Stake your reputation on fair play. A dirty result will undermine you.',risk:1,effect:{crowd:2,heat:1,cred:6,trust:5},promise:'clean',lines:[
    'I am asking you for one thing, {F}: no excuses, no shortcuts, no one getting involved.',
    'Let the result belong to the better wrestler. I will live with that.'
   ]},
   uncertainty:{label:'Leave them guessing',hint:'Avoid giving away your plan, but sacrifice the obvious crowd payoff.',risk:1,effect:{crowd:1,heat:3,cred:3,trust:1},promise:'none',lines:[
    'You have heard quite enough from me, {F}. The rest of this conversation belongs in the ring.',
    'Keep wondering what I have planned. That is exactly where I want you.'
   ]},
   question:{label:'Promise to outwit their attack',hint:'Make an observable promise: counter their offence during the match. Miss the counter and you lose credibility.',risk:2,effect:{crowd:3,heat:5,cred:2,trust:0},promise:'counter',lines:[
    'When you try to take over, {F}, I will be waiting with an answer. Let these people judge the counter.',
    'You will commit to your favourite attack, {F}. I will turn it back on you before this match is done.'
   ]}
  }
 };
 const METAPHORS=[
  {prop:'that old clock above the entrance',first:'Even when the entire room holds its breath, the hands keep moving.',second:'When time runs out, there is nowhere left to hide.'},
  {prop:'the brass bell beside the ring',first:'It looks harmless when everything is quiet. Then it makes the whole building move.',second:'It does not ring for anyone who only knows how to talk.'},
  {prop:'the lights above that ring',first:'They turn ordinary people into giants, and giants back into shadows.',second:'Tonight those lights will tell the truth about both of us.'},
  {prop:'that curtain by the entrance',first:'Anybody can make an entrance through it. Not everybody leaves with something worth remembering.',second:'The hard part is walking back through after a fight you cannot talk your way out of.'},
  {prop:'this microphone in my hand',first:'It can make a voice sound ten feet tall, but it cannot make a wrestler an inch better.',second:'After the bell the only sound I want to hear is the crowd reacting to what we do.'}
 ];
 const thematic={
  people:'the people in the seats',proof:'the question of who belongs',imagery:'the opening image',
  accusation:'hiding behind the cameras',swagger:'whose name this crowd remembers',hometown:'this town',numbers:'the numbers'
 };
 const RESPONSES={
  people:[
   'You can stand there claiming to represent these people, {W}. I am the one who has to wrestle you.',
   'The crowd does not make the decisions for me, {W}. Neither do you.',
   'They can cheer as loudly as they like. I will still be standing opposite you.'
  ],
  proof:[
   'I did not come here for a lesson, {W}. I came here for the result.',
   'You know my record. Fine. You do not know what I have prepared for tonight.',
   'That sounds very respectful. It will not help you when I take control.'
  ],
  imagery:[
   'You want to talk about {PROP}, {W}? Try making that matter when the bell rings.',
   'You can keep talking about {PROP} all night, {W}. I would rather talk about wrestling.',
   'That was a colourful speech. Now try telling me something I do not already know.'
  ],
  accusation:[
   'You are desperate to make this about my character because you do not want to talk about my ability.',
   'Hiding? I am standing right here, {W}. Try making that accusation to my face.',
   'Watch how you talk about me. Some things do not end when the bell rings.'
  ],
  swagger:[
   'You like seeing your name under those lights. Let us see how you look with the lights on you in defeat.',
   'I did not come here to admire you, {W}. I came here to get paid to beat you.',
   'The loudest person in the room is not always the one they remember.'
  ]
 };
 const OPP_AFTER={
  turn:['You rehearsed that answer, did you? We will see how quick you are on your feet.',
    'You think you have me figured out. That is the mistake you keep making.'],
  personal:['Now you have crossed a line. I am not going to forget it.',
    'I was ready for a match. Now I am ready for a fight.'],
  callback:['You really are going to keep that going, aren’t you? I am looking forward to silencing it.',
    'That was clever. I will give you that. You still have to wrestle.'],
  calm:['You sound so confident because you have not had to get in there with me yet.',
    'All right. No more talking. Show me.'],
  challenge:['That is the first sensible thing you have said. I accept.',
    'I was going to fight you anyway. You have only made it personal.']
 };
 const FINALE={
  vow:['The opponent shakes their head and points at the mat: the challenge has been accepted.',
       'The opponent laughs, then stares back without another word.'],
  finisher:['The opponent gestures that they have the finisher scouted, then leaves for the ring.',
            'The opponent nods slowly. Both know what move they will be watching for.'],
  clean:['The opponent agrees to a straight fight, though neither seems fully convinced.',
         'The opponent extends a hand, then withdraws it before you can shake.'],
  uncertainty:['The opponent keeps watching, waiting for one more line that never comes.',
               'The interviewer looks between them. Neither gives another word away.'],
  question:['The opponent opens their mouth to answer, thinks again, and heads towards the curtain.',
            'The opponent points at the ring. The answer will have to wait.']
 };

 // v0.3.10 SIX MORE ANGLES. Built on the shapes of great promos (the hometown heel, the stats
 // speech, the confession, the fake-out, the legacy speech and the thank-you), written fresh for
 // this circuit. Each only appears on a night that suits it, so the choice stays readable.
 Object.assign(NODES.open,{
  hometown:{label:'Insult the town',hint:'Turn the whole building against you. Huge heat, if you can stand in it.',identity:'hometown',risk:3,effect:{crowd:-3,heat:9,cred:0,trust:-2},
   when:c=>c.ego>=60||c.micHigh,lines:[
    'Good evening, {VENUE}. I have been to some miserable places in my time. I am not saying this is the worst. I am saying it is in the running.',
    'I asked {F} what there is to do round here. {F} said, “Come to the wrestling.” That tells you everything about this town.'
   ]},
  numbers:{label:'Do the maths',hint:'Confident arithmetic that does not quite add up. Funny if you sell it.',identity:'numbers',risk:2,effect:{crowd:3,heat:3,cred:-1,trust:0},
   when:c=>c.micHigh||c.psych>=70||c.ego>=75,lines:[
    'Let me do the maths for you, {F}. A normal match is fifty-fifty. I am not normal, so you are down to twenty-five. Add the crowd, carry the one, and you are on minus four.',
    'I have run the numbers, {F}. Every way I add them up, you lose. In one version you lose twice.'
   ]}
 });
 Object.assign(NODES.answer,{
  confession:{label:'Admit what this is doing to you',hint:'Let them see the cracks, then turn it into a threat. Powerful with real history.',risk:3,effect:{crowd:4,heat:6,cred:1,trust:-1},
   when:c=>c.hist||c.grudge||!!c.mem,lines:[
    'You want the truth, {F}? I have not slept properly since we last met. And I am scared. Not of you. Of what I am going to do to you.',
    'I am not proud of how I have been this week. You did that, {F}. You dragged me back somewhere I swore I would never go again.'
   ]},
  fakeout:{label:'Tease a surprise',hint:'Get their hopes up, then pull the rug. The crowd will hate you for it.',risk:2,effect:{crowd:2,heat:5,cred:-1,trust:-1},
   when:c=>c.ego>=55&&!c.micLow,lines:[
    'You want to know who is in my corner tonight, {F}? I will tell you. They are right… no. Nobody. Look at your face. You believed it.',
    'Listen. Can you hear that? That is the sound of somebody coming to help you, {F}. Oh, wait. It is the urn.'
   ]}
 });
 Object.assign(NODES.close,{
  legacy:{label:'Say how you want to be remembered',hint:'Lift the match above tonight. Earns respect; promises nothing.',risk:1,effect:{crowd:3,heat:1,cred:5,trust:3},promise:'none',
   when:c=>c.lost||c.pro>=80||!!c.mem,lines:[
    'When I am finished, {F}, people can say two things about me. What I won, and how I went about it. Tonight I am thinking about the second one.',
    'One day somebody in this building will describe me to someone who never saw me. Tonight decides what they say.'
   ]},
  grateful:{label:'Thank them like it might be the last time',hint:'Sincere thanks to the room. The crowd will carry you; the heat goes quiet.',risk:1,effect:{crowd:6,heat:-1,cred:3,trust:4},promise:'none',
   when:c=>c.mem==='hurt'||c.lost||c.pro>=85||c.psych>=75,lines:[
    'Before anything else, thank you. Every one of you paid for a ticket you could have spent on something sensible. I will not forget it.',
    'I have loved this more than anything I have ever done. Whatever happens with {F} tonight, I want you to know that.'
   ]}
 });
 Object.assign(OPP_AFTER,{
  confession:['You can tell them how sad you are, {W}. I am still going to beat you.','I did not drag you anywhere, {W}. You walked there yourself.'],
  fakeout:['Very funny, {W}. Let us see who is laughing at the bell.','You got me once. You will not get me twice.']
 });
 Object.assign(FINALE,{
  legacy:['The opponent nods, almost respectfully, and walks off without a word.','The crowd applauds both of them. The opponent does not look back.'],
  grateful:['The applause lasts longer than the speech. The opponent waits it out, arms folded.','Somebody in the front row starts a round of applause. The opponent rolls their eyes and heads for the curtain.']
 });
 function claimContext(st,opening){
  const historic=st.history?.length?st.history[0]:null;
  const outcome=historic?.finish||'';
  const lost=outcome.startsWith('lose');
  const event=st.memory?.kind;
  const strength={Technical:'holds and counters',Brawl:'hard strikes',Spectacle:'speed and aerial attacks',Story:'patience and ring psychology'}[st.f.style]||'wrestling';
  // v0.3.12 Only public facts are said at the microphone. A backstage memory ("X remembers being asked
  // to lose") is never read out; the rivalry ledger supplies what the crowd actually saw.
  const top=st.cases?.[0]||null;
  const evidence=top?.evidence||(historic?(st.w.short+(lost?' lost':' won')+' the last encounter with '+st.f.short+'.'):'This is their first recorded meeting.');
  const said=historic?(lost?'You beat me last time, '+st.f.short+'.':'I beat you last time, '+st.f.short+'.'):'';
  const thesis=opening==='proof'?'Who has actually learned from the opposition?':
   opening==='accusation'?'Can that charge be supported by an actual incident?':
   opening==='people'?'Can the performer deliver for the audience?':
   opening==='imagery'?'Will the metaphor become a memorable in-ring event?':
   opening==='hometown'?'Can the wrestler survive the town they just insulted?':
   opening==='numbers'?'Do the sums hold up once the bell rings?':
   'Can the wrestler back up the demand for the spotlight?';
  return {opening,strength,evidence,said,thesis,hasEvidence:!!historic||!!st.memory?.recall,
   priorLoss:lost,planFocus:st.sheet?.focus||null,planPayoff:st.sheet?.payoff||null,opponentStyle:st.f.style};
 }
 function reactionToClaim(st,id){
  const c=st.claim,f=st.f.short,w=st.w.short;
  if(id==='accusation'&&!c.hasEvidence)return 'You have never even worked a match with me, '+w+'. Name one thing I have done to deserve that accusation.';
  if(id==='accusation')return 'You want to drag our last encounter into this? '+c.evidence+' We can settle the argument in the ring.';
  if(id==='proof'&&c.priorLoss)return 'You studied the last match? Good. I won that one, '+w+'. Tell me exactly which of my '+c.strength+' you can stop this time.';
  if(id==='proof'&&c.planFocus==='counter')return 'I know you have prepared a counter for my '+c.strength+', '+w+'. I have been in the planning room too. Can you still find it when I change the timing?';
  if(id==='proof'&&c.hasEvidence)return 'You beat me once, '+w+'. I have studied your counters too. What happens when I change my approach?';
  if(id==='proof')return 'You are claiming you have me worked out before we have ever faced each other. How will you stop my '+c.strength+'?';
  if(id==='people')return 'These people will still be here after the match, '+w+'. Can you give them a reason to remember the result, not just your speech?';
  if(id==='hometown')return 'Insult the town all you like, '+w+'. They paid to watch somebody shut you up, and that somebody is me.';
  if(id==='numbers')return 'Your maths is wrong, '+w+'. My '+c.strength+' do not care about percentages.';
  if(id==='imagery')return 'That is an interesting picture, '+w+'. My '+c.strength+' will be real when the bell rings. Where is your answer?';
  return 'You want all of the attention, '+w+'. The difficult part is doing something worth watching when I start using my '+c.strength+'.';
 }
 function answerToClaim(st,id){
  const c=st.claim||claimContext(st,'proof'),f=st.f.short;
  if(id==='turn')return 'You are proud of your '+c.strength+', '+f+'. That tells me what I must prepare for. I do not need to pretend it does not exist.';
  if(id==='personal')return c.hasEvidence?
   'You remember what happened last time, '+f+'. '+(c.said||c.evidence)+' I will not pretend it meant nothing.':
   'You asked for a specific example, '+f+'. I do not have one. What I do have is a match in front of me.';
  if(id==='callback')return c.opening==='imagery'?
   'I started with an image because there is a point beneath it, '+f+'. You will understand when we get to that ring.':
   'The point from my opening has not changed, '+f+': '+c.thesis;
  if(id==='calm')return 'You are asking how I will answer your '+c.strength+', '+f+'. By staying composed long enough to find the opening.';
  if(id==='confession')return c.hasEvidence?'You want to know what you have done to me, '+f+'? '+(c.said||c.evidence)+' I have not been the same since. Tonight you meet who I became.':
   'I will be honest with you, '+f+'. I am not sure I am all right. That should worry you more than it worries me.';
  if(id==='fakeout')return 'Nobody is coming, '+f+'. Not for you, not for me. Just the two of us and a referee.';
  return 'You want proof, '+f+'? Then try your usual attack when the bell rings. I will have to answer it where everyone can see.';
 }
 function answerQuality(st,id){
  const claim=st.claim||claimContext(st,'proof');
  let relevance=id==='turn'?5:id==='challenge'?4:id==='calm'?3:id==='callback'?2:-1;
  if(id==='callback'&&claim.opening==='imagery')relevance+=5;
  else if(id==='callback'&&!claim.hasEvidence&&claim.opening!=='imagery')relevance-=5;
  if(id==='personal'&&claim.hasEvidence)relevance+=4;
  if(id==='personal'&&!claim.hasEvidence)relevance-=5;
  if(id==='confession')relevance=claim.hasEvidence?4:1;
  if(id==='fakeout')relevance=claim.opening==='hometown'||claim.opening==='swagger'?3:1;
  if(claim.opening==='accusation'&&!claim.hasEvidence&&id!=='calm'&&id!=='turn')relevance-=2;
  return relevance;
 }
 const rng=(s,k)=>hash(s+'|'+k)/4294967296;
 const pick=(arr,s,k)=>arr[Math.floor(rng(s,k)*arr.length)];
 const format=(text,st)=>String(text).replace(/\{W\}/g,st.w.short).replace(/\{F\}/g,st.f.short)
  .replace(/\{VENUE\}/g,st.venue||'this hall').replace(/\{FINISHER\}/g,st.w.finisher||'my finishing hold').replace(/\{THEME\}/g,st.thread==='imagery'?st.motif.prop:(thematic[st.thread]||'tonight'))
  .replace(/\{PROP\}/g,st.motif.prop).replace(/\{MOTIF1\}/g,st.motif.first).replace(/\{MOTIF2\}/g,st.motif.second)
   .replace(/\{EVIDENCE\}/g,st.claim?.said||st.claim?.evidence||'').replace(/\{RECN\}/g,String(st.record?.n??(st.history?.length||0))).replace(/\{RECW\}/g,String(st.record?.w??(st.history||[]).filter(x=>String(x.finish||'').startsWith('win')).length)).replace(/\{STRENGTH\}/g,st.claim?.strength||({Technical:'holds and counters',Brawl:'hard strikes',Spectacle:'speed and aerial attacks',Story:'patience and ring psychology'}[st.f?.style]||'wrestling')).trim();
 const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
 /* v3.3 PROMO VARIANTS — each of the fifteen angles has concrete, situation-specific versions.
    A variant is offered only when its condition is true for this pairing (history, memories,
    feud heat, opponent style, the booked finish, the speaker's own skills and the earlier lines).
    The player still chooses between five angles per stage; the wording, the argument, the
    opponent's reply and the small effect adjustments come from the variant that fits. */
 const V=(id,when,label,hint,lines,reply,fx={})=>({id,when,label,hint,lines,reply,fx});
 const VARIANTS={
  open:{
   people:[
    V('p_hometown',c=>c.noHist,'Introduce yourself to the fans','Make a first impression. Modest but sincere.',['Some of you have never seen me before tonight. By the end of this match you will know exactly who I am.','I am new to a lot of people in this room, {F}. That is about to change.'],['Introductions are nice, {W}. They will forget your name the moment I beat you.'],{crowd:1,cred:1}),
    V('p_loyal',c=>c.won,'Thank the fans for the last win','They carried you before. Ask them to do it again.',['Last time you were loud enough to carry me through. Tonight I am asking you to do it again.'],['Enjoy the cheering, {W}. It did not decide our last match and it will not decide this one.'],{crowd:2}),
    V('p_second_chance',c=>c.lost,'Ask the crowd for a second chance','Own the defeat in front of the people who saw it.',['You saw me lose to {F}. I am asking you for one more chance to show you what really happened.'],['They saw it the first time, {W}. They will see it again.'],{crowd:2,cred:1}),
    V('p_working',c=>c.pro>=80,'Speak to the working people','A blue-collar appeal. Credible from a professional.',['Everybody here worked a full week to buy a ticket. I owe them a full night’s effort, and so do you, {F}.'],['A full night’s effort, {W}? I will give them that. You will be the one who cannot keep up.'],{cred:2,trust:1}),
    V('p_rally',c=>c.grudge,'Rally them against the opponent','Turn the room on {F}. More heat, a little less dignity.',['Every one of you knows what {F} has done. Help me make sure it ends tonight.'],['Listen to them cheer for you, {W}. They will be quiet soon enough.'],{heat:2,crowd:1}),
    V('p_injury',c=>c.mem==='hurt','Tell them you came back from the injury','A comeback story with a real wound behind it.',['The last time {F} and I met, I went home hurt. I came back for these people, and I came back for that.'],['I remember that night too, {W}. I am not sorry, and I will not be gentle.'],{crowd:3,heat:2}),
    V('p_chant',c=>c.micHigh,'Start a chant','Showy crowd work. Strong if the room is ready.',['Let me hear you! Louder! That noise is for you, {F}. It will be there for every count tonight.'],['Shout all you like. Noise has never pinned anybody.'],{crowd:2,risk:1}),
    V('p_short',c=>c.micLow,'Keep it short for the fans','Plain words. Hard to get wrong.',['I am not much of a talker. I will do my talking in the ring, for all of you.'],['Not much of a talker, {W}? Then let me do the talking. You can do the losing.'],{cred:2,crowd:-1,risk:-1}),
    V('p_show',c=>c.opp==='Spectacle','Promise them a show','Speak to fans who came to see something special.',['You came to see something you will never forget. {F} can fly. I will make sure you see them come down.'],['I will give them a show, {W}. You will have the best view of it from the mat.'],{crowd:2})
   ],
   proof:[
    V('pr_tape',c=>c.hist,'Cite the tape of the last match','Evidence from your real history together.',['I watched the tape of our last match three times, {F}. {EVIDENCE}'],['Watching tape is easy, {W}. Doing something about it is harder.'],{cred:3}),
    V('pr_tech',c=>c.opp==='Technical','Respect the technician, then explain the plan','Acknowledge their skill to sound credible.',['You are the best mat wrestler in this building, {F}. That is exactly why I will not let you take me to the mat.'],['You will not let me take you down? Nobody lets me, {W}. I just do it.'],{cred:2}),
    V('pr_brawl',c=>c.opp==='Brawl','Explain how to survive the brawl','Name their power, then the answer to it.',['You hit harder than anyone I have faced, {F}. Hitting hard is not the same as winning.'],['Say that again after the first forearm, {W}.'],{cred:2}),
    V('pr_risk',c=>c.opp==='Spectacle','Point out the risks they take','Every high-risk move is a chance for you.',['Every time you go to the top rope, {F}, you give me a chance. I only need one.'],['You will need more than one chance to catch me, {W}.'],{cred:2}),
    V('pr_stall',c=>c.opp==='Story','Call out their stalling','A practical argument about their tactics.',['You like to slow everything down, {F}, and make the crowd wait. I will not wait.'],['Patience wins matches, {W}. You have never had any.'],{cred:2}),
    V('pr_record',c=>c.won,'Point to your record','The result is on the books.',['I beat you last time, {F}. That is on the record, and nothing you say tonight changes it.'],['Records are about the past, {W}. I am here tonight.'],{cred:2,heat:1}),
    V('pr_lesson',c=>c.lost,'Admit the loss and say you learned','Honesty buys credibility.',['You beat me, {F}. I am not embarrassed by it. I learned from it.'],['Learn all you like, {W}. I have improved too.'],{cred:4}),
    V('pr_veteran',c=>c.pro>=85,'Speak as the veteran','Experience as an argument.',['I have been in this ring longer than you have been watching wrestling, {F}. Experience does not panic.'],['Experience is just another word for old, {W}.'],{cred:2}),
    V('pr_study',c=>c.noHist,'Size them up','A first meeting: show you have done your homework.',['We have never been in the ring together, {F}. I have studied your {STRENGTH}. You have not studied me.'],['Study as much as you like, {W}. You will still have to deal with my {STRENGTH}.'],{cred:2})
   ],
   imagery:[
    V('im_storm',c=>c.grudge,'Describe the feud as a storm','An image that fits a long rivalry.',['This has been building like a storm over this town, {F}. Tonight it breaks.'],['Storms pass, {W}. I am still here afterwards.'],{heat:2}),
    V('im_chess',c=>c.opp==='Technical','Compare it to chess','Meet the technician on their own terms.',['You think this is chess, {F}. Then you know what happens when the king runs out of squares.'],['Then you should know I am always three moves ahead.'],{cred:1}),
    V('im_bull',c=>c.opp==='Brawl','Compare them to a charging bull','Turn their aggression into a weakness.',['You charge like a bull, {F}. All I need is to step aside at the right moment.'],['Step aside if you can, {W}. Most people cannot.'],{}),
    V('im_fall',c=>c.opp==='Spectacle','Talk about flying and falling','Every high flyer has to come down.',['You fly higher than anyone, {F}. That only means the fall is longer.'],['I land on my feet, {W}. I always have.'],{}),
    V('im_scar',c=>c.mem==='hurt','Talk about the scar it left','A memorable image backed by a real injury.',['I still carry the mark from our last match, {F}. Every morning I see it, and I think about tonight.'],['Then I will give you a matching one, {W}.'],{heat:3,cred:1}),
    V('im_ladder',c=>c.fresh&&!c.micLow,'Talk about climbing the ladder','Present the match as a step up.',['Every name on this card is a rung on a ladder, {F}. You are the next one I step on.'],['Plenty of people have tried to step over me, {W}. They all fell.'],{}),
    V('im_cage',c=>c.micHigh,'Describe the ring as a cage','A strong image, if you can sell it.',['Four ropes, four corners, nowhere to run. That ring is the only place where neither of us can lie, {F}.'],['Fine with me, {W}. I have nothing to hide.'],{crowd:1,risk:1}),
    V('im_debt',c=>c.lost,'Talk about a debt being repaid','A promise of repayment for the last loss.',['You took something from me last time, {F}. I keep a list. Tonight I start paying it back.'],['You can keep your list, {W}. I am adding to it tonight.'],{heat:2}),
    V('im_crown',c=>c.ego>=75,'Call yourself royalty','Grandiose. Heat or laughter.',['This town has needed a ruler for a long time. Tonight is my coronation, {F}.'],['You should check where the throne is first, {W}. It is not yours.'],{heat:2,risk:1})
   ],
   accusation:[
    V('ac_injury',c=>c.mem==='hurt','Blame them for the injury','A specific charge with evidence behind it.',['You hurt me, {F}. Not by accident, either. You were careless, and you knew it.'],['It was an accident and you know it, {W}. But if you want a fight, you have one.'],{heat:3,evidence:true}),
    V('ac_survived',c=>c.lost,'Say they did not really beat you','Dispute the last result.',['You did not beat me last time, {F}. You survived me, and everyone here saw how.'],['The referee counted three, {W}. That is all anybody remembers.'],{heat:2}),
    V('ac_politics',c=>c.ego>=70,'Accuse them of backstage politics','Unprovable claims can backfire.',['You did not get this spot with your wrestling, {F}. Everyone in the back knows who you talk to.'],['Name one person, {W}. You cannot, because it is not true.'],{heat:3,trust:-2,risk:1}),
    V('ac_coward',c=>c.grudge,'Call them a coward','Escalate a running feud.',['You talk a big fight, {F}. Tonight there is a ring round you and nowhere to go.'],['I have never run from you, {W}. I have never needed to.'],{heat:3}),
    V('ac_cheat',c=>c.opp==='Story'||c.opp==='Brawl','Say they wrestle like a rulebreaker','A charge about their style, not about anything they did to you.',['You wrestle like somebody who is always checking where the referee is, {F}. Tonight he is checking on you.'],['I win, {W}. That is all anybody needs to know.'],{heat:2,crowd:1}),
    V('ac_reckless',c=>c.opp==='Spectacle','Call them reckless','Safety is a fair charge against a risk-taker.',['You throw yourself around without caring who gets hurt, {F}. I care. Somebody has to.'],['Nobody has ever been hurt by me, {W}. Do not start lying now.'],{cred:1,heat:1}),
    V('ac_words',c=>c.prior,'Bring up what was said last time','A callback to your last confrontation.',['Last time we stood here, words were spoken, {F}. I remember every one of them.'],['So do I, {W}. I meant every one.'],{heat:2,evidence:true}),
    V('ac_fake',c=>c.won,'Say they have been telling themselves a story','A charge drawn from your last win.',['You lost to me last time, {F}, and you have been telling yourself a story about it ever since.'],['The only story is tonight’s, {W}. No handshake.'],{heat:2}),
    V('ac_humiliation',c=>c.mem==='humiliation','Bring up the decisive defeat','A real grievance from a humiliating loss.',['You beat me decisively last time, {F}. I have had to hear about it every day since. You will not enjoy tonight as much.'],['It was easy, {W}. It will be easy again.'],{heat:4,evidence:true})
   ],
   swagger:[
    V('sw_main',c=>c.ego>=75,'Declare yourself the main event','Pure ego. Works if the crowd buys it.',['Whatever slot they gave me, the main event starts when I walk out.'],['Main event? You are lucky to be on the card, {W}.'],{crowd:1,heat:1}),
    V('sw_finisher',c=>c.finisher,'Brag about your finishing move','Name the move everyone knows.',['Everybody in this building knows what {FINISHER} does. Ask the last three people who took it.'],['I have seen {FINISHER}. I have also seen it miss.'],{crowd:2}),
    V('sw_jacket',c=>c.micHigh,'Show off for the crowd','Flashy, and it might annoy them.',['Look at this jacket, {F}. It costs more than your wages. It will be the only thing in the ring without a mark on it tonight.'],['Nice jacket, {W}. Shame about the wrestler wearing it.'],{heat:2,risk:1}),
    V('sw_easy',c=>c.won,'Brag about beating them easily','Rub the last win in.',['I beat you once and barely broke a sweat, {F}. I am only here because the promoter asked nicely.'],['Barely broke a sweat? I remember it differently, {W}.'],{heat:3}),
    V('sw_future',c=>c.fresh&&c.ego>=60,'Call yourself the future','Young and confident.',['You are yesterday’s headline, {F}. I am tomorrow’s.'],['Tomorrow can wait, {W}. Tonight is mine.'],{crowd:1}),
    V('sw_ignore',c=>c.grudge,'Pretend they do not matter','Dismissive. A gamble in a hot feud.',['Sorry, who am I wrestling tonight? Oh. {F}. Right.'],['You know exactly who I am, {W}. You think about me every day.'],{heat:3,risk:1}),
    V('sw_belt',c=>c.pro>=70,'Talk about the championship','Raise the stakes beyond tonight.',['There is a championship in this territory with my name already on it. You are just in my way, {F}.'],['Then you will have to get past me first, {W}.'],{cred:1}),
    V('sw_pose',c=>c.micLow,'Strike a pose and keep it short','Let the look do the work.',['Take a good look, {F}. This is what winning looks like.'],['I am looking, {W}. I do not see it.'],{crowd:1,risk:-1}),
    V('sw_money',c=>c.ego>=65,'Talk about money','Arrogant, and certain to draw heat.',['I make more in one night than you make in a month, {F}. Tonight I will earn every penny.'],['Spend it on a doctor, {W}. You will need one.'],{heat:2,trust:-1})
   ]
  },
  answer:{
   turn:[
    V('tu_quote',c=>c.micHigh,'Repeat their own words back','Sharp, if you remember them exactly.',['You said it yourself, {F}. Remember those exact words when you are looking up at the lights.'],['Keep quoting me, {W}. It is the closest you will get to being good.'],{crowd:1,risk:1}),
    V('tu_record',c=>c.thread==='proof'&&c.hist,'Use their record against them','Turn the record argument around.',['You keep pointing at the record. Records get broken, {F}.'],['Then come and try to break it.'],{cred:1}),
    V('tu_crowd',c=>c.thread==='people','Let the crowd answer for you','You opened with the people. Lean on them.',['You heard what they think of that answer, {F}. I do not need to add anything.'],['They will change their minds when I win.'],{crowd:2}),
    V('tu_tech',c=>c.opp==='Technical','Turn their technique into a weakness','Technique is predictable.',['All that technique, {F}, and you still had to explain yourself. Technique is predictable.'],['Predictable, and you still could not stop it.'],{cred:1}),
    V('tu_anger',c=>c.opp==='Brawl','Turn their aggression against them','Bait the brawler.',['All that anger is going to make you careless, {F}. I am counting on it.'],['Count on this, {W}: I hit harder when I am angry.'],{heat:1}),
    V('tu_flash',c=>c.opp==='Spectacle','Turn their flashiness against them','One miss is all you need.',['You need the crowd to love every move, {F}. I only need one of yours to miss.'],['I do not miss, {W}.'],{cred:1}),
    V('tu_stall',c=>c.opp==='Story','Say they are stalling again','Call out the delaying tactic.',['There you go again, talking to waste time. The bell will not wait for you, {F}.'],['Neither will I.'],{cred:1}),
    V('tu_learned',c=>c.lost,'Say losing taught you their tricks','Turn the defeat into preparation.',['You beat me with that once, {F}. Now I know exactly what it looks like.'],['Knowing it is coming does not mean you can stop it.'],{cred:2}),
    V('tu_strength',c=>true,'Answer the strength they named','Directly address their claim.',['You are proud of your {STRENGTH}, {F}. That tells me exactly what I have to prepare for.'],['Prepare all you like, {W}.'],{})
   ],
   personal:[
    V('pe_injury',c=>c.mem==='hurt','Bring up the injury','A real grievance. Very personal.',['I went home hurt after our last match, {F}. I have thought about you every day since. Not fondly.'],['I am not your nurse, {W}.'],{heat:3,evidence:true}),
    V('pe_humiliation',c=>c.mem==='humiliation','Bring up the humiliation','Personal history the crowd will feel.',['Everybody in this building saw you beat me last time, {F}. I have not been allowed to forget it.'],['Then do not give me a reason to do it again.'],{heat:3,evidence:true}),
    V('pe_respect',c=>c.hist,'Say they never respected you','Draw on your shared history.',['You have never respected me, {F}. Not once, not in the ring, not in the back.'],['Respect is earned, {W}. Earn it tonight.'],{heat:2,evidence:true}),
    V('pe_jealous',c=>c.ego>=70,'Say they are jealous','Ego meets ego.',['You are jealous of me, {F}. Everyone can see it.'],['Jealous? Of what, exactly?'],{heat:2}),
    V('pe_grudge',c=>c.grudge,'Make it clear this is a grudge','Admit this is no longer about wrestling.',['This stopped being about wrestling a long time ago, {F}.'],['For once we agree.'],{heat:3}),
    V('pe_career',c=>c.pro>=80,'Question their career','A veteran’s dismissal.',['You have been around for years, {F}, and what do you have to show for it?'],['More than you will have by the end of tonight.'],{heat:2}),
    V('pe_threat',c=>c.ego>=75&&c.grudge,'Make a threat','Dangerous. The promoter is listening.',['When this is over, {F}, you will be lucky to walk back through that curtain.'],['Threats are cheap, {W}. Show me.'],{heat:4,trust:-3,risk:1}),
    V('pe_reputation',c=>c.noHist,'Question their reputation','A claim with nothing behind it.',['I do not know you, {F}, but I know your reputation. It is not a good one.'],['You do not know me at all. That is your problem.'],{heat:1}),
    V('pe_seethrough',c=>c.thread==='people','Say the crowd sees through them','Personal, with the audience on your side.',['These people see right through you, {F}. They always have.'],['These people pay to see me win.'],{heat:2,crowd:1})
   ],
   callback:[
    V('cb_storm',c=>c.thread==='imagery'&&c.grudge,'Bring back the storm','Extend the opening picture.',['I told you the storm was coming, {F}. You can hear it now.'],['I hear it. I am still not moving.'],{crowd:2}),
    V('cb_people',c=>c.thread==='people','Point back to the fans','Close the loop on your opening.',['I started with these people, {F}, and I will finish with them.'],['They will be cheering for me by the end.'],{crowd:2}),
    V('cb_tape',c=>c.thread==='proof'&&c.hist,'Go back to the tape','Return to your evidence.',['Everything I said about that match still stands, {F}. You did not answer one point.'],['I do not need to. I won it.'],{cred:2}),
    V('cb_charge',c=>c.thread==='accusation','Press the accusation again','Make them answer the charge.',['You still have not denied it, {F}. Interesting.'],['I do not answer nonsense.'],{heat:2}),
    V('cb_lights',c=>c.thread==='swagger','Bring back the spotlight','Keep the act going.',['The lights are still on me, {F}. You noticed.'],['Enjoy them while you can.'],{crowd:1}),
    V('cb_first',c=>c.hist,'Bring up the first time you met','Use your actual history.',['The first time we met, {F}, you would not even look me in the eye. Look at me now.'],['I am looking, {W}.'],{cred:1,evidence:true}),
    V('cb_promise',c=>c.prior,'Remind them of your last promise','Tie this to your previous promo.',['Last time I made a promise in front of these people. I remember it, {F}. So do they.'],['So do I. You did not keep it.'],{heat:1}),
    V('cb_finisher',c=>c.finisher&&c.thread==='swagger','Bring back the finishing move','Remind them what you threatened.',['Remember what I said about {FINISHER}, {F}? It is still coming.'],['Let it come.'],{crowd:1}),
    V('cb_image',c=>c.thread==='imagery','Return to the opening image','Finish the picture you started.',['Remember what I said about {THEME}, {F}? You have not heard the end of it.'],['I heard it. It did not scare me.'],{crowd:2})
   ],
   calm:[
    V('ca_simple',c=>c.micLow,'Take a breath and keep it simple','Short and steady.',['I am not going to shout, {F}. I will see you in the ring.'],['Fine. The ring it is.'],{cred:1,risk:-1}),
    V('ca_pro',c=>c.pro>=80,'Answer like a professional','Nothing personal, all business.',['I have nothing personal against you, {F}. I just want to win.'],['That makes two of us.'],{trust:2}),
    V('ca_smile',c=>c.ego>=70,'Smile and let them talk','Confidence without shouting.',['Go ahead and have the last word, {F}. I will have the last count.'],['We will see who is counting.'],{crowd:1}),
    V('ca_fans',c=>c.thread==='people','Let the fans decide','Hand the argument to the audience.',['The fans will decide who is right, {F}. They always do.'],['They will decide I am right.'],{crowd:1}),
    V('ca_respect',c=>c.won,'Show respect for the last match','Gracious in victory.',['You gave me a hard fight last time, {F}. I expect a harder one tonight.'],['You will get one.'],{cred:2,trust:1}),
    V('ca_healing',c=>c.mem==='hurt','Admit you are still recovering','Honest and sympathetic.',['I am not fully healed, {F}. I am here anyway.'],['I will remember that when I find the weak spot.'],{crowd:2,cred:2}),
    V('ca_humble',c=>c.lost,'Stay humble about the loss','No excuses.',['You won last time. I am not going to pretend otherwise. Tonight is a new match.'],['A new match with the same ending.'],{cred:2}),
    V('ca_restraint',c=>c.grudge,'Stay calm despite the grudge','Restraint in a heated feud reads as strength.',['I could shout at you, {F}. It would not help either of us.'],['Then stop talking.'],{cred:2,heat:-1}),
    V('ca_long',c=>c.pro>=85,'Talk about the long game','A veteran’s patience.',['I have been doing this a long time, {F}. Matches are won in the last minute, not the first.'],['Then I will finish it before the last minute.'],{cred:2})
   ],
   challenge:[
    V('ch_now',c=>c.grudge,'Challenge them to start now','Hot-headed, but the crowd loves it.',['Why wait for the bell, {F}? I am right here.'],['The bell is coming soon enough.'],{heat:2,crowd:1,trust:-1}),
    V('ch_one_fall',c=>c.pro>=70,'One fall, nobody else involved','A clear wrestling challenge.',['One fall, {F}. Nobody else involved. Just you and me.'],['Just you and me. Agreed.'],{cred:1}),
    V('ch_twice',c=>c.lost,'Dare them to beat you twice','Turn the defeat into a challenge.',['You got your win, {F}. Now let us see if you can do it twice.'],['Twice. Three times. As often as it takes.'],{heat:1}),
    V('ch_mat',c=>c.opp==='Technical','Challenge them on the mat','Fight them where they are strongest.',['You think you are the better wrestler, {F}? Then meet me on the mat and prove it.'],['Gladly. That is where I am strongest.'],{cred:2}),
    V('ch_trade',c=>c.opp==='Brawl','Challenge them to stand and trade','Brave, maybe foolish.',['No holds, no tricks. Stand in the middle and trade with me, {F}.'],['That is the smartest thing you have said all night.'],{heat:2,risk:1}),
    V('ch_ground',c=>c.opp==='Spectacle','Challenge them to stay on the ground','Take away their best weapon.',['Stay on the canvas with me, {F}, if you can.'],['I will go wherever I like.'],{cred:1}),
    V('ch_stay',c=>c.opp==='Story','Dare them not to leave the ring','Stop the stalling before it starts.',['Do not leave the ring tonight, {F}. Stay and fight.'],['I will leave whenever I want.'],{heat:1}),
    V('ch_hand',c=>c.pro>=85,'Offer a handshake as a challenge','Sporting and pointed.',['Shake my hand, {F}, and then try to beat me.'],['I will shake it afterwards. Maybe.'],{trust:1,cred:1}),
    V('ch_witness',c=>c.thread==='people','Ask the crowd to hold them to it','Make the audience your witness.',['Everyone here heard me, {F}. Are you going to answer?'],['I will answer in the ring.'],{crowd:2})
   ]
  },
  close:{
   vow:[
    V('vo_guarantee',c=>c.ego>=75,'Guarantee it','The boldest version.',['I guarantee it, {F}. You will not walk out of here a winner.'],['Then you had better be right.'],{heat:2,risk:1}),
    V('vo_fans',c=>c.thread==='people','Promise the win to the fans','Make the victory theirs.',['This win is for every one of you.'],['Do not make promises you cannot keep.'],{crowd:2}),
    V('vo_avenge',c=>c.lost,'Promise to avenge the loss','A redemption vow.',['Last time was your night, {F}. Tonight I take it back.'],['Try.'],{heat:2,crowd:1}),
    V('vo_twice',c=>c.won,'Promise to make it two in a row','Build on the last result.',['I beat you once, {F}. Tonight I make it twice.'],['Not this time.'],{heat:1}),
    V('vo_plain',c=>c.micLow,'Just say you will win','Short and clear.',['I will win. That is all.'],['We will see.'],{risk:-1}),
    V('vo_injured',c=>c.mem==='hurt','Promise to win despite the injury','Brave words with a real stake.',['Whatever happens to me tonight, {F}, I will win.'],['We will find out how much you can take.'],{crowd:2,heat:1}),
    V('vo_end',c=>c.grudge,'Promise to end the feud','Draw a line under it.',['When this is over, {F}, this feud is over too, and I will be the one standing.'],['It will be over. You will not be standing.'],{heat:2}),
    V('vo_quick',c=>c.ego>=70&&c.opp!=='Story','Promise a quick win','Arrogant. Dangerous if the match goes long.',['This will not take long, {F}.'],['Famous last words.'],{heat:2,risk:1}),
    V('vo_hard',c=>c.pro>=75,'Promise a hard-earned win','Honest about the difficulty.',['It will not be easy, {F}. I will still win.'],['At least you know it will be hard.'],{cred:2})
   ],
   finisher:[
    V('fi_count',c=>c.micHigh,'Count down to the finisher','Theatrical and specific.',['Three moves, {F}. Then {FINISHER}. Then it is over.'],['Three moves? You will not get one.'],{crowd:2,risk:1}),
    V('fi_again',c=>c.won,'Remind them they have felt it before','They know what is coming.',['You have felt {FINISHER} before, {F}. You know it is coming again.'],['I know. That is why it will not work this time.'],{heat:1}),
    V('fi_intro',c=>c.noHist,'Introduce the finisher','A first warning.',['You have never felt {FINISHER}, {F}. Ask around.'],['I have asked. I am not worried.'],{}),
    V('fi_air',c=>c.opp==='Spectacle','Promise to catch them in the air','Specific to a high flyer.',['Fly as much as you like, {F}. I will catch you, and then it is {FINISHER}.'],['You will have to catch me first.'],{cred:1}),
    V('fi_no_counter',c=>c.opp==='Technical','Promise a finisher they cannot counter','A challenge to their technique.',['You know every counter in the book, {F}. There is no counter to {FINISHER}.'],['There is a counter to everything.'],{cred:1}),
    V('fi_outlast',c=>c.opp==='Brawl','Promise to outlast them, then finish','A plan as well as a threat.',['You will throw everything you have, {F}. When you are tired, I hit {FINISHER}.'],['I do not get tired.'],{cred:2}),
    V('fi_count_along',c=>c.thread==='people','Let the crowd call the finisher','Make the move a crowd moment.',['When you see me set up {FINISHER}, I want to hear every one of you.'],['They will be quiet when it misses.'],{crowd:2}),
    V('fi_payback',c=>c.grudge,'Promise the finisher as payback','Personal and specific.',['{FINISHER} is for everything you have done, {F}.'],['Then you had better hit it.'],{heat:2}),
    V('fi_name',c=>c.micLow,'Just name it','One word does the job.',['{FINISHER}. Tonight.'],['We will see.'],{risk:-1})
   ],
   clean:[
    V('cl_hand',c=>c.pro>=75,'Offer a handshake','A sporting gesture.',['Shake my hand, {F}. No shortcuts tonight.'],['I will think about it.'],{trust:2}),
    V('cl_ref',c=>c.opp==='Story','Ask the referee to watch closely','Their style suggests tricks.',['Referee, keep your eyes on {F} all night.'],['Worry about yourself, {W}.'],{cred:1}),
    V('cl_tights',c=>c.lost,'Demand no repeat of last time','Point at how the last match went.',['Whatever happened last time, {F}, tonight there are no shortcuts. No tights, no ropes.'],['I will win however I like.'],{heat:2,cred:1}),
    V('cl_watch',c=>c.thread==='people','Let the fans keep watch','Make everyone a referee.',['Every one of you is a referee tonight. Watch {F} closely.'],['Let them watch.'],{crowd:2}),
    V('cl_middle',c=>c.opp==='Technical'||c.pro>=80,'State the terms','A purist’s demand.',['One fall, clean, in the middle of the ring. That is how real wrestlers settle things.'],['Agreed.'],{cred:2,trust:1}),
    V('cl_no_target',c=>c.mem==='hurt','Say you will not attack their injuries cheaply','Ask for the same in return.',['I will not go after an injury cheaply, {F}. I expect the same from you.'],['No promises.'],{cred:2}),
    V('cl_hate',c=>c.grudge,'Demand a fair fight despite everything','Hatred without cheating.',['I cannot stand you, {F}. I will still beat you fairly.'],['Fairly? We will see.'],{cred:2,heat:1}),
    V('cl_again',c=>c.won,'Promise the same clean fight as last time','A consistent standard.',['Last time was clean. Tonight will be too.'],['Fine.'],{trust:1}),
    V('cl_dare',c=>c.ego>=70,'Dare them to cheat','Confident, and it raises the stakes.',['Go on, {F}, cheat. Everyone will see it.'],['I will not need to.'],{heat:2})
   ],
   uncertainty:[
    V('un_plan',c=>c.psych>=75,'Say you have a plan','A smart worker’s threat.',['I have a plan for you, {F}. You will find out what it is.'],['I have one for you too.'],{cred:2}),
    V('un_new',c=>c.lost,'Hint at something new','Something has changed since last time.',['I have been working on something since our last match, {F}.'],['So have I.'],{heat:1}),
    V('un_done',c=>c.micLow,'End it there','Say no more.',['That is all I have to say.'],['Good.'],{risk:-1}),
    V('un_see',c=>c.thread==='people','Leave it to the crowd','Keep the audience waiting.',['You will see tonight. All of you.'],['They will see you lose.'],{crowd:1}),
    V('un_tape',c=>c.opp==='Technical','Say they can study all they like','Take away the tape advantage.',['Study all the tape you want, {F}. Tonight will not be on any of it.'],['Everybody has habits.'],{cred:1}),
    V('un_ready',c=>c.opp==='Brawl','Say you will be ready','Calm against a charger.',['When you come charging in, {F}, I will be ready. That is all I will say.'],['Ready will not be enough.'],{}),
    V('un_look',c=>c.opp==='Spectacle','Tell them to keep looking up','Misdirection.',['Keep looking up, {F}. That is not where I will be.'],['I see everything.'],{crowd:1}),
    V('un_unsaid',c=>c.grudge,'Leave the threat unspoken','Menace by implication.',['I do not need to tell you what happens next, {F}.'],['Go on, then. Tell me.'],{heat:2}),
    V('un_bigger',c=>c.ego>=70,'Hint at bigger plans','Tonight is just a step.',['Tonight is just one step, {F}. You will not see the rest coming.'],['There is no rest if you lose tonight.'],{})
   ],
   question:[
    V('qu_strikes',c=>c.opp==='Brawl','Promise to counter their punches','A specific counter vow against a striker.',['Throw your best punch, {F}. I will catch it and turn it around.'],['You will not see it coming.'],{counter:['strike','heel','running','fire']}),
    V('qu_holds',c=>c.opp==='Technical','Promise to escape their holds','A counter vow against a mat wrestler.',['Lock on any hold you like, {F}. I will reverse it.'],['Nobody reverses my holds.'],{counter:['submission','rest','chain','ground']}),
    V('qu_air',c=>c.opp==='Spectacle','Promise to catch them in the air','A counter vow against a high flyer.',['Go to the top rope, {F}. I will be waiting.'],['You will be waiting on your back.'],{counter:['aerial','springboard','lucha','dive','running']}),
    V('qu_tricks',c=>c.opp==='Story','Promise to turn their tricks around','A counter vow against a ring general.',['Every trick you try tonight, {F}, I will turn around on you.'],['You will not even notice them.'],{counter:['heel','strike','pin']}),
    V('qu_studied',c=>c.hist,'Say you know their offence by heart','A counter vow based on your history.',['I know your offence by heart now, {F}. Every move has a counter.'],['Then you know how much it hurts.'],{cred:1}),
    V('qu_reverse_loss',c=>c.lost,'Promise to reverse what beat you','Redemption through a counter.',['What beat me last time will not work again, {F}. I will reverse it.'],['It worked once. It will work again.'],{heat:1}),
    V('qu_watch',c=>c.thread==='people','Ask the fans to watch for the counter','Make the counter a public moment.',['Watch closely tonight. When {F} goes for their best move, I will turn it around.'],['They will be watching you fall.'],{crowd:2}),
    V('qu_big_move',c=>c.won,'Promise to counter their biggest move','A bold vow from the last winner.',['When you go for your big move, {F}, I will turn it around. I beat you once already.'],['Not this time.'],{heat:1}),
    V('qu_simple',c=>c.micLow,'Say you will counter them','Short and plain.',['You attack, I counter. Simple.'],['We will see.'],{risk:-1})
   ]
  }
 };
 function context(st){
  const h=st.history?.[0],fin=h?.finish||'',heat=st.feudHeat||0;
  return {hist:!!h||!!st.hasHistory,noHist:!h&&!st.hasHistory,won:fin.startsWith('win'),lost:fin.startsWith('lose'),
   grudge:heat>=50,fresh:heat<25,opp:st.f.style,micHigh:st.w.mic>=75,micLow:st.w.mic<50,ego:st.w.ego,pro:st.w.pro,psych:st.w.psych,
   finisher:!!st.w.finisher,mem:st.memory?.kind||null,prior:!!st.priorPromise,thread:st.steps[0]?.id||null,booked:st.contractFinish||'',
   recN:st.record?.n??(st.history?.length||0),recW:st.record?.w??(st.history||[]).filter(x=>String(x.finish||'').startsWith('win')).length};
 }
 // The variant offered for an angle is a pure function of the saved promo state, so the
 // choice the player sees is exactly the one that is played, before and after a reload.
 Object.assign(VARIANTS.open,{
  hometown:[
   V('ht_song',c=>c.micHigh,'Sing them a song about the town','A cruel little song. It has more verses.',['“Oh, {VENUE}, your car park floods, your chip shop shuts at nine…” I wrote that in the van, {F}. There are more verses. You do not deserve them.'],['Nice song, {W}. By the end of the night this town will be singing mine.'],{crowd:-1,heat:2,risk:1}),
   V('ht_hero',c=>c.won,'Remind them their favourite lost to you','Reopen an old wound. Every boo is earned.',['You remember the last time I wrestled {F}? Your favourite went home beaten. None of you have forgiven me. Good.'],['They have not forgiven you, {W}, because I have not finished with you.'],{heat:2}),
   V('ht_fake',c=>c.ego>=70,'Tell them someone special is coming','Get their hopes up. Then don’t.',['I have a surprise for you, {VENUE}. Someone very special is here tonight… No. Of course not. Who would come here?'],['This town does not need anybody to save it from you, {W}. It has me.'],{heat:2,crowd:-1}),
   V('ht_journey',c=>c.noHist,'Complain about the journey','Petty, specific, very effective.',['Three hours on the motorway to get here, {F}, and the services had run out of sandwiches. Somebody is paying for that tonight.'],['You can have a sandwich afterwards, {W}. You will be eating it lying down.'],{crowd:1}),
   V('ht_carpark',c=>c.opp==='Brawl','Say this town only respects a brawler','Sneer at the local hero’s style.',['This is a town that settles things in car parks, so I understand why you all like {F}. I settle things in the ring, where the rules are written down.'],['Rules or no rules, {W}, you are still in my town.'],{cred:1,heat:1}),
   V('ht_fair',c=>c.pro>=80,'Insult the building, respect the people','Insult the roof, not the punters.',['The roof leaks, the heating is broken and the bar has one pump. And you still came. I respect you. I do not respect {F}.'],['Nice save, {W}. They all heard the first half.'],{crowd:2,heat:-1}),
   V('ht_backing',c=>c.grudge,'Tell them they are backing a loser','Make them complicit in the defeat.',['Keep cheering {F} like it is going to help. It did not help last time, and it will not help tonight.'],['Keep talking, {W}. Every word makes them louder.'],{heat:3}),
   V('ht_plain',c=>c.micLow,'Just say you hate it here','Short and nasty.',['I do not like it here. I will not be staying.'],['Then do everyone a favour and lose quickly, {W}.'],{cred:1,risk:-1})
  ],
  numbers:[
   V('nu_record',c=>c.hist&&c.won&&c.recN>0&&c.recW===c.recN,'Quote the head-to-head','A hundred per cent is hard to argue with.',['Played {RECN}, won {RECW}, {F}. That is a hundred per cent. You cannot beat a hundred per cent. I have checked.'],['A small sample, {W}. Ask anyone with a calculator.'],{cred:1}),
   V('nu_lost',c=>c.lost,'Explain why the last loss doesn’t count','Creative accounting with a straight face.',['Yes, you won last time, {F}. But take away the bit where I lost and I was ahead for most of it. Statistically, I won that match.'],['Statistically you were on your back for three seconds, {W}.'],{crowd:2,cred:-1}),
   V('nu_flight',c=>c.opp==='Spectacle','Work out their flight path','Physics, delivered badly.',['You come off the top rope at about forty miles an hour, {F}. I weigh more than a fridge. That is physics, and physics is on my side.'],['Then physics had better catch me, {W}.'],{crowd:1}),
   V('nu_minutes',c=>c.psych>=75,'Count the minutes they can last','A bluff about their stamina. It lands if they believe you have done the sums.',['I have timed you, {F}. I know roughly when you start to fade, and we are booked for long enough. Do the subtraction.'],['Time me tonight, {W}. Bring a calendar.'],{cred:2}),
   V('nu_poll',c=>c.micHigh,'Poll the crowd','Hands up. Interactive maths.',['Hands up who thinks {F} wins tonight. Now hands up who can count. Thank you. My point exactly.'],['They can count, {W}. They will be counting to three over you.'],{crowd:2,risk:1}),
   V('nu_wages',c=>c.ego>=75,'Work out what they are worth','It is just basic economics.',['I get paid more than {F}. That means I am worth more than {F}. That means I win. It is basic economics.'],['Then I will cost you money tonight, {W}.'],{heat:2}),
   V('nu_odds',c=>c.noHist,'Give them odds','A bookie’s confidence.',['The bookies have {F} at eleven to one. I have them at never. I am a better bookie.'],['Put your money on it, {W}. I will collect.'],{crowd:1}),
   V('nu_plain',c=>c.micLow,'Say the numbers are on your side','You are not sure which numbers.',['The numbers say I win. I do not know which numbers. But they say it.'],['The only number that matters is three, {W}.'],{crowd:1,risk:-1})
  ]
 });
 Object.assign(VARIANTS.answer,{
  confession:[
   V('co_hurt',c=>c.mem==='hurt','Admit the injury still haunts you','The body remembers. So will they.',['I still feel that night every time I get out of the car, {F}. Every step to this ring, I am going to remember who put me there.'],['Then remember who will do it again, {W}.'],{crowd:2}),
   V('co_shame',c=>c.mem==='humiliation','Admit the humiliation still burns','They still laugh. Make it count.',['People still laugh about what happened, {F}. In the chip shop. At the petrol station. I want one night where they laugh at you.'],['They will laugh at you again, {W}. I will make sure of it.'],{heat:2}),
   V('co_drive',c=>c.lost,'Admit the last loss broke something','Quiet, specific, devastating.',['When you beat me, {F}, I sat in the car on my drive for an hour. I did not go in. That is what you took.'],['I did not take anything, {W}. I won it.'],{crowd:2,cred:1}),
   V('co_fear',c=>c.grudge,'Say you are frightened of yourself','The threat is you, not them.',['I am frightened, {F}. I know what I am like when I stop caring. Tonight, I have stopped caring.'],['I am not frightened of you, {W}. Not one bit.'],{heat:3,risk:1}),
   V('co_home',c=>c.pro>=80,'Talk about what it costs at home','The life outside the ring.',['My family asked me not to come tonight, {F}. I came anyway. That is what you have turned me into.'],['Nobody made you come, {W}. You came to lose.'],{crowd:1,heat:1}),
   V('co_stop',c=>c.ego<55,'Ask someone to stop the match','A plea that sounds like a warning.',['If anybody backstage has any sense, they will call this off, {F}. Because I will not.'],['Nobody is calling anything off, {W}. Get in the ring.'],{heat:2}),
   V('co_plain',c=>c.micLow,'Admit it plainly','No speech. Just the truth.',['I have not been myself, {F}. That is your fault. Tonight you find out what that means.'],['Be yourself, {W}. It still will not be enough.'],{risk:-1}),
   V('co_turn',c=>c.micHigh,'Go from tears to a threat','The switch is the whole promo.',['Look at me, {F}. Go on. These are not tears for me. They are for you, because of what happens next.'],['Save the tears for afterwards, {W}. You will need them.'],{crowd:2,heat:2,risk:1})
  ],
  fakeout:[
   V('fa_music',c=>c.micHigh,'Pretend help is about to arrive','Wait for the music. There is no music.',['Somebody cue the music for {F}’s best friend. … Nothing? Funny, that. Even the sound man has given up on you.'],['I do not need anybody, {W}. I never have.'],{crowd:1,heat:2}),
   V('fa_partner',c=>c.grudge,'Hint at a mystery partner','Somebody is watching. Maybe.',['I have spoken to somebody about you, {F}. Somebody you know. They will be watching tonight. That is all I am saying.'],['Bring whoever you like, {W}. I will beat them too.'],{heat:3}),
   V('fa_retire',c=>c.ego>=75,'Announce your retirement. Sort of.','Get them cheering, then take it back.',['I have an announcement. After tonight, I am retiring… from losing to people like you, {F}. Got you. You looked so happy.'],['Enjoy the joke, {W}. You will not be laughing in twenty minutes.'],{crowd:2,risk:1}),
   V('fa_rematch',c=>c.won,'Offer them a rematch, then don’t','Dangle it, then pull it away.',['You want a rematch, {F}? Fine. You can have one. In a year. Maybe two. If I feel like it.'],['You already gave me one, {W}. It is tonight.'],{heat:2}),
   V('fa_limp',c=>c.mem==='hurt','Fake a limp','Sympathy, for about four seconds.',['Oh, my knee. My poor knee, {F}. Go easy on me. … I am joking. It is fine. Yours will not be.'],['Keep limping, {W}. I will give you a reason.'],{heat:2}),
   V('fa_call',c=>c.noHist,'Take a pretend phone call','Rude, and they cannot stop watching.',['Sorry, {F}, I have to take this. … It is your mum. She says she is backing me.'],['Leave my mother out of it, {W}.'],{crowd:2}),
   V('fa_mic',c=>c.ego>=55&&c.psych<60,'Pretend the microphone is off','Then admit it was on all along.',['Is this on? … It is? Then you heard all of that, {F}. Good.'],['I heard nothing worth hearing, {W}.'],{risk:-1}),
   V('fa_chant',c=>c.thread==='people'||c.thread==='hometown','Pretend they are chanting your name','Conduct a chant that is not happening.',['Listen to them chanting my name, {F}. … That is your name? Give it twenty minutes.'],['They know who they came for, {W}.'],{crowd:1})
  ]
 });
 Object.assign(VARIANTS.close,{
  legacy:[
   V('le_lost',c=>c.lost,'Say what losing taught you','Everybody loses. Not everybody learns.',['You beat me, {F}. Fair enough. Everybody loses. What matters is what you do on the drive home, and I have been driving ever since.'],['Keep driving, {W}. You will still lose.'],{cred:2}),
   V('le_won',c=>c.won,'Say the score is not the point','Nobody remembers the score.',['I beat you once, {F}, and nobody remembers the score. They remember whether it was any good. Let us give them that.'],['They will remember this one, {W}, because I win it.'],{crowd:2}),
   V('le_road',c=>c.pro>=85,'Talk about the years on the road','A career in leisure centres and cattle markets.',['I have done this in leisure centres, car parks and a cattle market. I want them to say I never once short-changed anybody who paid to watch.'],['Respect, {W}. It still does not get you the win.'],{cred:3,trust:1}),
   V('le_walk',c=>c.mem==='hurt','Say you will be remembered for walking back in','They carried you out. You came back.',['They carried me out last time, {F}. I want them to remember that I walked back in.'],['I will carry you out again, {W}.'],{crowd:3}),
   V('le_name',c=>c.noHist,'Say what you want your name to mean','Nobody knows it yet.',['Nobody knows my name yet, {F}. When they learn it, I want them to learn it from a night like this.'],['They will learn it as the name I beat.'],{crowd:2}),
   V('le_feud',c=>c.grudge,'Say how this feud will be remembered','The insults fade; the result does not.',['In ten years nobody will remember the insults, {F}. They will remember who was standing at the end.'],['Then remember it was me.'],{heat:2}),
   V('le_plain',c=>c.micLow,'Keep it simple','One sentence about effort.',['I just want them to say I gave everything. Tonight, I will.'],['Give everything, {W}. It will not be enough.'],{risk:-1}),
   V('le_rival',c=>c.hist,'Tell them how they will be remembered','Even the rival gets a line in the story.',['You will be remembered too, {F}. As the one who made me better.'],['I will be remembered as the one who beat you, {W}.'],{cred:2,crowd:1})
  ],
  grateful:[
   V('gr_waited',c=>c.mem==='hurt','Thank them for waiting for you','You were hurt. They waited.',['You waited while I was hurt. You sent cards. One of you sent a cake. Tonight is for you.'],['Enjoy the applause, {W}. It is the last you will get tonight.'],{crowd:3}),
   V('gr_stuck',c=>c.lost,'Thank them for sticking with you','They saw you lose and came back.',['You saw me lose to {F}, and you came back anyway. I do not know what I did to deserve that.'],['Nothing, {W}. That is the point.'],{crowd:2,trust:1}),
   V('gr_rival',c=>c.pro>=80,'Thank the opponent as well','Generous. Then dangerous.',['And thank you, {F}. I mean it. Nobody makes me work harder. Now I am going to beat you.'],['Thank me afterwards, {W}. If you can still talk.'],{cred:2}),
   V('gr_crew',c=>c.psych>=70,'Thank the people who built the ring','The crew never get a cheer.',['Somebody put this ring up at four o’clock this afternoon and will take it down at midnight. Tonight is for them.'],['Lovely speech, {W}. They can sweep you up with the chairs.'],{crowd:2,trust:2}),
   V('gr_trainer',c=>c.noHist,'Thank the person who trained you','Row four, a proud face.',['My first trainer is in tonight. Row four. Everything I do right in that ring, I learned from them.'],['Then they can watch you lose, {W}.'],{crowd:2}),
   V('gr_town',c=>c.micHigh,'Thank the town by name','Make the whole hall feel chosen.',['Thank you, {VENUE}. Out of every room I have wrestled in, this is the one I tell people about.'],['They will tell people about this one too, {W}. How you lost it.'],{crowd:3,risk:1}),
   V('gr_plain',c=>c.micLow,'Just say thank you','Two words. Mean them.',['Thank you. That is all I wanted to say.'],['Say it again afterwards, {W}. If you can.'],{crowd:1,risk:-1}),
   V('gr_turn',c=>c.grudge,'Thank them, then turn on the opponent','Warmth for them, ice for {F}.',['Thank you, all of you. Not you, {F}. You I will deal with in a minute.'],['Any time you are ready, {W}.'],{crowd:2,heat:2})
  ]
 });
 function variantFor(st,stage,id){
  if(!st?.w||!VARIANTS[stage]?.[id])return null;
  const c=context(st),list=VARIANTS[stage][id].filter(v=>{try{return !!v.when(c)}catch(e){return false}});
  if(!list.length)return null;
  // v0.3.12 A wrestler does not reuse the exact lines from their last promo against this opponent
  // when they have something else that fits; a deliberate repeat comes through the rivalry case.
  const fresh=list.filter(v=>!(st.avoid||[]).includes(v.id));
  const pool=fresh.length?fresh:list;
  return pool[Math.floor(rng(st.seed,stage+'|'+id+'|variant|'+st.steps.map(s=>s.id).join('>'))*pool.length)];
 }
 const offered=(stage,st)=>Object.keys(NODES[stage]||{}).filter(id=>{const w=NODES[stage][id].when;if(!w||!st)return true;try{return !!w(context(st))}catch(e){return false}});
 // v0.3.12 THE ARGUMENT UNDERNEATH. A rivalry case rides on one of the existing nodes, so the flow and
 // the button count stay the same: an opening that raises (or pre-empts) a recorded issue, five answers
 // that each take a different position on the other wrestler's actual reply, and a close that can make
 // the commitment official. What is shown is exactly what is played.
 function caseOption(st,stage,id){
  if(!st)return null;
  if(stage==='open'){
   const k=(st.cases||[]).find(x=>x.angle===id);if(!k)return null;
   return {id,label:k.label,hint:k.hint+(k.owner==='f'?' '+st.f.short+' will bring it up whatever you open with.':''),variant:'case:'+k.issue,evidence:k.evidence,case:k.issue};
  }
  if(stage==='answer'){
   const r=st.case?.responses?.[id];if(!r)return null;
   return {id,label:r.label,hint:r.hint+(r.expose?' Your own record can be thrown back at you.':''),variant:'case:'+st.case.issue+':'+id,caseResponse:true};
  }
  if(stage==='close'){
   const k=st.case?.commit;if(!k?.node||k.node!==id)return null;
   return {id,label:k.label,hint:k.hint,variant:'case-commit:'+k.kind,followsCase:true};
  }
  return null;
 }
 const opts=(stage,st)=>offered(stage,st).map(id=>{
  const entry=NODES[stage][id],v=st?variantFor(st,stage,id):null;let hint=v?format(v.hint,st):entry.hint;let warn='';
  if(st&&stage==='answer'){
   if(id==='personal'&&!st.claim?.hasEvidence)hint+=' You have no incident to substantiate it; the opponent may expose the bluff.';
   if(id==='callback'&&st.claim?.opening!=='imagery'&&!st.claim?.hasEvidence)hint+=' The opening provided little to call back to.';
   if(id==='turn')hint+=' Directly addresses the opponent’s argument about '+(st.claim?.strength||'their strengths')+'.';
  }
  if(st&&stage==='close'){
   if(id==='vow'&&st.contractFinish?.startsWith('lose'))warn+=' The promoter has booked a loss; breaking this public vow will be remembered.';
   if(id==='finisher'&&!st.contractFinish?.startsWith('win'))warn+=' You are booked to lose. A promised finishing victory is unlikely.';
   if(id==='clean'&&st.contractFinish==='win_dirty')warn+=' The written finish is dirty. Your public demand is at risk.';
   if(id==='question')warn+=' The game will verify an actual successful counter, not the match rating.';
   if(st.case?.noPromise&&NODES.close[id].promise!=='none')warn+=' You just told them: no promises tonight.';
  }
  const k=caseOption(st,stage,id);
  if(k)return {...k,hint:k.hint+warn};
  return {id,label:v?format(v.label,st):entry.label,hint:hint+warn,variant:v?.id||null};
 });
 function begin(c,w,f,rival,sheet=null){
  const seed=String(c.id)+'|'+String(c.eventAbs||0)+'|'+String(w.id)+'|'+String(f.id);
  const record=(G.S?.history||[]).filter(h=>h.wid===w.id&&h.rid===f.id).slice(0,3);
  const memory=G.S?.roster?root.OfficeMemory?.view(w.id).entries.find(e=>e.against===f.id)||null:null;
  const sheetContext=sheet?.signed?{focus:sheet.focus||'authentic',payoff:sheet.nodes?.find(x=>x.id==='payoff')?.actions?.[0]||null}:null;
  const st={v:2,cid:c.id,seed,venue:D.PROMOS?.find(x=>x.id===c.pid)?.venue||null,contractFinish:c.finish||null,history:record.map(x=>({finish:x.finish||null,stars:x.stars||null})),memory:memory?{kind:memory.kind,recall:memory.text}:null,sheet:sheetContext,motif:pick(METAPHORS,seed,'metaphor'),w:{id:w.id,name:w.name,short:w.short,mic:w.mic||40,psych:w.psych||45,heat:w.heat||40,ego:w.ego||45,pro:w.pro||60,finisher:w.finisher},
   f:{id:f.id,name:f.name,short:f.short,psych:f.psych||45,heat:f.heat||45,ego:f.ego||45,style:f.style},
   feudHeat:rival?.closed?0:Math.max(c.feudHeat||0,rival?.heat||0),hasHistory:!!rival?.matches,priorPromise:rival?.lastPromo?.promise||null,avoid:(rival?.lastPromo?.path||[]).map(x=>x.variant).filter(Boolean),
   stage:'open',steps:[],claim:null,argument:0,dialogue:[{speaker:'Interviewer',line:pick([
     'Both names are on tonight’s card. What do you have to say before the bell?',
     'The crowd can hear you backstage. What is this match really about?',
     'Your opponent is listening. Is there anything you want to say directly?'
   ],seed,'intro')}],thread:null,metrics:{crowd:0,heat:0,cred:0,trust:0,composure:0,pressure:0},result:null};
  if(st.hasHistory){
   const p=st.priorPromise;
   st.dialogue[0].line=p?.type==='win'?'Last time you promised victory. How do you answer your rival tonight?':
    p?.type==='clean'?'Your last words about a fair fight are still remembered. What happens now?':
    'These two have unfinished business from their previous meeting. What do you say now?';
  }
  // v0.3.12 What the rivalry has on record, and the arguments it supports tonight.
  const Riv=root.OfficeRivalry;
  st.cases=[];st.case=null;
  if(Riv&&G.S){const r=Riv.record(w.id,f.id);st.record={n:r.meetings||0,w:r.w||0,f:r.f||0};try{st.cases=Riv.casesFor(st,c,w,f)||[];}catch(e){if(root.OFFICE_STRICT)throw e;st.cases=[];}}
  return st;
 }
 function chooseStep(st,id){
  if(!st||st.v!==2||!NODES[st.stage]||!NODES[st.stage][id])throw Error('Invalid promo decision');
  const stage=st.stage,act=NODES[stage][id],index=st.steps.length,v=variantFor(st,stage,id),shown=caseOption(st,stage,id);
  const kOpen=stage==='open'&&shown?(st.cases||[]).find(x=>x.angle===id):null;
  const kResp=stage==='answer'&&shown?st.case.responses[id]:null;
  const kClose=stage==='close'&&shown?st.case.commit:null;
  // A pre-emption of the other side's point is an honest opening; pressing your own is a strong one.
  const vfx=kOpen?(kOpen.owner==='f'?{cred:3,heat:-1}:{cred:2,heat:1}):kResp?{...kResp.fx}:kClose?{}:(v?.fx||{});
  const roll=rng(st.seed,stage+'|'+id+'|'+index);
  const skill=limit(st.w.mic*.66+st.w.psych*.28+st.w.heat*.06+st.metrics.composure,0,100);
  const threshold=limit(.32+skill/190-(act.risk+(vfx.risk||0))*.085+(stage==='answer'&&id==='callback'&&st.thread==='imagery'?.13:0),.2,.94);
  const landed=roll<threshold;
  const effect={...act.effect};
  for(const k of ['crowd','heat','cred','trust'])if(vfx[k])effect[k]=(effect[k]||0)+vfx[k];
  for(const [key,val] of Object.entries(effect))st.metrics[key]=(st.metrics[key]||0)+val*(landed?1:(key==='cred'||key==='trust'?-1:.38));
  if(landed){st.metrics.composure+=stage==='answer'&&id==='calm'?4:1}
  else{st.metrics.cred-=4+act.risk;st.metrics.crowd-=act.risk+2}
  if(stage==='open'){
   st.thread=act.identity;st.claim=claimContext(st,id);
   const raise=kOpen||(st.cases||[]).find(x=>x.owner==='f')||null;
   if(raise){
    st.case=JSON.parse(JSON.stringify(raise));st.case.used=true;st.case.raisedBy=kOpen?'w':'f';
    st.claim.evidence=raise.evidence;st.claim.thesis=raise.thesis;if(kOpen)st.claim.hasEvidence=true;
   }
   if(id==='accusation'&&!st.claim.hasEvidence){st.metrics.cred-=6;st.metrics.trust-=2;}
   if(id==='proof'&&st.claim.hasEvidence){st.metrics.cred+=3;}
   if(id==='people'&&st.sheet?.focus==='redemption')st.metrics.crowd+=2;
  }
  if(stage==='answer'){
   const relevance=kResp?kResp.rel:st.case?answerQuality(st,id)-2:answerQuality(st,id);
   if(st.case&&!kResp){st.case.response=id;st.case.resolution='unresolved';}
   st.argument+=relevance;st.metrics.cred+=relevance;
   if(relevance<=-4)st.metrics.crowd-=3;
   if(relevance>=4)st.metrics.crowd+=2;
  }
  if(stage==='answer'&&id==='callback'&&st.thread==='imagery')st.metrics.crowd+=3;
  if(stage==='answer'&&id==='personal'&&st.thread==='accusation')st.metrics.heat+=3,st.metrics.trust-=2;
  if(stage==='close'&&id==='clean'&&st.metrics.trust<0)st.metrics.cred-=3;
  const line=pick(v?v.lines:act.lines,st.seed,stage+'|'+id+'|text');
  const contextual=v?null:stage==='answer'?answerToClaim(st,id):
   stage==='open'&&id==='proof'&&st.claim?.hasEvidence?'The last match is on the record. '+(st.claim.said||st.claim.evidence):
   stage==='open'&&id==='accusation'&&st.claim?.hasEvidence?'We both know what happened last time, '+st.f.short+'. '+(st.claim.said||st.claim.evidence):
   stage==='close'&&id==='question'?'I have answered your argument. Now I will have to counter you when it counts.':
   null;
  const custom=kOpen?kOpen.prop:kResp?kResp.line:kClose?'Then let me make it official: I will '+(kClose.sayW||kClose.say)+' tonight. Hold me to it.':null;
  st.dialogue.push({speaker:st.w.name,line:custom||contextual||format(line,st),kind:landed?'strong':'uneven',node:id,stage,...(custom?{case:st.case?.issue||kOpen?.issue}:{})});
  if(!landed)st.dialogue.push({speaker:'Crowd',line:pick([
     'An uncertain reaction moves through the room; the words have not quite landed.',
     'A few cheers break through, but the speech loses its rhythm for a moment.',
     'The audience waits for the next line; that one did not convince everybody.'
   ],st.seed,stage+'|'+id+'|stumble'),kind:'reaction'});
  st.steps.push({stage,id,landed,variant:shown?shown.variant:v?.id||null,label:shown?shown.label:v?format(v.label,st):act.label});
  if(stage==='open'){
   // An opponent answers real history with real history; otherwise they answer the specific line.
  const exposed=(id==='accusation'&&!st.claim.hasEvidence)||(['proof','accusation'].includes(id)&&st.claim.hasEvidence)||(id==='proof'&&st.claim.planFocus==='counter');
   if(st.case)st.dialogue.push({speaker:st.f.name,line:st.case.raisedBy==='f'?(st.case.lead?st.case.lead+' ':'')+st.case.counter:st.case.counter,kind:'opponent',answerTo:st.claim.opening,case:st.case.issue});
   else st.dialogue.push({speaker:st.f.name,line:v&&!exposed?format(pick(v.reply,st.seed,'reply-'+v.id),st):reactionToClaim(st,id),kind:'opponent',answerTo:st.claim.opening});
   st.stage='answer';
  }else if(stage==='answer'){
   const lines=OPP_AFTER[id];
   if(kResp){
    const c=st.case;c.response=id;c.resolution=kResp.res;c.commit=kResp.commit?{...kResp.commit}:null;c.noPromise=!!kResp.noPromise;
    if(kResp.expose){c.exposed=true;c.exposedBy=kResp.expose.kind;}
    else c.fConceded=c.mode==='concede'&&(kResp.res==='defended'||kResp.res==='reframed');
    st.dialogue.push({speaker:st.f.name,line:kResp.expose?kResp.expose.line:kResp.reply,kind:'opponent',answerTo:id,case:c.issue});
    st.stage='close';
    return st;
   }
   const response=id==='personal'&&!st.claim?.hasEvidence?'You still have no evidence, '+st.w.short+'. Now you are trying to make the insult louder.':
    v?format(pick(v.reply,st.seed,'reply-'+v.id),st):
    id==='turn'?'You have finally listened to what I actually said. Let us see if you can answer it.':
    id==='calm'?'At least we know what we disagree about now. I will see you at the bell.':
    format(pick(lines,st.seed,'rebuttal-'+id),st);
   st.dialogue.push({speaker:st.f.name,line:response,kind:'opponent',answerTo:id});
   st.stage='close';
  }else{
   if(kClose){
    st.case.commit.official=true;
    st.dialogue.push({speaker:st.f.name,line:{evidence:'Everybody heard that, '+st.w.short+'. So did I.',dismiss:'Go on, then.',concede:'Then I will be watching for it. Properly.',deflect:'Write it on your hand so you do not forget.'}[st.case.mode]||'Everybody heard that.',kind:'opponent',answerTo:id,case:st.case.issue});
   }else if(v)st.dialogue.push({speaker:st.f.name,line:format(pick(v.reply,st.seed,'reply-'+v.id),st),kind:'opponent',answerTo:id});
   if(st.case?.noPromise&&NODES.close[id].promise!=='none'){
    st.metrics.cred-=4;st.case.brokeWord=true;
    st.dialogue.push({speaker:st.f.name,line:'So much for no promises, '+st.w.short+'.',kind:'opponent',answerTo:id,case:st.case.issue});
   }
   st.dialogue.push({speaker:'Crowd',line:pick(FINALE[id],st.seed,'final-'+id),kind:'reaction'});
   st.stage='done';st.result=finish(st);
  }
  return st;
 }
 function finish(st){
  if(st.stage!=='done'||st.steps.length!==3)throw Error('Promo is not finished');
  const m=st.metrics,close=st.steps[2].id,opening=st.steps[0].id;
  const quality=limit(Math.round(st.w.mic*.52+st.w.psych*.20+st.w.heat*.08+25+m.cred*.75+m.crowd*.7
    -st.steps.filter(x=>!x.landed).length*5),10,97);
  const crowdShift=limit(Math.round(m.crowd*.55+(quality-48)/18),-8,13);
  const heatDelta=limit(Math.round(m.heat*.65+st.feudHeat*.035),-3,16);
  const trustDelta=limit(Math.round(m.trust/5),-4,4);
  const moraleDelta=limit(Math.round((quality-55)/20)+(close==='clean'?1:0),-3,4);
  const repDelta=limit(Math.round(m.cred/9),-2,3);
  const speech=st.dialogue.filter(e=>e.speaker===st.w.name).map(e=>e.line);
  const opponentLines=st.dialogue.filter(e=>e.speaker===st.f.name);
  const promise={type:NODES.close[close].promise,claim:close,checked:false};
  const tactic=close==='question'?{kind:'counter',nodes:['last_second_counter','quiet_reversal','counter_strike','armbar_roll','waist_escape','wrist_escape'],stake:'A successful in-ring counter must happen.'}:
   close==='finisher'?{kind:'finisher',nodes:['finish_tease','finish_counter'],stake:'An announced finishing attack is being scouted.'}:
   close==='clean'?{kind:'clean',nodes:['clean_break','wristlock','grapple_trip'],stake:'Clean tactics are publicly demanded.'}:
   close==='legacy'?{kind:'legacy',nodes:['clean_break','dramatic_rally'],stake:'They told the room how they want to be remembered.'}:
   close==='grateful'?{kind:'gratitude',nodes:['dramatic_rally'],stake:'They thanked the room, and the room expects a performance.'}:
   close==='uncertainty'?{kind:'misdirect',nodes:['duck_rebound','quiet_reversal','counter_strike'],stake:'The opponent must read the unannounced approach.'}:
   {kind:'win',nodes:['dramatic_rally','clothesline','finish_tease'],stake:'A public victory prediction increases pressure.'};
  const closeVariant=VARIANTS.close[close]?.find(x=>x.id===st.steps[2].variant);
  if(tactic.kind==='counter'&&closeVariant?.fx?.counter)tactic.families=closeVariant.fx.counter.slice();
  const official=st.case?.commit?.official?st.case.commit:null;
  if(official?.kind==='counter'){if(official.families)tactic.families=official.families.slice();else delete tactic.families;if(official.tacticLabel)tactic.label=official.tacticLabel;tactic.stake='A public promise: '+(official.sayX||official.say)+'.';}
  if(official?.kind==='nocheat'){promise.type='nocheat';tactic.stake='A public promise to win without cheating.';}
  if(official)promise.say=official.say;
  const cs=st.case?{id:st.case.id,issue:st.case.issue,factId:st.case.factId,factCid:st.case.factCid,family:st.case.family,owner:st.case.owner,raisedBy:st.case.raisedBy,used:!!st.case.used,
   thesis:st.case.thesis,evidence:st.case.evidence,intent:st.case.intent,target:st.case.target,prop:st.case.prop,counter:st.case.counter,mode:st.case.mode,continuation:!!st.case.continuation,
   response:st.case.response,resolution:st.case.resolution||'unresolved',exposed:!!st.case.exposed,exposedBy:st.case.exposedBy||null,fConceded:!!st.case.fConceded,followup:st.case.followup||null,brokeWord:!!st.case.brokeWord,
   commit:st.case.commit?{kind:st.case.commit.kind,say:st.case.commit.say,families:st.case.commit.families||null,node:st.case.commit.node||null,official:!!st.case.commit.official}:null}:null;
  const broad=st.feudHeat>=50?'A heated personal confrontation':st.feudHeat>=25?'Unfinished business at the microphone':'A confrontation before the bell';
  const crowdWord=quality>=76?'The crowd will remember that exchange.':quality>=56?'There is plenty of conversation around ringside.':'The exchange left parts of the audience unconvinced.';
  const hook=close==='vow'?'A public promise of victory hangs over this match.':close==='finisher'?'Everyone knows the finishing move being promised tonight.':
   close==='clean'?'They publicly demanded a clean contest.':close==='legacy'?'They have said how they want to be remembered.':close==='grateful'?'The room has been thanked, and it is on their side.':'The last words at the microphone are still hanging in the air.';
  return {v:2,cid:st.cid,style:opening,styleName:NODES.open[opening].label,claim:st.claim,argument:st.argument,tactic,quality,crowdShift,heatDelta,case:cs,
   trustDelta,moraleDelta,repDelta,pressure:Math.round(m.heat+m.crowd*.4),speaker:st.w.name,opponent:st.f.name,
   speech,reply:opponentLines.at(-1)?.line||'',dialogue:st.dialogue.map(e=>({...e})),path:st.steps.map(x=>({...x})),
   promise,reaction:crowdWord,scene:broad,hook,variants:st.steps.map(x=>x.variant||null),
   angle:st.w.short+' '+st.steps.map(x=>(x.label||NODES[x.stage][x.id].label).toLowerCase()).join('; ')+'.'};
 }
 function result(st){return st?.stage==='done'?st.result:null}
 const size=()=>({angles:Object.values(NODES).reduce((n,x)=>n+Object.keys(x).length,0),
  variants:Object.values(VARIANTS).reduce((n,x)=>n+Object.values(x).reduce((m,l)=>m+l.length,0),0)});
 return {STAGES,NODES,VARIANTS,variantFor,context,size,begin,choose:chooseStep,choices:opts,result,caseOption};
})();
 const before=G.applyResult;
 G.applyResult=function(c,fin){
  const s=G.S;
  if(s?.history?.some(h=>h.cid===c.id))return [];
  const out=before(c,fin);
  const h=s?.history?.[0];if(!h)return out;
  h.cid=c.id;
  const pr=fin?.promo;
  if(pr){
   const fd=s.feuds[c.wid+':'+c.rid],w=G.W(c.wid);
   if(w){
    w.heat=clamp(w.heat+Math.max(0,Math.round((pr.quality-35)/14)));
    if(pr.v===2)w.morale=clamp(w.morale+(pr.moraleDelta||0));
   }
   if(pr.v===2){
    const p=G.P(c.pid);
    if(p)p.trust=clamp(p.trust+(pr.trustDelta||0));
    s.rep=clamp(s.rep+(pr.repDelta||0));
   }
   if(fd){
    fd.segments=(fd.segments||0)+1;fd.lastPromo={style:pr.styleName,quality:pr.quality,week:G.abs(),path:pr.path||[],promise:pr.promise||null,angle:pr.angle||null};
    fd.angle=pr.angle||pr.speaker+' called out '+pr.opponent+' ('+pr.styleName.toLowerCase()+'). '+(pr.quality>=70?'The crowd bought every word.':pr.quality<38?'The exchange did not land.':'The confrontation added another chapter.');
    if(!fd.closed){fd.heat=clamp(fd.heat+pr.heatDelta);fd.last=G.abs()}
   }
   h.promo={speaker:pr.speaker,opponent:pr.opponent,speech:pr.speech,reply:pr.reply,quality:pr.quality,style:pr.styleName,reaction:pr.reaction,dialogue:pr.dialogue||null,path:pr.path||[],claim:pr.claim||null,tactic:pr.tactic||null,argument:pr.argument||0,promise:pr.promise?{...pr.promise}:null,angle:pr.angle||null,case:pr.case||null};
   if(pr.v===2){
    const promise=pr.promise?.type||'none',won=fin.outcome==='double'||(fin.outcome!=='nc'&&c.finish.startsWith('win'));
    const clean=fin.outcome!=='double'&&fin.outcome!=='nc'&&['win_clean','lose_clean'].includes(c.finish);
    const finisher=won&&c.finish==='win_clean'&&!!G.W(c.wid)?.finisher
     &&(fin.log||[]).some(line=>String(line.text||'').includes(G.W(c.wid).finisher));
    const nocheat=fin.outcome!=='nc'&&c.finish!=='win_dirty'&&c.finish!=='lose_dq'&&!fin.promoSignals?.workerDirty&&!fin.evidence?.dirty?.w;
    const kept=promise==='win'?won:promise==='clean'?clean:promise==='finisher'?finisher:promise==='counter'?!!fin.promoSignals?.workerCounter:promise==='nocheat'?nocheat:null;
    if(kept!==null){
     const sure=(promise==='win'&&c.finish.startsWith('win'))||(promise==='clean'&&['win_clean','lose_clean'].includes(c.finish));
     const line=kept?(sure?'The microphone promise was kept, though the booking never put it in doubt.':'The microphone promise was fulfilled in the ring. Nobody could be sure it would be.'):'The microphone promise fell apart when the bell rang.';
     if(w){w.morale=clamp(w.morale+(kept?(sure?1:3):-3));w.heat=clamp(w.heat+(kept?(sure?1:5):-1))}
     if(fd&&!fd.closed)fd.heat=clamp(fd.heat+(kept?2:5));
     if(root.OfficeMemory&&w)
      root.OfficeMemory.remember(w.id,kept?'public_promise_kept':'public_promise_broken',
       w.short+' '+(kept?'delivered':'failed to deliver')+' the public '+promise+' promise against '+G.F(c.rid).short+'.',
       c.rid,kept?(sure?1:3):-3,kept?(sure?1:3):-2,c.id+':promo:'+promise);
     h.promo.promise.kept=kept;h.promo.promise.checked=true;h.notes.push(line);out.push({text:line,tone:kept?1:-1});
    }
    const mood=pr.trustDelta>1?'The promoter appreciated the restraint.':pr.trustDelta<0?'The promoter was unhappy about how personal it became.':'The promoter took note of the exchange.';
    h.notes.push(mood);out.push({text:mood,tone:Math.sign(pr.trustDelta||0)});
   }
   const msg=pr.format==='signing'?pr.speaker+' and '+pr.opponent+' signed the contract'+(pr.brawl?', and it ended in a brawl':'')+': '+pr.quality+'/100'+(fd?.closed?'.':', signing heat +'+(pr.signingHeat??pr.heatDelta)+' (applied at the signing).'):pr.speaker+' spoke before the match: '+(pr.v===2?pr.path.map(x=>x.id).join(' → '):'promo '+pr.quality+'/100')+', rivalry '+(fd?.closed?'concluded':'+'+pr.heatDelta)+'.';
   h.notes.push(msg);out.push({text:msg,tone:pr.quality>=55?1:0});
  }
  G.save();return out;
 };
 root.OfficeStory={STYLES,create,Graph:PromoGraph};
})(typeof window!=='undefined'?window:globalThis);
