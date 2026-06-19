First read and apply all rules from `_shared/preamble.md`.

Inputs: `03-positioning/positioning.md`, `04-prd/product-requirements.md`, `06-architecture/architecture.md`
Output: `07-ai-coding/ai-context.md`

Help me create an AI coding context file for this project.

Discuss with me first:
- architecture philosophy in one sentence
- complexity tolerance
- stack decisions worth locking in
- naming conventions
- common mistakes AI coding tools make in this stack

This file will be pasted at the start of every AI coding conversation. Keep it short, high-signal, scan-friendly. Drop anything generic or obvious.

When refinement is complete, generate the final file with this structure:

# Architecture Philosophy
One paragraph.

# Complexity Rules
When to abstract, when to keep simple.

# Stack
Pinned tech decisions.

# Naming Conventions
Services, repositories, hooks, components, CSS classes — only the ones that matter here.

# Folder Structure Conventions

# AI Coding Rules
- avoid unnecessary abstractions
- avoid duplicated logic
- follow architecture strictly
- preserve naming consistency
- keep tasks isolated

# Common Mistakes To Avoid In This Project
Stack-specific gotchas.

# Definition Of Done
- validation exists
- no debug leftovers
- architecture respected
- edge cases handled
- naming consistency
- tests pass (per architecture's testing strategy; skip if none defined)

# Review Checklist
Short — maintainability, consistency, simplicity.

Target: 100–200 lines max. If a rule is obvious, drop it.
