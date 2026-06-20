import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { exit } from "@zos/router";
import { setScrollMode, SCROLL_MODE_FREE } from "@zos/page";
import { setWakeUp } from "@zos/display";
import { COLORS, FONT_SIZES } from "../../../lib/theme";
import { createAlertController } from "../../../lib/controllers/alert-controller";
import { t } from "../../../lib/i18n";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

Page(
  BasePage({
    onInit(p) {
      try { setWakeUp(); } catch (e) {}
      try { setScrollMode({ mode: SCROLL_MODE_FREE }); } catch (e) {}
      try { hmUI.setStatusBarVisible(false); } catch (e) {}

      let prayer = "";
      if (typeof p === "string") {
        prayer = p;
      }

      this.ctrl = createAlertController(prayer, () => {
        try { exit(); } catch (e) {}
      });
      this.ctrl.onInit();
    },

    build() {
      const W = DEVICE_WIDTH;
      const H = DEVICE_HEIGHT;
      const state = this.ctrl.state;

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0, y: 0, w: W, h: H, color: COLORS.BACKGROUND,
      }));

      // App icon (app_icon.png is 112x112).
      const iconSize = 104;
      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px((W - iconSize) / 2),
        y: px(H / 2 - 150),
        w: px(iconSize),
        h: px(iconSize),
        src: "image/app_icon.png",
      }));

      const isPre = state.offsetMin > 0;
      const nameY = isPre ? H / 2 - 30 : H / 2 + 6;

      // "Time for" ABOVE the name when the reminder is at prayer time.
      if (!isPre) {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(32), y: px(H / 2 - 34), w: W - px(64), h: px(34),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.LABEL_SM),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: state.context,
        }));
      }

      // Prayer name — hero
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(32), y: px(nameY), w: W - px(64), h: px(72),
        color: COLORS.ACCENT,
        text_size: px(60),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: state.label,
      }));

      // "in 10 min" BELOW the name when the reminder is before the prayer.
      if (isPre) {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(32), y: px(nameY + 80), w: W - px(64), h: px(38),
          color: COLORS.NEXT_PRAYER_TEXT,
          text_size: px(FONT_SIZES.BODY_LG),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: state.context,
        }));
      }

      // Prayer time — large supporting value
      if (state.time) {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(32), y: px(isPre ? H / 2 + 86 : H / 2 + 84), w: W - px(64), h: px(60),
          color: COLORS.TEXT_PRIMARY,
          text_size: px(FONT_SIZES.DISPLAY_TIME),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: state.time,
        }));
      }

      // Dismiss button
      const btnW = 200;
      const btnH = 64;
      const btnX = (W - btnW) / 2;
      const btnY = H - 104;
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(btnX), y: px(btnY), w: px(btnW), h: px(btnH),
        radius: px(btnH / 2), color: COLORS.CARD,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(btnX), y: px(btnY), w: px(btnW), h: px(btnH),
        color: COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: t("dismiss"),
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(btnX), y: px(btnY), w: px(btnW), h: px(btnH),
        normal_src: "image/ic_transparent.png",
        press_src: "image/ic_transparent.png",
        click_func: () => { this.ctrl.dismiss(); },
      }));
    },

    onDestroy() {
      if (this.ctrl) this.ctrl.onDestroy();
      if (this._widgetIds) {
        for (let i = 0; i < this._widgetIds.length; i++) {
          try { hmUI.deleteWidget(this._widgetIds[i]); } catch (e) {}
        }
      }
    },

    trackWidget(id) {
      if (!this._widgetIds) this._widgetIds = [];
      this._widgetIds.push(id);
      return id;
    },
  })
);
