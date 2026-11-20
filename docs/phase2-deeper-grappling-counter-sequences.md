# Phase 2 — bulk grappling and named counter sequences

**Date:** 20 November 2026  
**Branch:** `feature/phase2-grapple-counter-sequences-20261120`  
**Status:** implementation in draft PR #126; not live, testing and match-tape review pending.

## What this branch actually implements

Extend the existing serialized two-beat `startGrapple → resolveGrapple` mechanism from **4 to 39 existing authored techniques**:

- **All 25 suplex techniques**, from vertical, delayed, fisherman and German suplexes through dragon, tiger, overhead, brainbuster and falcon arrow.
- **11 selected power techniques**: powerbomb, sit-out and running variants, backbreaker, uranage, Samoan drop, gorilla press, military press, pumphandle slam, belly-to-belly throw and Argentine backbreaker.
- **3 existing other techniques**: sleeper, ankle lock and snap DDT.

An attempt records its true attacker, move ID and match tick. At the next tick it resolves to the **same move**, its existing named generated `_rev` counter or `_blk` block where one exists, or a genuine interruption/abort. No fictitious landed move is credited to the attacker on an escape. Save/resume and booked outcomes remain governed by the original engine.

## Reusable physical control

A central `PHYSICAL_GRIP_MOVES` mapping declares entry grip requirements; `GRIP_ENTRY` identifies actual graph nodes that can produce front facelock, rear waistlock, upper-body tie, body clinch or grounded leg control. The descriptor stores owner, source and age, and rejects an absent, expired or opponent-owned grip. A previously unrecorded legacy `physical=null` state retains the existing migration fallback.

**Important limitation:** A common attempt/resolution framework does *not* by itself prove live handoffs are frequent. `CAT.members.suplex` is used to avoid hand-maintaining 25 IDs, while each physical grip mapping is explicit, not inferred mechanically from an imported name.

## Testing

- Exhaustive directed-path tests for 39 parents, exact counters and blocks, illegal grip ownership/age, replay, interrupt and legacy migration.
- The graph catalogue's reachability probes establish valid grip prerequisites when examining a move or its generated defence.
- Mandatory full CI, Graph Lab 500+500 paired-seed audit with actual landed/countered/aborted attempt counts, old-save and pacing checks, and desktop/mobile Chromium.
- Examine real transcripts across five plan styles, including technically credible throws, counters and follow-throughs. This is a **review gate**, not a claim of verified wrestling realism.

## Remaining Phase 2 scope

More grounded submission chaining, wrist control, counter-to-regrip and grip-preserving transitions require subsequent batches. The initial 39-technique implementation is not a claim that the remaining 226 unreviewed catalogue techniques have source-reviewed metadata or reliable physical continuations. Avoid further mass imports or invented counters.
