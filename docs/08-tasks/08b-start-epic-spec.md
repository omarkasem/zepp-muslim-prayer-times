First read and apply all rules from `_shared/preamble.md`.

Inputs: `04-prd/product-requirements.md`, `06-architecture/architecture.md`, `08-tasks/roadmap.md`, plus the ONE epic you picked.
Output: `08-tasks/epic-xx-name/epic-spec.md`

Help me write the specification for a single epic.

Discuss with me first:
- epic boundaries
- weak feature boundaries
- duplicated functionality risks
- implementation risks

Stay modular. Do NOT generate code, implementation files, or detailed tasks. Do NOT expand scope beyond this epic.

When listing features, note which are **complex** (warrant their own `feature-*.md` in step 08c) vs **simple plumbing** (a checklist in `overview.md`). This keeps the doc set lean and avoids stale over-documentation.

When refinement is complete, generate the final file with this structure:

# Epic Purpose

# Included Features

# Excluded Features

# Feature Boundaries
For each feature:
- purpose
- complexity estimate
- dependencies
- architecture notes

# Shared Services

# Shared Validation Logic

# Shared UI Patterns

# Dependencies

# Risks & Complexity Concerns

# Recommended Simplifications

# Integration Test Scenarios
Cross-feature flows only. Bullet list of end-to-end paths that touch more than one feature in this epic. NO code, NO per-feature unit tests (those live in each feature file). Skip this section if architecture.md defines no testing strategy.

# AI Coding Concerns
