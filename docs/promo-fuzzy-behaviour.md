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

## F2 — behavioural inference (shadow-only)

Six independent 0–100 drives: aggression, respect, defensiveness,
assertiveness, vulnerability (expressed openness/exposure, not a clinical
state), and showmanship. Uses a zero-order Sugeno system with minimum
conjunction and weighted singleton averaging, plus a small neutral prior
(weight .2, singleton 50) when evidence exists. No active rule means
unknown/null. Rules and activation traces are exposed for debugging.
Exact 12 academy tactics provide categorical cues; unmatched established
tactics use a weaker style cue, not a hard class. Exact reviewed delivery
labels provide reserved/reflective cues. No fabricated numeric identity
traits or inferred insult, crowd support, or recognition event: the four
optional scene signals must be explicitly supplied. F2 does not connect
them to live events yet.

Rule weights and singleton values are provisional design choices.
The roster test evaluates four emotional conditions per worker (800
inferences) and reports ranges, distinct outputs and rule utilisation;
these are synthetic stress conditions, not observed live frequencies.
Existing F1 tests still check exact gameplay/resume parity. F3 will
consume these scores only within hard-eligible dialogue candidates.

## F2 shared psychology architecture

The mathematical kernel lives in `assets/js/psychology-fuzzy.js`
(`OfficePsychology.createModel`), not in the promo director. Each domain
supplies named membership curves, independent outputs, immutable rules,
and explicitly sourced numeric values or graded categorical cues.
`workerInputs` and `workerCurves` share existing stat meanings;
`scale` maps signed or other documented scales without guessing unknowns.
The kernel returns bounded scores and rule traces; it does not choose an
action, mutate a wrestler or create career facts. Promo F2 is a domain
adapter over this kernel; all 47 rules and existing curve values remain.

Future match planning can supply effective consent, fatigue, actual trust,
mood and known proposal constraints from its existing room snapshot;
booking talks, locker-room relationships, ambitions, training and ringside
decisions can each define their own evidence and consequences. A single
global aggression score is not persisted across systems: context matters.
Shared actor stats and durable relationship/memory records stay authoritative.
Snapshot a model version and relevant input facts when a future live domain
opts in, so resumed scenes remain reproducible. Hard rules (physical move
legality, injury/safety limits, agreed finishes, contracts, factual dialogue,
player decisions) always gate candidate actions before fuzzy preference.

The test uses a small illustrative planning model on 160 real agents-room
participant snapshots and a separate bargaining model. These are test-only
policies, not approved production tuning. No changes to planning or booking
behaviour, no new career state fields. Follow the promo F3–F7 sequence;
then add a separate versioned match-planning domain policy, followed by
other systems individually with paired regression tests. Do not duplicate
the kernel or silently substitute fuzzy values for physical constraints.

## F3 — live dialogue preference

New full-format semantic promos started from the live UI explicitly opt in
to F3 (`fuzzy:true`); older snapshots and default engine callers keep the
prior policy, so the existing R7 audit remains a reproducible baseline.
No mouthpiece or programme scene opt-in. Versioned stable worker stat/style
snapshots are embedded at scene creation. At each authored selection the
current director emotion and oriented meter feed the shared inference model.
Only already eligible fresh candidates can be weighted, within the same
owner and relevance tier. The category preference uses existing editorial
metadata and a deliberately weak 0.75–1.25 weight; it does not reinterpret
the content of the line. Reviewed rookie semantic and vow pairs use a
bounded 0.15–0.85 preference for the existing direct/reflective alternative,
blending delivery identity and current drives. Legacy crisp preferences
are preserved when the flag is absent. Recorded facts, unapproved variants,
commitments, recent ID guards and all selector precedence remain hard gates.
No changes to the graph, event pacing, emotional updates or mechanical
outcomes. This is a first narrow integration; graph fallbacks and single
eligible lines cannot gain variety through ranking. Tests compare 800
paired scenes with 200 save/resume round trips, and exercise conditional
ranking and shared alternative guards. F4 will address emotion trajectories.
