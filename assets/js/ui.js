/* THE OFFICE — interface v3
   Management-sim desktop: persistent sidebar, back/forward history, one job per screen,
   sortable data tables, master–detail lists and a full wrestler profile. */
(function(){'use strict';
const D=OfficeData,G=OfficeGame,Mx=OfficeMatch,Pt=OfficePortraits;
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=G.money;
const S=()=>G.S;
let route={s:'desk',id:null},past=[],ahead=[];
let openMsg=null,pick={},selOffer=null,selFree=null,night=null,toastT=0;
// Presentation preferences only; no changes to career state or match simulation.
let inboxFilter='all',stableFilter='all',stableQuery='',scoutQuery='',scoutStyle='all',scoutBudget='all',shortlist=[],scoutFiltersOpen=false;
let identityMode='new',identityPortrait=0,newCareerApproved=false;
let commentaryView='all'; // local view only: never changes match or commentary generation
let trainingSelected=null,trainingPane='development',trainingReportWeek=null; // training-screen presentation only
const sorts={};

/* ---------- small helpers ---------- */
function face(type,id,name,cls='portrait'){return Pt.avatar({key:type+':'+id,name,type},null,cls)}
function identityCard(includeEdit=false){
 const p=G.normaliseIdentity(S()?.identity);
 return '<div class="player-identity-card">'+Pt.playerPortrait(p.portrait,p.manager,'portrait')+
  '<div class="player-identity-text"><b>'+esc(p.manager)+'</b><span>'+esc(p.stable)+'</span></div>'+
  (includeEdit?'<button class="btn sm" type="button" data-act="profile">Edit identity</button>':'')+
  '</div>';
}
// Contextual records use IDs, not names, so a renamed character still opens correctly.
function recordLink(kind,id,name){
 if(!id)return esc(name);
 return `<button class="record-link" data-record="${kind}:${esc(id)}" aria-label="Open ${esc(name)} ${kind==='p'?'promotion':'wrestler'} record">${esc(name)}</button>`;
}
function recordBack(){return past.length?'<button class="btn sm" data-hist="back">◀ Back</button>':'<button class="btn sm" data-go="desk">Office desk</button>'}
function openRecord(key){
 const [kind,id]=String(key||'').split(':');if(!id)return;
 if(kind==='w'){
  if(G.W(id))return go('profile',id);
  if(!G.F(id)&&!S().free.some(w=>w.id===id))return;
 }else if(kind==='p'){if(!G.P(id))return}
 else return;
 go('record',kind+':'+id);
}
function band(v){return v>=80?5:v>=65?4:v>=50?3:v>=35?2:1}
function bandBar(v){return ['','danger','warn','gold','',''][band(v)]}
function att(v){return `<span class="att a${band(v)}">${Math.round(v)}</span>`}
const STAT_HELP={ring:'Technical wrestling and execution in the ring',psych:'Psychology: pacing, selling and telling a match story',safe:'Safety: controlling risk and protecting opponents',mic:'Speaking and performing promos',heat:'Audience interest and intensity around a wrestler'};
const statLegend='<p class="stat-legend">Ratings: <b>under 35</b> developing · <b>35–49</b> basic · <b>50–64</b> solid · <b>65–79</b> strong · <b>80+</b> exceptional. Colours are a quick guide; the numbers are the rating.</p>';
/* ---------- charts (v3.8) ----------
   Plain line and bar charts in the office's own colours. The plot is an SVG stretched to fit;
   dots, marks and labels are HTML laid over it, so text stays crisp at any width. */
function chart(o){
 const X=x=>((x-o.x[0])/Math.max(1e-9,o.x[1]-o.x[0]))*100,Y=y=>100-((y-o.y[0])/Math.max(1e-9,o.y[1]-o.y[0]))*100,r=n=>Math.round(n*100)/100;
 const base=Y(Math.max(o.y[0],0));
 const grid=(o.yTicks||[]).map(([y])=>`<line class="ch-grid" x1="0" x2="100" y1="${r(Y(y))}" y2="${r(Y(y))}"/>`).join('');
 const bars=(o.bars||[]).map(b=>{const top=Y(b.y);return `<rect class="ch-bar c-${b.col}" x="${r(X(b.x)-b.w/2)}" width="${b.w}" y="${r(Math.min(top,base))}" height="${r(Math.abs(base-top))}"/>`}).join('');
 const path=l=>{let pts=l.pts.map(([x,y])=>[X(x),Y(y)]);if(l.step){const out=[];pts.forEach((pt,i)=>{if(i)out.push([pt[0],pts[i-1][1]]);out.push(pt)});pts=out;}return pts.map(pt=>r(pt[0])+','+r(pt[1])).join(' ')};
 const lines=(o.lines||[]).filter(l=>l.pts.length).map(l=>`<polyline class="ch-line c-${l.col}" points="${path(l)}"/>`).join('');
 const dots=(o.lines||[]).filter(l=>l.dots).flatMap(l=>l.pts.map(([x,y,t])=>`<i class="ch-dot c-${l.col}" style="left:${r(X(x))}%;top:${r(Y(y))}%" title="${esc(t||'')}"></i>`)).join('');
 const marks=(o.marks||[]).map(m=>`<i class="ch-mark c-${m.col}" style="left:${r(X(m.x))}%" title="${esc(m.title||'')}"><b>${esc(m.sym||'')}</b></i>`).join('');
 const yl=(o.yTicks||[]).map(([y,t])=>{const top=Y(y);return `<span class="${top<6?'ch-top':top>94?'ch-bot':''}" style="top:${r(top)}%">${esc(t)}</span>`}).join('');
 const xl=(o.xTicks||[]).map(([x,t])=>`<span style="left:${r(X(x))}%">${esc(t)}</span>`).join('');
 const legend=[...(o.lines||[]).filter(l=>l.label).map(l=>`<span><i class="c-${l.col}"></i>${esc(l.label)}</span>`),...(o.barLabel?[`<span><i class="c-${o.barLabel[1]} sq"></i>${esc(o.barLabel[0])}</span>`]:[])].join('');
 return `<figure class="chart" role="img" aria-label="${esc(o.aria)}"><div class="ch-plot" style="height:${o.h||130}px"><div class="ch-y" aria-hidden="true">${yl}</div><div class="ch-area"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${grid}${bars}${lines}</svg>${dots}${marks}</div></div><div class="ch-x" aria-hidden="true">${xl}</div>${legend?`<figcaption class="ch-legend">${legend}</figcaption>`:''}</figure>`;
}
const CH_COLS=['gold','cyan','good','white','warn'];
const chartEmpty=t=>`<p class="dim chart-empty">${esc(t)}</p>`;
const shortMoney=n=>(n<0?'−':'')+'£'+(Math.abs(n)>=1000?(Math.abs(n)/1000).toFixed(Math.abs(n)>=10000?0:1)+'k':Math.round(Math.abs(n)));
function niceRange(vals,pad,lo=-Infinity,hi=Infinity){const a=Math.min(...vals),b=Math.max(...vals),p=Math.max(pad,(b-a)*.1);return [Math.max(lo,Math.floor(a-p)),Math.min(hi,Math.ceil(b+p))];}
// Each wrestler's attributes, week by week.
function formChart(w){
 const t=w.trend||[];if(t.length<2)return chartEmpty('This fills in week by week as '+w.short+' trains and works.');
 const keys=[['ring','Ring','gold'],['mic','Mic','cyan'],['psych','Psychology','good'],['safe','Safety','white']];
 const y=niceRange(t.flatMap(p=>keys.map(([k])=>p[k])),3,0,100),x=[t[0].a,t.at(-1).a];
 const first=t[0],last=t.at(-1),moved=keys.filter(([k])=>last[k]!==first[k]).map(([k,n])=>n+' '+(last[k]>first[k]?'+':'')+(last[k]-first[k]));
 return chart({h:120,x,y,step:true,lines:keys.map(([k,n,col])=>({pts:t.map(p=>[p.a,p[k]]),col,label:n,step:true})),
  yTicks:[y[0],Math.round((y[0]+y[1])/2),y[1]].map(v=>[v,String(v)]),xTicks:[[x[0],weekLabel(x[0])],[x[1],weekLabel(x[1])]],
  aria:`${w.short}’s attributes from ${weekLabel(x[0])} to ${weekLabel(x[1])}. ${moved.length?moved.join(', '):'No change'}.`});
}
// A wrestler's star ratings, match by match.
function ratingsChart(w,hist){
 const h=hist.slice(0,12).reverse();if(h.length<2)return '';
 return chart({h:90,x:[-.5,h.length-.5],y:[0,5],lines:[{pts:h.map((m,i)=>[i,m.stars,`S${m.season} W${m.week} v ${m.foe}: ${starsText(m.stars)||'DUD'}`]),col:'gold',dots:true}],
  yTicks:[[0,'0'],[2.5,'2½'],[5,'5★']],xTicks:[[0,'S'+h[0].season+' W'+h[0].week],[h.length-1,'S'+h.at(-1).season+' W'+h.at(-1).week]],
  aria:`${w.short}’s last ${h.length} ratings, from ${starsText(h[0].stars)||'a dud'} to ${starsText(h.at(-1).stars)||'a dud'}.`});
}
// Bank balance against the weekly bill.
function booksChart(){
 const b=S().books||[];if(b.length<2)return '';
 const cash=b.map(x=>x.cash),bill=b.map(x=>x.wages+x.other),y=niceRange([...cash,...bill,0],100);
 const x=[b[0].a-.5,b.at(-1).a+.5],w=Math.min(6,70/b.length);
 return chart({h:80,x,y,lines:[{pts:b.map(p=>[p.a,p.cash]),col:'gold',label:'Bank'}],bars:b.map(p=>({x:p.a,y:p.wages+p.other,w,col:'blood'})),barLabel:['Weekly bill','blood'],
  yTicks:[y[0],0,y[1]].filter((v,i,a)=>a.indexOf(v)===i).map(v=>[v,shortMoney(v)]),xTicks:[[b[0].a,weekLabel(b[0].a)],[b.at(-1).a,weekLabel(b.at(-1).a)]],
  aria:`Bank from ${money(cash[0])} to ${money(cash.at(-1))} over ${b.length} weeks; the weekly bill was ${money(bill.at(-1))} last week.`});
}
// Every match the stable worked this season, by week and wrestler.
function seasonChart(){
 const s=S(),h=(s.seasonResults||s.history).filter(x=>x.season===s.season);if(!h.length)return chartEmpty('Ratings for this season appear here as the stable works.');
 const by={};for(const m of h.slice().sort((a,b)=>a.week-b.week))(by[m.wid]??={name:m.name||G.W(m.wid)?.name||m.wid,pts:[]}).pts.push([m.week,m.stars,`W${m.week} ${m.name||G.W(m.wid)?.name||m.wid} v ${m.foe||'opponent'}: ${starsText(m.stars)||'DUD'}`]);
 const lines=Object.values(by).map((l,i)=>({pts:l.pts,col:CH_COLS[i%CH_COLS.length],label:l.name.split(' ').slice(-1)[0],dots:true}));
 const avg=h.reduce((t,m)=>t+m.stars,0)/h.length;
 return chart({h:120,x:[.5,16.5],y:[0,5],lines,yTicks:[[0,'0'],[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5★']],xTicks:[1,4,8,12,16].map(k=>[k,'W'+k]),
  aria:`Season ${s.season}: ${h.length} ${plural(h.length,'match','matches')}, averaging ${avg.toFixed(1)} stars.`});
}
// The crowd through one match, with the running order marked where each beat settled.
function crowdChart(trace,len,strip){
 if(!trace||trace.length<3)return '';
 const sym={achieved:'✓',adapted:'↻',missed:'✗'},col={achieved:'good',adapted:'warn',missed:'blood'};
 const marks=(strip?.beats||[]).filter(b=>b.mark!=null&&sym[b.state]).map(b=>({x:(b.start+b.width*b.mark/100)/100*len,col:col[b.state],sym:sym[b.state],title:b.title}));
 const vals=trace.map(p=>p[1]),peak=Math.max(...vals);
 return chart({h:110,x:[0,len],y:[0,100],lines:[{pts:trace,col:'cyan'}],marks,yTicks:[[0,'0'],[50,'50'],[100,'100']],xTicks:[[0,'00:00'],[len/2,Mx.fmt(len/2)],[len,Mx.fmt(len)]],
  aria:`Crowd from ${vals[0]} at the bell to ${vals.at(-1)} at the finish, peaking at ${peak}.${marks.length?` ${marks.filter(m=>m.sym==='✓').length} agreed beats landed.`:''}`});
}
// v0.3.13 HOW THE MATCH WENT. The post-match read of the ten-second flow the engine records: the crowd,
// who had the upper hand, each part of the match judged on its work and its noise, the moments that
// moved the room, and the rating itemised. Matches recorded before v0.3.13 have no flow and fall back
// to the plain crowd chart.
const FLOW_MARK={big:['★','gold','Big move lands'],spot:['★','gold','Move lands'],nf:['◆','white','Near fall'],botch:['✗','blood','Mistake'],tired:['~','warn','Too tired to land it']};
const FLOW_GOOD=61,FLOW_POOR=50,FLOW_UP=8,FLOW_DOWN=-3;
function secs(s){const [m,x]=String(s).split(':').map(Number);return (m||0)*60+(x||0)}
function flowPhases(fin){
 const fl=fin.flow,ph=[];let g=null;
 fl.forEach(([t,c,m,p,q],i)=>{
  if(!g||g.p!==p){g={p,from:i?fl[i-1][0]:0,cIn:i?fl[i-1][1]:(fin.crowdStart??c),qs:0,n:0,mine:0,theirs:0};ph.push(g)}
  g.to=t;g.cOut=c;g.qs+=q;g.n++;if(m>10)g.mine++;else if(m<-10)g.theirs++;
 });
 for(const g of ph){
  // This chart bins ten-second flow by simulation clock; these are not
  // American story beats when an alternative Director is active.
  const neutral=['Opening exchanges','Early contest','Middle exchanges','Late contest','Finishing stretch'];
  g.q=Math.round(g.qs/g.n);g.d=g.cOut-g.cIn;g.name=fin.structure?(neutral[g.p]||'Match flow'):(Mx.PHASES[g.p]?.name||'');
  g.work=g.q>=FLOW_GOOD?'good':g.q<FLOW_POOR?'poor':'ok';g.tone=g.d>=FLOW_UP?'up':g.d<=FLOW_DOWN?'down':'flat';
  g.verdict=g.tone==='up'?(g.work==='poor'?'Noise over substance':g.work==='good'?'Clicked':'Got them going'):
   g.tone==='down'?(g.work==='poor'?'Fell apart':'Lost them'):(g.work==='good'?'Solid':g.work==='poor'?'Dragged':'Ticked over');
  g.score=g.d/6+(g.q-55)/6;
 }
 return ph;
}
// The biggest thirty-second swings in the crowd, kept apart so two moments never describe the same spot.
function flowMoments(fin){
 const fl=fin.flow,span=3,sw=[];
 for(let i=0;i+span<fl.length;i++)sw.push({t0:fl[i][0],t1:fl[i+span][0],d:fl[i+span][1]-fl[i][1]});
 const pick=(list,n)=>{const out=[];for(const s of list){if(out.length>=n)break;if(out.every(o=>Math.abs(o.t1-s.t1)>60&&o.eventIndex!==s.eventIndex))out.push(s)}return out};
 const log=(fin.log||[]).filter(l=>l&&typeof l.text==='string'&&l.text.length>12)
  .map((l,i)=>({...l,s:secs(l.t),index:i}));
 // Crowd announcements describe the reaction, not what produced it.
 // A report highlight must contain witnessed in-ring action from the match
 // tape. For older tapes without actionId, allow a concrete play-by-play move
 // but never substitute an unsupported generic crowd or colour line.
 const physical=/\b(?:hits?|lands?|connects?|catches?|counters?|reverses?|reversal|slams?|throws?|tosses?|drops?|drives?|plants?|strikes?|kicks?|punches?|elbows?|grabs?|traps?|locks? in|hooks?|rolls? up|dives?|flies|misses?|botches?|stumbles?|collapses?|escapes?|breaks? (?:free|the hold)|kicks? out|powers? out|takes? (?:down|over)|goes? (?:down|low)|puts? .* (?:down|through))\b/i;
 const isAction=l=>(l.kind==='play'||l.kind==='bad')&&
  (Boolean(l.actionId)||physical.test(l.text))&&l.who!=='runner';
 const explain=s=>{
  const near=log.filter(l=>l.s>=s.t0-20&&l.s<=s.t1+5);
  const actions=near.filter(isAction);
  if(!actions.length)return null;
  // Prefer a real named graph action or decisive spot over a filler play call.
  const event=actions.sort((a,b)=>
   (Number(Boolean(b.big))-Number(Boolean(a.big)))||
   (Number(Boolean(b.actionId))-Number(Boolean(a.actionId)))||
   b.s-a.s||b.index-a.index)[0];
  const reaction=near.find(l=>l.kind==='crowd'&&l.index>event.index&&
   l.s>=event.s&&l.s<=s.t1+5);
  return {...s,at:event.t,action:event.text,reaction:reaction?.text||'',eventIndex:event.index};
 };
 const rises=pick(sw.filter(s=>s.d>=5).map(explain).filter(Boolean).sort((a,b)=>b.d-a.d),3);
 const drops=pick(sw.filter(s=>s.d<=-4).map(explain).filter(Boolean).sort((a,b)=>a.d-b.d),2);
 return [...rises,...drops].sort((a,b)=>a.t1-b.t1);
}
function flowGraphic(fin,w,f,ph){
 const fl=fin.flow,len=fin.len||fl.at(-1)[0],X=t=>Math.round(Math.min(1,t/len)*10000)/100,start=fin.crowdStart??fl[0][1];
 const pts=[[0,start],...fl.map(r=>[r[0],r[1]])];
 const line=pts.map(([t,c])=>X(t)*10+','+(100-c)).join(' ');
 const area=`0,100 ${line} ${X(pts.at(-1)[0])*10},100`;
 const momPts=[[0,0],...fl.map(r=>[r[0],r[2]])];
 const mom=s=>`0,20 ${momPts.map(([t,m])=>X(t)*10+','+(20-s*Math.max(0,s*m)/100*19)).join(' ')} ${X(momPts.at(-1)[0])*10},20`;
 const bands=ph.map(g=>`<div class="mf-ph w-${g.work}" style="left:${X(g.from)}%;width:${Math.round((X(g.to)-X(g.from))*100)/100}%" title="${esc(g.name)}: ${esc(g.verdict)}. Work ${Math.round(g.q)}, crowd ${g.d>=0?'+':''}${g.d}."><b>${esc(g.name)}</b></div>`).join('');
 const seps=h=>ph.slice(1).map(g=>`<line class="mf-sep" x1="${X(g.from)*10}" x2="${X(g.from)*10}" y1="0" y2="${h}"/>`).join('');
 const marks=(fin.marks||[]).map(([t,k,yours])=>{
  if(k.startsWith('call:')){const c=Mx.CALLS[k.slice(5)];return `<i class="mf-call" style="left:${X(t)}%" title="${esc(Mx.fmt(t))} · You called: ${esc(c?.name||k.slice(5))}">▼</i>`}
  const m=FLOW_MARK[k];if(!m)return '';
  const c=(fl.find(r=>r[0]>=t)||fl.at(-1))[1];
  return `<i class="mf-mark k-${k}${yours?' you':' foe'}" style="left:${X(t)}%;top:${100-c}%" title="${esc(Mx.fmt(t))} · ${esc(m[2])} (${esc(yours?w.short:f.short)})">${m[0]}</i>`;
 }).join('');
 const peak=fl.reduce((a,r)=>r[1]>a[1]?r:a,[0,start]);
 const ticks=[0,.25,.5,.75,1].map(k=>`<span style="left:${k*100}%">${esc(Mx.fmt(Math.round(len*k/10)*10))}</span>`).join('');
 const aria=`Crowd from ${start} at the bell to ${fl.at(-1)[1]} at the finish, loudest ${peak[1]} at ${Mx.fmt(peak[0])}. `+ph.map(g=>`${g.name}: ${g.verdict.toLowerCase()}`).join('; ')+'.';
 return `<figure class="mflow" role="img" aria-label="${esc(aria)}">
  <div class="mf-row mf-phases" aria-hidden="true"><span class="mf-lab">Phase</span><div class="mf-track">${bands}</div></div>
  <div class="mf-row mf-crowd" aria-hidden="true"><span class="mf-lab">Crowd<small class="top">100</small><small class="mid">50</small><small class="bot">0</small></span><div class="mf-track"><svg viewBox="0 0 1000 100" preserveAspectRatio="none"><line class="mf-grid" x1="0" x2="1000" y1="15" y2="15"/><line class="mf-grid" x1="0" x2="1000" y1="50" y2="50"/>${seps(100)}<polygon class="mf-area" points="${area}"/><polyline class="mf-line" points="${line}"/></svg><i class="mf-peak" style="left:${X(peak[0])}%;top:${100-peak[1]}%" title="Loudest: ${peak[1]} at ${esc(Mx.fmt(peak[0]))}">${peak[1]}</i>${marks}</div></div>
  <div class="mf-row mf-mom" aria-hidden="true"><span class="mf-lab"><small class="you">${esc(w.short)}</small><small class="them">${esc(f.short)}</small></span><div class="mf-track"><svg viewBox="0 0 1000 40" preserveAspectRatio="none"><polygon class="mf-you" points="${mom(1)}"/><polygon class="mf-them" points="${mom(-1)}"/><line class="mf-mid" x1="0" x2="1000" y1="20" y2="20"/>${seps(40)}</svg></div></div>
  <div class="mf-row mf-x" aria-hidden="true"><span class="mf-lab"></span><div class="mf-track">${ticks}</div></div>
  <figcaption class="mf-key"><span><i class="k-line"></i>Crowd</span><span><i class="k-you"></i>${esc(w.short)} on top</span><span><i class="k-them"></i>${esc(f.short)} on top</span><span><b class="k-spot you">★</b>${esc(w.short)} lands one</span><span><b class="k-spot foe">★</b>${esc(f.short)} lands one</span><span><b class="k-nf">◆</b>Near fall</span><span><b class="k-botch">✗</b>Mistake</span><span><b class="k-call">▼</b>Your call</span><span><i class="k-good"></i>Good work</span><span><i class="k-poor"></i>Poor work</span></figcaption>
 </figure>`;
}
function flowReport(fin,w,f){
 if(!fin.flow||fin.flow.length<6)return '';
 const ph=flowPhases(fin),byScore=ph.slice().sort((a,b)=>b.score-a.score),best=byScore[0],worst=byScore.at(-1);
 const total=ph.reduce((t,g)=>t+g.n,0),you=ph.reduce((t,g)=>t+g.mine,0),them=ph.reduce((t,g)=>t+g.theirs,0);
 const stood=best.tone==='up'||best.work==='good';
 const head=`<p class="mf-head"><span>${stood?`Best: <b class="up">${esc(best.name)}</b> · ${esc(best.verdict.toLowerCase())}`:'No part of the match really took off'}</span>${worst!==best&&worst.score<0?`<span>Weakest: <b class="down">${esc(worst.name)}</b> · ${esc(worst.verdict.toLowerCase())}</span>`:''}<span>On top: ${esc(w.short)} ${Math.round(you/total*100)}% · ${esc(f.short)} ${Math.round(them/total*100)}%</span></p>`;
 const rows=ph.map(g=>`<tr class="t-${g.tone}"><th scope="row">${esc(g.name)}<small>${esc(Mx.fmt(g.from))}–${esc(Mx.fmt(g.to))}</small></th><td><span class="mf-bar w-${g.work}" role="img" aria-label="Work ${Math.round(g.q)} out of 100"><i style="width:${Math.max(4,Math.min(100,(g.q-30)/45*100))}%"></i></span> <small>${Math.round(g.q)}</small></td><td class="n">${g.cIn}→${g.cOut} <b class="chip ${g.tone}">${g.d>0?'+':''}${g.d}</b></td><td class="n">${g.mine===g.theirs?'Even':`${esc(g.mine>g.theirs?w.short:f.short)} ${Math.round(Math.max(g.mine,g.theirs)/g.n*100)}%`}</td><td class="v">${esc(g.verdict)}</td></tr>`).join('');
 const table=`<div class="well mf-table-wrap"><table class="grid mf-table"><thead><tr><th>Phase</th><th>Work</th><th class="n">Crowd</th><th class="n">On top</th><th>Verdict</th></tr></thead><tbody>${rows}</tbody></table></div>`;
 const mom=flowMoments(fin);
 const moments=mom.length?`<ol class="mf-moments well">${mom.map(m=>`<li class="${m.d>0?'up':'down'}"><span class="t">${esc(m.at)}</span><b class="chip ${m.d>0?'up':'down'}">${m.d>0?'+':''}${m.d}</b><span class="mf-highlight-event"><strong>${esc(m.action)}</strong>${m.reaction?'<small class="mf-highlight-reaction">'+esc(m.reaction)+'</small>':''}</span></li>`).join('')}</ol>`:'<p class="dim mf-no-moments">No crowd swing had a clear wrestling turning point in the commentary. The phase-by-phase report still shows how the match built.</p>';
 const parts=(fin.starParts||[]).filter(p=>Math.abs(p[2])>=.01),maxAbs=Math.max(.5,...parts.map(p=>Math.abs(p[2])));
 const breakdown=parts.length?`<div class="mf-parts well">${parts.map(([k,label,v])=>`<div class="mf-part ${v>=0?'pos':'neg'}"><span>${esc(label)}</span><span class="mf-pbar"><i style="${v>=0?'left':'right'}:50%;width:${Math.abs(v)/maxAbs*50}%"></i></span><b>${v>=0?'+':'−'}${Math.abs(v).toFixed(2)}</b></div>`).join('')}<div class="mf-part total"><span>Rating</span><span></span><b>${starsText(fin.stars)||'DUD'}</b></div></div>`:'';
 return `${head}${flowGraphic(fin,w,f,ph)}<div class="mf-cols"><div class="mf-phase-section"><h3 class="section-h">Phase by phase</h3>${table}</div><div class="mf-moments-section"><h3 class="section-h">Moments that moved the room</h3>${moments}</div>${breakdown?`<div class="mf-breakdown-section"><h3 class="section-h">Where the stars came from</h3>${breakdown}</div>`:''}</div>`;
}
function bar(v,kind=''){return `<span class="bar ${kind}" role="img" aria-label="${Math.round(v)} out of 100"><i style="width:${Math.max(0,Math.min(100,v))}%"></i></span>`}
function fatKind(f){return f>=60?'danger':f>=40?'warn':'cool'}
function clearToast(){clearTimeout(toastT);$('#toast')?.classList.remove('show')}
function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),3000)}
function finishTag(k){const f=D.FINISHES[k];return `<span class="tag ${f.win?'tw':'tl'}">${esc(f.name)}</span>`}
function recordedFinishTag(h){
 const planned=D.FINISHES[h.bookedFinish||h.finish]?.name||'not recorded';
 if(h.outcome==='dq')return `<span class="tag hot" title="Booked: ${esc(planned)}">Unplanned DQ</span>`;
 if(h.outcome==='nc')return '<span class="tag">No contest</span>';
 if(h.outcome==='double')return '<span class="tag hot">Finish broken</span>';
 return D.FINISHES[h.finish]?finishTag(h.finish):'<span class="dim">Not recorded</span>';
}
function boutStakes(c){
 const belt=c.title&&D.belt?.(c.title.pid,c.title.div),stip=c.stip&&window.OfficeStips?.STIPS[c.stip];
 return [belt?`<span class="tag hot">Title bout: ${esc(belt.name)}</span>`:'',
  stip?`<span class="tag">${esc(stip.name)}</span>`:'',
  c.programme?`<span class="tag">Programme chapter ${Number(c.programme.step)+1}</span>`:''].filter(Boolean).join(' ');
}
function historyDetails(h){
 const booked=D.FINISHES[h.bookedFinish||h.finish]?.name||'not recorded';
 const official=h.outcome==='dq'?'Disqualification — agreed finish not delivered':
  h.outcome==='nc'?'No contest':h.outcome==='double'?'Finish broken':'As booked';
 const structure=h.structure,counts=structure?.objectives?.filter(x=>x.status==='achieved'||x.status==='adapted').length;
 return `<p><b>Booked finish:</b> ${esc(booked)} · <b>Official result:</b> ${esc(official)}</p>${boutStakes(h)?'<p>'+boutStakes(h)+'</p>':''}${structure?'<p><b>Match structure:</b> '+esc(OfficeSheets.STRUCTURES.catalogue().find(x=>x.id===structure.id)?.label||structure.id)+' · '+counts+'/'+structure.objectives.length+' objectives witnessed</p>':''}`;
}
function starsText(s){return Mx.starText(s)}
function weekLabel(a){return `S${Math.floor((a-1)/16)+1} W${(a-1)%16+1}`}
function weekLong(a){return `Season ${Math.floor((a-1)/16)+1}, week ${(a-1)%16+1}`}
function planFor(p){return D.PLANS[p.likes]}
function plural(n,a,b){return n===1?a:(b||a+'s')}
function win(title,body,o={}){
 return `<section class="win ${o.cls||''}" ${o.area?`style="grid-area:${o.area}"`:''}><header class="tbar"><${o.h||'h2'}>${title}</${o.h||'h2'}>${o.note?`<span class="note">${o.note}</span>`:''}${o.actions||''}</header><div class="wbody ${o.body||''}" ${o.keep?`data-keep="${o.keep}"`:''}>${body}</div></section>`;
}
function status(w){
 if(w.program?.type==='camp')return `<span class="tag hot">Camp, ${w.program.left} wk</span>`;
 if(w.injury)return `<span class="bad">Injured, ${w.injury} wk</span>`;
 if(G.booked(w.id))return '<span class="good">Booked</span>';
 if(w.flags?.dive)return 'Planning a dive';
 return '<span class="dim">Free</span>';
}

/* ---------- sortable tables ---------- */
function sortRows(key,rows,cols,def){
 const s=sorts[key]||def;sorts[key]=s;const get=cols[s.k];if(!get)return rows;
 return rows.slice().sort((a,b)=>{const x=get(a),y=get(b);return (typeof x==='string'?x.localeCompare(y):x-y)*s.d});
}
function th(key,k,label,cls=''){
 const s=sorts[key],on=s&&s.k===k;
 return `<th class="${cls}" aria-sort="${on?(s.d>0?'ascending':'descending'):'none'}"><button class="sort" data-sort="${key}:${k}">${label}${on?(s.d>0?' ▲':' ▼'):''}</button></th>`;
}

/* ---------- navigation ---------- */
const NAV=[
 ['Office',[['desk','Desk'],['inbox','Inbox'],['objectives','Objectives']]],
 ['Roster',[['squad','Your stable'],['training','Training'],['scouting','Free agents'],['stables','Rival stables']]],
 ['Bookings',[['offers','Offers'],['fixtures','Fixtures']]],
 ['Territory',[['pyramid','Card ladder'],['sheets','Booking sheets'],['promoters','Promoters'],['rivalries','Rivalries'],['results','Results'],['ringfax','Ringfax']]],
 ['Game',[['game','Save and load']]]
];
const SECTION_OF={profile:'squad',record:'promoters'};
const PHONE_WIDTH=720;
const phoneLayout=()=>innerWidth<=PHONE_WIDTH;
const PHONE_LABELS={desk:'Desk',squad:'Your stable',pyramid:'Card ladder',game:'Save and load'};
const phonePane=(routeId,recordId)=>' phone-pair'+(recordId&&routeId===recordId?' phone-detail':'');
const phoneBack=(screen,label)=>`<button class="btn phone-only" data-go="${screen}">‹ ${label}</button>`;
function phoneList(table,cards){
 return cards?`<div class="phone-table">${table}</div><div class="phone-only"><div class="phone-card-list">${cards}</div></div>`:table;
}
function refreshList(screen){
 if(phoneLayout()&&route.s===screen&&route.id){route={s:screen,id:null};render(true);return}
 render();
}
function go(s,id=null){
 clearToast();
 if(route.s===s&&route.id===id){render(innerWidth<=900);return}
 past.push(route);if(past.length>40)past.shift();ahead=[];
 route={s,id};render(true);
}
function histMove(dir){
 clearToast();
 const from=dir<0?past:ahead,to=dir<0?ahead:past;
 if(!from.length)return;to.push(route);route=from.pop();render(true);
}

function renderChrome(){
 const s=S(),need=G.pending().length,cards=s.card.length,unread=s.inbox.filter(m=>!m.read).length;
 const headerIdentity=$('#headerIdentity'),identityKey=JSON.stringify(G.normaliseIdentity(s.identity));
 if(headerIdentity.dataset.identity!==identityKey){headerIdentity.innerHTML=identityCard(true);headerIdentity.dataset.identity=identityKey;}
 $('#readouts').innerHTML=`<div class="ro"><small>Season ${s.season}</small><b>Week ${s.week} of 16</b></div><div class="ro"><small>Bank</small><b class="${s.cash<0?'neg':''}">${money(s.cash)}</b></div><div class="ro"><small>Reputation</small><b>${s.rep}</b></div><div class="ro"><small>Meetings left</small><b>${s.focus} of 2</b></div>`;
 $('#continue').innerHTML=need?`Reply to inbox<small>${need} ${plural(need,'reply','replies')} required</small>`:cards?`Start match night<small>${cards} on the card</small>`:!s.roster.length&&s.week===1?`Sign a wrestler<small>Build your stable first</small>`:`Advance week<small>To week ${s.week===16?1:s.week+1}</small>`;
 const badge={inbox:need?`<span class="badge">${need}</span>`:unread?`<span class="badge soft">${unread}</span>`:'',squad:`<span class="badge soft">${s.roster.length}/5</span>`,offers:s.offers.length?`<span class="badge soft">${s.offers.length}</span>`:'',fixtures:cards?`<span class="badge soft">${cards}</span>`:'',game:s.systemErrors?.length?`<span class="badge">${s.systemErrors.length}</span>`:''};
 const cur=SECTION_OF[route.s]||route.s;
 const group=NAV.find(([,items])=>items.some(([id])=>id===cur))||NAV[0];
 $('#phoneTabs').innerHTML=NAV.map(([label,[[id]]])=>`<button class="phone-tab" data-go="${id}" ${group[0]===label?'aria-current="true"':''}>${label}${id==='desk'&&need?`<span class="phone-badge" aria-label="${need} awaiting reply">${need}</span>`:''}</button>`).join('');
 $('#phoneSections').innerHTML=group[1].length>1?group[1].map(([id,label])=>`<button class="phone-tab" data-go="${id}" ${cur===id?'aria-current="page"':''}>${PHONE_LABELS[id]||label}${id==='inbox'&&need?`<span class="phone-badge">${need}</span>`:''}</button>`).join(''):'';
 $('#nav').innerHTML=NAV.map(([g,items])=>`<h4>${g}</h4>`+items.map(([id,l])=>`<button class="item" data-go="${id}" ${cur===id?'aria-current="page"':''}><span>${l}</span>${badge[id]||''}</button>`).join('')).join('');
 $('#nav [aria-current]')?.scrollIntoView({block:'nearest',inline:'nearest'});
 $('[data-hist="back"]').disabled=!past.length;$('[data-hist="fwd"]').disabled=!ahead.length;
 const lead=G.pending()[0]||s.inbox.find(m=>!m.read)||s.inbox[0];
 $('#tick').innerHTML=lead?`<b>${G.pending().length?'Action':'News'}</b><button data-tickmsg="${lead.id}">${esc(lead.subject)}. ${esc(lead.from)}.</button><span class="keys">${s.history.length} ${plural(s.history.length,'match','matches')} worked this career</span>`:'';
}

function renderRingfax(){paint('s-ringfax',OfficeRingfax.view(S()))}
const SCREENS={ringfax:renderRingfax,desk:renderDesk,inbox:renderInbox,objectives:renderObjectives,squad:renderSquad,profile:renderProfile,record:renderRecord,training:renderTraining,scouting:renderScouting,stables:renderStables,offers:renderOffers,fixtures:renderFixtures,pyramid:renderPyramid,sheets:renderSheets,promoters:renderPromoters,rivalries:renderRivalries,results:renderResults,game:renderGame};
function render(reset=false){
 if(!S())return;
 const keep={};if(!reset)document.querySelectorAll('#view [data-keep]').forEach(el=>keep[el.dataset.keep]=el.scrollTop);
 const focused=document.activeElement;
 const focusAttr=!reset&&focused?.closest?.('#view')?['data-selo','data-self','data-sort','data-free-sort','data-trainpick','data-trainpane','data-train','data-intensity','data-session'].find(a=>focused.hasAttribute(a)):null;
 const focusValue=focusAttr?focused.getAttribute(focusAttr):null;
 const rfFocus=!reset&&route.s==='ringfax'&&focused?.closest?.('#view')?{id:focused.id||null,action:focused.dataset.rfAction||null,value:focused.dataset.rfValue||null}:null;
 if(!SCREENS[route.s])route={s:'desk',id:null};
 SCREENS[route.s]();renderChrome();
 document.querySelectorAll('#view [data-keep]').forEach(el=>{if(keep[el.dataset.keep])el.scrollTop=keep[el.dataset.keep]});
 if(focusAttr){[...document.querySelectorAll('#view ['+focusAttr+']')].find(el=>el.getAttribute(focusAttr)===focusValue&&el.getClientRects().length)?.focus({preventScroll:true})}
 if(rfFocus){
  const target=rfFocus.id?document.getElementById(rfFocus.id):
   [...document.querySelectorAll('#view [data-rf-action]')].find(el=>el.dataset.rfAction===rfFocus.action&&(el.dataset.rfValue||null)===rfFocus.value);
  target?.focus?.({preventScroll:true});
 }
 if(route.s==='ringfax')OfficeRingfax.fit?.();
 if(reset){$('#view').scrollTop=0;window.scrollTo(0,0)}
}
function paint(cls,html){$('#view').innerHTML=`<div class="screen ${cls}">${html}</div>`}

/* ======================= OFFICE ======================= */
function ledgerFacts(){
 const s=S(),income=s.card.reduce((v,c)=>v+c.purse,0),cost=G.wages()+G.overhead()+G.trainingBill(),end=s.cash+income-cost;
 return `<div class="facts two"><div><small>Bank now</small><b>${money(s.cash)}</b></div><div><small>Purses this week</small><b>${money(income)}</b></div><div><small>Wages, overheads, coaching</small><b>${money(-cost)}</b></div><div><small>Projected end of week</small><b class="${end<0?'neg':'pos'}">${money(end)}</b></div></div>`;
}
function trialBlock(){
 const s=S(),st=G.monthStatus();
 const trials=[['Three-star match','One match rated 3★ or better. Required.',st.okMatch],['£750 reserve','Keep £750 in the bank at the review',st.cash],['Reputation 30','Build reputation through your shows',st.rep],['Develop a wrestler','Improve any one skill by two points',st.developed]];
 const left=5-s.week;
 return `<p class="lede">Deliver a 3★ match <b>and</b> meet two of the other three by the end of week 4. Pass, and your backer invests £450.</p><div class="criteria">${trials.map(x=>`<div class="crit ${x[2]?'met':''}"><i>${x[2]?'✓':'○'}</i><span><b>${esc(x[0])}</b><small>${esc(x[1])}</small></span></div>`).join('')}</div><div class="countdown"><b>${left} ${plural(left,'week')}</b><span class="dim">until the backer reviews the stable.</span></div>`;
}
function trayItems(){
 const s=S(),out=[],need=G.pending(),week=G.officeBrief();
 const errors=G.systemErrors();if(errors.length)out.push({k:'urgent',ic:'!',t:errors.length+' system alert'+(errors.length===1?'':'s'),d:'A simulation extension reported an error. Export your career and review details in Save and load.',go:'game',b:'Review'});
 if(need.length)out.push({k:'urgent',ic:'!',t:`${need.length} ${plural(need.length,'message needs','messages need')} a reply`,d:'You can’t continue until you answer.',go:'inbox',b:'Read'});
 else{const u=s.inbox.filter(m=>!m.read).length;if(u)out.push({k:'',ic:'▸',t:`${u} unread ${plural(u,'message')}`,d:'Reports, results and news from the circuit.',go:'inbox',b:'Read'})}
 if(!s.roster.length)out.push({k:'urgent',ic:'!',t:'Nobody under contract',d:'Sign a headliner, or two cheaper wrestlers.',go:'scouting',b:'Free agents'});
 if(s.card.length)out.push({k:'ok',ic:'✓',t:`${s.card.length} ${plural(s.card.length,'match')} on this week’s card`,d:'Continue takes you to ringside.',go:'fixtures',b:'Fixtures'});
 if(week.today.length)out.push({k:'urgent',ic:'!',t:`${week.today.length} bookable ${plural(week.today.length,'offer')} this week`,d:`${week.unbooked.length} free ${plural(week.unbooked.length,'wrestler')} could work. Offers may compete for the same wrestler.`,go:'offers',b:'Review'});
 if(week.deadline.length)out.push({k:'urgent',ic:'!',t:`${week.deadline.length} future ${plural(week.deadline.length,'offer')} expire this week`,d:'Decide before the deadline passes.',go:'offers',b:'Review'});
 if(week.after<0)out.push({k:'urgent',ic:'!',t:'Projected overdraft',d:'After booked purses and weekly costs: '+money(week.after)+'.',go:'offers',b:'Review'});
 for(const w of s.roster){
  if(w.injury)out.push({k:'urgent',ic:'+',t:`${w.short} is injured`,d:`Out for ${w.injury} ${plural(w.injury,'week')}.`,go:'profile',id:w.id,b:'Profile'});
  else if(w.fatigue>=45)out.push({k:'urgent',ic:'!',t:`${w.short} is tired`,d:`Fatigue ${w.fatigue}. Consider rest this week.`,go:'training',b:'Training'});
  if(w.morale<35)out.push({k:'urgent',ic:'!',t:`${w.short}’s morale is low`,d:`Morale ${w.morale}. A private meeting may help.`,go:'profile',id:w.id,b:'Profile'});
  if(w.promise?.status==='open')out.push({k:'',ic:'▸',t:`Promise to ${w.short}: a featured match`,d:`Due by ${weekLabel(w.promise.deadline)}.`,go:'offers',b:'Offers'});
 }
 if(s.roster.length&&s.focus>0)out.push({k:'',ic:'▸',t:`${s.focus} management ${plural(s.focus,'meeting')} left this week`,d:'Use them to haggle with promoters or talk to your wrestlers.',go:'offers',b:'Review offers'});
 if(!out.length)out.push({k:'ok',ic:'✓',t:'All quiet',d:'Press Continue to move on to next week.'});
 return out;
}
function renderDesk(){
 const s=S(),stakes=s.season===1&&s.week<=4;
 const pending=G.pending().length,week=G.officeBrief();
 const brief=pending?
  {heading:pending+' '+plural(pending,'decision')+' awaiting reply',why:'Reply before you can advance the week.',go:'inbox',cta:'Review decisions'}:
  !s.roster.length?
  {heading:'Build '+G.normaliseIdentity(s.identity).stable,why:'Sign your first wrestler before accepting bookings.',go:'scouting',cta:'Find talent'}:
  week.today.length?
  {heading:week.today.length+' bookable '+plural(week.today.length,'offer')+' this week',why:week.unbooked.length+' available '+plural(week.unbooked.length,'wrestler')+' could earn a purse. Review before the show.',go:'offers',cta:'Review offers'}:
  week.deadline.length?
  {heading:week.deadline.length+' future '+plural(week.deadline.length,'offer')+' expire this week',why:'Review the terms before the deadline.',go:'offers',cta:'Review offers'}:
  s.card.length?
  {heading:s.card.length+' '+plural(s.card.length,'match')+' booked',why:'Check the card and prepare for match night.',go:'fixtures',cta:'Review card'}:
  {heading:'Ready to advance',why:'Use Continue to reach next week and receive new offers.',go:null,cta:null};
 const briefing=`<div class="desk-brief"><div><small>NEXT ACTION</small><b>${esc(brief.heading)}</b><span>${esc(brief.why)}</span></div>${brief.go?`<button class="btn sm" data-go="${brief.go}">${esc(brief.cta)}</button>`:''}</div>`;
 let mission='';
 if(stakes)mission=win('Sponsor trial',trialBlock(),{area:'mission',note:'Weeks 1 to 4'});
 else if(s.monthReview&&s.season===1)mission=win(s.monthReview.passed?'Backer invested £450':'Backer declined funding',`<p>Best match in the trial: ${s.monthReview.best}★. Training and promos: ${money(s.monthReview.business?.training||0)}. Contract improvements: ${money(s.monthReview.business?.negotiated||0)}. Promises kept ${s.monthReview.business?.kept||0}, broken ${s.monthReview.business?.broken||0}.</p><p class="dim">The regional circuit runs to week 16. Checkpoints are under Objectives.</p><button class="btn sm" data-go="objectives">Objectives</button>`,{area:'mission',note:'Trial review'});
 const tray=`<ul class="tray">${trayItems().map(x=>`<li class="${x.k}"><span class="ic">${x.ic}</span><span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></span>${x.go?`<button class="btn sm" data-go="${x.go}" ${x.id?`data-id="${x.id}"`:''}>${x.b}</button>`:'<span></span>'}</li>`).join('')}</ul>`;
 const dates=[...s.card.map(c=>({...c,eventAbs:G.abs()})),...s.futureBookings].sort((a,b)=>a.eventAbs-b.eventAbs).slice(0,6);
 const datesHtml=dates.length?`<table class="grid"><thead><tr><th>When</th><th>Match</th><th>Promoter</th><th class="n">Purse</th></tr></thead><tbody>${dates.map(c=>`<tr><td>${c.eventAbs===G.abs()?'<b>This week</b>':weekLabel(c.eventAbs)}</td><td>${recordLink('w',c.wid,G.W(c.wid)?.short||'Departed')} v ${recordLink('w',c.rid,G.F(c.rid)?.short||'Opponent')}</td><td class="dim">${recordLink('p',c.pid,G.P(c.pid)?.name||'Promotion')}</td><td class="n">${money(c.purse)}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">No dates signed.<br><button class="btn sm" data-go="offers">Offers</button></div>`;
 const squad=s.roster.length?`<table class="grid"><thead><tr><th>Wrestler</th><th>Fatigue</th><th class="n">Morale</th><th>Status</th></tr></thead><tbody>${s.roster.map(w=>`<tr class="pick" data-openw="${w.id}"><td><button class="row-pick" data-openw="${w.id}" aria-label="Open ${esc(w.name)} profile">${esc(w.name)}</button></td><td>${bar(w.fatigue,fatKind(w.fatigue))} ${w.fatigue}</td><td class="n">${att(w.morale)}</td><td>${status(w)}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">An empty stable can’t take bookings.<br><button class="btn sm" data-go="scouting">Free agents</button></div>`;
 paint('s-desk'+(mission?'':' nomission'),
  mission+
  win('This week',ledgerFacts()+booksChart(),{area:'ledger',h:'h3',cls:'quiet',body:'tight'})+
  win('In-tray',`<div class="phone-only"><div class="phone-progress"><div><small>Reputation</small><b>${s.rep}</b></div><div><small>Meetings left</small><b>${s.focus} of 2</b></div></div></div><div class="well">${briefing}${tray}</div>`,{area:'tray',cls:'desk-actions',body:'tight',keep:'tray'})+
  win('Next dates',`<div class="well">${datesHtml}</div>`,{area:'dates',h:'h3',body:'tight',keep:'dates'})+
  win('Stable condition · '+esc(G.normaliseIdentity(s.identity).stable),`<div class="well">${squad}</div>`,{area:'squad',h:'h3',body:'tight',keep:'cond',actions:'<button class="btn" data-go="training">Training</button>'})
 );
}

function renderInbox(){
 const s=S(),all=s.inbox,identity=G.normaliseIdentity(s.identity);
 const list=all.filter(m=>inboxFilter==='all'||(inboxFilter==='action'&&m.kind==='decision'&&!m.answer)||
  (inboxFilter==='unread'&&!m.read)||(inboxFilter==='reports'&&Array.isArray(m.sections)&&m.sections.length));
 if(phoneLayout()&&list.some(m=>m.id===route.id))openMsg=route.id;
 if(!openMsg||!list.some(m=>m.id===openMsg))openMsg=(list.find(m=>m.kind==='decision'&&!m.answer)||list[0])?.id||null;
 const m=list.find(x=>x.id===openMsg);if(m&&!m.read&&m.kind!=='decision'&&(!phoneLayout()||route.id===m.id)){m.read=true;G.save()}
 // Update filter totals after the selected message has been marked read.
 const filters=[['all','All',all.length],
  ['action','Action',all.filter(m=>m.kind==='decision'&&!m.answer).length],
  ['unread','Unread',all.filter(m=>!m.read).length],
  ['reports','Reports',all.filter(m=>Array.isArray(m.sections)&&m.sections.length).length]];
 const controls=`<div class="office-filter-tabs" role="group" aria-label="Filter messages">${filters.map(([key,label,n])=>
  `<button class="btn sm ${inboxFilter===key?'go':''}" data-inbox-filter="${key}" aria-pressed="${inboxFilter===key}">${label} <span class="filter-count">${n}</span></button>`).join('')}</div>`;

 const items=list.map(x=>`<li><button data-msg="${x.id}" class="${!x.read?'unread':''} ${x.kind==='decision'&&!x.answer?'need':''}" ${x.id===openMsg?'aria-current="true"':''}><span class="pip">${x.kind==='decision'&&!x.answer?'<span class="sr">Needs a reply. </span>':!x.read?'<span class="sr">Unread. </span>':''}</span><span class="from">${esc(x.from)}</span><span class="wk">S${x.season} W${x.week}</span><span class="subj">${esc(x.subject)}</span></button></li>`).join('');
 let letter='<div class="empty">No messages in this view.</div>';
 if(m){
  const mgr=managerFrom(m);
  const sender=String(m.from||''),promoter=s.promoters.find(p=>sender===p.voice||sender===p.name||sender.startsWith(p.voice+',')||sender.startsWith(p.name+','));
  const person=promoter?null:[...s.roster,...s.free,...(D.ALL||[]),...(D.FOES||[])].find(w=>sender===w.name||sender.startsWith(w.name+','));
  const senderRecord=promoter?recordLink('p',promoter.id,promoter.name):person?recordLink('w',person.id,person.name):'';
  letter=`<article class="letter">${mgr?`<div class="letter-face">${face('manager',mgr.id,mgr.manager,'portrait')}</div>`:''}<div class="meta">From ${esc(m.from)}. To ${esc(identity.manager)} (${esc(identity.stable)}). Season ${m.season}, week ${m.week}.${senderRecord?' · '+senderRecord:''}</div><h2>${esc(m.subject)}</h2>${m.body.map(p=>`<p>${esc(p)}</p>`).join('')}`;
  if(Array.isArray(m.sections)&&m.sections.length){
   letter+='<div class="report-sections">'+m.sections.map(section=>'<section><h3 class="section-h">'+esc(section.title)+'</h3><ul class="cons">'+(section.lines||[]).map(line=>'<li>'+esc(line)+'</li>').join('')+'</ul></section>').join('')+'</div>';
   letter+='<div class="report-links"><button class="btn" data-go="pyramid">Card ladder</button><button class="btn" data-go="squad">Your roster</button><button class="btn" data-go="offers">Offers</button></div>';
  }
  if(m.kind==='decision'){
   if(m.answer)letter+=`<div class="outcome"><b>You chose: ${esc(m.options.find(o=>o.id===m.answer)?.label)}</b><br>${esc(m.outcome)}</div>`;
   else letter+=`<div class="choices">${m.options.map(o=>`<button class="choice" data-answer="${o.id}" data-mid="${m.id}"><b>${esc(o.label)}</b><span>${esc(o.hint)}</span></button>`).join('')}</div>`;
  }
  letter+='</article>';
 }
 const need=G.pending().length;
 paint('s-inbox'+phonePane(route.id,m?.id),
  win('Inbox · '+esc(identity.stable),`${controls}<div class="well inbox-results">${items?`<ul class="msglist">${items}</ul>`:'<div class="empty">No messages match this filter.</div>'}</div>`,{body:'tight',keep:'msgs',cls:'phone-master',note:need?`${need} awaiting reply`:`${list.length} ${plural(list.length,'message')}`})+
  win(m?.kind==='decision'&&!m.answer?'Your decision':'Message',`<div class="paper" style="min-height:100%">${letter}</div>`,{body:'tight',keep:'letter',cls:'quiet phone-inspector',h:'h3',actions:phoneBack('inbox','Inbox')})
 );
}

function renderObjectives(){
 const s=S();
 const goals=`<table class="grid"><thead><tr><th style="width:2em"></th><th>Objective</th><th class="n">Reward</th></tr></thead><tbody>${G.goalList().map(g=>`<tr><td class="c">${g.done?'<span class="good">✓</span>':'<span class="dim">○</span>'}</td><td>${esc(g.text)}</td><td class="n">£200</td></tr>`).join('')}</tbody></table>`;
 let side='';
 if(s.season===1&&s.week<=4)side=win('Sponsor trial',trialBlock(),{note:'Weeks 1 to 4'});
 else if(s.season===1){
  side=win('Regional circuit checkpoints',`<p class="lede">Bonuses for genuine results between weeks 5 and 16.</p><div class="well"><table class="grid"><thead><tr><th>Week</th><th>Target</th><th>Progress</th><th class="n">Bonus</th></tr></thead><tbody>${Object.keys(G.CIRCUIT_TARGETS).map(week=>{const r=G.circuitStatus(Number(week));const done=s.circuitReviews.find(x=>x.week===r.week);return `<tr><td>${r.week}</td><td class="wrap"><b>${esc(r.title)}</b><br><span class="dim">${r.required} matches, one at ${r.quality}★${r.feature?', a featured slot':''}</span></td><td>${done?done.met?'<span class="good">✓ Earned</span>':'<span class="bad">✗ Missed</span>':`${r.played}/${r.required} played${r.qualityMet?'':', quality needed'}${r.feature&&!r.hasFeature?', feature needed':''}`}</td><td class="n">${money(r.reward)}</td></tr>`}).join('')}</tbody></table></div>`,{body:'',keep:'circ'});
 }else side=win('Your career',`<p>Season ${s.season}. ${s.history.length} matches worked, reputation ${s.rep}.</p>`,{});
 paint('s-split even',win(`Season ${s.season} objectives`,`<p class="lede">Checked at the end of week 16. Each one met is worth £200 on top of sponsorship.</p><div class="well">${goals}</div>`)+side);
}

/* ======================= ROSTER ======================= */
const WCOLS={name:w=>w.name,style:w=>w.style,heat:w=>w.heat,ring:w=>w.ring,mic:w=>w.mic,psych:w=>w.psych,safe:w=>w.safe,fat:w=>w.fatigue,mor:w=>w.morale,wage:w=>w.wage,fee:w=>w.fee,tier:w=>w.tier};
const FREE_STATS=[['heat','Draw'],['ring','Ring'],['mic','Mic'],['psych','Psych'],['safe','Safe']];
const FREE_SORTS=[['name','Wrestler'],['style','Style'],...FREE_STATS,['wage','Wage'],['fee','Fee']];
// Secondary stats that drop out of the desk table below 1280px so Fee stays visible.
const FREE_OPTIONAL=['mic','psych','safe'];
// Free-agent ratings are shown as scouting ranges. Sorting uses the range's low end, so the sort reveals no more than the table does.
const FREE_WCOLS={...WCOLS,...Object.fromEntries(['ring','mic','psych','safe'].map(k=>[k,w=>G.scoutBand(w,k).lo]))};
function freeCell(w,key){
 const b=G.scoutBand(w,key);
 if(b.exact)return att(b.lo);
 const mid=(b.lo+b.hi)/2;
 return `<span class="att a${band(mid)}">${b.lo}–${b.hi}</span>`;
}
function renderSquad(){
 const s=S();
 const ranked=sortRows('squad',s.roster,WCOLS,{k:'heat',d:-1});
 const q=stableQuery.trim().toLocaleLowerCase();
 const rows=ranked.filter(w=>(!q||(w.name+' '+(w.handle||'')+' '+(w.style||'')).toLocaleLowerCase().includes(q))&&
  (stableFilter==='all'||(stableFilter==='attention'&&(w.injury||w.fatigue>=45||w.morale<35||w.promise?.status==='open'))||
  (stableFilter==='bookable'&&G.available(w))));
 const toolbar=`<div class="management-filters" role="search" aria-label="Filter your stable">
  <label>Find <input type="search" data-stable-query="1" autocomplete="off" placeholder="Wrestler name" value="${esc(stableQuery)}"></label>
  <label>View <select data-stable-filter="1">
  ${[['all','All wrestlers'],['attention','Needs attention'],['bookable','Available to book']].map(([key,label])=>
    `<option value="${key}" ${stableFilter===key?'selected':''}>${label}</option>`).join('')}</select></label>
  <span class="filter-results" role="status">${rows.length} of ${s.roster.length} shown</span>
  <button class="btn sm" data-clear-stable="1" ${stableFilter==='all'&&!q?'disabled':''}>Clear filters</button>
 </div>`;
 const table=rows.length?`<div class="well"><table class="grid"><thead><tr>${th('squad','name','Wrestler')}${th('squad','style','Style')}${th('squad','heat','Heat','n')}${th('squad','ring','Ring','n')}${th('squad','mic','Mic','n')}${th('squad','psych','Psych','n')}${th('squad','safe','Safe','n')}${th('squad','fat','Fatigue')}${th('squad','mor','Morale','n')}<th>Status</th>${th('squad','wage','Wage','n')}</tr></thead><tbody>${rows.map(w=>`<tr class="pick" data-openw="${w.id}"><td><button class="row-pick" data-openw="${w.id}" aria-label="Open ${esc(w.name)} profile"><span class="who">${face('wrestler',w.id,w.name)}<span><b>${esc(w.name)}</b>${ownedChamps(w.id)}<small>${esc(w.tier)}. “${esc(w.handle)}”</small></span></span></button></td><td>${esc(w.style)}</td><td class="n">${att(w.heat)}</td><td class="n">${att(w.ring)}</td><td class="n">${att(w.mic)}</td><td class="n">${att(w.psych)}</td><td class="n">${att(w.safe)}</td><td>${bar(w.fatigue,fatKind(w.fatigue))} ${w.fatigue}</td><td class="n">${att(w.morale)}</td><td>${status(w)}</td><td class="n">${money(w.wage)}</td></tr>`).join('')}</tbody></table></div>`
  :s.roster.length?'<div class="empty">No wrestlers match these filters.</div>':`<div class="empty">Nobody under contract. Sign a headliner, or two cheaper wrestlers.<br><button class="btn go" data-go="scouting">Go to free agents</button></div>`;
 const cards=rows.map(w=>`<button class="phone-card" data-openw="${w.id}"><span class="who">${face('wrestler',w.id,w.name)}<span><b>${esc(w.name)}</b>${ownedChamps(w.id)}<small>${esc(w.tier)} · ${esc(w.style)}</small></span></span><span class="phone-card-line"><span>Fatigue ${w.fatigue} · Morale ${w.morale}</span><span>${status(w)}</span></span><small>${money(w.wage)} a week</small></button>`).join('');
 const open=5-s.roster.length;
 const openPlaces=s.roster.length&&open>0?`<div class="open-places"><div><b>${open} open ${plural(open,'place')}</b><span>More wrestlers means more of this week’s offers you can fill.</span></div><button class="btn go" data-go="scouting">Find free agents</button></div>`:'';
 paint('s-full',win(esc(G.normaliseIdentity(s.identity).stable),`${toolbar}${phoneList(table,cards)}${openPlaces}<p class="dim" style="margin-top:10px"><span class="phone-table">Select a wrestler to open their profile. Click a column heading to sort.</span><span class="phone-only">Tap a wrestler to open their profile.</span></p>`,{keep:'squad',note:`${s.roster.length} of 5 places filled. Wages ${money(G.wages())} a week.`,actions:'<button class="btn" data-go="training">Training</button><button class="btn" data-go="scouting">Free agents</button>'}));
}

function temperament(w){
 const t=w.ego>=75?'Proud. Resents being told what to do.':w.ego>=60?'Has opinions about how matches should go.':'Takes direction well.';
 const p=w.pro>=85?'Will never break a finish.':w.pro<60?'Unpredictable under pressure.':'Reliable.';
 return t+' '+p;
}
function trainSelects(w){
 return [`<select data-train="${w.id}" aria-label="Training for ${esc(w.name)}" ${w.injury||w.program?'disabled':''}>${Object.entries(D.TRAINING).map(([k,t])=>`<option value="${k}" ${(w.injury?'rest':w.training)===k?'selected':''}>${t.name}${t.cost?` (£${t.cost})`:''}</option>`).join('')}</select>`,`<select data-intensity="${w.id}" aria-label="Training intensity for ${esc(w.name)}" ${w.injury||w.program||w.training==='rest'||w.training==='promo'?'disabled':''}>${w.program?.type==='camp'?'<option selected>Residential camp, £185 a week</option>':Object.entries(G.INTENSITY).map(([key,v])=>`<option value="${key}" ${w.intensity===key?'selected':''}>${esc(v.name)} (${money(v.cost)})</option>`).join('')}</select>`];
}
// Sessions with Dennis: one select, grouped, with Dennis's suggestion marked.
function sessionSelect(w){
 const opts=G.sessionOptions(w),cur=w.session||'none',full=!w.session&&S().roster.filter(x=>x.session).length>=G.SESSION_CAP;
 const opt=o=>`<option value="${esc(o.value)}" ${cur===o.value?'selected':''} ${o.disabled||(full&&o.value!=='none')?'disabled':''}>${esc(o.label)}${o.suggested?' — Dennis suggests':''}</option>`;
 const group=(label,list)=>list.length?`<optgroup label="${label}">${list.map(opt).join('')}</optgroup>`:'';
 return `<select data-session="${w.id}" aria-label="Session with Dennis for ${esc(w.name)}">${opt(opts[0])}${group('Before the next match',opts.filter(o=>o.value==='rehearse'))}${group('Learn a big-spot move',opts.filter(o=>o.value.startsWith('learn:')))}${group('At the microphone',opts.filter(o=>o.value.startsWith('mic:')))}</select>`;
}
function sessionNote(w){
 const o=G.sessionOptions(w),cur=o.find(x=>x.value===(w.session||'none')),tip=o.find(x=>x.suggested);
 const bits=[];
 if(w.session)bits.push(cur?.hint||'');
 if(G.rehearsed(w))bits.push('Rehearsed for the next match.');
 if(w.learning&&!w.session?.startsWith('learn:'))bits.push(`Paused: the ${w.learning.label}, ${w.learning.done} of ${w.learning.need} weeks.`);
 if(!w.session&&tip)bits.push(`Dennis suggests: ${tip.label.charAt(0).toLowerCase()+tip.label.slice(1)}. ${tip.why}`);
 return bits.filter(Boolean).join(' ');
}
function trainControls(w){
 return `<div class="row"><label class="field">Session with Dennis${sessionSelect(w)}</label></div><div class="row"><label class="field">Focus<select data-train="${w.id}" aria-label="Training for ${esc(w.name)}" ${w.injury||w.program?'disabled':''}>${Object.entries(D.TRAINING).map(([k,t])=>`<option value="${k}" ${(w.injury?'rest':w.training)===k?'selected':''}>${t.name}${t.cost?` (£${t.cost})`:''}</option>`).join('')}</select></label><label class="field">Intensity<select data-intensity="${w.id}" aria-label="Training intensity for ${esc(w.name)}" ${w.injury||w.program||w.training==='rest'||w.training==='promo'?'disabled':''}>${w.program?.type==='camp'?'<option selected>Residential camp, £185 a week</option>':Object.entries(G.INTENSITY).map(([key,v])=>`<option value="${key}" ${w.intensity===key?'selected':''}>${esc(v.name)}, ${money(v.cost)} a week</option>`).join('')}</select></label></div>`;
}
function trainNote(w){return w.program?`${w.program.type==='camp'?'Away at camp':'Training block'}: ${w.program.left} ${plural(w.program.left,'week')} left, ${money(G.trainingCost(w))} a week.`:w.training==='rest'?'Resting. Recovers fatigue.':w.training==='promo'?'£40 to produce a promo.':`${G.INTENSITY[w.intensity||'light'].hint} ${money(G.trainingCost(w))} a week.`}
// Who this wrestler is close to, who they can't stand, and the memory behind it.
function lockerRoom(w){
 const rows=window.OfficeBonds?.list(w.id).slice(0,6)||[];
 if(!rows.length)return '<p class="dim">No strong feelings about anyone yet. Give it a few shows.</p>';
 return '<ul class="cons">'+rows.map(r=>`<li class="${r.score>0?'up':'down'}"><b>${esc(r.name)}</b> · ${esc(r.label)}${r.betrayed?' · <span class="tag hot">Betrayed</span>':''}${r.reason?`<br><span class="dim">${esc(r.reason)}</span>`:''}</li>`).join('')+'</ul>';
}
// What a wrestler wants right now, how close they are, and what they have already been given.
function ambitionLine(w){
 const a=window.OfficeAmbitions?.view(w.id);if(!a)return '';
 return `<p class="amb-line">Wants: <b>${esc(a.name.toLowerCase())}</b> · <span class="${a.sat<35?'bad':a.sat>=70?'good':''}">${esc(a.mood)}</span>${a.promise?` · <span class="tag hot">Promised by ${weekLabel(a.promise.by)}</span>`:''}</p>`;
}
function ambitionPanel(w){
 const a=window.OfficeAmbitions?.view(w.id);if(!a)return '';
 const kind=a.sat<35?'danger':a.sat<55?'warn':'';
 return `<div class="well pad"><p><b>${esc(a.name)}</b> · ${esc(a.mood)} ${bar(a.sat,kind)}</p><p class="dim">${esc(a.counts)} ${esc(a.progress)}</p>${a.words?`<p class="dim">In the long run: ${esc(a.words.charAt(0).toLowerCase()+a.words.slice(1))}.</p>`:''}${a.promise?`<p class="bad">You promised to deliver by ${weekLabel(a.promise.by)}.</p>`:''}${a.history.length?'<ul class="cons">'+a.history.map(h=>`<li class="up">${esc(h.text)}${h.promised?' <span class="dim">(as you promised)</span>':''}</li>`).join('')+'</ul>':''}</div>`;
}

/* ======================= CONTEXTUAL RECORDS =======================
   Read-only wrestler and promotion records assembled from existing career state.
   No new game rules or save fields. */
function renderRecord(){
 const s=S(),[kind,id]=String(route.id||'').split(':');
 if(kind==='p'){
  const p=G.P(id);if(!p){route={s:'promoters',id:null};return renderPromoters()}
  const standing=promoterState(p,s.rep),events=[...s.card,...s.futureBookings].filter(c=>c.pid===p.id).sort((a,b)=>a.eventAbs-b.eventAbs);
  const offers=s.offers.filter(o=>o.pid===p.id);
  const champions=D.DIVISION_ORDER.map(div=>{
   const belt=D.belt(p.id,div),held=OfficeTerritory.title(p.id,div),w=held?.holder?(G.W(held.holder)||G.F(held.holder)):null;
   return `<li><b>${esc(belt.name)}</b>: ${w?recordLink('w',w.id,w.name):'Vacant'} <span class="dim">${held?.defences||0} defences</span></li>`;
  }).join('');
  const upcoming=events.length?'<ul class="cons">'+events.map(c=>{
   const a=G.W(c.wid)||G.F(c.wid),b=G.F(c.rid);
   return `<li><b>${weekLabel(c.eventAbs)}</b> · ${recordLink('w',a?.id,a?.name||'Departed wrestler')} v ${recordLink('w',b?.id,b?.name||'Opponent')} · ${money(c.purse)}</li>`;
  }).join('')+'</ul>':'<p class="dim">No dates signed with this promoter.</p>';
  const links=`<div class="record-actions"><button class="btn sm" data-go="pyramid" data-id="${esc(p.id)}:${esc(D.DIVISION_ORDER[0])}">Card rankings</button><button class="btn sm" data-go="sheets" data-id="${esc(p.id)}">Booking sheet</button><button class="btn sm" data-go="offers">Offers</button></div>`;
  const head=`<div class="record-head">${face('booker',p.id,p.voice,'portrait x2')}<div><h2 class="record-name">${esc(p.name)}</h2><p>${esc(p.desc)} · ${esc(p.venue)}</p><p class="dim">Booker: ${esc(p.voice)} · ${esc(planFor(p).name)} style</p><p class="${standing.tone}">${esc(standing.text)}</p></div></div>`;
  const facts=`<div class="facts"><div><small>Your trust</small><b>${p.trust}</b></div><div><small>Reach</small><b>${p.reach}</b></div><div><small>Matches worked</small><b>${p.matches}</b></div><div><small>Best rating</small><b>${p.best?starsText(p.best):'–'}</b></div></div>`;
  paint('s-split even',
   win('Promotion record',head+facts+links+'<h3 class="section-h">Business</h3><p>'+bizCell(p)+'</p><h3 class="section-h">Upcoming dates</h3>'+upcoming,{keep:'record-p',actions:recordBack()})+
   win('Territory history','<h3 class="section-h">Current champions</h3><ul class="cons">'+champions+'</ul><h3 class="section-h">Offers on the table</h3><p>'+offers.length+' '+plural(offers.length,'offer')+' from this promotion.</p><h3 class="section-h">How to work here</h3><p>Promoters book the winner. Your stable earns trust by delivering the agreed match and keeping its commitments.</p>',{h:'h3',keep:'record-p-history'})
  );return;
 }
 if(kind!=='w'){route={s:'desk',id:null};return renderDesk()}
 const w=G.W(id)||s.free.find(x=>x.id===id)||G.F(id);
 if(!w){route={s:'pyramid',id:null};return renderPyramid()}
 const stable=OfficeTerritory.stableFor(id),free=s.free.some(x=>x.id===id),division=D.divisionOf(id);
 const statusText=stable?'Contracted to '+stable.name:free?'Free agent':'Independent / other circuit';
 const stat=(label,key)=>`<div class="attr"><span title="${esc(STAT_HELP[key]||'')}">${esc(label)}</span><span>${Number.isFinite(w[key])?att(w[key]):'–'}</span>${Number.isFinite(w[key])?bar(w[key],bandBar(w[key])):'<span></span>'}</div>`;
 const head=`<div class="record-head">${face('wrestler',w.id,w.name,'portrait x2')}<div><h2 class="record-name">${esc(w.name)}</h2><p>${w.handle?'“'+esc(w.handle)+'” · ':''}${esc(w.style||'Wrestler')} · ${esc(w.tier||'Circuit wrestler')}</p><p class="dim">${esc(statusText)} · ${esc(D.DIVISIONS[division]?.name||'Circuit')} division</p></div></div>`;
 const titles=OfficeTerritory.titlesOf(id),ranks=s.promoters.flatMap(p=>{
  const list=OfficeTerritory.promotionRank(p.id,division),n=list.findIndex(x=>x.id===id);
  return n<0?[]:[{p,place:n+1,row:list[n],total:list.length}];
 });
 const rankings=ranks.length?'<ul class="cons">'+ranks.map(r=>`<li>${recordLink('p',r.p.id,r.p.name)} · rank ${r.place}/${r.total} · ${esc(D.SLOTS[r.row.slot]?.name||'Card')} · ${r.row.score} points</li>`).join('')+'</ul>':'<p class="dim">Not currently ranked on these cards.</p>';
 const recent=s.history.map((h,i)=>({...h,i})).filter(h=>h.wid===id||h.rid===id).slice(0,8);
 const results=recent.length?'<div class="well"><table class="grid"><thead><tr><th>Week</th><th>Opponent</th><th>Rating</th><th></th></tr></thead><tbody>'+recent.map(h=>{
  const other=h.wid===id?{id:h.rid,name:h.foe}:{id:h.wid,name:h.name};
  return `<tr><td>S${h.season} W${h.week}</td><td>${recordLink('w',other.id,other.name||'Opponent')}</td><td>${starsText(h.stars)||'DUD'}</td><td><button class="btn link" data-replay="${h.i}">Match report</button></td></tr>`;
 }).join('')+'</tbody></table></div>':'<p class="dim">No meetings with your stable recorded yet.</p>';
 const rivalries=Object.values(s.feuds||{}).filter(f=>f.wid===id||f.rid===id);
 const feuds=rivalries.length?'<ul class="cons">'+rivalries.map(f=>{
  const other=f.wid===id?f.rid:f.wid,opponent=G.W(other)||G.F(other);
  return `<li>${recordLink('w',other,opponent?.name||'Opponent')} · heat ${Math.round(f.heat||0)} · ${f.closed?'finished':'ongoing'}</li>`;
 }).join('')+'</ul>':'<p class="dim">No rivalry with your stable recorded yet.</p>';
 const next=stable?`<button class="btn sm" data-go="stables" data-id="w:${esc(id)}">View rival stable</button>`:free?'<button class="btn sm" data-go="scouting" data-id="'+esc(id)+'">View free-agent listing</button>':'<button class="btn sm" data-go="pyramid">Card ladder</button>';
 const belts=titles.length?'<p>'+titles.map(t=>'<span class="tag hot">'+esc(t.name)+'</span>').join(' ')+'</p>':'';
 paint('s-split even',
  win('Wrestler record',head+belts+`<p>${esc(w.bio||'No biography is on file.')}</p><h3 class="section-h">Attributes</h3><div class="well pad attrs">`+stat('Ring','ring')+stat('Psychology','psych')+stat('Safety','safe')+stat('Mic','mic')+stat('Heat','heat')+'</div>'+statLegend+'<p class="dim">Finisher: '+esc(w.finisher||'Not recorded')+'</p><div class="record-actions">'+next+'</div>',{actions:recordBack(),keep:'record-w'})+
  win('Career and connections','<h3 class="section-h">Promotion rankings</h3>'+rankings+'<h3 class="section-h">Against your stable</h3>'+results+'<h3 class="section-h">Rivalries</h3>'+feuds,{h:'h3',keep:'record-w-history'})
 );
}

function renderProfile(){
 const s=S(),w=G.W(route.id);
 if(!w){route={s:'squad',id:null};return renderSquad()}
 const idx=s.roster.indexOf(w),prev=s.roster[(idx-1+s.roster.length)%s.roster.length],next=s.roster[(idx+1)%s.roster.length];
 const start=w.startSkills||{};
 const gain=k=>{const g=w[k]-(start[k]??w[k]);return g>0?` <span class="good">+${g}</span>`:''};
 const row=(label,v,extra='')=>`<div class="attr"><span>${label}</span><span>${att(v)}${extra}</span>${bar(v,bandBar(v))}</div>`;
 const atts=`<div class="well pad attrs"><h4>In the ring</h4>${row('Ring',w.ring,gain('ring'))}${row('Psychology',w.psych,gain('psych'))}${row('Safety',w.safe,gain('safe'))}<h4>On the mic</h4>${row('Mic',w.mic,gain('mic'))}${row('Heat',w.heat)}<h4>Condition</h4><div class="attr"><span>Fatigue</span><span class="att">${w.fatigue}</span>${bar(w.fatigue,fatKind(w.fatigue))}</div>${row('Morale',w.morale)}${row('Loyalty',w.loyal)}<h4>Character</h4><div class="attr"><span>Ego</span><span class="att a3">${w.ego}</span><span></span></div><div class="attr"><span>Professionalism</span><span class="att a3">${w.pro}</span><span></span></div></div><p class="dim" style="margin-top:8px">${esc(temperament(w))}${w.loyal<45?' Could be tempted away.':''}</p>`;
 const block=['rest','promo'].includes(w.training)||w.injury;
 const program=w.program?`<p><b>${w.program.type==='camp'?'Residential camp':`${w.program.total}-week block`}</b>: ${w.program.left} ${plural(w.program.left,'week')} remaining. ${w.program.gains} skill points so far.</p><p class="dim">${money(G.trainingCost(w))} a week.${w.program.type==='camp'?' Can’t be booked until camp ends.':''}</p><button class="btn red sm" data-cancelprogram="${w.id}">End programme early</button>`
  :`<p class="dim">Commit the focus above to a fixed programme.${block?' Choose a skill first.':''}</p><div class="row"><button class="btn sm" data-program="block3" data-wid="${w.id}" ${block?'disabled':''}>3-week block</button><button class="btn sm" data-program="block6" data-wid="${w.id}" ${block?'disabled':''}>6-week block</button><button class="btn sm" data-program="camp" data-wid="${w.id}" ${block?'disabled':''}>Camp, £185/wk</button></div><p class="dim" style="margin-top:8px">Camp runs 3 weeks and blocks bookings. Faster progress, but still risks fatigue and injury.</p>`;
 const promise=w.promise?.status==='open'?`<p class="bad">Promised a featured match by ${weekLabel(w.promise.deadline)}. Break it and loyalty falls.</p>`:w.promise?.status==='kept'?'<p class="good">Your last promise was kept.</p>':w.promise?.status==='broken'?'<p class="bad">Your last promise was broken.</p>':'';
 const learned=(w.learned||[]).map(id=>window.OfficeMatch?.GRAPH?.A?.[id]?.name||id),mic=Object.keys(G.MIC_STYLES).filter(k=>G.micLevel(w,k)>0);
 const built=learned.length||mic.length?`<p class="dim" style="margin-top:6px">${learned.length?`Learned: ${esc(learned.join(', '))}. `:''}${mic.length?`Mic work: ${esc(mic.map(k=>G.MIC_STYLES[k].toLowerCase()+(G.micLevel(w,k)>=2?' (sharp)':'')).join(', '))}.`:''}</p>`:'';
 const train=`<h3 class="section-h">This week</h3>${trainControls(w)}<p class="dim" style="margin-top:6px">${esc(trainNote(w))}</p><p class="dim">${esc(sessionNote(w))}</p>${built}<h3 class="section-h">Development programme</h3>${program}${w.prepHistory?.length?`<p class="dim" style="margin-top:8px">Last completed: ${esc(w.prepHistory[0].focus)} +${w.prepHistory[0].gains} (${weekLabel(w.prepHistory[0].week)}).</p>`:''}`;
 const feuds=Object.values(s.feuds).filter(f=>f.wid===w.id&&f.heat>0&&!f.closed);
 const hist=s.history.filter(x=>x.wid===w.id).slice(0,6);
 const record=`<div class="facts"><div><small>Matches</small><b>${w.matches}</b></div><div><small>Wins</small><b>${w.wins}</b></div><div><small>Average</small><b>${w.matches?starsText(Math.round(w.starSum/w.matches*4)/4)||'DUD':'–'}</b></div><div><small>Best</small><b>${w.matches?starsText(w.best)||'DUD':'–'}</b></div></div>
  ${ratingsChart(w,s.history.filter(x=>x.wid===w.id))}<h3 class="section-h">Recent matches</h3>${hist.length?`<div class="well"><table class="grid"><tbody>${hist.map(x=>`<tr><td>S${x.season} W${x.week}</td><td>v ${esc(x.foe)}</td><td class="n"><span class="stars">${starsText(x.stars)||'DUD'}</span></td></tr>`).join('')}</tbody></table></div>`:'<p class="dim">No matches yet.</p>'}
  <h3 class="section-h">What they remember</h3><p class="dim">Trust in your judgement: ${OfficeMemory.trust(w.id)}/100. Memories persist after matches and conversations.</p>${OfficeMemory.view(w.id).entries.slice(0,5).length?'<ul class="cons">'+OfficeMemory.view(w.id).entries.slice(0,5).map(e=>'<li>'+esc(e.text)+'</li>').join('')+'</ul>':'<p class="dim">No defining moments yet.</p>'}
  <h3 class="section-h">What they want</h3>${ambitionPanel(w)}
  <h3 class="section-h">Locker room</h3>${lockerRoom(w)}
  <h3 class="section-h">Rivalries</h3>${feuds.length?feuds.map(f=>`<div class="row" style="justify-content:space-between"><span>${esc(G.F(f.rid).name)}</span><span>${bar(f.heat,f.heat>=70?'gold':'')} ${f.heat}</span></div>`).join(''):'<p class="dim">None yet. Good matches against the same opponent build one.</p>'}
  <h3 class="section-h">Biography</h3><p>${esc(w.bio)}</p><p class="dim">Finisher: ${esc(w.finisher)}. Best game plan: ${esc(D.PLANS[D.STYLE_PLAN[w.style]].name.toLowerCase())}.${esc(signatureText(w))}</p>`;
 const nav=s.roster.length>1?`<button class="btn" data-go="profile" data-id="${prev.id}" aria-label="Previous wrestler">◀ ${esc(prev.short)}</button><button class="btn" data-go="profile" data-id="${next.id}" aria-label="Next wrestler">${esc(next.short)} ▶</button>`:'';
 paint('s-profile',
  win('Wrestler profile',`${face('wrestler',w.id,w.name,'portrait x3')}<div><div class="name">${esc(w.name)}</div>${ownedChamps(w.id)}<div class="handle">“${esc(w.handle)}”</div><div class="chips"><span class="chip">${esc(w.tier)}</span><span class="chip">${esc(w.style)}</span><span class="chip">${money(w.wage)} a week</span><span class="chip">${status(w)}</span></div>${ambitionLine(w)}${promise}</div><div class="acts"><button class="btn go" data-checkin="${w.id}" ${s.focus<1?'disabled':''}>Private meeting</button><span class="dim" style="font-size:13px">${s.focus} of 2 meetings left</span>${(()=>{const err=window.OfficeAmbitions?.raiseAvailable?.(w.id)?.error;return `<button class="btn" data-raise="${w.id}" ${err?'disabled':''} aria-describedby="raise-note-${w.id}">Give £40/wk raise</button><span id="raise-note-${w.id}" class="dim" style="font-size:13px">${esc(err||'Permanent £40 a week payroll increase. At most once every four weeks.')}</span>`})()}<button class="btn red" data-release="${w.id}">Release</button></div>`,{area:'head',cls:'phead',actions:recordBack()+nav})+
  win('Attributes',atts+`<h4 class="ch-h">Over time</h4>`+formChart(w),{area:'atts',h:'h3',cls:'quiet',keep:'atts'})+
  win('Training',train,{area:'train',h:'h3',keep:'train'})+
  win('Record',record,{area:'record',h:'h3',keep:'rec'})
 );
}

function trainingReportsPanel(){
 const s=S(),reviews=Array.isArray(s.trainingReviews)?s.trainingReviews:[],latest=reviews.at(-1);
 const report=(trainingReportWeek!=null?reviews.find(r=>String(r.a)===String(trainingReportWeek)):null)||latest;
 if(!report)return '<div class="empty">Training reports appear here after your first completed week.</div>';
 const selector=`<label class="field">Completed week<select data-trainweek aria-label="Choose training report">${reviews.slice().reverse().map(r=>`<option value="${r.a}" ${r===report?'selected':''}>${weekLabel(r.a)}</option>`).join('')}</select></label>`;
 const points=(report.entries||[]).reduce((sum,e)=>sum+['ring','mic','psych','safe'].reduce((a,k)=>a+Math.max(0,e.delta?.[k]||0),0),0);
 const entries=(report.entries||[]).map(e=>{
  const improvements=['ring','mic','psych','safe'].filter(k=>(e.delta?.[k]||0)>0).map(k=>`${k} +${e.delta[k]}`).join(', ')||'No whole skill point gained';
  const fatigue=e.delta?.fatigue||0;
  const notes=(e.notes||[]).join(' ');
  return `<article class="train-report-entry"><div class="train-report-entry-top"><button class="btn link" data-trainpick="${esc(e.id)}">${esc(e.name)}</button><b>${money(e.cost||0)}</b></div>
   <p><b>${esc(improvements)}</b> · Fatigue ${fatigue>0?'+':''}${fatigue}${e.worked?' · Worked a match':''}${e.injuryAfter>e.injuryBefore?' · Training injury':''}</p>
   ${notes?`<small>${esc(notes)}</small>`:''}</article>`;
 }).join('');
 return `<div class="train-report-panel"><h3 class="section-h">Completed-week review</h3>${selector}
  <div class="train-review-totals">
   <div><small>Skill points gained</small><b>${points}</b></div>
   <div><small>Training and promo spend</small><b>${money(report.trainingCost||0)}</b></div>
   <div><small>Coach wages</small><b>${money(report.coachCost||0)}</b></div>
  </div><div class="train-report-list">${entries||'<p>No wrestlers were on the roster that week.</p>'}</div>
  <p class="train-footnote">Real completed-week changes, not forecasts. Training spend excludes the separate coach wage.</p></div>`;
}
function trainingAdvicePanel(w){
 const advice=G.trainingAdvice?.(w)||[],forecast=G.trainingForecast?.(w);
 const items=advice.map(a=>{
  const action=['focus','intensity','session'].includes(a.kind);
  return `<div class="train-recommendation ${a.priority==='urgent'?'urgent':''}"><div><b>${esc(a.title)}</b><p>${esc(a.why)}</p></div>
   ${action?`<button type="button" class="btn sm" data-advice-kind="${esc(a.kind)}" data-advice-wid="${esc(w.id)}" data-advice-value="${esc(a.value)}">Apply</button>`:''}</div>`;
 }).join('');
 const projected=forecast?.kind==='skill'?`If the week ended now: +${forecast.gain} ${esc(forecast.stat)} point(s), ${forecast.progress}% of the next point banked; fatigue ${forecast.fatigue}; adjusted injury chance ${forecast.riskPct.toFixed(1)}%.`
  :forecast?.kind==='rest'?`Projected fatigue if the week ended now: ${forecast.fatigue}.`
  :forecast?.kind==='promo'?`Projected heat +${forecast.heat}; fatigue ${forecast.fatigue}.`:'';
 return `<section class="train-intelligence"><div class="train-section-heading"><h3 class="section-h">Dennis's assessment</h3><small>Suggestions, not orders</small></div>
  <div class="train-advice-list">${items}</div>${projected?`<p class="train-projection"><b>Current-week outlook:</b> ${esc(projected)} Further matches and sessions may change the outcome.</p>`:''}</section>`;
}
function renderTraining(){
 const s=S(),roster=s.roster;
 const chosen=roster.find(w=>w.id===trainingSelected)||roster[0];
 trainingSelected=chosen?.id||null;
 const bookedSessions=roster.filter(w=>w.session).length;
 const alerts=roster.filter(w=>w.injury||w.fatigue>=60).length;
 const programmes=roster.filter(w=>w.program).length;
 const figures=`<div class="train-overview" aria-label="Training at a glance">
  <div><small>Weekly training bill</small><b>${money(G.trainingBill())}</b></div>
  <div><small>Dennis's sessions</small><b>${bookedSessions} / ${G.SESSION_CAP}</b></div>
  <div><small>Condition alerts</small><b class="${alerts?'bad':''}">${alerts}</b></div>
  <div><small>Active programmes</small><b>${programmes}</b></div>
 </div>`;
 const people=roster.length?roster.map(w=>{
  const selected=w.id===chosen.id;
  const condition=w.injury?`Injured · ${w.injury} ${plural(w.injury,'week')}`:w.fatigue>=60?'Rest recommended':w.fatigue>=40?'Fatigue building':'Available';
  const line=w.program?`${w.program.type==='camp'?'Residential camp':'Training block'} · ${w.program.left} wk left`:w.training==='rest'?'Rest':w.training==='promo'?'Promo':`${D.TRAINING[w.training]?.name||'Training'} · ${G.INTENSITY[w.intensity||'light']?.name||'Light drills'}`;
  return `<tr class="pick" data-selected="${selected}"><td><button type="button" class="row-pick" data-trainpick="${esc(w.id)}" aria-pressed="${selected}" aria-label="Manage training for ${esc(w.name)}">${face('wrestler',w.id,w.name)} <b>${esc(w.name)}</b></button></td><td>${esc(line)}</td><td>${Math.round(w.fatigue)}</td><td class="${w.injury||w.fatigue>=60?'bad':''}">${esc(condition)}</td></tr>`;
 }).join(''):'';
 const overview=`${figures}<div class="train-roster well" aria-label="Stable training roster">${roster.length?`<table class="grid train-grid"><thead><tr><th>Wrestler</th><th>Assignment</th><th>Fatigue</th><th>Condition</th></tr></thead><tbody>${people}</tbody></table>`:'<div class="empty">Sign a wrestler to begin training.<br><button class="btn sm" data-go="scouting">Free agents</button></div>'}</div>
 <p class="train-footnote">Plans continue until changed. Condition alerts: injury or fatigue of 60+. Dennis’s sessions are shared.</p>${s.trainingReviews?.length?`<div class="train-review-teaser"><b>Last completed week: ${weekLabel(s.trainingReviews.at(-1).a)}</b><p>${money(s.trainingReviews.at(-1).trainingCost||0)} spent on training and promos</p><button class="btn sm" data-trainpane="reports">Read review</button></div>`:''}`;
 const tabs=`<div class="train-tabs" role="group" aria-label="Training view">
  <button type="button" class="btn sm ${trainingPane==='development'?'go':''}" data-trainpane="development" aria-pressed="${trainingPane==='development'}">Wrestler development</button>
  <button type="button" class="btn sm ${trainingPane==='coaches'?'go':''}" data-trainpane="coaches" aria-pressed="${trainingPane==='coaches'}">Coaching staff</button>
  <button type="button" class="btn sm ${trainingPane==='reports'?'go':''}" data-trainpane="reports" aria-pressed="${trainingPane==='reports'}">Weekly reports</button>
 </div>`;
 let details='';
 if(trainingPane==='reports'){
  details=`${tabs}${trainingReportsPanel()}`;
 }else if(trainingPane==='coaches'){
  const c=s.coach?G.COACHES[s.coach]:null;
  const current=c?`<div class="train-staff-current"><b>${esc(c.name)}</b>
   <p>Boosts ${esc(c.stat)} training by ${Math.round(c.boost*100)}% for eligible wrestlers. ${money(c.wage)} is charged every week, even when nobody trains that skill.</p>
   <button class="btn sm red" data-firecoach="1">End coaching contract</button></div>`:
   `<p class="train-context">No specialist employed. You can employ one coach at a time.</p>`;
  const options=Object.entries(G.COACHES).map(([id,o])=>`<div class="train-coach-option">
   <div><b>${esc(o.name)}</b><small>${esc(o.stat)} training +${Math.round(o.boost*100)}%</small><small>${money(o.fee)} hiring fee · ${money(o.wage)}/week</small></div>
   <button type="button" class="btn sm" data-hirecoach="${esc(id)}" ${s.coach||s.cash<o.fee?'disabled':''}>Hire</button>
  </div>`).join('');
  details=`${tabs}<h3 class="section-h">Specialist coaching</h3>${current}
   ${c?`<p class="train-footnote">Release your current coach before hiring a replacement. No hiring fee is refunded.</p>`:`<div class="train-coach-list well">${options}</div>`}
   <p class="train-context">Bank balance: ${money(s.cash)}. Coach wages are included in the weekly training bill.</p>`;
 }else if(!chosen){
  details=`${tabs}<div class="empty">Your wrestler development plans will appear here once you sign someone.</div>`;
 }else{
  const w=chosen,[focusSelect,intensitySelect]=trainSelects(w);
  const trainingFocus=D.TRAINING[w.training];
  const mode=G.INTENSITY[w.intensity||'light']||G.INTENSITY.light;
  const camp=w.program?.type==='camp';
  const skill=trainingFocus?.stat;
  const coached=!!(skill&&s.coach&&G.COACHES[s.coach]?.stat===skill);
  const baseRisk=camp?1.5:mode.risk*100;
  const paused=!!(w.injury||w.program);
  const canProgramme=!paused&&w.training!=='rest'&&w.training!=='promo';
  const statRow=(label,key)=>{
   const val=w[key],since=val-(w.startSkills?.[key]??val);
   return `<div class="train-attribute"><span title="${esc(STAT_HELP[key]||'')}">${esc(label)}</span><b>${att(val)}${since>0?` <small class="good">+${since}</small>`:''}</b><small>${Math.round((w.progress?.[key]||0)*100)}% to next</small></div>`;
  };
  const attributes=`<div class="train-attributes well">${statRow('Ring','ring')}${statRow('Psych','psych')}${statRow('Safety','safe')}${statRow('Mic','mic')}</div>${statLegend}`;
  let expectation='';
  if(w.injury)expectation='Injured: weekly skill training is unavailable; recovery takes priority.';
  else if(w.training==='rest')expectation='Rest reduces fatigue. Recovery is greater in weeks without a match.';
  else if(w.training==='promo')expectation='Producing a promo costs £40 a week and builds heat, not a training attribute.';
  else expectation=`Dennis says: This work starts at roughly ${camp?'1.9':mode.gain} skill points a week, but the wrestler's ability, experience, fatigue and coaching change the actual gain. The starting injury risk is ${baseRisk.toFixed(1)}% a week, and tired wrestlers or match nights can raise it.${coached?' Your specialist coach should help.':''}`;
  const programme=w.program?`<div class="train-programme-active">
   <b>${w.program.type==='camp'?'Residential camp':`${w.program.total}-week development block`}</b>
   <p>${w.program.left} ${plural(w.program.left,'week')} remaining · ${w.program.gains} ${plural(w.program.gains,'skill point')} gained · ${money(G.trainingCost(w))}/week.</p>
   ${camp?'<p>Unavailable for bookings until camp ends.</p>':''}
   <button class="btn sm red" data-cancelprogram="${esc(w.id)}">End programme early</button></div>`:
   `<div class="train-programme-options"><button class="btn sm" data-program="block3" data-wid="${esc(w.id)}" ${canProgramme?'':'disabled'}>3-week block</button>
    <button class="btn sm" data-program="block6" data-wid="${esc(w.id)}" ${canProgramme?'':'disabled'}>6-week block</button>
    <button class="btn sm" data-program="camp" data-wid="${esc(w.id)}" ${canProgramme?'':'disabled'}>3-week camp · £185/wk</button></div>
    <p class="train-footnote">Blocks lock focus and intensity. Camps prevent bookings; conflicting bookings must be cleared first.</p>`;
  const tip=G.sessionTip(w);
  const suggested=tip?G.sessionOptions(w).find(o=>o.value===tip.value):null;
  const why=suggested?`<p class="train-advice"><b>Dennis recommends:</b> ${esc(suggested.label)}. ${esc(tip.why)} ${esc(suggested.hint||'')}</p>`:'';
  const sessions=`<div class="train-session"><div class="train-section-heading"><h3 class="section-h">A session with Dennis</h3><small>${bookedSessions} of ${G.SESSION_CAP} booked</small></div>
   <label class="field">This week's session${sessionSelect(w)}</label>
   <p class="train-context">${esc(sessionNote(w)||'Choose a rehearsal, a big-spot move or mic practice. Sessions are on top of the weekly training focus.')}</p></div>`;
  details=`${tabs}<div class="train-wrestler-head">${face('wrestler',w.id,w.name,'portrait x2')}
   <div><h3>${esc(w.name)}</h3><p>${esc(w.style||'Wrestler')} · ${status(w)}</p><p>Fatigue ${Math.round(w.fatigue)} ${bar(w.fatigue,fatKind(w.fatigue))}</p></div>
   <button class="btn sm" data-openw="${esc(w.id)}">Full profile</button></div>
   ${attributes}
   <div class="train-workbench"><section><h3 class="section-h">Weekly training</h3>
   <div class="train-settings"><label class="field">Focus${focusSelect}</label><label class="field">Intensity${intensitySelect}</label></div>
   <div class="train-effect"><b>${money(G.trainingCost(w))} this week</b><p>${esc(expectation)}</p>${paused?`<p>${esc(trainNote(w))}</p>`:''}</div>
   </section><section><h3 class="section-h">Development programme</h3>${programme}
   ${w.prepHistory?.length?`<p class="train-footnote">Last completed: ${esc(D.TRAINING[w.prepHistory[0].focus]?.name||w.prepHistory[0].focus)} · +${w.prepHistory[0].gains} points (${weekLabel(w.prepHistory[0].week)}).</p>`:''}
   </section></div><div class="train-workbench"><section>${trainingAdvicePanel(w)}</section><section>${sessions}</section></div>`;
 }
 paint('s-split s-train',
  win('Stable training',overview,{keep:'train-roster'})+
  win('Development and coaching',details,{h:'h3',keep:'train-detail'})
 );
}


function scoutingComparison(free){
 const pair=shortlist.map(id=>free.find(w=>w.id===id)).filter(Boolean);
 if(!pair.length)return '';
 if(pair.length===1)return `<p class="dim scout-shortlist-status">Shortlisted: ${esc(pair[0].name)}. Choose another free agent to compare.</p>`;
 const fields=[['Ring','ring'],['Psychology','psych'],['Safety','safe'],['Mic','mic'],['Draw','heat'],['Signing fee','fee'],['Weekly wage','wage']];
 return `<section class="scout-comparison" aria-label="Compare free agents"><h3 class="section-h">Compare two wrestlers</h3>
  <div class="well"><table class="grid scout-compare-table"><thead><tr><th>Attribute</th>${pair.map(w=>`<th>${esc(w.short||w.name)}</th>`).join('')}</tr></thead><tbody>
  ${fields.map(([label,key])=>`<tr><th scope="row">${label}</th>${pair.map(w=>`<td class="n">${key==='fee'||key==='wage'?money(w[key]):freeCell(w,key)}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div><p class="dim">Comparison only: performance and costs do not predict booking success.</p></section>`;
}

function signingBudget(w,expanded=false){
 const f=G.signingForecast(w.id);if(!f)return '';
 const riskText={critical:'High risk: not enough cash for one week without income.',tight:'Tight budget: fewer than two weeks of running costs.',limited:'Limited reserve: fewer than four weeks of running costs.',buffer:'Four or more weeks of running costs covered.'};
 const note=!f.affordable?'This signing is not currently affordable or the stable is full.':riskText[f.risk];
 const tone=!f.affordable||f.risk==='critical'?'bad':f.risk==='tight'?'warn':'dim';
 return `<section class="signing-budget" aria-label="Signing budget forecast">
  <h4>Budget after signing</h4>
  <dl class="kv"><dt>Bank after fee</dt><dd class="${f.afterFee<0?'bad':''}">${money(f.afterFee)}</dd>
   ${expanded?`<dt>Total weekly wages</dt><dd>${money(f.weeklyWages)}</dd><dt>Weekly overheads</dt><dd>${money(f.weeklyOverhead)}</dd><dt>Training and coach</dt><dd>${money(f.weeklyTraining)}</dd>`:''}
   <dt>Total weekly costs</dt><dd>${money(f.weeklyCost)}</dd><dt>After one week, no income</dt><dd class="${f.afterWeek<0?'bad':''}">${money(f.afterWeek)}</dd>
   <dt>Full weeks covered</dt><dd>${f.runway}</dd></dl>
  <p class="${tone}"><b>${esc(note)}</b></p>
  <p class="dim">Estimate at current spending, with no match income. New signings start on free light drills.${f.affordable&&f.runway<2?' Consider a cheaper signing or secure a booking before advancing.':''}</p>
 </section>`;
}

function renderScouting(){
 const s=S(),full=s.roster.length>=5;
 shortlist=shortlist.filter(id=>s.free.some(w=>w.id===id));
 const sorted=sortRows('free',s.free,FREE_WCOLS,{k:'fee',d:-1});
 const styles=[...new Set(s.free.map(w=>w.style).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 if(scoutStyle!=='all'&&!styles.includes(scoutStyle))scoutStyle='all';
 const q=scoutQuery.trim().toLocaleLowerCase();
 const rows=sorted.filter(w=>(!q||(w.name+' '+(w.handle||'')+' '+(w.style||'')).toLocaleLowerCase().includes(q))&&
   (scoutStyle==='all'||w.style===scoutStyle)&&
   (scoutBudget==='all'||(scoutBudget==='affordable'&&w.fee<=s.cash)||(scoutBudget==='reserve'&&G.signingForecast(w.id)?.affordable&&G.signingForecast(w.id).runway>=2)));
 if(s.free.some(w=>w.id===route.id))selFree=route.id;
 if(!selFree||!rows.some(w=>w.id===selFree))selFree=rows[0]?.id||null;
 const w=s.free.find(x=>x.id===selFree);
 if(w)G.scoutWatch(w);
 const activeFilters=(q?1:0)+(scoutStyle!=='all'?1:0)+(scoutBudget!=='all'?1:0);
 // Phones start with the filters folded away so the candidates come first; desktop always shows them.
 const phoneLayout=window.matchMedia&&window.matchMedia('(max-width:720px)').matches;
 const filtersOpen=!phoneLayout||scoutFiltersOpen||activeFilters>0;
 const toolbar=`<details class="free-filters"${filtersOpen?' open':''}><summary>Search and filters${activeFilters?` · ${activeFilters} on`:''}</summary><div class="management-filters" role="search" aria-label="Search free agents">
  <label>Search <input type="search" data-scout-query="1" autocomplete="off" placeholder="Name or style" value="${esc(scoutQuery)}"></label>
  <label>Style <select data-scout-style="1">${[['all','All styles'],...styles.map(v=>[v,v])].map(([key,label])=>
   `<option value="${key}" ${scoutStyle===key?'selected':''}>${label}</option>`).join('')}</select></label>
  <label>Affordability <select data-scout-budget="1"><option value="all" ${scoutBudget==='all'?'selected':''}>All fees</option><option value="affordable" ${scoutBudget==='affordable'?'selected':''}>Can afford fee</option><option value="reserve" ${scoutBudget==='reserve'?'selected':''}>Fee + 2 weeks reserve</option></select></label>
  <span class="filter-results" role="status">${rows.length} of ${s.free.length} available</span>
  <button class="btn sm" data-clear-scout="1" ${!q&&scoutStyle==='all'&&scoutBudget==='all'?'disabled':''}>Clear filters</button>
 </div></details>`;
 const list=rows.length?`<div class="well free-table"><table class="grid"><thead><tr>${FREE_SORTS.map(([key,label],i)=>th('free',key,label,(i>=2?'n':'')+(FREE_OPTIONAL.includes(key)?' free-opt':''))).join('')}</tr></thead><tbody>${rows.map(x=>`<tr class="pick" data-self="${x.id}" data-selected="${x.id===selFree}"><td><button class="row-pick" data-self="${x.id}" aria-pressed="${x.id===selFree}" aria-label="Review ${esc(x.name)}"><span class="who">${face('wrestler',x.id,x.name)}<span><b>${esc(x.name)}</b><small>${esc(x.tier)}</small></span></span></button></td><td>${esc(x.style)}</td>${FREE_STATS.map(([key])=>`<td class="n${FREE_OPTIONAL.includes(key)?' free-opt':''}">${freeCell(x,key)}</td>`).join('')}<td class="n">${money(x.wage)}</td><td class="n"><b>${money(x.fee)}</b></td></tr>`).join('')}</tbody></table></div>` :`<div class="empty">${s.free.length?'No free agents match these filters.':'Nobody left on the market.'}</div>`;
 const sort=sorts.free;
 const cards=rows.length?`<div class="free-cards"><div class="free-sort"><label class="field">Sort by<select data-free-sort>${FREE_SORTS.map(([key,label])=>`<option value="${key}" ${key===sort.k?'selected':''}>${label}</option>`).join('')}</select></label><button class="btn sm" data-sort="free:${sort.k}" aria-label="Reverse sort order">${sort.d>0?'Ascending ▲':'Descending ▼'}</button></div>
  ${rows.map(x=>`<button class="free-card" data-self="${x.id}" aria-pressed="${x.id===selFree}"><span class="who">${face('wrestler',x.id,x.name)}<span><b>${esc(x.name)}</b><small>${esc(x.tier)} · ${esc(x.style)} · ${esc(D.DIVISIONS[D.divisionOf(x)].name)}</small></span></span>
   <span class="free-stats">${FREE_STATS.map(([key,label])=>`<span><small>${label}</small>${freeCell(x,key)}</span>`).join('')}</span><span class="free-costs"><span><small>Weekly wage</small>${money(x.wage)}</span><span><small>Signing fee</small>${money(x.fee)}</span></span></button>`).join('')}</div>`:'';
 let detail='<div class="empty">Select a wrestler.</div>';
 if(w){
  const can=s.cash>=w.fee&&!full;
  detail=`<div class="row" style="align-items:flex-start;gap:14px;flex-wrap:nowrap">${face('wrestler',w.id,w.name,'portrait x2')}<div><div style="font:36px/.9 var(--jersey);color:var(--blood)">${esc(w.name)}</div><div style="font-weight:600;margin:4px 0">“${esc(w.handle)}”</div><div class="chips"><span class="chip">${esc(w.tier)}</span><span class="chip">${esc(w.style)}</span><span class="chip">${esc(D.DIVISIONS[D.divisionOf(w)].name)}</span></div></div></div>
  <div class="facts" style="margin:10px 0"><div><small>Signing fee</small><b class="${s.cash<w.fee?'neg':''}">${money(w.fee)}</b></div><div><small>Weekly wage</small><b>${money(w.wage)}</b></div></div>
  ${signingBudget(w)}
  <button class="btn go" style="width:100%;min-height:44px" data-sign="${w.id}" ${can?'':'disabled'}>Sign ${esc(w.short)}</button>
  <p class="dim" style="margin-top:6px">${full?'Your locker room is full. Release someone first.':s.cash<w.fee?`You have ${money(s.cash)}. Not enough for the fee.`:'Wages are paid every week, booked or not.'}</p>
  <p style="margin-top:10px">${esc(w.bio)}</p>
  <p class="dim">Ratings are scouting estimates. They tighten the more you watch this wrestler.</p><div class="well pad attrs">${[['Ring','ring'],['Psychology','psych'],['Safety','safe'],['Mic','mic'],['Heat','heat']].map(([l,k])=>{const b=G.scoutBand(w,k),v=(b.lo+b.hi)/2;return `<div class="attr"><span>${l}</span>${freeCell(w,k)}${bar(v,bandBar(v))}</div>`}).join('')}</div>
  <p class="dim" style="margin-top:8px">${esc(temperament(w))} Finisher: ${esc(w.finisher)}.${esc(signatureText(w))}</p>
  ${ambitionLine(w)}${(()=>{const team=window.OfficeManagers?.wantedBy(w.id);return team?`<p class="bad" style="margin:6px 0 0">${esc(team.manager)} (${esc(team.name)}) means to sign ${esc(w.short)} next week.</p>`:''})()}`;
 }
 if(w){
  const picked=shortlist.includes(w.id);
  detail+=`<div class="record-actions scout-shortlist-actions">
   <button class="btn sm" data-shortlist="${w.id}" aria-pressed="${picked}">${picked?'Remove from shortlist':'Shortlist for comparison'}</button>
   ${shortlist.length?`<button class="btn sm" data-clear-shortlist="1">Clear shortlist (${shortlist.length})</button>`:''}
  </div>${scoutingComparison(s.free)}`;
 }
 paint('s-split'+phonePane(route.id,w?.id),
  win('Free agents',toolbar+list+cards,{keep:'free',cls:'phone-master',note:full?'Locker room full':`Bank ${money(s.cash)}`})+
  win('Scouting report',detail,{h:'h3',keep:'scout',cls:'phone-inspector',actions:phoneBack('scouting','Free agents')})
 );
}

// v0.3.19 Rival stables: every agency's roster, how each wrestler feels about it, and an approach for those who want out.
let selTeam=null;
// Which belt a champion holds: the belt itself, small, with the promotion's name (full title on hover).
function champChips(w){return (w.belts||[]).map(b=>{const p=D.PROMOS.find(x=>x.id===b.pid);return `<span class="champ-chip" title="${esc(b.name)}"><img src="${esc(b.img)}" alt="" loading="lazy">${esc(p?.name||'')}</span>`}).join('')}
function ownedChamps(id){return champChips({belts:window.OfficeTerritory?.titlesOf?.(id)||[]})}
// The rival manager a letter is from, if any.
function managerFrom(m){const t=S().territory?.teams?.find(x=>String(m.from||'').startsWith(x.manager+','));return t||null}
function renderStables(){
 const s=S(),A=window.OfficeApproaches;if(!A)return renderScouting();
 const all=A.stables(),[kind,id]=String(route.id||'').split(':');
 if(kind==='team'&&all.some(t=>t.id===id))selTeam=id;
 const picked=kind==='w'?A.view(id):null;if(picked)selTeam=picked.teamId;
 const team=all.find(t=>t.id===selTeam)||all[0];selTeam=team?.id||null;
 if(!team){paint('s-full',win('Rival stables','<div class="empty">No rival stables on the circuit.</div>'));return}
 const tabs=`<div class="row" role="group" aria-label="Stable" style="margin-bottom:8px">${all.map(t=>`<button class="btn sm ${t.id===team.id?'go':''}" data-go="stables" data-id="team:${t.id}" aria-pressed="${t.id===team.id}">${esc(t.name)}</button>`).join('')}</div>`;
 const tone=m=>m==='Wants out'?'bad':m==='Restless'?'':'good';
 const left=w=>w.weeksLeft==null?'–':w.weeksLeft===0?'Up now':`${w.weeksLeft} wk`;
 const sel=picked&&picked.teamId===team.id?picked:team.wrestlers.slice().sort((a,b)=>(a.mood==='Wants out'?0:a.mood==='Restless'?1:2)-(b.mood==='Wants out'?0:b.mood==='Restless'?1:2)||a.name.localeCompare(b.name))[0];
 const rows=team.wrestlers.map(w=>`<tr class="pick" data-go="stables" data-id="w:${w.id}" data-selected="${w.id===sel?.id}"><td><button class="row-pick" data-go="stables" data-id="w:${w.id}" aria-pressed="${w.id===sel?.id}" aria-label="Review ${esc(w.name)}"><span class="who">${face('wrestler',w.id,w.name)}<span><b>${esc(w.name)}</b>${champChips(w)}<small>${esc(w.tier)} · ${esc(w.style)}</small></span></span></button></td><td class="wrap">${esc(w.wants||'–')}</td><td><span class="${tone(w.mood)}">${esc(w.mood)}</span></td><td class="n">${left(w)}</td><td class="n">${money(w.fee)}</td></tr>`).join('');
 const cards=team.wrestlers.map(w=>`<button class="free-card" data-go="stables" data-id="w:${w.id}" aria-pressed="${w.id===sel?.id}"><span class="who">${face('wrestler',w.id,w.name)}<span><b>${esc(w.name)}</b><small>${esc(w.mood)} · ${esc(w.wants||'')}</small></span></span><span class="free-costs"><span><small>Contract</small>${left(w)}</span><span><small>Fee</small>${money(w.fee)}</span></span></button>`).join('');
 const grudge=team.grudge>=2?`<p class="bad" style="margin:4px 0 0">${esc(team.manager)} has not forgotten the last time you came knocking.</p>`:team.grudge===1?`<p class="dim" style="margin:4px 0 0">${esc(team.manager)} knows you have been asking around.</p>`:'';
 const list=`${tabs}<div class="row" style="flex-wrap:nowrap;gap:12px;margin:0 0 8px;align-items:flex-start">${face('manager',team.id,team.manager,'portrait')}<div><b>${esc(team.manager)}</b>, ${esc(team.name)}<p class="dim" style="margin:4px 0 0">${esc(team.blurb)}</p>${grudge}</div></div><div class="well free-table"><table class="grid"><thead><tr><th>Wrestler</th><th>Wants</th><th>Mood</th><th class="n">Contract</th><th class="n">Fee</th></tr></thead><tbody>${rows}</tbody></table></div><div class="phone-only"><div class="free-cards">${cards}</div></div>`;
 let detail='<div class="empty">Select a wrestler.</div>';
 if(sel){
  const full=s.roster.length>=5,can=!full&&s.focus>=1&&s.cash>=sel.fee&&!sel.cooldown&&sel.mood!=='Settled';
  const why=full?'Your locker room is full. Release someone first.':sel.mood==='Settled'?`${sel.short} is happy at ${sel.team}. An approach would only annoy ${sel.manager}.`:sel.cooldown?`${sel.short} has already heard from you. Try again in ${sel.cooldown} ${plural(sel.cooldown,'week')}.`:s.focus<1?'No management meetings left this week.':s.cash<sel.fee?`You have ${money(s.cash)}. Not enough for the fee.`:'';
  detail=`<div class="row" style="align-items:flex-start;gap:14px;flex-wrap:nowrap">${face('wrestler',sel.id,sel.name,'portrait x2')}<div><div style="font:32px/.9 var(--jersey);color:var(--blood)">${esc(sel.name)}</div><div style="font-weight:600;margin:4px 0">“${esc(sel.handle)}”</div><div class="chips"><span class="chip">${esc(sel.tier)}</span><span class="chip">${esc(sel.style)}</span><span class="chip">${esc(sel.team)}</span></div></div></div>
  <div class="well pad attrs" style="margin-top:10px">${[['Ring',sel.ring],['Psychology',sel.psych],['Safety',sel.safe],['Mic',sel.mic],['Heat',sel.heat]].map(([l,v])=>`<div class="attr"><span>${l}</span>${att(v)}${bar(v,bandBar(v))}</div>`).join('')}</div>
  ${(sel.belts||[]).map(b=>`<div class="title-line">${beltBadge(b)}<small>Current champion. ${esc(sel.team)} will want more for them.</small></div>`).join('')}
  <dl class="kv"><dt>Wants</dt><dd>${esc(sel.wants||'Nothing in particular')}</dd><dt>Mood</dt><dd><span class="${tone(sel.mood)}">${esc(sel.mood)}</span> · ${esc(sel.read)}</dd><dt>Contract</dt><dd>${sel.weeksLeft==null?'No end date':sel.weeksLeft===0?'Up this week':`${sel.weeksLeft} ${plural(sel.weeksLeft,'week')} left`}</dd><dt>You could offer</dt><dd>${esc(sel.pitch)}</dd><dt>Their wage</dt><dd>${money(sel.wage)} a week</dd></dl>
  <div class="row" style="justify-content:space-between;margin-top:10px"><span class="purse">${money(sel.fee)}</span><button class="btn go" style="min-height:44px;min-width:170px" data-approach="${sel.id}" ${can?'':'disabled'}>Make an approach</button></div>
  <p class="dim" style="margin-top:6px">${why?esc(why):`Uses one of ${s.focus} meetings left. If ${esc(sel.short)} says yes, the fee goes to ${esc(sel.team)}. Either way, ${esc(sel.manager)} hears about it.`}</p>`;
 }
 paint('s-split'+phonePane(route.id,'w:'+sel?.id),
  win('Rival stables',list,{keep:'stables',cls:'phone-master',note:`${s.focus} of 2 meetings left`})+
  win('Over the fence',detail,{h:'h3',keep:'rival',cls:'phone-inspector',actions:phoneBack('stables','Rival stables')})
 );
}

/* ======================= BOOKINGS ======================= */
function fitNotes(o,w){
 const p=G.P(o.pid),notes=[],best=D.STYLE_PLAN[w.style];
 if(best===p.likes)notes.push(['good',`${p.name} crowds love a ${w.style.toLowerCase()} worker.`]);
 else notes.push(['',`${p.name} crowds want “${planFor(p).name}”. ${w.short}’s best plan is “${D.PLANS[best].name}”.`]);
 const local=OfficeTerritory.promotionRank(p.id).find(row=>row.id===w.id&&row.matches>0);
 if(local)notes.push(['good',`${w.short} is ${D.SLOTS[local.slot].name.toLowerCase()} here. Their local following adds ${Math.min(25,local.matches*5)}% to the fee.`]);
 const wants=window.OfficeAmbitions?.fits(o,w);if(wants)notes.push(['good',wants]);
 const f=G.F(o.rid);if(f.safe<55)notes.push(['bad',`${f.name} is an unsafe worker.`]);
 if(w.fatigue>=45)notes.push(['bad',`${w.short} is tired (fatigue ${w.fatigue}).`]);
 if(D.FINISHES[o.finish].heat<-3&&w.heat>=60)notes.push(['bad',`A clean loss will cost ${w.short} heat.`]);
 const fd=G.feud(w.id,o.rid);if(fd&&!fd.closed&&fd.heat>0)notes.push(['good',`Rivalry heat ${fd.heat}: expect a hotter crowd.`]);
 return `<ul class="notes">${notes.map(([k,t])=>`<li class="${k}">${esc(t)}</li>`).join('')}</ul>`;
}
function offerPick(o){
 const s=S(),p=G.P(o.pid);
 const div=D.divisionOf(o.rid);
 const options=G.offerCandidates(o);
 const sel=options.find(w=>w.id===o.talk?.wid)||options.find(w=>w.id===pick[o.id])||options.slice().sort((a,b)=>(D.STYLE_PLAN[b.style]===p.likes)-(D.STYLE_PLAN[a.style]===p.likes)||a.fatigue-b.fatigue)[0];
 if(sel)pick[o.id]=sel.id;
 return {options,sel};
}
// Why nobody can take an offer: no one in that division, or no one free.
function noneFor(o){
 const div=D.divisionOf(o.rid);
 return S().roster.some(w=>D.divisionOf(w)===div)?'Nobody free':`No ${D.DIVISIONS[div].name.toLowerCase()} wrestler`;
}
function beltBadge(b,size=''){return b?`<span class="belt-badge ${size}"><img class="belt-img" src="${esc(b.img)}" alt="" loading="lazy"><span>${esc(b.name)}</span></span>`:''}
// Which of your wrestlers an offer is for: the one it names, or whoever is picked for it in the offer panel.
function offerWho(o,sel){
 if(!sel)return `<span class="dim">${o.wid?esc(G.W(o.wid)?.name||'Unavailable')+' (unavailable)':noneFor(o)}</span>`;
 return o.wid||o.talk?`<b>${esc(sel.name)}</b>`:`<span title="Suggested. Change it in the offer panel.">${esc(sel.name)}</span>`;
}
// v0.3.26 The booker has signed the results, but you choose how each chapter is told.
function arcPicker(c){
 const A=window.OfficeProgrammeArcs,v=A?.options(c);if(!v)return '';
 const choice=v.choices.some(x=>x.id===night.plan?.arcChoice)?night.plan.arcChoice:'steady';
 return `<section class="programme-chapter" aria-label="Programme chapter"><h3 class="section-h after-h">The programme: ${esc(v.title)} <small>${v.step+1} of ${v.total}</small></h3>
  <p class="dim">${esc(v.ask)}</p>${v.follow?`<p class="arc-follow">${esc(v.follow)}</p>`:''}
  <p class="dim">${esc(v.mood)}. The booked finish stays as agreed. What should tonight add to the story?</p>
  <div class="picks after-picks">${v.choices.map(x=>`<button class="decision-option${x.id===choice?' on':''}" data-arcchoice="${x.id}" aria-pressed="${x.id===choice}"><b>${esc(x.label)}</b><span>${esc(x.hint)}</span>${tagChips([x.risk])}</button>`).join('')}</div></section>`;
}
// v0.3.18 A programme offer: every date, opponent and finish, signed as one.
function programmePanel(o,sel){
 const P=o.programme,name=id=>G.F(id)?.name||id;
 return `<p style="margin-top:8px"><span class="tag hot">${esc(window.OfficeProgrammes?.TYPE_NAME[P.type]||'Programme')}</span> ${P.beats.length} matches for ${esc(G.W(P.wid)?.name||'')}. Reply by ${weekLabel(o.expiresAbs)}.</p><p class="dim">The booker sets the dates and finishes. You choose each chapter's direction backstage; the crowd's reaction follows you into the next match.</p>
  <div class="well"><table class="grid"><thead><tr><th>Show</th><th>Opponent</th><th>Slot</th><th>Finish</th>${sel?'<th class="n">Purse</th>':''}</tr></thead><tbody>${P.beats.map(b=>`<tr><td>${weekLabel(b.at)}</td><td>${esc(name(b.rid))}${b.title?' <span class="tag">Title</span>':b.blowoff?' <span class="tag">Blow-off</span>':''}${b.stip?` <span class="tag">${esc(window.OfficeStips?.STIPS[b.stip]?.short||b.stip)}</span>`:''}</td><td>${esc(D.SLOTS[b.slot].name)}${b.stip==='falls'?' · +5 min':''}</td><td>${finishTag(b.finish)}</td>${sel?`<td class="n">${money(G.purse({pid:o.pid,slot:b.slot,finish:b.finish,boost:o.boost},sel))}</td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function renderOffers(){
 const s=S(),income=s.card.reduce((t,c)=>t+c.purse,0),out=G.wages()+G.overhead()+G.trainingBill();
 const ledger=`<div class="facts"><div><small>Purses booked this week</small><b>${money(income)}</b></div><div><small>Wages, overheads, coaching</small><b>${money(-out)}</b></div><div><small>Net this week</small><b class="${income-out<0?'neg':'pos'}">${money(income-out)}</b></div><div><small>Meetings left</small><b>${s.focus} of 2</b></div></div>`;
 // Offers you can actually fill come first; ones nobody can take sink to the bottom, dimmed.
 const can=o=>offerPick(o).options.length>0;
 const offers=s.offers.slice().sort((a,b)=>can(b)-can(a)||a.eventAbs-b.eventAbs||a.expiresAbs-b.expiresAbs);
 if(offers.some(o=>o.id===route.id))selOffer=route.id;
 if(!selOffer||!offers.some(o=>o.id===selOffer))selOffer=(offers.find(can)||offers[0])?.id||null;
 const rows=offers.map(o=>{const p=G.P(o.pid),f=G.F(o.rid),{sel}=offerPick(o);return `<tr class="pick${sel?'':' unbookable'}" data-selo="${o.id}" data-selected="${o.id===selOffer}"><td><button class="row-pick" data-selo="${o.id}" aria-pressed="${o.id===selOffer}" aria-label="Review ${esc(p.name)} booking offer">${weekLabel(o.eventAbs)}<br><span class="dim">${o.eventAbs===G.abs()?'This week':o.expiresAbs>G.abs()?`Reply by ${weekLabel(o.expiresAbs)}`:''}</span></button></td><td class="wrap"><b>${esc(p.name)}</b>${o.tag?` <span class="tag hot">${esc(o.tag)}</span>`:''}${o.stip?` <span class="tag">${esc(window.OfficeStips.STIPS[o.stip].short)}</span>`:''}</td><td class="wrap offer-match">${offerWho(o,sel)}${sel?'':'<br><span class="dim">No one in your stable can take this booking.</span>'}<br><span class="vs-line">v ${recordLink('w',f.id,f.name)}</span></td><td>${o.programme?`${o.programme.beats.length} matches<br><span class="dim">${esc(window.OfficeProgrammes?.TYPE_NAME[o.programme.type]||'Programme')}</span>`:`${esc(D.SLOTS[o.slot].name)}<br>${finishTag(o.finish)}`}</td><td class="n">${sel?money(o.programme?window.OfficeProgrammes.totalPurse(o,sel):G.purse(o,sel)):'<span class="dim">–</span>'}</td></tr>`}).join('');
 const list=!s.roster.length?`<div class="empty">You need someone under contract before you can take bookings.<br><button class="btn sm" data-go="scouting">Free agents</button></div>`
  :offers.length?`<div class="well"><table class="grid"><thead><tr><th>Show</th><th>Promoter</th><th>Match</th><th>Slot and finish</th><th class="n">Purse</th></tr></thead><tbody>${rows}</tbody></table></div>`
  :`<div class="empty">No offers left this week. Press Continue to move on.</div>`;
 let detail='<div class="empty">Select an offer.</div>';
 const o=offers.find(x=>x.id===selOffer);
 if(o&&s.roster.length){
  const p=G.P(o.pid),f=G.F(o.rid),{options,sel}=offerPick(o),negotiated=o.talk?.step==='done';
  const mins=D.SLOTS[o.slot].mins+(o.tag==='Blow-off'?5:0);
  detail=`<div class="row" style="flex-wrap:nowrap;gap:12px">${face('booker',p.id,p.voice,'portrait')}<div><div style="font:30px/.9 var(--jersey);color:var(--blood)">${esc(p.name)}</div><div class="dim">${esc(p.desc)}, ${esc(p.venue)}. Booker ${esc(p.voice)}.</div><div style="font-size:14px">Trust ${bar(p.trust,p.trust<30?'danger':p.trust>=65?'':'warn')} ${p.trust}</div></div></div>
  <div class="well matchup" style="margin-top:10px"><div class="side">${sel?face('wrestler',sel.id,sel.name,'portrait x2'):''}${options.length?`<select data-pick="${o.id}" aria-label="Wrestler for this offer" ${o.wid||o.talk?'disabled':''}>${options.map(w=>`<option value="${w.id}" ${sel?.id===w.id?'selected':''}>${esc(w.name)}</option>`).join('')}</select>`:'<span class="dim">Nobody free</span>'}</div><div class="vs">v</div><div class="side">${face('wrestler',f.id,f.name,'portrait x2')}<b>${recordLink('w',f.id,f.name)}</b><span class="dim">${esc(f.style)}</span></div></div>
  ${o.title?`<div class="title-line">${beltBadge(D.belt(o.title.pid,o.title.div))}<small>${o.tag==='Title defence'?'Your champion defends the belt.':'A shot at the champion.'} The promoter has already decided the result.</small></div>`:''}
  ${o.programme?programmePanel(o,sel):`<dl class="kv"><dt>Show</dt><dd>${weekLong(o.eventAbs)}</dd><dt>Slot</dt><dd>${esc(D.SLOTS[o.slot].name)}, ${mins} minutes</dd><dt>Finish</dt><dd>${finishTag(o.finish)}</dd>${o.stip?`<dt>Stipulation</dt><dd><span class="tag hot">${esc(stipName(o.stip))}</span></dd>`:''}<dt>Reply by</dt><dd>${weekLong(o.expiresAbs)}${o.expiresAbs===G.abs()?'<span class="neg-deadline-tag">Final week · expires on Continue</span>':''}</dd></dl>`}
  ${sel?fitNotes(o,sel):''}
  ${o.programme&&options.length?`<div class="row" style="justify-content:space-between;margin-top:10px"><span class="purse">${money(window.OfficeProgrammes.totalPurse(o,sel))}</span><button class="btn go" style="min-height:44px;min-width:170px" data-book="${o.id}">Sign the programme</button></div><p class="dim" style="margin-top:6px">Signing books every date. Pull out of any of them and you walk out of the whole programme.</p>`:options.length?`<div class="row" style="justify-content:space-between;margin-top:10px"><span class="purse">${money(G.purse(o,sel))}</span><button class="btn go" style="min-height:44px;min-width:170px" data-book="${o.id}">${o.eventAbs>G.abs()?'Commit to date':'Book this week'}</button></div>
  <div class="row" style="margin-top:8px"><button class="btn" data-talkopen="${o.id}" ${(!o.talk||o.talk.step==='start')&&s.focus<1?'disabled':''}>${negotiated?'Review the discussion':o.talk&&o.talk.step!=='start'?'Resume the discussion':'Speak with '+esc(p.voice)}</button><span class="dim" style="font-size:13px">${negotiated?`${esc(o.talk.verdict)}. ${esc(o.talk.detail)}`:o.talk&&o.talk.step!=='start'?'Meeting spent · discussion can resume':`Asking for changes costs one of ${s.focus} meetings. A rejected case can lower trust.`}</span></div>`
  :`<p class="bad" style="margin-top:10px">${(()=>{const w=s.roster.find(w=>(!o.wid||w.id===o.wid)&&D.divisionOf(w)===D.divisionOf(o.rid));if(!w)return 'No wrestler in your stable is eligible for this division.';const dates=o.programme?o.programme.beats:[{at:o.eventAbs,rid:o.rid}];return esc(dates.map(b=>G.bookingConflict(w.id,b.rid,b.at)||(!G.availableAt(w,b.at)?w.short+' isn’t free on '+weekLabel(b.at)+'.':null)).find(Boolean)||'No suitable wrestler is free for every agreed date.');})()}</p>`}`;
 }
 const cards=s.roster.length?offers.map(o=>{
  const p=G.P(o.pid),f=G.F(o.rid),{sel}=offerPick(o);
  return `<article class="phone-card${sel?'':' unbookable'}"><span class="phone-card-line"><b>${esc(p.name)}</b><span>${o.eventAbs===G.abs()?'This week':weekLabel(o.eventAbs)}</span></span><span>${sel?recordLink('w',sel.id,sel.short)+' ':''}v ${recordLink('w',f.id,f.name)} · ${esc(D.SLOTS[o.slot].name)}</span><span class="phone-card-line"><small>${o.programme?`Programme, ${o.programme.beats.length} matches`:esc(D.FINISHES[o.finish].name)}</small><b>${sel?money(o.programme?window.OfficeProgrammes.totalPurse(o,sel):G.purse(o,sel)):'Unavailable'}</b></span><div class="record-actions"><button class="btn sm" data-selo="${o.id}">Review offer</button></div></article>`;
 }).join(''):'';
 paint('s-offers'+phonePane(route.id,o?.id),
  win('Bookings this week',ledger,{area:'ledger',h:'h3',cls:'quiet phone-overview',body:'tight'})+
  win('Offers',phoneList(list,cards),{area:'list',keep:'offers',cls:'phone-master',note:'Promoters decide the finish. You can haggle the terms.'})+
  win('Offer',detail,{area:'detail',h:'h3',keep:'offer',cls:'phone-inspector',actions:phoneBack('offers','Offers')})
 );
}

function renderFixtures(){
 const s=S();
 const card=s.card.length?`<div class="well"><table class="grid"><thead><tr><th>Match</th><th>Promoter</th><th>Slot</th><th>Finish</th><th class="n">Purse</th><th></th></tr></thead><tbody>${s.card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank).map(c=>{const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);return `<tr><td><span class="who">${face('wrestler',w.id,w.name)}<span><b>${recordLink('w',w.id,w.name)} v ${recordLink('w',f.id,f.name)}</b><small>${c.minutes} minutes${c.tag?`, ${esc(c.tag)}`:''}</small>${boutStakes(c)}</span></span></td><td>${recordLink('p',p.id,p.name)}</td><td>${esc(D.SLOTS[c.slot].name)}</td><td>${finishTag(c.finish)}</td><td class="n"><b>${money(c.purse)}</b></td><td class="n"><button class="btn link" data-unbook="${c.id}">${c.programme?'Withdraw from programme':'Pull out'}</button></td></tr>`}).join('')}</tbody></table></div><p class="dim" style="margin-top:8px">Ordinary cancellations cost 6 trust. Withdrawing from a programme cancels every remaining date and costs 15 trust. Continue takes you to ringside.</p>`
  :`<div class="empty">Nothing booked this week.<br><button class="btn sm" data-go="offers">Offers</button></div>`;
 const fut=s.futureBookings.slice().sort((a,b)=>a.eventAbs-b.eventAbs);
 const future=fut.length?`<div class="well"><table class="grid"><thead><tr><th>When</th><th>Match</th><th>Promoter</th><th class="n">Purse</th><th></th></tr></thead><tbody>${fut.map(c=>`<tr><td>${weekLabel(c.eventAbs)}</td><td>${recordLink('w',c.wid,G.W(c.wid)?.name||'Departed wrestler')} v ${recordLink('w',c.rid,G.F(c.rid)?.name||'Opponent')}<br><span class="dim">${esc(D.SLOTS[c.slot].name)} · ${esc(D.FINISHES[c.finish]?.name||'Finish not recorded')}</span>${boutStakes(c)}</td><td>${esc(G.P(c.pid)?.name||'')}</td><td class="n">${money(c.purse)}</td><td class="n"><button class="btn link" data-unbook="${c.id}">${c.programme?'Withdraw programme':'Cancel'}</button></td></tr>`).join('')}</tbody></table></div><p class="dim" style="margin-top:8px">Purses are paid after the match. Ordinary cancellations cost 6 trust. Withdrawing from a programme cancels every remaining date and costs 15 trust. A booked wrestler can’t attend camp that week.</p>`
  :'<div class="empty">No future dates signed.</div>';
 const cards=contracts=>contracts.map(c=>`<article class="phone-card"><div class="phone-card-line"><b>${recordLink('p',c.pid,G.P(c.pid)?.name||'Promotion')}</b><small>${c.eventAbs===G.abs()?'This week':weekLabel(c.eventAbs)}</small></div><div>${recordLink('w',c.wid,G.W(c.wid)?.name||'Departed wrestler')} v ${recordLink('w',c.rid,G.F(c.rid)?.name||'Opponent')}</div><small>${esc(D.SLOTS[c.slot].name)} · ${esc(D.FINISHES[c.finish].name)}</small>${boutStakes(c)}<div class="phone-card-line"><b>${money(c.purse)}</b><button class="btn sm" data-unbook="${c.id}">${c.programme?'Withdraw programme':'Pull booking'}</button></div></article>`).join('');
 paint('s-split even',win('This week’s card',phoneList(card,cards(s.card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank))),{keep:'card',note:`Week ${s.week}`})+win('Future dates',phoneList(future,cards(fut)),{h:'h3',keep:'future'}));
}

/* ======================= TERRITORY ======================= */
// Secondary territory sections start folded on phones so the rankings and belts come first.
function pyrFold(title,body){return `<details class="pyr-fold"${phoneLayout()?'':' open'}><summary><h3 class="section-h">${esc(title)}</h3></summary>${body}</details>`}
function renderPyramid(){
 const s=S(),t=OfficeTerritory.ensure(),[pid,dv]=String(route.id||'').split(':');
 const p=D.PROMOS.find(x=>x.id===pid)||D.PROMOS[0],div=D.DIVISIONS[dv]?dv:'men';
 const ranked=OfficeTerritory.promotionRank(p.id,div),held=OfficeTerritory.title(p.id,div),belt=D.belt(p.id,div);
 const tab=(id,label,on)=>`<button class="btn sm ${on?'go':''}" data-go="pyramid" data-id="${id}" aria-pressed="${on}">${esc(label)}</button>`;
 const tabs=`<div class="row" role="group" aria-label="Promotion" style="margin-bottom:6px">${D.PROMOS.map(x=>tab(x.id+':'+div,x.name,x.id===p.id)).join('')}</div>
  <div class="row" role="group" aria-label="Division" style="margin-bottom:10px">${D.DIVISION_ORDER.map(d=>tab(p.id+':'+d,D.DIVISIONS[d].name+' division',d===div)).join('')}</div>`;
 const champ=held?.holder?G.W(held.holder)||G.F(held.holder):null;
 const label=w=>`<span class="pent ${w.owned?'mine':''} ${w.champion?'champ':''}"><b>${recordLink('w',w.id,w.name)}${w.champion?' <span class="tag">Champion</span>':''}</b><small>${esc(w.owned?'Your stable':w.stable||'Independent')} · ${w.score} pts</small></span>`;
 const hero=`<div class="belt-hero well"><img class="belt-img" src="${esc(belt.img)}" alt="${esc(belt.name)} belt"><div><small class="dim">${esc(belt.name)}</small><b>${champ?recordLink('w',champ.id,champ.name):'Vacant'}</b>${champ?`<small>${G.W(champ.id)?'Your stable':esc(OfficeTerritory.stableFor(champ.id)?.name||'Independent')} · ${held.defences} ${plural(held.defences,'defence')}</small>`:''}</div></div>`;
 const tiers=D.SLOT_ORDER.slice().reverse().map(slot=>{
  const wrestlers=ranked.filter(w=>w.slot===slot);
  return `<div class="tier ${slot==='main'?'apex':''}" data-card-tier="${slot}"><strong>${esc(D.SLOTS[slot].name)}</strong><div class="entries">${wrestlers.length?wrestlers.map(label).join(''):'<span class="dim">Vacant</span>'}</div></div>`;
 }).join('');
 const pyr=`${tabs}${hero}<div class="well tiers">${tiers}</div><p class="dim" style="margin-top:8px">Wrestlers advance through results on this promoter’s shows. Reach the main event and the promoter will offer a title match.</p>`;
 const belts=`<div class="belt-list">${D.PROMOS.map(x=>D.DIVISION_ORDER.map(d=>{const b=D.belt(x.id,d),h=OfficeTerritory.title(x.id,d)?.holder,w=h?G.W(h)||G.F(h):null;
  return `<button class="belt-row ${w&&G.W(w.id)?'mine':''}" data-go="pyramid" data-id="${x.id}:${d}"><img class="belt-img" src="${esc(b.img)}" alt=""><span><small>${esc(b.name)}</small><b>${w?esc(w.name):'Vacant'}</b></span></button>`}).join('')).join('')}</div>`;
 const teams=`<div class="well"><table class="grid"><thead><tr><th>Stable and manager</th><th class="n">W</th><th class="n">L</th><th class="n">Rep</th></tr></thead><tbody>${t.teams.map(team=>`<tr><td class="wrap"><span class="who">${face('manager',team.id,team.manager)}<span><b>${esc(team.name)} · ${esc(team.manager)}</b>${window.OfficeManagers?`<br><small>${esc(window.OfficeManagers.blurb(team))}</small>`:''}<br><span class="dim">${team.roster.map(id=>esc(G.F(id)?.name||id)).join(', ')}</span></span></span></td><td class="n">${team.wins}</td><td class="n">${team.losses}</td><td class="n">${team.rep}</td></tr>`).join('')}</tbody></table></div>`;
 const news=t.reports.slice(0,4).flatMap(r=>r.lines).map(l=>`<li>${esc(l)}</li>`).join('');
 paint('s-split',
  win(esc(p.name)+' '+esc(D.DIVISIONS[div].name.toLowerCase())+' pyramid',pyr,{keep:'pyr',note:`Season ${s.season}, week ${s.week}`})+
  win('Champions',`${belts}${pyrFold('Rival stables',teams)}${pyrFold('Circuit news',news?`<ul class="fulllog well" style="color:var(--white)">${news}</ul>`:'<p class="dim">Other promotions report their results after you advance the week.</p>')}`,{h:'h3',keep:'rivals'})
 );
}
function promoterState(p,rep){
 if(p.blacklist>0)return {tone:'bad',text:'Won’t book you for '+p.blacklist+' wk'};
 if(rep<p.minRep)return {tone:'dim',text:'Needs reputation '+p.minRep};
 if(p.trust<15)return {tone:'bad',text:'Not returning calls'};
 return {tone:'good',text:'Booking'};
}
// v0.3.17 How each promotion is doing as a business: crowds against its usual level, buzz, the books.
function bizCell(p){
 const v=window.OfficeBusiness?.view(p.id);if(!v)return '';
 const arrow={up:'▲',down:'▼',flat:'▬'}[v.trend],tone=v.tone==='Struggling'?'bad':v.tone==='Hot'?'good':'';
 const f=v.finance,delta=f?`<small class="dim" title="${esc('Last show: gate '+money(f.gate)+', sponsors '+money(f.sponsors)+', production '+money(f.production)+', talent '+money(f.talent)+', big matches '+money(f.marquee)+', savings '+money(f.savings))}"> · Last show ${f.net>=0?'+':''}${money(f.net)}</small>`:'';
 return `<span class="${tone}"><b>${esc(v.tone)}</b> ${arrow}</span><br><span class="dim">Crowd ${v.crowd} (usual ${v.base}) · Buzz ${v.buzz} · ${money(v.money)}</span>${delta}`;
}
function renderPromoters(){
 const s=S();
 const table=`<div class="well"><table class="grid"><thead><tr><th>Promoter</th><th>Wants</th><th class="n">Reach</th><th>Business</th><th>Trust</th><th class="n">Matches</th><th class="n">Best</th><th>Status</th></tr></thead><tbody>${s.promoters.map(p=>{
  const state=promoterState(p,s.rep);
  return `<tr><td><span class="who">${face('booker',p.id,p.voice)}<span><b>${recordLink('p',p.id,p.name)}</b><small>${esc(p.desc)}. Booker ${esc(p.voice)}.</small></span></span></td><td>${esc(planFor(p).name)}</td><td class="n">${att(p.reach)}</td><td class="wrap">${bizCell(p)}</td><td>${bar(p.trust,p.trust<30?'danger':p.trust>=65?'':'warn')} ${p.trust}</td><td class="n">${p.matches}</td><td class="n"><span class="stars">${p.best?starsText(p.best):'–'}</span></td><td><span class="${state.tone}">${esc(state.text)}</span></td></tr>`;
 }).join('')}</tbody></table></div>`;
 const cards=s.promoters.map(p=>`<article class="phone-card"><div class="who">${face('booker',p.id,p.voice)}<div><b>${recordLink('p',p.id,p.name)}</b><small>${esc(p.voice)} · ${esc(p.desc)}</small></div></div><div class="phone-card-line"><span>${esc(planFor(p).name)}</span><b>Trust ${p.trust}</b></div><small>Reach ${p.reach} · ${p.matches} matches · Best ${p.best?starsText(p.best):'–'}</small><small>${bizCell(p)}</small><small>${esc(promoterState(p,s.rep).text)}</small></article>`).join('');
 paint('s-full',win('Promoters',phoneList(table,cards)+'<p class="dim" style="margin-top:8px">Trust rises when you deliver what a promoter asked for and falls when you pull out or break a finish. A promotion drawing well reaches more people and pays better; one that is struggling pays less and books desperately.</p>',{keep:'proms'}));
}
// v0.3.15 Each booker's plans: the storylines on the board and how the last ones ended.
function yourProgrammes(p){
 const v=window.OfficeProgrammes?.view(p.id);if(!v||!(v.live.length||v.done.length))return '';
 const line=x=>{const next=x.beats.find(b=>!b.done&&!b.missed),a=window.OfficeProgrammeArcs?.record(x.id)?.arc,last=a?.timeline?.at(-1);
  const chapters=a?.timeline?.length?`<details class="arc-history"><summary>Read ${a.timeline.length} chapter${a.timeline.length===1?'':'s'}</summary><ol>${a.timeline.slice().sort((u,v)=>u.step-v.step).map(e=>`<li><b>${esc(e.chapter||'Chapter '+(e.step+1))}</b> · ${esc(e.recap)}${e.claim==='broken'?'<small class="bad">Claim not delivered</small>':e.claim==='kept'?'<small class="good">Claim backed up</small>':''}</li>`).join('')}</ol></details>`:'';
  return `<li class="${x.status==='kept'?'up':x.status==='live'?'':'down'}"><b>${esc(x.wName)}</b> <span class="tag">${esc(x.status||"live")}</span> · ${esc(x.typeName)} v ${esc(x.rName)} · ${x.status==='live'?(next?`next ${weekLabel(next.at)}, ${x.beats.filter(b=>b.done).length} of ${x.beats.length} played`:'finishing'):esc(x.text||x.status)}${a?`<small class="arc-recap">Momentum ${Math.round(a.momentum)} · ${esc(a.conclusion||window.OfficeProgrammeArcs.band(a.momentum))}${last?' · '+esc(last.recap):''}</small>`:''}${chapters}</li>`;};
 return `<h3 class="section-h">Your programmes here</h3><ul class="cons">${[...v.live,...v.done.slice(0,3)].map(line).join('')}</ul>`;
}
function renderSheets(){
 const s=S(),B=window.OfficeBooking;if(!B)return renderPyramid();
 const p=D.PROMOS.find(x=>x.id===route.id)||D.PROMOS[0],v=B.view(p.id);
 const tab=x=>`<button class="btn sm ${x.id===p.id?'go':''}" data-go="sheets" data-id="${x.id}" aria-pressed="${x.id===p.id}">${esc(x.name)}</button>`;
 const tabs=`<div class="row" role="group" aria-label="Promotion" style="margin-bottom:10px">${D.PROMOS.map(tab).join('')}</div>`;
 const head=`<div class="row" style="flex-wrap:nowrap;gap:12px;margin-bottom:10px">${face('booker',p.id,p.voice,'portrait')}<div><b>${esc(p.voice)}</b>, booker at ${esc(p.name)}<p class="dim" style="margin:4px 0 0">${esc(v.blurb)}</p>${window.OfficeBusiness?`<p style="margin:4px 0 0">${bizCell(p)}</p>`:''}</div></div>`;
 const card=x=>{
  const step=x.next?(x.next.kind==='payoff'||x.next.kind==='blowoff'?`${x.type==='title'?'Title match':'The last match'}: ${weekLabel(x.next.at)}`:`Match ${x.played+1} of ${x.total}: ${weekLabel(x.next.at)}`):'';
  const rec=x.record.length?`<ul class="cons">${x.record.map(r=>`<li>${esc(r.winner)} beat ${esc(r.loser)}</li>`).join('')}</ul>`:'<p class="dim">Nothing played yet.</p>';
  return `<article class="well pad story-card"><p><span class="tag${x.type==='title'?' hot':''}">${esc(x.typeName)}</span> <span class="dim">${esc(D.DIVISIONS[x.div].name)} division</span></p>
   <p><b>${esc(x.aName)}</b> ${x.type==='title'?'chasing':x.type==='rise'?'climbing towards':'v'} <b>${esc(x.bName)}</b></p>
   <p>Heat ${bar(x.heat,x.heat>=70?'gold':'')} ${x.heat}</p><p class="dim">${esc(step)}</p>${rec}</article>`;
 };
 const live=v.live.length?`<div class="story-grid">${v.live.map(card).join('')}</div>`:`<div class="empty">No multi-match storyline is active. The booker still puts together a weekly card.</div>`;
 const early=v.firstLook?`<p class="dim">Opening plans for ${weekLabel(v.upcomingWeek)}. These are provisional: no circuit matches have been played yet.</p>`:'';
 const upcoming=v.upcoming.length?`<ul class="cons">${v.upcoming.map(m=>`<li><b>${esc(D.DIVISIONS[m.div]?.name||m.div)}</b> · ${recordLink('w',m.a,m.aName)} v ${recordLink('w',m.b,m.bName)}${m.title?' · <span class="tag hot">Title</span>':m.storyline?' · '+esc(m.storyline):''}</li>`).join('')}</ul>`:'<p class="dim">No circuit matches pencilled in for this promoter next week.</p>';
 const done=v.done.length?`<ul class="cons">${v.done.map(x=>`<li class="${x.status==='dropped'?'':'up'}"><b>${esc(x.typeName)}</b> · ${esc(x.text||'')} <span class="dim">${x.ended?weekLabel(x.ended):''}</span></li>`).join('')}</ul>`:'<p class="dim">No storyline has finished here yet.</p>';
 const M=window.OfficeManagers,pushing=M?.lobbyAt(p.id)||[];
 const lobby=pushing.length?`<ul class="cons">${pushing.map(l=>`<li><b>${esc(l.manager)}</b> (${esc(l.team)}) is pushing <b>${esc(l.name)}</b>${l.want?` · wants ${esc(l.want.toLowerCase())}`:''}</li>`).join('')}</ul>`:'<p class="dim">No manager is working this booker this week.</p>';
 paint('s-full',win('Booking sheets',`${tabs}${head}<h3 class="section-h">Next circuit card · ${weekLabel(v.upcomingWeek)} (provisional)</h3>${upcoming}<h3 class="section-h">On the board</h3>${early}${live}${yourProgrammes(p)}<h3 class="section-h">Managers in the booker’s ear</h3>${lobby}<h3 class="section-h">How the last ones ended</h3>${done}<p class="dim" style="margin-top:8px">The card is a forecast, not a signed result. Bookers plan matches around their storylines and may change their minds before the bell.</p>`,{keep:'sheets',note:esc(p.name)}));
}

function rivalrySnapshot(f){
 const p=window.OfficeRivalry?.profile?.(f.wid,f.rid);
 if(!p||!p.meetings)return {record:'No recorded matches',last:'No previous match',relations:'',issues:[]};
 const r=p.record||{},draw=Math.max(0,(r.meetings||0)-(r.w||0)-(r.f||0));
 const record=`${r.w||0} W · ${r.f||0} L${draw?' · '+draw+' no decision':''}`;
 const m=p.last;
 let last='No previous match';
 if(m){
  const result=m.outcome==='nc'?'No contest':m.outcome==='dq'?(m.winner==='w'?'Opponent disqualified':'Your wrestler disqualified'):
   m.outcome==='double'?'Finish broken':m.winner==='w'?'Your wrestler won':m.winner==='f'?'Opponent won':'No decision';
  last=result+(Number.isFinite(m.abs)&&m.abs>0?' · '+weekLabel(m.abs):'');
  if(m.ringside?.job==='runin'&&m.ringside.fired)last+=' · '+(m.ringside.dq?'Caught run-in caused DQ':m.ringside.ok?'Unseen run-in':'Interference caught');
 }
 const relations=p.stance?'Your wrestler: '+p.stance.w+'; opponent: '+p.stance.f:'';
 const issues=(p.open||[]).filter(x=>x.text).slice(0,2).map(x=>x.text);
 return {record,last,relations,issues};
}
function rivalryContext(v){
 const lines=[v.relations,...v.issues].filter(Boolean);
 return lines.length?`<details class="feud-detail"><summary>Backstage context</summary><ul class="cons">${lines.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`:'';
}
function renderRivalries(){
 const s=S(),feuds=Object.values(s.feuds).filter(f=>f.heat>0||f.closed).sort((a,b)=>b.heat-a.heat);
 const info=feuds.map(f=>{
  const w=G.W(f.wid)||D.TALENT.find(x=>x.id===f.wid);
  const ready=f.heat>=70&&f.matches>=2&&!f.closed;
  return {...f,evidence:rivalrySnapshot(f),matchup:(w?.name||'Former wrestler')+' v '+(G.F(f.rid)?.name||f.rid),ready,
   state:f.closed?'Finished':ready?'Ready for the blow-off':'Building',angle:f.angle||'The score will be settled in the ring.'};
 });
 const rows=info.map(f=>`<tr><td><b>${recordLink('w',f.wid,G.W(f.wid)?.name||G.F(f.wid)?.name||'Former wrestler')} v ${recordLink('w',f.rid,G.F(f.rid)?.name||'Opponent')}</b></td><td>${bar(f.heat,f.heat>=70?'gold':'')} ${f.heat}</td><td class="wrap"><b>${esc(f.evidence.record)}</b><small class="feud-last">${esc(f.evidence.last)}</small></td><td class="n">${f.segments||0}</td><td><span class="${f.ready?'good':''}">${esc(f.state)}</span></td><td class="wrap">${esc(f.angle)}${rivalryContext(f.evidence)}</td></tr>`).join('');
 const cards=info.map(f=>`<article class="phone-card"><b>${recordLink('w',f.wid,G.W(f.wid)?.name||G.F(f.wid)?.name||'Former wrestler')} v ${recordLink('w',f.rid,G.F(f.rid)?.name||'Opponent')}</b><span class="phone-card-line"><span>Heat ${f.heat}</span><small>${esc(f.state)}</small></span><small>${esc(f.evidence.record)} · ${f.segments||0} promos</small><small class="feud-last">${esc(f.evidence.last)}</small><span>${esc(f.angle)}</span>${rivalryContext(f.evidence)}</article>`).join('');
 const intro='Every wrestler gets microphone time before their match. Your promo approach affects the crowd, their personal rivalry and potential rematch interest. Heat cools between appearances; build it towards the blow-off.';
 const table=info.length?`<div class="well"><table class="grid"><thead><tr><th>Rivalry</th><th>Heat</th><th>Head to head</th><th class="n">Promos</th><th>Status</th><th>Latest angle</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty">No rivalries yet. Book a match to begin a storyline, then choose a microphone approach before the bell.</div>';
 paint('s-full',win('Rivalries',`<p class="lede">${esc(intro)}</p>${phoneList(table,cards)}`,{keep:'feuds'}));
}
function renderResults(){
 const s=S();
 const cards=s.history.map((x,i)=>`<article class="phone-card"><span class="phone-card-line"><small>S${x.season} W${x.week} · ${esc(x.promoter)}</small><b>${starsText(x.stars)||'DUD'}</b></span><span>${recordLink('w',x.wid,x.name)} v ${recordLink('w',x.rid,x.foe)}</span><small>${x.outcome==='dq'?'Unplanned disqualification · ':x.outcome==='nc'?'No contest · ':x.outcome==='double'?'Finish broken · ':''}Crowd ${x.crowd} · Purse ${money(x.purse)}</small><div class="record-actions"><button class="btn sm" data-replay="${i}">Read match report</button></div></article>`).join('');
 const table=s.history.length?`<div class="well"><table class="grid"><thead><tr><th>When</th><th>Match</th><th>Promoter</th><th>Finish</th><th class="n">Rating</th><th class="n">Crowd</th><th class="n">Paid</th></tr></thead><tbody>${s.history.map((x,i)=>`<tr class="pick" data-replay="${i}"><td><button class="btn link" data-replay="${i}" aria-label="Read ${esc(x.name)} versus ${esc(x.foe)}, season ${x.season} week ${x.week}">S${x.season} W${x.week}</button></td><td><b>${recordLink('w',x.wid,x.name)} v ${recordLink('w',x.rid,x.foe)}</b>${boutStakes(x)}</td><td>${esc(x.promoter)}</td><td>${recordedFinishTag(x)}</td><td class="n"><span class="stars">${starsText(x.stars)||'DUD'}</span></td><td class="n">${x.crowd}</td><td class="n">${money(x.purse)}</td></tr>`).join('')}</tbody></table></div><p class="dim" style="margin-top:8px">Select a match to read the commentary.</p>`:'<div class="empty">No matches yet.</div>';
 paint('s-full',win('Results',`<h3 class="section-h">Season ${s.season} so far</h3>${seasonChart()}${phoneList(table,cards)}`,{keep:'res',note:`${s.history.length} ${plural(s.history.length,'match','matches')}`}));
}
function renderGame(){
 const saved=G.saveStatus(),status=saved.ok===false?'Save FAILED — recent changes are not stored. Export your career immediately.':saved.ok===true?'Last saved successfully in this session at '+new Date(saved.lastSaved).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})+'.':'No save confirmation this session.';
 const diagnostics=G.systemErrors().slice().reverse();
 const diagnostic=diagnostics.length?`<section class="system-alert" role="status"><h3 class="section-h">System alerts (${diagnostics.length})</h3>
  <p>A simulation extension reported a problem. Export your career before continuing and include these details in a bug report.</p>
  <ul class="cons">${diagnostics.map(e=>`<li><b>${esc(e.source)}</b> · S${e.season} W${e.week}${e.count>1?' (repeated '+e.count+' times)':''}<small class="feud-last">${esc(e.message)}</small></li>`).join('')}</ul></section>`:'';
 paint('s-split even',
  win('Save and load',`<p class="lede">Your career saves automatically in this browser after every action. Export a save file to move it to another device or browser.</p><p class="${saved.ok===false?'bad':'dim'}" role="status">${esc(status)}</p><div class="row"><button class="btn" data-act="export">Export save</button><button class="btn" data-act="import">Import save</button></div>${diagnostic}<h3 class="section-h" style="margin-top:20px">Start over</h3><p class="dim">Overwrites the current career.</p><button class="btn red" data-act="newgame">Start a new career</button>`)+
  win('Manager profile',identityCard()+`<h3 class="section-h" style="margin-top:14px">How a week works</h3><ol style="margin:0;padding-left:1.3em;display:grid;gap:8px"><li>Read the inbox. Some messages need a decision before you can continue.</li><li>Set training for each wrestler. Rest anyone who is tired.</li><li>Book wrestlers onto offers. Promoters set the finish; negotiate the fee, billing or a protected loss using a management meeting.</li><li>Press Continue. Choose the match plan and your wrestler’s promo approach, hear both wrestlers speak, then work the match with up to three calls from ringside.</li><li>Wages and costs are paid, and the next week’s offers arrive.</li></ol><p class="dim" style="margin-top:12px">At ringside, Space pauses and keys 1 to 6 make calls.</p>`,{h:'h3'})
 );
}

/* ======================= CONVERSATIONS ======================= */
function renderPrivateMeeting(id){
 const w=G.W(id);if(!w)return;const d=$('#modal');d.classList.remove('negotiation-dialog');delete d.dataset.talkoid;const s=S();
 d.innerHTML=`<header class="tbar"><h2 id="office-dialog-title">Private meeting: ${esc(w.name)}</h2></header><div class="dlg"><p>${esc(w.bio)}</p><div class="terms-compare"><div><small>Morale</small><b>${w.morale}</b></div><div><small>Loyalty</small><b>${w.loyal}</b></div></div><p class="dim">Uses one of your ${s.focus} management meetings left this week, which means one less chance to haggle with a promoter.</p><div class="talk-actions">${s.focus===0?'<p class="dim">No private meetings left this week, so these options are off.</p>':''}${w.promise?.status==='open'?'<p class="dim">A featured-match promise is already open. Book it before making another.</p>':''}<button class="choice" data-private="listen" data-wid="${id}" ${s.focus===0?'disabled':''}><b>Listen and reassure</b><span>No promise. Morale +5, loyalty +4.</span></button><button class="choice" data-private="promise" data-wid="${id}" ${s.focus===0||w.promise?.status==='open'?'disabled':''}><b>Promise a featured match</b><span>Morale +8 now. Book a feature or main event within two weeks, or lose 14 morale and 12 loyalty.</span></button><button class="choice" data-private="bonus" data-wid="${id}" ${s.cash<120||s.focus===0?'disabled':''}><b>Pay a £120 loyalty bonus</b><span>Morale +6, loyalty +9. Guaranteed, but not cheap.</span></button></div></div><div class="foot"><button class="btn" data-dlg="close">Leave it for now</button></div>`;
 if(!d.open)d.showModal();
}
/* v0.3.22 stipulations */
function stipName(k){return window.OfficeStips?.STIPS[k]?.name||''}
function stipAsks(o,w,oid,wid){
 const X=window.OfficeStips;if(!X||o.stip||o.programme)return '';
 const p=G.P(o.pid);
 return `<p class="stip-ask">Or ask for a stipulation. ${esc(p.voice)} has opinions.</p><div class="stip-grid">${Object.entries(X.STIPS).map(([k,x])=>{const t=X.tasteOf(p,k),fit=x.fit[w.style]||0;
  return `<button class="choice" data-talkaction="ask:stip:${k}" data-oid="${oid}" data-wid="${wid}"><b>${esc(x.name)}</b><span>${esc(x.hint)}${t>=8?' '+esc(p.voice)+' likes these.':t<=-8?' '+esc(p.voice)+' does not.':''}${fit>=4?' Suits '+esc(w.short)+'.':fit<0?' Not '+esc(w.short)+'’s kind of match.':''}</span></button>`}).join('')}</div>`;
}
function renderMeeting(oid,wid){
 const res=G.meeting(oid,wid);if(res.error){toast(res.error);return}
 const o=res.offer,t=res.talk,w=G.W(wid),p=G.P(o.pid),f=G.F(o.rid),d=$('#modal');
 d.dataset.talkoid=oid;d.classList.add('negotiation-dialog');
 const promoterRead=window.OfficeNegotiationsV2?.read?.(o,w)||null;
 const promoterPriorities=promoterRead?`<section class="neg-profile" aria-label="Promoter priorities"><b>${esc(p.voice)} · ${esc(promoterRead.name)}</b><p>${esc(promoterRead.priority)}</p><small>${esc(promoterRead.evidence)}</small></section>`:'';
 const promoterAdvice=promoterRead?`<p class="neg-advice"><b>Reading the room:</b> ${esc(promoterRead.signal)}</p>`:'';
 const orig=t.original,proposed=t.proposal||null,shown=proposed||o;
 const cur={slot:shown.slot,finish:shown.finish,fee:G.purse({...o,...shown},w),stip:shown.stip||null},done=t.step==='done';
 const originalStip=Object.prototype.hasOwnProperty.call(orig,'stip')?orig.stip:(t.topic==='stip'?null:cur.stip);
 const pending=!!proposed&&!done;
 const changed=orig.slot!==cur.slot||orig.finish!==cur.finish||orig.fee!==cur.fee||originalStip!==cur.stip;
 const slotN=k=>esc(D.SLOTS[k].name),finN=k=>esc(D.FINISHES[k].name);
 const term=(label,a,b)=>`<tr${a===b?'':' class="changed"'}><th scope="row">${label}</th><td>${a}</td><td>${a===b?b:`<b>${b}</b>`}</td></tr>`;
 const chip=pending?['warn','Proposed · unsigned']:!done?['','Original offer']:t.verdict==='agreed'?['good','Accepted terms']:t.verdict==='counter'?['warn','Accepted compromise']:t.verdict==='refused'?['bad','Refused']:['','Original'];
 const deal=`<section class="deal neg-contract${changed?' is-new':''}"><header><small>${pending?'Proposed terms · not yet accepted':'Terms you would sign'}</small><span class="deal-chip ${chip[0]}">${chip[1]}</span></header><table class="grid neg-terms-grid"><thead><tr><th>Term</th><th>Original</th><th>Current</th></tr></thead><tbody>${term('Card position',slotN(orig.slot),slotN(cur.slot))}${term('Booked finish',finN(orig.finish),finN(cur.finish))}${originalStip||cur.stip?term('Stipulation',esc(stipName(originalStip)||'None'),esc(stipName(cur.stip)||'None')):''}${term('Appearance fee',money(orig.fee),money(cur.fee))}</tbody></table><p class="neg-contract-note">${pending?'Proposed terms are not accepted yet.':changed?'Accepted changes are highlighted.':'Original invitation.'} Nothing is booked until you sign.</p></section>`;
 const transcript=t.log.map(x=>`<div class="neg-message ${x.who==='You'?'is-you':'is-booker'}">${x.who==='You'?'<span class="neg-avatar-you" aria-hidden="true">YOU</span>':face('booker',p.id,p.voice,'portrait')}<div class="neg-speech"><b>${esc(x.who==='You'?'You':p.voice)}</b><p>${esc(x.text)}</p></div></div>`).join('');
 const ids=`data-oid="${oid}" data-wid="${wid}"`;
 const ask=(id,label,hint)=>`<button class="choice neg-choice" data-talkaction="${id}" ${ids}><b>${label}</b><span>${hint}</span></button>`;
 const trades=window.OfficeNegotiationsV2?.tradeOptions?.(o,w,t)||[];
 const tradePanel=trades.length?`<details class="neg-trade-menu"><summary>Offer a concrete trade (${trades.length})</summary><p>Make one final exchange. Giving something up can make a stronger request acceptable; a rejected trade costs one promoter trust.</p><div class="neg-trade-options">${trades.map(x=>ask('trade:'+x.id,esc(x.label),esc(x.hint))).join('')}</div></details>`:'';
 let prompt='',options='';
 if(t.step==='start'){
  prompt='What would you like to change?';
  options=ask('ask:fee','I need a better appearance fee','Request up to 20% more. Accepting a pay increase costs '+(promoterRead?.feeRaiseCost||2)+' promoter trust as well as a management meeting.');
  if(o.finish==='lose_clean')options+=ask('ask:protect',"I'll take the loss, but protect my wrestler",'Ask for a competitive loss, usually for a lower fee.');
  if(o.slot!=='main')options+=ask('ask:slot','Give my wrestler better billing','Move one place higher on the card in exchange for a lower guaranteed appearance fee.');
  const stip=stipAsks(o,w,oid,wid);
  if(stip)options+=`<details class="neg-more"><summary>Ask about a match stipulation</summary>${stip}</details>`;
 }else if(t.step==='reason'){
  prompt=t.topic==='fee'?'Why should the fee go up?':t.topic==='protect'?'Why should the loss be protected?':t.topic==='slot'?'Why does your wrestler deserve better billing?':'Why does this stipulation work?';
  options=[['crowd','The crowd will pay for this','Use drawing power and audience interest.'],['reliability','You know we can deliver','Emphasise professionalism and executing the agreed finish.'],['trade',"Let's find a commercial compromise",'Make a pragmatic business argument instead of asking for a favour.']]
   .filter(([k])=>!t.retry||k!==t.lastArg).map(([k,label,hint])=>ask('arg:'+k,label,hint)).join('');
  if(t.retry)options+='<p class="neg-tip">Final attempt. Your previous argument cannot be repeated.</p>';
 }else if(t.step==='challenge'){
  prompt='The promoter is unconvinced';
  options='<p class="neg-tip">Your first argument failed. You spent a meeting and lost '+(t.cost||promoterRead?.failureCost||2)+' promoter trust.</p>'
   +ask('reply:reframe','Let me make one final argument','Try a different reason. A second rejection ends the negotiation.')
   +(tradePanel||ask('reply:concede',"I'll offer something in return",'Try for a smaller improvement at a lower fee.'))
   +ask('reply:original',"I'll take your original offer",'Keep the original invitation and stop bargaining.');
 }else if(t.step==='counter'||t.step==='offer'){
  prompt=t.step==='counter'?'The promoter has countered':t.package?'The promoter accepts your trade':'The promoter is willing';
  options=ask('reply:accept','I accept these proposed terms','Agree in principle. You must still sign the contract.');
  if(t.step==='counter'&&!t.pushes){
   options+=ask('push:hold','I want the full change','Hardball: promoter trust −'+(promoterRead?.hardballCost||2)+'; with low trust, the promoter may withdraw the booking.');
  }
  if(t.step==='counter')options+=tradePanel;
  options+=ask('reply:original',"I'll take the original offer",'Keep the initial invitation without the revision.');
  options+=ask('reply:walk','We are not doing this booking','Withdraw the invitation completely. This cannot be undone.');
 }else{
  prompt='The promoter has answered';
  const outcome=t.verdict==='agreed'?'Revised terms accepted.':t.verdict==='counter'?'Compromise accepted.':t.verdict==='refused'?'The promoter refused.':'The original terms stand.';
  options=`<section class="neg-verdict ${t.verdict==='refused'?'is-refused':''}"><b>${outcome}</b><p>${esc(t.detail||'')}</p><small>${changed?'Sign the revised offer, sign the original, or leave both unsigned.':'The original offer can still be signed.'}</small></section>`;
 }
 const tradeSummary=t.package?`<section class="neg-trade-summary" aria-label="Negotiated exchange"><b>What you are trading</b><dl><div><dt>You give</dt><dd>${esc(t.package.give)}</dd></div><div><dt>In return</dt><dd>${esc(t.package.get)}</dd></div></dl><small>${pending?'Proposal only — you must accept it before signing.':'Accepted package — sign to book the match.'}</small></section>`:'';
 const response=`<div class="neg-response"><h3>${prompt}</h3>${promoterAdvice}${t.step==='start'?'<p class="neg-tip">Reading or signing the original offer is free. Asking for better terms uses one meeting; failed arguments can reduce promoter trust.</p>':''}<div class="neg-choices"><div class="neg-choice-heading" aria-hidden="true"><span>Response</span><span>Effect / consideration</span></div>${options}</div></div>`;
 const btn=(cls,attrs,label,sub)=>`<button class="btn two ${cls}" ${attrs}><span>${label}</span><small>${sub}</small></button>`;
 const reply=`Reply by ${weekLabel(o.expiresAbs)}`;
 const lastChance=o.expiresAbs===G.abs()?'<p class="neg-deadline-note">Final chance: sign before advancing the week or this invitation and all proposed terms expire.</p>':'';
 const later=btn('later','data-dlg="close"','Decide later',`Nothing signed. ${reply}`);
 const original=done&&changed?btn('',`data-talkbook="${oid}" data-revert="1" ${ids}`,`Sign original · ${money(orig.fee)}`,`${slotN(orig.slot)} · ${finN(orig.finish)}`):'';
 const sign=btn('go',`data-talkbook="${oid}" ${ids}`,done&&changed?'Sign accepted terms':done?'Sign original terms':pending?'Sign original instead':'Sign as offered',`${pending?money(orig.fee):money(cur.fee)} · ${pending?slotN(orig.slot):slotN(cur.slot)} · ${pending?finN(orig.finish):finN(cur.finish)}`);
 d.innerHTML=`<header class="tbar"><h2 id="office-dialog-title">Speaking with ${esc(p.voice)}</h2><span class="note">${esc(p.name)}</span></header>
 <div class="neg-intro"><span><b>${esc(w.name)}</b> versus <b>${esc(f.name)}</b></span><span>Meetings left: ${S().focus} / 2 · ${reply}</span></div>
 ${lastChance}
 <div class="neg-layout">
  <section class="neg-main" aria-label="Conversation with ${esc(p.voice)}">
   <div class="neg-section-header"><b>Conversation</b><span>${esc(p.desc)} · Trust ${p.trust}</span></div>
   <div class="neg-transcript well" role="log" aria-label="Negotiation history" aria-live="off">${transcript}</div>
   ${response}
  </section>
  <aside class="neg-aside" aria-label="Booking terms">
   <details class="neg-terms"${phoneLayout()?'':' open'}><summary>${pending?'Proposed terms (not agreed)':changed?'Accepted contract terms':'Original contract terms'}</summary>${deal}</details>
   ${promoterPriorities}<div class="neg-trust"><b>Promoter trust ${p.trust} / 100</b>${bar(p.trust,p.trust<30?'danger':p.trust>=65?'':'warn')}</div>
   ${tradeSummary}
   <p class="neg-meeting-note">${t.step==='start'?'No meeting used yet':`Meeting used · ${S().focus} left this week`}. ${t.cost?`Promoter trust lost here: −${t.cost}. `:''}The promoter decides the winner; this cannot be reversed by negotiation.</p>
  </aside>
 </div>
 <div class="foot neg-footer">${later}${original}${sign}</div>`;
 if(!d.open)d.showModal();const lg=d.querySelector('.neg-transcript');if(lg)lg.scrollTop=lg.scrollHeight;
 (done?d.querySelector('.neg-footer .btn.go'):d.querySelector('[data-talkaction]'))?.focus({preventScroll:true});
}
function dialog(title,html,buttons=[['Close','close']]){
 const d=$('#modal');d.classList.remove('negotiation-dialog');delete d.dataset.talkoid;
 d.innerHTML=`<header class="tbar"><h2 id="office-dialog-title">${esc(title)}</h2></header><div class="dlg">${html}</div><div class="foot">${buttons.map(([l,a,c])=>`<button class="btn ${c||''}" data-dlg="${a}">${l}</button>`).join('')}</div>`;
 d.showModal();return d;
}
// Create and edit the player's identity without mutating a live save before
// confirmation. Bundled illustrated pixel portraits never affect
// career random seeds, bookings, wrestling outcomes or rival managers.
function identitySetup(mode='new'){
 identityMode=mode;
 const p=mode==='edit'?G.normaliseIdentity(S()?.identity):G.suggestIdentity();
 identityPortrait=p.portrait;
 const picker=Pt.PLAYER_PORTRAITS.map((o,i)=>
  '<button type="button" class="player-portrait-choice'+(i===identityPortrait?' selected':'')+
  '" data-identity-pick="'+i+'" aria-pressed="'+(i===identityPortrait)+
  '" aria-label="Choose portrait '+(i+1)+': '+esc(o.label)+'">'+
  Pt.playerPortrait(i,p.manager,'portrait')+
  '<small>'+esc(o.label)+'</small></button>').join('');
 const html='<div class="player-identity-editor">'+
  '<div class="player-identity-intro"><div id="identity-preview">'+
   Pt.playerPortrait(identityPortrait,p.manager,'portrait x3')+'</div>'+
   '<div class="player-identity-fields"><p class="dim">Suggested from British wrestling history and hall-circuit homages. Edit either name or try another. Portraits are cosmetic.</p>'+
   '<label for="identity-manager">Manager name</label>'+
   '<input id="identity-manager" type="text" maxlength="42" autocomplete="name" required value="'+esc(p.manager)+'">'+
   '<label for="identity-stable">Stable / operation name</label>'+
   '<input id="identity-stable" type="text" maxlength="42" required value="'+esc(p.stable)+'">'+
   '<button class="btn sm" type="button" data-identity-random="1">Another from the archives</button>'+
   '<p id="identity-error" class="bad" role="alert" hidden>Enter both a manager name and a stable name.</p>'+
   '</div></div>'+
  '<fieldset class="player-portrait-picker"><legend>Choose your portrait <small>16 styles</small></legend>'+
   '<div class="player-portrait-grid">'+picker+'</div></fieldset></div>';
 const d=dialog(mode==='edit'?'Your manager profile':'Meet the New Boss',html,
  [['Cancel','close'],[mode==='new'?'Start career':'Save identity','identity-save','go']]);
 d.classList.add('identity-dialog');
 d.querySelector('#identity-manager')?.focus();
}
// The commentary booth: whoever is speaking gets a name tag, and the live line gets their portrait.
function booth(l){return l&&l.who?D.BOOTH?.[l.who]||null:null}
function voiceCls(l){return booth(l)?' v-'+l.who:''}
function voiceTag(l){const b=booth(l);return b?`<b class="spk" title="${esc(b.name)}, ${esc(b.role.toLowerCase())}">${esc(b.short)}</b>`:''}
function voiceFace(l){const b=booth(l);return b?`<img class="spk-pf" src="${esc(b.img)}" alt="${esc(b.name)}" title="${esc(b.name)}, ${esc(b.role.toLowerCase())}" width="48" height="60">`:''}
function logList(log){return `<ol class="fulllog">${(log||[]).map(l=>`<li class="${l.kind} ${l.big?'big':''}${voiceCls(l)}"><span class="t">${esc(l.t)}</span><span>${voiceTag(l)}${esc(l.text)}</span></li>`).join('')}</ol>`}

/* ---------- continue ---------- */
function proceed(){
 const s=S();
 if(s.after?.autonomous&&resumeNight())return;
 OfficeTerritory.reconcileOrdinaryTitles();
 if(G.pending().length){inboxFilter='action';openMsg=G.pending()[0].id;go('inbox',phoneLayout()?openMsg:null);toast('Reply to the messages marked in red first.');return}
 if(s.card.length){
  const week=G.officeBrief();
  if(week.today.length||week.deadline.length){
   dialog('Start match night?',`<p>${s.card.length} ${plural(s.card.length,'match')} booked. This show will advance the week when finished.</p><p>${week.today.length} additional bookable current-week ${plural(week.today.length,'offer')} and ${week.deadline.length} future ${plural(week.deadline.length,'offer')} expiring this week remain.</p><p>Projected bank after signed purses and costs: <b>${money(week.after)}</b>.</p>`,[['Review offers','review-week-offers'],['Start match night','confirm-start-night','go']]);return;
  }
  startNight();return;
 }
 if(!s.roster.length&&s.week===1){go('scouting');toast('Sign a wrestler first.');return}
 // An empty week costs real money and an opportunity. Show the consequences before advancing.
 const cost=G.wages()+G.overhead()+G.trainingBill();
 const week=G.officeBrief(),outstanding=week.today.length+week.deadline.length;
 dialog('Advance without a booking?',`<p>No matches are booked this week. You will earn <b>£0 in match purses</b> and pay an estimated <b>${money(cost)}</b> in wages, overheads and training.</p><p>Your bank is projected to move from <b>${money(s.cash)}</b> to <b>${money(s.cash-cost)}</b>.</p><p>${outstanding?outstanding+' bookable '+plural(outstanding,'offer')+' will be lost or expire. ':''}Advancing uses up this week of the season and any active sponsor trial.</p>`,[['Review offers','review-week-offers'],['Advance anyway','confirm-empty-week','red']]);
 return;
 toast(`Week ${s.week}. ${s.offers.length} ${plural(s.offers.length,'offer')} on the table.`);
}
function gameOver(){
 dialog('The office is closed',`<p>The bank has called in your overdraft. After ${S().season>1?S().season-1+' seasons and ':''}${S().history.length} matches, the territory goes on without you.</p>`,[['Start again','newgame','go']]);
}

/* ======================= MATCH NIGHT ======================= */
const NIGHT_STORE='the-office-v23-match'; // same key: preserve existing mid-match saves
function persistNight(){
 if(!night?.queue||G.saveStatus().ok===false)return;
 try{const m=night.M?{...night.M,rState:night.M.r?.getState?.()}:null;
 localStorage.setItem(NIGHT_STORE,JSON.stringify({careerSeed:S().careerSeed,period:night.period??night.before?.abs??G.abs(),queue:night.queue,i:night.i,speed:night.speed,results:night.results,before:night.before||null,resultHTML:night.stage==='result'?night.resultHTML||null:null,plan:night.plan,promo:night.promo,mouth:night.mouth||null,segment:night.segment||null,seg:night.seg||null,signing:night.signing||null,after:night.after||null,afterReady:night.afterReady||null,stage:night.stage||'prep',M:m,past:night.past||[]}));
 }catch(e){console.warn('Match autosave failed',e)}
}
function clearNight(){try{localStorage.removeItem(NIGHT_STORE)}catch(e){}}
let tvPreviousFocus=null;
function openTV(){tvPreviousFocus=document.activeElement;clearToast();$('#tv').hidden=false;$('#app').inert=true;$('#tv').setAttribute('tabindex','-1');$('#tv').focus();document.body.style.overflow='hidden'}
function closeTVFocus(){$('#app').inert=false;$('#tv').removeAttribute('tabindex');if(tvPreviousFocus?.isConnected)tvPreviousFocus.focus();tvPreviousFocus=null}
function resumeNight(){
 let saved=null;try{saved=JSON.parse(localStorage.getItem(NIGHT_STORE)||'null')}catch(e){}
 saved=G.recoverNight(saved);
 if(!saved){clearNight();return false;}
 const afterOpen=saved?.stage==='after'&&!!saved.after;
 const resultOpen=saved.stage==='result'&&!!saved.resultHTML;
 night={...saved,paused:true};
 if(afterOpen){openTV();showAfter();return true}
 if(resultOpen){openTV();$('#tv').innerHTML=saved.resultHTML;
  // Old result snapshots may not yet have resolved the autonomous opening.
  const ready=night.afterReady;
  if(!night.after&&ready)night.after=OfficeAfter.prepareAutonomous(ready.c,ready.fin,ready.plan);
  if(night.after?.required&&night.after.stage!=='done')return showAfter(),true;
  return true}
 if(night.stage==='recovered-result'||night.i>=night.queue.length){openTV();$('#tv').innerHTML='<div class="strip"><b>Show recovered</b></div><div class="stage"><p>The completed matches are already recorded in your career. No match will be paid or played twice.</p></div><div class="tv-foot"><button class="btn go" data-tv="done">Finish show</button></div>';return true;}
 openTV();
 if(saved.stage==='live'&&saved.M){
  const restored=Mx.restore(saved.M);
  bell();clearTimeout(night.timer);night.M=restored;night.past=saved.past||[];night.paused=true;
  updateLive();const last=restored.log?.[restored.log.length-1];if(last)showLine(last,true);
  if(restored.decision&&!restored.queue.length)showDecision();
 }else if(saved.stage==='after'&&saved.after)showAfter();else if(saved.stage==='signing')showSigning();else if(saved.stage==='segment')showSegment();else if(saved.stage==='segpick')showPromos();else if(saved.stage==='promo'||saved.stage==='mouth')showPromos();else if(saved.stage==='meeting')showMeeting();else prep();
 persistNight();return true;
}
const SPEED={slow:{line:2600,pause:1100},normal:{line:1500,pause:750},fast:{line:520,pause:260},skip:{line:0,pause:0}};
function startNight(){
 if(S().after?.autonomous&&resumeNight())return;
 night={period:G.abs(),queue:S().card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank).map(c=>c.id),i:0,speed:night?.speed||'normal',results:[],before:OfficeNightReport.capture(S())};
 openTV();night.stage='prep';prep();persistNight();
}
function current(){return S().card.find(c=>c.id===night.queue[night.i])}
function strip(c,label){const p=G.P(c.pid);return `<div class="strip"><b>${esc(p.name)} ${label||'live'}</b><span>${esc(p.venue)}</span><span class="r">Match ${Math.min(night.i+1,night.queue.length)} of ${night.queue.length}</span></div>`}
function cmpRow(label,a,b){const up=a>b;return `<div class="cmpr"><span class="v ${up?'up':''}">${a}</span><span class="l"><i style="width:${a}%"></i></span><span class="lab">${label}</span><span class="r"><i style="width:${b}%"></i></span><span class="v r2">${b}</span></div>`}
function prep(){
 // v3.6: match night opens backstage. The game plan is the first thing Dennis asks about.
 const c=current();if(!c)return endNight();
 const w=G.W(c.wid);
 night.plan=night.plan&&night.plan.cid===c.id?night.plan:{cid:c.id,game:D.STYLE_PLAN[w.style],leash:w.psych>=75&&w.ego<75?'free':'script',talk:'none',structureSelected:false};
 return showMeeting();
}

/* ---------- their corner (rival stables) ---------- */
function rivalNote(c){
 const t=window.OfficeRivalCorner?.telegraph(c);if(!t)return '';
 return `<h3 class="section-h after-h">Their corner</h3><p class="${t.warn?'bad':'dim'}">${esc(t.line)}</p>`;
}

/* ---------- ringside plans (v0.3.21) ---------- */
function cornerPicker(c,w,f){
 const R=window.OfficeRingside;if(!R)return '';
 const list=R.seconds(c,w,f);if(!list.length)return '';
 const plan=R.parse(night.plan?.corner),who=night.plan?.cornerWho||plan?.id||'none';
 const people=[{id:'none',short:'Nobody',note:w.short+' walks out alone.'},...list];
 const chosen=list.find(x=>x.id===who);
 const jobs=chosen?(chosen.refuse?`<p class="dim">${esc(chosen.refuse)}</p>`:`<div class="picks after-picks">${chosen.jobs.map(j=>{const J=R.JOBS[j],on=plan?.id===chosen.id&&plan.job===j;return `<button class="decision-option${on?' on':''}" data-cornerjob="${esc(chosen.id+':'+j)}" aria-pressed="${on}"><b>${esc(J.label)}</b><span>${esc(J.hint)}</span>${tagChips(J.tags)}</button>`}).join('')}</div>`):'';
 return `<h3 class="section-h after-h">At ringside</h3><p class="dim">${esc(OfficeRoom.AGENT)}: “Anybody going out with ${esc(w.short)}?”</p><div class="corner-who" role="group" aria-label="Who goes to ringside">${people.map(x=>`<button class="btn${x.id===who?' on':''}" data-cornerwho="${esc(x.id)}" aria-pressed="${x.id===who}" title="${esc(x.note||'')}">${esc(x.short)}${x.refuse?' ✗':''}</button>`).join('')}</div>${chosen&&chosen.note?`<p class="dim corner-note">${esc(chosen.note)}</p>`:''}${jobs}`;
}

/* ---------- after the bell (v0.3.20) ---------- */
function afterNext(){const more=night.i<night.queue.length;return `<button class="btn go" data-tv="${more?'next':'done'}">${more?'Next match':'Finish show'}</button>`}
function showAfter(){
 const st=night.after;if(!st)return night.i<night.queue.length?prep():endNight();
 const w=G.W(st.c.wid)||D.findWrestler(st.c.wid),f=G.F(st.c.rid)||D.findWrestler(st.c.rid),p=G.P(st.c.pid);
 const v=OfficeAfter.view(st);night.stage='after';
 const entries=v.log.map(e=>({who:e.who,side:e.side==='stage'?'c':e.side,text:e.text}));
 const cons=v.stage==='done'&&v.cons.length?`<section class="after-consequences" aria-label="Consequences"><h3 class="section-h">Consequences</h3><ul class="cons">${v.cons.map(x=>`<li class="${x.tone>0?'up':x.tone<0?'down':''}">${esc(x.text)}</li>`).join('')}</ul></section>`:'';
 // The first call is the angle, made with the result known; then the microphone.
 const decide=['angle','follow','mic'].includes(v.stage)?`<div class="decide2"><h3 class="section-h">${esc(v.title)}</h3><p class="lede">${esc(v.ask)}</p>${pickCards(v.options,v.stage==='angle'?'afterangle':v.stage==='follow'?'afterfollow':'aftermic')}</div>`:'';
 const middle=`<b class="fin">${esc(v.stepLabel)}</b><span>${esc(v.stage==='angle'?(p?.venue||''):v.plan==='none'?'No further action':v.planLabel)}</span>`;
 $('#tv').innerHTML=`<div class="strip"><b>${esc(p?.name||'')}: after the bell</b><span>${esc(w?.name||'')} v ${esc(f?.name||'')}</span><span class="r">Match ${night.i} of ${night.queue.length}</span></div><div class="stage screen s-back s-after${v.stage==='done'?' is-done':''}">${win('After the bell',matchupBar({},w,f,middle)+sceneLog(entries,'afterTalk',w,f,p?.id)+decide+cons,{h:'h3',body:'tight'})}</div><div class="tv-foot"><span class="dim">${esc(v.stage==='angle'?'The bell has gone. Nobody has left the ring.':v.stage==='follow'?'The situation is unresolved.':v.stage==='mic'?'The microphone is live.':'The crowd starts filing out.')}</span>${v.stage==='done'?afterNext():v.cons.length?`<span class="dim" role="status">${esc(v.cons.at(-1).text)}</span>`:''}</div>`;
 scrollTalk('afterTalk');persistNight();
}

/* ---------- the contract signing (v0.3.24) ---------- */
function showSigning(){
 const c=current();if(!c)return endNight();
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
 if(!night.signing||night.signing.cid!==c.id)night.signing=OfficeSigning.begin(c,w,f,p);
 const st=night.signing,v=OfficeSigning.view(st);night.stage='signing';
 const entries=v.log.map(e=>({who:e.who,side:e.side==='stage'?'c':e.side==='p'?'promoter':e.side,text:e.text,kind:e.kind}));
 const hot=v.tension>=4?'bad':v.tension>=2?'':'good';
 const middle=`<b class="fin">Contract signing</b><span class="${hot}">Tension: ${esc(v.tensionWord)}</span>`;
 const chapter=window.OfficeProgrammeArcs?.intro(c,night.plan?.arcChoice);
 const arcCue=chapter?`<p class="arc-follow arc-signing"><b>Programme, chapter ${esc(c.programme.step+1)}:</b> ${esc(chapter.read)}<span>${esc(chapter.prompt)}</span></p>`:'';
 const decide=v.stage==='done'?`<div class="decide2"><h3 class="section-h">Signed</h3><p class="lede"><b>${esc(v.result.reaction)}</b></p></div>`:
  `<div class="decide2"><h3 class="section-h">${esc(v.name)} <small>${v.round+1} of ${v.total}</small></h3><p class="lede">${esc(v.help)}</p>${pickCards(v.options,'contract')}</div>`;
 $('#tv').innerHTML=strip(c,'contract signing')+'<div class="stage screen s-back">'+win('The contract signing: '+w.short+' and '+f.short,matchupBar(c,w,f,middle)+arcCue+sceneLog(entries,'signTalk',w,f,p.id)+decide,{h:'h3',body:'tight'})+'</div>'+
  `<div class="tv-foot"><span class="dim">${esc(v.stage==='done'?'The paperwork is done.':'Every choice turns the room up or down.')}</span>${v.stage==='done'?'<button class="btn go" data-tv="bell">Ring the bell</button>':`<span class="dim">${esc(v.name)}</span>`}</div>`;
 scrollTalk('signTalk');persistNight();
}

/* ---------- promo segments that are not a back-and-forth ---------- */
function showSegmentPick(c,w,f,p){
 night.stage='segpick';
 const SG=window.OfficeSegments;
 const body=matchupBar(c,w,f,'<b class="fin">Mic '+esc(w.mic)+' v '+esc(f.mic)+'</b>')+`<div class="decide2"><h3 class="section-h">Before the match</h3><p class="lede">${esc(OfficeRoom.AGENT)}: “${esc(SG.advice(c,w,f))}”</p>${deskTable(SG.menu(c,w,f,p),'segment',w,f,p)}</div>`;
 $('#tv').innerHTML=strip(c,'microphone time')+'<div class="stage screen s-back s-promo">'+win('The segment',body,{h:'h3',body:'tight'})+'</div><div class="tv-foot"><span class="dim">Not every segment needs two people talking.</span></div>';
 persistNight();
}
function showSegment(loadedBanks,previousPosition){
 const c=current();if(!c)return endNight();
 const choicePosition=previousPosition===undefined?(night.stage==='segment'?decisionScroll('s-promo'):null):previousPosition;
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid),SG=window.OfficeSegments,type=night.segment.type;
 if(!night.seg||night.seg.cid!==c.id||night.seg.type!==type){
  // A solo promo or a grilling speaks in the wrestler's own words: fetch their bank first.
  if(SG.BANKED.has(type)&&loadedBanks===undefined){
   const n=night,cid=c.id,token={cid,type};n.segLoading=token;n.seg=null;n.stage='segment';
   $('#tv').innerHTML=strip(c,'microphone time')+'<div class="stage screen s-back"><p role="status">Preparing the microphone…</p></div>';
   persistNight();
   const id=window.OfficePromoIdentity?.bankId?.(w)||w.id;
   Promise.resolve(window.OfficePromoBanks?.load([id])||[]).catch(()=>[]).then(banks=>{
    if(n.segLoading!==token)return;delete n.segLoading;
    if(night===n&&n.stage==='segment'&&current()?.id===cid&&n.segment?.type===type)showSegment(banks,choicePosition);
   });return;
  }
  night.seg=SG.begin(type,c,w,f,p,{banks:loadedBanks||[]});
 }
 const st=night.seg,v=SG.view(st);night.stage='segment';
 const entries=v.log.map(e=>({who:e.who,side:e.side==='stage'||e.side==='crowd'?'c':e.side==='p'?'promoter':e.side,text:e.text,kind:e.kind}));
 const m=v.meter,tone=v.type==='ambush'?'':m.value>=3?'good':m.value<=-3?'bad':'';
 const middle=`<b class="fin">${esc(v.name)}</b><span class="${tone}">${esc(m.label)}: ${esc(m.word)}</span>`;
 const reconciliation=v.stage==='done'&&v.result.promise?OfficeRoom.promoReconciliation(night.plan?.sheet,v.result,w,f,c.finish):null;
 const decide=v.stage==='done'?`<div class="decide2"><h3 class="section-h">${esc(v.heading)}</h3><p class="lede"><b>${esc(v.result.reaction)}</b> ${esc(v.result.hook)}</p>${reconciliation?`<p class="dim"><b>${esc(OfficeRoom.AGENT)} — ${esc(reconciliation.status)}:</b> ${esc(reconciliation.reason)}</p>`:''}</div>`:
  `<div class="decide2"><h3 class="section-h">${esc(v.heading)} <small>${v.round+1} of ${v.total}</small></h3><p class="lede">${esc(v.help)}</p>${pickCards(v.options,'seg')}</div>`;
 $('#tv').innerHTML=strip(c,'microphone time')+'<div class="stage screen s-back s-promo">'+win(v.name+': '+w.short+(v.type==='ambush'?' and ':' before facing ')+f.short,matchupBar(c,w,f,middle)+sceneLog(entries,'segTalk',w,f,p.id)+decide,{h:'h3',body:'tight'})+'</div>'+
  `<div class="tv-foot"><span class="dim">${esc(v.stage==='done'?'That is the segment.':'Every choice says what it risks.')}</span>${v.stage==='done'?'<button class="btn go" data-tv="bell">Ring the bell</button>':`<span class="dim">${esc(v.heading)}</span>`}</div>`;
 scrollTalk('segTalk',!choicePosition);restoreDecisionScroll('s-promo',choicePosition);persistNight();
}

/* ---------- the mouthpiece (v0.3.25) ---------- */
function showMouthpiece(c,w,f,p,talkers){
 night.stage='mouth';
 const opts=[{id:'none',label:w.short+' talks for themselves',hint:w.short+'’s own voice, mic '+w.mic+'.',tags:w.mic<45?['Risky']:['Safe']},
  ...talkers.map(x=>({id:x.id,label:x.short+' does the talking',hint:'Mic '+x.mic+' against '+w.short+'’s '+w.mic+'. '+(x.refuse||x.note||'')+(x.ego?' '+x.ego:''),tags:x.refuse?['Refuses']:['Better talker','Builds a bond',...(x.ego?['Ego risk']:[]),'They will mock it']}))]
  .filter(o=>!/Refuses/.test(o.tags.join()));
 const body=matchupBar(c,w,f,'<b class="fin">Who talks?</b>')+`<div class="decide2"><h3 class="section-h">Who has the microphone?</h3><p class="lede">${esc(OfficeRoom.AGENT)}: “${esc(w.short)} isn’t the best talker in the stable. Do we send somebody out to do it for them?”</p>${pickCards(opts,'mouth')}</div>`;
 $('#tv').innerHTML=strip(c,'microphone time')+'<div class="stage screen s-back s-promo">'+win('Before the promo',body,{h:'h3',body:'tight'})+'</div><div class="tv-foot"><span class="dim">A mouthpiece speaks; the wrestler is held to it.</span></div>';
 persistNight();
}

/* ---------- backstage and the promo duel ---------- */
const FINISH_WORDS={win_clean:'wins clean',win_dirty:'wins dirty',lose_protected:'loses, protected',lose_clean:'loses clean',win_dq:'wins by DQ',lose_dq:'loses by DQ',dq:'disqualified',nc:'no contest'};
function signatureText(w){const A=window.OfficeMatch?.GRAPH?.A||{},list=(D.PROFILES[w.id]?.signature||[]).map(id=>A[id]?.name).filter(Boolean);
 return list.length?' Known for: '+list.join(', ')+'.':'';}
function beatLabel(x){if(x.startsWith('outcome_')){const k=x.slice(8);return 'finish: '+(FINISH_WORDS[k]||k.replace(/_/g,' '));}
 const n=window.OfficeMatch?.GRAPH?.A?.[x];if(n?.name)return n.counterOf?'reversal of the '+n.name:n.blockOf?'blocked '+n.name:n.name;return x.replace(/_/g,' ');}
function scrollTalk(id,resetViewport=true){const el=document.getElementById(id);if(el)el.scrollTop=el.scrollHeight;if(resetViewport&&phoneLayout())$('#tv').scrollTop=0}
// The scroll owner changes with screen size: the viewport, stage, window body
// or choice pane. Capture all of them before replacing the conversation DOM.
function decisionScrollNodes(stage){
 const tv=$('#tv'),screen=tv?.querySelector('.'+stage),panel=screen?.querySelector('.decide2');
 if(!panel)return null;
 return {tv,stage:screen,win:panel.closest('.win'),body:panel.closest('.wbody'),panel,context:screen.querySelector('.promo-context')};
}
function decisionScroll(stage){
 const nodes=decisionScrollNodes(stage);if(!nodes)return null;
 return Object.fromEntries(Object.entries(nodes).map(([key,node])=>[key,node?.scrollTop||0]));
}
function restoreDecisionScroll(stage,position){
 if(!position)return;const nodes=decisionScrollNodes(stage);if(!nodes)return;
 // Native scrollTop clamps to the available space when the next round is shorter.
 for(const [key,node] of Object.entries(nodes))if(node)node.scrollTop=position[key]||0;
}
function tagChips(tags){
 // What an option will do, at a glance: green helps, red costs, amber is a risk or a gamble.
 const cls=t=>/▲ or ▼|Gamble|risk|Risk|Risky|stake|if |Unlikely|booked|Will not work|either way|loses clean/.test(t)?'warn':/▼|−£|Shorter|Limits|No promo/.test(t)?'down':/▲|\+£|Safe|Safer|Better|Wins|Builds|Steady/.test(t)?'up':'';
 return tags?.length?`<span class="tags">${tags.map(t=>`<i class="${cls(t)}">${esc(t)}</i>`).join('')}</span>`:'';
}
function sceneLog(entries,id,w,f,pid){
 // The conversation as people talking: your side on the left, theirs on the right.
 const row=e=>{
  const side=e.side,pos=side==='w'?'l':side==='f'||side==='promoter'?'r':side==='you'?'you':side==='agent'||side==='host'?'l':'c';
  const pic=side==='w'?face('wrestler',w.id,w.name):side==='f'?face('wrestler',f.id,f.name):side==='agent'?face('booker','dennis','Dennis'):side==='promoter'?face('booker',pid,e.who||''):'';
  const swing=e.swing?`<b class="swing ${e.swing>0?'up':'down'}">${e.swing>0?'+':'−'}${Math.abs(e.swing)}</b>`:'';
  const sharp=e.kind==='objection'||e.kind==='fluff'||e.kind==='uneven';
  return `<div class="bub ${pos}${sharp?' sharp':''}${pos==='c'?' aside':''}">${pic?`<span class="pf">${pic}</span>`:''}<div class="say">${e.who&&pos!=='c'&&pos!=='you'?`<small>${esc(e.who)}</small>`:''}<p>${esc(e.text)}${swing}</p></div></div>`;
 };
 const compact=['roomTalk','micTalk','segTalk'].includes(id);
 if(!compact)return `<div class="scene" id="${id}" tabindex="0" aria-label="Conversation">${entries.map(row).join('')}</div>`;
 // The latest exchange is on the desk. Earlier dialogue is available without
 // taking up a permanent scrolling column or hiding the active decisions.
 const recent=entries.slice(-2),history=entries.slice(0,-2);
 return `<div class="scene desk-dialogue" id="${id}" aria-label="Conversation">${history.length?`<details class="dialogue-history"><summary>Earlier conversation (${history.length})</summary><div class="dialogue-history-lines">${history.map(row).join('')}</div></details>`:''}<div class="dialogue-current">${recent.map(row).join('')}</div></div>`;
}
function pickCards(options,attr,compact){
 // In the duel there are five options at once, so hints are cut to their first sentence.
 const brief=t=>compact?String(t||'').split(/(?<=[.!?])\s/)[0]:t;
 return `<div class="picks${compact?' five':''}">${options.map(o=>`<button class="decision-option" data-${attr}="${esc(o.id)}"><b>${esc(o.label)}</b>${o.hint?`<span>${esc(brief(o.hint))}</span>`:''}${tagChips(o.tags)}</button>`).join('')}</div>`;
}
function deskTable(options,attr,w,f,p){
 const planning=attr==='room',promo=attr==='mic',seg=attr==='segment';
 const riskLabels=['Safe','Steady','Risky','Very risky'];
 const cols=planning?[w.short,f.short,'Sheet']:promo?['Risk','Crowd','Rivalry','Cred. ',p?.name?.split(' ')[0]||'Promoter','Promise']:seg?['Risk','Details']:['Effects'];
 const sign=t=>/▲|Wins the crowd|Stokes the rivalry|Builds credibility/.test(t)?'up':/▼/.test(t)?'down':'';
 const cell=(a,label)=>`<td class="desk-effect" data-label="${esc(label)}">${a.length?a.map(t=>`<span class="${sign(t)}">${esc(t)}</span>`).join(' · '):'–'}</td>`;
 return `<div class="well desk-table"><table class="grid"><thead><tr><th>#</th><th>${planning?'Response':promo?'Line':'Choice'}</th>${cols.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${options.map((o,i)=>{
  let tags=[...(o.tags||[])],cells=[];
  const take=fn=>{const a=tags.filter(fn);tags=tags.filter(t=>!fn(t));return a;};
  if(planning){
   for(const x of [w,f])cells.push(cell(take(t=>t.startsWith(x.short+' ')&&/[▲▼]/.test(t)).map(t=>t.slice(x.short.length).trim()),x.short));
   cells.push(cell(take(t=>/layout|running order|Changes |Keeps |finish|Limits the match|objective|sequence|called spots/i.test(t)),'Sheet'));
  }else if(promo||seg){
   const risk=take(t=>riskLabels.includes(t))[0],r=riskLabels.indexOf(risk);
   cells.push(`<td class="desk-effect" data-label="Risk">${r<0?'–':`<span class="risk-pips risk-${r}" title="${risk}" aria-label="${risk}">${'●'.repeat(r+1)}${'○'.repeat(3-r)}</span>`}</td>`);
   if(promo){
    for(const [label,re] of [['Crowd',/Wins the crowd|Big swing either way|Small gain|Crowd [▲▼]/i],['Rivalry',/Stokes the rivalry|Rivalry [▲▼]/i],['Cred.',/Builds credibility/i],[cols[4],null],['Promise',/Promise|Names the finisher|match strip|booked|Unlikely|Safe bet/i]]){
     const a=take(t=>re?re.test(t):t.startsWith(cols[4]+' ')&&/[▲▼]/.test(t));
     cells.push(cell(a.map(t=>t==='Wins the crowd'||t==='Stokes the rivalry'||t==='Builds credibility'?'▲':t.startsWith(cols[4]+' ')?t.slice(cols[4].length).trim():t),label));
    }
   }else cells.push(cell(take(()=>true),'Details'));
  }else cells.push(cell(take(()=>true),'Effects'));
  return `<tr class="pick"><td class="desk-index">${i+1}</td><td class="wrap desk-response"><button class="row-pick decision-option" data-${attr}="${esc(o.id)}"><b>${esc(o.label)}</b>${o.hint?`<small>${esc(o.hint)}</small>`:''}${tags.length?`<small class="desk-extra">${esc(tags.join(' · '))}</small>`:''}</button></td>${cells.join('')}</tr>`;
 }).join('')}</tbody></table></div>`;
}
function deskTranscript(entries,id,w,f){
 return `<div class="scene well desk-transcript" id="${id}" aria-label="Full conversation">${entries.map(e=>`<div class="desk-line ${esc(e.side||'')}"><b>${esc(e.who||(e.side==='w'?w.short:e.side==='f'?f.short:e.side==='agent'?'Dennis':e.side==='you'?'You':e.side==='host'?'Host':''))}</b><span>${esc(e.text||e.line||'')}</span><span class="${e.swing>0?'up':e.swing<0?'down':''}" ${e.swing?'title="Change towards your wrestler"':''}>${e.swing?(e.swing>0?'▲':'▼')+Math.abs(e.swing):''}</span></div>`).join('')}</div>`;
}
function momentumShape(id,windows=[],minutes){
 // Draw the actual timing windows, not a fictional momentum prediction.
 const defaults=id==='traditional'?OfficeSheets.TRADITIONAL_WINDOWS:OfficeSheets.STRUCTURES.create({id,lead:'w'}).objectives;
 const phases=defaults.map((d,i)=>({name:windows[i]?.name||d.name||d.title,window:windows[i]?.window||d.window}));
 const labels=phases.map(r=>r.name+' '+Math.round(r.window[0]*100)+'–'+Math.round(r.window[1]*100)+'%').join('; ');
 const compact=!!minutes;
 if(compact)return `<svg class="momentum-shape" viewBox="0 0 240 48" preserveAspectRatio="none" role="img" aria-label="${esc('Planned timing windows: '+labels+' · '+minutes+' minutes')}">${phases.map((r,i)=>`<rect x="${5+230*r.window[0]}" y="${3+i*11}" width="${230*(r.window[1]-r.window[0])}" height="8" fill="var(--gold)"><title>${esc(r.name)}</title></rect>`).join('')}</svg>`;
 return `<svg class="momentum-shape" viewBox="0 0 240 106" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc('Planned timing windows: '+labels+(minutes?' · '+minutes+' minutes':''))}">${[0,.25,.5,.75,1].map(t=>`<path d="M${5+t*230} 2V104" stroke="var(--well-line)" stroke-dasharray="2 3"/>`).join('')}${phases.map((r,i)=>`<text x="5" y="${12+i*25}" fill="var(--white)" font-size="10">${esc(r.name)}</text><rect x="${5+230*r.window[0]}" y="${15+i*25}" width="${230*(r.window[1]-r.window[0])}" height="8" fill="var(--gold)"><title>${esc(r.name)}: ${Math.round(r.window[0]*100)}–${Math.round(r.window[1]*100)}%</title></rect>`).join('')}</svg>`;
}
function matchDeskSheet(st,v,c,w,f,p,selected,structurePicked,finishLine){
 const rows=OfficeRoom.boardView(st),minutes=st.sheet?.minutes||Math.max(5,c.minutes+(st.fx.minutes||0)),named=rows.filter(r=>r.current&&!/call this objective in the ring/i.test(r.current)).length;
 const route=v.structureBrief?.route||OfficeRoom.ROUTE_NAME[st.lockRoute||st.board?.finish?.route]||'Not selected';
 const approach=st.game?D.PLANS[st.game]?.name||st.game:'Not selected';
 const structure=selected==='traditional'?'Traditional':OfficeSheets.STRUCTURES.catalogue().find(x=>x.id===selected)?.label||selected;
 const details=v.agreed.filter(x=>!x.startsWith('Structure: ')&&!x.startsWith('Finish: ')&&!rows.some(r=>x.startsWith(r.name+': '))&&x!==approach);
 const rail=['Structure','Approach','Finish & spots','Backstage','Sign'],index=!structurePicked?0:st.stage==='plan'?1:st.stage==='board'?2:st.stage==='scene'?3:4;
 return {rail:`<nav class="desk-rail" aria-label="Planning stage">${rail.map((x,i)=>i<index&&(i===0||night.plan.roomCheckpoints?.[i])?`<button type="button" class="complete" data-planback="${i}" title="Return to ${esc(x)}">${i+1} ${x} ✓</button>`:`<span ${i===index?'aria-current="step"':''} class="${i<index?'complete':i===index?'active':''}">${i+1} ${x}${i<index?' ✓':''}</span>`).join('')}</nav>`,
 sheet:`<aside class="paper match-desk-sheet"><h3 class="desk-title">Match sheet</h3><details class="sheet-mobile"><summary>${named} of ${rows.length} named · ${st.stage==='done'?'Signed':st.stage==='review'?'Ready to review':esc(rail[index])}</summary><div class="sheet-mobile-body"></div></details><div class="sheet-body"><small>Booked by ${esc(p.name)} (locked)</small><h3>${esc(finishLine||D.FINISHES[c.finish]?.name||c.finish)}</h3><p>${esc(D.SLOTS[c.slot].name)} · ${minutes} minutes${c.stip?' · '+esc(stipName(c.stip)):''}</p><b>${structurePicked?esc(structure):'Choose a structure'}${v.structureBrief?' · '+esc(v.structureBrief.lead)+' leads':''}</b><p>${esc(approach)}</p>${structurePicked?momentumShape(selected,rows,minutes):''}<ol class="desk-objectives">${rows.map(r=>`<li class="${st.structureTalk?.objective===r.slot&&st.stage==='scene'?'active':''}"><b>${esc(r.name)}</b><span>${esc(r.current||'Not agreed')}${r.actor==='w'?' · '+esc(w.short):r.actor==='f'?' · '+esc(f.short):''}</span></li>`).join('')}</ol><p class="desk-finish"><b>Finish:</b> ${esc(route)}</p>${details.length?`<p class="desk-notes">${details.map(esc).join(' · ')}</p>`:''}${v.structureBrief?.discussion?`<p>${esc(v.structureBrief.discussion)}</p>`:''}</div></aside>`};
}
function crowdBroadcast(v,w,f){
 const entries=v.log.filter(e=>e.swing),max=Math.max(1,...entries.map(e=>Math.abs(e.swing))),m=v.meter;
 return `<section class="well crowd-broadcast" aria-label="Crowd scoreboard"><div class="broadcast-meter"><div>${face('wrestler',w.id,w.name)}<b>${esc(w.short)}</b></div><div class="crowd-axis" role="img" aria-label="${esc(v.meterWord)}"><i class="${m>=0?'towards':'away'}" style="width:${Math.abs(m)}%"></i></div><div><b>${esc(f.short)}</b>${face('wrestler',f.id,f.name)}</div></div><strong class="crowd-word">${esc(v.meterWord)}</strong><div class="crowd-trace" aria-label="Recorded crowd swings towards your wrestler">${entries.map(e=>`<div class="crowd-event" title="${esc(e.speaker||'Crowd')}: ${e.swing>0?'+':''}${e.swing}"><div class="trace-plot"><i class="${e.swing>0?'positive':'negative'}" style="height:${Math.abs(e.swing)/max*48}%"></i></div><small>${esc(e.speaker||'Crowd')} ${e.swing>0?'+':''}${e.swing}</small></div>`).join('')||'<span class="dim">No crowd swings yet</span>'}</div></section>`;
}
function matchupBar(c,w,f,middle,wNote,fNote){
 return `<div class="match-night-matchup"><div class="mu you">${face('wrestler',w.id,w.name,'portrait x2')}<div><b>${esc(w.short)}</b>${ownedChamps(w.id)}${wNote||''}</div></div><div class="mid">${middle}</div><div class="mu them"><div><b>${esc(f.short)}</b>${fNote||''}</div>${face('wrestler',f.id,f.name,'portrait x2')}</div></div>`;
}
// The room view only carries finishPlan while the board, review or curtain is
// on screen. Remember the last readiness check for this match so the brief
// does not fall back to "being agreed" once the finish has been signed off.
const briefFinishSeen={cid:null,plan:null};
function backstageBrief(c,P,v){
 const finish=D.FINISHES[c.finish]?.name||'Contracted finish';
 if(briefFinishSeen.cid!==c.id){briefFinishSeen.cid=c.id;briefFinishSeen.plan=null;}
 if(v.finishPlan)briefFinishSeen.plan=v.finishPlan;
 const plan=v.finishPlan||(v.stage!=='plan'&&v.stage!=='board'?briefFinishSeen.plan:null);
 const agreedRoute=(v.agreed||[]).find(x=>x.startsWith('Finish: '))?.slice(8);
 const layout=v.stage==='done'?'Signed':v.stage==='curtain'?'Approved':v.review?'Ready for approval':v.board?'Planning called spots':
  v.stage==='scene'||v.stage==='finish'?'Agreed':'In discussion';
 const route=plan?.label||agreedRoute||'Being agreed';
 const readiness=plan?.kind==='warning'?'Dennis wants changes':plan?.kind==='conditional'?'Depends on the match':'Nothing extra needed';
 return `<section class="match-brief" aria-label="Agreed match brief">
  <div><small>Promoter’s booking</small><b>${esc(finish)}</b></div>
  <div><small>Finish route</small><b>${esc(route)}</b></div>
  <div><small>Running order</small><b>${esc(layout)}</b></div>
  <div class="${plan?.kind==='warning'?'brief-warning':''}"><small>Finish</small><b>${esc(readiness)}</b></div>
 </section>`;
}
function showMeeting(loadedBanks,previousPosition){
 const c=current();if(!c)return endNight();
 const choicePosition=previousPosition===undefined?(night.stage==='meeting'?decisionScroll('s-meeting'):null):previousPosition;
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid),P=night.plan,S0=S();
 if(!P.room||P.room.cid!==c.id||P.room.v!==3){
  const dialogue=window.OfficePlanningDialogue;
  if(P.structureChoice&&dialogue&&loadedBanks===undefined){
   // Never let a stale network completion replace a different match or
   // structure. Only the compact room snapshot goes into the autosave.
   const n=night,cid=c.id;
   P.room=null;
   const token=dialogue.beginLoad(n,P,cid);if(!token)return;
   persistNight();
   // Keep the current panel visible while changing an existing structure.
   // The room is null during the guarded load, so its old choices cannot act.
   if(choicePosition)$('#tv .s-meeting')?.setAttribute('aria-busy','true');
   else $('#tv').innerHTML=strip(c,'backstage')+'<div class="stage screen s-back"><p role="status">Preparing the backstage conversation…</p></div>';
   Promise.resolve(dialogue.loadPair(w,f)).catch(()=>[]).then(banks=>{
    if(dialogue.completeLoad(n,token,()=>night===n&&current()?.id===cid))showMeeting(banks,choicePosition);
   });return;
  }
  const opts={recent:S0.roomRecent||[],threads:OfficeRoom.liveThreads(S0.roomThreads,c.eventAbs??G.abs()),heat:G.feud(w.id,f.id)?.heat||0,rehearsed:G.rehearsed(w)};
  if(P.structureChoice){
   opts.structure={id:P.structureChoice.id,lead:P.structureChoice.lead};
   opts.structurePlanning=true;
   opts.planningCareer=S0;
   opts.planningInitiative=true;
   opts.planningProposal=true;
   opts.planningDialogue=true;
   opts.planningBargaining=true;
   opts.planningSequences=true;
   opts.planningSequencePolicy=3;
   opts.planningAdaptiveEntries=true;
   opts.planningContinuationVersion=1;
   opts.planningSequenceSigning=true;
   opts.planningBanks=loadedBanks||[];
  }
  P.room=OfficeRoom.begin(c,w,f,p,opts);P.sheet=null;P.confirmed=false;
 }
 const st=P.room,v=OfficeRoom.view(st);
 if(v.stage==='done'&&!P.confirmed){
  P.sheet=st.sheet;P.confirmed=true;P.game=st.sheet.game;P.talk=st.sheet.talk;if(st.sheet.leash)P.leash=st.sheet.leash;
  P.roomRecentBefore=(S0.roomRecent||[]).slice();S0.roomRecent=[...P.roomRecentBefore,...st.queue].slice(-6);G.save();
 }
 const finishLine={win_clean:`${w.short} wins clean`,win_dirty:`${w.short} wins dirty`,lose_protected:`${w.short} loses, protected`,lose_clean:`${w.short} loses clean`,win_dq:`${w.short} wins by DQ`,lose_dq:`${w.short} is disqualified`}[c.finish];
 const moodCls=x=>x.value>=62?'good':x.value>=50?'':'bad';
 const wNote=`<span class="${moodCls(v.moods.w)}">${esc(v.moods.w.word)}</span>${w.fatigue>=45?'<span class="bad">tired</span>':''}${w.morale<35?'<span class="bad">low morale</span>':''}`;
 const fNote=`<span class="${moodCls(v.moods.f)}">${esc(v.moods.f.word)}</span>${f.safe<55?'<span class="bad">careless</span>':''}${f.ego>=68?'<span class="bad">big ego</span>':''}${f.psych>=85?'<span class="good">storyteller</span>':''}`;
 const middle=`<b class="fin">${esc(finishLine)}</b><span>${c.stip?esc(stipName(c.stip))+' · ':''}${esc(D.SLOTS[c.slot].name)} · ${st.sheet?.minutes||Math.max(5,c.minutes+(st.fx.minutes||0))} minutes · ${esc(p.name)}</span>`;
 const verdictBad=v.story?.notes?.some(n=>!n.good);
 const agreed=v.agreed.length&&v.stage!=='board'?`<div class="sheetline"><b>In the match layout</b>${v.agreed.map(x=>`<i>${esc(x)}</i>`).join('')}${v.story&&v.stage!=='board'?`<i class="${verdictBad?'bad':'good'}">${esc(OfficeRoom.AGENT)}: ${esc(v.story.verdict)}</i>`:''}</div>`:'';
 // Choose the finish first. The readout is about preparedness, not a guaranteed result.
 const finishReadout=v.finishPlan?`<div class="finish-readout ${v.finishPlan.kind==='warning'?'warn':v.finishPlan.kind==='conditional'?'conditional':''}" role="status">
    <b>${v.finishPlan.kind==='warning'?'Needs revision':v.finishPlan.kind==='conditional'?'Must be earned in the ring':'No additional finish threshold'}</b>
    ${v.finishPlan.requirement?`<span>${esc(v.finishPlan.requirement)}</span>`:''}
    <p>${esc(v.finishPlan.summary)}</p>
   </div>`:'';
 // Phase 5 keeps contracted result, finishing route and dramatic
 // intentions visibly separate. The room's conversation record is an
 // agreement, not evidence of a performed move or guaranteed star bonus.
 const professionalNote=st.structurePlanning?OfficeMemory.professionalSummary(st.planningEvidence?.participants?.w?.relationship?.professional):null;
 const structurePanel=v.structureBrief&&['review','done'].includes(v.stage)?
  `<section class="structure-review" aria-label="Structure and signed finish summary">
   <h3 class="section-h">Dramatic structure versus booked result</h3>
   <dl>
    <div><dt>Promoter's booked result</dt><dd>${esc(v.structureBrief.booked)}</dd></div>
    <div><dt>Agreed finishing route</dt><dd>${esc(v.structureBrief.route)}</dd></div>
    <div><dt>Dramatic structure</dt><dd>${esc(v.structureBrief.label)} · ${esc(v.structureBrief.lead)} leads</dd></div>
    <div><dt>Performance approach</dt><dd>${esc(v.structureBrief.approach)}</dd></div>
   </dl>
   <p>${esc(v.structureBrief.focus)}. ${esc(v.structureBrief.advice)}</p>
   <p><b>${v.structureBrief.named} named moves, ${v.structureBrief.open} objectives left open.</b> These are instructions, not guaranteed actions.</p>
   ${professionalNote?'<p class="structure-conversation"><b>Previous working experience:</b> '+esc(professionalNote)+'</p>':''}
   ${v.structureBrief.discussion?'<p class="structure-conversation"><b>Backstage agreement:</b> '+esc(v.structureBrief.discussion)+'</p>':''}
  </section>`:'';
 const metric=v.finishPlan?.preparation;
 const shortRequirement=f=>({limb_finish:"Focused damage 4+",submission_defeat:"Focused damage to our wrestler 4+",injury_gives:"Focused damage to our wrestler 3+",reversal_finisher:"3 reversals by "+w.short,finisher_reversed:"3 reversals by "+f.short}[f.route]||f.requirement||"Nothing extra");
 const preparation=metric?`<div class="finish-preparation" role="status"><div class="prep-boxes" aria-hidden="true">${Array.from({length:metric.required},(_,i)=>`<i class="${i<metric.planned?"filled":""}"></i>`).join("")}</div><div><b>${metric.planned} of ${metric.required} ${esc(metric.unit)} planned.</b> ${metric.planned>=metric.required?"The called spots could support the finish if performed successfully.":"Choose supporting spots or earn the remainder in the ring."} ${metric.unit==="focused damage"?metric.estimated?"Best compatible target"+(metric.target?": "+esc(metric.target):"")+". Actual target is determined in the ring.":"Focused target: "+esc(metric.target)+". Damage must land on that target.":""}</div></div>${v.finishPlan.kind==="warning"?finishReadout:""}`:finishReadout;
 const routePicker=v.board?`<section class="finish-choice" aria-label="Choose the finish"><div class="rorder-heading"><b>1 How does it end?</b><span>${esc(finishLine)} either way</span></div>${v.finishes?.length?`<table class="grid finish-table"><thead><tr><th scope="col">Finish</th><th scope="col">Needs in the ring</th></tr></thead><tbody>${v.finishes.map(f=>`<tr class="${f.selected?"chosen":""}"><td><button class="row-pick" data-room="${esc(f.id)}" aria-pressed="${f.selected}">${f.selected?"●":"○"} &nbsp; ${esc(f.label)}</button></td><td>${esc(shortRequirement(f))}${f.tags.filter(t=>t.includes("objects")).map(t=>`<small class="finish-objection">${esc(t)}</small>`).join("")}</td></tr>`).join("")}</tbody></table>`:"<p class=\"dim\">The backstage negotiation has locked the finish. You can still revise the called spots.</p>"}${preparation}</section>`:"";
 const board=v.board?`<div class="decide2 runorder finish-spots">${routePicker}<div class="rorder-heading"><b>${st.structurePlanning?"2 Dramatic objectives":"2 Called spots"}</b></div><table class="grid spots-table${metric?" has-metric":""}"><thead><tr><th scope="col">Spot</th><th scope="col">Leads</th><th scope="col">Called move</th>${metric?`<th scope="col">${esc(metric.unit)}</th>`:""}</tr></thead><tbody>${v.board.map((r,i)=>`<tr><td>${i+1} ${esc(r.name)}</td><td>${r.actor==="w"?esc(w.short):r.actor==="f"?esc(f.short):"Either"}</td><td><button class="spot-select" data-spot-toggle="${i}" aria-expanded="false" aria-controls="spot-options-${i}">${esc(r.current||"Leave open")} ▾</button></td>${metric?`<td>${r.contribution?`<b class="good">+${r.contribution}</b>`:"0"}</td>`:""}</tr><tr class="spot-expanded" id="spot-options-${i}" hidden><td colspan="${metric?4:3}"><div class="spot-options">${r.cards.map(card=>`<button class="btn ${card.selected?"on":""}" data-room="${esc(card.id)}" aria-pressed="${card.selected}">${esc(card.id.endsWith("_open")?"Leave open":card.label+" · "+card.who)}${card.contribution?" · +"+card.contribution+" "+esc(metric?.unit||"setup"):""}${card.risk?" · High risk":""}${card.impossible?" · Will not work":""}${(card.tags||[]).filter(t=>!/suggestion|risk|not work|finish setup|support the finish|No named move/i.test(t)).map(t=>" · "+esc(t)).join("")}</button>`).join("")}</div></td></tr>`).join("")}<tr class="finish-fixed"><td>${v.board.length+1} The finish</td><td>${esc(c.finish.startsWith("win")?w.short:f.short)}</td><td>Set by the finish above</td>${metric?"<td>–</td>":""}</tr></tbody></table><p class="rorder-verdict ${verdictBad?"bad":"good"}"><b>${esc(OfficeRoom.AGENT)}:</b> ${esc(v.story.verdict)}</p></div>`:"";
 const review=v.review?`<div class="decide2 runorder finish-review">
   <h3 class="section-h">Review the match</h3>
   <p class="lede">The conversations are over. Check what they changed before the wrestlers go out.</p>
   <section class="finish-choice"><div class="rorder-heading"><b>Agreed finish</b><span>${esc(v.finishPlan?.label||'Not chosen')}</span></div>
    ${finishReadout}</section>
   ${professionalNote?'<p class="structure-conversation"><b>Previous working experience:</b> '+esc(professionalNote)+'</p>':''}
   <p class="rorder-verdict ${verdictBad?'bad':'good'}"><b>${esc(OfficeRoom.AGENT)}:</b> ${esc(v.story.verdict)}</p>
   <div class="review-actions"><button class="btn" data-room="review_edit">${st.structurePlanning?'Revise the objectives':'Revise the called spots'}</button>
    <button class="btn go" data-room="review_ok">Sign this layout</button></div>
  </div>`:'';
 const decide=board||review||(v.stage==='done'?`<div class="decide2"><h3 class="section-h">Signed</h3><p class="lede">What is in the match layout is what they will try to do. Whether they manage it is another matter.</p>${arcPicker(c)}${rivalNote(c)}${cornerPicker(c,w,f)}</div>`:
  `<div class="decide2"><h3 class="section-h">${esc(v.title)}</h3><p class="lede">${esc(v.ask)}</p>${deskTable(v.options,'room',w,f,p)}</div>`);
 const descriptions={traditional:'Start strong, take the pressure, fight back and reach the finish.',
  classic_american:'Guided opening, pressure, comeback and payoff.',
  kings_road:'Technical exchanges, escalation, callback and finish build.',
  chickenshit_heel:'Avoid, get exposed, use a shortcut, then survive.',
  dominant_ace:'Take control, absorb a challenge and reassert dominance.'};
 const selected=P.structureChoice?.id||'traditional';
 const variants=[{id:'traditional',label:'Traditional'},...OfficeSheets.STRUCTURES.catalogue()];
 // Choose BEFORE the first backstage decision. The meeting is re-created
 // only while still at its initial plan stage, never after a signed decision.
 const structurePicked=P.structureSelected===true||!!P.structureChoice||v.stage!=='plan';
 const structureCards='<div class="structure-options" role="group" aria-label="Choose match structure">'+variants.map(x=>'<button class="structure-option'+(structurePicked&&x.id===selected?' on':'')+'" data-structure="'+esc(x.id)+'" aria-pressed="'+(structurePicked&&x.id===selected)+'"><b>'+esc(x.label)+'</b><small>'+esc(descriptions[x.id])+'</small>'+momentumShape(x.id)+'<span class="shape-axis">Opening <span>Finish</span></span></button>').join('')+'</div>';
 const chooser=v.stage==='plan'?'<section class="structure-chooser'+(structurePicked?' structure-picked':'')+'" aria-label="Shape the match">'+
  (structurePicked?'<details class="structure-change"><summary>Structure: <b>'+esc(variants.find(x=>x.id===selected)?.label||selected)+'</b> · Change</summary>'+structureCards+'</details>':'<h3 class="section-h">Shape the match</h3><p class="dim">Choose the match structure before discussing the plan.</p>'+structureCards)+
  (P.structureChoice?'<div class="structure-lead"><span>Dramatic lead (not the booked winner)</span><div role="group" aria-label="Which wrestler leads the structure?">'+[{id:'w',name:w.short},{id:'f',name:f.short}].map(x=>'<button class="btn'+(P.structureChoice.lead===x.id?' on':'')+'" data-structurelead="'+x.id+'" aria-pressed="'+(P.structureChoice.lead===x.id)+'">'+esc(x.name)+'</button>').join('')+'</div></div>':'')+
  (!structurePicked?'<p class="dim structure-help">The promoter’s booked result stays fixed. The structure guides the action; specific moves depend on what happens in the ring.</p>':'')+'</section>':'';
 const decisionWithStructure=chooser?'<div class="decide2">'+chooser+(structurePicked?decide.slice('<div class="decide2">'.length,-6):'<p class="lede" role="status">Pick a structure to start the backstage discussion.</p>')+'</div>':decide;
 const sheet=matchDeskSheet(st,v,c,w,f,p,selected,structurePicked,finishLine);
 const stats=x=>`<span class="match-attributes">${[['Mic',x.mic],['Psy',x.psych],['Safe',x.safe],['Ego',x.ego]].map(([label,val])=>`${label} <b class="${val>=75?'good':val<50?'bad':'warn'}">${esc(val)}</b>`).join(' · ')}</span>`;
 const lastDennis=[...v.log].reverse().find(e=>e.side==='agent');
 const conversation=v.board?'<details class="board-conversation"><summary><b>Dennis</b><span>'+esc(lastDennis?.text||'')+'</span><small>Show all ('+v.log.length+')</small></summary>'+deskTranscript(v.log,'roomTalk',w,f)+'</details>':deskTranscript(v.log,'roomTalk',w,f);
 const body=sheet.rail+'<div class="match-desk">'+sheet.sheet+'<section class="match-desk-room"><h3 class="desk-title">Backstage with '+esc(OfficeRoom.AGENT)+'</h3>'+matchupBar(c,w,f,v.board?'':'<span>v</span>',stats(w)+wNote,stats(f)+fNote)+conversation+decisionWithStructure+'</section></div>';
 const signing=window.OfficeSigning?.eligible(c);
 const nextBtn=v.board?`<button class="btn go" data-room="board_ok" ${st.structurePlanning&&v.finishPlan?.blocked?'disabled title="Resolve the highlighted planning warnings first"':''}>Agree finish and spots</button>`:v.stage!=='done'?`<span class="dim">${esc(v.title)}</span>`:signing?'<button class="btn go" data-tv="signing">To the contract signing</button>':st.sheet.skipPromo?'<button class="btn go" data-tv="bell">Ring the bell</button>':'<button class="btn go" data-tv="promos">To the microphone</button>';
 $('#tv').innerHTML=strip(c,'backstage')+'<div class="stage screen s-back s-meeting sheet-redesign'+(v.board?' board-redesign':'')+'">'+win('Backstage with '+OfficeRoom.AGENT+', your road agent',body,{h:'h3',body:'tight'})+'</div>'+
  '<div class="tv-foot"><span class="dim">'+esc(v.stage==='done'?(st.sheet.skipPromo?'No promo tonight. Straight to the ring.':'Match layout signed.'):v.board?'Spots you pick yourself stay put when the finish changes.':'Every option says what it will cost you.')+'</span>'+nextBtn+'</div>';
 scrollTalk('roomTalk',!choicePosition);
 restoreDecisionScroll('s-meeting',choicePosition);
 night.stage='meeting';persistNight();
}

function spokenMood(st,c){return (st.speaker?.short||st.w.short)+': '+c.player+' · '+st.f.short+': '+c.opponent;}
function showPromos(loadedBanks,previousPosition){
 const c=current();if(!c)return endNight();
 const choicePosition=previousPosition===undefined?(night.stage==='promo'?decisionScroll('s-promo'):null):previousPosition;
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
 if(night.plan?.sheet?.skipPromo)return bell();
 // Before anything is said: what kind of segment is it? A duel saved before segments existed stays a duel.
 const SG=window.OfficeSegments;
 if(SG&&night.segment?.cid!==c.id){
  if(night.promo?.cid===c.id&&night.promo.v===5)night.segment={cid:c.id,type:'duel'};
  else return showSegmentPick(c,w,f,p);
 }
 if(SG&&night.segment.type!=='duel')return showSegment();
 // v0.3.25 Before the first line: does somebody else do the talking?
 const MP=window.OfficeMouthpiece,talkers=MP&&(!night.promo||night.promo.cid!==c.id)?MP.candidates(c,w):[];
 if(talkers.length&&night.mouth?.cid!==c.id)return showMouthpiece(c,w,f,p,talkers);
 const newPromo=!night.promo||night.promo.cid!==c.id||night.promo.v!==5;
 const mouth=newPromo&&night.mouth?.cid===c.id&&night.mouth.id!=='none'?MP?.pick(c,w,night.mouth.id):null;
 const existing=night.promo?.authoredDialogue,needsBanks=newPromo||existing&&!Array.isArray(existing.banks)&&night.promo.stage!=='done';
 if(needsBanks&&loadedBanks===undefined){
  const n=night,cid=c.id;
  const loader=window.OfficePromoBanks,token=loader.beginSceneLoad(n,cid);if(!token)return;
  persistNight();
  $('#tv').innerHTML=strip(c,'microphone time')+'<div class="stage screen s-back"><p role="status">Preparing the microphone…</p></div>';
  const bid=x=>window.OfficePromoIdentity?.bankId?.(x)||x?.id;
  const ids=newPromo?[bid(mouth||w),bid(f)]:[bid(night.promo.speaker||w),bid(f)];
  Promise.resolve(window.OfficePromoBanks?.load(ids)||[]).catch(()=>[]).then(banks=>{
   if(loader.completeSceneLoad(n,token,()=>night===n&&current()?.id===cid))showPromos(banks,choicePosition);
  });return;
 }
 if(!newPromo&&needsBanks&&existing)existing.banks=loadedBanks||[];
 if(newPromo){
  const arc=window.OfficeProgrammeArcs?.intro(c,night.plan?.arcChoice);
  night.promo=OfficeMic.begin(c,w,f,G.feud(w.id,f.id),night.plan?.sheet,p,{mouth,mouthProfile:mouth?G.W(mouth.id):null,arc,directed:true,formats:true,dialogue:true,authored:true,banks:loadedBanks||[],composition:true,semantic:true,fuzzy:true,fuzzyEmotion:true,fuzzyPacing:true,fuzzyAudience:true,fuzzyBalance:true});
  // v0.3.12 The interviewer asks about what the crowd saw: the rivalry's public record. A backstage
  // memory (recalled.promoPrompt) stays backstage; it is no longer read out on air.
  const intro=window.OfficeRivalry?.introFor(night.promo.core);
  if(intro&&night.promo.openingQuestion){
   // Ask one question, not two unrelated ones. The recorded dispute takes priority.
   night.promo.log[0].line=intro;night.promo.openingQuestion={...night.promo.openingQuestion,kind:'record',prompt:intro};
  }else if(intro)night.promo.log[0].line=night.promo.director?.format?night.promo.log[0].line+' '+intro:arc?arc.prompt+' '+intro:intro;
 }
 const st=night.promo,v=OfficeMic.view(st);night.stage='promo';
 const quote=t=>/^[“"]/.test(t)?t:'“'+t+'”';
 const entries=v.log.map(e=>({who:e.speaker,side:e.side==='host'?'host':e.side==='crowd'||e.side==='stage'?'c':e.side,text:e.side==='w'||e.side==='f'||e.side==='host'?quote(e.line):e.line,kind:e.kind,swing:e.swing}));
 const m=v.meter,pct=Math.abs(m);
 const meter=`<div class="tug" role="img" aria-label="Crowd: ${esc(v.meterWord)}"><div class="half you"><i style="width:${m>0?pct*2:0}%"></i></div><div class="half them"><i style="width:${m<0?pct*2:0}%"></i></div></div><span class="tugword ${m>=8?'good':m<=-8?'bad':''}">${esc(v.meterWord)}</span>`;
 const claim=v.claim&&v.stage!=='done'?`<p class="dim claim"><b>Your argument:</b> ${esc(v.claim.thesis)} <span>On record: ${esc(v.claim.evidence)}</span></p>`:
  v.record?.length&&v.stage!=='done'?`<p class="dim claim"><b>On the record between them</b>${v.record.map(x=>`<span>${esc(x)}</span>`).join('')}</p>`:'';
 const open=v.unresolved&&v.stage!=='done'?`<p class="mic-open"><b>Unsettled</b> ${esc(v.unresolved)}</p>`:'';
 // Dennis's read of the night before the first line, and the opponent's angle before the answer.
 const read=v.read?`<div class="mic-read"><b>${esc(OfficeRoom.AGENT)}’s read</b>${v.read.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:'';
 const cue=v.cue?`<p class="mic-cue">${esc(v.cue)}</p>`:'';
 const conversation=v.conversation&&v.stage!=='done'&&v.conversation.subject?`<p class="dim claim"><b>Subject:</b> ${esc(v.conversation.subject)} · ${esc(spokenMood(st,v.conversation))}${v.conversation.latestPoint?`<span>Latest point: ${esc(v.conversation.latestPoint)}</span>`:''}</p>`:'';
 const reconciliation=v.stage==='done'?OfficeRoom.promoReconciliation(night.plan?.sheet,v.result,w,f,c.finish):null;
 const decide=v.stage==='done'?`<div class="decide2"><h3 class="section-h">The final word</h3><p class="lede"><b>${esc(v.result.reaction)}</b> ${esc(v.result.tactic?.stake||'')}</p>${reconciliation?`<p class="dim"><b>Dennis — ${esc(reconciliation.status)}:</b> ${esc(reconciliation.reason)}</p>`:''}</div>`:
  `<div class="decide2"><h3 class="section-h">${esc(v.name)} ${v.conversation?'':`<small>${v.round+1} of ${v.total}</small>`}</h3><p class="lede">${esc(v.help)}</p>${deskTable(v.options,'mic',w,f,p)}</div>`;
 const sp=st.speaker?G.W(st.speaker.id)||w:w;
 const context=(st.speaker?`<p class="dim mouth-note">${esc(st.speaker.short)} is doing the talking for ${esc(w.short)}.</p>`:'')+read+cue+open+conversation+claim;
 const body=crowdBroadcast(v,w,f)+'<div class="promo-conversation">'+deskTranscript(entries,'micTalk',sp,f)+(context?'<section class="promo-context paper" aria-label="Promo context" tabindex="0"><h3 class="desk-context-title">Dennis’s read</h3>'+context+'</section>':'')+'</div>'+decide;
 $('#tv').innerHTML=strip(c,'microphone time')+'<div class="stage screen s-back s-promo broadcast-redesign">'+win((v.conversation?.formatName||'The promo')+': '+w.short+' against '+f.short,body,{h:'h3',body:'tight'})+'</div>'+
  `<div class="tv-foot"><span class="dim">${esc(v.stage==='done'?'It is said.':'Once it is out of your mouth, it stays said.')}</span>${v.stage==='done'?'<button class="btn go" data-tv="bell">Ring the bell</button>':`<span class="dim">${esc(v.name)}</span>`}</div>`;
 scrollTalk('micTalk',!choicePosition);
 restoreDecisionScroll('s-promo',choicePosition);
 persistNight();
}
// Where both wrestlers sit on this promoter's card pyramid, so the commentary can talk about it.
function ladderFor(pid,wid,fid){
 try{
  const div=D.divisionOf(fid),r=OfficeTerritory.promotionRank(pid,div),holder=OfficeTerritory.title(pid,div)?.holder,c=current();
  const at=id=>{const i=r.findIndex(x=>x.id===id);return i<0?null:{rank:i+1,slot:r[i].slot,stable:r[i].stable||null}};
  return {size:r.length,w:at(wid),f:at(fid),champ:holder===wid?'w':holder===fid?'f':null,
   champName:G.P(pid)?.name+' '+D.DIVISIONS[div].name+' Champion',belt:c?.title?D.belt(c.title.pid,c.title.div)?.name:null};
 }catch(e){return null}
}
function bell(){
 const c=current(),w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid),P=night.plan;
 const trainingFatigue=w.training==='rest'?0:w.training==='promo'?0:w.program?.type==='camp'?8:w.intensity==='hard'?15:w.intensity==='standard'?5:0;
 const preparation={...w.prep};const focus=D.TRAINING[w.training]?.stat;
 if(focus&&!w.injury){preparation[focus]=(preparation[focus]||0)+(w.intensity==='hard'?2:w.intensity==='standard'?1.5:.6);}
 const signed=window.OfficeSigning&&night.signing?.cid===c.id?OfficeSigning.result(night.signing):null;
 const segRes=window.OfficeSegments&&night.segment?.cid===c.id&&night.segment.type!=='duel'&&night.seg?.cid===c.id?OfficeSegments.result(night.seg):null;
 const promoRes=signed||segRes||(P.sheet?.skipPromo?null:night.promo?.v>=4?OfficeMic.result(night.promo):night.promo?.v===2?OfficeStory.Graph.result(night.promo):null);
 if(window.OfficeProgrammeArcs)OfficeProgrammeArcs.prepare(c,P.arcChoice,promoRes);
 const matchSheet=P.sheet?.signed?(window.OfficeRingside?OfficeRingside.attach(OfficeRoom.addVow(P.sheet,promoRes,w,f,c.finish),c,P.corner):OfficeRoom.addVow(P.sheet,promoRes,w,f,c.finish)):null;
 // Verify the signed plan AFTER vow and ringside additions. Refuse a stale
 // or imported mismatch rather than activating the wrong dramatic layout.
 let structureExecution;
 try{structureExecution=OfficeSheets.STRUCTURES.executionChoice(matchSheet,P.structureChoice);}
 catch(err){console.warn('Match structure refused',err);toast('Signed structure mismatch. Review the backstage layout.');return showMeeting();}
 night.M=Mx.create({w:{...w,fatigue:G.clamp(w.fatigue+trainingFatigue)},f,p,ladder:ladderFor(p.id,w.id,f.id),slot:c.slot,minutes:P.sheet?.minutes||c.minutes,finish:c.finish,stip:c.stip||null,feudHeat:Math.max(c.feudHeat||0,G.feud(w.id,f.id)?.heat||0),blowoff:c.blowoff,promo:promoRes,plan:{game:P.game,leash:P.leash,talk:P.talk},preparation,flags:{...w.flags,...(P.sheet?.flags||{})},memory:OfficeMemory.context(w.id,f.id),sheet:matchSheet,livePsychologyVersion:structureExecution?1:undefined,sequenceTimingVersion:structureExecution?1:undefined,sequenceDependencyVersion:structureExecution?1:undefined,sequenceHandoverVersion:structureExecution?1:undefined,sequenceRecoveryProjectionVersion:structureExecution?1:undefined,sequenceRecoveryPacingVersion:structureExecution?1:undefined,sequenceAlternativeReadinessVersion:structureExecution?1:undefined,bigSpotArbitrationVersion:3,structureExecution,identity:G.normaliseIdentity(S().identity),seed:Math.floor(Math.random()*2**31)});
 if(window.OfficeRivalCorner)OfficeRivalCorner.attach(night.M,c);
 night.past=[];night.paused=false;commentaryView='all';
 const callBtns=Object.entries(Mx.CALLS).map(([k,o],i)=>`<button class="btn call" data-call="${k}" data-hint="${esc(o.hint)}"><kbd>${i+1}</kbd>${esc(o.name)}</button>`).join('');
 const livePlan=`<details class="ringside-plan" aria-label="Match instructions" open>
   <summary class="section-h">Agreed before the bell</summary>
   <dl><div><dt>Booked finish</dt><dd>${esc(D.FINISHES[c.finish]?.name||'Booked finish')}</dd></div>
   <div><dt>Game plan</dt><dd>${esc(D.PLANS[P.game]?.name||'Set backstage')}</dd></div>
   ${structureExecution?'<div><dt>Structure</dt><dd>'+esc(OfficeSheets.STRUCTURES.catalogue().find(s=>s.id===P.structureChoice.id)?.label||P.structureChoice.id)+' · '+esc(P.structureChoice.lead==='w'?w.short:f.short)+' leads</dd></div>':''}
   <div><dt>Running order</dt><dd>${Mx.structureReport(night.M)?'Four objectives tracked live':P.sheet?.signed?'Agreed beats tracked live':P.leash==='free'?'Called in the ring':'No signed running order'}</dd></div></dl>
   <p>Plans are instructions, not guaranteed results. Watch the match layout and calls as the bout unfolds.</p>
  </details>`;
 const bench=`<div class="ringside-status"><div class="gauge"><label>Atmosphere <b id="lCrowd">0</b></label><div class="gbar" role="progressbar" aria-label="Atmosphere" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="lCrowdBar"></i></div></div><div class="gauge"><label>Layout progress <b id="lSheet">–</b></label></div></div><div class="ringside-command"><div class="callsleft">Calls left <span id="lCalls">●●●</span></div><div class="calls">${callBtns}</div><div class="callhint well" id="lHint">Your calls go to the wrestler. They don’t always listen.</div></div><h3 class="section-h">Commentary speed</h3><div class="speed" role="group" aria-label="Commentary speed"><button class="btn" data-pause>Pause</button>${['slow','normal','fast','skip'].map(s=>`<button class="btn" data-speed="${s}" aria-pressed="${night.speed===s}">${{slow:'Slow',normal:'Normal',fast:'Fast',skip:'To the end'}[s]}</button>`).join('')}</div>${livePlan}`;
 $('#tv').innerHTML=`${strip(c)}<header class="score"><div class="side you">${face('wrestler',w.id,w.name,'portrait x2')}<h2>${esc(w.short)}</h2><div class="stam" id="sY" role="progressbar" aria-label="${esc(w.short)} stamina" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div></div><div class="mid"><div class="live-stars" id="lStars" aria-label="Live rating">–</div><div class="clock" id="lClock">00:00</div><div class="phase" id="lPhase">Entrances</div></div><div class="side them">${face('wrestler',f.id,f.name,'portrait x2')}<h2>${esc(f.short)}</h2><div class="stam" id="sT" role="progressbar" aria-label="${esc(f.short)} stamina" aria-valuemin="0" aria-valuemax="100" aria-valuenow="92"><i></i></div></div></header><div class="mom" role="meter" aria-label="Momentum: positive favours ${esc(w.short)}, negative favours ${esc(f.short)}" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0"><i id="lMom" style="width:50%"></i></div><div class="plan-strip" id="lPlan" hidden></div>
 <div class="stage screen s-live">${win('Live commentary',`<div class="feed well"><div class="sr" id="lAnnounce" role="status"></div><div class="now" id="lNow"><span class="t"></span><span class="tx"></span></div><div class="commentary-views" role="group" aria-label="Commentary history">
   <span>Commentary archive</span><button data-commentary-view="all" aria-pressed="true">All lines</button><button data-commentary-view="key" aria-pressed="false">Key moments</button>
   </div><ol class="past" id="lPast" aria-label="Earlier commentary"></ol></div>`,{h:'h3',cls:'quiet',body:'tight',note:`${esc(w.short)} on top: gold bar`})}${win('Ringside',bench,{h:'h3'})}</div><div class="decision" id="decision" hidden></div>`;
 night.stage='live';updateLive();persistNight();schedule(300);
}
function schedule(ms){clearTimeout(night.timer);night.timer=setTimeout(pump,ms)}
function pump(){
 const M=night?.M;if(!M)return;
 // Completed bouts never require Resume just to reveal their result.
 if(M.done)return result();
 if(night.paused)return;
 if(M.decision&&!M.queue.length)return showDecision();
 if(night.speed==='skip'){let line,n=0,got=0;while(n++<4000){if(M.decision&&!M.queue.length)break;line=Mx.next(M);if(!line)break;night.past.unshift(line);got++}
  if(got)showLine(night.past.shift(),true);updateLive();if(M.decision)return showDecision();if(M.done){clearTimeout(night.timer);night.timer=setTimeout(()=>{if(night?.M===M)result()},900);return}return schedule(10)}
 const line=Mx.next(M);
 if(!line){if(M.done)return result();if(M.decision)return showDecision();return schedule(50)}
 showLine(line);updateLive();
 if(M.decision&&!M.queue.length){return schedule(SPEED[night.speed].line*.6+300)}
 const sp=SPEED[night.speed];schedule(sp.line+(line.pause||0)*sp.pause);
}
function renderPastCommentary(){
 const box=$('#lPast');if(!box||!night)return;
 const lines=commentaryView==='key'?night.past.filter(l=>l.big||['crowd','bad','alert','rating','you'].includes(l.kind)):night.past;
 box.innerHTML=lines.map(l=>`<li class="${l.kind} ${l.big?'big':''}${voiceCls(l)}"><span class="t">${esc(l.t)}</span><span>${voiceTag(l)}${esc(l.text)}</span></li>`).join('');
 if(!lines.length&&commentaryView==='key')box.innerHTML='<li class="commentary-empty">No key moments yet. The current call remains visible above.</li>';
 document.querySelectorAll('[data-commentary-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.commentaryView===commentaryView)));
}
function showLine(line,quiet){
 const now=$('#lNow');if(!now)return;
 const prev=now.dataset.line?JSON.parse(now.dataset.line):null;
 if(prev&&!quiet)night.past.unshift(prev);
 now.className='now '+line.kind+(line.big?' big':'')+voiceCls(line);now.dataset.line=JSON.stringify(line);
 now.innerHTML=`<span class="t">${esc(line.t)}</span>${voiceFace(line)}<span class="tx">${booth(line)?`<small class="spk">${esc(booth(line).name)}</small>`:''}${esc(line.text)}</span>`;
 // Screen readers hear only the big moments, not every commentary line.
 if(line.big&&!quiet){const a=$('#lAnnounce');if(a)a.textContent=line.text}
 night.past=night.past.filter(x=>x.kind!=='count'||x.text.length>8).slice(0,40);
 renderPastCommentary();persistNight();
}
const STRUCTURE_PHASE_NAME={
 opening_advantage:'Opening advantage',pressure:'Pressure',comeback:'Comeback',payoff:'Payoff',
 technical_exchange:'Technical exchange',escalation:'Escalation',callback:'Callback',finish_build:'Finish build',
 evasion:'Evasion',exposure:'Opponent answers',shortcut:'Unfair advantage',escape:'Survival',
 dominance:'Ace controls',challenge:'Challenger rally',reassertion:'Ace responds'
};
function updateLive(){
 const M=night.M;if(!$('#lClock'))return;
 const structure=Mx.structureReport(M);
 $('#lClock').textContent=Mx.fmt(M.t)+' / '+Mx.fmt(M.len);
 const intent=structure&&OfficeSheets.DIRECTOR.current(M)?.objective?.intent;
 $('#lPhase').textContent=structure&&M.stage==='live'?
  (STRUCTURE_PHASE_NAME[intent]||'Agreed finish'):Mx.phaseName(M);
 $('#lStars').textContent=M.qN?starsText(Mx.liveStars(M))||'DUD':'–';
 $('#lCrowd').textContent=Math.round(M.crowd);$('#lCrowdBar').style.width=M.crowd+'%';$('#lCrowdBar').parentElement.setAttribute('aria-valuenow',Math.round(M.crowd));
 $('#lMom').style.width=(50+M.mom/2)+'%';$('#lMom').parentElement.setAttribute('aria-valuenow',Math.round(M.mom));
 const y=$('#sY'),t=$('#sT');y.querySelector('i').style.width=M.wSt+'%';t.querySelector('i').style.width=M.fSt+'%';y.setAttribute('aria-valuenow',Math.round(M.wSt));t.setAttribute('aria-valuenow',Math.round(M.fSt));y.classList.toggle('low',M.wSt<30);t.classList.toggle('low',M.fSt<30);
 $('#lSheet').textContent=structure?structure.objectives.filter(o=>['achieved','adapted'].includes(o.status)).length+'/'+structure.objectives.length+' objectives':M.sheet?.signed?M.sheet.nodes.filter(b=>b.status==='achieved'||b.status==='adapted').length+'/'+M.sheet.nodes.length+' beats':M.leash==='free'?'Called live':M.offScript?(M.offScript==='showboat'?'Showboating':'Audibles'):'On the layout';$('#lSheet').className=M.offScript?'warnv':'';
 updateStrip(M);
 $('#lCalls').textContent='●'.repeat(M.calls)+'○'.repeat(3-M.calls);
 document.querySelectorAll('[data-call]').forEach(b=>{
  b.disabled=!Mx.canCall(M,b.dataset.call);
  if(b.dataset.call==='big'){
   const pending=!!M.bigSpotRequest;
   b.classList.toggle('pending',pending);
   b.setAttribute('aria-label',pending?
    'Big spot queued. Waiting for a legal opening.':'Hit the big spot');
   if(b.lastChild?.nodeType===3)b.lastChild.textContent=pending?'Big spot queued':'Hit the big spot';
  }
 });
 if(M.bigSpotRequest&&$('#lHint'))
  $('#lHint').textContent='Big spot queued: the wrestlers are looking for a legal opening. If none arrives, the call is returned.';
 const pb=document.querySelector('[data-pause]');if(pb){pb.textContent=M.done?'See the result':night.paused?'Resume':'Pause';pb.setAttribute('aria-pressed',night.paused);pb.disabled=false}
 if(M.done&&night.paused){result();return}
}
// The running order along the match clock. Two lanes so neighbouring beats never sit on top of each other.
const STRIP_SHORT={Shine:'Shine',Heat:'Heat',Comeback:'Back','Big spot':'Spot',Finish:'Fin',Vow:'Vow'};
const STRIP_ICON={achieved:'✓',adapted:'↻',missed:'✗',due:'▸'};
function stripInner(m){
 const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
 return `<div class="ps-track">${[...new Set(m.beats.map(b=>b.lane))].sort().map(l=>`<div class="ps-lane${l===2?' vow-lane':''}">${m.beats.filter(b=>b.lane===l).map(b=>
  `<div class="ps-beat s-${b.state} own-${b.owner}${b.vow?' vow':''}" style="left:${b.start}%;width:${b.width}%" title="${esc(b.title)}" role="img" aria-label="${esc(b.title)}"><b>${STRIP_ICON[b.state]?STRIP_ICON[b.state]+' ':''}<span class="ps-full">${esc(b.slot)}</span><span class="ps-short">${esc(STRIP_SHORT[b.slot]||b.slot)}</span></b><span>${esc(cap(b.move))}</span>${b.mark!=null?`<em class="ps-mark" style="left:${b.mark}%"></em>`:''}</div>`).join('')}</div>`).join('')}${m.head!=null?`<i class="ps-head" style="left:${m.head}%"></i>`:''}</div>`;
}
// Signed structure objectives use their real timing and actual performed
// events; do not present an American shine/heat/comeback for King's Road.
function structureStrip(M,{final=false}={}){
 const report=Mx.structureReport(M),plan=M.sheet?.structurePlan?.objectives;
 if(!report||!Array.isArray(plan))return null;
 const frac=Math.min(1,M.t/Math.max(1,M.len));
 return {head:final?100:Math.round(frac*100),beats:plan.map((o,i)=>{
  const state=report.objectives[i],first=state.evidence.find(e=>e.at===state.at),
    progress=first?.progress??null,window=o.window;
  return {lane:i%2,start:window[0]*100,width:(window[1]-window[0])*100,
   owner:o.actor,slot:o.title,short:['Open','Answer','Build','Finish'][i],
   title:o.title+(o.call?' · called: '+o.call.label:' · called in the ring'),
   move:o.call?.label||'Called live',
   state:state.status==='pending'&&frac>=window[0]?'due':state.status,
   mark:progress==null?null:Math.max(0,Math.min(100,(progress-window[0])/Math.max(.001,window[1]-window[0])*100))};
 })};
}
function stripKey(m){return m?JSON.stringify(m.beats.map(b=>[b.state,b.mark])):''}
function updateStrip(M){
 const ps=$('#lPlan');if(!ps)return;
 const m=structureStrip(M)||OfficeSheets.strip(M);ps.hidden=!m;if(!m)return;
 const key=stripKey(m);
 if(ps.dataset.key!==key){ps.innerHTML=stripInner(m);ps.dataset.key=key;}
 const h=ps.querySelector('.ps-head');if(h)h.style.left=m.head+'%';
}
function showDecision(){
 const d=night.M.decision,box=$('#decision');if(!d||!box)return;
 box.innerHTML=`<div class="win" role="alertdialog" aria-labelledby="dTitle"><header class="tbar"><h3>Decision at ${esc(Mx.fmt(night.M.t))}</h3></header><div class="wbody"><h2 id="dTitle">${esc(d.title)}</h2><p>${esc(d.body)}</p><div class="opts">${d.options.map(o=>`<button class="choice" data-decide="${o.id}"><b>${esc(o.label)}</b><span>${esc(o.hint)}</span></button>`).join('')}</div></div></div>`;
 box.hidden=false;box.querySelector('button')?.focus();
}
function decideNow(id){const M=night.M;Mx.resolve(M,id);persistNight();$('#decision').hidden=true;if(night.speed==='skip')night.speed='normal',document.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.speed===night.speed));updateLive();schedule(400)}
function doCall(id){const M=night.M;if(!Mx.canCall(M,id))return;Mx.call(M,id);persistNight();updateLive();if(!night.paused)schedule(250);else{const l=Mx.next(M);if(l)showLine(l)}}
function result(){
 if(!night?.M||!current()||night.settling)return;
 clearTimeout(night.timer);const M=night.M,c=current(),w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
 const fin={...M.final,log:M.log.map(({t,text,kind,big,who,actionId})=>({t,text,kind,big,who,...(actionId?{actionId}:{})}))};
 // The post-bell angle is chosen in the segment itself, after the result. A night saved by an
 // older version may still carry one agreed in the meeting; that plan keeps first call on the scene.
 let settled;
 night.settling=true;
 try{settled=G.atomicSettlement(()=>{
 if(night.plan?.after)c.afterPlan=night.plan.after;
 const cons=G.applyResult(c,fin);
 if(window.OfficeRingside)cons.push(...OfficeRingside.settle(c,M));
 if(window.OfficeRivalCorner)cons.push(...OfficeRivalCorner.settle(c,M));
 const structureReport=Mx.structureReport(M),structurePlan=structureReport?M.sheet?.structurePlan?.objectives:null;
 const sheetReport=OfficeSheets.report(M),finalStrip=structureReport?structureStrip(M,{final:true}):OfficeSheets.strip(M,{final:true});
 if(sheetReport){
  const h=S().history.find(x=>x.cid===c.id);
  if(h){h.sheet=sheetReport;if(structureReport){h.structure=JSON.parse(JSON.stringify(structureReport));
   if(fin.structureAssessment)h.structureAssessment=JSON.parse(JSON.stringify(fin.structureAssessment));}}
  if(structureReport){
   const success=structureReport.objectives.filter(o=>['achieved','adapted'].includes(o.status)).length;
   cons.push({text:'Dramatic structure: '+success+' of '+structureReport.objectives.length+' objectives witnessed in the ring.',tone:0});
   // No five-beat chemistry reward for a four-objective structure.
  }else{
   cons.push({text:'Match layout: '+sheetReport.achieved+' performed, '+sheetReport.adapted+' adapted, '+sheetReport.missed+' missed.',tone:sheetReport.missed>2?-1:1});
   if(sheetReport.achieved>=3&&sheetReport.missed===0&&fin.stars>=3.5)
    OfficeMemory.remember(w.id,'chemistry',w.short+' remembers how well the agreed match with '+f.short+' came together.',f.id,3,4,c.id+':chemistry');
   if(sheetReport.missed>=3)OfficeMemory.remember(w.id,'sheet_changes',w.short+' remembers how far the match departed from the agreed match layout against '+f.short+'.',f.id,-2,0,c.id+':sheet');
  }
  G.save();
 }
 const baseConsequences=cons.map(x=>x.text);
 // Every outer result wrapper and ringside consequence is preserved in the replay archive.
 const h=S().history.find(x=>x.cid===c.id);
 if(h){
  h.stip=c.stip||null;
  h.consequences=cons.map(x=>({text:x.text,tone:x.tone??0}));
  h.notes??=[];
  for(const effect of h.consequences)if(!h.notes.includes(effect.text))h.notes.push(effect.text);
  G.save();
 }
 const matchResult={name:w.name,foe:f.name,stars:fin.stars,cid:c.id,wid:w.id,rid:f.id,pid:p.id,season:S().season,week:S().week,actualOutcome:fin.outcome,bookedFinish:c.finish,baseConsequences,consequences:baseConsequences.slice()};
 // Select any autonomous event now. A routine result still has an optional segment.
 let after=null;
 const afterReady=window.OfficeAfter?{c:{id:c.id,wid:c.wid,rid:c.rid,pid:c.pid,slot:c.slot,finish:c.finish,...(c.programme?{programme:{id:c.programme.id,step:c.programme.step}}:{})},fin:OfficeAfter.capture(fin,S().history.find(h=>h.cid===c.id)),...(c.afterPlan?{plan:c.afterPlan}:{})}:null;
 if(afterReady){const {c,fin,plan}=afterReady;after=OfficeAfter.prepareAutonomous(c,fin,plan);}
 return {cons,structureReport,structurePlan,sheetReport,finalStrip,matchResult,after,afterReady};
 });}catch(error){console.error('Match settlement rolled back',error);toast('Match settlement failed. No consequences were applied. Retry the result.');return;}finally{night.settling=false;}
 const {cons,structureReport,structurePlan,sheetReport,finalStrip,matchResult,after,afterReady}=settled;
 night.results.push(matchResult);night.after=null;night.after=after;night.afterReady=window.OfficeAfter?afterReady:null;
 const requiredAfter=!!night.after?.required;
 const verdict=fin.stars>=4.5?'An all-timer.':fin.stars>=4?'People will talk about that one.':fin.stars>=3?'A good night’s work.':fin.stars>=2?'Solid enough.':fin.stars>=1?'Forgettable.':'A disaster.';
 const pct=structureReport?structureReport.objectives.filter(o=>['achieved','adapted'].includes(o.status)).length+'/'+structureReport.objectives.length+' objectives':sheetReport?(sheetReport.achieved+sheetReport.adapted)+'/'+sheetReport.total+' beats':fin.script===null?'Called live':Math.round(fin.script*100)+'%';
 const actualFinish={booked:'Booked finish delivered',dq:'Unplanned disqualification',nc:'No contest',double:'Finish broken'}[fin.outcome]||
  'Finish: '+String(fin.outcome||'Not recorded').replace(/_/g,' ');
 const matchSummary=`<div class="result-brief" aria-label="Match outcome and plan report">
  <div><small>Booked finish</small><b>${esc(D.FINISHES[c.finish]?.name||'Not recorded')}</b></div>
  <div class="${fin.outcome==='booked'?'':'result-alert'}"><small>Actual outcome</small><b>${esc(actualFinish)}</b></div>
  <div><small>Layout performed</small><b>${esc(pct)}</b></div>
  <div><small>Calls accepted</small><b>${fin.callsUsed.length-fin.ignored} of ${fin.callsUsed.length}</b></div>
 </div>`;
 night.i++;const more=night.i<night.queue.length;
 const a=structureReport?fin.structureAssessment:null;
 const structureAssessmentHtml=a?'<section class="structure-assessment" aria-label="Three-part match structure assessment">'+
  '<h4>What was planned, what happened, and how well it worked</h4>'+
  '<div class="structure-assessment-grid">'+
   '<div><b>Plan adherence</b><strong>'+esc(a.planAdherence.namedCalls?
    a.planAdherence.witnessedCalls+' / '+a.planAdherence.namedCalls+' named moves':'No named moves promised')+'</strong>'+
    '<p>'+esc(a.planAdherence.adaptedCalls+' objectives worked with different moves; '+
     a.planAdherence.openObjectives+' deliberately left open.')+'</p></div>'+
   '<div><b>Structural coherence</b><strong>'+esc(a.structuralCoherence.witnessed+' / '+a.structuralCoherence.total+' witnessed')+'</strong>'+
    '<p>'+esc(a.structuralCoherence.achieved+' achieved, '+a.structuralCoherence.adapted+
     ' adapted, '+a.structuralCoherence.missed+' missed.')+'</p></div>'+
   '<div><b>Execution quality</b><strong>'+esc(starsText(a.executionQuality.stars)||'DUD')+'</strong>'+
    '<p>'+esc(a.executionQuality.botches+' mistakes; psychology contribution '+
     (a.executionQuality.psychologyScore>=0?'+':'')+a.executionQuality.psychologyScore.toFixed(2)+
     ' stars. No structure bonus.')+'</p></div>'+
  '</div><p class="dim">The star rating is unchanged by structural completion. A named move must be witnessed in its objective window; an achieved objective may use a different move.</p></section>':'';
 const structureHtml=structureReport?'<h3 class="section-h" style="margin-top:12px">Dramatic structure: '+esc(OfficeSheets.STRUCTURES.catalogue().find(x=>x.id===structureReport.id)?.label||structureReport.id)+'</h3>'+
  '<p class="dim">Only moves performed in the ring count. There is no automatic bonus for following a structure.</p>'+structureAssessmentHtml+
  (structureReport.sequences?.length?'<h4>Negotiated sequences</h4><div class="well"><ol class="structure-result-list">'+structureReport.sequences.map(row=>{
   const objective=structurePlan?.find(o=>o.id===row.objective),name=id=>Mx.GRAPH.A[id]?.name||id.replace(/_/g,' ');
   const planned=row.receipt?.planned||objective?.sequence?.actions||[],actual=row.receipt?.witnessed||[];
   const debrief=OfficeSheets.DIRECTOR.deliveryDebrief(row);
   return '<li><b>'+esc(objective?.title||row.objective)+'</b> · <span class="structure-status'+(debrief.tone?' s-'+esc(debrief.tone):'')+'">'+esc(debrief.label)+'</span>'+
    '<small>Agreed: '+esc(planned.map(name).join(' → ')||'Plan unavailable')+' · Witnessed: '+esc(actual.length?actual.map(e=>name(e.id)).join(' → '):'No verified landing')+'</small>'+
    '<small>'+esc(debrief.note)+'</small></li>';
  }).join('')+'</ol></div>':'')+
  (finalStrip?'<div class="plan-strip final">'+stripInner(finalStrip)+'</div>':'')+
  '<div class="well"><ol class="structure-result-list">'+structureReport.objectives.map((o,i)=>{
   const planned=structurePlan?.[i],actor=planned?.actor==='w'?w.short:f.short,
    actual=o.evidence.find(e=>e.at===o.at)||o.evidence.at(-1),
    move=actual?(Mx.GRAPH.A[actual.id]?.name||actual.id.replace(/_/g,' ')):'No qualifying move witnessed';
   return '<li><b>'+esc(planned?.title||o.id)+'</b> · <span class="structure-status s-'+esc(o.status)+'">'+esc(o.status)+'</span> · '+esc(actor)+
    '<small>Called: '+esc(planned?.call?.label||'In the ring')+' · Performed: '+esc(move)+(o.at!=null?' at '+esc(Mx.fmt(o.at)):'')+'</small></li>';
  }).join('')+'</ol></div>':'';
 const sheetHtml=structureReport?structureHtml:sheetReport?'<h3 class="section-h" style="margin-top:12px">Agreed versus performed</h3><p class="dim">'+(sheetReport.room?esc(sheetReport.room.premise):'Story: '+esc(OfficeSheets.focusOptions(c,w,f,night.plan?.game||'story').find(x=>x.id===sheetReport.focus)?.title||sheetReport.focus||'Performer-led'))+
  ' · Ringside changes: '+sheetReport.calls.length+' · Renegotiated beats: '+sheetReport.revisions.length+'</p>'+(finalStrip?'<div class="plan-strip final">'+stripInner(finalStrip)+'</div>':'')+'<div class="well"><ol style="padding-left:1.3em">'+sheetReport.beats.map(b=>'<li style="margin:4px 0"><b>'+esc(b.title.charAt(0).toUpperCase()+b.title.slice(1))+'</b> · '+esc(b.status)+'<span class="dim" style="display:block">'+esc(b.actual?beatLabel(b.actual):b.reason)+'</span>'+((b.status==='adapted'||b.rebuiltAfter?.length)&&b.actual&&b.reason?'<span class="dim" style="display:block">'+esc(b.reason)+'</span>':'')+'</li>').join('')+'</ol></div>':'';
 const story=flowReport(fin,w,f);
 const facts=`<div class="facts three"><div><small>Crowd at the bell</small><b>${fin.crowd}</b></div><div><small>Loudest</small><b>${fin.crowdPeak}</b></div><div><small>Big spots landed</small><b>${fin.spotHits}/${fin.spots}</b></div><div><small>Near falls</small><b>${fin.nearfalls}</b></div><div><small>Followed the layout</small><b>${pct}</b></div><div><small>Calls heard</small><b>${fin.callsUsed.length-fin.ignored}/${fin.callsUsed.length}</b></div></div>`;
 $('#tv').innerHTML=`<div class="strip"><b>${esc(p.name)}: full time</b><span>${esc(w.name)} v ${esc(f.name)}</span><span class="r">Match ${night.i} of ${night.queue.length}</span></div><div class="stage screen s-result"><div class="final"><div class="bigstars">${starsText(fin.stars)||'DUD'}</div><div class="verdict">${esc(verdict)}</div>${matchSummary}</div>${story?win('How the match went',story,{h:'h3',cls:'mf-win',note:`Crowd ${fin.crowdStart} at the bell · loudest ${fin.crowdPeak} · ${fin.crowd} at the finish`}):''}${win('What changed',`<h3 class="section-h">Consequences</h3><ul class="cons">${cons.map(x=>`<li class="${x.tone>0?'up':x.tone<0?'down':''}">${esc(x.text)}</li>`).join('')}</ul><h3 class="section-h">Match statistics</h3>${facts}${!story&&fin.crowdTrace?.length>2?`<h3 class="section-h" style="margin-top:12px">The crowd</h3>${crowdChart(fin.crowdTrace,M.len,finalStrip)}`:''}${sheetHtml}`,{h:'h3'})}${win('Full commentary',`<details class="result-log"><summary>Read full commentary (${fin.log.length} entries)</summary><div class="well">${logList(fin.log)}</div></details>`,{h:'h3',cls:'quiet',body:'tight'})}</div><div class="tv-foot"><span class="dim">${more?`Next up: ${esc(G.W(S().card.find(x=>x.id===night.queue[night.i])?.wid)?.name||'')}`:'That’s the night.'}</span>${requiredAfter?`<span class="foot-btns"><span class="dim">${esc(night.after.intervention?.line||'A wrestler has acted after the bell.')}</span><button class="btn go" data-tv="after">Respond after the bell</button></span>`:night.afterReady?`<span class="foot-btns"><button class="btn" data-tv="${more?'next':'done'}">${more?'Next match':'Finish show'}</button><button class="btn go" data-tv="after" title="Decide what happens after the bell, then take the microphone">After the bell</button></span>`:`<button class="btn go" data-tv="${more?'next':'done'}">${more?'Next match':'Back to the office'}</button>`}</div>`;
 night.M=null;night.plan=null;night.promo=null;night.stage='result';night.resultHTML=$('#tv').innerHTML;persistNight();
}
function syncAfterEvidence(){
 const st=night?.after;if(!st)return;
 const r=night.results?.find(x=>x.cid===st.cid),h=S().history?.find(x=>x.cid===st.cid);
 if(r)r.consequences=[...(r.baseConsequences||r.consequences||[]),...(h?.after?.effects||[])];
}
function endNight(){
 if(!night?.queue||night.settling||night.i<night.queue.length||S().after?.autonomous)return;
 if((night.period??night.before?.abs??G.abs())!==G.abs())return;
 const res=night?.results||[],before=night?.before||null,speed=night?.speed||'normal';
 night.settling=true;
 // Weekly finance, world updates and the recap form one career commit.
 try{G.atomicSettlement(()=>{
  G.endWeek();
  if(res.length)G.msg(OfficeNightReport.build(before,S(),res.map(r=>({...r,label:starsText(r.stars)||'DUD'}))));
 });}catch(error){console.error('Weekly settlement rolled back',error);toast('Week settlement failed. Nothing was charged. Retry Finish show.');return;}finally{night.settling=false;}
 clearTimeout(night?.timer);$('#tv').hidden=true;$('#tv').innerHTML='';document.body.style.overflow='';closeTVFocus();
 if(G.saveStatus().ok)clearNight();night={speed};
 if(S().over){render();return gameOver()}
 openMsg=null;past=[];ahead=[];route={s:'desk',id:null};render(true);toast(`Week ${S().week}. ${S().offers.length} ${plural(S().offers.length,'offer')} on the table.`);
}

/* ======================= EVENTS ======================= */
function showSaveStatus(){
 const el=$('#saveWarning'),status=G.saveStatus();
 if(el)el.hidden=status.ok!==false;
}
function startApp(screen){$('#title').hidden=true;$('#app').hidden=false;past=[];ahead=[];route={s:screen,id:null};render(true)}
document.addEventListener('click',e=>{
 if(e.target.closest('select,option'))return;
 const t=e.target.closest('button,[data-openw],[data-selo],[data-self],[data-replay],tr[data-go]');if(!t||t.disabled)return;const d=t.dataset;
 if(t.id==='continue')return proceed();
 if(d.hist)return histMove(d.hist==='back'?-1:1);
 if(d.record)return openRecord(d.record);
 if(d.rfAction){
  const field=$('#rf-page-entry');
  const value=d.rfAction==='jump'?field?.value?.trim():d.rfValue;
  if(d.rfAction==='jump'&&!/^[0-9]{3}$/.test(value||'')){
   field?.setAttribute('aria-invalid','true');field?.focus();return;
  }
  if(OfficeRingfax.press(d.rfAction==='jump'?'go':d.rfAction,value,S()))render();
  return;
 }
 if(d.identityRandom!==undefined){
  if(!$('#modal')?.classList.contains('identity-dialog'))return;
  const suggestion=G.suggestIdentity();
  const name=$('#identity-manager'),stable=$('#identity-stable');
  if(name)name.value=suggestion.manager;
  if(stable)stable.value=suggestion.stable;
  const preview=$('#identity-preview');
  if(preview)preview.innerHTML=Pt.playerPortrait(identityPortrait,suggestion.manager,'portrait x3');
  return;
 }
 if(d.identityPick!==undefined){
  if(!$('#modal')?.classList.contains('identity-dialog'))return;
  const i=Number(d.identityPick);if(!Number.isInteger(i)||i<0||i>=Pt.PLAYER_PORTRAITS.length)return;
  identityPortrait=i;
  const preview=$('#identity-preview');
  if(preview)preview.innerHTML=Pt.playerPortrait(i,$('#identity-manager')?.value||'Manager','portrait x3');
  document.querySelectorAll('[data-identity-pick]').forEach(b=>{
   const selected=Number(b.dataset.identityPick)===i;
   b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
  });
  return;
 }
 if(d.commentaryView){commentaryView=d.commentaryView==='key'?'key':'all';renderPastCommentary();return}
 if(d.trainpick){trainingSelected=d.trainpick;trainingPane='development';render();return;}
 if(d.trainpane){trainingPane=d.trainpane;render();return;}
 if(d.adviceKind){
  const method={focus:G.setTraining,intensity:G.setIntensity,session:G.setSession}[d.adviceKind];
  if(!method)return;
  const err=method(d.adviceWid,d.adviceValue);render();toast(err||'Training plan updated.');return;
 }
 if(d.go)return go(d.go,d.id||null);
 if(d.openw)return go('profile',d.openw);
 if(d.sort){const [key,k]=d.sort.split(':');const s=sorts[key];sorts[key]=s&&s.k===k?{k,d:-s.d}:{k,d:['name','style','tier'].includes(k)?1:-1};render();return}
 if(d.selo||d.self){
  if(d.selo)selOffer=d.selo;else selFree=d.self;
  if(phoneLayout())return go(d.selo?'offers':'scouting',d.selo||d.self);
  render();if(innerWidth<=900)document.querySelector('#view .screen>.win:last-child')?.scrollIntoView({behavior:'smooth',block:'start'});return;
 }
 if(d.tickmsg){inboxFilter='all';openMsg=d.tickmsg;go('inbox',phoneLayout()?openMsg:null);return}
 if(d.inboxFilter){inboxFilter=d.inboxFilter;openMsg=null;return go('inbox');}
 if(d.clearStable){stableQuery='';stableFilter='all';return render();}
 if(d.clearScout){scoutQuery='';scoutStyle='all';scoutBudget='all';selFree=null;return go('scouting');}
 if(d.clearShortlist){shortlist=[];return render();}
 if(d.shortlist){
  if(shortlist.includes(d.shortlist))shortlist=shortlist.filter(id=>id!==d.shortlist);
  else shortlist=[...shortlist.filter(id=>id!==d.shortlist),d.shortlist].slice(-2);
  return render();
 }
 if(d.msg){openMsg=d.msg;if(phoneLayout())return go('inbox',d.msg);render();return}
 if(d.answer){const out=G.answer(d.mid,d.answer);render();if(out)toast(out);return}
 if(d.checkin){renderPrivateMeeting(d.checkin);return}
 if(d.private){const r=G.checkIn(d.wid,d.private);if(r.error)return toast(r.error);$('#modal').close();render();toast(r.text);return}
 if(d.raise){const w=G.W(d.raise),v=window.OfficeAmbitions?.raiseAvailable?.(d.raise);if(v?.error)return toast(v.error);if(!w)return toast('Wrestler is no longer on your roster.');dialog('Raise '+w.short+'’s wages?',`<p>The wage rises from <b>${money(w.wage)} to ${money(w.wage+40)} per week</b>. This is a recurring cost every week, not a one-time bonus.</p><p>No instant charge. Another raise cannot be given for four weeks.</p>`,[['Keep current wage','close'],['Confirm permanent raise','raise:'+w.id,'go']]);return}
 if(d.program){const err=G.startProgram(d.wid,d.program);if(err)toast(err);else toast(d.program==='camp'?'Three-week camp booked. Unavailable for bookings until it ends.':'Development block committed.');render();return}
 if(d.cancelprogram){const err=G.cancelProgram(d.cancelprogram);if(err)toast(err);else toast('Programme ended. Weeks already paid for are not refunded.');render();return}
 if(d.hirecoach){const err=G.hireCoach(d.hirecoach);if(err)toast(err);else toast('Coach hired. Weekly salary starts now.');render();return}
 if(d.firecoach){const err=G.fireCoach();if(err)toast(err);else toast('Coach released. Salary stops.');render();return}
 if(d.sign){
  // Signing spends most of a starting bank in one go: confirm the fee and the weekly wage first.
  const s=S(),w=s.free.find(x=>x.id===d.sign);if(!w){render();return toast('Not available.')}
  dialog('Sign '+w.name+'?',`<p>Signing fee <b>${money(w.fee)}</b>, paid now. Wage <b>${money(w.wage)} a week</b>, booked or not.</p>${signingBudget(w,true)}<p class="dim">Releasing them later does not refund the fee.</p>`,[['Not yet','close'],['Sign for '+money(w.fee),'sign:'+w.id,'go']]);return;
 }
 if(d.release){const w=G.W(d.release);dialog(`Release ${w.name}?`,`<p>${esc(w.short)} leaves today and you get nothing back. Any booking for them is cancelled.</p>`,[['Keep them','close'],['Release','release:'+w.id,'red']]);return}
 if(d.book){
  const when=S().offers.find(o=>o.id===d.book)?.eventAbs,err=G.book(d.book,pick[d.book]);
  if(err){render();return toast(err)}
  refreshList('offers');return toast(when>G.abs()?`Signed for ${weekLabel(when)}. Purse paid after the match.`:'Booked on this week’s card.');
 }
 if(d.approach){const res=window.OfficeApproaches.approach(d.approach);render();toast(res.error||res.text);return}
 if(d.unbook){
  const c=[...S().card,...S().futureBookings].find(x=>x.id===d.unbook);
  if(c?.programme){
   const pr=S().territory?.programmes?.live?.find(x=>x.id===c.programme.id);
   const remaining=pr?.beats?.filter(b=>!b.done&&!b.missed)||[];
   const p=G.P(c.pid);
   dialog('Withdraw from the whole programme?',`<p>Pulling this match cancels <b>all ${remaining.length} remaining programme dates</b>, not just this fixture.</p><p><b>${esc(p?.name||'The promoter')} trust −15.</b> This cannot be undone.</p>`,[['Keep the programme','close'],['Withdraw programme','withdraw:'+c.id,'red']]);
   return;
  }
  const said=G.unbook(d.unbook);render();toast(said||'Booking cancelled. Promoter trust −6.');return
 }
 if(d.talkopen){const o=S().offers.find(x=>x.id===d.talkopen);renderMeeting(d.talkopen,o?.talk?.wid||pick[d.talkopen]);return}
 if(d.talkaction){const res=G.talkMove(d.oid,d.wid,d.talkaction);if(res.error)return toast(res.error);if(res.withdrawn){$('#modal').close();refreshList('offers');
  // A lost booking needs a record the player can read, not a toast that vanishes as the meeting closes.
  const said=(res.talk?.log||[]).filter(x=>x.who!=='You').at(-1);
  dialog('Booking withdrawn',`${said?.text?`<p><b>${esc(said.who)}:</b> “${esc(said.text)}”</p>`:''}<p>${esc(res.detail||'The booking has been withdrawn.')}</p>`,[['Back to offers','close']]);return}renderMeeting(d.oid,d.wid);return}
 if(d.talkbook){const o=S().offers.find(o=>o.id===d.talkbook);const when=o?.eventAbs;if(d.revert){const res=G.talkMove(d.talkbook,d.wid,'revert');if(res.error)return toast(res.error)}const err=G.book(d.talkbook,d.wid);if(err)return toast(err);$('#modal').close();refreshList('offers');toast(when>G.abs()?`Future booking confirmed for ${weekLabel(when)}.`:`Contract signed for ${money(G.purse(o,G.W(d.wid)))}.`);return}
 if(d.replay){const x=S().history[+d.replay];dialog(`${x.name} v ${x.foe}`,`${x.promo?`<p><b>Microphone time — ${esc(x.promo.style)}</b></p>${x.promo.dialogue?.length?x.promo.dialogue.map(z=>`<p><b>${esc(z.speaker)}:</b> ${esc(z.line)}</p>`).join(''):`<p>${x.promo.speech.map(z=>'“'+esc(z)+'”').join(' ')}</p><p><b>${esc(x.promo.opponent)}:</b> “${esc(x.promo.reply)}”</p>`}${x.promo.promise?.kept===true?'<p><b>Promise kept in the match.</b></p>':x.promo.promise?.kept===false?'<p><b>Promise broken in the match.</b></p>':''}`:''}<p class="dim">${esc(x.promoter)}, season ${x.season} week ${x.week}. <span class="stars">${starsText(x.stars)||'DUD'}</span></p>${historyDetails(x)}${(x.notes||[]).map(n=>`<p>${esc(n)}</p>`).join('')}<div class="well">${logList(x.log||[])}</div>`);return}
 if(d.act==='export'){const blob=new Blob([JSON.stringify(S())],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`the-office-s${S().season}w${S().week}.json`;a.click();return}
 if(d.act==='import'){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{const f=i.files[0];if(!f)return;f.text().then(t=>{try{const x=JSON.parse(t);if(!G.importCareer(x))throw 0;clearNight();night=null;G.save();startApp('desk');if(!resumeNight())toast('Save loaded.')}catch(err){toast('That file isn’t a valid save from v2 to v2.3.')}})};i.click();return}
 if(d.act==='profile'){identitySetup('edit');return}
 if(d.act==='newgame'){dialog('Start a new career?','<p>Your current career will be overwritten.</p>',[['Cancel','close'],['Start again','newgame','red']]);return}
 if(d.dlg==='identity-save'){
  const manager=$('#identity-manager')?.value.trim(),stable=$('#identity-stable')?.value.trim();
  if(!manager||!stable){
   const error=$('#identity-error');if(error)error.hidden=false;
   (!manager?$('#identity-manager'):$('#identity-stable'))?.focus();return;
  }
  const profile=G.normaliseIdentity({manager,stable,portrait:identityPortrait});
  if(identityMode==='edit'){
   G.setIdentity(profile);$('#modal').close();render();$('#headerIdentity [data-act="profile"]')?.focus({preventScroll:true});toast('Manager profile updated.');return;
  }
  if(G.hasSave()&&!newCareerApproved&&!confirm('Overwrite your saved career with a new one?'))return;
  $('#modal').close();clearNight();G.wipe();G.fresh(profile);openMsg=null;night=null;
  $('#tv').hidden=true;document.body.style.overflow='';closeTVFocus();
  newCareerApproved=false;startApp('scouting');toast('Sign your first wrestler.');return;
 }
 if(d.dlg==='newgame'){$('#modal').close();newCareerApproved=true;identitySetup('new');return}
 if(d.dlg==='review-week-offers'){$('#modal').close();return go('offers')}
 if(d.dlg==='confirm-start-night'){$('#modal').close();if(G.pending().length||!S().card.length)return proceed();return startNight();}
 if(d.dlg==='confirm-empty-week'){
  $('#modal').close();
  if(S().card.length||G.pending().length)return proceed();
  try{G.atomicSettlement(()=>G.endWeek());}catch(error){console.error('Weekly settlement rolled back',error);toast('Week settlement failed. Nothing was charged. Please retry.');return;}
  if(S().over)return gameOver();
  openMsg=null;past=[];ahead=[];route={s:'desk',id:null};render(true);
  toast(`Week ${S().week}. ${S().offers.length} ${plural(S().offers.length,'offer')} on the table.`);
  return;
 }
 if(d.dlg){const m=$('#modal');m.close();if(d.dlg.startsWith('sign:')){const id=d.dlg.slice(5),err=G.sign(id);if(err){render();return toast(err)}const w=G.W(id);selFree=null;refreshList('scouting');return toast(`${w.name} signed. Wages ${money(w.wage)} a week.`)}if(d.dlg.startsWith('raise:')){const r=window.OfficeAmbitions?.giveRaise?.(d.dlg.slice(6));render();toast(r?.error||r?.text||'Wage review unavailable.');return}if(d.dlg.startsWith('withdraw:')){const said=G.unbook(d.dlg.slice(9));render();toast(said||'Programme withdrawn.');return}if(d.dlg.startsWith('release:')){const w=G.W(d.dlg.slice(8));G.release(w.id);past=past.filter(r=>r.id!==w.id);ahead=[];route={s:'squad',id:null};render(true);toast(`${w.name} released.`)}return}
 if(d.title==='new'){newCareerApproved=false;identitySetup('new');return}
 if(d.title==='load'){if(!G.load())return toast('No saved career found.');startApp('desk');if(resumeNight())toast('Match restored, paused at your last decision.');return}
 if(d.plan){night.plan[d.plan]=d.val;if(d.plan==='game'){night.plan.sheet=null;night.plan.focus=null;night.plan.confirmed=false;}t.parentElement.querySelectorAll('.opt').forEach(b=>b.setAttribute('aria-pressed',b===t));persistNight();return}
 if(d.structure||d.structurelead){
  const P=night?.plan,room=P?.room;
  if(night?.stage!=='meeting'||!room||room.stage!=='plan')return;
  if(d.structure){
   const ids=OfficeSheets.STRUCTURES.catalogue().map(x=>x.id);
   if(d.structure!=='traditional'&&!ids.includes(d.structure))return;
   P.structureChoice=d.structure==='traditional'?null:{id:d.structure,lead:P.structureChoice?.lead||'w'};P.structureSelected=true;
  }else{
   if(!P.structureChoice||!['w','f'].includes(d.structurelead))return;
   P.structureChoice={...P.structureChoice,lead:d.structurelead};
  }
  P.roomCheckpoints={};P.room=null;P.sheet=null;P.confirmed=false;
  return showMeeting();
 }
 if(d.sheetmode){if(!OfficeSheets.MODE[d.sheetmode])return;night.plan.method=d.sheetmode;night.plan.sheet=null;night.plan.confirmed=false;return showMeeting()}
 if(d.spotToggle!==undefined){
  const row=document.getElementById('spot-options-'+d.spotToggle);if(!row)return;
  const open=row.hidden;
  document.querySelectorAll('.spot-expanded').forEach(r=>r.hidden=true);
  document.querySelectorAll('[data-spot-toggle]').forEach(b=>b.setAttribute('aria-expanded','false'));
  row.hidden=!open;t.setAttribute('aria-expanded',String(open));return;
 }
 if(d.planback!==undefined){
  const P=night?.plan,st=P?.room,i=Number(d.planback);
  if(night?.stage!=='meeting'||!st||!Number.isInteger(i)||i<0||i>3)return;
  if(i!==0&&!P.roomCheckpoints?.[i])return;
  if(!window.confirm('Return to this planning stage? Decisions made after it will be discarded.'))return;
  if(st.stage==='done'&&P.confirmed){
   const recent=S().roomRecent||[],suffix=st.queue.slice(-6);
   // Legacy signed saves lack a pre-sign snapshot. Remove only a matching recorded suffix.
   if(Array.isArray(P.roomRecentBefore))S().roomRecent=P.roomRecentBefore.slice();
   else if(suffix.length&&JSON.stringify(recent.slice(-suffix.length))===JSON.stringify(suffix))S().roomRecent=recent.slice(0,-suffix.length);
   delete P.roomRecentBefore;G.save();
  }
  const wrestler=G.W(current().wid);P.game=D.STYLE_PLAN[wrestler.style];P.leash=wrestler.psych>=75&&wrestler.ego<75?'free':'script';P.talk='none';
  delete P.arcChoice;delete P.corner;delete P.cornerWho;briefFinishSeen.plan=null;
  if(i===0){P.structureSelected=false;P.structureChoice=null;P.room=null;P.roomCheckpoints={};}
  else{P.room=JSON.parse(JSON.stringify(P.roomCheckpoints[i]));for(const k of Object.keys(P.roomCheckpoints))if(Number(k)>=i)delete P.roomCheckpoints[k];}
  P.sheet=null;P.confirmed=false;return showMeeting(undefined,null);
 }
 if(d.room){const st=night?.plan?.room;if(night?.stage!=='meeting'||!st||st.stage==='done')return;
  if(st.stage==='plan'&&night.plan.structureSelected!==true&&!night.plan.structureChoice)return toast('Choose a match structure first.');if(!OfficeRoom.options(st).some(o=>o.id===d.room))return;const stageIndex={plan:1,board:2,scene:3}[st.stage];if(stageIndex){const checkpoints=night.plan.roomCheckpoints||(night.plan.roomCheckpoints={});if(!checkpoints[stageIndex])checkpoints[stageIndex]=JSON.parse(JSON.stringify(st));}OfficeRoom.act(st,d.room);return showMeeting()}
 if(d.cornerwho){if(night?.stage!=='meeting'||!night.plan)return;night.plan.cornerWho=d.cornerwho;night.plan.corner=null;return showMeeting()}
 if(d.cornerjob){if(night?.stage!=='meeting'||!night.plan)return;const x=OfficeRingside.parse(d.cornerjob);if(!x)return;night.plan.cornerWho=x.id;night.plan.corner=night.plan.corner===d.cornerjob?null:d.cornerjob;return showMeeting()}
 if(d.arcchoice){if(night?.stage!=='meeting'||night.plan?.room?.stage!=='done')return;const v=window.OfficeProgrammeArcs?.options(current());if(!v?.choices.some(x=>x.id===d.arcchoice))return;night.plan.arcChoice=d.arcchoice;return showMeeting()}
 if(d.afterangle){if(e.detail>1)return;const st=night?.after;if(night?.stage!=='after'||!st||st.stage!=='angle')return;OfficeAfter.choose(st,d.afterangle);syncAfterEvidence();return showAfter()}
 if(d.afterfollow){if(e.detail>1)return;const st=night?.after;if(night?.stage!=='after'||!st||st.stage!=='follow')return;OfficeAfter.continueAngle(st,d.afterfollow);syncAfterEvidence();return showAfter()}
 if(d.aftermic){if(e.detail>1)return;const st=night?.after;if(night?.stage!=='after'||!st||st.stage!=='mic')return;OfficeAfter.speak(st,d.aftermic);syncAfterEvidence();return showAfter()}
 if(d.tv==='after'){
  if(!night||!['result','after'].includes(night.stage))return;
  if(night.afterReady&&(!night.after||!night.after.dialogue)&&night.stage==='result'){
   if(night.afterLoading)return;
   const n=night,ready=n.afterReady,{c,fin,plan}=ready,token={};
   n.afterLoading=token;
   const button=t.closest('[data-tv="after"]');
   if(button){button.disabled=true;button.textContent='Preparing dialogue…';}
   Promise.resolve(window.OfficePlanningDialogue?.loadPair(G.W(c.wid),G.F(c.rid))||[]).catch(()=>[]).then(banks=>{
    if(n.afterLoading!==token)return;
    delete n.afterLoading;
    if(night!==n||n.stage!=='result'||n.afterReady!==ready)return;
    n.after??=OfficeAfter.begin(c,fin,plan);
    OfficeAfter.attachDialogue(n.after,banks);
    syncAfterEvidence();
    if(n.after)showAfter();
   });
   return;
  }
  if(night.after)return showAfter();
  return;
 }
 if(d.mouth){if(night?.stage!=='mouth')return;const c=current();if(!c)return;night.mouth={cid:c.id,id:d.mouth};return showPromos()}
 if(d.segment){if(e.detail>1||night?.stage!=='segpick')return;const c=current();if(!c||!window.OfficeSegments?.TYPES[d.segment])return;
  night.segment={cid:c.id,type:d.segment};night.seg=null;night.mouth=null;return showPromos()}
 if(d.seg){if(e.detail>1||night?.segLoading)return;const st=night?.seg;if(night?.stage!=='segment'||!st||st.stage!=='live'||current()?.id!==st.cid)return;OfficeSegments.choose(st,d.seg);return showSegment()}
 if(d.contract){const st=night?.signing;if(night?.stage!=='signing'||!st||st.stage!=='live')return;OfficeSigning.choose(st,d.contract);return showSigning()}
 if(d.tv==='signing'){if(night?.stage==='meeting'&&night.plan?.room?.stage!=='done')return;return showSigning();}
 // A double-click sends a second click (detail 2) at the same spot, after the first pick has
 // re-rendered the options. That second click is a second decision, so it is ignored.
 if(d.mic){if(e.detail>1)return;const st=night?.promo;if(night?.stage!=='promo'||night.promoLoading||st?.v!==5||st.stage==='done'||current()?.id!==st.cid)return;
  if(!OfficeMic.choices(st).some(o=>o.id===d.mic))return;OfficeMic.choose(st,d.mic);return showPromos()}
 if(d.tv==='meeting')return showMeeting();
 if(d.tv==='promos'){if(night?.stage==='meeting'&&night.plan?.room?.stage!=='done')return;return showPromos();}
 if(d.tv==='bell'){if(window.OfficeSigning?.eligible(current())&&night?.signing?.stage!=='done')return;if(night?.segment?.cid===current()?.id&&night.segment.type!=='duel'&&night.seg?.stage!=='done')return;if(!night?.plan?.sheet?.skipPromo&&!night?.signing&&night?.promo?.v>=4&&night.promo.stage!=='done')return;if(night?.stage==='meeting'&&night.plan?.room?.stage!=='done')return;return bell();}
 if(['next','done'].includes(d.tv)&&night?.after?.required&&night.after.stage!=='done')return;
 if(d.tv==='next'){night.after=null;night.afterReady=null;night.signing=null;night.segment=null;night.seg=null;prep();return}
 if(d.tv==='done'){night.afterReady=null;return endNight();}
 if(d.call)return doCall(d.call);
 if(d.decide)return decideNow(d.decide);
 if(d.speed!==undefined){night.speed=d.speed;document.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.speed===night.speed));if(night.speed==='skip'&&night.paused)night.paused=false;if(!night.paused)schedule(50);updateLive();return}
 if(t.hasAttribute('data-pause')){if(night.M?.done)return result();night.paused=!night.paused;updateLive();if(!night.paused)schedule(100);return}
});
document.addEventListener('input',e=>{
 const el=e.target;
 if(!el.matches('[data-stable-query],[data-scout-query]'))return;
 const which=el.hasAttribute('data-stable-query')?'stable':'scout',start=el.selectionStart,end=el.selectionEnd;
 if(which==='stable')stableQuery=el.value;else scoutQuery=el.value;
 render();
 const next=$('#view [data-'+which+'-query]');
 if(next){next.focus({preventScroll:true});if(start!=null)next.setSelectionRange(start,end);}
});
document.addEventListener('change',e=>{
 const t=e.target,d=t.dataset;
 if(d.stableFilter!==undefined){stableFilter=t.value;render();return}
 if(d.scoutStyle!==undefined){scoutStyle=t.value;render();return}
 if(d.scoutBudget!==undefined){scoutBudget=t.value;render();return}
 if(d.freeSort!==undefined){sorts.free={k:t.value,d:['name','style'].includes(t.value)?1:-1};render();return}
 if(d.trainweek!==undefined){trainingReportWeek=t.value;render();return;}
 if(d.session){const err=G.setSession(d.session,t.value);if(err){toast(err);render();return}const w=G.W(d.session);render();toast(t.value==='none'?`${w.short}: no session with Dennis this week.`:`${w.short}: ${t.selectedOptions[0]?.textContent.replace(' — Dennis suggests','').toLowerCase()} with Dennis.`);return}
 if(d.train){G.setTraining(d.train,t.value);render();toast(`${G.W(d.train).short}: ${D.TRAINING[t.value].name.toLowerCase()} this week.`);return}
 if(d.intensity){G.setIntensity(d.intensity,t.value);render();toast(`${G.W(d.intensity).short}: ${G.INTENSITY[t.value].name}, ${money(G.trainingCost(G.W(d.intensity)))} a week.`);return}
 if(d.pick){pick[d.pick]=t.value;render();return}
});
document.addEventListener('mouseover',e=>{const b=e.target.closest('[data-hint]');if(b&&$('#lHint'))$('#lHint').textContent=b.dataset.hint});
document.addEventListener('focusin',e=>{const b=e.target.closest('[data-hint]');if(b&&$('#lHint'))$('#lHint').textContent=b.dataset.hint});
// Remember whether the phone filter disclosure was opened, so re-renders keep it open.
document.addEventListener('toggle',e=>{if(e.target.classList?.contains('free-filters'))scoutFiltersOpen=e.target.open},true);
document.addEventListener('ringfax-page-rotated',()=>{if(route.s==='ringfax'&&S())render()});
document.addEventListener('keydown',e=>{
 if(route.s==='ringfax'&&e.target?.matches?.('#rf-page-entry')&&e.key==='Enter'){
  e.preventDefault();const value=e.target.value.trim();
  if(!/^[0-9]{3}$/.test(value)){e.target.setAttribute('aria-invalid','true');return;}
  if(OfficeRingfax.press('go',value,S()))render();return;
 }
 if(route.s==='ringfax'&&(/^F[1-4]$/.test(e.key)||!e.target?.closest?.('input,textarea,select,[contenteditable]'))&&OfficeRingfax.key(e.key,S())){e.preventDefault();render();return;}
 if(night?.M&&!$('#tv').hidden){
  const box=$('#decision');if(box&&!box.hidden)return;
  if(e.key===' '){e.preventDefault();night.paused=!night.paused;updateLive();if(!night.paused)schedule(100);return}
  const n=+e.key;if(n>=1&&n<=6){doCall(Object.keys(Mx.CALLS)[n-1]);return}
 }
});

/* ---------- start screen: tonight's poster ----------
   Only real matches. With a saved career: your next booked match, then the rest of your bookings
   and the circuit's next show. Without one: a match from the first circuit show a new career will
   book (week 2), worked out from the same world a new career builds. Built on a copy, never saved. */
function savedCareer(){
 for(const k of ['the-office-v22','the-office-v21']){try{const raw=localStorage.getItem(k);if(raw)return JSON.parse(raw)}catch(e){}}
 return null;
}
function posterFace(img,caption,w,saved){
 const el=$(img),cell=Pt.portraitCell({key:'wrestler:'+w.id,name:w.name},saved);
 el.style.backgroundImage=`url("${cell?.fileUrl||'assets/portraits/'+w.id+'.png'}")`;
 el.style.backgroundPosition='center';
 el.style.backgroundSize=cell?'100% 100%':'cover';
 el.classList.toggle('age-portrait',!!cell);
 el.setAttribute('aria-label','Pixel-art portrait of '+w.name);
 $(caption).textContent=w.name;
}
function showRealBill(bill,saved){
 const h=bill.head,p=D.PROMOS.find(x=>x.id===h.pid);if(!p)return false;
 $('#posterPromo').textContent=p.name;$('#posterVenue').textContent=p.venue.replace(/^the /,'The ');
 posterFace('#posterW','#posterWName',h.a,saved);posterFace('#posterF','#posterFName',h.b,saved);
 const belt=h.title?D.belt(h.pid,h.div):null,img=$('#posterBelt');
 if(belt){img.src=belt.img;img.alt=belt.name+' belt';img.hidden=false;}else{img.hidden=true;img.alt='';}
 const when=h.yours?(h.tonight?'Tonight':'Week '+(((h.week-1)%16)+1)):'Week '+(((h.week-1)%16)+1);
 const what=belt?'for the '+belt.name:h.yours?(D.SLOTS[h.slot]?.name||'Booked')+(h.minutes?' · '+h.minutes+' minutes':''):D.DIVISIONS[h.div].name+' division';
 $('#posterStakes').textContent=when+' · '+what+(h.tag&&!belt?' · '+h.tag:'');
 const short=pid=>D.PROMOS.find(x=>x.id===pid)?.name||'';
 $('#posterUnder').innerHTML=bill.under.map(m=>`<li><b>${esc(m.a.name)}</b> v <b>${esc(m.b.name)}</b>${m.pid!==h.pid||m.week!==h.week?` <small>${[m.pid!==h.pid?'at '+esc(short(m.pid)):'',m.week!==h.week?(m.tonight?'tonight':'week '+(((m.week-1)%16)+1)):''].filter(Boolean).join(', ')}</small>`:''}</li>`).join('');
 $('#posterBout').setAttribute('aria-label',(h.yours?'Your booked match: ':bill.saved?'On the circuit: ':'On the first show of a new career: ')+h.a.name+' versus '+h.b.name+', '+$('#posterStakes').textContent);
 return true;
}
function posterBill(){
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const stars=div=>D.ALL.filter(w=>D.divisionOf(w)===div).sort((a,b)=>(b.heat||0)-(a.heat||0)).slice(0,14);
 const saved=savedCareer(),p=pick(D.PROMOS),top=saved?.roster?.slice().sort((x,y)=>(y.heat||0)-(x.heat||0)).find(w=>D.findWrestler(w.id));
 let div=pick(D.DIVISION_ORDER),a,b;
 if(top){
  div=D.divisionOf(top.id);a=D.findWrestler(top.id);
  const holder=saved.territory?.titles?.[p.id]?.[div]?.holder;
  b=holder&&holder!==a.id?D.findWrestler(holder):pick(stars(div).filter(w=>w.id!==a.id));
 }else{const pool=stars(div);a=pick(pool);b=pick(pool.filter(w=>w.id!==a.id));}
 let real=null;try{real=OfficeTerritory.startBill?.(saved)||null;}catch(e){real=null;}
 if(real&&showRealBill(real,saved)){summary(saved,top);return;}
 // Fallback if the career cannot be read: two real names from one division meet for a belt.
 const belt=D.belt(p.id,div),used=new Set([a.id,b.id]);$('#posterBelt').hidden=false;
 $('#posterPromo').textContent=p.name;$('#posterVenue').textContent=p.venue.replace(/^the /,'The ');
 posterFace('#posterW','#posterWName',a,saved);posterFace('#posterF','#posterFName',b,saved);
 $('#posterBelt').src=belt.img;$('#posterBelt').alt=belt.name+' belt';
 $('#posterStakes').textContent='for the '+belt.name;
 const under=[];
 for(let n=0;n<2;n++){
  const pool=stars(pick(D.DIVISION_ORDER)).filter(w=>!used.has(w.id)),x=pick(pool),y=pick(pool.filter(w=>w.id!==x.id));
  if(!x||!y)continue;used.add(x.id);used.add(y.id);under.push(`<li><b>${esc(x.name)}</b> v <b>${esc(y.name)}</b></li>`);
 }
 $('#posterUnder').innerHTML=under.join('');
 summary(saved,top);
}
// Continue shows what you are going back to.
function summary(saved,top){
 if(saved&&G.hasSave()){
  const parts=[`Season ${saved.season||1}, week ${saved.week||1}`];
  if(Number.isFinite(saved.cash))parts.push(money(saved.cash));
  $('#loadSummary').innerHTML=`<span class="stub-save">${top?Pt.avatar({key:'wrestler:'+top.id,name:top.name},null,'portrait',saved):''}${esc(parts.join(' · '))}${top?' · '+esc(top.name):''}</span>`;
 }
}

/* ---------- boot ---------- */
window.OfficeUI={get night(){return night},go};
window.addEventListener('office-save-status',showSaveStatus);
window.addEventListener('DOMContentLoaded',()=>{
 posterBill();showSaveStatus();
 const d=$('#modal');d.addEventListener('close',()=>{
  const oid=d.dataset.talkoid;if(oid&&S()){const o=S().offers.find(x=>x.id===oid);if(o?.talk?.step==='start'){o.talk=null;G.save();}}
  delete d.dataset.talkoid;d.classList.remove('negotiation-dialog');if(S()&&!$('#app').hidden)render();
 });
 if(G.hasSave())$('#loadBtn').hidden=false;
 $('#title').hidden=false;
});
})();
