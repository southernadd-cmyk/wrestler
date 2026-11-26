'use strict';
// MP0B: current production planning, no fuzzy policy or fabricated dialogue.
// Run node tests/planning-roster-audit.test.cjs; optionally set
// PLANNING_AUDIT_JSON to a local filename to retain all sampled transcripts.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeAcademy:A,OfficeGame:G,OfficeWorldV4:V,OfficeRoom:R,OfficeSheets:S,OfficeMatch:M}=root;
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
 const actions=[],choices=[];let saved=null,resumeAt=0,repairs=0;
 for(let n=0;n<32&&st.stage!=='done';n++){
  const option=choose(st,spec);
  assert.ok(option,'policy could not resolve '+st.stage+' '+booking.id);
  if(spec.replay&&!saved&&st.stage==='scene'){saved=clone(st);resumeAt=actions.length;}
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
 if(saved){
  for(const id of actions.slice(resumeAt))R.act(saved,id);
  assert.equal(JSON.stringify(saved.sheet),JSON.stringify(sheet),'resume sheet mismatch');
  assert.equal(JSON.stringify(saved.log),JSON.stringify(st.log),'resume transcript mismatch');
 }
 return {st,sheet,choices,repairs,replayed:!!saved,booking};
}
for(let i=0;i<roster.length;i++){
 const focus=roster[i],peers=roster.filter(w=>w.id!==focus.id&&D.divisionOf(w)===D.divisionOf(focus));
 for(let j=0;j<4;j++){
  const index=i*4+j,side=(i+j)%2?'f':'w',other=peers[(i*7+j*13)%peers.length];
  const spec={index,structure:structures[j],lead:(Math.floor(i/2)+j)%2?'w':'f',plan:plans[(i+j)%plans.length],finish:finishes[(i+j)%finishes.length],minutes:durations[(i+j)%3],choice:(i+j)%3,replay:j===0};
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
if(process.env.PLANNING_AUDIT_JSON)fs.writeFileSync(process.env.PLANNING_AUDIT_JSON,JSON.stringify({...result,transcripts},null,2));
console.log('PASS MP0B: 800 real planning meetings, 200 focus identities and JSON resumes; no gameplay policy changed.');
