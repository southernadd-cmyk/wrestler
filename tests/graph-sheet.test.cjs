'use strict';
// The Office 3.1: connected match graphs and wrestler-negotiated sheets.
// Run: node tests/graph-sheet.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'standalone game script present');
new vm.Script(script);
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const memory=new Map(),root={addEventListener(){}};
const localStorage={getItem:key=>memory.get(key)||null,setItem:(key,v)=>memory.set(key,String(v)),removeItem:key=>memory.delete(key)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,console,Math,Date,JSON});
const D=root.OfficeData,E=root.OfficeMatch,P=root.OfficeSheets,K=root.OfficeGraphKernel,G=E.GRAPH;
const v=G.validate();
assert.equal(v.errors.length,0,'all action and arc edges valid');
assert.ok(v.nodes>=96&&v.edges>=292,'large connected action vocabulary');
assert.ok(P&&K&&K.commit&&K.eligible);
assert.ok(script.includes('function showMeeting(){'),'match meeting wired to interface');
assert.ok(script.includes('data-sheetvote'),'manager can resolve wrestler disagreement');
assert.ok(script.includes('Agreed versus performed'),'match report shows planned and actual events');
assert.ok(script.includes('saved.stage===\'meeting\''),'pre-match meeting can resume');
const modes=Object.keys(P.MODE),votes=['compromise','worker','opponent'];
assert.equal(modes.length,3);
let sheets=0;
for(const w of D.TALENT)for(const f of D.FOES)for(const mode of modes)for(const vote of votes){
 const a=P.build({id:'test',finish:'win_clean'},w,f,'story',mode,vote);
 assert.ok(a.signed&&a.speakers.some(s=>s.actor===w.short)&&a.speakers.some(s=>s.actor===f.short));
 assert.ok(a.nodes.length>=4);
 assert.ok(a.nodes.every(n=>n.actions.length&&n.window[0]<n.window[1]));
 assert.equal(a.nodes.at(-1).actions[0],'outcome_win_clean');
 assert.equal(K.validate(a.nodes).length,0);
 sheets++;
}
const rex=D.TALENT.find(w=>w.id==='rex'),juno=D.TALENT.find(w=>w.id==='juno'),f=D.FOES[1];
const compromise=P.build({id:'c',finish:'lose_clean'},rex,f,'brawl','landmarks','compromise');
const opponent=P.build({id:'c',finish:'lose_clean'},rex,f,'brawl','landmarks','opponent');
assert.notEqual(compromise.nodes.find(n=>n.id==='payoff').owner,opponent.nodes.find(n=>n.id==='payoff').owner,'dispute changes creative lead');
// Contrasting styles do not automatically create a problem.
const natural=P.build({id:'natural',finish:'win_clean',feudHeat:0},D.TALENT.find(x=>x.id==='brick'),D.FOES.find(x=>x.id==='rev'),'safe','landmarks');
assert.equal(natural.disputed,false,'a first-time professional match is mutually acceptable');
assert.equal(natural.signed,true,'no manager choice needed when both workers agree');
assert.ok(natural.speakers.some(x=>/nothing to arbitrate/.test(x.text)));
const matching=P.build({id:'matching',finish:'lose_clean'},rex,f,'brawl','landmarks');
assert.equal(matching.disputed,false,'different signature moves alone are not a dispute');
// Evidence of an actual humiliating defeat changes the next meeting.
const Game=root.OfficeGame;
Game.fresh();
assert.equal(Game.sign('rex'),null);
Game.S.history.unshift({wid:'rex',rid:f.id,finish:'lose_clean',season:1,week:1,slot:'mid',stars:2});
root.OfficeMemory.remember('rex','humiliation',rex.short+' remembers the decisive loss to '+f.short+'.',f.id,-4,-5,'test-humiliation');
const actual=Game.W('rex'),c={id:'rematch',finish:'lose_clean',feudHeat:45};
const issue=P.build(c,actual,f,'brawl','landmarks');
assert.equal(issue.signed,false,'unresolved historical issue requires a meaningful conversation');
assert.equal(issue.disputed,true);
assert.ok(issue.issues.some(x=>/remembers losing/.test(x.why)));
assert.ok(issue.speakers.some(x=>/decisive loss/.test(x.text)),'past match influences actual dialogue');
const backedPlan=P.build(c,actual,f,'brawl','landmarks','worker');
const opposedPlan=P.build(c,actual,f,'brawl','landmarks','opponent');
assert.ok(backedPlan.workerConsent>opposedPlan.workerConsent,'decision changes cooperation when a grievance exists');
const match={w:{...actual,flags:{},fatigue:0},f,p:D.PROMOS[0],slot:'mid',minutes:12,finish:'lose_clean',
 plan:{game:'brawl',leash:'script',talk:'calm'},preparation:{},flags:{},seed:343};
const backed=E.create({...match,sheet:backedPlan}),disputed=E.create({...match,sheet:opposedPlan});
assert.ok(backed.comply>disputed.comply,'historical dispute affects performance, not just dialogue');
Game.fresh(); // Avoid leaking the controlled historical test into the seeded bouts.
// Safety disagreements are backed by character facts, not a random argument.
const risk=P.build({id:'risk',finish:'win_clean'},D.TALENT.find(x=>x.id==='lyra'),D.FOES.find(x=>x.id==='roxy'),'spots','landmarks');
assert.ok(risk.disputed&&risk.issues.some(x=>x.actor==='f'),'a seasoned opponent questions an unsafe flyer');
const safeSize=P.build({id:'mismatch',finish:'win_clean'},D.TALENT.find(x=>x.id==='lyra'),D.FOES.find(x=>x.id==='rev'),'spots','landmarks');
assert.equal(safeSize.disputed,false,'a safer plan against a giant needs no fake safety argument');
assert.equal(safeSize.signed,true,'the wrestlers can agree without a click');
const contested=P.build({id:'risk',finish:'win_clean'},D.TALENT.find(x=>x.id==='lyra'),D.FOES.find(x=>x.id==='roxy'),'spots','landmarks','worker');
const safer=P.build({id:'risk',finish:'win_clean'},D.TALENT.find(x=>x.id==='lyra'),D.FOES.find(x=>x.id==='roxy'),'spots','landmarks','compromise');
assert.notEqual(contested.nodes.find(n=>n.id==='payoff').actions[0],safer.nodes.find(n=>n.id==='payoff').actions[0],'the safer compromise must change the planned move');
const exhausted=E.create({...match,sheet:backedPlan});
exhausted.stage='live';exhausted.wSt=5;exhausted.listen=100;
const beforeSpots=exhausted.spots;
assert.equal(E.call(exhausted,'big'),true);
assert.equal(exhausted.spots,beforeSpots);
assert.ok(!exhausted.sheet.ledger.some(x=>x.action==='special_spot'),'abandoned spot does not fulfil a causal commitment');
const tiny={w:{...juno,flags:{},fatigue:0},f:rex,p:D.PROMOS[0],slot:'mid',minutes:12,finish:'win_clean',
 plan:{game:'story',leash:'script',talk:'calm'},preparation:{},flags:{},seed:121};
const small=E.create({...tiny,sheet:P.build({id:'c',finish:'win_clean'},tiny.w,tiny.f,'story','detailed','worker')});
small.story.control='w';small.story.position='standing';
assert.equal(G.isValid(small,'heavy_slam'),false,'a light technical wrestler cannot lift a giant');
function cfg(i,mode='landmarks',vote='compromise'){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[Math.floor(i/8)%D.FOES.length],p=D.PROMOS[i%D.PROMOS.length];
 const finish=['win_clean','win_dirty','lose_protected','lose_clean'][Math.floor(i/5)%4];
 const game=['technical','story','brawl','spots'][i%4];
 const sheet=P.build({id:'contract-'+i,finish},w,f,game,mode,vote);
 return {w:{...w,flags:{},fatigue:i%44},f,p,slot:'mid',minutes:12,finish,
  plan:{game,leash:'script',talk:'calm'},preparation:{},flags:{},seed:1000+i*123,sheet};
}
function complete(m){
 for(let j=0;j<10000;j++){
  if(m.decision&&!m.queue.length){
   const d=m.decision.options.find(x=>['job','home','cut','protect'].includes(x.id))||m.decision.options[0];
   E.resolve(m,d.id);
  }
  E.next(m);
  if(m.done)return m;
 }
 throw Error('Match stalled');
}
const unique=new Set(),paths=new Set(),counts={detailed:0,landmarks:0,live:0};
let events=0,changed=0,landmarks=0,wrong=0;
for(let i=0;i<480;i++){
 const mode=modes[i%3],vote=votes[Math.floor(i/3)%3],opts=cfg(i,mode,vote),m=complete(E.create(opts));
 const report=P.report(m);
 assert.ok(report&&report.eventCount>10,'canonical ledger captures actual ring events');
 assert.equal(report.beats.length,opts.sheet.nodes.length);
 assert.equal(report.achieved+report.adapted+report.missed,report.total,'every agreed beat resolved');
 assert.equal(report.beats.at(-1).status,'achieved','contractual finish is honoured on the sheet');
 assert.equal(m.graph.outcome.id,opts.finish,'the written finish stays authoritative');
 assert.ok(m.log.every(l=>!(/\{(?:A|D|W|F|part)\}|undefined|NaN/).test(l.text)));
 assert.equal(new Set(m.sheet.ledger.map(x=>x.id)).size,m.sheet.ledger.length,'unique event IDs');
 assert.ok(m.sheet.ledger.every(x=>x.action&&x.kind),'event types recorded');
 counts[mode]++;landmarks+=report.achieved;changed+=report.adapted+report.missed;events+=report.eventCount;
 paths.add(m.graph.history.join('>'));
 for(const a of m.graph.events)unique.add(a.id);
}
assert.ok(paths.size>150,'varied match arcs');
assert.ok(unique.size>=82,'new action and reaction nodes are reached');
assert.ok(landmarks>100&&changed>50,'both completed and deviated sheets occur');
for(const mode of modes)assert.ok(counts[mode]>=100,mode+' coverage');
// A real decision affects the performed action path, not only the wording of the meeting.
let changedPath=0;
for(let i=3;i<24;i++){
 const a=complete(E.create(cfg(i,'detailed','worker')));
 const b=complete(E.create(cfg(i,'live','opponent')));
 if(a.graph.events.map(x=>x.id).join(',')!==b.graph.events.map(x=>x.id).join(','))changedPath++;
}
assert.ok(changedPath>=12,'method and agreement change actual match events');
// Mid-match checkpoint must preserve sheet, RNG and causal events.
const first=E.create(cfg(117,'detailed','opponent'));
for(let i=0;i<60;i++){if(first.decision&&!first.queue.length)E.resolve(first,first.decision.options[0].id);E.next(first)}
const second=E.restore(JSON.parse(JSON.stringify({...first,rState:first.r.getState()})));
for(let i=0;i<3000;i++){
 for(const m of [first,second])if(m.decision&&!m.queue.length)E.resolve(m,m.decision.options[0].id);
 assert.equal(E.next(first)?.text,E.next(second)?.text,'checkpoint commentary parity');
 if(first.done&&second.done)break;
}
assert.ok(first.done&&second.done);
assert.equal(JSON.stringify(P.report(first)),JSON.stringify(P.report(second)),'sheet checkpoint survives reload');
console.log('PASS match sheets: '+sheets+' two-wrestler negotiations; '+counts.detailed+' detailed, '+counts.landmarks+' landmark, '+counts.live+' live bouts; '+unique.size+' action types; '+events+' canonical events; '+paths.size+' story arcs; booked finishes, callbacks, physical legality and checkpoint tested');
