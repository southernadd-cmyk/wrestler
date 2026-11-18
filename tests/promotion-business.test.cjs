'use strict';
// v0.3.17 the business: crowds, buzz, money and momentum; desperate booking, head-to-head nights and raids.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
let seed=5;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const math=Object.create(Math);math.random=random;
const FixedDate=class extends Date{static now(){return 1700000000000;}};
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date:FixedDate,Math:math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeBooking:B,OfficeBusiness:Biz}=root;
assert.ok(Biz&&Biz.view&&Biz.week,'the business is installed');
const fresh=(ids=[])=>{G.fresh();G.S.cash=99999;for(const id of ids)G.sign(id);G.S.inbox=[];return G.S;};
const play=(s,n)=>{for(let i=0;i<n;i++){for(const m of G.pending())G.answer(m.id,m.dtype==='agent_bid'?'refuse':m.options[0].id);s.card=[];G.endWeek();}};

// 1. Every promotion starts with its own figures, and they move with the shows it puts on.
{
 const s=fresh(['rex']);
 const b=Biz.state(s.territory);
 for(const p of D.PROMOS){const v=Biz.view(p.id);assert.ok(v.crowd>0&&v.money>0&&v.tone==='Steady','starting figures for '+p.id);}
 play(s,48);
 const lines=s.territory.reports.flatMap(r=>r.lines);
 for(const p of D.PROMOS){
  const f=b[p.id],mine=s.promoters.find(x=>x.id===p.id);
  assert.ok(f.crowd>=5&&f.crowd<=100&&f.buzz>=0&&f.buzz<=100&&Number.isFinite(f.money),'in range: '+p.id);
  assert.ok(new Set(f.history.map(h=>h.c)).size>1,'crowds move week to week at '+p.id);
  assert.ok(f.history.length<=16,'history stays short');
  assert.ok(Math.abs(mine.reach-p.reach)<=12,'your reach with them moves, within limits');
 }
 assert.ok(D.PROMOS.some(p=>s.promoters.find(x=>x.id===p.id).reach!==p.reach),'reach follows the business');
 assert.doesNotMatch(JSON.stringify(b),/NaN|undefined/);
 assert.ok(JSON.stringify(b).length<6000,'small in the save');
 console.log('PASS three seasons of business: crowds, buzz, money and reach move and stay in range');
}

// 2. A promotion in trouble books desperately: shorter title chases.
{
 const s=fresh(),wk=T.absWeek(s)+1;
 const ready=()=>{s.territory.booking=B.blank(wk);for(const p of Object.values(s.territory.booking.promos))for(const d in p.next)p.next[d]=wk;};
 ready();const calm=B.decide(s,s.territory,wk).state.promos.crown.live.find(x=>x.type==='title');
 Biz.state(s.territory).crown.desperate=true;
 ready();const hot=B.decide(s,s.territory,wk).state.promos.crown.live.find(x=>x.type==='title');
 assert.ok(calm&&hot,'North Crown starts a title chase either way');
 assert.equal(calm.beats.length,B.STYLE.traditional.titleLen,'a long chase normally');
 assert.ok(hot.beats.length<=B.STYLE.traditional.titleLen-1,'a shorter one when the business is in trouble (it may also go head to head)');
 console.log('PASS a struggling promotion hurries its title chases');
}

// 3. Big nights: Dockside goes head to head with a rival's title match; North Crown moves out of the way.
{
 const s=fresh(),wk=T.absWeek(s)+1,t=s.territory;
 const keep=B.STYLE.aggressive.prefer;B.STYLE.aggressive.prefer=['title','grudge','rise'];
 const setup=(pid,at)=>{
  t.booking=B.blank(wk);for(const p of Object.values(t.booking.promos))for(const d in p.next)p.next[d]=wk;
  const pool=T.promotionRank(pid,'men',t,s).filter(w=>!w.owned&&T.contracted(s,w.id)),holder=t.titles[pid].men.holder;
  const a=pool.find(w=>w.id!==holder);
  t.booking.promos[pid].live.push({id:'rival-night',pid,div:'men',type:'title',a:a.id,b:holder,start:wk-1,delays:0,heat:50,beats:[{at:wk-1,kind:'build',done:true,winner:a.id},{at,kind:'payoff'}]});
  t.booking.promos[pid].next.men=wk+20;
 };
 setup('union',wk+2);
 const plan=B.decide(s,t,wk),dock=plan.state.promos.dock.live.find(x=>x.type==='title');
 assert.ok(dock,'Dockside starts a title chase');
 assert.equal(dock.beats.at(-1).at,wk+2,'on the same night as Grand Union’s');
 assert.equal(dock.counter,'union');
 assert.ok(plan.notes.some(n=>/head to head/.test(n)),'and says so');
 B.STYLE.aggressive.prefer=keep;
 setup('union',wk+B.STYLE.traditional.titleLen-1);
 const crown=B.decide(s,t,wk).state.promos.crown.live.find(x=>x.type==='title');
 assert.ok(crown&&crown.beats.at(-1).at!==wk+B.STYLE.traditional.titleLen-1,'North Crown keeps its title match off Grand Union’s night');
 console.log('PASS bookers schedule their big nights against, or away from, their rivals');
}

// 4. The rich raid a rival's best-known name; champions are safe; not again straight away.
{
 const s=fresh(),t=s.territory,b=Biz.state(t),wk=T.absWeek(s);
 for(const p of D.PROMOS)Object.assign(b[p.id],{money:3000,buzz:20,momentum:0});
 Object.assign(b.union,{money:40000,buzz:100,momentum:2});
 const reports=[];Biz.raid(s,t,b,wk,reports);
 const line=reports.find(l=>/exclusive deal/.test(l));
 assert.ok(line&&line.startsWith('Grand Union'),'Grand Union raids: '+reports.join(' / '));
 const who=D.ALL.find(w=>line.includes(w.name)),from=D.PROMOS.find(p=>p.id!=='union'&&line.includes(p.name+' loses'));
 assert.ok(t.cards.union[who.id]&&!t.cards[from.id][who.id],'the wrestler moves from one card to the other');
 assert.equal(D.PROMOS.filter(p=>t.cards[p.id]?.[who.id]).length,1,'an exclusive promotion signing cannot keep appearances on other cards');
 assert.ok(!D.PROMOS.some(p=>D.DIVISION_ORDER.some(d=>t.titles[p.id][d].holder===who.id)),'never a champion');
 assert.equal(b.union.money,40000-1500,'it costs the raider');
 const again=[];Biz.raid(s,t,b,wk+1,again);assert.equal(again.length,0,'not again straight away');
 console.log('PASS rich promotions raid their rivals for a star');
}

// 4b. Even a very rich club cannot raid wrestlers from national television promotions.
{
 const s=fresh(),t=s.territory,b=Biz.state(t),wk=T.absWeek(s),reports=[];
 for(const p of D.PROMOS)Object.assign(b[p.id],{money:1500,buzz:20,momentum:-1});
 Object.assign(b.dock,{money:90000,buzz:100,momentum:4});
 Biz.raid(s,t,b,wk,reports);
 assert.equal(reports.filter(x=>/exclusive deal/.test(x)).length,0,
  'Dockside must not buy national-TV talent merely because its finances are better');
 console.log('PASS transfers respect promotion prestige and national reach');
}

// 5. A hot promotion pays you better.
{
 const s=fresh(['rex']),t=s.territory,b=Biz.state(t);
 const o={id:'pay',pid:'dock',rid:'malik',slot:'main',finish:'win_clean',boost:1,eventAbs:T.absWeek(s),expiresAbs:T.absWeek(s)};
 const before=G.purse(o,G.W('rex'));
 b.dock.crowd=90;b.dock.lastWeek=-1;t.lastResults={week:-5,matches:[]};
 Biz.week(s,t,T.absWeek(s)+1,[]);
 assert.ok(s.promoters.find(p=>p.id==='dock').reach>25,'Dockside reaches more people');
 assert.ok(G.purse(o,G.W('rex'))>before,'and pays more for the same match');
 console.log('PASS a hot promotion pays better');
}
