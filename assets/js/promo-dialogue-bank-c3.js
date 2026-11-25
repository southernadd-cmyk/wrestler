/* Phase 5E, batch 1: established wrestlers without banks. Individually authored text, stable slot IDs. */
(function(root){'use strict';
 const slots=[["open","proof","w","pr_tech","opening"],["open","proof","w","pr_brawl","opening"],["open","proof","w","pr_risk","challenge"],["open","proof","w","pr_stall","opening"],["open","people","w","p_working","opening"],["open","people","w","p_short","opening"],["open","swagger","w","sw_main","opening"],["open","swagger","w","sw_pose","opening"],["open","proof","f","pr_tech","challenge"],["open","proof","f","pr_brawl","challenge"],["open","proof","f","pr_risk","rebuttal"],["open","proof","f","pr_stall","rebuttal"],["open","people","f","p_working","respect"],["open","swagger","f","sw_main","disrespect"],["answer","turn","w","tu_strength","rebuttal"],["answer","turn","w","tu_strength","rebuttal"],["answer","calm","w","ca_pro","respect"],["answer","calm","w","ca_simple","respect"],["answer","calm","w","ca_restraint","pressure"],["answer","challenge","w","ch_one_fall","challenge"],["answer","challenge","w","ch_mat","challenge"],["answer","challenge","w","ch_ground","challenge"],["answer","challenge","w","ch_stay","challenge"],["answer","calm","f","ca_pro","respect"],["push","press","w",null,"pressure"],["push","acknowledge","w",null,"respect"],["push","acknowledge","f",null,"respect"],["close","vow","w","vo_hard","closing"],["close","vow","w","vo_plain","closing"],["close","clean","w","cl_middle","closing"],["close","uncertainty","w","un_done","closing"],["close","uncertainty","w","un_plan","closing"]];
 const rows={
 "malik": "My technique is not a rumour. Watch me use it on people who think they are better.\nI hit as hard as anyone on this card, and I have never once apologised for it.\nTake a risk tonight and I will make you pay for it. That is the deal.\nSlow it down if you like. I will still be the one setting the pace.\nThe people paid to see work. Give them work, not a warm-up.\nThe people here deserve a short answer. I am better than you.\nI belong among the strongest in this circuit. Tonight I will prove it again.\nLook at my shoulders, then look at my face. Neither one is asking for help.\nYou talk about technique. Show me one real hold in there and I will believe you.\nYou want a brawl? Bring your best strikes and I will bring mine.\nRisk is not the same as ability. I have seen plenty of people take risks and fall off.\nA slow pace will not save you. I will still be standing at the end of it.\nThe people deserve better than talk. I respect that you want work, and so do I.\nYou claim to be among the best. Let me see whether the claim survives the first minute.\nProud of your {strength}, good. Pride without preparation is a weakness. Right, then. Enough. Proud people make mistakes against a plan.\nYour {strength} will be tested tonight, and I will be the one doing the testing.\nYou are professional about this, and I respect it. Now prove it under pressure.\nEnough said, then. You said what you meant, so I will do the same.\nI could tell you what I think of that. I would rather show you in the ring.\nOne fall, no excuses. Think you can keep me down for three seconds?\nOn the mat I will find your weak point. Then I will stay there.\nGrounded or standing, you will not find a comfortable place with me.\nStay in front of me if you dare. I want to see how long you last.\nThat was an answer, but not a strong one. Now let us see whether the match matches it.\nYou heard me. Now give me an answer, not a shrug.\nEnough. We both know what the bell is for.\nI can accept that. We both know what the bell is for.\nI came here to win, and I am going to fight for it.\nI am coming for the win, and I will take it honestly.\nWhatever happens, you will know exactly where you stood with me.\nIt is done with me. Get on with it, then.\nI have a plan, and it does not involve you talking any more.",
 "dean": "Let me set out the facts before anyone gets excited. I have the stronger technical case.\nNobody is questioning the brawling. I am asking whether it is the best use of the evening.\nYou want a risk? Fine. Tell me how you will manage it, and then we can talk.\nSlowing things down is sensible. Nobody in this business benefits from a rushed contest.\nThe people are the reason we are all here, and they deserve the best deal available.\nKeep it simple for the crowd. I am offering you the better option.\nI have done the sums on this circuit, and my name is in the right column.\nA man who looks this relaxed is usually the one who has read the terms.\nYou claim the technical edge. Let us narrow the question to one hold and see who holds it.\nStrikes are a reasonable tool. They are not the whole argument, and I think you know it.\nYou are describing a risk, not an answer. Work out the difference before the bell.\nPace, for me, is not the same as weak. I think you will find that out the hard way.\nNobody is asking the crowd to choose sides yet. Let us look at what they actually want.\nYou talk about being among the best. Let us see whether the record agrees with you.\nYou are proud of your {strength}, and it is a sensible thing to be. It is a sensible thing to be proud of, and I plan around it.\nI have looked at your {strength} closely. I want to find the terms they rely on.\nYou have kept your temper, and that is good sense. Keep it for the bell.\nReasonable. Then we agree on the basic facts, and the only question is the outcome.\nI could be unpleasant about that. I would rather be right, which is better for both of us.\nOne fall, clean and simple. You may find the terms more generous than you expect.\nOn the mat I can make this very slow for you. I would rather make it instructive.\nGrounded or standing, the choices are yours. I am only offering to make them harder.\nStay where you are if you think you can hold the terms. I will be checking them as we go.\nThat is a reasonable answer. Let us see whether you keep to it once I start.\nYou have had your reply. The question still stands, so answer it properly.\nThat is fair, I think you will find. That is a point I can accept, and I think it helps us both.\nLet us call that agreed. We can settle the rest at the bell, sensibly.\nI have made my position clear, and I intend to keep to it all the way to the finish.\nMy approach is measured. I plan to finish this properly.\nWhatever the result, both sides will know where things stand.\nThere is a sensible way to settle this. I am not sure you will like it.\nThere is one more thing to check before the bell, and I think you know what it is.",
 "rocco": "Technique. Sure. Show me one you have used on somebody who was trying to stop you.\nI brawl. I have never needed a speech to prove it.\nRisk gets people hurt. I take it when I have no other option.\nTime, to me, is fine. Heavy is better.\nThe crowd came to see work. They will get work.\nI am not here to be liked.\nRespect is earned in the ring. I do not need anybody to tell me I have it.\nLook at the stance. Hot, ready. This is how I stand when I am ready to go.\nTechnique, that word. Prove it, then. I will be waiting.\nStrikes come first and the rest follows. You will know when you have taken one.\nThe gamble is only worth it if the outcome is worth it. Yours is not.\nStalling is an admission. I do not stall.\nThe people want a contest, not a press conference. Let them have one.\nYou talk big. I talk short. Only one of us will be standing after the bell.\nI know about your {strength}. Good, then. I have seen what it does to people who are careless.\nYou can be proud of your {strength}. Pride does not keep you upright.\nYou are cool. Fine. Good, then. Keep that until I am on the floor.\nCalm answer. I will take it, and I will see if you keep it.\nI could shout. I do not need to.\nOne fall, hot and fast. Hot and quick. Keep me down, and I will be surprised.\nOn the mat, I am not going anywhere until I say so.\nGrounded is where you want me. It is not where you will keep me.\nStay on your feet if you can. It makes no difference to me.\nThat was an answer, barely warm. Now prove it.\nDid you hear me? I asked a question. Answer it.\nFine, then. Let us get on with it.\nFine. Bell. Furnace.\nI will fight until the bell goes, and I will not stop when it does.\nPlain and straight: I am here to wrestle this one, and I am going all out.\nWhatever happens, you will know where I stood.\nNothing is decided yet. We will see.\nThe rest of this talk is wasted. Go and warm up.",
 "ace": "Ladies and gentlemen, look at the man who keeps asking for a spotlight. Then look at me.\nBrawling? Watch me do it in front of the biggest crowd in the building.\nA bold entrance runs on nerve, and I have plenty. I have plenty of it, and I am happy to share.\nSlow it down if you must. The people came to see a star, and I am the star.\nThe people are the show. Give them a performance they will talk about on the bus home.\nHere is the crux: this is my moment, and I am taking it.\nI am the centre of the show's biggest moment, and nobody here needs me to say otherwise.\nGaze upon this pose, ladies and gentlemen. It was made for photographs, and you are going to be in every one.\nA technique, you say, with the crowd watching. Your technique is missing from the programme, so show it to the people.\nStrikes? I invented the noise. You invented the silence.\nRisky? Yes. Worth it? Only if the crowd gets its money's worth.\nStalling is not a show. Give them a show.\nThe people paid to see a contest. Make it one they will want to see again.\nYou want to be the main attraction. Stand next to me and see how it looks.\nYou are proud of your {strength}, and the crowd can see it. It is a fine act, and I will be watching it closely.\nI have seen your {strength} and I have a better angle on it.\nYou kept your head, I grant you. Lovely. It makes the bravado look better when I bring it.\nCalm is a costume too. I will take it off for the crowd.\nI could shout, and the crowd would shout back. I would rather save my voice for the finish.\nOne fall, and the whole place will rise. Keep me down and I will bow to you in front of everyone.\nOn the mat I will be the one getting the applause for every move.\nGrounded or standing, the spotlight stays on me.\nStay in front of me if you want the attention. It is a hard job.\nA reasonable answer, for once. Now the crowd wants more.\nThe microphone is still waiting for you. The people noticed, and so did I.\nVery well, I grant you that much. Let us give the crowd something to cheer.\nI will grant you that, with a bow. The bell is calling.\nI will give everything I have until the bell. After that the crowd decides.\nI am here to put on a show, and I intend to do it properly.\nWhatever happens, the people will remember where I stood.\nNothing is decided yet, and that is what makes it exciting.\nI have one more thing for the crowd. Watch when the bell goes.",
 "tori": "Here's a test. Rub two things together for long enough and something gets hot. Think about that.\nI am not a gimmick when I hit the mat. I am a force, the same as a storm.\nPressure builds up when you hold back. I would not hold back if I were you.\nSlow things down all you like. Energy will find a way out.\nThe crowd came to see something they cannot explain. Give them the spark.\nI am here, and it is not an accident.\nI am an attraction. The reactions in this building are proof of that.\nLook at the pose. It is a warning, not a costume.\nYou say I am a gimmick. Watch what I do, then say it again.\nBlows build up heat. You will feel it before you know what it is.\nRisk, friction, pressure. You have all three to think about.\nA slow pace is a pressure valve. I will be the one opening it.\nThe people paid for something new. Give them the experiment.\nYou want the crowd to notice you. Good luck with the static.\nPride in your {strength}, a good spark. That makes sense, because it is a real force in this match.\nI have been thinking about your {strength}. I think it creates a useful kind of pressure.\nYou stayed calm. Lovely. Let us see how the heat behaves.\nFair enough, like a current. We both know the reactions will decide it.\nI could explain that in detail. I would rather let the match explain it.\nOne fall, one proper result. Give me the chance and I will show you the reaction.\nOn the mat, the friction gets interesting. Stay close.\nGrounded or standing, I keep moving. You cannot hold the energy in.\nStay where you are if you think you can contain it.\nThat was a fair reaction. Now let us see the reaction.\nHeat gives you an answer. Your silence does not. Feel the answer, then give it.\nFair point. Let us turn it into something useful.\nFair enough, the static is gone. I take that and I will use it at the bell.\nI will be in there giving everything I have. The rest is physics.\nI am ready to give the crowd something they cannot explain, and I mean that.\nWhatever happens, something will change in that ring.\nThe result is still open. I like it that way.\nI have an idea. Let us see whether it works.",
 "faye": "Quote me exactly. Then tell me where my claim goes wrong.\nBrawling is not a verdict on anything. Show me what the brawl was meant to prove.\nRisk, to me, is a debt you take on. Know the amount before you sign for it.\nYou want to slow the match. Say so in those words, so I can hold you to them.\nThe people are owed a plain account. I will give them one, word for word.\nIn one sentence you say you are ready. I say you have not shown it yet.\nYou describe yourself as central. Show me the document that puts you there.\nLook at the stance. It says nothing you have not already said with your feet.\nYou claim technical skill. Quote the hold, name what it requires, and I will judge it.\nA brawl without a verdict is only noise. Give me a result I can check.\nRisk, to me, is an exposure. You have not shown me the size of yours.\nA stall breaks what you promised. I will quote the promise back to you.\nThe crowd is owed a result they can rely on. Tell them what you will deliver.\nYou have called yourself one of the best. Which exact moment supports the word?\nQuote your {strength} to me. Quote the part you rely on, and I will answer that part only.\nI have checked your {strength} against what you said before. They do not match.\nA calm answer. Good. Calm is the easiest state in which to be held to your words.\nYou have said it precisely. I will hold you to it precisely.\nI could challenge the whole sentence. I will challenge the single word that matters.\nOne fall, as stated. Keep me down, and the verdict is yours, in the exact words we used.\nOn the mat, I will quote you as we go. Stay with what you said.\nGrounded or standing, your promise is the same promise. Keep it.\nStay in front of me. Repeat your claim so I can take it down correctly.\nA sound answer. It matches what you said earlier, word for word.\nYou have not answered. A promise left unanswered is still owed.\nNoted, in your own words.\nI accept that for the moment. We will settle the debt at the bell.\nI will wrestle this match and hold you to every word you have given.\nMy approach is precise. I say a thing once, and I mean it.\nWhatever happens, the words will be on the table in the order you said them.\nThe verdict is not in. One promise still stands open.\nI have one more quotation for you, and you will hear it when the bell rings.",
 "zara": "Right, look. My technique is proper, I promise. Ask anybody who has been on the wrong end of it.\nI brawl a bit, yeah. Mostly because it works, honestly.\nRisk? Yeah, I take them. Nobody has ever said I was boring.\nSlow? Nah. Tempo is what I do best.\nThe people are the best bit. Honest. Give them something to shout about.\nQuick one: I am here and I am ready. That is it.\nI am memorable. Not because I shout, but because I do things other people do not.\nThis pose is mine. Nobody else gets to do it, so do not try.\nYou reckon the technique is yours? Right. Show me it's yours.\nBlows, yeah, they hurt. I know that better than most people here.\nRisk is risk. You either take it or you sit it out.\nSlow pace? Bit boring. I would rather see something happen.\nRespect the crowd. They are the ones who came out tonight.\nYou called me forgettable? Mate, you are going to remember this.\nProud of your {strength}, fair play. Fair play. I reckon it's about to get tested.\nI did notice your {strength}. Hard to miss, honestly.\nCalm? Right, I am calm. Trust me, it's a skill.\nFair, fair. Let's see if you can keep that up.\nI could say what I think of that. I'm going to save it for the match.\nOne fall, nice and simple. Keep me down and I'll be impressed, and that does not happen often.\nOn the mat I'll be annoying. Brace yourself.\nGrounded or standing, I'm not making it easy for you.\nStay where you are, then. Let's see how long you last.\nRight, good answer. Now do it.\nHang on, you have not answered me. Go on.\nYeah, fair point. Let's keep going.\nFair, then, go on. I'll take that and get on with it.\nI'm going to give it everything. Honestly, that's the plan.\nI'm here to wrestle, and I'm going to enjoy it. Is that allowed?\nWhatever happens, you'll see the real me in there.\nNothing's decided yet. That's the good bit.\nI've got an idea. It's a daft one, but I like it.",
 "aisha": "Technique. Name one hold you have landed on a real opponent.\nBrawling is fine. Less talk, more strikes.\nRisk is mine to take. Not yours to judge.\nPace is set by me. Not by you.\nThe people want a contest. Hand them one, now.\nI run my own career. Settled.\nI headline because I earn it. Nobody gets that for me.\nLook at my footing. Learn it. Nobody holds me up but me.\nTechnique, you say. Prove it. Show it. Now.\nStrikes first. Then the rest. You will feel the order.\nRisk without control is noise. Yours is noise.\nStalling. Do not insult me with it.\nThe people paid. Respect them by wrestling.\nYou want to be among the best. Do it without stepping over me.\nProud of your {strength}? Fine. Prove it. Good. Keep going. Be proud in the ring, not in the interview.\nI have noted your {strength}. Now prove it.\nCalm answer. Keep it up.\nClean answer. Noted.\nI could say more. Not a chance.\nOne fall, plainly. Done. No excuses. Pin me, then.\nOn the mat, I decide the pace.\nGrounded or standing, the choice is mine.\nHold your ground. Let us see.\nAcceptable. Move on. Now back it up.\nStill silence. Answer me. Answer.\nNoted. Next.\nNoted. The bell, then.\nI will fight until the bell. Then I decide what happens next.\nMy plan is simple: wrestle hard, and do not give anyone a second chance.\nWhatever happens, you will know my position.\nNothing is settled. Good. Keep going.\nTalking is over. Get in the ring.",
 "anya": "The notes say one thing. Your feet say another. I will read the feet.\nBrawling is cheap noise on cold steel. Pay attention to what does not ring.\nA gamble on the edge of the ice. Tell me where the crack starts.\nSlow is a clean cut. It only hurts if the blade is dull.\nThe people are paying for a clean edge. They should get one.\nHere is the edge: I am not blunt tonight.\nI am known for how I finish a line. Watch the finish.\nThis stance is cut from one piece. No give at the joints.\nYou talk of technique like a glossy cover. Cut through it and show me the hold.\nStrikes are sharp, but a sharp edge needs a steady hand. Show me yours.\nA gamble should cut both ways. Yours cuts only one.\nStalling is a dull blade. It does not cut, it only drags.\nThe crowd is owed a clean cut, not a long apology. Give them one.\nYou want to be seen. Fine. I can see you, and I can see what you are hiding.\nI know your {strength} by its clean edge, and I will work round it.\nI have tested your {strength} against the stakes. It holds only until the stakes rise.\nYou stayed cool. Good. Cold is the one state I trust in people.\nFair. We cut to the same point. Now we cut together.\nI could cut you open with a word. I will keep the blade in its sheath.\nOne fall, cleanly done. Pin me, and the stakes are yours.\nOn the mat, the edges get close. Stay out of my reach.\nGrounded or standing, I still have the edge, and you do not.\nStay where I can see the cut. Then decide.\nA clean answer, cut straight. Now let us watch the cut open up.\nStill no answer. The quiet is what I notice most.\nThat is a clean point. Worth keeping, and worth the stakes.\nI accept that cut. We will see the rest in the ring.\nI will be fully committed until the bell. After that the stakes speak for themselves.\nMy approach is measured and cold. The result will cut clean on the night.\nWhatever happens, the cut will be honest.\nThe ending is not written yet. I like the cold of that.\nI have one more cut to show you. You will feel it when the bell rings.",
 "priya": "Technique, you call it. Again. Interesting. Which version of it did you practise?\nBrawling, is it? That is a prettier word than the version I saw.\nRisk, you told me. A gamble worth taking is one you can describe twice the same way.\nSlow pace. Lovely. Which pace do you mean, the one you announced or the one you use?\nThe people deserve a straight answer. I think I owe them one.\nI know what I said, and I can repeat it exactly.\nI am not the one who needs a crowd to tell me my value.\nLook at this pose. It says one thing, and I mean exactly that.\nYou claim technique. Repeat the claim, then show the evidence.\nStrikes, you said. Which strike, and when?\nYou called it a risk. I would call it a gamble with the wrong tone.\nSlowing down is a choice. You keep telling people you made it.\nThe crowd are owed the true version of this, not the flattering one.\nYou want to be among the best. Repeat that, and then tell me why.\nYou are proud of your {strength}. I have heard you say it before. I have heard you say it before, and it reads differently now.\nI have listened to your {strength} twice. The second time was more interesting.\nYou stayed level, the second time I noticed. Good, because calm is where I like to ask questions.\nRight, that is fair, I noted it. We agree on that, which is rare enough to note.\nI could ask you to explain that. I think you would rather not.\nOne fall, then, the way you said it. Repeat the terms once more, so there is no confusion about them later.\nOn the mat I will ask one question at a time. Answer each one.\nGrounded or standing, I will still be asking the same question.\nStay where you are and answer it properly.\nDecent answer. Now say it again, in the ring.\nDid you answer? I heard something close to one.\nRight, that is fair, I noted it. I shall note that for later.\nI take that on board. I will remember you said it.\nI will say the same thing at the finish as I have said here.\nMy approach is careful. I do not repeat myself unless I mean it.\nWhatever happens, the record will be correct.\nThe question is not closed. Only the bell will close it.\nI have one more question, and you will answer it when the bell goes."
};
 root.OfficePromoBankC3=Object.freeze(Object.entries(rows).map(([owner,body])=>{const texts=body.split('\n');if(texts.length!==slots.length)throw Error('Dialogue bank length: '+owner);return {owner,role:'wrestler',lines:slots.map(([stage,action,side,variant,category],i)=>({id:owner+'.c3.'+String(i+1).padStart(2,'0'),stage,action,side,category,text:texts[i],when:{hasMouthpiece:false,...(variant?{variants:[variant]}:{})}}))};}));
 // G4C.1: topic-gated, independently authored replies to unsupported charges.
 const evidenceReplies={
 "zara": [
  "Fair play. I can't give you an example, so I'm not going to make one up on the spot.",
  "Yeah, all right, that was a bit much from me. Let's talk about the match instead.",
  "There we go. That's all I wanted you to say. Now let's have a match.",
  "Right, leave that bit out, then. We've got enough to settle between the ropes."
 ],
 "dean": [
  "That's a fair objection. I haven't got a specific incident to put on the table, so I'll take it off the table.",
  "I'm not going to sell an allegation I can't substantiate. The better deal is to settle the sporting question.",
  "Good. Then we're discussing the contest, not an allegation. Much better terms.",
  "A reasonable distinction. Leave the unsupported part out of the agreement and let's wrestle."
 ],
 "malik": [
  "I can't point to anything that proves it. I can put you under pressure in the ring, but that is a different matter.",
  "You want specifics. I haven't got any that stand up. I won't hide behind an accusation when I've got a match to win.",
  "Good. You can leave that charge behind and bring your wrestling instead.",
  "I'll take that distinction. I want to test your ability, not your reputation for something you might not have done."
 ],
 "tori": [
  "I can feel the temperature rising in this room. That tells me nothing about whether the charge is true.",
  "You're asking for an observation, not a reaction. I can't give you one that proves it.",
  "Then let that particular spark go out. We've still got a match to light up.",
  "That's clearer. Let the heat come from the wrestling, not from a guess about you or me."
 ],
 "ace": [
  "I can give them a splendid performance, but I cannot produce an incident that proves the charge. That part of the act comes out.",
  "A flourish is not an explanation. You've asked for particulars, and I haven't any that stand up.",
  "Very well. Remove that from the bill. We still have a performance to give.",
  "Good. No need for a villain in that particular story. The audience came to see us wrestle."
 ],
 "rocco": [
  "No. I cannot prove that. I can fight you in the ring, not prove a guess.",
  "You want an example. I do not have one. Fine. Forget the charge.",
  "Fine. Leave it. Bring your fight.",
  "Good. No more heat from that. Bell."
 ],
 "aisha": [
  "No example. No proof. I withdraw it.",
  "Fair. I can't establish that. Not going to repeat it.",
  "Accepted. Leave it there. Wrestle.",
  "Good. Drop the charge. Stand your ground."
 ],
 "anya": [
  "You've found the weak edge of the argument. I cannot give you an incident that proves it.",
  "I won't keep cutting at you with a claim that won't stand up to scrutiny. That part goes.",
  "Clean correction. Leave that accusation out of the contest.",
  "Good. The words are settled. The stakes in the ring remain."
 ],
 "priya": [
  "If you asked me to repeat the charge and explain it, I couldn't give you a specific example that proves it. I won't repeat it.",
  "I've listened to your question. There isn't enough behind my accusation for me to stand by it.",
  "Noted. We can leave the allegation out of the discussion from now on.",
  "That's the answer I was asking for. Let's find out what the wrestling tells us."
 ],
 "faye": [
  "You're entitled to hold me to my exact words. I can't cite an incident that establishes them, so I withdraw that charge.",
  "The distinction is important: I made an allegation, not a finding. I have not proved it.",
  "Then the record is clear. The allegation is withdrawn, and I won't hold you to it.",
  "Noted, precisely. We can settle the sporting question without that claim."
 ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceReplies[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ev.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:j<2?'w':'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressReplies={
 "zara": [
  "They can judge what we actually deliver, not what either of us says beforehand.",
  "Let them see how we handle the pressure. That will tell them more than the accusation."
 ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidencePressReplies[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD2={
  "ace": [
    "The paying public will see who can turn the spotlight into a winning performance. That is the only billing I need.",
    "Watch the main attraction when the bell goes. A good pose is one thing; holding the other wrestler down is another."
  ],
  "aisha": [
    "Watch the strikes. Watch the count. No need for anything else.",
    "Who controls the bout? We can establish that in the ring. Enough talk."
  ],
  "dean": [
    "The result is the one item on the bill we can actually verify. Let us concentrate on earning it.",
    "I would suggest a rather simple test: who can turn control into a legal fall? The audience can check the figures."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidencePressRepliesD2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD5={
  "tori": [
    "Watch what happens when the pressure builds and neither of us can back away. That's the test.",
    "The crowd can see which of us turns all that energy into something that actually wins a fall."
  ],
  "anya": [
    "Cut away the talk. Look at the feet, the grip and the finish. Those are the things we can establish.",
    "The contest will show which of us has the sharper edge. It need not settle anything beyond that."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidencePressRepliesD5[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD6={
  "faye": [
    "Put the claim on the record, then watch whether the wrestling supports it. Anything else is conjecture.",
    "We can check who earns the fall and how. I won't put a conclusion in the record before the evidence."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidencePressRepliesD6[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD7={
  "malik": [
    "Watch who can keep the pressure on when the other one fights back. That's your proof.",
    "I'll show you what my strength is worth against yours. The result will be there for everybody."
  ],
  "priya": [
    "Repeat what you intend to prove, then let the crowd compare it with what you actually do.",
    "Which version shall we judge? I suggest the one that happens in the ring, where everybody can see it."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidencePressRepliesD7[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD8={
  "rocco": [
    "Let them see what happens when you meet resistance. A speech won't do that.",
    "I can show you what my wrestling is worth. The result will speak for itself."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidencePressRepliesD8[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE2={
  "aisha": [
    "Enough talk. What can you show them in the ring?",
    "Leave the charge out of it. What can you prove at the bell?"
  ],
  "anya": [
    "Cut away the accusation. What will be left for the people to judge in the ring?",
    "Strip it back to the wrestling. What can the finish establish?"
  ],
  "dean": [
    "Let us separate the speculation from the facts. What can the contest actually establish?",
    "The people deserve a straight answer on this. What can they judge for themselves at the bell?"
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceQuestionsE2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE4={
  "malik": [
    "Leave the accusation out of it. What can you show me when you're taking my best work?",
    "No more talk about proof. What can you demonstrate against me in the ring?"
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceQuestionsE4[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE5={
  "zara": [
    "Right, leave the rumour there for a second. What can we actually show them when we wrestle?",
    "Mate, they're here to watch us work. What can they see for themselves once the bell goes?"
  ],
  "ace": [
    "Ladies and gentlemen, you have heard the accusation. What can we actually demonstrate before this audience?",
    "Forget the gossip column. What can we put on tonight's show that the people can judge for themselves?"
  ],
  "faye": [
    "Leave the allegation off the record until it is supported. What can we establish from the match itself?",
    "What observable result can we give the people that they can check for themselves?"
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceQuestionsE5[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE7={
  "priya": [
    "Repeat only what you can substantiate. What can the people actually establish by watching this match?",
    "There is a difference between your version and the evidence. What can we demonstrate in the ring?"
  ],
  "rocco": [
    "Enough about the accusation. What can you show me in the ring?",
    "Talk is cheap. What can the crowd actually judge when we wrestle?"
  ],
  "tori": [
    "An accusation is static, not a result. What can we demonstrate when the pressure builds in the ring?",
    "Treat the match as the experiment, not a verdict on the rumour. What can the people observe?"
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceQuestionsE7[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const strengthCountersF1={
  "anya": [
    "You've seen the edge of my {strength}. Seeing the cut coming is not the same as turning it aside.",
    "Knowing where my {strength} are sharp doesn't make them blunt. You still have to deal with the contact."
  ],
  "faye": [
    "You have accurately quoted my {strength}. That establishes what you have to answer, not that you have answered it.",
    "Let the record be clear: you can name my {strength} without proving you can neutralise them."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (strengthCountersF1[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF2={
  "ace": [
    "Ladies and gentlemen, you've heard the plan for stopping my {strength}. Now watch what happens when I actually use them.",
    "You have studied my {strength} from your seat in the stalls. Try dealing with them when you're sharing the spotlight."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (strengthCountersF2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF5={
  "tori": [
    "You've built a circuit around my {strength}. Let's see where the current goes when you try to cut it off.",
    "Knowing how to contain my {strength} on paper won't tell you what happens when the pressure rises."
  ],
  "zara": [
    "Right, you've got a plan for my {strength}. Fair play. Let's see how much of it you remember when we're moving.",
    "Mate, you can talk about stopping my {strength} all you like. I'd rather find out whether you actually can."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (strengthCountersF5[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF7={
  "malik": [
    "You have a plan for my {strength}. Bring it to the ring and see how long you can stand behind it.",
    "You will have to do more than name my {strength}. I will make you work until that plan gives out."
  ],
  "dean": [
    "You've priced in my {strength}. I would allow for the cost of a failed defence as well.",
    "Your proposed answer to my {strength} sounds reasonable. Let us examine the terms when you are the one under pressure."
  ],
  "rocco": [
    "My {strength}. You know what's coming. Stop me, then.",
    "You've got an answer to my {strength}. Save it for the ring. I want to feel it, not hear it."
  ],
  "aisha": [
    "My {strength}. You've named them. Now stop them without excuses.",
    "You've prepared for my {strength}. Good. I decide the pace when we start."
  ],
  "priya": [
    "Repeat your answer to my {strength} after the first exchange. I wonder which words you will change.",
    "You've described my {strength} accurately enough. I will be watching for the difference between your account and what actually happens."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (strengthCountersF7[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const evidenceAcknowledgementsG1={
  "dean": [
    "Fair enough. A claim without something to substantiate it is not a sound basis for the argument.",
    "I accept that condition. Let us judge what we can actually establish in the ring."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceAcknowledgementsG1[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceAcknowledgementsG2={
  "tori": [
    "Point taken. A theory needs a result before we call it a fact.",
    "Fair. Let's keep the speculation out of the circuit and see what happens under pressure."
  ],
  "anya": [
    "Fair. Cut away what we cannot establish.",
    "I accept the distinction. Keep the facts; leave the rest."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceAcknowledgementsG2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceAcknowledgementsG3={
  "faye": [
    "Noted for the record. An unsupported allegation establishes nothing.",
    "I accept that distinction. Let the record reflect only what can be verified."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceAcknowledgementsG3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceAcknowledgementsG4={
  "priya": [
    "I'll note that distinction. What was said is not necessarily what happened.",
    "Fair correction. I shall keep to what can actually be substantiated."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceAcknowledgementsG4[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceAcknowledgementsG6={
  "malik": [
    "Fine. If it hasn't been shown, I won't sell it as something that has.",
    "You have a point. I came to do the work, not manufacture a record."
  ],
  "rocco": [
    "Sure. No sense calling a thing proven when it's still got to be done.",
    "I'll give you that much. Put the rest to the test in the ring."
  ],
  "ace": [
    "Very well! Even a master of ceremonies cannot announce a result before it exists.",
    "I grant the correction. Let the audience witness the spectacle rather than take my account on faith."
  ],
  "zara": [
    "Yeah, you're right. I got a bit ahead of myself there, didn't I? Can't prove that bit.",
    "Fair enough! We'll give them something they can actually see instead."
  ],
  "aisha": [
    "Correct. Unsupported. Drop it.",
    "Accepted. Show the result; don't invent one."
  ]
};
 for(const pack of root.OfficePromoBankC3)for(const [j,text] of (evidenceAcknowledgementsG6[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ea.'+String(j+1).padStart(2,'0'),stage:'push',action:'acknowledge',side:'w',category:'respect',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const experienceRepliesH4={
  "aisha": {
    "w": [
      "Years earned. Fine. No head start at the bell.",
      "Your experience is yours. The next exchange is ours."
    ],
    "f": [
      "Experience tells me when not to commit. Make me change my mind.",
      "I've learned to recognise an opening. You still have to close it."
    ]
  },
  "anya": {
    "w": [
      "Years can sharpen a blade. They can also wear it down. Let's see which edge you bring.",
      "Experience is a useful instrument. I will judge the cut it makes, not its age."
    ],
    "f": [
      "Practice teaches you the feel of a clean edge before the cut begins.",
      "A new angle is no reason to lose the edge. Experience teaches you to adjust the pressure."
    ]
  }
};
 for(const pack of root.OfficePromoBankC3)for(const side of ['w','f'])for(const [j,text] of (experienceRepliesH4[pack.owner]?.[side]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ex.'+side+'.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side,category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'experience'}});
 const experienceRepliesH5={
  "dean": {
    "w": [
      "Experience is a relevant consideration. It does not establish that your proposed approach will work against mine.",
      "Your record of learning is not in dispute. The application of it is what we have to examine."
    ],
    "f": [
      "Experience lets me assess the likely cost of a decision before I commit to it.",
      "A different problem does not invalidate the principles I've learned. It means I have to apply them carefully."
    ]
  },
  "faye": {
    "w": [
      "Let the record show your experience. It does not establish the outcome of this match.",
      "Years of practice are admissible as preparation, not as a verdict in your favour."
    ],
    "f": [
      "Experience has taught me to distinguish an opening from an invitation to make a mistake.",
      "I can revise my approach when the facts of the exchange change. That is what the years have bought me."
    ]
  }
};
 for(const pack of root.OfficePromoBankC3)for(const side of ['w','f'])for(const [j,text] of (experienceRepliesH5[pack.owner]?.[side]||[]).entries())pack.lines.push({id:pack.owner+'.c3.ex.'+side+'.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side,category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'experience'}});
})(typeof window!=='undefined'?window:globalThis);
