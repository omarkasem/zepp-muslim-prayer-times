# Qibla Screen — Implementation Spec (Variation A: Classic Precision, edited)

Coder-ready translation into Zepp `@zos/ui` (`hmUI`). Source design: `designs/qibla/`
(`screen.png`, `code.html`, `DESIGN.md`). Two states: **Calibrate** → **Active compass**.

## Two intentional edits vs the Stitch mockup
1. **Center indicator = a live directional ARROW, Apple "Find My / Precision Finding" style** — a single
   large bold arrow that rotates in real time to point toward the Qibla as the user turns, NOT the static
   compass-needle diamond in the mockup.
2. **Aligned indicator = a KAABA ICON, not the "FACING QIBLA" text pill.** When the user is facing the
   Qibla, the arrow turns the accent green and a Kaaba icon appears (where the text pill was).

## Target & units
- Bip 6, **390×390 round**, `designWidth: 390` → `px()` ~1:1. Use the full circle. Keep text in the 342px safe area.
- Background: true AMOLED black `0x000000`.

## Page / target files
- `page/bip6/qibla/index.page.js` (single page; swaps between the two states based on calibration status).

## Data & sensors
- **Qibla bearing:** `shared/qibla.qiblaBearing(getLocation())` → absolute bearing from North to Mecca (e.g. 128°).
- **Device heading:** `@zos/sensor` compass/geomagnetic — current heading of the watch's top vs North.
- **Arrow angle (live):** `rel = normalize360(qiblaBearing − heading)`. Rotate the arrow to `rel` so it always
  points at Mecca regardless of which way the watch faces. (`rel = 0` ⇒ top of watch points at Qibla.)
- **Aligned:** `|rel|` within **±6°** → aligned state. Optionally one short vibrate on first entering aligned.
- **City:** `getLocation().city`. **Cardinal** (e.g. "SE") derived from `qiblaBearing`.

## Color tokens (Noor → `hmUI` int)
| Role | Hex | Int |
|---|---|---|
| Background | `#000000` | `0x000000` |
| Arrow — aligned / accent / bearing text | `#4edea3` | `0x4edea3` |
| Arrow — searching (muted) | `#bbcabf` | `0xbbcabf` |
| Dial ring + N/E/S/W ticks (faint) | `#2a3530` (approx) | `0x2a3530` |
| Secondary labels (city, "MECCA") | `#bbcabf` | `0xbbcabf` |
| Kaaba icon | accent green | `0x4edea3` |
| Calibrate figure-8 path / watch glyph | `#10b981` / `#4edea3` | `0x10b981` / `0x4edea3` |

> No opacity/glow/Tailwind/Material icons on Zepp — flatten the "opacity" cases to the solids above; the
> mockup's emerald glow is dropped (arrow color carries the emphasis).

## Typography (Noor tokens, px)
| Use | Token | Size | Weight |
|---|---|---|---|
| Bearing degrees ("128°") | display-time | 48 | 700 |
| "Calibrating..." | headline-md | 20 | 600 |
| N/E/S/W dial letters | headline (small) | ~18 | 700 |
| City, "SE • MECCA", calibrate hint | label-sm | 12 | 600 |

## State 1 — Calibrate (shown until the compass reports usable accuracy)
- Back arrow top-left (`0x4edea3`).
- A **figure-8 path** illustration (faint, `0x10b981`) ~y80, and a **watch glyph** that animates along the
  figure-8 (the motion the user should make). The glyph is a bundled PNG; animate it in code (the mockup's
  "still" only depicts it).
- "Calibrating..." (headline-md, centered, ~y230) + "Move your watch in a figure-8 motion" (label-sm, `0xbbcabf`, ~y262).
- Transition to State 2 when the sensor accuracy is good. **If the compass API exposes no accuracy/status,
  fall back to a short timed calibrate screen on entry, then proceed.** *(See open item below.)*

## State 2 — Active compass (layout, top → bottom)
1. **Back arrow** top-left (`0x4edea3`).
2. **City** small label, top-center (~y40, `0xbbcabf`).
3. **Kaaba icon** (~y72, centered) — **only visible when aligned.** Replaces the mockup's "FACING QIBLA" pill.
4. **Faint compass dial** (centered, ~Ø224): a thin ring (`0x2a3530`) + N/E/S/W letters. The dial rotates by
   `−heading` so N points to true north (de-emphasized; the arrow is the hero). Optional — can ship a static dial if rotation is heavy.
5. **Direction ARROW** (center, ~Ø140, the focal element): a large bold arrow PNG, pivot at screen center,
   rotated live to `rel`. Color = `0xbbcabf` while searching, `0x4edea3` when aligned.
6. **Bearing readout** (~y300): "128°" (display-time 48, `0x4edea3`) above "SE • MECCA" (label-sm, `0xbbcabf`).

## Animation / interaction (code, not Stitch)
- Subscribe to compass heading updates; on each update recompute `rel` and set the arrow's rotation
  (smoothly). Confirm the rotation mechanism: render the arrow as an `hmUI.widget.IMG` and rotate via its
  `angle` + `center_x`/`center_y` props, updating on heading change. If image rotation isn't supported on
  this firmware, pre-render arrow frames or use a draw/canvas approach — decide during implementation.
- Aligned (`|rel| ≤ 6°`): switch arrow to `0x4edea3`, show the Kaaba icon, optional single vibrate.
- Stop/unsubscribe the sensor on page hide/destroy (battery).
- Back arrow → `router.back()` to Home.

## Icons / assets (bundle PNGs; no Material Symbols)
- `ic_qibla_arrow.png` (the Apple-style arrow), `ic_kaaba.png`, `ic_watch.png` (calibrate glyph), `ic_back.png`.
- Export the arrow in both colors, or one neutral arrow tinted by swapping assets for searching vs aligned.

## OPEN ITEM (carry into Epic 02)
- Confirm the **Bip 6 `@zos/sensor` compass API**: heading stream + whether it exposes a calibration/accuracy
  status. The Calibrate state's exit condition depends on this; if absent, use the timed-fallback above.

## hmUI mapping notes / gotchas
- Keep the arrow + dial centered on `(195,195)`; everything inside the 342px circle.
- Flatten opacities; no glow. `page/bip6/...`; `gt` (480px) re-layout is Epic 03 (same logic).
- All values come from `shared/qibla.js` + the sensor — no recomputation logic in the layout beyond reading them.

## Acceptance
- Calibrate state shows the figure-8 motion hint and exits when calibrated (or after the timed fallback).
- Active state shows a large arrow that rotates live to point at the Qibla as the watch turns.
- Aligned (±6°): arrow turns green and the Kaaba icon appears.
- Bearing degrees, cardinal, and city display correctly; sensor stops on leaving the page.
- Everything fits the round Bip 6 screen.
