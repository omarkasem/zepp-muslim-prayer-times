# Epic 05 — Store Submission & Release Audit — Overview

**Status:** not started. **The last epic** — run only after Epic 04 is complete and frozen (refactor + custom
alert + Arabic + `appId 1115692` + EN/AR names).
**Source of truth:** `epic-spec.md`. **No feature/code changes here** — collateral, verification, submission.
**How to use:** point at this file and say *"implement Step N"*.

> These steps were moved out of Epic 03 so they run truly last (screenshots/permissions/app id must be final).

---

## Step 1 — Final offline & permissions audit  (checklist)
- [ ] Airplane mode after first location fetch: all screens render; reminders still fire (cached location).
- [ ] `app.json` permissions exactly match real usage — remove any unused permission.
- [ ] Confirm `appId: 1115692`, name "Muslim Prayer Times" / "مواقيت صلاة المسلم"; bump `version.code`/`name`.
- [ ] No debug leftovers / console spam across all targets (Bip 6 + gt.r + gt.s).

## Step 2 — Store assets  (checklist)
- [ ] Final app icon per target: 240×240 PNG, circular, transparent background, no padding.
- [ ] Generate store screenshots (use the ASO screenshot skill) for Home, Qibla, Settings — **English and
      Arabic**, reflecting the post-refactor shipped UI.

## Step 3 — Listing finalization  (checklist)
- [ ] `docs/app-store-listing.md` final: EN + AR name/intro/details, Features Descriptions, Privacy Policy
      text, permission selections, SDK=No, music=No.
- [ ] Replace `[your contact email]` in the privacy policy; set "Last updated" to the submission date.
- [ ] If the store requires a privacy-policy **URL**, publish the policy (e.g. `PRIVACY.md` via GitHub Pages)
      and link it.

## Step 4 — Submit  (checklist)
- [ ] Package and submit to the store; record the submission (date, version, id).
- [ ] Note any reviewer feedback for follow-up.

---

## Quick References
- Epic spec: `epic-spec.md` · Roadmap: `../roadmap.md`
- Store copy / privacy policy: `../../app-store-listing.md`
- Prereq epics: `../epic-04-refactor-localization-polish/`, `../epic-03-multitarget-store/`
- ASO screenshot skills: `aso-appstore-screenshots`, `aso-googleplay-screenshots`
