'use strict';
// v0.3.11 the locker room: bonds and grudges between wrestlers, grown from what they remember.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeRoom:Room,OfficeBonds:B,OfficeMemory:Mem}=root;
assert.ok(B&&B.score&&B.list,'the locker room is installed');

const fin=(o={})=>({stars:2.75,crowd:61,crowdPeak:68,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:12,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[],...o});
let n=0;const match=(wid,rid,o={})=>({id:'rel-'+(n++),wid,rid,pid:'dock',slot:'main',minutes:15,finish:'win_clean',purse:300,feudHeat:0,blowoff:false,eventAbs:G.abs(),...o});
function career(ids){G.fresh();G.S.cash=99999;for(const id of ids)assert.equal(G.sign(id)??null,null,'signed '+id);G.S.inbox=[];return G.S;}
const answerAll=()=>{for(const m of G.S.inbox.filter(m=>m.kind==='decision'&&!m.answer))G.answer(m.id,m.options.at(-1).id);};

// 1. A match moves the bond with the opponent, read from the memory it leaves; never twice.
career(['rex']);
const c1=match('rex','silas');G.applyResult(c1,fin({stars:4.25}));
const great=B.score('rex','silas');assert.ok(great>=14,'a classic together builds respect ('+great+')');
G.applyResult(c1,fin({stars:4.25}));assert.equal(B.score('rex','silas'),great,'the same match never counts twice');
G.applyResult(match('rex','malik',{finish:'lose_clean'}),fin({injury:12,stars:2}));
assert.ok(B.score('rex','malik')<=-16,'an injury leaves a grudge');
assert.ok(B.list('rex').every((r,i,l)=>!i||Math.abs(l[i-1].score)>=Math.abs(r.score)),'the strongest feelings come first');
assert.match(B.list('rex').find(r=>r.other==='silas').reason,/match of their lives/);

// 2. Dennis's room: friends cooperate and make a better match; enemies dig in and it looks real.
const W=G.W('rex'),friend=D.findWrestler('silas'),enemy=D.findWrestler('malik'),P=D.PROMOS[0];
B.shift('rex','silas',30,'test','Old friends.','seed-friends');
const good=Room.begin(match('rex','silas'),W,friend,P);
assert.equal(good.bond.label,'Allies');assert.ok(good.fx.bonus>=1&&good.mood.w>0&&good.mood.f>0);
assert.ok(good.log.some(e=>/get on/.test(e.text)),'Dennis notices');
B.shift('rex','malik',-30,'test','Bad blood.','seed-enemies');
const bad=Room.begin(match('rex','malik'),W,enemy,P);
assert.equal(bad.bond.label,'Rivals');assert.ok(bad.mood.w<0&&bad.fx.crowd>=2&&bad.heat>=40);
assert.ok(bad.log.some(e=>/can’t stand each other/.test(e.text)));

// 3. A friend with an ego, beaten clean, turns on your wrestler after the bell.
const tough=D.ALL.find(w=>!G.W(w.id)&&(w.ego||0)>=72&&w.id!=='silas'&&w.id!=='malik');
B.shift('rex',tough.id,40,'test','Travelled together for years.','seed-turn');
const fat=G.W('rex').fatigue;const msgs=G.S.inbox.length;
const out=G.applyResult(match('rex',tough.id),fin({stars:3}));
assert.ok(B.score('rex',tough.id)<0,'the friendship is over');assert.ok(B.get('rex',tough.id).betrayed);
assert.ok(G.W('rex').fatigue>=fat+10,'the attack leaves Rex sore on top of the match');assert.ok(out.some(x=>/Locker room/.test(x.text)));
assert.ok(G.S.inbox.length>msgs&&/turned on/.test(G.S.inbox[0].subject));
assert.ok(Mem.view('rex').entries.some(e=>e.kind==='betrayed'),'and Rex remembers it');

// 4. Stablemates: shared journeys build a bond; a proud one left at home while the other headlines resents it.
const proud=D.ALL.filter(w=>(w.ego||0)>=70&&(w.loyal??55)<60).map(w=>w.id),calm=D.ALL.filter(w=>(w.pro||0)>=80&&(w.ego||0)<60).map(w=>w.id);
const [a,b]=[proud.find(id=>G.S?.free.some(x=>x.id===id))||proud[0],calm[0]];
career([a,b]);
const S=G.S,wk=()=>({season:S.season,week:S.week});
S.history.unshift({...wk(),wid:a,rid:'silas',slot:'opener',stars:2},{...wk(),wid:b,rid:'malik',slot:'main',stars:3});
G.endWeek();answerAll();
assert.equal(B.score(a,b),3,'they shared the drive');
S.history.unshift({...wk(),wid:b,rid:'malik',slot:'main',stars:3});
G.endWeek();answerAll();
assert.ok(B.score(a,b)<3,'the proud one sat at home and minded');

// 5. A grudge: the scene asks you to settle it; leave it and it boils over.
B.shift(a,b,-60,'test','A row over billing.','seed-grudge');
G.S.bonds.lastScene=-99;G.endWeek();
const scene=G.S.inbox.find(m=>m.dtype==='bond_grudge'&&!m.answer);assert.ok(scene,'the grudge becomes a backstage scene');
assert.equal(scene.options.length,3);G.answer(scene.id,'leave');
const before=G.W(b).fatigue;for(let i=0;i<3;i++){G.endWeek();answerAll();}
const proudW=D.findWrestler(a);
if((proudW.ego||0)>=70&&(proudW.loyal??55)<60){
 assert.ok(G.W(b).fatigue>=before+15||G.S.inbox.some(m=>/jumped/.test(m.subject)),'left alone, it ends in the car park');
 assert.ok(B.get(a,b).betrayed);
}else{
 assert.ok(G.S.bonds.leaks[b],'left alone, the plan gets leaked');
 const r=Room.begin(match(b,'silas'),G.W(b),friend,P);
 assert.ok(r.log.some(e=>/Somebody talked/.test(e.text)),'Dennis finds out who');
}

// 5b. A grudge held by someone without the nerve for a fight comes out as a leak instead.
{
 const holder='lyra',target=calm.find(id=>id!=='lyra');career([holder,target]);
 B.shift(holder,target,-60,'test','Took the spot Lyra wanted.','seed-leak');
 G.S.bonds.lastScene=-99;G.endWeek();
 const g=G.S.inbox.find(m=>m.dtype==='bond_grudge'&&!m.answer);assert.ok(g&&g.args[0]===holder);G.answer(g.id,'leave');
 for(let i=0;i<3;i++){G.endWeek();answerAll();}
 assert.equal(G.S.bonds.leaks[target]?.by,holder,'Lyra leaks the plan rather than starting a fight');
 const was=B.score(holder,target);
 const r=Room.begin(match(target,'silas'),G.W(target),friend,P);
 assert.ok(r.log.some(e=>/Somebody talked\. I asked around: it was Knox/.test(e.text)),'Dennis names who talked');
 assert.ok(r.mood.w<0&&B.score(holder,target)<was&&B.get(holder,target).betrayed,'and it costs them both');
 const r2=Room.begin(match(target,'silas'),G.W(target),friend,P);
 assert.ok(!r2.log.some(e=>/Somebody talked/.test(e.text)),'a leak spoils one meeting, not every one');
}

// 6. A grudge settled by professionals clears the air.
career([calm[0],calm[1]]);B.shift(calm[0],calm[1],-50,'test','Words in the van.','seed-pros');
G.S.bonds.lastScene=-99;G.endWeek();
const sit=G.S.inbox.find(m=>m.dtype==='bond_grudge');assert.ok(sit);assert.match(G.answer(sit.id,'sit'),/shook hands/);
assert.ok(B.score(calm[0],calm[1])>-50);

// 7. A friend who is a free agent: your wrestler vouches, and the fee comes down.
career(['rex']);const mate=G.S.free[0];B.shift('rex',mate.id,40,'test','Same gym.','seed-mate');
const fee=mate.fee;G.S.bonds.lastScene=-99;G.endWeek();
const vouch=G.S.inbox.find(m=>m.dtype==='bond_vouch');assert.ok(vouch,'Rex asks you to sign a friend');
G.answer(vouch.id,'talk');assert.equal(G.S.free.find(x=>x.id===mate.id).fee,Math.round(fee*.8));

// 7b. A grudge with an opponent: settle it in the ring and the rivalry heats up.
career(['rex']);B.shift('rex','malik',-40,'test','Broke Rex’s nose.','seed-score');
G.S.bonds.lastScene=-99;G.endWeek();
const score=G.S.inbox.find(m=>m.dtype==='bond_score');assert.ok(score&&/another go at/.test(score.subject),'Rex wants Malik again');
assert.match(G.answer(score.id,'settle'),/rivalry heat 15/);assert.equal(G.feud('rex','malik').heat,15);

// 7c. The existing car-park row between stablemates now leaves a mark on their bond.
career([calm[0],calm[1]]);
G.S.inbox.unshift({id:'row-1',from:'Your road agent',subject:'Words',kind:'decision',dtype:'clash',args:[calm[0],calm[1]],body:[],options:[{id:'a',label:'A',hint:''},{id:'b',label:'B',hint:''},{id:'fine',label:'Fine',hint:''}],answer:null,read:false,week:1,season:1});
G.answer('row-1','a');assert.equal(B.score(calm[0],calm[1]),-14,'backing one side of a row costs their bond');

// 8. Saves: old careers start with an empty locker room; bonds survive a reload.
const saved=JSON.parse(JSON.stringify(G.S));delete saved.bonds;G.S=saved;assert.equal(B.score('rex',mate.id),0);
B.shift('rex','silas',20,'test','x','reload');const again=JSON.parse(JSON.stringify(G.S));G.S=again;assert.equal(B.score('rex','silas'),20);

console.log('PASS relationships v0.3.11: match bonds from memories (no double counting); friends and enemies in Dennis’s room; a friend turns after a clean loss; journeys and jealousy; grudges settled, left to boil over or leaked; vouching for a free agent; old saves and reloads');
