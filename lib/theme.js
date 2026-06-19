export const COLORS = {
  BACKGROUND: 0x000000,
  ACCENT: 0x4edea3,
  ACCENT_DEEP: 0x10b981,
  QIBLA_ARROW_SEARCHING: 0xbbcabf,
  QIBLA_DIAL: 0x2a3530,
  TEXT_PRIMARY: 0xe2e2e2,
  TEXT_MUTED: 0xbbcabf,
  TEXT_INACTIVE: 0x707070,
  PICKER_OPTION_INACTIVE: 0x8f8f8f,
  NEXT_PRAYER_TEXT: 0xffb95f,
  // Pill fill for the next-prayer row. Bumped from the design's 0x33240a (which
  // was nearly invisible on the AMOLED black) to a clearly readable deep gold.
  NEXT_PRAYER_PILL: 0x4a3410,
  CARD: 0x1a1c1c,
  SEGMENT_SELECTED_TEXT: 0x003824,
};

// Bip 6 is 390x450 rectangular. Sizes below are px on that device; px() = 1:1
// (designWidth: 390). These are tuned for a glanceable rectangular screen.
export const FONT_SIZES = {
  XSMALL: 18,
  SMALL: 18,
  LABEL_SM: 22,
  BODY_LG: 28,
  HEADLINE_MD: 36,
  HEADLINE: 32,
  DISPLAY_TIME: 48,
};
