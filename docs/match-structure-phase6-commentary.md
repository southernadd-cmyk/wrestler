# Match Structures — Phase 6: commentary, evidence and match quality

## What changes
The active Match Structure Director now provides *colour commentary grounded in actual graph actions*. The four existing structures each have distinct language for their four dramatic objectives. At the bell, the road agent names the agreed structure as an intention. During the match, an objective announcement is emitted **only after** the Director validates a performed action; if the objective window expires, the announcer says it failed rather than inventing a move. An objective is announced at most once, and an in-progress save retains its announcement cursor.

The general Vic chatter excludes traditional shine/heat/comeback labels when an alternative structure is active; those structures receive specific objective commentary instead. The post-match crowd-flow display retains the same numerical data but labels its generic clock slices “Opening exchanges”, “Early contest”, etc., not American dramatic beats.

## Three different measures
The post-match report keeps three concepts separate:

1. **Plan adherence:** How many named moves were genuinely performed by their agreed wrestler *in the intended objective window*. Open objectives are not failures. A different performed move can satisfy an objective without falsely satisfying its named call.
2. **Structural coherence:** How many of the four objectives were achieved/adapted/missed, as adjudicated from actual graph-event evidence. No objective becomes completed solely because of a signed backstage plan or an attempted move.
3. **Execution quality:** The already-calculated match stars, botches and actual psychology contribution. This code is **read-only**. No structure multiplier, automatic stars, false crowd pop or new reward.

The signed finish and booked winner remain authoritative. These results are stored as `final.structureAssessment` and in career history, alongside `final.structure` and the existing `starParts`.

## Backward compatibility and testing
- Old and traditional matches get no new structure commentary or structure assessment.
- The commentary cursor is JSON-saveable. On restoration from a Phase 4/5 save without the cursor, previously resolved objectives are marked as already spoken rather than announced again; future evidence can still be narrated.
- Phase 0 fingerprint and existing Phase 1–5 contract suites remain part of the same test workflow.
- `tests/structure-phase6-commentary.test.cjs` runs structured matches across all four structures, both leads and two performance plans. It verifies actual milestone evidence, uniqueness, save/restore, report arithmetic and star-rating isolation.
- Browser smoke tests continue covering the structure selection and signed backstage negotiation on desktop and mobile. No new CI workflow is introduced.

## Follow-on scope
Phase 7 should examine distribution, repetition and over-determinism across larger batches (particularly Chickenshit Heel) before any numerical tuning. Nothing in Phase 6 is itself a balance change.
