# Project Roadmap

V1 of the Prayer Times Zepp watch app. Originally 3 epics; now **5** after the post-Bip-6 work grew
(refactor, custom alert, Arabic, store split out). The **step** (sent to the AI coder and reviewed one at a
time) is the real work unit. Only genuinely complex steps get their own `feature-*.md`; the rest are
checklist items in each epic's `overview.md`.

Epic flow: **01** engine → **02** Bip 6 app → **03** gt multi-target (done) → **04** refactor + alert +
Arabic + app identity → **05** store submission & release audit (last). Store/audit were moved out of Epic
03 into Epic 05 so they run after all app-changing work.

---

## Epic 01 — Engine & Data

### Purpose
Build the pure, testable core (`shared/`) plus storage and location, so everything accuracy-critical
exists and is unit-tested before any UI depends on it.

### Included Features
- Restructure the spike into the real layout; remove test-alarm code.
- `shared/storage.js` — locked keys (`location`, `settings`, `alarmIds`, `scheduledThrough`) + defaults.
- `shared/prayer-times.js` — `computePrayerTimes({lat, lon, timezone, date, method, madhab, highLatRule})`. **(complex → feature file)**
- `shared/methods.js` — calculation-method presets.
- `shared/hijri.js` — gregorian → hijri.
- `shared/qibla.js` — bearing to Mecca from coordinates.
- `shared/scheduler.js` — plan alarm set/cancel from times + offset. **(complex → feature file)**
- `app-side/index.js` — `GET_LOCATION` IP lookup, cache to `storage.location` (spike mostly done).
- Vitest configured; `shared/` tests vs known references (multi-location, high-latitude, non-local timezone).

### Dependencies
None.

### Estimated Complexity
High (correctness-critical math + timezone handling).

### Priority
Critical.

### Implementation Notes
`shared/` imports **no** `@zos/*` so it runs under Node/Vitest. Don't build UI yet. Port an established
prayer algorithm — do not hand-roll astronomy. Likely feature files: `feature-01-prayer-times.md`,
`feature-02-scheduler.md`; everything else is a checklist in `overview.md`.

---

## Epic 02 — Watch App

### Purpose
The on-device app: screens + reminders, wired to the Epic 1 engine.

### Included Features
- Home screen (Bip 6) from the chosen design: today's times, next-prayer highlight + live countdown,
  hijri date, city, nav to Settings/Qibla. **(complex → feature file)**
- Reminders: `app-service/reminder.js` — alarm wake → notify + vibrate; rollover wake → recompute &
  reschedule via `shared/`; `alarmIds`/`scheduledThrough` bookkeeping. **(complex → feature file)**
- Settings screen: method, madhab, high-latitude rule, reminder offset → on save recompute + reschedule.
- Qibla screen: `@zos/sensor` compass using `shared/qibla.js`; aligned + calibrate states. **(complex → feature file)**

### Dependencies
Epic 01; chosen designs in `05-ui-sketches/{home,settings,qibla}-design.md`.

### Estimated Complexity
Medium-High (alarm rollover reliability + compass sensor).

### Priority
Critical.

### Implementation Notes
Use `px()` + `designWidth`. Cancel stale alarms before rescheduling; keep the scheduled window to 2–3
days; test multi-day on-device. Confirm the Bip 6 compass API early. Likely feature files:
`feature-01-home.md`, `feature-02-reminders.md`, `feature-03-qibla.md`; Settings is a checklist if simple.

---

## Epic 03 — Multi-target (gt)  ✅ steps 1–4 done

### Purpose
Bring the `gt` family (round `r` + square `s`, 480px) to parity with Bip 6. Layout only.

### Included Features
- `gt` `r`/`s` layouts for home / settings / settings-picker / qibla (logic reused from `shared/`).
- Icons/assets per target.

### Status
gt pages built, registered, assets bundled, and rule-checked. **Store submission + final audit were moved
out to Epic 05** (so they run truly last). The gt pages are duplicates of Bip 6 — **Epic 04 collapses that.**

### Dependencies
Epic 02.

---

## Epic 04 — Refactor, Localization & Polish

### Purpose
De-duplicate the per-device pages and finish product polish before release.

### Included Features (build order)
1. App identity & metadata — `appId 1115692`, name "Muslim Prayer Times" / "مواقيت صلاة المسلم".
2. **Shared page architecture** — extract device-agnostic logic into `lib/` controllers; collapse the
   bip6/gt duplication; **fold in the Home Qibla/Settings button fix**; allow more device targets.
3. **Custom prayer alert** — branded alert with the app logo (custom page and/or richer notification).
4. **Arabic localization + RTL** — i18n pass + `ar-SA.po`; done last so it covers one refactored codebase.

### Dependencies
Epic 03 (gt exists). Do the refactor (#2) before the alert/Arabic so those land once.

### Estimated Complexity
High (cross-cutting refactor + full i18n).

### Priority
High (precedes release).

---

## Epic 05 — Store Submission & Release Audit (the last epic)

### Purpose
Final collateral, verification, and store submission — after Epic 04 is frozen.

### Included Features
- Final offline + permissions audit; finalize app id/version.
- Store assets: app icon + EN/AR screenshots.
- Listing finalization (`../app-store-listing.md`) + privacy-policy URL if required; submit.

### Dependencies
Epic 04 complete (UI, app id/name, Arabic all final).

### Estimated Complexity
Low–Medium (no code).

### Priority
Last.

### Implementation Notes
No feature work — route any real bug found during the audit back to its owning epic, then resume.
