'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficePromoFuzzy:F,OfficeData:D,OfficeAcademy:A,OfficeGame:G,OfficeWorldV4:V,OfficeMic:M,OfficePromoDirector:P}=root;
const clone=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const participant={irritation:35,composure:50,identity:{}};
const professional=F.selectionFacts({ego:25,pro:90,psych:85,mic:60,style:'Technical'});
const volatile=F.selectionFacts({ego:90,pro:25,psych:35,mic:60,style:'Brawl'});
const event={side:'f',beforeMeter:0,afterMeter:12,feudHeat:40,personal:true,spoke:true};
const p=F.emotionStep(professional,participant,event),v=F.emotionStep(volatile,participant,event);
assert.ok(v.irritation>p.irritation&&v.composure<p.composure,'personal challenge should hit volatile worker harder');
const calm=F.emotionStep(volatile,participant,{...event,afterMeter:0,personal:false,calming:true});
assert.ok(calm.irritation<participant.irritation&&calm.composure>participant.composure);
const bad=F.emotionStep(volatile,participant,{...event,side:'w',afterMeter:-12,landed:false,personal:false});
const good=F.emotionStep(volatile,participant,{...event,side:'w',afterMeter:12,landed:true,personal:false});
assert.ok(bad.irritation>good.irritation&&bad.composure<good.composure);
eq(participant,{irritation:35,composure:50,identity:{}});
assert.equal(F.emotionStep(volatile,participant,{...event,beforeMeter:undefined}),null);
for(const f of [professional,volatile])for(const side of ['w','f'])for(const landed of [true,false]){
 let previous=null;
 for(let x=0;x<=100;x+=.25){
  const part={...participant,irritation:x};
  const next=F.emotionStep(f,part,{...event,side,landed});
  for(const key of ['irritation','composure'])assert.ok(Number.isFinite(next[key])&&next[key]>=0&&next[key]<=100);
  assert.ok(Math.abs(next.irritation-x)<=22+1e-9&&Math.abs(next.composure-50)<=18+1e-9);
  if(previous)assert.ok(Math.abs(next.irritation-previous.irritation)<1&&Math.abs(next.composure-previous.composure)<1,'transition discontinuity');
  previous=next;
 }
}
// Test protected record/evidence path against exact original director policy.
for(const protection of [{case:{issue:'recorded'}},{claim:{hasEvidence:true}}]){
 const person={id:'p',ego:70,pro:80,mic:60,psych:55,style:'Technical'},opponent={...person,id:'f'};
 const d=P.begin(person,opponent,null,'faceoff'),old=clone(d);
 const state={core:{feudHeat:50,...protection},meter:12,authoredDialogue:{fuzzy:{v:1,emotion:1,w:F.selectionFacts(person),f:F.selectionFacts(opponent)}}};
 const rec={round:'answer',id:'personal',landed:true},log=[{side:'w',line:'Point.',swing:12}];
 P.observe(d,state,rec,log,0);P.observe(old,{...state,authoredDialogue:{}},rec,log,0);eq(d,old);
}
G.fresh();const s=G.S;s.seed=47;s.careerSeed=47;
const veterans=D.ALL.slice(),rookies=[];
for(let season=2;season<=40&&rookies.length<A.REGISTER.length;season++){
 s.season=season;
 if(season>2){
  for(const div of ['men','women'])for(const worker of D.ALL.filter(w=>D.divisionOf(w)===div&&s.worldV4.contracts[w.id]?.owner!=='retired').slice(0,3)){
   s.worldV4.contracts[worker.id].owner='retired';s.free=s.free.filter(f=>f.id!==worker.id);
  }
  V.activate(s);
 }
 rookies.push(...A.intake(s,season));
}
const roster=[...veterans,...rookies];assert.equal(roster.length,200);
let paired=0,resumes=0,trajectoryChanges=0,routeChanges=0,resultChanges=0,checked=0;
const summarize=()=>({turns:0,irritationSum:0,composureSum:0,irritationExtreme:0,composureExtreme:0,events:{},push:0});
const totals={before:summarize(),after:summarize()};
function play(st,policy,j){
 const a=totals[policy];let resumed=null;
 const trace=[];
 for(let step=0;st.stage!=='done';step++){
  assert.ok(step<12,'bounded scene');
  const round=M.ROUNDS[st.round].id,options=M.choices(st);
  const wanted=({open:j?'accusation':'proof',answer:j?'personal':'calm',push:j?'press':'acknowledge',close:'vow'})[round];
  const id=(options.find(x=>x.id===wanted)||options[0]).id;
  if(policy==='after'&&step===1&&j===0){resumed=clone(st);resumes++;}
  const prior=[st.director.player,st.director.opponent].map(x=>({composure:x.composure,irritation:x.irritation}));
  M.choose(st,id);if(resumed)M.choose(resumed,id);
  for(const [i,p] of [st.director.player,st.director.opponent].entries()){
   assert.ok(Number.isFinite(p.composure)&&p.composure>=0&&p.composure<=100);
   assert.ok(Number.isFinite(p.irritation)&&p.irritation>=0&&p.irritation<=100);
   if(policy==='after'&&!st.core.case&&!st.core.claim?.hasEvidence){
    assert.ok(Math.abs(p.composure-prior[i].composure)<=18+1e-9);
    assert.ok(Math.abs(p.irritation-prior[i].irritation)<=22+1e-9);checked++;
   }
   a.turns++;a.irritationSum+=p.irritation;a.composureSum+=p.composure;
   if(p.irritation>=85)a.irritationExtreme++;if(p.composure<=15)a.composureExtreme++;
  }
  trace.push([round,st.director.player.composure,st.director.player.irritation,st.director.opponent.composure,st.director.opponent.irritation]);
 }
 if(resumed)eq(st,resumed);
 const result=M.result(st);assert.ok(result&&Number.isFinite(result.quality));
 const event=st.director.event?.kind||'none';a.events[event]=(a.events[event]||0)+1;
 if(st.steps.some(x=>x.round==='push'))a.push++;
 assert.equal(st.steps.filter(x=>x.round==='close').length,1);
 for(const e of st.log){
  assert.ok(!/\{[a-zA-Z_][a-zA-Z_0-9]*\}/.test(e.line),'unresolved token');
  if(e.semantic?.rookieFamilyBank===1){const prior=st.log[e.semantic.replyTo];assert.ok(prior&&prior.side!==e.side&&prior.semantic?.claim===e.semantic.claim);}
 }
 return trace;
}
for(const [i,worker] of roster.entries())for(let j=0;j<2;j++){
 const pool=roster.filter(x=>x.id!==worker.id&&D.divisionOf(x)===D.divisionOf(worker)),other=pool[(i+j*17)%pool.length];
 const w=j?other:worker,f=j?worker:other,p=D.PROMOS[(i+j)%D.PROMOS.length];
 const c={id:'f4-'+worker.id+'-'+j,wid:w.id,rid:f.id,pid:p.id,eventAbs:100+j,finish:j?'lose_clean':'win_clean',minutes:12,feudHeat:j?55:0};
 const opts={directed:true,formats:true,dialogue:true,authored:true,composition:true,semantic:true,fuzzy:true,banks:promoBanks(w.id,f.id)};
 const old=M.begin(c,w,f,null,null,p,opts),now=M.begin(c,w,f,null,null,p,{...opts,fuzzyEmotion:true});
 assert.equal(now.authoredDialogue.fuzzy.emotion,1);assert.equal(old.authoredDialogue.fuzzy.emotion,undefined);
 const legacy=clone(now);delete legacy.authoredDialogue.fuzzy.emotion;eq(legacy,old);
 const before=play(old,'before',j),after=play(now,'after',j);
 if(JSON.stringify(before)!==JSON.stringify(after))trajectoryChanges++;
 if(old.director.followup?.follow!==now.director.followup?.follow)routeChanges++;
 if(M.result(old).quality!==M.result(now).quality)resultChanges++;
 assert.equal(now.finish,c.finish);assert.equal(old.finish,c.finish);
 assert.equal(now.steps[0].id,old.steps[0].id);assert.equal(now.steps[1].id,old.steps[1].id);
 paired++;
}
assert.equal(paired,400);assert.equal(resumes,200);assert.ok(trajectoryChanges>0&&checked>0);
console.log('F4 EMOTION AUDIT '+JSON.stringify({paired,resumes,trajectoryChanges,routeChanges,resultChanges,checked,totals}));
console.log('PASS F4: bounded contextual emotion transitions, protected record parity, deterministic resume and unchanged booked finishes.');
