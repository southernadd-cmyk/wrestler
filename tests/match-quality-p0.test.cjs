'use strict';
// Match quality guardrails: the mechanics still run real seeded bouts.
// This is not a claim that arbitrary star ratings equal wrestling realism.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('../tools/graph-lab/core.js');
const root={};
for(const name of ['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js',name),'utf8'),
 {window:root,console,Math,Date,JSON},{filename:name});
root.OfficeRosterV4.enableProfiles();
const D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,people=lab.roster(D);
const plans=['technical','story','brawl','spots','safe'];
const metrics={};
for(const plan of plans){
 const result={n:0,stars:0,botches:0,spots:0,earlyTease:0,warning:0,offScript:0,lowRating:0};
 for(let i=0;i<80;i++){
  const w=people[i%people.length],f=people[(i*7+19)%people.length];
  const o=lab.makeOptions(D,{wid:w.id,rid:f.id===w.id?people[(i+1)%people.length].id:f.id,
   plan,seed:61001+i*53,finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4],
   slot:i%2?'main':'mid'});
  const m=lab.runMatch(root,o),events=m.graph.events;
  result.n++;result.stars+=m.final.stars;result.botches+=m.botches;result.spots+=m.spots;
  result.lowRating+=m.final.stars<2?1:0;
  result.earlyTease+=events.filter(e=>e.id==='finish_tease'&&e.t/m.len<.55).length;
  result.warning+=m.log.filter(x=>/tired legs will not cooperate|cannot get their footing/i.test(x.text)).length;
  const offScript=m.log.filter(x=>/off the layout|calling audibles/i.test(x.text));
  result.offScript+=offScript.length;
  assert.ok(offScript.length<=4,'off-script alerts repeat too much: seed '+o.seed+' '+offScript.length);
  assert.equal(new Set(events.map(e=>e.id)).size>0,true);
 }
 metrics[plan]={...result,avgStars:+(result.stars/result.n).toFixed(3)};
 assert.equal(result.earlyTease,0,plan+' played a finishing threat too early');
 assert.equal(result.warning,0,plan+' auto-selected a doomed, exhausted high-risk spot');
 assert.ok(result.offScript<=result.n*3,'agent still repeats layout warnings');
}
console.log('P0 matched plan diagnostics: '+JSON.stringify(metrics));
assert.ok(metrics.spots.avgStars>=1.9,'Spot-fest remains unplayably poor');
assert.ok(metrics.spots.botches>0,'risk has not been erased');
assert.ok(metrics.spots.spots>metrics.technical.spots,'Spot-fest still attempts more spectacular work');
assert.ok(metrics.technical.avgStars>=metrics.spots.avgStars,'technical proficiency must still matter');
const m=M.create(lab.makeOptions(D,{wid:'juno',rid:'rex',plan:'spots',seed:99177,slot:'main'}));
m.stage='live';m.t=120;m.wSt=5;m.listen=101;
const attempts=m.spots;
assert.equal(M.call(m,'big'),true);
assert.equal(m.spots,attempts,'producer cannot force an unsafe high spot with zero stamina');
assert.equal(m.mode.type,'slow','forced exhausted attempt changes pacing towards recovery');
const start=m.log.filter(x=>/looks for a big moment from the legal match repertoire/.test(x.text)).length;
assert.equal(start,1,'exhausted requests queue instead of inventing a legal attack');
assert.equal(m.bigSpotRequest?.index,0,'the first call is still pending');
m.t+=20;m.listen=101;
assert.equal(M.call(m,'big'),false,'a pending high spot cannot be stacked');
assert.equal(m.log.filter(x=>/looks for a big moment from the legal match repertoire/.test(x.text)).length,1,
 'the pending call cannot repeat identical narration');
assert.equal(G.isValid(m,'finish_tease'),false,'opening-stage finishing teaser must be unavailable');
m.t=Math.ceil(m.len*.7);m.story.position='standing';m.story.control='w';
assert.equal(G.isValid(m,'finish_tease'),true,'later finishing threat must remain possible');
console.log('PASS P0 match quality: '+JSON.stringify(metrics));
