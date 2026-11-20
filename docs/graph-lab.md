# The Office — Graph Lab (live through v0.5.0)

> **v0.5 release status:** Graph Lab measures the live v0.5 match graph. Its frozen v1 baseline and original Phase 0 design notes are historical. See the [current release](v0.5-release.md) and the [completed final technique audit](reports/v04-final-106-technique-audit.md).

A read-only instrument for the **actual** browser match engine. It introduces no new wrestling styles, moves, training rules or career-save mutations. This is the diagnostic baseline to measure future Fight Encyclopedia-inspired graph changes.

## Workbench layout (redesigned)

The Graph Lab has a production-run-sheet identity, not a general-purpose analytics dashboard. It uses condensed sans-serif headings, high-contrast paper/ink/rust colours and strong typographic hierarchy; no serif body type, decorative numbered tiles or stacked metric cards. The visual principles were adapted from the publicly available [taste-skill](https://github.com/leonxlnx/taste-skill), [Claude Design Skillstack](https://github.com/freshtechbro/claudedesignskills) and [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) guidance.

The four workspaces are accessible tabs with Left/Right/Home/End keyboard navigation and stable deep links (`#run`, `#tape`, `#atlas`, `#compare`):

- **Run sheet:** configure seeded bouts and read the sampled actions, links, families, finish routes and ratings. Family/action frequency strips represent observed counts.
- **Tape review:** inspect the first bout's events in time order; the 24-band activity chart contains *real event counts*, and selecting an occupied band reveals its first event. Filter by actions, counters, blocks or other.
- **Move atlas:** search the existing graph and inspect authored inbound/outbound links, weights, physical constraints and immediate neighbourhoods.
- **Baselines:** load a saved JSON report locally and compare it against the current run.

Navigation changes visibility only; it does not re-run matches or re-initialise the engine. Screens adapt at 1440/1280/768/390/375px and respect reduced motion. The page still does not read or write career storage. **Visual redesign does not add technique families, alter graph weighting, or implement new training styles.**

## Open the lab

Serve the repository root with a simple static server, then open:

- `http://localhost:8765/tools/graph-lab/` (local server rooted at the repository)
- Once merged into `main`: `https://southernadd-cmyk.github.io/wrestler/tools/graph-lab/`

Do not open directly from `file://`. The lab uses the repository's real `data.js`, `roster-registry.js`, `match-engine.js`, and its own small `core.js`. It does not load `career.js`, `ui.js`, local storage, or any external runtime dependency. It does not appear in normal career navigation.

## New v0.5 match-review scenarios

The **Run sheet** now has six repeatable review presets: technical grappling, power/brawl, aerial spectacle, comeback storytelling, cautious opener and a repeated Juno/Rex rivalry. Choose one, press **Load test settings**, then **Run simulation**. Each loads 100 real seeded bouts into the existing, read-only match simulation; you can change any setting before starting. The tape, graph, counter, physical validation and export panels remain unchanged.

Run the same presets headlessly:

```sh
node tools/graph-lab/match-review.cjs 100
node tools/graph-lab/match-review.cjs 5 --json
node tests/graph-lab-match-review.test.cjs
```

The [Graph Lab match review workflow](../.github/workflows/graph-lab-match-review.yml) runs all 600 bouts on related pull requests and on manual dispatch; its Markdown report is published in the GitHub Actions job summary. It checks actual match completion, engine legality, deterministic scenarios, observed authored move use and nearfall/counter evidence. A match-quality claim also needs a human review of the **Tape review** output.

**Important:** v0.5's 325 authored technique descriptions are editorial metadata, not new executable moves. Fifteen remaining catalogue events are intentionally classified as crowd, timing, story or performance beats. These remain playable. The existing match engine is not changed by the Lab or this metadata audit.

## What it measures

The lab exposes graph validation, all authored nodes and edges, reachability from actual arc/style/profile entry points, and a searchable local-neighbourhood view. Incoming and outgoing edges are taken directly from `OfficeMatch.GRAPH.A`, including each authored weight.

For a seeded simulation, it runs `OfficeMatch.create()` and `OfficeMatch.next()`, automatically resolving manager interrupts with a consistent default choice, and observes `M.graph.events` and `M.final`.

- **Node coverage** = distinct authored action nodes observed / all authored action nodes.
- **Observed authored-edge coverage** = distinct consecutive action-event pairs that match an `A[source].next` edge / all authored directed edges. This is intentionally a **conservative proxy**, not a complete instrument of the engine's private edge picker. Arc-entry selections that jump to another node do not count as an authored edge, and matches can contain legal non-edge adjacencies.
- **Family and node frequency** comes from real event records, not theoretical weights.
- **Counters and blocks** count event IDs with `counterOf` and `blockOf` metadata.
- **Recurring triplets** are adjacent observed action events within each bout.
- **Mean stars, finish routes and trace** come from actual match results.

A low observed-edge percentage is therefore not proof of a broken graph. Match quality and plausibility require manual replay, and cross-build comparisons require matching configurations and seeds.

## Baselines

The UI offers a single pairing or rotating roster, 1/10/100/500/1000 bouts, plan, result, card slot and first seed. Each subsequent bout uses `seed + 37 * index`. It can stop after the current bout and export a JSON snapshot. Upload a previous snapshot on the same page to compare metrics. No baseline is persisted or uploaded to a service.

For headless repeatable snapshots:

```sh
node tools/graph-baseline.cjs --count 100 --rotation roster > baseline.json
node tools/graph-baseline.cjs --count 1000 --rotation roster --full > detailed-baseline.json
node tools/graph-baseline.cjs --count 100 --rotation fixed --wid juno --rid rex --plan technical > juno-rex.json
node tests/graph-lab.test.cjs
npm test
```

The JSON files are local development artifacts. Do not commit large baseline exports unless there is a clear reason.

## Automated frozen baselines

The first approved **pre-expansion reference** is tracked at [`tools/graph-lab/baselines/reference-v1.json`](../tools/graph-lab/baselines/reference-v1.json). It is a versioned snapshot of **1,200 real simulated matches**. Four 250-bout roster scenarios exercise Story, Technical, Brawl and Spot-fest, while two 100-bout fixed matchups replay Juno Stark / Rex Titan and Bao Merrick / Theo Voss. The initial graph has 969 nodes, 6,152 authored links, and 25 arcs. The reference is intentionally never auto-updated.

**Automation:** [`.github/workflows/graph-baselines.yml`](../.github/workflows/graph-baselines.yml) runs every Monday at **07:17 UTC**, on changes to the match-engine/data/baseline code in pull requests and on `main`, and whenever manually dispatched from the GitHub Actions tab. Each run regenerates the same six scenarios and publishes a side-by-side report in the **GitHub Actions job summary**. It makes no changes to the branch, does not upload artifacts or append historical JSON, and needs no extra secrets or API credits.

**CI behaviour:** it fails for graph-validation errors, invalid action timing, unknown action events, or incomplete runs. A changed number of techniques, altered match ratings, or changed coverage is explicitly **reported for review**, not treated as an automatic failure, because the expansion roadmap is expected to change the graph deliberately. Small differences are shown too; the current graph is expected to give an exact match.

**Browser workflow:** open the Graph Lab → **Baselines** → **Load stored baselines** → choose one scenario → **Set up match** → **Run simulation**. The match settings, seed and bout count are populated exactly from the frozen record. Return to Baselines to see the resulting comparison. All reference reads use the same-site static JSON; no uploaded file or authentication is required.

For local or CI use:

```sh
node tools/graph-baseline-suite.cjs capture > /tmp/current-graph.json
node tools/graph-baseline-suite.cjs compare /tmp/current-graph.json tools/graph-lab/baselines/reference-v1.json
```

**Changing the baseline is a review decision.** Preserve `reference-v1.json` as the before-state for Fight Encyclopedia-inspired work. If we knowingly accept a major new graph, add a separately named v2 reference through a reviewed PR and update the comparison path; never automatically overwrite the original reference on each run.

## Original Phase 0 roadmap (subsequently delivered through v0.4)

**Historical roadmap:** These steps motivated the completed Phase 1–10 releases. They are not the current work queue; see [v0.4 technique and realism review](technique-and-realism-review.md).

1. Annotate missing positional/setup/counter relationships without changing the outcome graph.
2. Add a typed technique registry with stable IDs and explicit provenance.
3. Pilot catch/judo/lucha relationships; compare the same seeds and match formats against this baseline.
4. Only then introduce primary and secondary training backgrounds, progression, and opponent-specific adaptation.

The external Fight Encyclopedia's linked GitHub repository publishes documentation and taxonomy. Its proprietary technique library is explicitly **not** covered by the repository MIT licence. Do not import that library without a separate licence permitting it.

## Quality gates

The lab must pass `tests/graph-lab.test.cjs`, the complete regression suite, and browser inspection. If a test fails, investigate the failure before further implementation or merging. All work is intended to proceed on a separate pull request; no direct-to-`main` change is required.
