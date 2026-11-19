# The Office — v0.4 technique coverage and physical realism review

**Status:** Next-phase design review, not an implemented v0.4 feature.  
**Baseline:** Verified shipped `main` after Phase 10; 19 November 2026.  
**Goal:** Make technique identities and match sequences more mechanically convincing **before** growing the move catalogue.

## 1. What already works

The game has **340 authored playable techniques** in 20 families. Of these, **90** have reviewed `OfficeTechniqueRegistry` records (26.5%). The other **250** are *not* missing from the action graph; they already have usable `OfficeMatch.GRAPH.A` definitions. The registry is a curated second layer for explicit grip / entry / exit / counter / tradition relationships, not the source of all executable actions.

The graph validates at **979 nodes**, **6,401 directed links**, 328 reversals and 210 blocks, with no validation errors. It contains 25 match arcs, twelve mapped scripted spots, and 80/80 technical-school assignments (40 provisional). There are many existing logical guards: ring position, controlling wrestler, legal stipulations, weight/lift limits, fatigue, wrestler style, risk and earliest credible time.

## 2. Technique coverage: where 250 records remain

This is computed by comparing `OfficeMatch.GRAPH.CATALOG.F[*].moves` with `OfficeTechniqueRegistry.get(id)`, not guessed from old Phase 1 spreadsheets.

| Family | In game | Reviewed | Unreviewed |
| --- | ---: | ---: | ---: |
| Strike | 32 | 10 | **22** |
| Suplex | 25 | 5 | **20** |
| Power | 27 | 7 | **20** |
| Ground | 20 | 0 | **20** |
| Neck / DDT | 18 | 0 | **18** |
| Corner | 18 | 0 | **18** |
| Ringside / outside | 17 | 0 | **17** |
| Comeback / fire | 15 | 0 | 15 |
| Heel tactics | 14 | 0 | 14 |
| Rest holds | 12 | 0 | 12 |
| Running | 12 | 0 | 12 |
| Aerial | 18 | 8 | 10 |
| Rope-assisted | 10 | 0 | 10 |
| Dives | 9 | 0 | 9 |
| Submission | 35 | 27 | 8 |
| Superplex | 7 | 0 | 7 |
| Pins | 11 | 5 | 6 |
| Chain wrestling | 24 | 19 | 5 |
| Lucha | 10 | 5 | 5 |
| Springboard | 6 | 4 | 2 |
| **Total** | **340** | **90** | **250** |

**Interpretation:** The gap is heavily concentrated in ordinary grounded, neck, corner and ringside wrestling as well as strikes and lifting techniques. By contrast, submissions and chain wrestling already have comparatively good metadata coverage. Coverage percentages do not tell us which moves players actually see; the next selection should use **observed event frequency** from Graph Lab as well as physical risk and narrative importance.

### Recommended first curated tranche — 24 existing moves

This is a **review shortlist**, not authority to change any graph edge or technique definition. The IDs were verified as *currently present and unreviewed*. Check every proposed entry/exit and counter against real action state before adding metadata:

| Family | Four candidates |
| --- | --- |
| Ground | `gd_elbow_drop`, `gd_knee_drop`, `gd_stomp`, `gd_arm_elbows` |
| Neck | `nk_ddt`, `nk_snap_ddt`, `nk_inverted_ddt`, `nk_swinging_neckbreaker` |
| Corner | `cn_splash`, `cn_dropkick`, `cn_forearm`, `cn_tree_of_woe` |
| Ringside | `os_barricade`, `os_post`, `os_floor_piledriver`, `os_ramp_suplex` |
| Suplex | `sx_vertical`, `sx_deadlift_bridge`, `sx_rolling_german`, `sx_tiger` |
| Power | `pw_chokeslam`, `pw_powerbomb`, `pw_backbreaker`, `pw_running_powerbomb` |

**Sequence:** review exact action and narration → record metadata and provenance → check position/role/weight semantics → propose only physically defensible links → run same-seed graph comparisons and transcript spot-checks. Start with **24 → 114 reviewed**, and expand in separately reviewed tranches only after convincing evidence. Do not pretend the 24 would close the 250-move gap.

### Prioritisation method

Rank candidates by: (a) seen often in actual match tapes; (b) currently misleading or missing physical setup; (c) carries unusual safety, weight or ring-location consequences; (d) adds a useful distinct wrestling identity; and (e) has a legal counterpart/reversal that the game can genuinely represent. Avoid auto-generating relationships solely because two moves share a family tag.

## 3. Physical realism: what's missing

The engine has a **coarse, shared position** (`standing`, `mat`, `corner`, `top`, `outside`) and wrestler control, and remembers target-body-part work. It does **not** track every specific wrist grip, front facelock, rear waist grip, rope orientation, or whether both wrestlers are in different simultaneous positions. Those cannot be inferred reliably from a human-readable name or from `requires: 'standing'`.

The code already demonstrates a safer direction than a wholesale simulator rewrite:

- `graph.pendingAerial` and `aerialAttempts`: named aerial/springboard attempt followed by its real landing, counter, block or interruption.
- `graph.pendingGrapple` and `grappleAttempts`: the **four** approved grapple pilots `sx_vertical`, `sx_german`, `sm_sleeper` and `sm_ankle_lock`, with throw and hold treated differently.
- `Psy` and graph action histories: chronological control, target and position plus saved outcomes; old saves migrate to the absence of new attempt state.
- Phase 10's scripted high spots: named graph landings and separate botched attempt records; their setup must obey its own timing requirement.

This is **selected causal realism**, not a complete grip-state or joint-angle simulator.

### A controlled next physical-state pilot

1. **Observe failures first.** Export 200–500 seeded tapes across Story, Technical, Brawl, Spot-fest and Safe plans; flag moves that are physically questionable despite passing current `isValid`. Record the predecessor, controller, starting/ending position and narration verbatim.
2. **Choose four to six recurring problems.** Prefer a wrist-control-to-arm sequence, a front-facelock-to-suplex sequence, a rear-waist-to-German-suplex sequence and one grounded submission. Every candidate must have an explicit, reviewer-verified counter or plausible abort.
3. **Add only the state needed.** Trial an *optional* serialised `grip`/setup descriptor (owner, grip type, source node, valid position, creation tick) within the existing graph, not a new persistent wrestler biography or a global physics engine. Existing saves default to `null`.
4. **Guard both sides of the transition.** A setup must be created by the correct real move, must belong to the actual controller and must expire on reversals, ring relocation, interruption, finishing or recovery. The destination still needs to pass stamina, weight, fatigue, stipulation and clock gates.
5. **Preserve the actual event.** A counter is attributed to the defender, not recorded as the attacker's landed move. No invented suplex or locked submission if a setup never completed. Do not use extra RNG draws unless a deliberate new seed-baseline change has been reviewed.
6. **Compare before/after.** Track impossible transitions, usable chain occurrences, actual named reversals, coverage, pacing, injured and exhausted workers, and booked-finish accuracy. Inspect whole match tapes, not just the pass/fail score. If the pilot hurts variety or cannot be explained coherently, revert it.

### Non-goals

Do not attempt full inverse kinematics, 3D geometry, frame-by-frame motion simulation, external copyrighted technique imports, all-moves two-beat transformations, or automatic 250-record mass tagging. The matcher is still a deterministic **wrestling management game**: physical state should make the booking and commentary more credible, not overwhelm player decisions.

## 4. Proposed next work order and release gates

**Next controlled work (after v0.4.0 documentation release):**

| Step | Deliverable | Evidence required |
| --- | --- | --- |
| A — observability | A versioned 500-bout technique/position audit with seeded tape excerpts | Real event IDs, invalid-setup examples and by-family frequency |
| B — registry tranche | 24 reviewed technique records with explicit entry/exit/counter semantics | Registry validity, no invented nodes, no silent bias to the wrong worker |
| C — setup pilot | 4–6 physically reviewed causal transitions / optional grip state | Exact success, counter, abort and save-resume tests |
| D — impact review | Before/after on matching seeds and at least five match types | Graph Lab evidence, wrestling tape inspection, no finish or pacing regressions |
| E — optional expansion | Decide another registry tranche or wider attempt coverage | A written human review, not an automatic pass on star averages |

**Hard gates:** `npm test`, `tests/graph-lab.test.cjs`, `tests/catalog.test.cjs`, `tests/match-phase-pacing.test.cjs`, deterministic old-save/resume, full Chromium desktop/mobile journeys, and full 500+500 or larger same-seed review. Keep the **v1 baseline immutable** and create a separate explicitly named reference if the next live graph is accepted.

### Sources within this repository

- [Original technique inventory](phase1-graph-technique-audit.md) / [frozen CSV](phase1-technique-candidates.csv)
- [Registry](../assets/js/technique-registry.js) / [background identities](../assets/js/technique-backgrounds.js)
- [Aerial attempt state](phase6-aerial-attempt-state.md) / [grapple pilot](phase7-grapple-attempts.md)
- [Phase 9 chains](phase9-authored-chains.md) / [Graph Lab](graph-lab.md)
- [Shipped match engine](../assets/js/match-engine.js) / [v0.4 release](v0.4-release.md)

No third-party proprietary Fight Encyclopedia technique database was imported.
