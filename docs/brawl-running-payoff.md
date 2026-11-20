# Brawl: named running attacks and genuine rebound follow-through

Follow-up to the read-only findings in #143 and improved late-impact PR #144. The remaining concern is that only a negligible fraction of the final-three-minute specialist selection weight goes to *named running attacks*, even with stronger basic strike variety.

## Mechanism

The existing graph already has a standing \`rope_run\`, \`rope_rebound\` and a catalogue of running knees, lariats, spears and other named offence. The runner must still control the ring and have enough stamina, position and actual rebound setup. **First paired 288-bout candidate failed the running-playoff goal**: it produced only two competent late setups before and none after, with one running landing before and after across 96 competent bouts. That disproved an approach which improved the *next beat only*, without making real setups likely. However a run gets only one follow-up beat; the graph's normal arc-change and optional spot/near-fall mechanics can consume it. The full move pool competes against hundreds of options, so a valid named attack can be buried even following a real setup.

The targeted patch:

- Preserves an **actually completed rope_run/rope_rebound for precisely the following beat**, only for conditioned Brawl-style wrestlers on the Brawl plan in 15+ minute matches with 20–180 seconds remaining, where at least one real named running move meets the original isValid rules and the cost-dependent stamina reserve.
- Defers an otherwise-optional scripted special or nearfall for that one beat; the normal match clock still advances. Nothing spawns, no second run is fabricated, no result is forced and no free quality/stars are awarded.
- A conditioned Brawl wrestler can **actually select and narrate** a `rope_run` while controlling both wrestlers in the ring from standing (not only after a strike). The entry share is restrained from ordinary standing control (about **13% selection chance**) and stronger immediately after an actual recorded standing strike, counter, or stand-up (about **26–29%**). A cooldown and a cost-aware preflight prevent endlessly running or preparing a move the worker cannot afford. Neither path invents the setup or the resulting hit.
- Gives affordable, fresh, legal named running moves a **bounded, non-forced selection share**, keeping other moves eligible, and avoids starting a named run unless the worker has enough runway to afford a subsequent attack.
- No changes to counters, grappling/strike attempt commitment, plan scores, worker attributes, physical positions, actual stamina costs, or rules for novice/short bouts.

## Acceptance / tests

Run \`node tests/brawl-running-payoff.test.cjs\`, \`node tests/brawl-late-impact.test.cjs\`, and the real matched \`brawl-running-depth.cjs\` diagnostic against **both the #144 baseline branch and this patch branch** (same 288 bouts per condition). Count late rope setups, opportunities with real legal running moves, immediate follow-throughs, actual committed named running ATTEMPTS and LANDED manoeuvres, distinct running move IDs, final quality/stamina and safety. The 4,860-bout five-plan matrix remains the overall regression. Reject a higher rating if it does not correlate with real legal landings. One dedicated CI workflow; no 14-workflow-per-commit cascade.

No automatic merge; review baseline and after metrics before integration.

**Second paired candidate:** The first repaired setup weighting raised elite completed runs from 1 to 7 across 96 bouts, but still generated **zero** landed late named running offence, versus zero before; competent landings remained 1/96. This was not acceptable. The current candidate additionally recognises recent real standing exchanges after an arc relabel and improves the *single earned rebound* selection opportunity without forcing success. Do not merge it until paired real named landings rise.

## Paired result — final candidate (96 actual 18-minute bouts per tier)

| Measure, final 180 seconds | #144 baseline | Final #145 candidate |
|---|---:|---:|
| Competent completed rope runs | 2 | **15** |
| Competent committed named running attempts | 1 | **5** |
| Competent landed named running moves | 1 | **3** |
| Elite completed rope runs | 1 | **35** |
| Elite named running attempts | 0 | **11** |
| Elite landed named running moves | 0 | **10** |
| Novice named running landings | 1 | **1** |

The three competent running landings were **lariat, dropkick and cannonball**, all genuine committed attacks. Elite landings cover **crossbody, lariat, hip attack, bicycle knee, spear, Thesz press, elbow, shoulder block** and others. Genuine blocks and counters remain in effect.

**Important qualification:** This proves more *real running* action, but competent named landings are still only **3 in 96 bouts**, and there is a possible tradeoff with other late offence. In the complete 4,860-match matrix the competent 18-minute native-plan late specialist variety changed from **1.38 to 1.29** distinct moves/bout and elite from **1.25 to 1.04**, though these 24-bout duration cells are small. Star ratings stayed approximately stable; all safety and full-matrix validation passed. **The branch remains draft and should not be merged as a finished balance fix without examining this displacement**.

CI: [paired comparison and full matrix](https://github.com/southernadd-cmyk/wrestler/actions/runs/44830704170), [1,000-bout match quality](https://github.com/southernadd-cmyk/wrestler/actions/runs/44830703986), [simulation safety](https://github.com/southernadd-cmyk/wrestler/actions/runs/44830704033). One targeted running comparison workflow; no broad 14-workflow dispatch.

## Complementary linked sequence (candidate)

The source of the remaining displacement was the global rope-run *selection weight*: it could consume an otherwise useful entire ten-second exchange just setting up an attack. Replace that approach with an occasional, **same-exchange narrated rope run after an actual landed standing strike** (or an actually performed core forearm/body shot). The strike remains a separate committed event. The rope setup costs normal stamina but uses no *extra* clock tick. The following named running move is still a physically legal, contested strike with its own counter/block/landing result. One such sequence per wrestler in the last 180 seconds prevents spam; no change to novice, other plans or shorter bouts.

Actual running payoffs are drawn from a source-appropriate short list — for example, rib-targeting set-ups can favour a spear or running knee — but no result is guaranteed. Repeated moves, unsafe lifts, unaffordable moves and physically impossible positions remain excluded.

The paired 288-bout comparison now counts both **all distinct landed late moves** and **non-running distinct landed late moves**, alongside real running attempts and landings. This is checked *before* launching the full five-plan matrix. The older, abandoned probability-only candidates remain recorded above for auditability.
