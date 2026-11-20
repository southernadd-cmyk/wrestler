'use strict';
/*
 * The Office — Phase 2 technique registry (editorial, NOT an executable move graph).
 * Original metadata authored for The Office. No Fight Encyclopedia technique data is included.
 *
 * Keep this module out of the game runtime until a separate integration phase.
 * Class, grip, tradition and proposed relation are orthogonal to the current
 * OfficeMatch move family, position gates and weighted edges.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OfficeTechniqueRegistry = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const VERSION = 1;
  const CLASSES = Object.freeze([
    'Submission', 'Strike', 'Throw', 'Takedown', 'Clinch',
    'Position', 'Escape & Reversal', 'Defence', 'Weapon', 'Wrestling-only'
  ]);
  const TRADITIONS = Object.freeze(['catch', 'judo', 'lucha', 'boxing', 'acrobatics', 'strength', 'wrestling']);
  const CONTROLS = Object.freeze([
    'free', 'wrist', 'arm', 'head', 'front-facelock', 'rear-waist',
    'upper-body', 'leg', 'ankle', 'ground-top', 'ground-leg', 'headscissors',
    'rope-launch', 'pin', 'released'
  ]);
  const POSITIONS = Object.freeze(['standing', 'mat', 'corner', 'top', 'outside', 'any']);
  const has = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
  const assert = (condition, message, failures) => { if (!condition) failures.push(message); };
  const spec = (value) => {
    const [position, control] = value.split('/');
    return Object.freeze({ position, control });
  };
  /*
   * Each entry is written against an EXISTING game move ID.
   * Fields: id, broad class, mechanic, entry state, exit state, target, traditions,
   * proposed setup IDs, proposed counter IDs, optional variant-of, editorial note.
   *
   * A proposed setup/counter is not an authored graph edge. Most generated reversals
   * are generic family prose; only selected move-specific examples are referenced.
   */
  const proposals = [
    // British catch: controls, reversals, takedown chains and mat submissions.
    ['go_behind','Position','rear-control entry','standing/free','standing/rear-waist',null,['catch','judo'],['lockup','waistlock'],[],null,'Grip acquisition; not a throw.'],
    ['standing_switch','Escape & Reversal','rear-control switch','standing/rear-waist','standing/rear-waist',null,['catch'],['go_behind'],[],null,'Alternating control is represented as one beat in the existing narration.'],
    ['front_facelock','Clinch','head-and-arm control','standing/head','standing/front-facelock','neck',['catch'],['collar_snap','lockup'],[],null,'Potential entry for suplexes; no grip-state engine gate yet.'],
    ['ch_top_wristlock','Clinch','wrist rotation','standing/wrist','standing/wrist','arm',['catch','judo'],['wristlock','arm_wringer'],[],null,'Wrist control, distinct from a completed arm throw.'],
    ['ch_rolling_wristlock','Clinch','rolling wrist control','standing/wrist','standing/wrist','arm',['catch'],['ch_top_wristlock','wristlock'],[],null,'Keep the wrist through the roll; proposed chaining relationship.'],
    ['ch_deep_arm_drag','Throw','arm-pull off-balance','standing/arm','mat/released','arm',['catch','lucha','judo'],['wristlock','ch_rolling_wristlock'],[],null,'Uses opponent momentum; arm-drag family spans several traditions.'],
    ['ch_japanese_arm_drag','Throw','rolling arm-pull','standing/arm','mat/released','arm',['judo','lucha'],['wristlock','ch_deep_arm_drag'],[],'ch_deep_arm_drag','Rolling delivery variant; name is from the original game.'],
    ['ch_drop_toehold','Takedown','ankle trip','standing/leg','mat/ground-top','leg',['catch'],['ankle_pick','lockup'],['ch_drop_toehold_rev'],null,'Trip to ground; reversal is move-specific in current authored line.'],
    ['ch_single_leg','Takedown','single-leg capture','standing/leg','mat/ground-top','leg',['catch'],['ankle_pick','wristlock'],['ch_single_leg_rev'],null,'Sprawl counter is specifically authored in the engine.'],
    ['ch_double_leg','Takedown','double-leg drive','standing/leg','mat/ground-top',null,['catch'],['lockup','waistlock'],['ch_double_leg_rev'],null,'Sprawl counter is specifically authored in the engine.'],
    ['ch_fireman','Throw','shoulder carry takeover','standing/upper-body','mat/ground-top',null,['judo','catch'],['lockup','go_behind'],['ch_fireman_rev'],null,'Entry and thrown exit; keep distinct from later power-slam impact.'],
    ['ch_snapmare','Throw','head snap-down turnover','standing/head','mat/ground-top',null,['catch','judo'],['headlock','front_facelock'],[],null,'Control after landing is separate from a follow-on submission.'],
    ['ch_headlock_takedown','Takedown','headlock turn-down','standing/head','mat/ground-top','neck',['catch','judo'],['headlock','ch_cravate'],[],null,'Head control leads to grounded position.'],
    ['ch_leg_trip','Takedown','standing leg sweep','standing/leg','mat/ground-top',null,['judo','catch'],['waistlock','lockup'],['ch_leg_trip_rev'],null,'Balance-break and leg sweep; specific evasion exists.'],
    ['ch_hip_toss_chain','Throw','hip rotation','standing/upper-body','mat/released',null,['judo','catch','lucha'],['lockup','front_facelock'],[],null,'Shared hip mechanism; training tags do not mean provenance.'],
    ['ch_dragon_screw','Takedown','caught-leg twist','standing/leg','mat/ground-top','leg',['catch'],['ankle_pick','ch_single_leg'],[],null,'Requires a caught leg in physical reading; engine cannot yet model that grip.'],
    ['ch_cravate','Clinch','standing head torque','standing/head','standing/head','neck',['catch'],['front_facelock','headlock'],[],null,'Working control rather than throw.'],
    ['ch_headlock_escape','Escape & Reversal','headscissors disengagement','standing/headscissors','standing/free',null,['catch','lucha'],['headlock','ch_headlock_takedown'],[],null,'Original narration assumes headscissors; proposed setup needs human review.'],
    ['ch_rollthrough','Escape & Reversal','ground roll-through','standing/upper-body','standing/ground-top',null,['catch','lucha'],['standing_switch','go_behind'],[],null,'Current engine flags standing on both ends despite roll-through text.'],
    // Judo/catch bridges and common grappling family overlap.
    ['sx_german','Throw','rear waistlift and bridge','standing/rear-waist','mat/released','back',['catch'],['go_behind','standing_switch'],[],null,'German suplex remains a pro-wrestling throw, not a claim of judo origin.'],
    ['sx_northern','Throw','bridging suplex','standing/upper-body','mat/pin','back',['catch','judo'],['lockup','go_behind'],[],null,'Pin outcome is an overlay to a throw.'],
    ['sx_belly_belly','Throw','body-clinch overhead turn','standing/upper-body','mat/released','back',['judo','catch'],['lockup','waistlock'],[],null,'Body-lock grip difference should distinguish variants.'],
    ['sm_armbar','Submission','arm extension','mat/ground-top','mat/ground-top','arm',['catch','judo'],['mat_hold','target_hold'],[],null,'Broad arm-extension mechanism, not yet a named variant group.'],
    ['sm_cross_armbreaker','Submission','cross-body arm extension','mat/arm','mat/ground-top','arm',['catch','judo'],['sm_armbar','grounded_switch'],[],'sm_armbar','Distinct entry with leg control; variant proposal, not automatic merge.'],
    ['sm_kimura','Submission','shoulder rotation lock','mat/arm','mat/ground-top','arm',['catch','judo'],['mat_hold','target_hold'],[],null,'Grip mechanics require independent expert review before enforcement.'],
    ['sm_fujiwara','Submission','prone arm extension','mat/arm','mat/ground-top','arm',['catch'],['mat_hold','sm_armbar'],[],null,'Prone control from above, contrasting with cross-armbreaker.'],
    ['sm_wristlock_ground','Submission','grounded wrist flexion','mat/wrist','mat/ground-top','arm',['catch'],['mat_hold','target_hold'],[],'ch_rolling_wristlock','Position-specific wrist-lock variant proposal.'],
    ['sm_ankle_lock','Submission','ankle extension lock','mat/ankle','mat/ground-leg','leg',['catch'],['ch_single_leg','ankle_pick'],[],null,'Captured leg vs finished lock must be distinguished.'],
    ['sm_toe_hold','Submission','foot rotation lock','mat/ankle','mat/ground-leg','leg',['catch'],['sm_ankle_lock','mat_hold'],[],null,'Mechanical distinction from an ankle extension lock.'],
    ['sm_figure_four','Submission','leg entanglement','mat/ground-leg','mat/ground-leg','leg',['catch'],['ch_dragon_screw','mat_hold'],[],null,'Submission and leg-control position; reversal not explicitly wired.'],
    ['sm_sleeper','Submission','rear neck compression','mat/head','mat/ground-top','neck',['catch'],['ch_snapmare','mat_hold'],[],null,'Wrestling sleeper; avoid assuming an MMA choke taxonomy synonym.'],
    // Lucha: delivery context, trips, dramatic pin combinations, not a single mechanism.
    ['lc_hurricanrana','Takedown','headscissors turnover','standing/headscissors','mat/released','neck',['lucha'],['rope_run','ch_drop_down'],[],null,'Leverage takedown; not every headscissors move is identical.'],
    ['lc_headscissors','Takedown','tilt-a-whirl headscissors','standing/headscissors','mat/released',null,['lucha'],['rope_rebound','ch_drop_down'],[],'lc_hurricanrana','Entry and rotation differ from basic rana.'],
    ['lc_arm_drag_wheel','Throw','cartwheel arm-drag','standing/arm','mat/released','arm',['lucha'],['ch_deep_arm_drag','rope_run'],[],'ch_deep_arm_drag','Same arm-drag family, altered approach.'],
    ['lc_rana_pin','Wrestling-only','headscissors pin combination','standing/headscissors','mat/pin',null,['lucha'],['lc_hurricanrana','rope_run'],[],'lc_hurricanrana','Pin is not a biomechanical class in the external taxonomy.'],
    ['lc_wheelbarrow','Takedown','wheelbarrow faceplant','standing/upper-body','mat/released','neck',['lucha'],['rope_rebound','go_behind'],[],null,'Wheelbarrow setup and bulldog finish must be differentiated.'],
    ['pn_magistral','Wrestling-only','arm-control cradle','standing/arm','mat/pin',null,['lucha','catch'],['wristlock','ch_deep_arm_drag'],[],null,'Pinning mechanism overlays hand/arm control.'],
    ['pn_victory_roll','Wrestling-only','shoulder roll pin','standing/upper-body','mat/pin',null,['lucha'],['rope_rebound','lc_hurricanrana'],[],null,'Pinning outcome distinct from pure throw.'],
    ['sb_arm_drag','Throw','rope-assisted arm-drag','top/rope-launch','mat/released','arm',['lucha'],['springboard_rise','ch_deep_arm_drag'],[],'ch_deep_arm_drag','Top-rope launch is ring context; no changes to current top-position gate.']
    ,
    // Phase 5: independently authored training foundations, not match-performance styles.
    // Punching mechanics: a former boxer has a source-backed aptitude for punches,
    // not for every heel strike, forearm, elbow or unrelated impact move.
    ['st_jab','Strike','straight-punch combination','standing/free','standing/free',null,['boxing'],['strike_trade','lockup'],[],null,'Straight punches as a measured entry; the engine does not store guard position.'],
    ['st_gut_punch','Strike','body punch','standing/free','standing/free','ribs',['boxing'],['st_jab','strike_trade'],[],null,'Follows jabs to the body; a narrative sequence, not a guaranteed combination.'],
    // Strength athletics: lifting and catches, with pre-existing weight/stamina guards.
    ['pw_body_slam','Throw','scoop-and-lift','standing/upper-body','mat/released','back',['strength'],['waistlock','lockup'],[],null,'Body scoop from a tie-up, gated by original lifting restrictions.'],
    ['pw_fallaway','Throw','catch-and-release lift','standing/upper-body','mat/released','back',['strength'],['rope_rebound'],[],null,'Catch from the ropes; does not grant strength beyond existing lift checks.'],
    ['pw_military_press','Throw','overhead military press','standing/upper-body','mat/released','back',['strength'],['lockup'],[],null,'An overhead press requires a lifting position and remains weight limited.'],
    ['pw_samoan_drop','Throw','shoulder-load drop','standing/upper-body','mat/released','back',['strength'],['pw_torture_rack','lockup'],[],null,'A controlled drop after shoulder loading; no automatic follow-up.'],
    ['pw_gorilla_press','Throw','overhead gorilla press','standing/upper-body','mat/released','back',['strength'],['lockup'],[],'pw_military_press','Similar overhead lift, but a separate existing action.'],
    ['pw_torture_rack','Submission','shoulder-rack pressure','standing/upper-body','standing/upper-body','back',['strength'],['waistlock','lockup'],[],null,'Standing shoulder carry remains standing in the game state.'],
    ['pw_scoop_powerslam','Throw','scoop powerslam','standing/upper-body','mat/released','back',['strength'],['rope_rebound','lockup'],[],'pw_body_slam','Scoop entry shared with a body slam but different impact.'],
    // Acrobatics: an explicitly editorial rather than inferred school for Kit.
    ['ar_shooting_star','Wrestling-only','shooting-star rotation','top/rope-launch','mat/released',null,['acrobatics'],['top_climb'],[],null,'Advanced aerial rotation; existing agile, risk and late-timing gates remain binding.'],
    ['ar_corkscrew','Wrestling-only','corkscrew rotation','top/rope-launch','mat/released',null,['acrobatics'],['top_climb'],[],null,'Axial rotation off the top, not simply any Spectacle performance move.'],
    ['ar_450','Wrestling-only','four-fifty rotation','top/rope-launch','mat/released',null,['acrobatics'],['top_climb'],[],null,'A demanding rotational dive with unchanged risk/eligibility checks.'],
    ['ar_moonsault','Wrestling-only','backward aerial rotation','top/rope-launch','mat/released',null,['acrobatics'],['top_climb'],[],null,'Backwards flip from a permitted top-rope position.'],
    ['sb_dropkick','Wrestling-only','springboard kick launch','top/rope-launch','mat/released',null,['acrobatics'],['springboard_rise'],[],null,'Springboard kick is treated as ring-specific aerial delivery.'],
    ['sb_moonsault','Wrestling-only','springboard backward rotation','top/rope-launch','mat/released',null,['acrobatics'],['springboard_rise'],[],'ar_moonsault','Same aerial rotation with a springboard entry rather than stationary top rope.'],
    // Additional reviewed catch/judo and ring-specific pins.
    ['sx_fisherman','Throw','leg-hook bridging suplex','standing/upper-body','mat/released','back',['catch','judo'],['front_facelock','lockup'],[],null,'Leg hook and bridge help set up a nearfall.'],
    ['sx_exploder','Throw','leg-hook overhead suplex','standing/upper-body','mat/released','back',['judo','catch'],['waistlock','lockup'],[],null,'Off-balancing throw with a leg hook and overhead rotation.'],
    ['sm_kneebar','Submission','knee extension hold','mat/ground-leg','mat/ground-leg','leg',['catch'],['mat_hold','ch_single_leg'],[],null,'Ground leg extension; a leg target is present in the current engine.'],
    ['pn_backslide','Wrestling-only','backward arm trap cradle','standing/arm','mat/pin',null,['lucha','catch'],['wristlock'],[],null,'Arm-controlled cradle with a wrestling-only nearfall outcome.'],
    ['pn_schoolboy','Wrestling-only','rear trip cradle','standing/upper-body','mat/pin',null,['lucha','catch'],['rope_rebound'],[],null,'A simple pin from behind; distinct from a pure takedown.'],
    ['pn_crucifix','Wrestling-only','crossed arm trap cradle','standing/arm','mat/pin',null,['lucha','catch'],['wristlock'],[],null,'Arm restraint leading to a pin rather than a lock.']
    ,
    // Phase 5b — submission mechanics. Catalog entries are ORIGINAL Office
    // editorial analysis; grip-state annotations do not add latent grip physics.
    ['sm_keylock','Submission','arm figure-four keylock','mat/arm','mat/arm','arm',['catch','judo'],['sm_armbar','mat_hold'],[],null,'Arm isolation and shoulder rotation; the game continues to use mat position.'],
    ['sm_triangle','Submission','leg triangle choke','mat/headscissors','mat/headscissors','neck',['catch','judo'],['mat_hold'],[],null,'Leg-based head and arm restraint; distinguish from a grounded arm triangle.'],
    ['sm_rear_naked','Submission','rear body choke','mat/head','mat/head','neck',['catch','judo'],['mat_hold'],[],null,'Rear control and neck squeeze; no persistent back-control state is introduced.'],
    ['sm_camel','Submission','back-extension camel clutch','mat/ground-top','mat/ground-top','back',['catch','wrestling'],['mat_hold'],[],null,'Upper-body extension from top control; this is not a standing clinch.'],
    ['sm_boston','Submission','double-leg extension crab','mat/ground-leg','mat/ground-leg','back',['catch'],['mat_hold'],[],null,'Double-leg folded back control; retains its original back target.'],
    ['sm_single_crab','Submission','single-leg crab','mat/ground-leg','mat/ground-leg','leg',['catch'],['sm_boston'],[],'sm_boston','Changes from double-leg pressure to one leg; actual leg target differs.'],
    ['sm_heel_hook','Submission','rotational heel-hook','mat/ground-leg','mat/ground-leg','leg',['catch'],['sm_kneebar'],[],null,'Heel and knee rotation distinct from straight knee extension.'],
    ['sm_stf','Submission','stepping leg trap crossface','mat/ground-leg','mat/ground-top','neck',['catch'],['mat_hold'],[],null,'Trapped leg plus crossface; the game records a neck target.'],
    ['sm_crossface','Submission','head-and-arm crossface','mat/arm','mat/ground-top','neck',['catch'],['sm_keylock'],[],null,'Arm isolation can transition into face pressure without changing mat position.'],
    ['sm_surfboard','Submission','rear surfboard stretch','mat/ground-top','mat/ground-top','back',['catch','wrestling'],['mat_hold'],[],null,'Knees behind the back and raised arms; current game target is back.'],
    ['sm_cloverleaf','Submission','folded-leg cloverleaf','mat/ground-leg','mat/ground-leg','back',['catch'],['mat_hold'],[],null,'Two legs folded into back extension; not equivalent to single crab.'],
    ['sm_dragon_sleeper','Submission','inverted neck crank','mat/head','mat/head','neck',['catch'],['mat_hold'],[],null,'Inverted head control; current action begins and ends on the mat.'],
    ['sm_arm_triangle','Submission','head-and-arm triangle','mat/arm','mat/ground-top','neck',['catch','judo'],['sm_triangle'],[],null,'Grounded arm triangle differs from leg-based triangle choke.'],
    ['sm_short_arm_scissors','Submission','short-arm scissors','mat/arm','mat/arm','arm',['catch'],['mat_hold','sm_cross_armbreaker'],[],null,'Leg squeeze on a trapped arm; preserved as a grounded arm target.'],
    ['sm_muffler','Submission','stretch muffler leg-extension','mat/ground-leg','mat/ground-leg','leg',['catch'],['mat_hold'],[],null,'Leg lever over the shoulder; no standing entry or hidden joint tracking.'],
    ['sm_lion_tamer','Submission','elevated crab pressure','mat/ground-leg','mat/ground-leg','back',['catch','wrestling'],['sm_boston'],[],'sm_boston','An elevated back-pressure variant, not an automatic win condition.'],
    ['sm_deathlock','Submission','interwoven leg immobilisation','mat/ground-leg','mat/ground-leg','leg',['catch'],['mat_hold'],[],null,'Interlaced legs produce distinct ground immobilisation; game target remains leg.'],

    // Common professional-wrestling striking is NOT retroactively called boxing.
    // The neutral "wrestling" tag has no school affinity bonus by itself.
    ['st_forearm','Strike','forearm impact','standing/free','standing/free',null,['wrestling'],['st_jab','strike_trade'],[],null,'A forearm smash is not automatically a boxing punch.'],
    ['st_elbow_smash','Strike','short elbow impact','standing/free','standing/free',null,['wrestling'],['st_forearm'],[],null,'Close-range elbow after a forearm; neutral to technical training schools.'],
    ['st_uppercut','Strike','european forearm uppercut','standing/free','standing/free','neck',['wrestling'],['st_gut_punch'],[],null,'European uppercut is not automatically assigned to the boxing school.'],
    ['st_kneelift','Strike','rising knee lift','standing/free','standing/free',null,['wrestling'],['st_gut_punch'],[],null,'A body shot may fold the opponent into a knee; not a boxer-only manoeuvre.'],
    ['st_leg_kick','Strike','thigh-target kick','standing/free','standing/free','leg',['wrestling'],['strike_trade'],[],null,'Low kick targets the thigh and can prepare a higher kick.'],
    ['st_roundhouse','Strike','head-height roundhouse','standing/free','mat/released',null,['wrestling'],['st_leg_kick'],[],null,'Roundhouse ends with an opponent on the mat under the live game rules.'],
    ['st_palm','Strike','open-palm strike','standing/free','standing/free',null,['wrestling'],['st_jab'],[],null,'Open-hand palm after jabs: a ring-specific alternative, not a boxer signature.'],
    ['st_body_kick','Strike','rib-target body kick','standing/free','standing/free','ribs',['wrestling'],['st_jab'],[],null,'A kick to the ribs after a strike; not automatically a boxing technique.'],

    // 20 Nov v0.4 audit: 24 individually checked action mechanics and actual
    // move-specific generated counters. Metadata alone never creates free counters.
    ['gd_elbow_drop','Wrestling-only','grounded elbow impact','mat/ground-top','mat/ground-top','ribs',['wrestling'],['mat_hold','pw_backbreaker'],['gd_elbow_drop_rev'],null,'Grounded opponent receives a rib-area elbow; no new pin or hidden submission grip.'],
    ['gd_stomp','Strike','grounded stomp','mat/ground-top','mat/ground-top',null,['wrestling'],['mat_hold'],['gd_stomp_rev'],null,'An already grounded wrestler is stomped; the selected target body part is narrated, not a new fixed limb requirement.'],
    ['gd_senton','Wrestling-only','grounded back senton','mat/ground-top','mat/ground-top','ribs',['wrestling'],['pw_backbreaker','mat_hold'],['gd_senton_rev'],null,'A close-range back senton follows an opponent down; distinguish this from an aerial top-rope attack.'],
    ['gd_arm_elbows','Strike','grounded arm isolation elbows','mat/arm','mat/ground-top','arm',['catch','wrestling'],['mat_hold'],['gd_arm_elbows_rev'],null,'Kneeling on the trapped wrist provides the stated arm target, but no independent persistent wrist-grip gate is claimed.'],
    ['gd_ground_pound','Strike','mounted ground strikes','mat/ground-top','mat/ground-top',null,['wrestling'],['mat_hold','rs_front_chancery','gd_senton'],['gd_ground_pound_rev'],null,'Mounted punches follow a grounded exchange; the referee separates the wrestlers, so follow-up control is not guaranteed.'],
    ['os_ramp_suplex','Throw','entrance ramp lifting suplex','outside/upper-body','outside/released','back',['wrestling','strength'],['ramp_approach'],['os_ramp_suplex_rev'],null,'The ramp approach must precede a dangerous outside lift; existing strength, timing and geography gates stay in force.'],
    ['os_apron_ddt','Wrestling-only','ring apron head-first ddt','outside/head','outside/released','neck',['wrestling'],['apron_stand'],['os_apron_ddt_rev'],null,'The apron is a distinct landing surface; live position geometry already requires an apron approach.'],
    ['os_barricade_spear','Wrestling-only','barricade shoulder collision','outside/free','outside/released','ribs',['wrestling'],['floor_brawl'],['os_barricade_spear_rev'],null,'Both wrestlers collide with the barricade outside; a separate opponent location is not invented from the move name.'],
    ['os_floor_piledriver','Wrestling-only','floor piledriver impact','outside/upper-body','outside/released','neck',['wrestling','strength'],['floor_brawl'],['os_floor_piledriver_rev'],null,'A lifted head-first impact occurs on the floor; preserve the existing high-risk timing and lifting restrictions.'],
    ['pw_bearhug','Clinch','rib-compression bearhug','standing/upper-body','standing/upper-body','ribs',['strength','wrestling'],['lockup'],['pw_bearhug_rev'],null,'A sustained close-body squeeze creates a plausible immediate follow-up lift; it is not currently a saved universal body-lock grip.'],
    ['sx_deadlift_bridge','Throw','deadlift bridging suplex','standing/front-facelock','mat/ground-top','back',['catch','strength'],['front_facelock'],['sx_deadlift_bridge_rev'],null,'A front facelock is required by the live pilot for the heavy bridging throw; a cover remains a separate event.'],
    ['pw_backbreaker','Throw','knee-supported scoop backbreaker','standing/upper-body','mat/released','back',['strength'],['pw_bearhug','lockup'],['pw_backbreaker_rev'],null,'A secure body grip can transition into the knee drop; the current lift limits and mat impact still apply.'],
    ['pw_powerbomb','Throw','shoulder-load powerbomb','standing/upper-body','mat/released','back',['strength'],['lockup'],['pw_powerbomb_rev'],null,'A high-cost standing lift ends on the mat; no immediate cover is inferred and opponent weight remains restrictive.'],
    ['nk_snap_ddt','Wrestling-only','quick headlock snap ddt','standing/front-facelock','mat/released','neck',['wrestling'],['front_facelock'],['nk_snap_ddt_rev'],null,'A front-head hold can seed a quick DDT; unlike the standard DDT, the separate snap variant is not globally grip-gated.'],
    ['nk_swinging_neckbreaker','Wrestling-only','rotating neckbreaker','standing/head','mat/released','neck',['wrestling'],['headlock','front_facelock'],['nk_swinging_neckbreaker_rev'],null,'The attacker must rotate into neck control before the drop; this registry note does not impose a new persistent neck grip.'],
    ['nk_ddt','Wrestling-only','front facelock falling ddt','standing/front-facelock','mat/released','neck',['wrestling'],['front_facelock'],['nk_ddt_rev'],null,'Live physical legality requires a short-lived, owner-specific front facelock before this standard DDT.'],
    ['st_headbutt','Strike','close-range headbutt','standing/free','standing/free',null,['wrestling'],['strike_trade'],['st_headbutt_rev'],null,'A short-range head impact leaves both workers standing in the action record; it is not classified as boxing.'],
    ['st_double_chop','Strike','two-handed shoulder chop','standing/free','standing/free','arm',['wrestling'],['strike_trade'],['st_double_chop_rev'],null,'The authored move strikes both shoulders and targets the arm region; it does not imply persistent arm control.'],
    ['st_backhand','Strike','backhand chest chop','standing/free','standing/free','ribs',['wrestling'],['st_chop','strike_trade'],['st_backhand_rev'],null,'A close-range backhand chop works the chest; the performer is not credited with boxing school knowledge.'],
    ['st_chop','Strike','knife-edge chest chop','standing/free','standing/free','ribs',['wrestling'],['strike_trade','st_double_chop'],['st_chop_rev'],null,'A knife-edge chest strike follows a standing exchange; shoulder/arm entries retain distinct targeting.'],
    ['rs_leg_lace','Submission','grounded leg entanglement','mat/ground-leg','mat/ground-leg','leg',['catch'],['leg_wrench','mat_hold'],['rs_leg_lace_rev'],null,'The live pilot requires retained, owner-specific grounded leg access; this is a control hold rather than an automatic tap-out.'],
    ['rs_front_chancery','Submission','grounded front head chancery','mat/head','mat/ground-top','neck',['catch','wrestling'],['nk_ddt','mat_hold'],['rs_front_chancery_rev'],null,'After a grounded head impact the performer can seize a neck control; no pre-existing stored neck-grip gate is claimed.'],
    ['dv_tope_con_hilo','Wrestling-only','over-rope floor dive','outside/rope-launch','outside/released',null,['lucha','acrobatics'],['outside_toss'],['dv_tope_con_hilo_rev'],null,'The performer launches from within the ring while the opponent stands outside; the existing split-location check applies.'],
    ['sp_superplex','Throw','top-rope opponent suplex','top/upper-body','mat/released','back',['wrestling','strength'],['top_follow'],['sp_superplex_rev'],null,'Both wrestlers must have reached the turnbuckles, with enough stamina for an exact named two-tick committed attempt.'],

    // Phase 5 mat-wrestling metadata: 39 existing moves, no new graph edges.
    // Standing submissions remain standing; the lateral rest press has no reversal.
    ['gd_knee_drop','Wrestling-only','grounded knee impact','mat/ground-top','mat/ground-top','neck',['wrestling'],['mat_hold'],['gd_knee_drop_rev'],null,'Knee drop onto a grounded opponent\'s head; this is not a top-rope knee attack.'],
    ['gd_leg_drop','Wrestling-only','grounded throat leg drop','mat/ground-top','mat/ground-top','neck',['wrestling'],['mat_hold'],['gd_leg_drop_rev'],null,'A grounded leg drop across the throat, distinct from a running or aerial leg drop.'],
    ['gd_splash','Wrestling-only','standing body splash','mat/ground-top','mat/ground-top','ribs',['wrestling'],['mat_hold'],['gd_splash_rev'],null,'A close-range standing splash onto an already downed opponent, not a top-rope launch.'],
    ['gd_headbutt','Strike','falling grounded headbutt','mat/ground-top','mat/ground-top',null,['wrestling'],['mat_hold'],['gd_headbutt_rev'],null,'The opponent is down before the attacker drops into a headbutt; the body-part call is variable.'],
    ['gd_knee_stomp','Strike','grounded knee stomp','mat/ground-leg','mat/ground-top','leg',['wrestling'],['mat_hold'],['gd_knee_stomp_rev'],null,'Aimed at the grounded knee; grounded-leg access describes the move, not a persistent grip guarantee.'],
    ['gd_fist_drop','Strike','grounded fist drop','mat/ground-top','mat/ground-top',null,['wrestling'],['mat_hold'],['gd_fist_drop_rev'],null,'Short-range falling fist to the grounded opponent; live target is not fixed.'],
    ['gd_standing_moonsault','Wrestling-only','standing backward flip splash','mat/ground-top','mat/ground-top',null,['acrobatics','wrestling'],['mat_hold'],['gd_standing_moonsault_rev'],null,'A standing backflip onto a grounded opponent; never confuse with a top-rope moonsault.'],
    ['gd_running_senton','Wrestling-only','running grounded senton','mat/ground-top','mat/ground-top','ribs',['wrestling'],['rope_run','mat_hold'],['gd_running_senton_rev'],null,'A rope-assisted running senton landing on a grounded target, not a dive to the outside.'],
    ['gd_choke_ropes','Wrestling-only','grounded rope choke','mat/head','mat/ground-top','neck',['wrestling'],['mat_hold'],['gd_choke_ropes_rev'],null,'Attacker drags a downed opponent to the ropes and chokes under a referee count; no rope grip is stored.'],
    ['gd_back_rake','Strike','grounded back rake','mat/ground-top','mat/ground-top','back',['wrestling'],['mat_hold'],['gd_back_rake_rev'],null,'A grounded rake to the back with taunting; heel behaviour does not change the target.'],
    ['gd_dragon_screw_ground','Takedown','grounded trapped leg twist','mat/ground-leg','mat/ground-top','leg',['wrestling'],['leg_wrench','mat_hold'],['gd_dragon_screw_ground_rev'],null,'Twists an already grounded leg against the canvas; not the standing dragon-screw takedown.'],
    ['gd_arm_stomp','Strike','grounded arm stomp','mat/arm','mat/ground-top','arm',['catch','wrestling'],['mat_hold'],['gd_arm_stomp_rev'],null,'Focused stomp on the arm while the opponent is grounded, with no asserted permanent arm grip.'],
    ['gd_rib_stomp','Strike','grounded rib stomp','mat/ground-top','mat/ground-top','ribs',['wrestling'],['mat_hold'],['gd_rib_stomp_rev'],null,'A stomp targeting the grounded rib cage; no extra positional state is created.'],
    ['gd_elbow_neck','Wrestling-only','grounded neck elbow drop','mat/ground-top','mat/ground-top','neck',['wrestling'],['mat_hold'],['gd_elbow_neck_rev'],null,'Elbow drop to the back of a grounded neck; distinct from the chest elbow drop.'],
    ['gd_lower_back_knee','Wrestling-only','lower back knee pressure','mat/ground-top','mat/ground-top','back',['catch','wrestling'],['mat_hold'],['gd_lower_back_knee_rev'],null,'Knee drives into the lower back as the arms are lifted; limb control is descriptive.'],
    ['rs_side_headlock','Clinch','grounded side headlock','mat/head','mat/head','neck',['catch'],['mat_hold'],['rs_side_headlock_rev'],null,'A grounded side-headlock pressure hold that slows the pace without a guaranteed submission.'],
    ['rs_armbar_rest','Clinch','resting armbar control','mat/arm','mat/arm','arm',['catch'],['mat_hold'],['rs_armbar_rest_rev'],null,'Loose arm control used to recover energy; not equivalent to the committed submission armbar.'],
    ['rs_body_scissors','Clinch','grounded torso body scissors','mat/ground-top','mat/ground-top','ribs',['catch'],['mat_hold'],['rs_body_scissors_rev'],null,'Legs squeeze the torso while grounded, with no automatic choke or pin outcome.'],
    ['rs_nerve_hold','Clinch','shoulder nerve pressure','mat/head','mat/head','neck',['wrestling'],['mat_hold'],['rs_nerve_hold_rev'],null,'Shoulder-base nerve pressure targets the neck under live graph metadata.'],
    ['rs_seated_chinlock','Clinch','seated knee backed chinlock','mat/head','mat/head','back',['catch','wrestling'],['mat_hold'],['rs_seated_chinlock_rev'],null,'Knee between shoulder blades accompanies a seated chinlock; the recorded target is back.'],
    ['rs_hammerlock_mat','Clinch','grounded hammerlock control','mat/arm','mat/arm','arm',['catch'],['mat_hold'],['rs_hammerlock_mat_rev'],null,'Held arm bends behind the opponent\'s back; a rest control rather than a finish attempt.'],
    ['rs_cover_rest','Wrestling-only','one count lateral press','mat/pin','mat/ground-top',null,['wrestling'],['mat_hold'],[],null,'A brief lateral press with a one-count release; its authored action has no generated reversal.'],
    ['rs_reverse_chinlock','Clinch','grounded rear chinlock','mat/head','mat/head','neck',['catch','wrestling'],['mat_hold'],['rs_reverse_chinlock_rev'],null,'Seated rear chin control keeps the opponent down without assuming a submission outcome.'],
    ['rs_mat_stretch','Clinch','grounded back stretch','mat/ground-top','mat/ground-top','back',['catch'],['mat_hold'],['rs_mat_stretch_rev'],null,'Low-energy grounded stretch used to hold an opponent down; no separate pressure state.'],
    ['rs_wrist_mat','Clinch','grounded wrist immobilisation','mat/wrist','mat/wrist','arm',['catch'],['mat_hold'],['rs_wrist_mat_rev'],null,'Pins the wrist to the canvas to maintain control; not a submission wristlock.'],
    ['sm_abdominal','Submission','standing abdominal stretch','standing/upper-body','standing/upper-body','ribs',['catch','wrestling'],['waistlock'],['sm_abdominal_rev'],null,'A standing rope-assisted abdominal stretch; must never be misclassified as mat-only.'],
    ['sm_chinlock','Submission','grounded rear chinlock pressure','mat/head','mat/ground-top','neck',['catch','wrestling'],['mat_hold'],['sm_chinlock_rev'],null,'A grounded submission chinlock distinct from an energy-recovery rest hold.'],
    ['sm_sharpshooter','Submission','crossed leg back extension','mat/ground-leg','mat/ground-leg','back',['catch','wrestling'],['mat_hold'],['sm_sharpshooter_rev'],null,'Turned-over crossed-leg back stretch; current engine targets the back, not leg.'],
    ['sm_bow_arrow','Submission','back bow and arrow stretch','mat/ground-top','mat/ground-top','back',['catch'],['mat_hold'],['sm_bow_arrow_rev'],null,'Uses knee support and a pull across the back to extend the grounded opponent.'],
    ['sm_anaconda','Submission','arm trap neck compression','mat/arm','mat/ground-top','neck',['catch','wrestling'],['mat_hold'],['sm_anaconda_rev'],null,'Arm-and-neck squeeze while grounded; no assumed persistent head-and-arm grip state.'],
    ['sm_cobra','Submission','arm across throat clutch','mat/arm','mat/ground-top','neck',['catch','wrestling'],['mat_hold'],['sm_cobra_rev'],null,'The cobra-clutch arm restraint targets the neck; runtime grip is not independently retained.'],
    ['sm_octopus','Submission','standing octopus body stretch','standing/upper-body','standing/upper-body','back',['catch','wrestling'],['waistlock'],['sm_octopus_rev'],null,'The authored octopus stretch begins and ends standing despite its submission family.'],
    ['sm_rings','Submission','grounded double leg spread','mat/ground-leg','mat/ground-leg','leg',['catch'],['mat_hold'],['sm_rings_rev'],null,'Both legs are spread against resistance; not a completed pin or back-targeting crab.'],
    ['pn_small_package','Wrestling-only','small package cradle','standing/upper-body','mat/pin',null,['catch','wrestling'],['lockup'],['pn_small_package_rev'],null,'Standing body fold to a nearfall; kick-out is in the authored narration, not a finish.'],
    ['pn_inside_cradle','Wrestling-only','inside cradle rollup','standing/upper-body','mat/pin',null,['catch','wrestling'],['lockup'],['pn_inside_cradle_rev'],null,'Inside cradle with a close nearfall; no submission or automatic three-count.'],
    ['pn_sunset','Wrestling-only','sunset flip pin','standing/upper-body','mat/pin',null,['lucha'],['rope_rebound'],['pn_sunset_rev'],null,'Rope-running entry into a sunset flip and nearfall; standing start is required.'],
    ['pn_oconnor','Wrestling-only','rear rolling cradle','standing/upper-body','mat/pin',null,['catch','wrestling'],['go_behind'],['pn_oconnor_rev'],null,'Rear rolling leg cradle into a nearfall; the attacker first gains standing access.'],
    ['pn_jackknife','Wrestling-only','jackknife folded cover','standing/upper-body','mat/pin',null,['catch','wrestling'],['lockup'],['pn_jackknife_rev'],null,'Jackknife fold and cover are one authored pin action, not a throw plus separate pin.'],
    ['pn_bridge_rollup','Wrestling-only','bridging rollup cover','standing/upper-body','mat/pin',null,['catch','wrestling'],['lockup'],['pn_bridge_rollup_rev'],null,'Standing rollup held by a bridge for leverage; there is no automatic winning fall.'],
    // Phase 5 follow-up: remaining 18 standing strikes and 12 running attacks.
    // All tags are deliberately neutral to active technical-school weighting.
    ['st_enzuigiri','Strike','leaping back-of-head kick','standing/free','mat/released',null,['wrestling'],['strike_trade'],['st_enzuigiri_rev'],null,'A leaping kick strikes the back of the head and drops the opponent; it does not establish a sustained neck hold.'],
    ['st_superkick','Strike','standing jaw superkick','standing/free','mat/released',null,['wrestling'],['strike_trade'],['st_superkick_rev'],null,'A standing superkick knocks the opponent to the canvas and remains distinct from a running kick.'],
    ['st_big_boot','Strike','charging big boot','standing/free','mat/released',null,['wrestling'],['strike_trade'],['st_big_boot_rev'],null,'A raised boot intercepts the advancing opponent; the current engine records a mat landing.'],
    ['st_standing_dropkick','Strike','two-foot standing dropkick','standing/free','mat/released',null,['wrestling'],['strike_trade'],['st_standing_dropkick_rev'],null,'A simultaneous feet-first standing dropkick to the chest knocks the defender down.'],
    ['st_spinning_backfist','Strike','spinning standing backfist','standing/free','standing/free',null,['wrestling'],['strike_trade'],['st_spinning_backfist_rev'],null,'A spinning backfist strikes without automatically knocking the opponent to the mat.'],
    ['st_mongolian','Strike','double sided neck chop','standing/free','standing/free','neck',['wrestling'],['strike_trade'],['st_mongolian_rev'],null,'Both hands chop the sides of the neck; this is not a boxing punch.'],
    ['st_throat_thrust','Strike','close range throat thrust','standing/free','standing/free','neck',['wrestling'],['strike_trade'],['st_throat_thrust_rev'],null,'A covert throat strike targets the neck without adding a submission or lasting grip.'],
    ['st_discus','Strike','rotating discus clothesline','standing/free','mat/released','neck',['wrestling'],['strike_trade'],['st_discus_rev'],null,'A rotating clothesline lands at neck height and leaves the opponent grounded.'],
    ['st_ripcord','Strike','wrist pull lariat','standing/wrist','mat/released','neck',['wrestling'],['strike_trade'],['st_ripcord_rev'],null,'A temporary wrist pull sets up a short lariat; it does not grant persistent wrist control.'],
    ['st_rolling_koppu','Strike','rolling standing chop','standing/free','standing/free',null,['wrestling'],['strike_trade'],['st_rolling_koppu_rev'],null,'A rolling chop makes contact while the match remains standing; distinct from a grounded strike.'],
    ['st_spin_kick','Strike','spinning chest kick','standing/free','mat/released',null,['wrestling'],['strike_trade'],['st_spin_kick_rev'],null,'An agile spinning kick strikes the chest and produces a grounded landing in the engine.'],
    ['st_knee_strike','Strike','charging jaw knee','standing/free','mat/released',null,['wrestling'],['strike_trade'],['st_knee_strike_rev'],null,'A charging knee catches the jaw; its recorded result puts the opponent on the mat.'],
    ['st_fighting_spirit','Wrestling-only','mutual standing strike exchange','standing/free','standing/free',null,['wrestling'],['strike_trade'],[],null,'A dramatic mutual exchange with no single completed parent attack and no generated reversal or block.'],
    ['st_lariat_standing','Strike','close range standing lariat','standing/free','mat/released','neck',['wrestling'],['strike_trade'],['st_lariat_standing_rev'],null,'A stationary lariat drops the opponent; distinct from the rope-running lariat.'],
    ['st_axe_kick','Strike','descending heel axe kick','standing/free','mat/released',null,['wrestling'],['strike_trade'],['st_axe_kick_rev'],null,'A descending heel strike to the head sends the opponent to the mat without implying top-rope launch.'],
    ['st_open_slap','Strike','standing open palm slap','standing/free','standing/free',null,['wrestling'],['strike_trade'],['st_open_slap_rev'],null,'An open-hand slap provokes a reaction but does not automatically knock the opponent down.'],
    ['st_side_kick','Strike','standing midsection side kick','standing/free','standing/free','ribs',['wrestling'],['strike_trade'],['st_side_kick_rev'],null,'A side kick targets the ribs while both competitors remain standing.'],
    ['st_eye_rake','Strike','standing eye rake','standing/free','standing/free',null,['wrestling'],['strike_trade'],['st_eye_rake_rev'],null,'A rule-breaking eye rake has no fixed body-part target in the graph; blocking is disabled.'],
    ['rn_knee','Strike','rope running knee strike','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_knee_rev'],null,'A knee strike delivered after a run off the ropes knocks the opponent down.'],
    ['rn_crossbody','Wrestling-only','running crossbody collision','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_crossbody_rev'],null,'A running crossbody brings the opponent to the mat; an early cover is a possible separate follow-up.'],
    ['rn_spear','Strike','running shoulder spear','standing/free','mat/released','ribs',['wrestling'],['rope_run'],['rn_spear_rev'],null,'A forward shoulder collision targets the ribs and grounds the defender.'],
    ['rn_flying_shoulder','Strike','leaping shoulder block','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_flying_shoulder_rev'],null,'A rope-running leap drives a shoulder into the opponent with a grounded landing.'],
    ['rn_elbow','Strike','rebounding running elbow','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_elbow_rev'],null,'The attacker rebounds and lands an elbow; no lasting elbow or head grip exists.'],
    ['rn_dropkick','Strike','running two foot dropkick','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_dropkick_rev'],null,'A rope-assisted running dropkick grounds the defender, distinct from the standing version.'],
    ['rn_thesz','Wrestling-only','running thesz press','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_thesz_rev'],null,'A leap onto the opponent becomes a mounted punching beat; the attack still records a single grounded action.'],
    ['rn_lariat','Strike','running neck level lariat','standing/free','mat/released','neck',['wrestling'],['rope_run'],['rn_lariat_rev'],null,'A rope-running lariat targets the neck and drops the opponent; different entry from the standing lariat.'],
    ['rn_hip_attack','Strike','rebounding hip collision','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_hip_attack_rev'],null,'A running hip attack collides with the defender and ends on the mat.'],
    ['rn_seated_senton','Wrestling-only','leaping seated senton','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_seated_senton_rev'],null,'The attacker flips into a seated senton while the defender is standing, unlike a grounded senton.'],
    ['rn_cannonball_mid','Wrestling-only','running mid ring cannonball','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_cannonball_mid_rev'],null,'A forward cannonball lands in the middle of the ring and knocks the defender down.'],
    ['rn_bicycle_knee','Strike','leaping bicycle knee','standing/free','mat/released',null,['wrestling'],['rope_run'],['rn_bicycle_knee_rev'],null,'A leaping leg-switch knee strike catches the opponent high and drops them to the canvas.'],

    // Phase 5 continuation: 51 suplex, power and neck mechanics from live catalogue.
    // These are editorial annotations, not a new position/grip engine or new graph edges.
    // Retain exact named counters, per-move target/positions, and neutral school weights.
    ['sx_vertical','Throw','vertical headlock lift','standing/front-facelock','mat/released','back',['wrestling'],['front_facelock'],['sx_vertical_rev'],null,'A front head tie guides a straight vertical lift before the opponent lands on the mat.'],
    ['sx_delayed','Throw','delayed vertical lift','standing/front-facelock','mat/released','back',['wrestling'],['front_facelock'],['sx_delayed_rev'],'sx_vertical','The opponent is held inverted before a backward fall; the current weight and stamina checks remain.'],
    ['sx_belly_back','Throw','rear scoop suplex','standing/rear-waist','mat/released','back',['wrestling'],['go_behind'],['sx_belly_back_rev'],null,'A rear body pickup and backward fall is distinct from a release German overhead throw.'],
    ['sx_german_release','Throw','release german suplex','standing/rear-waist','mat/released','back',['wrestling'],['go_behind'],['sx_german_release_rev'],'sx_german','The waist grip is released at the throw apex rather than being held through a bridging cover.'],
    ['sx_rolling_german','Throw','rolling german suplexes','standing/rear-waist','mat/released','back',['wrestling'],['go_behind'],['sx_rolling_german_rev'],'sx_german','Three linked throws are narrated as one action; no phantom extra turns are created.'],
    ['sx_dragon','Throw','full nelson suplex','standing/upper-body','mat/released','neck',['wrestling'],['go_behind'],['sx_dragon_rev'],null,'A rear full-nelson arm capture initiates a bridge suplex targeting the neck.'],
    ['sx_tiger','Throw','rear double arm suplex','standing/upper-body','mat/released','neck',['wrestling'],['go_behind'],['sx_tiger_rev'],null,'Both arms are trapped from behind before a bridging suplex targeting the neck.'],
    ['sx_double_underhook','Throw','double underhook suplex','standing/upper-body','mat/released','back',['wrestling'],['front_facelock'],['sx_double_underhook_rev'],null,'Both arms are hooked for the turnover; no persistent double-underhook grip is introduced.'],
    ['sx_side','Throw','lateral body suplex','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['sx_side_rev'],null,'The attacker positions beside the opponent and drops sideways with a body lift.'],
    ['sx_brainbuster','Throw','vertical head impact brainbuster','standing/front-facelock','mat/released','neck',['wrestling'],['front_facelock'],['sx_brainbuster_rev'],'sx_vertical','A vertical lift drives the head towards the mat and carries the existing neck target.'],
    ['sx_gutwrench','Throw','waist encircling gutwrench','standing/upper-body','mat/released','ribs',['wrestling'],['waistlock'],['sx_gutwrench_rev'],null,'A midsection grip powers the turnover and retains the fixed ribs target.'],
    ['sx_overhead','Throw','overhead belly to belly throw','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['sx_overhead_rev'],'sx_belly_belly','An upper-body tie becomes a high overhead release rather than a lower body turn.'],
    ['sx_butterfly','Throw','butterfly double arm suplex','standing/upper-body','mat/released','back',['wrestling'],['front_facelock'],['sx_butterfly_rev'],'sx_double_underhook','A butterfly arm hook sets the throw without becoming a sustained submission.'],
    ['sx_tbone','Throw','side capture bone throw','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['sx_tbone_rev'],null,'An off-axis upper-body lift throws the opponent across the ring under existing lift checks.'],
    ['sx_snap_ddt','Wrestling-only','snap suplex with cover','standing/front-facelock','mat/released','back',['wrestling'],['front_facelock'],['sx_snap_ddt_rev'],'sx_vertical','Despite the ID this is a snap suplex into a cover, not a DDT or a guaranteed fall.'],
    ['sx_cradle','Throw','leg and head cradle suplex','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['sx_cradle_rev'],null,'Leg and head control shape the suplex while the nearfall remains a separate follow-up.'],
    ['sx_half_nelson','Throw','rear half nelson suplex','standing/upper-body','mat/released','neck',['wrestling'],['go_behind'],['sx_half_nelson_rev'],null,'One arm is held in a half nelson through a neck-targeting overhead throw.'],
    ['sx_saito','Throw','rear waistlift back suplex','standing/rear-waist','mat/released','back',['wrestling'],['go_behind'],['sx_saito_rev'],'sx_belly_back','A rear waistlift drops the opponent onto the upper back with no retained rear grip.'],
    ['sx_falcon_arrow','Throw','vertical sitout driver','standing/front-facelock','mat/released','back',['wrestling'],['front_facelock'],['sx_falcon_arrow_rev'],'sx_vertical','A vertical suplex setup becomes a seated impact; the nearfall is optional.'],
    ['pw_sidewalk','Throw','lateral sidewalk slam','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['pw_sidewalk_rev'],null,'A lateral catch turns into a downward body drop rather than a waist throw.'],
    ['pw_spinebuster_running','Throw','running catch spinebuster','standing/upper-body','mat/released','back',['wrestling'],['rope_rebound'],['pw_spinebuster_running_rev'],null,'The returning runner is caught and rotated down with a spinebuster.'],
    ['pw_chokeslam','Throw','throat controlled high slam','standing/head','mat/released','neck',['wrestling'],['lockup'],['pw_chokeslam_rev'],null,'A throat-area control starts a lift; the graph records neck damage and a mat landing.'],
    ['pw_sitout','Throw','sitout powerbomb nearfall','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['pw_sitout_rev'],'pw_powerbomb','The attacker sits out after a powerbomb; a nearfall is not a completed finish.'],
    ['pw_running_powerbomb','Throw','running loaded powerbomb','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['pw_running_powerbomb_rev'],'pw_powerbomb','A shoulder-loaded opponent is carried into a running slam with live lift limits.'],
    ['pw_argentine','Wrestling-only','argentine shoulder rack backbend','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['pw_argentine_rev'],null,'The shoulder rack is narrated as one power beat ending on the mat, not a sustained hold.'],
    ['pw_uranage','Throw','underarm rear slam','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['pw_uranage_rev'],null,'An arm-under-body clinch drives the opponent backwards into the canvas.'],
    ['pw_belly_bump','Throw','bearhug release belly throw','standing/upper-body','mat/released','ribs',['wrestling'],['pw_bearhug'],['pw_belly_bump_rev'],null,'The established bearhug gives way to a belly throw and the fixed ribs target.'],
    ['pw_pumphandle','Throw','arm and leg pumphandle lift','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['pw_pumphandle_rev'],null,'A trapped arm and leg form a lift grip, not a persistent submission hold.'],
    ['pw_side_slam','Throw','swinging lateral side slam','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['pw_side_slam_rev'],'pw_sidewalk','A side pickup turns through a swing before the mat impact.'],
    ['pw_tiltawhirl_slam','Throw','rebound tilt a whirl slam','standing/upper-body','mat/released','back',['wrestling'],['rope_rebound'],['pw_tiltawhirl_slam_rev'],null,'A rebounding opponent rotates around the attacker before landing on the mat.'],
    ['pw_alabama','Throw','inverted leg capture slam','standing/leg','mat/released','back',['wrestling'],['lockup'],['pw_alabama_rev'],null,'The legs are held during an inverted pickup and backward impact.'],
    ['pw_lariat_catch','Strike','rope whip lariat','standing/free','mat/released','neck',['wrestling'],['rope_rebound'],['pw_lariat_catch_rev'],null,'A whip-rebound lariat strikes the neck; this is not a lift despite its family.'],
    ['pw_slam_catch','Throw','midair catch body slam','standing/upper-body','mat/released','back',['wrestling'],['rope_rebound'],['pw_slam_catch_rev'],null,'The advancing opponent is caught in midair and slammed.'],
    ['pw_powerslam_corner','Throw','corner exit catch powerslam','standing/upper-body','mat/released','back',['wrestling'],['corner_escape'],['pw_powerslam_corner_rev'],'pw_scoop_powerslam','A wrestler leaving the corner is caught in a powerslam with no saved catch grip.'],
    ['pw_double_chop_slam','Throw','lifting gutbuster knee drop','standing/upper-body','mat/released','ribs',['wrestling'],['lockup'],['pw_double_chop_slam_rev'],null,'Despite its ID the action is a gutbuster across a knee, targeting the ribs.'],
    ['pw_shoulder_tackle_power','Takedown','running shoulder body tackle','standing/free','mat/released','back',['wrestling'],['rope_run'],['pw_shoulder_tackle_power_rev'],null,'A forward shoulder tackle knocks down the opponent without a lifting grip.'],
    ['nk_double_arm_ddt','Wrestling-only','double arm face first ddt','standing/upper-body','mat/released','neck',['wrestling'],['front_facelock'],['nk_double_arm_ddt_rev'],'nk_ddt','A double-arm hook controls the opponent before a neck-targeting DDT.'],
    ['nk_inverted_ddt','Wrestling-only','rear inverted head ddt','standing/head','mat/released','neck',['wrestling'],['go_behind'],['nk_inverted_ddt_rev'],'nk_ddt','The head is captured from behind for an inverted DDT orientation.'],
    ['nk_implant','Wrestling-only','leg assisted implant ddt','standing/front-facelock','mat/released','neck',['wrestling'],['front_facelock'],['nk_implant_rev'],'nk_ddt','A caught leg modifies a DDT delivery without adding persistent leg-grip physics.'],
    ['nk_jumping_neckbreaker','Wrestling-only','leaping neckbreaker drop','standing/head','mat/released','neck',['wrestling'],['headlock'],['nk_jumping_neckbreaker_rev'],null,'A leaping neckbreaker lands on the mat without adding a separate jump state.'],
    ['nk_rolling_neckbreaker','Wrestling-only','rolling neckbreaker turnover','standing/head','mat/released','neck',['wrestling'],['headlock'],['nk_rolling_neckbreaker_rev'],'nk_swinging_neckbreaker','A rolling entry precedes a neckbreaker and final mat landing.'],
    ['nk_bulldog','Wrestling-only','running head control bulldog','standing/head','mat/released','neck',['wrestling'],['rope_rebound'],['nk_bulldog_rev'],null,'A running head tie drives the defender face-first into the canvas.'],
    ['nk_facebuster','Wrestling-only','front face first mat plant','standing/head','mat/released','neck',['wrestling'],['headlock'],['nk_facebuster_rev'],null,'A sudden held-head impact is not necessarily the same as a front facelock DDT.'],
    ['nk_jawbreaker','Strike','sitting shoulder jawbreaker','standing/head','standing/free','neck',['wrestling'],['headlock'],['nk_jawbreaker_rev'],null,'A sit-down shoulder impact snaps the jaw but leaves the game position standing.'],
    ['nk_cutter','Wrestling-only','sudden three quarter cutter','standing/head','mat/released','neck',['wrestling'],['strike_trade'],['nk_cutter_rev'],null,'A sudden three-quarter head tie drops the defender into a cutter.'],
    ['nk_russian_sweep','Takedown','sidearm russian leg sweep','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['nk_russian_sweep_rev'],null,'A side arm hook and leg sweep end in a fall targeting the back rather than neck.'],
    ['nk_sto','Takedown','forearm chest block trip','standing/upper-body','mat/released','back',['wrestling'],['lockup'],['nk_sto_rev'],null,'A forearm across the chest and a leg sweep drop the opponent onto the back.'],
    ['nk_piledriver','Wrestling-only','inverted seated piledriver','standing/upper-body','mat/released','neck',['wrestling'],['front_facelock'],['nk_piledriver_rev'],null,'The opponent is inverted into a seated head impact with existing risk and lift limits.'],
    ['nk_tombstone','Wrestling-only','kneeling tombstone piledriver','standing/upper-body','mat/released','neck',['wrestling'],['front_facelock'],['nk_tombstone_rev'],'nk_piledriver','A close inverted body lift lands on the knees rather than in a seated piledriver.'],
    ['nk_tornado_ddt','Wrestling-only','corner run tornado ddt','corner/head','mat/released','neck',['wrestling'],['corner_whip'],['nk_tornado_ddt_rev'],'nk_ddt','The attacker runs up the turnbuckles from the corner before the DDT mat landing.'],
    ['nk_stunner','Wrestling-only','three quarter seated jaw stunner','standing/head','mat/released','neck',['wrestling'],['strike_trade'],['nk_stunner_rev'],null,'A brief three-quarter tie drops the jaw onto the shoulder without a retained choke.'],

    // Phase 5 final audit: 91 actual wrestling/defensive actions.
    // Fifteen non-technique performance beats are documented in the audit report,
    // not forced into the technique registry. No gameplay edges or school bonuses.
    ['cn_splash','Strike','corner-splash','corner/upper-body','corner/free',null,['wrestling'],['corner_whip'],['cn_splash_rev'],null,'Body-first corner charge compresses the defender against the turnbuckles.'],
    ['cn_stinger','Strike','running-corner-splash','corner/upper-body','standing/free',null,['wrestling'],['corner_whip'],['cn_stinger_rev'],null,'A running splash into the corner leaves the defender staggering out; live position becomes standing.'],
    ['cn_dropkick','Strike','corner-dropkick','corner/free','corner/free',null,['wrestling'],['corner_whip'],['cn_dropkick_rev'],null,'A running dropkick strikes an opponent already positioned in the corner.'],
    ['cn_forearm','Strike','running-corner-forearm','corner/free','corner/free',null,['wrestling'],['corner_whip'],['cn_forearm_rev'],null,'A running forearm lands against a cornered opponent without moving them to the canvas.'],
    ['cn_cannonball','Wrestling-only','cannonball-senton','corner/upper-body','corner/free',null,['wrestling'],['corner_whip'],['cn_cannonball_rev'],null,'A rolling cannonball lands into a cornered opponent while the graph remains in the corner.'],
    ['cn_shoulders','Strike','shoulder-thrusts','corner/upper-body','corner/free','ribs',['wrestling'],['corner_whip'],['cn_shoulders_rev'],null,'Repeated shoulder thrusts target the ribs; the corner pressure does not create a saved body lock.'],
    ['cn_mounted_punches','Strike','mounted-punches','corner/head','corner/free',null,['wrestling'],['corner_whip'],['cn_mounted_punches_rev'],null,'Corner-mounted punches are a counted exchange, not an independent top-rope aerial attack.'],
    ['cn_tree_of_woe','Wrestling-only','tree-of-woe-stomps','corner/leg','corner/free',null,['wrestling'],['corner_whip'],['cn_tree_of_woe_rev'],null,'The opponent hangs inverted in the turnbuckles while stomps land; no permanent trapped-leg state exists.'],
    ['cn_chops','Strike','corner-chops','corner/free','corner/free','ribs',['wrestling'],['corner_whip'],['cn_chops_rev'],null,'Repeated chops work the ribs in the corner without an additional grip transition.'],
    ['cn_monkey_flip','Throw','monkey-flip','corner/upper-body','mat/released',null,['wrestling'],['corner_whip'],['cn_monkey_flip_rev'],null,'Feet planted on the hips flip the opponent out of the corner into a mat landing.'],
    ['cn_clothesline','Strike','corner-clothesline','corner/free','corner/free','neck',['wrestling'],['corner_whip'],['cn_clothesline_rev'],null,'A clothesline delivered into the turnbuckles carries the existing neck target.'],
    ['cn_knee','Strike','corner-knee-strike','corner/free','corner/free',null,['wrestling'],['corner_whip'],['cn_knee_rev'],null,'A knee charge hits a slumped corner opponent and does not itself create a mat transition.'],
    ['cn_snapmare','Throw','snapmare-out-of-the-corner','corner/head','mat/released',null,['wrestling'],['corner_whip'],['cn_snapmare_rev'],null,'A snapmare pulls the defender away from the corner onto the mat.'],
    ['cn_hip_attack','Strike','corner-hip-attack','corner/free','corner/free',null,['wrestling'],['corner_whip'],['cn_hip_attack_rev'],null,'A running hip-first corner collision retains the corner finish position.'],
    ['cn_avalanche','Wrestling-only','avalanche','corner/upper-body','corner/free',null,['wrestling'],['corner_whip'],['cn_avalanche_rev'],null,'A full-speed body avalanche compresses a cornered defender against the pads.'],
    ['cn_face_buckle','Strike','turnbuckle-smash','corner/head','corner/free',null,['wrestling'],['corner_whip'],['cn_face_buckle_rev'],null,'The opponent\'s face is forced into the top turnbuckle; the corner position remains active.'],
    ['cn_choke','Wrestling-only','boot-choke','corner/head','corner/free','neck',['wrestling'],['corner_whip'],['cn_choke_rev'],null,'An illegal boot choke targets the neck during the referee\'s break count.'],
    ['cn_backflip','Escape & Reversal','corner-backflip','corner/free','standing/free',null,['wrestling'],['corner_whip'],['cn_backflip_rev'],null,'A corner rope-assisted backflip avoids the charge and returns both competitors to standing.'],
    ['ar_headbutt','Strike','diving-headbutt','top/rope-launch','mat/released',null,['wrestling'],['top_climb'],['ar_headbutt_rev'],null,'A diving headbutt launches from the top rope into the canvas-level target.'],
    ['ar_knee','Strike','diving-knee','top/rope-launch','mat/released',null,['wrestling'],['top_climb'],['ar_knee_rev'],null,'A top-rope knee drop lands with no persistent leg or hold state.'],
    ['ar_clothesline','Strike','diving-clothesline','top/rope-launch','mat/released','neck',['wrestling'],['top_climb'],['ar_clothesline_rev'],null,'A diving clothesline catches a rising defender and retains the neck target.'],
    ['ar_axe','Strike','double-axe-handle','top/rope-launch','mat/released',null,['wrestling'],['top_climb'],['ar_axe_rev'],null,'Both fists descend from the top rope as a double axe handle, with lower authored risk.'],
    ['ar_fist','Strike','flying-fist-drop','top/rope-launch','mat/released',null,['wrestling'],['top_climb'],['ar_fist_rev'],null,'A jumping fist drop lands from the top rope with no retained striking control.'],
    ['ar_legdrop','Strike','top-rope-leg-drop','top/rope-launch','mat/released','neck',['wrestling'],['top_climb'],['ar_legdrop_rev'],null,'A top-rope leg drop crosses the throat and retains the recorded neck target.'],
    ['ar_swanton','Wrestling-only','swanton-bomb','top/rope-launch','mat/released',null,['wrestling'],['top_climb'],['ar_swanton_rev'],null,'A forward tucked top-rope rotation lands as a swanton, distinct from a standing senton.'],
    ['ar_stomp','Strike','double-stomp','top/rope-launch','mat/released','ribs',['wrestling'],['top_climb'],['ar_stomp_rev'],null,'A two-foot top-rope stomp targets the ribs; the defender remains on the mat.'],
    ['ar_elbow_point','Strike','diving-elbow','top/rope-launch','mat/released',null,['wrestling'],['top_climb'],['ar_elbow_point_rev'],null,'A top-rope diving elbow follows a crowd cue, but the elbow impact is the actual technique.'],
    ['ar_splash','Wrestling-only','big-splash','top/rope-launch','mat/released',null,['wrestling'],['top_climb'],['ar_splash_rev'],null,'A straight-body splash lands from the top rope without the frog splash\'s described variation.'],
    ['sp_avalanche_german','Throw','avalanche-german-suplex','top/rear-waist','mat/released','back',['wrestling'],['top_follow'],['sp_avalanche_german_rev'],null,'A rear waist control on the turnbuckles leads to a German suplex from the top.'],
    ['sp_hurricanrana','Throw','top-rope-hurricanrana','top/headscissors','mat/released','neck',['wrestling'],['top_follow'],['sp_hurricanrana_rev'],null,'A headscissors turnover flips the defender from the top rope; fixed damage target is neck.'],
    ['sp_powerbomb','Throw','top-rope-powerbomb','top/upper-body','mat/released','back',['wrestling'],['top_follow'],['sp_powerbomb_rev'],null,'A shoulder-loaded powerbomb leaves the turnbuckles with stricter authored lift limits.'],
    ['sp_spider','Throw','spider-german-suplex','top/rear-waist','mat/released','back',['wrestling'],['top_follow'],['sp_spider_rev'],null,'A hanging middle-rope German suplex uses a spider position, not a standing waistlock entry.'],
    ['sp_super_ddt','Wrestling-only','super-ddt','top/front-facelock','mat/released','neck',['wrestling'],['top_follow'],['sp_super_ddt_rev'],null,'A DDT performed from the second rope lands with a recorded neck target.'],
    ['sp_super_arm_drag','Throw','top-rope-arm-drag','top/arm','mat/released','arm',['wrestling'],['top_follow'],['sp_super_arm_drag_rev'],null,'An arm capture rotates the defender off the top rope and retains the arm target.'],
    ['sb_elbow','Strike','springboard-elbow','top/rope-launch','mat/released',null,['wrestling'],['springboard_rise'],['sb_elbow_rev'],null,'A springboard elbow starts from a rope launch and lands on the canvas.'],
    ['sb_clothesline','Strike','springboard-clothesline','top/rope-launch','mat/released','neck',['wrestling'],['springboard_rise'],['sb_clothesline_rev'],null,'The attacker rebounds from the ropes into a clothesline targeting the neck.'],
    ['dv_suicide','Wrestling-only','suicide-dive','outside/free','outside/free',null,['wrestling'],['outside_toss'],['dv_suicide_rev'],null,'A suicide dive passes through the ropes to ringside; the live engine gates the action outside.'],
    ['dv_plancha','Wrestling-only','plancha','outside/rope-launch','outside/free',null,['wrestling'],['outside_toss'],['dv_plancha_rev'],null,'A plancha clears the top rope onto an opponent at ringside, ending outside.'],
    ['dv_moonsault','Wrestling-only','moonsault-to-the-floor','outside/rope-launch','outside/free',null,['wrestling'],['outside_toss'],['dv_moonsault_rev'],null,'A top-rope moonsault lands on the floor and is distinct from a ring-bound moonsault.'],
    ['dv_apron_senton','Wrestling-only','senton-off-the-apron','outside/rope-launch','outside/free',null,['wrestling'],['outside_toss'],['dv_apron_senton_rev'],null,'A senton starts on the apron and lands outside, with no ongoing rope control.'],
    ['dv_cannonball','Wrestling-only','cannonball-off-the-apron','outside/rope-launch','outside/free',null,['wrestling'],['outside_toss'],['dv_cannonball_rev'],null,'An apron cannonball drops onto the ringside opponent; the authored family ends outside.'],
    ['dv_crossbody','Wrestling-only','crossbody-over-the-top-rope','outside/rope-launch','outside/free',null,['wrestling'],['outside_toss'],['dv_crossbody_rev'],null,'A top-rope crossbody launches across the ropes to the floor.'],
    ['dv_asai','Wrestling-only','springboard-moonsault-to-the-floor','outside/rope-launch','outside/free',null,['wrestling'],['outside_toss'],['dv_asai_rev'],null,'A middle-rope springboard moonsault reaches the floor and is distinct from the top-rope dive.'],
    ['dv_somersault','Wrestling-only','somersault-plancha','outside/rope-launch','outside/free',null,['wrestling'],['outside_toss'],['dv_somersault_rev'],null,'A somersault plancha flips over the top rope to a ringside landing.'],
    ['knuckle_lock','Clinch','test-of-strength','standing/wrist','standing/wrist',null,['wrestling'],['lockup'],['knuckle_lock_rev'],null,'A knuckle-lock tests upper-body leverage through finger interlock, not a throw.'],
    ['knuckle_break','Defence','bridge-in-the-test-of-strength','standing/wrist','standing/free',null,['wrestling'],['lockup'],[],null,'The defender bridges out of a knuckle-lock strength contest while still standing.'],
    ['ch_drop_down','Escape & Reversal','drop-down-and-leapfrog','standing/free','standing/free',null,['wrestling'],['lockup'],[],null,'A drop-down and leapfrog evade an oncoming runner without establishing body control.'],
    ['ch_short_arm','Escape & Reversal','escape','standing/free','standing/free',null,['wrestling'],['lockup'],[],null,'The attacker slips out of an existing grip and changes standing position.'],
    ['ch_kip_up','Escape & Reversal','kip-up','standing/free','standing/free',null,['wrestling'],['lockup'],[],null,'An athletic kip-up returns the attacker to standing; no counterattacking strike is assumed.'],
    ['os_barricade','Wrestling-only','barricade-whip','outside/upper-body','outside/free','back',['wrestling'],['floor_brawl'],['os_barricade_rev'],null,'A ringside whip throws the defender against the barricade, targeting the back.'],
    ['os_post','Wrestling-only','ring-post-shot','outside/arm','outside/free','arm',['wrestling'],['floor_brawl'],['os_post_rev'],null,'A shoulder ram into the ring post targets the arm, not an in-ring turnbuckle strike.'],
    ['os_post_leg','Wrestling-only','leg-around-the-post','outside/leg','outside/free','leg',['wrestling'],['floor_brawl'],['os_post_leg_rev'],null,'A leg is drawn around the ring post and wrenched with a bespoke escape alternative.'],
    ['os_apron_knee','Strike','apron-knee-drop','outside/free','outside/free','neck',['wrestling'],['floor_brawl'],['os_apron_knee_rev'],null,'A knee drops onto a defender draped across the apron, targeting the neck.'],
    ['os_floor_chop','Strike','chop-on-the-floor','outside/free','outside/free','ribs',['wrestling'],['floor_brawl'],['os_floor_chop_rev'],null,'A ringside chop targets the ribs and leaves the wrestlers outside.'],
    ['os_steps','Wrestling-only','whip-into-the-ring-steps','outside/upper-body','outside/free','leg',['wrestling'],['floor_brawl'],['os_steps_rev'],null,'A whip into the steel ring steps targets the leg as authored.'],
    ['os_apron_slam','Throw','body-slam-on-the-apron','outside/upper-body','outside/free','back',['wrestling'],['floor_brawl'],['os_apron_slam_rev'],null,'A body slam lands on the hard apron, with existing back target and lift restrictions.'],
    ['os_headbutt','Strike','headbutt-on-the-floor','outside/head','outside/free',null,['wrestling'],['floor_brawl'],['os_headbutt_rev'],null,'A hair-assisted headbutt lands on the floor without granting lasting head control.'],
    ['os_apron_forearm','Strike','forearm-on-the-apron','outside/free','outside/free',null,['wrestling'],['floor_brawl'],['os_apron_forearm_rev'],null,'A forearm catches the opponent climbing back from the apron.'],
    ['os_ropes_choke','Wrestling-only','choke-on-the-bottom-rope','outside/head','outside/free','neck',['wrestling'],['floor_brawl'],['os_ropes_choke_rev'],null,'A bottom-rope ringside choke targets the neck during a referee count.'],
    ['os_apron_kick','Strike','kick-from-the-apron','outside/free','outside/free',null,['wrestling'],['floor_brawl'],['os_apron_kick_rev'],null,'A head-height kick is delivered from the apron while the action remains outside.'],
    ['hl_hair_pull','Clinch','hair-pull','standing/head','standing/free',null,['wrestling'],['strike_trade'],['hl_hair_pull_rev'],null,'An illegal hair grip drags the defender while both wrestlers remain standing.'],
    ['hl_thumb','Strike','thumb-to-the-eye','standing/free','standing/free',null,['wrestling'],['strike_trade'],['hl_thumb_rev'],null,'A covert thumb jab is directed into the eye; its reversal is a separate action.'],
    ['hl_low_blow_tease','Strike','kick-to-the-knee','standing/free','standing/free','leg',['wrestling'],['strike_trade'],['hl_low_blow_tease_rev'],null,'Despite the ID, the authored action is a knee kick targeting the leg, not a groin strike.'],
    ['hl_choke_shirt','Wrestling-only','choke-with-the-tape','standing/head','standing/free','neck',['wrestling'],['strike_trade'],['hl_choke_shirt_rev'],null,'The attacker uses wrist tape to choke the neck during a referee count.'],
    ['hl_bite','Strike','bite','standing/head','standing/free',null,['wrestling'],['strike_trade'],['hl_bite_rev'],null,'An illegal bite to the forehead is a discrete physical action, not a taunt.'],
    ['hl_rake','Strike','rake-across-the-eyes','standing/free','standing/free',null,['wrestling'],['strike_trade'],['hl_rake_rev'],null,'An eye rake interrupts a comeback without an invented head or eye damage target.'],
    ['fr_punch_flurry','Strike','comeback-punches','standing/free','standing/free',null,['wrestling'],['dramatic_rally'],['fr_punch_flurry_rev'],null,'A counted comeback punch combination restores momentum without changing the standing state.'],
    ['fr_ten_punches','Strike','punches-in-the-corner','corner/free','corner/free',null,['wrestling'],['corner_whip'],['fr_ten_punches_rev'],null,'Corner-mounted punches are a comeback sequence using the corner position gate.'],
    ['fr_double_clothesline','Wrestling-only','double-clothesline','standing/free','mat/released',null,['wrestling'],['dramatic_rally'],[],null,'Two simultaneous clotheslines leave both wrestlers down; neither has a unilateral parent counter.'],
    ['fr_atomic_drop','Throw','atomic-drop','standing/upper-body','standing/free','back',['wrestling'],['dramatic_rally'],['fr_atomic_drop_rev'],null,'A tailbone-first atomic drop targets the back but remains standing in the live graph.'],
    ['fr_back_body_drop','Throw','back-body-drop','standing/upper-body','mat/released',null,['wrestling'],['dramatic_rally'],['fr_back_body_drop_rev'],null,'A countering back-body throw launches a charging opponent onto the mat.'],
    ['fr_flying_forearm','Strike','flying-forearm','standing/free','mat/released',null,['wrestling'],['dramatic_rally'],['fr_flying_forearm_rev'],null,'A rebound forearm flattens the defender and ends in a mat state.'],
    ['fr_inverted_atomic','Throw','inverted-atomic-drop','standing/upper-body','standing/free',null,['wrestling'],['dramatic_rally'],['fr_inverted_atomic_rev'],null,'An inverted atomic drop lifts the defender onto a knee, with live standing exit.'],
    ['fr_hulk_kick','Strike','running-boot','standing/free','mat/released',null,['wrestling'],['dramatic_rally'],['fr_hulk_kick_rev'],null,'A running boot lands during the comeback and drops the defender.'],
    ['fr_mounted_comeback','Strike','mounted-punches-on-the-mat','standing/upper-body','mat/released',null,['wrestling'],['dramatic_rally'],['fr_mounted_comeback_rev'],null,'Mounted punches are narrated as a single mat-ending comeback action.'],
    ['fr_fight_on_knees','Wrestling-only','strikes-on-the-knees','standing/free','standing/free',null,['wrestling'],['dramatic_rally'],['fr_fight_on_knees_rev'],null,'Mutual knee-level striking is an exchange, not one fighter\'s completed individual strike.'],
    ['lc_tornillo','Wrestling-only','tornillo','standing/upper-body','mat/released',null,['wrestling'],['rope_run'],['lc_tornillo_rev'],null,'A spinning forward aerial body attack starts standing and lands on the mat.'],
    ['lc_dropkick_flip','Strike','backflip-into-a-dropkick','standing/free','mat/released',null,['wrestling'],['rope_run'],['lc_dropkick_flip_rev'],null,'A backflip creates distance before a dropkick knocks the defender down.'],
    ['lc_handspring','Strike','handspring-elbow','standing/free','mat/released',null,['wrestling'],['rope_run'],['lc_handspring_rev'],null,'A handspring off the ropes turns into a standing-start back elbow attack.'],
    ['lc_rope_walk','Wrestling-only','rope-walk','standing/rope-launch','mat/released',null,['wrestling'],['rope_run'],['lc_rope_walk_rev'],null,'The attacker walks the top rope into a crossbody; the live action still requires standing.'],
    ['lc_head_kick','Strike','head-kick','standing/free','mat/released',null,['wrestling'],['rope_run'],['lc_head_kick_rev'],null,'A head-height kick lands in the standing-start lucha family without a fixed neck target.'],
    ['rp_hangman','Wrestling-only','hangman-neckbreaker-on-the-ropes','standing/head','standing/free','neck',['wrestling'],['rope_run'],['rp_hangman_rev'],null,'A rope-assisted neckbreaker snaps the neck over the top rope and stays standing.'],
    ['rp_slingshot','Throw','slingshot-back-into-the-ring','standing/upper-body','standing/free','neck',['wrestling'],['rope_run'],['rp_slingshot_rev'],null,'A slingshot projects the defender into the bottom rope, targeting the neck.'],
    ['rp_drop_kick_ropes','Strike','dropkick-on-the-ropes','standing/free','standing/free',null,['wrestling'],['rope_run'],['rp_drop_kick_ropes_rev'],null,'A dropkick hits a defender draped over the middle rope and leaves both standing.'],
    ['rp_tiger_feint','Wrestling-only','feint-kick-through-the-ropes','standing/free','standing/free',null,['wrestling'],['rope_run'],['rp_tiger_feint_rev'],null,'A kick feint through the ropes provokes a recoil without an invented landed strike.'],
    ['rp_ropes_choke','Wrestling-only','choke-on-the-middle-rope','standing/head','standing/free','neck',['wrestling'],['rope_run'],['rp_ropes_choke_rev'],null,'A middle-rope choke ends at the referee\'s count, with no held submission state.'],
    ['rp_rebound_lariat','Strike','rebound-lariat','standing/free','mat/released','neck',['wrestling'],['rope_run'],['rp_rebound_lariat_rev'],null,'A rebound lariat knocks the defender down and retains its neck target.'],
    ['rp_springboard_feint','Strike','fake-springboard','standing/rope-launch','standing/free',null,['wrestling'],['rope_run'],['rp_springboard_feint_rev'],null,'A false springboard is followed by a kick; the kick is the completed attack.'],
    ['rp_second_rope_elbow','Strike','elbow-from-the-middle-rope','standing/rope-launch','mat/released',null,['wrestling'],['rope_run'],['rp_second_rope_elbow_rev'],null,'An elbow from the middle rope knocks the defender to the mat.'],
    ['rp_skin_cat','Escape & Reversal','skin-the-cat','standing/free','standing/free',null,['wrestling'],['rope_run'],['rp_skin_cat_rev'],null,'A skin-the-cat rope recovery swings the attacker back inside while standing.'],
    ['rp_rope_hang','Clinch','tie-up-in-the-ropes','standing/arm','standing/free','ribs',['wrestling'],['rope_run'],['rp_rope_hang_rev'],null,'The defender\'s arms are tied in the ropes during a strike; the graph remains standing.'],

    // Aerial move-specific counters already exist as autogenerated *alternatives*
    // to attempted actions. Do not create impossible landed-dive -> counter links.
    ['ar_frog','Wrestling-only','frog-splash launch','top/rope-launch','mat/released',null,['lucha'],['top_climb'],['ar_frog_rev'],null,'A reviewable diving attack; its generated counter replaces, not follows, a landed dive.'],
    ['ar_senton','Wrestling-only','forward-rotation senton','top/rope-launch','mat/released',null,['lucha','acrobatics'],['top_climb'],['ar_senton_rev'],null,'Forward aerial rotation with a move-specific generated reversal branch.'],
    ['ar_cross_arm','Wrestling-only','flying crossbody','top/rope-launch','mat/released',null,['lucha'],['top_climb'],['ar_cross_arm_rev'],null,'A top-rope crossbody; the defended option remains a separate reversal action.'],
    ['ar_missile_low','Wrestling-only','low-target aerial dropkick','top/rope-launch','mat/released','leg',['lucha'],['top_climb'],['ar_missile_low_rev'],null,'Aerial kick targets the knee; its counter is an alternative during the attempt.'],
    ['sb_cutter','Wrestling-only','springboard cutter','top/rope-launch','mat/released','neck',['lucha','acrobatics'],['springboard_rise'],['sb_cutter_rev'],null,'Rope-launch cutter with the existing springboard family reversal; no new mid-air state.']
  ];
  const registry = Object.create(null);
  for (const [id, mechanicalClass, mechanic, entry, exit, target,
    traditions, setupIds, counterIds, variantOf, note] of proposals) {
    if (has(registry, id)) throw Error('Duplicate technique registry ID: ' + id);
    registry[id] = Object.freeze({
      id, mechanicalClass, mechanic: mechanic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      entry: spec(entry), exit: spec(exit), target: target || null,
      traditionTags: Object.freeze([...traditions]),
      setupIds: Object.freeze([...setupIds]),
      counterIds: Object.freeze([...counterIds]),
      variantOf, editorialNote: note,
      reviewStatus: 'proposed', provenance: 'original-office-engine+independent-editorial-analysis'
    });
  }
  Object.freeze(registry);
  function get(id) { return has(registry, id) ? registry[id] : null; }
  function list() { return Object.values(registry); }
  function validate(graph, auditedIds) {
    const errors = [];
    const A = graph?.A || {};
    const originalIds = new Set(auditedIds || Object.values(graph?.CATALOG?.F || {}).flatMap(f => f.moves.map(m => m[0])));
    const allowedClasses = new Set(CLASSES), allowedTags = new Set(TRADITIONS);
    const allowedGrips = new Set(CONTROLS), allowedPositions = new Set(POSITIONS);
    for (const row of list()) {
      const node = A[row.id];
      assert(originalIds.has(row.id), row.id + ': not an authored catalogue move', errors);
      assert(!!node, row.id + ': unknown action ID', errors);
      if (!node) continue;
      assert(!node.counterOf && !node.blockOf, row.id + ': generated reversal/block used as technique', errors);
      assert(allowedClasses.has(row.mechanicalClass), row.id + ': unknown class', errors);
      assert(/^[a-z]+(?:-[a-z]+)*$/.test(row.mechanic), row.id + ': non-normalised mechanic', errors);
      assert(allowedPositions.has(row.entry.position) && allowedPositions.has(row.exit.position), row.id + ': invalid position', errors);
      assert(allowedGrips.has(row.entry.control) && allowedGrips.has(row.exit.control), row.id + ': invalid grip', errors);
      assert(row.entry.position === node.requires, row.id + ': entry position contradicts live graph', errors);
      assert(row.exit.position === node.zone, row.id + ': exit position contradicts live graph', errors);
      assert(row.target === (node.part || null), row.id + ': target contradicts live graph', errors);
      assert(row.traditionTags.length > 0 && row.traditionTags.every(tag => allowedTags.has(tag)), row.id + ': invalid training affinity tags', errors);
      assert(row.reviewStatus === 'proposed' && row.editorialNote.length >= 12, row.id + ': missing provisional editorial review', errors);
      assert(row.provenance === 'original-office-engine+independent-editorial-analysis', row.id + ': invalid provenance', errors);
      for (const sid of row.setupIds) assert(!!A[sid] && sid !== row.id, row.id + ': unknown/self setup ' + sid, errors);
      for (const cid of row.counterIds) {
        assert(!!A[cid], row.id + ': unknown counter ' + cid, errors);
        if (A[cid]) assert(A[cid].counterOf === row.id, row.id + ': counter is not move-specific: ' + cid, errors);
      }
      if (row.variantOf) {
        assert(row.variantOf !== row.id && !!get(row.variantOf), row.id + ': missing parent variant', errors);
        if (get(row.variantOf)) {
          let parent = get(row.variantOf), steps = 0;
          while (parent && parent.variantOf) {
            parent = get(parent.variantOf); steps++;
            if (parent?.id === row.id || steps >= proposals.length) { errors.push(row.id + ': variant cycle'); break; }
          }
        }
      }
      assert(new Set(row.setupIds).size === row.setupIds.length && new Set(row.counterIds).size === row.counterIds.length, row.id + ': repeated relation', errors);
    }
    return Object.freeze({
      valid: errors.length === 0,
      errors,
      proposals: list().length,
      authored: originalIds.size,
      coverage: originalIds.size ? Math.round(list().length / originalIds.size * 1000) / 10 : 0
    });
  }
  return Object.freeze({
    VERSION, CLASSES, TRADITIONS, CONTROLS, POSITIONS,
    RECORDS: registry, get, list, validate
  });
});
