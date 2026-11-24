# Phase 5R.1 — reliability before content expansion

Independent review of main at f019d43 identified a targeted CI hole, Windows EOL fragility, incorrect placeholder agreement, a hidden editorial catalogue in the headless harness, transient loader failure behavior and a possible stale request lifecycle bug.

## Changes

- The existing release-gate workflow selects the promo regression suites for promo code, bank assets, builder, story/rivalry/mouthpiece, shared engine fixtures, manifest/attributes and browser entry/UI changes. Documentation-only edits remain cheap. No additional workflow.
- Generated JSON and manifest use LF via .gitattributes. The builder accepts CRLF in the manifest when checking a Windows checkout, but still compares the byte-sensitive JSON payloads exactly.
- The revision hash includes both UTF-16 code units of astral characters, not just the high surrogate. Current BMP-only assets remain compatible. The revision hash is not a cryptographic integrity guarantee.
- Strength placeholders are plural noun phrases, including the unknown-style fallback ("wrestling techniques"). The incorrect Brick line is rephrased without adding new lines or changing its ID. The editorial builder rejects obvious singular agreement; regression exercises all five strength labels.
- Production and headless engine sources no longer silently import editorial banks. Tests that exercise authored dialogue explicitly supply the same versioned per-character JSON as production; only editorial validation tests load editable source packs. The quality audit exercises production payloads plus composition.
- One retry for transient network errors/5xx fits within the existing 2.5-second total deadline. Missing or corrupt immutable assets are not retried; known offline state avoids unnecessary retries. Successful assets are cached. If the deadline expires, the scene uses available content, pins it once and remains deterministic.
- Scene load tokens are released even if a request completes after navigation. Old completions cannot clear newer tokens or reopen another scene; duplicate starts and mic input while loading are guarded. The load token is not persisted.

## Verification and boundaries

The reliability test executes the actual CI path selection on Linux, checks production script ordering, simulates Windows CRLF manifest reads, checks agreement, explicit production bank loading, retries, timeout and scene token ownership. This is not a real browser navigation/network audit; that remains Phase 5R.3. CI has yet to run on this branch.

The 713-line/22-bank coverage remains unchanged. No new authored banks. This phase does **not** fix the central semantic limitation: tu_strength still answers a style-derived claim rather than the opponent's actual spoken argument. Phase 5R.2 must introduce explicit claim/response tags with protected factual cases and match promises, and test actual preceding speech. Full anonymous editorial review and the remaining roster expansion follow the semantic and browser audits.

Do not treat these narrow grammar and lifecycle checks as proof of creative quality or complete browser behavior. Older pinned scene content remains usable; do not migrate saves or alter previously spoken dialogue.
