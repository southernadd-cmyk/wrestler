# Phase 9G — Credit genuine counters, preserve earned-cover physical ownership

## Baseline and actual cases
Phase 9F merged as `7bd150e`. Its 960-bout audit recorded two clean Director-active bouts with a late authored setup → impact followed by loss of booked-winner control but no **recorded** opponent reversal. The read-only Phase 9G diagnostic (draft PR #205, first commit `f3f2411`) reproduced both:
- `p7-2-dominant_ace-w-technical-18` seed **1070563**, booked `win_clean`: real `shoulder_tackle` at -40s, credited `scheduled_nearfall` at -30s, then an unearned control change before the opponent's `lockup` at -20s. The director registered two late arc control overrides and zero physical-handoff witnesses.
- `p7-3-classic_american-w-technical-18` seed **1062561**, booked `lose_clean`: after a genuine `shoulder_tackle`, the opponent successfully reverses `sm_crossface` via `sm_crossface_rev` at -50s. This is a valid real defensive counter. The earlier read-only filter omitted it because its `grappleResolution` says **counter**, not **landed**. This is an attribution bug, not a reason to protect the booked winner.

The old count of three replay control gaps also included `scheduled_nearfall` pseudo-records without `preControl`. Count only actual `A[e.id]` graph actions. A voluntary `catch_breath` may correctly give the opponent an opening; do not automatically treat every action-to-action actor change as an unearned reversal.

## Focused fix
1. `Graph.enter` keeps its Phase 9F last-action proof. Add a **second narrow proof path**: the current last event is an explicitly **earned** `scheduled_nearfall` with the same real controller and grounded physical position, the graph node is its documented `stand_reset`, and its exact source move still exists in the tape with legal grounded position and validated landed resolution. Require the source to be no older than the original 40-second Phase 9F window. Narration still describes continuing real control, never a guaranteed pin or another move. A legacy/uncredited scheduled count does not qualify.
2. A successfully performed defensive grapple/contact/strike/aerial **counter** is genuine reversal evidence. `closingValidEvent` and the read-only matched audit accept `resolution='counter'` only for `n.reverse` moves, not blocked/aborted/missed attacks. This prevents an interrupted run from being reported as an unbroken finishing sequence.
3. Keep `arcPhysicalWitnesses` tied to the *actual landing source*, not the pseudo-event, so proof checks and saves remain factual. Increment `arcEarnedNearfallRetained` for independent audit.
4. Filter pseudo nearfalls and outcome records out of *move-to-move* control-gap calculations. Preserve the separate outcome ledger and earned-cover evidence.

## Safety and verification
- All original nine Phase 9F seeds plus focused credited-nearfall and counter-attribution tests.
- Same 480 Director-active / 480 metadata-only seeded comparison; classify residual losses using corrected reversal accounting.
- Both wrestlers protected symmetrically, no reserved booked-winner control or free follow-up, no move probabilities or physical legality bypassed, no new finish event, stars, or RNG draw in guard.
- No new workflow, review all seven existing CI workflows and matched audit before merge. Never automatically merge.
