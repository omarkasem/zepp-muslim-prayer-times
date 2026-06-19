# Settings Screen — Implementation Spec (Variation A: Modern List)

Coder-ready translation into Zepp `@zos/ui` (`hmUI`). Source design: `designs/settings/`
(`screen.png`, `code.html`, `DESIGN.md`). HTML is reference only — no Tailwind/Material icons/opacity on Zepp.

## Key structural change from the mockup
The mockup shows the Calculation Method **expanded inline** (accordion), which makes one very long page.
On a small round watch we use the **per-row-picker** pattern instead: the main Settings page is a short
scrollable list of rows; tapping a row that has multiple options opens its **own full-screen picker**
(the radio list from the mockup), select → persist → back. The **Asr Madhab** toggle stays **inline**
(only two options). Same visual style, far easier to use.

## Target & units
- Bip 6, **390×390 round**, `designWidth: 390` → `px()` ~1:1. The page **scrolls vertically** (content > 390).
- Rows are full-width rounded cards; keep inner text ~24px from the screen edges (round-corner clipping during scroll is normal/expected).

## Pages / target files
- `page/bip6/settings/index.page.js` — the main settings list.
- `page/bip6/settings-picker/index.page.js` — **one reusable picker** page, parameterized by which setting it edits (method / highLatRule / reminderOffset). Pushed via `@zos/router` with params; writes the choice and returns.

## Data sources (Epic 01 `shared/storage.js` + `methods.js`)
- `getSettings()` → `{ method, madhab, highLatRule, reminderOffsetMin }`.
- Method options from `methods.js`: `umm_al_qura`→"Umm al-Qura", `mwl`→"Muslim World League", `egyptian`→"Egyptian", `isna`→"ISNA", `karachi`→"Karachi".
- High-latitude options: `none`→"None", `middle_of_night`→"Middle of Night", `one_seventh`→"One-Seventh", `angle_based`→"Angle-Based". *(The mockup's "Auto" label is replaced by these real values; default = `none`.)*
- Reminder-offset options: `0`→"At prayer time", `5`→"5 min", `10`→"10 min", `15`→"15 min", `20`→"20 min".
- Time-format options: `12h`→"12-hour (AM/PM)", `24h`→"24-hour". Default `12h`.

## On change (important wiring)
Any setting change must: `setSettings(...)` → **recompute today's times + reschedule alarms** via
`shared/scheduler.planAlarms(...)` then apply with `@zos/alarm` (cancel `cancelIds`, set `create`, persist ids).
Do this on each save. When returning to Home, Home re-reads settings and re-renders.

## Color tokens (Noor → `hmUI` int)
| Role | Hex | Int |
|---|---|---|
| Screen background | `#000000` | `0x000000` |
| Row/card background | `#1a1c1c` | `0x1a1c1c` |
| Title + accent + current value + selected | `#4edea3` | `0x4edea3` |
| Row label text (white) | `#e2e2e2` | `0xe2e2e2` |
| Inactive option (60% white) | `#8f8f8f` (approx) | `0x8f8f8f` |
| Segmented selected segment fill | `#4edea3` | `0x4edea3` |
| Segmented selected segment text | `#003824` | `0x003824` |
| Segmented track background | `#000000` | `0x000000` |

## Typography (Noor tokens, px)
| Use | Token | Size | Weight |
|---|---|---|---|
| "Settings" title / picker title | headline | 22 | 700 |
| Row label, option label | body-lg | 16 | 500 |
| Current value, toggle text, picker subtitles | label-sm | 12 | 600 |

## Main Settings page layout (top → bottom, scrollable)
1. **Header** (y≈36): back arrow (top-left ~x24, `0x4edea3`) + "Settings" centered (`0x4edea3`, 22px).
2. **Calculation Method** row (card `0x1a1c1c`, radius ~16, height ~56): label "Calculation Method" left (`0xe2e2e2`, 16); current value right (`0x4edea3`, 12, e.g. "Umm al-Qura") + chevron. Tap → picker(`method`).
3. **Asr Madhab** card (height ~84): label "Asr Madhab" (top); below it a **segmented toggle** (rounded, full-width): two equal segments "Standard" / "Hanafi". Selected = fill `0x4edea3`, text `0x003824`; unselected = text `0x8f8f8f` on transparent. Tap a segment → write `madhab` immediately + update visual + run On-change.
4. **High Latitude Rule** row (height ~56): label + current value (`0x4edea3`) + chevron. Tap → picker(`highLatRule`).
5. **Reminder Offset** row (height ~56): label + current value (e.g. "5 min", or "At prayer time" for 0) + chevron. Tap → picker(`reminderOffset`).
6. **Time Format** row (height ~56): label "Time Format" + current value ("12-hour (AM/PM)" / "24-hour") + chevron. Tap → picker(`timeFormat`).

- Gaps ~8px between cards; horizontal padding ~12px (card), ~24px (inner text).

## Reusable Picker page layout
- **Title** at top (the setting's name, `0x4edea3`, 22px) + back arrow.
- **Scrollable radio list** — each option a row (~52px): label left (`body-lg`); radio indicator right.
  - Selected: label `0x4edea3`, filled radio (green).
  - Unselected: label `0x8f8f8f`, empty radio.
- Tap an option → `setSettings({ [key]: value })` → run On-change → `router.back()` to Settings.
- Params in: `{ key }` (`method` | `highLatRule` | `reminderOffset`). The page resolves its option list + labels + current value from `getSettings()` / `methods.js`.

## Interactions / navigation
- Home settings icon → push `page/bip6/settings`.
- Settings back arrow → `router.back()` to Home (Home refreshes from storage).
- Row tap → `router.push({ url: 'page/bip6/settings-picker', params: { key } })`.
- Madhab toggle is inline (no picker).

## Icons / assets
- Material Symbols don't exist on Zepp. Bundle PNGs (or draw): `ic_back.png`, `ic_chevron.png`,
  `ic_radio_on.png` (filled green), `ic_radio_off.png`. Segmented toggle = two `FILL_RECT`s + text.

## hmUI mapping notes / gotchas
- Enable vertical page scrolling (content taller than 390); top-anchored vertical stack of row widgets.
- No opacity/shadow/Tailwind — use the flattened colors and `FILL_RECT` cards (radius via `radius` prop).
- **Persist immediately on every change** and always run the recompute+reschedule On-change wiring.
- Keep inner text inside the round safe area; verify scrolling on the real Bip 6.
- `page/bip6/...`; the `gt` (480px) re-layout is Epic 03, reusing identical logic + storage.

## Acceptance
- Four settings editable: method, madhab (inline toggle), high-latitude rule, reminder offset.
- Each multi-option setting opens a scrollable radio picker; current value preselected; selection persists.
- Every change writes storage AND recomputes times + reschedules alarms.
- Back returns to Home, which reflects the new settings.
- All content usable within the round screen while scrolling.
