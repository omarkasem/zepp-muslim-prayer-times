import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { back } from "@zos/router";
import { setScrollMode, SCROLL_MODE_FREE } from "@zos/page";
import { setPageBrightTime } from "@zos/display";
import { COLORS, FONT_SIZES } from "../../../lib/theme";
import { createSettingsPickerController } from "../../../lib/controllers/settings-picker-controller";
import { isRTL, t } from "../../../lib/i18n";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

const STATUS_BAR_RESERVE = 48;
const SIDE_MARGIN = 32;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;
const HEADER_Y = STATUS_BAR_RESERVE + 12;
const LIST_TOP = STATUS_BAR_RESERVE + 80;
const ROW_HEIGHT = 72;
const ROW_RADIUS = 24;
const ROW_GAP = 12;

Page(
  BasePage({
    onInit(p) {
      try { setScrollMode({ mode: SCROLL_MODE_FREE }); } catch (e) {}
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      // Keep the screen lit ~30s so the picker isn't dismissed mid-selection.
      try { setPageBrightTime({ brightTime: 30000 }); } catch (e) {}

      this.ctrl = createSettingsPickerController(() => {
        try { back(); } catch (e) {}
      });
      this.ctrl.onInit(p, this._options);
    },

    onResume() {
      if (this.ctrl) {
        this.ctrl.onResume();
        if (this._widgetIds) this.rebuild();
      }
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

      const config = this.ctrl.state.config;
      const title = config ? config.title : t("settings");
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(HEADER_Y + 4),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(36),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.HEADLINE),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: title,
      }));

      if (!config) {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(SIDE_MARGIN),
          y: px(LIST_TOP + 40),
          w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
          h: px(40),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.LABEL_SM),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: t("unknown_setting"),
        }));
        return;
      }

      let y = LIST_TOP;
      for (let i = 0; i < config.options.length; i++) {
        this.renderOptionRow(y, config.options[i], config.storageKey);
        y += ROW_HEIGHT + ROW_GAP;
      }

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: px(y),
        w: px(4),
        h: px(64),
        color: COLORS.BACKGROUND,
      }));
    },

    renderOptionRow(y, option, storageKey) {
      const isSelected = this.ctrl.state.currentValue === option.value;

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(ROW_HEIGHT),
        radius: px(ROW_RADIUS),
        color: COLORS.CARD,
      }));

      const rtl = isRTL();
      const iconSize = 22;
      const iconX = rtl ? SIDE_MARGIN + 10 : SIDE_MARGIN + CONTENT_W - 32;
      const textX = rtl ? SIDE_MARGIN + 40 : SIDE_MARGIN + 20;

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(textX),
        y: px(y),
        w: px(CONTENT_W - 56),
        h: px(ROW_HEIGHT),
        color: isSelected ? COLORS.ACCENT : COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.BODY_LG),
        align_h: rtl ? hmUI.align.RIGHT : hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: option.label,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(iconX),
        y: px(y + (ROW_HEIGHT - iconSize) / 2),
        w: px(iconSize),
        h: px(iconSize),
        src: isSelected ? "image/ic_radio_on.png" : "image/ic_radio_off.png",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(ROW_HEIGHT),
        normal_src: "image/ic_transparent.png",
        press_src: "image/ic_transparent.png",
        click_func: () => this.ctrl.selectOption(storageKey, option.value),
      }));
    },

    trackWidget(id) {
      if (!this._widgetIds) this._widgetIds = [];
      this._widgetIds.push(id);
      return id;
    },

    destroyWidgets() {
      if (!this._widgetIds) {
        this._widgetIds = [];
        return;
      }
      for (let i = 0; i < this._widgetIds.length; i++) {
        try { hmUI.deleteWidget(this._widgetIds[i]); } catch (e) {}
      }
      this._widgetIds = [];
    },

    rebuild() {
      this.destroyWidgets();
      this.build();
    },
  })
);
