# Phase 2 — deeper grappling and counter sequences (controlled pilot)

**Date:** 20 November 2026  
**Status:** proposed branch; not live pending CI, Graph Lab transcript audit and review.

## Pilot implementation

Expand the existing persistent two-tick grappling engine from four to seven named move commitments:

| Move | Entry | Resolution |
| --- | --- | --- |
| `sx_deadlift_bridge` | Fresh, controller-owned front facelock | Existing deadlift bridging suplex or its exact generated counter/block |
| `nk_snap_ddt` | Fresh, controller-owned front facelock | Existing snap DDT or exact counter/block |
| `pw_powerbomb` | Fresh, controller-owned front facelock | Existing weight/stamina/clock-legal powerbomb or exact counter/block |

All three moves already exist in the authored match graph. The original four grapple pilots remain untouched. The attempt state is serialized through `graph.pendingGrapple`, outcomes and attempts remain attributed to the existing exact graph move IDs, and stale or wrong-side grips are rejected. No additional RNG draws are made outside the existing grappling resolution pathway.

## Boundaries

- No extra move nodes, fabricated counters, third-party technique imports or mass reclassification.
- Keep the separate physical descriptor optional on older/injected saved matches; once an actual descriptor exists, these three moves require the reviewed grip setup.
- Preserve booking outcomes, old saves, the narrative clock, fatigue/weight/stipulation gates and the v1 reference baseline.
- Do **not** merge based only on matching labels or passing syntactic tests. Real match tapes need to demonstrate credible entry, commit, defend, land and reset sequences.

## Release gates

1. `npm test`, including seven-pilot exact path and legacy-save tests.
2. Graph Lab 500+500 paired-seed quality and position checks, including evidence of actual new pilot attempts rather than only static reachability.
3. Review technical, story, brawl, spectacle and safe match transcripts, checking commentary and phase timing.
4. Desktop/mobile Chromium journeys, then guarded PR merge only if CI is green.

## Follow-up Phase 2 work

After this pilot is verified, evaluate wrist-control chains, defensive re-grips and grounded hold-to-hold transitions using real match events. Each additional sequence needs an owner-correct precondition, a specific legal escape/counter and an explanation of why it improves believable wrestling rather than just increasing edge counts.
