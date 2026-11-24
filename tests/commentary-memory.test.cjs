'use strict';
// The same booked fights and seeds must produce identical mechanics with
// and without the v0.6.1 broadcast patch. No new workflows are necessary.
// For a paired run: COMMENTARY_BASE_SHA=<pre-patch SHA> node tests/commentary-memory.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const cp=require('node:child_process');
const lab=require('../tools/graph-lab/core.js');
const files=['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-catalog.js','graph-narration.js','match-graph.js','match-commentary.js','match-engine.js'];
const dir=path.join(__dirname,'../assets/js');
function world(baseline){
 const root={};
 for(const file of files){
  const src=baseline&&file==='match-engine.js'?
   cp.execFileSync('git',['show',baseline+':assets/js/match-engine.js'],{
    encoding:'utf8',maxBuffer:2*1024*1024}):
   fs.readFileSync(path.join(dir,file),'utf8');
  vm.runInNewContext(src,{window:root,console,Math,Date,JSON},{filename:file});
 }
 root.OfficeRosterV4.enableProfiles();
 return {root,D:root.OfficeData,E:root.OfficeMatch};
}
const fresh=world(null),base=process.env.COMMENTARY_BASE_SHA?world(process.env.COMMENTARY_BASE_SHA):null;
const roster=lab.roster(fresh.D);
assert.ok(roster.length>=20);
const plans=['story','technical','brawl','spots','safe'];
function options(i,plan,minutes,seed){
 const w=roster[i%roster.length];
 const other=roster[(i*7+19)%roster.length];
 const f=other.id===w.id?roster[(i+1)%roster.length]:other;
 const o=lab.makeOptions(fresh.D,{wid:w.id,rid:f.id,plan,
  slot:minutes===8?'opener':minutes===12?'feature':'main',
  finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],seed});
 o.minutes=minutes;
 return o;
}
function mechanics(m){
 return JSON.stringify({
  events:m.graph.events,history:m.graph.history,outcome:m.outcome,
  graphOutcome:m.graph.outcome,final:m.final,
  stamina:[m.wSt,m.fSt],botches:m.botches,injuries:m.injuries,
  nearfalls:m.nearfalls,flow:m.graph.flow,finishRoute:m.finishRoute
 });
}
const exact=(m)=>Object.entries(m.log.reduce((a,l)=>{
 if(l.text.length>15)a[l.text]=(a[l.text]||0)+1;
 return a;
},{})).filter(([,n])=>n>=3);
const stats={bouts:0,paired:0,tripleOld:0,tripleNew:0,severeOld:0,severeNew:0,
 worst:[],frequentIds:{},repeatedByAction:{},repeatedByTexture:{},textureEvents:{},
 residualTextureExamples:[],genericOld:0,genericNew:0,remainingActionExamples:[]};
function run(o,tag){
 const m=lab.runMatch(fresh.root,JSON.parse(JSON.stringify(o)));
 assert.ok(m.done&&m.final,tag+' completes');
 assert.ok(m.log.every(l=>!/\bundefined\b|\bNaN\b/.test(l.text)),tag+' has valid booth text');
 assert.ok(!m.log.some(l=>/successful uses so far|It works for a fourth time/.test(l.text)),
  tag+' never narrates the old count loop');
 assert.ok(!m.log.some(l=>/after the play, hooks the far leg/.test(l.text)),
  tag+' never attributes a recorded knockdown to a generic play');
 assert.ok(!m.log.some(l=>/cannot complete the spectacular setup safely|drops back down from the turnbuckle as the counter threat develops|They separate in the corner and step out into open ring|There is confidence, and then there is giving an opponent time to think/.test(l.text)),
  tag+' does not replay the four known texture hotspots');
 for(const l of m.log)if(l.textureId)stats.textureEvents[l.textureId]=(stats.textureEvents[l.textureId]||0)+1;
 const repetition=exact(m);
 stats.bouts++;stats.tripleNew+=repetition.length;
 stats.severeNew+=repetition.filter(([,n])=>n>=5).length;
 for(const e of m.graph.events)stats.frequentIds[e.id]=(stats.frequentIds[e.id]||0)+1;
 for(const [line,n] of repetition){
  const id=m.log.find(l=>l.text===line)?.actionId||'(texture)';
  stats.repeatedByAction[id]=(stats.repeatedByAction[id]||0)+1;
  if(id!=='(texture)'&&stats.remainingActionExamples.length<50)
   stats.remainingActionExamples.push({tag,actionId:id,line,count:n});
  if(id==='(texture)'){
   stats.genericNew++;
   const texture=m.log.find(l=>l.text===line)?.textureId||'(unattributed)';
   stats.repeatedByTexture[texture]=(stats.repeatedByTexture[texture]||0)+1;
   if(stats.residualTextureExamples.length<70)
    stats.residualTextureExamples.push({tag,line,count:n,texture});
  }
 }
 for(const [line,n] of repetition.filter(([,n])=>n>=4).slice(0,3)){
  if(stats.worst.length<15){
   const matchLine=m.log.find(l=>l.text===line);
   stats.worst.push({tag,count:n,actionId:matchLine?.actionId||'(texture)',line});
  }
 }
 if(base){
  const b=lab.runMatch(base.root,JSON.parse(JSON.stringify(o)));
  assert.equal(mechanics(m),mechanics(b),'mechanical drift '+tag);
  const prior=exact(b);
  stats.paired++;stats.tripleOld+=prior.length;
  stats.severeOld+=prior.filter(([,n])=>n>=5).length;
  stats.genericOld+=prior.filter(([line])=>!b.log.some(l=>
   l.text===line&&l.actionId)).length;
 }
 return m;
}
// Exactly 240 paired bouts, across the five plans and 8/12/18-minute lengths.
// No generated CI matrix: this runs inside the existing PR Node smoke gate.
for(const plan of plans)for(const minutes of [8,12,18])
 for(let i=0;i<(base?16:3);i++){
  const seed=61001+i*53+minutes*997+plans.indexOf(plan)*1301;
  run(options(i*7+plans.indexOf(plan),plan,minutes,seed),
   plan+'-'+minutes+'-'+i);
 }
// Preserve the reported Story witness even when its original player pairing
// is not part of this regression grid.
const witness=run(options(11,'story',18,762728),'story-witness-762728');
assert.ok(!witness.log.some(l=>/\b(?:fifth|sixth|seventh|eighth|ninth)\b.*successful uses so far/i.test(l.text)));
// Typed submission rule: an idiom is not a cover or an imaginary submission.
const submission=fresh.E.create(options(1,'technical',12,55441));
submission.o.stip='submission';submission.stage='live';
fresh.E.note(submission,'You could hear a pin drop.');
assert.equal(submission.log.at(-1).text,'You could hear a pin drop.');
assert.equal(submission.log.at(-1).who,'pbp');
// Regression summary gives exact residual lines and graph-action frequencies,
// rather than claiming that a single aggregate figure explains repetition.
stats.frequentIds=Object.entries(stats.frequentIds).sort((a,b)=>b[1]-a[1]).slice(0,25);
stats.repeatedByAction=Object.entries(stats.repeatedByAction).sort((a,b)=>b[1]-a[1]).slice(0,25);
stats.repeatedByTexture=Object.entries(stats.repeatedByTexture).sort((a,b)=>b[1]-a[1]);
if(base){
 assert.ok(stats.tripleNew<=stats.tripleOld,
  'text-only patch must not raise exact triple-line repetition');
 assert.ok(stats.severeNew<=stats.severeOld,
  'text-only patch must not raise five-plus repeated lines');
 assert.ok(stats.genericNew<=stats.genericOld,
  'action-only follow-up must not worsen generic triple repeats');
 assert.equal(stats.tripleNew,0,
  'all fixed-seed action-specific triple repeats must be eliminated: '+
   JSON.stringify(stats.remainingActionExamples));
}
console.log('PASS commentary memory + matched mechanics: '+JSON.stringify(stats));
