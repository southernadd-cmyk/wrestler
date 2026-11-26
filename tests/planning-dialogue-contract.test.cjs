'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core,promoBanks}=require('./_source.cjs');
const root={addEventListener(){}};vm.runInNewContext(core,{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:R,OfficePlanningDialogue:L,OfficePromoIdentity:I,OfficeSheets:S}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const identities=new Map(),families=new Set();let fragments=0,bankOwners=0;
for(const w of D.ALL){
 const banks=promoBanks(I.bankId(w)),before=JSON.stringify(banks),identity=L.capture(w,banks);
 assert.ok(identity);assert.equal(identity.id,w.id);assert.equal(identity.delivery,I.wrestler(w).delivery);
 eq(identity,L.capture(clone(w),clone(banks)));assert.equal(JSON.stringify(banks),before);
 identities.set(w.id,identity);families.add(identity.family);
 fragments+=identity.fragments.length;if(identity.fragments.length)bankOwners++;
 assert.ok(identity.fragments.every(f=>f.id.startsWith(identity.bankOwner+'.')));
}
assert.equal(identities.size,D.ALL.length);assert.ok(families.size>=5);assert.ok(fragments>0);
const academy={id:'academy-mp6a-test',style:'Technical',voice:'Measured and methodical'};
const rookie=L.capture(academy,[]);assert.equal(rookie.identitySource,'generated');assert.equal(rookie.bankOwner,academy.id);eq(rookie,L.capture(clone(academy),[]));
const nova=D.ALL.find(w=>w.id==='nova'),mara=D.ALL.find(w=>w.id==='mara');
assert.equal(L.capture(nova,promoBanks('mara')).fragments.length,0);
const fake={v:1,owner:nova.id,rows:[['fake','push','acknowledge','w','respect','I already won this match. Nothing can change that.',null]]};
assert.equal(L.capture(nova,[fake]).fragments.length,0);
const fixture={v:1,cid:'fixture',objective:'one',title:'Opening advantage',requester:'w',actorId:nova.id,partnerId:mara.id,original:'wristlock',alternative:'arm drag',topic:'layout',stances:{w:'accept',f:'accept'}};
const first=L.compose(identities.get(mara.id),fixture,'response','f','seed');
assert.ok(first.bankReuse);assert.ok(first.source.startsWith('bank:mara.'));
const denied=L.compose(identities.get(mara.id),{...fixture,stances:{w:'accept',f:'counter'}},'response','f','seed');
assert.equal(denied.bankReuse,false);assert.equal(denied.stance,'counter');
assert.equal(L.compose(identities.get(nova.id),fixture,'response','f','seed'),null);
assert.equal(L.compose(identities.get(nova.id),{...fixture,topic:'invented'},'request','w','seed'),null);
let rooms=0,subjects=0,lines=0,reused=0;const topics={};
for(const structure of S.STRUCTURES.catalogue())for(const lead of ['w','f'])for(const plan of ['story','technical','brawl','spots','safe'])for(let j=0;j<2;j++){
 const w=D.ALL[(rooms*7)%D.ALL.length],f=D.ALL.find(x=>x.id!==w.id&&D.divisionOf(x)===D.divisionOf(w)),p=D.PROMOS[0];
 const c={id:'mp6a-'+rooms,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:j?'win_clean':'lose_clean',minutes:12,eventAbs:80,feudHeat:0,purse:360};
 const st=R.begin(c,w,f,p,{structure:{id:structure.id,lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true});
 st.queue=['structure_huddle'];R.act(st,'plan_'+plan);R.act(st,'board_ok');const before=JSON.stringify(st);
 const point=L.subject(st);
 if(st.structureTalk?.proposalResponse){
  assert.ok(point);subjects++;topics[point.topic]=(topics[point.topic]||0)+1;
  const requester=point.requester,partner=requester==='w'?'f':'w';
  for(const [turn,side] of [['request',requester],['response',partner],['resolution',requester],['resolution',partner]]){
   const identity=identities.get(st[side].id),line=L.compose(identity,point,turn,side,st.seed);
   assert.ok(line&&line.text);assert.equal(line.actorId,st[side].id);assert.equal(line.topic,point.topic);
   eq(line,L.compose(clone(identity),clone(point),turn,side,st.seed));
   assert.ok(!/[{}<>]/.test(line.text));assert.ok(!line.text.includes(c.finish));assert.ok(!line.bankReuse||line.stance==='accept');
   const next=L.compose(identity,point,turn,side,st.seed,{used:[line.id]});assert.notEqual(next.id,line.id);
   lines++;if(line.bankReuse)reused++;
  }
  const blocked=clone(st);blocked.limits.banIds.push(st.structureTalk.alternative.action);assert.equal(L.subject(blocked),null);
 }else assert.equal(point,null);
 assert.equal(JSON.stringify(st),before);rooms++;
}
assert.equal(rooms,80);assert.ok(subjects>0&&lines===subjects*4);
console.log('PASS MP6A: '+identities.size+' identities, '+families.size+' delivery families, '+bankOwners+' owners with '+fragments+' reviewed fragments; '+subjects+' real huddles, '+lines+' composed lines, '+reused+' bank reuses; topics '+JSON.stringify(topics)+'; exact replay, no mutation.');
