# Safe match-plan audit (read-only)

## What is being measured

Safe is the fifth MATCH PLAN, not a fifth wrestler style. Four genuine wrestler identities cover Brawl, Technical, Story and Spectacle, holding identical identity, opponent, booked finish, seed, promoter and performance stats within each five-plan comparison.

Run: node tools/graph-lab/safe-plan-audit.cjs 4 --json-file

The dedicated single-workflow PR experiment runs 3,760 actual completed matches:
- 2,880 controlled paired bouts (4 worker styles x 3 tiers x 3 lengths x 4 opponents x 4 seeds x 5 plans);
- 240 unmodified roster bouts (4 workers x 12 independent seeds x 5 plans);
- 640 fresh/fatigued controlled stress bouts.

Measure actual risky move occurrences and performed outcomes, including the wrestler and opponent separately; potential high-consequence moves; dangerous staged setups versus performed impacts; botches; injury; stamina and fatigue; late real offence; move and arc variety; quiet rest; crowd; and credible, exact move-sourced scheduled covers. Do not mistake Safe's reduced probability of botches for a prohibition on all risky offence. No automatic requirement that every Safe match has a near fall.

The script rejects only missing cases, impossible metrics or invented/invalid sources. It intentionally does NOT fail for an unexpectedly high star rating or high-risk rate, because the purpose is to measure such problems before deciding if they merit a separate gameplay change.

## Preliminary 240-bout pilot

Twelve 18-minute bouts each for Brick, Ezra, Sol and Nico across all five plans showed Safe usually conserving stamina while reducing overall hazardous offence. Some Safe matches nevertheless included authentic authored risk-flagged superplex, diving or ringside moves. The larger controlled audit will identify whether this is normal, proportional to performer style, and limited enough to merit retaining versus a targeted risk gate. Do not treat the pilot as a final risk threshold.

No gameplay changes, scoring edits, registry rewrites, new workflows for routine commits, or career-save mutations are included in this audit PR.

## Completed audit evidence — 21 November 2026 (first full run)

The first 3,760 matches completed. The workflow initially reported a failure solely because its hard-coded expected total was 3,440: the fatigue matrix is 640 matches, not 320. This was an **audit arithmetic error**, not a gameplay failure. The next run corrects the count and separates scripted from organically selected risk events.

Across the 2,880 strictly matched five-plan bouts (576 per plan, four worker styles and three skill treatments), the Safe plan produced:

| Matched mean per bout | Safe | Technical | Story | Brawl | Spots |
|---|---:|---:|---:|---:|---:|
| Stars | 2.60 | 3.01 | 3.15 | 2.99 | 3.09 |
| Player-performed risky actions | 0.39 | 0.59 | 0.85 | 1.10 | 1.26 |
| Bell stamina | 50.42 | 39.16 | 41.06 | 29.49 | 32.34 |
| Botches | 0.02 | 0.04 | 0.07 | 0.19 | 0.32 |
| Sourced scheduled near falls | 1.16 | 0.92 | 1.44 | 1.34 | 0.98 |
| Distinct late worker moves | 5.45 | 4.72 | 5.84 | 5.88 | 5.45 |

All recorded scheduled covers in the Safe controlled groups had matching, timely, correct-controller, grounded, low-cost Safe-approved source actions (zero bad sources). Safe did not lose its late worker move variety: in this cohort it matched Spots and exceeded Technical. These are descriptive simulation averages rounded from per-group summaries, not an injury probability or a guarantee in every bout.

**Concrete concern:** Several real Safe actions were *performed* as high-consequence ringside impacts. The event ledger contains scripted landed ramp suplexes and floor piledrivers; a top-follow is only a setup and must not count as a landed superplex. The second run decomposes scripted and organic events before proposing a narrowly scoped balance fix. A Safe plan can still intentionally include risk, but a pre-booked dangerous scripted move bypassing the spirit of "Keep it safe" merits design review.

**Fatigue stress:** Starting a worker with 55 fatigue reduced Safe bell stamina to 15.00, compared with 42.55 when the worker began at 4 fatigue, despite the plan's relatively protective pacing. Safe mitigates strain but cannot safely rehabilitate an already exhausted worker. This test does not simulate specific injuries or medical return-to-work decisions.
