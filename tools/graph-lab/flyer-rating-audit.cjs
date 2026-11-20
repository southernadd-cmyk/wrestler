#!/usr/bin/env node
'use strict';
// All five plans, including a low-risk plan, matched across four wrestler\n// styles. Rotating the four promoter preferences. Same opponents,
// finish, slot, seed and promotion; only the match plan changes.
const lab=require('./core.js'),engine=require('./match-review.cjs');
function audit(n=60){
 if(!Number.isInteger(n)||n<1||n>250)throw Error('Expected 1..250 paired bouts per worker style/plan');
 const root=engine.load(),D=root.OfficeData,people=lab.roster(D);
 const styles=['Spectacle','Technical','Brawl','Story'],plans=['spots','technical','brawl','story','safe'];
 if(D.PROMOS.length!==4||new Set(D.PROMOS.map(p=>p.likes)).size!==4)
  throw Error('Expected four distinct promoter preferences for a controlled matched audit');
 const results=[];
 for(const style of styles){
  const workers=people.filter(w=>w.style===style);
  if(workers.length<3)throw Error('Not enough wrestlers with style '+style);
  const opponentPool=people.filter(w=>w.style!==style);
  const rows=[];
  for(const plan of plans){
   const sums={stars:0,q:0,qN:0,crowd:0,spots:0,spotHits:0,botches:0,
     nearfalls:0,low:0,parts:{},workerRing:0,workerSafety:0,
     endStamina:0,lateQ:0,lateN:0,earlyQ:0,earlyN:0,
     fit:0,earnedAtBell:0,graphRiskLanded:0,scriptLanded:0,scriptBotched:0};
   for(let i=0;i<n;i++){
    const w=workers[i%workers.length],f=opponentPool[(i*7+11)%opponentPool.length];
    const input={wid:w.id,rid:f.id,plan,slot:'main',finish:'win_clean',
      seed:501137+i*173,
      // Rotate across promoters; the old fixed Dockside cohort gave Brawl
      // an automatic +6 fit on every match and overstated its lead.
      promotion:D.PROMOS[Math.floor(i/workers.length)%D.PROMOS.length].id};
    const match=lab.runMatch(root,lab.makeOptions(D,input));
    sums.stars+=match.final.stars;sums.q+=match.qSum||0;sums.qN+=match.qN||0;
    sums.crowd+=match.crowdPeak||0;sums.spots+=match.spots||0;
    sums.spotHits+=match.spotHits||0;sums.botches+=match.botches||0;
    sums.nearfalls+=match.nearfalls||0;sums.low+=match.final.stars<2?1:0;
    sums.workerRing+=w.ring||0;sums.workerSafety+=w.safe||0;
    sums.endStamina+=match.wSt||0;
    sums.fit+=match.fit||0;
    sums.earnedAtBell+=root.OfficeMatch._earnedPlanQuality(match);
    sums.graphRiskLanded+=(match.graph?.events||[]).filter(e=>{
      const a=root.OfficeMatch.GRAPH.A[e.id];
      return a?.risk&&!a.reverse&&!a.counterOf&&!a.blockOf&&
       (!e.aerialResolution||e.aerialResolution==='landed')&&
       (!e.grappleResolution||e.grappleResolution==='landed')&&
       (!e.contactResolution||e.contactResolution==='landed');
    }).length;
    sums.scriptLanded+=(match.graph?.scriptedSpotAttempts||[]).filter(x=>x.outcome==='landed').length;
    sums.scriptBotched+=(match.graph?.scriptedSpotAttempts||[]).filter(x=>x.outcome==='botched').length;
    for(const tick of match.flow||[]){
      if(tick[0] >= match.len*.65){sums.lateQ+=tick[4];sums.lateN++;}
      else if(tick[0] < match.len*.35){sums.earlyQ+=tick[4];sums.earlyN++;}
    }
    for(const [key,,part] of match.final.starParts||[])
      sums.parts[key]=(sums.parts[key]||0)+part;
   }
   const rounded=v=>+(v/n).toFixed(3);
   rows.push({plan,matches:n,stars:rounded(sums.stars),work:rounded(sums.parts.work||0),
     moment:rounded(sums.parts.moments||0),crowdPart:rounded(sums.parts.crowd||0),
     botchPart:rounded(sums.parts.botches||0),psych:rounded(sums.parts.psychology||0),
     quality:sums.qN?+(sums.q/sums.qN).toFixed(2):0,
     peakCrowd:rounded(sums.crowd),botches:sums.botches,
     spotHits:sums.spotHits,spotAttempts:sums.spots,
     poorMatches:sums.low,avgRing:rounded(sums.workerRing),
     avgSafety:rounded(sums.workerSafety),endStamina:rounded(sums.endStamina),
     earlyQ:sums.earlyN?+(sums.earlyQ/sums.earlyN).toFixed(2):0,
     lateQ:sums.lateN?+(sums.lateQ/sums.lateN).toFixed(2):0,
     avgFit:rounded(sums.fit),earnedAtBell:rounded(sums.earnedAtBell),
     graphRiskLanded:rounded(sums.graphRiskLanded),scriptLanded:rounded(sums.scriptLanded),scriptBotched:rounded(sums.scriptBotched)});
  }
  results.push({style,workers:workers.length,rows});
 }
 return {description:'Matched inputs, plan differs; plans themselves may alter action/RNG pathways',n,results};
}
function markdown(result){
 const out=['### Matched wrestler-style / plan rating audit','',
  result.n+' matched bouts per row; all five plans and four wrestler styles. Worker, opponent, promotion, seed, booked finish and card slot held fixed *within each five-plan cohort*. The four promoters rotate across cohorts, avoiding a permanent Brawl fit bonus; only the match plan changes.','',
  '| Worker style | Match plan | Mean stars | Wrestling | Crowd | Mistakes | Q avg | Early Q | Late Q | Final worker stamina | Peak crowd | Landed/attempted spots | Below 2 stars | Plan fit | Earned at bell | Graph risk hits | Scripted landed/botched |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const group of result.results)for(const r of group.rows)
  out.push('| '+group.style+' | '+r.plan+' | '+r.stars.toFixed(2)+' | '+
    r.work.toFixed(2)+' | '+r.crowdPart.toFixed(2)+' | '+r.botchPart.toFixed(2)+
    ' | '+r.quality.toFixed(1)+' | '+r.earlyQ.toFixed(1)+' | '+
    r.lateQ.toFixed(1)+' | '+r.endStamina.toFixed(1)+' | '+r.peakCrowd.toFixed(1)+' | '+
    r.spotHits+'/'+r.spotAttempts+' | '+r.poorMatches+' | '+r.avgFit.toFixed(1)+' | '+r.earnedAtBell.toFixed(2)+' | '+r.graphRiskLanded.toFixed(1)+' | '+r.scriptLanded.toFixed(1)+'/'+r.scriptBotched.toFixed(1)+' |');
 out.push('','There is no automatic pass/fail threshold: compare the same wrestlers and bookings before adjusting rating incentives. The exact random stream differs once plans choose different actions. Early Q is the first 35% of recorded ten-second ticks; late Q is the final 35%; final stamina is the booked worker’s remaining stamina at the bell.','');
 return out.join('\n');
}
if(require.main===module){
 try{const n=process.argv[2]?Number(process.argv[2]):60;
  const result=audit(n);
  console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):markdown(result));
 }catch(e){console.error(e.stack);process.exitCode=1;}
}
module.exports={audit,markdown};
