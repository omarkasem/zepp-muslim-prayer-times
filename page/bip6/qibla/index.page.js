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
const COMPASS_CENTER_Y = 208;
const DIAL_SIZE = 220;
const CENTER_ARROW_SIZE = 110;     // rotating Qibla arrow (matches PNG size)
const KAABA_SIZE = 52;             // fixed Kaaba target (matches PNG size)
const CARDINAL_R = 90;             // radius for N/E/S/W letters on the dial

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
        normal_src: "image/ic_back.png",
        press_src: "image/ic_back.png",
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
        src: "image/ic_watch.png",
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
      // Faint compass dial ring. Turns accent green when aligned. (Recoloring an
      // ARC/FILL_RECT works on this firmware; tinting an IMG via `color` does NOT
      // — it hides the image — so the arrow/Kaaba use their native PNG colors.)
      this._dialWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.ARC, {
        x: px(CENTER_X - DIAL_SIZE / 2),
        y: px(COMPASS_CENTER_Y - DIAL_SIZE / 2),
        w: px(DIAL_SIZE),
        h: px(DIAL_SIZE),
        start_angle: 0,
        end_angle: 360,
        line_width: px(3),
        color: COLORS.QIBLA_DIAL,
      }));

      // Cardinal letters on the dial. They rotate with the compass so N always
      // points to true north (positions updated on each heading change).
      const cardinals = [
        { label: "N", bearing: 0 },
        { label: "E", bearing: 90 },
        { label: "S", bearing: 180 },
        { label: "W", bearing: 270 },
      ];
      this._cardinalWidgets = [];
      for (let i = 0; i < cardinals.length; i++) {
        const w = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(CENTER_X - 14),
          y: px(COMPASS_CENTER_Y - CARDINAL_R - 14),
          w: px(28),
          h: px(28),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.LABEL_SM),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: cardinals[i].label,
        }));
        this._cardinalWidgets.push({ w: w, bearing: cardinals[i].bearing });
      }

      // Fixed Kaaba target at the top of the dial. Turn the watch until the
      // arrow points up at the Kaaba — then you are facing the Qibla.
      this._kaabaWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CENTER_X - KAABA_SIZE / 2),
        y: px(COMPASS_CENTER_Y - DIAL_SIZE / 2 - KAABA_SIZE / 2 + 6),
        w: px(KAABA_SIZE),
        h: px(KAABA_SIZE),
        src: "image/ic_kaaba.png",
      }));

      // Big arrow in the centre = the live Qibla pointer. Rotated to `rel` on
      // every heading update (pivot = its own centre). Widget size matches the
      // PNG so it isn't clipped.
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
        x: px(SIDE_MARGIN),
        y: px(COMPASS_CENTER_Y + DIAL_SIZE / 2 + 16),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
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
        x: px(SIDE_MARGIN),
        y: px(COMPASS_CENTER_Y + DIAL_SIZE / 2 + 70),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(24),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        char_space: 1,
        text: cardinal,
      }));

      // Temporary diagnostic: shows the live compass heading (or "—" when the
      // sensor returns INVALID / uncalibrated). Remove once movement is verified.
      this._headingDebug = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(COMPASS_CENTER_Y + DIAL_SIZE / 2 + 98),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(22),
        color: COLORS.TEXT_INACTIVE,
        text_size: px(FONT_SIZES.SMALL),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "heading —",
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
      const onChange = function () { self.handleReading(); };
      this._onChange = onChange;
      try { compass.onChange(onChange); } catch (e) {}
      try { compass.start(); } catch (e) {}
      // Poll the heading directly too: onChange is not guaranteed to fire on
      // every firmware, and getStatus() may never report "calibrated" even when
      // getDirectionAngle() returns usable values. Polling makes the marker
      // track regardless.
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

    // Single entry point for every heading sample (from onChange or the poll).
    handleReading() {
      if (!this._compass) return;
      let angle;
      try { angle = this._compass.getDirectionAngle(); } catch (e) { angle = "INVALID"; }
      const valid = !(typeof angle === "string" || isNaN(angle));

      // Temporary diagnostic readout (remove once confirmed working).
      if (this._headingDebug) {
        try {
          this._headingDebug.setProperty(hmUI.prop.MORE, {
            text: valid ? ("heading " + Math.round(angle) + "°") : "heading —",
          });
        } catch (e) {}
      }

      if (this.state.phase === "calibrate") {
        // Leave the calibrate screen as soon as we get a real heading.
        if (valid) this.transitionToActive();
        return;
      }
      if (this.state.phase === "active") {
        this.applyHeading(angle, valid);
      }
    },

    // Place each cardinal letter on the dial at (bearing − heading) from the
    // top, so the rose rotates and N points to true north.
    positionCardinals(heading) {
      if (!this._cardinalWidgets) return;
      for (let i = 0; i < this._cardinalWidgets.length; i++) {
        const c = this._cardinalWidgets[i];
        const a = (normalize360(c.bearing - heading) * Math.PI) / 180;
        const x = CENTER_X + CARDINAL_R * Math.sin(a) - 14;
        const y = COMPASS_CENTER_Y - CARDINAL_R * Math.cos(a) - 14;
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

      // Rotate the arrow to point at the Qibla relative to where the watch is
      // pointing. rel === 0 ⇒ straight up (at the Kaaba target) ⇒ aligned.
      if (this._arrowWidget) {
        try {
          this._arrowWidget.setProperty(hmUI.prop.MORE, { angle: rel });
        } catch (e) {}
      }
      // Rotate the cardinal letters so N tracks true north.
      this.positionCardinals(heading);
      // Aligned cue: light up the dial ring (IMG tint doesn't work, but
      // recoloring an ARC does).
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
        this._headingDebug = null;
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
        this._headingDebug = null;
    },
  })
);
