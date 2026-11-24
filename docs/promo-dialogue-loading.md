# Dialogue loading and compact composition (revised phase 5)
 
The writing target is now approximately 40 distinctive authored lines per wrestler, not 84. This is an editorial target, not a quota. The existing 713 lines are retained verbatim (22 character banks, including pilot overlap). The unfinished expansion towards 84 is intentionally not included. Do not fill quotas with interchangeable boilerplate.
 
## Delivery
 
The browser starts with a small revision manifest and loader, not any authored dialogue bank scripts. A promo loads only the actual speaker and opponent (at most two character assets). Unknown characters without an authored bank make no request. Content-addressed filenames support HTTP cache reuse; validated payloads are also stored individually in localStorage, with an in-memory cache and concurrent request deduplication. Old versions are invalidated by the manifest revision. No runtime dependency, API, service worker or full-roster background prefetch.
 
On the current bank, the previous three source scripts are 52,322 UTF-8 bytes combined. The 22 independently encoded JSON assets are 83,808 bytes total (metadata is duplicated between small files); the browser does **not** download them all. Per-bank payloads range from 2,642 to 6,701 bytes, typical around 3–4 KB. Largest possible two-speaker cold transfer is 12,174 bytes before transport compression. Startup excludes all authored line payloads but adds small loader/manifest and composition logic. These are measured raw asset sizes, not browser timing or claims about deployed compression.
 
A failed request times out after 2.5 seconds, then the scene proceeds with any available cached bank and the existing graph fallback. Storage quota failures are harmless. A returning offline user can use cached banks; a first-time offline scene cannot load a bank it has never downloaded. No promise of whole-site offline support is made.
 
New in-progress scenes pin only their compact bank payloads inside the existing match-night save. Choices remain synchronous, deterministic and network-independent. A reload of an already-started scene does not need bank downloads. An older in-progress scene without pinned banks loads its speakers' current available banks on first resume, then pins them. Completed scenes retain spoken text and IDs. The simulator/test harness can still use the editorial sources in memory; those sources are not loaded by the browser.
 
## Composition
 
Authored lines take priority. Where no fresh authored line fits, a bounded deterministic composer uses the actual named opponent strength in the approved turn rebuttal and actual opening subject in directed follow-ups. Eight delivery families and the director's stance provide variation. Composed IDs are tracked separately from authored IDs; recently spoken composed lines are avoided too. Evidence, cases, specific plans, imagery commitments and all closing promises are not overridden by composition. The composer is not a general dialogue generator: it deliberately covers only those reviewed slots, and the existing graph remains the fallback elsewhere. No invented biography, win-loss record, private booking or fabricated family history is introduced by the composer. Existing fallback writing still needs editorial attention.
 
## Authoring workflow
 
Maintain the existing editable source banks under assets/js/promo-dialogue-bank-*.js and the original pilot source. Run:
 
    node scripts/build-promo-banks.cjs
 
Commit new versioned JSON assets and the generated manifest. The builder validates the catalogue, retains stable line IDs and does not delete prior versioned assets. The targeted regression checks exact asset equivalence, cache/deduplication, failed/corrupt requests, offline behavior, two-speaker fetches, serialized resume, seeded selection, protected slots and promise/effect parity. No additional CI workflow.
 
Next: broaden authored coverage towards 40 per character using small batches, and extend compositional coverage only when the semantic contract can be tested. Run a real browser/network audit and anonymous dialogue review before declaring performance or writing quality complete.
