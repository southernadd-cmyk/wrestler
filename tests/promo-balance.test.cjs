'use strict';
// Promo balance: no segment type should be the go-to choice. For a spread of fixtures, every path of every
// segment is scored on one rough career-value scale, and the best expected path of each type is compared.
// Repeating a type is checked too: the crowd tires of the same trick.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeSegments:SG,OfficeMic:Mic}=root;
G.fresh();G.S.cash=1e6;
// Weights: crowd at the bell, the wrestler's heat after the match, feud heat, promoter trust, morale,
// damage to the opponent, fatigue to your own wrestler, and the expected value of a public promise.
const W={crowd:1,wheat:1,feud:.4,trust:1.5,morale:1,hurt:.25,fatigue:-.5,promise:1};
function promiseValue(type,finish){
 if(!type||type==='none')return 0;
 const kept=type==='win'?/^win/.test(finish):type==='clean'?['win_clean','lose_clean'].includes(finish):type==='finisher'?finish==='win_clean':null;
 return kept===null?0:kept?2:-4;
}
function value(r,st,finish){
 const c={crowd:r.crowdShift||0,wheat:Math.max(0,Math.round(((r.quality||50)-35)/14)),feud:r.heatDelta||0,trust:r.trustDelta||0,morale:r.moraleDelta||0,
  hurt:r.opponentHurt||0,fatigue:(st?.flags?.fought?5:0)+(st?.flags?.dove?4:0)+(st?.flags?.selfHurt?6:0),promise:promiseValue(r.promise?.type,finish)};
 return Object.entries(W).reduce((n,[k,w])=>n+w*c[k],0);
}
function paths(R){const out=[];const grow=(p,i)=>{if(i>=R.length){out.push(p);return;}for(const o of R[i].options)o.id==='storm'?out.push([...p,o.id]):grow([...p,o.id],i+1);};grow([],0);return out;}
const mean=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
const TYPES=['solo','vignette','ambush','grilling'];
const talents=['mara','brick','juno','otis'].map(id=>D.TALENT.find(w=>w.id===id));
const wins={},best={},stale={};let fixtures=0;
for(const w of talents)for(const p of [D.PROMOS[0],D.PROMOS[2]])for(const heat of [10,50])for(const finish of ['win_clean','lose_clean']){
 fixtures++;const f=D.FOES[fixtures%2],fx=`${w.id}-${p.id}-${heat}-${finish}`,ev={};
 const contract=type=>({id:'balance-'+fx+'-'+type,wid:w.id,rid:f.id,pid:p.id,slot:'main',minutes:15,finish,feudHeat:heat,eventAbs:1});
 for(const type of TYPES){
  let top=null;
  for(const picks of paths(SG.ENGINES[type].rounds)){
   const st=SG.begin(type,contract(type),w,f,p);for(const id of picks)SG.choose(st,id);
   const v=value(SG.result(st),st,finish);if(!top||v>top.v)top={v,picks};
  }
  ev[type]=top.v;(best[type]??=[]).push(top.v);
  // The same best path after three weeks of the same segment.
  const st=SG.begin(type,contract(type),w,f,p);st.stale=3;for(const id of top.picks)SG.choose(st,id);(stale[type]??=[]).push(value(SG.result(st),st,finish));
 }
 // Face to face: a sensible player picks the line that suits tonight. Averaged over three seeds.
 ev.duel=mean(['a','b','c'].map(seed=>{const st=Mic.begin({...contract('duel'),id:'balance-'+fx+'-duel-'+seed},w,f,null,null,p);
  for(let k=0;st.stage!=='done'&&k<10;k++){const o=Mic.choices(st);Mic.choose(st,o.slice().sort((a,b)=>(b.fit||0)-(a.fit||0))[0].id);}
  return value(Mic.result(st),st,finish);}));
 (best.duel??=[]).push(ev.duel);
 const top=[...TYPES,'duel'].sort((a,b)=>ev[b]-ev[a])[0];wins[top]=(wins[top]||0)+1;
}
const share=t=>(wins[t]||0)/fixtures,r1=x=>Math.round(x*10)/10;
const report=[...TYPES,'duel'].map(t=>t+' '+Math.round(100*share(t))+'% (best '+r1(mean(best[t]))+')').join(', ');
for(const t of [...TYPES,'duel'])assert.ok(share(t)<=.45,'no segment is the go-to choice: '+report);
assert.ok([...TYPES,'duel'].filter(t=>wins[t]).length>=4,'most segment types are the best choice somewhere: '+report);
const means=[...TYPES,'duel'].map(t=>mean(best[t]));
assert.ok(Math.max(...means)-Math.min(...means)<=6,'best-play values stay within a band: '+report);
for(const t of TYPES)assert.ok(mean(stale[t])<mean(best[t])-4,t+' loses its edge when repeated: '+r1(mean(stale[t]))+' v '+r1(mean(best[t])));
console.log('PASS no promo is the go-to over '+fixtures+' fixtures: '+report);

// Freshness reads match history and says so on the menu.
{
 G.fresh();G.S.cash=1e6;G.sign('rex');
 const w=G.W('rex'),f=G.F('silas'),p=G.P('crown'),c={id:'fresh-1',wid:'rex',rid:'silas',pid:'crown',slot:'main',minutes:15,finish:'win_clean',feudHeat:30,eventAbs:1};
 const run=()=>{const st=SG.begin('ambush',c,w,f,p);for(const id of ['catering','quick','leave'])SG.choose(st,id);return {st,r:SG.result(st)};};
 const fresh=run();
 assert.ok(!SG.menu(c,w,f,p).find(x=>x.id==='ambush').tags.some(t=>/Seen it lately/.test(t)));
 G.S.history=[{wid:'rex',promo:{style:'Backstage ambush'}},{wid:'rex',promo:{style:'Solo promo'}},{wid:'rex',promo:{style:'Backstage ambush'}},{wid:'rex',promo:{style:'Backstage ambush'}}];
 const m=SG.menu(c,w,f,p),amb=m.find(x=>x.id==='ambush'),solo=m.find(x=>x.id==='solo');
 assert.ok(amb.tags.includes('Seen it lately ▼▼'),'two of the last three were ambushes: '+amb.tags);assert.match(amb.hint,/2 times in their last 3/);
 assert.ok(solo.tags.includes('Seen it lately ▼'));
 assert.ok(!m.find(x=>x.id==='grilling').tags.some(t=>/Seen it/.test(t)),'a fresh segment is fresh');
 const tired=run();assert.equal(tired.st.stale,2);
 assert.ok(tired.r.quality<fresh.r.quality&&tired.r.crowdShift<fresh.r.crowdShift&&tired.r.heatDelta<fresh.r.heatDelta,'repeats land softer');
 G.S.history.push({wid:'mara',promo:{style:'Backstage ambush'}});
 assert.equal(SG.begin('ambush',c,G.W('rex')??w,f,p).stale,2,'other wrestlers’ segments do not count');
 console.log('PASS repeating a segment shows on the menu and costs quality, crowd and heat');
}
