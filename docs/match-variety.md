# The Office v2.9 — Match variety without control bloat

## Goal

Make two wrestlers work recognisably different matches, and make scouting and
tiredness matter, while keeping The Office's 1990s management-sim UI and the
existing three ringside calls. The booked finish remains authoritative.

## Design influences

- **Wrestling Empire:** recognisable physical styles, risk, fatigue and surprising
  situations; not its real-time controls or unrestricted physics.
- **80s Mania / Modern Mania:** immediate booking clarity, lively characters and
  persistent consequences without an intimidating number of systems.
- **Internet Wrestling Federation:** the general ideas of stamina-gated attacks,
  size-aware move selection, move preferences and distinct wrestler traits:
  https://github.com/arout77/Internet-Wrestling-Federation

The logic and prose are our own. We do not copy implementation from IWF (which
does not declare an open-source licence) and do not adopt its HP-based winner
simulation.

## Mechanics

### Wrestler profiles

`OfficeData.PROFILES` supplies fictional body mass, a behavioural trait, and
four favoured graph actions for each of the eight roster wrestlers and six
opponents. They are keyed by stable IDs, so careers saved before this change
retain their existing stats and acquire these match preferences automatically.
Unknown IDs have a safe neutral profile.

### Action legality

The same existing 13-arc graph chooses a coherent sequence and makes a local
choice from current position and control. We now also apply:

- personal favourite-move weights, on top of generic style and booked plan;
- wrestler-specific stamina costs at action resolution;
- lower high-cost move weights when tired, with hard gating of dangerous
  late-match attacks;
- physical size restrictions on lifting moves, and an exhausted spot fallback;
- technical ability, psychology and relative stamina weighting the chance that
  a graph transition is a counter;
- low-stamina breath breaks as a visible, causal action, not a silent recovery.

A wrestler can still use ordinary moves outside their preferred set.
Stamina is not HP: a wrestler can tire without arbitrarily overriding a
contracted victory.

### Road agent

Before the bell, the existing contract panel now has one short scouting note
using the wrestler profiles, the size comparison, feud heat, current fatigue,
opponent style and the selected match plan. There are no additional buttons.

### Guarantees and scope

- No change to existing save keys, navigation or title history.
- No independent, random winner generation; the contracted result is honoured
  unless the existing manager choices explicitly override it.
- No tag-team format, steel cage or ladder rules added in this pass.
- No external dependencies, online calls, or new deployment infrastructure.

## Tests

```sh
node tests/match-flow.test.cjs
node tests/graph-flow.test.cjs
node tests/promo-flow.test.cjs
node tests/match-variety.test.cjs
```

The new suite covers physical profiles, size and stamina restrictions,
exhausted forced spots, breath recovery, contextual scouting, career-save
replay and hundreds of bouts with retained booking outcomes and story variety.
