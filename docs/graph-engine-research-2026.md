# The Office: Graph-Engine Research and Development Strategy
Date: 12 November 2026
Status: RESEARCH / DESIGN ONLY. No runtime code, save data, UI or deployment settings changed.

## Product thesis

Our primary USP should be **causally connected, wrestler-driven narrative engines**, not sheer move-count, text volume or another management feature checklist.

Promise: **The matches are scripted. The stories aren't.**

The match contract sets the fixed outcome, but a negotiated sheet, personal wrestler intentions, legal actions, crowd reactions and live manager calls determine the road to that finish. Meaningful callbacks must persist into promos, rivalries and subsequent cards.

### Findings from our actual main-branch code

- Match graph: 13 narrative arcs, 66 tactical action nodes, six possible outcome types; v2.7 docs still refer to the original 59 nodes. These are not two different deployed engines; the later additions extended the original graph.
- Macro arc selection is heavily time-constrained, with forced fallbacks in both selectArc and advance. This logic should have one authority.
- A subset of major spots, near-falls and special decisions are implemented on parallel paths, which makes consistent causal events harder.
- A technical plan modifies probabilities, but there is not yet a literal sheet of named match commitments.
- The original promo graph is 5 x 5 x 5 selectable responses, and remains one fixed three-act structure.
- The current memory overlay derives significant moments after match results. It cannot yet subscribe to actual setups, callbacks, missed planned spots or opponent intentions as they happen.
- The regression tests check physical legality, deterministic resumes and story-path diversity, not the subjective quality of the emitted narrative.

## Source corpus expansion (12 November 2026)

The initial wrestling interviews and match studies are now complemented by three user-supplied resources. They have been inspected and evaluated in detail in [Wrestling source audit](wrestling-source-audit-2026.md):

- [CAGEMATCH Promo Database](https://www.cagematch.net/?id=93): dated promo transcripts, performer and feud links. Use for argument structure and character intention, not as an unlicensed library of game dialogue or as proof that high-rated promos have one universal formula.
- [Pro Wrestling Transcriptions](https://prowrestlingtranscriptions.com/): editorial move-by-move recaps and attributed show dialogue. Use for typed observed sequences and links between promos, matches and aftermath; account for omissions.
- [The Official Wrestling Museum RAW script](https://www.theofficialwrestlingmuseum.com/full-raw-script.html): an April 14, 2014 production artifact. Use for show-level segment, time and production constraints, **not** as evidence every match move was written in advance. An academic case study of the script appears in Andrew Charles Tate's 2024 wrestling dissertation.

The practical bridge from research to product is [two-wrestler match planning](match-planning-rfc.md), supported by a [shared kernel and event-ledger RFC](graph-kernel-rfc.md). These remain research artifacts, not deployed features.

## Research: authentic match construction

Professional wrestling is collaborative but not uniformly choreographed.

1. Ricky Steamboat explained that he and Randy Savage assembled WrestleMania III in extensive detail because they had not worked enough together to tune their championship match. He emphasised repeated credible attempts to win and the final counter.
   https://www.fightful.com/wrestling/ricky-steamboat-reveals-why-his-wrestlemania-3-match-randy-savage-was-scripted-move-move/
2. Dax Harwood favours creating emotional landmarks and calling many local sequences in the ring, precisely to adjust to the crowd. He distinguishes this from styles in which a more detailed layout is sensible.
   https://www.cagesideseats.com/aew/2022/12/29/23531863/dax-harwood-explains-no-practice-rehearse-matches-moves-tell-stories-lost-art-young-bucks-emotion
3. WWE producer TJ Wilson describes consulting both performers about time allocation, match order, the length of other bouts and what will make their contest stand apart. He also describes calling audible adjustments through the referee.
   https://chrisvanvliet.com/2023/11/09/tyson-kidd-confirms-he-will-never-wrestle-again-wwe-producer-job-bret-hart-natalya/

The engine should explicitly allow **detailed scripts, agreed landmarks and mostly live calling**, with both wrestlers proposing and negotiating their parts. The contractually agreed outcome is separate from the planning detail.

### Reference cases for annotated *causal* match patterns

| Case | Learning goal | Proposed graph motif |
| --- | --- | --- |
| Savage vs Steamboat, WrestleMania III | Title stakes, controlled escalation, numerous near-falls, earned counter | Claim → escalating threats → counter payoff |
| Hart vs Austin, WrestleMania 13 | Injury targeting, moral reversal, heroic loss and submission | Body-part strategy → refusal → crowd allegiance change |
| Flair vs Steamboat, 1989 trilogy | Scouting, technical counter-chains, changes between rematches | remembered tactic → prepared counter → new strategy |
| Hogan vs Andre, WrestleMania III | Failed early lift creates suspense around the eventual lift | physical failure → revised leverage conditions → earned payoff |
| Guerrero vs Mysterio, Halloween Havoc 1997 | Size mismatch determines strategic choices | agility and counter mobility as causal solutions |
| Undertaker vs Shawn Michaels, WrestleMania 25 | Rare survival, pause, emotional disbelief | protected big move → unlikely escape → reaction and consequence |
| Punk vs Cena, Money in the Bank 2011 | Crowd allegiance, management interference, stakes external to the ring | institutional conflict → attempted interference → aftermath |

Research links for match-study starting points:
- https://www.wwe.com/classics/wcw/ric-flair-ricky-steamboat-trilogy-interview
- https://www.wwe.com/videos/bret-hart-vs-stone-cold-steve-austin-submission-match-wrestlemania-13
- https://www.wwe.com/inside/listthis/maniamatches/maniamatches4
- https://www.wwe.com/shows/moneyinthebank/2011/cena-punk
- https://www.fightful.com/wrestling/ricky-steamboat-reveals-why-his-wrestlemania-3-match-randy-savage-was-scripted-move-move/

Each match should be manually summarised as original abstract event labels. Do not ingest distinctive full commentary/transcripts into the game, and do not imply frequency data is empirical when it is not.

### Promo-study cases

- Randy Savage: ordinary prop → metaphor → refrain → personal assertion.
- Dusty Rhodes, Hard Times: shared injustice → identification with audience → grievance → challenge.
- Jake Roberts: restraint → implied danger → silence → escalating uncertainty.
- CM Punk's 2011 institutional feud: specific accusation → response from authority → contractual consequence.
- Interviewer-led segments: prompt → evasive answer or refusal → clarification → escalation or concession.

For the game, represent **claims and evidence**, not merely broad rhetorical styles. Each response must genuinely address, contradict, evade or reframe what was asserted earlier. Memory and outcome promises must connect to the next match.

## Research from interactive narrative and game AI

- Emily Short, Storylets: atomic content with prerequisites and world effects; a foundation for large, recombinable scenes rather than exploding hand-wired branching trees.
  https://emshort.blog/2019/11/29/storylets-you-want-them/
- Emily Short, quality/salience-based narrative: content unlocks and prominence depend on qualities, history and relevance.
  https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/
- Riedl & Young, Narrative Planning: a story needs causal progression **and** character-intention coherence; neither a pure RNG nor an author-only path is sufficient.
  https://ocs.aaai.org/Library/JAIR/Vol39/jair39-005.php
- Jeff Orkin, real-time planning: reusable actions with costs, but bounded searches and caching to keep browser execution practical.
  https://ojs.aaai.org/index.php/AIIDE/article/view/18724
- Yarn Spinner storylets/saliency: implementations need ranking and recent-use penalties, not just eligible-state filtering.
  https://www.yarnspinner.dev/docs/yarn/03-advanced/02-storylets-and-saliency-a-primer/
- Ink: authoring ergonomics and structured conditional dialogue.
  https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md

## Core architectural decision: a family of graphs, one event language

Use the same kernel for **eligibility, weighted selection, seeded randomness, transition tracing, graph analysis and deterministic checkpointing**. Keep explicit domain rules for physics, social relationships, dramatic beats and dialogue.

Seven cooperating graph families:

1. World/character: contracts, promises, alliances, injuries, reputation, social trust.
2. Match-planning negotiation: two wrestlers' proposals, preferences, objections, compromises and signed landmarks.
3. Match dramatic director: intended arc, tension, landmarks, required climax and agreed finish.
4. Tactical/move graph: ring position, control, fatigue, target anatomy, move costs and counters.
5. Promo/argument graph: propositions, rebuttals, rhetorical method, audience, promise and comeback.
6. Commentary discourse graph: verified event → play-by-play → colour → callback and silence.
7. Aftermath/long-term storylet graph: consequences, emerging rivalries, betrayals, discussions and future match offers.

This is *one system* because the same canonical events can connect these graph types. It is not one giant state machine where everything is interchangeable.

## Graph contracts

A node can have a graph type, ID, tags, condition keys, effect keys, position/match/role requirements, weighted outgoing edges, importance and narrative provenance. Guards must be **pure** and must not consume RNG or modify state.

The kernel can provide:
- graph validation and registration;
- eligibility via graph-specific predicate registries;
- a modifier registry with traceable multiplicative score components;
- stable seeded weighted selection, with sorted deterministic tie-breaking;
- checkpoint-safe execution and backward compatible read-only event projections;
- node/edge reachability, dead-end detection and per-family metrics.

Typed state and effect semantics stay outside the kernel. A wrestler's position is validated by match physics, whereas the meaning of a promise is validated by career history.

### Prevent repeated code and fragile execution

- Consolidate time-based arc forcing in **one** authority; do not leave slightly different conditions in advance and selectArc.
- Do not introduce a library-wide mutable random singleton. Use the match's current seeded RNG, retaining its stored state and call order when possible.
- An event log records every accepted event with unique ID, timestamp, actor roles, pre/post state hashes, causation ID and semantic tags.
- Event effects must be committed **once**, then project outward to memory, rivalry, commentary and stats. Replays and imports must not apply effects again.
- Domain modules can subscribe *for derived read models*, but game rules should not depend on whichever subscription happened to run first.
- Avoid arbitrary executable functions in serialised graph data. Refer to named versioned guard/effect IDs registered in code. Save only event and plan data; rebuild executable registries at runtime.
- Do not combine 50 arbitrary modifiers without bounds. Log each matched rule and its weight; cap/normalise combined outputs after deliberate calibration.

### Long-term scale ambitions (aspirational, not delivered)

- 20–30 dramatic match families.
- 100–150 coherent tactical micro-motifs.
- 400–800 validated action/reaction units with 1,500+ meaningful connections.
- 15–25 rhetorical/promo families and hundreds of claim-aware responses.
- 20–40 storylet rivalry trajectories.
- An original, multi-voice commentary library backed by actual event states.

Quality gates must block this expansion if the authored combinations are repetitive or incoherent.

## Evaluation before scale

First, annotate 10–12 matches, 5–8 promo structures and several multi-week rivalries. For each record:

- causal setup, action, effect, who benefits, payoff and failure path;
- ringside legality, movement, duration, stamina and injury conditions;
- narrator intent (play-by-play vs interpretation), emotional stakes, intensity;
- source reference and author/reviewer notes.

Add:
1. Kernel parity: same seeds and match inputs, same outputs before any deliberate gameplay change.
2. 1,000 simulated bouts per plan/texture where feasible; transition matrix, relative motif frequency, legality failures and performance report.
3. Explicit missing-setup, lost-payoff, duplicate consequence and unreachable finish alarms.
4. A **planned versus actual sheet report** and audience reaction model.
5. Human blind ratings for legibility, plausible psychology, callback use, pace, originality and enjoyment; a route count is not a quality measure.
6. A Graph Lab to inspect nodes, edge guards, modifier traces, seeded bout replay, planning landmarks and commentary provenance.

**Never invent statistical targets such as 'technical matches must use chain 60%' without a baseline or research grounding.** Start with observed current output, calibrate gradually, and attach source evidence to assumptions.

## Deployment strategy

A. Freeze the current game as a behaviour baseline, record statistics and identify duplicated forcing logic.
B. Build the shared kernel and rule registry behind an opt-in parity harness (no gameplay change).
C. Introduce canonical events and explain traces; retain old saves and finishing rules.
D. Make **two-wrestler match planning** the first full feature built with the new engine.
E. Connect planned beats to live tactical event execution, missed-spot recovery and sheet-vs-actual results.
F. Extend promo arguments, storylets, wrestler alliances and rivalries from those same events.
G. Grow authored content only after statistical and qualitative verification.

Use a feature branch or a separate Graph Lab entry point. Do not alter live match behavior, deployment workflows or existing saves during research.
