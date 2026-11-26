'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningFuzzy:F,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const scores=(acceptance,reservations,counterproposal)=>({acceptance,reservations,counterproposal});
eq(F.proposalReply(scores(82,20,20),'requester'),{stance:'accept',mood:4});
eq(F.proposalReply(scores(82,20,20),'partner'),{stance:'accept',mood:2});
eq(F.proposalReply(scores(68,40,42),'partner'),{stance:'reserved',mood:-1});
eq(F.proposalReply(scores(48,65,65),'requester'),{stance:'counter',mood:-3});
eq(F.proposalReply(scores(48,65,65),'partner'),{stance:'counter',mood:-4});
assert.equal(F.proposalReply(scores(101,0,0),'partner'),null);
assert.equal(F.readHuddleProposal({}),null);
let meetings=0,assessed=0,choices=0,changed=0;
const stances={requester:{},partner:{}};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(meetings*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp5e-'+meetings,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true};
 const old=R.begin(c,w,f,p,opts),live=R.begin(c,w,f,p,{...opts,planningProposal:true});
 assert.equal(old.planningProposal,undefined);assert.equal(live.planningProposal,1);
 for(const st of [old,live]){st.queue=['structure_huddle'];R.act(st,'plan_'+plan);}
 eq(old.structureBoard,live.structureBoard);
 const before=clone(live);R.act(old,'board_ok');R.act(live,'board_ok');R.act(before,'board_ok');eq(live,before);
 const t=live.structureTalk,legacy=old.structureTalk;
 assert.equal(t.objective,legacy.objective);eq(t.alternative,legacy.alternative);eq(t.reactions,legacy.reactions);
 assert.equal(legacy.proposalResponse,undefined);
 const response=F.readHuddleProposal(t);
 if(t.alternative){
  assert.ok(response);
  assessed++;
  const tampered=clone(t);tampered.proposalResponse.by[t.by].mood=99;assert.equal(F.readHuddleProposal(tampered),null);
  for(const side of ['w','f']){
   const role=side===t.by?'requester':'partner',row=response.by[side];
   stances[role][row.stance]=(stances[role][row.stance]||0)+1;
   eq({stance:row.stance,mood:row.mood},F.proposalReply(row.scores,role));
  }
  const denied=clone(live);denied.limits.banIds.push(t.alternative.action);
  assert.ok(!R.options(denied).some(o=>o.id==='revise'));
 }
 const options=R.options(live),snap=clone(live);R.options(live);R.view(live);eq(live,snap);
 eq(options.map(o=>o.id),R.options(old).map(o=>o.id));
 for(const option of options){
  const a=clone(live),b=clone(live),twin=clone(old),route=a.board.finish.route;
  R.act(a,option.id);R.act(b,option.id);R.act(twin,option.id);eq(a,b);
  eq(a.structureBoard,twin.structureBoard);
  const side=t.by,opp=side==='w'?'f':'w';
  if(option.id==='revise'&&response){
   assert.equal(a.mood[side]-twin.mood[side],response.by[side].mood-t.reactions.revise.requester);
   assert.equal(a.mood[opp]-twin.mood[opp],response.by[opp].mood-t.reactions.revise.partner);
   if(a.mood[side]!==twin.mood[side]||a.mood[opp]!==twin.mood[opp])changed++;
  }else eq(a.mood,twin.mood);
  assert.equal(a.finish,c.finish);assert.equal(a.board.finish.route,route);
  R.act(a,'review_ok');R.act(a,'talk_none');R.act(b,'review_ok');R.act(b,'talk_none');
  eq(a.sheet,b.sheet);assert.equal(a.sheet.finish,c.finish);assert.equal(a.sheet.finishRoute,route);
  choices++;
 }
 meetings++;
}
assert.equal(meetings,80);assert.ok(assessed>0&&changed>0);assert.ok(choices>=160);
const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','ui.js'),'utf8');assert.ok(ui.includes('opts.planningProposal=true;'));
console.log('PASS MP5E: '+meetings+' rooms; '+assessed+' explicit alternatives assessed; '+changed+' altered revise reactions; '+choices+' signed choices; stances '+JSON.stringify(stances)+'; exact replay, unchanged keep/open and contract parity.');
