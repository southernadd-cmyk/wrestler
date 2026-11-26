/* THE OFFICE v2.7 — hierarchical causal graph, based on match-psychology research.
   Moved out of match-engine.js with no change in behaviour. The engine passes in the helpers the
   graph shares with it (see install() in match-engine.js); the graph reads them through $d. */
(function(root){'use strict';
const installGraph=function($d){
/* THE OFFICE v2.7 — hierarchical causal graph, based on match-psychology research */
// Shared with Graph selection and the outer tick simulation.
const brawlConditioning=actor=>$d.clamp(
 ((actor.ring||0)+(actor.safe||0)+(actor.psych||0)-180)/90,0,1);
const Graph=(function makeGraph(){
 const A={};
 const {arcWords,chooseAction,speakAction,textureLine,BROADCAST_NAMES}=root.OfficeGraphNarration.install($d,A);
 const SCRIPTED_SPOT_IDS=Object.freeze({
  'a piledriver on the floor':'os_floor_piledriver',
  'a suplex onto the entrance ramp':'os_ramp_suplex',
  'a spear through the barricade':'os_barricade_spear',
  'a superplex from the top rope':'sp_superplex',
  'a top-rope German suplex':'sp_avalanche_german',
  'a deadlift bridging suplex':'sx_deadlift_bridge',
  'a 450 splash':'ar_450',
  'a tope con hilo over the top rope':'dv_tope_con_hilo',
  'a shooting star press off the top':'ar_shooting_star',
  'a diving elbow from the top':'ar_elbow_point',
  'a DDT on the apron':'os_apron_ddt',
  'a backdrop over the top rope to the floor':'os_ropes_backdrop'
 });
 const introducedPhase9=new Set();
 // Phase 3 / small, curated, live technique sequences. These IDs are ALREADY in
 // the authored graph; they do not unlock new moves or alter the finish contract.
 // Entry position compatibility is enforced at build time and again by isValid().
 // "counter" entries are alternatives to an attempted move, never after a landed one.
 const TECHNIQUE_PILOT=Object.freeze([
  ['wristlock','ch_top_wristlock',1.35,'setup','Catch: retain wrist control'],
  ['ch_top_wristlock','ch_rolling_wristlock',1.65,'setup','Catch: roll through the trapped wrist'],
  ['ch_rolling_wristlock','ch_deep_arm_drag',1.65,'setup','Catch: turn wrist control into an arm drag'],
  ['ch_cravate','ch_headlock_takedown',1.4,'setup','Catch: head control to mat takeover'],
  ['front_facelock','ch_snapmare',1.2,'setup','Catch: snapmare from secured head control'],
  ['ch_snapmare','sm_sleeper',1.45,'setup','Catch: hold the head after landing'],
  ['ch_single_leg','sm_ankle_lock',1.4,'setup','Catch: retained leg to ankle lock'],
  ['ch_dragon_screw','sm_figure_four',1.35,'setup','Catch: targeted leg twist to leglock'],
  ['rope_run','lc_hurricanrana',1.3,'setup','Lucha: rana as opponent rebounds'],
  ['lc_hurricanrana','early_cover',1.35,'followup','Lucha: brief nearfall after the throw'],
  ['lockup','ch_single_leg_rev',.95,'counter','Catch: sprawl turns aside a single-leg shot from the tie-up']
 ].map(([from,to,weight,kind,reason])=>Object.freeze({from,to,weight,kind,reason})));
 // Phase 5: bounded pathways for training foundations. Keep the original
 // 11 Phase 3 links separately inspectable so their baseline remains comparable.
 const TECHNIQUE_EXPANSION=Object.freeze([
  ['st_jab','st_gut_punch',1.2,'setup','Boxing: jabs set up a shot to the body'],
  ['waistlock','pw_body_slam',1.05,'setup','Strength: a controlled scoop from the body tie-up'],
  ['rope_rebound','pw_fallaway',1.05,'setup','Strength: catch the returning opponent with a fallaway slam'],
  ['lockup','pw_military_press',.85,'setup','Strength: lift from a stable initial tie-up'],
  ['pw_torture_rack','pw_samoan_drop',1.1,'setup','Strength: loaded shoulders transition into a controlled drop'],
  ['top_climb','ar_shooting_star',.95,'setup','Acrobatics: controlled top-rope rotation'],
  ['top_climb','ar_corkscrew',.9,'setup','Acrobatics: change the rotational axis off the top'],
  ['top_climb','ar_450',.85,'setup','Acrobatics: 450 press with existing late-match risk gate'],
  ['springboard_rise','sb_dropkick',1.1,'setup','Acrobatics: kick from a settled springboard'],
  ['springboard_rise','sb_moonsault',1.0,'setup','Acrobatics: reverse rotation off a springboard'],
  ['front_facelock','sx_fisherman',1.05,'setup','Catch: leg hook and controlled bridge'],
  ['waistlock','sx_exploder',1.05,'setup','Judo: off-balance a body tie-up into a leg-hook throw'],
  ['wristlock','pn_backslide',.95,'setup','Catch and lucha: arm restraint to a quick cradle'],
  ['wristlock','pn_crucifix',.9,'setup','Lucha: controlled arm trap into a crucifix pin']
 ].map(([from,to,weight,kind,reason])=>Object.freeze({from,to,weight,kind,reason})));
 // Phase 5b: mat-control follow-through, close striking combinations, and
 // two aerial entry choices. Aerial move-specific counters remain reviewed
 // generated alternatives, not fabricated landed-dive -> reversal links.
 const TECHNIQUE_TRANCHE2=Object.freeze([
  ['mat_hold','sm_boston',.9,'setup','Catch: convert established mat pressure into a Boston crab'],
  ['mat_hold','sm_triangle',.85,'setup','Catch and judo: head and arm trap from sustained mat control'],
  ['mat_hold','sm_rear_naked',.8,'setup','Catch and judo: a grounded rear choke from secured control'],
  ['mat_hold','sm_stf',.9,'setup','Catch: leg trap to grounded STF'],
  ['mat_hold','sm_short_arm_scissors',.8,'setup','Catch: isolate the arm from stable mat control'],
  ['sm_boston','sm_single_crab',.75,'followup','Catch: release one leg to isolate the other'],
  ['sm_kneebar','sm_heel_hook',.7,'followup','Catch: leg extension to heel-rotation pressure'],
  ['sm_armbar','sm_keylock',.75,'followup','Catch and judo: reposition the isolated arm into a keylock'],
  ['sm_keylock','sm_crossface',.7,'followup','Catch: release shoulder pressure into a crossface'],
  ['sm_triangle','sm_arm_triangle',.6,'followup','Catch and judo: switch from leg triangle into arm triangle'],
  ['st_gut_punch','st_kneelift',.9,'followup','Ring striking: folded torso invites a rising knee'],
  ['st_forearm','st_elbow_smash',.9,'followup','Ring striking: close distance from forearm to elbow'],
  ['st_leg_kick','st_roundhouse',.7,'followup','Ring striking: low kick draws a high guard change'],
  ['st_gut_punch','st_uppercut',.8,'followup','Ring striking: body opening into a European forearm uppercut'],
  ['top_climb','ar_frog',.85,'setup','Lucha: settled top-rope launch into frog splash'],
  ['springboard_rise','sb_cutter',.7,'setup','Lucha and acrobatics: stable springboard into a cutter']
 ].map(([from,to,weight,kind,reason])=>Object.freeze({from,to,weight,kind,reason})));
 // Phase 8: grounded limb control and short striking follow-throughs.
 const TECHNIQUE_DEPTH=Object.freeze([
  ['gd_arm_elbows','sm_armbar',.65,'followup','Curated position-compatible technique continuation'],
  ['gd_arm_elbows','sm_keylock',.65,'followup','Curated position-compatible technique continuation'],
  ['gd_knee_stomp','sm_single_crab',.65,'followup','Curated position-compatible technique continuation'],
  ['gd_knee_stomp','sm_kneebar',.65,'followup','Curated position-compatible technique continuation'],
  ['gd_dragon_screw_ground','sm_ankle_lock',.65,'followup','Curated position-compatible technique continuation'],
  ['sm_fujiwara','sm_keylock',.65,'followup','Curated position-compatible technique continuation'],
  ['sm_short_arm_scissors','sm_armbar',.65,'followup','Curated position-compatible technique continuation'],
  ['sm_heel_hook','sm_ankle_lock',.65,'followup','Curated position-compatible technique continuation'],
  ['sm_armbar','sm_cross_armbreaker',.65,'followup','Curated position-compatible technique continuation'],
  ['st_chop','st_forearm',.65,'followup','Curated position-compatible technique continuation'],
  ['st_uppercut','st_kneelift',.65,'followup','Curated position-compatible technique continuation'],
  ['st_kneelift','st_gut_punch',.65,'followup','Curated position-compatible technique continuation'],
  ['st_palm','st_elbow_smash',.65,'followup','Curated position-compatible technique continuation'],
  ['st_leg_kick','st_kneelift',.65,'followup','Curated position-compatible technique continuation']
 ].map(([from,to,weight,kind,reason])=>Object.freeze({from,to,weight,kind,reason})));
 // Post-v0.4 review: a small group of concrete, position-compatible
 // handoffs from the evidence-led 24-move audit. These are not generated from
 // shared family names. Each requires its own source beat, its live legality
 // checks, and its genuine original move-specific defensive alternatives.
 const TECHNIQUE_AUDIT24_LINKS=Object.freeze([
  ['front_facelock','nk_snap_ddt',.95,'setup','Retained head control allows a quick DDT, without waiving the authored stamina and position checks'],
  ['front_facelock','nk_swinging_neckbreaker',.85,'setup','Release the standing head tie into a rotating neckbreaker'],
  ['pw_bearhug','pw_backbreaker',.9,'followup','A close body clinch enables the weight-limited knee-supported backbreaker'],
  ['leg_wrench','rs_leg_lace',1.15,'followup','Persisted grounded leg access leads into an actual leg lace'],
  ['nk_ddt','rs_front_chancery',.85,'followup','After a landed DDT, transition from head impact to grounded chancery'],
  ['gd_senton','gd_ground_pound',.7,'followup','Follow a grounded back senton by closing distance into mounted punches'],
  ['st_double_chop','st_chop',.8,'followup','Close-range shoulder chops can flow into a chest-target knife-edge chop']
 ].map(([from,to,weight,kind,reason])=>Object.freeze({from,to,weight,kind,reason})));
 // Phase 9: hand-authored context and grip-specific transitions. No family lottery.
 const TECHNIQUE_CHAINS=Object.freeze([
  ['lockup','ch_top_wristlock',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['lockup','front_facelock',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['wristlock','ch_rolling_wristlock',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['ch_top_wristlock','hammerlock',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['ch_top_wristlock','ch_short_arm',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['ch_rolling_wristlock','ch_short_arm',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['ch_short_arm','ch_deep_arm_drag',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['ch_short_arm','ch_japanese_arm_drag',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['hammerlock','ch_rolling_wristlock',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['standing_switch','sx_german',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['go_behind','ch_leg_trip',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['go_behind','ch_double_leg',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['front_facelock','ch_snapmare',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['front_facelock','sx_vertical',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['front_facelock','sx_brainbuster',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['ch_cravate','ch_headlock_takedown',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['ch_cravate','nk_swinging_neckbreaker',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['waistlock','sx_belly_back',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['waistlock','sx_gutwrench',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['waist_escape','standing_switch',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['go_behind','sx_saito',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['go_behind','sx_half_nelson',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['front_facelock','sx_double_underhook',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['front_facelock','sx_butterfly',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['front_facelock','sx_snap_ddt',.72,'Catch ties and throws','Maintain or change a controlled grip before a takedown'],
  ['mat_hold','gd_arm_stomp',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['mat_hold','gd_arm_elbows',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['mat_hold','sm_armbar',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['mat_hold','sm_kimura',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['mat_hold','sm_chinlock',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['gd_arm_stomp','sm_kimura',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['gd_arm_stomp','sm_fujiwara',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['gd_arm_elbows','sm_wristlock_ground',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_wristlock_ground','sm_short_arm_scissors',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_wristlock_ground','sm_armbar',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_kimura','sm_keylock',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_kimura','sm_fujiwara',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_keylock','sm_cross_armbreaker',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_cross_armbreaker','sm_armbar',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_armbar','sm_fujiwara',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_fujiwara','sm_wristlock_ground',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['rs_hammerlock_mat','sm_kimura',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['rs_wrist_mat','sm_armbar',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['sm_short_arm_scissors','sm_keylock',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['rs_front_chancery','sm_anaconda',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['rs_reverse_chinlock','sm_dragon_sleeper',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['rs_body_scissors','sm_rear_naked',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['rs_seated_chinlock','sm_sleeper',.72,'Arm control on the mat','Keep an isolated wrist, shoulder or elbow while changing the hold'],
  ['mat_hold','gd_knee_stomp',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['mat_hold','gd_elbow_neck',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['mat_hold','sm_ankle_lock',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['gd_dragon_screw_ground','sm_toe_hold',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_toe_hold','sm_ankle_lock',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_ankle_lock','sm_kneebar',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_kneebar','sm_single_crab',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_single_crab','sm_boston',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_boston','sm_sharpshooter',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_sharpshooter','sm_cloverleaf',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_figure_four','sm_deathlock',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_triangle','sm_arm_triangle',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_arm_triangle','sm_anaconda',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_rear_naked','sm_dragon_sleeper',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['gd_elbow_neck','sm_crossface',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['sm_crossface','sm_stf',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['gd_lower_back_knee','sm_boston',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['gd_knee_stomp','sm_heel_hook',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['gd_arm_stomp','sm_wristlock_ground',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['rs_leg_lace','sm_toe_hold',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['rs_wrist_mat','sm_short_arm_scissors',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['rs_mat_stretch','sm_camel',.72,'Grounded leg and neck control','Follow an established mat hold into a related leg or head-control position'],
  ['probe_strike','st_jab',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_jab','st_forearm',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_jab','st_body_kick',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_jab','st_palm',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_forearm','st_uppercut',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_forearm','st_kneelift',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_forearm','st_spinning_backfist',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_chop','st_uppercut',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_chop','st_gut_punch',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_open_slap','st_forearm',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_open_slap','st_chop',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_gut_punch','st_elbow_smash',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_gut_punch','st_knee_strike',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_kneelift','st_elbow_smash',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_kneelift','st_uppercut',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_palm','st_kneelift',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_elbow_smash','st_headbutt',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_uppercut','st_forearm',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_leg_kick','st_body_kick',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_leg_kick','st_side_kick',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_body_kick','st_spinning_backfist',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_body_kick','st_superkick',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_headbutt','st_lariat_standing',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_spinning_backfist','st_lariat_standing',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_backhand','st_forearm',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_double_chop','st_kneelift',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['st_eye_rake','hl_ref_argue',.72,'Short striking combinations','Maintain standing range or exploit a lowered guard'],
  ['lockup','pw_bearhug',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['waistlock','pw_bearhug',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['pw_bearhug','pw_side_slam',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['pw_bearhug','pw_uranage',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['pw_bearhug','pw_belly_bump',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['pw_torture_rack','pw_samoan_drop',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['pw_torture_rack','pw_argentine',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['st_kneelift','pw_pumphandle',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['st_gut_punch','pw_backbreaker',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['st_headbutt','pw_body_slam',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['go_behind','sx_german_release',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['go_behind','sx_rolling_german',.72,'Power wrestling and lifted finishes','Use a stable body tie, shoulder load or stunned opponent for controlled power work'],
  ['rope_run','lc_handspring',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rope_run','lc_hurricanrana',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rope_run','lc_headscissors',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rope_run','lc_arm_drag_wheel',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['duck_rebound','lc_wheelbarrow',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['duck_rebound','lc_rana_pin',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['duck_rebound','pn_sunset',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['st_palm','lc_headscissors',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['ch_drop_down','lc_hurricanrana',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['ch_kip_up','lc_handspring',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['waist_escape','lc_wheelbarrow',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['standing_switch','pn_oconnor',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['wristlock','pn_magistral',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['ch_rolling_wristlock','pn_crucifix',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['ch_short_arm','pn_backslide',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rope_rebound','rn_crossbody',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rope_rebound','rn_dropkick',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rope_rebound','rn_lariat',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rope_rebound','rn_spear',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rope_rebound','rn_bicycle_knee',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['springboard_feint','rope_run',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rp_springboard_feint','springboard_rise',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['rp_skin_cat','rope_rebound',.72,'Lucha, counters and fast ropes','Use rope momentum, rotation or arm traps to create another standing entry'],
  ['corner_whip','cn_shoulders',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['corner_whip','cn_forearm',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['corner_whip','cn_chops',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['corner_whip','cn_knee',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['corner_strikes','cn_mounted_punches',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['corner_strikes','cn_choke',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_shoulders','cn_chops',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_shoulders','cn_knee',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_chops','cn_mounted_punches',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_chops','cn_face_buckle',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_mounted_punches','cn_face_buckle',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_tree_of_woe','cn_cannonball',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_tree_of_woe','cn_knee',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_choke','cn_face_buckle',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_forearm','cn_clothesline',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_knee','cn_snapmare',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_hip_attack','cn_chops',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['cn_face_buckle','cn_chops',.72,'Corner sequences','Keep a trapped opponent in the corner until a move changes position'],
  ['floor_brawl','os_floor_chop',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['floor_brawl','os_barricade',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['floor_brawl','os_post',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['floor_brawl','os_apron_knee',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_floor_chop','os_barricade',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_floor_chop','os_apron_forearm',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_barricade','os_post',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_barricade','os_steps',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_post','os_post_leg',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_apron_knee','os_apron_ddt',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_apron_forearm','os_apron_kick',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_steps','os_apron_slam',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_ropes_choke','os_count_tease',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['floor_regroup','os_count_tease',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['os_crowd_brawl','os_barricade',.72,'Ringside exchanges','Keep outside-ring control while moving between barricade, post and apron'],
  ['sx_vertical','gd_elbow_drop',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['sx_vertical','gd_knee_drop',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['sx_german','gd_elbow_neck',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['sx_german','gd_headbutt',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['sx_fisherman','near_kickout',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['sx_northern','near_kickout',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['pw_body_slam','gd_leg_drop',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['pw_body_slam','gd_splash',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['pw_backbreaker','gd_lower_back_knee',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['pw_chokeslam','gd_splash',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['nk_ddt','gd_elbow_neck',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['nk_cutter','gd_elbow_drop',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['lc_hurricanrana','gd_stomp',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['lc_rana_pin','near_kickout',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['ar_frog','early_cover',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['ar_moonsault','early_cover',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['ar_senton','early_cover',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['ar_elbow_point','gd_arm_elbows',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['sb_cutter','gd_elbow_neck',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['rn_spear','early_cover',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['rn_lariat','gd_elbow_drop',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['gd_elbow_drop','early_cover',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['gd_splash','early_cover',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['gd_stomp','sm_single_crab',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['gd_elbow_neck','sm_dragon_sleeper',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response'],
  ['rs_cover_rest','early_cover',.72,'After impact: grounded follow-throughs','Only follow a landed impact with a positionally legal grounded response']
 ].map(([from,to,weight,group,reason])=>Object.freeze({from,to,weight,group,reason})));
 // O(1) authored handoff lookup: bias only the current named move -> next move.
 const CHAIN_BY_PAIR=new Map(TECHNIQUE_CHAINS.map(link=>[link.from+'>'+link.to,link]));
 const CHAIN_SCHOOL={
  'Catch ties and throws':['catch','judo'],
  'Arm control on the mat':['catch','judo'],
  'Grounded leg and neck control':['catch','judo'],
  'Short striking combinations':['boxing'],
  'Power wrestling and lifted finishes':['strength'],
  'Lucha, counters and fast ropes':['lucha','acrobatics'],
  'Corner sequences':['strength','boxing'],
  'Ringside exchanges':['boxing','strength'],
  'After impact: grounded follow-throughs':[]
 };
 const TRAINED_TECHNIQUE_IDS=new Set([...TECHNIQUE_PILOT,...TECHNIQUE_EXPANSION,...TECHNIQUE_TRANCHE2,...TECHNIQUE_DEPTH,...TECHNIQUE_CHAINS,...TECHNIQUE_AUDIT24_LINKS].map(link=>link.to));

 const e=(id,w=1)=>[id,w];
 const CAT=root.OfficeMatchCatalog.build(A,introducedPhase9,TECHNIQUE_PILOT,TECHNIQUE_EXPANSION,TECHNIQUE_TRANCHE2,TECHNIQUE_DEPTH,TECHNIQUE_CHAINS,TECHNIQUE_AUDIT24_LINKS);
 const CROWD_SCALE=.3,SHEET_PULL=1.8;
 const PART_OF={'lower back':'back','left knee':'leg',ankle:'leg',neck:'neck',shoulder:'arm',ribs:'ribs'};
 // Which move families belong in each dramatic arc. A heat segment is ground-and-hold work;
 // a comeback is strikes, rebounds and crowd fire; the finishing stretch reaches for the big spots.
 const ARC_FAMILIES={
  opening:['chain','strike'],chain:['chain','rest'],shine:['chain','running','lucha','strike','rope'],
  cutoff:['heel','strike','corner'],control:['ground','rest','submission','heel','power'],
  hope:['fire','pin'],denial:['heel','ground','rest'],comeback:['fire','running','strike','neck','corner'],
  resurgence:['corner','running','power','suplex','rope','superplex'],exchange:['strike','suplex','neck','pin','lucha','outside','superplex'],
  nearfall:['pin','suplex','power','neck','aerial','superplex'],escalation:['aerial','superplex','dive','neck','power','springboard'],
  finish_setup:['neck','power','suplex','pin','aerial','superplex'],
  stalling:['heel'],test_strength:['chain','power'],limb_work:['ground','submission','rest'],floor_heat:['outside','heel'],
  rest_hold:['rest','ground'],second_hope:['fire','pin'],dive_sequence:['dive','lucha','springboard'],
  fighting_spirit:['strike','fire'],double_down:['fire','strike'],top_rope_battle:['superplex','corner','aerial'],
  submission_battle:['submission','chain'],false_finish:['pin','neck','strike']
 };

 const ARCS={
  opening:{label:'Opening exchanges',phase:'open',control:'neutral',latest:.83,openers:1,min:2,max:5,entry:['circle','lockup','probe_strike','collar_snap','false_handshake'],out:[e('chain',5),e('shine',3),e('cutoff',1),e('stalling',1),e('test_strength',1)]},
  chain:{label:'Chain wrestling',phase:'open',control:'neutral',latest:.83,openers:1,min:3,max:7,entry:['lockup','waistlock','wristlock','ankle_pick','hip_toss'],out:[e('chain',2),e('shine',5),e('cutoff',2),e('test_strength',1)]},
  shine:{label:'Early advantage',phase:'shine',control:'w',latest:.83,openers:1,min:4,max:9,entry:['arm_drag','clothesline','rope_run','wristlock'],out:[e('shine',2),e('cutoff',7),e('exchange',1)]},
  cutoff:{label:'A sudden cut-off',phase:'heat',control:'f',latest:.9,focus:1,min:2,max:4,entry:['cheap_shot','counter_strike','corner_whip','stiff_forearm'],out:[e('control',6),e('hope',2),e('floor_heat',2),e('limb_work',2)]},
  control:{label:'Sustained pressure',phase:'heat',control:'f',latest:.9,focus:1,min:5,max:11,entry:['target_strike','mat_hold','corner_strikes','snap_suplex','body_shot','gutbuster','heavy_slam'],out:[e('control',2),e('hope',5),e('exchange',1),e('limb_work',3),e('rest_hold',2),e('floor_heat',1)]},
  hope:{label:'A hope spot',phase:'heat',control:'f',latest:.9,min:2,max:4,entry:['hope_elbows','mat_scramble','counter_strike'],out:[e('denial',6),e('comeback',3),e('second_hope',1)]},
  denial:{label:'The comeback is cut off',phase:'heat',control:'f',latest:.9,focus:1,min:3,max:6,entry:['hope_cutoff','mat_hold','target_strike'],out:[e('control',4),e('comeback',4),e('rest_hold',2),e('limb_work',1)]},
  comeback:{label:'The comeback',phase:'comeback',control:'w',earliest:.12,openers:1,min:4,max:9,entry:['counter_strike','clothesline','rope_run','snap_suplex','dramatic_rally','rope_rebound'],out:[e('resurgence',4),e('exchange',5),e('cutoff',1),e('dive_sequence',1)]},
  resurgence:{label:'The crowd rises',phase:'comeback',control:'w',openers:1,min:2,max:5,entry:['clothesline','snap_suplex','corner_whip','top_climb'],out:[e('exchange',7),e('cutoff',2),e('dive_sequence',2)]},
  exchange:{label:'Back-and-forth',phase:'stretch',control:'neutral',openers:1,min:4,max:8,entry:['counter_strike','strike_trade','short_arm_lariat','finish_tease','waistlock','last_second_counter','quiet_reversal','baited_charge'],out:[e('nearfall',3),e('escalation',4),e('control',1),e('fighting_spirit',2),e('submission_battle',1),e('top_rope_battle',1)]},
  nearfall:{label:'Near falls',phase:'stretch',control:'neutral',earliest:.3,late:1,min:2,max:5,entry:['snap_suplex','cover','submission_set','counter_rollup','high_crossbody','short_arm_lariat'],out:[e('exchange',3),e('escalation',5),e('nearfall',1),e('false_finish',2),e('double_down',1)]},
  escalation:{label:'Finishing stretch',phase:'stretch',control:'neutral',earliest:.3,late:1,openers:1,min:4,max:8,entry:['finish_tease','corner_whip','top_climb','counter_strike'],out:[e('nearfall',3),e('exchange',2),e('finish_setup',4),e('top_rope_battle',2),e('false_finish',2),e('fighting_spirit',1)]},
  // v3.3 sub-arcs: finer-grained, commonly worked segments inside the classic structure.
  stalling:{label:'Stalling and mind games',phase:'open',control:'neutral',latest:.5,min:2,max:4,entry:['hl_stall','hl_strut','crowd_pose','taunt','hl_ref_argue'],out:[e('chain',3),e('test_strength',2),e('cutoff',2)]},
  test_strength:{label:'Test of strength',phase:'open',control:'neutral',latest:.5,openers:1,min:2,max:4,entry:['knuckle_lock','lockup','collar_snap'],out:[e('chain',3),e('shine',3),e('cutoff',1)]},
  limb_work:{label:'Working the body part',phase:'heat',control:'f',latest:.85,focus:1,min:4,max:8,entry:['target_hold','target_strike','gd_knee_stomp','gd_arm_elbows','gd_lower_back_knee','leg_wrench'],out:[e('control',2),e('hope',4),e('rest_hold',2),e('submission_battle',1)]},
  floor_heat:{label:'Heat on the floor',phase:'heat',control:'f',latest:.8,focus:1,min:2,max:5,entry:['outside_toss','os_barricade','os_post','os_floor_chop'],out:[e('control',4),e('hope',2),e('limb_work',1)]},
  rest_hold:{label:'Selling in a rest hold',phase:'heat',control:'f',latest:.85,focus:1,min:2,max:5,entry:['rs_side_headlock','rs_reverse_chinlock','rs_body_scissors','rs_front_chancery','mat_hold'],out:[e('hope',4),e('second_hope',2),e('control',2)]},
  second_hope:{label:'A second hope spot',phase:'heat',control:'f',earliest:.3,latest:.85,min:2,max:4,entry:['hope_elbows','fr_crowd_clap','counter_strike','mat_scramble'],out:[e('denial',3),e('comeback',5)]},
  dive_sequence:{label:'Dives to the floor',phase:'comeback',control:'w',earliest:.35,openers:1,min:2,max:4,entry:['outside_toss','rope_run','springboard_feint'],out:[e('exchange',4),e('resurgence',2),e('nearfall',2)]},
  fighting_spirit:{label:'A slugfest in the middle',phase:'stretch',control:'neutral',earliest:.5,late:1,openers:1,min:2,max:5,entry:['st_fighting_spirit','fr_no_sell','strike_trade','fr_fight_on_knees'],out:[e('double_down',3),e('nearfall',3),e('escalation',3)]},
  double_down:{label:'Both wrestlers down',phase:'stretch',control:'neutral',earliest:.55,late:1,min:1,max:3,entry:['fr_double_clothesline','double_down_count'],out:[e('fighting_spirit',2),e('nearfall',3),e('escalation',3)]},
  top_rope_battle:{label:'Fight on the top rope',phase:'stretch',control:'neutral',earliest:.55,late:1,min:2,max:4,entry:['corner_whip','corner_strikes','top_follow'],out:[e('nearfall',4),e('escalation',2),e('finish_setup',2)]},
  submission_battle:{label:'Submission battle',phase:'stretch',control:'neutral',earliest:.45,late:1,min:3,max:6,entry:['submission_set','grapple_trip','ankle_pick','ch_single_leg','mat_takedown'],out:[e('nearfall',3),e('escalation',3),e('finish_setup',2)]},
  false_finish:{label:'False finishes',phase:'stretch',control:'neutral',earliest:.6,late:1,min:2,max:5,entry:['finish_tease','pn_small_package','pn_inside_cradle','counter_rollup','pn_backslide'],out:[e('finish_setup',4),e('nearfall',2),e('escalation',1)]},
  finish_setup:{label:'Final sequence',phase:'stretch',control:'neutral',earliest:.43,late:1,min:2,max:8,entry:['finish_tease','counter_strike','clothesline','snap_suplex'],out:[e('finish_setup',4),e('escalation',1)]}
 };
 // The outcome graph is gated by the contract and the manager's live decisions.
 const OUTCOMES={
  win_clean:{who:'w',method:'finisher or submission',legal:'booked clean victory'},
  win_dirty:{who:'w',method:'illegal pin while official is distracted',legal:'booked dirty victory'},
  lose_protected:{who:'f',method:'rope break followed by opportunistic pin',legal:'booked protected loss'},
  lose_clean:{who:'f',method:'counter followed by decisive finisher',legal:'booked decisive loss'},
  // v0.3.22 Disqualifications: booked either way, or called by the referee on what they actually saw.
  win_dq:{who:'w',method:'opponent disqualified in front of the official',legal:'booked disqualification victory'},
  lose_dq:{who:'f',method:'disqualified in front of the official',legal:'booked disqualification loss'},
  dq:{who:'f',method:'disqualified for what the official saw',legal:'referee decision'},
  nc:{who:null,method:'medical stoppage',legal:'explicit injury decision'},
  double:{who:'w',method:'refusing agreed finish',legal:'explicit off-script decision'}
 };
 const OUTCOME_EDGES={finish_setup:Object.keys(OUTCOMES)};
 // Match-study motifs: these guide probabilities; they are not copied scripts.
 // Source notes and direct links are in docs/match-graph.md.
 const PATTERNS={
  story:{inspiredBy:'Classic territory match structure',arcs:['shine','cutoff','control','hope','denial','comeback','resurgence','exchange','finish_setup'],actions:['lockup','arm_drag','cheap_shot','target_hold','hope_elbows','hope_cutoff','clothesline','finish_tease']},
  technical:{inspiredBy:'Hart/Austin 1996 chain-grappling and counters',arcs:['chain','shine','control','hope','exchange','nearfall','finish_setup'],actions:['lockup','wristlock','wrist_escape','hammerlock','waistlock','mat_takedown','mat_scramble','rope_break','submission_set','counter_rollup']},
  brawl:{inspiredBy:'Hart/Austin 1997 grudge, control and ringside fighting',arcs:['cutoff','control','hope','denial','comeback','exchange','escalation','finish_setup'],actions:['probe_strike','strike_trade','cheap_shot','corner_strikes','outside_toss','floor_brawl','floor_counter','roll_inside','target_strike']},
  spots:{inspiredBy:'Interlocking rebound/counter sequences and escalating high-risk exchanges',arcs:['shine','cutoff','comeback','resurgence','exchange','nearfall','escalation','finish_setup'],actions:['rope_run','duck_rebound','shoulder_tackle','clothesline','top_climb','aerial_attack','aerial_counter','cover','near_kickout']},
  safe:{inspiredBy:'Conservative territory layout with clean holds and controlled pace',arcs:['chain','shine','cutoff','control','hope','comeback','exchange','finish_setup'],actions:['lockup','clean_break','wristlock','mat_hold','mat_scramble','rope_break','stand_reset']}
 };
 const PHASE_NAMES={open:'Feeling out',shine:'Early advantage',heat:'Sustained control',comeback:'Comeback',stretch:'Finishing stretch'};

 // v2.9: wrestler identity and match temperament, fixed for the whole bout.
 const STYLE_BEATS={
  Brawl:{open:['stiff_forearm','power_spinebuster','cheap_shot','outside_toss','strike_trade'],bias:{power_spinebuster:3.6,cheap_shot:2.1,strike_trade:2.2,corner_strikes:2.1,outside_toss:2.4,floor_brawl:2.5,top_climb:.32,wristlock:.55}},
  Technical:{open:['collar_snap','ankle_pick','grapple_trip','wristlock','waistlock','hammerlock'],bias:{grapple_trip:3.8,wristlock:2.5,arm_wringer:2.5,mat_takedown:2.2,submission_set:2.8,wrist_escape:2.5,waist_escape:2.4,outside_toss:.35,top_climb:.4}},
  Spectacle:{open:['springboard_feint','rope_rebound','running_headscissors','springboard_rise','rope_run','top_climb','counter_strike'],bias:{springboard_rise:4,top_climb:3.2,rope_run:2.6,duck_rebound:2.2,aerial_attack:2.3,corner_whip:1.8,mat_hold:.5,target_hold:.6}},
  Story:{open:['false_handshake','opponent_study','baited_charge','crowd_pose','taunt','finish_tease','clean_break'],bias:{crowd_pose:3.8,taunt:2.6,finish_tease:2.3,hope_elbows:1.9,cheap_shot:1.6,near_kickout:1.5,top_climb:.75}}
 };
 const MOVE_COST={top_climb:2.2,aerial_attack:3.6,aerial_counter:2,snap_suplex:2,clothesline:1.6,corner_charge:2.2,corner_strikes:1.5,submission_set:2,target_hold:1.2,finish_tease:1.6,outside_toss:2.1,floor_brawl:1.4,mat_takedown:1,strike_trade:1,rope_run:1.2};
 function fighter(w){return $d.D.PROFILES[w?.id]||{kg:85,trait:'Versatile',preferred:[]}}
 function costOf(id){return A[id].cost??MOVE_COST[id]??.55}
 function scout(w,f,plan,heat=0){
  const me=fighter(w),them=fighter(f),gap=them.kg-me.kg;
  const size=gap>=25?`${f.short} has a major size advantage (${gap} kg).`:gap<=-25?`${w.short} has the size advantage (${-gap} kg).`:'They are reasonably matched for size.';
  const styles=`${w.short} favours ${me.trait.toLowerCase()} tactics; ${f.short} prefers ${them.trait.toLowerCase()} tactics.`;
  const fatigue=(w.fatigue||0)>=40?` Fatigue is a serious concern for ${w.short} tonight.`:'';
  const danger=gap>=25?'Avoid lifting the heavier opponent. Use counters and targeted holds.':f.style==='Technical'?'Avoid long mat exchanges. Prioritise clean escapes.':f.style==='Spectacle'?'Keep them off the ropes and make aerial attacks expensive.':f.style==='Brawl'?'Keep the action in the ring instead of brawling on the floor.':'Vary the pace and protect the finishing sequence.';
  const advice={story:'Build patiently to the finish.',technical:'Target a limb and save energy for counters.',brawl:'Save the heavy strikes; a long brawl is exhausting.',spots:'Big aerial moves need setup and fresh legs.',safe:'Use rest holds and avoid unnecessary risks.'};
  const schools=root.OfficeTechniqueBackgrounds;
  const schoolBrief=schools?[
   [w,schools.get(w)],[f,schools.get(f)]
  ].filter(([,school])=>school.id!=='general')
   .map(([actor,school])=>schools.PROVISIONAL_ASSIGNMENTS?.[actor.id]
    ? actor.short+' currently favours '+school.label.toLowerCase()+' techniques (provisional gameplay profile).'
    : actor.short+' brings '+school.label.toLowerCase()+' training to their choices.').join(' '):'';
  const known=(them.signature||[]).map(id=>A[id]?.name).filter(Boolean).slice(0,2);
  const watch=known.length?' Watch for '+f.short+'’s '+known.join(' and ')+'.':'';
  return {brief:styles+' '+size+(heat>=45?' There is personal history here.':'')+fatigue+(schoolBrief?' '+schoolBrief:''),advice:danger+' '+(advice[plan]||advice.story)+watch,you:me,opponent:them};
 }
 function matchTexture(M){
  const gap=Math.abs((M.w.ring+M.w.psych)-(M.f.ring+M.f.psych));
  if(M.o.memory?.rivalry<43&&M.r()<.75)return 'grudge';
  if((M.o.feudHeat||0)>=48&&M.r()<.78)return 'grudge';
  if(gap>=31&&M.r()<.75)return 'underdog';
  if(M.w.style==='Technical'&&M.f.style==='Technical')return 'chess';
  if(M.w.style==='Brawl'&&M.f.style==='Brawl')return 'fight';
  if(M.w.style==='Spectacle'||M.f.style==='Spectacle')return M.r()<.77?'showcase':'fast';
  return M.r()<.38?'fast':'classic';
 }
 function init(M){
  const p=$d.Psy.get(M);
  const frac=M.t/Math.max(1,M.len);
  // v2.6 saved bouts do not have graph state. Resume at the correct
  // narrative stage instead of replaying the opening halfway through.
  const current=M.t<=0?'opening':frac<.2?'chain':frac<.33?'shine':frac<.62?'control':frac<.77?'comeback':'escalation';
  const g={v:1,arc:current,age:0,node:null,visit:{[current]:1},history:[current],events:[],transitions:0,steps:0,lastTags:[],consecutive:0,target:p.target,
   targets:{w:p.target,f:M.w.style==='Technical'?'shoulder':M.w.style==='Spectacle'?'left knee':M.w.style==='Brawl'?'ribs':'lower back'},
   damage:{w:p.focusHits||0,f:0},nearfallCount:0,started:M.t>0,migrated:M.t>0,pattern:M.planId,texture:matchTexture(M),
   aerialAttempts:[],aerialAttemptSerial:0,pendingAerial:null,
   grappleAttempts:[],grappleAttemptSerial:0,pendingGrapple:null,
   strikeAttempts:[],strikeAttemptSerial:0,pendingStrike:null,
   contactAttempts:[],contactAttemptSerial:0,pendingContact:null,physical:null};
  M.graph=g;return g;
 }
 function get(M){
  const g=M.graph||init(M);
  // Existing in-progress saves have no attempt state: default to no pending dive.
  if(!Array.isArray(g.aerialAttempts))g.aerialAttempts=[];
  if(!Number.isSafeInteger(g.aerialAttemptSerial))
   g.aerialAttemptSerial=g.aerialAttempts.reduce((n,x)=>Math.max(n,x.seq||0),0);
  if(!Object.prototype.hasOwnProperty.call(g,'pendingAerial'))g.pendingAerial=null;
  if(!Array.isArray(g.grappleAttempts))g.grappleAttempts=[];
  if(!Number.isSafeInteger(g.grappleAttemptSerial))
   g.grappleAttemptSerial=g.grappleAttempts.reduce((n,x)=>Math.max(n,x.seq||0),0);
  if(!Object.prototype.hasOwnProperty.call(g,'pendingGrapple'))g.pendingGrapple=null;
  if(!Array.isArray(g.strikeAttempts))g.strikeAttempts=[];
  if(!Number.isSafeInteger(g.strikeAttemptSerial))
   g.strikeAttemptSerial=g.strikeAttempts.reduce((n,x)=>Math.max(n,x.seq||0),0);
  if(!Object.prototype.hasOwnProperty.call(g,'pendingStrike'))g.pendingStrike=null;
  if(!Array.isArray(g.contactAttempts))g.contactAttempts=[];
  if(!Number.isSafeInteger(g.contactAttemptSerial))
   g.contactAttemptSerial=g.contactAttempts.reduce((n,x)=>Math.max(n,x.seq||0),0);
  if(!Object.prototype.hasOwnProperty.call(g,'pendingContact'))g.pendingContact=null;
  if(!Object.prototype.hasOwnProperty.call(g,'physical'))g.physical=null;
  return g;
 }
 function pick(M,weighted){
  const arr=weighted.filter(([k,w])=>w>0);const sum=arr.reduce((n,[,w])=>n+w,0);
  if(!sum)return null;let n=M.r()*sum;
  for(const [key,w] of arr){n-=w;if(n<0)return key;}
  return arr[arr.length-1][0];
 }
 function canArc(M,id,frac){
  const g=get(M),n=ARCS[id];if(!n)return false;
  if(root.OfficeSheets?.DIRECTOR?.active(M)){
   // Bypass classic narrative order, but retain arc timing and finish safety.
   if(id==='finish_setup'&&frac<Math.max(.88,($d.Psy.PHASE_ENDS[M.planId]||$d.Psy.PHASE_ENDS.story)[3]+.08))return false;
   if(n.earliest&&frac<n.earliest||n.latest&&frac>n.latest)return false;
   return (g.visit[id]||0)<=4||id==='finish_setup';
  }
  // The narrative clock determines when a major phase is eligible. The action
  // graph can still weave through holds, cut-offs and ordinary exchanges.
  const schedule=$d.phaseFor(frac,M),phaseOrder={open:0,shine:1,heat:2,comeback:3,stretch:4};
  if(id==='exchange'&&phaseOrder[schedule.id]<2)return false;
  if(n.phase==='comeback'&&phaseOrder[schedule.id]<3)return false;
  if(n.phase==='stretch'&&id!=='exchange'&&schedule.id!=='stretch')return false;
  if(id==='finish_setup'&&frac<Math.max(.88,($d.Psy.PHASE_ENDS[M.planId]||$d.Psy.PHASE_ENDS.story)[3]+.08))return false;
  if(schedule.id==='stretch'&&['open','shine','heat'].includes(n.phase))return false;
  if(n.earliest&&frac<n.earliest)return false;
  if(frac<.43&&id==='finish_setup')return false;
  if(n.latest&&frac>n.latest)return false;
  if((g.visit[id]||0)>4&&id!=='finish_setup')return false;
  return true;
 }
 function selectArc(M,frac){
  const g=get(M),arc=ARCS[g.arc],pattern=PATTERNS[M.planId]||PATTERNS.story;
  if(root.OfficeSheets?.DIRECTOR?.active(M)){
   if(frac>.93&&canArc(M,'finish_setup',frac))return 'finish_setup';
   const links=arc.out.filter(([id])=>canArc(M,id,frac))
    .map(([id,w])=>[id,w*root.OfficeSheets.DIRECTOR.arcBias(M,id)]);
   return pick(M,links)||g.arc;
  }
  if(frac>.93&&g.arc!=='finish_setup')return 'finish_setup';
  if(frac>.81&&!arc.late)return 'escalation';
  if(frac>.67&&['open','shine','heat'].includes(arc.phase))return 'comeback';
  const weights=arc.out.filter(([id])=>canArc(M,id,frac)).map(([id,w])=>{
   let weight=w;
   if(pattern.arcs.includes(id))weight*=1.4;
   if(id==='chain'&&M.planId==='technical')weight*=2.5;
   if(id==='cutoff'&&M.planId==='brawl')weight*=1.6;
   if(id==='nearfall'&&M.planId==='spots')weight*=1.8;
   if(id==='exchange'&&(M.planId==='technical'||M.planId==='spots'))weight*=1.35;
   if(id==='control'&&M.o.feudHeat>=45)weight*=1.5;
   if(id==='comeback'&&M.crowd>65)weight*=1.6;
   if((g.visit[id]||0)>1)weight*=.6;
   if(frac>.53&&['comeback','exchange','escalation'].includes(id))weight*=2.5;
   const t=g.texture;
   if(t==='grudge'&&['cutoff','denial','escalation'].includes(id))weight*=1.75;
   if(t==='chess'&&['chain','exchange','nearfall'].includes(id))weight*=1.8;
   if(t==='fight'&&['cutoff','control','exchange'].includes(id))weight*=1.65;
   if(t==='showcase'&&['resurgence','nearfall','escalation'].includes(id))weight*=1.55;
   if(t==='underdog'&&['hope','denial','comeback'].includes(id))weight*=1.5;
   if(t==='fast'&&['shine','exchange','comeback'].includes(id))weight*=1.6;
   return [id,weight];
  });
  // Even the no-edge fallback must respect the late-arc timing guard.
  return pick(M,weights)||(frac>.75&&canArc(M,'escalation',frac)?'escalation':g.arc);
 }
 // Objective actors determine which wrestler a structure wants to see
 // in control; a defensive escape instead gives the opponent an attack to
 // counter. This guides existing arcs, never credits an unperformed action.
 function structureActor(M){
  const director=root.OfficeSheets?.DIRECTOR;
  if(!director?.active(M))return null;
  const obj=director.current(M)?.objective;
  if(!obj||obj.actor==='either'||M.t/Math.max(1,M.len)<obj.window[0]-.07)return null;
  return obj.intent==='escape'?(obj.actor==='w'?'f':'w'):obj.actor;
 }
 function enter(M,id,prev){
  const g=get(M),arc=ARCS[id],p=$d.Psy.get(M);
  const director=root.OfficeSheets?.DIRECTOR;
  const last=g.events.at(-1);
  // A scheduled near-fall is bookkeeping for a real counted cover, not
  // the underlying grounding attack. Its deliberately selected stand_reset
  // node must not make the original landing disappear at an arc transition.
  // Only a verified *earned* cover with its exact still-present physical
  // source may preserve that source's current wrestler and mat position.
  const earnedCover=last?.id==='scheduled_nearfall'&&last.earned===true&&
   g.node==='stand_reset'&&last.sourceSide===p.control&&
   last.control===p.control&&last.position===p.position&&
   last.down===p.down&&p.position==='mat'&&
   M.t-last.t>=0&&M.t-last.t<=30?
    g.events.find(e=>e.id===last.sourceMove&&e.t===last.sourceT&&
     e.preControl===last.sourceSide&&e.control===last.sourceSide&&
     e.position==='mat'&&e.down===last.down&&
     A[e.id]?.zone==='mat'&&A[e.id]?.down==='d'&&
     !A[e.id]?.reverse&&!A[e.id]?.blockOf&&closingValidEvent(e)):null;
  const proof=earnedCover||last,node=A[proof?.id];
  // Phase 9F: a dramatic arc is not a wrestling move. In the final
  // 90 seconds of a clean match, recent genuinely performed in-ring
  // action retains its physical owner until a real action contests it.
  // Apply this to EITHER wrestler, without promising a finish.
  const keepRealControl=!!prev&&!!director?.active(M)&&
   closingEligible(M)&&M.len-M.t>=0&&M.len-M.t<=90&&
   ['w','f'].includes(p.control)&&
   (last?.id===g.node||!!earnedCover)&&
   proof?.control===p.control&&closingValidEvent(proof)&&
   M.t-proof.t>=0&&M.t-proof.t<=40&&
   g.physical?.area==='ring'&&
   !g.pendingAerial&&!g.pendingGrapple&&!g.pendingStrike&&!g.pendingContact&&
   !['rest','heel'].includes(node?.family)&&
   !['finish_tease','crowd_pose','taunt','catch_breath','circle'].includes(proof.id);
  const beforeControl=p.control;
  let words=arcWords(M,id,prev,keepRealControl,g,p);
  const role=director?.active(M)&&arc.control!=='neutral'?
   (structureActor(M)||(arc.control==='w'?M.structureDirector.roles.lead:M.structureDirector.roles.other)):arc.control;
  if(director?.active(M)&&arc.control!=='neutral')
   words=(role==='w'?M.w.short:M.f.short)+' seeks the initiative in this exchange.';
  if(keepRealControl)
   words=(p.control==='w'?M.w.short:M.f.short)+
    ' retains the earned advantage as the match enters its next phase.';
  if(words)$d.say(M,$d.fill(M,words),'story',{textureId:'arc-entry:'+id});
  if(keepRealControl){
   p.phase=arc.phase;
   g.arcPhysicalRetained=(g.arcPhysicalRetained||0)+1;
   if(earnedCover)
    g.arcEarnedNearfallRetained=(g.arcEarnedNearfallRetained||0)+1;
   if(id==='finish_setup')
    g.arcFinishControlRetained=(g.arcFinishControlRetained||0)+1;
   (g.arcPhysicalWitnesses??=[]).push({at:M.t,from:prev,to:id,
    actor:p.control,move:proof.id,moveAt:proof.t,
    position:p.position,down:p.down,
    ...(earnedCover?{afterEarnedNearfall:true}: {})});
   if(g.arcPhysicalWitnesses.length>24)g.arcPhysicalWitnesses.shift();
   return;
  }
  if(arc.control==='w'||arc.control==='f'){
   const change=p.control!==role;
   if(change)p.changes++;
   p.control=role;
   M.mom=role==='w'?Math.max(25,M.mom):Math.min(-25,M.mom);
  }else p.control='neutral';
  if(prev&&director?.active(M)&&closingEligible(M)&&
     M.len-M.t>=0&&M.len-M.t<=90&&
     ['w','f'].includes(beforeControl)&&p.control!==beforeControl)
   g.arcLateControlOverrides=(g.arcLateControlOverrides||0)+1;
  p.phase=arc.phase;
  p.position='standing';p.down=null;
  resetPhysical(M);
  g.node=null;
 }
 // Reserve an opportunity for a genuinely available planned continuation,
 // not for a signed move that is illegal in the current physical state.
 function readyNegotiatedSequence(M){
  if(M.structureDirector?.sequencePolicy!==2)return false;
  const offer=root.OfficeSheets?.DIRECTOR?.sequenceOffer(M,$d.Psy.get(M));
  return !!offer?.continuation&&offer.willingness>=35&&isValid(M,offer.id);
 }
 function advance(M,frac){
  const g=get(M);if(!g.started){g.started=true;enter(M,'opening',null);}g.age++;
  const a=ARCS[g.arc],schedule=$d.phaseFor(frac,M),order={open:0,shine:1,heat:2,comeback:3,stretch:4};
  if(readyNegotiatedSequence(M))return {id:schedule.id,name:a.label};
  // A genuine top-rope setup must get its ONE legal follow-through choice.
  // Previously the arc clock could immediately change to finish_setup,
  // resetting both physical locations before the prepared wrestler could
  // even attempt an attack. Preserve the actual top position for one tick
  // only if a trained high-flyer has a physically legal named risk available.
  // No committed move or result is granted: the next graph selection can
  // still choose a countered attack, a hesitation, or a safe step down.
  const pos=$d.Psy.get(M),last=g.events.at(-1);
  const actor=pos.control==='w'?M.w:pos.control==='f'?M.f:null;
  const setup=pos.position==='top'&&
   (g.node==='top_climb'||g.node==='springboard_rise')&&
   last?.id===g.node&&last.control===pos.control&&
   M.t-last.t>=0&&M.t-last.t<=10;
  if(M.planId==='spots'&&M.len>=900&&M.len-M.t>=10&&
     schedule.id==='stretch'&&
     setup&&actor?.style==='Spectacle'&&recoveryTraining(actor)>=.95&&
     g.physical?.locations?.[pos.control]==='top'&&
     !g.pendingAerial&&!g.pendingGrapple&&!g.pendingStrike&&!g.pendingContact){
   const family=g.node==='top_climb'?'aerial':'springboard';
   if((CAT.members[family]||[]).some(id=>
      A[id]?.risk&&!A[id].counterOf&&!A[id].blockOf&&!A[id].reverse&&
      isAerialParent(id)&&isValid(M,id)))
    return {id:schedule.id,name:a.label};
  }
  // Preserve one *physically available* link after a real late setup.
  // The structure arc clock must not discard its current controller and
  // location before the performer gets even one seeded legal choice.
  // No performed attack, success, position reset or finish is granted here.
  const bookedWinner=M.o.finish==='win_clean'?'w':'f';
  if(closingEligible(M)&&M.t/M.len>=.74&&M.t/M.len<=.98&&
     M.len-M.t>=20&&pos.control===bookedWinner&&
     pos.position==='standing'&&pos.down===null&&
     last?.id===g.node&&CLOSING_SETUPS.has(last.id)&&
     last.preControl===bookedWinner&&last.control===bookedWinner&&
     M.t-last.t>=0&&M.t-last.t<=10&&
     g.physical?.area==='ring'&&
     !g.pendingAerial&&!g.pendingGrapple&&!g.pendingStrike&&!g.pendingContact&&
     A[last.id].next.some(([id])=>A[id]?.zone==='mat'&&
      A[id]?.down==='d'&&!A[id]?.reverse&&!A[id]?.blockOf&&
      !A[id]?.risk&&isValid(M,id))){
   g.closingProtected=(g.closingProtected||0)+1;
   return {id:schedule.id,name:a.label};
  }
  // One actual reversal may keep its real controller for ONE selection
  // before a dramatic arc can rewrite physical control. This applies
  // equally to both wrestlers, including a legitimate defensive counter.
  const controller=pos.control,opponent=controller==='w'?'f':'w';
  if(closingEligible(M)&&M.len-M.t>=0&&M.len-M.t<=90&&
     ['w','f'].includes(controller)&&last?.id===g.node&&
     last.reverse&&closingValidEvent(last)&&
     last.preControl===opponent&&last.control===controller&&
     M.t-last.t>=0&&M.t-last.t<=10&&
     g.physical?.area==='ring'&&
     !g.pendingAerial&&!g.pendingGrapple&&!g.pendingStrike&&!g.pendingContact){
   g.closingReversalProtected=(g.closingReversalProtected||0)+1;
   return {id:schedule.id,name:a.label};
  }
  // Preserve the physical mat position after an actually performed,
  // authored setup -> grounding impact for at most TWO exchange ticks.
  // Do not assign control, pick an attack, or privilege the booked winner.
  const matActor=pos.control,matOpponent=matActor==='w'?'f':'w';
  if(closingEligible(M)&&M.len-M.t>=0&&M.len-M.t<=90&&
     ['w','f'].includes(matActor)&&
     pos.position==='mat'&&pos.down===matOpponent&&
     last?.id===g.node&&last.preControl===matActor&&
     last.control===matActor&&last.position==='mat'&&
     last.down===matOpponent&&
     M.t-last.t>=0&&M.t-last.t<=20&&g.physical?.area==='ring'&&
     !g.pendingAerial&&!g.pendingGrapple&&!g.pendingStrike&&!g.pendingContact&&
     A[last.id]?.zone==='mat'&&A[last.id]?.down==='d'&&
     !A[last.id]?.reverse&&!A[last.id]?.blockOf&&
     g.events.slice(0,-1).some(e=>CLOSING_SETUPS.has(e.id)&&
      e.preControl===matActor&&e.control===matActor&&
      e.t<last.t&&last.t-e.t<=60&&
      A[e.id]?.next.some(([id])=>id===last.id))){
   g.closingImpactProtected=(g.closingImpactProtected||0)+1;
   if(M.t-last.t>10)
    g.closingImpactExtended=(g.closingImpactExtended||0)+1;
   if(matActor!==bookedWinner)
    g.closingOpponentImpactProtected=(g.closingOpponentImpactProtected||0)+1;
   return {id:schedule.id,name:a.label};
  }
  // A real Brawl rebound earns ONE opportunity before the arc director
  // changes control or resets the ropes. Only if a named running attack
  // is affordable now. This never performs or credits the attack.
  if(readyBrawlRebound(M))return {id:schedule.id,name:a.label};
  // Preserve one genuinely owned, legal Technical grip through the arc
  // director, exactly like a real aerial setup or Brawl rebound.
  if(readyTechnicalGrip(M))return {id:schedule.id,name:a.label};
  // If the defender genuinely countered from a Story hope beat, let
  // them attempt an authored strike before the next arc clears control.
  if(readyStoryHope(M))return {id:schedule.id,name:a.label};
  // Preserve the actual mat knockdown for the cover already due. The
  // otherwise routine arc reset would stand everyone up before the count.
  if(M.nearfallAt?.length&&M.o.stip!=='submission'&&
     frac>=M.nearfallAt[0]&&earnedNearfallSource(M))
    return {id:schedule.id,name:a.label};
  // Existing in-progress saves may already be in an impossible early finish arc.
  // Recover those, and never carry an early-phase arc back into the final stretch.
  if(root.OfficeSheets?.DIRECTOR?.active(M)){
   // Preserve earlier pending physical exchanges. Director biases real arc
   // transitions; it never performs a move or changes the booked finish.
   if(g.age>=a.max||(g.age>=a.min&&M.r()<.16)){
    const next=selectArc(M,frac);
    if(next!==g.arc){
     const prev=g.arc;g.arc=next;g.age=0;g.visit[next]=(g.visit[next]||0)+1;
     g.history.push(next);g.transitions++;enter(M,next,prev);
    }
   }
   return {id:schedule.id,name:ARCS[g.arc].label};
  }
  const mispaced=(g.arc==='exchange'&&order[schedule.id]<2)
   ||(a.phase==='comeback'&&order[schedule.id]<3)
   ||(a.phase==='stretch'&&g.arc!=='exchange'&&schedule.id!=='stretch')
   ||(g.arc==='finish_setup'&&frac<Math.max(.88,($d.Psy.PHASE_ENDS[M.planId]||$d.Psy.PHASE_ENDS.story)[3]+.08))
   ||(schedule.id==='stretch'&&['open','shine','heat'].includes(a.phase));
  const force=frac>.93&&g.arc!=='finish_setup'||frac>.81&&!a.late||frac>.67&&['open','shine','heat'].includes(a.phase);
  if(mispaced||force||g.age>=a.max||(g.age>=a.min&&M.r()<.16)){
   const next=mispaced?({open:'chain',shine:'shine',heat:'control',comeback:'comeback',stretch:'escalation'}[schedule.id]):selectArc(M,frac);
   if(next!==g.arc){
    const prev=g.arc;g.arc=next;g.age=0;g.visit[next]=(g.visit[next]||0)+1;
    g.history.push(next);g.transitions++;g.node=null;
    enter(M,next,prev);
   }
  }
  // Keep clock, presentation, commentary and crowd/spot modifiers on one
  // timed phase, without suppressing the graph's detailed arc labels.
  const arc=ARCS[g.arc],ph=$d.phaseFor(frac,M);
  return {id:ph.id,name:arc.label};
 }
 // Aerial counters are outcomes of a named attempt, never free-standing
 // actions selected without the corresponding move being attempted.
 function isAerialParent(id){
  const n=A[id];return !!n&&!n.reverse&&!n.blockOf&&
   (n.family==='aerial'||n.family==='springboard'||n.family==='dive');
 }
 // Only these source-reviewed mechanics enter the Phase 7 two-beat pilot.
 // Phase 2: curated bulk tranche. Reuse the exact existing generated move-specific
 // reversals/blocks; no synthetic graph nodes or extra out-of-band RNG.
 // Phase 3 bulk: committed, exact-parent defensive pathways for all
 // 35 catalog submissions and 11 actual chain takedowns (not escapes).
 // Phase 4: standing offence receives its own exact-parent ledger.
 // It does not pollute the grappling attempt counts or create fake throws.
 // Running moves remain a distinct category with standing impact outcomes.
 const QUICK_NECK_IDS=Object.freeze(['nk_jawbreaker','nk_cutter','nk_stunner']);
 const PHASE4_NECK_THROWS=Object.freeze(CAT.members.neck.filter(id=>
  id!=='nk_snap_ddt'&&!QUICK_NECK_IDS.includes(id)));
 const STRIKE_PILOT=Object.freeze([...CAT.members.strike.filter(id=>
  id!=='st_fighting_spirit'),...CAT.members.running,...QUICK_NECK_IDS]);
 // Phase 5: ground shots and near-fall cradles are not standing strikes.
 // Each uses a distinct, one-exchange defence ledger, and only a landed
 // pin credits a referee nearfall. All 20+11 original authored moves remain.
 const GROUND_PILOT=Object.freeze([...CAT.members.ground]);
 const PIN_PILOT=Object.freeze([...CAT.members.pin]);
 const CONTACT_PILOT=Object.freeze([...GROUND_PILOT,...PIN_PILOT]);
 // Phase 6: complete environmental commitment coverage for corner, floor
 // and rope actions. The referee countout tease has no authored counter and
 // remains a narrative beat, not an attack with fabricated defence.
 const ENVIRONMENT_PILOT=Object.freeze([
  ...CAT.members.corner,
  ...CAT.members.outside.filter(id=>id!=='os_count_tease'),
  ...CAT.members.rope
 ]);
 const isContactParent=id=>CONTACT_PILOT.includes(id)||ENVIRONMENT_PILOT.includes(id);
 // A mutual stand-and-trade is already a complete exchange, not a named
 // one-sided attack with a fabricated counter or block.
 const PHASE3_TAKEDOWNS=Object.freeze([
  'ch_single_leg','ch_double_leg','ch_fireman','ch_snapmare',
  'ch_deep_arm_drag','ch_japanese_arm_drag','ch_drop_toehold',
  'ch_headlock_takedown','ch_leg_trip','ch_dragon_screw',
  'ch_hip_toss_chain'
 ]);
 const GRAPPLE_PILOT=Object.freeze([...new Set([
  'sm_sleeper','sm_ankle_lock','nk_snap_ddt',
  ...CAT.members.suplex,
  'pw_powerbomb','pw_sitout','pw_running_powerbomb','pw_backbreaker',
  'pw_uranage','pw_samoan_drop','pw_gorilla_press','pw_military_press',
  'pw_pumphandle','pw_belly_bump','pw_argentine',
  ...CAT.members.submission,...PHASE3_TAKEDOWNS,...PHASE4_NECK_THROWS
 ])]);

 // v0.4 physical-continuity pilot: a *small optional, serialisable* descriptor.
 // A null descriptor is an old/injected match state: preserve legacy eligibility
 // until an actual graph action establishes who is where and who holds what.
 // Existing arc clocks, deterministic RNG and booked endings remain authoritative.
 const SUPERPLEX_PILOT=Object.freeze([...CAT.members.superplex]);
 // Nine named outside dives share the exact-parent aerial ledger. A floor
 // target and ring/apron launch are mandatory, not inferred from narration.
 const DIVE_PILOT=Object.freeze([...CAT.members.dive]);
 // Explicit physical entries for the expanded commitment set. A named attempt
 // must already have an actor-owned grip, never a descriptive guess after impact.
 const PHYSICAL_GRIP_MOVES=Object.freeze({
  sx_vertical:'front-facelock',sx_deadlift_bridge:'front-facelock',
  sx_delayed:'front-facelock',sx_northern:'upper-body',
  sx_fisherman:'front-facelock',sx_exploder:'upper-body',
  sx_german:'rear-waist',sx_german_release:'rear-waist',
  sx_rolling_german:'rear-waist',sx_dragon:'rear-waist',
  sx_tiger:'rear-waist',sx_double_underhook:'front-facelock',
  sx_brainbuster:'front-facelock',sx_butterfly:'front-facelock',
  sx_half_nelson:'rear-waist',sx_saito:'rear-waist',
  sx_belly_belly:'upper-body',sx_belly_back:'rear-waist',
  sx_side:'upper-body',sx_gutwrench:'upper-body',
  sx_overhead:'upper-body',sx_tbone:'upper-body',
  sx_snap_ddt:'front-facelock',sx_cradle:'front-facelock',
  sx_falcon_arrow:'front-facelock',
  nk_ddt:'front-facelock',nk_snap_ddt:'front-facelock',
  nk_double_arm_ddt:'front-facelock',nk_implant:'front-facelock',
  nk_facebuster:'front-facelock',nk_piledriver:'front-facelock',
  nk_tombstone:'front-facelock',
  nk_swinging_neckbreaker:'head',nk_jumping_neckbreaker:'head',
  nk_rolling_neckbreaker:'head',nk_russian_sweep:'upper-body',
  nk_sto:'upper-body',
  pw_powerbomb:'front-facelock',pw_sitout:'front-facelock',
  pw_running_powerbomb:'front-facelock',pw_backbreaker:'body-clinch',
  pw_uranage:'upper-body',pw_samoan_drop:'upper-body',
  pw_gorilla_press:'upper-body',pw_military_press:'upper-body',
  pw_pumphandle:'upper-body',pw_belly_bump:'body-clinch',
  pw_argentine:'upper-body',
  // A named leg lock needs genuinely controlled legwork, not a magic grip.
  sm_ankle_lock:'ground-leg',sm_heel_hook:'ground-leg',
  sm_kneebar:'ground-leg',sm_toe_hold:'ground-leg',
  sm_figure_four:'ground-leg',sm_single_crab:'ground-leg',
  sm_deathlock:'ground-leg',sm_muffler:'ground-leg',
  sm_rings:'ground-leg',sm_cloverleaf:'ground-leg',
  rs_leg_lace:'ground-leg',
  // Chain throws are only attempted after contact, not from a free stance.
  ch_deep_arm_drag:'wrist',ch_japanese_arm_drag:'wrist',
  ch_headlock_takedown:'head',
  ch_fireman:'upper-body',ch_hip_toss_chain:'upper-body',
  // Grounded arm attacks use an actual retained wrist/arm.
  sm_armbar:'ground-arm',sm_cross_armbreaker:'ground-arm',
  sm_kimura:'ground-arm',sm_keylock:'ground-arm',
  sm_fujiwara:'ground-arm',sm_short_arm_scissors:'ground-arm',
  // Mat head/body control must be established on-screen too. These are
  // voluntary committed submissions, not arbitrary rest-hold damage.
  sm_chinlock:'ground-head',sm_rear_naked:'ground-head',
  sm_dragon_sleeper:'ground-head',sm_camel:'ground-back'
 });
 const APRON_OFFENCE=new Set(['os_apron_knee','os_apron_ddt','os_apron_slam']);
 const APRON_DIVES=new Set(['dv_apron_senton','dv_cannonball']);
 const GRIP_ENTRY=Object.freeze({
  lockup:'upper-body',knuckle_lock:'upper-body',pw_bearhug:'body-clinch',
  front_facelock:'front-facelock',go_behind:'rear-waist',waistlock:'rear-waist',
  standing_switch:'rear-waist',
  wristlock:'wrist',arm_wringer:'wrist',ch_top_wristlock:'wrist',
  ch_rolling_wristlock:'wrist',headlock:'head',ch_cravate:'head',
  rs_wrist_mat:'ground-arm',rs_hammerlock_mat:'ground-arm',
  rs_armbar_rest:'ground-arm',
  rs_side_headlock:'ground-head',rs_front_chancery:'ground-head',
  rs_seated_chinlock:'ground-head',rs_reverse_chinlock:'ground-head',
  rs_nerve_hold:'ground-head',
  rs_mat_stretch:'ground-back',
  sm_wristlock_ground:'ground-arm',
  ankle_pick:'ground-leg',ch_single_leg:'ground-leg',ch_dragon_screw:'ground-leg',
  leg_wrench:'ground-leg',gd_dragon_screw_ground:'ground-leg',
  sm_toe_hold:'ground-leg',sm_heel_hook:'ground-leg',sm_kneebar:'ground-leg',
  sm_ankle_lock:'ground-leg',rs_leg_lace:'ground-leg'
 });
 function physicalLegal(M,id){
  const ph=M.graph?.physical,p=$d.Psy.get(M);
  if(!ph||ph.v!==1)return true; // old saves / isolated graph probes
  const n=A[id],side=p.control,other=side==='w'?'f':'w';
  if(!['w','f'].includes(side))return true;
  const expected=PHYSICAL_GRIP_MOVES[id];
  // A grounded strike must actually have an opponent on the canvas.
  // The wrestler who is themselves down cannot perform a grounded
  // elbow/stomp unless they first gain control and turn the opponent over.
  // A cradle is initiated from two standing, in-ring participants; the
  // resulting pin and kickout put the receiver on the mat.
  const family=A[id]?.family,original=A[id]?.counterOf||A[id]?.blockOf;
  const kind=CONTACT_PILOT.includes(original)?A[original]?.family:family;
  if(kind==='ground'&&(p.position!=='mat'||p.down!==other))return false;
  if(kind==='pin'&&(p.position!=='standing'||p.down!==null||
     ph.locations[side]!=='ring'||ph.locations[other]!=='ring'))return false;
  if(expected){
   const grip=ph.grip,pending=M.graph?.pendingGrapple;
   // The wrestler must secure a *fresh* owned grip before committing.
   // During the one following resolution tick, that same retained grip
   // cannot expire merely because the simulation clock advances 10s.
   // A different wrestler, move, stolen/replaced grip, or an interrupted
   // attempt receives no grace period. No new attack may start stale.
   const committed=!!(pending?.id===id&&pending.side===side&&
     pending.at>=grip?.at&&pending.at-grip.at<=20&&
     M.t>=pending.at&&M.t-pending.at<=10);
   if(!grip||grip.type!==expected||grip.side!==side||
      (M.t-grip.at>20&&!committed))return false;
  }
  if(n.family==='superplex'){
   if(ph.topSide!==side||ph.locations[side]!=='top'||ph.locations[other]!=='top')return false;
  }
  // Top-rope offence needs an actual launch position, with the recipient
  // on the canvas. A two-wrestler top contest permits superplexes instead.
  if(n.family==='aerial'||n.family==='springboard'){
   if(ph.locations[side]!=='top'||ph.locations[other]!=='ring')return false;
  }
  if(n.family==='dive'){
   if(ph.locations[other]!=='floor')return false;
   if(APRON_DIVES.has(id)||APRON_DIVES.has(n.counterOf)||APRON_DIVES.has(n.blockOf)){
    if(ph.locations[side]!=='apron')return false;
   }else if(ph.locations[side]!=='ring')return false;
  }
  if(APRON_OFFENCE.has(id)||APRON_OFFENCE.has(n.counterOf)||APRON_OFFENCE.has(n.blockOf))
   if(ph.area!=='apron')return false;
  if((id==='os_ramp_suplex'||n.counterOf==='os_ramp_suplex')&&ph.area!=='ramp')return false;
  return true;
 }

 // Every narrated legacy/arc reset also resets the detailed descriptor.
 // Never leave the player physically on the floor or ropes after a narrated
 // return to a neutral in-ring position; clear grips when contact breaks.
 function resetPhysical(M,where='ring'){
  const g=get(M);
  g.physical={v:1,locations:{w:where==='floor'?'floor':'ring',
                            f:where==='floor'?'floor':'ring'},
    area:where==='floor'?'floor':'ring',grip:null,topSide:null};
 }
 function recordPhysical(M,id,side,other,n){
  const g=get(M),p=$d.Psy.get(M),old=g.physical?.v===1?g.physical:null;
  const ph={v:1,locations:{w:'ring',f:'ring'},area:'ring',grip:null,topSide:null};
  if(n.zone==='outside'){
   ph.locations={w:'floor',f:'floor'};ph.area='floor';
   if(id==='outside_toss'||id==='os_ropes_backdrop'||id==='floor_regroup'){
    ph.locations[side]='ring';
   }else if(id==='apron_stand'){
    ph.locations[side]='apron';ph.area='apron';
   }else if(id==='ramp_approach'){
    ph.area='ramp';
   }else if(APRON_OFFENCE.has(id)){
    ph.locations={w:'apron',f:'apron'};ph.area='apron';
   }else if(id==='os_ramp_suplex'){
    ph.area='ramp';
   }else if(n.family==='outside'&&old?.area==='ramp'&&id==='os_floor_chop'){
    ph.area='ramp';
   }
  }else if(id==='top_follow'){
   ph.locations={w:'top',f:'top'};ph.topSide=side;
  }else if(n.zone==='top'){
   ph.locations[side]='top';
  }
  if(!n.reverse){
   const type=GRIP_ENTRY[id];
   if(type)ph.grip={type,side,at:M.t,source:id};
   else if(old?.grip?.side===side&&old.grip.type==='front-facelock'&&
           id==='knee_strike_block'&&p.position==='standing')
    ph.grip=old.grip;
   else if(old?.grip?.side===side&&old.grip.type==='ground-leg'&&
           id==='mat_hold'&&p.position==='mat')
    ph.grip=old.grip;
   // A technical wrestler may keep the *same actual control* while using
   // a neutral positional hold; never transfer an opponent-owned grip.
   else if(old?.grip?.side===side&&M.t-old.grip.at<=20&&
           ['ground-leg','ground-arm','ground-head','ground-back'].includes(old.grip.type)&&
           n.zone==='mat'&&p.position==='mat'&&
           ['mat_hold','target_hold'].includes(id))
    ph.grip=old.grip;
  }
  g.physical=ph;
 }

 // Organic top-rope wrestling needs enough energy for a *named* move after
 // the whip, climb, and next tick. Forecast with the actual isValid guard:
 // no weakened lifting, agility, stamina, timing, or physical-state rules.
 // This read-only lookahead does not consume random numbers or persist state.
 function affordableSuperplex(M,needWhip=false){
  const p=$d.Psy.get(M),g=get(M),side=p.control,frac=M.t/Math.max(1,M.len);
  if(!['w','f'].includes(side)||frac<.50||frac>.86||M.len-M.t<(needWhip?40:30))return false;
  const key=side==='w'?'wSt':'fSt',worker=side==='w'?M.w:M.f;
  const workhorse=fighter(worker).trait==='Workhorse'?.8:1;
  const remaining=M[key]-(needWhip?costOf('corner_whip')*workhorse:0)-
    costOf('top_follow')*workhorse-3.5-.65;
  if(remaining<16)return false;
  const was={t:M.t,pos:p.position,down:p.down,physical:g.physical,st:M[key]};
  try{
   M.t+=needWhip?20:10;
   M[key]=remaining;p.position='top';p.down=null;
   g.physical={v:1,locations:{w:'top',f:'top'},area:'ring',topSide:side,grip:null};
   return SUPERPLEX_PILOT.some(id=>isValid(M,id));
  }finally{
   M.t=was.t;M[key]=was.st;p.position=was.pos;p.down=was.down;g.physical=was.physical;
  }
 }
 // A low-energy climb is not a risky aerial sequence. Read-only, zero-RNG
 // lookahead asks the EXACT normal isValid guard whether at least one
 // named risky attack could be launched after paying the rope setup,
 // routine exertion and commitment cost. Restore every probe field.
 function affordableNamedFlight(M,setup){
  if(setup!=='top_climb'&&setup!=='springboard_rise')return false;
  const p=$d.Psy.get(M),g=get(M),side=p.control;
  if(!['w','f'].includes(side)||p.position!=='standing'||M.len-M.t<30)
   return false;
  const key=side==='w'?'wSt':'fSt';
  const actor=side==='w'?M.w:M.f,other=side==='w'?'f':'w';
  const workhorse=fighter(actor).trait==='Workhorse'?.8:1;
  const forecast=M[key]-costOf(setup)*workhorse-.8-.72;
  const saved={t:M.t,stamina:M[key],position:p.position,down:p.down,
   physical:g.physical};
  try{
   M.t+=10;M[key]=Math.max(0,forecast);p.position='top';p.down=other;
   g.physical={v:1,locations:{w:'ring',f:'ring'},area:'ring',
    grip:null,topSide:null};
   g.physical.locations[side]='top';
   const family=setup==='top_climb'?'aerial':'springboard';
   return (CAT.members[family]||[]).some(id=>
    A[id]?.risk&&!A[id].reverse&&!A[id].counterOf&&!A[id].blockOf&&
    isAerialParent(id)&&isValid(M,id));
  }finally{
   M.t=saved.t;M[key]=saved.stamina;p.position=saved.position;
   p.down=saved.down;g.physical=saved.physical;
  }
 }
 // Only a true two-wrestler top_follow, with a legally available variant,
 // gets priority over unrelated scheduled spectacle on the following tick.
 function readyTopContest(M){
  const g=get(M),p=$d.Psy.get(M);
  return g.node==='top_follow'&&p.position==='top'&&
   SUPERPLEX_PILOT.some(id=>isValid(M,id));
 }
 // Once an elite flyer has genuinely reached the ropes with a viable
 // named attack, allow the next tick to select a graph action rather than
 // silently abandoning the setup. Choice, commitment, counter and landing
 // still go through their ordinary seeded rules; no success is guaranteed.
 // A physically performed rope setup is useful for only the following beat.
 // No invisible teleport, synthetic setup, or guaranteed strike.
 // A real landed standing strike may produce an actual, paid rope run
 // within the SAME 10-second exchange. The named attack on the next
 // beat still uses the ordinary counter/block/landed attempt ledger.
 function maybeBrawlComboRun(M,side,sourceId){
  const g=get(M),p=$d.Psy.get(M),remaining=M.len-M.t;
  if(M.planId!=='brawl'||M.len<900||remaining<30||remaining>180||
     !['w','f'].includes(side)||p.control!==side||
     p.position!=='standing'||p.down!==null||
     g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact)
   return false;
  const actor=side==='w'?M.w:M.f,trained=brawlConditioning(actor);
  if(actor.style!=='Brawl'||trained<.30)return false;
  const last=g.events.at(-1),source=A[sourceId];
  if(!source||last?.id!==sourceId||last.preControl!==side||
     last.t!==M.t||source.reverse||source.counterOf||source.blockOf)return false;
  const namedLanded=source.family==='strike'&&
   last.strikeResolution==='landed'&&
   g.strikeAttempts.some(a=>a.seq===last.strikeAttemptSeq&&
    a.id===sourceId&&a.side===side&&a.outcome==='landed');
  const coreLanded=['stiff_forearm','body_shot','strike_trade'].includes(sourceId)&&
   !last.strikeResolution;
  if(!namedLanded&&!coreLanded)return false;
  if(g.events.some(e=>e.id==='rope_run'&&e.preControl===side&&e.t>=M.len-180))
   return false;
  const ph=g.physical;
  if(ph&&(ph.area!=='ring'||ph.locations?.w!=='ring'||ph.locations?.f!=='ring'))
   return false;
  const stamina=side==='w'?M.wSt:M.fSt;
  if(!isValid(M,'rope_run')||
     !(CAT.members.running||[]).some(id=>A[id]?.requires==='standing'&&
      !A[id].agile&&!A[id].reverse&&!A[id].counterOf&&!A[id].blockOf&&
      isValid(M,id)&&
      stamina>=16+costOf(id)*3.2+costOf('rope_run')+1.5))
   return false;
  if(M.r()>=.29+.18*trained)return false;
  apply(M,'rope_run');
  const setup=g.events.at(-1);
  if(setup?.id!=='rope_run'||setup.preControl!==side)return false;
  setup.brawlComboSource=sourceId;
  return true;
 }
 // A real owned grip earns at most ONE short Technical follow-through beat.
 // Its prospective grapple is still a normal committed, defendable move.
 function readyTechnicalGrip(M){
  const g=get(M),p=$d.Psy.get(M),side=p.control,remaining=M.len-M.t;
  // Technical opening wrist-chain wrestling must be allowed to build
  // naturally. Only help controlled transitions after the first 45% of
  // a long match, where the wider graph previously buried the payoff.
  if(M.planId!=='technical'||M.len<900||M.t/M.len<.45||
     remaining<20||
     !['w','f'].includes(side)||g.pendingAerial||g.pendingGrapple||
     g.pendingStrike||g.pendingContact)return false;
  const actor=side==='w'?M.w:M.f,grip=g.physical?.grip,
   last=g.events.at(-1);
  if(actor.style!=='Technical'||actor.ring<68||actor.safe<60||
     !grip||grip.side!==side||grip.source!==last?.id||
     grip.at!==last.t||last.preControl!==side||last.control!==side||
     GRIP_ENTRY[last.id]!==grip.type||
     last.id!==g.node||GRAPPLE_PILOT.includes(last.id)||
     SUPERPLEX_PILOT.includes(last.id)||
     M.t-grip.at!==10)return false;
  // A near-empty tank cannot sustain a newly committed grappling exchange.
  if((side==='w'?M.wSt:M.fSt)<12)return false;
  const ph=g.physical;
  if(ph.area!=='ring'||ph.locations?.w!=='ring'||ph.locations?.f!=='ring')
   return false;
  return GRAPPLE_PILOT.some(id=>A[id]&&!A[id].reverse&&
   !A[id].counterOf&&!A[id].blockOf&&
   PHYSICAL_GRIP_MOVES[id]===grip.type&&
   A[id].requires===p.position&&isValid(M,id));
 }
 // Story psychology: a genuine reversal of actual heel pressure can earn
 // ONE legal, still-contested follow-up in the same hope arc. Only the
 // real defensive counter (not the narration or arc visit) grants this.
 function readyStoryHope(M){
  const g=get(M),p=$d.Psy.get(M),last=g.events.at(-1),worker=M.w;
  if(M.planId!=='story'||worker.style!=='Story'||worker.ring<68||
     worker.psych<65||M.wSt<23||
     !['hope','second_hope'].includes(g.arc)||
     p.control!=='w'||p.position!=='standing'||p.down!==null||
     !last||last.id!=='counter_strike'||!last.reverse||
     last.preControl!=='f'||last.control!=='w'||last.arc!==g.arc||
     g.node!==last.id||M.t-last.t!==10||M.len-M.t<20||
     g.pendingGrapple||g.pendingStrike||g.pendingAerial||g.pendingContact||
     g.physical?.area!=='ring'||g.physical.locations?.w!=='ring'||
     g.physical.locations?.f!=='ring')return false;
  return A[last.id].next.some(([id])=>
   ['clothesline','snap_suplex'].includes(id)&&isValid(M,id));
 }
 function readyBrawlRebound(M){
  const g=get(M),p=$d.Psy.get(M),side=p.control,remaining=M.len-M.t;
  if(M.planId!=='brawl'||M.len<900||remaining<20||remaining>180||
     !['w','f'].includes(side)||p.position!=='standing'||
     !['rope_run','rope_rebound'].includes(g.node)||
     g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact)
   return false;
  const actor=side==='w'?M.w:M.f,stamina=side==='w'?M.wSt:M.fSt,
   last=g.events.at(-1);
  if(actor.style!=='Brawl'||brawlConditioning(actor)<.30||
     last?.id!==g.node||last.control!==side||
     M.t-last.t<0||M.t-last.t>10)return false;
  return (CAT.members.running||[]).some(id=>{
   const move=A[id];
   return move&&!move.reverse&&!move.counterOf&&!move.blockOf&&
    move.requires===p.position&&
    stamina>=Math.max(10,9+costOf(id)*3)&&
    isValid(M,id);
  });
 }
 function readyNamedAerial(M){
  const g=get(M),p=$d.Psy.get(M),side=p.control;
  if(M.planId!=='spots'||M.len<900||M.len-M.t<20||
     !['w','f'].includes(side)||p.position!=='top'||
     !['top_climb','springboard_rise'].includes(g.node)||
     g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact)
   return false;
  const actor=side==='w'?M.w:M.f,last=g.events.at(-1);
  if(actor.style!=='Spectacle'||recoveryTraining(actor)<.95||
     last?.id!==g.node||last.control!==side||
     M.t-last.t<0||M.t-last.t>10||
     g.physical?.locations?.[side]!=='top')return false;
  const family=g.node==='top_climb'?'aerial':'springboard';
  return (CAT.members[family]||[]).some(id=>
   A[id]?.risk&&!A[id].reverse&&!A[id].counterOf&&!A[id].blockOf&&
   isAerialParent(id)&&isValid(M,id));
 }
 const isGrappleParent=id=>GRAPPLE_PILOT.includes(id)||SUPERPLEX_PILOT.includes(id);
 function aerialAlternativeParent(id){
  const n=A[id],original=n?.counterOf||n?.blockOf;
  return original&&isAerialParent(original)?original:null;
 }
 function contactAlternativeParent(id){
  const n=A[id],original=n?.counterOf||n?.blockOf;
  return original&&isContactParent(original)?original:null;
 }
 function strikeAlternativeParent(id){
  const n=A[id],original=n?.counterOf||n?.blockOf;
  return original&&STRIKE_PILOT.includes(original)?original:null;
 }
 function grappleAlternativeParent(id){
  const n=A[id],original=n?.counterOf||n?.blockOf;
  return original&&isGrappleParent(original)?original:null;
 }
 // Reconciliation can withdraw tactical encouragement, never erase the
 // original public statement or prevent a naturally witnessed payoff.
 function activePromoTactic(M){
  const t=M.o.promo?.tactic,r=M.o.sheet?.promoReconciliation;
  if(r?.v!==1)return t;
  if(r.status==='conflict')return null;
  if(t?.kind==='counter'&&r.type==='counter'){
   return {...t,nodes:(t.nodes||[]).filter(id=>r.nodes.includes(id))};
  }
  return t;
 }
 function isValid(M,nodeId){
  const n=A[nodeId],p=$d.Psy.get(M);if(!n)return false;
  // A restriction agreed backstage is a rule, not a 3% chance of breaking it.
  // The promoter's separate (possibly defied) note remains preference-based.
  const limits=M.o.sheet?.signed?M.o.sheet.limits:null;
  if(limits&&!n.counterOf&&!n.blockOf&&
    (limits.banIds?.includes(nodeId)||(n.family&&limits.ban?.includes(n.family))))return false;
  if(!physicalLegal(M,nodeId))return false;
  const parent=aerialAlternativeParent(nodeId);
  if(parent&&M.graph?.pendingAerial?.id!==parent)return false;
  const strikeParent=strikeAlternativeParent(nodeId);
  if(strikeParent&&M.graph?.pendingStrike?.id!==strikeParent)return false;
  const contactParent=contactAlternativeParent(nodeId);
  if(contactParent&&M.graph?.pendingContact?.id!==contactParent)return false;
  // The physical descriptor is absent in old saves; basic positioning
  // remains mandatory even in those states.
  const kind=CONTACT_PILOT.includes(nodeId)?A[nodeId].family:
   contactParent?A[contactParent].family:null;
  if(kind==='ground'&&
    (p.position!=='mat'||p.down!==(p.control==='w'?'f':'w')))return false;
  if(kind==='pin'&&(p.position!=='standing'||p.down!==null))return false;
  const grappleParent=grappleAlternativeParent(nodeId);
  if(grappleParent&&M.graph?.pendingGrapple?.id!==grappleParent)return false;
  // Rest-hold resistance is a one-beat defensive continuation, not a
  // standalone move. It must immediately answer the exact live hold.
  const restParent=n.counterOf||n.blockOf;
  if(restParent&&A[restParent]?.family==='rest'){
   const prior=M.graph?.events?.at(-1);
   if(prior?.id!==restParent||prior.control!==p.control||
      M.t-prior.t>20)return false;
  }
  // A submission-only bout cannot reach pin nodes, even through signature/catalog edges.
  if(M.o.stip==='submission'&&(n.family==='pin'||n.nearfall||
    ['early_cover','cover','near_kickout','counter_rollup'].includes(nodeId)||
    n.lines.some(t=>$d.pinText.test(t))))return false;
  if((nodeId==='cover'||nodeId==='near_kickout')&&M.t/M.len<.58)return false;
  // Finish-threat action is not a feeling-out move. The promised finish
  // itself is still controlled by the match contract, not this graph gate.
  if((nodeId==='finish_tease'||nodeId==='finish_counter')&&M.t/M.len<.55)return false;
  // v3.3: big moves, roll-ups and finishing-grade spots belong to the right part of the match.
  if(n.after&&M.t/M.len<n.after)return false;
  // Agility moves (lucha, springboards, moonsaults, most dives) are not in a heavyweight's toolkit.
  if(n.agile&&fighter(p.control==='f'?M.f:M.w).kg>=110)return false;
  const attacker=p.control==='f'?M.f:M.w,defender=p.control==='f'?M.w:M.f,stamina=p.control==='f'?M.fSt:M.wSt;
  const energy=costOf(nodeId);
  if(energy>=2.2&&stamina<16+energy*3.2)return false;
  const capacity=fighter(attacker).kg+Math.max(-5,((attacker.ring||60)-60)*.23);
  if(n.lift!==null&&fighter(defender).kg>capacity+n.lift)return false;
  if(nodeId==='snap_suplex'&&fighter(defender).kg>capacity+42)return false;
  if(n.requires==='mat'&&p.position!=='mat')return false;
  if(n.requires==='outside'&&p.position!=='outside')return false;
  if(n.requires==='corner'&&p.position!=='corner')return false;
  if(n.requires==='top'&&p.position!=='top')return false;
  if(n.requires==='standing'&&p.position!=='standing')return false;
  if(n.requires==='mat'&&p.down===null)return false;
  if(p.position==='outside'&&!['outside','any'].includes(n.requires))return false;
  if(p.position==='top'&&!['top','any'].includes(n.requires))return false;
  return true;
 }
 function context(M){
  const p=$d.Psy.get(M);
  if(p.control==='w')return {A:M.w,Df:M.f,side:'w'};
  if(p.control==='f')return {A:M.f,Df:M.w,side:'f'};
  const w=(M.r()<.55);
  p.control=w?'w':'f';p.changes++;
  return {A:w?M.w:M.f,Df:w?M.f:M.w,side:w?'w':'f'};
 }
 // Recovery reflects learned pacing, not an invisible refill. Only an
 // actually narrated catch_breath exchange can give the trained benefit.
 const recoveryTraining=actor=>$d.clamp(((actor.ring||0)+(actor.safe||0)-120)/60,0,1);
 // Phase 9B. The only trigger for selling is witnessed on-target graph damage.
 // Keep signed finishes, legacy behaviour and match-star calculations intact.
 const sellingActive=M=>!!root.OfficeSheets?.DIRECTOR?.active(M);
 const sellingFamilies={
  'lower back':['power','suplex','superplex','neck'],
  ribs:['power','suplex','superplex','aerial','springboard'],
  'left knee':['running','aerial','springboard','dive','lucha'],
  ankle:['running','aerial','springboard','dive','lucha'],
  shoulder:['power','suplex','superplex','neck'],
  neck:['power','suplex','superplex','aerial']};
 function sellingStrain(M,id,side){
  if(!sellingActive(M)||!['w','f'].includes(side))return 0;
  const g=get(M),s=g.selling?.[side],n=A[id],cost=costOf(id);
  if(!s||!n||n.reverse||n.counterOf||n.blockOf||n.nearfall||
     n.family==='rest'||cost<1.4||(g.damage?.[side]||0)<3)return 0;
  const lift=['snap_suplex','heavy_slam','power_spinebuster'].includes(id),
   run=['rope_run','top_climb','clothesline','springboard_strike'].includes(id);
  if(!(sellingFamilies[s.part]||[]).includes(n.family)&&
     !(lift&&['lower back','ribs','shoulder','neck'].includes(s.part))&&
     !(run&&['left knee','ankle'].includes(s.part)))return 0;
  const extra=.22+Math.min(.24,Math.max(0,(g.damage[side]-3)*.08));
  return Number((M.t<(s.reliefUntil||0)?extra*.5:extra).toFixed(3));
 }
 function sellingWeight(M,id,side){
  const extra=sellingStrain(M,id,side);
  return extra?Math.max(.74,1-extra*.55):1;
 }
 function sellingReport(M){
  if(!sellingActive(M))return null;
  const g=M.graph||{},wrestlers={};
  for(const side of ['w','f']){
   const s=g.selling?.[side];if(!s)continue;
   wrestlers[side]={part:s.part,firstTargetedAt:s.startedAt,
    focusedDamage:g.damage?.[side]||0,strenuousMoves:s.strenuousMoves||0,
    sellingLines:s.sellingLines||0,comebackLines:s.comebackLines||0,
    realBreathers:s.realBreathers||0};
  }
  return Object.keys(wrestlers).length?{version:1,wrestlers,
   explanation:'Witnessed focused damage persists into the comeback; only real actions carry strain.'}:null;
 }
 function sellingNarration(M,id,side,extra){
  if(!extra||!sellingActive(M))return;
  const g=get(M),s=g.selling?.[side];if(!s)return;
  s.strenuousMoves=(s.strenuousMoves||0)+1;
  const comeback=['hope','second_hope','comeback','resurgence'].includes(g.arc);
  if((s.sellingLines||0)>=3||M.t-(s.lastSpokenAt??-1000)<110)return;
  const who=side==='w'?M.w:M.f,action=A[id]?.name||id.replaceAll('_',' ');
  $d.say(M,comeback?
   who.short+' lands the '+action+' but has to protect the worked '+s.part+
     '. The comeback has not erased that damage.':
   who.short+' follows through on the '+action+' and visibly favours the worked '+
     s.part+'. That earlier damage still matters.','story',
   {who:'colour',textureId:'selling-'+side+'-'+(s.sellingLines||0)});
  s.lastSpokenAt=M.t;s.sellingLines=(s.sellingLines||0)+1;
  if(comeback)s.comebackLines=(s.comebackLines||0)+1;
 }
 function apply(M,id,options={}){
  const n=A[id],p=$d.Psy.get(M),g=get(M);
  const {A:attacker,Df:defender,side}=context(M),opp=side==='w'?'f':'w';
  const sequencePre=M.structureDirector?.sequences?{control:p.control,position:p.position,down:p.down,
   ...(M.structureDirector.sequencePolicy===2?{node:g.node}:{})}:null;
  const sequenceChoice=M.structureDirector?.sequencePolicy===2?root.OfficeSheets.DIRECTOR.sequenceOffer(M,p):null;
  const sequencePrevious=sequencePre?g.events.at(-1):null;
  if(n.reverse){
   p.control=opp;p.changes++;M.mom=opp==='w'?30:-30;
  }
  // The placeholders always name the pre-event attacker (A) and defender (D).
  // A reversal is performed by D; control flips only AFTER the narration.
  const victim=n.reverse?side:opp;
  const part=g.targets?.[victim]||p.target;
  const {variants,index,recent,variant,broadcast}=chooseAction(M,g,id,n,side);
  if(!sellingActive(M)&&g.damage?.w>=3&&p.control==='w'&&['top_climb','rope_run','clothesline','snap_suplex'].includes(id)&&(!g.lastSell||M.t-g.lastSell>100)){
   const effect=g.targets.w==='left knee'?'hesitates on the damaged knee':g.targets.w==='lower back'?'winces and steadies the lower back':g.targets.w==='ribs'?'takes a painful breath and protects the ribs':'favours the damaged shoulder';
   g.sellCount=(g.sellCount||0)+1;
   const calls=[
    '{W} '+effect+' before committing to the next move.',
    '{W} '+effect+' while preparing the next attack.',
    '{W} '+effect+' and takes a moment before the next exchange.'
   ];
   $d.say(M,$d.fill(M,calls[(g.sellCount-1)%calls.length]),'story');g.lastSell=M.t;
  }
  speakAction(M,g,id,n,side,attacker,defender,part,variants,index,recent,variant,broadcast);
  const originalDown=n.reverse?side:opp;
  p.position=n.zone;
  p.down=n.down==='d'?originalDown:n.down==='a'?p.control:null;
  recordPhysical(M,id,side,opp,n);
  // A limb-specific move only adds to the worked body part when it hits that part.
  const onTarget=!n.part||!PART_OF[part]||n.part===PART_OF[part];
  if(n.focus&&onTarget){
   g.damage[victim]=(g.damage[victim]||0)+n.focus;
   if(victim==='w')p.focusHits+=n.focus;
   if(sellingActive(M)&&g.damage[victim]>=3){
    g.selling??={};
    g.selling[victim]??={version:1,part:g.targets?.[victim]||part,
     startedAt:M.t,strenuousMoves:0,sellingLines:0,
     comebackLines:0,realBreathers:0,reliefUntil:0};
   }
  }
  if(n.crowd)$d.lift(M,n.crowd*(n.family?CROWD_SCALE:1));
  const exertion=costOf(id),activeSide=n.reverse?opp:side,staminaKey=activeSide==='w'?'wSt':'fSt';
  let effective=exertion;
  if(id==='catch_breath'&&exertion<0&&M.planId==='spots'){
   const actor=activeSide==='w'?M.w:M.f;
   // Do not turn every wrestler into an endurance-trained aerial worker.
   // An experienced flyer can recover more in a genuine, visible pause;
   // novices retain -5.5. No difficulty, botch or crowd-rating change.
   const training=recoveryTraining(actor);
   // The stronger visible rest belongs to elite fliers only; everyone
   // below that tier retains the already validated .56 recovery pacing.
   const extra=actor.style==='Spectacle'&&M.len>=900?
    (training>=.95?.95:.56)*training:0;
   effective=exertion*(1+extra);
  }
  // A genuine narrated breather works better for conditioned long-match
  // brawlers. Novices and every other match plan retain the original cost.
  if(id==='catch_breath'&&exertion<0&&M.planId==='brawl'&&M.len>=900){
   const actor=activeSide==='w'?M.w:M.f;
   if(actor.style==='Brawl'){
    const trained=brawlConditioning(actor);
    if(trained>=.25)effective=exertion*(1+.68*trained);
   }
  }
  // An elite Technical worker can make better use of a REAL
  // ten-second breather during the long-match runway. This recovery
  // is earned by a narrated action: no rest, no stamina and no star
  // credit. Competent and novice recovery costs remain unchanged.
  if(id==='catch_breath'&&exertion<0&&M.planId==='technical'&&
     M.len>=900&&M.len-M.t>180&&M.len-M.t<=540){
   const actor=activeSide==='w'?M.w:M.f;
   if(actor.style==='Technical'&&actor.ring>=85&&actor.safe>=80)
    effective=exertion*1.38;
  }
  // High-flyers need a *real* in-ring break before the last three minutes
  // even when they have an opponent down. A narrated, physically legal
  // grounded rest hold is more credible than an invisible stamina award.
  // Normal rest holds and all other styles/plans retain their old cost.
  if(n.family==='rest'&&exertion<0&&M.planId==='spots'&&M.len>=900&&
     M.len-M.t>180&&M.len-M.t<=660){
   const actor=activeSide==='w'?M.w:M.f;
   const trained=recoveryTraining(actor);
   if(actor.style==='Spectacle'&&
      (trained>=.30&&trained<.70&&actor.ring>=70&&actor.safe>=65||
       trained>=.70&&M.len-M.t<=540&&
       (M.len-M.t<=480||trained>=.95)))
    effective=exertion-5.8*trained;
  }
  // A controlled mat hold is a real Brawl breather too: the wrestler
  // spends an authored exchange taking pressure off, not a free refill.
  // Only trained workers in a long match's pre-finish runway earn this.
  if(n.family==='rest'&&exertion<0&&M.planId==='brawl'&&
     M.len>=900&&M.len-M.t>180&&M.len-M.t<=660){
   const actor=activeSide==='w'?M.w:M.f,trained=brawlConditioning(actor);
   if(actor.style==='Brawl'&&trained>=.70)
    effective=exertion-5.0*trained;
  }
  if(exertion>0&&fighter(activeSide==='w'?M.w:M.f).trait==='Workhorse')effective*=.8;
  const sellingExtra=sellingStrain(M,id,activeSide);
  effective+=sellingExtra;
  // One narrated rest can start a measured pacing window. This is saved
  // graph state, not an automatic refill. Actual move costs stay unchanged.
  let pacedUntil=null;
  if(exertion<0&&(id==='catch_breath'||n.family==='rest')&&
     M.planId==='spots'&&M.len>=900&&M.len-M.t>180&&
     M.len-M.t<=660){
   const actor=activeSide==='w'?M.w:M.f,trained=recoveryTraining(actor);
   const previous=g.pacedRest?.[activeSide];
   if(actor.style==='Spectacle'&&
      (trained>=.30&&trained<.70&&actor.ring>=70&&actor.safe>=65||
       trained>=.70&&M.len-M.t<=480)&&
      (!previous||M.t-previous.at>=80)){
    g.pacedRest??={};
    pacedUntil=M.t+180;
    g.pacedRest[activeSide]={at:M.t,until:pacedUntil};
    if(!g.paceExplained){
     $d.say(M,actor.short+' deliberately slows the exchanges after that rest, saving their energy for the closing stretch.','story');
     g.paceExplained=true;
    }
   }
  }
  // Only an actual narrated rest starts a saved, bounded Brawl pacing
  // window. Repeated breathers cannot endlessly extend it.
  if(exertion<0&&M.planId==='brawl'&&M.len>=900&&
     M.len-M.t>180&&
     ((id==='catch_breath'&&M.len-M.t<=600)||
      (n.family==='rest'&&M.len-M.t<=660&&
       brawlConditioning(activeSide==='w'?M.w:M.f)>=.70))){
   const actor=activeSide==='w'?M.w:M.f,trained=brawlConditioning(actor);
   const previous=g.pacedBrawl?.[activeSide];
   if(actor.style==='Brawl'&&trained>=.25&&
      (!previous||M.t-previous.at>=110)){
    g.pacedBrawl??={};
    g.pacedBrawl[activeSide]={at:M.t,until:M.t+(trained>=.70?180:150)};
    if(!g.brawlPaceExplained){
     $d.say(M,actor.short+' eases the pressure after that breather, keeping something back for the last hard exchanges.','story');
     g.brawlPaceExplained=true;
    }
   }
  }
  M[staminaKey]=$d.clamp(M[staminaKey]-effective);
  // Outlasting is a pacing story, not a free refill. A real legal,
  // narrated rest can unlock a temporary reduction in routine ten-second
  // fatigue for the *booked winner only*. Actual move costs still apply
  // in full and the opponent does not receive an invented stamina debit.
  // It is stored in graph state, so save/resume remains deterministic.
  if(exertion<0&&(id==='catch_breath'||n.family==='rest')&&
     M.o.sheet?.finishRoute==='outlasted'&&M.outcome==='booked'&&
     ['win_clean','lose_clean'].includes(M.o.finish)&&M.len>=600&&
     M.t/M.len>=.22&&M.t/M.len<.89){
   const winner=M.o.finish==='win_clean'?'w':'f';
   if(activeSide===winner){
    g.pacedOutlast??={};
    const prior=g.pacedOutlast[winner],used=prior?.count||0;
    if(used<4&&(!prior||M.t-prior.at>=100)){
     g.pacedOutlast[winner]={at:M.t,until:M.t+190,count:used+1};
     if(!g.pacedOutlastExplained){
      const who=winner==='w'?M.w:M.f;
      $d.say(M,who.short+' takes a genuine breather and settles into a measured pace, keeping energy back for the finish.','story');
      g.pacedOutlastExplained=true;
     }
    }
   }
  }
  if(exertion<0&&sellingActive(M)&&g.selling?.[activeSide]&&
     (id==='catch_breath'||n.family==='rest')){
   const s=g.selling[activeSide];
   s.realBreathers=(s.realBreathers||0)+1;
   s.reliefUntil=M.t+90;
  }
  if(exertion<0)g.rests=(g.rests||0)+1;
  g.exertion=(g.exertion||0)+Math.max(0,effective);
  if(id==='near_kickout'||id==='counter_rollup'||n.nearfall) {M.nearfalls++;M.bonus+=n.nearfall?4:5;g.nearfallCount++;}
  if(!options.scriptedSpot&&n.family&&n.risk&&!n.counterOf&&!n.blockOf){M.spots++;M.spotHits++;M.bonus+=3;}
  if(n.counterOf&&A[n.counterOf]?.risk){M.spots++;M.bonus-=2;}
  if(id==='aerial_attack'){M.spots++;M.spotHits++;M.bonus+=10;}
  if(id==='springboard_strike'){M.spots++;M.spotHits++;M.bonus+=5;}
  if(id==='springboard_evaded'){M.spots++;M.bonus-=2;}
  if(id==='power_spinebuster'){M.bonus+=2;}
  if(id==='aerial_counter'){M.spots++;M.bonus-=5;}
  if(id==='cover')g.pendingCover=true;
  if(id==='target_hold'||id==='target_strike'||id==='arm_wringer')g.lastTarget=M.t;
  if(id==='near_kickout')g.pendingCover=false;
  g.node=id;g.steps++;
  g.events.push({id,t:M.t,preControl:side,control:p.control,position:p.position,down:p.down,arc:g.arc,reverse:n.reverse,victim,part,exertion:effective,
   physical:{locations:{...g.physical.locations},area:g.physical.area,grip:g.physical.grip?.type||null,topSide:g.physical.topSide},
   ...(pacedUntil!==null?{pacedRecoveryUntil:pacedUntil}:{}),
   ...(sellingExtra>0?{sellingStrain:{part:g.selling[activeSide].part,extraCost:sellingExtra}}:{}),
   ...(options.scriptedSpot?{scriptedSpot:true,scriptedBig:!!options.big}:{})});
  if(g.events.length>220)g.events.shift();
  sellingNarration(M,id,activeSide,sellingExtra);
  if(sequencePre)root.OfficeSheets?.DIRECTOR?.observeSequence(M,g.events[g.events.length-1],sequencePre,sequencePrevious,sequenceChoice);
  root.OfficeSheets?.DIRECTOR?.observe(M,g.events[g.events.length-1]);
  $d.structureCommentary(M);
  if(id==='cheap_shot')$d.referee(M,side);
  if(M.o.promo?.tactic?.kind==='counter'&&n.reverse&&side==='f'&&p.control==='w'&&
     M.t/M.len>=.58&&(M.o.promo.tactic.nodes.includes(id)||(!!n.counterOf&&(!M.o.promo.tactic.families||M.o.promo.tactic.families.includes(n.family))))&&!g.promoCounterPaid){
   g.promoCounterPaid=true;
   $d.say(M,M.w.short+' reads '+M.f.short+' and turns the attack around! That is the counter promised at the microphone'+(M.o.promo.tactic.label?', '+M.o.promo.tactic.label:'')+'.','story');
   root.OfficeSheets?.settleVow?.(M,'counter',id);
  }
  if(M.o.promo?.tactic?.kind==='finisher'&&id==='finish_tease'&&!g.promoFinisherScouted){
   g.promoFinisherScouted=true;
   $d.say(M,M.f.short+' recognises the advertised finishing setup! '+M.w.short+' has revealed the intention in advance.','story');
  }
  root.OfficeSheets?.observe(M,id,side,'action');
  if(n.name&&!n.counterOf&&!n.blockOf&&fighter(attacker).signature?.includes(id)){
   g.signatures??={w:0,f:0};
   if(!g.signatures[side]++)$d.say(M,$d.fill(M,'Colour: That is the {name} — nobody on this circuit does it quite like {A}.',{A:attacker.short,name:n.name}),'story');
  }
  if(M.t-(g.lastColourAt??-1000)>=100&&M.r()<.33){
   // Only describe the move that was performed. No new draw or fabricated
   // near-fall, injury, counter, crowd swing or change of control.
   const reactions={
    grapple_trip:[
     'The leg trip worked. {D} had no base left to defend it.',
     '{A} changed levels and took the supporting leg away.',
     'That is clean timing from {A}; {D} is on the mat.'
    ],
    power_spinebuster:[
     '{A} caught {D} and put them down with real force.',
     'A spinebuster leaves very little room to soften the landing.',
     '{D} took the full impact of that spinebuster.'
    ],
    springboard_strike:[
     '{A} committed to the springboard and connected.',
     'The balance and distance were right for that springboard landing.',
     '{D} could not clear the path of the springboard attack.'
    ],
    springboard_evaded:[
     '{D} saw the springboard coming and got out of range.',
     'That springboard only reaches the canvas; {D} moved clear.',
     '{A} committed to the leap, but {D} was gone before contact.'
    ],
    crowd_pose:[
     'A pause to play to the crowd gives {D} time to measure the distance.',
     '{A} is drawing a reaction instead of pressing the attack.',
     '{D} can reset while {A} works the crowd.',
     'That showboating takes a moment out of the exchange.'
    ],
    floor_counter:[
     '{D} has turned the ringside exchange around.',
     '{A} lost the advantage on the floor. The next step matters.',
     '{D} found the answer at ringside rather than in the ring.'
    ],
    submission_roll:[
     'That change in mat position came from an actual counter.',
     'A small change in leverage has altered this submission exchange.',
     'That roll broke the grip cleanly. The hold is over.'
    ]
   };
   if(reactions[id]){
    $d.say(M,$d.fill(M,textureLine(g,'colour:'+id,reactions[id]),
     {A:attacker.short,D:defender.short}),'story',
     {who:'colour',textureId:'colour:'+id});
    g.lastColourAt=M.t;
   }
  }
 }
 // Two-beat aerial sequence. The pending move lives in the serialised graph:
 // stage 1 commits and names the precise attack, stage 2 resolves that attack.
 function startAerial(M,id){
  const g=get(M),p=$d.Psy.get(M);
  if((g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact)||!isAerialParent(id)||!isValid(M,id)||p.position!==A[id].requires||M.len-M.t<10)
   return false;
  if(p.control!=='w'&&p.control!=='f')return false;
  const side=p.control,attacker=side==='w'?M.w:M.f,defender=side==='w'?M.f:M.w;
  const seq=++g.aerialAttemptSerial;
  g.pendingAerial={v:1,seq,id,side,at:M.t,position:p.position};
  g.aerialAttempts.push({seq,id,side,startedT:M.t,outcome:'pending'});
  // Commitment costs effort even when the defender reverses the airborne move.
  const key=side==='w'?'wSt':'fSt';
  M[key]=$d.clamp(M[key]-.8);g.exertion=(g.exertion||0)+.8;
  $d.say(M,attacker.short+' sets for the '+(A[id].name||id)+
   (A[id].family==='dive'?' towards '+defender.short+' at ringside. ':
    ' on the ropes. ')+defender.short+' sees the attack coming.','play');
  return true;
 }
 function concludeAerial(M,outcome,actionId=null){
  const g=get(M),pending=g.pendingAerial;
  if(!pending)return false;
  const record=g.aerialAttempts.find(x=>x.seq===pending.seq);
  if(record){record.outcome=outcome;record.resolvedT=M.t;record.actionId=actionId;}
  // Preserve the exact attempted move on the resulting real action event.
  g.pendingAerial=null;
  if(actionId){
   apply(M,actionId);
   const event=g.events[g.events.length-1];
   if(event?.id===actionId){
    event.aerialAttemptSeq=pending.seq;
    event.attemptedMove=pending.id;
    event.aerialResolution=outcome;
   }
  }
  return true;
 }
 function abortAerial(M,reason='interrupted',narrate=false){
  const pending=get(M).pendingAerial;
  if(!pending)return false;
  if(narrate){
   const attacker=pending.side==='w'?M.w:M.f;
   $d.say(M,attacker.short+' abandons the '+(A[pending.id]?.name||'aerial attack')+
    ' as the exchange breaks down.','play');
   const p=$d.Psy.get(M);
   if(pending.position==='outside'){
    // No dive landed: keep the actual ring/apron and floor locations
    // rather than teleporting wrestlers into a neutral ring exchange.
    p.position='outside';p.down=null;get(M).node=null;
   }else{
    p.position='standing';p.down=null;
    resetPhysical(M);get(M).node=null;
   }
  }
  return concludeAerial(M,reason);
 }
 function resolveAerial(M){
  const pending=get(M).pendingAerial;
  if(!pending)return false;
  const p=$d.Psy.get(M),id=pending.id;
  if(M.stage!=='live'||p.position!==(pending.position||A[id]?.requires)||p.control!==pending.side||
   !isAerialParent(id)||M.t<=pending.at)
   return abortAerial(M,'interrupted',M.stage==='live');
  if(!isValid(M,id))return abortAerial(M,'aborted',true);
  const attacker=pending.side==='w'?M.w:M.f;
  const defender=pending.side==='w'?M.f:M.w;
  const rev=id+'_rev',blk=id+'_blk';
  const attackSkill=attacker.ring*.65+attacker.psych*.35;
  const defenceSkill=defender.ring*.65+defender.psych*.35;
  let counterChance=Math.max(.075,Math.min(.28,.15+(defenceSkill-attackSkill)/300));
  // A promised defensive counter can pay off only against the promised move.
  const tactic=activePromoTactic(M);
  if(tactic?.kind==='counter'&&tactic.nodes?.includes(rev)&&pending.side==='f')
   counterChance=Math.min(.42,counterChance*1.6);
  const counterSide=pending.side==='w'?'f':'w';
  const expected=M.sheet?.v>=4&&root.OfficeRoom?
   root.OfficeRoom.wants(M,counterSide,'top')?.[0]:null;
  if(expected?.[0]===rev)counterChance=Math.min(.48,counterChance*1.7);
  const blockChance=A[blk]?Math.max(.055,Math.min(.13,.085+(defender.safe-attacker.safe)/550)):0;
  const roll=M.r();
  const counter=roll<counterChance&&A[rev]&&isValid(M,rev);
  const blocked=!counter&&roll<counterChance+blockChance&&A[blk]&&isValid(M,blk);
  return concludeAerial(M,counter?'counter':blocked?'block':'landed',
   counter?rev:blocked?blk:id);
 }
 // Four vetted throws/holds now share the Phase 6 commitment guarantees,
 // but do not share aerial probabilities, positions or generated narration.
 // Phase 4 — a distinct, saved two-beat strike/rebound attempt. A whiff,
 // block or counter never credits the attacking wrestler with a landed hit.
 // Phase 5: one contested canvas shot or roll-up. This is deliberately
 // separate from the standing strike and two-beat lifting/submission
 // ledgers, so referee near-falls cannot be credited to a missed pin.
 function startContact(M,id){
  const g=get(M),p=$d.Psy.get(M);
  if(g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact||
     !isContactParent(id)||!isValid(M,id)||
     M.stage!=='live'||!['w','f'].includes(p.control))return false;
  const seq=++g.contactAttemptSerial,kind=A[id].family;
  g.pendingContact={v:1,id,seq,kind,side:p.control,
   at:M.t,position:p.position,down:p.down};
  g.contactAttempts.push({seq,id,kind,side:p.control,startedT:M.t,outcome:'pending'});
  return true;
 }
 function concludeContact(M,outcome,actionId=null){
  const g=get(M),pending=g.pendingContact;
  if(!pending)return false;
  const record=g.contactAttempts.find(x=>x.seq===pending.seq);
  if(record){
   record.outcome=outcome;record.resolvedT=M.t;record.actionId=actionId;
  }
  g.pendingContact=null;
  if(actionId){
   apply(M,actionId);
   const e=g.events.at(-1);
   if(e?.id===actionId){
    e.contactAttemptSeq=pending.seq;
    e.attemptedMove=pending.id;
    e.contactResolution=outcome;
    e.contactKind=pending.kind;
   }
  }
  return true;
 }
 function abortContact(M,reason='interrupted'){
  return concludeContact(M,reason);
 }
 function resolveContact(M){
  const g=get(M),pending=g.pendingContact;
  if(!pending)return false;
  const p=$d.Psy.get(M),id=pending.id;
  if(M.stage!=='live'||p.control!==pending.side||
     p.position!==pending.position||p.down!==pending.down||
     !isValid(M,id))return abortContact(M,'interrupted');
  const attacker=p.control==='w'?M.w:M.f;
  const defender=p.control==='w'?M.f:M.w,rev=id+'_rev',blk=id+'_blk';
  const skillA=attacker.ring*.65+attacker.psych*.35;
  const skillD=defender.ring*.65+defender.psych*.35;
  // A cradle is easier to read than an ordinary grounded stomp.
  const base=pending.kind==='pin'?.19:.14;
  let counterChance=Math.max(.07,Math.min(.32,base+(skillD-skillA)/350));
  const tactic=activePromoTactic(M);
  if(tactic?.kind==='counter'&&tactic.nodes?.includes(rev)&&pending.side==='f')
   counterChance=Math.min(.4,counterChance*1.4);
  const blockChance=A[blk]?Math.max(.05,Math.min(.14,.075+
   (defender.safe-attacker.safe)/550)):0;
  const roll=M.r();
  const counter=roll<counterChance&&A[rev]&&isValid(M,rev);
  const block=!counter&&roll<counterChance+blockChance&&A[blk]&&isValid(M,blk);
  return concludeContact(M,counter?'counter':block?'block':'landed',
   counter?rev:block?blk:id);
 }
 function startStrike(M,id){
  const g=get(M),p=$d.Psy.get(M);
  if(g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact||
     !STRIKE_PILOT.includes(id)||!isValid(M,id)||
     M.len-M.t<10||M.stage!=='live'||!['w','f'].includes(p.control))return false;
  const side=p.control,attacker=side==='w'?M.w:M.f,
   defender=side==='w'?M.f:M.w,n=A[id],seq=++g.strikeAttemptSerial;
  g.pendingStrike={v:1,seq,id,side,at:M.t,position:p.position,down:p.down};
  g.strikeAttempts.push({seq,id,side,startedT:M.t,outcome:'pending'});
  const staminaKey=side==='w'?'wSt':'fSt';
  M[staminaKey]=$d.clamp(M[staminaKey]-.45);g.exertion=(g.exertion||0)+.45;
  // An ordinary strike/running exchange resolves in the same match beat.
  // Narrating a generic setup here AND the real applied event below repeats
  // identical lines every time a worker uses their preferred strike. The
  // landing, block or exact counter gets the commentary instead.
  return true;
 }
 function concludeStrike(M,outcome,actionId=null){
  const g=get(M),pending=g.pendingStrike;if(!pending)return false;
  const record=g.strikeAttempts.find(x=>x.seq===pending.seq);
  if(record){record.outcome=outcome;record.resolvedT=M.t;record.actionId=actionId;}
  g.pendingStrike=null;
  if(actionId){
   apply(M,actionId);
   const e=g.events.at(-1);
   if(e?.id===actionId){
    e.strikeAttemptSeq=pending.seq;
    e.attemptedMove=pending.id;
    e.strikeResolution=outcome;
   }
  }
  return true;
 }
 function abortStrike(M,reason='interrupted',narrate=false){
  const pending=get(M).pendingStrike;if(!pending)return false;
  if(narrate){
   const who=pending.side==='w'?M.w:M.f;
   $d.say(M,who.short+' cannot complete the '+(A[pending.id]?.name||'attack')+
    ' as the exchange breaks apart.','play');
   get(M).node=null;
  }
  return concludeStrike(M,reason);
 }
 function resolveStrike(M,immediate=false){
  const pending=get(M).pendingStrike;if(!pending)return false;
  const p=$d.Psy.get(M),id=pending.id;
  if(M.stage!=='live'||(!immediate&&M.t<=pending.at)||
     p.control!==pending.side||p.position!==pending.position||
     p.down!==pending.down)
   return abortStrike(M,'interrupted',M.stage==='live');
  if(!isValid(M,id))return abortStrike(M,'aborted',true);
  const attacker=pending.side==='w'?M.w:M.f,
   defender=pending.side==='w'?M.f:M.w,rev=id+'_rev',blk=id+'_blk';
  const attackSkill=attacker.ring*.65+attacker.psych*.35,
   defenceSkill=defender.ring*.65+defender.psych*.35;
  let counterChance=Math.max(.06,Math.min(.31,.145+(defenceSkill-attackSkill)/320));
  const tactic=activePromoTactic(M);
  if(tactic?.kind==='counter'&&tactic.nodes?.includes(rev)&&pending.side==='f')
   counterChance=Math.min(.43,counterChance*1.5);
  const blockChance=A[blk]?Math.max(.05,Math.min(.16,.095+(defender.safe-attacker.safe)/500)):0;
  const roll=M.r();
  const counter=roll<counterChance&&A[rev]&&isValid(M,rev);
  const block=!counter&&roll<counterChance+blockChance&&A[blk]&&isValid(M,blk);
  return concludeStrike(M,counter?'counter':block?'block':'landed',counter?rev:block?blk:id);
 }
 function startGrapple(M,id){
  const g=get(M),p=$d.Psy.get(M);
  if(g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact||!isGrappleParent(id)||!isValid(M,id)||
   M.len-M.t<10||M.stage!=='live'||!['w','f'].includes(p.control))return false;
  const n=A[id],side=p.control,attacker=side==='w'?M.w:M.f,defender=side==='w'?M.f:M.w;
  const type=n.family==='submission'?'hold':'throw',seq=++g.grappleAttemptSerial;
  g.pendingGrapple={v:1,seq,id,side,type,at:M.t,position:p.position,down:p.down};
  g.grappleAttempts.push({seq,id,side,type,startedT:M.t,outcome:'pending'});
  const key=side==='w'?'wSt':'fSt';
  M[key]=$d.clamp(M[key]-.65);g.exertion=(g.exertion||0)+.65;
  const name=n.name||id;
  // A grappling setup is not a completed move: no false landing or effect.
  // The saved counter changes wording but consumes no gameplay RNG.
  const openings=n.family==='superplex'?[
   attacker.short+' hooks '+defender.short+' on the turnbuckles and sets up the '+name+'. '+defender.short+' tries to break the grip.',
   attacker.short+' looks for the '+name+' from the turnbuckles. '+defender.short+' resists the setup.',
   attacker.short+' attempts the '+name+' high on the ropes; '+defender.short+' braces against it.',
   attacker.short+' has '+defender.short+' by the ropes and prepares the '+name+'. The grip is not secure yet.',
   attacker.short+' tries to arrange the '+name+' in the corner. '+defender.short+' fights the position.',
   attacker.short+' searches for the '+name+' on the turnbuckles; '+defender.short+' is still resisting.'
  ]:type==='throw'?[
   attacker.short+' secures the grip and prepares the '+name+'. '+defender.short+' braces against the lift.',
   attacker.short+' pulls '+defender.short+' into position for the '+name+'. '+defender.short+' resists.',
   attacker.short+' tries to set up the '+name+', but '+defender.short+' is still fighting the grip.',
   attacker.short+' takes hold for the '+name+'. '+defender.short+' prepares to defend the throw.',
   attacker.short+' looks for the '+name+' while '+defender.short+' tries to break the setup.',
   attacker.short+' moves into the '+name+' position. '+defender.short+' keeps their balance for now.'
  ]:[
   attacker.short+' works to lock in the '+name+'. '+defender.short+' fights the grip.',
   attacker.short+' reaches for the '+name+', but '+defender.short+' is keeping the hands apart.',
   attacker.short+' tries to secure the '+name+'. '+defender.short+' refuses to give up the grip.',
   attacker.short+' moves towards the '+name+' while '+defender.short+' struggles against the setup.',
   attacker.short+' seeks control for the '+name+'. '+defender.short+' is still defending.',
   attacker.short+' tests the '+name+' position, with '+defender.short+' resisting the hold.'
  ];
  $d.say(M,textureLine(g,'grapple-opening:'+id,openings),'play',
   {textureId:'grapple-opening:'+id});
  return true;
 }

 // Phase 9A. One emergent grapple motif per active structured bout.
 // A real defended commitment starts it; the same wrestler later landing
 // the identical move is the only valid payoff.
 function motifWitness(M,pending,outcome,id){
  if(!root.OfficeSheets?.DIRECTOR?.active(M))return;
  const g=get(M),e=g.events.at(-1),n=A[pending.id];
  if(!e||!n||e.id!==id||e.grappleAttemptSeq!==pending.seq||
     e.attemptedMove!==pending.id||e.grappleResolution!==outcome)return;
  const m=g.matchMotif;
  if(m){
   if(m.id!==pending.id||m.side!==pending.side||
      m.status!=='open'||pending.at<=m.startedAt)return;
   if(outcome==='counter'||outcome==='block'){
    m.failures=Math.min(8,m.failures+1);m.lastAt=M.t;
   }else if(outcome==='landed'&&id===pending.id){
    m.status='paid';m.paidAt=M.t;m.payoffSeq=pending.seq;
    const who=pending.side==='w'?M.w:M.f;
    $d.say(M,who.short+' finally connects with the '+(n.name||'grapple')+
     ' after '+m.failures+' earlier defended attempt'+(m.failures===1?'':'s')+
     '. There is a story behind that move.','story',{textureId:'match-motif-payoff'});
   }
   return;
  }
  if(!['counter','block'].includes(outcome)||M.t/M.len>.62||
     !['suplex','power','neck','submission','chain','superplex'].includes(n.family)||
     (M.planId==='safe'&&(n.risk||costOf(pending.id)>2.2)))return;
  g.matchMotif={version:1,id:pending.id,side:pending.side,
   status:'open',startedAt:M.t,firstSeq:pending.seq,lastAt:M.t,
   failures:1,paidAt:null,payoffSeq:null};
  const who=pending.side==='w'?M.w:M.f;
  $d.say(M,who.short+' has been denied the '+(n.name||'grapple')+
   '. That could be worth revisiting later.','story',{textureId:'match-motif-start'});
 }
 function motifOffers(M,side){
  if(!root.OfficeSheets?.DIRECTOR?.active(M))return [];
  const g=get(M),m=g.matchMotif,p=$d.Psy.get(M);
  if(!m||m.status!=='open'||m.side!==side||M.t-m.lastAt<60||
     M.t/M.len<Math.max(.36,m.startedAt/M.len+.12)||M.t/M.len>.9||
     M.len-M.t<40||(M.planId==='safe'&&(A[m.id]?.risk||costOf(m.id)>2.2)))return [];
  const required=PHYSICAL_GRIP_MOVES[m.id],held=g.physical?.grip;
  if(required&&(!held||held.side!==side||held.type!==required||M.t-held.at>20)){
   const entry={'front-facelock':'front_facelock','rear-waist':'go_behind',
    'upper-body':'lockup','body-clinch':'pw_bearhug','head':'headlock',
    'wrist':'wristlock','ground-leg':'leg_wrench',
    'ground-arm':'rs_wrist_mat','ground-head':'rs_side_headlock',
    'ground-back':'rs_mat_stretch'}[required];
   return entry&&A[entry]?.requires===p.position?[[entry,4.0]]:[];
  }
  return [[m.id,8.0]];
 }
 function motifSummary(M){
  const m=M.graph?.matchMotif;
  if(!root.OfficeSheets?.DIRECTOR?.active(M)||!m)return null;
  const attempts=M.graph.grappleAttempts||[];
  if(!attempts.some(x=>x.seq===m.firstSeq&&x.id===m.id&&x.side===m.side&&
     ['counter','block'].includes(x.outcome)&&x.resolvedT===m.startedAt))return null;
  const paid=m.status==='paid'&&attempts.some(x=>x.seq===m.payoffSeq&&
   x.id===m.id&&x.side===m.side&&x.outcome==='landed'&&
   x.startedT>m.startedAt&&x.resolvedT===m.paidAt);
  return {version:1,action:m.id,owner:m.side,firstFailedAt:m.startedAt,
   defendedAttempts:m.failures,status:paid?'paid':'open',
   ...(paid?{paidAt:m.paidAt}:{}),
   explanation:'Real defended grapple; a payoff requires the same move to land later.'};
 }
 function concludeGrapple(M,outcome,actionId=null){
  const g=get(M),pending=g.pendingGrapple;
  if(!pending)return false;
  const record=g.grappleAttempts.find(x=>x.seq===pending.seq);
  if(record){record.outcome=outcome;record.resolvedT=M.t;record.actionId=actionId;}
  g.pendingGrapple=null;
  if(actionId){
   apply(M,actionId);
   const event=g.events[g.events.length-1];
   if(event?.id===actionId){
    event.grappleAttemptSeq=pending.seq;
    event.attemptedMove=pending.id;
    event.grappleResolution=outcome;
    motifWitness(M,pending,outcome,actionId);
   }
  }
  return true;
 }
 function abortGrapple(M,reason='interrupted',narrate=false){
  const pending=get(M).pendingGrapple;
  if(!pending)return false;
  if(narrate){
   const attacker=pending.side==='w'?M.w:M.f;
   $d.say(M,attacker.short+' loses the grip before completing the '+(A[pending.id]?.name||'move')+'.','play');
   const p=$d.Psy.get(M);
   // A grounded hold remains grounded on a failed setup; a failed throw resets.
   if(pending.type==='throw'){p.position='standing';p.down=null;get(M).physical=null;}
   get(M).node=null;
  }
  return concludeGrapple(M,reason);
 }
 function resolveGrapple(M){
  const pending=get(M).pendingGrapple;
  if(!pending)return false;
  const p=$d.Psy.get(M),id=pending.id;
  if(M.stage!=='live'||!isGrappleParent(id)||M.t<=pending.at||
   p.control!==pending.side||p.position!==pending.position||
   p.down!==pending.down)return abortGrapple(M,'interrupted',M.stage==='live');
  if(!isValid(M,id))return abortGrapple(M,'aborted',true);
  const attacker=pending.side==='w'?M.w:M.f,defender=pending.side==='w'?M.f:M.w;
  const rev=id+'_rev',blk=id+'_blk';
  const attackerSkill=attacker.ring*.7+attacker.psych*.3;
  const defenderSkill=defender.ring*.7+defender.psych*.3;
  const base=pending.type==='hold'?.19:.13;
  let counterChance=Math.max(.06,Math.min(.32,base+(defenderSkill-attackerSkill)/350));
  const tactic=activePromoTactic(M);
  if(tactic?.kind==='counter'&&tactic.nodes?.includes(rev)&&pending.side==='f')
   counterChance=Math.min(.4,counterChance*1.5);
  const blockChance=A[blk]?Math.max(.04,Math.min(.13,.07+(defender.safe-attacker.safe)/600)):0;
  const roll=M.r();
  const counter=roll<counterChance&&A[rev]&&isValid(M,rev);
  const blocked=!counter&&roll<counterChance+blockChance&&A[blk]&&isValid(M,blk);
  return concludeGrapple(M,counter?'counter':blocked?'block':'landed',
   counter?rev:blocked?blk:id);
 }

 // Phase 9C: a finishing runway is EVIDENCE, not a prescribed set of moves.
 // Only a genuine opponent attack, an earned reversal, an authored setup
 // and a legal same-owner impact in the final exchanges can witness it.
 // The agreed finish and its physical prerequisites remain independent.
 // A performed strike trade can naturally lead to the already-authored
 // clothesline edge. Recognise that actual setup rather than inserting
 // an unnecessary Irish whip or claiming a non-existent reversal.
 const CLOSING_SETUPS=new Set(['strike_trade','rope_run','rope_rebound','front_facelock',
  'go_behind','waistlock','wristlock','headlock','corner_whip',
  'top_climb','springboard_rise','leg_wrench','knuckle_lock']);
 // Phase 9I: a finishing ROUTE starts with a believable plan-specific
 // setup, never a preselected outcome or automatic move.
 // Each source must have an existing, position-compatible authored impact.
 const CLOSING_PLAN_SETUPS=Object.freeze({
  story:Object.freeze([['rope_run',1.8],['waistlock',1.4],
   ['front_facelock',1.65],['strike_trade',1.3]]),
  technical:Object.freeze([['waistlock',1.8],['headlock',1.65],
   ['go_behind',1.5],['wristlock',1.2]]),
  brawl:Object.freeze([['strike_trade',1.9],['rope_run',1.7],
   ['rope_rebound',1.4],['front_facelock',1.05]]),
  spots:Object.freeze([['rope_run',1.8],['springboard_rise',1.65],
   ['top_climb',1.35],['corner_whip',1.05]]),
  safe:Object.freeze([['headlock',1.8],['waistlock',1.55],
   ['wristlock',1.3],['front_facelock',1.05]])
 });
 function closingPlanSetups(M){
  const sources=CLOSING_PLAN_SETUPS[M.planId]||CLOSING_PLAN_SETUPS.story;
  return sources.filter(([id])=>{
   const source=A[id];if(!source||!isValid(M,id))return false;
   // Source's destination position must be compatible with the real next
   // action, not merely a vaguely related graph node.
   const position=source.zone==='standing'?'standing':source.zone;
   return source.next.some(([nextId])=>{
    const n=A[nextId];return !!n&&n.requires===position&&
     n.zone==='mat'&&n.down==='d'&&!n.reverse&&
     !n.counterOf&&!n.blockOf&&!n.nearfall&&
     (M.planId==='spots'||!n.risk)&&
     (M.planId!=='safe'||(!n.risk&&costOf(nextId)<=2.2));
   });
  });
 }
 function closingEligible(M){
  return !!root.OfficeSheets?.DIRECTOR?.active(M)&&M.outcome==='booked'&&
   ['win_clean','lose_clean'].includes(M.o.finish);
 }
 function closingValidEvent(e){
  const n=A[e?.id];
  return !!n&&Number.isFinite(e.t)&&
   ['w','f'].includes(e.preControl)&&
   !n.blockOf&&!n.nearfall&&
   // A performed defensive counter is a SUCCESSFUL reversal, even though
   // its parent attempt correctly records resolution='counter', not 'landed'.
   // Never count blocked, interrupted or aborted attempts as an impact.
   ['aerialResolution','grappleResolution','strikeResolution','contactResolution']
    .every(k=>!e[k]||e[k]==='landed'||(n.reverse&&e[k]==='counter'));
 }
 function closingImpact(e,winner,loser){
  const n=A[e?.id];
  return closingValidEvent(e)&&!n.reverse&&!n.counterOf&&
   e.preControl===winner&&e.control===winner&&
   e.position==='mat'&&e.down===loser&&
   n.zone==='mat'&&n.down==='d';
 }
 function closingPressure(e,loser){
  const n=A[e?.id];
  return closingValidEvent(e)&&!n.reverse&&!n.counterOf&&
   e.preControl===loser&&e.control===loser&&
   n.family!=='rest'&&n.family!=='heel'&&
   (n.cost??1)>=.6;
 }
 // A performed opponent reversal breaks an earlier finish link even if
 // the screenplay later silently assigns control to the booked winner.
 function closingControlBreak(e,winner,loser){
  return closingPressure(e,loser)||
   (closingValidEvent(e)&&!!A[e.id]?.reverse&&
    e.preControl===winner&&e.control===loser);
 }
 function closingRunway(M){
  if(!closingEligible(M))return null;
  const g=get(M),winner=M.o.finish==='win_clean'?'w':'f',
   loser=winner==='w'?'f':'w',events=g.events||[];
  if($d.Psy.get(M).control!==winner)return null;
  // No retroactive link when the losing wrestler regained control after
  // the last impact. A finish-cue event is not an offensive landing.
  const latest=events.filter(e=>closingValidEvent(e));
  const window=Math.min(220,M.len*.34),earliest=M.t-window;
  let linked=null;
  for(let k=latest.length-1;k>=0;k--){
   const impact=latest[k];
   if(!closingImpact(impact,winner,loser)||impact.t<earliest||
      impact.t>M.t||M.t-impact.t>90)continue;
   if(latest.slice(k+1).some(e=>closingControlBreak(e,winner,loser)))continue;
   for(let j=k-1;j>=0;j--){
    const setup=latest[j];
    if(setup.t<impact.t-60)break;
    if(setup.t>=impact.t||!CLOSING_SETUPS.has(setup.id)||
       setup.preControl!==winner||setup.control!==winner||
       !A[setup.id].next.some(([id])=>id===impact.id))continue;
    if(latest.slice(j+1,k).some(e=>closingControlBreak(e,winner,loser)))continue;
    // Two genuinely performed linked actions count as construction, but
    // never claim an unobserved earlier opponent counter.
    if(!linked)linked={version:1,status:'linked',winner,loser,bookedFinish:M.o.finish,
     pressure:null,cutoff:null,
     setup:{id:setup.id,at:setup.t,side:winner},
     impact:{id:impact.id,at:impact.t,side:winner},
     explanation:'A real, same-wrestler authored setup-to-impact sequence. No cutoff or opponent pressure is inferred, and the contracted finisher is not counted as a physical graph landing.'};
    for(let i=j-1;i>=0;i--){
     const cutoff=latest[i];
     if(cutoff.t<setup.t-100)break;
     if(cutoff.t>=setup.t||cutoff.preControl!==loser||
        cutoff.control!==winner||!A[cutoff.id]?.reverse)continue;
     if(latest.slice(i+1,j).some(e=>closingControlBreak(e,winner,loser)))continue;
     // A planned takeover without performed opponent pressure cannot count
     // as a cut-off; require a prior real attack from the other wrestler.
     const threatened=latest.slice(0,i).reverse().find(e=>
      closingPressure(e,loser)&&e.t<cutoff.t&&cutoff.t-e.t<=100);
     if(!threatened)continue;
     return {version:1,status:'witnessed',winner,loser,bookedFinish:M.o.finish,
      pressure:{id:threatened.id,at:threatened.t,side:loser},
      cutoff:{id:cutoff.id,at:cutoff.t,side:winner},
      setup:{id:setup.id,at:setup.t,side:winner},
      impact:{id:impact.id,at:impact.t,side:winner},
      explanation:'Real opponent pressure, a genuine reversal, an authored same-side setup-to-impact link and unbroken closing control. The contracted finish is not treated as a graph landing.'};
    }
   }
  }
  return linked;
 }
 // Phase 9K: tell genuine near-fall drama APART from a booked finishing
 // runway. Observed authored cradles are actual kick-outs, not finishes.
 // The scheduled earned cover must point back to one real, correctly
 // controlled knockdown. No synthetic move, reversal or winner is inferred.
 // Does not mutate the tape, match RNG, saved play state or stars.
 function nearfallDrama(M){
  const events=get(M).events||[],moments=[],ACTIONS=A;
  const landed=e=>['aerialResolution','grappleResolution',
   'strikeResolution','contactResolution'].every(key=>
    !e[key]||e[key]==='landed');
  const inRing=e=>!e.physical||
   (e.physical.area==='ring'&&e.physical.locations?.w==='ring'&&
    e.physical.locations?.f==='ring');
  for(const e of events){
   const node=ACTIONS[e?.id],side=e?.preControl,other=side==='w'?'f':'w';
   // A narrated authored cradle or rana-pin is an actual two-count.
   // A countered or blocked attempt is NOT a performed pin.
   if(node?.nearfall&&['w','f'].includes(side)&&
      !node.reverse&&!node.counterOf&&!node.blockOf&&landed(e)&&
      e.control===side&&e.position==='mat'&&e.down===other&&
      node.zone==='mat'&&inRing(e)){
    moments.push({kind:'authored_kickout',at:e.t,side,action:e.id,
     source:null});
   }else if(e?.id==='scheduled_nearfall'&&e.earned===true&&
    ['w','f'].includes(e.sourceSide)&&Number.isFinite(e.sourceT)&&
    typeof e.sourceMove==='string'){
    const owner=e.sourceSide,opponent=owner==='w'?'f':'w';
    const src=events.find(x=>x.id===e.sourceMove&&x.t===e.sourceT&&
     x.preControl===owner&&x.control===owner&&x.position==='mat'&&
     x.down===opponent&&ACTIONS[x.id]?.zone==='mat'&&
     ACTIONS[x.id]?.down==='d'&&!ACTIONS[x.id]?.reverse&&
     !ACTIONS[x.id]?.counterOf&&!ACTIONS[x.id]?.blockOf&&
     landed(x)&&inRing(x));
    if(src&&Number.isFinite(e.t)&&e.t>=src.t&&e.t-src.t<=30&&
       e.control===owner&&e.position==='mat'&&
       e.down===opponent){
     moments.push({kind:'earned_cover',at:e.t,side:owner,
      action:e.sourceMove,source:{id:src.id,at:src.t}});
    }
   }
  }
  const bySide={w:0,f:0},byKind={authored_kickout:0,earned_cover:0};
  for(const moment of moments){bySide[moment.side]++;byKind[moment.kind]++;}
  return {version:1,total:moments.length,bySide,byKind,
   moments: moments.map(m=>({...m}))};
 }
 // Phase 9L: after a genuinely EARNED counted cover, the original
 // grounding move can still have real, positionally legal grounded
 // follow-throughs. The standard stand_reset after a scheduled cover
 // intentionally breaks that graph node's ordinary next[] route. Offer
 // the SOURCE-AUTHORED mat response once, without bypassing any counter,
 // cover, current control, Director, safety or fatigue constraint.
 // Both wrestlers receive identical treatment; never favour the winner.
 function nearfallFollowupOffers(M,side){
  if(!closingEligible(M)||!['w','f'].includes(side)||
     M.len-M.t<40||M.len-M.t>180)return [];
  const g=get(M),p=$d.Psy.get(M),last=g.events.at(-1),
   other=side==='w'?'f':'w';
  if(!last||M.t-last.t<0||M.t-last.t>20||
     p.control!==side||p.position!=='mat'||p.down!==other||
     last.control!==side||last.position!=='mat'||last.down!==other||
     g.physical?.area!=='ring'||g.pendingAerial||
     g.pendingGrapple||g.pendingStrike||g.pendingContact)return [];
  const evidence=nearfallDrama(M).moments.find(m=>
   m.at===last.t&&m.side===side&&
   (last.id==='scheduled_nearfall'?
    m.kind==='earned_cover'&&m.source?.id===last.sourceMove&&
     m.source.at===last.sourceT:
    m.kind==='authored_kickout'&&m.action===last.id));
  if(!evidence)return [];
  const source=A[evidence.source?.id||evidence.action];
  return (source?.next||[]).filter(([id])=>{
   const n=A[id];return !!n&&n.requires==='mat'&&n.zone==='mat'&&
    n.down==='d'&&!n.nearfall&&!n.reverse&&!n.counterOf&&
    !n.blockOf&&n.family!=='rest'&&n.family!=='heel'&&!n.risk&&
    !['cover','early_cover','near_kickout','scheduled_nearfall'].includes(id)&&
    (M.planId!=='safe'||costOf(id)<=2.2)&&isValid(M,id);
  }).map(([id,w])=>[id,Math.max(.8,w)*1.8]);
 }
 function closingOffers(M,side){
  if(!closingEligible(M)||!['w','f'].includes(side))return [];
  const winner=M.o.finish==='win_clean'?'w':'f';
  // The booked winner can still *choose* a real authored setup/impact
  // during the last minute. The earlier 95% cutoff retired legal offers
  // while the evidence window remained open. Keep losing-side pressure
  // on the original deadline; no belated free counter or control change.
  const winnerWindow=side===winner;
  if(M.t/M.len<.74||M.t/M.len>(winnerWindow?.98:.95)||
     M.len-M.t<(winnerWindow?20:30))return [];
  const g=get(M),p=$d.Psy.get(M),last=g.events.at(-1),
   loser=winner==='w'?'f':'w',node=A[last?.id];
  if(!closingValidEvent(last)||M.t-last.t>25||
     g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact)return [];
  if(side===loser&&p.position==='standing'&&
     closingPressure(last,loser))
   return [['counter_strike',2.6]]; // Defender performs the counter.
  if(side===winner&&p.position==='standing'&&
     last.preControl===loser&&last.control===winner&&node.reverse&&
     g.events.some(e=>closingPressure(e,loser)&&
      e.t<last.t&&last.t-e.t<=100)){
   // The defender EARNED control through a performed reversal. Its next
   // optional setup should suit the actual match plan, not always be the
   // same American rope-run / front-facelock combination. Every offered
   // source still has a real, legal authored impact edge. The counter is
   // never scripted or granted by this director.
   const planRoutes=closingPlanSetups(M);
   return planRoutes.length?planRoutes.map(([id,w])=>[id,w*1.7]):
    [['rope_run',3.6],['front_facelock',2.2]];
  }
  // Phase 9H: one authentic same-owner standing continuation should not
  // erase a freshly earned authored setup. The old guidance vanished as
  // soon as the next legal action was a lockup, controlled step or exchange
  // rather than an immediate grounding impact. Give the original authored
  // impact ONE more optional selection, never a new edge or forced landing.
  // The physical state, last actual event, timed source and normal pool
  // validity remain authoritative. Deliberate rests/disengagements and
  // counters terminate this chance; no handed-off control is inferred.
  if(side===winner&&M.len-M.t<=70&&M.len-M.t>=30&&
     p.position==='standing'&&p.down===null&&
     g.physical?.area==='ring'&&last.id===g.node&&
     last.preControl===winner&&last.control===winner&&
     !node.reverse&&!node.counterOf&&!node.blockOf&&!node.nearfall&&
     !['rest','heel'].includes(node.family)&&
     !['catch_breath','circle','crowd_pose','taunt','finish_tease',
      'stand_reset','double_down_count','rope_crawl'].includes(last.id)){
   const source=g.events.at(-2),authored=A[source?.id];
   if(source&&CLOSING_SETUPS.has(source.id)&&
      source.preControl===winner&&source.control===winner&&
      source.t<last.t&&last.t-source.t<=20&&
      M.t-source.t>=0&&M.t-source.t<=40&&
      closingValidEvent(source)&&
      !g.events.slice(-2).some(e=>e.control===loser)){
    const targets=(authored?.next||[]).filter(([id])=>
     A[id]?.zone==='mat'&&A[id]?.down==='d'&&
     !A[id]?.reverse&&!A[id]?.counterOf&&!A[id]?.blockOf&&
     !A[id]?.risk&&isValid(M,id));
    if(targets.length)return targets.map(([id])=>{
     const repeated=g.events.some(e=>e.id===id&&
      e.preControl===winner&&e.t>=M.t-150);
     return [id,repeated?1.1:2.8];
    });
   }
  }
  // A clean winner can earn a real closing setup by taking control through
  // ordinary in-ring offence, not only by executing a named reversal.
  // This is a candidate choice after a performed standing action, NEVER an
  // invented counter, automatic control switch, or scripted successful move.
  // Leave the stronger cutoff narrative for actual observed reversals.
  if(side===winner&&p.position==='standing'&&p.down===null&&
     g.physical?.area==='ring'&&last.preControl===winner&&
     last.control===winner&&!node.reverse&&!node.blockOf&&
     !node.nearfall&&!CLOSING_SETUPS.has(last.id)&&
     (node.cost??1)>=.7&&!['rest','heel'].includes(node.family)&&
     !g.events.some(e=>e.preControl===winner&&CLOSING_SETUPS.has(e.id)&&
       e.t>=M.t-70&&e.t<=M.t)){
   // Choose one of the plan's genuine graph pathways only after a
   // performed current-controller action. Existing legal alternatives
   // still compete in the pool. Unknown old saves use a safe fallback.
   const routes=closingPlanSetups(M);
   return routes.length?routes:[['rope_run',1.8],['waistlock',1.4]];
  }
  if(side===winner&&last.preControl===winner&&last.control===winner&&
     CLOSING_SETUPS.has(last.id)){
   // A performed setup can offer a real authored impact even without a
   // witnessed counter; the final report distinguishes those two cases.
   return node.next.filter(([id])=>A[id]?.zone==='mat'&&
    A[id]?.down==='d'&&!A[id]?.reverse&&!A[id]?.risk).map(([id])=>[id,2.8]);
  }
  return [];
 }
 function validPool(M){
  const g=get(M),p=$d.Psy.get(M),arc=ARCS[g.arc],current=A[g.node],pattern=PATTERNS[M.planId]||PATTERNS.story;
  const from=current?.next?.length?current.next.map(([id,w])=>[id,w*4]):[];
  const entries=arc.entry.map(id=>[id,1]);
  const selected=[...from,...entries];
  const negotiated=root.OfficeSheets?.DIRECTOR?.sequenceOffer(M,p);
  if(negotiated)selected.push([negotiated.id,negotiated.continuation?8:4]);
  const postCoverOffers=nearfallFollowupOffers(M,p.control);
  selected.push(...postCoverOffers);
  // Only the explicitly activated Chickenshit structure gets additional
  // real candidate moves. Every offer still goes through isValid below.
  if(root.OfficeSheets?.DIRECTOR?.active(M)){
   selected.push(...root.OfficeSheets.DIRECTOR.offers(M,p.control));
   selected.push(...motifOffers(M,p.control));
   selected.push(...closingOffers(M,p.control));
  }
  // In a STORY finishing stretch, the match can only earn a dramatic
  // kick-out if a real worker actually hits a genuine grounding attack.
  // Promote a few existing, position-valid knockdowns as normal selectable
  // actions as the next nearfall slot approaches. No authored move or
  // outcome is guaranteed; the exact physical and skill gates apply
  // unchanged in the final isValid pool filter.
  const closingSlot=M.planId==='story'&&M.len>=720&&
   M.nearfallAt?.length&&M.t/M.len>=M.nearfallAt[0]-.06&&
   M.t/M.len>=.72&&M.t/M.len<=1;
  const closingExchange=M.planId==='story'&&M.len>=720&&
   M.len-M.t<=90&&M.len-M.t>=0;
  if((closingSlot||closingExchange)&&p.position==='standing'&&
      ['w','f'].includes(p.control)&&g.physical?.area==='ring'){
   const striker=p.control==='w'?M.w:M.f;
   const prepared=striker.style==='Story'&&striker.ring>=70&&striker.psych>=65;
   for(const id of ['clothesline','snap_suplex','heavy_slam',
      'power_spinebuster','arm_drag','mat_takedown','short_arm_lariat']){
    if(!A[id])continue;
    const repeated=g.events.some(e=>e.id===id&&e.preControl===p.control&&M.t-e.t<=80);
    selected.push([id,(closingSlot?8.5:5.5)*(prepared?1.2:1)*
     (repeated?.16:1)]);
   }
  }
  // Technical already has authentic linked takedown/hold chains. Adding
  // timer-driven bonus candidates before a due cover displaced real
  // wristlock -> rolling-control -> takedown triples (verified in the
  // matched 96-bout trace). Preserve that organic pool; the same source
  // validator earns its scheduled covers from actual Technical landings.
  // Only the other three plans need more grounding candidates.
  const earnedWindow=['brawl','spots','safe'].includes(M.planId)&&M.len>=720&&
   // A prepared move family has priority over an unrelated scheduled cover.
   // Preserve the genuine Technical grip, Brawl rope run and Spots
   // aerial payoff instead of crowding their legal continuations.
   (M.planId!=='spots'||M.len-M.t>180)&&
   !readyTechnicalGrip(M)&&!readyBrawlRebound(M)&&!readyNamedAerial(M)&&
   M.nearfallAt?.length&&M.t/M.len>=M.nearfallAt[0]-.10&&
   M.t/M.len>=.69&&M.t/M.len<=.99;
  if(earnedWindow&&p.position==='standing'&&
      ['w','f'].includes(p.control)&&g.physical?.area==='ring'){
   const groundedOptions={
    brawl:['clothesline','power_spinebuster','heavy_slam',
      'short_arm_lariat','shoulder_tackle','body_shot'],
    spots:['sb_dropkick','lc_hurricanrana','high_crossbody',
      'ar_moonsault','ar_450','clothesline','snap_suplex'],
    safe:['arm_drag','grapple_trip','mat_takedown','headlock_takeover','hip_toss']
   };
   const striker=p.control==='w'?M.w:M.f;
   const trained=(striker.ring>=70&&striker.safe>=65)?1.16:1;
   for(const id of groundedOptions[M.planId]||[]){
    const n=A[id];
    if(!n||n.down!=='d'||n.zone!=='mat')continue;
    if(M.planId==='safe'&&(n.risk||costOf(id)>2.2))continue;
    const repeated=g.events.some(e=>e.id===id&&e.preControl===p.control&&
      M.t-e.t<=80);
    const pressure=M.t/M.len>=M.nearfallAt[0]?17:10;
    selected.push([id,pressure*trained*(repeated?.18:1)]);
   }
  }
  // A trained Story wrestler may contest actual opponent pressure while
  // still underneath in a heat-stage hope arc. The authored counter is
  // selectable but never guaranteed; normal legality, exertion and
  // independent move selection still apply. Do not grant free control.
  if(M.planId==='story'&&['hope','second_hope'].includes(g.arc)&&
     p.control==='f'&&['standing','mat'].includes(p.position)&&
     M.w.style==='Story'&&M.w.ring>=68&&M.w.psych>=65&&
     M.wSt>=23&&M.t/M.len>=.25&&M.t/M.len<.82&&
     g.events.some(e=>e.preControl==='f'&&e.control==='f'&&
      M.t>=e.t&&M.t-e.t<=130&&
      ['cutoff','control','limb_work','floor_heat','denial'].includes(e.arc)&&
      !!A[e.id]&&!A[e.id].reverse&&!A[e.id].counterOf&&
      !A[e.id].blockOf&&
      ['strikeResolution','grappleResolution','contactResolution']
       .every(k=>!e[k]||e[k]==='landed'))){
   const opening=p.position==='mat'?'mat_scramble':'counter_strike';
   // This is an existing real defensive reversal. The opponent's
   // established physical/position state and isValid remain authoritative.
   selected.push([opening,32+Math.max(0,M.w.psych-65)*.6]);
  }
  // Only an event actually performed by the current controller can seed an
  // offensive continuation. Arc changes and special interruptions break it.
  const previous=g.events[g.events.length-1];
  const sameController=!!(previous&&previous.id===g.node&&previous.control===p.control);
  const prior=g.events[g.events.length-2];
  const inSequence=!!(sameController&&prior&&prior.control===p.control&&
   CHAIN_BY_PAIR.has(prior.id+'>'+previous.id));
  // Phase 6: real environmental setups should offer the documented family
  // attacks that can follow them. The authored family 'from' lists express
  // the intended handoff, including moves omitted by a sparse initial link
  // generator. Guard each destination with the same physical, timing and
  // stamina isValid rules below; never offer detached counters/blocks.
  // This restores genuine moves, not the free-floating defensive nodes
  // removed by the exact-parent integrity fix.
  if(sameController&&g.node){
   // The original dive family had legal physical locations but extremely
   // few organically selected parents in live bouts. After an actual
   // ringside setup, offer existing named dives at a bounded weight; the
   // standard physical guards exclude floor-bound launches and mismatched
   // apron moves. No defensive node is introduced or made autonomous.
   if(p.position==='outside'&&['outside_toss','floor_regroup','apron_stand'].includes(g.node))
    for(const id of DIVE_PILOT)selected.push([id,2.1]);
   for(const family of ['corner','outside','rope']){
    const source=CAT.F[family];
    if(!source?.from?.includes(g.node))continue;
    for(const id of CAT.members[family]||[])
     if(ENVIRONMENT_PILOT.includes(id)&&A[id].requires===p.position)
      selected.push([id,1.05]);
   }
  }
  const liveSide=p.control==='f'?M.f:M.w;
  const style=STYLE_BEATS[liveSide.style]||STYLE_BEATS.Story;
  if(p.position==='standing'&&arc.openers)
   for(const id of style.open)selected.push([id,1.6]);
  const prof=fighter(liveSide),stamina=p.control==='f'?M.fSt:M.wSt;
  const trainedRecovery=recoveryTraining(liveSide);
  const timeLeft=M.len-M.t;
  const trainedFlyer=liveSide.style==='Spectacle'&&trainedRecovery>0;
  const longSpot=M.planId==='spots'&&M.len>=900&&trainedFlyer;
  // A real standing breather must be available *before* the winner is
  // exhausted, not merely boosted after the normal low-stamina offer.
  // The action still passes the original physical isValid and seeded pick.
  if(M.o.sheet?.finishRoute==='outlasted'&&M.outcome==='booked'&&
     ['win_clean','lose_clean'].includes(M.o.finish)&&M.len>=600&&
     M.t/M.len>=.22&&M.t/M.len<.94){
   const winner=M.o.finish==='win_clean'?'w':'f',
    loser=winner==='w'?'f':'w',otherSt=loser==='w'?M.wSt:M.fSt;
   const rests=g.events.filter(e=>e.preControl===winner&&
    (e.id==='catch_breath'||A[e.id]?.family==='rest'&&costOf(e.id)<0));
   if(p.control===winner&&p.position==='standing'&&
      g.physical?.area==='ring'&&!g.physical?.grip&&
      stamina<80&&stamina-otherSt<27&&rests.length<6&&
      !rests.some(e=>M.t-e.t<95)&&
      !g.pendingAerial&&!g.pendingGrapple&&!g.pendingStrike&&!g.pendingContact)
    selected.push(['catch_breath',9]);
  }
  const brawlTraining=brawlConditioning(liveSide);
  const longBrawl=M.planId==='brawl'&&M.len>=900&&
   liveSide.style==='Brawl'&&brawlTraining>=.25;
  const closingFlight=longSpot&&timeLeft>=30&&timeLeft<=210&&
   ['resurgence','exchange','nearfall','escalation','dive_sequence',
    'finish_setup','false_finish','fighting_spirit'].includes(g.arc);
  // One spectacular landing should NOT end an elite flyer's late-match
  // repertoire. Recognise up to TWO DIFFERENT named risky landings, while
  // lowering the drive after the first. Failed, countered or opponent-owned
  // attempts cannot satisfy either step.
  const landedLateRisk=(e,side)=>{
   const action=A[e.id];
   return !!action&&e.preControl===side&&e.t>=M.len-180&&
    !action.reverse&&!action.counterOf&&!action.blockOf&&
    action.risk&&['aerial','springboard','dive','lucha','superplex'].includes(action.family)&&
    (!e.aerialResolution||e.aerialResolution==='landed')&&
    (!e.grappleResolution||e.grappleResolution==='landed')&&
    (!e.strikeResolution||e.strikeResolution==='landed')&&
    (!e.contactResolution||e.contactResolution==='landed');
  };
  const riskCount=side=>new Set(g.events.filter(e=>landedLateRisk(e,side))
   .map(e=>e.id)).size;
  const lateFlyerRun=closingFlight&&
   (trainedRecovery>=.70||(trainedRecovery>=.30&&
    liveSide.ring>=70&&liveSide.safe>=65));
  const lateCount=riskCount(p.control);
  const needsLatePayoff=lateFlyerRun&&lateCount<2;
  const lateUrgency=lateCount===0?1:lateCount===1?.32:0;
  if(p.position==='standing'&&M.t/M.len>.12){
   for(const id of prof.preferred)if(A[id])selected.push([id,1.4]);
   // Actual narrated recovery before a long match's final aerial run.
   // A per-wrestler cooldown prevents endless breathing/pose loops.
   const restedRecently=g.events.slice(-20).some(e=>e.id==='catch_breath'&&
    e.preControl===p.control&&M.t-e.t<40);
   if(longSpot&&timeLeft>35&&!restedRecently&&stamina<66){
    const urgency=stamina<35?24:stamina<45?18:stamina<56?13:8;
    const longBonus=longSpot&&M.t/M.len>.5?1+trainedRecovery*.65:1;
    // Begin the visible pacing work several minutes BEFORE the closing
    // stretch. At -180 seconds elite workers were down to ~29 stamina, so
    // a last-minute climb boost was mechanically useless. A genuinely
    // trained flyer may choose several spaced, narrated breathers here.
    // Each still consumes a real action and respects the 40-second cooldown.
    const runway=trainedRecovery>=.70&&timeLeft>180&&
     timeLeft<=(trainedRecovery>=.95?540:480)&&
     stamina<60?3.2:1;
    selected.push(['catch_breath',urgency*longBonus*runway]);
   }else if(!longSpot&&M.planId==='spots'&&stamina<60)
    selected.push(['catch_breath',stamina<40?20:stamina<52?12:6]);
   else if(longBrawl&&timeLeft>180&&timeLeft<=600&&stamina<67&&
      !g.events.slice(-20).some(e=>e.id==='catch_breath'&&
       e.preControl===p.control&&M.t-e.t<70))
    // A paced fight still has real exchanges between recoveries.
    selected.push(['catch_breath',(stamina<35?20:stamina<48?14:8)*(1+brawlTraining)]);
   else if(M.planId!=='spots'&&stamina<48)selected.push(['catch_breath',5]);
  }
  // Trained Technical wrestlers must actively pace a long contest.
  // An actual in-ring, narrated breather earns normal recovery in the
  // pre-finish runway. No bonus stamina, artificial stars or skipped move
  // costs: the performer voluntarily spends a real graph action resting.
  // Never interrupt an owned/contested grip or turn rest into a spam loop.
  if(M.planId==='technical'&&M.len>=900&&
     liveSide.style==='Technical'&&liveSide.ring>=68&&liveSide.safe>=60&&
     timeLeft>180&&timeLeft<=540&&p.position==='standing'&&p.down===null&&
     g.physical?.area==='ring'&&!g.physical?.grip){
   const skill=Math.max(0,Math.min(1,
    (liveSide.ring+liveSide.safe+liveSide.psych-180)/85));
   const breaths=g.events.filter(e=>e.id==='catch_breath'&&
    e.preControl===p.control&&e.t>=M.len-540&&e.t<=M.t);
   const cap=skill>=.85?3:2;
   const target=skill>=.85?62:56;
   if(stamina<target&&breaths.length<cap&&
      !breaths.some(e=>M.t-e.t<95)){
    // Resting is an explicit choice, not passive recovery. The much
    // expanded match pool previously buried it even while exhausted;
    // these weights apply only before the closing stretch and are
    // bounded by the per-wrestler 2/3 breath and cooldown guards above.
    const urgency=stamina<35?220:stamina<45?190:155;
    selected.push(['catch_breath',urgency*(.85+.45*skill)]);
   }
  }
  // In the pre-finish runway, a trained flyer holding an opponent on the
  // canvas can earn recovery by actually applying an authored rest hold.
  // No free stamina, detached mat holds or reset to a standing position.
  const lastRest=g.events.slice(-20).some(e=>e.preControl===p.control&&
   (e.id==='catch_breath'||A[e.id]?.family==='rest')&&M.t-e.t<50);
  if(longSpot&&trainedRecovery>=.70&&timeLeft>180&&
     timeLeft<=(trainedRecovery>=.95?540:480)&&
     stamina<60&&p.position==='mat'&&p.down!==(p.control)&&!lastRest)
   for(const id of CAT.members.rest||[])
    if(A[id]?.requires==='mat'&&!A[id].reverse&&!A[id].counterOf&&!A[id].blockOf)
     selected.push([id,4.5]);
  // On a fast layout, a trained flyer needs real take-off opportunities
  // beyond the opening exchange. These are existing authored setup actions,
  // only offered from the ring with sufficient stamina. Their ensuing
  // attacks remain governed by the normal top-rope physical and risk gates.
  if(M.planId==='spots'&&p.position==='standing'&&
     stamina>=(closingFlight&&trainedRecovery>=.70?31:closingFlight?37:42)&&
     (liveSide.style==='Spectacle'||((liveSide.ring||0)>=78&&(liveSide.safe||0)>=65))&&
     (['shine','resurgence','exchange','nearfall','escalation','dive_sequence',
       'finish_setup'].includes(g.arc)||
      (closingFlight&&['false_finish','fighting_spirit'].includes(g.arc)))){
   // The wrestler still climbs or springs into an actual committed landing,
   // with the existing physical, stamina, timing and counter checks intact.
   const focus=closingFlight?(1.4+trainedRecovery*.55):1;
   const missingPayoff=needsLatePayoff?1+1.8*lateUrgency:1;
   selected.push(['top_climb',4.2*focus*missingPayoff],
    ['springboard_rise',3.5*focus*missingPayoff]);
  }
  // A flyer on the mat must visibly stand up before mounting another
  // aerial attack. A reset remains a real, timed, position-valid graph move.
  if(needsLatePayoff&&p.position==='mat'&&p.down!==p.control)
   selected.push(['stand_reset',6]);
  // Skilled Brawl performers (>=.30) earn named late move variety.
  // Cost-aware selection replaces the flat 26-stamina exclusion, while
  // isValid retains the actual positioning, lift, grip and expense gates.
  const brawlLate=longBrawl&&brawlTraining>=.30&&timeLeft>=30&&timeLeft<=180;
  const usedLate=id=>g.events.some(e=>e.id===id&&
   e.preControl===p.control&&e.t>=M.len-180);
  const brawlImpact=id=>{
   const move=A[id];
   if(!move||move.reverse||move.counterOf||move.blockOf||
      !['strike','running','power','outside','corner','rope'].includes(move.family)||
      (move.requires!==p.position&&move.requires!=='any')||
      costOf(id)<0||stamina<Math.max(10,9+costOf(id)*3))return false;
   // Holds and body-clinch setups are not *impact* payoffs.
   if(move.family==='power'&&move.zone!=='mat')return false;
   // A running attack needs an actual rope/rebound setup.
   if(move.family==='running'&&
      !(sameController&&CAT.F.running.from.includes(g.node)))return false;
   return true;
  };
  if(brawlLate){
   const emphasis=2.6*(.62+.38*brawlTraining);
   for(const family of ['strike','running','power','outside','corner','rope'])
    for(const id of CAT.members[family]||[]){
     if(brawlImpact(id)&&!usedLate(id))selected.push([id,emphasis]);
    }
   // Completed standing strikes can earn a rope-run in their ORIGINAL beat
   // without competing for this tick's attack selection (see maybeBrawlComboRun).
  }
  // v3.3: the arc invites its move families; the physical guards still decide what is legal.
  for(const fam of ARC_FAMILIES[g.arc]||[])for(const id of CAT.members[fam]||[]){
   const mv=A[id];if(mv.requires!==p.position&&mv.requires!=='any')continue;
   selected.push([id,.46]);if(A[id+'_rev'])selected.push([id+'_rev',.16]);if(A[id+'_blk'])selected.push([id+'_blk',.1]);
  }
  // Positional hubs: corner work needs a whip into the buckles, a superplex needs a climb.
  const famList=ARC_FAMILIES[g.arc]||[];
  if(p.position==='standing'){
   if(famList.includes('corner'))selected.push(['corner_whip',1.1],['corner_push',.5]);
   if(famList.includes('chain'))selected.push(['headlock',1.5],['wristlock',1.7],['lockup',.4]);
   if(famList.includes('superplex'))selected.push(['corner_whip',affordableSuperplex(M,true)?5.5:.7]);
  }
  if(p.position==='corner'&&famList.includes('superplex')&&affordableSuperplex(M))
   selected.push(['top_follow',13]);
  // Phase 2: a named grappling attempt should be a plausible payoff for the
  // *actual* grip the controller just established, not a random catalogue
  // entry with no setup. Preserve isValid, weight, stamina and clock gates.
  const grip=g.physical?.grip;
  const controlledGrip=grip&&grip.side===p.control&&M.t-grip.at<=20&&
    p.position==='standing'&&g.physical.area==='ring';
  if(controlledGrip){
   // A spot-fest can also produce an earned *high-impact* lifted sequence.
   // Reduce its grip follow-through weight relative to a technical match
   // so it never drowns out the established aerial/spectacle emphasis.
   // Candidate pool only: no graph edges invented and no forced execution.
   // Boost different legal throws for each control; prefer repertoire/style
   // through the existing scoring multipliers below.
   for(const id of GRAPPLE_PILOT){
    if(PHYSICAL_GRIP_MOVES[id]===grip.type&&A[id]?.requires==='standing')
     // Securing a difficult grip should lead to a plausible attack before
     // the hold expires; still never bypass move legality, stamina or styles.
     selected.push([id,M.planId==='spots'?2.2:4.4]);
   }
  }else if(p.position==='standing'&&
     (famList.includes('suplex')||famList.includes('power')||
      famList.includes('neck')||famList.includes('chain'))&&
     (M.planId!=='spots'||(M.t/M.len>=.5&&M.t/M.len<=.86&&
       stamina>=45&&['Brawl','Technical','Story'].includes(liveSide.style)))){
   // The next beat acquires a real grip, then the wrestler has a chance to
   // use it. This is not a free-standing throw or synthetic grip assignment.
   if(M.planId==='spots'){
    // A lift/neck sequence in the last half of an otherwise spot-heavy
    // match still needs a visible real front facelock before an impact.
    // The ordinary move validity/weight/risk/stamina checks remain.
    selected.push(['front_facelock',3.5]);
   }else{
    selected.push(['front_facelock',4.2],['go_behind',2.8],
      ['waistlock',2.2],['lockup',2.5]);
    if(famList.includes('power'))selected.push(['pw_bearhug',1.6]);
   }
  }
  // Phase 3: a real grounded grip invites a legal submission. Keep the
  // parent-specific attempt/reversal rules and existing stamina gates.
  // Rest holds and wrist controls generate actual retained grip states.
  if(p.position==='mat'&&M.planId!=='spots'&&grip&&
     grip.side===p.control&&M.t-grip.at<=20){
   for(const id of CAT.members.submission){
    if(A[id]?.requires==='mat'&&PHYSICAL_GRIP_MOVES[id]===grip.type)
     // Control is a fleeting technical opportunity: a relevant hold should
     // compete meaningfully with arbitrary arc changes or another rest hold.
     // This raises only an eligible exact-grip option, never bypasses isValid.
     selected.push([id,7.0]);
   }
  }
  if(p.position==='mat'&&!g.physical?.grip&&
     (famList.includes('submission')||famList.includes('ground')||
      famList.includes('rest')))
   selected.push(['leg_wrench',2.2],['rs_wrist_mat',1.9],
     ['rs_hammerlock_mat',1.2],['rs_side_headlock',1.6],
     ['rs_mat_stretch',1.1]);
  if(p.position==='outside'){
   selected.push(['apron_stand',1.6],['ramp_approach',1.3],['floor_regroup',1.4]);
   // A Spectacle wrestler who has *actually* thrown an opponent outside
   // should consider the named ring-to-floor dives before both regroup.
   // The existing physical location/weight/stamina/clock gates remain
   // authoritative: an actor already on the floor cannot magically dive.
   const physical=g.physical,other=p.control==='w'?'f':'w';
   // Once apron_stand has genuinely established the apron position,
   // the existing apron offence (including the body slam) must compete
   // with a generic roll back into the ring. No apron move is offered
   // from a floor-only position, and weight/risk/phase gates stay intact.
   if(physical?.area==='apron'&&physical.locations?.[p.control]==='apron'){
    for(const id of APRON_OFFENCE)selected.push([id,4.8]);
   }
   if((M.planId==='spots'||liveSide.style==='Spectacle')&&
      physical?.locations?.[other]==='floor'){
    const launch=physical?.locations?.[p.control];
    // After apron_stand, the worker is on the apron, not in the ring:
    // only the two actual apron dives can be offered. Never offer a
    // ring-to-floor dive from the wrong launch location.
    if(launch==='ring'||launch==='apron')
     for(const id of CAT.members.dive||[])
      if(A[id]&&!A[id].counterOf&&!A[id].blockOf&&
         (launch==='apron')===APRON_DIVES.has(id))
       selected.push([id,launch==='apron'?5.5:2.4]);
   }
  }
  // A Spectacle wrestler who has reached the ropes should have an actual
  // named aerial/springboard available, not only the generic launch node.
  // isValid still rejects heavyweights, fatigue, early big spots and unsafe
  // manoeuvres; safe plans retain their normal risk discount below.
  if(p.position==='top'&&sameController&&
     (g.node==='top_climb'||g.node==='springboard_rise')&&
     (liveSide.style==='Spectacle'||M.planId==='spots')){
   const family=g.node==='springboard_rise'?'springboard':'aerial';
   for(const id of CAT.members[family]||[]){
    if(A[id]?.family===family&&!A[id].counterOf&&!A[id].blockOf)
     selected.push([id,liveSide.style==='Spectacle'?2.3:1.35]);
   }
  }
  // v3.5: an agents'-room sheet. The wrestler works towards the agreed move, or the setup it needs.
  const agreed=M.sheet?.v>=4&&root.OfficeRoom?root.OfficeRoom.wants(M,p.control==='f'?'f':'w',p.position)[0]:null;
  if(agreed)selected.push([agreed[0],1]);
  // v3.4: signature moves. A wrestler's trademark offence, wherever the position allows it.
  if(M.t/M.len>.1)for(const id of prof.signature||[])if(A[id])selected.push([id,.45]);
  // Offer a real in-ring hold as a paced breather when a trained long-
  // match worker already controls a grounded opponent. isValid still
  // checks ring position, control, physical setup and stamina.
  const canPaceRunway=M.len>=900&&timeLeft>180&&timeLeft<=660&&
   stamina<68&&((longBrawl&&brawlTraining>=.70)||
    (longSpot&&trainedRecovery>=.30&&trainedRecovery<.70&&
     liveSide.ring>=70&&liveSide.safe>=65))&&
   ['w','f'].includes(p.control)&&!g.pendingAerial&&!g.pendingGrapple&&
   !g.pendingStrike&&!g.pendingContact;
  if(canPaceRunway&&p.position==='mat'&&p.down!==p.control&&
     g.physical?.area==='ring')
   selected.push(['rs_side_headlock',3.5],['rs_front_chancery',2.4]);
  const weights=new Map();
  for(const [id,w] of selected) if((id!=='top_follow'||affordableSuperplex(M))&&
   !(needsLatePayoff&&trainedRecovery>=.95&&
      (id==='top_climb'||id==='springboard_rise')&&
     !affordableNamedFlight(M,id))&&isValid(M,id)) {
   let n=w;
   if(pattern.actions.includes(id))n*=1.6;
   n*=style.bias[id]||1;
   n*=prof.preferred.includes(id)?3.7:prof.signature?.includes(id)?1.7:.82;
   // A signature is a highlight: once it has landed twice, the wrestler moves on.
   if(prof.signature?.includes(id)&&g.events.filter(x=>x.id===id).length>=2)n*=.12;
   const energy=costOf(id);
   if(energy>=2&&stamina<45)n*=Math.max(.15,stamina/70);
   if(id==='catch_breath'){
    n*=stamina<22?5:stamina<35?2.4:1;
    if(longSpot&&M.t/M.len>.55&&timeLeft>35)
     n*=1+trainedRecovery*.55;
   }
   // Following an actual climb, prefer a fresh named high-risk landing
   // rather than an unrelated fallback. This changes selection odds only:
   // exact-parent, weight, stamina, counter and botch checks are unchanged.
   if(needsLatePayoff&&sameController&&p.position==='top'&&
      ['aerial','springboard'].includes(A[id].family)&&A[id].risk&&
      !A[id].reverse&&!A[id].counterOf&&!A[id].blockOf&&
      !g.events.some(e=>e.id===id&&e.preControl===p.control&&
       e.t>=M.len-180&&(!e.aerialResolution||e.aerialResolution==='landed')))
    n*=2.5;
   if(A[id].reverse){
    const defender=p.control==='f'?M.w:M.f;
    const difference=(defender.ring*.65+defender.psych*.35)-(liveSide.ring*.65+liveSide.psych*.35);
    const defenderStamina=p.control==='f'?M.wSt:M.fSt;
    n*=Math.max(.6,Math.min(1.4,1+difference/140))*Math.max(.4,Math.min(1.2,defenderStamina/70));
   }
   if(g.texture==='grudge'&&['cheap_shot','outside_toss','floor_brawl','counter_strike'].includes(id))n*=1.45;
   if(g.texture==='chess'&&['wristlock','grapple_trip','mat_takedown','mat_scramble','submission_set'].includes(id))n*=1.5;
   if(g.texture==='fight'&&['power_spinebuster','strike_trade','corner_strikes','outside_toss'].includes(id))n*=1.5;
   if(g.texture==='showcase'&&['springboard_rise','top_climb','aerial_attack','aerial_counter'].includes(id))n*=1.5;
   if(g.texture==='underdog'&&['hope_elbows','hope_cutoff','counter_strike','mat_scramble'].includes(id))n*=1.4;
   if(g.texture==='fast'&&['duck_rebound','counter_strike','springboard_rise','clothesline'].includes(id))n*=1.3;
   if(g.events.slice(-4).some(x=>x.id===id))n*=.25;
   // In a long bout, the same core action should not monopolise every
   // exchange after its third appearance. Keep authentic repeats possible,
   // but rotate towards other legal authored moves and named defences.
   // This is a weight, not a forced move, and does not weaken physical gates.
   // Technical Showcase must retain its sustained grappling continuity;
   // global anti-repetition tuning distorted the technical proficiency guard.
   if(M.planId!=='technical'){
    const priorUses=g.events.filter(e=>e.id===id).length;
    if(priorUses>=3)n*=.48;
    else if(priorUses===2)n*=.78;
   }
   // Repeated generic posing and finish threats drown out actual wrestling.
   // Keep legal alternatives available, but strongly disfavor a second copy
   // inside five simulated minutes. No forced arc or scripted result changes.
   if((id==='crowd_pose'||id==='finish_tease')&&
      g.events.some(x=>x.id===id&&M.t-x.t<300))n*=.12;
   // Generic top-rope beats have large legacy preference weights. When a
   // lightweight Spectacle worker has a legal named move available after
   // a committed climb, reduce the generic fallback (never prohibit it).
   // Safe plans still suppress high-risk named moves independently below.
   if(sameController&&p.position==='top'&&liveSide.style==='Spectacle'&&
      ((g.node==='top_climb'&&id==='aerial_attack')||
       (g.node==='springboard_rise'&&id==='springboard_strike'))){
    const family=g.node==='top_climb'?'aerial':'springboard';
    if((CAT.members[family]||[]).some(moveId=>
      A[moveId]?.family===family&&!A[moveId].counterOf&&!A[moveId].blockOf&&isValid(M,moveId)))
      n*=.42;
   }
   // Phase 9: the same authored handoff is more likely when the performer
   // recognises it from their training. Never alter physical availability,
   // agreed finishes, move validity or the opponent's side of a reversal.
   const chain=sameController&&CHAIN_BY_PAIR.get(g.node+'>'+id);
   if(chain&&!A[id].reverse){
    const school=root.OfficeTechniqueBackgrounds?.get?.(liveSide);
    const aptitudes=CHAIN_SCHOOL[chain.group]||[];
    const familiarity=Math.max(0,...aptitudes.map(tag=>school?.affinity?.[tag]||0));
    const styles={
     'Catch ties and throws':'Technical',
     'Arm control on the mat':'Technical',
     'Grounded leg and neck control':'Technical',
     'Short striking combinations':'Brawl',
     'Power wrestling and lifted finishes':'Brawl',
     'Lucha, counters and fast ropes':'Spectacle',
     'Corner sequences':'Brawl',
     'Ringside exchanges':'Brawl'
    };
    const performanceMatch=styles[chain.group]===liveSide.style;
    // Stronger (but bounded) follow-through preference competes with
    // generic arc hubs. Consecutive legal same-wrestler beats gain slightly
    // more momentum, without creating an uninterruptible scripted chain.
    n*=(1+Math.min(.42,.30*familiarity+(performanceMatch?.12:0)))*
       (2.6+(inSequence?.55:0));
   }
   // Phase 4: individual technical schooling (NOT match style or career drills).
   // A move-specific counter belongs to the defending wrestler who performs it.
   // The background layer only affects already-reviewed live Phase 3 moves.
   if(TRAINED_TECHNIQUE_IDS.has(id)&&root.OfficeTechniqueBackgrounds&&root.OfficeTechniqueRegistry){
    const performer=A[id].reverse?(p.control==='f'?M.w:M.f):liveSide;
    n*=root.OfficeTechniqueBackgrounds.multiplier(performer,id,Graph,root.OfficeTechniqueRegistry);
   }
    const nd=A[id];
    if(nd.family){
     // Limb work follows the body part this wrestler is working, as in a real heat segment.
     const victimSide=p.control==='f'?'w':'f',want=PART_OF[g.targets?.[victimSide]]||null;
     const heat=!!ARCS[g.arc]?.focus;
     if(nd.part&&want)n*=nd.part===want?(heat?3:1.7):(heat?.35:.8);
     if(nd.styles)n*=nd.styles.includes(liveSide.style)?1.45:.78;
     if(nd.agile){const kg=fighter(liveSide).kg;n*=kg>=95?.3:kg>=85?.7:1.15;}
     if(nd.risk){n*=M.planId==='safe'?.1:M.planId==='spots'?1.8:1;if((liveSide.safe??70)<55)n*=.7;}
     if(nd.blockLift!==null&&nd.blockOf){
      const defender=p.control==='f'?M.w:M.f,gap=fighter(defender).kg-fighter(liveSide).kg;
      n*=Math.max(.45,Math.min(2.6,1+gap/45));
     }
     if(nd.nearfall)n*=g.arc==='nearfall'||g.arc==='false_finish'?1.2:.5;
     if(g.events.slice(-12).some(x=>x.id===id))n*=.35;
    }
   if(['submission_set','target_hold','target_strike'].includes(id)&&['control','denial','cutoff'].includes(g.arc))n*=2.5;
   if(['top_climb','aerial_attack','outside_toss'].includes(id)&&M.planId==='spots')n*=2;
   if(['counter_strike','wrist_escape','waist_escape','mat_scramble'].includes(id)&&M.planId==='technical')n*=1.8;
   if(['outside_toss','floor_brawl','cheap_shot'].includes(id)&&M.planId==='brawl')n*=1.8;
   if(['cover','submission_set'].includes(id)&&g.arc==='nearfall')n*=2;
   if((id==='top_climb'||id==='springboard_rise')&&(p.control==='f'?M.fSt:M.wSt)<30)n*=.22;
   if($d.Psy.get(M).focusHits>=3&&$d.Psy.get(M).target==='left knee'&&$d.Psy.get(M).control==='w'&&['rope_run','top_climb','clothesline'].includes(id))n*=.35;
   // The pool is ten times larger than in v3.2, so an agreed beat needs a proportionally firmer push.
   if(M.o.sheet?.v>=4&&root.OfficeRoom)n*=root.OfficeRoom.bias(M,id);
   if(A[id].reverse&&M.sheet?.v>=4&&root.OfficeRoom)n*=root.OfficeRoom.feed(M,p.control==='f'?'f':'w');
   if(root.OfficeSheets?.boost){const sb=root.OfficeSheets.boost(M,id,p.control==='f'?'f':'w');n*=sb>1?sb*SHEET_PULL:sb;}
   n*=root.OfficeSheets?.DIRECTOR?.bias(M,id,p.control==='f'?'f':'w')||1;
   // A queued ringside highlight favours already-legal authored attacks,
   // not a new move, synthetic setup or forced landing. Agreed calls still
   // receive their existing priority below.
   if(M.bigSpotRequest&&p.control==='w'&&$d.regularBigMoment(M,id))
    n*=10;
   // The public promo is a tactical declaration. Counter promises favour
   // genuine worker reversals of opponent control, not arbitrary bonuses.
   const publicTactic=activePromoTactic(M);
   if(publicTactic){
    if(publicTactic.kind==='clean'&&(['cheap_shot','outside_toss','floor_brawl'].includes(id)||A[id].family==='heel'||(A[id].family&&A[id].crowd<0&&!A[id].counterOf)))n*=.28;
    if(publicTactic.kind==='counter'&&publicTactic.nodes.includes(id))
     n*=p.control==='f'&&A[id].reverse&&M.t/M.len>.45?(M.f.psych>=82?1.45:2.5):1;
    if(publicTactic.kind==='finisher'&&id==='finish_tease')n*=M.f.psych>=78?.8:2.4;
    if(publicTactic.kind==='misdirect'&&publicTactic.nodes.includes(id))n*=1.65;
    if(publicTactic.kind==='win'&&publicTactic.nodes.includes(id)&&M.t/M.len>.58)n*=1.4;
   }
   // Only a soft selection bias; physics and booked finishes are unchanged.
   n*=sellingWeight(M,id,p.control);
   weights.set(id,(weights.get(id)||0)+n);
  }
  const pool=[...weights.entries()];
  // A genuinely countered hope spot should have a realistic possibility
  // of a performed follow-through, not only a commentary declaration.
  // Promote the two existing authored links from counter_strike, leaving
  // other legal moves live and normal defender outcomes unchanged.
  if(readyStoryHope(M)){
   const links=new Set(A[g.node].next.map(([id])=>id));
   const moves=pool.filter(([id])=>links.has(id)&&
    ['clothesline','snap_suplex'].includes(id));
   if(moves.length){
    const ids=new Set(moves.map(([id])=>id));
    const ours=moves.reduce((v,[,w])=>v+w,0);
    const others=pool.reduce((v,[id,w])=>v+(ids.has(id)?0:w),0);
    const trained=Math.max(0,Math.min(1,
     (M.w.ring+M.w.psych-135)/45));
    const goal=others*(.65+.25*trained);
    if(ours>0&&ours<goal){
     const boost=Math.min(7,goal/ours);
     for(const item of moves)item[1]*=boost;
    }
   }
  }
  // A held, physically legal grip is a fleeting technical opportunity.
  // Improve the CHOICE share, not the move's accuracy or defender's counter.
  if(readyTechnicalGrip(M)){
   const held=g.physical.grip,trained=Math.max(0,Math.min(1,
    (liveSide.ring+liveSide.safe+liveSide.psych-180)/85));
   const options=pool.filter(([id])=>GRAPPLE_PILOT.includes(id)&&
    PHYSICAL_GRIP_MOVES[id]===held.type&&A[id]?.requires===p.position);
   if(options.length){
    const ids=new Set(options.map(([id])=>id));
    const current=options.reduce((sum,[,w])=>sum+w,0);
    const rest=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
    const goal=rest*(.48+.28*trained);
    if(current>0&&current<goal){
     const scale=Math.min(6,goal/current);
     for(const item of options)item[1]*=scale;
    }
   }
   // Do not skip the real wrist/waist/limb-control steps on the way to
   // a throw. Source-authored matching-grip transitions remain a distinct
   // legal choice, allowing wristlock -> rolling control -> takedown.
   // Their moves still consume a full beat and can be interrupted.
   const actual=A[g.node],links=new Set((actual?.next||[]).map(([id])=>id));
   const connected=pool.filter(([id])=>links.has(id)&&
    id!==g.node&&!GRAPPLE_PILOT.includes(id)&&
    GRIP_ENTRY[id]===held.type&&!A[id]?.reverse&&
    A[id]?.requires===p.position);
   if(connected.length){
    const ids=new Set(connected.map(([id])=>id));
    const heldWeight=connected.reduce((sum,[,w])=>sum+w,0);
    const other=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
    const goal=other*(.38+.18*trained);
    if(heldWeight>0&&heldWeight<goal){
     const boost=Math.min(6,goal/heldWeight);
     for(const item of connected)item[1]*=boost;
    }
   }
  }
  // A real TWO-step authored Technical chain deserves a fair chance to
  // complete its legal third link. The former near-fall prep bias crowded
  // out competent wrestler wristlock -> rolling control -> throw sequences.
  // Only two actually performed, same-owned graph-linked actions can
  // qualify; the prospective third link must exist, be legal and match
  // a real authored technique. Its probability stays below certainty,
  // with normal physical, stamina and counter rules fully active.
  // Elite technicians already maintain their chains without this assistance.
  if(M.planId==='technical'&&M.len>=900&&sameController&&prior&&
      !!A[prior.id]?.next.some(([nextId])=>nextId===previous.id)&&
      liveSide.style==='Technical'&&liveSide.ring>=68&&liveSide.ring<85&&
      liveSide.safe>=60&&previous.preControl===p.control&&
      prior.preControl===p.control&&prior.control===p.control&&
      previous.t-prior.t<=20&&M.t-previous.t>=0&&M.t-previous.t<=20){
   const last=A[g.node];
   const authored=new Set((last?.next||[]).map(([id])=>id));
   const technicalFamilies=new Set(['chain','suplex','submission',
    'ground','neck','pin','rest']);
   const followups=pool.filter(([id])=>authored.has(id)&&
    CHAIN_BY_PAIR.has(g.node+'>'+id)&&A[id]&&
    !A[id].reverse&&!A[id].counterOf&&!A[id].blockOf&&
    technicalFamilies.has(A[id].family));
   if(followups.length){
    const ids=new Set(followups.map(([id])=>id));
    const owned=followups.reduce((total,[,weight])=>total+weight,0);
    const other=pool.reduce((total,[id,weight])=>
     total+(ids.has(id)?0:weight),0);
    const training=Math.min(1,(liveSide.ring-68)/17);
    const target=other*1.05;
    if(owned>0&&owned<target){
     const factor=Math.min(8,target/owned);
     for(const item of followups)item[1]*=factor;
    }
   }
  }
  // Restore a bounded, non-forced impact share after the broad action-pool
  // expansion. No reward for bearhugs/holds or an already landed named move.
  if(brawlLate){
   const fresh=pool.filter(([id])=>brawlImpact(id)&&!usedLate(id));
   if(fresh.length>=2){
    const freshIds=new Set(fresh.map(([id])=>id));
    const current=fresh.reduce((sum,[,weight])=>sum+weight,0);
    const others=pool.reduce((sum,[id,weight])=>
     sum+(freshIds.has(id)?0:weight),0);
    const goal=others*(.20+.11*brawlTraining);
    if(current>0&&current<goal){
     const scaling=Math.min(3,goal/current);
     for(const entry of fresh)entry[1]*=scaling;
    }
   }
  }
  // A narrated, owned rebound invites a small set of source-appropriate
  // named running attacks. These remain real contested choices, not a forced hit.
  if(brawlLate&&readyBrawlRebound(M)){
   const setup=g.events.at(-1),prior=g.events.at(-2);
   const linked=setup?.brawlComboSource&&prior?.id===setup.brawlComboSource&&
    prior.preControl===p.control&&prior.t===setup.t;
   const part=linked?A[prior.id]?.part:null;
   const authored=part==='ribs'?
    ['rn_spear','rn_knee','rn_cannonball_mid','rn_thesz']:
    part==='neck'?
    ['rn_lariat','rn_elbow','rn_bicycle_knee','rn_flying_shoulder']:
    ['rn_lariat','rn_crossbody','rn_dropkick','rn_elbow','rn_hip_attack'];
   const eligible=pool.filter(([id])=>A[id]?.family==='running'&&
    brawlImpact(id)&&!usedLate(id));
   const connected=linked?eligible.filter(([id])=>authored.includes(id)):[];
   const runs=connected.length>=2?connected:eligible;
   if(runs.length){
    const ids=new Set(runs.map(([id])=>id));
    const current=runs.reduce((sum,[,w])=>sum+w,0);
    const other=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
    // Competent brawlers have fewer safe named runners than elites.
    // Once they have paid for a REAL strike -> rope run, let that brief
    // opening compete strongly; no new setup or landing is invented.
    const competentLink=linked&&brawlTraining<.65;
    // A completed rebound is a fleeting, authored ATTACK setup, not
    // an invitation to drift into an unrelated hold. Trained competent
    // workers get a strong but non-mandatory (~75%) chance to attempt
    // one of the few physically legal payoff moves. A counter or block
    // is still decided normally by resolveStrike.
    const target=other*(competentLink?3.0:
      linked?.78+.14*brawlTraining:.64+.10*brawlTraining);
    if(current>0&&current<target){
     const scale=Math.min(competentLink?120:12,target/current);
     for(const item of runs)item[1]*=scale;
    }
   }
  }
  // The large modern graph would otherwise drown the one genuine rest.
  // This is only a probability share, before the last 180 seconds.
  if(longBrawl&&timeLeft>180&&timeLeft<=540&&stamina<62&&
     !g.events.slice(-20).some(e=>e.id==='catch_breath'&&
      e.preControl===p.control&&M.t-e.t<70)){
   const rest=pool.find(([id])=>id==='catch_breath');
   if(rest){
    const others=pool.reduce((sum,[id,w])=>sum+(id==='catch_breath'?0:w),0);
    rest[1]=Math.max(rest[1],others*(.12+.28*brawlTraining));
   }
  }
  // A trained flyer has to earn the closing comeback through a REAL
  // mat reversal and standing reset. No change to the physical descriptor
  // or controller happens until a legal action is selected and performed.
  const eliteLateCount=riskCount('w');
  // Skilled flyers can begin a genuine comeback before the last 180s.
  // Only the elite tier receives the extra 90-second runway; the normal
  // match-closing aerial-selection phase still starts at its old time.
  const eliteTraining=recoveryTraining(M.w);
  const eliteWorkerFlight=M.planId==='spots'&&M.len>=900&&
   M.w.style==='Spectacle'&&eliteTraining>=.70&&
   M.len-M.t>=40&&M.len-M.t<=(eliteTraining>=.95?270:180)&&
   eliteLateCount<2;
  // A drained worker can still execute a *legal low-cost reversal* to
  // regain control; the previous >=27 condition wrongly disabled even
  // those escapes. Actual isValid cost/position gates still filter each
  // candidate. Rope setup remains separately gated at >=31 stamina.
  if(eliteWorkerFlight&&M.wSt>=16){
   // First clean landing is the main objective; a second *distinct* one
   // remains plausible but gets less producer emphasis, never a guarantee.
   const strength=eliteLateCount===0?1:.35;
   const promote=(id,share)=>{
    const choice=pool.find(([move])=>move===id);
    if(!choice)return;
    const other=pool.reduce((sum,[move,weight])=>
     sum+(move===id?0:weight),0);
    choice[1]=Math.max(choice[1],other*share);
   };
   // An actual grounded opponent exchange must precede the defence.
   // mat_scramble flips control and leaves the opponent on the mat;
   // stand_reset later brings both to their feet.
   if(p.control==='f'&&p.position==='mat'&&p.down==='w'&&
      g.events.at(-1)?.control==='f'&&
      g.events.at(-1)?.position==='mat')
    promote('mat_scramble',.95*strength);
   // A recent ACTUAL standing strike offers a real counter-strike pathway,
   // even when the grounded-counter route is unavailable. No invented attack
   // or free controller switch: the authored defensive action must be chosen.
   const last=g.events.at(-1),lastAction=A[last?.id];
   if(p.control==='f'&&p.position==='standing'&&
      last?.preControl==='f'&&last.control==='f'&&M.t-last.t<=20&&
      (['strike','running','rope','corner','neck','power'].includes(lastAction?.family)||
       ['strike_trade','probe_strike','cheap_shot','clothesline',
        'counter_strike','finish_tease'].includes(last.id)))
    promote('counter_strike',.90*strength);
   if(p.control==='w'&&p.position==='mat'&&p.down==='f')
    promote('stand_reset',1.1*strength);
   // The worker must FIRST win control and get up. This does not make a
   // top-rope move valid or successful; it only weights legal setups.
   if(p.control==='w'&&p.position==='standing'&&M.wSt>=31&&
      M.len-M.t<=210){
    const eligible=pool.filter(([id])=>
     id==='top_climb'||id==='springboard_rise');
    const rest=pool.reduce((sum,[id,weight])=>
     sum+((id==='top_climb'||id==='springboard_rise')?0:weight),0);
    if(eligible.length){
     const total=eligible.reduce((sum,[,weight])=>sum+weight,0);
     for(const candidate of eligible)
      candidate[1]=Math.max(candidate[1],rest*.78*strength*candidate[1]/total);
    }
   }
  }
  // When the late-match runway approaches, a genuinely fatigued elite
  // flyer under an ACTUAL opponent hold or strike can work a counter to
  // recover control. This is a real authored reversal with normal selection
  // odds and a follow-up rest/stand opportunity — never a controller switch
  // granted by the booking plan or a silent stamina refill.
  const runwayEscape=M.planId==='spots'&&M.len>=900&&
   M.w.style==='Spectacle'&&recoveryTraining(M.w)>=.95&&
   M.len-M.t>180&&M.len-M.t<=420&&M.wSt>=16&&M.wSt<48;
  if(runwayEscape&&p.control==='f'){
   const last=g.events.at(-1),attack=A[last?.id];
   const isRecent=last?.preControl==='f'&&last.control==='f'&&
    M.t-last.t>=0&&M.t-last.t<=20;
   const counter=(id,share)=>{
    const candidate=pool.find(([move])=>move===id);
    if(!candidate)return;
    const other=pool.reduce((sum,[move,w])=>sum+(move===id?0:w),0);
    candidate[1]=Math.max(candidate[1],other*share);
   };
   if(isRecent&&p.position==='mat'&&p.down==='w'&&
      last.position==='mat')counter('mat_scramble',.84);
   if(isRecent&&p.position==='standing'&&
      (['strike','running','rope','corner'].includes(attack?.family)||
       ['strike_trade','probe_strike','cheap_shot',
        'clothesline','finish_tease'].includes(last.id)))
    counter('counter_strike',.68);
  }
  // Once a REAL top-rope setup has been completed, an elite flyer should
  // more often follow through with a legal named risk instead of changing
  // direction. The probability is bounded, not guaranteed; exact-parent
  // commitment, counters, botches, clock and stamina all still apply.
  // After the first DISTINCT success the bias drops, and after two it ends.
  if(needsLatePayoff&&trainedRecovery>=.95&&sameController&&
     p.position==='top'&&
     (g.node==='top_climb'||g.node==='springboard_rise')){
   const family=g.node==='top_climb'?'aerial':'springboard';
   const named=pool.filter(([id])=>A[id]?.family===family&&A[id].risk&&
    !A[id].reverse&&!A[id].counterOf&&!A[id].blockOf);
   const namedWeight=named.reduce((sum,[,weight])=>sum+weight,0);
   if(namedWeight>0){
    const otherWeight=pool.reduce((sum,[id,weight])=>
     sum+(A[id]?.family===family&&A[id].risk&&
      !A[id].reverse&&!A[id].counterOf&&!A[id].blockOf?0:weight),0);
    const ratio=lateCount===0?3:1.2;
    for(const choice of named)
     choice[1]=Math.max(choice[1],otherWeight*ratio*choice[1]/namedWeight);
   }
  }
  // A fatigued trained flyer unable to afford an actual named high spot
  // still has a *real*, narrated standing recovery choice. Reserve its
  // selection weight only while enough time remains to breathe, climb,
  // commit and resolve the separate attempt. No free stamina or hits.
  if(needsLatePayoff&&trainedRecovery>=.95&&
     p.control==='w'&&p.position==='standing'&&
     timeLeft>=65&&timeLeft<=180&&stamina<42&&
     !affordableNamedFlight(M,'top_climb')&&
     !affordableNamedFlight(M,'springboard_rise')&&
     !g.events.slice(-20).some(e=>e.id==='catch_breath'&&
       e.preControl==='w'&&M.t-e.t<40)){
   const recovering=pool.find(([id])=>id==='catch_breath');
   if(recovering){
    const competing=pool.reduce((sum,[id,weight])=>
     sum+(id==='catch_breath'?0:weight),0);
    recovering[1]=Math.max(recovering[1],competing*.95);
   }
  }
  // In the expanded repertoire a single recovery candidate gets lost
  // among hundreds of legal moves. Reserve a bounded SHARE of the actual
  // choice probability for a tired, trained flyer BEFORE the final run.
  // The seeded selection still decides: there is no forced move or refill.
  if(longSpot&&trainedRecovery>=.70&&timeLeft>180&&
     timeLeft<=(trainedRecovery>=.95?540:480)&&
     p.position==='standing'&&stamina<60&&
     !g.events.slice(-20).some(e=>e.id==='catch_breath'&&
      e.preControl===p.control&&M.t-e.t<40)){
   const recovering=pool.find(([id])=>id==='catch_breath');
   if(recovering){
    const competing=pool.reduce((sum,[id,n])=>
     sum+(id==='catch_breath'?0:n),0);
    recovering[1]=Math.max(recovering[1],competing*.72);
   }
  }
  // The broad move catalogue otherwise buries real recoveries. Reserve
  // a bounded CHANCE, never a forced selection, for an owned, physically
  // legal, narrated rest in the runway. Three rests maximum and an
  // 100-second cooldown ensure that offence still fills the match.
  // This only biases existing pool actions: it cannot refill stamina,
  // fabricate offence, waive counters or alter the closing three minutes.
  if(canPaceRunway&&
     (p.position==='standing'||p.position==='mat'&&p.down!==p.control&&g.physical?.area==='ring')){
   const priorRests=g.events.filter(e=>e.preControl===p.control&&
    (e.id==='catch_breath'||A[e.id]?.family==='rest')&&
    e.t>=M.len-660&&e.t<=M.t);
   if(priorRests.length<3&&
      !priorRests.some(e=>M.t-e.t<100)){
    const realRest=pool.filter(([id])=>id==='catch_breath'||
     p.position==='mat'&&A[id]?.family==='rest'&&A[id]?.cost<0);
    if(realRest.length){
     const ids=new Set(realRest.map(([id])=>id));
     const offered=realRest.reduce((n,[,w])=>n+w,0);
     const competing=pool.reduce((n,[id,w])=>n+(ids.has(id)?0:w),0);
     const share=longBrawl?.82+.32*brawlTraining:.50+.46*trainedRecovery;
     if(offered>0&&offered<competing*share){
      const factor=competing*share/offered;
      for(const r of realRest)r[1]*=factor;
     }
    }
   }
  }
  // Competent, fatigued fliers must still perform *real* named wrestling
  // if another aerial commitment is not affordable. Only existing,
  // physically legal low-cost actions are considered; the action pool
  // and genuine counter/botch rules still decide. Never script a hit.
  // The elite aerial pay-off path remains completely separate.
  if(M.planId==='spots'&&M.len>=900&&
     liveSide.style==='Spectacle'&&
     trainedRecovery>=.30&&trainedRecovery<.70&&
     liveSide.ring>=70&&liveSide.safe>=65&&
     timeLeft>=30&&timeLeft<=180&&
     ['w','f'].includes(p.control)&&
     p.position==='standing'&&stamina>=18&&stamina<37){
   const fresh=pool.filter(([id])=>{
    const node=A[id];
    return node&&!node.risk&&!node.reverse&&!node.counterOf&&!node.blockOf&&
     ['lucha','strike','neck'].includes(node.family)&&
     costOf(id)<=2.2&&costOf(id)>=0&&
     !g.events.some(e=>e.id===id&&e.preControl===p.control&&
      e.t>=M.len-180);
   });
   if(fresh.length){
    const ids=new Set(fresh.map(([id])=>id));
    const present=fresh.reduce((sum,[,w])=>sum+w,0);
    const competing=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
    const desired=competing*.65;
    if(present>0&&present<desired){
     const factor=desired/present;
     for(const entry of fresh)entry[1]*=factor;
    }
   }
  }
  // An Outlasted story needs one wrestler to work harder while the
  // eventual winner manages exertion. Offer only existing, fully legal
  // in-ring actions; move costs, counters, the opponent's stamina and
  // real match timing remain authoritative.
  if(M.o.sheet?.finishRoute==='outlasted'&&M.outcome==='booked'&&
     ['win_clean','lose_clean'].includes(M.o.finish)&&M.len>=600&&
     M.t/M.len>=.22&&M.t/M.len<.94){
   const winner=M.o.finish==='win_clean'?'w':'f',
    loser=winner==='w'?'f':'w',
    winSt=winner==='w'?M.wSt:M.fSt,
    loseSt=loser==='w'?M.wSt:M.fSt,
    lead=winSt-loseSt;
   if(p.control===winner&&winSt<80&&lead<27&&
      !g.pendingAerial&&!g.pendingGrapple&&!g.pendingStrike&&!g.pendingContact){
    const rests=g.events.filter(e=>e.preControl===winner&&
     (e.id==='catch_breath'||A[e.id]?.family==='rest'&&costOf(e.id)<0));
    // Six real rest actions at most, with 95 seconds between them.
    // This reserves only a CHANCE, never a compulsory action.
    if(rests.length<6&&!rests.some(e=>M.t-e.t<95)){
     const options=pool.filter(([id])=>id==='catch_breath'||
      A[id]?.family==='rest'&&costOf(id)<0);
     if(options.length){
      const ids=new Set(options.map(([id])=>id));
      const competing=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
      const already=options.reduce((sum,[,w])=>sum+w,0);
      const share=lead<15?1.5:.85;
      if(already>0&&competing>0&&already<competing*share){
       const factor=competing*share/already;
       for(const e of options)e[1]*=factor;
      }
     }
    }
   }
   // In between actual rests, favour sound, economical *wrestling*
   // instead of an all-out attack every exchange. Only already-valid
   // offensive graph actions with real positive costs can benefit. The
   // worker can still choose every other legal move, and neither receives
   // hidden recovery or bonus quality.
   if(p.control===winner&&winSt<80&&lead<23&&M.t/M.len<.87){
    const economical=pool.filter(([id])=>{
     const n=A[id],cost=costOf(id);
     return n&&n.family&&n.family!=='rest'&&cost>0&&cost<=1.7&&
      !n.reverse&&!n.counterOf&&!n.blockOf&&!n.nearfall&&!n.risk;
    });
    if(economical.length){
     const ids=new Set(economical.map(([id])=>id));
     const other=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
     const weight=economical.reduce((sum,[,w])=>sum+w,0);
     const share=.95;
     if(weight>0&&other>0&&weight<other*share){
      const factor=other*share/weight;
      for(const e of economical)e[1]*=factor;
     }
    }
   }
   // The wrestler who will lose tries to do more real, draining work,
   // but can still rest or choose any ordinary move. The pressure stops
   // once they are exhausted; we do not secretly deduct stamina.
   if(p.control===loser&&loseSt>=27&&lead<18&&M.t/M.len<.84){
    const demanding=pool.filter(([id])=>{
     const n=A[id],cost=costOf(id);
     return n&&cost>=2.5&&!n.reverse&&!n.counterOf&&!n.blockOf&&
      !n.nearfall&&n.family!=='rest'&&
      (M.planId!=='safe'||!n.risk);
    });
    if(demanding.length){
     const ids=new Set(demanding.map(([id])=>id));
     const competing=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
     const weight=demanding.reduce((sum,[,w])=>sum+w,0);
     const share=M.planId==='safe'?.38:1.1;
     if(weight>0&&competing>0&&weight<competing*share){
      const factor=competing*share/weight;
      for(const e of demanding)e[1]*=factor;
     }
    }
   }
  }
  // One verified source-authored mat continuation can otherwise disappear
  // inside the broad action pool after a scheduled cover's stand_reset.
  // Give legal options a bounded, non-forced chance; opponent reversals,
  // standing-up and all other valid choices remain available.
  if(postCoverOffers.length){
   const ids=new Set(postCoverOffers.map(([id])=>id));
   const targets=pool.filter(([id])=>ids.has(id));
   if(targets.length){
    const owned=targets.reduce((sum,[,w])=>sum+w,0),
     other=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
    if(owned>0&&other>0&&owned<other*.38){
     const factor=Math.min(6,other*.38/owned);
     for(const option of targets)option[1]*=factor;
    }
   }
  }
  // Phase 9C: large pooled repertoires diluted tiny closing guidance.
  // After REAL recent pressure/counter/setup, provide legal continuations
  // a bounded relative choice share. This never forces a successful move,
  // changes its physics, alters safety, or bypasses a later agreed call.
  const closing=closingOffers(M,p.control);
  if(closing.length){
   const ids=new Set(closing.map(([id])=>id));
   const targets=pool.filter(([id])=>ids.has(id));
   if(targets.length){
    const weight=targets.reduce((sum,[,w])=>sum+w,0),
     other=pool.reduce((sum,[id,w])=>sum+(ids.has(id)?0:w),0);
    const desired=ids.has('counter_strike')?.45:
     (ids.has('rope_run')||ids.has('front_facelock'))?.65:.85;
    if(weight>0&&other>0&&weight<other*desired){
     // A completed, real authored setup gets a stronger OPTIONAL payoff
     // choice than an exploratory setup or defensive counter. The previous
     // 8x cap still drowned legal impacts in a very broad move pool.
     const authoredImpact=closing.some(([id])=>A[id]?.zone==='mat'&&
      A[id]?.down==='d');
     const scale=Math.min(authoredImpact?32:8,other*desired/weight);
     for(const item of targets)item[1]*=scale;
    }
   }
  }
  // An agreed beat is not one option among fifty. If it is legal right now, the wrestler takes it
  // with odds set by how willing they are, whatever their habits would otherwise suggest.
  if(agreed){
   const i=pool.findIndex(x=>x[0]===agreed[0]);
   if(i>=0){
    const rest=pool.reduce((total,x,j)=>j===i?total:total+x[1],0);
    const notePenalty=Math.min(1,root.OfficeRoom.bias(M,agreed[0]));
    pool[i][1]=Math.max(pool[i][1],rest*agreed[1]*notePenalty);
   }
  }
  // An available conditional setup competes with ordinary validated
  // moves. A stronger continuation preference follows a real landing;
  // no forced transition, RNG override or bypass of the pool filters.
  if(negotiated){
   const target=pool.find(([id])=>id===negotiated.id);
   if(target&&target[1]>0){
    const rest=pool.reduce((sum,[id,w])=>sum+(id===negotiated.id?0:w),0);
    const desired=negotiated.ratio??(negotiated.continuation?2.5:.85);
    target[1]=Math.max(target[1],rest*desired);
   }
  }
  return pool;
 }
 function recover(M){
  const p=$d.Psy.get(M),g=get(M);
  if(p.position==='outside'){apply(M,'roll_inside');return}
  if(p.position==='corner'){apply(M,'corner_break');return}
  if(p.position==='top'){
   if((p.control==='f'?M.fSt:M.wSt)<29){
    $d.say(M,'The wrestler on the ropes checks their balance and safely steps down.','play');
    p.position='standing';p.down=null;resetPhysical(M);g.node=null;return;
   }
   apply(M,'aerial_attack');return;
  }
  if(p.position==='mat'){
   apply(M,'stand_reset');return;
  }
  // Explicit reset is an event, not an invisible teleport.
  if(p.control!=='neutral')$d.say(M,$d.fill(M,'{W} and {F} disengage and return to the middle of the ring.'));
  p.control='neutral';p.position='standing';p.down=null;g.node=null;apply(M,'circle');
 }
 function step(M){
  const g=get(M),p=$d.Psy.get(M);
  // The named move is already committed. Another caller must not overwrite
  // it with an unrelated selection before the next tick resolves it.
  if(g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact)return;
  if(p.position==='outside'&&g.floorTicks>=4){apply(M,'roll_inside');g.floorTicks=0;return;}
  if(p.control==='neutral'){
   const advantage=(M.w.ring-M.f.ring)+(M.wSt-M.fSt)*.3;
   const base=Math.max(.3,Math.min(.7,.5+advantage/250));
   const actor=structureActor(M);
   // A signed objective may favour initial initiative, not guarantee it.
   const chance=actor==='w'?Math.min(.85,base+.22):actor==='f'?Math.max(.15,base-.22):base;
   p.control=M.r()<chance?'w':'f';p.changes++;
  }
  const candidates=validPool(M),id=pick(M,candidates);
  if(id){
   // A full named attempt starts only when there is another tick to resolve it.
   // The very final tick retains the pre-existing immediate-landing fallback.
   if(isAerialParent(id)){
    if(startAerial(M,id))return;
    // A floor dive cannot become an uncommitted landing on the final tick.
    if(DIVE_PILOT.includes(id)){recover(M);return;}
   }
   if(isGrappleParent(id)&&startGrapple(M,id))return;
   if(isContactParent(id)){
    // Pins, mat attacks and environmental exchanges resolve in the same beat.
    // The named parent or its exact defence receives the sole landed event;
    // we do not create an artificial ten-second pause or new match clock.
    if(startContact(M,id))resolveContact(M);
    return;
   }
   if(STRIKE_PILOT.includes(id)&&startStrike(M,id)){
    // The actual strike is committed and resolved before a visible run
    // can be chosen. Countered/blocked strikes create no offensive setup.
    const side=p.control;
    resolveStrike(M,true);
    const attempt=g.strikeAttempts.at(-1);
    if(attempt?.id===id&&attempt.side===side&&attempt.outcome==='landed')
     maybeBrawlComboRun(M,side,id);
    return;
   }
   const side=p.control;
   apply(M,id);
   if(['stiff_forearm','body_shot','strike_trade'].includes(id))
    maybeBrawlComboRun(M,side,id);
   return;
  }
  recover(M);
 }
 // A genuinely performed, landed ring knockdown must still be controlling
 // the grounded opponent at the scheduled moment. A scheduled timer is
 // not permission to invent a move, flip control or teleport either side.
 function earnedNearfallSource(M){
  const g=get(M),p=$d.Psy.get(M),side=p.control;
  // A held submission, rope crawl, mat pressure or rest is not a
  // fresh knockdown. The defender being down alone is insufficient:
  // the actual authored move must be an impact or credited takedown.
  const impactFamilies=new Set(['strike','running','power','suplex',
   'neck','aerial','springboard','superplex','lucha','dive',
   'corner','rope','outside']);
  const classicImpacts=new Set(['clothesline','snap_suplex',
   'heavy_slam','power_spinebuster','arm_drag','mat_takedown',
   'short_arm_lariat','target_strike','shoulder_tackle','hip_toss',
   'gutbuster','grapple_trip','headlock_takeover','body_shot']);
  if(M.o.stip==='submission'||M.t/M.len<.59||
     !['w','f'].includes(side)||p.position!=='mat'||
     p.down!==(side==='w'?'f':'w')||
     g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact||
     g.physical?.area!=='ring'||
     g.physical.locations?.w!=='ring'||g.physical.locations?.f!=='ring')
   return null;
  const used=new Set(g.earnedNearfallSources||[]);
  // Safe may credit only its controlled, low-cost, non-risky grounding
  // repertoire. An implausible power spot cannot become its scheduled pin.
  const safeCovers=new Set(['arm_drag','grapple_trip','mat_takedown',
   'headlock_takeover','hip_toss','shoulder_tackle']);
  for(let i=g.events.length-1;i>=0;i--){
   const e=g.events[i],n=A[e.id];
   if(M.t-e.t>30)break;
   if(e.t>M.t||e.preControl!==side||e.control!==side||
      e.position!=='mat'||e.down!==p.down||!n||n.reverse||
      n.counterOf||n.blockOf||n.down!=='d'||n.zone!=='mat'||
      !(impactFamilies.has(n.family)||classicImpacts.has(e.id))||
      (M.planId==='safe'&&(n.risk||costOf(e.id)>2.2||
       !safeCovers.has(e.id)))||
      !['aerialResolution','grappleResolution','strikeResolution','contactResolution']
        .every(key=>!e[key]||e[key]==='landed'))continue;
   const key=e.t+':'+e.id+':'+side;
   if(used.has(key))continue;
   return {id:e.id,t:e.t,side,label:n.name||BROADCAST_NAMES[e.id]||'knockdown',key};
  }
  return null;
 }
 function nearfall(M,source=null){
  const g=get(M),p=$d.Psy.get(M);
  if(source){
   const valid=earnedNearfallSource(M);
   if(!valid||valid.key!==source.key||!$d.Psy.earnedNearfall(M,valid))
    return false;
   g.earnedNearfallSources??=[];
   g.earnedNearfallSources.push(valid.key);
   $d.vic(M,'nearfall',.45);
   g.nearfallCount++;
   g.events.push({id:'scheduled_nearfall',t:M.t,arc:g.arc,
    control:p.control,position:p.position,down:p.down,
    earned:true,sourceMove:valid.id,sourceT:valid.t,
    sourceSide:valid.side});
   g.node='stand_reset';
   root.OfficeSheets?.observe(M,'scheduled_nearfall',p.control,'spot');
   return true;
  }
  // Legacy explicitly invoked nearfall sequences remain supported for
  // saved-state/external tooling; normal live scheduling uses the earned path.
  if(M.o.stip==='submission'){
   // The dramatic almost-finish is a grip escaping, NEVER a pin count.
   $d.say(M,$d.fill(M,'{W} catches {F} in a dangerous hold, but {F} turns through and breaks the grip.'),'crowd');
   g.events.push({id:'scheduled_submission_escape',t:M.t,arc:g.arc,control:p.control,position:p.position});
   return;
  }
  if(M.t/M.len<.59)return;
  if(p.position==='outside'&&M.o.stip==='anywhere'){
   // The match can be decided anywhere; the official counts on the floor.
   const A=p.control==='f'?M.f:M.w,Df=A===M.w?M.f:M.w;
   $d.say(M,`${A.short} hooks ${Df.short}'s leg on the floor! Falls count anywhere tonight.`,'play');
   $d.say(M,`ONE! TWO! ${Df.short} kicks out just before three!`,'count');
   M.nearfalls++;M.bonus+=8;$d.mark(M,'nf',A===M.w);$d.lift(M,4);
  }else{
   if(p.position==='outside'){$d.say(M,$d.fill(M,$d.noCountout(M)?'{W} and {F} choose to take the fight back inside.':'{W} and {F} beat the referee’s count back into the ring.'));p.position='standing';p.down=null;resetPhysical(M);}
   $d.Psy.nearfall(M);
   resetPhysical(M);
  }
  $d.vic(M,'nearfall',.45);
  g.nearfallCount++;
  g.events.push({id:'scheduled_nearfall',t:M.t,arc:g.arc,control:p.control,position:p.position,down:p.down});
  g.node='stand_reset';
  root.OfficeSheets?.observe(M,'scheduled_nearfall',p.control,'spot');
 }
 // Check the real node's legality at its intended landing position without
 // mutating the match or using an extra random number.
 function canScriptedSpot(M,id,side){
  const n=A[id],p=$d.Psy.get(M),g=get(M);
  if(!n||!['standing','top','outside'].includes(n.requires)||
     g.pendingAerial||g.pendingGrapple)return false;
  // A high-spot setup must satisfy its own timing rules, not just the final move.
  // The elbow is legal at 40%, but top_follow not until 45%.
  if(p.position==='corner'&&n.requires==='top'&&
     M.t/Math.max(1,M.len)+1e-8<(A.top_follow.after||0))return false;
  const old=[p.control,p.position,p.down],priorPhysical=g.physical;
  // Feasibility preflight: prepareScriptedSpot will narrate and apply each setup.
  g.physical=null;p.control=side;p.position=n.requires;p.down=null;
  const valid=isValid(M,id);
  [p.control,p.position,p.down]=old;g.physical=priorPhysical;
  const st=side==='w'?M.wSt:M.fSt;
  return valid&&st>=28&&st>16+costOf(id)*3.2+5;
 }
 // Each setup also records actual graph actions. A successful scheduled
 // spectacle is no longer an unconnected event labelled 'special_spot'.
 function prepareScriptedSpot(M,id,side){
  const p=$d.Psy.get(M),g=get(M),n=A[id],attacker=side==='w'?M.w:M.f,defender=side==='w'?M.f:M.w;
  if(!canScriptedSpot(M,id,side))return false;
  if(p.control!==side){
   if(p.control!=='neutral')p.changes++;
   $d.say(M,attacker.short+' intercepts '+defender.short+' and creates an opening for the planned high spot.','play');
   p.control=side;M.mom=side==='w'?Math.max(22,M.mom):Math.min(-22,M.mom);
   g.node=null;
  }
  if(p.position==='outside'&&n.requires!=='outside')apply(M,'roll_inside');
  if(p.position==='top'&&n.requires!=='top'){
   $d.say(M,attacker.short+' steps down from the ropes and resets on the canvas.','play');
   p.position='standing';p.down=null;resetPhysical(M);g.node=null;
  }
  if(p.position==='mat'){
   if(p.down===side){
    $d.say(M,attacker.short+' rolls clear and rises before attacking again.','play');
    p.position='standing';p.down=null;resetPhysical(M);g.node=null;
   }else apply(M,'stand_reset');
  }
  if(p.position==='corner'&&n.requires!=='top')apply(M,'corner_break');
  if(n.requires==='outside'&&p.position==='standing')apply(M,'outside_toss');
  if(n.requires==='outside'&&p.position==='outside'&&!isValid(M,id)){
   if(n.family==='dive')apply(M,APRON_DIVES.has(id)?'apron_stand':'floor_regroup');
   else if(APRON_OFFENCE.has(id))apply(M,'apron_stand');
   else if(id==='os_ramp_suplex')apply(M,'ramp_approach');
  }
  if(n.requires==='top'&&p.position==='standing'){
   if(n.family==='superplex'){apply(M,'corner_whip');apply(M,'top_follow');}
   else apply(M,'top_climb');
  }else if(n.requires==='top'&&p.position==='corner')apply(M,'top_follow');
  if(!isValid(M,id)){
   // A failed setup is not a performed spot. Vary the explanation without
   // implying that the move landed, an injury occurred, or the plan changed.
   const failed=[
    attacker.short+' cannot complete the planned high-spot setup.',
    'The necessary opening is not there for '+attacker.short+'. The high spot is abandoned.',
    attacker.short+' checks the position, but the spectacular sequence cannot proceed.',
    'No clean route to the planned high spot for '+attacker.short+' this time.',
    attacker.short+' is unable to make the spectacular setup work from here.',
    'That high-spot preparation breaks down before '+attacker.short+' can attempt the landing.'
   ];
   $d.say(M,textureLine(g,'spot-setup-unavailable',failed),'play',
    {textureId:'spot-setup-unavailable'});
   g.node=null;return false;
  }
  return true;
 }
 function special(M){
  const hits=M.spotHits,attempted=$d.spot(M,false,false);
  // Graph.apply already records the one real named landing. A failed attempt
  // must never generate a second, fictitiously successful sheet event.
  if(attempted&&M.spotHits>hits)$d.vic(M,'spot',.4);
  return attempted;
 }
 function finishCue(M){
  // DQ, injury and other immediate endings must not leave a pending dive
  // masquerading as a landed or countered attack in saved match evidence.
  abortAerial(M,'interrupted',false);
  abortGrapple(M,'interrupted',false);
  const g=get(M),outcome=M.outcome==='nc'?'nc':M.outcome==='double'?'double':M.outcome==='dq'?'dq':M.o.finish;
  if(!OUTCOME_EDGES.finish_setup.includes(outcome))throw Error('Invalid match outcome: '+outcome);
  const def=OUTCOMES[outcome];
  if(outcome==='nc'&&!M.injury)throw Error('A no-contest medical stoppage requires a recorded injury.');
  g.outcome={id:outcome,winner:def.who,method:def.method,reason:def.legal,booked:M.o.finish};
  g.events.push({id:'outcome_'+outcome,t:M.t,arc:g.arc,control:$d.Psy.get(M).control,position:$d.Psy.get(M).position});
  root.OfficeSheets?.observe(M,'outcome_'+outcome,'either','outcome');
  root.OfficeSheets?.finalize(M);
  return g.outcome;
 }
 function validate(){
  const errors=[];
  for(const [id,n] of Object.entries(A)){
   for(const [to] of n.next)if(!A[to])errors.push(id+' -> '+to+' missing');
  }
  for(const [id,a] of Object.entries(ARCS)){
   for(const [to] of a.out)if(!ARCS[to])errors.push('arc '+id+' -> '+to+' missing');
   for(const nodeId of a.entry)if(!A[nodeId])errors.push('entry '+id+' -> '+nodeId+' missing');
  }
   for(const [id,n] of Object.entries(A)){
    if(n.counterOf&&!A[n.counterOf])errors.push(id+' counters missing '+n.counterOf);
    if(n.part&&!['arm','leg','neck','back','ribs'].includes(n.part))errors.push(id+' unknown part '+n.part);
    if(n.after<0||n.after>.95)errors.push(id+' timing out of range');
   }
   return {nodes:Object.keys(A).length,arcs:Object.keys(ARCS).length,outcomes:Object.keys(OUTCOMES).length,edges:Object.values(A).reduce((n,a)=>n+a.next.length,0),
    families:Object.keys(CAT.F).length,moves:CAT.counts.moves,reversals:CAT.counts.reversals,blocks:CAT.counts.blocks,errors};
 }
 // Conservative duration of one successful authored move on the live clock.
 function sequenceMoveSeconds(id){return isAerialParent(id)||isGrappleParent(id)?20:10;}
 return {sequenceMoveSeconds,A,ARCS,OUTCOMES,OUTCOME_EDGES,PATTERNS,costOf,CATALOG:CAT,SCRIPTED_SPOT_IDS,canScriptedSpot,prepareScriptedSpot,TECHNIQUE_PILOT,TECHNIQUE_EXPANSION,TECHNIQUE_TRANCHE2,TECHNIQUE_DEPTH,TECHNIQUE_CHAINS,TECHNIQUE_AUDIT24_LINKS,PHASE9_NEW_EDGES:Object.freeze([...introducedPhase9].sort()),PART_OF,ARC_FAMILIES,STYLE_BEATS,fighter,pool:validPool,get,init,advance,step,nearfall,earnedNearfallSource,special,finishCue,validate,apply,selectArc,scout,isValid,startAerial,resolveAerial,abortAerial,DIVE_PILOT,GRAPPLE_PILOT,startGrapple,resolveGrapple,abortGrapple,
 STRIKE_PILOT,QUICK_NECK_IDS,PHASE4_NECK_THROWS,
 startStrike,resolveStrike,abortStrike,
 GROUND_PILOT,PIN_PILOT,CONTACT_PILOT,ENVIRONMENT_PILOT,
 startContact,resolveContact,abortContact,SUPERPLEX_PILOT,PHYSICAL_GRIP_MOVES,GRIP_ENTRY,resetPhysical,affordableSuperplex,readyTopContest,readyNamedAerial,readyBrawlRebound,readyTechnicalGrip,readyStoryHope,readyNegotiatedSequence,maybeBrawlComboRun,motifOffers,motifSummary,sellingStrain,sellingWeight,sellingReport,closingRunway,closingOffers,closingPlanSetups,nearfallDrama,nearfallFollowupOffers};
})();
return {brawlConditioning,Graph};
};
root.OfficeMatchGraph={install:installGraph};
})(typeof window!=='undefined'?window:globalThis);
