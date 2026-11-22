# Match Psychology Phase 9D — Legal late finishing opportunities

## What the Phase 9C audit showed
The merged 960-bout audit had 19 verified causal finishing sequences among 240 clean finishes, while 63 clean bouts performed a real authored setup-to-impact link. Of those 63, 28 had only stale links (>90 seconds before the bell) and 15 also had a late link but lost actual winner control. These diagnostics overlap.

## The specific failure
The phase 9C late-move offer ended at 95% of the match, and the arc controller stopped protecting a setup at the same threshold. In an 18-minute match this leaves 54 seconds; a performed link in the final exchange had to survive until the bell with neither the legal offer nor its protected handoff available. That cut-off was unrelated to whether a candidate move remained physically possible.

## Scope of this pass
- Extend **booked-winner** late authored offers to 98% of elapsed time, only if **at least 20 seconds** remain to choose an actual setup and impact. Keep the losing-side closing offer on the original 95%/30-second gate.
- Preserve one real, valid in-ring winner setup against an arc reset through 98%, without inserting or guaranteeing a move, a finish or control.
- Keep the true physical move validator, stamina/safety gates, booked finish, deterministic RNG and existing earned near-fall contract.
- Measure genuine final-minute and final-30-second links separately in the **existing** 960-match audit, and test a genuine late strike-trade-to-clothesline sequence with a forced arc expiry.

## Verification
Run the existing focused Node regression and 480 active + 480 matched controls via the Simulation tests workflow. Compare 9D to merged 9C: 19/240 verified causal sequences (6 fully witnessed, 13 merely linked), 28 stale-link bouts and 15 late-link control losses. Never substitute possibilities, offers, or emitted commentary for performed move evidence. No new workflow.
