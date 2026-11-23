/* RINGFAX — a read-only teletext view of the actual career.
   No hooks into match simulation, no calls to the career RNG and no new saved state. */
(function installRingfax(root){'use strict';
 const D=root.OfficeData;
 const C={page:100,sub:0,entry:'',hold:false};
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
 function item(value,colour='white'){return {text:line(value),colour};}
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
 function build(s){
  const h=latest(s),recent=recents(s),P={};
  const add=(number,title,lines)=>{P[number]={number,title,lines:lines.slice()};};
  let a=[item(' THE WORLD OF WRESTLING','yellow'),item(''),item('LATEST FROM THE CIRCUIT','cyan')];
  if(h){paragraphs(a,'MATCH: '+h.name+' versus '+h.foe);paragraphs(a,'S'+h.season+' W'+h.week+' / '+score(h),'yellow');}
  else paragraphs(a,'No completed matches yet. Sign a wrestler and work a show.');
  a.push(item(''),item('101  LATEST HEADLINE','cyan'),item('200  RESULTS AND MATCHES','cyan'),item('201  MATCH GRADES','cyan'),
    item('300  PROMOTION RANKINGS','cyan'),item('302  CHAMPIONS','cyan'),item('500  THE FANZONE','green'),item('501  READERS LETTERS','green'));
  add(100,'RINGFAX INDEX',a);

  a=[item('THE LATEST FROM THE RING','yellow'),item('')];
  if(h){
   paragraphs(a,h.name+' versus '+h.foe,'cyan');
   paragraphs(a,'Reported from '+text(h.promoter||h.pid||'the circuit')+'.');
   paragraphs(a,'S'+h.season+' W'+h.week+' / '+score(h),'yellow');
   paragraphs(a,resultLine(h),'green');
   if(h.outcome==='dq')paragraphs(a,'Match ended by disqualification.');
   else if(h.outcome==='nc')paragraphs(a,'Match ended with no contest.');
   else if(h.outcome==='double')paragraphs(a,'The agreed finish was broken.');
   else paragraphs(a,'The result has been entered in the official record.');
  }else paragraphs(a,'No match reports are available. The newsroom will update after a completed bout.');
  add(101,'LATEST HEADLINE',a);

  a=[item('RECENT COMPLETED MATCHES','yellow'),item('')];
  if(!recent.length)paragraphs(a,'No match results recorded yet.');
  recent.slice(0,8).forEach((r,i)=>{
   a.push(item('S'+r.season+' W'+r.week+' '+(i+1)+'. '+text(r.name),'cyan'));
   paragraphs(a,'v '+text(r.foe)+' / '+score(r),'white');
   paragraphs(a,resultLine(r),'green');
   a.push(item(''));
  });
  add(200,'RESULTS',a);

  a=[item('RECORDED MATCH RATINGS','yellow'),item('')];
  const ratings=recent.filter(r=>Number.isFinite(r.stars));
  if(!ratings.length)paragraphs(a,'No rated matches recorded yet.');
  ratings.slice(0,8).forEach(r=>{
   paragraphs(a,'S'+r.season+' W'+r.week+' '+r.name+' v '+r.foe,'cyan');
   a.push(item(' '+r.stars.toFixed(2)+' stars','yellow'));
  });
  if(ratings.length){
   const sample=ratings.slice(0,8),avg=sample.reduce((sum,x)=>sum+x.stars,0)/sample.length;
   a.push(item(''),item('MEAN OF '+sample.length+' SHOWN MATCHES: '+avg.toFixed(2),'green'));
  }
  add(201,'MATCH GRADES',a);

  const p=s?.promoters?.[0]||D?.PROMOS?.[0]||null;
  const div=D?.DIVISION_ORDER?.[0]||null;
  const cards=s?.territory?.cards?.[p?.id]||{};
  const ranked=Object.entries(cards).filter(([id,row])=>row&&Number.isFinite(row.score)&&(!div||D?.divisionOf?.(id)===div))
    .sort((x,y)=>y[1].score-x[1].score).slice(0,10);
  a=[item('PROMOTION: '+(p?.name||'Unknown'),'yellow'),item('DIVISION: '+(div||'unavailable'),'cyan'),item('')];
  if(!ranked.length)paragraphs(a,'Card rankings are not available for this promotion.');
  ranked.forEach(([id,v],i)=>a.push(item(' '+String(i+1).padStart(2,' ')+' '+rankName(id).slice(0,27)+' '+Math.round(v.score),'white')));
  a.push(item(''),item('A SINGLE PROMOTION / DIVISION','cyan'));
  add(300,'CARD RANKINGS',a);

  a=[item('CHAMPIONS BY PROMOTION','yellow'),item('')];
  const titles=s?.territory?.titles||{};
  let have=false;
  for(const promo of s?.promoters||[]){
   for(const division of D?.DIVISION_ORDER||[]){
    const t=titles[promo.id]?.[division];if(!t)continue;have=true;
    a.push(item(' '+promo.name+' / '+division,'cyan'));
    paragraphs(a,rankName(t.holder||'Vacant'),'white');
   }
  }
  if(!have)paragraphs(a,'Title information not available.');
  add(302,'TITLE PICTURE',a);

  const fans=voices(h,3);
  a=[item('WHAT THE FANS ARE SAYING','yellow'),item('')];
  if(h){
   paragraphs(a,'TOPIC: '+h.name+' v '+h.foe,'cyan');
   a.push(item(''));
   fans.forEach(f=>{
    a.push(item(' '+f.name,'green'));
    paragraphs(a,'"'+f.quote+'"');
    a.push(item(''));
   });
  }else paragraphs(a,'The phones are quiet. The letters page will open after the first completed match.');
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
  }else paragraphs(a,'No readers letters yet. A result is needed before the fictional readers have something to debate.');
  add(501,'READERS LETTERS',a);
  return P;
 }
 const fast=[100,200,300,500];
 function screen(s){
  const pages=build(s),p=pages[C.page]||null;
  const full=p?.lines||[item('PAGE NOT FOUND','red'),item(''),item('ENTER A PAGE NUMBER TO TRY AGAIN','yellow')];
  const chunks=[];
  for(let i=0;i<full.length;i+=19)chunks.push(full.slice(i,i+19));
  if(!chunks.length)chunks.push([]);
  const sub=Math.min(C.sub,chunks.length-1),body=chunks[sub],rows=[];
  rows.push(item('RINGFAX P'+String(C.page).padStart(3,'0')+'  S'+(s?.season||1)+' W'+(s?.week||1)+'   '+(p?'':'SEARCHING'),'yellow'));
  rows.push(item(' ' +(p?.title||'PAGE NOT FOUND'),'white'));
  rows.push(item(' '+(p?'SUBPAGE '+(sub+1)+'/'+chunks.length:'NO DATA AT THIS ADDRESS'),'cyan'));
  rows.push(item(''));
  for(let i=0;i<19;i++)rows.push(body[i]||item(''));
  rows.push(item('RED:100 GRN:200 YEL:300 CYN:500','green'));
  rows.push(item('PAGE '+(C.entry||String(C.page).padStart(3,'0'))+'   '+(C.hold?'HOLD':'')+'  LEFT/RIGHT:MORE','yellow'));
  if(rows.length!==25||rows.some(r=>r.text.length!==40))throw Error('Ringfax grid must be 25 rows of 40 cells');
  return {page:C.page,title:p?.title||'Page not found',rows,sub,subpages:chunks.length,exists:!!p};
 }
 function press(action,value,s){
  const state=s||root.OfficeGame?.S;
  const pages=build(state);
  if(action==='digit'){
   if(!/^[0-9]$/.test(text(value)))return false;
   C.entry=(C.entry+value).slice(0,3);
   if(C.entry.length===3){C.page=Number(C.entry);C.sub=0;C.entry='';C.hold=false;}
  }else if(action==='go'){
   const p=Number(value);if(!Number.isInteger(p)||p<0||p>999)return false;
   C.page=p;C.sub=0;C.entry='';C.hold=false;
  }else if(action==='clear')C.entry='';
  else if(action==='left'||action==='right'){
   const len=Math.max(1,Math.ceil((pages[C.page]?.lines.length||1)/19));
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
  if(k==='Backspace')return press('clear',null,s);
  const i=['F1','F2','F3','F4'].indexOf(k);
  if(i>=0)return press('go',fast[i],s);
  return false;
 }
 function view(s){
  const v=screen(s);
  const rows=v.rows.map((r,i)=>'<div class="rf-row rf-'+(i===1?'banner':i===23?'fastext':r.colour)+'">'+escape(r.text)+'</div>').join('');
  const pads=Array.from({length:10},(_,i)=>'<button type="button" data-rf-action="digit" data-rf-value="'+i+'" aria-label="Ringfax digit '+i+'">'+i+'</button>').join('');
  const anchors=fast.map((p,i)=>'<button type="button" class="rf-fast rf-fast-'+i+'" data-rf-action="go" data-rf-value="'+p+'">'+['Index','Results','Rankings','Fanzone'][i]+'</button>').join('');
  const refs=(s?.history||[]).filter(h=>h?.cid&&h?.wid).slice(0,2).map(h=>
   '<button class="btn sm" type="button" data-record="w:'+escape(h.wid)+'">Open '+escape(h.name||'wrestler')+' record</button>').join('');
  return '<section class="rf-wrap" aria-label="Ringfax wrestling teletext">'+
   '<div class="rf-heading"><div><h2>Ringfax</h2><p>The wrestling information service — fictional readers, real career results.</p></div><span>PAGE '+v.page+'</span></div>'+
   '<div id="rf-screen" class="rf-screen" aria-hidden="true">'+rows+'</div>'+
   '<div class="rf-controls" aria-label="Ringfax remote">'+anchors+
   '<div class="rf-remote"><button type="button" data-rf-action="left" aria-label="Previous subpage">◀</button>'+
   '<button type="button" data-rf-action="hold">'+(C.hold?'Resume':'Hold')+'</button>'+
   '<button type="button" data-rf-action="right" aria-label="Next subpage">▶</button>'+
   '<button type="button" data-rf-action="clear">Clear</button>'+pads+'</div></div>'+
   '<p class="rf-help">Type three digits, use F1–F4 for coloured shortcuts, or browse with the remote. Fictional fan voices appear after real completed matches.</p>'+
   (refs?'<div class="rf-records">'+refs+'</div>':'')+
   '<details class="rf-access"><summary>Read this teletext page as plain text</summary><pre>'+escape(v.rows.map(r=>r.text.trimEnd()).join('\n'))+'</pre></details>'+
   '</section>';
 }
 if(typeof root.setInterval==='function'&&root.document){
  root.setInterval(()=>{
   if(C.hold||root.document.hidden||!root.document.querySelector('#rf-screen'))return;
   const p=build(root.OfficeGame?.S)[C.page],n=Math.ceil((p?.lines.length||0)/19);
   if(n>1){C.sub=(C.sub+1)%n;root.document.dispatchEvent(new root.Event('ringfax-page-rotated'));}
  },8000);
 }
 root.OfficeRingfax={build,screen,view,press,key,voices,reset:()=>{C.page=100;C.sub=0;C.entry='';C.hold=false;}};
})(typeof window!=='undefined'?window:globalThis);
