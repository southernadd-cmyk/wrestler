# Phase 5 — Ground Wrestling, Pinning Combinations and Near-Falls

**Status:** draft PR #129. Branch `feature/phase5-ground-pins-nearfalls-20261120`. No live deployment or merge.

## Goal

Advance the whole **20-move ground offence family** and **11-move pin family**, not a few showcase moves. Phase 5 preserves the 83 Phase 2/3 grappling parents, 14 Phase 4 neck grapples, and 46 standing/neck strike parents. The ground and pin families are now contested as physically valid actions, rather than allowing a generated escape or cradle reversal to appear independently of its attack.

## New engine behaviour

**Ground attack (20)**

- The attacker must have actual mat control and the **opponent** must be the downed wrestler (`position='mat'`, `down=other`). A downed wrestler cannot deliver a knee drop or stomp against themselves, and a loose grounded move cannot masquerade as an in-ring standing strike.
- The attack is resolved in a single contested exchange: a landing or an **exact-parent named dodge/reversal**. The opponent's reaction can prevent damage, while genuine moves still use the authored part/limb targeting, cost, style, stamina, crowd response and next graph edges.
- `gd_arm_elbows`, `gd_dragon_screw_ground`, `gd_lower_back_knee` and other targeting actions retain their existing grounded follow-up context.

**Pinning combination (11)**

- Small package, schoolboy, inside cradle, crucifix, sunset flip, victory roll, backslide, O'Connor-style rolling cradle, jackknife cover, La Magistral and bridging roll-up now have exact-parent escape opportunities.
- A roll-up must start from two standing participants **inside the ring**. The start guard rejects an already downed participant or an inconsistent floor/apron physical descriptor. Submission-only stipulations still prohibit pinfalls.
- **Nearfall credit is contingent on an actually landed cradle.** If the defender rolls through or counters, no near-fall or phantom referee count is awarded. The authored `ONE! TWO!` dialogue plays only on the successful pin action; the reversal has its own recorded narration.
- The agreed match finish is not overridden by a speculative two-count. Roll-ups are a near-fall event unless the existing scripted result contract says otherwise.

**Saved and inspectable action ledger**

New `contactAttempts` records have `seq`, attack ID, `kind` (`ground` or `pin`), attacking side, starting and resolution ticks, `outcome` and optional action ID. The event stores the linked `contactAttemptSeq`, `attemptedMove`, `contactResolution` and `contactKind`. A separate `pendingContact` is restored from a save if a contact exchange was intercepted mid-commit. Older saves default to an empty ledger. The sequence is never conflated with standing `strikeAttempts`, lifting `grappleAttempts` or aerial attempts.

All authored families and original node names stay intact. Phase 5 does **not** add a new timed tick to a simple mat strike or roll-up: both logically resolve in one exchange, preserving natural match pacing.

## Tests and quality gates

- `tests/phase5-ground-pins.test.cjs`: all **31** authored parents must land; all **31** generated reversals must be exact-parent, not free-standing; any existing authored blocks must also be exact-parent; all 11 countered pins must award **zero** near-falls; all 11 landed pins award exactly one. Explicit cases cover opponent-down versus attacker-down, already-grounded pins, submission-only matches, floor participants, interrupted attempts, prevention of duplicate commitment, and pending-contact save/replay.
- `tests/catalog.test.cjs`: physically performable generated reversals are probed **only after** a pending real contact attempt. Existing 95% independent-action requirement is unchanged.
- `tools/graph-lab/technique-position-audit.cjs`: a resolved exact-contact counter is recognised as post-clear under the same audit exception previously needed by aerial, strike and grappling attempts. Unexplained illegal positioning still fails.
- `tests/season-soak.test.cjs`: only completed, actually defended contact attempts add their parent move to genuine career variety; aborted or interrupted attempts never count.
- `.github/workflows/phase5-ground-pins.yml`: standalone complete family test and Phase 3/4 compatibility checks before the slow full Node regression. Existing match-quality A/B, browser, graph validation, career rivalry and curated technique workflows must remain green.

### Initial dedicated CI evidence

The Phase 5 gate [run #44753676728](https://github.com/southernadd-cmyk/wrestler/actions/runs/44753676728) succeeded:
- **31** correctly landed independent contact attacks
- **31** correct exact-parent counter results, **0** standalone reversals
- **0** phantom near-falls on defensive outcomes
- **95.7%** independent-action coverage over the fixed 1,000-match sample, exceeding the unchanged **95%** gate
- All Phase 3 and Phase 4 directed regressions passed

Full Node, Chromium and career/quality sign-off are separate required workflows. Never treat the focused gate alone as merge approval.

## Follow-up: judging match quality

The dedicated Phase 5 gate is now joined by a paired **500-bout tape review**: 100 identical wrestler pairings and seeds per Technical, Story, Brawl, Spot-fest and Safe plan, compared with merged Phase 4 commit `9fdacf0`. The two versions use the same planned finishes, alternating mid/main slots, four outcome types and seed series `61001 + 53*i`. Reproduce against a detached Phase 4 checkout with `node tools/graph-lab/phase5-quality-audit.cjs /path/to/phase4 > /tmp/phase5-tapes.json`; the JSON includes the plan totals and short contextual tapes. This review was run after the two near-fall narration clarifications below.

| Plan | Mean stars, Phase 4 → Phase 5 | Landed ground, Phase 4 → Phase 5 | Landed named pins, Phase 4 → Phase 5 | Near-falls per bout, Phase 4 → Phase 5 |
| --- | ---: | ---: | ---: | ---: |
| Technical | 2.982 → 2.960 | 174 → 183 | 53 → 31 | 2.90 → 2.70 |
| Story | 2.635 → 2.607 | 179 → 195 | 36 → 31 | 2.65 → 2.67 |
| Brawl | 3.060 → 3.058 | 178 → 168 | 50 → 37 | 2.73 → 2.63 |
| Spot-fest | 2.348 → 2.350 | 205 → 186 | 62 → 38 | 3.02 → 2.82 |
| Safe | 2.465 → 2.465 | 165 → 159 | 53 → 45 | 2.75 → 2.79 |

All **500/500** bouts finished with the same booked outcome as the Phase 4 match. The new ledger contains **1,259 real contact attempts**: **1,073 landed**, **186 exact-parent counters** and **0 interrupted** in this ordinary match sample. Those landings comprise **891 ground attacks** and **182 named roll-ups**. Ordinary pin landings declined from **254** to **182**, while total near-falls fell only from **2.81** to **2.72 per bout**. This is a consequence of the new physical and counter guards; the older generated defensive events could appear without a parent attack, so the raw counter totals across versions do not measure the same thing. No plan's mean rating changed by more than **0.028** stars. No near-fall call repeated three or more times within a Phase 5 bout in this sample.

The recorded tapes show a clothesline leading into a grounded back rake (Technical seed `61001`), an arm drag setting up a running senton (Story seed `61054`), a backslide after a counter-strike (Technical seed `61054`), and a near-fall crucifix in the late match (Spot-fest seed `61054`). The inside cradle and rolling cradle originally ended with an ambiguous count; both now explicitly say the defender escaped. These are sample observations, not a claim that every seed has an authored ground-to-pin chain. Continue watching live match reports for repetition and awkward transitions after merge.
