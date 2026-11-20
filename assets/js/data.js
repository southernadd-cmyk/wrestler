/* THE OFFICE v2 — data */
(function(root){'use strict';
const TALENT=[
 {id:'mara',name:'Mara Vale',short:'Vale',handle:'The Last Word',tier:'Star',style:'Story',fee:1830,wage:315,ring:76,mic:92,psych:85,safe:71,heat:74,ego:86,pro:73,loyal:48,morale:67,fatigue:8,finisher:'Closing Argument',bio:'Talks like she already owns the building. Usually does.'},
 {id:'rex',name:'Rex Titan',short:'Titan',handle:'King of the Yard',tier:'Star',style:'Brawl',fee:1880,wage:330,ring:84,mic:66,psych:72,safe:79,heat:77,ego:76,pro:85,loyal:55,morale:62,fatigue:15,finisher:'Yard Bomb',bio:'Twelve years of car parks and leisure centres. Hits hard, never misses a date.'},
 {id:'lyra',name:'Lyra Knox',short:'Knox',handle:'Neon Ghost',tier:'Prospect',style:'Spectacle',fee:890,wage:165,ring:57,mic:62,psych:45,safe:47,heat:43,ego:65,pro:53,loyal:65,morale:79,fatigue:4,finisher:'Ghost Light',bio:'Will jump off anything. Has not yet learned when not to.'},
 {id:'brick',name:'Brick Mercer',short:'Mercer',handle:'The Foundry',tier:'Veteran',style:'Brawl',fee:940,wage:180,ring:71,mic:45,psych:73,safe:88,heat:34,ego:35,pro:92,loyal:81,morale:61,fatigue:17,finisher:'Foundry Press',bio:'The safest pair of hands on the circuit. Bookers trust him with anyone.'},
 {id:'juno',name:'Juno Stark',short:'Stark',handle:'The Fuse',tier:'Prospect',style:'Technical',fee:910,wage:170,ring:69,mic:36,psych:59,safe:75,heat:28,ego:50,pro:80,loyal:63,morale:74,fatigue:7,finisher:'Short Fuse',sub:true,bio:'Beautiful on the mat, silent on the microphone.'},
 {id:'sol',name:'Sol Cruz',short:'Cruz',handle:'Daybreak',tier:'Prospect',style:'Story',fee:860,wage:170,ring:56,mic:74,psych:70,safe:66,heat:40,ego:57,pro:66,loyal:68,morale:78,fatigue:4,finisher:'First Light',bio:'Crowds want to believe in him. He needs matches that let them.'},
 {id:'dee',name:'Dee Okafor',short:'Okafor',handle:'The Apprentice',tier:'Rookie',style:'Technical',fee:540,wage:110,ring:58,mic:40,psych:52,safe:70,heat:18,ego:30,pro:84,loyal:72,morale:80,fatigue:2,finisher:'Night School',bio:'Eleven matches in. Listens to every word you say.'},
 {id:'kit',name:'Kit Marlowe',short:'Marlowe',handle:'Firecracker',tier:'Rookie',style:'Spectacle',fee:520,wage:105,ring:54,mic:58,psych:38,safe:44,heat:24,ego:62,pro:58,loyal:60,morale:82,fatigue:2,finisher:'Bonfire',bio:'Built like a gymnast, cuts promos like a pub landlord.'},
 {id:'dax',name:'Dax Hollis',short:'Hollis',handle:'The Late Shift',tier:'Star',style:'Story',fee:1990,wage:340,ring:74,mic:89,psych:88,safe:76,heat:72,ego:73,pro:82,loyal:57,morale:74,fatigue:9,finisher:'Closing Time',bio:'Worked the door for years before a promoter saw him talk a hostile room into buying another round.'},
 {id:'val',name:'Val Vance',short:'Vance',handle:'The Iron Standard',tier:'Star',style:'Brawl',fee:1710,wage:295,ring:81,mic:65,psych:71,safe:84,heat:66,ego:76,pro:86,loyal:52,morale:68,fatigue:11,finisher:'Iron Measure',bio:'A former strength athlete who built her own following on undercards. Still remembers every promoter who called her a novelty.'},
 {id:'nico',name:'Nico Vega',short:'Vega',handle:'Sunflash',tier:'Prospect',style:'Spectacle',fee:930,wage:175,ring:73,mic:52,psych:49,safe:62,heat:45,ego:66,pro:68,loyal:68,morale:78,fatigue:8,finisher:'Solar Flare',bio:'Learned lucha on family cards. He can get a sleepy room on its feet, then forget to give the next beat time to breathe.'},
 {id:'cal',name:'Cal Rourke',short:'Rourke',handle:'The Clamp',tier:'Rookie',style:'Technical',fee:570,wage:115,ring:62,mic:34,psych:50,safe:80,heat:20,ego:43,pro:88,loyal:73,morale:79,fatigue:3,finisher:'Anchor Hold',sub:true,bio:'A club grappler from Belfast filling in on a short contract. He will rehearse any hold, but needs a reason to speak.'},
 {id:'imani',name:'Imani King',short:'King',handle:'The Pace Setter',tier:'Prospect',style:'Technical',fee:1050,wage:192,ring:77,mic:66,psych:72,safe:84,heat:41,ego:58,pro:90,loyal:63,morale:74,fatigue:6,finisher:'King’s Gambit',sub:true,bio:'Made her name taking last-minute bookings and making green opponents look ready. Now she wants a programme built around her.'},
 {id:'otis',name:'Otis Ward',short:'Ward',handle:'The Spare Parts Man',tier:'Veteran',style:'Brawl',fee:800,wage:158,ring:66,mic:78,psych:75,safe:56,heat:42,ego:45,pro:79,loyal:80,morale:66,fatigue:14,finisher:'Scrap Heap',bio:'A former ring-crew hand with taped ribs and a gift for getting cheered after a loss. A whole crowd can worry about him at once.'},
 {id:'kira',name:'Kira Sato',short:'Sato',handle:'Blue Thunder',tier:'Veteran',style:'Brawl',fee:1250,wage:228,ring:82,mic:48,psych:79,safe:72,heat:56,ego:63,pro:91,loyal:61,morale:70,fatigue:12,finisher:'Storm Breaker',bio:'A touring veteran who taught half her old locker room how to take a bump. She expects opponents to keep their end of the plan.'},
 {id:'ezra',name:'Ezra Quill',short:'Quill',handle:'The Examiner',tier:'Veteran',style:'Technical',fee:1140,wage:210,ring:80,mic:71,psych:85,safe:87,heat:47,ego:64,pro:93,loyal:59,morale:65,fatigue:8,finisher:'Final Notice',sub:true,bio:'A veteran of formal rounds and strict rope breaks. He takes quiet satisfaction in making showboats wrestle his match.'}
];
const FOES=[
 {id:'red',name:'Red Doyle',short:'Doyle',style:'Brawl',ring:72,psych:66,safe:70,pro:82,ego:54,heat:55,finisher:'Doyle’s Hammer'},
 {id:'roxy',name:'Roxy Rain',short:'Rain',style:'Story',ring:68,psych:80,safe:74,pro:76,ego:58,heat:60,finisher:'Downpour'},
 {id:'silas',name:'Silas Rush',short:'Rush',style:'Technical',ring:85,psych:70,safe:62,pro:72,ego:84,heat:58,finisher:'Rush Lock',sub:true},
 {id:'night',name:'Night Shift',short:'Shift',style:'Spectacle',ring:66,psych:48,safe:45,pro:55,ego:68,heat:46,finisher:'Graveyard'},
 {id:'rev',name:'The Reverend',short:'the Reverend',style:'Story',ring:74,psych:92,safe:85,pro:93,ego:38,heat:70,finisher:'Last Rites'},
 {id:'malik',name:'Malik Knight',short:'Knight',style:'Brawl',ring:70,psych:58,safe:60,pro:61,ego:70,heat:50,finisher:'Knightfall'},
 {id:'dean',name:'Dean Blackwell',short:'Blackwell',style:'Story',ring:77,psych:83,safe:73,pro:65,ego:83,heat:67,finisher:'Last Call'},
 {id:'rocco',name:'Rocco Flint',short:'Flint',style:'Brawl',ring:79,psych:70,safe:59,pro:78,ego:72,heat:63,finisher:'The Kiln'},
 {id:'nova',name:'Nova Bell',short:'Bell',style:'Technical',ring:83,psych:77,safe:86,pro:89,ego:55,heat:58,finisher:'Bell Lock',sub:true},
 {id:'ace',name:'Ace Cassidy',short:'Cassidy',style:'Spectacle',ring:78,psych:76,safe:64,pro:58,ego:89,heat:69,finisher:'Encore'},
 {id:'magnus',name:'Magnus Graves',short:'Graves',style:'Brawl',ring:68,psych:85,safe:77,pro:73,ego:77,heat:62,finisher:'Blackout Slam'},
 {id:'tori',name:'Tori Kade',short:'Kade',style:'Spectacle',ring:71,psych:59,safe:53,pro:63,ego:68,heat:52,finisher:'Static Shock'}
];
const PROMOS=[
 {id:'dock',name:'Dockside',desc:'Warehouse brawls',venue:'Shed 9',reach:25,trust:64,likes:'brawl',minRep:0,tv:false,personality:'aggressive',voice:'Gaz Pryor'},
 {id:'pulse',name:'Pulse Underground',desc:'Viral indie circuit',venue:'the Pulse',reach:46,trust:55,likes:'spots',minRep:0,tv:false,personality:'showman',voice:'Nina Sato'},
 {id:'crown',name:'North Crown',desc:'Regional television',venue:'the Crown Ballroom',reach:57,trust:49,likes:'story',minRep:20,tv:true,personality:'traditional',voice:'Harold Pike'},
 {id:'union',name:'Grand Union',desc:'National broadcast',venue:'the Grand Union Arena',reach:85,trust:37,likes:'technical',minRep:45,tv:true,personality:'cold',voice:'Vivian Croft'}
];
const STABLES=[
 {id:'iron',name:'Iron Borough',manager:'Mo Devlin',style:'Brawl',legacy:'Iron Borough Wrestling',roster:['red','night','dean','dax','cal']},
 {id:'coastal',name:'Gold Coast',manager:'Ruth Anwar',style:'Story',legacy:'Coastal Championship',roster:['roxy','rev','rocco','imani']},
 {id:'northern',name:'North Circuit',manager:'Len Mercer',style:'Technical',legacy:'Northern Pro Circuit',roster:['silas','malik','nova','ezra']}
];
const CARD_LINEUPS={
 dock:['rocco','red','malik','dean','cal','night','nova','rev','tori','dax','ace','magnus'],
 pulse:['night','ace','tori','roxy','nova','malik','dean','imani','dax','cal','red','silas'],
 crown:['rev','roxy','dax','ace','red','silas','magnus','ezra','nova','rocco','imani','dean'],
 union:['silas','nova','ezra','imani','rev','magnus','ace','rocco','roxy','dean','dax','tori']
};
const SLOTS={
 opener:{name:'Opener',mins:8,mult:.85,crowd:-4,rank:0},
 mid:{name:'Mid-card',mins:12,mult:1,crowd:0,rank:1},
 feature:{name:'Featured bout',mins:15,mult:1.25,crowd:4,rank:2},
 main:{name:'Main event',mins:20,mult:1.7,crowd:9,rank:3}
};
const SLOT_ORDER=['opener','mid','feature','main'];
const FINISHES={
 win_clean:{name:'Wins clean',short:'Win clean',win:true,heat:6,purse:.9,trust:0},
 win_dirty:{name:'Wins dirty',short:'Win dirty',win:true,heat:3,purse:.95,trust:0},
 lose_protected:{name:'Loses protected',short:'Lose protected',win:false,heat:-1,purse:1.05,trust:1},
 lose_clean:{name:'Loses clean',short:'Lose clean',win:false,heat:-6,purse:1.25,trust:3},
 // v0.3.22 The referee sees it this time. A cheap win; a loss that makes them look dangerous.
 win_dq:{name:'Wins by DQ',short:'Win by DQ',win:true,heat:-1,purse:.9,trust:0},
 lose_dq:{name:'Loses by DQ',short:'Lose by DQ',win:false,heat:3,purse:1.05,trust:1}
};
// Game plans: what the match is built around.
const PLANS={
 story:{name:'Tell a story',blurb:'Slow build, big finish. Rewards psychology.',w:{ring:.35,psych:.65},crowd:1.0,late:1.35,risk:.6,drain:.85,spotRate:.045},
 spots:{name:'Spot-fest',blurb:'Big moves, big pops, big risk.',w:{ring:.7,psych:.3},crowd:1.25,late:1.1,risk:1.3,drain:1.35,spotRate:.1},
 technical:{name:'Technical showcase',blurb:'Ringcraft first. Purists love it; casual crowds drift.',w:{ring:.8,psych:.2},crowd:.8,late:1.1,risk:.7,drain:1,spotRate:.035},
 brawl:{name:'Brawl',blurb:'Fight all over the building. Loud, messy, tiring.',w:{ring:.55,psych:.45},crowd:1.15,late:1.05,risk:1.2,drain:1.15,spotRate:.09},
 safe:{name:'Keep it safe',blurb:'Low risk, low ceiling. For tired or injured bodies.',w:{ring:.5,psych:.5},crowd:.75,late:1,risk:.35,drain:.7,spotRate:.02,qual:-2}
};
const STYLE_PLAN={Story:'story',Spectacle:'spots',Technical:'technical',Brawl:'brawl'};
const LEASH={
 script:{name:'Stick to the match layout',blurb:'You call the match. Proud workers may resent it.'},
 free:{name:'Let them call it',blurb:'They call it live. Great minds shine; green ones get lost.'}
};
const TALKS={
 none:{name:'Say nothing',blurb:'Leave them to it.'},
 calm:{name:'Calm them down',blurb:'Fewer mistakes, a steadier start.'},
 fire:{name:'Fire them up',blurb:'Hotter start, more risk, less listening.'},
 money:{name:'Remind them who pays',blurb:'They will follow orders. They will not enjoy it.'}
};
const TRAINING={
 ring:{name:'Ring',stat:'ring',fat:9,cost:0},
 mic:{name:'Mic',stat:'mic',fat:3,cost:0},
 psych:{name:'Psychology',stat:'psych',fat:5,cost:0},
 safe:{name:'Safety',stat:'safe',fat:5,cost:0},
 promo:{name:'Cut a promo',stat:null,fat:3,cost:40},
 rest:{name:'Rest',stat:null,fat:-16,cost:0}
};
const MOVES={
 Brawl:['a stiff right hand','a running lariat','a headbutt','a big boot','a back body drop','forearms in the corner','a spinebuster','a shoulder tackle'],
 Technical:['a German suplex','an arm drag','a hammerlock','a dragon screw','a bridging suplex','a cross armbar','a single-leg crab','a snap suplex'],
 Spectacle:['a springboard dropkick','a handspring elbow','a corkscrew crossbody','a hurricanrana','a superkick','a running shooting star','a moonsault press'],
 Story:['a jawbreaker','a DDT','a sleeper hold','a backslide','a neckbreaker','a swinging side slam','a small package attempt']
};
const SPOTS={
 Brawl:['a piledriver on the floor','a suplex onto the entrance ramp','a spear through the barricade'],
 Technical:['a superplex from the top rope','a top-rope German suplex','a deadlift bridging suplex'],
 Spectacle:['a 450 splash','a tope con hilo over the top rope','a shooting star press off the top'],
 Story:['a diving elbow from the top','a DDT on the apron','a backdrop over the top rope to the floor']
};
const GOALS1=[
 {id:'rep40',text:'Reach reputation 40'},
 {id:'union',text:'Get a booking with Grand Union'},
 {id:'four',text:'Produce a four-star match'},
 {id:'solvent',text:'Finish the season in the black'}
];
// Fictional character-specific traits and weight classes. Lookups by stable ID
// keep older local career saves valid, without changing their stored roster objects.
const PROFILES={
 mara:{kg:77,trait:'Showboat',preferred:['crowd_pose','finish_tease','counter_strike','cheap_shot'],signature:['nk_swinging_neckbreaker','st_open_slap','pn_inside_cradle','sm_sleeper']},
 rex:{kg:125,trait:'Powerhouse',preferred:['power_spinebuster','corner_strikes','outside_toss','clothesline'],signature:['pw_gorilla_press','st_big_boot','cn_avalanche','pw_scoop_powerslam']},
 lyra:{kg:64,trait:'Daredevil',preferred:['springboard_rise','top_climb','duck_rebound','aerial_attack'],signature:['ar_moonsault','lc_hurricanrana','dv_tope_con_hilo','sb_dropkick']},
 brick:{kg:115,trait:'Workhorse',preferred:['power_spinebuster','mat_hold','corner_strikes','stand_reset'],signature:['pw_backbreaker','sx_gutwrench','gd_elbow_drop','sm_camel']},
 juno:{kg:69,trait:'Submission specialist',preferred:['grapple_trip','wristlock','target_hold','submission_set'],signature:['sm_ankle_lock','ch_dragon_screw','sm_kneebar','sx_fisherman']},
 sol:{kg:84,trait:'Comeback artist',preferred:['hope_elbows','counter_strike','clothesline','crowd_pose'],signature:['fr_punch_flurry','fr_flying_forearm','fr_atomic_drop','nk_bulldog']},
 dee:{kg:75,trait:'Counter wrestler',preferred:['wrist_escape','mat_scramble','grapple_trip','waist_escape'],signature:['pn_small_package','ch_drop_toehold','sm_fujiwara','pn_backslide']},
 kit:{kg:66,trait:'Daredevil',preferred:['springboard_rise','top_climb','aerial_attack','rope_run'],signature:['ar_frog','dv_suicide','lc_headscissors','st_enzuigiri']},
 red:{kg:105,trait:'Street brawler',preferred:['cheap_shot','corner_strikes','outside_toss','floor_brawl'],signature:['os_barricade','st_headbutt','gd_ground_pound','hl_thumb']},
 roxy:{kg:74,trait:'Ring general',preferred:['finish_tease','crowd_pose','counter_strike','lockup'],signature:['nk_ddt','sm_sleeper','nk_russian_sweep','hl_ref_argue']},
 silas:{kg:91,trait:'Submission specialist',preferred:['submission_set','wristlock','grapple_trip','mat_takedown'],signature:['sm_crossface','sx_german','sm_cross_armbreaker','ch_top_wristlock']},
 night:{kg:68,trait:'Daredevil',preferred:['springboard_rise','aerial_attack','top_climb','duck_rebound'],signature:['ar_450','lc_tornillo','sb_moonsault','st_superkick']},
 rev:{kg:108,trait:'Ring general',preferred:['mat_hold','crowd_pose','finish_tease','target_hold'],signature:['sm_cobra','pw_sidewalk','gd_knee_drop','hl_rope_leverage']},
 malik:{kg:103,trait:'Opportunist',preferred:['cheap_shot','power_spinebuster','counter_strike','outside_toss'],signature:['st_throat_thrust','pw_spinebuster_running','hl_fake_injury','st_discus']},
 dax:{kg:107,trait:'Comeback artist',preferred:['hope_elbows','finish_tease','counter_strike','crowd_pose'],signature:['nk_swinging_neckbreaker','st_discus','pn_backslide','fr_flying_forearm']},
 val:{kg:91,trait:'Powerhouse',preferred:['power_spinebuster','corner_strikes','clothesline','outside_toss'],signature:['pw_gorilla_press','pw_scoop_powerslam','sx_gutwrench','st_big_boot']},
 nico:{kg:68,trait:'Aerial specialist',preferred:['duck_rebound','rope_run','springboard_rise','aerial_attack'],signature:['lc_tornillo','lc_hurricanrana','ar_450','sb_dropkick']},
 cal:{kg:86,trait:'Submission specialist',preferred:['grapple_trip','mat_takedown','target_hold','submission_set'],signature:['sx_german','sm_cobra','sm_ankle_lock','ch_top_wristlock']},
 imani:{kg:73,trait:'Counter wrestler',preferred:['wrist_escape','waist_escape','mat_scramble','counter_strike'],signature:['ch_drop_toehold','sm_fujiwara','sx_fisherman','pn_inside_cradle']},
 otis:{kg:121,trait:'Street brawler',preferred:['floor_brawl','hope_elbows','outside_toss','clothesline'],signature:['nk_ddt','os_barricade','gd_elbow_drop','sm_camel']},
 kira:{kg:108,trait:'Powerhouse',preferred:['corner_strikes','power_spinebuster','mat_hold','target_hold'],signature:['sx_german','st_discus','ar_moonsault','pw_sidewalk']},
 ezra:{kg:102,trait:'Submission specialist',preferred:['wristlock','mat_hold','submission_set','cheap_shot'],signature:['sm_crossface','sm_kneebar','ch_dragon_screw','hl_rope_leverage']},
 dean:{kg:113,trait:'Opportunist',preferred:['crowd_pose','cheap_shot','finish_tease','power_spinebuster'],signature:['hl_ref_argue','st_open_slap','sx_gutwrench','pw_backbreaker']},
 rocco:{kg:168,trait:'Powerhouse',preferred:['corner_strikes','power_spinebuster','outside_toss','top_climb'],signature:['cn_avalanche','st_headbutt','ar_splash','gd_ground_pound']},
 nova:{kg:67,trait:'Workhorse',preferred:['waist_escape','lockup','grapple_trip','submission_set'],signature:['sx_german','st_enzuigiri','sm_cross_armbreaker','pn_small_package']},
 ace:{kg:94,trait:'Showboat',preferred:['crowd_pose','top_climb','finish_tease','aerial_attack'],signature:['st_superkick','ar_frog','fr_flying_forearm','pn_inside_cradle']},
 magnus:{kg:145,trait:'Ring general',preferred:['finish_tease','corner_strikes','mat_hold','power_spinebuster'],signature:['st_big_boot','pw_sidewalk','gd_knee_drop','pw_scoop_powerslam']},
 tori:{kg:63,trait:'Daredevil',preferred:['outside_toss','duck_rebound','aerial_attack','springboard_rise'],signature:['dv_suicide','lc_headscissors','nk_bulldog','st_enzuigiri']}
};
// The commentary booth. Each commentary line carries one of these keys as `who`.
const BOOTH={
 pbp:{name:'Gloria Mensah',short:'Gloria',role:'Play-by-play',img:'assets/portraits/booth-pbp.png'},
 colour:{name:'Vic Bellamy',short:'Vic',role:'Colour commentary',img:'assets/portraits/booth-colour.png'},
 runner:{name:'Ravi Kapoor',short:'Ravi',role:'Production runner',img:'assets/portraits/booth-runner.png'}
};
// Every promotion runs separate men's and women's rankings, each with its own championship.
// Cass Rae and Ari Keats work the women's division; Miro Lane and Morgan Alder work the men's.
const DIVISIONS={men:{id:'men',name:'Men’s'},women:{id:'women',name:'Women’s'}};
const DIVISION_ORDER=['men','women'];
const WOMEN=new Set(['mara','lyra','juno','val','imani','kira','roxy','nova','tori','faye','zara','aisha','anya','rina','priya','cass','sylvia','mae','soraya','winnie','bronte','nikita','alina','marisol','eira','vera','ari','kezia','liya','nadia','iris','ayla','sasha','noelle','elodie','cleo']);
function divisionOf(w){const id=typeof w==='string'?w:w?.id;return WOMEN.has(id)?'women':'men';}
const BELT_ART={dock:'dockside',pulse:'pulse-underground',crown:'north-crown',union:'grand-union'};
function belt(pid,div){
 const p=PROMOS.find(x=>x.id===pid);if(!p||!DIVISIONS[div])return null;
 return {pid,div,name:`${p.name} ${DIVISIONS[div].name} Championship`,short:`${p.name} ${DIVISIONS[div].name} title`,img:`assets/belts/${BELT_ART[pid]}-${div==='women'?'womens':'mens'}.webp`};
}
root.OfficeData={TALENT,FOES,PROMOS,STABLES,CARD_LINEUPS,SLOTS,SLOT_ORDER,FINISHES,PLANS,STYLE_PLAN,LEASH,TALKS,TRAINING,MOVES,SPOTS,GOALS1,PROFILES,BOOTH,DIVISIONS,DIVISION_ORDER,WOMEN,divisionOf,belt};
})(typeof window!=='undefined'?window:globalThis);
