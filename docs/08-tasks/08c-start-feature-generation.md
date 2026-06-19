First read and apply all rules from `_shared/preamble.md`.

Inputs: `04-prd/product-requirements.md`, `06-architecture/architecture.md`, `08-tasks/roadmap.md`, `08-tasks/epic-xx-name/epic-spec.md`
Output: `overview.md`, `progress.md`, and `feature-NN-name.md` files inside `08-tasks/epic-xx-name/` (NN = contiguous order among feature files: 01, 02, 03…)

`epic-spec.md` is the source of truth. Do NOT expand beyond it. Generate ONE epic at a time.

Help me generate feature implementation files from this epic specification.

Discuss with me first:
- weak feature boundaries
- duplicated logic risks
- task granularity

The epic specification is the source of truth. Do NOT invent extra features, expand scope, or modify epic boundaries.

Tasks should be small, clear, isolated, and implementation-oriented.

Bad task: "Build delivery system"
Good task: "Create DeliveryRuleRepository CRUD methods"

## Right-size the ceremony (important)

Do NOT force every feature into its own file — that creates doc bloat that goes stale once code exists.
- **Complex / risky / security-sensitive features** (e.g. token services, coupon issuance, payment, anything with non-trivial logic or many edge cases) → get a full `feature-*.md`.
- **Simple / mechanical plumbing** (constants, an enqueue helper, a static settings shell) → list as a **task checklist inside `overview.md`**, no separate file.
Pick the split explicitly and justify it in `overview.md`.

These files are written for an AI coding agent. Optimize each feature file to be near-executable: explicit target files, the public interface other features depend on, concrete acceptance criteria, and a precise test list.

When refinement is complete, generate the following files inside `08-tasks/epic-xx-name/`:

## overview.md
- epic status
- a single ordered **build sequence (Step 1 → N)** covering BOTH feature files and setup-checklist items in dependency order — this list is the authority on what's next
- active implementation phase
- quick references

**Numbering convention:** the build-sequence steps are the authority on order. Name feature files `feature-NN-name.md` with **contiguous** numbers (01, 02, 03…) in the order they appear in the sequence — no gaps. Simple-plumbing items are named setup-checklist sections in `overview.md` (not numbered files), referenced from the build sequence by their step.

## progress.md
- pending features
- completed features
- blockers
- implementation notes

## feature-NN-name.md (one per COMPLEX feature; simple ones go in overview.md as a setup-checklist section)
`NN` = contiguous order among feature files (01, 02, 03…), in the order they appear in the build sequence (e.g. `feature-01-ci-tooling.md`). No gaps — checklist items are not numbered files.

# Purpose

# User Value

# Dependencies

# Target Files
Explicit paths the agent creates/edits (e.g. `includes/Settings/SettingsRepository.php`, `templates/...`, `assets/js/...`). Keeps the agent from inventing structure.

# Public Interface
The key class/method signatures and hook names this feature exposes for other features/Pro to depend on. Names + intent, not full bodies.

# Related Services

# Related Shared Logic

# Build Order

# Tasks
Small, isolated, implementation-oriented.

# Tests
Unit tests for THIS feature only. Match the framework chosen in architecture.md (PHPUnit/Pest/Vitest/Detox/etc.).
List each test as a one-liner: what it verifies, not how. Cross-feature flows go in epic-spec's Integration Test Scenarios, not here.
Skip this section if architecture.md defines no testing strategy.

# Acceptance Criteria

# Definition Of Done
- validation completed
- follows architecture
- follows naming conventions
- edge cases handled
- tests pass (per architecture's testing strategy)
- no obvious warnings/errors

# Notes For AI Coding
