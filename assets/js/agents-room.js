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
  dean:'slippery',rocco:'gruff',nova:'precise',ace:'grand',magnus:'slippery',tori:'eager'};
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
  const lines=LINES[type][voice(w)].map(line=>cap(line.replace(/\{move\}/g,move).replace(/\{MOVE\}/g,move.toUpperCase()).replace(/\{them\}/g,them)));
  const used=new Map();
  for(const entry of st.log)used.set(entry.text,(used.get(entry.text)||0)+1);
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
  duck_finisher:'Get caught, get finished',finisher_reversed:'Have our finisher reversed',submission_defeat:'Tap out'};
 const ROUTE_STATIC={top_rope:(w)=>w.style==='Spectacle'&&kg(w)<110,strike_knockout:(w)=>w.style==='Brawl',eye_poke:(w)=>['Brawl','Story'].includes(w.style)};
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
   const all=(MX.FINISH_ROUTES[st.finish]||[]).map(r=>r.id).filter(id=>!ROUTE_STATIC[id]||ROUTE_STATIC[id](w,f));
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
   cards.push({by:'agent',owner:'either',action:'scheduled_nearfall',label:'A run of near-falls instead'});
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
 const tone=(st,side,map)=>map[voice(who(st,side))]||map.stoic||Object.values(map)[0];
 const fmt=(st,t)=>String(t).replace(/\{W\}/g,st.w.short).replace(/\{F\}/g,st.f.short).replace(/\{P\}/g,st.promoter.voice).replace(/\{PN\}/g,st.promoter.name).replace(/\{PF\}/g,st.promoter.voice.split(' ')[0]);
 const first=st=>st.promoter.voice.split(' ')[0];
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
 const SITUATIONS=[
  {id:'note',kind:'room',weight:3,when:x=>!!NOTES[x.st.promoter.id],
   open(st){const n=pick(NOTES[st.promoter.id],st.seed,'note');st.note={...n,honour:null};log(st,'agent','A note from '+st.promoter.voice+'. '+n.text);},
   title:'The promoter’s note',ask:'How do you answer?',
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
    const none={[m]:1,[o]:held?-1:undefined,spice:-1,plan:{slot:'payoff',owner:'either',by:'agent',action:'scheduled_nearfall',label:'A run of near-falls'}};
    const out=[
     {id:'keep',label:cur&&cur.action!=='scheduled_nearfall'?'“The '+cur.label+' stays.”':'“Near-falls. As agreed.”',hint:'The running order stands. '+X.short+' takes it badly.',fx:keep,tags:tagsOf(st,keep),
      run(st){log(st,s,say(st,'grumble',X,'spot'));}},
     {id:'give',label:'“Fine. The '+c.label+'.”',hint:X.short+' gets the moment.'+(unsafe?' '+Y.short+' does not trust '+X.short+' with it.':''),fx:give,
      tags:[...tagsOf(st,give),...(c.risk?['High risk']:[]),...(c.impossible?['Will not work']:[])],
      run(st){
       if(c.impossible)log(st,'agent',pick(['With respect, '+Y.short+' weighs the same as a Ford Fiesta. '+X.short+' is not lifting a Ford Fiesta.','I’ll say what nobody else will. '+X.short+' cannot physically do that to '+Y.short+'. I’ve seen '+X.short+' struggle with the kit bag.'],st.seed,'imp'));
       else if(unsafe)log(st,other(s),say(st,'safety',Y,'spot'),'objection');
       else if(held&&Y.ego>=68)log(st,other(s),say(st,'ego',Y,'spot'),'objection');
       log(st,s,say(st,'pleased',X,'spot'));}}];
    if(cur?.action!=='scheduled_nearfall')out.push({id:'nobody',label:'“Then nobody gets it. Near-falls.”',hint:AGENT+'’s compromise. Nobody is thrilled.',fx:none,tags:tagsOf(st,none),
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
     {id:'cut',label:'“Fine. We’ll cut it.”',hint:'Three minutes come out of the match.',fx:a,tags:tagsOf(st,a),run(st){log(st,'agent','I’ll tell them. They’ve already started arguing about which three.');}},
     {id:'refuse',label:'“Tell {PF} we’re doing our time.”',hint:'It works about two times in five.',tags:['Gamble',first(st)+' ▼','Shorter match if it fails'],
      run(st){if(rng(st.seed,'timecut')<.4){apply(st,{trust:-1});log(st,'agent','You’ve kept your time. '+st.promoter.voice+' did a sort of sigh down the phone.');}
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
     {id:'sell',label:'“Work it into the match.”',hint:st.f.short+' goes after it and the crowd can see it is real.',fx:b,tags:tagsOf(st,b),run(st){log(st,'agent','Selling a real injury. Bold. Stupid, but bold.');}},
     {id:'fine',label:'“You’re fine. Walk it off.”',hint:'Costs nothing. Fixes nothing.',fx:c,tags:tagsOf(st,c),run(st){log(st,'w',say(st,'grumble',st.w,'hurt'));}}];}},
  {id:'daft',kind:'flavour',weight:3,when:()=>true,
   open(st){const score=x=>x.ego-(x.psych||50)*.4+rng(st.seed,'aob'+x.id)*30;st.daftSide=score(st.w)>=score(st.f)?'w':'f';
    log(st,'agent','Any other business? No? Good. Oh. '+nameOf(st,st.daftSide)+' has a hand up.');log(st,st.daftSide,DAFT[voice(who(st,st.daftSide))].pitch);},
   title:'Somebody has had an idea',ask:'Well?',
   options(st){
    const s=st.daftSide,X=who(st,s),m=s==='w'?'moodW':'moodF',d=DAFT[voice(X)],no={[m]:X.ego>=70?-3:-1},later={[m]:1};
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
    const a={moodW:2,route:'referee_bump'},b={moodW:-6},c={moodW:3,moodF:-2};
    return [
     {id:'accident',label:'“Make it look like an accident.”',hint:'The referee goes down, and what happens next is nobody’s fault.',fx:a,tags:tagsOf(st,a),run(st){log(st,'w',say(st,'accept',st.w,'dirty'));}},
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
      run(st){if(rng(st.seed,'meat')<.5){apply(st,{trust:2});st.mood[s]-=3;log(st,s,'It was going to waste.');}else{st.mood[s]-=5;log(st,s,'I have never seen a meat tray in my life.');log(st,'agent','That was said with a mouth full of sausage, but I can’t prove anything.');}}}];}}
 ];
 // ---------------------------------------------------------------------------------------------
 // v3.7 THE RUNNING ORDER. Every meeting now has a spine: the shine, the heat, the comeback and the
 // big spot, pencilled in by Dennis and changeable by you. The situations that follow push on that
 // spine rather than being the only way anything gets planned.
 // ---------------------------------------------------------------------------------------------
 const SPINE=SLOTS.filter(S=>S.id!=='finish');
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
 function seedBoard(st){
  // Dennis's pencil: his own middle option for the first three, and the booked winner's big spot
  // if it is safe and physically possible, otherwise a run of near-falls.
  const win=winSideOf(st);
  for(const S of SPINE){
   const cards=cardsFor(st,S.id);
   const c=S.id==='payoff'?(cards.find(k=>k.by===win&&!k.risk&&!k.impossible)||cards.find(k=>k.by==='agent')):(cards.find(k=>k.by==='agent')||cards[0]);
   if(c)st.board[S.id]={by:'agent',owner:c.owner,action:c.action,label:c.label,impossible:!!c.impossible};
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
  if(owner!=='either'&&(who(st,owner)?.learned||[]).includes(c.action))t.push('Learned in training');
  return t;
 }
 function boardView(st){
  return SPINE.map(S=>{
   const cur=st.board[S.id];
   const cards=cardsFor(st,S.id).map((c,i)=>({id:'slot_'+S.id+'_'+i,label:c.label,by:c.by,who:c.by==='agent'?AGENT:nameOf(st,c.by),
    selected:!!cur&&cur.action===c.action,risk:!!c.risk,impossible:!!c.impossible,tags:slotTags(st,S,c)}));
   return {slot:S.id,name:S.name,ask:fmt(st,S.ask.replace(/\{O\}/g,S.owner==='f'?'{F}':'{W}')),cards,current:cur?.label||null};
  });
 }
 // Some decisions wreck a beat that was already agreed. Dennis swaps in the nearest thing that still works.
 function reconcile(st){
  for(const S of SPINE){
   const b=st.board[S.id];if(!b||!banned(st,b.action))continue;
   const alt=cardsFor(st,S.id).find(c=>c.action!==b.action&&!c.impossible&&!banned(st,c.action)&&(S.id==='payoff'||c.owner===b.owner));
   if(alt){
    st.board[S.id]={by:'agent',owner:alt.owner,action:alt.action,label:alt.label};
    log(st,'agent','That rules out the '+b.label+'. '+(alt.action==='scheduled_nearfall'?'The big spot becomes a run of near-falls.':nameOf(st,alt.owner)+' does the '+alt.label+' instead.'));
   }else{delete st.board[S.id];log(st,'agent','That rules out the '+b.label+', and there’s nothing sensible to put in its place. '+S.name+' will be called in the ring.');}
   st.reworked=(st.reworked||0)+1;
  }
 }
 // Does the running order tell a story the booked finish can pay off?
 function story(st){
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
  // Feelings about the running order land when you agree it, not every time you change your mind.
  for(const S of SPINE){
   const b=st.board[S.id];if(!b||b.by==='agent')continue;
   const owner=S.id==='payoff'?b.owner:S.owner;
   if(b.by===owner)st.mood[owner]+=2;else{st.mood[b.by]+=2;st.mood[owner]-=2;}
  }
  const p=st.board.payoff;
  if(p&&p.owner!=='either'){const o=other(p.owner),O=who(st,o);if(O.ego>=68&&O.pro<88)st.mood[o]-=3;}
 }
 const PLAN_HINT={story:'Slow build, big finish.',spots:'Big moves, big pops, big risk.',technical:'Ringcraft first. Purists love it.',brawl:'Loud, messy, tiring.',safe:'Low risk, low ceiling.'};
 function context(st,p){
  const winnerSide=st.finish.startsWith('win')?'w':'f',loserSide=other(winnerSide);
  return {st,p:p||{},heat:st.heat,loser:who(st,loserSide),winner:who(st,winnerSide)};
 }
 function draw(st,p,recent){
  // A seeded, weighted draw without replacement, skipping what this career has seen lately.
  const x=context(st,p),want=['feature','main'].includes(st.slot)?3:2;
  let poolS=SITUATIONS.filter(s=>{try{return s.when(x)}catch(e){return false}});
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
  const lite=x=>({id:x.id,name:x.name,short:x.short,style:x.style,tier:x.tier||null,ring:x.ring||60,psych:x.psych||50,safe:x.safe||65,pro:x.pro||60,ego:x.ego||50,mic:x.mic||50,heat:x.heat||40,fatigue:x.fatigue||0,finisher:x.finisher,learned:(x.learned||[]).slice()});
  const pid=p?.id&&NOTES[p.id]?p.id:'dock';
  const st={v:3,cid:c.id,seed,game:null,finish:c.finish,slot:c.slot,minutes:c.minutes||10,heat:Math.max(c.feudHeat||0,opts.heat||0),
   w:lite(w),f:lite(f),promoter:{id:pid,name:p?.name||'the promoter',voice:p?.voice||'The promoter',likes:p?.likes||null,tv:!!p?.tv},
   stage:'plan',at:0,queue:[],mood:{w:0,f:0},consent:{w:70,f:70},board:{},note:null,limits:{ban:[],banIds:[]},fx:{},flags:{},entrance:[],
   spice:0,leash:null,talk:null,stunt:null,lockRoute:null,skipPromo:false,repStake:0,decided:[],log:[],said:{},base:null,contract:{...c},rehearsed:!!opts.rehearsed};
  st.loserSide=st.finish.startsWith('win')?'f':'w';
  st.queue=draw(st,p,opts.recent||[]);
  const fin={win_clean:w.short+' wins clean',win_dirty:w.short+' wins dirty',lose_protected:w.short+' loses, but protected',lose_clean:w.short+' loses clean'}[c.finish];
  log(st,'agent',pick(['Evening. Doors in ten, so let’s not make a meal of it.','Right. I’ve a flask going cold, so shall we?','The urn’s on. Let’s get this agreed before the raffle starts.'],seed,'hello'));
  log(st,'agent','Contract says '+fin+'. That part isn’t up for discussion. So, what sort of match are we having?');
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
   return {id:'plan_'+id,label:pl.name,hint:PLAN_HINT[id]||pl.blurb||'',tags};});
  if(st.stage==='board'){
   const out=[];
   for(const r of boardView(st))for(const c of r.cards)out.push({id:c.id,label:c.label,hint:r.name+': '+c.who+'’s idea.',tags:c.tags,slot:r.slot,selected:c.selected});
   out.push({id:'board_ok',label:'Agree the running order',hint:'Then deal with whatever comes up.',tags:[]});
   return out;
  }
  if(st.stage==='scene'){const s=current(st);return s.options(st).map(o=>({id:o.id,label:fmt(st,o.label),hint:fmt(st,o.hint||''),tags:(o.tags||tagsOf(st,o.fx||{})).map(t=>fmt(st,t))}));}
  if(st.stage==='finish')return finishCards(st).map((c,i)=>({id:'route_'+i,label:c.label,hint:c.by==='agent'?AGENT+'’s suggestion. It has never let anyone down.':who(st,c.by).short+'’s idea.',
   tags:[...c.hate.map(s=>who(st,s).short+' ▼'),'Fixes the finish']}));
  if(st.stage==='curtain')return Object.entries(D.TALKS).map(([id,t])=>({id:'talk_'+id,label:t.name,hint:t.blurb||'',tags:id==='money'?[st.w.short+' ▼','They will listen']:id==='fire'?['More risk','Crowd ▲']:id==='calm'?['Safer']:[]}));
  return [];
 }
 function enter(st){
  // Move to whatever comes next, and let the people in the room say their piece.
  if(st.stage==='scene'&&st.at<st.queue.length){current(st).open(st);return;}
  if(st.stage==='scene'){st.stage=st.lockRoute?'curtain':'finish';}
  if(st.stage==='finish'){
   log(st,'agent','The finish. The result is in the contract. How do we get there?');
   for(const c of finishCards(st))if(c.by!=='agent')log(st,c.by,from(st,'finish-pitch',['I’d go “{r}”.','How about “{r}”? I’ve thought about this.','“{r}”. Obviously.','For the finish: “{r}”. It’ll look great.']).replace('{r}',c.label.toLowerCase()));
   return;
  }
  if(st.stage==='curtain'){
   if(st.reworked)log(st,'agent','The running order’s had a few rubbings-out. '+verdict(st));
   log(st,'agent','That’s the match layout. '+st.w.short+' is '+word(consent(st,'w'))+'. '+st.f.short+' is '+word(consent(st,'f'))+'. Last word before '+st.w.short+' goes through the curtain?');
  }
 }
 function act(st,id){
  if(!st||st.stage==='done')throw Error('The meeting is over');
  const o=options(st).find(x=>x.id===id);
  if(!o)throw Error('Not an option backstage: '+id);
  if(st.stage==='board'){
   if(id==='board_ok'){
    log(st,'you','“That’ll do.”');st.decided.push({stage:'board',situation:'board',id,label:o.label,tags:[]});
    settleBoard(st);log(st,'agent',verdict(st)+' Right. Now for the things that always come up.');
    st.stage='scene';st.at=0;enter(st);return st;
   }
   const m=id.match(/^slot_(\w+)_(\d+)$/),S=SPINE.find(x=>x.id===m[1]),c=cardsFor(st,S.id)[+m[2]];
   if(st.board[S.id]?.action===c.action)return st;
   log(st,'you','“'+S.name+': the '+c.label+'.”');
   st.decided.push({stage:'board',situation:S.id,id,label:c.label,tags:o.tags});
   st.board[S.id]={by:c.by,owner:c.owner,action:c.action,label:c.label,impossible:!!c.impossible};
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
   log(st,'agent',{story:'A story. Good. Beginning, middle, end. Try to do them in that order.',spots:'Spots. I’ll move my car away from the building.',technical:'Technical. Lovely. Six people will be in heaven.',
    brawl:'A brawl. I’ll warn the front row and the caretaker.',safe:'Safe. Nobody ever got sued for a headlock.'}[st.game]||'Right.');
   seedBoard(st);st.stage='board';
   log(st,'agent','I’ve pencilled in a running order. Change anything you don’t like. It’s only pencil.');
   return st;
  }
  if(st.stage==='scene'){
   const s=current(st),real=s.options(st).find(x=>x.id===id);
   if(real.fx)apply(st,real.fx);
   real.run?.(st);
   reconcile(st);
   st.at++;enter(st);return st;
  }
  if(st.stage==='finish'){
   const c=finishCards(st)[+id.slice(6)];
   st.board.finish={by:c.by,owner:'either',route:c.route,label:c.label};
   for(const s of c.hate){st.mood[s]-=6;log(st,s,say(st,'proud',who(st,s),'finish'),'objection');}
   if(!c.hate.length&&c.by!=='agent')log(st,c.by,say(st,'pleased',who(st,c.by),'finish'));
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
 function consent(st,side){return clamp(Math.round(st.consent[side]+st.mood[side]),20,95);}
 const word=v=>v>=76?'happy with it':v>=62?'fine':v>=50?'grumbling':'sulking';
 function sheet(st){
  // What was agreed becomes an ordinary signed match sheet the engine already knows how to perform.
  const {w,f}=st,base=JSON.parse(JSON.stringify(st.base));
  let planned=0;
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
    n.id==='reversal'?O.short+' comes back with the '+b.label:O?O.short+' hits the '+b.label:'A run of near-falls';
   n.planned=true;n.impossible=!!b.impossible;if(b.action!=='scheduled_nearfall')planned++;
  }
  // Only what was actually agreed is a commitment. Everything else is left to the wrestlers, and is not judged.
  base.nodes=base.nodes.filter(n=>n.id==='finish'||n.planned);
  base.nodes.forEach((n,i)=>{n.requires=i?[base.nodes[i-1].id]:[];});
  const problems=K.validate(base.nodes);if(problems.length)throw Error('Backstage sheet: '+problems.join(', '));
  const note=st.note?{id:st.note.id,short:st.note.short,ban:st.note.ban||[],banIds:st.note.banIds||[],need:st.note.need||[],needRisk:!!st.note.needRisk,honour:!!st.note.honour,waived:!!st.note.waived,argued:!!st.note.argued,promoter:st.promoter.voice}:null;
  return {...base,v:4,method:planned>=3?'detailed':planned>=1?'landmarks':'live',focus:'authentic',decision:'agreed',signed:true,confirmed:true,disputed:false,issues:[],
   workerConsent:consent(st,'w'),opponentConsent:consent(st,'f'),finishRoute:st.lockRoute||st.board.finish?.route||null,note,
   limits:{ban:[...new Set(st.limits.ban)],banIds:[...new Set(st.limits.banIds)]},spice:st.spice,fx:{...st.fx},repStake:st.repStake,entrance:st.entrance.slice(),
   game:st.game,leash:st.leash,talk:st.talk||'none',flags:{...st.flags},crowdMood:st.crowdMood||null,minutes:Math.max(5,st.minutes+(st.fx.minutes||0)),skipPromo:st.skipPromo,
   stunt:null,bonus:0,story:story(st),rehearsed:!!st.rehearsed,situations:st.queue.slice(),decided:st.decided.map(d=>({...d})),
   premise:'A running order of '+planned+' '+(planned===1?'move':'moves')+'; '+st.queue.length+' things came up backstage'+(st.reworked?' and '+st.reworked+' '+(st.reworked===1?'beat was':'beats were')+' rewritten':'')+'.',
   speakers:st.log.filter(x=>x.kind!=='you').slice(-6).map(x=>({actor:x.who,text:x.text}))};
 }
 function agreed(st){
  // A plain-language list of what is on the sheet so far.
  const out=[];
  if(st.game)out.push(D.PLANS[st.game].name);
  for(const S of SLOTS){const b=st.board[S.id];if(b&&S.id!=='finish'&&b.label)out.push(S.name+': '+b.label);}
  if(st.note&&st.note.honour!==null)out.push('Note: '+st.note.short+(st.note.waived?' (withdrawn)':st.note.honour?' (promised)':' (no promise)'));
  if(st.limits.ban.length)out.push('Parts of the ring are off limits');
  if(st.spice)out.push(st.spice>0?'Working with more risk':'Working safe');
  if(st.fx.minutes)out.push((st.fx.minutes>0?'+':'−')+Math.abs(st.fx.minutes)+' minutes');
  if(st.skipPromo)out.push('No promo');
  if(st.leash)out.push(st.leash==='free'?'They call it':'You call it');
  if(st.fx.cash)out.push((st.fx.cash>0?'+£':'−£')+Math.abs(st.fx.cash));
  const fr=st.lockRoute||st.board.finish?.route;if(fr)out.push('Finish: '+(ROUTE_NAME[fr]||fr));
  return out;
 }
 function view(st){
  const s=current(st),total=2+st.queue.length+(st.lockRoute?0:1)+1;
  const done=st.stage==='plan'?0:st.stage==='board'?1:st.stage==='scene'?2+st.at:st.stage==='finish'?2+st.queue.length:st.stage==='curtain'?total-1:total;
  return {stage:st.stage,situation:s?.id||null,
   title:fmt(st,st.stage==='plan'?'What sort of match?':st.stage==='board'?'The running order':s?s.title:st.stage==='finish'?'The finish':st.stage==='curtain'?'Last word at the curtain':'Signed'),
   ask:fmt(st,st.stage==='plan'?'The promoter books the result. You decide what kind of match gets there.':st.stage==='board'?AGENT+' has pencilled it in. Change anything you like, then agree it.':s?s.ask:st.stage==='finish'?'How do you get to the booked result?':st.stage==='curtain'?'What do you say as they go out?':''),
   step:Math.min(done+1,total),total,options:options(st),log:st.log.slice(),agreed:agreed(st),
   board:st.stage==='board'?boardView(st):null,story:st.stage==='plan'?null:{...story(st),verdict:verdict(st)},
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
  return s.nodes.find(b=>!b.vow&&eligible(M,b))||null;
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
  const rehearsal=side==='w'&&M.sheet?.rehearsed?1.3:1;
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
 // Honouring the promoter's note steers the match; it never makes anything illegal.
 const BARRICADE=['floor_counter'];
 const met=(M,note)=>(M.graph?.events||[]).some(e=>{const n=A[e.id];return n&&!n.counterOf&&!n.blockOf&&((n.family&&note.need.includes(n.family))||BARRICADE.includes(e.id));});
 function bias(M,id){
  const sh=M.o.sheet,n=A[id];if(!sh||!n)return 1;
  // Things agreed backstage: parts of the ring that are off limits, and how much risk to take.
  const lim=sh.limits;
  if(lim&&(lim.banIds.includes(id)||(n.family&&lim.ban.includes(n.family)&&!n.counterOf)))return .03;
  const appetite=sh.spice&&n.risk&&!n.counterOf&&!n.blockOf?(sh.spice>0?1.7:.3):1;
  const note=sh.note;if(!note||!note.honour)return appetite;
  // A promise to the promoter outranks a wrestler's habits.
  if(note.banIds.includes(id)||(n.family&&note.ban.includes(n.family)&&!n.counterOf))return .03;
  if(note.need.length&&!met(M,note)){
   if(id==='outside_toss')return 5;
   if((n.family&&note.need.includes(n.family)&&!n.counterOf&&!n.blockOf)||BARRICADE.includes(id))return 6;
   if(id==='roll_inside')return .25;
  }
  if(note.needRisk&&n.risk&&!n.counterOf&&!n.blockOf&&!(M.spotHits>0))return 2.5*appetite;
  return appetite;
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
 root.OfficeRoom={learnable,addVow,begin,act,view,options,pitches,sheet,consent,legal,wants,feed,target,bias,verify,agreed,tagsOf,story,boardView,reconcile,banned,SPINE,SITUATIONS,SLOTS,NOTES,VOICE,LINES,DAFT,ROUTE_NAME,AGENT,voice};
})(typeof window!=='undefined'?window:globalThis);
