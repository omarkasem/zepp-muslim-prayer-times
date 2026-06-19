# Epic 02 — Watch App — Overview

**Status:** not started.
**How to use:** in each AI-coder session, point at this file and say *"implement Step N"*. Do the steps
in order. Each feature step links to a `feature-*.md` (full spec) and a `*-design.md` (layout) — open both.
**Source of truth:** `epic-spec.md`. Do not expand scope beyond it. **Consume Epic 01 `shared/` as-is.**
**Rules:** no `@zos` in `shared/`; network only in `app-side`; no optional chaining (`?.`); `px()` +
`designWidth` for all coords; flattened colors (no opacity/shadow); bundled PNG icons (no Material Symbols).

---

## Step 1 — Scaffolding & icon assets  (checklist)
- [ ] Register the new Bip 6 pages in `app.json` under `bip6.module.page.pages`:
      `page/bip6/settings/index.page`, `page/bip6/settings-picker/index.page`, `page/bip6/qibla/index.page`
      (keep `page/bip6/home/index.page`). Leave `gt` as home-only (its parity is Epic 03).
- [ ] Confirm permissions in `app.json` cover what's needed; add a sensor/geolocation permission only if
      the Qibla compass requires one (decide at Step 5).
- [ ] Bundle PNG icons under `assets/bip6/image/`: `ic_pin`, `ic_compass`, `ic_gear` (home);
      `ic_back`, `ic_chevron`, `ic_radio_on`, `ic_radio_off` (settings);
      `ic_qibla_arrow`, `ic_kaaba`, `ic_watch` (qibla). Use the Noor accent colors from the design specs.
- [ ] Add a shared UI-constants module (e.g. `lib/theme.js`) with the Noor colors + font sizes used by all
      three design specs, so pages don't re-hardcode hexes.

## Step 2 — Home screen  →  `feature-01-home.md` + `../../05-ui-sketches/home-design.md`
- [ ] Fetch location via `request(GET_LOCATION)`, cache to `storage.location` (only if missing).
- [ ] Compute today's times via `computePrayerTimes`; render Variation A (list + next-prayer pill + countdown).
- [ ] Hijri date + city; minute-timer countdown; loading + location-unavailable states.
- [ ] Nav to Settings and Qibla; call `applyReminders()` on open (function lands in Step 3).

## Step 3 — Reminders  →  `feature-02-reminders.md`
- [ ] `lib/reminders.js` `applyReminders()`: storage → `planAlarms` → `@zos/alarm` cancel/set → persist ids + scheduledThrough; schedule a daily rollover alarm.
- [ ] `app-service/reminder.js`: prayer alarm → `notify()` + vibrate; rollover alarm → `applyReminders()`.
- [ ] Wire Home's on-open `applyReminders()` call from Step 2.

## Step 4 — Settings  →  `feature-03-settings.md` + `../../05-ui-sketches/settings-design.md`
- [ ] `page/bip6/settings`: method / madhab (inline toggle) / high-latitude / reminder-offset rows.
- [ ] `page/bip6/settings-picker`: one reusable picker (param `{ key }`) — scrollable radio list.
- [ ] On any change: `setSettings` → `applyReminders()` (reschedule); Home reflects new times on return.

## Step 5 — Qibla  →  `feature-04-qibla.md` + `../../05-ui-sketches/qibla-design.md`
- [ ] Calibrate state (figure-8 hint) until compass is usable (or timed fallback).
- [ ] Active compass: `@zos/sensor` heading → arrow rotated to `qiblaBearing − heading`; bearing/city readout.
- [ ] Aligned (±6°): arrow turns green + Kaaba icon (+ optional single vibrate); stop sensor on page exit.
- [ ] **Confirm the Bip 6 `@zos/sensor` compass API first** (open verification item).

---

## Quick References
- Epic spec: `epic-spec.md` · Roadmap: `../roadmap.md`
- Architecture: `../../06-architecture/architecture.md` · AI rules: `../../07-ai-coding/ai-context.md`
- Design specs: `../../05-ui-sketches/{home,settings,qibla}-design.md`
- Feature specs: `feature-01-home.md`, `feature-02-reminders.md`, `feature-03-settings.md`, `feature-04-qibla.md`
