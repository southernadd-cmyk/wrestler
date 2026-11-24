# Phase 5R.2 — spoken claims and responsive rebuttals

This is the first bounded semantic layer for new directed browser promos. It does not expand the 713 authored character lines or add a runtime LLM.

## Source provenance

A claim describes the statement actually emitted. The graph records the ID and fingerprint of the **selected reply template**, not the opening angle or opponent style. The authored selector takes precedence on existing eligible opening/calm slots; if it supplies an opponent line, its stable authored ID and exact wording fingerprint determine the claim instead of the graph source. The registry contains 231 reviewed sources and 39 topic records. Unknown, edited, or unreviewed lines remain unclassified. No runtime NLP or keyword guessing. The style-derived strength is used by the new semantic engine only when the selected template explicitly states that strength. Future source edits must update the reviewed fingerprint and pass validation.

Each semantic response links to the index of the immediately preceding spoken line (stage directions and crowd reactions do not count). A response is a relation to a claim; an opponent counter carries the topic it actually advances. New turns use claim-specific rebuttals; the optional press and acknowledgment address the latest point, including the opponent's intervening counter. Distinct press responses avoid echoing the previous counter. Unclassified replies use conservative wording without attributing an invented argument. Speaker voice, composure/irritation and recency influence the choice among applicable alternatives. The displayed answer/press labels and opening cue identify the spoken point instead of the old style-derived description.

Example: in the same sw_main slot and same match seed the graph reply may challenge whether the wrestler belongs on the card, while Magnus's authored reply asks whether the audience has been consulted. Those are separate semantic topics and receive different rebuttals even though the opponent's wrestling style is identical.

## Protection and continuity

The existing graph still owns all mechanical decisions: risk, selected variant effects, quality, heat, crowd, trust, promises, tactics, and match payoff. Recorded evidence and cases, specific counter-plan arguments, and mouthpieces are excluded from semantic rewriting. Closings and non-turn answer options retain their existing graph/approved authored paths. Existing mid-scene saves do not opt into new semantics; new scenes store a small version flag and actual speech tags in the existing log. No save version migration. Outcome parity and exact JSON resume are regression-tested. No additional workflows.

The original style-based turn bank rows are preserved in the editorial sources and lazy assets for old scenes, but are intentionally not selected for new semantic rebuttals until reviewed or rewritten against specific claim tags. The same is true of generic authored press/acknowledge rows. This phase is not an editorial pass or a guarantee of fully natural dialogue. The graph can still be generic in unreviewed options, protected cases, and mouthpiece scenes. Some claims have only one counter/follow-up; recurring pairings still need a variation audit.

## Scale and next steps

The shared semantic module is approximately 32 KB of raw JavaScript, including the initial reviewed fingerprints and compact response families. Character-bank lazy loading, per-character caching, and pinned scene payloads are unchanged. Before expanding the roster, move bank-specific claim metadata into the lazy assets or their validated editorial schema so that adding character lines does not indefinitely grow the startup registry. The initial fingerprint registry is deliberately reviewable and bounded.

The new suite validates every source fingerprint against production graph/templates and bank data, checks same-variant/different-utterance behavior, unclassified and protected fallback, source links, and 960 paired seeded scenes across the established roster. Targeted CI includes it. Actual pass status must be checked in CI. Next: Phase 5R.3 real browser network, navigation, and save/resume audit; then blinded editorial assessment of whether responsive turns actually read naturally. No additional character banks until those audits and the metadata design are resolved.
