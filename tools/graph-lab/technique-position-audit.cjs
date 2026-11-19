#!/usr/bin/env node
'use strict';
/*
 * The Office v0.4 — deterministic read-only technique and position audit.
 * Usage:
 *   node tools/graph-lab/technique-position-audit.cjs --count 500 > technique-audit.json
 *
 * Runs the *actual* shipped JS match engine and 80-worker registry. It adds
 * observation fields to an IN-MEMORY copy of match-engine.js at the moment
 * each action applies; it never changes game files or consumes RNG draws.
 * The first 25 bouts are compared with the untouched engine to prove parity.
 * Every logged 'prePosition' is observed BEFORE the action moves wrestlers.
 * Outcome-counter actions may report isValid=false AFTER their pending
 * attempt has been cleared (by design); those are tracked separately.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const args=process.argv.slice(2);
function flag(name,otherwise){
 const i=args.indexOf(name);return i<0?otherwise:Number(args[i+1]);
}
const count=flag('--count',500),seedBase=flag('--seed',90021),seedStep=flag('--seed-step',41);
if(!Number.isSafeInteger(count)||count<1||count>5000)throw Error('--count must be 1..5000');
if(!Number.isSafeInteger(seedBase)||seedBase<=0||
 !Number.isSafeInteger(seedStep)||seedStep<1)throw Error('seed arguments must be positive integers');
const directory=path.resolve(__dirname,'../../assets/js');
const names=['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-engine.js'];
const source=names.map(name=>fs.readFileSync(path.join(directory,name),'utf8'));
const before="  const n=A[id],p=Psy.get(M),g=get(M);\n"+
 "  const {A:attacker,Df:defender,side}=context(M),opp=side==='w'?'f':'w';";
const after="  const n=A[id],p=Psy.get(M),g=get(M);\n"+
 "  const __audit={position:p.position,down:p.down,control:p.control,valid:isValid(M,id)};\n"+
 "  const {A:attacker,Df:defender,side}=context(M),opp=side==='w'?'f':'w';";
const record="  g.events.push({id,t:M.t,preControl:side,control:p.control,position:p.position,down:p.down,arc:g.arc,reverse:n.reverse,victim,part,exertion:effective,";
const auditedRecord="  g.events.push({id,t:M.t,auditPrePosition:__audit.position,auditPreDown:__audit.down,auditPreControl:__audit.control,auditLegal:__audit.valid,preControl:side,control:p.control,position:p.position,down:p.down,arc:g.arc,reverse:n.reverse,victim,part,exertion:effective,";
if(source[4].split(before).length!==2||source[4].split(record).length!==2)
 throw Error('Match engine instrumentation anchor has changed; review before re-running');
const instrumented=source[4].replace(before,after).replace(record,auditedRecord);
function load(engine){
 const root={};
 names.forEach((name,i)=>vm.runInNewContext(i===4?engine:source[i],
  {window:root,Math,Date,JSON,console},{filename:name}));
 root.OfficeRosterV4.enableProfiles();
 return root;
}
const audited=load(instrumented),unaltered=load(source[4]);
const D=audited.OfficeData,G=audited.OfficeMatch.GRAPH,R=audited.OfficeTechniqueRegistry;
const people=[...new Map([...(D.ALL||[]),...(D.TALENT||[]),...(D.FOES||[])]
 .filter(Boolean).map(w=>[w.id,w])).values()].sort((a,b)=>a.name.localeCompare(b.name));
const familyOf=new Map(Object.entries(G.CATALOG.F)
 .flatMap(([family,record])=>record.moves.map(move=>[move[0],family])));
const shortlist=['gd_elbow_drop','gd_knee_drop','gd_stomp','gd_arm_elbows',
 'nk_ddt','nk_snap_ddt','nk_inverted_ddt','nk_swinging_neckbreaker',
 'cn_splash','cn_dropkick','cn_forearm','cn_tree_of_woe',
 'os_barricade','os_post','os_floor_piledriver','os_ramp_suplex',
 'sx_vertical','sx_deadlift_bridge','sx_rolling_german','sx_tiger',
 'pw_chokeslam','pw_powerbomb','pw_backbreaker','pw_running_powerbomb'];
const highlighted=new Set([...shortlist,'sx_german','sp_superplex','ar_elbow_point',
 'dv_tope_con_hilo','pw_bearhug','double_down_count','os_apron_ddt']);
const inc=(map,key)=>map[key]=(map[key]||0)+1;
const config={count,seedBase,seedStep,plans:['technical','story','brawl','spots','safe'],
 slots:['opener','mid','main'],rosterRotation:'sorted 80, wrestler=i%80; opponent=(7*i+19)%80 (next if equal)',
 finishRotation:['win_clean','lose_clean','win_dirty','lose_protected'],
 decisions:['job','home','cut','protect'],unmodifiedOptions:'fatigue=0, script leash, calm talk, no preparation',
 instrumentation:'non-mutating capture at Graph.apply entry; 25-bout untouched-engine parity check'};
function options(i){
 const w=people[i%people.length],f0=people[(i*7+19)%people.length];
 const f=f0.id===w.id?people[(i+1)%people.length]:f0;
 const slot=config.slots[Math.floor(i/5)%3],plan=config.plans[i%5];
 return {w:{...w,fatigue:0,flags:{}},f:{...f,fatigue:0,flags:{}},
  p:D.PROMOS[0],slot,minutes:D.SLOTS[slot].mins,
  finish:config.finishRotation[i%4],
  plan:{game:plan,leash:'script',talk:'calm'},preparation:{},flags:{},
  seed:seedBase+i*seedStep};
}
function run(root,i){
 const M=root.OfficeMatch.create(options(i));
 for(let step=0;step<9000&&!M.done;step++){
  if(M.decision&&!M.queue.length){
   const choices=M.decision.options||[];
   const pick=choices.find(x=>config.decisions.includes(x.id))||choices[0];
   if(!pick)throw Error('Unanswerable in-ring decision for seed '+M.o.seed);
   root.OfficeMatch.resolve(M,pick.id);
  }
  root.OfficeMatch.next(M);
 }
 if(!M.done||!M.final)throw Error('Unfinished match '+i+' seed='+M.o.seed);
 return M;
}
const parity=[];
for(let i=0;i<Math.min(25,count);i++){
 const a=run(unaltered,i),b=run(audited,i);
 const same=a.final.stars===b.final.stars&&a.graph.outcome?.id===b.graph.outcome?.id&&
  a.graph.events.map(e=>e.id).join(',')===b.graph.events.map(e=>e.id).join(',')&&
  a.log.map(x=>x.text).join('\n')===b.log.map(x=>x.text).join('\n');
 if(!same)parity.push({i,seed:a.o.seed});
}
if(parity.length)throw Error('Audit modifies results for seeds '+JSON.stringify(parity));
const familySummary={};
for(const [family,cat] of Object.entries(G.CATALOG.F))
 familySummary[family]={catalogued:cat.moves.length,reviewed:cat.moves.filter(x=>R.get(x[0])).length,
  observedHits:0,unreviewedHits:0,observedUnique:0,unreviewedUnique:0};
const hits={},byPlan={},bySlot={},attempts={aerial:{},grapple:{}},selected={};
let totalEvents=0,actionEvents=0,authoredEvents=0,reviewedEvents=0,unreviewedEvents=0;
let maxRetained=0,atEventCap=0,illegalPreconditions=0,attemptCounterChecks=0,timingFaults=0,finished=0,scriptedSpotAttempts=0,scriptedSpotLanded=0,scriptedSpotBotched=0;
const problems=[],matchSummary=[],examples=[];
for(let i=0;i<count;i++){
 const M=run(audited,i),ev=M.graph?.events||[],planned=options(i);
 finished++;maxRetained=Math.max(maxRetained,ev.length);
 for(const attempt of M.graph?.scriptedSpotAttempts||[]){
  scriptedSpotAttempts++;
  if(attempt.outcome==='landed')scriptedSpotLanded++;
  if(attempt.outcome==='botched')scriptedSpotBotched++;
 }
 if(ev.length>=220)atEventCap++;
 const p=planned.plan.game,slot=planned.slot;
 const ps=byPlan[p]??={bouts:0,starsTotal:0,actionEvents:0,reviewed:0,unreviewed:0};
 const sl=bySlot[slot]??={bouts:0,starsTotal:0,actionEvents:0};
 ps.bouts++;sl.bouts++;ps.starsTotal+=M.final.stars;sl.starsTotal+=M.final.stars;
 matchSummary.push({index:i,seed:planned.seed,w:planned.w.id,f:planned.f.id,
  plan:p,slot,seconds:M.len,stars:M.final.stars,outcome:M.graph?.outcome?.id});
 for(const type of ['aerial','grapple'])
  for(const rec of M.graph?.[type+'Attempts']||[]){
   const a=attempts[type][rec.id]??={attempts:0,outcomes:{}};
   a.attempts++;inc(a.outcomes,rec.outcome||'unresolved');
  }
 for(let j=0;j<ev.length;j++){
  const e=ev[j],node=G.A[e.id],prev=ev[j-1];totalEvents++;
  if(!node)continue;
  actionEvents++;ps.actionEvents++;sl.actionEvents++;
  const family=familyOf.get(e.id),reviewed=!!R.get(e.id);
  if(family){
   authoredEvents++;inc(hits,e.id);familySummary[family].observedHits++;
   if(reviewed){reviewedEvents++;ps.reviewed++;}
   else{unreviewedEvents++;ps.unreviewed++;familySummary[family].unreviewedHits++;}
  }
  if(e.t/M.len+1e-8<(node.after||0)){
   timingFaults++;
   if(problems.length<40)problems.push({type:'timing',seed:M.o.seed,id:e.id,t:e.t,after:node.after});
  }
  if(e.auditLegal===false){
   // Resolution clears pending attempt first, so the raw isValid() check
   // intentionally rejects the counter outside its attempt context.
   const isResolvedCounter=(e.aerialAttemptSeq!==undefined||
    e.grappleAttemptSeq!==undefined)&&(node.counterOf||node.blockOf);
   if(isResolvedCounter)attemptCounterChecks++;
   else{
    illegalPreconditions++;
    if(problems.length<40)problems.push({type:'precondition',seed:M.o.seed,id:e.id,t:e.t,
     requires:node.requires,prePosition:e.auditPrePosition,preDown:e.auditPreDown});
   }
  }
  if(!highlighted.has(e.id))continue;
  const s=selected[e.id]??={hits:0,unlinked:0,prePositions:{},predecessors:{},examples:[]};
  s.hits++;inc(s.prePositions,e.auditPrePosition||'(none)');
  inc(s.predecessors,prev?.id||'(start)');
  const linked=!!(prev&&G.A[prev.id]?.next.some(x=>x[0]===e.id));
  if(!linked)s.unlinked++;
  if(s.examples.length<3){
   const stamp=audited.OfficeMatch.fmt(e.t);
   const snippets=M.log.filter(x=>x.t===stamp&&x.kind!=='crowd').slice(0,5).map(x=>x.text);
   s.examples.push({seed:M.o.seed,plan:p,slot,time:stamp,pre:e.auditPrePosition,post:e.position,
    from:prev?.id||null,linked,lines:snippets});
  }
 }
}
for(const [family,rec] of Object.entries(G.CATALOG.F)){
 familySummary[family].observedUnique=rec.moves.filter(x=>hits[x[0]]).length;
 familySummary[family].unreviewedUnique=rec.moves.filter(x=>!R.get(x[0])&&hits[x[0]]).length;
}
const sortCount=(m)=>Object.entries(m).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
const observed=new Set(Object.keys(hits));
const allAuthored=[...familyOf.keys()];
const unseen=allAuthored.filter(id=>!observed.has(id));
const shortlistByHits=shortlist.map(id=>({id,family:familyOf.get(id),hits:hits[id]||0}))
 .sort((a,b)=>b.hits-a.hits||a.id.localeCompare(b.id));
const highlightedDetails=Object.fromEntries(Object.entries(selected).map(([id,v])=>[id,{
 hits:v.hits,unlinked:v.unlinked,prePositions:v.prePositions,
 predecessors:sortCount(v.predecessors).slice(0,8),examples:v.examples
}]));
const snapshot={
 schema:'the-office-v04-technique-position-audit-v1',
 referenceCommit:'015af53aed9244aeb091d0dcbcddc7c207aca1e0',
 liveSourceRevision:process.env.GITHUB_SHA||null,
 config,graph:G.validate(),registry:R.validate(G),
 instrumentationParity:{bouts:Math.min(25,count),identical:true},
 completed:finished,rosterCount:people.length,totalEvents,actionEvents,authoredEvents,
 reviewedEvents,unreviewedEvents,reviewedUnique:allAuthored.filter(id=>observed.has(id)&&R.get(id)).length,
 unreviewedUnique:allAuthored.filter(id=>observed.has(id)&&!R.get(id)).length,
 unseenMoves:unseen,maxRetainedEvents:maxRetained,eventCapReached:atEventCap,
 timingFaults,illegalPreconditions,attemptCounterChecks,
 scriptedSpots:{attempts:scriptedSpotAttempts,landed:scriptedSpotLanded,botched:scriptedSpotBotched},
 byPlan,bySlot,byFamily:familySummary,
 mostFrequentUnreviewed:sortCount(Object.fromEntries(Object.entries(hits).filter(([id])=>!R.get(id))))
  .slice(0,50).map(([id,hits])=>({id,family:familyOf.get(id),hits})),
 proposedTrancheByFrequency:shortlistByHits,highlighted:highlightedDetails,attempts,
 flaggedExamples:problems,firstTenBouts:matchSummary.slice(0,10),
 coverageNote:'The scripted engine logs post-action position; auditPrePosition is captured at Graph.apply entry. No wrist/waist/facelock grip is modelled. An unlinked preceding event is NOT by itself a physical-legality failure.',
 eventCapNote:'Match engine retains at most 220 graph events. If eventCapReached is nonzero, extend the tracer before treating event frequency as exhaustive.'
};
process.stdout.write(JSON.stringify(snapshot,null,2)+'\n');
