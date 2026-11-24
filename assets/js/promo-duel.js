/* THE OFFICE v3.6 — the promo duel.
   Two wrestlers, one crowd. Each exchange swings the room towards one of them: your opening shot,
   their reply, an optional gamble for more, and the last word. The argument, the evidence and the
   public promise still come from the promo graph underneath, so what is said is still tested in the
   ring. Every option states its risk and what it is for. Seeded and replayable. */
(function installPromoDuel(root){'use strict';
 const D=root.OfficeData,Core=root.OfficeStory.Graph,Room=root.OfficeRoom,Director=root.OfficePromoDirector,Dialogue=root.OfficePromoDialogue;
 const authored=Dialogue?.catalogue(Dialogue.combine(root.OfficePromoPilot||[],root.OfficePromoBankC1||[],root.OfficePromoBankC2||[]));
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
  if(opts.dialogue&&Dialogue)st.dialogueFacts=Dialogue.snapshot(c,w,f,m,p,core);
  if(opts.authored&&st.dialogueFacts)st.authoredDialogue={v:1,used:[],recent:Dialogue.recentIds(rival,root.OfficeGame?.S?.history||[])};
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
  if(scene)push(st,'stage',scene.setting,'stage');
  return st;
 }
 const own=(st,slot)=>{if(st.speaker)return null;const line=D.VOICE_PACKS?.[st.w.id]?.promo?.[slot];return line&&rng(st.seed,'own|'+slot+'|'+(st.ownUsed?.[slot]||0))<2/3?line:null;};
 function fluff(st){
  const mine=!st.ownUsed?.fluff&&own(st,'fluff');if(mine){(st.ownUsed??={}).fluff=1;return fmt(mine,st);}
  const arr=FLUFF[voice(talker(st))];st.fluffs=(st.fluffs??hash(st.seed+'|fluff')%arr.length)+1;return fmt(arr[st.fluffs%arr.length],spoke(st));}
 function roll(st,risk,key,edge=0){
  const skill=clamp(st.w.mic*.7+st.w.psych*.2+st.w.heat*.1,0,100);
  return rng(st.seed,key)<clamp(.38+skill/170-risk*.09+edge,.12,.96);
 }
 function swing(st,n){const before=st.meter;st.meter=clamp(st.meter+n,-50,50);return st.meter-before;}
 function crowdSays(st,delta,key){
  const band=delta>=9?'roar':delta>=3?'good':delta>-3?'flat':delta>-7?'cool':'dead';
  push(st,'crowd',pick(CROWD[band],st.seed,'crowd|'+key),'reaction');
 }
 // The opponent answers. How well depends on how good a talker they are, and on whether your line landed.
 function theirTurn(st,line,key,landed,fit=0){
  const hit=rng(st.seed,'their|'+key)<clamp(.3+st.f.mic/170-(landed?.12+.05*Math.max(0,fit):0),.1,.9);
  const d=swing(st,hit?-(4+Math.round(st.f.mic/20)):3);
  if(line)push(st,'f',line,'opponent',d);
  push(st,'crowd',fmt(pick(OPP_CROWD[hit?'hit':'miss'],st.seed,'opp|'+key),st),'reaction',line?0:d);
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
  if(r==='push'&&st.director)return Director.options(st.director);
  if(r==='push')return [{id:'leave',label:'Leave it there',hint:st.meter>0?'Quit while you are ahead.':'Cut your losses.',tags:['Safe','Shorter promo']},
   ...Object.entries(PUSH).map(([id,o])=>({id,label:fmt(o.label,st),hint:o.hint,tags:[riskWord(o.risk),o.gain>=9?'Big swing either way':'Small gain']}))];
  const stage=r==='open'?'open':r==='answer'?'answer':'close';
  const offered=Core.choices(stage,st.core);
  return (st.director?Director.angles(st.director,stage,offered,st.core):offered).map(o=>({id:o.id,label:o.label,hint:o.hint,tags:stakes(st,stage,o.id,o),evidence:o.evidence||null,caseResponse:!!o.caseResponse,followsCase:!!o.followsCase}));
 }
 function fitOf(st,stage,id){return stage==='open'?openFit(st,id):stage==='answer'?answerFit(st,id):arcFit(st,'close',id);}
 function pickAuthored(st,ctx){
  if(!st.authoredDialogue||!ctx||!authored)return null;
  const selection=Dialogue.select(authored,ctx,st.seed+'|'+st.steps.length+'|'+ctx.side,st.authoredDialogue);
  if(selection)st.authoredDialogue.used.push(selection.id);
  return selection;
 }
 function annotate(st,index,ctx,line){if(ctx&&st.log[index]){st.log[index].dialogueSlot=Dialogue.tag(ctx);if(line)st.log[index].authoredId=line.id;}}
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
   if(d.speaker===st.w.name&&!said){said=true;const got=swing(st,mine);const ctx=slot('w',d),line=pickAuthored(st,ctx);push(st,'w',line?.text||d.line,step.landed?'strong':'uneven',got,!line);
    annotate(st,st.log.length-1,ctx,line);
    if(!step.landed)push(st,'stage',fluff(st),'fluff');crowdSays(st,got,key);continue;}
   if(d.speaker==='Crowd'&&d.kind==='reaction'&&!step.landed&&!stumbled){stumbled=true;continue;} // replaced by the fluff above
   if(d.speaker===st.f.name){replied=true;
    if(stage==='open'&&st.director?.format==='callout')push(st,'stage',fmt('{F} comes down from the entrance and takes the second microphone.',st),'stage');
    const ctx=slot('f',d),at=st.log.length,line=pickAuthored(st,ctx);
    theirTurn(st,line?.text||d.line,key,step.landed,fit);
    if(st.log[at]?.side==='f')annotate(st,at,ctx,line);
    if(stage==='open'&&!st.angle){st.angle=angleFor(st,id);push(st,'stage',fmt(ANGLE_CUE[st.angle],st),'cue');}
    continue;}
   if(d.speaker==='Crowd')push(st,'stage',d.line.replace(/^The opponent/,st.f.short).replace(/the opponent/g,st.f.short),'stage');
  }
  if(!replied&&stage!=='close')theirTurn(st,null,key,step.landed,fit);
  if(stage==='open'&&!st.angle){st.angle=angleFor(st,id);push(st,'stage',fmt(ANGLE_CUE[st.angle],st),'cue');}
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
  st.steps.push(rec);st.round++;
  if(st.director){
   Director.observe(st.director,st,rec,st.log.slice(beforeLog));
   if(r==='answer'){
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
   ...(st.authoredDialogue?{dialogueIds:st.authoredDialogue.used.slice(),...(st.authoredDialogue.used.length?{reply:st.log.filter(e=>e.side==='f').at(-1)?.line||base.reply}:{})}:{}),
   arcDirection:st.arc?.id||null,
   crowdShift:clamp(Math.round(base.crowdShift+m/7),-8,13),
   heatDelta:clamp(Math.round(base.heatDelta+(st.director&&!st.core.case?.exposed?(st.pushed==='press'?2:0):(pushed?2:0))+(Math.abs(m)>=25?1:0)),-3,16),
   moraleDelta:clamp(base.moraleDelta+(m>=15?1:m<=-15?-1:0),-3,4),
   temperature:50+m,temperatureWord:meterWord(m),timeOver:0,
   beats:st.steps.map(s=>({...s})),reaction,
   dialogue:st.log.map(e=>({speaker:e.speaker||'Stage',line:e.line,kind:e.kind,swing:e.swing,...(e.dialogueSlot?{dialogueSlot:e.dialogueSlot}:{}),...(e.authoredId?{authoredId:e.authoredId}:{})})),speech:st.log.filter(e=>e.side==='w').map(e=>e.line),
   angle:st.w.short+': '+st.steps.map(s=>String(s.label).toLowerCase()).join('; ')+'.'};
 }
 function view(st){
  const r=ROUNDS[Math.min(st.round,ROUNDS.length-1)];
  const directed=st.director&&Director.summary(st.director);
  const name=st.stage==='done'?'The final word':st.core.case?.exposed&&r.id==='push'?r.name:(directed&&Director.heading(st.director,st.round))||(directed&&r.id==='push'?'The argument continues':r.name);
  const help=directed&&r.id==='push'&&!st.core.case?.exposed?'Decide whether the point needs another exchange, or let it rest.':r.help;
  return {stage:st.stage,round:st.round,total:ROUNDS.length,name,help:fmt(st.stage==='done'?'It is said. The match decides whether any of it was true.':help,st),...(directed?{conversation:directed}:{}),
   meter:st.meter,meterWord:meterWord(st.meter),options:choices(st),log:st.log.slice(),claim:st.core.claim||null,result:st.result,
   read:st.round===0&&st.stage!=='done'?st.readLines:null,cue:st.round===1&&st.angle?fmt(ANGLE_CUE[st.angle],st):null,
   // v0.3.12 What the rivalry has on record before the first line, and any argument still open.
   record:st.round===0?(st.core.cases||[]).map(c=>c.evidence):null,
   unresolved:st.round===0?((st.core.cases||[]).find(c=>c.continuation)?.reminder||null):st.core.case?.continuation?st.core.case.reminder:null};
 }
 const result=st=>st?.stage==='done'?st.result:null;
 root.OfficeMic={ROUNDS,PUSH,HOOK,FLUFF,CROWD,begin,choose,choices,view,result,clientClaim,meterWord,riskWord,openFit,answerFit,pushFit,arcFit,READ,ANSWER_FIT};
})(typeof window!=='undefined'?window:globalThis);
