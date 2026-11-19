# The Office — Phase 1: match-graph technique audit

**Status:** Read-only design/data audit, no match-engine or career-system changes  
**Audited baseline:** `main` at `02228d5569544790df329e8309dd3b88f87b8d1d` (19 November 2026)  
**Reference:** `tools/graph-lab/baselines/reference-v1.json`, the frozen 1,200-bout pre-expansion suite  
**Editable inventory:** [phase1-technique-candidates.csv](phase1-technique-candidates.csv) — all **336** authored catalogue moves, with their existing IDs, exact display names, source family, provisional mechanical class, review status and line reference.

## Decision

**Do not replace the current 20 wrestling families with Fight Encyclopedia's taxonomy.** The systems describe different things.

- **The Office's family** is a match-performance grouping (e.g. `chain`, `lucha`, `corner`, `heel`, `fire`). It helps the engine select plausible-seeming action inside a dramatic arc.
- **A biomechanical class** describes the technique itself (e.g. Throw, Clinch, Takedown, Submission, Escape & Reversal).
- **Ring context** separately describes where and under what rules it happens (corner, ropes, apron, outside, referee distraction).
- **Training tradition** (catch, judo, lucha, etc.) is a *different dimension again*. The same arm drag or headlock may appear in several traditions; don't duplicate the technique just to add a style label.

Phase 2 should add an **optional, independently validated mechanics registry linked by the existing stable move IDs**. No new nodes, probability changes, background assignments or auto-generated counters are authorised by this audit.

## 1. What is actually in the match graph?

The current engine exposes `OfficeMatch.GRAPH` and `GRAPH.CATALOG`. Its existing catalogue and invariant tests report:

| Existing structure | Count | Interpretation |
| --- | ---: | --- |
| Full action graph nodes | **969** | Includes original authored beats, catalogue techniques, reversals and blocks |
| Directed graph edges | **6,152** | Authorised `A[id].next` links; not proof that every edge occurs in play |
| Dramatic story arcs | **25** | Narrative flow, not biomechanical classification |
| Authored catalogue techniques | **336** | Original named moves in 20 existing families |
| Technique reversal variants | **324** | Generated `_rev` nodes, usually using family-level reversal templates |
| Technique block/abort variants | **209** | Generated `_blk` nodes, usually using family-level block templates |
| Other action nodes | **100** | Hand-authored flow/staging hubs and legacy moves, outside the catalogue inventory |
| Existing style affinities | **4** | Technical, Brawl, Spectacle, Story — *performance*, not wrestler training history |

The engine already checks **position (`requires`/`zone`/`down`), stamina/cost, lift capacity, agility, body-part targeting, time eligibility, match stipulations and booked outcome**. Its main value is that moves remain inside a deterministic match structure.

**The limitations are in the meaning of the links, not simply their quantity.** Each catalogue entry normally receives three deterministic setup links from its family's `from` pool, plus generated family-based follow-ups and reversal/block text. This is a good coverage mechanism, but it does not explicitly know which hand/grip is controlled, who has a leg trapped, whether a throw can follow a particular hold, or which specific technique defeats another. Those additions must be independently designed and tested.

## 2. Existing families and proposed taxonomy crosswalk

These are *editorial starting points*, not Fight Encyclopedia records or approved technique-by-technique classifications. The accompanying CSV keeps ambiguities visible.

| Office family | Catalogue moves | Mechanical candidate(s) | Editorial caution |
| --- | ---: | --- | --- |
| `suplex` | 24 | Throw | Distinguish grip, lift mechanics and closely named variants |
| `power` | 27 | Throw, Submission, Strike | Includes bearhug/torture-rack holds and impacts |
| `neck` | 18 | Throw, Strike | DDT, cutter, neckbreaker and stunner use different mechanics |
| `strike` | 32 | Strike | Strongest direct crosswalk; check intended targets |
| `corner` | 18 | Strike, Throw, Clinch | **Corner is location**, not a mechanical class |
| `aerial` | 18 | Strike/impact; often needs review | **Aerial is delivery**, not an ontology class |
| `superplex` | 7 | Throw | Requires a *top-rope position* overlay |
| `springboard` | 6 | Strike, Throw | Rope-assisted launch is an entry mechanic |
| `dive` | 9 | Impact/takedown; often needs review | Floor/apron context cannot be captured by class alone |
| `submission` | 35 | Submission | Mat-control and legal-performance qualifiers needed |
| `ground` | 20 | Strike, Submission/other | Mostly grounded impacts; contains leg-twist/choke exceptions |
| `chain` | 24 | Takedown, Clinch, Throw, Position, Escape & Reversal | **Best Phase 2 pilot** for explicit transitions |
| `pin` | 11 | *Wrestling-only extension* | Covers/cradles are not a listed source biomechanical class |
| `outside` | 14 | Mixed; review by move | Ringside is location/stipulation context |
| `heel` | 14 | *Wrestling-only + selected strikes* | Referee distraction and illegal tactics are narrative rules |
| `fire` | 15 | *Wrestling-only + selected strikes/throws* | Comeback/no-sell is performance psychology |
| `rest` | 12 | Submission, Clinch, Position | Holds and one lateral press are not identical |
| `lucha` | 10 | Takedown, Throw, Strike, Position | Lucha is a training/style tradition, not a class |
| `rope` | 10 | Mixed; review by move | Rope environment separate from move mechanism |
| `running` | 12 | Strike, Takedown | Momentum is an entry requirement, not a class |
| **Total** | **336** | | |

Of the **336 proposals**, **67 remain explicitly unresolved** and **49 are provisionally marked as wrestling-specific** instead of forced into the external classes. The rest are proposed classes, not certified mappings. **Zero exact duplicate display names** were found in the 336 catalogue entries after normalising case and punctuation; this does *not* rule out mechanically equivalent techniques or aliases.

**Important:** The CSV covers only the 336 catalogue techniques. The 324 reversal nodes and 209 block nodes clearly exist in the game, but have **not** been classified into Escape & Reversal or Defence as separate techniques. Nor have the 100 original/hub nodes been exhaustively mapped. Don't interpret zero direct catalogue mappings to Defence or Weapon as proof these concepts are absent.

## 3. What the frozen baseline currently shows

These six scenarios use **different seeds and, in some cases, different card positions, plans and finishes**. They establish regression references; **they are not a controlled causal test of what the four styles do.** The first four each sample 250 roster-wide matches, while the latter two use only 100 fixed-pair matches.

| Scenario | Matches | Distinct nodes visited | Observed authored edges | Mean stars |
| --- | ---: | ---: | ---: | ---: |
| Storytelling / roster | 250 | 79.7% | 23.7% | 2.46 |
| Technical / roster | 250 | 83.5% | 25.2% | 2.81 |
| Brawling / roster | 250 | 82.0% | 23.1% | 2.79 |
| Spectacle / roster | 250 | 81.3% | 25.0% | 1.79 |
| Juno vs Rex | 100 | 52.5% | 10.2% | 2.77 |
| Bao vs Theo | 100 | 52.6% | 10.3% | 3.67 |

**All six produced zero graph-validation errors, timing violations and unrecognised action-event IDs.** Authored-edge coverage is the lab's conservative proxy: only consecutive real match events that match an `A.next` edge count; arc jumps do not. It is *not* the probability of making a valid move.

**Signals to investigate, not declared defects:**

- **Family dominance:** for the technical roster scenario the leading families are strike (513 events), ground (386), submission (372), power (340), fire (301) and chain (253). If the goal is distinctive catch-style sequences, the relevant question is which **grip-to-grip transitions** appear, not simply the percentage of `chain` events.
- **Stamina/pacing:** the spectacle scenario averaged 1.79 stars versus 2.81 in the technical scenario, and `catch_breath` occurred 1,188 times versus 620 `stand_reset` events in technical. Because the scenarios have different seeds and booking conditions, this is **a review hypothesis**, not evidence that aerial wrestling lowers ratings.
- **Repeated hubs:** `stand_reset`, `wristlock`, `mat_hold`, `catch_breath`, `outside_toss` and `top_climb` repeatedly appear in high-frequency action/edge records. Inspect these during the pilot for natural-sounding transition text and repetition; don't remove necessary reset hubs purely to boost coverage.
- **Current counters:** 324 generated reversals and 209 blocks provide *numerical* variety, but most are parameterised family-level texts. Phase 2's value will be a smaller number of **mechanically intelligible, move-specific choices**.

## 4. Specific identity/alias and physical-logic review queue

These are **possible overlaps or related variants**, not proven defects or duplicates.

| Existing moves | Question before creating another node |
| --- | --- |
| `sx_belly_back` / `sx_saito` | Are these separate variants of a shared back-suplex mechanism? Which grips differentiate them? |
| `sx_belly_belly` / `pw_belly_belly` | Do different family names describe materially different mechanics or an alias/variant? Verify against the live move IDs before adopting as a canonical pair |
| `sm_armbar` / `rs_armbar_rest` | Mechanically related but different *match functions*: submission attempt vs rest/control hold |
| `sm_wristlock_ground` / `rs_wrist_mat` / `ch_rolling_wristlock` | Same limb-control family, but distinct starting position and finish possibilities |
| `lc_hurricanrana` / `lc_rana_pin` | Shared entry, but the second adds a pinning outcome |
| `ch_fireman` / `pw_samoan_drop` | A fireman's carry *setup* versus dropping the opponent from the carry |
| `sm_rear_naked` / `sm_sleeper` / `sm_dragon_sleeper` | Closely related names; distinct control geometry and theatrical legality need review |
| `sm_abdominal`, `sm_octopus`, `rs_side_headlock` | These are standing/mat holds; current generic position tags cannot express every gripping prerequisite |

**No duplicate-removal proposal should be automated from names alone.** Preserve existing IDs and save compatibility. An editor must approve any new canonical mechanic/variant relationship.

## 5. Expansion backlog ranked by expected value

### P0 — Before adding techniques

1. **Canonical mechanics, with aliases and variants.** Record existing move ID, primary mechanic, entry grip/position, target, exit position, variant-of relationship, and optional cross-art labels. An alias must not create another executable node.
2. **Separately model context.** Keep ring location, rope access, interference/illegal tactics, aerial launch and pinning outcome outside the Fight Encyclopedia class axis. Do not force the nine classes to cover wrestling presentation.
3. **Position/grip vocabulary.** Expand from `standing/mat/corner/top/outside` to optional, readable states such as arm-control, head-control, rear-waist-control, leg-control, grounded-top/grounded-bottom. Add **metadata only** first: don't replace authoritative positional validity yet.
4. **Licensed-source boundary.** Only use public taxonomy headings/schema as conceptual inspiration. Source documentation explicitly excludes its proprietary library/data from MIT. Write move descriptions and relationships from independent knowledge and the game's existing authored material.

### P1 — Pilot after the registry exists

5. **Chain wrestling:** wristlock → rolling escape/standing switch → arm drag/headlock takedown, with purposeful counter and re-entry options.
6. **Takedowns and throws:** single/double-leg, fireman's carry, hip toss, German and bridge/pin variants. Prefer meaningful chains to indiscriminate cross-family edges.
7. **Submissions and escapes:** armbar/cross armbreaker, figure-four, ankle lock, rope escape and a counter that follows from actual control state. The match's contracted finish still governs victory.
8. **Lucha as a comparison style, not its own class:** arm drag, headscissors, rana into pin and rope-assisted entry, comparing mechanical overlaps with catch/judo.
9. **Counter specificity:** select a small handful of counters and blocks for explicit move-to-move relations before changing the rest of the 533 generated variants.

### P2 — Audit the implementation

10. **Match style × wrestler background separation.** Technical/Brawl/Spectacle/Story remains presentation; Catch/Judo/Lucha become optional performer capabilities only in a later phase.
11. **Same-seed controlled experiments.** Compare selected pairings with *identical* seed, plan, opponent, slot, finish and run count. Do not attribute differences to a style from the existing differing-seed baseline scenarios.
12. **Repeat-opponent narrative check.** Replay five consecutive meetings and inspect grip choices, counter usage, commentary repetition and outcome contracts after adaptive features exist.

## 6. Phase 1 exit criteria and hand-off

- [x] Verified full graph totals and structural strengths against the current engine.
- [x] Inventoried all 336 catalogue moves and 20 families by stable ID in an editable CSV.
- [x] Linked a provisional crosswalk to all nine *structural* source classes; marked unresolved and wrestling-specific entries openly.
- [x] Compared the frozen match data without changing it or inventing match outcomes.
- [x] Identified candidate aliases, mechanical gaps and a constrained pilot backlog.
- [x] Documented source licensing limitations.
- [ ] **Editorial approval** of the proposed classifications, especially 67 unresolved and 49 wrestling-specific entries, before making the taxonomy authoritative.
- [ ] **Manual physical/narrative review** of pilot moves and counter pairings before editing the match engine.

**Proposed Phase 2 interface:** a separate `TECHNIQUE_REGISTRY` keyed by existing move IDs, with `mechanic`, `class`, `originStyleTags`, `entry`, `exit`, `target`, `variantOf`, `counterIds`, `setupIds`, `provenance`, `reviewStatus`. Start metadata-only and validate against the existing `GRAPH.A`. Do *not* translate the whole 336-move CSV into hard engine rules without review.

## Sources and licensing

- [Fight Encyclopedia taxonomy documentation](https://github.com/acenji/fight-encyclopedia/blob/main/TAXONOMY.md): nine broad structural classes and biomechanical rather than martial-art grouping.
- [Fight Encyclopedia public data-format documentation](https://github.com/acenji/fight-encyclopedia/blob/main/DATA-FORMAT.md): published metadata field *names*, not content.
- [Fight Encyclopedia licence and proprietary-content notice](https://github.com/acenji/fight-encyclopedia/blob/main/LICENSE): the GitHub documentation/software is MIT; the technique taxonomy **data**, reference database and digital-library content are expressly **not** included.
- The Office source: `assets/js/match-engine.js`, `tests/catalog.test.cjs`, `tools/graph-lab/baselines/reference-v1.json`.

This report was written from the two repositories' published source/documentation and the existing frozen snapshot. **No copyrighted technique entries, proprietary descriptions or reference database content were imported.**
