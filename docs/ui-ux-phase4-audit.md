# The Office — Phase 4 interface audit

**Scope:** visual consistency, responsive layouts and interaction clarity of the existing management interface. Preserve the 1990s/Championship Manager-inspired presentation and existing game systems.

## Method and limits

The existing browser smoke test exercises a full career-to-match-night flow at 1280 × 720 and 390 × 844. Phase 4 adds rendered Chromium DOM checks at **1440 × 900**, **1024 × 768**, **768 × 820** and **360 × 740**, covering eleven screens: Desk, Inbox, Stable, Scouting, Offers, Fixtures, Card pyramid, Promoters, Rivalries, Results and Booking sheets.

Checks verify viewport/document width, app and top-bar bounds, screen rendering, filter control widths, Inbox detail under an active filter, dynamic market styles and phone filter geometry. Internal horizontal scrolling of large data tables is intentional and is not treated as page overflow.

**Limit:** this is a source review plus real browser layout/interaction tests, not a screenshot-by-screenshot aesthetic sign-off of every state or an exhaustive keyboard/screen-reader audit. Those remain follow-up QA.

## Findings and remedies

| Priority | Finding | Effect | Phase 4 action |
| --- | --- | --- | --- |
| High | Inbox default selection could prioritise an unanswered message **outside the active Reports filter**. | A populated filtered list could have an empty message detail; misleading on desktop and confusing when switching between phone master/detail. | Restrict initial selection to the active list; prefer an unanswered decision **within** it, otherwise first matching message. Add a Chromium regression with a pending message and an unrelated report. |
| Medium | Scouting hard-coded a four-style dropdown while the market comes from runtime roster data. | A current or future free-agent style could have no matching filter option. | Derive sorted styles from the market, reset a stale selection, and browser-test a market style absent from the old list. |
| Medium | Phone management filter rows were flex-wrap driven, producing uneven rows and variable search field widths. | Harder to scan on narrow screens. | Full-width search first, paired selectors and a clear filter/count row; retain 44px select targets. |
| Medium | Inbox filter tabs used flexible widths, potentially yielding uneven grouping on phone. | Harder to compare All, Action, Unread and Reports counts. | Consistent 2 × 2 phone grid, pressed state and keyboard semantics unchanged. |
| Medium | Long names and compact linked records have limited space in phone cards and facts. | Crowded text or hard-to-tap nested record links on very narrow screens. | Add wrapping and clearer mobile link tap area without changing desktop information density. |

## Intentionally unchanged

- Existing desktop navigation frame, window chrome, pixel typography and game colours.
- Bookings, wrestler stats, match plans, simulation, financial balance, saves and weekly reporting.
- Table data density, sorting semantics and intentional scrolling of large tables.
- Existing GitHub Actions workflow definitions. The current Playwright and Node jobs run the checks.

## Follow-up

Phase 5 should include explicit keyboard focus order on nested table links, modal focus restoration, announced live status changes, full accessible-name checks and a manual visual/screen-reader pass in a real phone browser.
