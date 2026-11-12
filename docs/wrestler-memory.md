# The Office v3.0 — Living wrestlers, not an unrestricted booking sandbox

**Tagline:** The matches are scripted. The people aren't.

## Design premise

The player is the owner/agent of an independent stable. Other promoters set
the result. The player negotiates opportunities, manages relationships,
intervenes at ringside and handles the consequences afterwards.

The difference from a conventional wrestling booking game is that the
wrestlers do not reset after the show. Their personal memories influence the
next encounter.

## Event -> interpretation -> memory -> conversation -> next match

1. An actual match concludes using the existing v2.9 match graph.
2. The memory layer picks one genuinely meaningful event, such as injury,
   humiliation for a proud worker, a protected loss, a shoot double-cross, a
   standout performance or an ignored ringside instruction.
3. The wrestler stores a dated memory of that event. Personal trust in the
   manager and a relationship score for the opponent can change.
4. For appropriate incidents, the wrestler challenges the player in the
   existing Inbox. These are decisions, not one-dimensional skill checks:
   - **Back them in public:** the wrestler appreciates it, but the promoter
     loses trust in the stable.
   - **Explain the business:** professionals may understand; less experienced
     workers may perceive it as an excuse.
   - **Promise a featured opportunity:** immediate goodwill, followed by
     a real obligation to obtain a featured or main-event booking in two weeks.
5. Future preparations, promos and match introductions recall recent events.
   Lower manager trust reduces match-plan compliance, and greater tension
   with a repeat opponent can favour grudge-match story arcs.
6. Keeping or breaking a promise is recorded in memory, separately from the
   existing morale and loyalty consequences.

## Character focus: Rex Titan

Rex is an experienced, egotistical brawler. A clean loss can genuinely make him
question the manager's decisions. Backing him publicly, talking about the
business or making an enforceable opportunity promise leads to different
future states. A repeat clean loss is interpreted as a second defeat and can
escalate into a lasting grievance rather than repeating the same dialogue.

The data and rules also support the other seven original stable wrestlers,
without hardcoded dialogue restricted to Rex.

## Save, UI and gameplay constraints

- `OfficeMemory` is a small overlay around `OfficeGame.applyResult`,
  `OfficeGame.answer` and `OfficeGame.endWeek`; the underlying
  fight, calendar and management model stays intact.
- `G.S.officeMemory` is optional. Existing and imported saved careers hydrate
  without changes to the save key or version. Individual memories, manager
  trust, rival relations, processed event IDs and conversation cooldowns are
  stored in the regular saved JSON.
- Wrestler profiles show **What they remember**, and the current Road agent
  report gains relevant history. No additional navigation or pop-ups.
- One new confrontational inbox decision per show. Non-urgent conversations
  for the same wrestler have a three-week cooldown. Major injuries and
  double-crosses bypass the per-wrestler cooldown, but still obey the
  one-per-show limit.
- Contracted victories are never overridden by memories. The wrestler may
  be less cooperative, but the finish can change only via the existing
  explicit manager/incident systems.
- No external API or paid LLM, no cloned commentary text, no changes to
  deployment workflows.

## What to test manually

1. Sign Rex Titan and accept a clean-loss booking for him.
2. Work the match, then open the Inbox to read Rex's response.
3. Back him or explain the business. Check the profile's memory and trust.
4. Work another bout; note the personal scouting, remembered microphone
   prompt, ringside introduction and match-plan reliability.
5. In another save, promise a featured bout. Deliver one on the calendar,
   or pass the deadline, to compare the two trust outcomes.

## Regression

```sh
node tests/match-flow.test.cjs
node tests/graph-flow.test.cjs
node tests/promo-flow.test.cjs
node tests/match-variety.test.cjs
node tests/memory-flow.test.cjs
```

The tests cover the original action graph, 500 match outcomes, 625 promo scenes,
600 v2.9 variety bouts, a memory-driven live match, legacy saves, a
confrontation with three choices, injured-worker support, repeated-loss
cooldowns, and promises which are actually met or missed.

## Next iteration (not yet implemented)

Character-to-character alliances and betrayal should use these durable events,
not random monthly incidents. The next milestone should be a two-wrestler
relationship model and short backstage dialogues with enough variation to
produce genuinely different 10-week careers.
