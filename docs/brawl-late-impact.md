# Brawl finishing variety: legal impact, not generic holds

Follows the read-only diagnostic in PR #143 and endurance patch in PR #142.

**Failure diagnosed:** Competent Brawl performers train at conditioning **0.344**, below the previous **0.50** late-offence threshold. In a 288-match trace, 69.2% of competent worker-controlled eligible late snapshots were also below a blanket **26 stamina**. The graph offered an average of **7.6 of 25 legally available named specialist moves** (9.2% selection weight), and the most common late "power move" was the **bearhug**, a valid clinch rather than a landed impact. Only five named strike landings occurred across 96 competent 18-minute matches.

**Patch:**
- For Brawl-style workers on the **Brawl plan in matches >=15 minutes only**, a meaningful late-action selection lane opens with conditioning **>=0.30**. Novices and all other match plans remain unchanged.
- Every extra legal move requires a **cost-dependent stamina reserve**; expensive lifts still use the existing stronger `isValid` gate. All physical area, grip, timing, counter/abort/landing and weight limits stay authoritative. No free matches, stars or guaranteed landings.
- The last-three-minute pool may offer *distinct* named strikes and physically legal power/corner/outside attacks. Standing body-clinches and holding racks aren't treated as impact moves.
- Running moves gain late preference only after a **real recorded rope/rebound setup**. A controlled strike may lead to a narrated rope run before the subsequent named running manoeuvre.
- A capped **3x** rescale gives current *legal, unused* impact actions a competitive but non-guaranteed selection share without throwing out normal non-impact choices or other match plans.

**Verification:** Dedicated graph regression tests, 288-match late tick/attempt trace and the complete 4,860-match paired five-plan audit. Explicitly distinguish named moves, *landed distinct impacts* excluding holds/bearhug, strike attempts/landings, two-impact rate, match-quality components and injury/botch. Check 8/12-minute baselines and novice competence separation. Do not merge on green checks alone if impact results do not improve.
