# Epic 01 — Engine & Data — Overview

**Status:** not started.
**How to use:** in each AI-coder session, point at this file and say *"implement Step N"*. Do the steps
in order. Complex steps link to a `feature-*.md` with the full spec — open that too for those steps.
**Source of truth:** `epic-spec.md`. Do not expand scope beyond it.
**Rule:** every `shared/` module is pure — no `@zos/*` imports — so it runs under Node/Vitest.

---

## Step 1 — Tooling & restructure
- [x] Add Vitest as a devDependency; `npm test` runs `shared/` tests.
- [x] Create the `shared/` folder.
- [x] Remove the 5-test-alarm code (`scheduleReminders` + the button) from `page/bip6/home/index.page.js`;
      leave a minimal placeholder home page (the real home is Epic 02).
- [x] Confirm `app.json` page entries are valid (no broken paths); `settings`/`qibla` pages are added in Epic 02.

## Step 2 — `shared/storage.js`
- [x] Export `getLocation/setLocation`, `getSettings/setSettings`, `getAlarmIds/setAlarmIds`,
      `getScheduledThrough/setScheduledThrough`.
- [x] Storage keys exactly: `location`, `settings`, `alarmIds`, `scheduledThrough`.
- [x] Settings defaults: `{ method: <sensible default>, madhab: "standard", highLatRule: "none", reminderOffsetMin: 0 }`.
- [x] Validate setters: reject `location` without numeric `lat`/`lon` or empty `timezone`; clamp unknown setting values to defaults.
- [x] Isolate the `@zos/storage` I/O from pure default/validation helpers, and unit-test the helpers in Node.

## Step 3 — `shared/methods.js`
- [x] Preset map keyed by id (`umm_al_qura`, `mwl`, `egyptian`, `isna`, `karachi`) with Fajr/Isha params.
- [x] `getMethod(id)` returns the preset, or the default for unknown ids.
- [x] Tests: every preset has the required params; `getMethod("garbage")` returns the default.

## Step 4 — `shared/prayer-times.js`  →  full spec: `feature-01-prayer-times.md`
- [x] Implement `computePrayerTimes({lat, lon, timezone, date, method, madhab, highLatRule})` → 5 epoch-ms instants.
- [x] Port an established algorithm (adhan-style); map method→angles via `methods.js`; madhab→Asr factor.
- [x] Handle the location timezone and the high-latitude rule. Validate inputs.
- [x] Tests per the feature file (incl. a non-local timezone and a high-latitude case).

## Step 5 — `shared/hijri.js`
- [ ] `toHijri(date) → { day, month, monthName, year }` (arithmetic/tabular algorithm).
- [ ] Tests: a few known gregorian→hijri reference dates convert correctly.

## Step 6 — `shared/qibla.js`
- [ ] `qiblaBearing({ lat, lon }) → degrees` (0–360, great-circle to 21.4225, 39.8262).
- [ ] Tests: known cities (e.g. Cairo ≈ 136°, plus one or two more) within ±1°.

## Step 7 — `shared/scheduler.js`  →  full spec: `feature-02-scheduler.md`
- [ ] Implement `planAlarms({...})` → `{ cancelIds, create, scheduledThrough }` (pure, no side effects).
- [ ] `create[].time` = epoch-seconds, future only, `prayerInstant − reminderOffsetMin`.
- [ ] Inject `computeTimes`; cover today's remaining + window-days; full-replace cancel semantics; idempotent.
- [ ] Tests per the feature file (mid-day, offset, rollover, idempotency).

## Step 8 — `app-side/index.js` location cleanup
- [ ] Keep `GET_LOCATION` (ipwho.is → ipapi.co fallback, defensive `res.body` parse).
- [ ] Ensure the returned shape is exactly `{ lat, lon, city, country, timezone }`.
- [ ] (Caching into `storage.location` happens page-side in Epic 02 — here, just return the clean shape.)

---

## Quick References
- Architecture: `../../06-architecture/architecture.md`
- AI rules: `../../07-ai-coding/ai-context.md`
- Epic spec: `epic-spec.md` · Roadmap: `../roadmap.md`
- Feature specs: `feature-01-prayer-times.md` (Step 4), `feature-02-scheduler.md` (Step 7)
