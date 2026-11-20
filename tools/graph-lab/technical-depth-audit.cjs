#!/usr/bin/env node
'use strict';
// Read-only targeted audit: actual Technical matches, never a catalogue count.
const fs=require('node:fs'),lab=require('./core.js'),review=require('./match-review.cjs');
const TIERS=[['novice',50,45,52],['competent',73,68,70],['elite',92,91,84]];
const PLANS=['technical','story','safe'],LENGTHS=[12,18],OPP=['ace','silas','red','rev'];
const FAMILIES=new Set(['chain','suplex','submission','ground','neck','pin','rest']);
const mean=(n,d)=>d?+(n/d).toFixed(2):0;
const pct=(n,d)=>d?+(100*n/d).toFixed(1):0;
const hit=(o,k)=>o[k]=(o[k]||0)+1;
function capture(seeds=12){
 if(!Number.isInteger(seeds)||seeds<1||seeds>24)throw Error('seeds must be 1..24');
 const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,G=M.GRAPH,A=G.A;
 const groups=[];
 for(const [tier,ring,safe,psych] of TIERS)for(const minutes of LENGTHS)
 for(const plan of PLANS){
  const g={tier,minutes,plan,bouts:0,stars:0,stamina:0,lowSt:0,lateDistinct:0,
   lateTwo:0,lateLanded:0,grapples:0,grappleLanded:0,grappleCounter:0,
   submissions:0,submissionLanded:0,submissionCounter:0,
   opposingGrapples:0,opposingCountered:0,gripEntries:0,gripToAttempt:0,
   gripRequired:0,gripVerified:0,triples:0,linkedPairs:0,
   ledgerErrors:0,topMoves:{},topSubmissions:{},topTriples:{},examples:[]};
  for(let oi=0;oi<OPP.length;oi++)for(let seedIndex=0;seedIndex<seeds;seedIndex++){
   const settings=lab.makeOptions(D,{wid:'juno',rid:OPP[oi],minutes,plan,
    slot:'main',seed:910087+oi*7919+minutes*9191+seedIndex*193,
    promotion:D.PROMOS[(oi+minutes+seedIndex)%D.PROMOS.length].id,
    finish:seedIndex%2?'lose_clean':'win_clean'});
   settings.minutes=minutes;
   settings.w={...settings.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
   const m=lab.runMatch(root,settings),e=m.graph.events||[],attempts=m.graph.grappleAttempts||[],
    seq=new Map(e.filter(z=>z.grappleAttemptSeq!==undefined).map(z=>[z.grappleAttemptSeq,z]));
   g.bouts++;g.stars+=m.final.stars;g.stamina+=m.wSt;g.lowSt+=m.wSt<25;
   const valid=z=>!!A[z.id]&&!A[z.id].reverse&&!A[z.id].counterOf&&
    !A[z.id].blockOf&&['grappleResolution','strikeResolution','aerialResolution','contactResolution']
     .every(k=>!z[k]||z[k]==='landed');
   const late=e.filter(z=>z.preControl==='w'&&z.t>=m.len-180&&
    valid(z)&&FAMILIES.has(A[z.id].family));
   g.lateLanded+=late.length;g.lateDistinct+=new Set(late.map(z=>z.id)).size;
   g.lateTwo+=new Set(late.map(z=>z.id)).size>=2;
   for(const z of late)hit(g.topMoves,z.id);
   for(const a of attempts){
    const action=seq.get(a.seq),result=a.outcome==='counter'?a.id+'_rev':
     a.outcome==='block'?a.id+'_blk':a.id;
    const happened=['landed','counter','block'].includes(a.outcome);
    if(happened?
      !(action&&action.id===result&&action.grappleResolution===a.outcome&&
        action.attemptedMove===a.id&&action.actionId===result):
      !!action||!['aborted','interrupted'].includes(a.outcome))g.ledgerErrors++;
    if(a.side==='f'){
     g.opposingGrapples++;g.opposingCountered+=a.outcome==='counter';continue;
    }
    g.grapples++;g.grappleLanded+=a.outcome==='landed';
    g.grappleCounter+=a.outcome==='counter';
    if(A[a.id]?.family==='submission'){
     g.submissions++;g.submissionLanded+=a.outcome==='landed';
     g.submissionCounter+=a.outcome==='counter';
     if(a.outcome==='landed')hit(g.topSubmissions,a.id);
    }
    const grip=G.PHYSICAL_GRIP_MOVES[a.id];
    if(grip){
     g.gripRequired++;
     if(e.some(z=>z.preControl==='w'&&G.GRIP_ENTRY[z.id]===grip&&
      z.t<=a.startedT&&a.startedT-z.t<=20))g.gripVerified++;
    }
   }
   for(let i=0;i<e.length;i++){
    const a=e[i];if(a.preControl==='w'&&G.GRIP_ENTRY[a.id]){
     g.gripEntries++;
     if(attempts.some(z=>z.side==='w'&&
       G.PHYSICAL_GRIP_MOVES[z.id]===G.GRIP_ENTRY[a.id]&&
       z.startedT>=a.t&&z.startedT-a.t<=20))g.gripToAttempt++;
    }
    if(i<1)continue;
    const b=e[i-1];
    const link=(x,y)=>x.preControl==='w'&&y.preControl==='w'&&
     x.control==='w'&&x.t<=y.t&&y.t-x.t<=20&&
     !!A[x.id]&&!!A[y.id]&&valid(y)&&
     A[x.id].next.some(([id])=>id===y.id)&&
     (FAMILIES.has(A[x.id].family)||G.GRIP_ENTRY[x.id])&&
     FAMILIES.has(A[y.id].family);
    if(link(b,a))g.linkedPairs++;
    if(i>1&&link(e[i-2],b)&&link(b,a)){
     g.triples++;hit(g.topTriples,e[i-2].id+' > '+b.id+' > '+a.id);
     if(g.examples.length<5)g.examples.push({seed:m.o.seed,
      at:a.t,sequence:[e[i-2].id,b.id,a.id]});
    }
   }
  }
  const n=g.bouts,rank=o=>Object.entries(o).sort((a,b)=>b[1]-a[1])
   .slice(0,10).map(([id,count])=>({id,count}));
  groups.push({tier,minutes,plan,bouts:n,
   stars:mean(g.stars,n),bellStamina:mean(g.stamina,n),
   lowStaminaPct:pct(g.lowSt,n),lateDistinct:mean(g.lateDistinct,n),
   lateTwoPct:pct(g.lateTwo,n),lateLandings:mean(g.lateLanded,n),
   grapplesAttempted:mean(g.grapples,n),grapplesLanded:mean(g.grappleLanded,n),
   grappleCounteredPct:pct(g.grappleCounter,g.grapples),
   opponentGrappleAttempts:g.opposingGrapples,
   technicianDefendedCounterPct:pct(g.opposingCountered,g.opposingGrapples),
   submissionAttempts:g.submissions,submissionLandings:g.submissionLanded,
   submissionCounteredPct:pct(g.submissionCounter,g.submissions),
   gripEntries:mean(g.gripEntries,n),gripToAttemptPct:pct(g.gripToAttempt,g.gripEntries),
   requiredGripAttempts:g.gripRequired,verifiedGripPct:pct(g.gripVerified,g.gripRequired),
   actualLinkedPairs:mean(g.linkedPairs,n),actualThreeMoveChains:mean(g.triples,n),
   ledgerErrors:g.ledgerErrors,topMoves:rank(g.topMoves),
   topSubmissions:rank(g.topSubmissions),topTriples:rank(g.topTriples),examples:g.examples});
 }
 const errors=groups.filter(g=>g.bouts!==4*seeds||g.ledgerErrors||
  g.grapplesLanded>g.grapplesAttempted).map(g=>g.tier+'/'+g.minutes+'/'+g.plan);
 return {schema:'office-technical-depth-v1',seeds,totalBouts:groups.length*4*seeds,
  note:'Read-only real match outcomes. Same opponent/seed/finish/promoter/duration between the three plans; fixed opponent skills remain a confounder. Linked chains require consecutive actual graph edges and the same wrestler in control; grip preparation requires actual matching entry within 20 sec.',
  groups,errors};
}
function markdown(r){
 const out=['## Technical match depth — performed grappling, not catalogued options','',
  r.totalBouts+' seeded real bouts. '+r.note,'',
  '| Tier | Mins | Plan | ★ | Bell stamina | Late unique | 2+ late | Linked triple/bout | Grapples landed/bout | Opponent attempts countered | Grip→attack | Submissions landed/total |',
  '|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of r.groups)out.push('| '+x.tier+' | '+x.minutes+' | '+x.plan+
  ' | '+x.stars+' | '+x.bellStamina+' | '+x.lateDistinct+
  ' | '+x.lateTwoPct+'% | '+x.actualThreeMoveChains+' | '+
  x.grapplesLanded+' | '+x.technicianDefendedCounterPct+'% ('+
  x.opponentGrappleAttempts+') | '+x.gripToAttemptPct+'% | '+
  x.submissionLandings+'/'+x.submissionAttempts+' |');
 for(const tier of TIERS.map(x=>x[0])){
  const x=r.groups.find(x=>x.tier===tier&&x.minutes===18&&x.plan==='technical');
  out.push('','### '+tier+' — 18-minute Technical plan',
   'Committed grapples: '+x.grapplesAttempted+' attempted / '+x.grapplesLanded+
    ' landed per match; '+x.grappleCounteredPct+'% were countered.',
   'True legal grip preparation: '+x.verifiedGripPct+'% of '+
    x.requiredGripAttempts+' grip-required attempts; actual grip conversions: '+
    x.gripToAttemptPct+'%.',
   'Actual landings: '+JSON.stringify(x.topMoves),
   'Actual submissions: '+JSON.stringify(x.topSubmissions),
   '3-action linked chains: '+JSON.stringify(x.topTriples));
 }
 out.push('','**Read-only audit validity:** '+(r.errors.length?
  'FAIL '+r.errors.join(', '):'PASS; completed matches and committed grapple ledgers valid')+'.');
 return out.join('\n');
}
if(require.main===module)try{
 const r=capture(process.argv[2]?Number(process.argv[2]):12);
 if(process.argv.includes('--json-file'))fs.writeFileSync('technical-depth-audit.json',JSON.stringify(r,null,2)+'\n');
 console.log(markdown(r));if(r.errors.length)process.exitCode=1;
}catch(e){console.error(e.stack);process.exitCode=1;}
module.exports={capture,markdown};
