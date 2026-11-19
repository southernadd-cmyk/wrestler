# Phase 8 — technique identity for all wrestlers, depth-and-variety pilot

> **v0.4 release status:** Phase 8 subsequently **merged via PR #104**; all 80 wrestlers now have technical identities, 40 provisional. See the [current release](v0.4-release.md) and [next technique/realism review](technique-and-realism-review.md). Original experiment data and reference counts are retained.

**Original branch status, since superseded:** Phase 8 was developed on the Phase 7 branch and subsequently merged via PR #104.

## The two identities are not interchangeable

All 80 wrestlers already have a theatrical/performance style (Story, Technical, Brawl or Spectacle). Before Phase 8, only 40 had an individually assigned technical school or tendency, and 40 inherited generic ringcraft. The new 40 are marked **provisional gameplay technique tendencies**, not proven biographies or claims of formal training. Do not rewrite the roster bios to make them sound historically documented.

- **40 retained:** the prior source-reviewed/editorially assigned `ASSIGNMENTS` object, untouched.
- **40 added:** an independent `PROVISIONAL_ASSIGNMENTS` map. Each wrestler has a distinct, explicitly authored selection from the current technical tendencies. These are playable balancing choices, not literal childhood training stories.
- Nothing changes the wrestler's pre-existing performance style, weekly training, weight class, character history, contracts, or serialized career data.
- Matching reviewed technique transitions receive at most the previous bounded 1.28x preference. A chosen technical tendency is not permission to ignore positional, lift, safety, agility or match-timing restrictions.

### Full provisional allocation table

| Wrestler ID | Proposed technical identity |
|---|---|
| aisha | Strength athletics |
| alina | Catch–lucha |
| ari | Catch wrestling |
| ash | Strength athletics |
| ayla | Catch–judo |
| bashir | Strength athletics |
| brick | Catch wrestling |
| bronte | Boxing |
| cedric | Catch wrestling |
| dax | Boxing |
| dean | Catch wrestling |
| dev | Catch–judo |
| elodie | Lucha libre |
| faye | Catch wrestling |
| felix | Lucha libre |
| gus | Strength athletics |
| kellan | Acrobatics (provisional) |
| kira | Judo |
| mae | Catch–lucha |
| magnus | Strength athletics |
| malik | Boxing |
| mara | Judo |
| milo | Acrobatics (provisional) |
| miro | Catch wrestling |
| morgan | Judo |
| nate | Strength athletics |
| nikita | Boxing |
| nolan | Catch wrestling |
| otis | Catch wrestling |
| priya | Catch–lucha |
| red | Boxing |
| rex | Strength athletics |
| rocco | Strength athletics |
| roxy | Lucha libre |
| sol | Lucha libre |
| soraya | Judo |
| sylvia | Boxing |
| rev | Catch wrestling |
| tomas | Judo |
| zane | Strength athletics |

**Editorial caveat:** lack of a detailed biography for some original opponent wrestlers means their proposed school is a deliberate *gameplay characterisation*, not an inference of actual training. These 40 allocations are open to manual character-by-character refinement.

## Actual playable graph expansion

The first controlled Phase 8 pilot adds **14 curated same-position graph follow-throughs** for grounded limb controls and close striking. They operate on existing nodes, with no new move IDs. Every link is checked against the engine's physical entry/exit states. New link candidates are weighted modestly (0.65 before normal graph rebalancing), not forced. The original background and finish rules remain authoritative.

### Release validation

- `tests/phase8-depth-variety.test.cjs`: checks the 14 links, 80/80 allocation, and preservation of the original 40 assignments.
- Existing school/technique tests updated to distinguish the 40 original and 40 provisional allocations.
- Full simulated match suite, pre-expansion fixed-seed baseline, repeated rivalries, career/save replay and desktop/mobile browser journeys must pass.
- Green tests prove integrity, not necessarily more interesting matches. Inspect actual seeded transcripts and variety metrics before merging.

**Historical dependency, satisfied:** Phase 7 PR #103 supplied the grapple-attempt engine; the final Phase 8 release was merged as PR #104.
