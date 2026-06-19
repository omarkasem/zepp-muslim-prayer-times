First read and apply all rules from `_shared/preamble.md`.

Inputs: `01-idea/idea.md`, `03-positioning/positioning.md`
Output: `04-prd/product-requirements.md`

Precondition: `positioning.md` must end with `Build`. If it says `Validate More` or `Avoid`, stop.

Help me create a PRD for this product.

This PRD is for AI-assisted MVP shipping. Discuss:
- MVP boundaries
- feature priorities
- onboarding flow
- UX simplicity
- implementation risks
- weak or unnecessary features

Do NOT restate problem statement, target users, or risks — those already exist in idea.md and positioning.md. The PRD should LINK to them, not duplicate.

When refinement is complete, generate the final file with this structure:

# Product Summary
One short paragraph.

# References
- Problem & users: see `01-idea/idea.md`
- Strategy & differentiation: see `03-positioning/positioning.md`

# MVP Goal
One sentence.

# Core Features
List with one-line purpose each.

# User Flows
Step-by-step for the main flows only.

# UX Principles

# Technical Constraints

# Success Metrics

# Out of Scope (Not V1)

# Future Features
Ideas only — not commitments.

# Risks & Challenges
Implementation-specific risks only (not market risks — those live in positioning.md).
