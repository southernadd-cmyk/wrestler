# Match structures — Phase 4 career activation

## Player workflow

The backstage meeting starts with **Traditional (current)** selected. Before the first plan choice, the player can choose Classic American Director, King's Road, Chickenshit Heel or Dominant Ace, and assign a dramatic lead to either wrestler. The lead is not the booked winner. Changing the choice restarts only the unsigned first plan screen; once a plan decision is made, the structure is locked.

The meeting uses Phase 2's four dramatic objectives rather than inventing American shine/heat/comeback slots. The player agrees the finishing route and may choose real moves or leave objectives to the wrestlers. Both selection and in-progress meeting are stored in the existing match-night autosave. Old meetings with no `structureChoice` remain Traditional.

## Contract boundary

At the bell the signed sheet passes through existing vow and ringside attachments. `OfficeSheets.STRUCTURES.executionChoice(sheet,selection)` enables the Phase 3 Director only when the selected identity and dramatic lead match a valid signed Phase 2 `structurePlan`. Missing selection returns false. Malformed or stale selections fail closed rather than silently rewriting the contracted finish.

The live two-lane timeline shows objective windows and actual witnessed actions. The result contrasts intended calls with performed evidence; the career history retains the result. No five-beat chemistry, automatic star bonus, or new career reward is granted for completing a structure. Traditional matches retain their previous behaviour and consequences.

## Verification

The existing Simulation tests PR workflow includes `tests/structure-career-activation.test.cjs` for all four structures, two leads and two performance plans, signed/unsigned validation, outcome conservation and legacy compatibility. The Phase 0 fingerprint and Phase 1–3 evidence tests remain intact; no additional workflow is created. Chromium journeys run on main.

## Next stage

Review the unusually high Chickenshit Heel objective completion rate for natural variety before adjusting the game balance. Do not combine speculative tuning or rewards with this integration.
