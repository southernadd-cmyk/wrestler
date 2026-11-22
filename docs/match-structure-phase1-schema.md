# Match structures — Phase 1: versioned signed agreement

**Status:** compatibility-only groundwork, not a player-facing structure system.

Phase 0: [planning-to-execution audit](match-structure-phase0-audit.md).

## What Phase 1 does

Introduces `OfficeSheets.STRUCTURES` in `assets/js/sheets.js`, with a serialisable, validated **version 1 structure agreement** that can optionally accompany the existing signed **v4 match sheet**. The sheet's existing `game`, `nodes`, `finish`, `finishRoute`, consent, revisions and limits remain unchanged.

The existing `OfficeRoom.begin(contract,w,f,p,opts)` accepts a **programmatic-only** opt-in `opts.structure` selection. It remains out of the player UI until Phase 2/3 implementation makes the new objective system executable. Without this option, no extra property is created on the room or signed sheet, and the match runs the exact legacy path.

**Phase 1 does not alter the story/action graph, timed phases, control assignments, move weights, finish routes, commentary, score calculation, UI or save schema.** A non-default structure agreement is deliberately marked `execution: "metadata_only"` and must not be presented to users as a differently simulated match.

## Example agreement

```js
const st = OfficeRoom.begin(contract, wrestler, foe, promoter, {
  structure: { id: "chickenshit_heel", lead: "f" }
});
// Continue the existing plan → board → scene → review → curtain flow;
// st.sheet includes a separate structure agreement after signing.
```

The signed sheet receives a new optional field:

```json
{
  "structure": {
    "version": 1,
    "id": "chickenshit_heel",
    "execution": "metadata_only",
    "roles": { "lead": "f", "other": "w" },
    "objectives": [
      {
        "id": "avoid_confrontation",
        "title": "Avoid a fair confrontation",
        "intent": "evasion",
        "actor": "f",
        "window": [0, 0.35],
        "requires": [],
        "commitment": "landmark"
      }
    ]
  }
}
```

The example displays only the first objective; the actual validator requires the complete four-objective template. Objective `intent` and `window` are **declarative metadata**, not implemented success conditions or newly scheduled actions.

### APIs

- `OfficeSheets.STRUCTURES.catalogue()` returns copied display metadata for the four initial candidates: Classic American, King's Road, Chickenshit Heel and Dominant Ace.
- `create({id,lead})` returns an independently serialisable structure agreement. Non-legacy candidates require an explicit `lead: "w" | "f"`; this is a dramatic casting decision, **not** automatically the player, winner or babyface.
- `validate(structure)` returns error strings for unsupported versions, malformed roles, duplicate or out-of-order objectives, invalid windows, unexpected fields, or unrecognised structures. It does not silently reinterpret an unknown future agreement.
- `attach(signedSheet, selectionOrAgreement)` returns a new signed-sheet wrapper with opt-in metadata, preserving the existing finish and called move nodes.
- `read(sheet)` returns `mode: "legacy"` for an old sheet, `mode: "metadata_only"` for a valid v1 agreement, or `mode: "unsupported"` with errors for invalid/future data. It never rewrites the sheet.

### Role and safety rules

`w` and `f` remain **player's worker** and **foe**. The structure's `lead` is assigned separately, with `other` being the opposite side. This enables, for example, a heel controlled by the player or a dominant ace on the opposition side.

A structure agreement must not include `winner`, `finish`, `status`, `actual`, `at` or other executable/outcome fields; those are properties of the booking, the independently agreed finishing route, or the future performed-event ledger.

The signed v4 nodes continue to contain physically constrained called spots and the contracted finish. Phase 2 will design mappings between specific called moves and dramatic objectives, but must not allow an objective to confer a free move landing, finish or star bonus.

## Verification

`tests/structure-contracts.test.cjs` exercises:

- All four templates with either actor cast as lead; independent of the five performance plans.
- JSON round trips and older sheets without a `structure` field.
- Invalid versions, mutated objectives, illegal actor/role assignments and unexpected outcome fields.
- Real backstage signing, manual spot selection, alternate finishing route, second review and save/reload of a meeting.
- **13 paired full-match comparisons:** opt-in structure metadata against legacy, with identical contracts, wrestlers, match plans, seeds, expected moves and finishing methods; compare complete event tape, graph history, commentary, marks, scores, sheet reporting and final results.
- Mid-match JSON save/restore with opt-in structure present.

The Phase 0 120-bout legacy test remains in the **same existing focused GitHub Actions job**, alongside the new test; no workflows were added. The original Phase 0 reference fingerprint recorded from its successful PR was:

`18391d10abb5b86aca4b43834549a5ddcf9cf2ee15d915af92cda5aa3b1946b6`

If this fingerprint changes for an unchanged seed set, investigate the first differing event before accepting any unrelated changes. It is a compatibility reference, not a match-quality target.

## Phase 2 boundaries

Phase 2 must convert descriptive structure objectives into **planned evidence predicates and structure-specific running-order commitments**, with a clear upgrade of the `execution` mode/version. It must not simply change `execution` to `active` while retaining the current Opening / Pressure / Reversal / Payoff spine.

The live Director, dynamic match-plan UI, actual objective state/causality, structural scoring and commentary arrive in later phases. Legacy matches must continue to run without a new structure field or extra RNG draws.
