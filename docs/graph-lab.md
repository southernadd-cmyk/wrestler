# The Office — Graph Lab (Phase 0)

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

## Next changes, after baseline sign-off

1. Annotate missing positional/setup/counter relationships without changing the outcome graph.
2. Add a typed technique registry with stable IDs and explicit provenance.
3. Pilot catch/judo/lucha relationships; compare the same seeds and match formats against this baseline.
4. Only then introduce primary and secondary training backgrounds, progression, and opponent-specific adaptation.

The external Fight Encyclopedia's linked GitHub repository publishes documentation and taxonomy. Its proprietary technique library is explicitly **not** covered by the repository MIT licence. Do not import that library without a separate licence permitting it.

## Quality gates

The lab must pass `tests/graph-lab.test.cjs`, the complete regression suite, and browser inspection. If a test fails, investigate the failure before further implementation or merging. All work is intended to proceed on a separate pull request; no direct-to-`main` change is required.
