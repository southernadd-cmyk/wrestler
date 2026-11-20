# The Office: final 106 catalogue-entry technique audit

**Scope:** Original authored 340-move catalogue; audited from live `assets/js/match-engine.js` definitions.

## Decision

- 234 pre-existing curated metadata records.
- 91 additional records describe identifiable offensive, defensive, evasive or positional wrestling techniques.
- 15 distinct authored match *events* are performance, story, crowd or timing beats, not mechanically specified wrestling techniques; intentionally left without technique metadata.
- 325/340 total catalogue IDs now have proposed technique metadata (95.6% of all catalogue entries). **All 325 actual technique IDs are documented; 15 performance IDs are deliberately excluded.**
- This is an editorial classification, not a claim that new move interactions, counters, positions, or style bonuses have been implemented.

## Family breakdown of final 106

| Family | Techniques documented | Non-technique beats | Total |
|---|---:|---:|---:|
| aerial | 10 | 0 | 10 |
| chain | 5 | 0 | 5 |
| corner | 18 | 0 | 18 |
| dive | 8 | 0 | 8 |
| fire | 10 | 5 | 15 |
| heel | 6 | 8 | 14 |
| lucha | 5 | 0 | 5 |
| outside | 11 | 2 | 13 |
| rope | 10 | 0 | 10 |
| springboard | 2 | 0 | 2 |
| superplex | 6 | 0 | 6 |
| **Total** | **91** | **15** | **106** |

## Deliberate exclusions

| Match event ID | Why it is not technique metadata |
|---|---|
| `double_down_count` | Referee count and both wrestlers recovering are timing and match drama. |
| `fr_crowd_clap` | Leading audience clapping is a crowd-engagement beat, not a technique. |
| `fr_no_sell` | The no-sell is performance of absorbing strikes, not an authored offensive technique. |
| `fr_second_wind` | A second-wind comeback is a dramatic state beat, not an identified move. |
| `fr_shake_ropes` | Shaking the ropes is a comeback gesture rather than a mechanical move. |
| `hl_beg` | Pleading for mercy is character performance, not a wrestling action. |
| `hl_distraction_apron` | Distracting an official on the apron is a narrative spot rather than a move. |
| `hl_fake_injury` | Feigned injury is deception and storytelling, without an identifiable performed move. |
| `hl_mock` | Imitating an opponent's pose is crowd-directed character work. |
| `hl_ref_argue` | Referee argument is character and distraction behaviour rather than physical technique. |
| `hl_rope_leverage` | Underspecified rope leverage tactic without a specific hold or striking technique. |
| `hl_stall` | Stalling and walking around ringside are tactical pacing, not a defined manoeuvre. |
| `hl_strut` | A showboating strut is presentation and crowd reaction, not a technique. |
| `os_count_tease` | Countout suspense and recovery timing, not an attack or defence technique. |
| `os_crowd_brawl` | General ringside brawl sequence, not an individually identified technique. |

## Validation and limitations

- All added metadata uses an existing move ID and the live action's actual entry position, exit position and target.
- Every recorded generated counter, where present, references that exact authored parent; moves marked `rev:false` have no invented reversal.
- Training tags on the 91 new records are neutral `wrestling`; no new graph links, simulated states or persistent grips are introduced.
- A corner manoeuvre can remain in the `corner` state; a rope-assisted technique may retain the engine's standing/outside gate. Editorial notes explain these rather than claiming a different game state.
- The 15 excluded events remain **playable** in the match engine: omission means not a technique record, not removed gameplay.
- Do not use the raw 325/340 metric as evidence of missing playable technique support. The 15 excluded entries are classified performance events.

## Next work

Mechanical training-school tags or new linking behaviour require a separate gameplay phase with deterministic baseline tests; do not silently enable them through metadata.
