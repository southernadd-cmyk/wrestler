<p align="center">
  <img src="docs/readme/masthead.svg" alt="THE OFFICE — a vintage British wrestling newsletter, issue v0.65" width="100%">
</p>

<p align="center"><strong>ISSUE v0.65</strong> &nbsp; • &nbsp; 23 NOVEMBER 2026 &nbsp; • &nbsp; THE TERRITORY TALKS BACK</p>

<p align="center"><strong>THE MATCHES ARE SCRIPTED. THE PEOPLE AREN'T.</strong></p>

<p align="center">
  <strong><a href="https://theoffice.repos.one/">PLAY THE OFFICE</a></strong>
  &nbsp; · &nbsp; <a href="docs/README.md">Inside the engine &amp; contributor guide</a>
  &nbsp; · &nbsp; <a href="#back-issues">Back issues</a>
</p>

<p align="center">
  <a href="#how-to-play">How to play</a> &nbsp; · &nbsp;
  <a href="#how-the-game-works">The main systems</a> &nbsp; · &nbsp;
  <a href="#the-living-roster">The roster</a> &nbsp; · &nbsp;
  <a href="#the-main-event">The Main Event — what's new</a>
</p>

<p align="center"><img src="docs/readme/three-stars.svg" alt="" width="100%"></p>
<p align="center"><img src="docs/readme/04-first-week.svg" alt="FIRST WEEK GUIDE — HOW TO PLAY" width="100%"></p>

## HOW TO PLAY

*From the road agent: nobody gets a payday by staring at the fixture list.*

**The Office** is a free, browser-based **British wrestling management game**. You run a small stable on a fictional independent circuit: sign talent, deal with bookers, prepare matches, handle the microphone and live with the consequences. The promoters choose the booked results. Your decisions determine how the work goes — and whether anyone wants to book you again.

**Your first week, in five moves:**

1. **Sign a wrestler.** Start a **New career** and open **Roster → Free agents**. You've got **£2,250** and room for **five contracts**. Look beyond ring skill: wages, personality, microphone work and condition all matter.
2. **Find a booking.** Open **Bookings → Offers**. Check the opponent, money, billing and proposed finish. Negotiate if you've got a case; pushing too hard can cost you.
3. **Run the office.** Read the inbox, choose a training focus, check fatigue and use your management meetings wisely. The other managers aren't sitting idle.
4. **Work the show.** Press **Continue** when you're ready. Dennis, your road agent, helps you agree a match layout and any backstage decisions. Cut a promo, then follow the bout in live text commentary. You can call instructions from ringside.
5. **Collect the consequences.** Read the report, decide what happens after the bell and check the next offers. A good match can build a rivalry; a broken promise can come back weeks later.

The career is **16 weeks per season** and autosaves in your browser. **Game → Export save** makes a portable copy; **Import save** restores one. Play on desktop or mobile. There's no account to create or software to install.

<p align="center"><img src="docs/readme/three-stars.svg" alt="" width="100%"></p>
<p align="center"><img src="docs/readme/03-territory.svg" alt="TERRITORY REPORT — THE WRESTLING CIRCUIT" width="100%"></p>

## HOW THE GAME WORKS

*The main engines and systems. The workings of the territory, not a list of every button.*

### FOUR BOOKERS, ONE TERRITORY

**Dockside**, **Pulse Underground**, **North Crown** and **Grand Union** are rival promotions with their own crowds, budgets and ideas about wrestling. Their bookers control the cards, the winners, the title picture and the long-term programmes. The eight championships belong to the promotions, not to you. **Territory → Booking sheets** shows which feuds, title chases and pushes are gathering momentum.

You manage the wrestlers, not the entire promotion. The six rival managers compete for contracts and card positions, lobby the bookers and can poach an unhappy talent. Promoters remember reliability, money arguments and the matches you actually deliver. Empty weeks and bad deals cost cash.

### PEOPLE BEFORE NUMBERS

Every one of the **80 fictional wrestlers** has their own attributes, moves, relationships, ambitions and way of speaking. Wrestling style, technical background and weekly training are different things: a fearless flyer can still be poor on the microphone; a safe pair of hands may have no taste for a big spot.

Wrestlers develop, get tired, carry injuries and remember slights. You can train them, rehearse with Dennis and read his assessment of likely gains and risks. As seasons pass, youngsters mature, veterans lose a step and some leave the business. A wrestler is a person on your payroll, not a stat you can endlessly grind.

### THE AGENTS' ROOM AND THE MIC

Before the bell, Dennis and both wrestlers work out the **signed match plan**. Choose the performance approach — **Story, Technical, Brawl, Spot-fest or Safe** — and, if it suits the booking, an additional dramatic structure such as **Classic American, King's Road, Chickenshit Heel or Dominant Ace**. Agree real moves and objectives, handle objections and accept that the wrestlers may change course when they get out there. The **booked winner and finish remain the booker's call**.

Promos are conversations, not a single charisma roll. Open an argument, hear the reply, choose whether to push it and make promises the actual match might have to honour. Wrestlers remember who insulted them, who conceded a point and who talked a big game before losing.

### THE WRESTLING BETWEEN THE BELLS

The live match uses a **graph-based wrestling engine**, with authored moves, legal transitions, ring position, fatigue, counters and real physical consequences. The clock and the plan shape the contest, but they can't conjure a legal move from nowhere. A two-count needs a credible knockdown. A comeback needs a real change of control. A tired wrestler may simply have nothing left for the spectacular finish you wanted.

The text commentary reports the action as it unfolds. You can call for more pace, a breather, a crowd reaction, a big moment or the finish — but the wrestler has to listen, and the opportunity has to exist. Afterwards, the report compares the sheet you signed with what **actually happened**.

### A CIRCUIT THAT REMEMBERS

Results, promos, backstage rows, debts of trust and rivalries feed into later weeks. One match can start a programme; five meetings between the same pair needn't tell the same story. The match engine, career bookers and character memories use deterministic simulation so saves can be resumed and investigated, rather than invented history being filled in behind your back.

[**Engine architecture**](docs/architecture.md) · [**Graph Lab**](https://theoffice.repos.one/tools/graph-lab/) · [**Match-structure development**](https://github.com/southernadd-cmyk/wrestler/pull/194)

<p align="center"><img src="docs/readme/three-stars.svg" alt="" width="100%"></p>

## THE LIVING ROSTER

*From the picture desk: eighty characters, no two careers quite the same.*

The 80-wrestler circuit includes technical specialists, brawlers, flyers, veterans and hopefuls. Your stable can hold **five** of them, while the rest compete for rival managers and promoters. Their starting strengths are only the beginning: contracts, injuries, training and the people they work with change what happens next.

<details>
<summary><strong>Open the full 80-wrestler portrait gallery</strong></summary>

<!-- LIVING ROSTER START -->
<table align="center">
<tr>
<td align="center"><img src="assets/portraits/ace.png" alt="Pixel-art portrait of Ace Cassidy" width="72" height="90"><br><sub>Ace Cassidy</sub></td>
<td align="center"><img src="assets/portraits/aisha.png" alt="Pixel-art portrait of Aisha Moreno" width="72" height="90"><br><sub>Aisha Moreno</sub></td>
<td align="center"><img src="assets/portraits/alina.png" alt="Pixel-art portrait of Alina Fox" width="72" height="90"><br><sub>Alina Fox</sub></td>
<td align="center"><img src="assets/portraits/anya.png" alt="Pixel-art portrait of Anya Ortez" width="72" height="90"><br><sub>Anya Ortez</sub></td>
<td align="center"><img src="assets/portraits/ari.png" alt="Pixel-art portrait of Ari Keats" width="72" height="90"><br><sub>Ari Keats</sub></td>
<td align="center"><img src="assets/portraits/ash.png" alt="Pixel-art portrait of Ash Carter" width="72" height="90"><br><sub>Ash Carter</sub></td>
<td align="center"><img src="assets/portraits/ayla.png" alt="Pixel-art portrait of Ayla Bay" width="72" height="90"><br><sub>Ayla Bay</sub></td>
<td align="center"><img src="assets/portraits/bao.png" alt="Pixel-art portrait of Bao Merrick" width="72" height="90"><br><sub>Bao Merrick</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/bashir.png" alt="Pixel-art portrait of Bashir Lowe" width="72" height="90"><br><sub>Bashir Lowe</sub></td>
<td align="center"><img src="assets/portraits/brick.png" alt="Pixel-art portrait of Brick Mercer" width="72" height="90"><br><sub>Brick Mercer</sub></td>
<td align="center"><img src="assets/portraits/bronte.png" alt="Pixel-art portrait of Brontë Hayes" width="72" height="90"><br><sub>Brontë Hayes</sub></td>
<td align="center"><img src="assets/portraits/cal.png" alt="Pixel-art portrait of Cal Rourke" width="72" height="90"><br><sub>Cal Rourke</sub></td>
<td align="center"><img src="assets/portraits/cass.png" alt="Pixel-art portrait of Cass Rae" width="72" height="90"><br><sub>Cass Rae</sub></td>
<td align="center"><img src="assets/portraits/cedric.png" alt="Pixel-art portrait of Cedric Bloom" width="72" height="90"><br><sub>Cedric Bloom</sub></td>
<td align="center"><img src="assets/portraits/cleo.png" alt="Pixel-art portrait of Cleo Watt" width="72" height="90"><br><sub>Cleo Watt</sub></td>
<td align="center"><img src="assets/portraits/dax.png" alt="Pixel-art portrait of Dax Hollis" width="72" height="90"><br><sub>Dax Hollis</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/dean.png" alt="Pixel-art portrait of Dean Blackwell" width="72" height="90"><br><sub>Dean Blackwell</sub></td>
<td align="center"><img src="assets/portraits/dee.png" alt="Pixel-art portrait of Dee Okafor" width="72" height="90"><br><sub>Dee Okafor</sub></td>
<td align="center"><img src="assets/portraits/dev.png" alt="Pixel-art portrait of Dev Hart" width="72" height="90"><br><sub>Dev Hart</sub></td>
<td align="center"><img src="assets/portraits/eira.png" alt="Pixel-art portrait of Eira Solis" width="72" height="90"><br><sub>Eira Solis</sub></td>
<td align="center"><img src="assets/portraits/ellis.png" alt="Pixel-art portrait of Ellis Quade" width="72" height="90"><br><sub>Ellis Quade</sub></td>
<td align="center"><img src="assets/portraits/elodie.png" alt="Pixel-art portrait of Elodie Quinn" width="72" height="90"><br><sub>Elodie Quinn</sub></td>
<td align="center"><img src="assets/portraits/emmett.png" alt="Pixel-art portrait of Emmett Briggs" width="72" height="90"><br><sub>Emmett Briggs</sub></td>
<td align="center"><img src="assets/portraits/ezra.png" alt="Pixel-art portrait of Ezra Quill" width="72" height="90"><br><sub>Ezra Quill</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/faye.png" alt="Pixel-art portrait of Faye Calder" width="72" height="90"><br><sub>Faye Calder</sub></td>
<td align="center"><img src="assets/portraits/felix.png" alt="Pixel-art portrait of Felix Orr" width="72" height="90"><br><sub>Felix Orr</sub></td>
<td align="center"><img src="assets/portraits/gideon.png" alt="Pixel-art portrait of Gideon Frost" width="72" height="90"><br><sub>Gideon Frost</sub></td>
<td align="center"><img src="assets/portraits/gus.png" alt="Pixel-art portrait of Gus Marr" width="72" height="90"><br><sub>Gus Marr</sub></td>
<td align="center"><img src="assets/portraits/imani.png" alt="Pixel-art portrait of Imani King" width="72" height="90"><br><sub>Imani King</sub></td>
<td align="center"><img src="assets/portraits/iris.png" alt="Pixel-art portrait of Iris Vaughan" width="72" height="90"><br><sub>Iris Vaughan</sub></td>
<td align="center"><img src="assets/portraits/ivo.png" alt="Pixel-art portrait of Ivo Serrano" width="72" height="90"><br><sub>Ivo Serrano</sub></td>
<td align="center"><img src="assets/portraits/jett.png" alt="Pixel-art portrait of Jett Harlow" width="72" height="90"><br><sub>Jett Harlow</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/jun.png" alt="Pixel-art portrait of Jun Park" width="72" height="90"><br><sub>Jun Park</sub></td>
<td align="center"><img src="assets/portraits/juno.png" alt="Pixel-art portrait of Juno Stark" width="72" height="90"><br><sub>Juno Stark</sub></td>
<td align="center"><img src="assets/portraits/kellan.png" alt="Pixel-art portrait of Kellan Ryu" width="72" height="90"><br><sub>Kellan Ryu</sub></td>
<td align="center"><img src="assets/portraits/kezia.png" alt="Pixel-art portrait of Kezia North" width="72" height="90"><br><sub>Kezia North</sub></td>
<td align="center"><img src="assets/portraits/kira.png" alt="Pixel-art portrait of Kira Sato" width="72" height="90"><br><sub>Kira Sato</sub></td>
<td align="center"><img src="assets/portraits/kit.png" alt="Pixel-art portrait of Kit Marlowe" width="72" height="90"><br><sub>Kit Marlowe</sub></td>
<td align="center"><img src="assets/portraits/kofi.png" alt="Pixel-art portrait of Kofi Hale" width="72" height="90"><br><sub>Kofi Hale</sub></td>
<td align="center"><img src="assets/portraits/leandro.png" alt="Pixel-art portrait of Leandro Moya" width="72" height="90"><br><sub>Leandro Moya</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/liya.png" alt="Pixel-art portrait of Liya Fen" width="72" height="90"><br><sub>Liya Fen</sub></td>
<td align="center"><img src="assets/portraits/lyra.png" alt="Pixel-art portrait of Lyra Knox" width="72" height="90"><br><sub>Lyra Knox</sub></td>
<td align="center"><img src="assets/portraits/mae.png" alt="Pixel-art portrait of Mae Okoro" width="72" height="90"><br><sub>Mae Okoro</sub></td>
<td align="center"><img src="assets/portraits/magnus.png" alt="Pixel-art portrait of Magnus Graves" width="72" height="90"><br><sub>Magnus Graves</sub></td>
<td align="center"><img src="assets/portraits/malik.png" alt="Pixel-art portrait of Malik Knight" width="72" height="90"><br><sub>Malik Knight</sub></td>
<td align="center"><img src="assets/portraits/mara.png" alt="Pixel-art portrait of Mara Vale" width="72" height="90"><br><sub>Mara Vale</sub></td>
<td align="center"><img src="assets/portraits/marisol.png" alt="Pixel-art portrait of Marisol Tide" width="72" height="90"><br><sub>Marisol Tide</sub></td>
<td align="center"><img src="assets/portraits/milo.png" alt="Pixel-art portrait of Milo Ember" width="72" height="90"><br><sub>Milo Ember</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/miro.png" alt="Pixel-art portrait of Miro Lane" width="72" height="90"><br><sub>Miro Lane</sub></td>
<td align="center"><img src="assets/portraits/morgan.png" alt="Pixel-art portrait of Morgan Alder" width="72" height="90"><br><sub>Morgan Alder</sub></td>
<td align="center"><img src="assets/portraits/nadia.png" alt="Pixel-art portrait of Nadia Park" width="72" height="90"><br><sub>Nadia Park</sub></td>
<td align="center"><img src="assets/portraits/nate.png" alt="Pixel-art portrait of Nate Barr" width="72" height="90"><br><sub>Nate Barr</sub></td>
<td align="center"><img src="assets/portraits/nico.png" alt="Pixel-art portrait of Nico Vega" width="72" height="90"><br><sub>Nico Vega</sub></td>
<td align="center"><img src="assets/portraits/night.png" alt="Pixel-art portrait of Night Shift" width="72" height="90"><br><sub>Night Shift</sub></td>
<td align="center"><img src="assets/portraits/nikita.png" alt="Pixel-art portrait of Nikita Rowe" width="72" height="90"><br><sub>Nikita Rowe</sub></td>
<td align="center"><img src="assets/portraits/noelle.png" alt="Pixel-art portrait of Noelle Stroud" width="72" height="90"><br><sub>Noelle Stroud</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/nolan.png" alt="Pixel-art portrait of Nolan Pike" width="72" height="90"><br><sub>Nolan Pike</sub></td>
<td align="center"><img src="assets/portraits/nova.png" alt="Pixel-art portrait of Nova Bell" width="72" height="90"><br><sub>Nova Bell</sub></td>
<td align="center"><img src="assets/portraits/otis.png" alt="Pixel-art portrait of Otis Ward" width="72" height="90"><br><sub>Otis Ward</sub></td>
<td align="center"><img src="assets/portraits/priya.png" alt="Pixel-art portrait of Priya Gale" width="72" height="90"><br><sub>Priya Gale</sub></td>
<td align="center"><img src="assets/portraits/red.png" alt="Pixel-art portrait of Red Doyle" width="72" height="90"><br><sub>Red Doyle</sub></td>
<td align="center"><img src="assets/portraits/rex.png" alt="Pixel-art portrait of Rex Titan" width="72" height="90"><br><sub>Rex Titan</sub></td>
<td align="center"><img src="assets/portraits/rina.png" alt="Pixel-art portrait of Rina Moss" width="72" height="90"><br><sub>Rina Moss</sub></td>
<td align="center"><img src="assets/portraits/rocco.png" alt="Pixel-art portrait of Rocco Flint" width="72" height="90"><br><sub>Rocco Flint</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/roxy.png" alt="Pixel-art portrait of Roxy Rain" width="72" height="90"><br><sub>Roxy Rain</sub></td>
<td align="center"><img src="assets/portraits/sasha.png" alt="Pixel-art portrait of Sasha Wynn" width="72" height="90"><br><sub>Sasha Wynn</sub></td>
<td align="center"><img src="assets/portraits/silas.png" alt="Pixel-art portrait of Silas Rush" width="72" height="90"><br><sub>Silas Rush</sub></td>
<td align="center"><img src="assets/portraits/sol.png" alt="Pixel-art portrait of Sol Cruz" width="72" height="90"><br><sub>Sol Cruz</sub></td>
<td align="center"><img src="assets/portraits/soraya.png" alt="Pixel-art portrait of Soraya Idris" width="72" height="90"><br><sub>Soraya Idris</sub></td>
<td align="center"><img src="assets/portraits/sylvia.png" alt="Pixel-art portrait of Sylvia Rook" width="72" height="90"><br><sub>Sylvia Rook</sub></td>
<td align="center"><img src="assets/portraits/rev.png" alt="Pixel-art portrait of The Reverend" width="72" height="90"><br><sub>The Reverend</sub></td>
<td align="center"><img src="assets/portraits/theo.png" alt="Pixel-art portrait of Theo Voss" width="72" height="90"><br><sub>Theo Voss</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/portraits/tomas.png" alt="Pixel-art portrait of Tomas Keene" width="72" height="90"><br><sub>Tomas Keene</sub></td>
<td align="center"><img src="assets/portraits/tomasash.png" alt="Pixel-art portrait of Tomás Ash" width="72" height="90"><br><sub>Tomás Ash</sub></td>
<td align="center"><img src="assets/portraits/tori.png" alt="Pixel-art portrait of Tori Kade" width="72" height="90"><br><sub>Tori Kade</sub></td>
<td align="center"><img src="assets/portraits/val.png" alt="Pixel-art portrait of Val Vance" width="72" height="90"><br><sub>Val Vance</sub></td>
<td align="center"><img src="assets/portraits/vera.png" alt="Pixel-art portrait of Vera Cho" width="72" height="90"><br><sub>Vera Cho</sub></td>
<td align="center"><img src="assets/portraits/winnie.png" alt="Pixel-art portrait of Winnie March" width="72" height="90"><br><sub>Winnie March</sub></td>
<td align="center"><img src="assets/portraits/zane.png" alt="Pixel-art portrait of Zane Varley" width="72" height="90"><br><sub>Zane Varley</sub></td>
<td align="center"><img src="assets/portraits/zara.png" alt="Pixel-art portrait of Zara Finch" width="72" height="90"><br><sub>Zara Finch</sub></td>
</tr>
</table>
<!-- LIVING ROSTER END -->

</details>

*All portraits are the game's character artwork. The wrestlers, promotions and rivalries are fictional.*

<p align="center"><img src="docs/readme/three-stars.svg" alt="" width="100%"></p>
<p align="center"><img src="docs/readme/02-production.svg" alt="THE MAIN EVENT — NEW FROM THE OFFICE" width="100%"></p>

## THE MAIN EVENT

*The latest issue · v0.65 · 23 November 2026*

### THE TERRITORY TALKS BACK

*The latest additions from the agents' room, the ring and the back pages.*

**A better reason for every phase of the fight.** The new **Match Structure Director** brings different dramatic patterns into live, signed match planning. Characters can haggle over a real named move; the match follows the agreement only where the wrestling permits it. Follow-up work gives selling, rest, counters, late offence and near falls more believable causes. [Match structures](https://github.com/southernadd-cmyk/wrestler/pull/194) · [Late-match work](https://github.com/southernadd-cmyk/wrestler/pull/220)

**Ringside calls that answer back.** **Hit the big spot** no longer demands an impossible move the instant you press the button. It can queue a legal opportunity and later report the move that really happened; an unfulfilled request is refunded. Other calls also distinguish what the wrestler actually did from what you merely asked for. [Ringside changes](https://github.com/southernadd-cmyk/wrestler/pull/242)

**The booking office has found its voice.** Promoters argue their case, offer real trade-offs and react differently to pressure. Dennis now makes the training desk more useful, with assessments, forecasts and a record of actual weekly development. There have also been practical changes to the old-school, Championship Manager-style navigation and management screens. [Negotiation conversations](https://github.com/southernadd-cmyk/wrestler/pull/184) · [Training](https://github.com/southernadd-cmyk/wrestler/pull/225)

**The body keeps score.** Wrestlers age between seasons and can retire. Injuries now lead to decisions about full recovery, early return or working through the pain, while repeated damage to the same body part can lengthen the layoff. There is no risk-free shortcut. [Ageing](https://github.com/southernadd-cmyk/wrestler/pull/252) · [Injury choices](https://github.com/southernadd-cmyk/wrestler/pull/256)

### RINGFAX

*From our teletext correspondent: page 100 is where the news starts.*

There's a **Ceefax-inspired wrestling service** inside the game. Ringfax carries editorial headlines, rumours, reports, fan letters and title talk drawn from your actual career. It's the voice of the circuit, **not a duplicate of the booking sheets or champions screen**. Its presentation is still being refined.

For those who know their **World of Sport** from their **King's Road**, the hidden **page 777 quiz** uses four coloured Teletext answers, checkpoints and a library of **192 different wrestling questions**. Each of the **16 weeks** in a season deals 12 new questions, with no repeats that season. The material covers wrestlers, moves, tags, match types, personalities, women's wrestling and notable UK careers abroad — not just championship trivia. [Ringfax editorial work](https://github.com/southernadd-cmyk/wrestler/pull/243) · [Weekly quiz](https://github.com/southernadd-cmyk/wrestler/pull/257)

<p align="center"><img src="docs/readme/three-stars.svg" alt="" width="100%"></p>
<p align="center"><img src="docs/readme/07-archive.svg" alt="BACK ISSUES — THE OFFICE NEWSLETTER ARCHIVE" width="100%"></p>

## BACK ISSUES

*The old reports are still on file. They no longer interrupt the current issue.*

| Edition | Main story |
| --- | --- |
| **v0.65** · 23 Nov 2026 | **The Territory Talks Back** — match structures, better ringside decisions, career depth and Ringfax. [Main Event](#the-main-event). |
| **v0.6.0** · 21 Nov 2026 | **Earn the Finish** — five distinct match plans, legitimate near falls and earned long-match recovery. [Release guide](docs/v0.6-release.md). |
| **v0.5.0** · 20 Nov 2026 | **Every Hold Has a History** — richer grappling, technical identities and legal transitions. [Release guide](docs/v0.5-release.md). |
| **v0.4.0** · 19 Nov 2026 | **The Wrestling Knows Its Way Around** — foundational authored graph and technical styles. [Release guide](docs/v0.4-release.md). |

Older technical notes, frozen match simulations and archived audits are in the [documentation index](docs/README.md). These are development records, not a prerequisite to playing the game.

### THE SMALL PRINT

The game plays directly in the browser, without a build step or runtime service. Code is available under the [MIT License](LICENSE); original writing, characters, portraits, artwork and branding have separate rights. See [Content and copyright](CONTENT-LICENSE.md).

### THE OFFICE ONLINE

**Play:** [theoffice.repos.one](https://theoffice.repos.one/).

Careers save in the browser. If you played at the previous GitHub Pages address, export your career there from **Game → Save and load → Export save** before moving, then use **Import save** here. Browser saves do not move between addresses automatically.

[![OpenRepos](https://img.shields.io/endpoint?url=https://openrepos.org/status/theoffice.repos.one.json&style=flat-square)](https://theoffice.repos.one/)
