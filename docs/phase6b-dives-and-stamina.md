# Phase 6B — outside dives, top-rope continuity and flyer stamina audit

**Status:** implementation PR, not yet merged. Continues the merged Phase 6 environmental counters without modifying the 340-action catalogue or the existing match scoring.

## New mechanic: all nine named dives

The live engine already required the attacker to be **in the ring** (or **on the apron** for two apron dives) and the opponent to be on the floor. However, generated `_rev` and `_blk` defences were not tied to a real committed dive. All nine authored `dv_*` attacks now use the same serialisable, two-beat `aerialAttempts` ledger already used by top-rope and springboard moves.

- Start only from a physically legal ring/apron-to-floor setup, and only if at least one ten-second resolution beat remains.
- A defender's specific counter/block is legal only while that precise parent attack is pending. No phantom landed attack may follow a successful defence.
- Preserve floor position when an outside dive is aborted: do not teleport the wrestlers into the ring. A named dive selected on the very last tick cannot bypass the commitment system.
- Respect the original referee count-out and normal transition/return-to-ring rules.
- Maintain the existing JSON save/restore format, now with the `pendingAerial.position` accurately recording either `top` or `outside`.
- Named top-rope and springboard moves now require the **attacker actually on the ropes** and the opponent **in the ring**. A two-wrestler `top_follow` contest belongs to the superplex system, not a magically launched frog splash.
- Scripted high spots retain their separate `scriptedSpotAttempts` success/botch ledger; the changes here concern graph-selected named attack/counter sequences.

## Test gates

`tests/phase6-dive-continuity.test.cjs` tests nine landings, nine exact-parent counters, nine blocks, physical ring/apron/floor eligibility, interruption/abort behaviour, serialized pending replay, top-rope launch checks and avoidance of impossible launches from a mutual top contest.

The 1,000-bout catalogue audit now constructs the real pending dive before checking generated defensive reachability and validates event attribution. Graph Lab and the 600-bout CI review show the distinct actual aerial/springboard/dive attempt outcomes and any failed ledger attribution.

## Stamina and pacing investigation

The prior matched Spectacle-wrestler audit found Spot-fest about **2.22★**, versus **2.58★** under Technical with identical wrestler/opponent/booking/seed inputs, despite more landed aerials. The difference came mainly from ten-second tick wrestling quality and crowd, not botch penalties. This PR extends `tools/graph-lab/flyer-rating-audit.cjs` with **early vs late quality** and **end-of-match stamina** for three wrestler styles under four plans (720 matched bouts). This separates accumulated fatigue effects from any plan/scoring imbalance. **No stamina coefficient or free star bonus has been changed**; further tuning should be contingent on measured evidence and independent quality gates.

## Acceptance criteria

Do not merge with a red test. Maintain the existing **at least 700 genuine actions** in the six-career soak, preservation of booked finishes and saved matches, correct physical legality, zero invalid committed attempts and functional Graph Lab desktop/mobile UI. Rerun the same seeded scenario comparison and examine actual tapes to evaluate match quality.
