# Epic 03 — Multi-target & Store — Overview

**Status:** not started.
**How to use:** in each AI-coder session, point at this file and say *"implement Step N"*. Do the steps in
order. Each feature step links to a `feature-*.md` (full spec) and the matching `*-design.md` (layout) —
open both, plus the **shipped Bip 6 page** it's ported from.
**Source of truth:** `epic-spec.md`. Do not expand scope beyond it. **No new logic — port Bip 6 layout,
consume `shared/` + `lib/reminders.js` as-is.**
**Rules (Bip 6 hard-won — apply from line 1):**
- Image `src` MUST start with `image/` (else nothing renders).
- Never tint an `IMG` via `color` (it hides it); recolor only `ARC`/`FILL_RECT`/`TEXT`.
- `IMG` widget `w`/`h` must equal the PNG's pixel size (no `auto_scale`); resize assets.
- Image rotation: `setProperty(hmUI.prop.MORE, { angle })`, pivot `center_x/center_y` = widget-relative.
- One coordinate system; `px()` + `designWidth: 480`; don't mix physical `DEVICE_WIDTH` with `px(design)`.
- Compass: poll `getDirectionAngle()`, gate on a valid heading (not `getStatus()`).
- `setStatusBarVisible(false)`; no `?.`; flattened colors; bundled PNGs; respect the round safe area on `gt.r`.

---

## Step 1 — gt scaffolding & assets  (checklist)
- [ ] Register the gt pages in `app.json` under `gt.module.page.pages`:
      `page/gt/home/index.page`, `page/gt/settings/index.page`, `page/gt/settings-picker/index.page`,
      `page/gt/qibla/index.page`.
- [ ] Re-bundle every `ic_*` PNG under `assets/gt.r/image/` and `assets/gt.s/image/` (copy from
      `assets/bip6/image/`, resize per the gt display sizes; keep the regenerated Kaaba icon).
- [ ] Verify `lib/theme.js` font sizes read well at 480px; bump per-target if needed **without regressing
      Bip 6** (e.g. derive from `designWidth` or add gt-specific constants).

## Step 2 — gt Home  →  `feature-01-gt-home.md` + `../../05-ui-sketches/home-design.md`
- [ ] Copy `page/bip6/home/index.page.js` state machine verbatim; re-lay-out for 480 round + square.
- [ ] Current-prayer highlight + live countdown, hijri, city, nav to Settings/Qibla, `applyReminders()` on open.
- [ ] Round safe-area check (`gt.r`) and square check (`gt.s`).

## Step 3 — gt Settings + Picker  →  `feature-02-gt-settings.md` + `../../05-ui-sketches/settings-design.md`
- [ ] Port the settings list + the two toggle cards (Asr Madhab, Time Format) + the reusable picker.
- [ ] On any change: `setSettings` → `applyReminders()`; confirm scrolling reaches every row on 480.

## Step 4 — gt Qibla  →  `feature-03-gt-qibla.md` + `../../05-ui-sketches/qibla-design.md`
- [ ] Port the compass logic unchanged (poll heading, rotate arrow, fixed Kaaba target, rotating cardinals).
- [ ] Re-center/resize dial + arrow + Kaaba for 480; aligned green + vibrate; stop sensor on exit.
- [ ] Remove any leftover `heading` debug readout before shipping.

## Step 5 — Store assets & submission  (checklist)
- [ ] App icon per target: 240×240 PNG, circular, transparent background, no padding.
- [ ] Generate store screenshots (use the ASO screenshot skill) for Home, Qibla, Settings.
- [ ] Finalize `docs/app-store-listing.md` (English + Arabic copy, permissions, SDK=No, music=No).

## Step 6 — Final offline & permissions audit  (checklist)
- [ ] Airplane mode after first location fetch: all screens work; reminders still fire.
- [ ] `app.json` permissions match real usage (no unused permission requested); bump `version.code`/`name`.
- [ ] No debug leftovers / console spam across all targets.

---

## Quick References
- Epic spec: `epic-spec.md` · Roadmap: `../roadmap.md`
- Reference impl (shipped): `../../../page/bip6/{home,settings,settings-picker,qibla}/index.page.js`
- Architecture: `../../06-architecture/architecture.md` · AI rules: `../../07-ai-coding/ai-context.md`
- Design specs: `../../05-ui-sketches/{home,settings,qibla}-design.md`
- Store copy: `../../app-store-listing.md`
- Feature specs: `feature-01-gt-home.md`, `feature-02-gt-settings.md`, `feature-03-gt-qibla.md`
