# The Office — Two-Wrestler Match-Planning Engine (RFC)
Research date: 12 November 2026
Status: PROPOSED design. No playable implementation in this branch.

## The missing mechanic

On the live game, choosing "Stick to the sheet" increases script compliance without generating a literal match sheet. There is nothing concrete for the wrestlers to agree to, remember, execute or depart from.

The solution is a **pre-match planning meeting between both wrestlers**, with the manager directing priorities and resolving genuine disagreements. The agreed sheet then becomes a **causal landmark graph** consumed by the actual match simulator.

This is the central candidate gameplay feature after the shared kernel and canonical events.

### Authentic research

- Ricky Steamboat described scripting Savage–Steamboat for WrestleMania III move by move, including the title-story objective and numerous false finishes. https://www.fightful.com/wrestling/ricky-steamboat-reveals-why-his-wrestlemania-3-match-randy-savage-was-scripted-move-move/
- Dax Harwood describes preferring to plan dramatic/emotional beats while calling most movements in the ring, with more detailed preparation sensible for high-risk/high-flying styles. https://www.cagesideseats.com/aew/2022/12/29/23531863/dax-harwood-explains-no-practice-rehearse-matches-moves-tell-stories-lost-art-young-bucks-emotion
- TJ Wilson describes coordinating wrestler ideas, allotted time, place on the card, distinctiveness from adjacent matches and instructions/changes communicated live. https://chrisvanvliet.com/2023/11/09/tyson-kidd-confirms-he-will-never-wrestle-again-wwe-producer-job-bret-hart-natalya/

There is no universal planning method. The game should support **three levels of detail**, and separately choose who has **in-ring authority**.

## Proposed gameplay loop

1. **Contract**: promoter fixes the outcome, slot and available time; manager already negotiates money and protecting a loss.
2. **Pre-match preparation**: show each wrestler's condition, style, opponent trust, injuries, rivalry and the promoter's needs.
3. **Wrestlers' planning meeting**: Worker A suggests a dramatic premise and initial landmark; worker B accepts, modifies or objects based on style, familiarity, safety, ego and their role in the finish. Both voices matter.
4. **Manager decisions**: approve an agreed outline; intervene in up to one or two genuine disputes; or let the two wrestlers lead.
5. **Signed sheet**: see a short ordered set of beats with visible intended actions and responsibility. The sheet must be stored as structured data.
6. **Promos**: speaking choices can establish a new payoff; if relevant, add that promised motif to the match sheet without changing the contractual finish.
7. **Live bout**: the match director prioritises legal micro-motifs that advance the sheet's agreed beats. A deviation can become an explicit adapted beat, not an unexplained random move.
8. **Debrief**: show "planned / completed / adapted / dropped", explain why, and let trust or promoter reaction reflect actual cooperation.
9. **Next show**: remember improvised saves, broken agreements, injuries, broken trust and move counters across encounters.

### A compact playable example: Rex Titan vs the Reverend

CONTRACT: Titan loses clean to Reverend, 12 minutes, mid-card.

Original two-wrestler discussion:

    AGENT: We have twelve minutes. Reverend wins clean with Last Rites.
    TITAN: Let me overpower him early. The crowd needs a reason to believe I can win.
    REVEREND: Then I avoid the first tie-up, come back at the ribs and slow him down.
    TITAN: Fine, but I want a credible spinebuster near-fall.
    REVEREND: I'll give you that. Afterward, sell the ribs and charge once too often.
    AGENT: That gives us the counter into Last Rites. Are both of you comfortable?
    TITAN: As long as we don't make me look foolish.
    REVEREND: Agreed.

The manager sees:

| Window | Sheet commitment | Owner | Required setup / payoff |
| --- | --- | --- | --- |
| 0–2 min | Establish Titan's strength, Reverend avoids a direct contest | Both | Establish size and power |
| 2–5 min | Reverend takes control, isolates Titan's ribs | Reverend | Rib work persists into comeback |
| 5–7 min | Titan attempts an escape but the damaged ribs slow him | Both | Injury selling is observable |
| 7–10 min | Titan manages a spinebuster and near-fall | Titan / Reverend | Legal standing lift, opponent grounded, referee counts |
| 10–12 min | Titan charges, Reverend counters into Last Rites | Reverend | Booked clean win, prior rib damage matters |

Each line is a **landmark with many legal ways of getting there**, not one fixed paragraph or a mandatory hard-coded sequence.

### Three planning detail modes

**Fully detailed**: named sequential spots and counters plus backups. High coordination potential, requires familiarity and rehearsal; fragile if low chemistry or plans diverge.

**Key landmarks** (recommended default): opening objective, one or two major control changes, a signature spot/false finish and a required final sequence. Tactical selection supplies transitions.

**Call it in the ring**: contractual finish, one shared story premise, safety restrictions and optional signature commitment. Workers respond to crowds and each other; impressive when skilled and compatible, uncertain when not.

### Separate calling authority

- **Sheet-led**: preserve the agreed commitments where safe and coherent.
- **Named leader**: wrestler A or B calls the next local sequence; partner may propose a counter.
- **Shared calls**: both wrestlers adapt to opportunities, with a higher trust/psychology requirement.

The authority mode and planning detail are independent. Fully laid-out beats can still contain permitted audibles, and a loosely planned match still has its immutable contractual outcome.

### Requirements for the two AI wrestlers

Each needs:
- a short-term *performance intent*: look strong, protect opponent, protect injury, earn respect, preserve finish, get heat, delight the crowd;
- acceptable and unacceptable spots based on body, skill, trust and remembered experiences;
- preferred techniques plus tactics appropriate to their opponent;
- a stance on calling authority, planning detail and the nature of the booked loss;
- a negotiation voice influenced by professionalism, ego, morale and relationship history;
- a fallback if partner/manager refuses their preferred beat.

The manager may insist on a spectacle but cannot force an unsafe/physically impossible sequence simply because the game needs it. Both wrestlers remain active agents with responsibility for the shared story.

### Compact user interface

Retain the existing 1990s desktop theme and the recently approved short-screen/mobile match-preparation design.

Recommended stages:

    CONTRACT / SCOUTING → GAME PLAN → MATCH MEETING
                        → SIGNED SHEET → MICROPHONE TIME → THE MATCH → DEBRIEF

In the meeting use a small conversation transcript plus a compact timeline. Offer default **Accept their plan** and only one or two meaningful interventions. Do not require the player to author 20 moves by hand every show.

The sheet preview should be visible before the bell; after the match it should remain accessible with completed/changed/missed beat indicators.

### A concrete, serialisable data contract

Illustrative schema, not runtime code:

~~~json
{
  "schemaVersion": 1,
  "contractId": "c-123",
  "planStyle": "landmarks",
  "callingAuthority": "shared",
  "performers": [
    {"role": "worker", "id": "rex", "approved": true},
    {"role": "opponent", "id": "rev", "approved": true}
  ],
  "premise": "Titan's power is worn down by the Reverend's rib attacks",
  "landmarks": [
    {
      "id": "rib_attack",
      "window": [0.17, 0.48],
      "owner": "rev",
      "goal": "target_ribs",
      "requires": ["opponent_accessible", "in_ring"],
      "establishes": ["rib_damage"],
      "fallback": "corner_targeting"
    },
    {
      "id": "spinebuster_nearfall",
      "window": [0.58, 0.88],
      "owner": "rex",
      "goal": "credible_nearfall",
      "requires": ["rib_attack", "legal_spinebuster", "in_ring"],
      "paysOff": ["titan_power_established"],
      "fallback": "counter_nearfall"
    }
  ],
  "finish": {"kind": "lose_clean", "owner": "rev"},
  "execution": {"complete": [], "adapted": [], "missed": []}
}
~~~

The sample is abbreviated; a real schema must define unique IDs, dependency DAG, legal alternatives, role maps, current step, event links, and save/replay behaviour.

### Why sheet adherence must be event-based

At present a "sheet" percentage is inferred from wrestler obedience. In the new engine, adherence is measured against actual commitments:

| Agreed | Performed | Explanation |
| --- | --- | --- |
| Titan's spinebuster near-fall | Substituted a clothesline | Rib damage made a heavy lift too risky |
| Reverend works ribs | Achieved | Targeted attack led to weakened comeback |
| Finish via Last Rites | Achieved | Reverend caught a charge and used the agreed finisher |

Do not punish sensible substitutions which preserve intent and safety. A deliberate defiance or unexplained refusal can affect both worker-worker and worker-manager trust.

## Critical engineering boundaries

- A match sheet is a **directed graph of commitments**, not the same graph as raw tactical moves.
- The live director selects actionable legal tactical motifs which contribute toward landmarks. Missed landmarks remain in the ledger; they do not disappear.
- Big spots, planned pin attempts, manager calls and interruptions must emit the same typed events used by the main action graph.
- Every event may set up a later callback and may have a credible alternative to avoid dead ends.
- The fixed booked finish is a high-priority constraint and must never be silently overwritten by the planner.
- Plan objects must be plain serialisable data, no closures or executable predicates stored in browser saves.
- Existing active match saves without sheets continue through the legacy path.
- Don't change the game UI or force extra clicks until a vertical slice proves the planning actually affects the live commentary.

## Test cases / first vertical slice

A. Titan v Reverend as above (power vs patient storytelling, clean loss).
B. Juno v Rex (technical underdog vs heavier opponent; legal counter strategy; no impossible lift).
C. Rivalry rematch: one wrestler remembers a blocked finisher, proposes and completes a new counter in the next match.
D. Emergency: injury, cold crowd or time cut forces a credible deviation; the sheet shows what changed.
E. Same performers, booked finish and seed, but detailed / landmark / call-live planning modes produce **distinct plans and tactics**, not just different commentary templates.

Acceptance criteria:

1. Both workers propose, agree/disagree, and can contribute to a revised sheet.
2. Player sees at least three specific, testable commitments in a standard 12-minute match.
3. The simulation attempts only legal plans and explains every meaningful revised/missed landmark.
4. A live manager intervention changes the plan state, not just an odds multiplier.
5. Finish contract always holds unless existing explicit exception rules apply.
6. Save/reload and mobile UI work; the existing match-flow and promo-flow regression suites pass.
7. Human review confirms that having a real sheet makes the match more believable and the managerial choice more engaging.

## Prioritisation

Do **not** expand hundreds of match nodes before this exists. First implement shared event and graph kernel parity; then design worker negotiation; then run a three-match vertical slice in an isolated Graph Lab.

Success is when a player can answer: **What did the wrestlers agree? What actually happened? Why did it change?**
