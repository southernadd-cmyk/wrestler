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
  living-world.js           Opt-in v0.4 agency budgets, contracts and migrations
  story.js                  Storylines and rivalries
  memory.js                 Wrestler memory
  sheets.js                 Match planning and shared graph kernel
  agents-room.js            Dennis and backstage decisions
  promo-duel.js             Mic battles and vows
  relationships.js          Bonds, grudges, backstage scenes and betrayals between wrestlers
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

## v0.4 roster integration (pre-release)

The unified 80-wrestler registry is available through `OfficeData.ALL` / `OfficeData.findWrestler(id)`; the original 28 template objects remain unchanged. Since v0.3.11 every new worker has a written ring profile of their own (`RING_PROFILES` in `roster-registry.js`); the interim move archetypes are gone.

`OfficeWorldV4.activate(OfficeGame.S)` explicitly migrates a career to six AI agencies. Contracts, agency budgets, transfer records, market and independent status live under `worldV4` in the existing v22 save. Activation is idempotent and preserves existing owned wrestlers, their progress, pending bookings, historical results and promotion card ledgers. Player signings, releases and AI recruitment synchronize ownership; agency finance updates are applied once per week.

This section describes the migration as it was first built. The 80-wrestler world is now live for every career; see below.

### v0.4 default launch

Every new career now automatically activates the 80-wrestler world, including 20 market workers, 44 AI-contract workers across six agencies and 16 independents. Every old v20–v22 career migrates on load without losing player contracts or recorded history. Six agency budgets and independent promotion-card ladders continue to evolve every week. The former v0.4 activation switch is no longer necessary for players.

## v0.3.9–v0.3.10 additions

- **Divisions and belts** (`data.js`, `territory.js`). `OfficeData.divisionOf(id)` puts every wrestler in the men’s or women’s division, and `OfficeData.belt(pid, div)` names each of the eight championships and points at its art in `assets/belts/`. `promotionRank(pid, div)` ranks one division. Title holders, defences and the title history live in `territory.titles` and `territory.titleLog` in the existing save. Older saves are migrated once, guarded by `divisionsReady` and `titles`.
- **Personal voices** (`roster-registry.js`). `OfficeData.VOICE_PACKS` holds 17 lines for each of the 80 wrestlers. The agents’ room and the promo duel use a wrestler’s own line about two times in three, alongside the eight shared voice types.
- **Room chains and threads** (`agents-room.js`). Follow-up situations are marked `followup` and are never drawn on their own. `chain()` puts one later in the same meeting; `carry()` saves a thread on the signed match layout, and the post-match hook keeps it in `S.roomThreads` for up to eight weeks.
- **Contextual promo angles** (`story.js`, `promo-duel.js`). A promo node may carry a `when(context)` test; the choices on screen are the core five for each stage plus any extra angle whose test passes.
- **Entrance ideas** (`agents-room.js`). `DAFT_OWN` gives every wrestler a personal idea, and `DAFT_MORE` adds three shared ones for each voice type.
- **Start screen** (`index.html`, `ui.js`, `core.css`). `posterBill()` picks tonight’s bill, reading the saved career directly without loading it. The motion only runs under `prefers-reduced-motion: no-preference`.

## v0.3.11 additions

- **Ring profiles** (`roster-registry.js`). `RING_PROFILES` gives each of the 52 newcomers a weight, trait, four preferred moments and four signature moves from the catalog; `enableProfiles()` installs them into `OfficeData.PROFILES` for new and migrated careers.
- **The locker room** (`relationships.js`, `window.OfficeBonds`). Bonds from −100 to 100 between pairs of wrestlers live in `S.bonds.pairs` in the existing save, each with its recent reasons. The module wraps `applyResult` (bonds from the memories a match leaves, and a friend turning after a clean loss), `OfficeRoom.begin` (friends, enemies and leaked plans in Dennis’s room), `endWeek` (journeys, jealousy, grudges boiling over and at most one backstage scene every other week) and `answer` (the four `bond_*` scenes, and the existing car-park row). Every change is recorded once per source, so replays and reloads never double-count.
