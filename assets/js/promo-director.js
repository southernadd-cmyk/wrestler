/* THE OFFICE — bounded live promo conversation director, phase 3.
   This layer governs scene shape, not the signed match finish. The existing
   argument graph owns substantive claims, closing commitments and payoffs. */
(function(root){'use strict';
 const I=root.OfficePromoIdentity;
 const clamp=(n)=>Math.max(0,Math.min(100,n));
 const topics={people:'the crowd and what they deserve',proof:'competitive credibility',imagery:'the picture painted of the match',accusation:'the accusation',swagger:'status and confidence',hometown:'the local crowd',numbers:'the competitive record'};
 const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 // Each format has its own public setting, opening question, available angles
 // and pacing. All retain the underlying graph's answer/closing contract.
 const FORMATS={
  interview:{name:'Backstage interview',setting:'A live interview from backstage, relayed to the hall. Both booked wrestlers are with the interviewer.',
   prompt:'Before you go out there, what does this match mean to you?',open:['proof','people','imagery','accusation'],answer:['calm','turn','confession','challenge'],
   headings:['The interview question','Answer the objection','One last question','Before you leave'],pace:'brief'},
  callout:{name:'In-ring call-out',setting:'The microphone is in the ring. The booked opponent is waiting at the entrance.',
   prompt:'Your opponent is booked for tonight. What do you want to say to them?',open:['accusation','swagger','proof','people'],answer:['challenge','personal','turn','calm'],
   headings:['Call them out','They answer the call','Keep them talking','Settle it in the ring'],pace:'confrontation'},
  faceoff:{name:'Face-to-face confrontation',setting:'Both wrestlers stand across from one another in the ring, with a microphone between them.',
   prompt:'You are face to face. What is the issue between you?',open:['accusation','proof','swagger','imagery'],answer:['turn','personal','calm','challenge'],
   headings:['State the issue','The rebuttal','An unsettled point','Final word'],pace:'confrontation'},
  address:{name:'Address to the crowd',setting:'The wrestler has the ring microphone and faces the audience. The booked opponent is present at ringside.',
   prompt:'The audience is listening. What do you want them to take into tonight’s match?',open:['people','hometown','imagery','swagger','proof'],answer:['callback','turn','calm','challenge','fakeout'],
   headings:['Address the audience','React to the interruption','Stay with the crowd','Leave them with something'],pace:'audience'},
  mouthpiece:{name:'Mouthpiece address',setting:'The client stands with their chosen mouthpiece. The booked opponent has a microphone too.',
   prompt:'You are speaking for your client tonight. What case do you want to make?',open:['proof','people','accusation','numbers'],answer:['turn','calm','challenge','personal'],
   headings:['Make the case','Defend your client','Clarify the position','Commit your client'],pace:'brief'}
 };
 function selectFormat(c,w,f,m,p,core,seed){
  if(m)return 'mouthpiece';
  const heat=core.feudHeat||0,record=core.cases?.length||0;
  const pool=record||heat>=45?['faceoff','faceoff','callout','interview']:
    p?.tv?['interview','interview','address','callout','faceoff']:
    ['address','address','callout','faceoff','interview'];
  return pool[hash(seed+'|format')%pool.length];
 }
 function formatFor(d){return FORMATS[d?.format]||null;}
 function angles(d,stage,all,core){
  const f=formatFor(d);
  // Never hide an evidence-based argument or a recorded commitment.
  if(!f||stage==='close'||(stage==='open'&&core.cases?.length)||(stage==='answer'&&core.case))return all;
  const ids=f[stage];if(!ids)return all;
  const selected=ids.map(id=>all.find(o=>o.id===id)).filter(Boolean);
  return selected.length>=3?selected:all;
 }
 function heading(d,round){return formatFor(d)?.headings?.[round]||null;}
 function setup(d){const f=formatFor(d);return f?{name:f.name,setting:f.setting,prompt:f.prompt}:null;}
 // Host question is a real conversational beat. The selected graph opening
 // supplies the argument; this short answer connects it to the question.
 // No additional promise or mechanical effect is introduced.
 const openingLead={
  interview:{proof:'It is a chance to show that my preparation counts.',people:'It means giving the people who came here a match worth their time.',imagery:'It is a chance to make tonight something people will remember.',accusation:'It means getting an answer to something that has been bothering me.',swagger:'It is a chance to show where I belong on this card.',hometown:'It is an opportunity to show this crowd what I can do.',numbers:'It is a chance to put the talk about the result to a real test.'},
  callout:{proof:'I want to talk about what happens when we actually wrestle.',people:'I want to know whether we can both deliver for this crowd.',imagery:'I want them to understand what this match means to me.',accusation:'I want an answer from them.',swagger:'I want them to know exactly how I see this contest.',hometown:'I want them to hear what I have to say in front of this crowd.',numbers:'I want them to deal with the argument in front of us.'},
  faceoff:{proof:'The issue is whether I can answer what they do best.',people:'The issue is what we owe the people watching.',imagery:'The issue is what happens when we finally get into that ring.',accusation:'There is a point I want them to answer.',swagger:'We disagree about who deserves the attention.',hometown:'We have a point to settle in front of this crowd.',numbers:'We disagree about what the evidence tells us.'},
  address:{proof:'I want them to watch the wrestling, not just listen to the words.',people:'I want them to know their support matters.',imagery:'I want them to remember more than just the final count.',accusation:'I want them to hear the point before they judge it.',swagger:'I want them to see why this match deserves their attention.',hometown:'I want this room to know where I stand.',numbers:'I want them to see what the numbers actually mean in the ring.'},
  mouthpiece:{proof:'My client has come to demonstrate their ability in the ring.',people:'My client intends to give this audience a proper match.',imagery:'My client wants this to be a contest people remember.',accusation:'My client has a point they want answered.',swagger:'My client wants to establish where they belong on this card.',hometown:'My client wants this crowd to hear their position.',numbers:'My client intends to let the contest test the argument.'}
 };
 const programmeAnswers={
  'You said this chase had to be earned. What can you show us tonight?':'I can show you what I do against the opponent in front of me.',
  'The champion is not in this match. Why should they be listening?':'Because the work I do tonight is part of the case I am making for a chance at the belt.',
  'Are you promising that belt is coming home with you?':'I want that belt. I still have to earn the right to take it.',
  'You have been climbing the card. What does tonight add to your case?':'Another chance to demonstrate that I belong at this level.',
  'The champion still has not answered. What are you going to do about it?':'Make a case through my wrestling that is harder to ignore.',
  'If you cannot deliver tonight, what was all this talk for?':'Then the talk will not have been enough. The work has to justify it.',
  'The title match is finally here. How should people remember this?':'As a contest in which the belt mattered enough for both of us to give everything.',
  'The champion has heard you for weeks. What is the last thing you want them to hear?':'That I am here to compete for the belt, not just to talk about it.',
  'Your whole chase comes down to tonight. What are you putting on the line?':'My credibility. I have to make the wrestling live up to the talk.',
  'There is history between you two. What needs answering tonight?':'What happens when we have to settle our differences in the ring.',
  'What did they do that you have not forgotten?':'I want to deal with the point that is actually between us tonight, not invent another grievance.',
  'Is this still about winning a wrestling match?':'Winning matters. So does how I handle the argument between us.',
  'Last time did not settle it. What would tonight prove?':'Whether I can make a better case in the ring than I have made with words.',
  'You both had your say last time. What did they get wrong?':'They do not get to decide what I am capable of before we wrestle.',
  'You seem determined to make this bigger. How far will you go?':'As far as I can justify in the ring. The match is still the test.',
  'One last meeting. Is that enough to end it?':'It can be, if the wrestling gives us an answer we can live with.',
  'Even if they win, what do you need to hear them admit?':'That they have to judge me by what I actually do in the ring.',
  'You have both spent weeks on this. What if tonight does not go your way?':'Then I will have to live with the result. I am not asking for an excuse.',
  'Why does the booker think you belong higher up the card?':'That is something I have to demonstrate. I cannot speak for the booker.',
  'Who on this card are you ready to make uncomfortable?':'The opponent I have tonight. I do not need to look past this match.',
  'You have barely started climbing. Are you calling yourself the future already?':'I am asking for the chance to prove what I can do now.',
  'Last time put you on people’s radar. Can you do it again?':'That is the test tonight. I have to give them another reason to watch.',
  'Who is afraid of losing their place to you?':'I cannot speak for anybody else. I can make them take my wrestling seriously.',
  'What happens if the main event is too big for you?':'Then I have to learn from it. I am not planning to back away from the test.',
  'This is the biggest night of your push. What is enough for you?':'A performance that earns respect, whatever the result.',
  'Does your opponent still deserve that place at the top?':'They can defend their place in the ring. I have to make a case for mine.',
  'You have been asking for the spotlight. What if it burns?':'Then I have to deal with the pressure I asked for.'
 };
 function openingQuestion(d,arc,host){
  return {v:1,format:d?.format||'interview',kind:arc?.prompt?'programme':'format',prompt:host};
 }
 function answerOpening(q,action){
  if(q?.v!==1)return null;
  if(q.kind==='record')return 'I have heard what is on the record. This is where I stand.';
  if(q.kind==='programme'&&Object.prototype.hasOwnProperty.call(programmeAnswers,q.prompt))return programmeAnswers[q.prompt];
  return openingLead[q.format]?.[action]||openingLead.interview[action]||null;
 }
 function participant(w){
  const identity=I.wrestler(w),delivery=identity?.delivery||'',pressure=identity?.underPressure||'';
  // Authored delivery is a starting disposition, not a fixed personality class.
  const stance=/walks away|silence|stops talking|leaves the microphone|withdraws|retreats/i.test(pressure)?'reserved':
   /interrupt|impatient|hostility|bravado|sharper|rushes/i.test(pressure)?'combative':
   /specific|precise|correct|narrow|standard|question|detail/i.test(pressure+' '+delivery)?'analytical':'adaptive';
  return {id:w.id,identity,stance,composure:clamp(50+((w.psych??50)-50)*.35),
   irritation:clamp((w.ego??50)*.25),ego:w.ego??50,pro:w.pro??60};
 }
 function begin(w,f,m,format=null){
  return {v:1,format,phase:'opening',subject:null,claim:null,lastPlayer:null,lastOpponent:null,
   player:participant(m||w),opponent:participant(f),client:w.id,turns:[],followup:null,ending:null};
 }
 function observe(d,st,record,fresh){
  const mine=fresh.filter(e=>e.side==='w'),theirs=fresh.filter(e=>e.side==='f');
  if(mine.length)d.lastPlayer=mine.at(-1).line;
  if(theirs.length){d.lastOpponent=theirs.at(-1).line;if(st.semantic){const claim=theirs.at(-1).semantic?.claim;d.latestPoint=root.OfficePromoSemantics.label(claim);}}
  if(record.round==='open'){
   d.subject=st.core.case?.issue?String(st.core.case.label||st.core.case.issue):topics[record.id]||'the match';
   d.claim=st.core.claim?.thesis||d.lastPlayer;
  }
  if(st.core.case?.thesis)d.claim=st.core.case.thesis;
  const personal=record.id==='personal'||record.id==='accusation',concedes=record.id==='confession'||record.id==='calm'||record.id==='acknowledge'||record.id==='revise';
  const swing=fresh.reduce((n,e)=>n+(e.swing||0),0);
  const a=d.player,b=d.opponent;
  a.composure=clamp(a.composure+(record.landed?7:-12)+(concedes?6:0));
  a.irritation=clamp(a.irritation+(record.landed?-3:13)+(swing<0?6:0)+(personal?4:0)-(concedes?9:0));
  b.composure=clamp(b.composure+(swing<0?5:-5));
  b.irritation=clamp(b.irritation+(personal?16:0)+(swing>5?8:0)-(concedes?9:0));
  d.turns.push({round:record.round,id:record.id,landed:record.landed,subject:d.subject,playerLine:mine.at(-1)?.line||null,
   opponentLine:theirs.at(-1)?.line||null,playerComposure:a.composure,opponentIrritation:b.irritation});
  d.phase=record.round==='close'?'resolved':record.round==='push'?'closing':record.round==='answer'?'decision':'exchange';
 }
 function route(d,st,record){
  if(st.core.case?.exposed)return {follow:true,reason:'the opponent has challenged the evidence'};
  if(st.core.case?.commit)return {follow:true,reason:'there is an unresolved public commitment'};
  // Acknowledging an argument or reaching a firm impasse can lead straight to
  // the final word. A volatile exchange can earn one additional beat, never a loop.
  const a=d.player,b=d.opponent;
  const format=formatFor(d);
  if(format?.pace==='brief'&&record.landed&&b.irritation<38)return {follow:false,reason:'the interviewer has enough for the segment'};
  if(format?.pace==='confrontation'&&b.irritation>=30&&Math.abs(st.meter)<35)return {follow:true,reason:'the face-to-face exchange remains heated'};
  if(record.id==='calm'&&record.landed&&b.irritation<36)return {follow:false,reason:'the reply settled the immediate argument'};
  if(a.stance==='reserved'&&a.composure<45)return {follow:false,reason:'the speaker has little appetite for another exchange'};
  if(record.id==='personal'||a.stance==='combative'||b.irritation>=38)return {follow:true,reason:'the exchange has become personal or heated'};
  if(Math.abs(st.meter)>=26)return {follow:false,reason:'the room has already made up its mind'};
  if(d.lastOpponent&&(!record.landed||a.stance==='analytical'))return {follow:true,reason:'the opponent has left a point to answer'};
  const follow=hash(st.seed+'|scene-shape')%3===0;
  return {follow,reason:follow?'there is room for a final exchange':'the immediate argument has reached a natural pause'};
 }
 function options(d){
  const subject=d.subject||'the match';
  return [
   {id:'leave',label:'Leave the argument there',hint:'Move straight to the final word.',tags:['Safe','End the exchange']},
   {id:'press',label:'Press them on '+subject,hint:'Keep the argument on the same subject. Can raise tension or overstay the moment.',tags:['Risky','Press the point']},
   {id:'acknowledge',label:'Acknowledge their reply',hint:'Give the other side some credit without conceding the match.',tags:['Steady','Restore composure']},
   {id:'hold',label:'Let the silence do the work',hint:'A pause can hold the crowd or let the tension dissipate.',tags:['Risky','No new claim']}
  ];
 }
 function followup(d,id){
  const s=d.player.stance;
  if(id==='press')return {line:s==='analytical'?'That still leaves the question unanswered.':s==='combative'?'No. Come back to the point.':s==='reserved'?'Answer the question.':'We can argue about everything else later. Stay with this.',reply:'I have given you my answer. The match is next.',risk:2,base:7};
  if(id==='acknowledge')return {line:s==='analytical'?'Fair. That is a point worth making.':s==='combative'?'All right. I will give you that much.':s==='reserved'?'Fair point.':'I hear what you are saying. We still have a match to wrestle.',reply:'Then we understand each other.',risk:1,base:4};
  return {line:null,reply:null,risk:2,base:6};
 }
 function summary(d){return {subject:d.subject,phase:d.phase,...(d.latestPoint?{latestPoint:d.latestPoint}:{}),...(formatFor(d)?{format:d.format,formatName:formatFor(d).name}:{}),player:d.player.composure<40?'Unsettled':d.player.irritation>=42?'Frustrated':'Composed',
  opponent:d.opponent.irritation>=42?'Heated':d.opponent.composure<40?'Unsettled':'Measured',followup:d.followup,ending:d.ending};}
 root.OfficePromoDirector=Object.freeze({begin,observe,route,options,followup,summary,selectFormat,angles,heading,setup,openingQuestion,answerOpening});
})(typeof window!=='undefined'?window:globalThis);
