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
