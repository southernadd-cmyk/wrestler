# Brawl endurance and finishing depth — separate balance patch

The 4,860-match read-only audit in PR #141 found **elite Brawl at 18 minutes** averaged 3.44 stars, **7.22 bell stamina**, **0.50 distinct successful specialist moves in the final 180 seconds**, and only 8.3% with two distinct late moves. A favourable 20-minute headliner rated 4.53 stars despite ending with 3.15 stamina.

This patch limits its intervention to **Brawl-plan wrestlers whose performance style is Brawl, in matches of at least 15 minutes**. Their ring/safety/psychology determine modest efficiency of continuous exertion (floor 0.95 versus normal 1.15); real strike costs, botches, risk and physical guards stay unchanged. Only an actual `catch_breath` earns a skill-aware visible recovery and a **150-second** saved pacing window. A strict interval prevents immediate re-arming; no stamina is added at match start or from merely selecting a plan. The existing legal named strike/power/corner/outside families receive a late selection preference, not fabricated landings or free stars.

## Validation

Run `node tests/brawl-endurance.test.cjs` and the paired **4,860-match** `node tools/graph-lab/style-depth-audit.cjs 6 --json-file` matrix, comparing to PR #141. Watch *real* late successful distinct specialist moves, 18-minute remaining stamina, quality and star components, injury/botch rates, and non-Brawl plan controls. This branch is stacked on the audit PR, and remains unmerged until the actual metrics and safety checks are reviewed.

The workflow is **one dedicated audit** plus the existing lean safety gates, not 14 workflows for every change.
