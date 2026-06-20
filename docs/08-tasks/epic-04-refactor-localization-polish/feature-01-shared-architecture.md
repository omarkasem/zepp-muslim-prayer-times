# Purpose

Stop copy-pasting per-device pages. Extract the device-agnostic logic out of the Bip 6 pages into reusable
`lib/` controllers, and reduce each `page/<target>/.../index.page.js` to a thin **view** (layout only) that
drives a shared controller. Result: one source of truth per screen, and adding a new device becomes a
layout-config change instead of a page copy. Add new device targets where they can be verified.

# User Value

Indirect but important: faster, less buggy iteration and consistent behavior across devices — fixes land
once, not per device. Enables more supported watches.

# Dependencies

- Reference impl: the shipped `page/bip6/{home,settings,settings-picker,qibla}/index.page.js`.
- `shared/*` (engine — unchanged), `lib/theme.js` (width-scaled fonts — already present), `lib/reminders.js`.
- Closely related to Epic 03 (gt layouts) — see "Notes".

# Target Files

- New: `lib/controllers/` (or similar) — e.g. `home-controller.js`, `qibla-controller.js`,
  `settings-model.js`: device-agnostic state + logic (no `@zos/ui` coordinates).
- New/refactored views: `page/bip6/*` thinned to layout; `page/gt/*` built on the same controllers.
- `lib/theme.js` / a new `lib/layout.js` for responsive helpers if needed.
- `app.json` — add new device targets (per resolution/shape family) where verifiable.

# Public Interface

- Controllers export plain functions/objects (no `@zos/ui`): e.g. `createHomeController()` returning
  `{ state, computeNext(), formatRow(), ... }`. Views import them and only place widgets.

# Related Shared Logic

- Controllers orchestrate `shared/{prayer-times,hijri,qibla,storage}` and `lib/reminders`. They must NOT
  duplicate the math — only call it and hold view-ready state.

# Build Order

Step 3 of the epic (after the quick identity + button fixes). **Do before Epic 03's gt port** so gt is
built on shared controllers, not a copy of Bip 6.

# Tasks

- Identify the device-agnostic parts of each Bip 6 page: home (location/compute/current-next/countdown/
  timer lifecycle), qibla (compass start/stop/poll, heading→rel, alignment, vibrate), settings (read/write/
  reschedule, option lists, short labels). Move them into `lib/` controllers with unit-friendly signatures.
- Keep all `@zos/ui` widget creation in the per-target view; the view asks the controller for state and
  renders. Pass device dims / `designWidth` into the view; keep layout constants per shape/size.
- Replace the Bip 6 pages with thin views calling the controllers; behavior must be unchanged.
- Build (or refactor) the gt views on the SAME controllers (coordinate with Epic 03).
- Add new device targets grouped by resolution/shape family; only claim devices you can verify.
- Keep `shared/` `@zos`-free; new glue lives in `lib/`; no `?.`.

# Tests

- `shared/` unit tests still green (unchanged). Add light unit tests for new pure controller logic where
  practical (e.g. current/next selection, rel/alignment math) since it's now `@zos`-free.
- Manual on each device: every screen behaves exactly as the shipped Bip 6 (home highlight/countdown,
  settings persist+reschedule, qibla rotate+align, reminders fire). No visual or behavioral regressions.

# Acceptance Criteria

- No duplicated screen logic between `page/bip6/*` and `page/gt/*` — shared via `lib/` controllers.
- Bip 6 behavior identical to before the refactor (verified on-device).
- Adding a device is a layout/config addition; at least the existing targets (and any newly added, verified
  ones) work through the shared controllers.

# Definition Of Done

- Controllers are `@zos/ui`-free and reused by all target views; views are layout-only.
- `shared/` math + alarm semantics unchanged; `shared/` tests green.
- Bip 6 re-verified; carry all Bip 6 UI rules; no `?.`; no debug leftovers.

# Notes For AI Coding

- Refactor incrementally, one screen at a time, re-verifying after each — don't big-bang all four screens.
- Don't over-abstract: a small controller per screen + thin per-shape view is the target, not a UI framework.
- This supersedes Epic 03's "duplicate the page" approach — align the two so gt is built on the controllers.
