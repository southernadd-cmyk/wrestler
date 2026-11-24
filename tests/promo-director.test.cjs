'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console});
const {OfficeMic:M,OfficeData:D,OfficePromoDirector:Dir,OfficeStory:{Graph}}=root;
const clone=x=>JSON.parse(JSON.stringify(x));
const rounds=new Map(),routes=new Set(),responses=new Set(),promises=new Set();
const opts={directed:true};
let count=0;
for(const [i,w] of D.ALL.entries())for(let j=0;j<12;j++){
 const f=D.FOES.filter(x=>x.id!==w.id)[j%D.FOES.filter(x=>x.id!==w.id).length],p=D.PROMOS[(i+j)%D.PROMOS.length];
 const c={id:'director-'+w.id+'-'+j,wid:w.id,rid:f.id,pid:p.id,eventAbs:j+100,slot:'main',finish:['win_clean','lose_clean','win_dirty'][j%3],minutes:12,feudHeat:j%2?60:0};
 const s=M.begin(c,w,f,null,null,p,opts);
 assert.equal(s.director.player.id,w.id);assert.equal(s.director.opponent.id,f.id);
 const visited=[];
 while(s.stage!=='done'){
  assert.ok(visited.length<4);
  const r=M.ROUNDS[s.round].id,options=M.choices(s);assert.ok(options.length);
  const want=r==='push'?['leave','press','acknowledge','hold'][j%4]:r==='close'?['vow','question','finisher','none'][j%4]:null;
  const o=options.find(x=>x.id===want)||options[(i+j+visited.length)%options.length];
  const old=s.log.length,copy=clone(s);
  M.choose(copy,o.id);M.choose(s,o.id);
  assert.equal(JSON.stringify(s),JSON.stringify(copy),'mid-scene resume must be exact');
  visited.push(r);
  assert.equal(s.director.turns.length,visited.length);
  const turn=s.director.turns.at(-1),fresh=s.log.slice(old);
  assert.equal(turn.playerLine,fresh.filter(e=>e.side==='w').at(-1)?.line||null);
  assert.equal(turn.opponentLine,fresh.filter(e=>e.side==='f').at(-1)?.line||null);
  if(r==='open'){assert.ok(s.director.subject&&s.director.claim);assert.equal(M.view(s).conversation.subject,s.director.subject);}
  for(const actor of [s.director.player,s.director.opponent])for(const k of ['irritation','composure'])assert.ok(actor[k]>=0&&actor[k]<=100);
  if(r==='answer'){routes.add(s.director.followup.reason);assert.equal(s.round,s.director.followup.follow?2:3);}
  if(r==='push')responses.add(o.id);
 }
 const result=M.result(s),base=Graph.result(s.core);
 assert.ok(result&&base&&result.conversation);
 assert.equal(JSON.stringify(result.promise),JSON.stringify(base.promise),'director cannot change the core promise');
 assert.equal(JSON.stringify(result.tactic),JSON.stringify(base.tactic),'director cannot change the core tactic');
 assert.equal(result.conversation.phase,'resolved');assert.equal(result.conversation.ending.promise,result.promise.type);
 assert.equal(M.choices(s).length,0);assert.throws(()=>M.choose(s,'leave'));
 assert.equal(visited[0],'open');assert.equal(visited[1],'answer');assert.equal(visited.at(-1),'close');
 rounds.set(visited.length,(rounds.get(visited.length)||0)+1);promises.add(result.promise.type);count++;
}
assert.ok(rounds.get(3)>0&&rounds.get(4)>0,'both short and extended scenes must occur');
for(const id of ['leave','press','acknowledge','hold'])assert.ok(responses.has(id),'directed followup reachable: '+id);
assert.ok(routes.size>=3);assert.ok(promises.size>=3);
// A disputed rivalry record must retain its original adjudication beat.
const w=D.ALL[0],f=D.FOES.find(x=>x.id!==w.id),p=D.PROMOS[0];
const c={id:'compat',wid:w.id,rid:f.id,pid:p.id,finish:'win_clean',eventAbs:1,minutes:12,slot:'mid'};
const legacy=M.begin(c,w,f,null,null,p);
assert.ok(!legacy.director);
M.choose(legacy,M.choices(legacy)[0].id);const saved=clone(legacy);
while(legacy.stage!=='done'){const id=M.choices(legacy)[0].id;M.choose(legacy,id);M.choose(saved,id);}
assert.equal(JSON.stringify(legacy),JSON.stringify(saved));assert.equal(legacy.steps.length,4);
const mouth=D.ALL.find(x=>x.id!==w.id&&x.id!==f.id);
const client=M.begin({...c,id:'mouth'},w,f,null,null,p,{directed:true,mouth});
assert.equal(client.director.client,w.id);assert.equal(client.director.player.id,mouth.id);
assert.equal(client.director.player.identity.id,mouth.id);
const disputed=M.begin({...c,id:'disputed'},w,f,null,null,p,opts);
disputed.core.case={exposed:true};
assert.equal(Dir.route(disputed.director,disputed,{id:'calm',landed:true}).follow,true);
disputed.round=2;
assert.deepEqual(Array.from(M.choices(disputed),x=>x.id),['firm','revise','leave']);
console.log('PASS director: '+count+' live scenes, lengths '+JSON.stringify(Object.fromEntries(rounds))+'; '+routes.size+' route reasons; '+responses.size+' followups; promises, mouthpiece identity, save parity and disputed case guard preserved.');
