# MP3B — audit correction before calibration

## Measured MP3 results

PR #434 regression job 139879087631, head
6299ddc6d7a9bae3ef8ae6db6787af1e41a91b4b: 6,975 observations,
800 final profiles, 200 resumes, 64 of 79 rules fired.

| Output | Mean | SD | P10 | P90 |
| --- | ---: | ---: | ---: | ---: |
| Cooperation | 71.097 | 7.016 | 61.472 | 80.694 |
| Assertiveness | 59.180 | 12.274 | 41.561 | 75.578 |
| Caution | 31.368 | 4.293 | 25.769 | 38.077 |
| Ambition | 62.671 | 9.796 | 47.813 | 75.938 |
| Protectiveness | 59.725 | 11.413 | 43.240 | 74.219 |
| Flexibility | 62.600 | 12.410 | 47.987 | 81.971 |
| Mentorship | 60.937 | 12.890 | 45.577 | 81.250 |
| Improvisation | 59.094 | 14.374 | 42.548 | 81.129 |

Nearest owner-mean RMS distance averaged 1.713; all 200 were within
five points of another identity. Mean within-owner variation was 0.490.
Flexibility/mentorship correlation 0.984; assertiveness/protectiveness
0.974; caution/improvisation 0.942.

The sampling schedule used the same parity for focus side and booked
winner, so every focus wrestler was booked to win. The loss cue never
fired. All sampled fatigue was at the low shoulder; no recorded career
goals, prior injuries or adapted deliveries were observed. The uniform
fatigue also explains why high skill increased both caution and
improvisation in these data. Numerical matched fatigue interventions
already gave mean caution +46.154 and improvisation -8.871.

These are measurement limitations as well as possible model weaknesses.
Do not fit weights against this confounded distribution.

## Corrected audit

The new 800-meeting schedule keeps every identity's four structures and
both sides, but orthogonally balances booked wins/losses: one of each
on each side for every wrestler. Explicit assertions enforce all four
cells per identity and 200 per overall cell. Contract, legal objective,
graph, transcript and resume invariants still run. New dialogue counts
cannot be directly compared with the old all-winning MP0B schedule;
the original results above are retained as a historical baseline.

A separate matched evidence stress suite runs against one actual signed
room per identity. Twelve comparisons each (2,400 comparisons total)
exercise medium/high fatigue, low morale/consent, current/prior injury,
humiliation, title/respect/mentor goals and previous negotiated adaptation.
Each intervention uses isolated original-worker copies, an isolated career
fixture or a cloned room. These are explicit hypothetical evidence
fixtures, not observed career prevalence or live decisions. The audit
reports signed deltas and requires combined natural/stress activation
of all 79 rules, with provenance checks. Goals are injected through
the existing stored ambition shape, not through a new stats system.

No inference weights changed. Once CI provides these corrected measures,
evaluate remaining correlations and weak sensitivities with targeted
calibration; do not mistake contextual variation for character identity.
Professional trust and proposal-specific scores remain unavailable.
No additional workflow or production changes.
