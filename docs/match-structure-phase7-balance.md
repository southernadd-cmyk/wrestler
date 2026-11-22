# Match Structures — Phase 7: Graph Lab comparative balance

## Reproducible method
Run `node tools/graph-lab/structure-comparison.cjs` from the repository root. The script signs a real backstage v4 editorial plan, then runs the exact graph twice: once with the optional Director active, and once with the same plan as metadata only. Each pair uses identical seeded wrestlers, booked finish, plan and clock.

The full grid crosses **four structures × both leads × all five plans × four performer-style pairings × 8/12/18 minutes**: 480 active and 480 metadata-only control matches. `--quick` is a smaller 160+160 diagnostic. All credited moves must exist on the real graph tape at the recorded time and within the agreed window. Every single-impact closing payoff also requires a distinct witnessed earlier setup within 150 seconds; every completed Heel escape must answer a genuine recent opponent attack.

This is an **audit and narrow balance repair**, not a rewrite of match plans, stars, legal actions, career saves or booked results. No new workflows.

## Untuned baseline — successful CI run 45054079866
| Structure | Objectives witnessed | Four of four completed | Unique four-stage action paths /120 | Mean stars active/control |
|---|---:|---:|---:|---:|
| Classic American | 54.2% | 18.3% | 101 | 2.594 / 2.633 |
| King's Road | 49.8% | 13.3% | 97 | 2.546 / 2.596 |
| Chickenshit Heel | **98.8%** | **95.0%** | **118** | 2.565 / 2.623 |
| Dominant Ace | 55.2% | 5.8% | 106 | 2.612 / 2.621 |

**Diagnosis:** Heel repeats very few exact four-action paths, but almost always completes its entire dramatic structure. A late routine counter was being credited as a desperate escape even without any recent opponent attack. Other structures were disproportionately losing their final objectives because `finish_build` required two independent, qualifying closing moves after an earlier objective finally resolved. These are evidence and pacing issues, not an argument for automatic stars or scripted finishes.

## Accepted targeted changes
1. **Heel move/arc guidance is eased**, but all wrestler actions still pass ordinary physical, stamina, grappling and safety checks. There are no scripted achievements.
2. A **desperate escape must now follow an actual impactful attack by the other wrestler**, within at most 150 seconds (scaled for match length). The evidence remains on the saved structure ledger. An unrelated late counter no longer earns the fourth objective.
3. A **decisive closing exchange** may be earned by either two distinct qualifying late moves or one genuine impactful late move continuing a *different* witnessed setup from an earlier objective within 150 seconds. Both are actual on-tape events.

## Rejected trial: forced late handoff
An early handoff at roughly 84% match progress was tested in successful run **45055257129**. Although it enabled some adapted closing objectives, it prematurely marked many King's Road tactical callbacks and Dominant Ace reassertions missed. This **reduced** their overall earned objective rates compared with the earlier causal-payoff-only trial. The handoff was deliberately discarded. No final objective is made successful by timing alone.

## Expected retest comparison
The causal-payoff-only trial (successful CI run **45054636935**) moved King's Road from 49.8% to **54.6%** earned objectives and 13.3% to **22.5%** full layouts; Dominant Ace from 55.2% to **57.3%** and 5.8% to **12.5%**. At that point Heel still completed 98.1%, proving weights alone were insufficient.

The subsequent danger-evidence trial (successful CI run **45055257129**) brought Heel to **85.0%** witnessed objectives and **45.0%** completed layouts with **116 different four-stage action paths in 120 bouts**, while preserving all 120 booked results. That same run included the *rejected* handoff for King/Ace, so the final accepted build must be verified again with it removed.

## Guardrails
Phase 0 legacy fingerprint, Phases 1–6 contracts, actual finish methods, in-progress save determinism, the five performance plans, previous career match-quality checks and browser journeys must remain green. The new audit measures named-call success independently of structure coherence, and does not change the existing star-rating formula. A miss stays a miss; an adapted objective must have witnessed physical evidence. Keep the Phase 7 PR unmerged until the final CI is green and the A/B comparison has been read.
