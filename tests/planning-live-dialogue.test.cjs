'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningDialogue:L,OfficePromoIdentity:I,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const plan={structureChoice:{id:'kings_road',lead:'w'},room:null},night={plan,stage:'prep'};
const token=L.beginLoad(night,plan,'a');assert.ok(token);assert.equal(night.stage,'meeting');
assert.equal(L.beginLoad(night,plan,'a'),null);
assert.equal(L.completeLoad(night,token,()=>true),true);
const stale=L.beginLoad(night,plan,'a');plan.structureChoice.lead='f';
assert.equal(L.completeLoad(night,stale,()=>true),false);
const another=L.beginLoad(night,plan,'a');night.stage='promo';
assert.equal(L.completeLoad(night,another,()=>true),false);
const old=L.beginLoad(night,plan,'a'),newer=L.beginLoad(night,plan,'b');
assert.equal(L.completeLoad(night,old,()=>true),false);assert.equal(night.planningLoading,newer);
assert.equal(L.completeLoad(night,newer,()=>false),false);
let rooms=0,live=0,lines=0,bankReuse=0,choices=0,offline=0;
const tagged=st=>st.log.filter(l=>l.planningDialogue),state=st=>{const c=clone(st);delete c.planningDialogue;delete c.structureTalk?.dialogue;delete c.log;return c;};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp6b-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true};
 const banks=j?promoBanks(I.bankId(w),I.bankId(f)):[];
 const a=R.begin(c,w,f,p,{...opts,planningDialogue:true,planningBanks:banks}),b=R.begin(c,w,f,p,opts);
 assert.equal(b.planningDialogue,undefined);assert.equal(a.planningDialogue.v,1);
 assert.equal(a.planningDialogue.identities.w.id,w.id);assert.equal(a.planningDialogue.identities.f.id,f.id);
 assert.ok(!JSON.stringify(a.planningDialogue).includes('"rows"'));
 for(const st of [a,b]){st.queue=['structure_huddle'];R.act(st,'plan_'+plan);R.act(st,'board_ok');}
 eq(state(a),state(b));const t=a.structureTalk,dialogue=L.readHuddle(a);
 if(t.proposalResponse){
  assert.ok(dialogue);live++;if(!j)offline++;
  assert.equal(tagged(a).length,2);assert.equal(tagged(b).length,0);
  eq(tagged(a).map(l=>l.planningDialogue.turn),['request','response']);
  eq(tagged(a).map(l=>l.planningDialogue.actorId),[a[t.by].id,a[t.by==='w'?'f':'w'].id]);
  assert.ok(!tagged(a).some(l=>l.planningDialogue.turn==='resolution'));
  for(const l of tagged(a)){lines++;if(l.planningDialogue.bankReuse)bankReuse++;}
  const corrupt=clone(a);corrupt.structureTalk.dialogue.lines.request.text='wrong';assert.equal(L.readHuddle(corrupt),null);
  const blocked=clone(a);blocked.limits.banIds.push(t.alternative.action);assert.equal(L.readHuddle(blocked),null);
 }else assert.equal(tagged(a).length,0);
 const snap=clone(a);R.options(a);R.view(a);eq(a,snap);eq(R.options(a),R.options(b));
 for(const opt of R.options(a)){
  const x=clone(a),y=clone(b),z=clone(a);R.act(x,opt.id);R.act(y,opt.id);R.act(z,opt.id);eq(x,z);eq(state(x),state(y));
  const entries=tagged(x).slice(tagged(a).length);
  if(dialogue&&opt.id==='revise'){
   assert.equal(entries.length,2);
   assert.ok(entries.every(l=>l.planningDialogue.turn==='resolution'));
   assert.equal(new Set(tagged(x).map(l=>l.planningDialogue.id)).size,4);
   for(const l of entries){lines++;if(l.planningDialogue.bankReuse)bankReuse++;}
  }else assert.equal(entries.length,0);
  assert.equal(x.finish,c.finish);assert.equal(x.board.finish.route,a.board.finish.route);
  R.act(x,'review_ok');R.act(y,'review_ok');R.act(z,'review_ok');
  R.act(x,'talk_none');R.act(y,'talk_none');R.act(z,'talk_none');
  eq(x.sheet,y.sheet);eq(x,z);choices++;
 }
 rooms++;
}
assert.equal(rooms,80);assert.ok(live>0&&offline>0&&bankReuse>0&&choices>=160);
const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','ui.js'),'utf8');
assert.ok(ui.includes('dialogue.loadPair(w,f)'));assert.ok(ui.includes('opts.planningDialogue=true;'));
console.log('PASS MP6B: '+rooms+' rooms; '+live+' live dialogues ('+offline+' offline); '+lines+' composed lines; '+bankReuse+' bank reuses; '+choices+' signed choices; exact replay, stale-load protection and unchanged decisions.');
