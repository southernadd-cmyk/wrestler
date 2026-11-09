# Dohyō

A sumo roguelite with Three.js bout playback. Build a deck and fight through the Spirit Cup. The classic career is available from the game header.

## Run locally

Use Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the local address Vite prints. The arena uses WebGL 2. Progress is saved in the current browser.

```sh
npm run build
npm run preview
```

The production build in `dist/` can be served by a static host.

## Spirit Cup

- Enter with a ten-card deck. Draw five cards and spend up to three stamina on each exchange.
- Read the rival's intent and queue cards in order. Quick leads act first. Slow leads and follow-ups can be interrupted by a shove. The rival sets a rooted stance before your lead.
- Gather Spirit to fund specials. Use the belt grip to set up stronger drives and throws.
- Win the qualifier to draft a card, then choose a dojo upgrade or a mawashi perk before the final. A loss ends the run.
- The tournament saves after each resolved exchange. The overhead arena plays the same exchanges on browsers without WebGL.

## Classic career

- Give your rikishi a ring name, nickname, build and mawashi colour. Choose a wrestling style, two finishing techniques and a broadcast entrance.
- Train power, grip or balance before each bout. Read your opponent and choose a tactic to match. The simulator resolves the exchanges and the Three.js broadcast plays them back.
- Finish three bouts to complete a meet. A winning record moves you up the rankings. At Ōzeki you need a clean sweep to reach Yokozuna. A clean sweep in the top division earns an in-game title.
- Pause, speed up or replay a broadcast. Training and results are recorded once, when the live bout ends.

The rikishi, meets and promotion rules are fictional. The opening broadcast uses generated music and graphics. Ring rules and technique names draw on the [Japan Sumo Association’s introduction](https://www.sumo.or.jp/pdf/en/sumo_introduction.pdf) and [technique guide](https://www.sumo.or.jp/Kimarite/show/).
