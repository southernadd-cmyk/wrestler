# Promo segments — not every promo is a back-and-forth

Before a match (when there is no contract signing and the promo is not skipped) the player now picks the kind of segment. "Face to face" is the existing directed duel, unchanged, including the mouthpiece choice. The four new segments are small standalone scenes in `assets/js/promo-segments.js`, built on the contract-signing pattern: three decisions, a deterministic hash from the contract id, effects before the bell applied once at the end, and a result the match and history read like any promo (`v:3`, `format` set to the segment id).

| Segment | Decisions | What it does |
|---|---|---|
| Solo promo | who it is for, the hook, the closer | A mic test with only the crowd answering. The closer can make a public promise (win or clean finish) that is checked after the match like a duel promise. Insulting the town is cheap heat: the room turns, but heat and atmosphere still rise. |
| Pre-taped vignette | setting, tone, edit | No live mic roll; quality comes from how setting, tone and the wrestler's voice fit, plus TV production. Capped at 82. |
| Backstage ambush | where, the attack, afterwards | The opponent starts the match with lower stamina (`opponentHurt`). The opponent may fight back (your wrestler gets fatigue and `pushThrough`). Promoter trust moves with personality and visibility. |
| Interview grilling | three contextual questions (injury, form, personal feud, ego, being unknown, the opponent's claim, the promoter, losing) | Straight answers lift morale; walking out ends it early, costs a little trust and adds heat. |

## The wrestler's own words

The solo promo and the grilling draw on the character banks through the shared selector (`OfficePromoDialogue.select`), so the owner, graph variant, conditions, within-scene use and recent-history exclusion all still apply. Only slots that make sense with nobody answering are used:

- crowd address: `open/people` (lines not addressed to "you");
- talking about themselves: `open/swagger` (not addressed to "you"; a pose line is preceded by the pose);
- talking to the absent opponent, in the solo promo or "turn it on them" in the grilling: `answer/challenge`, after a "looks into the camera" stage direction;
- straight interview answers: slots chosen per question (`open/swagger`, `open/people`, `answer/calm` restraint, `close/clean`, `close/vow`), never addressed to "you";
- done talking / walking out: `close/uncertainty` `un_done` (generated rookie banks keep the voice line for a walk-out);
- promising a win or a clean finish: `selectClosing` / `selectRookieVow`, the duel's own commitment guard, and the promise is recorded.

Outside those two promise closers, any line with win or clean-finish promise wording is refused, even where the duel's guard would call it ambiguous ("I'll win this one."), because nobody would record it. Hooks with no matching slot (true story, threat, insulting the town, title ambition, jokes) and any beat without a fresh eligible bank line use the eight voice-family lines. The wrestler's bank is copied into the scene save, so choices never need the network and a reload resumes exactly.

Not used: the semantic claim/rebuttal layer and the director. Both model an argument between two speakers, and these segments have one. The ambush and the vignette use only voice-family writing; the banks have no slots for them.

## Checks

`tests/promo-segments.test.cjs` (CI promo group): every decision path in all eight voices with and without banks; determinism and save/resume; contextual grilling questions; vignette independence from mic skill; ambush stamina, trust and history; solo mic-skill sensitivity and cheap heat; all 212 banks (67% of wrestler lines in the sampled scenes are their own words, 200/212 vows authored, no unrecorded promises in interviews, no "you" lines spoken to the room); repetition avoidance across promos; and a solo vow checked after the match.

Browser: `tests/promo-browser.cjs` and `tests/browser-smoke.cjs` choose "Face to face" at the new picker. No save migration: a duel already in progress when the game updates continues as a duel.
