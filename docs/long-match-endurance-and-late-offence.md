# Long-match endurance and late offence: earned recovery, real finishing attacks

**Scope:** The Office wrestling match engine, Brawl and Spot-fest match plans in 15+ minute bouts. This is a bounded follow-up to the five-plan read-only audit (PR #157), using the merged Safe scripted-spot rules as its base. No changes to the Safe, Technical, or Story match plans.

## Why

The 18-minute match-tape audit exposed a consistent distinction between **events occurring** and **genuine late offensive variety**. Workers could reach the final three minutes with too little stamina to pay for authored named attacks. An expanded move pool often drowned out a legitimate rest hold or a low-cost named attack. Simply increasing star ratings, silently refilling stamina, waiving physical gates, or forcing a scheduled high spot would conceal rather than fix these problems.

## Changes

**Conditioned Brawlers** (real Brawl style, conditioning skill >= 0.70) may choose an already-authored in-ring breather or a legally controlled grounded rest hold during the 660-to-180-seconds-before-bell runway. Only after performing that real action can the rest hold recover extra stamina, and only a genuinely performed rest starts a saved, finite 180-second lower-exertion pacing window. The rest remains a weighted choice against other legal attacks; maximum three explicitly promoted rests, with a 100-second cooldown. The setup cannot be selected with the opponent standing, the wrestler on the floor, or a committed move pending. Move costs, counters, normal legality, and booked outcomes are untouched.

**Competent but not elite Spot-fest flyers** require authentic Spectacle style, ringcraft >=70, safety >=65, and recovery training between 0.30 and 0.70. An existing legal in-ring rest before the final three minutes may likewise earn a temporary movement-pacing window. In the last 180 seconds, if the wrestler is standing with 18–36 stamina, *already present*, non-risk, affordable (cost <=2.2), authored named lucha/strike/neck attacks can compete for a bounded probability share. A named move must still be physically eligible and actually selected and performed; a counter can still occur. Repeated landed move IDs are not promoted again in that closing window.

**Elite aerial performers are deliberately excluded** from the competent-flyer fallback, retaining their already validated separate aerial setup and landing logic. Less-trained flyers receive none of these new rewards. There is no new match-plan attribute, no invented move, no unearned near fall and no automatic stamina refill.

## Deterministic matched A/B evidence

**2,880 completed real OfficeMatch bouts:** 1,440 baseline plus 1,440 candidate. Four genuine worker identities (Brawl/Brick, Technical/Ezra, Story/Sol, Spectacle/Nico), three skill treatments, 8/12/18-minute matches, four opponents, two seeds, five plans. Identical match conditions and booked finishes for each before/after pair.

- **Exactly identical match tapes:** 1,248 pairs comprising all Safe, Technical and Story plans, and all 8- and 12-minute Brawl and Spot-fest bouts. Comparison includes event ledger, commentary, ratings, scripted attempts, stamina and outcomes.
- **Actual finish legality:** all 2,880 outcomes matched the booked contract, with zero unverified scheduled nearfall sources. The engine's source-to-cover, aerial commitment and match-legality rules were not changed.
- **18-minute Brawl, 96 bouts per version:** average bell stamina **13.46 -> 13.61**, exhaustion below 25 **87.5% -> 85.4%**, distinct late named actions **1.19 -> 1.31**. Brawl remains demanding.
- **18-minute Spot-fest, 96 bouts per version:** average bell stamina **16.14 -> 16.42**, exhaustion below 25 **81.3% -> 80.2%**, distinct late named actions **0.83 -> 0.94**. High-risk moves still carry original cost and danger.

**Focused native-style 16-bout cohort per tier** (separate seeds): elite Brick under Brawl improved from **18.98 to 21.78** bell stamina and **2.69 to 3.19** late named moves; competent Nico under Spot-fest improved **14.79 to 17.92** bell stamina and **0.25 to 0.75** late named moves. Novice and competent Brick, and novice and elite Nico retained identical tape evidence in this focused cohort. Do not treat 16 matches as a population estimate or a reason to promise every 18-minute main event can be worked safely.

## Directed regression and acceptance

Run `node tests/long-match-endurance.test.cjs` to confirm:

- An elite Brawler must *actually perform* a physically valid grounded headlock to gain stamina, with a recorded negative exertion and persisted pacing state.
- A novice Brawler or an elite worker in a 12-minute match does not receive the extra recovery.
- A fatigued competent flyer gets a meaningful but non-compulsory legal low-cost named attack, not a made-up high spot or an unaffordable 450 splash.
- Elite flyers and shorter matches retain separate unboosted fallback selection.
- 32 real matches finish with correct contracts, real recorded near falls and authored closing offence; graph validation remains clean.

**Remaining limitation:** long Brawl/Spot-fest matches are still physically exhausting, especially with mismatched styles or low skills; this update is a conservative incremental correction, **not a blanket solution** to every late-match pacing issue. Technical and Story endurance and repetitive commentary remain separate investigations. A further major pacing change should be based on a fresh all-five-plan audit, not silent direct score or stamina edits.

**CI policy:** no additional workflow or broad per-commit regression suite is introduced. Existing targeted PR tests and main-branch integration tests remain the source of automatic validation.
