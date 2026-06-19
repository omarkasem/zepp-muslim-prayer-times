# Epic Purpose

Build the actual on-device watch app on top of Epic 01's pure engine: the Home screen, the reminder
system (alarms + notifications + daily rollover), the Settings screen, and the Qibla compass. This epic
turns the tested `shared/` logic into a usable Bip 6 app, following the three `*-design.md` UI specs.

# Included Features

- **Home screen** — location fetch+cache, compute today's times, render Variation A (next-prayer
  highlight + live countdown + hijri + city), nav to Settings/Qibla. **(complex → `feature-01-home.md`)**
- **Reminders** — `lib/reminders.js` glue (planAlarms + `@zos/alarm` + storage) and `app-service/reminder.js`
  (notify+vibrate on a prayer alarm; recompute+reschedule on a daily rollover alarm). **(complex → `feature-02-reminders.md`)**
- **Settings screen** — main list + reusable picker page; each change persists and reschedules. **(complex → `feature-03-settings.md`)**
- **Qibla screen** — compass sensor → live rotating arrow; Kaaba aligned state; calibrate state. **(complex → `feature-04-qibla.md`)**
- **Scaffolding & assets** — register pages in `app.json`, bundle PNG icons. **(simple → overview checklist)**

# Excluded Features

- `gt` (480px) layouts and store assets/icon → Epic 03.
- Manual location override, GPS, athan audio, per-prayer config, watch tiles → future.
- Any change to `shared/` logic (it's done; only consume it). If a gap is found, raise it — don't silently extend.

# Feature Boundaries

**Home (feature-01)** — purpose: glanceable main screen. Complexity: High. Deps: Epic 01 (`storage`,
`prayer-times`, `hijri`), `app-side` GET_LOCATION, `lib/reminders` (calls it on open). Arch notes: page
context; network only via `request()`; layout per `home-design.md`.

**Reminders (feature-02)** — purpose: reliable alarms surviving rollover. Complexity: High. Deps: Epic 01
(`scheduler`, `storage`), `@zos/alarm`, `@zos/notification`. Arch notes: `lib/reminders.js` is the
`@zos`-touching glue shared by page + `app-service`; `app-service` stays thin.

**Settings (feature-03)** — purpose: tune method/madhab/highLat/offset. Complexity: Medium-High. Deps:
Epic 01 (`storage`, `methods`), `lib/reminders` (reschedule on change). Arch notes: main page + ONE
reusable picker page; layout per `settings-design.md`.

**Qibla (feature-04)** — purpose: point to Mecca. Complexity: High (sensor). Deps: Epic 01 (`qibla`),
`@zos/sensor`. Arch notes: live heading → arrow rotation; layout per `qibla-design.md`.

# Shared Services

- **`lib/reminders.js`** (new) — `applyReminders()`: read location+settings+alarmIds+scheduledThrough from
  storage, call `planAlarms`, cancel `cancelIds` + set `create` via `@zos/alarm`, persist new ids +
  scheduledThrough. The single place that touches `@zos/alarm`. Imported by Home (on open), Settings (on
  change), and `app-service` (rollover). NOT pure (uses `@zos`) — so it lives in `lib/`, not `shared/`.
- **`app-side/index.js`** — existing `GET_LOCATION` (Epic 01). Consumed by Home.

# Shared Validation Logic

- All inputs already validated in `shared/` (storage setters, computePrayerTimes, planAlarms). UI reads
  through `getSettings()`/`getLocation()` which return safe defaults/null — handle the null-location case.

# Shared UI Patterns

- Round safe-area discipline (content within the 342px circle), `px()` + `designWidth`, flattened colors
  (no opacity/shadow), bundled PNG icons (no Material Symbols). All three design specs follow the same Noor
  tokens — define the color/typography constants once and reuse.

# Dependencies

- Epic 01 (complete). The three `05-ui-sketches/*-design.md` specs. `@zos/{ui,router,alarm,notification,sensor,app}`.

# Risks & Complexity Concerns

- **`@zos/sensor` compass API on Bip 6** — heading stream + whether it exposes calibration/accuracy
  status. Drives the Qibla calibrate-state exit; timed fallback if absent. **(carried open item — verify on-device.)**
- **Alarm rollover reliability** — the self-rescheduling rollover alarm must reliably fire and reschedule;
  needs real multi-day on-device testing.
- **Image rotation for the qibla arrow** — confirm `IMG` `angle`/`center_x/y` works on this firmware;
  fallback (pre-rendered frames) if not.
- **Round-screen clipping** — verify every screen on the real Bip 6, especially the scrolling Settings list.
- **No `@zos` in `shared/`; no network outside `app-side`; no `?.`** — keep the Epic 01 discipline.

# Recommended Simplifications

- One reusable Settings picker page (not three).
- Home recomputes times on open (cheap) rather than caching them.
- Ship the Home progress-ring static or omit if time-constrained (it's marked optional in the design spec).
- Qibla dial can be static (de-emphasized) — the rotating arrow is the focal point.

# Integration Test Scenarios

Manual, on the Bip 6 (no on-device test harness; `shared/` unit tests already cover the math):
- First run: open app → location resolves → times render → today's reminders scheduled.
- Reminder fires at `prayer − offset`: notification + vibration; service exits.
- Multi-day: leave the watch overnight → next day's reminders fire (rollover alarm rescheduled).
- Change method/offset in Settings → Home reflects new times → reminders reschedule.
- Qibla: calibrate → compass → arrow rotates to Mecca → Kaaba icon on alignment.
- Airplane mode (cached location): Home still renders; reminders still scheduled.

# AI Coding Concerns

- Consume `shared/` as-is; don't reimplement math in the UI.
- `lib/reminders.js` is the only `@zos/alarm` caller — don't scatter alarm calls across pages.
- Follow each `*-design.md` for layout; don't invent UI not in the specs.
- Keep `page/bip6/...` only this epic; `gt` is Epic 03.
