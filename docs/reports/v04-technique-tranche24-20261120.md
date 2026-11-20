# The Office — audited 24-technique match-graph tranche

**Date:** 20 November 2026  
**Branch:** `feature/v04-reviewed-technique-tranche-20261120`  
**Baseline:** merged v0.4 physical-continuity and superplex PR #121, on `main` (`51fb2a65`).  
**Status:** proposed follow-up; no changes to `main` until CI and review.

## Purpose

Improve match-to-match physical continuity and credible wrestling sequences *without growing the move catalogue*. This tranche implements the **revised evidence-led 24-move shortlist** in [the frozen 500-bout audit](v04-technique-position-500.md), not the superseded family-balanced proposal.

The technique registry remains **original editorial interpretation** of the game's existing action text and mechanics, with explicit proposal status. It is **not** an imported third-party technique database, a claim of third-party expert sign-off, or a guarantee of complete biomechanics.

## Authored data changes

Exactly **24 new curated records** are added to `OfficeTechniqueRegistry`, raising audited coverage **90/340 (26.5%) → 114/340 (33.5%)**, with **226 playable moves still awaiting review**. No move was renamed or added.

| Family / group | IDs reviewed |
| --- | --- |
| Ground (5) | `gd_elbow_drop`, `gd_stomp`, `gd_senton`, `gd_arm_elbows`, `gd_ground_pound` |
| Ringside (4) | `os_ramp_suplex`, `os_apron_ddt`, `os_barricade_spear`, `os_floor_piledriver` |
| Lifting (4) | `pw_bearhug`, `sx_deadlift_bridge`, `pw_backbreaker`, `pw_powerbomb` |
| Neck / DDT (3) | `nk_snap_ddt`, `nk_swinging_neckbreaker`, `nk_ddt` |
| Strikes (4) | `st_headbutt`, `st_double_chop`, `st_backhand`, `st_chop` |
| Holds (2) | `rs_leg_lace`, `rs_front_chancery` |
| Risk / high spots (2) | `dv_tope_con_hilo`, `sp_superplex` |

For each record, the actual action ID, `requires` and `zone` positions, body-part target, authored counter-parent, existing setup IDs and independent original narration were inspected. The registry validator confirms the data agrees with the executable graph; speculative reversal IDs and invented nodes are not introduced.

### Seven narrowly selected handoffs

| From | To | Why the sequence is credible |
| --- | --- | --- |
| `front_facelock` | `nk_snap_ddt` | Front-head control to quick snap, **existing link reweighted** |
| `front_facelock` | `nk_swinging_neckbreaker` | Standing head tie into a rotating neckbreaker |
| `pw_bearhug` | `pw_backbreaker` | Close body clinch into a weight-limited knee-drop lift |
| `leg_wrench` | `rs_leg_lace` | Explicit owner-specific grounded leg grip into leg lace |
| `nk_ddt` | `rs_front_chancery` | Opponent already down, transition to grounded head hold |
| `gd_senton` | `gd_ground_pound` | Ground senton into mounted punches |
| `st_double_chop` | `st_chop` | Shoulder-chop follow-through into chest-target chop |

These seven selections create **six newly directed action edges**, with one pre-existing link receiving a reviewed weight. No authored Phase 9 chain is deleted. Link addition uses the established curated path and obeys the graph's global limit on non-original edge weights. Every new source action finishes in exactly the target's required positional state. The pre-existing timing, weight/lift, stamina, style, stipulation and genuine grip gates remain active.

This is deliberately not a wholesale automation of all possible combinations. The full registry remains mostly a proposal layer; just seven validated follow-ups enter the executable graph.

## Reproducible simulation comparison

Two deterministic *paired* cohorts compared `main` and the proposed branch, each using rotating real roster identities, five plans (Story, Technical, Brawl, Spot-fest, Safe), alternating slots, fixed script decisions and the same seeds: **`90021 + 41*i` (i=0..499)** and **`220021 + 41*i` (i=0..499)**. The second cohort is an independent holdout, not a replay of the first 500.

| Measure | 500 audit seeds | 500 independent holdout |
| --- | ---: | ---: |
| Completed matches | 500/500 | 500/500 |
| Changed match outcome IDs | **0** | **0** |
| Previous/new DQ counts | 1 / 1 | 2 / 2 |
| Absolute mean change in star rating | **0.0125** | **0.0075** |
| Mean star-rating change | **+0.0045** | **−0.0025** |
| Actual same-controller reviewed handoffs | **11** | **4** |

Observed reviewed pair frequencies: first cohort `st_double_chop → st_chop` 4, `front_facelock → nk_swinging_neckbreaker` 1, `gd_senton → gd_ground_pound` 2, `front_facelock → nk_snap_ddt` 2, `leg_wrench → rs_leg_lace` 1 and `pw_bearhug → pw_backbreaker` 1; holdout `gd_senton → gd_ground_pound` 1, `leg_wrench → rs_leg_lace` 2 and `front_facelock → nk_snap_ddt` 1.

**48,763 physical-state checks**, performed before the real graph decisions, found **zero mismatches** for ring/floor location, top-rope ownership and narrated positional state. Both samples completed without a new graph-validation error. These checks demonstrate a small number of real, reachable sequences—not yet comprehensive coverage of every reviewed move.

A separate 60-bout real-engine smoke run finished **60/60**, with **zero booked-result changes** and identical same-seed move tapes on the first five replayed matches. Directed tests confirm that `rs_leg_lace` cannot be reached without a grounded leg grip, but can after `leg_wrench`; that the grip survives save/restore and is released by `mat_scramble`; that `nk_ddt` requires a real front facelock; and that a suitable wrestler can turn `pw_bearhug` into `pw_backbreaker`.

## Release conditions and next work

- Green CI, including full Node simulation and Chromium desktop/mobile journeys, is **required** before merge.
- Inspect representative actual action narration from the changed sequences. Automated stars are not a proxy for match dramaturgy.
- The unchanged original 500-bout evidence and graph v1 baseline must remain immutable.
- After this tranche, focus on **226 unreviewed moves**, prioritised by actual visibility and significance, not automatically expanding links. Additional physical rules should be supported by new focused tests and mixed-fatigue match samples.

**Stable v0.4 counts following this change:** 340 moves in 20 families, 980 graph action nodes, **6,413 edges**, 114 reviewed mechanics metadata records. Existing training backgrounds, promo contracts and booking outcomes remain separate systems.
