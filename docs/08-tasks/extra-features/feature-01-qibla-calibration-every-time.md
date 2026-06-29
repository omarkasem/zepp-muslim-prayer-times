# Purpose

Make the Qibla screen **always** run a visible calibration phase for a fixed minimum
duration **every time** the screen is opened or resumed — the figure-8 "Calibrating…"
animation stays on screen for X seconds so the user keeps moving the watch, and only
then does the live Qibla compass appear. This matches the behaviour of mainstream Qibla
apps (Muslim Pro, Athan, etc.), which always calibrate for a few seconds on entry rather
than snapping straight to the arrow.

# Problem / Current Behaviour

Today calibration is shown only briefly, and effectively only the very first time:

- `lib/controllers/qibla-controller.js` → `handleReading()`: while in the `calibrate`
  phase it calls `transitionToActive()` on the **first valid compass reading**
  (`if (valid) transitionToActive();`). On a watch whose compass is already warm, that
  happens almost instantly, so the calibrate screen barely flashes.
- `onResume()` only re-calibrates if the phase is *still* `calibrate`; if the phase is
  already `active` (i.e. the user calibrated once, navigated away, and came back), it just
  restarts the compass via `startCompass()` and never shows the calibrate UI again.

Net effect: the user sees "Calibrating…" once, for a fraction of a second, and never again.
There is a `CALIBRATE_FALLBACK_MS = 5000` timer, but it is only an *upper-bound* fallback
for when no valid reading ever arrives — it does not enforce a *minimum* visible duration.

# Desired Behaviour

1. Every time the Qibla screen is shown (fresh open **and** resume), it enters the
   `calibrate` phase and shows the figure-8 animation + "Calibrating…" + the figure-8 hint.
2. The calibrate phase lasts a **minimum** of `CALIBRATE_MIN_MS` (recommended **3000 ms**)
   regardless of how quickly a valid heading becomes available.
3. The transition to the live `active` compass happens only once **both** are true:
   - at least `CALIBRATE_MIN_MS` has elapsed since calibration started, **and**
   - a valid compass heading is available.
4. If no valid heading has arrived by `CALIBRATE_MAX_MS` (the existing fallback, recommended
   **8000 ms** — must be ≥ `CALIBRATE_MIN_MS`), transition to `active` anyway as a best-effort
   fallback (current fallback behaviour, just renamed/extended).
5. The `noLocation` phase is unchanged — never calibrate when there is no usable location /
   Qibla bearing.

# Dependencies

- `@zos/sensor` Compass (already used).
- No new assets, no new shared logic, no new i18n keys (`calibrating` and `figure_8_hint`
  already exist in `lib/i18n.js`).

# Target Files

- `lib/controllers/qibla-controller.js` — primary change (logic). Both watch targets share
  this controller, so the behaviour applies to `gt` and `bip6` automatically.
- `page/gt/qibla/index.page.js` and `page/bip6/qibla/index.page.js` — likely **no change**
  needed (they already render the `calibrate` phase and rebuild on the `onStateChange`
  callback), but verify the resume→calibrate rebuild fires (see Tasks).

# Implementation Notes

All changes are in `lib/controllers/qibla-controller.js`.

1. **Add constants** near the existing `CALIBRATE_FALLBACK_MS`:
   ```js
   const CALIBRATE_MIN_MS = 3000;   // always show calibrate at least this long
   const CALIBRATE_MAX_MS = 8000;   // hard fallback if no valid heading arrives
   ```
   Replace the single `CALIBRATE_FALLBACK_MS` usage with `CALIBRATE_MAX_MS` (keep the same
   fallback semantics, just a longer/clearer name). Ensure `CALIBRATE_MAX_MS >= CALIBRATE_MIN_MS`.

2. **Track when calibration started.** In `startCalibrate()` set `state.calibrateStartedAt = Date.now();`
   (add `calibrateStartedAt: 0` to the initial `state` object).

3. **Gate the transition on elapsed time.** In `handleReading()`, in the
   `if (state.phase === "calibrate")` branch, do **not** transition on the first valid
   reading. Instead transition only when the minimum time has also elapsed:
   ```js
   if (state.phase === "calibrate") {
     const elapsed = Date.now() - (state.calibrateStartedAt || 0);
     if (valid && elapsed >= CALIBRATE_MIN_MS) transitionToActive();
     return;
   }
   ```
   Because the compass keeps polling (the `pollTimer` runs every 150 ms and `onChange`
   fires on movement), a valid reading that arrives before `CALIBRATE_MIN_MS` will be
   re-evaluated after the minimum elapses — no extra timer is strictly required for the
   "valid but too early" case. (If you prefer determinism, you may add a one-shot
   `setTimeout(CALIBRATE_MIN_MS)` that calls `handleReading()` once; optional.)

4. **Keep the max fallback.** `startFallback()` should use `CALIBRATE_MAX_MS` and still call
   `transitionToActive()` if we are somehow still in `calibrate` when it fires. This covers
   the "compass never returns a valid reading" case.

5. **Re-calibrate on every resume.** Change `onResume()` so it **always** restarts the full
   calibrate cycle (not just when already in `calibrate`), as long as there is a valid
   location/bearing:
   ```js
   onResume() {
     if (state.phase === "noLocation") return;       // nothing to calibrate
     state.phase = "calibrate";
     state.aligned = false;
     onStateChange();                                  // rebuild page into calibrate UI
     startCalibrate();                                 // resets calibrateStartedAt, anim, compass, fallback
   }
   ```
   Note: on a fresh open, the page calls `ctrl.onInit()` (which already sets `calibrate` and
   calls `startCalibrate()`) and then `ctrl.onResume()`. With the change above, `onResume`
   will reset the calibrate timer once more on first open — this is harmless (it just
   restarts the same animation/timer) and keeps the logic simple. If a double-start is
   undesirable, guard with a flag so `onResume` is a no-op on the first invocation after
   `onInit`.

6. **Confirm the page rebuild path.** When transitioning `active → calibrate` in `onResume`,
   the controller must call `onStateChange()` so the page tears down the active compass
   widgets and renders `renderCalibrate()` again. The pages already wire `onStateChange` to
   `destroyWidgets()` + `build()`, so calling it is sufficient — just make sure it is called
   before `startCalibrate()` so the figure-8 widgets exist for `updateAnim()` to target.

7. **Lifecycle / battery unchanged.** `onPause()` / `onDestroy()` already stop the compass,
   animation, and fallback timer. No change needed, but verify the new min-duration path
   does not leave a stray timer running after the page is hidden mid-calibration.

# Optional Enhancements (not required)

- Show a subtle countdown or shrinking progress ring during the X seconds so the user knows
  how long to keep moving. If added, drive it from `calibrateStartedAt` + `CALIBRATE_MIN_MS`
  in the existing anim tick; do not add new i18n unless a textual countdown is desired.

# Tests

No on-device test harness exists for the compass; verify **manually** on the watch (and in
the simulator where the compass can be faked):

- Opening the Qibla screen shows "Calibrating…" + figure-8 animation for the full
  ~`CALIBRATE_MIN_MS` (≈3 s) before the live arrow appears — even when the compass is warm.
- Leaving the Qibla screen and returning shows the calibration phase **again** every time.
- If the compass never returns a valid heading, the screen still transitions to `active`
  after `CALIBRATE_MAX_MS` (≈8 s) rather than hanging on calibrate forever.
- With no location set, the screen still shows the `noLocation` state and never calibrates.
- Leaving the page during calibration stops the animation, compass, and timers (no battery
  drain, no callbacks after exit).

Pure-logic parts (the min/max elapsed-time gating) may optionally be extracted into a small
testable helper (e.g. `shouldExitCalibrate(elapsed, valid)`) and unit-tested with vitest,
mirroring the existing `shared/*.test.js` pattern. This is optional since the controller
itself depends on `@zos/sensor`.

# Acceptance Criteria

- The calibrate phase is shown for at least `CALIBRATE_MIN_MS` on **every** entry and resume
  of the Qibla screen.
- Transition to the live compass requires both the minimum time elapsed and a valid heading,
  with a `CALIBRATE_MAX_MS` hard fallback.
- Behaviour is identical on both `gt` and `bip6` targets (shared controller).
- No regressions to the `active` (live arrow / alignment / vibrate) or `noLocation` states,
  and the sensor is still stopped on page hide/destroy.
