# The Office — Wrestling Manager v2.5

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

## Existing saves

The game loads local v2, v2.1, v2.2 and v2.3 careers on the same origin, including a match night in progress. The same local save storage keys have been retained. Save files can be exported and imported manually when moving between origins.

## Archive

The original sumo game is preserved on the `archive/sumo-before-the-office-2026-11-11` branch.
