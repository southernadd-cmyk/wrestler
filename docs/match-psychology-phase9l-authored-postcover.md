# Phase 9L — optional source-authored post-cover continuity

## Evidence

The corrected Phase 9L 960-bout matched audit (480 active / 480 control; 240 clean active) distinguished logged graph responses from actual offence after the 9K witnessed near-falls. For the **211 eligible late near-fall events** with 40 seconds remaining, the next 40 seconds contained **96 same-owner offensive responses**, of which only **2** were a direct \`A[source].next\` link from the genuine move that produced the cover. By plan: Story 1/23, Technical 0/7, Brawl 0/23, Spots 1/15, Safe 0/28. This is evidence of low direct source-continuity, **not** evidence that the other 94 legal actions were fake or that every post-kickout should continue the same combination.

A scheduled **earned** cover legitimately sets \`g.node = 'stand_reset'\` after counting. That avoids a fictional finished pin, but disconnects one still-grounded attacker from a source-authored mat follow-through that could remain physically legal. The first-pass audit incorrectly called some resets, covers and lockups "attacks"; that was corrected before choosing this candidate. See the separate read-only investigation PR.

## Narrow candidate

In Director-active, booked clean matches during the last 180–40 seconds, immediately after a **genuinely witnessed** near-fall:

- Check the last event's exact owner, timestamp, physical state and evidence from the 9K observer. Fabricated, legacy, stale and interrupted counts do not qualify.
- If the wrestlers are **still in-ring, on the mat and controlled by the actual covering wrestler**, optionally re-offer only the *original performed grounding source node's existing* \`next\` options which require a grounded opponent and which pass the full \`isValid\` action gate. Authored cradle kick-outs may qualify only if their own source has legal grounded options.
- Exclude another cover/near-kickout, a counter, an unsafe/risky action, blocked attempts, rest and illegal positions. Safe retains its extra cost ≤2.2 restriction.
- Weight these existing legal options modestly, with at most a **6×** pool-weight cap and relative weight target **0.38×** competing legal actions. No chosen action or landed result is forced; no extra RNG draw. Ordinary stand-up, counters and all non-source legal actions still compete.
- Treat both sides identically regardless of booked winner. Neither a near-fall nor an agreed finish confers an invented physical counter, a move, control, stamina, stars or a completed finishing runway.

## Verification gates

- Existing Phase 9L read-only \`PHASE9L_NEARFALL_RESPONSE_JSON\` must report changes in **real same-owner offensive responses and direct source-authored next-node links**, not mere resets or fabricated pin counts.
- The same 960-bout matched test must preserve **480/480 signed outcomes**, zero unexplained late-control losses, zero finish-route fallback, no metadata-only move-pool effects and believable star/move-risk deltas versus the green corrected Phase 9L diagnostic.
- Focused regression assertions exercise all 4 structures × 5 plans; exact real source and present physical legality; normal alternatives remain; never grant opponent/winner side control; no RNG consumption; restore equality; clean/active restriction; no duplicate cover and no hard Safe move-family ban.
- No new GitHub workflow. This is a gameplay **candidate**, not a completed or approved balance change. Do **not merge** until simulation results are reviewed and the user explicitly approves.

## Comparison to baseline

Baseline on corrected diagnostic PR before this gameplay change: **96** same-owner offensive post-nearfall responses, **2** direct source-authored links, **26** strict finishing runways with **13** fully witnessed, zero unexplained late-control losses, 480/480 active booked outcomes. Since gameplay changes may legitimately alter subsequent moves, any increase or decrease must be measured on the exact same fixed cohort, never asserted in advance.
