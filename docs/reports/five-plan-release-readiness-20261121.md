# The Office — five-plan match quality, realism and commentary audit

**Read-only investigation:** 21 November 2026, shipped `main` immediately after Safe scripted-spot merge [#156](https://github.com/southernadd-cmyk/wrestler/pull/156), commit `2e95e1477889e64b12daa426fdde248a7b0427a2`.

**Decision:** Core mechanical continuity and plan identities are in good condition. **Do not declare long-match pacing and commentary polish complete.** The dominant remaining problems are stamina depletion and genuine named closing offence at 18 minutes; repetitive dialogue is the next editorial issue. No balance fixes, bonus changes, graph changes or save changes are made in this audit.

## How to reproduce

Run from the repository root:

```sh
node tools/graph-lab/five-plan-release-readiness.cjs 2 6 --json-file
```

The script runs the **real OfficeMatch engine** and produces grouped Markdown output plus `five-plan-readiness.json`. With these parameters there are **1,920 genuinely completed matches**:

- **1,440 controlled**: four true wrestler styles (Brick/Brawl, Ezra/Technical, Sol/Story, Nico/Spectacle), three skill tiers, 8/12/18 minutes, four fixed real opponents, two independent seeds, all five plans.
- **480 unmodified-roster**: all 16 original talent, six fixed seeds/rotations per wrestler, 12 minutes, all five plans.

Within each five-plan group, the worker, opponent, skill, training identity, physical profile, match length, promoter, booked finish and seed are held identical. Promoter preferences rotate **between** groups, never **within** five-plan comparisons. Synthetic ring/safety/psychology treatments are not the real roster's abilities and must not be described as naturally elite wrestlers.

**Metric definitions:** 'Risky landed' counts actual performer-owned, non-defence `risk:true` action events whose attempt resolution is landed; climbing/setup IDs do not count as landings. 'Earned scheduled cover' must have an exact earlier, owner-correct landed grounded source within 30 seconds; separately authored organic graph pin nodes are not these covers. 'Late named' counts distinct genuinely performed action IDs with a non-rest, non-pin technique-family tag in the final 180 seconds; it **does not** count generic reset, recovery or teasing beats. 'Exhausted' means bell stamina **below 25** (an audit band, not medical judgement). A 'repeated line' is a distinct exact transcript sentence occurring **three or more times in one bout**. Injuries are simulated consequences, not empirical injury probabilities.

## Five-plan comparison

**Controlled cohort: 288 matches per plan.**

| Plan | Mean stars | Performed risky moves/bout | Bell stamina | Scripted near falls/bout | Invalid earned sources | Booked outcomes |
|---|---:|---:|---:|---:|---:|---:|
| Safe | **2.56** | **0.10** | **52.78** | 1.24 | 0 | 288/288 |
| Technical | 3.04 | 0.63 | 38.76 | 0.93 | 0 | 288/288 |
| Story | 3.13 | 0.82 | 41.83 | 1.49 | 0 | 288/288 |
| Brawl | 3.01 | 1.11 | 29.22 | 1.41 | 0 | 288/288 |
| Spot-fest | 3.08 | 1.20 | 31.73 | 1.04 | 0 | 288/288 |

There were **zero prohibited extreme scripted stunts in Safe**, as required by [#156](https://github.com/southernadd-cmyk/wrestler/pull/156). Safe still has occasional organically selected risk-tagged actions, which is expected because the completed change restricts *scripted* spectacle rather than removing legal graph moves.

**Unmodified 16-worker roster sample (96 matches per plan):** Safe **2.42★**, Technical **2.92★**, Story **2.99★**, Brawl **2.89★**, Spot-fest **2.97★**. Do not substitute synthetic 92/91-tier ratings for what normal-roster play currently produces.

### Style identity: native match plan wins

The four real styles in the controlled cohort still favour their appropriate plan; each cell averages **72 paired bouts**, spanning all three skill tiers and three match lengths.

| Wrestler style (representative) | Native plan | Native mean ★ | Next strongest plan / ★ |
|---|---|---:|---|
| Brawl / Brick | Brawl | **3.21** | Story / 3.08 |
| Technical / Ezra | Technical | **3.21** | Story / 3.05 |
| Story / Sol | Story | **3.35** | Spot-fest / 3.03 |
| Spectacle / Nico | Spot-fest | **3.39** | Story / 3.05 |

This supports meaningful style-plan differentiation; it is **not** a justification to equalise plans' ratings or to hand out artificial stars.

## P1: 18-minute endurance and finish construction

**18-minute matched cohort: 96 matches per plan, novice through elite combined.**

| Plan | Exhausted at bell | Bell stamina | Actual late distinct family-tagged moves | At least one late named move | Early quality → late quality |
|---|---:|---:|---:|---:|---:|
| Safe | **8.3%** | 35.79 | 1.36 | 68.8% | 58.16 → 48.32 |
| Technical | **70.8%** | 19.54 | 1.26 | 64.6% | 62.95 → 49.98 |
| Story | **64.6%** | 23.94 | 1.52 | 75.0% | 62.07 → 50.77 |
| Brawl | **91.7%** | 12.60 | 1.22 | 64.6% | 61.39 → 46.19 |
| Spot-fest | **88.5%** | 16.09 | **0.96** | **58.3%** | 61.71 → 47.85 |

There is an important scoring/realism gap: performances can still score roughly **3★** while almost everyone is exhausted and the final three minutes have few actual named moves. A setup, `catch_breath`, `stand_reset` or `top_follow` should not be reported as a completed risky landing or a named attack. These figures deliberately separate such events.

**Priorities:** investigate skill-aware long-match pacing and what *actual legitimate recovery actions* contribute; check whether legal closing sequences are being displaced by low-energy fallback moves. Begin with 18-minute Brawl and Spot-fest; also review whether Technical exhaustion is appropriate for trained specialists. Keep botches, actual move costs, normal physical/ownership gates and prebooked finishes intact. Do not grant free stamina or rating boosts to hit a target.

The controlled elite 18-minute subset (32 bouts per plan) also shows residual fatigue: Brawl **93.8%** below 25 stamina and Spot-fest **75.0%**, compared with Safe **15.6%**. These are small cells; extend seeds before fixing any individual percentage.

## P2: commentary repetition and worked-match plausibility

An average bout contained these **distinct exact sentences repeated at least three times**: Safe **1.46**, Technical **1.35**, Story **1.24**, Brawl **1.49**, Spot-fest **1.29**. In 18-minute bouts alone, the values increased to **3.21**, **2.77**, **2.90**, **3.05** and **2.47** respectively.

**Concrete deterministic witness:** An 18-minute novice Brick Mercer vs Silas Rush **Story** bout (seed `762728`) repeated the same clean Silas trip commentary **eight** times and Brick's heavy-spinebuster commentary **four** times. The match finished at **2★**. This is a repeated actual move *and* a repeated sentence, not merely a small bank of generic filler. Other heavy contributors include the identical return-before-count-out phrase and repeated diving-elbow narration when a spectacle opponent appears.

A future polish PR should distinguish (a) repeating the exact action, (b) repeating the same wording for genuinely different actions and (c) repeating unavoidable reset/stamina beats. Vary delivery using actor/position/arc context, prefer authored alternatives on repeated real techniques and avoid inventing a new impact merely to make commentary sound varied. Verify that the event ledger and descriptions continue to agree.

## Acceptance and next work order

**Mechanical hard checks PASS** across the audited cohorts: all 1,920 matches completed, all booked results held, no invented scheduled near falls and no prohibited Safe scripted high spots. This does **not** mean that simulation quality, the real-roster balance, dramatic finish construction or commentary are finished.

Recommended next stages:

1. **Long-match pacing investigation, read-only first.** Partition actual versus synthetic worker tiers, native versus non-native plans, the last 180 seconds, legitimate recoveries and stamina at -180/bell. Fix only proven starvation of legal offence, not every tired wrestler.
2. **Focused legal late-payoff change, if warranted.** Preserve earned action, physical setups, committed counters and risk/botch pathways; compare all five plans on paired seeds.
3. **Commentary realism audit and targeted variation.** Use concrete same-seed tapes to eliminate monotonous repeated lines without fabricating wrestling events.
4. **Integration:** rerun the consolidated five-plan audit and browser match-night review after any gameplay change. Avoid a dozen heavyweight workflows per exploratory commit.

**Limitations:** synthetic training tiers modify three skills together while leaving the original physique/background intact; opponent styles are confounded with other opponent stats; simulated ratings are not real-world wrestling-quality labels. This read-only report does not alter the existing v0.5 baseline, graph topology, movement rules or player's career.
