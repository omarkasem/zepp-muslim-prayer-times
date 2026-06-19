# Product Summary

A free Zepp OS watch app that shows today's five Muslim prayer times for the user's location,
computes them **offline on the watch**, surfaces the next prayer with a live countdown, and fires
wrist reminders at a user-chosen offset before each prayer. Also provides qibla direction and the
hijri date. First target: Amazfit Bip 6; also the `gt` family.

# References

- Problem, users, scope, risks: see `01-idea/idea.md`
- Calculation / location / storage design: see `06-architecture/architecture.md`
- Screen designs: see `05-ui-sketches/`

# MVP Goal

Ship a Zepp store app that shows accurate prayer times offline and reliably reminds the user at
each prayer — beating the two incumbents on the only thing that matters: correctness and reliability.

# Core Features

- **Prayer times (today)** — Fajr, Dhuhr, Asr, Maghrib, Isha, computed on-device from cached
  coordinates + date + selected method.
- **Next prayer + countdown** — the current "next" prayer highlighted with a live time-remaining display.
- **Reminders** — one alarm per prayer per day, auto-rescheduled daily, firing at `prayer time − offset`
  (offset is a user setting; `0` = exactly on time). Notification + vibration.
- **Settings** — calculation method, Asr madhab (Shafi/Hanafi), high-latitude rule, reminder offset.
- **Qibla** — compass arrow pointing toward Mecca from the user's coordinates.
- **Hijri date** — shown on the home screen.
- **Location** — IP-based lookup via the phone companion (lat/lon/city/timezone), cached on the watch
  so prayer times work offline afterward.

# User Flows

**First run**
1. App opens → home screen shows "Getting location…".
2. Watch asks phone companion (`GET_LOCATION`) → IP lookup returns lat/lon/city/timezone.
3. Location cached locally; prayer times computed on-device; home screen renders times + next prayer.
4. Reminders for today are scheduled automatically.

**Daily (returning)**
1. App (or background service) computes today's times from cached location.
2. Today's reminders are (re)scheduled. On day rollover, the next day's set is scheduled.
3. Home screen shows today's times, the next prayer, and countdown.

**Reminder fires**
1. Alarm wakes `app-service` at `prayer − offset`.
2. Service posts a notification with the prayer name + vibrates. Service exits.

**Change a setting**
1. Home → Settings → pick method / madhab / high-latitude rule / reminder offset.
2. On save, times recompute and reminders reschedule.

**Qibla**
1. Home → Qibla → compass arrow rotates to the Mecca bearing computed from cached coordinates.

# UX Principles

- **Glance-first.** The home screen answers "what's next and when" in under a second.
- **Zero-config default.** Works on first open with sensible method defaults; settings are optional.
- **Offline-trustworthy.** Never blocks on the phone after the first location fetch.
- **Round-display aware.** Layouts respect the 390px round Bip 6 and per-target `gt` screens.
- **Minimal taps.** Home → at most one level to Settings or Qibla. No deep navigation.

# Technical Constraints

- Zepp OS v3 runtime: restricted JS (no DOM/Node; `Date`/`Math` only). Calculation library must port.
- Network only exists in `app-side` (phone companion), not in `page` or `app-service`.
- Background work only via scheduled `@zos/alarm` waking `app-service`; no long-running timers.
- Per-target layouts (`page/bip6/...`, `page/gt/...`) with distinct `designWidth`.
- Permissions already declared: device info, local storage, notification, alarm. Add geolocation/sensor
  permissions only if needed (qibla compass).

# Success Metrics

- Computed times match a trusted reference (e.g. local mosque / Aladhan) within ±1 min for the test location.
- All five reminders fire on the correct day across a multi-day on-watch test, surviving day rollover.
- App renders home screen offline (airplane mode) using cached location.
- Positive/neutral store reviews vs the incumbents' "doesn't work" / "inaccurate" complaints.

# Out of Scope (Not V1)

- Athan (adhan) audio — dropped permanently; vibration + notification only.
- Per-prayer reminder toggles or per-prayer manual ± adjustments.
- Manual city / coordinate override.
- GPS-based location.
- Glanceable watch tile / secondary widget.
- Multiple languages beyond `en-US`.

# Future Features

- Per-prayer reminder toggle + per-prayer ± minute adjustment.
- Manual location override (for wrong IP location).
- GPS location; optional API cross-check.
- Watch tile / complication for next prayer.
- Arabic and other languages.

# Risks & Challenges

- **Timezone correctness** — the offline math must use the location's timezone (from the IP lookup),
  not assume watch-local time. Wrong timezone is the classic "inaccurate" bug.
- **Library port** — verify the chosen calculation library runs in Zepp's JS engine.
- **Alarm rescheduling** — must reliably reschedule across day boundaries; needs real multi-day testing.
- **Qibla compass API** — confirm the Bip 6 `@zos/sensor` compass interface and calibration UX.
- **Layout drift** — keeping Bip 6 and `gt` layouts in sync as the UI evolves.
