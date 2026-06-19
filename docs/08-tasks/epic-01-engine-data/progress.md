# Epic 01 — Engine & Data — Progress

## Pending
- (none) — all 8 steps built. One required fix outstanding before Epic 01 is "done":
  `scheduler.js` optional-chaining (see `review-fixes-steps-5-8.md`, Fix 1).

## Completed
- Step 1 — Tooling & restructure ✅
- Step 2 — `shared/storage.js` ✅
- Step 3 — `shared/methods.js` ✅
- Step 4 — `shared/prayer-times.js` ✅ (reviewed; fixes in `review-fixes-steps-1-4.md` applied)
- Step 5 — `shared/hijri.js` ✅ (reviewed)
- Step 6 — `shared/qibla.js` ✅ (reviewed)
- Step 7 — `shared/scheduler.js` ✅ (reviewed; pending optional-chaining fix)
- Step 8 — `app-side/index.js` cleanup ✅ (reviewed; shape confirmed, no rewrite needed)

## Blockers
- (none)

## Reviews
- `review-fixes-steps-1-4.md` — applied (highLatRule key unification, scratch cleanup, test integrity).
- `review-fixes-steps-5-8.md` — Fix 1 (scheduler `?.`) required; Fixes 2–3 optional.

## Test status
- 27 tests passing across 6 `shared/` test files.

## Implementation Notes
- `shared/` stays `@zos`-free for Node/Vitest (verified — hijri/qibla/scheduler are pure).
- Open verification carried to Epic 02: Bip 6 `@zos/sensor` compass API (for qibla).
- Spike test-alarm code removed in Step 1; `app-side/index.js` IP lookup confirmed in Step 8.
