# Epic 01 — Engine & Data — Progress

## Pending
- Step 1 — Tooling & restructure
- Step 2 — `shared/storage.js`
- Step 3 — `shared/methods.js`
- Step 4 — `shared/prayer-times.js` (see `feature-01-prayer-times.md`)
- Step 5 — `shared/hijri.js`
- Step 6 — `shared/qibla.js`
- Step 7 — `shared/scheduler.js` (see `feature-02-scheduler.md`)
- Step 8 — `app-side/index.js` cleanup

## Completed
- (none yet)

## Blockers
- (none)

## Implementation Notes
- `shared/` must stay `@zos`-free for Node/Vitest.
- Spike currently in `page/bip6/home/index.page.js` (test alarms) is removed in Step 1.
- Existing `app-side/index.js` already does the IP lookup — Step 8 is cleanup/shape-confirm, not a rewrite.
