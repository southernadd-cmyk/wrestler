#!/usr/bin/env bash
# Route UI changes by changed lines, not by the presence of the entire
# monolithic ui.js in the diff. Engine files retain their separate checks.
set -euo pipefail
base="$1"
head="$2"
# Pure changes to the poster portrait renderer have their own fast tests.
# Compare both versions outside the function so mixed edits cannot take this path.
if cmp -s <(git show "$base:assets/js/ui.js" | sed '/^function posterFace(/,/^}/d') \
          <(git show "$head:assets/js/ui.js" | sed '/^function posterFace(/,/^}/d'); then
  printf '%s\n' tests/portrait-v4.test.cjs tests/portrait-ageing.test.cjs
  exit 0
fi
# Match changed lines only, plus the actual enclosing top-level function
# on each side. Never match unchanged neighbours or Git's hunk labels.
old="$(git show "$base:assets/js/ui.js")"
new="$(git show "$head:assets/js/ui.js")"
patch="$(git diff --unified=0 "$base" "$head" -- assets/js/ui.js)"
diff="$(awk '
  FILENAME==ARGV[1] {if ($0 ~ /^function /) fn=$0; oldfn[FNR]=fn; if ($0 ~ /^}/) fn=""; next}
  FILENAME==ARGV[2] {if (FNR==1) fn=""; if ($0 ~ /^function /) fn=$0; newfn[FNR]=fn; if ($0 ~ /^}/) fn=""; next}
  /^@@ / {split($2,a,","); split($3,b,","); o=-(a[1]+0); n=b[1]+0; next}
  /^--- / || /^\+\+\+ / {next}
  /^-/ {print substr($0,2); print oldfn[o++]; next}
  /^\+/ {print substr($0,2); print newfn[n++]; next}
' <(printf '%s\n' "$old") <(printf '%s\n' "$new") <(printf '%s\n' "$patch"))"
has() { grep -Ei "$1" <<< "$diff" >/dev/null; }
if has 'portrait|posterFace|OfficePortraits|playerPortrait'; then
  printf '%s\n' tests/portrait-v4.test.cjs
fi
if has 'showPromos|showSegment|showMouthpiece|OfficeMic|OfficeSegments|OfficeMouthpiece|data-mic|data-segment|data-mouth|promoLoading|[.]promo[.]'; then
  printf '%s\n' tests/promo-flow.test.cjs tests/promo-selection.test.cjs
fi
if has 'showMeeting|OfficeRoom|OfficeSheets|data-room|data-structure|structureChoice|[.]plan[.]|[.]sheet[.]'; then
  printf '%s\n' tests/structure-career-activation.test.cjs
fi
if has 'showAfter|OfficeAfter|data-after|afterTalk'; then
  printf '%s\n' tests/after-bell-choice.test.cjs
fi
if has 'settle|endNight|endWeek|finishNight|finalize|resultIds|applyResult|matchConsequence'; then
  printf '%s\n' tests/match-consequence-integrity.test.cjs
fi
if has 'cash|signWrestler|[.]sign\(|[.]release\(|earlyCareer|advanceWeek|confirm-start-night'; then
  printf '%s\n' tests/early-career-finances.test.cjs
fi
if has 'OfficeNegotiation|data-talkbook|data-talkaction|renderBooking|acceptOffer|rejectOffer'; then
  printf '%s\n' tests/booking-office.test.cjs tests/negotiations-v2.test.cjs
fi
if has 'OfficeTraining|data-train|data-intensity|renderTraining'; then
  printf '%s\n' tests/training-intelligence.test.cjs
fi
# Always retain a cheap behavioural safety net for non-portrait JS changes,
# including changes to previously unrecognised handlers.
printf '%s\n' tests/match-flow.test.cjs
