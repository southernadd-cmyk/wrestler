# Repeated rivalry automation — what the tests prove

The Office's [Phase 4 wrestler training backgrounds](phase4-training-backgrounds.md) are now tested through **five consecutive fictional encounters between each of four fixed rival pairings**. This is an *audit*, not an AI evaluator of whether a wrestling show is enjoyable.

## What runs

Run `node tools/repeated-rivalry-audit.cjs` to generate the full Markdown report, or `node tools/repeated-rivalry-audit.cjs --json` for machine-readable results. `--quick` runs only the first rivalry's first two meetings.

The audit reads the real shipped `OfficeMatch`, its roster, mechanics registry and immutable schooling map. It uses four contrasts:

| Pair | Technical contrast | Match plan |
| --- | --- | --- |
| Juno Stark vs Rex Titan | Catch vs general ringcraft | Technical |
| Bao Merrick vs Theo Voss | Judo vs catch | Technical |
| Nico Vega vs Rex Titan | Lucha vs general ringcraft | Spectacle |
| Marisol Tide vs Theo Voss | Hybrid catch/lucha vs catch | Story |

Each pair has **five fixed seeds and a fixed sequence of booked results**. Rivalry heat increases over the five meetings and the simulation supplies a simple prior-meeting reminder to exercise the match engine's existing feud context. This is a **synthetic controlled fixture**, not proof that career weeks, real negotiated match plans or saved memory automatically evolve. No saves are written.

Each encounter is run twice, changing **only** whether Phase 4 background bonuses apply. This neutral-school ablation is a *current-version* counterfactual, not a claim to recreate the Phase 3 binary. It makes it possible to distinguish genuine schooling influence from ordinary changes caused by different seeds or rising feud heat.

## Measurements

The automated report includes a per-meeting outcome, seed, star rating, distinct actions, new action IDs, **new three-action chains**, counters and finish route. For each rivalry it also reports the union of distinct moves, mean pairwise three-action overlap, the most repeated triples, aggregate school-linked move use and the count of matches whose event sequences changed when backgrounds were enabled.

**Hard errors (CI fails):** incomplete match, wrong contracted outcome, unknown node events, moves before their time eligibility, invalid game graph/technique map, or a completely identical match action sequence across two *different* seeds within one rivalry.

**Review warnings (CI remains green):** an unchanged five-match sequence under the schooling A/B comparison, no school-linked moves in a sample, no novel three-move combinations in a later encounter, or elevated (35% or more) pairwise three-action overlap. These heuristics are triage prompts rather than universal indicators of bad wrestling.

When evaluating variety, pay attention to the *scale of the match*: a safe eight-minute bout and a long main event may properly contain different numbers of moves; a recurring signature is sometimes **good storytelling**. We intentionally avoid failing CI because a wrestler uses their trademark twice.

## Schedule and checks

[`.github/workflows/repeated-rivalries.yml`](../.github/workflows/repeated-rivalries.yml) runs at **07:33 UTC every Tuesday**, on a relevant match-engine, roster or schooling PR, on relevant main-branch pushes, and via manual GitHub Actions dispatch. The output is a compact GitHub Actions job summary (no uploaded growing log, no background service or third-party API cost).

[`tests/repeated-rivalry-audit.test.cjs`](../tests/repeated-rivalry-audit.test.cjs) protects the novelty maths, overlap formula, duplicate-sequence detection, and repeatability with the actual engine. It also runs in the normal Node regression suite.

The original [fixed 1,200-match pre-expansion baseline](../tools/graph-lab/baselines/reference-v1.json) is preserved and its Monday automation is still independent; those tests measure broad simulation regressions, while this suite measures **five encounters with the same opponents**.

## What still needs human eyes

Five matches can show *variation* but do not, by themselves, demonstrate logical remembered callbacks, believable injuries and rival escalation, appropriate commentary, or meaningful agent-room decisions. This audit does **not** follow a real five-week career, persist relationship state, or guarantee narrative evolution. That needs a separate integrated playthrough and review of actual commentary tapes, not a made-up automatic "believability score".
