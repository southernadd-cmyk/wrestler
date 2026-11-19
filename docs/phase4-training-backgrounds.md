# Phase 4 — wrestler technical schooling (bounded live pilot)

> **v0.4 status:** Completed first technical-background pilot. Phase 8 subsequently provided technical identities for all 80 wrestlers, including 40 provisional gameplay assignments. See [v0.4 release](v0.4-release.md) and [technique and physical realism review](technique-and-realism-review.md). Historical figures and original phase wording below are retained for traceability.

**Goal:** different wrestlers can approach the *same* technique sequence in recognisably different ways without equating a performance style with a training tradition, changing contracted finishes, or altering long-lived saves. This follows the [Phase 3 curated live transitions](phase3-technique-transitions.md).

## Separate the three existing concerns

| Concept | Question it answers | Data |
| --- | --- | --- |
| Performance style | How does this wrestler present the match? | Existing Story / Technical / Brawl / Spectacle style and graph biases |
| Weekly training | Which skills or preparations are improving in this career? | Existing editable \`training\`, \`intensity\`, \`progress\` and drills in the career save |
| **Technical school** | Which physical move entries or counters feel most natural to the wrestler? | New, **immutable** \`OfficeTechniqueBackgrounds\` assignment by stable wrestler ID |

The background layer is a manually authored interpretation of the **fictional** cast. It is not inferred from the character's name, nationality, weight, gender or performance style and is not historical attribution. The one explicitly established canon example is Bao Merrick, a former club judoka; Nico Vega's bio also says he learned lucha on family cards. Other assignments are design decisions for the game, not biographies verified outside the project.

We assigned **38 of 80 characters** to a distinct catch, judo, lucha, catch/judo or catch/lucha background. The other 42 keep **general ringcraft** and *exactly the existing baseline action biases*. This intentional restraint avoids declaring an unsupported technical history for every wrestler.

## Mechanics

- \`assets/js/technique-backgrounds.js\` stores the frozen character-to-school crosswalk and one pure \`multiplier(wrestler, move, graph, registry)\` function.
- A school can enhance selection only for the destination of one of the **11 active Phase 3 authored transitions**, where the corresponding existing Phase 2 registry entry supports that school.
- The enhancement is a multiplicative factor **1.0–1.28**. Hybrid backgrounds use a lower affinity for both traditions, not double bonuses.
- The factor is applied to the legal match-choice pool **after** the original per-wrestler signatures, skill/strength limits, existing dramatic styles and context. It does **not** change whether a move is legal, the authored graph, a bout's designated winner, a card layout, an agreed agent-room beat or a match state representation.
- Crucially, a move-specific reversal checks the **defender's** background, not the attacker whose move is being countered.
- Unreviewed Phase 2 technique suggestions, live nodes lacking curated metadata, and all other existing moves get **no effect**.
- No new random numbers, match-graph nodes or persistent career fields. Old saves load unchanged and continue with the current engine. Matches simulated under different engine versions can diverge after an update despite having the same seed; cross-version exact replay is not promised.

The game's existing match scouting brief now mentions the identified wrestling school separately from the wrestler's established performance trait. In the Graph Lab Run Sheet, the selected wrestlers' school identities are displayed beside their performance styles.

## Tests and baseline protection

\`node tests/phase4-technique-backgrounds.test.cjs\` verifies:

- all 80 roster IDs, assigned/unassigned totals and no duplicate or unknown school assignment;
- catch vs judo vs lucha distinctions *within the same performance style*;
- bounded enhancement only for Phase 3 links with matching technique metadata;
- the **actual live \`Graph.pool\`** applying the 1.28 school multiplier, not just the standalone mapping returning a plausible number;
- reversal ownership (the defender performs the counter);
- no mutation of template roster, existing authored move graph or saved wrestler objects;
- contract-safe finishes and deterministic within-version matching for seeded bouts;
- the scouting description for different backgrounds.

The frozen baseline \`tools/graph-lab/baselines/reference-v1.json\` remains unchanged. The [automated baseline suite](graph-lab.md) runs the same **1,200 seeds / six scenarios** through the actual site-load modules so its reports record the effect of technical identities.

**Accept only after comparing:** move family distribution, observed Phase 3 consecutive links, counter use, node/edge reach, stars and contracted finish routes. Differences are permitted if sensible, but should not break physical rules, saves or match predictability. After passing tests, sample varied same-style opponents at different weights and physical capabilities before expanding to more detailed grip state.

## Deliberately not in Phase 4

No new move art, playable training minigame, earnable school advancement, wholesale attribution of all 336 moves, or hidden per-wrestler exclusion lists. These would require a separate design and save-migration review.
