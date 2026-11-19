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
  const TRADITIONS = Object.freeze(['catch', 'judo', 'lucha']);
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
  ];
  const registry = Object.create(null);
  for (const [id, mechanicalClass, mechanic, entry, exit, target,
    traditions, setupIds, counterIds, variantOf, note] of proposals) {
    if (has(registry, id)) throw Error('Duplicate technique registry ID: ' + id);
    registry[id] = Object.freeze({
      id, mechanicalClass, mechanic,
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
