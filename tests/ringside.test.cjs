'use strict';
// v0.3.21 ringside plans: a stablemate in the corner, a job on the match strip, and what it did.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeRoom:Room,OfficeMatch:MX,OfficeRingside:R,OfficeSheets:Sh,OfficeBonds:B}=root;
assert.ok(R&&R.attach&&R.settle&&R.options,'ringside is installed');
const clean=/undefined|NaN|\{\w+\}|\[object/;
let n=0;
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=55;for(const id of ['rex','lyra','brick'])G.sign(id);s.inbox=[];return s;}
function contract(o={}){const rid=o.rid||'silas';const c={id:'rs-'+(n++),pid:'dock',rid,wid:'rex',slot:'mid',minutes:12,finish:'win_dirty',purse:200,feudHeat:30,eventAbs:G.abs(),...o};G.S.card.push(c);return c;}
// A real night: Dennis's meeting played to the end, the corner attached, the match run to the bell.
function night(c,choice,seed=7){
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
 const st=Room.begin(c,w,f,p);
 for(let g=0;st.stage!=='done'&&g<16;g++){const v=Room.view(st);Room.act(st,v.stage==='board'?'board_ok':v.options[0].id);}
 const sheet=R.attach(st.sheet,c,choice);
 const M=MX.create({w,f,p,slot:c.slot,minutes:sheet.minutes||c.minutes,finish:c.finish,feudHeat:c.feudHeat,plan:{game:sheet.game||'story',leash:sheet.leash,talk:sheet.talk},sheet,seed});
 for(let i=0;i<12000&&!M.done;i++){if(M.decision&&!M.queue.length)MX.resolve(M,M.decision.options[0].id);MX.next(M);}
 assert.ok(M.done,'the match finishes');
 return M;
}

// 1. Who can go out, and what they can do, follows the booking and the locker room.
{
 career();const w=G.W('rex'),f=G.F('silas');
 let list=R.seconds(contract({finish:'win_dirty'}),w,f);
 assert.equal(list.map(x=>x.id).sort().join(),'brick,lyra','your other wrestlers');
 assert.ok(list[0].jobs.includes('runin'),'a run-in only with a dirty win booked');
 list=R.seconds(contract({finish:'win_clean',feudHeat:0}),w,f);
 assert.ok(!list[0].jobs.includes('runin')&&!list[0].jobs.includes('refbump'),'no run-in or ref bump on a clean win with no heat');
 G.W('lyra').injury=2;
 assert.equal(R.seconds(contract(),w,f).find(x=>x.id==='lyra').jobs.join(),'support','an injured wrestler can only stand in the corner');
 B.shift('rex','brick',-60,'grudge','A test grudge.','t1');
 assert.ok(R.seconds(contract(),w,f).find(x=>x.id==='brick').refuse,'an enemy will not stand in the corner');
 assert.equal(R.attach({signed:true,nodes:[{id:'finish'}]},contract(),'brick:distract').corner,undefined,'and cannot be sent anyway');
 console.log('PASS who can go to ringside and what they can do');
}

// 2. A job goes on the strip, happens in its window, and settles the save once.
{
 const seen={};
 for(const job of ['support','distract','refbump','runin']){
  for(let i=0;i<14;i++){
   career();const c=contract({finish:'win_dirty',feudHeat:40});
   const M=night(c,'lyra:'+job,100+i);
   const k=M.sheet.corner;assert.equal(k.job,job);
   assert.ok(k.announced,'the second is announced');
   const text=M.log.map(l=>l.text).join('\n');assert.doesNotMatch(text,clean);
   assert.match(text,/Knox walks out in Titan’s corner/,'introduced at the entrance');
   if(job!=='support'){
    const node=M.sheet.nodes.find(b=>b.corner),strip=Sh.strip(M,{final:true});
    assert.ok(strip.beats.some(b=>b.id==='corner'&&b.slot==='Ringside'),'it is on the strip');
    if(k.fired){assert.ok(k.t/M.len>=node.window[0]-.01,'not before its window');assert.equal(node.status,k.ok?'achieved':'missed');}
    seen[job+':'+(k.fired?k.ok?'ok':k.hurtRef?'hurt':'ejected':'late')]=1;
   }else seen.support=1;
   const s=G.S,before=JSON.stringify([s.cash,s.promoters,s.bonds?.pairs]);
   const cons=R.settle(c,M);
   assert.ok(cons.length>=1&&cons.every(x=>!clean.test(x.text)),'it says what it did');
   const once=JSON.stringify([s.cash,s.promoters,s.bonds?.pairs]);
   assert.notEqual(before,once,'and changes the save');
   assert.equal(R.settle(c,M).length,0,'once');
   assert.equal(JSON.stringify([s.cash,s.promoters,s.bonds?.pairs]),once,'only once');
  }
 }
 for(const k of ['support','distract:ok','distract:ejected','runin:ok','refbump:ok'])assert.ok(seen[k],'seen '+k+' in '+Object.keys(seen).join(','));
 console.log('PASS each job plays out on the strip and settles once: '+Object.keys(seen).sort().join(', '));
}

// 3. The booked finish still stands, whatever happens at ringside.
{
 for(const finish of ['win_dirty','win_clean','lose_protected','lose_clean']){
  career();const c=contract({finish,feudHeat:40});
  const job=finish==='win_dirty'?'runin':'distract';
  const M=night(c,'lyra:'+job,55);
  assert.ok(M.final&&['booked','nc','double','dq'].includes(M.final.outcome));
  if(M.final.outcome==='dq')assert.ok(M.sheet.corner.dq||M.ref,'a DQ only from a caught run-in or the referee');
  if(M.final.outcome==='booked')assert.equal(M.o.finish,finish);
 }
 console.log('PASS the booked finish is untouched');
}

// 4. A careful second at a showman's promotion is thrown out less often than a careless one at North Crown.
{
 const rate=(pid,psych)=>{let out=0,fired=0;for(let i=0;i<40;i++){career();G.W('lyra').psych=psych;const c=contract({pid,finish:'win_dirty'});const M=night(c,'lyra:distract',300+i);if(M.sheet.corner.fired){fired++;if(M.sheet.corner.ejected)out++;}}return out/Math.max(1,fired);};
 const easy=rate('pulse',95),hard=rate('crown',30);
 assert.ok(hard>easy,'stricter promoter and a careless second: '+hard.toFixed(2)+' > '+easy.toFixed(2));
 console.log('PASS ejection odds follow the promoter and the second ('+easy.toFixed(2)+' vs '+hard.toFixed(2)+')');
}

// 5. Same match, same seed: same night.
{
 const once=()=>{career();n=900;const c=contract();const M=night(c,'lyra:distract',77);return JSON.stringify([M.final.stars,M.final.crowd,M.sheet.corner]);};
 assert.equal(once(),once(),'deterministic');
 console.log('PASS deterministic');
}
