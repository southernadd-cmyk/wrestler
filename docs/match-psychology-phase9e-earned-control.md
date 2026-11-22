# Match Psychology Phase 9E — Earned control, not scripted control

## Baseline
Merged Phase 9D, sampled across 480 active and 480 metadata-only matches, reported 23 witnessed/linked finishing runways in 240 clean active matches. Seventeen bouts had a performed late authored setup-to-impact link but did not have the booked winner in control at the bell. The earlier audit did not distinguish real subsequent counter-wrestling from arc-control resets.

## Root cause and safety issue
The structure director's dramatic-arc `enter` method resets physical position and can assign control to the arc's intended actor. This can erase control from a genuinely performed last-minute mat landing or defensive reversal. The existing impact guard lasted only a single 10-second exchange and protected the booked winner, not an actual opponent-owned landing. Separately, finishing-runway evidence ignored a genuine losing-side reversal after a linked impact when an arc later gave winner control back.

## Narrow change
- A **performed** in-ring reversal gets one following opportunity before the structure director overwrites real control. The opportunity is symmetric: winner or loser. It never decides a move or draws RNG.
- A physically preserved authored setup → grounded impact stays intact for at most two exchange ticks (20 seconds) for either wrestler. A stand-up, newer action, lost control or pending attack stops the protection. No assured landing or pin.
- A genuine late loser reversal breaks earlier finishing-runway attribution even if a later dramatic arc restores winner control without a performed wrestler action.
- The original match/finish contracts, exact physical legality, signed plans, allowed wrestling styles, near-fall rules, stamina, counter probability, and move resolution are unchanged.

## Verification
Use only the established seven PR checks and the existing 960-bout matched comparison; no new GitHub workflow. Test symmetric real reversal/mat control, strict event attribution, RNG preservation, and that an unearned arc reset cannot resurrect a countered finishing sequence. Report the difference from Phase 9D as *verified evidence*, not an improvement merely because a counter is ignored. Do not merge without explicit approval.
