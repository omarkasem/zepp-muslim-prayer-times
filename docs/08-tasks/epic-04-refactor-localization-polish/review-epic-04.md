# Epic 04 — Code Review (Refactor, Localization & Polish)

**Reviewer:** Claude (Opus 4.8) · **Date:** 2026-06-20 · **Scope:** uncommitted working-tree diff implementing Steps 1–4.

## Verdict

Good overall shape — the controller extraction is clean, the `lib/` split matches the spec, the `.po`
files have full EN/AR parity (47/47 keys), and the per-target views are thin. **But the epic is not
shippable yet:** there are **7 blocking bugs**, two of which are crashes/feature-dead-on-arrival on the
**primary device (Bip 6)** and the **entire RTL feature**. Fix the blockers, then re-verify on-device.

Legend: 🔴 blocking · 🟡 should-fix · ⚪ nit

---

## 🔴 Blocking

### 1. Bip 6 Home crashes — `hijri` is undefined
`page/bip6/home/index.page.js:128-132` uses `hijri.month` / `hijri.year` / `hijri.day`, but **`hijri` is
never defined**. `toHijri` is imported (line 6) and `today` is computed (line 128) but `toHijri(today)` is
never called. This throws `ReferenceError: hijri is not defined` in `renderHeader`, breaking the entire
Home screen on Bip 6.

The gt copy is correct — `page/gt/home/index.page.js:128` has `const hijri = toHijri(today);`. The bip6
file is just missing that one line.

**Fix:** add `const hijri = toHijri(today);` after `const today = new Date();` in
`page/bip6/home/index.page.js`.

> This strongly suggests Bip 6 Home was **not run after the refactor** — the spec explicitly requires
> re-verifying every Bip 6 screen. Please actually launch each screen on the Bip 6 target.

### 2. RTL never activates — `getDeviceInfo()` has no `language` field
`lib/i18n.js:67` reads `const { language } = getDeviceInfo();`. Per `@zeppos/device-types`, the
`getDeviceInfo()` result has **no `language` property** (it exposes `width, height, screenShape,
deviceName, keyNumber, deviceSource, keyType, deviceColor, uuid`). So `language` is always `undefined`,
`isRTL()` always returns `false`, and **all the RTL branching across every page is dead** — Arabic renders
left-aligned/un-mirrored. This fails the core of feature-03.

**Fix:** use `getLanguage()` from `@zos/settings` (returns a numeric language code). Determine the Arabic
code on-device (log `getLanguage()` with the watch set to Arabic) and compare against it, e.g.:
```js
import { getLanguage } from "@zos/settings";
export function isRTL() {
  try { return getLanguage() === LANGUAGE_AR; } catch (e) { return false; }
}
```
Note `getText()` itself switches correctly off the system locale, so only the `isRTL()` source is wrong —
but it gates every mirrored layout, so RTL is currently completely untested. Verify EN↔AR on-device.

### 3. Alert vibration is dead — wrong class name
`lib/controllers/alert-controller.js:2,32` import and use `Vibrate` from `@zos/sensor`. The exported class
is **`Vibrator`** (no `Vibrate` export — see `qibla-controller.js:1` which correctly uses `Vibrator`).
`new Vibrate()` throws, is swallowed by the `try/catch`, and the prayer alert **never vibrates** — a core
requirement of feature-02.

**Fix:** `import { Vibrator } from "@zos/sensor";` and `vibrate = new Vibrator();` (mirror the qibla
controller, optionally `setMode(VIBRATOR_SCENE_DURATION)`).

### 4. Alarm → alert-page target detection is unsound (alert won't launch on Bip 6)
`lib/reminders.js:53-55`:
```js
const { screenShape } = getDeviceInfo();
const target = screenShape === 1 ? "gt" : "bip6";
const APP_PAGE_URL = `page/${target}/alert/index.page`;
```
This can't work:
- `screenShape` distinguishes **round vs square**, not **gt vs bip6**. The `gt` target spans *both* a round
  (`st:"r"`) and a **square** (`st:"s"`) platform (`app.json:51-57`), and **Bip 6 is also square** — so
  square is ambiguous between gt.s and bip6.
- With `SCREEN_SHAPE_SQUARE` (Bip 6) the expression returns `"gt"`, so on a **Bip 6** the alarm points at
  `page/gt/alert/index.page`, which **does not exist in the bip6 build** → the prayer alert fails to open.

Runtime shape detection is the wrong mechanism. Each target build only contains its own `page/<target>/*`,
and the page files already hard-code their own target in `push()` URLs — so the target is a **build-time**
fact, not a runtime one.

**Fix options (pick one, verify on-device):**
- Detect by Bip 6's known `deviceSource` set (`9765120 / 9765121 / 10158337` from `app.json`) → `bip6`,
  else `gt`. Robust because gt.s ≠ those sources.
- Or pass the alert URL down from each per-target page (each page knows its target) instead of deriving it
  in shared code.

Also confirm on a real device that `@zos/alarm set({ url: "page/.../index.page" })` actually launches the
**page** (the prior code launched an `app-service`); if page-launch doesn't reliably surface over a
watchface, fall back to the polished-notification path (feature-02 Option B).

### 5. Alert logo is the wrong asset/size — violates the IMG sizing rule
Both alert pages render the logo as `w:px(100), h:px(100)` (`page/bip6/alert/index.page.js:43-49`,
`page/gt/alert/index.page.js:43-49`), but `assets/*/image/logo.png` is **225×56** (a wide wordmark).
The hard-won Bip 6 rule is **IMG `w`/`h` must equal the PNG pixel size — no scaling**; a 100×100 box over a
225×56 PNG will clip/misrender, not shrink the wordmark.

**Fix:** either (a) use a square brand asset sized to its box (e.g. a Kaaba/app mark — `ic_kaaba.png` exists,
or export icon.png to `image/`), or (b) draw the existing wordmark at its true `225×56` (scaled per
`designWidth`) and center it. Don't tint the IMG via `color`.

### 6. i18n key mismatch — figure-8 hint shows the raw key
`page/{bip6,gt}/qibla/index.page.js:176` call `t("figure8_motion")`, but the key defined everywhere
(`lib/i18n.js:39`, `en-US.po:103`, `ar-SA.po:103`) is **`figure_8_hint`**. `t("figure8_motion")` misses
both `getText` and the `FALLBACKS` map, so it returns the literal string **"figure8_motion"** on screen
(both languages, both targets).

**Fix:** call `t("figure_8_hint")` (or rename the key — but keep page, fallback map, and both `.po` files
in sync).

### 7. "Qibla" nav label is hard-coded English
`page/{bip6,gt}/home/index.page.js:284-285` pass the literal `"Qibla"` to the nav button while the adjacent
Settings button correctly uses `t("settings")`. There is **no `qibla` key** in `i18n.js`/`.po` at all. This
leaves untranslated English on the Home screen in Arabic — violating "no hardcoded user-facing English"
(and the long-Arabic-label concern of request #3).

**Fix:** add a `qibla` key to `lib/i18n.js` FALLBACKS + `en-US.po` + `ar-SA.po`, and use `t("qibla")`.

---

## 🟡 Should-fix

### 8. Double alert: full-screen page *and* a system notification
Now that prayer alarms launch the custom page (fix #4), `alert-controller.js:21-28` *also* fires
`notify(...)`. The spec wants `notify()` as a **graceful fallback**, not in addition — the user gets both a
full-screen branded alert and a redundant OS notification. Drop the `notify()` from the page path (or only
use it as the alternative when page-launch is unavailable).

### 9. Dead / unlocalized prayer path in `app-service/reminder.js`
With prayer alarms routed to the page, the app-service only handles `rollover` now, yet it still carries the
prayer `notify()` branch with a hard-coded English `PRAYER_LABELS` map and `"Time for "` string
(`app-service/reminder.js:7-13,35-40`). It's dead for prayers but still un-localized — remove it, or if you
keep it as the feature-02 fallback, route it through `lib/i18n` so the fallback is Arabic-aware too.

---

## ⚪ Nits

- `home-controller.js:104` — `const t = state.times;` shadows the imported i18n `t`. Harmless today (the
  i18n `t` isn't used inside `computeNext`), but rename to `times` to avoid a future foot-gun.
- `isRTL()` is invoked many times per `build()` (e.g. `home/index.page.js` calls it 5×). Once it calls
  `getLanguage()`, consider computing it once per build and passing the boolean down.
- Arabic countdown grammar: `formatCountdown` builds `label + " " + t("in") + " " + Nm`; with `in → "في"`
  the result reads awkwardly in Arabic. Optional polish (consider a template key).
- No `onDestroy`/widget cleanup in `settings`/`settings-picker` pages (Home/alert/qibla have it). Probably
  fine under BasePage, but confirm no widget leak across rebuilds.

---

## ✅ What's good

- Clean controller/view split; `shared/` math + alarm semantics untouched (per the constraint).
- `en-US.po` / `ar-SA.po` at full parity (47 keys each, no missing keys); sensible Arabic translations and
  Hijri month names in `lib/i18n.js`.
- `t()` has a safe fallback chain (`getText` → `FALLBACKS` → key), satisfying the "missing key never blanks
  a screen" requirement.
- App identity (Step 1) is correct: `appId 1115692`, EN/AR names in `app.json` + `.po`, version bumped to
  `1.3.0` / code `12`, alert pages registered in both targets.
- Home nav-button fix (request #3): the fit-to-content + centered icon+label sizing in `renderNavButton`
  looks right (clamps `groupW` to button width).
- No `?.`, no `console`/debug leftovers, `setStatusBarVisible(false)` present, `image/`-prefixed `src`.

---

## Suggested fix order
1. #1 (Bip 6 Home crash) — one line.
2. #3 + #6 + #7 — trivial corrections (class name, key name, missing key).
3. #2 (RTL via `getLanguage()`) + #4 (target detection) — need on-device language/alarm verification.
4. #5 (logo asset) + #8/#9 (alert dedupe) — branding polish.
5. **Then** run the feature-03/feature-02 on-device test matrix (EN↔AR, alarm fires → branded alert +
   vibrate + dismiss, rollover reschedule) on **both** Bip 6 and a gt device.
