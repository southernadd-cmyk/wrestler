# The Office v3.2 — Creative meetings and public stakes

**Product question:** can a player explain what was agreed in the meeting,
what was asserted at the microphone, and what actually happened in the ring?

## 1. A substantive match meeting

The old meeting generated a fixed sheet and, if there was an objection, offered
three ways to settle it. The new version requires the manager to choose a
**creative objective for these particular wrestlers**, backed by their styles,
current condition, evidence from previous meetings and memories.

Candidate story objectives are grounded, never randomized disagreements:
- **Performer-led:** build around the opening and pressure sequences each
  wrestler naturally favours.
- **Scouted counter:** acknowledge the opponent's established tactical style,
  prepare an opening probe, then try to deliver a late counter.
- **Redemption:** only offered where a previous result or grievance warrants
  it; the wrestler must earn a comeback rather than simply having one announced.
- **Spectacle:** only offered if a high-flyer or spectacles-oriented match
  justifies it; safety reservations come from actual physical/professional
  circumstances.
- **Protection:** available for fatigue, injury, prior injury memories or an
  unsafe opponent; this substitutes controlled legal offence for a risky spot.
- **Pressure and escape:** a credible sequence where one worker isolates a
  weakness and the other looks for a counter.
- **Existing chemistry:** only available once the pair has earned a strong,
  coherent match; it aims to build on their prior working relationship.

The chosen objective changes named opening, pressure, comeback and payoff
actions on the serializable match sheet. Detailed, key-beat and call-live modes
still have different granularities. A performer can make a specific *alternative
beat* proposal before the manager signs. Those revisions are recorded, not
equivalent to a numerical approval button.

Where the performers agree, they agree naturally. A grievance or safety
objection appears only when a specific history or real condition supports it.
The player decides how to resolve that reason, sees the workers' spoken
reaction and chooses to sign. The screen shows willingness in ordinary words
instead of optimization scores.

## 2. Contextual promos

The existing three-act conversation (five opening positions, five types of
answer and five public closings) is retained for accessibility, but the nodes
now carry **factual claims and replies**.

- The opening establishes what the wrestler asserts, relevant evidence or
  absence of evidence, and the tactical strength of the opponent.
- The opponent directly challenges that claim in their own context, including
  a meaningful previous result or knowledge from the meeting.
- The second choice actually addresses or dodges the objection. Personal
  charges without supporting incidents lose credibility.
- The final choice makes an enforceable public promise or deliberately avoids
  one. Stage-aware hints explain when a vow is incompatible with the booked
  finish; the player chooses the risk knowingly.

The chosen speech produces an original dialogue transcript; it does not
reproduce real wrestlers' copyrighted promos.

## 3. Proof in the ring

Public declarations are stored in the promo result as a plain serializable
`tactic`, with a type and set of meaningful legal action candidates.

- **Counter** is fulfilled only by a successful, relevant, worker-controlled
  reversal at or after 58% of the match duration. An ordinary early exchange
  is insufficient. Actual event IDs—not crowd scores—determine success.
- **Finisher** allows a perceptive opponent to recognize and prepare for the
  advertised setup.
- **Clean** decreases the weight of cheap-shot or illegal-looking offence.
- **Misdirection** quietly favours evasion and unexpected counter-action.
- **Victory vow** increases pressure to earn the final rally while the booked
  result remains contractually authoritative.

Where a counter is actually performed at the right time, the live commentary
calls back to the microphone promise. The outcome is then credited or
discredited in the post-match debrief and persistent wrestler memory. All
tactics retain the match engine's existing stamina, position and safety guards.

## 4. Evidence-led match debrief

An actual beat can be **achieved, adapted or missed**. If a prerequisite was
missed but performers later recover, the later beat is marked adapted with a
causal explanation instead of claiming the original sequence worked.
The contractual finish is assessed separately: a delivered booked finish is
achieved even if the middle of the match was improvised.

Ringside instructions that materially change the plan enter the signed sheet.
The debrief reports the original objective, revised beats, manager calls,
causal events and final dispositions. A strongly performed sheet can create a
positive chemistry memory for the rematch; a badly missed one may harm
relationships. Events are idempotently identified and saveable.

## 5. Regression coverage

No new package dependencies, remote models, build tasks or storage systems.

Run:

```bash
node tests/match-flow.test.cjs
node tests/graph-flow.test.cjs
node tests/promo-flow.test.cjs
node tests/match-variety.test.cjs
node tests/memory-flow.test.cjs
node tests/graph-sheet.test.cjs
node tests/creative-loop.test.cjs
```

The new suite covers 2,124 objective/mode/wrestler combinations and 180
full promo-to-match bouts. It verifies no forced disagreement, live alteration
of a specific planned beat, contextual arguments, direct rebuttals, public
counter success and failure, event-ledger uniqueness, contracted results,
timely commentary callbacks and persistent career consequences. This is a
mechanical validation only; the quality and entertainment value require
human playtesting in the actual browser UI.

## Next quality passes

The dialogue still needs more performer-specific voices, realistic multi-turn
revisions and a richer authored library of original propositions, tactics and
counterclaims. Match-source annotation and a Graph Lab remain research work,
not shipped features. The best next step is to play five consecutive bouts
with the same two workers and examine whether each meeting and promo reflects
the evolving relationship rather than repeating templates.
