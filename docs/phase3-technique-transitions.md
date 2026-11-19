# The Office — Phase 3: small live technique-transition pilot

**Status:** eleven hand-picked transitions integrated with the real match graph, against the [Phase 2 curated proposals](phase2-technique-registry.md). This is not a full rework of the wrestling mechanics engine. The [frozen 1,200-match reference](../tools/graph-lab/baselines/reference-v1.json) remains unchanged.

## Engineering rule

Keep the existing **969 nodes and 336 authored catalogue moves**. Add explicit weighted links, never new executable IDs. A link is only admitted when the **current move's actual exit position** matches the **next move's existing required position**; after that, the current `Graph.isValid` enforces stamina, size/lift, agility, match timing, stipulations and in-ring state. No grip state or wrestler training background is invented by this change.

The 39 metadata proposals in `assets/js/technique-registry.js` remain editorial information; they are **not imported wholesale**. The 11 applied relationships live in `Graph.TECHNIQUE_PILOT` with explicit reason strings, so they can be reviewed and separately reverted. Most entries are *possible* transitions rather than guaranteed sequences; the existing dramaturgy and weights still decide what occurs.

## The eleven links

| From | To | Intended sequence |
| --- | --- | --- |
| `wristlock` | `ch_top_wristlock` | Keep wrist control |
| `ch_top_wristlock` | `ch_rolling_wristlock` | Roll through while retaining grip |
| `ch_rolling_wristlock` | `ch_deep_arm_drag` | Turn wrist manipulation into a throw |
| `ch_cravate` | `ch_headlock_takedown` | Move from head control into a grounded takeover |
| `front_facelock` | `ch_snapmare` | Snapmare out of a front head grip |
| `ch_snapmare` | `sm_sleeper` | Follow the landing into a head submission |
| `ch_single_leg` | `sm_ankle_lock` | Catch the retained leg after a takedown |
| `ch_dragon_screw` | `sm_figure_four` | Continue leg work with a leglock; the normal late-match timing guard still applies |
| `rope_run` | `lc_hurricanrana` | Rana against the returning opponent |
| `lc_hurricanrana` | `early_cover` | Immediate short-count nearfall |
| `lockup` | `ch_single_leg_rev` | The defender sprawls against a single-leg shot (an *alternative attempt*, never after a successful single-leg takedown) |

**Rejected placement:** `ankle_pick → ch_single_leg_rev` was rejected during implementation: the existing `ankle_pick` leaves the players *on the mat*, while that reversal requires *standing*. The playable link uses the standing `lockup` instead. This illustrates why a simple metadata `setupIds` list is not sufficient to create live edges.

## Safeguards

- `tests/phase3-technique-sequences.test.cjs` checks link position compatibility, real graph inclusion, setup consistency with Phase 2 editorial data, authored counters, and physical eligibility on a suitably small, rested wrestler.
- The test rehearses `wristlock → top wristlock → rolling wristlock → deep arm drag` at the level of *legal move-by-move execution*, finishing with the defender down. **This is not a promise the ordinary RNG will pick all four in any given match.**
- Seeded play checks existing booked outcomes and deterministic match replays.
- The regular catalogue and full simulation suites still check broad performance, reachability, match psychology, timing, save/resume, and other game systems.
- GitHub's automated graph-baseline workflow executes **the same 1,200 scenarios and seeds** against the frozen pre-expansion reference. A change in node/edge use or ratings is reported as a measured delta, **not a failure on its own**; malformed graph events and timing violations remain failures.

## Acceptance / manual critique

Before extending this pilot, review actual first-bout tapes from the Graph Lab for credible actor/control continuity. Particularly scrutinise the **lucha nearfall** and the **single-leg sprawl** for good narration around the attempt, and sample repeated opponents for duplicate sequences. A physically valid position transition is necessary but not enough to guarantee believable match calling.

If the pilot is accepted, Phase 4 can introduce *wrestler training backgrounds and aptitude* independently of the four existing performance styles. The match engine still does not know transient per-limb grips (e.g. a specifically secured wrist beyond the current action). Do not claim it does.

## Source boundary

All links are independently authored from existing The Office moves and general wrestling knowledge. No proprietary Fight Encyclopedia technique records or descriptions have been imported. [Phase 1 licensing review](phase1-graph-technique-audit.md).
