# Epic Purpose

Build the pure, testable core of the app — prayer-time calculation, calculation methods, hijri date,
qibla bearing, alarm planning, storage, and location — before any UI depends on it. Everything here is
either pure logic (`shared/`, unit-tested in Node) or the phone-side location lookup. No screens.

# Included Features

- Project restructure: spike → real layout; remove the 5-test-alarm code from the home page.
- Vitest tooling for `shared/` unit tests.
- `shared/storage.js` — typed get/set for the locked keys + defaults.
- `shared/methods.js` — calculation-method presets.
- `shared/prayer-times.js` — compute the 5 daily times. **(complex → `feature-01-prayer-times.md`)**
- `shared/hijri.js` — gregorian → hijri.
- `shared/qibla.js` — bearing to Mecca.
- `shared/scheduler.js` — plan alarm set/cancel from times + offset. **(complex → `feature-02-scheduler.md`)**
- `app-side/index.js` — `GET_LOCATION` IP lookup + cache to `storage.location`.

# Excluded Features

- All screens (home, settings, qibla UI) → Epic 02.
- `app-service` reminder/rollover handler → Epic 02 (Epic 01 only provides the `scheduler.js` *plan*).
- `gt` layouts, store assets → Epic 03.
- Manual location override, GPS, API cross-check → future.

# Feature Boundaries

**`shared/storage.js`** (simple plumbing → checklist)
- Purpose: single source of truth for persisted keys (`location`, `settings`, `alarmIds`, `scheduledThrough`) + defaults.
- Complexity: Low.
- Dependencies: none (wraps `@zos/storage` — but keep the pure parts testable; see AI Concerns).
- Architecture notes: the only module here allowed to touch `@zos/storage`. Defaults applied on read-miss.

**`shared/methods.js`** (simple plumbing → checklist)
- Purpose: calculation-method presets (Fajr/Isha angles etc.) keyed by id.
- Complexity: Low.
- Dependencies: none.
- Architecture notes: pure data + a `getMethod(id)` lookup. Pick a sensible default method.

**`shared/prayer-times.js`** (complex → feature-01)
- Purpose: compute the 5 times from location + settings + date.
- Complexity: High (astronomy + timezone correctness).
- Dependencies: `methods.js`.
- Architecture notes: pure, no `@zos/*`. Port an established algorithm. See feature-01.

**`shared/hijri.js`** (simple → checklist)
- Purpose: gregorian → hijri date for display.
- Complexity: Low-Medium (known algorithm).
- Dependencies: none.
- Architecture notes: pure function `toHijri(date) → {day, monthName, year}`. Tabular/arithmetic algorithm is fine for V1.

**`shared/qibla.js`** (simple → checklist)
- Purpose: great-circle bearing from coordinates to Mecca (21.4225, 39.8262).
- Complexity: Low (one formula).
- Dependencies: none.
- Architecture notes: pure `qiblaBearing({lat, lon}) → degrees 0–360`.

**`shared/scheduler.js`** (complex → feature-02)
- Purpose: turn computed times + reminder offset into an alarm set/cancel plan across a multi-day window.
- Complexity: Medium-High (rollover, dedupe, stale cancellation).
- Dependencies: `prayer-times.js` (consumes its output), `storage.js` (reads location/settings, ids).
- Architecture notes: pure planner — returns a plan describing which alarms to cancel and which to
  create; does NOT call `@zos/alarm` itself (the caller in Epic 02 does). See feature-02.

**`app-side/index.js`** (simple → checklist; spike exists)
- Purpose: `GET_LOCATION` IP lookup, returns `{lat, lon, city, country, timezone}`.
- Complexity: Low.
- Dependencies: network (phone only).
- Architecture notes: keep the existing ipwho.is → ipapi.co fallback + defensive body parse.

# Shared Services

- `app-side/index.js` (`GET_LOCATION`) is the only service in this epic. Consumed by the page (Epic 02)
  to populate `storage.location`.

# Shared Validation Logic

- Coordinate/payload validation lives in `storage.js` setters and at the `app-side` boundary: reject
  payloads where `lat`/`lon` are missing or non-numeric; require a non-empty `timezone` before caching.
- `getSettings()` clamps/falls back to defaults for unknown method/madhab/highLatRule values.

# Shared UI Patterns

- None — no UI in this epic.

# Dependencies

- External: a portable prayer-time algorithm (adhan-style) and a hijri conversion. Both must run in
  plain JS (`Date`/`Math` only).
- Internal: `prayer-times.js` → `methods.js`; `scheduler.js` → `prayer-times.js` + `storage.js`.

# Risks & Complexity Concerns

- **Timezone correctness** — the #1 "inaccurate" bug. Times must reflect the location's timezone offset,
  not assume the test machine's / a hardcoded offset.
- **Algorithm port** — chosen library must not use Node/DOM APIs.
- **Storage testability** — `@zos/storage` isn't available under Node; keep pure logic separable from the
  storage I/O so the bulk is testable (see AI Concerns).
- **High latitude** — extreme-latitude inputs must not produce NaN/invalid times; honor the high-lat rule.

# Recommended Simplifications

- Hijri: arithmetic/tabular algorithm, not a full astronomical sighting model.
- `scheduler.js` returns a *plan* (data) — no side effects — so it's fully unit-testable and the
  `@zos/alarm` calls stay in Epic 02.
- Keep `methods.js` to the handful of common methods; more are additive later.

# Integration Test Scenarios

Cross-feature flows within this epic (Vitest, off-device):
- `getSettings()` defaults → `computePrayerTimes()` → `planAlarms()` produces a valid alarm plan for a
  known location/date (end-to-end through the pure modules).
- Day-rollover: planning on day N covers day N+1 when the window crosses midnight, with no duplicate ids.
- Changing `reminderOffsetMin` shifts every planned alarm time by the offset.

# AI Coding Concerns

- `shared/` modules import **no** `@zos/*`. For `storage.js`, isolate the I/O: a thin `@zos/storage`
  wrapper plus pure default/validation helpers that are unit-tested directly (the wrapper is verified
  on-device). Do not let `@zos/storage` leak into `prayer-times`/`scheduler`/etc.
- Do not call `@zos/alarm`, `fetch`, or any device API from `shared/`.
- Preserve the exact storage keys and settings field names from `07-ai-coding/ai-context.md`.
- Don't build any page/UI in this epic.
