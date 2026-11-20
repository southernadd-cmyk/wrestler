'use strict';
const assert=require('node:assert/strict');
const lab=require('../tools/graph-lab/core.js'),review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
const TIERS={novice:{ring:50,safe:45,psych:52},
 competent:{ring:73,safe:68,psych:70},elite:{ring:92,safe:91,psych:84}};
function match(tier='competent',plan='brawl',minutes=18){
 const o=lab.makeOptions(D,{wid:'rex',rid:'red',plan,slot:'main',seed:880041,finish:'win_clean'});
 o.minutes=minutes;o.w={...o.w,...TIERS[tier]};
 const m=M.create(o);
 m.stage='live';m.t=m.len-110;m.wSt=40;m.fSt=56;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 m.graph.started=true;m.graph.arc='escalation';m.graph.age=99;
 m.graph.node='rope_run';
 m.graph.events.push({id:'rope_run',t:m.t,preControl:'w',
  control:'w',position:'standing',down:null});
 return m;
}
const running=m=>G.pool(m).filter(([id])=>G.A[id]?.family==='running'&&
 !G.A[id].reverse&&!G.A[id].counterOf&&!G.A[id].blockOf);
const m=match();
assert.equal(G.readyBrawlRebound(m),true,
 'a genuine competent Brawl rope run with affordable named attacks earns exactly one chance');
const beforeEvents=m.graph.events.length,beforeNode=m.graph.node;
G.advance(m,m.t/m.len);
assert.equal(m.graph.node,beforeNode,
 'late arc change must preserve the actual rebound for the next legitimate action');
assert.equal(m.graph.events.length,beforeEvents,
 'preservation must not fabricate a landing or an extra setup event');
const candidates=running(m);
assert.ok(candidates.length>0,
 'a real rebound creates a nonempty named running pool');
assert.ok(candidates.some(([id])=>G.isValid(m,id)),
 'only physically and financially eligible running attacks are offered');
const total=G.pool(m).reduce((sum,[,w])=>sum+w,0);
const runningShare=candidates.reduce((sum,[,w])=>sum+w,0)/total;
assert.ok(runningShare>.035&&runningShare<.9,
 'running action should compete without becoming the forced single option');
// Real landed strike ledger, real narrated rope setup, same beat.
function landedStrike(tier='competent',plan='brawl',minutes=18){
 const m=match(tier,plan,minutes);
 m.graph.node='st_chop';
 const e=m.graph.events.at(-1);
 e.id='st_chop';e.strikeResolution='landed';e.strikeAttemptSeq=137;e.t=m.t;
 m.graph.strikeAttempts.push({seq:137,id:'st_chop',side:'w',
  startedT:m.t,outcome:'landed',resolvedT:m.t,actionId:'st_chop'});
 m.r=()=>0;return m;
}
const strike=landedStrike(),preScore=M._earnedPlanQuality(strike);
const beforeStamina=strike.wSt,comboEvents=strike.graph.events.length;
assert.equal(G.maybeBrawlComboRun(strike,'w','st_chop'),true,
 'landed standing strike can lead to a true, paid same-beat rope run');
assert.equal(strike.graph.events.length,comboEvents+1,
 'retain the genuine strike and add one narrated setup, no synthetic impact');
assert.equal(strike.graph.events.at(-2).id,'st_chop');
assert.equal(strike.graph.events.at(-1).id,'rope_run');
assert.equal(strike.graph.events.at(-1).brawlComboSource,'st_chop');
assert.equal(strike.graph.events.at(-1).t,strike.graph.events.at(-2).t,
 'the visible setup must not consume another ten-second attack opportunity');
assert.ok(strike.wSt<beforeStamina,'the rope run must cost real energy');
assert.equal(M._earnedPlanQuality(strike),preScore,
 'selection and setup cannot award free finishing quality');
assert.equal(strike.graph.strikeAttempts.length,1,
 'no second successful named strike can be fabricated');
assert.equal(G.maybeBrawlComboRun(strike,'w','st_chop'),false,
 'no duplicate late running setup for this controller');
strike.t+=10;
assert.equal(G.readyBrawlRebound(strike),true,
 'a legal source-owned rebound survives for one actual next beat');
assert.ok(running(strike).some(([id])=>G.isValid(strike,id)),
 'a genuinely legal, still counterable named runner remains offered');
const unforced=landedStrike();unforced.r=()=>.999;
assert.equal(G.maybeBrawlComboRun(unforced,'w','st_chop'),false,
 'the extra visible setup must never be forced');
const blocked=landedStrike();blocked.graph.events.at(-1).strikeResolution='counter';
assert.equal(G.maybeBrawlComboRun(blocked,'w','st_chop'),false,
 'a blocked/countered strike must not generate an offensive run');
const noLedger=landedStrike();noLedger.graph.strikeAttempts.length=0;
assert.equal(G.maybeBrawlComboRun(noLedger,'w','st_chop'),false,
 'fabricated/uncommitted attack cannot grant a free run');
const tiredStrike=landedStrike();tiredStrike.wSt=20;
assert.equal(G.maybeBrawlComboRun(tiredStrike,'w','st_chop'),false,
 'insufficient stamina prevents fake running payoffs');
for(const [tier,plan,minutes] of [
 ['novice','brawl',18],['competent','story',18],['competent','brawl',12]
]){
 assert.equal(G.maybeBrawlComboRun(landedStrike(tier,plan,minutes),'w','st_chop'),false,
  'no running combo outside trained long Brawl matches');
}

const expired=match();expired.graph.events.at(-1).t=expired.t-20;
assert.equal(G.readyBrawlRebound(expired),false,'an expired setup cannot pay off');
const failed=match();failed.graph.events.at(-1).control='f';
assert.equal(G.readyBrawlRebound(failed),false,'a different wrestler cannot steal an owned run');
const tired=match();tired.wSt=12;
assert.equal(G.readyBrawlRebound(tired),false,
 'there is no preserved running exchange without a legal affordable move');
assert.equal(G.isValid(tired,'rn_lariat'),false,
 'low stamina cannot bypass the existing demanding lariat eligibility');
assert.equal(G.readyBrawlRebound(match('novice')),false,'novices do not inherit a trained chance');
assert.equal(G.readyBrawlRebound(match('competent','story')),false,
 'Story plans do not inherit Brawl-only late running logic');
assert.equal(G.readyBrawlRebound(match('competent','brawl',12)),false,
 '12-minute bouts must not inherit the long-match Brawl preference');
assert.equal(G.validate().errors.length,0,'the graph must remain structurally valid');
console.log('PASS running: true one-beat continuation, real eligible moves, no phantom run, stamina/ownership/plan/length guards.');
