# Epic Purpose

Bring the `gt` device family (round `r` + square `s`, `designWidth: 480`) to feature parity with the
shipped Bip 6 app, then prepare the store submission. **No new logic** — `shared/` and `lib/reminders.js`
are consumed exactly as-is; this epic is layout, per-target assets, store collateral, and a final
offline/permissions audit. Bip 6 ships first; this is a fast-follow and could be deferred for a
Bip-6-only V1.

# Included Features

- **`gt` Home screen** — re-lay-out the Bip 6 Home for 480px round/square; same engine + state machine.
  **(complex → `feature-01-gt-home.md`)**
- **`gt` Settings + Picker** — re-lay-out the settings list, toggle cards, and reusable picker for 480px.
  **(complex → `feature-02-gt-settings.md`)**
- **`gt` Qibla** — re-lay-out the compass (dial, rotating arrow, Kaaba target, cardinals) for 480px;
  reuse the exact sensor/heading logic. **(complex → `feature-03-gt-qibla.md`)**
- **Per-target assets** — bundle the `ic_*` PNGs under `assets/gt.r/image/` and `assets/gt.s/image/`;
  per-target app icon. **(simple → overview checklist)**
- **Store submission** — finalize `docs/app-store-listing.md`, generate store screenshots, app icon.
  **(simple → overview checklist)**
- **Final offline + permissions audit** — confirm offline behavior and that `app.json` permissions
  match real usage. **(simple → overview checklist)**

# Excluded Features

- Any change to `shared/` math or `lib/reminders.js` behavior. If a gap is found, raise it — don't extend.
- New features (manual location override, GPS, athan audio, per-prayer config, tiles/widgets) → future.
- Bip 6 layout changes — that screen is done; only port its patterns.

# Feature Boundaries

**gt Home (feature-01)** — purpose: glanceable main screen on 480px round + square. Complexity: Medium
(layout only). Deps: Epic 01 engine, `app-side` GET_LOCATION, `lib/reminders`. Arch notes: copy the Bip 6
page's state machine verbatim; only the `build()/render*` coordinates change. Round variant must respect
the circular safe area.

**gt Settings (feature-02)** — purpose: tune settings on 480px. Complexity: Medium. Deps: Epic 01
(`storage`, `methods`), `lib/reminders`. Arch notes: same two pages (list + one reusable picker), same
toggle-card pattern (Asr Madhab, Time Format); re-tune sizes for 480 + ensure scrolling reaches every row.

**gt Qibla (feature-03)** — purpose: point to Mecca on 480px. Complexity: Medium-High (sensor + rotation
already solved on Bip 6, but re-verify on gt hardware). Deps: Epic 01 (`qibla`), `@zos/sensor`. Arch
notes: reuse the Bip 6 compass logic (poll heading, rotate arrow, fixed Kaaba target, rotating cardinals)
unchanged; only re-center/resize for 480.

# Shared Services

- **`lib/reminders.js`** — unchanged; the only `@zos/alarm` caller. gt pages import it exactly like Bip 6.
- **`app-side/index.js`** — unchanged `GET_LOCATION` (IP-geolocation). Shared across all targets.
- **`lib/theme.js`** — shared Noor colors + font sizes. May need a **font-size pass for 480px** (the Bip 6
  sizes were tuned for 390 — verify legibility, bump per-target if needed without breaking Bip 6).
- **Opportunity (decide in feature-01):** extract the per-screen non-layout logic (state machine, compass
  handling) into small shared helpers so Bip 6 + gt don't drift. Only do this if it stays low-risk; the
  default is to duplicate the page and re-lay-out, since the engine is already in `shared/`.

# Shared Validation Logic

- None new. All inputs are validated in `shared/`; gt pages read through `getSettings()`/`getLocation()`
  (safe defaults / null) and must handle the null-location case exactly like Bip 6.

# Shared UI Patterns (carry from Bip 6 — hard-won, do not relearn)

- **Image `src` MUST be prefixed `image/`** (e.g. `"image/ic_pin.png"`). Without it, **no image renders at
  all**. This was the single biggest Bip 6 trap.
- **Do NOT tint an `IMG` via the `color` property** — it makes the image invisible on this firmware. Ship
  pre-colored PNGs. Recolor cues only on `ARC`/`FILL_RECT`/`TEXT` (those honor `color`).
- **An `IMG` widget `w`/`h` must match the PNG's native pixel size**, or the image is clipped (there is no
  `auto_scale` on API 3.0). Resize the asset to the display size.
- **Image rotation works** via `widget.setProperty(hmUI.prop.MORE, { angle })` with `center_x`/`center_y`
  set to the widget-relative pivot (e.g. half of w/h). Used by the Qibla arrow.
- **One coordinate system.** `px()` scales from `designWidth` (480 for gt). Don't mix physical
  `DEVICE_WIDTH` with `px(designValue)` in the same expression — that caused off-center layouts on Bip 6.
- **Compass:** `getStatus()` is unreliable; **poll `getDirectionAngle()`** (it returns `"INVALID"` until
  calibrated) and gate the calibrate→active transition on a *valid heading*, not on `getStatus()`.
- `hmUI.setStatusBarVisible(false)` on every page; no optional chaining (`?.`); flattened colors (no
  opacity/shadow); bundled PNGs only (no Material Symbols).
- **Round (`gt.r`) safe area:** keep all content within the circular inset; corners are clipped.

# Dependencies

- Epic 02 (complete on Bip 6) — the four `page/bip6/*` pages are the reference implementation.
- `@zos/{ui,router,alarm,notification,sensor,app,page}`. The three `05-ui-sketches/*-design.md` specs.
- `docs/app-store-listing.md` (store copy, already drafted). ASO screenshot skills for store images.

# Risks & Complexity Concerns

- **Two screen shapes in one target** (`gt.r` round + `gt.s` square) share `page/gt/*` code — the round
  safe-area constraint must not break the square layout. Verify both shapes.
- **gt hardware availability** — if no physical gt device is on hand, layouts are verified in the
  simulator; the compass/alarm rollover paths still need real-device confirmation before store release.
- **Font legibility at 480px** — Bip 6 sizes may look small or large; re-tune in `lib/theme.js` carefully
  so Bip 6 isn't regressed.
- **Asset duplication** — `ic_*` PNGs must be re-bundled (and possibly re-sized) per gt target; missing
  per-target assets repeat the "invisible image" failure.
- **Scope creep** — this epic is layout + store only. Resist adding features.

# Recommended Simplifications

- **Duplicate the Bip 6 page and re-lay-out** rather than building a responsive abstraction — the engine is
  already shared, and per-target page files are the ZeppOS idiom.
- If one gt shape must ship first, ship **`gt.r`** (round) and treat `gt.s` as a follow-up.
- Reuse the Qibla compass code verbatim (it's the riskiest part and already works) — only change geometry.
- Generate screenshots with the ASO skill rather than hand-crafting.

# Integration Test Scenarios

Cross-feature, on a gt device or simulator (the `shared/` math is already unit-tested):

- First run on gt → location resolves → Home renders 5 times + current-prayer highlight + countdown.
- Change method/offset in gt Settings → Home reflects new times → reminders reschedule.
- gt Qibla: calibrate → heading polls valid → arrow rotates to Mecca → aligns (green + vibrate); cardinals
  track north.
- Multi-day: overnight rollover fires next day's reminders (shared `app-service`, re-confirm on gt).
- Airplane mode with cached location → Home + reminders still work.
- Both shapes: every screen fits the round safe area AND the square screen without clipping.

# AI Coding Concerns

- Consume `shared/` and `lib/reminders.js` as-is; **do not reimplement logic** — copy the Bip 6 page's
  non-layout code, change only coordinates/sizes.
- Apply every "Shared UI Patterns" rule above from the first commit — they are the Bip 6 bug list.
- Keep `page/gt/*` to this epic; never touch `page/bip6/*` except a non-regressing `lib/theme.js` tweak.
- Re-bundle per-target assets with the correct `image/`-prefixed `src` and PNG-size-matched widgets.
