# Age portrait atlases

Ten lossless WebP sheets hold three consecutive portraits per character: young,
middle and old. Each cell is 144 × 180 pixels. Each sheet is 9 columns by
8 rows. The mapping is generated in `assets/js/portrait-age-map.js`.

Wrestlers use their actual saved age, including free agents and wrestlers in
other stables. They switch to middle at 30 and old at 42. The career engine
ages them at the end of each 16-week season. Promoters, rival managers, the
player manager and Dennis currently have no age field in career saves, so
`assets/js/portraits.js` gives each an initial visual age and advances it
with completed seasons. Staff use middle from 38 and old from 55.

All 80 starting wrestlers and 27 current staff have variants. Another 120
named academy wrestlers (60 women, 60 men) have portraits and join in
career-specific order as seasons pass. The annual intake aims for four to
eight rookies when vacancies allow, with a cap of 84 active wrestlers. The first intake
comes at the start of season two. They join the free agent market before
rival managers can recruit them, and their profile and debut stay in the
career save. Original portraits remain as fallback art. Existing saves and
portrait selection indexes require no migration.

To replace the artwork later, maintain the same character IDs and adjacent
young/middle/old slots. Run
`python tools/import_age_atlases.py /path/to/portrait-pack` after installing
Pillow. The full source pack has the individual PNGs and source atlas PNGs;
the manifest here records their IDs, positions and hashes. The imported
WebP files preserve every opaque pixel and alpha value from the PNG sheets.
