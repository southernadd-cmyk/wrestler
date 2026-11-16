/* THE OFFICE v4 — living roster: automatic migration on new career and on load.
   One wrestler ID => one contract state. All saves stay on the v22 storage key.
   Legacy save migration is idempotent and preserves prior in-game results. */
(function(root){'use strict';
const D=root.OfficeData,G=root.OfficeGame;
const baseWeek=s=>(s.season-1)*16+s.week;
const basic=w=>({...w});
const cast=D.V4.newCast,agencyDefs=D.V4.agencyDefinitions;
const all=D.ALL;
function club(s,id){return s.territory.teams.find(t=>t.id===id)}
function event(w,week,text){w.events.unshift({week,text});w.events.length=Math.min(w.events.length,80)}
function createContract(owner,id,teamId=null,week=1){
 const worker=D.findWrestler(id);
 return {owner,agencyId:owner==='ai'?teamId:null,signedWeek:week,
  expiresWeek:owner==='ai'?week+16+(worker?.loyal||50)%9:null,
  wage:worker?.wage||Math.max(110,Math.round((worker?.ring||60)*2.5))};
}
function agencyBalance(team){return 6500+team.rep*70}
function activeWorld(s){return s?.worldV4?.version===4?s.worldV4:null}
function reconcile(s){
 const world=activeWorld(s);if(!world)return null;
 root.OfficeRosterV4.enableProfiles();
 const t=s.territory;
 if(!t||!Array.isArray(t.teams))throw Error('No circuit when migrating roster');
 const teamSet=new Map(t.teams.map(team=>[team.id,team]));
 const player=new Set(s.roster.map(w=>w.id));
 for(const id of player){
  if(!D.findWrestler(id))continue;
  world.contracts[id]={...world.contracts[id],...createContract('player',id,null,world.contracts[id]?.signedWeek||baseWeek(s))};
 }
 const stableIds=new Map();
 for(const [id,c] of Object.entries(world.contracts)){
  if(c.owner==='ai'){
   if(!teamSet.has(c.agencyId))throw Error('Missing agency '+c.agencyId);
   stableIds.set(id,c.agencyId);
  }
 }
 for(const team of t.teams){
  team.roster=[...stableIds].filter(([,owner])=>owner===team.id).map(([id])=>id);
 }
 const preserved=new Map(s.free.map(w=>[w.id,w]));
 s.free=all.filter(w=>world.contracts[w.id]?.owner==='market')
   .map(w=>preserved.get(w.id)||basic(w));
 // Do not reset individual talent progression on load; contracts only hold ownership.
 world.migratedIds=all.length;
 return world;
}
function activate(s){
 if(!s||!Array.isArray(s.roster)||!Array.isArray(s.free))throw Error('Not a valid career');
 if(activeWorld(s))return reconcile(s);
 const t=root.OfficeTerritory.prepare(s);
 const week=baseWeek(s);
 const legacyClub=new Map(t.teams.flatMap(team=>team.roster.map(id=>[id,team.id])));
 const player=new Set(s.roster.map(w=>w.id));
 const market=new Set(s.free.map(w=>w.id));
 const contracts={};
 // Existing ownership is authoritative. Never overwrite played careers.
 for(const p of [...D.TALENT,...D.FOES]){
  const owner=player.has(p.id)?'player':legacyClub.has(p.id)?'ai':market.has(p.id)?'market':'independent';
  contracts[p.id]=createContract(owner,p.id,legacyClub.get(p.id)||null,week);
 }
 for(const def of agencyDefs){
  if(!club(s,def.id))t.teams.push({id:def.id,name:def.name,manager:def.manager,style:def.id==='eastbank'?'Technical':def.id==='meridian'?'Spectacle':'Story',rep:52,wins:0,losses:0,roster:[]});
 }
 for(const p of cast){
  const allocation=p.initial_allocation;
  const owner=allocation==='free'?'market':allocation==='independent'?'independent':'ai';
  contracts[p.id]=createContract(owner,p.id,owner==='ai'?allocation:null,week);
  // Existing card ladders stay unchanged; new entrants are seeded on two venues.
  const primary={Brawl:'dock',Spectacle:'pulse',Story:'crown',Technical:'union'}[p.style];
  for(const pid of new Set([primary,primary==='crown'?'dock':'crown'])){
   t.cards[pid]??={};
   t.cards[pid][p.id]??={score:Math.round(18+p.ring*.24+p.psych*.12),matches:0,wins:0};
  }
 }
 const agencies={};
 for(const team of t.teams)agencies[team.id]={cash:agencyBalance(team),weeklyIncome:0,weeklyPayroll:0,hires:0,releases:0,cap:12,policy:team.style};
 s.worldV4={version:4,contracts,agencies,events:[],lastEvolvedWeek:week-1,migratedIds:80};
 t.stablesReady=true;
 reconcile(s);
 return s.worldV4;
}
function markPlayer(s,id){
 const w=activeWorld(s);if(!w)return;
 if(!D.findWrestler(id))throw Error('Unknown wrestler '+id);
 w.contracts[id]=createContract('player',id,null,baseWeek(s));
 reconcile(s);
}
function markMarket(s,id){
 const w=activeWorld(s);if(!w)return;
 if(!D.findWrestler(id))throw Error('Unknown wrestler '+id);
 w.contracts[id]=createContract('market',id,null,baseWeek(s));
 reconcile(s);
}
function hire(s,teamId,id,week=baseWeek(s)){
 const w=activeWorld(s),team=club(s,teamId),worker=D.findWrestler(id);
 if(!w||!team||!worker||!w.agencies[teamId])return false;
 if(!['market','independent'].includes(w.contracts[id]?.owner))return false;
 const agency=w.agencies[teamId],count=Object.values(w.contracts).filter(c=>c.owner==='ai'&&c.agencyId===teamId).length;
 if(count>=agency.cap||agency.cash<(worker.fee||1000)+agency.weeklyPayroll*2)return false;
 agency.cash-=worker.fee||1000;
 w.contracts[id]=createContract('ai',id,teamId,week);
 agency.hires++;
 reconcile(s);
 event(w,week,team.manager+' signed '+worker.name+' to '+team.name+'.');
 return true;
}
function releaseAI(s,id,week=baseWeek(s)){
 const w=activeWorld(s),contract=w?.contracts[id];if(!contract||contract.owner!=='ai')return false;
 const agency=w.agencies[contract.agencyId];
 agency.releases++;
 w.contracts[id]=createContract('market',id,null,week);
 reconcile(s);
 event(w,week,D.findWrestler(id).name+' left '+club(s,contract.agencyId).name+' and entered the free-agent market.');
 return true;
}
function evolve(s,t,week,reports){
 const w=activeWorld(s);if(!w||w.lastEvolvedWeek===week)return;
 w.lastEvolvedWeek=week;
 for(const team of t.teams){
  const agency=w.agencies[team.id];if(!agency)continue;
  const active=team.roster.map(id=>w.contracts[id]).filter(Boolean);
  const payroll=active.reduce((sum,c)=>sum+c.wage,0);
  agency.weeklyPayroll=payroll;
  agency.weeklyIncome=780+Math.round(team.rep*18)+Math.min(team.wins*8,420);
  agency.cash+=agency.weeklyIncome-payroll;
  for(const id of [...team.roster]){
   const c=w.contracts[id],worker=D.findWrestler(id);
   if(c.owner!=='ai'||c.expiresWeek===null||week<c.expiresWeek)continue;
   const keep=agency.cash>payroll*2 && worker.pro>=65 && worker.loyal>=45;
   if(keep){c.signedWeek=week;c.expiresWeek=week+16;event(w,week,worker.name+' renewed with '+team.name+'.');}
   else {releaseAI(s,id,week);reports.push(worker.name+' is now a free agent after leaving '+team.name+'.');}
  }
  if(agency.cash<0&&team.roster.length>3){
   const expendable=team.roster.map(id=>D.findWrestler(id)).sort((a,b)=>b.wage-a.wage||a.id.localeCompare(b.id))[0];
   if(expendable&&releaseAI(s,expendable.id,week))reports.push(team.name+' released '+expendable.name+' to reduce the wage bill.');
  }
 }
 // Every five weeks each agency evaluates the market under its own budget.
 if(week%5===0){
  const offers=[...s.free,...all.filter(p=>w.contracts[p.id]?.owner==='independent')];
  const taken=new Set();
  for(const team of t.teams){
   const agency=w.agencies[team.id];
   if(!agency||team.roster.length>=agency.cap)continue;
   const target=offers.filter(p=>!taken.has(p.id)&&['market','independent'].includes(w.contracts[p.id]?.owner))
    .map(p=>({p,fit:(p.style===team.style?30:0)+p.pro*.35+p.ring*.22-p.fee/180-(p.ego>85?5:0)}))
    .sort((a,b)=>b.fit-a.fit||a.p.id.localeCompare(b.p.id))[0]?.p;
   if(target&&hire(s,team.id,target.id,week)){taken.add(target.id);reports.push(team.manager+' signed '+target.name+' to '+team.name+'.');}
  }
 }
 if(w.events.length>80)w.events.length=80;
}
function ownership(s,id){return activeWorld(s)?.contracts[id]||null}
root.OfficeWorldV4={activate,reconcile,markPlayer,markMarket,hire,releaseAI,evolve,ownership,activeWorld};
})(typeof window!=='undefined'?window:globalThis);
