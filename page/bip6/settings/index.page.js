import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { setScrollMode, SCROLL_MODE_FREE } from "@zos/page";
import { setPageBrightTime } from "@zos/display";
import { COLORS, FONT_SIZES } from "../../../lib/theme";
import { createSettingsController, methodLabel, highLatLabel, reminderOffsetLabel, hijriOffsetLabel } from "../../../lib/controllers/settings-controller";
import { getLocation } from "../../../shared/storage";
import { requestAndStoreLocation } from "../../../lib/location";
import { isRTL, t } from "../../../lib/i18n";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

const STATUS_BAR_RESERVE = 40;
const SIDE_MARGIN = 16;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;
const HEADER_Y = STATUS_BAR_RESERVE + 8;
const LIST_TOP = STATUS_BAR_RESERVE + 64;
const CARD_PAD = 20;
const NAV_CARD_HEIGHT = 80;
const MADHAB_HEIGHT = 112;
const CARD_RADIUS = 18;
const CARD_GAP = 10;
const CHEVRON_SIZE = 14;

Page(
  BasePage({
    onInit() {
      try { setScrollMode({ mode: SCROLL_MODE_FREE }); } catch (e) {}
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      // Keep the screen lit ~30s so the system screen-off timer doesn't dismiss
      // the app mid-adjustment.
      try { setPageBrightTime({ brightTime: 30000 }); } catch (e) {}

      const self = this;
      this.ctrl = createSettingsController(() => {
        if (self._widgetIds) self.rebuild();
      });
      this.ctrl.onInit();
    },

    onResume() {
      if (this.ctrl) this.ctrl.onResume();
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

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(HEADER_Y + 4),
        w: px(CONTENT_W),
        h: px(36),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.HEADLINE),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: t("settings"),
      }));

      const s = this.ctrl.state.settings;
      if (!s) return;

      let y = LIST_TOP;

      const loc = getLocation();
      const cityLabel = this._locating
        ? t("updating")
        : ((loc && loc.city) ? loc.city : "—");
      y = this.renderNavRow(y, t("update_location"), cityLabel, () => this.updateLocation());

      y = this.renderNavRow(y, t("calc_method"), methodLabel(s.method), () => this.openPicker("method"));

      y = this.renderToggleCard(y, t("asr_madhab"), [
        { label: t("standard"), selected: s.madhab === "standard", value: "standard" },
        { label: t("hanafi"), selected: s.madhab === "hanafi", value: "hanafi" },
      ], (value) => {
        if (s.madhab === value) return;
        this.ctrl.updateSetting({ madhab: value });
      });

      y = this.renderNavRow(y, t("high_lat_rule"), highLatLabel(s.highLatRule), () => this.openPicker("highLatRule"));
      y = this.renderNavRow(y, t("reminder_offset"), reminderOffsetLabel(s.reminderOffsetMin), () => this.openPicker("reminderOffset"));
      y = this.renderNavRow(y, t("hijri_adjust"), hijriOffsetLabel(s.hijriOffsetDays), () => this.openPicker("hijriOffset"));

      y = this.renderToggleCard(y, t("time_format"), [
        { label: t("12h"), selected: s.timeFormat === "12h", value: "12h" },
        { label: t("24h"), selected: s.timeFormat === "24h", value: "24h" },
      ], (value) => {
        if (s.timeFormat === value) return;
        this.ctrl.updateSetting({ timeFormat: value });
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

    updateLocation() {
      if (this._locating) return;
      this._locating = true;
      this.rebuild();
      const self = this;
      requestAndStoreLocation((req) => self.request(req))
        .then(() => {
          self._locating = false;
          if (self._widgetIds) self.rebuild();
        })
        .catch(() => {
          self._locating = false;
          if (self._widgetIds) self.rebuild();
        });
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
      const rtl = isRTL();
      const chevronX = rtl ? SIDE_MARGIN + CARD_PAD : SIDE_MARGIN + CONTENT_W - CARD_PAD - CHEVRON_SIZE;
      const textX = rtl ? SIDE_MARGIN + CARD_PAD + CHEVRON_SIZE + 8 : SIDE_MARGIN + CARD_PAD;
      const textAlign = rtl ? hmUI.align.RIGHT : hmUI.align.LEFT;

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(textX),
        y: px(y + 14),
        w: px(innerW),
        h: px(26),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: textAlign,
        align_v: hmUI.align.CENTER_V,
        text: label,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(textX),
        y: px(y + 42),
        w: px(innerW),
        h: px(28),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.BODY_LG),
        align_h: textAlign,
        align_v: hmUI.align.CENTER_V,
        text: valueText,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(chevronX),
        y: px(y + (NAV_CARD_HEIGHT - CHEVRON_SIZE) / 2),
        w: px(CHEVRON_SIZE),
        h: px(CHEVRON_SIZE),
        src: "image/ic_chevron.png",
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(SIDE_MARGIN),
        y: px(y),
        w: px(CONTENT_W),
        h: px(NAV_CARD_HEIGHT),
        normal_src: "image/ic_transparent.png",
        press_src: "image/ic_transparent.png",
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
        align_h: isRTL() ? hmUI.align.RIGHT : hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: title,
      }));

      const segY = y + 48;
      const segH = 48;
      const segGap = 6;
      const segW = (CONTENT_W - 2 * CARD_PAD - segGap) / 2;
      const rtl = isRTL();
      const segX1 = rtl ? SIDE_MARGIN + CARD_PAD + segW + segGap : SIDE_MARGIN + CARD_PAD;
      const segX2 = rtl ? SIDE_MARGIN + CARD_PAD : segX1 + segW + segGap;
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
        normal_src: "image/ic_transparent.png",
        press_src: "image/ic_transparent.png",
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
