# Stitch design exports

Drop the Google **Stitch** exports for each screen here, then tell Claude they're in. Claude reads the
images and writes a coder-ready `../home-design.md` / `../settings-design.md` / `../qibla-design.md`
(elements, px positions for the 390px Bip 6 screen, hex colors, font sizes, states) for the AI coder to
implement in Zepp `hmUI`.

## Files per screen
- `<screen>.html` — **preferred.** Stitch's "View Code" HTML/CSS export — carries the exact hex colors,
  font sizes, and spacing, which is what Claude needs to write an accurate `hmUI` spec. Paste the code
  straight in; no markdown wrapper needed.
- `<screen>.png` — optional sanity-check screenshot (Stitch code can render slightly differently from the preview).
- `<screen>-<state>.png` — optional, for state variants the single code export can't show (settings picker open, etc.).

Note: **qibla** has two states (calibrate + active compass) — its `screen.png`/`code.html` export already
contains both, as a matched pair per variation. No separate state files needed.

At least one of `.html` or `.png` per screen; `.html` is the higher-signal one.

## Expected names
- `home.png` (+ `home.html`)
- `settings.png`, `settings-method-open.png` (+ `settings.html`)
- `qibla.png`, `qibla-aligned.png`, `qibla-calibrate.png` (+ `qibla.html`)

## Notes
- Stitch designs phone-sized; that's fine — design the **content/layout**, Claude adapts it to the round
  390×390 safe area (keep key content away from the corners).
- The HTML is a **reference only** — Zepp OS does not run HTML/React. The real UI is `@zos/ui` widgets.
