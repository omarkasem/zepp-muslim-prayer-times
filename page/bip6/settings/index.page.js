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

const CARD_X = 12;
const CARD_W = 366;
const CARD_RADIUS = 16;
const CARD_GAP = 8;

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

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(30),
        w: DEVICE_WIDTH - px(40),
        h: px(32),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.HEADLINE),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: "Settings",
      }));

      const s = this.state.settings;

      let y = 88;
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
        x: px(CARD_X),
        y: px(y),
        w: px(CARD_W),
        h: px(56),
        radius: px(CARD_RADIUS),
        color: COLORS.CARD,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(CARD_X + 24),
        y: px(y),
        w: px(200),
        h: px(56),
        color: COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.BODY_LG),
        align_v: hmUI.align.CENTER_V,
        text: label,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(CARD_X + 200),
        y: px(y),
        w: px(130),
        h: px(56),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
        text: valueText,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(CARD_X + CARD_W - 18),
        y: px(y + (56 - 10) / 2),
        w: px(10),
        h: px(10),
        src: "ic_chevron.png",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(CARD_X),
        y: px(y),
        w: px(CARD_W),
        h: px(56),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: onTap,
      }));

      return y + 56 + CARD_GAP;
    },

    renderMadhabCard(y) {
      const s = this.state.settings;

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(CARD_X),
        y: px(y),
        w: px(CARD_W),
        h: px(84),
        radius: px(CARD_RADIUS),
        color: COLORS.CARD,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(CARD_X + 24),
        y: px(y + 8),
        w: px(200),
        h: px(20),
        color: COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.BODY_LG),
        align_v: hmUI.align.CENTER_V,
        text: "Asr Madhab",
      }));

      const segY = y + 36;
      const segH = 36;
      const segGap = 4;
      const segW = (CARD_W - 48 - segGap) / 2;
      const segX1 = CARD_X + 24;
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

      return y + 84 + CARD_GAP;
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
