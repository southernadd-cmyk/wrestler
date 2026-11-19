# Five-week real-career rivalry continuity audit

This test extends the [40-bout isolated repeated-rivalry audit](repeated-rivalry-automation.md). Unlike the earlier five-match seeded sampling, it uses a **single persistent career**, takes actual match results through the game's career, rivalry, memory and promo systems, advances the calendar, and reloads from browser-style localStorage after each encounter.

## What it exercises

The audit signs Rex Titan and plays five real engine matches against Silas Rush, using a fixed series of result contracts (clean loss, dirty win, protected loss, clean loss, clean win). **Only the match contracts are fixtures:** they are inserted on the card so the same opponents definitely meet in five consecutive weeks. Offers, booking negotiations and their availability rules are not tested.

It uses the production scripts from the headless world harness and exercises:

- `OfficeStory.Graph.begin`: earlier career results, existing rivalry records, real evidence-backed cases, no invented first-match facts, and a history-aware public introduction;
- `OfficeMatch`: five real full-length bouts with booked outcomes and prior memories passed into live commentary;
- `OfficeGame.applyResult`: actual money/heat/feud/morale outcomes, a new season result, and exact-once result handling;
- `OfficeRivalry`: each prior meeting is stored under the real match ID and earlier cited facts refer only to recorded events;
- `OfficeMemory`: a clean defeat leads to remembered humiliation, a real backstage debrief that is answered, subsequent memory recall and normal trust consequences;
- `OfficeGame.save`/`load`: saved rivalry meetings, feud heat and memories survive actual JSON persistence on *each* week;
- `OfficeGame.endWeek`: real weekly calendar progression, finances, training, world and other registered week hooks.

The test does not modify production code, game saves, or the frozen match graph baseline. It runs entirely in isolated in-memory test stores.

## Checks, not invented narrative scores

**Hard failures:** a match fails to complete, the booked winner/finish is contradicted, previous rivalry entries vanish, a real promo cites a match ID not in the stored ledger, promo history shows a fabricated earlier encounter, a recorded result is duplicated, memory fails to persist or reach later commentary, a save/reload loses facts, or the career week fails to advance.

**Review prompts:** a later promo has no evidence-based case despite having match history. This may be legitimate, so it is reported rather than failed.

A successful run demonstrates factual continuity through the existing systems, not that the audience will find the prose emotionally believable. The script does not evaluate actual interactive UI choices, manual agent-room negotiations, organic generated offers, live rival-world consequences or rich after-show angles. Those require separate full-game journeys.

## Use

- `node tools/career-continuity-audit.cjs`: compact five-meeting GitHub-friendly Markdown report
- `node tools/career-continuity-audit.cjs --json`: detailed structured record of each week
- `node tests/career-continuity-audit.test.cjs`: deterministic replay and stricter assertions (runs twice to confirm repeatability)

[`.github/workflows/career-continuity.yml`](../.github/workflows/career-continuity.yml) runs every **Wednesday at 07:43 UTC**, on relevant career/match changes to pull requests or main, or manually through GitHub Actions. The report is published in the job summary. No large archival artifacts or external APIs are required.

The frozen 1,200-match baseline and Tuesday isolated rivalry variety tests remain independent.
