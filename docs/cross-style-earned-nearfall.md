# Cross-style earned scheduled near falls — Stage 2

**Status:** proposed; separate from the read-only [baseline audit](../tools/graph-lab/cross-style-nearfall-audit.cjs). Not merged by this branch alone.

## Evidence

A reproducible audit of **768 genuine completed bouts** (Technical, Brawl, Spots and Safe; novice / competent / elite; 12 / 18 minutes; four opponents; eight seeds) found that none of these plans' legacy scheduled counts carried an exact source-move reference. Even a *plausible* same-owner grounded hit in the previous 30 seconds was uncommon.

| Elite, 18-minute plan | Scheduled counts/bout, old | Plausible recent grounded setup (not proof) | Average stars, old |
|---|---:|---:|---:|
| Technical | 2.41 | 14.3% | 4.02 |
| Brawl | 2.38 | 9.2% | 3.72 |
| Spots | 2.44 | 20.5% | 4.35 |
| Safe | 2.41 | 11.7% | 3.30 |

In the legacy mechanism the scheduled beat could narrate an invented move or shift control independently of the move graph. These are **scheduled** dramatic covers; separately played, real graph pin nodes continue to have their own legal consequences. The old timer's nearfall actor may differ from the last performed action. The audit's apparent-control metric is a proxy, not proof of a specific illegal switch at every sample.

## Proposed source rule

All five plans, including the previously migrated Story, use the same exact source requirement: a genuinely landed, in-ring grounded strike/throw by the **current controller**, with the proper defender down; no stale (older than 30 seconds), already-consumed, missed, countered, blocked, submission-only or floor-only source may generate a scheduled pin count. The ledger stores `earned:true`, `sourceMove`, `sourceT` and `sourceSide`. The referee's kick-out narration uses the real performed move and never inserts a separate, fictional attack.

The match's planned finish, legal winner, normal live pin nodes, defender's genuine counters, training gates, stamina, physical positions, and saveable source-consumption state remain unchanged.

## Distinct match-plan intentions

- **Technical:** legitimate trips, takedowns, arm drags and suplexes should set up measured counts; no free reversal or fabricated cradle.
- **Brawl:** a landed in-ring power or running attack may set up a cover; ringside fighting does not teleport the wrestlers inside for a scheduled count.
- **Spots:** spectacular, landed legal aerial/lucha offence can lead to covers, alongside real orthodox knockdowns. This does not invent a top-rope leap or guarantee a risky move.
- **Safe:** scheduled counts may follow only controlled, non-risky, affordable trips and throws. High-risk attacks and heavy power slams may not be recast as a Safe plan near fall.
- **Story:** Stage 1's real hope/reversal, authored knockdown and finishing-continuity choreography remain intact.

An expired near-fall slot may be delayed or missed instead of being filled with narration. The normal graph still selects an eligible move probabilistically; move pool bias offers plan-appropriate groundings when the scheduled opportunity is near, but it cannot turn a miss, counter or illegal move into a successful cover.

Submission-only stipulations retain the existing **submission escape**, not a new pin count. In this stage even falls-count-anywhere matches require a real **in-ring** landed source for a scheduled count; genuine separately authored floor pin mechanics are unaffected.

## Measured acceptance

**Technical chain continuity:** Two consecutive, genuinely performed, same-owner linked Technical moves can receive a bounded probability lift for their **legal third authored technique** for competent wrestlers only. In the 48-bout in-memory paired seed cohort, the calibrated, non-guaranteed weighting preserved 11 actual triple chains versus 4 on the earlier candidate and 6 on the untouched baseline. This is a narrow audit cohort, not a claim that all wrestlers will perform a three-move sequence in every match. The defender can still counter it, the move has its normal stamina/physical guards, and a cover must still earn its own source. This protects real grappling sequences rather than fabricating extra throws.

**Technical continuity:** Technical scheduled covers use the same strict, performed-source rule, but the original linked wrestling pool supplies the legitimate knockdown. Do not inject timed bonus takedowns into Technical move selection: the matched 96-bout chain trace showed that doing so displaced legal wristlock and rolling-grip triples *before* a cover occurred. Any due near fall waits for a real native takedown; an existing physical grip gets its authored continuation priority.

[Cross-style A/B](../.github/workflows/cross-style-nearfall-audit.yml) compares the same **768 matches before and after** (1,536 completed bout runs), logs the exact source and actor, all booked finish outcomes, timed covers/bout, 18-minute nearfall presence, last-three-minute distinct action IDs, last-minute performed offence and stars. It fails if a scheduled count has no verifiable real source, a planned outcome changes, genuine closing activity collapses, or all meaningful near falls disappear. The previously validated Story smoke test also runs. This is a targeted workflow; avoid additional full workflow reruns for documentation edits alone.
