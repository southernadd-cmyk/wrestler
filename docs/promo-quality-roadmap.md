# Promo quality overhaul

## Phase 1 — baseline (no gameplay changes)

The existing live OfficeMic duel has valuable mechanics: choices, context-sensitive risk, opponent rebuttal, rivalry cases, mouthpieces, crowd response and match-verifiable promises. Preserve these contracts and existing saves. The problem is expressive and structural, not simply a lack of variants.

Source findings:
- `story.js` selects substantive opening/rebuttal/closing lines from shared angle and contextual variant pools; previous variant avoidance is limited to the recorded last promo in a rivalry.
- `promo-duel.js` applies individual voice packs chiefly to optional performance flourishes and delivery mistakes. The main spoken arguments are passed through from the shared graph. Mouthpieces also use grammatical substitution on client claims.
- `agents-room.js` maps wrestlers to broad voice categories, falling back to stoic; measure explicit coverage for the full registered roster.
- The live duel always advances through open, answer, push and close. Choosing to leave the push round still leads to a closing round.
- Existing tests cover branching, fit, risk, consequences and determinism; these are necessary but not sufficient evidence of compelling dialogue.

### Reproduce

Run `node tests/promo-quality-baseline.test.cjs`. The existing targeted CI workflow runs this test automatically on its own PR; no additional workflow is introduced. To retain the complete sample for offline editorial review:

```sh
PROMO_AUDIT_JSON=/tmp/promos.json node tests/promo-quality-baseline.test.cjs
```

The fixed sampling policy produces 16 scenes per registered wrestler (including non-player characters used as hypothetical speakers), eight against a fixed opponent and eight rotating through the opponent pool, across slots, finishes and synthetic rivalry heat. It measures explicit voice coverage, own-pack coverage, exact normalized line reuse within a repeated pairing, sharing across speakers, repeated crowd reactions, round structures and promise types. Names and venue labels are normalized for comparison. The report separates substantive speech from optional push lines and opponent speech. It prints representative transcripts and verifies deterministic mid-scene serialization for each wrestler.

Limitations: normalization is an exact-text proxy, not semantic similarity; fixed choices are a reproducible sample, not a model of player behaviour; synthetic rivalry heat does not reproduce a real career's incident ledger; this initial baseline does not yet sample mouthpieces, ageing or generated rookies. Counts are descriptive, not pass/fail quality thresholds. Do not claim that an increase in distinct strings alone constitutes better writing.

## Editorial review rubric

Review a fixed, anonymized transcript sample before and after each dialogue phase. Score each dimension 0 (absent/broken), 1 (partial), 2 (convincing); record evidence and examples, not just scores:
- Identity: can a reader distinguish two wrestlers without names?
- Motivation: is there a specific reason to speak now, grounded in character and situation?
- Responsiveness: does each reply answer the actual preceding claim?
- Continuity: are results, promises, alliances and remembered events accurate?
- Dramatic shape: does the scene build, pivot or end naturally without filler?
- Consequence: does it set up a meaningful next action without forcing an incompatible booked finish?
- Tone: are humour, menace, emotion and silence appropriate to the individual rather than uniform comedy?
- Kayfabe: distinguish audience-facing rivalry from private workplace conflict.

Include first meetings, repeat rivals, loss and victory, high/low mic ability, technical and flamboyant workers, veterans and rookies, managers and mouthpieces. Keep the old version as a comparison, and include failure cases, not just best examples.

## Next phases

1. Baseline metrics and editorial sample; no production modifications.
2. Authored character profiles covering goals, vulnerabilities, delivery, vocabulary, taboos, tactics and emotional responses; explicit validation for the full roster. Provide deterministic generation for academy intake and manager roles, but never override authored identity.
3. Scene director with conversational subject, active claim, emotional state and bounded transitions. Preserve old saves and promise semantics; avoid an always-best dialogue option.
4. Distinct formats: call-out, backstage interview, face-to-face, championship declaration, contract signing, post-match, open challenge, manager address and silent confrontation. Introduce one format at a time.
5. Character-specific substantive opening, replies and closing; keep factual references constrained to known state. Write varied dramatic beats instead of name-swapped templates.
6. Interruptions, refusal, silence, improvisation and genuinely different scene lengths, bounded by psychology and player authority.
7. Persistent semantic memory: subjects, claims, promises, unresolved issues, emotional consequences and intentional callbacks. Separate storyline and real backstage relations.
8. Integrate earned chants, Ringfax, match commentary, bookings and other consequences without double-applying outcomes.
9. Evolve delivery with age, experience and career turning points. Generated rookies develop rather than inherit generic veterans' voices.
10. Compare the fixed audit corpus and real-career samples; manually review blinded transcripts and assess repetition, identity and continuity. Preserve the dense single-screen office interface and fast targeted CI.

No runtime LLM dependency is proposed. The engine remains deterministic and browser-local; authored content plus stateful selection and guarded composition provide its variation. This is a proposed implementation choice, not a requirement imposed by the user.
