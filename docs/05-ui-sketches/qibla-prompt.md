Design the QIBLA (compass) screen for a smartwatch app called Prayer Times (it shows Muslim prayer times). It runs on a small round Amazfit Bip 6 watch: a 390 x 390 pixel ROUND AMOLED display. Everything must fit inside a circular safe area — keep important content away from the corners, which are clipped by the round bezel. The round screen is perfect for a compass; use the whole circle.

This feature has TWO sequential states, and I need BOTH designed for every variation, as a matched pair:

STATE 1 — CALIBRATE (shown first): the magnetometer needs calibrating, so this screen tells the user to move the watch in a figure-8 / rotate-the-wrist motion. Show a clear instruction like "Calibrate compass" + "Rotate your wrist in a figure-8", with a motion-hint illustration that DEPICTS the movement (e.g. a figure-8 path with an arrow, or a rotating-watch glyph). Note: this is a still image that suggests motion — the real animation will be done later in code, so just make the motion visually obvious in a single frame.

STATE 2 — ACTIVE COMPASS (after calibration): a live compass. It must show: a compass dial with N / E / S / W markings; a prominent arrow / marker pointing toward the Qibla; the Qibla bearing in degrees (e.g. "Qibla 136°"); the current city (e.g. "Cairo"); and a clear ALIGNED state showing what it looks like when the user is facing the Qibla exactly (e.g. the arrow/dial turns the accent color, a checkmark, or "Facing Qibla"). You can show the aligned look as part of this screen or as a small extra frame.

Give me 3 DISTINCT design VARIATIONS. For EACH variation, show BOTH screens side by side as a pair, clearly labeled — e.g. "Variation A — Calibrate" and "Variation A — Compass", then "Variation B — Calibrate" / "Variation B — Compass", etc. Each screen in its own circular 390x390 frame on a pure black (OLED) background. Try different compass treatments across the variations — e.g. a large rotating arrow over a dial; a Kaaba icon marker on the rim of a rotating dial; a minimal arrow with a big degrees readout.

Design constraints for a watch:
- Dark theme, OLED black background, high contrast, LARGE legible type — read at a glance, often outdoors.
- One calm accent color (green / teal / gold suits this audience). Use the accent for the Qibla direction and the aligned state.
- No phone-style top app bars or bottom tab bars. A small "back" affordance at the top is fine.

Generate self-contained code (one file, mock data, inline styles or Tailwind, no external libraries, no API calls). Mock the heading and bearing. Under each variation add one short line on its tradeoff (clarity of direction vs information density vs ease of aligning).
