#!/usr/bin/env node
'use strict';
// Phase 4 independent-seed audit. Read-only: never changes matching,
// legality, thresholds or RNG. Reproduces the exact catalog fixtures,
// varying only seed between mutually disjoint batches.
// node tools/graph-lab/phase4-independent-seed-audit.cjs
// node tools/graph-lab/phase4-independent-seed-audit.cjs 1000 4
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {script:inline}=require('../../tests/_source.cjs');
const cut=inline.indexOf('/* THE OFFICE — interface v3');
const abortDetails=[],rareIds=['dv_moonsault','nk_tombstone','pw_sitout','sx_delayed'];
const rareStats=Object.fromEntries(rareIds.map(id=>[id,{legal:0,offered:0,offeredLegal:0,expected:0,
 maxProbability:0,plans:{},grips:{},locations:{},legalButNotOffered:0}]));
const root={addEventListener(){},
 __phase4RareProbe:row=>{
  const s=rareStats[row.id];if(!s)return;
  if(row.legal)s.legal++;
  if(row.offered){s.offered++;if(row.legal)s.offeredLegal++;
   s.expected+=row.probability;
   s.maxProbability=Math.max(s.maxProbability,row.probability);
  }else if(row.legal)s.legalButNotOffered++;
  if(row.legal){
   const p=s.plans[row.plan]??={legal:0,offered:0,expected:0};
   p.legal++;if(row.offered){p.offered++;p.expected+=row.probability;}
   const grip=row.grip||'none',loc=row.location||'none';
   s.grips[grip]=(s.grips[grip]||0)+1;
   s.locations[loc]=(s.locations[loc]||0)+1;
  }
 },
 __phase4AbortDetail:row=>{
  if(['sx_falcon_arrow','sm_dragon_sleeper','sx_delayed'].includes(row.id)&&
     abortDetails.length<50)abortDetails.push(row);
 }},store=new Map();
const localStorage={getItem:k=>store.get(k)||null,
 setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
// Diagnostic-only VM injection. It observes actual engine decisions at the
// exact point an already-committed grappling attempt fails revalidation;
// neither the shipped JS file nor the simulated match is altered.
const needle="  if(!isValid(M,id))return abortGrapple(M,'aborted',true);";
const injection=`  if(!isValid(M,id)){
   if(root.__phase4AbortDetail){
    const grip=get(M).physical?.grip;
    root.__phase4AbortDetail({id,seed:M.o.seed,at:M.t,
     startedT:pending.at,position:p.position,control:p.control,
     required:PHYSICAL_GRIP_MOVES[id]||null,
     gripType:grip?.type||null,gripOwner:grip?.side||null,
     gripSource:grip?.source||null,gripAge:grip?M.t-grip.at:null,
     stamina:p.control==='w'?M.wSt:M.fSt,
     after:A[id].after||0,progress:M.t/M.len});
   }
   return abortGrapple(M,'aborted',true);
  }`;
let engine=inline.slice(0,cut);
if(engine.split(needle).length!==2)throw Error('Grapple abort hook no longer unique');
engine=engine.replace(needle,injection);
// Read-only probe of *post-weight* legal candidates for the four
// consistently missing moves. It consumes no RNG and never changes a pool.
const poolNeedle='  return pool;\n }\n function recover(M)';
const probe=`  if(root.__phase4RareProbe){
   const denom=pool.reduce((n,r)=>n+r[1],0);
   const physical=g.physical,side=p.control,opponent=side==='w'?'f':'w';
   for(const id of ['dv_moonsault','nk_tombstone','pw_sitout','sx_delayed']){
    const weight=pool.find(r=>r[0]===id)?.[1]||0;
    root.__phase4RareProbe({id,legal:isValid(M,id),offered:weight>0,
     probability:denom>0?weight/denom:0,plan:M.planId,
     style:liveSide.style,grip:physical?.grip?.type||null,
     location:(physical?.locations?.[side]||'?')+'/'+
      (physical?.locations?.[opponent]||'?')});
   }
  }
  return pool;
 }
 function recover(M)`;
if(engine.split(poolNeedle).length!==2)throw Error('Missing pool hook');
engine=engine.replace(poolNeedle,probe);
vm.runInNewContext(engine,
 {window:root,localStorage,console,Date,Math,JSON},{filename:'office-engine.js'});
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const n=Number(process.argv[2]||1000),batches=Number(process.argv[3]||4);
if(!Number.isSafeInteger(n)||n<100||n>3000||!Number.isSafeInteger(batches)||
 batches<2||batches>8||n*batches>12000)
 throw Error('Use 100..3000 matches per batch, 2..8 batches, max 12000');
const independent=Object.keys(A).filter(id=>!A[id].counterOf&&!A[id].blockOf);
const required=Math.ceil(.95*independent.length);
const plans=['story','technical','brawl','spots','safe'];
function options(i,batch){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*5)%D.FOES.length];
 const plan=plans[i%5],finish=['win_clean','win_dirty','lose_protected',
  'lose_clean'][Math.floor(i/5)%4];
 const slot=['opener','mid','feature','main'][Math.floor(i/20)%4];
 const seed=5101+i*37+batch*104729;
 return {w:{...w,flags:{},fatigue:i%27},f,p:D.PROMOS[i%D.PROMOS.length],
  slot,minutes:D.SLOTS[slot].mins,finish,
  plan:{game:plan,leash:'script',talk:'calm'},
  preparation:{},flags:{},feudHeat:i%8*9,seed};
}
function run(x){
 for(let i=0;i<9000&&!x.done;i++){
  if(x.decision&&!x.queue.length){
   const o=x.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||
    x.decision.options[0];
   if(!o)throw Error('Missing decision choice');
   M.resolve(x,o.id);
  }
  M.next(x);
 }
 if(!x.done||!x.final)throw Error('Match did not finish');
 return x;
}
const batchReports=[],globalHits=new Map(),globalAttempts=new Map(),rare=new Map();
for(let batch=0;batch<batches;batch++){
 const seen=new Set(),hits=new Map(),attempts=new Map(),outcomes={},
  byStyle={},byPlan={};
 for(let i=0;i<n;i++){
  const o=options(i,batch),x=run(M.create(o));
  const k=o.plan.game,style=x.w.style||'Unknown';
  (byPlan[k]??={matches:0,actions:0}).matches++;
  (byStyle[style]??={matches:0,actions:0}).matches++;
  for(const event of x.graph.events||[]){
   if(!A[event.id]||A[event.id].counterOf||A[event.id].blockOf)continue;
   seen.add(event.id);hits.set(event.id,(hits.get(event.id)||0)+1);
   globalHits.set(event.id,(globalHits.get(event.id)||0)+1);
   byPlan[k].actions++;byStyle[style].actions++;
  }
  for(const kind of ['grappleAttempts','strikeAttempts','aerialAttempts','contactAttempts']){
   for(const a of x.graph[kind]||[]){
    const row=attempts.get(a.id)||{attempts:0,landed:0,counter:0,block:0,aborted:0,interrupted:0};
    row.attempts++;row[a.outcome]=(row[a.outcome]||0)+1;
    attempts.set(a.id,row);
    const total=globalAttempts.get(a.id)||{attempts:0,landed:0,counter:0,block:0,aborted:0,interrupted:0};
    total.attempts++;total[a.outcome]=(total[a.outcome]||0)+1;
    globalAttempts.set(a.id,total);
    outcomes[a.outcome]=(outcomes[a.outcome]||0)+1;
   }
  }
 }
 const missing=independent.filter(id=>!seen.has(id));
 for(const id of missing)rare.set(id,(rare.get(id)||0)+1);
 const summary={batch,matches:n,seedOffset:batch*104729,
  observed:seen.size,total:independent.length,required,
  coverage:+(100*seen.size/independent.length).toFixed(2),
  passes:seen.size>=required,missing,
  byPlan,byStyle,attemptOutcomes:outcomes};
 batchReports.push(summary);
 console.log('BATCH '+batch+': '+seen.size+'/'+independent.length+
  ' ('+summary.coverage+'%); missing '+missing.length+
  '; pass='+summary.passes+'; seed offset '+summary.seedOffset);
}
const consistentlyMissing=independent.filter(id=>!globalHits.has(id));
const repeated=independent.filter(id=>(rare.get(id)||0)>=Math.ceil(batches/2))
 .map(id=>({id,missedBatches:rare.get(id),landings:globalHits.get(id)||0,
  attempts:globalAttempts.get(id)||null})).sort((a,b)=>
  b.missedBatches-a.missedBatches||a.landings-b.landings||a.id.localeCompare(b.id));
const combined={observed:globalHits.size,total:independent.length,
 coverage:+(100*globalHits.size/independent.length).toFixed(2),
 missing:consistentlyMissing,required,
 passes:globalHits.size>=required};
const report={schema:'office-phase4-independent-seed-audit-v1',
 methodology:'Same roster/plan/slot/finish fixtures as catalog.test.cjs; only seed offset changes, independent engine runs; no writes to engine or RNG.',
 config:{matchesPerBatch:n,batches,seedStride:104729},
 combined,batches:batchReports,repeatedMissing:repeated,abortDetails,rareStats};
const filename=path.resolve(process.cwd(),'phase4-seed-coverage-audit.json');
fs.writeFileSync(filename,JSON.stringify(report,null,2)+'\n');
console.log('COMBINED '+combined.observed+'/'+combined.total+
 ' ('+combined.coverage+'%); missing across all '+consistentlyMissing.length);
console.log('REPEATED '+JSON.stringify(repeated.slice(0,45)));
console.log('ABORT DETAILS '+JSON.stringify(abortDetails));
for(const id of rareIds){
 const s=rareStats[id];
 s.expected=+s.expected.toFixed(2);
 s.maxProbability=+s.maxProbability.toFixed(4);
 for(const row of Object.values(s.plans))row.expected=+row.expected.toFixed(2);
 console.log('RARE OPPORTUNITY '+id+' '+JSON.stringify(s));
}
console.log('Saved '+filename);
// Read-only diagnostic: individual batches may legitimately fail the
// release gate. Never make this audit fail just because a rare move did
// not land; its results are for a separate statistical investigation.
