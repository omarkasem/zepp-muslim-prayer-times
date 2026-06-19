import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push, back } from "@zos/router";
import { setScrollMode, SCROLL_MODE_FREE } from "@zos/page";
import { getSettings, setSettings } from "../../../shared/storage";
import { METHODS } from "../../../shared/methods";
import { applyReminders } from "../../../lib/reminders";
import { COLORS, FONT_SIZES } from "../../../lib/theme";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();
const DESIGN_WIDTH = 390;

const STATUS_BAR_RESERVE = 40;
const SIDE_MARGIN = 16;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;
const HEADER_Y = STATUS_BAR_RESERVE + 8;
const LIST_TOP = STATUS_BAR_RESERVE + 64;
const ROW_HEIGHT = 64;
const MADHAB_HEIGHT = 100;
const CARD_RADIUS = 16;
const CARD_GAP = 10;

const HIGH_LAT_LABELS = {
  none: "None",
  middle_of_night: "Middle of Night",
  one_seventh: "One-Seventh",
  angle_based: "Angle-Based",
};

const REMINDER_OFFSET_LABELS = {
  0: "At prayer time",
  5: "5 min",
  10: "10 min",
  15: "15 min",
  20: "20 min",
};

const TIME_FORMAT_LABELS = {
  "12h": "12-hour (AM/PM)",
  "24h": "24-hour",
};

function methodLabel(id) {
  const m = METHODS[id];
  return (m && m.name) ? m.name : "—";
}

function highLatLabel(id) {
  return HIGH_LAT_LABELS[id] || "—";
}

function reminderOffsetLabel(n) {
  const label = REMINDER_OFFSET_LABELS[n];
  return label != null ? label : "—";
}

function timeFormatLabel(v) {
  return TIME_FORMAT_LABELS[v] || "—";
}

function setSettingAndReschedule(patch) {
  const current = getSettings();
  const merged = Object.assign({}, current, patch);
  setSettings(merged);
  try { applyReminders(); } catch (e) {}
}

Page(
  BasePage({
    state: {
      settings: null,
    },

    onInit() {
      try { setScrollMode({ mode: SCROLL_MODE_FREE }); } catch (e) {}
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      this.state.settings = getSettings();
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
        y: px(HEADER_Y),
        w: px(40),
        h: px(40),
        normal_src: "ic_back.png",
        press_src: "ic_back.png",
        color: COLORS.ACCENT,
        click_func: () => {
          try { back(); } catch (e) {}
        },
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(HEADER_Y + 4),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(36),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.HEADLINE),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Settings",
      }));

      const s = this.state.settings;

      let y = LIST_TOP;
      y = this.renderNavRow(y, "Calculation Method", methodLabel(s.method), () => this.openPicker("method"));

      y = this.renderMadhabCard(y);

      y = this.renderNavRow(y, "High Latitude Rule", highLatLabel(s.highLatRule), () => this.openPicker("highLatRule"));

      y = this.renderNavRow(y, "Reminder Offset", reminderOffsetLabel(s.reminderOffsetMin), () => this.openPicker("reminderOffset"));

      y = this.renderNavRow(y, "Time Format", timeFormatLabel(s.timeFormat), () => this.openPicker("timeFormat"));
    },

    openPicker(key) {
      push({ url: "page/bip6/settings-picker/index.page", params: { key: key } });
    },

    renderNavRow(y, label, valueText, onTap) {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(ROW_HEIGHT),
        radius: px(CARD_RADIUS),
        color: COLORS.CARD,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN + 20),
        y: px(y),
        w: px(160),
        h: px(ROW_HEIGHT),
        color: COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.BODY_LG),
        align_v: hmUI.align.CENTER_V,
        text: label,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN + 180),
        y: px(y),
        w: px(CONTENT_W - 220),
        h: px(ROW_HEIGHT),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
        text: valueText,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(SIDE_MARGIN + CONTENT_W - 20),
        y: px(y + (ROW_HEIGHT - 18) / 2),
        w: px(12),
        h: px(12),
        src: "ic_chevron.png",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(ROW_HEIGHT),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: onTap,
      }));

      return y + ROW_HEIGHT + CARD_GAP;
    },

    renderMadhabCard(y) {
      const s = this.state.settings;

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(MADHAB_HEIGHT),
        radius: px(CARD_RADIUS),
        color: COLORS.CARD,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN + 20),
        y: px(y + 6),
        w: px(200),
        h: px(24),
        color: COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: "Asr Madhab",
      }));

      const segY = y + 36;
      const segH = 48;
      const segGap = 6;
      const segW = (CONTENT_W - 40 - segGap) / 2;
      const segX1 = SIDE_MARGIN + 20;
      const segX2 = segX1 + segW + segGap;

      const isStd = s.madhab === "standard";
      const isHan = s.madhab === "hanafi";

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(segX1),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        radius: px(segH / 2),
        color: isStd ? COLORS.ACCENT : COLORS.BACKGROUND,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(segX1),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        color: isStd ? COLORS.SEGMENT_SELECTED_TEXT : COLORS.PICKER_OPTION_INACTIVE,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Standard",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(segX1),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: () => {
          if (isStd) return;
          setSettingAndReschedule({ madhab: "standard" });
          this.state.settings = getSettings();
          this.rebuild();
        },
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(segX2),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        radius: px(segH / 2),
        color: isHan ? COLORS.ACCENT : COLORS.BACKGROUND,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(segX2),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        color: isHan ? COLORS.SEGMENT_SELECTED_TEXT : COLORS.PICKER_OPTION_INACTIVE,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Hanafi",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(segX2),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: () => {
          if (isHan) return;
          setSettingAndReschedule({ madhab: "hanafi" });
          this.state.settings = getSettings();
          this.rebuild();
        },
      }));

      return y + MADHAB_HEIGHT + CARD_GAP;
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
