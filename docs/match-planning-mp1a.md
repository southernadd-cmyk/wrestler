# MP1A — shared planning membership foundation

## MP0B measured baseline

Successful PR #427 run 45804601699, job 139856397706, head
461c601d16b3339616113dc6b239fdb3e0fdfa91.

| Metric | All | Established | Academy |
| --- | ---: | ---: | ---: |
| Focus meetings | 800 | 320 | 480 |
| Focus dialogue lines | 2738 | 1045 | 1693 |
| Cross-meeting repeated lines | 900 | 342 | 558 |
| Within-meeting repeated lines | 4 | 0 | 4 |
| Distinct normalized text | 536 | 338 | 310 |
| Mean consent | 76.30 | 79.49 | 74.17 |
| Logged focus objections | 748 | 267 | 481 |

All 200 focus identities spoke; all 200 JSON resumes passed. Across 3200
objectives, 2930 were named and 270 open. One review repair was necessary.
There were 6175 selected decisions. The fixed choice schedule gave 267
keep, 267 revise and 266 open huddles; these are player-policy counts,
not emergent wrestler preferences. Repetition is against earlier sampled
meetings for the same focus identity; the fixed structure order confounds
structure-specific repetition. Group distinct counts overlap. No claim of
semantic or writing quality follows from line counts.

## Canonical foundation

`OfficePlanningFuzzy` delegates to `OfficePsychology.createModel`.
The canonical worker curves are held by reference to the same frozen
object used by the promo domain, not independently tuned.

| Axis | Low plateau end | Medium peak | High plateau start |
| --- | ---: | ---: | ---: |
| Ego | 25 | 50 | 80 |
| Professionalism | 30 | 60 | 85 |
| Ring psychology | 25 | 50 | 80 |
| Microphone | 25 | 50 | 80 |

For knots a,b,c, on the 0–100 domain the shoulder trapeziums are
(0,0,a,b) and (b,c,100,100), and the middle triangle is (a,b,b,c).
Microphone ability is available but does not imply a planning effect.
Domain-specific extra curves are allowed, but shared worker names cannot
be overridden. Missing facts stay unknown; explicit zero stays zero.
The existing Sugeno rule model and its validation are reused.

The module is deliberately dormant: test code loads it after the
production script bundle. It is not yet wired into the browser script
list, room state, dialogue or career decisions. MP1B will add planning
curves; MP1C will supply versioned evidence from the actual participants,
not from default-filled legacy snapshots. No promo changes, no duplicate
kernel, no additional workflow. The existing test selector runs the
new membership parity suite. Its numerical comparisons cover 964
observations (four axes, -10 through 110 at half-point increments),
including clamping; separate assertions cover unknowns, knots, overlaps,
immutability, canonical overrides and no mutation of promo or room APIs.
