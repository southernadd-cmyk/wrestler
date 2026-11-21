# The Office — Wrestling Source Audit and Annotation Protocol
**Research pass:** 12 November 2026  
**Status:** External-source inspection completed; first abstract examples recorded. No full-transcript scraping, content ingestion, runtime change, dataset release or rights clearance.

This companion note belongs with:
- [Graph engine research](graph-engine-research-2026.md)
- [Two-wrestler match-planning RFC](match-planning-rfc.md)

## Three user-provided primary research locations

### A. CAGEMATCH — Promos Database
URL: https://www.cagematch.net/?id=93

**Directly verified:** a public promos index containing about 1,975 entries as observed on 12 November 2026. Entries can be sorted/filtered by promotion, year and worker, and link to dated promo records with performer names, events, sometimes an explicit feud, transcript text, user ratings and discussion. The index has many unusual character voices and very different styles of argument, including quiet confessions and multi-person confrontations. The public promo detail for Cactus Jack, 3 October 1995, contains a long first-person speech connected to the ECW Raven/Dreamer feud:
https://www.cagematch.net/?id=93&nr=38

**Research value:** extremely high for *promo structure, speaker intention, character voice, recontextualising earlier events and responses*. CAGEMATCH community ratings may help shortlist cases for **human reading** but should not be treated as objective labels of dramatic excellence. A good model needs mundane, disliked and unsuccessful promos as negative/contrast examples too.

**Original annotated motif (not copied prose):**

    apparently apologetic opening
      → personal account of sacrifice
      → grievance with the wrestling business / audience
      → shame and personal responsibility
      → reframe another wrestler's ambition as dangerous
      → direct request for that wrestler to make a decision
      → explicit threat if the request is rejected

This produces a **persuasion/coercion graph** with continuity of motivation. It isn't representable adequately by a generic “aggressive speech” parameter. The central proposition changes, but every later claim builds on earlier evidence.

**Schema fields suggested by this case:**
- who is addressing whom; whether the target is physically present;
- initial position and public claim;
- autobiographical evidence and rhetorical framing;
- emotional shift and reversal of the earlier position;
- asserted obligations, coercion, specific demanded decision;
- future threat/promise, stake and potential scene if unanswered;
- framing as sincerity, manipulation, self-justification or moral reversal.

### B. Pro Wrestling Transcriptions — Josh Lopez
URL: https://prowrestlingtranscriptions.com/

**Directly verified:** free web articles containing show notes, microphone segments, attributed dialogue, descriptions of moves/counters and final outcomes. The landing page identifies Josh Lopez as the author of play-by-play recap coverage. These articles are **original published editorial accounts of performed shows**, not advance scripts, performer rehearsal notes or necessarily complete move-by-move recordings.

A useful example with both a promo confrontation and an extended action narrative is:
https://prowrestlingtranscriptions.com/2026/10/27/wwe-raw-results-10-26-26-liv-morgan-vs-becky-lynch/

Within the October 26, 2026 recap, an early segment has a champion arguing about respect, a challenger confronting that claim, and an authority figure converting the dispute into an immediate title match. The following match account then documents a traditional lock-up, changing control, high-risk offence, false finishes, distraction and interference leading to a definitive finish and post-match violence.

**Research value:** very high for *directed action-to-action transitions and meaningful scene-to-match continuity*. The site is particularly useful for turning the match graph into more than “the same arc with randomly selected moves.”

**Original abstract event sketch (not a reproduction of the article's wording):**

    champion publicly demands respect
      → challenger directly disputes the justification
      → authority converts dispute into a title match
      → cautious grappling and early separation
      → heavyweight offence establishes control
      → challenger finds a fast counter, early pin attempt
      → outside threat interrupts normal tactical priorities
      → finishing attack succeeds after a prior failed setup
      → alliance members attack after the bell

In the graph, these are **different typed events**. A public accusation can open a booking; the booking changes the contract; the contract creates a match sheet; an outside actor may alter tactical conditions; the post-match violence opens a subsequent rivalry/aftermath storylet.

**Annotation categories:**
- event ID, source article and scene timestamp/order;
- wrestler roles including announcer, authority, manager, ally and interferer;
- current position, active attacker/defender, advantage and bodily target;
- move attempted vs landed vs evaded vs countered;
- explicit setup and payoff (if text truly supports that link; never invent one);
- change in control, near-fall, in/out-of-ring state, referee action;
- reaction/selling/recovery and post-match development;
- confidence: explicitly described vs implied/inferred by an analyst.

**Caution:** play-by-play recaps condense action and omit many transitions. Never calibrate realistic transition probabilities from an editorial recap without accounting for omissions. Use curated examples for **structure and candidate motifs**, and annotate authorised full footage separately for any quantitative analysis.

### C. The Official Wrestling Museum — April 14, 2014 RAW production script
URL: https://www.theofficialwrestlingmuseum.com/full-raw-script.html

**Directly verified:** the public museum page is headed “Full RAW Script from Monday 4/14/2014.” The page's readable HTML exposes that heading, but its full scanned content was not accessible as ordinary text in this research pass. We have **not** independently inspected every scan.

Cross-checks and contextual references:
- Contemporary analysis (16 April 2014): https://www.cagesideseats.com/wwe/2014/4/16/5620150/leaked-script-for-wwe-raw-cm-punk-status-john-cena-promo-other-thoughts
- Contemporary coverage: https://www.wrestlinginc.com/news/2014/04/more-on-leaked-raw-script-574328/
- Andrew Charles Tate, *Getting Over* (University of Saarland, 2024), section 2.8.e, examines the April 14, 2014 script and reports segment breakdowns, live cues, performer/character lists, timing, roles, match results, promo scripts, stage directions, announcer notes, local history and production tasks:
  https://scidok.sulb.uni-saarland.de/bitstream/20.500.11880/39220/1/Getting%20Over%20-A%20Study%20of%20the%20History%2C%20Industry%2C%20Performance%20Art%20and%20Cultural%20Impact%20of%20American%20Professional%20Wrestling.pdf

**Research value:** very high for *show-level creative direction, production/road agent objectives, segment allocation and performance constraints*. It demonstrates that the promoter's broadcast outline and the two wrestlers' own move-level plan should be distinct entities.

**Production graph concept:**

    previous-show history + current character alignments
      → producer selects show themes and advertised attractions
      → segment order and television time allocations
      → individual booking constraints, match results and promo objectives
      → performers negotiate micro-plan and transitions
      → live production cues / referee / ringside audibles
      → performed events and aired commentary
      → subsequent show planning

**Do not claim** the show production script contains a fully choreographed wrestling move sequence for every match. Its existence does not prove that.

## Additional high-value scholarly source uncovered during this audit

Andrew Charles Tate, *Getting Over: A Study of the History, Industry, Performance Art & Cultural Impact of American Professional Wrestling* (2024), link above.

Table of contents and extracted text independently confirm the following sections:
- 2.4 — Psychology of a seven-phase singles match, including entrances, shine, chain-wrestling “International” exchange, cutoff, heat, comeback, finish and post-match denouement.
- 2.5 — A detailed case study of an Arn Anderson vs Diamond Dallas Page 1994 match in a nine-act alternative to the seven-phase model.
- 2.8.b — Building the match for the public.
- 2.8.c — Segment planning.
- 2.8.e — The 2014 RAW production script case study.
- 2.8.f — Long-term episodic character evolution (Three Faces of Foley).

This is an **excellent curriculum source** for reviewing our current 13 arcs against an independently documented wrestling narrative taxonomy. It also warns us against treating the classic structure as the only possible match grammar. Screenshots of the remote PDF were unavailable due to an upstream 502; our findings are limited to extracted searchable text and its table of contents.

## Corpus v0 — deliberate sampling, not popularity-only selection

Proposed first annotated research samples:

**Promos (12):**
- 3 solo emotional monologues, 3 rhetorical/absurd-character promos, 3 two-person confrontations, 3 multi-person or authority-involved arguments.
- At least 4 not universally praised (to identify flat, rambling, or unfulfilled argument structures).
- Deliberately span 1980s, 1990s, 2000s, and 2010s/2020s.

**Matches (12):**
- 2 traditional shine/heat/comeback singles.
- 2 technical-counter chess matches.
- 2 grudge/brawl matches with unusual crowd sympathy.
- 2 severe size mismatch / underdog.
- 2 spectacle / aerial matches with interrupted setups.
- 2 story-heavy matches where promo, authority or post-match events materially change meaning.
- Include an explicit case of a planned spot that was altered for safety or by audience response, with first-hand supporting evidence where possible.

**Show scripts/segments (3–5):**
- One annotated April 2014 production script *at segment-structure level* (assuming accessible scans and legally permissible note-taking).
- At least one performer interview about planning a match in detail.
- At least one performer/producer interview about live calling and audibles.
- Compare **producer objectives**, **performers' negotiated sheet**, and **what was actually broadcast** as three different records.

### Normalised annotation record

Fields:

    sample_id
    source_url
    author_and_publication
    medium = [fan_database, editorial_play_by_play, production_artifact, interview, authorised_video, academic_analysis]
    date_of_event
    primary_performers
    scene_type = [match, promo, backstage, production]
    intended_goal
    observed_event_id
    agent_role_slots
    preconditions_observed
    source_confidence = [explicit, inferred, unknown]
    causal_link = [enables, counteracts, establishes, recalls, pays_off, changes_role, triggers_next_scene]
    physical_or_dialogue_state_before_and_after
    audience_reaction_evidence
    stakes_and_fulfilment
    annotation_notes
    human_review_status

Each sample contains **our own compact event abstractions and attribution**, not copied transcript paragraphs. Annotations should be verified by a second pass that specifically asks "are we inventing intent or causation not present in the source?"

## Copyright, data ethics and evidence quality

- Use these websites as research and cite/credit source URLs; **do not bulk scrape, redistribute or use their full transcript text as a bundled game database** without appropriate rights.
- Write original game dialogue and commentary from rhetorical and tactical principles.
- Treat CAGEMATCH scores as reader preferences, not ground truth; preserve outliers and low-rated contrasts.
- Treat a published match recap as selective narrative compression; do not claim that an omitted transition did not happen.
- Treat the RAW script as *leaked historic production material*, not unrestricted licensed material. Separate observations from inference.
- Record when a study has not been directly reviewed in full.

## Concrete next step

Before authoring hundreds more nodes, annotate **one sample from each source** into a tiny cross-graph demonstration:

1. Promo claim and rebuttal graph from a CAGEMATCH source.
2. Match event/control graph from a Pro Wrestling Transcriptions recap.
3. Segment/producer constraint graph from the 2014 RAW script and relevant case study.

Connect the three using a **single typed event ledger**, and show a two-worker signed match sheet that can adapt when reality diverges from its agreed landmarks.

The key quality test is whether the same core engine can explain *what was promised, why a particular counter occurred, what each wrestler expected, and what the next show remembers*.
