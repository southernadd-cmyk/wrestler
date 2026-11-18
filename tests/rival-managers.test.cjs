'use strict';
// v0.3.16 rival managers: lobbying, moves, poaching, offers for your wrestlers and spots taken from you.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeManagers:M,OfficeBooking:B,OfficeAmbitions:A}=root;
assert.ok(M&&M.turn&&M.lobbyAt,'rival managers are installed');
const fresh=(ids=[])=>{G.fresh();G.S.cash=99999;for(const id of ids)assert.equal(G.sign(id)??null,null);G.S.inbox=[];return G.S;};
// Run the managers' week directly, as if it were week `wk`.
const turn=(s,wk)=>{const reports=[];M.state(s.territory).lastTurn=-1;M.turn(s,s.territory,wk,reports);return reports;};

// 1. Each week every manager works a booker for the wrestlers who want something most, and it costs them.
{
 const s=fresh();A.state();
 const cash=Object.fromEntries(Object.entries(s.worldV4.agencies).map(([k,a])=>[k,a.cash]));
 turn(s,T.absWeek(s));
 const lobby=s.territory.agents.lobby,entries=Object.entries(lobby).flatMap(([pid,l])=>Object.entries(l).map(([id,x])=>({pid,id,...x})));
 assert.ok(entries.length>=5,'most managers lobby: '+entries.length);
 for(const e of entries){
  assert.equal(s.worldV4.contracts[e.id].agencyId,e.by,'a manager lobbies for their own wrestler');
  assert.ok(s.territory.cards[e.pid][e.id],'at a promotion the wrestler works for');
  assert.ok(e.w>0&&e.w<=90);
 }
 const spent=Object.keys(cash).filter(k=>s.worldV4.agencies[k].cash<cash[k]);
 assert.ok(spent.length>=3,'lobbying costs money');
 assert.ok(M.lobbyAt(entries[0].pid).length>=1&&M.lobbyAt(entries[0].pid)[0].manager);
 console.log('PASS managers lobby the bookers: '+entries.length+' wrestlers pushed this week');
}

// 2. The booker listens: a lobbied contender gets the title chase.
{
 const s=fresh(),wk=T.absWeek(s)+1;A.state();
 s.territory.booking=B.blank(wk);for(const p of Object.values(s.territory.booking.promos))for(const d in p.next)p.next[d]=wk;
 const pool=T.promotionRank('crown','men',s.territory,s).filter(w=>!w.owned&&T.contracted(s,w.id));
 const holder=s.territory.titles.crown.men.holder,champ=pool.find(w=>w.id===holder);
 const usual=B.decide(s,s.territory,wk).state.promos.crown.live.find(x=>x.type==='title')?.a;
 const other=pool.filter(w=>w.id!==holder&&w.id!==usual&&['main','feature'].includes(w.slot)&&w.stable!==champ?.stable)[0];
 if(other&&usual){
  M.state(s.territory).lobby={crown:{[other.id]:{by:s.worldV4.contracts[other.id].agencyId,w:90,kind:'title',week:wk}}};
  Object.assign(s.ambitions.w[other.id],{kind:'title',sat:20});
  const story=B.decide(s,s.territory,wk).state.promos.crown.live.find(x=>x.type==='title');
  assert.equal(story?.a,other.id,'the lobbied wrestler gets the chase');
  console.log('PASS a manager’s lobbying changes who the booker builds');
 }
}

// 3. A spot you sat on for a week can go to a rival manager's wrestler, at most one a week, and you hear who took it.
{
 const s=fresh(['rex']),wk=T.absWeek(s);
 const rid=T.opponents('crown','main','men')[0].id;
 const rival=T.promotionRank('crown','men',s.territory,s).find(w=>!w.owned&&w.id!==rid&&s.worldV4.contracts[w.id]?.owner==='ai');
 const team=s.worldV4.contracts[rival.id].agencyId;
 const held=Array.from({length:10},(_,i)=>({id:'held-'+i,pid:'crown',rid,slot:'main',finish:'win_clean',wid:null,tag:null,boost:1,eventAbs:wk+1,expiresAbs:wk+1}));
 const newOne={...held[0],id:'new-one'};
 s.offers=[...held,newOne];
 const a=M.state(s.territory);
 a.lobby={crown:{[rival.id]:{by:team,w:90,kind:'push',week:wk}}};a.seen=held.map(o=>o.id);
 M.takeSpot(s,s.territory,a,wk);
 assert.equal(s.offers.length,10,'exactly one spot is taken');
 assert.ok(s.offers.some(o=>o.id==='new-one'),'never an offer you have only just seen');
 const note=s.inbox.find(m=>/got there first/.test(m.subject));
 assert.ok(note&&note.body[0].includes(rival.name)&&note.body[0].includes('Harold Pike'),'the road agent says who took it');
 const claimed=a.claimed[0];
 assert.ok(claimed&&claimed.a===rival.id&&claimed.b===rid,'taking a spot reserves the two real participants');
 const predicted=B.decide(s,s.territory,claimed.at).bill;
 assert.ok(predicted.some(m=>m.a.id===rival.id&&m.b.id===rid),'the booker puts the replacement on the future circuit bill');
 G.endWeek();
 assert.ok(s.territory.lastResults.matches.some(m=>m.a===rival.id&&m.b===rid),
  'the actual circuit match must happen, not just the inbox letter');
 assert.ok(!a.claimed.some(c=>c.at<=T.absWeek(s)),'fulfilled replacement is removed from the queue');
 // Your own named offers and a weak lobby are left alone.
 s.offers=held.map(o=>({...o,id:o.id+'-x'}));a.seen=s.offers.map(o=>o.id);a.lobby.crown={[rival.id]:{by:team,w:40,kind:'push',week:wk}};
 M.takeSpot(s,s.territory,a,wk);assert.equal(s.offers.length,10,'a half-hearted lobby takes nothing');
 console.log('PASS spots left on the table can go to a rival manager');
}

// 4. A manager with money picks off an unhappy wrestler from another stable.
{
 const s=fresh();A.state();
 const from=s.territory.teams.find(x=>x.roster.length>4&&x.id!=='redwood');
 const titled=new Set(D.PROMOS.flatMap(p=>D.DIVISION_ORDER.map(d=>s.territory.titles[p.id][d].holder)));
 const target=from.roster.filter(id=>!titled.has(id)).sort((x,y)=>(D.findWrestler(y).ring+D.findWrestler(y).heat)-(D.findWrestler(x).ring+D.findWrestler(x).heat))[0];
 s.ambitions.w[target].sat=10;
 for(const a of Object.values(s.worldV4.agencies))a.cash+=50000;
 const reports=turn(s,T.absWeek(s));
 const now=s.worldV4.contracts[target];
 assert.ok(reports.some(l=>/poached/.test(l)),'a poach is reported: '+reports.join(' / '));
 assert.ok(now.owner==='ai'&&now.agencyId!==from.id||reports.some(l=>l.includes('poached')&&!l.includes(D.findWrestler(target).name)),'the unhappy wrestler (or another) moved stables');
 assert.ok(s.territory.teams.every(t=>t.roster.length<=12),'no agency goes over its cap');
 console.log('PASS agencies poach unhappy wrestlers from each other');
}

// 5. An offer for one of your wrestlers who wants out: sell, or say no and live with it.
{
 const s=fresh(['rex']),rex=G.W('rex');rex.heat=70;rex.loyal=40;A.state();
 for(const a of Object.values(s.worldV4.agencies))a.cash+=50000;
 for(const t of s.territory.teams)while(t.roster.length>=12)break;
 turn(s,T.absWeek(s));
 const bid=s.inbox.find(m=>m.dtype==='agent_bid');
 assert.ok(bid,'a manager makes an offer');
 const [wid,teamId,fee]=bid.args;assert.equal(wid,'rex');
 const cash=s.cash;
 assert.match(G.answer(bid.id,'accept'),/signed for/);
 assert.equal(G.W('rex'),undefined,'Rex has gone');
 assert.equal(s.cash,cash+fee,'and the fee is paid');
 assert.equal(s.worldV4.contracts.rex.owner,'ai');assert.equal(s.worldV4.contracts.rex.agencyId,teamId);
 // Saying no to a wrestler who wanted to go costs loyalty.
 const s2=fresh(['rex']),r2=G.W('rex');r2.heat=70;r2.loyal=40;A.state();
 for(const a of Object.values(s2.worldV4.agencies))a.cash+=50000;
 turn(s2,T.absWeek(s2));
 const b2=s2.inbox.find(m=>m.dtype==='agent_bid');
 const loyal=r2.loyal;G.answer(b2.id,'refuse');
 assert.equal(G.W('rex').loyal,loyal-8,'refusing costs loyalty');
 // And no second offer for a while.
 s2.inbox=[];turn(s2,T.absWeek(s2)+1);
 assert.ok(!s2.inbox.some(m=>m.dtype==='agent_bid'),'managers wait before trying again');
 // Paying to keep them: £400, loyalty +20, and they stay.
 const s3=fresh(['rex']),r3=G.W('rex');r3.heat=70;r3.loyal=40;A.state();
 for(const a of Object.values(s3.worldV4.agencies))a.cash+=50000;
 turn(s3,T.absWeek(s3));
 const b3=s3.inbox.find(m=>m.dtype==='agent_bid');
 s3.cash=300;assert.match(G.answer(b3.id,'bonus'),/Not enough cash/,'the bonus needs the money');
 s3.cash=1000;assert.match(G.answer(b3.id,'bonus'),/stays/);
 assert.equal(s3.cash,600);assert.equal(G.W('rex').loyal,60);assert.equal(s3.worldV4.contracts.rex.owner,'player');
 // The old North Circuit scene no longer comes up: over a season a restless star only hears from the managers.
 const s4=fresh(['rex']),r4=G.W('rex');
 for(const a of Object.values(s4.worldV4.agencies))a.cash+=50000;
 for(let i=0;i<16;i++){r4.heat=75;r4.loyal=30;for(const m of G.pending())G.answer(m.id,m.dtype==='agent_bid'?'refuse':m.options[0].id);s4.card=[];G.endWeek();}
 assert.ok(!s4.inbox.some(m=>m.dtype==='poach'),'no old-style approach');
 assert.ok(s4.inbox.some(m=>m.dtype==='agent_bid'),'the managers make their offers instead');
 console.log('PASS managers bid for your wrestlers; selling, paying to keep them and refusing all have consequences');
}

// 6. The week before the agencies sign from the market, you hear who they are after.
{
 const s=fresh();A.state();
 let wk=T.absWeek(s);while(wk%5!==4)wk++;
 turn(s,wk);
 const rumour=s.inbox.find(m=>m.subject==='Word on the circuit');
 assert.ok(rumour&&rumour.body.some(l=>/ is after /.test(l)),'the road agent passes it on');
 const wanted=Object.keys(s.territory.agents.wanted);
 assert.ok(wanted.length&&M.wantedBy(wanted[0])?.manager,'free agents show who wants them');
 turn(s,wk+1);assert.equal(Object.keys(s.territory.agents.wanted).length,0,'and the rumour clears after the signing week');
 console.log('PASS the circuit hears who the agencies are about to sign');
}

// 7. Every eight weeks a manager finds new work for a wrestler stuck at the bottom of every card.
{
 const s=fresh();A.state();let moved=[];
 for(let wk=T.absWeek(s);wk<T.absWeek(s)+8;wk++)moved.push(...turn(s,wk).filter(l=>/ work at /.test(l)));
 assert.ok(moved.length>=1,'somebody is moved: '+moved.length);
 const m=/has got (.+) work at (.+)\.$/.exec(moved[0]);
 const who=D.ALL.find(w=>w.name===m[1]),p=D.PROMOS.find(x=>x.name===m[2]);
 assert.ok(s.territory.cards[p.id][who.id],'they are on that card now');
 console.log('PASS managers move stuck wrestlers to new promotions ('+moved.length+' in eight weeks)');
}

// 8. Two seasons with the managers at work: the save stays sound and the cards stay predictable.
{
 const s=fresh(['kit']);
 for(let i=0;i<32;i++){for(const m of G.pending())G.answer(m.id,m.dtype==='agent_bid'?'refuse':m.options[0].id);s.card=[];G.endWeek();}
 const raw=JSON.stringify(s.territory.agents);
 assert.doesNotMatch(raw,/NaN|undefined/);
 assert.ok(raw.length<8000,'small in the save: '+raw.length);
 for(const t of s.territory.teams)for(const id of t.roster)assert.equal(s.worldV4.contracts[id].agencyId,t.id);
 assert.ok(Object.values(s.worldV4.agencies).every(a=>Number.isFinite(a.cash)));
 console.log('PASS two seasons of rival managers: contracts consistent, save small');
}
