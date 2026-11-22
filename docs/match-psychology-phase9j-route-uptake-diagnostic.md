# Phase 9J: route selection and Safe late-match tape audit

**Purpose:** Investigate PR #207 (head `dbece903`) before changing any gameplay. Do not merge this diagnostic. It starts from the exact passing gameplay candidate and adds read-only instrumentation to the existing matched simulation audit. Concurrent main branch PR #208 changed only match-night UI; no attempt is made to replace it.

## Questions
1. Are the plan-specific route sources ever offered at the current match state? When sampled before `E.next`, which genuinely valid sources appear? How often does a move with one of those IDs appear as the next actually performed action?
2. Are performed plan-appropriate setups followed by a source-authored, physically grounded payoff within 60 seconds, or by unrelated moves, opponent counters, position changes and recovery?
3. Which actual move pairs are **credited in final finishing evidence**, as opposed to merely selected earlier?
4. Why are Safe's credited endings sometimes top-rope or springboard actions? These routes can come through the ordinary move graph, *not* the Safe-specific closing invitation. Count performed risk-flagged actions, source movements, high-cost attacks and scripted-spot attempts separately. **Ordinary legal aerial wrestling is not automatically a forbidden hazardous scripted spot.**

## Method
The audit process optionally snapshots `GRAPH.closingOffers` and `GRAPH.closingPlanSetups` before a simulation tick. It asserts the snapshot consumes **no gameplay RNG**. These are *opportunities*; `E.next` may process a dramatic transition before choosing a move, so offered→next-action correlation is exploratory, not proof of the exact pool draw. Performed setup/payoff and late Safe action counts are independently extracted from the real graph tape with no mutation. All 480 signed Director-active and 480 metadata controls retain their original seeds, signed sheets, and outcome assertions.

## Guardrails
No new attacks, move probability shifts, alternate finishes, stage changes, saved-game fields, or workflow. Preserve the Phase 9G/9H zero-unearned-control-loss assertion and all existing physical validity checks. Distinguish real countered sequences from fake promised winners. Use the results to choose whether PR #207 should be refined, kept as a limited Spots improvement or held for a separate Safe pass.

**Status:** diagnostic-only, no merge.
