'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}};vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningDialogue:L,OfficePromoIdentity:I,OfficeSheets:S}=root;
const eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b)),clone=x=>JSON.parse(JSON.stringify(x));
const counts=[{owners:0,fragments:0,unique:new Set(),lines:0,reuse:0},{owners:0,fragments:0,unique:new Set(),lines:0,reuse:0}];
const noBank=[],topics=['risk','finish','effort','impact','familiarity','layout'];
for(const w of D.ALL){
 const banks=promoBanks(I.bankId(w));const ids=[L.capture(w,banks),L.capture(w,banks,2)];
 if(!ids[1].fragments.length)noBank.push(w.id);
 for(let version=0;version<2;version++){
  const id=ids[version],c=counts[version];if(id.fragments.length)c.owners++;c.fragments+=id.fragments.length;
  for(const f of id.fragments)assert.ok(f.id.startsWith(id.bankOwner+'.'));
  for(let k=0;k<12;k++)for(const stance of ['accept','reserved','counter']){
   const pt={v:1,cid:'audit',objective:'opening',title:'Opening advantage',requester:'w',actorId:w.id,partnerId:'partner',original:'wristlock',alternative:'arm drag',topic:topics[k%topics.length],stances:{w:stance,f:stance}};
   const used=[];
   for(const turn of ['request','resolution']){
    const line=L.compose(id,pt,turn,'w','audit-'+k,{used});assert.ok(line);
    eq(line,L.compose(clone(id),clone(pt),turn,'w','audit-'+k,{used}));
    assert.equal(line.stance,turn==='request'?'request':stance);
    if(line.bankReuse){assert.ok(id.fragments.some(f=>f.id===line.id));c.reuse++;}
    assert.ok(!/[{}<>]/.test(line.text));assert.ok(line.text.includes('arm drag'));
    used.push(line.id);if(line.prefix)used.push('prefix:'+line.prefix);
    c.unique.add(line.text);c.lines++;
   }
  }
 }
}
assert.ok(counts[1].owners>=60,'reviewed bank owners '+counts[1].owners);
assert.ok(counts[1].unique.size>counts[0].unique.size*1.5,'body variety gain');
assert.ok(counts[1].reuse>counts[0].reuse*2,'direct bank reuse gain');
const w=D.ALL.find(w=>w.id==='nova');
const unsafe={v:1,owner:w.id,rows:[['bad','push','acknowledge','w','respect','I already won this match. Fine.',null],['context','push','acknowledge','w','respect','Fair.',null,{minMeetings:3}],['wrong','open','swagger','w','opening','Fair.',null]]};
assert.equal(L.capture(w,[unsafe],2).fragments.length,0);
const rookie=L.capture({id:'academy-mp6c-test',style:'Technical',voice:'Measured and methodical'},[],2);assert.equal(rookie.v,2);assert.equal(rookie.identitySource,'generated');
let rooms=0,live=0,liveReuse=0;const liveOwners=new Set(),liveTopics={};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp6c-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const banks=promoBanks(I.bankId(w),I.bankId(f));
 const opts={structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true,planningDialogue:true,planningBanks:banks};
 const newer=R.begin(c,w,f,p,opts),older=R.begin(c,w,f,p,opts);
 // A saved MP6B room retains the original identity schema and topic policy.
 older.planningDialogue={v:1,identities:{w:L.capture(w,banks),f:L.capture(f,banks)}};
 for(const room of [newer,older]){room.queue=['structure_huddle'];R.act(room,'plan_'+plan);R.act(room,'board_ok');}
 const old=L.readHuddle(older),fresh=L.readHuddle(newer);
 if(fresh){
  assert.ok(old);assert.equal(old.lines.request.v,1);assert.equal(fresh.lines.request.v,2);
  eq(fresh,L.readHuddle(clone(newer)));eq(old,L.readHuddle(clone(older)));
  assert.equal(new Set(Object.values(fresh.lines).map(l=>l.id)).size,4);
  for(const l of Object.values(fresh.lines))if(l.bankReuse){liveReuse++;liveOwners.add(l.actorId);}
  liveTopics[fresh.point.topic]=(liveTopics[fresh.point.topic]||0)+1;live++;
 }
 eq(R.options(newer),R.options(older));
 for(const opt of R.options(newer)){
  const a=clone(newer),b=clone(older);R.act(a,opt.id);R.act(b,opt.id);
  eq(a.mood,b.mood);eq(a.structureBoard,b.structureBoard);
  assert.equal(a.finish,b.finish);assert.equal(a.board.finish.route,b.board.finish.route);
 }
 rooms++;
}
assert.equal(rooms,80);assert.ok(live>0&&liveReuse>0);
console.log('PASS MP6C: '+JSON.stringify(counts.map(c=>({...c,unique:c.unique.size})))+'; uncovered '+JSON.stringify(noBank)+'; '+live+' live huddles, '+liveReuse+' bank uses from '+liveOwners.size+' owners; topics '+JSON.stringify(liveTopics)+'; v1 replay and decision parity.');
