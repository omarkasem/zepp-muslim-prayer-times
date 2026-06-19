# Home Screen — Implementation Spec (Variation A: Vertical List)

Coder-ready translation of the chosen design into Zepp `@zos/ui` (`hmUI`). Source design:
`designs/home/` (`screen.png`, `code.html`, `DESIGN.md`). This spec is the authority for implementation;
the HTML is reference only (Zepp does not run HTML — no Tailwind, no Material Symbols, no CSS glow/opacity).

## Target & units
- Device: Amazfit Bip 6, **390 (W) × 450 (H), RECTANGULAR** (not round). `designWidth: 390` → `px()` is 1:1. Wrap all coords in `px()`.
- **Rectangular full-screen layout:** use the full 390×450 area with ~24px side margins. No round-circle insets,
  no corner-clipping concerns. Center content horizontally; distribute vertically across the 450px height.
- **Hide the Zepp system status bar** (app name + clock) so the app owns the full screen; otherwise reserve its height at the top.
- Background: true AMOLED black `0x000000` (the design's `.watch-face` is `#000000`; ignore the `#121414` token for the bg).
- **Fonts:** the Stitch mock's sizes are too small physically — use the bumped sizes in `lib/theme.js`, not the raw mock px values below. The mock sizes are kept here only for relative hierarchy.

## Data sources (all already built in Epic 01)
- City: `storage.getLocation().city` (fallback `"—"`).
- Hijri date: `hijri.toHijri(today)` → `"12 Dhul-Hijjah 1447"` (uppercase it for display).
- 5 times: `computePrayerTimes({...location, ...settings, date: today})` → epoch-ms per prayer; format to `h:mm`.
- Next prayer: first prayer instant `> now`. That row is the **highlighted** row; countdown = `instant − now`.

## Color tokens (design hex → `hmUI` int)
| Role | Hex | Int |
|---|---|---|
| Background | `#000000` | `0x000000` |
| Accent / active icon (emerald) | `#4edea3` | `0x4edea3` |
| Qibla icon (deeper emerald) | `#10b981` | `0x10b981` |
| Next-prayer text (gold) | `#ffb95f` | `0xffb95f` |
| Next-prayer pill fill (deep gold, ~20% over black) | `#33240a` (approx) | `0x33240a` |
| Primary text (white) | `#e2e2e2` | `0xe2e2e2` |
| Muted label (city/hijri/inactive) | `#bbcabf` | `0xbbcabf` |
| Inactive prayer rows (50% white) | `#707070` (approx) | `0x707070` |
| Progress ring (emerald, faint) | `#10b981` | `0x10b981` |

> Zepp `FILL_RECT`/`TEXT` take solid colors only — no real opacity. Use the pre-flattened approximations above
> for the "20%/50% opacity" cases. No box-shadow → the gold "glow" is dropped (the pill fill + color carry it).

## Typography (design tokens, px)
| Token | Use | Size | Weight |
|---|---|---|---|
| `label-sm` | prayer names, "Cairo" | 12 | 600 |
| `body-lg` | inactive prayer times | 16 | 500 |
| `headline-md` | active prayer time | 20 | 600 |
| (small) | hijri date | 10 | uppercase, tracked |
| (xsmall) | active row countdown subtext | 9 | — |

Font is "Plus Jakarta Sans" in the design; use the watch's default system font (custom fonts optional later).

## Layout (top → bottom, on the 390×450 rectangle)
Coordinates below are **proportional guidance**, not literal — distribute across the full 450px height and
re-tune on-device. Anchor the bottom nav to `DEVICE_HEIGHT`, not a fixed 332. Account for the status bar
(hidden, or reserve ~top 48px).
1. **Top bar** (centered, below the status bar):
   - `📍 Cairo` row: pin icon + city text (bumped `label-sm`, color `0x4edea3`), centered.
   - Hijri date below it: `"12 DHUL-HIJJAH 1447"` (small, `0xbbcabf`, uppercase), centered.
2. **Prayer list** (5 rows, spread down the middle of the screen with comfortable gaps; full-width with ~24px side margins):
   - Inactive row = name left + time right, both `0x707070`. Use the bumped row fonts (readable at a glance).
   - Order: Fajr · Dhuhr · **Asr [active]** · Maghrib · Isha (sample data).
   - **Active (next) row** = a full-width **rounded pill** (`FILL_RECT`, radius = height/2, fill `0x33240a`):
     - Left stack: prayer name (`0xffb95f`) above `"Next in 1h 23m"` (`0xffb95f`).
     - Right: time (larger, `0xffb95f`).
3. **Bottom nav** (anchored near `DEVICE_HEIGHT - margin`, centered, generous gap): qibla compass + settings gear.
   **Make these clearly visible and tappable** — large tap targets (≥ ~44px), bigger icons, optionally text labels.
   (The first build's 20px dark icons were invisible.)
4. **Outer progress indicator** (optional): a thin emerald accent; on a rectangle this can be a top/bottom bar
   or a small arc rather than a full ring. Omit if time-boxed — not load-bearing.

## States
- **Highlight = computed, not hardcoded.** The pill moves to whichever prayer is next; all others render inactive.
- **After Isha (next is tomorrow's Fajr):** highlight the **Fajr** row, subtext `"Tomorrow"` (or the countdown to tomorrow's Fajr). Don't leave zero rows highlighted.
- **Loading (no times yet):** show "Getting location…" centered until location + times resolve.
- **Location unavailable:** city shows `"—"`; if no cached location at all, show a short "Location unavailable" message instead of the list (times can't be computed). Keep the settings/qibla icons reachable.

## Interactions
- Tap **qibla icon** → navigate to the Qibla page.
- Tap **settings icon** → navigate to the Settings page.
- (No other tap targets in V1; the list is display-only.)

## Live countdown
- The active row subtext (`"Next in 1h 23m"`) updates while the page is visible. Use a **1-minute page
  timer**; recompute "next prayer" each tick (so it rolls over to the next prayer when one passes).
  Stop/clear the timer on page hide/destroy. No background timers (that's the alarm system's job).

## Icons / assets
- Material Symbols don't exist on Zepp. Provide small PNG assets (or draw with `ARC`/`FILL_RECT`):
  `assets/<target>/image/ic_pin.png`, `ic_compass.png`, `ic_gear.png`. Render via `hmUI.widget.IMG` (or `BUTTON` with an image for the tappable compass/gear). Tint to the colors above by exporting them pre-colored.

## Progress ring (optional, ship static if needed)
- Use `hmUI.widget.ARC`. Semantic version: sweep = fraction elapsed between the previous and next prayer
  (`(now − prev)/(next − prev)`), color `0x10b981`, ~2px, near the edge. If time-boxed, render a fixed
  decorative arc or omit — it's not load-bearing.

## hmUI mapping notes / gotchas
- No opacity/shadow/Tailwind — use the flattened colors and a `FILL_RECT` pill.
- Lay out against the full **390×450 rectangle** (no circle insets); verify on the real Bip 6.
- This layout is for `page/bip6/home/`. The `gt` layout reuses the **same logic**, re-laid-out in Epic 03.
- All displayed values come from `shared/` — no recomputation or `@zos` calls inside layout code beyond reading storage.

## Acceptance
- Five prayers render with the correct next-prayer highlighted and a live, minute-updating countdown.
- City + hijri date shown; all content fits the 390×450 screen, comfortably readable.
- Qibla and Settings nav are visible, large enough, and navigate correctly.
- After-Isha, loading, and location-unavailable states behave as specified.
