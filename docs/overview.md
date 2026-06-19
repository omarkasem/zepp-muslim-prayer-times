# AI Product Pipeline Overview

A structured workflow for building WordPress plugins or mobile apps with AI assistance.

Each step produces ONE source-of-truth file and feeds the next step.

## Pipeline

1. **Idea** → `01-idea/idea.md`
2. **Market Research** → `02-market-research/market-research.md`
3. **Positioning** → `03-positioning/positioning.md` (decision gate: Build / Validate / Avoid)
4. **PRD** → `04-prd/product-requirements.md`
5. **UI Sketches** → `05-ui-sketches/ui-sketches.md`
6. **Architecture** → `06-architecture/architecture.md` (forked: wp / mobile / saas)
7. **AI Coding Context** → `07-ai-coding/ai-context.md`
8. **Tasks** → `08-tasks/roadmap.md` → `epic-spec.md` → `feature-*.md`

## How to use

- Start a fresh AI conversation per step (keeps context small).
- Each step folder contains a `start-*.md` with the prompt to paste.
- ALWAYS paste `_shared/preamble.md` BEFORE the step prompt.
- After each step, update `progress.md`.
- If you edit an upstream file, mark downstream files as stale and re-run them.
- If Step 03 says **Avoid**, stop. Don't push forward.

## Files

- `_shared/preamble.md` — universal rules pasted before every step.
- `progress.md` — tracks step status and drift.
