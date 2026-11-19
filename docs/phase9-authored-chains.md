# Phase 9 — substantial authored match-chain expansion

**Release:** draft PR #106, stacked on Phase 9 validation PR #105, Phase 8 #104, Phase 7 #103. Do not treat this as already live.

## Scope and actual graph change

- Before: 969 action nodes; 6,189 directed links.
- After: **969 action nodes; 6,333 directed links**.
- **191 deliberately authored transition relationships**, including **144 genuinely new directed links**. Other relationships strengthened existing links. No added move IDs.
- Nine contexts: catch ties and throws (25), arm control on the mat (23), grounded leg and neck control (22), short striking combinations (27), power setups (12), lucha and fast ropes (23), corner sequences (18), ringside exchanges (15), and grounded follow-throughs after impacts (26).
- Proposed links that violated physical state requirements were **not** incorporated. In particular, one attempted power-press-to-press chain could not work because the first move ended on the mat. Duplicated proposals were also omitted.
- Everything remains subject to the engine's normal physical position, weight/lifting, risk, stamina, match stage, booked finishes and opponent safeguards.

## How moves develop

Examples of deliberate routes rather than family-to-family random selections:

- Lock-up → top wristlock → hammerlock or short-arm control → arm drag
- Mat arm pressure → kimura or Fujiwara armbar → keylock or wrist control
- Grounded leg control → toe hold → ankle lock → kneebar → single-leg crab
- Jab → forearm or body kick → uppercut, knee lift or further short strike
- Bearhug → side slam or uranage (while position and weight are legal)
- Rope run → handspring, headscissors or hurricanrana; wrist grip → cradle pin
- Corner whip → corner knee or chops → turnbuckle follow-through
- Floor fighting → barricade → ring post or steps
- Vertical suplex → elbow/knee drop or compatible control, not another arbitrary standing throw

These are graph connections, **not guaranteed scripts**. Each step is selected from a legal weighted pool. Reversals and interruptions still alter the path. They are design judgements, not independently expert-certified wrestling choreography.

## School and style differences

In addition to existing move-by-move school multipliers, Phase 9 recognises *named source-to-destination handoffs*. A familiar transition receives up to an additional **1.42×** schooling/style factor (e.g. catch or judo for mat control, boxing for strike chains, strength for power, lucha/acrobatics for fast ropes). The refinement also multiplies the eligible **same-controller** authored follow-through by **2.6×**, or **3.15×** when it continues a preceding authored pair. This is a bounded selection preference, never a guaranteed script. It requires the source to be the last genuine action by the current controlling wrestler, not a special interruption or opponent interception, and the destination must still pass normal physical guards and booking rules. A committed top-rope Spectacle wrestler also receives more weight on legal *named* aerial/springboard attacks instead of always taking the generic top-rope beat; safe-match risk reductions remain intact.

**No new or inflated character biographies:** Phase 8's 40 preserved and 40 provisional gameplay training identities remain separate from ring performance style and career training sessions.

## What the same-seed tests actually show

The first Phase 9 rollout had 93 authored-pair occurrences over 200 bouts (56 relationships); our 500-match review also showed that only 123/500 matches contained any newly introduced connection. That was inadequate.

The refinement was measured in CI against **exact original Phase 8 revision** `d80139d3462cb4bb8740abd4c032c42a30b8cf81` with 500 identical pairings, plans, card positions, booking outcomes and seeds:

| Measure | Phase 8 | Refined Phase 9 |
|---|---:|---:|
| Match sequences containing a Phase 9-introduced pair | 14/500 | **272/500** |
| Observed occurrences of newly introduced pairs | 14 | **440** |
| Different newly introduced pairs observed | 10 | **96** |
| Consecutive same-controller newly introduced pairs | 11 | **437** |
| Three-action sequences using two introduced edges | 0 | **40** |
| Named aerial moves | 37 | **57** |
| Named springboards | 22 | **56** |
| Average engine star rating | 2.33 | 2.32 |

**Important interpretation:** the newly introduced pairs can still occur in Phase 8 via general arc picks, so these counts do not prove which picker component made an individual move happen. The controlled A/B evidence does show that they become much more common with Phase 9. Nearly half the refined matches still have no observed new pair; ratings are effectively unchanged. This is more depth, **not evidence of a higher-quality match overall**.

The Phase 9 runner now exports the exact set of 144 new link IDs alongside the 191 authored relationships, and distinguishes all adjacent pairs from same-controller action sequences. The Graph Lab UI shows match reach, actual newly introduced pair counts, and three-action combination examples. CI requires improvements against the pinned Phase 8 source; it also tests intentional injected misattribution and mechanically invalid outcomes. Both the 500-bout standalone report and the same-seed comparison JSON are captured as downloadable GitHub Actions evidence.

The latest dedicated 200-bout technique test observed 214 curated pair occurrences across 98 relationships, with all nine contexts represented. Real footage-style narrative review is still required; passing these tests alone cannot demonstrate convincing choreography.

## Outstanding limitations

- The original 336 move catalog remains the same size. This is **depth and variety**, not additional move names.
- A positional match does not encode every grip transition, ring-facing orientation or cooperative performance detail. Specific examples still deserve tape review.
- The validator can detect illegal outcomes and too-repetitive action IDs, but does not objectively establish wrestling realism.
- For the four Phase 7 suplex/submission pilot attempts and Phase 6 aerial attempts, exact counters are causal. Other existing generated reversals are not all converted to two-beat named attempts.
- A full release must pass the entire regression suite, browser smoke tests, repeated rivalry sequences and stored baseline checks. A domain expert should inspect representative multi-step match tapes before claiming greater realism.

## How to audit yourself

On the stacked preview branch use the Graph Lab Run sheet (200–1,000 matches; rotate the roster), then open the Phase 9 context usage breakdown. The first-bout Tape shows the actual sequence, the Move Atlas shows authored connections and the Baselines view compares with the frozen reference.

From Node CI, run:

```sh
node tests/phase9-authored-chains.test.cjs
node tests/phase9-graph-validation.test.cjs
node tools/graph-lab/validate.cjs --count 500 > phase9-evidence.json
# With the pinned Phase 8 revision checked out to phase8-reference/:
node tools/graph-lab/compare-phase8.cjs phase8-reference > phase9-comparison.json
```

The results are deliberately reproducible by seed and independent of player career save files.
