'use strict';
// The Office v3.3: 10x move catalog — structure, physical realism and determinism.
// Run: node tests/catalog.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const {script:inline}=require('./_source.cjs');
const cut=inline.indexOf('/* THE OFFICE — interface v3');
function load(){
 const store=new Map(),root={addEventListener(){}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 vm.runInNewContext(inline.slice(0,cut),{window:root,localStorage,console,Date,Math,JSON},{filename:'office-engine.js'});
 return root;
}
const root=load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A,CAT=G.CATALOG;

// 1. Size and structural validity: at least ten times the v3.2 graph (96 nodes, 297 edges).
const v=G.validate();
assert.equal(v.errors.length,0,'catalog validates: '+v.errors.slice(0,5).join('; '));
assert.ok(v.nodes>=960,'at least 10x the 96 v3.2 action nodes, got '+v.nodes);
assert.ok(v.edges>=2970,'at least 10x the 297 v3.2 edges, got '+v.edges);
assert.ok(v.families>=20&&v.moves>=330,'authored move families');
for(const [id,n] of Object.entries(A)){
 for(const [to,w] of n.next){assert.ok(A[to],id+' -> '+to);assert.ok(w>0&&Number.isFinite(w),'positive weight '+id+' -> '+to);}
 assert.ok(n.lines.every(t=>t&&!/\{name\}|undefined/.test(t)),'every line is filled: '+id);
 if(n.counterOf)assert.ok(n.reverse,'a reversal changes control: '+id);
 if(n.family&&!n.counterOf&&!n.blockOf&&n.lift!==null)assert.ok(n.lift>=0&&n.lift<=40,'credible lift margin '+id);
}

// 2. Deterministic construction: two independent loads build byte-identical graphs.
const again=load().OfficeMatch.GRAPH.A;
assert.equal(JSON.stringify(again),JSON.stringify(A),'graph construction is deterministic');

// 3. Every node is reachable by following authored edges from the story-arc entry points.
const seen=new Set(),queue=[];
// Entry points the engine itself uses: arc entries, style openers, wrestler preferences,
// the breather, and the positional hubs each arc invites (whip to the corner, headlock, climb).
const seeds=[...Object.values(G.ARCS).flatMap(a=>a.entry),...Object.values(G.STYLE_BEATS).flatMap(s=>s.open),
 ...Object.values(D.PROFILES).flatMap(p=>p.preferred),'catch_breath','corner_whip','corner_push','headlock','top_follow'];
for(const id of seeds)if(A[id]&&!seen.has(id)){seen.add(id);queue.push(id);}
while(queue.length){const id=queue.shift();for(const [to] of A[id].next)if(!seen.has(to)){seen.add(to);queue.push(to);}}
const orphan=Object.keys(A).filter(id=>!seen.has(id));
assert.deepEqual(orphan,[],'all nodes reachable through the graph');

// 4. Every node is physically performable by at least one real pairing at a legal moment.
const pairs=[];for(const w of D.TALENT)for(const f of D.FOES)pairs.push([w,f]);
function probe(id){
 const n=A[id];
 for(const [w,f] of pairs)for(const control of ['w','f']){
  const x=M.create({w:{...w,flags:{},fatigue:0},f,p:D.PROMOS[0],slot:'main',minutes:D.SLOTS.main.mins,finish:'win_clean',
   plan:{game:'story',leash:'script',talk:'calm'},preparation:{},flags:{},seed:7});
  x.t=Math.ceil(x.len*Math.min(.97,Math.max(.62,n.after+.02)));x.wSt=100;x.fSt=100;
  const s=x.story||(x.story={});Object.assign(s,{position:n.requires==='any'?'standing':n.requires,control,down:n.requires==='mat'?(control==='w'?'f':'w'):null});
  const parent=n.counterOf||n.blockOf;
  // This reachability probe must establish an actual allowed grip for all
  // expanded Phase 2 parents before testing an exact generated defence.
  const source=parent||id,grip=G.PHYSICAL_GRIP_MOVES[source];
  if(grip){
   x.graph.physical={v:1,locations:{w:'ring',f:'ring'},area:'ring',topSide:null,
    grip:{type:grip,side:control,at:x.t,source:Object.keys(G.GRIP_ENTRY).find(k=>G.GRIP_ENTRY[k]===grip)||'reviewed-setup'}};
  }
  const aerialParent=A[parent]&&['aerial','springboard'].includes(A[parent].family);
  const grappleParent=G.GRAPPLE_PILOT.includes(parent)||G.SUPERPLEX_PILOT.includes(parent);
  if(grappleParent){
   // Phase 7: the existing reversal requires a live, exact parent commitment.
   // The attack's own requirements and timing must also be achievable.
   x.stage='live';
   x.t=Math.ceil(x.len*Math.min(.97,Math.max(.62,n.after+.02,A[parent].after+.02)));
   if(x.graph.physical?.grip)x.graph.physical.grip.at=x.t;
   if(!G.startGrapple(x,parent))continue;
   assert.equal(x.graph.pendingGrapple.id,parent);
  }
  if(aerialParent){
   // Phase 6: a generated move-specific aerial counter/block is physically
   // reachable *during the named parent attempt*, not as a free-floating move.
   // Keep the original reachability assertion without granting impossible
   // top-rope reversals with no committed attack.
   s.position='top';s.down=control==='w'?'f':'w';
   // Some advanced dives are only available after 70-75% of a match. Their
   // generated block nodes have no independent after threshold, so probe
   // at the *parent attack's* legal time rather than an invented early dive.
   x.t=Math.ceil(x.len*Math.min(.97,Math.max(.62,n.after+.02,A[parent].after+.02)));
   if(!G.startAerial(x,parent))continue;
   assert.equal(x.graph.pendingAerial.id,parent);
  }
  if(G.isValid(x,id))return true;
 }
 return false;
}
const impossible=Object.keys(A).filter(id=>!probe(id));
assert.deepEqual(impossible,[],'every move can legally happen for some pairing');

// 5. Played matches: wide coverage, physical guards, timing, limb psychology, plan and style identity.
function options(i){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*5)%D.FOES.length]; // This stride visits every opponent.
 const plan=['story','technical','brawl','spots','safe'][i%5],finish=['win_clean','win_dirty','lose_protected','lose_clean'][Math.floor(i/5)%4];
 const slot=['opener','mid','feature','main'][Math.floor(i/20)%4];
 return {w:{...w,flags:{},fatigue:i%27},f,p:D.PROMOS[i%D.PROMOS.length],slot,minutes:D.SLOTS[slot].mins,finish,
  plan:{game:plan,leash:'script',talk:'calm'},preparation:{},flags:{},feudHeat:i%8*9,seed:5101+i*37};
}
function work(x){for(let i=0;i<9000&&!x.done;i++){if(x.decision&&!x.queue.length){const o=x.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||x.decision.options[0];M.resolve(x,o.id);}M.next(x);}assert.ok(x.done);return x;}
const kg=w=>D.PROFILES[w.id]?.kg||85;
const sigUse={own:0,ownEvents:0,other:0,otherEvents:0},sigSeen=new Set(),sigCalls=new Set(),routes=new Set(),reached=new Set(),risk={safe:[0,0],spots:[0,0]},limb={on:0,off:0},styleUse={};
let catalogEvents=0,events=0;
// Conditional counter/block nodes cannot legally run as free-standing moves.
// Count their outcomes separately rather than demanding arbitrary appearances.
const linkedDefences={checked:0,invalid:0},grappleOutcomes={};
const N=1000;let dqCalled=0;
for(let i=0;i<N;i++){
 const o=options(i),x=work(M.create(o)),g=x.graph;
 assert.equal(g.outcome.id,x.outcome==='nc'?'nc':x.outcome==='double'?'double':x.outcome==='dq'?'dq':o.finish,'contract still decides the finish, unless the referee throws it out');
 if(x.outcome==='dq')dqCalled++;
 assert.doesNotMatch(x.log.map(l=>l.text).join(' '),/undefined|NaN|\{(?:A|D|W|F|part|name)\}/);
 if(risk[o.plan.game])risk[o.plan.game][1]++;
 if(x.log.some(l=>/nobody on this circuit does it quite like/.test(l.text)))sigCalls.add(i);
 if(x.final.finishRoute&&x.outcome!=='dq'){routes.add(o.finish+'.'+x.final.finishRoute);assert.ok(M.FINISH_ROUTES[o.finish].some(r=>r.id===x.final.finishRoute),'route belongs to the booked finish');}
 for(const e of g.events){
  const n=A[e.id];if(!n)continue;events++;reached.add(e.id);
  const parent=n.counterOf||n.blockOf;
  if(parent&&(G.GRAPPLE_PILOT.includes(parent)||G.SUPERPLEX_PILOT.includes(parent))){
   linkedDefences.checked++;
   const ledger=g.grappleAttempts?.find(a=>a.seq===e.grappleAttemptSeq);
   const outcome=n.counterOf?'counter':'block';
   if(!ledger||ledger.id!==parent||e.attemptedMove!==parent||
      e.grappleResolution!==outcome||ledger.outcome!==outcome||ledger.actionId!==e.id)
    linkedDefences.invalid++;
  }
  if(!n.family)continue;catalogEvents++;
  assert.ok(e.t/x.len>=n.after-1e-9,e.id+' happened before it is credible ('+(e.t/x.len).toFixed(2)+' < '+n.after+')');
  const att=e.preControl==='w'?x.w:x.f,def=e.preControl==='w'?x.f:x.w;
  if(n.agile&&!n.counterOf&&!n.blockOf)assert.ok(kg(att)<110,e.id+' is not in a '+kg(att)+' kg wrestler’s toolkit');
  if(n.lift!==null&&!n.counterOf&&!n.blockOf)assert.ok(kg(def)<=kg(att)+Math.max(-5,((att.ring||60)-60)*.23)+n.lift,e.id+' lifted an impossible weight');
  if(n.risk&&!n.counterOf&&!n.blockOf&&risk[o.plan.game])risk[o.plan.game][0]++;
  if(n.part&&!n.counterOf&&!n.blockOf&&['control','denial'].includes(e.arc)){
   const want=G.PART_OF[g.targets?.[e.preControl==='w'?'f':'w']];
   if(want)limb[n.part===want?'on':'off']++;
  }
  if(!n.counterOf&&!n.blockOf){
   // Signature moves: how often the owner uses their four, against how often anyone else uses those same four.
   const mine=D.PROFILES[att.id]?.signature||[],theirs=D.PROFILES[def.id]?.signature||[];
   sigUse.ownEvents++;if(mine.includes(e.id)){sigUse.own++;sigSeen.add(att.id+':'+e.id);}
   sigUse.otherEvents++;if(theirs.includes(e.id))sigUse.other++;
  }
  if(!n.counterOf&&!n.blockOf){const st=att.style;styleUse[st]??={};styleUse[st][n.family]=(styleUse[st][n.family]||0)+1;}
 }
 for(const attempt of g.grappleAttempts||[])
  grappleOutcomes[attempt.outcome]=(grappleOutcomes[attempt.outcome]||0)+1;
}
const total=Object.keys(A).length,coverage=reached.size/total;
const independent=Object.keys(A).filter(id=>!A[id].counterOf&&!A[id].blockOf);
const reachedIndependent=independent.filter(id=>reached.has(id));
const independentCoverage=reachedIndependent.length/independent.length;
// v0.4 Phase 2: compare like with like. A generated defence now *requires*
// the exact pending parent attempt; the previous all-node 90% coverage metric
// incentivised impossible free-floating counters. This 95% independent-action
// gate is stricter than the former 90% bar for moves that can be selected.
assert.ok(independentCoverage>=.95,
 'at least 95% of independent actions appear in '+N+' ordinary matches, got '+
 (independentCoverage*100).toFixed(1)+'% ('+reachedIndependent.length+'/'+independent.length+')');
assert.equal(linkedDefences.invalid,0,'every generated grapple counter/block traces to an exact committed parent');
assert.ok(linkedDefences.checked>=10,'grapple defence outcomes occur organically in ordinary matches');
assert.ok(Object.keys(grappleOutcomes).some(outcome=>outcome==='landed'),
 'named grapples actually land in played matches');
console.log('Phase 2 coverage: all graph nodes '+(coverage*100).toFixed(1)+'% (diagnostic), '+
 'independent actions '+(independentCoverage*100).toFixed(1)+'%, '+
 linkedDefences.checked+' attributed grapple defences');
assert.ok(catalogEvents/events>=.25,'the new vocabulary is a large share of real match action: '+(catalogEvents/events*100).toFixed(1)+'%');
assert.ok(limb.on>limb.off,'heat segments mostly work the targeted body part ('+limb.on+' on / '+limb.off+' off)');
assert.ok(risk.spots[0]/risk.spots[1]>2*risk.safe[0]/risk.safe[1],'"Keep it safe" suppresses high-risk spots relative to a spot-fest: '+JSON.stringify(risk));
const share=(st,fam)=>{const u=styleUse[st]||{},t=Object.values(u).reduce((a,b)=>a+b,0);return (u[fam]||0)/Math.max(1,t);};
assert.ok(share('Technical','submission')>share('Spectacle','submission'),'technical wrestlers favour submissions');
assert.ok(share('Spectacle','aerial')+share('Spectacle','lucha')>share('Technical','aerial')+share('Technical','lucha'),'spectacle wrestlers favour aerial and lucha moves');
assert.ok(share('Brawl','heel')+share('Brawl','outside')>share('Technical','heel')+share('Technical','outside'),'brawlers favour rough and ringside work');

// Signature moves: real catalog moves, legal for their owner, and visibly part of who they are.
const legacyIds=new Set([...D.TALENT,...D.FOES].map(w=>w.id));
const owners=Object.entries(D.PROFILES).filter(([id])=>legacyIds.has(id));
assert.equal(owners.length,D.TALENT.length+D.FOES.length);
for(const [wid,prof] of owners){
 assert.equal(prof.signature.length,4,wid+' has four signature moves');
 for(const id of prof.signature){
  assert.ok(A[id]?.name&&!A[id].counterOf&&!A[id].blockOf,wid+' signature is a real move: '+id);
  assert.ok(!(A[id].agile&&prof.kg>=110),wid+' is too heavy for '+id);
 }
 assert.ok(prof.signature.some(id=>sigSeen.has(wid+':'+id)),wid+' lands a signature move in ordinary play');
}
const ownRate=sigUse.own/sigUse.ownEvents,otherRate=sigUse.other/sigUse.otherEvents;
assert.ok(ownRate>4*otherRate,'wrestlers use their own signatures far more than their opponent’s ('+(ownRate*100).toFixed(1)+'% v '+(otherRate*100).toFixed(1)+'%)');
assert.ok(sigCalls.size>N*.5,'commentary recognises signatures in most matches');

// Finish routes: twenty-six in all (v0.3.22 adds six booked disqualifications), every contracted route
// reached, and the match so far picks it.
assert.equal(M.FINISH_ROUTE_COUNT,26,'twenty-six finish routes');
for(let i=0;i<240;i++){
 const o={...options(i),finish:i%2?'win_dq':'lose_dq',feudHeat:i%4*20},x=work(M.create(o));
 if(x.outcome==='booked'){assert.equal(x.graph.outcome.id,o.finish);routes.add(o.finish+'.'+x.final.finishRoute);assert.match(x.log.map(l=>l.text).join(' '),/disqualified|disqualification/);}
}
assert.ok(dqCalled<N*.03,'the referee throws out only a few ordinary matches: '+dqCalled+'/'+N);
const allRoutes=Object.entries(M.FINISH_ROUTES).flatMap(([k,l])=>l.map(r=>k+'.'+r.id));
const unrouted=allRoutes.filter(r=>!routes.has(r));
assert.equal(unrouted.length,0,'finish routes never used: '+unrouted.join(', '));

// 6. Same seed, same match — and a resumed save continues identically.
const a=work(M.create(options(42))),b=work(M.create(options(42)));
assert.equal(JSON.stringify(a.log),JSON.stringify(b.log),'identical seeds give identical matches');
const live=M.create(options(311));
for(let i=0;i<60;i++){if(live.decision&&!live.queue.length)M.resolve(live,live.decision.options[0].id);M.next(live);}
const copy=M.restore(JSON.parse(JSON.stringify({...live,rState:live.r.getState()})));
for(let i=0;i<2000&&!(live.done&&copy.done);i++){
 if(live.decision&&!live.queue.length)M.resolve(live,live.decision.options[0].id);
 if(copy.decision&&!copy.queue.length)M.resolve(copy,copy.decision.options[0].id);
 assert.equal(M.next(live)?.text,M.next(copy)?.text,'deterministic resume');
}
console.log('PASS catalog v3.4: '+v.nodes+' nodes, '+v.edges+' edges, '+v.families+' families, '+v.moves+' moves ('+v.reversals+' reversals, '+v.blocks+' blocks); '+
 'all reachable and performable; '+(coverage*100).toFixed(1)+'% seen in '+N+' matches; catalog share '+(catalogEvents/events*100).toFixed(0)+'%; '+
 'limb focus '+limb.on+'/'+limb.off+'; signatures '+(ownRate*100).toFixed(1)+'% own v '+(otherRate*100).toFixed(1)+'% other; '+routes.size+'/'+allRoutes.length+' contracted finish routes; deterministic build, seeds and resume');
