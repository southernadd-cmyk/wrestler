'use strict';
// v0.3.25 mouthpieces: a stablemate who can talk does the promo for one who cannot.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeMic:Mic,OfficeMouthpiece:MP,OfficeBonds:B}=root;
assert.ok(MP&&MP.candidates,'mouthpieces are installed');
const clean=/undefined|NaN|\{\w+\}|\[object/;
let n=0;
// Titan (Rex) is not much of a talker; Lyra (Knox) and Brick (Mercer) are the stablemates.
function career(){G.fresh();const s=G.S;s.cash=99999;for(const id of ['rex','lyra','brick'])G.sign(id);s.inbox=[];
 G.W('rex').mic=35;G.W('lyra').mic=85;G.W('brick').mic=40;return s;}
const contract=(o={})=>({id:'mp-'+(n++),pid:'dock',rid:'silas',wid:'rex',slot:'main',minutes:15,finish:'win_clean',purse:300,feudHeat:30,eventAbs:G.abs(),...o});
const play=(st,pick=0)=>{while(st.stage!=='done'){const o=Mic.choices(st);Mic.choose(st,o[Math.min(pick,o.length-1)].id);}return Mic.result(st);};

// 1. Who can speak for whom.
{
 career();const w=G.W('rex');
 let c=MP.candidates(contract(),w);
 assert.equal(c.map(x=>x.id).join(),'lyra','only somebody clearly the better talker (Brick is not)');
 B.shift('rex','lyra',-60,'grudge','A test grudge.','t');
 c=MP.candidates(contract(),w);assert.ok(c[0].refuse,'an enemy will not do it');assert.equal(MP.pick(contract(),w,'lyra'),null);
 console.log('PASS mouthpieces must be the better talker and willing');
}

// 2. The duel with a mouthpiece: they speak, the wrestler is spoken for.
{
 career();const w=G.W('rex'),m=MP.pick(contract(),w,'lyra'),f=G.F('silas'),p=G.P('dock');
 const st=Mic.begin(contract(),w,f,null,null,p,{mouth:m});
 assert.ok(st.readLines.some(l=>/Knox is doing the talking for Titan/.test(l)),'Dennis says so');
 const r=play(st);
 const mine=st.log.filter(e=>e.side==='w');
 assert.ok(mine.length&&mine.every(e=>e.speaker===m.name),'every line from our side is the mouthpiece’s');
 assert.equal(r.mouth.id,'lyra');
 assert.doesNotMatch(st.log.map(e=>e.line).join('\n'),clean);
 const own=Object.values(D.VOICE_PACKS?.rex?.promo||{});
 assert.ok(!st.log.some(e=>own.includes(e.line)),'the mouthpiece does not borrow Titan’s personal lines');
 const again=Mic.begin(contract({id:st.cid}),w,f,null,null,p,{mouth:m});play(again);
 assert.equal(JSON.stringify(again.log),JSON.stringify(st.log),'deterministic');
 console.log('PASS the mouthpiece speaks for the wrestler');
}

// 3. It changes the odds: a poor talker does better with a good mouthpiece, and gets mocked for it more.
{
 career();const w=G.W('rex'),f=G.F('silas'),p=G.P('dock'),m=MP.pick(contract(),w,'lyra');
 let alone=0,helped=0,mockA=0,mockH=0;const N=160;
 for(let i=0;i<N;i++){
  const a=Mic.begin(contract(),w,f,null,null,p),h=Mic.begin(contract(),w,f,null,null,p,{mouth:m});
  alone+=play(a,i%3).quality;helped+=play(h,i%3).quality;
  if(a.angle==='mock')mockA++;if(h.angle==='mock')mockH++;
 }
 alone/=N;helped/=N;
 assert.ok(helped>alone+5,'better promos with the better talker: '+alone.toFixed(1)+' → '+helped.toFixed(1));
 assert.ok(mockH>mockA,'and the other side mocks it: '+mockA+' → '+mockH);
 console.log(`PASS a mouthpiece lifts the promo (${alone.toFixed(1)} → ${helped.toFixed(1)}) and draws mockery (${mockA} → ${mockH} of ${N})`);
}

// 4. Afterwards: closer, unless the wrestler has the ego for it; a big night gets the mouthpiece noticed. Once.
{
 const run=(ego,quality)=>{const s=career();const w=G.W('rex');w.ego=ego;const c=contract();s.card.push(c);
  const before={bond:B.score('rex','lyra'),morale:w.morale,heat:G.W('lyra').heat};
  const out=G.applyResult(c,{stars:3,crowd:60,crowdPeak:70,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:15,plan:'brawl',stamina:40,injury:0,ignored:0,callsUsed:[],log:[],
   promo:{v:5,quality,speaker:'Titan',opponent:'Silas',styleName:'Promo',crowdShift:2,heatDelta:3,moraleDelta:0,trustDelta:0,hook:'.',path:[],speech:[],mouth:{id:'lyra',short:'Knox',name:'Lyra Knox'}}});
  return {out,before,bond:B.score('rex','lyra'),morale:w.morale,heat:G.W('lyra').heat,c,again:()=>G.applyResult(c,{})};};
 let r=run(50,75);
 assert.ok(r.bond>=r.before.bond+8,'closer after a good night');assert.ok(r.heat>=r.before.heat+2,'Knox gets noticed');
 assert.ok(r.out.some(x=>/spoke for Titan/.test(x.text)));
 r=run(85,40);
 assert.ok(r.out.some(x=>/did not enjoy being spoken for/.test(x.text)),'a big ego minds');
 assert.ok(r.bond>r.before.bond&&r.bond<r.before.bond+8,'still a little closer');
 console.log('PASS afterwards: a bond, an ego, and a mouthpiece who gets noticed');
}
