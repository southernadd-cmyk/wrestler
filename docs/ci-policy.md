# CI execution policy — The Office

The normal release path is deliberately small. **Target: two to three minutes for an ordinary PR or deployment**, excluding GitHub runner queue and Pages propagation. Measure real timings before claiming that target has been achieved.

## Normal pull requests and `main` pushes

- **One required status check:** `Regression suite (Node 22)` in `.github/workflows/tests.yml`. This keeps the existing branch-protection check name.
- **Documentation / newsletter artwork / other workflow-only updates:** classify the diff and succeed. Do **not** install Python or Chromium, rebuild portraits, or run gameplay tests.
- **JavaScript changes:** syntax-check changed JS and run only a small, relevant set of existing Node tests. Ringfax, match mechanics, negotiations, training, save/career and UI have separate selections.
- **Changes that cannot be classified:** use a conservative, small smoke set rather than silently skipping all checks.
- **No automatic full matrix or browser download on ordinary PRs or main pushes.** Browser checks are expensive and should not hold up routine text, layout or editorial work.
- Do not add a regression suite or GitHub workflow for every tiny fix. Prefer updating existing focused coverage only when it protects an important shared contract.

## Deeper verification, separate from the release gate

- For a layout change that needs pre-merge Chromium verification, explicitly use a branch named `browser-audit/...`. The existing browser job then runs only the focused title, scouting and notification checks at four screen sizes. Ordinary branches retain the fast Node-only gate; nightly and tag runs still execute all browser journeys.

- The existing Simulation tests workflow runs the complete Node suite and Chromium journeys nightly at 03:23 UTC, and on version tags matching `v*`. It does not add a new workflow or a required browser status on PRs.
- Changes to the simulation workflow itself run the structure activation suite. UI, sheets, agents-room and match-engine changes select the behavioural structure integration suite; career changes also select roster coverage.

- Use **Actions → Simulation tests → Run workflow** for the full `tests/*.test.cjs` matrix and desktop/mobile Chromium journeys when a risky engine or integration change warrants it.
- The 25 existing specialist graph, wrestling-style, career and A/B workflows remain accessible through `workflow_dispatch`; any pre-existing weekly schedules are preserved. They no longer launch automatically on normal PRs or `main` pushes.
- For significant match-engine changes, run the relevant full comparison *on demand*, preferably once on a final candidate. Evaluate the result before merging a risky mechanical change; don't attach it automatically to every commit.
- A separate GitHub Pages publication may run independently; this policy governs the **simulation/testing** workflows, not Pages hosting itself.

## Guardrails

The short gate is **not** proof that all gameplay is regression-free. It protects common contracts rapidly, while nightly and tag audits provide broader evidence before risky changes. Keep all original tests and historical baselines in the repository. If the required branch-protection check name changes, update GitHub rules at the same time; avoid requiring checks that no longer run for each PR.

After changing these triggers, compare actual CI durations on a documentation PR and a gameplay PR and review whether the selected tests meet the two-to-three-minute goal.
