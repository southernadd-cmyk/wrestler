#!/usr/bin/env node
'use strict';
// Read-only live OfficeMatch Safe PLAN audit. No Safe wrestler STYLE exists.
const lab=require('./core.js'),review=require('./match-review.cjs');
const PLANS=['safe','technical','story','brawl','spots'];
const WORKERS=[['brick','Brawl'],['ezra','Technical'],['sol','Story'],['nico','Spectacle']];
const OPP=['ace','silas','red','rev'],LENGTHS=[8,12,18];
const TIERS=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const SAFE_COVERS=new Set(['arm_drag','grapple_trip','mat_takedown',
  'headlock_takeover','hip_toss','shoulder_tackle']);
const round=(v,d=2)=>+Number(v).toFixed(d);
const top=(o,k=10)=>Object.entries(o).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
 .slice(0,k).map(([id,count])=>({id,count}));
const fresh=()=>({n:0,stars:0,stamina:0,botches:0,injuries:0,crowd:0,
  riskW:0,riskF:0,performedRisk:0,highRisk:0,riskSetups:0,
  rest:0,late:0,lateDistinct:0,offence:0,distinct:0,earlyQ:0,earlyN:0,lateQ:0,lateN:0,
  earned:0,badSources:0,near:0,repeated:0,grapples:0,scripted:0,
  risks:{},families:{},examples:[],badExamples:[]});
function collect(s,m,G,isSafe){
 const events=m.graph.events,A=G.A;
 const actual=e=>A[e.id]&&!A[e.id].reverse&&!A[e.id].counterOf&&
  !A[e.id].blockOf&&['aerialResolution','grappleResolution',
  'strikeResolution','contactResolution'].every(key=>!e[key]||e[key]==='landed');
 const own=events.filter(e=>e.preControl==='w'&&actual(e));
 const late=own.filter(e=>e.t>=m.len-180);
 s.n++;s.stars+=m.final.stars;s.stamina+=m.wSt;
 s.botches+=m.botches||0;s.injuries+=Number((m.final.injury||0)>0);
 s.crowd+=m.crowdPeak||0;s.near+=m.nearfalls||0;
 s.offence+=own.length;s.distinct+=new Set(own.map(x=>x.id)).size;
 s.late+=late.length;s.lateDistinct+=new Set(late.map(x=>x.id)).size;
 s.rest+=own.filter(e=>e.id==='catch_breath'||A[e.id].family==='rest').length;
 s.grapples+=(m.graph.grappleAttempts||[]).filter(x=>x.side==='w'&&x.outcome==='landed').length;
 s.scripted+=events.filter(e=>e.scriptedSpot&&A[e.id]).length;
 for(const x of m.flow||[])if(x[0]<m.len*.35){s.earlyQ+=x[4];s.earlyN++;}
 else if(x[0]>=m.len*.65){s.lateQ+=x[4];s.lateN++;}
 const logs={};for(const l of m.log||[])if(l.text?.length>15)logs[l.text]=(logs[l.text]||0)+1;
 s.repeated+=Object.values(logs).filter(x=>x>=3).length;
 for(let i=0;i<events.length;i++){
  const e=events[i],n=A[e.id];
  if(e.id==='scheduled_nearfall'){
   s.earned++;
   const src=events.slice(0,i).findLast(x=>x.id===e.sourceMove&&
      x.t===e.sourceT&&x.preControl===e.sourceSide&&
      x.control===e.sourceSide&&x.position==='mat'&&
      x.down!==e.sourceSide&&actual(x));
   if(!e.earned||!src||e.t-src.t>30||e.sourceSide!==e.control||
      (isSafe&&(!SAFE_COVERS.has(e.sourceMove)||A[e.sourceMove]?.risk))){
    s.badSources++;
    if(s.badExamples.length<8)s.badExamples.push({seed:m.o.seed,t:e.t,
      source:e.sourceMove,side:e.sourceSide});
   }
  }
  if(!n)continue;
  if(e.preControl==='w'&&actual(e))s.families[n.family||'core']=(s.families[n.family||'core']||0)+1;
  if(!n.risk||n.reverse||n.counterOf||n.blockOf)continue;
  if(e.preControl==='f'){s.riskF++;continue;}
  if(e.preControl!=='w')continue;
  s.riskW++;s.risks[e.id]=(s.risks[e.id]||0)+1;
  const setup=['top_follow','top_climb','springboard_rise'].includes(e.id);
  if(setup)s.riskSetups++;
  if(!setup&&actual(e))s.performedRisk++;
  if(['aerial','springboard','superplex','dive'].includes(n.family)||
     /piledriver|barricade|ramp_suplex/.test(e.id))s.highRisk++;
  if(isSafe&&s.examples.length<8)s.examples.push({seed:m.o.seed,
    id:e.id,t:e.t,worker:m.w.id,opponent:m.f.id,setup,
    landed:!!actual(e),scripted:!!e.scriptedSpot,
    preceding:events.slice(Math.max(0,i-2),i).map(x=>x.id)});
 }
}
function output(s,id){
 const mean=k=>round(s[k]/s.n);
 return {id,matches:s.n,stars:mean('stars'),stamina:mean('stamina'),
 botches:mean('botches'),injuryBouts:s.injuries,peakCrowd:mean('crowd'),
 workerRisk:mean('riskW'),opponentRisk:mean('riskF'),
 performedRisk:mean('performedRisk'),highRisk:mean('highRisk'),
 setupRisk:mean('riskSetups'),rests:mean('rest'),lateOffence:mean('late'),
 lateDistinct:mean('lateDistinct'),workerOffence:mean('offence'),
 distinctMoves:mean('distinct'),earlyQ:round(s.earlyQ/Math.max(1,s.earlyN)),
 lateQ:round(s.lateQ/Math.max(1,s.lateN)),
 nearFalls:mean('near'),earnedScheduled:mean('earned'),
 badSources:s.badSources,repeatedLines:mean('repeated'),
 grappleLanded:mean('grapples'),scriptedEvents:mean('scripted'),
 topRisk:top(s.risks),families:top(s.families),riskExamples:s.examples,
 badExamples:s.badExamples};
}
function capture(seeds=4){
 if(!Number.isSafeInteger(seeds)||seeds<1||seeds>8)throw Error('Seeds 1–8 required');
 const root=review.load(),D=root.OfficeData,G=root.OfficeMatch.GRAPH;
 if(D.STYLE_PLAN.Safe!==undefined)throw Error('Safe must be a plan, not a wrestler style');
 const roster=new Map(lab.roster(D).map(w=>[w.id,w]));
 for(const [id,style] of WORKERS)if(roster.get(id)?.style!==style)
  throw Error('Worker style mismatch for '+id);
 const maps={matched:new Map(),duration:new Map(),real:new Map(),fatigue:new Map()};
 const bucket=(kind,id)=>{const m=maps[kind];if(!m.has(id))m.set(id,fresh());return m.get(id)};
 let total=0;
 function run(input,groups,changes){
  const o=lab.makeOptions(D,input);o.minutes=input.minutes;
  if(changes)o.w={...o.w,...changes};
  const m=lab.runMatch(root,o);
  for(const s of groups)collect(s,m,G,input.plan==='safe');
  total++;
 }
 // Strict matched 5-plan comparisons: 4 identities x 3 tiers x 3 lengths
 // x 4 opponents x N seeds; promoter, outcome, ability and seed identical.
 for(let w=0;w<4;w++)for(const [tier,ring,safe,psych] of TIERS)
 for(const minutes of LENGTHS)for(let oi=0;oi<4;oi++)
 for(let i=0;i<seeds;i++){
  const fixed={wid:WORKERS[w][0],rid:OPP[oi],minutes,slot:'main',
   seed:118731+w*68303+oi*7919+minutes*9191+i*193,
   promotion:D.PROMOS[(w+oi+minutes+i)%4].id,
   finish:i%2?'lose_clean':'win_clean'};
  for(const plan of PLANS)run({...fixed,plan},
   [bucket('matched',WORKERS[w][0]+'/'+tier+'/'+plan),
    bucket('duration',tier+'/'+minutes+'/'+plan)],
   {ring,safe,psych,heat:65,fatigue:4,pro:78});
 }
 // Actual unmodified workers, 12 matches per plan.
 for(let w=0;w<4;w++)for(let i=0;i<12;i++){
  const fixed={wid:WORKERS[w][0],rid:OPP[(i+w)%4],minutes:12,slot:'main',
   seed:520021+i*313,finish:i%2?'lose_clean':'win_clean',
   promotion:D.PROMOS[i%4].id};
  for(const plan of PLANS)run({...fixed,plan},
   [bucket('real',WORKERS[w][0]+'/'+plan)],null);
 }
 // Isolated fatigue treatment, retaining full five-plan controls.
 for(const [wid] of WORKERS)for(const fatigue of [4,55])
 for(const minutes of [12,18])for(let oi=0;oi<2;oi++)
 for(let i=0;i<4;i++){
  const fixed={wid,rid:OPP[oi],minutes,slot:'main',
   seed:830027+oi*7193+minutes*193+i*239,
   promotion:D.PROMOS[(i+oi)%4].id,
   finish:i%2?'lose_clean':'win_clean'};
  for(const plan of PLANS)run({...fixed,plan},
   [bucket('fatigue',wid+'/'+fatigue+'/'+plan)],{fatigue});
 }
 const rows=kind=>[...maps[kind].entries()].map(([id,s])=>output(s,id));
 return {schema:'safe-plan-depth-v1',totalMatches:total,
  expected:720*seeds+240+320,seeds,plans:PLANS,workers:WORKERS,
  tiers:TIERS,minutes:LENGTHS,opponents:OPP,
  methodology:'Each five-plan cell uses the real OfficeMatch engine, identical worker/opponent/seed/booked result/promotion/clock and skills; synthetic tiers preserve body/training identity. Actual-roster and fatigue cells are separate. risk:true is move metadata, not observed injury. Opponent and worker risks separated. No gameplay change.',
  matched:rows('matched'),duration:rows('duration'),
  real:rows('real'),fatigue:rows('fatigue')};
}
function failures(r){
 const issues=[];
 if(r.totalMatches!==r.expected)issues.push('Incomplete '+r.totalMatches+'/'+r.expected);
 if(r.matched.length!==60||r.duration.length!==45||r.real.length!==20||
 r.fatigue.length!==40)issues.push('Incomplete grouped reports');
 for(const s of [...r.matched,...r.duration,...r.real,...r.fatigue])
  if(!Number.isFinite(s.stars)||!Number.isFinite(s.lateQ)||
   !s.matches||s.badSources>0||s.performedRisk>s.workerRisk+.01)
   issues.push('Invalid result '+s.id);
 return issues;
}
function markdown(r){
 const o=['## Read-only Safe plan investigation','',
 r.totalMatches+' actual matches (expected '+r.expected+'). '+r.methodology,'',
 '### Elite skill: same workers, all five plans','',
 '| Worker | Plan | Stars | Stamina | Player risk | Performed risk | High-risk | Botches | Late distinct | Earned covers |',
 '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const [w] of r.workers)for(const plan of PLANS){
  const x=r.matched.find(x=>x.id===w+'/elite/'+plan);
  o.push('| '+w+' | '+plan+' | '+x.stars+' | '+x.stamina+
   ' | '+x.workerRisk+' | '+x.performedRisk+' | '+x.highRisk+
   ' | '+x.botches+' | '+x.lateDistinct+' | '+x.earnedScheduled+' |');
 }
 o.push('','### Safe only, by skill and match length','',
 '| Tier | Min | Stars | Stamina | Player risk | Opponent risk | Botches | Late distinct | Earned covers |',
 '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
 for(const [tier] of TIERS)for(const minutes of LENGTHS){
  const x=r.duration.find(x=>x.id===tier+'/'+minutes+'/safe');
  o.push('| '+tier+' | '+minutes+' | '+x.stars+' | '+x.stamina+
   ' | '+x.workerRisk+' | '+x.opponentRisk+' | '+x.botches+
   ' | '+x.lateDistinct+' | '+x.earnedScheduled+' |');
 }
 const avg=(rows,key)=>round(rows.reduce((n,x)=>n+x[key],0)/rows.length);
 o.push('','### Synthetic fatigue: four workers, same seeds','',
 '| Prior fatigue | Plan | Stars | Bell stamina | Player risk | Botches |',
 '|---|---|---:|---:|---:|---:|');
 for(const fat of [4,55])for(const plan of PLANS){
  const rows=r.fatigue.filter(x=>x.id.includes('/'+fat+'/'+plan));
  o.push('| '+fat+' | '+plan+' | '+avg(rows,'stars')+' | '+
  avg(rows,'stamina')+' | '+avg(rows,'workerRisk')+' | '+avg(rows,'botches')+' |');
 }
 const risks={};for(const x of r.matched.filter(x=>x.id.endsWith('/safe')))
  for(const item of x.topRisk)risks[item.id]=(risks[item.id]||0)+item.count;
 o.push('','### High-risk events actually selected during Safe','',
  top(risks,15).map(x=>x.id+': '+x.count).join('; '),'',
  'A risk:true flag may mark a setup. Risky move events are not proof of injuries.',
  '### Hard errors: '+(failures(r).length?failures(r).join('; '):'none'));
 return o.join('\n');
}
if(require.main===module){
 try{
  const r=capture(process.argv[2]?Number(process.argv[2]):4);
  if(process.argv.includes('--json-file'))
   require('node:fs').writeFileSync('safe-plan-audit.json',JSON.stringify(r,null,2)+'\n');
  console.log(process.argv.includes('--json')?JSON.stringify(r):markdown(r));
  if(failures(r).length)process.exitCode=1;
 }catch(e){console.error(e.stack);process.exitCode=1;}
}
module.exports={capture,failures,markdown};
