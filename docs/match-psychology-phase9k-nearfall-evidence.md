# Phase 9K — Earned near-fall drama and Safe move-risk evidence

## Design intent

The merged Phase 9I match Director can offer distinct plan-specific finishing routes. The Phase 9J evidence trace showed that Safe wrestling legitimately produces real **wristlock → La Magistral** cradles and crucifix-pin kick-outs, but those are excluded from a booked final *finishing runway*, correctly. **Near-fall drama and finish construction are different phenomena.** Counting cradles as finishes would misstate the result, over-boost the reported finishing rate and undermine the requirement for a real closing impact.

Phase 9K introduces an independent **read-only, non-scoring** `nearfallDrama` evidence report into the match's final structured summary. No narration, action pool, safety rule, ratings, result, plan, RNG, or nearfall scheduling changes.

## Evidentiary kinds

- **`authored_kickout`** — actually executed graph node with an explicit authored two-count/nearfall marker, confirmed owner, other wrestler down in-ring, landed (not blocked/countered), and genuine mat landing. Includes legal cradles and rana-pin kick-outs.
- **`earned_cover`** — existing `scheduled_nearfall` marked `earned` whose exact recorded source move, timestamp and owner match a genuinely performed in-ring mat grounding action no more than 30 seconds before the count. A source reference with no landing cannot be credited.
- *Not credited*: generic standalone `near_kickout` that lacks such proof; submission escapes; unearned or legacy scheduled counts with no verifiable source; false/missing source references; countered or blocked pin attempts; scripted finishing narration. These may still have valid in-game dramatic consequences, but this report must not invent the requisite action evidence.

The report includes `version:1`, `total`, `byKind`, `bySide` and independently traceable `moments`. It is available as `OfficeMatch.GRAPH.nearfallDrama(match)` and `match.final.nearfallDrama`. The **existing `finishingRunway` logic is unchanged** and remains exclusive to Director-active clean matches with actual authored setup and impact plus unbroken winner control. No extra star credit.

## Safe is not a prohibition of all aerial wrestling

The merged Safe match plan explicitly limits **scripted spectacle**: only a well-trained diving elbow is permitted in the `spot` call path; balcony dives are entirely disabled. Its **ordinary physical wrestling graph** still permits some risk-tagged moves with a strong selection penalty (`0.1`), e.g. `top_follow`, `sp_avalanche_german`, and `sp_spider`.

The Phase 9J diagnostic found **four risk-tagged actions in 48 clean Safe matches in the last three minutes** (two top-follow, two superplexes), **zero late scripted-spot attempts**, zero late scripted-spot botches. This result must not be equated with a Safe scripted-spot restriction failure. Phase 9K reports actual ordinary risk and superplex actions separately from explicit scripted spot attempts in the existing 960-bout matched audit.

A hard restriction on the entire ordinary superplex family would be **a separate gameplay and player-choice decision**, not a silent observability patch. Do not hard-ban risk-tagged moves here.

## Verification requirements

- Exact saved/restored nearfall evidence; zero RNG and event mutation on read.
- No forged source, blocked pin, submission escape or bare nearfall without real graph evidence.
- Finished match summary contains nearfall evidence without misclassifying the booked finishing runway.
- Audit 480 Director-active + 480 metadata-only matches, by plan and by structure: genuine authored kickouts, real earned scheduled covers, matches with both nearfalls and runways, Safe ordinary risk events versus scheduled scripted spots.
- Preserve booked outcomes, zero unexplained late control losses, no new workflow, no new ratings or move balancing.
- Merge only after CI and explicit approval.
