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
const CENTER_X = 195;
const CENTER_Y = 195;

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
        x: px(24),
        y: px(36),
        w: px(20),
        h: px(20),
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
        x: px(20),
        y: px(160),
        w: DEVICE_WIDTH - px(40),
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
      const cy = 140;
      const ampX = 60;
      const ampY = 26;
      const dotCount = 24;
      for (let i = 0; i < dotCount; i++) {
        const t = (i / dotCount) * 2 * Math.PI;
        const dx = ampX * Math.sin(t);
        const dy = ampY * Math.sin(2 * t);
        this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: px(cx + dx - 1.5),
          y: px(cy + dy - 1.5),
          w: px(3),
          h: px(3),
          radius: px(1.5),
          color: COLORS.ACCENT_DEEP,
        }));
      }

      this._glyphWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(cx - 18),
        y: px(cy - 18),
        w: px(36),
        h: px(36),
        src: "ic_watch.png",
        color: COLORS.ACCENT,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(220),
        w: DEVICE_WIDTH - px(40),
        h: px(28),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.HEADLINE_MD),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Calibrating…",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(252),
        w: DEVICE_WIDTH - px(40),
        h: px(18),
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
        x: px(20),
        y: px(40),
        w: DEVICE_WIDTH - px(40),
        h: px(18),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: city,
      }));

      this._kaabaWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CENTER_X - 18),
        y: px(70),
        w: px(36),
        h: px(36),
        src: "ic_kaaba.png",
        color: COLORS.ACCENT,
        visible: false,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.ARC, {
        x: px(CENTER_X - 112),
        y: px(CENTER_Y - 112),
        w: px(224),
        h: px(224),
        start_angle: 0,
        end_angle: 360,
        line_width: px(2),
        color: COLORS.QIBLA_DIAL,
      }));

      const cardinals = [
        { text: "N", x: CENTER_X - 9, y: CENTER_Y - 112 - 14 },
        { text: "E", x: CENTER_X + 112 - 6, y: CENTER_Y - 10 },
        { text: "S", x: CENTER_X - 7, y: CENTER_Y + 112 - 6 },
        { text: "W", x: CENTER_X - 112 - 6, y: CENTER_Y - 10 },
      ];
      for (let i = 0; i < cardinals.length; i++) {
        const c = cardinals[i];
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(c.x),
          y: px(c.y),
          w: px(20),
          h: px(20),
          color: COLORS.TEXT_MUTED,
          text_size: px(18),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: c.text,
        }));
      }

      const arrowW = 140;
      const arrowH = 140;
      this._arrowWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CENTER_X - arrowW / 2),
        y: px(CENTER_Y - arrowH / 2),
        w: px(arrowW),
        h: px(arrowH),
        src: "ic_qibla_arrow.png",
        color: COLORS.QIBLA_ARROW_SEARCHING,
        center_x: px(CENTER_X),
        center_y: px(CENTER_Y),
        angle: 0,
      }));

      const bearingText = (this.state.qiblaBearing != null)
        ? Math.round(this.state.qiblaBearing) + "°"
        : "—";
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(298),
        w: DEVICE_WIDTH - px(40),
        h: px(48),
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
        x: px(20),
        y: px(346),
        w: DEVICE_WIDTH - px(40),
        h: px(18),
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
        const cy = 140;
        const dx = 60 * Math.sin(t);
        const dy = 26 * Math.sin(2 * t);
        if (self._glyphWidget) {
          try {
            self._glyphWidget.setProperty(hmUI.prop.MORE, {
              x: px(cx + dx - 18),
              y: px(cy + dy - 18),
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
