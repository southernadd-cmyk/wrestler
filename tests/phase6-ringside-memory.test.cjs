'use strict';
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');
const {root}=engine(6612);
const {OfficeGame:G,OfficeRivalry:R,OfficeRingside:Ring}=root;
const fin=o=>({stars:3,crowd:67,crowdPeak:73,outcome:o,finishRoute:o==='dq'?'dq_runin':'tights',botches:0,script:.8,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:14,plan:'story',stamina:60,injury:0,ignored:0,callsUsed:[],log:[]});
function run(caught){
 G.fresh();const s=G.S;s.cash=99999;s.rep=60;
 assert.equal(G.sign('rex'),null);assert.equal(G.sign('lyra'),null);
 const c={id:'phase6-runin-'+caught,pid:'dock',wid:'rex',rid:'silas',slot:'main',minutes:14,purse:350,finish:'win_dirty',eventAbs:G.abs()};
 s.card.push(c);G.applyResult(c,fin(caught?'dq':'booked'));
 const k={id:'lyra',short:G.W('lyra').short,job:'runin',fired:true,ok:!caught,ejected:caught,dq:caught};
 assert.ok(Ring.settle(c,{sheet:{corner:k}}).length);
 const h=s.history.find(x=>x.cid===c.id),p=R.profile('rex','silas');
 assert.equal(h.ringside.second,'lyra');assert.equal(h.ringside.dq,caught);
 assert.equal(p.last.ringside.secondName,G.W('lyra').short);
 const issue=caught?'runin_caught':'runin_hidden';
 const fact=p.facts.find(x=>x.kind===issue);assert.ok(fact,'new public evidence');
 assert.match(fact.text,/lyra/i);
 const args=R.casesFor({seed:'test-seed'},c,G.W('rex'),G.F('silas'));
 const authored=args.find(x=>x.issue===issue);assert.ok(authored,'opponent must have authored reply');
 assert.match(authored.counter,/lyra/i);assert.equal(Object.keys(authored.responses).length,5);
 const snapshot=JSON.stringify(s);assert.equal(Ring.settle(c,{sheet:{corner:k}}).length,0);
 assert.equal(JSON.stringify(s),snapshot,'no second settlement');
 G.S=JSON.parse(JSON.stringify(s));assert.ok(R.profile('rex','silas').facts.some(x=>x.kind===issue),'save/reload retains fact');
 return p.last;
}
assert.equal(run(false).winner,'w');const caught=run(true);assert.equal(caught.winner,'f');assert.equal(caught.outcome,'dq');
console.log('PASS Phase 6: seen and unseen run-ins create distinct persistent, answerable rivalry facts');
