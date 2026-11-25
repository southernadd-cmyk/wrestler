/* Phase 5C, part 1. Explicit authored lines; shared slots are metadata, not text templates. */
(function(root){'use strict';
 const slots=[["open","proof","w","pr_tech","opening"],["open","proof","w","pr_brawl","opening"],["open","proof","w","pr_risk","challenge"],["open","proof","w","pr_stall","opening"],["open","people","w","p_working","opening"],["open","people","w","p_short","opening"],["open","swagger","w","sw_main","opening"],["open","swagger","w","sw_pose","opening"],["open","proof","f","pr_tech","challenge"],["open","proof","f","pr_brawl","challenge"],["open","proof","f","pr_risk","rebuttal"],["open","proof","f","pr_stall","rebuttal"],["open","people","f","p_working","respect"],["open","swagger","f","sw_main","disrespect"],["answer","turn","w","tu_strength","rebuttal"],["answer","turn","w","tu_strength","rebuttal"],["answer","calm","w","ca_pro","respect"],["answer","calm","w","ca_simple","respect"],["answer","calm","w","ca_restraint","pressure"],["answer","challenge","w","ch_one_fall","challenge"],["answer","challenge","w","ch_mat","challenge"],["answer","challenge","w","ch_ground","challenge"],["answer","challenge","w","ch_stay","challenge"],["answer","calm","f","ca_pro","respect"],["push","press","w",null,"pressure"],["push","acknowledge","w",null,"respect"],["push","acknowledge","f",null,"respect"],["close","vow","w","vo_hard","closing"],["close","vow","w","vo_plain","closing"],["close","clean","w","cl_middle","closing"],["close","uncertainty","w","un_done","closing"],["close","uncertainty","w","un_plan","closing"]];
 const rows={
 "mara": "If your case rests on what you do on the canvas, the first question is how you intend to put me there.\nYour striking is not in dispute. Its sufficiency is.\nWhile you are in the air, you have surrendered the means of changing your argument.\nThe audience has paid for a conclusion. I will not let you adjourn the proceedings.\nThey are entitled to a full contest. I propose we hold each other to that standard.\nI have one point to make to the people who bought tickets: judge the wrestling.\nWhatever order the programme lists, my appearance is the one that requires a headline.\nExamine the evidence in front of you. That is the standard.\nThen you must establish that you can prevent a takedown. Merely stating it is not evidence.\nAn excellent distinction. Now establish that you can withstand the first strike.\nYour opportunity lasts precisely as long as I permit it.\nYou call it delay. I call it control of the proceedings.\nThat is a reasonable obligation. I doubt your ability to discharge it.\nYour declaration does not constitute the verdict.\nYou have identified {strength}. I will not dispute the existence of the problem; I will dispute its outcome.\nLet the record show that your advantage is {strength}. It is the point on which I intend to cross-examine you.\nI have no complaint against you personally. My complaint is with your proposed result.\nNo raised voices. We can settle the matter on the canvas.\nI will not dignify the grievance with a shouting match.\nOne fall, as the rules state. No accomplices. Those are the terms I am putting before you.\nIf the canvas is your evidence, let us examine it there.\nTry making your case with both feet on the ground.\nRemain inside those ropes and answer the question in wrestling terms.\nOn that much we agree. The result remains contested.\nWe have not disposed of the first question. Answer it.\nI accept that particular point; nothing further.\nConcession noted. We can proceed.\nI anticipate a difficult case. I intend to win it.\nMy conclusion is simple: I will win.\nOne clean fall in the centre. No qualifications.\nThat is all the evidence I intend to present before the bell.\nI have prepared my argument. You will see the rest in the ring.",
 "rex": "Get me down there first. Then you can talk about your holds.\nA forearm is a forearm. It doesn't win the whole match.\nYou're welcome to climb. I'll be here when you land.\nI've no interest in watching you kill time. We're here to wrestle.\nPeople worked for that ticket. Give them a shift worth paying for.\nNot much of a speech. I'll give you a match.\nPut me anywhere on that card. I'll make it the one they came for.\nLook at me. Then look at the bloke you've got to move.\nYou'll be on the mat soon enough. Save your breath.\nTake a clean one off me and tell me how little it matters.\nYou'd better get there before I land.\nI'm not waiting. I'm picking my moment.\nI'll do my shift. Make sure you do yours.\nBig billing. Same canvas as everybody else.\nYour {strength}. That's what I've got to get through.\nI know what you've got: {strength}. Let's see if it's enough.\nNothing personal. I want the result.\nNo need to raise my voice. Bell's coming.\nI could have a row with you. Rather have a match.\nJust us. One fall, that is all. Plain as that. No one coming to help.\nMat's there. Get on it with me.\nStay down here and wrestle me.\nDon't take a walk when it gets hard.\nGood. No more needs saying.\nAnswer me. Once will do.\nFair. Fair credit to you.\nRight. That's settled.\nIt'll be hard graft. I'll be the one standing.\nI'm winning tonight.\nClean fall in the middle. That's the job.\nDone talking.\nI've got something ready for you. You'll feel it soon enough.",
 "lyra": "You're brilliant on the mat, I know. I want that first instant before you get hold of me.\nYou can hit me hard. But a match keeps moving, doesn't it? That's what I need.\nThere's a moment between the ropes and the landing. That's when I'll catch you.\nCome on, don't make them wait for it! I want this match moving from the first second.\nThey've bought a ticket to feel something. I want to give them that, not half a night.\nI'm better at showing it than explaining it. Watch the ring.\nWhen the lights hit me I want everyone to forget what number match this is.\nLook up. That's the kind of night you're dealing with.\nYou might keep moving. You've still got to stop me getting my hands on you.\nCan you keep that speed after the first hit? That's the question.\nYou have to catch that instant. It's smaller than you think.\nNot every pause is wasted time. Wait until you see what I do with mine.\nI want them on their feet too. Let's see which of us earns it.\nThe lights are lovely. Keeping them is the difficult bit.\nI heard you: {strength}. I've got to work out the moment when I can get past that.\nI accept your {strength} as real. I'm looking for the little gap in that.\nI haven't got a grudge against you. I just want to come out of this the winner.\nRight. Breathe. I'll see you at the bell.\nIf I start shouting now I'll lose the point. Come on, let's wrestle.\nNo one else. One fall, and we find out.\nAll right, down on the mat with you. Show me, quickly.\nStay with me on the canvas for a bit. Can you?\nNo disappearing out of the ropes. Keep it moving with me.\nYeah. That's something we can agree on.\nWait, that's not the bit I was asking about.\nAll right, I see what you mean. Fair.\nGood. Now we can get on with the exciting bit.\nIt won't be easy. I'm going to win anyway.\nI'm going to win tonight.\nOne clean fall, right in the middle. No quick shortcuts for us.\nThat's it. You'll see.\nI've got an idea. No, I'm not telling you yet.",
 "brick": "You're good down there. I'm not giving you the takedown for nothing.\nYou hit hard, I know. I've still got a whole match to do.\nEvery jump ends on the mat. I'll be waiting there.\nDon't spend the night leaning on the ropes. We've got work to do.\nNobody ought to go home thinking they paid for half a match.\nI'm not going to give you a speech. I'll give you the wrestling.\nDoesn't matter when I go on. I'll give them the main event's work.\nThis is what they're paying you to get past.\nKeeping your feet is one thing. Keeping your balance is another.\nLet's see what you say after you take one.\nYou've still got to get hold of me before I land.\nThere's a difference between wasting time and making you work.\nI'll put the work in. You do the same.\nIt's a match, not a speech. Show me the grip.\nYour {strength}. I'll have to get round that.\nNo use pretending those {strength} aren't there. I'll deal with them.\nI've nothing against you. I've got a match to win.\nI'll leave the shouting to someone else.\nA row won't get either of us anywhere.\nOne fall, no fuss. Nobody else getting involved.\nFine. We can start down on the mat.\nStay on your feet with me. No flying off.\nStay inside the ropes and do your shift.\nFair, and short. We'll settle it properly.\nYou've not answered what I asked.\nI'll take that point.\nGood. That's enough.\nIt'll be a proper hard match. I'm still going to win it.\nI'll finish it. Simple as that.\nClean fall in the centre. Both of us do it properly.\nNothing more from me.\nI've done my preparation. No need to explain it here.",
 "juno": "I know how you work on the mat. It's the entry I need to stop. That's the important bit.\nYou can strike. I need to keep my base when you do.\nWhen you're airborne there's a grip you can't defend. I have to find it.\nYou dictate the pace. I want to make you move when I choose.\nThey deserve a good match. Both of us should be trying for that.\nI'm not really a speaker. Watch my hands when we start.\nWhatever the slot, I want the best wrestling to be in this match.\nLook at my stance. That's what you need to get past.\nThen you have to defend both ankles. Not just the first grip.\nA strike can change the position. Let's see if you can hold it afterwards.\nYou'll need to be underneath me at exactly the right point.\nI'm using the time to improve my position. That's not the same thing.\nAgreed. They should see something worth studying.\nBeing on last doesn't make a hold any tighter.\nRight. Your {strength}. I know what I need to work against.\nI don't need to dismiss your {strength}. I need an answer to them.\nIt's not personal. I want to prove my wrestling.\nI... no. I'll do the rest on the mat.\nShouting at you isn't going to improve my technique.\nOne fall, exact. No one else, please.\nYes. On the mat. That's where I want this.\nStay on the canvas with me. Just for the contest.\nDon't step out when I start to get a grip.\nRight, precisely. That's fair.\nSorry, can you answer the actual question?\nYes. That's a fair point.\nOkay. We understand each other.\nIt'll be difficult. I still intend to win.\nI aim to win.\nOne clean fall. In the centre of the mat.\nThat's all.\nI've worked something out. I'll show you when we start.",
 "sol": "I know what you can do on the canvas. I want to earn the chance to wrestle you standing first.\nYou hit hard, I'll say that. I want these people to see that getting hit isn't the end of the story.\nEvery time you take off there's a chance for me to answer. I want them to see it.\nDon't make them wait for a match they've already paid for. Let's give them one.\nYou lot put your money down to see us give everything. We owe you that much.\nI don't need a long speech. Let me earn the cheer in the ring.\nWherever they put us, let's give these people the match they remember most.\nTake a good look. I'm not asking for faith without showing you why.\nYou can try to stay standing. I'll make you earn it.\nIt's one thing to believe you can take the hit. Let's find out together.\nI'll be trying to land where you aren't waiting.\nSometimes the crowd needs a breath. I'll use mine.\nI owe them an honest effort as well. Let's see if you can match it.\nThey'll tell us which match mattered. Not you.\nYou've told me about your {strength}. I have to respect that and find a way through it.\nI'm not going to pretend those {strength} don't matter. I'm asking for the chance to answer them.\nI respect you. That doesn't mean I'm giving you the win.\nI don't want to shout over anybody. Till the bell, then.\nIf this turns into shouting, we've forgotten why they're here.\nOne fall, just us. Let them see who earns it.\nMeet me on the mat. Give me the chance to prove it there.\nStay down here with me. Let's see who can wrestle.\nDon't walk out on the people who've come to see this.\nThen we've both got something to prove.\nHold on. I want to hear your answer to that.\nI can accept that. I still believe in what I'm doing.\nGood. Let's give them a match.\nI know it'll be hard. I promise I'll win.\nI'm going to win.\nOne clean fall, in the middle. Give them something honest.\nThat's all I wanted to say.\nI've got a way into this match. You'll see it when they ring the bell.",
 "dee": "Can I ask you something? If you're that good on the mat, what happens if I don't let you get the first hold?\nI know you hit harder than me. I want to find out what I can do after the first hit.\nYou have to land somewhere. I've been working on what I do when you land.\nI'd rather find out what I can do against you than stand about waiting.\nI've bought tickets like these people. I know what it feels like when somebody doesn't give their best.\nI'm still learning the talking bit. Please watch what I do in the ring.\nI'd like to make this the match they remember, whatever time it starts.\nLook at me properly. I'm here to wrestle you.\nThen you have to stop the first entry. Let's see how you manage it.\nYou might get past the first hit. What about the next one?\nI've been practising the landing too. You have to catch me first.\nI'm trying to make good decisions, not run down the clock.\nOkay, fair enough. We both owe them a proper match.\nIsn't that for the people watching to decide?\nYou've explained your {strength}. That's what I've got to learn to answer.\nI don't have a clever reply to {strength}. I've got to show you that I've prepared.\nI've got nothing against you. I'd like to beat you on my merits.\nI'm not going to try to outshout you. I'll see you in the ring.\nI don't think getting angry will help me wrestle any better.\nJust one fall between us. That's all I'm asking for.\nCan we settle it on the mat? I'd like that test.\nStay down here with me. I want to see what I can do.\nPlease stay in the ring. Give me the chance to finish the contest.\nYes. That's the way it should be.\nSorry, but I don't think you answered the question.\nThat's fair. I'll take that on board.\nAlright, let's see. I'll see you at the bell.\nI know how hard this is going to be. I intend to win it.\nI mean it. I'm going to win tonight.\nOne clean fall, halfway. That's how I want to do it.\nI think I've said enough.\nI've been practising something. I'd rather show you than tell you.",
 "kit": "You're good on the floor, mate. Problem is, I'm a terrible houseguest. You've got to get me down there first.\nYou hit hard, brilliant. That's half the advert sorted. What do you do after that?\nOff the top rope you go. I'll meet you on the other end of the trip.\nDon't make them sit through an interval before the match has even started.\nThey paid for the whole show, not a little sample. Come on, let's give them their money's worth.\nTalking's not the exciting part. Eyes on the ring, please.\nOpener? Main event? Once we're out there I don't fancy hearing anybody asking what time it is.\nHave a good look. That's the act you've got to follow.\nYou can spend all night avoiding the mat. I'll only need you there for a moment.\nTry the first hit. Then give us your expert review.\nIf you're catching me, get your timing right. I'm not taking the scenic route.\nThere's a reason I'm waiting. You'll find out when you rush in.\nThat's the spirit. Let's see if you're still saying it halfway through.\nLovely. Shall we let them decide which of us was worth the ticket?\nThose {strength} sound like a proper problem. Good thing I've come for a match.\nI heard the bit about your {strength}. That's the bit I'll have to work around.\nNo hard feelings. I just want the win, thanks.\nRight, I'll stop making a racket. See you out there.\nWe could argue till closing time. I'd rather get the wrestling started.\nJust us, one fall. Leave the guest list at the door.\nOn the mat it is. Come on, give us a demonstration.\nCan you spend a bit of time down here without looking for a rope to climb?\nStay in there with me. Nobody bought a ticket to watch you have a wander.\nFair play. Now we've got a match.\nHang on, that's a different question altogether.\nAll right, that's a good point. That point is yours.\nGood enough for me.\nThis is going to be a long shift. I'll win it, though.\nI'm winning this one.\nOne clean fall, right in the middle. No funny business.\nThat's my lot. Keep watching.\nI've got an idea that ought to make this interesting. You'll have to wait.",
 "dax": "You're good once you get someone on the mat. I won't be giving you that starting position for free.\nYou can put a dent in somebody. The question is whether you know what to do next.\nWhen you're in the air you've got one way down. That's when I expect to meet you.\nYou can stretch the evening out all you want. I'm not standing about on your timetable.\nThey've all made the effort to get here. Both of us have a responsibility to make it worth it.\nI'll keep it brief. You've got a match coming that deserves your attention.\nThey can put me in whatever slot they like. When I come through the curtain, that's the main attraction.\nLook at me a moment. That's what you've got to deal with.\nYou can refuse the invitation. I'm not asking you to sit down of your own accord.\nWe'll talk about the value of a hard shot after you've taken one.\nKnowing where I'm coming down is only useful if you're still there to meet me.\nI'm taking the time I need. You're welcome to try to hurry me.\nThat's a decent sentiment. Can you deliver on it?\nYou're telling me you're the main event. That's something the room gets to decide.\nYou've named your {strength}. Fine. That's what I've prepared to deal with.\n{strength}: that is your answer. Now we're getting somewhere.\nI've no personal quarrel with you. I have a professional interest in the result.\nWe don't need a scene. Meet me at the bell.\nI know what happens when people start shouting. I'd sooner have a match.\nOne fall, no guests. Are we clear?\nAll right, we'll meet on the mat. You can show me how good you are.\nStay on the canvas and see how you get on.\nDon't disappear through the ropes when the conversation gets difficult.\nThen we both know where we stand.\nCome back to what I asked you. Not the question you'd prefer.\nThat will do, then. I'll give you that one.\nGood. That's a useful place to leave it.\nI'm expecting a hard night's work. I'm going to win it.\nLet me be clear. I'm winning this match.\nOne clean pin, mid-match. Nobody needs to check the small print.\nI've made my point. See you in there.\nI've got my own approach to this. You'll see it at the bell.",
 "val": "Your mat wrestling is excellent. Now show me the strength and timing it takes to bring me down.\nYou can produce a great deal of force. Winning takes more than the first application of it.\nI don't need to match your height. I need to meet you when you come back to the ground.\nYou like to set a slow rhythm. I'm going to make you work at mine.\nThey've worked for the money they spent here. We should work just as hard to deserve it.\nI'm not going to sell myself with a speech. Watch the effort in the ring.\nThe number beside my name on that card doesn't set the standard. My performance does.\nTake a proper look. That is the standard I am asking you to match.\nI'll have to work for the takedown. That's precisely why I'm prepared to do it.\nTry taking my best strike before you reduce it to a theory.\nYou'll need to make the catch when I'm already moving. Not an easy lift.\nI'm managing the pace. Come and change it if you can.\nI'm ready to carry my share of that match. You carry yours.\nYou can claim the biggest slot. You cannot claim the performance before it happens.\nMeeting your {strength} head on is a real test. I'm not going to lower the standard to get round that.\nYou've made the case for your {strength}. I have to demonstrate that I can meet it.\nI'm not questioning your character. I'm competing for a result.\nI won't shout at you. I have something to show you in the ring.\nAnger isn't going to improve my form. We can settle it properly.\nOne fall, neat. Nobody else involved. Equal terms.\nMeet me on the mat and demonstrate that advantage.\nKeep both feet on the canvas and give me an equal test.\nStay between the ropes with me. Finish what you start.\nThen we agree on the standard.\nYou're avoiding the comparison. Give me a straight answer.\nThat's a fair point. I won't argue with it.\nGood. Now we have a contest.\nI expect to have to work for every inch. I will prevail.\nI will be the winner. That is my standard.\nA neat fall, halfway. No shortcuts from either of us.\nI've finished speaking.\nI've put the preparation in. You'll find out what it was."
};
 root.OfficePromoBankC1=Object.freeze(Object.entries(rows).map(([owner,body])=>{const texts=body.split('\n');if(texts.length!==slots.length)throw Error('Dialogue bank length: '+owner);return {owner,role:'wrestler',lines:slots.map(([stage,action,side,variant,category],i)=>({id:owner+'.c1.'+String(i+1).padStart(2,'0'),stage,action,side,category,text:texts[i],when:{hasMouthpiece:false,...(variant?{variants:[variant]}:{})}}))};}));
 // G4C.1: topic-gated, independently authored replies to unsupported charges.
 const evidenceReplies={
 "mara": [
  "Objection sustained. I have no particulars to offer that establish the charge, and I will not invent them.",
  "A demand for evidence is reasonable. I withdraw the allegation rather than pretend it is a finding.",
  "Very well. The unsupported allegation is not part of the case. The contest remains.",
  "Let the distinction stand. An unproven charge is not a verdict; neither is a speech a wrestling result."
 ],
 "kit": [
  "Fair enough, mate. I haven't got a proper example, and I'm not doing a whole comedy routine to hide that.",
  "You've caught me there. No specific incident I can point to. Let's keep the show about the wrestling.",
  "Lovely. We can bin that bit of the script, then. On with the actual match.",
  "That's the end of that little detour. Come on, let's give them something worth the ticket."
 ],
 "sol": [
  "They deserve a fair contest, and that starts with me being fair about you. I can't support that accusation.",
  "I won't ask these people to take my word for something I can't establish. Let's give them a match instead.",
  "That's fair. We can leave the accusation there and give these people what they paid for.",
  "Then we're clear on that point. Let's give them a contest they can judge for themselves."
 ],
 "val": [
  "I hold my wrestling to a standard. I must hold my words to it too. I cannot establish that charge.",
  "I have no particular incident I can cite with confidence. Equal terms mean leaving that allegation out.",
  "Good. No unproved allegation between us. Meet the standard in the ring.",
  "That's a fair correction. We'll settle the sporting question on equal terms."
 ],
 "dax": [
  "You want something I can actually demonstrate. I haven't got that for this accusation, so I'm not using it.",
  "That isn't a point I can back up. I'd rather put a proper problem in front of you when we wrestle.",
  "Fine. The accusation goes. The challenge stays.",
  "Right, that's one thing settled. Now let's find out what you've got in the ring."
 ],
 "dee": [
  "Sorry, that's fair. I can't give you a real example of it. I shouldn't have made it sound like a fact.",
  "I don't want to win an argument by putting something on you that I can't prove. Let's talk about the wrestling.",
  "Thanks for saying that. I'd rather we both had a fair chance to show what we can do.",
  "All right. We don't need to keep that accusation going just to make the match interesting."
 ],
 "lyra": [
  "Hang on, you're right. I haven't got an example I can actually point to. Let's leave that bit out.",
  "I've got carried away with the moment. That doesn't make it true. I want to show you what I can do instead.",
  "All right, that's fair. Let's get back to the interesting part, shall we?",
  "Good. We can leave that behind us and keep moving when the bell goes."
 ],
 "brick": [
  "Can't back that up. Shouldn't have said it.",
  "No example I can give you. Strike that bit.",
  "Fine. Leave it out. We've got work to do.",
  "Right. No fuss. Let's wrestle."
 ],
 "juno": [
  "Sorry. I can't give you a specific example. I shouldn't have said it as if I could.",
  "Right. I can't establish that. It's my wrestling I need to demonstrate, not an accusation.",
  "Yes. That's a better way to put it. We can leave that claim alone.",
  "Okay. We understand that part now. I'd like to wrestle."
 ],
 "rex": [
  "Can't stand that up with facts. I'll take it back.",
  "You've asked for an example. Haven't got one. That's that.",
  "Fair enough. No charge between us now. Just the match.",
  "Right. Leave the talk here. Let's get on the canvas."
 ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceReplies[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ev.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:j<2?'w':'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressReplies={
 "dax": [
  "Whether you can solve the problem I put in front of you. They'll see every move we make.",
  "They'll see if you can get out of the positions I put you in. That's something we can actually test."
 ],
 "sol": [
  "The people will see whether we give them a fair contest. They can judge the work for themselves.",
  "We can show them what we do under pressure. Neither of us needs to ask them to believe an accusation."
 ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidencePressReplies[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD3={
  "lyra": [
    "Watch the instant you think you've got me stopped. Can I find another way out? We'll know soon enough.",
    "They can see whether I keep moving when you take my space away. That's something a match can show."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidencePressRepliesD3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD5={
  "val": [
    "They can see whether I keep my form when you make me work for every inch.",
    "Let them judge the effort and the result. I intend to meet the standard without making claims I cannot support."
  ],
  "brick": [
    "Watch who gets the hold and who gets out. There's your answer.",
    "They'll see whether either of us can finish the job. Nothing to make up there."
  ],
  "dee": [
    "I'd like to find out if I can use what I've been practising when you really make it difficult. They'll see that.",
    "Can we let them watch how I respond when you catch me out? I think that would be a fair way to judge me."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidencePressRepliesD5[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD6={
  "juno": [
    "Watch the first entry and the grip that follows. We'll see who can keep the position.",
    "They can see whether I find an escape when you have my weight underneath you. That's something we can test."
  ],
  "kit": [
    "Well, they'll see whether I can get out of the mess you're about to put me in. That's worth the admission money.",
    "Never mind the trailer, mate. Watch the whole match and see who actually earns the finish."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidencePressRepliesD6[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD8={
  "rex": [
    "Watch who can keep working when the other bloke makes it hard. You'll see the answer.",
    "Get in the ring. Earn the fall. That's all the proof we need tonight."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidencePressRepliesD8[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE1={
  "mara": [
    "Let us exclude the unsupported allegation. What proposition can we actually establish in the contest?",
    "On the evidence available to the referee and the audience, what can this match establish?"
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceQuestionsE1[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE2={
  "dax": [
    "All right, leave that out of it. What can you actually show these people when the bell goes?",
    "We've both got a match to wrestle. What do you reckon we can settle in there?"
  ],
  "dee": [
    "Can I ask what you think we'll be able to show them by wrestling each other?",
    "If we leave the accusation behind, what can we actually find out in the match?"
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceQuestionsE2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE3={
  "juno": [
    "The position matters more than the talk. What can we demonstrate when we're both fighting for it?",
    "What will the people be able to judge from the wrestling itself?"
  ],
  "kit": [
    "Save the detective act, mate. What can we actually show them once the bell goes?",
    "They've bought tickets for wrestling, not a courtroom drama. What can we settle out there?"
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceQuestionsE3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE6={
  "lyra": [
    "Forget what people are saying outside the ring. What can we show them from the first second of the match?",
    "I want them to see it, not just hear about it. What can we demonstrate when we're both moving?"
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceQuestionsE6[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE7={
  "val": [
    "Leave the accusation aside. What can we demonstrate when we both have to earn every advantage?",
    "The people can judge the work we put in out there. What can we show them about our wrestling?"
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceQuestionsE7[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE8={
  "brick": [
    "Never mind what someone's said. What can we show them by putting the work in?",
    "We've got a match to do. What can they judge from that?"
  ],
  "rex": [
    "No more about the claim. What can you show me on the canvas?",
    "People bought a ticket for the match. What can they judge from it?"
  ],
  "sol": [
    "These people deserve more than an accusation. What can we show them through an honest effort in the ring?",
    "Let's give them something they can see for themselves. What can we demonstrate by wrestling each other?"
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceQuestionsE8[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const strengthCountersF3={
  "kit": [
    "Lovely, you've read the advert for my {strength}. The live performance might be a bit less convenient.",
    "You've got a plan for my {strength}, mate. Hope you've got a spare for when the first one goes sideways."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (strengthCountersF3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF4={
  "lyra": [
    "You've worked out how to meet my {strength}. Let's see if you can catch the moment when I actually use them.",
    "You know about my {strength}, but you've still got to find me at exactly the right instant."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (strengthCountersF4[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF5={
  "val": [
    "You've prepared to meet my {strength} head on. Good. I intend to make you earn every inch of that defence.",
    "I respect the work you've put into answering my {strength}. You still have to match the effort when I apply them."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (strengthCountersF5[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF6={
  "mara": [
    "Let the record show how you intend to defend against my {strength}. I shall be interested in the evidence you produce in support of it.",
    "You have established that my {strength} exist. The burden of proving you can overcome them remains yours."
  ],
  "rex": [
    "You've got a plan for my {strength}. Right. Clock in and see if it holds up.",
    "My {strength} are part of the job you've got tonight. Get on with it."
  ],
  "brick": [
    "You know what my {strength} are. Good. You'll have to do the graft of stopping them yourself.",
    "You've allowed for my {strength}. Let's see how much work you're willing to put in when I use them."
  ],
  "juno": [
    "If you shut down my {strength} at the first grip, watch what I do with the position you leave me.",
    "You've prepared for my {strength}. I want to see where your weight goes when you try that defence."
  ],
  "sol": [
    "I'm glad you've taken my {strength} seriously. These people deserve to see both of us give everything against the other's best.",
    "You think you can get past my {strength}. Come on, let's give the crowd a chance to find out together."
  ],
  "dee": [
    "Okay, you've been practising how to stop my {strength}. I've been practising what to do if you manage it.",
    "Can I ask you something about my {strength}? What will you do if the first way you've learnt to stop them doesn't work?"
  ],
  "dax": [
    "You've budgeted for my {strength}. Don't expect me to stick to your timetable when you try to contain them.",
    "You've announced how you'll deal with my {strength}. That gives the room something to watch for when we get in there."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (strengthCountersF6[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const evidenceAcknowledgementsG2={
  "dee": [
    "Okay, I can see that. I shouldn't ask people to believe something I can't show them.",
    "That's a fair way to look at it. We can both do our best to give them something real to judge."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceAcknowledgementsG2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceAcknowledgementsG3={
  "kit": [
    "Fair enough, mate. Saying it louder doesn't magically turn it into evidence.",
    "All right, I'll drop the detective routine. Give the crowd some wrestling they can actually judge."
  ],
  "lyra": [
    "Wait, yes, I see what you mean. Let's stick to what they can see us do.",
    "Fair. I don't want to get ahead of what has actually happened."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceAcknowledgementsG3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceAcknowledgementsG4={
  "sol": [
    "That's fair. These people deserve to see the work, not be asked to believe a rumour.",
    "I accept that. Let's give them something honest to judge when we wrestle."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceAcknowledgementsG4[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceAcknowledgementsG6={
  "mara": [
    "I concede the correction. An inference cannot be admitted as a fact merely because it suits my case.",
    "Very well. I shall confine my argument to what can be established."
  ],
  "rex": [
    "Fair enough. Can't call it a result till it's happened.",
    "I'll give you that. Let's do the shift instead of talking up the last one."
  ],
  "brick": [
    "Aye. If I can't show you it happened, I've no business saying it did.",
    "That's fair. I'll keep my mouth shut on that bit and do my work."
  ],
  "juno": [
    "You're right about the distinction. I can prepare for a possibility without pretending it's certain.",
    "I'll accept that. We should be judging the actual exchanges, not filling in the blanks."
  ],
  "dax": [
    "All right. I won't ask you to take my word for something neither of us can establish.",
    "Fair correction. Let's give the people a contest they can judge with their own eyes."
  ],
  "val": [
    "I accept that point. Being confident in my assessment doesn't make it a fact.",
    "That's reasonable. I will stand by what can be demonstrated, and no more."
  ]
};
 for(const pack of root.OfficePromoBankC1)for(const [j,text] of (evidenceAcknowledgementsG6[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const experienceRepliesH2={
  "rex": {
    "w": [
      "You've put the years in. Fair enough. Still got to do tonight's shift.",
      "I respect a veteran who can do the job. Let's see what the years have left you with."
    ],
    "f": [
      "Years teach you when to plant your feet and when to let a bloke go past.",
      "Experience doesn't do the work for me. It tells me where to put the effort."
    ]
  }
};
 for(const pack of root.OfficePromoBankC1)for(const side of ['w','f'])for(const [j,text] of (experienceRepliesH2[pack.owner]?.[side]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ex.'+side+'.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side,category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'experience'}});
 const experienceRepliesH3={
  "juno": {
    "w": [
      "You've spent time learning the positions. I still have to make you work for the grip you want.",
      "I respect the experience. What matters now is who controls the next transition."
    ],
    "f": [
      "Experience is feeling the grip change before you're stuck underneath it.",
      "I don't need to have seen your exact move before. I need to know how to recover my base when it comes."
    ]
  }
};
 for(const pack of root.OfficePromoBankC1)for(const side of ['w','f'])for(const [j,text] of (experienceRepliesH3[pack.owner]?.[side]||[]).entries())pack.lines.push({id:pack.owner+'.c1.ex.'+side+'.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side,category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'experience'}});
})(typeof window!=='undefined'?window:globalThis);
