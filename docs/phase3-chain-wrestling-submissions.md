# Phase 3 — chain wrestling and grounded submissions

**Status:** implementation under review in draft PR #127. Do not merge until full Node, Chromium, Graph Lab, match-quality and career-continuity checks have passed.

## Scope: 44 new committed attacks in one coherent batch

The existing match catalogue has **35 submissions** and **24 chain-family techniques**, plus **12 rest holds**. The first Phase 3 implementation expands the Phase 2 two-beat committed-attempt mechanism across:

- **All 35 catalogue submissions** (33 newly included; sleeper and ankle lock already covered)
- **11 actual chain takedown/throw techniques**: single leg, double leg, fireman's carry, snapmare, deep arm drag, Japanese arm drag, drop toehold, headlock takedown, leg trip, dragon screw and hip toss
- Together with the 39 Phase 2 grapple parents, that makes **83 distinct committed grapples**.

Not every movement should become a two-beat *attack*: wristlocks, grip acquisitions, rope movement, kip-ups, escapes and reversals remain actual single-beat setup/repositioning actions.

## Physical continuity

New exact grip requirements include retained **wrist control** for arm drags, a **headlock** for headlock takedowns, **upper-body contact** for fireman's carries and hip tosses, **ground-arm** control for grounded arm submissions and **ground-leg** control for leg locks. These controls originate from existing authored entry moves: wristlock/top wristlock/rolling wristlock, headlock/cravate, lockup, grounded wrist and hammerlock holds, ankle/leg wrench and related leg controls.

The engine's existing legality guard still enforces wrestler weight, energy, match timing, mat/standing position, grip ownership and age. Null physical descriptors on legacy saves remain compatible. Legal attempts resolve against their exact named parent with retained defender counter/block attribution. The agreed finish remains decisive.

## Release gates

- Preserve all original 39 Phase 2 directed techniques through their own test
- Directed landing, exact reversal, available block and deterministic resume for all **44 new** techniques
- End-to-end wristlock → top wristlock → rolling wristlock → arm drag and grounded wrist control → kimura tests using actual graph actions
- Existing exhaustive catalogue legality and structural reachability tests, including physical guard probes
- Existing 95% independent-action coverage gate and no unlinked grapple defences
- Match quality A/B, wrestler-style differences, safe versus spot-fest risk, fixture finish integrity and five-meeting rivalry continuity
- Graph Lab sample: record real-world organic attempted/landed/countered/blocked/aborted counts by named family; absence of a rare move in 1,000 bouts does not permit inventing a landing

## Work still to investigate

The rest-hold family (12 actions), non-attacking chain transitions (8+ actions), extended mat positional escapes and follow-up narration need their own linked-control and probability review rather than being arbitrarily labelled 'committed grapples'. Confirm their live path selection and document any dead ends. Do not force all 340 catalogue moves into this one mechanic.

This document describes an **implementation awaiting testing**, not a production or realism sign-off.
