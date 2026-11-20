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

The 1,000-bout catalogue audit now constructs the real pending dive before checking generated defensive reachability and validates event attribution. The physically credible outside-toss, floor-regroup and apron-stand setups also give the nine real dive parents a modest organic selection weight; no extra nodes or phantom defences are added. Graph Lab and the 600-bout CI review show the distinct actual aerial/springboard/dive attempt outcomes and any failed ledger attribution.

## Stamina and pacing investigation

The previous matched Spectacle-wrestler audit found Spot-fest about **2.22★**, versus **2.58★** under Technical with identical wrestler/opponent/booking/seed inputs, despite more landed aerials. The difference came mainly from ten-second tick wrestling quality and crowd, not botch penalties. This PR extends `tools/graph-lab/flyer-rating-audit.cjs` with **early vs late quality** and **end-of-match stamina** for three wrestler styles under four plans (720 matched bouts). This separates accumulated fatigue effects from any plan/scoring imbalance. **Measured baseline from the expanded audit (60 matched Spectacle bouts per plan):** Spot-fest ends with **1.7 stamina** and late-match Q **37.4**, compared with **10.2 stamina** and late-match Q **44.3** under Technical. It has comparable early Q (**57.1** vs **59.4**) but burns through its reserves more quickly. A bounded stamina adjustment therefore increases the efficiency coefficient for safe/high-ringcraft wrestlers from **0.0032 to 0.0047**, with a floor of **1.07** instead of **1.11** per ten-second drain factor. Untrained workers with combined ring+safety scores of 120 or less still pay the full spot drain; no botch probabilities or raw stars are changed. A Spot-fest wrestler under **38 stamina** is also more likely to select the existing `catch_breath` action when standing, instead of racing through another unsafe exchange. This is a **real narrated action** (with its original −5.5 exertion cost), not a hidden stamina restore; it still competes with legal attacks and is discouraged when repeated. `tests/phase6b-pacing.test.cjs` checks the increased preference without changing non-Spot-fest pacing. Matched CI and season-soak tests must verify that this improves continuity without erasing risk or inflating unrelated plans.

## Acceptance criteria

Do not merge with a red test. Maintain the existing **at least 700 genuine actions** in the six-career soak, preservation of booked finishes and saved matches, correct physical legality, zero invalid committed attempts and functional Graph Lab desktop/mobile UI. Rerun the same seeded scenario comparison and examine actual tapes to evaluate match quality.

## Five-plan earned-quality balance (all plans, not only the flyers)

The former **+4 Technical quality every ten seconds regardless of moves** has been replaced by bounded quality earned from real, distinct actions in a rolling 180-second window. The same mechanism now applies to **every** match plan:

| Plan | What actually earns quality | Maximum earned quality points |
|---|---|---:|
| Technical Showcase | Landed chain, submission, suplex, ground, rest-hold or neck wrestling, weighted by ringcraft | +4.0 |
| Spot-fest | Distinct successful high-risk aerial, springboard, dive, lucha, corner, ringside or superplex moves, scaled by ringcraft *and safety* | +3.6 |
| Brawl | Genuine strikes, running attacks, power, ringside, corner and rope offence, weighted by ringcraft/psychology | +3.5 |
| Tell a Story | Real landed moves within heat, hope, denial, comeback or finishing story arcs, weighted by psychology and ringcraft | +3.5 |
| Keep It Safe | Distinct successful low-cost, low-risk chain/hold/ground/pin/strike/neck moves, scaled by safety | +1.5 |

Keep It Safe deliberately retains its established **-2 quality-point baseline**, so it does not outscore a well-worked risky match just because it avoids danger. Botches, pace, risk, stamina and match structure continue to have their ordinary separate effects. No plan earns a positive quality award by selection alone, repeated identical move spam, a counter to a non-attempt, or a failed attack. The rating function uses a bounded rolling *quality* contribution, not a free additive star bonus. The audit now compares all **five plans against all four wrestler styles**, on fixed worker/opponent/seed/finish/slot inputs (20 cells, 1,200 matches at 60 each). Acceptance also requires the original full careers and historic tests to remain green.
