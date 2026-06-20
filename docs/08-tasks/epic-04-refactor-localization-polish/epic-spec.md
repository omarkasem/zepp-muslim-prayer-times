# Epic Purpose

Pay down duplication and finish the product polish before wide release: extract the per-device pages into a
**shared architecture** (so Bip 6 / gt / future devices stop copy-pasting `index.page.js`), give the prayer
**reminder a branded custom alert** (app logo, not the bare system notification), fix the **Home Qibla/
Settings buttons** (cut off at the sides), add full **Arabic localization** (RTL + translated strings), and
set the **correct app identity** (id + English/Arabic names) in all files.

This epic spans architecture, UI polish, notifications, i18n, and metadata. It is the "make it shippable
and maintainable" epic.

# Included Features

- **Shared page architecture + multi-device** — extract non-layout page logic (state machines, compass
  handling, formatting, the prayer engine orchestration) into reusable `lib/` controllers; keep thin
  per-target layout. Make adding a new device a layout-config change, not a copy of the page. Add more
  device targets where feasible. **(complex → `feature-01-shared-architecture.md`)**
- **Custom prayer alert** — replace the default system notification with a branded alert showing the app
  logo + prayer name (custom alert page and/or richer notification + polished icon + vibration).
  **(complex → `feature-02-custom-prayer-alert.md`)**
- **Arabic localization** — drive all UI text through i18n; add Arabic strings (prayer names, labels,
  Hijri months, alert text), RTL-aware layout, and the Arabic app name; follow the device/app language.
  **(complex → `feature-03-arabic-localization.md`)**
- **Home nav buttons fix** — redesign the Qibla/Settings buttons so labels aren't cut off at the sides.
  **(simple → overview checklist)**
- **App identity & metadata** — set `appId: 1115692`, app name "Muslim Prayer Times", Arabic name
  "مواقيت صلاة المسلم" in `app.json` (+ i18n + the listing doc). **(simple → overview checklist)**

# Excluded Features

- New end-user features (manual location, GPS, athan audio, per-prayer config, tiles) → future.
- Changes to `shared/` prayer math behavior. The refactor may move/rename UI glue in `lib/` and pages, but
  must not alter computed results or alarm semantics.
- Store screenshot generation (Epic 03 Step 5).

# Feature Boundaries

**Shared architecture (feature-01)** — purpose: one source of truth per screen, thin per-device layout.
Complexity: High (cross-cutting refactor with regression risk). Deps: the shipped Bip 6 pages, `shared/`,
`lib/{theme,reminders}`. Arch notes: separate "controller/logic" (device-agnostic) from "view/layout"
(per shape/size). `shared/` stays `@zos`-free; new UI glue lives in `lib/`. `lib/theme.js` already scales
fonts by width (Bip 6 390 vs gt 480) — build on that.

**Custom alert (feature-02)** — purpose: branded, recognizable prayer alert. Complexity: Medium-High
(platform-limited). Deps: `app-service/reminder.js`, `lib/reminders.js`, `@zos/notification`, app logo
asset, possibly `@zos/alarm` page-launch. Arch notes: `notify()` exposes only title/content/actions/
vibrate (no logo field) — a logo requires either the app icon (shown by the system) or a **custom
full-screen alert page** launched when the alarm fires. Decide during implementation; keep a graceful
fallback to the system notification.

**Arabic localization (feature-03)** — purpose: full Arabic UI when the user's language is Arabic.
Complexity: High (touches every string + layout). Deps: i18n (`page/i18n/*.po`, `@zos/i18n` `getText`),
all four pages + the alert + `app-service`. Arch notes: no page currently uses `getText` — every hardcoded
string must move to a key; add `ar-SA.po`; handle RTL alignment and Arabic prayer/Hijri-month names.

# Shared Services

- **`lib/` controllers (new)** — device-agnostic page logic extracted from the Bip 6 pages (e.g. a home
  controller computing current/next prayer + countdown; a qibla controller owning the compass poll +
  alignment). Pages become thin views that call these.
- **`lib/theme.js`** — colors + width-scaled font sizes (already scales for gt). Extend with any
  layout/responsive helpers the refactor needs.
- **`lib/reminders.js`** — unchanged scheduling; feature-02 changes only how the alert is *presented*.
- **`lib/i18n` helper (new, optional)** — thin wrapper around `getText` + locale-aware helpers (Arabic
  prayer names, Hijri month names, RTL flag) so pages don't each re-derive them.
- **`app-side/index.js`** — unchanged `GET_LOCATION`.

# Shared Validation Logic

- None new. Inputs remain validated in `shared/`. i18n must never break a missing-key path — `getText`
  should fall back to a sensible default (e.g. the key or English) so a missing translation can't blank a screen.

# Shared UI Patterns (carry from Bip 6 — hard-won)

- Image `src` MUST be `image/`-prefixed; never tint an `IMG` via `color`; IMG `w`/`h` must equal the PNG
  pixel size (no `auto_scale`); rotation via `setProperty(MORE,{angle})`; one coordinate system with
  `px()` + `designWidth`; poll the compass heading (don't trust `getStatus()`); `setStatusBarVisible(false)`;
  no `?.`; flattened colors; bundled PNGs; respect the round safe area. (See Epic 03 spec for the full list.)
- **RTL:** in Arabic, right-align text and mirror left/right-anchored layout (back arrow, row values,
  nav buttons). Bake an `isRTL` flag into the shared view helpers.

# Dependencies

- The shipped Bip 6 pages (reference + refactor target). Epic 03's gt work is closely related — see Risks.
- `@zos/{ui,router,alarm,notification,sensor,app,i18n,device,page}`. `docs/app-store-listing.md` (names).

# Risks & Complexity Concerns

- **Refactor regression** — extracting shared logic from working pages risks breaking the (manually
  verified) Bip 6 behavior. Refactor incrementally, screen by screen, re-verifying each on-device.
- **Overlap with Epic 03** — Epic 03 plans to *duplicate* Bip 6 pages for gt; this epic *de-duplicates*.
  **Recommendation: do feature-01 (shared architecture) before/with the gt port** so gt is built on the
  shared controllers instead of copied then refactored. Sequence the two epics deliberately.
- **Custom alert is platform-limited** — `notify()` has no logo/layout control; a true branded alert needs
  a custom page launched on alarm fire, which may not reliably interrupt an arbitrary watchface. Verify
  on-device; keep the system-notification fallback.
- **i18n breadth** — every hardcoded string (4 pages + alert + service) must move to keys; missing keys or
  RTL mistakes can blank or misalign screens. Arabic numerals/Hijri names need correct data.
- **Multi-device verification** — "add more devices" multiplies the test matrix; only add targets you can
  actually verify (real device or simulator) before claiming support.

# Recommended Simplifications

- Split logic vs layout per screen, but **don't over-abstract** — a small shared controller module per
  screen + thin per-shape view is enough; avoid a generic UI framework.
- For the alert, if the custom page proves unreliable, ship a polished app icon + clear translated
  title/content + a distinct vibration as the "branding" and revisit the page later.
- Add device targets in **resolution/shape families** (reuse one layout per family) rather than one-off
  per model.
- Do the quick wins first (app identity, button fix) to de-risk the release while the refactor lands.

# Integration Test Scenarios

Manual, on each supported device/simulator (the `shared/` math is unit-tested):
- After the refactor, every Bip 6 screen behaves exactly as before (home highlight/countdown, settings
  persist+reschedule, qibla rotates+aligns, reminders fire).
- A new/added device renders all four screens correctly using the shared controllers.
- Prayer alarm fires → branded alert (logo + prayer name) shows + vibrates; dismiss works.
- Switch the watch/app language to Arabic → all screens, prayer names, Hijri date, and the alert appear in
  Arabic, right-aligned; switch back to English → English returns.
- App shows the correct name ("Muslim Prayer Times" / "مواقيت صلاة المسلم") and installs under id 1115692.

# AI Coding Concerns

- Refactor without changing behavior — keep `shared/` math and alarm semantics intact; re-verify each
  screen after extraction.
- Route ALL user-facing text through i18n; never leave a hardcoded English string in a page.
- Apply every "Shared UI Patterns" rule from the first commit (they are the Bip 6 bug list) + RTL.
- Coordinate with Epic 03: prefer shared controllers over copied gt pages.
