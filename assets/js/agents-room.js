/* THE OFFICE v3.5 — the agents' room.
   Match planning as a timed backstage scene. Both wrestlers and the road agent pitch real,
   physically checked moves for a five-slot board (shine, heat, comeback, big spot, finish).
   Wrestlers object for real reasons, the promoter sends a note, and somebody always has a
   daft idea. The result is an ordinary signed match sheet that the match engine performs.
   Everything is a pure function of the saved state and a seed: no clocks, no Math.random. */
(function installAgentsRoom(root){'use strict';
 const D=root.OfficeData,MX=root.OfficeMatch,A=MX.GRAPH.A,CAT=MX.GRAPH.CATALOG,P=root.OfficeSheets,K=root.OfficeGraphKernel;
 const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
 const rng=(seed,k)=>hash(seed+'|'+k)/4294967296;
 const pick=(arr,seed,k)=>arr[Math.floor(rng(seed,k)*arr.length)];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const kg=w=>D.PROFILES[w.id]?.kg||85;
 const AGENT='Dennis';
 // Eight ways of talking. Every wrestler has one.
 const VOICE={mara:'grand',roxy:'grand',rex:'gruff',red:'gruff',lyra:'eager',kit:'eager',night:'eager',brick:'stoic',
  juno:'precise',silas:'precise',sol:'earnest',dee:'earnest',rev:'sermon',malik:'slippery',
  dax:'grand',val:'stoic',nico:'eager',cal:'precise',imani:'earnest',otis:'stoic',kira:'gruff',ezra:'precise',
  dean:'slippery',rocco:'gruff',nova:'precise',ace:'grand',magnus:'slippery',tori:'eager',
  // v4 newcomers, read from each "voice" line in docs/living-roster-v4.json.
  faye:'precise',bao:'stoic',zara:'eager',miro:'earnest',aisha:'gruff',ellis:'precise',anya:'grand',nolan:'stoic',
  ivo:'precise',rina:'grand',priya:'grand',nate:'gruff',cass:'slippery',jun:'precise',sylvia:'gruff',kofi:'eager',
  mae:'earnest',theo:'precise',soraya:'grand',milo:'eager',winnie:'precise',bronte:'gruff',gus:'stoic',nikita:'gruff',
  jett:'eager',alina:'grand',cedric:'slippery',marisol:'stoic',felix:'earnest',eira:'precise',gideon:'precise',vera:'precise',
  tomas:'slippery',ari:'earnest',tomasash:'stoic',kezia:'earnest',dev:'grand',liya:'eager',emmett:'precise',nadia:'grand',
  leandro:'eager',iris:'stoic',kellan:'eager',ayla:'grand',sasha:'grand',morgan:'slippery',noelle:'precise',ash:'gruff',
  zane:'earnest',elodie:'grand',bashir:'stoic',cleo:'precise'};
 const voice=w=>VOICE[w.id]||'stoic';
 const LINES={
  pitch:{
   grand:['I shall open with the {move}. It photographs well.','Picture it: the {move}. The front row gasps. Somebody faints. Probably.','I had in mind the {move}. Understated. By my standards.'],
   gruff:['{move}. Then we see.','I do the {move}. They fall over. Job done.','{move}. Simple. Works.'],
   eager:['Oh! Oh! The {move}! I’ve been practising on my mattress!','Can I do the {move}? Please? I’ve nearly got it right twice.','The {move}! I saw it in a video! The person in the video was fine afterwards!'],
   stoic:['The {move}. Done it four hundred times. Nobody’s died yet.','I’d go {move}. It works, and my knees don’t mind it.','Put me down for the {move}. Same as last week. Same as 1997.'],
   precise:['The {move}. It is the correct choice. I can show my working.','I propose the {move}. Seventy per cent of my wins involve it.','The {move}. I have rehearsed it forty times this week. Forty-one, counting the one in the kitchen.'],
   earnest:['I thought maybe the {move}? If that’s all right with everyone?','The {move} would be nice. The kids like the {move}.','Would the {move} be all right? I can do it gently. Well. Gently-ish.'],
   sermon:['Let it be the {move}. It is written. I wrote it, on the bus.','I shall deliver the {move}, and the congregation shall say “ooh”.','The {move}. I have meditated upon it, mostly at traffic lights.'],
   slippery:['The {move}. Trust me. When have I ever let you down? Don’t answer that.','I do the {move}, we all go home early. Everyone’s a winner.','The {move}. Quick, clean, nobody asks questions.']
  },
  counter:{
   grand:['Or, and I say this with love, {them} does the {move} instead and my face remains insured.','I would prefer the {move}. I have a photoshoot on Thursday.','If I must be struck, let it be the {move}. It is the least undignified.'],
   gruff:['Not that. The {move}.','{them} can do the {move}. I’m not selling the other one. Hurts.','{move}. Or nothing.'],
   eager:['Could {them} do the {move} instead? Only I bruise like a peach.','The {move} looks dead good and it doesn’t hurt! Mostly!','Ooh, what about the {move}? I can do a really big fall for that one!'],
   stoic:['I’d sooner take the {move}. I’m forty-one. Be reasonable.','Make it the {move}. My back has asked me to pass that on.','The {move}, if it’s all the same. I’ve to drive home after.'],
   precise:['The {move} is safer by a measurable margin. I have measured it.','I will accept the {move}. The alternative has a non-zero dentistry risk.','I would counter-propose the {move}. Fewer variables.'],
   earnest:['Would the {move} be okay instead? I don’t want to be a bother.','If it’s the {move} I can make it look really good. I promise.','Maybe the {move}? Only if {them} doesn’t mind.'],
   sermon:['Let {them} instead offer the {move}, that I may sell it with dignity.','I counsel the {move}. The other thing cost Brother Clive two teeth.','I am at peace with the {move}. The other I am not at peace with.'],
   slippery:['Tell you what, {them} does the {move}, I owe you one. I’m good for it.','The {move}. Same reaction, half the chiropractor’s bill.','Make it the {move} and I’ll sell it like I’ve been shot. Promise.']
  },
  big:{
   grand:['The big moment is mine: the {move}. I’ve already told the photographer.','They came to see the {move}. They merely don’t know it yet.'],
   gruff:['Big spot’s the {move}. Mine.','I hit the {move}. Building shakes. That’s the spot.'],
   eager:['THE {MOVE}! Off the top! Or near the top! Somewhere high!','I want the {move}. I’ve never landed it but I’ve got a really good feeling.'],
   stoic:['If there’s a big one, it’s the {move}. I’ve one left in me. Possibly two.','The {move}. Once. Properly. Then I’d like a sit down.'],
   precise:['The high point should be the {move}. It is my best move. This is not arrogance, it is data.','The {move}, at roughly the two-thirds mark. I have a diagram.'],
   earnest:['I’d love to do the {move}. My mum’s in tonight. No pressure on anyone.','Could the big spot be the {move}? It’d mean a lot. I’ve got it on a T-shirt.'],
   sermon:['And lo, there shall be a {move}, and it shall be mine.','The moment of revelation is the {move}. I have a sermon built around it.'],
   slippery:['Big spot’s my {move}. I’ve got a bloke filming it for the socials.','Give me the {move} and I’ll do you a favour down the line. A real one this time.']
  },
  ego:{
   grand:['I’m sorry, {them} gets the big spot? Has there been a clerical error?','And what am I meant to do during all this? Applaud?'],
   gruff:['No.','So {them} gets the spot. And I get what. A nice view.'],
   eager:['But I had a thing! A really good thing! I told my flatmate about the thing!','That’s not fair. I’ve been stretching since four.'],
   stoic:['I’ll do it. I just want it noted I pulled a face.','Fine. But that’s the third week running, and I do count.'],
   precise:['I object. I have been allocated zero highlights. Zero is a number, and it is too low.','For the record, that is a suboptimal use of me.'],
   earnest:['Oh. Right. No, that’s fine. I’m fine. It’s fine.','I just thought tonight might be my night. But okay.'],
   sermon:['Pride is a sin. I am nevertheless experiencing some.','I had prepared a moment. I shall carry it home again, like a casserole nobody touched.'],
   slippery:['Hang on, hang on. What’s in it for me?','I’m not being funny, but that’s a main-event spot, and I’m on mid-card money.']
  },
  credibility:{
   grand:['If {them} flattens me this early, what am I supposed to sell a comeback with?','I’ll give {them} the heat. I would prefer to look like a credible opponent first.'],
   gruff:['I’ll sell it. Build to it first.','Too much, too soon. Give me a chance to fight back.'],
   eager:['If I go down that hard now, how am I meant to get the crowd back?','Can we save that for later? I’ve barely got going by then.'],
   stoic:['I’ll take the heat. Start smaller and make them earn it.','They’ll buy the comeback if I’ve still got something left.'],
   precise:['That’s too decisive for this early. The comeback needs a believable opening.','Give {them} control, by all means. Leave me something to work with.'],
   earnest:['Could I stay in the fight a little longer? I want the crowd to believe I can come back.','I’m happy to sell for {them}. Can we build to that move?'],
   sermon:['There can be no resurrection if nobody believes I can get up.','Let the punishment build. We have a whole match to tell this story.'],
   slippery:['If you want me to take that now, give me something the crowd can remember later.','I can make {them} look good. I’d like to look as if I belong in the match, too.']
  },
  safety:{
   grand:['{them}? Doing that? To me? I’ve seen {them} miss a chair.','I will not be dropped on my head by somebody who cannot parallel park.'],
   gruff:['{them} is not doing that to me. {them} dropped Clive.','No. I’ve seen the training.'],
   eager:['Um. Last time {them} did that somebody’s shoe came off. The shoe went further than they did.','I’m all for risk, but I’d like it to be my risk?'],
   stoic:['I’ve one working shoulder and I’d like to keep it. Pick something else.','Not with {them}. No offence. Some offence.'],
   precise:['{them}’s success rate with that move is poor. I have the figures. They are upsetting.','I decline. My neck is not a rehearsal space.'],
   earnest:['I trust {them}, I do. I just trust the floor more.','Could we not? Only I’ve got work on Monday.'],
   sermon:['I am prepared to meet my maker. Just not tonight, and not because of {them}.','The flesh is willing. The spirit has seen {them} train.'],
   slippery:['If {them} drops me, I’m invoicing. I mean it. I’ve got a form.','Not a chance. I’ve got a bad neck. I’ve got a note. I can get a note.']
  },
  proud:{
   grand:['I do not tap out. I conclude.','Losing I can do. Losing like THAT has to be negotiated.'],
   gruff:['I’m not doing that. Not in this town.','No. Pick another way to lose.'],
   eager:['Do I have to lose like that? It’s the embarrassing way.','My nan watches these. I’ll never hear the end of it.'],
   stoic:['I’ll lose. I’ve no problem losing. I’d just rather not look daft doing it.','Thirty years in, I’ve earned a better way down than that.'],
   precise:['That finish makes me look incompetent. I am many things. I am not that.','I can lose more credibly than that. I have options listed.'],
   earnest:['Could I lose a bit more… nobly?','I’ll do it. I just won’t enjoy it. I want that understood.'],
   sermon:['I shall fall, as all men fall. But not like a deckchair.','There is dignity in defeat. There is none in that.'],
   slippery:['That finish costs extra. I don’t make the rules. I do, actually, but it still costs extra.','I’ll look like a mug. Mugs don’t get booked.']
  },
  accept:{
   grand:['Very well. I am nothing if not gracious. Write that down.','Acceptable.'],
   gruff:['Right.','Fine.'],
   eager:['Yes! Brilliant! Okay! Yes!','Okay. I can do that. I think. Yes.'],
   stoic:['Fair enough.','That’ll do.'],
   precise:['Agreed. Logged.','That is acceptable.'],
   earnest:['Lovely. Thanks. Sorry.','Okay! Whatever’s best for the match.'],
   sermon:['So be it.','Amen to that.'],
   slippery:['Deal. Shake on it. No, the other hand.','Yeah, go on.']
  },
  grumble:{
   grand:['I shall remember this. Fondly, as a grievance.','Fine. But I’m entering through the good curtain.'],
   gruff:['Hm.','Whatever. I’m getting changed.'],
   eager:['Fine. FINE. It’s fine.','Okay. I’m not sulking. This is just my face.'],
   stoic:['You’re the boss. Apparently.','I’ll do it. I’ll be thinking about it while I do it, mind.'],
   precise:['Noted. Disagreed with. Noted.','I will comply. I will also be right.'],
   earnest:['No, no, it’s fine. Honestly.','Sure. Okay. Yep.'],
   sermon:['I forgive you. Eventually.','The Lord sees this. So do I.'],
   slippery:['You owe me. I’m writing it down. I’ve got a little book.','All right, all right. Keep your hair on.']
  },
  pleased:{
   grand:['Naturally.','At last, a manager with taste.','Exactly as I pictured it.'],
   gruff:['Good.','Yeah.','That works.'],
   eager:['YES. Thank you! I won’t mess it up! Probably!','I’m going to text my mum.','Brilliant. I’ve already got the footwork in my head.'],
   stoic:['Sensible.','Good call.','I can work with that.'],
   precise:['Correct.','A rational decision. I’m almost moved.','I’ll update the diagram.'],
   earnest:['Really? Thank you! Thanks so much.','Oh, brilliant. Thank you.','I’ll make it count.'],
   sermon:['Blessed are the decisive.','It is good.','Then let us proceed with confidence.'],
   slippery:['Smart. I’ve always said you were smart.','That’s why you’re the gaffer.','I had a feeling you’d see it my way.']
  },
  sweet:{
   grand:['Money. How vulgar. Thank you.','I accept, on the understanding that this was my idea.'],
   gruff:['Ta.','That helps.'],
   eager:['Forty quid?! I’ll do it twice!','Wow. Okay. Yes. Thank you!'],
   stoic:['That’s the car park paid for. Go on, then.','Aye, all right.'],
   precise:['The incentive is adequate.','Payment received. Objection withdrawn.'],
   earnest:['You don’t have to do that! I mean, thank you.','Oh! That’s really kind.'],
   sermon:['A labourer deserves a wage.','A generous offering. The answer is yes.'],
   slippery:['Now we’re talking.','Pleasure doing business.']
  },
  loose:{
   grand:['Improvise? Darling, I’ve been improvising since before {them} could walk.','Leave it open. I do my best work unscripted.'],
   gruff:['We’ll call it.','Fine. I’ll hit {them} till something happens.'],
   eager:['Call it in the ring? What if I forget what wrestling is?','Okay. Okay. I’ll just… do moves. Lots of moves.'],
   stoic:['We’ll find it out there. We usually do.','Leave it. I’ll talk {them} through it.'],
   precise:['Unplanned. I see. I shall prepare for every possibility. There are a great many.','I dislike improvisation. I am very good at it. I still dislike it.'],
   earnest:['We’ll just listen to the crowd! That’s nice, actually.','Okay. I’ll follow {them}. Or {them} follows me. One of those.'],
   sermon:['The spirit will move us.','We shall be guided.'],
   slippery:['Lovely. Nothing in writing. My favourite.','Leave it loose. Less to get wrong.']
  }
 };
 // A seeded rotation breaks ties between the least-used lines in the room.
 const turn=(st,key,n)=>{st.said??={};const i=(st.said[key]=(st.said[key]??hash(st.seed+'|'+key)%n)+1);return i%n;};
 const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
 const say=(st,type,w,k,vars={})=>{
  const them=vars.them||(w.id===st.w.id?st.f.short:st.w.short),move=vars.move||'';
  const fill=line=>cap(line.replace(/\{move\}/g,move).replace(/\{MOVE\}/g,move.toUpperCase()).replace(/\{them\}/g,them));
  const lines=LINES[type][voice(w)].map(fill);
  const used=new Map();
  for(const entry of st.log)used.set(entry.text,(used.get(entry.text)||0)+1);
  // Wrestlers with a personal voice pack use their own line about two times in three.
  const own=D.VOICE_PACKS?.[w.id]?.room?.[type];
  if(own?.length){
   st.said??={};const key='own|'+type+'|'+w.id,n=st.said[key]=(st.said[key]||0)+1;
   const mine=own.map(fill).filter(line=>!used.has(line));
   if(mine.length&&rng(st.seed,key+'|'+n)<2/3)return mine[n%mine.length];
  }
  const start=turn(st,type+'|'+w.id,lines.length);
  let best=lines[start];
  for(let i=1;i<lines.length;i++){
   const line=lines[(start+i)%lines.length];
   if((used.get(line)||0)<(used.get(best)||0))best=line;
  }
  return best;
 };
 const from=(st,key,arr)=>arr[turn(st,key,arr.length)];
 const DAFT={
  grand:{pitch:'One more thing. I should be carried to the ring. On a litter. By four local men of your choosing.',
   yes:'{W} is carried to the ring on a litter by four men from the darts team. It is magnificent. One of them is weeping.',
   no:'{W} is carried towards the ring on a litter. The men from the darts team get as far as the steps and put it down for a rest.'},
  gruff:{pitch:'I want a chain. Just to hold. I’m not going to do anything with it.',
   yes:'{W} walks out holding a length of chain and does nothing with it. Somehow that is worse. The front row moves back.',
   no:'{W} walks out with a chain, which catches on the curtain rail. There is a short delay while a caretaker is found.'},
  eager:{pitch:'What if I come out on a mobility scooter? My nan’s got one. It does eight miles an hour.',
   yes:'{W} enters on a mobility scooter doing eight miles an hour, standing on the seat. The crowd lose their minds.',
   no:'{W} enters on a mobility scooter. The battery gives out halfway down the aisle. {W} gets off and pushes.'},
  stoic:{pitch:'I could wear the old gear. The brown trunks. People liked the brown trunks.',
   yes:'{W} comes out in the brown trunks. A man in his sixties stands up and salutes. It catches on.',
   no:'{W} comes out in the brown trunks. Time has not been kind to the elastic.'},
  precise:{pitch:'I have prepared a short slideshow explaining the holds. It is only eleven minutes.',
   yes:'{W} shows the crowd a single laminated diagram of an armbar. Against all reason, they applaud.',
   no:'{W} attempts to show a slideshow. The projector displays somebody’s holiday photos. Tenerife, by the look of it.'},
  earnest:{pitch:'Could I hand out stickers on the way to the ring? I’ve had some printed. They say “Believe”.',
   yes:'{W} hands out “Believe” stickers down the aisle. By the bell, half the front row is wearing one.',
   no:'{W} hands out “Believe” stickers. The printer has spelled it “Beleive”. A child points this out.'},
  sermon:{pitch:'I shall bless the front row. With a watering can.',
   yes:'{W} blesses the front row with a watering can. They accept it with the solemnity it deserves.',
   no:'{W} blesses the front row with a watering can. A woman in a good coat is not pleased, and says so at length.'},
  slippery:{pitch:'A mate of mine can get us a smoke machine. Don’t ask where from. Cash only.',
   yes:'{W} emerges through a wall of smoke. It looks tremendous. Nobody asks where the machine came from.',
   no:'{W} emerges through a wall of smoke. So does the fire alarm. The match starts eleven minutes late, in the car park, then moves back in.'}
 };
 // The promoter's note for tonight. Honouring it constrains the match; ignoring it risks trust.
 const NOTES={
  dock:[
   {id:'barricade',text:'Gaz says, and I quote: “If nobody hits that barricade I’m not paying for a wrestling match. I’m paying for a cuddle.”',need:['outside','dive'],short:'Somebody has to hit the barricade'},
   {id:'no_rest',text:'Gaz has left a note. It says “NO CHINLOCKS” in capitals, and then, underlined, “I MEAN IT TERRY”. I don’t know who Terry is.',ban:['rest'],short:'No rest holds'}],
  pulse:[
   {id:'highlight',text:'Nina wants one thing for the clip. Her words: “something a teenager would send to another teenager”.',needRisk:true,short:'One big spot for the highlight clip'},
   {id:'pace',text:'Nina says the stream drops viewers the second anyone sits in a hold. No lying about, she says. I said they’re athletes. She laughed.',ban:['rest'],short:'No rest holds'}],
  crown:[
   {id:'ring_only',text:'Harold says the cameras are bolted to the floor. “If they leave the ring then, as far as television is concerned, they have ceased to exist.”',ban:['outside','dive'],banIds:['outside_toss','floor_brawl'],short:'Keep it in the ring'},
   {id:'family',text:'Harold reminds us it is a family show. No biting, no eye-gouging, and nobody is to say “bloody”. He said it twice himself while telling me.',ban:['heel'],banIds:['cheap_shot'],short:'No dirty tactics'}],
  union:[
   {id:'no_flying',text:'Vivian Croft’s office has sent a memo. Three pages. The summary is: nobody above the second rope. The insurers are in tonight, and one of them has a clipboard.',ban:['aerial','superplex','springboard'],banIds:['top_climb','aerial_attack','springboard_rise','top_follow','high_crossbody','missile_dropkick','springboard_strike'],short:'Nobody off the top rope'},
   {id:'family',text:'A memo from Ms Croft: the sponsor is a building society. Clean wrestling only. It is signed “Regards”, which from her is a threat.',ban:['heel'],banIds:['cheap_shot'],short:'No dirty tactics'}]
 };
 const SLOTS=[
  {id:'opening',name:'The shine',ask:'{O} starts hot. With what?',owner:'w'},
  {id:'pressure',name:'The heat',ask:'{O} takes over. How?',owner:'f'},
  {id:'reversal',name:'The comeback',ask:'What turns it round for {O}?',owner:'w'},
  {id:'payoff',name:'The big spot',ask:'One thing they talk about on the drive home. Whose is it?',owner:null},
  {id:'finish',name:'The finish',ask:'The result is in the contract. How do we get there?',owner:'either'}
 ];
 const FAMS={
  opening:{Technical:['chain'],Brawl:['strike'],Spectacle:['lucha','running'],Story:['chain','strike','heel']},
  pressure:{Technical:['submission','ground'],Brawl:['power','ground','corner'],Spectacle:['running','rope','ground'],Story:['rest','heel','ground']},
  reversal:{Technical:['fire','chain','neck'],Brawl:['fire','running','neck'],Spectacle:['fire','lucha','running'],Story:['fire','neck','strike']},
  payoff:{Technical:['suplex','submission','neck'],Brawl:['power','suplex','neck'],Spectacle:['aerial','dive','springboard','lucha'],Story:['neck','suplex','aerial']}
 };
 const LIMIT={opening:.15,pressure:.4,reversal:.55,payoff:.8};
 const ROUTE_NAME={finisher:'Straight finisher, clean in the middle',reversal_finisher:'Counter their finisher into ours',top_rope:'Finish off the top rope',
  limb_finish:'Work the limb all night, then finish',strike_knockout:'Win a slugfest',outlasted:'Outlast them',
  tights:'A fistful of tights',feet_on_ropes:'Feet on the ropes',eye_poke:'Thumb in the eye, then roll them up',referee_bump:'Bump the referee',
  rope_rollup:'Foot on the rope, then get rolled up',slow_count:'Get robbed by a slow count',exhausted_cover:'Hit the finisher, too spent to cover',injury_gives:'The bad wheel gives way',
  duck_finisher:'Get caught, get finished',finisher_reversed:'Have our finisher reversed',submission_defeat:'Tap out',
  dq_chair_f:'They grab a chair in front of the referee',dq_ref_shove_f:'They shove the referee',dq_low_blow_f:'A low blow the referee sees',
  dq_chair_w:'Snap and use a chair',dq_choke_w:'Choke them past the count of five',dq_ref_shove_w:'Shove the referee'};
 // Static prerequisites must be checked when a finish is pitched, not only at the bell.
 // Dynamic damage, reversals and exhaustion remain things the wrestlers must earn.
 const ROUTE_STATIC={
  top_rope:(w)=>w.style==='Spectacle'&&kg(w)<110,
  strike_knockout:(w)=>w.style==='Brawl',
  eye_poke:(w)=>['Brawl','Story'].includes(w.style),
  referee_bump:(w,f,st)=>st.heat>=40,
  dq_ref_shove_f:(w,f,st)=>st.heat>=25,
  dq_low_blow_f:(w,f)=>['Brawl','Story'].includes(f.style),
  dq_ref_shove_w:(w)=>w.ego>=65
 };
 // These methods are agreed backstage, but must be earned by actual in-ring
 // events. If the condition is absent at the finish, the road agent calls an
 // audible to another legal method; the contracted winner does not change.
 const ROUTE_CONDITION={
  reversal_finisher:'Needs three genuine reversals by your wrestler.',
  top_rope:'Needs an aerial specialist who is not exhausted.',
  limb_finish:'Needs focused damage on the opponent worth at least four.',
  outlasted:'At the bell, the loser needs stamina below 30 and the winner must have at least 15 more stamina.',
  referee_bump:'Needs enough feud heat.',
  exhausted_cover:'Needs your wrestler exhausted.',
  injury_gives:'Needs focused damage on your wrestler worth at least three.',
  finisher_reversed:'Needs three genuine reversals by the opponent.',
  submission_defeat:'Needs focused damage on your wrestler worth at least four.',
  dq_ref_shove_f:'Needs enough feud heat.',
  dq_low_blow_f:'Needs a Brawl or Story opponent.',
  dq_choke_w:'Needs feud heat or your wrestler to be hurt.',
  dq_ref_shove_w:'Needs a sufficiently defiant wrestler.'
 };
 const name=id=>{const n=A[id];return n?.name||id.replace(/_/g,' ');};
 function legal(id,o,r){
  const n=A[id];if(!n)return false;
  if(n.agile&&kg(o)>=110)return false;
  if(n.lift!==null&&n.lift!==undefined){const cap=kg(o)+Math.max(-5,((o.ring||60)-60)*.23);if(kg(r)>cap+n.lift)return false;}
  return true;
 }
 function pool(slot,o,r){
  const fams=FAMS[slot][o.style]||FAMS[slot].Story,lim=LIMIT[slot];
  let ids=fams.flatMap(f=>CAT.members[f]||[]).filter(id=>{const n=A[id];
   return n.after<=lim&&!n.nearfall&&(slot==='payoff'||!n.risk)&&(n.cost??1)>-1&&(slot==='payoff'||slot==='pressure'||n.requires==='standing');});
  if(slot==='payoff')ids=[...(o.learned||[]).filter(id=>A[id]&&A[id].after<=lim),...(D.PROFILES[o.id]?.signature||[]).filter(id=>A[id]&&A[id].after<=lim),...ids];
  return [...new Set(ids)];
 }
 function learnable(w){
  const style=w.style||'Story',fams=FAMS.payoff[style]||FAMS.payoff.Story,have=new Set([...(w.learned||[]),...(D.PROFILES[w.id]?.signature||[])]);
  const typical={id:'_typical'};
  const ids=[...new Set(fams.flatMap(f=>CAT.members[f]||[]))].filter(id=>{const n=A[id];
   return n&&n.after<=LIMIT.payoff&&!n.nearfall&&!n.counterOf&&!n.blockOf&&(n.cost??1)>-1&&!have.has(id)&&legal(id,w,typical);});
  const score=id=>(A[id].crowd||0)+(A[id].risk?1.5:0)+(A[id].styles?.includes(style)?1:0)+rng(String(w.id),'learn'+id);
  return ids.sort((a,b)=>score(b)-score(a)||a.localeCompare(b)).slice(0,3).map(id=>({id,label:name(id),weeks:A[id].risk?3:2,risk:!!A[id].risk}));
 }
 const pain=id=>(A[id].cost??1)+(A[id].risk?3:0)+(A[id].lift!==null?1:0);
 const appeal=(id,o)=>((o.learned||[]).includes(id)?6:0)+((D.PROFILES[o.id]?.signature||[]).includes(id)?4:0)+(A[id].styles?.includes(o.style)?1:0)+(A[id].crowd||0)*.4+(A[id].cost??1)*.3;
 // Three pitches for a slot: the performer's favourite, what the receiver would rather take,
 // and the road agent's sensible option.
 function pitches(st,slot,{allowAmbition=true}={}){
  const {w,f,seed}=st,S=SLOTS.find(x=>x.id===slot);
  if(slot==='finish'){
   const all=(MX.FINISH_ROUTES[st.finish]||[]).map(r=>r.id).filter(id=>!ROUTE_STATIC[id]||ROUTE_STATIC[id](w,f,st));
   const wPick=all[1+Math.floor(rng(seed,'fin-w')*(all.length-1))]||all[0];
   const rest=all.filter(x=>x!==wPick&&x!==all[0]);
   const fPick=rest.length?pick(rest,seed,'fin-f'):null;
   return [{by:'w',route:wPick},...(fPick?[{by:'f',route:fPick}]:[]),{by:'agent',route:all[0]}]
    .filter((c,i,a)=>a.findIndex(x=>x.route===c.route)===i)
    .map(c=>({...c,slot,owner:'either',label:ROUTE_NAME[c.route]||c.route}));
  }
  const make=(o,r,owner,tag,exclude)=>{
   const all=pool(slot,o,r).filter(id=>id!==exclude),ok=all.filter(id=>legal(id,o,r));
   const fav=ok.slice().sort((a,b)=>appeal(b,o)-appeal(a,o)||a.localeCompare(b)).slice(0,3);
   // A move they spent weeks learning is the one they pitch.
   const own=ok.find(id=>(o.learned||[]).includes(id));
   const mine=own||(fav.length?pick(fav,seed,slot+tag+'own'):null);
   const soft=ok.filter(id=>id!==mine).sort((a,b)=>pain(a)-pain(b)||a.localeCompare(b)).slice(0,3);
   const theirs=soft.length?pick(soft,seed,slot+tag+'soft'):null;
   const mid=ok.filter(id=>id!==mine&&id!==theirs).sort((a,b)=>Math.abs(pain(a)-3)-Math.abs(pain(b)-3)||a.localeCompare(b)).slice(0,4);
   const agent=mid.length?pick(mid,seed,slot+tag+'agent'):null;
   // A wrestler with more ambition than sense sometimes pitches something the body cannot do.
   const dream=all.filter(id=>!legal(id,o,r)&&A[id].lift!==null);
   const deluded=!own&&allowAmbition&&slot==='payoff'&&dream.length&&(o.ego>=62||o.psych<50)&&rng(seed,slot+tag+'dream')<.6?pick(dream,seed,slot+tag+'which'):null;
   return {owner,mine:deluded||mine,impossible:!!deluded,theirs,agent};
  };
  if(slot==='payoff'){
   const a=make(w,f,'w','w'),b=make(f,w,'f','f',a.mine);
   const cards=[];
   if(a.mine)cards.push({by:'w',owner:'w',action:a.mine,impossible:a.impossible});
   if(b.mine)cards.push({by:'f',owner:'f',action:b.mine,impossible:b.impossible});
   cards.push({by:'agent',owner:'either',action:'scheduled_nearfall',label:'A run of near falls instead'});
   return cards.map(c=>({...c,slot,label:c.label||name(c.action),risk:!!A[c.action]?.risk}));
  }
  const o=S.owner==='w'?w:f,r=S.owner==='w'?f:w,m=make(o,r,S.owner,S.owner);
  const cards=[];
  if(m.mine)cards.push({by:S.owner,action:m.mine});
  if(m.theirs)cards.push({by:S.owner==='w'?'f':'w',action:m.theirs});
  if(m.agent)cards.push({by:'agent',action:m.agent});
  return cards.map(c=>({...c,slot,owner:S.owner,label:name(c.action),risk:!!A[c.action]?.risk}));
 }
 // ---------------------------------------------------------------------------------------------
 // v3.6 BACKSTAGE. The meeting is no longer a fixed five-slot form. Each night draws two or three
 // situations from a deck, chosen to fit this pairing, this promoter and this contract, and never
 // one seen in the last few shows. Every option says what it will do before it is chosen.
 // ---------------------------------------------------------------------------------------------
 const who=(st,side)=>side==='w'?st.w:side==='f'?st.f:null;
 const other=side=>side==='w'?'f':'w';
 const nameOf=(st,side)=>side==='agent'?AGENT:side==='you'?'You':side==='promoter'?st.promoter.voice:who(st,side).short;
 const log=(st,side,text,kind)=>st.log.push({who:nameOf(st,side),side,text,kind:kind||(side==='agent'?'agent':side==='you'?'you':'talk')});
 // A private composed line retains provenance in the room transcript.
 function planningLine(st,side,line,kind){
  log(st,side,'“'+line.text+'”',kind);
  st.log.at(-1).planningDialogue={v:1,id:line.id,actorId:line.actorId,turn:line.turn,stance:line.stance,topic:line.topic,source:line.source,bankReuse:line.bankReuse};
 }
 const tone=(st,side,map)=>map[voice(who(st,side))]||map.stoic||Object.values(map)[0];
 const fmt=(st,t)=>String(t).replace(/\{W\}/g,st.w.short).replace(/\{F\}/g,st.f.short).replace(/\{P\}/g,st.promoter.voice).replace(/\{PN\}/g,st.promoter.name).replace(/\{PF\}/g,st.promoter.voice.split(' ')[0]);
 const first=st=>st.promoter.voice.split(' ')[0];
 // A follow-up later in this meeting: it takes the place of the next situation not yet reached,
 // or is added on the end once if the meeting has nothing left to replace.
 function chain(st,id){
  if(st.queue.includes(id))return;
  if(st.at+1<st.queue.length)st.queue[st.at+1]=id;
  else if(!st.extra){st.queue.push(id);st.extra=1;}
 }
 // A thread that comes back at a later show: with the same wrestler (sid) or the same promoter (pid).
 function carry(st,t){(st.carry??=[]).push({id:st.seed+'|'+t.sit,at:st.contract.eventAbs||0,...t});}
 // What an option will do, stated before it is chosen. Built from the same numbers that are applied.
 function tagsOf(st,fx={}){
  const t=[],W=st.w.short,F=st.f.short;
  if(fx.moodW)t.push(W+(fx.moodW>0?' ▲':' ▼'));
  if(fx.moodF)t.push(F+(fx.moodF>0?' ▲':' ▼'));
  if(fx.crowd)t.push('Crowd'+(fx.crowd>0?' ▲':' ▼'));
  if(fx.trust)t.push(first(st)+(fx.trust>0?' ▲':' ▼'));
  if(fx.cash)t.push((fx.cash>0?'+£':'−£')+Math.abs(fx.cash));
  if(fx.heat)t.push('Rivalry'+(fx.heat>0?' ▲':' ▼'));
  if(fx.rep)t.push('Reputation'+(fx.rep>0?' ▲':' ▼'));
  if(fx.morale)t.push(W+' morale'+(fx.morale>0?' ▲':' ▼'));
  if(fx.bonus)t.push('Better match');
  if(fx.minutes)t.push(fx.minutes>0?'Longer match':'Shorter match');
  if(fx.spice)t.push(fx.spice>0?'More risk':'Safer');
  if(fx.ban||fx.banIds)t.push('Limits the match');
  if(fx.flags?.pushThrough)t.push('Injury risk');
  if(fx.repStake)t.push('Reputation at stake');
  if(fx.skipPromo)t.push('No promo tonight');
  if(fx.plan){const cur=st.board[fx.plan.slot],S=SLOTS.find(x=>x.id===fx.plan.slot);t.push(!cur?'Goes in the match layout':cur.action===fx.plan.action?'Keeps the running order':'Changes '+S.name.toLowerCase());}
  if(fx.route)t.push('Fixes the finish');
  if(fx.leash)t.push(fx.leash==='free'?'They call it':'You call it');
  return t;
 }
 function apply(st,fx={}){
  if(fx.moodW)st.mood.w+=fx.moodW;if(fx.moodF)st.mood.f+=fx.moodF;
  for(const k of ['crowd','trust','cash','heat','rep','morale','minutes','bonus'])if(fx[k])st.fx[k]=(st.fx[k]||0)+fx[k];
  if(fx.ban)st.limits.ban.push(...fx.ban);if(fx.banIds)st.limits.banIds.push(...fx.banIds);
  if(fx.spice)st.spice=fx.spice;
  if(fx.flags)Object.assign(st.flags,fx.flags);
  if(fx.repStake)st.repStake=fx.repStake;
  if(fx.skipPromo)st.skipPromo=true;
  if(fx.leash)st.leash=fx.leash;
  if(fx.route)st.lockRoute=fx.route;
  if(fx.entrance)st.entrance.push(fmt(st,fx.entrance));
  if(fx.plan){const p=fx.plan;st.board[p.slot]={by:p.by||p.owner,owner:p.owner,action:p.action,label:p.label||name(p.action),impossible:!!p.impossible};}
 }
 // A move the given side would pitch for a slot, from the same physically checked pools as before.
 const pitchFor=(st,slot,by)=>pitches(st,slot).find(c=>c.by===by&&c.action&&c.action!=='scheduled_nearfall')||null;
 const promoLine=(st,map)=>map[st.promoter.id]||map.dock;
// v0.3.10 Every wrestler has their own daft idea, and each voice type has four shared ones.
 const DAFT_OWN={
 "mara":{"pitch":"I want a jury. Twelve women from the bingo, front row. As I pass, they hold up cards saying “Guilty”. I’ve already made the cards.","yes":"{W} sweeps past twelve women from the bingo. One by one they raise cards reading “Guilty”. The opponent looks genuinely rattled.","no":"{W} sweeps past the bingo jury. Half of them hold their cards upside down. One shouts “House!” and asks where to collect."},
 "rex":{"pitch":"Prop the fire doors. Everyone in the car park flashes their headlights when I walk in. Twelve years of car parks. They owe me.","yes":"{W} walks in through the fire doors as every car outside flashes its headlights at once. Somebody honks. The hall goes up.","no":"{W} walks in through the fire doors. One car flashes its headlights. Then its alarm goes off, and keeps going for the whole match."},
 "lyra":{"pitch":"What if I come in from the balcony? Down the PE climbing rope! I’ve found it in the cupboard! It’s nearly long enough!","yes":"{W} slides down the PE climbing rope from the balcony and lands in a perfect roll at ringside. The crowd keep looking up for more.","no":"{W} swings a leg over the balcony rail with the PE rope, which turns out to be tied to nothing. {W} takes the stairs, at a jog."},
 "brick":{"pitch":"I’d like to clock in. Proper card, proper machine. There’s one going spare from the old foundry. It still works. Mostly.","yes":"{W} stops at the curtain, punches a card in an old clocking-in machine and walks on. A row of retired men nod their approval.","no":"{W} punches a card in the clocking-in machine. It jams. {W} will not leave it like that, and the match waits while it is fixed properly."},
 "juno":{"pitch":"I do not wish to speak. I have prepared cue cards. A steward will hold them up as I walk. There are six.","yes":"{W} walks out in total silence while a steward holds up cue cards: “{W} has trained.” “{W} is ready.” “Tap early.” It is chilling.","no":"{W} walks out in silence. The steward holds the cue cards in the wrong order. “Thank you for coming” gets the biggest cheer of the night."},
 "sol":{"pitch":"Could the lights come up really slowly as I walk out? Like first light? The caretaker says the dimmer’s a bit temperamental, but.","yes":"{W} walks out in darkness as the caretaker eases the lights up, slow and gold. A sunrise in a leisure centre. People clap the caretaker.","no":"{W} walks out in darkness. The dimmer goes straight to full, then off, then flickers. {W} finishes the walk by the light of the vending machine."},
 "dee":{"pitch":"You said build a following. My night-school pottery class want to walk me out. They’ve made me a championship belt. In clay.","yes":"{W} is walked out by nine members of a Thursday pottery class carrying a clay title belt. It is very heavy. The crowd treat it as real.","no":"{W} is walked out by the pottery class. The clay belt snaps in half on the ring steps. The tutor says it can be glued and glazed."},
 "kit":{"pitch":"My cousin’s got a little bar on wheels. I push it down the aisle, pour the front row a squash, then backflip off the counter. Class!","yes":"{W} wheels a tiny bar down the aisle, pours the front row orange squash and backflips off the counter. The tips jar fills up.","no":"{W} wheels the bar down the aisle. A castor sticks and it spins in a slow circle. The front row get their squash. The backflip is cancelled."},
 "dax":{"pitch":"Give me the brass bell from the Legion bar. I walk out, I ring it, I call time. Years on the door. I know how to empty a room.","yes":"{W} rings the brass bell and bellows “Time, please!” The whole hall roars it back. The opponent looks like they’ve been refused entry.","no":"{W} rings the brass bell and calls last orders. Half the crowd head straight for the bar. The bell is held until the queue clears."},
 "val":{"pitch":"I’ll carry my old competition stone to the ring. Hundred and twenty kilos. Set it on the apron. Then nobody says novelty.","yes":"{W} carries a huge round stone down the aisle and sets it on the apron without a word. The ring creaks. Nobody heckles all night.","no":"{W} carries the stone down the aisle and sets it on the apron. The apron disagrees. The ring crew spend the interval with a car jack."},
 "nico":{"pitch":"My tía made thirty little masks! I throw them to the kids on the way down! Every kid gets a mask! Every single kid!","yes":"{W} hands out little lucha masks the length of the aisle. By the bell, thirty children in masks are screaming {W}’s name.","no":"{W} throws all thirty masks in the first four seconds, then has the entire walk left with nothing to do. {W} waves a lot."},
 "cal":{"pitch":"I have found a reason to speak. It is one sentence, about wrist control. I have rehearsed it. I would like a microphone.","yes":"{W} takes the microphone, says one carefully rehearsed sentence about wrist control and hands it back. The crowd are oddly moved.","no":"{W} takes the microphone and delivers the rehearsed sentence perfectly. The microphone was off. {W} declines to say it again."},
 "imani":{"pitch":"Could the library chess club walk me out? Eight of them, dressed as pawns. They’ve still got the costumes from the summer fete.","yes":"{W} walks out behind eight pawns from the library chess club. They part in formation at the ring. Nobody follows it. Everybody loves it.","no":"{W} walks out behind eight pawns, who stop halfway to argue about en passant. {W} goes on alone and starts warming up."},
 "otis":{"pitch":"Let me walk out with the spanner. I’ll do the turnbuckles myself. Built half the rings on this circuit. Old habits.","yes":"{W} walks out with a spanner and tightens all four turnbuckles, one after another. The ring crew applaud. So does everybody else.","no":"{W} tightens the last turnbuckle. The top rope goes twang and droops. {W} kneels to fix it, ribs taped, while the whole hall worries."},
 "kira":{"pitch":"Five of my trainees walk behind me. I blow a whistle. They bump. Together. Flat. They know.","yes":"{W} walks out with a whistle and five trainees. One blast and all five take a flat back bump in perfect time. The hall gasps.","no":"{W} blows the whistle. Four trainees bump. The fifth was looking at the raffle. {W} makes all five get up and do it again."},
 "ezra":{"pitch":"I will hand my opponent a letter on the way in. Typed. Brown envelope. It sets out the rules of the bout in full.","yes":"{W} hands the opponent a typed letter in a brown envelope. They open it. They read it. They look worried. So does the front row.","no":"{W} hands over the brown envelope. The opponent drops it, unopened, into the raffle bucket. {W} asks the referee for a receipt."},
 "red":{"pitch":"Bringing the dog. Called Hammer. Sits at ringside. Watches.","yes":"{W} walks out with a huge, calm dog called Hammer, who sits at ringside and stares at the opponent all match without blinking.","no":"{W} walks out with Hammer the dog. Hammer finds the raffle table, and the raffle has a meat prize. The interval comes early."},
 "roxy":{"pitch":"I shall enter beneath an umbrella, held aloft by an attendant. Indoors. It is not about the rain, Dennis. It is about status.","yes":"{W} glides down the aisle under a black umbrella held by a teenage steward. Indoors. The effect is somehow regal.","no":"{W} glides down the aisle under the umbrella, then stops beneath the ceiling tile that has been leaking since March. It is needed."},
 "silas":{"pitch":"I have timed my walk to the ring. Forty-one seconds. I would like a steward with a stopwatch, and the result announced.","yes":"{W} walks to the ring as a steward times it. Forty-one seconds exactly. The announcer reads it out. Applause, somehow.","no":"{W} walks to the ring as a steward times it. Forty-three seconds. {W} walks back to the curtain and does it again."},
 "night":{"pitch":"I come straight off nights anyway! Let me ride out stood on a pallet truck from the warehouse! Head torch on! Gaz’ll push!","yes":"{W} surfs down the aisle on a pallet truck, head torch blazing, pushed hard by a mate in hi-vis. The crowd start chanting “Nights!”","no":"{W} rides out on the pallet truck. Gaz gets the speed right but not the stopping. {W} arrives at the ring early, and partly under it."},
 "rev":{"pitch":"Fetch the hymn board from St Barnabas. I shall post the minute they receive the Last Rites. Prophecy is only good timekeeping.","yes":"{W} processes down the aisle behind the parish hymn board. It reads 12. The whole hall checks its watches, and a man at the back starts a stopwatch.","no":"{W} processes in behind the parish hymn board. Sunday’s numbers are still up: 104, 37, 212. The front row start singing one of them."},
 "malik":{"pitch":"My cousin can get us a horse. Well. A pony. A Knight on horseback, Dennis. Don’t ask whose it is. It goes back Thursday.","yes":"{W} rides down the aisle on a borrowed Shetland pony called Gary. Gary is the best-behaved person in the building, and gets a chant of its own.","no":"{W} rides in on a borrowed Shetland pony, which stops at the raffle table and will not move until it has eaten most of the tickets."},
 "dean":{"pitch":"Have a phone ring as I walk out. I answer it, listen, then hand it to the referee. “It’s for you.”","yes":"{W} walks out answering a ringing phone, listens gravely, then hands it to the referee. The hall roars.","no":"{W} walks out to a ringing phone that keeps ringing. Nobody can find it. It is in the raffle bucket."},
 "rocco":{"pitch":"Flint and steel. I strike it once at the curtain. One spark. Then I walk.","yes":"{W} strikes flint on steel at the top of the aisle. One spark, bright in the dark. The hall goes silent, then erupts.","no":"{W} strikes the flint at the top of the aisle. Nothing. Again. Nothing. On the ninth go a lad in the front row helpfully offers a lighter."},
 "nova":{"pitch":"Could the timekeeper ring the bell once as I step through the curtain? Just once. It is my name, after all.","yes":"{W} steps through the curtain to a single, perfect ring of the bell. The hall goes quiet, then claps in time.","no":"{W} steps through the curtain and the startled timekeeper rings the bell eleven times. Two people leave thinking the show is over."},
 "ace":{"pitch":"I shall enter twice. Once, then off, then back by public demand. It is called an encore. I shall need the am-dram curtains.","yes":"{W} enters, bows, and exits. The baffled crowd begin to clap. {W} returns by public demand through the am-dram society’s velvet curtains. Bravo.","no":"{W} enters, bows grandly and exits to await an encore. Nobody calls for one. After four minutes {W} comes back anyway, rather quieter."},
 "magnus":{"pitch":"Caretaker owes me one. I click my fingers, the lights go off. Blackout. Don’t ask what the favour was.","yes":"{W} clicks their fingers and the hall goes black. When the lights come up, {W} is already in the ring. The caretaker isn’t saying how.","no":"{W} clicks their fingers. Off go the lights, then the urn, then the ice-lolly freezer. The match starts by torchlight."},
 "tori":{"pitch":"My mate teaches physics and can lend us the big static ball! I touch it, my hair goes straight up! Static Shock! Please!","yes":"{W} walks out with a hand on a school Van de Graaff generator, hair standing straight up. Kids in the front row reach out and get zapped, delighted.","no":"{W} touches the school Van de Graaff generator. Nothing. A physics teacher fiddles. It finally works as the referee walks past. The referee’s hair stays up."},
 "faye":{"pitch":"I’d like to be preceded by my outstanding invoice. Itemised, on till roll, carried by two stewards. It is forty-one feet long.","yes":"{W} walks behind two stewards unrolling an itemised invoice the length of the aisle. The crowd read along, tutting. Somebody pays a pound towards it.","no":"{W} enters behind the itemised invoice. It snags on a chair and unspools under the seats. The front row spend the match passing it back."},
 "bao":{"pitch":"A padlock on the top rope. I pick it at the steps. Ten seconds. Then I get in. Everyone sees the exit is open.","yes":"{W} kneels at the ring steps, picks a padlock off the top rope in eight seconds and holds it up. The hall counts the last three aloud.","no":"{W} kneels to pick the padlock on the top rope. It is a combination lock. {W} thinks about this, then waits while the caretaker fetches bolt cutters."},
 "zara":{"pitch":"Okay so everyone gets their phone torches out, yeah? Hundred little sparks, I flip in under them. It’ll go everywhere. Is someone filming?","yes":"{W} flips down the aisle under a sky of phone torches. A hundred people film it. By the bell it has been shared nine times. Nine!","no":"{W} calls for phone torches. Half the crowd find the camera flash instead. {W} flips in, blinking, and lands in the wrong corner."},
 "miro":{"pitch":"Could I come in through the front doors? From the car park, with my bag? It’s how I always turn up. It’d feel honest.","yes":"{W} walks in from the car park through the front doors, kit bag on one shoulder. The hall stands up for somebody who has finally arrived on time.","no":"{W} comes in through the front doors from the car park. The woman on the ticket desk doesn’t recognise {W} and asks for six pounds. {W} pays it."},
 "aisha":{"pitch":"I come out and tear up a script. Any script. Nobody writes my ending but me.","yes":"{W} tears a script in half at the top of the aisle, then in quarters, then throws it like confetti. Nobody changes anything at half seven.","no":"{W} tries to tear the script in half. Dennis has had it laminated. {W} stares at the curtain for some time."},
 "ellis":{"pitch":"I would like to carry a large pencil. I have made one from a carpet tube. It is accurate in every respect except size.","yes":"{W} carries a sharpened carpet-tube pencil down the aisle. A small boy holds up a rubber. They nod to each other, solemnly.","no":"{W} carries a carpet-tube pencil to the ring. It will not fit through the ropes. {W} measures the gap, writes something down and leaves it outside."},
 "anya":{"pitch":"Twelve old tellies. Stacked. All on static. I walk out of the snow. Signal Loss.","yes":"{W} steps out from a wall of twelve rescued tellies, all hissing blue static. Cool. Clipped. Gorgeous. The crowd go silent, then go up.","no":"{W} steps out from a wall of twelve old tellies. One finds a signal and shows the snooker. Half the front row turn to watch it."},
 "nolan":{"pitch":"Let my trainees carry the ring steps out with me. They need to learn how heavy everything is.","yes":"{W} walks out ahead of four trainees carrying the ring steps in perfect time. They set them down without a sound. The crowd applauds the steps.","no":"{W} walks out ahead of four trainees with the ring steps. They go the wrong way round the ring twice before anyone says anything."},
 "ivo":{"pitch":"I will navigate to the ring by compass. I’ve taken a bearing from the curtain. Three hundred and four degrees. There is no other route.","yes":"{W} walks to the ring on a perfect compass bearing, map folded correctly. A rambler in the third row applauds the folding.","no":"{W} follows a compass bearing from the curtain. The radiators pull the needle. {W} arrives at the tea urn, confirms the reading and starts again."},
 "rina":{"pitch":"One lamp. The old standard lamp from the green room, carried ahead of me. I follow it like a moth. Slowly. Ropes nearest the bar.","yes":"{W} follows a standard lamp down the aisle, drawn to it like a moth. A volunteer carries it with enormous care. The hall holds its breath.","no":"{W} follows the green-room standard lamp. Its flex reaches exactly halfway down the aisle. They wait there, glowing, for an extension lead."},
 "priya":{"pitch":"First, a woman in silver lapels walks out. Then I do. Double exposure. They’ll spend the match wondering which of us was real.","yes":"{W} sends out a double in matching silver lapels, then steps out behind them. The crowd look from one to the other and cheer both.","no":"{W} sends out a double in silver lapels. The double waves so warmly they get the bigger cheer. {W} makes a note, for a callback."},
 "nate":{"pitch":"I want to stick a red notice on the other corner. “Goods seized.” Then I sit on the turnbuckle like I own it.","yes":"{W} slaps a red “Seized” notice on the opposite corner and sits on the turnbuckle, arms folded. The hall boos like it is personal.","no":"{W} slaps a “Seized” notice on the corner. It falls off. {W} spends the opening minute looking for the tape."},
 "cass":{"pitch":"Let the front row cut a deck of cards. The card they turn up picks my entrance. I haven’t planned any of them. Kidding. Mostly.","yes":"{W} lets a pensioner cut the deck. Queen of hearts: {W} waltzes the pensioner all the way to the ring. The hall rises as one.","no":"{W} offers the deck to the front row. A small boy pockets the lot and legs it. {W} spends the entrance negotiating its return."},
 "jun":{"pitch":"I’ve studied how my opponent walks to the ring. Every step. Could I do their walk, just before they do? Quietly.","yes":"{W} walks out in a perfect copy of the opponent’s entrance, down to the shoulder roll. The opponent, following, looks rattled. The hall chants “Switch!”","no":"{W} copies the opponent’s entrance step for step, but it’s last month’s. The opponent has changed it. {W} stops in the aisle and takes notes."},
 "sylvia":{"pitch":"I’ll bring a cushion. Velvet. I put it in their corner. For after.","yes":"{W} places a plum velvet cushion in the opponent’s corner and pats it twice. Nobody in the hall breathes. The opponent won’t look at it.","no":"{W} places a velvet cushion in the opposite corner. The opponent sits on it, says it’s lovely, and asks where {W} got it."},
 "kofi":{"pitch":"This hall’s got wall bars! Can I come in along the wall bars? Hand over hand, the whole length! Has anyone measured them? I’ll measure them!","yes":"{W} crosses the sports hall along the wall bars, hand over hand, and drops onto the apron. The badminton club, still in their whites, go berserk.","no":"{W} sets off along the wall bars and stalls behind the netball posts. The caretaker fetches a stepladder. {W} thanks everyone individually on the way down."},
 "mae":{"pitch":"Could the Saturday kids’ class line the aisle? They’ve been practising their bows. Ten minutes, love, then their mums can take them home.","yes":"{W} walks between two rows of bowing children from the Saturday class. One of them gets it exactly right. {W} stops to say so.","no":"{W} walks into the Saturday class’s guard of honour. They have rehearsed a tackle instead. {W} goes down very gently and gives them all a gold star."},
 "theo":{"pitch":"My request is the absence of one. No music. House lights up. I walk to the ring like someone walking to work. It will be shocking.","yes":"{W} walks out in total silence under the full strip lights. You can hear the urn ticking. It is the most frightening entrance of the year.","no":"{W} asks for silence. The sound desk mishears and plays the jingle for the trampoline park on the ring road. {W} walks the aisle stiffly, in time."},
 "soraya":{"pitch":"I will enter carrying the world. The primary school has a papier-mâché globe from topic week. A hire fee has been agreed. In writing.","yes":"{W} enters with the primary school’s papier-mâché globe on one shoulder, unbowed. Year Four, in the front row, are beside themselves.","no":"{W} shoulders the papier-mâché globe. It is wetter than advertised. Europe comes away in one hand. {W} returns it to Year Four, itemised."},
 "milo":{"pitch":"Can somebody do a station announcement? “The next arrival at ring one is the Last Train.” I’ve got a guard’s whistle! I’ve had it for years!","yes":"{W} arrives to a perfect tannoy announcement and a shrill guard’s whistle, chuffing down the aisle with both arms going. The hall shouts “All aboard!”","no":"{W} waits for the announcement. It says the Last Train is delayed owing to leaves on the line. {W} arrives late, apologising to each row in turn."},
 "winnie":{"pitch":"A short demonstration on the way in. Washing-up liquid, peroxide, a pinch of yeast as catalyst. It foams. Goggles compulsory. Lab coat optional.","yes":"{W} adds the catalyst at the top of the aisle and a column of foam surges out of a measuring jug, exactly on cue. The crowd cheer like it’s a goal.","no":"{W} adds the catalyst. Nothing. {W} checks the label and explains the theory to the front row. It foams at last, quietly, during the second fall."},
 "bronte":{"pitch":"Foghorn. Sailing club’s got one. One blast when I come out. That’s it.","yes":"{W} walks out to one long blast of the sailing club’s foghorn. The windows rattle. Nobody in the front row moves until {W} has gone past.","no":"{W} walks out to the foghorn, which gives a small, damp parp, like a goose with a cold. {W} keeps walking. Nobody presses it again."},
 "gus":{"pitch":"I’ll walk out in my hi-vis and do a two-minute safety briefing. Fire exits, wet floors, the lot. Somebody has to.","yes":"{W} walks out in hi-vis and points out every fire exit like cabin crew. The crowd point along and cheer each one.","no":"{W} begins the safety briefing in hi-vis and gets as far as wet floors before tripping on the ring steps. It goes in the accident book."},
 "nikita":{"pitch":"Build a wall at the curtain. Boxes, whatever. I go through it. Don’t rehearse it. Don’t check it. I’ll know when.","yes":"{W} goes straight through a wall of stacked cardboard boxes without breaking stride. Bits of box are still coming down when the bell goes.","no":"{W} charges the wall of boxes, which turn out to be the raffle prizes. {W} spends the entrance on hands and knees putting the tins of peaches back."},
 "jett":{"pitch":"Can the big lads make a staircase? Crouched, in a row! I run up their backs and flip in! They won’t mind. They might mind.","yes":"{W} sprints up a staircase of crouched big lads and backflips over the top rope. The big lads take a bow. The crowd make them do it again.","no":"{W} sprints up the big lads’ backs. The top one stands up to wave. {W} enters the ring the traditional way, by sliding in under the bottom rope."},
 "alina":{"pitch":"The community choir rehearses next door on Tuesdays. I wondered if they might hum me in. Softly. Nothing with words.","yes":"{W} walks out to the community choir humming from the balcony. By the ring half the hall is humming too, and a steward has gone quite pink round the eyes.","no":"{W} enters to the community choir, who have misunderstood and launch into a full-throated sea shanty. {W} adjusts, and sways graciously to the ring."},
 "cedric":{"pitch":"Might I call a character witness on the way in? Someone from the bowls club. Have they been coached? Define coached.","yes":"{W} halts mid-aisle and calls a character witness from the bowls club, who swears {W} is a decent sort. The hall votes, by show of hands, to acquit.","no":"{W} calls the witness from the bowls club, who stands, squints, and testifies at length about somebody else entirely. {W} has no further questions."},
 "marisol":{"pitch":"I start the entrance tied into a deckchair at the top of the aisle. Then I get out. Slowly. They’ll like me more once they’ve worried.","yes":"{W} begins strapped into a deckchair and works free one limb at a time. By the last knot the whole hall is clapping in rhythm.","no":"{W} starts strapped into a deckchair and cannot get out. Two stewards carry the deckchair to the ring with {W} still in it, looking faintly sarcastic."},
 "felix":{"pitch":"Could someone hold a clapperboard at the curtain? “Take two.” I’ve made one out of a chopping board. It’s a metaphor. Sorry.","yes":"{W} walks out to a homemade clapperboard snapping shut: “Take two.” The crowd shout “Take two!” every time {W} gets up off the mat.","no":"{W} walks past the clapperboard, which snaps shut on a sleeve. The crowd yell “Take three!” {W} laughs, frees the sleeve and calls it growth."},
 "eira":{"pitch":"Shortest route. Diagonal across the hall, not round by the aisle. Forty-one degrees. Chairs in the way get moved.","yes":"{W} cuts across the hall at exactly forty-one degrees. The rows of chairs part ahead like a zip. The crowd applaud the geometry.","no":"{W} sets off at forty-one degrees and meets the tea urn table. {W} recalculates, out loud. The new route goes straight through the raffle."},
 "gideon":{"pitch":"A weigh-in on the way past. I have brought my bathroom scales. Let them see the weight before they feel it.","yes":"{W} steps onto bathroom scales in the middle of the aisle. A child reads out the number in awe. The front row repeat it to each other all night.","no":"{W} steps onto the bathroom scales, which read zero, then error, then a cheerful beep. {W} kneels, slowly, and spends two minutes recalibrating them."},
 "vera":{"pitch":"The walk to the ring takes forty-two seconds. I’d like the timekeeper to call splits aloud. Ten metres. Twenty. It builds tension.","yes":"{W} reaches the ring as the timekeeper calls forty-two seconds dead. The whole hall joins in for the last ten and roars at the bottom step.","no":"{W} sets off to the timekeeper’s splits. A conga from the birthday party at the bar crosses the aisle. {W} arrives at a minute nine, very still."},
 "tomas":{"pitch":"I’ve had my coat lined in the other lad’s colours, Dennis. Reversible. You’ve such a good eye, you’ll see the beauty of it.","yes":"{W} walks out to cheers in the opponent’s colours, then turns the pinstripe coat inside out halfway down. The hall boos with real joy.","no":"{W} tries to turn the coat inside out mid-aisle. One sleeve sticks. {W} reaches the ring half in each colour, smiling at both sides."},
 "ari":{"pitch":"Could the lights go off and I walk in through the beam of my uncle’s old cine projector? Just the beam. The dust looks like snow.","yes":"{W} walks to the ring through a single projector beam, dust drifting round like snow. The hall goes silent. Someone whispers “oh”.","no":"{W} walks into the projector beam. It is still loaded with a road-safety cartoon. The hall watches a hedgehog cross the road instead."},
 "tomasash":{"pitch":"Let me skip rope down the aisle. Proper boxer’s footwork. Thirty years and I’ve never tripped. Don’t jinx it.","yes":"{W} skips rope all the way to the ring without missing a beat, then shrugs. An old boxer in row three nods, very slowly.","no":"{W} skips down the aisle and clips the raffle table on the backswing. Tickets everywhere. {W} picks up every one before the bell."},
 "kezia":{"pitch":"Could the front row hold up scorecards as I come in? I’ll do a bridge at the bottom of the ramp. I’d really like the marks.","yes":"{W} holds a perfect bridge at the foot of the ramp. The front row holds up nine, nine, nine and a half. {W} writes them all down.","no":"{W} bridges at the foot of the ramp. The scorecards read six, seven and “BUS 42”. One of them is the back of a timetable."},
 "dev":{"pitch":"Have the youngsters line the aisle with torches under orange sweet wrappers. Golden hour. I walk through it slowly, and they watch how.","yes":"{W} walks through an aisle of rookies holding orange-wrapped torches. The hall glows like a June evening. The rookies stand taller.","no":"{W} walks through the rookies’ torches as the batteries die one by one. {W} finishes lit by a single phone and calls that the point."},
 "liya":{"pitch":"Can the caretaker flick the hall lights on every beat of my music? I’ve written the beats down. There’s only sixty-four. Easy!","yes":"{W} walks out as the caretaker flicks the lights bang on the beat. On the drop, {W} lands on the apron. It’s a nightclub. In a Legion hall.","no":"{W} walks out to the flickering lights. The caretaker is one beat behind, then four, then flicking to a song only the caretaker can hear."},
 "emmett":{"pitch":"I will walk to the ring in exactly thirty-eight steps. A student will count them aloud. I measured the aisle on Thursday.","yes":"{W} walks to the ring as a student counts each step. Thirty-eight lands precisely on the apron. The hall applauds the arithmetic.","no":"{W} walks thirty-eight counted steps. Someone has moved the raffle table. Thirty-eight lands in the tombola. {W} starts again from one."},
 "nadia":{"pitch":"Kill the lights. My cousin’s rigged a colander over a lamp. Stars on the ceiling. I walk out underneath the whole universe.","yes":"{W} walks out under a ceiling of colander stars. Every phone in the hall goes up. By morning the clip has a following of its own.","no":"{W} walks out beneath the colander stars. The lamp tips over. The entire universe is now projected onto the bloke selling raffle tickets."},
 "leandro":{"pitch":"What if I come down the leisure centre climbing wall? It’s right there! Abseil in! The bloke on reception’s got harnesses!","yes":"{W} abseils down the climbing wall in the mask, waving at the top and the bottom. The hall chants “Sky-line” all the way down.","no":"{W} gets halfway down the climbing wall and the rope locks. {W} waves gamely from a purple handhold until the duty manager finds a ladder."},
 "iris":{"pitch":"I’ll do a risk assessment on the way out. Clipboard, gaffer tape. That cable by row two has needed taping down for a month.","yes":"{W} walks out with a clipboard, tapes down the cable by row two and tests the ropes. The crowd cheers each fix like a near fall.","no":"{W} risk-assesses the walk to the ring. The clipboard finds eleven hazards. The match starts twenty minutes late, but very safely."},
 "kellan":{"pitch":"Fairy lights! All over my jacket! Battery pack in my pocket! Cyan ones! Why wait till Christmas?","yes":"{W} sprints out in a jacket of cyan fairy lights, blinking on the fastest setting. The kids at the front go electric.","no":"{W} sprints out in a fairy-light jacket. Only one sleeve lights up, and it is stuck on “gentle twinkle”."},
 "ayla":{"pitch":"I shall set a sand timer on the apron as I enter. It runs the length of the match. Watch the sand. It all comes back round.","yes":"{W} sets a big sand timer on the apron and turns it with great ceremony. The hall keeps glancing at it. The last grain falls with the pin.","no":"{W} turns the sand timer on the apron with great ceremony. It is a three-minute egg timer. It runs out during the handshake."},
 "sasha":{"pitch":"I’ll freeze every ten steps and only move again when the family side cheers loud enough. Musical statues. They’ll love it.","yes":"{W} freezes every ten steps until the family side roars. By the ring the whole hall has joined in, and the cheers are deafening.","no":"{W} freezes mid-aisle and waits for the family side to cheer. They have all gone to the tea urn. {W} waits. And waits."},
 "morgan":{"pitch":"The ring announcer will read clause fourteen of my contract as I walk out. Every subsection. That isn’t a request.","yes":"{W} walks out as the announcer reads clause fourteen in full. The crowd boos each subsection. {W} initials the ring post.","no":"{W} walks out to clause fourteen. The announcer has the wrong page and reads the bouncy-castle hire terms. {W} insists on all of them."},
 "noelle":{"pitch":"I propose the timekeeper announce me with “All rise”. Firstly, it is fitting. Secondly, I have brought my own gavel.","yes":"{W} enters to a cry of “All rise”. The whole hall stands. {W} climbs the ring steps as if taking the bench.","no":"{W} enters to “All rise”. Half the hall stands, the other half shouts “sit down”, and the gavel head flies off into the tea urn."},
 "ash":{"pitch":"The night watchman’s dog. Big one. It walks with me. Doesn’t bark.","yes":"{W} walks out with the night watchman’s Alsatian at heel. Neither makes a sound. Nobody in the front row dares open their crisps.","no":"{W} walks out with the night watchman’s dog, which rolls over for a child in row two and will not budge. {W} waits. In silence."},
 "zane":{"pitch":"Could I carry my dad’s old hod down the aisle? Bricks in it, just for show. Dad’s coming tonight. I think it’d mean a lot.","yes":"{W} walks out with the old hod of bricks on one shoulder. A man in the back row stands and claps very hard, then sits down quickly.","no":"{W} walks out with the hod. The bricks are real and the hod is heavy. A volunteer helps unload them at the steps, one at a time."},
 "elodie":{"pitch":"I keep a little book of everyone who promised me a title shot. I’d like to read one name aloud on the way in. Shall I guess whose?","yes":"{W} stops halfway, opens a small black notebook and reads out one name. The hall gasps. Nobody knows who it is. Everyone loves it.","no":"{W} opens the little black notebook at the wrong page and reads out a shopping list with enormous menace. “Eggs?” The hall boos anyway."},
 "bashir":{"pitch":"Let one of the young ones walk in front with a stop-go board. Borrowed it off the council lads. Good lesson in timing, that.","yes":"{W} walks out behind a rookie with a stop-go board, waiting patiently on “stop”. On “go”, the hall roars. Best traffic the town’s ever had.","no":"{W} follows the rookie’s stop-go board. The rookie panics and leaves it on “stop”. {W} waits, then walks them both round the long way."},
 "cleo":{"pitch":"Put a flipchart by the ring with the match plan on. Big letters. The front row can shout when somebody wanders off it.","yes":"{W} unveils a flipchart of the match plan at ringside. All night the front row yells “minute six!” at exactly the right moment.","no":"{W} unveils the flipchart. It is still on last week’s quiz-night scores. The front row shouts the answer to question nine all match."}
 };
 const DAFT_MORE={
 grand:[
  {"pitch":"I require a fanfare. The Legion has a bugler. Two bars will suffice. Three would be vulgar.","yes":"{W} pauses at the curtain while the Legion bugler plays two crisp bars. The hall stands up without quite knowing why.","no":"{W} pauses at the curtain. The Legion bugler plays two bars, then, from muscle memory, the tune off the ice-cream van."},
  {"pitch":"A carpet. Red. The full length of the aisle. The carpet shop on Mill Street has an end of roll. I have measured.","yes":"{W} processes down a red carpet the full length of the aisle. People lean in to touch it. It is the best night the carpet shop has had.","no":"{W} processes down the red carpet, which ends six feet short of the ring. {W} finishes the walk on the lino, with dignity."},
  {"pitch":"I have engaged a town crier. They do the farmers’ market. I have paid in advance. In full. Do not let them improvise.","yes":"{W} enters behind a town crier who rings a handbell and proclaims {W} in a voice that rattles the windows. The crowd chant “Oyez!”","no":"{W} enters behind a town crier, who proclaims {W}’s name, then carries on with the bin collection changes and a lost cat."}],
 gruff:[
  {"pitch":"Lights off. Then on. I’m in the ring.","yes":"{W} has the hall plunged into darkness. The lights snap back on and {W} is standing in the ring. Nobody saw how. A child cries, happily.","no":"{W} has the hall plunged into darkness. The lights come back on early. {W} is halfway through the ropes, one leg in, and stays very still."},
  {"pitch":"Folding chair. By the curtain. I sit. They wait.","yes":"{W} sits on a folding chair by the curtain and stares at the ring for a full minute before standing. The opponent starts sweating.","no":"{W} sits on a folding chair by the curtain. It belongs to the woman selling raffle tickets, who wants it back, now, and gets it."},
  {"pitch":"Bucket of ice. I put my head in it. Then I walk.","yes":"{W} plunges their head into a bucket of ice at the curtain, comes up dripping and walks to the ring. The front row shiver for them.","no":"{W} plunges their head into the bucket of ice from the bar. There is still a bottle of white wine in it. The bar staff want both back."}],
 eager:[
  {"pitch":"I could ride in on my nephew’s BMX! It’s got pegs! I’ve been practising in the car park all week!","yes":"{W} rides down the aisle on a nephew’s BMX, standing on the back pegs, arms out. The nephew, in the front row, is the proudest boy alive.","no":"{W} rides in on a nephew’s BMX. The chain comes off by the tea urn. The nephew climbs over two rows to put it back on."},
  {"pitch":"The leisure centre’s got a mascot costume! A badger! I come out as the badger, then whip the head off! Big reveal!","yes":"{W} waddles out as the leisure centre badger, then whips off the head. The children scream with joy. One asks for the badger back.","no":"{W} comes out as the leisure centre badger and tries to whip the head off. It is stuck. {W} wrestles the first two minutes as the badger."},
  {"pitch":"What if I start a conga? Down the aisle, round the raffle table, into the ring! Everyone loves a conga!","yes":"{W} leads a conga down the aisle, round the raffle table and up to the ring. Thirty people join. Two of them refuse to get out of the ring.","no":"{W} starts a conga. It gathers forty people, takes a wrong turn at the raffle table, and heads off to the bar. {W} arrives alone."}],
 stoic:[
  {"pitch":"I’ll bring my flask. Pour a cup on the apron. Drink it. Then we start.","yes":"{W} sits on the apron, pours a cup from a tartan flask and drinks it slowly. The crowd wait. It is the most menacing thing they have ever seen.","no":"{W} sits on the apron and unscrews a tartan flask. It is soup. {W} drinks it anyway, while the referee checks the time."},
  {"pitch":"Pigeon from the allotment. I let it go at the curtain. It knows its way home. So do I.","yes":"{W} releases a racing pigeon at the curtain. It circles once and flies out of the fire door, straight for home. The hall applauds the pigeon.","no":"{W} releases a racing pigeon at the curtain. It settles on the lighting rig and watches the whole show. It does not go home."},
  {"pitch":"Old Harold from the Legion can carry the standard in front of me. Slow march. Proper.","yes":"{W} follows the Legion standard down the aisle at a slow march. Nobody asks for quiet. The whole hall gives it anyway.","no":"{W} follows the Legion standard at a slow march. Harold’s slow march is slower than anyone planned. The interval is brought forward."}],
 precise:[
  {"pitch":"Before I get in, I would like to measure the ring. Publicly. With a tape. If it isn’t regulation, people deserve to know.","yes":"{W} measures each side of the ring with a builder’s tape and nods once. It is regulation. The crowd give the ring a round of applause.","no":"{W} measures the ring and finds one side four inches short. {W} declines to begin until a referee stands in the gap to make up the difference."},
  {"pitch":"I’d like a full kit inspection at the curtain. Laces, tape, mouthguard. Called aloud, like a pre-flight check. It reassures people.","yes":"{W} stands for inspection at the curtain while the referee calls each item. By the mouthguard, the crowd are shouting “Check!” after every one.","no":"{W} stands for inspection. The referee finds a mint tucked in a wrist tape and confiscates it. {W} agrees this is entirely correct."},
  {"pitch":"I’ve typed up my own introduction. Height, reach, record to one decimal place. Plus corrections to last week’s. Single-sided.","yes":"{W} is introduced from a typed card, every figure exact. The crowd cheer each statistic like a goal and boo the one that was wrong last week.","no":"{W} hands over a typed introduction. The announcer reads all of it, including “do not read this line aloud”. {W} nods. Fair."}],
 earnest:[
  {"pitch":"My niece has painted me a banner. It’s mostly glitter. Could two people hold it at the curtain? It took a whole half-term.","yes":"{W} bursts through the niece’s homemade banner in a cloud of glitter. The front three rows will be sparkling for a week. Nobody minds.","no":"{W} tries to burst through the banner, but it’s painted on a bedsheet and will not tear. {W} ducks underneath, apologising to the bedsheet."},
  {"pitch":"Could I shake hands with the whole front row on the way in? Properly. Names and everything. I won’t keep the match waiting. Much.","yes":"{W} shakes hands with the entire front row and remembers every name. By the bell they’re chanting {W}’s name back, and some of each other’s.","no":"{W} shakes hands with the front row, one at a time, chatting, and is only on seat nineteen when the bell goes. The referee comes to fetch {W}."},
  {"pitch":"I’ve baked flapjacks for the front row. Is that allowed? I’ve done a tray without nuts. It’s labelled. Twice.","yes":"{W} hands out flapjacks down the aisle. By the ring the front row have become a supporters’ club, with crumbs down their fronts.","no":"{W} offers flapjacks to the front row. They are rock hard. A man taps one on the barrier and it clangs. {W} apologises all the way to the ring."}],
 sermon:[
  {"pitch":"I shall be preceded by a bell. A handbell. The primary school has one. Let the people know that I am coming.","yes":"{W} enters behind a tolling handbell, slow as a procession. By the ring steps the whole hall has fallen silent.","no":"{W} enters behind a ringing handbell. Everyone assumes it is last orders. The queue at the bar doubles."},
  {"pitch":"Let there be a choir. The Legion has three men who can hold a note. Three is a choir. I have checked.","yes":"{W} processes to the ring behind three men from the Legion humming something solemn. By the steps the whole hall is humming too.","no":"{W} processes behind the Legion choir. They begin in three different keys and stay loyally in them all the way down the aisle."},
  {"pitch":"I shall speak to the people from a stepladder. One minute. No more. A short sermon is a kind sermon.","yes":"{W} climbs a stepladder in the aisle and speaks for exactly one minute. The hall says “amen” at the end. Nobody planned that.","no":"{W} preaches from a stepladder until the caretaker needs it back for a light bulb. {W} finishes the sermon from the floor."}],
 slippery:[
  {"pitch":"Mate of mine does the ice cream van. Parks it by the fire doors, plays the chime as I come in. Small fee. Very small.","yes":"{W} enters to the chime of an ice cream van parked at the fire doors. By the interval the hall has sold out of choc ices.","no":"{W} enters to the van’s chime. The van then drives off, still chiming, and half the children in the hall chase it into the car park."},
  {"pitch":"I’ve got a lad who’ll flog my T-shirts down the aisle as I walk. Proper ones. Well. Near enough.","yes":"{W} walks out as a lad flogs T-shirts down the aisle. Twenty go in a minute. {W} takes a cut on the way past.","no":"{W} walks out to a lad flogging T-shirts. The shirts have someone else’s name on. {W} insists it is an old nickname."},
  {"pitch":"I’ll come out of the crowd. I’ve bought a ticket. Row F. Anorak on. Nobody will suspect a thing.","yes":"{W} stands up in row F, peels off an anorak and vaults the barrier. The hall had no idea. The man in the next seat is thrilled.","no":"{W} goes to stand up from row F. Someone else is in the seat. A long ticket dispute follows, and {W} makes the big reveal from the stairs."}]
 };
 // Whose idea it is: their own about two times in three, otherwise one of their voice type's.
 function daftFor(st,X){
  const mine=DAFT_OWN[X.id],pool=[DAFT[voice(X)],...(DAFT_MORE[voice(X)]||[])].filter(Boolean);
  if(mine&&rng(st.seed,'daft-own|'+X.id)<2/3)return mine;
  return pool[Math.floor(rng(st.seed,'daft-pool|'+X.id)*pool.length)]||DAFT.stoic;
 }
 const SITUATIONS=[
  {id:'note',kind:'room',weight:3,when:x=>!!NOTES[x.st.promoter.id],
   open(st){const n=pick(NOTES[st.promoter.id],st.seed,'note');st.note={...n,honour:null};log(st,'agent','A note from '+st.promoter.voice+'. '+n.text);},
   title:st=>'The promoter’s note'+(st.note?.short?': '+st.note.short:''),ask:st=>st.promoter.voice+' sent it down from the office. How do you answer?',
   options:st=>[
    {id:'honour',label:'“Tell them we’ll do it.”',hint:'The match is steered to keep the promise.',tags:[first(st)+' ▲ if kept',first(st)+' ▼▼ if broken','Limits the match'],
     run(st){st.note.honour=true;log(st,'agent','I’ll tell them. They’ll be thrilled. They won’t, but I’ll tell them.');}},
    {id:'judgement',label:'“They’ll use their judgement.”',hint:'No promise. If it happens to be broken, the promoter is put out.',tags:[first(st)+' ▼ if broken'],
     run(st){st.note.honour=false;log(st,'agent','“Judgement.” Right. I’ll write that down in pencil.');}},
    {id:'argue',label:'“Give me the phone.”',hint:'Argue the note away. It works about two times in five.',tags:['Gamble',first(st)+' ▼ if it fails'],
     run(st){st.note.honour=false;if(rng(st.seed,'argue')<.4){st.note.waived=true;log(st,'agent','I don’t know what you said, but '+st.promoter.voice+' has gone very quiet and the note is withdrawn.');}
      else{st.note.argued=true;log(st,'agent','That went well. The note stands, and '+st.promoter.voice+' is now in a mood.');}}}]},
  {id:'big_spot',kind:'match',weight:3,when:x=>!!(pitchFor(x.st,'payoff','w')&&pitchFor(x.st,'payoff','f')),
   open(st){
    // Whoever does not have the big spot on the running order wants it.
    const cur=st.board.payoff,holder=cur&&cur.owner!=='either'?cur.owner:null;
    const s=holder?other(holder):(st.w.ego>=st.f.ego?'w':'f');st.rival=s;st.rivalPitch=pitchFor(st,'payoff',s);
    log(st,'agent',holder?nameOf(st,s)+' has read the running order. '+nameOf(st,s)+' has opinions about the big spot.':'Near-falls for the big spot. Not everybody is happy about that.');
    log(st,s,say(st,'big',who(st,s),'big',{move:st.rivalPitch.label}),'objection');},
   title:'Somebody wants the big spot',ask:'Whose moment is it?',
   options(st){
    const s=st.rival,c=st.rivalPitch,X=who(st,s),Y=who(st,other(s)),cur=st.board.payoff,held=cur&&cur.owner===other(s);
    const m=s==='w'?'moodW':'moodF',o=s==='w'?'moodF':'moodW',unsafe=c.risk&&X.safe<58;
    const keep={[m]:X.ego>=68?-5:-2};
    const give={[m]:4,[o]:held?(Y.ego>=68?-5:-2):undefined,crowd:c.risk?2:1,plan:{slot:'payoff',owner:s,by:s,action:c.action,label:c.label,impossible:c.impossible}};
    const none={[m]:1,[o]:held?-1:undefined,spice:-1,plan:{slot:'payoff',owner:'either',by:'agent',action:'scheduled_nearfall',label:'A run of near falls'}};
    const out=[
     {id:'keep',label:cur&&cur.action!=='scheduled_nearfall'?'“The '+cur.label+' stays.”':'“Near falls. As agreed.”',hint:'The running order stands. '+X.short+' takes it badly.',fx:keep,tags:tagsOf(st,keep),
      run(st){log(st,s,say(st,'grumble',X,'spot'));}},
     {id:'give',label:'“Fine. The '+c.label+'.”',hint:X.short+' gets the moment.'+(unsafe?' '+Y.short+' does not trust '+X.short+' with it.':''),fx:give,
      tags:[...tagsOf(st,give),...(c.risk?['High risk']:[]),...(c.impossible?['Will not work']:[])],
      run(st){
       if(c.impossible)log(st,'agent',pick(['With respect, '+Y.short+' weighs the same as a Ford Fiesta. '+X.short+' is not lifting a Ford Fiesta.','I’ll say what nobody else will. '+X.short+' cannot physically do that to '+Y.short+'. I’ve seen '+X.short+' struggle with the kit bag.'],st.seed,'imp'));
       else if(unsafe)log(st,other(s),say(st,'safety',Y,'spot'),'objection');
       else if(held&&Y.ego>=68)log(st,other(s),say(st,'ego',Y,'spot'),'objection');
       log(st,s,say(st,'pleased',X,'spot'));}}];
    const later={[m]:-1};
    out.push({id:'later',label:'“Not tonight. Next time it’s yours.”',hint:X.short+' takes the promise, and will hold you to it.',fx:later,tags:[...tagsOf(st,later),'Comes back next time'],
     run(st){log(st,s,say(st,'accept',X,'later'));carry(st,{sit:'promise_due',sid:X.id});}});
    if(cur?.action!=='scheduled_nearfall')out.push({id:'nobody',label:'“Then nobody gets it. Near falls.”',hint:AGENT+'’s compromise. Nobody is thrilled.',fx:none,tags:tagsOf(st,none),
     run(st){log(st,'agent','Cheaper on the knees. I approve.');}});
    return out;}},
  {id:'debut',kind:'match',weight:3,when:x=>!!pitchFor(x.st,'payoff','w'),
   open(st){const c=pitchFor(st,'payoff','w');st.debut=c;
    log(st,'w',tone(st,'w',{grand:'I have been perfecting something. The {m}. It deserves an audience.',gruff:'Got a new one. The {m}. Want to try it.',eager:'I’ve got a new move! The {m}! It worked once! On a crash mat!',
     stoic:'I’ve been working on the {m}. At my age you don’t get many new ones.',precise:'I have a new technique: the {m}. Success rate in training, sixty per cent.',earnest:'I’ve been practising the {m}. I think it’s ready. I think.',
     sermon:'It has been revealed to me. The {m}.',slippery:'I’ve got a new move. The {m}. Don’t ask where I got it.'}).replace(/\{m\}/g,c.label));
    log(st,'agent','I’ve seen it. Once. From a distance. Through my fingers.');},
   title:'{W} wants to try something new',ask:'Do they get to?',
   options(st){
    const c=st.debut,plan={slot:'payoff',owner:'w',by:'w',action:c.action,label:c.label,impossible:c.impossible};
    const b={moodW:-3,morale:-1},d={moodW:1,spice:-1,plan};
    return [
     {id:'try',label:'“Tonight’s the night.”',hint:'If the '+c.label+' lands, they will talk about it. If it does not, they will also talk about it.',tags:['Gamble',st.w.short+' ▲','Crowd ▲ or ▼',st.board.payoff?'Changes the big spot':'Goes in the match layout'],
      run(st){st.mood.w+=4;apply(st,{plan,crowd:rng(st.seed,'debut')<.35+st.w.ring/200?3:-2});log(st,'w',say(st,'pleased',st.w,'debut'));}},
     {id:'wait',label:'“Save it for a bigger night.”',hint:'Sensible. Deflating.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'grumble',st.w,'debut'));}},
     {id:'walk',label:'“Show '+AGENT+' first.”',hint:'A walk-through in the corridor. Safer, and a little less special.',fx:d,tags:tagsOf(st,d),run(st){log(st,'agent','We’ve walked it through. I’ve only got the one bruise.');}}];}},
  {id:'wont_job',kind:'match',weight:4,when:x=>{const L=x.loser;return L.ego>=66&&L.pro<88;},
   open(st){const s=st.loserSide;log(st,s,cap(tone(st,s,{grand:'I am to lose? To {them}? Has somebody checked the paperwork?',gruff:'I’m not lying down for {them}.',eager:'Do I have to lose? I’ve told people I was winning.',
     stoic:'I’ll do the job. I’d like it noted that I’ve done a lot of jobs.',precise:'A loss to {them} damages my ranking by a measurable amount. I object.',earnest:'I’ll lose if you need me to. I just thought I was doing well.',
     sermon:'I am asked to fall before {them}. I have fallen before better.',slippery:'Losing to {them} costs extra. I don’t make the rules.'}).replace(/\{them\}/g,nameOf(st,other(s)))),'objection');
    log(st,'agent','It’s in the contract. I’m only saying what the contract says.');},
   title:'Somebody doesn’t want to lose',ask:'What do you tell them?',
   options(st){
    const s=st.loserSide,L=who(st,s),m=s==='w'?'moodW':'moodF',o=s==='w'?'moodF':'moodW';
    const firm={[m]:L.pro>=80?-4:-8};
    const slot=s==='w'?'reversal':'pressure',c=pitchFor(st,slot,s);
    const strong={[m]:3,[o]:who(st,other(s)).ego>=70?-2:undefined,...(c?{plan:{slot,owner:s,by:s,action:c.action,label:c.label}}:{})};
    const out=[
     {id:'contract',label:'“It’s in the contract.”',hint:'True. Not popular.',fx:firm,tags:tagsOf(st,firm),run(st){log(st,s,say(st,'grumble',L,'job'));}},
     {id:'strong',label:'“You’ll look strong doing it.”',hint:c?'Promise them the '+c.label+' on the way down.':'Promise them a good showing.',fx:strong,tags:tagsOf(st,strong),run(st){log(st,s,say(st,'accept',L,'job'));}}];
    if(s==='w'){const pay={cash:-40,moodW:5};out.push({id:'pay',label:'“There’s forty quid in it.”',hint:'Out of tonight’s purse.',fx:pay,tags:tagsOf(st,pay),run(st){log(st,s,say(st,'sweet',L,'job'));}});}
    else out.push({id:'word',label:'“'+AGENT+', have a word.”',hint:AGENT+' is persuasive about two times in three.',tags:['Gamble',L.short+' ▲ or ▼'],
     run(st){if(rng(st.seed,'word')<.45+L.pro/220){st.mood.f+=2;log(st,'agent','I’ve had a word. I mentioned the time I carried '+L.short+' through a forty-minute draw in Rhyl. We’re fine.');log(st,s,say(st,'accept',L,'word'));}
      else{st.mood.f-=6;log(st,'agent','I’ve had a word. It was not a successful word.');log(st,s,say(st,'grumble',L,'word'));}}});
    return out;}},
  {id:'time_cut',kind:'room',weight:2,when:x=>x.st.minutes>=8,
   open(st){log(st,'agent',promoLine(st,{dock:'Gaz says the raffle overran. You’ve lost three minutes.',pulse:'Nina’s stream slot has moved. Three minutes off your match.',
     crown:'Harold says there are more adverts than wrestling tonight. Three minutes gone.',union:'A memo. “Segment trimmed by three minutes.” No signature. They never sign the bad ones.'}));},
   title:'Your time has been cut',ask:'What goes?',
   options(st){
    const a={minutes:-3,trust:2,moodW:-2,moodF:-2},c={skipPromo:true,trust:1,crowd:-2};
    return [
     {id:'cut',label:'“Fine. We’ll cut it.”',hint:'Three minutes come out of the match. '+first(st)+' will owe you one.',fx:a,tags:[...tagsOf(st,a),'Comes back next time'],run(st){log(st,'agent','I’ll tell them. They’ve already started arguing about which three.');carry(st,{sit:'favour_owed',pid:st.promoter.id});}},
     {id:'refuse',label:'“Tell {PF} we’re doing our time.”',hint:'It works about two times in five.',tags:['Gamble',first(st)+' ▼','Shorter match if it fails'],
      run(st){if(rng(st.seed,'timecut')<.4){apply(st,{trust:-1});log(st,'agent','You’ve kept your time. '+st.promoter.voice+' did a sort of sigh down the phone.');chain(st,'raffle_payback');}
       else{apply(st,{minutes:-3,trust:-3});log(st,'agent','No. And now '+st.promoter.voice+' is cross as well. Three minutes gone.');}}},
     {id:'talk',label:'“Cut the talking, keep the wrestling.”',hint:'The promo is dropped. The match keeps its length.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','No microphone. Somewhere a sound engineer is weeping with relief.');}}];}},
  {id:'time_extra',kind:'room',weight:2,when:x=>['feature','main'].includes(x.st.slot),
   open(st){log(st,'agent','The match before yours has fallen through. One of them’s locked in the toilet. '+st.promoter.voice+' wants four more minutes out of you.');},
   title:'They want you to go long',ask:'Can you fill the time?',
   options(st){
    const a={minutes:4,trust:3,moodW:-2},c={trust:-2};
    return [
     {id:'yes',label:'“We’ll fill it.”',hint:'Four more minutes on tired legs.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'grumble',st.w,'long'));}},
     {id:'paid',label:'“For a consideration.”',hint:'Ask for £40. You are doing the time either way.',tags:['Gamble','+£40 or '+first(st)+' ▼','Longer match'],
      run(st){if(rng(st.seed,'extra')<.5){apply(st,{minutes:4,cash:40});log(st,'agent','Forty quid. '+st.promoter.voice+' counted it out in coins. I think it’s the bar float.');}
       else{apply(st,{minutes:4,trust:-2});log(st,'agent','No money, you’re doing it anyway, and I’ve been called a word.');}}},
     {id:'no',label:'“Not our problem.”',hint:'The show runs short.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','I’ll let them know. From a distance.');}}];}},
  {id:'hurt',kind:'match',weight:3,when:x=>x.st.w.fatigue>=30||rng(x.st.seed,'hurt?')<.4,
   open(st){log(st,'w',tone(st,'w',{grand:'My shoulder has been making a noise. A sort of click. I’ve named it.',gruff:'Knee’s gone. It’ll hold.',eager:'I did something to my ankle in the car park. I was showing someone a cartwheel.',
     stoic:'Back’s bad. It’s always bad. Tonight it’s worse.',precise:'I have a grade-one strain. I looked it up. Twice.',earnest:'I don’t want to make a fuss, but I can’t really turn my head.',
     sermon:'The flesh is weak. Specifically the left hamstring.',slippery:'I’ve got a bad back. I can get a note. A real one this time.'}),'objection');},
   title:'{W} is carrying a knock',ask:'What do you do about it?',
   options(st){
    const a={spice:-1,crowd:-2},b={flags:{pushThrough:true},crowd:3,heat:2},c={flags:{pushThrough:true},moodW:-5};
    return [
     {id:'around',label:'“We’ll work around it.”',hint:'Nothing risky tonight.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'accept',st.w,'hurt'));}},
     {id:'sell',label:'“Sell the injury in the match.”',hint:st.f.short+' goes after it and the crowd can see it is real.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','Selling a real injury. Bold. Stupid, but bold.');}},
     {id:'fine',label:'“You’re fine. Walk it off.”',hint:'Costs nothing. Fixes nothing. It may still hurt next time.',fx:c,tags:[...tagsOf(st,c),'Comes back next time'],run(st){log(st,'w',say(st,'grumble',st.w,'hurt'));carry(st,{sit:'still_hurting',sid:st.w.id});}}];}},
  {id:'daft',kind:'flavour',weight:3,when:()=>true,
   open(st){const score=x=>x.ego-(x.psych||50)*.4+rng(st.seed,'aob'+x.id)*30;st.daftSide=score(st.w)>=score(st.f)?'w':'f';
    log(st,'agent','Any other business? No? Good. Oh. '+nameOf(st,st.daftSide)+' has a hand up.');st.daft=daftFor(st,who(st,st.daftSide));log(st,st.daftSide,st.daft.pitch);},
   title:'Somebody has had an idea',ask:'Well?',
   options(st){
    const s=st.daftSide,X=who(st,s),m=s==='w'?'moodW':'moodF',d=st.daft||daftFor(st,X),no={[m]:X.ego>=70?-3:-1},later={[m]:1};
    return [
     {id:'no',label:'“Absolutely not.”',hint:'Firm. Sensible. Possibly a shame.',fx:no,tags:tagsOf(st,no),run(st){log(st,'agent','Thank God.');}},
     {id:'yes',label:'“Go on, then.”',hint:'It could bring the house down. It could also not.',tags:['Gamble',X.short+' ▲','Crowd ▲ or ▼'],
      run(st){st.mood[s]+=5;const ok=rng(st.seed,'stunt')<.3+((X.mic||50)+(X.heat||40))/260;apply(st,{crowd:ok?4:-3,entrance:(ok?d.yes:d.no).replace(/\{W\}/g,X.short)});
       st.stunt={side:s,ok};log(st,'agent','I’d like it minuted that I was against this.');}},
     {id:'later',label:'“Ask me again when you’re main-eventing.”',hint:'A no that sounds like a maybe.',fx:later,tags:tagsOf(st,later),run(st){log(st,s,pick(['I’m holding you to that.','So that’s not a no.','Main event. Right. Noted.'],st.seed,'later'));}}];}},
  {id:'gear',kind:'flavour',weight:1.5,when:()=>true,
   open(st){log(st,'w','Small problem. My gear is in Rotherham.');log(st,'agent','I don’t know why it’s in Rotherham either. I’ve stopped asking.');},
   title:'{W}’s gear is in Rotherham',ask:'What does {W} wrestle in?',
   options(st){
    const b={crowd:-2,rep:-1,entrance:'{W} comes out in a tracksuit, like a PE teacher who has finally had enough.'},c={cash:-30,crowd:1,entrance:'{W} comes out in aquamarine swimming trunks from the leisure centre vending machine. Nobody mentions it. Everybody is thinking it.'};
    return [
     {id:'borrow',label:'“Borrow {F}’s spare.”',hint:'It will have '+st.f.short+'’s name across the back.',tags:['Gamble','Crowd ▲ or ▼'],
      run(st){if(rng(st.seed,'gear')<.5)apply(st,{crowd:3,entrance:'{W} comes out in {F}’s spare gear. It says {F} across the back. The crowd think this is the funniest thing they have ever seen.'});
       else apply(st,{crowd:-2,moodF:-2,entrance:'{W} comes out in {F}’s spare gear, which is two sizes too small. It is a long walk to the ring.'});log(st,'f',say(st,'grumble',st.f,'gear'));}},
     {id:'tracksuit',label:'“Tracksuit.”',hint:'Free. Looks it.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'accept',st.w,'gear'));}},
     {id:'shop',label:'“'+AGENT+', find a shop.”',hint:'£30, and no guarantees about colour.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','I’ve been to the leisure centre. I’m not going to describe them. You’ll see.');}}];}},
  {id:'late',kind:'flavour',weight:1.5,when:()=>true,
   open(st){log(st,'agent',st.f.short+' is stuck on the M62 behind a caravan. Twenty minutes, they reckon. They always reckon twenty minutes.');},
   title:'{F} is late',ask:'How do you cover it?',
   options(st){
    const b={trust:-2},c={moodF:-3,crowd:-2};
    return [
     {id:'stall',label:'“Send {W} out to talk.”',hint:'Depends entirely on whether '+st.w.short+' can talk.',tags:['Gamble','Crowd ▲ or ▼'],
      run(st){if(rng(st.seed,'stall')<.2+st.w.mic/130){apply(st,{crowd:4});log(st,'agent',st.w.short+' did ten minutes on the one-way system. They loved it.');}
       else{apply(st,{crowd:-3});log(st,'agent',st.w.short+' did ten minutes. I counted four separate silences.');}}},
     {id:'swap',label:'“Swap the running order.”',hint:'The promoter has to redo the card.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent',st.promoter.voice+' has taken it well. No. The other thing.');}},
     {id:'cold',label:'“Start the moment they arrive.”',hint:st.f.short+' wrestles straight out of the car.',fx:c,tags:tagsOf(st,c),run(st){log(st,'f',say(st,'grumble',st.f,'late'));}}];}},
  {id:'grudge',kind:'match',weight:4,when:x=>x.heat>=35,
   open(st){log(st,'agent','They’re not speaking. I’ve been passing notes between them like it’s a school disco.');},
   title:'They can’t stand each other',ask:'Do you use it?',
   options(st){
    const a={spice:1,crowd:3,heat:3},b={spice:-1,moodW:-1,moodF:-1};
    return [
     {id:'use',label:'“Good. Use it.”',hint:'A real fight sells. A real fight is also a real fight.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','I’ll get the first-aid box down off the shelf.');}},
     {id:'through',label:'“Plan it through you.”',hint:'Safe, careful, slightly joyless.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','I’m a go-between now. I should charge by the message.');}},
     {id:'shake',label:'“Get them in here and make them shake hands.”',hint:'Works on professionals.',tags:['Gamble','Both ▲ or both ▼','Rivalry ▲ if it fails'],
      run(st){if(rng(st.seed,'shake')<(st.w.pro+st.f.pro)/200-.1){st.mood.w+=4;st.mood.f+=4;log(st,'agent','They’ve shaken hands. Nobody is more surprised than them.');}
       else{st.mood.w-=3;st.mood.f-=3;apply(st,{heat:4});log(st,'agent','The handshake lasted four seconds and involved a lot of squeezing.');}}}];}},
  {id:'nerves',kind:'match',weight:4,when:x=>x.st.w.psych<60&&x.st.w.pro<86,
   open(st){log(st,'w',tone(st,'w',{eager:'I’ve forgotten how a headlock works. Which arm is it?',earnest:'I feel a bit sick. Is that the adrenaline or the pasty?',precise:'I have rehearsed this ninety times and I cannot remember any of them.',
     stoic:'I’m fine. I’ve just gone a bit quiet.',gruff:'Hands are shaking. Don’t tell anyone.',grand:'I am not nervous. I am pre-magnificent.',sermon:'My faith is firm. My knees have doubts.',slippery:'I’m not nervous, I’m just standing near the door.'}),'objection');},
   title:'{W} has the nerves',ask:'What do you say?',
   options(st){
    const b={leash:'script',spice:-1},pro=st.f.pro>=75,c=pro?{moodW:3,moodF:-2}:{moodW:2,crowd:-1};
    return [
     {id:'pep',label:'“You’ve done this a hundred times.”',hint:'A pep talk. They work about half the time.',tags:['Gamble',st.w.short+' ▲ or ▼'],
      run(st){if(rng(st.seed,'pep')<.55){st.mood.w+=5;apply(st,{crowd:1});log(st,'w','Right. Yes. A hundred times. I’ve got this.');}else{st.mood.w-=2;log(st,'w','I’ve done it eleven times. Two of them went well.');}}},
     {id:'sheet',label:'“Stick to the match layout. I’ll call it from ringside.”',hint:'Nothing fancy and nothing left to chance.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'accept',st.w,'nerves'));}},
     pro?{id:'carry',label:'“{F} will look after you out there.”',hint:st.f.short+' is a professional. A slightly put-upon one.',fx:c,tags:tagsOf(st,c),run(st){log(st,'f',say(st,'grumble',st.f,'carry'));}}
      :{id:'brew',label:'“Have a brew and breathe.”',hint:'It helps. The crowd wait.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','Milk, two sugars, and a digestive for the shock.');}}];}},
  {id:'leash',kind:'match',weight:2,when:x=>x.st.w.psych>=70||x.st.w.ego>=75,
   open(st){log(st,'w',tone(st,'w',{grand:'Am I to follow a script, or may I be brilliant?',gruff:'Layout, or do I call it?',eager:'Can I just feel it out there? I feel things really well!',stoic:'Do you want it by the layout, or shall I read the room?',
     precise:'I need to know the decision rights. Yours or mine?',earnest:'Should I stick to the plan, or go with the crowd?',sermon:'Shall I follow the text, or the spirit?',slippery:'How tightly are we sticking to this, out of interest?'}));},
   title:'Who calls the match?',ask:'Layout, or feel?',
   options(st){
    const a={leash:'script',moodW:st.w.ego>=75?-4:0},b={leash:'free',moodW:2,spice:st.w.psych>=75?0:1},c={leash:'free',moodW:1,moodF:2};
    return [
     {id:'script',label:'“By the layout.”',hint:'You call it. Proud workers resent it.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,a.moodW?'grumble':'accept',st.w,'leash'));}},
     {id:'free',label:'“Read the room.”',hint:st.w.psych>=75?st.w.short+' is good at this.':st.w.short+' thinks they are good at this.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'pleased',st.w,'leash'));}},
     {id:'both',label:'“Call it between you.”',hint:'The shine and the heat come out of the layout. The comeback and the big spot stay.',fx:c,tags:[...tagsOf(st,c),'Fewer beats'],
      run(st){for(const k of ['opening','pressure'])delete st.board[k];log(st,'agent','Half a plan. Lovely. I’ll just stand here for the first ten minutes, then.');}}];}},
  {id:'crowd',kind:'match',weight:3,when:()=>true,
   open(st){const r=rng(st.seed,'crowd');st.crowdMood=st.w.heat<35?'who':r<.5?'cold':'hot';
    log(st,'agent',{who:'I’ve been out front. They don’t know who '+st.w.short+' is. One of them asked me if '+st.w.short+' was the caretaker.',
     cold:'I’ve looked through the curtain. Forty people and a dog. The dog looks keen.',hot:'It’s heaving out there. Somebody’s brought an air horn.'}[st.crowdMood]);},
   title:'Dennis has looked at the crowd',ask:'How do you start?',
   options(st){
    const c1=pitchFor(st,'opening','w'),a={crowd:2,...(c1?{plan:{slot:'opening',owner:'w',by:'w',action:c1.action,label:c1.label}}:{})},b={crowd:-2,bonus:3},c={cash:-20,crowd:4};
    return [
     {id:'fast',label:'“Start fast.”',hint:c1?st.w.short+' opens with the '+c1.label+'.':'Come out swinging.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'pleased',st.w,'crowd'));}},
     {id:'slow',label:'“Make them wait for it.”',hint:'A cold start and a bigger finish.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','Old school. Half of them will be at the bar, but the half that stay will remember it.');}},
     {id:'raffle',label:'“Free raffle tickets on the door.”',hint:'£20 buys a surprising amount of goodwill.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','I’ve given out the tickets. A man asked what the prize was. I said “dignity”. He kept the ticket.');}}];}},
  {id:'tv',kind:'room',weight:3,when:x=>x.p.tv&&['win_clean','lose_clean'].includes(x.st.finish),
   open(st){log(st,'agent',st.promoter.voice+' wants the finish in front of the hard camera. Straight finisher, nothing clever, and could everyone please face the right way.');},
   title:'Television wants the finish its way',ask:'Do they get it?',
   options(st){
    const route=(MX.FINISH_ROUTES[st.finish]||[])[0]?.id,a={trust:2,route},b={trust:-2};
    return [
     {id:'tv_yes',label:'“Whatever the cameras want.”',hint:'The simplest finish, where the camera can see it.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','Lovely. One thing fewer to argue about.');}},
     {id:'tv_no',label:'“We’ll finish it our way.”',hint:'You keep the choice. Television sulks.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','I’ll tell the director. He’s nineteen. He’ll cope.');}},
     {id:'tv_move',label:'“Tell them to move the camera.”',hint:'It works about one time in three.',tags:['Gamble',first(st)+' ▲ or ▼▼'],
      run(st){if(rng(st.seed,'tv')<.35){apply(st,{trust:1});log(st,'agent','They’ve moved the camera. I didn’t know you could do that. Neither did they.');}else{apply(st,{trust:-3});log(st,'agent','The camera is bolted down. So, now, is '+st.promoter.voice+'’s opinion of us.');}}}];}},
  {id:'scout',kind:'room',weight:2,when:x=>x.p.id!=='union',
   open(st){log(st,'agent','There’s somebody from Grand Union in row F. Notebook, lanyard, face like a tax return.');},
   title:'A scout is in the building',ask:'Do you tell the wrestlers?',
   options(st){
    const a={spice:1,repStake:2},b={repStake:1},c={moodW:-2,moodF:-2,repStake:2,crowd:1};
    return [
     {id:'showoff',label:'“Tell {W} to show off.”',hint:'A good match is worth more tonight. A bad one costs more.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'pleased',st.w,'scout'));}},
     {id:'quiet',label:'“Say nothing. Normal match.”',hint:'A small upside and no nerves.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','Mum’s the word. I’ll stop staring at row F.');}},
     {id:'both',label:'“Tell them both.”',hint:'They will try harder. They will also think about it.',fx:c,tags:tagsOf(st,c),run(st){log(st,'f',say(st,'accept',st.f,'scout'));}}];}},
  {id:'request',kind:'match',weight:3,when:x=>!!pitchFor(x.st,'pressure','f'),
   open(st){log(st,'f',tone(st,'f',{grand:'I require ninety seconds of looking magnificent. That is all I ask.',gruff:'I want my stuff in.',eager:'Can I do my thing? The thing with the ropes? Please?',
     stoic:'I’d like a couple of minutes on top. Keeps the knees warm.',precise:'I am requesting twenty-two per cent of the offence. I have a pie chart.',earnest:'Could I get a bit of offence in? Only if there’s room.',
     sermon:'Grant me a passage of dominance, that the fall may mean something.',slippery:'Give me my spot and I’ll make yours look like a million quid.'}));},
   title:'{F} wants some offence',ask:'How much do they get?',
   options(st){
    const c=pitchFor(st,'pressure','f'),plan={slot:'pressure',owner:'f',by:'f',action:c.action,label:c.label};
    const a={moodF:4,moodW:st.w.ego>=70?-3:undefined,plan},b={moodF:-4,moodW:2},t={moodF:1,bonus:2,plan};
    return [
     {id:'grant',label:'“Go on.”',hint:st.f.short+' gets the '+c.label+'.',fx:a,tags:tagsOf(st,a),run(st){log(st,'f',say(st,'pleased',st.f,'request'));}},
     {id:'deny',label:'“It’s {W}’s night.”',hint:st.f.short+' is there to make '+st.w.short+' look good.',fx:b,tags:tagsOf(st,b),run(st){log(st,'f',say(st,'grumble',st.f,'request'));}},
     {id:'trade',label:'“Do it, and make {W} look a million dollars at the end.”',hint:'A fair trade, held to by '+AGENT+'.',fx:t,tags:tagsOf(st,t),run(st){log(st,'f',say(st,'accept',st.f,'request'));}}];}},
  {id:'petrol',kind:'room',weight:2,when:()=>true,
   open(st){log(st,'w',tone(st,'w',{grand:'One does not like to discuss money. One is, however, going to.',gruff:'Petrol was forty quid.',eager:'Do we get petrol money? Somebody said we get petrol money.',stoic:'I’m not asking for much. I’m asking for the petrol.',
     precise:'My expenses tonight total £41.60. I have receipts.',earnest:'I hate to ask, but the train was quite a lot.',sermon:'Even a prophet must pay for parking.',slippery:'About my expenses. They’ve gone up. Inflation.'}));},
   title:'{W} wants expenses',ask:'Do you pay?',
   options(st){
    const a={cash:-40,moodW:5,morale:2},b={moodW:-2,morale:-1},c={moodW:-1};
    return [
     {id:'pay',label:'“Here’s forty.”',hint:'Out of tonight’s purse.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'sweet',st.w,'petrol'));}},
     {id:'next',label:'“Next time.”',hint:'They have heard this before.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'grumble',st.w,'petrol'));}},
     {id:'win',label:'“Tear the house down and we’ll talk.”',hint:'A promise. You both know how those go.',fx:c,tags:tagsOf(st,c),
      run(st){log(st,'w','Then you’d better be watching.');}}];}},
  {id:'scruples',kind:'match',weight:4,when:x=>x.st.finish==='win_dirty'&&x.st.w.pro>=78,
   open(st){log(st,'w',tone(st,'w',{gruff:'I don’t cheat.',earnest:'Cheating? In front of the kids?',precise:'I would prefer a legitimate victory. Statistically, I’ve earned one.',stoic:'Thirty years and I’ve never grabbed the tights. I’ve thought about it.',
     grand:'A dirty win? I? Have you seen my reviews?',eager:'I don’t know how to cheat! Nobody’s shown me!',sermon:'Thou shalt not hold the tights. It is in there somewhere.',slippery:'I’ve no objection to cheating. I object to being seen doing it.'}),'objection');
    log(st,'agent','The contract says dirty. I don’t write them. I just read them out and wince.');},
   title:'{W} doesn’t want to cheat',ask:'How do you square it?',
   options(st){
    const bumpLegal=st.heat>=40;
    const a={moodW:2,route:bumpLegal?'referee_bump':'feet_on_ropes'},b={moodW:-6},c={moodW:3,moodF:-2};
    return [
     {id:'accident',label:'“Make it look like an accident.”',hint:bumpLegal?'The referee goes down, and what happens next is nobody’s fault.':'A distraction lets the wrestler use the ropes for leverage, with no referee bump.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'accept',st.w,'dirty'));}},
     {id:'job',label:'“It’s the job.”',hint:'It is.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'grumble',st.w,'dirty'));}},
     {id:'they_first',label:'“{F} cheats first. Then it’s only fair.”',hint:st.f.short+' has to look like the villain.',fx:c,tags:tagsOf(st,c),run(st){log(st,'f',say(st,'grumble',st.f,'dirty'));}}];}},
  {id:'protect',kind:'match',weight:3,when:x=>x.st.finish.startsWith('lose')&&x.st.w.heat>=40,
   open(st){log(st,'agent',st.w.short+' is losing tonight. The question is how much of '+st.w.short+' is left afterwards.');},
   title:'How does {W} lose?',ask:'What do you protect?',
   options(st){
    const c1=pitchFor(st,'reversal','w'),a={moodW:3,...(c1?{plan:{slot:'reversal',owner:'w',by:'w',action:c1.action,label:c1.label}}:{})},b={minutes:-2,moodW:-1},c={moodF:4,moodW:-4,heat:2};
    return [
     {id:'comeback',label:'“A proper comeback first.”',hint:c1?st.w.short+' gets the '+c1.label+' before the fall.':st.w.short+' gets a rally before the fall.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'accept',st.w,'protect'));}},
     {id:'short',label:'“Keep it short and get out.”',hint:'Less time to look bad in.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','In, down, out, chips. A classic.');}},
     {id:'killer',label:'“Let {F} look like a killer.”',hint:'It builds the rematch. It does nothing for '+st.w.short+' tonight.',fx:c,tags:tagsOf(st,c),run(st){log(st,'w',say(st,'grumble',st.w,'protect'));}}];}},
  {id:'soft_corner',kind:'flavour',weight:1.5,when:()=>true,
   open(st){log(st,'agent','One thing about the ring. The north-east corner is soft. I put my foot through it at four o’clock.');},
   title:'The ring has a soft corner',ask:'What do you tell them?',
   options(st){
    const a={ban:['corner'],banIds:['corner_whip','corner_strikes','corner_push','corner_charge','top_follow']},c={trust:-1};
    return [
     {id:'avoid',label:'“Stay out of that corner.”',hint:'No corner work tonight.',fx:a,tags:[...tagsOf(st,a),'Safer'],run(st){log(st,'agent','I’ve put a cone on it. The cone is also sinking.');}},
     {id:'hold',label:'“It’ll hold.”',hint:'It holds about three times in five.',tags:['Gamble','Crowd ▼ if it goes'],
      run(st){if(rng(st.seed,'corner')>=.6)apply(st,{crowd:-3,entrance:'During the ring introductions the north-east corner gives way with a noise like a wardrobe falling downstairs.'});log(st,'agent','On your head be it. Or, more likely, theirs.');}},
     {id:'fix',label:'“Tell {PF} to fix the ring.”',hint:'It gets fixed. It gets remembered.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent',st.promoter.voice+' has sent a man with a hammer. He seems to be enjoying himself.');}}];}},
  {id:'ropes',kind:'flavour',weight:1.5,when:()=>true,
   open(st){log(st,'agent','The top rope’s gone slack. Somebody’s been drying a towel on it.');},
   title:'The top rope is slack',ask:'What do you do?',
   options(st){
    const flyer=['w','f'].find(s=>who(st,s).style==='Spectacle'),ban={ban:['springboard','rope','aerial','superplex'],banIds:['top_climb','springboard_rise','aerial_attack','top_follow']};
    const a={...ban,...(flyer?{[flyer==='w'?'moodW':'moodF']:-4}:{})},c={spice:1};
    return [
     {id:'ground',label:'“Nobody goes near the ropes.”',hint:flyer?who(st,flyer).short+' will take this personally.':'A ground match tonight.',fx:a,tags:[...tagsOf(st,a),'Safer'],run(st){if(flyer)log(st,flyer,say(st,'grumble',who(st,flyer),'ropes'));else log(st,'agent','Sensible.');}},
     {id:'tighten',label:'“Tighten it, '+AGENT+'.”',hint:AGENT+' has a spanner and about a fifty per cent record.',tags:['Gamble','Limits the match if it fails'],
      run(st){if(rng(st.seed,'ropes')<.5)log(st,'agent','Tight as a drum. I’ve surprised myself.');else{apply(st,{...ban,crowd:-1});log(st,'agent','I’ve made it worse. Nobody is to touch it. Or look at it.');}}},
     {id:'carry_on',label:'“Carry on. They’re professionals.”',hint:'Some of them are.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','I’ll have the kettle on for the paperwork.');}}];}},
  {id:'bell',kind:'flavour',weight:1,when:()=>true,
   open(st){log(st,'agent','The bell’s missing. The timekeeper is offering to hit a saucepan.');},
   title:'The bell is missing',ask:'What starts the match?',
   options(st){
    const b={crowd:1},c={cash:-10,trust:1};
    return [
     {id:'saucepan',label:'“Saucepan.”',hint:'It depends how the first one lands.',tags:['Gamble','Crowd ▲ or ▼'],
      run(st){if(rng(st.seed,'bell')<.6)apply(st,{crowd:3,entrance:'The timekeeper strikes a saucepan with a wooden spoon. The crowd give it a standing ovation.'});
       else apply(st,{crowd:-1,entrance:'The timekeeper strikes a saucepan. The handle comes off. The match begins anyway.'});log(st,'agent','It’s a good saucepan, to be fair.');}},
     {id:'shout',label:'“Somebody just shout ‘ding’.”',hint:'Cheap and cheerful.',fx:{...b,entrance:'In the absence of a bell, the whole front row shouts “DING”.'},tags:tagsOf(st,b),run(st){log(st,'agent','I’ll do it. I’ve got the voice for it.');}},
     {id:'find',label:'“Find the bell.”',hint:'A tenner to the caretaker.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','It was in the kitchen. It’s been holding a door open since March.');}}];}},
  {id:'meat_tray',kind:'flavour',weight:1,when:()=>true,
   open(st){st.suspect=st.w.ego>=st.f.ego?'w':'f';log(st,'agent','The raffle prize was a meat tray. It’s gone. '+nameOf(st,st.suspect)+' is being very quiet.');},
   title:'The meat tray has gone missing',ask:'Whose problem is it?',
   options(st){
    const s=st.suspect,X=who(st,s),a={cash:-15,trust:2},b={trust:-1};
    return [
     {id:'buy',label:'“Buy another one.”',hint:'£15 to the butcher on the corner.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','Sorted. I got the one with the black pudding. We’re heroes.');}},
     {id:'shrug',label:'“Not our problem.”',hint:'It becomes '+st.promoter.voice+'’s problem.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','I’ll say we were never here.');}},
     {id:'accuse',label:'“'+X.short+'. Give it back.”',hint:'If you are right, the promoter is grateful. If you are wrong…',tags:['Gamble',first(st)+' ▲ or '+X.short+' ▼'],
      run(st){if(rng(st.seed,'meat')<.5){apply(st,{trust:2});st.mood[s]-=3;log(st,s,'It was going to waste.');}else{st.mood[s]-=5;log(st,s,'I have never seen a meat tray in my life.');log(st,'agent','That was said with a mouth full of sausage, but I can’t prove anything.');}}}];}},
  // ---------------------------------------------------------------------------------------------
  // v3.9 CHAINS. Some answers start something. A follow-up marked `followup` is never drawn on its
  // own: chain() puts it later in the same meeting, carry() saves a thread that comes back at a
  // later show with the same wrestler, opponent or promoter.
  // ---------------------------------------------------------------------------------------------
  {id:'ref_cover',kind:'match',weight:2.5,when:()=>true,
   open(st){log(st,'agent','The usual referee has gone down with something. The stand-in is '+st.promoter.voice+'’s nephew. He has brought a whistle. Nobody has told him referees don’t use whistles.');},
   title:'There’s a stand-in referee',ask:'How much do you tell him?',
   options(st){
    const a={minutes:-2,bonus:1},c={moodF:3,trust:-2};
    return [
     {id:'brief',label:'“Sit him down and go through it.”',hint:'Two minutes off the match to teach him the finish.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','He’s written it on his hand. Both hands. And a bit of his arm.');}},
     {id:'trust',label:'“He’ll be fine.”',hint:'Costs nothing now.',tags:['Saves time','He may come back with questions'],run(st){log(st,'agent','He gave me a thumbs-up. He’s still holding the whistle.');chain(st,'ref_question');}},
     {id:'mate',label:'“{F} knows a ref. Ring them.”',hint:st.f.short+' is pleased. The promoter pays for the new ref.',fx:c,tags:tagsOf(st,c),run(st){log(st,'f',say(st,'pleased',st.f,'ref'));}}];}},
  {id:'ref_question',kind:'match',weight:0,followup:true,when:()=>true,
   open(st){log(st,'agent','The stand-in’s back. He wants to know how many he counts to. And whether he’s allowed to join in.');},
   title:'The referee has a question',ask:'What do you tell him?',
   options(st){
    const b={moodW:2},c={trust:-1,bonus:1};
    return [
     {id:'three',label:'“Three. Just three.”',hint:'Simple. Probably enough.',tags:['Gamble','Crowd ▼ if he fluffs it'],
      run(st){if(rng(st.seed,'refcount')<.6)log(st,'agent','Three. He’s practising on the tea urn.');else{apply(st,{crowd:-3});log(st,'agent','He counted to three, then four, then asked the front row if that was right.');}}},
     {id:'steer',label:'“{W} steers him through it.”',hint:st.w.short+' calls it to him in the ring.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'pleased',st.w,'ref'));}},
     {id:'timekeeper',label:'“Swap him with the timekeeper.”',hint:'The timekeeper has done it before. In 1983.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','The timekeeper is seventy-one and has his own shirt. The nephew is doing the bell. He’s thrilled. He’s got the whistle as well.');}}];}},
  {id:'family',kind:'flavour',weight:1.5,when:()=>true,
   open(st){log(st,'agent',st.w.short+'’s family are in the front row. Their nan has brought a sign. It is spelled correctly, which is a first for this building.');},
   title:'{W}’s family are in',ask:'Does it change anything?',
   options(st){
    const a={crowd:2,moodW:3},b={moodW:-2,bonus:1};
    return [
     {id:'wave',label:'“Give them a wave on the way in.”',hint:'The front row warms up. So does '+st.w.short+'.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'pleased',st.w,'family'));}},
     {id:'focus',label:'“Business as usual.”',hint:st.w.short+' keeps their head. Slightly sulky about it.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'grumble',st.w,'family'));}},
     {id:'nan',label:'“Get Nan a seat by the timekeeper.”',hint:'Nan has opinions.',tags:['Gamble','Crowd ▲ or '+first(st)+' ▼'],
      run(st){if(rng(st.seed,'nan')<.5){apply(st,{crowd:4});log(st,'agent','Nan hit '+st.f.short+' with the sign. Lightly. They’ll talk about it for weeks.');}
       else{apply(st,{trust:-2,moodF:-2});log(st,'agent','Nan heckled the promoter. Specifically. By name.');}}}];}},
  {id:'filming',kind:'room',weight:2,when:()=>true,
   open(st){log(st,'agent','Someone in row two is filming the whole show on their phone. Landscape. With the flash on.');},
   title:'Someone’s filming',ask:'What do you do about it?',
   options(st){
    const a={crowd:2,rep:1,moodF:-2},b={trust:1,crowd:-1};
    return [
     {id:'play',label:'“Play to the camera.”',hint:'Free publicity. '+st.f.short+' hates being filmed from that side.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','If it goes round the internet, I want it noted I was against it.');}},
     {id:'stop',label:'“Ask them to put it away.”',hint:'The promoter likes a tidy hall.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','They’ve put it away. They’ve got a second phone.');}},
     {id:'leave',label:'“Leave it.”',hint:'Nothing changes. Probably.',tags:['Nothing changes'],run(st){log(st,'agent','Fine. Nobody watches those anyway. Except everyone.');}}];}},
  {id:'scout_rival',kind:'room',weight:2,when:()=>true,
   open(st){const m=D.STABLES[hash(st.seed+'|mgr')%D.STABLES.length];st.mgr={name:m.manager,team:m.name};
    log(st,'agent',m.manager+' from '+m.name+' is stood at the back with a notebook. They only come to these when they’re shopping.');},
   title:'A rival manager is watching',ask:'How do you play it?',
   options(st){
    const a={moodW:3,crowd:1},b={moodW:-2},c={trust:-1};
    return [
     {id:'show',label:'“Let {W} show them what they’re missing.”',hint:st.w.short+' works harder. They may also get ideas.',fx:a,tags:[...tagsOf(st,a),'They may come back for a word'],run(st){log(st,'w',say(st,'pleased',st.w,'scout2'));chain(st,'scout_approach');}},
     {id:'hide',label:'“Keep it simple. Show them nothing.”',hint:'A careful match nobody would want to steal.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','Lovely and boring. Like a building society.');}},
     {id:'chat',label:'“I’ll have a word with them myself.”',hint:AGENT+' has opinions about poaching.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent',(st.mgr?.name||'They')+' says they’re just here for the pies. Nobody comes here for the pies.');}}];}},
  {id:'scout_approach',kind:'room',weight:0,followup:true,when:()=>true,
   open(st){log(st,'agent',(st.mgr?.name||'That manager')+' has cornered '+st.w.short+' by the fire exit. They’re talking money.');},
   title:'{W} is being tapped up',ask:'Do you step in?',
   options(st){
    const a={moodW:-3},c={morale:3,moodW:3,cash:-30};
    return [
     {id:'step',label:'“Get {W} back in here.”',hint:'Interrupts a conversation '+st.w.short+' was enjoying.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'grumble',st.w,'tapped'));}},
     {id:'let',label:'“Let them talk.”',hint:'Flattery is good for morale. Unless it isn’t.',tags:['Gamble',st.w.short+' morale ▲ or ▼'],
      run(st){if(rng(st.seed,'tapped')<.5){apply(st,{morale:4});log(st,'agent','Nothing came of it. '+st.w.short+' is walking two inches taller.');}
       else{apply(st,{morale:-4,moodW:-3});log(st,'agent',st.w.short+' now knows what '+(st.mgr?.team||'they')+' pay. It’s more than you.');}}},
     {id:'counter',label:'“Tell them {W} is worth twice that.”',hint:st.w.short+' hears you say it. Thirty quid on account.',fx:c,tags:tagsOf(st,c),run(st){log(st,'w',say(st,'sweet',st.w,'tapped'));}}];}},
  {id:'local_lad',kind:'match',weight:2,when:()=>true,
   open(st){log(st,'agent',st.promoter.voice+' wants a local lad at ringside. He trains at the leisure centre on Thursdays. He is very keen.');},
   title:'The promoter’s local lad',ask:'What does he get to do?',
   options(st){
    const a={trust:2},b={trust:3,crowd:2,moodF:-3},c={trust:-3,moodW:1,moodF:1};
    return [
     {id:'ringside',label:'“He can sit at ringside.”',hint:'Harmless. Mostly.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','He’s brought his own chair. And a cool box.');}},
     {id:'finish',label:'“Put him in the finish.”',hint:'The town loves it. '+st.f.short+' has to take a shot from him.',fx:b,tags:[...tagsOf(st,b),'He will want more'],run(st){log(st,'f',say(st,'grumble',st.f,'lad'));chain(st,'lad_move');}},
     {id:'no',label:'“No outsiders.”',hint:'The ring stays professional.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','He’s taken it well. He’s crying in the car park, but well.');}}];}},
  {id:'lad_move',kind:'match',weight:0,followup:true,when:()=>true,
   open(st){log(st,'agent','The local lad has been practising. He wants to do a dropkick. He has never done a dropkick.');},
   title:'The local lad wants a dropkick',ask:'Does he get it?',
   options(st){
    const b={crowd:1},c={trust:-1};
    return [
     {id:'yes',label:'“Go on, then.”',hint:'Thirty seconds of chaos.',tags:['Gamble','Crowd ▲ or '+st.f.short+' ▼'],
      run(st){if(rng(st.seed,'lad')<.45){apply(st,{crowd:5});log(st,'agent','He did it. Mostly with his shin. The place came unglued.');}
       else{apply(st,{crowd:-2,moodF:-4});log(st,'agent','He landed on '+st.f.short+'. Not in a wrestling way.');}}},
     {id:'shove',label:'“He can give {F} a shove.”',hint:'Safe. Small. A shove.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','A shove. He’s practising it on the curtain.');}},
     {id:'point',label:'“He points. That’s all.”',hint:'The promoter wanted more than a point.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','He’ll point. He’s not happy about it. He’s pointing at me now.');}}];}},
  {id:'heckler',kind:'match',weight:2,when:()=>true,
   open(st){log(st,'agent','The man in the bobble hat is in again. Front row, by the bar. He has views on everyone, and he shares them.');},
   title:'The heckler is back',ask:'What do you do with him?',
   options(st){
    const a={crowd:3,moodW:2},b={trust:-1,crowd:-1},c={moodW:-1};
    return [
     {id:'use',label:'“Let {W} work him into the match.”',hint:'Cheap heat, real laughs. He may get ideas.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'pleased',st.w,'heckler'));chain(st,'heckler_back');}},
     {id:'move',label:'“Get him moved.”',hint:'The promoter has to find him another seat.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','He’s been moved two rows back. He’s louder now. Acoustics.');}},
     {id:'ignore',label:'“Ignore him.”',hint:st.w.short+' will hear every word.',fx:c,tags:tagsOf(st,c),run(st){log(st,'w',say(st,'grumble',st.w,'heckler'));}}];}},
  {id:'heckler_back',kind:'match',weight:0,followup:true,when:()=>true,
   open(st){log(st,'agent','Bobble Hat has taken it personally. He’s asking if he can get in the ring “for a go”.');},
   title:'The heckler wants a go',ask:'Well?',
   options(st){
    const a={crowd:-1},b={crowd:2,moodW:1},c={trust:-2};
    return [
     {id:'no',label:'“Absolutely not.”',hint:'He sulks. Loudly.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','He’s sulking. Into a pint. Somebody else’s pint.');}},
     {id:'stare',label:'“{W} stares him down after the bell.”',hint:'A look, not a fight.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','The stare worked. He’s sat down. He’s also bought a '+st.w.short+' T-shirt.');}},
     {id:'security',label:'“That’s security’s problem.”',hint:'The promoter is the security.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent',st.promoter.voice+' has had to stand next to him all night. That will be mentioned.');}}];}},
  {id:'same_gear',kind:'flavour',weight:1.5,when:()=>true,
   open(st){log(st,'agent','They’ve both turned up in the same colour. Same shade. The back row won’t know who’s winning.');},
   title:'They’re wearing the same colour',ask:'Who changes?',
   options(st){
    const a={moodW:-3,moodF:1},b={moodF:-3,moodW:1},c={cash:-5,crowd:-1};
    return [
     {id:'w',label:'“{W} changes.”',hint:st.w.short+' has a spare set. It is the old set.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'grumble',st.w,'gear2'));}},
     {id:'f',label:'“{F} changes.”',hint:st.f.short+' was here first. Technically.',fx:b,tags:tagsOf(st,b),run(st){log(st,'f',say(st,'grumble',st.f,'gear2'));}},
     {id:'tape',label:'“Coloured tape on one of them.”',hint:'£5 of electrical tape. It will look like £5 of electrical tape.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','I’ve gone with red. It’s the only colour the hardware shop had. Apart from red.');}}];}},
  {id:'car_park',kind:'match',weight:2,when:x=>x.st.f.pro>=55,
   open(st){log(st,'agent',st.f.short+' wants to walk through the finish in the car park first. It is raining. It is always raining in the car park.');},
   title:'{F} wants a walk-through',ask:'Do they get one?',
   options(st){
    const a={bonus:1,moodW:-2,moodF:2},b={moodF:-3,crowd:1},c={bonus:1,trust:-1};
    return [
     {id:'yes',label:'“Go on, run it.”',hint:'A sharper finish. '+st.w.short+' gets wet.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'grumble',st.w,'rain'));}},
     {id:'no',label:'“No. Save it for the ring.”',hint:'Fresher, rougher.',fx:b,tags:tagsOf(st,b),run(st){log(st,'f',say(st,'grumble',st.f,'rain'));}},
     {id:'corridor',label:'“Do it in the corridor.”',hint:'Dry. Also the catering corridor.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','They knocked the urn over. Twice. Tea is off.');}}];}},
  {id:'money_talk',kind:'room',weight:2.5,when:x=>x.st.w.ego>=50,
   open(st){log(st,'agent',st.w.short+' has caught me by the kettle. They want to talk about money. Now. Before going out.');},
   title:'{W} wants to talk money',ask:'Now?',
   options(st){
    const a={cash:-20,moodW:4,morale:2},b={moodW:1},c={moodW:-4,morale:-2};
    return [
     {id:'pay',label:'“Twenty quid on top tonight.”',hint:'Cheap, for now.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'sweet',st.w,'money'));}},
     {id:'later',label:'“After the show. I promise.”',hint:st.w.short+' will hold you to it next time.',fx:b,tags:[...tagsOf(st,b),'Comes back next time'],
      run(st){log(st,'w',say(st,'accept',st.w,'money'));carry(st,{sit:'money_due',sid:st.w.id});}},
     {id:'no',label:'“Not tonight.”',hint:'Not tonight, not ever, as far as '+st.w.short+' is concerned.',fx:c,tags:tagsOf(st,c),run(st){log(st,'w',say(st,'grumble',st.w,'money'));}}];}},
  {id:'money_due',kind:'room',weight:0,followup:true,ownWrestler:true,when:()=>true,
   open(st){log(st,'agent',st.w.short+' hasn’t forgotten. “After the show,” you said. That was last time.');},
   title:'{W} wants that money talk',ask:'Do you keep your word?',
   options(st){
    const a={cash:-40,morale:5,moodW:4},b={morale:-4,moodW:-4};
    return [
     {id:'pay',label:'“You’re right. Forty quid, and thanks.”',hint:'A promise kept.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'sweet',st.w,'money2'));}},
     {id:'again',label:'“Next time. Really.”',hint:'Twice is a pattern.',fx:b,tags:tagsOf(st,b),run(st){log(st,'w',say(st,'grumble',st.w,'money2'));}},
     {id:'honest',label:'“There isn’t any. I’m sorry.”',hint:'Honesty works on professionals.',tags:['Gamble',st.w.short+' morale ▲ or ▼'],
      run(st){if(rng(st.seed,'honest')<.3+st.w.pro/200){apply(st,{morale:1});log(st,'agent',st.w.short+' appreciated the honesty. Not the money situation. The honesty.');}
       else{apply(st,{morale:-3,moodW:-2});log(st,'agent',st.w.short+' has gone very quiet and is looking at the job adverts on the noticeboard.');}}}];}},
  {id:'power',kind:'flavour',weight:1,when:()=>true,
   open(st){log(st,'agent','The lights keep dipping. The fuse box is in the ladies’ toilets and nobody wants to be the one who goes in.');},
   title:'The lights keep going',ask:'What do you do?',
   options(st){
    const a={crowd:-1},b={cash:-10,crowd:2},c={minutes:-2,trust:1};
    return [
     {id:'on',label:'“Carry on. It adds atmosphere.”',hint:'It adds darkness.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','Atmosphere. Right. I’ll stand by the switch with a torch in my mouth.');}},
     {id:'torches',label:'“Buy every torch in the garage.”',hint:'£10 of torches. Torch-lit wrestling.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','We’ve got eleven torches and a bike lamp. It looks like a film.');}},
     {id:'short',label:'“Keep it short before it all goes.”',hint:'Two minutes off. The promoter is grateful.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','Short and lit. The two things I want from any match.');}}];}},
  {id:'paper',kind:'room',weight:2,when:()=>true,
   open(st){log(st,'agent','The local paper has sent someone. Work experience, I think. They want a quote before the match.');},
   title:'The local paper wants a quote',ask:'Who talks?',
   options(st){
    const b={moodF:3},c={rep:1};
    return [
     {id:'w',label:'“{W} talks to them.”',hint:'Depends entirely on whether '+st.w.short+' can talk.',tags:['Gamble','Reputation ▲ or Crowd ▼'],
      run(st){if(rng(st.seed,'paper')<.2+st.w.mic/130){apply(st,{rep:2,crowd:1});log(st,'agent','They’ve got a headline. They read it back to '+st.w.short+'. '+st.w.short+' asked for a copy. Three copies.');}
       else{apply(st,{crowd:-2});log(st,'agent','They printed exactly what '+st.w.short+' said. That was the problem.');}}},
     {id:'f',label:'“Let {F} have it.”',hint:st.f.short+' gets the attention.',fx:b,tags:tagsOf(st,b),run(st){log(st,'f',say(st,'pleased',st.f,'paper'));}},
     {id:'dennis',label:'“Dennis will do it.”',hint:'Safe. Dull. Accurate.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','I told them it would be a technically sound contest. They’ve written “a bloodbath”. Fine.');}}];}},
  {id:'music',kind:'flavour',weight:1.5,when:()=>true,
   open(st){log(st,'agent','The sound man has '+st.w.short+'’s entrance music on a CD that says “Wedding Disco”. It is not '+st.w.short+'’s music.');},
   title:'The wrong entrance music',ask:'What does {W} walk out to?',
   options(st){
    const b={moodW:-2,crowd:1},c={moodW:-3,crowd:-1};
    return [
     {id:'roll',label:'“Whatever’s on the CD.”',hint:'Track one is something everybody knows.',tags:['Gamble','Crowd ▲ or '+st.w.short+' ▼'],
      run(st){if(rng(st.seed,'disco')<.5){apply(st,{crowd:3,entrance:'{W} walks out to a wedding-disco classic. The whole hall sings the chorus. {W} pretends this was the plan.'});log(st,'agent','They’re singing. I didn’t know this crowd could sing.');}
       else{apply(st,{moodW:-3,entrance:'{W} walks out to the slow dance. Somebody in row three proposes.'});log(st,'agent','It was the slow one. Somebody has proposed. She said yes, which is something.');}}},
     {id:'hum',label:'“The crowd can hum it.”',hint:'They will, badly.',fx:b,tags:tagsOf(st,b),run(st){apply(st,{entrance:'{W} walks out to the front row humming their music, about a third of it in tune.'});log(st,'w',say(st,'grumble',st.w,'music'));}},
     {id:'silence',label:'“Walk out in silence.”',hint:'Moody. Awkward.',fx:c,tags:tagsOf(st,c),run(st){apply(st,{entrance:'{W} walks out in total silence. A crisp packet rustles. It is the loudest crisp packet in history.'});log(st,'w',say(st,'grumble',st.w,'music'));}}];}},
  // Threads that come back at a later show.
  {id:'promise_due',kind:'match',weight:0,followup:true,when:()=>true,
   open(st){const s=st.thread?.side||'w',X=who(st,s);st.promised=s;st.promisedPitch=pitchFor(st,'payoff',s);
    log(st,'agent',X.short+' remembers what you said last time. The big spot. “Next time.” This is next time.');},
   title:st=>who(st,st.promised||'w').short+' was promised the big spot',ask:'Do you keep the promise?',
   options(st){
    const s=st.promised||'w',X=who(st,s),c=st.promisedPitch,m=s==='w'?'moodW':'moodF';
    const keep={[m]:5,crowd:1,...(c?{plan:{slot:'payoff',owner:s,by:s,action:c.action,label:c.label,impossible:c.impossible}}:{})};
    const brk={[m]:-7,...(s==='w'?{morale:-4}:{})},none={[m]:-3,plan:{slot:'payoff',owner:'either',by:'agent',action:'scheduled_nearfall',label:'A run of near falls'}};
    return [
     {id:'keep',label:'“A promise is a promise.”',hint:X.short+' gets the big spot'+(c?': the '+c.label+'.':'.'),fx:keep,tags:tagsOf(st,keep),run(st){log(st,s,say(st,'pleased',X,'promise'));}},
     {id:'break',label:'“Things have changed.”',hint:X.short+' will remember this one too.',fx:brk,tags:tagsOf(st,brk),run(st){log(st,s,say(st,'grumble',X,'promise'),'objection');}},
     {id:'nobody',label:'“Near-falls for both of you.”',hint:'Nobody gets it. Nobody gets it over anybody.',fx:none,tags:tagsOf(st,none),run(st){log(st,'agent','Fair to everyone. Thrilling for no one.');}}];}},
  {id:'still_hurting',kind:'match',weight:0,followup:true,ownWrestler:true,when:()=>true,
   open(st){log(st,'agent',st.w.short+' is still carrying that knock from last time. The one you said to walk off. It has not been walked off.');},
   title:'{W}’s knock is worse',ask:'Now what?',
   options(st){
    const a={spice:-1,crowd:-2,moodW:2},b={cash:-10,moodW:-1},c={flags:{pushThrough:true},morale:-5,moodW:-5};
    return [
     {id:'rest',label:'“Nothing risky. Nothing at all.”',hint:'A careful match. Probably a flat one.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'accept',st.w,'hurt2'));}},
     {id:'strap',label:'“Strap it and go.”',hint:'£10 of strapping from the chemist.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','Strapped. It looks professional. It isn’t, but it looks it.');}},
     {id:'again',label:'“Walk it off. Again.”',hint:'Twice now.',fx:c,tags:tagsOf(st,c),run(st){log(st,'w',say(st,'grumble',st.w,'hurt2'),'objection');}}];}},
  {id:'favour_owed',kind:'room',weight:0,followup:true,when:()=>true,
   open(st){log(st,'agent','Last time you gave '+st.promoter.voice+' three minutes back without a fuss. Tonight you can call that in.');},
   title:'{PF} owes you one',ask:'What do you ask for?',
   options(st){
    const a={minutes:3,trust:-1},b={cash:30,trust:-1},c={crowd:2,trust:-1};
    return [
     {id:'time',label:'“Three minutes back.”',hint:'With interest, if you can get it.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','Three minutes. '+first(st)+' says we’re square. We are not square.');}},
     {id:'money',label:'“Thirty quid.”',hint:'Out of the bar float, probably.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','Thirty quid. In fifty-pences. I’ll need a bag.');}},
     {id:'poster',label:'“Top of the poster next time.”',hint:'The town will know the name.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','Top of the poster. In a bigger font. I asked about the font specifically.');}},
     {id:'save',label:'“Keep it for a rainy day.”',hint:'The favour stays owed.',tags:['Comes back next time'],run(st){log(st,'agent','Banked. I’ve written it on the back of a beer mat. That is a legal document round here.');carry(st,{sit:'favour_owed',pid:st.promoter.id});}}];}},
  {id:'raffle_payback',kind:'room',weight:0,followup:true,when:()=>true,
   open(st){log(st,'agent',st.promoter.voice+' let you keep your time. Now they want '+st.w.short+' to draw the raffle at the interval. In gear.');},
   title:'The promoter wants something back',ask:'Does {W} draw the raffle?',
   options(st){
    const a={trust:2,moodW:-2},b={trust:1,moodF:-3},c={trust:-3};
    return [
     {id:'yes',label:'“Fine. {W} draws the raffle.”',hint:'In gear. In front of everyone. With the bucket.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'grumble',st.w,'raffle'));}},
     {id:'f',label:'“{F} can do it.”',hint:st.f.short+' was not consulted.',fx:b,tags:tagsOf(st,b),run(st){log(st,'f',say(st,'grumble',st.f,'raffle'));}},
     {id:'no',label:'“No. We kept our time fair and square.”',hint:'You did. The promoter remembers it differently.',fx:c,tags:tagsOf(st,c),run(st){log(st,'agent','I’ll tell them. I’ll tell them from the other side of the car park.');}}];}},
 ];
 // ---------------------------------------------------------------------------------------------
 // v3.7 THE RUNNING ORDER. Every meeting now has a spine: the shine, the heat, the comeback and the
 // big spot, pencilled in by Dennis and changeable by you. The situations that follow push on that
 // spine rather than being the only way anything gets planned.
 // ---------------------------------------------------------------------------------------------

 // ---------------------------------------------------------------------------------------------
 // v0.3.12 COUNTER-PROPOSALS. One wrestler asks for a specific change to the pencilled running order,
 // for a reason that is actually true: the other wrestler turned that kind of move round last time,
 // the move is unsafe for somebody tired or hurt, or a wrestler who keeps losing to this opponent
 // needs a real beating before a comeback will be believed. No reason, no negotiation: if the board
 // already avoids the problem, the scene is skipped. The other wrestler then answers the change in
 // character: agreement, a condition, or a reservation they carry into the match.
 // ---------------------------------------------------------------------------------------------
 const SLOT_NAME=id=>(SLOTS.find(x=>x.id===id)?.name||id).replace(/^The /,'the ');
 const famOf=id=>A[id]?.family||null;
 const FAMWORD=f=>root.OfficeRivalry?.FAMILY_WORD?.[f]||f||'moves';
 function scout(st){return root.OfficeRivalry?.scoutedFamilies?.(st.w.id,st.f.id)||{byF:[],byW:[],reversedFinisher:false,injuredW:false,lostRun:0,lastTalk:null,meetings:0};}
 // Could there be a reason at all tonight? Checked when the meeting is drawn, before the board exists.
 function negotiable(st){
  const x=scout(st);
  return x.byF.length>0||x.byW.length>0||x.injuredW||x.lostRun>=2||(st.w.fatigue||0)>=45||!!st.w.injury;
 }
 function cardFor(st,slot,owner,test){return cardsFor(st,slot).find(c=>c.owner===owner&&!c.impossible&&!banned(st,c.action)&&(!c.risk||slot!=='payoff'||test?.allowRisk)&&test(c))||null;}
 function negotiationFor(st){
  const x=scout(st),b=st.board,out=[];
  const mk=(issue,by,slot,proposal,reason,extra={})=>{const cur=b[slot];if(!cur||!proposal||proposal.action===cur.action)return;
   out.push({issue,by,slot,original:{action:cur.action,label:cur.label,owner:cur.owner,by:cur.by},proposal:{action:proposal.action,label:proposal.label,owner:proposal.owner,by:proposal.by},reason,...extra});};
  // Safety: a risky big spot for somebody who is tired, carrying an injury, or was hurt in this rivalry.
  const p=b.payoff;
  if(p?.action&&p.owner&&p.owner!=='either'&&A[p.action]?.risk){
   const O=who(st,p.owner),hurt=p.owner==='w'&&(x.injuredW||!!st.w.injury),tired=(O.fatigue||0)>=45;
   if(hurt||tired){
    const alt=cardFor(st,'payoff',p.owner,c=>!c.risk)||{action:'scheduled_nearfall',label:'A run of near falls',owner:'either',by:'agent'};
    mk('safety',p.owner,'payoff',{...alt,by:p.owner},hurt?(p.owner==='w'&&x.injuredW?'The last time '+st.w.short+' and '+st.f.short+' met, '+st.w.short+' went home hurt.':st.w.short+' is not fully fit.'):O.short+' is running on empty this week.',
     {credible:hurt||(O.fatigue||0)>=60});
   }
  }
  // Scouting: the move on the board belongs to a family the other wrestler turned round last time.
  for(const slot of ['payoff','reversal','opening']){
   const cur=b[slot];if(!cur?.action||cur.owner!=='w')continue;
   const fam=famOf(cur.action);if(!fam||!x.byF.includes(fam))continue;
   const alt=cardFor(st,slot,'w',c=>famOf(c.action)!==fam);
   if(alt)mk('scouted','w',slot,alt,st.f.short+' turned '+st.w.short+'’s '+FAMWORD(fam)+' round the last time they met.',{family:fam});
  }
  for(const slot of ['pressure','payoff']){
   const cur=b[slot];if(!cur?.action||cur.owner!=='f')continue;
   const fam=famOf(cur.action);if(!fam||!x.byW.includes(fam))continue;
   const alt=cardFor(st,slot,'f',c=>famOf(c.action)!==fam);
   if(alt)mk('scouted','f',slot,alt,st.w.short+' turned '+st.f.short+'’s '+FAMWORD(fam)+' round the last time they met.',{family:fam});
  }
  // Credibility: a long losing run to this opponent, booked to win tonight. The win has to look earned.
  if(x.lostRun>=2&&st.finish.startsWith('win')&&b.pressure?.owner==='f'){
   const alt=cardsFor(st,'pressure').find(c=>c.by==='f'&&c.action!==b.pressure.action&&!c.impossible&&!banned(st,c.action));
   if(alt)mk('comeback','w','pressure',alt,st.w.short+' has lost '+x.lostRun+' in a row to '+st.f.short+'. If '+st.w.short+' wins tonight, it has to look earned.');
  }
  // The most serious reason wins: safety, then a scouted move, then the comeback.
  const rank={safety:3,scouted:2,comeback:1};
  return out.sort((a,b)=>rank[b.issue]-rank[a.issue]||String(a.slot).localeCompare(String(b.slot)))[0]||null;
 }
 // How the other wrestler takes the change. Personality and condition, not dice.
 function replyFor(st,n,how){
  const changedOwner=n.original.owner,side=n.by===changedOwner?other(n.by):changedOwner,O=who(st,side);
  const stance=root.OfficeRivalry?.stance?.(st.w.id,st.f.id)||{w:'competitive',f:'competitive'};
  const hostile=['hostile','resentful'].includes(stance[side]);
  // The wrestler whose own move was taken away is the one with something to say.
  if(side===changedOwner&&how!=='agent'&&(O.ego||50)>=72&&(O.pro||60)<88&&n.issue!=='safety'){
   const pay=st.board.payoff,theirs=pitchFor(st,'payoff',side);
   const demand=pay&&pay.owner!==side&&theirs&&!theirs.risk&&!theirs.impossible&&!banned(st,theirs.action)?{kind:'payoff',action:theirs.action,label:theirs.label}:{kind:'minutes'};
   return {side,kind:'conditional',demand};
  }
  if(hostile&&(O.pro||60)<85)return {side,kind:'reservation'};
  return {side,kind:'agreed'};
 }
 const NEGO_LINES={
  scouted:{grand:'{them} turned my {fam} round last time. I refuse to be a repeat performance. Give me the {alt} instead.',gruff:'{them} has seen my {fam}. {alt}. Not the other thing.',
   eager:'{them} totally read my {fam} last time! What if I do the {alt}? They won’t see it coming! Probably!',stoic:'{them} has my {fam} sussed. I’d swap it for the {alt}.',
   precise:'{them} reversed my {fam} last time. Doing it again is a mistake with a known outcome. The {alt} is not something they have seen.',
   earnest:'I don’t want to make a fuss, but {them} read my {fam} last time. Could I do the {alt} instead?',sermon:'{them} has seen through my {fam}. Let me come with the {alt}, which they have not.',
   slippery:'Between us, {them} has my {fam} figured. Swap in the {alt}. They’ll never know. Well. They’ll know when it hits them.'},
  safety:{grand:'I would adore the {orig}. My body, regrettably, would not. The {alt}.',gruff:'Not the {orig}. Not this week. {alt}.',eager:'I want to do the {orig}! I really do! But my everything hurts. Could we do the {alt}?',
   stoic:'I’m not doing the {orig} on what I’ve got left this week. Give me the {alt}.',precise:'The {orig} carries a risk I cannot justify this week. The {alt} carries almost none.',
   earnest:'I’m sorry. I don’t think I can do the {orig} safely tonight. Is the {alt} all right?',sermon:'The flesh is weak this week. Let it be the {alt}, not the {orig}.',slippery:'Funny story about the {orig}. Long story short: the {alt}.'},
  comeback:{grand:'I have lost to {them} {n} times. If I win tonight, I want it to look like a conquest. Let {them} do the {alt} to me first.',gruff:'{n} losses to {them}. If I win, it has to hurt first. Let them do the {alt}.',
   eager:'I’ve lost to {them} {n} times! If I win tonight I want it to be HUGE. Can {them} do the {alt} to me first?',stoic:'I’ve lost to {them} {n} times. A cheap win fools nobody. Let {them} do the {alt}.',
   precise:'{n} consecutive losses to {them}. A win without a proper beating first will not be believed. The {alt} fixes that.',earnest:'I’ve lost to {them} {n} times. If I win, I want people to believe it. Could {them} do the {alt}?',
   sermon:'I have been humbled by {them} {n} times. The resurrection needs a crucifixion first. Let it be the {alt}.',slippery:'Look, {n} losses to {them}. If I win cheap, nobody buys it. Let {them} rough me up with the {alt}. For the story.'}
 };
 const REPLY_LINES={
  agreed:{grand:'Acceptable. I shall be magnificent regardless.',gruff:'Fine.',eager:'Yeah! Okay! That works!',stoic:'Fair enough.',precise:'Agreed. The change is sound.',earnest:'Yes, of course. Whatever keeps everyone safe.',sermon:'So be it.',slippery:'Done. Easy.'},
  reservation:{grand:'I shall do it. Under protest. Write “under protest”.',gruff:'I’ll do it. Don’t like it.',eager:'Okay. I mean, okay. I’m fine. I’m not fine.',stoic:'I’ll work it. I won’t pretend I’m happy.',precise:'I will comply. I note my objection for the record.',earnest:'It’s fine. Honestly. It’s fine.',sermon:'I will bear it. I will not pretend to like it.',slippery:'Fine. But you owe me. I’m keeping count.'},
  payoff:{grand:'If my {orig} goes, I want the big spot. The {move}. I am not a prop.',gruff:'Then I get the big spot. The {move}.',eager:'Okay but if I lose the {orig} can I do the {move}? Please? Big spot?',stoic:'I’ll give up the {orig}. Then the big spot’s mine. The {move}.',
   precise:'I will give up the {orig} in exchange for the big spot: the {move}. A fair trade.',earnest:'I don’t mind changing the {orig}. Could I have the big spot, though? The {move}?',sermon:'I give up the {orig}. In return, let me have the {move} for the big spot.',slippery:'I lose the {orig}, I get the big spot. The {move}. That’s how trades work.'},
  minutes:{grand:'If my {orig} goes, I want time to work. Two more minutes.',gruff:'Then I want two more minutes.',eager:'Okay, but can we have two more minutes? I’ll fill them!',stoic:'Fine. Give us two more minutes to make it work.',
   precise:'Then the match needs two more minutes for the change to read.',earnest:'Could we have a couple more minutes, then? So it makes sense?',sermon:'Grant us two more minutes, and it will be done right.',slippery:'Two more minutes and it’s a deal.'}
 };
 const tline=(map,st,side,vars)=>{const W=who(st,side);let t=map[voice(W)]||map.stoic;for(const [k,v] of Object.entries(vars))t=t.split('{'+k+'}').join(v);return cap(t);};
 function negoLog(st,side,text,kind){log(st,side,text,kind);st.negotiation?.turns.push({who:nameOf(st,side),text});}
 function negoSettle(st,how,final){
  const n=st.negotiation;n.choice=how;n.final=final?{action:final.action,label:final.label,owner:final.owner}:{...n.original};
  const r=how==='keep'?null:replyFor(st,n,how);
  n.reply=r?{side:r.side,who:nameOf(st,r.side),kind:r.kind,demand:r.demand||null,text:null}:null;
  if(r&&r.kind==='conditional'){
   const t=tline(REPLY_LINES[r.demand.kind],st,r.side,{orig:n.original.label,move:r.demand.label||''});
   n.reply.text=t;negoLog(st,r.side,t,'objection');chain(st,'rival_counter_reply');
  }else if(r){
   const t=tline(REPLY_LINES[r.kind],st,r.side,{});n.reply.text=t;negoLog(st,r.side,t,r.kind==='reservation'?'objection':'talk');
   if(r.kind==='reservation')st.mood[r.side]-=3;
  }
  n.summary=nameOf(st,n.by)+' asked to change '+SLOT_NAME(n.slot)+': '+n.original.label+(n.final.action!==n.original.action?' became '+n.final.label:' stayed')+(n.reply?'; '+n.reply.who+' '+({agreed:'agreed',reservation:'went along with reservations',conditional:'asked for something back'}[n.reply.kind]):'')+'.';
 }
 SITUATIONS.push(
  {id:'rival_counter',kind:'match',weight:0,followup:true,when:()=>true,
   open(st){
    const n=negotiationFor(st);if(!n)return false;
    st.negotiation={...n,turns:[],choice:null,final:null,reply:null,demand:null,summary:''};
    const prev=scout(st).lastTalk;
    log(st,'agent',(prev&&prev.issue===n.issue&&prev.slot===n.slot?'Same conversation as last time, near enough. ':'')+n.reason);
    const t=tline(NEGO_LINES[n.issue],st,n.by,{them:nameOf(st,other(n.by)),fam:FAMWORD(n.family),orig:n.original.label,alt:n.proposal.label,n:String(scout(st).lostRun)});
    negoLog(st,n.by,t,'objection');
    return true;
   },
   title:st=>st.negotiation?nameOf(st,st.negotiation.by)+' wants to change '+SLOT_NAME(st.negotiation.slot):'A change to the running order',
   ask:st=>{const n=st.negotiation;return n?SLOT_NAME(n.slot).replace(/^t/,'T')+': the '+n.original.label+' or the '+n.proposal.label+'?':'';},
   options(st){
    const n=st.negotiation;if(!n)return [];
    const by=n.by,m=by==='w'?'moodW':'moodF';
    const agentAlt=n.slot==='payoff'?{action:'scheduled_nearfall',label:'A run of near falls',owner:'either',by:'agent'}:
     cardsFor(st,n.slot).find(c=>c.by==='agent'&&c.action!==n.original.action&&c.action!==n.proposal.action&&!banned(st,c.action))||null;
    const yes={[m]:3,plan:{slot:n.slot,owner:n.proposal.owner,by:n.proposal.by,action:n.proposal.action,label:n.proposal.label}};
    const mid=agentAlt?{[m]:1,plan:{slot:n.slot,owner:agentAlt.owner,by:'agent',action:agentAlt.action,label:agentAlt.label}}:null;
    const credible=n.issue==='safety'&&n.credible;
    const no={[m]:credible?-2:-4};
    const out=[{id:'accept',label:'“Do it '+nameOf(st,by)+'’s way.”',hint:'The '+n.proposal.label+' goes in instead of the '+n.original.label+'. The other side gets a say.',fx:yes,tags:tagsOf(st,yes),
      run(st){log(st,'agent',from(st,'nego-yes',['Rubbing it out. There.','Changed. In pen, this time.','Fine. That’s the running order.']));negoSettle(st,'accept',n.proposal);}}];
    if(mid)out.push({id:'agent',label:'“Neither. '+AGENT+', what have you got?”',hint:AGENT+'’s middle option: the '+agentAlt.label+'.',fx:mid,tags:tagsOf(st,mid),
      run(st){log(st,'agent','The '+agentAlt.label+'. Nobody gets exactly what they wanted, which is how you know it’s fair.');negoSettle(st,'agent',agentAlt);}});
    out.push({id:'keep',label:'“It stays as it is.”',hint:credible?nameOf(st,by)+' will refuse to do it, and '+AGENT+' will have to change it anyway.':nameOf(st,by)+' takes it badly, and works the match with a grudge.',fx:no,tags:[...tagsOf(st,no),...(credible?['They will refuse']:[])],
      run(st){
       if(credible){
        const t=tline({grand:'Then I decline. Politely. Absolutely.',gruff:'No. I’m not doing it.',eager:'I can’t. I really can’t. Sorry!',stoic:'No. I’m not doing it on this body.',precise:'I decline. That is not negotiable.',earnest:'I’m sorry, I just can’t do it safely.',sermon:'I will not.',slippery:'Yeah, that’s a no from me.'},st,by,{});
        negoLog(st,by,t,'objection');
        const safe={action:'scheduled_nearfall',label:'A run of near falls',owner:'either',by:'agent'};
        apply(st,{plan:{slot:n.slot,...safe}});log(st,'agent','Then it’s near falls. I’m not having anybody carried out on my watch.');
        negoSettle(st,'refused',safe);st.negotiation.reply={side:by,who:nameOf(st,by),kind:'refused',text:t};
        st.negotiation.summary=nameOf(st,by)+' refused the '+n.original.label+'; it became '+safe.label+'.';
       }else{log(st,by,say(st,'grumble',who(st,by),'nego'),'objection');negoSettle(st,'keep',null);st.negotiation.reply={side:by,who:nameOf(st,by),kind:'reservation',text:null};
        st.negotiation.summary=nameOf(st,by)+' asked to change '+SLOT_NAME(n.slot)+'; it stayed the '+n.original.label+', with '+nameOf(st,by)+' unhappy.';}
      }});
    return out;
   }},
  {id:'rival_counter_reply',kind:'match',weight:0,followup:true,when:()=>true,
   open(st){if(!st.negotiation?.reply?.demand)return false;log(st,'agent','And now the other half of the conversation.');return true;},
   title:st=>st.negotiation?.reply?nameOf(st,st.negotiation.reply.side)+' wants something back':'Something back',
   ask:st=>st.negotiation?.reply?.demand?(st.negotiation.reply.demand.kind==='payoff'?'Give '+nameOf(st,st.negotiation.reply.side)+' the big spot?':'Two more minutes?'):'',
   options(st){
    const r=st.negotiation?.reply;if(!r?.demand)return [];
    const d=r.demand,side=r.side,m=side==='w'?'moodW':'moodF';
    const grant=d.kind==='payoff'?{[m]:4,plan:{slot:'payoff',owner:side,by:side,action:d.action,label:d.label}}:{[m]:3,minutes:2};
    const half=d.kind==='payoff'?{[m]:1,plan:{slot:'payoff',owner:'either',by:'agent',action:'scheduled_nearfall',label:'A run of near falls'}}:{[m]:1,minutes:1};
    const no={[m]:-4};
    return [
     {id:'grant',label:d.kind==='payoff'?'“The big spot’s yours.”':'“Two more minutes.”',hint:d.kind==='payoff'?nameOf(st,side)+' gets the '+d.label+'.':'The match runs two minutes longer.',fx:grant,tags:tagsOf(st,grant),
      run(st){log(st,side,say(st,'pleased',who(st,side),'nego'));st.negotiation.demand={...d,granted:'yes'};st.negotiation.summary+=' '+(d.kind==='payoff'?nameOf(st,side)+' got the big spot in return.':'The match got two more minutes.');}},
     {id:'split',label:d.kind==='payoff'?'“Nobody gets it. Near-falls.”':'“One minute.”',hint:'Meet in the middle.',fx:half,tags:tagsOf(st,half),
      run(st){log(st,side,say(st,'grumble',who(st,side),'nego'));st.negotiation.demand={...d,granted:'half'};st.negotiation.summary+=' They met in the middle.';}},
     {id:'refuse',label:'“No. The change stands on its own.”',hint:nameOf(st,side)+' works the match unhappy.',fx:no,tags:tagsOf(st,no),
      run(st){log(st,side,tline(REPLY_LINES.reservation,st,side,{}),'objection');st.negotiation.demand={...d,granted:'no'};st.negotiation.reply.kind='reservation';st.negotiation.summary+=' The condition was refused.';}}];
   }}
 );
 // A structure-specific, causal safety discussion, not a transplanted
 // "proper comeback" conversation from the American match template.
 SITUATIONS.push({
  id:'structure_objection',kind:'match',weight:0,followup:true,when:x=>!!x.st.structurePlanning,
  open(st){
   structureSeed(st,{refresh:true});
   const issue=structureSlots(st).map(obj=>{
    const b=st.structureBoard?.[obj.id];
    if(!b?.action)return null;
    const O=who(st,b.owner);
    if(!O)return null;
    const prohibited=banned(st,b.action)||!legal(b.action,O,who(st,other(b.owner)));
    const vulnerable=!!A[b.action]?.risk&&((O.fatigue||0)>=45||!!O.injury||(O.safe||65)<58);
    if(!prohibited&&!vulnerable)return null;
    const alternative=structureCards(st,obj).find(c=>c.owner===b.owner&&c.action!==b.action&&!c.risk)||
     structureCards(st,obj).find(c=>c.action!==b.action)||null;
    return {id:obj.id,title:obj.title,original:{...b},by:b.owner,prohibited,vulnerable,alternative};
   }).find(Boolean);
   if(!issue)return false;
   st.structureObjection=issue;
   log(st,issue.by,nameOf(st,issue.by)+': “I’m not convinced the '+issue.original.label+
    ' is right for '+issue.title+'. Can we change it?”','objection');
   return true;
  },
  title:st=>st.structureObjection?.title||'The running order needs attention',
  ask:st=>'That move was proposed for a dramatic objective. How do we handle the concern?',
  options(st){
   const issue=st.structureObjection;if(!issue)return [];
   const a=issue.alternative;
   const out=[
    {id:'replace',label:a?'“Use the '+a.label+' instead.”':'“Leave the move open.”',
     hint:'Preserves the dramatic objective, not a guaranteed move landing.',tags:['Revises the agreement'],
     run(st){
      st.structureBoard[issue.id]=a?{...a,chosen:true,open:false,source:'negotiated'}:
       {owner:issue.by,action:null,label:'Call this objective in the ring',by:'agent',chosen:true,open:true,source:'open'};
      (st.structureObjections??=[]).push({objective:issue.id,reason:issue.prohibited?'prohibited':'safety',
       from:issue.original.action,to:a?.action||null,decision:'replace'});
      log(st,'agent','Rewritten, and kept in the same dramatic objective. No one has promised it will land.');
     }},
    {id:'open',label:'“No named move. Call this part in the ring.”',
     hint:'Removes the physical commitment, not the intended structure.',tags:['No called spot'],
     run(st){
      st.structureBoard[issue.id]={owner:issue.by,action:null,label:'Call this objective in the ring',
       by:'agent',chosen:true,open:true,source:'open'};
      (st.structureObjections??=[]).push({objective:issue.id,reason:issue.prohibited?'prohibited':'safety',
       from:issue.original.action,to:null,decision:'open'});
      log(st,'agent','The objective stays on the sheet, but that risky move is no longer agreed.');
     }}
   ];
   if(!issue.prohibited)out.push({id:'keep',label:'“Keep it, with their reservations noted.”',
    hint:'The move is physically possible, but the performer is unhappy.',tags:[nameOf(st,issue.by)+' ▼'],
    run(st){
     st.mood[issue.by]-=4;
     (st.structureObjections??=[]).push({objective:issue.id,reason:'safety',
      from:issue.original.action,to:issue.original.action,decision:'keep'});
     log(st,issue.by,'“I’ll work it. I still think it’s a bad idea.”','objection');
    }});
   return out;
  }
 });
 // Guaranteed structure-specific debate follows the existing safety objection.
 // Choices revise a legal named call or release it, never the booked result.
 SITUATIONS.push({
  id:'structure_huddle',kind:'match',weight:0,followup:true,when:x=>!!x.st.structurePlanning,
  open(st){
   const route=st.lockRoute||st.board.finish?.route||null,available=[];
   for(const obj of structureSlots(st)){
    const b=st.structureBoard?.[obj.id],owner=b?.owner;
    if(!b?.action||!['w','f'].includes(owner))continue;
    const alts=structureCards(st,obj).filter(c=>c.owner===owner&&c.action!==b.action&&
     !banned(st,c.action)&&legal(c.action,who(st,owner),who(st,other(owner))));
    const rank=c=>(supportsFinish(st,route,c)?4:0)-(c.risk?st.game==='safe'?5:1:0);
    alts.sort((a,z)=>rank(z)-rank(a)||a.action.localeCompare(z.action));
    available.push({obj,b,owner,alt:alts[0]||null,alts});
   }
   if(!available.length)return false;
   const opponents=available.filter(x=>x.owner===st.structure.roles.other),
    pool=opponents.length?opponents:available;
   let x=pool[Math.floor(rng(st.seed,'structure-huddle-'+st.game)*pool.length)],initiative=null;
   // Only newly created MP4B meetings opt in. Existing evidence-bearing
   // MP4A saves retain the original requester and alternative policy.
   if(st.planningInitiative===1&&st.planningEvidence&&root.OfficePlanningFuzzy){
    const F=root.OfficePlanningFuzzy,profiles={w:F.behaviour(st.planningEvidence,st,'w'),f:F.behaviour(st.planningEvidence,st,'f')};
    const candidates=[];
    for(const row of available){
     const {obj,b,owner}=row,o=who(st,owner),partner=who(st,other(owner));
     // Do not reopen a prohibited commitment; existing safety scene owns it.
     if(banned(st,b.action)||!legal(b.action,o,partner))continue;
     for(const alt of row.alts.length?row.alts:[null]){
      const original=A[b.action],next=alt&&A[alt.action];
      const known=id=>(o.learned||[]).includes(id)||(D.PROFILES[o.id]?.signature||[]).includes(id);
      const facts={safer:!!(next&&original.risk&&!next.risk),
       lessTaxing:!!(next&&pain(alt.action)<pain(b.action)),
       higherImpact:!!(next&&(next.crowd||0)>(original.crowd||0)),
       familiar:!!(next&&known(alt.action)&&!known(b.action)),
       supportsFinish:!!(alt&&supportsFinish(st,route,alt)&&!supportsFinish(st,route,b)),
       developingPartner:['Rookie','Prospect'].includes(partner.tier),
       simpler:!!(next&&!next.risk&&(next.cost??1)<(original.cost??1)),
       noAlternative:!alt};
      const priority=F.huddlePriority(profiles[owner],facts);
      if(priority)candidates.push({...row,alt,priority,tie:rng(st.seed,'initiative|'+obj.id+'|'+owner+'|'+(alt?.action||'open'))});
     }
    }
    candidates.sort((a,b)=>b.priority.score-a.priority.score||b.tie-a.tie||a.obj.id.localeCompare(b.obj.id));
    if(candidates.length){x=candidates[0];initiative={v:1,reason:x.priority.reason};}
   }
   st.structureTalk={objective:x.obj.id,title:x.obj.title,by:x.owner,
    original:{...x.b},alternative:x.alt?{...x.alt}:null,
    reason:x.b.risk&&st.game==='safe'?'risk':
     x.alt&&supportsFinish(st,route,x.alt)&&!supportsFinish(st,route,x.b)?'finish_support':'pacing',
    decision:null};
   if(initiative){st.structureTalk.initiative=initiative;st.structureTalk.reason=initiative.reason==='finish'?'finish_support':initiative.reason;}
   // Freeze the reactions at opening: preview, choice and reload agree.
   if(st.planningEvidence&&root.OfficePlanningFuzzy){
    const F=root.OfficePlanningFuzzy;
    const reactions=F.huddleReaction(F.behaviour(st.planningEvidence,st,x.owner),F.behaviour(st.planningEvidence,st,other(x.owner)));
    if(reactions)st.structureTalk.reactions=reactions;
   }
   if(st.planningProposal===1&&st.planningEvidence&&x.alt&&root.OfficePlanningFuzzy){
    const response=root.OfficePlanningFuzzy.huddleProposal(st.planningEvidence,st,x.obj.id,x.alt.action,x.owner);
    if(response)st.structureTalk.proposalResponse=response;
   }
   if(st.planningDialogue?.v===1&&root.OfficePlanningDialogue){
    const dialogue=root.OfficePlanningDialogue.freezeHuddle(st);
    if(dialogue)st.structureTalk.dialogue=dialogue;
   }
   if(st.planningSequences===1){
    const offer=makeSequenceOffer(st);
    if(offer)st.structureTalk.sequenceTalk={v:1,offer,heard:false};
   }
   const read=structureRead(st),v=STRUCTURE_VOICES[voice(who(st,x.owner))]||STRUCTURE_VOICES.stoic;
   log(st,'agent',read.label+' means '+read.focus+'. '+read.advice+' The promoter has already booked '+(D.FINISHES[st.finish]?.name||st.finish)+'.');
   const dialogue=root.OfficePlanningDialogue?.readHuddle(st);
   if(dialogue)planningLine(st,x.owner,dialogue.lines.request,'objection');
   else log(st,x.owner,'“'+v.replace('{move}',x.b.label.toLowerCase()).replace('{goal}',x.obj.title.toLowerCase())+'”','objection');
   const response=root.OfficePlanningFuzzy?.readHuddleProposal(st.structureTalk);
   const partner=response?.by[other(x.owner)]?.stance;
   if(dialogue)planningLine(st,other(x.owner),dialogue.lines.response,partner==='reserved'||partner==='counter'?'objection':undefined);
   else log(st,other(x.owner),partner==='accept'?'“That alternative works for me. Let’s keep the finish as agreed.”':
    partner==='reserved'?'“I can see the idea, but I have reservations about changing the call.”':
    partner==='counter'?'“I’m not sold on that alternative. I’d rather we looked at another way.”':
    '“I can work a change. Just make sure we both know what comes next.”',partner==='reserved'||partner==='counter'?'objection':undefined);
   return true;
  },
  title:st=>st.structureTalk?.title||'Talk through the structure',
  ask:st=>{
   const t=st.structureTalk;
   return !t?'':t.original.label+' is pencilled in for '+t.title+'. '+
    (t.reason==='risk'?'The safer approach makes the risk matter.':
     t.reason==='finish_support'?'A different legal move may support the finish better.':
     t.reason==='safety'?'The alternative is less risky or physically taxing.':
     t.reason==='visibility'?'The performer wants a stronger crowd moment.':
     t.reason==='craft'?'The alternative is a learned or signature move.':
     t.reason==='guidance'?'A less demanding move could help the developing partner.':
     'A performer wants a more convincing rhythm.')+
    ' The promoter’s winner and agreed finishing route stay fixed.';
  },
  options(st){
   const t=st.structureTalk;if(!t)return [];
   const side=t.by,name=nameOf(st,side),opp=nameOf(st,other(side)),a=t.alternative;
   const legacy={keep:{requester:-2,partner:0},revise:{requester:2,partner:-1},open:{requester:3,partner:-2}};
   // Old in-progress saves have no reactions. Preserve their exact policy.
   const valid=(r,lo,hi,partnerMin)=>r&&Number.isInteger(r.requester)&&r.requester>=lo&&r.requester<=hi&&Number.isInteger(r.partner)&&r.partner>=partnerMin&&r.partner<=0;
   const response=root.OfficePlanningFuzzy?.readHuddleProposal(t);
   const r=t.reactions;
   const reactions=r?.v===1&&valid(r.keep,-5,-1,0)&&valid(r.revise,1,4,-3)&&valid(r.open,1,5,-4)?r:legacy;
   const dynamic=reactions!==legacy;
   const revised=response?{requester:response.by[side].mood,partner:response.by[other(side)].mood}:reactions.revise;
   const delta=k=>k==='revise'?revised:reactions[k];
   const moodText=n=>n===0?'unchanged':(n>0?'+':'')+n+' mood';
   const stanceText=s=>s==='accept'?'receptive':s==='reserved'?'has reservations':'wants another alternative';
   const reviseTags=response?[...(revised.requester?[name+(revised.requester>0?' ▲':' ▼')]:[]),...(revised.partner?[opp+(revised.partner>0?' ▲':' ▼')]:[])]:[name+' ▲',...(reactions.revise.partner<0?[opp+' ▼']:[])];
   const describe=(k,original)=>k==='revise'&&response?name+' '+stanceText(response.by[side].stance)+' ('+moodText(revised.requester)+'); '+opp+' '+stanceText(response.by[other(side)].stance)+' ('+moodText(revised.partner)+').':dynamic?name+' '+(reactions[k].requester>0?'+':'')+reactions[k].requester+' mood; '+opp+' '+(reactions[k].partner===0?'unchanged':reactions[k].partner+' mood')+'.':original;
   const applyReaction=k=>{st.mood[side]+=delta(k).requester;st.mood[other(side)]+=delta(k).partner;};
   const out=[{id:'keep',label:'“Keep the '+t.original.label+'.”',
    hint:'Preserve the named call and finish; '+describe('keep',name+' loses 2 consent for being overruled.'),
    tags:[name+' ▼','Keeps original call'],
    run(st){
     applyReaction('keep');t.decision='keep';
     log(st,side,'“Fine. But I wanted it noted.”','objection');
     log(st,'agent','Kept the call; the reservation remains on the record.');
    }}];
   if(a&&(!response||proposalEvidence(st,t.objective,a.action).eligible))out.push({id:'revise',label:'“Use the '+a.label+' instead.”',
    hint:'One legal move replaces another for the same wrestler. '+describe('revise',name+' +2 consent; '+opp+' −1 for readjusting.'),
    tags:[...reviseTags,'Changes named call',...(response&&response.by[other(side)].stance==='counter'?['Partner wants another option']:[])],
    run(st){
     const dialogue=root.OfficePlanningDialogue?.readHuddle(st);
     st.structureBoard[t.objective]={...a,chosen:true,open:false,source:'negotiated'};
     applyReaction('revise');t.decision='revise';if(t.bargaining)t.bargaining.selected='first';
     const own=response?.by[side]?.stance,partner=response?.by[other(side)]?.stance;
     if(dialogue)planningLine(st,side,dialogue.lines.requesterResolution,own==='reserved'||own==='counter'?'objection':undefined);
     else log(st,side,own==='reserved'?'“I’ll work with the change, though I still have concerns.”':own==='counter'?'“I wanted a change, but this still isn’t quite right.”':'“That move I can work.”',own==='reserved'||own==='counter'?'objection':undefined);
     if(response){
      if(dialogue)planningLine(st,other(side),dialogue.lines.partnerResolution,partner==='accept'?undefined:'objection');
      else log(st,other(side),partner==='accept'?'“Agreed. We know the call.”':partner==='reserved'?'“I’ll work it, but put my reservation on the record.”':'“That’s the call, then. I still want another option noted.”',partner==='accept'?undefined:'objection');
     }
     log(st,'agent','Revised '+t.title+'; the dramatic objective and booked finish still stand.');
    }});
   // One extra discussion, never a loop. Ask without committing a move
   // or charging mood; afterwards both actual offers remain available.
   if(st.planningBargaining===1&&response&&!t.bargaining&&!t.sequenceTalk?.heard){
    const offer=counterOffer(st);
    if(offer)out.push({id:'hear_counter',label:'“'+opp+', what would you suggest instead?”',
     hint:'Hear one more legal proposal. No change to the layout or consent yet.',tags:['Continue discussion'],
     run(st){
      t.bargaining={v:1,offer,first:{card:{...a},response}};
      planningLine(st,other(side),offer.dialogue.lines.request,'talk');
      const reply=offer.response.by[side].stance;
      planningLine(st,side,offer.dialogue.lines.response,reply==='accept'?undefined:'objection');
      log(st,'agent','Two alternatives on the table. Choose one, keep the original, or leave the objective open.');
      if(st.planningSequences===1&&!t.sequenceTalk?.heard){
       const next=makeSequenceOffer(st);
       if(next)t.sequenceTalk={v:1,offer:next,heard:false};else delete t.sequenceTalk;
      }
     }});
   }
   const compromise=readCounterOffer(st);
   if(compromise){
    const q=compromise.response.by;
    // The final mood includes the existing board credit for whose idea
    // is called. Preview that adjustment without mutating the board.
    const before=structureCallMood(st.structureBoard[t.objective]),after=structureCallMood(compromise.card);
    const net={w:q.w.mood+after.w-before.w,f:q.f.mood+after.f-before.f};
    out.push({id:'compromise',label:'“Use the '+compromise.card.label+' instead.”',
     hint:name+' '+stanceText(q[side].stance)+' ('+moodText(net[side])+'); '+opp+' '+stanceText(q[other(side)].stance)+' ('+moodText(net[other(side)])+'). Includes the change in credit for the called move.',
     tags:[...['w','f'].filter(s=>net[s]!==0).map(s=>nameOf(st,s)+(net[s]>0?' ▲':' ▼')),'Second proposal'],
     run(st){
      // Re-check hard eligibility at commit; no extra mood from talking.
      const final=readCounterOffer(st);if(!final)throw Error('Counterproposal is no longer eligible');
      st.structureBoard[t.objective]={...final.card,chosen:true,open:false,source:'negotiated'};
      st.mood[side]+=q[side].mood;st.mood[other(side)]+=q[other(side)].mood;
      t.decision='revise';t.bargaining.selected='second';
      planningLine(st,side,final.dialogue.lines.requesterResolution,q[side].stance==='accept'?undefined:'objection');
      planningLine(st,other(side),final.dialogue.lines.partnerResolution,q[other(side)].stance==='accept'?undefined:'objection');
      log(st,'agent','Revised '+t.title+' using the second proposal. The booked finish still stands.');
     }});
   }
   const sequence=readSequenceOffer(st);
   if(sequence&&!t.sequenceTalk.heard){
    out.push({id:'hear_sequence',label:'“Talk me through the setup for '+sequence.card.label+'.”',
     hint:'Hear a connected sequence and both wrestlers’ reactions. No commitment or mood change yet.',
     tags:['Continue discussion'],
     run(st){
      const offer=readSequenceOffer(st);if(!offer)throw Error('Sequence is no longer eligible');
      t.sequenceTalk.heard=true;
      const proposer=offer.dialogue.point.requester,partner=other(proposer);
      planningLine(st,proposer,offer.dialogue.lines.request);
      const start=offer.evidence.start,guards=[...new Set(offer.evidence.steps.flatMap(s=>s.guards))];
      log(st,'agent',sequenceDescription(st,offer)+'. Start: '+nameOf(st,start.control)+' in control, '+start.position+
       (start.down?', '+nameOf(st,start.down)+' down':'')+'. Difficulty '+Math.round(offer.difficulty.score)+'/100. '+
       (guards.length?'Check '+guards.map(g=>g.replace('live_','').replaceAll('_',' ')).join(', ')+' live. ':'')+'Conditional setup only.');
      planningLine(st,partner,offer.dialogue.lines.response,offer.by[partner].stance==='accept'?undefined:'objection');
     }});
   }else if(sequence&&t.sequenceTalk.heard){
    const q=sequence.by,before=structureCallMood(st.structureBoard[t.objective]),after=structureCallMood(sequence.card);
    const net={w:q.w.mood+after.w-before.w,f:q.f.mood+after.f-before.f};
    out.push({id:'use_sequence',label:'“Pencil in that '+sequence.evidence.steps.length+'-move setup.”',
     hint:sequenceDescription(st,sequence)+'. '+name+' '+stanceText(q[side].stance)+' ('+moodText(net[side])+'); '+opp+' '+stanceText(q[other(side)].stance)+' ('+moodText(net[other(side)])+'). '+(st.planningSequenceSigning===1?'Sign the setup conditionally at review. Live execution is not yet enabled.':'Only the final named call is signed in this version; the setup is provisional.'),
     tags:[...['w','f'].filter(s=>net[s]!==0).map(s=>nameOf(st,s)+(net[s]>0?' ▲':' ▼')),'Conditional setup'],
     run(st){
      const offer=readSequenceOffer(st);if(!offer)throw Error('Sequence is no longer eligible');
      st.structureBoard[t.objective]={...offer.card,chosen:true,open:false,source:'negotiated'};
      st.mood.w+=offer.by.w.mood;st.mood.f+=offer.by.f.mood;
      t.decision='revise';t.sequenceTalk.selected=true;
      if(st.planningSequenceSigning===1)st.structureBoard[t.objective].sequence=sequenceCommitmentFrom(offer);
      if(t.bargaining)t.bargaining.selected=offer.card.action===t.bargaining.offer.card.action?'second':'first';
      planningLine(st,side,offer.dialogue.lines.ownerResolution,q[side].stance==='accept'?undefined:'objection');
      planningLine(st,other(side),offer.dialogue.lines.partnerResolution,q[other(side)].stance==='accept'?undefined:'objection');
      log(st,'agent',st.planningSequenceSigning===1?'The connected setup is on the sheet, conditional on the right opening. We can still revise it before signing. The booked result stands.':'Setup pencilled in for discussion. Only '+offer.card.label+' is signed as a named call in this version; the connected setup is not an execution commitment.');
     }});
   }
   out.push({id:'open',label:'“Call this objective in the ring.”',
    hint:'Removes the named commitment, not the objective. '+describe('open',name+' +3 consent; '+opp+' −2 for uncertainty.'),
    tags:[name+' ▲',...(reactions.open.partner<0?[opp+' ▼']:[]),'No promised move'],
    run(st){
     st.structureBoard[t.objective]={owner:side,action:null,label:'Call this objective in the ring',
      by:'agent',chosen:true,open:true,source:'open'};
     applyReaction('open');t.decision='open';
     log(st,side,'“Good. I will find the opening when it comes.”');
     log(st,'agent','The objective remains, but no one has promised the move will land.');
    }});
   return out;
  }
 });
 const SPINE=SLOTS.filter(S=>S.id!=='finish');
 // Opt-in Phase 2 planner: no classic slots, no implied face/heel assignment.
 // These categories are candidate REAL graph moves; the structure objective
 // is not satisfied until a later Director can prove its actual event predicate.
 const OBJECTIVE_FAMILIES={
  opening_advantage:['chain','strike','running'],
  pressure:['ground','power','corner','submission'],
  comeback:['fire','running','lucha','strike'],
  payoff:['suplex','power','neck','aerial','submission'],
  technical_exchange:['chain','submission'],
  escalation:['suplex','power','strike','corner'],
  callback:['chain','submission'],
  finish_build:['power','suplex','neck','aerial','submission'],
  evasion:['heel','outside'],
  exposure:['chain','running','fire','strike'],
  shortcut:['heel','strike','corner'],
  escape:['chain','outside'],
  dominance:['power','suplex'],
  challenge:['fire','running','chain'],
  reassertion:['power','suplex','neck']
 };
 const STRUCTURE_INCOMPATIBLE=new Set([
  'big_spot','debut','wont_job','leash','crowd','request','protect',
  'promise_due','rival_counter','rival_counter_reply'
 ]);
 // Phase 5: narrative guidance only. No hidden match-graph multipliers.
 const STRUCTURE_READ={
  classic_american:{focus:'opening advantage, heat, comeback and payoff',best:['story','safe'],warn:['spots'],
   hints:{story:'Make the changes of control clear.',spots:'Too many early highlights can flatten the comeback.',
    technical:'Use patient control to earn the comeback.',brawl:'Keep the turning points readable amid the brawl.',
    safe:'A careful layout can still produce a convincing comeback.'}},
  kings_road:{focus:'technical exchanges, escalation and a tactical callback',best:['technical','story'],warn:['spots'],
   hints:{story:'Give the first exchanges time to matter again later.',
    spots:'Leave room between major moves for earlier technique to pay off.',
    technical:'Let counters and holds establish the later callbacks.',
    brawl:'Keep the early tactical thread visible through the strikes.',
    safe:'Build from legal reversals instead of unnecessary spectacle.'}},
  chickenshit_heel:{focus:'evasion, exposure, a shortcut and a defensive escape',best:['story','brawl'],warn:['spots'],
   hints:{story:'Let the opponent catch the heel before the shortcut.',
    spots:'Spectacle can crowd out the heel being exposed.',
    technical:'Counters can expose the shortcut before it changes the match.',
    brawl:'Make the cheap shot a response to being caught.',
    safe:'The villain can cheat without an unsafe impact.'}},
  dominant_ace:{focus:'ace superiority, a credible challenge and the answer',best:['story','technical'],warn:['spots'],
   hints:{story:'The challenger needs a real moment before the ace answers.',
    spots:'Save the major offence until the challenge feels credible.',
    technical:'Controlled wrestling can make the answer more convincing.',
    brawl:'Give the challenger resistance, not an unbroken squash.',
    safe:'Precision can establish superiority without reckless risk.'}}
 };
 const STRUCTURE_VOICES={
  grand:'I can sell {goal}, but the {move} deserves another look.',
  gruff:'The {move} for {goal}? Not convinced.',
  eager:'Could we change the {move}? I want {goal} to mean something.',
  stoic:'I can work {goal}. The {move} is the bit I question.',
  precise:'The {move} is not the best use of my {goal} window.',
  earnest:'Could we rethink the {move}, for {goal}?',
  sermon:'The {goal} must tell the story, not merely the {move}.',
  slippery:'The {move} is fine on paper. I have a better idea for {goal}.'
 };
 function structureRead(st,game=st.game){
  if(!st.structurePlanning)return null;
  const d=STRUCTURE_READ[st.structure.id],label=P.STRUCTURES.catalogue().find(x=>x.id===st.structure.id)?.label||st.structure.id;
  return {label,focus:d?.focus||'the dramatic objectives',
   advice:d?.hints?.[game]||'Only performed graph actions can fulfil an objective.',
   fit:d?.best?.includes(game)?'Strong structural fit':d?.warn?.includes(game)?'Pacing trade-off':'Alternative approach'};
 }
 function structureReview(st){
  if(!st.structurePlanning)return null;
  const info=structureRead(st),route=st.lockRoute||st.board.finish?.route||null;
  const named=structureSlots(st).filter(o=>st.structureBoard?.[o.id]?.action).length,t=st.structureTalk;
  let discussion=t?.decision==='revise'?'Negotiated '+t.title+': '+t.original.label+' became '+(st.structureBoard?.[t.objective]?.label||'another legal move')+'.':
   t?.decision==='open'?'Negotiated '+t.title+': no named move is promised.':
   t?.decision==='keep'?'Kept '+t.original.label+' for '+t.title+' despite '+nameOf(st,t.by)+'’s reservation.':null;
  if(st.planningSequenceSigning===1&&t?.sequenceTalk?.selected&&st.structureBoard?.[t.objective]?.sequence){
   const offer=t.sequenceTalk.offer,valid=agreedSequence(st,structureSlot(st,t.objective));
   if(valid)discussion+=' Conditional setup: '+sequenceDescription(st,offer)+'. Signed as a plan, not a guaranteed execution.';
   else discussion+=' The setup needs revision before signing.';
  }else if(st.planningSequenceSigning!==1&&t?.sequenceTalk?.selected&&t.sequenceTalk.offer?.card?.action===st.structureBoard?.[t.objective]?.action){
   const offer=t.sequenceTalk.offer,ev=sequenceEvidence(st,t.objective,offer.card.action,offer.sequence);
   if(ev.eligible&&JSON.stringify(ev)===JSON.stringify(offer.evidence))discussion+=' Discussed setup: '+sequenceDescription(st,offer)+'. Provisional; only the named call is signed.';
  }
  return {label:info.label,focus:info.focus,lead:nameOf(st,st.structure.roles.lead),
   booked:D.FINISHES[st.finish]?.name||st.finish,
   route:route?ROUTE_NAME[route]||route:'Not selected',
   approach:st.game?D.PLANS[st.game]?.name||st.game:'Not selected',
   advice:info.advice,named,open:4-named,discussion};
 }
 const structureSlots=st=>st.structure?.objectives||[];
 const structureSlot=(st,id)=>structureSlots(st).find(x=>x.id===id)||null;
 // A wrestler must actually be able to attempt a graph action. No invented
 // spots and no signatures that violate stature or the current safety limits.
 function structurePool(st,obj,owner){
  const o=who(st,owner),r=who(st,other(owner));
  if(!o||!r)return [];
  const families=OBJECTIVE_FAMILIES[obj.intent]||[];
  const known=[...(D.PROFILES[o.id]?.signature||[]),...(o.learned||[])];
  // An escape is a reversal, release or physical retreat, NOT rope leverage,
  // showboating or another illicit attacking move.
  const escapeMoves=['wrist_escape','waist_escape','headlock_escape','mat_scramble',
   'counter_strike','floor_counter','armbar_roll'];
  const ids=[...new Set([...known,...families.flatMap(f=>CAT.members[f]||[]),
   ...(obj.intent==='escape'?escapeMoves:[])])];
  const cutoff=Math.min(.98,obj.window[1]+.08);
  return ids.filter(id=>{
   const n=A[id];
   if(!n||typeof n.after!=='number'||n.after>cutoff||n.nearfall||n.blockOf||
     !legal(id,o,r)||banned(st,id)||!P.DIRECTOR.compatibleCall(obj,id,owner)||!(families.includes(n.family)||
     families.some(f=>(CAT.members[f]||[]).includes(id))||
     obj.intent==='escape'&&escapeMoves.includes(id)))return false;
   // A dramatic objective cannot be "earned" by irrelevant filler: no
   // eye rakes in clean technical exchanges, no breathers as huge finishes.
   const cost=n.cost??1,crowd=n.crowd??0,name=(n.name||id).toLowerCase();
   const dirty=/rake|bite|poke|hair.pull|referee|low.blow|faked.injury/.test(name);
   const tactical=['technical_exchange','callback','opening_advantage'].includes(obj.intent);
   const impact=['escalation','finish_build','dominance','reassertion','payoff'].includes(obj.intent);
   if(tactical&&(cost<.8||crowd<0||dirty||n.risk))return false;
   if(impact&&(cost<2.4||crowd<2||dirty||n.family==='rest'))return false;
   if(['exposure','challenge','comeback'].includes(obj.intent)&&(cost<1||dirty))return false;
   if(obj.intent==='evasion'&&!/stall|retreat|plea|mock|duck|rope|roll.out|outside|argument/.test(name))return false;
   if(obj.intent==='escape'&&!(n.reverse||escapeMoves.includes(id)))return false;
   if(obj.intent==='shortcut'&&!(dirty||n.family==='heel'||crowd<0))return false;
   return ['evasion','escape'].includes(obj.intent)?cost>=-1:cost>=0;
  }).sort((a,b)=>{
   const A1=A[a],B1=A[b],famA=families.indexOf(A1.family),famB=families.indexOf(B1.family);
   const rankA=(famA>=0?4-famA:0)+(A1.crowd||0)*.5+appeal(a,o)*.4;
   const rankB=(famB>=0?4-famB:0)+(B1.crowd||0)*.5+appeal(b,o)*.4;
   return rankB-rankA||a.localeCompare(b);
  });
 }
 function structureCards(st,obj){
  const permitted=obj.actor==='either'?['w','f']:[obj.actor],cards=[];
  for(const side of permitted){
   const pool=structurePool(st,obj,side);
   if(!pool.length)continue;
   const first=pool[0],soft=pool.slice().sort((a,b)=>pain(a)-pain(b)||a.localeCompare(b)).find(id=>id!==first);
   cards.push({by:side,owner:side,action:first,label:name(first),risk:!!A[first]?.risk});
   if(soft)cards.push({by:'agent',owner:side,action:soft,label:name(soft),risk:!!A[soft]?.risk});
  }
  const used=new Set();
  return cards.filter(c=>{
   const k=c.owner+'|'+c.action;if(used.has(k))return false;used.add(k);return true;
  });
 }
 // MP5A: read-only evidence contract for a single existing called spot.
 // The room owns eligibility; fuzzy consumers cannot invent a legal card.
 // Bounded extra offers, only for opt-in bargaining. The visible board
 // still has its original cards; every extra comes from its legal pool.
 function bargainingCards(st,obj,owner){
  if(st.planningBargaining!==1||!obj||!['w','f'].includes(owner)||obj.actor!=='either'&&obj.actor!==owner)return [];
  const pool=structurePool(st,obj,owner),route=st.lockRoute||st.board.finish?.route||null;
  const low=[...pool].sort((a,b)=>(A[a].cost??Infinity)-(A[b].cost??Infinity)||pain(a)-pain(b)||a.localeCompare(b));
  const known=id=>(who(st,owner).learned||[]).includes(id)||(D.PROFILES[who(st,owner).id]?.signature||[]).includes(id);
  const ids=[...new Set([...pool.slice(0,4),...low.slice(0,3),pool.find(id=>known(id)),pool.find(id=>supportsFinish(st,route,{action:id,owner})),pool.find(id=>!A[id].risk)].filter(Boolean))];
  return ids.map(action=>({by:other(owner),owner,action,label:name(action),risk:!!A[action].risk}));
 }
 function counterOffer(st){
  const t=st.structureTalk,F=root.OfficePlanningFuzzy,L=root.OfficePlanningDialogue;
  if(st.planningBargaining!==1||!t?.alternative||t.decision||!L?.readHuddle(st)||!F?.readHuddleProposal(t))return null;
  const obj=structureSlot(st,t.objective),first=proposalEvidence(st,t.objective,t.alternative.action);
  if(!first.eligible)return null;
  const candidates=[];
  for(const card of bargainingCards(st,obj,t.by)){
   if([t.original.action,t.alternative.action].includes(card.action))continue;
   const e=proposalEvidence(st,t.objective,card.action);
   if(!e.eligible)continue;
   const response=F.huddleProposal(st.planningEvidence,st,t.objective,card.action,t.by);
   if(!response)continue;
   const topic=L.counterTopic(first,e),owner=response.by[t.by].scores,partner=response.by[other(t.by)].scores;
   const utility=s=>s.acceptance-.5*s.reservations-.5*s.counterproposal;
   const balance=Math.min(utility(owner),utility(partner)),joint=(utility(owner)+utility(partner))/2;
   // Prefer a workable trade-off to another attempt at maximum impact.
   // A different rationale cannot override either worker's assessment.
   const merit=joint*.65+balance*.35+(topic==='risk'||topic==='finish'||topic==='effort'||topic==='familiarity'?3:0);
   candidates.push({card,response,merit});
  }
  candidates.sort((x,y)=>y.merit-x.merit||x.card.action.localeCompare(y.card.action));
  if(!candidates.length)return null;
  const {card,response}=candidates[0],offer={v:1,card,response};
  const dialogue=L.freezeCounter(st,offer);
  return dialogue?{...offer,dialogue}:null;
 }
 function readCounterOffer(st){
  const saved=st.structureTalk?.bargaining?.offer;
  if(st.structureTalk?.bargaining?.v!==1||!saved)return null;
  // Freeze the chosen offer across reloads; validate the exact card and
  // response against the still-current original, not a new ranking.
  const t=st.structureTalk;
  if(!bargainingCards(st,structureSlot(st,t.objective),t.by).some(c=>JSON.stringify(c)===JSON.stringify(saved.card)))return null;
  const dialogue=root.OfficePlanningDialogue?.freezeCounter(st,saved);
  return dialogue&&JSON.stringify(dialogue)===JSON.stringify(saved.dialogue)?saved:null;
 }
 // One optional sequence exchange. Freeze the candidate once and
 // revalidate its exact evidence and replies before showing/accepting it.
 function makeSequenceOffer(st){
  const t=st.structureTalk,L=root.OfficePlanningDialogue;
  if(st.planningSequences!==1||!t?.alternative||t.decision||!L?.readHuddle(st))return null;
  const second=readCounterOffer(st),cards=second?[second.card,t.alternative]:[t.alternative];
  for(const card of cards){
   const diverse=st.planningSequencePolicy===2;
   const result=sequenceCandidates(st,t.objective,card.action,{diverse});
   // Prefer an actual connected exchange with both performers where
   // close in merit to the top suggestion, but don't force a reversal.
   const top=result.candidates[0];
   if(!top)continue;
   let row=result.candidates.find(r=>r.difficulty.components.controlChanges>0&&r.merit>=top.merit-4)||top;
   if(diverse){
    const preference=root.OfficePlanningFuzzy.sequencePreference(st.planningEvidence,st);
    const ranked=result.candidates.filter(r=>!preference.cautious||
     r.sequence.actions.length===2&&r.evidence.steps.every(s=>!s.risk));
    if(!ranked.length)continue;
    // Complexity preference is the marginal creative value of a
    // longer exchange. The proposal model still supplies both stances.
    // Scale its merit here to avoid counting difficulty three times.
    const score=r=>r.merit*.25-10*Math.abs(r.sequence.actions.length-preference.target)
     +(r.difficulty.components.controlChanges>0&&new Set(r.evidence.steps.map(s=>s.performer)).size>1?preference.scores.exchange*.16:0)
     -r.evidence.steps.filter(s=>s.risk).length*5;
    ranked.sort((x,y)=>score(y)-score(x)||y.merit-x.merit||x.sequence.actions.join('|').localeCompare(y.sequence.actions.join('|')));
    row=ranked[0];
   }
   const offer={v:1,card:{...card},sequence:row.sequence,evidence:row.evidence,difficulty:row.difficulty,by:row.by};
   const dialogue=L.freezeSequence(st,offer);
   if(dialogue)return {...offer,dialogue};
  }
  return null;
 }
 function readSequenceOffer(st){
  const t=st.structureTalk,F=root.OfficePlanningFuzzy,L=root.OfficePlanningDialogue,s=t?.sequenceTalk,offer=s?.offer;
  if(st.planningSequences!==1||t?.decision||s?.v!==1||offer?.v!==1||!L?.readHuddle(st))return null;
  const second=readCounterOffer(st),card=[t.alternative,second?.card].filter(Boolean).find(c=>JSON.stringify(c)===JSON.stringify(offer.card));
  if(!card)return null;
  const evidence=sequenceEvidence(st,t.objective,card.action,offer.sequence);
  if(!evidence.eligible||JSON.stringify(evidence)!==JSON.stringify(offer.evidence))return null;
  const difficulty=F.sequenceDifficulty(evidence);
  if(!difficulty||JSON.stringify(difficulty)!==JSON.stringify(offer.difficulty))return null;
  const by={};
  for(const side of ['w','f']){
   const result=F.evaluateProposal(st.planningEvidence,st,side,t.objective,card.action,offer.sequence);
   const scores=result.assessment?.scores,reply=F.proposalReply(scores,side===t.by?'requester':'partner');
   if(!result.eligible||!reply)return null;
   by[side]={scores,...reply};
  }
  if(JSON.stringify(by)!==JSON.stringify(offer.by))return null;
  const dialogue=L.freezeSequence(st,offer);
  return dialogue&&JSON.stringify(dialogue)===JSON.stringify(offer.dialogue)?offer:null;
 }
 // An agreed sequence has no live status, promised landing or invented
 // execution evidence. Store only the canonical entry and graph IDs.
 function sequenceCommitmentFrom(offer){
  return {version:1,mode:'conditional',start:{...offer.sequence.start},actions:offer.sequence.actions.slice()};
 }
 function agreedSequence(st,obj){
  const b=st.structureBoard?.[obj.id],t=st.structureTalk,s=t?.sequenceTalk,offer=s?.offer;
  if(st.planningSequenceSigning!==1||!b?.sequence||!s?.selected||t.objective!==obj.id||
     offer?.card?.action!==b.action||offer.card.owner!==b.owner||offer.card.by!==b.by||
     b.source!=='negotiated'||!b.chosen)return null;
  const expected=sequenceCommitmentFrom(offer);
  if(JSON.stringify(expected)!==JSON.stringify(b.sequence))return null;
  // The psychology was assessed before selection; do not rerun it with
  // changed consent. Recheck actual move eligibility and transitions.
  const ev=sequenceEvidence(st,obj.id,b.action,expected);
  if(!ev.eligible||ev.owner!==offer.evidence?.owner||ev.cid!==offer.evidence?.cid||
     ev.bookedResult!==offer.evidence?.bookedResult||
     JSON.stringify(ev.steps)!==JSON.stringify(offer.evidence?.steps))return null;
  return expected;
 }
 function sequenceDescription(st,offer){
  return offer.evidence.steps.map(s=>nameOf(st,s.performer)+': '+name(s.action)).join(' → ');
 }
 function proposalEvidence(st,objective,action){
  const deny=reason=>({v:1,eligible:false,reason});
  if(!st?.structurePlanning||!st.game)return deny('not_structured');
  const obj=structureSlot(st,objective),b=st.structureBoard?.[objective];
  if(!obj||!b?.action||!['w','f'].includes(b.owner))return deny('no_named_call');
  const owner=b.owner,actor=who(st,owner),partner=who(st,other(owner));
  if(typeof action!=='string'||!A[action])return deny('unknown_move');
  if(!A[b.action])return deny('unknown_original');
  const route=st.lockRoute||st.board.finish?.route||null;
  const facts=id=>{
   const n=A[id],card={action:id,owner};
   return {action:id,legal:legal(id,actor,partner),permitted:!banned(st,id),
    compatible:P.DIRECTOR.compatibleCall(obj,id,owner),
    risk:typeof n.risk==='boolean'?n.risk:null,cost:Number.isFinite(n.cost)?n.cost:null,
    crowd:Number.isFinite(n.crowd)?n.crowd:null,requires:n.requires||null,
    after:Number.isFinite(n.after)?n.after:null,agile:typeof n.agile==='boolean'?n.agile:null,
    lift:Number.isFinite(n.lift)?n.lift:null,
    familiar:(actor.learned||[]).includes(id)||(D.PROFILES[actor.id]?.signature||[]).includes(id),
    supportsFinish:supportsFinish(st,route,card)};
  };
  const original=facts(b.action),proposed=facts(action);
  if(!original.legal||!original.permitted||!original.compatible)return deny('original_requires_repair');
  if(!proposed.legal||!proposed.permitted||!proposed.compatible)return deny('prohibited_or_incompatible');
  if(action!==b.action&&![...structureCards(st,obj),...bargainingCards(st,obj,owner)].some(c=>c.owner===owner&&c.action===action))return deny('not_existing_card');
  return {v:1,eligible:true,cid:st.cid,objective:obj.id,intent:obj.intent,owner,
   actorId:actor.id,partnerId:partner.id,bookedResult:st.finish,finishRoute:route,
   window:obj.window.slice(),original,proposed,
   // Neither a signed move nor an authored crowd value is an achieved beat.
   scope:'single_call',sameOwner:true,
   allocation:structureSlots(st).map(slot=>{
    const call=st.structureBoard?.[slot.id],id=call?.action,side=call?.owner,n=id&&A[id];
    const named=!!(n&&['w','f'].includes(side)&&!banned(st,id)&&legal(id,who(st,side),who(st,other(side)))&&P.DIRECTOR.compatibleCall(slot,id,side));
    return {objective:slot.id,owner:named?side:null,action:named?id:null,
     crowd:named&&Number.isFinite(n.crowd)?n.crowd:null,cost:named&&Number.isFinite(n.cost)?n.cost:null};
   })};
 }
 // MP5D: an explicitly proposed, ordered fragment ending at the named call.
 // This is static continuity, NOT a simulation or a promise of execution.
 function sequenceEvidence(st,objective,action,sequence){
  const deny=(reason,index=null)=>({v:1,eligible:false,reason,index});
  const proposal=proposalEvidence(st,objective,action);
  if(!proposal.eligible)return deny(proposal.reason);
  const ids=sequence?.actions,start=sequence?.start,positions=['standing','mat','corner','top','outside'];
  if(!Array.isArray(ids)||ids.length<2||ids.length>6||ids.at(-1)!==action||
     !['w','f'].includes(start?.control)||!positions.includes(start?.position)||
     ![null,'w','f'].includes(start?.down)||start.position==='mat'&&start.down===null)return deny('invalid_sequence');
  let control=start.control,position=start.position,down=start.down;
  const steps=[];
  for(let i=0;i<ids.length;i++){
   const id=ids[i],n=A[id],previous=steps.at(-1);
   if(typeof id!=='string'||!n)return deny('unknown_move',i);
   // Generated blocks/counters answer a pending attempt; never represent
   // them as an action occurring after the parent has already landed.
   if(n.counterOf||n.blockOf)return deny('conditional_attempt_alternative',i);
   if(n.nearfall||n.family==='pin'||['early_cover','cover','near_kickout','counter_rollup','finish_tease','finish_counter'].includes(id))return deny('finish_or_pin_out_of_scope',i);
   if(previous&&!A[previous.action].next.some(([to,weight])=>to===id&&weight>0))return deny('missing_edge',i);
   if(!['any',position].includes(n.requires)||n.requires==='mat'&&down===null)return deny('position_mismatch',i);
   if(n.family==='ground'&&(position!=='mat'||down!==other(control)))return deny('ground_control_mismatch',i);
   if(banned(st,id))return deny('prohibited_move',i);
   if(!legal(id,who(st,control),who(st,other(control))))return deny('physically_ineligible',i);
   if(id==='snap_suplex'&&kg(who(st,other(control)))>kg(who(st,control))+Math.max(-5,((who(st,control).ring||60)-60)*.23)+42)return deny('physically_ineligible',i);
   const performer=n.reverse?other(control):control;
   if(n.reverse&&!legal(id,who(st,performer),who(st,control)))return deny('physically_ineligible',i);
   if(n.after>Math.min(.98,proposal.window[1]+.08))return deny('too_late_for_objective',i);
   const guards=[];
   if(MX.GRAPH.PHYSICAL_GRIP_MOVES[id])guards.push('live_grip');
   if(['superplex','aerial','springboard','dive','outside'].includes(n.family)||['outside','top'].includes(n.requires))guards.push('live_locations');
   const cost=MX.GRAPH.costOf(id);
   if(cost>=2.2)guards.push('live_stamina');
   if(n.after>0)guards.push('live_timing');
   if(n.risk)guards.push('live_hazard');
   const nextControl=performer,nextDown=n.down==='d'?(n.reverse?control:other(control)):n.down==='a'?nextControl:null;
   steps.push({action:id,performer,entry:{control,position,down},exit:{control:nextControl,position:n.zone,down:nextDown},
    cost:Number.isFinite(cost)?cost:null,risk:!!n.risk,guards});
   control=nextControl;position=n.zone;down=nextDown;
  }
  if(steps.at(-1).performer!==proposal.owner)return deny('wrong_final_performer',steps.length-1);
  return {v:1,eligible:true,scope:'conditional_fragment',cid:proposal.cid,objective,action,owner:proposal.owner,
   actorId:proposal.actorId,partnerId:proposal.partnerId,bookedResult:proposal.bookedResult,finishRoute:proposal.finishRoute,
   start:{control:start.control,position:start.position,down:start.down},steps,
   execution:'unverified_live_state'};
 }
 // MP7A: discover bounded conditional fragments in the existing graph.
 // Reverse-search positive edges towards an already eligible named call.
 // No hypothetical transitions, pin/finish threats or attempt alternatives.
 // Return a compact Pareto-like shortlist by length and joint fuzzy merit.
 const sequenceNode=n=>n&&!n.counterOf&&!n.blockOf&&!n.nearfall&&n.family!=='pin'&&
  !['early_cover','cover','near_kickout','counter_rollup','finish_tease','finish_counter'].includes(n.id);
 let sequenceIncoming=null;
 function sequencePredecessors(id){
  if(!sequenceIncoming){
   sequenceIncoming=new Map();
   for(const [from,n] of Object.entries(A)){
    if(!sequenceNode(n))continue;
    for(const [to,weight] of n.next||[]){
     if(weight<=0||!sequenceNode(A[to]))continue;
     if(!sequenceIncoming.has(to))sequenceIncoming.set(to,new Set());
     sequenceIncoming.get(to).add(from);
    }
   }
  }
  return [...(sequenceIncoming.get(id)||[])].sort((a,b)=>a.localeCompare(b));
 }
 function sequenceCandidates(st,objective,action,{diverse=false}={}){
  const F=root.OfficePlanningFuzzy,p=proposalEvidence(st,objective,action);
  const empty=reason=>({v:1,eligible:false,reason,candidates:[],search:{tested:0,valid:0,expanded:0,truncated:false}});
  if(!p.eligible)return empty(p.reason);
  if(!sequenceNode(A[action]))return empty('finish_or_attempt_alternative');
  if(!F||!st.planningEvidence)return empty('no_planning_profile');
  const profiles={w:F.behaviour(st.planningEvidence,st,'w'),f:F.behaviour(st.planningEvidence,st,'f')};
  if(!profiles.w||!profiles.f)return empty('no_planning_profile');
  const search={tested:0,valid:0,expanded:0,truncated:false},candidates=[];
  // Fixed work limits independent of input/save data. Lengths 2–4 only
  // for discovery; the shared validator still supports authored 2–6.
  const beam=24,maxExpanded=240,maxTested=192;
  const zones=['standing','mat','corner','top','outside'];
  const allowed=id=>sequenceNode(A[id])&&!banned(st,id)&&Number.isFinite(A[id].after)&&A[id].after<=Math.min(.98,p.window[1]+.08);
  const prefilter=(from,to)=>allowed(from)&&zones.includes(A[from].zone)&&['any',A[from].zone].includes(A[to].requires);
  const rankPath=ids=>ids.reduce((n,id)=>n+(Number.isFinite(MX.GRAPH.costOf(id))?Math.max(0,MX.GRAPH.costOf(id)):20)+(A[id].risk?4:0),0);
  const pathKey=ids=>ids.join('|');
  const utility=s=>s.acceptance-.5*s.reservations-.5*s.counterproposal;
  let frontier=[[action]];
  for(let length=2;length<=4&&frontier.length;length++){
   const next=[];
   // Round-robin predecessors prevents a single prolific last node
   // consuming the whole search. Deduplicate exact chains.
   const parents=frontier.map(ids=>({ids,pred:sequencePredecessors(ids[0]).filter(id=>!ids.includes(id)&&prefilter(id,ids[0]))}));
   const seen=new Set();
   for(let i=0;parents.some(row=>i<row.pred.length);i++){
    for(const row of parents){
     const id=row.pred[i];if(!id)continue;
     if(search.expanded>=maxExpanded){search.truncated=true;break;}
     search.expanded++;
     const ids=[id,...row.ids],key=pathKey(ids);
     if(!seen.has(key)){seen.add(key);next.push(ids);}
    }
    if(search.expanded>=maxExpanded)break;
   }
   next.sort((a,b)=>rankPath(a)-rankPath(b)||pathKey(a).localeCompare(pathKey(b)));
   if(next.length>beam)search.truncated=true;
   frontier=[];
   // Keep a small reserve of real reversal paths; otherwise cost-only
   // pruning removes them before psychology can assess the exchange.
   const reverses=ids=>ids.some(id=>A[id].reverse);
   const leading=diverse?[...next.filter(ids=>!reverses(ids)).slice(0,beam-8),...next.filter(reverses).slice(0,8)]:next.slice(0,beam);
   if(diverse&&leading.length<beam)for(const ids of next){if(leading.length>=beam)break;if(!leading.includes(ids))leading.push(ids);}
   for(const ids of leading){
    // Control reverses only on graph reversal nodes. Work backwards
    // from the required final performer; then validate all transitions.
    const control=ids.reduce((s,id)=>A[id].reverse?other(s):s,p.owner);
    const positions=A[ids[0]].requires==='any'?zones:[A[ids[0]].requires];
    let extend=false;
    for(const position of positions){
     if(!zones.includes(position))continue;
     for(const down of position==='mat'?[other(control),control]:[null]){
      if(search.tested>=maxTested){search.truncated=true;break;}
      const sequence={start:{control,position,down},actions:ids.slice()};
      search.tested++;
      const evidence=sequenceEvidence(st,objective,action,sequence);
      if(!evidence.eligible)continue;
      const difficulty=F.sequenceDifficulty(evidence);
      if(!difficulty)continue;
      const w=F.inferProposal(profiles.w,p,evidence),f=F.inferProposal(profiles.f,p,evidence);
      if(!w||!f)continue;
      extend=true;search.valid++;
      const by={};
      for(const [side,res] of [['w',w],['f',f]]){
       const reply=F.proposalReply(res.scores,side===p.owner?'requester':'partner');
       if(reply)by[side]={scores:res.scores,...reply};
      }
      if(!by.w||!by.f)continue;
      const risks=evidence.steps.filter(s=>s.risk).length;
      const u=utility(w.scores),v=utility(f.scores);
      const merit=.65*(u+v)/2+.35*Math.min(u,v)-difficulty.score*.12-risks*3;
      candidates.push({v:1,sequence,evidence,difficulty,by,merit});
      // One canonical valid entry per path: no near-duplicates differing
      // only in the hypothetical starting position.
      break;
     }
     if(extend||search.tested>=maxTested)break;
    }
    // Keep invalid prefixes in the beam too: adding a preceding action
    // can establish the state that an isolated suffix lacks.
    frontier.push(ids);
    if(search.tested>=maxTested)break;
   }
   if(search.tested>=maxTested||search.expanded>=maxExpanded)break;
  }
  const order=(a,b)=>b.merit-a.merit||a.difficulty.score-b.difficulty.score||pathKey(a.sequence.actions).localeCompare(pathKey(b.sequence.actions));
  // Keep two candidates per length rather than crowding out longer
  // alternatives with easier two-move fragments.
  const shortlist=[2,3,4].flatMap(length=>{
   const ranked=candidates.filter(x=>x.sequence.actions.length===length).sort(order);
   if(!diverse)return ranked.slice(0,2);
   // Same shortlist limit: preserve one genuinely two-performer chain
   // if available rather than two nearly identical cheap setups.
   const exchange=ranked.find(r=>r.difficulty.components.controlChanges>0&&new Set(r.evidence.steps.map(s=>s.performer)).size>1&&r!==ranked[0]);
   return exchange?[ranked[0],exchange]:ranked.slice(0,2);
  }).sort(order);
  return {v:1,eligible:true,scope:'conditional_fragment',objective,action,owner:p.owner,execution:'unverified_live_state',candidates:shortlist,search};
 }
 function structureSeed(st,{refresh=false}={}){
  st.structureBoard??={};
  const route=st.lockRoute||st.board.finish?.route;
  for(const obj of structureSlots(st)){
   const old=st.structureBoard[obj.id];
   if(refresh&&(old?.chosen||old?.open))continue;
   const cards=structureCards(st,obj),index=structureSlots(st).indexOf(obj);
   const preferred=obj.actor==='either'?(index%2?st.structure.roles.other:st.structure.roles.lead):obj.actor;
   const ordered=cards.slice().sort((a,b)=>Number(b.owner===preferred)-Number(a.owner===preferred));
   const used=new Set(Object.values(st.structureBoard).map(b=>b.action).filter(Boolean));
   const distinct=ordered.filter(c=>!used.has(c.action));
   const eligible=distinct.length?distinct:ordered;
   const helpful=eligible.filter(c=>supportsFinish(st,route,c));
   const choice=helpful.find(c=>c.by==='agent')||helpful[0]||eligible.find(c=>c.by==='agent')||eligible[0];
   st.structureBoard[obj.id]=choice?
    {...choice,chosen:false,open:false,source:'suggested'}:
    {owner:obj.actor,action:null,label:'Call this objective in the ring',by:'agent',chosen:false,open:true,source:'open'};
  }
 }
 function structureBoardView(st){
  return structureSlots(st).map(obj=>{
   const cur=st.structureBoard?.[obj.id];
   const cards=structureCards(st,obj).map((c,i)=>({
    id:'objective_'+obj.id+'_'+i,label:c.label,by:c.by,
    who:c.by==='agent'?AGENT:nameOf(st,c.by),risk:!!c.risk,
    selected:!!cur&&cur.action===c.action&&cur.owner===c.owner,
    tags:[...(c.by==='agent'?['Dennis’s suggestion']:['Wrestler’s suggestion']),
     ...(c.risk?['High risk']:[]),...(supportsFinish(st,st.board.finish?.route,c)?['May support the finish']:[])]
   }));
   cards.push({id:'objective_'+obj.id+'_open',label:'Call this objective in the ring',by:'agent',who:AGENT,
    selected:!!cur?.open,risk:false,tags:['No named move commitment']});
   if(cur?.sequence)cards.push({id:'objective_'+obj.id+'_drop_sequence',
    label:'Keep '+cur.label+'; remove the connected setup',by:'agent',who:AGENT,selected:false,risk:false,
    tags:['Remove sequence only']});
   const owned=obj.actor==='either'?'Both wrestlers may contribute':nameOf(st,obj.actor)+' leads';
   return {slot:obj.id,name:obj.title,ask:owned+'. Agree a real move if you want, or leave it open.',
    cards,current:cur?.sequence?(cur.label+' · '+(agreedSequence(st,obj)?cur.sequence.actions.map(name).join(' → '):'setup requires revision')):cur?.label||null,actor:obj.actor,intent:obj.intent,window:obj.window.slice()};
  });
 }
 function structureReconcile(st){
  // Incidental backstage scenes must NOT silently replace viable suggestions.
  // Re-pitch only a genuinely prohibited/impossible move below, or fill
  // genuinely absent entries (old/partial room saves).
  if(!st.structureBoard||structureSlots(st).some(o=>!st.structureBoard[o.id]))
   structureSeed(st,{refresh:true});
  for(const obj of structureSlots(st)){
   const b=st.structureBoard[obj.id];
   if(!b?.action)continue;
   if(!banned(st,b.action)&&legal(b.action,who(st,b.owner),who(st,other(b.owner)))){
    if(b.conflict)delete b.conflict;
    continue;
   }
   if(b.chosen){
    b.conflict='This explicitly selected spot is now prohibited or impossible. Revise or leave the objective open.';
    log(st,'agent','The '+b.label+' is no longer safe or available for '+obj.title+'. I have kept your choice marked for review, rather than silently deleting it.');
   }else{
    const alt=structureCards(st,obj).find(c=>c.action!==b.action);
    st.structureBoard[obj.id]=alt?{...alt,chosen:false,open:false,source:'revised'}:
     {owner:obj.actor,action:null,label:'Call this objective in the ring',by:'agent',open:true,chosen:false,source:'open'};
    log(st,'agent','The proposed '+b.label+' is ruled out. I’ve revised the suggestion for '+obj.title+'.');
   }
   st.reworked=(st.reworked||0)+1;
  }
 }
 function structureWarnings(st){
  return structureSlots(st).filter(obj=>{
   const b=st.structureBoard?.[obj.id];
   return !!b?.sequence&&!agreedSequence(st,obj)||b?.action&&(b.conflict||banned(st,b.action)||
    !legal(b.action,who(st,b.owner),who(st,other(b.owner))));
  }).map(obj=>obj.title);
 }
 function structureStory(st){
  const b=st.structureBoard||{},items=structureSlots(st),named=items.filter(x=>b[x.id]?.action);
  const trouble=structureWarnings(st),notes=[],route=st.lockRoute||st.board.finish?.route;
  if(named.length>=2)notes.push({good:true,text:named.length+' real moves are pencilled into this '+st.structure.id.replace(/_/g,' ')+' layout.'});
  else notes.push({good:true,text:'Most of the dramatic objectives remain open. The wrestlers will call the details in the ring.'});
  if(route){
   const support=named.filter(o=>supportsFinish(st,route,b[o.id]));
   notes.push({good:true,text:support.length?
    support.length+' called '+(support.length===1?'spot may':'spots may')+' help set up the agreed finish. That still must be earned in the ring.':
    'The agreed finish has no guaranteed setup in this layout. Physical conditions still decide whether it is available.'});
  }
  if(items.some(o=>o.intent==='callback'))notes.push({good:true,text:'A tactical callback is an intention only: the earlier exchange must actually happen before the Director may credit it.'});
  if(st.game)notes.push({good:true,text:structureRead(st).advice});
  const discussion=structureReview(st)?.discussion;
  if(discussion)notes.push({good:true,text:discussion});
  if(trouble.length)notes.push({good:false,text:'Revise unsafe or prohibited commitments: '+trouble.join(', ')+'.'});
  return {score:trouble.length?-1:Math.min(2,named.length>=2?2:1),notes};
 }
 function structureCallMood(b){
  const delta={w:0,f:0};
  if(!b?.action||b.by==='agent')return delta;
  if(b.by===b.owner)delta[b.owner]+=2;
  else if(b.by==='w'||b.by==='f'){delta[b.by]+=2;delta[b.owner]-=2;}
  return delta;
 }
 function structureSettle(st){
  const prev=st.boardMood||{w:0,f:0},delta={w:0,f:0};
  st.mood.w-=prev.w;st.mood.f-=prev.f;
  for(const obj of structureSlots(st)){
   const contribution=structureCallMood(st.structureBoard?.[obj.id]);
   delta.w+=contribution.w;delta.f+=contribution.f;
  }
  st.mood.w+=delta.w;st.mood.f+=delta.f;st.boardMood=delta;
 }
 function structurePlan(st){
  const selected=structureSlots(st).map(obj=>{
   const b=st.structureBoard?.[obj.id]||null,action=b?.action||null;
   if(action&&(banned(st,action)||!legal(action,who(st,b.owner),who(st,other(b.owner)))))
    throw Error('Unsafe structure spot must be revised: '+obj.id);
   const sequence=b?.sequence?agreedSequence(st,obj):null;
   if(b?.sequence&&!sequence)throw Error('Unsafe or changed sequence must be revised: '+obj.id);
   return {id:obj.id,intent:obj.intent,title:obj.title,actor:obj.actor,
    ...(sequence?{sequence}:{}),
    window:obj.window.slice(),requires:obj.requires.slice(),
    commitment:action?'landmark':'guide',
    call:action?{action,owner:b.owner,proposedBy:b.by,label:b.label,source:b.source||'suggested',
     chosen:!!b.chosen,backups:structureCards(st,obj).filter(c=>c.owner===b.owner&&c.action!==action).slice(0,2).map(c=>c.action)}:null};
  });
  return {version:selected.some(o=>o.sequence)?2:1,structureId:st.structure.id,roles:{...st.structure.roles},
   finishRoute:st.lockRoute||st.board.finish?.route||null,
   objectives:selected,objections:(st.structureObjections||[]).map(n=>({...n}))};
 }
 // Signed move nodes remain finish-only for this disabled runtime path: no
 // phantom American shine/heat/comeback and no unearned structure penalties.
 function structureNodes(st,base){
  const f=base.nodes.find(n=>n.id==='finish');
  if(!f)throw Error('No agreed finish node');
  f.route=st.lockRoute||st.board.finish?.route||null;f.requires=[];
  base.nodes=[f];
  return base;
 }
 const winSideOf=st=>st.finish.startsWith('win')?'w':'f';
 const slotOwner=(S,c)=>S.id==='payoff'?c.owner:S.owner;
 const cardsFor=(st,slot)=>pitches(st,slot).filter(c=>c.action);
 // Anything ruled out tonight: the ring, the promoter's note (if promised) or "nothing risky".
 function banned(st,id){
  const n=A[id];if(!n||id==='scheduled_nearfall')return false;
  const L=st.limits;if(L.banIds.includes(id)||(n.family&&L.ban.includes(n.family)))return true;
  const N=st.note&&st.note.honour&&!st.note.waived?st.note:null;
  if(N&&((N.banIds||[]).includes(id)||(n.family&&(N.ban||[]).includes(n.family))))return true;
  return st.spice<0&&!!n.risk;
 }
 // Read the called spots against the signed method, using actual graph metadata.
 // A compatible spot can help the build but cannot guarantee the physical condition.
 function supportsFinish(st,route,c){
  const n=c?.action&&A[c.action];
  if(!n||c.impossible||banned(st,c.action))return false;
  if(route==='limb_finish')return c.owner==='w'&&n.focus>0&&!n.reverse;
  if(route==='submission_defeat'||route==='injury_gives')return c.owner==='f'&&n.focus>0&&!n.reverse;
  if(route==='reversal_finisher')return c.owner==='w'&&!!n.reverse;
  if(route==='finisher_reversed')return c.owner==='f'&&!!n.reverse;
  if(route==='top_rope')return c.owner==='w'&&(n.requires==='top'||['aerial','springboard'].includes(n.family));
  if(route==='strike_knockout')return c.owner==='w'&&n.family==='strike';
  return false;
 }
 function finishPlan(st){
  const route=st.lockRoute||st.board.finish?.route;
  if(!route)return null;
  const requirement=ROUTE_CONDITION[route]||null;
  const slots=st.structurePlanning?structureSlots(st).map(o=>({id:o.id,name:o.title})):SPINE;
  const chosen=st.structurePlanning?st.structureBoard||{}:st.board;
  const supported=slots.filter(S=>supportsFinish(st,route,chosen[S.id])).map(S=>S.name.toLowerCase());
  const available=!ROUTE_STATIC[route]||ROUTE_STATIC[route](st.w,st.f,st);
  const impossible=slots.filter(S=>chosen[S.id]?.action&&(chosen[S.id].impossible||banned(st,chosen[S.id].action))).map(S=>S.name.toLowerCase());
  let summary=requirement?(supported.length?
   supported.join(' and ')+' could help set it up, but the required in-ring events must still happen.':
   'No selected called spot specifically prepares this condition; it must still be earned in the match.'):
   'No extra physical threshold. The wrestlers still have to execute the agreed moves.';
  if(route==='outlasted'){
   const minutes=Math.max(5,st.minutes+(st.fx.minutes||0));
   summary=minutes<10?
    'Very unlikely in a short match: the loser often has not become exhausted by the bell. A real 15-point stamina gap is still required.':
    minutes<15?
    'Risky: the eventual winner must take legal recovery opportunities and the loser must be genuinely exhausted. Neither is guaranteed.':
    'Long matches make exhaustion more likely, but often tire BOTH wrestlers. Real breathers and costly exchanges must create a 15-point advantage.';
  }
  if(route==='exhausted_cover')summary='Your wrestler must actually become exhausted; the written running order cannot guarantee it.';
  if(impossible.length)summary+=' Warning: '+impossible.join(' and ')+' contains an impossible or prohibited spot.';
  if(!available)summary='This method is no longer eligible for the wrestlers or feud. '+summary;
  return {route,label:ROUTE_NAME[route]||route,requirement,summary,supported,available,blocked:impossible.length,
   kind:!available||impossible.length?'warning':requirement?'conditional':'direct'};
 }
 function seedBoard(st,{refresh=false}={}){
  // The finish is picked BEFORE called spots. Dennis may revise only his own
  // pencil marks when it changes; an explicitly chosen spot is never discarded.
  if(!st.board.finish?.route){
   const c=finishCards(st).find(c=>c.by==='agent')||finishCards(st)[0];
   if(c)st.board.finish={by:c.by,owner:'either',route:c.route,label:c.label};
  }
  if(st.structurePlanning){structureSeed(st,{refresh});return;}
  const route=st.board.finish?.route,win=winSideOf(st);
  for(const S of SPINE){
   if(refresh&&st.board[S.id]?.chosen)continue;
   const cards=cardsFor(st,S.id).filter(c=>!c.impossible&&!banned(st,c.action));
   const set=cards.filter(c=>supportsFinish(st,route,c));
   const original=S.id==='payoff'?(cards.find(k=>k.by===win&&!k.risk)||cards.find(k=>k.by==='agent')):(cards.find(k=>k.by==='agent')||cards[0]);
   const c=set.find(x=>x.by==='agent')||set[0]||original;
   if(c)st.board[S.id]={by:'agent',owner:c.owner,action:c.action,label:c.label,impossible:false,chosen:false};
  }
 }
 function slotTags(st,S,c){
  const t=[],owner=slotOwner(S,c);
  if(c.by==='agent')t.push(c.action==='scheduled_nearfall'?'Safer':'Middle of the road');
  else if(c.by===owner)t.push(nameOf(st,owner)+' ▲');
  else t.push(nameOf(st,c.by)+' ▲',nameOf(st,owner)+' ▼');
  if(S.id==='payoff'&&owner!=='either'&&owner!==winSideOf(st)&&['win_clean','lose_clean'].includes(st.finish))t.push('Then loses clean');
  if(c.risk)t.push('High risk');
  if(c.impossible)t.push('Will not work');
  if(supportsFinish(st,st.board.finish?.route,c))t.push('Helps finish setup');
  if(owner!=='either'&&(who(st,owner)?.learned||[]).includes(c.action))t.push('Learned in training');
  return t;
 }
 function boardView(st){
  if(st.structurePlanning)return structureBoardView(st);
  return SPINE.map(S=>{
   const cur=st.board[S.id];
   const cards=cardsFor(st,S.id).map((c,i)=>({id:'slot_'+S.id+'_'+i,label:c.label,by:c.by,who:c.by==='agent'?AGENT:nameOf(st,c.by),
    selected:!!cur&&cur.action===c.action,risk:!!c.risk,impossible:!!c.impossible,tags:slotTags(st,S,c)}));
   return {slot:S.id,name:S.name,ask:fmt(st,S.ask.replace(/\{O\}/g,S.owner==='f'?'{F}':'{W}')),cards,current:cur?.label||null};
  });
 }
 // Some decisions wreck a beat that was already agreed. Dennis swaps in the nearest thing that still works.
 function reconcile(st){
  if(st.structurePlanning){
   structureReconcile(st);
   // Scene decisions may replace or remove a pencilled move. Adjust its
   // provisional performer-consent effect NOW, not a second time on review.
   structureSettle(st);
   return;
  }
  for(const S of SPINE){
   const b=st.board[S.id];if(!b||!banned(st,b.action))continue;
   const alt=cardsFor(st,S.id).find(c=>c.action!==b.action&&!c.impossible&&!banned(st,c.action)&&(S.id==='payoff'||c.owner===b.owner));
   if(alt){
    st.board[S.id]={by:'agent',owner:alt.owner,action:alt.action,label:alt.label};
    log(st,'agent','That rules out the '+b.label+'. '+(alt.action==='scheduled_nearfall'?'The big spot becomes a run of near falls.':nameOf(st,alt.owner)+' does the '+alt.label+' instead.'));
   }else{delete st.board[S.id];log(st,'agent','That rules out the '+b.label+', and there’s nothing sensible to put in its place. '+S.name+' will be called in the ring.');}
   st.reworked=(st.reworked||0)+1;
  }
 }
 // Does the running order tell a story the booked finish can pay off?
 function story(st){
  if(st.structurePlanning)return structureStory(st);
  const b=st.board,win=winSideOf(st),notes=[],has=k=>!!b[k]?.action;let score=0;
  if(has('pressure')&&has('reversal')){score++;notes.push({good:true,text:'Heat, then the comeback. In that order. Lovely.'});}
  else if(has('reversal')){score--;notes.push({good:false,text:'A comeback from what? Nobody’s been beaten up yet.'});}
  else if(has('pressure')&&win==='w'){score--;notes.push({good:false,text:st.w.short+' wins without ever fighting back from the heat. It’ll look like a fluke.'});}
  const p=b.payoff;
  if(p?.action&&p.owner!=='either'){
   if(p.impossible){score--;notes.push({good:false,text:'The '+p.label+' won’t work. I’d like that minuted.'});}
   else if(p.owner===win){score++;notes.push({good:true,text:nameOf(st,p.owner)+' hits the '+p.label+' and wins. The big spot sells the finish.'});}
   else if(st.finish==='lose_protected'){score++;notes.push({good:true,text:st.w.short+' hits the '+p.label+' and still loses. They’ll go home thinking it could have gone either way.'});}
   else if(['win_clean','lose_clean'].includes(st.finish)){score--;notes.push({good:false,text:nameOf(st,p.owner)+' hits the '+p.label+', then loses clean. The crowd will feel short-changed.'});}
  }
  return {score:clamp(score,-2,2),notes};
 }
 function verdict(st){
  const v=story(st),bad=v.notes.find(n=>!n.good),good=v.notes.find(n=>n.good);
  return bad?bad.text:good?good.text:'It’s a match. I’ve seen worse. I’ve booked worse.';
 }
 function settleBoard(st){
  if(st.structurePlanning){structureSettle(st);return;}
  // A second review must replace the old mood effect, not award it twice.
  const prior=st.boardMood||{w:0,f:0};
  st.mood.w-=prior.w;st.mood.f-=prior.f;
  const delta={w:0,f:0};
  for(const S of SPINE){
   const b=st.board[S.id];if(!b||b.by==='agent')continue;
   const owner=S.id==='payoff'?b.owner:S.owner;
   if(b.by===owner)delta[owner]+=2;
   else{delta[b.by]+=2;delta[owner]-=2;}
  }
  const p=st.board.payoff;
  if(p&&p.owner!=='either'){
   const o=other(p.owner),O=who(st,o);
   if(O.ego>=68&&O.pro<88)delta[o]-=3;
  }
  st.mood.w+=delta.w;st.mood.f+=delta.f;st.boardMood=delta;
 }
 const PLAN_HINT={story:'Slow build, big finish.',spots:'Big moves, big pops, big risk.',technical:'Ringcraft first. Purists love it.',brawl:'Loud, messy, tiring.',safe:'Low risk, low ceiling.'};
 function context(st,p){
  const winnerSide=st.finish.startsWith('win')?'w':'f',loserSide=other(winnerSide);
  return {st,p:p||{},heat:st.heat,loser:who(st,loserSide),winner:who(st,winnerSide)};
 }
 function draw(st,p,recent){
  // A seeded, weighted draw without replacement, skipping what this career has seen lately.
  const x=context(st,p),want=['feature','main'].includes(st.slot)?3:2;
  let poolS=SITUATIONS.filter(s=>{if(s.followup||(st.structurePlanning&&STRUCTURE_INCOMPATIBLE.has(s.id)))return false;try{return s.when(x)}catch(e){return false}});
  const fresh=poolS.filter(s=>!recent.includes(s.id));if(fresh.length>=want)poolS=fresh;
  const out=[];let flavour=0;
  for(let n=0;n<want&&poolS.length;n++){
   let cand=n===0&&poolS.some(q=>q.kind==='match')?poolS.filter(q=>q.kind==='match'):flavour>=1?poolS.filter(q=>q.kind!=='flavour'):poolS;
   if(!cand.length)cand=poolS;
   const total=cand.reduce((t,q)=>t+q.weight,0);let r=rng(st.seed,'draw'+n)*total,k=0;
   for(;k<cand.length-1;k++){r-=cand[k].weight;if(r<0)break;}
   const chosen=cand[k];if(chosen.kind==='flavour')flavour++;
   out.push(chosen.id);poolS=poolS.filter(q=>q!==chosen);
  }
  return out;
 }
 function begin(c,w,f,p,opts={}){
  const seed=String(c.id)+'|room|'+w.id+'|'+f.id+'|'+(c.eventAbs||0);
  const lite=x=>({id:x.id,name:x.name,short:x.short,style:x.style,tier:x.tier||null,ring:x.ring||60,psych:x.psych||50,safe:x.safe||65,pro:x.pro||60,ego:x.ego||50,mic:x.mic||50,heat:x.heat||40,fatigue:x.fatigue||0,injury:x.injury||0,finisher:x.finisher,learned:(x.learned||[]).slice()});
  const pid=p?.id&&NOTES[p.id]?p.id:'dock';
  const st={v:3,cid:c.id,seed,game:null,finish:c.finish,slot:c.slot,minutes:c.minutes||10,heat:Math.max(c.feudHeat||0,opts.heat||0),
   w:lite(w),f:lite(f),promoter:{id:pid,name:p?.name||'the promoter',voice:p?.voice||'The promoter',likes:p?.likes||null,tv:!!p?.tv},
   stage:'plan',at:0,queue:[],mood:{w:0,f:0},consent:{w:70,f:70},board:{},note:null,limits:{ban:[],banIds:[]},fx:{},flags:{},entrance:[],
   spice:0,leash:null,talk:null,stunt:null,lockRoute:null,skipPromo:false,repStake:0,decided:[],log:[],said:{},base:null,contract:{...c},rehearsed:!!opts.rehearsed};
  // Metadata-only opt-in for Phase 1; live meetings never select this yet.
  // Old in-progress meetings have no structure property.
  if(opts.structure!==undefined)st.structure=P.STRUCTURES.create(opts.structure);
  if(opts.structurePlanning===true){
   if(!st.structure)throw Error('Structure planning requires a valid structure selection');
   st.structurePlanning=true;
   if(opts.planningCareer&&root.OfficePlanningFuzzy)st.planningEvidence=root.OfficePlanningFuzzy.capture(st,w,f,opts.planningCareer);
   if(st.planningEvidence&&opts.planningInitiative===true)st.planningInitiative=1;
   if(st.planningInitiative===1&&opts.planningProposal===true)st.planningProposal=1;
   if(st.planningProposal===1&&opts.planningDialogue===true&&root.OfficePlanningDialogue){
    const L=root.OfficePlanningDialogue,banks=Array.isArray(opts.planningBanks)?opts.planningBanks:[];
    const identities={w:L.capture(w,banks,2),f:L.capture(f,banks,2)};
    if(identities.w&&identities.f){st.planningDialogue={v:1,composer:2,identities};if(opts.planningBargaining===true){st.planningBargaining=1;if(opts.planningSequences===true){st.planningSequences=1;if(opts.planningSequencePolicy===2)st.planningSequencePolicy=2;if(opts.planningSequenceSigning===true)st.planningSequenceSigning=1;}}}
   }
  }
  st.loserSide=st.finish.startsWith('win')?'f':'w';
  st.queue=draw(st,p,opts.recent||[]);
  // The oldest thread due with this wrestler, opponent or promoter comes up first.
  const due=(opts.threads||[]).find(t=>{const x=SITUATIONS.find(q=>q.id===t.sit);return x&&!(st.structurePlanning&&STRUCTURE_INCOMPATIBLE.has(t.sit))&&(t.sid?t.sid===w.id||(!x.ownWrestler&&t.sid===f.id):true)&&(t.pid?t.pid===p?.id:true);});
  if(due){st.thread={...due,side:due.sid===f.id&&due.sid!==w.id?'f':'w'};st.queue=[due.sit,...st.queue.filter(id=>id!==due.sit)].slice(0,st.queue.length);}
  // v0.3.12 If the rivalry or the wrestlers' condition gives somebody a reason to ask for a change, that
  // conversation happens straight after the running order is agreed (and is skipped if the board
  // already avoids the problem).
  if(st.structurePlanning)st.queue=['structure_objection','structure_huddle',...st.queue.filter(id=>!['structure_objection','structure_huddle'].includes(id))];
  else if(negotiable(st))st.queue=['rival_counter',...st.queue.filter(id=>id!=='rival_counter')];
  const fin={win_clean:w.short+' wins clean',win_dirty:w.short+' wins dirty',lose_protected:w.short+' loses, but protected',lose_clean:w.short+' loses clean',win_dq:w.short+' wins by disqualification',lose_dq:w.short+' gets disqualified'}[c.finish];
  log(st,'agent',pick(['Evening. Doors in ten, so let’s not make a meal of it.','Right. I’ve a flask going cold, so shall we?','The urn’s on. Let’s get this agreed before the raffle starts.'],seed,'hello'));
  log(st,'agent','Contract says '+fin+'. That part isn’t up for discussion. So, what sort of match are we having?');
  const last=scout(st).lastTalk;
  if(last&&last.original&&last.final)log(st,'agent','Last time these two worked, '+(last.by==='w'?w.short:f.short)+' asked to change '+SLOT_NAME(last.slot)+': the '+last.original+(last.final!==last.original?' became the '+last.final:' stayed')+'. '+
   (last.delivered==='achieved'?'It came off.':last.delivered==='adapted'?'They had to adapt it in the ring.':last.delivered==='missed'?'It never happened.':'')+'');
  return st;
 }
 const current=st=>st.stage==='scene'?SITUATIONS.find(s=>s.id===st.queue[st.at]):null;
 function finishCards(st){
  return pitches(st,'finish').map(c=>{
   const r=c.route,hate=[];
   if(st.finish==='lose_clean'&&r==='submission_defeat'&&st.w.ego>=65)hate.push('w');
   if(st.finish==='lose_protected'&&r==='injury_gives'&&st.w.ego>=72)hate.push('w');
   if(st.finish==='win_clean'&&['strike_knockout','outlasted'].includes(r)&&st.f.ego>=66)hate.push('f');
   if(st.finish==='win_dirty'&&['eye_poke','referee_bump'].includes(r)&&st.w.pro>=85)hate.push('w');
   return {...c,hate};
  });
 }
 function options(st){
  if(st.stage==='plan')return Object.entries(D.PLANS).map(([id,pl])=>{
   const best=D.STYLE_PLAN?.[st.w.style],foeBest=D.STYLE_PLAN?.[st.f.style],tags=[];
   if(id===st.promoter.likes)tags.push(st.promoter.name+' crowd ▲');
   if(id===best)tags.push(st.w.short+'’s style');if(id===foeBest)tags.push(st.f.short+'’s style');
   if(id==='spots')tags.push('More risk');if(id==='safe')tags.push('Safer');
   const reading=st.structurePlanning?structureRead(st,id):null;
   if(reading&&reading.fit!=='Alternative approach')tags.push(reading.fit);
   return {id:'plan_'+id,label:pl.name,hint:(PLAN_HINT[id]||pl.blurb||'')+(reading?' '+reading.advice:''),tags};});
  if(st.stage==='board'){
   const out=st.lockRoute?[]:finishCards(st).map((c,i)=>({id:'route_'+i,label:c.label,
    hint:(ROUTE_CONDITION[c.route]||'No extra in-ring prerequisite.')+' The booked result does not change.',
    tags:[...(ROUTE_CONDITION[c.route]?['Conditional finish']:[]),...c.hate.map(side=>nameOf(st,side)+' objects')],
    route:c.route,selected:st.board.finish?.route===c.route}));
   for(const r of boardView(st))for(const c of r.cards)out.push({id:c.id,label:c.label,hint:r.name+': '+c.who+'’s idea.',tags:c.tags,slot:r.slot,selected:c.selected});
   out.push({id:'board_ok',label:'Agree the running order',hint:'Then deal with whatever comes up.',tags:[]});
   return out;
  }
  if(st.stage==='scene'){const s=current(st);return s.options(st).map(o=>({id:o.id,label:fmt(st,o.label),hint:fmt(st,o.hint||''),tags:(o.tags||tagsOf(st,o.fx||{})).map(t=>fmt(st,t))}));}
  if(st.stage==='review'&&st.structurePlanning&&structureWarnings(st).length)return [
   {id:'review_edit',label:'Resolve unsafe called spots',hint:st.planningSequenceSigning===1?'A named move or connected setup is no longer valid. Revise it, remove just the setup, or leave the objective open.':'A manually selected move became prohibited or impossible. Choose another move or leave the objective open.',tags:['Revision required']}];
  if(st.stage==='review')return [
   {id:'review_ok',label:st.structurePlanning?'Sign this structure and finish':'Approve this layout',hint:'Keep the contracted result and move to the last word before the bell.',tags:[]},
   {id:'review_edit',label:st.structurePlanning?'Revise the objectives':'Revise the called spots',hint:st.lockRoute?
    'Change the running order. The finish negotiated backstage is locked.':
    'Change the finish or called spots without replaying backstage incidents.',tags:[]}
  ];
  if(st.stage==='finish')return finishCards(st).map((c,i)=>{
   const condition=ROUTE_CONDITION[c.route];
   const pitch=c.by==='agent'?AGENT+'’s suggestion.':who(st,c.by).short+'’s idea.';
   return {id:'route_'+i,label:c.label,
    hint:pitch+(condition?' '+condition+' If it is not earned in the match, the road agent calls an audible.':''),
    tags:[...c.hate.map(s=>who(st,s).short+' ▼'),...(condition?['Conditional method']:[]),'Fixes the result']};
  });
  if(st.stage==='curtain')return Object.entries(D.TALKS).map(([id,t])=>({id:'talk_'+id,label:t.name,hint:t.blurb||'',tags:id==='money'?[st.w.short+' ▼','They will listen']:id==='fire'?['More risk','Crowd ▲']:id==='calm'?['Safer']:[]}));
  return [];
 }
 function enter(st){
  // Move to whatever comes next, and let the people in the room say their piece.
  while(st.stage==='scene'&&st.at<st.queue.length){
   if(st.structurePlanning&&STRUCTURE_INCOMPATIBLE.has(st.queue[st.at])){st.queue.splice(st.at,1);continue;}
   if(current(st).open(st)!==false)return;st.queue.splice(st.at,1);
  }
  if(st.stage==='scene'){st.stage=st.lockRoute||st.board.finish?.route?'review':'finish';}
  if(st.stage==='review'){
   log(st,'agent',st.structurePlanning?'The discussion is settled. Check the promoter’s booked result, finishing route and the dramatic objectives separately.':'The room is settled. One last look at what we agreed, and what the finish still needs.');
   return;
  }
  if(st.stage==='finish'){
   log(st,'agent','The finish. The result is in the contract. How do we get there?');
   for(const c of finishCards(st))if(c.by!=='agent')log(st,c.by,from(st,'finish-pitch',['I’d go “{r}”.','How about “{r}”? I’ve thought about this.','“{r}”. Obviously.','For the finish: “{r}”. It’ll look great.']).replace('{r}',c.label.toLowerCase()));
   return;
  }
  if(st.stage==='curtain'){
   settleFinish(st);
   if(st.reworked)log(st,'agent','The running order’s had a few rubbings-out. '+verdict(st));
   log(st,'agent',(st.structurePlanning?'The dramatic structure is agreed; the promoter’s booked result still stands. ':'That’s the match layout. ')+st.w.short+' is '+word(consent(st,'w'))+'. '+st.f.short+' is '+word(consent(st,'f'))+'. Last word before '+st.w.short+' goes through the curtain?');
  }
 }
 function settleFinish(st){
  if(st.finishSettled)return;
  const route=st.lockRoute||st.board.finish?.route;
  if(!route)return;
  const c=finishCards(st).find(x=>x.route===route);
  if(c){
   for(const side of c.hate){st.mood[side]-=6;log(st,side,say(st,'proud',who(st,side),'finish'),'objection');}
   if(!c.hate.length&&c.by!=='agent')log(st,c.by,say(st,'pleased',who(st,c.by),'finish'));
  }
  st.finishSettled=true;
 }
 function act(st,id){
  if(!st||st.stage==='done')throw Error('The meeting is over');
  const o=options(st).find(x=>x.id===id);
  if(!o)throw Error('Not an option backstage: '+id);
  if(st.stage==='board'){
   if(id.startsWith('route_')){
    const c=finishCards(st)[+id.slice(6)];
    if(!c)throw Error('Unknown finish pitch: '+id);
    if(st.board.finish?.route===c.route)return st;
    st.board.finish={by:c.by,owner:'either',route:c.route,label:c.label};
    seedBoard(st,{refresh:true});
    log(st,'you','“The finish: '+c.label.toLowerCase()+'.”');
    log(st,'agent','Right. I’ve adjusted my pencil marks for that finish. Any spot you chose yourself stays put.');
    st.decided.push({stage:'board',situation:'finish',id,label:c.label,tags:o.tags});
    return st;
   }
   if(id==='board_ok'){
    if(st.structurePlanning&&structureWarnings(st).length)throw Error('Resolve prohibited structure commitments before signing');
    log(st,'you','“That’ll do.”');st.decided.push({stage:'board',situation:'board',id,label:o.label,tags:[]});
    settleBoard(st);
    if(st.reviewing){
     st.reviewing=false;st.stage='review';enter(st);return st;
    }
    log(st,'agent',st.structurePlanning?verdict(st)+' Both wrestlers will now discuss the structure before it becomes a signed agreement.':verdict(st)+' Right. Now for the things that always come up.');
    st.stage='scene';st.at=0;enter(st);return st;
   }
   if(st.structurePlanning&&id.startsWith('objective_')){
    const match=id.match(/^objective_([a-z][a-z0-9_]+)_(\d+|open|drop_sequence)$/);
    if(!match)throw Error('Invalid objective choice '+id);
    const obj=structureSlot(st,match[1]);if(!obj)throw Error('Unknown structure objective '+id);
    if(match[2]==='drop_sequence'){
     const b=st.structureBoard?.[obj.id];
     if(!b?.sequence)throw Error('No setup to remove');
     delete b.sequence;
     if(st.structureTalk?.objective===obj.id&&st.structureTalk.sequenceTalk)st.structureTalk.sequenceTalk.selected=false;
     log(st,'you','“Keep the '+b.label+', but call the setup in the ring.”');
     log(st,'agent','The connected setup is removed. The named move remains on the sheet.');
     st.decided.push({stage:'board',situation:obj.id,id,label:o.label,tags:o.tags});
     return st;
    }
    const choice=match[2]==='open'?null:structureCards(st,obj)[+match[2]];
    if(match[2]!=='open'&&!choice)throw Error('Unavailable structure move '+id);
    const next=choice?{...choice,chosen:true,open:false,source:'manual'}:
     {owner:obj.actor,action:null,label:'Call this objective in the ring',by:'agent',chosen:true,open:true,source:'open'};
    if(st.structureBoard?.[obj.id]?.sequence){
     if(st.structureTalk?.objective===obj.id&&st.structureTalk.sequenceTalk)st.structureTalk.sequenceTalk.selected=false;
     log(st,'agent','Changing that call removes the previously agreed connected setup.');
    }
    st.structureBoard??={};st.structureBoard[obj.id]=next;
    log(st,'you','“'+obj.title+': '+(choice?'the '+choice.label:'call it in the ring')+'.”');
    st.decided.push({stage:'board',situation:obj.id,id,label:choice?.label||'Call in the ring',tags:o.tags});
    if(choice&&choice.by!=='agent')log(st,choice.by,say(st,'pleased',who(st,choice.by),'board'));
    else log(st,'agent','Noted. The objective is distinct from a guaranteed landed move.');
    return st;
   }
   const m=id.match(/^slot_(\w+)_(\d+)$/),S=SPINE.find(x=>x.id===m[1]),c=cardsFor(st,S.id)[+m[2]];
   if(st.board[S.id]?.action===c.action)return st;
   log(st,'you','“'+S.name+': the '+c.label+'.”');
   st.decided.push({stage:'board',situation:S.id,id,label:c.label,tags:o.tags});
   st.board[S.id]={by:c.by,owner:c.owner,action:c.action,label:c.label,impossible:!!c.impossible,chosen:true};
   if(c.impossible)log(st,'agent','I’ll write it down. I’ll also write down that it won’t work.');
   else if(c.by!=='agent')log(st,c.by,say(st,'pleased',who(st,c.by),'board'));
   else log(st,'agent',from(st,'board-agent',['Sensible.','My pick. Obviously the right one.','Good. Nobody gets hurt.']));
   return st;
  }
  log(st,'you',/^[“"]/.test(o.label)?o.label:'“'+o.label+'.”');
  st.decided.push({stage:st.stage,situation:st.stage==='scene'?st.queue[st.at]:st.stage,id,label:o.label,tags:o.tags});
  if(st.stage==='plan'){
   st.game=id.slice(5);
   st.base=P.build(st.contract,st.w,st.f,st.game,'landmarks',null,'authentic');
   st.consent={w:st.base.workerConsent,f:st.base.opponentConsent};
   if(st.rehearsed){st.consent.w+=6;log(st,'agent',pick([st.w.short+' and I went through it this week. Twice. I’ve still got the bruise.',st.w.short+' rehearsed with me on Tuesday. Knows the running order backwards. Possibly literally.'],st.seed,'rehearsed'));}
   if(st.game===st.promoter.likes)apply(st,{crowd:2});
   log(st,'agent',st.structurePlanning?
    structureRead(st).label+': '+structureRead(st).advice+' The contracted finish still has to be earned.':
    ({story:'A story. Good. Beginning, middle, end. Try to do them in that order.',
     spots:'Spots. I’ll move my car away from the building.',
     technical:'Technical. Lovely. Six people will be in heaven.',
     brawl:'A brawl. I’ll warn the front row and the caretaker.',
     safe:'Safe. Nobody ever got sued for a headlock.'}[st.game]||'Right.'));
   seedBoard(st);st.stage='board';
   log(st,'agent',st.structurePlanning?'First settle how the booked result happens. Then decide which real moves, if any, are named for the four objectives. Both wrestlers will have their say before signing.':'First choose how it ends. Then we can put the called spots in an order that earns it. My pencil marks are only suggestions.');
   return st;
  }
  if(st.stage==='scene'){
   const s=current(st),real=s.options(st).find(x=>x.id===id);
   if(real.fx)apply(st,real.fx);
   real.run?.(st);
   if(s.id==='structure_huddle'&&['hear_counter','hear_sequence'].includes(id))return st;
   reconcile(st);
   st.at++;enter(st);return st;
  }
  if(st.stage==='finish'){
   const c=finishCards(st)[+id.slice(6)];
   st.board.finish={by:c.by,owner:'either',route:c.route,label:c.label};
   st.stage='review';enter(st);return st;
  }
  if(st.stage==='review'){
   if(id==='review_edit'){
    st.reviewing=true;st.stage='board';
    log(st,'agent',st.structurePlanning?'Pencil out. Revise the objectives without replaying the conversation.':'Pencil out. We can revise the spots without repeating the conversations.');
    return st;
   }
   st.stage='curtain';enter(st);return st;
  }
  if(st.stage==='curtain'){
   st.talk=id.slice(5);
   if(st.talk==='money')st.mood.w-=2;
   log(st,'w',consent(st,'w')>=58?say(st,'accept',st.w,'sign'):say(st,'grumble',st.w,'sign'));
   log(st,'f',consent(st,'f')>=58?say(st,'accept',st.f,'sign'):say(st,'grumble',st.f,'sign'));
   st.stage='done';st.sheet=sheet(st);return st;
  }
  return st;
 }
 // Threads last eight weeks. One per situation and person: a newer promise replaces an older one.
 const THREAD_WEEKS=8;
 function keepThreads(old,add,used,now){
  const out=(old||[]).filter(t=>t.id!==used&&now-t.at<=THREAD_WEEKS);
  for(const t of add||[]){const k=x=>x.sit+'|'+(x.sid||'')+'|'+(x.pid||'');const i=out.findIndex(x=>k(x)===k(t));if(i>=0)out.splice(i,1);out.push({...t});}
  return out.slice(-12);
 }
 function liveThreads(list,now){return (list||[]).filter(t=>now-t.at<=THREAD_WEEKS);}
 function consent(st,side){return clamp(Math.round(st.consent[side]+st.mood[side]),20,95);}
 const word=v=>v>=76?'happy with it':v>=62?'fine':v>=50?'grumbling':'sulking';
 function sheet(st){
  // What was agreed becomes an ordinary signed match sheet the engine already knows how to perform.
  const {w,f}=st,base=JSON.parse(JSON.stringify(st.base));
  let planned=0;
  if(st.structurePlanning){
   structureNodes(st,base);
   planned=structureSlots(st).filter(obj=>!!st.structureBoard?.[obj.id]?.action).length;
  }else{
  for(const n of base.nodes){
   const b=st.board[n.id];
   if(n.id==='finish'){n.route=st.lockRoute||b?.route||null;continue;}
   if(!b||!b.action){n.open=true;n.title=n.title+' (called in the ring)';continue;}
   n.actions=[b.action];n.owner=b.owner;
   const O=b.owner==='w'?w:b.owner==='f'?f:null;
   // Alternatives the same wrestler could reach for if the agreed move will not come.
   n.backup=b.action==='scheduled_nearfall'?[]:cardsFor(st,n.id).filter(c=>c.action!==b.action&&!c.impossible&&c.owner===b.owner&&!banned(st,c.action)).map(c=>c.action).slice(0,2);
   if(n.id==='payoff'&&b.action!=='scheduled_nearfall')n.backup.push('scheduled_nearfall');
   n.title=n.id==='opening'?O.short+' gets the early edge with the '+b.label:n.id==='pressure'?O.short+' takes over with the '+b.label:
    n.id==='reversal'?O.short+' comes back with the '+b.label:O?O.short+' hits the '+b.label:'A run of near falls';
   n.planned=true;n.impossible=!!b.impossible;if(b.action!=='scheduled_nearfall')planned++;
  }
  // Only what was actually agreed is a commitment. Everything else is left to the wrestlers, and is not judged.
  if(st.negotiation?.final){for(const n of base.nodes)if(n.id===st.negotiation.slot||(st.negotiation.demand?.granted==='yes'&&st.negotiation.demand.kind==='payoff'&&n.id==='payoff'))n.negotiated=true;}
  base.nodes=base.nodes.filter(n=>n.id==='finish'||n.planned);
  base.nodes.forEach((n,i)=>{n.requires=i?[base.nodes[i-1].id]:[];});
  }
  const problems=K.validate(base.nodes);if(problems.length)throw Error('Backstage sheet: '+problems.join(', '));
  const note=st.note?{id:st.note.id,short:st.note.short,ban:st.note.ban||[],banIds:st.note.banIds||[],need:st.note.need||[],needRisk:!!st.note.needRisk,honour:!!st.note.honour,waived:!!st.note.waived,argued:!!st.note.argued,promoter:st.promoter.voice}:null;
  const signed={...base,v:4,method:planned>=3?'detailed':planned>=1?'landmarks':'live',focus:'authentic',decision:'agreed',signed:true,confirmed:true,disputed:false,issues:[],
   workerConsent:consent(st,'w'),opponentConsent:consent(st,'f'),finishRoute:st.lockRoute||st.board.finish?.route||null,note,
   limits:{ban:[...new Set(st.limits.ban)],banIds:[...new Set(st.limits.banIds)]},spice:st.spice,fx:{...st.fx},repStake:st.repStake,entrance:st.entrance.slice(),
   game:st.game,leash:st.leash,talk:st.talk||'none',flags:{...st.flags},crowdMood:st.crowdMood||null,minutes:Math.max(5,st.minutes+(st.fx.minutes||0)),skipPromo:st.skipPromo,
   stunt:null,bonus:0,story:story(st),finishPreparation:finishPlan(st),negotiation:st.negotiation?JSON.parse(JSON.stringify(st.negotiation)):null,rehearsed:!!st.rehearsed,situations:st.queue.slice(),threads:(st.carry||[]).map(t=>({...t})),threadUsed:st.thread?.id||null,decided:st.decided.map(d=>({...d})),
   premise:(st.structurePlanning?'Four dramatic objectives with '+planned+' named '+(planned===1?'move':'moves'):'A running order of '+planned+' '+(planned===1?'move':'moves'))+'; '+st.queue.length+' things came up backstage'+(st.reworked?' and '+st.reworked+' '+(st.reworked===1?'beat was':'beats were')+' rewritten':'')+'.',
   speakers:st.log.filter(x=>x.kind!=='you').slice(-6).map(x=>({actor:x.who,text:x.text})),
   ...(st.structurePlanning?{structurePlan:structurePlan(st),
    ...(st.structureTalk?.decision?{structureDiscussion:{
     objective:st.structureTalk.objective,by:st.structureTalk.by,reason:st.structureTalk.reason,
     decision:st.structureTalk.decision,from:st.structureTalk.original.action,
     to:st.structureBoard?.[st.structureTalk.objective]?.action||null}}:{})}:{})};
  if(st.structurePlanning){
   const errors=P.STRUCTURES.validatePlan(signed.structurePlan,st.structure,signed);
   if(errors.length)throw Error('Structure plan: '+errors.join('; '));
  }
  return st.structure?P.STRUCTURES.attach(signed,st.structure):signed;
 }
 function agreed(st){
  // A plain-language list of what is on the sheet so far.
  const out=[];
  if(st.game)out.push(D.PLANS[st.game].name);
  const fr=st.lockRoute||st.board.finish?.route;
  if(fr)out.push('Finish: '+(ROUTE_NAME[fr]||fr));
  if(st.structurePlanning){
   out.push('Structure: '+(P.STRUCTURES.catalogue().find(x=>x.id===st.structure.id)?.label||st.structure.id));
   for(const obj of structureSlots(st)){const b=st.structureBoard?.[obj.id];if(b)out.push(obj.title+': '+(b.action?b.label:'call it in the ring'));}
  }else for(const S of SPINE){const b=st.board[S.id];if(b?.label)out.push(S.name+': '+b.label);}
  if(st.note&&st.note.honour!==null)out.push('Note: '+st.note.short+(st.note.waived?' (withdrawn)':st.note.honour?' (promised)':' (no promise)'));
  const ng=st.negotiation;if(ng?.final)out.push('Changed at '+nameOf(st,ng.by)+'’s request: '+(ng.final.action!==ng.original.action?ng.original.label+' → '+ng.final.label:ng.original.label+' kept')+(ng.reply?.kind==='reservation'?' (reservations)':''));
  if(st.limits.ban.length)out.push('Parts of the ring are off limits');
  if(st.spice)out.push(st.spice>0?'Working with more risk':'Working safe');
  if(st.fx.minutes)out.push((st.fx.minutes>0?'+':'−')+Math.abs(st.fx.minutes)+' minutes');
  if(st.skipPromo)out.push('No promo');
  if(st.leash)out.push(st.leash==='free'?'They call it':'You call it');
  if(st.fx.cash)out.push((st.fx.cash>0?'+£':'−£')+Math.abs(st.fx.cash));
  return out;
 }
 function view(st){
  const s=current(st),total=4+st.queue.length;
  const done=st.stage==='plan'?0:st.stage==='board'?1:st.stage==='scene'?2+st.at:
   ['finish','review'].includes(st.stage)?2+st.queue.length:st.stage==='curtain'?total-1:total;
  return {stage:st.stage,situation:s?.id||null,
   title:fmt(st,st.stage==='plan'?(st.structurePlanning?'How should we work this '+structureRead(st).label+'?':'What sort of match?'):st.stage==='board'?(st.structurePlanning?'Agree the finish and dramatic objectives':'Plan the finish and called spots'):s?(typeof s.title==='function'?s.title(st):s.title):st.stage==='review'?(st.structurePlanning?'Review structure and booked finish':'Review the complete layout'):st.stage==='finish'?'The finish':st.stage==='curtain'?'Last word at the curtain':'Signed'),
   ask:fmt(st,st.stage==='plan'?(st.structurePlanning?'The promoter books the result. Plan '+structureRead(st).focus+'.':'The promoter books the result. You decide what kind of match gets there.'):st.stage==='board'?(st.structurePlanning?'Choose the finishing route, then optionally name legal moves for the dramatic objectives.':'Choose how the result happens, then build a running order that supports it.'):s?(typeof s.ask==='function'?s.ask(st):s.ask):st.stage==='review'?(st.structurePlanning?'Check the booked result, finishing route, performer concerns and four dramatic objectives.':'Backstage decisions are settled. Does the running order still support the agreed finish?'):st.stage==='finish'?'How do you get to the booked result?':st.stage==='curtain'?'What do you say as they go out?':''),
   step:Math.min(done+1,total),total,options:options(st),log:st.log.slice(),agreed:agreed(st),
   board:st.stage==='board'?boardView(st):null,review:st.stage==='review'?boardView(st):null,
   finishes:st.stage==='board'?options(st).filter(o=>o.route):null,
   finishPlan:['board','review','curtain'].includes(st.stage)?finishPlan(st):null,
   story:st.stage==='plan'?null:{...story(st),verdict:verdict(st)},
   structureBrief:st.structurePlanning?structureReview(st):null,
   moods:{w:{value:consent(st,'w'),word:word(consent(st,'w'))},f:{value:consent(st,'f'),word:word(consent(st,'f'))}}};
 }
 // ---- the microphone's promise, as a beat on the sheet ----
 function addVow(sheet,promo,w,f){
  const type=promo?.promise?.type;
  if(!sheet?.signed||sheet.v<4||!['counter','finisher'].includes(type))return sheet;
  if(type==='finisher'&&!w.finisher)return sheet;
  const out=JSON.parse(JSON.stringify(sheet));if(out.nodes.some(n=>n.id==='vow'))return out;
  const counter=type==='counter';
  out.nodes.splice(out.nodes.length-1,0,{id:'vow',vow:true,kind:type,owner:'w',planned:true,requires:[],backup:[],
   title:counter?'Vow: '+w.short+' counters '+f.short:'Vow: '+w.short+' wins with the '+w.finisher,
   actions:[counter?(promo.tactic?.nodes||[]).find(id=>A[id])||'counter_strike':'finish_tease'],
   window:counter?[.58,1]:[.8,1.2],status:'pending',actual:null,at:null,why:''});
  const problems=K.validate(out.nodes);if(problems.length)throw Error('Vow: '+problems.join(', '));
  return out;
 }
 // ---- match-engine hooks ----
 function eligible(M,b){
  const s=M.sheet,frac=M.t/Math.max(1,M.len);
  if(b.status!=='pending'||b.id==='finish'||!b.planned)return false;
  if(frac<b.window[0]-.07||frac>b.window[1])return false;
  return !(b.requires||[]).some(id=>s.nodes.find(x=>x.id===id)?.status==='pending');
 }
 // The next agreed beat that can happen now, whoever owns it.
 function target(M){
  const s=M.sheet;if(!s||s.v<4)return null;
  return s.nodes.find(b=>!b.vow&&!b.corner&&eligible(M,b))||null;
 }
 const willing=(M,side)=>(side==='w'?M.sheet.workerConsent:M.sheet.opponentConsent)||60;
 // What the wrestler in control is trying to get to: the agreed move, the setup it needs,
 // or simply the right place to do it from. An unhappy wrestler does not try as hard.
 function wants(M,side,position){
  const b=target(M);
  if(!b||(b.owner!=='either'&&b.owner!==side)){
   const note=M.sheet?.note,frac=M.t/Math.max(1,M.len);
   if(note?.honour&&note.need.length&&frac>.22&&frac<.9&&!met(M,note)){
    if(position==='standing')return [['outside_toss',1.2]];
    if(position==='outside')return [['os_barricade',3]];
   }
   return [];
  }
  const id=b.actions[0],n=A[id];if(!n)return [];
  // How hard they chase the agreed move: their mood about the sheet, how tired they are,
  // how good they are at keeping a match on track, and whether the room is giving anything back.
  // A one-match rehearsal makes a known worker beat substantially more
  // likely to be timed correctly amid the expanded Phase 10 move pool.
  // It never bypasses legality, position, stamina or the booked finish.
  const rehearsal=side==='w'&&M.sheet?.rehearsed?2:1;
  const O=side==='w'?M.w:M.f,tired=clamp(1.15-(O.fatigue||0)/100,.45,1),head=clamp(.55+(O.psych||50)/160,.7,1.15),room=(M.crowd??50)<35?.7:1;
  const keen=clamp((willing(M,side)-40)/11*tired*head*room*rehearsal,.2,5);
  if(b.impossible){
   if(A[id+'_blk']&&n.requires===position&&!(M.graph?.events||[]).some(e=>e.id===id+'_blk'))return [[id+'_blk',3]];
   return [];
  }
  if(n.requires===position||n.requires==='any')return [[id,keen]];
  if(position==='standing'){
   const setup=n.requires==='top'?(n.family==='superplex'?'corner_whip':n.family==='springboard'?'springboard_rise':'top_climb'):
    n.requires==='corner'?'corner_whip':n.requires==='outside'?'outside_toss':n.requires==='mat'?(M.w.style==='Technical'||M.f.style==='Technical'?'mat_takedown':'clothesline'):null;
   return setup?[[setup,keen*.8]]:[];
  }
  if(position==='corner'&&n.family==='superplex')return [['top_follow',keen]];
  // In the wrong place for it: get back to where it can be done.
  if(n.requires==='standing')return [[position==='mat'?'stand_reset':position==='corner'?'corner_break':position==='outside'?'roll_inside':'circle',keen*.8]];
  return [];
 }
 // Wrestling is cooperative. When the next agreed beat belongs to the other wrestler, the one in
 // control leaves an opening for the counter that hands it over. How readily depends on how they
 // feel about the sheet: a sulking wrestler does not feed anybody.
 function feed(M,side){
  const b=target(M);if(!b||b.owner==='either'||b.owner===side||b.impossible)return 1;
  const frac=M.t/Math.max(1,M.len),late=(frac-b.window[0])/Math.max(.01,b.window[1]-b.window[0]);
  if(late<.15)return 1;
  return clamp(1+(willing(M,side)-42)/11*(late>.6?1.5:1),.8,7);
 }
 // A signed finish should affect the BUILD, not just be checked at the bell.
 // Prefer already-legal, physically relevant actions by a small bounded amount.
 // Never create damage, counters, recovery, spots or a finish event directly.
 function finishPreparation(M,id){
  const route=M.o.sheet?.finishRoute,n=A[id],g=M.graph,p=M.story;
  if(!route||!n||!g||!p)return 1;
  const frac=M.t/Math.max(1,M.len);
  if(frac<.15||frac>.86)return 1;
  if(['limb_finish','submission_defeat','injury_gives'].includes(route)){
   const victim=route==='limb_finish'?'f':'w',attacker=victim==='f'?'w':'f';
   const required=route==='injury_gives'?3:4;
   if(p.control!==attacker||n.reverse||!(n.focus>0)||(g.damage?.[victim]||0)>=required)return 1;
   const part=MX.GRAPH.PART_OF[g.targets?.[victim]];
   return !n.part||!part||n.part===part?1.7:1;
  }
  if(['reversal_finisher','finisher_reversed'].includes(route)&&n.reverse){
   const before=route==='reversal_finisher'?'f':'w';
   const count=(g.events||[]).filter(e=>e.reverse&&e.preControl===before).length;
   return p.control===before&&count<3?1.45:1;
  }
  if(route==='outlasted'&&id==='catch_breath'){
   const winner=M.o.finish.startsWith('win')?'w':'f',loser=winner==='w'?'f':'w';
   const winnerSt=winner==='w'?M.wSt:M.fSt,loserSt=loser==='w'?M.wSt:M.fSt;
   return p.control===winner&&loserSt<60&&winnerSt-loserSt<15?1.4:1;
  }
  return 1;
 }
 // Honouring the promoter's note steers the match; it never makes anything illegal.
 const BARRICADE=['floor_counter'];
 const met=(M,note)=>(M.graph?.events||[]).some(e=>{const n=A[e.id];return n&&!n.counterOf&&!n.blockOf&&((n.family&&note.need.includes(n.family))||BARRICADE.includes(e.id));});
 function bias(M,id){
  const sh=M.o.sheet,n=A[id];if(!sh||!n)return 1;
  // Things agreed backstage: parts of the ring that are off limits, and how much risk to take.
  const lim=sh.limits;
  if(lim&&(lim.banIds.includes(id)||(n.family&&lim.ban.includes(n.family)&&!n.counterOf)))return .03;
  const appetite=sh.spice&&n.risk&&!n.counterOf&&!n.blockOf?(sh.spice>0?1.7:.3):1;
  const preparation=finishPreparation(M,id);
  const note=sh.note;if(!note||!note.honour)return appetite*preparation;
  // A promise to the promoter outranks a wrestler's habits.
  if(note.banIds.includes(id)||(n.family&&note.ban.includes(n.family)&&!n.counterOf))return .03;
  if(note.need.length&&!met(M,note)){
   if(id==='outside_toss')return 5*preparation;
   if((n.family&&note.need.includes(n.family)&&!n.counterOf&&!n.blockOf)||BARRICADE.includes(id))return 6*preparation;
   if(id==='roll_inside')return .25*preparation;
  }
  if(note.needRisk&&n.risk&&!n.counterOf&&!n.blockOf&&!(M.spotHits>0))return 2.5*appetite*preparation;
  return appetite*preparation;
 }
 function verify(M){
  const note=M.o.sheet?.note;if(!note||note.waived)return null;
  const ev=(M.graph?.events||[]).map(e=>A[e.id]).filter(Boolean),real=ev.filter(n=>!n.counterOf&&!n.blockOf);
  let kept=true;
  if(note.ban.length||note.banIds.length)kept=!real.some(n=>note.banIds.includes(n.id)||(n.family&&note.ban.includes(n.family)));
  if(note.need.length)kept=kept&&met(M,note);
  if(note.needRisk)kept=kept&&(real.some(n=>n.risk&&n.family)||M.spotHits>0);
  return {id:note.id,short:note.short,kept,honour:note.honour,argued:note.argued,promoter:note.promoter};
 }
 // A daft idea that was allowed happens on the way to the ring.
 const create0=MX.create;
 MX.create=function(o){
  const M=create0(o),stunt=o.sheet?.stunt,fx=o.sheet?.fx;
  if(stunt?.line){MX.note(M,stunt.line);M.crowd=clamp(M.crowd+(stunt.ok?4:-3),0,100);M.crowdStart=M.crowd;}
  // What was decided backstage walks out with them: the entrance, the mood of the room, the edge on the match.
  for(const line of o.sheet?.entrance||[])MX.note(M,line);
  if(fx?.crowd){M.crowd=clamp(M.crowd+fx.crowd,0,100);M.crowdStart=M.crowd;}
  if(fx?.bonus)M.bonus=(M.bonus||0)+fx.bonus;
  const sc=o.sheet?.story?.score||0;if(sc<0)M.sheetAdj=(M.sheetAdj||0)+sc*.12;
  return M;
 };
 // After the bell: the promoter's note is checked and any bonus promised in the room is paid.
 const G=root.OfficeGame,applied=G.applyResult;
 G.applyResult=function(c,fin){
  const seen=G.S?.history?.some(h=>h.cid===c.id),out=applied(c,fin);
  if(seen)return out;
  const h=G.S?.history?.[0],add=(text,tone)=>{out.push({text,tone});h?.notes?.push(text);};
  const note=fin?.roomNote,p=G.P(c.pid);
  if(note&&p){
   const d=(note.honour?(note.kept?3:-4):(note.kept?1:-2))-(note.argued?1:0);
   p.trust=G.clamp(p.trust+d);
   add(note.promoter+'’s note (“'+note.short+'”) was '+(note.kept?'kept':'broken')+(note.honour&&!note.kept?', after you said it would be kept':'')+'. '+p.name+' trust '+(d>=0?'+':'')+d+'.',Math.sign(d));
  }
  if(G.S&&(fin?.roomThreads||fin?.roomThreadUsed))G.S.roomThreads=keepThreads(G.S.roomThreads,fin.roomThreads,fin.roomThreadUsed,c.eventAbs??G.abs());
  if(fin?.roomBonus){G.S.cash-=fin.roomBonus;add('Bonus promised in the agents’ room: −£'+fin.roomBonus+'.',-1);}
  const fx=fin?.roomFx,w=G.W(c.wid);
  if(fx){
   const parts=[],sign=n=>(n>0?'+':'−')+Math.abs(n);
   if(fx.trust&&p){p.trust=G.clamp(p.trust+fx.trust);parts.push(p.name+' trust '+sign(fx.trust));}
   if(fx.cash){G.S.cash+=fx.cash;parts.push((fx.cash>0?'+£':'−£')+Math.abs(fx.cash));}
   if(fx.heat){const fd=G.feud(c.wid,c.rid);if(fd&&!fd.closed){fd.heat=G.clamp(fd.heat+fx.heat);parts.push('rivalry '+sign(fx.heat));}}
   if(fx.rep){G.S.rep=G.clamp(G.S.rep+fx.rep);parts.push('reputation '+sign(fx.rep));}
   if(fx.morale&&w){w.morale=G.clamp(w.morale+fx.morale);parts.push(w.short+'’s morale '+sign(fx.morale));}
   if(parts.length)add('Backstage decisions: '+parts.join(', ')+'.',0);
  }
  if(fin?.roomRepStake){
   const good=fin.stars>=3,d=good?fin.roomRepStake:(fin.roomRepStake>=2?-1:0);
   if(d)G.S.rep=G.clamp(G.S.rep+d);
   add('The scout in row F '+(good?'wrote something down and underlined it':'put the notebook away early')+'.'+(d?' Reputation '+(d>0?'+':'−')+Math.abs(d)+'.':''),Math.sign(d));
  }
  G.save();return out;
 };
 root.OfficeRoom={agreedSequence,readSequenceOffer,sequenceCandidates,sequenceEvidence,proposalEvidence,negotiationFor,negotiable,DAFT_OWN,DAFT_MORE,daftFor,keepThreads,liveThreads,THREAD_WEEKS,learnable,addVow,begin,act,view,options,pitches,sheet,consent,legal,wants,feed,target,bias,verify,agreed,tagsOf,story,boardView,reconcile,banned,SPINE,SITUATIONS,SLOTS,NOTES,VOICE,LINES,DAFT,ROUTE_NAME,AGENT,voice};
})(typeof window!=='undefined'?window:globalThis);
