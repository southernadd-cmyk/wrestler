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
