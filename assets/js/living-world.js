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
 // Older builds could leave an orphan player contract after retirement.
 for(const [id,c] of Object.entries(world.contracts))if(c.owner==='player'&&!player.has(id)){
  world.contracts[id]={...c,owner:'retired',agencyId:null,expiresWeek:null,retiredWeek:baseWeek(s)};
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
   .map(w=>{
    const saved=preserved.get(w.id);
    if(saved){saved.age??=world.personnel?.[w.id]?.age??w.age;return saved;}
    return {...basic(w),...G.personalRecord(world.personnel?.[w.id]||{})};
   });
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
 // The live player record is now authoritative; discard the inactive snapshot.
 if(w.personnel)delete w.personnel[id];
 reconcile(s);
}
function markMarket(s,id){
 const w=activeWorld(s);if(!w)return;
 if(!D.findWrestler(id))throw Error('Unknown wrestler '+id);
 w.contracts[id]=createContract('market',id,null,baseWeek(s));
 reconcile(s);
}
// Whether an agency has the room and the budget to take on this worker.
function canAfford(s,teamId,id){
 const w=activeWorld(s),worker=D.findWrestler(id),agency=w?.agencies[teamId];
 if(!agency||!worker||!club(s,teamId))return false;
 const count=Object.values(w.contracts).filter(c=>c.owner==='ai'&&c.agencyId===teamId).length;
 return count<agency.cap&&agency.cash>=(worker.fee||1000)+agency.weeklyPayroll*2;
}
function hire(s,teamId,id,week=baseWeek(s)){
 const w=activeWorld(s),team=club(s,teamId),worker=D.findWrestler(id);
 if(!w||!team||!worker||!w.agencies[teamId])return false;
 if(!['market','independent'].includes(w.contracts[id]?.owner))return false;
 const agency=w.agencies[teamId];
 if(!canAfford(s,teamId,id))return false;
 agency.cash-=worker.fee||1000;
 // Preserve any developed market record before reconcile removes it.
 const market=s.free.find(p=>p.id===id);
 if(market){w.personnel??={};w.personnel[id]=G.personalRecord(market);}
 w.contracts[id]=createContract('ai',id,teamId,week);
 agency.hires++;
 // A transfer must put the worker onto at least one promotion's actual card.
 const primary={Brawl:'dock',Spectacle:'pulse',Story:'crown',Technical:'union'}[worker.style];
 for(const p of D.PROMOS)if(p.id===primary||p.id==='crown'){
  s.territory.cards[p.id]??={};
  s.territory.cards[p.id][id]??={score:23,matches:0,wins:0};
 }
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
// Who an agency would sign from the market and the independents next, leaving out anyone in `taken`.
function marketTarget(s,team,taken=new Set()){
 const w=activeWorld(s);if(!w)return null;
 const offers=[...s.free,...all.filter(p=>w.contracts[p.id]?.owner==='independent')];
 return offers.filter(p=>!taken.has(p.id)&&['market','independent'].includes(w.contracts[p.id]?.owner))
  .map(p=>({p,fit:(p.style===team.style?30:0)+p.pro*.35+p.ring*.22-p.fee/180-(p.ego>85?5:0)}))
  .sort((a,b)=>b.fit-a.fit||a.p.id.localeCompare(b.p.id))[0]?.p||null;
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
  const taken=new Set();
  for(const team of t.teams){
   const agency=w.agencies[team.id];
   if(!agency||team.roster.length>=agency.cap)continue;
   const target=marketTarget(s,team,taken);
   if(target&&hire(s,team.id,target.id,week)){taken.add(target.id);reports.push(team.manager+' signed '+target.name+' to '+team.name+'.');}
  }
 }
 if(w.events.length>80)w.events.length=80;
}

 // Stable hashing, independent of the player's career RNG and iteration order.
function lifecycleRoll(s,id,season,purpose){
 let h=2166136261;
 for(const ch of String(s.careerSeed??s.seed??0)+':'+id+':'+season+':'+purpose){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
 return (h>>>0)/4294967296;
}
function putPersonnel(s,worker){
 const world=activeWorld(s);world.personnel??={};
 world.personnel[worker.id]=G.personalRecord(worker);
 const free=s.free.find(w=>w.id===worker.id);
 if(free)Object.assign(free,G.personalRecord(worker));
}
function markRetired(s,worker,week=baseWeek(s)){
 const world=activeWorld(s);if(!world)return;
 putPersonnel(s,worker);
 world.contracts[worker.id]={...createContract('retired',worker.id,null,week),retiredWeek:week};
 s.free=s.free.filter(w=>w.id!==worker.id);
 for(const team of s.territory.teams)team.roster=team.roster.filter(id=>id!==worker.id);
}
function recoverPersonnel(s,week){
 const world=activeWorld(s);if(!world||world.lastRecoveryWeek>=week)return;
 world.lastRecoveryWeek=week;
 for(const [id,c] of Object.entries(world.contracts)){
  if(!['market','ai','independent'].includes(c.owner))continue;
  const worker=G.personnel(s,id);if(!worker)continue;
  // Only off-roster injuries already present in the persistent record are settled.
  // AI match results currently do not simulate new physical injuries.
  if(!worker.injury&&!worker.niggle&&!worker.relapse&&!(worker.fatigue>0))continue;
  if(worker.injury&&(worker.injurySince??week-1)<week)worker.injury=Math.max(0,worker.injury-1);
  if(worker.niggle>0&&!--worker.niggle)worker.nigglePart=null;
  if(worker.relapse&&!worker.injury){
   const part=worker.relapse.part;worker.relapse=null;
   if(lifecycleRoll(s,id,week,'relapse')<.3){
    worker.injury=2;worker.injurySince=week;worker.wear={...(worker.wear||{}),[part]:(worker.wear?.[part]||0)+1};
   }
  }
  worker.fatigue=Math.max(0,(worker.fatigue||0)-12);
  putPersonnel(s,worker);
 }
}
function agePersonnel(s,season,{preview=false}={}){
 const world=activeWorld(s);if(!world||world.lastAgedSeason>=season)return [];
 world.lastAgedSeason=season;
 const retired=[],week=season*16+1;
 for(const [id,c] of Object.entries(world.contracts)){
  if(!['market','ai','independent'].includes(c.owner))continue;
  const worker=G.personnel(s,id);if(!worker)continue;
  if(worker.retireWarned){
   worker.retireWarned=false;
   if(lifecycleRoll(s,id,season,'retire')<.7){
    if(!preview)G.reconcileOwnership(id,{outgoing:true,reason:worker.name+' retired'});
    markRetired(s,worker,week);retired.push(id);
    if(!preview)event(world,week,worker.name+' has retired from wrestling.');
    continue;
   }
  }
  G.ageWorker(worker);
  if(lifecycleRoll(s,id,season,'warning')<G.retireChance(worker.age)){
   worker.retireWarned=true;
   if(!preview)event(world,week,'Retirement whispers: '+worker.name+' is considering hanging up the boots.');
  }
  putPersonnel(s,worker);
 }
 return retired;
}
// The start-screen prediction projects the same off-roster changes onto a copy.
// It cannot predict a player's random training injury or retirement decision.
function previewLifecycle(s,week){
 const current=baseWeek(s);
 if(!activeWorld(s)||week!==current+1)return s;
 const copy=JSON.parse(JSON.stringify(s));
 recoverPersonnel(copy,current);
 if(s.week===16)agePersonnel(copy,s.season,{preview:true});
 return copy;
}
function ownership(s,id){return activeWorld(s)?.contracts[id]||null}
root.OfficeWorldV4={activate,reconcile,markPlayer,markMarket,canAfford,hire,releaseAI,evolve,ownership,activeWorld,marketTarget,markRetired,recoverPersonnel,agePersonnel,previewLifecycle};
})(typeof window!=='undefined'?window:globalThis);
