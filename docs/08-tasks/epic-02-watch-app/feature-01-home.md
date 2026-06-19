# Purpose

The Home screen: fetch+cache location, compute today's prayer times offline, and render the Variation A
layout (5 times, next-prayer highlight, live countdown, hijri date, city) with navigation to Settings and
Qibla. The glanceable face of the app.

# User Value

"What's the next prayer and when" answered in one glance, working offline after the first location fetch.

# Dependencies

- Epic 01: `shared/storage.js`, `shared/prayer-times.js`, `shared/hijri.js`.
- `app-side/index.js` `GET_LOCATION` (network).
- `lib/reminders.js` `applyReminders()` (Step 3) — called on open.
- Layout: `../../05-ui-sketches/home-design.md` (authoritative for positions/colors/states).

# Target Files

- `page/bip6/home/index.page.js` (replace the placeholder)
- `lib/theme.js` (Noor color/size constants, from Step 1)
- icon assets: `assets/bip6/image/ic_pin.png`, `ic_compass.png`, `ic_gear.png`

# Public Interface

- None exported (it's a page). Reads `getLocation()`/`getSettings()`, writes `setLocation()` after fetch.

# Related Services

- `request({ method: 'GET_LOCATION' })` → `app-side`. `applyReminders()` from `lib/reminders.js`.

# Related Shared Logic

- `computePrayerTimes(...)`, `toHijri(today)`, `getLocation/setLocation/getSettings`.

# Build Order

Step 2 of the epic (after scaffolding; before/with reminders — the on-open `applyReminders()` call is wired once Step 3 exists).

# Tasks

- On load: `getLocation()`; if null, `request(GET_LOCATION)` → validate → `setLocation()`; if it fails, show the location-unavailable state.
- Compute today's 5 times with `computePrayerTimes` using cached location + `getSettings()`.
- Render Variation A per `home-design.md`: list rows, the gold next-prayer pill, hijri date, city, bottom qibla/settings icons.
- Determine the next prayer (first instant > now); highlight it; after-Isha → highlight tomorrow's Fajr ("Tomorrow").
- Live countdown: a 1-minute page timer recomputes "next" and updates the subtext; clear it on hide/destroy.
- Tap qibla icon → `router.push` qibla page; tap gear → settings page.
- On open (after times are ready), call `applyReminders()` so today's reminders are scheduled.
- Loading state until location+times resolve.

# Tests

No on-device test harness — verify MANUALLY on the Bip 6:
- Fresh install → location resolves → 5 times + correct next-prayer highlight + countdown render.
- Countdown decrements each minute and rolls to the next prayer when one passes.
- After Isha, Fajr highlights as "Tomorrow".
- Airplane mode with cached location → still renders.
- No cached location + failed fetch → location-unavailable state, icons still reachable.
- (Pure math already covered by Epic 01 unit tests — do not re-test it here.)

# Acceptance Criteria

- Matches `home-design.md` within the round safe area on the Bip 6.
- Correct next-prayer highlight + minute-updating countdown; hijri + city shown.
- Qibla/Settings navigation works; `applyReminders()` called on open.
- Loading / location-unavailable / after-Isha states behave as specified.

# Definition Of Done

- Follows architecture + `home-design.md`; `px()` + `designWidth`; flattened colors; no `?.`.
- Null-location handled; timer cleared on exit (no leak).
- No network outside `app-side`; no `@zos` added to `shared/`.
- No debug leftovers; no console spam.

# Notes For AI Coding

- Don't recompute math in the page beyond calling `shared/` functions.
- Keep colors/sizes in `lib/theme.js`; reference `home-design.md` for exact values.
