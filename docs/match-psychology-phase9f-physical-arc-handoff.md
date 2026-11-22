# Match psychology Phase 9F — Keep screenplay arcs out of physical control

## Why
The Phase 9E investigation replayed nine clean matches with a real late authored setup → grounding impact, no observed opponent reversal, yet no booked-winner control at the bell. All nine exposed a silent handoff: three ended neutral with no subsequent opponent action; six reassigned physical control before subsequent actions. All ended in the `finish_setup` dramatic arc, though one unearned switch started at `hope`.

## Root cause
`Graph.enter` changes `Psy.control` to the desired arc controller (often neutral), silently stands the wrestlers up, resets the physical descriptor and clears the actual current graph node. `Graph.step` then resolves a neutral controller through seeded probability rather than a performed move. These are useful long-range staging mechanics, but they can override a real fresh late exchange. In the Director branch, `Graph.advance` also cleared the last action before calling `enter`, preventing the destination arc from checking actual performed control.

## Narrow Phase 9F implementation
- During the final **90 seconds** of a Director-active, booked clean match, on **arc transitions only**, carry a recent (at most **40 seconds** old), actually performed in-ring action's controller, physical position, knockdown and last node into the next dramatic arc. It applies to **either** wrestler and is **not** conditioned on who is booked to win.
- Require the last graph node to be the performed action, a valid resolution and no pending contact, strike, grapple or aerial attempt. Do not confer continuous initiative on poses, taunts, fake finish threats, idle crowd actions or narrated rests.
- Keep the new arc's dramatic scheduling, phase history, objective work and timings. Change only the physical handoff, and narrate continuing earned advantage rather than an imaginary return to the feet or free reversal.
- Leave earlier/dirty/metadata-only contests, genuine counters and escapes, physical move gates, move-success RNG, near-fall and signed finish rules untouched.
- Record bounded, read-only `arcPhysicalWitnesses` and counters (`arcPhysicalRetained`, `arcFinishControlRetained`, `arcLateControlOverrides`) for debugging; these never grant moves or stars.

## Verification
- Re-run **all nine exact original seeds**, with editor-signed structure sheets and normal match decision steps.
- Run the existing 480 Director-active + 480 metadata-only seeded comparison with physical-witness validation and case-by-case evidence for those nine matches.
- Use existing GitHub workflows only; do not add a new workflow.
- Accept a reduction in accidental control resets only alongside unchanged booked finish routes, unaltered defensive validation, no fictitious winning sequences, save/restore compatibility and match-quality regressions passing.
- Assess the results before merging; the diagnostic PR #203 remains read-only and separate.

**Control belongs to performed wrestling. Structure belongs to the dramatic director.**