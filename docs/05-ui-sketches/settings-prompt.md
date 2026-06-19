You are designing the SETTINGS screen for a SMARTWATCH app (not a phone). The watch is an Amazfit Bip 6: a 390 x 390 pixel ROUND AMOLED display. Everything must fit inside a circular safe area — keep important content away from the corners, which are clipped by the round bezel.

The app shows Muslim prayer times. This Settings screen lets the user tune accuracy and reminders. Generate self-contained React (one file, mock data, inline styles or Tailwind, no external libraries, no API calls). Render each design inside a 390x390 circular frame with a pure black (OLED) background so it looks like the real watch.

Give me 3 DISTINCT design VARIATIONS of the settings screen, clearly labeled Variation A–C, each in its own circular 390x390 frame placed side by side. The screen is a short vertical list the user scrolls; show the scrolled list comfortably inside the round frame. Try different patterns, for example: a simple tappable list of rows that open pickers; inline selectable chips/segmented controls; large stacked cards.

Every variation must clearly show ALL of these settings:
- Calculation method — a picker with options like Umm al-Qura, Muslim World League, Egyptian, ISNA, Karachi (show one selected).
- Asr madhab — a two-option toggle: Standard (Shafi) / Hanafi.
- High-latitude rule — a picker: None, Middle of the Night, One-Seventh, Angle-Based.
- Reminder offset — how many minutes before each prayer to be reminded, e.g. 0 (exactly on time), 5, 10, 15 min. Make "0 = exactly on time" clear.

Design constraints for a watch:
- Dark theme, OLED black background, high contrast, LARGE legible tap targets — fingers on a tiny round screen.
- Each row needs a clear label and the current value at a glance.
- No phone-style top app bars or bottom tab bars. A small "back" affordance at the top is fine.
- One calm color accent (greens / teal / gold). Pick a single accent and use it for selected states.
- Show how a picker opens (e.g. the calculation-method list expanded) in at least one variation.

Under each variation add one short line describing its tradeoff (tap accuracy vs density vs number of steps). Do not write any backend or persistence logic — mock everything.
