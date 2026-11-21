# Safe match-plan audit (read-only)

## What is being measured

Safe is the fifth MATCH PLAN, not a fifth wrestler style. Four genuine wrestler identities cover Brawl, Technical, Story and Spectacle, holding identical identity, opponent, booked finish, seed, promoter and performance stats within each five-plan comparison.

Run: node tools/graph-lab/safe-plan-audit.cjs 4 --json-file

The dedicated single-workflow PR experiment runs 3,440 actual completed matches:
- 2,880 controlled paired bouts (4 worker styles x 3 tiers x 3 lengths x 4 opponents x 4 seeds x 5 plans);
- 240 unmodified roster bouts (4 workers x 12 independent seeds x 5 plans);
- 320 fresh/fatigued controlled stress bouts.

Measure actual risky move occurrences and performed outcomes, including the wrestler and opponent separately; potential high-consequence moves; dangerous staged setups versus performed impacts; botches; injury; stamina and fatigue; late real offence; move and arc variety; quiet rest; crowd; and credible, exact move-sourced scheduled covers. Do not mistake Safe's reduced probability of botches for a prohibition on all risky offence. No automatic requirement that every Safe match has a near fall.

The script rejects only missing cases, impossible metrics or invented/invalid sources. It intentionally does NOT fail for an unexpectedly high star rating or high-risk rate, because the purpose is to measure such problems before deciding if they merit a separate gameplay change.

## Preliminary 240-bout pilot

Twelve 18-minute bouts each for Brick, Ezra, Sol and Nico across all five plans showed Safe usually conserving stamina while reducing overall hazardous offence. Some Safe matches nevertheless included authentic authored risk-flagged superplex, diving or ringside moves. The larger controlled audit will identify whether this is normal, proportional to performer style, and limited enough to merit retaining versus a targeted risk gate. Do not treat the pilot as a final risk threshold.

No gameplay changes, scoring edits, registry rewrites, new workflows for routine commits, or career-save mutations are included in this audit PR.
