# Project Roadmap

V1 of the Prayer Times Zepp watch app, grouped into 3 epics. The codebase is small (~15 source files),
so epics are coarse and the **step** (sent to the AI coder and reviewed one at a time) is the real work
unit — aim for ~8–12 steps total. Only genuinely complex steps get their own `feature-*.md`; the rest
are checklist items in each epic's `overview.md`. The current code is a **spike** (working location + 5
test alarms) and is restructured in Epic 1.

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

## Epic 03 — Multi-target & Store (fast-follow)

### Purpose
Bring the `gt` family to parity and prepare the store submission. Bip 6 ships first; this can follow.

### Included Features
- `gt` `r`/`s` layouts for home / settings / qibla (logic reused from `shared/`, layout only).
- Icons/assets per target; store description + screenshots.
- Final offline + permissions audit.

### Dependencies
Epic 02.

### Estimated Complexity
Medium.

### Priority
Medium.

### Implementation Notes
Mostly layout files — no new logic. Could be deferred entirely if a Bip-6-only V1 ships first.
