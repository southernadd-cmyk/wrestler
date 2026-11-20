# Phase 2 — bulk grappling and named counter sequences

**Date:** 20 November 2026  
**Branch:** `feature/phase2-grapple-counter-sequences-20261120`  
**Status:** implementation in draft PR #126; not live, testing and match-tape review pending.

## What this branch actually implements

Extend the existing serialized two-beat `startGrapple → resolveGrapple` mechanism from **4 to 39 existing authored techniques**:

- **All 25 suplex techniques**, from vertical, delayed, fisherman and German suplexes through dragon, tiger, overhead, brainbuster and falcon arrow.
- **11 selected power techniques**: powerbomb, sit-out and running variants, backbreaker, uranage, Samoan drop, gorilla press, military press, pumphandle slam, belly-to-belly throw and Argentine backbreaker.
- **3 existing other techniques**: sleeper, ankle lock and snap DDT.

An attempt records its true attacker, move ID and match tick. At the next tick it resolves to the **same move**, its existing named generated `_rev` counter or `_blk` block where one exists, or a genuine interruption/abort. No fictitious landed move is credited to the attacker on an escape. Save/resume and booked outcomes remain governed by the original engine.

## Reusable physical control

A central `PHYSICAL_GRIP_MOVES` mapping declares entry grip requirements; `GRIP_ENTRY` identifies actual graph nodes that can produce front facelock, rear waistlock, upper-body tie, body clinch or grounded leg control. The descriptor stores owner, source and age, and rejects an absent, expired or opponent-owned grip. A previously unrecorded legacy `physical=null` state retains the existing migration fallback.

**Important limitation:** A common attempt/resolution framework does *not* by itself prove live handoffs are frequent. `CAT.members.suplex` is used to avoid hand-maintaining 25 IDs, while each physical grip mapping is explicit, not inferred mechanically from an imported name.

## Testing

- Exhaustive directed-path tests for 39 parents, exact counters and blocks, illegal grip ownership/age, replay, interrupt and legacy migration.
- The graph catalogue's reachability probes establish valid grip prerequisites when examining a move or its generated defence.
- Mandatory full CI, Graph Lab 500+500 paired-seed audit with actual landed/countered/aborted attempt counts, old-save and pacing checks, and desktop/mobile Chromium.
- Examine real transcripts across five plan styles, including technically credible throws, counters and follow-throughs. This is a **review gate**, not a claim of verified wrestling realism.

## Remaining Phase 2 scope

More grounded submission chaining, wrist control, counter-to-regrip and grip-preserving transitions require subsequent batches. The initial 39-technique implementation is not a claim that the remaining 226 unreviewed catalogue techniques have source-reviewed metadata or reliable physical continuations. Avoid further mass imports or invented counters.

## Graph Lab evidence — reachability intervention (20 November 2026)

A new reproducible `tools/graph-lab/grapple-audit.cjs` command and PR workflow run 1,000 real bouts across rotating wrestlers, five match plans and fixed seeds. The browser Graph Lab now shows per-move actual attempts, landings, counters, blocks and moves absent from the sample; generated reversals alone are **not** counted as attempts.

| Measure | Initial 39-move branch | Controlled-grip selection | Spot-fest-preserving revision |
| --- | ---: | ---: | ---: |
| Target grapples attempted at least once | 21/39 | 36/39 | **35/39** |
| Overall graph nodes observed | 84.0% | 86.6% | **86.4%** |
| Grapple commitments (includes established superplexes) | 185 | 432 | **392** |
| Attempt-event integrity errors | 0 | 0 | **0** |

The second revision deliberately excludes the new grapple preference boost for Spot-fest; its existing high-risk aerial identity and botch baseline otherwise regress. The original 90% catalogue coverage gate remains unchanged and is still **not met**. Four target moves remain unobserved: `sx_delayed`, `sx_dragon`, `pw_powerbomb`, `pw_running_powerbomb`. Absence from the sample does not prove impossible reachability, and no manual narrative-quality sign-off has occurred.

**No merge while catalogue coverage fails.** Further work should instrument rejected move candidates by cause (position, grip, stamina, timing, lift, style), distinguish insufficient setups from poor selection, then review a limited corrective set. Never manufacture throw outcomes, bypass grip ownership, suppress risky wrestling or lower the gate merely to pass CI.

## Paired main-versus-Phase-2 coverage classification (20 November 2026)

A new **read-only** comparison, `tools/graph-lab/coverage-classification.cjs`, checks out current `main` and evaluates both revisions over the **same 1,000 seeded bouts**, wrestler pairings, plan styles, match slots and finishes. The [CI evidence run](https://github.com/southernadd-cmyk/wrestler/actions/runs/44720420059) uploaded the complete candidate/base comparison as `phase2-coverage-comparison.json`.

| Category | Current main | Phase 2 candidate | Delta |
| --- | ---: | ---: | ---: |
| All graph nodes observed | **91.73%** | **86.43%** | **−5.30 pp** |
| Independently executable actions observed | **97.74%** | **96.83%** | **−0.91 pp** |

**Conclusion:** the 90% whole-graph coverage regression is real relative to the same-seed main baseline, but mainly concerns dependent generated counter/block nodes, not ordinary action access. The candidate has 133 unobserved nodes, of which 119 are counters or blocks. Because named grapple reversals now require an exact pending parent attempt, their lower frequency may be physically correct, but must be explicitly reviewed—not dismissed as a harmless test artefact.

Four rarely selected moves (`sx_delayed`, `sx_dragon`, `pw_powerbomb`, `pw_running_powerbomb`) have **398 combined legal selection opportunities** in this seed set but only **2.871 expected selections** at the recorded weights. Zero actual selections is plausible sampling variation; their availability checks do not establish a defect. More useful follow-up tests: parent-specific attempt rates and conditional defence rates by move, independent-action coverage, and a direct matrix of all 39 exact counter/block paths; these should be judged against the original aggregate test before any proposal to revise the release gate.

The 90% threshold remains unchanged and **the PR remains draft/unmerged**. No match-engine probabilities or physical eligibility were altered by this investigation.
