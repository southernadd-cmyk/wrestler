# MP1B — planning-specific memberships

The planning domain uses the existing Sugeno kernel, four canonical
worker curves and eleven version-one planning curves. The knots are
provisional design parameters, not fitted statistics. Low/high are
shoulder trapeziums; medium is triangular.

| Axis | Knots | Required evidence |
| --- | --- | --- |
| consent | 30,60,85 | Effective room consent (20–95), not morale |
| fatigue | 20,45,75 | Current participant fatigue |
| safetyAbility | 45,70,90 | Actual worker safe stat |
| ringAbility | 40,65,85 | Actual worker ring stat |
| professionalTrust | 25,50,80 | Directional professional relationship evidence |
| morale | 30,55,80 | Actual worker morale, not room mood delta |
| proposalRisk | 20,45,75 | Explicit proposal-specific risk assessment |
| proposalFairness | 25,50,75 | Explicit proposal assessment from the actor's perspective |
| sequenceDifficulty | 25,50,80 | Explicit sequence-specific assessment |
| structureCompatibility | 25,50,75 | Explicit fit to dramatic objective and selected approach |
| creativeBenefit | 25,50,80 | Explicit actor-specific creative benefit assessment |

Consent and fatigue retain the knots from the original shared-kernel
planning proof of concept. The remaining knots follow the agreed
provisional planning design; calibration follows evidence collection
and shadow inference. Missing evidence remains null. No relationship
history is not equivalent to low trust, and storyline heat must never
be substituted for professional trust. Proposal axes are reserved
until a defensible assessment contract exists: no invented scores,
no conversion of categorical legality into a probability. Physical
legality, restrictions, and the booked result remain hard gates.

The factory includes all fifteen axes by default, with immutable
knots and no per-model overrides of canonical or versioned planning
curves. Additional non-conflicting domain axes are still supported.
All of this remains dormant outside tests. No production script
loading, evidence adapter, live rules, dialogue or save changes.
The expanded existing test sweeps 2,651 planning and 964 shared
membership observations; it checks partition sums, bounds, smoothness,
missing inputs, cue spoofing, clamping and unchanged promo curves.
No new workflow. MP1C will establish the real evidence adapter.
