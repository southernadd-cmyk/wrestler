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
 return t;
}
function ensure(){return G.S?prepare(G.S):null;}
function stableFor(id){return ensure()?.teams.find(team=>team.roster.includes(id));}
function record(t,pid,a,b,slot,won,stars){
 const card=t.cards[pid];if(!card||!a||!b||a===b)return;
 const weight=2+(D.SLOTS[slot]?.rank??0);
 for(const [id,win] of [[a,won],[b,won===null?null:!won]]){
  const row=card[id]??={score:23,matches:0,wins:0};
  row.matches++;
  if(win===null)continue;
  if(win)row.wins++;
  row.score=G.clamp(row.score+(win?weight+2:-2)+Math.max(0,Math.floor((stars||0)-2)));
 }
}
function promotionRank(pid){
 const card=ensure()?.cards[pid];if(!card)return [];
 return Object.entries(card).flatMap(([id,line])=>{
  const owned=G.W(id),w=owned||G.F(id);if(!w)return [];
  const stable=stableFor(id);
  return [{...w,...line,owned:!!owned,stable:stable?.name??null}];
 }).sort((a,b)=>b.score-a.score||b.wins-a.wins||a.name.localeCompare(b.name))
  .map((w,i)=>({...w,slot:i<2?'main':i<5?'feature':i<9?'mid':'opener'}));
}
function opponents(pid,slot){
 const pool=promotionRank(pid).filter(w=>!w.owned&&(w.stable||D.FOES.some(f=>f.id===w.id)));
 const exact=pool.filter(w=>w.slot===slot);
 if(exact.length)return exact;
 return pool.length?pool:D.FOES;
}
function rank(){const s=G.S,t=ensure();if(!s)return [];
 const rivals=D.TALENT.filter(w=>stableFor(w.id));
 const all=[...[...D.FOES,...rivals].map(w=>({...w,owned:false})),...s.roster.map(w=>({...w,owned:true}))];
 return all.map(w=>{const recent=s.history.filter(h=>h.wid===w.id).slice(0,8);
 const form=recent.reduce((n,h)=>n+(h.outcome==='nc'?0:(h.finish||'').startsWith('win')?8:-5)+(h.stars>=3?Math.round(h.stars*2):0),0);
 return {...w,score:Math.round(w.heat*.7+w.ring*.16+(w.psych||50)*.08+(t.points[w.id]||0)+form)};}).sort((a,b)=>b.score-a.score);
}
function signRival(team,w){
 const s=G.S,t=ensure();
 if(!team||G.W(w.id)||stableFor(w.id))return;
 team.roster.push(w.id);s.free=s.free.filter(agent=>agent.id!==w.id);
 for(const p of D.PROMOS)if(D.STYLE_PLAN[w.style]===p.likes||p.id==='crown')t.cards[p.id][w.id]??={score:23,matches:0,wins:0};
}
function poach(w){const team=ensure()?.teams.find(t=>t.id==='northern');signRival(team,w);return team?.name;}
function evolve(){const s=G.S,t=ensure();if(!s||!t)return;
 const week=(s.season-1)*16+s.week;if(t.week===week)return;t.week=week;
 const standings=rank();t.previous=Object.fromEntries(standings.map((w,i)=>[w.id,i]));
 const reports=[];
 const busy=new Set(s.card.map(c=>c.rid));
 for(const [i,p] of D.PROMOS.entries()){
  const entries=promotionRank(p.id).filter(w=>!busy.has(w.id)&&!w.owned&&(w.stable||D.FOES.some(f=>f.id===w.id)));
  const signed=entries.filter(w=>w.stable);if(!signed.length)continue;
  const a=signed[(week+i*3)%signed.length],rivals=entries.filter(w=>w.id!==a.id&&w.stable!==a.stable);
  if(!rivals.length)continue;
  const b=rivals[(week*3+i)%rivals.length];busy.add(a.id);busy.add(b.id);
  const won=((week*13+a.ring+b.psych+p.reach)%100)<52;
  const winner=won?a:b,loser=won?b:a;
  record(t,p.id,a.id,b.id,a.slot,won,2.5);
  t.points[winner.id]=(t.points[winner.id]||0)+4;
  t.points[loser.id]=(t.points[loser.id]||0)-2;
  for(const [w,win] of [[winner,true],[loser,false]]){
   const team=stableFor(w.id);if(!team)continue;
   if(win)team.wins++;else team.losses++;
   team.rep=G.clamp(team.rep+(win?2:-1),10,95);
  }
  reports.push(p.name+': '+winner.name+' defeated '+loser.name+'.');
 }
 // Champion remains a real territory title rather than a temporary sorting label.
 const leader=rank()[0];const champ=rank().find(w=>w.id===t.champion);
 if(leader&&champ&&leader.id!==champ.id&&leader.score>champ.score+12&&week%4===0){t.champion=leader.id;reports.unshift(leader.name+' won the territory championship.');}
 if(week%5===0){
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
 G.save();return x;
};
root.OfficeTerritory={prepare,ensure,rank,promotionRank,opponents,stableFor,poach,evolve};
})(typeof window!=='undefined'?window:globalThis);
