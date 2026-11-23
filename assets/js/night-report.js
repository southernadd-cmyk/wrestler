/* THE OFFICE — match-night consequences letter. Actual state changes, not fabricated flavour. */
(function installOfficeNightReport(root){
 'use strict';
 // A read-only account of changes across a whole match night and its weekly settlement.
 // The before snapshot is saved with the match-night autosave; the finished letter is saved in the inbox.
 const G=root.OfficeGame,D=root.OfficeData,T=root.OfficeTerritory;
 const n=x=>Number.isFinite(x)?x:0;
 const signed=x=>(x>0?'+':'')+x;
 const cash=x=>G.money(Math.round(n(x)));
 const change=x=>(x>0?'+':x<0?'−':'')+cash(Math.abs(x));
 const fullName=id=>(G.W?.(id)||G.F?.(id)||D.findWrestler?.(id))?.name||id||'vacant';
 const short=id=>(G.W?.(id)||G.F?.(id)||D.findWrestler?.(id))?.short||fullName(id);
 const absolute=s=>(s.season-1)*16+s.week;
 function capture(s){
  if(!s)return null;
  const t=s.territory||{},roster={},promoters={},rankings={},titles={},programmes={};
  for(const p of s.promoters||[])promoters[p.id]={name:p.name,trust:p.trust};
  for(const w of s.roster||[]){
   const a=s.ambitions?.w?.[w.id];
   roster[w.id]={name:w.name,short:w.short||w.name,morale:w.morale,loyal:w.loyal,heat:w.heat,injury:w.injury||0,sat:a?.sat,ambition:a?.kind};
   for(const p of s.promoters||[]){
    const div=D.divisionOf?.(w.id);
    const list=div&&T?.promotionRank?.(p.id,div,t,s);
    const index=list?.findIndex(x=>x.id===w.id)??-1;
    if(index>=0)rankings[p.id+':'+w.id]={position:index+1,score:list[index].score,slot:list[index].slot};
   }
  }
  for(const p of D.PROMOS||[])for(const div of D.DIVISION_ORDER||[])titles[p.id+':'+div]=t.titles?.[p.id]?.[div]?.holder||null;
  for(const prog of [...(t.programmes?.live||[]),...(t.programmes?.done||[])]){
   programmes[prog.id]={completed:prog.beats?.filter(b=>b.done).length||0,momentum:prog.arc?.momentum??null,status:prog.status||'live'};
  }
  return {season:s.season,week:s.week,abs:absolute(s),cash:s.cash,rep:s.rep,roster,promoters,rankings,titles,programmes,
   pending:(s.inbox||[]).filter(m=>m.kind==='decision'&&!m.answer).map(m=>m.id)};
 }
 function build(before,s,results){
  const snap=capture(s),valid=!!before&&before.abs===((results[0]?.season-1)*16+results[0]?.week||before.abs)
   &&Number.isFinite(before.cash)&&Number.isFinite(before.rep);
  const first=results[0]||{},season=before?.season||first.season||s.season,week=before?.week||first.week||s.week;
  const entries=(s.history||[]).filter(h=>h.season===season&&h.week===week);
  const sections=[],add=(title,lines)=>{const clean=lines.filter(Boolean);if(clean.length)sections.push({title,lines:clean})};
  const rating=r=>r.label||(Number.isFinite(r.stars)?r.stars.toFixed(2)+'★':'DUD');
  add('In the ring',results.map(r=>{
   const finish=r.actualOutcome==='dq'?' — unplanned disqualification (booked finish not delivered)':
    r.actualOutcome==='nc'?' — no contest':
    r.actualOutcome==='double'?' — agreed finish broken':
    /_dq$/.test(r.bookedFinish||'')?' — agreed disqualification finish':'';
   return r.name+' v '+r.foe+' — '+rating(r)+finish;
  }));
  const account=[valid?'Bank '+cash(before.cash)+' → '+cash(s.cash)+' ('+change(s.cash-before.cash)+').':'Bank after the week: '+cash(s.cash)+'.'];
  const purses=entries.reduce((sum,h)=>sum+n(h.purse),0);
  if(entries.length)account.push('Match purses received: '+cash(purses)+'.');
  const ledger=(s.books||[]).find(b=>b.a===(before?.abs||((season-1)*16+week)));
  if(ledger)account.push('Weekly wages: '+cash(ledger.wages)+'. Other weekly costs (including overheads and training): '+cash(ledger.other)+'.');
  if(valid)account.push('Territory reputation: '+before.rep+' → '+s.rep+' ('+signed(s.rep-before.rep)+').');
  else account.push('Territory reputation: '+s.rep+'.');
  if(valid&&s.rep!==before.rep)account.push('This is the net change after match results, programme effects and the weekly settlement.');
  if(!valid)account.push('An older match-night save was resumed, so before-and-after comparisons are unavailable.');
  add('The business',account);

  if(valid){
   const trust=[];
   for(const p of s.promoters||[]){
    const old=before.promoters?.[p.id],diff=n(p.trust)-n(old?.trust);
    if(old&&diff&&(results.some(r=>r.pid===p.id)||Math.abs(diff)>=3))trust.push(p.name+' trust '+old.trust+' → '+p.trust+' ('+signed(diff)+') after this week’s results and settlement.');
   }
   const evidence=results.flatMap(r=>r.consequences||[]).filter(t=>/trust|forgave the overrun|hasn.t forgiven/i.test(t)).slice(0,3);
   if(trust.length&&evidence.length)trust.push(...evidence.map(t=>'From the match report: '+t));
   add('The promoters',trust);
  }

  const ring=[];
  const t=s.territory||{};
  // Use titleLog event week, not the current holder alone: the rival circuit may evolve after this show.
  const titleEvents=(t.titleLog||[]).filter(x=>x.week===(before?.abs||((season-1)*16+week))&&x.how==='match'&&results.some(r=>r.pid===x.pid&&(r.wid===x.from||r.wid===x.to||r.rid===x.from||r.rid===x.to)));
  for(const x of titleEvents){
   const belt=D.belt?.(x.pid,x.div);
   ring.push((belt?.name||'Championship')+': '+fullName(x.from)+' → '+fullName(x.to)+'.');
  }
  if(valid)for(const r of results){
   if(!r.pid||!r.wid)continue;
   const key=r.pid+':'+r.wid,a=before.rankings?.[key],b=snap.rankings?.[key];
   if(!a||!b)continue;
   const promo=(s.promoters||[]).find(p=>p.id===r.pid)?.name||r.pid;
   if(a.position!==b.position)ring.push(short(r.wid)+' at '+promo+': #'+a.position+' → #'+b.position+' in the division.');
   else if(a.score!==b.score)ring.push(short(r.wid)+' at '+promo+': ranking points '+signed(b.score-a.score)+' (position #'+b.position+').');
  }
  add('Titles and rankings',ring.slice(0,8));

  const programmeLines=[],programmes=[...(t.programmes?.live||[]),...(t.programmes?.done||[])];
  for(const r of results){
   const prog=programmes.find(p=>p.beats?.some(b=>b.cid===r.cid));
   if(!prog)continue;
   const step=prog.beats.findIndex(b=>b.cid===r.cid),entry=prog.arc?.timeline?.find(x=>x.cid===r.cid);
   const name=prog.type==='title'?'Title chase':prog.type==='grudge'?'Grudge':prog.type==='rise'?'Rising star':'Programme';
   if(entry){
    const previous=before?.programmes?.[prog.id]?.momentum;
    const motion=Number.isFinite(previous)?' (momentum '+previous+' → '+prog.arc.momentum+')':'';
    programmeLines.push(name+', chapter '+(step+1)+'/'+prog.beats.length+': '+entry.recap+motion);
   }else if(prog.beats[step]?.done){
    programmeLines.push(name+', chapter '+(step+1)+'/'+prog.beats.length+' completed.');
   }
   if(prog.status&&(step===prog.beats.length-1||['broken','walked','collapsed'].includes(prog.status)))programmeLines.push(name+' '+prog.status+': '+(prog.text||'The final contracted match is complete.'));
  }
  add('Programmes',programmeLines.slice(0,8));

  if(valid){
   const people=[];
   for(const w of s.roster||[]){
    const old=before.roster?.[w.id];if(!old)continue;
    const a=snap.roster[w.id],parts=[];
    if(Math.abs(n(a.morale)-n(old.morale))>=3)parts.push('morale '+old.morale+' → '+a.morale);
    if(Number.isFinite(old.sat)&&Number.isFinite(a.sat)&&Math.abs(a.sat-old.sat)>=3)parts.push('satisfaction '+old.sat+' → '+a.sat);
    if(Math.abs(n(a.loyal)-n(old.loyal))>=5)parts.push('loyalty '+old.loyal+' → '+a.loyal);
    if(a.injury>old.injury)parts.push('injured, '+a.injury+' weeks remaining');
    if(parts.length)people.push((w.short||w.name)+': '+parts.join('; ')+'.');
   }
   add('The dressing room',people.slice(0,8));
  }

  const bulletin=(t.reports||[]).find(r=>r.week===absolute(s));
  if(bulletin){
   const noteworthy=(bulletin.lines||[]).filter(line=>/title|champion|won the|signed|struggling|steadied|head.to.head|raided|vacant|crowd yet|programme/i.test(line));
   if(noteworthy.length)add('Around the circuit — week '+((bulletin.week-1)%16+1),[
    'Separate circuit news, not consequences attributed to your show.',...noteworthy.slice(0,3)]);
  }

  const attention=[];
  const oldPending=new Set(before?.pending||[]);
  const newPending=(s.inbox||[]).filter(m=>m.kind==='decision'&&!m.answer&&!oldPending.has(m.id));
  if(newPending.length)attention.push(newPending.length+' new inbox decision'+(newPending.length===1?'':'s')+' need'+(newPending.length===1?'s':'')+' a reply.');
  for(const w of s.roster||[]){
   if(w.injury>0)attention.push((w.short||w.name)+' is unavailable for '+w.injury+' more week'+(w.injury===1?'':'s')+'.');
   const sat=s.ambitions?.w?.[w.id]?.sat;
   if(Number.isFinite(sat)&&sat<30)attention.push((w.short||w.name)+' has low ambition satisfaction ('+sat+').');
   else if(w.morale<25)attention.push((w.short||w.name)+' has low morale ('+w.morale+').');
  }
  if(!attention.length)attention.push('No urgent new personnel issues are flagged by the current state. Review next week’s offers and bookings.');
  add('Before next week',attention.slice(0,5));

  const best=results.reduce((a,b)=>n(a.stars)>n(b.stars)?a:b,results[0]||{});
  const lede=n(best.stars)>=4?'A standout bout in the books. Here is what the week actually changed.':
   n(best.stars)>=3?'A solid night in the ring. Here is how the results affected the office.':
   'The card is in the books. There are consequences to account for before the next show.';
  const identity=root.OfficeGame?.normaliseIdentity?.(s.identity)||{manager:'Alex Morgan',stable:'The New Guard'};
  return {from:'Your road agent',subject:'Match night report: '+identity.stable+' — S'+season+' W'+week,season,week,kind:'info',body:[`For ${identity.manager}, managing ${identity.stable}.`,lede],sections,reportVersion:1};
 }
 root.OfficeNightReport={capture,build};
})(typeof window!=='undefined'?window:globalThis);
