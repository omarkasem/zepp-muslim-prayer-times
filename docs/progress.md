# Pipeline Progress

## Project Identity (locked 2026-06-19)
- **App name:** Prayer Times (Zepp OS watch app)
- **Zepp appId:** `21915` (see `app.json`)
- **Platform:** Zepp OS v3 watch app — first target **Amazfit Bip 6** (390px round); also `gt` family (`r`/`s`)
- **Distribution:** free, Zepp app store
- **Architecture model:** `page` (on-watch UI) / `app-side` (phone companion, network) / `app-service` (background alarms)

## Pipeline tailoring (decided 2026-06-19)

This pipeline was built for WordPress plugins / RN-Expo apps. For a free single-purpose Zepp watch
app, steps were tailored:

- **02 Market Research — SKIPPED.** Two known competitors (one broken, one inaccurate); the one
  useful learning ("inaccurate" = wrong method/timezone, not bad math) is folded into `idea.md`.
- **03 Positioning — SKIPPED.** No price (free), no marketing budget, decision is already Build.
  Differentiator ("accurate + actually works") folded into `idea.md` / PRD.
- **05 UI Sketches — KEPT, design-variation workflow.** One Gemini Canvas prompt per screen
  (`home-prompt.md`, `settings-prompt.md`, `qibla-prompt.md`, prompt-only files). Each chosen design's
  React is pasted back as `home-design.md` / `settings-design.md` / `qibla-design.md`, then translated
  to Zepp `hmUI` during implementation.
- **06 Architecture — REWRITTEN for Zepp** (the mobile/RN template does not apply).
- **07 AI Coding Context — highest-priority doc** (AI coder writes 100% of the code).

## Status

| Step | File | Status | Last updated | Source inputs |
|---|---|---|---|---|
| 01 | `01-idea/idea.md` | ☑ done | 2026-06-19 | — |
| 02 | market research | ⏭ skipped | 2026-06-19 | folded into `idea.md` |
| 03 | positioning | ⏭ skipped | 2026-06-19 | folded into `idea.md` |
| 04 | `04-prd/product-requirements.md` | ☑ done | 2026-06-19 | `01-idea/idea.md` |
| 05 | `05-ui-sketches/{home,settings,qibla}-prompt.md` | ◐ prompts ready; awaiting `*-design.md` | 2026-06-19 | `04-prd` |
| 06 | `06-architecture/architecture.md` (Zepp) | ☑ done | 2026-06-19 | `04-prd` |
| 07 | `07-ai-coding/ai-context.md` | ☑ done | 2026-06-19 | `04-prd`, `06-architecture` |
| 08a | `08-tasks/roadmap.md` | ☑ done | 2026-06-19 | `04-prd`, `06-architecture` |
| 08b/c | per-epic specs + feature files | ☐ pending | — | `roadmap.md` (one epic at a time) |

## Current code state (proven spike)
- Location working: IP lookup in `app-side/index.js` (ipwho.is → ipapi.co fallback), returns lat/lon/city/timezone.
- Alarms working: `page/bip6/home/index.page.js` schedules 5 test alarms (30s apart) via `@zos/alarm`;
  `app-service/reminder.js` posts a notification on wake. This is a SPIKE, not final structure.

## Drift Rule

If you edit any file in this pipeline, mark every downstream file as ⚠️ stale. Re-run the affected steps before continuing.

## Key decisions (locked 2026-06-19)
- Prayer times: **offline on-device math** (e.g. adhan-style), method-driven. No daily API dependency.
- Location: **IP-based via phone companion** (city-level), cached on watch. Manual override = future.
- Reminders: global "X minutes before" offset (0 = on time). Per-prayer config = future.
- Athan audio = **dropped permanently** (V1 and beyond: vibration + notification only).
- Qibla = committed V1. Build detail: confirm the Bip 6 `@zos/sensor` compass API.
