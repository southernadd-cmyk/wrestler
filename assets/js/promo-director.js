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
 root.OfficePromoDirector=Object.freeze({begin,observe,route,options,followup,summary,selectFormat,angles,heading,setup});
})(typeof window!=='undefined'?window:globalThis);
