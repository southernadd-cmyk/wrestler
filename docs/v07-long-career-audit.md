# v0.7 Phase 4: long career integrity audit

Run `node tools/long-career-audit.cjs 10 4` for four seeds under three policies (10 seasons each). Set `OFFICE_AUDIT_JSON` to a path to save the full season-by-season results. The focused regression suite is `node tests/long-career-audit.test.cjs`. No new GitHub Actions workflows.

- Lean and balanced strategies begin with the normal £2,250. They sign selectively, book real offers, resolve decisions, train/rest, settle sampled match results through the production career code and save/reload every four weeks. Bankruptcy is an outcome, not an automatic test failure.
- The world-only run has a deliberately isolated £100,000 reserve and no player bookings. It tests the circuit, not the player's economic viability.
- Match results are seeded samples, not full engine playthroughs. This does not replace the existing real-match season soak.
- Hard errors: invalid ownership or statistics, retired workers returning to active contracts/fixtures, retired champions, non-finite or inconsistent finances, failed save roundtrips, exceptions.
- Diagnostic outcomes: player cash, bankruptcy, market/active division depth, retirements, available cards, promotion and agency balances, save size. Do not balance the economy or introduce generated wrestlers merely to make a test pass.

The initial roster is finite; retirement without new entrants eventually reduces its depth. The audit measures this before any replenishment design is selected.

## Phase 4B — first balance pass

Routine autonomous agency recruitment leaves at least four market workers and three independents per division when supply permits, and stops routine expansion at nine contracts (the existing hard cap remains twelve). Direct player-related transfers do not use the reserve rule. This protects recruitment choices without resurrecting retired identities or introducing unauthored replacements. Retirement and voluntary player signings can still reduce supply below those thresholds.

The reputation component of newly offered purses now tapers above 40 reputation (1.5 per point becomes 0.5). The early game, promoter reach, match slot, worker tier, heat, local drawing power, bonuses and signed contract purses remain unchanged. The audit reports cash-flow components to inform a subsequent targeted economy pass rather than inventing new charges.

The original 80-person cast is still finite. A separate intake feature needs unique IDs, authored character profiles, appropriate portraits and permanent archival histories; a reserve rule alone cannot sustain an unlimited career.
