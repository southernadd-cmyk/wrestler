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
const sorts={};

/* ---------- small helpers ---------- */
function face(type,id,name,cls='portrait'){return Pt.avatar({key:type+':'+id,name,type},null,cls)}
function band(v){return v>=80?5:v>=65?4:v>=50?3:v>=35?2:1}
function bandBar(v){return ['','danger','warn','gold','',''][band(v)]}
function att(v){return `<span class="att a${band(v)}">${Math.round(v)}</span>`}
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
 const by={};for(const m of h.slice().reverse())(by[m.wid]??={name:m.name,pts:[]}).pts.push([m.week,m.stars,`W${m.week} ${m.name} v ${m.foe}: ${starsText(m.stars)||'DUD'}`]);
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
  g.q=Math.round(g.qs/g.n);g.d=g.cOut-g.cIn;g.name=Mx.PHASES[g.p]?.name||'';
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
 const pick=(list,n)=>{const out=[];for(const s of list){if(out.length>=n)break;if(out.every(o=>Math.abs(o.t1-s.t1)>60))out.push(s)}return out};
 const rises=pick(sw.filter(s=>s.d>=5).sort((a,b)=>b.d-a.d),3),drops=pick(sw.filter(s=>s.d<=-4).sort((a,b)=>a.d-b.d),2);
 const log=(fin.log||[]).filter(l=>l.kind!=='count'&&l.kind!=='rating'&&l.text.length>12).map(l=>({...l,s:secs(l.t)}));
 const why=s=>{const near=log.filter(l=>l.s>=s.t0-10&&l.s<=s.t1+5);
  const best=(s.d>0&&near.find(l=>l.big&&l.kind!=='bad'))||near.find(l=>l.kind===(s.d>0?'crowd':'bad'))||near.find(l=>l.kind==='play'||l.kind==='crowd'||l.kind==='bad')||near.at(-1);
  return best?.text||''};
 return [...rises,...drops].sort((a,b)=>a.t1-b.t1).map(s=>({...s,text:why(s)}));
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
 const moments=mom.length?`<ol class="mf-moments well">${mom.map(m=>`<li class="${m.d>0?'up':'down'}"><span class="t">${esc(Mx.fmt(m.t1))}</span><b class="chip ${m.d>0?'up':'down'}">${m.d>0?'+':''}${m.d}</b><span>${esc(m.text)}</span></li>`).join('')}</ol>`:'<p class="dim">The crowd never swung hard either way.</p>';
 const parts=(fin.starParts||[]).filter(p=>Math.abs(p[2])>=.01),maxAbs=Math.max(.5,...parts.map(p=>Math.abs(p[2])));
 const breakdown=parts.length?`<div class="mf-parts well">${parts.map(([k,label,v])=>`<div class="mf-part ${v>=0?'pos':'neg'}"><span>${esc(label)}</span><span class="mf-pbar"><i style="${v>=0?'left':'right'}:50%;width:${Math.abs(v)/maxAbs*50}%"></i></span><b>${v>=0?'+':'−'}${Math.abs(v).toFixed(2)}</b></div>`).join('')}<div class="mf-part total"><span>Rating</span><span></span><b>${starsText(fin.stars)||'DUD'}</b></div></div>`:'';
 return `${head}${flowGraphic(fin,w,f,ph)}<div class="mf-cols"><div><h3 class="section-h">Phase by phase</h3>${table}</div><div><h3 class="section-h">Moments that moved the room</h3>${moments}${breakdown?`<h3 class="section-h" style="margin-top:10px">Where the stars came from</h3>${breakdown}`:''}</div></div>`;
}
function bar(v,kind=''){return `<span class="bar ${kind}" role="img" aria-label="${Math.round(v)} out of 100"><i style="width:${Math.max(0,Math.min(100,v))}%"></i></span>`}
function fatKind(f){return f>=60?'danger':f>=40?'warn':'cool'}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),3600)}
function finishTag(k){const f=D.FINISHES[k];return `<span class="tag ${f.win?'tw':'tl'}">${esc(f.name)}</span>`}
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
 ['Territory',[['pyramid','Card pyramid'],['sheets','Booking sheets'],['promoters','Promoters'],['rivalries','Rivalries'],['results','Results']]],
 ['Game',[['game','Save and load']]]
];
const SECTION_OF={profile:'squad'};
const PHONE_WIDTH=720;
const phoneLayout=()=>innerWidth<=PHONE_WIDTH;
const PHONE_LABELS={desk:'Today',squad:'Stable',pyramid:'Card ladder',game:'Save and load'};
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
 if(route.s===s&&route.id===id){render(innerWidth<=900);return}
 past.push(route);if(past.length>40)past.shift();ahead=[];
 route={s,id};render(true);
}
function histMove(dir){
 const from=dir<0?past:ahead,to=dir<0?ahead:past;
 if(!from.length)return;to.push(route);route=from.pop();render(true);
}

function renderChrome(){
 const s=S(),need=G.pending().length,cards=s.card.length,unread=s.inbox.filter(m=>!m.read).length;
 $('#readouts').innerHTML=`<div class="ro"><small>Season ${s.season}</small><b>Week ${s.week} of 16</b></div><div class="ro"><small>Bank</small><b class="${s.cash<0?'neg':''}">${money(s.cash)}</b></div><div class="ro"><small>Reputation</small><b>${s.rep}</b></div><div class="ro"><small>Meetings left</small><b>${s.focus} of 2</b></div>`;
 $('#continue').innerHTML=need?`Continue<small>${need} ${plural(need,'reply','replies')} needed first</small>`:cards?`Match night<small>${cards} on the card</small>`:`Continue<small>To week ${s.week===16?1:s.week+1}</small>`;
 const badge={inbox:need?`<span class="badge">${need}</span>`:unread?`<span class="badge soft">${unread}</span>`:'',squad:`<span class="badge soft">${s.roster.length}/5</span>`,offers:s.offers.length?`<span class="badge soft">${s.offers.length}</span>`:'',fixtures:cards?`<span class="badge soft">${cards}</span>`:''};
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

const SCREENS={desk:renderDesk,inbox:renderInbox,objectives:renderObjectives,squad:renderSquad,profile:renderProfile,training:renderTraining,scouting:renderScouting,stables:renderStables,offers:renderOffers,fixtures:renderFixtures,pyramid:renderPyramid,sheets:renderSheets,promoters:renderPromoters,rivalries:renderRivalries,results:renderResults,game:renderGame};
function render(reset=false){
 if(!S())return;
 const keep={};if(!reset)document.querySelectorAll('#view [data-keep]').forEach(el=>keep[el.dataset.keep]=el.scrollTop);
 if(!SCREENS[route.s])route={s:'desk',id:null};
 SCREENS[route.s]();renderChrome();
 document.querySelectorAll('#view [data-keep]').forEach(el=>{if(keep[el.dataset.keep])el.scrollTop=keep[el.dataset.keep]});
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
 const s=S(),out=[],need=G.pending();
 if(need.length)out.push({k:'urgent',ic:'!',t:`${need.length} ${plural(need.length,'message needs','messages need')} a reply`,d:'You can’t continue until you answer.',go:'inbox',b:'Read'});
 else{const u=s.inbox.filter(m=>!m.read).length;if(u)out.push({k:'',ic:'▸',t:`${u} unread ${plural(u,'message')}`,d:'Reports, results and news from the circuit.',go:'inbox',b:'Read'})}
 if(!s.roster.length)out.push({k:'urgent',ic:'!',t:'Nobody under contract',d:'Sign a headliner, or two cheaper wrestlers.',go:'scouting',b:'Free agents'});
 if(s.card.length)out.push({k:'ok',ic:'✓',t:`${s.card.length} ${plural(s.card.length,'match')} on this week’s card`,d:'Continue takes you to ringside.',go:'fixtures',b:'Fixtures'});
 else if(s.roster.length&&s.offers.length)out.push({k:'',ic:'▸',t:`${s.offers.length} ${plural(s.offers.length,'offer')} on the table, nothing booked`,d:'An unbooked week earns nothing but still costs wages.',go:'offers',b:'Offers'});
 for(const w of s.roster){
  if(w.injury)out.push({k:'urgent',ic:'+',t:`${w.short} is injured`,d:`Out for ${w.injury} ${plural(w.injury,'week')}.`,go:'profile',id:w.id,b:'Profile'});
  else if(w.fatigue>=45)out.push({k:'urgent',ic:'!',t:`${w.short} is tired`,d:`Fatigue ${w.fatigue}. Consider rest this week.`,go:'training',b:'Training'});
  if(w.morale<35)out.push({k:'urgent',ic:'!',t:`${w.short}’s morale is low`,d:`Morale ${w.morale}. A private meeting may help.`,go:'profile',id:w.id,b:'Profile'});
  if(w.promise?.status==='open')out.push({k:'',ic:'▸',t:`Promise to ${w.short}: a featured match`,d:`Due by ${weekLabel(w.promise.deadline)}.`,go:'offers',b:'Offers'});
 }
 if(s.roster.length&&s.focus>0)out.push({k:'',ic:'▸',t:`${s.focus} management ${plural(s.focus,'meeting')} left this week`,d:'Use them to haggle with promoters or talk to your wrestlers.',go:'offers',b:'Offers'});
 if(!out.length)out.push({k:'ok',ic:'✓',t:'All quiet',d:'Press Continue to move on to next week.'});
 return out;
}
function renderDesk(){
 const s=S(),stakes=s.season===1&&s.week<=4;
 let mission='';
 if(stakes)mission=win('Sponsor trial',trialBlock(),{area:'mission',note:'Weeks 1 to 4'});
 else if(s.monthReview&&s.season===1)mission=win(s.monthReview.passed?'Backer invested £450':'Backer declined funding',`<p>Best match in the trial: ${s.monthReview.best}★. Training and promos: ${money(s.monthReview.business?.training||0)}. Contract improvements: ${money(s.monthReview.business?.negotiated||0)}. Promises kept ${s.monthReview.business?.kept||0}, broken ${s.monthReview.business?.broken||0}.</p><p class="dim">The regional circuit runs to week 16. Checkpoints are under Objectives.</p><button class="btn sm" data-go="objectives">Objectives</button>`,{area:'mission',note:'Trial review'});
 const tray=`<ul class="tray">${trayItems().map(x=>`<li class="${x.k}"><span class="ic">${x.ic}</span><span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></span>${x.go?`<button class="btn sm" data-go="${x.go}" ${x.id?`data-id="${x.id}"`:''}>${x.b}</button>`:'<span></span>'}</li>`).join('')}</ul>`;
 const dates=[...s.card.map(c=>({...c,eventAbs:G.abs()})),...s.futureBookings].sort((a,b)=>a.eventAbs-b.eventAbs).slice(0,6);
 const datesHtml=dates.length?`<table class="grid"><thead><tr><th>When</th><th>Match</th><th>Promoter</th><th class="n">Purse</th></tr></thead><tbody>${dates.map(c=>`<tr><td>${c.eventAbs===G.abs()?'<b>This week</b>':weekLabel(c.eventAbs)}</td><td>${esc(G.W(c.wid)?.short||'Departed')} v ${esc(G.F(c.rid).short)}</td><td class="dim">${esc(G.P(c.pid)?.name||'')}</td><td class="n">${money(c.purse)}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">No dates signed.<br><button class="btn sm" data-go="offers">See offers</button></div>`;
 const squad=s.roster.length?`<table class="grid"><thead><tr><th>Wrestler</th><th>Fatigue</th><th class="n">Morale</th><th>Status</th></tr></thead><tbody>${s.roster.map(w=>`<tr class="pick" data-openw="${w.id}"><td><b>${esc(w.name)}</b></td><td>${bar(w.fatigue,fatKind(w.fatigue))} ${w.fatigue}</td><td class="n">${att(w.morale)}</td><td>${status(w)}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">An empty stable can’t take bookings.<br><button class="btn sm" data-go="scouting">Free agents</button></div>`;
 paint('s-desk'+(mission?'':' nomission'),
  mission+
  win('This week',ledgerFacts()+booksChart(),{area:'ledger',h:'h3',cls:'quiet',body:'tight'})+
  win('In-tray',`<div class="phone-only"><div class="phone-progress"><div><small>Reputation</small><b>${s.rep}</b></div><div><small>Meetings left</small><b>${s.focus} of 2</b></div></div></div><div class="well">${tray}</div>`,{area:'tray',cls:'desk-actions',body:'tight',keep:'tray'})+
  win('Next dates',`<div class="well">${datesHtml}</div>`,{area:'dates',h:'h3',body:'tight',keep:'dates'})+
  win('Stable condition',`<div class="well">${squad}</div>`,{area:'squad',h:'h3',body:'tight',keep:'cond',actions:'<button class="btn" data-go="training">Training</button>'})
 );
}

function renderInbox(){
 const s=S(),list=s.inbox;
 if(phoneLayout()&&list.some(m=>m.id===route.id))openMsg=route.id;
 if(!openMsg||!list.some(m=>m.id===openMsg))openMsg=(G.pending()[0]||list[0])?.id;
 const m=list.find(x=>x.id===openMsg);if(m&&!m.read&&m.kind!=='decision'&&(!phoneLayout()||route.id===m.id)){m.read=true;G.save()}
 const items=list.map(x=>`<li><button data-msg="${x.id}" class="${!x.read?'unread':''} ${x.kind==='decision'&&!x.answer?'need':''}" ${x.id===openMsg?'aria-current="true"':''}><span class="pip">${x.kind==='decision'&&!x.answer?'<span class="sr">Needs a reply. </span>':!x.read?'<span class="sr">Unread. </span>':''}</span><span class="from">${esc(x.from)}</span><span class="wk">S${x.season} W${x.week}</span><span class="subj">${esc(x.subject)}</span></button></li>`).join('');
 let letter='<div class="empty">No messages.</div>';
 if(m){
  const mgr=managerFrom(m);
  letter=`<article class="letter">${mgr?`<div class="letter-face">${face('manager',mgr.id,mgr.manager,'portrait')}</div>`:''}<div class="meta">From ${esc(m.from)}. Season ${m.season}, week ${m.week}.</div><h2>${esc(m.subject)}</h2>${m.body.map(p=>`<p>${esc(p)}</p>`).join('')}`;
  if(Array.isArray(m.sections)&&m.sections.length){
   letter+='<div class="report-sections">'+m.sections.map(section=>'<section><h3 class="section-h">'+esc(section.title)+'</h3><ul class="cons">'+(section.lines||[]).map(line=>'<li>'+esc(line)+'</li>').join('')+'</ul></section>').join('')+'</div>';
   letter+='<div class="report-links"><button class="btn" data-go="territory">Territory and rankings</button><button class="btn" data-go="squad">Your roster</button><button class="btn" data-go="offers">Next bookings</button></div>';
  }
  if(m.kind==='decision'){
   if(m.answer)letter+=`<div class="outcome"><b>You chose: ${esc(m.options.find(o=>o.id===m.answer)?.label)}</b><br>${esc(m.outcome)}</div>`;
   else letter+=`<div class="choices">${m.options.map(o=>`<button class="choice" data-answer="${o.id}" data-mid="${m.id}"><b>${esc(o.label)}</b><span>${esc(o.hint)}</span></button>`).join('')}</div>`;
  }
  letter+='</article>';
 }
 const need=G.pending().length;
 paint('s-inbox'+phonePane(route.id,m?.id),
  win('Inbox',`<div class="well" style="min-height:100%"><ul class="msglist">${items}</ul></div>`,{body:'tight',keep:'msgs',cls:'phone-master',note:need?`${need} awaiting reply`:`${list.length} ${plural(list.length,'message')}`})+
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
const FREE_STATS=[['heat','Heat'],['ring','Ring'],['mic','Mic'],['psych','Psych'],['safe','Safe']];
const FREE_SORTS=[['name','Wrestler'],['style','Style'],...FREE_STATS,['wage','Wage'],['fee','Fee']];
function renderSquad(){
 const s=S();
 const rows=sortRows('squad',s.roster,WCOLS,{k:'heat',d:-1});
 const table=s.roster.length?`<div class="well"><table class="grid"><thead><tr>${th('squad','name','Wrestler')}${th('squad','style','Style')}${th('squad','heat','Heat','n')}${th('squad','ring','Ring','n')}${th('squad','mic','Mic','n')}${th('squad','psych','Psych','n')}${th('squad','safe','Safe','n')}${th('squad','fat','Fatigue')}${th('squad','mor','Morale','n')}<th>Status</th>${th('squad','wage','Wage','n')}</tr></thead><tbody>${rows.map(w=>`<tr class="pick" data-openw="${w.id}"><td><span class="who">${face('wrestler',w.id,w.name)}<span><b>${esc(w.name)}</b><small>${esc(w.tier)}. “${esc(w.handle)}”</small></span></span></td><td>${esc(w.style)}</td><td class="n">${att(w.heat)}</td><td class="n">${att(w.ring)}</td><td class="n">${att(w.mic)}</td><td class="n">${att(w.psych)}</td><td class="n">${att(w.safe)}</td><td>${bar(w.fatigue,fatKind(w.fatigue))} ${w.fatigue}</td><td class="n">${att(w.morale)}</td><td>${status(w)}</td><td class="n">${money(w.wage)}</td></tr>`).join('')}</tbody></table></div>`
  :`<div class="empty">Nobody under contract. Sign a headliner, or two cheaper wrestlers.<br><button class="btn go" data-go="scouting">Go to free agents</button></div>`;
 const cards=rows.map(w=>`<button class="phone-card" data-openw="${w.id}"><span class="who">${face('wrestler',w.id,w.name)}<span><b>${esc(w.name)}</b><small>${esc(w.tier)} · ${esc(w.style)}</small></span></span><span class="phone-card-line"><span>Fatigue ${w.fatigue} · Morale ${w.morale}</span><span>${status(w)}</span></span><small>${money(w.wage)} a week</small></button>`).join('');
 const open=5-s.roster.length;
 const openPlaces=s.roster.length&&open>0?`<div class="open-places"><div><b>${open} open ${plural(open,'place')}</b><span>More wrestlers means more of this week’s offers you can fill.</span></div><button class="btn go" data-go="scouting">Find free agents</button></div>`:'';
 paint('s-full',win('Your stable',`${phoneList(table,cards)}${openPlaces}<p class="dim" style="margin-top:10px"><span class="phone-table">Select a wrestler to open their profile. Click a column heading to sort.</span><span class="phone-only">Tap a wrestler to open their profile.</span></p>`,{keep:'squad',note:`${s.roster.length} of 5 places filled. Wages ${money(G.wages())} a week.`,actions:'<button class="btn" data-go="training">Training</button><button class="btn" data-go="scouting">Free agents</button>'}));
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
  win('Wrestler profile',`${face('wrestler',w.id,w.name,'portrait x3')}<div><div class="name">${esc(w.name)}</div><div class="handle">“${esc(w.handle)}”</div><div class="chips"><span class="chip">${esc(w.tier)}</span><span class="chip">${esc(w.style)}</span><span class="chip">${money(w.wage)} a week</span><span class="chip">${status(w)}</span></div>${ambitionLine(w)}${promise}</div><div class="acts"><button class="btn go" data-checkin="${w.id}" ${s.focus<1?'disabled':''}>Private meeting</button><span class="dim" style="font-size:13px">${s.focus} of 2 meetings left</span><button class="btn red" data-release="${w.id}">Release</button></div>`,{area:'head',cls:'phead',actions:nav})+
  win('Attributes',atts+`<h4 class="ch-h">Over time</h4>`+formChart(w),{area:'atts',h:'h3',cls:'quiet',keep:'atts'})+
  win('Training',train,{area:'train',h:'h3',keep:'train'})+
  win('Record',record,{area:'record',h:'h3',keep:'rec'})
 );
}

function renderTraining(){
 const s=S();
 const table=s.roster.length?`<div class="well"><table class="grid"><thead><tr><th>Wrestler</th><th class="n">Ring</th><th class="n">Mic</th><th class="n">Psych</th><th class="n">Safe</th><th>Fatigue</th><th>Focus</th><th>Intensity</th></tr></thead><tbody>${s.roster.map(w=>{const [a,b]=trainSelects(w);return `<tr><td class="wrap" style="min-width:12ch;max-width:18ch"><button class="btn link" data-openw="${w.id}" title="${esc(trainNote(w))}">${esc(w.name)}</button></td><td class="n">${att(w.ring)}</td><td class="n">${att(w.mic)}</td><td class="n">${att(w.psych)}</td><td class="n">${att(w.safe)}</td><td>${bar(w.fatigue,fatKind(w.fatigue))} ${w.fatigue}</td><td>${a}</td><td>${b}</td></tr><tr class="session-row"><td colspan="8"><label class="session-field"><span>Session with Dennis</span>${sessionSelect(w)}</label><span class="dim">${esc(sessionNote(w))}</span></td></tr>`}).join('')}</tbody></table></div>`:`<div class="empty">Sign someone before planning training.<br><button class="btn sm" data-go="scouting">Free agents</button></div>`;
 const coach=s.coach?`<div class="well pad"><dl class="kv"><dt>Employed</dt><dd>${esc(G.COACHES[s.coach].name)}</dd><dt>Salary</dt><dd>${money(G.coachWage())} a week</dd><dt>Specialism</dt><dd>${esc(G.COACHES[s.coach].stat)} training +${Math.round(G.COACHES[s.coach].boost*100)}%</dd></dl></div><p style="margin-top:10px"><button class="btn red" data-firecoach="1">End contract</button></p>`
  :`<p class="lede">One specialist at a time. Wages are due even if nobody trains.</p><div class="well"><table class="grid"><thead><tr><th>Specialist</th><th class="n">Cost</th><th></th></tr></thead><tbody>${Object.entries(G.COACHES).map(([id,c])=>`<tr><td class="wrap">${esc(c.name)}<br><span class="dim">${esc(c.stat)} training +${Math.round(c.boost*100)}%</span></td><td class="n">${money(c.fee)}<br><span class="dim">${money(c.wage)}/wk</span></td><td class="n"><button class="btn sm" data-hirecoach="${id}" ${s.cash<c.fee?'disabled':''}>Hire</button></td></tr>`).join('')}</tbody></table></div>`;
 const cards=s.roster.map(w=>`<article class="phone-card"><div class="who">${face('wrestler',w.id,w.name)}<div><button class="btn link" data-openw="${w.id}">${esc(w.name)}</button><small>Fatigue ${w.fatigue} · ${esc(trainNote(w))}</small></div></div>${trainControls(w)}<p class="dim" style="margin:4px 0 0">${esc(sessionNote(w))}</p></article>`).join('');
 paint('s-split s-train',
  win('Training schedule',`<p class="lede">Set a focus and intensity once and it keeps running every week. Fixed blocks and camps are set from each wrestler’s profile. Dennis has time for ${G.SESSION_CAP} sessions a week across the stable: ${S().roster.filter(x=>x.session).length} booked.</p>${phoneList(table,cards)}`,{keep:'train',note:`Weekly bill ${money(G.trainingBill())}`})+
  win('Coaching staff',coach,{h:'h3',keep:'coach'})
 );
}

function renderScouting(){
 const s=S(),full=s.roster.length>=5;
 const rows=sortRows('free',s.free,WCOLS,{k:'fee',d:-1});
 if(phoneLayout()&&s.free.some(w=>w.id===route.id))selFree=route.id;
 if(!selFree||!s.free.some(w=>w.id===selFree))selFree=rows[0]?.id||null;
 const w=s.free.find(x=>x.id===selFree);
 const list=s.free.length?`<div class="well free-table"><table class="grid"><thead><tr>${FREE_SORTS.map(([key,label],i)=>th('free',key,label,i>=2?'n':'')).join('')}</tr></thead><tbody>${rows.map(x=>`<tr class="pick" data-self="${x.id}" aria-selected="${x.id===selFree}"><td><span class="who">${face('wrestler',x.id,x.name)}<span><b>${esc(x.name)}</b><small>${esc(x.tier)}</small></span></span></td><td>${esc(x.style)}</td>${FREE_STATS.map(([key])=>`<td class="n">${att(x[key])}</td>`).join('')}<td class="n">${money(x.wage)}</td><td class="n"><b>${money(x.fee)}</b></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nobody left on the market.</div>';
 const sort=sorts.free;
 const cards=rows.length?`<div class="free-cards"><div class="free-sort"><label class="field">Sort by<select data-free-sort>${FREE_SORTS.map(([key,label])=>`<option value="${key}" ${key===sort.k?'selected':''}>${label}</option>`).join('')}</select></label><button class="btn sm" data-sort="free:${sort.k}" aria-label="Reverse sort order">${sort.d>0?'Ascending ▲':'Descending ▼'}</button></div>
  ${rows.map(x=>`<button class="free-card" data-self="${x.id}" aria-pressed="${x.id===selFree}"><span class="who">${face('wrestler',x.id,x.name)}<span><b>${esc(x.name)}</b><small>${esc(x.tier)} · ${esc(x.style)}</small></span></span>
   <span class="free-stats">${FREE_STATS.map(([key,label])=>`<span><small>${label}</small>${att(x[key])}</span>`).join('')}</span><span class="free-costs"><span><small>Weekly wage</small>${money(x.wage)}</span><span><small>Signing fee</small>${money(x.fee)}</span></span></button>`).join('')}</div>`:'';
 let detail='<div class="empty">Select a wrestler.</div>';
 if(w){
  const can=s.cash>=w.fee&&!full;
  detail=`<div class="row" style="align-items:flex-start;gap:14px;flex-wrap:nowrap">${face('wrestler',w.id,w.name,'portrait x2')}<div><div style="font:36px/.9 var(--jersey);color:var(--blood)">${esc(w.name)}</div><div style="font-weight:600;margin:4px 0">“${esc(w.handle)}”</div><div class="chips"><span class="chip">${esc(w.tier)}</span><span class="chip">${esc(w.style)}</span></div></div></div>
  <p style="margin-top:10px">${esc(w.bio)}</p>
  <div class="well pad attrs">${[['Ring',w.ring],['Psychology',w.psych],['Safety',w.safe],['Mic',w.mic],['Heat',w.heat]].map(([l,v])=>`<div class="attr"><span>${l}</span>${att(v)}${bar(v,bandBar(v))}</div>`).join('')}</div>
  <p class="dim" style="margin-top:8px">${esc(temperament(w))} Finisher: ${esc(w.finisher)}.${esc(signatureText(w))}</p>
  ${ambitionLine(w)}${(()=>{const team=window.OfficeManagers?.wantedBy(w.id);return team?`<p class="bad" style="margin:6px 0 0">${esc(team.manager)} (${esc(team.name)}) means to sign ${esc(w.short)} next week.</p>`:''})()}
  <div class="facts" style="margin:10px 0"><div><small>Signing fee</small><b class="${s.cash<w.fee?'neg':''}">${money(w.fee)}</b></div><div><small>Weekly wage</small><b>${money(w.wage)}</b></div></div>
  <button class="btn go" style="width:100%;min-height:44px" data-sign="${w.id}" ${can?'':'disabled'}>Sign ${esc(w.short)}</button>
  <p class="dim" style="margin-top:6px">${full?'Your locker room is full. Release someone first.':s.cash<w.fee?`You have ${money(s.cash)}. Not enough for the fee.`:'Wages are paid every week, booked or not.'}</p>`;
 }
 paint('s-split'+phonePane(route.id,w?.id),
  win('Free agents',list+cards,{keep:'free',cls:'phone-master',note:full?'Locker room full':`Bank ${money(s.cash)}`})+
  win('Scouting report',detail,{h:'h3',keep:'scout',cls:'phone-inspector',actions:phoneBack('scouting','Free agents')})
 );
}

// v0.3.19 Rival stables: every agency's roster, how each wrestler feels about it, and an approach for those who want out.
let selTeam=null;
// Which belt a champion holds: the belt itself, small, with the promotion's name (full title on hover).
function champChips(w){return (w.belts||[]).map(b=>{const p=D.PROMOS.find(x=>x.id===b.pid);return `<span class="champ-chip" title="${esc(b.name)}"><img src="${esc(b.img)}" alt="" loading="lazy">${esc(p?.name||'')}</span>`}).join('')}
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
 const rows=team.wrestlers.map(w=>`<tr class="pick" data-go="stables" data-id="w:${w.id}" aria-selected="${w.id===sel?.id}"><td><span class="who">${face('wrestler',w.id,w.name)}<span><b>${esc(w.name)}</b>${champChips(w)}<small>${esc(w.tier)} · ${esc(w.style)}</small></span></span></td><td class="wrap">${esc(w.wants||'–')}</td><td><span class="${tone(w.mood)}">${esc(w.mood)}</span></td><td class="n">${left(w)}</td><td class="n">${money(w.fee)}</td></tr>`).join('');
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
 const options=s.roster.filter(w=>(!o.wid||o.wid===w.id)&&D.divisionOf(w)===div&&G.availableAt(w,o.eventAbs)&&!G.bookingConflict(w.id,o.rid,o.eventAbs)&&(!o.programme||o.programme.beats.every(b=>G.availableAt(w,b.at)&&!G.bookingConflict(w.id,b.rid,b.at))));
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
  <div class="well"><table class="grid"><thead><tr><th>Show</th><th>Opponent</th><th>Slot</th><th>Finish</th>${sel?'<th class="n">Purse</th>':''}</tr></thead><tbody>${P.beats.map(b=>`<tr><td>${weekLabel(b.at)}</td><td>${esc(name(b.rid))}${b.title?' <span class="tag">Title</span>':b.blowoff?' <span class="tag">Blow-off</span>':''}</td><td>${esc(D.SLOTS[b.slot].name)}</td><td>${finishTag(b.finish)}</td>${sel?`<td class="n">${money(G.purse({pid:o.pid,slot:b.slot,finish:b.finish,boost:o.boost},sel))}</td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function renderOffers(){
 const s=S(),income=s.card.reduce((t,c)=>t+c.purse,0),out=G.wages()+G.overhead()+G.trainingBill();
 const ledger=`<div class="facts"><div><small>Purses booked this week</small><b>${money(income)}</b></div><div><small>Wages, overheads, coaching</small><b>${money(-out)}</b></div><div><small>Net this week</small><b class="${income-out<0?'neg':'pos'}">${money(income-out)}</b></div><div><small>Meetings left</small><b>${s.focus} of 2</b></div></div>`;
 // Offers you can actually fill come first; ones nobody can take sink to the bottom, dimmed.
 const can=o=>offerPick(o).options.length>0;
 const offers=s.offers.slice().sort((a,b)=>can(b)-can(a)||a.eventAbs-b.eventAbs||a.expiresAbs-b.expiresAbs);
 if(phoneLayout()&&offers.some(o=>o.id===route.id))selOffer=route.id;
 if(!selOffer||!offers.some(o=>o.id===selOffer))selOffer=(offers.find(can)||offers[0])?.id||null;
 const rows=offers.map(o=>{const p=G.P(o.pid),f=G.F(o.rid),{sel}=offerPick(o);return `<tr class="pick${sel?'':' unbookable'}" data-selo="${o.id}" aria-selected="${o.id===selOffer}"${sel?'':' title="Nobody in your stable can take this booking."'}><td>${weekLabel(o.eventAbs)}<br><span class="dim">${o.eventAbs===G.abs()?'This week':o.expiresAbs>G.abs()?`Reply by ${weekLabel(o.expiresAbs)}`:''}</span></td><td class="wrap"><b>${esc(p.name)}</b>${o.tag?` <span class="tag hot">${esc(o.tag)}</span>`:''}${o.stip?` <span class="tag">${esc(window.OfficeStips.STIPS[o.stip].short)}</span>`:''}</td><td class="wrap offer-match">${offerWho(o,sel)}<br><span class="vs-line">v ${esc(f.name)}</span></td><td>${o.programme?`${o.programme.beats.length} matches<br><span class="dim">${esc(window.OfficeProgrammes?.TYPE_NAME[o.programme.type]||'Programme')}</span>`:`${esc(D.SLOTS[o.slot].name)}<br>${finishTag(o.finish)}`}</td><td class="n">${sel?money(o.programme?window.OfficeProgrammes.totalPurse(o,sel):G.purse(o,sel)):'<span class="dim">–</span>'}</td></tr>`}).join('');
 const list=!s.roster.length?`<div class="empty">You need someone under contract before you can take bookings.<br><button class="btn sm" data-go="scouting">Free agents</button></div>`
  :offers.length?`<div class="well"><table class="grid"><thead><tr><th>Show</th><th>Promoter</th><th>Match</th><th>Slot and finish</th><th class="n">Purse</th></tr></thead><tbody>${rows}</tbody></table></div>`
  :`<div class="empty">No offers left this week. Press Continue to move on.</div>`;
 let detail='<div class="empty">Select an offer.</div>';
 const o=offers.find(x=>x.id===selOffer);
 if(o&&s.roster.length){
  const p=G.P(o.pid),f=G.F(o.rid),{options,sel}=offerPick(o),negotiated=o.talk?.step==='done';
  const mins=D.SLOTS[o.slot].mins+(o.tag==='Blow-off'?5:0);
  detail=`<div class="row" style="flex-wrap:nowrap;gap:12px">${face('booker',p.id,p.voice,'portrait')}<div><div style="font:30px/.9 var(--jersey);color:var(--blood)">${esc(p.name)}</div><div class="dim">${esc(p.desc)}, ${esc(p.venue)}. Booker ${esc(p.voice)}.</div><div style="font-size:14px">Trust ${bar(p.trust,p.trust<30?'danger':p.trust>=65?'':'warn')} ${p.trust}</div></div></div>
  <div class="well matchup" style="margin-top:10px"><div class="side">${sel?face('wrestler',sel.id,sel.name,'portrait x2'):''}${options.length?`<select data-pick="${o.id}" aria-label="Wrestler for this offer" ${o.wid||o.talk?'disabled':''}>${options.map(w=>`<option value="${w.id}" ${sel?.id===w.id?'selected':''}>${esc(w.name)}</option>`).join('')}</select>`:'<span class="dim">Nobody free</span>'}</div><div class="vs">v</div><div class="side">${face('wrestler',f.id,f.name,'portrait x2')}<b>${esc(f.name)}</b><span class="dim">${esc(f.style)}</span></div></div>
  ${o.title?`<div class="title-line">${beltBadge(D.belt(o.title.pid,o.title.div))}<small>${o.tag==='Title defence'?'Your champion defends the belt.':'A shot at the champion.'} The promoter has already decided the result.</small></div>`:''}
  ${o.programme?programmePanel(o,sel):`<dl class="kv"><dt>Show</dt><dd>${weekLong(o.eventAbs)}</dd><dt>Slot</dt><dd>${esc(D.SLOTS[o.slot].name)}, ${mins} minutes</dd><dt>Finish</dt><dd>${finishTag(o.finish)}</dd>${o.stip?`<dt>Stipulation</dt><dd><span class="tag hot">${esc(stipName(o.stip))}</span></dd>`:''}<dt>Reply by</dt><dd>${weekLong(o.expiresAbs)}</dd></dl>`}
  ${sel?fitNotes(o,sel):''}
  ${o.programme&&options.length?`<div class="row" style="justify-content:space-between;margin-top:10px"><span class="purse">${money(window.OfficeProgrammes.totalPurse(o,sel))}</span><button class="btn go" style="min-height:44px;min-width:170px" data-book="${o.id}">Sign the programme</button></div><p class="dim" style="margin-top:6px">Signing books every date. Pull out of any of them and you walk out of the whole programme.</p>`:options.length?`<div class="row" style="justify-content:space-between;margin-top:10px"><span class="purse">${money(G.purse(o,sel))}</span><button class="btn go" style="min-height:44px;min-width:170px" data-book="${o.id}">${o.eventAbs>G.abs()?'Commit to date':'Book this week'}</button></div>
  <div class="row" style="margin-top:8px"><button class="btn" data-talkopen="${o.id}" ${!negotiated&&s.focus<1?'disabled':''}>${negotiated?'Read the conversation':'Negotiate with '+esc(p.voice)}</button><span class="dim" style="font-size:13px">${negotiated?`${esc(o.talk.verdict)}. ${esc(o.talk.detail)}`:`Uses one of ${s.focus} meetings left`}</span></div>`
  :`<p class="bad" style="margin-top:10px">${(()=>{const w=s.roster.find(w=>(!o.wid||w.id===o.wid)&&D.divisionOf(w)===D.divisionOf(o.rid));if(!w)return 'No wrestler in your stable is eligible for this division.';const dates=o.programme?o.programme.beats:[{at:o.eventAbs,rid:o.rid}];return esc(dates.map(b=>G.bookingConflict(w.id,b.rid,b.at)||(!G.availableAt(w,b.at)?w.short+' isn’t free on '+weekLabel(b.at)+'.':null)).find(Boolean)||'No suitable wrestler is free for every agreed date.');})()}</p>`}`;
 }
 const cards=s.roster.length?offers.map(o=>{
  const p=G.P(o.pid),f=G.F(o.rid),{sel}=offerPick(o);
  return `<button class="phone-card${sel?'':' unbookable'}" data-selo="${o.id}"><span class="phone-card-line"><b>${esc(p.name)}</b><span>${o.eventAbs===G.abs()?'This week':weekLabel(o.eventAbs)}</span></span><span>${sel?esc(sel.short)+' ':''}v ${esc(f.name)} · ${esc(D.SLOTS[o.slot].name)}</span><span class="phone-card-line"><small>${o.programme?`Programme, ${o.programme.beats.length} matches`:esc(D.FINISHES[o.finish].name)}</small><b>${sel?money(o.programme?window.OfficeProgrammes.totalPurse(o,sel):G.purse(o,sel)):'Unavailable'}</b></span></button>`;
 }).join(''):'';
 paint('s-offers'+phonePane(route.id,o?.id),
  win('Bookings this week',ledger,{area:'ledger',h:'h3',cls:'quiet phone-overview',body:'tight'})+
  win('Offers',phoneList(list,cards),{area:'list',keep:'offers',cls:'phone-master',note:'Promoters decide the finish. You can haggle the terms.'})+
  win('Offer',detail,{area:'detail',h:'h3',keep:'offer',cls:'phone-inspector',actions:phoneBack('offers','Offers')})
 );
}

function renderFixtures(){
 const s=S();
 const card=s.card.length?`<div class="well"><table class="grid"><thead><tr><th>Match</th><th>Promoter</th><th>Slot</th><th>Finish</th><th class="n">Purse</th><th></th></tr></thead><tbody>${s.card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank).map(c=>{const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);return `<tr><td><span class="who">${face('wrestler',w.id,w.name)}<span><b>${esc(w.name)} v ${esc(f.name)}</b><small>${c.minutes} minutes${c.tag?`, ${esc(c.tag)}`:''}</small></span></span></td><td>${esc(p.name)}</td><td>${esc(D.SLOTS[c.slot].name)}</td><td>${finishTag(c.finish)}</td><td class="n"><b>${money(c.purse)}</b></td><td class="n"><button class="btn link" data-unbook="${c.id}">${c.programme?'Withdraw from programme':'Pull out'}</button></td></tr>`}).join('')}</tbody></table></div><p class="dim" style="margin-top:8px">Ordinary cancellations cost 6 trust. Withdrawing from a programme cancels every remaining date and costs 15 trust. Continue takes you to ringside.</p>`
  :`<div class="empty">Nothing booked this week.<br><button class="btn sm" data-go="offers">See offers</button></div>`;
 const fut=s.futureBookings.slice().sort((a,b)=>a.eventAbs-b.eventAbs);
 const future=fut.length?`<div class="well"><table class="grid"><thead><tr><th>When</th><th>Match</th><th>Promoter</th><th class="n">Purse</th><th></th></tr></thead><tbody>${fut.map(c=>`<tr><td>${weekLabel(c.eventAbs)}</td><td>${esc(G.W(c.wid)?.name||'Departed wrestler')} v ${esc(G.F(c.rid).name)}<br><span class="dim">${esc(D.SLOTS[c.slot].name)}</span></td><td>${esc(G.P(c.pid)?.name||'')}</td><td class="n">${money(c.purse)}</td><td class="n"><button class="btn link" data-unbook="${c.id}">${c.programme?'Withdraw programme':'Cancel'}</button></td></tr>`).join('')}</tbody></table></div><p class="dim" style="margin-top:8px">Purses are paid after the match. Ordinary cancellations cost 6 trust. Withdrawing from a programme cancels every remaining date and costs 15 trust. A booked wrestler can’t attend camp that week.</p>`
  :'<div class="empty">No future dates signed.</div>';
 const cards=contracts=>contracts.map(c=>`<article class="phone-card"><div class="phone-card-line"><b>${esc(G.P(c.pid)?.name||'')}</b><small>${c.eventAbs===G.abs()?'This week':weekLabel(c.eventAbs)}</small></div><div>${esc(G.W(c.wid)?.name||'Departed wrestler')} v ${esc(G.F(c.rid).name)}</div><small>${esc(D.SLOTS[c.slot].name)} · ${esc(D.FINISHES[c.finish].name)}</small><div class="phone-card-line"><b>${money(c.purse)}</b><button class="btn sm" data-unbook="${c.id}">${c.programme?'Withdraw programme':'Pull booking'}</button></div></article>`).join('');
 paint('s-split even',win('This week’s card',phoneList(card,cards(s.card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank))),{keep:'card',note:`Week ${s.week}`})+win('Future dates',phoneList(future,cards(fut)),{h:'h3',keep:'future'}));
}

/* ======================= TERRITORY ======================= */
function renderPyramid(){
 const s=S(),t=OfficeTerritory.ensure(),[pid,dv]=String(route.id||'').split(':');
 const p=D.PROMOS.find(x=>x.id===pid)||D.PROMOS[0],div=D.DIVISIONS[dv]?dv:'men';
 const ranked=OfficeTerritory.promotionRank(p.id,div),held=OfficeTerritory.title(p.id,div),belt=D.belt(p.id,div);
 const tab=(id,label,on)=>`<button class="btn sm ${on?'go':''}" data-go="pyramid" data-id="${id}" aria-pressed="${on}">${esc(label)}</button>`;
 const tabs=`<div class="row" role="group" aria-label="Promotion" style="margin-bottom:6px">${D.PROMOS.map(x=>tab(x.id+':'+div,x.name,x.id===p.id)).join('')}</div>
  <div class="row" role="group" aria-label="Division" style="margin-bottom:10px">${D.DIVISION_ORDER.map(d=>tab(p.id+':'+d,D.DIVISIONS[d].name+' division',d===div)).join('')}</div>`;
 const champ=held?.holder?G.W(held.holder)||G.F(held.holder):null;
 const label=w=>`<span class="pent ${w.owned?'mine':''} ${w.champion?'champ':''}"><b>${esc(w.name)}${w.champion?' <span class="tag">Champion</span>':''}</b><small>${esc(w.owned?'Your stable':w.stable||'Independent')} · ${w.score} pts</small></span>`;
 const hero=`<div class="belt-hero well"><img class="belt-img" src="${esc(belt.img)}" alt="${esc(belt.name)} belt"><div><small class="dim">${esc(belt.name)}</small><b>${champ?esc(champ.name):'Vacant'}</b>${champ?`<small>${G.W(champ.id)?'Your stable':esc(OfficeTerritory.stableFor(champ.id)?.name||'Independent')} · ${held.defences} ${plural(held.defences,'defence')}</small>`:''}</div></div>`;
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
  win('Champions',`${belts}<h3 class="section-h" style="margin-top:12px">Rival stables</h3>${teams}<h3 class="section-h" style="margin-top:12px">Circuit news</h3>${news?`<ul class="fulllog well" style="color:var(--white)">${news}</ul>`:'<p class="dim">Other promotions report their results after you advance the week.</p>'}`,{h:'h3',keep:'rivals'})
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
 return `<span class="${tone}"><b>${esc(v.tone)}</b> ${arrow}</span><br><span class="dim">Crowd ${v.crowd} (usual ${v.base}) · Buzz ${v.buzz} · ${money(v.money)}</span>`;
}
function renderPromoters(){
 const s=S();
 const table=`<div class="well"><table class="grid"><thead><tr><th>Promoter</th><th>Wants</th><th class="n">Reach</th><th>Business</th><th>Trust</th><th class="n">Matches</th><th class="n">Best</th><th>Status</th></tr></thead><tbody>${s.promoters.map(p=>{
  const state=promoterState(p,s.rep);
  return `<tr><td><span class="who">${face('booker',p.id,p.voice)}<span><b>${esc(p.name)}</b><small>${esc(p.desc)}. Booker ${esc(p.voice)}.</small></span></span></td><td>${esc(planFor(p).name)}</td><td class="n">${att(p.reach)}</td><td class="wrap">${bizCell(p)}</td><td>${bar(p.trust,p.trust<30?'danger':p.trust>=65?'':'warn')} ${p.trust}</td><td class="n">${p.matches}</td><td class="n"><span class="stars">${p.best?starsText(p.best):'–'}</span></td><td><span class="${state.tone}">${esc(state.text)}</span></td></tr>`;
 }).join('')}</tbody></table></div>`;
 const cards=s.promoters.map(p=>`<article class="phone-card"><div class="who">${face('booker',p.id,p.voice)}<div><b>${esc(p.name)}</b><small>${esc(p.voice)} · ${esc(p.desc)}</small></div></div><div class="phone-card-line"><span>${esc(planFor(p).name)}</span><b>Trust ${p.trust}</b></div><small>Reach ${p.reach} · ${p.matches} matches · Best ${p.best?starsText(p.best):'–'}</small><small>${bizCell(p)}</small><small>${esc(promoterState(p,s.rep).text)}</small></article>`).join('');
 paint('s-full',win('Promoters',phoneList(table,cards)+'<p class="dim" style="margin-top:8px">Trust rises when you deliver what a promoter asked for and falls when you pull out or break a finish. A promotion drawing well reaches more people and pays better; one that is struggling pays less and books desperately.</p>',{keep:'proms'}));
}
// v0.3.15 Each booker's plans: the storylines on the board and how the last ones ended.
function yourProgrammes(p){
 const v=window.OfficeProgrammes?.view(p.id);if(!v||!(v.live.length||v.done.length))return '';
 const line=x=>{const next=x.beats.find(b=>!b.done&&!b.missed),a=window.OfficeProgrammeArcs?.record(x.id)?.arc,last=a?.timeline?.at(-1);return `<li class="${x.status==='kept'?'up':x.status==='live'?'':'down'}"><b>${esc(x.wName)}</b> · ${esc(x.typeName)} v ${esc(x.rName)} · ${x.status==='live'?(next?`next ${weekLabel(next.at)}, ${x.beats.filter(b=>b.done).length} of ${x.beats.length} played`:'finishing'):esc(x.text||x.status)}${a?`<small class="arc-recap">${esc(a.conclusion||window.OfficeProgrammeArcs.band(a.momentum))}${last?' · '+esc(last.recap):''}</small>`:''}</li>`;};
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
 const live=v.live.length?`<div class="story-grid">${v.live.map(card).join('')}</div>`:`<div class="empty">Nothing on the board this week. ${esc(p.voice)} is planning.</div>`;
 const done=v.done.length?`<ul class="cons">${v.done.map(x=>`<li class="${x.status==='dropped'?'':'up'}"><b>${esc(x.typeName)}</b> · ${esc(x.text||'')} <span class="dim">${x.ended?weekLabel(x.ended):''}</span></li>`).join('')}</ul>`:'<p class="dim">No storyline has finished here yet.</p>';
 const M=window.OfficeManagers,pushing=M?.lobbyAt(p.id)||[];
 const lobby=pushing.length?`<ul class="cons">${pushing.map(l=>`<li><b>${esc(l.manager)}</b> (${esc(l.team)}) is pushing <b>${esc(l.name)}</b>${l.want?` · wants ${esc(l.want.toLowerCase())}`:''}</li>`).join('')}</ul>`:'<p class="dim">No manager is working this booker this week.</p>';
 paint('s-full',win('Booking sheets',`${tabs}${head}<h3 class="section-h">On the board</h3>${live}${yourProgrammes(p)}<h3 class="section-h">Managers in the booker’s ear</h3>${lobby}<h3 class="section-h">How the last ones ended</h3>${done}<p class="dim" style="margin-top:8px">Bookers plan the circuit’s matches around these storylines and choose who wins to serve them. They do not always stick to the plan.</p>`,{keep:'sheets',note:esc(p.name)}));
}
function renderRivalries(){
 const s=S(),feuds=Object.values(s.feuds).filter(f=>f.heat>0||f.closed).sort((a,b)=>b.heat-a.heat);
 const info=feuds.map(f=>{
  const w=G.W(f.wid)||D.TALENT.find(x=>x.id===f.wid);
  const ready=f.heat>=70&&f.matches>=2&&!f.closed;
  return {...f,matchup:(w?.name||'Former wrestler')+' v '+(G.F(f.rid)?.name||f.rid),ready,
   state:f.closed?'Finished':ready?'Ready for the blow-off':'Building',angle:f.angle||'The score will be settled in the ring.'};
 });
 const rows=info.map(f=>`<tr><td><b>${esc(f.matchup)}</b></td><td>${bar(f.heat,f.heat>=70?'gold':'')} ${f.heat}</td><td class="n">${f.matches}</td><td class="n">${f.segments||0}</td><td><span class="${f.ready?'good':''}">${esc(f.state)}</span></td><td class="wrap">${esc(f.angle)}</td></tr>`).join('');
 const cards=info.map(f=>`<article class="phone-card"><b>${esc(f.matchup)}</b><span class="phone-card-line"><span>Heat ${f.heat}</span><small>${esc(f.state)}</small></span><small>${f.matches} matches · ${f.segments||0} promos</small><span>${esc(f.angle)}</span></article>`).join('');
 const intro='Every wrestler gets microphone time before their match. Your promo approach affects the crowd, their personal rivalry and potential rematch interest. Heat cools between appearances; build it towards the blow-off.';
 const table=info.length?`<div class="well"><table class="grid"><thead><tr><th>Rivalry</th><th>Heat</th><th class="n">Matches</th><th class="n">Promos</th><th>Status</th><th>Latest angle</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty">No rivalries yet. Book a match to begin a storyline, then choose a microphone approach before the bell.</div>';
 paint('s-full',win('Rivalries',`<p class="lede">${esc(intro)}</p>${phoneList(table,cards)}`,{keep:'feuds'}));
}
function renderResults(){
 const s=S();
 const cards=s.history.map((x,i)=>`<button class="phone-card" data-replay="${i}"><span class="phone-card-line"><small>S${x.season} W${x.week} · ${esc(x.promoter)}</small><b>${starsText(x.stars)||'DUD'}</b></span><span>${esc(x.name)} v ${esc(x.foe)}</span><small>Crowd ${x.crowd} · Purse ${money(x.purse)}</small></button>`).join('');
 const table=s.history.length?`<div class="well"><table class="grid"><thead><tr><th>When</th><th>Match</th><th>Promoter</th><th>Finish</th><th class="n">Rating</th><th class="n">Crowd</th><th class="n">Paid</th></tr></thead><tbody>${s.history.map((x,i)=>`<tr class="pick" data-replay="${i}"><td>S${x.season} W${x.week}</td><td><b>${esc(x.name)} v ${esc(x.foe)}</b></td><td>${esc(x.promoter)}</td><td>${x.outcome==='double'?'<span class="tag hot">Double-cross</span>':x.outcome==='nc'?'<span class="tag">No contest</span>':finishTag(x.finish)}</td><td class="n"><span class="stars">${starsText(x.stars)||'DUD'}</span></td><td class="n">${x.crowd}</td><td class="n">${money(x.purse)}</td></tr>`).join('')}</tbody></table></div><p class="dim" style="margin-top:8px">Select a match to read the commentary.</p>`:'<div class="empty">No matches yet.</div>';
 paint('s-full',win('Results',`<h3 class="section-h">Season ${s.season} so far</h3>${seasonChart()}${phoneList(table,cards)}`,{keep:'res',note:`${s.history.length} ${plural(s.history.length,'match','matches')}`}));
}
function renderGame(){
 const saved=G.saveStatus(),status=saved.ok===false?'Save FAILED — recent changes are not stored. Export your career immediately.':saved.ok===true?'Last saved successfully in this session at '+new Date(saved.lastSaved).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})+'.':'No save confirmation this session.';
 paint('s-split even',
  win('Save and load',`<p class="lede">Your career saves automatically in this browser after every action. Export a save file to move it to another device or browser.</p><p class="${saved.ok===false?'bad':'dim'}" role="status">${esc(status)}</p><div class="row"><button class="btn" data-act="export">Export save</button><button class="btn" data-act="import">Import save</button></div><h3 class="section-h" style="margin-top:20px">Start over</h3><p class="dim">Overwrites the current career.</p><button class="btn red" data-act="newgame">Start a new career</button>`)+
  win('How a week works',`<ol style="margin:0;padding-left:1.3em;display:grid;gap:8px"><li>Read the inbox. Some messages need a decision before you can continue.</li><li>Set training for each wrestler. Rest anyone who is tired.</li><li>Book wrestlers onto offers. Promoters set the finish; negotiate the fee, billing or a protected loss using a management meeting.</li><li>Press Continue. Choose the match plan and your wrestler’s promo approach, hear both wrestlers speak, then work the match with up to three calls from ringside.</li><li>Wages and costs are paid, and the next week’s offers arrive.</li></ol><p class="dim" style="margin-top:12px">At ringside, Space pauses and keys 1 to 6 make calls.</p>`,{h:'h3'})
 );
}

/* ======================= CONVERSATIONS ======================= */
function renderPrivateMeeting(id){
 const w=G.W(id);if(!w)return;const d=$('#modal');delete d.dataset.talkoid;const s=S();
 d.innerHTML=`<header class="tbar"><h2>Private meeting: ${esc(w.name)}</h2></header><div class="dlg"><p>${esc(w.bio)}</p><div class="terms-compare"><div><small>Morale</small><b>${w.morale}</b></div><div><small>Loyalty</small><b>${w.loyal}</b></div></div><p class="dim">Uses one of your ${s.focus} management meetings left this week, which means one less chance to haggle with a promoter.</p><div class="talk-actions"><button class="choice" data-private="listen" data-wid="${id}" ${s.focus===0?'disabled':''}><b>Listen and reassure</b><span>No promise. Morale +5, loyalty +4.</span></button><button class="choice" data-private="promise" data-wid="${id}" ${s.focus===0||w.promise?.status==='open'?'disabled':''}><b>Promise a featured match</b><span>Morale +8 now. Book a feature or main event within two weeks, or lose 14 morale and 12 loyalty.</span></button><button class="choice" data-private="bonus" data-wid="${id}" ${s.cash<120||s.focus===0?'disabled':''}><b>Pay a £120 loyalty bonus</b><span>Morale +6, loyalty +9. Guaranteed, but not cheap.</span></button></div></div><div class="foot"><button class="btn" data-dlg="close">Leave it for now</button></div>`;
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
 const o=res.offer,t=res.talk,w=G.W(wid),p=G.P(o.pid),f=G.F(o.rid),d=$('#modal');d.dataset.talkoid=oid;
 // One "on the table" panel: what the sign button will book, with anything the meeting changed struck through.
 const orig=t.original,cur={slot:o.slot,finish:o.finish,fee:G.purse(o,w)},done=t.step==='done';
 const changed=orig.slot!==cur.slot||orig.finish!==cur.finish||orig.fee!==cur.fee||(t.topic==='stip'&&(o.stip||null)!==(t.original.stip||null));
 const slotN=k=>esc(D.SLOTS[k].name),finN=k=>esc(D.FINISHES[k].name);
 const line=(label,a,b)=>a===b?`<div><dt>${label}</dt><dd>${b}</dd></div>`:`<div class="changed"><dt>${label}</dt><dd><s>${a}</s> <b>${b}</b></dd></div>`;
 const chip=!done?['','Original offer']:t.verdict==='agreed'?['good','Agreed']:t.verdict==='counter'?['warn','Counteroffer']:t.verdict==='refused'?['bad','Refused']:['','Original offer'];
 const deal=`<section class="deal${changed?' is-new':''}"><header><small>${changed?'New terms on the table':'On the table'}</small><span class="deal-chip ${chip[0]}">${chip[1]}</span></header><dl>${line('Slot',slotN(orig.slot),slotN(cur.slot))}${line('Finish',finN(orig.finish),finN(cur.finish))}${(o.stip||t.original.stip)?line('Stipulation',esc(stipName(t.original.stip)||'None'),esc(stipName(o.stip)||'None')):''}${line('Fee',money(orig.fee),money(cur.fee))}</dl></section>`;
 const reply=`Reply by ${weekLabel(o.expiresAbs)}`;
 const transcript=t.log.map(x=>`<div class="talk-line"><b>${esc(x.who)}</b><p>${esc(x.text)}</p></div>`).join('');
 let opts='';
 if(t.step==='start')opts=`<div class="talk-actions"><p>What are you asking ${esc(p.voice)} to change?</p><button class="choice" data-talkaction="ask:fee" data-oid="${oid}" data-wid="${wid}"><b>Increase the fee</b><span>Ask for 20% more. A counteroffer may be smaller.</span></button>${o.finish==='lose_clean'?`<button class="choice" data-talkaction="ask:protect" data-oid="${oid}" data-wid="${wid}"><b>Protect the loss</b><span>Keep the loss, but make it competitive. Expect lower pay.</span></button>`:''}${o.slot!=='main'?`<button class="choice" data-talkaction="ask:slot" data-oid="${oid}" data-wid="${wid}"><b>Better billing</b><span>A higher spot on the card, possibly for less money.</span></button>`:''}${stipAsks(o,w,oid,wid)}</div>`;
 else if(t.step==='reason')opts=`<div class="talk-actions"><p>Make your argument. Trust, ${esc(w.short)}’s reputation, the crowd and the promoter’s priorities all count.</p><button class="choice" data-talkaction="arg:crowd" data-oid="${oid}" data-wid="${wid}"><b>Business case</b><span>${esc(w.short)} brings viewers. Stronger with a popular wrestler and a showman booker.</span></button><button class="choice" data-talkaction="arg:reliability" data-oid="${oid}" data-wid="${wid}"><b>Track record</b><span>Dependable work and a clean finish. Suits a traditional booker.</span></button><button class="choice" data-talkaction="arg:trade" data-oid="${oid}" data-wid="${wid}"><b>Financial compromise</b><span>Give ground on money for a better opportunity.</span></button></div>`;
 else opts=`<p class="talk-next">${changed?`Sign the new terms, take the original offer instead, or leave it. Nothing is booked until you sign.`:`The original offer stands. Sign it or leave it; nothing is booked until you sign.`}</p>`;
 // Every footer button says what it does: what gets signed, or that nothing does.
 const btn=(cls,attrs,label,sub)=>`<button class="btn two ${cls}" ${attrs}><span>${label}</span><small>${sub}</small></button>`;
 const ids=`data-oid="${oid}" data-wid="${wid}"`;
 const later=btn('later','data-dlg="close"','Decide later',t.step==='start'?`Nothing signed. No meeting used. ${reply}`:changed?`Nothing signed. New terms held. ${reply}`:`Nothing signed. ${reply}`);
 const signOrig=done&&changed?btn('',`data-talkbook="${oid}" data-revert="1" ${ids}`,`Sign original, ${money(orig.fee)}`,`${slotN(orig.slot)}, ${finN(orig.finish).toLowerCase()}`):'';
 const signCur=btn('go',`data-talkbook="${oid}" ${ids}`,done?`Sign for ${money(cur.fee)}`:`Sign as offered, ${money(cur.fee)}`,`${slotN(cur.slot)}, ${finN(cur.finish).toLowerCase()}${o.stip?', '+esc(stipName(o.stip).toLowerCase()):''}`);
 d.innerHTML=`<header class="tbar"><h2>${esc(p.name)}: meeting with ${esc(p.voice)}</h2></header><div class="dlg"><p><b>${esc(w.name)} v ${esc(f.name)}</b></p>${deal}<div class="talk-log well">${transcript}</div>${opts}</div><div class="foot">${later}${signOrig}${signCur}</div>`;
 if(!d.open)d.showModal();const lg=d.querySelector('.talk-log');if(lg)lg.scrollTop=lg.scrollHeight;(done?d.querySelector('.btn.go'):d.querySelector('[data-talkaction]'))?.focus();
}
function dialog(title,html,buttons=[['Close','close']]){
 const d=$('#modal');delete d.dataset.talkoid;
 d.innerHTML=`<header class="tbar"><h2>${esc(title)}</h2></header><div class="dlg">${html}</div><div class="foot">${buttons.map(([l,a,c])=>`<button class="btn ${c||''}" data-dlg="${a}">${l}</button>`).join('')}</div>`;
 d.showModal();return d;
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
 if(G.pending().length){openMsg=G.pending()[0].id;go('inbox',phoneLayout()?openMsg:null);toast('Reply to the messages marked in red first.');return}
 if(s.card.length){startNight();return}
 if(!s.roster.length&&s.week===1){go('scouting');toast('Sign a wrestler first.');return}
 G.endWeek();
 if(s.over){gameOver();return}
 openMsg=null;past=[];ahead=[];route={s:'desk',id:null};render(true);
 toast(`Week ${s.week}. ${s.offers.length} ${plural(s.offers.length,'offer')} on the table.`);
}
function gameOver(){
 dialog('The office is closed',`<p>The bank has called in your overdraft. After ${S().season>1?S().season-1+' seasons and ':''}${S().history.length} matches, the territory goes on without you.</p>`,[['Start again','newgame','go']]);
}

/* ======================= MATCH NIGHT ======================= */
const NIGHT_STORE='the-office-v23-match'; // same key: preserve existing mid-match saves
function persistNight(){
 if(!night?.queue)return;
 try{const m=night.M?{...night.M,rState:night.M.r?.getState?.()}:null;
 localStorage.setItem(NIGHT_STORE,JSON.stringify({queue:night.queue,i:night.i,speed:night.speed,results:night.results,before:night.before||null,resultHTML:night.stage==='result'?night.resultHTML||null:null,plan:night.plan,promo:night.promo,mouth:night.mouth||null,signing:night.signing||null,after:night.after||null,stage:night.stage||'prep',M:m,past:night.past||[]}));
 }catch(e){console.warn('Match autosave failed',e)}
}
function clearNight(){try{localStorage.removeItem(NIGHT_STORE)}catch(e){}}
function openTV(){$('#toast').classList.remove('show');$('#tv').hidden=false;document.body.style.overflow='hidden'}
function resumeNight(){
 let saved=null;try{saved=JSON.parse(localStorage.getItem(NIGHT_STORE)||'null')}catch(e){}
 // After the last match the card is empty, but a post-match segment still waiting for its last word comes back.
 const afterOpen=saved?.stage==='after'&&saved.after?.stage==='mic';
 const resultOpen=saved?.stage==='result'&&!!saved.resultHTML;
 if(!saved||!Array.isArray(saved.queue)||(!S()?.card?.length&&!afterOpen&&!resultOpen))return false;
 night={...saved,paused:true};
 if(afterOpen){openTV();showAfter();return true}
 if(resultOpen){openTV();$('#tv').innerHTML=saved.resultHTML;return true}
 if(night.i>=night.queue.length){endNight();return true}
 openTV();
 if(saved.stage==='live'&&saved.M){
  const restored=Mx.restore(saved.M);
  bell();clearTimeout(night.timer);night.M=restored;night.past=saved.past||[];night.paused=true;
  updateLive();const last=restored.log?.[restored.log.length-1];if(last)showLine(last,true);
  if(restored.decision&&!restored.queue.length)showDecision();
 }else if(saved.stage==='after'&&saved.after)showAfter();else if(saved.stage==='signing')showSigning();else if(saved.stage==='promo'||saved.stage==='mouth')showPromos();else if(saved.stage==='meeting')showMeeting();else prep();
 persistNight();return true;
}
const SPEED={slow:{line:2600,pause:1100},normal:{line:1500,pause:750},fast:{line:520,pause:260},skip:{line:0,pause:0}};
function startNight(){
 night={queue:S().card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank).map(c=>c.id),i:0,speed:night?.speed||'normal',results:[],before:OfficeNightReport.capture(S())};
 openTV();night.stage='prep';prep();persistNight();
}
function current(){return S().card.find(c=>c.id===night.queue[night.i])}
function strip(c,label){const p=G.P(c.pid);return `<div class="strip"><b>${esc(p.name)} ${label||'live'}</b><span>${esc(p.venue)}</span><span class="r">Match ${Math.min(night.i+1,night.queue.length)} of ${night.queue.length}</span></div>`}
function cmpRow(label,a,b){const up=a>b;return `<div class="cmpr"><span class="v ${up?'up':''}">${a}</span><span class="l"><i style="width:${a}%"></i></span><span class="lab">${label}</span><span class="r"><i style="width:${b}%"></i></span><span class="v r2">${b}</span></div>`}
function prep(){
 // v3.6: match night opens backstage. The game plan is the first thing Dennis asks about.
 const c=current();if(!c)return endNight();
 const w=G.W(c.wid);
 night.plan=night.plan&&night.plan.cid===c.id?night.plan:{cid:c.id,game:D.STYLE_PLAN[w.style],leash:w.psych>=75&&w.ego<75?'free':'script',talk:'none'};
 return showMeeting();
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
function afterPicker(c,w,f){
 if(!window.OfficeAfter)return '';
 const on=night.plan?.after||'none';
 return `<h3 class="section-h after-h">After the bell</h3><p class="dim">${esc(OfficeRoom.AGENT)}: “And when it’s over? Decide now. They need to know before they go out.”</p><div class="picks after-picks">${OfficeAfter.plans(c,w,f).map(o=>`<button class="decision-option${o.id===on?' on':''}" data-afterplan="${esc(o.id)}" aria-pressed="${o.id===on}"><b>${esc(o.label)}</b><span>${esc(o.hint)}</span>${tagChips(o.tags)}</button>`).join('')}</div>`;
}
function afterNext(){const more=night.i<night.queue.length;return `<button class="btn go" data-tv="${more?'next':'done'}">${more?'Next match':'Back to the office'}</button>`}
function showAfter(){
 const st=night.after;if(!st)return night.i<night.queue.length?prep():endNight();
 const w=G.W(st.c.wid)||D.findWrestler(st.c.wid),f=G.F(st.c.rid)||D.findWrestler(st.c.rid),p=G.P(st.c.pid);
 const v=OfficeAfter.view(st);night.stage='after';
 const entries=v.log.map(e=>({who:e.who,side:e.side==='stage'?'c':e.side,text:e.text}));
 const cons=v.cons.length?`<h3 class="section-h">What it did</h3><ul class="cons">${v.cons.map(x=>`<li class="${x.tone>0?'up':x.tone<0?'down':''}">${esc(x.text)}</li>`).join('')}</ul>`:'';
 const decide=v.stage==='mic'?`<div class="decide2"><h3 class="section-h">${esc(v.title)}</h3><p class="lede">${esc(v.ask)}</p>${pickCards(v.options,'aftermic')}</div>`:'';
 const middle=`<b class="fin">${esc(v.plan==='none'?'Straight to the microphone':v.planLabel)}</b><span>${esc(p?.venue||'')}</span>`;
 $('#tv').innerHTML=`<div class="strip"><b>${esc(p?.name||'')}: after the bell</b><span>${esc(w?.name||'')} v ${esc(f?.name||'')}</span><span class="r">Match ${night.i} of ${night.queue.length}</span></div><div class="stage screen s-back">${win('After the bell',matchupBar({},w,f,middle)+sceneLog(entries,'afterTalk',w,f,p?.id)+decide+cons,{h:'h3',body:'tight'})}</div><div class="tv-foot"><span class="dim">${esc(v.stage==='mic'?'The microphone is live.':'The crowd starts filing out.')}</span>${v.stage==='mic'?'':afterNext()}</div>`;
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

/* ---------- the mouthpiece (v0.3.25) ---------- */
function showMouthpiece(c,w,f,p,talkers){
 night.stage='mouth';
 const opts=[{id:'none',label:w.short+' talks for themselves',hint:w.short+'’s own voice, mic '+w.mic+'.',tags:w.mic<45?['Risky']:['Safe']},
  ...talkers.map(x=>({id:x.id,label:x.short+' does the talking',hint:'Mic '+x.mic+' against '+w.short+'’s '+w.mic+'. '+(x.refuse||x.note||'')+(x.ego?' '+x.ego:''),tags:x.refuse?['Refuses']:['Better talker','Builds a bond',...(x.ego?['Ego risk']:[]),'They will mock it']}))]
  .filter(o=>!/Refuses/.test(o.tags.join()));
 const body=matchupBar(c,w,f,'<b class="fin">Who talks?</b>')+`<div class="decide2"><h3 class="section-h">Who has the microphone?</h3><p class="lede">${esc(OfficeRoom.AGENT)}: “${esc(w.short)} isn’t the best talker in the stable. Do we send somebody out to do it for them?”</p>${pickCards(opts,'mouth')}</div>`;
 $('#tv').innerHTML=strip(c,'microphone time')+'<div class="stage screen s-back">'+win('Before the promo',body,{h:'h3',body:'tight'})+'</div><div class="tv-foot"><span class="dim">A mouthpiece speaks; the wrestler is held to it.</span></div>';
 persistNight();
}

/* ---------- backstage and the promo duel ---------- */
const FINISH_WORDS={win_clean:'wins clean',win_dirty:'wins dirty',lose_protected:'loses, protected',lose_clean:'loses clean',win_dq:'wins by DQ',lose_dq:'loses by DQ',dq:'disqualified',nc:'no contest'};
function signatureText(w){const A=window.OfficeMatch?.GRAPH?.A||{},list=(D.PROFILES[w.id]?.signature||[]).map(id=>A[id]?.name).filter(Boolean);
 return list.length?' Known for: '+list.join(', ')+'.':'';}
function beatLabel(x){if(x.startsWith('outcome_')){const k=x.slice(8);return 'finish: '+(FINISH_WORDS[k]||k.replace(/_/g,' '));}
 const n=window.OfficeMatch?.GRAPH?.A?.[x];if(n?.name)return n.counterOf?'reversal of the '+n.name:n.blockOf?'blocked '+n.name:n.name;return x.replace(/_/g,' ');}
function scrollTalk(id){const el=document.getElementById(id);if(el)el.scrollTop=el.scrollHeight;if(phoneLayout())$('#tv').scrollTop=0}
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
 return `<div class="scene" id="${id}" tabindex="0" aria-label="Conversation">${entries.map(row).join('')}</div>`;
}
function pickCards(options,attr,compact){
 // In the duel there are five options at once, so hints are cut to their first sentence.
 const brief=t=>compact?String(t||'').split(/(?<=[.!?])\s/)[0]:t;
 return `<div class="picks${compact?' five':''}">${options.map(o=>`<button class="decision-option" data-${attr}="${esc(o.id)}"><b>${esc(o.label)}</b>${o.hint?`<span>${esc(brief(o.hint))}</span>`:''}${tagChips(o.tags)}</button>`).join('')}</div>`;
}
function matchupBar(c,w,f,middle,wNote,fNote){
 return `<div class="match-night-matchup"><div class="mu you">${face('wrestler',w.id,w.name,'portrait x2')}<div><b>${esc(w.short)}</b>${wNote||''}</div></div><div class="mid">${middle}</div><div class="mu them"><div><b>${esc(f.short)}</b>${fNote||''}</div>${face('wrestler',f.id,f.name,'portrait x2')}</div></div>`;
}
function showMeeting(){
 const c=current();if(!c)return endNight();
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid),P=night.plan,S0=S();
 if(!P.room||P.room.cid!==c.id||P.room.v!==3){
  P.room=OfficeRoom.begin(c,w,f,p,{recent:S0.roomRecent||[],threads:OfficeRoom.liveThreads(S0.roomThreads,c.eventAbs??G.abs()),heat:G.feud(w.id,f.id)?.heat||0,rehearsed:G.rehearsed(w)});P.sheet=null;P.confirmed=false;
 }
 const st=P.room,v=OfficeRoom.view(st);
 if(v.stage==='done'&&!P.confirmed){
  P.sheet=st.sheet;P.confirmed=true;P.game=st.sheet.game;P.talk=st.sheet.talk;if(st.sheet.leash)P.leash=st.sheet.leash;
  S0.roomRecent=[...(S0.roomRecent||[]),...st.queue].slice(-6);G.save();
 }
 const finishLine={win_clean:`${w.short} wins clean`,win_dirty:`${w.short} wins dirty`,lose_protected:`${w.short} loses, protected`,lose_clean:`${w.short} loses clean`,win_dq:`${w.short} wins by DQ`,lose_dq:`${w.short} is disqualified`}[c.finish];
 const moodCls=x=>x.value>=62?'good':x.value>=50?'':'bad';
 const wNote=`<span class="${moodCls(v.moods.w)}">${esc(v.moods.w.word)}</span>${w.fatigue>=45?'<span class="bad">tired</span>':''}${w.morale<35?'<span class="bad">low morale</span>':''}`;
 const fNote=`<span class="${moodCls(v.moods.f)}">${esc(v.moods.f.word)}</span>${f.safe<55?'<span class="bad">careless</span>':''}${f.ego>=68?'<span class="bad">big ego</span>':''}${f.psych>=85?'<span class="good">storyteller</span>':''}`;
 const middle=`<b class="fin">${esc(finishLine)}</b><span>${c.stip?esc(stipName(c.stip))+' · ':''}${esc(D.SLOTS[c.slot].name)} · ${st.sheet?.minutes||Math.max(5,c.minutes+(st.fx.minutes||0))} minutes · ${esc(p.name)}</span>`;
 const verdictBad=v.story?.notes?.some(n=>!n.good);
 const agreed=v.agreed.length&&v.stage!=='board'?`<div class="sheetline"><b>In the match layout</b>${v.agreed.map(x=>`<i>${esc(x)}</i>`).join('')}${v.story&&v.stage!=='board'?`<i class="${verdictBad?'bad':'good'}">${esc(OfficeRoom.AGENT)}: ${esc(v.story.verdict)}</i>`:''}</div>`:'';
 // The running order: four beats down the side, the pitches for each across, Dennis's pencil already in.
 const board=v.board?`<div class="decide2 runorder"><h3 class="section-h">${esc(v.title)} <small>${v.step} of ${v.total}</small></h3><p class="lede">${esc(v.ask)}</p>
  <div class="rorder">${v.board.map(r=>`<div class="rorder-row" role="group" aria-label="${esc(r.name)}"><div class="rorder-slot"><b>${esc(r.name)}</b><small>${esc(r.ask)}</small></div><div class="rorder-picks">${r.cards.map(c=>`<button class="decision-option rorder-pick${c.selected?' on':''}" data-room="${esc(c.id)}" aria-pressed="${c.selected}"><b>${esc(c.label.charAt(0).toUpperCase()+c.label.slice(1))}</b><span>${esc(c.who)}’s idea</span>${tagChips(c.tags)}</button>`).join('')}</div></div>`).join('')}</div>
  <div class="rorder-foot"><p class="rorder-verdict ${verdictBad?'bad':'good'}"><b>${esc(OfficeRoom.AGENT)}:</b> ${esc(v.story.verdict)}</p><button class="btn go" data-room="board_ok">Agree the running order</button></div></div>`:'';
 const decide=board||(v.stage==='done'?`<div class="decide2"><h3 class="section-h">Signed</h3><p class="lede">What is in the match layout is what they will try to do. Whether they manage it is another matter.</p>${arcPicker(c)}${cornerPicker(c,w,f)}${afterPicker(c,w,f)}</div>`:
  `<div class="decide2"><h3 class="section-h">${esc(v.title)} <small>${v.step} of ${v.total}</small></h3><p class="lede">${esc(v.ask)}</p>${pickCards(v.options,'room')}</div>`);
 const body=matchupBar(c,w,f,middle,wNote,fNote)+sceneLog(v.log,'roomTalk',w,f,p.id)+decide+agreed;
 const signing=window.OfficeSigning?.eligible(c);
 const nextBtn=v.stage!=='done'?`<span class="dim">${esc(v.title)}</span>`:signing?'<button class="btn go" data-tv="signing">To the contract signing</button>':st.sheet.skipPromo?'<button class="btn go" data-tv="bell">Ring the bell</button>':'<button class="btn go" data-tv="promos">To the microphone</button>';
 $('#tv').innerHTML=strip(c,'backstage')+'<div class="stage screen s-back">'+win('Backstage with '+OfficeRoom.AGENT+', your road agent',body,{h:'h3',body:'tight'})+'</div>'+
  '<div class="tv-foot"><span class="dim">'+esc(v.stage==='done'?(st.sheet.skipPromo?'No promo tonight. Straight to the ring.':'Match layout signed.'):'Every option says what it will cost you.')+'</span>'+nextBtn+'</div>';
 scrollTalk('roomTalk');
 night.stage='meeting';persistNight();
}

function showPromos(){
 const c=current();if(!c)return endNight();
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
 if(night.plan?.sheet?.skipPromo)return bell();
 // v0.3.25 Before the first line: does somebody else do the talking?
 const MP=window.OfficeMouthpiece,talkers=MP&&(!night.promo||night.promo.cid!==c.id)?MP.candidates(c,w):[];
 if(talkers.length&&night.mouth?.cid!==c.id)return showMouthpiece(c,w,f,p,talkers);
 if(!night.promo||night.promo.cid!==c.id||night.promo.v!==5){
  const mouth=night.mouth?.cid===c.id&&night.mouth.id!=='none'?MP?.pick(c,w,night.mouth.id):null;
  const arc=window.OfficeProgrammeArcs?.intro(c,night.plan?.arcChoice);
  night.promo=OfficeMic.begin(c,w,f,G.feud(w.id,f.id),night.plan?.sheet,p,{mouth,arc});
  // v0.3.12 The interviewer asks about what the crowd saw: the rivalry's public record. A backstage
  // memory (recalled.promoPrompt) stays backstage; it is no longer read out on air.
  const intro=window.OfficeRivalry?.introFor(night.promo.core);
  if(intro)night.promo.log[0].line=arc?arc.prompt+' '+intro:intro;
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
 const decide=v.stage==='done'?`<div class="decide2"><h3 class="section-h">The final word</h3><p class="lede"><b>${esc(v.result.reaction)}</b> ${esc(v.result.tactic?.stake||'')}</p></div>`:
  `<div class="decide2"><h3 class="section-h">${esc(v.name)} <small>${v.round+1} of ${v.total}</small></h3><p class="lede">${esc(v.help)}</p>${read}${cue}${open}${claim}${pickCards(v.options,'mic',true)}</div>`;
 const sp=st.speaker?G.W(st.speaker.id)||w:w;
 const body=matchupBar(c,w,f,meter)+(st.speaker?`<p class="dim mouth-note">${esc(st.speaker.short)} is doing the talking for ${esc(w.short)}.</p>`:'')+sceneLog(entries,'micTalk',sp,f,p.id)+decide;
 $('#tv').innerHTML=strip(c,'microphone time')+'<div class="stage screen s-back">'+win('The promo: '+w.short+' against '+f.short+' for the room',body,{h:'h3',body:'tight'})+'</div>'+
  `<div class="tv-foot"><span class="dim">${esc(v.stage==='done'?'It is said.':'Once it is out of your mouth, it stays said.')}</span>${v.stage==='done'?'<button class="btn go" data-tv="bell">Ring the bell</button>':`<span class="dim">${esc(v.name)}</span>`}</div>`;
 scrollTalk('micTalk');
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
 const promoRes=signed||(P.sheet?.skipPromo?null:night.promo?.v>=4?OfficeMic.result(night.promo):night.promo?.v===2?OfficeStory.Graph.result(night.promo):null);
 if(window.OfficeProgrammeArcs)OfficeProgrammeArcs.prepare(c,P.arcChoice,promoRes);
 night.M=Mx.create({w:{...w,fatigue:G.clamp(w.fatigue+trainingFatigue)},f,p,ladder:ladderFor(p.id,w.id,f.id),slot:c.slot,minutes:P.sheet?.minutes||c.minutes,finish:c.finish,stip:c.stip||null,feudHeat:Math.max(c.feudHeat||0,G.feud(w.id,f.id)?.heat||0),blowoff:c.blowoff,promo:promoRes,plan:{game:P.game,leash:P.leash,talk:P.talk},preparation,flags:{...w.flags,...(P.sheet?.flags||{})},memory:OfficeMemory.context(w.id,f.id),sheet:P.sheet?.signed?(window.OfficeRingside?OfficeRingside.attach(OfficeRoom.addVow(P.sheet,promoRes,w,f),c,P.corner):OfficeRoom.addVow(P.sheet,promoRes,w,f)):null,seed:Math.floor(Math.random()*2**31)});
 night.past=[];night.paused=false;
 const callBtns=Object.entries(Mx.CALLS).map(([k,o],i)=>`<button class="btn call" data-call="${k}" data-hint="${esc(o.hint)}"><kbd>${i+1}</kbd>${esc(o.name)}</button>`).join('');
 const bench=`<div class="gauge"><label>Atmosphere <b id="lCrowd">0</b></label><div class="gbar"><i id="lCrowdBar"></i></div></div><div class="gauge"><label>Game plan <b id="lSheet">–</b></label></div><div class="callsleft" style="margin-bottom:6px">Calls left <span id="lCalls">●●●</span></div><div class="calls">${callBtns}</div><div class="callhint well" id="lHint">Your calls go to the wrestler. They don’t always listen.</div><h3 class="section-h">Commentary speed</h3><div class="speed" role="group" aria-label="Commentary speed"><button class="btn" data-pause>Pause</button>${['slow','normal','fast','skip'].map(s=>`<button class="btn" data-speed="${s}" aria-pressed="${night.speed===s}">${{slow:'Slow',normal:'Normal',fast:'Fast',skip:'To the end'}[s]}</button>`).join('')}</div>`;
 $('#tv').innerHTML=`${strip(c)}<header class="score"><div class="side you">${face('wrestler',w.id,w.name,'portrait x2')}<h2>${esc(w.short)}</h2><div class="stam" id="sY" title="${esc(w.short)} stamina"><i></i></div></div><div class="mid"><div class="live-stars" id="lStars" aria-label="Live rating">–</div><div class="clock" id="lClock">00:00</div><div class="phase" id="lPhase">Entrances</div></div><div class="side them">${face('wrestler',f.id,f.name,'portrait x2')}<h2>${esc(f.short)}</h2><div class="stam" id="sT" title="${esc(f.short)} stamina"><i></i></div></div></header><div class="mom" title="Momentum" aria-hidden="true"><i id="lMom" style="width:50%"></i></div><div class="plan-strip" id="lPlan" hidden></div>
 <div class="stage screen s-live">${win('Live commentary',`<div class="feed well"><div class="now" id="lNow" aria-live="polite"><span class="t"></span><span class="tx"></span></div><ol class="past" id="lPast"></ol></div>`,{h:'h3',cls:'quiet',body:'tight',note:`${esc(w.short)} on top: gold bar`})}${win('Ringside',bench,{h:'h3'})}</div><div class="decision" id="decision" hidden></div>`;
 night.stage='live';updateLive();persistNight();schedule(300);
}
function schedule(ms){clearTimeout(night.timer);night.timer=setTimeout(pump,ms)}
function pump(){
 const M=night?.M;if(!M||night.paused)return;
 if(M.decision&&!M.queue.length)return showDecision();
 if(night.speed==='skip'){let line,n=0,got=0;while(n++<4000){if(M.decision&&!M.queue.length)break;line=Mx.next(M);if(!line)break;night.past.unshift(line);got++}
  if(got)showLine(night.past.shift(),true);updateLive();if(M.decision)return showDecision();if(M.done){clearTimeout(night.timer);night.timer=setTimeout(()=>{if(night?.M===M)result()},900);return}return schedule(10)}
 const line=Mx.next(M);
 if(!line){if(M.done)return result();if(M.decision)return showDecision();return schedule(50)}
 showLine(line);updateLive();
 if(M.decision&&!M.queue.length){return schedule(SPEED[night.speed].line*.6+300)}
 const sp=SPEED[night.speed];schedule(sp.line+(line.pause||0)*sp.pause);
}
function showLine(line,quiet){
 const now=$('#lNow');if(!now)return;
 const prev=now.dataset.line?JSON.parse(now.dataset.line):null;
 if(prev&&!quiet)night.past.unshift(prev);
 now.className='now '+line.kind+(line.big?' big':'')+voiceCls(line);now.dataset.line=JSON.stringify(line);
 now.innerHTML=`<span class="t">${esc(line.t)}</span>${voiceFace(line)}<span class="tx">${booth(line)?`<small class="spk">${esc(booth(line).name)}</small>`:''}${esc(line.text)}</span>`;
 night.past=night.past.filter(x=>x.kind!=='count'||x.text.length>8).slice(0,40);
 $('#lPast').innerHTML=night.past.map(l=>`<li class="${l.kind} ${l.big?'big':''}${voiceCls(l)}"><span class="t">${esc(l.t)}</span><span>${voiceTag(l)}${esc(l.text)}</span></li>`).join('');persistNight();
}
function updateLive(){
 const M=night.M;if(!$('#lClock'))return;
 $('#lClock').textContent=Mx.fmt(M.t)+' / '+Mx.fmt(M.len);
 $('#lPhase').textContent=Mx.phaseName(M);
 $('#lStars').textContent=M.qN?starsText(Mx.liveStars(M))||'DUD':'–';
 $('#lCrowd').textContent=Math.round(M.crowd);$('#lCrowdBar').style.width=M.crowd+'%';
 $('#lMom').style.width=(50+M.mom/2)+'%';
 const y=$('#sY'),t=$('#sT');y.querySelector('i').style.width=M.wSt+'%';t.querySelector('i').style.width=M.fSt+'%';y.classList.toggle('low',M.wSt<30);t.classList.toggle('low',M.fSt<30);
 $('#lSheet').textContent=M.sheet?.signed?M.sheet.nodes.filter(b=>b.status==='achieved'||b.status==='adapted').length+'/'+M.sheet.nodes.length+' beats':M.leash==='free'?'Called live':M.offScript?(M.offScript==='showboat'?'Showboating':'Audibles'):'On the layout';$('#lSheet').className=M.offScript?'warnv':'';
 updateStrip(M);
 $('#lCalls').textContent='●'.repeat(M.calls)+'○'.repeat(3-M.calls);
 document.querySelectorAll('[data-call]').forEach(b=>b.disabled=!Mx.canCall(M,b.dataset.call));
 const pb=document.querySelector('[data-pause]');if(pb){pb.textContent=night.paused?'Resume':'Pause';pb.setAttribute('aria-pressed',night.paused)}
}
// The running order along the match clock. Two lanes so neighbouring beats never sit on top of each other.
const STRIP_SHORT={Shine:'Shine',Heat:'Heat',Comeback:'Back','Big spot':'Spot',Finish:'Fin',Vow:'Vow'};
const STRIP_ICON={achieved:'✓',adapted:'↻',missed:'✗',due:'▸'};
function stripInner(m){
 const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
 return `<div class="ps-track">${[...new Set(m.beats.map(b=>b.lane))].sort().map(l=>`<div class="ps-lane${l===2?' vow-lane':''}">${m.beats.filter(b=>b.lane===l).map(b=>
  `<div class="ps-beat s-${b.state} own-${b.owner}${b.vow?' vow':''}" style="left:${b.start}%;width:${b.width}%" title="${esc(b.title)}" role="img" aria-label="${esc(b.title)}"><b>${STRIP_ICON[b.state]?STRIP_ICON[b.state]+' ':''}<span class="ps-full">${esc(b.slot)}</span><span class="ps-short">${esc(STRIP_SHORT[b.slot]||b.slot)}</span></b><span>${esc(cap(b.move))}</span>${b.mark!=null?`<em class="ps-mark" style="left:${b.mark}%"></em>`:''}</div>`).join('')}</div>`).join('')}${m.head!=null?`<i class="ps-head" style="left:${m.head}%"></i>`:''}</div>`;
}
function stripKey(m){return m?JSON.stringify(m.beats.map(b=>[b.state,b.mark])):''}
function updateStrip(M){
 const ps=$('#lPlan');if(!ps)return;
 const m=OfficeSheets.strip(M);ps.hidden=!m;if(!m)return;
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
 clearTimeout(night.timer);const M=night.M,c=current(),w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
 const fin={...M.final,log:M.log.map(({t,text,kind,big,who})=>({t,text,kind,big,who}))};
 const cons=G.applyResult(c,fin);
 if(window.OfficeRingside)cons.push(...OfficeRingside.settle(c,M));
 const sheetReport=OfficeSheets.report(M),finalStrip=OfficeSheets.strip(M,{final:true});
 if(sheetReport){
  const h=S().history.find(x=>x.wid===w.id&&x.rid===f.id&&x.season===S().season&&x.week===S().week);
  if(h)h.sheet=sheetReport;
  cons.push({text:'Match layout: '+sheetReport.achieved+' performed, '+sheetReport.adapted+' adapted, '+sheetReport.missed+' missed.',tone:sheetReport.missed>2?-1:1});
  if(sheetReport.achieved>=3&&sheetReport.missed===0&&fin.stars>=3.5)
   OfficeMemory.remember(w.id,'chemistry',w.short+' remembers how well the agreed match with '+f.short+' came together.',f.id,3,4,c.id+':chemistry');
  if(sheetReport.missed>=3)OfficeMemory.remember(w.id,'sheet_changes',w.short+' remembers how far the match departed from the agreed match layout against '+f.short+'.',f.id,-2,0,c.id+':sheet');
  G.save();
 }
 night.results.push({name:w.name,foe:f.name,stars:fin.stars,cid:c.id,wid:w.id,rid:f.id,pid:p.id,season:S().season,week:S().week,actualOutcome:fin.outcome,bookedFinish:c.finish,consequences:cons.map(x=>x.text)});
 night.after=window.OfficeAfter?OfficeAfter.begin(c,fin,night.plan?.after||'none'):null;
 const verdict=fin.stars>=4.5?'An all-timer.':fin.stars>=4?'People will talk about that one.':fin.stars>=3?'A good night’s work.':fin.stars>=2?'Solid enough.':fin.stars>=1?'Forgettable.':'A disaster.';
 const pct=sheetReport?(sheetReport.achieved+sheetReport.adapted)+'/'+sheetReport.total+' beats':fin.script===null?'Called live':Math.round(fin.script*100)+'%';
 night.i++;const more=night.i<night.queue.length;
 const sheetHtml=sheetReport?'<h3 class="section-h" style="margin-top:12px">Agreed versus performed</h3><p class="dim">'+(sheetReport.room?esc(sheetReport.room.premise):'Story: '+esc(OfficeSheets.focusOptions(c,w,f,night.plan?.game||'story').find(x=>x.id===sheetReport.focus)?.title||sheetReport.focus||'Performer-led'))+
  ' · Ringside changes: '+sheetReport.calls.length+' · Renegotiated beats: '+sheetReport.revisions.length+'</p>'+(finalStrip?'<div class="plan-strip final">'+stripInner(finalStrip)+'</div>':'')+'<div class="well"><ol style="padding-left:1.3em">'+sheetReport.beats.map(b=>'<li style="margin:4px 0"><b>'+esc(b.title.charAt(0).toUpperCase()+b.title.slice(1))+'</b> · '+esc(b.status)+'<span class="dim" style="display:block">'+esc(b.actual?beatLabel(b.actual):b.reason)+'</span></li>').join('')+'</ol></div>':'';
 const story=flowReport(fin,w,f);
 const facts=`<div class="facts three"><div><small>Crowd at the bell</small><b>${fin.crowd}</b></div><div><small>Loudest</small><b>${fin.crowdPeak}</b></div><div><small>Big spots landed</small><b>${fin.spotHits}/${fin.spots}</b></div><div><small>Near falls</small><b>${fin.nearfalls}</b></div><div><small>Followed the layout</small><b>${pct}</b></div><div><small>Calls heard</small><b>${fin.callsUsed.length-fin.ignored}/${fin.callsUsed.length}</b></div></div>`;
 $('#tv').innerHTML=`<div class="strip"><b>${esc(p.name)}: full time</b><span>${esc(w.name)} v ${esc(f.name)}</span><span class="r">Match ${night.i} of ${night.queue.length}</span></div><div class="stage screen s-result"><div class="final"><div class="bigstars">${starsText(fin.stars)||'DUD'}</div><div class="verdict">${esc(verdict)}</div></div>${story?win('How the match went',story,{h:'h3',cls:'mf-win',note:`Crowd ${fin.crowdStart} at the bell · loudest ${fin.crowdPeak} · ${fin.crowd} at the finish`}):''}${win('What happened',`${facts}${!story&&fin.crowdTrace?.length>2?`<h3 class="section-h" style="margin-top:12px">The crowd</h3>${crowdChart(fin.crowdTrace,M.len,finalStrip)}`:''}${sheetHtml}<h3 class="section-h" style="margin-top:12px">Consequences</h3><ul class="cons">${cons.map(x=>`<li class="${x.tone>0?'up':x.tone<0?'down':''}">${esc(x.text)}</li>`).join('')}</ul>`,{h:'h3'})}${win('Full commentary',`<div class="well">${logList(fin.log)}</div>`,{h:'h3',cls:'quiet',body:'tight'})}</div><div class="tv-foot"><span class="dim">${more?`Next up: ${esc(G.W(S().card.find(x=>x.id===night.queue[night.i])?.wid)?.name||'')}`:'That’s the night.'}</span>${night.after?.stage==='mic'?`<span class="foot-btns"><button class="btn" data-tv="${more?'next':'done'}">${more?'Skip to the next match':'Skip, back to the office'}</button><button class="btn go" data-tv="after">After the bell</button></span>`:`<button class="btn go" data-tv="${more?'next':'done'}">${more?'Next match':'Back to the office'}</button>`}</div>`;
 night.M=null;night.plan=null;night.promo=null;night.stage='result';night.resultHTML=$('#tv').innerHTML;persistNight();
}
function endNight(){
 clearTimeout(night?.timer);$('#tv').hidden=true;$('#tv').innerHTML='';document.body.style.overflow='';
 const res=night?.results||[],before=night?.before||null,speed=night?.speed||'normal';clearNight();night={speed};
 // Finish all weekly systems first; the report then reads their settled state.
 G.endWeek();
 if(res.length)G.msg(OfficeNightReport.build(before,S(),res.map(r=>({...r,label:starsText(r.stars)||'DUD'}))));
 G.save();
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
 if(d.go)return go(d.go,d.id||null);
 if(d.openw)return go('profile',d.openw);
 if(d.sort){const [key,k]=d.sort.split(':');const s=sorts[key];sorts[key]=s&&s.k===k?{k,d:-s.d}:{k,d:['name','style','tier'].includes(k)?1:-1};render();return}
 if(d.selo||d.self){
  if(d.selo)selOffer=d.selo;else selFree=d.self;
  if(phoneLayout())return go(d.selo?'offers':'scouting',d.selo||d.self);
  render();if(innerWidth<=900)document.querySelector('#view .screen>.win:last-child')?.scrollIntoView({behavior:'smooth',block:'start'});return;
 }
 if(d.tickmsg){openMsg=d.tickmsg;go('inbox',phoneLayout()?openMsg:null);return}
 if(d.msg){openMsg=d.msg;if(phoneLayout())return go('inbox',d.msg);render();return}
 if(d.answer){const out=G.answer(d.mid,d.answer);render();if(out)toast(out);return}
 if(d.checkin){renderPrivateMeeting(d.checkin);return}
 if(d.private){const r=G.checkIn(d.wid,d.private);if(r.error)return toast(r.error);$('#modal').close();render();toast(r.text);return}
 if(d.program){const err=G.startProgram(d.wid,d.program);if(err)toast(err);else toast(d.program==='camp'?'Three-week camp booked. Unavailable for bookings until it ends.':'Development block committed.');render();return}
 if(d.cancelprogram){const err=G.cancelProgram(d.cancelprogram);if(err)toast(err);else toast('Programme ended. Weeks already paid for are not refunded.');render();return}
 if(d.hirecoach){const err=G.hireCoach(d.hirecoach);if(err)toast(err);else toast('Coach hired. Weekly salary starts now.');render();return}
 if(d.firecoach){const err=G.fireCoach();if(err)toast(err);else toast('Coach released. Salary stops.');render();return}
 if(d.sign){
  const err=G.sign(d.sign);if(err){render();return toast(err)}
  const w=G.W(d.sign);selFree=null;refreshList('scouting');return toast(`${w.name} signed. Wages ${money(w.wage)} a week.`);
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
 if(d.talkaction){const res=G.talkMove(d.oid,d.wid,d.talkaction);if(res.error)return toast(res.error);renderMeeting(d.oid,d.wid);return}
 if(d.talkbook){const o=S().offers.find(o=>o.id===d.talkbook);const when=o?.eventAbs;if(d.revert){const res=G.talkMove(d.talkbook,d.wid,'revert');if(res.error)return toast(res.error)}const err=G.book(d.talkbook,d.wid);if(err)return toast(err);$('#modal').close();refreshList('offers');toast(when>G.abs()?`Future booking confirmed for ${weekLabel(when)}.`:`Contract signed for ${money(G.purse(o,G.W(d.wid)))}.`);return}
 if(d.replay){const x=S().history[+d.replay];dialog(`${x.name} v ${x.foe}`,`${x.promo?`<p><b>Microphone time — ${esc(x.promo.style)}</b></p>${x.promo.dialogue?.length?x.promo.dialogue.map(z=>`<p><b>${esc(z.speaker)}:</b> ${esc(z.line)}</p>`).join(''):`<p>${x.promo.speech.map(z=>'“'+esc(z)+'”').join(' ')}</p><p><b>${esc(x.promo.opponent)}:</b> “${esc(x.promo.reply)}”</p>`}${x.promo.promise?.kept===true?'<p><b>Promise kept in the match.</b></p>':x.promo.promise?.kept===false?'<p><b>Promise broken in the match.</b></p>':''}`:''}<p class="dim">${esc(x.promoter)}, season ${x.season} week ${x.week}. <span class="stars">${starsText(x.stars)||'DUD'}</span></p>${x.notes.map(n=>`<p>${esc(n)}</p>`).join('')}<div class="well">${logList(x.log)}</div>`);return}
 if(d.act==='export'){const blob=new Blob([JSON.stringify(S())],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`the-office-s${S().season}w${S().week}.json`;a.click();return}
 if(d.act==='import'){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{const f=i.files[0];if(!f)return;f.text().then(t=>{try{const x=JSON.parse(t);if(![20,21,22].includes(x.v))throw 0;G.S=x;if(!G.S)throw 0;G.save();startApp('desk');toast('Save loaded.')}catch(err){toast('That file isn’t a valid save from v2 to v2.3.')}})};i.click();return}
 if(d.act==='newgame'){dialog('Start a new career?','<p>Your current career will be overwritten.</p>',[['Cancel','close'],['Start again','newgame','red']]);return}
 if(d.dlg){const m=$('#modal');m.close();if(d.dlg.startsWith('withdraw:')){const said=G.unbook(d.dlg.slice(9));render();toast(said||'Programme withdrawn.');return}if(d.dlg.startsWith('release:')){const w=G.W(d.dlg.slice(8));G.release(w.id);past=past.filter(r=>r.id!==w.id);ahead=[];route={s:'squad',id:null};render(true);toast(`${w.name} released.`)}if(d.dlg==='newgame'){clearNight();G.wipe();G.fresh();openMsg=null;night=null;$('#tv').hidden=true;document.body.style.overflow='';startApp('scouting')}return}
 if(d.title==='new'){if(G.hasSave()&&!confirm('Overwrite your saved career?'))return;clearNight();G.fresh();startApp('scouting');toast('Sign your first wrestler.');return}
 if(d.title==='load'){if(!G.load())return toast('No saved career found.');startApp('desk');if(resumeNight())toast('Match restored, paused at your last decision.');return}
 if(d.plan){night.plan[d.plan]=d.val;if(d.plan==='game'){night.plan.sheet=null;night.plan.focus=null;night.plan.confirmed=false;}t.parentElement.querySelectorAll('.opt').forEach(b=>b.setAttribute('aria-pressed',b===t));persistNight();return}
 if(d.sheetmode){if(!OfficeSheets.MODE[d.sheetmode])return;night.plan.method=d.sheetmode;night.plan.sheet=null;night.plan.confirmed=false;return showMeeting()}
 if(d.room){const st=night?.plan?.room;if(night?.stage!=='meeting'||!st||st.stage==='done')return;
  if(!OfficeRoom.options(st).some(o=>o.id===d.room))return;OfficeRoom.act(st,d.room);return showMeeting()}
 if(d.cornerwho){if(night?.stage!=='meeting'||!night.plan)return;night.plan.cornerWho=d.cornerwho;night.plan.corner=null;return showMeeting()}
 if(d.cornerjob){if(night?.stage!=='meeting'||!night.plan)return;const x=OfficeRingside.parse(d.cornerjob);if(!x)return;night.plan.cornerWho=x.id;night.plan.corner=night.plan.corner===d.cornerjob?null:d.cornerjob;return showMeeting()}
 if(d.arcchoice){if(night?.stage!=='meeting'||night.plan?.room?.stage!=='done')return;const v=window.OfficeProgrammeArcs?.options(current());if(!v?.choices.some(x=>x.id===d.arcchoice))return;night.plan.arcChoice=d.arcchoice;return showMeeting()}
 if(d.afterplan){if(night?.stage!=='meeting'||!night.plan||!OfficeAfter.PLANS[d.afterplan])return;night.plan.after=d.afterplan;return showMeeting()}
 if(d.aftermic){const st=night?.after;if(night?.stage!=='after'||!st||st.stage!=='mic')return;OfficeAfter.speak(st,d.aftermic);return showAfter()}
 if(d.tv==='after')return showAfter();
 if(d.mouth){if(night?.stage!=='mouth')return;const c=current();if(!c)return;night.mouth={cid:c.id,id:d.mouth};return showPromos()}
 if(d.contract){const st=night?.signing;if(night?.stage!=='signing'||!st||st.stage!=='live')return;OfficeSigning.choose(st,d.contract);return showSigning()}
 if(d.tv==='signing'){if(night?.stage==='meeting'&&night.plan?.room?.stage!=='done')return;return showSigning();}
 if(d.mic){const st=night?.promo;if(night?.stage!=='promo'||st?.v!==5||st.stage==='done')return;
  if(!OfficeMic.choices(st).some(o=>o.id===d.mic))return;OfficeMic.choose(st,d.mic);return showPromos()}
 if(d.tv==='meeting')return showMeeting();
 if(d.tv==='promos'){if(night?.stage==='meeting'&&night.plan?.room?.stage!=='done')return;return showPromos();}
 if(d.tv==='bell'){if(window.OfficeSigning?.eligible(current())&&night?.signing?.stage!=='done')return;if(!night?.plan?.sheet?.skipPromo&&!night?.signing&&night?.promo?.v>=4&&night.promo.stage!=='done')return;if(night?.stage==='meeting'&&night.plan?.room?.stage!=='done')return;return bell();}
 if(d.tv==='next'){night.after=null;night.signing=null;prep();return}
 if(d.tv==='done')return endNight();
 if(d.call)return doCall(d.call);
 if(d.decide)return decideNow(d.decide);
 if(d.speed!==undefined){night.speed=d.speed;document.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.speed===night.speed));if(!night.paused)schedule(50);return}
 if(t.hasAttribute('data-pause')){night.paused=!night.paused;updateLive();if(!night.paused)schedule(100);return}
});
document.addEventListener('change',e=>{
 const t=e.target,d=t.dataset;
 if(d.freeSort!==undefined){sorts.free={k:t.value,d:['name','style'].includes(t.value)?1:-1};render();return}
 if(d.session){const err=G.setSession(d.session,t.value);if(err){toast(err);render();return}const w=G.W(d.session);render();toast(t.value==='none'?`${w.short}: no session with Dennis this week.`:`${w.short}: ${t.selectedOptions[0]?.textContent.replace(' — Dennis suggests','').toLowerCase()} with Dennis.`);return}
 if(d.train){G.setTraining(d.train,t.value);render();toast(`${G.W(d.train).short}: ${D.TRAINING[t.value].name.toLowerCase()} this week.`);return}
 if(d.intensity){G.setIntensity(d.intensity,t.value);render();toast(`${G.W(d.intensity).short}: ${G.INTENSITY[t.value].name}, ${money(G.trainingCost(G.W(d.intensity)))} a week.`);return}
 if(d.pick){pick[d.pick]=t.value;render();return}
});
document.addEventListener('mouseover',e=>{const b=e.target.closest('[data-hint]');if(b&&$('#lHint'))$('#lHint').textContent=b.dataset.hint});
document.addEventListener('focusin',e=>{const b=e.target.closest('[data-hint]');if(b&&$('#lHint'))$('#lHint').textContent=b.dataset.hint});
document.addEventListener('keydown',e=>{
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
function showRealBill(bill){
 const h=bill.head,p=D.PROMOS.find(x=>x.id===h.pid);if(!p)return false;
 const side=(img,cap,w)=>{const i=$(img);i.src='assets/portraits/'+w.id+'.png';i.alt='Pixel-art portrait of '+w.name;$(cap).textContent=w.name;};
 $('#posterPromo').textContent=p.name;$('#posterVenue').textContent=p.venue.replace(/^the /,'The ');
 side('#posterW','#posterWName',h.a);side('#posterF','#posterFName',h.b);
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
 if(real&&showRealBill(real)){summary(saved,top);return;}
 // Fallback if the career cannot be read: two real names from one division meet for a belt.
 const belt=D.belt(p.id,div),used=new Set([a.id,b.id]);$('#posterBelt').hidden=false;
 const side=(img,cap,w)=>{const i=$(img);i.src='assets/portraits/'+w.id+'.png';i.alt='Pixel-art portrait of '+w.name;$(cap).textContent=w.name;};
 $('#posterPromo').textContent=p.name;$('#posterVenue').textContent=p.venue.replace(/^the /,'The ');
 side('#posterW','#posterWName',a);side('#posterF','#posterFName',b);
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
  $('#loadSummary').innerHTML=`<span class="stub-save">${top?`<img src="assets/portraits/${esc(top.id)}.png" alt="">`:''}${esc(parts.join(' · '))}${top?' · '+esc(top.name):''}</span>`;
 }
}

/* ---------- boot ---------- */
window.OfficeUI={get night(){return night},go};
window.addEventListener('office-save-status',showSaveStatus);
window.addEventListener('DOMContentLoaded',()=>{
 posterBill();showSaveStatus();
 const d=$('#modal');d.addEventListener('close',()=>{
  const oid=d.dataset.talkoid;if(oid&&S()){const o=S().offers.find(x=>x.id===oid);if(o?.talk?.step==='start'){o.talk=null;G.save();}}
  delete d.dataset.talkoid;if(S()&&!$('#app').hidden)render();
 });
 if(G.hasSave())$('#loadBtn').hidden=false;
 $('#title').hidden=false;
});
})();
