'use strict';
// v0.3.22 disqualifications: booked either way in the match graph, and called by the referee on what they see.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeMatch:MX,OfficeDQ:Q,OfficeRivalry:Riv,OfficeRoom:Room,OfficeRingside:R}=root;
assert.ok(Q&&D.FINISHES.win_dq&&D.FINISHES.lose_dq,'disqualifications are installed');
const clean=/undefined|NaN|\{\w+\}|\[object/;
const run=o=>{const m=MX.create(o);for(let i=0;i<12000&&!m.done;i++){if(m.decision&&!m.queue.length)MX.resolve(m,m.decision.options[0].id);MX.next(m);}assert.ok(m.done);return m;};
const fin=(o={})=>({stars:2.5,crowd:55,crowdPeak:66,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:12,plan:'brawl',stamina:40,injury:0,ignored:0,callsUsed:[],log:[],...o});
let n=0;

// 1. Booked DQs: every route reachable, the right side wins, the graph records it.
{
 G.fresh();const seen=new Set();
 for(let i=0;i<160;i++){
  const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i>>1)%D.FOES.length],finish=i%2?'win_dq':'lose_dq';
  const M=run({w:{...w,fatigue:5},f,p:D.PROMOS[i%4],slot:'main',minutes:12,finish,feudHeat:i%3*30,plan:{game:'brawl',leash:'script',talk:'none'},seed:400+i});
  if(M.outcome!=='booked')continue;
  assert.equal(M.graph.outcome.id,finish);
  const route=M.final.finishRoute;seen.add(route);
  const end=M.log.filter(l=>l.kind==='bell').map(l=>l.text).join(' ');
  assert.match(end,/disqualif/i);
  const loser=finish==='win_dq'?f:w;assert.ok(end.includes(loser.name)||end.includes(loser.short),'the right wrestler is thrown out: '+end);
  assert.doesNotMatch(M.log.map(l=>l.text).join('\n'),clean);
  assert.ok(!M.dqCall,'no referee call on a match that is already a DQ');
 }
 assert.equal(seen.size,6,'all six booked routes: '+[...seen].join(','));
 console.log('PASS booked disqualifications: '+[...seen].sort().join(', '));
}

// 2. The referee: a warning first; only an undisciplined wrestler is thrown out; never the opponent.
{
 G.fresh();let warned=0,dq=0,proDq=0,matches=0;
 for(let i=0;i<500;i++){
  const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*5)%D.FOES.length];
  const M=run({w:{...w,fatigue:5},f,p:D.PROMOS[i%4],slot:'mid',minutes:12,finish:['win_clean','win_dirty','lose_protected','lose_clean'][i%4],plan:{game:'brawl',leash:'free',talk:'fire'},seed:900+i});
  matches++;
  const text=M.log.map(l=>l.text).join('\n');
  if(/warns /.test(text))warned++;
  if(M.outcome==='dq'){
   dq++;if(w.pro>=78)proDq++;
   assert.ok(/warns /.test(text),'a warning comes first');
   assert.equal(M.graph.outcome.id,'dq');assert.equal(M.final.finishRoute,'dq_cheap');
   assert.ok(M.final.stars<=2.5,'a match thrown out is capped');
   assert.match(text,new RegExp(w.name+' is disqualified'));
  }
 }
 assert.equal(proDq,0,'a professional heeds the warning');
 assert.ok(warned>=10&&dq>=1&&dq<matches*.05,`the referee warns ${warned} and throws out ${dq} of ${matches} brawls`);
 console.log(`PASS the referee: ${warned} warnings, ${dq} disqualifications in ${matches} brawls; no professional thrown out`);
}

// 3. No referee call when the stipulation removes disqualifications.
{
 G.fresh();let warned=0;
 for(let i=0;i<120;i++){const w=D.TALENT[i%D.TALENT.length],f=D.FOES[i%D.FOES.length];
  const M=run({w:{...w,pro:30},f,p:D.PROMOS[2],slot:'mid',minutes:12,finish:'win_clean',stip:'nodq',plan:{game:'brawl',leash:'free',talk:'fire'},seed:3000+i});
  assert.notEqual(M.outcome,'dq');if(M.ref)warned++;}
 assert.equal(warned,0,'nobody is even warned when nothing is illegal');
 console.log('PASS no disqualification when the rules say anything goes');
}

// 4. An unbooked DQ is a loss everywhere, and the promoter is not pleased.
{
 G.fresh();const s=G.S;s.cash=9999;G.sign('rex');s.inbox=[];
 const c={id:'dq-'+(n++),pid:'crown',rid:'silas',wid:'rex',slot:'main',minutes:15,finish:'win_clean',purse:400,eventAbs:G.abs()};s.card.push(c);
 const trust=G.P('crown').trust,wins=G.W('rex').wins,cash=s.cash;
 const out=G.applyResult(c,fin({outcome:'dq',finishRoute:'dq_cheap',stars:2}));
 assert.equal(G.W('rex').wins,wins,'not a win');
 assert.equal(s.history[0].outcome,'dq');assert.equal(s.history[0].booked,'win_clean');assert.equal(s.history[0].finish,'lose_dq');
 assert.ok(G.P('crown').trust<=trust-9,'the promoter lost the finish they booked');
 assert.ok(s.cash-cash<400*D.FINISHES.lose_dq.purse,'a quarter off the purse');
 assert.ok(out.some(x=>/disqualified for a cheap shot too many/.test(x.text)));
 const m=Riv.ledger('rex','silas').meetings.at(-1);
 assert.equal(m.winner,'f');assert.equal(m.how,'dq');assert.equal(m.cheat,null);
 assert.ok(!s.card.length,'the booking is used up');
 console.log('PASS an unbooked DQ is a loss, recorded as one, and costs trust');
}

// 5. A run-in the referee sees is a disqualification, not just an ejection.
{
 let dqd=0,ok=0;
 for(let i=0;i<40;i++){
  G.fresh();const s=G.S;s.cash=9999;for(const id of ['rex','lyra'])G.sign(id);G.W('lyra').psych=20;s.inbox=[];
  const c={id:'ri-'+(n++),pid:'crown',rid:'silas',wid:'rex',slot:'main',minutes:12,finish:'win_dirty',purse:200,feudHeat:30,eventAbs:G.abs()};s.card.push(c);
  const w=G.W('rex'),f=G.F('silas'),p=G.P('crown'),st=Room.begin(c,w,f,p);
  for(let g=0;st.stage!=='done'&&g<16;g++){const v=Room.view(st);Room.act(st,v.stage==='board'?'board_ok':v.options[0].id);}
  const sheet=R.attach(st.sheet,c,'lyra:runin');
  const M=run({w,f,p,slot:c.slot,minutes:12,finish:c.finish,feudHeat:30,plan:{game:sheet.game||'story',leash:sheet.leash,talk:sheet.talk},sheet,seed:70+i});
  const k=M.sheet.corner;
  if(k.ejected){dqd++;assert.equal(M.outcome,'dq');assert.equal(M.final.finishRoute,'dq_runin');assert.match(M.log.map(l=>l.text).join(' '),/Knox come over the barrier/);
   const out=R.settle(c,M);assert.ok(out.some(x=>/cost Titan the match/.test(x.text)));}
  else if(k.ok){ok++;assert.equal(M.outcome,'booked');}
 }
 assert.ok(dqd>=3&&ok>=3,`caught run-ins disqualify (${dqd}), clean ones do not (${ok})`);
 console.log(`PASS a caught run-in is a disqualification (${dqd} caught, ${ok} got away with it)`);
}

// 6. Promoters book DQ finishes, mostly on title matches and rematches.
{
 G.fresh();const tally={};
 for(let i=0;i<400;i++){
  const tag=[null,'Rematch','Title defence','Title match'][i%4],finish=['win_dirty','lose_protected','lose_clean','win_clean'][Math.floor(i/4)%4];
  const o={id:'dqo-'+i,tag,finish};Q.dqFinish(o);
  const k=(tag||'plain')+':'+o.finish;tally[k]=(tally[k]||0)+1;
  assert.ok(['win_clean','win_dirty','lose_protected','lose_clean','win_dq','lose_dq'].includes(o.finish));
  if(finish==='win_clean')assert.equal(o.finish,'win_clean','a clean win stays clean');
 }
 const dqs=t=>(tally[t+':win_dq']||0)+(tally[t+':lose_dq']||0);
 assert.ok(dqs('Title defence')>dqs('plain'),'title defences get more DQs than ordinary bouts');
 assert.ok(tally['Title defence:win_dq']>=1,'a champion keeps the belt on a DQ');
 console.log('PASS promoters book DQs: '+['plain','Rematch','Title defence','Title match'].map(t=>t+' '+dqs(t)).join(', '));
}
