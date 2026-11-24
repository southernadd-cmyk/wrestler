# The Office — contributor documentation

**Current edition: v0.65 — The territory talks back.** [Play](https://southernadd-cmyk.github.io/wrestler/) · [Player guide and release notes](../readme.md) · [Graph Lab](https://southernadd-cmyk.github.io/wrestler/tools/graph-lab/)

Start here to find the relevant system, its design history and the evidence used to test it. The shipped code and current tests take precedence over historical proposals and measurements.

## Start here

| Working on | Start with |
| --- | --- |
| Source modules, persistence, engine architecture | [Architecture](architecture.md) |
| Testing, fast PR checks, nightly audits, release gates | [CI policy](ci-policy.md) |
| Match simulation and physical realism | [Graph Lab](graph-lab.md), [technique and realism review](technique-and-realism-review.md) |
| Match plans and dramatic structures | [Career integration](match-structure-phase4-career.md), [called spots](match-structure-phase8-called-spots.md), [psychology evidence below](#match-psychology) |
| Career, booking, training and finances | [Living roster](living-roster-v4.md), [career continuity](career-continuity-audit.md), [long-career audit](v07-long-career-audit.md) |
| UI, mobile, onboarding and Ringfax | [UI audit](ui-ux-phase4-audit.md), [Ringfax audit](ringfax-phase0-audit.md) |

## Testing and contributing

Run `npm test` from the repository root with Node 22 for the full Node suite. The game itself is static and has no runtime build dependencies. See the [CI policy](ci-policy.md) for targeted checks and opting into focused Chromium verification.

For the current opening-career budget rules and tests, see [early-career finances](early-career-finances.md). Preserve existing saves, deterministic simulation, historical test baselines, and the distinction between planned and physically performed events.

## Development history by subsystem

The documents below are retained in place rather than moved to an archive directory. They record the state and test evidence at the time of writing, not necessarily the latest implementation.

### Match structures

| Phase | Design and evidence |
| --- | --- |
| 0–2 | [Baseline audit](match-structure-phase0-audit.md), [schema](match-structure-phase1-schema.md), [editorial plan](match-structure-phase2-editorial-plan.md) |
| 3–4 | [Director](match-structure-phase3-director.md), [career activation](match-structure-phase4-career.md) |
| 5–6 | [Backstage conversations](match-structure-phase5-conversations.md), [commentary](match-structure-phase6-commentary.md) |
| 7–8 | [Balance](match-structure-phase7-balance.md), [called spots](match-structure-phase8-called-spots.md) |

### Match psychology

| Phase | Design and evidence |
| --- | --- |
| 9A–9C | [Motifs](match-psychology-phase9a-motifs.md), [selling](match-psychology-phase9b-selling.md), [finishing runway](match-psychology-phase9c-finishing-runway.md) |
| 9D–9F | [Finish timing](match-psychology-phase9d-finish-timing.md), [earned control](match-psychology-phase9e-earned-control.md), [physical arc handoff](match-psychology-phase9f-physical-arc-handoff.md) |
| 9G–9I | [Near-fall control](match-psychology-phase9g-earned-nearfall-control.md), [earned follow-through](match-psychology-phase9h-earned-followthrough.md), [closing routes](match-psychology-phase9i-plan-closing-routes.md) |
| 9K–9L | [Near-fall evidence](match-psychology-phase9k-nearfall-evidence.md), [near-fall response](match-psychology-phase9l-nearfall-response.md), [authored post-cover work](match-psychology-phase9l-authored-postcover.md) |

### Physical engine, techniques and match balance

| Area | Design and evidence |
| --- | --- |
| Baselines and inventory | [Graph Lab](graph-lab.md), [original baseline](../tools/graph-lab/baselines/reference-v1.json), [336-move inventory](phase1-graph-technique-audit.md), [inventory CSV](phase1-technique-candidates.csv) |
| Registry and handoffs | [Registry](phase2-technique-registry.md), [grappling and counters](phase2-deeper-grappling-counter-sequences.md), [technique transitions](phase3-technique-transitions.md), [chain submissions](phase3-chain-wrestling-submissions.md) |
| Standing, ground and aerial sequences | [Standing exchanges](phase4-standing-striking-neck-running.md), [pins and near-falls](phase5-ground-pins-nearfalls.md), [ground strikes and aerial review](phase5b-ground-strike-aerial-review.md), [aerial attempts](phase6-aerial-attempt-state.md), [environment](phase6-environment-exchanges.md), [dives and stamina](phase6b-dives-and-stamina.md), [grapple attempts](phase7-grapple-attempts.md) |
| Variety and authored routes | [Depth and variety](phase8-depth-variety.md), [authored chains](phase9-authored-chains.md), [match-quality P0](match-quality-p0.md), [safe scripted spot boundary](safe-scripted-spot-boundary.md) |
| Endurance | [Long matches](long-match-endurance-and-late-offence.md), [brawl endurance](brawl-endurance-balance.md), [brawl late impact](brawl-late-impact.md), [running payoff](brawl-running-payoff.md) |
| Style and near-falls | [Style depth](style-depth-audit.md), [flyer depth](flyer-depth-audit.md), [earned near-fall](earned-nearfall.md), [cross-style near-fall](cross-style-earned-nearfall.md), [story psychology](story-psychology-audit.md), [earned hope](story-earned-hope.md) |

### Career, roster and training

| Area | Design and evidence |
| --- | --- |
| Roster and identity | [Living-roster cast bible](living-roster-v4.md), [machine-readable roster snapshot](living-roster-v4.json) |
| Development | [Training backgrounds](phase4-training-backgrounds.md), [technical identities](phase5-training-identity-expansion.md), [training audit CSV](phase5-roster-training-audit.csv) |
| Finances and bookings | [Opening finances](early-career-finances.md), [negotiation balance](negotiation-balance-phase6.md), [long-career audit](v07-long-career-audit.md) |
| Save and history continuity | [Career continuity](career-continuity-audit.md), [wrestler memory](wrestler-memory.md), [rivalries](rivalries-v3-12.md), [repeated rivalry automation](repeated-rivalry-automation.md) |
| Promos | [Promo graph](promo-graph.md), [creative loop](creative-loop-v3-2.md) |

### Interface and Ringfax

[UI/UX audit](ui-ux-phase4-audit.md) · [Ringfax baseline](ringfax-phase0-audit.md) · [Fan zone design](ringfax-fanzone-design.md).

### Historical releases and design snapshots

[v0.6.0](v0.6-release.md) · [v0.5.0](v0.5-release.md) · [v0.4.0](v0.4-release.md) · [Early match graph](match-graph.md) · [Match variety](match-variety.md) · [Match sheets](graph-sheet-v3-1.md) · [Graph expansion](graph-expansion-v3-3.md).

### Frozen audit evidence

The [reports directory](reports/) contains raw and curated match transcripts and technique audit results. Useful starting points: [500-bout physical state audit](reports/v04-technique-position-500.md), [JSON data](reports/v04-technique-position-500.json), [24-technique tranche](reports/v04-technique-tranche24-20261120.md), [superplex follow-up](reports/v04-superplex-dq-followup-20261120.md), [final technique audit](reports/v04-final-106-technique-audit.md).

## House rules

- Historical figures, proposals, transcripts and comparison baselines stay intact.
- Clearly distinguish proposals, implemented rules and human-review-only findings.
- Treat performance style, technical background and weekly training as separate systems.
- Require relevant CI and sampled real-match evidence before accepting changes to match mechanics.
- Follow the [content rights policy](../CONTENT-LICENSE.md); third-party proprietary technique libraries are not included.
