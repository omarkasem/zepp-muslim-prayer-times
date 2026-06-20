# Epic 04 — Refactor, Localization & Polish — Overview

**Status:** not started.
**How to use:** in each AI-coder session, point at this file and say *"implement Step N"*. Steps are ordered
for build efficiency (quick wins first, then the big refactor, then alert, then i18n last so it covers the
refactored code). Each maps to one of the five requested features.
**Source of truth:** `epic-spec.md`. Do not expand scope beyond it. **Don't change `shared/` math or alarm
semantics — this is refactor + polish + i18n.**
**Rules (Bip 6 hard-won — apply from line 1):** `image/`-prefixed `src`; never tint an `IMG` via `color`;
IMG `w`/`h` = PNG pixel size; rotation via `setProperty(MORE,{angle})`; one coord system (`px()` +
`designWidth`); poll the compass heading (not `getStatus()`); `setStatusBarVisible(false)`; no `?.`;
flattened colors; round safe area; **plus RTL** for Arabic.

> Sequencing note: this epic's Step 3 (shared architecture) overlaps Epic 03 (gt layouts). Prefer building
> gt on the shared controllers here rather than copying Bip 6 pages then de-duplicating. Decide before
> starting Epic 03 Step 2.

---

## Step 1 — App identity & metadata  (checklist) — *request #5*
- [ ] `app.json`: set `app.appId` to **1115692**; `app.appName` to **"Muslim Prayer Times"**.
- [ ] `app.json` `i18n`: `en-US.appName` = "Muslim Prayer Times"; add `ar-SA.appName` = "مواقيت صلاة المسلم".
- [ ] `page/i18n/en-US.po`: `appName` → "Muslim Prayer Times"; add `page/i18n/ar-SA.po` with the Arabic name.
- [ ] Bump `app.version.code` / `name`. Confirm `docs/app-store-listing.md` matches (already "Muslim Prayer Times").

## Step 2 — Home Qibla/Settings buttons fix  (checklist) — *request #3*
- [ ] Rework the Home bottom nav so the **"Qibla" / "Settings" labels are never cut off** at the sides
      (size the label box to fit, center icon+label, keep within the safe area on all targets).
- [ ] Verify on the real Bip 6 (and gt once it exists) at the longest label/locale (Arabic too).

## Step 3 — Shared page architecture + multi-device  →  `feature-01-shared-architecture.md` — *request #1*
- [ ] Extract device-agnostic page logic (home current/next + countdown; qibla compass poll + alignment;
      settings state) into `lib/` controllers; pages become thin per-target views.
- [ ] Remove the copy-paste between `page/bip6/*` and `page/gt/*`; both consume the shared controllers.
- [ ] Make adding a device a layout-config addition; add new device targets where verifiable.
- [ ] Re-verify every Bip 6 screen behaves exactly as before.

## Step 4 — Custom prayer alert with logo  →  `feature-02-custom-prayer-alert.md` — *request #2*
- [ ] Investigate: custom full-screen alert page launched on alarm fire vs richer `notify()` + polished icon.
- [ ] Implement a branded alert (app logo + prayer name + dismiss), with the system notification as fallback.
- [ ] Keep vibration; ensure dismiss/auto-timeout; don't break the rollover reschedule.

## Step 5 — Arabic localization + RTL  →  `feature-03-arabic-localization.md` — *request #4*
- [ ] Move every hardcoded UI string to i18n keys; add `ar-SA.po` translations (labels, prayer names,
      Hijri months, alert text, settings options).
- [ ] RTL: right-align text and mirror left/right-anchored layout when the locale is Arabic.
- [ ] Follow the device/app language; fall back safely on missing keys. Verify EN↔AR switching.

---

## Quick References
- Epic spec: `epic-spec.md` · Roadmap: `../roadmap.md` · Related: `../epic-03-multitarget-store/`
- Reference impl (shipped): `../../../page/bip6/{home,settings,settings-picker,qibla}/index.page.js`
- Alert/reminders: `../../../app-service/reminder.js`, `../../../lib/reminders.js`
- i18n: `../../../page/i18n/`, `@zos/i18n` `getText`
- Architecture: `../../06-architecture/architecture.md` · AI rules: `../../07-ai-coding/ai-context.md`
- Store copy / names: `../../app-store-listing.md`
- Feature specs: `feature-01-shared-architecture.md`, `feature-02-custom-prayer-alert.md`, `feature-03-arabic-localization.md`
