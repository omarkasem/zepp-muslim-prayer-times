import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push, back } from "@zos/router";
import { setScrollMode, SCROLL_MODE_FREE } from "@zos/page";
import { getSettings, setSettings } from "../../../shared/storage";
import { applyReminders } from "../../../lib/reminders";
import { COLORS, FONT_SIZES } from "../../../lib/theme";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

const STATUS_BAR_RESERVE = 40;
const SIDE_MARGIN = 16;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;
const HEADER_Y = STATUS_BAR_RESERVE + 8;
const LIST_TOP = STATUS_BAR_RESERVE + 64;
const CARD_PAD = 20;          // inner horizontal padding
const NAV_CARD_HEIGHT = 80;   // stacked label + value
const MADHAB_HEIGHT = 112;
const CARD_RADIUS = 18;
const CARD_GAP = 10;
const CHEVRON_SIZE = 14;

// Short, glanceable value labels. The canonical method names in methods.js are
// far too long for a watch row ("Egyptian General Authority of Survey"), so we
// show concise labels here.
const METHOD_SHORT_LABELS = {
  mwl: "Muslim World League",
  isna: "ISNA",
  egyptian: "Egyptian",
  umm_al_qura: "Umm al-Qura",
  karachi: "Karachi",
};

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

function methodLabel(id) {
  return METHOD_SHORT_LABELS[id] || "—";
}

function highLatLabel(id) {
  return HIGH_LAT_LABELS[id] || "—";
}

function reminderOffsetLabel(n) {
  const label = REMINDER_OFFSET_LABELS[n];
  return label != null ? label : "—";
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
        w: px(CONTENT_W),
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

      y = this.renderToggleCard(y, "Asr Madhab", [
        { label: "Standard", selected: s.madhab === "standard", value: "standard" },
        { label: "Hanafi", selected: s.madhab === "hanafi", value: "hanafi" },
      ], (value) => {
        if (s.madhab === value) return;
        setSettingAndReschedule({ madhab: value });
        this.state.settings = getSettings();
        this.rebuild();
      });

      y = this.renderNavRow(y, "High Latitude Rule", highLatLabel(s.highLatRule), () => this.openPicker("highLatRule"));
      y = this.renderNavRow(y, "Reminder Offset", reminderOffsetLabel(s.reminderOffsetMin), () => this.openPicker("reminderOffset"));

      y = this.renderToggleCard(y, "Time Format", [
        { label: "12h", selected: s.timeFormat === "12h", value: "12h" },
        { label: "24h", selected: s.timeFormat === "24h", value: "24h" },
      ], (value) => {
        if (s.timeFormat === value) return;
        setSettingAndReschedule({ timeFormat: value });
        this.state.settings = getSettings();
        this.rebuild();
      });

      // Bottom spacer so the last card clears the screen edge when scrolled.
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: px(y),
        w: px(4),
        h: px(24),
        color: COLORS.BACKGROUND,
      }));
    },

    openPicker(key) {
      push({ url: "page/bip6/settings-picker/index.page", params: { key: key } });
    },

    // Stacked card: muted label on top, accent value below, chevron on the
    // right. Each text line spans the full inner width so nothing marquees.
    renderNavRow(y, label, valueText, onTap) {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(NAV_CARD_HEIGHT),
        radius: px(CARD_RADIUS),
        color: COLORS.CARD,
      }));

      const innerW = CONTENT_W - 2 * CARD_PAD - CHEVRON_SIZE - 8;

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN + CARD_PAD),
        y: px(y + 14),
        w: px(innerW),
        h: px(26),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: label,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN + CARD_PAD),
        y: px(y + 42),
        w: px(innerW),
        h: px(28),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.BODY_LG),
        align_v: hmUI.align.CENTER_V,
        text: valueText,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(SIDE_MARGIN + CONTENT_W - CARD_PAD - CHEVRON_SIZE),
        y: px(y + (NAV_CARD_HEIGHT - CHEVRON_SIZE) / 2),
        w: px(CHEVRON_SIZE),
        h: px(CHEVRON_SIZE),
        src: "ic_chevron.png",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(NAV_CARD_HEIGHT),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: onTap,
      }));

      return y + NAV_CARD_HEIGHT + CARD_GAP;
    },

    // Card with a title + an inline two-segment toggle. `options` is a pair of
    // { label, selected, value }; onSelect(value) is called when a segment is
    // tapped. Used for both Asr Madhab and Time Format.
    renderToggleCard(y, title, options, onSelect) {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(MADHAB_HEIGHT),
        radius: px(CARD_RADIUS),
        color: COLORS.CARD,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN + CARD_PAD),
        y: px(y + 14),
        w: px(CONTENT_W - 2 * CARD_PAD),
        h: px(26),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: title,
      }));

      const segY = y + 48;
      const segH = 48;
      const segGap = 6;
      const segW = (CONTENT_W - 2 * CARD_PAD - segGap) / 2;
      const segX1 = SIDE_MARGIN + CARD_PAD;
      const segX2 = segX1 + segW + segGap;
      const segXs = [segX1, segX2];

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        this.renderSegment(segXs[i], segY, segW, segH, opt.label, opt.selected, () => {
          onSelect(opt.value);
        });
      }

      return y + MADHAB_HEIGHT + CARD_GAP;
    },

    renderSegment(x, segY, segW, segH, text, selected, onTap) {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(x),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        radius: px(segH / 2),
        color: selected ? COLORS.ACCENT : COLORS.BACKGROUND,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(x),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        color: selected ? COLORS.SEGMENT_SELECTED_TEXT : COLORS.PICKER_OPTION_INACTIVE,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: text,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(x),
        y: px(segY),
        w: px(segW),
        h: px(segH),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: onTap,
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
