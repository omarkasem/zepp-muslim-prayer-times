# Epic 04 — Refactor, Localization & Polish — Overview

**Status:** not started.
**How to use:** in each AI-coder session, point at this file and say *"implement Step N"*. Steps are ordered
for build efficiency: app-identity first (independent), then the **refactor** (which also fixes the Home
buttons), then the custom alert, then Arabic **last** so it localizes the already-refactored single codebase.
Covers requests #1–#5. Store submission + final audit are **Epic 05** (run after this epic).
**Source of truth:** `epic-spec.md`. Do not expand scope beyond it. **Don't change `shared/` math or alarm
semantics — this is refactor + polish + i18n.**
**Rules (Bip 6 hard-won — apply from line 1):** `image/`-prefixed `src`; never tint an `IMG` via `color`;
IMG `w`/`h` = PNG pixel size; rotation via `setProperty(MORE,{angle})`; one coord system (`px()` +
`designWidth`); poll the compass heading (not `getStatus()`); `setStatusBarVisible(false)`; no `?.`;
flattened colors; round safe area; **plus RTL** for Arabic.

> Sequencing note: Epic 03 (gt layouts) is **done** — the gt pages are full duplicates of Bip 6. Step 2's
> refactor collapses that duplication into shared controllers so the alert (Step 3) and Arabic (Step 4) are
> implemented **once**, not across bip6 + gt.r + gt.s. Do Step 2 before Steps 3–4. Store/audit = Epic 05.

---

## Step 1 — App identity & metadata  (checklist) — *request #5*
- [ ] `app.json`: set `app.appId` to **1115692**; `app.appName` to **"Muslim Prayer Times"**.
- [ ] `app.json` `i18n`: `en-US.appName` = "Muslim Prayer Times"; add `ar-SA.appName` = "مواقيت صلاة المسلم".
- [ ] `page/i18n/en-US.po`: `appName` → "Muslim Prayer Times"; add `page/i18n/ar-SA.po` with the Arabic name.
- [ ] Bump `app.version.code` / `name`. Confirm `docs/app-store-listing.md` matches (already "Muslim Prayer Times").

## Step 2 — Shared page architecture + multi-device  →  `feature-01-shared-architecture.md` — *requests #1 + #3*
- [ ] Extract device-agnostic page logic (home current/next + countdown; qibla compass poll + alignment;
      settings state) into `lib/` controllers; pages become thin per-target views.
- [ ] Collapse the copy-paste between `page/bip6/*` and `page/gt/*` (gt is **already a full duplicate** —
      Epic 03 steps 1–4 are done); both consume the shared controllers.
- [ ] **Fold in the Home Qibla/Settings button fix (request #3):** in the shared Home view, size the label
      box to fit + center icon+label so "Qibla"/"Settings" are never cut off (incl. long Arabic labels) —
      fixed once, applies to every device.
- [ ] Make adding a device a layout-config addition; add new device targets where verifiable.
- [ ] Re-verify every Bip 6 + gt screen behaves exactly as before.

## Step 3 — Custom prayer alert with logo  →  `feature-02-custom-prayer-alert.md` — *request #2*
- [ ] Investigate: custom full-screen alert page launched on alarm fire vs richer `notify()` + polished icon.
- [ ] Implement a branded alert (app logo + prayer name + dismiss), with the system notification as fallback.
- [ ] Keep vibration; ensure dismiss/auto-timeout; don't break the rollover reschedule.

## Step 4 — Arabic localization + RTL  →  `feature-03-arabic-localization.md` — *request #4*
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
