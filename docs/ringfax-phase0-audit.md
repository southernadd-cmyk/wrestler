# Ringfax — Phase 0 source-of-truth and integration audit

**Status:** Read-only audit and reproducible test baseline. No Ringfax runtime module, interface change, save schema change, match balance change or gameplay effect.

**Goal:** The 23 November 2026 Wrestling Ceefax design proposes a 40×25 teletext news service with results, rankings, insider rumours and fan reactions. Ringfax should use real simulation events to create an evolving history. The service must run as static files and cannot rely on an LLM or server.

## Executive finding

The Office already exposes most of the necessary state, but it **does not have a single universal event bus**. Several systems wrap OfficeGame.applyResult and OfficeGame.endWeek. A new listener on an arbitrary inner wrapper risks seeing incomplete outcomes or duplicating consequences. Ringfax must observe fully committed, deduplicated results and completed weekly updates, and never consume the career PRNG.

## Source-of-truth map

| Ringfax content | Canonical source | Boundary / limitation |
| --- | --- | --- |
| Career time | assets/js/career.js: S.season, S.week, G.abs() | Sixteen weeks per season; no day-by-day dates |
| Match outcome | assets/js/outcome.js: OfficeOutcome.interpret(c, fin) | Separates booked finish, actual outcome, winner and belt eligibility |
| Player results | career.js: S.history | Records cid, season, week, wrestler/opponent IDs, promoter, stars, crowd, booked finish, contract honour and actual outcome; detailed history capped at 40 |
| Result dedupe | career.js: S.resultIds and G.resultRecorded(c) | Prevents replayed contracts from creating another event |
| Season ratings | career.js: S.seasonResults | Lightweight ratings ledger remains after detailed history rolls off; not full match commentary |
| Match execution | assets/js/match-engine.js, sheets.js | Only performed evidence may justify claims about spots and deviations; an intended spot is not proof |
| Match-night consequences | assets/js/night-report.js: OfficeNightReport.capture(s)/build(before,s,results) | Trust, morale, revenue and rank deltas require compatible before/after snapshots |
| Wrestler memory | assets/js/memory.js: S.officeMemory.entries, trust, rivals, processed | Private/subjective evidence, not automatically confirmed public news |
| Rivalries/relationships | assets/js/rivalry.js, relationships.js, territory programmes | Link episodes by IDs; avoid inventing separate disputes for one incident |
| Rival match results | assets/js/territory.js: territory.lastResults | Actual circuit matches, **latest completed week only**; must capture before overwrite |
| Titles | territory.js: territory.titles, titleLog | Title events have week/promotion/division/from/to/how; inaugural crowning is not a match title switch |
| Rankings | territory.js: promotionRank and promotion/division card records | Rankings are scoped by promotion and division, not an unqualified global Top 10 |
| Rival business | assets/js/promotion-business.js: territory.business | Weekly crowd, buzz and finances; do not invent TV ratings or broadcast deals |
| Talent ownership | assets/js/living-world.js, rival-managers.js, approaches.js | Verify source event payloads before Phase 3 publishes deals or rival interest |
| Navigation | assets/js/ui.js: go, openRecord, recordLink | Reuse existing profile/record handling for owned and non-owned wrestlers |
| Deployment | index.html and assets/js, assets/css | No runtime server/build pipeline required |

**Important:** The PDF's sample Mon 23 Nov clock is an aesthetic example, not a simulation date. Do not create fictional weekday timestamps, days-held title statistics, show-wide grades or audience figures where the engine has only week indices or match-level figures.

## Information classes

1. **Confirmed facts:** actual results, belt changes, settled transfers, recorded finances. Each requires a stable source key and relevant week.
2. **Derived analysis:** ranking changes, trends, better/worse performances. Requires a real previous snapshot, defined comparison period and all inputs.
3. **Private evidence:** resentment, trust, morale and behind-the-scenes intentions. Use only as uncertain context, not unquestioned public facts.
4. **Opinion:** fans or pundits may disagree about match quality and significance but not who won.
5. **Rumour:** an attributed hypothesis based on actual cues; not an invented, unfired transfer/injury/result. Later confirmed or refuted only by new real evidence.

The recorded outcome category "booked" does not mean Ringfax should infer the winner from a proposed result string. Reconcile the canonical outcome and final settled history. In a DQ/no-contest, booked and actual outcomes may differ, and the advertised title switch may not happen.

## Proposed event representation (Phase 1; not yet implemented)

~~~json
{
  "version": 1,
  "id": "match:<contract-id>",
  "kind": "match_result",
  "season": 1,
  "week": 4,
  "source": "career.history",
  "sourceId": "<contract-id>",
  "actors": ["<wrestler-id>", "<opponent-id>"],
  "promotionId": "<promotion-id>",
  "visibility": "confirmed",
  "facts": {
    "bookedFinish": "<recorded-code>",
    "actualOutcome": "<recorded-code>",
    "stars": 3.25
  }
}
~~~

This is an illustrative schema, not evidence of a played match. Use stable IDs, not the current display names. Each title event and rival bout also needs a collision-resistant key; some present source ledgers lack their own immutable event ID. Resolve this explicitly rather than silently deduplicating by headline text.

### Safe collection points

- **After match commitment:** observe only after the full outer applyResult chain completes and resultRecorded(c) confirms settlement. Use a processed-source-ID guard. Never change a result, match contract, payout, return value or RNG consumption.
- **After weekly settlement:** observe the completed endWeek wrapper chain, including territory evolution and business. The core career clock may advance before the wider world finishes.
- **On load:** optional Ringfax state must not mutate legacy saves merely to display news. Limited confirmed backfill may use surviving factual records; missing historical evidence means the archive is unavailable.
- **On render:** reading, holding, changing subpages and opening stories must have zero gameplay side effects. Phase 4 can introduce separately gated and deduplicated feedback.

Do not parse the commentary or inbox as an authoritative event stream: text can describe planned actions, hypotheses and different views of the same incident.

## Narrative thread requirements for Phase 2

A thread holds thread ID, actors/promotion IDs, ordered unique source event IDs, opening/latest week, importance, publication cooldown and status (developing, dormant, resolved). Evidence and rumours are stored independently of the chosen copy so changing templates never changes what happened. The proposed 75% dirt-sheet reliability from the design is an editorial direction, **not** permission to fabricate real incidents.

## Page readiness

| Page | Phase | Conditions |
| --- | --- | --- |
| 100 and 101–109: index/news | 1 | Actual results and significant title events; handle weeks without major stories |
| 200: results | 1 | Settled history and lightweight season summaries, labelled appropriately |
| 201: grades | 1 | Recorded match scores; never invent a show-wide grade |
| 202: reports | 2 or 3 | Verified performed match-plan evidence |
| 300: rankings | 1 | Promotion/division-specific, not a universal table |
| 301: movers | 2 | Persist previous snapshots before claiming deltas |
| 302: title picture | 1 or 2 | Current belt state and title log |
| 400–401: insiders | 2 | Private cues with clear uncertainty |
| 500–501: fans | 2 | Subjective response tied to real facts and expectations |
| 600: rival promotions | 3 | Capture real weekly circuit bouts before overwriting |
| 700: business | 3 | Recorded financial figures, crowds and buzz |
| 888: commentary subtitles | 4 optional | Must not disturb the existing match commentary UI |

## Baseline test

Run from repository root:

~~~sh
node tests/ringfax-phase0-baseline.test.cjs
node tests/ringfax-phase0-baseline.test.cjs --json
~~~

The test loads the **same actual JS modules as the browser**, signs a real wrestler, creates one deliberately controlled match-contract fixture, settles it via OfficeGame.applyResult, checks the canonical outcome, confirmed contract ID and season ledger, verifies that applying it twice is inert, advances the actual world week and reads the real circuit, title and business records. It also verifies the existing night-report source remains usable, that observation does not write to the career and that two identical seeded runs produce identical source projections. The JSON option prints a SHA-256 and source coverage counts.

**Test limitation:** the fixture has extra cash and directly inserts a permitted contract. It does not measure booking-market availability, narrative quality, long-career balance, browser layout or player satisfaction. The fingerprint is diagnostic, not a goal to force-match by altering game state.

## Required later regression gates

- Seeded 16-week and 48-week histories; no duplicate story source IDs, wrong winners or unsupported numbers.
- Clean win, protected finish, unplanned DQ, no-contest, genuine title change and belt-retention cases.
- Rival circuit reporting during a week with no player bookings.
- Older saves lacking Ringfax state, missing before-snapshots, archived-away match detail, import/export and mid-story reloads.
- Max-length names and punctuation in the strict 40×25 grid; keyboard, mobile and screen-reader checks.
- No change to existing match tapes, PRNG sequences, finish compliance, ratings, career finances, trust or morale during read-only Phases 0–3.

## Phase 0 exit and next implementation

**This phase delivers:** a source inventory, authority/privacy boundaries, event IDs/observation contract and executable career baseline. No UI or player-facing story service is claimed.

**Phase 1 build order:** (1) pure event adapter with stable source keys; (2) independent deterministic story selection; (3) teletext cell builder and accessible renderer; (4) route integration and pages 100, 101, 200, 201, 300; (5) targeted browser, save and replay tests. Keep the existing post-show report.

**Deferred:** crowd/popularity/morale feedback, fabricated calendar precision, speculative transfer stories without source, wholesale report replacement, and any change to the match engine.
