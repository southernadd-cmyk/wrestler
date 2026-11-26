# MP0B — planning quality baseline

Run `node tests/planning-roster-audit.test.cjs` (already included in the
existing test selector). Set `PLANNING_AUDIT_JSON=planning-audit.json` to
export the full transcripts, choices and signed sheets locally.

The fixture follows the established promo roster audit's actual academy
intake sequence, sampling 80 established wrestlers and 120 academy
identities. They need not coexist in one real season. Each focus worker
has four meetings, one per dramatic structure, twice on each performer
side. Across the corpus all 80 structure/approach/lead/focus-side
combinations occur. The five approaches receive 160 meetings each.
Bookings rotate through four booked results, three lengths and available
promoters. No forced incident queue, invented career history or fuzzy
policy is used. The audit accepts Dennis's initial pencil marks, samples
actual incident choices, varies huddle keep/revise/open, and resolves
prohibited choices via the real review UI options. The sampled decisions
are a fixed test policy, not measured player preferences.

Hard checks: completed meetings, valid graph, booked result and eligible
finish route, legal signed named objectives, bounded consent, clean
transcript placeholders and deterministic JSON resume of one meeting per
identity. Descriptive measures: decisions, consent, objections, huddle
outcomes, named/open objectives, incident and decision coverage, exact
normalized focus-line repetition within and across sampled scenes, and
owner-level speech coverage. Repetition is counted, not presumed to be
an error. Lines are attributed to the actual logged side; no unsupported
claim is made about authored-bank provenance or semantic correctness.
Focus-side statistics are separate from the full transcript.

This first audit covers preparation only. It does not replay in-ring
execution, judge editorial quality, establish causal personality effects,
or persist a real evolving career. Use the existing structure comparison
and signed-sheet execution tests for physical fidelity, and add matched
counterfactual planning cases and manual transcript review before any
live fuzzy policy. No production scripts, saves, bank content or workflow
configuration are changed. Current results must come from a successful
run, not from assumed fixture counts.
