# Booking Negotiations V2 — Phase 6 balance audit

**Date:** 22 November 2026  
**Scope:** The Office, existing booking negotiation engine, promoters, contract effects, management meetings and career trust.

## Method

The audit invokes the **actual shipped career and negotiation scripts**, through the same headless Node harness used for regression testing. It is not a probability model or a sample of real players.

The repeatable sweep uses **576 initial negotiations**: four promoters × four legal leverage bands × four wrestler styles × three requests (money, billing, loss protection) × three arguments (crowd, reliability, commercial compromise). A counteroffer is additionally replayed from an identical starting career with a hardball response. The first legal concrete trade is also tested.

The sample deliberately includes no title/programme offers in this sweep, because those are handled by the existing dedicated restriction tests. Stipulation-specific restrictions remain covered by the stipulation and Phase 4 regression tests.

Run the audit with:

```bash
node tests/negotiation-balance-audit.cjs
```

The runner prints machine-readable aggregates between `NEGOTIATION_BALANCE_AUDIT_BEGIN` and `NEGOTIATION_BALANCE_AUDIT_END`, then checks broad balance guardrails. It uses one existing GitHub Actions PR safety job; **no new workflow**.

## Findings

| Metric | Before Phase 6 | After Phase 6 |
|---|---:|---:|
| Initial scenarios | 576 | 576 |
| Established-level demands receiving agreement or counteroffer | 144/144 (100%) | 132/144 (91.7%) |
| Star-level demands receiving agreement or counteroffer | 144/144 (100%) | 141/144 (97.9%) |
| Concrete trades accepted when offered after a counter | 125/125 (100%) | 126/150 (84.0%) |
| Hardball securing the full demand | 24/125 (19.2%) | 45/150 (30.0%) |
| Hardball withdrawing the entire booking | 48/125 (38.4%) | 40/150 (26.7%) |
| Average fee change for star-level requests for better billing, across all 48 samples | +£435 | −£182.70 |

These figures compare *different deterministic bargaining situations*, not empirical real-player success rates. Some denominator changes are expected: higher stakes now produce more counteroffers rather than immediate agreements.

The previous version had two clear economic exploits:

1. **Better billing without a financial concession.** Moving a wrestler up the card increased the appearance fee automatically because the booking's slot multiplier rose.
2. **Guaranteed concrete trades.** A counteroffer was eligible once the argument was within 17 strength points of the threshold, but trade bonuses were sufficient to make the first available concession automatically pass in every tested counteroffer.

There was also a practical reason to negotiate every high-value booking: very strong wrestlers always obtained improved initial proposals, and successful fee raises carried no promoter-relationship cost beyond spending a management meeting.

## Corrections

- **Better billing now costs cash.** A fully agreed upward move targets a guaranteed appearance fee around 90% of the original; counteroffer discounts are deeper and remain promoter-specific. All values use the real purse formula, not an assumption about `bump`.
- **Expensive fee requests and main-event places need stronger justification.** The requested pay increase is evaluated against the actual contract value; moving from featured to main-event position adds greater resistance than a lower-card promotion. No random chance is added.
- **Concrete trades can fail, but are still worth trying.** The promoter can reject an offer that does not sufficiently close the bargaining gap. A rejected trade leaves the original invitation available and costs one promoter trust point.
- **Accepting a pay rise costs some goodwill.** This only applies when the player explicitly accepts an increased guarantee: Gaz −2 trust, Nina −1, Harold −2, Vivian −3. Direct signing or retaining the original offer does not incur this charge. Existing match-completion trust bonuses remain unchanged.
- **Hardball remains intentionally dangerous.** A player can win the full terms, lose the counteroffer, or have the invitation withdrawn entirely. The promoter's trust and personality govern the reaction.

These choices create distinct, legible trade-offs:

| Manager choice | What they gain | What they sacrifice or risk |
|---|---|---|
| Sign the original | Booking secured promptly | No negotiated improvement |
| Ask for more money | Higher guarantee | One meeting, risk of refusal and trust cost if accepted |
| Ask for higher billing | Better career exposure | Lower guarantee, one meeting, refusal risk |
| Request protection | A less damaging booked defeat | Lower guarantee, one meeting, refusal risk |
| Offer a concrete package | Potentially several improved terms | Specific cash, billing, finish or stipulated-match concessions |
| Push hardball | Chance to recover full terms | Trust penalty and possible loss of the booking |

## Regression coverage

The standing tests check that unsigned offers never mutate the signed contract, the promoter's winner cannot change, stipulations respect booked DQ finishes, trades cannot be repeated indefinitely, saves and week deadlines are honoured, and accepted fee rises cost exactly the advertised trust amount.

The sweep also guards against three regressions: automatically higher pay on a billing upgrade, guaranteed acceptance of every concrete trade and absolute immunity from promoter resistance for a star demanding main-event space.

## Remaining balancing questions

- **Low-leverage talent:** In the four lowest-leverage scenarios, across promoters and arguments, requests for an improved card slot received **0/48** initial counteroffers or agreements. That may appropriately signal that newcomers should build drawing power first, but it deserves hands-on playtesting for clarity and frustration.
- **Stipulation utility and injury:** The audit does not attempt to express increased fatigue, risk, feud momentum or crowd reception in arbitrary cash values. Those systems remain subject to their dedicated tests.
- **Whole-season management economy:** The two weekly management meetings compete with training and other management actions, but the present sweep is per offer, not a representative multi-season policy simulation.

Phase 6 fixes the measured dominance problems while keeping direct signing useful and negotiation outcomes materially different. Further changes should be driven by actual career playthroughs or saved-career simulations rather than by forcing every promoter to have similar success percentages.
