# Phase 9H — Earned finishing-sequence follow-through and variety

## Why this is next

Merged Phase 9G (`c9affcf`) now reports **zero unexplained late winner-control losses** in the standard 960-bout matched comparison; nine late losses after a real opponent reversal are legitimate and must stay possible. The remaining bottleneck is *selection*, not a missing magical finisher: among 240 clean active bouts, 153 had an authored setup, 57 later performed a matching impact, 114 had a diversion immediately after setup, and only 23 were credited a real causal closing runway (12 fully witnessed four-beat sequences).

The natural 10-second next-move guidance already makes actual legal impacts available. But if the first choice after an authored setup is a legitimate standing continuation (such as an ordinary lockup), closing guidance disappears even when the wrestler has not surrendered control, disengaged or changed position. The existing reporter already permits up to 60 seconds and real intermediate actions within an otherwise unbroken authored source→impact link.

## Narrow implementation

1. In `closingOffers`, a **single** genuine same-controller standing move after an authored winning-side setup can offer that *same authored impact* for one more turn. Require: booked clean Director-active bout; live winner ownership; in-ring standing legality; last real move equals the graph node; authentic eligible setup exactly one preceding performed action; at most 20 seconds between them and 40 seconds since setup; no opponent takeover, counters, fake finish, rest, pose, breather, deliberate disengagement, or pending attempt. Every offered impact still passes the ordinary `isValid` physical/safety/stamina filters, and the existing weighted pool continues to offer alternatives.
2. Prefer a distinct authored impact over immediately repeating the same recently landed move, in both direct and one-intermediate branches. This is a **soft choice weight** (fresh 2.8, repeated 1.1), never a forced or newly invented move. Existing clean finish windows and source-authored graph edges remain unchanged.
3. Record actual distinct credited setup→impact pairs, distinct impacts, recent repeated impacts and credited sequences with genuine intervening moves in the existing read-only audit. Verify that counted outcomes are still grounded in real tape actions.

## Safety and comparison

Preserve Phase 9G's genuine counter attribution, source-backed earned near-falls, booked outcomes, zero route fallbacks, normal wrestler autonomy and saved-state contract. Safe may not gain risky moves; loser may win control through a real reversal; meta-only and dirty finishes receive no guidance. The matched comparison must be 480 active plus 480 metadata-only matches, tested across all five plans, four structures, two roles and three lengths, plus targeted legal graph tests.

**Baseline:** 23 credited runways / 240 clean active; 12 fully witnessed; 0 unexplained control losses; 0 booked fallback; 74 active botches / 90 matched control. Report both gains *and* regressions, including impacts, pair variety, stars and genuine reversals, before any merge.

**Status:** Candidate gameplay update for evaluation. Do not merge without explicit user approval. No new GitHub workflows.
