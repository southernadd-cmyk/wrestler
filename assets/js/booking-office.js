/* THE OFFICE v0.3.15 — the booking office.
   Each promoter's booker now plans. They run storylines with a beginning and an end: a title chase
   that builds a challenger towards a payoff show, a grudge settled over three matches, and a rising
   star walked up the card towards a main-event name. Each booker plans in their own way, chooses who
   wins to serve the story, and sometimes changes their mind on the night.
   Pure where it matters: decide() reads the career and returns the week's plan and card without
   changing anything, so the start screen can show next week's real bill; territory.evolve() commits it. */
(function installBookingOffice(root){'use strict';
 const D=root.OfficeData,T=root.OfficeTerritory,G=root.OfficeGame;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const quarter=n=>Math.round(n*4)/4;
 const weekLabel=a=>`S${Math.floor((a-1)/16)+1} W${(a-1)%16+1}`;
 const MAX_CARD=2,DONE_KEEP=6;

 // How each booker works. `prefer` is the order they reach for storylines.
 const STYLE={
  aggressive:{prefer:['grudge','title','rise'],titleLen:3,grudge:[0,1,3],rise:[0,1,2,3],swerve:.15,noise:20,max:2,
   blurb:'books grudges first and never waits long for the payoff.'},
  showman:{prefer:['rise','grudge','title'],titleLen:3,grudge:[0,2,4],rise:[0,1,2,3],swerve:.3,noise:30,max:2,
   blurb:'wants new stars and loves a surprise on the night.'},
  traditional:{prefer:['title','grudge','rise'],titleLen:5,grudge:[0,2,4],rise:[0,2,3,5],swerve:.05,noise:10,max:2,
   blurb:'builds long title chases and pays them off the way the story says.'},
  cold:{prefer:['title','rise','grudge'],titleLen:4,grudge:[0,2,4],rise:[0,2,3,5],swerve:.1,noise:8,max:1,
   blurb:'rewards the best workers and lets a good champion reign.'}
 };
 const TYPE_NAME={title:'Title chase',grudge:'Grudge',rise:'Rising star'};
 const styleOf=p=>STYLE[p.personality]||STYLE.traditional;

 function blank(week){
  return {v:1,promos:Object.fromEntries(D.PROMOS.map(p=>[p.id,{live:[],done:[],
   // Every booker can start planning in the opening week, rather than waiting for a staggered offset.
   next:Object.fromEntries(D.DIVISION_ORDER.map(d=>[d,week]))}]))};
 }

 // ---------------------------------------------------------------------------------------------
 // The week's plan and card. Reads s and t; returns {state, bill, notes}. Changes nothing.
 function decide(s,t,week,busy=new Set((s.card||[]).map(c=>c.rid))){
  const st=JSON.parse(JSON.stringify(t.booking||blank(week)));
  for(const p of D.PROMOS)st.promos[p.id]??={live:[],done:[],next:Object.fromEntries(D.DIVISION_ORDER.map(d=>[d,week]))};
  busy=new Set(busy);
  const notes=[],bill=[];
  const amb=id=>s.ambitions?.w?.[id]||null;
  const info=id=>G.personnel(s,id)||{};
  // Same saved career => same planned world; distinct careers are no longer
  // locked into identical booking upsets, feuds and tie-breaks.
  // Week 2 is also previewed on the unsaved welcome poster, where no career seed
  // exists yet. Keep that advertised bill exact; vary each career's later shows.
  const worldHash=text=>hash(String(week<=2?0:(s.careerSeed??s.seed??0))+':'+text);
  const pressure=id=>{const e=amb(id);return e?clamp((100-e.sat)*(.6+(info(id).ego??55)/100)):0;};
  const bond=(a,b)=>s.bonds?.pairs?.[[a,b].sort().join('|')]?.score||0;
  // A rival manager working the booker on this wrestler's behalf (v0.3.16).
  const lobby=(pid,id)=>t.agents?.lobby?.[pid]?.[id]?.w||0;
  // Who each promotion can book in each division: its ranked circuit wrestlers, not yours.
  const pools={};
  for(const p of D.PROMOS){pools[p.id]={};for(const div of D.DIVISION_ORDER)
   pools[p.id][div]=T.promotionRank(p.id,div,t,s).filter(w=>!w.owned&&T.contracted(s,w.id)&&!w.injury);}
  const row=(pid,div,id)=>pools[pid][div].find(w=>w.id===id)||null;
  // A promotion in trouble books desperately: shorter chases, more surprises, belts that move (v0.3.17).
  const desperate=pid=>!!t.business?.[pid]?.desperate;
  const cfgFor=p=>{const c=styleOf(p);return desperate(p.id)?{...c,titleLen:Math.max(2,c.titleLen-1),swerve:Math.min(.45,c.swerve*1.5)}:c;};
  const pref=(p,w,salt)=>w.score+(w.heat||50)*.3+pressure(w.id)*.15+lobby(p.id,w.id)*.15+(p.personality==='cold'?(w.ring||60)*.3:0)+worldHash(salt+':'+w.id)*styleOf(p).noise;
  // Your programmes (v0.3.18) have first call on their belt and their opponents.
  const claim=root.OfficeProgrammes?.claims(s,t,week)||{belts:new Set(),cast:new Set()};
  const cast=new Set([...Object.values(st.promos).flatMap(x=>x.live.flatMap(y=>[y.a,y.b])),...claim.cast]);
  const per={};const count=(pid,div)=>per[pid+':'+div]||0;
  const add=(m)=>{bill.push(m);busy.add(m.a.id);busy.add(m.b.id);per[m.pid+':'+m.div]=count(m.pid,m.div)+1;};
  const pIndex=Object.fromEntries(D.PROMOS.map((p,i)=>[p.id,i])),dIndex=Object.fromEntries(D.DIVISION_ORDER.map((d,j)=>[d,j]));
  const short=id=>info(id).short||info(id).name||id,name=id=>info(id).name||id;
  const finish=(story,outcome,text)=>{
   const pr=st.promos[story.pid];
   pr.live=pr.live.filter(x=>x.id!==story.id);
   pr.done.unshift({...story,status:outcome,ended:week,text});pr.done=pr.done.slice(0,DONE_KEEP);
   pr.next[story.div]=Math.max(pr.next[story.div]||0,week+2);
   cast.delete(story.a);cast.delete(story.b);
  };

  // 0. A rival manager who took an expired player offer must actually work that slot.
  // This is part of the pure predicted bill, so the start poster and next week's circuit agree.
  for(const c of t.agents?.claimed||[]){
   if(c.at!==week)continue;
   const a=row(c.pid,c.div,c.a),b=row(c.pid,c.div,c.b);
   const p=D.PROMOS.find(x=>x.id===c.pid);
   const title=!!c.title&&t.titles?.[c.pid]?.[c.div]?.holder===c.b&&!claim.belts.has(c.pid+':'+c.div);
   if(!p||!a||!b||busy.has(c.a)||busy.has(c.b)||cast.has(c.a)||cast.has(c.b)
      ||(c.title&&!title)||count(c.pid,c.div)>=MAX_CARD){
    notes.push((p?.name||c.pid)+': the replacement booking for '+name(c.a)+' against '+name(c.b)+' could not go ahead.');
    continue;
   }
   const i=pIndex[c.pid],j=dIndex[c.div],salt=c.id+':rival-spot:'+week;
   const winner=pref(p,a,salt)+(title?10:0)>=pref(p,b,salt)?a.id:b.id;
   add({i,j,pid:c.pid,div:c.div,a,b,title,winner,stars:title?3:2.5,
    line:p.name+': '+name(winner)+' defeated '+name(winner===a.id?b.id:a.id)+
     '. '+(title?'The title was on the line.':'The replacement match went ahead after the manager secured the spot.'),
    rivalSpotId:c.id});
   cast.add(c.a);cast.add(c.b);
   notes.push(p.name+': '+name(c.a)+' v '+name(c.b)+' is booked after '+(t.teams.find(x=>x.id===c.by)?.manager||'a rival manager')+' won the vacant spot.');
  }

  // 1. Storylines whose people are gone, or whose belt has moved, are dropped.
  for(const p of D.PROMOS)for(const story of st.promos[p.id].live.slice()){
   const ok=row(p.id,story.div,story.a)&&row(p.id,story.div,story.b)&&(story.type!=='title'||t.titles?.[p.id]?.[story.div]?.holder===story.b);
   if(!ok){finish(story,'dropped',`${p.voice} dropped the plans for ${name(story.a)} and ${name(story.b)}.`);notes.push(`${p.name}: plans for ${name(story.a)} and ${name(story.b)} have been dropped.`);}
  }

  // 2. New storylines: one at a time per division, in the order this booker likes them.
  for(const p of D.PROMOS)for(const div of D.DIVISION_ORDER){
   const pr=st.promos[p.id],cfg=cfgFor(p),pool=pools[p.id][div];
   const live=pr.live.filter(x=>x.div===div);
   if(live.length>=cfg.max||week<(pr.next[div]??week)-(desperate(p.id)?1:0))continue;
   const free=pool.filter(w=>!cast.has(w.id));
   for(const type of cfg.prefer){
    if(live.some(x=>x.type===type))continue;
    const story=propose(type,p,div,pool,free,week);
    if(!story)continue;
    pr.live.push(story);cast.add(story.a);cast.add(story.b);pr.next[div]=week+2;
    notes.push(announce(p,story));
    break;
   }
  }
  function propose(type,p,div,pool,free,wk){
   const cfg=cfgFor(p),id=`${p.id}-${div}-${wk}-${type}`,base={id,pid:p.id,div,type,start:wk,delays:0};
   if(type==='title'){
    const holder=t.titles?.[p.id]?.[div]?.holder;
    if(!holder||!pool.some(w=>w.id===holder)||cast.has(holder)||claim.belts.has(p.id+':'+div))return null;
    const champ=row(p.id,div,holder);
    const who=free.filter(w=>w.id!==holder&&['main','feature'].includes(w.slot)&&w.stable!==champ.stable)
     .map(w=>({w,v:pref(p,w,id)+(amb(w.id)?.kind==='title'?25:0)+pressure(w.id)*.3+lobby(p.id,w.id)*.4+(w.slot==='main'?10:0)}))
     .sort((x,y)=>y.v-x.v||x.w.id.localeCompare(y.w.id))[0]?.w;
    if(!who)return null;
    const {at,counter}=payoffWeek(p,wk,wk+cfg.titleLen-1);
    const beats=[];for(let k=wk;k<at;k++)beats.push({at:k,kind:'build'});
    beats.push({at,kind:'payoff'});
    return {...base,a:who.id,b:holder,heat:clamp(30+pressure(who.id)*.2+(who.heat||50)*.2),beats,counter};
   }
   if(type==='grudge'){
    let pair=null;
    for(let x=0;x<free.length;x++)for(let y=x+1;y<free.length;y++){
     const n=bond(free[x].id,free[y].id);if(n<=-25&&(!pair||n<pair.n))pair={a:free[x],b:free[y],n};
    }
    if(!pair){
     const keen=free.filter(w=>amb(w.id)?.kind==='rivalry').sort((x,y)=>pressure(y.id)+lobby(p.id,y.id)-pressure(x.id)-lobby(p.id,x.id)||x.id.localeCompare(y.id))[0];
     if(keen){
      const target=amb(keen.id).target,foe=free.find(w=>w.id===target)||free.filter(w=>w.id!==keen.id&&w.stable!==keen.stable)
       .sort((x,y)=>Math.abs(x.score-keen.score)-Math.abs(y.score-keen.score)||x.id.localeCompare(y.id))[0];
      if(foe)pair={a:keen,b:foe,n:bond(keen.id,foe.id)};
     }
    }
    if(!pair)return null;
    return {...base,a:pair.a.id,b:pair.b.id,heat:clamp(40+Math.abs(pair.n)*.4),beats:cfg.grudge.map((g,k)=>({at:wk+g,kind:k===cfg.grudge.length-1?'blowoff':'clash'}))};
   }
   if(type==='rise'){
    const riser=free.filter(w=>['opener','mid'].includes(w.slot))
     .map(w=>({w,v:(w.ring||60)*.4+pressure(w.id)*.4+lobby(p.id,w.id)*.3+(['push','respect','stage'].includes(amb(w.id)?.kind)?20:0)+worldHash(id+w.id)*10}))
     .sort((x,y)=>y.v-x.v||x.w.id.localeCompare(y.w.id))[0]?.w;
    if(!riser)return null;
    const holder=t.titles?.[p.id]?.[div]?.holder;
    const target=free.filter(w=>w.slot==='main'&&w.id!==holder&&w.id!==riser.id&&w.stable!==riser.stable)
     .sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id))[0];
    if(!target)return null;
    return {...base,a:riser.id,b:target.id,heat:clamp(25+pressure(riser.id)*.2),beats:cfg.rise.map((g,k)=>({at:wk+g,kind:k===cfg.rise.length-1?'payoff':'build'}))};
   }
   return null;
  }
  // Title nights and the circuit: some bookers put theirs on the same week as a rival's, to take its crowd;
  // the careful ones move theirs out of the way.
  function payoffWeek(p,wk,planned){
   const rivals=D.PROMOS.filter(x=>x!==p).flatMap(x=>(st.promos[x.id]?.live||[]).filter(y=>y.type==='title').map(y=>({pid:x.id,at:y.beats.at(-1).at})));
   if(p.personality==='aggressive'||p.personality==='showman'||desperate(p.id)){
    const hit=rivals.filter(r=>r.at>wk&&r.at<=planned+1).sort((x,y)=>Math.abs(x.at-planned)-Math.abs(y.at-planned)||x.pid.localeCompare(y.pid))[0];
    if(hit)return {at:hit.at,counter:hit.pid};
    return {at:planned,counter:null};
   }
   let at=planned;while(rivals.some(r=>r.at===at))at++;
   return {at,counter:null};
  }
  function announce(p,story){
   const belt=D.belt(p.id,story.div),pay=story.beats.at(-1).at;
   if(story.type==='title'){const rival=story.counter&&D.PROMOS.find(x=>x.id===story.counter);
    return `${p.name}: ${p.voice} has ${name(story.a)} on the road to ${name(story.b)} and the ${belt.name}. The title match is planned for ${weekLabel(pay)}${rival?`, the same week as ${rival.name}’s. It is going head to head`:''}.`;}
   if(story.type==='grudge')return `${p.name}: ${name(story.a)} and ${name(story.b)} will settle it over ${story.beats.length} matches, ending ${weekLabel(pay)}.`;
   return `${p.name}: ${p.voice} is building ${name(story.a)} towards a match with ${name(story.b)} in ${weekLabel(pay)}.`;
  }

  // 3. This week's storyline matches, across every promotion, before the rest of the card.
  const stories=D.PROMOS.flatMap(p=>st.promos[p.id].live.map(story=>({p,story}))).sort((x,y)=>x.story.start-y.story.start||x.story.id.localeCompare(y.story.id));
  for(const {p,story} of stories){
   const beat=story.beats.find(b=>!b.done);if(!beat||beat.at!==week)continue;
   const cfg=cfgFor(p),pool=pools[p.id][story.div],k=story.beats.indexOf(beat);
   const A=row(p.id,story.div,story.a),B=row(p.id,story.div,story.b);
   let opp=null;
   if(beat.kind==='build'){
    // Somebody new each time where possible: a build-up against the same opponent twice is no build-up.
    const used=new Set(story.beats.map(b=>b.opp).filter(Boolean));
    const avail=pool.filter(w=>!busy.has(w.id)&&!cast.has(w.id)&&w.id!==story.a&&w.id!==story.b&&(!A.stable||w.stable!==A.stable));
    const others=avail.some(w=>!used.has(w.id))?avail.filter(w=>!used.has(w.id)):avail;
    if(story.type==='rise'){
     const above=others.filter(w=>w.score>A.score).sort((x,y)=>x.score-y.score||x.id.localeCompare(y.id));
     opp=above[Math.min(above.length-1,k)]||others.sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id))[0];
    }else opp=others.sort((x,y)=>Math.abs(x.score-A.score)-Math.abs(y.score-A.score)||x.id.localeCompare(y.id))[worldHash(story.id+k)<.5?0:1]||others[0];
   }else opp=B;
   if(busy.has(A.id)||!opp||busy.has(opp.id)||count(p.id,story.div)>=MAX_CARD){
    // Somebody is unavailable: the rest of the story moves back a week.
    story.delays++;story.heat=clamp(story.heat-8);
    for(const b of story.beats)if(!b.done)b.at++;
    if(story.delays>=3){finish(story,'dropped',`${p.voice} gave up on it after too many delays.`);notes.push(`${p.name}: the ${TYPE_NAME[story.type].toLowerCase()} for ${name(story.a)} has been called off.`);}
    continue;
   }
   const last=k===story.beats.length-1,stars=quarter(Math.min(4.25,2.5+story.heat/60+(last?.25:0)));
   let winner,line,title=false;
   const upset=worldHash(story.id+':upset:'+k)<cfg.swerve*.5;
   if(story.type==='title'&&beat.kind==='build'){
    winner=upset?opp.id:A.id;
    line=`${p.name}: ${name(winner)} defeated ${name(winner===A.id?opp.id:A.id)}. ${upset?`A setback for ${short(A.id)} before the title match.`:`${short(A.id)} is on the way to a title match with ${short(B.id)}.`}`;
   }else if(story.type==='title'){
    title=true;
    const held=t.titles?.[p.id]?.[story.div]||{};
    let chance=p.personality==='aggressive'?(story.heat>=55?.75:.45):p.personality==='showman'?.55:p.personality==='cold'?((A.ring||60)>(B.ring||60)+2?.5:.2):(story.heat>=55?.85:.35);
    // A long reign wears on most crowds; Grand Union's booker sees it as a reason to keep the belt where it is.
    chance+=(held.defences>=4&&p.personality!=='cold'?.15:0)+(amb(A.id)?.kind==='title'?.05:0)+(desperate(p.id)?.15:0);
    let change=worldHash(story.id+':payoff')<chance;
    if(worldHash(story.id+':swerve')<cfg.swerve)change=!change;
    winner=change?A.id:B.id;
   }else if(story.type==='grudge'){
    if(beat.kind==='clash'){
     const first=pref(p,A,story.id)>=pref(p,B,story.id)?A.id:B.id;
     winner=k===0?first:first===A.id?B.id:A.id;
     line=`${p.name}: ${name(winner)} defeated ${name(winner===A.id?B.id:A.id)}. ${short(A.id)} and ${short(B.id)} are not finished yet.`;
    }else{
     const lean=clamp(.5+(pref(p,A,story.id+'b')-pref(p,B,story.id+'b'))/200,.2,.8);
     winner=worldHash(story.id+':blowoff')<lean?A.id:B.id;
     line=`${p.name}: ${name(winner)} defeated ${name(winner===A.id?B.id:A.id)}. That settles it between ${short(A.id)} and ${short(B.id)}.`;
    }
   }else{
    if(beat.kind==='build'){
     winner=upset?opp.id:A.id;
     line=`${p.name}: ${name(winner)} defeated ${name(winner===A.id?opp.id:A.id)}. ${upset?`A setback for ${short(A.id)}.`:`${short(A.id)} keeps climbing.`}`;
    }else{
     let chance=p.personality==='showman'?.75:p.personality==='aggressive'?.65:p.personality==='cold'?((A.ring||60)>=(B.ring||60)-3?.65:.35):.6;
     winner=worldHash(story.id+':rise')<chance?A.id:B.id;
     line=`${p.name}: ${name(winner)} defeated ${name(winner===A.id?B.id:A.id)}. ${winner===A.id?`${short(A.id)} has arrived.`:`${short(B.id)} sends ${short(A.id)} back down the card.`}`;
    }
   }
   beat.done=true;beat.winner=winner;beat.opp=opp.id;
   story.heat=clamp(story.heat+6+k-(winner!==A.id&&beat.kind==='build'?5:0));
   add({i:pIndex[p.id],j:dIndex[story.div],pid:p.id,div:story.div,a:A,b:opp,title,winner,stars,line,story:{id:story.id,type:story.type,kind:beat.kind}});
   if(last){
    const won=winner===A.id;
    const text=story.type==='title'?(won?`${name(A.id)} won the ${D.belt(p.id,story.div).name} from ${name(B.id)}.`:`${name(B.id)} kept the ${D.belt(p.id,story.div).name} against ${name(A.id)}.`)
     :story.type==='grudge'?`${name(winner)} won the last word over ${name(winner===A.id?B.id:A.id)}.`
     :won?`${name(A.id)} beat ${name(B.id)} and moved up the card.`:`${name(B.id)} sent ${name(A.id)} back down the card.`;
    finish(story,won?'paid':'held',text);
   }
  }

  // 4. The rest of the card: a champion's defence every third week when no chase is running, or the usual bout.
  for(const [i,p] of D.PROMOS.entries())for(const [j,div] of D.DIVISION_ORDER.entries()){
   if(count(p.id,div)>=MAX_CARD)continue;
   const titleBooked=bill.some(m=>m.pid===p.id&&m.div===div&&m.title);
   const entries=pools[p.id][div].filter(w=>!busy.has(w.id));
   const holder=t.titles?.[p.id]?.[div]?.holder,chase=st.promos[p.id].live.some(x=>x.div===div&&x.type==='title');
   const champ=entries.find(w=>w.id===holder);
   let a,b,title=false;
   if(champ&&!chase&&!titleBooked&&!claim.belts.has(p.id+':'+div)&&(week+i+j)%3===0){
    b=entries.find(w=>w.id!==champ.id&&!cast.has(w.id))||entries.find(w=>w.id!==champ.id);
    if(b){a=champ;title=true;}
   }
   if(!title){
    const signed=entries.filter(w=>w.stable&&!cast.has(w.id));if(!signed.length)continue;
    a=signed[(week+i*3+j*5)%signed.length];
    const rivals=entries.filter(w=>w.id!==a.id&&w.stable!==a.stable&&!cast.has(w.id))
     .sort((x,y)=>Math.abs(x.score-a.score)-Math.abs(y.score-a.score)||x.id.localeCompare(y.id));
    if(!rivals.length)continue;
    b=rivals[(week*3+i+j*7)%Math.min(3,rivals.length)];
   }
   const salt=p.id+div+week,winner=pref(p,a,salt)+(title?10:0)>=pref(p,b,salt)?a.id:b.id;
   add({i,j,pid:p.id,div,a,b,title,winner,stars:title?3:2.5});
  }
  bill.sort((x,y)=>x.i-y.i||x.j-y.j);
  return {state:st,bill,notes};
 }

 // ---------------------------------------------------------------------------------------------
 // For the booking sheets.
 function view(pid,s=root.OfficeGame?.S){
  const p=D.PROMOS.find(x=>x.id===pid),t=s?.territory;
  if(!p)return null;
  const name=id=>D.findWrestler(id)?.name||id;
  const upcomingWeek=s?T.absWeek(s)+1:null;
  // A read-only forecast: the next week's existing player contracts have first claim on opponents.
  const busy=new Set((s?.futureBookings||[]).filter(c=>c.eventAbs===upcomingWeek).map(c=>c.rid));
  const forecast=t&&upcomingWeek?decide(s,t,upcomingWeek,busy):null;
  const firstLook=!!t&&!t.booking;
  // Week one has no committed circuit results. Show the opening *plans* without pretending that
  // the forecast's first-round winners and played beats have already happened.
  const pr=(t?.booking?.promos|| (firstLook?forecast?.state.promos:null))?.[pid];
  const story=x=>{
   const next=firstLook?x.beats[0]:x.beats.find(b=>!b.done),played=firstLook?[]:x.beats.filter(b=>b.done);
   return {id:x.id,type:x.type,typeName:TYPE_NAME[x.type],div:x.div,a:x.a,b:x.b,aName:name(x.a),bName:name(x.b),heat:Math.round(x.heat),
    next:next?{at:next.at,kind:next.kind}:null,payoff:x.beats.at(-1).at,played:played.length,total:x.beats.length,
    record:played.map(b=>({winner:name(b.winner),loser:name(b.winner===x.a?(b.opp||x.b):x.a)})),
    status:x.status||'live',ended:x.ended||null,text:x.text||null};
  };
  return {pid,name:p.name,voice:p.voice,style:p.personality,blurb:`${p.voice} ${styleOf(p).blurb}`,
   firstLook,upcomingWeek,
   upcoming:(forecast?.bill||[]).filter(m=>m.pid===pid).map(m=>({
    div:m.div,a:m.a.id,b:m.b.id,aName:name(m.a.id),bName:name(m.b.id),title:!!m.title,
    storyline:m.story?TYPE_NAME[m.story.type]:null
   })),
   live:(pr?.live||[]).map(story),done:(pr?.done||[]).map(story)};
 }

 root.OfficeBooking={STYLE,TYPE_NAME,decide,view,blank};
})(typeof window!=='undefined'?window:globalThis);
