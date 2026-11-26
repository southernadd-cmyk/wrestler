'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const profile=(v)=>({scores:{assertiveness:v,protectiveness:v,flexibility:v,cooperation:v,improvisation:v,caution:v}});
assert.equal(F.huddleReaction(null,profile(50)),null);
const neutral=F.huddleReaction(profile(50),profile(50));
eq(neutral,{v:1,keep:{requester:-2,partner:0},revise:{requester:2,partner:-1},open:{requester:3,partner:-2}});
assert.ok(F.huddleReaction(profile(90),profile(50)).keep.requester<F.huddleReaction(profile(20),profile(50)).keep.requester);
assert.ok(F.huddleReaction(profile(50),profile(90)).revise.partner>F.huddleReaction(profile(50),profile(20)).revise.partner);
let meetings=0,choices=0;const seen=new Set();
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe']){
 const w=D.ALL[(meetings*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp4a-'+meetings,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:meetings%2?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true};
 const career={ambitions:{w:{[w.id]:{kind:'title',since:50,sat:20}}}};
 const before=JSON.stringify(career);
 const legacy=R.begin(c,w,f,p,opts),live=R.begin(c,w,f,p,{...opts,planningCareer:career});
 assert.equal(JSON.stringify(career),before);
 assert.equal(legacy.planningEvidence,undefined);assert.equal(live.planningEvidence.participants.w.id,w.id);
 for(const st of [legacy,live]){
  st.queue=['structure_huddle'];R.act(st,'plan_'+plan);
  R.act(st,'board_ok');
  assert.equal(st.stage,'scene');
 }
 const t=live.structureTalk,old=legacy.structureTalk;
 assert.ok(t.reactions);assert.equal(old.reactions,undefined);
 eq(t.original,old.original);eq(t.alternative,old.alternative);
 const options=R.options(live);
 eq(options.map(o=>o.id),R.options(legacy).map(o=>o.id));
 const snap=JSON.stringify(live);R.options(live);R.view(live);assert.equal(JSON.stringify(live),snap);
 seen.add(JSON.stringify(t.reactions));
 for(const option of options){
  const st=clone(live),resumed=clone(live),initial={...st.mood},side=t.by,opp=side==='w'?'f':'w',r=t.reactions[option.id],route=st.board.finish.route;
  // Reconciliation can adjust board mood separately. Verify the reaction
  // against a legacy twin, whose board settlement is otherwise identical.
  const twin=clone(legacy),legacyDelta={keep:{requester:-2,partner:0},revise:{requester:2,partner:-1},open:{requester:3,partner:-2}}[option.id];
  R.act(st,option.id);R.act(resumed,option.id);R.act(twin,option.id);
  eq(st,resumed);eq(st.structureBoard,twin.structureBoard);
  assert.equal(st.mood[side]-twin.mood[side],r.requester-legacyDelta.requester);
  assert.equal(st.mood[opp]-twin.mood[opp],r.partner-legacyDelta.partner);
  assert.equal(st.finish,c.finish);assert.equal(st.board.finish.route,route);
  R.act(st,'review_ok');R.act(st,'talk_none');
  R.act(resumed,'review_ok');R.act(resumed,'talk_none');
  eq(st.sheet,resumed.sheet);assert.equal(st.sheet.finish,c.finish);assert.equal(st.sheet.finishRoute,route);
  choices++;
 }
 meetings++;
}
assert.equal(meetings,40);assert.ok(choices>=80);assert.ok(seen.size>1,'reactions must vary');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),ui=fs.readFileSync(path.join(__dirname,'..','assets','js','ui.js'),'utf8');
assert.ok(html.indexOf('assets/js/psychology-fuzzy.js')<html.indexOf('assets/js/planning-fuzzy.js'));
assert.ok(html.indexOf('assets/js/planning-fuzzy.js')<html.indexOf('assets/js/agents-room.js'));
assert.ok(ui.includes('opts.planningCareer=S0;'));
console.log('PASS MP4A: '+meetings+' live huddles, '+choices+' choices, '+seen.size+' distinct reaction profiles, exact resume and legacy board/contract parity.');
