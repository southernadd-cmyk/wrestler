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

## Gate for a subsequent gameplay candidate

Before changing a move weight, use the actual new counts to identify whether the main problem is (a) clock-limited kick-outs, (b) genuine opponent reversals, (c) voluntary/other physical moves, or (d) an absence of eligible follow-ups. A sensible gameplay follow-up may only favour existing, currently legal authored graph links **after real wrestling evidence**. It must remain optional and preserve physical position, both wrestlers' agency, Safety/Spot restrictions, contracted finish, RNG discipline and save compatibility.

**Do not reclassify nearfalls as finish runways, award extra stars, enforce winner control, hard-ban ordinary risky Safe moves, or add more workflows.** Run existing focused checks and the matched sample; any future gameplay change must compare against the merged 9K baseline and keep 480/480 booked outcomes, zero unexplained late control losses and zero finish fallback.

**This branch is diagnostic only. Do not merge until reviewed and explicitly approved.**
