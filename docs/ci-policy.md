# CI execution policy — The Office

Keep GitHub Actions useful without launching a dozen long simulations for every development commit.

## Every pull request update (fast feedback)
- **Simulation tests:** run the focused Node smoke tests and relevant aerial/graph legality checks. Do **not** run the entire `tests/*.test.cjs` matrix or install Chromium on each PR commit. Documentation-only changes retain the portrait/README consistency check.
- **Phase 9 match quality A/B:** run when match-engine, plan data, or its quality tests change.
- **Curated technique gate:** run when curated technique registry/training metadata or its tests change; edits to `match-engine.js` alone no longer fan out into this workflow.
- PR workflows share a per-workflow/PR **concurrency key** with `cancel-in-progress: true`: only the newest PR revision should continue.

## Integration and intentional full verification
- **Main-branch integration:** run the full simulation suite, Chromium browser journeys and the relevant dedicated graph/career/technique audits after changes land on `main`.
- **Manual full checks:** every heavyweight workflow also supports `workflow_dispatch` so a reviewer can run it against the feature branch before merging high-risk engine changes.
- Existing weekly audit schedules remain in place. Main-branch and manual runs are **not** automatically cancelled by new PR commits.
- Run the complete relevant validation **once on the final candidate** rather than repeatedly on each exploratory commit; batch related code/test changes before pushing when practical.

The main match-engine file is used by most audits. Filtering by file paths alone cannot prevent an Actions storm if every heavyweight workflow triggers on `match-engine.js`; the heavyweight PR triggers have therefore been removed. The tests themselves have **not** been deleted.

If GitHub branch protection lists a heavyweight workflow as a required pull-request check, update its required status checks to use the fast PR gates. Otherwise GitHub may wait for a check that intentionally runs only on `main` or through manual dispatch.
