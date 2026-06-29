import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { setPageBrightTime } from "@zos/display";
import { toHijri } from "../../../shared/hijri";
import { getSettings } from "../../../shared/storage";
import { COLORS, FONT_SIZES } from "../../../lib/theme";
import { createHomeController, PRAYERS, formatTime, prayerLabel } from "../../../lib/controllers/home-controller";
import { isRTL, hijriMonth, t } from "../../../lib/i18n";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

// Bip 6 is 390x450 rectangular and designWidth:390, so px() is 1:1. We still
// wrap coords in px() for portability, and lay out against DEVICE_WIDTH/HEIGHT.
const SIDE_MARGIN = 16;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;

// Header (status bar is hidden in onInit).
const CITY_Y = 28;
const CITY_H = 28;
const HIJRI_Y = CITY_Y + CITY_H + 6;
const HIJRI_H = 22;

// Bottom nav.
const NAV_H = 56;
const NAV_Y = DEVICE_HEIGHT - NAV_H - 14;

// Prayer list region: leave a comfortable gap below the header and above the
// nav so the active pill never collides with either.
const LIST_TOP = 124;
const LIST_BOTTOM = NAV_Y - 30;
const LIST_HEIGHT = LIST_BOTTOM - LIST_TOP;
const ROW_HEIGHT_INACTIVE = 40;
const PILL_HEIGHT = 56;
const PILL_RADIUS = 28;
const ROW_INDENT = 22;

function estTextW(str, size) {
  return Math.ceil((str ? str.length : 0) * size * 0.56);
}

Page(
  BasePage({
    onInit() {
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      // Keep the screen lit ~30s so the app isn't dismissed by the system
      // screen-off timer while the user is reading prayer times.
      try { setPageBrightTime({ brightTime: 30000 }); } catch (e) {}

      const self = this;
      this.ctrl = createHomeController(
        (req) => self.request(req),
        () => {
          self.destroyWidgets();
          self.build();
        },
        () => {
          self.updateCountdown();
        }
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
      this._countdownId = -1;
      if (!this._widgetIds) {
        this._widgetIds = [];
        return;
      }
      for (let i = 0; i < this._widgetIds.length; i++) {
        try { hmUI.deleteWidget(this._widgetIds[i]); } catch (e) {}
      }
      this._widgetIds = [];
    },

    build() {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        color: COLORS.BACKGROUND,
      }));

      const state = this.ctrl.state;
      const phase = state.phase;

      if (phase === "loading" || phase === "unavailable") {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(SIDE_MARGIN),
          y: px(180),
          w: px(CONTENT_W),
          h: px(60),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.BODY_LG),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.WRAP,
          text: phase === "loading" ? t("calibrating") : t("location_required"),
        }));
        if (phase === "unavailable") {
          // Tap the message to retry the location fetch.
          this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
            x: px(SIDE_MARGIN),
            y: px(170),
            w: px(CONTENT_W),
            h: px(80),
            normal_src: "image/ic_transparent.png",
            press_src: "image/ic_transparent.png",
            click_func: () => {
              if (this.ctrl) this.ctrl.refreshLocation();
            },
          }));
        }
        this.renderBottomNav();
        return;
      }

      this.renderHeader(state);
      this.renderList(state);
      this.renderBottomNav();
    },

    renderHeader(state) {
      const loc = state.location;
      const city = (loc && loc.city) ? loc.city : "—";
      const today = new Date();
      const hijri = toHijri(today, getSettings().hijriOffsetDays);
      const hijriMonthStr = hijriMonth(hijri.month - 1);
      const hijriText = isRTL()
        ? (hijri.year + " " + hijriMonthStr + " " + hijri.day)
        : (hijri.day + " " + hijriMonthStr + " " + hijri.year).toUpperCase();

      const iconSize = 24;
      const gap = 8;
      const textW = Math.min(estTextW(city, FONT_SIZES.LABEL_SM), CONTENT_W - iconSize - gap);
      const groupW = iconSize + gap + textW;
      const groupX = Math.round((DEVICE_WIDTH - groupW) / 2);

      const rtl = isRTL();
      const iconX = rtl ? groupX + textW + gap : groupX;
      const textX = rtl ? groupX : groupX + iconSize + gap;

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(iconX),
        y: px(CITY_Y + (CITY_H - iconSize) / 2),
        w: px(iconSize),
        h: px(iconSize),
        src: "image/ic_pin.png",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(textX),
        y: px(CITY_Y),
        w: px(textW),
        h: px(CITY_H),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: rtl ? hmUI.align.RIGHT : hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: city,
      }));

      // Tap the city/header to re-fetch the location.
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(SIDE_MARGIN),
        y: px(CITY_Y - 6),
        w: px(CONTENT_W),
        h: px(CITY_H + 12),
        normal_src: "image/ic_transparent.png",
        press_src: "image/ic_transparent.png",
        click_func: () => {
          if (this.ctrl) this.ctrl.refreshLocation();
        },
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(HIJRI_Y),
        w: px(CONTENT_W),
        h: px(HIJRI_H),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.SMALL),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        char_space: 1,
        text: hijriText,
      }));
    },

    renderList(state) {
      const times = state.times;
      const tf = state.timeFormat;
      const step = LIST_HEIGHT / (PRAYERS.length - 1);
      this._countdownId = -1;

      const rtl = isRTL();

      for (let i = 0; i < PRAYERS.length; i++) {
        const y = Math.round(LIST_TOP + i * step);
        const prayer = PRAYERS[i];
        const isActive = (i === state.currentIndex);
        const timeStr = formatTime(times[prayer.key], tf);
        const label = prayerLabel(prayer, new Date());

        const labelX = rtl ? px(DEVICE_WIDTH - SIDE_MARGIN - ROW_INDENT - 180) : px(SIDE_MARGIN + ROW_INDENT);
        const timeX = rtl ? px(SIDE_MARGIN + ROW_INDENT) : px(DEVICE_WIDTH - SIDE_MARGIN - ROW_INDENT - 160);
        const labelAlign = rtl ? hmUI.align.RIGHT : hmUI.align.LEFT;
        const timeAlign = rtl ? hmUI.align.LEFT : hmUI.align.RIGHT;

        if (isActive) {
          this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: px(SIDE_MARGIN),
            y: px(y - PILL_HEIGHT / 2),
            w: px(CONTENT_W),
            h: px(PILL_HEIGHT),
            radius: px(PILL_RADIUS),
            color: COLORS.NEXT_PRAYER_PILL,
          }));
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: labelX,
            y: px(y - 18),
            w: px(180),
            h: px(22),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.LABEL_SM),
            align_h: labelAlign,
            align_v: hmUI.align.CENTER_V,
            text: label,
          }));
          this._countdownId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: labelX,
            y: px(y + 6),
            w: px(180),
            h: px(18),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.SMALL),
            align_h: labelAlign,
            align_v: hmUI.align.CENTER_V,
            text: state.countdownText,
          }));
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: timeX,
            y: px(y - PILL_HEIGHT / 2),
            w: px(160),
            h: px(PILL_HEIGHT),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.HEADLINE_MD),
            align_h: timeAlign,
            align_v: hmUI.align.CENTER_V,
            text: timeStr,
          }));
        } else {
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: labelX,
            y: px(y - ROW_HEIGHT_INACTIVE / 2),
            w: px(180),
            h: px(ROW_HEIGHT_INACTIVE),
            color: COLORS.TEXT_INACTIVE,
            text_size: px(FONT_SIZES.BODY_LG),
            align_h: labelAlign,
            align_v: hmUI.align.CENTER_V,
            text: label,
          }));
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: timeX,
            y: px(y - ROW_HEIGHT_INACTIVE / 2),
            w: px(160),
            h: px(ROW_HEIGHT_INACTIVE),
            color: COLORS.TEXT_INACTIVE,
            text_size: px(FONT_SIZES.BODY_LG),
            align_h: timeAlign,
            align_v: hmUI.align.CENTER_V,
            text: timeStr,
          }));
        }
      }
    },

    updateCountdown() {
      if (this._countdownId && this._countdownId !== -1 && this.ctrl) {
        hmUI.updateWidget(this._countdownId, hmUI.widget.TEXT, {
          text: this.ctrl.state.countdownText,
        });
      }
    },

    renderBottomNav() {
      const gap = 14;
      const btnW = Math.floor((CONTENT_W - gap) / 2);
      const rtl = isRTL();
      const qiblaStartX = rtl ? SIDE_MARGIN + btnW + gap : SIDE_MARGIN;
      const settingsStartX = rtl ? SIDE_MARGIN : SIDE_MARGIN + btnW + gap;
      const iconSize = 20;

      this.renderNavButton(
        qiblaStartX, btnW, iconSize,
        "image/ic_compass.png", COLORS.ACCENT_DEEP,
        t("qibla"), COLORS.ACCENT,
        () => push({ url: "page/bip6/qibla/index.page", params: {} })
      );

      this.renderNavButton(
        settingsStartX, btnW, iconSize,
        "image/ic_gear.png", COLORS.TEXT_MUTED,
        t("settings"), COLORS.TEXT_PRIMARY,
        () => push({ url: "page/bip6/settings/index.page", params: {} })
      );
    },

    renderNavButton(x, w, iconSize, iconSrc, iconColor, label, labelColor, onTap) {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(x),
        y: px(NAV_Y),
        w: px(w),
        h: px(NAV_H),
        radius: px(NAV_H / 2),
        color: COLORS.CARD,
      }));

      const estLabelW = estTextW(label, FONT_SIZES.LABEL_SM);
      const innerGap = 8;
      let groupW = iconSize + innerGap + estLabelW;
      if (groupW > w) groupW = w;
      
      const groupX = x + Math.floor((w - groupW) / 2);
      const rtl = isRTL();
      const iconX = rtl ? groupX + estLabelW + innerGap : groupX;
      const textX = rtl ? groupX : groupX + iconSize + innerGap;
      const maxTextW = rtl ? groupW - iconSize - innerGap : x + w - textX;

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(iconX),
        y: px(NAV_Y + (NAV_H - iconSize) / 2),
        w: px(iconSize),
        h: px(iconSize),
        src: iconSrc,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(textX),
        y: px(NAV_Y),
        w: px(maxTextW),
        h: px(NAV_H),
        color: labelColor,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: rtl ? hmUI.align.RIGHT : hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: label,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(x),
        y: px(NAV_Y),
        w: px(w),
        h: px(NAV_H),
        normal_src: "image/ic_transparent.png",
        press_src: "image/ic_transparent.png",
        color: 0x000000,
        click_func: onTap,
      }));
    },
  })
);
