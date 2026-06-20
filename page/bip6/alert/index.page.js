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
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        color: COLORS.BACKGROUND,
      }));

      // Logo — w/h MUST equal the PNG pixel size (ic_kaaba.png is 52x52 here).
      const logoSize = 52;
      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px((DEVICE_WIDTH - logoSize) / 2),
        y: px(DEVICE_HEIGHT / 2 - 120),
        w: px(logoSize),
        h: px(logoSize),
        src: "image/ic_kaaba.png",
      }));

      // Label (Time for ...)
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(16),
        y: px(DEVICE_HEIGHT / 2),
        w: DEVICE_WIDTH - px(32),
        h: px(36),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.BODY_LG),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: t("time_for"),
      }));

      // Prayer Name
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(16),
        y: px(DEVICE_HEIGHT / 2 + 36),
        w: DEVICE_WIDTH - px(32),
        h: px(48),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.DISPLAY_TIME),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: this.ctrl.state.label,
      }));

      // Dismiss Button
      const btnW = 160;
      const btnH = 48;
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px((DEVICE_WIDTH - btnW) / 2),
        y: px(DEVICE_HEIGHT - 80),
        w: px(btnW),
        h: px(btnH),
        radius: px(btnH / 2),
        color: COLORS.CARD,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px((DEVICE_WIDTH - btnW) / 2),
        y: px(DEVICE_HEIGHT - 80),
        w: px(btnW),
        h: px(btnH),
        color: COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: t("dismiss"),
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px((DEVICE_WIDTH - btnW) / 2),
        y: px(DEVICE_HEIGHT - 80),
        w: px(btnW),
        h: px(btnH),
        normal_src: "image/ic_transparent.png",
        press_src: "image/ic_transparent.png",
        click_func: () => {
          this.ctrl.dismiss();
        },
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
