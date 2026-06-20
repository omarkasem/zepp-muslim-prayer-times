# Purpose

Make the app fully Arabic when the user's watch/app language is Arabic: route every UI string through i18n,
add Arabic translations (labels, prayer names, Hijri months, settings options, alert text, app name), and
apply RTL-aware layout. Today **no page uses `getText`** — all strings are hardcoded English — so this is a
full localization pass.

# User Value

Arabic-speaking users get a native-language, right-to-left experience instead of English-only text.

# Dependencies

- `@zos/i18n` `getText`; `page/i18n/en-US.po` (currently only `appName`) + a new `page/i18n/ar-SA.po`.
- All four pages + the custom alert (feature-02) + `app-service/reminder.js`.
- `shared/hijri.js` month names (need Arabic equivalents) — provide Arabic names in the UI layer, not by
  changing `shared/`.
- Best done after feature-01 so strings are localized once in shared controllers/views.

# Target Files

- `page/i18n/en-US.po` (add all keys) and `page/i18n/ar-SA.po` (Arabic translations).
- All views + controllers that surface text; a new `lib/i18n.js` helper (wrap `getText`, expose `isRTL`,
  localized prayer names + Hijri month names).
- `app.json` i18n (`ar-SA.appName` = "مواقيت صلاة المسلم") — coordinate with Step 1.

# Public Interface

- `lib/i18n.js`: e.g. `t(key)`, `isRTL()`, `prayerName(key)`, `hijriMonth(index)` — used by all views.

# Related Shared Logic

- Uses `shared/` outputs (prayer keys, hijri month index) but maps them to localized display strings in the
  UI layer. Do not put translations in `shared/`.

# Build Order

Step 5 of the epic (last, so it covers the refactored shared code + the new alert).

# Tasks

- Inventory every user-facing string: prayer names (Fajr/Dhuhr/Asr/Maghrib/Isha/Jumu'ah), "Next/in",
  "Tomorrow", city/hijri formatting, Settings labels + option labels (method short names, madhab, high-lat,
  reminder offsets, time format), Qibla ("Calibrating…", figure-8 hint, "MECCA", cardinals N/E/S/W),
  loading/unavailable messages, alert title/content.
- Add a key for each in `en-US.po`; add Arabic translations in `ar-SA.po`. Replace hardcoded strings with
  `t(key)` via `lib/i18n.js`. `getText` must fall back safely (key/English) on a missing translation.
- **RTL:** when `isRTL()`, right-align text and mirror left/right-anchored elements (back arrow position,
  settings row value/chevron side, home row label/time sides, nav button layout). Bake the flag into the
  shared view helpers so each screen handles it consistently.
- Localize prayer names and **Hijri month names** in Arabic; decide on Arabic vs Western digits for
  times/dates (pick one; keep consistent).
- Localize the prayer **alert** text (feature-02).
- Set the Arabic app name in `app.json` i18n + `ar-SA.po`.

# Tests

Manual, on-device, in both languages:
- Set the watch/app language to Arabic → every screen (home, settings, picker, qibla, alert) shows Arabic,
  right-aligned/mirrored; prayer names + Hijri month in Arabic.
- Switch back to English → English returns, left-aligned; nothing blank or clipped.
- A deliberately missing key falls back gracefully (no blank screen).
- Long Arabic strings don't overflow/marquee (check the settings cards + nav buttons).

# Acceptance Criteria

- No hardcoded user-facing English remains in pages; all text via i18n.
- Arabic locale renders fully translated + RTL across all screens and the alert.
- App name shows as "مواقيت صلاة المسلم" in Arabic, "Muslim Prayer Times" in English.
- Safe fallback on missing keys.

# Definition Of Done

- `en-US.po` + `ar-SA.po` complete; `lib/i18n.js` is the single text/RTL helper used by views.
- RTL layout verified; no overflow/marquee in Arabic; no `?.`; no debug leftovers.
- `shared/` unchanged (translations live in the UI layer).

# Notes For AI Coding

- Localize once in the shared controllers/views (feature-01), not per device.
- Don't translate inside `shared/`; map keys/indices to localized strings in `lib/i18n.js`.
- Watch RTL mirroring on the screens with strong left/right anchoring (settings rows, home list, qibla back arrow).
