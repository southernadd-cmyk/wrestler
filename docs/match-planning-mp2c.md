# MP2C — mentorship and improvisation

Extends the existing model by 21 rules, for 79 rules across eight
independent outputs. The preceding 58 rules are unchanged.

| Output | Input | Low / medium / high singleton | Weight |
| --- | --- | --- | --- |
| Mentorship | Professionalism | 20 / 55 / 85 | 2 |
| Mentorship | Ring psychology | 20 / 55 / 85 | 2 |
| Mentorship | Safety ability | 30 / 55 / 80 | 1 |
| Improvisation | Ring psychology | 15 / 55 / 90 | 3 |
| Improvisation | Ring ability | 20 / 55 / 85 | 2 |
| Improvisation | Fatigue | 80 / 55 / 25 | 1 |

Additional rules:
- Existing mentor career goal: mentorship 95, weight 3.
- Veteran paired with Rookie or Prospect AND high professionalism:
  mentorship 85, weight 1.5.
- Prior recorded negotiation requested by the actor with delivery
  marked adapted: improvisation 85, weight 1.

Mentorship is a tendency to guide a partner, not a judgment of age,
rank, or experience alone. Tier is copied from the original worker
object, never inferred from age or a default-filled room snapshot.
Unknown tier does not trigger the pairing cue. Old v1 snapshots
without tier remain supported.

Improvisation reflects ability to adapt a sequence, not a desire to
ignore the agreed finish, consent, or safety restrictions. A past
adapted delivery is modest evidence of a negotiated sequence that
was adapted by the pair, not proof of individual causation. Only
the recorded requester receives this cue. Missing or missed delivery
is not treated as a successful adaptation.

The 79 rules use the same shared kernel, provisional weights and
neutral prior as the previous phases. No new wrestler stats,
independent psychology engine, live policy or save format changes.
Tests cover 808 monotonic samples, 202 previous-output parity cases,
directional mentorship and adaptation evidence, missing tier and
JSON replay. The existing 400-participant fixtures evaluate all
eight outputs through the unchanged generic checks.

MP3 will measure distributions, separation, rule activation and
coverage across the complete roster and real room states in shadow
mode, before any decision policy consumes these scores.
