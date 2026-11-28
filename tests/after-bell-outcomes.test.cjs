'use strict';
// After the bell: every option's tags come from one outcome model (the real odds and what each outcome does),
// the resolvers apply exactly one of those outcomes, repeats build less, and no option is the go-to.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeTerritory:T,OfficeAfter:A,OfficeBonds:B}=root;
const fin=(o={})=>({stars:3.5,crowd:66,crowdPeak:72,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:15,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[],...o});
let n=0;
// A scene at the angle choice, with values away from the 0/100 clamps so deltas are exact.
function scene(o={}){
 G.fresh();const s=G.S;s.cash=99999;s.rep=50;const wid=o.wid||'rex';G.sign(wid);s.inbox=[];s.offers=[];
 const pid=o.pid||'dock',div=D.divisionOf(wid),pool=T.opponents(pid,'mid',div),rid=o.rid||pool[(o.foe||0)%pool.length].id;
 if(!s.territory.cards[pid][wid])s.territory.cards[pid][wid]={score:40,matches:2,wins:1};
 s.feuds[wid+':'+rid]={wid,rid,heat:o.heat??40,matches:1,closed:false,since:1};
 G.P(pid).trust=50;const w=G.W(wid);w.morale=50;w.heat=50;
 if(o.log)s.after={done:{},calls:[],log:o.log.map((plan,i)=>({cid:'old-'+i,wid,plan:plan.plan||plan,said:plan.said||null}))};
 const c={id:'abo-'+(n++),pid,rid,wid,slot:'mid',minutes:12,finish:o.finish||'win_clean',purse:200,eventAbs:G.abs()};s.card.push(c);
 const f=fin(o.fin);G.applyResult(c,f);
 // Applying the result moves heat and morale; measure the scene from here.
 return {s,c,f,st:A.begin(c,f,null),wid,rid,pid};
}
const snap=(x,rid=x.rid)=>({feud:(G.feud(x.wid,rid)?.heat)||0,heat:G.W(x.wid).heat,morale:G.W(x.wid).morale,trust:G.P(x.pid).trust,rep:x.s.rep,cash:x.s.cash,bond:B?.score?.(x.wid,x.rid)||0});
const delta=(a,b)=>Object.fromEntries(Object.keys(a).map(k=>[k,b[k]-a[k]]));
const matches=(d,fx)=>['feud','heat','morale','trust','rep','cash','bond'].every(k=>(d[k]||0)===(fx[k]||0));

// 1. The resolver applies exactly one of the outcomes the tags describe: angles, then the microphone.
{
 let checked=0;const seenBoth={};
 for(const pid of ['dock','crown'])for(const finish of ['win_clean','lose_clean','win_dirty'])for(const stars of [1.5,3.5])for(const foe of [0,1,2]){
  for(const plan of ['none','handshake','staredown','beatdown','celebrate']){
   const x=scene({pid,finish,foe,fin:{stars,crowd:stars>=3?66:48}});if(x.st.stage!=='angle')continue;
   const opt=A.angleOptions(x.st).find(o=>o.id===plan);if(!opt)continue;
   const model=A.outcomes(x.st,'angle',plan),before=snap(x);
   assert.ok(A.choose(x.st,plan));
   const d=delta(before,snap(x)),hit=model.outs.findIndex(o=>o.p>0&&matches(d,o.fx));
   assert.ok(hit>=0,`${plan} ${pid} ${finish} ${stars}★ applied ${JSON.stringify(d)}; model ${JSON.stringify(model.outs.map(o=>o.fx))}`);
   (seenBoth[plan]??=new Set()).add(hit);checked++;
  }
  // The microphone, after a quiet angle: every option on its own fresh copy of the scene.
  const probe=scene({pid,finish,foe,fin:{stars,crowd:66}});if(probe.st.stage!=='angle')continue;A.choose(probe.st,'none');
  for(const opt of A.micOptions(probe.st)){
   const x=scene({pid,finish,foe,fin:{stars,crowd:66}});A.choose(x.st,'none');
   // A callout heats the feud with the person called out, not tonight's opponent.
   const rid=opt.id.startsWith('call:')?opt.id.slice(5):x.rid;
   const model=A.outcomes(x.st,'mic',opt.id),before=snap(x,rid);
   assert.ok(A.speak(x.st,opt.id),opt.id);
   const d=delta(before,snap(x,rid)),hit=model.outs.findIndex(o=>o.p>0&&matches(d,o.fx));
   // Moving up the card changes the card score, not these numbers; the rest must match exactly.
   assert.ok(hit>=0,`mic ${opt.id} applied ${JSON.stringify(d)}; model ${JSON.stringify(model.outs.map(o=>o.fx))}`);
   checked++;
  }
 }
 assert.equal(seenBoth.handshake.size,2,'both handshake outcomes happen');assert.equal(seenBoth.beatdown.size,2,'both attack outcomes happen');
 console.log('PASS the resolver applies one of the modelled outcomes in '+checked+' scenes');
}

// 2. Tags say the odds and both sides of each outcome.
{
 const x=scene({pid:'crown'});const opts=A.angleOptions(x.st),get=id=>opts.find(o=>o.id===id).tags;
 assert.match(get('handshake')[0],/^Odds they shake: (likely|even chance|long shot)$/);
 assert.ok(get('handshake').includes('Feud heat ▼ or ▲▲'),'a handshake cools the feud, or heats it if refused: '+get('handshake'));
 assert.match(get('beatdown')[0],/^Odds they were told: /);assert.ok(get('beatdown').includes('Risk: £100 fine'));
 assert.ok(get('beatdown').includes('Promoter ▼▼'),'a traditional promoter hates it either way: '+get('beatdown'));
 assert.deepEqual([...get('none')],['Safe']);
 const dock=scene({pid:'dock'});assert.ok(A.angleOptions(dock.st).find(o=>o.id==='beatdown').tags.includes('Promoter ▲ or ▼▼'),'an aggressive promoter likes it if it is worked');
 // The stare-down needs a match worth staring about.
 const flat=scene({fin:{stars:1.5,crowd:48}}),good=scene({fin:{stars:3.5}});
 const sd=st=>A.angleOptions(st).find(o=>o.id==='staredown').tags;
 assert.ok(sd(good.st).includes('Feud heat ▲▲')&&sd(flat.st).includes('Feud heat ▲'),'a good match makes the stare-down count: '+sd(good.st)+' / '+sd(flat.st));
 // A lap of honour needs a hot crowd.
 const hot=scene({fin:{stars:3.5,crowd:70}}),cold=scene({fin:{stars:2,crowd:45}});
 const lap=st=>A.angleOptions(st).find(o=>o.id==='celebrate')?.tags||[];
 assert.ok(lap(hot.st).includes('Heat ▲'),'hot: '+lap(hot.st));assert.ok(!lap(cold.st).some(t=>t.startsWith('Heat')),'cold: '+lap(cold.st));
 // The microphone: a callout says what it can bring.
 A.choose(x.st,'none');const mic=A.micOptions(x.st);
 const call=mic.find(o=>o.id.startsWith('call:'));if(call)assert.ok(call.tags.some(t=>/offer/.test(t))&&/^Odds it lands/.test(call.tags[0]),call.tags);
 assert.ok(mic.find(o=>o.id==='credit').tags.includes('Promoter ▲'),'old-school promoters like credit');
 for(const o of [...opts,...mic])assert.doesNotMatch(o.label+o.hint+o.tags.join(),/undefined|NaN|null|\{\w\}/);
 console.log('PASS after-the-bell tags show the odds and both sides of every outcome');
}

// 3. The odds follow the situation.
{
 const odds=(x,id)=>A.outcomes(x.st,'angle',id).outs[0].p;
 const clean=scene({finish:'win_clean'}),dirty=scene({finish:'win_dirty'});
 assert.ok(odds(clean,'handshake')>odds(dirty,'handshake')+.2,'nobody shakes a cheat’s hand');
 const foes=[0,1,2].map(foe=>scene({foe})),pros=foes.map(x=>G.F(x.rid).pro),ps=foes.map(x=>odds(x,'beatdown'));
 const hi=pros.indexOf(Math.max(...pros)),lo=pros.indexOf(Math.min(...pros));
 if(pros[hi]!==pros[lo])assert.ok(ps[hi]>ps[lo],'a professional opponent is more likely to be in on it');
 console.log('PASS handshake and attack odds follow the finish and the opponent');
}

// 4. Repeats build less, and the tag says so.
{
 const fresh=scene(),freshFeud=A.outcomes(fresh.st,'angle','beatdown').outs[0].fx.feud,tired=scene({log:['beatdown','staredown','beatdown']});
 const t=A.angleOptions(tired.st).find(o=>o.id==='beatdown');
 assert.ok(t.tags.includes('Seen it lately ▼▼'),t.tags);assert.match(t.hint,/2 times in their last 3 nights/);
 assert.equal(A.outcomes(tired.st,'angle','beatdown').outs[0].fx.feud,6,'two repeats halve the feud heat a worked attack builds');
 assert.equal(freshFeud,12);
 assert.ok(!A.angleOptions(tired.st).find(o=>o.id==='handshake').tags.some(x=>/Seen it/.test(x)),'a fresh choice is fresh');
 const other=scene({log:[{plan:'beatdown'},{plan:'beatdown'}]});G.S.after.log.forEach(e=>e.wid='mara');
 assert.ok(!A.angleOptions(other.st).find(o=>o.id==='beatdown').tags.some(x=>/Seen it/.test(x)),'only this wrestler’s nights count');
 // And the resolver applies the same reduction.
 const worked=scene({log:['beatdown','beatdown']}),b=snap(worked);A.choose(worked.st,'beatdown');
 const d=delta(b,snap(worked));if(worked.st.angle.ok)assert.equal(d.feud,6);
 console.log('PASS repeating an angle builds less, on the tag and in the save');
}

// 5. Balance: no option is the go-to, at the angle or the microphone.
{
 const W={feud:.4,heat:1,bond:.05,morale:1,trust:1.5,rep:2,cash:.02},OFFER={match:4,title:8,card:3};
 const val=fx=>Object.entries(W).reduce((s,[k,w])=>s+w*(fx[k]||0),0)+(OFFER[fx.offer]||0);
 const ev=m=>m.outs.reduce((s,o)=>s+o.p*val(o.fx),0);
 const wins={angle:{},mic:{}};let total=0;
 for(const wid of ['rex','mara','brick','juno'])for(const pid of ['dock','pulse','crown','union'])for(const finish of ['win_clean','lose_clean','win_dirty'])for(const stars of [1.5,3.5]){
  const x=scene({wid,pid,finish,fin:{stars,crowd:stars>=3?66:48},foe:total%3});if(x.st.stage!=='angle')continue;total++;
  const best=(stage,opts)=>opts.map(o=>[o.id.startsWith('call:')?'callout':o.id,ev(A.outcomes(x.st,stage,o.id))]).sort((a,b)=>b[1]-a[1])[0][0];
  const a=best('angle',A.angleOptions(x.st));wins.angle[a]=(wins.angle[a]||0)+1;
  A.choose(x.st,'none');if(x.st.stage!=='mic')continue;
  const m=best('mic',A.micOptions(x.st));wins.mic[m]=(wins.mic[m]||0)+1;
 }
 for(const stage of ['angle','mic']){
  const sum=Object.values(wins[stage]).reduce((a,b)=>a+b,0),report=JSON.stringify(wins[stage]);
  for(const [id,k] of Object.entries(wins[stage]))assert.ok(k/sum<=.45,stage+': '+id+' is the go-to '+report);
  assert.ok(Object.keys(wins[stage]).length>=4,stage+': several options are best somewhere '+report);
 }
 console.log('PASS no after-the-bell option is the go-to over '+total+' scenes: angle '+JSON.stringify(wins.angle)+', mic '+JSON.stringify(wins.mic));
}
