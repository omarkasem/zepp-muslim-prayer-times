# Architecture Philosophy

A free, offline-first Zepp OS v3 watch app for Muslim prayer times. All real logic lives in pure,
testable modules under `shared/`; the three Zepp runtime contexts (`page`, `app-side`, `app-service`)
stay thin. Accuracy and reliable reminders are the whole product — not features.

# Complexity Rules

- Keep `app-side` to location lookup only; keep `app-service` to "notify + vibrate" plus daily rollover.
- Put anything with logic (times, qibla, hijri, alarm planning) in `shared/` as pure functions.
- Don't abstract until there are two real callers. No managers/factories/DI.
- Recompute prayer times on demand; don't build a caching layer for cheap math.

# Stack

- Zepp OS v3, plain JavaScript ES modules. **No React, no Node, no DOM.** Only `Date`/`Math` + `@zos/*`.
- UI: `@zos/ui` (`hmUI.createWidget`) through `@zeppos/zml` `BasePage`.
- Messaging: `zml` `BasePage.request()` ↔ `BaseSideService.onRequest()`.
- Storage: `@zos/storage` / local storage. Alarms: `@zos/alarm`. Notifications: `@zos/notification`.
- Sensor (qibla): `@zos/sensor` compass/geomagnetic. Network: `fetch` — **app-side only**.
- Tests: Vitest (plain Node) for `shared/` modules only.

# Naming Conventions

- `shared/` modules: lowercase file names, named exports (`computePrayerTimes`, `qiblaBearing`,
  `toHijri`, `planAlarms`, `getLocation/setLocation`, `getSettings/setSettings`).
- Pages: `page/<target>/<screen>/index.page.js` (`bip6` | `gt`; screens `home` | `settings` | `qibla`).
- Storage keys (exact): `location`, `settings`, `alarmIds`, `scheduledThrough`.
- Messaging methods: SCREAMING_SNAKE (`GET_LOCATION`).
- Settings fields: `method`, `madhab`, `highLatRule`, `reminderOffsetMin`.

# Folder Structure Conventions

- Logic → `shared/` (imported by `page` and `app-service`; **never** import `@zos/*` here so it stays
  unit-testable in Node).
- `app-side/index.js` = network/location only. `app-service/reminder.js` = alarm wake handler.
- Per-target layouts live under `page/bip6/...` and `page/gt/...`; **logic is shared, not copy-pasted**.
- Use `px()` and the target's `designWidth` for all coordinates/sizes (Bip 6 = 390, `gt` = 480).

# AI Coding Rules

- Follow `06-architecture/architecture.md` exactly; don't invent structure or extra contexts.
- No duplicated logic between `bip6` and `gt` pages — extract shared logic to `shared/`.
- Don't add network calls outside `app-side`. `page`/`app-service` have no network.
- Don't add long-running timers or polling; background work is alarm-driven only.
- Keep tasks isolated; preserve the naming and storage keys above.
- Every change to a `shared/` module ships with matching Vitest tests.

# Common Mistakes To Avoid In This Project

- **Using web/Node APIs that don't exist** (no `window`, `document`, `localStorage` global, `setInterval`
  for background, `axios`, `fs`). Use `@zos/*` and `zml`.
- **Calling `fetch` from `page` or `app-service`.** Only `app-side` has network — go through `request()`.
- **Timezone bugs.** Compute prayer times in the **location's** timezone (from the IP lookup), not the
  watch's local time. This is the #1 cause of "inaccurate" prayer apps.
- **Hardcoding pixel coordinates** instead of `px()` + `designWidth`; breaks across Bip 6 vs `gt`.
- **Forgetting day rollover.** Reminders must reschedule for future days via the rollover alarm, not
  only when the app is opened.
- **Leaving stale alarms.** Always cancel `alarmIds` before rescheduling; persist new ids.
- **Putting `@zos/*` imports in `shared/`** — it breaks Node unit tests and the offline-logic boundary.
- **Assuming `res.body` shape.** IP providers return body as string OR object — parse defensively
  (see existing `app-side/index.js`).
- **Blocking the UI on the phone.** Render from cached location; only fetch when missing or refreshing.

# Definition Of Done

- Input validation on external data (location payloads, stored settings) before use.
- No debug leftovers (stray `logger`/console spam, test alarms, hardcoded coordinates).
- Architecture + naming + storage keys respected.
- Edge cases handled: missing/failed location, day rollover, missing compass, high latitude.
- `shared/` changes have passing Vitest tests; UI/alarm behavior manually verified on Bip 6.
- No runtime warnings/errors in the simulator or on-device logs.

# Review Checklist

- Is the logic in `shared/` (testable) rather than in a page/service?
- Any duplication between `bip6` and `gt`? Any `@zos/*` leaking into `shared/`?
- Timezone correct? Alarms cancelled before reschedule? Offline path intact?
- Simplest version that works — no speculative abstraction?
