# Match structures — Phase 0 planning-to-execution audit

**Status:** read-only inventory and reproducible baseline; no gameplay, user-interface, rating, save-schema or match-balance changes.  
**Audited base:** main at `eaaee416c3aba66c46dd6d228749ace156d922c0`, 22 November 2026.  
**Purpose:** identify everything the future Match Structure Director must preserve before Phase 1 changes signed plans or match progression.

## Executive finding

The Office currently implements an advanced physically constrained match graph, but its **planning sheet**, **road-agent judgement**, **narrative clock**, **control changes**, **scoring and match strip** all embed a five-stage American singles-match structure.

Changing story-arc weights alone is insufficient. A King's Road contest would still pass through a signed Opening / Pressure / Reversal / Payoff board; the narrative clock would still schedule shine / heat / comeback; and the road agent would reward heat followed by comeback. A proper structure system needs **one canonical signed agreement** with dynamic dramatic objectives, while preserving existing finish and physical rules.

The live side IDs `w` and `f` mean **player's wrestler** and **foe**, *not* babyface and heel. Any new lead/dominance objective must accept either actor; it cannot interpret `w` as face or automatic winner.

## Contract trace: what happens today

| Boundary | Current source of truth | Current behaviour | Phase 1 implication |
|---|---|---|---|
| Contract | `assets/js/booking-office.js`; `OfficeRoom.begin` in `agents-room.js` | Booking supplies worker/opponent, promoter, booked result, stipulated conditions, time, and context | Contract remains the authority on outcome and conditions |
| Performance-plan selection | `agents-room.js:1389–1395, 1489–1499` | Player chooses one of five `OfficeData.PLANS` games; `OfficeSheets.build` seeds the board | Preserve independent five performance plans; structure must be a different choice |
| Dennis's proposed finish | `agents-room.js:1221–1262, 1379–1387` | Agent selects an eligible route *before* called spots; supports-finish suggestions are explicitly conditional | Do not replace finish methods with structure outcomes |
| Running-order board | `agents-room.js:1196–1200, 1275–1282, 1456–1485` | Four hard-coded slots (`SPINE`) plus finish, with suggested and manually chosen moves | Replace four fixed narrative slots only for structure-aware sheets |
| Manual choice preservation | `agents-room.js:1246–1261, 1456–1465` | Changing finish refreshes Dennis's pencil marks but preserves `chosen` manual spots | Structure migration must distinguish chosen, suggested, negotiated and impossible commitments |
| Backstage objections | `agents-room.js:1070–1195, 1284–1295, 1501–1506` | Safety, scouting and rivalry discussion can change moves, minutes, prohibitions or finish route | Recalculate objective feasibility and show conflicts without replaying decisions |
| Dennis's story assessment | `agents-room.js:1296–1320` | Scores heat-then-comeback and payoff ownership as if every bout follows the classic pattern | Replace with per-structure evidence/intent evaluation; do not reward a comeback just because one happened |
| Signed match sheet | `agents-room.js:1540–1569` via `OfficeSheets.build` | Emits v4 signed sheet, `finishRoute`, `nodes`, `window`, `requires`, owner, agreement metadata | Maintain existing shape for legacy saves; add optional versioned dramatic objectives for new sheets |
| Runtime copy | `match-engine.js:4630–4661` | Match receives `o.sheet` and deep-copies it into mutable `M.sheet` | Distinguish immutable agreement from performed execution state; coordinate references used by finisher and planner |
| Match phase/control | `match-engine.js:53–87, 1486–1529, 1733–1795, 4821, 5020–5037` | Five plan-specific clock windows; `Psy.phase` assigns W shine/comeback and F heat; `Graph.canArc` guards timing | Separate elapsed time from dramatic objective and factual control; do not phase-reset a legal prepared attack |
| Sheet move weighting | `sheets.js:256–274` | `boost` favours signed moves within owner/time/dependency windows | A new objective should bias only physically eligible actions and never force a landing |
| Performed evidence | `sheets.js:275–305` | `observe` validates action, side, window and prerequisites, then marks beat achieved/adapted; runner speaks | Keep factual action provenance and avoid counting an attempted move as a landed objective |
| Missed commitments | `sheets.js:306–317` | At window expiry, a missed called beat can reduce `sheetAdj`; source describes reason | Dynamic objective changes need precise 'missed', 'adapted' and 'no longer applicable' rules; no double penalty |
| Phase compliance/crowd | `match-engine.js:5188–5209, 5020–5187` | Script-compliance checks on major timed phase changes; phase IDs influence crowd, spot and quality calculations | Structural loops must *not* trigger repeated compliance rolls or bonus star inflation |
| Finish route | `match-engine.js:5600–5671` | Preferred route chosen only when real conditions hold, otherwise logged fallback preserving the booked outcome | Retain all finish-route requirements, fallback, explicit intervention and signed sheet reconciliation |
| Evidence and UI | `match-engine.js:5672–5707`; `sheets.js:348–382` | Performed graph events, nearfalls, physical tape, signed beat statuses, phase-index flow and match strip | Report factual structure outcomes separately from planned moves; preserve old flow-index readers |
| Career consequences | `assets/js/outcome.js`, `assets/js/career.js`, `assets/js/rivalry.js` | Outcome, promises, trust, programme and memory depend on factual results | Do not award structure-specific career rewards until separate evidence tests are green |

## Structural couplings that require explicit work

1. **Five-stage clock is not cosmetic.** `PHASES`, `Psy.PHASE_ENDS`, `Graph.canArc`, `Graph.advance`, the late finish guard, and crowd/spot multipliers all consume a shared five-stage model. A new Director must retain time-based safety gates while allowing non-linear narrative progression.
2. **Planning has five fixed identities.** `OfficeSheets.build` creates `opening`, `pressure`, `reversal`, `payoff`, `finish`. `OfficeRoom.sheet`, `story`, `boardView`, negotiated slot changes and `OfficeSheets.STRIP_NAME` reference them. Replacing the board alone would leave execution and scoring inconsistent.
3. **Wrestler role is not moral alignment.** Neither W/F nor the booked win/loss implies face/heel. A heel may be the player's wrestler, the dominant ace may be the opponent, and a protected loss may require the loser to control the finish build.
4. **The signed sheet is already mutable at runtime.** `OfficeMatch.create` copies `o.sheet` into `M.sheet`, which records statuses and performed finish. Some route selection still reads `M.o.sheet`. Phase 1 must explicitly define how a pristine agreed template and runtime observation coexist.
5. **A planned spot and an objective are not equivalent.** A single legal action can satisfy a called spot; dominance, chess-match escalation or strategic evasion may require multiple time-ordered performed actions. Objective success needs evidence predicates, not generic text.
6. **Finish routes are conditional.** A top-rope finish, limb finish, outlasting finish and reversal finish require witnessed preconditions. No structure can promise that a spot will be physically available when the bell is due.
7. **Unplanned drama already exists.** Safety objections, changed time, mid-match decisions, DQ and audibles may invalidate the original route. Do not erase the signed structure or retroactively rewrite intended objectives.
8. **Commentary, scores and UI consume phase IDs.** Introducing new objective IDs directly into the legacy `flow` index or `CROWD_MUL` would break displays and likely distort quality. Use an explicit mapping/parallel telemetry field until every reader is migrated.

## Baseline fixture

Run from the repository root:

```bash
node tests/structure-planning-baseline.test.cjs
node tests/structure-planning-baseline.test.cjs --json
```

This read-only test uses **the actual shipped modules** via `tests/_source.cjs` and executes 120 complete signed matches: five performance plans × three lengths (8, 12, 18 minutes) × four booked outcomes (clean win, dirty win, protected loss, clean loss) × two matched seeded fixtures. It uses the real `OfficeRoom.begin` → `OfficeRoom.act` → signed v4 sheet → `OfficeMatch.create/next/resolve` → `OfficeSheets.report` path.

To make the comparison reproducible, incidental backstage scenes are suppressed **only in this reference fixture**. Existing `tests/pre-match-integration.test.cjs` tests negotiated scenes, locked finishes, signed changes and in-progress review instead. This is a controlled baseline, not a representative sample of all real career situations.

The output records, per performance plan:

- Actual graph event and narrative-arc transitions, along with phase-clock occupancy.
- Positive/negative/neutral **momentum ticks** (not a direct measurement of landed-offence share).
- Achieved, adapted and missed agreed beats, plus finish-route fallbacks.
- Mean match quality/stars, nearfalls, compliance checks and overall script adherence.
- Booked versus exceptional outcomes, and a SHA-256 fingerprint of event and agreement summaries.

**Interpretation warning:** no baseline frequency is a target quota. Distinct new structures should be differentiated by actual events and their narrative functions, not forced to equalise move counts or star ratings. Inspect individual tapes before claiming an apparent improvement.

**Before/after comparison rule:** compare the same workers, foe, finish, seed, duration, plan and injury/consent context. Keep this baseline frozen; any accepted changes to baseline semantics should be recorded separately with a new version and review, not automatically overwrite reference values.

## Phase 1 design contract (not implemented in Phase 0)

The following acceptance criteria apply before modifying live match structures:

1. **Optional versioned structure data** on newly signed sheets. A missing structure field uses the exact existing five-stage path, with unchanged RNG consumption and no migration requirement.
2. **Contract immutability:** winner and finish constraints remain booker-owned; only existing explicit manager/referee/legal overrides can change the actual outcome.
3. **Separate agreement and execution:** author a stable ID for each dramatic objective and optional named called spot. Preserve signed intent; record actual evidence in a separate append-only or compact execution ledger.
4. **Ownership and windows:** objective definitions specify actor (`w`, `f`, `either`), event predicates, dependencies, optional order/timing guidance, permitted alternatives and expiration/fallback policy.
5. **Physical legality comes first:** Structure Director supplies weights/intent; the existing graph remains responsible for positioning, stamina, attempt results, earned nearfalls and safe/legal finish resolution.
6. **Editing respects provenance:** any structure/finish revision keeps compatible *manually chosen* spots, flags incompatible ones for an explicit decision, and never replays prior backstage negotiations or double-applies mood changes.
7. **One scoring pathway:** prevent duplicate rating penalties for the same failed spot/objective; adaptations do not automatically equal bad execution; structural callbacks only count if actual earlier actions are witnessed.
8. **One compliance boundary:** distinguish actual disobedience of signed commitments from tactical improvisation and graph counters; revisiting a dramatic objective is not automatically a fresh compliance roll.
9. **Save-safe rollout:** old signed sheets and partial matches resume; new structure state is JSON serialisable; fixed-seed legacy event tapes remain identical when the feature is disabled.
10. **Readable UI:** Dennis's advice, the running-order slots, the live phase label, commentary and the final match strip must all agree about what the wrestlers are trying to do.

## Existing regressions to preserve

- `tests/pre-match-integration.test.cjs`: signed board, finish-first revision, manual spot preservation, backstage time cut, negotiated locked finish, real match performance and fallbacks.
- `tests/match-phase-pacing.test.cjs`: timed phases, early-arc guards, legacy mid-match repair and deliberate shortened match.
- `tests/earned-nearfall.test.cjs` and `tests/cross-style-earned-nearfall.test.cjs`: credible legal nearfalls.
- `tests/phase10-scripted-spots.test.cjs`, `tests/physical-continuity.test.cjs`, `tests/safe-scripted-spot.test.cjs`: position/risk/attempt integrity.
- `tests/commentary-memory.test.cjs`: event-backed calls and repeated commentary.
- `tests/save-integrity.test.cjs`, `tests/simulation-consistency.test.cjs`: persistence and deterministic replay.
- `tests/graph-lab-match-review.test.cjs` and `tools/graph-lab/match-review.cjs`: independent seeded graph/technique checks.

## Scope and merge policy

Phase 0 adds only this audit, a read-only deterministic fixture, and a **single test invocation in the existing focused PR job**. It does not add a workflow or change any player-facing behaviour.

Require the focused test and existing PR checks to pass. Do not merge automatically. Phase 1 begins with explicit signed-sheet contracts and a compatibility adapter, not a superficial new dropdown.
