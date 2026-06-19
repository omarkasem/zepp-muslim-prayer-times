First read and apply all rules from `_shared/preamble.md`.

Inputs: `03-positioning/positioning.md`, `04-prd/product-requirements.md`, `05-ui-sketches/ui-sketches.md`
Output: `06-architecture/architecture.md`

Help me design the architecture for this WordPress plugin.

Discuss with me first:
- architecture philosophy (simple, modular, lightweight)
- complexity tolerance
- free vs pro architecture (if relevant)
- testing strategy
- extensibility boundaries

Keep it system-level and structural. NO implementation code, NO algorithms, NO boilerplate. Use advanced patterns only when they create clear value.

When refinement is complete, generate the final file with this structure:

# System Overview

# Architecture Goals

# Technical Stack
- PHP version target
- frontend (vanilla JS, React, jQuery, Alpine, etc.)
- admin UI approach (settings API, custom React app, Gutenberg sidebar)
- build tools (npm, Vite, webpack, none)
- testing (PHPUnit, Pest, Playwright, manual)
- coding standards (PHPCS, WPCS)

# WordPress-Specific Concerns
- WordPress.org guideline risks
- security: sanitization, escaping, capabilities, nonces
- database: custom tables vs options/post meta, migration strategy
- compatibility: WooCommerce / Elementor / Gutenberg / multisite (only if relevant)
- performance impact (autoloaded options, queries per page)
- update & maintenance approach
- free vs pro split (if applicable)

# Folder Structure

# Core Modules

# Services

# Database Structure

# Data Flow

# Hooks & Filters
Public extension points the plugin exposes for other devs.

# Caching Strategy

# Security Considerations

# Extensibility Boundaries

# Future Scalability Notes

# Things We Intentionally Keep Simple
