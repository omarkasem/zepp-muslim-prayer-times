# Purpose

Make the Qibla screen run a visible calibration phase for a fixed minimum duration
**each time the screen is opened**, so the figure-8 "Calibrating…" animation stays on
screen for X seconds and the user keeps moving the watch before the live Qibla compass
appears — **except** when the screen was calibrated very recently (a quick close-and-reopen),
in which case it goes straight to the live compass. This matches how mainstream Qibla apps
behave: they calibrate when it is actually useful, not on every single tap.

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

# Design Note: why a timer (and a freshness window) instead of sensor accuracy

Phone Qibla apps (Google Qibla Finder, Muslim Pro, Athan) don't use a timer — the phone's
magnetometer reports an **accuracy/status level**, and they show the figure-8 prompt only
when accuracy is low. The Zepp watch compass API does not reliably expose such an accuracy
status, so we approximate "calibration is useful right now" with two heuristics:

1. A **minimum visible duration** (`CALIBRATE_MIN_MS`) so the sensor has time to settle and
   the user gets the familiar calibration ritual.
2. A **freshness window** (`CALIBRATE_FRESH_MS`): if calibration completed within the last
   N minutes, skip it on re-entry — the compass is still warm, so re-calibrating on a quick
   close-and-reopen would just be annoying. This is the behaviour real apps approximate via
   the accuracy status.

# Desired Behaviour

1. When the Qibla screen is shown (fresh open **or** resume) and calibration was **not**
   completed within the last `CALIBRATE_FRESH_MS`, it enters the `calibrate` phase and shows
   the figure-8 animation + "Calibrating…" + the figure-8 hint.
2. If calibration **was** completed within the last `CALIBRATE_FRESH_MS`, skip the calibrate
   phase and go straight to the live `active` compass.
3. When calibrating, the phase lasts a **minimum** of `CALIBRATE_MIN_MS` (recommended
   **3000 ms**) regardless of how quickly a valid heading becomes available.
4. The transition to the live `active` compass happens only once **both** are true:
   - at least `CALIBRATE_MIN_MS` has elapsed since calibration started, **and**
   - a valid compass heading is available.
5. If no valid heading has arrived by `CALIBRATE_MAX_MS` (the existing fallback, recommended
   **8000 ms** — must be ≥ `CALIBRATE_MIN_MS`), transition to `active` anyway as a best-effort
   fallback (current fallback behaviour, just renamed/extended).
6. On a successful transition into `active`, record the completion time so the freshness
   window can short-circuit the next entry.
7. The `noLocation` phase is unchanged — never calibrate when there is no usable location /
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
  callback), but verify the resume→calibrate rebuild fires (see Implementation Notes).

# Implementation Notes

All changes are in `lib/controllers/qibla-controller.js`.

1. **Add constants** near the existing `CALIBRATE_FALLBACK_MS`:
   ```js
   const CALIBRATE_MIN_MS = 3000;        // always show calibrate at least this long
   const CALIBRATE_MAX_MS = 8000;        // hard fallback if no valid heading arrives
   const CALIBRATE_FRESH_MS = 2 * 60000; // skip calibrate if done within this window (2 min)
   ```
   Replace the single `CALIBRATE_FALLBACK_MS` usage with `CALIBRATE_MAX_MS` (keep the same
   fallback semantics, just a longer/clearer name). Ensure `CALIBRATE_MAX_MS >= CALIBRATE_MIN_MS`.
   All three values are tunable.

2. **Remember the last successful calibration time across page opens.** The controller's
   `state` is recreated on every `createQiblaController(...)` call, so store the timestamp at
   **module scope** (a `let lastCalibratedAt = 0;` at the top of the file). This survives
   page navigation while the app process is alive and resets when the app is fully closed —
   which is the desired behaviour (a fresh app launch should calibrate). Do **not** persist it
   to storage; in-memory is intentional.

3. **Track when calibration started.** Add `calibrateStartedAt: 0` to the initial `state`
   object and set `state.calibrateStartedAt = Date.now();` inside `startCalibrate()`.

4. **Add a freshness check used by both entry points.** A small helper keeps `onInit` and
   `onResume` consistent:
   ```js
   function calibratedRecently() {
     return lastCalibratedAt > 0 && (Date.now() - lastCalibratedAt) < CALIBRATE_FRESH_MS;
   }
   ```

5. **Record completion in `transitionToActive()`.** When a calibration completes (not when we
   were already active), set `lastCalibratedAt = Date.now();` so the next entry can skip.

6. **Gate the transition on elapsed time.** In `handleReading()`, in the
   `if (state.phase === "calibrate")` branch, do **not** transition on the first valid
   reading. Transition only when the minimum time has also elapsed:
   ```js
   if (state.phase === "calibrate") {
     const elapsed = Date.now() - (state.calibrateStartedAt || 0);
     if (valid && elapsed >= CALIBRATE_MIN_MS) transitionToActive();
     return;
   }
   ```
   Because the compass keeps polling (`pollTimer` every 150 ms, plus `onChange` on movement),
   a valid reading that arrives before `CALIBRATE_MIN_MS` is re-evaluated after the minimum
   elapses — no extra timer is strictly required. (Optional: a one-shot
   `setTimeout(CALIBRATE_MIN_MS)` calling `handleReading()` once, for determinism.)

7. **Keep the max fallback.** `startFallback()` should use `CALIBRATE_MAX_MS` and still call
   `transitionToActive()` if we are somehow still in `calibrate` when it fires. This covers
   the "compass never returns a valid reading" case.

8. **Skip calibration when fresh — `onInit`.** When there is a valid location/bearing:
   ```js
   if (calibratedRecently()) {
     state.phase = "active";
     state.aligned = false;
     startCompass();          // live compass, no calibrate UI
   } else {
     state.phase = "calibrate";
     startCalibrate();
   }
   ```
   The `noLocation` branch is unchanged.

9. **Skip-or-recalibrate on resume — `onResume`.** Replace the current logic so it honours the
   freshness window instead of leaving a stale `active` state:
   ```js
   onResume() {
     if (state.phase === "noLocation") return;   // nothing to calibrate
     if (calibratedRecently()) {
       state.phase = "active";
       state.aligned = false;
       onStateChange();                            // rebuild into active UI
       startCompass();
       return;
     }
     state.phase = "calibrate";
     state.aligned = false;
     onStateChange();                              // rebuild into calibrate UI
     startCalibrate();                             // resets calibrateStartedAt, anim, compass, fallback
   }
   ```
   Note: on a fresh open the page calls `ctrl.onInit()` then `ctrl.onResume()`. After `onInit`
   starts calibration, `lastCalibratedAt` is still old, so `onResume` will (harmlessly) restart
   the same calibrate cycle once. If a double-start is undesirable, guard with a flag so
   `onResume` is a no-op on the first invocation immediately after `onInit`.

10. **Confirm the page rebuild path.** When switching phase in `onResume` (either direction),
    the controller calls `onStateChange()` so the page tears down old widgets and renders the
    correct phase. The pages already wire `onStateChange` to `destroyWidgets()` + `build()`;
    just ensure it is called **before** `startCalibrate()`/`startCompass()` so the target
    widgets exist for `updateAnim()` / `updateHeading()`.

11. **Lifecycle / battery unchanged.** `onPause()` / `onDestroy()` already stop the compass,
    animation, and fallback timer. No change needed, but verify the new min-duration path does
    not leave a stray timer running after the page is hidden mid-calibration.

# Optional Enhancements (not required)

- Show a subtle countdown or shrinking progress ring during the X seconds so the user knows
  how long to keep moving. Drive it from `calibrateStartedAt` + `CALIBRATE_MIN_MS` in the
  existing anim tick; do not add new i18n unless a textual countdown is desired.

# Tests

No on-device test harness exists for the compass; verify **manually** on the watch (and in
the simulator where the compass can be faked):

- **First entry / stale:** opening the Qibla screen (first time, or after >`CALIBRATE_FRESH_MS`)
  shows "Calibrating…" + figure-8 for the full ~`CALIBRATE_MIN_MS` (≈3 s) before the live
  arrow appears — even when the compass is warm.
- **Quick re-entry / fresh:** closing the Qibla screen and reopening within `CALIBRATE_FRESH_MS`
  (≈2 min) goes **straight to the live compass** with no calibrate screen.
- **Window expiry:** reopening after more than `CALIBRATE_FRESH_MS` calibrates again.
- **Max fallback:** if the compass never returns a valid heading, the screen still transitions
  to `active` after `CALIBRATE_MAX_MS` (≈8 s) rather than hanging on calibrate forever.
- **No location:** the screen still shows the `noLocation` state and never calibrates.
- **Lifecycle:** leaving the page during calibration stops the animation, compass, and timers
  (no battery drain, no callbacks after exit).

Pure-logic parts (the min/max elapsed-time gating and the freshness check) may optionally be
extracted into small testable helpers (e.g. `shouldExitCalibrate(elapsed, valid)` and
`isFresh(lastCalibratedAt, now)`) and unit-tested with vitest, mirroring the existing
`shared/*.test.js` pattern. Optional, since the controller depends on `@zos/sensor`.

# Acceptance Criteria

- On a stale/first entry, the calibrate phase is shown for at least `CALIBRATE_MIN_MS`.
- On a re-entry within `CALIBRATE_FRESH_MS`, calibration is skipped and the live compass
  appears immediately.
- Transition to the live compass requires both the minimum time elapsed and a valid heading,
  with a `CALIBRATE_MAX_MS` hard fallback; completion updates `lastCalibratedAt`.
- Behaviour is identical on both `gt` and `bip6` targets (shared controller).
- No regressions to the `active` (live arrow / alignment / vibrate) or `noLocation` states,
  and the sensor is still stopped on page hide/destroy.
