# Phase 4C — reserve artwork gate

The original 80 portrait files remain the baseline. The reserve bank is empty until the first artwork batch is approved. No game runtime integration.

Run from the repository root:
```sh
python -m pip install -r tools/portrait-audit/requirements.txt
python tools/portrait-audit/audit.py self-test
python tools/portrait-audit/audit.py screen --candidates /path/to/six-portraits --out /tmp/portrait-report
```
Review report.html and pairs.csv. Compare each candidate against all 80 originals and all approved reserves, including within-batch pairs. Exact/pixel hashes, perceptual hashes of full and head-region images, SIFT and affine RANSAC in both directions and mirrored orientations. Thresholds match the earlier standalone calibration: BLOCK exact/15 aligned features/full pHash <=5; REVIEW 8 aligned features/full pHash <=12/head pHash <=10. A LOW score does not prove a face is unique; the visual approval remains mandatory. Original calibration on five supplied reference images detected all three known duplicates, but it was not a full validation of independent redraws.

Accepted files go into assets/academy/portraits, named academy-001 through academy-120, at native 144x180 with transparent RGBA. Add their file SHA-256 and explicit visual_approved:true to manifest.json only after review. The approved set is immutable by default. A non-exact flagged false positive needs a documented pair-specific waiver keyed by the two sorted SHA-256 values joined by a colon, with visual_distinct:true and a meaningful reason. Exact duplicates cannot be waived. Never waive a genuine duplicate.

The existing simulation workflow installs the Python dependencies only on changes to the artwork bank, original portraits, or this tool, or on a manual full audit. Ordinary game code and docs don't run the artwork audit. New additions are compared with the complete prior bank; if the baseline or matcher changes or prior waivers change, rescreen all reserve portraits. A gate failure includes an HTML/JSON/CSV artifact when the comparisons completed.

No portrait may be counted as accepted until explicitly reviewed. This is a similarity screen, not a guarantee of character identity.
