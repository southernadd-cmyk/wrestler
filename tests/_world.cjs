'use strict';
// A whole career with every system switched on, played the way a player would, checked every week.
// Used by tests/world-soak.test.cjs (a few seeds, in CI) and tools/world-sweep.cjs (many seeds, by hand).
// Match nights are played as results, not full bouts: this is about how the systems around the
// matches interact. Seeded clock and Math.random, so a seed always plays the same career.
const vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');

function engine(seed){
 let r=seed>>>0||1;const random=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
 const math=Object.create(Math);math.random=random;
 const FixedDate=class extends Date{static now(){return 1700000000000+seed*977;}};
 const store=new Map(),root={addEventListener(){}};
 vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date:FixedDate,Math:math,JSON,console});
 return {root,random};
}

// Everything that must hold after every week. Returns a list of problems (empty when all is well).
function check(root,s,label){
 const {OfficeData:D,OfficeTerritory:T}=root,out=[],bad=m=>out.push(label+': '+m);
 const t=s.territory,w=s.worldV4,owned=new Set(s.roster.map(x=>x.id));
 // The circuit's matches this week.
 const res=t.lastResults?.matches||[],seen=new Set(),per={};
 for(const m of res){
  for(const id of [m.a,m.b]){if(seen.has(id))bad('works twice in one week: '+id);seen.add(id);if(owned.has(id))bad('your wrestler booked by the circuit: '+id);}
  if(D.divisionOf(m.a)!==D.divisionOf(m.b))bad('cross-division match '+m.a+' v '+m.b);
  if(![m.a,m.b].includes(m.winner))bad('winner not in the match');
  per[m.pid+m.div]=(per[m.pid+m.div]||0)+1;
 }
 for(const [k,n] of Object.entries(per))if(n>2)bad(n+' matches in '+k);
 // Contracts, rosters and the market agree.
 for(const x of s.roster)if(w.contracts[x.id]?.owner!=='player')bad('roster wrestler without a player contract: '+x.id);
 for(const [id,c] of Object.entries(w.contracts)){
  if(c.owner==='player'&&!owned.has(id))bad('player contract, not in the roster: '+id);
  if(c.owner==='ai'){const teams=t.teams.filter(x=>x.roster.includes(id));if(teams.length!==1||teams[0].id!==c.agencyId)bad('agency contract not on exactly its own roster: '+id);}
  if(c.owner==='market'&&!s.free.some(x=>x.id===id))bad('market contract missing from free agents: '+id);
 }
 for(const x of t.teams){if(x.roster.length>12)bad(x.name+' over its cap');for(const id of x.roster)if(w.contracts[id]?.owner!=='ai')bad('rostered without an agency contract: '+id);}
 if(s.roster.length>5)bad('more than five contracts');
 // Belts are held by somebody who can hold them.
 for(const p of D.PROMOS)for(const div of D.DIVISION_ORDER){
  const h=t.titles?.[p.id]?.[div]?.holder;if(!h)continue;
  if(D.divisionOf(h)!==div)bad('belt in the wrong division: '+p.id+div);
 }
 // Programmes: every unplayed date is still booked, or the programme has ended.
 for(const prog of t.programmes?.live||[]){
  if(!owned.has(prog.wid))bad('live programme for a wrestler you no longer have: '+prog.id);
  const booked=new Set([...s.card,...s.futureBookings].map(c=>c.id));
  for(const b of prog.beats)if(!b.done&&!b.missed&&b.at>=T.absWeek(s)&&!booked.has(b.cid))bad('programme date lost its booking: '+prog.id);
 }
 // Numbers stay in range.
 const range=(v,a,b,what)=>{if(!Number.isFinite(v)||v<a||v>b)bad(what+' out of range: '+v);};
 range(s.cash,-1e6,1e7,'cash');range(s.rep,0,100,'reputation');
 for(const p of s.promoters){range(p.trust,0,100,'trust '+p.id);const base=D.PROMOS.find(x=>x.id===p.id).reach;range(p.reach,base-12,base+12,'reach '+p.id);}
 for(const x of s.roster)for(const k of ['ring','mic','psych','safe','heat','morale','fatigue','loyal'])range(x[k],0,100,x.id+'.'+k);
 for(const [id,e] of Object.entries(s.ambitions?.w||{}))range(e.sat,0,100,'satisfaction '+id);
 for(const [pid,f] of Object.entries(t.business||{}))if(f&&typeof f==='object'&&'crowd' in f){range(f.crowd,5,100,'crowd '+pid);range(f.buzz,0,100,'buzz '+pid);if(!Number.isFinite(f.money))bad('money '+pid);}
 for(const a of Object.values(w.agencies))if(!Number.isFinite(a.cash))bad('agency cash');
 const raw=JSON.stringify(s);
 if(/\bNaN\b|"undefined"|\[object Object\]/.test(raw))bad('corrupted value in the save');
 return out;
}

// Play one career for `weeks` weeks. Returns {problems, stats}. `hook(root)` runs before the career
// starts, for diagnostics (tools can wrap engine functions).
function play(seed,weeks=48,hook=null){
 const {root,random}=engine(seed);
 if(hook)hook(root);
 const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeApproaches:X}=root;
 const pick=n=>Math.floor(random()*n);
 const problems=[],stats={weeks:0,matches:0,programmes:0,approaches:0,joined:0,bids:0,sold:0,released:0,predicted:0,skipped:0,decisions:0,titleChanges:0,raids:0,struggling:0};
 G.fresh();const s=G.S;s.cash+=6000;
 const fin=()=>{const roll=random();return {stars:Math.round((1.5+random()*3)*4)/4,crowd:45+pick(40),crowdPeak:60+pick(35),outcome:roll<.02?'double':roll<.05?'nc':'booked',botches:pick(3),script:.6+random()*.4,
  adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:8+pick(14),plan:['brawl','story','technical','spots','safe'][pick(5)],stamina:20+pick(60),injury:random()<.05?1+pick(3):0,injuryPart:'shoulder',ignored:0,callsUsed:[],log:[]};};
 for(let wk=0;wk<weeks&&!s.over;wk++){
  const label=`seed ${seed} week ${T.absWeek(s)}`;
  // Sign while there is room and money.
  for(const f of s.free.slice().sort((a,b)=>a.fee-b.fee)){if(s.roster.length>=4)break;if(s.cash-f.fee>=1500)G.sign(f.id);}
  // Now and then, approach a rival stable's wrestler who wants out.
  if(wk%4===2&&s.roster.length<5&&X){
   const target=X.stables().flatMap(x=>x.wrestlers).find(x=>x.mood==='Wants out'&&!x.cooldown&&s.cash-x.fee>=1000);
   if(target){const res=X.approach(target.id);if(!res.error){stats.approaches++;if(res.ok)stats.joined++;}}
  }
  // Now and then, let somebody go.
  if(wk%13===12&&s.roster.length>=3){const x=s.roster.slice().sort((a,b)=>a.heat-b.heat)[0];G.release(x.id);stats.released++;}
  // Answer every decision, with a different choice each time.
  for(let guard=0;guard<20;guard++){
   const m=G.pending()[0];if(!m)break;
   if(m.dtype==='agent_bid')stats.bids++;
   const order=m.options.slice().sort(()=>random()-.5);
   for(const o of order){G.answer(m.id,o.id);if(m.answer)break;}
   if(!m.answer){problems.push(label+': a decision could not be answered: '+m.dtype);break;}
   if(m.dtype==='agent_bid'&&(m.answer==='accept'||!G.W(m.args[0])))stats.sold++;
   stats.decisions++;
  }
  // Sign programmes; book this week's and next week's work.
  for(const o of s.offers.filter(x=>x.programme)){if(!G.book(o.id,o.wid))stats.programmes++;}
  for(const o of s.offers.slice()){
   if(o.programme||o.eventAbs>T.absWeek(s)+1)continue;
   const x=s.roster.find(w=>D.divisionOf(w)===D.divisionOf(o.rid)&&G.availableAt(w,o.eventAbs)&&(!o.wid||o.wid===w.id));
   if(x)G.book(o.id,x.id);
  }
  // Match night.
  for(const c of s.card.slice()){if(G.W(c.wid)){G.applyResult(c,fin());stats.matches++;}}
  s.card=s.card.filter(c=>G.W(c.wid));
  // Predict next week's circuit from a copy, as the start screen does; then play the week.
  const copy=JSON.parse(JSON.stringify(s)),next=T.absWeek(s)+1;
  const busy=new Set((copy.futureBookings||[]).filter(c=>c.eventAbs===next).map(c=>c.rid));
  let predicted=null;
  try{predicted=T.circuitBill(copy,T.prepare(copy),next,busy);}catch(e){problems.push(label+': prediction threw '+e.message);}
  try{G.endWeek();}catch(e){problems.push(label+': endWeek threw '+e.message);break;}
  stats.weeks++;
  // A booking the week dropped (an injury in training, say) can't be predicted; skip those weeks.
  const actualBusy=new Set(s.card.map(c=>c.rid));
  if(predicted&&[...busy].sort().join()===[...actualBusy].sort().join()){
   stats.predicted++;
   const played=s.territory.lastResults.matches.map(m=>m.a+'|'+m.b).sort().join();
   if(played!==predicted.map(m=>m.a.id+'|'+m.b.id).sort().join())problems.push(label+': the start screen predicted a different circuit card');
  }else stats.skipped++;
  problems.push(...check(root,s,`seed ${seed} week ${T.absWeek(s)}`));
  if(problems.length>20)break;
 }
 const lines=s.territory.reports.flatMap(r=>r.lines);
 stats.titleChanges=(s.territory.titleLog||[]).filter(l=>l.how==='match').length;
 stats.raids=lines.filter(l=>/exclusive deal/.test(l)).length;
 stats.struggling=lines.filter(l=>/is struggling/.test(l)).length;
 // The save survives a load and another week.
 try{
  const saved=JSON.parse(JSON.stringify(s));G.S=saved;
  if(!G.S||G.S.week!==saved.week)problems.push(`seed ${seed}: the save did not load`);
  else{G.S.card=[];G.endWeek();problems.push(...check(root,G.S,`seed ${seed} after reload`));}
 }catch(e){problems.push(`seed ${seed}: reload threw `+e.message);}
 return {problems,stats};
}
module.exports={play,check,engine};
