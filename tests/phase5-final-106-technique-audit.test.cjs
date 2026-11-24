'use strict';
// Final 106 catalogue audit: all real techniques documented, performance beats excluded.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const game={};
for(const file of ['data.js','roster-registry.js','match-catalog.js','graph-narration.js','match-graph.js','match-commentary.js','match-engine.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js',file),'utf8'),{window:game,console,Date,Math,JSON},{filename:file});
game.OfficeRosterV4.enableProfiles();
const G=game.OfficeMatch.GRAPH,R=require('../assets/js/technique-registry.js');
const excluded=["double_down_count","fr_crowd_clap","fr_no_sell","fr_second_wind","fr_shake_ropes","hl_beg","hl_distraction_apron","hl_fake_injury","hl_mock","hl_ref_argue","hl_rope_leverage","hl_stall","hl_strut","os_count_tease","os_crowd_brawl"];
const before=JSON.stringify(G.A);
const all=Object.values(G.CATALOG.F).flatMap(f=>f.moves.map(m=>m[0]));
assert.equal(all.length,340);
const audit=R.validate(G);
assert.equal(audit.valid,true,audit.errors.join('\n'));
assert.equal(audit.proposals,325);
assert.equal(audit.coverage,95.6);
const missing=all.filter(id=>!R.get(id)).sort();
assert.deepEqual(missing,excluded,'only the 15 classified non-technique beats remain outside the technique registry');
for(const id of all.filter(id=>!excluded.includes(id))){
 const row=R.get(id);assert.ok(row,id+' missing');
 if(["cn_splash","cn_stinger","cn_dropkick","cn_forearm","cn_cannonball","cn_shoulders","cn_mounted_punches","cn_tree_of_woe","cn_chops","cn_monkey_flip","cn_clothesline","cn_knee","cn_snapmare","cn_hip_attack","cn_avalanche","cn_face_buckle","cn_choke","cn_backflip","ar_headbutt","ar_knee","ar_clothesline","ar_axe","ar_fist","ar_legdrop","ar_swanton","ar_stomp","ar_elbow_point","ar_splash","sp_avalanche_german","sp_hurricanrana","sp_powerbomb","sp_spider","sp_super_ddt","sp_super_arm_drag","sb_elbow","sb_clothesline","dv_suicide","dv_plancha","dv_moonsault","dv_apron_senton","dv_cannonball","dv_crossbody","dv_asai","dv_somersault","knuckle_lock","knuckle_break","ch_drop_down","ch_short_arm","ch_kip_up","os_barricade","os_post","os_post_leg","os_apron_knee","os_floor_chop","os_steps","os_apron_slam","os_headbutt","os_apron_forearm","os_ropes_choke","os_apron_kick","hl_hair_pull","hl_thumb","hl_low_blow_tease","hl_choke_shirt","hl_bite","hl_rake","fr_punch_flurry","fr_ten_punches","fr_double_clothesline","fr_atomic_drop","fr_back_body_drop","fr_flying_forearm","fr_inverted_atomic","fr_hulk_kick","fr_mounted_comeback","fr_fight_on_knees","lc_tornillo","lc_dropkick_flip","lc_handspring","lc_rope_walk","lc_head_kick","rp_hangman","rp_slingshot","rp_drop_kick_ropes","rp_tiger_feint","rp_ropes_choke","rp_rebound_lariat","rp_springboard_feint","rp_second_rope_elbow","rp_skin_cat","rp_rope_hang"].includes(id))assert.deepEqual([...row.traditionTags],['wrestling'],id+' accidentally affects school weighting');
}
for(const id of ['ch_short_arm','ch_drop_down','ch_kip_up','knuckle_break','fr_double_clothesline'])
 assert.deepEqual([...R.get(id).counterIds],[],id+' has no authored parent counter');
assert.equal(R.get('cn_backflip').exit.position,'standing');
assert.equal(R.get('fr_ten_punches').entry.position,'corner');
assert.equal(R.get('fr_atomic_drop').exit.position,'standing');
assert.equal(R.get('rp_rebound_lariat').exit.position,'mat');
assert.equal(R.get('os_post').target,'arm');
assert.equal(JSON.stringify(G.A),before,'editorial audit must not mutate the match graph');
console.log('PASS final 106 audit: 91 techniques documented, 15 classified performance beats excluded, 325/340 complete; gameplay untouched.');
