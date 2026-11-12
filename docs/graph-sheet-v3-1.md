# The Office v3.1 — Negotiated match sheets and causal event graph

## What actually ships

The regional stable game now exposes a real two-worker planning stage between
the existing match preparation and microphone screens. Neither match results
nor the core management interface are replaced. Current development is aimed at
better stories, not preserving identical seeded action choices from prior builds.

### How to play

1. Book a match, advance to match night and set the game plan.
2. Select **Meet the wrestlers**. Both participants have distinct opening,
   control and payoff proposals, informed by their style and personality.
3. Choose **Detailed**, **Key moments** or **Call it in the ring**.
4. Resolve the disagreement by compromise, backing your wrestler or backing
   the opponent. Both performers sign a serialisable sheet. Where one is unhappy,
   their response is visible and their cooperation changes in the match.
5. Work the existing microphone scene and live match. The sheet biases eligible
   move selection but cannot force a physically impossible or exhausted lift,
   or overwrite the contract without an explicit existing manager incident.
6. After the bell, compare **Agreed versus performed**. Career match history
   retains the summary.

### Three related graphs

**Planning graph**: a five-beat directed structure in detailed/key-moment
modes, or four more flexible landmarks in call-live mode. Edges represent
logical commitments. Each beat has an owning performer, intended moves,
a safe fallback, a time window, and an achieved/adapted/missed result.

**Tactical graph**: 96 nodes and 297 directed edges spanning the 13 existing
dramatic match arcs. The extra 30 nodes form authentic original action chains:
technical limb and escape exchanges, strength-constrained power offence,
aerial preparations and counters, and dramatic feints or comeback payoffs.
The action guard still decides if a move is physically valid.

**Event graph**: each accepted move or major special/finish event is assigned
a unique monotonic ID, event type, actor, timestamp and (if relevant)
the signed commitment it fulfilled. It is serialised inside the live match
and informs commentary and the post-match sheet report. An abandoned
high-risk spot is not recorded as a successful spot.

The match sheet is plain JSON. Older in-progress saves without a sheet still
run through the existing engine. All match plans share the legally booked
result. Late match calls may cause the wrestlers to miss a planned spot.

### Implementation modules

- `OfficeGraphKernel`: graph node validation, pure requirement checks, once
  per accepted event ledger append, monotonic IDs.
- `OfficeSheets`: fictional wrestler proposals, choice/consent, dependency
  DAG, action weights, observation, missed-beat finalisation and reports.
- `OfficeMatch.GRAPH`: the existing physics/position/timing engine, expanded
  with 30 original action and reaction nodes.
- `OfficeMemory`: records a significant disrupted sheet as a new remembered
  managerial experience, rather than inventing one after every match.

This is a focused playable slice. The kernel has **not** yet been migrated to
operate the complete promo, social or long-term narrative graphs.

### Regression and validation

Run these no-dependency suites:

```sh
node tests/match-flow.test.cjs
node tests/graph-flow.test.cjs
node tests/promo-flow.test.cjs
node tests/match-variety.test.cjs
node tests/memory-flow.test.cjs
node tests/graph-sheet.test.cjs
```

The new suite covers all 432 combinations of eight in-house wrestlers, six
opponents, three planning methods and three managerial settlement choices;
hundreds of full matches; alternate planned choices producing different
performed action paths; fixed finishes; action legality; and mid-match
checkpoint equivalence. Older suites continue to require every action and
reaction node to be reachable in ordinary seeded matches.

## Deliberately deferred

- Building 400+ move nodes without realistic sequence auditing.
- Collapsing physical combat and promo dialogue into one universal graph.
- Full two-way spoken negotiation with several back-and-forth concessions.
- Interactive Graph Lab, long-term storylet planner and multi-show story graphs.
- Empirical percentages claimed to be learned from real match footage.

The research baseline is PR #4 and its four design documents on the separate
research branch. Its source studies inform the original motifs here; the game
does not copy real wrestlers' dialogue or unlicensed match transcripts.

**The quality criterion:** players can tell what was agreed, see how the
performers got there (or didn't), and understand why the aftermath matters.
