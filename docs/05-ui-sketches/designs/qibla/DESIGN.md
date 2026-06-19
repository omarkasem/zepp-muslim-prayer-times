---
name: Noor Circular
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#37393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#45dfa4'
  on-tertiary: '#003825'
  tertiary-container: '#00b982'
  on-tertiary-container: '#00422c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-time:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  safe-margin: 24px
  stack-gap: 8px
  edge-padding: 12px
  section-margin: 16px
---

## Brand & Style

The design system is engineered for the specific constraints of a circular smartwatch display, focusing on utility, spiritual calm, and glanceability. The target audience includes practitioners seeking a respectful and unobtrusive way to track daily prayers. 

The aesthetic is **High-Contrast Minimalism** specifically optimized for AMOLED screens. By utilizing a pure black foundation, the interface blends seamlessly with the hardware bezel, extending the perceived screen size and maximizing battery efficiency. The emotional response is one of clarity and focus, stripping away all non-essential decorative elements to prioritize the "Next Prayer" countdown and current time. The design respects the sacred nature of its content through disciplined alignment and a sophisticated, jewel-toned color palette.

## Colors

This color palette is designed for maximum legibility in outdoor and low-light conditions.

*   **OLED Black (#000000):** Used for all background surfaces to ensure perfect contrast and power efficiency.
*   **Deep Emerald (#10B981):** The primary color, representing growth and the Islamic tradition. Used for active states and primary icons.
*   **Prayer Gold (#F59E0B):** Reserved exclusively for the "Next Prayer" status and urgent alerts (e.g., Imsak). It provides a warm, high-visibility contrast against the emerald green.
*   **High-Contrast White (#FFFFFF):** Used for primary text and critical time data.
*   **Muted Slate (#94A3B8):** Used for inactive prayer times or secondary labels to maintain visual hierarchy.

## Typography

Typography is the core of this design system, prioritizing large, open-aperture characters that remain legible at arm's length. **Plus Jakarta Sans** is used for its modern, friendly, and highly legible geometric forms.

*   **Glanceability:** The current prayer time uses the `display-time` token, positioned at the vertical center of the screen.
*   **Arc-Text:** Labels following the curve of the watch face should use `label-sm` with uppercase transformation and increased letter spacing.
*   **Weight:** Bold weights are preferred over regular weights to ensure strokes do not disappear against the black background.

## Layout & Spacing

The layout utilizes a **Circular Safe Area** model. All critical information (Times, Prayer Names) must be contained within a 342px diameter circle (inner 90% of the 390px display) to prevent clipping.

*   **Vertical Centering:** The most important information (Next Prayer) occupies the center 30% of the screen height.
*   **Radial Symmetry:** Elements at the top and bottom of the display should be centered horizontally.
*   **The "Gap" Rhythm:** Use an 8px base unit for vertical stacking. 
*   **Progress Indicators:** A thin (4px) circular stroke tracking the progress of the current prayer window should sit 4px from the screen edge.

## Elevation & Depth

In a pure black AMOLED environment, traditional shadows are ineffective. Depth is instead conveyed through **Tonal Layering and Opacity**.

*   **Surface Tiers:** Use a dark grey (#1A1A1A) with 80% opacity for card-like containers to subtly lift them from the true black background.
*   **Glow Effects:** Critical alerts (Azan) may use a subtle Emerald or Gold outer glow (10px blur, 20% opacity) to simulate light emission.
*   **Focus:** Inactive elements are dimmed to 40-50% opacity rather than using a different color, keeping the focus on the active content.

## Shapes

The shape language is entirely **Pill-shaped or Circular**, mirroring the hardware form factor. 

*   **Buttons:** Must be full-width pills (following the screen curve) or perfect circles for icon-only actions.
*   **Containers:** List items and cards should have a minimum radius of 24px or be fully rounded to ensure they don't feel "sharp" against the circular bezel.
*   **Selection Indicators:** Use a small circular dot (8px) next to the active prayer name.

## Components

### Buttons
*   **Primary Action:** Pill-shaped, Emerald Green background, White text (`body-lg`).
*   **Secondary/Ghost:** Outlined with a 1.5px Emerald stroke, or pure text with a Gold highlight.

### Prayer List Items
*   A horizontal stack containing the Prayer Name (Left, `body-lg`), a thin separator, and the Time (Right, `headline-md`).
*   The "Current" prayer item should have a subtle #10B981 background at 15% opacity to highlight the row.

### Progress Ring
*   A 360-degree track at the very edge of the screen. The background track is 10% Emerald; the active progress is 100% Emerald or Gold if the next prayer is within 15 minutes.

### Complications
*   Small, circular indicators for Qibla direction or Hijri date, positioned at the 12, 3, 6, or 9 o'clock positions.

### Icons
*   Line-based, 2px stroke weight. Icons should be simplified versions of traditional Islamic motifs (Crescent, Mosque, Compass) to ensure they don't blur on the small display.