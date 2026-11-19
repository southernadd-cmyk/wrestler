# Phase 9 — Match-quality P0 patch

**Draft PR #107**, stacked on unmerged Phase 9 PR #106. This is a **quality repair**, not another move catalogue expansion. None of these changes is live.

## Problems reproduced in the reviewed Phase 9 version

A fixed 500-bout review identified:
- 499/500 matches repeated at least one full commentary line three times or more.
- One 20-minute match repeated its off-layout warning 24 times.
- Spectacle matches and Spot-fest cards often became exhausted yet continued attempting automatic high-risk spots; the same tired-legs sentence could recur over a dozen times.
- Finishing threats were narrated in the opening section of matches, including at the 10-second mark.
- Spot-fest averaged roughly two stars despite high spot counts and heavier fatigue / risk.
- Event-rich wrestling and a four-star rating did not guarantee an interesting transcript.

## This patch changes

1. **Off-script alerts:** the agent records the off-script state as before but announces it only on an appropriate state transition or after an eight-minute reminder window. Persistent reminders do not fill the commentary feed.
2. **Exhaustion:** automatic special-spot likelihood falls at low stamina and becomes zero below 28. A manager-forced big spot while exhausted can still fail, but produces at most one warning per performer per 160 simulated seconds and enters a short slow/recovery phase. Safety calls, botches, injuries and manager interventions are preserved.
3. **Stamina:** Spot-fest stamina drain is lower for performers with demonstrably high combined ring and safety skill; inexperienced performers still incur the original full drain, and high-risk botch probabilities were not reduced.
4. **Finish timing:** generic finishing teases and their counter moves cannot appear before 55% of the booked match. The contractual finish logic, near-fall restrictions and legitimate earlier defensive manoeuvres stay separate.
5. **Repetitive filler moves:** crowd posing or another finish tease within 300 seconds is still allowed if selected, but receives much lower weight.
6. **Narration variation:** multiple original formulations for the high-frequency *escalation, exchange, near-fall, hope and finish setup* arcs; rotated recovery-to-standing narration; varied top-rope preparations, crowd poses, illegal strikes, standing resets and rest beats. No graph action is suppressed simply to make the transcript look better. Narration variation consumes no additional random calls and is stored alongside the match for save/replay.

## Observed fixed-seed preliminary 100-pairing comparison

| Plan | Pre-fix mean rating | First P0 pass |
|---|---:|---:|
| Technical | 2.67 ★ | 2.70 ★ |
| Story | 2.31 ★ | 2.32 ★ |
| Brawl | 2.69 ★ | 2.75 ★ |
| Spot-fest | 1.99 ★ | 2.07 ★ |
| Safe | 2.15 ★ | 2.17 ★ |

Spot-fest still underperforms: a conservative quality recovery is **not** a balancing success. The first pass eliminated repeated automatic tired-leg warnings and premature finish teases in the matched scenarios and reduced off-script announcements from roughly 3.7 per match to under two; the later expanded narration/cooldown edits are checked in CI against the same pinned revision.

A separate complete-transcript comparison over the same 500 paired matches shows measurable improvement but **not total elimination** of repetition:

| Transcript measure | Before | P0 patch |
|---|---:|---:|
| Mean distinct phrases repeated three or more times per match | 7.82 | **3.34** |
| Matches with at least one phrase repeated ten or more times | 84/500 | **4/500** |
| Matches with any phrase repeated three or more times | 497/500 | **467/500** |

The remaining 467/500 proves that the commentary library still requires deeper treatment. Pin-count phrases like “ONE!” and “TWO!” are intentionally excluded from this exact-phrase comparison by the 15-character minimum. The release A/B now gates both overall repetition and extreme spam.

The **new quality A/B** uses 100 identical pairings under each of the five plans (500 bouts on each revision, 1,000 total) and pins pre-fix Phase 9 commit `bfc9af6306657e59cf400cb3cbb7cb59c3579666`. It validates rating stability, real botch risk, fewer off-script/exhaustion warnings and legal timing. Full Node/browser, five-rivalry, five-week career and Graph Lab regression checks are required.

## Not fixed in this patch

- A named manoeuvre narrated through `special_spot` does **not** automatically become the corresponding named graph action; one authoritative event vocabulary requires separate work.
- The final star-rating formula is unchanged. It still only weakly reflects spectacular move sequences and sometimes awards four stars to repetitive storytelling. Do not artificially add a style-based star bonus to conceal this.
- The match-plan risk/reward spread remains uneven; a later balanced change should be grounded in representative high-skill and low-skill wrestler cohorts and full match tapes.
- Late scripted counters, injury pacing, ring geography and cause-and-effect of planned finish setups need deeper review.

## Reproducibility

```sh
node tests/match-quality-p0.test.cjs
# With pinned pre-fix source checked out to ./quality-reference:
node tools/graph-lab/compare-match-quality.cjs quality-reference > match-quality-ab.json
```

Do not merge based on star averages alone: inspect representative transcripts and look at observed variance, injuries, crowd response, scripted-vs-graph move activity and quality of the finish.
