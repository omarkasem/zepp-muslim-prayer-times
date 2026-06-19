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
const DESIGN_WIDTH = 480;
const STATUS_BAR_RESERVE = 48;
const SIDE_MARGIN = 32;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;
const CENTER_X = DEVICE_WIDTH / 2;
const COMPASS_CENTER_Y = 220;
const DIAL_SIZE = 300;
const CENTER_ARROW_SIZE = 135;     // rotating Qibla arrow (matches PNG size)
const KAABA_SIZE = 64;             // fixed Kaaba target (matches PNG size)
const CARDINAL_R = 110;            // radius for N/E/S/W letters on the dial

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
        normal_src: "image/ic_back.png",
        press_src: "image/ic_back.png",
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
      const ampX = 120;
      const ampY = 54;
      const dotCount = 28;
      for (let i = 0; i < dotCount; i++) {
        const t = (i / dotCount) * 2 * Math.PI;
        const dx = ampX * Math.sin(t);
        const dy = ampY * Math.sin(2 * t);
        this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: px(cx + dx - 4),
          y: px(cy + dy - 4),
          w: px(8),
          h: px(8),
          radius: px(4),
          color: COLORS.ACCENT_DEEP,
        }));
      }

      this._glyphWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(cx - 44),
        y: px(cy - 44),
        w: px(89),
        h: px(89),
        src: "image/ic_watch.png",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(cy + 140),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(40),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.HEADLINE_MD),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Calibrating…",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(cy + 190),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(30),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Move your watch in a figure-8 motion",
      }));
    },

    renderActive() {
      this._dialWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.ARC, {
        x: px(CENTER_X - DIAL_SIZE / 2),
        y: px(COMPASS_CENTER_Y - DIAL_SIZE / 2),
        w: px(DIAL_SIZE),
        h: px(DIAL_SIZE),
        start_angle: 0,
        end_angle: 360,
        line_width: px(4),
        color: COLORS.QIBLA_DIAL,
      }));

      const cardinals = [
        { label: "N", bearing: 0 },
        { label: "E", bearing: 90 },
        { label: "S", bearing: 180 },
        { label: "W", bearing: 270 },
      ];
      this._cardinalWidgets = [];
      for (let i = 0; i < cardinals.length; i++) {
        const w = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(CENTER_X - 16),
          y: px(COMPASS_CENTER_Y - CARDINAL_R - 16),
          w: px(32),
          h: px(32),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.LABEL_SM),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: cardinals[i].label,
        }));
        this._cardinalWidgets.push({ w: w, bearing: cardinals[i].bearing });
      }

      this._kaabaWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CENTER_X - KAABA_SIZE / 2),
        y: px(COMPASS_CENTER_Y - DIAL_SIZE / 2 - KAABA_SIZE / 2 + 8),
        w: px(KAABA_SIZE),
        h: px(KAABA_SIZE),
        src: "image/ic_kaaba.png",
      }));

      this._arrowWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CENTER_X - CENTER_ARROW_SIZE / 2),
        y: px(COMPASS_CENTER_Y - CENTER_ARROW_SIZE / 2),
        w: px(CENTER_ARROW_SIZE),
        h: px(CENTER_ARROW_SIZE),
        src: "image/ic_qibla_arrow.png",
        center_x: px(CENTER_ARROW_SIZE / 2),
        center_y: px(CENTER_ARROW_SIZE / 2),
        angle: 0,
      }));

      const bearingText = (this.state.qiblaBearing != null)
        ? Math.round(this.state.qiblaBearing) + "°"
        : "—";
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: px(COMPASS_CENTER_Y + DIAL_SIZE / 2 + 20),
        w: DEVICE_WIDTH,
        h: px(54),
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
        x: 0,
        y: px(COMPASS_CENTER_Y + DIAL_SIZE / 2 + 74),
        w: DEVICE_WIDTH,
        h: px(28),
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
        const dx = 120 * Math.sin(t);
        const dy = 54 * Math.sin(2 * t);
        if (self._glyphWidget) {
          try {
            self._glyphWidget.setProperty(hmUI.prop.MORE, {
              x: px(cx + dx - 44),
              y: px(cy + dy - 44),
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
      const onChange = function () { self.handleReading(); };
      this._onChange = onChange;
      try { compass.onChange(onChange); } catch (e) {}
      try { compass.start(); } catch (e) {}
      this.stopPoll();
      this._pollTimer = setInterval(function () { self.handleReading(); }, 150);
    },

    stopPoll() {
      if (this._pollTimer) {
        clearInterval(this._pollTimer);
        this._pollTimer = null;
      }
    },

    stopCompass() {
      this.stopPoll();
      if (this._compass) {
        try { this._compass.stop(); } catch (e) {}
        try { if (this._onChange) this._compass.offChange(this._onChange); } catch (e) {}
        this._compass = null;
        this._onChange = null;
      }
    },

    handleReading() {
      if (!this._compass) return;
      let angle;
      try { angle = this._compass.getDirectionAngle(); } catch (e) { angle = "INVALID"; }
      const valid = !(typeof angle === "string" || isNaN(angle));

      if (this.state.phase === "calibrate") {
        if (valid) this.transitionToActive();
        return;
      }
      if (this.state.phase === "active") {
        this.applyHeading(angle, valid);
      }
    },

    positionCardinals(heading) {
      if (!this._cardinalWidgets) return;
      for (let i = 0; i < this._cardinalWidgets.length; i++) {
        const c = this._cardinalWidgets[i];
        const a = (normalize360(c.bearing - heading) * Math.PI) / 180;
        const x = CENTER_X + CARDINAL_R * Math.sin(a) - 16;
        const y = COMPASS_CENTER_Y - CARDINAL_R * Math.cos(a) - 16;
        try { c.w.setProperty(hmUI.prop.MORE, { x: px(x), y: px(y) }); } catch (e) {}
      }
    },

    applyHeading(angle, valid) {
      if (!valid || this.state.qiblaBearing == null) return;
      const heading = angle;
      const rel = normalize360(this.state.qiblaBearing - heading);
      const minA = minimalAngleFromZero(rel);
      const isAligned = minA <= ALIGN_THRESHOLD_DEG;
      const wasAligned = this.state.aligned;
      this.state.aligned = isAligned;

      if (this._arrowWidget) {
        try {
          this._arrowWidget.setProperty(hmUI.prop.MORE, { angle: rel });
        } catch (e) {}
      }
      this.positionCardinals(heading);
      if (this._dialWidget) {
        try {
          this._dialWidget.setProperty(hmUI.prop.MORE, {
            color: isAligned ? COLORS.ACCENT : COLORS.QIBLA_DIAL,
          });
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
      this.handleReading();
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
        this._cardinalWidgets = null;
        this._dialWidget = null;
        return;
      }
      for (let i = 0; i < this._widgetIds.length; i++) {
        try { hmUI.deleteWidget(this._widgetIds[i]); } catch (e) {}
      }
      this._widgetIds = [];
      this._glyphWidget = null;
      this._arrowWidget = null;
      this._kaabaWidget = null;
      this._cardinalWidgets = null;
      this._dialWidget = null;
    },
  })
);
