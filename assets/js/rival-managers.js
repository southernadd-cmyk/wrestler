/* THE OFFICE v0.3.16 — rival managers.
   The six agencies stop waiting for the phone. Each week every manager works the bookers for the
   wrestlers who want something most, gets them onto the cards that will push them, and keeps an eye on
   unhappy wrestlers in other stables, including yours. A spot you sat on for a week can go to one of
   theirs, a manager can make you an offer for a wrestler who wants out, and the circuit talks about
   who they are about to sign. Deterministic: nothing here draws a random number. */
(function installRivalManagers(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,T=root.OfficeTerritory,V4=root.OfficeWorldV4;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const info=id=>D.findWrestler(id)||{};
 const name=id=>info(id).name||id,short=id=>info(id).short||name(id);

 // push: how hard they work the bookers. poach: appetite for other people's wrestlers. thrift: how
 // carefully they spend. tiers: who they put forward first. home: the promotion they know best.
 const MANAGERS={
  iron:{push:.6,poach:.5,thrift:.5,tiers:null,home:'dock',blurb:'sells hard-hitting, dependable earners and is on the phone to Dockside every week.'},
  coastal:{push:.7,poach:.3,thrift:.5,tiers:null,home:'crown',blurb:'pitches stories and characters, and wants them on television.'},
  northern:{push:.5,poach:.6,thrift:.7,tiers:null,home:'union',blurb:'runs a tight stable and buys proven technicians.'},
  eastbank:{push:.6,poach:.2,thrift:.6,tiers:['Rookie','Prospect'],home:'union',blurb:'brings young wrestlers through and asks for chances, not titles.'},
  meridian:{push:.9,poach:.6,thrift:.3,tiers:null,home:'pulse',blurb:'chases television slots for spectacular wrestlers and spends to get them.'},
  redwood:{push:.8,poach:.8,thrift:.8,tiers:['Star'],home:'crown',blurb:'wants the best spots on the card and buys stars when the price is right.'}
 };
 const DEFAULT={push:.5,poach:.4,thrift:.5,tiers:null,home:'crown',blurb:'looks after their wrestlers.'};
 const profile=id=>MANAGERS[id]||DEFAULT;
 const BID_GAP=6,BONUS=400,POACH_GAP=2,LOBBY_COST=50,MAX_DIV=24;

 function state(t=G.S?.territory){
  if(!t)return null;
  const a=t.agents&&typeof t.agents==='object'?t.agents:(t.agents={});
  a.lobby??={};a.rel??={};a.seen??=[];a.wanted??={};a.claimed??=[];a.lastPoach??=-99;a.lastBid??=-99;a.lastRumour??=-99;a.lastTurn??=-99;
  return a;
 }
 const rel=(a,pid,team)=>a.rel[pid]?.[team]??50;
 function nudge(a,pid,team,d){(a.rel[pid]??={})[team]=clamp(rel(a,pid,team)+d);}
 // How strongly a manager is pushing one wrestler at one promotion this week (0 when nobody is).
 function lobbyWeight(t,pid,id){return t?.agents?.lobby?.[pid]?.[id]?.w||0;}

 function ambition(s,id){return s.ambitions?.w?.[id]||null;}
 function pressure(s,id){const e=ambition(s,id);return e?clamp((100-e.sat)*(.6+(info(id).ego??55)/100)):20;}
 // A wrestler's best place on any card (0 opener … 3 main event).
 function bestSlot(s,t,id){const div=D.divisionOf(id);return Math.max(-1,...D.PROMOS.map(p=>D.SLOTS[T.promotionRank(p.id,div,t,s).find(w=>w.id===id)?.slot]?.rank??-1));}
 // A promotion this wrestler has not worked yet, one that suits their style first, then the easiest to climb.
 function freshPromo(s,t,id,team){
  const div=D.divisionOf(id),home=profile(team.id).home;
  const size=pid=>Object.keys(t.cards[pid]||{}).filter(x=>D.divisionOf(x)===div).length;
  const suits=p=>D.STYLE_PLAN[info(id).style]===p.likes||p.id===home?0:1;
  return D.PROMOS.filter(p=>!t.cards[p.id]?.[id]&&size(p.id)<MAX_DIV)
   .sort((x,y)=>suits(x)-suits(y)||mainCut(s,t,x.id,div)-mainCut(s,t,y.id,div)||x.id.localeCompare(y.id))[0]||null;
 }
 // The score it takes to be a main-event name in one division at one promotion: lower is easier to climb.
 function mainCut(s,t,pid,div){const r=T.promotionRank(pid,div,t,s);return r.filter(w=>w.slot==='main').at(-1)?.score??0;}
 // Where a manager takes a wrestler, given what the wrestler wants.
 function targetPromo(s,t,id,team){
  const e=ambition(s,id),kind=e?.kind,div=D.divisionOf(id),prof=profile(team.id);
  const on=D.PROMOS.filter(p=>t.cards[p.id]?.[id]);
  const slotAt=pid=>T.promotionRank(pid,div,t,s).find(w=>w.id===id)?.slot||'opener';
  const rankAt=pid=>{const r=T.promotionRank(pid,div,t,s);const i=r.findIndex(w=>w.id===id);return i<0?99:i;};
  const best=on.slice().sort((x,y)=>rankAt(x.id)-rankAt(y.id)||y.reach-x.reach)[0];
  const rankOf=()=>best?(D.SLOTS[slotAt(best.id)]?.rank??0):0;
  if(kind==='stage')return D.PROMOS.find(p=>p.id==='union'&&t.cards.union?.[id])||D.PROMOS.find(p=>p.id==='crown');
  if(kind==='money')return on.slice().sort((x,y)=>y.reach-x.reach)[0]||D.PROMOS.find(p=>p.id===prof.home);
  if(kind==='rivalry'&&e.target){const there=on.find(p=>t.cards[p.id]?.[e.target]);if(there)return there;}
  // Stuck near the bottom everywhere: try a promotion that suits them and that they have not worked yet.
  const stuck=!best||rankOf()<=1;
  if(stuck&&['title','push','respect'].includes(kind)){
   const suits=p=>D.STYLE_PLAN[info(id).style]===p.likes||p.id===prof.home?0:1;
   const fresh=D.PROMOS.filter(p=>!t.cards[p.id]?.[id])
    .sort((x,y)=>suits(x)-suits(y)||mainCut(s,t,x.id,div)-mainCut(s,t,y.id,div)||x.id.localeCompare(y.id))[0];
   if(fresh)return fresh;
  }
  if(kind==='title'||kind==='push')return best||D.PROMOS.find(p=>p.id===prof.home);
  return D.PROMOS.find(p=>p.id===prof.home&&t.cards[p.id]?.[id])||best||D.PROMOS.find(p=>p.id===prof.home);
 }

 // ---------------------------------------------------------------------------------------------
 // The managers' week. Runs after the circuit's matches, so this week's lobbying shapes next week's card.
 function turn(s,t,week,reports){
  const a=state(t),w=s?.worldV4;if(!a||!w||a.lastTurn===week)return;
  a.lastTurn=week;
  // Claimed offers are real circuit bookings, then leave the queue after their show.
  a.claimed=a.claimed.filter(c=>c.at>week);
  // Grudges against you fade, slowly.
  if(week%8===0)for(const k in a.grudge||{})a.grudge[k]=Math.max(0,a.grudge[k]-1);
  const teamOf=id=>w.contracts[id]?.owner==='ai'?w.contracts[id].agencyId:null;
  const teams=t.teams.filter(x=>w.agencies[x.id]);

  // 1. Bookers remember whose wrestlers delivered.
  for(const m of t.lastResults?.week===week?t.lastResults.matches:[])for(const id of [m.a,m.b]){
   const team=teamOf(id);if(!team)continue;
   if(m.stars>=3)nudge(a,m.pid,team,.5);
   if(m.story&&m.winner===id&&lobbyWeight(t,m.pid,id))nudge(a,m.pid,team,1);
  }
  // Bookers' opinions fade back towards neutral when nothing feeds them.
  for(const pid in a.rel)for(const team in a.rel[pid])a.rel[pid][team]=Math.round((a.rel[pid][team]+(50-a.rel[pid][team])*.03)*10)/10;

  // 2. Lobbying: each manager pushes the wrestlers who want something most, at the right promotion.
  const lobby={};
  for(const team of teams){
   const prof=profile(team.id),agency=w.agencies[team.id];
   if(agency.cash<agency.weeklyPayroll*(1+prof.thrift))continue;
   const picks=team.roster.filter(id=>w.contracts[id]?.owner==='ai')
    .map(id=>({id,v:pressure(s,id)*prof.push+(info(id).style===team.style?8:0)+(prof.tiers?.includes(info(id).tier)?15:0)+(info(id).heat||50)*.1+hash(team.id+id+week)*5}))
    .sort((x,y)=>y.v-x.v||x.id.localeCompare(y.id)).slice(0,prof.push>=.8?2:1);
   let moved=false;
   for(const {id} of picks){
    const p=targetPromo(s,t,id,team);if(!p)continue;
    const div=D.divisionOf(id),card=t.cards[p.id]??={};
    if(!card[id]){
     // Getting a wrestler who wants a bigger stage onto a television card: one introduction a week, if there is room.
     const size=Object.keys(card).filter(x=>D.divisionOf(x)===div).length;
     if(moved||size>=MAX_DIV||ambition(s,id)?.kind!=='stage')continue;
     card[id]={score:Math.round(18+(info(id).ring||60)*.2),matches:0,wins:0};moved=true;
     reports.push(`${team.manager} has got ${name(id)} work at ${p.name}.`);
    }
    agency.cash-=LOBBY_COST;
    const kind=ambition(s,id)?.kind||null;
    (lobby[p.id]??={})[id]={by:team.id,w:Math.round(clamp(20+pressure(s,id)*.3+rel(a,p.id,team.id)*.3,0,90)),kind,week};
    if(prof.push>=.8)nudge(a,p.id,team.id,-.5);
   }
  }
  a.lobby=lobby;

  // 2b. Every eight weeks each manager finds new work for their best wrestler stuck low on every card.
  for(const [n,team] of teams.entries()){
   if((week+n)%8!==0)continue;
   const stuck=team.roster.filter(id=>w.contracts[id]?.owner==='ai'&&bestSlot(s,t,id)<=1)
    .sort((x,y)=>(info(y).ring||60)-(info(x).ring||60)||x.localeCompare(y))[0];
   if(!stuck)continue;
   const p=freshPromo(s,t,stuck,team);if(!p)continue;
   t.cards[p.id]??={};t.cards[p.id][stuck]={score:Math.round(18+(info(stuck).ring||60)*.2),matches:0,wins:0};
   reports.push(`${team.manager} has got ${name(stuck)} work at ${p.name}.`);
  }

  // 3. A spot you sat on for a week can go to somebody else's wrestler.
  takeSpot(s,t,a,week);
  a.seen=(s.offers||[]).map(o=>o.id);

  // 4. A manager with money and room picks off an unhappy wrestler from another stable.
  if(week-a.lastPoach>=POACH_GAP){
   const titled=new Set(D.PROMOS.flatMap(p=>D.DIVISION_ORDER.map(d=>t.titles?.[p.id]?.[d]?.holder)).filter(Boolean));
   for(const team of teams.slice().sort((x,y)=>profile(y.id).poach-profile(x.id).poach||x.id.localeCompare(y.id))){
    const prof=profile(team.id),agency=w.agencies[team.id];
    if(prof.poach<.5)continue;
    const target=t.teams.filter(x=>x!==team&&x.roster.length>3).flatMap(x=>x.roster.map(id=>({id,from:x})))
     .filter(x=>w.contracts[x.id]?.owner==='ai'&&!titled.has(x.id)&&(ambition(s,x.id)?.sat??50)<35)
     .filter(x=>agency.cash>=(info(x.id).fee||1000)+agency.weeklyPayroll*3)
     .map(x=>({...x,v:((info(x.id).ring||60)+(info(x.id).heat||50))/2+(info(x.id).style===team.style?10:0)+(prof.tiers?.includes(info(x.id).tier)?12:0)}))
     .sort((x,y)=>y.v-x.v||x.id.localeCompare(y.id))[0];
    if(!target)continue;
    // A full stable makes room by letting its weakest wrestler go, but only for somebody clearly better.
    let cut=null;
    if(team.roster.length>=agency.cap){
     const value=id=>((info(id).ring||60)+(info(id).heat||50))/2;
     cut=team.roster.filter(id=>!titled.has(id)).sort((x,y)=>value(x)-value(y)||x.localeCompare(y))[0];
     if(!cut||value(target.id)<value(cut)+10)continue;
    }
    if(cut&&V4.releaseAI(s,cut,week))reports.push(`${team.manager} released ${name(cut)} from ${team.name} to make room.`);
    if(!V4.releaseAI(s,target.id,week))continue;
    if(!V4.hire(s,team.id,target.id,week)){reports.push(`${name(target.id)} left ${target.from.name}.`);break;}
    const old=w.agencies[target.from.id];if(old)old.cash+=Math.round((info(target.id).fee||1000)*.3);
    const e=ambition(s,target.id);if(e)e.sat=clamp(e.sat+15);
    a.lastPoach=week;
    reports.unshift(`${team.manager} poached ${name(target.id)} from ${target.from.name}.`);
    break;
   }
  }

  // 5. An offer for one of your wrestlers who wants out, or who a manager simply wants.
  bid(s,t,a,week);

  // 6. The week before the agencies sign from the market, the circuit hears who they are after.
  a.wanted={};
  if(week%5===4){
   const taken=new Set(),lines=[];
   for(const team of teams){
    const agency=w.agencies[team.id];if(team.roster.length>=agency.cap)continue;
    const p=V4.marketTarget(s,team,taken);if(!p)continue;taken.add(p.id);
    if(!s.free.some(x=>x.id===p.id))continue;
    a.wanted[p.id]=team.id;lines.push(`• ${team.manager} (${team.name}) is after ${p.name}.`);
   }
   if(lines.length&&week!==a.lastRumour){
    a.lastRumour=week;
    G.msg?.({from:'Your road agent',subject:'Word on the circuit',kind:'info',body:['The agencies sign from the market next week. This is who they are talking to:',...lines,'If you want any of them, sign them this week.']});
   }
  }
 }
 function takeSpot(s,t,a=state(t),week=t.week){
  const seen=new Set(a.seen);
  // Only ordinary, unsigned open slots can be reassigned. Earned title shots, callouts,
  // rematches, named bookings and all multi-date programmes belong to their actual contracts.
  const open=(s.offers||[]).filter(o=>seen.has(o.id)&&!o.wid&&!o.talk&&!o.title&&!o.programme&&!o.tag&&o.eventAbs>=week&&['main','feature'].includes(o.slot));
  for(const o of open){
   const div=D.divisionOf(o.rid);
   const rival=Object.entries(a.lobby[o.pid]||{}).filter(([id,l])=>D.divisionOf(id)===div&&id!==o.rid&&l.w>=45)
    .sort((x,y)=>y[1].w-x[1].w||x[0].localeCompare(y[0]))[0];
   if(!rival)continue;
   const [id,l]=rival,team=t.teams.find(x=>x.id===l.by),p=D.PROMOS.find(x=>x.id===o.pid);
   if(!team||!p||!T.contracted(s,id)||!T.contracted(s,o.rid))continue;
   // A manager can take a slot only when the real replacement can be placed on the circuit.
   // Do not claim participants already tied to an AI programme or a player contract.
   const at=Math.max(week+1,o.eventAbs),booked=new Set(
    [...(s.card||[]),...(s.futureBookings||[])].filter(c=>c.eventAbs===at).flatMap(c=>[c.wid,c.rid]));
   const claimed=new Set(a.claimed.filter(c=>c.at===at).flatMap(c=>[c.a,c.b]));
   const storyCast=new Set(Object.values(t.booking?.promos||{}).flatMap(pr=>(pr.live||[]).flatMap(st=>[st.a,st.b])));
   if([id,o.rid].some(x=>booked.has(x)||claimed.has(x)||storyCast.has(x)))continue;
   const title=!!o.title;
   if(title&&(t.titles?.[o.pid]?.[div]?.holder!==o.rid
     ||root.OfficeProgrammes?.claims?.(s,t,at)?.belts?.has(o.pid+':'+div)))continue;
   // A manager you have poached from is keener to take something back.
   const chance=(l.w-40)/100*profile(l.by).push*(o.title?.5:1)*(1+(a.grudge?.[l.by]||0)*.3);
   if(hash(o.id+':'+week)>=chance)continue;
   s.offers=s.offers.filter(x=>x!==o);
   a.claimed.push({id:o.id,pid:o.pid,div,a:id,b:o.rid,at,title,by:team.id});
   // A stolen spot must appear on an actual card, not just in the letter.
   l.w=Math.min(90,l.w+10);nudge(a,o.pid,l.by,2);
   G.msg?.({from:'Your road agent',subject:`${team.manager} got there first`,kind:'info',body:[
    `The ${o.title?'title match':D.SLOTS[o.slot].name.toLowerCase()} at ${p.name} you were sitting on has gone. ${team.manager} talked ${p.voice} into booking ${name(id)} against ${name(o.rid)} in ${'S'+Math.floor((at-1)/16+1)+' W'+((at-1)%16+1)} instead.`,
    'Offers with a reply-by date are not held for ever. If you want a spot that matters, take it while it is on the table.']});
   return;
  }
 }
 function bid(s,t,a,week){
  const w=s.worldV4;
  const sore=Object.values(a.grudge||{}).some(n=>n>=2);
  if(week-a.lastBid<(sore?BID_GAP-2:BID_GAP)||s.inbox.some(m=>m.dtype==='agent_bid'&&!m.answer))return;
  const roster=s.roster.filter(x=>(x.heat||0)>=45&&((x.loyal||50)<50||(ambition(s,x.id)?.sat??50)<35));
  for(const wr of roster.sort((x,y)=>(x.loyal||50)-(y.loyal||50)||x.id.localeCompare(y.id))){
   // A manager with a grudge against you comes for your wrestlers whatever their usual appetite.
   const team=t.teams.filter(x=>w.agencies[x.id]&&(profile(x.id).poach>=.4||(a.grudge?.[x.id]||0)>=2)&&V4.canAfford(s,x.id,wr.id))
    .map(x=>({x,v:(info(wr.id).style===x.style?20:0)+profile(x.id).poach*30+(profile(x.id).tiers?.includes(wr.tier)?10:0)+w.agencies[x.id].cash/1000+(a.grudge?.[x.id]||0)*15}))
    .sort((p,q)=>q.v-p.v||p.x.id.localeCompare(q.x.id))[0]?.x;
   if(!team)continue;
   const fee=Math.round((wr.fee||1000)*(.7+profile(team.id).poach*.4)/10)*10;
   a.lastBid=week;
   const wants=(ambition(s,wr.id)?.sat??50)<35||(wr.loyal||50)<45;
   G.msg?.({from:`${team.manager}, ${team.name}`,subject:`An offer for ${wr.short}`,kind:'decision',dtype:'agent_bid',args:[wr.id,team.id,fee],
    body:[`“I’ll be straight with you. I want ${wr.name}, and I’ll pay ${G.money(fee)} to make it happen today.”`,
     `Road agent: ${wants?`${wr.short} has been listening. I would not count on them staying happy if you say no.`:`${wr.short} hasn’t asked to go. Saying no might even help.`}`],
    options:[{id:'accept',label:`Sell for ${G.money(fee)}`,hint:`${wr.short} joins ${team.name} today. The money is yours.`},
     {id:'counter',label:`Ask for ${G.money(Math.round(fee*1.4/10)*10)}`,hint:'They may pay it. They may walk away.'},
     {id:'bonus',label:`Pay a loyalty bonus (${G.money(BONUS)})`,hint:`${wr.short} stays and knows you paid to keep them: loyalty +20. ${team.manager} backs off.`},
     {id:'refuse',label:'Not for sale',hint:wants?`${wr.short} wanted to hear that offer. Loyalty will suffer.`:`${wr.short} will appreciate it.`}]});
   return;
  }
 }
 // Selling a wrestler to a rival agency: they leave your stable and sign with them.
 function sell(s,wr,teamId,fee){
  if(!V4.canAfford(s,teamId,wr.id))return false;
  G.leave(wr,fee);
  if(!V4.hire(s,teamId,wr.id))return true;
  const agency=s.worldV4.agencies[teamId];if(agency)agency.cash-=Math.max(0,fee-(info(wr.id).fee||1000));
  const e=ambition(s,wr.id);if(e)e.sat=Math.max(e.sat,55);
  return true;
 }
 const originalAnswer=G.answer;
 G.answer=function(mid,opt){
  const s=G.S,m=s?.inbox.find(x=>x.id===mid);
  if(!m||m.dtype!=='agent_bid')return originalAnswer(mid,opt);
  if(m.answer)return null;
  if(!m.options.some(o=>o.id===opt))return 'Choose one of the available responses.';
  if(opt==='bonus'&&s.cash<BONUS)return `Not enough cash for the ${G.money(BONUS)} bonus. Choose another response.`;
  const [wid,teamId,fee]=m.args,wr=G.W(wid),team=s.territory.teams.find(x=>x.id===teamId);let text;
  const wants=wr&&((ambition(s,wid)?.sat??50)<35||(wr.loyal||50)<45);
  if(!wr||!team)text='The offer has lapsed.';
  else if(opt==='bonus'){s.cash-=BONUS;wr.loyal=G.clamp((wr.loyal||50)+20);wr.morale=G.clamp((wr.morale||50)+5);const e=ambition(s,wid);if(e)e.sat=clamp(e.sat+5);
   text=`${wr.short} takes the ${G.money(BONUS)} and stays. ${team.manager} has moved on, for now. Loyalty +20.`;}
  else if(opt==='accept')text=sell(s,wr,teamId,fee)?`${wr.short} has signed for ${team.name}. ${G.money(fee)} is in the account.`:`${team.manager} can no longer afford it. The offer is withdrawn and ${wr.short} stays.`;
  else if(opt==='counter'){
   const more=Math.round(fee*1.4/10)*10;
   if(hash(mid+':counter')<.35+profile(teamId).poach*.3&&sell(s,wr,teamId,more))text=`${team.manager} grumbles and pays it. ${wr.short} has signed for ${team.name}; ${G.money(more)} is in the account.`;
   else{if(wants){wr.loyal=G.clamp((wr.loyal||50)-4);}text=`${team.manager} walks away. ${wr.short} stays${wants?', and knows you tried to sell them for more':''}.`;}
  }else{
   if(wants){wr.loyal=G.clamp((wr.loyal||50)-8);wr.morale=G.clamp((wr.morale||50)-4);const e=ambition(s,wid);if(e)e.sat=clamp(e.sat-8);text=`${wr.short} heard about it. They wanted that move. Loyalty −8.`;}
   else{wr.loyal=G.clamp((wr.loyal||50)+3);text=`Word gets back to ${wr.short} that you turned down good money. Loyalty +3.`;}
  }
  m.answer=opt;m.outcome=text;m.read=true;G.save();return text;
 };
 if(V4){
  const originalEvolve=V4.evolve;
  V4.evolve=function(s,t,week,reports){
   const out=originalEvolve.call(this,s,t,week,reports);
   try{turn(s,t,week,reports);}catch(e){}
   return out;
  };
 }

 // ---------------------------------------------------------------------------------------------
 // For the screens.
 function lobbyAt(pid,s=G.S){
  const t=s?.territory,a=t?.agents;if(!a)return [];
  return Object.entries(a.lobby[pid]||{}).map(([id,l])=>{const team=t.teams.find(x=>x.id===l.by);
   return {id,name:name(id),manager:team?.manager||l.by,team:team?.name||l.by,weight:l.w,kind:l.kind,want:l.kind?root.OfficeAmbitions?.KINDS?.[l.kind]?.name||null:null};})
   .sort((x,y)=>y.weight-x.weight);
 }
 function wantedBy(id,s=G.S){const t=s?.territory,team=t?.agents?.wanted?.[id];return team?t.teams.find(x=>x.id===team)||null:null;}
 function standing(pid,teamId,s=G.S){return Math.round(rel(state(s?.territory)||{rel:{}},pid,teamId));}
 function blurb(team){return `${team.manager} ${profile(team.id).blurb}`;}

 root.OfficeManagers={MANAGERS,profile,state,lobbyWeight,lobbyAt,wantedBy,standing,blurb,turn,takeSpot};
})(typeof window!=='undefined'?window:globalThis);
