# MP3 — full-roster shadow inference

Extends the existing MP0B audit, without changing the player decision
policy or production scripts. The dormant MP2C model observes the real
room before each selected action and once after signing. Each of the
200 identities is the focus in four meetings (800 total), across the
four structures, five plans, both sides and lead roles. The academy
intake is a synthetic roster fixture, not a single live career season.

The audit captures original participant and career evidence once per
meeting; inference must not mutate the room or career capture. Existing
signed-outcome, legal objectives, graph validation, transcript and
save/resume checks still run. The same evidence snapshot is serialized
with the room at 200 existing replay checkpoints, and inference must
match exactly at the checkpoint and signed sheet.

## Measurements

- Pre-action stage distributions for all eight outputs; these samples
  are length-weighted, not equally weighted across identities.
- Final distributions over 800 focus observations, balanced at four
  per identity, partitioned by established/academy, side, structure
  and plan. Report mean, population SD, range and empirical p10/p50/p90.
- 79 rule activation counts, mean activation conditional on firing,
  and mean fraction of the fired rule weight for its output (excluding
  the neutral prior). Zero-use rules are reported, not silently removed.
- Input missingness and cue presence across all observations.
- Four-meeting mean vector per identity; nearest other owner distance
  and within-owner variation measured as RMS difference across the eight
  0–100 outputs. Report count of nearest neighbours within 5 score
  points (a diagnostic convention, not a clinical or validated cutoff).
- Pearson correlation across 200 owner means to identify outputs that
  may be redundant under this sampling design.
- Six paired numerical interventions on each of 800 final observations:
  consent versus cooperation; ego versus assertiveness, ambition and
  protectiveness; fatigue versus caution and improvisation. Hold other
  inputs and cues fixed, verify the expected sign, report delta magnitude.
  These are model sensitivities, not causal effects on game decisions.

The pre-action policy is the legacy deterministic MP0B sampling policy.
Neither observed scores nor hypothetical interventions affect choices.
The pairing and structure order are not fully counterbalanced; group
and structure differences are descriptive, not causal. Career histories
are sparse in this fixture, so rare injury/adaptation rules may be
unobserved; MP2A/C explicit evidence fixtures remain the positive tests
for these rules. No blanket minimum rule-use gate.

Run the existing planning-roster-audit.test.cjs; logs are prefixed
MP3 shadow distributions, MP3 rule utilisation, and MP3 owner means.
PLANNING_AUDIT_JSON optionally includes the shadow summary with the
original transcripts. No new workflow or separate duplicate roster run.

## Calibration gate

Use actual CI results to assess compression, correlated outputs, low
sensitivity, rare-rule coverage and academy/established differences.
Do not change weights merely to make distributions uniform. Follow up
with targeted matched fixtures and tune only demonstrable shortcomings
before MP4. No live inference policy, new dialogue or persistent state
in this PR. Measurements are pending CI, not claimed as results.
