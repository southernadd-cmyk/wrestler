# Match structures — Phase 3 live Director (experimental)

**Status: opt-in draft; not enabled in the career interface.**

## Execution boundary

A Phase 2 meeting may sign a validated `structurePlan` with dramatic objectives, timing, actor roles, prerequisites, optional named moves and an agreed finishing route. Phase 3 activates it only when the match runner passes `structureExecution:true` to `OfficeMatch.create`, along with that valid signed sheet. Old saves and metadata-only matches are unchanged. Invalid activation fails closed.

The original signed agreement remains editorial and immutable. `M.structureDirector` is a separate, JSON-safe performed-evidence ledger. `OfficeMatch.structureReport(M)` and `M.final.structure` expose the observed results, not newly invented post-match facts.

## Actual match behaviour

The director guides graph arc selection and legal, physically eligible moves by objective. The signed named call is a higher-weight preference, never a guaranteed landing. Real `Graph.apply` events can satisfy objective predicates only if they actually appear on the performed tape with matching actor, intent, time window and prerequisites. The director never grants a free move, a phantom control switch, stars, a cover or an override of the booked winner and finish rules.

Some objectives need multiple distinct landed actions; the King's Road tactical callback must reuse an earlier **performed** exchange; evasion and illegal shortcuts require a real relevant graph action. Missed commitments remain recorded, and later objectives may be marked adapted rather than rewriting the signed sheet.

## Regression boundaries and quality checks

The **existing** Simulation tests PR job includes Phase 0's 120-match baseline fingerprint (`18391d10abb5b86aca4b43834549a5ddcf9cf2ee15d915af92cda5aa3b1946b6`), Phase 1's 13 exact legacy/metadata-only comparisons, Phase 2's 40 planning cases, and Phase 3's 40 signed cases with 16 live structured bouts. It also tests no fabricated event credit, finish conservation, independent roles, and deterministic mid-match save/restore.

The Phase 3 test prints earned and missed objective counts by structure. **Green CI alone is not sufficient**: inspect actual per-structure attainment and sample tapes before merging or exposing this option. No new GitHub Actions workflow was created.

Player-facing structure selection, structural scoring or career rewards, and a redesigned dynamic structure visualization remain out of scope until execution evidence is credible.
