# The Office — source architecture

The site runs directly on GitHub Pages: no bundler, framework, backend or installation is needed to play.

```text
index.html                  HTML document and ordered stylesheet/script tags
assets/css/
  core.css                  Shared styles
  match-night.css           Match planning and presentation
  mobile.css                Responsive overrides
  backstage.css             Independent desktop conversation and running-order panes
assets/js/
  portraits.js              Pixel-art portrait renderer
  data.js                   Existing 28 wrestler templates, match plans, profiles
  roster-registry.js        Unified 80-wrestler registry from the approved cast bible
  match-engine.js           Deterministic match simulator and graph
  career.js                 Finances, roster, weekly calendar, saved careers
  territory.js              Four independent promotion card ladders
  living-world.js           Opt-in v4 agency budgets, contracts and migrations
  story.js                  Storylines and rivalries
  memory.js                 Wrestler memory
  sheets.js                 Match planning and shared graph kernel
  agents-room.js            Dennis and backstage decisions
  promo-duel.js             Mic battles and vows
  ui.js                     Screens, controls and browser events
assets/portrait-atlas.png   Wrestler sprite sheet (previously embedded in CSS)
assets/first-week.css       Existing onboarding guide CSS
assets/first-week.js        Existing onboarding guide JS
tests/_source.cjs           Loads the actual shipped modules in browser order
tests/*.test.cjs            Deterministic simulation and structure regressions
tests/run-tests.cjs         Cross-platform test runner
```

## Dependencies and load order

The order of deferred JavaScript tags in `index.html` matters. Each module retains its existing closure and `window.Office*` API to avoid rewriting or changing deterministic engine behaviour. `ui.js` comes last, followed by the existing first-week module. Do not reorder without updating `tests/_source.cjs`.

Original portrait data was extracted to a PNG. All relative CSS paths resolve from the stylesheet's `assets/css` directory. The site still uses hosted Google Fonts with local font fallbacks.

## Testing

Run `npm test` or `node tests/run-tests.cjs`. Individual suites still run with `node tests/name.test.cjs`. The regression harness reads and combines actual modular JS files in browser order, so there is no separate stale copy of the engine.

GitHub Actions continues to execute every `tests/*.test.cjs` suite. Always require green CI before merging a structural change.

## Backstage layout

Desktop match planning uses independent, height-bounded scroll panes for Dennis's conversation and the running order. Smaller viewports use a compact single-column layout instead of overlapping scroll areas.

## Save compatibility

Local storage keys and save formats are unchanged. The refactor is a source reorganisation and layout correction; it does not rewrite game rules or remove the first-week onboarding.

## v4 roster integration (pre-release)

The unified 80-wrestler registry is available through `OfficeData.ALL` / `OfficeData.findWrestler(id)`; the original 28 template objects remain unchanged. New workers currently have compatible interim move archetypes, not their final bespoke move signatures.

`OfficeWorldV4.activate(OfficeGame.S)` explicitly migrates a career to six AI agencies. Contracts, agency budgets, transfer records, market and independent status live under `worldV4` in the existing v22 save. Activation is idempotent and preserves existing owned wrestlers, their progress, pending bookings, historical results and promotion card ledgers. Player signings, releases and AI recruitment synchronize ownership; agency finance updates are applied once per week.

**This is not the v4 public rollout.** The live New Career route remains on 28 wrestlers pending the new portrait atlas, full integration tests and in-browser QA.

### v4 default launch

Every new career now automatically activates the 80-wrestler world, including 20 market workers, 44 AI-contract workers across six agencies and 16 independents. Every old v20–v22 career migrates on load without losing player contracts or recorded history. Six agency budgets and independent promotion-card ladders continue to evolve every week. The former v4 activation switch is no longer necessary for players.
