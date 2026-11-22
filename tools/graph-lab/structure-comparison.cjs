#!/usr/bin/env node
'use strict';
// Phase 7 read-only comparison: real signed Director vs metadata-only control.
// 4 structures x 2 dramatic leads x 5 plans x 3 lengths x 4 styles =
// 480 active and 480 matched control matches. --quick uses two lengths/styles.
// No gameplay changes, scripted events or separate workflows.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('../../tests/_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Math,Date,JSON,console});
const {OfficeData:D,OfficeRoom:Room,OfficeSheets:S,OfficeMatch:E}=root;
const clone=x=>JSON.parse(JSON.stringify(x));
const ids=S.STRUCTURES.catalogue().map(x=>x.id),plans=['story','technical','brawl','spots','safe'];
const styles=['Technical','Brawl','Spectacle','Story'],p=D.PROMOS[0];
const quick=process.argv.includes('--quick');
const durations=quick?[8,18]:[8,12,18],sampleStyles=quick?styles.slice(0,2):styles;
const map=Object.fromEntries(ids.map(id=>[id,{bouts:0,earned:0,missed:0,complete:0,stars:0,
 controlStars:0,events:0,controlEvents:0,distinct:0,botches:0,controlBotches:0,
 finishes:0,finishFallbacks:0,named:0,namedHit:0,open:0,causalFinals:0,objectives:{},
 sequences:{},firstActions:{},byPlan:{},byLength:{},byStyle:{},byLead:{}}]));
const add=(o,k,n=1)=>o[k]=(o[k]||0)+n;
const ratio=(n,d)=>+(100*n/Math.max(1,d)).toFixed(1);
const avg=(n,d)=>+(n/Math.max(1,d)).toFixed(3);
const top=(obj,n=5)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,n).map(([name,count])=>({name,count}));
function sign(c,w,f,game,id,lead){
 const st=Room.begin(c,w,f,p,{structure:{id,lead},structurePlanning:true});
 st.queue=[];Room.act(st,'plan_'+game);
 assert.equal(st.stage,'board');Room.act(st,'board_ok');
 assert.equal(st.stage,'review');Room.act(st,'review_ok');Room.act(st,'talk_none');
 assert.equal(st.stage,'done');return st.sheet;
}
function run(sheet,c,w,f,seed,execute){
 const m=E.create({w:{...w,fatigue:5,flags:{}},f,p,slot:'main',
  finish:c.finish,minutes:sheet.minutes,feudHeat:22,seed,flags:{},
  preparation:{},plan:{game:sheet.game,leash:'script',talk:'none'},
  sheet:clone(sheet),structureExecution:execute});
 for(let i=0;i<9000&&!m.done;i++){
  if(m.decision&&!m.queue.length){
   const opts=m.decision.options||[],choice=opts.find(x=>['job','keep','protect','work'].includes(x.id))||
    opts.find(x=>!['home','cut','stop'].includes(x.id))||opts[0];
   assert.ok(choice,'live decision');E.resolve(m,choice.id);
  }
  E.next(m);
 }
 assert.ok(m.done&&m.final,'real match finishes');
 if(m.outcome==='booked')assert.equal(m.graph.outcome?.id,c.finish,'booked finish unchanged');
 return m;
}
for(let si=0;si<sampleStyles.length;si++){
 const style=sampleStyles[si],foeStyle=styles[(styles.indexOf(style)+1)%styles.length];
 const w=D.TALENT.find(x=>x.style===style);
 const f=D.FOES.find(x=>x.style===foeStyle)||D.ALL.find(x=>x.style===foeStyle&&x.id!==w?.id);
 assert.ok(w&&f&&w.id!==f.id,'valid distinct wrestler pairing');
 for(const id of ids)for(const lead of ['w','f'])for(const game of plans)for(const minutes of durations){
  const finish=['win_clean','lose_clean','win_dirty','lose_protected'][
   (si+plans.indexOf(game)+minutes/2+(lead==='f'?1:0))%4];
  const c={id:'p7-'+si+'-'+id+'-'+lead+'-'+game+'-'+minutes,wid:w.id,rid:f.id,
   pid:p.id,slot:'main',finish,minutes,eventAbs:54,feudHeat:22};
  const seed=1030001+si*10301+ids.indexOf(id)*6101+plans.indexOf(game)*379+minutes*71+(lead==='f'?41:0);
  const sheet=sign(c,w,f,game,id,lead),before=JSON.stringify(sheet);
  assert.equal(S.STRUCTURES.readPlan(sheet).mode,'editorial');
  const m=run(sheet,c,w,f,seed,true),control=run(sheet,c,w,f,seed,false),r=map[id];
  assert.equal(JSON.stringify(sheet),before,'signed plan immutable');
  assert.equal(E.structureReport(control),null,'metadata control not active');
  const v=m.final.structure,a=m.final.structureAssessment;
  assert.ok(v&&a&&v.objectives.length===4,'evidenced structure report');
  assert.ok(!m.final.starParts.some(x=>x[0]==='structure'),'no automatic stars');
  r.bouts++;r.stars+=m.final.stars;r.controlStars+=control.final.stars;
  r.events+=m.graph.events.length;r.controlEvents+=control.graph.events.length;
  r.distinct+=new Set(m.graph.events.map(x=>x.id)).size;
  r.botches+=m.botches;r.controlBotches+=control.botches;
  r.finishFallbacks+=Number(!!m.finishRouteFallbackFrom);
  r.finishes+=Number(m.graph.outcome?.id===finish);
  r.named+=a.planAdherence.namedCalls;r.namedHit+=a.planAdherence.witnessedCalls;
  r.open+=a.planAdherence.openObjectives;
  let witnessed=0;const sequence=[];
  for(let k=0;k<4;k++){
   const o=v.objectives[k],plan=sheet.structurePlan.objectives[k];
   assert.equal(o.id,plan.id);
   assert.ok(['achieved','adapted','missed'].includes(o.status));
   add(r.objectives,o.id+':'+o.status);
   if(o.status==='missed'){r.missed++;sequence.push('-');continue;}
   r.earned++;witnessed++;
   const e=o.evidence.find(e=>e.at===o.at)||o.evidence.at(-1);
   assert.ok(e&&m.graph.events.some(x=>x.id===e.id&&x.t===e.at),
    'structure evidence from real recorded action');
   assert.ok(e.progress>=plan.window[0]-.04001&&e.progress<=plan.window[1]+.08001,
    'evidence in intended time window');
   if(o.intent==='finish_build'&&o.evidence.length===1){
    const earlier=v.objectives.slice(0,k).flatMap(x=>x.evidence);
    assert.ok(e.impact&&earlier.some(p=>p.id!==e.id&&p.at<e.at&&e.at-p.at<=150),
     'one closing impact needs a different witnessed setup inside 150 seconds');
    r.causalFinals++;
   }
   sequence.push(e.id);add(r.firstActions,o.id+':'+e.id);
  }
  if(witnessed===4)r.complete++;
  add(r.sequences,sequence.join('>'));
  for(const [key,label] of [['byPlan',game],['byLength',String(minutes)],
   ['byStyle',style],['byLead',lead]]){
   const group=r[key][label]??={bouts:0,earned:0,stars:0};
   group.bouts++;group.earned+=witnessed;group.stars+=m.final.stars;
  }
 }
}
const report={schema:'office-structure-phase7-audit-v1',mode:quick?'quick':'full',
 method:'Four structures, paired signed editorial vs metadata-only control, identical seeded matches. Actual graph actions only.',
 totalBouts:Object.values(map).reduce((n,r)=>n+r.bouts*2,0),
 structures:Object.fromEntries(ids.map(id=>{
  const r=map[id],dims={};
  for(const key of ['byPlan','byLength','byStyle','byLead'])
   dims[key]=Object.fromEntries(Object.entries(r[key]).map(([k,v])=>[k,{
    bouts:v.bouts,earnedPct:ratio(v.earned,4*v.bouts),meanStars:avg(v.stars,v.bouts)}]));
  const sequences=top(r.sequences,6);
  return [id,{bouts:r.bouts,earnedPct:ratio(r.earned,4*r.bouts),
   perfectPct:ratio(r.complete,r.bouts),missed:r.missed,
   meanStars:avg(r.stars,r.bouts),controlStars:avg(r.controlStars,r.bouts),
   starDelta:avg(r.stars-r.controlStars,r.bouts),
   meanEvents:avg(r.events,r.bouts),controlEvents:avg(r.controlEvents,r.bouts),
   meanDistinctActions:avg(r.distinct,r.bouts),
   botches:r.botches,controlBotches:r.controlBotches,
   bookedFinishes:r.finishes,finishFallbacks:r.finishFallbacks,causalFinals:r.causalFinals,
   namedCalls:r.named,namedHitPct:ratio(r.namedHit,r.named),openObjectives:r.open,
   objectiveStatus:r.objectives,topActions:top(r.firstActions,12),
   uniqueSequences:Object.keys(r.sequences).length,
   commonSequenceShare:ratio(sequences[0]?.count||0,r.bouts),
   topSequences:sequences,...dims}];
 }))};
assert.equal(report.totalBouts,(quick?320:960));
console.log('PHASE7_AUDIT_JSON '+JSON.stringify(report));
for(const [id,x] of Object.entries(report.structures))
 console.log('PHASE7 '+id+' '+x.bouts+' active; earned '+x.earnedPct+'%; all four '+x.perfectPct+
 '%; distinct sequences '+x.uniqueSequences+'; top sequence '+x.commonSequenceShare+
 '%; mean stars '+x.meanStars+' vs '+x.controlStars);
