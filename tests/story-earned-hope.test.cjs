'use strict';
const assert=require('node:assert/strict');
const lab=require('../tools/graph-lab/core.js'),review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
function scene({tier='competent',plan='story',pressure=true,position='standing'}={}){
 const levels={novice:[50,45,52],competent:[73,68,70],elite:[92,91,84]};
 const [ring,safe,psych]=levels[tier];
 const opt=lab.makeOptions(D,{wid:'sol',rid:'red',plan,minutes:18,seed:71291,slot:'main'});
 opt.minutes=18;opt.w={...opt.w,ring,safe,psych};
 const m=M.create(opt);m.stage='live';m.t=350;m.wSt=65;m.fSt=65;
 m.graph.started=true;m.graph.arc='control';m.graph.age=5;
 m.story.control='f';m.story.position='standing';m.story.down=null;
 G.resetPhysical(m);
 if(pressure)G.apply(m,'target_strike');
 m.t+=10;m.graph.arc='hope';m.graph.age=3;m.graph.node=null;
 m.story.control='f';m.story.position=position;m.story.down=position==='mat'?'w':null;
 G.resetPhysical(m);
 return m;
}
function weight(m,id){return G.pool(m).find(([k])=>k===id)?.[1]||0;}
const skilled=scene(),novice=scene({tier:'novice'});
assert.ok(G.isValid(skilled,'counter_strike'),'normal legal counter is available in hope');
assert.ok(weight(skilled,'counter_strike')>weight(novice,'counter_strike')*2,
 'trained defender with real previous pressure can choose a proper counter');
const unearned=scene({pressure:false});
assert.ok(weight(skilled,'counter_strike')>weight(unearned,'counter_strike')*2,
 'no Story hope bonus if opponent never performed pressure');
const other=scene({plan:'technical'});
assert.ok(weight(skilled,'counter_strike')>weight(other,'counter_strike')*2,
 'other plans keep their baseline counter odds');
G.apply(skilled,'counter_strike');skilled.t+=10;
const ev=skilled.graph.events.at(-1),cnt=skilled.graph.events.length;
assert.equal(ev.preControl,'f','reversal is a real defender reaction to pressure');
assert.equal(ev.control,'w','successful legitimate reversal changes control');
assert.equal(ev.reverse,true);
assert.equal(G.readyStoryHope(skilled),true,'real reversal earns exactly one legal beat');
const pool=G.pool(skilled),total=pool.reduce((sum,[,w])=>sum+w,0);
const odds=pool.filter(([id])=>['clothesline','snap_suplex'].includes(id))
 .reduce((sum,[,w])=>sum+w,0)/total;
assert.ok(odds>.20&&odds<.80,'real follow-up is contestable rather than compulsory');
const node=skilled.graph.node,stars=M._earnedPlanQuality(skilled);
G.advance(skilled,skilled.t/skilled.len);
assert.equal(skilled.graph.node,node,'arc cannot erase real immediate reversal');
assert.equal(skilled.graph.events.length,cnt,'pool and arc check cannot invent actions');
assert.equal(M._earnedPlanQuality(skilled),stars,'no free quality rating');
const expired=scene();G.apply(expired,'counter_strike');expired.t+=20;
assert.equal(G.readyStoryHope(expired),false,'hope window expires after one beat');
const wrong=scene();G.apply(wrong,'counter_strike');wrong.t+=10;
wrong.story.control='f';assert.equal(G.readyStoryHope(wrong),false,'do not fake possession');
const noviceReverse=scene({tier:'novice'});
G.apply(noviceReverse,'counter_strike');noviceReverse.t+=10;
assert.equal(G.readyStoryHope(noviceReverse),false,'novice does not gain skilled continuation');
const missing=scene();G.apply(missing,'counter_strike');missing.t+=10;
missing.graph.pendingGrapple={id:'ch_short_arm',side:'w'};
assert.equal(G.readyStoryHope(missing),false,'committed attempts have priority');
assert.deepEqual(Array.from(G.validate().errors),[],'no graph links or legality rules changed');
console.log('PASS Story: true earned reverse, one legal follow-through, intact novice and non-Story plans');
