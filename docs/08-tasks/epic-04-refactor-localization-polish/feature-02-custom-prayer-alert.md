# Purpose

Replace the bare default system notification (currently `title` + `"Time for <prayer>"`) with a branded,
better-looking prayer alert that shows the **app logo** and the prayer name, so the alert is instantly
recognizable as a prayer reminder.

# User Value

A polished, on-brand reminder at prayer time instead of a generic OS notification — clearer and more
pleasant.

# Dependencies

- `app-service/reminder.js` (fires the alert today via `@zos/notification` `notify`).
- `lib/reminders.js` (scheduling — must keep working, including the daily rollover reschedule).
- `@zos/notification`, possibly `@zos/alarm` page-launch + a new alert page, `@zos/router`.
- App logo asset (`assets/<target>/image/`), and i18n for the alert text (feature-03).

# Target Files

- `app-service/reminder.js` (how the alert is presented).
- Possibly new: `page/<target>/alert/index.page.js` (custom full-screen alert with logo + prayer name + dismiss).
- Logo PNG bundled per target (size-matched to its IMG box; `image/`-prefixed `src`).

# Public Interface

- None exported. If a custom page is used, it's launched on alarm fire with the prayer name as a param.

# Related Shared Logic

- Prayer name/label + localized strings (via the i18n helper from feature-03). No math here.

# Build Order

Step 4 of the epic (after the refactor so the alert/logo asset path fits the shared structure).

# Tasks

- **Investigate feasibility first** (`notify()` exposes only `title`/`content`/`actions`/`vibrate` — no logo
  field; the system shows the app icon automatically):
  - Option A — **Custom alert page:** have the alarm launch the app to a dedicated full-screen page showing
    the logo, the prayer name (localized), the time, and a dismiss button + vibration. Most control over
    look; verify it reliably surfaces over a watchface on the real device.
  - Option B — **Polished notification:** keep `notify()` but improve the app icon (what the system shows),
    localized title/content, and a distinct `vibrate` pattern.
- Implement the chosen approach; **keep Option B as the graceful fallback** if the custom page can't
  reliably interrupt.
- Bundle the app logo as an `image/`-prefixed PNG sized to its IMG box (no `color` tint; pre-colored).
- Preserve all scheduling: the alert must not interfere with `lib/reminders.js` rollover/reschedule; the
  service still exits cleanly after presenting.
- Localize all alert text through i18n (works with feature-03).

# Tests

Manual, on-device:
- At a scheduled prayer time the branded alert appears (logo + correct, localized prayer name) and vibrates.
- Dismiss works; if a custom page, it closes cleanly and doesn't block the watch.
- Reminders still re-schedule for the next day (leave overnight / simulate rollover).
- Fallback path (if the custom page is unavailable) still produces a clear notification.

# Acceptance Criteria

- The prayer alert visibly includes the app logo and the prayer name, looking better than the default.
- Vibration fires; dismissal works; scheduling/rollover unaffected.
- Alert text is localized (English/Arabic) per feature-03.

# Definition Of Done

- Branded alert implemented with a working fallback; logo asset `image/`-prefixed and size-matched.
- No regression to alarm scheduling or the rollover reschedule; service exits cleanly.
- No `?.`; no debug leftovers; carry all Bip 6 UI rules.

# Notes For AI Coding

- Confirm on the real Bip 6 whether a launched page can interrupt at alarm time before committing to Option
  A; otherwise ship Option B polished.
- The logo is an `IMG` — remember: no `color` tint, widget `w`/`h` = PNG size, `image/`-prefixed `src`.
