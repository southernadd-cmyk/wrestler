# Promo fuzzy behaviour — F1 foundation

Baseline: R7, PR #418, workflow 45784826016, 1,600 scenes with 200 focus
workers and 7,154 sampled emotional states. All 960 academy focus scenes
had adaptive stance; only 5 interruptions, 15 refusals and 211 pauses.
497 rolling-history repeats, 0 within-scene repeated focus lines.
Own banks 725, shared 336, composed 565, graph/director 3,448 out of 5,074
focus utterances. Semantic linkage 676/735; remaining 59 include settlement
and unclassified acknowledgements (not established semantic errors).

## Membership design

Eight pure numerical axes, each with overlapping low / medium / high
piecewise-linear grades on 0–100. The three knots mean low plateau end,
medium peak, high plateau start. At midpoints between knots two sets
are equally active. These are membership degrees, not probabilities.

| Axis | Knots | Source |
| --- | --- | --- |
| Irritation | 15, 40, 70 | Director emotional state |
| Composure | 25, 50, 75 | Director emotional state |
| Ego | 25, 50, 80 | Scene participant or existing worker stat |
| Professionalism | 30, 60, 85 | Scene participant or existing worker stat |
| Ring psychology | 25, 50, 80 | Worker psych |
| Microphone | 25, 50, 80 | Worker mic |
| Rivalry heat | 15, 45, 75 | Existing feud heat |
| Momentum | 25, 50, 75 | Signed duel meter, oriented to speaker |

R7 reported 1,257 irritation observations at 30–44, 80 at 60–69 and
1,522 composure observations at 25–44. Curves deliberately overlap near
the existing crisp thresholds. Other knots are provisional design
choices, not fitted statistics; F7 calibrates using paired scenarios.
Unknown input stays null; finite out-of-range input clamps. No invented
ambition/respect/vulnerability numbers: F2 will use existing categorical
identity traits and explicit conversational signals. Momentum is not
crowd approval, which is a distinct future input. F1 introduces no rule
outputs, behaviour changes, new persistence fields or new bank content.

F2: bounded rule inference over continuous memberships plus identity
traits. F3: preference scores applied only to already semantically valid
candidates. F4: bounded emotional updates. F5: optional pacing and events.
F6: manager and audience influence. F7: paired R7 scenario comparison
plus qualitative transcript review. Evidence, match commitments, memory,
role and slot compatibility remain hard constraints throughout.
