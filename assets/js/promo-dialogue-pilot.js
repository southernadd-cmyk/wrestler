/* THE OFFICE — hand-written pilot bank. Each tuple is an exact graph slot,
   approved variant (or null for directed followups), category and authored text.
   Do not use this bank as a template for other wrestlers. */
(function(root){'use strict';
 const packs={
  mara:[
   ['open','proof','w','pr_tech','opening','Your argument is that the mat belongs to you. Very well. My argument is that you will have to get me there first.'],
   ['open','proof','w','pr_brawl','opening','I concede that you can hit hard. I do not concede that hitting hard constitutes a winning argument.'],
   ['open','proof','w','pr_risk','challenge','Every time your feet leave the mat, you give up control of the proceedings. I intend to take it.'],
   ['open','proof','w','pr_stall','disrespect','You can keep the audience waiting if you wish. You cannot postpone the question indefinitely.'],
   ['open','people','w','p_working','opening','A ticket entitles these people to a contest, not an excuse. I expect both of us to honour that.'],
   ['open','swagger','w','sw_main','opening','The running order is an administrative detail. The main event begins when I take the microphone.'],
   ['open','swagger','f','sw_main','rebuttal','That is a declaration, not a verdict. We have yet to hear the evidence.'],
   ['open','proof','f','pr_tech','challenge','You are entitled to try to stay upright. I would not make that the cornerstone of your case.'],
   ['open','people','f','p_working','rebuttal','On the matter of effort we agree. On your ability to sustain it, I reserve judgement.'],
   ['answer','turn','w','tu_strength','rebuttal','You have identified your own advantage: {strength}. That saves me the trouble of establishing what I need to take away.'],
   ['answer','turn','w','tu_strength','rebuttal','Very good. We have established your preferred method: {strength}. Now we can test whether it is sufficient.'],
   ['answer','calm','w','ca_pro','respect','I have no personal complaint against you. My objection is to the suggestion that you are going to win.'],
   ['answer','calm','w','ca_restraint','pressure','Raising my voice would not strengthen my argument. I will leave that temptation to you.'],
   ['answer','calm','f','ca_pro','respect','Then we agree on the terms. We disagree about the result.'],
   ['push','press','w',null,'pressure','You have made your position clear. What you have not done is answer the objection.'],
   ['push','press','w',null,'rebuttal','Let us return to the point at issue. I am not interested in a second argument until you have answered the first.'],
   ['push','acknowledge','w',null,'respect','I will grant you that point. You may find the rest of my argument considerably less accommodating.'],
   ['push','acknowledge','f',null,'respect','Accepted. We can dispense with the rest of the speeches.']
  ],
  brick:[
   ['open','proof','w','pr_brawl','opening','You hit hard. So what? A hard shot does not finish a match by itself.'],
   ['open','proof','w','pr_tech','challenge','You want me on the mat. Fair, and short. You will have to put me there.'],
   ['open','proof','w','pr_risk','challenge','Go up if you like. I will be waiting when you come down.'],
   ['open','proof','w','pr_stall','opening','I came to wrestle. If you want to slow things down, you will have to stop me first.'],
   ['open','people','w','p_working','opening','They paid for a match. I do not intend to send anybody home feeling short-changed.'],
   ['open','people','w','p_short','opening','Not much to say. You paid to see me wrestle. Watch.'],
   ['open','proof','f','pr_brawl','challenge','Right, then. Take the first one and tell me the same thing.'],
   ['open','people','f','p_working','rebuttal','I can do the whole match. Can you?'],
   ['open','swagger','f','sw_main','disrespect','Fine. Main event. Still got to wrestle me.'],
   ['answer','turn','w','tu_strength','rebuttal','You have got your {strength}. I have got to find an answer. That is the job.'],
   ['answer','turn','w','tu_strength','rebuttal','I heard you. I know what I have to deal with: {strength}. I am not pretending otherwise.'],
   ['answer','calm','w','ca_simple','respect','No shouting from me. Meet me when the bell goes.'],
   ['answer','calm','w','ca_pro','respect','Nothing against you. I need the win as much as you do.'],
   ['answer','calm','w','ca_restraint','pressure','I could stand here and have a row. Would not get us anywhere.'],
   ['answer','calm','f','ca_pro','respect','Same here. Let us get on with it.'],
   ['push','press','w',null,'pressure','That is not an answer. Have another go.'],
   ['push','press','w',null,'challenge','Hold on. Finish what you were saying.'],
   ['push','acknowledge','w',null,'respect','Fair, and short. I will give you that.'],
   ['push','acknowledge','f',null,'respect','Right. See you out there.']
  ],
  nova:[
   ['open','proof','w','pr_tech','opening','I know what you can do once you have someone grounded. That is why I am making you work for the takedown.'],
   ['open','proof','w','pr_brawl','opening','A strike is a force applied for a fraction of a second. Winning a wrestling match takes rather more than that.'],
   ['open','proof','w','pr_risk','challenge','The instant you leave the ropes you cannot change direction. That is the instant I am looking for.'],
   ['open','proof','w','pr_stall','rebuttal','You like to dictate the tempo. I prefer to dictate the position. Let us see which of us gets their way.'],
   ['open','people','w','p_working','opening','You spent money to be here. I think the least we can do is make every exchange worth watching.'],
   ['open','swagger','w','sw_main','opening','You can print the running order however you want. I expect the best wrestling to happen in my match.'],
   ['open','proof','f','pr_tech','challenge','Staying on your feet sounds simple. Try it when I change level and get underneath your hips.'],
   ['open','proof','f','pr_risk','rebuttal','Then you have to be in the right position at exactly the right time. That is easier to say than to do.'],
   ['open','swagger','f','sw_main','disrespect','A place on the bill does not tell me how you are getting out of a hold.'],
   ['answer','turn','w','tu_strength','rebuttal','I cannot afford to ignore your {strength} in this match. Knowing that is a useful starting point.'],
   ['answer','turn','w','tu_strength','rebuttal','You have told me to prepare for {strength}. Good. I would rather work on an actual problem than trade insults.'],
   ['answer','calm','w','ca_pro','respect','I respect your wrestling. I also intend to beat you. There is no contradiction there.'],
   ['answer','calm','w','ca_simple','respect','I am not interested in volume. We can resolve this on the mat.'],
   ['answer','calm','f','ca_pro','respect','Agreed. There is no reason the better wrestler cannot win a good match.'],
   ['push','press','w',null,'pressure','That still leaves the difficult part of your argument unanswered. Can we deal with that?'],
   ['push','press','w',null,'rebuttal','You are moving on before we have established whether your answer actually works.'],
   ['push','acknowledge','w',null,'respect','That is a fair correction. It does not change what I have to do at the bell.'],
   ['push','acknowledge','f',null,'respect','Then we have something we can test in the ring.']
  ],
  magnus:[
   ['open','proof','w','pr_tech','opening','I admire your command of the mat. I am afraid tonight you must earn the privilege of putting me on it.'],
   ['open','proof','w','pr_brawl','opening','You have a magnificent forearm. A shame they do not award a victory for the loudest sound in the building.'],
   ['open','proof','w','pr_risk','challenge','By all means take to the air. Gravity is a very impartial official.'],
   ['open','proof','w','pr_stall','disrespect','I know a long entrance when I see one. I am not prepared to spend the rest of the evening waiting for you to wrestle.'],
   ['open','swagger','w','sw_main','opening','They may arrange the evening in any order they please. There is only one arrival that makes it an occasion.'],
   ['open','swagger','w','sw_main','opening','Call it the opener if that makes the programme look tidier. I shall treat it as the reason they bought a ticket.'],
   ['open','swagger','w','sw_pose','opening','Take a proper look. This is the standard you have been asked to meet.'],
   ['open','swagger','f','sw_main','disrespect','How touching that you have appointed yourself the attraction. The audience has not yet been consulted.'],
   ['open','proof','f','pr_brawl','challenge','Do remind me of that distinction once you have taken the first blow.'],
   ['open','people','f','p_working','rebuttal','Of course they deserve a full performance. I wonder whether you have brought one.'],
   ['answer','turn','w','tu_strength','rebuttal','Your celebrated {strength}. Yes, I was paying attention. I should hate to deprive you of the opportunity to demonstrate them.'],
   ['answer','calm','w','ca_pro','respect','I harbour no personal grievance. I simply have rather different ambitions for the result.'],
   ['answer','calm','w','ca_restraint','pressure','I refuse to conduct an argument at that volume. There is no dignity in it.'],
   ['answer','calm','f','ca_pro','respect','A remarkably sensible proposition. We shall see which of us delivers on it.'],
   ['push','press','w',null,'pressure','An elegant diversion. I should like an answer to the original point all the same.'],
   ['push','press','w',null,'rebuttal','Do not mistake my patience for permission to change the subject.'],
   ['push','acknowledge','w',null,'respect','A fair observation. I shall concede it without conceding the evening.'],
   ['push','acknowledge','f',null,'respect','At last, a point of agreement. Let us not spoil it.']
  ]
 };
 root.OfficePromoPilot=Object.freeze(Object.entries(packs).map(([owner,rows])=>({owner,role:'wrestler',lines:rows.map(([stage,action,side,variant,category,text],i)=>({
  id:owner+'.pilot.'+String(i+1).padStart(2,'0'),stage,action,side,category,text,
  when:{hasMouthpiece:false,...(variant?{variants:[variant]}:{})}
 }))})));
 // Topic-gated, independently authored replies to unsupported charges.
 const evidenceReplies={
 "nova": [
  "You've asked me for a specific example. That's fair. I can't establish the charge, so it shouldn't be part of my argument.",
  "I can explain my approach to this match in detail, but I cannot prove that allegation. Let's keep those two things separate.",
  "Then we have cleared up that point. I would rather test the wrestling itself than an unproven accusation.",
  "That's a fair distinction. We can leave the allegation aside and see which approach works on the mat."
 ],
 "magnus": [
  "A perfectly proper demand. I regret that I cannot offer you particulars sufficient to sustain the allegation.",
  "I shall not insult this audience by substituting an elegant turn of phrase for evidence. Consider that charge withdrawn.",
  "Very good. We can dispense with the allegation and attend to the actual occasion.",
  "A sensible correction. There is quite enough at stake in this contest without embellishing it with unsupported charges."
 ]
};
 for(const pack of root.OfficePromoPilot)for(const [j,text] of (evidenceReplies[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.pilot.ev.'+String(j+1).padStart(2,'0'),stage:'answer',action:'turn',side:j<2?'w':'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
 const evidencePressRepliesD3={
  "magnus": [
    "The audience may observe which of us can sustain the standard we have promised. I shall submit to that test.",
    "We have a referee to establish the result and spectators to judge the performance. A perfectly adequate arrangement."
  ]
};
 for(const pack of root.OfficePromoPilot)for(const [j,text] of (evidencePressRepliesD3[pack.owner]||[]).entries())pack.lines.push({id:pack.owner+'.pilot.ep.'+String(j+1).padStart(2,'0'),stage:'push',action:'press',side:'f',category:'rebuttal',text,when:{hasMouthpiece:false,semanticClaim:'evidence'}});
})(typeof window!=='undefined'?window:globalThis);
