# The Office v3.3 — ten times the graph, still realistic and deterministic

v3.3 grows the match and promo graphs by an order of magnitude without making the
simulation less believable or less reproducible.

| Graph | v3.2 | v3.3 | Growth |
| --- | --- | --- | --- |
| Action nodes | 96 | 986 | 10.3× |
| Action edges | 297 | 6,252 | 21× |
| Story arcs | 13 | 25 | 1.9× |
| Finish routes | 6 | 20 | 3.3× |
| Promo choice nodes | 15 | 150 | 10× |
| Concrete promo paths | 125 | ~125,000 possible (2,157 seen in the test sample) | — |

## Action graph: 336 authored moves in 20 families

`CAT` in `index.html` (inside `OfficeMatch.GRAPH`) is a catalog of generic, widely used
wrestling techniques, each described with an original line. The families are suplex, power,
neck/DDT, strike, corner, top rope, superplex, springboard, dives, submission, ground,
chain wrestling, roll-ups, ringside, heel tactics, comeback/fire, rest holds, lucha,
rope-assisted and running attacks.

Every move declares:

- **Position in and out** (`requires`, `zone`, `down`). It cannot happen from the wrong place,
  and it leaves both wrestlers somewhere specific.
- **Effort** (`cost`). This drains stamina, and expensive moves are blocked when the
  wrestler is too tired.
- **Lift margin** (`lift`). The heaviest opponent it can lift relative to the attacker's
  weight and ring skill. A 68 kg flyer cannot Alabama slam a 125 kg brawler.
- **Body part** (`part`). Arm, leg, neck, back or ribs. Limb work only adds damage when
  it hits the part being worked.
- **Earliest credible moment** (`after`). A tombstone, 450 splash or roll-up cannot happen
  in the opening minute.
- **Risk** (`risk`). Suppressed by "Keep it safe", encouraged by "Spot-fest", and
  reduced for careless workers.
- **Style affinity** (`styles`). Technical, Brawl, Spectacle or Story wrestlers favour
  their own families.

Each move also gets the ways it can fail. These are real nodes in the graph, with their own lines:

- **Reversal** (`<move>_rev`, 336 in all). The defender turns it around, and control
  changes hands.
- **Block or abort** (`<move>_blk`, 214 in all). The lift is refused, the dive aborted, or the
  submission dragged back to the centre. Lift blocks become more likely the heavier the
  defender is.

### Wiring

- Each move is linked from three setups in its family's pool, chosen with a fixed FNV
  string hash. There is no randomness at build time, and two loads produce byte-identical
  graphs (tested).
- Moves link onward to other families, for example suplex → ground strikes → submissions.
- Catalog edges on an original node may carry at most **half** of that node's
  hand-authored weight, so classic chains such as headlock → shove off the ropes →
  shoulder tackle stay dominant.
- Each story arc *invites* the families that belong in it (`ARC_FAMILIES`): heat segments
  draw on ground strikes, rest holds and submissions; comebacks on strikes, rebounds and
  fire; the finishing stretch on top-rope moves, big lifts and roll-ups.

## Story arcs: 12 new sub-arcs

The new sub-arcs are stalling, test of strength, limb work, heat on the floor, selling in
a rest hold, a second hope spot, dives to the floor, a slugfest, both wrestlers down, a
fight on the top rope, a submission battle, and false finishes. Arc timing rules that were
hard-coded lists are now arc properties (`earliest`, `latest`, `late`, `openers`, `focus`),
set so the original 13 arcs behave exactly as before.

## Finish routes

The contract still decides who wins. The match decides *how*:

| Booked result | Routes |
| --- | --- |
| Clean win | finisher; reversal into the finisher (after 3+ counters); from the top rope (Spectacle); a worn-down limb; strike knockout (Brawl); outlasting a tired opponent |
| Dirty win | fistful of tights; feet on the ropes; thumb to the eye (Brawl/Story); referee bump in a hot feud |
| Protected loss | foot on the rope, then roll-up; slow count, then schoolboy; too exhausted to cover; injured body part gives way |
| Clean loss | duck and finisher; finisher reversed; submission on the damaged part; outlasted |
| Manager-driven | medical stoppage; going into business |

## Promo graph: 135 situation-specific variants

The screen still shows five angles per stage. Each angle now has about nine concrete
versions, and each version is offered only when its condition holds:

- previous results (won or lost the last meeting), or no history at all;
- remembered injury or humiliation;
- feud heat;
- the opponent's style;
- the speaker's microphone skill, ego and professionalism;
- the opening the player already chose, and any earlier public promise.

Every variant has its own line, its own reply from the opponent and small effect
adjustments. Replies grounded in real history (such as "I won that one") still take
priority. The variant shown is a pure function of the saved promo state, so what the player
sees is exactly what is played, before and after a reload.

**Specific counter vows.** "I will catch your punches" (against a brawler) is only kept by
reversing a strike-type attack. "I will reverse your holds" needs a submission or chain
reversal. "I will catch you in the air" needs an aerial or lucha reversal.

## Tests

```sh
node tests/catalog.test.cjs          # size, reachability, physical legality, realism, determinism, finish routes
node tests/promo-variants.test.cjs   # 150 promo nodes, every variant reachable, shown = played, determinism
```

The seven earlier suites pass unchanged except for two deliberate edits:

- `graph-flow` still requires every hand-authored node to be reached, but it keeps sampling
  up to 2,000 deterministic bouts instead of relying on a lucky 500. One v3.2 node was
  reached exactly once in 500.
- The `match-flow` dirty-finish ordering check accepts any of the illegal acts, not only
  "fistful of tights".

Measured in the catalog suite over 1,000 ordinary matches:

- 96% of all 986 nodes appear, and the rest are rare but legal (checked by a physical probe
  of every node).
- New catalog moves make up 28% of in-ring actions.
- 67% of heat-segment limb moves hit the targeted body part. Random choice would give about 20%.
- Spot-fest bouts produce far more high-risk spots than "Keep it safe" bouts.
- Technical, Spectacle and Brawl wrestlers favour their own families.
