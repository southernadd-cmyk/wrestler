# Promo formats — phase 4

New live pre-match promos opt into five context-selected public segments: backstage interview (relayed live to the hall), in-ring call-out of the already-booked opponent, face-to-face confrontation, address to the crowd, and mouthpiece address. The booking and career context determine the pool; the seed selects reproducibly. A chosen mouthpiece takes precedence. Rivalry evidence and high heat favour confrontations, and broadcast promotions favour interviews.

Each segment has a setting, prompt, opening and rebuttal angle set, decision headings and pacing. The call-out stages the opponent's arrival before their reply. Brief interview/address-by-proxy segments can close earlier; confrontations favour another exchange if still heated. Existing rivalry case angles and all valid closing promises bypass format filtering. No new matches are booked and no private backstage conversation is treated as public.

Title matches, blowoffs and programme finales retain the existing contract-signing route (including its separate tension, brawl and fatigue effects). Post-match interviews retain the existing after-bell engine. Standalone championship declarations, unscheduled challenges and expanded multi-speaker scenes are not yet implemented; these require separate booking/scene integration rather than relabelling a pre-match duel. Phase 5 is the substantial character-specific dialogue rewrite. Most substantive lines are still shared at this point.

The browser presents the format in the existing window heading. Programme prompts and recorded rivalry introductions remain intact. Existing saved phase-3 directed duels without a format stay on their original path. The current baseline reports format counts; PROMO_AUDIT_LEGACY=1 still reproduces the original non-directed path. No save migration or new CI workflows.

Regression: tests/promo-formats.test.cjs samples 240 scenes, all five formats, deterministic selection and resume, angle differentiation, call-out arrival, evidence and closing promise preservation, and signing eligibility. CI must verify the tests.
