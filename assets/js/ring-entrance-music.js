/* V3 ring lab only — fixed entrance music assignments for all 200 authored identities.
   Music: Abstraction / Tallbeard Studios, Music Loop Bundle, CC0 1.0.
   https://tallbeard.itch.io/music-loop-bundle
   Catalogue / pinned mirror: https://github.com/todd-apptivity/video-background-music
   Each identity receives a distinct recording, selected from catalogue tags.
   Locally hosted 12-second MP3 excerpts; no live career or RNG changes. */
(function(root){'use strict';
const assignments=Object.freeze({
 "academy-001": {
  "title": "Sketchbook 2024-08-01_EXTENDED",
  "file": "sketchbook-2024-08-01_extended.ogg",
  "source": "tallbeard",
  "duration": 45,
  "sha256": "9cb1e42a157ec6adf92175518819ba9adf663cecde8d9b63d8d1339b225988d5",
  "offset": 0,
  "style": "Technical"
 },
 "academy-002": {
  "title": "LD 05",
  "file": "ludum-dare-28-05.ogg",
  "source": "tallbeard",
  "duration": 126.9,
  "sha256": "e4356b35132d3499ce7eb0ac043bdd5f120732110516bc68cee8b7c9c165093a",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-003": {
  "title": "LD 07",
  "file": "ludum-dare-38-07.ogg",
  "source": "tallbeard",
  "duration": 60,
  "sha256": "fa7b447e9051b16622515266c04b88ae7b2fcb88f71cd12933135bed63995f68",
  "offset": 0,
  "style": "Story"
 },
 "academy-004": {
  "title": "Lift You Up CHORUS",
  "file": "week-14---lift-you-up-chorus.ogg",
  "source": "tallbeard",
  "duration": 14.22,
  "sha256": "afdf5d82a752f67879a1c0f21aa72fcb7e60b89709d23e1d1146243d75b19e90",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-005": {
  "title": "Sketchbook 2024-07-19_L04",
  "file": "sketchbook-2024-07-19_l04.ogg",
  "source": "tallbeard",
  "duration": 59.08,
  "sha256": "c1170187367a8615ee68cf8351617f3cdb6bdfd10e8277a2ffd3fc9b16ce4cfc",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-006": {
  "title": "VGMA Challenge 09",
  "file": "vgma-challenge-09.ogg",
  "source": "tallbeard",
  "duration": 15,
  "sha256": "2c0c6e26f62e89669344d56c7ae6bacd92c0ecae3d9d918a8cd8b25346d8cace",
  "offset": 0,
  "style": "Technical"
 },
 "academy-007": {
  "title": "Three Red Hearts Save the City",
  "file": "three-red-hearts-save-the-city.ogg",
  "source": "tallbeard",
  "duration": 102.41,
  "sha256": "cfe0173936860fa7eee32844900c4b9ff2865c9d4aee46e65e858a23ffd01c0b",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-008": {
  "title": "Washboard Blues",
  "file": "week-32---washboard-blues.ogg",
  "source": "tallbeard",
  "duration": 61.33,
  "sha256": "5ba58d5561209d5b83fa3c42579fd58676bd285f1b76ad4b6ff1543262b12ea8",
  "offset": 0,
  "style": "Story"
 },
 "academy-009": {
  "title": "Three Red Hearts Princess Quest (No Boing)",
  "file": "three-red-hearts-princess-quest-no-boing.ogg",
  "source": "tallbeard",
  "duration": 89.61,
  "sha256": "e8f93c534f487237e9631d6a5328299552cbdbf6f59fb5df353c6e477be428b8",
  "offset": 0,
  "style": "Technical"
 },
 "academy-010": {
  "title": "Sketchbook 2024-10-30",
  "file": "sketchbook-2024-10-30.ogg",
  "source": "tallbeard",
  "duration": 53.54,
  "sha256": "df4edcd0997cb5952a90e026ed70bc38299d481198bbbc7d218ff793ad15edf8",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-011": {
  "title": "VGMA Challenge 23",
  "file": "vgma-challenge-23.ogg",
  "source": "tallbeard",
  "duration": 29.54,
  "sha256": "29aa745378f65cea1d6b7c649812d5abf204f667bf6e6523165ae1d29980ddfe",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-012": {
  "title": "Sketchbook 2024-05-22",
  "file": "sketchbook-2024-05-22.ogg",
  "source": "tallbeard",
  "duration": 50.09,
  "sha256": "d3033f8dd37c3bfcad33b0caed1ed6d229d0a898f3235e801b4ccd22fc12858f",
  "offset": 0,
  "style": "Story"
 },
 "academy-013": {
  "title": "VGMA Challenge 08",
  "file": "vgma-challenge-08.ogg",
  "source": "tallbeard",
  "duration": 15.24,
  "sha256": "0f55d5a6c042ed7d007f144cc1f5f5f76e51f1e29a61f0d7e7b0e07ea2af4714",
  "offset": 0,
  "style": "Technical"
 },
 "academy-014": {
  "title": "LD 04",
  "file": "ludum-dare-30-04.ogg",
  "source": "tallbeard",
  "duration": 59.29,
  "sha256": "6bc890ee771b59be6db01eb7c2c5c77dcc031601effa1f1dcc17e097896a6ec7",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-015": {
  "title": "Sketchbook 2024-11-29",
  "file": "sketchbook-2024-11-29.ogg",
  "source": "tallbeard",
  "duration": 52.8,
  "sha256": "126bbec757640e9b6a55bef42d2e714926da40ecf714f82ca19ac1627bda2bfe",
  "offset": 0,
  "style": "Story"
 },
 "academy-016": {
  "title": "Three Red Hearts Penultimate",
  "file": "three-red-hearts-penultimate.ogg",
  "source": "tallbeard",
  "duration": 65.16,
  "sha256": "89f930b60c09e0d99b9ff44f50407471b7fa6530459dae0876ad3ded190034d8",
  "offset": 0,
  "style": "Technical"
 },
 "academy-017": {
  "title": "Lift You Up MELODY",
  "file": "week-14---lift-you-up-melody.ogg",
  "source": "tallbeard",
  "duration": 14.22,
  "sha256": "a7bd29e432cc48cf3c08958a4944cc1d8ab2782a26f3bcb81f0709060ab233fe",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-018": {
  "title": "Sugar Rush ZOOMIES",
  "file": "week-8---sugar-rush-zoomies.ogg",
  "source": "tallbeard",
  "duration": 12.8,
  "sha256": "926653300a2b4e43b62b8a504b41cf742f16cb45feb95bf4f08437849b04ba95",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-019": {
  "title": "LD 10",
  "file": "ludum-dare-38-10.ogg",
  "source": "tallbeard",
  "duration": 64.23,
  "sha256": "b6a300df48497fc9ce5b38b99fb4485e41b9ace368ad620162b09fa87a26291c",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-020": {
  "title": "Workshop BREADBOARD",
  "file": "week-23---workshop-breadboard.ogg",
  "source": "tallbeard",
  "duration": 22.59,
  "sha256": "7ec21cd36dd4be375e542a3e32116d2c2d060587f7c041f2444dfdc80da3648a",
  "offset": 0,
  "style": "Story"
 },
 "academy-021": {
  "title": "LD 02",
  "file": "ludum-dare-30-02.ogg",
  "source": "tallbeard",
  "duration": 113.14,
  "sha256": "8c2cc7fe5ce366dc887214310149ea39b607d1088fc84154187402dd91faf3b5",
  "offset": 0,
  "style": "Story"
 },
 "academy-022": {
  "title": "Sketchbook 2024-08-01",
  "file": "sketchbook-2024-08-01.ogg",
  "source": "tallbeard",
  "duration": 30,
  "sha256": "146c2f9aac79e3b7e1f213fe52dff6e2577b13ab977f45695785449f08e1c8a8",
  "offset": 0,
  "style": "Technical"
 },
 "academy-023": {
  "title": "LD 03",
  "file": "ludum-dare-32-03.ogg",
  "source": "tallbeard",
  "duration": 64,
  "sha256": "ec00fbc6b62a71e7e21451c3657feea0e4b89b8fbdeede8219b1fe943d932418",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-024": {
  "title": "Three Red Hearts Box Jump",
  "file": "three-red-hearts-box-jump.ogg",
  "source": "tallbeard",
  "duration": 99,
  "sha256": "477ea1398f6620d51b0c44056862320e391b70862ef699d00b8604c7cb2ff2f5",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-025": {
  "title": "Sketchbook 2024-12-05",
  "file": "sketchbook-2024-12-05.ogg",
  "source": "tallbeard",
  "duration": 39.27,
  "sha256": "c6d21a98ca17ee51717576eec5bdf2f3ff914bf5f369be65af8033d62ccd4253",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-026": {
  "title": "LD 04",
  "file": "ludum-dare-38-04.ogg",
  "source": "tallbeard",
  "duration": 41.14,
  "sha256": "341daa2cd1831084b411f7e567e79bab3e56284deeb89114e979c43379ff5006",
  "offset": 0,
  "style": "Technical"
 },
 "academy-027": {
  "title": "Hypnotize Me CHORDS",
  "file": "week-12---hypnotize-me-chords.ogg",
  "source": "tallbeard",
  "duration": 25.26,
  "sha256": "74a6b7cda6002226e0a67085f49dad5a385301f22c92ebb22bd89c3faf4ad662",
  "offset": 0,
  "style": "Story"
 },
 "academy-028": {
  "title": "Sketchbook 2024-09-04_LOOP",
  "file": "sketchbook-2024-09-04_loop.ogg",
  "source": "tallbeard",
  "duration": 57.39,
  "sha256": "847e12c856355feac792d680b563b1a74c768819ca510060d5fb984437a0354f",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-029": {
  "title": "Three Red Hearts Three Red Hearts",
  "file": "three-red-hearts-three-red-hearts.ogg",
  "source": "tallbeard",
  "duration": 44.8,
  "sha256": "ee397d24a2883ba6869046b607e82d66c68a2b2019cee5effc5c9f5279d5fe00",
  "offset": 0,
  "style": "Technical"
 },
 "academy-030": {
  "title": "Hypnotize Me BOOPS",
  "file": "week-12---hypnotize-me-boops.ogg",
  "source": "tallbeard",
  "duration": 25.26,
  "sha256": "6927b39c44aef8e84e2636fb9edf22b76303c01ab27e29e58e64c2a6a8808ce3",
  "offset": 0,
  "style": "Story"
 },
 "academy-031": {
  "title": "Sketchbook 2024-09-04_IN",
  "file": "sketchbook-2024-09-04_in.ogg",
  "source": "tallbeard",
  "duration": 58.7,
  "sha256": "939c4f7c503578aa2ffd16bb49292a236a3ede0aecf030133d73027db3573ab5",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-032": {
  "title": "Sketchbook 2024-10-23",
  "file": "sketchbook-2024-10-23.ogg",
  "source": "tallbeard",
  "duration": 60,
  "sha256": "af9e0fee38abe0a406ac18145a708a394c1ab1ce9449de10c4d0a14135c63339",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-033": {
  "title": "Sugar Rush RISER",
  "file": "week-8---sugar-rush-riser.ogg",
  "source": "tallbeard",
  "duration": 25.6,
  "sha256": "0de6e752ecab94ed35b4fc970aa3f0b594be78c51b920301303b99093781b63b",
  "offset": 0,
  "style": "Technical"
 },
 "academy-034": {
  "title": "Sketchbook 2024-12-21",
  "file": "sketchbook-2024-12-21.ogg",
  "source": "tallbeard",
  "duration": 60.63,
  "sha256": "42cf3ae7b75c585211eaf7e04648e5a6194076ebc682a1d450e310729ea32969",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-035": {
  "title": "Three Red Hearts Penguin Town",
  "file": "three-red-hearts-penguin-town.ogg",
  "source": "tallbeard",
  "duration": 35.3,
  "sha256": "16a7063312bbbabdc449cb847cc040dcdef652d6a1db9385ad5e09ecfafe3753",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-036": {
  "title": "Batteries Not Included AAA",
  "file": "week-28---batteries-not-included-aaa.ogg",
  "source": "tallbeard",
  "duration": 20.87,
  "sha256": "ba06e4393b664193dbf8e32052b594584bf448af30c96905815a852a9b81a35a",
  "offset": 0,
  "style": "Story"
 },
 "academy-037": {
  "title": "Life Is Hard MELODY",
  "file": "week-7---life-is-hard-melody.ogg",
  "source": "tallbeard",
  "duration": 29.54,
  "sha256": "16cf1318f45ed00ffc7e7d41424d6be3185823c472b30c5ee41c22a66c107db5",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-038": {
  "title": "Sketchbook 2024-10-14",
  "file": "sketchbook-2024-10-14.ogg",
  "source": "tallbeard",
  "duration": 36.48,
  "sha256": "7bf6e2d1b7ea7075739d911bae3ba32be0743d78ca76a5c159e7d8e6d0ae15a0",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-039": {
  "title": "VGMA Challenge 07",
  "file": "vgma-challenge-07.ogg",
  "source": "tallbeard",
  "duration": 21.36,
  "sha256": "cb06836c300e61de11b4d5b31f7b6fb10d6a37c979e037b545890592fac87e0f",
  "offset": 0,
  "style": "Story"
 },
 "academy-040": {
  "title": "Cloak of Darkness STAGE 3",
  "file": "week-4---cloak-of-darkness-stage-3.ogg",
  "source": "tallbeard",
  "duration": 13.71,
  "sha256": "d807a6c88f39641451444a3dc3434db0047da977b996e24f9ee82a13c4764be8",
  "offset": 0,
  "style": "Technical"
 },
 "academy-041": {
  "title": "The Walking Dunes EVENING OASIS",
  "file": "week-22---the-walking-dunes-evening-oasis.ogg",
  "source": "tallbeard",
  "duration": 15,
  "sha256": "adb66d922cf2947926ad66802b851b101a7cb768d62097951373aa08243f6ffe",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-042": {
  "title": "VGMA Challenge 22",
  "file": "vgma-challenge-22.ogg",
  "source": "tallbeard",
  "duration": 40,
  "sha256": "d020e05279e3f9a7154aa844e54a975efa517476211bd3beef4e0e44c958c60b",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-043": {
  "title": "Sketchbook 2025-12-14",
  "file": "sketchbook-2025-12-14.ogg",
  "source": "tallbeard",
  "duration": 75,
  "sha256": "d6d24e81a6d848360ef03301d92b28c4c542bd8a4deca6cd734ae6c990902562",
  "offset": 0,
  "style": "Technical"
 },
 "academy-044": {
  "title": "Batteries Not Included AA",
  "file": "week-28---batteries-not-included-aa.ogg",
  "source": "tallbeard",
  "duration": 20.87,
  "sha256": "b964cb684725c92317c02a5a1ee7b9d1a7f3e421e4742eef8e7c06bcc8cf52b6",
  "offset": 0,
  "style": "Story"
 },
 "academy-045": {
  "title": "Sketchbook 2024-07-19_L02",
  "file": "sketchbook-2024-07-19_l02.ogg",
  "source": "tallbeard",
  "duration": 59.08,
  "sha256": "fbfe4c096c54638e33d65a586971b55e2a5bf1c32dec16a0f0e5630ed7bdf28a",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-046": {
  "title": "Cloak of Darkness STAGE 2",
  "file": "week-4---cloak-of-darkness-stage-2.ogg",
  "source": "tallbeard",
  "duration": 13.71,
  "sha256": "c47346e0c0c06158006f580c723dc840cdfc30aa61a86af02b48325063869b35",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-047": {
  "title": "Piecemeal SCATTERED",
  "file": "week-34---piecemeal-scattered.ogg",
  "source": "tallbeard",
  "duration": 19.2,
  "sha256": "25a9f5dc830eb65be4c652ab60d5cb2ac434866ee8683c89ce8873d3a4638d8b",
  "offset": 0,
  "style": "Story"
 },
 "academy-048": {
  "title": "Three Red Hearts Out of Time",
  "file": "three-red-hearts-out-of-time.ogg",
  "source": "tallbeard",
  "duration": 61.34,
  "sha256": "e30a59b9762edd677bf2a28e170131597fb57997fd2e84e6115a8fb6b921ec8e",
  "offset": 0,
  "style": "Technical"
 },
 "academy-049": {
  "title": "Sketchbook 2024-07-19_L03",
  "file": "sketchbook-2024-07-19_l03.ogg",
  "source": "tallbeard",
  "duration": 59.08,
  "sha256": "c9365f2005da56df1e60268ecb2ef165562549f85f030befb58ca170280ed7f2",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-050": {
  "title": "Patreon Challenge 03",
  "file": "patreon-challenge-03.ogg",
  "source": "tallbeard",
  "duration": 60,
  "sha256": "60851d0d600244d231a39b7d97a6aa2915c9374e952192d3fe21a1e5a9770012",
  "offset": 0,
  "style": "Story"
 },
 "academy-051": {
  "title": "LD 01",
  "file": "ludum-dare-28-01.ogg",
  "source": "tallbeard",
  "duration": 118.45,
  "sha256": "cdefea3904731cffcb779a5676eba3a348fae6b168d020dac3f93e57780e7f4d",
  "offset": 0,
  "style": "Technical"
 },
 "academy-052": {
  "title": "Three Red Hearts Sanctuary",
  "file": "three-red-hearts-sanctuary.ogg",
  "source": "tallbeard",
  "duration": 76.81,
  "sha256": "2025ea863cecf0d36bc641a30f30ef99e451ee8cfd02f1be9c7d1d02c4d336f1",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-053": {
  "title": "LD 08",
  "file": "ludum-dare-30-08.ogg",
  "source": "tallbeard",
  "duration": 83.08,
  "sha256": "ceea149797ffccc3394aeb712bcdbd68334d857c9ee96ae36de13e7fd3aa55b2",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-054": {
  "title": "Forbidden Luxuries HUMAN RIGHTS",
  "file": "week-33---forbidden-luxuries-human-rights.ogg",
  "source": "tallbeard",
  "duration": 21.52,
  "sha256": "f6f5485a8acc2bd687f312e106f7e1b9639aee9e344ba88d69a2c5da609a4f3b",
  "offset": 0,
  "style": "Technical"
 },
 "academy-055": {
  "title": "Never Miss FIRE",
  "file": "week-6---never-miss-fire.ogg",
  "source": "tallbeard",
  "duration": 27.43,
  "sha256": "028797c6d4053c8423e2c24ce1ce6084493c18f8d1a9459a549d4a33831d3209",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-056": {
  "title": "Sketchbook 2024-07-19_L01",
  "file": "sketchbook-2024-07-19_l01.ogg",
  "source": "tallbeard",
  "duration": 59.08,
  "sha256": "4f9cb78cc335db7e98e6a012de6d38c6b1c5e811e6ec48383729a0f8cb5c782c",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-057": {
  "title": "Sketchbook 2024-05-01_02",
  "file": "sketchbook-2024-05-01_02.ogg",
  "source": "tallbeard",
  "duration": 43.64,
  "sha256": "e2347cee1176ec6792773afeed1251e7aeaf946a3c792a700daf80ad9f846017",
  "offset": 0,
  "style": "Story"
 },
 "academy-058": {
  "title": "Distant Skyline SIDEWALK STRUT",
  "file": "week-18---distant-skyline-sidewalk-strut.ogg",
  "source": "tallbeard",
  "duration": 12.15,
  "sha256": "2075e159cc37b140880f56cf09eae769826dc08078dd5d5a05d2aeb17bfce2bf",
  "offset": 0,
  "style": "Story"
 },
 "academy-059": {
  "title": "LD 08",
  "file": "ludum-dare-28-08.ogg",
  "source": "tallbeard",
  "duration": 137.14,
  "sha256": "dc8d1662dd95ed3ffbf0c0bb24e39870a70368434c677573f4453b5f4acae160",
  "offset": 0,
  "style": "Technical"
 },
 "academy-060": {
  "title": "Three Red Hearts Princess Quest",
  "file": "three-red-hearts-princess-quest.ogg",
  "source": "tallbeard",
  "duration": 89.61,
  "sha256": "40ae7e19e3cfd6bfd20b520164243be5366141fffded5e6bc816283e2e8273a7",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-061": {
  "title": "Patreon Challenge 04",
  "file": "patreon-challenge-04.ogg",
  "source": "tallbeard",
  "duration": 103.66,
  "sha256": "5dac918bb645b120b52bad84a0e4b94070bcc17819100032cb74603165458602",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-062": {
  "title": "VGMA Challenge 20",
  "file": "vgma-challenge-20.ogg",
  "source": "tallbeard",
  "duration": 41.14,
  "sha256": "a97967e57acbb1db5de76e911cf69c9fa3664fe40485b3989d2c52b231841e51",
  "offset": 0,
  "style": "Technical"
 },
 "academy-063": {
  "title": "VGMA Challenge 19",
  "file": "vgma-challenge-19.ogg",
  "source": "tallbeard",
  "duration": 113.13,
  "sha256": "9375898755b92badbb3038519930b099148209c9154fd9f002089702b65ae83c",
  "offset": 0,
  "style": "Story"
 },
 "academy-064": {
  "title": "Cloak of Darkness STAGE 1",
  "file": "week-4---cloak-of-darkness-stage-1.ogg",
  "source": "tallbeard",
  "duration": 13.71,
  "sha256": "3a619657fde610e8d6da3209806e8520de8331f2a970ae51ab0d0dd6430fc491",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-065": {
  "title": "Three Red Hearts Deep Blue",
  "file": "three-red-hearts-deep-blue.ogg",
  "source": "tallbeard",
  "duration": 105.97,
  "sha256": "897acab5ec5b2780e1436669b99383bb1bf86e8060e4d0aff090654c6d022004",
  "offset": 0,
  "style": "Technical"
 },
 "academy-066": {
  "title": "VGMA Challenge 10",
  "file": "vgma-challenge-10.ogg",
  "source": "tallbeard",
  "duration": 17.3,
  "sha256": "2beffebf94d1ea884b4aee929befbe2b8f7bb6fe9422e973cc1535c850f3bb48",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-067": {
  "title": "Patreon Challenge 10_04",
  "file": "patreon-challenge-10_04.ogg",
  "source": "tallbeard",
  "duration": 22.59,
  "sha256": "2420dc61026bce0a807c454c61be90361b5eab3c4f3c709cda1c9306bf8c8055",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-068": {
  "title": "Sketchbook 2025-11-26",
  "file": "sketchbook-2025-11-26.ogg",
  "source": "tallbeard",
  "duration": 70.59,
  "sha256": "9eeeada5256026c1c2335282b5fb99216cc1ad34e4d5c7ff214231a7ee418393",
  "offset": 0,
  "style": "Story"
 },
 "academy-069": {
  "title": "Primordial Soup MELODY",
  "file": "week-13---primordial-soup-melody.ogg",
  "source": "tallbeard",
  "duration": 32.84,
  "sha256": "d43a191e263a3b455c22863f72781b208ce01d509801424245d38e3240b52af2",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-070": {
  "title": "Three Red Hearts Penguins vs Rabbits",
  "file": "three-red-hearts-penguins-vs-rabbits.ogg",
  "source": "tallbeard",
  "duration": 61.43,
  "sha256": "7b70d85f4ba1a8b169b68e4f85d4c7aa67a95cca3dbcd39b8454dc0b09e883c0",
  "offset": 0,
  "style": "Technical"
 },
 "academy-071": {
  "title": "Distant Skyline CITY LIGHTS",
  "file": "week-18---distant-skyline-city-lights.ogg",
  "source": "tallbeard",
  "duration": 24.3,
  "sha256": "2bdcebdc8d127dcca4b427cdd5f81423b95c469cfeee8c3a38b7332e4b8dd324",
  "offset": 0,
  "style": "Story"
 },
 "academy-072": {
  "title": "VGMA Challenge 06",
  "file": "vgma-challenge-06.ogg",
  "source": "tallbeard",
  "duration": 23.41,
  "sha256": "4319f5e856bcba236ae687b3e10a7943865c6735573dcfbc42a0835b783a1d1a",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-073": {
  "title": "VGMA Challenge 02",
  "file": "vgma-challenge-02.ogg",
  "source": "tallbeard",
  "duration": 20.87,
  "sha256": "45b8ba2070827c77403bed038dc9585f5dd26f0c65a16dec89207864d93c934d",
  "offset": 0,
  "style": "Story"
 },
 "academy-074": {
  "title": "LD 03",
  "file": "ludum-dare-28-03.ogg",
  "source": "tallbeard",
  "duration": 132.43,
  "sha256": "61d92d41e0638cbd7b9cc418b0b80ba602f67b490c254b2c9afffc0eaa4539aa",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-075": {
  "title": "The Walking Dunes UNBLINKING SUN",
  "file": "week-22---the-walking-dunes-unblinking-sun.ogg",
  "source": "tallbeard",
  "duration": 15,
  "sha256": "be693bce378ba0ac7202b98e7ce93f4f6fbbc49388e1eeb5872dc7fad4da556a",
  "offset": 0,
  "style": "Technical"
 },
 "academy-076": {
  "title": "Have A Great Summer POOL PARTY",
  "file": "week-25---have-a-great-summer-pool-party.ogg",
  "source": "tallbeard",
  "duration": 32,
  "sha256": "6201bd85f4fa51fe1d116df657159566de11b76db24a50006ec673dd86a8cc2a",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-077": {
  "title": "Dusty Memories",
  "file": "week-27---dusty-memories.ogg",
  "source": "tallbeard",
  "duration": 43.37,
  "sha256": "48c47913e38a7d8f077f7883cc97c5ae96ee1e28f4d8c175261bd6f2383e79c7",
  "offset": 0,
  "style": "Story"
 },
 "academy-078": {
  "title": "LD 01",
  "file": "ludum-dare-32-01.ogg",
  "source": "tallbeard",
  "duration": 48.01,
  "sha256": "a99c5b40980db63ee2b2497722af9fffb52ed97cd3190be5390b16038775ea6e",
  "offset": 0,
  "style": "Technical"
 },
 "academy-079": {
  "title": "Primordial Soup JANGLES",
  "file": "week-13---primordial-soup-jangles.ogg",
  "source": "tallbeard",
  "duration": 32.84,
  "sha256": "779b57a673b96668531709be1e07522a3d12c51c8bbc967b965420591b1bb670",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-080": {
  "title": "Crushing It SMOOV",
  "file": "week-30---crushing-it-smoov.ogg",
  "source": "tallbeard",
  "duration": 18.31,
  "sha256": "38c84cd8b52b1337260d10185c9918efbdeb7e99f2d068c06ddbe0f053e9716e",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-081": {
  "title": "Primordial Soup BASE",
  "file": "week-13---primordial-soup-base.ogg",
  "source": "tallbeard",
  "duration": 32.84,
  "sha256": "6f6c4c9b2744a9210488064603c9259c37d9421a8e562ce35a568c1ec7d8f817",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-082": {
  "title": "Hypnotize Me BREAK",
  "file": "week-12---hypnotize-me-break.ogg",
  "source": "tallbeard",
  "duration": 25.26,
  "sha256": "d227d9d517626cb650a5792b3ab5e0a5feb8497f6663be2237d7e4e672ef1cfd",
  "offset": 0,
  "style": "Story"
 },
 "academy-083": {
  "title": "LD 04",
  "file": "ludum-dare-32-04.ogg",
  "source": "tallbeard",
  "duration": 32,
  "sha256": "d75205d1ef620ec5ed34ad376ae2853e4d19d171c589ea84d727f547f70849a3",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-084": {
  "title": "Three Red Hearts Modern Bits",
  "file": "three-red-hearts-modern-bits.ogg",
  "source": "tallbeard",
  "duration": 128.16,
  "sha256": "b31c4dfc4ccfd880d8103789b7ac860f7d6ab9ccd45641220bbef2fb30ce8dc3",
  "offset": 0,
  "style": "Technical"
 },
 "academy-085": {
  "title": "Sketchbook 2025-12-03",
  "file": "sketchbook-2025-12-03.ogg",
  "source": "tallbeard",
  "duration": 44.02,
  "sha256": "bca2eb32185f4fe8d11e34b5be7df556e89f55bb23f323eff06d3f971b301a4c",
  "offset": 0,
  "style": "Story"
 },
 "academy-086": {
  "title": "LD 07",
  "file": "ludum-dare-28-07.ogg",
  "source": "tallbeard",
  "duration": 107.66,
  "sha256": "32e090a484854d50c7cf76621b9fc4b20b222f674f0b69d75a0bbdddd6b3951f",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-087": {
  "title": "Heart-Shaped PALPATATIONS",
  "file": "week-29---heart-shaped-palpatations.ogg",
  "source": "tallbeard",
  "duration": 22.74,
  "sha256": "65bbea508cf782d976f643f95952fc8421f7fbb318e085ae149cf05969d181df",
  "offset": 0,
  "style": "Technical"
 },
 "academy-088": {
  "title": "Sketchbook 2024-04-24_01",
  "file": "sketchbook-2024-04-24_01.ogg",
  "source": "tallbeard",
  "duration": 72,
  "sha256": "875b4368dc338807cbe10306196efaccb8bf4d0eeb7fcb8d33641e53fafc7d5d",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-089": {
  "title": "Patreon Challenge 09",
  "file": "patreon-challenge-09.ogg",
  "source": "tallbeard",
  "duration": 108.1,
  "sha256": "354753b564c2124f615e4cb5a22addb9d6eb4acaa67e2a034f2d7d72fb432685",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-090": {
  "title": "LD 02",
  "file": "ludum-dare-28-02.ogg",
  "source": "tallbeard",
  "duration": 144.06,
  "sha256": "f31b612a8a4ec290bf350af8b36ba23cc521163ecda22f25e63be9e131107159",
  "offset": 0,
  "style": "Story"
 },
 "academy-091": {
  "title": "Three Red Hearts Puzzle Pieces",
  "file": "three-red-hearts-puzzle-pieces.ogg",
  "source": "tallbeard",
  "duration": 91.21,
  "sha256": "118f04c06a472e976fe133324e16f09d4cf060527cfe9fefa6ab187195b54adc",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-092": {
  "title": "Sketchbook 2025-12-11_NEURO",
  "file": "sketchbook-2025-12-11_neuro.ogg",
  "source": "tallbeard",
  "duration": 20.87,
  "sha256": "6abdb4fbed3299eb2e0e2b412dfd4f21a1f7b92342db66ef1ef760e889bc353f",
  "offset": 0,
  "style": "Technical"
 },
 "academy-093": {
  "title": "Three Red Hearts Go (No Vocal)",
  "file": "three-red-hearts-go-no-vocal.ogg",
  "source": "tallbeard",
  "duration": 70.6,
  "sha256": "edc763be382df129a084d81423977353aef69c7c7ec331903e3e76dc11360929",
  "offset": 0,
  "style": "Story"
 },
 "academy-094": {
  "title": "VGMA Challenge 01",
  "file": "vgma-challenge-01.ogg",
  "source": "tallbeard",
  "duration": 39,
  "sha256": "e01e3a6d19ca941d6c8bf5913bfcc726c275b9869907f092538595398baf1b7f",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-095": {
  "title": "Mischief ZOOMIES",
  "file": "week-10---mischief-zoomies.ogg",
  "source": "tallbeard",
  "duration": 8.35,
  "sha256": "9b37942aae591ab909ffd5b638621ffe76824f38376de493196523a6419fd964",
  "offset": 0,
  "style": "Technical"
 },
 "academy-096": {
  "title": "Sketchbook 2025-11-13",
  "file": "sketchbook-2025-11-13.ogg",
  "source": "tallbeard",
  "duration": 224,
  "sha256": "7e3ba34ab16e66a83983f594f92bdb973e77242abd89092116dee05853da96ef",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-097": {
  "title": "Freefall GLIDE",
  "file": "week-21---freefall-glide.ogg",
  "source": "tallbeard",
  "duration": 15,
  "sha256": "d2ee7e1a0aa29958da61ed895df2ccbf8317415123e02aaa82ed5bcb1373415b",
  "offset": 0,
  "style": "Story"
 },
 "academy-098": {
  "title": "Three Red Hearts Candy",
  "file": "three-red-hearts-candy.ogg",
  "source": "tallbeard",
  "duration": 52.17,
  "sha256": "764105cdbd830645fe13060009f00179be5c16212d356199bebae533eb840e23",
  "offset": 0,
  "style": "Technical"
 },
 "academy-099": {
  "title": "LD 06",
  "file": "ludum-dare-38-06.ogg",
  "source": "tallbeard",
  "duration": 60,
  "sha256": "0804131eae5feab25a449528e27eba4aa6ea3fe3502120b2ebf80f3267d90d3e",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-100": {
  "title": "Seaside CORAL REEF",
  "file": "week-26---seaside-coral-reef.ogg",
  "source": "tallbeard",
  "duration": 53.33,
  "sha256": "d7088e040aa5ebe07769662aa5e31ed91ca32322c7572e172bc9cb37a7810a89",
  "offset": 0,
  "style": "Story"
 },
 "academy-101": {
  "title": "VGMA Challenge 31",
  "file": "vgma-challenge-31.ogg",
  "source": "tallbeard",
  "duration": 10.67,
  "sha256": "2e6efbdb8563f8a2527c2c997c8e9dd8b28ebcefb48fb2778290ed6487904f8d",
  "offset": 0,
  "style": "Technical"
 },
 "academy-102": {
  "title": "Sketchbook 2024-02-07",
  "file": "sketchbook-2024-02-07.ogg",
  "source": "tallbeard",
  "duration": 84.71,
  "sha256": "50ea1270fa36cb21de66320c683a2ac296e84b8df8a14e027a6220ca296540ef",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-103": {
  "title": "Ruined Lands WASTELAND",
  "file": "week-2---ruined-lands-wasteland.ogg",
  "source": "tallbeard",
  "duration": 36,
  "sha256": "d58642bb2c30d9c35290625d8eab02fd82a94bbadae03520bd90ee43d4591205",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-104": {
  "title": "LD 09",
  "file": "ludum-dare-38-09.ogg",
  "source": "tallbeard",
  "duration": 32,
  "sha256": "b6b7d24ffe3cab7becc6ac3de0a44aa01668d8bc1608945857b4d63029942230",
  "offset": 0,
  "style": "Technical"
 },
 "academy-105": {
  "title": "LD 02",
  "file": "ludum-dare-38-02.ogg",
  "source": "tallbeard",
  "duration": 64,
  "sha256": "f353ebd48628ec349fe2b64f3f84653fbccf1bc86a8bd074e5e6c16f72fcd93b",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-106": {
  "title": "Patreon Challenge 10_02",
  "file": "patreon-challenge-10_02.ogg",
  "source": "tallbeard",
  "duration": 22.59,
  "sha256": "f18e01df3675a378a48dbb1fb046d668772d7e3a02ef1aba9c3f5ea1b25c1ddb",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-107": {
  "title": "Sketchbook 2024-02-14_L03",
  "file": "sketchbook-2024-02-14_l03.ogg",
  "source": "tallbeard",
  "duration": 98.46,
  "sha256": "a6f08aa59c98ab5f2ab2421f6f34700a1851200a7601b40eb6c24299aaa359cc",
  "offset": 0,
  "style": "Story"
 },
 "academy-108": {
  "title": "Three Red Hearts Connected",
  "file": "three-red-hearts-connected.ogg",
  "source": "tallbeard",
  "duration": 96.01,
  "sha256": "17e1fc2f73caa15a827f7a26de8102b20f2b059fc39032a94c4264029168ea79",
  "offset": 0,
  "style": "Story"
 },
 "academy-109": {
  "title": "Patreon Challenge 08",
  "file": "patreon-challenge-08.ogg",
  "source": "tallbeard",
  "duration": 62.44,
  "sha256": "1a96518350593ddf250e2d771a885269c695a2eb9db6222b905e4db7bb559a29",
  "offset": 0,
  "style": "Technical"
 },
 "academy-110": {
  "title": "VGMA Challenge 21",
  "file": "vgma-challenge-21.ogg",
  "source": "tallbeard",
  "duration": 16,
  "sha256": "ed06d240c09c942a6bee5d228841adaa6763ff0adf3aad444bc75735a21a973e",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-111": {
  "title": "Sketchbook 2025-12-11_VERSE",
  "file": "sketchbook-2025-12-11_verse.ogg",
  "source": "tallbeard",
  "duration": 20.87,
  "sha256": "bd591023da07f8d2364ced3cde737eef2e89d50ea47511a1a954dfdcdb69bf48",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-112": {
  "title": "Sketchbook 2024-07-04",
  "file": "sketchbook-2024-07-04.ogg",
  "source": "tallbeard",
  "duration": 58.67,
  "sha256": "9683fc65a6ad7b9c8c2ae246c339ad9f1582618a9ad35da7215a8f5531ce8ecf",
  "offset": 0,
  "style": "Technical"
 },
 "academy-113": {
  "title": "Sketchbook 2025-11-12",
  "file": "sketchbook-2025-11-12.ogg",
  "source": "tallbeard",
  "duration": 69.82,
  "sha256": "5db051df02a760ddc26aba2d684b68bfaba520acb186dbb87576772620ba9ab7",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-114": {
  "title": "Sketchbook 2024-05-29",
  "file": "sketchbook-2024-05-29.ogg",
  "source": "tallbeard",
  "duration": 43.83,
  "sha256": "247f8ef8e671db83d2cdb276efce6427bafa25c2912c1dfaa00effb0ab2c927a",
  "offset": 0,
  "style": "Brawl"
 },
 "academy-115": {
  "title": "VGMA Challenge 27",
  "file": "vgma-challenge-27.ogg",
  "source": "tallbeard",
  "duration": 19.73,
  "sha256": "d86e2624098fee6a3d9737e940a2c844a48f50aef4c94ca20fcffa4e7499a7c0",
  "offset": 0,
  "style": "Story"
 },
 "academy-116": {
  "title": "VGMA Challenge 14",
  "file": "vgma-challenge-14.ogg",
  "source": "tallbeard",
  "duration": 19.31,
  "sha256": "fac7445ed258605515e09ba12103799181f232112225839f2570ce9d15b2fcf7",
  "offset": 0,
  "style": "Story"
 },
 "academy-117": {
  "title": "VGMA Challenge 04",
  "file": "vgma-challenge-04.ogg",
  "source": "tallbeard",
  "duration": 16,
  "sha256": "a6cf619d917095c46271daf26786c0b39da81dc6a24b745ae4406f850c035e30",
  "offset": 0,
  "style": "Technical"
 },
 "academy-118": {
  "title": "Patreon Challenge 12",
  "file": "patreon-challenge-12.ogg",
  "source": "tallbeard",
  "duration": 36,
  "sha256": "7768d5a7d9c7cb1b20e6593011a9281f54fd13d7eeeae6211f91cb87000b94c7",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-119": {
  "title": "Three Red Hearts Pixel War 1",
  "file": "three-red-hearts-pixel-war-1.ogg",
  "source": "tallbeard",
  "duration": 53.34,
  "sha256": "b99ddc5e99d9ff2847a163e0a549349f7d3d228ae79503912b5d354f4ab832bf",
  "offset": 0,
  "style": "Spectacle"
 },
 "academy-120": {
  "title": "VGMA Challenge 11",
  "file": "vgma-challenge-11.ogg",
  "source": "tallbeard",
  "duration": 21.33,
  "sha256": "4e1018e86f13f7fb0bda1bdc33b9963d95bc8d08bc32cc7de188bb407e31e3b0",
  "offset": 0,
  "style": "Brawl"
 },
 "ace": {
  "title": "Three Red Hearts Pixel War 2",
  "file": "three-red-hearts-pixel-war-2.ogg",
  "source": "tallbeard",
  "duration": 53.33,
  "sha256": "a180e8ad34e5500bf7e546fbc2961086915df787e4a7cd32fe96678146ee46ce",
  "offset": 0,
  "style": "Spectacle"
 },
 "aisha": {
  "title": "Three Red Hearts Rabbit Town",
  "file": "three-red-hearts-rabbit-town.ogg",
  "source": "tallbeard",
  "duration": 45.47,
  "sha256": "8cc1b2b7fb05c531107bbc8add42a209ac5e447f7915d2e5b6f7bee0c5d151f4",
  "offset": 0,
  "style": "Brawl"
 },
 "alina": {
  "title": "Three Red Hearts Rumble at the Gates",
  "file": "three-red-hearts-rumble-at-the-gates.ogg",
  "source": "tallbeard",
  "duration": 90.93,
  "sha256": "e0ec072b0b7a86018bbbf5f9329dcc2e499c7e6ea582f136d7265f2fbf88c528",
  "offset": 0,
  "style": "Story"
 },
 "anya": {
  "title": "Crushing It ROUGH",
  "file": "week-30---crushing-it-rough.ogg",
  "source": "tallbeard",
  "duration": 18.31,
  "sha256": "5a415bcb9cb01d9eed3b8073b62765155ea4438a5d4b728f0699f7ea2fa91a6e",
  "offset": 0,
  "style": "Spectacle"
 },
 "ari": {
  "title": "Seaside ENDLESS WAVES",
  "file": "week-26---seaside-endless-waves.ogg",
  "source": "tallbeard",
  "duration": 26.67,
  "sha256": "39ba6c31b4f8c81cbe40214fb7a57bd2c3281cae2b9b4eeb18f94134c0da8b52",
  "offset": 0,
  "style": "Story"
 },
 "ash": {
  "title": "VGMA Challenge 15",
  "file": "vgma-challenge-15.ogg",
  "source": "tallbeard",
  "duration": 25.71,
  "sha256": "b80f5c1cef19a038153d3e40be9a93937d5c64121fb9372756aa843fbd400b4c",
  "offset": 0,
  "style": "Brawl"
 },
 "ayla": {
  "title": "Sketchbook 2024-12-26",
  "file": "sketchbook-2024-12-26.ogg",
  "source": "tallbeard",
  "duration": 64,
  "sha256": "62e163b0fcba5fb5560aa5473b485eed3311b33fc447da592183107dde24ea2b",
  "offset": 0,
  "style": "Story"
 },
 "bao": {
  "title": "Sketchbook 2024-08-07",
  "file": "sketchbook-2024-08-07.ogg",
  "source": "tallbeard",
  "duration": 56.47,
  "sha256": "f62db1552e9c8610abfd13963806b8141b7761ecc4c09c9cd36bae2ec3fa07d7",
  "offset": 0,
  "style": "Technical"
 },
 "bashir": {
  "title": "Dark Portents SHROUDED FUTURE",
  "file": "week-19---dark-portents-shrouded-future.ogg",
  "source": "tallbeard",
  "duration": 33.42,
  "sha256": "fa6b5a42c956b932f3f6e85e0f35aecc39a2ceec8aca14467164e1861a283614",
  "offset": 0,
  "style": "Brawl"
 },
 "brick": {
  "title": "LD 06",
  "file": "ludum-dare-30-06.ogg",
  "source": "tallbeard",
  "duration": 121.26,
  "sha256": "c965297f71d28595dcc1e6825f8c5eced1df6fa8e14e2cda1c714f2c139cfca3",
  "offset": 0,
  "style": "Brawl"
 },
 "bronte": {
  "title": "Mischief MELODY 2",
  "file": "week-10---mischief-melody-2.ogg",
  "source": "tallbeard",
  "duration": 8.35,
  "sha256": "3990ef17abdafa83ff96a93cae632c3b16988009d0d1d5e2b5a2472564b3b15e",
  "offset": 0,
  "style": "Brawl"
 },
 "cal": {
  "title": "Patreon Challenge 10_05",
  "file": "patreon-challenge-10_05.ogg",
  "source": "tallbeard",
  "duration": 22.59,
  "sha256": "255b28d2177ce1f5319080b8c1123f44cf5210eb9f8af96a74ab2f086791dae4",
  "offset": 0,
  "style": "Technical"
 },
 "cass": {
  "title": "Sketchbook 2024-10-16",
  "file": "sketchbook-2024-10-16.ogg",
  "source": "tallbeard",
  "duration": 75,
  "sha256": "79d9a74c328ca9dedb9ef06134ce32267386674ddc989ad98618691dc65e2717",
  "offset": 0,
  "style": "Story"
 },
 "cedric": {
  "title": "Seven Reasons Why ARP",
  "file": "week-5---seven-reasons-why-arp.ogg",
  "source": "tallbeard",
  "duration": 28,
  "sha256": "b7b9b0c36211cb0417d8ebc61bc7f6b5d1dbaacee2ca6b33770db4da0148dbb7",
  "offset": 0,
  "style": "Story"
 },
 "cleo": {
  "title": "Three Red Hearts Go",
  "file": "three-red-hearts-go.ogg",
  "source": "tallbeard",
  "duration": 70.59,
  "sha256": "c6af8497981f938578b2bc0fd9d7d2c270200b194360b5dd3e44df9c863b880b",
  "offset": 0,
  "style": "Technical"
 },
 "dax": {
  "title": "Alley Cat DUMPSTER DIVIN",
  "file": "week-17---alley-cat-dumpster-divin.ogg",
  "source": "tallbeard",
  "duration": 16.99,
  "sha256": "6599099af016e745e954cf2f8b404b1b5ad39e3946fb2c2f9d8b0201e5dd3315",
  "offset": 0,
  "style": "Story"
 },
 "dean": {
  "title": "LD 03",
  "file": "ludum-dare-30-03.ogg",
  "source": "tallbeard",
  "duration": 86.4,
  "sha256": "0478801fe02c751de5284fda3dde5e87e7a60733853237e249d23e57c67aaab3",
  "offset": 0,
  "style": "Story"
 },
 "dee": {
  "title": "Sketchbook 2024-02-21_02",
  "file": "sketchbook-2024-02-21_02.ogg",
  "source": "tallbeard",
  "duration": 30,
  "sha256": "093ca96891baa29d17eca2ffbd63b9f61cedacd68c93b7ee7dee279cd0deb506",
  "offset": 0,
  "style": "Technical"
 },
 "dev": {
  "title": "LD 06",
  "file": "ludum-dare-28-06.ogg",
  "source": "tallbeard",
  "duration": 149.92,
  "sha256": "7c1d5fc11ca660f222f75858f5d1f67d2a29c3816ea38350c012a07d923adb23",
  "offset": 0,
  "style": "Story"
 },
 "eira": {
  "title": "LD 07",
  "file": "ludum-dare-30-07.ogg",
  "source": "tallbeard",
  "duration": 65.14,
  "sha256": "82a0b2785b38accf5f16db4603f705f17525d644b90c75db34a44214f882429b",
  "offset": 0,
  "style": "Technical"
 },
 "ellis": {
  "title": "Dani Maccari Asset Pack - Jester's Distraction",
  "file": "dani-maccari-asset-pack---jester-s-distraction.ogg",
  "source": "tallbeard",
  "duration": 21.33,
  "sha256": "80201d27e3ba5349f5d196309f28aa4bb01f4190f4f0a94b71840a75e86065df",
  "offset": 0,
  "style": "Technical"
 },
 "elodie": {
  "title": "Sketchbook 2024-01-24_02",
  "file": "sketchbook-2024-01-24_02.ogg",
  "source": "tallbeard",
  "duration": 56,
  "sha256": "a0df26b6c1113242c09746f7ade014b19b957319d4a385130f02fd8af2ac000f",
  "offset": 0,
  "style": "Story"
 },
 "emmett": {
  "title": "VGMA Challenge 29",
  "file": "vgma-challenge-29.ogg",
  "source": "tallbeard",
  "duration": 30,
  "sha256": "e113ae54070778fc41dfba47f6c252df5f714bdf05502005d4ea8528a29e4f1a",
  "offset": 0,
  "style": "Technical"
 },
 "ezra": {
  "title": "Sketchbook 2024-12-15",
  "file": "sketchbook-2024-12-15.ogg",
  "source": "tallbeard",
  "duration": 45.18,
  "sha256": "1352e52076dfe37a6296c7d7966b42d9bd61aebf43c95a82c5bb9b23dcbe5c2c",
  "offset": 0,
  "style": "Technical"
 },
 "faye": {
  "title": "Seven Reasons Why MELODY",
  "file": "week-5---seven-reasons-why-melody.ogg",
  "source": "tallbeard",
  "duration": 28,
  "sha256": "b19efcb1a004f4232c9e1a18dd2c364de98a270383e875a087692586568bf28a",
  "offset": 0,
  "style": "Story"
 },
 "felix": {
  "title": "Alley Cat DUMPSTER PARTY",
  "file": "week-17---alley-cat-dumpster-party.ogg",
  "source": "tallbeard",
  "duration": 16.99,
  "sha256": "321fa28aca2ef6bb4b08bce4df2616df25db792e5973d4393ef0d0075a241102",
  "offset": 0,
  "style": "Story"
 },
 "gideon": {
  "title": "Sketchbook 2024-02-28_01",
  "file": "sketchbook-2024-02-28_01.ogg",
  "source": "tallbeard",
  "duration": 100.17,
  "sha256": "4ca38742e4d80220390700cb0305ce778995f638758e098697fa83c5a174f182",
  "offset": 0,
  "style": "Technical"
 },
 "gus": {
  "title": "VGMA Challenge 26",
  "file": "vgma-challenge-26.ogg",
  "source": "tallbeard",
  "duration": 28.93,
  "sha256": "5c762b3a64c165d6ed90940d23be3f5305944d68b17ba826904103821524fb53",
  "offset": 0,
  "style": "Brawl"
 },
 "imani": {
  "title": "VGMA Challenge 24",
  "file": "vgma-challenge-24.ogg",
  "source": "tallbeard",
  "duration": 17.45,
  "sha256": "58ef1415d7f4c7b35a967037c2232106a8dc2e1b110b5ce86dc171e2168c5143",
  "offset": 0,
  "style": "Technical"
 },
 "iris": {
  "title": "VGMA Challenge 13",
  "file": "vgma-challenge-13.ogg",
  "source": "tallbeard",
  "duration": 19.33,
  "sha256": "d4ee6b19fdf035b4efc9a750093e77bfb7e7360051d9a364a26c3f1c0d0c7bad",
  "offset": 0,
  "style": "Technical"
 },
 "ivo": {
  "title": "Heart-Shaped CANDY",
  "file": "week-29---heart-shaped-candy.ogg",
  "source": "tallbeard",
  "duration": 25.26,
  "sha256": "f8af05f5c2540975ddec8c8a7132149cb12a4c4607ed8c26ce53b19cb252d5dc",
  "offset": 0,
  "style": "Technical"
 },
 "jett": {
  "title": "LD 01",
  "file": "ludum-dare-38-01.ogg",
  "source": "tallbeard",
  "duration": 67.2,
  "sha256": "6a0ee6430c61a60cabc4fc2faf6b48f4d14a00ee47f7b03605fb3da4238693e9",
  "offset": 0,
  "style": "Spectacle"
 },
 "jun": {
  "title": "Shimmer SPARKLE",
  "file": "week-38---shimmer-sparkle.ogg",
  "source": "tallbeard",
  "duration": 50.09,
  "sha256": "e4e4cb9dec9cbda43f1b3aeb65d0d1ed636201934313c629709bb3c7fde69b04",
  "offset": 0,
  "style": "Technical"
 },
 "juno": {
  "title": "Week 1.1 - Super Retro Lounge",
  "file": "week-1.1---super-retro-lounge.ogg",
  "source": "tallbeard",
  "duration": 24,
  "sha256": "fc84b6b9b0dd8e533b1e7b561ea1ee19899d5784100b4e579c389b99d11745b1",
  "offset": 0,
  "style": "Technical"
 },
 "kellan": {
  "title": "Vacation Day ADVENTURE",
  "file": "week-16---vacation-day-adventure.ogg",
  "source": "tallbeard",
  "duration": 12.8,
  "sha256": "026bdbfcf0b956d6c20761219df0f0c52dc4ee86c1d8c0c337a2ef357c269979",
  "offset": 0,
  "style": "Spectacle"
 },
 "kezia": {
  "title": "Forbidden Luxuries HEALTHCARE",
  "file": "week-33---forbidden-luxuries-healthcare.ogg",
  "source": "tallbeard",
  "duration": 21.52,
  "sha256": "4e3b4d9dcfd3e887b520618733c5e68d5969c2da2cb8914695bb05ba0d9dba31",
  "offset": 0,
  "style": "Technical"
 },
 "kira": {
  "title": "Sketchbook 2024-03-30_01_L02",
  "file": "sketchbook-2024-03-30_01_l02.ogg",
  "source": "tallbeard",
  "duration": 48,
  "sha256": "81bec50c4167a22af3024714cae1900c6ac0dcb4c4e965ca5a770ec1a218c7dd",
  "offset": 0,
  "style": "Brawl"
 },
 "kit": {
  "title": "Vacation Day CHILLOUT",
  "file": "week-16---vacation-day-chillout.ogg",
  "source": "tallbeard",
  "duration": 12.8,
  "sha256": "cb7200fa26dd1b94451dec985c54ab569fe463d79222ba4fbd7a14ff823e8fbd",
  "offset": 0,
  "style": "Spectacle"
 },
 "kofi": {
  "title": "LD 09",
  "file": "ludum-dare-30-09.ogg",
  "source": "tallbeard",
  "duration": 55.58,
  "sha256": "a70365814d74f844abbf67d163947b175faae2e2d16bca18ac94b66ee7cef400",
  "offset": 0,
  "style": "Spectacle"
 },
 "leandro": {
  "title": "Mischief GROOVE",
  "file": "week-10---mischief-groove.ogg",
  "source": "tallbeard",
  "duration": 8.35,
  "sha256": "a743204861dbc06d83cc03916113a6060b4d51536bd0dc092a0efe0cb25b2bc5",
  "offset": 0,
  "style": "Spectacle"
 },
 "liya": {
  "title": "Mischief MELODY",
  "file": "week-10---mischief-melody.ogg",
  "source": "tallbeard",
  "duration": 8.35,
  "sha256": "ba5a2554bf94b3150f4fddfbe39b1eae29a9e8b1c1f7428c6e9d4a8aa9a2ab5b",
  "offset": 0,
  "style": "Spectacle"
 },
 "lyra": {
  "title": "Sketchbook 2024-09-22",
  "file": "sketchbook-2024-09-22.ogg",
  "source": "tallbeard",
  "duration": 67.76,
  "sha256": "0d943ef3091520bc7e47ebaa54a4298e6e66eb5db5fa17a248b36394663f99a8",
  "offset": 0,
  "style": "Spectacle"
 },
 "mae": {
  "title": "Piecemeal COLLECTED",
  "file": "week-34---piecemeal-collected.ogg",
  "source": "tallbeard",
  "duration": 28.8,
  "sha256": "183b3a5e196b74d13ae20277c2ab991bf52b13a332a01dc0702674f722eacd1a",
  "offset": 0,
  "style": "Story"
 },
 "magnus": {
  "title": "Sketchbook 2025-12-17_SOFT",
  "file": "sketchbook-2025-12-17_soft.ogg",
  "source": "tallbeard",
  "duration": 33.39,
  "sha256": "db09dcc1869d209ac5917fd237dd1edec2a5d5ae8f83bb82668243beb4c89cf6",
  "offset": 0,
  "style": "Brawl"
 },
 "malik": {
  "title": "Sketchbook 2024-06-19",
  "file": "sketchbook-2024-06-19.ogg",
  "source": "tallbeard",
  "duration": 61.54,
  "sha256": "a8ad37cb5148a3ee6ac0607ea6a0d6ebf826491d992c03bddc81981f03a8a652",
  "offset": 0,
  "style": "Brawl"
 },
 "mara": {
  "title": "Sketchbook 2024-01-24_01",
  "file": "sketchbook-2024-01-24_01.ogg",
  "source": "tallbeard",
  "duration": 98.18,
  "sha256": "8ed82dc394ff8603ebdeb0475c5896a5d84e667b6aa65ed728ca2bb8d25a5dfd",
  "offset": 0,
  "style": "Story"
 },
 "marisol": {
  "title": "Patreon Challenge 10_03",
  "file": "patreon-challenge-10_03.ogg",
  "source": "tallbeard",
  "duration": 22.59,
  "sha256": "a2bcd231d5450d9ecb3976ff5adf13518c93eaf05d51aa8215f9bf1958bc49fb",
  "offset": 0,
  "style": "Technical"
 },
 "milo": {
  "title": "Distant Skyline NIGHT DRIVE",
  "file": "week-18---distant-skyline-night-drive.ogg",
  "source": "tallbeard",
  "duration": 24.3,
  "sha256": "d1fd66893061282313acbc5ab3a6868571e3363fe5eaec2e9aac3d77187d3e5a",
  "offset": 0,
  "style": "Spectacle"
 },
 "miro": {
  "title": "Sketchbook 2024-07-07",
  "file": "sketchbook-2024-07-07.ogg",
  "source": "tallbeard",
  "duration": 55.89,
  "sha256": "6677a7058c8be0084493c2be171c676b111af58fc8b9faef3cb9f5f075e02dbc",
  "offset": 0,
  "style": "Story"
 },
 "morgan": {
  "title": "The Vile Grove",
  "file": "the-vile-grove.ogg",
  "source": "tallbeard",
  "duration": 119.23,
  "sha256": "3986b2641b290c1b5bfe19f93ad326b0e0acffc96d9d74bb72f0e4bbecf8f8e4",
  "offset": 0,
  "style": "Story"
 },
 "nadia": {
  "title": "Interior Birdecorator Decorate",
  "file": "interior-birdecorator-decorate.ogg",
  "source": "tallbeard",
  "duration": 87.27,
  "sha256": "f641114df7624b20064e169caea8e77d61ec898c29f7cb819c5938e9c086729a",
  "offset": 0,
  "style": "Spectacle"
 },
 "nate": {
  "title": "Sketchbook 2024-04-10",
  "file": "sketchbook-2024-04-10.ogg",
  "source": "tallbeard",
  "duration": 101.65,
  "sha256": "6572d6dd2857b3f46015d538a27dc95d6eb005937f5beb866885a979194b5cb2",
  "offset": 0,
  "style": "Brawl"
 },
 "nico": {
  "title": "Life Is Hard BASE",
  "file": "week-7---life-is-hard-base.ogg",
  "source": "tallbeard",
  "duration": 14.77,
  "sha256": "99599f1fb6999938ac30bf15b651df81e00fd03c26db2a5de66cee309491e6c7",
  "offset": 0,
  "style": "Spectacle"
 },
 "night": {
  "title": "VGMA Challenge 28",
  "file": "vgma-challenge-28.ogg",
  "source": "tallbeard",
  "duration": 37.33,
  "sha256": "8e4a8ca12e1f31294cf9570911bac4694c8654be5f46defb165fc83aae8b7db9",
  "offset": 0,
  "style": "Spectacle"
 },
 "nikita": {
  "title": "Sketchbook 2024-10-13",
  "file": "sketchbook-2024-10-13.ogg",
  "source": "tallbeard",
  "duration": 118.15,
  "sha256": "1d01c2398fe4ab70e34343226f02a1ef4fe5822b4ddc23fe7c386bac4181b8eb",
  "offset": 0,
  "style": "Brawl"
 },
 "noelle": {
  "title": "LD 05",
  "file": "ludum-dare-38-05.ogg",
  "source": "tallbeard",
  "duration": 55.99,
  "sha256": "be96f927f507b90a95e1eef2e5ab4361e00cfbd7a49082495df4d24ca35ad870",
  "offset": 0,
  "style": "Technical"
 },
 "nolan": {
  "title": "VGMA Challenge 25",
  "file": "vgma-challenge-25.ogg",
  "source": "tallbeard",
  "duration": 24,
  "sha256": "253a4ace6ca5c0e25baaa2937ef1fe31782505c1595f224bf6f3fbe2f080dc22",
  "offset": 0,
  "style": "Brawl"
 },
 "nova": {
  "title": "Schmoovin",
  "file": "week-37---schmoovin.ogg",
  "source": "tallbeard",
  "duration": 33.68,
  "sha256": "076d06a68ce9dc8f7d2401afa05e247ad3849ac4d425c3b28f995c15bfdab007",
  "offset": 0,
  "style": "Technical"
 },
 "otis": {
  "title": "Sketchbook 2024-02-14_L02",
  "file": "sketchbook-2024-02-14_l02.ogg",
  "source": "tallbeard",
  "duration": 49.23,
  "sha256": "1e25787a258873a6433034299a95c2996a32c8344ecbb403928e99aecb5c30ce",
  "offset": 0,
  "style": "Brawl"
 },
 "priya": {
  "title": "Sketchbook 2024-11-20",
  "file": "sketchbook-2024-11-20.ogg",
  "source": "tallbeard",
  "duration": 75.79,
  "sha256": "9c3902f0c83e52027599266f3188260a617a380e7aad19b89469c38699f93d53",
  "offset": 0,
  "style": "Story"
 },
 "red": {
  "title": "VGMA Challenge 16",
  "file": "vgma-challenge-16.ogg",
  "source": "tallbeard",
  "duration": 29.5,
  "sha256": "826ab4c23f4a6d7bac645779a1ae38caaa55a27c7c069ed411a1117563639d0a",
  "offset": 0,
  "style": "Brawl"
 },
 "rev": {
  "title": "LD 08",
  "file": "ludum-dare-38-08.ogg",
  "source": "tallbeard",
  "duration": 68.57,
  "sha256": "4cee5b2ce8752d79b1577dc0a561601c9ecc076437cdffae284d442d7fd0cdc6",
  "offset": 0,
  "style": "Story"
 },
 "rex": {
  "title": "Reverence BEHOLD",
  "file": "week-35---reverence-behold.ogg",
  "source": "tallbeard",
  "duration": 34.7,
  "sha256": "2de0d0724b5dd47834eca6283bb45150888e5313815e0c3d2cc214619eba1df1",
  "offset": 0,
  "style": "Brawl"
 },
 "rina": {
  "title": "Sketchbook 2024-06-05_01",
  "file": "sketchbook-2024-06-05_01.ogg",
  "source": "tallbeard",
  "duration": 38.4,
  "sha256": "9a5d9da666b74c4eac1a70443d066bbb6612d21225a419994c89c1351b54477a",
  "offset": 0,
  "style": "Spectacle"
 },
 "rocco": {
  "title": "LD 01",
  "file": "ludum-dare-30-01.ogg",
  "source": "tallbeard",
  "duration": 99.74,
  "sha256": "bdc54fb8ddd65829043827206b4a3f5f3a8f43613aabd050900ee7806257c91b",
  "offset": 0,
  "style": "Brawl"
 },
 "roxy": {
  "title": "Homesteading MOVING IN",
  "file": "week-39---homesteading-moving-in.ogg",
  "source": "tallbeard",
  "duration": 28.24,
  "sha256": "8dd3b514bd84f1a3f475fb346c973f18b453208175578026190d8251f40227d3",
  "offset": 0,
  "style": "Story"
 },
 "sasha": {
  "title": "Patreon Challenge 06",
  "file": "patreon-challenge-06.ogg",
  "source": "tallbeard",
  "duration": 48,
  "sha256": "c37aac3f9c0420fede9f6d245ffbbdb6d47137fcb6883b4ef1096687bcb966f8",
  "offset": 0,
  "style": "Spectacle"
 },
 "silas": {
  "title": "LD 03",
  "file": "ludum-dare-38-03.ogg",
  "source": "tallbeard",
  "duration": 62.12,
  "sha256": "bb1a7441809fa198c0513630247582d45acf64d48ca72a8395616f230fc47f38",
  "offset": 0,
  "style": "Technical"
 },
 "sol": {
  "title": "VGMA Challenge 18",
  "file": "vgma-challenge-18.ogg",
  "source": "tallbeard",
  "duration": 30.63,
  "sha256": "6ef8b89eafb935e1d71aa7d974bf26c48f358848259e142def9ef2d7d28fcb83",
  "offset": 0,
  "style": "Story"
 },
 "soraya": {
  "title": "VGMA Challenge 05",
  "file": "vgma-challenge-05.ogg",
  "source": "tallbeard",
  "duration": 30.33,
  "sha256": "6a349d7b782681221ec082f5df3442a4437cfe41a9c65f53a0c9739cd776484d",
  "offset": 0,
  "style": "Brawl"
 },
 "sylvia": {
  "title": "LD 05",
  "file": "ludum-dare-32-05.ogg",
  "source": "tallbeard",
  "duration": 63.72,
  "sha256": "192c9939cc4e1bd135b67bc953118675f53bb7d055a70389a16f9bb1c50fa78a",
  "offset": 0,
  "style": "Brawl"
 },
 "theo": {
  "title": "Sunburn BEACH HOUSE",
  "file": "week-15---sunburn-beach-house.ogg",
  "source": "tallbeard",
  "duration": 21.82,
  "sha256": "f5c5cc0ecddeae67f813fb5b1356123464e1aeb5d3abcc806847d93cb44358e3",
  "offset": 0,
  "style": "Technical"
 },
 "tomas": {
  "title": "VGMA Challenge 12",
  "file": "vgma-challenge-12.ogg",
  "source": "tallbeard",
  "duration": 23,
  "sha256": "925129c45abc5c65306d7636b6e7d48350fd2c97eeaa49ca823678a5daa1185a",
  "offset": 0,
  "style": "Story"
 },
 "tomasash": {
  "title": "Defender of the Clouds",
  "file": "troubadeck-48-defender-of-the-clouds.ogg",
  "source": "tallbeard",
  "duration": 40.42,
  "sha256": "58ed99e2362dffb98f9b6345f17d34cf8ba3f3714237deaaa44344f9ee87a309",
  "offset": 0,
  "style": "Brawl"
 },
 "tori": {
  "title": "Sketchbook 2024-10-26",
  "file": "sketchbook-2024-10-26.ogg",
  "source": "tallbeard",
  "duration": 48,
  "sha256": "0458286918ccd51edc38d093aaca73c5cc404de057d401f106e93f21f511576b",
  "offset": 0,
  "style": "Spectacle"
 },
 "val": {
  "title": "Hare-Raising Tale",
  "file": "troubadeck-29-hare-raising-tale.ogg",
  "source": "tallbeard",
  "duration": 40.42,
  "sha256": "318b363d1fbf9563659372abce0974a19e706a18864c094faababd517e140fb0",
  "offset": 0,
  "style": "Brawl"
 },
 "vera": {
  "title": "Sketchbook 2025-12-17_CHILL",
  "file": "sketchbook-2025-12-17_chill.ogg",
  "source": "tallbeard",
  "duration": 33.39,
  "sha256": "bf92a7dab74c1d461c6f85f34137d480479418ee0a4d65149ee9c014d803c455",
  "offset": 0,
  "style": "Technical"
 },
 "winnie": {
  "title": "Sunburn SPF 3000",
  "file": "week-15---sunburn-spf-3000.ogg",
  "source": "tallbeard",
  "duration": 10.91,
  "sha256": "9b4ed0ff61bec535bbc303055c0902db868ba5f0e48ceb42627788d8b1ea9615",
  "offset": 0,
  "style": "Technical"
 },
 "zane": {
  "title": "Soldier's Lament",
  "file": "troubadeck-23-soldier-s-lament.ogg",
  "source": "tallbeard",
  "duration": 40.42,
  "sha256": "3ec5430609d757b911d5f9da330293a4e6cc61114e15ff55b8d53ed7e3cb5a0d",
  "offset": 0,
  "style": "Brawl"
 },
 "zara": {
  "title": "Sketchbook 2024-08-21",
  "file": "sketchbook-2024-08-21.ogg",
  "source": "tallbeard",
  "duration": 65.45,
  "sha256": "25379fcf124a57aa3a64ae076893eb2f61c3311125d68be3d7ab09aaa450b23c",
  "offset": 0,
  "style": "Spectacle"
 }
});
root.OfficeRingEntranceMusic=Object.freeze({assignments,resolve(id){const t=assignments[id];return t?{...t,duration:12,offset:0,url:'assets/audio/entrances/'+encodeURIComponent(id)+'.mp3',license:'CC0-1.0'}:null;}});
})(typeof window!=='undefined'?window:globalThis);
