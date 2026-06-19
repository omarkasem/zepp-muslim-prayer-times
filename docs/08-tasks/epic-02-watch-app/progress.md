# Epic 02 — Watch App — Progress

## Pending
- Step 1 — Scaffolding & icon assets (checklist in `overview.md`)
- Step 2 — Home screen (`feature-01-home.md`)
- Step 3 — Reminders (`feature-02-reminders.md`)
- Step 4 — Settings (`feature-03-settings.md`)
- Step 5 — Qibla (`feature-04-qibla.md`)

## Completed
- (none yet)

## Blockers
- (none) — but Step 5 needs the Bip 6 `@zos/sensor` compass API confirmed on-device first.

## Implementation Notes
- Epic 01 `shared/` is done (29 tests green) — consume as-is; don't reimplement math in UI.
- `lib/reminders.js` is the ONLY `@zos/alarm` caller (shared by Home, Settings, app-service).
- Most of this epic is UI/alarm/sensor → verified MANUALLY on the Bip 6 (no on-device test harness).
- Keep Epic 01 discipline: no `@zos` in `shared/`, network only in `app-side`, no `?.`.
