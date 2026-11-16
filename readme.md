<p align="center">
  <img src="docs/readme/masthead.svg" alt="THE OFFICE — a vintage pro wrestling management newsletter, issue 3.8.1" width="100%">
</p>

<p align="center"><strong>ISSUE 3.8.1</strong> &nbsp; • &nbsp; 16 NOVEMBER 2026 &nbsp; • &nbsp; MATCH NIGHT / PRODUCTION EDITION</p>

<p align="center">
  <strong><a href="https://southernadd-cmyk.github.io/wrestler/">ENTER THE OFFICE — PLAY THE GAME</a></strong>
  &nbsp; · &nbsp; <a href="docs/architecture.md">Inside the engine</a>
  &nbsp; · &nbsp; <a href="#back-issues">Back issues</a>
</p>

<p align="center"><img src="docs/readme/three-stars.svg" alt="" width="100%"></p>

<p align="center"><img src="docs/readme/01-lead-story.svg" alt="LEAD STORY — DENNIS WANTS A WORD" width="100%"></p>

## DENNIS WANTS A WORD

*Lead story*

Match night now starts backstage. Dennis has the booked result, two wrestlers with opinions and a short list of things that need settling before they go out. One night it’s the big spot. The next it’s a cut to your match time, a wrestler refusing to lose clean, or someone who’s turned up without their gear. Then the microphones come out and both wrestlers get a shot at winning over the room.

<p align="center"><img src="assets/share-card.png" alt="Original pixel-art cover illustration for The Office: wrestlers pictured in an arena" width="100%"></p>
<p align="center"><sub><em>FROM THE PICTURE DESK:</em> The original game's pixel-art cover. Artwork, not a gameplay screenshot.</sub></p>

<p align="center"><img src="docs/readme/02-production.svg" alt="PRODUCTION DESK — BEHIND THE CURTAIN" width="100%"></p>

## A NEW FLOOR PLAN FOR THE OFFICE

*Production desk*

The entire territory used to work out of one **973 KB** HTML file. The front door is now just **4.6 KB**: the match engine, career, rivals, memory, promos and screens have moved into **11 ordered JavaScript files**, with **four stylesheets** and a separate pixel-art portrait atlas. It is still the same browser game, served directly from GitHub Pages, with **no build step or runtime dependencies**. Match rules and existing career saves are unchanged.

Dennis has also rearranged the agents’ room. On wide desktop screens, his conversation and the running-order board sit side by side with independent scrolling. On smaller screens they stack, keeping the plan readable while the wrestlers have their say. The regression suite now tests the same scripts the browser loads, in the same order, rather than reading a giant inline script from `index.html`. [See the technical floor plan](docs/architecture.md).

<p align="center"><img src="docs/readme/03-territory.svg" alt="TERRITORY REPORT — 28 WRESTLERS, FOUR CARDS" width="100%"></p>

## TWENTY-EIGHT WRESTLERS, FOUR DIFFERENT CARDS

*Territory report*

The circuit has doubled to **28 wrestlers**. Twelve are on the open market when you arrive, thirteen have signed with rival managers, and three take bookings independently. Everyone has a pixel-art portrait and four signature moves. The rival managers can sign someone off the same list you’re looking at.

<p align="center"><img src="assets/portrait-atlas.png" alt="Original 28-wrestler pixel-art portrait atlas used by the game" width="192"></p>
<p align="center"><sub><em>ROSTER PHOTO DESK:</em> The game's original pixel-art portrait atlas.</sub></p>

**The Office** is a text-led wrestling management game played in the browser. You look after one regional stable. Bookers call the result, then you and the wrestlers work out how to get there. Backstage, people remember who took the clean loss, who broke their word, and who made the other wrestler look good in front of a quiet room.

### Around the towns

| Promotion | What the booker wants | Main-event names at the start |
| --- | --- | --- |
| **Dockside** | A brawl that makes the warehouse crowd sit up. | Rocco Flint, Red Doyle |
| **Pulse Underground** | A big spot worth passing around after the show. | Night Shift, Ace Cassidy |
| **North Crown** | A story the regional television audience can follow. | The Reverend, Roxy Rain |
| **Grand Union** | Technical work on the national broadcast. | Silas Rush, Nova Bell |

Each booker keeps a separate card, from opener to main event. A result at Dockside goes on Dockside’s record. Repeat appearances can raise your fee there, and an established draw can bring higher billing. See who’s up, who’s down and who’s working elsewhere in **Territory → Card pyramid**.

**Rival stable report.** Mo Devlin starts with five at Iron Borough. Ruth Anwar has four at Gold Coast, and Len Mercer has four at North Circuit. Their results and signings turn up in the circuit news as the weeks pass. If one of your wrestlers takes a rival’s offer, you may find yourself booking against them.

---

<p align="center"><img src="docs/readme/04-first-week.svg" alt="FIRST WEEK GUIDE — NEW CAREER" width="100%"></p>

## FIRST WEEK WITH DENNIS

*From the road agent*

The splash screen still takes you straight to Free agents, but Dennis now gives you an in-game welcome before the figures take over. A collapsible **First Week** guide stays within reach while you sign a wrestler, book a match, read your inbox, choose a training focus and work your first bout. Steps update from what you actually do; they are not scripted gates. The guide folds away after the first week and can be reopened from **Game → How a week works**. Its state lives inside the normal career save, including older careers.

## FROM THE BOOKING OFFICE

*First week on the job*

You get **£2,250**, an empty locker room and four promoters with different ideas about what a good match looks like. There are **16 weeks to a season**, room for **five contracts**, and **two management meetings a week**. The wages come due whether you’ve booked a match or spent the week waiting for the phone.

1. Open the [game](https://southernadd-cmyk.github.io/wrestler/) and pick **New career**. It opens at **Roster → Free agents**. Check the signing fee, the weekly wage and what the wrestler does well before you sign anyone.
2. Look under **Bookings → Offers**. The booker sets the spot on the card, the purse and the finish. You can negotiate the rate, ask for higher billing or try to protect a clean loss.
3. Read the **Office** inbox. Promoter requests, injuries and backstage problems can all need a decision. Set training in **Roster** and keep an eye on fatigue and upcoming fixtures.
4. Press **Continue** when the paperwork is in order. A booked card takes you backstage with Dennis. From there you’ll go to the microphone and on to ringside. If the promo gets cut, you’ll go straight to the bell.
5. Read the match report and check what ended up in **Territory → Results**. A good showing can build a programme. A promise you missed can come back to the office with you.

The desktop layout keeps **Office**, **Roster**, **Bookings**, **Territory** and **Game** in the sidebar, with back and forward buttons at the top. Wrestler and free-agent lists are sortable. On a smaller screen the panels stack vertically.

## A WORD WITH DENNIS

*Training ground*

Training still runs on a weekly focus and intensity, with blocks, camps and a specialist coach. On top of that, a wrestler can spend **a session with Dennis**. He has time for **two sessions a week across the whole stable**, so somebody always misses out.

- **Rehearse for the next match.** The wrestler walks into the agents’ room keener, Dennis tells the room they’ve been through it, and they stick closer to the running order in the ring. One rehearsal lasts two weeks or one match.
- **Learn a big-spot move.** Each wrestler has up to three moves that suit their style and their body. Two weeks for a safe one, three for a risky one, paused when they’re exhausted. Once learned, it’s the move they pitch for the big spot, marked *Learned in training*.
- **Mic work.** Practise one style of opening. A practised style suits the wrestler better at the microphone, Dennis mentions it in his read, and it fades if it isn’t kept up.

Dennis suggests a session for each wrestler from their last report: a rehearsal after a match that drifted off the sheet, mic work after losing the room, a move for somebody with no big spot of their own. Set sessions in **Roster → Training** or on a wrestler’s profile.

<p align="center"><img src="docs/readme/06-statistics.svg" alt="STATISTICS DESK — THE FIGURES" width="100%"></p>

## THE FIGURES

*Statistics desk*

The office keeps its own records now, and draws them. **Desk → This week** shows the bank balance against the weekly bill. **Territory → Results** charts every match the stable has worked this season, wrestler by wrestler. Each **wrestler profile** shows their ring, mic, psychology and safety week by week, and their star ratings match by match. The **match report** draws the crowd through the bout, with every beat of the running order marked where it landed, changed or slipped away.

<p align="center"><img src="docs/readme/05-match-night.svg" alt="MATCH NIGHT — BACKSTAGE TO RINGSIDE" width="100%"></p>

## TEN MINUTES TO DOORS

*From the agents’ room*

Road agent Dennis starts with the booked result and asks how you want the match to work. Then he hands you **the running order**: the shine, the heat, the comeback and the big spot, already pencilled in. Each beat has two or three pitches beside it — one from each wrestler and Dennis’s middle-of-the-road option — and you can swap any of them before you agree it. Dennis tells you whether the order tells a story the booked finish can pay off. A clean loser with the big spot, or a comeback from nothing, will get a look.

Then two or three situations come up from a pool of 24, and they push on the plan you’ve just agreed. The pairing, the promotion, the card position and the terms help decide what comes through the door. A wrestler might pitch a risky move, the booker might ask for four more minutes, or a scout might turn up in row F.

A situation can change a beat (the card will say *Changes the heat*), and some decisions rule moves out altogether. Stay away from the soft corner, or keep everyone off a slack top rope, and Dennis rubs out whatever no longer works and pencils in the nearest thing that does. Read the choice cards for the stakes. A decision can change the starting crowd, the purse, trust, morale, match length or how much risk the wrestlers take. Their moods and the agreed plan stay on screen. Choose the route to the booked result and give them a last word at the curtain. The signed sheet carries the whole running order into the match, with a legal alternative for each beat in case the wrestlers need to call an audible. How faithfully they follow it depends on how they feel about it, how tired they are, how good they are at keeping a match on track and whether the room is giving anything back. Happy, fresh wrestlers land about nine agreed beats in ten. A pair who are sulking land about four. Landed beats lift the star rating, more so when the order tells a story; missed ones cost you.

## THE MIC IS OPEN

*Pre-match report*

Before the first line, Dennis gives you **his read**: whether the room is hot, quiet or doesn’t know your wrestler, whether there’s real history between the two, whether the opponent can talk, and what sort of talker your wrestler is. No opening is right every night. A quiet room punishes shouting, an accusation with no history sounds made up, and a big strange picture only works for somebody who can carry it. Choose the line that suits the night and it lands more often and counts for more. The risky lines are the big ones when the night is right for them.

Start with **Opening shot**, then take the mic back in **They hit back**. When the opponent replies, they take an angle — personal, mocking, armed with facts, or playing to the crowd — and the commentary tells you which. Each angle has an answer that beats it: keep your composure against the personal stuff, turn the words round on somebody laughing at you, ask for an answer in the ring when they quote the record. At **Push your luck?**, you can leave the exchange there or go after the crowd again. Going again pays when the room is already with you and the gamble suits the speaker. Otherwise, walk away. Playing to the town is a small lift. A good joke can win the room, and a bad one can give it away. A live meter follows every swing, with both wrestlers’ lines and the crowd’s reactions on screen.

**Last word** is where a vow can follow you into the ring. Promise to counter a particular attack and the match looks for the relevant reversal. Name a finisher and a sharp opponent can scout it. Demand a clean bout and the wrestlers are steered away from dirty tactics. Check the warnings on each choice if the booked result makes the vow difficult to keep. A promise to counter, or to win with the finisher, goes onto the match strip as a **Vow** in its own lane, and is settled at the bell. A promise the booking already guarantees — a win when you’re booked to win — is marked *Safe bet, small reward*, and keeping it earns little.

## RINGSIDE AND AFTER THE BELL

*Match report*

Under the scoreboard, **the match strip** lays the running order along the clock: two lanes of beats, each sitting in the stretch of the match where it’s due, edged gold for your wrestler and white for theirs. A white playhead moves across as the bell time ticks on. A beat lights up when its window opens, turns green when it lands, amber when the wrestlers call an audible and red when the chance passes. A notch marks the moment it happened. Hover for the detail.

The bout runs in original text commentary. Style, size, stamina, damage and position shape the action. A comeback needs a change of control. A dangerous spot needs the right setup. A near-fall needs a credible move and a cover. The booked winner remains the plan, with exceptional ringside decisions such as a stoppage handled explicitly.

| At ringside | Control |
| --- | --- |
| Pause or resume | **Space** |
| Make one of the current ringside calls | **1–6** or the matching on-screen button |
| Resolve a decision prompt | Pick one of the choices on screen |

The report compares the signed board with the match, starting with the strip as it stood at the bell. It shows beats performed, adapted or missed, plus the effect on the crowd, purse and promoter. Wrestlers carry significant incidents into later conversations and matches. A humiliating loss, an injury, a protected finish or a broken promise can all matter next time. Rex Titan may want a word after a clean loss. If you promise him a featured match, check the fixture list before you say it.

## KEEP YOUR COPIES

*Save desk*

The browser saves your career automatically, including backstage meetings, promos and live bouts in progress. Use **Game → Export save** for a portable career copy and **Game → Import save** to pick up elsewhere. In-progress match night is stored in the browser you played it in. A local copy and the hosted game use separate browser storage, as do different browsers or devices.

Earlier supported v2-era careers can still be loaded. Career progress carries into v3.8.1. If you upgrade halfway through a v3.5 backstage meeting or promo, or a v3.6 backstage meeting, that segment starts again in the new format.

To play locally, download the **whole repository** and open `index.html` in a modern browser. Keep the `assets/` directory alongside it: the page loads the JavaScript, CSS and portrait atlas as separate files. The simulation still runs in the browser, with no installer or build step. Google Fonts load when available, with system fallbacks.

---

## BY THE NUMBERS

*Engine desk*

| What’s on the sheet | Current count |
| --- | ---: |
| In-ring actions and events (nodes) | 969 |
| Links between actions and events (transitions) | 6,152 |
| Match story arcs | 25 |
| Routes across the four booked finishes | 18 |
| Authored moves and move families | 336 / 20 |
| Promo graph angles and situational variants | 15 / 135 |
| Backstage situations | 24 |
| Rounds in the promo duel | 4 |

The match graph and career simulation use seeded logic so a saved sequence can be resumed deterministically. Reversals and applicable blocks sit alongside the authored moves. Narration and wrestler dialogue are original, informed by match structure, performer interviews and wrestling history. [Match graph and research](docs/match-graph.md) · [Promo research](docs/promo-graph.md)

### Source files

The game is now structured as a small HTML entry point, ordered JavaScript modules in `assets/js/`, CSS files in `assets/css/`, and a separate portrait atlas PNG. It stays a static GitHub Pages game with **no build step**. See the [architecture guide](docs/architecture.md) and run all tests with `npm test` or `node tests/run-tests.cjs`.

### On the record

Node.js is needed for the regression suites only. From the repository root, run any of the following:

```sh
node tests/roster.test.cjs
node tests/agents-room.test.cjs
node tests/season-soak.test.cjs
node tests/match-flow.test.cjs
node tests/graph-flow.test.cjs
node tests/match-variety.test.cjs
node tests/graph-sheet.test.cjs
node tests/creative-loop.test.cjs
node tests/memory-flow.test.cjs
node tests/promo-flow.test.cjs
node tests/promo-variants.test.cjs
node tests/promo-read.test.cjs
node tests/training-sessions.test.cjs
node tests/records.test.cjs
node tests/catalog.test.cjs
node tests/structure.test.cjs
```

The suites cover the free-agent market and rival contracts, separate promotion ladders, older saves, backstage situations, signed boards, booked finishes, match legality, the promo duel and repeatable careers.

**Continuous integration:** All 16 suites, including the modular-source structure check, run automatically on pushes and pull requests using Node.js 22 in [GitHub Actions](.github/workflows/tests.yml). A red test run means the submitted commit failed validation. To require green checks before merge, configure the repository's branch protection/ruleset for the `Regression suite (Node 22)` status check.

### Small print

The software implementation (HTML/CSS/JavaScript source and test code) is available under the [MIT License](LICENSE). The game's original writing, dialogue, characters, portraits, artwork, branding and other creative content are **not** licensed for reuse under MIT, including creative material held in the separate `assets/` files. See [Content and copyright](CONTENT-LICENSE.md) for the distinction. Third-party material remains subject to its own licences.

<p align="center"><img src="docs/readme/07-archive.svg" alt="BACK ISSUES — THE DEVELOPMENT ARCHIVE" width="100%"></p>

## BACK ISSUES

*From the files*

| Edition | What was reported |
| --- | --- |
| **3.8.1** | The production desk is rebuilt: 11 JavaScript files, four stylesheets and a separate portrait atlas replace the giant HTML file. The agents’ room gets independent scrolling columns on desktop and a stacked plan on smaller screens. Tests now run against the scripts that ship to players, while existing saves and match rules stay intact. |
| **3.8** | Charts on the desk, the results, every profile and every match report. The running order is three across on a phone, and the training table fits a laptop screen. Sessions with Dennis. Two a week across the stable: rehearse for the next match, learn a big-spot move, or work on one style at the microphone. Each feeds straight into the agents’ room, the promo or the ring. |
| **3.7** | The planning spine. Every match night has a running order of four beats that you can change, Dennis judges whether it tells a story, situations rewrite beats they rule out, and the wrestlers’ mood and condition decide how much of it actually happens. The match strip shows the running order on the clock as it plays out, and again on the report. At the microphone, Dennis reads the night first, opponents take an angle you can answer, pushing your luck can pay, and counter and finisher vows go on the strip. |
| **3.6** | Dennis opens match night with a changing set of backstage decisions. The promo becomes a duel for the crowd, with a chance to push your luck before the last word. |
| **3.5** | Dennis opens the agents’ room and the microphone goes live. The roster and territory edition doubles the cast, brings in the new portraits and gives all four bookers cards of their own. |
| **3.4** | The narration gets a line edit, signature moves belong to individuals and a full-season test goes through the books. The 400-bout balance audit put the average at 2.04 stars and missed beats at 21%. |
| **3.3** | The action catalog grows to 336 moves with distinct counters and physical limits. The promo desk adds replies grounded in the actual pairing. [Expansion notes](docs/graph-expansion-v3-3.md) |
| **3.2** | The two wrestlers start pitching what the match ought to prove. A promo promise can turn into a real tactical commitment. [Creative meetings and microphone promises](docs/creative-loop-v3-2.md) |
| **3.1** | Negotiated beats become a signed sheet with timing, a wrestler responsible for each beat and legal alternatives. The report distinguishes a missed beat from one the wrestlers rebuilt. [Match-sheet notes](docs/graph-sheet-v3-1.md) |
| **3.0** | The locker room gets a memory. Protected losses, humiliations, injuries and promises follow a wrestler into the next show. [Wrestler memory](docs/wrestler-memory.md) |
| **2.9** | Individual repertoires, credible size and stamina limits, and opponent scouting give wrestlers a recognisable way of working. [Match variety](docs/match-variety.md) |
| **2.8** | The original three-part promo exchange introduces opponent replies, public promises and a saved transcript. |
| **2.7** | Match commentary moves onto connected story, action and outcome graphs. |
| **2.6** | Match psychology gets explicit control changes, body-part work and setups for the bigger spots. |

[Unabridged development archive](https://github.com/southernadd-cmyk/wrestler/blob/3fc3f5eaaef2203e65dfb5ed3ec91075f27a5d6f/readme.md) · [Original sumo game archive](https://github.com/southernadd-cmyk/wrestler/tree/archive/sumo-before-the-office-2026-11-11)

<details>
<summary>Match research from the early issues</summary>

- [Matt Murphy on match structure](https://missouriwrestlingrevival.com/2009/12/23/chapter-15-match-structure-by-matt-murphy/)
- [WWE retrospective on Savage vs Steamboat](https://www.wwe.com/inside/listthis/maniamatches/maniamatches7)
- [Action and control analysis of Hart vs Austin](https://www.prowrestlingmusings.com/post/greatest-matches-of-all-time-bret-hart-vs-steve-austin)
- [Bayley vs Banks and the use of injury callbacks](https://www.cagesideseats.com/wwe/2016/7/25/12264730/making-history-bayleys-journey-part-5)

</details>

<p align="center"><img src="docs/readme/three-stars.svg" alt="" width="100%"></p>

*Layout references* · [Pro Wrestling Torch print covers](https://www.pwtorch.com/artman2/publish/wadekellerdotcom/46258.shtml) · [Wrestling Observer back issues](https://www.f4wonline.com/news/daily-updates/first-decade-wrestling-observer-hall-of-fame-issues-special-157576/)
