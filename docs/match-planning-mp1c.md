# MP1C — versioned planning evidence

The dormant planning domain now exposes two pure adapter operations:

- capture(room, worker, opponent, career): captures version 1 evidence from the
  original participants, existing character identity profiles and supplied
  career state. The room and participant IDs must match.
- observe(snapshot, room, side): resolves the fifteen membership inputs for
  that side and a separate contextual record. Reuse the captured snapshot
  after JSON save/resume; never fetch contemporary career data to replay it.

The canonical worker stats, fatigue, safety ability, ring ability and morale
come from original worker objects, not the legacy room's default-filled
copies. Explicit zero remains zero. Unknown values remain null. Effective
consent uses OfficeRoom.consent only after a base plan has been selected and
both underlying values are finite. The initial placeholder 70 is not
treated as evidence. Room mood delta and storyline heat remain context,
not morale or professional trust. Worker injury, age, style and existing
authored/generated identity are captured as separate facts, not scores.

Directional regard is copied from stored OfficeMemory.rivals only if
present. Existing symmetric bond and betrayal records stay distinct.
Matching memories, recorded prior match count and ledger meetings/talks
are copied from the supplied save, with performer orientation mapped
correctly even for the reversed ledger. Current booking and dated future
events are excluded; same-event ledger rows are conservatively excluded
where ordering cannot be established. Missing historical counts remain
unknown when history is absent. No lazy state-initializing accessors, no
new relationship store, no calls that alter the career. Injury and missed
agreement are recorded observations, not proof of blame.

Professional trust remains unknown: existing regard and bonds mix
professional and personal/storyline evidence. The five proposal-specific
numeric axes also remain unknown until their evidence contracts are
implemented. Neither high feud heat nor an actual injury supplies an
invented trust or risk percentage.

The new test uses actual academy intake and 200 real room fixtures (400
participants); it verifies raw stat provenance, effective consent after
plan selection, JSON replay parity, known identity, missing and explicit
zero facts, no mutation, directional and reversed ledger evidence, and
snapshot identity/version validation. Career-history fixtures are synthetic
and explicitly separate from roster coverage. No production loading,
persistent fields, gameplay changes, or additional workflows. Future
rule phases may use the adapter in shadow mode; live opt-in is deferred.
