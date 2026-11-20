#!/usr/bin/env node
'use strict';
// Diagnostic only. Inspects 1,000 exact catalogue-test fixtures without
// changing source match-engine or selection RNG; never runs in production.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {script:inline}=require('../../tests/_source.cjs');
const cut=inline.indexOf('/* THE OFFICE — interface v3');
let source=inline.slice(0,cut);
const anchor='  return pool;\n }\n function recover(M)';
const injected=`  if(root.__phase4CoverageInspect){
   root.__phase4CoverageInspect({pool,graph:g,position:p.position,
    control:p.control,physical:g.physical,t:M.t,len:M.len,
    isValid,idToNode:A,plan:M.planId});
  }
  return pool;
 }
 function recover(M)`;
if(source.split(anchor).length!==2)throw Error('Expected final validPool return anchor missing');
source=source.replace(anchor,injected);
const selectionAnchor='  const candidates=validPool(M),id=pick(M,candidates);';
if(source.split(selectionAnchor).length!==2)throw Error('Choice anchor missing');
source=source.replace(selectionAnchor,
 selectionAnchor+'\n  if(root.__phase4Choice)root.__phase4Choice(id);');
const picks=new Map(),stats=new Map(),events=new Map(),attempts=new Map();
const focus=[
 'sx_deadlift_bridge','sx_delayed','sx_tiger','sx_snap_ddt','sx_cradle',
 'sx_falcon_arrow','pw_powerbomb','pw_sitout','pw_running_powerbomb',
 'nk_swinging_neckbreaker','nk_piledriver','cn_cannonball','cn_backflip',
 'ar_headbutt','ar_stomp','sp_powerbomb','dv_moonsault','dv_apron_senton',
 'dv_cannonball','dv_asai','dv_somersault','sm_cross_armbreaker',
 'sm_heel_hook','sm_dragon_sleeper','sm_cloverleaf','os_apron_slam',
 'lc_rope_walk'
];
const run={checks:0,position:{},plan:{},allActions:0};
function capture(d){
 run.checks++;
 const weights=new Map(d.pool),total=d.pool.reduce((x,row)=>x+row[1],0);
 for(const id of focus){
  const row=stats.get(id)||{id,checks:0,legal:0,offered:0,
   offeredLegal:0,expected:0,maxChance:0,availableNotOffered:0,
   states:{},positions:{},plans:{}};
  row.checks++;
  const valid=d.isValid(d.graph.__match||globalMatch,id);
  // Diagnostics read actual match; no mutation, RNG or extra selection.
  const weight=weights.get(id)||0;
  if(valid){
   row.legal++;
   row.positions[d.position]=(row.positions[d.position]||0)+1;
   row.plans[d.plan]=(row.plans[d.plan]||0)+1;
  }
  if(weight>0){
   row.offered++;
   if(valid)row.offeredLegal++;
   const chance=total?weight/total:0;
   row.expected+=chance;row.maxChance=Math.max(row.maxChance,chance);
  }else if(valid)row.availableNotOffered++;
  if(!valid){
   const node=d.idToNode[id],grip=d.physical?.grip;
   const required=windowRoot.OfficeMatch.GRAPH.PHYSICAL_GRIP_MOVES[id];
   let cause='other guard';
   if(node.requires!==d.position)cause='wrong position';
   else if(required&&(!grip||grip.type!==required))cause='missing required grip';
   else if(required&&grip.side!==d.control)cause='wrong grip owner';
   else if(required&&d.t-grip.at>20)cause='expired grip';
   else if(node.after&&d.t/d.len<node.after)cause='not yet match phase';
   row.states[cause]=(row.states[cause]||0)+1;
  }
  stats.set(id,row);
 }
}
const storage=new Map(),windowRoot={__phase4CoverageInspect:capture,
 __phase4Choice:id=>picks.set(id,(picks.get(id)||0)+1),addEventListener(){}};
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
let globalMatch=null;
vm.runInNewContext(source,{window:windowRoot,localStorage,console,Date,Math,JSON},{filename:'office-phase4-diagnostic.js'});
const D=windowRoot.OfficeData,M=windowRoot.OfficeMatch,G=M.GRAPH;
function options(i){
 const w=D.TALENT[i%D.TALENT.length],f=D.FOES[(i*5)%D.FOES.length];
 const plan=['story','technical','brawl','spots','safe'][i%5],
  finish=['win_clean','win_dirty','lose_protected','lose_clean'][Math.floor(i/5)%4];
 const slot=['opener','mid','feature','main'][Math.floor(i/20)%4];
 return {w:{...w,flags:{},fatigue:i%27},f,p:D.PROMOS[i%D.PROMOS.length],
  slot,minutes:D.SLOTS[slot].mins,finish,plan:{game:plan,leash:'script',talk:'calm'},
  preparation:{},flags:{},feudHeat:i%8*9,seed:5101+i*37};
}
for(let i=0;i<1000;i++){
 const m=M.create(options(i));globalMatch=m;
 for(let n=0;n<9000&&!m.done;n++){
  if(m.decision&&!m.queue.length){
   const option=m.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||
    m.decision.options[0];M.resolve(m,option.id);
  }
  M.next(m);
 }
 if(!m.done)throw Error('Unfinished match '+i);
 for(const ev of m.graph.events||[])events.set(ev.id,(events.get(ev.id)||0)+1);
 for(const kind of ['grappleAttempts','strikeAttempts','aerialAttempts'])
  for(const a of m.graph[kind]||[]){
   const row=attempts.get(a.id)||{};
   row[a.outcome]=(row[a.outcome]||0)+1;
   attempts.set(a.id,row);
  }
}
const report=focus.map(id=>{const row=stats.get(id);
 return {...row,landed:events.get(id)||0,picked:picks.get(id)||0,
  attempts:attempts.get(id)||{},
  expected:+row.expected.toFixed(2),
  maxChance:+row.maxChance.toFixed(4)};});
console.log('Phase 4 catalogue diagnostic: '+run.checks+' selection opportunities; '+focus.length+' rare moves inspected');
for(const r of report){
 const causes=Object.entries(r.states).sort((a,b)=>b[1]-a[1]).slice(0,3);
 console.log(r.id+' landed='+r.landed+' picked='+r.picked+' attempts='+JSON.stringify(r.attempts)+' legal='+r.legal+
  ' offered='+r.offered+' expected='+r.expected+' positions='+JSON.stringify(r.positions)+
  ' causes='+JSON.stringify(causes));
}
fs.writeFileSync('phase4-coverage-diagnostic.json',JSON.stringify({run,report},null,2));
