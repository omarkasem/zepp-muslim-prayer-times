You are designing the HOME screen for a SMARTWATCH app (not a phone). The watch is an Amazfit Bip 6: a 390 x 390 pixel ROUND AMOLED display. Everything must fit inside a circular safe area — keep important content away from the corners, which are clipped by the round bezel.

The app shows Muslim prayer times. Generate self-contained React (one file, mock data, inline styles or Tailwind, no external libraries, no API calls, no data fetching — mock everything). Render each design inside a 390x390 circular frame with a pure black (OLED) background so it looks like the real watch.

Give me 4 DISTINCT design VARIATIONS of the home screen, clearly labeled Variation A–D, each in its own circular 390x390 frame placed side by side so I can compare them. Make them genuinely different layouts, for example:
- Variation A: a clean vertical LIST of the 5 prayers with their times.
- Variation B: a compact TABLE / grid of the 5 prayers.
- Variation C: a HERO layout — large "next prayer + countdown" on top, smaller list of the rest below.
- Variation D: a RADIAL / ring layout arranged around the round display.

Every variation must clearly show ALL of this content:
- The 5 daily prayers with times: Fajr 4:12, Dhuhr 12:01, Asr 3:34, Maghrib 6:48, Isha 8:10.
- The NEXT upcoming prayer visually highlighted, with a countdown (e.g. "Asr in 1h 23m").
- The current city with a small location pin (e.g. "Cairo").
- The Hijri date (e.g. "12 Dhul-Hijjah 1447").
- Two small affordances to reach other screens: a Settings gear and a Qibla compass icon.

Design constraints for a watch:
- Dark theme, OLED black background, high contrast, LARGE legible type — this is read at a glance.
- Minimal chrome. No phone-style top app bars or bottom tab bars — this is a tiny round screen.
- One calm, respectful color accent (greens / teal / gold suit this audience). Pick a single accent.
- If content needs to scroll, show it scrolling naturally within the round frame.

Under each variation add one short line describing its tradeoff (readability vs density vs glanceability). Do not write any backend or data logic — mock everything.
