# MP5A — grounded proposal evidence

This is a read-only contract, not a new live policy. MP4B initiative and
MP4A reactions remain exactly as before. No new save fields.

OfficeRoom.proposalEvidence(room, objectiveId, actionId) accepts an
existing named call or a same-owner alternative from the current
structure cards. It validates current legality, limits and the
Director's compatibility predicate for both calls. Illegal or
incompatible original calls require the existing repair workflow.
It rejects invented cards, unknown actions and non-structured rooms.
Evidence records IDs, booked result/route, objective window and raw
graph fields: risk flag, cost, crowd, required position, earliest
timing, agility, lift, familiarity and conditional finish support.

OfficePlanningFuzzy.proposalValues(evidence) supplies a separate,
versioned set of proposal-specific axes, never mutating the baseline
worker observation. These are explicit game-design mappings:
- proposalRisk: 20 unflagged / 75 flagged; missing remains null.
  This is ordinal hazard evidence, not probability of injury.
- structureCompatibility: 100 for a validated call, not evidence of
  completed objectives, guaranteed positioning or successful execution.
  Eligibility is a hard gate and is not negotiable.
- creativeBenefit: relative authored crowd effect; 50 means no change,
  +/-5 graph points maps to the 0/100 ends. Not a prediction of crowd
  response. Cost and finish support deltas remain separate.
- proposalFairness: null. A same-owner substitution cannot establish
  equitable allocation of credit, workload or concessions.
- sequenceDifficulty: null. The room has not proposed an ordered
  sequence of transitions. Cost/position/agility/lift are recorded
  rather than misrepresented as sequence complexity.

Professional trust remains unknown. No added curves, no changes to
the 79 behaviour rules, no rule-based acceptance, no new workflow.

The 80-room audit covers four structures, five plans, both leads and
both results, actual card evidence, prohibited calls, deterministic
JSON replay, missing fields, and immutable room state. The next slice
can introduce grounded proposal inference and explicit fairness and
sequence evidence as those contracts become available.
