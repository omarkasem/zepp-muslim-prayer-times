# Purpose

Port the shipped Bip 6 Settings list + reusable picker to the `gt` target (round `r` + square `s`,
`designWidth: 480`). Same controls and persistence; **layout only**. The main page is a scrollable list of
stacked cards + two inline toggle cards (Asr Madhab, Time Format); multi-option settings open one reusable
picker page.

# User Value

Tune calculation method, Asr madhab, high-latitude rule, reminder offset, and time format on gt watches —
every change persists and reschedules reminders.

# Dependencies

- Reference impl (copy these): `page/bip6/settings/index.page.js`, `page/bip6/settings-picker/index.page.js`.
- Epic 01: `shared/storage.js`, `shared/methods.js`. `lib/reminders.js` (`applyReminders()` on change).
- Layout: `../../05-ui-sketches/settings-design.md`. Theme: `lib/theme.js`.

# Target Files

- `page/gt/settings/index.page.js`, `page/gt/settings-picker/index.page.js` (new).
- `assets/gt.r/image/` + `assets/gt.s/image/`: `ic_back.png`, `ic_chevron.png`, `ic_radio_on.png`,
  `ic_radio_off.png`, `ic_transparent.png` (from Step 1).

# Public Interface

- None exported (pages). Picker takes params `{ key }` (`method` | `highLatRule` | `reminderOffset`).

# Related Services

- `setSettings(...)` then `applyReminders()` on every change (reschedule).

# Related Shared Logic

- `getSettings/setSettings`, `METHODS`. Use the short method labels already defined on the Bip 6 page
  (`METHOD_SHORT_LABELS`) — the canonical names are too long for a row.

# Build Order

Step 3 of the epic.

# Tasks

- Port the stacked nav-row card (muted label on top, accent value below, chevron right) and the generic
  `renderToggleCard` used for **Asr Madhab** (Standard/Hanafi) and **Time Format** (12h/24h).
- Port the reusable picker (scrollable radio list, current value preselected, tap → persist → back),
  including short method labels.
- Re-tune sizes/heights for 480; ensure `setScrollMode(SCROLL_MODE_FREE)` and that scrolling reaches the
  last row on both shapes. Round (`gt.r`): keep cards within the safe area.
- On any change: `setSettings` → `applyReminders()`; returning to Home reflects new times.

# Tests

Manual, gt device/simulator (both shapes):
- Each setting opens its control; selection persists and is reflected on return; reminders reschedule.
- Time Format / Asr Madhab toggles flip with one tap; Home times re-render in the chosen format.
- Long values never marquee/overlap (stacked layout); scrolling reaches every row.
- Round shape: no card clipped at the edge.

# Acceptance Criteria

- All settings editable (method, madhab, high-latitude, reminder offset, time format); each persists +
  reschedules.
- Matches `settings-design.md` adapted to 480 round + square; text fits without marquee.

# Definition Of Done

- Logic copied from Bip 6; `px()` + `designWidth: 480`; no `?.`; flattened colors.
- Images use `image/`-prefixed `src`; IMG sizes match PNGs; no IMG `color` tint.
- No debug leftovers; `page/bip6/*` untouched.

# Notes For AI Coding

- Re-layout of working pages — diff against the Bip 6 settings + picker; change only geometry.
- Keep the two toggle cards generic (`renderToggleCard`); don't fork them per setting.
