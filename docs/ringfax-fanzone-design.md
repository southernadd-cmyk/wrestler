# Ringfax Fanzone — player-facing design contract

**Status:** Phase 0 design addition only. No fan simulator has been built.

## Historical design references

The BBC Ceefax service had a letters page (remembered as page 145). Reader discussion, recurring pseudonyms and editorial replies were especially distinctive on ITV/Channel 4 Teletext, including Mega-Zine and Digitiser. Ringfax should follow the **editorially curated letters-and-responses format**, not a modern realtime social platform.

## First-class role

**The Fanzone should be a headline reason to open Ringfax.** It gives the fictional wrestling public personality, disagreement and memory. Fan commentary is simulated in-game fiction, generated deterministically without a server or user-generated online content.

### Pages

| Page | Description | Target |
| --- | --- | --- |
| 500 | Fanzone front page: today's topic, two to four short letters, Fastext links | Phase 1 first playable slice |
| 501 | Readers' letters: rotating subpages and named sign-offs | Phase 1 basic; deepen in Phase 2 |
| 502 | The argument: replies to earlier letters | Phase 2 |
| 503 | Predictions and boast ledger: compare predictions against real results | Phase 2 |
| 504 | Fan poll, clearly labelled editorial sentiment rather than surveyed audience votes | Phase 2 |
| 505 | Editor's reply and corrections | Phase 2 |
| 506–509 | Featured conversation topics and archives | Phase 3 |

Preserve red/green/yellow/cyan Fastext navigation, with page/subpage controls usable by keyboard, mouse and touch. Avoid endless scrolling and phantom missing-page searches for empty topics.

## A small cast of recurring contributors

Start with 8–12 fictional handles. Examples: GrappleGran, HeelTurn78, MatworkMick, BalconySeat, KayfabeKev, TicketStub and FrontRowFran. These are **sample fictional names, not real users**. Give contributors coherent perspectives rather than fixed positive/negative sentiment:

- traditionalist: clean finishes, believable selling, respected veterans;
- heel enthusiast: appreciates villains, without excusing a poor match;
- technical purist: execution, counters and matwork;
- spectacle seeker: big moves, drama and exciting spots;
- loyal local: defends home promotion and mistrusts outsiders;
- contrarian: challenges prevailing opinion;
- business-minded fan: notices attendance and talent movement, not confidential accounts;
- underdog supporter: tracks progress and resents stalled pushes.

Their allegiances and recalled remarks should persist. They may change opinions when the game provides genuine new evidence, never because an unrelated random roll selected a contrary template.

## Data and truth rules

A fan post is an **opinion about a verifiable source event**. Inputs: settled results, match grade, actual finish, crowd response, public rivalry history, contributor preferences and previous published positions. Private morale, trust, confidential negotiation state or future booking schedules must not become confirmed fan knowledge.

A badly worked match with a popular underdog victory can split fans; a technically excellent match with an unpopular finish can do likewise. A fan can predict the wrong result but must not claim a different actual winner as a settled fact.

Publication rules:
- Prefer one meaningful topic and multiple contrasting opinions per edition, rather than random unrelated letters.
- Page 500 holds two to four short comments; overflow becomes numbered subpages.
- Limit repeated use of one handle and track the last source event that contributor discussed.
- Replies refer to previously published comment IDs, not invented historical arguments.
- Editor corrections respond to concrete facts; fan debate may remain unresolved.
- Use independent deterministic editorial selection and a template cooldown, with a quiet-news fallback.
- Handle long pseudonyms within a 40-column display; never change the primary contributor ID.

### Proposed persistent records for Phase 2

Contributor fields: id, handle, archetype, preferences, loyalties, recentCommentIds and rememberedOpinions.
Comment fields: id, season, week, contributorId, sourceEventId, threadId, sentiment, claim, replyToId, templateId and sourceFacts.

Comments are fictional opinion; sourceFacts are immutable projections from real source events. Any publication choices must use Ringfax's independent seeded hash, not OfficeGame.rand or Math.random.

## Changes to implementation phases

- **Phase 1:** A small but genuinely working Fanzone on pages 500 and 501, based on confirmed results, with contrasting recurring handles. No gameplay effects.
- **Phase 2:** Persist reader identities, argument/reply chains, editorial replies, longer-term opinions and predictions checked later.
- **Phase 3:** Rival-promotion fan cultures, archived letters, retrospectives and sustained arguments.
- **Phase 4:** Only consider changes to popularity when feedback-loop balance is explicitly approved and measured.

**Acceptance tests:** identical seed and source yield identical letters; replay does not republish; fans disagree without inventing incorrect settled winners; save/load preserves commenter identities; references to old comments point to real stored IDs; empty weeks do not manufacture a scandal; strict 40x25 layout works on keyboard, desktop and narrow phones.

**Design target:** the player starts recognising regular readers and wants to see what they have to say about the next show. The payoff is continuity and personality, not volume.
