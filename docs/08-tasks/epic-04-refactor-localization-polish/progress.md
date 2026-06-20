# Epic 04 — Refactor, Localization & Polish — Progress

## Pending
- Step 1 — App identity & metadata (checklist) — request #5
- Step 2 — Home Qibla/Settings buttons fix (checklist) — request #3
- Step 3 — Shared page architecture + multi-device (`feature-01-shared-architecture.md`) — request #1
- Step 4 — Custom prayer alert with logo (`feature-02-custom-prayer-alert.md`) — request #2
- Step 5 — Arabic localization + RTL (`feature-03-arabic-localization.md`) — request #4

## Completed
- (none yet)

## Blockers
- (none) — but: custom alert appearance is platform-limited (verify on-device); "more devices" needs a
  device/simulator to verify each added target.

## Implementation Notes
- Don't change `shared/` math or alarm semantics — refactor + polish + i18n only.
- Identity target: `appId 1115692`, name "Muslim Prayer Times" / "مواقيت صلاة المسلم".
- `notify()` has no logo field (title/content/actions/vibrate only) → a logo alert needs a custom page or
  relies on the app icon; keep the system-notification fallback.
- No page uses `getText` today — i18n is a full pass over every hardcoded string + a new `ar-SA.po` + RTL.
- `lib/theme.js` already width-scales fonts (Bip 6 390 vs gt 480) — build the refactor on that.
- Sequencing: prefer doing the shared-architecture refactor (Step 3) before/with Epic 03's gt port so gt is
  built on shared controllers, not copied then de-duplicated.
- Carry every Bip 6 UI rule (see `overview.md` header) + RTL.
