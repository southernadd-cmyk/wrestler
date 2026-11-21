# Safe match plan — extreme scripted-spot restriction

The initial read-only Safe audit found that all twelve named scripted spectacle candidates carry `risk:true`. These include floor piledrivers, ramp suplexes, barricade collisions, top-rope German suplexes, high-angle flipping dives and shooting star presses.

**Safe-only rule:** the named scripted-spot selector allows only an existing conventional diving elbow (`ar_elbow_point`) when its attacking wrestler has ringcraft at least 78, safety at least 75 and at least 38 stamina. The normal `Graph.canScriptedSpot` check still applies, so proper top-rope preparation, physical location and move timing remain mandatory. The attempted move can still fail or be botched. The special balcony stunt is likewise suppressed when the match plan is Safe, including when requested by the old flag.

If the manager demands a high spot under Safe when none is authorised, the road agent explains that the conservative layout excludes it. The call is still counted under normal match-call rules, as it was when an attempted high spot had no physically legal candidate.

**Not changed:** normal graph move choices and weights, `Graph.isValid`, organic reversals and counter attempts, stamina, injuries, scheduled nearfall source rules, result contracts, styles, ratings or other four plans. A real wrestling move remains playable if already legal, even if it has risk metadata. This is a narrow **scripted spectacle** gate, not a ban on the ordinary move catalogue.

**Testing:** directed tests cover Safe refusals, genuine skilled top-climb → elbow, ordinary legal takedowns, exact owned nearfalls, and the balcony flag. Paired original/current engine runs compare entire seeded event tapes and commentary across all five plans; the four non-Safe plans must be exact, Safe must retain earned covers, late real offence and overall quality.
