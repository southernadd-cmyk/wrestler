'use strict';
// v0.3.20 after the bell: the planned angle, the microphone, and a callout that brings next week's offer.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeAfter:A,OfficeBonds:B}=root;
assert.ok(A&&A.begin&&A.speak&&A.plans,'after the bell is installed');
const fin=(o={})=>({stars:3.5,crowd:66,crowdPeak:72,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:15,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[],...o});
let n=0;
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=55;G.sign('rex');s.inbox=[];s.offers=[];return s;}
function contract(o={}){
 const s=G.S,div=D.divisionOf('rex'),pid=o.pid||'dock';
 const rid=o.rid||T.opponents(pid,'mid',div)[0].id;
 if(!s.territory.cards[pid].rex)s.territory.cards[pid].rex={score:40,matches:2,wins:1};
 const c={id:'c-test-'+(n++),pid,rid,wid:'rex',slot:'mid',minutes:12,finish:'win_clean',purse:200,eventAbs:G.abs(),...o};
 s.card.push(c);return c;
}
const play=(c,f=fin())=>{G.applyResult(c,f);return f;};

// 1. The plans on offer follow the booked finish.
{
 career();const c=contract({finish:'lose_clean'}),w=G.W('rex'),f=G.F(c.rid);
 const ids=A.plans(c,w,f).map(x=>x.id);
 assert.equal(ids.join(),'none,handshake,staredown,beatdown','no lap of honour after a loss');
 assert.ok(A.plans({...c,finish:'win_clean'},w,f).some(x=>x.id==='celebrate'),'a winner can take a lap of honour');
 console.log('PASS the plans follow the booked finish');
}

// 2. Every angle resolves, changes the save once, and a reload does not play it again.
{
 const seen={};
 for(const plan of ['handshake','staredown','beatdown','celebrate']){
  for(let i=0;i<12;i++){
   const s=career();const c=contract({finish:'win_clean'});const f=play(c);
   const before=JSON.stringify({bonds:s.bonds,feuds:s.feuds,cash:s.cash});
   const st=A.begin(c,f,plan);
   assert.equal(st.plan,plan);assert.ok(st.angle&&typeof st.angle.ok==='boolean','the angle has an outcome');
   assert.ok(st.cons.length>=1&&st.log.length>=2,'it says what happened and what it did');
   seen[plan+':'+st.angle.ok]=1;
   const after=JSON.stringify({bonds:s.bonds,feuds:s.feuds,cash:s.cash});
   if(plan!=='celebrate')assert.notEqual(before,after,plan+' changes something');
   const again=A.begin(c,f,plan);
   assert.equal(again.stage,'done','a second begin for the same contract plays nothing');
   assert.equal(JSON.stringify({bonds:s.bonds,feuds:s.feuds,cash:s.cash}),after,'and changes nothing');
  }
 }
 for(const k of ['handshake:true','handshake:false','beatdown:true','beatdown:false','staredown:true','celebrate:true'])assert.ok(seen[k],'seen '+k);
 console.log('PASS every angle plays out once, both ways: '+Object.keys(seen).sort().join(', '));
}

// 3. Same contract, same save: same outcome.
{
 const run=()=>{const s=career();n=50;const c=contract();const f=play(c);const st=A.begin(c,f,'beatdown');A.speak(st,'gloat');return JSON.stringify([st.angle,st.cons,s.feuds]);};
 assert.equal(run(),run(),'deterministic');
 console.log('PASS deterministic from the contract and the save');
}

// 4. The microphone: options follow the result; a choice is final.
{
 career();let c=contract({finish:'win_clean'});let f=play(c);let st=A.begin(c,f,'none');
 let ids=A.micOptions(st).map(o=>o.id);
 assert.ok(ids.includes('gloat')&&ids.includes('credit')&&!ids.includes('concede'),'winner options');
 assert.ok(ids.includes('rematch')&&ids.includes('walk'),'rematch and silence');
 assert.ok(A.speak(st,'credit'));assert.equal(st.stage,'done');assert.equal(A.speak(st,'gloat'),false,'one thing said');
 career();c=contract({finish:'lose_clean'});f=play(c);st=A.begin(c,f,'none');
 ids=A.micOptions(st).map(o=>o.id);
 assert.ok(ids.includes('concede')&&ids.includes('excuse')&&!ids.includes('gloat'),'loser options');
 assert.equal(A.speak(st,'nonsense'),false,'unknown choices are refused');
 const h0=G.W('rex').heat;A.speak(st,'excuse');
 assert.ok(G.W('rex').heat<=h0,'blaming a clean finish never helps');
 console.log('PASS the microphone follows the result');
}

// 5. A callout that lands brings that match to the desk next week, for that wrestler, one step up the card.
{
 let landed=null,tries=0;
 for(let i=0;i<60&&!landed;i++){
  const s=career();n=100+i;const c=contract({finish:'win_clean',pid:'dock'});const w=G.W('rex');w.mic=80;w.heat=70;
  const f=play(c,fin({stars:4}));const st=A.begin(c,f,'staredown');
  const call=A.micOptions(st).find(o=>o.id==='rematch');tries++;
  A.speak(st,call.id);
  if(st.call?.ok)landed={s,c,st};
 }
 assert.ok(landed,'a callout lands within '+tries+' tries');
 const {s,c,st}=landed;
 assert.equal(A.state().calls.length,1,'the call is waiting for next week');
 s.card=[];G.endWeek();
 const o=s.offers.find(x=>x.tag==='Callout');
 assert.ok(o,'next week the promoter offers it');
 assert.equal(o.wid,'rex');assert.equal(o.rid,st.call.target);assert.equal(o.pid,'dock');
 assert.equal(D.SLOT_ORDER.indexOf(o.slot),Math.min(D.SLOT_ORDER.length-1,D.SLOT_ORDER.indexOf(c.slot)+1),'one step up the card');
 assert.ok(D.FINISHES[o.finish],'with a booked finish');
 assert.equal(A.state().calls.length,0,'and the call is used up');
 assert.ok(s.inbox.some(m=>/You asked for/.test(m.subject)),'the booker rings');
 assert.equal(G.book(o.id,'rex'),null,'it can be signed');
 console.log('PASS a callout that lands becomes next week’s offer ('+tries+' tries)');
}

// 6. A callout that flops costs a little; aiming at a champion from nowhere annoys the promoter.
{
 let flop=0,champ=0;
 for(let i=0;i<40;i++){
  const s=career();n=300+i;const c=contract({finish:'lose_clean',pid:'dock'});const w=G.W('rex');w.mic=25;w.heat=10;
  const f=play(c,fin({stars:1.5,crowd:40}));const st=A.begin(c,f,'none');
  const opt=A.micOptions(st).find(o=>o.id.startsWith('call:'))||A.micOptions(st).find(o=>o.id==='rematch');
  const trust=G.P('dock').trust,heat=w.heat;
  A.speak(st,opt.id);
  if(!st.call.ok){flop++;assert.ok(w.heat<=heat,'a flop costs heat');if(st.call.champion){champ++;assert.ok(G.P('dock').trust<trust,'a title challenge from nowhere costs trust');}}
  assert.ok(st.call.chance>=8&&st.call.chance<=90,'odds stay between 8% and 90%');
 }
 assert.ok(flop>=20,'a poor talker after a bad loss usually flops: '+flop+'/40');
 console.log('PASS flops cost heat and morale ('+flop+'/40 flopped, '+champ+' at a champion)');
}

// 7. A stale call (wrestler released) is dropped once its window has passed, and offers nothing.
{
 const s=career();const c=contract();play(c);
 A.state().calls.push({wid:'rex',rid:c.rid,pid:'dock',slot:'mid',from:'c-stale',made:G.abs(),due:G.abs()+1,until:G.abs()+2});
 G.release('rex');s.card=[];
 G.endWeek();G.endWeek();G.endWeek();
 assert.equal(A.state().calls.length,0,'dropped');
 assert.ok(!s.offers.some(o=>o.tag==='Callout'),'no offer for a wrestler you no longer have');
 console.log('PASS a stale call is dropped');
}

// 8. Every line and consequence starts like a sentence, even when it starts with “the Reverend”.
{
 let lines=0;
 for(let i=0;i<30;i++){
  career();n=600+i;const c=contract({rid:'rev',finish:i%2?'win_clean':'lose_protected'});const f=play(c);
  const st=A.begin(c,f,['handshake','staredown','beatdown','none'][i%4]);
  const opts=A.micOptions(st);A.speak(st,opts[i%opts.length].id);
  for(const t of [...st.log.map(x=>x.text),...st.cons.map(x=>x.text)]){lines++;assert.ok(!/^[“"]?[a-z]/.test(t)&&!/[.!?]\s+[a-z]/.test(t),'starts with a capital: '+t);}
 }
 console.log('PASS '+lines+' lines read as sentences');
}
