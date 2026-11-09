# Dohyō

A Three.js sumo career prototype. Create a rikishi, scout an opponent, train for the bout and watch the opening charge and finish from ringside.

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

## The career

- Give your rikishi a ring name, nickname, build and mawashi colour. Choose a wrestling style, two finishing techniques and a broadcast entrance.
- Train power, grip or balance before each bout. Read your opponent and choose a tactic to match. The simulator resolves the exchanges and the Three.js broadcast plays them back.
- Finish three bouts to complete a meet. A winning record moves you up the rankings. At Ōzeki you need a clean sweep to reach Yokozuna. A clean sweep in the top division earns an in-game title.
- Pause, speed up or replay a broadcast. Training and results are recorded once, when the live bout ends.

The rikishi, meets and promotion rules are fictional. The opening broadcast uses generated music and graphics. Ring rules and technique names draw on the [Japan Sumo Association’s introduction](https://www.sumo.or.jp/pdf/en/sumo_introduction.pdf) and [technique guide](https://www.sumo.or.jp/Kimarite/show/).
