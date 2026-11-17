# The Office v0.3.12: rivalries that remember

**Status:** v0.3.12, the Rivalry edition. Built on `feature/deeper-promos-rivalries-v3-12`.
**Brief:** deeper promo arguments and evolving rivalries (reference: `docs/creative-loop-v3-2.md`).

**The acceptance question:** if two wrestlers meet five times, do they seem like two people with a shared history, or like five separate random dialogue encounters?

On the evidence below, it is now the first, with caveats listed at the end. The four five-bout reports in `docs/reports/` are the primary evidence. `docs/reports/baseline-rex-silas.md` is the same experiment run on the code before this pass.

---

## 1. Baseline audit (Phase A)

### Genuinely implemented before this pass
- A three-stage promo graph (`story.js`): 21 angles, 183 condition-gated variants, a factual `claim` with a thesis, an opponent reply aimed at the opening, and answer-relevance scoring. Accusations without evidence lose credibility.
- Public promises (win, clean, finisher, counter) tested against the actual match result. A counter vow is paid only by a late, worker-controlled reversal, and a family-specific counter vow only by that family. The result goes into memory.
- The duel presentation (`promo-duel.js`): four rounds, a crowd meter, Dennis's read, and the opponent's angle.
- The agents' room (`agents-room.js`): pitches that are physically checked, a running-order board, 36 drawable situations, threads that return at later shows, and a signed sheet the engine performs.
- Memory (`memory.js`), bonds and betrayals (`relationships.js`), and 80 wrestler voice packs.

### Partially implemented
- **Evidence.** Promos looked only at the most recent result (`history[0]`) and the first memory against the opponent. `history` holds 40 rows across the whole career and `memory` holds 12 entries per wrestler, so a long rivalry loses its past.
- **Positions.** Opponent replies were templates per angle, so the opponent never developed a position. The baseline shows Rush saying "You studied the last match? Good. I won that one…" in three of the four rematches.
- **Concession.** `calm` and `pr_lesson` existed, but conceding was a tone, not a recorded position with consequences.
- **Negotiation.** The board let you choose between pitches, but nobody proposed a specific change for a reason that arose from history, and nobody answered a revision.
- **Continuity.** Only `feud.lastPromo.promise` crossed between meetings.

### Absent
- A structured, persistent record of what was argued (proposition, evidence, counterclaim, resolution).
- Facts about *how* a match was won (cheating, submissions, reversals, stamina). The engine produced them, but nothing kept them in a form an argument could cite.
- Any fading of old grievances, or any notion of an issue being settled.

### Statements not supported by recorded events (fixed)
These lines asserted incidents the save never recorded:

| Line | Problem | Fix |
|---|---|---|
| Interviewer reading `Memory.context().promoPrompt` | Read backstage notes on air ("Titan remembers being asked to lose decisively") | Replaced with a public introduction built from the rivalry record |
| `claimContext.evidence` | Used the same backstage memory text as spoken evidence | Uses public facts only. A first-person version (`said`) is used in the speaker's mouth |
| `ac_fake` | "You shook my hand… then complained backstage. I heard." | Reworded as an opinion |
| `ac_humiliation`, `pe_humiliation` | "You stood over me and laughed" | Now says what is recorded: a decisive defeat |
| `p_injury`, `pe_injury` | "Left on a stretcher", "weeks unable to lift my arm, you never called" | "Went home hurt" |
| `nu_minutes` | "You fade at the eleven-minute mark… four tapes" | Presented as a bluff, with no invented figures |
| `nu_record` | "One match, one win" regardless of the real record | Uses the actual tally, and only when it really is 100% |
| `ht_hero` | "Your favourite went home early" even after a loss | Only after a win |
| `ac_cheat` | Asserted specific cheating with no record | Now a charge about style |
| `ac_coward`, `qu_big_move`, `im_scar` | Invented incidents ("found a reason to leave", "just like last time", a scar from a humiliation) | Reworded or gated on real evidence |

---

## 2. What was built

| File | Change |
|---|---|
| `assets/js/rivalry.js` (new) | The rivalry ledger, ranked evidence, stance, 20 argument issues in 9 families, choice of case, interviewer introduction, recording of claims, commitments and negotiations |
| `assets/js/match-engine.js` | `final.evidence`: counters and late counters by side and family, cheap shots by side, stamina at the bell, injuries, and each sheet beat's outcome. Read-only: no random draws |
| `assets/js/story.js` | A case can ride on an existing opening, the five answers address the counterclaim, a close can make a commitment official, and a `nocheat` promise exists. Plus the fixes above, and no exact repeat of the last promo's variants against the same opponent |
| `assets/js/promo-duel.js` | Evidence tags on options. A thrown-back charge turns "push your luck" into stand firm, revise, or let it stand. Dennis's read knows when there is a record. The view shows the record and anything unsettled |
| `assets/js/agents-room.js` | Counter-proposals with a reason, the other wrestler's reply (agreed, conditional, reservation, refused), and changes written onto the sheet |
| `assets/js/relationships.js` | Bond changes happen once per contract. The chemistry memory is written before the bond is read (an existing ordering bug the five-bout harness exposed) |
| `assets/js/ui.js`, `assets/css/match-night.css` | The interviewer's public introduction, an "On the record" panel and an "Unsettled" reminder on the promo screen |
| `tools/five-bouts.cjs` (new) | The five-bout experiment and report generator |
| `tests/rivalry.test.cjs` (new) | Acceptance tests (section 8) |

No new dependencies, storage, backend or remote model. Every new piece of state is plain JSON under `S.rivalries`.

---

## 3. Data model

```
S.rivalries["rex:silas"] = {
  meetings: [{cid, n, finish, outcome, winner, how, route, cheat, cheatDetail, submission, reversedFinisher,
              stolen, slow, exhausted, outlasted, minutes, stars, counters{w,f}, late{w,f}, families{w,f},
              stamina{w,f}, injured{w,f}, damage, cheapShots, promise{type,kept,say}, commit{kind,say,verdict}}],   // last 10
  claims:   [{cid, issue, factId, family, owner, raisedBy, thesis, evidence, prop, counter, mode,
              response, resolution, exposed, fConceded, commit{kind,say,verdict}}],                                // last 12
  talks:    [{cid, issue, by, slot, original, final, reply, delivered}],                                           // last 8
  done:     {cid: 1}                                                                                                // idempotency
}
```

- **Facts.** These are derived on demand from `meetings`, ranked by weight, and fade by about 28% per meeting. Major ones fade by 8%: injuries, cheating, betrayals and broken promises.
- **Stance.** This is computed, not stored, from the existing bond score, the wrestler's regard (memory), and the ledger. No second relationship score is kept in step.
- **No double rewards.** The ledger awards nothing. Promises are still paid for by the promo layer, and moods by memory and the locker room.
- **Old saves.** Careers saved before this version build their ledger from `history` rows on first access. Those meetings are marked `legacy` and cite only results.

**A case**, the argument for tonight, is a fully materialised, serialisable object. It holds the proposition, the evidence (the public fact), the target, the intent, the counterclaim in the opponent's register, five answers (each with a line, a reply, a resolution, a relevance score, effects and an optional commitment), push lines, and whether it continues an unresolved argument.

---

## 4. The argument library

There are 20 issues across 9 families, plus the existing psychological bluffs. Each issue is available only when its fact is on the record.

| Family | Issues |
|---|---|
| Past results | `cheat_f` (they won with the tights or ropes), `slow_count`, `clean_win_w`, `clean_win_f` |
| Wrestling ability | `tapped`, `finisher_reversed`, `stolen` (you slipped their finisher), `outlasted_w`, `fade_f`, `counters_w` |
| Broken promises | `promise_broken` |
| Credibility | `promise_kept`, `cheat_w` (you won dirty) |
| Professional respect | `injury_f` |
| Personal grievances | `injury_w`, `betrayal` |
| Status and opportunity | `record_w`, `record_f` |
| Mutual recognition | `great_match` |
| Loyalty | `bond_friend` |
| Psychological tactics | the existing bluff variants (`nu_minutes`, `fa_*`), now worded as bluffs |

**Who owns an issue.** An issue owned by the other wrestler (for example, Titan tapped) is raised by them in their first reply, whatever the player opens with, unless the player pre-empts it.

**What vs how.** Each issue's *content* is fixed. The *delivery* is shaped by voice: precise and stoic talkers add the detail ("12 minutes of wrestling, and it ended with…"), gruff ones cut it to the bone, earnest ones soften it, and grand and sermon ones elevate it. The opponent's *register* is substantive, not cosmetic:
- **evidence:** cites what happened.
- **dismiss:** refuses to engage.
- **concede:** grants the point and keeps the conclusion.
- **deflect:** changes the angle.

The register comes from the opponent's voice, adjusted by stance and ego.

**The five answers.** Every issue has:
- `calm`: concede the fair part.
- `turn`: defend with evidence.
- `challenge`: make it a public test.
- `personal`: escalate.
- `callback`: change the subject.

They resolve differently (conceded, defended, reframed, unresolved, withdrawn). Some depend on the record: "the damage did it, not the hold" is a defence only if the opponent really worked that body part.

**Consistency checks.**
- **Throwing a charge back.** If the speaker is guilty of the same thing ("you can't win fairly" from someone who won with the tights), the opponent says so, and the push round becomes stand firm, revise, or let it stand.
- **No promises.** Saying "no promises tonight" and then making one costs 4 credibility, and the opponent points it out.
- **Continuations.** An argument left unresolved returns as a continuation ("You never did answer me…"), at most twice. A repeat offence is said as one ("Twice now"). An issue argued at the last meeting gives way to something else, unless it was left open.

---

## 5. Backstage counter-proposals

The `rival_counter` scene goes to the front of the meeting only when a real reason is possible. It is skipped if the pencilled board already avoids the problem. There are three reasons, in priority order:

1. **Safety.** A risky big spot for someone who is tired, carrying an injury, or was hurt in this rivalry. A credible "keep it" ends in a refusal, and Dennis swaps in near-falls.
2. **Scouting.** The move on the board belongs to a family the opponent reversed at the last meeting. The proposal is a move from a different family.
3. **Credibility.** A wrestler with two or more straight losses to this opponent is booked to win, and asks to take a real beating first.

The other wrestler answers in character:
- **Agreed:** the default.
- **Conditional:** a proud wrestler whose own move was taken asks for the big spot or two more minutes, which leads to a follow-up scene with grant, split or refuse.
- **Reservation:** from a hostile wrestler without high professionalism.

**What gets recorded.** Accepted changes are written to the board, so the signed sheet changes, the graph stays valid, and the contracted finish is untouched. The sheet carries the whole negotiation. After the match the ledger records whether the negotiated beat was achieved, adapted or missed, and Dennis brings it up at the next meeting.

---

## 6. Connection to the match

- **Specific counters.** A counter promise can be family-specific ("reverse the Rush Lock" means submissions only). The engine pays it only for a late reversal of that family, and commentary names it ("…the counter promised at the microphone, reversing the Rush Lock").
- **No-cheating promises.** `nocheat` is kept only if the finish was not dirty and the engine recorded no cheap shot by the speaker.
- **Narrative-only tests.** "I'll still be standing at the end" (`outlast`) creates no match objective. The ledger checks it against stamina at the bell, and later arguments can cite it.
- **Cheap shots.** A cheap shot along the way is recorded, but never described as "how they won". Only a cheating finish route makes a cheating fact.

---

## 7. The five-bout experiment (Phase G)

`node tools/five-bouts.cjs` uses one persistent career and five separately booked encounters. Each has a meeting, a promo, a seeded match, the interface's post-match step, a duplicate-application check, a save and reload, and two weeks passing. The scripted player is deliberately simple. It always takes an evidence option when one exists, and its answer stance per bout comes from a fixed policy (measured, gracious or hot-headed).

| Run | Pairing and stance | Arguments, bouts 2 to 5 | Shape |
|---|---|---|---|
| Baseline | Titan v Rush, old code | none (generic variants) | Lines repeat between consecutive bouts. The interviewer reads backstage memories on air |
| A | Titan (gruff brawler) v Rush (precise technician), measured | broken promise (conceded), 0–2 record (challenge: "end the run", kept), kept promise (defended), 1–3 record (conceded) | A losing run, a public vow that comes good, then honest acceptance. The negotiation in bout 3 changes the heat segment, and Rush asks for two more minutes |
| B | Same pair, different results, hot-headed | kept promise (escalated, left open), the same argument continued (defended), tapped (escalated), kept promise (a renewed vow) | Rush grows from resentful to hostile. Rush renegotiates the heat three times because Titan keeps reversing his moves |
| C | Cruz (earnest) v Knight (slippery), gracious | kept promise, ran out of gas ("I'll still be standing", narrative test), broken promise (conceded), finisher reversed (conceded) | A gracious loser who concedes and adjusts |
| D | Mercer (stoic veteran) v the Reverend (sermon, pro 93), gracious | kept promise, tapped (vow: reverse the Last Rites), broken vow (conceded: "no promises tonight"), great match (mutual respect) | Ends with both respectful and a low-conflict "let's do it again properly" |

**Measured against the baseline:**
- **Repetition.** Wrestler lines repeated verbatim between consecutive bouts fell from 3 to 8 per bout to **0 of 6** in every bout of every run.
- **Citations.** Every rematch cites a fact from a bout that actually happened.
- **Development.** The arguments change, and so do the resolutions and the stances.

---

## 8. Mechanically verified (automated)

`tests/rivalry.test.cjs` and the existing 28 suites check the following:

- [x] **Gating.** Claims that need history are unavailable without it. A first meeting has no cases. Each issue appears only with its fact (14 positive and negative checks), and every cited fact points at a recorded meeting.
- [x] **Rebuttals.** Every rebuttal addresses the claim. The opponent's first line is that case's counterclaim, and each reply follows from the answer chosen. All 20 issues have five answers covering at least three distinct resolutions in all four registers.
- [x] **Distinct answers.** Granting the fair point scores above shouting, and escalating raises the heat.
- [x] **Sheet changes.** An accepted counter-proposal changes the intended plan in 5 of 16 combinations (the rest have no move of a different family to offer, so nothing is invented). The plan stays a legal graph, the contracted finish is unchanged, and a full match still delivers the contract.
- [x] **Refusals.** A worn-out high-flyer who was hurt in this rivalry refuses an unsafe spot.
- [x] **Promises resolved against evidence.** A `nocheat` promise is tested against the engine's own record across four bookings.
- [x] **Idempotent.** Processing the same result twice changes nothing. This was found broken in `relationships.js` and fixed.
- [x] **Save and load.** History survives a reload. Pre-ledger careers rebuild their ledger. A mid-promo state from the previous version plays to the end, and so does a legacy duel. This was also checked in the browser, with a real save from before this version.
- [x] **Reproducible.** The same career, decisions and seeds reproduce identical transcripts.
- [x] **Five-bout checks**, over three careers: no bout re-runs more than half the previous bout's lines, every rematch cites a real fact, at least five issues, three resolutions and three stance combinations appear, two professionals end up respectful, and counter-proposals happen.
- [x] **Full regression.** `node tests/run-tests.cjs` passes all 29 suites.

**Browser checks:**
- **Desktop.** The live interface was played from the promoter meeting to the result screen. The meeting skipped the counter-proposal correctly. The promo showed the record, the evidence-tagged options, the five position-tagged answers, and a close that "Follows from your words" with a "You are booked to cheat" warning. The result screen showed the argument's verdict and the rivalry record.
- **Mobile (375px).** No horizontal scroll, and the new panels fit.

---

## 9. Subjective findings on dialogue quality

These are judgements from reading the reports, not measurements.

- **Shared history.** The strongest runs (A and D) read as two people with a shared history. In D, "You tapped" becomes a public vow, the vow fails, Mercer admits it with "no promises tonight", and the fifth meeting is a gracious "let's do it again properly". None of that is scripted; the seeds and bookings produced it.
- **Voices.** These are clearer in *how* claims are made than before. Juno cites "14 minutes"; Titan says "A handful of tights. That is how you beat me." King, an earnest talker, concedes "It was not pretty… It still counts."
- **Promise topics are common.** The scripted player promises something at almost every close, so promise topics recur. Grouping kept and broken promises as one topic, and resting an issue after it has been argued, keeps them from dominating, but a real player who promises less will see more results-based arguments.
- **Rough edges:**
  - Opponents with "the" in their short name ("the Reverend") read oddly when addressed directly.
  - Crowd and stage reaction lines still come from shared pools.
  - The interviewer's question can name one fact while the player argues another, which reads like a dodge. It is realistic, but it isn't flagged.
- **Rarely seen issues.** The betrayal and friendship issues depend on bond states the experiment rarely reaches. They are tested mechanically, but have had little reading.

---

## 10. Not done, or worth doing next

- A post-match "promised versus happened" panel on the result screen. Today it is a consequence line.
- A rivalry page summarising the ledger (the existing "Rivalries" screen could show it). It was left out to avoid a new dashboard.
- Longer runs (10 or more meetings) to tune fading. The ledger keeps 10 meetings and 12 claims.
- A human playtest. The scripted player cannot judge whether the choices *feel* meaningful.
