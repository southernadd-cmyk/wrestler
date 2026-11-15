# THE OFFICE

**PRO WRESTLING MANAGEMENT NEWSLETTER**

`ISSUE 3.5` · `15 NOVEMBER 2026` · `ROSTER & TERRITORY EDITION`

**[Play The Office](https://southernadd-cmyk.github.io/wrestler/)** · [Read the game source](index.html)

---

## TWENTY-EIGHT WRESTLERS, FOUR DIFFERENT CARDS

*Territory report*

The circuit has doubled to **28 wrestlers**. Twelve are on the open market when you arrive, thirteen have signed with rival managers, and three take bookings independently. Everyone has a pixel-art portrait and four signature moves. The rival managers can sign someone off the same list you’re looking at.

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

## FROM THE BOOKING OFFICE

*First week on the job*

You get **£2,250**, an empty locker room and four promoters with different ideas about what a good match looks like. There are **16 weeks to a season**, room for **five contracts**, and **two management meetings a week**. The wages come due whether you’ve booked a match or spent the week waiting for the phone.

1. Open the [game](https://southernadd-cmyk.github.io/wrestler/) and pick **New career**. It opens at **Roster → Free agents**. Check the signing fee, the weekly wage and what the wrestler does well before you sign anyone.
2. Look under **Bookings → Offers**. The booker sets the spot on the card, the purse and the finish. You can negotiate the rate, ask for higher billing or try to protect a clean loss.
3. Read the **Office** inbox. Promoter requests, injuries and backstage problems can all need a decision. Set training in **Roster** and keep an eye on fatigue and upcoming fixtures.
4. Press **Continue** when the paperwork is in order. A booked card takes you to match night, where you’ll go from the agents’ room to the microphone to ringside.
5. Read the match report and check what ended up in **Territory → Results**. A good showing can build a programme. A promise you missed can come back to the office with you.

The desktop layout keeps **Office**, **Roster**, **Bookings**, **Territory** and **Game** in the sidebar, with back and forward buttons at the top. Wrestler and free-agent lists are sortable. On a smaller screen the panels stack vertically.

## TEN MINUTES TO DOORS

*From the agents’ room*

Road agent Dennis runs the pre-match meeting and passes on the booker’s instructions. The two wrestlers pitch the shine, the heat, the comeback, the big spot and the route to the agreed finish. Some pairings agree quickly. Others object because the lift is wrong for the weight gap, the move is too risky for the wrestler pitching it, or somebody doesn’t fancy looking weak on the finish. Listen to the objection, change the beat, offer a sweetener or leave part of it to be called in the ring.

The promoter can send a note of their own. The agents’ room runs on a clock, so an argument can eat the time you wanted for planning the finish. The signed board carries into the match. Consent affects how hard the wrestlers try to make it work, and the engine accounts for the position and setup a move needs.

## THE MIC IS OPEN

*Pre-match report*

The live exchange opens with **the hook** and **the grievance**. Then comes **the interruption**, followed by **something happens**, **the sell**, and **the closer**. What you say gives the opponent something specific to answer. A real grievance can get a crowd on your side. A weak accusation gives the other wrestler an opening, and a live interruption can change the whole pitch.

A televised-sounding vow still has to survive the bell. Promise to counter a particular attack and the match looks for the relevant reversal. Name a finisher and a sharp opponent can scout it. Demand a clean bout and the wrestlers are steered away from dirty tactics. The record keeps the exchange, including the promises that came back to bite.

## RINGSIDE AND AFTER THE BELL

*Match report*

The bout runs in original text commentary. Style, size, stamina, damage and position shape the action. A comeback needs a change of control. A dangerous spot needs the right setup. A near-fall needs a credible move and a cover. The booked winner remains the plan, with exceptional ringside decisions such as a stoppage handled explicitly.

| At ringside | Control |
| --- | --- |
| Pause or resume | **Space** |
| Make one of the current ringside calls | **1–6** or the matching on-screen button |
| Resolve a decision prompt | Pick one of the choices on screen |

The report compares the signed board with the match. It shows beats performed, adapted or missed, plus the effect on the crowd, purse and promoter. Wrestlers carry significant incidents into later conversations and matches. A humiliating loss, an injury, a protected finish or a broken promise can all matter next time. Rex Titan may want a word after a clean loss. If you promise him a featured match, check the fixture list before you say it.

## KEEP YOUR COPIES

*Save desk*

The browser saves your career automatically, including a meeting, promo or live bout in progress. Use **Game → Export save** for a portable copy and **Game → Import save** to pick up elsewhere. A local copy and the hosted game use separate browser storage, as do different browsers or devices. Export before moving or clearing site data.

Earlier supported v2-era careers can be loaded. The current edition adds the expanded territory to existing saves and keeps your signed wrestlers, prior results and rival records.

To play locally, download the repository and open `index.html` in a modern browser. The game is a single HTML file with its CSS, JavaScript and portraits built in. The simulation runs in the browser. Google Fonts load when available, with system fallbacks.

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
| Beats in the live microphone exchange | 6 |

The match graph and career simulation use seeded logic so a saved sequence can be resumed deterministically. Reversals and applicable blocks sit alongside the authored moves. Narration and wrestler dialogue are original, informed by match structure, performer interviews and wrestling history. [Match graph and research](docs/match-graph.md) · [Promo research](docs/promo-graph.md)

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
node tests/catalog.test.cjs
```

The suites cover the free-agent market and rival contracts, separate promotion ladders, older saves, signed boards, booked finishes, match legality, promo continuity and repeatable careers.

## BACK ISSUES

*From the files*

| Edition | What was reported |
| --- | --- |
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

---

*Layout references* · [Pro Wrestling Torch print covers](https://www.pwtorch.com/artman2/publish/wadekellerdotcom/46258.shtml) · [Wrestling Observer back issues](https://www.f4wonline.com/news/daily-updates/first-decade-wrestling-observer-hall-of-fame-issues-special-157576/)
