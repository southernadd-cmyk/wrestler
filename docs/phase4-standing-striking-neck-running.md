# Phase 4 — standing strikes, running offence and neck attacks

**Date:** 20 November 2026  
**Review:** draft PR #128 (not merged or deployed)

## Complete family inventory: 62 existing catalogue moves

- **32 strike-family actions**: 31 individual attacks plus one mutual `st_fighting_spirit` exchange, which does not have a fictitious one-sided defender counter
- **12 running-family attacks**: knee, crossbody, spear, shoulder block, dropkick, lariat, Thesz press, cannonball and other running offence
- **18 neck-family actions**: 14 newly added controlled takedowns, 3 new sudden neck attacks, and the snap DDT already covered by Phase 2

**Phase 4 adds 60 move parents** to their appropriate existing attempt systems. The 83 Phase 2/3 grapple parents remain separately testable; adding the 14 new neck grapples brings that total to **97**. A total of **46** standing/running/sudden-neck actions use the separate `strikeAttempts` ledger. No catalogue move names, reversals, blocks or authored graph nodes are fabricated.

## Mechanic distinction

- Short striking and running attacks resolve in the **same contested beat**, using an exact-parent named counter/block outcome rather than a free-standing defensive node. The attacker is not credited with a landed strike when the defender counters.
- Running offence keeps existing rope/run/rebound preparation in the action graph; it is not padded with an extra generic pre-move time tick.
- Controllable neck moves use the established two-beat `startGrapple → resolveGrapple` system and explicit source-held grips where the mechanics require them. These include front facelocks for DDT variants and piledrivers; head control for several neckbreakers; body ties for Russian leg sweeps and STOs. The existing snap DDT remains in the older covered set.
- Jawbreaker, cutter and stunner are **quick counter-style neck attacks**; demanding a two-beat lifting grip would be narratively wrong. These therefore use the immediate, exact-parent strike ledger.
- A mutual fighting-spirit exchange is a shared narrated exchange rather than pretending one wrestler is delivering a unilateral named impact attack.
- No changes to booked finish authority, stamina/weight checks, untrusted grip ownership, career decisions or crowd/phase contracts.

## Verification

- Deterministic directed test for 43 new individual strikes and running attacks, with landing, 43 exact reversals, 30 authored blocks, interruption and save/replay
- Separate directed test for all 17 newly covered neck moves (14 controlled throws, 3 quick attacks), including ownership, counters, blocks and serialised continuity
- All original 39 Phase 2 parents and 44 newly covered Phase 3 parents continue to have independent directed regression tests
- Mandatory full Node and Chromium journeys, existing A/B match-quality simulation, Graph Lab target families, 1,000-bout catalog coverage, career continuity and rivalry tests
- Diagnosed repeated generic setup commentary and eliminated it for one-beat striking; only the real impact or defence narration remains
- Added a legal Spectacle/spot-fest dive follow-through option when the actual attacker is still in-ring and their opponent has been thrown to the floor; no position gate bypass
- Stronger but still legal candidate preference for a **real held grip** before it expires. This does not manufacture a landed move or override existing stamina, timing, style or size constraints

**Outstanding:** Full 1,000-match independent-action coverage and match-quality A/B must pass on the same PR head before release. Existing threshold is **95%**; do not silently change it to make a build green. The move families are mechanically integrated but match-tape realism across several plans still warrants review.
