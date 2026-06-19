# Review fixes — Epic 02, Steps 1–3

Steps 1–3 reviewed: scaffolding, reminders glue, and Home all good; 29 `shared/` tests still green. Below
are the fixes. Apply the REQUIRED ones, re-test on the Bip 6, then continue to Step 4. Do NOT expand scope
beyond these.

---

## Fix 1 (REQUIRED): Home must refresh when returning from Settings

`onResume()` in `page/bip6/home/index.page.js` only restarts the countdown timer — it never recomputes
times. So after changing the calculation method or reminder offset in Settings, Home keeps showing the old
times until a full reload. Make `onResume()` recompute and re-render:
- Re-read `getSettings()`, recompute via `computePrayerTimes`, and rebuild the screen.
- **Clear the previous widgets first** so they don't stack (delete the tracked row/nav widgets, or
  re-create the page content cleanly). Then restart the countdown timer.
- Keep `applyReminders()` out of `onResume` (Settings already calls it on change) to avoid redundant reschedules.

## Fix 2 (REQUIRED): show the "Getting location…" loading state

`build()` is never called during the async `fetchLocation()`, so the first-run screen is blank until the
network resolves. Call the loading render at the start of `onInit` (and keep it while fetching), then
replace it when times are ready or on failure.

## Fix 3 (REQUIRED): add a 12h/24h time-format setting

Add a user setting for clock format (default **12-hour with AM/PM**). This touches three places:
- **`shared/storage-helpers.js`** (Epic 01 file — additive change): add `timeFormat: "12h"` to
  `DEFAULT_SETTINGS`, and in `sanitizeSettings` validate `timeFormat` against `["12h", "24h"]` (fallback
  to default). Update `shared/storage-helpers.test.js` accordingly.
- **`page/bip6/home/index.page.js`** `formatTime`: respect `settings.timeFormat`.
  - `"12h"` → 12-hour with AM/PM, e.g. `3:34 PM` (hour `0`→`12`, `13..23`→`1..11`, add `AM`/`PM`).
  - `"24h"` → current behavior, e.g. `15:34`.
- **Settings screen (Step 4):** a new "Time Format" row + picker is already added to the specs
  (`feature-03-settings.md` and `settings-design.md`). Implement it there as part of Step 4 — no separate step.

## Fix 4 (REQUIRED — verify runtime): countdown timer

`page/bip6/home/index.page.js` line ~169 uses the global `setInterval`. Confirm global `setInterval`/
`clearInterval` actually fire in the Zepp OS 3 page runtime on the Bip 6. If the countdown does NOT tick,
switch to `@zos/timer` (`createTimer`/`setInterval` from there). Don't leave a silently-dead timer.

---

## Optional polish
- **`lib/theme.js`:** rename `PILLER_OPTION_INACTIVE` → `PICKER_OPTION_INACTIVE` (typo) before Step 4 uses it.
- **`page/bip6/home`:** wrap icon `w`/`h` in `px()` for consistency (harmless on Bip 6; matters for `gt` in Epic 03).
- **`lib/reminders.js`:** when `getLocation()` is null, consider NOT cancelling existing alarms (leave them
  firing), to match the Fix 2 decision in `scheduler.js`. Low impact.
- **After-Isha highlight:** the highlighted Fajr row shows *today's* (past) Fajr time. Show tomorrow's Fajr
  time instead (compute with `date = tomorrow`), so the highlighted time matches the "Tomorrow" label.

---

## Done when
- Home recomputes + re-renders on resume (no stacked widgets); loading state visible on first run.
- `timeFormat` setting exists (default `12h`), Home formats per it, storage-helpers test updated.
- `setInterval` confirmed working on-device (or replaced with `@zos/timer`).
- 29 `shared/` tests still green (plus any new storage-helpers assertions).
- No new scope beyond the above.
