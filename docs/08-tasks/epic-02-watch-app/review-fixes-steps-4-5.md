# Review fixes — Epic 02, Steps 4–5 (Settings + Qibla)

Settings and Qibla are well-built (reusable picker, madhab toggle, reschedule-on-change; qibla calibration
+ fallback, rotating arrow, Kaaba aligned state, sensor cleanup). 30 `shared/` tests still green. But there
are real issues below. Several are "verify on the Bip 6" because they depend on Zepp runtime behavior —
test them when you flash the build, then fix the confirmed ones.

---

## Fix 1 (LIKELY BROKEN): Settings list has no scrolling — the last row is off-screen

The Settings main page stacks rows at y = 88, 152, 244, 308, **372**. The screen is 390px tall, so the
**Time Format** row (372→428) is essentially off the bottom and unreachable, and there is **no scroll
setup anywhere** in the page. The design spec explicitly calls for a vertically scrolling list.

- Verify on-device: can you swipe to reach "Time Format"? If not (likely), enable scrolling.
- Fix: render the list inside a scrollable container (e.g. `hmUI.widget.SCROLL_LIST`, or set the page
  scrollable via the appropriate `hmUI` scroll API for this firmware), OR if Zepp app pages scroll natively
  when content exceeds the viewport, confirm that's happening. Same check applies to the **Method picker**
  (5 options reach ~376px — borderline).

## Fix 2 (LIKELY: home double-renders): `build()` lifecycle inconsistency

The Zepp `Page()` runtime auto-calls `build()` after `onInit()` (zml's `BasePage` does not — it only wraps
onInit/onDestroy). Settings, picker, and qibla correctly rely on this: their `onInit` does NOT call
`build()`. **Home is the exception** — `onInit` calls `this.build()` manually (added in the Steps 1–3
fixes) AND `computeAndRender()` calls `build()`, so on the cached-location path the framework's auto-build
renders the ready screen a *second* time on top, leaving duplicate widgets (the orphaned set won't update
with the countdown).

- Verify on-device: doubled/bolded text on Home, or a duplicate static row behind the live one.
- Fix: make Home rely on the single framework auto-build for the initial render — don't call `this.build()`
  inside `onInit`. Set `state.phase`/`times` synchronously for the cached path so the auto-build renders the
  ready screen once; only call `destroyWidgets()`+`build()` for the async-fetch resolution and `onResume`.
  (Sorry — the Steps 1–3 "call build() in onInit" guidance caused this; this is the correct pattern.)

## Fix 3 (VERIFY): picker may not receive its `key` param

`settings-picker` reads the route param via `this._options && this._options.params`. The standard Zepp/zml
way is to read the argument passed to `onInit(param)` (parsing if it's a JSON string). If `this._options`
isn't populated on this firmware, every picker will fall to `pickerConfig(undefined)` → "Unknown setting".

- Verify on-device: tap "Calculation Method" — do you see the method list, or "Unknown setting"?
- Fix if broken: read the param from `onInit`'s argument, e.g. `onInit(p){ const params = typeof p === 'string' ? JSON.parse(p) : (p || {}); ... }`.

## Fix 4 (VERIFY — timers & sensor APIs on Bip 6)

Multiple features depend on runtime APIs that we haven't confirmed on the Bip 6. Test each; if a feature is
dead, that's the signal to switch APIs:
- **Timers:** Home countdown (`setInterval`), qibla figure-8 animation (`setInterval`), and the qibla
  calibrate **fallback** (`setTimeout`). If global timers don't fire, the calibrate screen could hang
  forever (fallback never runs) — important. Fall back to `@zos/timer` if needed.
- **Compass:** `new Compass()`, `.onChange()`, `.start()/.stop()`, `.getStatus()`, `.getDirectionAngle()` —
  confirm these are the correct `@zos/sensor` Compass methods on this firmware.
- **Image rotation:** the qibla arrow rotates via `IMG` `angle` + `center_x/center_y` `setProperty`. Confirm
  the arrow actually rotates; if unsupported, raise it (pre-rendered frames fallback).
- **Vibrator:** `new Vibrator().start()` — confirm it buzzes on alignment (a `setMode` may be needed).

## Optional polish
- `settings-picker` `renderOptionRow`: `rowColor` is `BACKGROUND` for both selected/unselected (the ternary
  is a no-op). Harmless, but either give the selected row a subtle highlight or drop the ternary.
- Qibla `renderActive` bottom text sits at y=346 (h18 → 364); fine on 390 but close to the round edge —
  glance-check it isn't clipped.

---

## Done when
- Settings (and method picker) are fully reachable on the Bip 6 (scroll added if needed).
- Home renders once (no duplicate widgets); verified on-device.
- Pickers receive their `key` and show the correct option list.
- Timers, compass, image-rotation, and vibrator confirmed working on the Bip 6 (or swapped for working APIs).
- 30 `shared/` tests still green.
