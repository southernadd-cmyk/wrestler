'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {run}=require('./planning-career-audit.cjs');
// Include a third independent career seed for the alternative-readiness comparison.
const report=run([3,10,17],32);
assert.ok(report.overall.matches>=24,'meaningful number of real booked matches: '+report.overall.matches);
assert.ok(report.careers.every(c=>c.weeks>=16),'at least one season per career');
assert.equal(Object.keys(report.byStructure).length,4);
assert.equal(Object.keys(report.byApproach).length,5);
assert.ok(report.overall.planningResumes>0&&report.overall.matchResumes>0&&report.matchedLive.pairs>0);
assert.equal(report.overall.exact+report.overall.adapted+report.overall.missed+report.overall.noReceipt,report.overall.sequences);
if(process.env.MP13_AUDIT_JSON)fs.writeFileSync(process.env.MP13_AUDIT_JSON,JSON.stringify(report,null,2));
assert.ok(report.overall.spokenLines>0,'measure real wrestler dialogue');
assert.ok(report.overall.sequenceOffers>0&&report.overall.sequenceHeard>0&&report.overall.sequenceSelected>0&&report.overall.sequences>0,'exercise available sequence choices, not just single calls');
assert.ok(report.matchedTraditional.pairs>0,'real traditional comparison');
assert.ok(report.matchedFeasibility.pairs>0&&report.matchedFeasibility.bothSigned>0,'matched planning policy comparison');
assert.ok(report.matchedAdaptive.pairs>0&&report.matchedAdaptive.after.withAlternatives>0,'actual agreed alternate entry coverage');
const c=report.continuation;
assert.ok(c.attempts>0&&c.failed>0&&c.selectionOpportunities>0,'real opened sequence interruption coverage');
assert.equal(c.completed,report.overall.exact+report.overall.adapted,'all completed sequences traced exactly once');
assert.equal(c.finalOpenedMisses,report.overall.missed-report.overall.noOpening,'all final opened misses traced');
assert.equal(c.traceVerified.length,4,'trace neutrality verified per structure');
assert.ok(report.matchedContinuation.pairs>0,'same booking and seed continuation policy comparison');
const o=report.opening;
assert.equal(o.signed,report.overall.sequences,'one opening trace per signed sequence');
assert.equal(o.neverOpened,report.overall.noOpening,'all unopened misses traced');
assert.equal(o.opened+o.neverOpened,o.signed);
assert.equal(Object.values(o.firstEmptyStage).reduce((a,b)=>a+b,0),o.neverOpened,'exclusive funnel attribution');
const dep=report.matchedDependency;
assert.ok(dep.pairs>0,'identical signed-sheet dependency comparison');
assert.equal(dep.before.signed,dep.after.signed,'no changed agreements');
assert.equal(dep.traceVerified.length,4,'baseline tracing neutral in every structure');
assert.equal(dep.transitions.gainedCompletion.count-dep.transitions.lostCompletion.count,dep.after.completed-dep.before.completed,'paired completion transitions reconcile');
assert.equal(dep.transitions.gainedOpening.count-dep.transitions.lostOpening.count,dep.after.opened-dep.before.opened,'paired opening transitions reconcile');
assert.ok(dep.witnessedProgress>0&&dep.witnessedPrerequisiteCompletions>0,'actual prerequisite evidence witnessed under focused policy');
const hand=report.matchedHandover;
assert.equal(hand.main.signed,hand.combined.signed,'handover cannot change agreements');
assert.equal(hand.dependencyOnly.signed,hand.combined.signed);
assert.ok(hand.handoverOffers>0,'real legal handover opportunities exercised');
assert.equal(hand.changedOutcomes,0,'handover preserves booked outcomes');
const recovery=report.matchedRecoveryPacing;
assert.ok(recovery.pairs>0,'matched proactive recovery comparison');
assert.equal(recovery.before.signed,recovery.after.signed,'identical signed agreements');
assert.ok(recovery.offers>0,'actual validated sequence-aware recovery opportunities');
assert.ok(recovery.landed>0&&recovery.landed<=recovery.offers,'actual recovery landings, not credit');
const alt=report.matchedAlternativeReadiness;
assert.ok(alt.pairs>0&&alt.withAlternatives.pairs>0,'signed alternative comparison');
assert.equal(alt.before.signed,alt.after.signed,'same signed agreements');
assert.equal(alt.changedOutcomes,0,'booked outcomes unchanged');
assert.ok(alt.after.credited<=alt.after.opportunities,'actual credited alternative within observed opportunities');
const temporal=report.temporalOpportunityAudit;
assert.equal(temporal.total,alt.after.timingCases,'all production baseline timing cases classified');
for(const c of temporal.cases){
 assert.ok(c.timingOnly||c.mixed,'actual observed early guard');
 for(const v of c.variants){
  const n=v.counts,b=v.safetyBreakdown;
  assert.ok(n.inWindow>=n.safe&&n.safe>=n.prerequisite&&n.prerequisite>=n.matching&&n.matching>=n.legal&&n.legal>=n.ready&&n.ready>=n.offered,'same-variant same-tick funnel');
  assert.equal(n.early,n.earlyTimingOnly+n.earlyMixed);
  assert.equal(b.blockedTicks,Object.values(b.flagCombinations).reduce((x,y)=>x+y,0),'safety flags reconcile');
  assert.ok(b.otherwiseReadyBlocked<=b.blockedTicks);
 }
 console.log('MP13F.8B.2 TEMPORAL CASE '+JSON.stringify(c));
}
console.log('MP13F.8B.2 TEMPORAL SUMMARY '+JSON.stringify({...temporal,cases:undefined}));
const arbitration=report.matchedBigSpotArbitration;
assert.ok(arbitration.acceptedRequestBouts.pairs>0,'actual accepted manager requests');
assert.equal(arbitration.before.signed,arbitration.after.signed,'same signed agreements');
assert.equal(arbitration.changedOutcomes,0,'booked outcomes unchanged');
for(const side of ['before','after']){
 const x=arbitration[side];assert.equal(x.accepted,x.witnessed+x.botched+x.refunded,'every accepted request resolved');
}
assert.ok(arbitration.after.maxWait<=240,'bounded request lifetime');
const stamina=report.staminaOpportunityAudit;
assert.equal(stamina.before.total,arbitration.before.staminaCases,'historical stamina cases reconcile');
assert.equal(stamina.after.total,arbitration.after.staminaCases,'shipped policy stamina cases reconcile');
assert.equal(stamina.retained+stamina.newlyAssociated.length,stamina.after.total);
assert.equal(stamina.retained+stamina.noLongerAssociated.length,stamina.before.total);
for(const p of stamina.pairs){
 for(const c of [...p.before,...p.after]){
  assert.ok(c.staminaOnly||c.mixed);
  for(const v of c.variants){
   const n=v.counts;assert.equal(n.blocked,n.staminaOnly+n.mixed);
   assert.equal(n.blocked,Object.values(n.types).reduce((a,b)=>a+b,0));
   for(const snap of [v.first,v.last,v.closest,v.closestPure].filter(Boolean)){
    assert.ok(snap.maxDeficit>0&&snap.steps.some(x=>x.deficit>0));
    assert.ok(snap.guards.includes('chain_stamina'));
   }
  }
 }
 console.log('MP13F.10 STAMINA CASE '+JSON.stringify(p));
}
console.log('MP13F.10 STAMINA SUMMARY '+JSON.stringify({...stamina,pairs:undefined}));
const {rows,matchedLive,matchedTraditional,matchedFeasibility,matchedAdaptive,matchedContinuation,matchedDependency,matchedHandover,matchedRecoveryPacing,matchedAlternativeReadiness,matchedBigSpotArbitration,staminaOpportunityAudit,temporalOpportunityAudit,continuation,opening,...summary}=report;
console.log('MP13 CAREER AUDIT '+JSON.stringify({...summary,matchedLive:{...matchedLive,comparisons:undefined},matchedTraditional:{...matchedTraditional,comparisons:undefined},matchedFeasibility:{...matchedFeasibility,comparisons:undefined},matchedAdaptive:{...matchedAdaptive,comparisons:undefined},matchedContinuation:{...matchedContinuation,comparisons:undefined},matchedDependency:{...matchedDependency,comparisons:undefined,details:undefined},matchedHandover:{...matchedHandover,comparisons:undefined},matchedRecoveryPacing:{...matchedRecoveryPacing,comparisons:undefined},matchedAlternativeReadiness:{...matchedAlternativeReadiness,comparisons:undefined},matchedBigSpotArbitration:{...matchedBigSpotArbitration,comparisons:undefined},staminaOpportunityAudit:{...staminaOpportunityAudit,pairs:undefined},temporalOpportunityAudit:{...temporalOpportunityAudit,cases:undefined},continuation:{...continuation,records:undefined},opening:{...opening,records:undefined}}));
console.log('PASS MP13 real booked matches, multi-season career invariants, deterministic stage resumes and same-seed live psychology comparisons.');
