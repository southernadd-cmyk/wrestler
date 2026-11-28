# The Office — Shared Graph Kernel (Implementation RFC)
12 November 2026 · Proposed architecture; not deployed.

Companion documents: [Graph engine research](graph-engine-research-2026.md), [Match planning](match-planning-rfc.md), [Source audit](wrestling-source-audit-2026.md).

## Scope

Extract **selection, diagnostics and structural validation**, not a one-size-fits-all story simulator. Match action graphs, promo argument graphs and match-sheet negotiation graphs should share low-level mechanics but keep their own semantic contracts.

The existing \`OfficeMatch.GRAPH\` exposes the 13 arcs and roughly 66 tactical actions, with bespoke selectors \`selectArc\`, \`canArc\`, \`isValid\`, \`validPool\` and \`pick\`. A low-risk migration keeps this public API while progressively delegating to a shared kernel.

## Minimum contracts

- \`GraphRegistry.add(kind, graphDefinition)\`: index the static node data, stable edge ordering and named predicates.
- \`GraphKernel.eligible(kind,nodeId,context)\`: evaluate pure named guards, returning a boolean **and explicit rejection reasons**.
- \`GraphKernel.candidates(kind,from,context)\`: gather weighted edges; apply registered modifiers with explain traces.
- \`GraphKernel.pick(pool,rng)\`: deterministically select from the given pool, using the match's existing seeded RNG.
- \`GraphKernel.validate(kind)\`: check node references, reachable legal routes, missing guards, dead ends and potential incompatible effects.
- \`RuleRegistry.add({id,kind,tags,when,multiplier,why})\`: register pure scoring rules. Predicate functions are code-only; saved data stores IDs, not functions.
- \`OfficeEvents.commit(event)\`: apply semantic effects **once**, then append a durable canonical event with actor role slots and causal links.
- \`OfficeEvents.read(matchId)\`: provide immutable events to commentary, promotions, memory, rivalries and debugging.

**No serializer should persist closures, DOM references, live promises or dependency injection containers.** Mid-match saves keep the existing RNG state and \`M.graph\` structure until a tested migration is available.

## Source-specific prototype

The existing \`node(id,text,opts)\` can remain a compatibility builder. Convert its \`requires\`, \`zone\`, \`down\`, \`lift\`, \`cost\` and \`reverse\` to named tags and guard IDs gradually. Do not migrate the 66 nodes at once.

Example proposed data record:

~~~json
{
  "id":"power_spinebuster",
  "kind":"action",
  "roles":["attacker","defender"],
  "tags":["power","lift","signature","knockdown"],
  "guards":["in_ring","standing","legal_lift_for_actor","enough_stamina"],
  "effects":["drain_actor_stamina","set_opponent_down","emit_impact"],
  "next":[["cover",3],["target_hold",2],["stand_reset",3]],
  "provenance":["human_authored"]
}
~~~

Proposed modifier:

~~~js
Rules.add({
  id:'low-trust-improvisation',
  graph:'action',
  tags:['deviation'],
  when:ctx=>ctx.managerTrust<35 && ctx.callerRole==='attacker',
  multiplier:1.4,
  why:'Attacker distrusts manager and prefers a legal alternative to the sheet'
});
~~~

Example trace:

~~~text
minute 07:48; wrestler Rex; position standing; plan landmark spinebuster setup
candidate wristlock:  base 2.0 × low risk 1.0 × wrestler repertoire .82 = 1.64
candidate spinebuster: base 2.0 × preferred 3.7 × rib injury .20 = 1.48
candidate rest hold:  base 1.0 × exhausted 3.0 = 3.00
chosen rest hold; RNG draw within 6.12 total
sheet landmark "spinebuster near-fall": deferred (injured ribs)
~~~

Numbers above are **illustrative design examples**, not calibrated from real wrestling or observed game logs.

## Refactor stages and parity gates

1. **Instrument current engine**, keep its behaviour. Record candidates, weights and RNG calls for several fixed-seed match scenarios.
2. **Unify phase-forcing policy**: \`selectArc\` and \`advance\` should share one authoritative threshold policy, then eventually migrate from clock-driven to landmark-driven transitions.
3. **Extract a pure weighted picker** preserving candidate insertion order, repeated edge contributions, floating point score and RNG draw count. A naive pre-aggregation risks changing odds.
4. **Extract guards by kind**. Match position and physical checks stay in match modules; promo semantic replies stay in promo modules. The kernel executes named checks and records explanations.
5. **Extract modifier rules** in small batches and compare exact candidates/traces to baseline. Rule IDs, stable ordering and why-labels are mandatory.
6. **Introduce event ledger read-only first**: mirror accepted action events and compare with old logs. Then migrate effects into idempotent reducers once parity and save-resume are proven.
7. **Introduce match-sheet landmarks** as the first feature actually using the new platform. The planner must know each wrestler's expressed preferences, disagreements and agreement.
8. **Introduce storylets** from remembered cross-show events, but keep physical action and dialogue planners distinct.

### Kernel parity tests

- Exact event choices and RNG state on at least 100 fixed-seed bouts before/after internal refactor.
- Same contract outcome, same match times, same management consequences.
- Same saved JSON schema and successful deterministic continuation from a mid-match checkpoint.
- No duplicate memory or career events when results are submitted twice.
- All existing match-flow, graph-flow, promo-flow, variety and memory suites still pass.
- On 1,000 seeded bouts per available plan/texture (as feasible), compare transition matrices and actual action distributions, not only unique-path counts.
- Explain traces must identify why an option was rejected or chosen, including legality failure.
- Manual review of at least three types of complete match sheet; a sequence with more nodes is not necessarily better.

## Sequence ownership

The writer/agent proposes story landmarks; **both wrestlers negotiate them**; a director routes between legal milestones; tactical action nodes enact moves; commentary reports the authoritative event record; aftermath produces persistent memories. The contract finish is an invariant unless the game's existing explicit extraordinary incident is triggered.

This architecture is intended to be maintainable when scaling to hundreds of authored action/response nodes and thousands of well-defined edges. Its principal success criterion is not graph size but **specific, coherent callbacks that the player recognises**.
