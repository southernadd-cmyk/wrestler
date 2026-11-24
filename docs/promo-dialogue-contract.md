# Phase 5A — dialogue architecture

The browser and headless engine load the same dialogue contract. New live scenes snapshot public character/booking context and annotate actual spoken turns with the speaker, stage, action, side and protection reason. No spoken wording changes in 5A. Existing saved scenes without the new facts object behave as before.

## Content contract

A pack is `{owner, role, lines}`, where owner is the stable character ID and role is wrestler, manager or promoter. Line IDs must be globally unique (use character ID plus a descriptive suffix). A line is:

```js
{
 id: 'nova.open.proof.01',
 category: 'opening',
 stage: 'open',
 action: 'proof',
 side: 'w',
 text: 'I want you to watch what happens when I have your wrist.',
 when: {speakerStyle:'Technical', formats:['interview','faceoff']}
}
```

This example illustrates the schema; it is not a shipped bank. Stage/action describes the underlying decision, including for an opponent response (side f). Categories are editorial coverage, not alternative simulation decisions. Available categories: opening, challenge, rebuttal, disrespect, respect, vulnerability, pressure and closing. The target coverage is 12/12/16/8/8/8/10/10 (84 per character), subject to editorial review rather than filling quotas with near duplicates. Index by speaker role/ID and exact decision slot, not a roster-pair matrix. Packs can be maintained independently in future batch files.

Optional conditions: formats, minAge/maxAge, minMeetings, titleMatch, hasMouthpiece, speakerStyle/opponentStyle, landed, min/maxComposure, min/maxIrritation, subject. Missing facts fail a condition, rather than being treated as zero or made up. titleMatch means the match is for a title, not that either wrestler holds a belt. minMeetings requires the verified record count; a synthetic feud heat or history flag does not qualify. Age is current scene age, not an assumed career milestone. The speaker of a mouthpiece segment is the mouthpiece; the client remains a separate subject.

Allowed placeholders: speaker, client, opponent, venue, finisher. Finisher refers to the client when speaking for them and the opponent's own move when that opponent is speaking. Missing values exclude the line. No arbitrary executable condition functions, private booked finish, invented results or title ownership placeholders. The validator checks structural constraints, not the truth of arbitrary prose: authored claims still need editorial review. Additional factual capabilities require explicit state extraction and tests.

The graph retains authority over evidence, context variants, imagery motifs and closing promises. The first selector must not replace protected slots; it may later use semantically compatible additions or carefully validated intent-specific variants. Preserve exact original graph text if a candidate is missing or unqualified. The tag is metadata, not proof that a replacement is semantically safe.

## Rollout

5B adds deterministic relevance ranking and repetition avoidance and a conservative integration seam with real authored pilot lines. 5C–5L are the writing batches of 20 (adjust to the actual roster/register; academy entrants receive their own generation approach in 5N). 5M covers managers, promoters and mouthpieces. 5O compares anonymous transcript quality and measures reuse and coverage. No runtime LLM, new workflows or save migration.

The test constructs 200 synthetic packs with 16,800 indexed rows to exercise catalogue capacity, not to represent written dialogue. It checks invalid schema rejection, strict role/slot matching, factual conditions and missing placeholders; 48 paired live scenes assert unchanged dialogue, promises, tactics, quality and deterministic resume with the metadata enabled. This does not establish editorial quality or production content coverage. CI must verify the test.
