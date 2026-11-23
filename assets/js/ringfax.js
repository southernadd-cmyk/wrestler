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
 function build(s){
  const h=latest(s),recent=recents(s),P={};
  const add=(number,title,lines)=>{P[number]={number,title,lines:lines.slice()};};
  // A proper two-column teletext index, not a conventional app menu.
  // Each 20-character half remains individually clickable in the renderer.
  const pair=(left,right,colour='white')=>item(line(left,20)+line(right,20),colour);
  let a=[
   item('  NEWS AND RESULTS    SPORT & FANS','yellow'),
   item('  --------------------------------','blue'),
   pair('101 HEADLINES','300 RANKINGS','white'),
   pair('200 RESULTS','302 TITLES','cyan'),
   pair('201 RATINGS','500 FANZONE','white'),
   pair('100 INDEX','501 LETTERS','cyan'),
   item('  --------------------------------','blue'),
   item(''),
   item('  LATEST FROM THE WRESTLING WORLD','yellow')
  ];
  if(h){
   paragraphs(a,h.name+' versus '+h.foe,'cyan');
   paragraphs(a,'Season '+h.season+' week '+h.week+' / '+score(h));
  }else{
   paragraphs(a,'A new season on the circuit.','cyan');
   paragraphs(a,'Match reports follow the first bell.');
  }
  a.push(item(''),item('  FAN OPINION: THE FANZONE 500','green'),
   item('  READERS LETTERS .......... 501','yellow'));
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

  // Opening-week letters are explicitly opinions about the season, not invented match results.
  const opening=[
   {name:'GRAPPLEGRAN',quote:'A new season. Give me a clean finish and a wrestler I can get behind.'},
   {name:'HEELTURN78',quote:'Everyone wants a hero. I want a villain worth booing.'},
   {name:'MATWORKMICK',quote:'All I ask is one proper technical contest. The bells will tell the story.'},
   {name:'TICKETSTUB',quote:'Tickets are not free. The promoters need to earn our money.'}
  ];
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
   paragraphs(a,'OPENING WEEK / FIRST IMPRESSIONS','cyan');
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
   paragraphs(a,'OPENING WEEK / READERS MAIL','cyan');
   a.push(item(''));
   for(const f of opening){
    a.push(item('FROM: '+f.name,'green'));
    paragraphs(a,f.quote);
    a.push(item(''));
   }
  }
  add(501,'READERS LETTERS',a);
  return P;
 }
 const fast=[100,200,300,500];
 // 4 x 4 pixel-cell letters, sized like a real teletext mosaic masthead.
 // Every row remains exactly forty character cells (no SVG or raster image).
 const LETTERS={
  A:[' ██ ','█  █','████','█  █'],B:['███ ','█  █','███ ','███ '],
  C:[' ███','█   ','█   ',' ███'],D:['███ ','█  █','█  █','███ '],
  E:['████','██  ','██  ','████'],F:['████','██  ','██  ','█   '],
  G:[' ███','█   ','█ ██',' ███'],H:['█  █','█  █','████','█  █'],
  I:['████',' ██ ',' ██ ','████'],J:['████','  █ ','  █ ','███ '],
  K:['█  █','█ █ ','██  ','█ █ '],L:['█   ','█   ','█   ','████'],
  M:['█  █','████','█  █','█  █'],N:['█  █','██ █','█ ██','█  █'],
  O:[' ██ ','█  █','█  █',' ██ '],P:['███ ','█  █','███ ','█   '],
  Q:[' ██ ','█  █','█ ██',' ███'],R:['███ ','█  █','███ ','█ ██'],
  S:[' ███','█   ',' ██ ','███ '],T:['████',' ██ ',' ██ ',' ██ '],
  U:['█  █','█  █','█  █','████'],V:['█  █','█  █','█  █',' ██ '],
  W:['█  █','█  █','████','█  █'],X:['█  █',' ██ ',' ██ ','█  █'],
  Y:['█  █',' ██ ',' ██ ',' ██ '],Z:['████','  █ ',' █  ','████'],
  ' ':['    ','    ','    ','    ']
 };
 const BANNERS={
  100:['RINGFAX','yellow'],101:['LATEST','cyan'],200:['RESULTS','green'],
  201:['RATINGS','yellow'],300:['RANKINGS','green'],302:['TITLES','cyan'],
  500:['FANZONE','magenta'],501:['LETTERS','yellow']
 };
 function mosaic(word){
  const chars=word.split('').map(c=>LETTERS[c]||LETTERS[' ']);
  return [0,1,2,3].map(i=>{
   const rendered=chars.map(c=>c[i]).join(' ');
   return line(' '.repeat(Math.max(0,Math.floor((40-rendered.length)/2)))+rendered);
  });
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
  for(const value of mosaic(heading))rows.push(item(value,colour,'blue'));
  const title=p?.title||'PAGE NOT FOUND';
  const pageInfo=chunks.length>1?'  '+(sub+1)+'/'+chunks.length:'';
  rows.push(item(' '+title.slice(0,35-pageInfo.length).padEnd(35-pageInfo.length,' ')+pageInfo,'white','blue'));
  for(let i=0;i<17;i++)rows.push(body[i]||item(''));
  rows.push({...item(fastext.map(f=>f.text).join('')) ,segments:fastext});
  rows.push(item('PAGE '+(C.entry||num).padEnd(3,' ')+'   '+(C.hold?'HOLD  ':'AUTO  ')+'  < > SUBPAGES','yellow'));
  if(rows.length!==25||rows.some(row=>row.text.length!==40))
   throw Error('Ringfax grid must be 25 rows of 40 cells');
  return {page:C.page,title,rows,sub,subpages:chunks.length,exists:!!p};
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
  if(i>=0)return press('go',fast[i],s);
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
     '" data-rf-action="go" data-rf-value="'+f.page+'" aria-label="Open '+f.page+
     '">'+escape(f.text)+'</button>').join('')+'</div>';
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
  const refs=(s?.history||[]).filter(h=>h?.cid&&h?.wid).slice(0,2).map(h=>
   '<button class="btn sm" type="button" data-record="w:'+escape(h.wid)+'">Open '+escape(h.name||'wrestler')+' record</button>').join('');
  const srText=escape('Page '+v.page+', '+v.title+', subpage '+(v.sub+1)+' of '+v.subpages+'. '+
   v.rows.slice(6,23).map(r=>r.text.trim()).filter(Boolean).join(' '));
  return '<section class="rf-wrap" aria-label="Ringfax wrestling teletext">'+
   '<div class="rf-display">'+
   '<header class="rf-display-header"><div class="rf-brand"><span class="rf-signal" aria-hidden="true">■</span>'+
   '<strong>RINGFAX</strong><span class="rf-brand-tag">WRESTLING INFORMATION SERVICE</span></div>'+
   '<span class="rf-edition">S'+(s?.season||1)+' W'+(s?.week||1)+' <span class="rf-edition-page">P'+v.page+'</span></span></header>'+
   '<div class="rf-mini-nav">'+
   '<button data-rf-action="go" data-rf-value="100" type="button">100 INDEX</button>'+
   '<button data-rf-action="go" data-rf-value="200" type="button">200 RESULTS</button>'+
   '<button data-rf-action="go" data-rf-value="500" type="button">500 FANS</button></div>'+
   '<div id="rf-screen" class="rf-screen" aria-hidden="true">'+rows+'</div>'+
   '<p class="rf-display-caption">LIVE FROM THE CIRCUIT <span>●</span> READ-ONLY EDITION <span>●</span> '+escape(v.title)+'</p>'+
   '</div>'+
   '<aside class="rf-console" aria-label="Ringfax controls">'+
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
  const d=root.document;if(!d)return;
  const el=d.querySelector('#rf-screen');if(!el)return;
  const getStyle=root.getComputedStyle;if(typeof getStyle!=='function')return;
  const cs=getStyle(el),padX=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0),
   padY=(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0);
  const width=Math.max(0,el.clientWidth-padX-4),height=Math.max(0,el.clientHeight-padY-4);
  if(!width||!height)return;
  const measure=d.createElement('span');
  measure.textContent='MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM';
  measure.style.cssText='position:absolute;left:-99999px;top:-99999px;visibility:hidden;white-space:pre;font-family:VT323,monospace;font-size:100px;letter-spacing:0';
  el.appendChild(measure);
  const charWidth=Math.max(0.35,measure.getBoundingClientRect().width/4000);
  measure.remove();
  const size=Math.min(36,height/(25*1.13),width/(40*charWidth));
  const glyph=Math.max(8,Math.floor(size*100)/100);
  const tracking=Math.max(0,Math.min(glyph*.38,(width-40*glyph*charWidth)/40));
  el.style.setProperty('--rf-font-size',glyph+'px');
  el.style.setProperty('--rf-tracking',tracking+'px');
 }
 if(root.document&&root.document.fonts?.ready)root.document.fonts.ready.then(fit);
 if(root.addEventListener)root.addEventListener('resize',fit);
 if(typeof root.setInterval==='function'&&root.document){
  root.setInterval(()=>{
   if(C.hold||root.document.hidden||!root.document.querySelector('#rf-screen'))return;
   const p=build(root.OfficeGame?.S)[C.page],n=Math.ceil((p?.lines.length||0)/17);
   if(n>1){C.sub=(C.sub+1)%n;root.document.dispatchEvent(new root.Event('ringfax-page-rotated'));}
  },8000);
 }
 root.OfficeRingfax={build,screen,view,fit,press,key,voices,reset:()=>{C.page=100;C.sub=0;C.entry='';C.hold=false;}};
})(typeof window!=='undefined'?window:globalThis);
