# Phase 5 — training identity and technique breadth (first controlled expansion)

> **v0.4 status:** Completed initial 60-record expansion. Subsequent Phase 5b extended the curated registry to 90 and Phase 10 increased the executable move count to 340. See [v0.4 release](v0.4-release.md) and [technique and physical realism review](technique-and-realism-review.md). Historical figures and original phase wording below are retained for traceability.

## Purpose

The original four *performance styles* (Story / Technical / Brawl / Spectacle) still govern match presentation. A separate *training background* guides how the wrestler prefers to execute a small set of reviewed mechanics. Neither identity overrides the body's physical restrictions, the card agreement, or the contractually booked finish.

Phase 5 begins with a **source-level audit of all 80 wrestlers**, then a contained release rather than mass assigning technical schools by performance style.

## Full 80-worker roster audit

Read [`phase5-roster-training-audit.csv`](phase5-roster-training-audit.csv). Every original and v4 wrestler is listed with stable ID, public stage name, existing performance style, old school assignment, Phase 5 proposal, source biography/absence, confidence category, reasons and next editorial check.

**Findings:**
- Of the initial **38** bespoke backgrounds, only a limited number are explicitly grounded in described training history; many (e.g. working mat specialists) were **game-design allocations**, not verbatim facts in the cast bible. Their biographies are not silently rewritten.
- **42** were previously general. Only **two** gain newly allocated backgrounds in the first release; **40** remain general. One existing lucha allocation receives a provisional acrobatics component.
- **Tomás Ash — Boxing**: explicitly a former boxer.
- **Val Vance — Strength athletics**: explicitly a former strength athlete.
- **Kit Marlowe — Lucha and acrobatics (provisional hybrid)**: Kit retains the original lucha affinity. His bio says *built like a gymnast*, which does **not** establish formal gymnastics training; an additional, weaker acrobatics affinity is an editorial proposal requiring approval before treating it as canon.
- Bao Merrick (former judoka), Nico Vega (learned lucha), Cal Rourke (club grappler) and every prior assignment retain their names and stable IDs. Being an aerial star (e.g. Kofi, Zara) does **not** on its own automatically grant an acrobatics history.

The source inventory includes opponents who lack published biography fields; they are not retrofitted with invented pasts merely to fill cells.

## Mechanics added without new executable move IDs

The [Phase 1 complete 336-move inventory](phase1-technique-candidates.csv) remains the authoritative checklist. The [Phase 2 registry](../assets/js/technique-registry.js) expands from **39 to 60** proposed, individually sourced move interpretations (17.9% of the original 336). The 21 new candidate records include:

- **Boxing:** straight jab combination and body shot.
- **Strength:** controlled scoops, catches, shoulder holds, overhead lifts and powerslams.
- **Acrobatics:** 450 / shooting-star / corkscrew rotations and springboard launches.
- **Catch and judo:** fisherman and exploder suplex entries, kneebar.
- **Ring-specific cradles:** backslide, schoolboy and crucifix pins.

Training categories are **source-informed skills**, not claims that every related move originated in that discipline. The mechanics vocabulary explicitly distinguishes a strike from a throw, a pinning result from a takedown, and an aerial launch context from an athlete's match style. No Fight Encyclopedia technique database, copyrighted technique text or proprietary taxonomy data is imported.

The real match graph explicitly curates **14 weighted, guarded transitions**, recorded in `Graph.TECHNIQUE_EXPANSION`, in addition to the **unchanged 11 original Phase 3 links**. Of the fourteen, **four are newly created directed edges**, while ten adjust pre-existing graph paths; the total grows from 6,160 to 6,164. The curated transitions include:
- `st_jab → st_gut_punch`
- `waistlock → pw_body_slam`, `rope_rebound → pw_fallaway`, `lockup → pw_military_press`, `pw_torture_rack → pw_samoan_drop`
- `top_climb → ar_shooting_star / ar_corkscrew / ar_450`; `springboard_rise → sb_dropkick / sb_moonsault`
- `front_facelock → sx_fisherman`, `waistlock → sx_exploder`, `wristlock → pn_backslide / pn_crucifix`

Every pair must have a real source and destination, *identical graph exit/entry positions*, and a manually documented setup relationship. Existing stamina, weight, agility, risk, match timing and role guards remain. Adding a weighted alternative does not force that exact sequence in every match.

The Phase 4 school bonus remains **1.00–1.28**: no extra blanket buffs for a Brawl or Spectacle style; no training changes to unreviewed moves. Phase 5 introduces no new persistent save fields, new graph nodes, move naming, or player-visible training purchases.

## Validation and comparison

- `tests/phase5-training-expansion.test.cjs`: all 80 roster-source rows; exact original 336; 60 proposed metadata entries; 14 live link positions and curated setup references; separate school effects on *real `Graph.pool`*; unchanged saved roster and move graph; 24 contract-safe matches with seeded replay.
- Existing Phase 3 and Phase 4 tests remain active. They now explicitly preserve the original 11-link pilot instead of accidentally conflating it with the Phase 5 addition.
- The [frozen 1,200-bout graph reference](../tools/graph-lab/baselines/reference-v1.json) **is not replaced**. The baseline runner reports observed event-pair counts for both Phase 3 and Phase 5 separately. A matching pair is a conservative observational proxy, not proof the new edge caused it.
- The [Tuesday five-meeting rivalry suite](repeated-rivalry-automation.md) and [Wednesday persisted-career continuity suite](career-continuity-audit.md) run against the expanded engine, guarding repeated-opponent variety, prior results and real saved callbacks.
- The [Graph Lab](../tools/graph-lab/) marks **LIVE PHASES 3 + 5** transitions separately from unapproved catalog suggestions.

## Next review queue — don't mass-classify by name

Of the 336 original moves, **276 remain outside the curated registry**. The next tranche should be source-reviewed in manageable groups: submissions and their distinct hold entries; forearm/punch and kick variants; aerial risk stages and pin follow-ups; move-specific counters; and technical aptitude decisions for individual cast members. Mark uncertainty as uncertainty, keep theatrical and tactical moves in *Wrestling-only* when necessary, and require all changed links to demonstrate useful occurrence and continued finish integrity in seeded baseline comparisons.

**Human sign-off needed:** Kit's provisional *additional* acrobatics affinity (his original lucha identity is preserved), plus older editorial attributions with no explicit biographical evidence. Do not rewrite the cast bible to rationalise training classifications after the fact.
