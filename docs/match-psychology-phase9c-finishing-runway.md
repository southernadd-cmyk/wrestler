# Match Psychology Phase 9C — Earned causal finishing runway

## Problem
A signed finishing route currently preserves the contract, but its final scripted call can be disconnected from the real late ring exchanges. Avoid solving this by inserting scripted graph hits, altering the contracted winner, or treating a dramatic objective as proof of an actual wrestling sequence.

## Implementation
For actively structured **clean finishes** only, the graph may offer a few existing physically legal actions in the last quarter of the bout. A performed opponent attack can invite a normal defensive reversal; a genuine reversal by the booked winner can invite a real setup; a performed setup can invite its authored impact continuation. These are **weighted candidates only**. Every move still passes the unchanged location, style, stamina, risk, grip, ownership and booked-finish checks. Normal RNG and the defending wrestler decide what happens.

An earned `finishingRunway` requires four distinct observed graph events in strict time order:
1. Offensive pressure actually landed by the eventual loser
2. A real reversal that transfers control to the booked clean winner
3. A subsequent, performed winner-owned setup
4. An actually landed, explicitly authored setup-to-impact continuation by that same winner

The chain is not credited if the opponent successfully interrupts, the impact is stale, the setup is missing or a move was blocked, countered, merely called in planning, or interrupted. Only clean `win_clean`/`lose_clean` bookings are initially eligible. Dirty, protected, disqualification, injury, no contest and unscripted outcomes keep their existing handling.

The finishing runway is a **read-only proof extracted from the physical tape**, not a new promised move or rating input. It is snapshotted before the contracted finish extends the clock, is serialisation-safe and appears optionally in `final.finishingRunway`. For compatible ordinary clean finish routes, a single short colour-commentary line references the observed setup and impact while explaining the contracted finish is imminent. It never claims the finisher itself landed as a physical-graph action.

## Verification and rollout
A focused test runs 4 structures × 5 plans, both possible booked clean winners, real graph legality, intervention, expiry, metadata-only isolation and save/replay. The **existing** 960-bout matched A/B structure test independently checks each credited sequence against graph events and reports witnessed and verbally bridged runways. Review reachability, finish agreement, star/botch drift and remaining uncoupled endings. No extra workflows. No merge until reviewed.

## 960-bout reachability refinement

Initial full controls confirmed only **2** closing sequences in 480 actively structured matches, even while other test gates passed. The existing huge selection pool was drowning small additive offers. Phase 9C now uses an evidence-triggered, capped (max 8×) *relative weighting* for eligible counters/setups/impacts in the final section. This is a probability preference only, with ordinary move legality, defensive outcomes, stamina, risk, signed calls, rating and finish unchanged. The audit adds clean-finish denominators plus per-plan counts to measure whether this improves real sequences rather than only tests.

## Graded evidence

The full matched audit showed only four strict pressure → counter → setup → impact runways among 240 eligible clean matches. Phase 9C therefore also records a separate, weaker but truthful `linked` status for a real, same-owner authored setup → impact late in the match, without claiming an earlier reversal or opponent pressure. `witnessed` still demands all four physical events; `linked` sets `cutoff:null` and `pressure:null`. Both categories remain opt-in, clean-finish-only, cannot change the booked result or add stars, and have separate first-party audit counts.

## Late control handoff reachability

The original 9C pilot could only offer the setup after an observed reversal or after a setup already in progress. In the closing quarter of an active **clean** bout, a newly performed winner-owned standing strike or other legal offence can now invite `rope_run` or `waistlock` as ordinary weighted setup candidates. The wrestler must truly control the ring, the prior action must be recorded as completed and non-resting, and the move still passes the existing physical validator, training, stamina and Safe gates. No invented reversal or immediate impact, no help in dirty/metadata-only bouts, and no influence over the final contracted result.

The existing 960-bout comparison now reports a diagnostic funnel: eligible clean matches where the booked winner retained control at the bell, had actually performed a late setup, and had actually landed a recent grounding impact. These are **descriptive** and not assigned star points or used to force outcomes.

## Direct authored follow-through improvement

The first owner-initiative iteration passed all nine checks (run 45067442704) but produced only 17 qualifying sequences against the previous 14 in 240 clean matches. The new diagnostic funnel recorded 124 clean matches with the winner controlling at the bell, 133 with a late winner-owned setup and 191 with a late winner-owned grounding impact; these groups overlap. The narrower problem is often connecting **the actual setup** to **its physically performed impact**, not a lack of late wrestling.

The existing graph already authors `strike_trade → clothesline`. A performed late striking exchange can now count as the setup to that directly linked impact, avoiding a contrived extra rope run. The follow-through remains an optional, physically legal weighted action. No extra reversal, damage, injury, star points or changed finish is introduced.

## One-tick preservation of real closing setups

The live arc Director normally resets control and physical positions when changing arcs. After a *genuinely performed* late clean-winner setup, such a reset can destroy the author's already-legal next move before it can be selected. Phase 9C now defers that reset for one step only if a physically legal, non-risky, graph-authored grounding continuation is currently available and no attack is pending. The match still uses its ordinary seeded move-choice and resolution system; no attack, result, or new control is granted. An optional `graph.closingProtected` counts how many such real opportunities were retained. The existing 960-bout audit confirms this stays off in metadata-only controls and records actual reachability.
