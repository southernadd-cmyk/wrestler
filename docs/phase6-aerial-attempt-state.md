# Phase 6 — specific aerial-attempt state and move-linked resolutions

**Implemented in the live match engine**, not as editorial metadata or a new button in the Graph Lab. This phase follows [Phase 5b's aerial-counter review](phase5b-ground-strike-aerial-review.md).

## Why it changed

Previously, `ar_frog_rev` or `sb_cutter_rev` could be chosen independently whenever the wrestlers were at the top position. The commentary described a counter, but the engine did not prove that its exact parent attack had just been attempted. Linking a *landed* frog splash to a top-rope counter would be physically impossible because the landing has already taken both wrestlers to the mat.

Aerial attacks now use a **named, two-beat, persistent transaction**:

1. **Commit.** After the original physical eligibility, timing, stamina and match-plan weighting chooses a real top-rope/springboard action, `startAerial` names that exact move in the commentary. It stores `graph.pendingAerial={v,seq,id,side,at,position}` and a corresponding `graph.aerialAttempts[]` record. The wrestler expends a small amount of stamina for committing.
2. **Resolve.** On the *next real match tick*, **before** story-arc resets, scheduled nearfalls or independent spots, `resolveAerial` chooses precisely one result: the original action lands; that exact action's generated `_rev` counter succeeds; or its existing `_blk` block is used. The defence chance is bounded and reacts to the real wrestlers' ring skill, psychology and match-agreement context.
3. **Attribute.** The actual `graph.events[]` action (not a fabricated move node) receives `attemptedMove`, `aerialAttemptSeq` and `aerialResolution`. The matching attempt record becomes `landed`, `counter` or `block` with resolution time and real action ID.
4. **Interrupt.** If a sudden contracted finish or other interruption occurs before impact, the attempt is recorded as `interrupted`/`aborted`, without inventing a successful landing or counter.

Aerial attacks attempted on the final match tick can still land immediately under the original rule, because there is no following tick in which to resolve a suspended action. These *untracked final-tick actions* do not create pending attempts or false counter attribution. This preserves contracted finishes.

## What the state machine guarantees

- An exact `ar_frog_rev` **is not valid in the normal move pool** until a `pendingAerial.id === 'ar_frog'` exists. Attempting `ar_senton_rev` cannot counter that frog splash; likewise for `_blk` options.
- A generated reversal remains an alternative to the attacking move. It is never offered *after* the original dive has landed.
- The committed attack and its resolution live inside the already serialised `M.graph` object, so save/reload preserves it. The browser's existing `rState` serialisation restores the same random result, without additional career save fields. Old graph saves without these fields are migrated to an empty attempt list and no pending attack.
- Existing wrestling backgrounds and 90 curated mechanics stay unchanged. All **969 graph nodes** and all **6,176 directed edges** remain; this phase changes when a generated reversal may be chosen, not the authored graph's topology.
- An attacking wrestler cannot bypass the original stamina, heavyweight-agility, ring position or late-match rules by triggering an attempt. The landing, counter or block still runs through the original `Graph.apply` so damage, momentum, fatigue, counters, match bonuses, scripts and commentary retain their normal consequences.
- The attacker's small setup expenditure applies even if the move is defended. Counter attribution goes to the defender.

## Automated verification

`tests/aerial-attempts.test.cjs` directly exercises all three resolution outcomes for five named attacks (frog splash, senton, top-rope crossbody, low missile dropkick, springboard cutter). It tests blocked and reversed action IDs, correct original actor/control transfer, matching attack IDs, serialised in-flight replay, real tick ordering, old saves without `pendingAerial`, and interrupted early finishes.

The older [`catalog.test.cjs`](../tests/catalog.test.cjs) still requires *every* authored move node to be physically reachable, but now establishes a specific parent attempt before probing generated aerial reversals/blocks. It no longer calls an impossible free-floating counter "legal".

The [fixed 1,200-bout baseline](graph-lab.md) now includes **actual attempt outcome counts** separately from approximate consecutive move links. The runner rejects unresolved attempts or mismatched attempt/result IDs. Its pre-expansion reference file is **not changed**.

The normal 500+ match graph tests, deterministic save/replay, risk-vs-safe balance, booked endings, repeated rivalries, five-week persisted careers, and desktop/mobile Chromium checks remain mandatory gates.

## Remaining limitations

This is an explicit **aerial** attempted-move state, not yet a general grapple-transaction engine. Generic `aerial_counter` commentary, special balcony dive spots and other long-lived wrestling systems remain separate and have not been silently rewired.

The match engine has one position and one control variable; it does not model exact three-dimensional airborne trajectories, grip-specific contact geometry, or simultaneous multi-person action. Nor does a higher counter rate automatically imply believable match pacing. Review actual tapes and the new baseline outcomes before broadening the approach to suplex and submission counters.

**Next:** controlled attempts for standing throws and submissions, with the same save/resume and provenance rules, only if the aerial system proves stable in live careers.
