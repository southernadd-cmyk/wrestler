/* THE OFFICE — deterministic move catalogue and connection builder.
   Extracted from match-graph.js without changing definitions, insertion order,
   curated links, weights or narration. It does not read match state or RNG. */
(function(root){'use strict';
function build(A,introducedPhase9,TECHNIQUE_PILOT,TECHNIQUE_EXPANSION,TECHNIQUE_TRANCHE2,TECHNIQUE_DEPTH,TECHNIQUE_CHAINS,TECHNIQUE_AUDIT24_LINKS){
 const node=(id,text,opts={})=>{A[id]={id,lines:Array.isArray(text)?text:[text],requires:opts.requires||'standing',next:opts.next||[],zone:opts.zone||'standing',down:opts.down||null,
     reverse:!!opts.reverse,kind:opts.kind||'play',focus:opts.focus||0,crowd:opts.crowd||0,weight:opts.weight||1,styles:opts.styles||null,cost:opts.cost??null,lift:opts.lift??null,
      part:opts.part||null,after:opts.after||0,risk:!!opts.risk,nearfall:!!opts.nearfall,family:opts.family||null,name:opts.name||null,
      counterOf:opts.counterOf||null,blockOf:opts.blockOf||null,blockLift:opts.blockLift??null,agile:!!opts.agile};};
 const e=(id,w=1)=>[id,w];
 // Ring grappling. Transitions are drawn from common observed chain-wrestling sequences.
 node('circle','{A} and {D} circle, each testing the distance before committing.',{next:[e('lockup',5),e('probe_strike',2),e('waistlock',2),e('taunt',1)]});
 node('taunt','{A} spreads their arms, daring {D} to step forward. {D} refuses to rush in.',{next:[e('lockup',4),e('cheap_shot',2),e('probe_strike',3)]});
 node('lockup','Collar-and-elbow. {A} drives forward and {D} fights to stay square.',{next:[e('headlock',4),e('wristlock',4),e('corner_push',2),e('waistlock',2),e('clean_break',1)]});
 node('headlock','{A} takes a side headlock, forcing {D} to carry the weight.',{next:[e('shove_ropes',4),e('headlock_takeover',3),e('headlock_escape',3)]});
 node('shove_ropes','{D} pushes {A} off the ropes to break the headlock. {A} rebounds back.',{next:[e('shoulder_tackle',4),e('duck_rebound',3),e('counter_strike',2)]});
 node('headlock_takeover','{A} uses the headlock to take {D} down onto the mat.',{next:[e('mat_hold',4),e('headlock_escape',3),e('armbar_roll',2),e('mat_scramble',2)],zone:'mat',down:'d'});
 node('headlock_escape','{D} bridges, rolls through the pressure and turns the headlock into a counter!',{requires:'any',reverse:true,next:[e('waistlock',3),e('mat_scramble',2),e('arm_drag',2)]});
 node('wristlock','{A} catches the wrist and turns it over, keeping {D} close.',{next:[e('arm_wringer',4),e('wrist_escape',4),e('hammerlock',2)]});
 node('arm_wringer','{A} twists {D}’s arm and steps across, making the shoulder work.',{focus:1,next:[e('wrist_escape',4),e('arm_drag',3),e('hammerlock',2)]});
 node('wrist_escape','{D} rolls under the trapped arm, reverses the wristlock and takes a new grip.',{reverse:true,next:[e('wristlock',3),e('arm_drag',3),e('hammerlock',2)]});
 node('hammerlock','{A} slides behind into a hammerlock and controls {D}’s arm.',{focus:1,next:[e('elbow_escape',4),e('mat_takedown',3),e('clean_break',1)]});
 node('elbow_escape','{D} throws a back elbow, slips the hammerlock and turns to face {A}.',{reverse:true,next:[e('probe_strike',4),e('waistlock',2),e('snap_suplex',2)]});
 node('waistlock','{A} gets behind with a waistlock. {D} widens their stance to resist.',{next:[e('mat_takedown',4),e('waist_escape',4),e('snap_suplex',2)]});
 node('waist_escape','{D} pries the fingers apart, spins through and takes the back!',{reverse:true,next:[e('mat_takedown',3),e('waistlock',3),e('counter_rollup',2)]});
 node('mat_takedown','{A} trips {D} cleanly and follows to the mat before {D} can regain a base.',{zone:'mat',down:'d',next:[e('mat_hold',4),e('target_hold',3),e('mat_scramble',2)]});
 node('arm_drag','{A} uses the momentum to snap {D} over with an arm drag.',{zone:'mat',down:'d',next:[e('mat_hold',2),e('stand_reset',4),e('early_cover',1)]});
 node('clean_break','The referee calls for a clean break. {A} releases and steps away.',{next:[e('circle',4),e('cheap_shot',2),e('probe_strike',2)]});
 node('corner_push','{A} drives {D} into a corner; the referee orders the break.',{zone:'corner',next:[e('corner_break',3),e('corner_strikes',3),e('corner_knee',2),e('cheap_shot',2)]});
 node('corner_break','{A} backs out of the corner. {D} cautiously steps forward.',{requires:'corner',next:[e('circle',3),e('probe_strike',2)]});
 // Striking, Irish whips, ring positioning.
 node('probe_strike','{A} throws a measuring forearm. {D} stays balanced and watches for the next.',{next:[e('strike_trade',4),e('counter_strike',3),e('cheap_shot',1),e('corner_whip',2)]});
 node('strike_trade','{A} lands a forearm. {D} returns one. Both stay on their feet.',{next:[e('strike_trade',2),e('counter_strike',3),e('clothesline',2),e('corner_whip',2),e('outside_toss',1)]});
 node('counter_strike','{D} ducks the next strike and answers with a sharp elbow!',{reverse:true,next:[e('clothesline',3),e('corner_whip',2),e('snap_suplex',2)]});
 node('cheap_shot','{A} catches {D} with a forearm on the break while the referee is looking away.',{crowd:-1,next:[e('corner_strikes',3),e('target_strike',3),e('clothesline',2)]});
 node('corner_strikes','{A} traps {D} against the turnbuckles and drives in two short forearms.',{requires:'corner',zone:'corner',next:[e('corner_whip',4),e('corner_escape',3),e('corner_charge',2),e('corner_knee',3)]});
 node('corner_whip','{A} whips {D} across the ring towards the opposite turnbuckles.',{zone:'corner',next:[e('corner_charge',4),e('corner_escape',4),e('corner_strikes',2)]});
 node('corner_charge','{A} charges the corner with a running attack. {D} braces for impact.',{requires:'corner',zone:'corner',next:[e('corner_escape',3),e('clothesline',2),e('snap_suplex',1)]});
 node('corner_escape','{D} slips out of the corner as {A} charges in, leaving {A} to hit the turnbuckles!',{requires:'corner',reverse:true,next:[e('clothesline',3),e('strike_trade',2),e('corner_whip',2)]});
 node('rope_run','{A} sends {D} towards the ropes; {D} rebounds into the centre.',{next:[e('shoulder_tackle',2),e('duck_rebound',3),e('clothesline',4)]});
 node('duck_rebound','{D} ducks the attempted lariat, rebounds again and changes direction.',{reverse:true,next:[e('clothesline',3),e('shoulder_tackle',2),e('snap_suplex',1)]});
 node('shoulder_tackle','{A} collides with {D} off the ropes and knocks {D} down.',{zone:'mat',down:'d',next:[e('stand_reset',4),e('early_cover',2),e('mat_hold',2)]});
 node('clothesline','{A} catches {D} with a running clothesline. {D} crashes onto the mat.',{zone:'mat',down:'d',next:[e('cover',3),e('mat_hold',2),e('stand_reset',3)]});
 node('snap_suplex','{A} secures the head and arm, lifts {D} and lands a snap suplex.',{zone:'mat',down:'d',next:[e('cover',3),e('target_hold',3),e('stand_reset',2)]});
 // Mat offence and selling must be resolved before another standing exchange.
 node('mat_hold','{A} stays on top, pressing {D} against the canvas to stop an escape.',{requires:'mat',zone:'mat',down:'d',next:[e('target_hold',3),e('mat_scramble',3),e('rope_crawl',2),e('armbar_roll',2),e('grounded_switch',2),e('early_cover',1),e('submission_set',1),e('dramatic_sell',1)]});
 node('target_hold','{A} isolates {D}’s {part}, applying steady pressure with the referee watching.',{requires:'mat',zone:'mat',down:'d',focus:2,next:[e('rope_crawl',3),e('mat_scramble',2),e('armbar_roll',3),e('handstand_escape',2),e('hope_elbows',3)]});
 node('target_strike','{A} drives a short strike into {D}’s {part}, then drags {D} away from the ropes.',{focus:2,zone:'mat',down:'d',next:[e('target_hold',3),e('hope_elbows',3),e('rope_crawl',2)]});
 node('rope_crawl','{D} drags themselves towards the bottom rope while {A} keeps the pressure on.',{requires:'mat',zone:'mat',down:'d',next:[e('rope_break',4),e('hope_elbows',2)]});
 node('rope_break','{D} catches the bottom rope. The referee orders {A} to break the hold, and {A} releases.',{requires:'mat',zone:'standing',down:null,next:[e('stand_reset',4),e('cheap_shot',1)]});
 node('mat_scramble','{D} twists underneath and uses the leverage to reverse the hold.',{requires:'mat',reverse:true,zone:'mat',down:'d',next:[e('mat_hold',3),e('stand_reset',3),e('counter_rollup',2)]});
 node('hope_elbows','{D} fights towards their knees and throws two elbows, trying to get free.',{requires:'mat',zone:'standing',down:null,next:[e('hope_cutoff',4),e('counter_strike',2),e('strike_trade',2)]});
 node('hope_cutoff','{A} intercepts the escape with a knee to {D}’s {part}; the comeback is stopped.',{focus:1,zone:'mat',down:'d',next:[e('target_hold',3),e('mat_hold',2),e('stand_reset',2)]});
 node('stand_reset','{D} rolls clear and uses the ropes to rise. {A} gives ground to avoid a counter.',{requires:'mat',zone:'standing',down:null,next:[e('lockup',2),e('strike_trade',3),e('corner_whip',2),e('rope_run',2)]});
 // High-risk branches include genuine preparation, payoff or failure.
 node('top_climb','{A} drops {D} with a strike, then climbs the turnbuckles, checking their footing.',{requires:'standing',zone:'top',down:'d',next:[e('aerial_attack',5),e('aerial_counter',3),e('missile_dropkick',3),e('high_crossbody',3),e('top_rope_hesitation',1)]});
 node('aerial_attack','{A} launches from the turnbuckle and connects with a diving elbow!',{requires:'top',zone:'mat',down:'d',crowd:5,next:[e('cover',5),e('stand_reset',2)]});
 node('aerial_counter','{D} rolls out of the way! {A} crashes onto the canvas and loses the advantage.',{requires:'top',reverse:true,zone:'mat',down:'d',crowd:3,next:[e('cover',2),e('mat_hold',2),e('stand_reset',3)]});
 // Ringside branches must return inside before a pin or submission.
 node('outside_toss','{A} sends {D} over the ropes onto the floor. The referee starts counting.',{zone:'outside',down:null,next:[e('floor_brawl',4),e('apron_stand',3),e('ramp_approach',1),e('roll_inside',2)]});
 node('os_ropes_backdrop','{A} catches {D} at the ropes and sends them over with a high backdrop to the floor!',{
  requires:'standing',zone:'outside',risk:true,after:.5,cost:3.2,crowd:5,
  next:[e('floor_brawl',3),e('apron_stand',2),e('roll_inside',4)]});
 node('floor_brawl','{A} follows {D} to the floor and throws a forearm near the barricade.',{requires:'outside',zone:'outside',next:[e('floor_counter',3),e('apron_stand',3),e('ramp_approach',1),e('roll_inside',4)]});
 node('floor_counter','{D} blocks the next shot and drives {A} backwards into the barricade!',{requires:'outside',reverse:true,zone:'outside',next:[e('floor_brawl',3),e('ramp_approach',1),e('roll_inside',4)]});
 node('apron_stand','{A} pulls {D} towards the apron, where both struggle for position.',{requires:'outside',zone:'outside',next:[e('roll_inside',4),e('floor_counter',3),e('os_apron_ddt',1)]});
 node('ramp_approach','{A} steers {D} away from the ring and towards the entrance ramp, taking hold at the edge of the ramp.',{requires:'outside',zone:'outside',next:[e('os_ramp_suplex',3),e('floor_brawl',1),e('roll_inside',2)]});
 node('roll_inside','{A} slides {D} under the bottom rope and follows. The referee breaks the count.',{requires:'outside',zone:'standing',down:null,next:[e('strike_trade',3),e('corner_whip',2),e('snap_suplex',2)]});
 // Pin and submission resolution are events, not random commentary.
 node('early_cover','{A} hooks a leg; {D} kicks free before the referee reaches two.',{requires:'mat',zone:'mat',down:'d',next:[e('stand_reset',4),e('mat_hold',2)]});
 node('cover','{A} hooks the far leg after the impact. The referee drops to count.',{requires:'mat',zone:'mat',down:'d',next:[e('near_kickout',5)]});
 node('near_kickout','ONE! TWO! {D} gets a shoulder up just before three!',{requires:'mat',zone:'mat',down:'d',crowd:6,next:[e('stand_reset',3),e('mat_hold',3),e('counter_rollup',1)]});
 node('counter_rollup','{D} catches an opening and rolls {A} over! One, two — {A} escapes!',{requires:'mat',reverse:true,zone:'standing',down:null,crowd:3,next:[e('strike_trade',3),e('lockup',2)]});
 node('submission_set','{A} traps {D} on the canvas, attacking the damaged {part} in a tight submission.',{requires:'mat',zone:'mat',down:'d',focus:2,next:[e('submission_ropes',4),e('submission_roll',3)]});
 node('submission_ropes','{D} crawls to the bottom rope and grabs it. The referee forces {A} to release.',{requires:'mat',zone:'standing',down:null,crowd:4,next:[e('stand_reset',2),e('strike_trade',2)]});
 node('submission_roll','{D} shifts their weight, rolls through the hold and breaks the grip.',{requires:'mat',reverse:true,zone:'standing',down:null,crowd:3,next:[e('strike_trade',3),e('corner_whip',2)]});
 // Finish tease nodes may fail: only the booked end actually terminates the match.
 node('finish_tease','{A} reaches for the finishing hold, but {D} fights the grip before it is secured.',{zone:'standing',down:null,next:[e('finish_counter',4),e('counter_strike',2),e('snap_suplex',2)]});
 node('finish_counter','{D} slips out of the finisher setup and catches {A} with an elbow!',{reverse:true,zone:'standing',down:null,next:[e('clothesline',3),e('finish_tease',2),e('corner_whip',2)]});
 node('dramatic_sell','{D} rolls towards the ropes, clutching the {part}. {A} watches for the next counter.',{requires:'mat',zone:'standing',down:null,next:[e('finish_tease',3),e('strike_trade',2)]});


 node('grapple_trip','{A} shoots for the leg, catches {D} off balance and drives them onto the mat.',{cost:1.1,zone:'mat',down:'d',next:[e('target_hold',5),e('mat_hold',3),e('mat_scramble',2)]});
 node('power_spinebuster','{A} catches {D} coming forward and plants them with a heavy spinebuster!',{cost:3.5,lift:30,zone:'mat',down:'d',crowd:2,next:[e('cover',3),e('mat_hold',2),e('stand_reset',3)]});
 node('springboard_rise','{A} sends {D} down and steps onto the middle rope, checking their balance.',{cost:1.8,requires:'standing',zone:'top',down:'d',next:[e('springboard_strike',5),e('springboard_evaded',3),e('missile_dropkick',2),e('top_rope_hesitation',2)]});
 node('springboard_strike','{A} launches from the ropes and lands a springboard crossbody on {D}!',{cost:3.2,requires:'top',zone:'mat',down:'d',crowd:4,next:[e('cover',4),e('stand_reset',2)]});
 node('springboard_evaded','{D} rolls clear! {A} crashes into the canvas and {D} takes control.',{requires:'top',reverse:true,zone:'mat',down:'d',crowd:2,next:[e('mat_hold',2),e('cover',2),e('stand_reset',3)]});
 node('crowd_pose','{A} stops to play to the crowd. {D} watches, looking for an opening.',{cost:-0.7,next:[e('cheap_shot',2),e('counter_strike',3),e('probe_strike',3),e('lockup',2)]});
 node('catch_breath','{A} steps away and catches a breath while {D} regroups.',{cost:-5.5,next:[e('lockup',3),e('probe_strike',3),e('counter_strike',2)]});

 // v3.1 connected action motifs: setup -> vulnerability -> counter -> payoff.
 // Each original line is conditioned by physical ring position and control.
 // TECHNICAL: a deliberate limb attack has multiple credible counter-routes.
 node('collar_snap','{A} snaps {D} into the clinch, searching for a grip rather than forcing a throw.',{next:[e('wristlock',3),e('ankle_pick',2),e('hip_toss',2)]});
 node('ankle_pick','{A} changes levels and catches {D} by the ankle, dragging them down.',{zone:'mat',down:'d',cost:1.2,next:[e('leg_wrench',4),e('grapevine',2),e('mat_scramble',2)]});
 node('leg_wrench','{A} folds {D}’s leg under pressure, making every attempt to stand more expensive.',{requires:'mat',zone:'mat',down:'d',focus:1,cost:1.5,next:[e('grapevine',3),e('rope_crawl',2),e('handstand_escape',1),e('mat_scramble',2)]});
 node('grapevine','{A} hooks both legs to trap {D} and asks the referee to check for a submission.',{requires:'mat',zone:'mat',down:'d',cost:1.5,next:[e('submission_ropes',3),e('mat_scramble',2),e('leveraged_bridge',2)]});
 node('hip_toss','{A} turns the locked arms into a hip toss that sends {D} to the canvas.',{zone:'mat',down:'d',cost:1.5,next:[e('mat_hold',3),e('early_cover',2),e('leveraged_bridge',2),e('stand_reset',2)]});
 node('leveraged_bridge','{D} arches out of the hold and reverses the leverage, nearly catching {A} flat!',{requires:'mat',reverse:true,zone:'mat',down:'d',cost:1.2,crowd:2,next:[e('early_cover',2),e('mat_scramble',2),e('stand_reset',3)]});
 node('armbar_roll','{D} rolls towards the trapped arm, reversing the pressure before {A} can cinch it in.',{requires:'mat',reverse:true,zone:'mat',down:'d',cost:1,next:[e('target_hold',2),e('rope_break',2),e('stand_reset',3)]});
 node('grounded_switch','{A} shifts their hips to switch the hold without ever letting {D} back to their feet.',{requires:'mat',zone:'mat',down:'d',cost:1.2,next:[e('armbar_roll',2),e('grapevine',2),e('mat_hold',3)]});
 // POWER/BRAWLING: strikes build real consequences, but no free power lift.
 node('stiff_forearm','{A} fires a stiff forearm. {D} takes a step back and answers with a glare.',{cost:1.3,next:[e('rolling_elbow',2),e('body_shot',3),e('heavy_slam',1),e('counter_strike',3)]});
 node('body_shot','{A} drives a short punch into {D}’s ribs, looking to take away the next breath.',{focus:1,cost:1.0,next:[e('rib_knee',2),e('heavy_slam',2),e('gutbuster',2),e('corner_whip',2),e('strike_trade',3)]});
 node('rolling_elbow','{A} spins through and catches {D} with an elbow that stops the exchange cold.',{cost:2.2,crowd:2,next:[e('short_arm_lariat',2),e('counter_strike',3),e('snap_suplex',2)]});
 node('short_arm_lariat','{A} pulls {D} back by the wrist and drops them with a short-arm lariat.',{zone:'mat',down:'d',cost:2.6,crowd:2,next:[e('cover',2),e('dramatic_sell',2),e('stand_reset',3)]});
 node('rib_knee','{A} drops a knee against {D}’s ribs and keeps the pressure on.',{requires:'mat',zone:'mat',down:'d',focus:1,cost:1.5,next:[e('target_hold',3),e('grounded_switch',2),e('mat_scramble',2)]});
 node('gutbuster','{A} lifts {D} across the knee for a gutbuster, targeting the midsection.',{cost:3.0,lift:22,focus:1,zone:'mat',down:'d',next:[e('rib_knee',3),e('cover',2),e('stand_reset',2)]});
 node('heavy_slam','{A} controls the waist and slams {D} down with a heavy body slam.',{cost:3.2,lift:28,zone:'mat',down:'d',crowd:2,next:[e('near_kickout',1),e('mat_hold',2),e('stand_reset',3)]});
 node('corner_knee','{A} pins {D} to the turnbuckles and digs a knee into the body as the referee counts.',{requires:'corner',zone:'corner',focus:1,cost:1.5,next:[e('corner_break',2),e('corner_escape',2),e('corner_whip',2)]});
 // HIGH-FLYING: a spectacular move needs spatial setup and can be countered.
 node('springboard_feint','{A} touches the second rope, drawing {D} towards the expected leap.',{cost:1,next:[e('rope_rebound',3),e('duck_rebound',2),e('springboard_rise',2)]});
 node('rope_rebound','{A} changes direction twice off the ropes. {D} is a step behind.',{cost:1.3,next:[e('running_headscissors',2),e('rebound_counter',3),e('shoulder_tackle',2)]});
 node('running_headscissors','{A} catches the rushing {D} with headscissors and sends them sprawling.',{zone:'mat',down:'d',cost:2.1,crowd:2,next:[e('stand_reset',3),e('early_cover',2),e('mat_scramble',2)]});
 node('rebound_counter','{D} reads the next rope run, sidesteps and sends {A} stumbling into open space!',{reverse:true,cost:1.0,next:[e('clothesline',2),e('rope_run',2),e('strike_trade',2)]});
 node('missile_dropkick','{A} launches from the top rope with a missile dropkick. {D} goes down hard!',{requires:'top',zone:'mat',down:'d',cost:3.8,crowd:4,next:[e('cover',3),e('stand_reset',3)]});
 node('high_crossbody','{A} dives from the top rope with a crossbody, risking everything on the landing.',{requires:'top',zone:'mat',down:'d',cost:3.9,crowd:3,next:[e('cover',3),e('near_kickout',1),e('stand_reset',3)]});
 node('top_rope_hesitation','{A} hesitates on the top rope as {D} rolls out of position. The moment has gone.',{requires:'top',zone:'standing',cost:-.8,next:[e('circle',3),e('counter_strike',2)]});
 node('handstand_escape','{D} kicks up through a handstand and escapes the grip before {A} can trap the arm.',{requires:'mat',reverse:true,zone:'standing',cost:1.7,crowd:2,next:[e('rope_rebound',2),e('circle',3)]});
 // DRAMA: crowd sympathy and expectation change how a tactic lands.
 node('false_handshake','{A} offers a handshake, but keeps one eye on the referee and the next opening.',{next:[e('clean_break',2),e('cheap_shot',3),e('opponent_study',2)]});
 node('opponent_study','{A} waits for {D} to show the next attack. Neither wants to reveal their plan.',{cost:-.5,next:[e('last_second_counter',2),e('baited_charge',3),e('lockup',2),e('probe_strike',2)]});
 node('last_second_counter','{D} recognises the setup at the final instant and turns it into a counter!',{reverse:true,crowd:3,next:[e('counter_strike',3),e('grapple_trip',2),e('rope_rebound',2)]});
 node('dramatic_rally','{A} staggers upright and refuses to stay down. The crowd senses one last rally.',{crowd:2,cost:1.3,next:[e('clothesline',3),e('last_second_counter',2),e('finish_tease',2)]});
 node('baited_charge','{A} invites the charge and deliberately leaves a gap near the turnbuckle.',{next:[e('counter_strike',3),e('corner_whip',3),e('last_second_counter',2)]});
 node('quiet_reversal','{D} calmly steps around the attack and takes control before anyone sees it coming.',{reverse:true,cost:.8,next:[e('wristlock',2),e('counter_strike',2),e('opponent_study',2)]});

 /* v3.3 MOVE CATALOG — ten times the tactical vocabulary, built from authored move families.
    Every move is an original one-line description of a generic, widely used wrestling technique.
    Each family states where the move can start (position), where it leaves both wrestlers,
    which setups lead into it, what can follow, and how it fails. The physical guards in
    isValid() (position, stamina, lift capacity, match timing, body-part logic) stay authoritative.
    Wiring is computed with a fixed string hash: the graph is identical on every load. */
 const CAT=(function buildCatalog(){
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
  const STY={T:'Technical',B:'Brawl',S:'Spectacle',Y:'Story'};
  const sty=s=>s?s.split('').map(c=>STY[c]):null;
  // Family: requires/zone/down/cost/lift/crowd/focus/part defaults; from = setups that lead in;
  // next = follow-ups; link = cross-family follow-ups [family,count]; rev/blk = failure modes.
  const F={
   suplex:{requires:'standing',zone:'mat',down:'d',cost:2.6,lift:32,crowd:2,part:'back',styles:'TB',
    from:['lockup','waistlock','collar_snap','strike_trade','counter_strike','front_facelock','body_shot','stiff_forearm','go_behind','knuckle_lock'],
    next:[['cover',2],['mat_hold',2],['stand_reset',3],['target_hold',1]],link:[['ground',2],['submission',1],['pin',0]],
    rev:{lines:['{D} blocks the {name}, slips down the back and catches {A} with a suplex of their own!','{D} floats over on the {name} attempt, lands on both feet and spins {A} into a waistlock takedown!','{D} knees out of the {name} and drops {A} with a quick snapmare!'],zone:'mat',down:'d',cost:1.8,crowd:3,next:[['mat_hold',2],['stand_reset',3],['cover',1]]},
    blk:{lines:['{D} hooks a leg and blocks the {name}. {A} keeps hold and resets the grip.','{D} drops their weight, and {A} cannot lift them for the {name}.','{A} tries for the {name}, but {D} plants their feet and refuses to go up.'],next:[['strike_trade',2],['knee_strike_block',1]]},
    moves:[
     ['sx_vertical','vertical suplex','{A} hooks the head, lifts {D} straight up and drops back with a vertical suplex.',{}],
     ['sx_deadlift_bridge','deadlift bridging suplex','{A} lifts {D} from a dead stop into a bridging suplex, keeping the shoulders trapped!',{cost:4,lift:14,crowd:6,after:.55,risk:1,styles:'T'}],
     ['sx_delayed','delayed vertical suplex','{A} hoists {D} upside down and holds them there… and holds them… before finally dropping back!',{cost:4,lift:22,crowd:5,after:.3,styles:'BY'}],
     ['sx_belly_belly','belly-to-belly suplex','{A} locks the body and launches {D} overhead with a belly-to-belly suplex!',{crowd:3}],
     ['sx_belly_back','belly-to-back suplex','{A} scoops {D} up and falls backwards with a belly-to-back suplex.',{}],
     ['sx_northern','northern lights suplex','{A} turns {D} over with a northern lights suplex and keeps the bridge for a pin attempt.',{after:.35,next:[['near_kickout',2]],styles:'T'}],
     ['sx_fisherman','fisherman suplex','{A} hooks a leg, lifts and bridges with a fisherman suplex.',{after:.4,next:[['near_kickout',2]],styles:'T'}],
     ['sx_exploder','exploder suplex','{A} hooks a leg and throws {D} overhead with an exploder suplex!',{cost:3,crowd:3,lift:26}],
     ['sx_german','German suplex','{A} locks the waist and arches {D} over with a German suplex!',{from:['waistlock','go_behind','waist_escape','standing_switch'],crowd:3,lift:28}],
     ['sx_german_release','release German suplex','{A} lets go at the top of a German suplex and {D} lands high on the shoulders!',{from:['waistlock','go_behind','standing_switch'],cost:3.3,crowd:4,after:.45,risk:1,lift:24}],
     ['sx_rolling_german','rolling German suplexes','{A} rolls through one German suplex, then a second, then a third!',{from:['waistlock','go_behind'],cost:5,crowd:5,after:.5,lift:24,styles:'TB'}],
     ['sx_dragon','dragon suplex','{A} applies a full nelson and bridges {D} over with a dragon suplex!',{from:['go_behind','waistlock'],cost:3.4,crowd:4,after:.55,risk:1,part:'neck',next:[['near_kickout',2]],styles:'TS'}],
     ['sx_tiger','tiger suplex','{A} hooks both arms from behind and bridges {D} with a tiger suplex!',{from:['go_behind','waistlock'],cost:3.6,crowd:5,after:.65,risk:1,part:'neck',next:[['near_kickout',3]]}],
     ['sx_double_underhook','double underhook suplex','{A} hooks both of {D}’s arms and turns them over with a double underhook suplex.',{from:['front_facelock','lockup']}],
     ['sx_side','side suplex','{A} gets underneath {D}’s arm and drops sideways with a side suplex.',{}],
     ['sx_brainbuster','brainbuster','{A} lifts {D} vertically and drops down, bringing {D}’s head into the mat with a brainbuster!',{from:['front_facelock'],cost:3.6,lift:20,crowd:5,after:.6,risk:1,part:'neck'}],
     ['sx_gutwrench','gutwrench suplex','{A} wraps both arms around {D}’s midsection and flips {D} over with a gutwrench suplex.',{part:'ribs',cost:3,lift:22,styles:'B'}],
     ['sx_overhead','overhead belly-to-belly','{A} explodes upwards and throws {D} clean across the ring with an overhead belly-to-belly!',{cost:3.4,crowd:4,lift:24,styles:'B'}],
     ['sx_butterfly','butterfly suplex','{A} hooks {D}’s arms in a butterfly lock and suplexes them.',{from:['front_facelock'],styles:'T'}],
     ['sx_tbone','T-bone suplex','{A} scoops {D} from the side and throws them with a T-bone suplex.',{cost:3,crowd:3,lift:26,styles:'B'}],
     ['sx_snap_ddt','snap suplex into a cover','{A} drops {D} with a quick snap suplex and rolls straight into a cover.',{after:.58,next:[['near_kickout',3]]}],
     ['sx_cradle','cradle suplex','{A} cradles {D}’s leg and head and drops them with a cradle suplex.',{after:.4,styles:'T',next:[['near_kickout',2]]}],
     ['sx_half_nelson','half-nelson suplex','{A} sinks in a half nelson and throws {D} overhead with a half-nelson suplex.',{from:['go_behind','waistlock'],cost:3.4,crowd:4,after:.6,risk:1,part:'neck'}],
     ['sx_saito','back suplex','{A} wraps the waist from behind and drops backwards, landing {D} on the upper back.',{from:['go_behind','waistlock'],cost:3,crowd:3,lift:26}],
     ['sx_falcon_arrow','falcon arrow','{A} lifts {D} for a suplex, flips them over and sits out with a falcon arrow!',{cost:3.6,crowd:5,after:.6,lift:22,risk:1,next:[['near_kickout',3]]}]
    ]},
   power:{requires:'standing',zone:'mat',down:'d',cost:3,lift:28,crowd:2,part:'back',styles:'B',
    from:['lockup','strike_trade','body_shot','rope_run','rope_rebound','stiff_forearm','counter_strike','knuckle_lock','duck_rebound','corner_escape'],
    next:[['cover',2],['mat_hold',2],['stand_reset',3]],link:[['ground',2],['submission',1]],
    rev:{lines:['{D} slips out the back of the {name} and shoves {A} into the ropes!','{D} wriggles free of the {name}, lands behind {A} and chops the legs out!','{D} turns the {name} attempt into a desperation DDT!'],zone:'mat',down:'d',cost:1.6,crowd:3,next:[['mat_hold',2],['stand_reset',3],['strike_trade',1]]},
    blk:{lines:['{A} cannot get {D} up for the {name}. {D} is simply too heavy to lift from there.','{D} fights out of the {name} and backs away into the ropes.','{A} gets {D} halfway up for the {name}, but has to put them down.'],next:[['strike_trade',2],['body_shot',1]]},
    moves:[
     ['pw_body_slam','body slam','{A} scoops {D} up and slams them to the canvas.',{cost:2.2,lift:34}],
     ['pw_scoop_powerslam','scoop powerslam','{A} scoops {D} and falls forward with a powerslam!',{cost:2.8,crowd:3}],
     ['pw_sidewalk','sidewalk slam','{A} catches {D} from the side and drives them down with a sidewalk slam.',{}],
     ['pw_spinebuster_running','running spinebuster','{A} catches {D} off the ropes and spins them into the canvas with a spinebuster!',{from:['rope_run','rope_rebound','duck_rebound'],cost:3.4,crowd:4,lift:30}],
     ['pw_chokeslam','chokeslam','{A} grips {D} by the throat, lifts them high and slams them down!',{cost:3.6,lift:18,crowd:5,after:.45,part:'neck',styles:'BY'}],
     ['pw_powerbomb','powerbomb','{A} doubles {D} over, lifts them onto the shoulders and drives them down with a powerbomb!',{cost:4,lift:16,crowd:5,after:.45,risk:1}],
     ['pw_sitout','sit-out powerbomb','{A} hoists {D} and sits out with a powerbomb, pinning the shoulders!',{cost:4.2,lift:14,crowd:5,after:.58,risk:1,next:[['near_kickout',3]]}],
     ['pw_running_powerbomb','running powerbomb','{A} lifts {D}, charges across the ring and slams them down with a running powerbomb!',{cost:4.6,lift:10,crowd:5,after:.6,risk:1}],
     ['pw_backbreaker','backbreaker','{A} scoops {D} up and drops them across a knee with a backbreaker.',{part:'back',focus:1,cost:2.4,lift:30,next:[['target_hold',2]]}],
     ['pw_argentine','Argentine backbreaker','{A} lifts {D} across the shoulders and bends their spine in an Argentine backbreaker!',{part:'back',focus:2,cost:4,lift:8,crowd:3,after:.4,next:[['target_hold',2]]}],
     ['pw_uranage','uranage','{A} hooks under {D}’s arm and slams them backwards with a uranage.',{cost:3,lift:30}],
     ['pw_samoan_drop','Samoan drop','{A} drapes {D} across the shoulders and falls back with a Samoan drop.',{cost:3,lift:22}],
     ['pw_fallaway','fallaway slam','{A} catches {D} and hurls them backwards with a fallaway slam!',{from:['rope_run','rope_rebound','duck_rebound'],cost:3,lift:24,crowd:3}],
     ['pw_gorilla_press','gorilla press slam','{A} presses {D} overhead at arm’s length… and drops them face-first!',{cost:4.6,lift:2,crowd:5,after:.3}],
     ['pw_military_press','military press drop','{A} hoists {D} overhead and lets them fall to the canvas.',{cost:4.2,lift:6,crowd:4}],
     ['pw_torture_rack','torture rack','{A} drapes {D} across the shoulders and bends their back in a torture rack!',{zone:'standing',down:null,part:'back',focus:2,cost:3.8,lift:6,crowd:3,after:.4,next:[['submission_roll',2],['pw_samoan_drop',1],['counter_strike',2]]}],
     ['pw_bearhug','bearhug','{A} locks {D} in a bearhug and squeezes the air out of their ribs.',{block:false,rv:['{D} claps both hands over {A}’s ears, breaks the bearhug and takes {A} down with a headlock!'],zone:'standing',down:null,part:'ribs',focus:2,cost:1.8,lift:null,next:[['hope_elbows_standing',3],['pw_belly_bump',2],['counter_strike',2]]}],
     ['pw_belly_bump','belly-to-belly throw','{A} lifts {D} out of the bearhug and throws them with a belly-to-belly!',{cost:2.8,lift:26,part:'ribs'}],
     ['pw_pumphandle','pumphandle slam','{A} hooks the arm and leg, lifts {D} and slams them with a pumphandle slam.',{cost:3.3,lift:20,crowd:3}],
     ['pw_side_slam','swinging side slam','{A} swings {D} around and drops them with a side slam.',{cost:3,lift:24}],
     ['pw_tiltawhirl_slam','tilt-a-whirl slam','{A} swings {D} around their body and drives them down with a slam.',{from:['rope_run','rope_rebound'],cost:3,lift:22,crowd:3}],
     ['pw_alabama','Alabama slam','{A} hooks the legs, lifts {D} upside down and slams them backwards!',{cost:3.6,lift:18,crowd:4,after:.55,risk:1}],
     ['pw_lariat_catch','lariat after a whip','{A} whips {D} into the ropes and flattens them with a lariat on the rebound!',{block:false,rv:['{D} ducks the lariat on the rebound and takes {A} down with a dropkick!'],from:['rope_run','rope_rebound'],lift:null,cost:2.6,crowd:3,part:'neck'}],
     ['pw_slam_catch','catch and slam','{A} catches {D} in mid-air and slams them!',{from:['rope_run','rope_rebound','duck_rebound'],cost:3.4,lift:20,crowd:4,after:.4}],
     ['pw_powerslam_corner','powerslam out of the corner','{A} catches {D} coming out of the corner with a powerslam!',{from:['corner_escape','corner_whip'],cost:3,lift:24,crowd:3}],
     ['pw_double_chop_slam','gutbuster drop','{A} lifts {D} and drops them across the knee with a gutbuster.',{part:'ribs',focus:2,lift:22,cost:3,crowd:2}],
     ['pw_shoulder_tackle_power','running shoulder block','{A} lowers the shoulder and runs straight through {D}.',{block:false,rv:['{D} drops flat, {A} runs straight over, and {D} pops up to trip them!'],from:['rope_run','rope_rebound','duck_rebound'],lift:null,cost:2,crowd:2}]
    ]},
   neck:{requires:'standing',zone:'mat',down:'d',cost:2.4,lift:null,crowd:2,part:'neck',styles:'TSY',
    from:['lockup','strike_trade','front_facelock','counter_strike','headlock','rope_rebound','probe_strike','stiff_forearm','quiet_reversal','last_second_counter'],
    next:[['cover',2],['mat_hold',2],['stand_reset',3],['target_hold',1]],link:[['ground',2],['submission',1],['pin',0]],
    rev:{lines:['{D} pushes {A} off before the {name} lands and answers with a back body drop!','{D} straightens up out of the {name} and shoves {A} into the turnbuckles!','{D} spins out of the {name} and catches {A} with a neckbreaker instead!'],zone:'mat',down:'d',cost:1.6,crowd:3,next:[['mat_hold',2],['stand_reset',3]]},
    blk:{lines:['{D} pushes {A} away before the {name} can be applied.','{D} grabs the top rope and blocks the {name}.','{D} powers up and blocks the {name}.'],next:[['strike_trade',2],['front_facelock',1]]},
    moves:[
     ['nk_ddt','DDT','{A} tucks {D}’s head and falls back, spiking them with a DDT!',{crowd:3}],
     ['nk_snap_ddt','snap DDT','{A} snaps {D} down with a quick DDT before they can defend.',{}],
     ['nk_double_arm_ddt','double-arm DDT','{A} hooks both arms and drops {D} face-first with a double-arm DDT.',{from:['front_facelock'],cost:2.8,crowd:3,after:.4,styles:'TB'}],
     ['nk_inverted_ddt','inverted DDT','{A} hooks the head from behind and falls back with an inverted DDT.',{cost:2.6}],
     ['nk_implant','implant DDT','{A} hooks the leg and spikes {D} with an implant DDT!',{cost:3,crowd:3,after:.5,risk:1}],
     ['nk_swinging_neckbreaker','swinging neckbreaker','{A} spins {D} around and drops them with a swinging neckbreaker.',{}],
     ['nk_jumping_neckbreaker','jumping neckbreaker','{A} leaps up and drops {D} with a jumping neckbreaker.',{cost:2.6}],
     ['nk_rolling_neckbreaker','rolling neckbreaker','{A} rolls through and turns {D} over with a neckbreaker.',{styles:'TS'}],
     ['nk_bulldog','running bulldog','{A} grabs {D} by the head and charges forward, driving them face-first into the canvas!',{from:['rope_run','rope_rebound','duck_rebound'],cost:2.4,crowd:3}],
     ['nk_facebuster','facebuster','{A} pulls {D}’s head down and plants them face-first into the mat.',{}],
     ['nk_jawbreaker','jawbreaker','{A} drops to a sitting position, pulling {D}’s jaw into the shoulder with a jawbreaker.',{zone:'standing',down:null,cost:1.6,next:[['strike_trade',2],['clothesline',2],['nk_ddt',1]]}],
     ['nk_cutter','cutter','{A} catches {D} around the neck and drops them out of nowhere with a cutter!',{cost:2.8,crowd:5,after:.5,styles:'SY'}],
     ['nk_russian_sweep','Russian leg sweep','{A} steps beside {D}, hooks the arm and sweeps them back with a Russian leg sweep.',{cost:1.8,part:'back',styles:'T'}],
     ['nk_sto','STO','{A} sweeps {D}’s leg and drives them backwards with a forearm across the chest!',{cost:2.4,part:'back'}],
     ['nk_piledriver','piledriver','{A} turns {D} upside down and drops to a seated piledriver!',{from:['front_facelock'],cost:3.8,lift:16,crowd:5,after:.65,risk:1}],
     ['nk_tombstone','tombstone piledriver','{A} tips {D} upside down, holds them close and drops to the knees with a tombstone piledriver!',{from:['front_facelock'],cost:4,lift:12,crowd:6,after:.72,risk:1,next:[['cover',4]]}],
     ['nk_tornado_ddt','tornado DDT','{A} runs up the turnbuckles, swings around and drops {D} with a tornado DDT!',{agile:1,requires:'corner',from:['corner_whip','corner_strikes','corner_push'],cost:3,crowd:4,after:.35,risk:1,styles:'S'}],
     ['nk_stunner','jaw stunner','{A} puts {D} in a three-quarter facelock and drops, snapping the jaw off the shoulder!',{cost:2.4,crowd:4,after:.45,styles:'BY'}]
    ]},
   strike:{requires:'standing',zone:'standing',down:null,cost:1.3,lift:null,crowd:1,styles:'BY',
    from:['probe_strike','strike_trade','stiff_forearm','circle','lockup','counter_strike','clean_break','crowd_pose','dramatic_rally','hope_elbows','opponent_study','taunt'],
    next:[['strike_trade',3],['counter_strike',2],['clothesline',1],['corner_whip',1]],link:[['strike',2],['neck',1],['power',1],['suplex',1]],
    rev:{lines:['{D} catches the {name}, spins {A} around and fires back with a forearm!','{D} ducks the {name} and answers with a quick jab combination!','{D} blocks the {name} and drives a knee into {A}’s midsection!'],zone:'standing',down:null,cost:1,crowd:2,next:[['strike_trade',3],['clothesline',1],['st_forearm',1]]},
    blk:{lines:['{D} gets an arm up and blocks the {name}.','{D} sways back from the {name}; the strike whistles past.','{D} absorbs the {name} and refuses to give ground.'],next:[['strike_trade',2],['counter_strike',1]]},
    moves:[
     ['st_chop','knife-edge chop','{A} lands a loud knife-edge chop across {D}’s chest. The crowd winces with them.',{crowd:3,part:'ribs'}],
     ['st_uppercut','European uppercut','{A} drives a European uppercut up under {D}’s chin.',{part:'neck',styles:'T'}],
     ['st_headbutt','headbutt','{A} rocks {D} with a headbutt. Both wrestlers stagger.',{cost:1.6}],
     ['st_jab','jab combination','{A} pops {D} with three quick jabs.',{cost:1}],
     ['st_kneelift','knee lift','{A} catches {D} coming in with a knee lift.',{cost:1.4}],
     ['st_enzuigiri','enzuigiri','{A} leaps and swings a kick into the back of {D}’s head!',{agile:1,cost:2.2,crowd:3,after:.35,zone:'mat',down:'d',styles:'S'}],
     ['st_superkick','superkick','{A} snaps up a superkick flush on {D}’s jaw!',{cost:2.2,crowd:4,after:.45,zone:'mat',down:'d',styles:'SY'}],
     ['st_big_boot','big boot','{A} plants a big boot into {D}’s face as they charge in!',{cost:1.8,crowd:3,zone:'mat',down:'d',styles:'B'}],
     ['st_standing_dropkick','standing dropkick','{A} leaps and lands a dropkick square on {D}’s chest.',{cost:2,crowd:2,zone:'mat',down:'d',styles:'ST'}],
     ['st_palm','palm strike','{A} snaps {D}’s head back with an open-hand palm strike.',{cost:1.2,styles:'T'}],
     ['st_leg_kick','kick to the thigh','{A} chops at {D}’s leg with a heavy kick to the thigh.',{part:'leg',focus:1,cost:1.2,styles:'T'}],
     ['st_roundhouse','roundhouse kick','{A} spins and lands a roundhouse kick to {D}’s head!',{cost:2,crowd:3,after:.3,zone:'mat',down:'d'}],
     ['st_spinning_backfist','spinning backfist','{A} spins and catches {D} with a backfist!',{cost:1.8,crowd:2,after:.4}],
     ['st_mongolian','Mongolian chop','{A} chops down on both sides of {D}’s neck at once.',{part:'neck',cost:1.2,styles:'B'}],
     ['st_throat_thrust','throat thrust','{A} jabs {D} in the throat behind the referee’s back.',{part:'neck',crowd:-1,cost:.8,styles:'BY'}],
     ['st_discus','discus clothesline','{A} spins around and flattens {D} with a discus clothesline!',{cost:2.2,crowd:3,part:'neck',zone:'mat',down:'d'}],
     ['st_ripcord','short-range lariat','{A} pulls {D} in by the wrist and blasts them with a lariat!',{cost:2.4,crowd:3,part:'neck',zone:'mat',down:'d',after:.4,styles:'B'}],
     ['st_forearm','forearm smash','{A} throws a heavy forearm smash.',{}],
     ['st_body_kick','kick to the ribs','{A} digs a kick into {D}’s ribs.',{part:'ribs',focus:1,cost:1.3,styles:'T'}],
     ['st_elbow_smash','elbow smash','{A} cracks {D} with a short elbow to the jaw.',{cost:1.1}],
     ['st_gut_punch','punch to the gut','{A} doubles {D} over with a punch to the gut.',{part:'ribs',focus:1,cost:.9,next:[['front_facelock',3]]}],
     ['st_rolling_koppu','rolling chop','{A} spins and catches {D} with a rolling chop!',{cost:1.8,crowd:2,after:.35}],
     ['st_spin_kick','spin kick','{A} spins and catches {D} in the chest with a kick.',{agile:1,cost:1.8,crowd:2,zone:'mat',down:'d',styles:'S'}],
     ['st_knee_strike','running knee strike','{A} charges and drives a knee into {D}’s jaw!',{cost:2.4,crowd:4,after:.5,zone:'mat',down:'d'}],
     ['st_fighting_spirit','strike exchange','{A} and {D} stand in the centre and trade blows. Neither will go down first.',{rev:false,cost:2,crowd:4,after:.5,styles:'BY',block:false}],
     ['st_lariat_standing','standing lariat','{A} flattens {D} with a standing lariat.',{part:'neck',zone:'mat',down:'d',cost:2,crowd:2}],
     ['st_axe_kick','axe kick','{A} brings a heel down onto {D}’s head with an axe kick!',{agile:1,cost:2.2,crowd:3,after:.4,zone:'mat',down:'d',styles:'S'}],
     ['st_open_slap','open-hand slap','{A} slaps {D} across the face. The noise echoes around the room.',{crowd:3,cost:.8,styles:'Y'}],
     ['st_double_chop','double chop','{A} chops down across both of {D}’s shoulders.',{part:'arm',cost:1.2}],
     ['st_side_kick','side kick','{A} drives a side kick into {D}’s midsection.',{part:'ribs',cost:1.4,styles:'T'}],
     ['st_backhand','backhand chop','{A} turns and lands a backhand chop across {D}’s chest.',{part:'ribs',cost:1.1,crowd:2}],
     ['st_eye_rake','eye rake','{A} rakes {D}’s eyes while the referee is out of position.',{crowd:-2,cost:.6,styles:'BY',block:false}]
    ]},
   corner:{requires:'corner',zone:'corner',down:null,cost:1.8,lift:null,crowd:2,styles:'BSY',
    from:['corner_whip','corner_strikes','corner_push','corner_knee','corner_charge'],
    next:[['corner_whip',1],['corner_escape',1],['corner_break',2],['strike_trade',1]],link:[['corner',2],['neck',0]],
    rev:{lines:['{D} gets a boot up! {A} runs straight into it on the {name} attempt!','{D} sidesteps the {name}, and {A} crashes shoulder-first into the ring post!','{D} catches {A} on the {name} attempt and hits a quick counter out of the corner!'],still:['{D} shoves {A} away in the middle of the {name} and fights out of the corner!','{D} blocks the {name} and elbows their way out of the corner!'],requires:'corner',zone:'standing',down:null,cost:1.2,crowd:3,next:[['clothesline',2],['strike_trade',2],['counter_strike',1]]},
    blk:{zone:'standing',lines:['{D} slips out of the corner, and {A} pulls up before the {name}.','The referee steps in to separate them, and the {name} has to wait.'],next:[['strike_trade',2],['corner_break',1]]},
    moves:[
     ['cn_splash','corner splash','{A} charges and crushes {D} in the corner with a splash.',{cost:2.2}],
     ['cn_stinger','running corner splash','{A} hits a running splash into the corner. {D} staggers out.',{cost:2.4,crowd:3,zone:'standing'}],
     ['cn_dropkick','corner dropkick','{A} runs in and lands a dropkick to {D}, slumped in the corner!',{cost:2.4,crowd:3,styles:'S'}],
     ['cn_forearm','running corner forearm','{A} charges into the corner with a running forearm.',{cost:2}],
     ['cn_cannonball','cannonball senton','{A} rolls into the corner with a cannonball senton!',{cost:2.8,crowd:4,after:.4,styles:'S'}],
     ['cn_shoulders','shoulder thrusts','{A} drives shoulder after shoulder into {D}’s midsection.',{still:1,part:'ribs',focus:1,cost:1.6,styles:'B'}],
     ['cn_mounted_punches','mounted punches','{A} climbs onto the second rope and rains down punches. The crowd counts along!',{still:1,cost:1.8,crowd:4,styles:'BY'}],
     ['cn_tree_of_woe','tree of woe stomps','{A} hangs {D} upside down in the turnbuckles and stomps them.',{still:1,cost:1.8,crowd:-1,after:.3,styles:'B'}],
     ['cn_chops','corner chops','{A} traps {D} in the corner and lands chop after chop.',{still:1,part:'ribs',cost:1.6,crowd:3}],
     ['cn_monkey_flip','monkey flip','{A} plants both feet on {D}’s hips and flips them out of the corner!',{still:1,agile:1,zone:'mat',down:'d',cost:2,crowd:3,styles:'TS'}],
     ['cn_clothesline','corner clothesline','{A} follows {D} into the corner with a running clothesline.',{cost:1.8,part:'neck'}],
     ['cn_knee','corner knee strike','{A} charges and drives a knee into {D}, slumped in the corner!',{cost:2.4,crowd:3,after:.4}],
     ['cn_snapmare','snapmare out of the corner','{A} snaps {D} out of the corner and onto the mat with a snapmare.',{still:1,zone:'mat',down:'d',cost:1.2,styles:'T'}],
     ['cn_hip_attack','corner hip attack','{A} rushes in and crashes into {D} with a hip attack.',{cost:2,crowd:2}],
     ['cn_avalanche','avalanche','{A} runs full speed and squashes {D} against the turnbuckles!',{cost:2.8,crowd:3,styles:'B'}],
     ['cn_face_buckle','turnbuckle smash','{A} smashes {D}’s face into the top turnbuckle.',{still:1,cost:1,crowd:1}],
     ['cn_choke','boot choke','{A} chokes {D} with a boot in the corner while the referee counts.',{still:1,cost:.8,crowd:-2,part:'neck',styles:'BY'}],
     ['cn_backflip','corner backflip','{A} runs up the ropes, flips over {D}’s charge and lands on their feet!',{block:false,rv:['{D} catches {A} in mid-air on the backflip and drops them!'],agile:1,zone:'standing',cost:2.2,crowd:4,after:.3,styles:'S'}]
    ]},
   aerial:{requires:'top',zone:'mat',down:'d',cost:3.6,lift:null,crowd:4,risk:1,styles:'S',
    from:['top_climb','springboard_rise'],
    next:[['cover',4],['stand_reset',3]],link:[['pin',0]],
    rev:{lines:['{D} rolls away and {A} crashes onto the canvas on the {name}!','{D} moves at the last moment. The {name} hits nothing but mat!','{D} gets both knees up! {A}’s {name} lands on them!'],requires:'top',zone:'mat',down:'d',cost:2.2,crowd:3,next:[['cover',2],['mat_hold',2],['stand_reset',3]]},
    blk:{zone:'standing',lines:['{D} rolls towards the apron, and {A} has to abandon the {name}.','{A} sets for the {name}, but {D} is too far away. {A} climbs down.','{D} gets up too quickly; {A} has to abandon the {name} and jump down.'],next:[['stand_reset',2],['counter_strike',1],['circle',1]]},
    moves:[
     ['ar_headbutt','diving headbutt','{A} leaps off the top rope and comes down with a diving headbutt!',{after:.5,crowd:5,styles:'BY'}],
     ['ar_frog','frog splash','{A} launches from the corner and comes down with a frog splash!',{agile:1,after:.45,crowd:5}],
     ['ar_moonsault','moonsault','{A} turns backwards off the top rope and lands a moonsault!',{agile:1,after:.45,crowd:6,cost:4}],
     ['ar_senton','senton bomb','{A} flips forward off the top rope and crashes down with a senton!',{agile:1,after:.4,crowd:5}],
     ['ar_knee','diving knee','{A} leaps off the top and drives a knee into {D}!',{crowd:4,after:.5}],
     ['ar_clothesline','diving clothesline','{A} leaps off the top rope and catches {D} with a clothesline as they get up!',{crowd:4,part:'neck'}],
     ['ar_axe','double axe handle','{A} leaps from the top rope and brings both fists down on {D}.',{cost:2.6,crowd:3,risk:0,styles:'BY'}],
     ['ar_fist','flying fist drop','{A} jumps off the top rope and drops a fist on {D}.',{cost:2.6,crowd:3,risk:0}],
     ['ar_legdrop','top-rope leg drop','{A} drops a leg across {D}’s throat from the top rope!',{cost:3.4,crowd:4,part:'neck',after:.4}],
     ['ar_450','450 splash','{A} spins one and a quarter times in mid-air and lands a 450 splash!',{agile:1,cost:4.4,crowd:7,after:.7}],
     ['ar_shooting_star','shooting star press','{A} backflips forward off the top rope into a shooting star press!',{agile:1,cost:4.4,crowd:7,after:.75}],
     ['ar_swanton','swanton bomb','{A} curls forward off the top rope and crashes down across {D} with a swanton!',{agile:1,after:.5,crowd:6}],
     ['ar_corkscrew','corkscrew moonsault','{A} twists into a corkscrew moonsault!',{agile:1,cost:4.4,crowd:7,after:.7}],
     ['ar_stomp','double stomp','{A} leaps from the top rope and stomps down with both feet!',{part:'ribs',focus:1,crowd:4,after:.45,styles:'SB'}],
     ['ar_elbow_point','diving elbow','{A} points to the crowd and drops a diving elbow from the top!',{crowd:5,after:.4,styles:'SY'}],
     ['ar_missile_low','top-rope dropkick','{A} drops off the top rope with a dropkick into {D}’s knee!',{agile:1,part:'leg',focus:1,cost:3,crowd:3}],
     ['ar_splash','big splash','{A} spreads their arms and splashes onto {D} from the top rope!',{cost:3.4,crowd:4}],
     ['ar_cross_arm','flying crossbody','{A} sails off the top and catches {D} standing up with a crossbody!',{agile:1,cost:3.4,crowd:4,next:[['near_kickout',1]]}]
    ]},
   superplex:{requires:'top',zone:'mat',down:'d',cost:4.2,lift:18,crowd:6,risk:1,after:.5,part:'back',styles:'BS',
    from:['top_follow'],
    next:[['cover',4],['stand_reset',2],['dramatic_sell',2]],link:[],
    rev:{lines:['{D} punches free and shoves {A} off the turnbuckle. {A} crashes to the mat!','{D} headbutts {A} away, and {A} tumbles off the top!','{D} blocks the {name}, and {A} falls to the canvas below!'],requires:'top',zone:'mat',down:'d',cost:2,crowd:4,next:[['ar_headbutt',1],['ar_frog',1],['stand_reset',3]]},
    blk:{zone:'standing',lines:['{D} hooks the top rope and refuses to come off for the {name}.','They fight for position on the top rope. Nobody can get the {name}.'],next:[['strike_trade',1]]},
    moves:[
     ['sp_superplex','superplex','{A} hooks {D} on the top rope and hits a superplex! The ring shakes!',{}],
     ['sp_avalanche_german','avalanche German suplex','{A} wraps {D} from behind on the turnbuckle and drops back with a German suplex from the top!',{cost:4.8,crowd:7,after:.7}],
     ['sp_hurricanrana','top-rope hurricanrana','{A} scissors {D}’s head on the top rope and flips them with a hurricanrana!',{agile:1,lift:null,cost:3.8,styles:'S',part:'neck'}],
     ['sp_powerbomb','top-rope powerbomb','{A} powerbombs {D} off the turnbuckles!',{lift:8,cost:5,crowd:7,after:.72}],
     ['sp_spider','spider German suplex','{A} hangs from the ropes and drops {D} with a German suplex from the middle rope!',{agile:1,cost:4.6,crowd:7,after:.68}],
     ['sp_super_ddt','super DDT','{A} spikes {D} with a DDT from the second rope!',{lift:null,cost:3.6,part:'neck'}],
     ['sp_super_arm_drag','top-rope arm drag','{A} flips {D} off the top rope with an arm drag.',{lift:null,cost:3,crowd:4,part:'arm',styles:'T'}]
    ]},
   springboard:{agile:1,requires:'top',zone:'mat',down:'d',cost:3.2,lift:null,crowd:4,risk:1,styles:'S',
    from:['springboard_rise','springboard_feint'],
    next:[['cover',3],['stand_reset',3]],link:[['ground',1]],
    rev:{lines:['{D} catches {A} in mid-air on the {name} and slams them down!','{D} steps out of the way of the {name}, and {A} lands awkwardly!'],requires:'top',zone:'mat',down:'d',cost:2,crowd:3,next:[['mat_hold',2],['cover',1],['stand_reset',3]]},
    blk:{zone:'standing',lines:['{A} slips on the rope and cannot get the {name} off.','{D} moves away, and {A} decides against the {name}.'],next:[['stand_reset',2],['counter_strike',1]]},
    moves:[
     ['sb_dropkick','springboard dropkick','{A} springs off the top rope and lands a dropkick!',{}],
     ['sb_moonsault','springboard moonsault','{A} rebounds off the ropes into a moonsault!',{cost:3.8,crowd:5,after:.45}],
     ['sb_elbow','springboard elbow','{A} springs off the ropes and drops a flying elbow!',{}],
     ['sb_cutter','springboard cutter','{A} leaps off the second rope and drops {D} with a cutter!',{cost:3.8,crowd:6,after:.6,part:'neck'}],
     ['sb_arm_drag','springboard arm drag','{A} runs up the ropes and flips {D} with an arm drag!',{cost:2.6,crowd:3,part:'arm',risk:0}],
     ['sb_clothesline','springboard clothesline','{A} springs off the ropes and catches {D} with a clothesline.',{cost:3,part:'neck'}]
    ]},
   dive:{agile:1,requires:'outside',zone:'outside',down:'d',cost:3.4,lift:null,crowd:5,risk:1,after:.3,styles:'S',
    from:['outside_toss','floor_regroup'],
    next:[['roll_inside',4],['floor_brawl',2]],link:[['outside',2]],
    rev:{lines:['{D} catches {A} on the {name} and rams them into the barricade!','{D} steps aside, and {A}’s {name} crashes into the barricade!','{D} sees the {name} coming and catches {A} with a forearm through the ropes!'],requires:'outside',zone:'outside',down:'d',cost:2,crowd:4,next:[['roll_inside',3],['floor_brawl',2]]},
    blk:{lines:['{D} moves away from the ropes, and {A} stops before the {name}.','The referee gets in the way. {A} cannot go for the {name}.'],next:[['roll_inside',2],['floor_brawl',1]]},
    moves:[
     ['dv_suicide','suicide dive','{A} sprints across the ring and dives through the ropes, crashing into {D} on the floor!',{}],
     ['dv_plancha','plancha','{A} leaps over the top rope and lands a plancha on {D} on the floor!',{}],
     ['dv_tope_con_hilo','tope con hilo','{A} flips over the top rope onto {D} on the floor!',{cost:3.8,crowd:6,after:.45}],
     ['dv_moonsault','moonsault to the floor','{A} leaps from the top rope with a moonsault to the floor!',{cost:4.4,crowd:7,after:.6}],
     ['dv_apron_senton','senton off the apron','{A} flips off the apron with a senton onto {D}.',{agile:0,cost:3,crowd:4}],
     ['dv_cannonball','cannonball off the apron','{A} cannonballs off the apron and crashes into {D} at ringside!',{agile:0,cost:3,crowd:4,styles:'SB'}],
     ['dv_crossbody','crossbody over the top rope','{A} leaps over the top rope with a crossbody onto {D} at ringside!',{}],
     ['dv_asai','springboard moonsault to the floor','{A} springs off the middle rope and moonsaults onto {D} on the floor!',{cost:4,crowd:6,after:.5}],
     ['dv_somersault','somersault plancha','{A} flips over the top rope and lands on {D} with a somersault plancha!',{cost:3.8,crowd:6,after:.5}]
    ]},
   submission:{requires:'mat',zone:'mat',down:'d',cost:1.8,lift:null,crowd:2,focus:2,styles:'T',
    from:['mat_hold','target_hold','mat_takedown','grapple_trip','ankle_pick','leg_wrench','grounded_switch','rib_knee','hope_cutoff','ch_single_leg','ch_double_leg','ch_fireman'],
    next:[['submission_ropes',3],['rope_crawl',3],['submission_roll',2],['mat_scramble',1]],link:[['submission',1],['ground',1]],
    rev:{lines:['{D} rolls through the {name} and breaks the hold!','{D} kicks {A} away and escapes the {name}!','{D} powers out of the {name} and scrambles free!','{D} reaches the bottom rope and the {name} is broken!'],requires:'mat',zone:'standing',down:null,cost:1.4,crowd:3,next:[['stand_reset',2],['strike_trade',2],['counter_strike',1]]},
    blk:{lines:['{D} stretches for the ropes, but {A} drags them back to the centre and keeps the {name} locked in!','{D} nearly gives up but keeps fighting. {A} tightens the {name}.','The referee asks {D} if they want to quit. {D} says no and keeps fighting the {name}.'],next:[['submission_ropes',2],['rope_crawl',2],['mat_scramble',1]]},
    moves:[
     ['sm_armbar','armbar','{A} stretches {D}’s arm across their hips into an armbar.',{part:'arm'}],
     ['sm_cross_armbreaker','cross armbreaker','{A} falls back with a cross armbreaker, pulling {D}’s arm straight!',{part:'arm',crowd:4,after:.45}],
     ['sm_kimura','kimura','{A} locks a kimura and turns {D}’s arm behind their back.',{part:'arm',after:.35}],
     ['sm_keylock','keylock','{A} figure-fours {D}’s arm and cranks the keylock.',{part:'arm'}],
     ['sm_fujiwara','Fujiwara armbar','{A} lies across {D}’s back and twists the arm into a Fujiwara armbar.',{part:'arm',after:.35}],
     ['sm_triangle','triangle choke','{A} wraps both legs around {D}’s head and arm in a triangle choke!',{part:'neck',crowd:4,after:.45}],
     ['sm_rear_naked','rear naked choke','{A} takes {D}’s back and sinks in a rear naked choke!',{part:'neck',crowd:4,after:.45}],
     ['sm_sleeper','sleeper hold','{A} applies a sleeper hold. {D}’s arm drops once… twice…',{part:'neck',crowd:4,styles:'TY'}],
     ['sm_camel','camel clutch','{A} sits on {D}’s back, pulls up on the chin and wrenches back with a camel clutch.',{part:'back',styles:'BY'}],
     ['sm_boston','Boston crab','{A} turns {D} over into a Boston crab and leans back!',{part:'back',crowd:3}],
     ['sm_single_crab','single-leg crab','{A} grabs one leg and turns {D} into a single-leg crab.',{part:'leg'}],
     ['sm_figure_four','figure-four leglock','{A} locks in the figure-four! {D} slaps the mat in agony!',{part:'leg',crowd:5,after:.4}],
     ['sm_ankle_lock','ankle lock','{A} traps {D}’s foot and wrenches the ankle lock!',{part:'leg',crowd:4,after:.4}],
     ['sm_heel_hook','heel hook','{A} twists {D}’s heel into a heel hook, torquing the knee.',{part:'leg',after:.5}],
     ['sm_kneebar','kneebar','{A} wraps {D}’s leg and arches into a kneebar.',{part:'leg',after:.4}],
     ['sm_stf','STF','{A} hooks the leg, falls across {D}’s back and wrenches the face back in an STF!',{part:'neck',crowd:4,after:.45}],
     ['sm_crossface','crossface','{A} traps {D}’s arm and cranks across their face with a crossface!',{part:'neck',crowd:4,after:.45}],
     ['sm_abdominal','abdominal stretch','{A} wraps {D} in an abdominal stretch, using the ropes for leverage behind the referee’s back.',{rv:['{D} hip-tosses {A} over and escapes the {name}!'],requires:'standing',zone:'standing',down:null,part:'ribs',crowd:-1,from:['waistlock','go_behind','body_shot'],styles:'BY'}],
     ['sm_surfboard','surfboard stretch','{A} plants knees in {D}’s back and pulls the arms into a surfboard stretch.',{part:'back'}],
     ['sm_chinlock','rear chinlock','{A} sits behind {D} and grinds a chinlock.',{part:'neck',cost:1,crowd:0,styles:'TY'}],
     ['sm_sharpshooter','sharpshooter','{A} steps through {D}’s legs, turns them over and leans back in a sharpshooter!',{part:'back',crowd:5,after:.5}],
     ['sm_dragon_sleeper','dragon sleeper','{A} hooks {D}’s head and bends the neck back in a dragon sleeper!',{part:'neck',after:.45}],
     ['sm_deathlock','Indian deathlock','{A} weaves {D}’s legs together and falls back in an Indian deathlock.',{part:'leg',after:.35}],
     ['sm_cloverleaf','cloverleaf','{A} folds {D}’s legs into a cloverleaf and turns them over!',{part:'back',crowd:4,after:.5}],
     ['sm_bow_arrow','bow and arrow hold','{A} pulls {D} back across the knees in a bow and arrow hold.',{part:'back',styles:'T'}],
     ['sm_anaconda','arm-trap choke','{A} wraps the arm and neck and squeezes with an arm-trap choke.',{part:'neck',after:.5}],
     ['sm_cobra','cobra clutch','{A} wraps {D}’s arm across the throat and squeezes in a cobra clutch.',{part:'neck'}],
     ['sm_octopus','octopus stretch','{A} climbs onto {D} and wraps every limb into an octopus stretch!',{rv:['{D} powers out, peels {A} off and escapes the {name}!'],requires:'standing',zone:'standing',down:null,part:'back',crowd:4,after:.5,from:['waistlock','go_behind'],styles:'TY'}],
     ['sm_muffler','stretch muffler','{A} stretches {D}’s leg back and drives the knee into the mat.',{part:'leg',after:.4}],
     ['sm_arm_triangle','arm triangle','{A} sinks an arm triangle and squeezes, cutting off the air!',{part:'neck',after:.5}],
     ['sm_wristlock_ground','grounded wristlock','{A} isolates {D}’s wrist on the mat and bends it back.',{part:'arm',cost:1.2,crowd:1}],
     ['sm_short_arm_scissors','short-arm scissors','{A} traps {D}’s arm between their legs and pulls it back.',{part:'arm',after:.3}],
     ['sm_lion_tamer','elevated crab','{A} turns {D} into a crab and drives a knee into the neck!',{part:'back',crowd:5,after:.55}],
     ['sm_rings','leg spreader','{A} traps both of {D}’s legs and pulls them apart.',{part:'leg',after:.3}],
     ['sm_toe_hold','toe hold','{A} twists {D}’s foot in a toe hold.',{part:'leg',cost:1.2,crowd:1}]
    ]},
   ground:{requires:'mat',zone:'mat',down:'d',cost:1.4,lift:null,crowd:1,focus:1,styles:'BY',
    from:['clothesline','snap_suplex','shoulder_tackle','mat_hold','heavy_slam','short_arm_lariat','arm_drag','hip_toss','mat_takedown','hope_cutoff','power_spinebuster','running_headscissors'],
    next:[['stand_reset',3],['mat_hold',2],['early_cover',1],['target_hold',1]],link:[['submission',1],['ground',1]],
    rev:{lines:['{D} rolls clear and the {name} misses!','{D} moves away from the {name} and gets to their feet first!','{D} sees the {name} coming and kicks {A} away!'],still:['{D} kicks {A} away and gets back to their feet!','{D} fights free and gets up before {A} can continue!'],requires:'mat',zone:'standing',down:null,cost:.9,crowd:2,next:[['strike_trade',2],['counter_strike',2],['stand_reset',1]]},
    moves:[
     ['gd_elbow_drop','elbow drop','{A} drops an elbow across {D}’s chest.',{part:'ribs'}],
     ['gd_knee_drop','knee drop','{A} drops a knee across {D}’s head.',{part:'neck'}],
     ['gd_leg_drop','leg drop','{A} drops a leg across {D}’s throat.',{part:'neck',crowd:2}],
     ['gd_stomp','stomp','{A} stomps on {D}’s {part}.',{cost:1}],
     ['gd_senton','senton','{A} drops a back senton onto {D}.',{part:'ribs',cost:1.8}],
     ['gd_splash','standing splash','{A} splashes onto {D}.',{part:'ribs',cost:1.8}],
     ['gd_headbutt','falling headbutt','{A} drops down with a headbutt to {D}’s {part}.',{cost:1.4}],
     ['gd_arm_elbows','elbows to the arm','{A} kneels on {D}’s wrist and drives elbows into the arm.',{still:1,part:'arm',focus:2,styles:'T'}],
     ['gd_knee_stomp','stomp to the knee','{A} stomps down on {D}’s knee.',{part:'leg',focus:2,styles:'TB'}],
     ['gd_ground_pound','ground and pound','{A} mounts {D} and throws punches until the referee pulls them off.',{still:1,cost:1.8,crowd:2,styles:'B'}],
     ['gd_fist_drop','fist drop','{A} drops a fist on {D}.',{cost:.9}],
     ['gd_standing_moonsault','standing moonsault','{A} flips backwards into a standing moonsault!',{agile:1,cost:2.6,crowd:3,after:.45,styles:'S'}],
     ['gd_running_senton','running senton','{A} bounces off the ropes and lands a senton!',{cost:2.4,crowd:3,part:'ribs'}],
     ['gd_choke_ropes','choke on the ropes','{A} drags {D} over to the ropes and chokes them while the referee counts.',{still:1,part:'neck',crowd:-2,cost:.8,styles:'BY'}],
     ['gd_back_rake','back rake','{A} rakes {D}’s back and taunts the crowd.',{still:1,part:'back',crowd:-1,cost:.6,styles:'Y'}],
     ['gd_dragon_screw_ground','leg twist on the mat','{A} spins {D}’s leg against the joint while it is trapped on the canvas.',{still:1,part:'leg',focus:2,styles:'T'}],
     ['gd_arm_stomp','stomp to the arm','{A} stomps on {D}’s arm, keeping the pressure on the limb.',{part:'arm',focus:2}],
     ['gd_rib_stomp','stomp to the ribs','{A} stomps on {D}’s ribs.',{part:'ribs',focus:2}],
     ['gd_elbow_neck','elbow drop to the neck','{A} drops an elbow onto the back of {D}’s neck.',{part:'neck',focus:2}],
     ['gd_lower_back_knee','knee to the lower back','{A} drives a knee into {D}’s lower back and pulls up on the arms.',{still:1,part:'back',focus:2}]
    ]},
   chain:{requires:'standing',zone:'standing',down:null,cost:1.1,lift:null,crowd:1,styles:'T',
    from:['lockup','collar_snap','circle','waistlock','wristlock','headlock','knuckle_lock','clean_break','go_behind','front_facelock'],
    next:[['wristlock',2],['waistlock',2],['lockup',1],['headlock',1]],link:[['chain',2],['suplex',1]],
    rev:{lines:['{D} counters the {name} with a quick arm drag!','{D} reads the {name} and turns it into a front facelock!','{D} blocks the {name} and slips behind {A}!'],zone:'standing',down:null,cost:1,crowd:2,next:[['front_facelock',2],['waistlock',2],['wristlock',1]]},
    moves:[
     ['ch_single_leg','single-leg takedown','{A} shoots in, grabs a leg and takes {D} to the mat.',{rv:['{D} sprawls on the {name} attempt and spins behind {A}!'],zone:'mat',down:'d',part:'leg'}],
     ['ch_double_leg','double-leg takedown','{A} drops levels and drives through {D} with a double-leg takedown.',{rv:['{D} sprawls on the {name} attempt and spins behind {A}!'],zone:'mat',down:'d',cost:1.4}],
     ['ch_fireman','fireman’s carry takeover','{A} ducks under, lifts {D} across the shoulders and flips them to the mat.',{rv:['{D} drops their weight, blocks the {name} and spins behind {A}!'],zone:'mat',down:'d',cost:1.6,lift:30}],
     ['ch_snapmare','snapmare','{A} snaps {D} over the shoulder and onto the mat with a snapmare.',{zone:'mat',down:'d',next:[['sm_chinlock',3]]}],
     ['ch_deep_arm_drag','deep arm drag','{A} hooks the arm deep and drags {D} over with an arm drag.',{zone:'mat',down:'d',part:'arm'}],
     ['ch_japanese_arm_drag','Japanese arm drag','{A} flips forward with {D}’s arm, dragging them over!',{agile:1,zone:'mat',down:'d',part:'arm',cost:1.6,crowd:2,styles:'TS'}],
     ['ch_drop_toehold','drop toehold','{A} falls into {D}’s ankles and trips them face-first.',{rv:['{D} steps over the {name} and takes {A}’s back!'],zone:'mat',down:'d',part:'leg'}],
     ['go_behind','go-behind','{A} ducks under and gets behind {D}, holding the waist.',{next:[['sx_german',2],['standing_switch',2],['mat_takedown',2]]}],
     ['standing_switch','standing switch','{D} switches behind; {A} switches back. They go back and forth for position.',{rev:false,next:[['go_behind',2],['waist_escape',2],['sx_german',1]],block:false}],
     ['front_facelock','front facelock','{A} snaps {D} down into a front facelock.',{part:'neck',next:[['sx_vertical',2],['nk_ddt',2],['sx_brainbuster',1]]}],
     ['knuckle_lock','test of strength','{A} and {D} lock fingers in a test of strength. Neither gives ground.',{rv:['{D} bridges out of the test of strength, slips free and takes {A}’s back!'],cost:1.6,crowd:2,next:[['knuckle_break',2],['go_behind',1]],styles:'BY'}],
     ['knuckle_break','bridge in the test of strength','{A} forces {D} to their knees, but {D} bridges and pushes back up!',{rev:false,cost:1.8,crowd:3,next:[['strike_trade',2],['lockup',2]],styles:'TY',block:false}],
     ['ch_top_wristlock','top wristlock','{A} takes a top wristlock and turns {D} to face the mat.',{part:'arm',next:[['wrist_escape',2],['ch_snapmare',1]]}],
     ['ch_drop_down','drop-down and leapfrog','{D} drops down, then leapfrogs as {A} rebounds off the ropes.',{rev:false,cost:1.4,crowd:2,next:[['rope_run',2],['ch_deep_arm_drag',2],['pw_shoulder_tackle_power',1]],block:false}],
     ['ch_headlock_takedown','side headlock takedown','{A} drags {D} to the mat with a tight side headlock.',{zone:'mat',down:'d',part:'neck'}],
     ['ch_leg_trip','leg trip','{A} sweeps {D}’s legs and drops them on the mat.',{rv:['{D} hops over the {name} and spins behind {A}!'],zone:'mat',down:'d'}],
     ['ch_cravate','cravate','{A} locks the head in a cravate and grinds {D}’s neck.',{part:'neck',focus:1}],
     ['ch_short_arm','escape','{A} slips out from {D}’s grip and changes position.',{rev:false,block:false}],
     ['ch_dragon_screw','dragon screw','{A} catches {D}’s leg and spins it, taking {D} to the mat!',{zone:'mat',down:'d',part:'leg',focus:2,cost:1.8,crowd:2}],
     ['ch_rolling_wristlock','rolling wristlock','{A} rolls into a wristlock and keeps hold of {D}.',{part:'arm',cost:1.2,next:[['arm_wringer',2]]}],
     ['ch_kip_up','kip-up','{A} springs up with a kip-up and ends up face to face with {D}.',{rev:false,agile:1,crowd:3,cost:1.2,block:false,next:[['strike_trade',2],['lockup',2]]}],
     ['ch_headlock_escape','headscissors escape','{A} slips out of the headscissors, kips up and stands facing {D}.',{rev:false,agile:1,crowd:3,cost:1.4,block:false,next:[['circle',2],['lockup',2]]}],
     ['ch_rollthrough','roll-through','{A} rolls through and comes up on top.',{rev:false,cost:1,block:false}],
     ['ch_hip_toss_chain','hip toss','{A} tosses {D} over the hip.',{zone:'mat',down:'d'}]
    ]},
   pin:{requires:'standing',zone:'mat',down:'d',cost:1.4,lift:null,crowd:5,after:.45,nearfall:1,styles:'TY',
    from:['counter_strike','last_second_counter','quiet_reversal','strike_trade','lockup','finish_counter','dramatic_rally','rope_rebound','duck_rebound','waist_escape'],
    next:[['stand_reset',4],['strike_trade',2],['clothesline',1]],link:[['strike',1]],
    rev:{lines:['{D} sits down on the {name} and almost turns it into a pin of their own!','{D} blocks the {name}, rolls through and gets back up first!'],zone:'standing',down:null,cost:1,crowd:4,next:[['strike_trade',2],['clothesline',2]]},
    moves:[
     ['pn_small_package','small package','{A} rolls {D} into a small package! ONE! TWO! {D} kicks out!',{}],
     ['pn_schoolboy','schoolboy','{A} trips {D} from behind with a schoolboy! ONE! TWO! {D} kicks out!',{}],
     ['pn_inside_cradle','inside cradle','{A} rolls {D} up with an inside cradle! TWO AND THREE-QUARTERS! {D} gets a shoulder up!',{crowd:6}],
     ['pn_crucifix','crucifix pin','{A} traps the arms with a crucifix pin! ONE! TWO! {D} gets out!',{}],
     ['pn_sunset','sunset flip','{A} flips over {D} and rolls them up with a sunset flip! TWO! {D} kicks out!',{from:['rope_rebound','duck_rebound','rope_run']}],
     ['pn_victory_roll','victory roll','{A} leaps onto {D}’s shoulders and rolls them up! TWO! {D} kicks out!',{crowd:6,styles:'S'}],
     ['pn_backslide','backslide','{A} catches {D} with a backslide! ONE! TWO! {D} kicks out!',{}],
     ['pn_oconnor','rolling cradle','{A} rolls {D} up and holds the legs! ONE! TWO! {D} kicks out!',{}],
     ['pn_jackknife','jackknife cover','{A} folds {D} up with a jackknife cover! TWO! {D} gets free!',{}],
     ['pn_magistral','La Magistral cradle','{A} spins around {D}’s arm and rolls them up! TWO! {D} kicks out!',{crowd:6,styles:'S'}],
     ['pn_bridge_rollup','bridging rollup','{A} rolls {D} up and bridges for leverage! TWO! {D} kicks out!',{}]
    ]},
   outside:{requires:'outside',zone:'outside',down:null,cost:1.5,lift:null,crowd:2,styles:'BY',
    from:['outside_toss','floor_brawl','floor_counter','apron_stand','floor_regroup'],
    next:[['roll_inside',3],['floor_brawl',2],['floor_counter',1],['apron_stand',1]],link:[['outside',1]],
    rev:{lines:['{D} blocks the {name} and reverses, sending {A} into the barricade!','{D} turns the {name} around on the floor!'],requires:'outside',zone:'outside',down:null,cost:1.2,crowd:3,next:[['roll_inside',3],['floor_brawl',2]]},
    moves:[
     ['os_barricade','barricade whip','{A} whips {D} hard into the barricade.',{part:'back',focus:1}],
     ['os_post','ring post shot','{A} rams {D}’s shoulder into the ring post!',{part:'arm',focus:2,crowd:3}],
     ['os_post_leg','leg around the post','{A} pulls {D}’s leg around the ring post and wrenches it!',{rv:['{D} kicks {A} away from the post, and {A} crashes into the barricade!'],part:'leg',focus:2,crowd:-1,styles:'BT'}],
     ['os_apron_knee','apron knee drop','{A} drops a knee on {D}, draped over the apron.',{part:'neck',cost:1.8}],
     ['os_apron_ddt','DDT on the apron','{A} spikes {D} with a DDT on the ring apron!',{part:'neck',cost:3,crowd:5,after:.6,risk:1}],
     ['os_floor_piledriver','piledriver on the floor','{A} hooks {D} on the floor and drives them down with a piledriver!',{part:'neck',cost:4.1,lift:14,crowd:6,after:.68,risk:1,styles:'B'}],
     ['os_ramp_suplex','suplex on the entrance ramp','{A} lifts {D} at the entrance and suplexes them onto the ramp!',{part:'back',cost:4,lift:20,crowd:6,after:.55,risk:1,styles:'B'}],
     ['os_barricade_spear','spear through the barricade','{A} drives a shoulder into {D} and sends both crashing through the barricade!',{part:'ribs',cost:4.3,crowd:7,after:.65,risk:1,styles:'B'}],
     ['os_floor_chop','chop on the floor','{A} lands a loud chop on the floor. The crowd at ringside winces.',{part:'ribs',crowd:3}],
     ['os_steps','whip into the ring steps','{A} sends {D} into the ring steps!',{part:'leg',focus:1,crowd:3,cost:2,styles:'B'}],
     ['os_apron_slam','body slam on the apron','{A} body slams {D} on the hard edge of the ring apron!',{part:'back',focus:2,lift:26,cost:3,crowd:4,after:.5,risk:1}],
     ['os_crowd_brawl','brawl into the crowd','{A} and {D} brawl into the crowd. The fans scatter.',{rv:['{D} turns the brawl around in the crowd and throws {A} back over the barricade!'],cost:2,crowd:4,styles:'B'}],
     ['os_headbutt','headbutt on the floor','{A} grabs {D} by the hair and headbutts them on the floor.',{}],
     ['os_apron_forearm','forearm on the apron','{A} hits {D} with a forearm as they try to climb back in.',{}],
     ['os_ropes_choke','choke on the bottom rope','{A} hangs {D}’s throat over the bottom rope and drops on it while the referee counts.',{rv:['{D} drags {A} off the apron by the leg, and {A} lands against the barricade!'],part:'neck',crowd:-2,cost:1,styles:'BY'}],
     ['os_apron_kick','kick from the apron','{A} kicks {D} in the head from the apron!',{crowd:4,cost:2.2,styles:'S'}],
     ['os_count_tease','race against the count','{A} rolls in at eight. {D} only just beats the count!',{rev:false,zone:'standing',crowd:5,cost:1,next:[['strike_trade',2],['clothesline',2],['counter_strike',2]],block:false}]
    ]},
   heel:{requires:'standing',zone:'standing',down:null,cost:.7,lift:null,crowd:-2,styles:'BY',
    from:['strike_trade','lockup','clean_break','corner_push','cheap_shot','opponent_study','crowd_pose','taunt','false_handshake'],
    next:[['strike_trade',2],['corner_whip',1],['clothesline',1],['cheap_shot',1]],link:[['strike',1],['ground',0]],
    rev:{lines:['{D} sees the {name} coming and makes {A} pay for it!','{D} ignores the {name} and fires back with a flurry of punches!','The referee catches the {name}, and {D} uses the argument to strike back!'],zone:'standing',down:null,cost:1,crowd:4,next:[['strike_trade',2],['clothesline',2],['counter_strike',1]]},
    moves:[
     ['hl_hair_pull','hair pull','{A} drags {D} across the ring by the hair while the referee warns them.',{rv:['{D} grabs {A}’s wrist, breaks the grip on the hair and fires back!']}],
     ['hl_ref_argue','argument with the referee','{A} argues with the referee about the count while {D} recovers.',{rv:['While {A} is arguing with the referee, {D} spins them around and lands a right hand!'],cost:-1.2,next:[['circle',2],['probe_strike',2]]}],
     ['hl_stall','stalling','{A} slides under the bottom rope and takes a walk around ringside. The crowd boos.',{rv:['{D} has had enough of the stalling, follows {A} to the floor and throws them back into the ring!'],cost:-1.8,crowd:-3,next:[['lockup',2],['circle',2]]}],
     ['hl_thumb','thumb to the eye','{A} jabs a thumb into {D}’s eye.',{rv:['{D} blocks the thumb to the eye and answers with a punch of their own!']}],
     ['hl_low_blow_tease','kick to the knee','{A} kicks {D} in the knee while they are distracted.',{rv:['{D} catches the kick to the knee and spins {A} around into a forearm!'],part:'leg',focus:1}],
     ['hl_rope_leverage','grab at the ropes','{A} grabs the ropes for extra leverage behind the referee’s back.',{rv:['The referee kicks {A}’s hand off the ropes, and {D} takes full advantage!'],cost:.9}],
     ['hl_mock','mockery','{A} copies {D}’s signature pose. The crowd is furious.',{rv:['{D} is not amused by the mockery and catches {A} mid-pose with a forearm!'],cost:-.6,crowd:-3,next:[['counter_strike',3],['cheap_shot',1]]}],
     ['hl_choke_shirt','choke with the tape','{A} chokes {D} with the wrist tape while the referee counts.',{rv:['The referee pulls {A} off the choke, and {D} comes back swinging!'],part:'neck'}],
     ['hl_bite','bite','{A} bites {D}’s forehead. The referee warns {A} again.',{rv:['{D} shoves {A} away from the bite and fires back with a headbutt!']}],
     ['hl_rake','rake across the eyes','{A} rakes {D}’s eyes to stop the comeback.',{rv:['{D} blocks the rake across the eyes and answers with a forearm!']}],
     ['hl_fake_injury','faked injury','{A} clutches their knee. When {D} checks on them, {A} attacks!',{rv:['{D} does not fall for the faked injury and catches {A} with a kick as they spring up!'],after:.4,crowd:-4,next:[['pn_small_package',1],['clothesline',2]]}],
     ['hl_beg','plea for mercy','{A} backs into the corner, begging {D} to stop. {D} hesitates.',{rv:['{D} ignores the begging, drags {A} out of the corner and lets fly!'],cost:-.8,next:[['hl_thumb',2],['cheap_shot',2],['counter_strike',2]]}],
     ['hl_distraction_apron','apron distraction','{A} leans on the apron and distracts the referee.',{rv:['The referee ignores the distraction, and {D} catches {A} looking the wrong way!'],cost:-.5,next:[['cheap_shot',2],['hl_thumb',1]]}],
     ['hl_strut','strut','{A} struts around the ring as if the match is already won.',{rv:['{D} interrupts the strut with a forearm to the back of the head!'],cost:-1,crowd:-2,next:[['counter_strike',3],['probe_strike',2]]}]
    ]},
   fire:{requires:'standing',zone:'standing',down:null,cost:1.8,lift:null,crowd:4,styles:'YB',
    from:['hope_elbows','dramatic_rally','counter_rollup','submission_roll','stand_reset','hope_elbows_standing','handstand_escape','rope_break'],
    next:[['clothesline',2],['strike_trade',2],['corner_whip',1]],link:[['strike',1],['neck',1],['power',1]],
    rev:{lines:['{A} starts to fire up, but {D} cuts the comeback off with a knee to the gut!','{D} rakes the eyes and stops {A}’s rally before it can start!','{D} sees the comeback coming and drops {A} with a thumb to the throat!'],zone:'mat',down:'d',cost:1,crowd:-1,next:[['mat_hold',2],['target_hold',2],['gd_stomp',1]]},
    moves:[
     ['fr_no_sell','no-sell','{A} takes three forearms from {D} and does not move.',{after:.5,crowd:5,cost:1.2}],
     ['fr_punch_flurry','comeback punches','{A} fires back with a flurry of punches. The crowd counts along!',{crowd:5}],
     ['fr_ten_punches','punches in the corner','{A} rains down punches from the second rope as the crowd counts to ten!',{requires:'corner',zone:'corner',crowd:5,from:['corner_whip','corner_strikes']}],
     ['fr_double_clothesline','double clothesline','{A} and {D} hit each other with clotheslines at the same time. Both are down!',{rev:false,zone:'mat',down:'d',crowd:5,after:.5,cost:2.4,next:[['double_down_count',4]]}],
     ['fr_shake_ropes','rope-shaking rally','{A} rises and shakes the ropes. The crowd is behind them!',{after:.5,crowd:6,cost:.6,next:[['clothesline',3],['fr_punch_flurry',2]]}],
     ['fr_second_wind','second wind','{A} beats the count, staggers up and starts firing back.',{after:.55,crowd:5,cost:-.8}],
     ['fr_crowd_clap','crowd clap','{A} gets the crowd clapping as they fight back to their feet.',{crowd:5,cost:.4}],
     ['fr_atomic_drop','atomic drop','{A} hoists {D} up and drops them tailbone-first across the knee!',{part:'back',lift:26,cost:2.2,crowd:3,next:[['clothesline',3],['corner_whip',1]]}],
     ['fr_back_body_drop','back body drop','{A} catches {D} charging in and flips them over with a back body drop!',{zone:'mat',down:'d',crowd:4,cost:1.8,from:['rope_run','duck_rebound','rope_rebound']}],
     ['fr_flying_forearm','flying forearm','{A} bounces off the ropes and flattens {D} with a flying forearm!',{zone:'mat',down:'d',crowd:4,cost:2.2}],
     ['fr_inverted_atomic','inverted atomic drop','{A} drops {D} groin-first across the knee with an inverted atomic drop!',{lift:24,cost:2,crowd:3}],
     ['fr_hulk_kick','running boot','{A} charges in and lands a running boot!',{zone:'mat',down:'d',crowd:4,cost:2,after:.5}],
     ['fr_mounted_comeback','mounted punches on the mat','{A} jumps on {D} and throws punches as the crowd cheers.',{zone:'mat',down:'d',crowd:4,cost:1.6}],
     ['fr_fight_on_knees','strikes on the knees','{A} and {D} trade blows on their knees, slowly rising to their feet together.',{crowd:5,after:.5,cost:1.8}],
     ['double_down_count','double count','Both wrestlers are down. The referee counts… FOUR… FIVE… SIX… and they both stir.',{rev:false,requires:'mat',zone:'standing',down:null,crowd:4,cost:-2.2,block:false,next:[['fr_fight_on_knees',2],['strike_trade',3],['st_fighting_spirit',2]]}]
    ]},
   rest:{requires:'mat',zone:'mat',down:'d',cost:-.6,lift:null,crowd:0,focus:1,styles:'TY',
    from:['mat_hold','target_hold','mat_takedown','arm_drag','ch_headlock_takedown','ch_snapmare','hope_cutoff','grounded_switch'],
    next:[['hope_elbows',3],['mat_scramble',2],['rope_crawl',2],['target_hold',1]],link:[['submission',1],['ground',1]],
    rev:{lines:['{D} fights up to their feet with the crowd behind them and breaks the {name}!','{D} elbows free of the {name}!'],zone:'standing',down:null,cost:1.2,crowd:4,next:[['strike_trade',2],['counter_strike',2],['fr_punch_flurry',1]]},
    blk:{zone:'mat',lines:['{D} pushes up to a knee in the {name}, but {A} drags them back down.','The referee checks {D}’s arm in the {name}; it drops twice, then stays up!'],next:[['hope_elbows',2],['mat_scramble',1]]},
    moves:[
     ['rs_side_headlock','side headlock on the mat','{A} grinds a side headlock on the mat and slows the pace.',{part:'neck'}],
     ['rs_armbar_rest','rest armbar','{A} keeps a loose armbar and catches a breath while working {D}’s arm.',{part:'arm'}],
     ['rs_body_scissors','body scissors','{A} wraps the legs around {D}’s middle and squeezes.',{part:'ribs'}],
     ['rs_nerve_hold','shoulder nerve hold','{A} squeezes the base of {D}’s neck in a nerve hold.',{part:'neck',styles:'Y'}],
     ['rs_front_chancery','front chancery','{A} keeps {D}’s head trapped under the arm and grinds it.',{part:'neck'}],
     ['rs_leg_lace','leg lace','{A} ties up {D}’s legs and leans back, keeping them pinned down.',{part:'leg',styles:'T'}],
     ['rs_seated_chinlock','seated chinlock','{A} drives a knee between {D}’s shoulder blades and pulls the chin.',{part:'back'}],
     ['rs_hammerlock_mat','hammerlock on the mat','{A} holds {D}’s arm behind their back on the mat.',{part:'arm',styles:'T'}],
     ['rs_cover_rest','lateral press','{A} lays across {D} for a lateral press, mostly to slow things down. Kick-out at one.',{rev:false,block:false,after:.3,crowd:1}],
     ['rs_reverse_chinlock','reverse chinlock','{A} sits behind {D} and pulls back with a reverse chinlock.',{part:'neck',styles:'Y'}],
     ['rs_mat_stretch','grounded stretch','{A} stretches {D} across the canvas, keeping them down without spending energy.',{part:'back'}],
     ['rs_wrist_mat','wrist control on the mat','{A} holds {D}’s wrist down and keeps them flat on the mat.',{part:'arm',styles:'T'}]
    ]},
   lucha:{agile:1,requires:'standing',zone:'mat',down:'d',cost:2.2,lift:null,crowd:3,styles:'S',
    from:['rope_run','rope_rebound','duck_rebound','springboard_feint','ch_drop_down','counter_strike'],
    next:[['stand_reset',3],['rope_run',1],['springboard_rise',1],['early_cover',1]],link:[['lucha',1],['dive',0]],
    rev:{lines:['{D} catches {A} out of the {name} and slams them down!','{D} stops the {name} halfway and drops {A} on their back!'],zone:'mat',down:'d',cost:1.6,crowd:3,next:[['mat_hold',2],['stand_reset',3]]},
    blk:{zone:'standing',lines:['{D} reads the {name} and stays on their feet. {A} lands, and they face each other again.','{A} goes for the {name}, but {D} stops and backs off.'],next:[['circle',2],['strike_trade',1]]},
    moves:[
     ['lc_hurricanrana','hurricanrana','{A} leaps, scissors {D}’s head and flips them with a hurricanrana!',{part:'neck',crowd:4}],
     ['lc_headscissors','tilt-a-whirl headscissors','{A} swings around {D}’s body and takes them over with headscissors!',{}],
     ['lc_arm_drag_wheel','cartwheel into an arm drag','{A} cartwheels around {D} and hits an arm drag!',{part:'arm'}],
     ['lc_tornillo','tornillo','{A} spins forward through the air into a tornillo!',{cost:3,crowd:5,after:.45,risk:1}],
     ['lc_dropkick_flip','backflip into a dropkick','{A} backflips away from {D} and lands a dropkick!',{cost:2.6,crowd:4}],
     ['lc_rana_pin','hurricanrana into a pin','{A} flips {D} with a hurricanrana and rolls into a pin! TWO! {D} kicks out!',{after:.45,crowd:5,nearfall:1}],
     ['lc_handspring','handspring elbow','{A} handsprings off the ropes into a back elbow!',{cost:2.8,crowd:4,after:.35}],
     ['lc_wheelbarrow','wheelbarrow bulldog','{A} jumps onto {D}’s back and drives them face-first into the mat!',{part:'neck',crowd:4}],
     ['lc_rope_walk','rope walk','{A} runs along the top rope and comes down on {D} with a crossbody!',{cost:3.2,crowd:6,after:.5,risk:1}],
     ['lc_head_kick','head kick','{A} kicks {D} in the head!',{crowd:4}]
    ]},
   rope:{requires:'standing',zone:'standing',down:null,cost:1.4,lift:null,crowd:2,styles:'SB',
    from:['rope_run','rope_rebound','shove_ropes','corner_whip','strike_trade','duck_rebound'],
    next:[['strike_trade',2],['rope_run',1],['clothesline',1]],link:[['rope',1],['running',2]],
    rev:{lines:['{D} ducks under, and {A}’s momentum carries them over the top rope to the floor!','{D} pulls the top rope down, and {A} tumbles out to the floor!'],zone:'outside',down:null,cost:1.4,crowd:4,next:[['floor_regroup',2],['roll_inside',2]]},
    moves:[
     ['rp_hangman','hangman neckbreaker on the ropes','{A} snaps {D}’s neck across the top rope!',{part:'neck',crowd:3,cost:1.8}],
     ['rp_slingshot','slingshot back into the ring','{A} launches {D} into the bottom rope with a slingshot!',{part:'neck',cost:1.6}],
     ['rp_drop_kick_ropes','dropkick on the ropes','{A} dropkicks {D}, who is draped over the middle rope!',{crowd:3,cost:2}],
     ['rp_tiger_feint','feint kick through the ropes','{A} fakes a kick through the ropes, and {D} reels backwards!',{agile:1,crowd:4,cost:2.4,after:.35,styles:'S'}],
     ['rp_ropes_choke','choke on the middle rope','{A} hangs {D} across the middle rope and chokes them until four.',{rv:['{D} kicks free of the ropes and sends {A} tumbling through them to the floor!'],part:'neck',crowd:-2,cost:.8,styles:'BY'}],
     ['rp_rebound_lariat','rebound lariat','{A} bounces off the ropes and flattens {D} with a lariat!',{zone:'mat',down:'d',part:'neck',crowd:3,cost:2.2}],
     ['rp_springboard_feint','fake springboard','{A} jumps to the apron, fakes a springboard and catches {D} with a kick!',{agile:1,crowd:3,cost:1.6,styles:'S'}],
     ['rp_second_rope_elbow','elbow from the middle rope','{A} steps onto the middle rope and drops an elbow on {D}!',{zone:'mat',down:'d',cost:2,crowd:3}],
     ['rp_skin_cat','skin-the-cat','{A} goes over the top, holds the rope and swings back in!',{agile:1,crowd:5,cost:2,after:.3,styles:'S'}],
     ['rp_rope_hang','tie-up in the ropes','{A} ties {D}’s arms in the ropes and hits them.',{rv:['{D} pulls an arm free of the ropes and knocks {A} out to the floor!'],part:'ribs',focus:1,crowd:-1,styles:'B'}]
    ]},
   running:{requires:'standing',zone:'mat',down:'d',cost:2.2,lift:null,crowd:2,styles:'BS',
    from:['rope_run','rope_rebound','duck_rebound','corner_escape','rebound_counter','ch_drop_down'],
    next:[['stand_reset',3],['cover',1],['mat_hold',2]],link:[['ground',1],['pin',0]],
    rev:{lines:['{D} sidesteps the {name}, and {A} runs into the ropes!','{D} drops to the mat, and the {name} misses completely!','{D} leapfrogs the {name} and turns to face {A}!'],zone:'standing',down:null,cost:1,crowd:2,next:[['clothesline',2],['strike_trade',2],['counter_strike',1]]},
    moves:[
     ['rn_knee','running knee','{A} bounces off the ropes and drives a knee into {D}!',{crowd:3}],
     ['rn_crossbody','running crossbody','{A} jumps at {D} with a running crossbody!',{next:[['early_cover',2]]}],
     ['rn_spear','spear','{A} explodes across the ring and spears {D} in half!',{part:'ribs',cost:3,crowd:5,after:.45}],
     ['rn_flying_shoulder','flying shoulder block','{A} leaps and drives a shoulder into {D}.',{}],
     ['rn_elbow','running elbow','{A} rebounds off the ropes and smashes an elbow into {D}.',{}],
     ['rn_dropkick','running dropkick','{A} hits the ropes and catches {D} with a dropkick!',{crowd:3}],
     ['rn_thesz','Thesz press','{A} leaps on {D} with a Thesz press and rains down punches!',{crowd:3,after:.3}],
     ['rn_lariat','running lariat','{A} hits the ropes and comes back with a huge lariat!',{part:'neck',cost:2.6,crowd:4}],
     ['rn_hip_attack','running hip attack','{A} rebounds off the ropes and hits {D} with a hip attack!',{}],
     ['rn_seated_senton','seated senton','{A} flips over {D} and lands a seated senton!',{agile:1,styles:'S',cost:2.4,crowd:3}],
     ['rn_cannonball_mid','running cannonball','{A} cannonballs into {D} in the middle of the ring!',{cost:2.6,crowd:3,styles:'B'}],
     ['rn_bicycle_knee','bicycle knee','{A} leaps and switches legs mid-air, driving a knee into {D}!',{cost:2.6,crowd:4,after:.45}]
    ]}
  };
  // Hubs that the families need. These are ordinary graph nodes with original lines.
  node('top_follow','{A} follows {D} up the turnbuckles. Both are balanced on the top rope.',{requires:'corner',zone:'top',down:null,cost:1.8,risk:true,after:.45,next:[]});
  node('floor_regroup','{D} rolls to the floor to recover. {A} measures the distance from inside the ring.',{requires:'outside',zone:'outside',cost:-.4,next:[e('roll_inside',2),e('floor_brawl',2)]});
  node('hope_elbows_standing','{D} fights the hold with elbows to {A}’s head. The crowd is behind {D}.',{zone:'standing',down:null,crowd:3,next:[e('counter_strike',3),e('strike_trade',2)]});
  node('knee_strike_block','{A} keeps hold and drives knees into {D}’s ribs to soften them up.',{focus:1,cost:1,next:[e('snap_suplex',2),e('strike_trade',2)]});
  // Snapshot the hand-authored flow so the catalog can never drown it out.
  const authored=Object.fromEntries(Object.entries(A).map(([id,n])=>[id,new Set(n.next.map(x=>x[0]))]));
  const famOf={},members={};
  const counts={moves:0,reversals:0,blocks:0};
  for(const [fid,f] of Object.entries(F)){
   members[fid]=[];
   f.moves.forEach(([id,name,line,o={}])=>{
    const requires=o.requires||f.requires,zone=o.zone||f.zone,down=o.down!==undefined?o.down:(o.zone&&o.zone!=='mat'&&o.zone!=='outside'?null:f.down);
    const lift=o.lift!==undefined?o.lift:f.lift;
    node(id,line,{requires,zone,down,next:[...(o.next||[]),...f.next].map(([t,w])=>e(t,w)),
     cost:o.cost??f.cost,lift:lift??null,crowd:o.crowd??f.crowd,focus:o.focus??f.focus??0,
     part:o.part??f.part??null,after:o.after??f.after??0,risk:!!(o.risk??f.risk),nearfall:!!(o.nearfall??f.nearfall),agile:!!(o.agile??f.agile),
     styles:sty(o.styles||f.styles),family:fid,name});
    famOf[id]=fid;members[fid].push(id);counts.moves++;
    // Not everything is an 'attempt' that can be reversed (a kip-up, a double count). Stationary
    // offence and a few awkward names get their own wording instead of the family template.
    const rv=f.rev,rid=id+'_rev',
     // A standing submission's defence must be possible during its standing
     // attempt; the mat-submission family default cannot teleport the counter.
     rreq=fid==='submission'&&requires==='standing'?requires:rv.requires||requires,
     hasRev=o.rev!==false;
    if(hasRev){
     const words=o.rv||(o.still&&rv.still)||rv.lines;
     node(rid,words.map(t=>t.replace(/\{name\}/g,name)),{requires:rreq,reverse:true,zone:rv.zone,down:rv.down,
      next:rv.next.map(([t,w])=>e(t,w)),cost:rv.cost,crowd:rv.crowd,family:fid,name,counterOf:id,after:o.after??f.after??0});
     counts.reversals++;
    }
    if(f.blk&&o.block!==false){
     const bz=f.blk.zone||(requires==='top'?'standing':requires);
     node(id+'_blk',f.blk.lines.map(t=>t.replace(/\{name\}/g,name)),{requires,zone:bz,down:bz==='mat'?'d':null,
      next:[...(hasRev?[e(rid,1.5)]:[]),...f.blk.next.map(([t,w])=>e(t,w))],cost:Math.max(.6,(o.cost??f.cost)*.45),family:fid,name,blockOf:id,blockLift:lift??null,after:o.after??f.after??0});
     counts.blocks++;
    }
   });
  }
  // Wire setups -> moves (each move gets three deterministic entry points) and
  // moves -> other families' follow-ups, so the vocabulary forms one connected graph.
  const add=(from,to,w)=>{const n=A[from];if(!n||!A[to]||from===to)return;const hit=n.next.find(x=>x[0]===to);if(hit)hit[1]=Math.max(hit[1],w);else n.next.push([to,w]);};
  for(const [fid,f] of Object.entries(F)){
   f.moves.forEach(([id,,,o={}],i)=>{
    const pool=(o.from||f.from).filter(s=>A[s]);
    const k=Math.min(o.from?pool.length:3,pool.length),start=hash(id)%Math.max(1,pool.length);
    for(let j=0;j<k;j++){
     const src=pool[(start+j*7)%pool.length];
     const base=o.from?.9:.6;
     add(src,id,base);
     if(A[id+'_rev'])add(src,id+'_rev',base*.5);
     if(A[id+'_blk'])add(src,id+'_blk',base*.35);
    }
    for(const [tf,count] of f.link){
     const list=members[tf]||[];if(!list.length||!count)continue;
     for(let j=0;j<count;j++){
      const to=list[(hash(id+tf+j))%list.length];
      if(A[to].requires===A[id].zone||A[to].requires==='any')add(id,to,1);
     }
    }
   });
  }
   // Only this small reviewed subset becomes playable; Phase 2 proposals
   // are NEVER auto-imported into the match graph.
   for(const link of [...TECHNIQUE_PILOT,...TECHNIQUE_EXPANSION,...TECHNIQUE_TRANCHE2,...TECHNIQUE_DEPTH,...TECHNIQUE_AUDIT24_LINKS]){
    const source=A[link.from],target=A[link.to];
    if(!source||!target||source.zone!==target.requires)
     throw Error('Curated impossible technique link: '+link.from+' -> '+link.to);
    if(link.kind==='counter'&&target.counterOf!=='ch_single_leg')
     throw Error('Phase 3 counter needs the intended move-specific reversal');
    add(link.from,link.to,link.weight);
   }
   // Distinguish genuinely introduced Phase 9 edges from links that were
   // already present and merely reweighted; capture BEFORE adding each link.
   for(const link of TECHNIQUE_CHAINS){
    const source=A[link.from],target=A[link.to];
    if(!source||!target||source.zone!==target.requires)
     throw Error('Curated impossible technique link: '+link.from+' -> '+link.to);
    if(!source.next.some(([to])=>to===link.to))
     introducedPhase9.add(link.from+'>'+link.to);
    add(link.from,link.to,link.weight);
   }
  // A few climbing hubs and a superplex route for the bigger spots.
  for(const src of ['corner_strikes','corner_whip','cn_chops','cn_mounted_punches','cn_face_buckle'])add(src,'top_follow',.9);
  A.top_follow.next=members.superplex.flatMap(id=>[e(id,1),e(id+'_rev',.5),...(A[id+'_blk']?[e(id+'_blk',.35)]:[])]);
  // Catalog edges added to an authored node may carry at most half of its original weight.
  for(const [id,orig] of Object.entries(authored)){
   const n=A[id];if(!orig.size)continue;
   const base=n.next.filter(x=>orig.has(x[0])).reduce((t,x)=>t+x[1],0),extra=n.next.filter(x=>!orig.has(x[0])).reduce((t,x)=>t+x[1],0);
   if(extra>base*.5){const k=base*.5/extra;for(const x of n.next)if(!orig.has(x[0]))x[1]=Math.round(x[1]*k*1000)/1000;}
  }
  add('outside_toss','floor_regroup',1.5);add('pw_bearhug','hope_elbows_standing',1);
  add('rope_run','os_ropes_backdrop',.6);add('strike_trade','os_ropes_backdrop',.6);
  return {F,famOf,members,counts};
 })();
 return CAT;
}
root.OfficeMatchCatalog={build};
})(typeof window!=='undefined'?window:globalThis);
