# Match structures — Phase 5: backstage conversation and contract integration

## Scope

The optional structure chosen in Phase 4 now affects **what Dennis and the wrestlers say**, what the manager can promise, and what is finally signed. It does **not** alter the booked winner, grant free star ratings or bypass the physically valid move graph.

Every structure meeting includes a safety objection opportunity followed by a focused discussion whenever a named move is available. Dennis explains the structure's purpose, the chosen performance plan's trade-offs and the promoter's booked result. A wrestler challenges a **real currently pencilled-in move** for a named dramatic objective. The manager chooses:
- **Keep**: the call stays; the requesting wrestler loses 2 consent.
- **Revise** (only if a legal same-owner alternative exists): the signed call changes; requester +2 consent, partner −1 to account for reworking.
- **Leave open**: the named move is removed, though the objective remains; requester +3 consent, partner −2.

All three responses retain the original finish route and contracted result. They use existing `mood`, `workerConsent`, `opponentConsent` and graph-legality boundaries. Explicit manager selections remain intact until a subsequent **explicit** revision; unsafe moves are handled by the pre-existing safety objection before this discussion.

## Review and persistence

The final review and signed screen clearly distinguish **promoter's booked result**, **agreed finishing method**, **dramatic structure and lead**, and **performance approach**. The selected objective's discussion is surfaced separately. Every result is recorded as an *editorial agreement* in the signed sheet's `structureDiscussion` and full decision log; neither claims that a move was performed. An in-progress `structureTalk` survives the existing match-night autosave. Revisiting the board for edits does not rerun or double-charge the discussion.

Performance-plan cards now explain structural strengths and cautions, including King's Road callbacks, Heel exposure, and the Dominant Ace's credible challenge. These are advice, not hard plan restrictions or hidden weighting.

## Acceptance

`tests/structure-phase5-discussion.test.cjs` runs in the **existing** focused Simulation test workflow and covers the four existing structures, both lead assignments, all five performance plans, deterministic huddle responses, review/reload, identical booked finish and route, real graph results and legacy opt-out. The existing desktop/phone Chromium journey exercises the structured planning and signature. No new CI workflow is added.

## Remaining Phase 5 refinement

A future refinement can make multi-party compromises richer and incorporate persistent wrestler history into who requests a revision, once player testing confirms the first conversation loop is engaging and not overly repetitive. Phase 6 remains the planned commentary and quality assessment work.
