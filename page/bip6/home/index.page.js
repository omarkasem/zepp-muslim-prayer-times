import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { getLocation, setLocation, getSettings } from "../../../shared/storage";
import { computePrayerTimes } from "../../../shared/prayer-times";
import { toHijri } from "../../../shared/hijri";
import { COLORS, FONT_SIZES } from "../../../lib/theme";
import { applyReminders } from "../../../lib/reminders";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();
const DESIGN_WIDTH = 390;

const PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

// Bip 6 is 390x450 rectangular. Reserve the top for the system status bar
// (best-effort hide via hmUI.setStatusBarVisible(false) in onInit; if it stays
// visible, the reserve prevents content from sitting under it).
const STATUS_BAR_RESERVE = 40;
const SIDE_MARGIN = 16;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;
const NAV_HEIGHT = 60;
const NAV_Y = DEVICE_HEIGHT - NAV_HEIGHT - 10;
const LIST_TOP = 110 + STATUS_BAR_RESERVE;
const LIST_BOTTOM = NAV_Y - 10;
const LIST_HEIGHT = LIST_BOTTOM - LIST_TOP;
const ROW_HEIGHT_INACTIVE = 40;
const PILL_HEIGHT = 64;
const PILL_X = SIDE_MARGIN;
const PILL_W = CONTENT_W;
const PILL_RADIUS = 24;

function formatTime(epochMs, timeFormat) {
  const d = new Date(epochMs);
  const h24 = d.getHours();
  const m = d.getMinutes();
  const mm = m < 10 ? "0" + m : "" + m;
  if (timeFormat === "24h") {
    return h24 + ":" + mm;
  }
  const ampm = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return h12 + ":" + mm + " " + ampm;
}

function formatCountdown(ms) {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin - h * 60;
  if (h > 0) return "Next in " + h + "h " + m + "m";
  return "Next in " + m + "m";
}

function tomorrowDate(now) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

Page(
  BasePage({
    state: {
      phase: "loading",
      location: null,
      times: null,
      tomorrowFajr: null,
      nextIndex: -1,
      isTomorrow: false,
      countdownText: "",
      timeFormat: "12h",
    },

    onInit() {
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      this._firstBuild = true;
      const cached = getLocation();
      if (cached) {
        this.state.location = cached;
        if (this.prepareReadyStateFromLocation()) {
          this.state.phase = "ready";
        } else {
          this.state.phase = "unavailable";
        }
      } else {
        this.state.phase = "loading";
        this.fetchLocation();
      }
    },

    onResume() {
      this.stopCountdownTimer();
      if (this._firstBuild) {
        this._firstBuild = false;
        if (this.state.phase === "ready") {
          this.recomputeNext();
          this.startCountdownTimer();
        }
        return;
      }
      if (this.state.phase === "ready" && this.state.location) {
        if (this.prepareReadyStateFromLocation()) {
          this.destroyWidgets();
          this.build();
          this.recomputeNext();
          this.startCountdownTimer();
        }
      }
    },

    onPause() {
      this.stopCountdownTimer();
    },

    onDestroy() {
      this.stopCountdownTimer();
    },

    fetchLocation() {
      const self = this;
      this.request({
        method: "GET_LOCATION",
        params: {},
      })
        .then((loc) => {
          if (loc && typeof loc.lat === "number" && typeof loc.lon === "number" && loc.timezone) {
            try {
              setLocation(loc);
              self.state.location = loc;
              if (self.prepareReadyStateFromLocation()) {
                self.state.phase = "ready";
                self.destroyWidgets();
                self.build();
                self.recomputeNext();
                self.startCountdownTimer();
                try { applyReminders(); } catch (e) {}
              } else {
                self.renderUnavailable();
              }
            } catch (e) {
              self.renderUnavailable();
            }
          } else {
            self.renderUnavailable();
          }
        })
        .catch(() => {
          self.renderUnavailable();
        });
    },

    prepareReadyStateFromLocation() {
      const loc = this.state.location;
      if (!loc) return false;
      const settings = getSettings();
      this.state.timeFormat = settings.timeFormat;
      const now = new Date();
      let times;
      try {
        times = computePrayerTimes({
          lat: loc.lat,
          lon: loc.lon,
          timezone: loc.timezone,
          date: now,
          method: settings.method,
          madhab: settings.madhab,
          highLatRule: settings.highLatRule,
        });
      } catch (e) {
        return false;
      }
      let tomorrowFajr = null;
      try {
        const tom = computePrayerTimes({
          lat: loc.lat,
          lon: loc.lon,
          timezone: loc.timezone,
          date: tomorrowDate(now),
          method: settings.method,
          madhab: settings.madhab,
          highLatRule: settings.highLatRule,
        });
        tomorrowFajr = tom.fajr;
      } catch (e) {
        tomorrowFajr = null;
      }
      this.state.times = times;
      this.state.tomorrowFajr = tomorrowFajr;
      this.state.nextIndex = -1;
      this.state.isTomorrow = false;
      this.state.countdownText = "";
      return true;
    },

    renderUnavailable() {
      this.state.phase = "unavailable";
      this.destroyWidgets();
      this.build();
    },

    recomputeNext() {
      const t = this.state.times;
      if (!t) return;
      const now = Date.now();
      const instants = PRAYERS.map((p) => t[p.key]);
      let nextIdx = -1;
      for (let i = 0; i < instants.length; i++) {
        if (instants[i] > now) {
          nextIdx = i;
          break;
        }
      }
      if (nextIdx === -1) {
        nextIdx = 0;
        this.state.isTomorrow = true;
        this.state.countdownText = "Tomorrow";
      } else {
        this.state.isTomorrow = false;
        this.state.countdownText = formatCountdown(instants[nextIdx] - now);
      }
      this.state.nextIndex = nextIdx;
      this.updateNextRow();
    },

    startCountdownTimer() {
      this.stopCountdownTimer();
      const self = this;
      // NOTE: global setInterval/clearInterval are in @zeppos/device-types v3
      // runtime. Verify on-device per review-fixes-steps-1-3.md Fix 4 / Steps
      // 4-5 Fix 4. If the countdown does NOT tick, swap to @zos/timer
      // createSysTimer (v4 only — would require bumping apiVersion.target).
      this._timer = setInterval(function () {
        if (self.state.phase !== "ready") return;
        self.recomputeNext();
      }, 60000);
    },

    stopCountdownTimer() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    },

    trackWidget(id) {
      if (!this._widgetIds) this._widgetIds = [];
      this._widgetIds.push(id);
      return id;
    },

    destroyWidgets() {
      if (!this._widgetIds) {
        this._widgetIds = [];
        this._rowWidgets = [];
        return;
      }
      for (let i = 0; i < this._widgetIds.length; i++) {
        try { hmUI.deleteWidget(this._widgetIds[i]); } catch (e) {}
      }
      this._widgetIds = [];
      this._rowWidgets = [];
    },

    build() {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        color: COLORS.BACKGROUND,
      }));

      const phase = this.state.phase;

      if (phase === "loading") {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(SIDE_MARGIN),
          y: px(STATUS_BAR_RESERVE + 40),
          w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
          h: px(40),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.BODY_LG),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: "Getting location…",
        }));
        this.renderBottomNav();
        return;
      }

      if (phase === "unavailable") {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(SIDE_MARGIN),
          y: px(STATUS_BAR_RESERVE + 40),
          w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
          h: px(40),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.BODY_LG),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.WRAP,
          text: "Location unavailable",
        }));
        this.renderBottomNav();
        return;
      }

      const loc = this.state.location;
      const city = (loc && loc.city) ? loc.city : "—";
      const today = new Date();
      const hijri = toHijri(today);
      const hijriText = (hijri.day + " " + hijri.monthName + " " + hijri.year).toUpperCase();

      const cityY = STATUS_BAR_RESERVE + 18;
      const cityIconSize = 22;
      const cityTextW = 200;
      const cityGroupW = cityIconSize + 8 + cityTextW;
      const cityX = (DESIGN_WIDTH - cityGroupW) / 2;
      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(cityX),
        y: px(cityY),
        w: px(cityIconSize),
        h: px(cityIconSize),
        src: "ic_pin.png",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(cityX + cityIconSize + 8),
        y: px(cityY - 2),
        w: px(cityTextW),
        h: px(cityIconSize + 4),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: city,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(cityY + 32),
        w: DEVICE_WIDTH - px(2 * SIDE_MARGIN),
        h: px(24),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.SMALL),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        char_space: 1,
        text: hijriText,
      }));

      const times = this.state.times;
      const tf = this.state.timeFormat;
      this._rowWidgets = [];
      const step = LIST_HEIGHT / (PRAYERS.length - 1);
      for (let i = 0; i < PRAYERS.length; i++) {
        const y = Math.round(LIST_TOP + i * step);
        const prayer = PRAYERS[i];
        const isActive = (i === this.state.nextIndex);
        const instant = isActive && this.state.isTomorrow && this.state.tomorrowFajr
          ? this.state.tomorrowFajr
          : times[prayer.key];
        const timeStr = formatTime(instant, tf);

        const rowH = ROW_HEIGHT_INACTIVE;

        const pillId = this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: px(PILL_X),
          y: px(y - PILL_HEIGHT / 2),
          w: px(PILL_W),
          h: px(isActive ? PILL_HEIGHT : rowH),
          radius: px(isActive ? PILL_RADIUS : 0),
          color: isActive ? COLORS.NEXT_PRAYER_PILL : COLORS.BACKGROUND,
        }));

        const labelColor = isActive ? COLORS.NEXT_PRAYER_TEXT : COLORS.TEXT_INACTIVE;
        const timeColor = isActive ? COLORS.NEXT_PRAYER_TEXT : COLORS.TEXT_INACTIVE;
        const labelSize = isActive ? FONT_SIZES.LABEL_SM : FONT_SIZES.BODY_LG;
        const timeSize = isActive ? FONT_SIZES.HEADLINE_MD : FONT_SIZES.BODY_LG;

        const labelId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(SIDE_MARGIN + 20),
          y: px(y - (isActive ? 14 : rowH / 2)),
          w: px(120),
          h: px(isActive ? 24 : rowH),
          color: labelColor,
          text_size: px(labelSize),
          align_v: hmUI.align.CENTER_V,
          text: prayer.label,
        }));

        const timeId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(DEVICE_WIDTH - SIDE_MARGIN - 160 - 20),
          y: px(y - (isActive ? 18 : rowH / 2)),
          w: px(160),
          h: px(isActive ? 32 : rowH),
          color: timeColor,
          text_size: px(timeSize),
          align_h: hmUI.align.RIGHT,
          align_v: hmUI.align.CENTER_V,
          text: timeStr,
        }));

        let countdownId = -1;
        if (isActive) {
          countdownId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + 20),
            y: px(y + 14),
            w: px(220),
            h: px(20),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.SMALL),
            align_v: hmUI.align.CENTER_V,
            text: this.state.countdownText,
          }));
        }

        this._rowWidgets.push({ pillId, labelId, timeId, countdownId, index: i, y });
      }

      this.renderBottomNav();
    },

    updateNextRow() {
      if (!this._rowWidgets) return;
      const nextIndex = this.state.nextIndex;
      const tf = this.state.timeFormat;
      for (let i = 0; i < this._rowWidgets.length; i++) {
        const w = this._rowWidgets[i];
        const isActive = (i === nextIndex);
        const instant = isActive && this.state.isTomorrow && this.state.tomorrowFajr
          ? this.state.tomorrowFajr
          : this.state.times[PRAYERS[i].key];
        const timeStr = formatTime(instant, tf);
        hmUI.updateWidget(w.pillId, hmUI.widget.FILL_RECT, {
          x: px(PILL_X),
          y: px(w.y - PILL_HEIGHT / 2),
          w: px(PILL_W),
          h: px(isActive ? PILL_HEIGHT : ROW_HEIGHT_INACTIVE),
          radius: px(isActive ? PILL_RADIUS : 0),
          color: isActive ? COLORS.NEXT_PRAYER_PILL : COLORS.BACKGROUND,
        });
        const labelColor = isActive ? COLORS.NEXT_PRAYER_TEXT : COLORS.TEXT_INACTIVE;
        const timeColor = isActive ? COLORS.NEXT_PRAYER_TEXT : COLORS.TEXT_INACTIVE;
        const labelSize = isActive ? FONT_SIZES.LABEL_SM : FONT_SIZES.BODY_LG;
        const timeSize = isActive ? FONT_SIZES.HEADLINE_MD : FONT_SIZES.BODY_LG;
        hmUI.updateWidget(w.labelId, hmUI.widget.TEXT, {
          x: px(SIDE_MARGIN + 20),
          y: px(w.y - (isActive ? 14 : ROW_HEIGHT_INACTIVE / 2)),
          w: px(120),
          h: px(isActive ? 24 : ROW_HEIGHT_INACTIVE),
          color: labelColor,
          text_size: px(labelSize),
          align_v: hmUI.align.CENTER_V,
          text: PRAYERS[i].label,
        });
        hmUI.updateWidget(w.timeId, hmUI.widget.TEXT, {
          x: px(DEVICE_WIDTH - SIDE_MARGIN - 160 - 20),
          y: px(w.y - (isActive ? 18 : ROW_HEIGHT_INACTIVE / 2)),
          w: px(160),
          h: px(isActive ? 32 : ROW_HEIGHT_INACTIVE),
          color: timeColor,
          text_size: px(timeSize),
          align_h: hmUI.align.RIGHT,
          align_v: hmUI.align.CENTER_V,
          text: timeStr,
        });
        if (w.countdownId !== -1) {
          hmUI.updateWidget(w.countdownId, hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + 20),
            y: px(w.y + 14),
            w: px(220),
            h: px(20),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.SMALL),
            align_v: hmUI.align.CENTER_V,
            text: this.state.countdownText,
          });
        }
        if (isActive && w.countdownId === -1) {
          w.countdownId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + 20),
            y: px(w.y + 14),
            w: px(220),
            h: px(20),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.SMALL),
            align_v: hmUI.align.CENTER_V,
            text: this.state.countdownText,
          }));
        } else if (!isActive && w.countdownId !== -1) {
          hmUI.deleteWidget(w.countdownId);
          w.countdownId = -1;
        }
      }
    },

    renderBottomNav() {
      const btnW = 170;
      const btnH = NAV_HEIGHT;
      const gap = 12;
      const totalW = btnW * 2 + gap;
      const startX = (DEVICE_WIDTH - totalW) / 2;

      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(startX),
        y: px(NAV_Y),
        w: px(btnW),
        h: px(btnH),
        radius: px(btnH / 2),
        color: COLORS.CARD,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(startX + 16),
        y: px(NAV_Y + (btnH - 28) / 2),
        w: px(28),
        h: px(28),
        src: "ic_compass.png",
        color: COLORS.ACCENT_DEEP,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(startX + 52),
        y: px(NAV_Y),
        w: px(btnW - 60),
        h: px(btnH),
        color: COLORS.ACCENT_DEEP,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: "Qibla",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(startX),
        y: px(NAV_Y),
        w: px(btnW),
        h: px(btnH),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: () => {
          push({ url: "page/bip6/qibla/index.page", params: {} });
        },
      }));

      const gearX = startX + btnW + gap;
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(gearX),
        y: px(NAV_Y),
        w: px(btnW),
        h: px(btnH),
        radius: px(btnH / 2),
        color: COLORS.CARD,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(gearX + 16),
        y: px(NAV_Y + (btnH - 28) / 2),
        w: px(28),
        h: px(28),
        src: "ic_gear.png",
        color: COLORS.TEXT_MUTED,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(gearX + 52),
        y: px(NAV_Y),
        w: px(btnW - 60),
        h: px(btnH),
        color: COLORS.TEXT_PRIMARY,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: "Settings",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(gearX),
        y: px(NAV_Y),
        w: px(btnW),
        h: px(btnH),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: () => {
          push({ url: "page/bip6/settings/index.page", params: {} });
        },
      }));
    },
  })
);
