import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { back } from "@zos/router";
import { Compass, Vibrator, VIBRATOR_SCENE_DURATION } from "@zos/sensor";
import { setScrollMode, SCROLL_MODE_FREE } from "@zos/page";
import { getLocation } from "../../../shared/storage";
import { qiblaBearing } from "../../../shared/qibla";
import { COLORS, FONT_SIZES } from "../../../lib/theme";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();
const DESIGN_WIDTH = 390;
const STATUS_BAR_RESERVE = 40;
const SIDE_MARGIN = 16;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;
const CENTER_X = DEVICE_WIDTH / 2;
const COMPASS_CENTER_Y = 230;
const DIAL_SIZE = 220;
const ARROW_SIZE = 150;

const ALIGN_THRESHOLD_DEG = 6;
const CALIBRATE_FALLBACK_MS = 5000;
const FIGURE8_INTERVAL_MS = 50;

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function bearingToCardinal(deg) {
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 45) % 8;
  return CARDINALS[idx];
}

function normalize360(deg) {
  return ((deg % 360) + 360) % 360;
}

function minimalAngleFromZero(deg) {
  const n = normalize360(deg);
  return n > 180 ? 360 - n : n;
}

Page(
  BasePage({
    state: {
      location: null,
      qiblaBearing: null,
      phase: "calibrate",
      aligned: false,
      lastVibrateAt: 0,
    },

    onInit() {
      try { setScrollMode({ mode: SCROLL_MODE_FREE }); } catch (e) {}
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      const loc = getLocation();
      this.state.location = loc;
      if (loc) {
        try {
          this.state.qiblaBearing = qiblaBearing(loc);
        } catch (e) {
          this.state.qiblaBearing = null;
        }
      }
      this._compass = null;
      this._animTimer = null;
      this._fallbackTimer = null;
      this._figure8T = 0;
      if (!loc || this.state.qiblaBearing == null) {
        this.state.phase = "noLocation";
      } else {
        this.state.phase = "calibrate";
        this.startCalibrate();
      }
      // NOTE: verify on-device per review-fixes-steps-4-5.md Fix 4:
      //   - Compass (start/stop/onChange/getStatus/getDirectionAngle)
      //   - IMG rotation via setProperty(hmUI.prop.MORE, { angle, center_x, center_y })
      //   - setTimeout/setInterval global timers (the 5s fallback below is critical)
    },

    onResume() {
      if (this.state.phase === "calibrate") {
        this.startCalibrate();
      } else if (this.state.phase === "active") {
        this.startCompass();
      }
    },

    onPause() {
      this.stopCompass();
      this.stopAnim();
      this.stopFallback();
    },

    onDestroy() {
      this.stopCompass();
      this.stopAnim();
      this.stopFallback();
    },

    build() {
      this._widgetIds = [];

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        color: COLORS.BACKGROUND,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(SIDE_MARGIN),
        y: px(STATUS_BAR_RESERVE + 8),
        w: px(40),
        h: px(40),
        normal_src: "ic_back.png",
        press_src: "ic_back.png",
        color: COLORS.ACCENT,
        click_func: () => {
          try { back(); } catch (e) {}
        },
      }));

      if (this.state.phase === "calibrate") {
        this.renderCalibrate();
      } else if (this.state.phase === "active") {
        this.renderActive();
      } else if (this.state.phase === "noLocation") {
        this.renderNoLocation();
      }
    },

    renderNoLocation() {
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(STATUS_BAR_RESERVE + 80),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(60),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Location required for Qibla direction.",
      }));
    },

    renderCalibrate() {
      const cx = CENTER_X;
      const cy = COMPASS_CENTER_Y - 40;
      const ampX = 100;
      const ampY = 44;
      const dotCount = 28;
      for (let i = 0; i < dotCount; i++) {
        const t = (i / dotCount) * 2 * Math.PI;
        const dx = ampX * Math.sin(t);
        const dy = ampY * Math.sin(2 * t);
        this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: px(cx + dx - 3),
          y: px(cy + dy - 3),
          w: px(6),
          h: px(6),
          radius: px(3),
          color: COLORS.ACCENT_DEEP,
        }));
      }

      this._glyphWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(cx - 30),
        y: px(cy - 30),
        w: px(60),
        h: px(60),
        src: "ic_watch.png",
        color: COLORS.ACCENT,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(cy + 120),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(36),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.HEADLINE_MD),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Calibrating…",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(cy + 160),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(24),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Move your watch in a figure-8 motion",
      }));
    },

    renderActive() {
      const city = (this.state.location && this.state.location.city) ? this.state.location.city : "—";
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(STATUS_BAR_RESERVE + 8),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(36),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: city,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.ARC, {
        x: px(CENTER_X - DIAL_SIZE / 2),
        y: px(COMPASS_CENTER_Y - DIAL_SIZE / 2),
        w: px(DIAL_SIZE),
        h: px(DIAL_SIZE),
        start_angle: 0,
        end_angle: 360,
        line_width: px(3),
        color: COLORS.QIBLA_DIAL,
      }));

      this._kaabaWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CENTER_X - 30),
        y: px(COMPASS_CENTER_Y - 30),
        w: px(60),
        h: px(60),
        src: "ic_kaaba.png",
        color: COLORS.ACCENT,
        visible: false,
      }));

      const cardinals = [
        { text: "N", x: CENTER_X - 12, y: COMPASS_CENTER_Y - DIAL_SIZE / 2 - 22 },
        { text: "E", x: CENTER_X + DIAL_SIZE / 2 - 6, y: COMPASS_CENTER_Y - 14 },
        { text: "S", x: CENTER_X - 10, y: COMPASS_CENTER_Y + DIAL_SIZE / 2 - 6 },
        { text: "W", x: CENTER_X - DIAL_SIZE / 2 - 10, y: COMPASS_CENTER_Y - 14 },
      ];
      for (let i = 0; i < cardinals.length; i++) {
        const c = cardinals[i];
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(c.x),
          y: px(c.y),
          w: px(24),
          h: px(28),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.LABEL_SM),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: c.text,
        }));
      }

      this._arrowWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CENTER_X - ARROW_SIZE / 2),
        y: px(COMPASS_CENTER_Y - ARROW_SIZE / 2),
        w: px(ARROW_SIZE),
        h: px(ARROW_SIZE),
        src: "ic_qibla_arrow.png",
        color: COLORS.QIBLA_ARROW_SEARCHING,
        center_x: px(CENTER_X),
        center_y: px(COMPASS_CENTER_Y),
        angle: 0,
      }));

      const bearingText = (this.state.qiblaBearing != null)
        ? Math.round(this.state.qiblaBearing) + "°"
        : "—";
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(COMPASS_CENTER_Y + DIAL_SIZE / 2 + 12),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(56),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.DISPLAY_TIME),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: bearingText,
      }));

      const cardinal = (this.state.qiblaBearing != null)
        ? bearingToCardinal(this.state.qiblaBearing) + " • MECCA"
        : "—";
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(COMPASS_CENTER_Y + DIAL_SIZE / 2 + 72),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(24),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        char_space: 1,
        text: cardinal,
      }));
    },

    startCalibrate() {
      this._figure8T = 0;
      this.startAnim();
      this.startCompass();
      this.startFallback();
    },

    startAnim() {
      this.stopAnim();
      const self = this;
      this._animTimer = setInterval(function () {
        if (self.state.phase !== "calibrate") {
          self.stopAnim();
          return;
        }
        self._figure8T = (self._figure8T || 0) + 0.12;
        const t = self._figure8T;
        const cx = CENTER_X;
        const cy = COMPASS_CENTER_Y - 40;
        const dx = 100 * Math.sin(t);
        const dy = 44 * Math.sin(2 * t);
        if (self._glyphWidget) {
          try {
            self._glyphWidget.setProperty(hmUI.prop.MORE, {
              x: px(cx + dx - 30),
              y: px(cy + dy - 30),
            });
          } catch (e) {}
        }
      }, FIGURE8_INTERVAL_MS);
    },

    stopAnim() {
      if (this._animTimer) {
        clearInterval(this._animTimer);
        this._animTimer = null;
      }
    },

    startFallback() {
      this.stopFallback();
      const self = this;
      this._fallbackTimer = setTimeout(function () {
        if (self.state.phase === "calibrate") {
          self.transitionToActive();
        }
      }, CALIBRATE_FALLBACK_MS);
    },

    stopFallback() {
      if (this._fallbackTimer) {
        clearTimeout(this._fallbackTimer);
        this._fallbackTimer = null;
      }
    },

    startCompass() {
      this.stopCompass();
      const self = this;
      const compass = new Compass();
      this._compass = compass;
      const onChange = function () {
        let calibrated = false;
        try { calibrated = !!compass.getStatus(); } catch (e) {}
        if (self.state.phase === "calibrate" && calibrated) {
          self.transitionToActive();
          return;
        }
        if (self.state.phase === "active") {
          self.applyHeading(compass);
        }
      };
      this._onChange = onChange;
      compass.onChange(onChange);
      try { compass.start(); } catch (e) {}
    },

    stopCompass() {
      if (this._compass) {
        try { this._compass.stop(); } catch (e) {}
        try { if (this._onChange) this._compass.offChange(this._onChange); } catch (e) {}
        this._compass = null;
        this._onChange = null;
      }
    },

    applyHeading(compass) {
      const angle = compass.getDirectionAngle();
      if (typeof angle === "string" || isNaN(angle) || this.state.qiblaBearing == null) return;
      const heading = angle;
      const rel = normalize360(this.state.qiblaBearing - heading);
      const minA = minimalAngleFromZero(rel);
      const isAligned = minA <= ALIGN_THRESHOLD_DEG;
      const wasAligned = this.state.aligned;
      this.state.aligned = isAligned;

      if (this._arrowWidget) {
        try {
          this._arrowWidget.setProperty(hmUI.prop.MORE, {
            angle: rel,
            color: isAligned ? COLORS.ACCENT : COLORS.QIBLA_ARROW_SEARCHING,
          });
        } catch (e) {}
      }
      if (this._kaabaWidget) {
        try {
          this._kaabaWidget.setProperty(hmUI.prop.MORE, { visible: isAligned });
        } catch (e) {}
      }

      if (isAligned && !wasAligned) {
        this.maybeVibrate();
      }
    },

    maybeVibrate() {
      const now = Date.now();
      if (now - (this.state.lastVibrateAt || 0) < 2000) return;
      this.state.lastVibrateAt = now;
      // NOTE: setMode is needed on some firmwares for the buzz to actually fire.
      // Verify on-device per review-fixes-steps-4-5.md Fix 4 (Vibrator).
      try {
        const v = new Vibrator();
        try { v.setMode({ mode: VIBRATOR_SCENE_DURATION }); } catch (e) {}
        v.start();
      } catch (e) {}
    },

    transitionToActive() {
      this.stopAnim();
      this.stopFallback();
      this.state.phase = "active";
      this.state.aligned = false;
      this.destroyWidgets();
      this.build();
      if (this._compass) {
        this.applyHeading(this._compass);
      }
    },

    trackWidget(id) {
      if (!this._widgetIds) this._widgetIds = [];
      this._widgetIds.push(id);
      return id;
    },

    destroyWidgets() {
      if (!this._widgetIds) {
        this._widgetIds = [];
        this._glyphWidget = null;
        this._arrowWidget = null;
        this._kaabaWidget = null;
        return;
      }
      for (let i = 0; i < this._widgetIds.length; i++) {
        try { hmUI.deleteWidget(this._widgetIds[i]); } catch (e) {}
      }
      this._widgetIds = [];
      this._glyphWidget = null;
      this._arrowWidget = null;
      this._kaabaWidget = null;
    },
  })
);
