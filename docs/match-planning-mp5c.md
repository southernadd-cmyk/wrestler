# MP5C — relative allocation and concessions

MP5B CI: 617 proposals / 1,234 independent assessments, 56/82 rules
observed; acceptance 46.19–84.66 (mean 75.38), reservations
17.36–77.30 (mean 24.22), counterproposal 19.54–68.42 (mean 33.14).
Unobserved rules are not necessarily defects. Calibration remains MP5E.

The board evidence now includes named actions, owners, authored crowd
effect and performer cost for each objective. Only a complete four-call
layout with legal compatible moves, both owners represented, known
cost/crowd values and nonzero denominators supports the scoped score.
Missing/open/invalid calls remain unknown. Existing standalone MP5A
proposalValues intentionally still returns unknown fairness.

For each wrestler, visibility is the sum of ABSOLUTE authored crowd
effects of their named calls (negative heel reactions still count).
It is an opportunity proxy, not actual personal credit. Effort is the
sum of positive authored performer costs. It is not recipient pain or
total physical exertion. Compare relative visibility share after vs
before, and own absolute effort change divided by total original
effort. Score = clamp(50 + 100*(visibility share change - normalized
own effort change), 0, 100). 50 means no net change relative to the
existing layout, NOT an objectively fair match. A one-sided layout is
not presumed unfair and a protected loser is not entitled to equal
offence. The partner is never assigned fictitious extra effort.

Separate trade-off labels expose more/less visibility and effort,
potential concessions/gains; these are not accepted agreements.
Actual prior legacy negotiation records are summarized directionally
from the captured ledger: recorded requests, changed calls, changed
calls achieved/adapted. After-bell angles and records without original
and final calls excluded. No debt, blame, reciprocity inference or
automatic obligation. History is diagnostic only, not a rule input.

Seven new rules use low/high relative allocation to modify proposal
acceptance, reservations and counterproposal inclinations (including
protectiveness). At 50 the rules do not fire. Missing is not neutral.
No new curves, live negotiations, save fields, consent override, finish
change or new workflow. Sequence difficulty remains unknown until MP5D.

Tests cover asymmetric layouts, neutral substitutions, heel reactions,
role separation, cost-only concessions, incomplete/mismatched evidence,
actual recorded history, 80 live room scenarios and deterministic replay.
