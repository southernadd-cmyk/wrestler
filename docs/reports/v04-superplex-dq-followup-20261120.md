# The Office v0.4 — organic superplex and DQ follow-up

**Investigated:** 20 November 2026  
**Comparison:** frozen v0.4 audit branch `audit/v04-technique-position-500-20261119` (PR #119) versus physical-positioning pilot commit `2a2a5a016318ed1ec310c68e1e1b68aea5d93f5d` (PR #121).  
**Status at investigation:** read-only diagnosis before the applied pacing follow-up below; the referee rules remain unchanged.

## Reproduction / interpretation

Two paired cohorts were executed directly in the browser game's actual `OfficeMatch` JavaScript engine, evaluated in isolation with its real data, roster, technique registry and technique backgrounds. The first cohort uses the published 500-bout audit configuration: **seeds `90021 + 41*i` for `i=0..499`**. An independent holdout consists of **1,000 bouts, seeds `120021 + 41*i` for `i=0..999`**. Each pair holds wrestler/opponent rotation, plans, slot, promoter, finish contract, starting fatigue and seed constant. Scripted decisions use the audit's `job/home/cut/protect` priority. This tests the same scenarios with the old and proposed engines; it is **not** a full-season sample.

Transient, read-only instrumentation recorded: `top_follow` scene entries; matching `graph.scriptedSpotAttempts` timestamps; legal normal-step candidate weights; temporary **non-committing** full-stamina eligibility probes; `graph.grappleAttempts`; cheap-shot action timestamps; referee warning state and the unchanged deterministic referee visibility hash. Instrumentation does not draw from the match RNG. No replay state or move source was persisted into the match.

## Finding A — ordinary superplex availability is a funnel problem, not a dead catalogue

| Measure | Frozen 500-seed cohort | Independent 1,000-seed holdout |
| --- | ---: | ---: |
| Completed bouts | 500/500 | 1,000/1,000 |
| `top_follow` events | 97 | Not tallied |
| `top_follow` belonging to a scripted superplex attempt | 89 | Not tallied |
| Scripted superplexes landed | 82 | 187 |
| Scripted superplexes botched | 7 | Not tallied |
| Truly non-scripted `top_follow` events | **8** | Not tallied |
| Organic named two-tick superplex attempts | **0** | **3** |
| Named superplex outcomes from the ordinary graph | 0 | All three landed |

In the 500-bout cohort, the 89 scripted attempts used only `sp_superplex` (63 landed, 3 botched) and `sp_avalanche_german` (19 landed, 4 botched). That is **by design of the Phase 10 `SCRIPTED_SPOT_IDS` map**, which references only those two superplex manoeuvres. Scripted spots therefore cannot demonstrate the other five variants organically.

The eight genuinely ordinary `top_follow` transitions break down as follows:
- Six were selected extremely late in the match; five reached the ordinary top-rope candidate selection step.
- At all five selection steps, **zero superplex variants were legal because attacker stamina was 0–19**. Temporarily substituting 100 stamina in a read-only legality probe made at least three, and usually all seven, physically eligible. The required position and late-match timing checks passed.
- Two other ordinary `top_follow` transitions (seeds **92809** at 83% and **99984** at 77%) were interrupted by separately scheduled scripted aerial spots before an ordinary superplex could be selected.
- The sixth late `top_follow` did not get a following normal top-rope move selection before another match event or reset.

The 500-bout candidate-pool instrument recorded **126 corner-step opportunities that offered `top_follow`**, but the hub was selected only **six times** in that context. The mean hub share when offered was about **6.4%**; the hub is competing against many other valid match-arc actions. All six selected hub entries occurred at approximately **89–99%** of the match. Also, `top_follow` itself costs only 1.8 stamina and is legal from 45% onwards, whereas committing a superplex requires enough remaining stamina for the much more expensive move. This can create plausible climb narration followed by no affordable follow-up.

**Confirmed organic exceptions, holdout sample:**
- **Seed 138717:** `sp_super_arm_drag`, commenced at 76% of a 12-minute story match, landed next tick.
- **Seed 147983:** `sp_superplex`, commenced at 54% of a 12-minute brawl, landed next tick.
- **Seed 159586:** `sp_super_ddt`, commenced at 85% of a 12-minute technical match, landed next tick.

All **seven** authored superplex variants were independently tested with real eligible wrestler/opponent pairings, `corner_whip → top_follow`, 100 stamina, 76% elapsed and at least ten seconds remaining. Each successfully passed the `isValid` gate, committed through `startGrapple`, resolved on the next tick via `resolveGrapple`, and recorded a landed move ID. Exact named counter eligibility during the pending attempt was also confirmed. Thus **no variant is structurally inaccessible**; the problem is insufficient *ordinary-match frequency and physically affordable opportunities*. Four variants had no organic commitment in these 1,500 bouts.

### Focused remedy to implement and evaluate separately

1. Create a constrained *earlier* superplex opportunity during appropriate stretch/top-rope-battle action (e.g. 55–85% elapsed), after a real corner setup, without scripting a particular outcome or boosting every superplex blindly.
2. Only offer/execute `top_follow` when **at least one** following superplex is physically legal *after the climb cost*, with enough time to resolve its named attempt. Preserve weight, agility, ownership, fatigue and variant-specific late windows.
3. Avoid having independently scheduled high spots silently supersede a newly staged top-rope contest. Either respect the committed setup or explicitly narrate an interruption.
4. Measure real variation by **organic committed attempts and their outcomes**, separately from scripted-spot landings; test individual counter/block parenthood and interrupted high spots. Verify on both paired cohorts, plus a holdout with mixed fatigue, against phase timing and the physical-state invariant. Do not force all seven into every 500 bouts or weaken safety costs.

## Finding B — DQ drift comes from changed foul opportunities; referee code is identical

The `dqHash`, `noDQ` and `referee` source segment was compared byte-for-byte across the baseline and pilot: **1,695 characters in each, identical**. The referee uses the deterministic `seed|ref|side|time` hash to decide whether a specific cheap shot is seen. A wrestler already warned is more likely to be watched. A subsequent seen offence can result in DQ if the player wrestler is below the professional-behaviour threshold and has been let off the leash, fired up or gone off script. This is the existing intended off-script incident path, **not a new PR #121 rule**.

| Paired measure | First 500 | Next 1,000 | Combined 1,500 |
| --- | ---: | ---: | ---: |
| Baseline DQs | 3 | 3 | **6** |
| Pilot DQs | 3 | 4 | **7** |
| Bouts where outcome ID switched between DQ and booked finish | 4 | 7 | **11** |
| Changes between two non-DQ finish types | 0 | 0 | **0** |
| Baseline `cheap_shot` events | 529 | 1,020 | **1,549** |
| Pilot `cheap_shot` events | 536 | 1,012 | **1,548** |

First 500 switched results:
- **90513:** booked `win_clean` → DQ in pilot; warning at 17:30, seen subsequent player foul at 19:40.
- **91825:** DQ in baseline → booked `win_clean` in pilot; final player cheap-shot moved from 14:40 to 15:00, changing its referee visibility hash.
- **100353:** booked `win_clean` → DQ in pilot; prior player warning at 09:00, seen subsequent foul at 16:00.
- **106913:** DQ in baseline → booked `win_clean` in pilot; new sequence did not reach the same warning-plus-seen-foul pattern.

In the independent holdout, the seven swapped seeds were **127237, 132075, 132854, 138266, 150033, 152534, 155035**. Of the four newly generated DQs, two lost baseline DQs; the DQ incidence is therefore nearly unchanged in aggregate. In **all 1,500 paired bouts**, only **11/1,500 (0.73%)** switched the actual outcome, and every switch involved a DQ. That is expected when the new move pool changes the timing and controller of dirty actions and the official's visibility rule is timestamp-sensitive.

**Recommendation:** No referee-rule change or attempt to preserve exact per-seed action transcripts. The game intentionally permits a booked match to end in a DQ if an off-script player wrestler is caught; editing the referee to force each previous seed's result would hide actual consequences. Preserve deterministic replay, correct rule/stipulation behaviour and clearly communicate why a warning escalated to a DQ. Recheck DQ rate, warning chronology and a realistic season-wide sample before release, rather than treating every changed DQ as a regression.

## Merge and verification decision

- The earlier **435 detailed-position mismatches in 222/500 bouts** were fixed on PR #121 and then measured at **zero across the same 500 seeds**; that position regression was never on `main`.
- The superplex positive control and all seven forced-legality tests pass, but ordinary high-spot variety is demonstrably too low. This warrants a separate, carefully bounded implementation rather than another broad graph expansion.
- The DQ incidence provides **no evidence of a new referee defect**. It is a legitimate, small distribution shift from changed action timelines.
- **Keep PR #121 draft. Do not merge this investigation as evidence that organic superplex variety is solved.** Require CI, deterministic paired/historical and holdout audits, counter/attempt tape review and a mixed-fatigue scenario before integrating the move-selection remedy.

## Applied follow-up: affordable organic top-rope pacing

**Implemented after the read-only investigation, 20 November 2026.** The earlier analysis and its original 1,500-match measurements above remain a historical before-state. No referee rule or finish contract was changed.

The normal graph now offers a stronger, bounded turnbuckle sequence in **resurgence** and **exchange**, as well as existing superplex-family arcs. A deterministic preflight checks whether at least one named superplex remains legal **after** the corner whip (when necessary), top-rope climb, estimated next-tick stamina drain, timing gate, weight/lifting limit and agility requirements. This lookahead restores all temporarily inspected match fields and does not advance the RNG. It never waives the ordinary move legality rules. A genuine `top_follow` with a valid move is allowed its next graph decision before unrelated scripted spectacle; named moves still go through the existing committed two-tick attempt, counter and block machinery. Scheduled nearfalls remain available afterwards.

**Paired run against the pre-pacing version of PR #121** (not versus deployed main), with the same first 500 and independent next 1,000 seeds described above:

| Measure | First 500 before → after | Holdout 1,000 before → after |
| --- | ---: | ---: |
| Completed matches | 500 → 500 | 1,000 → 1,000 |
| Organic named superplex attempts | 0 → **6** | 3 → **14** |
| DQs | 3 → 1 | 4 → 5 |
| DQ/booked outcome switches | 2 | 3 |
| Changes between two non-DQ outcomes | 0 | 0 |
| Scripted superplex attempts | 89 → 89 | 201 → 195 |
| Mean match-star change | +0.0035 | −0.0055 |
| Mean absolute star change | 0.0365 | 0.0395 |

Across both cohorts, **3 → 20** organic named attempts were observed, representing **six of the seven** variants: `sp_superplex`, `sp_hurricanrana`, `sp_powerbomb`, `sp_spider`, `sp_super_ddt`, `sp_super_arm_drag`. Outcomes were **18 landed, one blocked, one countered**. The seventh variant, `sp_avalanche_german`, remains available in the scripted and legal forced routes; no claim of organic seven-for-seven coverage is made. All 1,500 matches completed. Across **72,756 sampled graph decisions, zero physical-state mismatches** were found (ring/outside, solo/paired top owner and position). The Graph Lab validator now recognises explicitly registered superplexes as approved grapples, without weakening parent/sequence integrity checks.

The conservative variation target is improved, **not a promise to feature a high spot in every match**. This report does not substitute for CI and browser regression verification on the release commit.
