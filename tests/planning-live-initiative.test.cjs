'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const profile=(s={})=>({scores:{assertiveness:50,protectiveness:50,ambition:50,caution:50,mentorship:50,flexibility:50,...s}});
const priority=(s,f)=>F.huddlePriority(profile(s),f).score;
assert.equal(F.huddlePriority(null,{}),null);
assert.ok(priority({caution:90},{safer:true})>priority({caution:10},{safer:true}));
assert.equal(priority({caution:90},{}),priority({caution:10},{}));
assert.ok(priority({ambition:90},{higherImpact:true})>priority({ambition:10},{higherImpact:true}));
assert.ok(priority({protectiveness:90},{supportsFinish:true})>priority({protectiveness:10},{supportsFinish:true}));
assert.ok(priority({mentorship:90},{developingPartner:true,simpler:true})>priority({mentorship:10},{developingPartner:true,simpler:true}));
assert.equal(priority({mentorship:90},{simpler:true}),priority({mentorship:10},{simpler:true}));
assert.equal(F.huddlePriority(profile({caution:90}),{safer:true}).reason,'safety');
assert.equal(F.huddlePriority(profile({ambition:90}),{higherImpact:true}).reason,'visibility');
let meetings=0,changed=0,choices=0;const reasons={},requesters=new Set();
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(meetings*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp4b-'+meetings,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{}};
 const old=R.begin(c,w,f,p,opts),live=R.begin(c,w,f,p,{...opts,planningInitiative:true});
 assert.equal(old.planningInitiative,undefined);assert.equal(live.planningInitiative,1);
 for(const st of [old,live]){st.queue=['structure_huddle'];R.act(st,'plan_'+plan);}
 eq(old.structureBoard,live.structureBoard);
 const before=clone(live);R.act(old,'board_ok');R.act(live,'board_ok');R.act(before,'board_ok');eq(live,before);
 const t=live.structureTalk,prior=old.structureTalk;
 assert.ok(t?.initiative);assert.equal(prior?.initiative,undefined);
 assert.ok(t.reactions);assert.ok(['w','f'].includes(t.by));
 requesters.add(t.by);reasons[t.reason]=(reasons[t.reason]||0)+1;
 assert.equal(live.structureBoard[t.objective].action,t.original.action);
 if(t.alternative){
  assert.equal(t.alternative.owner,t.by);assert.notEqual(t.alternative.action,t.original.action);
  assert.ok(!R.banned(live,t.alternative.action));
  assert.ok(R.legal(t.alternative.action,live[t.by],live[t.by==='w'?'f':'w']));
 }
 if(prior.objective!==t.objective||prior.alternative?.action!==t.alternative?.action)changed++;
 const options=R.options(live),snap=clone(live);R.view(live);R.options(live);eq(live,snap);
 for(const option of options){
  const a=clone(live),b=clone(live),route=a.board.finish.route;
  R.act(a,option.id);R.act(b,option.id);eq(a,b);
  assert.equal(a.finish,c.finish);assert.equal(a.board.finish.route,route);
  R.act(a,'review_ok');R.act(a,'talk_none');R.act(b,'review_ok');R.act(b,'talk_none');
  eq(a.sheet,b.sheet);assert.equal(a.sheet.finish,c.finish);assert.equal(a.sheet.finishRoute,route);
  assert.equal(a.sheet.structureDiscussion.objective,t.objective);
  choices++;
 }
 meetings++;
}
assert.equal(meetings,80);assert.ok(changed>0);assert.equal(requesters.size,2);
const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','ui.js'),'utf8');
assert.ok(ui.includes('opts.planningInitiative=true;'));
console.log('PASS MP4B: '+meetings+' huddles, '+changed+' changed proposals, '+choices+' signed choices; reasons '+JSON.stringify(reasons)+'; legal moves and exact replay.');
