# The Office — v0.4 audited 24-technique follow-up

**Date:** 20 November 2026  
**Status:** proposed follow-up PR, not deployed to `main`.  
**Baseline:** v0.4 physical-continuity and organic-superplex merge (PR #121).  
**Source:** [revised 24-move audit priority list](v04-technique-position-500.md#revised-24-move-metadata-review--evidence-led).

## What was changed

The existing 24 **playable** wrestling move identities from the evidence-led audit now have individually authored, provisional editorial mechanics records in `assets/js/technique-registry.js`. Their class, target, entry and exit positions, intended setup IDs and **actual generated move-specific reversal IDs** are verified against the **live OfficeMatch graph** by the existing registry validator. No new move names, result contracts, wrestler biographies, wrestler training schools or moveset definitions were imported. This is a review of existing wrestling, not a conversion of automatically inferred technique metadata into physical fact.

The seven specifically chosen setups or follow-throughs (six new edges; the snap DDT's existing edge receives a stronger authored weight):

| Real transition | Grounded interpretation |
| --- | --- |
| `front_facelock → nk_snap_ddt` | A secured head tie can lead into a quick snap DDT |
| `front_facelock → nk_swinging_neckbreaker` | Release and rotate a head tie into a neckbreaker |
| `pw_bearhug → pw_backbreaker` | A close body clasp sets up a weight-limited knee drop |
| `leg_wrench → rs_leg_lace` | An actually acquired, owner-specific grounded leg hold leads to a leg lace |
| `nk_ddt → rs_front_chancery` | A landed DDT is followed by a separately completed grounded head-control hold |
| `gd_senton → gd_ground_pound` | A grounded senton can be followed by mounted punches |
| `st_double_chop → st_chop` | Shoulder chops transition into a standing chest chop |

These are weighted, competing choices, **not guaranteed scripts**. The original `isValid` gates still decide whether the next action is physically possible. Existing grip state is kept as-is; the action catalogue's authored risks, strength limits and clocks are unchanged. A counter is not added as a normal post-impact action. The existing head-control setup and ground-leg grip implementation stay separate from the metadata layer.

## Exact resulting inventory

| Measurement | Previous `main` | Candidate |
| --- | ---: | ---: |
| Action nodes | 980 | **980** |
| Directed graph links | 6,407 | **6,413** |
| Authored moves / families | 340 / 20 | **340 / 20** |
| Move-specific reversals / blocks | 328 / 210 | **328 / 210** |
| Curated metadata records | 90 | **114** |
| Curated catalogue coverage | 26.5% | **33.5%** |
| Graph validation errors | 0 | **0** |

### Production-engine A/B: unchanged main versus candidate

A paired replay of two distinct seeded cohorts (500 matches each) loads **both their own match engines and their own registry files**, unlike an engine-only test that shares a modified registry. Each cohort rotates the real roster, match plans, slot and finish contracts while keeping each pair's seed and settings constant.

| Measure | Result across 1,000 paired bouts |
| --- | ---: |
| Completed | **1,000/1,000 for each engine** |
| Result identity changes | **0** |
| Baseline DQs → proposed DQs | **3 → 3** |
| Named grapple commitments | **98 → 98** |
| Mean star-rating change | **−0.0008** |
| Mean absolute change in rating | **0.0293** |
| Matching same-controller occurrences of the seven handoffs | **13** |

Separately, a fixed-registry gameplay-only comparison observed **15** matching handoffs and **zero mismatches across 48,763 actual physical-state checks** on the same two sets of 500 real bouts. The two comparisons ask slightly different questions; the **own-registry** paired sample above is the valid full-change comparison. Note that an authored edge seen between adjacent match events is a conservative proxy for the internal edge picker; count it as an observed plausible sequence, **not proof that the picker traversed that edge on every occurrence**.

## Safety and next review

- `tests/audit24-technique-tranche.test.cjs` guards the exact 24 IDs, targets, position semantics, reversals, seven verified edges, real retained leg access, 80 completed matches and same-seed replay.
- Historical Phase 9 / Phase 10 inventories stay immutable. The six newly accepted edges are recorded separately in `AUDIT24_ADDED` so old reference numbers do not change silently.
- The 24 rows remain explicitly marked **`reviewStatus: proposed`**. Their names and ring mechanics are independently authored for The Office, not copied from the proprietary Fight Encyclopedia library.
- Do **not** call this a finished physical-state simulator or 340 fully reviewed move definitions. More grounded arm-control, neck-control, lock releases, move-specific counter parenthood and school impacts require separate tape audits.
- Merge only after complete GitHub CI, including simulation and browser journeys, validates this branch. No gameplay code was pushed directly to `main`.
