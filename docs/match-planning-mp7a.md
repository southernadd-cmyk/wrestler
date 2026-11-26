# MP7A — discover connected conditional move chains

MP5D validates explicit sequences of two to six graph actions and
measures sequence difficulty. MP7A discovers candidates automatically
for a legal named objective call, with its performer and booked result
unchanged. This is a read-only capability, not a new live match rule.

Reverse positive-edge search explores distinct chains of two to four
moves, with position compatibility prefiltering, a bounded beam of 24,
at most 240 expanded paths and 192 validated hypothetical entries.
Control is derived backwards from the required final performer.
The existing authoritative sequenceEvidence rejects unsafe, banned,
physically impossible, disconnected, late, pin/finish and conditional
attempt-alternative actions. Unknown or impossible targets fail closed.

Each surviving chain is assessed by both wrestlers using the existing
sequence difficulty and fuzzy proposal model. Ranking combines mean
and weaker-side utility, with small difficulty and risk penalties.
Keep up to two per length (six total) and one valid starting state per
path. Search is deliberately incomplete; a missing candidate is not
proof there is no valid chain. Conditional entry, grip, stamina,
timing and location still require live validation.

The roster audit measures coverage, length distribution, control
changes, guards, psychological score changes, fresh ban checks and
deterministic non-mutating generation across 80 rooms.

Next: MP7B integrates a sequence offer into the backstage conversation
and displays actual transitions and individual reservations. MP7C
persists signed conditional commitments; MP8 handles live execution,
adaptation and persistent psychological memory. No UI or signed-sheet
change in MP7A.
