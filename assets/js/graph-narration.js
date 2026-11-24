/* THE OFFICE — graph narration and booth history.
   Behaviour-preserving extraction: the action roll still uses exactly one M.r()
   at the original call site; subsequent variants use saved graph counters. */
(function(root){'use strict';
function install($d,A){
 const ACTION_NARRATION_VARIANTS={
  // v0.6.4: fixed-seed action-specific repeat witnesses; all lines preserve the
  // precise graph result, actor direction and position rather than filler.
  headlock:[
   '{A} draws {D} into a standing side headlock and holds the pressure.',
   '{D} reaches for the grip as {A} keeps the headlock cinched in.',
   '{A} keeps {D} trapped at the shoulder in a side headlock.',
   '{A} adjusts the side headlock; {D} tries to work the hands apart.',
   '{D} is held close under {A}’s arm in a standing headlock.',
   '{A} keeps the head-and-arm position while {D} resists.',
   '{D} bends into the hold as {A} controls the side headlock.',
   '{A} maintains head control without yet taking {D} off their feet.',
   '{A} tightens the side headlock with {D} still standing.',
   '{D} tries to turn towards {A}, but the headlock stays on.'
  ],
  taunt:[
   '{A} beckons {D} forward; {D} holds their distance.',
   '{A} spreads their hands and waits for {D} to commit to a challenge.',
   '{D} watches as {A} invites a response with an open-armed taunt.',
   '{A} makes a show of waiting for {D}; neither commits yet.',
   '{A} stands their ground, gesturing for {D} to come forward.',
   '{D} declines to rush in while {A} plays for a reaction.',
   '{A} taunts {D} across the ring. {D} keeps their guard up.',
   '{A} calls {D} on; {D} is not offering an easy opening.'
  ],
  os_ropes_backdrop:[
   '{A} lifts {D} at the ropes and sends them over to the floor with a backdrop!',
   '{D} is carried over the ropes by {A}’s high backdrop and lands at ringside.',
   '{A} gets under {D} and backdrops them out of the ring!',
   '{D} goes over the ropes and down to the floor after {A}’s backdrop.',
   '{A} turns a rope-side exchange into a backdrop that sends {D} outside!',
   '{D} is sent to ringside by {A}’s backdrop over the ropes.',
   '{A} completes the high backdrop and {D} lands on the floor!',
   '{D} is lifted over the ropes by {A}, crashing down at ringside.'
  ],
  armbar_roll:[
   '{D} rolls through the armbar pressure and reverses the hold on the mat.',
   '{A} loses the armbar advantage as {D} rolls underneath and turns the grip.',
   '{D} turns towards the trapped arm and switches the mat leverage.',
   '{D} uses a roll to counter {A}’s arm pressure without standing up.',
   '{A} tries to keep the armbar, but {D} reverses the mat position.',
   '{D} rotates across the canvas and changes the direction of the arm hold.',
   '{D} rolls under the trapped arm and comes away with the counter.',
   '{A} loses control when {D} rolls through the grounded armbar.'
  ],
  go_behind:[
   '{A} ducks to {D}’s back and secures a waist grip.',
   '{A} moves behind {D} and holds on around the waist.',
   '{D} is forced to defend a rear waist grip as {A} circles behind.',
   '{A} changes the angle of the tie-up and takes rear position on {D}.',
   '{A} slips around {D} and locks their hands at the waist.',
   '{D} reaches to peel the hands as {A} holds the go-behind.',
   '{A} gets behind {D}, maintaining control at the waist.',
   '{D} is still standing as {A} secures rear waist control.'
  ],
  hope_cutoff:[
   '{A} meets {D}’s escape with a knee to the {part} and stops the rise.',
   '{D} tries to get up, but {A} catches the {part} with a knee.',
   '{A} interrupts {D}’s attempt to escape by driving a knee into the {part}.',
   '{D} cannot complete the comeback after {A} lands a knee to the {part}.',
   '{A} keeps {D} grounded with a sharp knee to the {part}.',
   '{D} starts to rise; {A} stops the movement with a knee to the {part}.',
   '{A} targets {D}’s {part} and cuts the escape short.',
   '{A} catches the attempted rise with a knee to {D}’s {part}.'
  ],
  leg_wrench:[
   '{A} traps {D}’s leg on the canvas and twists it against the joint.',
   '{D} tries to pull the leg clear, but {A} keeps the pressure on.',
   '{A} wrenches the leg while {D} remains grounded.',
   '{A} holds {D}’s leg bent and prevents an easy stand-up.',
   '{D} is kept on the mat by {A}’s twisting leg grip.',
   '{A} adjusts their hold and continues to torque {D}’s leg.',
   '{D} tries to turn towards the ropes; {A} keeps the leg trapped.',
   '{A} maintains the leg wrench, making it hard for {D} to get upright.'
  ],
  os_apron_ddt:[
   '{A} drops {D} with a DDT onto the edge of the ring apron!',
   '{D} takes a DDT from {A} against the hard apron at ringside.',
   '{A} secures the front facelock and drives {D} onto the apron with a DDT!',
   '{D} hits the ring apron after {A} completes the DDT.',
   '{A} plants {D} on the apron with a hard DDT!',
   '{D} cannot break the grip as {A} delivers a DDT onto the apron.',
   '{A} lands the apron DDT and {D} takes the impact!',
   '{A} follows through with a DDT on the apron against {D}!'
  ],
  missile_dropkick:[
   '{A} flies from the top rope and lands a missile dropkick on {D}!',
   '{D} is caught flush by {A}’s missile dropkick from the turnbuckle.',
   '{A} launches from the ropes, connecting with both feet on {D}.',
   '{D} is knocked down by a missile dropkick from the airborne {A}.',
   '{A} comes off the turnbuckles and drives {D} to the mat with a dropkick.',
   '{D} cannot evade the missile dropkick as {A} descends from the top.',
   '{A} lands a diving missile dropkick and {D} hits the canvas.',
   '{D} takes the full dropkick as {A} jumps from the top rope.'
  ],
  lockup:[
   '{A} steps into a collar-and-elbow tie-up while {D} braces for control.',
   '{D} keeps their stance as {A} works for position in the lock-up.',
   '{A} takes collar-and-elbow contact and {D} resists the pressure.',
   '{D} matches {A} in a standing tie-up; neither has a clean grip yet.',
   '{A} reaches for inside control as {D} squares up in the lock-up.',
   '{A} drives into a collar-and-elbow, with {D} pushing back.',
   '{D} absorbs the pressure of {A}’s tie-up without being taken down.',
   '{A} secures a collar-and-elbow hold while {D} holds their ground.'
  ],
  gd_rib_stomp:[
   '{A} drives a stomp into the grounded {D}’s ribs.',
   '{D} takes a short stomp to the ribs from {A} on the canvas.',
   '{A} plants a boot against {D}’s ribs, keeping them grounded.',
   '{D} covers the midsection as {A} lands a rib stomp.',
   '{A} strikes {D}’s ribs with a grounded stomp.',
   '{D} is on the mat as {A} stomps down into the ribcage.',
   '{A} steps in and stomps {D}’s ribs while they are down.',
   '{D} cannot get clear of {A}’s stomp to the ribs.'
  ],
  // Graph Lab's repeated-line audit identified these specific hotspots.
  // A counter remains a counter; an evasion is never narrated as a landing.
  duck_rebound:[
   '{D} bends under {A}’s lariat and rebounds at a different angle.',
   '{A} swings for the lariat; {D} ducks it and keeps running.',
   '{D} lowers their head under the arm and changes direction off the ropes.',
   '{A} misses high as {D} uses the rebound to move into clear space.',
   '{D} ducks the incoming clothesline and heads across the ring again.',
   '{D} slips past the lariat, turns and takes another running lane.'
  ],
  waist_escape:[
   '{D} separates the hands at the waist and moves behind {A}.',
   '{A} loses the waist grip as {D} turns out and takes rear position.',
   '{D} peels the fingers away, pivots and ends up behind {A}.',
   '{D} breaks the body lock and circles to {A}’s back.',
   '{A} reaches to keep the waistlock but {D} rotates free and switches behind.'
  ],
  target_strike:[
   '{A} works a short shot into {D}’s {part} and keeps them down on the mat.',
   '{D} protects the {part} as {A} strikes it again and holds the ground.',
   '{A} targets the {part} before drawing {D} further from the ropes.',
   '{D} is grounded while {A} adds another close-range shot to the {part}.',
   '{A} stays close and lands a compact strike to {D}’s {part}.'
  ],
  ch_rolling_wristlock:[
   '{A} rolls through while keeping {D}’s wrist trapped.',
   '{D} turns with the pressure as {A} maintains the rolling wristlock.',
   '{A} changes their angle without releasing the wrist.',
   '{D} tries to square up, but {A} completes the wristlock rotation.'
  ],
  ch_short_arm:[
   '{A} pulls free of {D}’s grip and resets the arm position.',
   '{D} loses the controlling hand as {A} slips clear.',
   '{A} rotates out from the grip and changes the tie-up.',
   '{A} breaks the short-arm contact before {D} can re-secure it.'
  ],
  pw_bearhug:[
   '{A} closes both arms around {D} and maintains a tight body squeeze.',
   '{D} tries to create space inside {A}’s bearhug.',
   '{A} adjusts the body lock and keeps {D} trapped in the bearhug.',
   '{D} strains against the grip as {A} tightens the bearhug.'
  ],
  apron_stand:[
   '{A} brings {D} towards the apron, both still fighting for position on the floor.',
   '{D} resists as {A} tries to turn them along the edge of the apron.',
   '{A} and {D} jockey for control beside the ring.',
   '{D} braces against the apron while {A} looks for a better grip.'
  ],
  probe_strike:[
   '{A} tests the distance with a forearm and {D} stays upright.',
   '{D} watches {A} throw a cautious opening forearm.',
   '{A} measures another strike; {D} does not give up their balance.',
   '{D} stays square as {A} sends a short probing shot.'
  ],
  springboard_evaded:[
   '{D} rolls out of the landing zone and {A} hits the canvas!',
   '{A} comes off the ropes but finds only canvas; {D} has moved clear.',
   '{D} escapes the springboard landing and takes over as {A} falls.',
   '{A} misses the springboard attack and {D} comes away in control.'
  ],
  top_follow:[
   '{A} climbs after {D} on the turnbuckles; neither has let go of their balance.',
   '{D} waits on the turnbuckle as {A} follows them up.',
   '{A} joins {D} high on the ropes and both steady themselves.',
   'Both wrestlers are perched on the turnbuckles as {A} takes the next step.'
  ],
  corner_whip:[
   '{A} sends {D} into the corner and follows the change of position.',
   '{D} is driven towards the turnbuckles by {A}’s Irish whip.',
   '{A} turns the standing exchange into a whip towards the corner.'
  ],
  strike_trade:[
   '{A} and {D} exchange sharp forearms, neither giving ground.',
   '{A} answers a shot from {D} and both stay on their feet.',
   '{D} fires back at {A}. The standing exchange continues.'
  ],
  double_down_count:[
   'Both wrestlers are down. The referee reaches four, five, six — they begin to stir.',
   'The official counts over both wrestlers. At six they are fighting to get up.',
   'Neither can get up at first. The referee reaches six before they start moving.'
  ],
  mat_takedown:[
   '{A} hooks the near leg and trips {D}, following to the mat.',
   '{D} widens their stance but {A} completes a clean leg trip.',
   '{A} takes {D} off balance with a well-timed takedown.'
  ],
  power_spinebuster:[
   '{A} catches {D} charging in and plants them with a spinebuster!',
   '{D} runs into a spinebuster from {A} and hits the mat hard.',
   '{A} turns {D}’s momentum into a heavy spinebuster!'
  ],
  mat_hold:[
   '{A} settles their weight on {D}, preventing an easy escape.',
   '{D} shifts their hips but {A} keeps top control.',
   '{A} maintains pressure on the mat while {D} searches for space.'
  ],
  headlock_takeover:['{A} uses the headlock to bring {D} down under control.','{D} loses their base as {A} takes the headlock to the mat.'],
  arm_drag:['{A} catches the arm and snaps {D} over with an arm drag.','{D} is pulled off balance by a sharp arm drag from {A}.'],
  shoulder_tackle:['{A} meets {D} off the ropes with a shoulder tackle.','{D} goes down under a well-timed shoulder tackle from {A}.'],
  snap_suplex:['{A} sets the grip and takes {D} over with a snap suplex.','{A} lifts cleanly and lands a crisp snap suplex on {D}.'],
  hip_toss:['{A} turns the tie-up into a hip toss on {D}.','{D} goes over the hip as {A} completes the throw.'],
  heavy_slam:['{A} scoops {D} and drives them down with a body slam.','{D} takes a heavy body slam after {A} catches the waist.'],
  mat_scramble:['{D} turns underneath {A} and reverses the mat position.','{D} finds the leverage to roll through and take control.'],
  rope_crawl:['{D} inches towards the bottom rope as {A} holds on.','{A} maintains the hold while {D} crawls for the ropes.'],
  roll_inside:['{A} pulls {D} back under the bottom rope before the ten-count.','{D} is returned to the ring as {A} follows inside.'],
  aerial_attack:['{A} comes off the top and connects with a diving elbow on {D}!','{D} cannot roll away before {A} lands the diving elbow.'],
  // Phase 4: avoid ten identical lock-ups, wrist counters, rope runs or
  // clotheslines in one match. Every variant keeps the same actors, outcome,
  // body part and action; only the commentary angle changes.
  lockup:[
   '{A} and {D} tie up collar-and-elbow. {A} leans in and {D} holds the centre.',
   '{A} takes the collar while {D} searches for inside wrist position.',
   'Another lock-up. {D} lowers their base as {A} tries to turn them.',
  ],
  wristlock:[
'{A} catches a wrist and turns {D} towards the trapped shoulder.',
'{A} keeps hold of {D}’s hand and rotates the wrist to take control.',
'{D} reaches to break contact, but {A} twists into wrist control.',
   '{A} turns {D}’s captured wrist, bringing their shoulders out of line.',
   '{A} keeps the wrist trapped while {D} tries to turn towards the pressure.',
   '{D} looks for a gap in the grip, but {A} maintains wrist control.',
   '{A} rotates {D}’s hand and keeps the arm under control.',
   '{A} draws {D} closer by the wrist and twists the forearm into position.',
   '{D} changes their footing while {A} keeps the wristlock secure.',
   '{A} adjusts the wristlock and prevents {D} from separating their hands.',
   '{A} tucks {D}’s wrist towards the shoulder and holds the position.',
   '{D} tries to straighten the elbow; {A} keeps the wrist turned.',
   '{A} changes the angle on the wristlock without releasing {D}.',
   '{A} takes the wrist to the outside, keeping {D} squarely in the grip.',
   '{D} braces against the pressure as {A} works the trapped wrist.',
   '{A} shifts their grip on {D}’s wrist and keeps control of the arm.',
   '{A} steps around the captured hand, extending the wristlock on {D}.',
   '{D} cannot yet separate the hands; {A} maintains the wrist hold.',
   '{A} rotates the wrist one more time, making {D} follow the grip.'
  ],
  wrist_escape:[
   '{D} rolls beneath the arm, reverses the pressure and takes the wrist.',
   '{D} steps through the trapped arm and turns the wristlock back on {A}.',
   '{A} loses the grip as {D} rotates free and secures the counter-wristlock.',
  ],
  arm_wringer:[
   '{A} wrings the arm again, walking {D} towards the shoulder pressure.',
   '{D} bends at the knees while {A} twists the captured wrist upwards.',
  ],
  rope_run:[
   '{A} runs the ropes and changes pace, trying to draw {D} out of position.',
   '{A} hits the near rope and comes back hard; {D} squares up for contact.',
   '{D} watches the rebound as {A} picks up speed across the ring.',
  ],
  rope_rebound:[
   '{A} rebounds sharply and checks {D}’s position on the way back.',
   '{D} adjusts their feet as {A} comes off the ropes for another pass.',
  ],
  clothesline:[
   '{A} swings through with a clothesline, knocking {D} onto the canvas.',
   '{D} tries to run through the contact; {A} catches them flush with a clothesline.',
   '{A} connects high across the chest and {D} hits the mat.',
  ],
  outside_toss:[
'{A} sends {D} over the top rope. {D} lands on the floor as the official begins the count.',
'{D} loses balance at the ropes and {A} sends them down to ringside.',
'{A} forces {D} out of the ring. The referee starts counting while {A} watches.',
   '{A} puts {D} through the ropes and onto the ringside floor.',
   '{D} is forced across the ropes by {A}, landing outside.',
   '{A} clears the ropes with {D} and sends them to ringside.',
   '{D} loses the struggle at the ropes and is sent to the floor by {A}.',
   '{A} pushes {D} out of the ring; the next exchange is at ringside.',
   '{A} drives {D} towards the ropes and sends them to the floor.',
   '{D} goes over the ropes after {A} takes control of the exchange.',
   '{A} sends {D} out by the ropes and looks down from inside the ring.',
   '{D} is deposited on the floor by {A} after the struggle at the ropes.',
   '{A} carries the pressure to the ropes and forces {D} outside.'
  ],
  floor_brawl:[
   '{A} joins {D} at ringside and lands a short shot beside the barricade.',
   '{D} covers up near the front row as {A} closes in with a forearm.',
   '{A} presses the advantage on the floor, keeping {D} away from the ring steps.',
  ],
  counter_strike:[
   '{D} slips beneath the blow and answers with a stiff elbow.',
   '{D} reads the incoming shot, blocks it and fires straight back.',
   '{A} overreaches; {D} makes them pay with a quick counter-strike.',
  ],
  grapple_trip:[
   '{A} changes levels, takes the leg and trips {D} onto the canvas.',
   '{D} attempts to widen their stance, but {A} finishes the leg takedown.',
   '{A} catches the near leg and follows {D} to the mat.',
  ],
  target_hold:[
   '{A} stays on the {part}, holding {D} in place while the referee checks the pressure.',
   '{D} turns towards the ropes, but {A} keeps the {part} isolated.',
   '{A} settles their weight and continues working {D}’s {part}.',
  ],
  waistlock:[
   '{A} circles to the back and locks both hands around {D}’s waist.',
   '{D} drops their hips to block the lift as {A} secures rear control.',
   '{A} clamps on a waistlock, forcing {D} to fight the hands.',
  ],
  crowd_pose:[
   '{A} pauses to draw a reaction. {D} stays alert instead of taking the bait.',
   '{A} looks towards the front row, allowing {D} a moment to reset.',
   '{A} takes a moment to showboat. {D} closes the distance carefully.'
  ],
  stand_reset:[
   '{A} gives {D} space to get back to their feet. Both reset their footing.',
   '{A} waits for {D} to stand, looking for the next opening.',
   'The wrestlers regain a standing position. {A} re-establishes distance.'
  ],
  finish_tease:[
   '{A} reaches for their finisher but {D} slips free before the hold is set.',
   '{D} recognises the finishing setup and pulls away from {A}.',
   '{A} signals for the decisive attack; {D} blocks the initial grip.'
  ],
  top_climb:[
   '{A} heads to the turnbuckle after putting {D} down, but checks the distance first.',
   '{A} climbs the ropes, watching whether {D} can recover.',
   '{A} goes to the top rope while {D} tries to get clear.'
  ],
  springboard_rise:[
'{A} springs onto the ropes, gauging the distance to {D}.',
'{A} steadies on the ropes with {D} still on the canvas.',
'{A} prepares to launch from the second rope.',
   '{A} sends {D} to the canvas and steps onto the middle rope.',
   '{A} has {D} down and takes position on the middle rope.',
   '{D} is grounded while {A} climbs onto the ropes to set up a springboard.',
   '{A} climbs to the middle rope and checks the distance to the fallen {D}.',
   '{A} steadies their feet on the ropes with {D} on the mat.',
   '{A} uses the downed {D} to gain space for a springboard setup.',
   '{D} is still on the canvas as {A} moves onto the middle rope.',
   '{A} holds the ropes for balance while looking down at {D}.',
   '{A} gains the middle rope and measures the space above the fallen {D}.',
   '{D} remains grounded while {A} sets their stance for a springboard.'
  ],
  cheap_shot:[
   '{A} takes an illegal shot while the referee is distracted; {D} is caught off guard.',
   'The referee misses a quick strike from {A} as {D} tries to defend.',
   '{A} sneaks in a cheap forearm on the break; {D} protests.'
  ],
  rope_rebound:[
   '{A} sends {D} to the ropes and prepares to meet them on the rebound.',
   '{D} runs the ropes under pressure from {A}.',
   '{A} sets their feet as {D} rebounds off the far ropes.'
  ],
  catch_breath:[
   '{A} backs away, conserving energy while {D} gets up.',
   '{A} takes a moment at range to recover before engaging {D}.',
   '{A} steadies their breathing; {D} cautiously waits for the next exchange.'
  ]
 };

 // The booth only remembers executed graph events, not attempted narration.
 // No gameplay random draw, physical rule or move weight is changed.
 // Booth-only state. Each text family advances when it is actually spoken.
 // It survives a save/restore but does not consume the gameplay RNG.
 function textureLine(g,key,lines){
  g.textureSequence??={};
  const count=g.textureSequence[key]||0;
  g.textureSequence[key]=count+1;
  return lines[count%lines.length];
 }
 const BROADCAST_NAMES={
  mat_takedown:'leg trip',grapple_trip:'single-leg trip',power_spinebuster:'spinebuster',
  arm_drag:'arm drag',headlock_takeover:'headlock takedown',hip_toss:'hip toss',
  shoulder_tackle:'shoulder tackle',snap_suplex:'snap suplex',heavy_slam:'body slam',
  clothesline:'clothesline',ankle_pick:'ankle pick',aerial_attack:'diving elbow',
  springboard_strike:'springboard crossbody',gutbuster:'gutbuster',
  ch_leg_trip:'leg trip',ch_double_leg:'double-leg takedown',
  ch_snapmare:'snapmare',fr_back_body_drop:'back body drop',
  fr_flying_forearm:'flying forearm',pw_running_powerbomb:'running powerbomb',
  sx_german:'German suplex',sx_brainbuster:'brainbuster'
 };
 const BROADCAST_FAMILIES={
  mat_takedown:'takedown',grapple_trip:'takedown',headlock_takeover:'takedown',
  arm_drag:'takedown',hip_toss:'takedown',ankle_pick:'takedown',
  ch_leg_trip:'takedown',ch_double_leg:'takedown',ch_snapmare:'takedown',
  power_spinebuster:'power',heavy_slam:'power',gutbuster:'power',
  shoulder_tackle:'running',clothesline:'running',snap_suplex:'suplex',
  aerial_attack:'aerial',springboard_strike:'springboard',
  fr_back_body_drop:'takedown',fr_flying_forearm:'running',
  pw_running_powerbomb:'power',sx_german:'suplex',sx_brainbuster:'suplex'
 };
 const BROADCAST_FAMILY_NAMES={
  takedown:'takedowns',chain:'chain takedowns',power:'power moves',
  suplex:'suplexes',running:'running knockdowns',aerial:'aerial landings',
  springboard:'springboard attacks',lucha:'lucha takedowns',
  neck:'neck attacks',ground:'grounded attacks',strike:'strikes',
  dive:'dives',superplex:'top-rope throws',fire:'comeback attacks'
 };
 function broadcastHistory(g,id,n,side){
  // Prior credit is strictly from the performed graph ledger. A counter,
  // block or a different wrestler using the move does not raise the count.
  const landed=g.events.filter(e=>e.id===id&&e.preControl===side&&!e.reverse);
  const answers=g.events.filter(e=>e.preControl===side&&e.reverse&&A[e.id]?.counterOf===id).length;
  return {count:landed.length+1,answers,
   label:BROADCAST_NAMES[id]||n.name,family:BROADCAST_FAMILIES[id]||n.family,
   impact:n.zone==='mat'&&n.down==='d'&&!n.reverse&&!n.counterOf&&
    !n.blockOf&&!n.nearfall&&n.family!=='pin'};
 }
 function broadcastAction(h,a,d,original){
  if(!h.impact||!h.label||h.count<3)return original;
  // One count establishes the pattern; future calls vary angle rather than
  // announcing an ever-growing spreadsheet of successful attempts.
  if(h.count===3)return a+' lands the '+h.label+' on '+d+' again — the third time it has worked.';
  if(h.count===4)return a+' goes back to the '+h.label+' and puts '+d+' down once more.';
  if(h.count===5)return 'Another '+h.label+' from '+a+'. '+d+' is back on the canvas.';
  if(h.count%4===0||h.count%4===3)return original;
  if(h.count%4===1)return a+' finds the '+h.label+' again. '+d+' takes another knockdown.';
  return d+' is caught with the '+h.label+' again from '+a+'. The tactic is still working.';
 }
 function broadcastInsight(M,g,h,n,side,attacker,defender){
  if(!h.impact||!BROADCAST_FAMILY_NAMES[h.family])return;
  const prior=g.events.filter(e=>{
   const node=A[e.id];return node&&!node.reverse&&e.preControl===side&&
    e.position==='mat'&&e.down===(side==='w'?'f':'w')&&
    (BROADCAST_FAMILIES[e.id]||node.family)===h.family;
  }).length,landings=prior+1;
  if(landings===5)$d.say(M,attacker.short+' has put '+defender.short+' down five times with '+
   BROADCAST_FAMILY_NAMES[h.family]+'. That is a clear pattern in the actual exchanges.',
   'story',{who:'colour'});
  if(landings===9)$d.say(M,attacker.short+' is still getting '+defender.short+
   ' to the canvas with '+BROADCAST_FAMILY_NAMES[h.family]+
   '. Nine successful knockdowns from that family tonight.',
   'story',{who:'colour'});
 }
 function broadcastCounter(M,g,n,side,attacker,defender){
  if(!n.reverse||!n.counterOf)return;
  const label=BROADCAST_NAMES[n.counterOf]||A[n.counterOf]?.name;
  if(!label)return;
  const prior=g.events.filter(e=>e.id===n.counterOf&&e.preControl===side&&!e.reverse).length;
  if(prior<2)return;
  const pastAnswers=g.events.filter(e=>
   e.preControl===side&&e.reverse&&A[e.id]?.counterOf===n.counterOf).length;
  if(pastAnswers===0)$d.say(M,defender.short+' has finally countered the '+label+
   ' after '+prior+' successful uses by '+attacker.short+'. That is a real answer to the pattern.',
   'story',{who:'colour'});
  else if(pastAnswers===1&&prior>=4)$d.say(M,defender.short+
   ' has now countered that '+label+' twice. '+attacker.short+
   ' cannot assume it will keep landing.','story',{who:'colour'});
 }

 // Exact-action loop protection is limited to the fourteen audited families.
 // It picks another *authored description of the same executed action*,
 // never an invented manoeuvre and never another gameplay RNG draw.
 const AUDITED_ACTION_REPEATS=new Set([
  'wristlock','outside_toss','springboard_rise','headlock','taunt',
  'os_ropes_backdrop','armbar_roll','go_behind','hope_cutoff','leg_wrench',
  'os_apron_ddt','missile_dropkick','lockup','gd_rib_stomp'
 ]);


 function arcWords(M,id,prev,keepRealControl,g,p){
  let words;
  if(id==='opening')words=M.planId==='brawl'?'{W} and {F} charge together. They start throwing hard forearms.':'{W} and {F} begin cautiously, testing their distance.';
  else if(id==='chain')words='{W} and {F} settle into a series of holds, escapes and counters.';
  else if(id==='shine')words='{F} reaches for control, but {W} catches the attack and turns the tables!';
  else if(id==='cutoff')words='{W} presses forward and gets caught. {F} reverses the attack and takes over!';
  else if(id==='control')words='{F} keeps {W} under pressure, deliberately slowing the contest.';
  else if(id==='hope')words='{W} starts to fight out of trouble. The crowd can sense an opening.';
  else if(id==='denial')words='{F} catches the attempted escape and cuts the rally short!';
  else if(id==='comeback')words='{F} rushes in once too often. {W} sidesteps and takes control!';
  else if(id==='resurgence')words='{W} keeps the pressure on. {F} struggles to find a way back.';
  else if(id==='exchange')words='Both wrestlers scramble to their feet. The advantage is there to be taken.';
  else if(id==='nearfall')words=M.o.stip==='submission'?'They know one opening could settle this. Every hold and escape matters.':'They know one mistake could settle this. Every cover now matters.';
  else if(id==='escalation')words='The pace rises as both wrestlers start looking for their big attacks.';
  else if(id==='stalling')words='Nobody wants to commit. One of them keeps finding reasons to stop the action, and the crowd is getting restless.';
  else if(id==='test_strength')words='{W} and {F} reach for each other’s hands. This is going to be a test of strength.';
  else if(id==='limb_work')words='{F} has found a target and will not let it go. Every move goes back to the same body part.';
  else if(id==='floor_heat')words='{F} takes the fight to the floor, where the referee can see less and the barricade hurts more.';
  else if(id==='rest_hold')words='{F} slows it right down with a hold, grinding {W} into the canvas. The crowd tries to rally {W}.';
  else if(id==='second_hope')words='{W} has not given up. The crowd sense another chance.';
  else if(id==='dive_sequence')words='{W} clears the ring. The crowd know what is coming next.';
  else if(id==='fighting_spirit')words='{W} and {F} meet in the middle. Neither will take a step back.';
  else if(id==='double_down')words='They collide, and both go down. The referee starts a count.';
  else if(id==='top_rope_battle')words='The action moves to the corner. Somebody is going up top.';
  else if(id==='submission_battle')words='It goes to the mat. Whoever finds a submission first could end this.';
  else if(id==='false_finish')words=M.o.stip==='submission'?'They are trading submission attempts and escapes. One locked-in hold could decide it.':'They are trading roll-ups and finishing attempts. Every count could be the last.';
  else words='{W} and {F} dig deep. The finishing sequence is close.';
  // Arc switches never teleport the wrestlers. Every needed reset is narrated.
  // The booth rotates variants through saved graph counters without a random
  // draw: changing the words must never change the match's selected moves.
  if(prev&&!keepRealControl){
   if(p.position==='outside'){
    g.outsideReturnCount=(g.outsideReturnCount||0)+1;
    const options=$d.noCountout(M)?[
     '{W} and {F} choose to return inside. They could have stayed on the floor.',
     'Both competitors step back through the ropes without count-out pressure.',
     '{W} and {F} return to the ring of their own accord.'
    ]:[
     '{W} and {F} beat the referee’s count and slide back into the ring.',
     'The referee is still counting as {W} and {F} scramble back inside.',
     '{W} and {F} make it through the ropes before the count reaches ten.',
     'Both wrestlers get back into the ring in time to avoid the count-out.'
    ];
    $d.say(M,$d.fill(M,options[(g.outsideReturnCount-1)%options.length]));
   }
   else if(p.position==='top'){
    const returning=p.down==='w'?'F':p.down==='f'?'W':null;
    const who=returning?'{'+returning+'}':'The wrestler on the ropes';
    const lines=[
     who+' steps down from the turnbuckle as the wrestlers reset.',
     who+' returns to the canvas before the next exchange.',
     who+' leaves the ropes and regains a standing position.',
     who+' drops back to the mat and prepares to re-engage.',
     who+' climbs down from the turnbuckle; the contest continues on the feet.',
     who+' abandons the high position and resets in the ring.'
    ];
    $d.say(M,$d.fill(M,textureLine(g,'arc-return-top',lines)),'play',
     {textureId:'arc-return-top'});
   }
   else if(p.position==='corner'){
    const lines=[
     '{W} and {F} leave the corner and return to open ring.',
     'They break away from the turnbuckles and reset their footing.',
     'Both wrestlers step clear of the corner before re-engaging.',
     '{W} and {F} separate at the ropes and move back to the centre.',
     'The exchange resets with both competitors away from the turnbuckles.',
     'Both leave the corner and square up again in the ring.'
    ];
    $d.say(M,$d.fill(M,textureLine(g,'arc-return-corner',lines)),'play',
     {textureId:'arc-return-corner'});
   }
   else if(p.position==='mat'){
    // An arc return is a narrated physical reset, not a new move. Rotate
    // descriptions without changing control, down state or gameplay RNG.
    g.matReturnCount=(g.matReturnCount||0)+1;
    const stand=p.down==='w'?'W':p.down==='f'?'F':null;
    const who=stand?'{'+stand+'}':null;
    const lines=stand?[
     who+' pushes back up off the mat as the next exchange begins.',
     who+' finds their footing and forces the fight back upright.',
     who+' rolls to a knee, then rises to restart the exchange.',
     who+' stands carefully after the previous exchange.',
     who+' plants a hand on the canvas and gets back to their feet.',
     who+' regains a standing position and resets the distance.',
     who+' rises from the mat and squares up for the next exchange.',
     who+' uses a knee to push upright after the grounded exchange.',
     who+' gets off the canvas and returns to a standing exchange.',
     who+' gets to their feet and steps clear of the previous hold.',
     who+' comes off the canvas and faces the opponent again.',
     who+' stands up and re-establishes their footing.',
     who+' pushes to both feet and prepares to re-engage.',
     who+' climbs back to standing after the scramble on the mat.',
     who+' returns to two feet before the next exchange begins.',
     who+' rolls onto a knee, then comes upright to continue.'
    ]:[
     'Both wrestlers push back up off the mat as the next exchange begins.',
     'They separate on the canvas and regain their feet.',
     'Both competitors rise, measuring the distance between them.',
     'The action returns to a standing exchange as they regroup.',
     'Both competitors get off the canvas and return to their feet.',
     'The two of them stand up and reset their distance.',
     'They leave the mat exchange behind and square up again.',
     'Both stand, facing each other for another exchange.'
    ];
    $d.say(M,$d.fill(M,lines[(g.matReturnCount-1)%lines.length]),'play',
     {textureId:stand?'arc-return-mat-single':'arc-return-mat-both'});
   }
  }
  // Rotate through context-appropriate arc commentary on repeated visits.
  // Avoid an escalating match announcing the same pace change ten times.
  const ARC_NARRATION_VARIANTS={
   control:[
    '{F} keeps {W} under pressure, deliberately slowing the contest.',
    '{F} maintains the advantage as {W} searches for a way back in.',
    '{W} is forced to defend while {F} dictates the tempo.',
    'The initiative stays with {F}, who is giving {W} little room to attack.'
   ],
   denial:[
    '{F} catches the attempted escape and cuts the rally short!',
    '{W} finds space for a moment, but {F} closes it before the comeback begins.',
    '{F} breaks up another attempt by {W} to turn the match around.'
   ],
   cutoff:[
    '{W} presses forward and gets caught. {F} reverses the attack and takes over!',
    '{W} commits too far and {F} takes control of the counter.',
    '{F} turns {W}’s forward momentum against them to regain the advantage.'
   ],
   resurgence:[
    '{W} keeps the pressure on. {F} struggles to find a way back.',
    '{W} remains in charge of the exchanges as {F} looks for a counter.',
    '{F} is still defending. {W} has not given up the initiative.'
   ],
   chain:[
    '{W} and {F} settle into a series of holds, escapes and counters.',
    'The match moves into a struggle for grips. Both are searching for control.',
    'A patient exchange of holds and releases; neither wrestler has a clear opening.'
   ],
   escalation:[
    'The pace rises as both wrestlers start looking for their big attacks.',
    '{W} and {F} increase the tempo. Neither wants to concede the next opening.',
    'Both wrestlers commit more heavily to their attacks as the contest builds.',
    'The counters are getting sharper now. Every attempted finish is being read.',
    'They trade increasingly ambitious attacks without finding a clean finish.'
   ],
   exchange:[
    'Both wrestlers scramble to their feet. The advantage is there to be taken.',
    '{W} and {F} return to a standing exchange; neither has established control.',
    'They circle and re-engage. A quick counter could settle the balance.',
    'Both find their feet again and look for a reliable opening.'
   ],
   nearfall:[
    'They know one mistake could settle this. Every cover now matters.',
    'An escape from a pin attempt changes the momentum. Both wrestlers know it.',
    'The next meaningful advantage could become a decisive cover.',
    'The contest is close enough that neither wrestler dares leave a shoulder down.'
   ],
   finish_setup:[
    '{W} and {F} dig deep. The finishing sequence is close.',
    'Both wrestlers search for the opening that will allow the agreed finish.',
    'The tempo tightens. One clean setup could end the match.'
   ],
   hope:[
    '{W} starts to fight out of trouble. The crowd can sense an opening.',
    '{W} finds a little space and begins to challenge {F} again.',
    'The pressure on {W} loosens; a comeback becomes possible.'
   ],
   limb_work:[
    '{F} has found a target and will not let it go. Every move goes back to the same body part.',
    '{F} keeps pressure on one vulnerable area while {W} tries to defend it.',
    'The exchanges return to limb work; {F} is not giving {W} much room.',
    '{F} isolates a target and slows {W} with sustained pressure.',
    '{W} is forced to protect the targeted limb as {F} keeps control.',
    '{F} works methodically, returning to the same weak point on {W}.'
   ],
   rest_hold:[
    '{F} slows it right down with a hold, grinding {W} into the canvas. The crowd tries to rally {W}.',
    '{F} leans on {W} in a grounded hold, taking pace out of the match.',
    '{W} is stuck defending the hold while {F} controls the tempo.',
    '{F} keeps {W} on the canvas and waits for an opening.',
    'There is little space for {W} to move as {F} maintains the hold.',
    '{F} continues to wear {W} down with patient mat control.'
   ]
  };
  // Submissions-only contests still use the narrative 'nearfall' arc for
  // tension, but a pin-cover line would promise a finish outlawed by the stip.
  // Preserve the same deterministic rotation counter and gameplay RNG.
  const alternatives=M.o.stip==='submission'&&id==='nearfall'?[
   'They know one mistake could settle this. Every grip and escape matters.',
   'One submission counter changes the momentum. Both wrestlers know it.',
   'The next meaningful advantage could become a decisive hold.',
   'The contest is close enough that neither wrestler can afford a trapped limb.'
  ]:ARC_NARRATION_VARIANTS[id];
  if(alternatives){
   g.arcNarrationCounts??={};
   const count=g.arcNarrationCounts[id]||0;
   words=alternatives[count%alternatives.length];
   g.arcNarrationCounts[id]=count+1;
  }
  return words;
 }
 function chooseAction(M,g,id,n,side){
  const variants=ACTION_NARRATION_VARIANTS[id]?
   [...n.lines,...ACTION_NARRATION_VARIANTS[id]]:n.lines;
  const roll=Math.floor(M.r()*variants.length);
  g.lastNarrationIndex??={};
  g.narrationHistory??={};
  const recent=g.narrationHistory[id]||
   (Number.isInteger(g.lastNarrationIndex[id])?[g.lastNarrationIndex[id]]:[]);
  let index=roll;
  for(let shift=0;shift<variants.length;shift++){
   const candidate=(roll+shift)%variants.length;
   if(!recent.slice(-(variants.length>2?2:1)).includes(candidate)){index=candidate;break;}
  }
  g.narrationHistory[id]=[...recent.slice(-1),index];
  g.lastNarrationIndex[id]=index;
  const variant=variants[index],broadcast=broadcastHistory(g,id,n,side);
  return {variants,index,recent,variant,broadcast};
 }
 function speakAction(M,g,id,n,side,attacker,defender,part,variants,index,recent,variant,broadcast){
  let text=$d.fill(M,variant,{A:attacker.short,D:defender.short,part,move:n.kind});
  let noCountLines=null;
  if($d.noCountout(M)){
   if(id==='outside_toss'){
    noCountLines=[
     attacker.short+' sends '+defender.short+' out to the floor. There is no count-out in this match.',
     attacker.short+' puts '+defender.short+' on the floor. Neither is under a count-out deadline.',
     defender.short+' is sent out by '+attacker.short+'. There is no count to beat.',
     attacker.short+' moves '+defender.short+' through the ropes to the floor without a count-out clock.',
     defender.short+' is forced out of the ring by '+attacker.short+'; the stipulation permits the floor fight.',
     attacker.short+' sends '+defender.short+' outside. The referee has no count-out to enforce.',
     defender.short+' lands at ringside after '+attacker.short+' moves them across the ropes. No count applies.',
     attacker.short+' puts '+defender.short+' on the floor; either competitor may stay out under these rules.',
     defender.short+' is carried out to ringside by '+attacker.short+'. There is no count-out danger.',
     attacker.short+' forces '+defender.short+' outside and the match continues without a ten-count.'
    ];
    text=noCountLines[index%noCountLines.length];
   }
   if(id==='roll_inside')text=[
    attacker.short+' rolls '+defender.short+' back inside to continue the fight; there was no count to beat.',
    attacker.short+' brings '+defender.short+' inside by choice, not to escape the count.',
    defender.short+' is returned to the ring by '+attacker.short+'. The rules allowed them to stay outside.'
   ][index%3];
  }
  let spoken=broadcastAction(broadcast,attacker.short,defender.short,text);
  if(AUDITED_ACTION_REPEATS.has(id)&&
     M.log.filter(line=>line.actionId===id&&line.text===spoken).length>=2){
   // After two identical calls, search the other existing action-specific
   // descriptions before speaking. A third exact duplicate is not inevitable
   // just because the normal weighted narration roll revisited a familiar line.
   // The underlying action and all its physical consequences are unchanged.
   for(let offset=1;offset<variants.length;offset++){
    const alternativeIndex=(index+offset)%variants.length;
    const altText=noCountLines?
     noCountLines[alternativeIndex%noCountLines.length]:
     $d.fill(M,variants[alternativeIndex],
      {A:attacker.short,D:defender.short,part,move:n.kind});
    const alt=broadcastAction(broadcast,attacker.short,defender.short,altText);
    if(M.log.filter(line=>line.actionId===id&&line.text===alt).length<2){
     spoken=alt;
     g.lastNarrationIndex[id]=alternativeIndex;
     g.narrationHistory[id]=[...recent.slice(-1),alternativeIndex];
     break;
    }
   }
  }
  $d.say(M,spoken,n.kind,{actionId:id});
  broadcastInsight(M,g,broadcast,n,side,attacker,defender);
  broadcastCounter(M,g,n,side,attacker,defender);
 }
 return {arcWords,chooseAction,speakAction,textureLine,BROADCAST_NAMES};
}
root.OfficeGraphNarration={install};
})(typeof window!=='undefined'?window:globalThis);
