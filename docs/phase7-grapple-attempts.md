# Phase 7 — grapple attempt state: readiness and implementation gates

> **v0.4 release status:** PR #103 subsequently **merged**; all four audited grapple-attempt pilots are available in the v0.4 engine. See the [current release](v0.4-release.md) and [next technique/realism review](technique-and-realism-review.md). Original experiment data and reference counts are retained.

**Original draft status, now superseded:** the four-move implementation from PR #103 has since been merged and deployed.

Phase 6 introduced real persistent, two-beat aerial commitments. Phase 7 should cautiously extend this to standing suplexes and grounded submissions, **not** turn every catalog move into a two-beat action.

## First audited candidates

- Standing: `sx_vertical` (vertical suplex), `sx_german` (German suplex).
- Submission: `sm_sleeper` (sleeper hold), `sm_ankle_lock` (ankle lock).

The executable readiness test checks that the *actual shipped graph* contains the named parents, counter-parent pointers, actor-reversal flag, and compatible entry positions; it prints the attack, reversal and optional block landing zones. This is an eligibility audit, not evidence of attempts in matches.

## Implementation contract

1. Introduce a **single pending grapple attempt** for a deliberately allowlisted attack, with immutable `id`, `side`, `seq`, `at`, `position` and type (`throw` or `hold`). Do not allow simultaneous aerial and grapple commitments.
2. Commit only where existing `Graph.isValid` passes and at least one later match tick remains. Preserve all existing weight, lift, timing, stamina and position guards. Announce the **specific intended move**, without narrating a landed slam or locked hold.
3. On the very next tick, ahead of `Graph.advance` and scheduled spots, resolve exactly one: parent move, its exact generated `_rev`, or its existing `_blk` (if present). Defence probabilities must be bounded and measured rather than copied uncritically from aerial counters. The selected existing node is still passed through `Graph.apply`.
4. Only the corresponding generated reversal/block is valid while an attempt is pending; unrelated alternatives cannot be selected. The original parent action must still be physically valid at resolution. A failed setup records an abort rather than an invented landing. Successful submission application is **not** the booked match finish.
5. Persist the attempt and outcome history in the already-serialised graph, preserve RNG replay, migrate old saves safely, record the real node ID plus `attemptedMove` and sequence in `graph.events`, and interrupt on surprise endings.
6. Run exact-path unit tests, legacy save/load, pending state across full real ticks, contracted finish tests, catalog reachability, 1,200 fixed seeds and five-meeting rivalry novelty. Compare *actual* move/result pairs and commentary for nonsensical order.

## Preconditions before promoting to live

- Review `sx_german` and `sm_ankle_lock` positional continuity and existing block/counter wording; do not assume generic reversal text is correct for a two-beat attempt.
- Ankle lock is a grounded hold; German suplex is a standing throw. They must not share one generic setup description or automatically share the same defence odds.
- Determine whether existing standalone generated counters should become exclusive to a committed attempt. Update the catalog-reachability harness at the same time or it will report false failures.
- Add a fixed-seed report counting **attempts, outcomes, interrupts, orphans and save/replay divergence** before broadening beyond the pilot.

Phase 6 remains the live implementation until these gates pass. See [Phase 6](phase6-aerial-attempt-state.md).


## Implementation on PR #103 (since merged)

The match engine now implements `startGrapple`, `resolveGrapple` and `abortGrapple` for the four exact pilot IDs. `graph.pendingGrapple`, `grappleAttempts` and `grappleAttemptSerial` are serialised alongside the existing aerial state. A tick resolves any pending grapple before changing story arcs, and `finishCue` marks interruptions rather than reporting a fictitious completed throw or locked hold.

All matching generated pilot reversals and blocks require their exact parent grapple attempt. The other catalogued grapples are unchanged; no moves, graph edges, or training-school allocations were added. A smaller defence range is used for throws and a distinct hold-specific range for submissions. `tests/grapple-attempts.test.cjs` exercises four parents, distinct outcomes, save/resume, interruption, legacy migration and overlapping-attack rejection. The graph catalog's legality probe now begins a named grapple before testing these four generated alternatives.

**Historical release gate, since satisfied:** the original draft required simulation and transcript/baseline checks. These attempt mechanics shipped; broader grip-specific realism still needs a separate review.
