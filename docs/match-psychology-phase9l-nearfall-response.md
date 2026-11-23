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

**Audit correction:** The first run counted **143 same-owner non-rest graph responses**, not necessarily 143 attacks. Inspection of the actual action IDs revealed `stand_reset`, `cover`, `lockup`, `waistlock` and other non-offensive nodes included in that tally. The original 22/143 source-authored-edge ratio was consequently invalid as an offensive-continuation statistic. These figures are preserved only as a record of the diagnostic's first-pass classification, **not a gameplay baseline**. The next revision separates true offensive actions from resets, covers, setups and other responses before calculating source-edge rates; only its verified results should guide gameplay. All counts refer to **near-fall events, not unique matches**; the same bout may contribute overlapping response windows. The 66 kick-outs within 40 seconds of the bell remain excluded from full-window response analysis.

The timestamp-only nearfall-before-credited-setup metric is **15** occurrences (Story 5, Technical 2, Brawl 2, Spots 3, Safe 3); it is not evidence that only 15 meaningful sequences existed, because it excludes earlier setups, uncredited combinations and setups more than 120 seconds later. It must NOT be used as a success-rate denominator.

**Decision:** Do not make a gameplay balance decision from the first-pass response label. The later audit must verify the actual offensive count and authored edges; genuine defensive reversals remain legitimate and must not be suppressed. Preserve all 9K/9G baselines.

## Gate for a subsequent gameplay candidate

Before changing a move weight, use the actual new counts to identify whether the main problem is (a) clock-limited kick-outs, (b) genuine opponent reversals, (c) voluntary/other physical moves, or (d) an absence of eligible follow-ups. A sensible gameplay follow-up may only favour existing, currently legal authored graph links **after real wrestling evidence**. It must remain optional and preserve physical position, both wrestlers' agency, Safety/Spot restrictions, contracted finish, RNG discipline and save compatibility.

**Do not reclassify nearfalls as finish runways, award extra stars, enforce winner control, hard-ban ordinary risky Safe moves, or add more workflows.** Run existing focused checks and the matched sample; any future gameplay change must compare against the merged 9K baseline and keep 480/480 booked outcomes, zero unexplained late control losses and zero finish fallback.

**This branch is diagnostic only. Do not merge until reviewed and explicitly approved.**
