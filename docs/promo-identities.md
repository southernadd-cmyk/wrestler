# Promo identities — phase 2

The catalogue in `assets/js/promo-identity.js` defines an individual, authored speaking profile for every established wrestler (80), the six rival agency managers, the four promoters and a neutral player-manager profile. It is loaded in the browser and headless simulation but does not change the dialogue generator yet.

Each profile records delivery, motivation, vulnerability, trigger, rhetorical tactic, boundary, response under pressure and a distinctive sample line. The samples are original editorial reference material, not lines emitted by the current engine or factual match history. Profiles are immutable, independent of temporary stats and age, and do not alter the save schema. Existing character biographies and ambitions are the starting point; new vulnerabilities and delivery details are creative proposals.

API: `OfficePromoIdentity.wrestler(wrestlerObjectOrId)` and `OfficePromoIdentity.person(agencyOrPromoterId)`. The player profile is intentionally neutral; it must not impose a fictional backstory on the player's named manager. Academy recruits resolve from their existing generated voice/ambition and a stable ID-derived combination of vulnerabilities and triggers, with no dependence on appearance, origin, or ethnicity. Generated recruits use style-level reference samples, not individually authored lines; later dialogue phases must build distinct substantive content from those profiles. Unknown IDs return null.

Validation: `node tests/promo-identity.test.cjs` checks coverage, field completeness, distinct authored sample lines, age/stat independence, manager/promoter coverage, and deterministic academy profile variation across the registered candidates. It does not certify writing quality or claim the live dialogue has changed.

Next: a bounded conversation director that consumes these profiles and tracks subject, claims, emotion, interruptions, and ending conditions while preserving current outcomes and match-verifiable promises. Character lines must not assert match history that the career state cannot support.
