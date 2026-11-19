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

In addition to existing move-by-move school multipliers, Phase 9 recognises *named source-to-destination handoffs*. The bounded affinity for a familiar transition can reach an additional **1.42x** from relevant training and theatrical wrestling style (e.g. catch or judo for mat controls; boxing for strike chains; strength for power; lucha/acrobatics for fast ropes). The bonus applies only if that source really was the current graph node and the next move is legal. An opponent's counter is not treated as an attacker chain.

**No new or inflated character biographies:** Phase 8's 40 preserved and 40 provisional gameplay training identities remain separate from ring performance style and career training sessions.

## What was genuinely observed

The initial 200-bout automated sample, *before a small additional school-familiarity tuning*, recorded **93 consecutive authored-chain transitions on 56 distinct relationships**; all nine contexts occurred. This shows usage, not complete coverage or proof of realism. Lucha and ringside examples were notably sparse in that initial sample.

A dedicated test now requires at least 40 observed chains, 70 real chain transitions, eight of nine contexts represented and 160 distinct action-event sequences in a deterministic 200-bout sampling protocol. If one of these thresholds fails, the code cannot pass as merely increasing the graph count.

The Phase 9 Graph Lab test suite also checks 120 bouts for causal attempt integrity, injected counter mismatches and replay. CI produces a 500-bout evidence artifact. The Move Atlas lists every added relationship and the Lab results show actual per-group observations.

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
```

The results are deliberately reproducible by seed and independent of player career save files.
