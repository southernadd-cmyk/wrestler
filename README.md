# The Office — Wrestling Manager v3.0

A standalone wrestling management game. Run a stable, take the bookings, and sit at ringside for every match.

## Play

Open `index.html` (or the GitHub Pages site). The game is a single dependency-free file; no server or build step is required. Fonts load from Google Fonts.

## Interface

v2.4 introduced the interface with a 90s management-sim desktop, in the spirit of early Championship Manager and Domina:

- A permanent sidebar (Office, Roster, Bookings, Territory, Game) with back and forward buttons, and a Continue button that is always in the same place.
- The Desk opens on an in-tray of things that need attention, each with a button that takes you there.
- Sortable squad and free-agent tables with colour-coded attributes, a full profile screen for each wrestler, and list-and-detail screens for offers and scouting.
- Match night has a tale-of-the-tape screen before the bell, a commentary panel beside a ringside panel during the match, and a result screen afterwards.
- On narrow screens the layout becomes a single scrolling page.

Before each bout, choose a microphone approach (call them out, rally the fans, play mind games, or offer a respectful warning). Both wrestlers deliver original promo dialogue before the bell. Promo quality influences crowd reaction and rivalry development. At ringside, Space pauses the match and keys 1 to 6 make calls.

## Systems

16-week regional season; contract negotiation; wrestler recruitment and coaching; pre-match promos with four meaningful approaches and original dialogue; context-sensitive and phase-specific match commentary; heat-driven storylines, rivalries and blow-offs; live text matches with ringside decisions; rival promotions; persistent title pyramid; export and import of career saves.

## The USP — matches are scripted, people are not (v3.0)

The player runs a regional wrestling **stable**, not a whole promotion.
Promoters decide contractual results; wrestlers remember how those results
affected them and whether the manager treated them fairly.

A first, playable character-memory system now includes:

- **Meaningful wrestler memories.** Injuries, humiliating clean defeats,
  protected losses, off-script trouble, standout performances and promises
  are recorded against the wrestler and opponent, not regenerated randomly.
  Each wrestler remembers up to 12 significant moments in the existing save.
- **Rex Titan's first backstage conflict.** Book Rex to lose clean and he
  will challenge you afterwards through the existing Inbox. Publicly backing
  him helps trust but risks promoter goodwill; explaining the business works
  better with professionals; promising a featured match becomes a real
  two-week contractual obligation.
- **Persistent consequences.** Manager trust and personal rival feelings
  carry into future appearances. Low trust reduces willingness to follow
  the sheet; remembered grievances appear in scouting notes, microphone
  conversations and ringside commentary.
- **Promises matter.** The existing booking and calendar logic decides
  whether a future featured opportunity was actually provided. Kept and
  broken promises become new memories and alter trust.
- **Respect for the player's time.** At most one new backstage confrontation
  per show, a cooldown on routine discussions, and immediate exceptions for
  major injuries or an intentional double-cross. No new menu or currency.

Old v2.x local saves and mid-match saves are kept; the new state is optional
and created only as needed. Original data and dialogue, no LLM/network calls.
Detailed design: [wrestler memory](docs/wrestler-memory.md).

Test with `node tests/memory-flow.test.cjs` alongside the four existing
regression suites.

## Individual match personalities (v2.9)

The v2.7 story/action/outcome graphs are retained, with four lightweight improvements to keep matches recognisable, believable and fun:

- **Individual repertoires:** 14 original wrestlers now have personal in-ring tendencies, distinct from the five available booking plans. A brawler, technical wrestler, spectacle wrestler and storyteller favour different sequences even when assigned the same plan.
- **Physical effort and size:** expensive moves drain stamina, fatigued wrestlers pause to recover, and unrealistic heavy lifts are blocked. Special spots also respect fatigue and major weight differences.
- **Road-agent scouting:** a short pre-match note summarises the opponent's tendencies, size differences and a practical tactic. Changing the game plan changes the advice, but does not add menu complexity.
- **Deterministic saves and contractual finishes:** match result contracts, the familiar Office UI, existing saves and live ringside calls remain intact. Wrestler profiles are keyed by IDs so old saved careers gain these identities without a save migration.

The emphasis is on *different stories with the same simple controls*, not a hidden HP-based competitive fighting game. Design context and scope: [match variety](docs/match-variety.md).

Run `node tests/match-variety.test.cjs` together with the three earlier test files to verify this extension.

## Interactive microphone segments (v2.8)

Promos are now genuine **three-part dialogue encounters**. Choose an opening angle, answer the opponent's interruption, and deliver a final line. Your choices become permanent once spoken and the opponent's response depends on what you said; there are no score previews to optimise.

- 15 choice nodes and 125 combinations, with further variation from character, previous rivalry and creative metaphors
- Separate tradeoffs: crowd support, feud heat, credibility, morale, and the promoter's trust
- Promise a win, a named finisher, or clean wrestling; the match and its results determine whether you deliver
- The in-ring commentary remembers the microphone promise
- Full promo transcript in match history; autosave and restore midway through the conversation
- The existing 1990s management interface and save storage are preserved

Research includes the **Randy Savage** “Cream of the Crop” promo, the Mega Powers confrontation and the Steamboat/Warrior matches, plus real archived transcript references. See [promo graph design and research](docs/promo-graph.md).

Test: `node tests/promo-flow.test.cjs`.

## Causal event graph (v2.7)

The match engine now uses a hierarchical, weighted **13-arc story graph**, a **59-node / 172-edge action graph** and a **six-outcome finish graph**. Matches vary based on wrestling style, current positioning, reversals, damage, crowd and contracted results. Chains of moves have explicit transitions (e.g., lock-up → wristlock → counter → takedown → hold → rope break) rather than independent random commentary.

- Separate damage and selling for each wrestler; counters change control explicitly.
- Floor, corner, apron and top-rope exchanges require appropriate setup and recovery.
- Near-falls follow a meaningful move and a legal pinning attempt.
- Booked wins/losses remain authoritative unless the manager makes an explicit off-script or medical stoppage decision.
- Original lines are influenced by real-match analyses and performer interviews, not copied transcripts.
- The v2.4/v2.5 interface and existing save keys remain intact, including migration of mid-bout v2.6 saves.

**Details and primary research links:** [Match graph architecture and research](docs/match-graph.md).

**Regression tests:** `node tests/match-flow.test.cjs` and `node tests/graph-flow.test.cjs`.

## Match psychology (v2.6)

The match engine now links moves into cause-and-effect sequences instead of choosing isolated actions. It remembers who is in control, whether the action is inside or outside the ring, who is down, and which body part is being worked.

- Match types have different pacing: story, technical, brawl, high-flying and safe matches.
- A phase change must be earned by a counter or cut-off, not an unexplained change of attacker.
- Wrestlers sell damage through the match. Heat segments can contain false comebacks and consistent targeting of an injury.
- Big moves require a realistic setup (ropes, corner, floor or apron), and a pin requires both wrestlers to be back inside.
- Near-falls follow a move and a cover; dirty finishes now show the distraction, the illegal pin and the referee's count in the correct order.
- The finish relates to the prior damage, with conditional consequences for injured or exhausted wrestlers.
- The four booked finishes, ringside decisions, crowd ratings, promos, rivalries and mid-match save/resume remain intact.

### Research basis

Original match narration and event templates, informed by wrestling psychology and actual match breakdowns rather than copied transcripts:

- [Matt Murphy — Match Structure](https://missouriwrestlingrevival.com/2009/12/23/chapter-15-match-structure-by-matt-murphy/)
- [Savage vs Steamboat — WWE retrospective](https://www.wwe.com/inside/listthis/maniamatches/maniamatches7)
- [Hart vs Austin — action and control analysis](https://www.prowrestlingmusings.com/post/greatest-matches-of-all-time-bret-hart-vs-steve-austin)
- [Bayley vs Banks — targeted injury and match callbacks](https://www.cagesideseats.com/wwe/2016/7/25/12264730/making-history-bayleys-journey-part-5)

Test without dependencies: `node tests/match-flow.test.cjs`.

## Existing saves

The game loads local v2, v2.1, v2.2 and v2.3 careers on the same origin, including a match night in progress. The same local save storage keys have been retained. Save files can be exported and imported manually when moving between origins.

## Archive

The original sumo game is preserved on the `archive/sumo-before-the-office-2026-11-11` branch.
