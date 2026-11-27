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
diff="$(git diff --unified=3 "$base" "$head" -- assets/js/ui.js)"
# Include nearby context and hunk labels so edits to handlers route to their
# domain even when the actual changed line is a short expression.
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
