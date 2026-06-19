# Purpose

The Qibla screen: a calibrate state, then a live compass whose large arrow (Apple "precision-finding"
style) rotates to point at Mecca as the user turns, with a Kaaba icon shown on alignment.

# User Value

Find the prayer direction on the wrist, no phone needed.

# Dependencies

- Epic 01: `shared/qibla.js` (`qiblaBearing`), `shared/storage.js` (`getLocation`).
- `@zos/sensor` (compass/geomagnetic heading), `@zos/router`.
- Layout: `../../05-ui-sketches/qibla-design.md` (authoritative — the edited Variation A: live arrow + Kaaba aligned indicator).

# Target Files

- `page/bip6/qibla/index.page.js` (new)
- icon assets: `assets/bip6/image/ic_qibla_arrow.png`, `ic_kaaba.png`, `ic_watch.png`, `ic_back.png`

# Public Interface

- Page only. Reads `getLocation()` → `qiblaBearing(location)`; subscribes to `@zos/sensor` heading.

# Related Services

- None (offline; uses cached location + the on-device compass).

# Related Shared Logic

- `qiblaBearing({lat, lon})` → absolute bearing to Mecca.

# Build Order

Step 5 (last) of the epic. **Confirm the Bip 6 `@zos/sensor` compass API before building** (open verification item).

# Tasks

- **First: verify** which `@zos/sensor` compass/geomagnetic API the Bip 6 exposes — heading stream and whether it reports a calibration/accuracy status. Decide the calibrate-exit condition from that.
- Calibrate state: figure-8 motion hint (animate the watch glyph in code) + "Calibrating…" text; exit when the sensor is usable, or after a short timed fallback if no accuracy status exists.
- Active compass: compute `bearing = qiblaBearing(getLocation())`; on each heading update compute `rel = normalize360(bearing − heading)` and rotate the arrow to `rel`.
- Render per `qibla-design.md`: faint dial (optional/static), large arrow (muted while searching), bearing degrees + cardinal + city.
- Aligned (`|rel| ≤ 6°`): arrow → accent green, show the Kaaba icon, optional single vibrate on first entering aligned.
- Confirm the arrow rotation mechanism (`IMG` `angle` + `center_x/center_y`); fallback to pre-rendered frames if unsupported.
- Unsubscribe/stop the sensor on page hide/destroy (battery). Back arrow → Home. No `?.`.

# Tests

No on-device harness — verify MANUALLY on the Bip 6 (qibla math already unit-tested in Epic 01):
- Calibrate screen shows, then transitions to the compass (or after the fallback timer).
- Rotating the watch rotates the arrow so it keeps pointing toward Mecca.
- When facing the Qibla (±6°), arrow turns green and the Kaaba icon appears.
- Bearing degrees + city display correctly (e.g. matches the Epic 01 computed value for the location).
- Leaving the page stops the sensor (no battery drain / no callbacks after exit).

# Acceptance Criteria

- Matches `qibla-design.md` within the round safe area.
- Arrow rotates live to the Qibla; aligned state shows green arrow + Kaaba icon.
- Sensor started on enter, stopped on exit.
- Graceful behavior if the compass needs calibration.

# Definition Of Done

- Follows architecture + `qibla-design.md`; `px()` + `designWidth`; no `?.`.
- Compass API confirmed on Bip 6; calibrate-exit handled (status or timed fallback).
- Sensor cleanup on exit; no debug leftovers.

# Notes For AI Coding

- The arrow is the focal element (Apple precision-finding style) — not a traditional compass needle.
- The aligned indicator is the Kaaba ICON, replacing any "Facing Qibla" text.
- If image rotation isn't supported on this firmware, raise it — don't fake the rotation with the wrong widget.
