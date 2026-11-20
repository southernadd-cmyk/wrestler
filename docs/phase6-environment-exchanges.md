# Phase 6 — environmental attacks and exact-parent counters

**Status:** PR #135 under CI, not merged. Builds on v0.5.0 without adding moves or match-clock ticks. Includes a controlled match-rating adjustment backed by real match results.

## Evidence-led priority

The completed v0.5 Graph Lab exercise ran **600 real matches** (six 100-bout scenarios), with no mechanical validation errors or duplicated full action sequences in each sample. Average engine stars were technical **3.07**, power/brawl **3.25**, aerial/spectacle **2.14**, comeback/story **2.51**, cautious **2.47**, and fixed Juno/Rex rivalry **3.32**. A lower rating does **not** itself establish an engine bug; review whole tapes for plausible ringwork.

## First Phase 6 implementation — 44 existing environmental actions

The existing contact commitment system now also covers **18 corner moves**, **16 ringside/outside moves**, and **10 rope moves**. The referee countout tease `os_count_tease` remains a narrative recovery beat, not a forced attack.

- An action must satisfy existing ring position, established apron/ramp location, fatigue, move timing, lift and style limits **before** commitment.
- A generated `_rev` or `_blk` is legal **only during the matching named parent commitment**; otherwise it cannot be selected as a free-standing defensive move.
- Each event records an actual same-parent landing, exact counter, block or abandoned/interrupted action.
- Environmental commitments resolve in the **same beat**, preserving the existing match clock, scoring and saved `contactAttempts` structure.
- The Phase 5 31-parent ground/pin pilot remains a distinct set; environmental actions are additionally selected by the shared contact mechanism. The 340 catalogued move/event IDs, training tags and stage rules are unchanged. The limited high-risk *rating* adjustment is a deliberate separate effect on match stars, not a physics or reachability change.

## High-flyer rating audit — matched opponents and bookings

The same **60 Spectacle-wrestler matchups** were simulated under each match plan, preserving the worker, opponent, seed, card slot and agreed winner. Before the targeted score change the same Spectacle wrestlers averaged **2.08★** for Spot-fest, **2.52★** for Technical and **2.50★** for Brawl. The lower rating came principally from the underlying averaged wrestling-quality and crowd portions. **Botches contributed only about −0.02★ per bout**; this was not simply a case of flyers falling over.

A review of the scoring formula showed that successful spectacular moments are diluted over all ten-second ticks (averaging only about **+0.02★** in the original aerial scenario), even when workers land more actual high spots. The proposed **Clean high-risk execution** component rewards distinct **landed** and authored risky aerial, springboard, ringside, lucha, corner and superplex moves, scales with the real performer's ringcraft/safety, and caps the total at **+0.45★**. Aborted moves, reversals and botches receive no credit; repeated identical moves cannot farm stars. There is **no free score merely for choosing Spot-fest**.

The first full matched follow-up shows **2.22★** for Spectacle/Spot-fest, **2.58★** for the same Spectacle/Technical and **2.58★** for Spectacle/Brawl. Thus the adjustment improves earned spectacle ratings without pretending to have fully resolved the deeper quality/pacing gap. Separate stamina and plan-balance tuning must be evaluated against this matched benchmark, **not** inferred from a single six-scenario mean.

`tools/graph-lab/flyer-rating-audit.cjs` reproduces this 720-bout, three-style/four-plan matched comparison at 60 pairings per row. `tests/phase6-showcase-rating.test.cjs` ensures ratings are earned by actual successful high-risk events with skill weighting, duplicate prevention and a hard scoring cap.

## Validation and next slice

`tests/phase6-environment.test.cjs` checks the **44 landed parents, all 44 exact reversals, available blocks, wrong-controller interruption and JSON pending-state replay**. The full 1,000-match catalogue audit now requires environmental generated defences to have a verified linked contact attempt. The authored family source nodes also offer physically legal environmental follow-throughs, increasing authentic named opportunities without reinstating detached counter nodes. Graph Lab reports environment attempts and counter/landing rates by family; the 600-match CI fixture is rerun against the candidate. No claim of improved wrestling realism is made without full tape review.

**Still to develop:** committed named dives to the outside (currently modelled as individual actions with physical-location guards), top-rope/aerial continuity and targeted star/pacing tuning based on reviewed evidence.
