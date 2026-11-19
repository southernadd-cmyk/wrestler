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
  technique-registry.js     90 source-reviewed technique metadata records
  technique-backgrounds.js  Independent technical-school identities for all 80 wrestlers
  match-engine.js           Deterministic match simulator and graph
  career.js                 Finances, roster, weekly calendar, saved careers
  territory.js              Four independent promotion card ladders
  living-world.js           Live six-agency budgets, contracts and save migrations
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
  after-bell.js             What happens after the bell: the planned angle, the post-match microphone, callouts
  ringside.js               A stablemate at ringside: in the corner, a distraction, a referee bump or a run-in
  disqualify.js             Disqualifications nobody booked, carried through the results; promoters booking DQ finishes
  stipulations.js           No DQ, submission only, falls count anywhere, two out of three falls: negotiated and played
  signing.js                The contract signing before title matches, blow-offs and programme payoffs
  mouthpiece.js             A stablemate who talks for a poor talker: who can, and what it does afterwards
  programme-arcs.js         Chapter-by-chapter creative direction for signed programmes
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

`tests/world-soak.test.cjs` plays four seeded careers for three seasons with every system on (ambitions, storylines, managers, the business, programmes, approaches, bids, releases) and checks after every week that nobody is booked twice, contracts and rosters agree, belts are valid, programme dates are still booked, numbers stay in range, the save holds no corrupted values, and the start screen predicted the circuit card exactly. `tests/_world.cjs` is the shared player and checker; `node tools/world-sweep.cjs <first seed> <count> <weeks>` runs it across many careers by hand. Any state that `decide()` reads must not change between the prediction and the real week: belts are settled before planning (`settledTitles()`), and an offered programme's claim is kept with its expiry week in `territory.programmes.offered`, not read from the offers list.

GitHub Actions continues to execute every `tests/*.test.cjs` suite. Always require green CI before merging a structural change.

## Backstage layout

Desktop match planning uses independent, height-bounded scroll panes for Dennis's conversation and the running order. Smaller viewports use a compact single-column layout instead of overlapping scroll areas.

## Save compatibility

Local storage keys and save formats are unchanged. The refactor is a source reorganisation and layout correction; it does not rewrite game rules or remove the first-week onboarding.

## v0.4 roster integration (shipped)

The unified 80-wrestler registry is available through `OfficeData.ALL` / `OfficeData.findWrestler(id)`; the original 28 template objects remain unchanged. Since v0.3.11 every new worker has a written ring profile of their own (`RING_PROFILES` in `roster-registry.js`); the interim move archetypes are gone.

`OfficeWorldV4.activate(OfficeGame.S)` explicitly migrates a career to six AI agencies. Contracts, agency budgets, transfer records, market and independent status live under `worldV4` in the existing v22 save. Activation is idempotent and preserves existing owned wrestlers, their progress, pending bookings, historical results and promotion card ledgers. Player signings, releases and AI recruitment synchronize ownership; agency finance updates are applied once per week.

This section describes the migration as it was first built. The 80-wrestler world is now live for every career; see below.

### v0.4 default launch (shipped)

Every new career now automatically activates the 80-wrestler world, including 20 market workers, 44 AI-contract workers across six agencies and 16 independents. Every old v20–v22 career migrates on load without losing player contracts or recorded history. Six agency budgets and independent promotion-card ladders continue to evolve every week. The former v0.4 activation switch is no longer necessary for players.

## v0.4.0 release — independently authored technical schools and match graph

The [v0.4 release guide](v0.4-release.md) records the **current**, shipped inventory. Read it before relying on old graph counts in the Phase 1–9 historical reports: **979 nodes, 6,401 edges, 340 authored moves, 90 reviewed technique records**, and all 80 wrestler technical identities. Phase 9's original 969 / 6,333 counts are preserved as historical evidence.

`OfficeTechniqueRegistry` supplies reviewed mechanics and relations for **90** moves; it does not replace the underlying executable catalog. `OfficeTechniqueBackgrounds` assigns 40 retained and 40 explicitly *provisional* individual school preferences; selection effects are bounded and subject to `OfficeMatch.GRAPH.isValid`. A performance style, technical background and weekly training session remain independent concepts. The graph also contains curated Phase 3/5/5b/8 technique links, Phase 9 authored combinations and Phase 10's 12 named scripted high-spot mappings.

The graph supports serialised aerial/springboard attempts and **four** named grapple-attempt pilots; the remaining actions still use the original coarse position/control model. The narrative clock is shared by pacing, phase labels and scoring. When performing changes, preserve legacy saves, legal weight/position/timing gates and booked finishes. `tests/match-phase-pacing.test.cjs`, `tests/phase10-scripted-spots.test.cjs`, `tests/phase9-authored-chains.test.cjs`, `tests/phase8-depth-variety.test.cjs` and `tests/graph-lab.test.cjs` provide specific regression coverage in addition to the full suite.

The next work on **250 unreviewed techniques and controlled physical-state improvements** is a proposed review, **not** already shipped. See [the detailed next-phase assessment](technique-and-realism-review.md) and [documentation guide](README.md).

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

## v0.3.20 additions

- **After the bell** (`after-bell.js`, `window.OfficeAfter`). Once Dennis's meeting is signed, the manager picks what happens when the match is over (`night.plan.after`): nothing, **a handshake**, **a stare-down**, **an attack after the bell**, or (after a booked win) **a lap of honour**. `begin(c, fin, plan)` runs straight after `applyResult` and plays the angle once per contract (`S.after.done`). The other wrestler may refuse the handshake (bond, ego, a dirty finish) or may not have agreed to be jumped (their professionalism and bond); a worked attack draws heat and pleases Dockside and Pulse but annoys North Crown and Grand Union, while one they never agreed to is a real scuffle: £100 fine, promoter trust −6, bond −25.
- **The microphone.** Then your wrestler talks (`micOptions`, `speak`): a winner can rub it in or give credit, a loser can take it like a pro or blame the finish (only believed after a dirty or protected finish), and anyone can demand a rematch or **call out** one of up to two others at that promotion: its champion, somebody with an old score, or the wrestler just above them on the card. The chance (`callChance`, 8–90%) rises with mic skill, heat, the stars and a win, and falls the higher up the card the target is. A callout that lands raises feud heat and waits in `S.after.calls`; the next week (wrapping `G.endWeek`, after the week's offers are made) the promoter offers that match to that wrestler, one slot up the card, tagged `Callout`, with a letter. A call whose wrestler or target has gone is dropped after two weeks. A flop costs heat and morale, and a title challenge from nowhere costs promoter trust.
- **Screens.** The meeting's Signed panel holds the After the bell picker; the result screen offers After the bell or a skip; the segment saves with the night (`stage:'after'`) and resumes after a reload even after the last match of the night. Every outcome is hashed from the contract id, so nothing draws a random number. The world soak plays a segment after every one of your matches.

## v0.3.21 additions

- **Ringside plans** (`ringside.js`, `window.OfficeRingside`). On the meeting's Signed panel the manager can send one of the stable's other wrestlers out with the worker (`night.plan.corner`, `"<id>:<job>"`). Jobs: **in the corner** (crowd lift at the entrance from the second's heat), **distract the referee**, **a planned referee bump** (only with feud heat 25+ or a dirty or protected finish) and **a run-in** (only with a dirty win booked). An injured wrestler can only stand in the corner; one with a bond of −35 or worse refuses.
- **On the match strip.** `attach(sheet, c, choice)` puts `sheet.corner` and a `corner` beat (lane *Ringside*, window by job, a hashed moment inside it) on the signed sheet at the bell. A wrapper on `OfficeMatch.next` announces the second before the opening bell and fires the moment when the clock reaches it (or just before the finish). The referee may eject the second (base odds by job, +10% at North Crown and Grand Union, −8% at Pulse, more for a careless second), and a bump can really hurt the referee (the two wrestlers' safety). Landed moments lift the crowd and add to the layout's share of the stars; failures take some away. The booked finish is never changed. `sheets.js` and the room's steering skip `corner` beats (they keep their own time), and the strip uses a beat's `move` text when it has one.
- **Afterwards.** `settle(c, M)` (called from the result screen, once per contract via `S.ringside.done`): bond and morale for a second in the corner; heat, bond and a nod (Dockside, Pulse) or a frown (North Crown, Grand Union) for a job done; feud heat for a run-in or bump; promoter trust and the second's morale for an ejection; £50 and trust −4 for a hurt referee. The world soak settles a ringside outcome after every match.

## v0.3.22 additions

- **Disqualifications in the match graph** (`match-engine.js`). The outcome graph has three new outcomes: `win_dq` and `lose_dq` (booked, in `D.FINISHES`: a cheap win and a loss that makes your wrestler look dangerous) and `dq` (called by the referee). Six booked routes join `FINISH_ROUTES` (the opponent's chair, a shove of the referee or a low blow in front of the official; your wrestler's chair, a choke past five or a shove), so there are twenty-six finish routes. The room offers them as finish cards like any other.
- **The referee.** A `cheap_shot` event may be seen (20%, 28% at North Crown and Grand Union; 50% once that wrestler has been warned), hashed from the seed and the clock so the match's own random numbers are untouched. The first sighting is a warning. Your wrestler is only thrown out on a second sighting if the manager let them off the leash (`leash:'free'`), fired them up (`talk:'fire'`) or they had already gone off the layout: the contract is only broken by the manager's own choices, as before. A professional (78+) heeds the warning. The opponent is warned but never thrown out. Nobody is warned when the match is already a DQ or the rules allow anything (`stip:'nodq'`, for the stipulations to come). A thrown-out match (`M.dqCall` → `M.outcome='dq'`) ends at once, is capped at two and a half stars and costs the crowd.
- **Ringside.** A run-in the referee sees (`ringside.js`) is now a disqualification, not an ejection.
- **Results** (`disqualify.js`, `window.OfficeDQ`). An unbooked DQ reaches every module as an ordinary `lose_dq` loss (record, rankings, rivalry, promises), with the history marked `outcome:'dq'` and `booked:` the original finish; the promoter loses the finish they booked (trust −10 for a booked win, −4 for a loss), a quarter comes off the purse, and the wrestler remembers it. Promoters book DQ finishes now and then (`dqFinish`): 30% of title defences, 25% of rematches, 22% of title matches, 15% of callouts and 5% of other bouts turn a dirty win or protected loss into a DQ, and a champion can keep the belt on one. The rivalry ledger records a DQ as `how:'dq'`: nobody won it clean and nobody cheated their way to it. A promise not to cheat is broken by `lose_dq`.

## v0.3.23 additions

- **Stipulations** (`stipulations.js`, `window.OfficeStips`). Four: **no disqualification**, **submission only**, **falls count anywhere** and **two out of three falls**. Each booker has a taste for them (`STIPS[k].taste` by personality: Dockside's favourite is No DQ, Pulse's falls count anywhere, North Crown's two out of three falls, Grand Union's submission only; North Crown will not have No DQ on a family show), and each suits some styles more than others.
- **Negotiation.** A fourth thing to ask a promoter for (`talkMove(oid, wid, 'ask:stip:<kind>')`, a management meeting). The argument's strength is set against `chance()`'s need: 68, less the booker's taste, less a quarter of the feud heat (up to 16), more for an opener (+14) or mid-card (+6), less for a main event or a blow-off. Agreed: the stipulation and 10% more on the fee (unless you traded money for it). Close but short: the booker offers their own favourite instead. Taking the original terms drops it. Blow-offs come with the promoter's favourite seven times in ten. A match booked to end in a DQ cannot be No DQ. Signing carries `stip` onto the contract; two out of three falls runs five minutes longer.
- **The night.** `OfficeMatch.create` is wrapped: the stipulation is announced, lifts the crowd, changes the risk and the fit for each style, and schedules its own moments (`M.stipSpots`, fired from a wrapper on `next`): chairs and tables, fights into the crowd and the bar, holds the referee asks about, and for two out of three falls a fall to each wrestler before the decider. Every finish route is wrapped so the booked result arrives by the rules: a tap-out, a chair, a pin on the stage (each reporting an existing route id with the same meaning, so the rivalry ledger stays truthful); booked DQ finishes and two out of three falls play their usual routes after the falls. No DQ silences the referee (no warnings, no disqualifications) and makes a run-in legal, whatever the finish.
- **Afterwards** (`applyResult` wrapper, once per contract): extra fatigue (No DQ +6, anywhere +5, falls +4, submission +2), feud heat +5, and the history records the stipulation.
- **Screens.** The promoter meeting lists the four with the booker's view and whether they suit the wrestler; the deal panel, offer details, offers list and match night show the stipulation.

## v0.3.24 additions

- **Demands on the microphone** (`after-bell.js`). After the bell your wrestler can now **demand a title shot** (only from below the main event: a main-event name is offered the title match anyway; and only when the belt is free to book: no title match already on the table or a title programme claiming it) or **demand a bigger spot** (if they are not already in the main event at that promotion). `demandChance` weighs mic skill, heat, the stars, a win and (for the title) how high up the card they are against the booker: Pulse loves being put on the spot (−12), Dockside a little (−4), North Crown does not (+6) and Grand Union least of all (+14). A title demand that lands books the champion the next week (`S.after.calls`, kind `title`, delivered after the week's offers, with a letter), unless the promoter has already offered that match or a programme; one that flops costs trust (−3, North Crown −4, Grand Union −6), heat and morale. A bigger spot that lands moves them 8 up that promotion's card (and pleases Dockside and Pulse); one that flops costs a little trust and morale.
- **The contract signing** (`signing.js`, `window.OfficeSigning`). Before a title match, a blow-off or a programme's payoff, Dennis sends your wrestler to a table instead of the microphone. Three rounds: how they come to the table (sign straight away, read it aloud, keep them waiting), what they do when the other wrestler starts (say nothing, give it back, get in their face) and how they sign (offer a hand, throw the pen, walk off, flip the table). Tension starts with the feud, the bond and the opponent's ego and rises or falls with each choice; a hand offered into a hot room can be met with a forearm, a room past boiling point boils over, and flipping the table always does. A brawl lifts the crowd and the feud and leaves your wrestler sore (fatigue +6 and the engine's `pushThrough` risk for the match). `result()` is shaped like a promo result (`hook`, `crowdShift`, `quality`, `heatDelta`, the dialogue), so the engine and the post-match records take it as they take a promo; the history names it as a contract signing. It saves with the night (`stage:'signing'`) and resumes after a reload.

## v0.3.25 additions

- **Mouthpieces** (`mouthpiece.js`, `window.OfficeMouthpiece`; `promo-duel.js`). Before the first line of a promo, if a stablemate is clearly the better talker (mic at least 10 higher, not away at camp, not an enemy), Dennis asks who has the microphone. `OfficeMic.begin(c, w, f, rival, sheet, p, {mouth})` takes the mouthpiece as `st.speaker`: their mic skill (and the better of the two wrestlers' psychology) is what the core rolls and the duel's own rolls use, their voice chooses the hooks, fluffs and narration, the log names them as the speaker, and they never borrow the wrestler's personal lines. Everything said is still about the wrestler, and the promises are still the wrestler's to keep. Dennis's read of the room still goes by the wrestler's own fame. The other side is likelier to go for the mockery angle (“Can't they speak for themselves?”). The result carries `mouth`.
- **Afterwards** (`applyResult` wrapper, once per contract): the two are closer (+8 after a good promo, +3 otherwise); a wrestler with a big ego (72+) resents being spoken for (morale −3), anybody else is grateful (+1); half the heat the promo gave the wrestler goes back (it was somebody else's work), and a mouthpiece who gets 70+ is noticed (heat +2). In tests a poor talker's promos went from 49 to 83 on average with a good mouthpiece, and the opponent went for the mockery twice as often.


## v0.3.26 additions — programme arcs

- **Chapters, not extra bookings.** `programme-arcs.js` (`OfficeProgrammeArcs`) extends `OfficeProgrammes` and the match-night screens. Signed title chases, grudges and rising-star programmes have their own opening, middle and payoff chapters. Once Dennis signs the match layout, the player can choose one of three distinct creative directions: **steady** (show it in the ring), **needle** (use the microphone to provoke), or **gamble** (make a stronger public claim). Titles, dates, opponents and finishes remain entirely controlled by the promoter; no new booking engine or match graph is introduced.
- **Continuity.** The opening question at the microphone and Dennis’s pre-match read reflect that direction. A chapter only settles on `G.applyResult`, using the actual match rating and (when present) recorded promo quality. The outcome is recorded on the programme as a short, dated recap. The next meeting and the next promo reference it; the after-bell segment acknowledges the next contracted match, or the end of the programme. Booking sheets display the evolving arc and completed verdict.
- **Consequences.** Each programme starts with momentum 45. Steady/needle/gamble choices raise it by 5/9/14 when they land, or lower it by 3/6/10 when they do not. Bigger claims demand correspondingly stronger promos and matches. The module only makes small heat/trust changes; a particularly strong complete arc earns +2 reputation, separate from the original kept-programme bonus. Never change the contracted finish, championship or purse on account of a creative choice.
- **Persistence and tests.** A contract stores `arcDecision` at the bell, and the programme stores `arc:{v,momentum,timeline,conclusion}`. The completed programme keeps this data, with one settlement per chapter even if the result is called again. Old saves without an arc initialise from whichever chapter they have reached (past matches are not replayed). `programme-arcs.test.cjs` covers phases, decisions, mic/after-bell callbacks, risks, final bonuses, legacy saves, and reloads; the seeded world soak now runs mixed directions in live programmes and verifies their records. The script is loaded after `mouthpiece.js` and before `ui.js` in both the page and the test loader.
