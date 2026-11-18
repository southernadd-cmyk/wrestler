/* THE OFFICE v0.3.17 — the business.
   The four promotions are now businesses competing for the same towns. Each week every one of them
   draws a crowd, makes or loses money and gains or loses buzz, from the shows it actually put on: the
   quality of the matches, the heat of its storylines, its champions, its payoffs and surprises. A hot
   promotion grows its reach (and pays better); a cold one shrinks, and a promotion in trouble books
   desperately. The rich raid their rivals for their best-known names, and big shows go head to head.
   Deterministic: nothing here draws a random number. */
(function installBusiness(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,T=root.OfficeTerritory,V4=root.OfficeWorldV4;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const r1=n=>Math.round(n*10)/10;
 const name=id=>D.findWrestler(id)?.name||id;
 const REACH_SWING=12,RAID_GAP=6,RAID_COST=1500,RAID_SHIELD=16,HISTORY=16;

 const base=p=>30+p.reach*.45;
 // A weekly promotion show has ticket receipts, broadcast/sponsor receipts, a real
 // production bill and wrestler costs. A cold crowd should hurt; low "buzz" alone
 // must not send a national TV promotion into an inevitable multi-season death spiral.
 function finance(p,f,matches=0,paid=0,changed=0){
  const perHead=12+p.reach*.72,gate=Math.round(f.crowd*perHead);
  const sponsors=Math.round(p.reach*(p.tv?17:6)+f.buzz*(p.tv?7:4));
  const production=Math.round(base(p)*perHead*.9+p.reach*(p.tv?12:5));
  const talent=Math.round(matches*(35+p.reach*1.25));
  const marquee=Math.round((paid+changed)*p.reach*1.5);
  const savings=f.desperate?Math.round(production*.16):0;
  const costs=production+talent+marquee-savings;
  return {gate,sponsors,production,talent,marquee,savings,net:gate+sponsors-costs};
 }
 function blank(p){return {crowd:Math.round(base(p)),buzz:30,money:Math.round(5000+p.reach*60),momentum:0,desperate:false,weeks:0,best:Math.round(base(p)),history:[],lastRaid:-99};}
 function state(t=G.S?.territory){
  if(!t)return null;
  const b=t.business&&typeof t.business==='object'?t.business:(t.business={});
  for(const p of D.PROMOS)b[p.id]??=blank(p);
  b.lastRaid??=-99;b.raided??={};
  return b;
 }

 // ---------------------------------------------------------------------------------------------
 // The week's figures for every promotion, from what it actually put on.
 function week(s,t,wk,reports){
  const b=state(t);if(!b||b.lastWeek===wk)return;
  b.lastWeek=wk;
  const res=t.lastResults?.week===wk?t.lastResults.matches:[];
  const live=t.booking?.promos||{};
  // Big nights this week: a storyline's last match.
  const payoffs=Object.fromEntries(D.PROMOS.map(p=>[p.id,(live[p.id]?.done||[]).filter(x=>x.ended===wk&&x.status!=='dropped')]));
  // Head to head means two title nights in the same week: the shows people actually choose between.
  const headToHead=D.PROMOS.filter(p=>payoffs[p.id].some(x=>x.type==='title')).map(p=>p.id);
  const changes=(t.titleLog||[]).filter(l=>l.week===wk&&l.how==='match');
  const targets={};
  for(const p of D.PROMOS){
   const f=b[p.id];
   // Your matches at this promotion count too: they were on the same show.
   const mine=(s.history||[]).filter(h=>h.pid===p.id&&(h.season-1)*16+h.week===wk-1).map(h=>h.stars||0);
   const stars=[...res.filter(m=>m.pid===p.id).map(m=>m.stars||2.5),...mine];
   const quality=stars.length?stars.reduce((x,y)=>x+y,0)/stars.length:2.25;
   const heat=(live[p.id]?.live||[]).reduce((x,y)=>Math.max(x,y.heat||0),0);
   const champs=D.DIVISION_ORDER.map(d=>t.titles?.[p.id]?.[d]?.holder).filter(Boolean).map(id=>(G.W?.(id)||D.findWrestler(id))?.heat||50);
   const champHeat=champs.length?champs.reduce((x,y)=>x+y,0)/champs.length:50;
   const paid=payoffs[p.id].length,changed=changes.filter(l=>l.pid===p.id).length;
   // Two big nights the same week split the towns; the one with more buzz keeps more of its crowd.
   const clash=headToHead.includes(p.id)&&headToHead.length>1;
   const won=clash&&headToHead.every(id=>id===p.id||b[id].buzz<=f.buzz);
   targets[p.id]={raw:base(p)+(quality-2.75)*12+(heat-50)*.1+(champHeat-55)*.1+paid*6+changed*4-(clash?(won?1:6):0)-(f.desperate?3:0),paid,changed,clash,won,quality};
  }
  // The towns are shared: when the circuit as a whole is hot, each promotion's share of it shrinks.
  const excess=D.PROMOS.reduce((n,p)=>n+targets[p.id].raw-base(p),0)/D.PROMOS.length;
  for(const p of D.PROMOS){
   const f=b[p.id],before=f.crowd,{raw,paid,changed,clash,won,quality}=targets[p.id];
   // Each promotion has its own level; a booking style is not a reason to sink for ever.
   const target=base(p)+(raw-excess*.7-base(p))*.6;
   f.crowd=Math.round(clamp(f.crowd+(target-f.crowd)*.3,5,100));
   // Buzz returns towards a neutral audience rather than decaying to zero when no
   // title changes hands. Show quality and payoff nights still move the needle.
   const news=34+(quality-2.75)*7+paid*7+changed*4+(clash?(won?4:-3):0);
   f.buzz=r1(clamp(f.buzz*.7+news*.3));
   // Results this week pay the show bill once. Keep the breakdown with the result,
   // not as an invented generic adjustment to an arbitrary cash baseline.
   const matches=stars.length;
   const statement=finance(p,f,matches,paid,changed);
   f.lastFinance={week:wk,...statement};
   f.money=Math.round(f.money+statement.net);
   f.momentum=r1(f.momentum*.7+(f.crowd-before)*.3*3);
   f.weeks++;
   // Only a clear new high is news.
   const record=f.crowd>=f.best+3;if(f.crowd>f.best)f.best=f.crowd;
   f.history.push({w:wk,c:f.crowd,b:Math.round(f.buzz),m:f.money});f.history=f.history.slice(-HISTORY);
   // A promotion that is losing money or bleeding crowd books like it.
   const struggling=f.money<2000||(f.momentum<=-3&&f.crowd<base(p)-4);
   if(struggling&&!f.desperate){f.desperate=true;reports.unshift(`${p.name} is struggling: ${p.voice} is under pressure to turn things round, and it will show on the cards.`);}
   else if(f.desperate&&(f.money>=3500||f.crowd>=base(p))&&f.momentum>0){f.desperate=false;reports.unshift(`${p.name} has steadied: ${p.voice} can plan properly again.`);}
   if(record&&f.weeks>4)reports.push(`${p.name} drew its best crowd yet.`);
   if(clash&&won)reports.push(`${p.name} won the head-to-head night: more people chose its show.`);
   // Your reach with them moves with the business: a hot promotion pays more, a cold one less.
   const mineP=s.promoters?.find(x=>x.id===p.id);
   if(mineP)mineP.reach=Math.round(clamp(p.reach+(f.crowd-base(p))*.5,p.reach-REACH_SWING,p.reach+REACH_SWING));
  }
  raid(s,t,b,wk,reports);
 }

 // A promotion with money and momentum signs a rival's best-known name to an exclusive deal.
 function raid(s,t,b,wk,reports){
  if(wk-b.lastRaid<RAID_GAP)return;
  const raider=D.PROMOS.filter(p=>!b[p.id].desperate&&b[p.id].money>=6000&&b[p.id].momentum>=0)
   .sort((x,y)=>b[y.id].money+b[y.id].buzz*50-b[x.id].money-b[x.id].buzz*50||x.id.localeCompare(y.id))[0];
  if(!raider)return;
  const titled=new Set(D.PROMOS.flatMap(p=>D.DIVISION_ORDER.map(d=>t.titles?.[p.id]?.[d]?.holder)).filter(Boolean));
  const cast=new Set([...Object.values(t.booking?.promos||{}).flatMap(x=>x.live.flatMap(y=>[y.a,y.b])),...(root.OfficeProgrammes?.claims(s,t).cast||[])]);
  const owned=new Set(s.roster.map(w=>w.id));
  const target=D.PROMOS.filter(p=>p!==raider).flatMap(p=>Object.entries(t.cards[p.id]||{}).map(([id,row])=>({id,row,from:p})))
   .filter(x=>!owned.has(x.id)&&!titled.has(x.id)&&!cast.has(x.id)&&T.contracted(s,x.id)&&raider.reach>=x.from.reach&&
    ![...(s.card||[]),...(s.futureBookings||[])].some(c=>c.rid===x.id||c.wid===x.id)&&
    !t.cards[raider.id]?.[x.id]&&!(wk-(b.raided[x.id]??-99)<RAID_SHIELD)&&wk-(b[x.from.id].lastRaided??-99)>=12)
   .filter(x=>Object.keys(t.cards[x.from.id]).filter(id=>D.divisionOf(id)===D.divisionOf(x.id)).length>6)
   .map(x=>({...x,v:(D.findWrestler(x.id)?.heat||50)+x.row.score*.5}))
   .filter(x=>x.v>=80)
   .sort((x,y)=>y.v-x.v||x.id.localeCompare(y.id))[0];
  if(!target)return;
  // Raids are not every chance that comes along: a hot booker takes more of them.
  if(hash(raider.id+target.id+wk)>.5+b[raider.id].buzz/200)return;
  // "Exclusive" means the wrestler appears on ONE promotion ledger, not merely
  // one fewer. Reject signed contracts above; withdraw any still-open offers.
  G.reconcileOwnership?.(target.id,{reason:'The opponent joined another promotion'});
  for(const promotion of D.PROMOS)if(promotion.id!==raider.id)delete t.cards[promotion.id]?.[target.id];
  (t.cards[raider.id]??={})[target.id]={score:target.row.score,matches:0,wins:0};
  b[raider.id].money-=RAID_COST;b[raider.id].buzz=r1(clamp(b[raider.id].buzz+8));
  b[target.from.id].buzz=r1(clamp(b[target.from.id].buzz-6));
  b.lastRaid=wk;b[raider.id].lastRaid=wk;b[target.from.id].lastRaided=wk;b.raided[target.id]=wk;
  reports.unshift(`${raider.name} has signed ${name(target.id)} to an exclusive deal. ${target.from.name} loses one of its best-known names.`);
 }

 if(V4){
  const originalEvolve=V4.evolve;
  V4.evolve=function(s,t,wk,reports){
   const out=originalEvolve.call(this,s,t,wk,reports);
   try{week(s,t,wk,reports);}catch(e){}
   return out;
  };
 }

 // ---------------------------------------------------------------------------------------------
 // For the screens.
 function view(pid,s=G.S){
  const p=D.PROMOS.find(x=>x.id===pid),f=s?.territory?state(s.territory)[pid]:null;if(!p||!f)return null;
  const trend=f.momentum>=1.5?'up':f.momentum<=-1.5?'down':'flat';
  const tone=f.desperate?'Struggling':f.crowd>=base(p)+5?'Hot':f.crowd<=base(p)-4?'Cooling':'Steady';
  return {pid,crowd:f.crowd,base:Math.round(base(p)),buzz:Math.round(f.buzz),money:f.money,momentum:f.momentum,trend,tone,desperate:f.desperate,best:f.best,finance:f.lastFinance||null,history:f.history.slice()};
 }
 root.OfficeBusiness={state,week,view,raid,base,finance};
})(typeof window!=='undefined'?window:globalThis);
