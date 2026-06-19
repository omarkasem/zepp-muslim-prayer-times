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

const PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

function prayerLabel(prayer, date) {
  if (prayer.key === "dhuhr" && date.getDay() === 5) return "Jumu'ah";
  return prayer.label;
}

// For gt targets (designWidth: 480), round or square.
// We use a larger side margin to avoid the curved edges of gt.r.
const SIDE_MARGIN = 32;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;

// Header
const CITY_Y = 40;
const CITY_H = 32;
const HIJRI_Y = CITY_Y + CITY_H + 6;
const HIJRI_H = 26;

// Bottom nav
const NAV_H = 64;
const NAV_Y = DEVICE_HEIGHT - NAV_H - 30;

// Prayer list region
const LIST_TOP = 140;
const LIST_BOTTOM = NAV_Y - 30;
const LIST_HEIGHT = LIST_BOTTOM - LIST_TOP;
const ROW_HEIGHT_INACTIVE = 46;
const PILL_HEIGHT = 64;
const PILL_RADIUS = 32;
const ROW_INDENT = 24;

function estTextW(str, size) {
  return Math.ceil((str ? str.length : 0) * size * 0.56);
}

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

function formatCountdown(label, ms) {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin - h * 60;
  if (h > 0) return label + " in " + h + "h " + m + "m";
  return label + " in " + m + "m";
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
      currentIndex: -1,
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
          this.computeNext();
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
          this.startCountdownTimer();
        }
        try { applyReminders(); } catch (e) {}
        return;
      }
      if (this.state.phase === "ready" && this.state.location) {
        if (this.prepareReadyStateFromLocation()) {
          this.computeNext();
          this.destroyWidgets();
          this.build();
          this.startCountdownTimer();
        }
      }
      try { applyReminders(); } catch (e) {}
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
                self.computeNext();
                self.state.phase = "ready";
                self.destroyWidgets();
                self.build();
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
      this.state.currentIndex = -1;
      this.state.countdownText = "";
      return true;
    },

    renderUnavailable() {
      this.state.phase = "unavailable";
      this.destroyWidgets();
      this.build();
    },

    computeNext() {
      const t = this.state.times;
      if (!t) return false;
      const now = Date.now();
      const instants = PRAYERS.map((p) => t[p.key]);
      const last = PRAYERS.length - 1;
      const prevIndex = this.state.currentIndex;

      let currentIdx;
      let nextInstant;
      let nextPrayerIdx;
      let nextLabelDate;

      if (now < instants[0]) {
        currentIdx = last;            
        nextPrayerIdx = 0;            
        nextInstant = instants[0];
        nextLabelDate = new Date();
      } else {
        currentIdx = 0;
        for (let i = 0; i < instants.length; i++) {
          if (instants[i] <= now) currentIdx = i;
        }
        if (currentIdx >= last) {
          nextPrayerIdx = 0;
          nextInstant = this.state.tomorrowFajr || instants[0];
          nextLabelDate = tomorrowDate(now);
        } else {
          nextPrayerIdx = currentIdx + 1;
          nextInstant = instants[nextPrayerIdx];
          nextLabelDate = new Date();
        }
      }

      const nextLabel = prayerLabel(PRAYERS[nextPrayerIdx], nextLabelDate);
      this.state.currentIndex = currentIdx;
      this.state.countdownText = formatCountdown(nextLabel, nextInstant - now);
      return prevIndex !== currentIdx;
    },

    startCountdownTimer() {
      this.stopCountdownTimer();
      const self = this;
      this._timer = setInterval(function () {
        if (self.state.phase !== "ready") return;
        const changed = self.computeNext();
        if (changed) {
          self.destroyWidgets();
          self.build();
        } else {
          self.updateCountdown();
        }
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
      this._countdownId = -1;
      if (!this._widgetIds) {
        this._widgetIds = [];
        return;
      }
      for (let i = 0; i < this._widgetIds.length; i++) {
        try { hmUI.deleteWidget(this._widgetIds[i]); } catch (e) {}
      }
      this._widgetIds = [];
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

      if (phase === "loading" || phase === "unavailable") {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(SIDE_MARGIN),
          y: px(180),
          w: px(CONTENT_W),
          h: px(60),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.BODY_LG),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.WRAP,
          text: phase === "loading" ? "Getting location…" : "Location unavailable",
        }));
        this.renderBottomNav();
        return;
      }

      this.renderHeader();
      this.renderList();
      this.renderBottomNav();
    },

    renderHeader() {
      const loc = this.state.location;
      const city = (loc && loc.city) ? loc.city : "—";
      const today = new Date();
      const hijri = toHijri(today);
      const hijriText = (hijri.day + " " + hijri.monthName + " " + hijri.year).toUpperCase();

      const iconSize = 30; // 24 * 1.23 ~ 30
      const gap = 10;
      const textW = Math.min(estTextW(city, FONT_SIZES.LABEL_SM), CONTENT_W - iconSize - gap);
      const groupW = iconSize + gap + textW;
      const groupX = Math.round((DEVICE_WIDTH - groupW) / 2);

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(groupX),
        y: px(CITY_Y + (CITY_H - iconSize) / 2),
        w: px(iconSize),
        h: px(iconSize),
        src: "image/ic_pin.png",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(groupX + iconSize + gap),
        y: px(CITY_Y),
        w: px(textW),
        h: px(CITY_H),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: city,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(HIJRI_Y),
        w: px(CONTENT_W),
        h: px(HIJRI_H),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.SMALL),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        char_space: 1,
        text: hijriText,
      }));
    },

    renderList() {
      const times = this.state.times;
      const tf = this.state.timeFormat;
      const step = LIST_HEIGHT / (PRAYERS.length - 1);
      this._countdownId = -1;

      for (let i = 0; i < PRAYERS.length; i++) {
        const y = Math.round(LIST_TOP + i * step);
        const prayer = PRAYERS[i];
        const isActive = (i === this.state.currentIndex);
        const timeStr = formatTime(times[prayer.key], tf);
        const label = prayerLabel(prayer, new Date());

        if (isActive) {
          this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: px(SIDE_MARGIN),
            y: px(y - PILL_HEIGHT / 2),
            w: px(CONTENT_W),
            h: px(PILL_HEIGHT),
            radius: px(PILL_RADIUS),
            color: COLORS.NEXT_PRAYER_PILL,
          }));
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + ROW_INDENT),
            y: px(y - 20),
            w: px(200),
            h: px(24),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.LABEL_SM),
            align_v: hmUI.align.CENTER_V,
            text: label,
          }));
          this._countdownId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + ROW_INDENT),
            y: px(y + 6),
            w: px(200),
            h: px(20),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.SMALL),
            align_v: hmUI.align.CENTER_V,
            text: this.state.countdownText,
          }));
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(DEVICE_WIDTH - SIDE_MARGIN - ROW_INDENT - 180),
            y: px(y - PILL_HEIGHT / 2),
            w: px(180),
            h: px(PILL_HEIGHT),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.HEADLINE_MD),
            align_h: hmUI.align.RIGHT,
            align_v: hmUI.align.CENTER_V,
            text: timeStr,
          }));
        } else {
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + ROW_INDENT),
            y: px(y - ROW_HEIGHT_INACTIVE / 2),
            w: px(180),
            h: px(ROW_HEIGHT_INACTIVE),
            color: COLORS.TEXT_INACTIVE,
            text_size: px(FONT_SIZES.BODY_LG),
            align_v: hmUI.align.CENTER_V,
            text: label,
          }));
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(DEVICE_WIDTH - SIDE_MARGIN - ROW_INDENT - 180),
            y: px(y - ROW_HEIGHT_INACTIVE / 2),
            w: px(180),
            h: px(ROW_HEIGHT_INACTIVE),
            color: COLORS.TEXT_INACTIVE,
            text_size: px(FONT_SIZES.BODY_LG),
            align_h: hmUI.align.RIGHT,
            align_v: hmUI.align.CENTER_V,
            text: timeStr,
          }));
        }
      }
    },

    updateCountdown() {
      if (this._countdownId && this._countdownId !== -1) {
        hmUI.updateWidget(this._countdownId, hmUI.widget.TEXT, {
          text: this.state.countdownText,
        });
      }
    },

    renderBottomNav() {
      const gap = 16;
      const btnW = Math.floor((CONTENT_W - gap) / 2);
      const startX = SIDE_MARGIN;
      const iconSize = 25;

      this.renderNavButton(
        startX, btnW, iconSize,
        "image/ic_compass.png", COLORS.ACCENT_DEEP,
        "Qibla", COLORS.ACCENT,
        () => push({ url: "page/gt/qibla/index.page", params: {} })
      );

      this.renderNavButton(
        startX + btnW + gap, btnW, iconSize,
        "image/ic_gear.png", COLORS.TEXT_MUTED,
        "Settings", COLORS.TEXT_PRIMARY,
        () => push({ url: "page/gt/settings/index.page", params: {} })
      );
    },

    renderNavButton(x, w, iconSize, iconSrc, iconColor, label, labelColor, onTap) {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(x),
        y: px(NAV_Y),
        w: px(w),
        h: px(NAV_H),
        radius: px(NAV_H / 2),
        color: COLORS.CARD,
      }));
      const labelW = estTextW(label, FONT_SIZES.LABEL_SM);
      const innerGap = 8;
      const groupW = iconSize + innerGap + labelW;
      const groupX = x + Math.round((w - groupW) / 2);
      
      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(groupX),
        y: px(NAV_Y + (NAV_H - iconSize) / 2),
        w: px(iconSize),
        h: px(iconSize),
        src: iconSrc,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(groupX + iconSize + innerGap),
        y: px(NAV_Y),
        w: px(labelW + 8),
        h: px(NAV_H),
        color: labelColor,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: label,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(x),
        y: px(NAV_Y),
        w: px(w),
        h: px(NAV_H),
        normal_src: "image/ic_transparent.png",
        press_src: "image/ic_transparent.png",
        click_func: onTap,
      }));
    },
  })
);
