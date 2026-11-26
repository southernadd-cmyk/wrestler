# MP5B — proposal inference (shadow only)

The separate proposal model reuses OfficePsychology's Sugeno kernel and
the MP5A evidence contract. It consumes six already inferred tendencies
via explicitly versioned low/medium/high curves [25,50,80], rather than
reinterpreting raw worker stats. Existing 79 behaviour rules unchanged.

Outputs: acceptance (willingness to work the specific proposal),
reservations (degree of concern), counterproposal (inclination to seek
an alternative). Independent inclinations, not exclusive categories
or percentages of acceptance. No acceptance thresholds yet.

Risk and caution interact: for unflagged moves caution alone does not
increase concern; a flagged move elicits more concern in a cautious
worker. Creative benefit and ambition interact without inventing
individual credit. Finish support gain/loss is grounded in the graph;
protectiveness amplifies a lost finish-support opportunity.
Familiarity and graph-cost change apply only to the performer, not
the recipient. Cooperation, flexibility and assertiveness supply
separate psychological context. Hard eligibility always precedes
inference; re-read current room via evaluateProposal, never use an old
card to permit a prohibited move.

Proposal fairness, sequence difficulty and professional trust remain
unknown. Compatibility is a hard gate, not a constant boost that
could mask reservations. If both risk and creative benefit are
missing, no proposal assessment is returned. No new personality
statistics, dialogue banks, save fields, or live choice changes.

The rule table is an initial game-design estimate, not an empirical
fit. Tests check matched directional effects, role separation,
blocked/stale evidence, 80 rooms across structures/plans/leads and
results, both participants per real proposal, JSON replay, and no room
mutation. Audit reports ranges and rule utilisation; unobserved rules
are not automatically bugs. CI pending.

MP5C adds actual fairness/concession evidence; MP5D ordered sequence
difficulty; MP5E calibration and live use. No new CI workflow.
