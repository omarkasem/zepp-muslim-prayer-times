# System Overview

A single Zepp OS v3 watch app. No backend, no accounts. Prayer times are computed **offline on the
watch** from cached coordinates. The only network call is a city-level **IP geolocation** lookup that
runs on the phone companion. The app is structured around Zepp's three runtime contexts:

- **`page`** (on-watch UI) — renders screens, reads/writes local storage, computes prayer times,
  schedules reminder alarms, draws qibla. Uses `@zos/*` APIs. No network access.
- **`app-side`** (phone companion / side service) — the *only* context with network. Performs the IP
  geolocation lookup on request and returns lat/lon/city/timezone to the watch.
- **`app-service`** (background) — woken by a scheduled alarm. Two jobs: (a) post a prayer
  notification + vibrate, (b) on daily rollover, recompute and reschedule the next window of alarms
  from cached location (offline, no network).

# Architecture Goals

- **Offline-first** — after the first location fetch, everything works with no phone.
- **Accurate by construction** — correct method + madhab + high-latitude rule + the location's
  timezone feed pure, testable math.
- **Reliable reminders** — alarms reschedule across day boundaries even if the user never opens the app.
- **Thin contexts** — `app-side` only does location; `app-service` stays dumb except for rollover;
  all real logic is pure modules shared by `page` and `app-service`.
- **Per-target layouts without logic duplication** — visual code per device, shared logic in `shared/`.

# Technical Stack

- **Platform:** Zepp OS v3 (`configVersion v3`, apiVersion target 3.0.0).
- **Language:** JavaScript (ES modules, restricted Zepp JS runtime — `Date`/`Math`, no DOM/Node).
- **UI:** `@zos/ui` (`hmUI.createWidget`) via `@zeppos/zml` `BasePage`. No React.
- **Cross-context messaging:** `@zeppos/zml` `BasePage.request()` ↔ `BaseSideService.onRequest()`.
- **State:** local component state (`zml` `state`) + persisted settings/location in storage. No store lib.
- **Storage:** `@zos/storage` / local storage (permission `device:os.local_storage` already declared).
- **Alarms:** `@zos/alarm` (`set` / `cancel`, `store: true`).
- **Notifications:** `@zos/notification` (`notify`, vibrate).
- **Sensors:** `@zos/sensor` compass/geomagnetic for qibla (confirm exact interface on Bip 6).
- **Network (app-side only):** `fetch` to IP geolocation providers (ipwho.is → ipapi.co fallback).
- **Build & release:** Zepp CLI / Zeus → simulator + on-device, then Zepp store submission.
- **Testing:** Node-level unit tests (Vitest) for the pure `shared/` calc modules; manual on-device for
  UI, alarms, and qibla. (See Testing Strategy below.)

# Watch-Specific Concerns

- **Store policy:** Zepp store review; free app; keep permissions minimal and justified.
- **Permissions:** currently `data:os.device.info`, `device:os.local_storage`, `device:os.notification`,
  `device:os.alarm`. Add a geolocation/sensor permission only if qibla's compass requires it.
- **Offline behavior:** home screen and reminders must work from cached location with no phone.
- **No long-running background:** background work happens only when an alarm wakes `app-service`;
  it must do its job and exit. No timers/polling.
- **Per-device layout:** Bip 6 = 390px round (`designWidth: 390`); `gt` family = `designWidth: 480`,
  `r` (round) / `s` (square). Separate `page/<target>/...` layout files.
- **Battery:** computation is cheap; the only cost is alarms + occasional service wake. Keep the
  rescheduled window small (e.g. 2–3 days ahead), not weeks of alarms.
- **Device testing:** primary on the user's Amazfit Bip 6; simulator for the `gt` layouts.

# Folder Structure

```
app.js
app.json
shared/                     # pure logic, no @zos/* — imported by page AND app-service, unit-testable
  prayer-times.js           # compute 5 times from {lat, lon, timezone, date, method, madhab, highLat}
  methods.js                # calculation-method presets (Umm al-Qura, MWL, Egyptian, ISNA, …)
  qibla.js                  # bearing to Mecca from {lat, lon}
  hijri.js                  # gregorian → hijri date
  scheduler.js              # given times + offset → alarm set/cancel plan (logic only)
  storage.js                # typed get/set for cached location + settings keys
page/
  bip6/
    home/index.page.js      # times + next-prayer + countdown + hijri + nav to settings/qibla
    settings/index.page.js  # method, madhab, high-latitude rule, reminder offset
    qibla/index.page.js     # compass arrow
  gt/
    home/index.page.js
    settings/index.page.js
    qibla/index.page.js
  i18n/en-US.po
app-side/
  index.js                  # IP geolocation lookup (network) — returns lat/lon/city/timezone
app-service/
  reminder.js               # alarm wake → notify + vibrate; on rollover alarm → reschedule via shared/
assets/<target>/...
```

# Core Modules

- **`shared/prayer-times.js`** — the heart. Pure function: inputs `{lat, lon, timezone, date, method,
  madhab, highLatRule}` → `{ fajr, dhuhr, asr, maghrib, isha }` as local-time values. Port/adapt an
  established algorithm (adhan-style). Must use the **location's timezone**, not watch-local time.
- **`shared/methods.js`** — method presets (Fajr/Isha angles, etc.). Default chosen sensibly per region.
- **`shared/qibla.js`** — great-circle bearing to Mecca (21.4225, 39.8262).
- **`shared/hijri.js`** — gregorian→hijri conversion.
- **`shared/scheduler.js`** — given today's times + offset + appId, produce the set/cancel calls
  (`@zos/alarm`) for the reminder window. Keeps alarm planning testable and out of the page.
- **`shared/storage.js`** — single source of truth for persisted keys (see Storage below).

# Services

- **`app-side/index.js`** — `onRequest`: `GET_LOCATION` → IP lookup (ipwho.is, fallback ipapi.co),
  returns `{lat, lon, city, country, timezone}`. (Already implemented in the spike.)
- **`app-service/reminder.js`** — woken by alarm:
  - **Prayer alarm:** read the prayer name from the alarm `param`, `notify()` + vibrate, exit.
  - **Rollover alarm:** read cached location + settings, recompute the next window via `shared/`,
    cancel stale alarms, schedule the next day(s), exit.

# Local Data / Storage Structure

Persisted on the watch (key/value):

- `location` → `{ lat, lon, city, country, timezone, fetchedAt }`
- `settings` → `{ method, madhab, highLatRule, reminderOffsetMin }`
- `alarmIds` → `[ … ]` (currently scheduled alarm ids, so they can be cancelled/replaced)
- `scheduledThrough` → date string of the last day reminders are scheduled for (rollover guard)

Defaults applied on first run; `location` populated after the first `GET_LOCATION`.

# Remote Data / API Structure

- **Only** the IP geolocation HTTP GET in `app-side` (no auth, no keys, HTTPS):
  - `https://ipwho.is/` → `{ latitude, longitude, city, country, timezone.id }`
  - fallback `https://ipapi.co/json/` → `{ latitude, longitude, city, country_name, timezone }`
- No app backend. No user data leaves the device beyond the implicit IP of the lookup request.

# Data Flow

1. **Location:** `page` → `request(GET_LOCATION)` → `app-side` IP lookup → `{lat,lon,city,timezone}`
   → cached in `storage.location`.
2. **Compute:** `page` calls `shared/prayer-times.js` with cached location + settings + today →
   renders times, next prayer, countdown, hijri.
3. **Schedule:** `page` (and the rollover `app-service`) call `shared/scheduler.js` → `@zos/alarm.set`
   one alarm per prayer at `time − offset`, plus one rollover alarm; ids saved in `storage.alarmIds`.
4. **Fire:** alarm wakes `app-service/reminder.js` → notify + vibrate (or reschedule on rollover).
5. **Settings change:** `page` writes `storage.settings` → recompute → cancel old alarms → reschedule.

# Caching Strategy

- Location cached indefinitely until refreshed (manual refresh is a fast-follow; no auto-expiry in V1).
- Prayer times are cheap to recompute — computed on demand, not cached.
- Alarms are the durable artifact; `alarmIds` + `scheduledThrough` prevent duplicate/stale alarms.

# Security Considerations

- No accounts, tokens, or secrets. Nothing sensitive to store.
- Only outbound data is the IP-geolocation request (city-level, no PII sent).
- Keep permissions minimal; do not request location/sensor scopes the app doesn't use.

# Testing Strategy

- **Unit (Vitest, plain Node):** `shared/prayer-times.js`, `methods.js`, `qibla.js`, `hijri.js`,
  `scheduler.js` are pure and testable off-device. This is the highest-value test surface — verify
  computed times against known references for several locations/methods/dates, including a
  high-latitude case and a timezone that differs from the test machine.
- **Manual on-device (Bip 6):** UI rendering per layout, alarms firing on the correct day, multi-day
  rollover, qibla compass, offline (airplane-mode) behavior.
- **Simulator:** `gt` `r`/`s` layouts.
- Per the preamble: every feature touching `shared/` ships with matching Vitest tests; UI-only and
  alarm-timing behavior is verified manually (no on-device test harness for that).

# Extensibility Boundaries

- New calculation methods = add a preset in `methods.js`; no other change.
- Manual location override (future) = write `storage.location` from a settings input; compute path unchanged.
- Per-prayer offsets (future) = extend `settings` + `scheduler.js`; storage shape is forward-compatible.

# Future Scalability Notes

- This is a single-user local utility; there is nothing to "scale." Growth = more devices/layouts and
  more languages, both additive.

# Things We Intentionally Keep Simple

- No backend, no accounts, no sync.
- No state-management library — local state + a thin storage module.
- No athan audio.
- No auto-expiring caches or background polling — alarms only.
- Recompute times on demand instead of caching them.
