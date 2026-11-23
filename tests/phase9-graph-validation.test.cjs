'use strict';
// Phase 9: deterministic real-match validation. Run: node tests/phase9-graph-validation.test.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const lab=require('../tools/graph-lab/core.js');
const validator=require('../tools/graph-lab/validation.js');
const root={};
for(const file of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),
 {window:root,Math,Date,JSON,console},{filename:file});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,G=root.OfficeMatch.GRAPH,B=root.OfficeTechniqueBackgrounds;
const samples=validator.create(G);
const roster=lab.roster(D);
let seeded=null;
for(let i=0;i<120;i++){
 const config={wid:roster[i%roster.length].id,rid:roster[(i*7+19)%roster.length].id,
  seed:90021+i*41,plan:['technical','story','brawl','spots','safe'][i%5],slot:i%2?'main':'mid'};
 if(config.rid===config.wid)config.rid=roster[(i+1)%roster.length].id;
 const match=lab.runMatch(root,lab.makeOptions(D,config));
 validator.add(samples,match,G,B);
 if(i===0)seeded={match,config};
}
const result=validator.finish(samples);
assert.equal(result.bouts,120);
assert.equal(result.hardErrors,0,JSON.stringify(result.examples));
assert.ok(result.attempts.aerial+result.attempts.grapple>0,'sample exercises attempted moves');
assert.ok(result.observedLinkedPairs>0);
assert.ok(result.distinctMatchSequences>0);
assert.equal(Object.keys(result.byStyle).length,4,'all performance styles sampled');
assert.ok(Object.keys(result.byTraining).length>2,'different technical backgrounds observed');
assert.equal(typeof result.sequenceUniqueness,'number');
const repeat=validator.create(G);
validator.add(repeat,lab.runMatch(root,lab.makeOptions(D,seeded.config)),G,B);
assert.equal(JSON.stringify(validator.finish(repeat).commonTriples),
 JSON.stringify((()=>{const a=validator.create(G);validator.add(a,seeded.match,G,B);return validator.finish(a).commonTriples;})()),
 'validator is deterministic at the same seed');
const corrupted=lab.runMatch(root,lab.makeOptions(D,{wid:'juno',rid:'bao',seed:61389,plan:'technical'}));
const bad=validator.create(G);
corrupted.graph.events.push({id:'made_up_move',t:1});
validator.add(bad,corrupted,G,B);
const badReport=validator.finish(bad);
assert.equal(badReport.pass,false);
assert.ok(badReport.errorCodes['unknown-event']>=1);
assert.equal(badReport.examples.find(x=>x.code==='unknown-event').seed,61389);
const fake=lab.runMatch(root,lab.makeOptions(D,{wid:'juno',rid:'bao',seed:61391,plan:'technical'}));
fake.graph.grappleAttempts.push({seq:9001,id:'sx_vertical',outcome:'landed',actionId:'sx_vertical'});
const mismatch=validator.create(G);
validator.add(mismatch,fake,G,B);
assert.ok(validator.finish(mismatch).errorCodes['mismatched-grapple']>=1);
const html=fs.readFileSync(path.join(__dirname,'../tools/graph-lab/index.html'),'utf8');
assert.match(html,/src="validation\.js"/);
assert.match(html,/id="validationFindings"/);
new vm.Script(fs.readFileSync(path.join(__dirname,'../tools/graph-lab/app.js'),'utf8'));
console.log('PASS Phase 9: 120 seeded bouts, '+result.observedLinkedPairs+
 ' observed pairs, '+result.distinctMatchSequences+' distinct sequences, 4 styles, '+
 result.attempts.aerial+' aerial and '+result.attempts.grapple+
 ' grapple attempts, reproducible findings and intentional corruption detection.');
