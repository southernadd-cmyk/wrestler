/* Phase 5E, batch 5: established wrestlers without banks. Individually authored text, stable slot IDs. */
(function(root){'use strict';
 const slots=[["open","proof","w","pr_tech","opening"],["open","proof","w","pr_brawl","opening"],["open","proof","w","pr_risk","challenge"],["open","proof","w","pr_stall","opening"],["open","people","w","p_working","opening"],["open","people","w","p_short","opening"],["open","swagger","w","sw_main","opening"],["open","swagger","w","sw_pose","opening"],["open","proof","f","pr_tech","challenge"],["open","proof","f","pr_brawl","challenge"],["open","proof","f","pr_risk","rebuttal"],["open","proof","f","pr_stall","rebuttal"],["open","people","f","p_working","respect"],["open","swagger","f","sw_main","disrespect"],["answer","turn","w","tu_strength","rebuttal"],["answer","turn","w","tu_strength","rebuttal"],["answer","calm","w","ca_pro","respect"],["answer","calm","w","ca_simple","respect"],["answer","calm","w","ca_restraint","pressure"],["answer","challenge","w","ch_one_fall","challenge"],["answer","challenge","w","ch_mat","challenge"],["answer","challenge","w","ch_ground","challenge"],["answer","challenge","w","ch_stay","challenge"],["answer","calm","f","ca_pro","respect"],["push","press","w",null,"pressure"],["push","acknowledge","w",null,"respect"],["push","acknowledge","f",null,"respect"],["close","vow","w","vo_hard","closing"],["close","vow","w","vo_plain","closing"],["close","clean","w","cl_middle","closing"],["close","uncertainty","w","un_done","closing"],["close","uncertainty","w","un_plan","closing"]];
 const rows={
 "dev": "Let me say this plainly. Nobody in this room needs to be frightened tonight. Everybody needs to be ready.\nBrawling is fine when the people around you can walk home afterwards. That is my test.\nA risk falls on whoever is least able to refuse it. Let us keep that in mind.\nPace is a decision I share with the people I am responsible for. Tonight, I share it with you.\nThe people deserve a match that is looked after from the first bell to the last. That is my job.\nThe opportunity is real, and I am here to protect it.\nI have worked for every bit of this, and I want the young people around me to have the same chance.\nLook at the stance; it is sound. It is calm, and it is the way I want the young ones to stand.\nYou bring up technique, and it matters. Show me a hold you could teach to someone who has never done it.\nStrikes are part of the lesson. Land them clean, and nobody gets hurt for the sake of it.\nA risk I take is one I can explain to everyone who relies on me. Can you do the same?\nA stall is a waste of the opportunity. I would rather you did not waste it.\nThe people want a match they can trust. Give them one, and I will do the same.\nYou call me a passenger. I am the one who takes responsibility when it matters.\nYou are proud of your {strength}. Keep it steady for the young ones. That is fine. Be proud of it without putting anybody at risk.\nI have been thinking about your {strength}, and I want to find a way to meet it that keeps everybody safe.\nYou held firm. Good. Sensible. Calm is how you look after the people in the next match.\nYour point is taken. We agree on that, and that is a good place to start.\nI could give you a hard time about that. I would rather give you a fair one.\nOne pin, and the team is safe. Keep me down, and I will say you did it fairly.\nOn the mat I will look after you, and I will expect you to look after me.\nGrounded or standing, the job is the same: nobody gets hurt for the sake of a moment.\nStand where I can see you. I want to see your best, and I want to see you safe.\nA better answer, thank you. I can build on that.\nYou have sidestepped the question. Take your time, and then give me something solid.\nYour point is taken. I will take that on board.\nI will let that stand. We will settle it at the bell.\nI will wrestle this match with care, and I will make sure we both leave in good order.\nMy approach is steady and fair. You will see it on the night, in the right way.\nWhatever happens, I want everybody who looked up to me to be proud of how I acted.\nThe responsibility is still open. There is still a responsibility on the table.\nI have one more thing to say, and you will hear it when the bell rings.",
 "liya": "The surprise is for the people watching. Not for the person catching me.\nBrawling is a bit of a laugh, honestly. I still like to know where everybody is.\nRisk? I do love a bit of risk. I just like to know where the mats are first.\nTaking it slow is not my natural speed, but I can do it if you ask nicely.\nThe people are the best bit of my week. I want them to see something they did not expect, and to know I meant it.\nQuick one: I am ready, and I am nervous, and both things are true.\nI am not the headline, but I have been practising the bits that matter.\nLook at this stance, I practised it. Relaxed on the outside, careful on the inside.\nYou are big on technique. Show me one thing you are sure of, and then I will show you mine.\nStrikes are fine. I just want to know they are going to stop where I expect them to.\nRisk, to me, is fun when it has been thought about. Have you thought about yours?\nA stall is not much of a surprise. I would rather you tried something.\nThe people deserve a bit of joy, and some honest preparation. I want to give them both.\nYou say I am reckless. I am not. I just do not like being predictable.\nYou are proud of your {strength}. Good, I am glad. I want to see it working. Right, then, honest. I am glad. I want to see it working tonight.\nI have been looking at your {strength}, and I think there is room for a little surprise in it.\nSteady, honestly impressive. Lovely. I will try to keep you laughing, which is harder than it sounds.\nAgreed, for now, promise. We both want the same thing from the evening.\nI could make a joke about that. I will, but I will also mean it.\nOne fall, the surprise can wait. Keep me down, and I will be very impressed and a bit embarrassed.\nOn the mat I will be quick and careful, and you will have to keep up.\nGrounded or standing, I am still here, and I am still prepared.\nLook at me, the fun starts now. I want to see what you have got before I do anything daft.\nThat was a fine answer, truly. You have made me think, which is annoying.\nYou have not replied yet, and I wait. I will wait, but I am getting a bit impatient.\nAgreed, for now, promise. I will take that as a sensible point.\nThat is a fair point, I will take it kindly. We will see at the bell.\nI will give this match everything I have, and I will be careful while I do it.\nMy approach is playful and prepared. You will see both on the night.\nWhatever happens, I want you to know I took it seriously.\nI am not done with the fun yet. There is one more thing I have been practising.\nI have one more surprise for you, and I promise it is a safe one. You will see when the bell rings.",
 "emmett": "Three things matter here. Turning up, listening, and knowing which of the first two you forgot.\nBrawling: one, it works; two, it has a cost; three, you should know both before you start.\nA risk: one, the probability; two, the cost; three, whether you are willing to pay it.\nPace: one, the plan; two, the reason; three, who is listening to it.\nThe people: one, they came; two, they paid; three, they deserve a clear result.\nI know the standard, and I will hold to it.\nThree things I can offer: a clear plan, a steady hand, and an honest account afterwards.\nStance: one, feet set; two, weight low; three, ready to move when the bell goes.\nTechnique, item one. Name the first step, the second step, and the reason for the third.\nStrikes: one, the mechanics; two, the target; three, the reason you chose it.\nA gamble without a plan has no value. Give me your plan in three points.\nA stall: one, it wastes time; two, it annoys the crowd; three, it is not my method.\nThe people want a contest with three honest parts: a start, a middle and a finish.\nYou say I am irrelevant. I can list three ways I am still useful. Would you like them?\nYou are proud of your {strength}. Item one, as it happens. Okay. Here is the correction: it works only if the second half is sound.\nI have listed your {strength}. One: it is real. Two: it has a gap. Three: I know where it is.\nCalm, item two. Okay. That is one of the three things I expected you to do.\nThat lands, item three. That is the first correction agreed. We can move on.\nI could list all the problems with that. I will mention only one.\nOne count, that is the list. Three conditions: clean, clear, and over before the bell. Keep me down and you meet them.\nOn the mat I will count every movement. One, two, three. Stay with me, step by step.\nGrounded or standing, the rule is the same. Stay inside the standards.\nStay, and face me, next on the list. Show me one good move, then another, then a third.\nA proper answer, in order. That is the first point I accept.\nThe question is item four, and still open. I asked for three things. You have given me none.\nThat lands, item three. Noted, and filed.\nThat I accept, as item one. We will settle the rest at the bell.\nI will wrestle this match to the standard. One, I will be careful. Two, I will be honest. Three, I will finish.\nMy approach is methodical. You will see it on the night, in order.\nWhatever happens, there will be a clear record of what happened.\nThere are two more items to come. There is one item left on the list.\nI have one item left, and you will hear it when the bell rings.",
 "nadia": "A spark gets your attention. I am interested in what keeps the room lit.\nBrawling is a fire that needs air. Let me show you where the air is.\nRisk, to me, is a match struck in a dark room. Make sure you know where you are standing.\nPace is the flame, not the spark. Let me choose how high it burns.\nThe people are the room, and I want them to feel the heat from the front row to the back.\nI am here to light up this place, and I am not going to dim.\nI want to be the headline people talk about after the lights go down.\nWatch the stance light up. It is the moment before the flash.\nYou are big on technique. Show me one move that lights up the room, and then tell me you can repeat it.\nStrikes are sparks. The question is whether you can keep the fire going after them.\nRisk, to me, is worth it if the crowd can see it coming and wants to see it land.\nA stall puts the room to sleep. I will not let that happen.\nThe people deserve a match that keeps them lit from the first bell to the last.\nYou call me a trend. I am a flame that keeps burning, and I can show you why.\nYou are proud of your {strength}. Good. It is bright. It is bright. Let me see if it lights up the whole room.\nI have seen your {strength}, and I think it burns hot at the start and cools too quickly.\nSteady, like a steady flame. Right, then, light it. Calm does not burn bright, but it does keep the fire from spreading.\nAgreed, for now, the spark holds. We agree on what the room wants.\nI could set fire to that comment. I would rather let it burn out on its own.\nOne fall, one spark. Keep me down, and the room will remember the spark.\nOn the mat, the heat is close. Stay close, and feel it.\nGrounded or standing, the flame stays lit.\nKeep your eyes on the flame. The room is watching, so give them something to watch.\nFine spark of an answer. The room lit up for that one.\nYou have not lit a reply yet. The room is waiting for the flame.\nAgreed, for now, the spark holds. That is the kind of spark I want.\nFair spark, I take it. We will see how bright it burns at the bell.\nI will give this match everything I have, and I will keep the room lit to the end.\nMy approach is bold. You will see the fire on the night.\nWhatever happens, the room will remember how it looked.\nThe fire is not out yet. The flame is still burning.\nI have one more spark, and you will see it when the bell rings.",
 "leandro": "I can wait for the right moment. I just wish the right moment would hurry up.\nBrawling is fun. Then I get bored, and I want the next thing straight away.\nRisk! Go on, then. Let us see who blinks first.\nSlow? Not on my watch. Okay, fine, a little bit slow. Then it's my turn.\nThe people have waited long enough for a good match. Let's give it to them now.\nI am here, and I am impatient, and both of those are my fault.\nI want the highlight. I also want to learn how to do the bit in between. Sorry, I'm rambling.\nStance, ready, go. Ready. Ready. Ready. Okay, go on.\nTechnique, yes, yes, what next? Right. Show me one, and I will show you one faster.\nStrikes are great, I love them. Could we get to them any sooner?\nA bet is a rush. I know. I am still going to take it.\nA stall? Ugh. Come on. Move. I am bored already.\nThe people want a contest with a bit of heat. Let's give them some heat.\nYou say I am overlooked. Overlooked is the word for people who did not turn up. I did.\nProud of your {strength}? Good. Right, next. Sensible. I am proud of mine too. Shall we see whose wins?\nI have been waiting to see your {strength}. Right, are you going to show it now or later?\nYou did not flinch, nice! Sensible. I am not calm. I am going to try, I promise.\nGot it, point taken! Okay. Yes. We agree. Can we move on, please?\nI could say something quick about that. I will. Then I will stop, I promise.\nOne pin, go! Keep me down, and I will be annoyed, and then I will shake your hand.\nOn the mat I will be quick. You will have to stay with me.\nGrounded or standing, I am still moving, and I am not sitting down.\nStay in front of me, then, and stop looking at the clock.\nBetter, finally! Yes, that. Right, next.\nYou are dodging, come on. Come on, answer. I am waiting.\nGot it, point taken! I hear you. Let us get on.\nFine, allowed, go on. See you at the bell, and I mean it this time.\nI will give this match everything I have, and I will try to slow down for the important bits.\nMy approach is keen. You will see it on the night, and I will try to be patient in the middle.\nWhatever happens, I want to know what happens next.\nThe job is still open. I am not done yet, and neither are you.\nI have one more thing, and you will see it when the bell goes. Go on, ring it.",
 "iris": "What are you planning for the landing? That is the bit you have not sold me.\nBrawling is a habit that needs a plan. What is yours after the first big move?\nA gamble is a choice about what happens next. Tell me what happens next.\nSlow is a decision I respect. Make it on purpose, and I will respect it more.\nThe people deserve a match that is looked after, and I want to look after it with you.\nI have seen what happens when the plan is missing. Make sure yours is not.\nI have been around long enough to know what a good plan looks like. This is not yet a good plan.\nWatch your stance, and where your weight goes. Balanced. Fine. Now tell me where the weight goes after it.\nTechnique, and what happens after it? Tell me what you do when the first attempt does not land.\nStrikes are part of the job. Know what they set up, and know what you do after.\nA gamble without an exit plan is only a hope. What is your exit?\nA stall gives you time to think. Use it to think about the next moment, not to hide.\nThe people want a contest with a clear ending. Make sure you can deliver one.\nYou say I am a worrier. I am a person who checks the landing. Those are different things.\nCareful with your {strength}, and proud of it. Fine. Be proud of it, and be careful with it.\nI have watched your {strength}, and I would like to see what you do when it goes wrong.\nYou stayed level. Good, so far. Fine. That is the single most useful thing you can do on a night like this.\nThat is sensible, I suppose. That is a good plan, as far as it goes. Keep going.\nI could argue about that. I would rather ask what happens after it.\nOne fall, and then the real question. Keep me down. Then tell me how you will get off me.\nOn the mat, the plan matters more than the move. Tell me the plan.\nGrounded or standing, what happens next is your responsibility.\nStay in front of me, and show me the next step before you take it.\nA sensible answer, so far. That is the sort of thing I want to hear.\nNo answer on the landing yet. What happens next? Tell me that much.\nThat is sensible, I suppose. That is a sensible point, and I will hold you to it.\nI hear the warning in that. We will check the landing at the bell.\nI will wrestle this match with a clear plan, and I will not leave the landing to chance.\nMy approach is careful about the landing. You will see the plan on the night.\nWhatever happens, I want to be sure you are all right afterwards.\nThis is not over. The plan is still open.\nI have one more question, and you will answer it when the bell rings.",
 "kellan": "I have got a better idea. No, wait. I have got one good idea.\nBrawling? Yes! No. Yes. Okay, I will show you.\nRisk, risk, risk. I like it. Sort of.\nSlow? That is brave. I will try.\nThe people have been great. Let us give them something to scream about.\nQuick: I am here. Done. Next.\nI want the reaction. The good one, the big one, the one that gets people on their feet.\nLook at this. Ready, ready, ready. Okay, I am ready.\nTechnique, whatever that is! Show me one thing and I will show you a better one.\nStrikes are brilliant. Keep your head down and your hands up.\nA gamble is a dare. I like dares. Not the dangerous kind, though.\nA stall? Boring! Ugh. Move.\nThe people want a reaction. They are going to get a good one.\nYou call me predictable. Right. Watch this. Oh, I just did it again.\nProud of your {strength}? Nice, nice! Nice. Mine is better. Probably.\nI have been watching your {strength}. Got a thing in mind for it. Just a small one.\nLevel! Nice! Fine. I am going to try to be calm too. Give me a second.\nYep, fair, yep! Yep. That is one thing we agree on.\nI could come back with something clever. I have got one. I will save it.\nOne fall, go! Keep me down and I will be amazed. Properly amazed.\nOn the mat I will go fast and then slow down. Sort of.\nGrounded or standing, I am still bouncing. Sorry.\nStay in front of me, and let us see what happens.\nGood answer, kind of. I liked that. Really.\nStill waiting, come on. Go on, you can do it.\nYep, fair, yep! Got it. Right.\nNoted, got it! Bell time, see you!\nI will give this match everything, and I will keep my head on while I do it.\nMy plan is one good idea. Be exciting, be safe, and remember to breathe.\nWhatever happens, I want you to know I had a good time.\nThis is not over. I have got one more idea. It is a good one.\nI have one more trick, and you will see it when the bell goes. Honest.",
 "ayla": "A match does not have to burn brightest at the start. Let the flame grow.\nBrawling is a short line in a long story. Let me show you where the story goes.\nA gamble is a turn in the plot. I will take it, and you will feel it.\nSlow is a long breath before the next scene. I am happy to take one.\nThe people came to hear a story. Let me tell it well.\nThis is a story, and it has a beginning, a middle and an end.\nI am the one telling this story tonight, and I want to tell it carefully.\nRead the stance like a line in a story. It is the first line of the scene.\nTechnique, you name it, as if it were a plot point. Show me the line in the story where it matters.\nStrikes are the drama. The meaning is in what they change.\nA risk in a story is only worth it if it changes the ending. Will yours?\nA stall is a pause with nothing to say. I would rather tell the story.\nThe people deserve a story that is patient and earned. The crowd should have that.\nYou want a cheap reaction. I would rather give them a true one.\nI want to follow the line of your {strength}. It is a good line. Let me show you where it leads.\nI have been reading your {strength} like a line in a book, and I know where the story turns.\nYou kept the scene steady. Fine. Calm is a line that changes meaning as the story goes on.\nFair. The scene allows it. That is a good line, and I will keep it in the story.\nI could write a cruel line about that. I would rather write a true one.\nOne fall ends the chapter. The story closes on the count. Keep me down, and it will be your ending.\nOn the mat we are in the middle of the story. Read on with me.\nGrounded or standing, the story keeps going.\nFace me. This is the part where you show me what you are.\nA passable line. It is the right line.\nThe next line is still blank. The story is waiting for the line.\nFair. The scene allows it. I will carry that line forward.\nThat line goes into the story. The ending is still to be written, and we will write it at the bell.\nI will tell this match with patience, and I will let it end where it has to.\nI tell this patiently. You will see the story on the night.\nWhatever happens, the story will mean something.\nThe story is not over. The next line is still to come.\nI have one more line, and you will hear it when the bell rings.",
 "sasha": "You got the laugh. What are you going to do with the silence afterwards?\nBrawling gets a laugh from up front. It is the back of the room that I am really playing to.\nDanger is funnier when the crowd does not know it is coming. I know. I have been watching them.\nSlow gets a different reaction. I like it. The crowd gets to wonder what I am doing.\nThe people are the best audience in the building. I can tell, because they are laughing at the right moments.\nI can read the room, and right now the room is with me.\nI am not the punchline. I am the one telling the joke, and I know the timing.\nMark that stance, for the people up front. Watch the crowd react. That is the bit I wanted to show you.\nTechnique, the crowd will love it. Okay. Show me the technique, and I will show you the reaction.\nStrikes get a noise. The crowd always makes the noise. I like to be the one who causes it.\nDanger is a joke with a dangerous punchline. Make sure you know the ending.\nA stall is a pause with nothing funny in it. The crowd knows.\nThe people want to be part of the match. Let them in.\nYou try to steal the audience. I think you will find they are still looking at me.\nProud of your {strength}? The crowd is still deciding. Okay. I can see the crowd is not as impressed as you are. Yet.\nI have been watching the crowd react to your {strength}. Some of them are yawning.\nCool head, that. Okay. A calm person makes the crowd laugh more when they break.\nThat gets a laugh. The crowd agrees with you there, and so do I.\nI could make a joke about that. The crowd would love it. I will save it for them.\nOne count, for the joke. Keep me down, and I will make the crowd laugh about it afterwards.\nOn the mat, watch the crowd. They will tell you when you are getting it right.\nGrounded or standing, the crowd is still with me.\nStay here and face me. The crowd is waiting to see what you do next.\nA proper answer. The crowd liked that. So did I.\nThe punchline is still open. The crowd has noticed, and so have I.\nThat gets a laugh. That is a moment the crowd will remember.\nThat line gets my nod. We will see how the crowd feels at the bell.\nI will wrestle this match for the crowd, and I will make sure they enjoy it.\nMy approach is playful and sharp. You will see the crowd respond on the night.\nWhatever happens, I want the crowd to remember the moment.\nThere is more to come. The crowd is still watching.\nI have one more trick for the crowd, and you will see it when the bell rings.",
 "morgan": "That is a different offer. The answer to that one is no.\nBrawling costs money. Whoever pays for it should know the figure before the bell.\nNerve is a price. I want to see the figure before I pay it.\nPace is leverage. I do not give leverage away, and I do not lend it.\nThe people are the ones who pay most in this building. They deserve a straight figure.\nMy position is set, and it does not move for a comment from the floor.\nMy position is secured by leverage I have built. I am not going to hand it over.\nTake the stance as a figure. It is the stance of someone who reads the small print before the signature.\nTechnique is a line item. Name a price for it, and I will tell you what it is worth to me.\nStrikes come at a cost. Nothing beyond the price is on the table.\nA risk I did not choose is not a risk I will carry. Make it yours, or drop it.\nA stall is a slow leak in the deal, and I do not let them run.\nThe people deserve a contest with a clear price. I will insist the figures are shown.\nYou say I am irrelevant. My position is secured by leverage, and I intend to keep it.\nProud of your {strength}, fine. Name the price you want for it. Fine. Name the price you want for it, and I will answer that.\nI have priced your {strength}, and it comes in below the figure you quoted.\nComposed, and priced in. Well priced. Calm is cheaper than a scene, and I respect the saving.\nNoted. That is a figure I can work with, and I have noted it.\nI could refuse outright. I would rather name my price and leave it there.\nOne fall, one price. Keep me down and the room is yours. Simple as that.\nOn the mat, the price does not change once we start. Stay with the number.\nGrounded or standing, my answer does not change without a better offer.\nStay in front of me and meet the number in full.\nThat answer is within the figure. It meets the price.\nNo figure from you yet. The room is waiting for a figure, and so am I.\nNoted. That figure is noted.\nFair figure. We will settle the bill at the bell.\nI will wrestle this match for the figure we discussed, and I will finish it properly.\nMy approach is precise. I say what I will take, and I stand by it.\nWhatever happens, the books will show what was paid.\nThe price is not yet fixed. One line remains open.\nI have one more figure to name, and you will hear it when the bell rings."
};
 root.OfficePromoBankC7=Object.freeze(Object.entries(rows).map(([owner,body])=>{const texts=body.split('\n');if(texts.length!==slots.length)throw Error('Dialogue bank length: '+owner);return {owner,role:'wrestler',lines:slots.map(([stage,action,side,variant,category],i)=>({id:owner+'.c7.'+String(i+1).padStart(2,'0'),stage,action,side,category,text:texts[i],when:{hasMouthpiece:false,...(variant?{variants:[variant]}:{})}}))};}));
 // Topic-gated, independently authored replies to unsupported charges.
 const evidenceReplies={
 "emmett": [
  "There are two separate matters here. What I suspect, and what I can establish. I can only put the second on the record.",
  "Point one: I owe you an example. Point two: I haven't got one. Strike that item from the discussion.",
  "Item removed. Now we can discuss the work that actually needs doing.",
  "That's a better account. Keep the speculation off the list and the match on it."
 ],
 "dev": [
  "I'm supposed to keep people safe, including from a charge I can't establish. I shouldn't have made that one.",
  "I can ask you to take care in the ring. I cannot claim you did something without a proper example.",
  "Then leave the accusation there. We'll keep our minds on looking after each other when we wrestle.",
  "That's fair. We don't need an unsupported charge to make this a serious contest."
 ],
 "iris": [
  "That's a fair question. I haven't got an example that establishes the danger I implied.",
  "I won't make a judgement about your conduct without something solid behind it. I can still ask for a safe contest.",
  "Good. Leave the accusation behind us. We'll pay attention to what happens in the ring.",
  "Then we can concentrate on the match. That's a better place to judge how we handle ourselves."
 ],
 "kellan": [
  "Okay, hang on. I haven't actually got an example, have I? Right. Forget that bit.",
  "No, you're right. I can't prove that. I've got something I can try at the bell, though.",
  "Good! Sorted. Now we can get on with the bit we came here for.",
  "Right, leave that there. Let's see what happens when we actually wrestle!"
 ],
 "morgan": [
  "You want something that would stand up to scrutiny. Fair. I haven't got it, and I won't put a price on a claim I can't support.",
  "A charge without evidence is a bad investment. I withdraw it. There's still a match worth having.",
  "Good. Take that off the table. We can negotiate nothing about the result once the bell goes.",
  "That's a fair correction. The wrestling will be the only thing that settles our contest."
 ],
 "ayla": [
  "That was a line I shouldn't have written. I have no example that makes the accusation true.",
  "I want to tell the truth about this match, not invent a chapter about you. I'll leave that charge out.",
  "Good. That part of the story doesn't belong here. The ending is still ours to wrestle for.",
  "That's a better place to start. No invented history between us."
 ],
 "nadia": [
  "I let the argument flare up. I can't point to anything that proves the accusation, so I'll take it back.",
  "That was heat, not proof. I haven't established the charge. The match can speak for itself.",
  "Good. Let that argument cool. We've still got a room to light up.",
  "Fair enough. Keep the fire for the wrestling, not an unsupported charge."
 ],
 "sasha": [
  "Turns out that wasn't much of a punchline. I can't give you an example that backs it up.",
  "I'd rather get a laugh at my own expense than make a false charge about you. Scrap that bit.",
  "Good. We can retire that particular joke before the bell.",
  "Fair play. Now give these people something worth cheering for."
 ],
 "liya": [
  "Well, that was a leap I shouldn't have made. I haven't got a proper example to back it up.",
  "I like a surprise, not an invented story about you. Fair question; I can't establish that charge.",
  "Fair enough! Let's leave that bit behind and find out what surprises the match brings.",
  "Thank you for clearing that up. Now we can have some fun without that hanging over us."
 ],
 "leandro": [
  "Right, you caught me rushing again. No example that proves it. Take that bit out.",
  "I can't back it up, okay? I want to wrestle you, not spend the evening inventing an argument.",
  "Got it. Charge dropped. Next thing, the bell.",
  "Fine, we're past that. Come on, let's get to the wrestling."
 ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidenceReplies[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.ev.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:j<2?'w':'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressReplies={
 "emmett": [
  "They'll see how we handle ourselves when there's nowhere to hide. That's the evidence I want.",
  "We can show them who keeps working when the match gets difficult. The rest is talk."
 ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidencePressReplies[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD2={
  "dev": [
    "They'll see if we can work hard without losing sight of our responsibilities to each other.",
    "The referee and the crowd can judge what happens in the match. We don't need to put anyone's character on trial."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidencePressRepliesD2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD3={
  "kellan": [
    "Okay, test it! First bell to last bell. They'll see if my ideas actually work.",
    "Who gets caught out? Who gets back up? There, two things we can find out!"
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidencePressRepliesD3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD5={
  "ayla": [
    "They can watch how the contest unfolds and judge the ending for themselves. We haven't written it yet.",
    "Let the match tell its own story. What we do in the difficult moments will mean more than an accusation."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidencePressRepliesD5[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD6={
  "iris": [
    "Watch what we do when the first plan fails. The next decision will tell them something useful.",
    "They can judge whether we keep control of the match when things change. That's the part I want to test."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidencePressRepliesD6[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD7={
  "leandro": [
    "Can we find out in the ring? I want to see which of us gets to the next move first.",
    "Come on, the crowd can watch whether I keep that pace when you actually stop me. That's the bit I want."
  ],
  "liya": [
    "They can see if I land the things I've been practising when you're trying to stop me. I'm excited to find out.",
    "Let's give them something surprising that we can both stand behind. The match can show whether it works."
  ],
  "morgan": [
    "The result is on the table. Let us see who can deliver what they have offered.",
    "The audience paid for a contest, not an unverified claim. We can settle the wrestling on those terms."
  ],
  "nadia": [
    "Watch who keeps the room alive once the opening spark has gone. The match will tell them.",
    "The crowd can see whether I turn that first flash into a performance that lasts until the bell."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidencePressRepliesD7[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD8={
  "sasha": [
    "The punchline comes after the setup. Watch what happens when one of us stops the other getting there.",
    "The crowd can decide who delivered the better act. I'd rather give them a finish than another bit of gossip."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidencePressRepliesD8[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE1={
  "emmett": [
    "Three things: what we can demonstrate, what the referee can judge, and what the result establishes. Which of those can we settle in the ring?",
    "One, leave the allegation aside; two, agree on a test. What can the match actually establish?"
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidenceQuestionsE1[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE2={
  "ayla": [
    "Let the allegation end here. What can the next chapter, the match itself, actually tell us?",
    "The ending has not been written. What can we show these people before it arrives?"
  ],
  "dev": [
    "Let us give these people something they can judge for themselves. What can we demonstrate together in the ring?",
    "What can we show the young ones about doing this properly, without relying on an allegation?"
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidenceQuestionsE2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE3={
  "iris": [
    "Leave the allegation here. What can we demonstrate when the first plan has to change in the ring?",
    "What can the people judge about the way we handle the match once it actually starts?"
  ],
  "liya": [
    "I'd rather give the people something they can see for themselves. What can we show them in the ring?",
    "Okay, leave that bit alone. What can we actually find out when we wrestle each other?"
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidenceQuestionsE3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE4={
  "nadia": [
    "Leave the rumour in the dark. What can we show the room when the lights are on us?",
    "The accusation is a spark, not a result. What can the people actually see us accomplish in the ring?"
  ],
  "sasha": [
    "That's enough material for the comedy club. What can we actually show the crowd when we wrestle?",
    "Let's save the punchline for the finish. What can the people judge for themselves before we get there?"
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidenceQuestionsE4[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidenceQuestionsE6={
  "kellan": [
    "Right! Forget the rumour. What can we actually show them?",
    "A reaction, yes! But what can the wrestling itself establish for the crowd?"
  ],
  "leandro": [
    "Enough talk, come on. What can we actually show them when we get moving?",
    "Leave that accusation here. What can the crowd learn from the next thing we do in the ring?"
  ],
  "morgan": [
    "An allegation has no value until it is backed up. What can this contest actually establish?",
    "Set the claim aside. What can we deliver in the ring that the paying audience can judge?"
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (evidenceQuestionsE6[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.eq.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'w',category:'pressure',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const strengthCountersF1={
  "emmett": [
    "Three things: you've identified my {strength}, you've planned an answer, and you've yet to apply it.",
    "Item one: my {strength} are still part of the contest. Item two: your answer has to work when I use them."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (strengthCountersF1[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF2={
  "ayla": [
    "You have read the opening chapter on my {strength}. You have not written the ending.",
    "My {strength} give you a problem at the beginning of the story. Your answer may change the plot, but so may mine."
  ],
  "dev": [
    "You've thought about my {strength}, which is good preparation. Now show me you can answer them without losing control of the contest.",
    "I will use my {strength} responsibly. You still have to do your own work to meet them."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (strengthCountersF2[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF3={
  "iris": [
    "You've planned for my {strength}. Good. Have a second answer ready when the first one doesn't work.",
    "Knowing about my {strength} gets you to the first exchange. Make sure your plan gets you through the next one as well."
  ],
  "kellan": [
    "Nice! You've got an answer to my {strength}. Right, I've got another idea for when you try it.",
    "You know my {strength}, brilliant! Now try keeping up when I change things halfway through."
  ],
  "leandro": [
    "Good, you've planned for my {strength}. Can we get to the bit where you try stopping them now?",
    "You've got an answer to my {strength}, fine. I've already got another thing in mind. Come on, let's go."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (strengthCountersF3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
 const strengthCountersF4={
  "liya": [
    "You've got an answer to my {strength}? Lovely. I've practised a few ways to surprise you without making a mess of the match.",
    "I know you've been preparing for my {strength}. That's the fun bit: finding out whether I can still surprise you."
  ]
};
 for(const pack of root.OfficePromoBankC7)for(const [j,text] of (strengthCountersF4[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.c7.sc.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'strength'}});
})(typeof window!=='undefined'?window:globalThis);
