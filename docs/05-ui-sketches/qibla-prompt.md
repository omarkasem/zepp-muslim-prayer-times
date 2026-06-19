You are designing the QIBLA (compass) screen for a SMARTWATCH app (not a phone). The watch is an Amazfit Bip 6: a 390 x 390 pixel ROUND AMOLED display. Everything must fit inside a circular safe area — keep important content away from the corners, which are clipped by the round bezel.

The app shows Muslim prayer times. This screen points the user toward the Qibla (the direction of Mecca) using the watch compass. Generate self-contained React (one file, mock data, inline styles or Tailwind, no external libraries, no API calls). Render each design inside a 390x390 circular frame with a pure black (OLED) background so it looks like the real watch. The round display is perfect for a compass — use the whole circle.

Give me 3 DISTINCT design VARIATIONS of the qibla screen, clearly labeled Variation A–C, each in its own circular 390x390 frame placed side by side. Try different compass treatments, for example: a large arrow that rotates to point at the Qibla over a compass dial; a Kaaba icon marker on the rim of a rotating dial; a minimal arrow with a big "degrees to Qibla" readout.

Every variation must clearly show ALL of this:
- A prominent direction indicator (arrow / marker) pointing toward the Qibla.
- A compass dial with N / E / S / W markings.
- The Qibla bearing in degrees (e.g. "Qibla 136°").
- A clear "aligned" state — show what it looks like when the user is facing the Qibla exactly (e.g. the arrow turns the accent color / a checkmark / "Facing Qibla").
- The current city (e.g. "Cairo").
- Make at least one variation also show a "Calibrate your compass" state (figure-8 hint), since the magnetometer sometimes needs calibration.

Design constraints for a watch:
- Dark theme, OLED black background, high contrast, LARGE legible type — read at a glance, often outdoors.
- The compass should feel like it fills the round screen.
- No phone-style top app bars or bottom tab bars. A small "back" affordance at the top is fine.
- One calm color accent (greens / teal / gold). Use the accent for the Qibla direction and the aligned state.

Under each variation add one short line describing its tradeoff (clarity of direction vs information density vs ease of aligning). Do not write any backend or sensor logic — mock the heading and bearing.
