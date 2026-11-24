# Early-career finances — v0.65

The player starts with £2,250. Signing charges the transfer fee immediately; wages, overheads and training are charged weekly. Bankruptcy occurs below −£500. The first-week signing forecast is read-only and uses current whole-stable expenses, an extra £25 in headcount overhead and the free light-drills default for the new contract. It does not assume match income, a grant or new bookings.

The scouting report and signing confirmation show cash after signing, estimated weekly costs, the bank after one week with no income, and the number of whole weeks covered at current spending. The reserve filter selects contracts that leave at least two weeks' running costs. The warning thresholds are presentation guidance, not restrictions on signing.

## Verified opening audit — 24 November 2026

[PR #289](https://github.com/southernadd-cmyk/wrestler/pull/289), [CI run 45407460712](https://github.com/southernadd-cmyk/wrestler/actions/runs/45407460712).

Run `node tests/early-career-finances.test.cjs`. Four seeds (13, 27, 41, 91), all 20 affordable opening free agents each, actual signing and booking acceptance, no injected cash. All 80 opening scenarios could book a current-week match.

| Seed | Val Vance best opening purse | Kit Marlowe bank after week four | Val Vance bank after week four |
| --- | ---: | ---: | ---: |
| 13 | £400 | £1,500 | £70 |
| 27 | £380 | £1,810 | £590 |
| 41 | £510 | £1,180 | −£470 |
| 91 | £590 | £1,180 | −£390 |

Val's £1,710 fee leaves £540, and £295 wages plus £85 overhead leave £160 without an opening match. The longer sample uses neutral three-star results with no injuries and full purses when a booking is obtained; these are not real match simulations or guaranteed income. Four seeded paths are not proof of universal solvency. In particular, weeks without accepted bookings are observed under this policy, not proof that the entire market was empty or recovery impossible.

No economy rules changed in this phase. A prudent opening can survive the first backer review under the tested policy. The expensive opening remains deliberately risky, with warnings before commitment. Revisit balance if broader live-play evidence indicates a systemic lack of affordable bookings or recovery options.

Desktop and phone signing confirmation and reserve-filter checks also passed in the focused Chromium job. See [CI policy](ci-policy.md).
