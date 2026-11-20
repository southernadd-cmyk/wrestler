# Technical, Brawl and Story — deep match audit

**Read-only investigation on the current merged engine.** No gameplay, star-scoring, move-weight, stamina or career-save changes.

Run `node tests/style-depth-audit.test.cjs` for deterministic fixture validation and `node tools/graph-lab/style-depth-audit.cjs 6 --json-file` for the full report. The dedicated GitHub Actions workflow publishes the report in its job summary and retains JSON. Only one additional targeted audit workflow is introduced. It runs when the audit PR is opened, on relevant main-branch changes, or when deliberately dispatched.

**4,860 real engine bouts:** per style, 1,080 strictly matched five-plan bouts (three hypothetical ring/safety/psych skill treatments × four fixed opponents × 8/12/18 minutes × six seeds × five plans), 240 actual unmodified wrestler bouts, and 300 deliberately favourable 20-minute headliners. The four promoters rotate across matched groups, not between plans within a group. The same seed, opponent, finish, worker, timing and card position are retained within each five-plan cohort. No automatic five-star or plan-quality pass/fail threshold is assumed.

**Review separately:** Technical — attempted/landed/countered grapples, grounded chains and submissions; Brawl — strikes, power and ringside work, physical/contact resolutions; Story — earned narrative changes supported by landed moves, near falls, distinctive arcs, and convincing late action. For all three, inspect late unique moves, early/late tick quality, exhausted share, botches, injuries, repeated commentary and whether the style's native plan has a meaningful advantage. Each JSON row contains top actual move IDs, families, arcs and rating components.

**Caveats:** Hypothetical skill treatments retain the original worker identity, body size and training background; opponents are not normalised. Metadata-family counts do not include all old core moves, so general move and arc metrics are separately reported. The favourable headline rows establish a ceiling, not typical match-night outcomes. Treat this as diagnostic evidence for a separate future balance PR, not a reason to force all plans to identical ratings.
