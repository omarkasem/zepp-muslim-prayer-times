First read and apply all rules from `_shared/preamble.md`.

Inputs: `03-positioning/positioning.md`, `04-prd/product-requirements.md`, `05-ui-sketches/ui-sketches.md`
Output: `06-architecture/architecture.md`

Help me design the architecture for this mobile app.

Discuss with me first:
- native vs React Native vs Flutter vs Expo
- backend strategy (BaaS like Supabase/Firebase, custom API, none)
- state management approach
- offline behavior
- testing strategy
- complexity tolerance

Keep it system-level and structural. NO implementation code, NO algorithms, NO boilerplate.

When refinement is complete, generate the final file with this structure:

# System Overview

# Architecture Goals

# Technical Stack
- framework (native iOS/Android, React Native, Expo, Flutter)
- language
- state management
- navigation library
- styling approach
- backend / BaaS
- build & release pipeline
- testing (unit, E2E with Detox/Maestro, manual)

# Mobile-Specific Concerns
- App Store / Play Store policy risks
- permissions & privacy (camera, location, contacts — only what's needed)
- offline behavior & sync
- auth strategy
- account deletion (App Store requirement)
- push notifications (if relevant)
- subscriptions / IAP (if relevant)
- device testing strategy (which devices, OS versions)
- accessibility baseline
- crash & error analytics

# Folder Structure

# Core Modules

# Services

# Local Data / Storage Structure
SQLite, AsyncStorage, MMKV, Realm, etc.

# Remote Data / API Structure

# Data Flow

# Caching Strategy

# Security Considerations
Token storage, secure keychain, certificate pinning (only if justified).

# Extensibility Boundaries

# Future Scalability Notes

# Things We Intentionally Keep Simple
