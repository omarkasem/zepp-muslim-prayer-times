# Epic 03 — Multi-target (gt) — Progress

## Completed
- Step 1 — gt scaffolding & assets (pages registered in `app.json`; `ic_*` + logo bundled under
  `assets/gt.r/image/` and `assets/gt.s/image/`).
- Step 2 — gt Home (`page/gt/home/index.page.js`).
- Step 3 — gt Settings + Picker (`page/gt/settings/index.page.js`, `page/gt/settings-picker/index.page.js`).
- Step 4 — gt Qibla (`page/gt/qibla/index.page.js`).
- Verified: all gt pages syntax-clean, `image/`-prefixed `src`, no `IMG` `color` tints, no `heading` debug.

## Moved out
- Store assets/screenshots + final offline/permissions audit → **`../epic-05-store-release/`** (run last).

## Pending
- (none in this epic.)

## Blockers / Notes
- gt pages are near-verbatim copies of the Bip 6 pages (only layout numbers differ). This duplication is
  intentionally collapsed by **Epic 04 feature-01 (shared architecture)** — do that refactor before the
  Arabic/alert work so those land once across bip6 + gt.r + gt.s, not three times.
- gt behavior still needs real-device/simulator confirmation for the compass + alarm rollover paths.
