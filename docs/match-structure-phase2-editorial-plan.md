# Match Structures — Phase 2 editorial planning

**Scope:** Programmatic opt-in to a dynamic backstage running order; no change to the live Match Structure Director, physics, action selection, ratings, commentary, or default player UX.

## Explicit opt-in and legacy preservation

Phase 1 already supports adding a structure *as metadata* with `OfficeRoom.begin(...,{structure:{id,lead}})`. That path must remain byte-for-byte compatible with the fixed four-beat planning board and Phase 0 match baseline.

Phase 2's new planner is **separate and deliberately opt-in**:

```js
const meeting = OfficeRoom.begin(contract, worker, foe, promoter, {
  structure: { id: "kings_road", lead: "f" },
  structurePlanning: true
});
```

The new `structurePlanning` flag is never passed by the live game UI. This phase does not make a King's Road match playable. It creates and validates an honest *intended* King's Road running order that Phase 3 can later consume.

## What changes in the opt-in backstage experience

- Four dramatic-objective cards replace the four hard-coded American `opening/pressure/reversal/payoff` slots. The separate finish route remains the contracted outcome.
- Each objective has an explicit dramatic actor, stable ID, signed timing guidance, narrative intent, prerequisites, and a genuine physical move candidate based on the existing action graph. Either side may be cast as the lead.
- Dennis offers eligible, physically plausible named move suggestions. Players may select a different real move or leave an objective open to be called in the ring. An objective is not the same as a landed action.
- Finish route changes regenerate Dennis's unchosen suggestions but never discard the player's chosen move or deliberate "call it live" decision.
- Selected named moves are retained through backstage incidents. When they become forbidden or unsafe, the revision is explicit and the final review blocks approval until a legal alternative is selected or the objective is left open.
- An opt-in structure-specific objections scene allows the wrestler to request a safer move, leave the physical move open, or register reservations if the move is legal.
- Dennis's review judges **structural intent and readiness**, not whether an obligatory American heat/comeback beat was scripted. It does not award structure ratings or predict success.
- The completed signed sheet carries a separate validated `structurePlan` with intended objectives, optional named calls and their provenance, legal alternatives, objections, and unchanged agreed `finishRoute`.

## Crucial runtime boundary

The new `structurePlan` is an **editorial agreement**, not a series of performed graph events.

Phase 2 signed sheets retain the versioned `structure` field with `execution: "metadata_only"`. For opt-in dynamic planning, the existing runtime's `nodes` list is reduced to its **real contracted finish**; it is *not* filled with pretend American shine/heat/comeback spots or dynamic objectives that the legacy match graph cannot fulfil. The actual match still uses the legacy five-phase engine, which cannot yet guarantee the intended dramatic layout.

`OfficeSheets.STRUCTURES.validatePlan(plan,structure,signedSheet)` verifies identity, roles, dependencies, timing, named action legality at the metadata level, commitment provenance, distinct unfinished intentions, and unchanged finish route. `readPlan(sheet)` returns `absent`, `editorial`, or `unsupported`. It always returns copies rather than mutating signed original intent.

Phase 3 must design an executable director with event-evidence predicates and separate actual-event ledgers; it must not simply start crediting `structurePlan` as performed.

## Tests and merge gates

The new `tests/structure-dynamic-planner.test.cjs` exercises all four templates × both casting options × five performance plans (40 signed agreements), repeated review and save/restore, explicit manual moves and finish-route preservation, safety bans, and real completed booked outcomes.

The untouched Phase 0 baseline and Phase 1 legacy-versus-metadata parity suites remain in the same focused CI job. A failure there is a blocker. No extra workflows should be created or heavyweight matrices triggered on every commit.

**Do not merge Phase 2 while the existing main-branch full-suite failures are unresolved.** Those failures are tracked separately in PR #190 and do not originate from alternative match-structure code.
