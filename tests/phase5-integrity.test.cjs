'use strict';
// A completed contract may only settle once, even if the referee's result was
// a disqualification, old detailed commentary has rolled off, or title stakes exist.
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');
const {root}=engine(5090);
const {OfficeGame:G,OfficeData:D,OfficeTerritory:T,OfficeProgrammes:P}=root;
const finish=(x={})=>({
 stars:3.5,crowd:68,crowdPeak:76,outcome:'booked',finishRoute:'finisher',
 botches:0,script:.85,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},
 minutes:14,plan:'story',stamina:60,injury:0,ignored:0,callsUsed:[],log:[],...x
});
const fresh=()=>{
 G.fresh();const s=G.S;s.cash=99999;s.rep=65;
 assert.equal(G.sign('rex'),null);
 return s;
};
let n=0;
function run(outcome,extras={}){
 const s=fresh(),c={id:'phase5-'+(++n),pid:'crown',wid:'rex',rid:'silas',
  slot:'main',minutes:14,finish:'win_clean',purse:400,eventAbs:G.abs(),...extras};
 s.card.push(c);
 const f=finish(outcome);
 G.applyResult(c,f);
 assert.equal(s.history[0].cid,c.id,'result must be in the archive');
 const state=JSON.stringify(s);
 const replay=G.applyResult(c,f);
 assert.deepEqual(Array.from(replay),[],'duplicate should have no consequences');
 assert.equal(JSON.stringify(s),state,'repeat result must change no title, ranking, contract, money, world, rivalry or memory state');
 assert.equal(G.resultRecorded(c),true);
 return {s,c,f};
}
run({});
run({outcome:'dq',finishRoute:'dq_cheap'});
run({outcome:'nc',finishRoute:null});
const title=run({}, {title:{pid:'crown',div:D.divisionOf('rex')}});
assert.equal(title.s.territory.titleLog.filter(x=>x.how==='match').length<=1,true,'one result can change a belt at most once');

// Even after the detailed history and rolling season summaries are evicted,
// a recent completed contract remains in the light-weight idempotency index.
const archived=run({});
archived.s.history=[];archived.s.seasonResults=[];
const snapshot=JSON.stringify(archived.s);
assert.deepEqual(Array.from(G.applyResult(archived.c,archived.f)),[]);
assert.equal(JSON.stringify(archived.s),snapshot);

// An explicitly announced two-out-of-three-falls programme payoff is signed
// once, retains its stipulation across future bookings and adds five minutes.
{
 const s=fresh(),wk=G.abs(),id='phase5-payoff';
 const o={id:'offer-'+id,pid:'crown',rid:'silas',slot:'main',finish:'lose_clean',
  eventAbs:wk+2,expiresAbs:wk+1,wid:'rex',boost:1.2,tag:'Programme',
  programme:{id,pid:'crown',wid:'rex',rid:'silas',type:'grudge',
   div:D.divisionOf('rex'),beats:[
    {at:wk+2,rid:'malik',slot:'feature',finish:'win_clean',done:false,cid:null},
    {at:wk+4,rid:'silas',slot:'main',finish:'lose_clean',blowoff:true,stip:'falls',done:false,cid:null}
   ],offered:wk,swerved:false}};
 s.offers.push(o);
 assert.equal(G.book(o.id,'rex'),null);
 const signed=s.futureBookings.find(c=>c.programme?.id===id&&c.programme.step===1);
 assert.ok(signed,'payoff booked in the future');
 assert.equal(signed.stip,'falls');
 assert.equal(signed.minutes,D.SLOTS.main.mins+10,'five minute blow-off extension and five minute fall extension');
 assert.equal(P.state(s.territory).live.find(p=>p.id===id).beats.at(-1).stip,'falls');
}
console.log('PASS Phase 5: idempotent results across the wrapper chain and stipulated programme payoffs');
