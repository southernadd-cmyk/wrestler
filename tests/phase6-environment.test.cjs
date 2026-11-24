'use strict';
// Phase 6: every named corner / ringside / rope exchange is contested
// against its own parent, never an autonomous generated counter.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-catalog.js','graph-narration.js','match-graph.js','match-commentary.js','match-engine.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
  {window:root,console,Date,Math,JSON},{filename:file});
}
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A,ids=G.ENVIRONMENT_PILOT;
assert.equal(ids.length,44,'18 corner + 16 outside + 10 rope actions');
assert.equal(new Set(ids).size,44,'distinct parents only');
assert.equal(ids.filter(id=>A[id].family==='corner').length,18);
assert.equal(ids.filter(id=>A[id].family==='outside').length,16);
assert.equal(ids.filter(id=>A[id].family==='rope').length,10);
assert.equal(ids.includes('os_count_tease'),false,'countout recovery is a story beat, not an attack');
assert.ok(ids.every(id=>A[id]&&A[id+'_rev']),'each named action has a live generated counter');
assert.equal(G.CONTACT_PILOT.length,31,'Phase 5 ground and pin coverage preserved');

function prepare(id,seed=410111){
 const m=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',plan:'spots',
  slot:'main',finish:'win_clean',seed}));
 m.stage='live';m.t=Math.ceil(m.len*.87);m.wSt=m.fSt=100;
 m.story.position=A[id].requires;m.story.down=null;m.story.control='w';
 m.graph.arc='escalation';m.graph.node=null;
 const outside=A[id].requires==='outside';
 m.graph.physical={v:1,locations:{w:outside?'floor':'ring',f:outside?'floor':'ring'},
  area:outside?'floor':'ring',grip:null,topSide:null};
 if(['os_apron_knee','os_apron_ddt','os_apron_slam'].includes(id)){
  m.graph.physical.area='apron';m.graph.physical.locations={w:'apron',f:'apron'};
 }else if(id==='os_ramp_suplex')m.graph.physical.area='ramp';
 assert.ok(G.isValid(m,id),'physical setup is legal for '+id);
 return m;
}
let land=0,counter=0,block=0;
for(const id of ids){
 const m=prepare(id),rev=id+'_rev',blk=id+'_blk';
 assert.equal(G.isValid(m,rev),false,'no free counter '+id);
 if(A[blk])assert.equal(G.isValid(m,blk),false,'no free block '+id);
 assert.equal(G.startContact(m,id),true,'commit real parent '+id);
 assert.equal(G.startContact(m,id),false,'cannot duplicate pending parent '+id);
 assert.equal(m.graph.pendingContact.id,id);
 assert.equal(G.isValid(m,rev),true,'only its actual counter becomes legal '+id);
 m.r=()=>.999;
 assert.equal(G.resolveContact(m),true,'resolve landing '+id);
 const hit=m.graph.events.at(-1),attempt=m.graph.contactAttempts.at(-1);
 assert.equal(attempt.outcome,'landed');
 assert.equal(hit.id,id);assert.equal(hit.contactAttemptSeq,attempt.seq);
 assert.equal(hit.attemptedMove,id);assert.equal(hit.contactKind,A[id].family);
 assert.equal(hit.contactResolution,'landed');
 assert.equal(m.graph.pendingContact,null);
 land++;
 const d=prepare(id,410112);
 assert.equal(G.startContact(d,id),true);d.r=()=>0;
 assert.equal(G.resolveContact(d),true,'resolve named counter '+id);
 const reply=d.graph.events.at(-1),a=d.graph.contactAttempts.at(-1);
 assert.equal(reply.id,rev,'exact matching counter '+id);
 assert.equal(reply.attemptedMove,id);assert.equal(reply.contactResolution,'counter');
 assert.equal(reply.contactAttemptSeq,a.seq);assert.equal(a.actionId,rev);
 assert.equal(a.outcome,'counter');
 assert.equal(G.isValid(d,rev),false,'counter unavailable after resolution '+id);
 counter++;
 if(A[blk]){
  const b=prepare(id,410113);
  assert.equal(G.startContact(b,id),true);
  const x=b.w,y=b.f,as=x.ring*.65+x.psych*.35,ds=y.ring*.65+y.psych*.35;
  const cc=Math.max(.07,Math.min(.32,.14+(ds-as)/350));
  const bc=Math.max(.05,Math.min(.14,.075+(y.safe-x.safe)/550));
  b.r=()=>cc+bc*.5;
  assert.equal(G.resolveContact(b),true);
  assert.equal(b.graph.events.at(-1).id,blk,'actual defended block '+id);
  assert.equal(b.graph.contactAttempts.at(-1).outcome,'block');
  block++;
 }
}
const interrupted=prepare('os_post',410114);
assert.equal(G.startContact(interrupted,'os_post'),true);
interrupted.story.control='f';
assert.equal(G.resolveContact(interrupted),true);
assert.equal(interrupted.graph.contactAttempts.at(-1).outcome,'interrupted');
const pending=prepare('cn_splash',410115);
assert.equal(G.startContact(pending,'cn_splash'),true);
const resumed=M.restore(JSON.parse(JSON.stringify({...pending,rState:pending.r.getState()})));
assert.equal(resumed.graph.pendingContact.id,'cn_splash');
pending.r=()=>.999;resumed.r=()=>.999;
G.resolveContact(pending);G.resolveContact(resumed);
assert.equal(JSON.stringify(pending.graph.contactAttempts),JSON.stringify(resumed.graph.contactAttempts));
assert.equal(JSON.stringify(pending.graph.events),JSON.stringify(resumed.graph.events));
const noTease=prepare('os_post',410116);
assert.equal(G.startContact(noTease,'os_count_tease'),false);
console.log('PASS Phase 6: '+land+' landings / '+counter+' exact-parent reversals / '+
 block+' blocks, interruption and replay, without fabricated move outcomes.');
