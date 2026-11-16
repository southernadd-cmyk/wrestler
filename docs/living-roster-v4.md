# THE OFFICE — Living roster v4.0: cast bible

> **The matches are scripted. The people aren't.**

## Status

**Design and starting allocations only.** This is the reviewed specification for the next implementation stage; it is not yet wired into career saves, matchmaking or the portrait system. No changes to the playable 28-person roster are made by this PR.

## Starting population

| Initial status | Existing | Additional | v4.0 target |
| --- | ---: | ---: | ---: |
| Free-agent market | 12 | 8 | 20 |
| Six AI agencies | 13 | 31 | 44 |
| Independent / self-managed | 3 | 13 | 16 |
| **Total** | **28** | **52** | **80** |

The four existing promoters (Dockside, Pulse Underground, North Crown, Grand Union) remain. The three established AI managers retain their identities. Three additional agencies join the world; they are **not** extra player-owned stables. The player remains a five-contract agency owner.

## Six competing agencies

| Manager | Agency | Existing members | New signings | Initial size | Philosophy |
| --- | --- | ---: | ---: | ---: | --- |
| Mo Devlin | Iron Borough | 5 | 4 | 9 | Rough, dependable earners; rewards hard-hitting match reliability |
| Ruth Anwar | Gold Coast | 4 | 4 | 8 | Strong personal stories, redemption arcs and TV-friendly characters |
| Len Mercer | North Circuit | 4 | 4 | 8 | Traditional technical craft, efficient cards and tight discipline |
| Dina Kestrel | Eastbank Athletic | 0 | 6 | 6 | Grassroots workrate, apprenticeships and reliable coaching |
| Pavel Singh | Meridian International | 0 | 6 | 6 | Crossover acts, spectacle and high-upside risks |
| Cleo Kells | Redwood Wrestling Agency | 0 | 7 | 7 | Contracts first, high standards, slow-burn main-event careers |

The budgets, AI recruitment logic and stable-size limits must be redesigned before the cast is activated. A 44-worker AI roster distributed across six managers must not use the old maximum-five agency recruitment shortcut.

## New talent: identity before artwork

Each performer below has a hand-authored motivation, spoken voice, distinct visible appearance, signature finish and starting attributes. The existing 28 characters remain exactly as authored in `assets/js/data.js`. The complete machine-readable data lives in [`living-roster-v4.json`](living-roster-v4.json).

### Eight available free agents
- **Faye Calder — “The Unpaid Debt”** (38, veteran / story). A tour promoter withheld her last fee; she now records every promise on paper. **Wants:** Get a fair main-event contract after a disputed payoff. **Voice:** Dry legal precision; never raises her voice. **Portrait brief:** Black bob, silver ring jacket, small eyebrow scar.
- **Bao Merrick — “The Lockpick”** (25, prospect / technical). A former club judoka who studies opponents' exits before attempting a hold. **Wants:** Earn a reputation as the safest submission specialist. **Voice:** Quiet, concise and demonstrative. **Portrait brief:** Close-cropped black hair, white taped wrists, indigo singlet.
- **Zara Finch — “Sparks”** (21, rookie / spectacle). Skilled in the air but rushes from one high spot to the next. **Wants:** Make a viral moment before she has learned to pace a match. **Voice:** Fast slang with nervous humour. **Portrait brief:** Copper undercut, fluorescent green trim.
- **Miro Lane — “Late Arrival”** (23, rookie / story). Has spent a year filling cancellation spots and knows how to win a cold room. **Wants:** Stop being a last-minute replacement and get a regular slot. **Voice:** Self-deprecating, then unexpectedly heartfelt. **Portrait brief:** Long fringe, worn navy entrance coat.
- **Aisha Moreno — “No Apologies”** (32, star / brawl). A box-office draw who walked away from an agency that kept changing her finishes. **Wants:** Prove she can headline without management interference. **Voice:** Sharp challenges; cuts to the point. **Portrait brief:** Braided hair, scarlet gloves, heavyweight gear.
- **Ellis Quade — “The Pencil”** (22, rookie / technical). Keeps a notebook of every match cue; opponents trust the preparation. **Wants:** Learn to lead a match rather than only follow. **Voice:** Literal, careful and detail-obsessed. **Portrait brief:** Round glasses backstage, neat dark crop, grey gear.
- **Anya Ortez — “Blue Static”** (27, prospect / spectacle). A gifted performer whose spectacular entrances have outpaced her storytelling. **Wants:** Cross from highlights into a meaningful television rivalry. **Voice:** Cool clipped sentences and big visual imagery. **Portrait brief:** Silver-blue streak, asymmetrical blue jacket.
- **Nolan Pike — “North End”** (41, veteran / brawl). A ring-crew veteran whose best skill is getting an inexperienced partner home safe. **Wants:** Earn enough to open a local training school. **Voice:** Measured, practical and protective of rookies. **Portrait brief:** Shaved head, thick beard, green work jacket.

### Thirteen independent workers
- **Ivo Serrano — “The Cartographer”** (36, veteran / technical). Works alone and refuses exclusive deals so he can choose his opponents. **Wants:** Collect respected technical matches across all four promotions. **Voice:** Analytical, calm and exact about sequence. **Portrait brief:** Silver temples, navy singlet, wrist straps.
- **Rina Moss — “Mothlight”** (26, prospect / spectacle). Her graceful spots work best when the crowd understands what is at stake. **Wants:** Build a loyal touring audience without a manager. **Voice:** Dreamy imagery followed by precise match calls. **Portrait brief:** Indigo braid, white moth motif, violet boots.
- **Priya Gale — “Afterimage”** (34, star / story). A respected promo artist who accepts fewer matches in exchange for stronger stories. **Wants:** Protect creative control on important televised programmes. **Voice:** Elegant, cutting and fond of callbacks. **Portrait brief:** Short black curls, silver lapels, midnight gear.
- **Nate Barr — “The Bailiff”** (39, veteran / brawl). Usually booked to enforce somebody else's story; wants his own. **Wants:** Become a dependable title challenger instead of hired muscle. **Voice:** Few words, blunt warnings. **Portrait brief:** Close beard, tan ring coat, leather boots.
- **Cass Rae — “The Wild Card”** (24, prospect / story). Refuses to sign because every booking is a chance to reinvent the act. **Wants:** Turn unpredictable audience reactions into star status. **Voice:** Improvised jokes that sometimes turn hostile. **Portrait brief:** Split black-and-gold hair, card-suit trim.
- **Jun Park — “The Switch”** (28, prospect / technical). Studies finishers so carefully that opponents sometimes change plans to avoid him. **Wants:** Master the counter to each rival's finishing move. **Voice:** Quiet questions and specific tactical answers. **Portrait brief:** Short swept hair, teal jacket, white forearm wraps.
- **Sylvia Rook — “Velvet Hammer”** (37, veteran / brawl). An experienced brawler who treats any unsafe opponent as a personal insult. **Wants:** Find a serious rival who can match her intensity. **Voice:** Understated threats; never boasts. **Portrait brief:** Plum jacket, shaved side, dark gloves.
- **Kofi Hale — “Highwire”** (25, prospect / spectacle). A gifted aerial performer who keeps his schedule open for bigger stages. **Wants:** Earn a main-event opportunity without sacrificing aerial style. **Voice:** Energetic, sincere and sometimes breathless. **Portrait brief:** High flat-top, gold-and-cyan mask accents.
- **Mae Okoro — “Sundown”** (40, veteran / story). A highly respected independent who can make either side of a feud sympathetic. **Wants:** Mentor younger talent while working her final peak seasons. **Voice:** Warm teaching stories with a pointed ending. **Portrait brief:** Close silver curls, burgundy jacket.
- **Theo Voss — “Full Stop”** (35, veteran / technical). A strict mat specialist who stops a match rather than risk a reckless sequence. **Wants:** Protect technical wrestling from empty spectacle. **Voice:** Stiff, precise and openly sceptical. **Portrait brief:** Dark slicked hair, charcoal trunks.
- **Soraya Idris — “Atlas”** (33, star / brawl). Travels between promotions on her terms and never accepts an undisclosed finish. **Wants:** Prove a free agent can command a headline purse. **Voice:** Plain-spoken, commanding and formal. **Portrait brief:** High ponytail, teal-and-bronze power gear.
- **Milo Ember — “The Last Train”** (22, rookie / spectacle). Sleeps between towns, arrives early and takes a risky shortcut when tired. **Wants:** Work a full circuit season without missing a booking. **Voice:** Restless anecdotes from the road. **Portrait brief:** Long auburn hair, patched orange jacket.
- **Winnie March — “The Chemist”** (29, prospect / technical). Plans a series of counters in advance but adapts when her opponent changes pace. **Wants:** Get her first championship challenge on merit. **Voice:** Methodical comparisons and careful jokes. **Portrait brief:** Round spectacles, dark ponytail, violet singlet.

### Iron Borough additions
- **Brontë Hayes — “Breakwater”** (36, veteran / brawl). An experienced worker who can rescue a hard-hitting match that begins to unravel. **Wants:** Become Mo Devlin's most trusted main-event enforcer. **Voice:** Blunt instructions, rarely small talk. **Portrait brief:** Broad shoulders, braided bun, battered blue vest.
- **Gus Marr — “Shift Foreman”** (44, veteran / brawl). Has taken every unglamorous shift on the circuit and remembers who helped him. **Wants:** Build a safer workplace for wrestlers behind the curtain. **Voice:** Gruff mentorship with dry jokes. **Portrait brief:** Grey crew cut, scarred leather jacket.
- **Nikita Rowe — “The Wrecker”** (28, prospect / brawl). Draws a loud reaction but treats rehearsal as an affront to instinct. **Wants:** Get top billing even if it costs stable loyalty. **Voice:** Confrontational, quick to interrupt. **Portrait brief:** Neon-red mohawk, black hand wraps.
- **Jett Harlow — “Sundown Scrap”** (23, rookie / spectacle). Mo signed an aerial rookie to add variety to a stable full of power wrestlers. **Wants:** Get noticed while learning to protect bigger partners. **Voice:** Fidgety and overenthusiastic. **Portrait brief:** Shaggy blond hair, denim ring vest.

### Gold Coast additions
- **Alina Fox — “Silver Lining”** (31, star / story). Ruth trusts her to turn even a losing streak into an audience connection. **Wants:** Carry an emotionally credible championship storyline. **Voice:** Warm, eloquent and deliberate. **Portrait brief:** Copper waves, pearl-white robe.
- **Cedric Bloom — “The Testimony”** (42, veteran / story). A veteran who can make one backstage grievance last six meaningful weeks. **Wants:** Become the voice of younger Gold Coast wrestlers. **Voice:** Measured rhetorical questions. **Portrait brief:** Grey-streaked beard, dark three-piece jacket.
- **Marisol Tide — “Undertow”** (27, prospect / technical). Repeatedly earns cheers for working out of difficult holds rather than showing off. **Wants:** Show that technique can build audience sympathy. **Voice:** Patient, perceptive and faintly sarcastic. **Portrait brief:** Long black curls, turquoise singlet.
- **Felix Orr — “Second Chance”** (22, rookie / story). Ruth signed him after seeing how sincerely he faced a public mistake. **Wants:** Redeem a disastrous first TV appearance. **Voice:** Earnest, apologetic, surprisingly funny. **Portrait brief:** Freckles, red-brown hair, cream jacket.

### North Circuit additions
- **Eira Solis — “Angle of Attack”** (30, star / technical). Treats each bout as a puzzle and resents interference that makes the work look false. **Wants:** Win a prestigious technical showcase without shortcuts. **Voice:** Terse tactical observations. **Portrait brief:** Black cropped hair, slate-blue gear.
- **Gideon Frost — “Deadweight”** (39, veteran / technical). Can stop a showboat's momentum with one believable hold. **Wants:** Pass on matcraft before his knees force a slower schedule. **Voice:** Quiet corrections and patient criticism. **Portrait brief:** Shaved head, silver beard, deep-blue trunks.
- **Vera Cho — “Clinical”** (26, prospect / technical). Her technical sequences are flawless, but she struggles when the crowd wants chaos. **Wants:** Earn a programme against the circuit's most reputed technician. **Voice:** Exact measurements and controlled intensity. **Portrait brief:** Straight dark bob, white-and-black gear.
- **Tomas Keene — “Turncoat”** (27, prospect / story). Len signed a charming tactician whose loyalty depends on where the spotlight goes. **Wants:** Use manager connections to climb the card faster. **Voice:** Polite flattery with an edge. **Portrait brief:** Side-parted hair, silver pinstripe coat.

### Eastbank Athletic
- **Ari Keats — “Nights on Film”** (26, prospect / story). Dina's first signing can make an intimate room care about a match's smallest detail. **Wants:** Turn local gym shows into a recognized regional programme. **Voice:** Observant, paints scenes in words. **Portrait brief:** Long black fringe, faded plum jacket.
- **Tomás Ash — “Southpaw”** (37, veteran / brawl). A former boxer whose insistence on safety sometimes frustrates the ambitious. **Wants:** Train young brawlers to use restraint. **Voice:** Practical, ironic, never theatrical. **Portrait brief:** Salt-and-pepper fade, taped left wrist.
- **Kezia North — “Common Ground”** (23, rookie / technical). A wrestling-school graduate who makes detailed notes about what went wrong. **Wants:** Become a dependable training partner, then a contender. **Voice:** Humble, precise, asks for feedback. **Portrait brief:** Copper braid, moss-green singlet.
- **Dev Hart — “Golden Hour”** (35, star / story). An established draw who took a smaller agency deal to mentor newcomers. **Wants:** Build a stable where the youngest talent can thrive. **Voice:** Reassuring authority with controlled emotion. **Portrait brief:** Dark curls, mustard-yellow coat.
- **Liya Fen — “After Hours”** (25, prospect / spectacle). Her biggest spots are timed to exact musical cues in rehearsals. **Wants:** Prove exciting wrestling and careful preparation can coexist. **Voice:** Relaxed, playful and transparent. **Portrait brief:** Violet highlights, black-and-gold boots.
- **Emmett Briggs — “The Number”** (40, veteran / technical). Teaches the working holds that make spectacular finishes feel earned. **Wants:** Retire with a reputation as the most reliable trainer on the circuit. **Voice:** Dry lists and precise corrections. **Portrait brief:** Grey moustache, fitted indigo trunks.

### Meridian International
- **Nadia Park — “Black Star”** (29, star / spectacle). A high-profile risk-taker who expects promises about exposure to be honoured. **Wants:** Turn a viral wrestling identity into a cross-promotion headline. **Voice:** Confident metaphors and direct crowd challenges. **Portrait brief:** Short black curls, starburst violet gear.
- **Leandro Moya — “Skyline”** (24, prospect / spectacle). The crowd loves his leap; his manager worries about the moments between leaps. **Wants:** Get a highlight on national TV while improving ring psychology. **Voice:** Quick upbeat jokes, impatient replies. **Portrait brief:** Dark curls, magenta-and-teal mask.
- **Iris Vaughan — “Night Shift Doctor”** (38, veteran / technical). A respected technician hired specifically because she knows when a stunt is unsafe. **Wants:** Keep Meridian's risky wrestlers healthy and employed. **Voice:** Calm warnings backed by experience. **Portrait brief:** Silver pixie cut, plum wrist tape.
- **Kellan Ryu — “On the Wire”** (21, rookie / spectacle). Pavel sees huge upside, but almost every senior wrestler wants him to slow down. **Wants:** Win a dazzling crowd reaction without learning patience first. **Voice:** Fast, excitable one-liners. **Portrait brief:** Bleached top, neon-cyan mask accents.
- **Ayla Bay — “Golden Hourglass”** (27, prospect / story). Pavel's unlikely storyteller is often asked to hold together an over-ambitious card. **Wants:** Prove a patient story can succeed in a spectacular stable. **Voice:** Poetic metaphors, disciplined callbacks. **Portrait brief:** Chestnut waves, gold jacket, star motif.
- **Sasha Wynn — “Starlight”** (26, prospect / spectacle). Can sense when to pause for the audience; she sometimes resents rushed match sheets. **Wants:** Build a fanbase that follows the act beyond highlight clips. **Voice:** Witty, responsive and crowd-conscious. **Portrait brief:** White-blond bob, violet ring cape.

### Redwood Wrestling Agency
- **Morgan Alder — “Cut Glass”** (34, star / story). Cleo Kells sees a profitable headline act; Morgan sees a contract to renegotiate. **Wants:** Secure premium booking positions without conceding creative control. **Voice:** Cool legalistic threats, never jokes. **Portrait brief:** Slick black hair, steel-grey coat.
- **Noelle Stroud — “The Magistrate”** (41, veteran / technical). Will protect an opponent's safety, even when it costs her a lucrative booking. **Wants:** Retire with an undefeated reputation for match discipline. **Voice:** Formally structured arguments. **Portrait brief:** Grey streak, burgundy jacket, black ring boots.
- **Ash Carter — “No Quarter”** (28, prospect / brawl). A reckless power wrestler who tolerates management only while the push continues. **Wants:** Make a feared enforcer persona into genuine main-event status. **Voice:** Minimalist challenges, loaded silences. **Portrait brief:** Rugged jawline, matte-black shoulder pads.
- **Zane Varley — “Brick by Brick”** (24, rookie / brawl). Cleo signed him for his work ethic rather than current drawing power. **Wants:** Develop into a credible big-match worker. **Voice:** Self-effacing, eager to learn. **Portrait brief:** Broad frame, blond buzzcut, green singlet.
- **Elodie Quinn — “The Verdict”** (33, star / story). A brilliant talker who remembers precisely who promised to book her higher. **Wants:** Turn a series of protected losses into a championship programme. **Voice:** Slow confident questions and razor-sharp responses. **Portrait brief:** Red pixie cut, ivory lapels.
- **Bashir Lowe — “Roadwork”** (43, veteran / brawl). A durable veteran who is willing to lose if a youngster earns the moment. **Wants:** Train his eventual successor and settle his final serious feud. **Voice:** Blunt warm mentorship. **Portrait brief:** Close-cropped grey hair, navy work vest.
- **Cleo Watt — “The Red Line”** (29, prospect / technical). Asks for a clear plan and can detect immediately when someone is not following it. **Wants:** Win a long technical rivalry without political favours. **Voice:** Direct, analytic and sardonic. **Portrait brief:** Tight dark curls, crimson-and-silver gear.

## Engineering contract for the next PR

1. Centralize character templates without erasing the separate **career state** for signings, independent status, injury, finances or grudges.
2. Fix the `TALENT` versus `FOES` split: opponent-only templates currently lack fields required of a player-signable worker. Maintain legacy IDs and existing match mechanics.
3. Preserve the distinct promotion card rankings; allocate new people to ladders through career-state initialization and a once-only migration, not static global lists.
4. Give each of the six AI agencies a contract ledger, wage exposure and clear hiring policy; prevent duplicate ownership and ensure a free agent genuinely leaves the market on signing.
5. Grow world updates from the existing deterministic `territory.evolve()` hook; record changes as events that can be shown in the inbox and remembered in future decisions.
6. Seed identities and motives into conversations instead of introducing arbitrary disputes; start with the highest-value existing character arcs.
7. Only once the roster is integrated and tested, generate a transparent-background 80-wrestler atlas, plus four distinct booker images. Do not splice regenerated characters into the old 4×8 atlas.

## Release gates

- Exactly 80 unique IDs (28 preserved + 52 new) in new careers; initial distribution 20 market / 44 AI / 16 independent.
- Every wrestler can resolve to an opponent, a match profile and a visible portrait without breaking saved careers.
- A previously played save reopens with the same player roster, history, promoter standings, contracts and pending matches.
- One migration run changes only the intended additions; repeating load produces no extra workers or duplicate ownership.
- Headless career and existing regression suites green; desktop and mobile manual flows exercised.
- Side-by-side playtests show distinct character responses and meaningful cross-season career consequences.

## What this does NOT do

No live roster activation, new images, additional promotions, gameplay changes or release claim. This is the casting and architecture contract that makes those changes safe and measurable.
