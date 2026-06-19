# Purpose

Turn computed prayer times + the reminder offset into a pure **alarm plan**: which existing alarms to
cancel and which new alarms to create, across a small multi-day window, with a rollover alarm so
reminders keep firing without opening the app. Pure planner — it performs no side effects.

# User Value

Reliable wrist reminders at every prayer, every day, even if the app is never opened.

# Dependencies

- `shared/prayer-times.js` (produces the instants this plans against).
- `shared/storage.js` shape (`alarmIds`, `scheduledThrough`, `settings.reminderOffsetMin`) — passed in,
  not read here.

# Target Files

- `shared/scheduler.js` (create)
- `shared/__tests__/scheduler.test.js` (create)

# Public Interface

```js
// shared/scheduler.js — pure. No @zos/*.
export function planAlarms({
  now,                 // epoch-ms "current time"
  location,            // { lat, lon, timezone }
  settings,            // { method, madhab, highLatRule, reminderOffsetMin }
  existingAlarmIds,    // number[] currently scheduled (from storage)
  scheduledThrough,    // epoch-ms / day-key of last day already covered, or null
  windowDays = 2,      // how many days ahead to keep scheduled
  computeTimes,        // inject computePrayerTimes (keeps this module dependency-light + testable)
}) /* => {
  cancelIds: number[],          // existing alarms to cancel (stale/past/superseded)
  create: [{ time, prayer }],   // alarms to create: epoch-SECONDS `time` = prayerInstant - offset, future only
  scheduledThrough,             // new high-water day to persist
} */
```

- `create[].time` is **epoch seconds** (what `@zos/alarm.set` expects), already offset-adjusted.
- The Epic 02 caller maps `create` → `@zos/alarm.set`, calls `@zos/alarm.cancel` on `cancelIds`, and
  persists the returned ids + `scheduledThrough`. This module never touches `@zos/alarm`.

# Related Services

- Consumed in Epic 02 by `app-service/reminder.js` (rollover) and the home page (on open / settings save).

# Related Shared Logic

- Calls the injected `computeTimes` (= `computePrayerTimes`) for each day in the window.

# Build Order

Last logic step of Epic 01 (Step 7), after `prayer-times.js`.

# Tasks

- For each day from today through `now + windowDays`, compute the 5 instants and subtract
  `reminderOffsetMin` to get reminder instants.
- Drop reminder instants already in the past (`<= now`).
- Produce `create` entries (epoch seconds + prayer name) only for future reminders not already covered
  by `scheduledThrough`.
- Produce `cancelIds` for all `existingAlarmIds` (full replace is simplest and safe) OR only stale ones —
  pick full-replace for V1 and document it.
- Return the new `scheduledThrough` high-water mark.
- Guard against duplicates when re-planning the same day (idempotent for the same `now`/inputs).

# Tests

- Mid-day plan: only future prayers today + all of tomorrow are in `create`; past prayers excluded.
- `reminderOffsetMin: 10` shifts every `create.time` 10 min earlier than the prayer instant.
- `reminderOffsetMin: 0` schedules exactly at prayer instants.
- Re-planning with the same `now` yields no duplicate future alarms (idempotent).
- Rollover: planning late on day N includes day N+1; `scheduledThrough` advances.
- `existingAlarmIds` are returned in `cancelIds` (replace semantics).
- Empty/!valid location → empty `create`, no throw (defined behavior).

# Acceptance Criteria

- Returns `{ cancelIds, create, scheduledThrough }`; `create.time` is future epoch-seconds, offset-applied.
- No past alarms; no duplicates; rollover covered within `windowDays`.
- Pure: no `@zos/*`, no side effects; runs under Vitest.

# Definition Of Done

- Validation on inputs (missing location handled).
- Pure `shared/` module, naming consistent, dependency injected (`computeTimes`).
- Edge cases: mid-day, rollover, offset, idempotency.
- Vitest tests pass. No debug leftovers.

# Notes For AI Coding

- Inject `computeTimes` rather than importing it, so the scheduler tests can stub deterministic times and
  stay fast/independent of the astronomy.
- Full-replace (cancel all, recreate the window) is the simple, correct V1 choice — don't build
  diff-based reconciliation.
