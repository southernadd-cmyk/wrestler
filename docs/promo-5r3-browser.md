# Phase 5R.3 — production browser validation

The focused Chromium journey runs in the existing Browser journeys job on browser-audit/promo-* branches. It is also included in full scheduled/manual browser audits. No additional workflow, dependency at runtime, or full browser suite on routine dialogue changes.

## Opening question

Player feedback identified a conversational gap: the host asked a question, but the first wrestler line jumped into an argument without answering it. New semantic scenes store the actual opening question and connect the selected opening to it. All five formats have action-specific opening answers; the 27 current programme prompts have specific answers. If a public rivalry dispute supplies a different question, that question takes priority instead of concatenating two unrelated questions. The selected substantive argument remains intact, with no new mechanical promise or change to outcome calculations. The first line includes its answered-question provenance. Older already-started scenes retain their previous wording.

This is a bounded bridge, not a full editorial rewrite. It adds a sentence and may occasionally sound redundant with the existing authored opening. Rivalry evidence remains owned by the graph, and the programme answer does not fabricate a new title promise. The next editorial audit should examine transitions and remove redundant phrases, particularly in scenes with recorded arguments.

## Chromium scenarios

- Start the actual game and restore a valid booked match at the microphone boundary; no bank requests during startup or pre-match meeting.
- Two cold requests, real response body sizes and elapsed time; desktop 1366×768 and phone 390×844.
- Reload and open a new scene with the persistent cache; no additional bank requests.
- Clear the bank cache and block network requests; resume a pinned mid-scene save exactly and take the next choice, comparing it to a deterministic copy.
- Verify first spoken line visibly answers the actual host question.
- Transient 503 retry, missing 404, corrupt JSON, transport failure, and two stalled requests bounded by the loader deadline.
- Duplicate and stale actions while loading; navigate back to the meeting using a synthetic delegated UI action (not an exposed navigation button), release requests, ensure the scene does not reopen, then reenter.
- Preserve booked finish and valid closing promise; no uncaught page errors.

Run locally with the static server on port 8765 and Playwright installed: node tests/promo-browser.cjs. OFFICE_BROWSER_URL overrides the default server for a compatible test environment. The tests create fresh isolated browser contexts, not an existing player's save. Network failures are injected in Chromium; timings are local test timings, not measurements of public deployment or real mobile data connections.

CI pass status and observed timings must be verified from the actual run. This does not replace the upcoming blinded editorial quality audit or resolve the remaining roster/metadata coverage work.
