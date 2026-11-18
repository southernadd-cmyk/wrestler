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
  rivalry.js                Each pairing's record, evidence-backed promo arguments, counter-proposal reasons
  ambitions.js              What every wrestler wants, weekly satisfaction, requests, promises and walk-outs
  booking-office.js         Each promoter's storylines, the circuit's weekly card and the bookers' finishes
  rival-managers.js         The six agencies lobbying bookers, moving and poaching wrestlers, and bidding for yours
  promotion-business.js     Each promotion's crowds, buzz, money and momentum; desperate booking and raids
  programmes.js             Storylines offered to your wrestlers: signed as one, changed by the booker, kept or walked out of
  approaches.js             The rival stables' rosters on view, approaching their wrestlers, and managers' grudges
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

## v0.3.12 additions

- **Match evidence** (`match-engine.js`). `final.evidence` records, from the graph events, counters and late counters by side and move family, cheap shots by side, stamina at the bell, injuries and each sheet beat's outcome; `final.roomNegotiation` carries any agreed change. It is read-only and draws no random numbers.
- **The rivalry ledger** (`rivalry.js`, `window.OfficeRivalry`). `S.rivalries["wid:rid"]` holds the last 10 meetings (how each was won), 12 argued claims and 8 negotiations, keyed by contract id so a result is recorded once. Facts are derived on demand, ranked and faded; stance is computed from the existing bond, regard and ledger rather than stored. Older careers rebuild the ledger from `history` on first access. The module wraps `applyResult` last and awards nothing itself.
- **Promo cases** (`story.js`, `promo-duel.js`). `Graph.begin` asks `casesFor` for up to two evidence-backed arguments; each rides on an existing open node, the five answer nodes become positions on the counterclaim, and a close node can make a commitment official (`nocheat` is a new promise type). What is shown is what is played. The duel's push round becomes stand firm / revise / let it stand when a charge is thrown back.
- **Counter-proposals** (`agents-room.js`). `rival_counter` and `rival_counter_reply` are follow-ups placed first in the meeting when a reason is possible, and skipped (a scene's `open` may now return `false`) when the board already avoids the problem. The sheet carries `negotiation` and marks changed beats `negotiated`.
- **Locker room fix** (`relationships.js`). Bond changes now run once per contract, and the chemistry memory is written before the bond is read.
- **Five-bout harness** (`tools/five-bouts.cjs`). Drives the shipped modules through five full nights for one pairing and writes a markdown report.

## v0.3.14 additions

- **Ambitions** (`ambitions.js`, `window.OfficeAmbitions`). Each of the 80 wrestlers has one current ambition: `title`, `push`, `money`, `body`, `rivalry`, `respect`, `stage` or `mentor`. It is chosen from their traits, their best place on any card and their bonds, with the newcomers' written ambition (`CAREER`) as a lean. State lives in `S.ambitions.w[id]` in the existing v22 save and is built the first time it is read, so older careers need no migration step. Satisfaction (0–100) moves once a week with what actually happened: your stable's matches (logged in an `applyResult` wrapper, once per contract id) and the circuit's (`territory.lastResults`, now written by `evolve()`). A met ambition is recorded, remembered and replaced; one that goes nowhere for 14 weeks gives way to another.
- **Your stable.** A new signing says what they want. A frustrated wrestler sends an `amb_ask` decision (at most one open, five weeks apart for each wrestler): promise it (kept: loyalty +8; broken: loyalty −12, morale −10), be straight with them, or tell them to earn it. Money ambitions offer a £40 raise instead of a promise. Low satisfaction drags morale and loyalty, which feeds the existing poach and unhappy scenes. Offers that would serve an ambition are marked in the offer notes.
- **The circuit.** `OfficeWorldV4.evolve` is wrapped: an AI wrestler whose contract is up and whose satisfaction is below 30 turns the renewal down and joins the market; a money ambition is met by a 15% raise when the agency can afford it; and at most one fed-up, proud wrestler a week walks out mid-contract. `pressure(id)` is exposed for the bookers in the next update. Nothing in the module draws a random number.

## v0.3.15 additions

- **The booking office** (`booking-office.js`, `window.OfficeBooking`). Each promotion's booker runs storylines: a **title chase** (build matches for a challenger, then a title match on a planned week), a **grudge** (three matches, the last one settles it) and a **rising star** (wins over better-placed wrestlers, then a match with a main-event name). How each booker plans comes from the promoter's `personality` (`STYLE`): which storylines they reach for first, how long a chase runs, how much they let ability or heat decide a payoff, and how often they change their mind (`swerve`). Bonds and ambitions (`S.bonds`, `S.ambitions`) decide who is cast, so a frustrated title-seeker is more likely to get the chase.
- **Pure planning.** `decide(s,t,week,busy)` returns `{state, bill, notes}` and changes nothing; `circuitBill()` now returns its `bill`, so the start screen still shows next week's real card. `evolve()` commits `state` to `territory.booking`, reports `notes`, and plays each match with the booker's chosen winner (`winner`, `stars`, `line`). Storyline matches are booked first across the circuit; each division then gets the usual bout or a champion's defence, at most two matches a division a week. A storyline whose wrestler is busy (booked against yours) waits a week; three delays and it is dropped. One whose wrestler or belt has gone is dropped at once. The old rotation stays as `rotationBill()` for when the module is absent.
- **Rankings.** The circuit now books about 1.7 times as many matches, so `record()` takes a `scale` and circuit results move the card scores by 0.6 of a player match. The main-event cut-off stays close to where it was.
- **Booking sheets** (`ui.js`, Territory → Booking sheets). Each booker's live storylines with heat, next match and the results so far, and how the last six ended.

## v0.3.16 additions

- **Rival managers** (`rival-managers.js`, `window.OfficeManagers`). Each of the six agencies has a profile (`MANAGERS`): how hard they work the bookers (`push`), their appetite for other people's wrestlers (`poach`), how carefully they spend (`thrift`), who they put forward first (`tiers`) and the promotion they know best (`home`). Their week runs after the circuit's matches (wrapping `OfficeWorldV4.evolve`), so it shapes next week's card. State lives in `territory.agents`.
- **Lobbying.** Each manager pushes the one or two wrestlers who want something most (from `S.ambitions`) at the promotion that serves the ambition, at £50 a time. `lobby[pid][id].w` (0–90) also depends on how the booker rates that manager (`rel`, which rises when their wrestlers deliver and fades back to neutral). The booking office adds it to its preference and casting scores, so lobbied wrestlers get chases and pushes more often. `decide()` stays pure: it reads last week's lobbying.
- **Moves and poaching.** Every eight weeks each manager finds new work for their best wrestler stuck low on every card (a promotion that suits them, then the easiest main event to break into), and wrestlers who want a bigger stage are introduced to a television card. Every other week one manager with money can poach an unhappy wrestler from another agency, releasing their own weakest wrestler first if their roster is full; the old agency gets 30% of the fee.
- **Against you.** An offer you have had on the table for a week (a featured bout, main event or title match) can go to a strongly lobbied rival wrestler instead (`takeSpot`, at most one a week), and the road agent tells you who took it. Every six weeks at most, a manager can bid for one of your wrestlers with heat who wants out or has low loyalty (`agent_bid`): sell, ask for 40% more, pay a £400 loyalty bonus (loyalty +20; they stay), or refuse (loyalty −8 if they wanted to go, +3 if they did not). These bids replace the old North Circuit `poach` scene in `career.js`, which is no longer raised (its resolver stays for saves with one pending). The week before the agencies sign from the market, the road agent tells you who they are after, and Free agents shows it.
- `career.js` now exports `leave()`; `living-world.js` exports `marketTarget()`, the agencies' next signing, so the rumours match what they do. Booking sheets list the managers in each booker's ear, and the rival stables table shows each manager's style.

## v0.3.17 additions

- **The business** (`promotion-business.js`, `window.OfficeBusiness`). Each promotion keeps `crowd`, `buzz`, `money`, `momentum` and a short `history` in `territory.business`, updated once a week after the circuit's matches (wrapping `OfficeWorldV4.evolve`). The crowd heads for a target built from the week's match quality (the circuit's and yours at that promotion), its hottest storyline, its champions' heat, payoffs and title changes. The towns are shared: the circuit's overall excess is taken back off every promotion, and each is pulled partway back to its usual level so no booking style sinks for ever. Money follows the crowd and the buzz.
- **Your reach** with each promoter (`S.promoters[].reach`, which sets purses, reputation and match-night crowds) moves with that promotion's crowd, up to 12 either side of its base.
- **Desperate booking.** A promotion short of money, or losing crowds fast, is marked `desperate` (announced in the circuit news) and cuts its costs. The booking office then runs shorter title chases, changes its mind more often, moves belts more readily and starts storylines sooner, until crowds recover.
- **Head-to-head nights.** When a booker plans a title chase, Dockside, Pulse and any desperate promotion put the title match on the same week as a rival's announced one; North Crown and Grand Union move theirs out of the way. Two payoffs in one week split the towns, and the one with more buzz keeps more of its crowd. `decide()` stays pure: it reads the stored storylines and last week's business.
- **Raids.** At most every six weeks the richest promotion with momentum can sign a rival's best-known name (not a champion, not in a live storyline, not raided in the last 16 weeks, from a promotion not raided in the last 12) to an exclusive deal: the wrestler's card row moves across, £1,500 is spent, buzz moves with them.
- **Screens.** Promoters shows each promotion's state (Hot, Steady, Cooling, Struggling), trend, crowd against its usual level, buzz and money; the booking sheets show the same line under the booker.

## v0.3.18 additions

- **Programmes** (`programmes.js`, `window.OfficeProgrammes`). A promoter who trusts you (40+) can offer one of your wrestlers a whole storyline, at most one offer on the table and one every four weeks: a **title chase** for a main-event or featured name (one or two wins, then the title match against the circuit champion), a **grudge** with a wrestler they have bad blood or a hot feud with (three matches, the last a blow-off), or a **rising star** push for someone low on that card (two wins over better-placed wrestlers, then a main-event name). Which comes first follows the booker's preferences and the wrestler's ambition. The offer (`o.programme`, tagged `Programme`) lists every date, opponent, slot and finish; the payoff's finish leans on the booker, your trust and the promotion's business.
- **Signing** (`G.book` wrapper) needs every date clear and books all of them as ordinary contracts carrying `programme:{id,step}`. Pulling any of them (`G.unbook`) walks out of the whole programme: every date is cancelled and trust falls by 15. A double-cross ends it. Missing the last date (injury, camp, release) collapses it for −8. Seeing it through gives trust +8, reputation +3 and the promotion some buzz.
- **A change of plan.** The week before the payoff, a booker may change the ending (`prog_swerve`, a decision): go along with it (trust +3), argue (a management meeting; the booker may change it back), or walk out.
- **The circuit makes room.** While a title programme is offered or running, the booking office starts no rival chase for that belt and books no champion defences in that division, and the programme's opponents are left out of AI storylines and raids (`claims()`). Everything it reads is in the save, so `decide()` stays pure and the start screen still predicts the circuit (tested with programmes running).
- **Screens.** Offers shows a programme as one offer with its matches, total purse and a single Sign button (no haggling); the booking sheets list your programmes at that promotion.

## v0.3.19 additions

- **Rival stables** (`approaches.js`, `window.OfficeApproaches`, Roster → Rival stables). Every agency's roster with each wrestler's ambition, a mood read from their satisfaction (Wants out, Restless, Settled; the number stays hidden), weeks left on their contract and their stable's asking fee: dearer from a careful manager and for a champion, cheaper in the last four weeks of a contract.
- **Approaches** cost a management meeting and need a free contract and the fee. A settled wrestler always says no. Otherwise the chance rises with how unhappy they are, how little loyalty they have, your reputation and what you can offer for what they want (a fifth on their wage for money; a promoter who trusts you 55+ for a title shot, a push or a bigger stage), and falls with that manager's grudge. Yes: they are released, sign for you at the fee (which goes to their stable) and tell you what they want. Either way a wrestler can only be approached once every four weeks. The odds top out at 0.8 (score ÷ 90, where unhappiness counts most, loyalty above 55 counts against, reputation a little); across 190 approaches in seeded careers about two in three wrestlers who wanted out said yes, down from nine in ten.
- **Grudges** (`territory.agents.grudge`): +1 for an approach, +2 for a poach, −1 every eight weeks. A manager with a grudge of 2 or more bids for your restless wrestlers whatever their usual appetite and two weeks sooner, is the likeliest bidder, and is more likely to take a spot you leave on the table.
- **Faces and belts.** The six managers have painted portraits (`assets/portraits/manager-<agency>.png`, 144×180, keyed `manager:<agency>` in `portraits.js`), shown on Rival stables, the Card pyramid's stables table and their letters. A champion on Rival stables shows the belt they hold (a small belt image and the promotion's name). The screen works out ambitions before reading them, so an older career shows real wants and moods from the start.
