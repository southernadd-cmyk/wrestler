# Phase 9L — late near-fall response investigation (read-only)

## Purpose

Phase 9K, now merged, verifies a real near-fall with actual graph evidence without treating it as a finishing move. In the same 960-bout matched sample (240 active clean matches), there are 26 credited closing runways and 13 fully witnessed four-beat sequences, with zero unexplained late control losses. The next question is **what legitimately happens after the kick-out**: continuing offence, an earned defender reversal, a new opposing attack, or no timely substantive exchange.

Do not increase ending frequency by assuming the booked winner must retain control. An opponent's real reversal or ordinary offence remains authoritative; neither the signed sheet nor a scheduled near-fall grants a free attack.

## New diagnostic

The existing \`tools/graph-lab/structure-comparison.cjs\` reports \`PHASE9L_NEARFALL_RESPONSE_JSON\` for the same seeded cohort. For **Director-active clean matches only**, it:

1. Starts with Phase 9K's existing \`final.nearfallDrama.moments\`, restricting to the final 180 seconds.
2. Separates nearfalls with **less than 40 seconds** before the bell so clock expiry is not mistaken for a failure to continue.
3. For nearfalls with the full 40 seconds remaining, inspects the **first actual subsequent** non-rest, non-blocked, performed in-ring graph action within 40 seconds. It classifies a same-owner attack, genuine authored defensive reversal, independent opposing attack, other physical response or no such response. A counter is credited only with an actual reversal outcome; it cannot be inferred from a screenplay transition.
4. Records when an independently credited closing runway setup followed a nearfall within 120 seconds, distinguishing linked and fully witnessed runways. This is *temporal association only*, not evidence that the nearfall caused the final sequence.
5. Requires exact reconciliation of all nearfall and first-response categories.

The result is grouped by the five plans: Story, Technical, Brawl, Spots, and Safe. The sample, source events, nearfall attribution and scripted-risk categories are unchanged. No new workflow or new matches are added.


## Verified results: original Phase 9K matched seed cohort

The existing **Simulation tests** PR workflow completed successfully (run \`45084555799\`). Its focused safety job executed the full matched \`structure-comparison.cjs\` audit: 960 matches, of which 480 had the active Director and 240 of those had clean booked finishes. The new observer's reconciliation assertions passed; prior physical-continuity trace remains at **zero unexplained late control losses**.

| Match plan | Late near-falls | <40 s left | Eligible | Same-owner pressure | Real defensive reversal | Opponent offence | Other action | No response |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Story | 66 | 17 | 49 | 37 | 2 | 3 | 2 | 5 |
| Technical | 41 | 13 | 28 | 16 | 5 | 1 | 1 | 5 |
| Brawl | 60 | 14 | 46 | 33 | 4 | 3 | 1 | 5 |
| Spots | 42 | 11 | 31 | 19 | 4 | 2 | 1 | 5 |
| Safe | 68 | 11 | 57 | 38 | 10 | 3 | 0 | 6 |
| **Total** | **277** | **66** | **211** | **143** | **25** | **12** | **5** | **26** |

**Interpretation:** 143/211 (67.8%) eligible kick-outs are followed within 40 seconds by a further same-owner physical attack. Another 42 have different genuine physical responses (25 recorded defensive reversals, 12 opponent attacks, five other actions). Only 26/211 (12.3%) lack a qualifying response; 66 late kick-outs were too close to the bell to evaluate on the same 40-second basis. These are **near-fall events, not unique matches**, and the same bout may contribute multiple events. Some near-falls overlap rolling windows, so temporal links must not be interpreted as independent causal outcomes.

The timestamp-only nearfall-before-credited-setup metric is **15** occurrences (Story 5, Technical 2, Brawl 2, Spots 3, Safe 3); it is not evidence that only 15 meaningful sequences existed, because it excludes earlier setups, uncredited combinations and setups more than 120 seconds later. It must NOT be used as a success-rate denominator.

**Decision:** There is no evidence here for a broad continuation/protection buff. Post-cover physical continuation already occurs frequently, and genuine defensive reversals must remain legitimate. Investigate specific *authored setup → physically legal follow-through* opportunities and repeated generic continuations before selecting any targeted gameplay change; preserve all previous 9K/9G baseline constraints.

## Gate for a subsequent gameplay candidate

Before changing a move weight, use the actual new counts to identify whether the main problem is (a) clock-limited kick-outs, (b) genuine opponent reversals, (c) voluntary/other physical moves, or (d) an absence of eligible follow-ups. A sensible gameplay follow-up may only favour existing, currently legal authored graph links **after real wrestling evidence**. It must remain optional and preserve physical position, both wrestlers' agency, Safety/Spot restrictions, contracted finish, RNG discipline and save compatibility.

**Do not reclassify nearfalls as finish runways, award extra stars, enforce winner control, hard-ban ordinary risky Safe moves, or add more workflows.** Run existing focused checks and the matched sample; any future gameplay change must compare against the merged 9K baseline and keep 480/480 booked outcomes, zero unexplained late control losses and zero finish fallback.

**This branch is diagnostic only. Do not merge until reviewed and explicitly approved.**
