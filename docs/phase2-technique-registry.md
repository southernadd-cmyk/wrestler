# Phase 2 — technique mechanics registry (read-only pilot)

> **v0.4 status:** Completed original Phase 2 **metadata-only pilot**. The separate live v0.4 registry contains 90 reviewed records for 340 authored moves; this original pilot's proposed relationships are preserved as historical design. See [v0.4 release](v0.4-release.md) and [technique and physical realism review](technique-and-realism-review.md). Historical figures and original phase wording below are retained for traceability.

**Scope:** a manually curated metadata layer over *existing* OfficeMatch catalogue IDs. No new moves, no match selection/weight changes, no saves or training effects. This follows the [Phase 1 audit](phase1-graph-technique-audit.md) and preserves the frozen 1,200-bout reference.

## Decision

Keep three concepts separate:

1. **Performance family:** the engine's original 20 families (`chain`, `submission`, `lucha`, `corner`) still drive probability and dramatic structure.
2. **Mechanics and physical state:** optional proposed class, mechanism, incoming/outgoing control, target and specific relationships. The module `assets/js/technique-registry.js` is not loaded by the player-facing game.
3. **Training affinity:** `catch`, `judo` and `lucha` indicate relevant technical backgrounds, **not** a claim of historical origin, exclusive ownership or any wrestler's assigned background.

The registry uses the **nine broad published Fight Encyclopedia classes** only as design inspiration, plus **Wrestling-only** for pins and presentation not covered by that combat-sport ontology. It does not copy any third-party technique entries, reference database content, descriptions or proprietary taxonomy data. [External licence notice](https://github.com/acenji/fight-encyclopedia/blob/main/LICENSE).

## Pilot records

The registry currently contains **39 editorially proposed records** across chain/control, takedowns, throws, submissions and lucha pin combinations.

| Field | Meaning |
| --- | --- |
| `id` | Existing stable `OfficeMatch.GRAPH.A` catalogue move ID |
| `mechanicalClass`, `mechanic` | Broad mechanical class and original local mechanism slug |
| `entry`, `exit` | Physical position and grip/control hints. Position must agree with live engine requirements and output; control is descriptive only |
| `target` | Matches the engine's existing body-part metadata, or null |
| `traditionTags` | Non-exclusive technical affinities, not background assignments |
| `setupIds`, `counterIds` | **Proposed relationships, not playable graph links.** Every ID exists; curated counters must already point back via the game's `counterOf` field |
| `variantOf` | Candidate variant parent linked to an existing pilot ID, with cycle detection |
| `reviewStatus`, `editorialNote`, `provenance` | Explicitly `proposed`, not approved or externally sourced |

**Examples:** The engine's `ch_single_leg_rev` contains a move-specific sprawl, so it is a candidate counter of `ch_single_leg`. We deliberately do not list every generic submission `_rev` node as a move-specific counter. Likewise, `lc_rana_pin` may be a pinning variant of `lc_hurricanrana` while keeping pin outcome distinct from the mechanical class.

## Validation

Run `node tests/technique-registry.test.cjs`. It loads the shipped engine, confirms every record belongs to the original 336 authored moves, and verifies stable IDs, metadata against authoritative graph positions and body targets, valid existing relationships, move-specific counters, variants with no cycles and explicit unapproved editorial status.

The test also mutates a *test copy* of a move requirement and counter target to prove drift triggers failures; it verifies the real graph is unchanged. This is a **metadata-only quality gate**, not an integration test for changed move probabilities.

The [Graph Lab Move Atlas](https://southernadd-cmyk.github.io/wrestler/tools/graph-lab/#atlas) shows this proposed layer separately from existing inbound and outbound authored edges. Setups and counters are clickable for inspection; they are not activated.

## Phase 3 gates

- Review every physical grip, setup and variant; descriptions may under-specify real control. For example, `ch_rollthrough` leaves the current engine in a standing state despite roll-through narration.
- Prioritise small physically intelligible catch/judo/lucha links and meaningful counters; do not auto-generate hundreds of relationships.
- Preserve the existing 336 IDs, four performance styles and frozen 1,200-match reference.
- Compare changes under identical seeds, pairings, card positions and finishes, checking contracted results and repeated-opponent plausibility.
- Keep new move eligibility and background systems behind a **separate** reviewed change. Training tags are not active wrestler training histories.

The 67 unresolved and 49 wrestling-specific proposals in Phase 1 remain open; these 39 records do not imply the rest were classified.
