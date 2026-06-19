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

const ROW_Y = [120, 152, 188, 248, 280];
const ROW_HEIGHT_INACTIVE = 28;
const PILL_HEIGHT = 48;
const PILL_X = 48;
const PILL_W = 294;
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
      this.build();
      const cached = getLocation();
      if (cached) {
        this.state.location = cached;
        this.computeAndRender();
      } else {
        this.fetchLocation();
      }
    },

    onResume() {
      this.stopCountdownTimer();
      if (this.state.phase === "ready" && this.state.location) {
        const fresh = getSettings();
        this.state.timeFormat = fresh.timeFormat;
        const loc = this.state.location;
        let times;
        try {
          times = computePrayerTimes({
            lat: loc.lat,
            lon: loc.lon,
            timezone: loc.timezone,
            date: new Date(),
            method: fresh.method,
            madhab: fresh.madhab,
            highLatRule: fresh.highLatRule,
          });
        } catch (e) {
          return;
        }
        this.state.times = times;
        this.destroyWidgets();
        this.build();
        this.recomputeNext();
        this.startCountdownTimer();
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
              self.computeAndRender();
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

    computeAndRender() {
      const loc = this.state.location;
      if (!loc) {
        this.renderUnavailable();
        return;
      }
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
        this.renderUnavailable();
        return;
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
      this.state.phase = "ready";
      this.destroyWidgets();
      this.build();
      this.recomputeNext();
      this.startCountdownTimer();
      try {
        applyReminders();
      } catch (e) {}
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
      this._timer = setInterval(function () {
        if (self.state.phase !== "ready") return;
        self.recomputeNext();
      }, 60000);
    },
    // NOTE: global setInterval/clearInterval are in @zeppos/device-types v3
    // runtime. Verify on-device per review-fixes-steps-1-3.md Fix 4. If the
    // countdown does NOT tick, swap to @zos/timer createSysTimer (v4 only —
    // would require bumping apiVersion.target).

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
          x: px(20),
          y: (DEVICE_HEIGHT - px(40)) / 2,
          w: DEVICE_WIDTH - px(40),
          h: px(40),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.LABEL_SM),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: "Getting location…",
        }));
        this.renderBottomNav();
        return;
      }

      if (phase === "unavailable") {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(20),
          y: (DEVICE_HEIGHT - px(40)) / 2,
          w: DEVICE_WIDTH - px(40),
          h: px(40),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.LABEL_SM),
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

      const cityY = 58;
      const cityIconSize = 14;
      const cityTextW = px(140);
      const cityGroupW = cityIconSize + 6 + cityTextW;
      const cityX = (DESIGN_WIDTH - cityGroupW) / 2;
      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(cityX),
        y: px(cityY),
        w: px(cityIconSize),
        h: px(cityIconSize),
        src: "ic_pin.png",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(cityX + cityIconSize + 6),
        y: px(cityY - 2),
        w: cityTextW,
        h: px(20),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: city,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(80),
        w: DEVICE_WIDTH - px(40),
        h: px(14),
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
      for (let i = 0; i < PRAYERS.length; i++) {
        const y = ROW_Y[i];
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
        const labelSize = FONT_SIZES.LABEL_SM;
        const timeSize = isActive ? FONT_SIZES.HEADLINE_MD : FONT_SIZES.BODY_LG;

        const labelId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(60),
          y: px(y - (isActive ? 10 : rowH / 2)),
          w: px(120),
          h: px(isActive ? 18 : rowH),
          color: labelColor,
          text_size: px(labelSize),
          align_v: hmUI.align.CENTER_V,
          text: prayer.label,
        }));

        const timeId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(200),
          y: px(y - (isActive ? 12 : rowH / 2)),
          w: px(140),
          h: px(isActive ? 24 : rowH),
          color: timeColor,
          text_size: px(timeSize),
          align_h: hmUI.align.RIGHT,
          align_v: hmUI.align.CENTER_V,
          text: timeStr,
        }));

        let countdownId = -1;
        if (isActive) {
          countdownId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(60),
            y: px(y + 8),
            w: px(160),
            h: px(12),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.XSMALL),
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
        const labelSize = FONT_SIZES.LABEL_SM;
        const timeSize = isActive ? FONT_SIZES.HEADLINE_MD : FONT_SIZES.BODY_LG;
        hmUI.updateWidget(w.labelId, hmUI.widget.TEXT, {
          x: px(60),
          y: px(w.y - (isActive ? 10 : ROW_HEIGHT_INACTIVE / 2)),
          w: px(120),
          h: px(isActive ? 18 : ROW_HEIGHT_INACTIVE),
          color: labelColor,
          text_size: px(labelSize),
          align_v: hmUI.align.CENTER_V,
          text: PRAYERS[i].label,
        });
        hmUI.updateWidget(w.timeId, hmUI.widget.TEXT, {
          x: px(200),
          y: px(w.y - (isActive ? 12 : ROW_HEIGHT_INACTIVE / 2)),
          w: px(140),
          h: px(isActive ? 24 : ROW_HEIGHT_INACTIVE),
          color: timeColor,
          text_size: px(timeSize),
          align_h: hmUI.align.RIGHT,
          align_v: hmUI.align.CENTER_V,
          text: timeStr,
        });
        if (w.countdownId !== -1) {
          hmUI.updateWidget(w.countdownId, hmUI.widget.TEXT, {
            x: px(60),
            y: px(w.y + 8),
            w: px(160),
            h: px(12),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.XSMALL),
            align_v: hmUI.align.CENTER_V,
            text: this.state.countdownText,
          });
        }
        if (isActive && w.countdownId === -1) {
          w.countdownId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(60),
            y: px(w.y + 8),
            w: px(160),
            h: px(12),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.XSMALL),
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
      const iconSize = 20;
      const y = 332;
      const qiblaX = 168;
      const gearX = 202;
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(qiblaX),
        y: px(y),
        w: px(iconSize),
        h: px(iconSize),
        normal_src: "ic_compass.png",
        press_src: "ic_compass.png",
        color: COLORS.ACCENT_DEEP,
        click_func: () => {
          push({ url: "page/bip6/qibla/index.page", params: {} });
        },
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(gearX),
        y: px(y),
        w: px(iconSize),
        h: px(iconSize),
        normal_src: "ic_gear.png",
        press_src: "ic_gear.png",
        color: COLORS.TEXT_MUTED,
        click_func: () => {
          push({ url: "page/bip6/settings/index.page", params: {} });
        },
      }));
    },
  })
);
