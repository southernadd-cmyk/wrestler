'use strict';
const assert=require('node:assert/strict');
const lab=require('../tools/graph-lab/core.js'),review=require('../tools/graph-lab/match-review.cjs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH;
const tiers={novice:{ring:50,safe:45,psych:52},
 competent:{ring:73,safe:68,psych:70},elite:{ring:92,safe:91,psych:84}};
function fixture(tier='competent',minutes=18,plan='brawl'){
 const opt=lab.makeOptions(D,{wid:'rex',rid:'red',plan,slot:'main',
  seed:880041,finish:'win_clean'});
 opt.minutes=minutes;opt.w={...opt.w,...tiers[tier]};
 const m=M.create(opt);
 m.stage='live';m.t=m.len-120;m.wSt=22;m.fSt=54;
 m.story.control='w';m.story.position='standing';m.story.down=null;
 m.graph.arc='escalation';
 return m;
}
const weight=(m,id)=>G.pool(m).find(([key])=>key===id)?.[1]||0;
const impact=(m)=>G.pool(m).filter(([id])=>{
 const a=G.A[id];
 return a&&['strike','running','power','outside','corner','rope'].includes(a.family)&&
 !a.reverse&&!a.counterOf&&!a.blockOf&&
 (a.family!=='power'||a.zone==='mat');
});
const trained=fixture('competent'),novice=fixture('novice'),elite=fixture('elite');
assert.ok(weight(trained,'st_chop')>0&&G.isValid(trained,'st_chop'),
 'a competent brawler below 26 stamina can perform an affordable legal named chop');
assert.ok(weight(trained,'st_chop')>weight(novice,'st_chop'),
 'trained brawler earns late impact preference without giving it to a novice');
assert.ok(impact(trained).length>impact(novice).length,
 'competent worker can access extra named legal impacts, not only holds');
assert.ok(impact(elite).length>0,'elite continues to have legal late impacts');
assert.equal(G.isValid(trained,'pw_powerbomb'),false,
 'an unaffordable major powerbomb must remain physically illegal');
const afterRun=fixture();
assert.equal(G.isValid(afterRun,'rn_lariat'),false,
 'lariat is still unaffordable at 22 stamina; no free late powers');
afterRun.wSt=34;
afterRun.graph.node='rope_run';
afterRun.graph.events.push({id:'rope_run',t:afterRun.t-10,
 preControl:'w',control:'w',position:'standing',down:null});
assert.ok(G.pool(afterRun).some(([id])=>G.A[id]?.family==='running'),
 'a narrated run gives physically eligible running moves');
const beforeRun=fixture();
beforeRun.wSt=34;
assert.ok(weight(afterRun,'rn_lariat')>weight(beforeRun,'rn_lariat'),
 'only the real rebound gets the extra late running attack priority');
const afterClinch=fixture();
afterClinch.graph.node='pw_bearhug';
afterClinch.graph.events.push({id:'pw_bearhug',t:afterClinch.t-10,
 preControl:'w',control:'w',position:'standing'});
// The existing scoring system already gives Brawl-family holds a modest
// technique contribution. This patch must not add any new rating bonus.
const scoreBefore=M._earnedPlanQuality(afterClinch),bonusBefore=afterClinch.bonus;
G.pool(afterClinch);
assert.equal(M._earnedPlanQuality(afterClinch),scoreBefore,
 'offering an impact payoff must not award extra stars on its own');
assert.equal(afterClinch.bonus,bonusBefore,
 'candidate inspection cannot add a match-rating bonus');
assert.equal(G.A.pw_bearhug.zone,'standing',
 'bearhug is a setup hold, not a landed canvas impact');
const short=fixture('competent',12);
assert.equal(short.len,720);
assert.ok(weight(short,'st_chop')<weight(trained,'st_chop'),
 'the extra impact bias applies only to 15+ minute Brawl matches');
const otherPlan=fixture('competent',18,'story');
assert.ok(weight(otherPlan,'st_chop')<weight(trained,'st_chop'),
 'a Story plan cannot inherit the Brawl impact weighting');
assert.equal(G.validate().errors.length,0,'the existing graph stays structurally valid');
console.log('PASS: cost-aware competent late Brawl, real rebound, original move safety, short/other plan isolation, no free stars.');
