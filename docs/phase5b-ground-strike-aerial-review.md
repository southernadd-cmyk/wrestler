# Phase 5b — second technique audit: submissions, strikes and aerial counters

This is a **follow-on** to [Phase 5's first 80-worker audit](phase5-training-identity-expansion.md). The Office retains its four performance styles, the original school assignments and all career save fields.

## Changes, with honest coverage

- **30 additional manually reviewed existing moves**, from 60 to **90 of 336 catalogue moves (26.8%)**. **246 are still outside the curated mechanical registry**; these are not broken, simply not annotated in this optional technical layer.
- **17 grounded submissions** are distinguished by their real game target (arm, leg, neck or back). For example a Boston crab targets the back while a single-leg crab targets the leg; a crossface is not a keylock; the kneebar and heel hook have different control mechanics. These distinctions come from the authored game's text and current graph fields, not an imported wrestling dataset.
- **Eight ring striking actions** are annotated: forearm, elbow, European uppercut, rising knee, low kick, roundhouse, palm strike and rib kick. The new **"wrestling" tag is neutral**: none of these actions is automatically a boxing-school advantage. Tomás Ash's explicitly documented boxing background remains an influence on the reviewed straight-jab and body-punch chain, not every ring strike.
- **Five aerial attacks** are reviewed together with the existing move-specific generated counters: frog splash, senton, flying crossbody, low missile dropkick, and springboard cutter.

There are **16 carefully gated live follow-throughs** in `Graph.TECHNIQUE_TRANCHE2`. They include grounded head/arm and leg-control progressions; close-range forearm/elbow, body punch/knee and low/high-kick transitions; and two guarded top/rope entries. All source/destination positions must agree with the shipped match graph. Like the older Phase 3 and Phase 5 sets, their small edge weights do not override the original physical requirements, late-match timing, stamina, heavyweight agility, or the booked finish.

**No 5b background allocations were made**: the earlier 40 bespoke/hybrid + 40 general identities, including Kit's explicitly *provisional* lucha/acrobatics hybrid, remain unchanged. School weighting is still bounded to **1.0–1.28**, and only destinations of approved executable links qualify.

## Aerial counter boundary

The existing engine automatically generates nodes like `ar_frog_rev` with a `counterOf` pointer to the relevant attack. They are *reversal alternatives*, not actions mechanically scheduled after the attack succeeds.

**Important limitation:** the current engine does not persist a specific attempted aerial move as an intervening state. Therefore Phase 5b **does not** add physically nonsensical direct edges such as `ar_frog → ar_frog_rev`: after the frog splash the graph is on the mat, while its reversal can only be attempted while the attacker is airborne from the top.

Instead:
- Registry checks verify each counter exists, is marked `reverse`, and points to precisely the reviewed parent;
- Real `Graph.isValid` checks prove top-position eligibility and reject the same counter after a landed move;
- The baseline suite counts actual executions of those existing counter-node IDs, without asserting that the engine records an individual aborted attempt.

The next engine-level change, **if wanted**, would be an explicit attempted-move state that links a committed dive to a legal block, counter or landing. That is a separate state-machine feature requiring save/replay design, not a metadata shortcut.

## Automated validation

`node tests/phase5b-technique-review.test.cjs` uses the real browser script load order and checks:
- all 90 entries are real catalogue nodes, with correct live `requires`, `zone` and target;
- the 11 original Phase 3 and 14 original Phase 5 curated links remain separate;
- the 16 new links have correct source exit and target entry positions and explicit review metadata;
- the neutral wrestling tag does **not** give a boxer extra knees/European forearms;
- the real `Graph.pool` applies a bounded catch benefit to newly linked groundwork;
- a genuine top-rope counter becomes invalid after landing;
- template roster and graph snapshots are not mutated;
- 24 actual matches respect the contracted finish; replaying an identical seed under the same version is deterministic.

The [fast curated-technique gate](../.github/workflows/phase5-techniques.yml), [frozen 1,200-match baseline](graph-lab.md), [five-meeting rivalry variety](repeated-rivalry-automation.md), [five-week persistent-career continuity](career-continuity-audit.md), and desktop/mobile browser journeys continue running on relevant changes.

The baseline report includes Phase 5b **actual consecutive action pairs** and existing aerial-counter-node counts as separate sections. These are measures of observed use, not unearned claims of realism or guarantees that each link caused the matched sequence. We keep the frozen baseline reference unchanged.

## Next sensible tranche

246 remaining moves can be handled in modest, vetted groups: ground and rope escapes, strike blocks and responses, outside-ring opportunities, corner sequences and actual attempted aerial action state. New mechanics should be promoted to live only when existing states admit them and fixed-seed use is observable, not simply to raise a coverage percentage.
