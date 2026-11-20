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

## Independent-seed coverage audit (20 November 2026)

This is an independent test, **not a replacement for the 1,000-match release gate**. The diagnostic lives in `tools/graph-lab/phase4-independent-seed-audit.cjs`, runs automatically as a separate job in the Phase 4 workflow, and produces the `phase4-independent-seed-coverage` artifact. Four cohorts use the exact same roster, opponent, match plan, show slot and finish patterns as `tests/catalog.test.cjs`; each cohort uses a mutually disjoint deterministic seed offset. No engine code, RNG, guard or threshold was changed by this audit.

| Cohort | Independent actions seen / 442 | Coverage | Existing 95% gate |
|---|---:|---:|---|
| Original fixed seeds | 418 | 94.57% | Fail |
| Offset 104729 | 418 | 94.57% | Fail |
| Offset 209458 | 421 | 95.25% | Pass |
| Offset 314187 | 425 | 96.15% | Pass |
| Union of all four | **435** | **98.42%** | A union is not an individual release cohort |

**Seven moves had no landed event across all 4,000 matches:**

- `dv_moonsault` — moonsault to the floor; never selected or landed; requires a rare ring-to-floor diving opportunity and significant stamina/clock
- `nk_tombstone` — tombstone piledriver; never selected or landed; front facelock, lifting capacity and late-match timing
- `pw_running_powerbomb` — running powerbomb; never selected or landed; front facelock, lifting capacity, high stamina and late match phase
- `pw_sitout` — sit-out powerbomb; never selected or landed; similar standing lift/control restrictions
- `sm_dragon_sleeper` — four actual committed attempts; **two blocked and two aborted**, zero landed; ground-head control and stability on the following tick need further inspection
- `sx_delayed` — delayed vertical suplex; never selected or landed across these cohorts; owned front facelock required
- `sx_falcon_arrow` — four actual committed attempts; **all four aborted**, zero landed; check exact reason a previously legal committed move fails to resolve

Other repeatedly unseen moves are not permanently unreachable: `pw_powerbomb` landed once, `sx_brainbuster` twice, `sx_deadlift_bridge` three times, and `lc_rope_walk` five times across the expanded sample. This confirms that the apparent list of missing moves in any one 1,000-bout cohort is partly seed-sensitive.

**Conclusion:** the existing 1,000-bout 95% coverage gate does not currently give a stable pass across independent cohorts (two pass, two fail). The original unmodified gate must still pass before merge. This is **not** evidence for lowering the bar or padding the simulator with arbitrary move weights. Address the particular consistently absent setup and aborted-attempt paths, especially `sx_falcon_arrow` and `sm_dragon_sleeper`, then rerun exact and independent cohorts. Preserve the match-quality A/B, physical-grip, finish-contract and style-diversity gates.
