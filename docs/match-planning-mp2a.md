# MP2A — initial behavioural inference

The shared Sugeno kernel now evaluates three independent, continuous
planning tendencies. These are scores, not probabilities of accepting
a proposal. They are not new wrestler stats and do not sum to 100.

| Output | Input | Low / medium / high singleton | Weight |
| --- | --- | --- | --- |
| Cooperation | Consent | 15 / 55 / 90 | 3 |
| Cooperation | Professionalism | 25 / 60 / 85 | 2 |
| Cooperation | Ring psychology | 35 / 55 / 75 | 1 |
| Cooperation | Morale | 30 / 55 / 75 | 1 |
| Assertiveness | Ego | 20 / 55 / 90 | 3 |
| Assertiveness | Ring psychology | 25 / 55 / 80 | 1.5 |
| Assertiveness | Ring ability | 30 / 55 / 75 | 1 |
| Caution | Fatigue | 15 / 60 / 95 | 3 |
| Caution | Safety ability | 35 / 55 / 75 | 1 |
| Caution | Ring psychology | 30 / 55 / 75 | 1 |

Three additional rules:
- High professionalism AND high ring psychology: constructive
  assertiveness 85, weight 1.
- Current positive injury duration: caution 100, weight 4.
- Recorded own injury against this opponent: caution 90, weight 2.
  This is either an actual hurt memory or a non-legacy ledger injury.
  It is not evidence of blame or deliberate harm.

Total: 33 rules. The existing neutral prior (50, weight 0.2) applies
only where at least one rule fires. Unobserved inputs do not supply
neutral or low evidence. Public heat, personal regard, symmetric
bonds, microphone skill and uncalibrated proposal axes do not affect
these three outputs. High ego can coexist with high cooperation;
caution does not imply refusal or physical incompetence. Higher
safety ability increases awareness of risk, not a hard risk threshold.
These are design hypotheses, not fitted coefficients.

`OfficePlanningFuzzy.behaviour(snapshot,room,side)` returns v1
observation, explicit evidence cues, scores and fired-rule traces.
The snapshot is the previously captured MP1C evidence; the current
room supplies effective consent. No mutation or RNG, no live policy
or dialogue selection, no save schema changes. Hard safety, legal
moves, booked result and physical graph authority remain untouched.

Tests include 303 monotonic samples (consent, ego, fatigue), missing
data, independent outputs, positive injury provenance, no heat/bond
shortcut, JSON replay, and inference over the existing 400 participant
fixtures from the full 200-character roster. The next phase extends
the model with ambition, protectiveness and flexibility.
