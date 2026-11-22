'use strict';
// v0.3.22 stipulations: asked for in negotiation, carried onto the contract, and played by the rules.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeMatch:MX,OfficeStips:X,OfficeRivalry:Riv}=root;
assert.ok(X&&X.STIPS&&X.chance,'stipulations are installed');
const clean=/undefined|NaN|\{\w+\}|\[object|the the /;
let n=0;
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=55;G.sign('rex');s.inbox=[];s.focus=9;return s;}
function offer(o={}){const s=G.S,x={id:'so-'+(n++),pid:'dock',rid:'silas',slot:'main',finish:'win_clean',wid:null,tag:null,boost:1,haggled:false,eventAbs:G.abs(),expiresAbs:G.abs(),...o};s.offers.unshift(x);return x;}

// 1. Each booker has a favourite, and dislikes the opposite.
{
 const fav=pid=>X.favourite(G.P(pid));career();
 assert.equal(fav('dock'),'nodq');assert.equal(fav('pulse'),'anywhere');assert.equal(fav('crown'),'falls');assert.equal(fav('union'),'submission');
 assert.ok(X.tasteOf(G.P('crown'),'nodq')<0,'North Crown will not have chairs on a family show');
 console.log('PASS each booker has their own taste');
}

// 2. Asking costs a meeting; a strong case gets it, a weak one may get the booker's favourite instead.
{
 let agreed=0,counter=0,refused=0;
 for(const [pid,kind,trust,heat] of [['dock','nodq',80,70],['crown','nodq',20,10],['union','anywhere',30,30],['crown','falls',70,40],['pulse','submission',40,20],['dock','submission',45,30],['crown','anywhere',60,55]]){
  const s=career();G.P(pid).trust=trust;G.W('rex').heat=heat;
  const o=offer({pid});const f0=s.focus;
  assert.ok(!G.talkMove(o.id,'rex','ask:stip:'+kind).error);
  assert.equal(s.focus,f0-1,'a meeting is used');
  const r=G.talkMove(o.id,'rex','arg:crowd');assert.ok(!r.error,r.error);
  const t=o.talk;
  assert.ok(['offer','counter','challenge'].includes(t.step),'initial promoter response should remain actionable');
  assert.equal(o.stip,null,'proposed stipulation is not yet agreed');
  if(t.step==='offer'){agreed++;assert.equal(t.proposal.stip,kind);}
  else if(t.step==='counter'){counter++;assert.equal(t.proposal.stip,X.favourite(G.P(pid)));assert.notEqual(t.proposal.stip,kind);}
  else refused++;
  assert.ok(t.log.every(l=>!clean.test(l.text)));
  if(t.proposal){
   assert.ok(!G.talkMove(o.id,'rex','reply:accept').error,'accept the promoter reply');
   assert.equal(o.stip,t.proposal.stip,'accepted terms become the live offer');
   assert.equal(t.step,'done');
   assert.ok(!G.talkMove(o.id,'rex','revert').error);
   assert.equal(o.stip,null,'taking the original terms drops it');
  }
 }
 assert.ok(agreed>=1&&counter>=1&&refused>=1,`varied answers: ${agreed} agreed, ${counter} countered, ${refused} refused`);
 const s=career();const o=offer({programme:{}});assert.match(G.talkMove(o.id,'rex','ask:stip:nodq').error||'',/programme/i);
 console.log(`PASS negotiation: ${agreed} agreed, ${counter} countered, ${refused} refused`);
}

// 3. A feud and a big slot make the case; an opener does not.
{
 career();const w=G.W('rex');
 const a=offer({slot:'opener'}),b=offer({slot:'main'});
 const k=G.S.feuds['rex:silas']={wid:'rex',rid:'silas',heat:0,matches:1,closed:false,since:1};
 const cold=X.chance(a,w,'nodq','crowd').need;k.heat=80;const hot=X.chance(b,w,'nodq','crowd').need;
 assert.ok(hot<cold-20,'need falls with heat and billing: '+cold+' → '+hot);
 console.log('PASS heat and billing make the case ('+cold+' → '+hot+')');
}

// 4. Signing carries it onto the contract; two out of three falls runs longer.
{
 career();const o=offer({stip:'falls'});const mins=D.SLOTS.main.mins;
 assert.equal(G.book(o.id,'rex'),null);
 const c=G.S.card.find(x=>x.rid==='silas');assert.equal(c.stip,'falls');assert.equal(c.minutes,mins+5);
 console.log('PASS the stipulation is signed onto the contract');
}

// 5. Blow-offs come with the promoter's favourite, usually.
{
 const s=career();let with_=0,total=0;
 for(let i=0;i<30;i++){s.offers=[];const o=offer({tag:'Blow-off',eventAbs:G.abs()+5,expiresAbs:G.abs()+5,id:'bo-'+i});delete o.stip;s.card=[];G.endWeek();
  const x=s.offers.find(y=>y.id==='bo-'+i);if(!x)continue;total++;if(x.stip){with_++;assert.equal(x.stip,X.favourite(G.P(x.pid)));}else assert.equal(x.stip,null);}
 assert.ok(total>=20&&with_>total*.4&&with_<total,'most blow-offs get one: '+with_+'/'+total);
 console.log('PASS blow-offs get the promoter’s favourite ('+with_+'/'+total+')');
}

// 6. Every stipulation, every booked finish: the match has its moments and finishes by the rules.
{
 const run=o=>{const m=MX.create(o);for(let i=0;i<12000&&!m.done;i++){if(m.decision&&!m.queue.length)MX.resolve(m,m.decision.options[0].id);MX.next(m);}assert.ok(m.done);return m;};
 career();const w=G.W('rex'),f=G.F('silas'),p=G.P('dock');
 let played=0;
 for(const stip of Object.keys(X.STIPS))for(const finish of ['win_clean','win_dirty','lose_protected','lose_clean'])for(let seed=1;seed<=3;seed++){
  const M=run({w:{...w},f,p,slot:'main',minutes:stip==='falls'?20:15,finish,stip,feudHeat:50,plan:{game:'brawl',leash:'script',talk:'none'},seed:seed*97+n++});
  if(M.final.outcome!=='booked')continue;played++;
  const text=M.log.map(l=>l.text).join('\n');assert.doesNotMatch(text,clean,stip+' '+finish);
  assert.match(text,new RegExp(X.STIPS[stip].announce.slice(0,20)),'announced');
  assert.equal(M.stip,stip);
  assert.ok(M.stipSpots.every(s=>s.done),'every stipulation moment happened: '+stip+' '+finish);
  const end=M.log.filter(l=>l.kind==='bell').pop().text;
  const winner=finish.startsWith('win')?w:f;
  if(stip==='falls'){assert.equal(M.stipScore.w+M.stipScore.f,3,'the deciding pin counts as the third fall');assert.equal(M.stipScore[finish.startsWith('win')?'w':'f'],2,'the winner has two falls');assert.match(text,/Final falls: [12]–[12]/);}
  else{
   assert.equal(M.final.finishRoute,X.FINISH[stip][finish][0],'the rivalry reads a route with the same meaning');
   assert.ok(end.includes(winner.short)||end.includes(winner.name),'the booked winner wins: '+end);
   if(stip==='submission'){
    const live=M.log.filter(l=>l.kind!=='story'||l.text!==X.STIPS.submission.announce).filter(l=>l.kind!=='bell');
    assert.doesNotMatch(live.map(l=>l.text).join('\n'),
     /\b(?:cover|cradle|backslide|roll[- ]?up|pinfall|kicks? out|shoulder up|near.?fall)\b|ONE! TWO!/i,
     'submission-only cannot narrate any live pin or nearfall');
    assert.ok(!M.graph.events.some(e=>/^(cover|early_cover|near_kickout|counter_rollup|scheduled_nearfall)$/.test(e.id)),
     'submission-only cannot enter a pin graph node');
    assert.equal(M.nearfalls,0,'a submission escape is not a statistical pin nearfall');
   }
   if(['nodq','submission','anywhere'].includes(stip)){
    assert.doesNotMatch(M.log.map(l=>l.text).join('\n'),
     /referee (?:is up to six|has reached six|reaches eight|begins the count|starts counting|is still counting)|before the referee reaches ten|beat the referee.s count|count is broken/i,
     stip+' cannot narrate a normal countout');
   }
  }
 }
 assert.ok(played>=40,'played '+played);
 console.log('PASS every stipulation and finish plays by the rules ('+played+' matches)');
}

// 6b. Falls Count Anywhere also has no DQ, and real near-falls may happen on the floor.
{
 career();
 const o=offer({finish:'win_dq'});
 assert.match(G.talkMove(o.id,'rex','ask:stip:anywhere').error||'',/disqualification/i,
  'a DQ finish cannot be agreed for Falls Count Anywhere');
 const w=G.W('rex'),f=G.F('silas'),p=G.P('pulse');
 const M=MX.create({w:{...w},f,p,slot:'main',minutes:14,finish:'win_clean',
  stip:'anywhere',plan:{game:'brawl',leash:'free',talk:'fire'},seed:43890});
 M.stage='live';M.t=Math.floor(M.len*.81);M.story.position='outside';M.story.control='w';
 const n=M.nearfalls;
 MX.GRAPH.nearfall(M);
 assert.equal(M.nearfalls,n+1);
 assert.equal(M.story.position,'outside','the nearfall took place and counted outside');
 assert.match(M.log.map(x=>x.text).join(' '),/hooks .* leg on the floor/);
 for(let i=0;i<80;i++){
  const m=MX.create({w:{...w,pro:20},f,p,slot:'main',minutes:12,
   finish:'win_clean',stip:'anywhere',plan:{game:'brawl',leash:'free',talk:'fire'},seed:8000+i});
  for(let n=0;n<12000&&!m.done;n++){if(m.decision&&!m.queue.length)MX.resolve(m,m.decision.options[0].id);MX.next(m);}
  assert.ok(m.done);
  assert.equal(m.outcome==='dq',false,'no DQ in Falls Count Anywhere');
  assert.equal(m.ref,undefined,'no disciplinary warnings in Falls Count Anywhere');
 }
}
console.log('PASS Falls Count Anywhere: pinfalls on the floor, no count-outs or disqualifications');

// 7. Afterwards: extra fatigue, the feud turned up, once.
{
 const s=career();const o=offer({stip:'nodq'});G.book(o.id,'rex');const c=s.card[0];
 s.feuds['rex:silas']={wid:'rex',rid:'silas',heat:30,matches:1,closed:false,since:1};
 const fat=G.W('rex').fatigue;
 const out=G.applyResult(c,{stars:3,crowd:60,crowdPeak:70,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:15,plan:'brawl',stamina:40,injury:0,ignored:0,callsUsed:[],log:[]});
 assert.ok(out.some(x=>/No disqualification: Titan fatigue \+6/.test(x.text)),'fatigue noted');
 assert.ok(out.some(x=>/turned the feud up/.test(x.text)),'feud noted');
 assert.equal(s.history[0].stip,'nodq','history remembers it');
 assert.ok(G.W('rex').fatigue>fat+6,'more tired than a normal match');
 console.log('PASS the body pays and the feud remembers');
}

// 8. With disqualifications in the game: No DQ means nobody is thrown out, and cannot be booked to end in one.
{
 const run=o=>{const m=MX.create(o);for(let i=0;i<12000&&!m.done;i++){if(m.decision&&!m.queue.length)MX.resolve(m,m.decision.options[0].id);MX.next(m);}return m;};
 career();const o=offer({finish:'win_dq'});
 assert.match(G.talkMove(o.id,'rex','ask:stip:nodq').error||'',/disqualification/);
 const w=G.W('rex'),f=G.F('silas');let warned=0,dq=0;
 for(let i=0;i<80;i++){const M=run({w:{...w,pro:20},f,p:G.P('crown'),slot:'main',minutes:12,finish:'win_clean',stip:'nodq',plan:{game:'brawl',leash:'free',talk:'fire'},seed:5000+i});if(M.ref)warned++;if(M.outcome==='dq')dq++;}
 assert.equal(warned+dq,0,'nobody is warned or thrown out in a no DQ match');
 // A booked DQ in two out of three falls still comes after a fall each.
 const M=run({w,f,p:G.P('crown'),slot:'main',minutes:20,finish:'win_dq',stip:'falls',feudHeat:40,plan:{game:'story',leash:'script',talk:'none'},seed:61});
 if(M.outcome==='booked'){assert.equal(M.stipScore.w+M.stipScore.f,3,'a DQ finish can decide the third fall');assert.equal(M.stipScore.w,2,'the booked DQ winner takes the deciding fall');assert.equal(M.graph?.outcome?.id,'win_dq','booked DQ outcome remains contracted');assert.match(M.final?.finishRoute||'',/^dq_/,'two-falls DQ must use a DQ finish route');assert.match(M.log.map(l=>l.text).join(' '),/disqualif(?:ied|ication)/i,'DQ must be explicit in commentary; route '+M.final?.finishRoute);}
 // A run-in is legal in a no DQ match, whatever the finish.
 G.sign('lyra');const c={id:'nd-1',pid:'dock',rid:'silas',wid:'rex',slot:'main',minutes:12,finish:'lose_clean',stip:'nodq',feudHeat:10,eventAbs:G.abs()};
 assert.ok(root.OfficeRingside.seconds(c,G.W('rex'),f).find(x=>x.id==='lyra').jobs.includes('runin'),'a run-in is on the table');
 console.log('PASS no DQ means no disqualifications, and cannot end in one');
}

