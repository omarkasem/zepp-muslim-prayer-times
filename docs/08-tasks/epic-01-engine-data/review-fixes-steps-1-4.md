# Review fixes — Epic 01, Steps 1–4

Steps 1–4 are mostly good and all 14 tests pass, but a code review found one real bug and a couple of
cleanups. Fix all of these, re-run `npm test` (must stay green), then continue to Step 5. Do NOT expand
scope beyond these fixes.

---

## Fix 1 (REQUIRED — real bug): unify `highLatRule` values across all modules

The high-latitude rule is spelled three different ways in three places, so the feature is silently broken:
- `shared/storage-helpers.js` accepts `['none', 'middleOfTheNight', 'seventhOfTheNight', 'angleBased']`
- `shared/prayer-times.js` checks `'angle_based' || 'angleBased'` and `'one_seventh' || 'oneSeventh'` (never `'seventhOfTheNight'`)
- The product specs use snake_case: `none`, `middle_of_night`, `one_seventh`, `angle_based`

This causes: (a) the `one_seventh` rule falls through to the middle-of-night branch, and (b) once the
Settings screen writes snake_case values, `sanitizeSettings` will reject them and reset to `none`.

**Do this:** standardize on the snake_case set everywhere — the canonical values are exactly:
`none`, `middle_of_night`, `one_seventh`, `angle_based`.
- In `shared/storage-helpers.js`: change the `rules` array to `['none', 'middle_of_night', 'one_seventh', 'angle_based']`.
- In `shared/prayer-times.js`: make the branches check ONLY the canonical values — `angle_based` and
  `one_seventh` — and drop the dual-spelling `|| 'angleBased'` / `|| 'oneSeventh'` fallbacks. Keep
  `middle_of_night` as the default portion (1/2).
- Add a unit test in `shared/prayer-times.test.js`: for the same high-latitude location/date, `one_seventh`
  and `middle_of_night` must produce **different** Fajr/Isha (proves `one_seventh` is no longer silently
  treated as middle-of-night).

## Fix 2 (REQUIRED — cleanup): scratch files

- **Delete `scratch-compare.js`** — it's an unused manual debug script (DoD: no debug leftovers).
- **Move `scratch-praytimes.js`** (it's the vendored PrayTimes reference used by the test) to
  `shared/__tests__/praytimes-reference.js`, and update the path in `shared/prayer-times.test.js` to match.
  Keep its LGPL copyright header intact. It must remain test-only (never imported by app/page code).

## Fix 3 (REQUIRED — test integrity): don't let the equivalence test silently skip

In `shared/prayer-times.test.js`, the reference is loaded in a `try/catch` and the equivalence test does
`if (!PrayTimes) return`, so the most important accuracy test passes without asserting anything if the
reference fails to load. Change it so a missing/failed reference **fails the test loudly** (assert the
reference loaded before comparing).

## Fix 4 (OPTIONAL — polish)
- In `shared/prayer-times.js`, remove the think-out-loud comment cruft near the return (the
  `"Actually, returning exact ms is better... We will leave it exact."` block). Keep code behavior identical.
- Add a one-line comment where `timezone` is destructured noting it is intentionally unused: the returned
  values are **absolute epoch-ms instants**, formatted to local time at the display layer (device zone =
  location zone for V1). This prevents someone later double-applying a timezone offset.

---

## Done when
- `highLatRule` uses the single canonical snake_case set in storage-helpers + prayer-times, with the new
  differentiating test.
- `scratch-compare.js` deleted; reference file moved under `shared/__tests__/` and the test path updated.
- The equivalence test fails loudly if the reference can't load.
- `npm test` is green.
- No new scope beyond the above.
