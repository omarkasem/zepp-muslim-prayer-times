# Purpose

Port the shipped Bip 6 Qibla compass to the `gt` target (round `r` + square `s`, `designWidth: 480`):
calibrate state, then a live compass with a rotating arrow pointing to Mecca, a fixed Kaaba target at the
top, rotating N/E/S/W cardinals, and the bearing readout. **Reuse the sensor/heading logic verbatim** —
it's the riskiest code and already works on Bip 6; only the geometry changes.

# User Value

Find the Qibla on gt watches: turn until the arrow points up at the Kaaba; aligns (green + vibrate) when
facing Mecca.

# Dependencies

- Reference impl (copy this): `page/bip6/qibla/index.page.js`.
- Epic 01: `shared/qibla.js` (`qiblaBearing`), `shared/storage.js`. `@zos/sensor` Compass + Vibrator.
- Layout: `../../05-ui-sketches/qibla-design.md`. Theme: `lib/theme.js`.

# Target Files

- `page/gt/qibla/index.page.js` (new).
- `assets/gt.r/image/` + `assets/gt.s/image/`: `ic_qibla_arrow.png`, `ic_kaaba.png`, `ic_watch.png`,
  `ic_back.png` — resized to the gt display sizes (the IMG widget `w`/`h` MUST equal each PNG's pixels).

# Public Interface

- None exported (a page).

# Related Shared Logic

- `qiblaBearing(getLocation())` (absolute bearing to Mecca), `getLocation()`. **Do not reimplement.**

# Build Order

Step 4 of the epic.

# Tasks

- Copy the Bip 6 Qibla logic unchanged: compass start/stop, **150ms heading poll**, `handleReading()`,
  calibrate→active gate on a *valid* `getDirectionAngle()` (not `getStatus()`), 5s fallback, vibrate-once
  on alignment, sensor cleanup on pause/destroy.
- Re-lay-out for 480: center the dial ring (`ARC`), the rotating arrow (`IMG`, pivot = its own centre,
  `setProperty(MORE,{angle: rel})`), the fixed Kaaba target at the dial top, the rotating N/E/S/W cardinals
  (`positionCardinals(heading)`), and the bearing + `SE • MECCA` readout below.
- Re-size the arrow/Kaaba/cardinal radius for the 480 dial; set each IMG widget `w`/`h` to its PNG size.
- Round (`gt.r`): center within the safe area. Aligned cue: recolor the dial ring (NOT an IMG tint).
- **Remove the temporary `heading` debug readout** — it must not ship.
- If the arrow/cardinals rotate the wrong way on gt hardware, flip the angle sign (same one-line fix used
  to verify on Bip 6).

# Tests

Manual, gt device/simulator (both shapes):
- Calibrate shows the figure-8 hint; transitions once a valid heading arrives.
- Arrow rotates live to Mecca as you turn; cardinals track north (N up when facing north).
- Aligned (±6°): dial ring turns green + single vibrate; arrow points up at the Kaaba.
- Sensor stops on leaving the page. Round shape: nothing clipped.

# Acceptance Criteria

- Matches `qibla-design.md` adapted to 480 round + square.
- Live rotating arrow + Kaaba target + rotating cardinals + bearing readout; aligned cue + vibrate work.
- No `heading` debug text; sensor cleaned up on exit.

# Definition Of Done

- Sensor/heading logic copied from Bip 6 (not re-derived); `px()` + `designWidth: 480`; no `?.`.
- Images use `image/`-prefixed `src`; IMG `w`/`h` = PNG pixel size; **no IMG `color` tint** (pre-colored
  PNGs; recolor only `ARC`/`FILL_RECT`).
- Debug readout removed; no console spam; `page/bip6/*` untouched.

# Notes For AI Coding

- This is the highest-risk screen but the logic is solved — diff against `page/bip6/qibla/index.page.js`
  and change only coordinates/sizes. Re-verify rotation direction on real gt hardware.
