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
const ROW_HEIGHT = 60;
const ROW_RADIUS = 16;
const ROW_GAP = 8;

const HIGH_LAT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "middle_of_night", label: "Middle of Night" },
  { value: "one_seventh", label: "One-Seventh" },
  { value: "angle_based", label: "Angle-Based" },
];

const REMINDER_OFFSET_OPTIONS = [
  { value: 0, label: "At prayer time" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
];

// Short, glanceable labels (the canonical METHODS names are far too long for a
// watch row). Keep in sync with METHOD_SHORT_LABELS in the settings page.
const METHOD_SHORT_LABELS = {
  mwl: "Muslim World League",
  isna: "ISNA",
  egyptian: "Egyptian",
  umm_al_qura: "Umm al-Qura",
  karachi: "Karachi",
};

function methodOptions() {
  const out = [];
  for (const id in METHODS) {
    if (METHODS[id] && METHODS[id].name) {
      out.push({ value: id, label: METHOD_SHORT_LABELS[id] || METHODS[id].name });
    }
  }
  return out;
}

function pickerConfig(key) {
  if (key === "method") {
    return { title: "Method", storageKey: "method", options: methodOptions() };
  }
  if (key === "highLatRule") {
    return { title: "High Latitude Rule", storageKey: "highLatRule", options: HIGH_LAT_OPTIONS };
  }
  if (key === "reminderOffset") {
    return { title: "Reminder Offset", storageKey: "reminderOffsetMin", options: REMINDER_OFFSET_OPTIONS };
  }
  return null;
}

function valuesEqual(a, b) {
  return a === b;
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
      key: null,
      config: null,
      currentValue: null,
    },

    onInit(p) {
      try { setScrollMode({ mode: SCROLL_MODE_FREE }); } catch (e) {}
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      let params = {};
      if (typeof p === "string") {
        try { params = JSON.parse(p) || {}; } catch (e) { params = {}; }
      } else if (p && typeof p === "object") {
        params = p;
      }
      if (this._options && this._options.params) {
        params = this._options.params;
      }
      const key = params.key;
      const config = pickerConfig(key);
      this.state.key = key;
      this.state.config = config;
      if (config) {
        const s = getSettings();
        this.state.currentValue = s[config.storageKey];
      }
    },

    onResume() {
      if (this.state.config) {
        const s = getSettings();
        this.state.currentValue = s[this.state.config.storageKey];
        this.rebuild();
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

      const config = this.state.config;
      const title = config ? config.title : "Settings";
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
          text: "Unknown setting",
        }));
        return;
      }

      for (let i = 0; i < config.options.length; i++) {
        this.renderOptionRow(LIST_TOP + i * (ROW_HEIGHT + ROW_GAP), config.options[i], config.storageKey);
      }
    },

    renderOptionRow(y, option, storageKey) {
      const isSelected = valuesEqual(this.state.currentValue, option.value);

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(ROW_HEIGHT),
        radius: px(ROW_RADIUS),
        color: COLORS.CARD,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN + 20),
        y: px(y),
        w: px(CONTENT_W - 56),
        h: px(ROW_HEIGHT),
        color: isSelected ? COLORS.ACCENT : COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.BODY_LG),
        align_v: hmUI.align.CENTER_V,
        text: option.label,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(SIDE_MARGIN + CONTENT_W - 32),
        y: px(y + (ROW_HEIGHT - 22) / 2),
        w: px(22),
        h: px(22),
        src: isSelected ? "ic_radio_on.png" : "ic_radio_off.png",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(ROW_HEIGHT),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: () => this.selectOption(storageKey, option.value),
      }));
    },

    selectOption(storageKey, value) {
      if (valuesEqual(this.state.currentValue, value)) {
        try { back(); } catch (e) {}
        return;
      }
      const patch = {};
      patch[storageKey] = value;
      setSettingAndReschedule(patch);
      this.state.currentValue = value;
      try { back(); } catch (e) {}
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
