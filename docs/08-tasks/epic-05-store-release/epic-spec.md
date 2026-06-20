# Epic Purpose

The final epic: prepare and submit the app to the store, and do the last release audit. This runs **after**
all functional work (Epic 02 Bip 6, Epic 03 gt, Epic 04 refactor + custom alert + Arabic + final app id/
name) so that screenshots, permissions, the privacy policy, and the package id are all final and won't be
invalidated by later changes. **No feature work here** — collateral, verification, and submission only.

> Originally these were the tail of Epic 03 ("Multi-target & Store"). They were split out so the store steps
> are genuinely last, after Epic 04's app-changing work.

# Included Features

- **Store assets** — final per-target app icon (240×240, circular, transparent, no padding) + store
  screenshots for Home, Qibla, and Settings (English and Arabic). **(simple → overview checklist)**
- **Listing finalization** — `docs/app-store-listing.md` filled and final: EN + AR name/intro/details,
  Features Descriptions (reviewer-facing), Privacy Policy text, permission selections, SDK=No, music=No,
  contact email filled, "Last updated" current. **(simple → overview checklist)**
- **Final offline + permissions audit** — confirm offline behavior and that `app.json` permissions exactly
  match real usage; finalize version + app id. **(simple → overview checklist)**
- **Submission** — package and submit; record the submission. **(simple → overview checklist)**

# Excluded Features

- Any code/feature/layout change. If the audit finds a real bug, fix it in the owning epic, then return here.

# Dependencies

- **Epic 04 complete** (refactor + alert + Arabic + `appId 1115692` + EN/AR names) — hard prerequisite.
- Epics 02–03 (the four screens on Bip 6 + gt). `docs/app-store-listing.md` (drafted).
- ASO screenshot skills for store images. A privacy-policy public URL host if the store requires one.

# Risks & Complexity Concerns

- **Sequencing:** if any earlier epic changes after screenshots/audit, this epic must be re-run. Treat Epic
  04 as frozen before starting.
- **Privacy-policy URL:** some stores require the policy at a public URL, not just pasted text — may need to
  publish `docs/app-store-listing.md`'s policy section (e.g. a `PRIVACY.md` on GitHub Pages).
- **Screenshot accuracy:** screenshots must reflect the shipped UI (post-refactor, Arabic included) and the
  correct app name.
- **Device coverage:** ideally verify the offline/permissions audit on each shipped target (Bip 6 + gt) on
  real hardware or simulator.

# Integration Test Scenarios

- Fresh install on each target shows the correct name ("Muslim Prayer Times" / "مواقيت صلاة المسلم") under
  app id 1115692.
- Airplane mode after first location fetch: every screen works; reminders still fire (cached location).
- Each requested `app.json` permission is actually used; no unused permission is requested.
- Screenshots match the real shipped screens in both languages.

# AI Coding Concerns

- This epic produces collateral + verification, not code. Don't reopen feature work here — route real bugs
  back to the owning epic.
- Keep the listing doc as the single source of truth for store copy and permissions.
