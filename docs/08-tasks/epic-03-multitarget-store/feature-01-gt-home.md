# Purpose

Port the shipped Bip 6 Home screen to the `gt` target (round `r` + square `s`, `designWidth: 480`):
fetch+cache location, compute today's times, render the current-prayer highlight + live countdown + hijri
+ city, and navigate to Settings/Qibla. **Layout only** — the state machine and engine calls are copied
verbatim from `page/bip6/home/index.page.js`.

# User Value

The same glanceable "which prayer now, what's next, when" experience on gt-family watches, offline after
the first location fetch.

# Dependencies

- Reference impl (copy this): `page/bip6/home/index.page.js`.
- Epic 01: `shared/storage.js`, `shared/prayer-times.js`, `shared/hijri.js`.
- `app-side/index.js` `GET_LOCATION`; `lib/reminders.js` `applyReminders()` (called on open).
- Layout: `../../05-ui-sketches/home-design.md`. Theme: `lib/theme.js`.

# Target Files

- `page/gt/home/index.page.js` (replace the placeholder).
- `assets/gt.r/image/` + `assets/gt.s/image/`: `ic_pin.png`, `ic_compass.png`, `ic_gear.png` (from Step 1).
- `lib/theme.js` (only if 480px needs a non-regressing font-size tweak).

# Public Interface

- None exported (a page). Reads `getLocation()`/`getSettings()`; writes `setLocation()` after a fetch.

# Related Services

- `request({ method: 'GET_LOCATION' })` → `app-side`. `applyReminders()` from `lib/reminders.js`.

# Related Shared Logic

- `computePrayerTimes(...)`, `toHijri(today)`, `getLocation/setLocation/getSettings`. **Do not reimplement.**

# Build Order

Step 2 of the epic (after gt scaffolding/assets in Step 1).

# Tasks

- Copy the Bip 6 Home page's logic: state machine, `computeNext()` (current-prayer highlight + next-prayer
  countdown), loading / unavailable / after-Isha + before-Fajr handling, minute timer, Jumu'ah-on-Friday.
- Re-lay-out for `designWidth: 480`: header (pin + city, centered), hijri date, the 5-row list with the
  highlighted pill, and the bottom Qibla/Settings nav pills. Re-tune `y`/sizes for the taller 480 screen.
- **Round (`gt.r`):** keep all content inside the circular safe area (no edge-to-edge rows). **Square
  (`gt.s`):** use the fuller rectangle. Both share this file — pick geometry that works for both.
- Center the city pin+text group by estimating text width (same approach as Bip 6).
- Wire nav: Qibla pill → push qibla page; Settings pill → push settings page; `applyReminders()` on open.

# Tests

No on-device test harness — verify MANUALLY on a gt device/simulator (both shapes):
- Fresh run → location resolves → 5 times + correct current-prayer highlight + "<next> in Xh Ym".
- Countdown updates each minute; highlight rolls over when a prayer passes; after Isha → Isha highlighted,
  "Fajr in …"; Friday → Jumu'ah row.
- Airplane mode with cached location → still renders. No cached location + failed fetch → unavailable state.
- Round shape: nothing clipped at the circle edge. (Math already covered by Epic 01 unit tests.)

# Acceptance Criteria

- Matches `home-design.md` adapted to 480 round + square; comfortably readable.
- Correct current-prayer highlight + minute-updating countdown; hijri + city centered.
- Qibla/Settings nav works; `applyReminders()` called on open; loading/unavailable states behave.

# Definition Of Done

- Logic copied from Bip 6 (not re-derived); `px()` + `designWidth: 480`; no `?.`; flattened colors.
- Images use `image/`-prefixed `src`; IMG widget sizes match the PNGs; no IMG `color` tint.
- Null-location handled; minute timer cleared on exit (no leak). No debug leftovers.
- `page/bip6/*` untouched; `lib/theme.js` tweak (if any) does not regress Bip 6.

# Notes For AI Coding

- This is a re-layout of a working screen — diff against `page/bip6/home/index.page.js` and change only
  coordinates/sizes. Don't invent new behavior.
- Keep colors/sizes in `lib/theme.js`; reference `home-design.md` for values.
