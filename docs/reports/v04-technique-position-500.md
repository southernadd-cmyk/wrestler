# The Office v0.4.0 — 500-bout technique and position audit

**Audit performed:** 19 November 2026  
**Code pinned:** `015af53aed9244aeb091d0dcbcddc7c207aca1e0` (v0.4.0 release after PR #117)  
**Status:** Completed read-only engine audit; no gameplay rules or catalogue weights changed.  
**Reproducible runner:** [`tools/graph-lab/technique-position-audit.cjs`](../../tools/graph-lab/technique-position-audit.cjs)  
**Machine-readable evidence:** [`v04-technique-position-500.json`](v04-technique-position-500.json)  
**Reproduction:** `node tools/graph-lab/technique-position-audit.cjs --count 500 > v04-technique-position-500.json`

## Executive findings

**The principal gap is physical *specificity*, not failure of existing coarse legality checks.** All 500 matches finished; timed actions respected their configured windows, and no ordinary action violated its existing position/weight/stamina eligibility at the recorded application point. But the game has no persistent *front facelock*, *rear-waist control*, *gripped ankle*, *opponent-versus-attacker ringside positions*, or *ramp-versus-apron location* state. Legal, narrated moves can therefore lack a demonstrated prerequisite beyond “standing”, “mat”, “top” or “outside”.

| Observed measure | Result |
| --- | ---: |
| Bouts finished | **500 / 500** |
| Wrestlers represented in deterministic rotation | **80** |
| Match styles | **5** (100 each) |
| Booked lengths | **8 / 12 / 20 min** (170 / 165 / 165) |
| Total logged match events | **26,871** |
| Named graph action events | **25,458** |
| Authored catalogue move events | **6,426** |
| Events involving a curated technique | **1,694 (26.4%)** |
| Events involving a non-curated catalogue move | **4,732 (73.6%)** |
| Distinct authored moves seen | **324 / 340** |
| Distinct authored moves not seen | **16** |
| Existing `after` timing-gate violations | **0** |
| Existing ordinary action precondition violations | **0** |
| Scripted high-spot attempts: landed / botched | **588: 529 / 59** |
| Named aerial / named grapple attempts | **148 / 89** |
| Largest single-bout retained event tape | **93** (below engine's 220 cap) |
| Instrumentation versus untouched engine | **25 / 25 identical**: moves, commentary, outcomes, stars |

**Important precondition nuance:** The raw instrumentation noted **73** negative `isValid` rechecks on counters/blocks *after* their previously verified aerial/grapple commitment state had been cleared. These are **not** 73 unsafe moves: the actual attempt record preserves the parent manoeuvre and resolution. The audit separates them from the **zero** ordinary invalid move applications. The separate proof of unchanged simulation uses the same seeds, in-memory instrumentation only, and verifies the actual emitted transcript.

### Scope and limitations

The roster rotates deterministically, the promoter is `OfficeData.PROMOS[0]`, and wrestler fatigue starts at zero. The manager consistently chooses the available scripted resolution (`job`, `home`, `cut`, `protect` priority). This is not a real career-season distribution of injuries, managers, stipulations or psychological feuds. A move not selected in 500 matches is **not** necessarily unreachable. Likewise, a correct `requires:'standing'` check cannot establish a believable *grip*, and a pair absent from `A.next` is not automatically illegal: arc-based pools deliberately select independent legal actions.

## Actual curated coverage by family

The counts below are *observed use*, not just how many catalogue records exist. Events include catalogue-labelled narrative actions such as the referee's double-down count.

| Family | Authored catalogue entries | Reviewed | Observed move events | Unreviewed move events |
| --- | ---: | ---: | ---: | ---: |
| Strike | 32 | 10 | 877 | 556 |
| Ground | 20 | 0 | 803 | **803** |
| Submission | 35 | 27 | 781 | 139 |
| Comeback / fire | 15 | 0 | 709 | 709 |
| Heel tactics | 14 | 0 | 670 | 670 |
| Chain | 24 | 19 | 517 | 87 |
| Power | 27 | 7 | 389 | 312 |
| Outside | 17 | 0 | 292 | 292 |
| Rest holds | 12 | 0 | 262 | 262 |
| Neck / DDT | 18 | 0 | 212 | 212 |
| Suplex | 25 | 5 | 176 | 135 |
| Pin | 11 | 5 | 148 | 79 |
| Aerial | 18 | 8 | 146 | 112 |
| Superplex | 7 | 0 | 88 | 88 |
| Dive | 9 | 0 | 78 | 78 |
| Running | 12 | 0 | 67 | 67 |
| Lucha | 10 | 5 | 64 | 15 |
| Corner | 18 | 0 | 60 | 60 |
| Springboard | 6 | 4 | 57 | 26 |
| Rope | 10 | 0 | 30 | 30 |
| **Total** | **340** | **90** | **6,426** | **4,732** |

**Taxonomy caution:** `double_down_count` alone appears **407 times**, and is part of the catalogue's `fire` family. It is an important *narrative/referee count*, not a technique a wrestler is schooled in. Removing it from a future prioritisation calculation changes the non-curated share from 73.6% to **71.9%** (4,325 / 6,019). Do **not** silently delete or rename the existing ID: first distinguish action semantics from true teachable moves in the reporting layer, without breaking saves.

The largest high-frequency *wrestling-action* metadata deficits are **groundwork, strikes, power, ringside actions and rest holds**. The original 24-candidate design shortlist over-weighted rare corner and technical lifting moves; it should be rebalanced using observed use **and** physical risk.

## Verified physical-continuity examples

These are actual seeded tapes from the audit. An **unlinked** pair means the immediately preceding event is not an explicit `A.next` handoff, *not* that the move was illegal.

| Tape and action | What happened | Interpretation |
| --- | --- | --- |
| Seed **90021**, 06:30, `dv_tope_con_hilo` | `outside_toss` puts the shared scene `outside`; commentary immediately describes the attacker flipping over the **top rope** onto the opponent on the floor | **Real representational weakness:** the single `outside` state cannot distinguish an attacker in the ring from a defender on the floor |
| Seed **90349**, 07:30, `os_ramp_suplex` | `outside_toss` → ramp suplex; **57 of 65** observed ramp suplexes came straight after `outside_toss` | Outside does not encode *floor versus entrance ramp* or a transition between them; the move is legal but its geography is not evidenced |
| Seed **90513**, 13:40, `os_apron_ddt` | `outside_toss` → DDT **on the apron**; **47 of 52** such DDTs followed `outside_toss` | “Outside” cannot separately establish the apron location needed by the narration |
| Seed **90923**, 08:20, `sx_deadlift_bridge` | `corner_charge` → bridging deadlift suplex, with state `standing` before execution | **39 of 39** occurrences lacked an immediately authored predecessor link. That is legal under the current arc system but does not independently establish the lifting grip |
| Seed **93055**, 14:40, `sx_german` | `springboard_rise` → German suplex; the narration supplies the waist grip at the instant of execution | **11 of 13 landed** German suplex actions lacked an immediately linked setup. The existing named attempt system does not represent a retained rear-waist grip between actions |
| Seed **90185**, 05:10, `sm_sleeper` | A sleeper follows a sharpshooter on the mat | Not ruled impossible; a review should require a defensible hold release and head/neck capture to make the transition causally legible |
| Seed **90308**, 10:50, `sp_superplex` | `corner_whip` → `top_follow` → superplex | **Positive control:** all **68 / 68** observed superplexes followed the authored `top_follow` setup, with correct `top` state |

For comparison, **98 / 98** `gd_elbow_drop` actions started on the mat, and **83 / 83** `ar_elbow_point` actions started from `top` after `top_climb`. The existing positional guards are doing important work; don't discard them when introducing detail.

### Attempt-state detail

There were **148** committed aerial/springboard attempts and **89** committed grapples in these bouts. The four grapple pilots were: sleeper **32**, ankle lock **33**, vertical suplex **8**, and German suplex **16**. Not every spectacular graph action runs through a separate two-tick attempt: `ar_elbow_point` appeared **83 times** but had only **one** recorded dedicated aerial commitment; the mapped scripted-spot route can perform the legal graph action directly. This separation should be reviewed deliberately, rather than falsely described as complete attempt coverage.

## Sixteen moves not observed

```text
nk_tornado_ddt      cn_backflip
ar_headbutt         ar_corkscrew       ar_stomp
sp_hurricanrana     sp_powerbomb       sp_spider
sp_super_ddt        sp_super_arm_drag
dv_suicide          dv_moonsault       dv_apron_senton
lc_tornillo         lc_rope_walk       rp_tiger_feint
```

Notably **five of seven** catalogue superplex variants were not selected, even though the basic `sp_superplex` occurred 68 times. This warrants **targeted forced-legality and seeded reachability tests**, not deletion or blind weighting. Without those tests, we cannot know if they're simply rare or effectively inaccessible.

## Revised 24-move metadata review — evidence-led

This **supersedes the original family-balanced proposal** in [the design review](../technique-and-realism-review.md). All of the IDs below already exist in the catalogue and lack curated mechanic records; frequency is from these 500 bouts. Low-frequency exceptions are retained where a setup is especially consequential.

| Group | Four to five priority IDs | Why |
| --- | --- | --- |
| Ground (5) | `gd_elbow_drop` (98), `gd_stomp` (66), `gd_senton` (60), `gd_arm_elbows` (59), `gd_ground_pound` (55) | High repeated exposure; who is down and who has limb control |
| Ringside (4) | `os_ramp_suplex` (65), `os_apron_ddt` (52), `os_barricade_spear` (37), `os_floor_piledriver` (25) | Geography and risky landing context |
| Lifting / holds (4) | `pw_bearhug` (63), `sx_deadlift_bridge` (39), `pw_backbreaker` (17), `pw_powerbomb` (3) | Grip and load-bearing checks; powerbomb is a safety-critical sparse case |
| Neck / DDT (3) | `nk_snap_ddt` (18), `nk_swinging_neckbreaker` (18), `nk_ddt` (10) | Front/rear head control and supported fall direction |
| Strikes (4) | `st_headbutt` (52), `st_double_chop` (49), `st_backhand` (39), `st_chop` (37) | Range, preceding control and oversold damage |
| Holds (2) | `rs_leg_lace` (43), `rs_front_chancery` (observed, see JSON for count) | Required mat position and secure grip |
| High spots (2) | `dv_tope_con_hilo` (70), `sp_superplex` (68) | Interior/exterior separation; preserve already-good top-rope chain |

**Total = 24 existing moves.** Adding reviewed metadata for these would raise curated coverage to **114/340** if each one passed manual technical verification. Do not infer counter moves or body mechanics from the label alone; physical correctness requires reviewing the action record and predecessor.

## Next controlled physical-state pilot — six cases

**Proposal only; not included in this audit PR:**

1. **Ring/floor split:** `outside_toss` → `dv_tope_con_hilo` should carry an attacker-in-ring / defender-outside predicate; do not create a false outside-to-outside airborne dive.
2. **Ringside geography:** `outside_toss` → `os_ramp_suplex` / `os_apron_ddt` should require a specific apron/ramp transition or clearly narrated relocation.
3. **Front facelock:** `front_facelock` → `sx_vertical` / `nk_ddt` can be a concrete, serialisable temporary grip, with real releases and counters.
4. **Rear waist grip:** `waistlock` / `go_behind` → `sx_german`, retaining ownership and expiration after a scramble or reversal.
5. **Ground control:** `mat_hold` → `sm_ankle_lock` / `rs_leg_lace` with defender leg access and meaningful disengagement.
6. **Positive-control superplex:** `corner_whip` → `top_follow` → `sp_superplex` must remain reachable, timed and properly counterable.

A minimal **optional** per-attempt setup descriptor in existing serialised graph state is preferable to a wholesale new physics engine. All affected interactions must preserve current move eligibility, fatigue, strength, booked outcomes, counter truthfulness, old saves and seed determinism. The final requirement is a **paired 500-bout comparison on exactly these seeds** plus human review of real tape excerpts, not just aggregate star averages.

## What to do first

1. Run targeted legality/reachability tests for the 16 unseen moves; determine whether scarcity is an eligibility bug or just sampling.
2. Review the revised 24 techniques with real event counts. Do not dilute the catalogue with 250 unverified auto-generated records.
3. Prototype *one* separation of attacker/defender ring location and *one* retained grapple setup; re-run these 500 exact seeds. Preserve the superplex sequence as a regression positive control.
4. Compare turn-by-turn action continuity, physical setup, actual counter attempts, phase timing and ratings against this frozen JSON snapshot.
5. Only merge if both automated tests and representative tapes show credible improvements. No gameplay source changed during this audit.

### Evidence and reproducibility

The committed [JSON snapshot](v04-technique-position-500.json) contains the seeded sample configuration, per-family observations, top unreviewed move counts, the original 24-candidate frequencies, state observations, attempt outcomes and selected real tape excerpts. The [read-only audit command](../../tools/graph-lab/technique-position-audit.cjs) captures **pre-action** position without writing to the engine or consuming random numbers. Its 25-bout untouched-engine parity guard fails fast if instrumentation changes outcomes or commentary. `main` from v0.4.0 and this report are the reference points; rerun against new code only as a labelled new experiment.

**Bottom line:** The wrestling is already coherent at its current coarse legality level. The most valuable next work is precise **who is where** and **how the grip was obtained**, plus metadata for moves that actually occur. It is *not* another large, unreviewed graph expansion.
