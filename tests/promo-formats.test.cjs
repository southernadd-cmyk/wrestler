'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(core,{window:root,localStorage,Date,Math,JSON,console});
const {OfficeMic:M,OfficeData:D,OfficePromoDirector:Dir,OfficeStory:{Graph},OfficeSigning:Signing}=root;
const clone=x=>JSON.parse(JSON.stringify(x)),stats={},angles={},counts={};
const deliveryOld=new Set(),deliveryNew=new Set();let deliveryCount=0,deliveryChanged=0,deliveryScenes=0;
const closeOld=new Set(),closeNew=new Set();let changedClose=0,comparedClose=0;
const crowdOld=new Set(),crowdNew=new Set();let oldRepeats=0,newRepeats=0,oldTotal=0,newTotal=0;
const norm=line=>line.replace(/Nova|Bell|Magnus|Graves|Mara|Vale/g,'<name>');
const w=D.ALL.find(x=>x.id==='nova'),f=D.ALL.find(x=>x.id==='magnus'),mouth=D.ALL.find(x=>x.id==='mara');
assert.ok(w&&f&&mouth);
for(let i=0;i<240;i++){
 const p=D.PROMOS[i%D.PROMOS.length],c={id:'format-'+i,wid:w.id,rid:f.id,pid:p.id,eventAbs:i+10,slot:'main',finish:i%2?'win_clean':'lose_clean',minutes:12,feudHeat:i%3===0?65:0};
 const opts={directed:true,formats:true,...(i%9===0?{mouth}:{})},s=M.begin(c,w,f,null,null,p,opts),fmt=s.director.format;
 const same=M.begin(c,w,f,null,null,p,opts);
 assert.equal(JSON.stringify(s),JSON.stringify(same),'selection and staging deterministic');
 assert.equal(s.director.format==='mouthpiece',!!opts.mouth);
 assert.equal(M.view(s).conversation.format,fmt);
 assert.ok(M.view(s).conversation.formatName);
 assert.equal(s.log[0].line,Dir.setup(s.director).prompt);
 assert.equal(s.log[1].line,Dir.setup(s.director).setting);
 const open=M.choices(s).map(o=>o.id);
 (angles[fmt]??=new Set()).add(open.join(','));
 assert.ok(open.length>=3);
 const previous=clone(s);delete previous.reactionStyle;
 const previousDelivery=clone(s);delete previousDelivery.deliveryStyle;
 const pattern=[];
 while(s.stage!=='done'){
  assert.ok(pattern.length<4);
  const round=M.ROUNDS[s.round].id,choices=M.choices(s);
  if(round==='close')assert.equal(choices.length,Graph.choices('close',s.core).length,'all valid promises still offered');
  const chosen=choices[(i+pattern.length)%choices.length].id,copy=clone(s);
  const oldClose=round==='close'?clone(s):null,at=s.log.length;
  if(oldClose){delete oldClose.closingVariety;M.choose(oldClose,chosen);}
  M.choose(s,chosen);M.choose(copy,chosen);M.choose(previous,chosen);M.choose(previousDelivery,chosen);
  if(oldClose){
   assert.equal(JSON.stringify(s.core),JSON.stringify(oldClose.core),'closing presentation cannot alter graph');
   for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature'])assert.equal(JSON.stringify(M.result(s)[k]),JSON.stringify(M.result(oldClose)[k]),'closing parity '+k);
   const a=s.log.slice(at).find(e=>e.side==='f'),b=oldClose.log.slice(at).find(e=>e.side==='f');
   if(a&&b){comparedClose++;closeNew.add(norm(a.line));closeOld.add(norm(b.line));if(a.line!==b.line){changedClose++;assert.ok(!s.speaker&&!s.core.case&&!s.core.claim?.hasEvidence);assert.ok(!/[{}]/.test(a.line));}}
  }
  assert.equal(JSON.stringify(s),JSON.stringify(copy),'serialized mid-promo resume exact');
  pattern.push(round);
 }
 assert.equal(pattern[0],'open');assert.equal(pattern[1],'answer');assert.equal(pattern.at(-1),'close');
 const result=M.result(s),old=M.result(previous),oldDelivery=M.result(previousDelivery);
 assert.equal(JSON.stringify(s.core),JSON.stringify(previousDelivery.core),'delivery presentation cannot alter graph');
 for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature','speech','beats','conversation'])assert.equal(JSON.stringify(result[k]),JSON.stringify(oldDelivery[k]),'delivery-only parity: '+k);
 const notes=s.log.filter(e=>e.kind==='fluff'),oldNotes=previousDelivery.log.filter(e=>e.kind==='fluff');
 assert.equal(notes.length,oldNotes.length,'no new failure events');
 assert.equal(JSON.stringify(s.log.filter(e=>e.kind!=='fluff')),JSON.stringify(previousDelivery.log.filter(e=>e.kind!=='fluff')),'spoken and crowd lines unchanged');
 assert.equal(new Set(notes.map(e=>e.line)).size,notes.length,'no repeated delivery cue');
 if(notes.length)deliveryScenes++;
 for(let n=0;n<notes.length;n++){
  const e=notes[n];assert.equal(e.side,'stage');assert.equal(e.swing,0);
  assert.ok(e.line.startsWith((s.speaker||s.w).short+' '),'actual speaker named');
  assert.ok(!/[{}]/.test(e.line));assert.doesNotMatch(e.line,/forgets|wrong name|trips over|ink has run/i);
  deliveryNew.add(norm(e.line));deliveryOld.add(norm(oldNotes[n].line));deliveryCount++;if(e.line!==oldNotes[n].line)deliveryChanged++;
 }
 for(const k of ['promise','tactic','quality','crowdShift','heatDelta','moraleDelta','trustDelta','repDelta','temperature','speech','beats'])assert.equal(JSON.stringify(result[k]),JSON.stringify(old[k]),'reaction-only parity: '+k);
 for(const [state,pool,isNew] of [[s,crowdNew,true],[previous,crowdOld,false]]){
  const lines=state.log.filter(e=>e.side==='crowd').map(e=>norm(e.line)),unique=new Set(lines);
  lines.forEach(x=>pool.add(x));
  if(isNew){newTotal+=lines.length;newRepeats+=lines.length-unique.size;}else{oldTotal+=lines.length;oldRepeats+=lines.length-unique.size;}
 }
 assert.equal(result.format,fmt);
 assert.equal(JSON.stringify(result.promise),JSON.stringify(Graph.result(s.core).promise));
 assert.equal(JSON.stringify(result.tactic),JSON.stringify(Graph.result(s.core).tactic));
 if(fmt==='callout'){
  const entrance=s.log.findIndex(e=>e.line.includes('takes the second microphone')),reply=s.log.findIndex(e=>e.side==='f');
  assert.ok(entrance>=0&&entrance<reply,'the called-out rival arrives before replying');
 }
 stats[fmt]=(stats[fmt]||0)+1;
 (counts[fmt]??={})[pattern.length]=((counts[fmt]??{})[pattern.length]||0)+1;
}
assert.deepEqual(Object.keys(stats).sort(),['address','callout','faceoff','interview','mouthpiece']);
assert.ok(new Set(Object.values(angles).flatMap(x=>[...x])).size>=4,'format-specific opening angles');
const all=[{id:'proof'},{id:'people'},{id:'imagery'},{id:'accusation'},{id:'swagger'}];
const directed={format:'interview'};
assert.equal(Dir.angles(directed,'open',all,{cases:[{angle:'swagger'}]}),all,'record evidence never filtered');
assert.equal(Dir.angles(directed,'answer',all,{case:{issue:'disputed'}}),all,'record responses never filtered');
assert.equal(Dir.angles(directed,'close',all,{}),all);
assert.ok(Dir.route({...directed,player:{},opponent:{}},{core:{case:{exposed:true}}},{id:'calm',landed:true}).follow);
const c={id:'legacy',wid:w.id,rid:f.id,pid:D.PROMOS[0].id,finish:'win_clean',minutes:12};
const legacy=M.begin(c,w,f,null,null,D.PROMOS[0],{directed:true});
assert.equal(legacy.director.format,null);
assert.ok(!M.view(legacy).conversation.format);
assert.ok(Signing.eligible({...c,title:{pid:c.pid,div:'women'}}));
assert.ok(Signing.eligible({...c,blowoff:true}));
assert.equal(oldTotal,newTotal,'no hidden reaction or scoring changes');
assert.equal(newRepeats,0,'new scenes never repeat a crowd line');
assert.ok(oldRepeats>newRepeats&&crowdNew.size>crowdOld.size*2,'substantial diversity improvement');
assert.ok(changedClose>20&&closeNew.size>closeOld.size,'closing responses must vary');
assert.ok(deliveryCount>40&&deliveryScenes>20&&deliveryChanged===deliveryCount&&deliveryNew.size>deliveryOld.size,'delivery variety');
console.log('PASS delivery variety: '+deliveryCount+' failed deliveries in '+deliveryScenes+' scenes; '+deliveryOld.size+' -> '+deliveryNew.size+' distinct notes; unchanged dialogue, scoring and exact resume.');
console.log('PASS closing variety: '+changedClose+'/'+comparedClose+' changed replies; '+closeOld.size+' -> '+closeNew.size+' distinct; graph and promise parity.');
console.log('PASS crowd variety: '+oldRepeats+'/'+oldTotal+' -> '+newRepeats+'/'+newTotal+' within-scene repeats; '+crowdOld.size+' -> '+crowdNew.size+' distinct lines; gameplay parity.');
console.log('PASS five promo formats: '+JSON.stringify(stats)+'; decisions by format '+JSON.stringify(counts)+'; evidence, vows, signing eligibility and exact resume preserved.');
