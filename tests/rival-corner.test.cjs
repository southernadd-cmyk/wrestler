'use strict';
// Rival corners: the other side's stable and manager at ringside. A plan from the booking and the
// stable, a telegraph before the bell, an interference during the match, and what it did afterwards.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeMatch:MX,OfficeRivalCorner:RC}=root;
assert.ok(RC&&RC.plan&&RC.attach&&RC.settle&&RC.telegraph,'rival corner is installed');
const clean=/undefined|NaN|\{\w+\}|\[object/;

G.fresh();
const s=G.S;s.cash=99999;s.rep=55;s.inbox=[];
for(const id of ['rex','lyra','brick'])G.sign(id);
// A stable with at least two members who are not yours.
const team=s.territory.teams.find(t=>t.roster.filter(id=>s.worldV4.contracts[id]?.owner==='ai'&&s.worldV4.contracts[id].agencyId===t.id).length>=2);
assert.ok(team,'the world has a stable with at least two wrestlers');
const rival=team.roster.filter(id=>s.worldV4.contracts[id]?.owner==='ai'&&s.worldV4.contracts[id].agencyId===team.id);
let n=0;
function contract(o={}){const c={id:'rc-'+(n++),pid:'dock',rid:rival[0],wid:'rex',slot:'mid',minutes:12,finish:'win_dirty',purse:200,feudHeat:30,eventAbs:G.abs(),...o};G.S.card.push(c);return c;}

// 1. A wrestler with no stable brings nobody and has no telegraph.
{
 G.S.card=[];
 const c=contract({rid:'lyra',wid:'rex'});
 if(!RC.team(c)){
  assert.equal(RC.plan(c),null,'no stable, no plan');
  assert.equal(RC.telegraph(c),null,'no stable, no telegraph');
 }
 console.log('PASS no stable, no corner');
}

// 2. The plan is deterministic and names the stable's manager; some cards bring trouble, some do not.
let found=null,quiet=null;
for(let i=0;i<80&&(!found||!quiet);i++){
 G.S.card=[];
 const c=contract({finish:i%2?'win_dirty':'lose_protected'});
 const p=RC.plan(c);
 assert.ok(p,'a rival stable gives a plan');
 assert.equal(p.manager,team.manager,'the stable manager is the one at ringside');
 assert.equal(JSON.stringify(RC.plan(c)),JSON.stringify(p),'the same card gives the same plan');
 if(p.job&&!found)found=c;
 if(!p.job&&!quiet)quiet=c;
}
assert.ok(found,'some cards bring interference');
assert.ok(quiet,'some cards are quiet');
{
 const p=RC.plan(found);
 assert.ok(RC.JOBS[p.job],'the job is one of the defined jobs');
 if(p.second)assert.ok(!RC.members(found).length||RC.members(found).some(x=>x.id===p.second.id),'the stablemate is one who could come out');
 const t=RC.telegraph(found);
 assert.ok(t&&t.warn,'a planned job is telegraphed as trouble');
 assert.ok(!clean.test(t.line),'telegraph text is clean');
 assert.ok(t.line.includes(team.manager),'telegraph names the manager');
 const q=RC.telegraph(quiet);
 assert.ok(q&&!q.warn,'a quiet card has a plain telegraph');
 console.log('PASS plan, telegraph and determinism');
}

// 3. In the match: the other corner is announced, its moment fires, and the text is clean.
{
 G.S.card=[];
 const c=found,w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
 const M=MX.create({w,f,p,slot:c.slot,minutes:c.minutes,finish:c.finish,feudHeat:c.feudHeat,plan:{game:'story',leash:'script',talk:'none'},seed:99});
 RC.attach(M,c);
 assert.ok(M.rivalCorner&&M.rivalCorner.job,'the match carries the plan');
 for(let i=0;i<12000&&!M.done;i++){if(M.decision&&!M.queue.length)MX.resolve(M,M.decision.options[0].id);MX.next(M);}
 assert.ok(M.done,'the match finishes');
 assert.ok(M.rivalCorner.announced,'their corner is announced');
 assert.ok(M.rivalCorner.fired,'their corner moment fires');
 assert.ok(M.log.some(l=>/manager|barrier|referee|stablemate|corner|apron|ring/i.test(l.text)),'the match log shows the other corner');
 for(const l of M.log)assert.ok(!clean.test(l.text),'no broken text in the match log: '+l.text);
 // 4. After the bell: the consequences are reported once.
 const out=RC.settle(c,M);
 assert.ok(Array.isArray(out)&&out.length>=1,'the interference has a consequence');
 for(const x of out)assert.ok(!clean.test(x.text),'no broken text in consequences: '+x.text);
 assert.equal(RC.settle(c,M).length,0,'consequences are reported once');
 console.log('PASS in-match interference and consequences: '+out.map(x=>x.text).join(' | '));
}
console.log('PASS rival corner suite');

// INT1: opponent condition is a career fact, not a temporary match object.
{
 G.fresh();const s=G.S;s.cash=99999;G.sign('rex');
 const rid=s.territory.teams.flatMap(t=>t.roster).find(id=>id!=='rex'&&D.divisionOf(id)===D.divisionOf('rex'));
 assert.ok(rid);
 const w=G.W('rex'),p=G.P('dock');
 G.updatePersonnel(s,rid,{fatigue:40,injury:0,morale:50});
 w.fatigue=40;
 const args={w,f:G.F(rid),p,slot:'mid',minutes:12,finish:'win_clean',feudHeat:0,plan:{game:'story',leash:'script',talk:'none'},seed:123};
 const M=MX.create(args);assert.equal(M.wSt,72);assert.equal(M.fSt,72);
 assert.equal(MX.create({...args,promo:{opponentHurt:10}}).fSt,62);
 const c={id:'int1-condition',pid:'dock',rid,wid:w.id,slot:'mid',minutes:12,finish:'win_clean',purse:200,eventAbs:G.abs()};s.card.push(c);
 const fin={stars:3,crowd:60,botches:0,script:.8,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:12,plan:'story',stamina:40,injury:0,outcome:'booked',foeHurt:true,foeInjuryPart:'shoulder',evidence:{stamina:{w:40,f:20},injured:{w:null,f:true},dirty:{w:false,f:false},counters:{w:0,f:0},late:{w:0,f:0},families:{w:[],f:[]},damage:{w:0,f:0}},log:[]};
 G.applyResult(c,fin);assert.equal(G.F(rid).fatigue,59);assert.equal(G.F(rid).injury,1);assert.equal(G.F(rid).wear.shoulder,1);assert.equal(G.opponentReady(s,rid),false);
 G.applyResult(c,fin);assert.equal(G.F(rid).fatigue,59);assert.equal(G.F(rid).wear.shoulder,1);
 G.S=JSON.parse(JSON.stringify(s));assert.equal(G.F(rid).injury,1);assert.equal(G.F(rid).fatigue,59);
 const world=root.OfficeWorldV4,loaded=G.S;
 world.recoverPersonnel(loaded,G.abs());assert.equal(G.F(rid).injury,1);
 world.recoverPersonnel(loaded,G.abs()+1);assert.equal(G.F(rid).injury,0);assert.equal(G.F(rid).fatigue,35);
 assert.ok(world.releaseAI(loaded,rid));assert.equal(G.F(rid).fatigue,35);
 G.updatePersonnel(loaded,rid,{morale:41});assert.equal(loaded.free.find(x=>x.id===rid).morale,41);
 assert.equal(G.sign(rid),null);assert.equal(G.W(rid).fatigue,35);assert.equal(G.W(rid).morale,41);
 console.log('PASS INT1 shared starting stamina, persistent opponent injury/fatigue, idempotent recovery and transfer');
}
{
 G.fresh();const s=G.S;s.cash=99999;G.sign('rex');
 const team=s.territory.teams.find(t=>t.roster.length>=2),[rid,second]=team.roster;
 G.updatePersonnel(s,second,{morale:50});
 const c={id:'int1-ejected',pid:'dock',wid:'rex',rid};
 const M={rivalCorner:{job:'runin',fired:true,ejected:true,second:{id:second,short:G.F(second).short}}};
 RC.settle(c,M);assert.equal(G.F(second).morale,47);RC.settle(c,M);assert.equal(G.F(second).morale,47);
 console.log('PASS INT1 ejected rival second morale persists once');
}
