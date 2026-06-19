# On-watch fixes — layout/sizing on the real Bip 6

**Confirmed device: Amazfit Bip 6 is 390 (W) × 450 (H), RECTANGULAR** — not round. `designWidth: 390`
matches the real width, so `px()` is already 1:1 (no scaling bug). That means:
- The tiny fonts are a **genuine sizing problem** — the design's font sizes are just too small physically. Bump them.
- The screen is **450 tall** (taller than the ~390 the round mock assumed), so there's **extra vertical room**,
  not a shortage. The bottom nav isn't off-screen — it's just rendered as tiny dark icons that are invisible.
- The round-safe-area / 342px-circle assumptions are wrong; use the full 390×450 rectangle.

Fix in this order; test each on the watch.

## Step 0: no designWidth change needed
`designWidth: 390` is correct (= device width). Do NOT change it. Just lay out against
`DEVICE_WIDTH` (390) × `DEVICE_HEIGHT` (450) and use the full height.

## Fix 1: hide the system status bar (app name + clock)
The top "Prayer Times / 12:42 PM" bar is the Zepp OS system status bar on app pages. Hide it so the app
owns the full screen. Find the correct current API (e.g. a `@zos/ui`/page status-bar visibility call, or a
`STATUS_BAR`/page-config option) and hide it on all four pages (home, settings, settings-picker, qibla).
If it can't be hidden, push all content down by its height so nothing sits under it.

## Fix 2: bump font sizes (much larger)
The Noor `FONT_SIZES` came from a hi-dpi mock and are far too small physically. Increase them substantially
in `lib/theme.js` and re-tune on-device. Rough starting targets (then adjust by eye on the watch):
- prayer name + time rows: ~28–30
- next-prayer pill time: ~34–38, its label ~22, countdown ~18
- city ~22, hijri ~18, settings row labels ~26, picker options ~26
- qibla bearing (big number) keep large (~44–52), labels ~20
Make the prayer list comfortably readable at a glance — that's the whole point of the app.

## Fix 3: make the layout responsive (rectangular, not round)
The hardcoded `ROW_Y`, the 342px "circle", and fixed y-offsets were built for a round 390 screen. Rework
positions to use `DEVICE_WIDTH`/`DEVICE_HEIGHT` proportionally so content fills the rectangular screen and
nothing falls off the bottom:
- Distribute the 5 prayer rows using the available height between the header and the bottom nav.
- Place the **Settings + Qibla nav** within the visible area (anchor to `DEVICE_HEIGHT - margin`), and make
  the tap targets bigger (≥ ~44px) and clearly visible — add text labels or larger icons; the 20px dark
  icons are invisible. Confirm they render and are tappable.
- Drop the round-safe-area insets; use the full width with sensible side margins.

## Fix 4: apply the same to Settings, Picker, Qibla
- Settings/Picker: bigger row text + taller rows; confirm scrolling reaches every row on the real height.
- Qibla: the compass was designed to "fill a circle" — on a rectangular screen, center it and size the
  dial/arrow to `min(DEVICE_WIDTH, available_height)`. Keep it centered; it doesn't need to be round.

## Done when (verify on the Bip 6)
- `designWidth` matches the real device; text is comfortably readable.
- No system status bar overlapping the app (hidden or accounted for).
- Settings + Qibla nav are visible and tappable on Home.
- All five prayers, header, and nav fit on screen without clipping; Settings/Picker scroll fully.

## Note for the docs (Claude will handle)
The `*-design.md` specs say "390px round / 342px circle" — that's wrong; the Bip 6 is rectangular. Claude
will correct the design specs to rectangular once the real resolution is known.
