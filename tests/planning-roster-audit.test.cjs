'use strict';
// MP0B: current production planning, no fuzzy policy or fabricated dialogue.
// Run node tests/planning-roster-audit.test.cjs; optionally set
// PLANNING_AUDIT_JSON to a local filename to retain all sampled transcripts.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeAcademy:A,OfficeGame:G,OfficeWorldV4:V,OfficeRoom:R,OfficeSheets:S,OfficeMatch:M}=root;
 // Load the dormant model only in this audit. Production still uses legacy policy.
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'..','assets','js','planning-fuzzy.js'),'utf8'),{window:root,Math,JSON});
const P=root.OfficePlanningFuzzy,model=P.behaviourModel,outputs=[...model.outputs];
assert.equal(outputs.length,8);assert.equal(model.rules.length,79);
const clone=x=>JSON.parse(JSON.stringify(x));
const inc=(o,k,n=1)=>o[k]=(o[k]||0)+n;
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[“”‘’"'.,!?;:—–-]/g,' ').replace(/\s+/g,' ').trim();
G.fresh();const career=G.S;career.seed=47;career.careerSeed=47;
const veterans=D.ALL.slice(),rookies=[];
// Same actual intake fixture as the promo roster audit. This is synthetic
// career setup, not a claim that the 200 identities coexist in a live season.
for(let season=2;season<=40&&rookies.length<A.REGISTER.length;season++){
 career.season=season;
 if(season>2){
  for(const div of ['men','women']){
   const active=D.ALL.filter(w=>D.divisionOf(w)===div&&career.worldV4.contracts[w.id]?.owner!=='retired').slice(0,3);
   for(const w of active){career.worldV4.contracts[w.id].owner='retired';career.free=career.free.filter(f=>f.id!==w.id);}
  }
  V.activate(career);
 }
 rookies.push(...A.intake(career,season));
}
assert.equal(veterans.length,80);assert.equal(rookies.length,120);
const roster=[...veterans,...rookies];assert.equal(new Set(roster.map(w=>w.id)).size,200);
const structures=S.STRUCTURES.catalogue().map(x=>x.id);
const plans=['story','technical','brawl','spots','safe'];
const finishes=['win_clean','lose_clean','win_dirty','lose_protected'];
const durations=[8,12,18];
const clean=/undefined|NaN|\{(?:move|them|alt|orig|fam|goal)\}|\[object Object\]/;
const bucket=()=>({meetings:0,focusLines:0,withinRepeats:0,rollingRepeats:0,objections:0,decisions:0,named:0,open:0,resumes:0,consentSum:0,consentMin:100,consentMax:0,reviewRepairs:0,actions:{},situations:{},discussion:{},lines:new Set()});
const groups={all:bucket(),established:bucket(),academy:bucket(),w:bucket(),f:bucket()};
const byStructure=Object.fromEntries(structures.map(k=>[k,bucket()]));
const byPlan=Object.fromEntries(plans.map(k=>[k,bucket()]));
const owners=new Map(),history=new Map(),coverage={},transcripts=[];

// MP3: focus-only sampling gives each identity four meetings. Decision-stage
// samples are length-weighted; final snapshots separately balance identities.
const shadowStages=new Map(),shadowFinal=new Map(),shadowOwners=new Map();
const ruleUse=Object.fromEntries(model.rules.map(r=>[r.id,{output:r.output,count:0,activation:0,weight:0,share:0}]));
const cueUse={},inputMissing={},counterfactuals={},shadowMeta={samples:0,finals:0,resumes:0};
const rounded=n=>Math.round(n*1000)/1000;
const addTo=(map,key,scores)=>{if(!map.has(key))map.set(key,[]);map.get(key).push(outputs.map(k=>scores[k]));};
function shadow(snapshot,st,spec,final=false){
 const before=JSON.stringify(st),obs=P.behaviour(snapshot,st,spec.side);
 assert.equal(JSON.stringify(st),before,'shadow changed room');
 assert.equal(obs.observation.actorId,st[spec.side].id);
 for(const out of outputs){
  const v=obs.scores[out],fired=obs.fired[out];
  assert.ok(Number.isFinite(v)&&v>=0&&v<=100,'invalid shadow score '+out);
  assert.ok(fired.length>0,'unsupported roster output '+out);
  const total=fired.reduce((a,r)=>a+r.weight,0);
  for(const r of fired){
   const u=ruleUse[r.id];assert.ok(u&&u.output===out);
   u.count++;u.activation+=r.activation;u.weight+=r.weight;u.share+=r.weight/total;
  }
 }
 for(const k of Object.keys(obs.cues))inc(cueUse,k);
 for(const [k,v] of Object.entries(obs.observation.values))if(v===null)inc(inputMissing,k);
 shadowMeta.samples++;
 addTo(shadowStages,final?'done':st.stage,obs.scores);
 if(final){
  shadowMeta.finals++;
  addTo(shadowFinal,'all',obs.scores);
  addTo(shadowFinal,spec.group,obs.scores);
  addTo(shadowFinal,'side:'+spec.side,obs.scores);
  addTo(shadowFinal,'structure:'+spec.structure,obs.scores);
  addTo(shadowFinal,'plan:'+spec.plan,obs.scores);
  addTo(shadowOwners,obs.observation.actorId,obs.scores);
  // Matched numerical interventions on the same observed facts; no
  // room mutation, no invented history, no claim about actual decisions.
  for(const [axis,lo,hi,out,direction] of [
   ['consent',20,95,'cooperation',1],['ego',20,90,'assertiveness',1],
   ['ego',20,90,'ambition',1],['ego',20,90,'protectiveness',1],
   ['fatigue',0,90,'caution',1],['fatigue',0,90,'improvisation',-1]
  ]){
   const key=axis+'->'+out;
   const a=model.evaluate({...obs.observation.values,[axis]:lo},obs.cues).scores[out];
   const b=model.evaluate({...obs.observation.values,[axis]:hi},obs.cues).scores[out];
   const delta=(b-a)*direction;
   assert.ok(delta>0,'unexpected matched response '+key);
   const v=counterfactuals[key]??={n:0,sum:0,min:Infinity,max:-Infinity};
   v.n++;v.sum+=delta;v.min=Math.min(v.min,delta);v.max=Math.max(v.max,delta);
  }
 }
 return obs;
}
function stats(values){
 const a=[...values].sort((x,y)=>x-y),n=a.length;
 const mean=a.reduce((s,x)=>s+x,0)/n;
 const pct=q=>a[Math.floor((n-1)*q)];
 return {n,mean:rounded(mean),sd:rounded(Math.sqrt(a.reduce((s,x)=>s+(x-mean)**2,0)/n)),
  min:rounded(a[0]),p10:rounded(pct(.1)),median:rounded(pct(.5)),p90:rounded(pct(.9)),max:rounded(a[n-1])};
}
function distributions(map){
 return Object.fromEntries([...map].map(([key,vecs])=>[key,Object.fromEntries(outputs.map((out,i)=>[out,stats(vecs.map(v=>v[i]))]))]));
}
const meanVector=vecs=>outputs.map((_,i)=>vecs.reduce((s,v)=>s+v[i],0)/vecs.length);
const distance=(a,b)=>Math.sqrt(a.reduce((s,x,i)=>s+(x-b[i])**2,0)/a.length);
function separation(){
 const means=[...shadowOwners].map(([id,v])=>({id,mean:meanVector(v),within:stats(v.map(x=>distance(x,meanVector(v)))).mean}));
 const nearest=means.map(a=>({id:a.id,d:Math.min(...means.filter(b=>a.id!==b.id).map(b=>distance(a.mean,b.mean)))}));
 const correlation={};
 for(let i=0;i<outputs.length;i++)for(let j=i+1;j<outputs.length;j++){
  const x=means.map(v=>v.mean[i]),y=means.map(v=>v.mean[j]),mx=x.reduce((s,v)=>s+v,0)/x.length,my=y.reduce((s,v)=>s+v,0)/y.length;
  const num=x.reduce((s,v,k)=>s+(v-mx)*(y[k]-my),0);
  const den=Math.sqrt(x.reduce((s,v)=>s+(v-mx)**2,0)*y.reduce((s,v)=>s+(v-my)**2,0));
  correlation[outputs[i]+'|'+outputs[j]]=den?rounded(num/den):null;
 }
 return {nearest:stats(nearest.map(v=>v.d)),within:stats(means.map(v=>v.within)),
  nearestUnderFive:nearest.filter(v=>v.d<5).length,correlation,
  ownerMeans:means.map(v=>({id:v.id,mean:v.mean.map(rounded),within:v.within}))};
}

function invalid(st,b){return b?.action&&(b.conflict||R.banned(st,b.action)||!R.legal(b.action,st[b.owner],st[b.owner==='w'?'f':'w']));}
function choose(st,spec){
 const options=R.options(st);
 assert.ok(options.length,'no options at '+st.stage);
 const take=id=>options.find(o=>o.id===id);
 if(st.stage==='plan')return take('plan_'+spec.plan);
 if(st.stage==='board'){
  // Keep the default pencil marks except where the real review requires repair.
  const bad=Object.entries(st.structureBoard||{}).find(([,b])=>invalid(st,b));
  if(bad)return take('objective_'+bad[0]+'_open');
  return take('board_ok');
 }
 if(st.stage==='review')return take('review_ok')||take('review_edit');
 if(st.stage==='curtain')return take('talk_none')||options[0];
 if(st.stage==='scene'){
  const id=st.queue[st.at];
  if(id==='structure_huddle')return take(['keep','revise','open'][spec.choice])||take('open')||options[0];
  if(id==='structure_objection')return take('replace')||take('open')||options[0];
  // Sample actual available incident decisions rather than forcing a queue.
  return options[(spec.index+st.at+spec.choice)%options.length];
 }
 return options[0];
}
function play(spec,w,f,p){
 const booking={id:'mp0b-'+spec.index,wid:w.id,rid:f.id,pid:p.id,slot:spec.index%2?'main':'mid',finish:spec.finish,minutes:spec.minutes,eventAbs:100+spec.index,feudHeat:0,purse:360};
 const st=R.begin(booking,w,f,p,{structure:{id:spec.structure,lead:spec.lead},structurePlanning:true});
 const careerBefore=JSON.stringify(career),roomBefore=JSON.stringify(st);
 const evidence=P.capture(st,w,f,career);
 assert.equal(JSON.stringify(career),careerBefore,'capture changed career');
 assert.equal(JSON.stringify(st),roomBefore,'capture changed room');
 const actions=[],choices=[];let saved=null,savedEvidence=null,resumeAt=0,repairs=0;
 for(let n=0;n<32&&st.stage!=='done';n++){
  const option=choose(st,spec);
  assert.ok(option,'policy could not resolve '+st.stage+' '+booking.id);
  const inferred=shadow(evidence,st,spec);
  if(spec.replay&&!saved&&(st.stage==='scene'||st.stage==='review')){
   saved=clone(st);savedEvidence=clone(evidence);resumeAt=actions.length;
   assert.equal(JSON.stringify(P.behaviour(savedEvidence,saved,spec.side)),JSON.stringify(inferred),'resume inference mismatch');
  }
  if(option.id==='review_edit')repairs++;
  choices.push({stage:st.stage,situation:st.stage==='scene'?st.queue[st.at]:null,id:option.id});
  actions.push(option.id);R.act(st,option.id);
 }
 assert.equal(st.stage,'done','bounded meeting '+booking.id);
 const sheet=st.sheet;
 assert.ok(sheet.signed&&sheet.confirmed&&sheet.structurePlan);
 assert.equal(sheet.finish,booking.finish,'contract outcome changed');
 assert.ok(M.FINISH_ROUTES[booking.finish].some(r=>r.id===sheet.finishRoute),'invalid booked finish route');
 assert.equal(sheet.structurePlan.finishRoute,sheet.finishRoute);
 assert.equal(sheet.workerConsent,R.consent(st,'w'));assert.equal(sheet.opponentConsent,R.consent(st,'f'));
 assert.ok(sheet.workerConsent>=20&&sheet.workerConsent<=95&&sheet.opponentConsent>=20&&sheet.opponentConsent<=95);
 assert.equal(root.OfficeGraphKernel.validate(sheet.nodes).length,0);
 assert.doesNotMatch(st.log.map(e=>e.text).join('\n'),clean);
 for(const b of Object.values(st.structureBoard||{}))assert.ok(!invalid(st,b),'prohibited signed objective '+booking.id);
 const finalInference=shadow(evidence,st,spec,true);
 if(saved){
  for(const id of actions.slice(resumeAt))R.act(saved,id);
  assert.equal(JSON.stringify(saved.sheet),JSON.stringify(sheet),'resume sheet mismatch');
  assert.equal(JSON.stringify(saved.log),JSON.stringify(st.log),'resume transcript mismatch');
  assert.equal(JSON.stringify(P.behaviour(savedEvidence,saved,spec.side)),JSON.stringify(finalInference),'final inference replay mismatch');
  shadowMeta.resumes++;
 }
 return {st,sheet,choices,repairs,replayed:!!saved,booking};
}
for(let i=0;i<roster.length;i++){
 const focus=roster[i],peers=roster.filter(w=>w.id!==focus.id&&D.divisionOf(w)===D.divisionOf(focus));
 for(let j=0;j<4;j++){
  const index=i*4+j,side=(i+j)%2?'f':'w',other=peers[(i*7+j*13)%peers.length];
  const spec={index,side,group:i<80?'established':'academy',structure:structures[j],lead:(Math.floor(i/2)+j)%2?'w':'f',plan:plans[(i+j)%plans.length],finish:finishes[(i+j)%finishes.length],minutes:durations[(i+j)%3],choice:(i+j)%3,replay:j===0};
  const w=side==='w'?focus:other,f=side==='f'?focus:other,p=D.PROMOS[(i+j)%D.PROMOS.length];
  const {st,sheet,choices,repairs,replayed,booking}=play(spec,w,f,p);
  const group=i<80?'established':'academy';
  if(!owners.has(focus.id))owners.set(focus.id,bucket());
  const bins=[groups.all,groups[group],groups[side],byStructure[spec.structure],byPlan[spec.plan],owners.get(focus.id)];
  const seen=new Set(),prior=history.get(focus.id)||new Set(),focusLog=st.log.filter(e=>e.side===side);
  const named=Object.values(st.structureBoard||{}).filter(b=>b.action).length;
  const open=Object.values(st.structureBoard||{}).filter(b=>!b.action).length;
  const consent=side==='w'?sheet.workerConsent:sheet.opponentConsent;
  for(const b of bins){
   b.meetings++;b.decisions+=choices.length;b.named+=named;b.open+=open;b.resumes+=Number(replayed);b.reviewRepairs+=repairs;
   b.consentSum+=consent;b.consentMin=Math.min(b.consentMin,consent);b.consentMax=Math.max(b.consentMax,consent);
   inc(b.discussion,sheet.structureDiscussion?.decision||'none');
   for(const c of choices){inc(b.actions,c.id);if(c.situation)inc(b.situations,c.situation);}
  }
  for(const e of focusLog){
   const key=norm(e.text);
   for(const b of bins){b.focusLines++;b.lines.add(key);b.withinRepeats+=Number(seen.has(key));b.rollingRepeats+=Number(prior.has(key));b.objections+=Number(e.kind==='objection');}
   seen.add(key);
  }
  history.set(focus.id,new Set([...prior,...seen]));
  inc(coverage,[spec.structure,spec.plan,spec.lead,side].join('|'));
  if(process.env.PLANNING_AUDIT_JSON)transcripts.push({focus:focus.id,group,side,other:other.id,spec,booking,choices,log:st.log,sheet});
 }
}
assert.equal(groups.all.meetings,800);assert.equal(groups.established.meetings,320);assert.equal(groups.academy.meetings,480);
assert.equal(groups.w.meetings,400);assert.equal(groups.f.meetings,400);
assert.equal(owners.size,200);assert.equal(groups.all.resumes,200);
assert.equal(Object.keys(coverage).length,80,'every structure/plan/side receives both leads');
for(const b of Object.values(byStructure))assert.equal(b.meetings,200);
for(const b of Object.values(byPlan))assert.equal(b.meetings,160);
for(const b of owners.values())assert.equal(b.meetings,4);
const summary=b=>{const {lines,...rest}=b;return {...rest,uniqueText:lines.size,repeatPer100:b.focusLines?100*b.rollingRepeats/b.focusLines:0,meanConsent:b.meetings?b.consentSum/b.meetings:null};};
const result={policy:'legacy-planning-mp0b',groups:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,summary(v)])),structures:Object.fromEntries(Object.entries(byStructure).map(([k,v])=>[k,summary(v)])),plans:Object.fromEntries(Object.entries(byPlan).map(([k,v])=>[k,summary(v)])),coverage,owners:[...owners].map(([id,b])=>({id,...summary(b)}))};
console.log('MP0B planning baseline '+JSON.stringify({groups:result.groups,structures:result.structures,plans:result.plans,coverage}));
console.log('MP0B focus-owner coverage '+JSON.stringify(result.owners.map(({id,focusLines,uniqueText,withinRepeats,rollingRepeats,meanConsent,objections,discussion})=>({id,focusLines,uniqueText,withinRepeats,rollingRepeats,meanConsent,objections,discussion}))));
assert.equal(shadowMeta.finals,800);assert.equal(shadowMeta.resumes,200);
assert.equal(shadowMeta.samples,groups.all.decisions+800);
assert.equal(shadowOwners.size,200);
for(const v of shadowOwners.values())assert.equal(v.length,4);
for(const v of Object.values(counterfactuals))assert.equal(v.n,800);
const sep=separation();
const shadowResult={meta:shadowMeta,stages:distributions(shadowStages),final:distributions(shadowFinal),
 rules:Object.fromEntries(Object.entries(ruleUse).map(([k,v])=>[k,{output:v.output,count:v.count,meanActivation:v.count?rounded(v.activation/v.count):null,meanShare:v.count?rounded(v.share/v.count):null}])),
 cues:cueUse,missing:inputMissing,
 counterfactuals:Object.fromEntries(Object.entries(counterfactuals).map(([k,v])=>[k,{n:v.n,mean:rounded(v.sum/v.n),min:rounded(v.min),max:rounded(v.max)}])),
 separation:sep};
const {ownerMeans,...separationSummary}=sep;
console.log('MP3 shadow distributions '+JSON.stringify({meta:shadowMeta,stages:shadowResult.stages,final:shadowResult.final}));
console.log('MP3 rule utilisation '+JSON.stringify({rules:shadowResult.rules,cues:cueUse,missing:inputMissing,counterfactuals:shadowResult.counterfactuals,separation:separationSummary}));
console.log('MP3 owner means '+JSON.stringify(ownerMeans));
if(process.env.PLANNING_AUDIT_JSON)fs.writeFileSync(process.env.PLANNING_AUDIT_JSON,JSON.stringify({...result,transcripts,shadow:shadowResult},null,2));
console.log('PASS MP3: '+shadowMeta.samples+' focus observations, 800 final profiles, 200 replay checks and matched interventions; legacy planning unchanged.');
console.log('PASS MP0B: 800 real planning meetings, 200 focus identities and JSON resumes; no gameplay policy changed.');
