# Epic 04 — Refactor, Localization & Polish — Progress

## Pending (in build order)
- Step 1 — App identity & metadata (checklist) — request #5
- Step 2 — Shared page architecture + multi-device, incl. Home buttons fix
  (`feature-01-shared-architecture.md`) — requests #1 + #3
- Step 3 — Custom prayer alert with logo (`feature-02-custom-prayer-alert.md`) — request #2
- Step 4 — Arabic localization + RTL (`feature-03-arabic-localization.md`) — request #4

## Completed
- (none yet)

## Blockers
- (none) — but: custom alert appearance is platform-limited (verify on-device); "more devices" needs a
  device/simulator to verify each added target.

## Implementation Notes
- Epic 03 (gt) is **done** — gt pages are full duplicates of Bip 6. Step 2's refactor collapses that so the
  alert + Arabic land **once** across bip6 + gt.r + gt.s, not three times. Do Step 2 before Steps 3–4.
- Don't change `shared/` math or alarm semantics — refactor + polish + i18n only.
- Identity target: `appId 1115692`, name "Muslim Prayer Times" / "مواقيت صلاة المسلم".
- `notify()` has no logo field (title/content/actions/vibrate only) → a logo alert needs a custom page or
  relies on the app icon; keep the system-notification fallback.
- No page uses `getText` today — i18n is a full pass over every hardcoded string + a new `ar-SA.po` + RTL.
- `lib/theme.js` already width-scales fonts (Bip 6 390 vs gt 480) — build the refactor on that.
- The Home button fix (request #3) is folded into Step 2 so it's fixed once in the shared Home view.
- After this epic → **Epic 05 (store submission + release audit)**, the last epic.
- Carry every Bip 6 UI rule (see `overview.md` header) + RTL.
