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

import { getDeviceInfo } from '@zos/device';

const { width } = getDeviceInfo();
const scale = width >= 450 ? 480 / 390 : 1;

// Bip 6 is 390x450 rectangular. Sizes below are px on that device; px() = 1:1
// (designWidth: 390). These are tuned for a glanceable rectangular screen.
// We scale them up for GT (480px) to maintain readability.
export const FONT_SIZES = {
  XSMALL: Math.round(18 * scale),
  SMALL: Math.round(18 * scale),
  LABEL_SM: Math.round(22 * scale),
  BODY_LG: Math.round(28 * scale),
  HEADLINE_MD: Math.round(36 * scale),
  HEADLINE: Math.round(32 * scale),
  DISPLAY_TIME: Math.round(48 * scale),
};
