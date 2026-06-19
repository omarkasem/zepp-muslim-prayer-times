First read and apply all rules from `_shared/preamble.md`.

Inputs: `03-positioning/positioning.md`, `04-prd/product-requirements.md`, `05-ui-sketches/ui-sketches.md`
Output: `06-architecture/architecture.md`

Help me design the architecture for this SaaS / web app.

Discuss with me first:
- framework choice (Next.js, Remix, SvelteKit, Laravel, Rails)
- database & ORM
- auth strategy
- multi-tenancy model (single-tenant, shared DB, schema-per-tenant)
- deployment target
- complexity tolerance

Keep it system-level and structural. NO implementation code, NO algorithms, NO boilerplate.

When refinement is complete, generate the final file with this structure:

# System Overview

# Architecture Goals

# Technical Stack
- framework
- language
- database & ORM
- styling
- build & deploy
- testing (unit, integration, E2E)

# SaaS-Specific Concerns
- auth strategy (sessions, JWT, OAuth, magic links)
- multi-tenant model (only if multi-tenant)
- rate limiting
- billing & subscriptions (Stripe, Lemon Squeezy)
- email (transactional, marketing)
- background jobs
- analytics & product metrics
- monitoring & error tracking
- deployment complexity
- scalability bottlenecks (only the realistic ones)

# Folder Structure

# Core Modules

# Services

# Database Structure

# Data Flow

# API Structure

# Caching Strategy

# Security Considerations

# Extensibility Boundaries

# Future Scalability Notes

# Things We Intentionally Keep Simple
