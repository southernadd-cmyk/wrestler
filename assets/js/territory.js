/* The circuit: AI contracts and a separate card ledger for each promotion. */
(function(root){'use strict';
const D=root.OfficeData,G=root.OfficeGame;
const originalFreeAgents=new Set(['mara','rex','lyra','brick','juno','sol','dee','kit']);
function prepare(s,fresh=false){
 const t=s.territory??={week:0,champion:'rev',teams:[],reports:[],points:{},previous:{}};
 if(!t.stablesReady){
  const owned=new Set(s.roster.map(w=>w.id));
  const contracted=new Set(t.teams.flatMap(team=>team.roster));
  t.teams=D.STABLES.map((def,i)=>{
   const old=t.teams.find(team=>team.name===def.legacy||team.id===def.id);
   const added=def.roster.filter(id=>!contracted.has(id)&&!owned.has(id));
   for(const id of added)contracted.add(id);
   return {rep:48+i*5,wins:0,losses:0,...old,id:def.id,name:def.name,manager:def.manager,style:def.style,
    roster:[...(old?.roster||[]),...added].filter(id=>!owned.has(id))};
  });
  s.free=s.free.filter(w=>!contracted.has(w.id));
  if(!fresh){
   const available=new Set(s.free.map(w=>w.id));
   for(const w of D.TALENT)if(!originalFreeAgents.has(w.id)&&!owned.has(w.id)&&!contracted.has(w.id)&&!available.has(w.id))s.free.push({...w});
  }
  t.stablesReady=true;
 }
 if(!t.cards){
  t.cards=Object.fromEntries(D.PROMOS.map(p=>[p.id,Object.fromEntries(D.CARD_LINEUPS[p.id].map((id,i)=>[
   id,{score:56-i*3,matches:0,wins:0}
  ]))]));
  for(const h of [...s.history].reverse())record(t,h.pid,h.wid,h.rid,h.slot,h.outcome==='nc'?null:h.outcome==='double'||D.FINISHES[h.finish]?.win,h.stars);
 }
 if(!t.divisionsReady){seedDivisions(s,t);t.divisionsReady=true;}
 if(!t.titles){
  // Existing careers: each new belt goes to whoever currently tops that promotion's division.
  t.titles={};t.titleLog=[];
  for(const p of D.PROMOS)for(const div of D.DIVISION_ORDER)crown(s,t,p.id,div,'inaugural');
 }
 return t;
}
function ensure(){return G.S?prepare(G.S):null;}
// Who can be booked against the player's wrestlers: rival-stable and independent workers.
function contracted(s,id){
 if(s.worldV4?.version===4)return ['ai','independent'].includes(s.worldV4.contracts[id]?.owner);
 return !!(s.territory?.teams.some(team=>team.roster.includes(id))||D.FOES.some(f=>f.id===id));
}
// Each promotion needs enough workers in both divisions for a real ranking.
function seedDivisions(s,t){
 const owned=new Set(s.roster.map(w=>w.id));
 const pool=[...D.FOES,...D.TALENT,...(D.ALL||[])].filter((w,i,a)=>a.findIndex(x=>x.id===w.id)===i&&!owned.has(w.id)&&contracted(s,w.id));
 for(const p of D.PROMOS)for(const div of D.DIVISION_ORDER){
  const card=t.cards[p.id]??={};
  let count=Object.keys(card).filter(id=>D.divisionOf(id)===div).length;
  for(const w of pool){
   if(count>=4)break;
   if(D.divisionOf(w)!==div||card[w.id])continue;
   card[w.id]={score:30-count,matches:0,wins:0};count++;
  }
 }
}
function absWeek(s){return (s.season-1)*16+s.week;}
function holderValid(s,t,pid,div,id){
 if(!id||D.divisionOf(id)!==div||!t.cards[pid]?.[id])return false;
 return s.roster.some(w=>w.id===id)||contracted(s,id);
}
// Award a belt to the highest-ranked eligible worker in that division.
function crown(s,t,pid,div,how){
 const top=promotionRank(pid,div,t,s).find(w=>holderValid(s,t,pid,div,w.id));
 const titles=t.titles[pid]??={};
 titles[div]={holder:top?.id||null,since:absWeek(s),defences:0};
 if(top){t.titleLog.unshift({week:absWeek(s),pid,div,from:null,to:top.id,how});t.titleLog=t.titleLog.slice(0,40);}
 return top||null;
}
function title(pid,div){return ensure()?.titles?.[pid]?.[div]||null;}
// The belts a wrestler currently holds.
function titlesOf(id){
 const t=ensure();if(!t||!id)return [];
 return D.PROMOS.flatMap(p=>D.DIVISION_ORDER.filter(div=>t.titles[p.id]?.[div]?.holder===id).map(div=>D.belt(p.id,div)));
}
function changeTitle(t,pid,div,to,from,how){
 const s=G.S,b=t.titles[pid][div];
 if(b.holder===to){b.defences++;return false;}
 t.titles[pid][div]={holder:to,since:absWeek(s),defences:0};
 t.titleLog.unshift({week:absWeek(s),pid,div,from,to,how});t.titleLog=t.titleLog.slice(0,40);
 return true;
}
// Vacate any belt whose holder has left the division or the circuit, then fill it.
function checkTitles(s,t,reports){
 for(const p of D.PROMOS)for(const div of D.DIVISION_ORDER){
  const b=t.titles[p.id]?.[div];
  if(b?.holder&&holderValid(s,t,p.id,div,b.holder))continue;
  const top=crown(s,t,p.id,div,'vacant');
  if(top)reports.unshift(top.name+' was awarded the vacant '+D.belt(p.id,div).name+'.');
 }
}
function stableFor(id){return ensure()?.teams.find(team=>team.roster.includes(id));}
// `scale` lets the circuit, which now books more matches a week, move the rankings no faster than before.
function record(t,pid,a,b,slot,won,stars,scale=1){
 const card=t.cards[pid];if(!card||!a||!b||a===b)return;
 const weight=2+(D.SLOTS[slot]?.rank??0);
 for(const [id,win] of [[a,won],[b,won===null?null:!won]]){
  const row=card[id]??={score:23,matches:0,wins:0};
  row.matches++;
  if(win===null)continue;
  if(win)row.wins++;
  row.score=G.clamp(row.score+Math.round(((win?weight+2:-2)+Math.max(0,Math.floor((stars||0)-2)))*scale));
 }
}
// Slots scale with the size of the division: twelve workers gives 2 main, 3 feature, 4 mid, 3 openers.
function ladder(rows){const n=rows.length;return rows.map((w,i)=>({...w,slot:i*12<2*n?'main':i*12<5*n?'feature':i*12<9*n?'mid':'opener'}));}
// One division's ranking at a promotion. Without a division, both rankings one after the other.
function promotionRank(pid,div,t=ensure(),s=G.S){
 const card=t?.cards[pid];if(!card)return [];
 if(!div)return D.DIVISION_ORDER.flatMap(d=>promotionRank(pid,d,t,s));
 const holder=t.titles?.[pid]?.[div]?.holder;
 return ladder(Object.entries(card).flatMap(([id,line])=>{
  if(D.divisionOf(id)!==div)return [];
  const owned=s?.roster.find(x=>x.id===id),w=owned||G.F(id);if(!w)return [];
  const stable=t.teams.find(team=>team.roster.includes(id));
  return [{...w,...line,division:div,owned:!!owned,stable:stable?.name??null,champion:id===holder}];
 }).sort((a,b)=>b.score-a.score||b.wins-a.wins||a.name.localeCompare(b.name)));
}
function opponents(pid,slot,div){
 const s=G.S,liveV4=s?.worldV4?.version===4;
 const fits=w=>!div||D.divisionOf(w)===div;
 const pool=promotionRank(pid,div).filter(w=>!w.owned&&contracted(s,w.id));
 const exact=pool.filter(w=>w.slot===slot);
 if(exact.length)return exact;
 if(pool.length)return pool;
 const spare=(liveV4?D.ALL.filter(w=>contracted(s,w.id)):D.FOES).filter(fits);
 return spare.length?spare:D.FOES;
}
function rank(){const s=G.S,t=ensure();if(!s)return [];
 const rivals=D.TALENT.filter(w=>stableFor(w.id));
 const all=s.worldV4?.version===4
  ? D.ALL.filter(w=>s.worldV4.contracts[w.id]?.owner!=='market').map(w=>({...w,...(G.W(w.id)||{}),owned:s.worldV4.contracts[w.id]?.owner==='player'}))
  : [...[...D.FOES,...rivals].map(w=>({...w,owned:false})),...s.roster.map(w=>({...w,owned:true}))];
 return all.map(w=>{const recent=s.history.filter(h=>h.wid===w.id).slice(0,8);
 const form=recent.reduce((n,h)=>n+(h.outcome==='nc'?0:(h.finish||'').startsWith('win')?8:-5)+(h.stars>=3?Math.round(h.stars*2):0),0);
 return {...w,score:Math.round(w.heat*.7+w.ring*.16+(w.psych||50)*.08+(t.points[w.id]||0)+form)};}).sort((a,b)=>b.score-a.score);
}
// Returns true only when the wrestler really joined the team.
function signRival(team,w){
 const s=G.S,t=ensure();
 if(!team||G.W(w.id)||stableFor(w.id))return false;
 if(s.worldV4?.version===4)return root.OfficeWorldV4.hire(s,team.id,w.id);
 team.roster.push(w.id);s.free=s.free.filter(agent=>agent.id!==w.id);
 for(const p of D.PROMOS)if(D.STYLE_PLAN[w.style]===p.likes||p.id==='crown')t.cards[p.id][w.id]??={score:23,matches:0,wins:0};
 return true;
}
const poacher=()=>ensure()?.teams.find(t=>t.id==='northern');
// Can North Circuit actually take this wrestler off your hands (roster room and budget)?
function canPoach(w){const team=poacher(),s=G.S;if(!team)return false;
 return s.worldV4?.version===4?root.OfficeWorldV4.canAfford(s,team.id,w.id):true;}
// Sign a wrestler who has already left your stable. Returns the team name, or null if the signing failed.
function poach(w){const team=poacher();return signRival(team,w)?team.name:null;}
// The circuit's card for one week: who each promotion books in each division, exactly as evolve()
// books it. Pure: it reads the career and changes nothing, so the start screen can show a real bill.
// (Each pairing only depends on its own promotion and division's ranking, so booking them all first
// gives the same matches as booking and scoring them one at a time.)
function circuitBill(s,t,week,busy=new Set((s.card||[]).map(c=>c.rid))){
 // With the booking office installed, the bookers plan the card (v0.3.15).
 if(root.OfficeBooking)return root.OfficeBooking.decide(s,t,week,busy).bill;
 return rotationBill(s,t,week,busy);
}
// The original rotation: whoever is next on the list, with champions defending every third week.
function rotationBill(s,t,week,busy){
 busy=new Set(busy);const out=[];
 for(const [i,p] of D.PROMOS.entries())for(const [j,div] of D.DIVISION_ORDER.entries()){
  const entries=promotionRank(p.id,div,t,s).filter(w=>!busy.has(w.id)&&!w.owned&&contracted(s,w.id));
  const champ=entries.find(w=>w.id===t.titles?.[p.id]?.[div]?.holder);
  let a,b,onTheLine=false;
  // AI champions defend every third week against the best-placed challenger.
  if(champ&&(week+i+j)%3===0){
   b=entries.find(w=>w.id!==champ.id);
   if(b){a=champ;onTheLine=true;}
  }
  if(!onTheLine){
   const signed=entries.filter(w=>w.stable);if(!signed.length)continue;
   a=signed[(week+i*3+j*5)%signed.length];
   const rivals=entries.filter(w=>w.id!==a.id&&w.stable!==a.stable);
   if(!rivals.length)continue;
   b=rivals[(week*3+i+j*7)%rivals.length];
  }
  busy.add(a.id);busy.add(b.id);
  out.push({i,j,pid:p.id,div,a,b,title:onTheLine});
 }
 return out;
}
// The booking office books about 1.7 times as many circuit matches as the old rotation did.
const CIRCUIT_SCALE=.6;
function evolve(){const s=G.S,t=ensure();if(!s||!t)return;
 const week=(s.season-1)*16+s.week;if(t.week===week)return;t.week=week;
 const standings=rank();t.previous=Object.fromEntries(standings.map((w,i)=>[w.id,i]));
 const reports=[];
 checkTitles(s,t,reports);
 // This week's circuit results as data, for modules that need more than the report lines.
 t.lastResults={week,matches:[]};
 // The bookers' plan for the week (v0.3.15): commit their storylines and announce anything new.
 const plan=root.OfficeBooking?.decide(s,t,week)||null;
 if(plan){t.booking=plan.state;reports.push(...plan.notes);}
 for(const {i,j,div,a,b,title:onTheLine,winner:planned,stars:billed,line,story} of plan?plan.bill:circuitBill(s,t,week)){
  const p=D.PROMOS[i];
  const won=planned?planned===a.id:((week*13+a.ring+b.psych+p.reach+j*37)%100)<(onTheLine?58:52);
  const winner=won?a:b,loser=won?b:a,stars=billed??(onTheLine?3:2.5);
  t.lastResults.matches.push({pid:p.id,div,a:a.id,b:b.id,slotA:a.slot,slotB:b.slot,winner:winner.id,title:onTheLine,stars,story:story?.id||null});
  record(t,p.id,a.id,b.id,a.slot,won,stars,plan?CIRCUIT_SCALE:1);
  t.points[winner.id]=(t.points[winner.id]||0)+4;
  t.points[loser.id]=(t.points[loser.id]||0)-2;
  for(const [w,win] of [[winner,true],[loser,false]]){
   const team=stableFor(w.id);if(!team)continue;
   if(win)team.wins++;else team.losses++;
   team.rep=G.clamp(team.rep+(win?2:-1),10,95);
  }
  const name=D.belt(p.id,div).name;
  if(onTheLine&&changeTitle(t,p.id,div,winner.id,loser.id,'match'))reports.unshift(p.name+': '+winner.name+' defeated '+loser.name+' to win the '+name+'.');
  else if(onTheLine)reports.push(p.name+': '+winner.name+' retained the '+name+' against '+loser.name+'.');
  else reports.push(line||p.name+': '+winner.name+' defeated '+loser.name+'.');
 }
 if(s.worldV4?.version===4)root.OfficeWorldV4.evolve(s,t,week,reports);
 else if(week%5===0){
  const team=t.teams.filter(x=>x.roster.length<5).sort((a,b)=>a.roster.length-b.roster.length||b.rep-a.rep)[0];
  if(team){
   const pool=[...s.free,...D.FOES.filter(w=>!stableFor(w.id))];
   const recruit=pool.filter(w=>w.style===team.style).sort((a,b)=>b.pro-a.pro||b.heat-a.heat)[0];
   if(recruit){signRival(team,recruit);reports.unshift(team.manager+' signed '+recruit.name+' to '+team.name+'.');}
  }
 }
 t.reports.unshift({week,lines:reports});t.reports=t.reports.slice(0,12);G.save();
}
const originalEnd=G.endWeek,originalApply=G.applyResult;
G.endWeek=function(...args){const x=originalEnd(...args);evolve();return x};
G.applyResult=function(c,fin){
 const x=originalApply(c,fin),t=ensure();
 const won=fin.outcome==='nc'?null:fin.outcome==='double'||D.FINISHES[c.finish].win;
 record(t,c.pid,c.wid,c.rid,c.slot,won,fin.stars);
 if(won!==null)t.points[c.wid]=(t.points[c.wid]||0)+(won?5:-2)+Math.max(0,Math.floor((fin.stars||0)-2));
 if(c.title&&t.titles[c.title.pid]?.[c.title.div]){
  const {pid,div}=c.title,b=D.belt(pid,div),w=G.W(c.wid)||G.F(c.wid),f=G.F(c.rid),held=t.titles[pid][div];
  if(won===null){if(held.holder===c.wid||held.holder===c.rid)held.defences++;}
  else{
   const winner=won?c.wid:c.rid,loser=won?c.rid:c.wid;
   if(changeTitle(t,pid,div,winner,loser,'match'))G.msg?.({from:'The Office',subject:`New ${b.short} holder`,kind:'info',body:[`${(won?w:f).name} beat ${(won?f:w).name} for the ${b.name}.`,won?'The belt comes home with your wrestler. Expect promoters to want it defended.':'Your wrestler leaves without the belt.']});
  }
 }
 G.save();return x;
};
// The title match a promoter would offer the player for one belt, if any.
function titleMatch(pid,div){
 const s=G.S,t=ensure();if(!s||!t)return null;
 const belt=t.titles[pid]?.[div];if(!belt?.holder)return null;
 const ranked=promotionRank(pid,div);
 if(G.W(belt.holder)){
  const challenger=ranked.find(w=>!w.owned&&contracted(s,w.id));
  return challenger?{kind:'defence',wid:belt.holder,rid:challenger.id}:null;
 }
 if(!contracted(s,belt.holder))return null;
 const contender=ranked.find(w=>w.owned&&w.matches>0&&w.slot==='main');
 return contender?{kind:'shot',wid:contender.id,rid:belt.holder}:null;
}
// v0.3.13 THE START SCREEN'S BILL. Only real matches: a saved career's next booking (and its other
// bookings and next circuit show), or a match from the first circuit show a new career will book.
// The world a new career starts with, built the way G.fresh() builds it but without saving anything.
function newCareerWorld(){
 const s={v:22,season:1,week:1,roster:[],free:D.TALENT.map(t=>({...t})),promoters:D.PROMOS.map(p=>({...p,blacklist:0,matches:0,best:0})),
  offers:[],card:[],futureBookings:[],feuds:{},inbox:[],history:[]};
 prepare(s,true);root.OfficeWorldV4?.activate(s);
 return s;
}
function startBill(saved,rand=Math.random){
 const T=root.OfficeTerritory;
 const who=(s,id)=>D.findWrestler(id);
 const circuit=(s,week,busy)=>T.circuitBill(s,T.prepare(s),week,busy).map(m=>({pid:m.pid,div:m.div,a:D.findWrestler(m.a.id),b:D.findWrestler(m.b.id),title:m.title,week}))
  .filter(m=>m.a&&m.b).sort((x,y)=>Number(y.title)-Number(x.title));
 const pick=a=>a[Math.floor(rand()*a.length)];
 if(saved?.v&&Array.isArray(saved.roster)){
  const s=JSON.parse(JSON.stringify(saved)),now=T.absWeek(s);
  const rank=c=>D.SLOTS[c.slot]?.rank??0;
  const mine=[...(s.card||[]).map(c=>({...c,when:now})),...(s.futureBookings||[]).map(c=>({...c,when:c.eventAbs??now}))]
   .filter(c=>who(s,c.wid)&&D.findWrestler(c.rid)).sort((x,y)=>x.when-y.when||rank(y)-rank(x));
  const own=mine.map(c=>({pid:c.pid,div:D.divisionOf(c.rid),a:who(s,c.wid),b:D.findWrestler(c.rid),title:!!c.title,week:c.when,slot:c.slot,minutes:c.minutes,tag:c.tag||null,yours:true,tonight:c.when===now}));
  const next=circuit(s,now+1,new Set((s.futureBookings||[]).filter(c=>c.eventAbs===now+1).map(c=>c.rid)));
  const head=own[0]||pick(next.filter(m=>m.title).length?next.filter(m=>m.title):next);
  if(!head)return null;
  // The undercard is the same night: your other bookings if you are headlining, otherwise that show.
  return {head,under:own.length?own.slice(1,3):next.filter(m=>m!==head).slice(0,2),saved:true};
 }
 const s=newCareerWorld(),show=circuit(s,2,new Set());
 if(!show.length)return null;
 const head=pick(show.filter(m=>m.title).length?show.filter(m=>m.title):show);
 return {head,under:show.filter(m=>m!==head&&m.pid===head.pid).concat(show.filter(m=>m!==head&&m.pid!==head.pid)).slice(0,2),saved:false};
}
root.OfficeTerritory={prepare,ensure,rank,promotionRank,opponents,stableFor,canPoach,poach,evolve,title,titlesOf,titleMatch,contracted,circuitBill,absWeek,startBill,newCareerWorld};
})(typeof window!=='undefined'?window:globalThis);
