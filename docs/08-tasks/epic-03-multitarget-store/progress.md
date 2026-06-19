# Epic 03 — Multi-target & Store — Progress

## Pending
- Step 1 — gt scaffolding & assets (checklist in `overview.md`)
- Step 2 — gt Home (`feature-01-gt-home.md`)
- Step 3 — gt Settings + Picker (`feature-02-gt-settings.md`)
- Step 4 — gt Qibla (`feature-03-gt-qibla.md`)
- Step 5 — Store assets & submission (checklist)
- Step 6 — Final offline & permissions audit (checklist)

## Completed
- (none yet)
- Note: store copy already drafted in `../../app-store-listing.md` (finalize in Step 5).

## Blockers
- (none) — but verification needs a gt device or simulator; compass + alarm rollover should be confirmed on
  real gt hardware before store release.

## Implementation Notes
- No new logic this epic. Port the shipped `page/bip6/*` pages; consume `shared/` + `lib/reminders.js` as-is.
- Carry every Bip 6 UI rule (see `overview.md` header): `image/`-prefixed src; never tint an IMG via
  `color`; IMG `w`/`h` = PNG pixel size; rotation via `setProperty(MORE,{angle})`; poll the compass heading.
- gt is round (`gt.r`) + square (`gt.s`) sharing `page/gt/*` — verify both shapes; respect the round safe area.
- Keep `page/bip6/*` untouched except a non-regressing `lib/theme.js` size tweak if 480px needs it.
