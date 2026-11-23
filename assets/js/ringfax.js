/* RINGFAX — a read-only teletext view of the actual career.
   No hooks into match simulation, no calls to the career RNG and no new saved state. */
(function installRingfax(root){'use strict';
 const D=root.OfficeData;
 const C={page:100,sub:0,entry:'',hold:false};

 // RINGFAX SECRET PAGE 777 — THE QUIZ REF (inspired by teletext quizzes,
 // not copying Bamboozle's name, presenter or question copy).
 // Each factual answer is traceable to the source in the question bank.
 const QUIZ_QUESTIONS=[
  {q:"What was Big Daddy's real name?",
   a:['Mick McManus','Shirley Crabtree','Peter Thornley','Max Crabtree'],correct:1,
   fact:'Big Daddy was Shirley Crabtree.',source:'https://wrestlingheritage.co.uk/shirley-crabtree/'},
  {q:'Which channel carried wrestling in the classic World of Sport programme?',
   a:['BBC One','Channel 4','ITV','BBC Two'],correct:2,
   fact:'World of Sport featured ITV wrestling.',source:'https://www.wrestling-titles.com/europe/uk/britainhistory.html'},
  {q:'Who was the famous voice of televised British wrestling?',
   a:['Dickie Davies','Kent Walton','Harry Carpenter','Brian Moore'],correct:1,
   fact:'Kent Walton commentated for decades.',source:'https://wrestlingheritage.co.uk/kent-walton/'},
  {q:'Whom did Kendo Nagasaki unmask in 1966?',
   a:['Count Bartelli','Mick McManus','Billy Robinson','Giant Haystacks'],correct:0,
   fact:'Count Bartelli lost his mask in 1966.',source:'https://wrestlingheritage.co.uk/count-bartelli/'},
  {q:'In what year did ITV end its original regular wrestling coverage?',
   a:['1986','1990','1988','1992'],correct:2,
   fact:'The original ITV run ended in 1988.',source:'https://wrestlingheritage.co.uk/a-year-of-wrestling-1988/'},
  {q:'Who faced Big Daddy at Wembley Arena in 1981?',
   a:['Kendo Nagasaki','Giant Haystacks','Mick McManus','Johnny Saint'],correct:1,
   fact:'Big Daddy beat Haystacks at Wembley.',source:'https://wrestlingheritage.co.uk/shirley-crabtree/'},
  {q:'Who teamed with Dynamite Kid as the British Bulldogs?',
   a:['Bret Hart','Finlay','Davey Boy Smith','William Regal'],correct:2,
   fact:"Davey Boy Smith was Dynamite Kid's tag partner.",source:'https://www.wwe.com/superstars/britishbulldog'},
  {q:"What was Dynamite Kid's real name?",
   a:['Davey Boy Smith','Thomas Billington','Darren Matthews','Peter Thornley'],correct:1,
   fact:'Dynamite Kid was Thomas Billington.',source:'https://www.wwe.com/article/dynamite-kid-passes-away'},
  {q:'Which title did British Bulldog win at SummerSlam 1992?',
   a:['WWE Championship','European Championship','Intercontinental Title','World Tag Team Title'],correct:2,
   fact:'He beat Bret Hart for the Intercontinental title.',source:'https://www.wwe.com/shows/summerslam/1992'},
  {q:'Where was SummerSlam 1992 held?',
   a:['Royal Albert Hall','Wembley Arena','Wembley Stadium','Manchester Arena'],correct:2,
   fact:'The event was held at Wembley Stadium.',source:'https://www.wwe.com/shows/summerslam/1992/venue'},
  {q:'Which wrestler was a Blackpool native known as Regal?',
   a:['William Regal','Johnny Saint','Dynamite Kid','Davey Boy Smith'],correct:0,
   fact:'William Regal came from Blackpool.',source:'https://www.wwe.com/superstars/william-regal'},
  {q:'What weapon was strongly associated with Belfast wrestler Finlay?',
   a:['Kendo stick','Shillelagh','Brass bell','Steel chair'],correct:1,
   fact:'Finlay was famous for his shillelagh.',source:'https://www.wwe.com/superstars/finlay'}
 ];
 const quizState={stage:'intro',index:0,checkpoint:0,misses:0,reveal:false};
 const QUIZ_COLOURS=['red','green','yellow','cyan'];
 function quizReset(){
  quizState.stage='intro';quizState.index=0;quizState.checkpoint=0;
  quizState.misses=0;quizState.reveal=false;
 }
 function quizInfo(){
  return {stage:quizState.stage,index:quizState.index,checkpoint:quizState.checkpoint,
   misses:quizState.misses,total:QUIZ_QUESTIONS.length,reveal:quizState.reveal};
 }
 function quizFooter(){
  const f=(colour,tag,action,value)=>({colour,text:tag.padEnd(10,' ').slice(0,10),action,value});
  if(quizState.stage==='question')return QUIZ_COLOURS.map((colour,i)=>
   f(colour,['RED A','GRN B','YEL C','CYN D'][i],'quiz-answer',i));
  if(quizState.stage==='wrong')return [
   f('red','RED RETRY','quiz-retry'),f('green','GRN REVEAL','quiz-reveal'),
   f('yellow','YEL INDEX','go',100),f('cyan','CYN RETRY','quiz-retry')
  ];
  if(quizState.stage==='rules')return [
   f('red','RED START','quiz-start'),f('green','GRN BACK','quiz-back'),
   f('yellow','YEL INDEX','go',100),f('cyan','CYN START','quiz-start')
  ];
  if(quizState.stage==='won')return [
   f('red','RED AGAIN','quiz-start'),f('green','GRN RULES','quiz-rules'),
   f('yellow','YEL INDEX','go',100),f('cyan','CYN AGAIN','quiz-start')
  ];
  return [
   f('red','RED START','quiz-start'),f('green','GRN RULES','quiz-rules'),
   f('yellow','YEL INDEX','go',100),f('cyan','CYN START','quiz-start')
  ];
 }
 function quizPage(){
  const l=[item(' THE QUIZ REF: UK WRESTLING','yellow'),item('')];
  if(quizState.stage==='intro'){
   paragraphs(l,'YOU HAVE FOUND SECRET PAGE 777!','green');
   l.push(item(''));
   paragraphs(l,'12 QUESTIONS. FOUR COLOUR BUTTONS.');
   paragraphs(l,'ONE CHANCE TO BE THE CHAMPION.');
   l.push(item(''));
   paragraphs(l,'A WRONG ANSWER SENDS YOU TO THE SIN BIN.','cyan');
   paragraphs(l,'CHECKPOINTS AFTER Q4 AND Q8.');
   l.push(item(''));
   paragraphs(l,'RED OR CYAN: START THE QUIZ','yellow');
  }else if(quizState.stage==='rules'){
   paragraphs(l,'RED, GREEN, YELLOW OR CYAN.','cyan');
   paragraphs(l,'CHOOSE ONE ANSWER PER QUESTION.');
   l.push(item(''));
   paragraphs(l,'WRONG ANSWER? A TRIVIA DETOUR.');
   paragraphs(l,'RETRY FROM THE LAST CHECKPOINT.');
   l.push(item(''));
   paragraphs(l,'NO MONEY. NO SAVES. JUST GLORY!','green');
   paragraphs(l,'TO PLAY, PRESS RED OR CYAN.');
  }else if(quizState.stage==='question'){
   const q=QUIZ_QUESTIONS[quizState.index];
   l.push(item(' QUESTION '+(quizState.index+1)+' / '+QUIZ_QUESTIONS.length,'cyan'));
   l.push(item(' ROUND '+(Math.floor(quizState.index/4)+1)+' OF 3','yellow'));
   l.push(item(''));
   paragraphs(l,q.q,'white');
   l.push(item(''));
   q.a.forEach((choice,i)=>{
    l.push({...item(' '+QUIZ_COLOURS[i].toUpperCase()+': '+choice,QUIZ_COLOURS[i]),answerIndex:i});
    l.push(item(''));
   });
   l.push(item(' PRESS A COLOUR TO ANSWER','yellow'));
  }else if(quizState.stage==='wrong'){
   const q=QUIZ_QUESTIONS[quizState.index];
   paragraphs(l,'YOU HAVE BEEN BODYSLAMMED!','red');
   l.push(item(''));
   paragraphs(l,'THAT WAS NOT THE RIGHT ANSWER.');
   paragraphs(l,'RETRY FROM QUESTION '+(quizState.checkpoint+1)+'.','cyan');
   l.push(item(''));
   paragraphs(l,'CORRECT: '+q.a[q.correct],'yellow');
   l.push(item(''));
   if(quizState.reveal)paragraphs(l,q.fact,'green');
   else paragraphs(l,'GREEN: REVEAL A TRIVIA FACT.');
   l.push(item(''));
   paragraphs(l,'RED OR CYAN: GET BACK IN THE RING');
  }else if(quizState.stage==='won'){
   paragraphs(l,'YOU ARE THE QUIZ CHAMPION!','yellow');
   l.push(item(''));
   paragraphs(l,'TWELVE QUESTIONS. ALL ANSWERED.');
   paragraphs(l,'THAT IS A MAIN-EVENT PERFORMANCE.','green');
   l.push(item(''));
   paragraphs(l,'WRONG TURNS: '+quizState.misses,'cyan');
   l.push(item(''));
   paragraphs(l,'RED: PLAY AGAIN. YELLOW: INDEX.');
  }
  return l;
 }
 function quizPress(action,value){
  const stage=quizState.stage;
  if(action==='quiz-start'){
   quizState.stage='question';quizState.index=0;quizState.checkpoint=0;
   quizState.misses=0;quizState.reveal=false;return true;
  }
  if(action==='quiz-rules'){quizState.stage='rules';return true;}
  if(action==='quiz-back'){if(stage!=='rules')return false;quizState.stage='intro';return true;}
  if(action==='quiz-reveal'){if(stage!=='wrong')return false;quizState.reveal=!quizState.reveal;return true;}
  if(action==='quiz-retry'){
   if(stage!=='wrong')return false;
   quizState.index=quizState.checkpoint;quizState.stage='question';quizState.reveal=false;
   return true;
  }
  if(action==='quiz-answer'){
   if(stage!=='question'||!['0','1','2','3'].includes(String(value)))return false;
   const correct=QUIZ_QUESTIONS[quizState.index].correct===Number(value);
   if(!correct){
    quizState.stage='wrong';quizState.misses++;quizState.reveal=false;return true;
   }
   quizState.index++;
   if(quizState.index%4===0)quizState.checkpoint=quizState.index;
   quizState.stage=quizState.index===QUIZ_QUESTIONS.length?'won':'question';
   return true;
  }
  return false;
 }

 const HANDLES=[
  ['GRAPPLEGRAN','traditional'],['HEELTURN78','contrarian'],
  ['MATWORKMICK','technical'],['BALCONYSEAT','underdog'],
  ['KAYFABEKEV','traditional'],['TICKETSTUB','business'],
  ['FRONTROWFRAN','underdog'],['BIGSPOTBOB','spectacle']
 ];
 const text=x=>String(x==null?'':x);
 const escape=x=>text(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const line=(x,w=40)=>text(x).replace(/\s+/g,' ').trim().slice(0,w).padEnd(w,' ');
 function wrap(value,width=38){
  const words=text(value).split(/\s+/).filter(Boolean),out=[];let current='';
  for(let word of words){
   while(word.length>width){
    if(current){out.push(current);current='';}
    out.push(word.slice(0,width));word=word.slice(width);
   }
   if(!word)continue;
   if(current&&current.length+word.length+1>width){out.push(current);current='';}
   current+=(current?' ':'')+word;
  }
  if(current)out.push(current);
  return out.length?out:[''];
 }
 function hash(str){let n=2166136261;for(const c of text(str)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
 function item(value,colour='white',background='black'){return {text:line(value),colour,background};}
 function paragraphs(lines,value,colour='white'){
  for(const part of wrap(value,38))lines.push(item(' '+part,colour));
 }
 function latest(s){
  const hist=(s?.history||[]).filter(h=>h&&h.cid&&h.name&&h.foe);
  return hist.slice().sort((a,b)=>(b.season-a.season)||(b.week-a.week))[0]||null;
 }
 function recents(s){
  const seen=new Set();
  return (s?.history||[]).filter(h=>{
   if(!h||!h.cid||seen.has(h.cid))return false;
   seen.add(h.cid);return true;
  }).slice().sort((a,b)=>(b.season-a.season)||(b.week-a.week));
 }
 const rankName=id=>D?.findWrestler?.(id)?.short||D?.findWrestler?.(id)?.name||text(id);
 const score=h=>Number.isFinite(h?.stars)?h.stars.toFixed(2)+' stars':'rating not recorded';
 function resultLine(h){
  if(h?.outcome==='nc')return 'NO CONTEST';
  if(!h?.finish||!root.OfficeOutcome?.interpret)return 'RESULT NOT AVAILABLE';
  const out=root.OfficeOutcome.interpret(h,{actualOutcome:h.outcome,bookedFinish:h.bookedFinish});
  if(out.winner==='w')return 'WINNER: '+h.name;
  if(out.winner==='f')return 'WINNER: '+h.foe;
  return 'RESULT NOT AVAILABLE';
 }
 function voices(h,count=3){
  if(!h)return [];
  const rotation=hash(h.cid+'|fan')%HANDLES.length,out=[];
  for(let i=0;i<count;i++){
   const [name,kind]=HANDLES[(rotation+i*3)%HANDLES.length];
   let quote;
   const high=Number.isFinite(h.stars)&&h.stars>=3.5;
   const low=Number.isFinite(h.stars)&&h.stars<2.5;
   switch(kind){
    case 'traditional':quote=high?'A match worth talking about. That is what the sport needs.':low?'Not a classic in my book. Give us something to believe in.':'There is a story here. I want to see where it goes.';break;
    case 'technical':quote=high?'The rating looks fair to me. I would watch a rematch.':low?'The rating speaks for itself. There is room to improve.':'I care about the work between the bells, not the poster.';break;
    case 'spectacle':quote=high?'That gave us something to talk about. More of that, please.':low?'I wanted a night to remember. Next time, perhaps.':'Give me a moment worth remembering and I am happy.';break;
    case 'underdog':quote=high?'I love seeing a good performance get recognised.':low?'One disappointing result should not end a career.':'A wrestler can recover from a poor week. I will keep watching.';break;
    case 'business':quote=high?'That kind of rating should help sell the next card.':low?'Would that performance bring you back next week?':'Fans spend real money. The next show needs to deliver.';break;
    default:quote=high?'Everyone loves this one? Let us see the follow-up.':low?'I am not writing anyone off on one match.':'Not everyone needs to agree about that match.';
   }
   out.push({id:'fan:'+h.cid+':'+name,name,kind,quote,sourceId:h.cid});
  }
  return out;
 }
 const wrestlerName=id=>id?(D?.findWrestler?.(id)?.name||String(id)):'VACANT';
 const promotionName=id=>D?.PROMOS?.find(p=>p.id===id)?.name||String(id||'Unknown');
 function leader(s,pid,div,exclude=null){
  const cards=s?.territory?.cards?.[pid]||{};
  return Object.entries(cards).filter(([id,v])=>id!==exclude&&v&&
   Number.isFinite(v.score)&&D?.divisionOf?.(id)===div)
   .sort((a,b)=>b[1].score-a[1].score||
    wrestlerName(a[0]).localeCompare(wrestlerName(b[0])))[0]||null;
 }
 function scheduled(s){
  const confirmed=[...(s?.card||[]),...(s?.futureBookings||[])].map(o=>({...o,rfKind:'BOOKED'}));
  const known=new Set(confirmed.map(o=>o.id).filter(Boolean));
  const offered=(s?.offers||[]).filter(o=>!known.has(o.id)).map(o=>({...o,rfKind:'OFFER'}));
  return [...confirmed,...offered].filter(o=>o.pid&&o.rid).sort((a,b)=>
   (a.eventAbs??0)-(b.eventAbs??0)||String(a.pid).localeCompare(String(b.pid))||
   String(a.rid).localeCompare(String(b.rid)));
 }
 const eventWeek=o=>o.eventAbs?
  'S'+(Math.floor((o.eventAbs-1)/16)+1)+'W'+(((o.eventAbs-1)%16)+1):'DATE TBD';
 function openingFans(s){
  const p=D?.PROMOS||[],first=p[0],last=p[p.length-1];
  const champ=s?.territory?.titles?.[first?.id]?.[D?.DIVISION_ORDER?.[0]]?.holder;
  const top=leader(s,first?.id,D?.DIVISION_ORDER?.[0],champ);
  return [
   {name:'GRAPPLEGRAN',quote:champ?
    wrestlerName(champ)+' has the '+first.name+' belt. Now show us a proper defence.':
    'I want a proper championship contest.'},
   {name:'HEELTURN78',quote:last?
    last.name+' have the big stage. Give me a noisy small hall instead.':
    'Big names are fine. I still want a proper villain.'},
   {name:'MATWORKMICK',quote:top?
    wrestlerName(top[0])+' sits high on the '+first.name+' card. Who can outwrestle them?':
    'I am waiting for a technical contest.'},
   {name:'TICKETSTUB',quote:first?
    first.venue+' is one venue I would visit. Earn our ticket money.':
    'Promoters have to earn our ticket money.'}
  ];
 }
 function build(s){
  const h=latest(s),recent=recents(s),P={};
  const add=(number,title,lines)=>{P[number]={number,title,lines:lines.slice()};};
  // A proper two-column teletext index, not a conventional app menu.
  // Each 20-character half remains individually clickable in the renderer.
  const pair=(left,right,colour='white')=>({text:line(left,20)+line(right,20),colour,background:'black'});
  const promos=s?.promoters?.length?s.promoters:(D?.PROMOS||[]);
  const circuitTitles=s?.territory?.titles||{};
  const bookings=scheduled(s);
  const mainPromo=promos[0]||null;
  const champ=mainPromo&&circuitTitles[mainPromo.id]?.[D?.DIVISION_ORDER?.[0]]?.holder;
  let a=[
   item(' NEWS, RESULTS AND THE CIRCUIT','yellow'),
   item(' --------------------------------','blue'),
   pair('101 NEWS','102 SEASON','white'),
   pair('103 BOOKINGS','104 PROMOTERS','cyan'),
   pair('200 RESULTS','201 RATINGS','white'),
   pair('300 LADDER','301 LEADERS','cyan'),
   pair('302 TITLES','500 FANZONE','white'),
   pair('501 LETTERS','100 INDEX','cyan'),
   item(' --------------------------------','blue'),
   item(' LATEST FROM THE CIRCUIT','yellow')
  ];
  if(h){
   a.push(item(' '+h.name+' v '+h.foe,'cyan'),
    item(' S'+h.season+' W'+h.week+' / '+score(h)));
  }else{
   a.push(item(' SEASON '+(s?.season||1)+((s?.week||1)===1?' OPENS':' / WEEK '+s.week),'cyan'),
    item(' '+promos.length+' PROMOTIONS / '+(D?.DIVISION_ORDER?.length||0)*promos.length+' TITLES'));
  }
  if(champ)a.push(item(' '+mainPromo.name+': '+wrestlerName(champ),'yellow'));
  a.push(item(' '+bookings.length+' BOOKING DESK ITEMS / P103','green'),
   item(' FAN REACTION AND LETTERS: 500-501','cyan'));

  add(100,'RINGFAX INDEX',a);

  a=[item(h?'LATEST FROM THE RING':((s?.week||1)===1?'OPENING WEEK: CIRCUIT NEWS':'CIRCUIT NEWS / THIS WEEK'),'yellow'),item('')];
  if(h){
   paragraphs(a,h.name+' versus '+h.foe,'cyan');
   paragraphs(a,'Reported from '+text(h.promoter||h.pid||'the circuit')+'.');
   paragraphs(a,'S'+h.season+' W'+h.week+' / '+score(h),'yellow');
   paragraphs(a,resultLine(h),'green');
   if(h.outcome==='dq')paragraphs(a,'Match ended by disqualification.');
   else if(h.outcome==='nc')paragraphs(a,'Match ended with no contest.');
   else if(h.outcome==='double')paragraphs(a,'The agreed finish was broken.');
   else paragraphs(a,'The result has been entered in the official record.');
   a.push(item(''),item(' MORE CIRCUIT NEWS: 102','cyan'));
  }else{
   a.push(item(' THE CHAMPIONSHIP PICTURE','cyan'));
   for(const p of promos.slice(0,2)){
    const holder=circuitTitles[p.id]?.[D?.DIVISION_ORDER?.[0]]?.holder;
    if(holder)a.push(item(' '+p.name+': '+wrestlerName(holder),'white'));
   }
   a.push(item(''),item(' THE PROMOTERS OPEN FOR BUSINESS','cyan'));
   for(const p of promos.slice(0,2))
    a.push(item(' '+p.name+' / '+(p.venue||'VENUE TBD')));
   a.push(item(''),item(' '+bookings.length+' BOOKING DESK ITEMS','green'));
   const next=bookings[0];
   if(next)a.push(item(' '+promotionName(next.pid)+' / '+wrestlerName(next.rid)));
   a.push(item(''),item(' 102 SEASON PREVIEW / 103 BOOKINGS','yellow'),
    item(' 302 CHAMPIONS / 500 FANS','green'));
  }

  add(101,'LATEST HEADLINE',a);

  // Read-only editorial pages: real titleholders, promoters and current offers.
  a=[item('SEASON PREVIEW / THE CIRCUIT','yellow'),
     item(' FOUR PROMOTERS, TWO DIVISIONS','cyan'),item('')];
  for(const p of promos){
   a.push(item(' '+p.name.toUpperCase(),'yellow'));
   a.push(item(' '+(p.desc||'WRESTLING')+' / '+(p.tv?'ON TV':'LIVE SHOWS')));
   const m=circuitTitles[p.id]?.[D?.DIVISION_ORDER?.[0]]?.holder;
   const w=circuitTitles[p.id]?.[D?.DIVISION_ORDER?.[1]]?.holder;
   a.push(item(' TITLES: '+(m?rankName(m):'VACANT')+' / '+(w?rankName(w):'VACANT'),'green'));
  }
  a.push(item(''),item(' 302: ALL CHAMPIONS','cyan'));
  add(102,'SEASON PREVIEW',a);

  a=[item('BOOKINGS AND OPPORTUNITIES','yellow'),
     item(' OFFERS ARE NOT SIGNED FIXTURES','cyan'),item('')];
  if(!bookings.length)paragraphs(a,'No current offers or signed cards. Check back after the next update.');
  for(const o of bookings.slice(0,5)){
   a.push(item(' '+o.rfKind+' '+eventWeek(o)+' / '+promotionName(o.pid),'yellow'));
   a.push(item(' '+(o.wid?wrestlerName(o.wid)+' v ':'Opponent: ')+wrestlerName(o.rid)));
  }
  a.push(item(''),item(' FINISHED MATCHES GO ON P200','green'));
  add(103,'BOOKING DESK',a);

  a=[item('THE FOUR PROMOTIONS','yellow'),item('')];
  for(const p of promos){
   a.push(item(' '+p.name.toUpperCase(),'cyan'));
   a.push(item(' '+(p.desc||'WRESTLING')));
   a.push(item(' '+p.venue+' / REACH '+p.reach+(p.tv?' / TV':' / LIVE'),'yellow'));
  }
  a.push(item(''),item(' P102: TITLES / P103: BOOKINGS','green'));
  add(104,'PROMOTER DIRECTORY',a);

  a=[item('RECENT COMPLETED MATCHES','yellow'),item('')];
  if(!recent.length){
   paragraphs(a,'No completed results on record.','cyan');
   a.push(item(''),item(' UPCOMING / NOT RESULTS','yellow'));
   if(bookings.length){
    for(const o of bookings.slice(0,3)){
     a.push(item(' '+o.rfKind+' '+eventWeek(o),'green'));
     a.push(item(' '+promotionName(o.pid)+' - '+wrestlerName(o.rid)));
    }
   }else paragraphs(a,'No current bookings.');
   a.push(item(''),item(' 103: THE BOOKING DESK','yellow'));
  }
  recent.slice(0,8).forEach((r,i)=>{
   a.push(item('S'+r.season+' W'+r.week+' '+(i+1)+'. '+text(r.name),'cyan'));
   paragraphs(a,'v '+text(r.foe)+' / '+score(r),'white');
   paragraphs(a,resultLine(r),'green');
   a.push(item(''));
  });
  add(200,'RESULTS',a);

  a=[item('RECORDED MATCH RATINGS','yellow'),item('')];
  const ratings=recent.filter(r=>Number.isFinite(r.stars));
  if(!ratings.length){
   paragraphs(a,'No matches rated yet. Star scores appear only after completed bouts.','cyan');
   a.push(item(''),item(' CURRENT CARD WATCH','yellow'),
    item(' CARD SCORES ARE NOT MATCH RATINGS','green'));
   for(const promo of promos.slice(0,4)){
    const top=leader(s,promo.id,D?.DIVISION_ORDER?.[0]);
    if(top)a.push(item(' '+promo.name+': '+rankName(top[0])+' ['+Math.round(top[1].score)+']'));
   }
   a.push(item(''),item(' 300/301: CURRENT RANKINGS','cyan'));
  }
  ratings.slice(0,8).forEach(r=>{
   paragraphs(a,'S'+r.season+' W'+r.week+' '+r.name+' v '+r.foe,'cyan');
   a.push(item(' '+r.stars.toFixed(2)+' stars','yellow'));
  });
  if(ratings.length){
   const sample=ratings.slice(0,8),avg=sample.reduce((sum,x)=>sum+x.stars,0)/sample.length;
   a.push(item(''),item('MEAN OF '+sample.length+' SHOWN MATCHES: '+avg.toFixed(2),'green'));
  }
  add(201,'MATCH GRADES',a);

  const p=promos[0]||null;
  const divs=D?.DIVISION_ORDER||[];
  const col=v=>text(v).replace(/\s+/g,' ').trim().slice(0,20).padEnd(20,' ');
  const ranking=(pid,div)=>Object.entries(s?.territory?.cards?.[pid]||{})
   .filter(([id,v])=>v&&Number.isFinite(v.score)&&D?.divisionOf?.(id)===div)
   .sort((x,y)=>y[1].score-x[1].score||wrestlerName(x[0]).localeCompare(wrestlerName(y[0])));
  a=[item('CARD LADDER / '+(p?.name||'CIRCUIT').toUpperCase(),'yellow'),
     {text:col('MEN / POINTS')+col('WOMEN / POINTS'),colour:'cyan'}];
  const rankedDivs=divs.slice(0,2).map(div=>ranking(p?.id,div).slice(0,6));
  for(let i=0;i<6;i++){
   const labels=rankedDivs.map(rows=>rows[i]?
    (i+1)+'. '+rankName(rows[i][0])+' '+Math.round(rows[i][1].score):'');
   a.push({text:col(labels[0])+col(labels[1]),colour:i===0?'yellow':'white'});
  }
  a.push(item(''),item(' CARD RANKS, NOT MATCH RATINGS','green'),
   item(' 301: LEADERS IN ALL PROMOTIONS','cyan'));
  add(300,'CARD RANKINGS',a);

  a=[item('THE CIRCUIT CARD LEADERS','yellow'),
    {text:col('MEN - TOP RANK')+col('WOMEN - TOP RANK'),colour:'cyan'}];
  for(const promo of promos){
   a.push(item(' '+promo.name.toUpperCase(),'yellow'));
   const leaders=divs.slice(0,2).map(div=>leader(s,promo.id,div));
   a.push({text:col(leaders[0]?rankName(leaders[0][0]):'NOT RANKED')+
    col(leaders[1]?rankName(leaders[1][0]):'NOT RANKED'),colour:'white'});
   a.push(item(''));
  }
  a.push(item(''),item(' CURRENT CARD ORDER','green'));
  add(301,'CIRCUIT LEADERS',a);

  // Four promotions × two divisions fit on one 17-line teletext page.
  // Every promotion uses a full-width header and one pair of 20-cell columns.
  // Build the cells without item()/line(), which deliberately collapse spaces.
  const cell20=value=>text(value).replace(/\s+/g,' ').trim().slice(0,20).padEnd(20,' ');
  const holderName=belt=>{
   if(!belt)return 'NOT RECORDED';
   if(!belt.holder)return 'VACANT';
   return D?.findWrestler?.(belt.holder)?.name||rankName(belt.holder);
  };
  const titles=s?.territory?.titles||{};
  const divisions=D?.DIVISION_ORDER||[];
  const promoters=s?.promoters?.length?s.promoters:(D?.PROMOS||[]);
  a=[item('CHAMPIONS - THE ENTIRE CIRCUIT','yellow'),
     {text:cell20((divisions[0]||'MEN').toUpperCase())+
       cell20((divisions[1]||'WOMEN').toUpperCase()),colour:'cyan'}];
  const have=promoters.some(p=>divisions.some(div=>!!titles[p.id]?.[div]));
  if(have){
   for(const promo of promoters){
    a.push(item(promo.name.toUpperCase(),'yellow'));
    a.push({text:cell20(holderName(titles[promo.id]?.[divisions[0]]))+
       cell20(holderName(titles[promo.id]?.[divisions[1]])),colour:'white'});
    a.push(item(''));
   }
   a.push(item('CURRENT HOLDERS / S'+(s?.season||1)+' W'+(s?.week||1),'green'));
  }else{
   paragraphs(a,'Title information not available.');
  }
  add(302,'TITLE PICTURE',a);

  // Opening-week letters are explicitly opinions about the season, not invented match results.
  const opening=openingFans(s);
  const fans=h?voices(h,3):opening.slice(0,3);
  a=[item('WHAT THE FANS ARE SAYING','yellow'),item('')];
  if(h){
   paragraphs(a,'TOPIC: '+h.name+' v '+h.foe,'cyan');
   a.push(item(''));
   fans.forEach(f=>{
    a.push(item(' '+f.name,'green'));
    paragraphs(a,'"'+f.quote+'"');
    a.push(item(''));
   });
  }else{
   paragraphs(a,(s?.week||1)===1?'OPENING WEEK / FIRST IMPRESSIONS':'CIRCUIT OPINIONS','cyan');
   a.push(item(''));
   for(const f of fans){
    a.push(item(' '+f.name,'green'));
    paragraphs(a,'"'+f.quote+'"');
    a.push(item(''));
   }
  }
  add(500,'THE FANZONE',a);

  a=[item('LETTERS TO RINGFAX','yellow'),item('')];
  if(h){
   const expanded=voices(h,5);
   expanded.forEach(f=>{
    a.push(item('FROM: '+f.name,'green'));
    paragraphs(a,'RE: '+h.name+' v '+h.foe,'cyan');
    paragraphs(a,f.quote);
    a.push(item(''));
   });
  }else{
   paragraphs(a,(s?.week||1)===1?'OPENING WEEK / READERS MAIL':'READERS MAIL / THE CIRCUIT','cyan');
   a.push(item(''));
   for(const f of opening){
    a.push(item('FROM: '+f.name,'green'));
    paragraphs(a,f.quote);
    a.push(item(''));
   }
  }
  add(501,'READERS LETTERS',a);
  add(777,'THE QUIZ REF',quizPage());
  return P;
 }
 const fast=[100,200,300,500];
 // 4 x 4 pixel-cell letters, sized like a real teletext mosaic masthead.
 // Every row remains exactly forty character cells (no SVG or raster image).
 // A 5×7 ORIGINAL bitmap alphabet used for the Ringfax channel ident.
 // Unlike VT323/Unicode block characters, SVG pixel shapes render identically
 // on Android, Chromium desktop and browser zoom. No BBC lettering is copied.
 const PIXELS={
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01111'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','11011','10001'],
  X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  Z:['11111','00001','00010','00100','01000','10000','11111'],
  ' ':['00000','00000','00000','00000','00000','00000','00000']
 };
 function pixelLogo(word){
  const chars=String(word).toUpperCase().split('').filter(c=>PIXELS[c]).slice(0,9);
  const width=chars.length*6-1;
  let path='';
  for(let c=0;c<chars.length;c++){
   for(let y=0;y<7;y++)for(let x=0;x<5;x++){
    if(PIXELS[chars[c]][y][x]==='1')path+='M'+(c*6+x)+' '+y+'h1v1h-1z';
   }
  }
  return '<svg class="rf-logo-svg" xmlns="http://www.w3.org/2000/svg" '+
   'viewBox="0 0 '+width+' 7" preserveAspectRatio="none" aria-hidden="true" focusable="false" '+
   'shape-rendering="crispEdges"><path fill="#ffed00" d="'+path+'"/></svg>';
 }

 const BANNERS={
  100:['RINGFAX','yellow'],101:['LATEST','cyan'],102:['SEASON','yellow'],
  103:['BOOKINGS','green'],104:['PROMOS','cyan'],200:['RESULTS','green'],
  201:['RATINGS','yellow'],300:['RANKINGS','green'],301:['LEADERS','yellow'],302:['TITLES','cyan'],
  500:['FANZONE','magenta'],501:['LETTERS','yellow'],777:['QUIZ','yellow']
 };
 function mosaic(word){
  // Leave a text equivalent inside the 40×25 model; the graphic is painted
  // on top of these blue cells, never substituted for the page content.
  const label=String(word).toUpperCase().slice(0,30);
  return [(' '.repeat(40)),(' '+label).padEnd(40,' '),
   ' '.repeat(40),' '.repeat(40)];
 }

 const fastext=[
  {text:'101 NEWS  ',page:101,colour:'red'},
  {text:'200 RESULT',page:200,colour:'green'},
  {text:'300 RANKS ',page:300,colour:'yellow'},
  {text:'500 FANS  ',page:500,colour:'cyan'}
 ];
 function clock(){
  const now=new Date();
  const digits=x=>String(x).padStart(2,'0');
  return digits(now.getHours())+':'+digits(now.getMinutes())+'/'+digits(now.getSeconds());
 }
 function screen(s){
  const pages=build(s),p=pages[C.page]||null;
  const full=p?.lines||[item('PAGE NOT FOUND','red'),item(''),item('ENTER A VALID PAGE NUMBER','yellow')];
  const chunks=[];
  for(let i=0;i<full.length;i+=17)chunks.push(full.slice(i,i+17));
  if(!chunks.length)chunks.push([]);
  const sub=Math.min(C.sub,chunks.length-1),body=chunks[sub],rows=[];
  const num=String(C.page).padStart(3,'0');
  const header='P'+num+' RINGFAX '+num+'  S'+(s?.season||1)+' W'+(s?.week||1);
  rows.push(item(header.padEnd(31,' ')+clock(),'white'));
  const [heading,colour]=BANNERS[C.page]||['SEARCH','red'];
  mosaic(heading).forEach((value,i)=>rows.push({text:value,colour:i===1?colour:'white',background:'blue'}));
  const title=p?.title||'PAGE NOT FOUND';
  const pageInfo=chunks.length>1?'  '+(sub+1)+'/'+chunks.length:'';
  rows.push(item(' '+title.slice(0,35-pageInfo.length).padEnd(35-pageInfo.length,' ')+pageInfo,'white','blue'));
  for(let i=0;i<17;i++)rows.push(body[i]||item(''));
  const links=C.page===777?quizFooter():fastext;
  rows.push({...item(links.map(f=>f.text).join('')) ,segments:links});
  rows.push(item('PAGE '+(C.entry||num).padEnd(3,' ')+'   '+(C.hold?'HOLD  ':'AUTO  ')+'  < > SUBPAGES','yellow'));
  if(rows.length!==25||rows.some(row=>row.text.length!==40))
   throw Error('Ringfax grid must be 25 rows of 40 cells');
  return {page:C.page,title,rows,sub,subpages:chunks.length,exists:!!p};
 }
 function press(action,value,s){
  if(action.startsWith('quiz-')){
   if(C.page!==777)return false;
   C.sub=0;C.hold=true;
   return quizPress(action,value);
  }
  const state=s||root.OfficeGame?.S;
  const pages=build(state);
  if(action==='digit'){
   if(!/^[0-9]$/.test(text(value)))return false;
   C.entry=(C.entry+value).slice(0,3);
   if(C.entry.length===3){const next=Number(C.entry);if(next===777&&C.page!==777)quizReset();
    C.page=next;C.sub=0;C.entry='';C.hold=next===777;}
  }else if(action==='go'){
   const p=Number(value);if(!Number.isInteger(p)||p<0||p>999)return false;
   if(p===777&&C.page!==777)quizReset();
   C.page=p;C.sub=0;C.entry='';C.hold=p===777;
  }else if(action==='clear')C.entry='';
  else if(action==='backspace')C.entry=C.entry.slice(0,-1);
  else if(action==='left'||action==='right'){
   const len=Math.max(1,Math.ceil((pages[C.page]?.lines.length||1)/17));
   C.sub=(C.sub+(action==='left'?-1:1)+len)%len;C.hold=true;
  }else if(action==='hold')C.hold=!C.hold;
  else return false;
  return true;
 }
 function key(k,s){
  if(/^[0-9]$/.test(k))return press('digit',k,s);
  if(k==='ArrowLeft')return press('left',null,s);
  if(k==='ArrowRight')return press('right',null,s);
  if(k===' '||k==='Spacebar')return press('hold',null,s);
  if(k==='Backspace')return press('backspace',null,s);
  const i=['F1','F2','F3','F4'].indexOf(k);
  if(i>=0){const link=C.page===777?quizFooter()[i]:null;
   return link?press(link.action,link.value,s):press('go',fast[i],s);
  }
  return false;
 }
 function view(s){
  const v=screen(s),pages=build(s),favourites=[
   [100,'Index','Home'],[101,'Latest','Headlines'],[200,'Results','Match records'],
   [201,'Ratings','Match grades'],[300,'Rankings','Card ladder'],[302,'Champions','Title holders'],
   [500,'Fanzone','Fan discussion'],[501,'Letters','Reader mail']
  ];
  const rows=v.rows.map((r,i)=>{
   // Four genuine teletext Fastext fields: click the colour to turn the page.
   if(r.segments){
    return '<div class="rf-row rf-fastext">'+r.segments.map(f=>
     '<button type="button" class="rf-fast-seg rf-fast-'+f.colour+
     '" data-rf-action="'+(f.action||'go')+'" data-rf-value="'+(f.value??f.page??'')+
     '" aria-label="'+escape(f.action==='quiz-answer'?'Answer '+['A','B','C','D'][f.value]:'Select '+f.text.trim())+
     '">'+escape(f.text)+'</button>').join('')+'</div>';
   }
   // The row is still exactly 40 cells. A scalable 5×7 pixel logo overlays
   // rows 1–4; this does not alter the teletext model or its navigation.
   if(i===1){
    const title=BANNERS[v.page]?.[0]||'SEARCH';
    return '<div class="rf-row rf-mosaic rf-bg-blue rf-logo-row">'+escape(r.text)+
     '<div class="rf-logo-art" aria-hidden="true">'+pixelLogo(title)+'</div></div>';
   }
   if(C.page===777&&r.answerIndex!==undefined){
    return '<button type="button" class="rf-row rf-quiz-answer rf-'+r.colour+
     '" data-rf-action="quiz-answer" data-rf-value="'+r.answerIndex+
     '" aria-label="'+QUIZ_COLOURS[r.answerIndex]+' answer: '+escape(r.text.trim())+
     '">'+escape(r.text)+'</button>';
   }
   // Index rows have two independently navigable 20-cell columns.
   if(v.page===100&&i>=6&&i<=22){
    const halves=[r.text.slice(0,20),r.text.slice(20,40)];
    const links=halves.map(x=>x.match(/^\s*(\d{3})\s+\S/));
    if(links.some(x=>x&&pages[Number(x[1])])){
     return '<div class="rf-row rf-'+r.colour+' rf-index-row">'+halves.map((half,j)=>{
      const m=links[j],jump=m&&pages[Number(m[1])]?Number(m[1]):null;
      return jump!==null?
       '<button type="button" class="rf-index-half" data-rf-action="go" data-rf-value="'+jump+
       '" aria-label="Open Ringfax page '+jump+'">'+escape(half)+'</button>':
       '<span class="rf-index-half">'+escape(half)+'</span>';
     }).join('')+'</div>';
    }
   }
   const bg=r.background&&r.background!=='black'?' rf-bg-'+r.background:'';
   return '<div class="rf-row rf-'+r.colour+bg+(i>=1&&i<=4?' rf-mosaic':'')+
    (i===0?' rf-header':i===5?' rf-section':'')+'">'+escape(r.text)+'</div>';
  }).join('');
  const quick=favourites.map(([number,label,desc])=>
   '<button type="button" class="rf-page-link'+(v.page===number?' is-current':'')+'" data-rf-action="go" data-rf-value="'+number+'"'+
   (v.page===number?' aria-current="page"':'')+'><span class="rf-link-number">'+number+'</span>'+
   '<span class="rf-link-name">'+escape(label)+'</span><span class="rf-link-detail">'+escape(desc)+'</span></button>').join('');
  const pads=[1,2,3,4,5,6,7,8,9,0].map(n=>
   '<button type="button" data-rf-action="digit" data-rf-value="'+n+'" aria-label="Ringfax digit '+n+'">'+n+'</button>').join('');
  const quizControls=C.page===777?'<div class="rf-quiz-remote" role="group" aria-label="Quiz colour buttons">'+
   quizFooter().map((link,i)=>{
    const a=quizState.stage==='question'?QUIZ_QUESTIONS[quizState.index].a[i]:
     (link.action==='go'?'EXIT TO INDEX':link.text.trim().replace(/^(RED|GRN|YEL|CYN)\s+/,''));
    return '<button type="button" class="rf-quiz-key rf-quiz-key-'+link.colour+
     '" data-rf-action="'+link.action+'" data-rf-value="'+(link.value??'')+
     '" aria-label="'+escape((quizState.stage==='question'?['Red','Green','Yellow','Cyan'][i]+' answer: ':'')+a)+
     '"><span class="rf-quiz-key-colour">'+['RED','GREEN','YELLOW','CYAN'][i]+
     '</span><span>'+escape(a)+'</span></button>';
   }).join('')+'</div>':'';
  const refs=(s?.history||[]).filter(h=>h?.cid&&h?.wid).slice(0,2).map(h=>
   '<button class="btn sm" type="button" data-record="w:'+escape(h.wid)+'">Open '+escape(h.name||'wrestler')+' record</button>').join('');
  const srText=escape('Page '+v.page+', '+v.title+', subpage '+(v.sub+1)+' of '+v.subpages+'. '+
   v.rows.slice(6,23).map(r=>r.text.trim()).filter(Boolean).join(' '));
  return '<section class="rf-wrap'+(C.page===777?' rf-quiz-active':'')+'" aria-label="Ringfax wrestling teletext">'+
   '<div class="rf-display">'+
   '<header class="rf-display-header"><div class="rf-brand"><span class="rf-signal" aria-hidden="true">■</span>'+
   '<strong>RINGFAX</strong><span class="rf-brand-tag">WRESTLING INFORMATION SERVICE</span></div>'+
   '<span class="rf-edition">S'+(s?.season||1)+' W'+(s?.week||1)+' <span class="rf-edition-page">P'+v.page+'</span></span></header>'+
   '<div class="rf-mini-nav">'+
   '<button data-rf-action="go" data-rf-value="100" type="button">100 INDEX</button>'+
   '<button data-rf-action="go" data-rf-value="200" type="button">200 RESULTS</button>'+
   '<button data-rf-action="go" data-rf-value="500" type="button">500 FANS</button></div>'+
   '<div id="rf-screen" class="rf-screen" role="region" aria-label="Ringfax teletext page">'+rows+'</div>'+
   '<p class="rf-display-caption">LIVE FROM THE CIRCUIT <span>●</span> READ-ONLY EDITION <span>●</span> '+escape(v.title)+'</p>'+
   '</div>'+
   '<aside class="rf-console" aria-label="Ringfax controls">'+
   quizControls+
   '<div class="rf-console-title"><span>RINGFAX DIRECTORY</span><strong>PAGE '+v.page+'</strong></div>'+
   '<div class="rf-page-grid" role="group" aria-label="Go to a Ringfax page">'+quick+'</div>'+
   '<div class="rf-operator"><div class="rf-operator-label"><span>GO TO PAGE</span><span>3 DIGITS</span></div>'+
   '<div class="rf-jump"><input id="rf-page-entry" type="text" inputmode="numeric" autocomplete="off"'+
   ' maxlength="3" pattern="[0-9]{3}" placeholder="e.g. 501" aria-label="Ringfax three-digit page number">'+
   '<button type="button" data-rf-action="jump" aria-label="Open entered Ringfax page">GO</button></div></div>'+
   '<div class="rf-sub-nav" role="group" aria-label="Reader subpages">'+
   '<button type="button" data-rf-action="left" aria-label="Previous Ringfax subpage"'+(v.subpages<2?' disabled':'')+'>◀ PREV</button>'+
   '<span aria-label="Subpage '+(v.sub+1)+' of '+v.subpages+'">'+(v.sub+1)+' / '+v.subpages+'</span>'+
   '<button type="button" data-rf-action="right" aria-label="Next Ringfax subpage"'+(v.subpages<2?' disabled':'')+'>NEXT ▶</button></div>'+
   '<button type="button" class="rf-hold" data-rf-action="hold" aria-pressed="'+C.hold+'">'+(C.hold?'▶ RESUME AUTOMATIC PAGES':'Ⅱ HOLD THIS SUBPAGE')+'</button>'+
   '<details class="rf-keypad"><summary>TELETEXT NUMBER PAD <span aria-hidden="true">▾</span></summary>'+
   '<div class="rf-pad-grid">'+pads+'<button type="button" data-rf-action="clear">CLEAR</button></div></details>'+
   (refs?'<div class="rf-records">'+refs+'</div>':'')+
   '<p class="rf-help">Choose a page above, enter its number, or click a numbered line on page 100. Arrow keys change subpages; F1–F4 open the coloured sections.</p>'+
   '<details class="rf-access"><summary>Read this page as plain text</summary><pre>'+escape(v.rows.map(r=>r.text.trimEnd()).join('\n'))+'</pre></details>'+
   '<p class="rf-disclaimer">Fan comments are fictional; match results come from your career.</p>'+
   '</aside>'+
   '<p id="rf-announcement" class="sr" role="status" aria-live="polite">'+srText+'</p>'+
   '</section>';
 }
 function fit(){
  const d=root.document;
  const el=d?.querySelector('#rf-screen');
  if(!el||typeof root.getComputedStyle!=='function')return;
  const cs=root.getComputedStyle(el),
   px=name=>parseFloat(cs[name])||0,
   width=el.clientWidth-px('paddingLeft')-px('paddingRight')-2,
   height=el.clientHeight-px('paddingTop')-px('paddingBottom')-2;
  if(width<=0||height<=0)return;
  // Measure ACTUAL rendered text. On Android, teletext fallback fonts and
  // Unicode mosaics don't necessarily share the width of a VT323 letter.
  const probe=d.createElement('span');
  probe.style.cssText='position:absolute;left:-99999px;top:-99999px;visibility:hidden;white-space:pre;font-family:VT323,monospace;font-size:100px;font-weight:400;letter-spacing:0';
  el.appendChild(probe);
  const strings=['M'.repeat(40),'W'.repeat(40),'0'.repeat(40),'RINGFAX'.repeat(5).padEnd(40,' ')];
  const ratio=Math.max(...strings.map(value=>{
   probe.textContent=value;
   return probe.getBoundingClientRect().width/4000;
  }));
  probe.remove();
  let size=Math.min(36,height/(25*1.12),width/(40*ratio))*.965;
  size=Math.max(7.5,Math.floor(size*100)/100);
  el.style.setProperty('--rf-font-size',size+'px');
  el.style.setProperty('--rf-tracking','0px');
  // Measure again after layout; padding, browser font fallback and zoom can
  // differ from an offscreen width probe. Don't accept clipped characters.
  for(let attempt=0;attempt<5;attempt++){
   const rows=el.querySelectorAll('.rf-row');
   if(!Array.from(rows).some(row=>row.scrollWidth>row.clientWidth+1))break;
   size=Math.max(7.5,Math.floor(size*95)/100);
   el.style.setProperty('--rf-font-size',size+'px');
  }
 }
 if(root.document&&root.document.fonts?.ready)root.document.fonts.ready.then(fit);
 if(root.addEventListener)root.addEventListener('resize',fit);
 if(typeof root.setInterval==='function'&&root.document){
  // Broadcast clock is real wall-clock time, never an invented in-game day.
  root.setInterval(()=>{
   const h=root.document.querySelector('#rf-screen .rf-header');
   if(h&&root.OfficeGame?.S)h.textContent=screen(root.OfficeGame.S).rows[0].text;
  },1000);
  root.setInterval(()=>{
   if(C.page===777||C.hold||root.document.hidden||!root.document.querySelector('#rf-screen'))return;
   const p=build(root.OfficeGame?.S)[C.page],n=Math.ceil((p?.lines.length||0)/17);
   if(n>1){C.sub=(C.sub+1)%n;root.document.dispatchEvent(new root.Event('ringfax-page-rotated'));}
  },8000);
 }
 root.OfficeRingfax={build,screen,view,fit,press,key,voices,quizInfo,
  quizQuestions:QUIZ_QUESTIONS.map(q=>({...q,a:q.a.slice()})),
  reset:()=>{C.page=100;C.sub=0;C.entry='';C.hold=false;quizReset();}};
})(typeof window!=='undefined'?window:globalThis);
