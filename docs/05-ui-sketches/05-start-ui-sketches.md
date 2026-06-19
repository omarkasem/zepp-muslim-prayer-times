First read and apply all rules from `_shared/preamble.md`.

Inputs: `04-prd/product-requirements.md`
Output: `05-ui-sketches/ui-sketches.md`

Help me define the UI for this product.

Based on the PRD's core features and user flows, identify every screen/view that V1 needs. For each, list the key elements (inputs, buttons, lists, displays) and where the user can go next.

Use ASCII wireframes or simple bullet layouts. No pixel design, no styling decisions yet.

Discuss with me first:
- which screens are truly V1 vs nice-to-have
- which screens can be combined
- navigation structure (tabs, drawer, single flow, admin menu)
- empty states and error states for the main screens
- the simplest version of each screen that still works

When refinement is complete, generate the final file with this structure:

# Platform
(mobile / WordPress admin / web)

# Navigation Structure
Top-level navigation model. Tabs / drawer / admin submenu / single-flow.

# Screen Inventory
Bullet list of every V1 screen with one-line purpose.

# Screens
For each screen:

## Screen Name
**Purpose:** one line
**Reached from:** which screens/actions
**Goes to:** which screens/actions
**Layout:**
```
ASCII wireframe — header, main elements, primary action
```
**Key elements:** bullet list
**Empty state:** what shows when there's no data
**Error states:** main ones to handle

# Cut From V1
Screens discussed but pushed to future.

# Notes For Architecture
Anything in the UI that meaningfully affects backend/data design (e.g., needs realtime updates, needs offline support, needs heavy media handling).
