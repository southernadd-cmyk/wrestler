# MP2B — creative tendencies

Extends the same shared Sugeno model with 25 rules (58 total).
The existing 33 rules and their outputs are unchanged.

| Output | Input | Low / medium / high singleton | Weight |
| --- | --- | --- | --- |
| Ambition | Ego | 30 / 55 / 85 | 2 |
| Ambition | Morale | 40 / 55 / 75 | 1 |
| Protectiveness | Ego | 25 / 55 / 85 | 2 |
| Protectiveness | Ring psychology | 35 / 55 / 80 | 1 |
| Flexibility | Professionalism | 25 / 60 / 85 | 2 |
| Flexibility | Ring psychology | 20 / 55 / 90 | 2 |
| Flexibility | Ring ability | 30 / 55 / 80 | 1 |

Additional rules:
- Existing title, push or stage career goal: ambition 90, weight 2.
- Existing respect-for-the-work career goal: ambition 85, weight 2.
- Actor booked to lose: protectiveness 80, weight 1.
- Actor's recorded humiliation memory against this opponent:
  protectiveness 90, weight 2.

Ambition is appetite for creative initiative or visibility in the room,
not the intensity or satisfaction of the career goal itself. We capture the
existing career ambition directly from the supplied save, with its
kind, since and satisfaction (including explicit zero). Do not initialize
missing ambitions or interpret a money/body/rivalry/mentor goal as lack
of ambition. Goals dated after the booking are excluded when comparable
dates are available. Old v1 snapshots without careerGoal still work.

Protectiveness means protecting the actor's credible portrayal, not
medical caution or opponent hostility. The contracted finish is read
directionally; this rule does not authorize a change to the result.
Flexibility means willingness/capacity to adapt a workable layout, not
consent to every proposal. It is deliberately independent of ego and
current fatigue; caution and hard safety rules still matter separately.

The weights are provisional design hypotheses. All six scores remain
independent, with null for unsupported outputs, deterministic rule traces
and the unchanged shared neutral prior. Professional trust and proposal
scores still have no invented numeric inputs. No production loading,
dialogue, policy, save, promo or workflow changes.

The extended tests check 606 monotonic samples, 101 exact MP2A-output
and rule-trace parity cases, real goal capture, booked loss orientation,
historical memory direction, replay, and six-output inference on the
existing 400 participant fixtures. MP2C adds mentorship and improvisation.
