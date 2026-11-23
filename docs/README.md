# The Office — documentation guide (v0.65)

**Current edition:** [v0.65 — The territory talks back](../readme.md#the-latest-issue) · [Ringfax](../readme.md#ringfax) · [previous v0.6.0 release guide](v0.6-release.md) · [v0.5.0](v0.5-release.md) · [v0.4.0 archive](v0.4-release.md)  
**Latest match-engine changes:** [Long-match earned recovery and late offence](long-match-endurance-and-late-offence.md) · [Five-plan audit PR #157](https://github.com/southernadd-cmyk/wrestler/pull/157)
**Next development review:** [Technique coverage and physical realism](technique-and-realism-review.md)  
**Completed 500-bout audit:** [Findings](reports/v04-technique-position-500.md) · [Machine-readable data](reports/v04-technique-position-500.json) · [Reproduction script](../tools/graph-lab/technique-position-audit.cjs)  
**Superplex pacing and referee follow-up:** [1,500-bout investigation and verified pacing change](reports/v04-superplex-dq-followup-20261120.md)  
**Reviewed 24-technique tranche:** [114 curated records, seven legal handoffs and 1,000-match review](reports/v04-technique-tranche24-20261120.md)  
**Playable game:** https://southernadd-cmyk.github.io/wrestler/  
**Graph Lab:** https://southernadd-cmyk.github.io/wrestler/tools/graph-lab/

This index separates **v0.65's newer career, match-structure and editorial features**, **v0.6 match-balance work**, **v0.5 technique implementation and metadata**, and **historical phase notes**. The original phase documents and reports preserve the conditions, counts, proposals and trial measurements of their own period. Their titles, numeric baselines and historic test comparisons should not be silently rewritten to fit the current build. A short status note links them to the shipped v0.4 state.

## Current entry points

| Need | Read |
| --- | --- |
| What's new in v0.65 | [Current README issue](../readme.md#the-latest-issue), [Ringfax](../readme.md#ringfax) |
| What's new in v0.6 and its regression evidence | [v0.6 release guide](v0.6-release.md), [long-match balance and limits](long-match-endurance-and-late-offence.md) |
| What's in v0.5's technique and graph expansion | [v0.5 release guide](v0.5-release.md), [final technique audit](reports/v04-final-106-technique-audit.md) |
| Further match-quality and physical-realism review | [Earlier roadmap](technique-and-realism-review.md), [Graph Lab](graph-lab.md) |
| Real 500-bout technique and physical-state evidence | [Completed audit](reports/v04-technique-position-500.md) |
| Source modules, persistence and test architecture | [Architecture](architecture.md) |
| Lab workflow, saved baselines and graph comparison | [Graph Lab](graph-lab.md) |
| Fictional character design, starting world and identities | [Living-roster cast bible](living-roster-v4.md) |
| Creative systems and evidence-backed rivalries | [Rivalries](rivalries-v3-12.md), [Promo graph](promo-graph.md) |

## Historical graph development — completed and now represented in v0.4

| Stage | Historical record |
| --- | --- |
| Baseline / Graph Lab | [Graph Lab](graph-lab.md), [original 1,200-bout baseline](../tools/graph-lab/baselines/reference-v1.json) |
| Phase 1 / inventory | [Original 336-move audit](phase1-graph-technique-audit.md), [snapshot CSV](phase1-technique-candidates.csv) |
| Phase 2 / metadata | [Registry pilot](phase2-technique-registry.md) |
| Phase 3 / legal links | [First curated chains](phase3-technique-transitions.md) |
| Phase 4 / schools | [Wrestler training backgrounds](phase4-training-backgrounds.md) |
| Phase 5–5b / wider review | [Technical identities](phase5-training-identity-expansion.md), [90-record review](phase5b-ground-strike-aerial-review.md) |
| Phase 6–7 / attempts | [Aerial attempts](phase6-aerial-attempt-state.md), [Grapple attempts](phase7-grapple-attempts.md) |
| Phase 8 / complete roster identities | [Depth and variety](phase8-depth-variety.md) |
| Phase 9 / authored links | [Authored chains](phase9-authored-chains.md), [match-quality P0](match-quality-p0.md) |
| Phase 10 / coherent scripting | [v0.4 release](v0.4-release.md), [Phase 10 PR #108](https://github.com/southernadd-cmyk/wrestler/pull/108) |
| Narrative clock repair | [Pacing PR #116](https://github.com/southernadd-cmyk/wrestler/pull/116) |

## Historical design snapshots and evidence

The [v0.2 match graph](match-graph.md), [v0.2.9 match variety](match-variety.md), [v0.3.1 match sheets](graph-sheet-v3-1.md), [v0.3.2 creative loop](creative-loop-v3-2.md) and [v0.3.3 catalog expansion](graph-expansion-v3-3.md) describe those designs as they stood then. The [wrestler memory](wrestler-memory.md), [rivalry](rivalries-v3-12.md), [repeated-rivalry automation](repeated-rivalry-automation.md) and [career continuity](career-continuity-audit.md) documents preserve additional development decisions. Raw or narratively curated test transcripts in [reports](reports/) are **frozen observations**; their output should not be edited to represent the v0.4 engine.

Current code remains the source of truth if a historical snapshot disagrees with it. Match-graph counts for v0.4.0 are **979 nodes / 6,401 links / 340 moves**, while the original 336-row taxonomy CSV remains a valuable frozen reference.

## House rules

- Keep old baseline JSON, original Phase 1 CSV, report transcripts and historical commit comparisons intact.
- Clearly mark proposal, implemented mechanics, and human-review-only findings.
- Preserve independent performance style, technical background and weekly training as different systems.
- Require CI plus sampled real-match transcript review before accepting new physical-state or technique-graph changes.
- Follow [content rights](../CONTENT-LICENSE.md); third-party proprietary technique libraries are not included.
