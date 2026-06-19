# Purpose

The reminder system: turn computed prayer times into real `@zos/alarm` alarms, fire a notification +
vibration at each prayer, and keep reminders scheduled across days via a self-rescheduling daily rollover
alarm — all from cached location, offline.

# User Value

A reliable wrist buzz at every prayer, every day, even if the user never opens the app.

# Dependencies

- Epic 01: `shared/scheduler.js` (`planAlarms`), `shared/storage.js`, `shared/prayer-times.js`.
- `@zos/alarm`, `@zos/notification`, `@zos/app` (appId).
- Consumed by: Home (on open, Step 2), Settings (on change, Step 4), and `app-service` (rollover).

# Target Files

- `lib/reminders.js` (new — the only `@zos/alarm` caller)
- `app-service/reminder.js` (replace the spike single-notification handler)

# Public Interface

```js
// lib/reminders.js — uses @zos (NOT pure; lives in lib/, not shared/)
export function applyReminders(now = Date.now()) {
  // 1. read getLocation(), getSettings(), getAlarmIds(), getScheduledThrough()
  // 2. plan = planAlarms({ now, location, settings, existingAlarmIds, scheduledThrough, computeTimes: computePrayerTimes })
  // 3. cancel each plan.cancelIds via @zos/alarm.cancel
  // 4. create each plan.create via @zos/alarm.set (url: 'app-service/reminder', param: prayer name, store: true)
  // 5. ensure ONE daily rollover alarm exists (param: 'rollover') near next local midnight
  // 6. setAlarmIds(newIds); setScheduledThrough(plan.scheduledThrough)
}
```

- `app-service/reminder.js` (`AppService.onInit(params)`): if `params` is a prayer name → `notify` + vibrate;
  if `params === 'rollover'` → `applyReminders()` then exit.

# Related Services

- `app-side` not involved (no network). The rollover path is fully offline.

# Related Shared Logic

- `planAlarms` (injected `computePrayerTimes`), storage getters/setters.

# Build Order

Step 3 of the epic (after Home renders; wires Home's on-open call).

# Tasks

- Implement `applyReminders()` per the interface; store the prayer name in the alarm `param` so the service knows which prayer.
- Keep the rollover alarm distinct (e.g. `param: 'rollover'`) and ensure exactly one exists after each apply.
- Track ALL created alarm ids (prayer + rollover) in `storage.alarmIds`; cancel them before re-creating (full replace).
- Update `app-service/reminder.js` to branch on `params`: prayer → notify+vibrate; `rollover` → `applyReminders()`.
- Wire the Home page (Step 2) to call `applyReminders()` on open after times are computed.
- No `?.`; guard missing location (planAlarms already returns empty create — apply still cancels nothing per Fix 2).

# Tests

No on-device harness — verify MANUALLY on the Bip 6 (scheduler math already unit-tested in Epic 01):
- Open app → 5 alarms scheduled for today's remaining prayers + the window; verify a prayer alarm fires (notification + vibration), service exits.
- `reminderOffsetMin = 10` → alarm fires ~10 min before the prayer; `0` → at the time.
- Leave overnight → next day's reminders fire (rollover rescheduled without opening the app).
- Re-open mid-day → no duplicate alarms (full-replace + persisted ids).
- Change settings (Step 4) → alarms reschedule.

# Acceptance Criteria

- `lib/reminders.js` is the single `@zos/alarm` touchpoint; ids + scheduledThrough persisted.
- Prayer alarms notify+vibrate; rollover alarm reschedules the window offline.
- No duplicate/stale alarms after repeated applies; survives day rollover.

# Definition Of Done

- Follows architecture; no `@zos` in `shared/`; no `?.`.
- Stale alarms cancelled before reschedule; rollover alarm singular.
- Multi-day behavior verified on-device; no debug leftovers (no test alarms).

# Notes For AI Coding

- Don't scatter `@zos/alarm` calls into pages/services — everything goes through `applyReminders()`.
- The rollover alarm is what makes reminders work without opening the app — don't skip it.
