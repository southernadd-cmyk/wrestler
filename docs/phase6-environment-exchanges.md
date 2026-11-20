# Phase 6 — environmental attacks and exact-parent counters

**Status:** proposed on an unmerged implementation branch. Builds on v0.5.0 without adding any moves or new match-clock ticks.

## Evidence-led priority

The completed v0.5 Graph Lab exercise ran **600 real matches** (six 100-bout scenarios), with no mechanical validation errors or duplicated full action sequences in each sample. Average engine stars were technical **3.07**, power/brawl **3.25**, aerial/spectacle **2.14**, comeback/story **2.51**, cautious **2.47**, and fixed Juno/Rex rivalry **3.32**. A lower rating does **not** itself establish an engine bug; review whole tapes for plausible ringwork.

## First Phase 6 implementation — 44 existing environmental actions

The existing contact commitment system now also covers **18 corner moves**, **16 ringside/outside moves**, and **10 rope moves**. The referee countout tease `os_count_tease` remains a narrative recovery beat, not a forced attack.

- An action must satisfy existing ring position, established apron/ramp location, fatigue, move timing, lift and style limits **before** commitment.
- A generated `_rev` or `_blk` is legal **only during the matching named parent commitment**; otherwise it cannot be selected as a free-standing defensive move.
- Each event records an actual same-parent landing, exact counter, block or abandoned/interrupted action.
- Environmental commitments resolve in the **same beat**, preserving the existing match clock, scoring and saved `contactAttempts` structure.
- The Phase 5 31-parent ground/pin pilot remains a distinct set; environmental actions are additionally selected by the shared contact mechanism. The 340 catalogued move/event IDs, training tags and stage rules are unchanged.

## Validation and next slice

`tests/phase6-environment.test.cjs` checks the **44 landed parents, all 44 exact reversals, available blocks, wrong-controller interruption and JSON pending-state replay**. The full 1,000-match catalogue audit now requires environmental generated defences to have a verified linked contact attempt. Graph Lab reports environment attempts and counter/landing rates by family; the 600-match CI fixture is rerun against the candidate. No claim of improved wrestling realism is made without full tape review.

**Still to develop:** committed named dives to the outside (currently modelled as individual actions with physical-location guards), top-rope/aerial continuity and targeted star/pacing tuning based on reviewed evidence.
