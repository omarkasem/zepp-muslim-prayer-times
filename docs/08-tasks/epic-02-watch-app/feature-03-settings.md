# Purpose

The Settings screen: a scrollable list to set calculation method, Asr madhab, high-latitude rule, and
reminder offset, plus one reusable picker page. Every change persists and reschedules reminders.

# User Value

Lets the user tune accuracy (the main accuracy lever is the method) and reminder timing.

# Dependencies

- Epic 01: `shared/storage.js` (`getSettings/setSettings`), `shared/methods.js`.
- `lib/reminders.js` `applyReminders()` (reschedule on change).
- Layout: `../../05-ui-sketches/settings-design.md` (authoritative). Note the **per-row-picker** pattern (not the inline accordion).

# Target Files

- `page/bip6/settings/index.page.js` (new — main list)
- `page/bip6/settings-picker/index.page.js` (new — one reusable picker, param `{ key }`)
- icon assets: `assets/bip6/image/ic_back.png`, `ic_chevron.png`, `ic_radio_on.png`, `ic_radio_off.png`

# Public Interface

- Pages only. Picker receives `router.push(... params: { key })` where `key ∈ {'method','highLatRule','reminderOffset','timeFormat'}`.
- Canonical values (must match Epic 01 storage): method ids from `methods.js`; madhab `standard|hanafi`;
  highLatRule `none|middle_of_night|one_seventh|angle_based`; reminderOffsetMin `0|5|10|15|20`;
  timeFormat `12h|24h` (default `12h`, added in the Steps 1–3 review fixes).

# Related Services

- `applyReminders()` after each change.

# Related Shared Logic

- `getSettings/setSettings`, `METHODS`/`getMethod` for labels.

# Build Order

Step 4 of the epic (needs `lib/reminders.js` from Step 3 and Home nav from Step 2).

# Tasks

- Main page: rows for Calculation Method, High Latitude Rule, Reminder Offset, Time Format (each shows current value + chevron, opens the picker); inline segmented toggle for Asr Madhab; scrollable list; back arrow → Home.
- Time Format picker options: `12h`→"12-hour (AM/PM)", `24h`→"24-hour". On change, Home re-formats times on return (Home's resume-refresh, per the Steps 1–3 review fixes).
- Reusable picker page: title = setting name; scrollable radio list of options (label + radio); current value preselected; tap → `setSettings({[key]: value})` → `applyReminders()` → `router.back()`.
- Resolve option lists + display labels from `methods.js` / the canonical value maps (e.g. offset `0` → "At prayer time").
- Madhab toggle: tap a segment → `setSettings({ madhab })` → `applyReminders()` → update visual.
- Use `lib/theme.js` colors; follow `settings-design.md` for positions/sizes/states; no `?.`.

# Tests

No on-device harness — verify MANUALLY on the Bip 6:
- Each row opens its picker; current value preselected; selecting persists and returns.
- Madhab toggle switches and persists.
- After changing method/offset, Home shows updated times and reminders reschedule (check an alarm time shifts).
- Settings list scrolls fully and stays usable within the round screen.
- Re-open Settings → previously chosen values are shown (persistence).

# Acceptance Criteria

- All four settings editable; values match the canonical Epic 01 keys (no new spellings).
- Every change writes storage AND calls `applyReminders()`.
- One reusable picker page handles method / highLatRule / reminderOffset.
- Back returns to Home, which reflects the changes.

# Definition Of Done

- Follows architecture + `settings-design.md`; canonical values preserved; no `?.`.
- Persists immediately; reschedules on every change.
- Round-screen scrolling verified; no debug leftovers.

# Notes For AI Coding

- Canonical `highLatRule` values are snake_case — do NOT introduce camelCase variants (that bug was already fixed in Epic 01).
- Don't build three pickers — one parameterized picker page.
