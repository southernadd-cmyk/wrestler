'use strict';
// Phase 4: all 32 strike-family and 12 running-family original moves.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js'),root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js',
 'technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
  {window:root,console,Math,Date,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
const ids=G.STRIKE_PILOT;
assert.equal(G.CATALOG.members.strike.length,32);
assert.equal(G.CATALOG.members.running.length,12);
assert.equal(ids.length,43,'mutual exchange is intentionally not a committed attack');
assert.equal(ids.includes('st_fighting_spirit'),false);
assert.equal(new Set(ids).size,ids.length);
assert.ok(ids.every(id=>A[id]&&['strike','running'].includes(A[id].family)));
assert.ok(ids.every(id=>A[id+'_rev']),'all committed parents have a named defence');
const setup=(id='st_forearm',seed=89110)=>{
 const m=M.create(lab.makeOptions(D,{wid:'lyra',rid:'dee',slot:'main',
  plan:'technical',finish:'win_clean',seed}));
 m.stage='live';m.t=Math.ceil(m.len*.85);m.wSt=m.fSt=100;
 m.story.position='standing';m.story.control='w';m.story.down=null;
 m.graph.arc='escalation';m.graph.node=null;
 assert.equal(G.isValid(m,id),true,'physically legal '+id);
 return m;
};
let landed=0,counters=0,blocks=0;
for(const id of ids){
 const m=setup(id),rev=id+'_rev',blk=id+'_blk';
 assert.equal(G.isValid(m,rev),false,'cannot counter non-attack: '+id);
 if(A[blk])assert.equal(G.isValid(m,blk),false,'cannot block non-attack: '+id);
 assert.equal(G.startStrike(m,id),true,'committed attack '+id);
 assert.equal(m.graph.pendingStrike.id,id);
 assert.equal(G.isValid(m,rev),true,'exact parent permits counter '+id);
 assert.equal(G.startStrike(m,id),false,'cannot stack commitments '+id);
 m.r=()=>.999;m.t+=10;
 assert.equal(G.resolveStrike(m),true,'resolves attempted '+id);
 const e=m.graph.events.at(-1),a=m.graph.strikeAttempts.at(-1);
 assert.equal(e.id,id,'real strike lands '+id);
 assert.equal(e.strikeAttemptSeq,a.seq);
 assert.equal(e.attemptedMove,id);
 assert.equal(a.outcome,'landed');
 assert.equal(e.strikeResolution,'landed');
 assert.equal(m.graph.pendingStrike,null);
 landed++;
 const d=setup(id);
 assert.equal(G.startStrike(d,id),true);
 d.r=()=>0;d.t+=10;
 assert.equal(G.resolveStrike(d),true);
 const de=d.graph.events.at(-1),da=d.graph.strikeAttempts.at(-1);
 assert.equal(da.outcome,'counter','named counter happens '+id);
 assert.equal(de.id,rev,'correct reversal '+id);
 assert.equal(de.attemptedMove,id);
 assert.equal(de.strikeAttemptSeq,da.seq);
 assert.notEqual(de.id,id,'counter is not phantom landed hit '+id);
 counters++;
 if(A[blk]){
  const b=setup(id);
  assert.equal(G.startStrike(b,id),true);
  b.r=()=>.19;b.t+=10;
  assert.equal(G.resolveStrike(b),true);
  const be=b.graph.events.at(-1),ba=b.graph.strikeAttempts.at(-1);
  assert.equal(ba.outcome,'block','named block happened '+id);
  assert.equal(be.id,blk);
  assert.equal(be.attemptedMove,id);
  blocks++;
 }
 const interrupted=setup(id);
 assert.equal(G.startStrike(interrupted,id),true);
 interrupted.story.control='f';interrupted.t+=10;
 assert.equal(G.resolveStrike(interrupted),true);
 assert.equal(interrupted.graph.strikeAttempts.at(-1).outcome,'interrupted');
}
const saved=setup('st_forearm',99128);
assert.equal(G.startStrike(saved,'st_forearm'),true);
const clone=M.restore(JSON.parse(JSON.stringify({...saved,rState:saved.r.getState()})));
assert.equal(clone.graph.pendingStrike.id,'st_forearm');
saved.t+=10;clone.t+=10;
G.resolveStrike(saved);G.resolveStrike(clone);
assert.equal(JSON.stringify(saved.graph.strikeAttempts),JSON.stringify(clone.graph.strikeAttempts));
assert.equal(JSON.stringify(saved.graph.events),JSON.stringify(clone.graph.events));
console.log('PASS Phase 4: '+landed+' exact landed attacks, '+counters+
 ' counters, '+blocks+' blocks, interruptions, duplicate prevention and saved attempts.');
