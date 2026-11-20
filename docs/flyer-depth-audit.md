# Phase 7 — Flyer-depth investigation

**Status:** Read-only diagnosis against merged Phase 6B on \`main\`. No gameplay changes in this phase.

**Reproduce:** \`node tests/flyer-depth-audit.test.cjs\`; \`node tools/graph-lab/flyer-depth-audit.cjs 6 --json-file\`. GitHub Actions workflow: \`Flyer depth and stamina audit\`. The workflow retains a full JSON artifact and writes the tables into its job summary.

## Scope and controls

**1,620 actual OfficeMatch bouts**, with no modified career saves:

- **1,080** bouts in **216 five-plan matched input groups**: three *hypothetical skill treatments on Lyra* × four fixed opponents × three clock lengths (8, 12, 18 minutes) × six seeds × five plans.
- **240** real-roster bouts: Kit Marlowe, Lyra Knox, Nico Vega and Ace Cassidy, no stat edits, 12 minutes, 12 matches per plan per wrestler.
- **300** favourable-headliner bouts: hypothetical elite ringcraft and safety, experienced opponent, hot feud, 20-minute main-event, and **Pulse**, the spot-preferring promoter. This is an upper-ceiling stress test, **not** the expected output of regular booking.

The controlled worker treatments are:

| Treatment | Ring | Safety | Psychology |
|---|---:|---:|---:|
| Novice | 50 | 45 | 52 |
| Competent | 73 | 68 | 70 |
| Elite | 92 | 91 | 84 |

In the controlled comparisons all five plans receive identical worker identity and physical profile, opponent, clock, promotion, seed, booked finish, wrestler popularity and fatigue. Promotion preferences rotate across groups (the previous Dockside-only audit's +6 Brawl fit bias cannot recur). Different plans legitimately make different decisions and therefore consume random numbers in different orders. The opponents represent actual named characters of four styles, but **opponent styles are not skill-normalised**; differences between those rows should not be interpreted as pure style effects.

## Findings

### 1. There is no general 4–5-star ceiling on flying wrestling

| Controlled flyer | Spot-fest average | Share at 4★+ | Average bell stamina | Botches per match |
|---|---:|---:|---:|---:|
| Novice | **2.71★** | 1.4% | 24.0 | 0.361 |
| Competent | **3.53★** | 26.4% | 26.8 | 0.222 |
| Elite | **4.11★** | 83.3% | 30.2 | 0.181 |

Elite simulated flyers also exceed their same-wrestler Technical (**3.69★**), Story (**3.75★**), Brawl (**3.57★**) and Safe (**3.24★**) plans. The distinct, successful-attack scoring logic does distinguish skill and preserves mistakes.

The deliberately optimised 20-minute Pulse headliner reaches **4.90★ average**, 5★ best, with **100% ≥4.5★**, even while averaging only **13.5** stamina at the bell. This establishes score *possibility*, not a prediction for normal roster bookings. A high star rating can conceal a spent performer, so final stamina and late offensive content must be monitored separately.

### 2. Match length is the larger remaining failure

| Flyer treatment | 8 min ★ / bell stamina | 12 min ★ / bell stamina | 18 min ★ / bell stamina | Distinct risky moves in final 3 min (18m) |
|---|---:|---:|---:|---:|
| Novice | 2.77★ / 37.7 | 2.84★ / 25.2 | 2.51★ / **9.1** | **0.08** |
| Competent | 3.72★ / 37.3 | 3.59★ / 27.8 | 3.27★ / **15.3** | **0.17** |
| Elite | 4.17★ / 39.5 | 4.13★ / 31.1 | 4.03★ / **20.0** | **0.38** |

The late 35% quality reading falls in 18-minute Spot-fests to **42.0** (novice), **49.7** (competent) and **56.3** (elite). Actual \`catch_breath\` moves occur more frequently in those long bouts (1.67, 2.08, 2.00 per match respectively), but insufficiently restore the ability to sustain physically legal late aerial sequences. This is observable fatigue and action scarcity, not proof the rating formula is missing a flat multiplier.

### 3. The live roster is not equivalent to the hypothetical elite tier

| Unmodified wrestler | Ring / Safety | Spot-fest ★ (12-minute sample) |
|---|---:|---:|
| Kit Marlowe | 54 / 44 | 2.54★ |
| Lyra Knox | 57 / 47 | 2.85★ |
| Nico Vega | 73 / 62 | 3.27★ |
| Ace Cassidy | 78 / 64 | 3.40★ |

Spot-fest is the best of five plans for all four of these particular workers in this sample. These are **12 matches per wrestler per plan** and should not be mistaken for league-wide forecasting. Real wrestlers lack the hypothetical elite 92+/91+ ring/safety profile, so an elite skill simulation is not an honest estimate of current match nights.

## Mechanism requiring investigation

Phase 6B reduces tick-level stamina drain for trained safe flyers and adds visible recovery, but the match still pays tick-level stamina depletion throughout its full clock and charges separately for executed actions. High-cost high spots also have minimum-stamina eligibility. The long-match audit shows the worker can deplete below that eligibility before the finishing stretch, forcing simpler offence or recovery. In those bouts, successfully executed named aerials are scarce *within the last 180 seconds*; therefore earned final-moment quality cannot accumulate despite plenty of early crowd-pleasing moves.

The high-heat premium scenario shows this need not make the **overall star rating** low. It can still produce a 5★ card while the worker barely has stamina left for the finish. Match quality and believable finish construction must be separate acceptance criteria.

## Recommended next implementation — separate balance PR

1. **Improve sustainable pacing rather than grant stamina invisibly.** Trial skill-aware timing for legal narrated recovery beats and evaluate actual \`catch_breath\` counts, stamina at the start of the finishing stretch, crowd cooling, and the existing authored stamina costs. Do not increase recovery for inexperienced performers to the same extent as seasoned flyers.
2. **Protect the earned late spectacle.** Increase the chance of *legally prepared, distinct* aerial sequences in the final 180 seconds **only when the performer actually has stamina and valid physical setups**. Never create free landings, phantom counters, instant teleporting, or direct star awards. Examine whether existing high-cost setup sequences consume the remaining stamina too quickly.
3. **Keep match-plan identities intact.** All five plans remain in every matched cohort; Technical should remain credible for technicians, Brawl for brawlers, Story for storytellers and Safe as a lower-risk option. Do not normalise all style-plan means to equality.
4. **Keep full safety and diversity gates.** Retain the 700 genuine-action six-career minimum, timing and exact-parent continuity, botch/injury pathways, 4–5★ incidence, and full regression/rivalry CI. No threshold is to be relaxed to secure a green result.

**Suggested evidence goals**, not assumed successes: for an 18-minute elite flyer, lift average bell stamina beyond 25 (currently 20.0), restore at least one distinct landed risky move *per match on average* in the final three minutes (currently 0.38), and improve late quality **without** increasing novice successful risk, erasing botches, or creating implausible match endings. Record trade-offs, including any reduction in crowd response from recovery.

## Limitations

The synthetic tiers change three stats together (ring, safety, psychology) and therefore quantify their *combined effect*, not the independent effect of training each stat. All comparisons use one flyer identity for control. Actual opponent styles are confounded with each named opponent's other ratings; the favourable headliner explicitly favours Spot-fest. The small real-roster sample is descriptive. These data are simulation outputs, not user playtesting or externally validated wrestling ratings.
