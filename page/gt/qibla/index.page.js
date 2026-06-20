import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { back } from "@zos/router";
import { setScrollMode, SCROLL_MODE_FREE } from "@zos/page";
import { COLORS, FONT_SIZES } from "../../../lib/theme";
import { createQiblaController, bearingToCardinal, normalize360 } from "../../../lib/controllers/qibla-controller";
import { isRTL, t } from "../../../lib/i18n";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();
const STATUS_BAR_RESERVE = 40;
const SIDE_MARGIN = 32;
const CENTER_X = DEVICE_WIDTH / 2;
const COMPASS_CENTER_Y = DEVICE_HEIGHT / 2 - 10;
const DIAL_SIZE = 240;
const CENTER_ARROW_SIZE = 120;
const KAABA_SIZE = 56;
const CARDINAL_R = 100;

Page(
  BasePage({
    onInit() {
      try { setScrollMode({ mode: SCROLL_MODE_FREE }); } catch (e) {}
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      
      const self = this;
      this.ctrl = createQiblaController(
        () => {
          self.destroyWidgets();
          self.build();
        },
        (figure8T) => self.updateAnim(figure8T),
        (heading, rel) => self.updateHeading(heading, rel)
      );
      this.ctrl.onInit();
    },

    onResume() {
      if (this.ctrl) this.ctrl.onResume();
    },

    onPause() {
      if (this.ctrl) this.ctrl.onPause();
    },

    onDestroy() {
      if (this.ctrl) this.ctrl.onDestroy();
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

    build() {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        color: COLORS.BACKGROUND,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: isRTL() ? px(DEVICE_WIDTH - SIDE_MARGIN - 40) : px(SIDE_MARGIN),
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

      const phase = this.ctrl.state.phase;
      if (phase === "calibrate") {
        this.renderCalibrate();
      } else if (phase === "active") {
        this.renderActive();
      } else if (phase === "noLocation") {
        this.renderNoLocation();
      }
    },

    renderNoLocation() {
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(COMPASS_CENTER_Y - 30),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(60),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: t("location_required"),
      }));
    },

    renderCalibrate() {
      const cx = CENTER_X;
      const cy = COMPASS_CENTER_Y - 40;
      const ampX = 110;
      const ampY = 50;
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
        y: px(cy + 130),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(36),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.HEADLINE_MD),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: t("calibrating"),
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(cy + 170),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(24),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: t("figure_8_hint"),
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
        line_width: px(3),
        color: COLORS.QIBLA_DIAL,
      }));

      const cardinals = [
        { label: t("cardinal_n"), bearing: 0 },
        { label: t("cardinal_e"), bearing: 90 },
        { label: t("cardinal_s"), bearing: 180 },
        { label: t("cardinal_w"), bearing: 270 },
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

      this._kaabaWidget = this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CENTER_X - KAABA_SIZE / 2),
        y: px(COMPASS_CENTER_Y - DIAL_SIZE / 2 - KAABA_SIZE / 2 + 6),
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

      const qBearing = this.ctrl.state.qiblaBearing;
      const bearingText = (qBearing != null) ? Math.round(qBearing) + "°" : "—";
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

      const cardinalStr = (qBearing != null) ? bearingToCardinal(qBearing) + " • " + t("mecca") : "—";
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
        text: cardinalStr,
      }));

      this._headingDebug = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(COMPASS_CENTER_Y + DIAL_SIZE / 2 + 98),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(22),
        color: COLORS.TEXT_INACTIVE,
        text_size: px(FONT_SIZES.SMALL),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: t("heading") + " —",
      }));
    },

    updateAnim(figure8T) {
      if (this._glyphWidget) {
        const cx = CENTER_X;
        const cy = COMPASS_CENTER_Y - 40;
        const dx = 110 * Math.sin(figure8T);
        const dy = 50 * Math.sin(2 * figure8T);
        try {
          this._glyphWidget.setProperty(hmUI.prop.MORE, {
            x: px(cx + dx - 30),
            y: px(cy + dy - 30),
          });
        } catch (e) {}
      }
    },

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

    updateHeading(heading, rel) {
      const state = this.ctrl.state;
      if (this._headingDebug) {
        try {
          this._headingDebug.setProperty(hmUI.prop.MORE, {
            text: state.headingValid ? (t("heading") + " " + Math.round(state.headingAngle) + "°") : (t("heading") + " —"),
          });
        } catch (e) {}
      }
      if (heading != null && rel != null) {
        if (this._arrowWidget) {
          try {
            this._arrowWidget.setProperty(hmUI.prop.MORE, { angle: rel });
          } catch (e) {}
        }
        this.positionCardinals(heading);
        if (this._dialWidget) {
          try {
            this._dialWidget.setProperty(hmUI.prop.MORE, {
              color: state.aligned ? COLORS.ACCENT : COLORS.QIBLA_DIAL,
            });
          } catch (e) {}
        }
      }
    }
  })
);
